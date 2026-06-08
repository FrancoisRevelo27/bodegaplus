#!/usr/bin/env node

/**
 * Script para crear el usuario admin inicial en Firebase
 * Uso: node scripts/create-admin.js
 */

const admin = require("firebase-admin");
const readline = require("readline");
const path = require("path");

// Inicializar Firebase Admin
const serviceAccountPath = path.join(
  __dirname,
  "../config/serviceAccountKey.json"
);

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} catch (error) {
  console.error(
    "❌ Error: No se encontró 'config/serviceAccountKey.json'"
  );
  console.error(
    "Descarga la clave de servicio desde Firebase Console:"
  );
  console.error(
    "1. Ve a Firebase Console → Proyecto → Configuración (⚙️)"
  );
  console.error(
    "2. Pestaña 'Cuentas de servicio' → 'Firebase Admin SDK'"
  );
  console.error("3. Haz clic en 'Generar clave privada'");
  console.error("4. Copia el archivo JSON en carpeta 'config/'");
  process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt) =>
  new Promise((resolve) => rl.question(prompt, resolve));

async function createAdmin() {
  console.log("\n🔐 Crear Usuario Admin Inicial");
  console.log("================================\n");

  const email = await question(
    "📧 Email del admin (default: admin@bodegaplus.com): "
  );
  const password = await question("🔑 Contraseña del admin: ");
  const nombre = await question(
    "👤 Nombre completo (default: Administrador): "
  );

  const adminEmail = email || "admin@bodegaplus.com";
  const adminNombre = nombre || "Administrador";

  if (!password || password.length < 6) {
    console.error("\n❌ La contraseña debe tener al menos 6 caracteres");
    rl.close();
    process.exit(1);
  }

  try {
    console.log("\n⏳ Creando usuario en Authentication...");

    // Crear usuario en Firebase Auth
    const userRecord = await auth.createUser({
      email: adminEmail,
      password: password,
      displayName: adminNombre,
    });

    console.log(`✅ Usuario Auth creado: ${userRecord.uid}`);

    console.log("⏳ Creando perfil en Firestore...");

    // Crear perfil en Firestore
    await db.collection("user_profiles").doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: adminEmail,
      nombre: adminNombre,
      rol: "admin",
      estado: "activo",
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    });

    console.log(`✅ Perfil creado en Firestore\n`);

    console.log("🎉 ¡Admin creado exitosamente!");
    console.log("================================");
    console.log(`📧 Email:     ${adminEmail}`);
    console.log(`👤 Nombre:    ${adminNombre}`);
    console.log(`🔐 Rol:       Admin (acceso completo)`);
    console.log(`\n🚀 Ahora puedes iniciar sesión en http://localhost:3000/login\n`);

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);

    if (error.code === "auth/email-already-exists") {
      console.error(
        "Este email ya está registrado. Intenta con otro."
      );
    }

    rl.close();
    process.exit(1);
  }
}

createAdmin();
