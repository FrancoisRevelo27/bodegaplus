import {
  collection,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { UserProfile, UserRole } from "@/types/shop";

const USERS_COLLECTION = "user_profiles";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function preferAdminProfile(current: UserProfile, next: UserProfile) {
  if (current.rol === "admin") {
    return current;
  }

  if (next.rol === "admin") {
    return next;
  }

  return current;
}

export async function createUserProfile(
  uid: string,
  email: string,
  nombre: string,
  rol: UserRole = "empleado"
) {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await setDoc(userRef, {
      uid,
      email: normalizeEmail(email),
      nombre,
      rol,
      estado: "activo",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return { uid, email: normalizeEmail(email), nombre, rol, estado: "activo" };
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
}

export async function getUserProfile(uid: string, email?: string): Promise<UserProfile | null> {
  try {
    const docSnap = await getDoc(doc(db, USERS_COLLECTION, uid));
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }

    const byUid = query(collection(db, USERS_COLLECTION), where("uid", "==", uid));
    const uidSnapshot = await getDocs(byUid);
    if (!uidSnapshot.empty) {
      const profiles = uidSnapshot.docs.map((doc) => doc.data() as UserProfile);
      return profiles.reduce(preferAdminProfile);
    }

    if (email) {
      const byEmail = query(
        collection(db, USERS_COLLECTION),
        where("email", "==", normalizeEmail(email))
      );
      const emailSnapshot = await getDocs(byEmail);

      if (!emailSnapshot.empty) {
        const profiles = emailSnapshot.docs.map((doc) => doc.data() as UserProfile);
        return profiles.reduce(preferAdminProfile);
      }
    }

    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>) {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
    return { uid, ...updates };
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}

export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
    const users = querySnapshot.docs.map((doc) => doc.data() as UserProfile);
    const deduped = new Map<string, UserProfile>();

    for (const user of users) {
      const key = user.uid || normalizeEmail(user.email);
      const existing = deduped.get(key);
      deduped.set(key, existing ? preferAdminProfile(existing, user) : user);
    }

    return Array.from(deduped.values());
  } catch (error) {
    console.error("Error getting all users:", error);
    throw error;
  }
}

export async function getUsersByRole(rol: UserRole): Promise<UserProfile[]> {
  try {
    const q = query(collection(db, USERS_COLLECTION), where("rol", "==", rol));
    const querySnapshot = await getDocs(q);
    const users = querySnapshot.docs.map((doc) => doc.data() as UserProfile);
    const deduped = new Map<string, UserProfile>();

    for (const user of users) {
      const key = user.uid || normalizeEmail(user.email);
      const existing = deduped.get(key);
      deduped.set(key, existing ? preferAdminProfile(existing, user) : user);
    }

    return Array.from(deduped.values());
  } catch (error) {
    console.error("Error getting users by role:", error);
    throw error;
  }
}
