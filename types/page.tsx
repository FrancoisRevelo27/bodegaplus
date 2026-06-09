"use client";

import ProductManager from "@/components/ProductManager";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import DashboardNav from "@/components/DashboardNav";

export default function InventarioPage() {
  return (
    <ProtectedRoute requiredRole={["admin", "empleado"]}>
      <div className="min-h-screen bg-zinc-50">
        <DashboardNav />
        <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manejo de Inventario</h1>
            <p className="text-sm text-zinc-500">Control centralizado de existencias y precios.</p>
          </div>
          <ProductManager onProductsUpdated={(products) => console.log("Inventario cargado")} />
        </main>
      </div>
    </ProtectedRoute>
  );
}