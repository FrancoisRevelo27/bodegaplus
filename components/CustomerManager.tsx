"use client";

import { useEffect, useState } from "react";
import { Customer } from "@/types/shop";
import { createCustomer, getAllCustomers } from "@/lib/customers";
import { useAuth } from "@/context/AuthContext";
import { createAuditLog } from "@/lib/auditLogs";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function CustomerManager() {
  const { userProfile } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cedula: "",
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    direccion: "",
    ciudad: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await getAllCustomers();
      setCustomers(data);
    } catch (err) {
      setError("Error al cargar clientes");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const newCustomer = await createCustomer({
        ...formData,
        cedula: formData.cedula.toUpperCase(),
      });

      // Crear log de auditoría
      if (userProfile) {
        await createAuditLog({
          tipo: "registro_cliente",
          usuarioId: userProfile.uid,
          usuarioNombre: userProfile.nombre,
          usuarioEmail: userProfile.email,
          descripcion: `Nuevo cliente registrado: ${formData.nombre} ${formData.apellido}`,
          detalles: {
            customerCedula: formData.cedula,
          },
        });
      }

      setSuccess("Cliente registrado exitosamente");
      setFormData({
        cedula: "",
        nombre: "",
        apellido: "",
        email: "",
        telefono: "",
        direccion: "",
        ciudad: "",
      });
      setShowForm(false);

      // Recargar lista
      await loadCustomers();
    } catch (err: any) {
      setError(err.message || "Error al registrar cliente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 mb-6">
        <h2 className="text-xl font-semibold">Gestión de Clientes</h2>
        <p className="text-sm text-zinc-600">Registra y administra la base de datos de compradores.</p>
      </div>

      <button
        onClick={() => setShowForm(!showForm)}
        className="mb-6 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        {showForm ? "Cancelar" : "Registrar Nuevo Cliente"}
      </button>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
          {success}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 grid gap-4 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="cedula"
              placeholder="Cédula (ID) *"
              value={formData.cedula}
              onChange={handleInputChange}
              required
              className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-900"
            />
            <input
              type="text"
              name="nombre"
              placeholder="Nombre *"
              value={formData.nombre}
              onChange={handleInputChange}
              required
              className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-900"
            />
            <input
              type="text"
              name="apellido"
              placeholder="Apellido *"
              value={formData.apellido}
              onChange={handleInputChange}
              required
              className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-900"
            />
            <input
              type="email"
              name="email"
              placeholder="Email *"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-900"
            />
            <input
              type="tel"
              name="telefono"
              placeholder="Teléfono"
              value={formData.telefono}
              onChange={handleInputChange}
              className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-900"
            />
            <input
              type="text"
              name="ciudad"
              placeholder="Ciudad"
              value={formData.ciudad}
              onChange={handleInputChange}
              className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-900"
            />
            <input
              type="text"
              name="direccion"
              placeholder="Dirección"
              value={formData.direccion}
              onChange={handleInputChange}
              className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-900 md:col-span-2"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar Cliente"}
          </button>
        </form>
      )}

      <div className="mt-4">
        <h3 className="mb-4 text-lg font-medium text-zinc-800">Clientes Registrados</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead>
              <tr className="bg-zinc-50 text-left text-zinc-700">
                <th className="px-4 py-3 font-semibold">Cédula</th>
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Teléfono</th>
                <th className="px-4 py-3 font-semibold">Ciudad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                    No hay clientes registrados
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-600">{customer.cedula}</td>
                    <td className="px-4 py-3 font-medium">{`${customer.nombre} ${customer.apellido}`}</td>
                    <td className="px-4 py-3 text-zinc-600">{customer.email}</td>
                    <td className="px-4 py-3 text-zinc-600">{customer.telefono}</td>
                    <td className="px-4 py-3 text-zinc-600">{customer.ciudad}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
