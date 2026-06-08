"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
} from "firebase/app";
import { auth } from "@/lib/firebase";
import { UserProfile, UserRole } from "@/types/shop";
import { getUserProfile, createUserProfile } from "@/lib/userProfiles";

const LOCAL_ADMIN_EMAIL = "admin@bodegaplus.local";
const LOCAL_ADMIN_PASSWORD = "admin123";
const LOCAL_ADMIN_SESSION_KEY = "bodegaplus.localAdminSession";
const LOCAL_ADMIN_PROFILE: UserProfile = {
  uid: "local-admin",
  email: LOCAL_ADMIN_EMAIL,
  nombre: "Administrador Local",
  rol: "admin",
  estado: "activo",
};
const LOCAL_ADMIN_USER = {
  uid: LOCAL_ADMIN_PROFILE.uid,
  email: LOCAL_ADMIN_PROFILE.email,
  displayName: LOCAL_ADMIN_PROFILE.nombre,
} as User;

function hasStoredLocalAdminSession() {
  return (
    typeof window !== "undefined" &&
    localStorage.getItem(LOCAL_ADMIN_SESSION_KEY) === "true"
  );
}

function getUserCreationApp(): FirebaseApp {
  const appName = "bodegaplus-user-creation";
  const existingApp = getApps().find((app) => app.name === appName);

  if (existingApp) {
    return getApp(appName);
  }

  return initializeApp(
    {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
      messagingSenderId:
        process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
    },
    appName
  );
}

interface AuthContextValue {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nombre: string, rol?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  isAdmin: () => boolean;
  isEmployee: () => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() =>
    hasStoredLocalAdminSession() ? LOCAL_ADMIN_USER : null
  );
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() =>
    hasStoredLocalAdminSession() ? LOCAL_ADMIN_PROFILE : null
  );
  const [loading, setLoading] = useState(() => !hasStoredLocalAdminSession());

  const loadFirebaseUserProfile = useCallback(async (firebaseUser: User) => {
    let profile = await getUserProfile(
      firebaseUser.uid,
      firebaseUser.email || undefined
    );

    if (!profile) {
      const newProfile = await createUserProfile(
        firebaseUser.uid,
        firebaseUser.email || "",
        firebaseUser.displayName || firebaseUser.email || "",
        "empleado"
      );
      profile = newProfile as UserProfile;
    }

    setUserProfile(profile);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (hasStoredLocalAdminSession()) {
        setLoading(false);
        return;
      }

      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          await loadFirebaseUserProfile(firebaseUser);
        } catch (error) {
          console.error("Error loading user profile:", error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [loadFirebaseUserProfile]);

  const login = useCallback(async (email: string, password: string) => {
    if (
      email.trim().toLowerCase() === LOCAL_ADMIN_EMAIL &&
      password === LOCAL_ADMIN_PASSWORD
    ) {
      localStorage.setItem(LOCAL_ADMIN_SESSION_KEY, "true");
      setUser(LOCAL_ADMIN_USER);
      setUserProfile(LOCAL_ADMIN_PROFILE);
      return;
    }

    localStorage.removeItem(LOCAL_ADMIN_SESSION_KEY);
    setLoading(true);

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      setUser(result.user);
      await loadFirebaseUserProfile(result.user);
    } finally {
      setLoading(false);
    }
  }, [loadFirebaseUserProfile]);

  const register = useCallback(async (email: string, password: string, nombre: string, rol: UserRole = "empleado") => {
    const creationAuth = getAuth(getUserCreationApp());
    const result = await createUserWithEmailAndPassword(creationAuth, email, password);
    await createUserProfile(result.user.uid, email, nombre, rol);
    await signOut(creationAuth);
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem(LOCAL_ADMIN_SESSION_KEY);
    setUser(null);
    setUserProfile(null);
    await signOut(auth);
  }, []);

  const hasRole = useCallback((role: UserRole) => {
    return userProfile?.rol === role;
  }, [userProfile?.rol]);

  const isAdmin = useCallback(() => {
    return userProfile?.rol === "admin";
  }, [userProfile?.rol]);

  const isEmployee = useCallback(() => {
    return userProfile?.rol === "empleado";
  }, [userProfile?.rol]);

  const value = useMemo(
    () => ({ user, userProfile, loading, login, register, logout, hasRole, isAdmin, isEmployee }),
    [user, userProfile, loading, login, register, logout, hasRole, isAdmin, isEmployee]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
