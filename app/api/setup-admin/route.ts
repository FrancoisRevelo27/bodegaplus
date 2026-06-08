import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import {
  initializeApp,
  getApps,
  cert,
  type App as AdminApp,
} from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import {
  getApp as getClientApp,
  getApps as getClientApps,
  initializeApp as initializeClientApp,
} from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth as getClientAuth,
  updateProfile,
} from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  getFirestore as getClientFirestore,
  limit,
  query,
  setDoc,
} from "firebase/firestore";

export const runtime = "nodejs";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getErrorCode(error: unknown) {
  if (typeof error === "object" && error && "code" in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" ? code : null;
  }

  return null;
}

function getClientServices() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  };

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    return null;
  }

  const app = getClientApps().length
    ? getClientApp()
    : initializeClientApp(firebaseConfig);

  return {
    auth: getClientAuth(app),
    db: getClientFirestore(app),
  };
}

// Inicializar Firebase Admin
function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  try {
    // Intentar cargar desde variables de entorno (para producción)
    if (process.env.FIREBASE_ADMIN_SDK) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK);
      return initializeApp({
        credential: cert(serviceAccount),
      });
    }

    const serviceAccountPath = path.join(
      process.cwd(),
      "config",
      "serviceAccountKey.json"
    );

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(
        fs.readFileSync(serviceAccountPath, "utf8")
      );

      return initializeApp({
        credential: cert(serviceAccount),
      });
    }
  } catch (error) {
    console.error("Error al inicializar Firebase Admin:", error);
  }

  return null;
}

async function createAdminWithAdminSdk(
  app: AdminApp,
  nombre: string,
  email: string,
  password: string
) {
  const auth = getAdminAuth(app);
  const db = getAdminFirestore(app);

  const userRecord = await auth.createUser({
    email: email.toLowerCase(),
    password,
    displayName: nombre,
  });

  await db.collection("user_profiles").doc(userRecord.uid).set({
    uid: userRecord.uid,
    email: email.toLowerCase(),
    nombre,
    rol: "admin",
    estado: "activo",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return {
    uid: userRecord.uid,
    email: userRecord.email,
    nombre,
    rol: "admin",
  };
}

async function createAdminWithClientSdk(
  nombre: string,
  email: string,
  password: string
) {
  const services = getClientServices();

  if (!services) {
    throw new Error(
      "Firebase no configurado. Revisa las variables NEXT_PUBLIC_FIREBASE_* en .env.local."
    );
  }

  const credential = await createUserWithEmailAndPassword(
    services.auth,
    email.toLowerCase(),
    password
  );

  await updateProfile(credential.user, { displayName: nombre });

  await setDoc(doc(services.db, "user_profiles", credential.user.uid), {
    uid: credential.user.uid,
    email: email.toLowerCase(),
    nombre,
    rol: "admin",
    estado: "activo",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return {
    uid: credential.user.uid,
    email: credential.user.email,
    nombre,
    rol: "admin",
  };
}

async function hasUsersWithClientSdk() {
  const services = getClientServices();

  if (!services) {
    throw new Error(
      "Firebase no configurado. Revisa las variables NEXT_PUBLIC_FIREBASE_* en .env.local."
    );
  }

  const snapshot = await getDocs(
    query(collection(services.db, "user_profiles"), limit(1))
  );

  return !snapshot.empty;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, email, password } = body;

    // Validaciones
    if (!nombre?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: "Nombre, email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Intentar verificar si ya existen usuarios
    try {
      const appCheck = getAdminApp();
      let alreadyHasUsers = false;

      if (appCheck) {
        const snapshot = await getAdminFirestore(appCheck).collection("user_profiles").limit(1).get();
        alreadyHasUsers = !snapshot.empty;
      } else {
        // Si falla el Admin SDK, intentamos con el Client SDK
        alreadyHasUsers = await hasUsersWithClientSdk();
      }

      if (alreadyHasUsers) {
        return NextResponse.json(
          { error: "El sistema ya tiene un administrador. Por seguridad, esta ruta ha sido inhabilitada." },
          { status: 403 }
        );
      }
    } catch (checkError) {
      console.error("Error verificando existencia de usuarios:", checkError);
      // No bloqueamos aquí para permitir el intento de creación si es el primer despliegue
    }

    try {
      const app = getAdminApp();
      const user = app
        ? await createAdminWithAdminSdk(app, nombre, email, password)
        : await createAdminWithClientSdk(nombre, email, password);

      return NextResponse.json(
        {
          success: true,
          message: "Admin creado exitosamente",
          user,
        },
        { status: 201 }
      );
    } catch (firebaseError: unknown) {
      console.error("Firebase error:", firebaseError);

      if (getErrorCode(firebaseError) === "auth/email-already-exists") {
        return NextResponse.json(
          { error: "Este email ya está registrado" },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: getErrorMessage(firebaseError, "Error al crear admin") },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Error procesando solicitud") },
      { status: 500 }
    );
  }
}

export async function GET() {
  const app = getAdminApp();

  try {
    const hasUsers = app
      ? !(await getAdminFirestore(app).collection("user_profiles").limit(1).get())
          .empty
      : await hasUsersWithClientSdk();

    return NextResponse.json({
      initialized: true,
      hasUsers,
      message: hasUsers
        ? "Ya hay usuarios en el sistema"
        : "No hay usuarios registrados",
    });
  } catch (error: unknown) {
    return NextResponse.json({
      initialized: false,
      error: getErrorMessage(error, "Error al verificar usuarios"),
    });
  }
}
