"use client";

import { useEffect, useState } from "react";
import { AuditLog } from "@/types/shop";
import { getAllAuditLogs, getAuditLogsByType } from "@/lib/auditLogs";
import { useAuth } from "@/context/AuthContext";

export default function AuditTrail() {
  const { userProfile, isAdmin } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "ingreso_producto" | "venta" | "ingreso_stock">("all");

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
      registro_cliente: "Registro de Cliente",
      ingreso_stock: "Ingreso de Stock",
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
      <div className="p-6 bg-white rounded-3xl border border-zinc-200 shadow-sm">
        <p className="text-red-600">No tiene permisos para ver la auditoría</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Registro de Auditoría</h2>
        <p className="text-sm text-zinc-600">Historial completo de operaciones del sistema.</p>
      </div>

      <div className="mb-8 flex flex-wrap gap-2 border-b border-zinc-100 pb-6">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-full px-5 py-2 text-sm font-medium transition ${
            filter === "all" ? "bg-slate-950 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter("ingreso_producto")}
          className={`rounded-full px-5 py-2 text-sm font-medium transition ${
            filter === "ingreso_producto" ? "bg-slate-950 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          Nuevos Productos
        </button>
        <button
          onClick={() => setFilter("ingreso_stock")}
          className={`rounded-full px-5 py-2 text-sm font-medium transition ${
            filter === "ingreso_stock" ? "bg-slate-950 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          Entradas de Stock
        </button>
        <button
          onClick={() => setFilter("venta")}
          className={`rounded-full px-5 py-2 text-sm font-medium transition ${
            filter === "venta" ? "bg-slate-950 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          Ventas
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p>Cargando...</p>
        </div>
      ) : auditLogs.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <p>No hay registros de auditoría</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead>
              <tr className="bg-zinc-50 text-left text-zinc-700">
                <th className="px-4 py-3 font-semibold">Fecha y Hora</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Usuario</th>
                <th className="px-4 py-3 font-semibold">Descripción</th>
                <th className="px-4 py-3 font-semibold">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-zinc-500 whitespace-nowrap">
                    {formatDate(log.fechaCreacion)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-1 bg-zinc-100 text-zinc-700 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                      {getTypeLabel(log.tipo)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <p className="font-medium text-zinc-900">{log.usuarioNombre}</p>
                      <p className="text-[11px] text-zinc-500">{log.usuarioEmail}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{log.descripcion}</td>
                  <td className="px-4 py-3 text-xs text-zinc-600">
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
                    {log.detalles.cantidadIngresada && (
                      <p>
                        Entrada: <strong>+{log.detalles.cantidadIngresada}</strong>
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
