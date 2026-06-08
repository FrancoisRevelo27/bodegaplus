"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import DashboardNav from "@/components/DashboardNav";

function RegisterContent() {
  const router = useRouter();
  const { register, userProfile } = useAuth();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<"admin" | "empleado">("empleado");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!nombre.trim()) {
        setError("El nombre es requerido");
        setLoading(false);
        return;
      }

      await register(email, password, nombre, rol);
      setSuccess(`Usuario ${email} creado como ${rol} exitosamente`);
      setNombre("");
      setEmail("");
      setPassword("");
      setRol("empleado");

      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError("No se pudo crear el usuario. Verifica tus datos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DashboardNav />
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8 rounded-3xl border border-zinc-200 bg-white p-8 shadow-lg shadow-zinc-200/50">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold">Crear Nuevo Usuario</h1>
            <p className="text-sm text-zinc-600">
              Solo administradores pueden crear nuevos usuarios
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-100 text-green-700 rounded">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-zinc-700">Nombre Completo</span>
              <input
                type="text"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                required
                className="mt-2 w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-zinc-700">Correo electrónico</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="mt-2 w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-zinc-700">Contraseña</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="mt-2 w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-zinc-700">Rol</span>
              <select
                value={rol}
                onChange={(event) => setRol(event.target.value as "admin" | "empleado")}
                className="mt-2 w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
              >
                <option value="empleado">Empleado (Puede vender y registrar clientes)</option>
                <option value="admin">Administrador (Acceso completo)</option>
              </select>
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creando..." : "Crear Usuario"}
            </button>
          </form>

          <div className="text-xs text-zinc-600 bg-zinc-50 p-4 rounded">
            <p className="font-semibold mb-2">Permisos:</p>
            <p><strong>Admin:</strong> Acceso a todo, crea usuarios, ve auditoría, configura email</p>
            <p><strong>Empleado:</strong> Vende productos, registra clientes</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function RegisterPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <RegisterContent />
    </ProtectedRoute>
  );
}
