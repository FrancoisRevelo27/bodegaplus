"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function CreateUserForm() {
  const { register } = useAuth();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<"admin" | "empleado">("empleado");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [usuarios, setUsuarios] = useState<any[]>([]);

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
      setSuccess(`Usuario ${email} creado como ${rol === "admin" ? "Administrador" : "Empleado"} exitosamente`);
      setNombre("");
      setEmail("");
      setPassword("");
      setRol("empleado");

      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || "No se pudo crear el usuario. Verifica tus datos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 rounded-3xl border border-zinc-200 bg-white p-8 shadow-lg shadow-zinc-200/50">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
        <p className="text-sm text-zinc-600">
          Crear nuevos usuarios para el sistema
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

      <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
        <h2 className="text-lg font-semibold">Crear Nuevo Usuario</h2>
        
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Nombre Completo *</span>
          <input
            type="text"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            required
            placeholder="Ej: Juan Pérez"
            className="mt-2 w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Correo Electrónico *</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="Ej: juan@ejemplo.com"
            className="mt-2 w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Contraseña *</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            placeholder="Mínimo 6 caracteres"
            className="mt-2 w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Rol *</span>
          <select
            value={rol}
            onChange={(event) => setRol(event.target.value as "admin" | "empleado")}
            className="mt-2 w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
          >
            <option value="empleado">Empleado - Puede vender y registrar clientes</option>
            <option value="admin">Administrador - Acceso completo al sistema</option>
          </select>
          <p className="mt-2 text-xs text-zinc-500">
            {rol === "admin" 
              ? "Acceso a: Dashboard, Auditoría, Configuración, Gestión de Usuarios, Ventas, Clientes"
              : "Acceso a: Ventas, Registro de Clientes"}
          </p>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creando Usuario..." : "Crear Usuario"}
        </button>
      </form>

      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-4">Permisos por Rol</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="font-medium text-blue-900">👤 Empleado</p>
            <ul className="text-sm text-blue-800 mt-2 space-y-1">
              <li>✓ Registrar clientes</li>
              <li>✓ Realizar ventas</li>
              <li>✓ Generar facturas</li>
              <li>✗ Ver auditoría</li>
              <li>✗ Acceso a gastos</li>
              <li>✗ Crear usuarios</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-blue-900">🔐 Administrador</p>
            <ul className="text-sm text-blue-800 mt-2 space-y-1">
              <li>✓ Acceso completo</li>
              <li>✓ Crear usuarios</li>
              <li>✓ Ver auditoría</li>
              <li>✓ Configurar email</li>
              <li>✓ Gestionar gastos</li>
              <li>✓ Ver dashboard</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
