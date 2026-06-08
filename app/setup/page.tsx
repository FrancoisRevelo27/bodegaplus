"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SetupPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("admin@bodegaplus.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checking, setChecking] = useState(true);

  // Verificar si ya existen usuarios
  useEffect(() => {
    const checkUsers = async () => {
      try {
        const response = await fetch("/api/setup-admin");
        const data = await response.json();

        if (data.hasUsers) {
          // Ya hay usuarios, redirigir a login
          router.push("/login");
        }
      } catch (err) {
        console.error("Error al verificar usuarios:", err);
      } finally {
        setChecking(false);
      }
    };

    checkUsers();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!nombre.trim()) {
        setError("El nombre es requerido");
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/setup-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al crear usuario admin");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Error al crear usuario admin");
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-600 mb-4">
            <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full"></div>
          </div>
          <p className="text-white font-semibold">Verificando...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="rounded-3xl border border-green-700 bg-green-900/30 backdrop-blur p-8 shadow-2xl">
            <div className="text-5xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-green-400 mb-2">
              ¡Éxito!
            </h1>
            <p className="text-green-300 mb-4">
              Tu cuenta admin ha sido creada exitosamente
            </p>
            <p className="text-xs text-green-200">
              Redirigiendo a login en 2 segundos...
            </p>
            <div className="flex gap-2 justify-center mt-6">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <div
                className="h-2 w-2 bg-green-500 rounded-full animate-pulse"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="h-2 w-2 bg-green-500 rounded-full animate-pulse"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-zinc-700 bg-zinc-900/50 backdrop-blur p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-white">BodegaPlus</h1>
            <h2 className="text-xl font-semibold text-blue-400">
              Crear Usuario Admin
            </h2>
            <p className="text-sm text-zinc-400">
              Primera configuración del sistema
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg">
              <p className="text-red-300 text-sm font-semibold">⚠️ Error</p>
              <p className="text-red-200 text-sm mt-1">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Juan Pérez"
                required
                className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">
                Contraseña *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />
              <p className="text-xs text-zinc-400 mt-1">Mínimo 6 caracteres</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-blue-600 disabled:cursor-not-allowed disabled:opacity-50 mt-6"
            >
              {loading ? "Creando admin..." : "Crear Usuario Admin"}
            </button>
          </form>

          <div className="p-4 bg-blue-900/30 border border-blue-700/50 rounded-lg">
            <p className="text-xs text-blue-300 font-semibold mb-2">
              ℹ️ Este será tu usuario administrador
            </p>
            <ul className="text-xs text-blue-200/80 space-y-1">
              <li>✓ Acceso completo al sistema</li>
              <li>✓ Crear y gestionar usuarios</li>
              <li>✓ Ver auditoría y reportes</li>
            </ul>
          </div>

          <div className="pt-4 border-t border-zinc-700 text-center">
            <p className="text-xs text-zinc-400">
              BodegaPlus © 2024
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
