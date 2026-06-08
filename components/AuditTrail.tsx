"use client";

import { useEffect, useState } from "react";
import { AuditLog } from "@/types/shop";
import { getAllAuditLogs, getAuditLogsByType } from "@/lib/auditLogs";
import { useAuth } from "@/context/AuthContext";

export default function AuditTrail() {
  const { userProfile, isAdmin } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "ingreso_producto" | "venta">("all");

  useEffect(() => {
    loadAuditLogs();
  }, [filter]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      let logs: AuditLog[];

      if (filter === "all") {
        logs = await getAllAuditLogs();
      } else {
        logs = await getAuditLogsByType(filter as any);
      }

      setAuditLogs(logs);
    } catch (error) {
      console.error("Error loading audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (tipo: AuditLog["tipo"]) => {
    const labels: Record<AuditLog["tipo"], string> = {
      ingreso_producto: "Ingreso de Producto",
      venta: "Venta",
      actualizacion_producto: "Actualización de Producto",
      eliminacion_producto: "Eliminación de Producto",
      parametrizacion: "Parametrización",
    };
    return labels[tipo];
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("es-CO") + " " + date.toLocaleTimeString("es-CO");
  };

  if (!isAdmin?.()) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-red-600">No tiene permisos para ver la auditoría</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Registro de Auditoría</h2>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded ${
            filter === "all" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter("ingreso_producto")}
          className={`px-4 py-2 rounded ${
            filter === "ingreso_producto" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Ingresos de Productos
        </button>
        <button
          onClick={() => setFilter("venta")}
          className={`px-4 py-2 rounded ${
            filter === "venta" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Ventas
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p>Cargando...</p>
        </div>
      ) : auditLogs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No hay registros de auditoría</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-200 sticky top-0">
              <tr>
                <th className="p-2 text-left">Fecha y Hora</th>
                <th className="p-2 text-left">Tipo</th>
                <th className="p-2 text-left">Usuario</th>
                <th className="p-2 text-left">Descripción</th>
                <th className="p-2 text-left">Detalles</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 text-xs whitespace-nowrap">
                    {formatDate(log.fechaCreacion)}
                  </td>
                  <td className="p-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {getTypeLabel(log.tipo)}
                    </span>
                  </td>
                  <td className="p-2">
                    <div className="text-xs">
                      <p className="font-semibold">{log.usuarioNombre}</p>
                      <p className="text-gray-600">{log.usuarioEmail}</p>
                    </div>
                  </td>
                  <td className="p-2">{log.descripcion}</td>
                  <td className="p-2 text-xs">
                    {log.detalles.productName && (
                      <p>
                        Producto: <strong>{log.detalles.productName}</strong>
                      </p>
                    )}
                    {log.detalles.cantidad && (
                      <p>
                        Cantidad: <strong>{log.detalles.cantidad}</strong>
                      </p>
                    )}
                    {log.detalles.precio && (
                      <p>
                        Precio: <strong>${log.detalles.precio.toFixed(2)}</strong>
                      </p>
                    )}
                    {log.detalles.total && (
                      <p>
                        Total: <strong>${log.detalles.total.toFixed(2)}</strong>
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
