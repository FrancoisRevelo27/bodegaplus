"use client";

import { useEffect, useState } from "react";
import { Customer } from "@/types/shop";
import { createCustomer, getAllCustomers } from "@/lib/customers";
import { useAuth } from "@/context/AuthContext";
import { createAuditLog } from "@/lib/auditLogs";

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
          tipo: "ingreso_producto",
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
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Gestión de Clientes</h2>

      <button
        onClick={() => {
          setShowForm(!showForm);
        }}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
        <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="cedula"
              placeholder="Cédula *"
              value={formData.cedula}
              onChange={handleInputChange}
              required
              className="px-3 py-2 border rounded"
            />
            <input
              type="text"
              name="nombre"
              placeholder="Nombre *"
              value={formData.nombre}
              onChange={handleInputChange}
              required
              className="px-3 py-2 border rounded"
            />
            <input
              type="text"
              name="apellido"
              placeholder="Apellido *"
              value={formData.apellido}
              onChange={handleInputChange}
              required
              className="px-3 py-2 border rounded"
            />
            <input
              type="email"
              name="email"
              placeholder="Email *"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="px-3 py-2 border rounded"
            />
            <input
              type="tel"
              name="telefono"
              placeholder="Teléfono"
              value={formData.telefono}
              onChange={handleInputChange}
              className="px-3 py-2 border rounded"
            />
            <input
              type="text"
              name="ciudad"
              placeholder="Ciudad"
              value={formData.ciudad}
              onChange={handleInputChange}
              className="px-3 py-2 border rounded"
            />
            <input
              type="text"
              name="direccion"
              placeholder="Dirección"
              value={formData.direccion}
              onChange={handleInputChange}
              className="px-3 py-2 border rounded md:col-span-2"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar Cliente"}
          </button>
        </form>
      )}

      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-4">Clientes Registrados</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 text-left">Cédula</th>
                <th className="p-2 text-left">Nombre</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Teléfono</th>
                <th className="p-2 text-left">Ciudad</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-2 text-center text-gray-500">
                    No hay clientes registrados
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-mono">{customer.cedula}</td>
                    <td className="p-2">{`${customer.nombre} ${customer.apellido}`}</td>
                    <td className="p-2">{customer.email}</td>
                    <td className="p-2">{customer.telefono}</td>
                    <td className="p-2">{customer.ciudad}</td>
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
