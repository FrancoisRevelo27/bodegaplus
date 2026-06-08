"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import DashboardOverview from "@/components/DashboardOverview";
import ExpenseManager from "@/components/ExpenseManager";
import ProductManager from "@/components/ProductManager";
import ReportCharts from "@/components/ReportCharts";
import type { Expense, Product, Sale } from "@/types/shop";
import { getDocs, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";

function DashboardContent() {
  const router = useRouter();
  const { user, userProfile, loading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    loadProducts();
    loadSales();
    loadExpenses();
  }, []);

  const loadProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];
      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const loadSales = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "sales"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Sale[];
      setSales(data);
    } catch (error) {
      console.error("Error loading sales:", error);
    }
  };

  const loadExpenses = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "expenses"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Expense[];
      setExpenses(data);
    } catch (error) {
      console.error("Error loading expenses:", error);
    }
  };

  const summary = useMemo(
    () => ({
      totalProducts: products.length,
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum, sale) => sum + sale.totalAmount, 0),
      totalExpenses: expenses.reduce((sum, expense) => sum + expense.amount, 0),
      lowStockCount: products.filter((product) => product.stock <= 5).length,
    }),
    [products, sales, expenses]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-zinc-500">Bienvenido a BodegaPlus</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">Panel de control</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Rol: {userProfile?.rol === "admin" ? "Administrador" : "Empleado"}
            </p>
          </div>
          <div>
            <span className="rounded-full bg-zinc-100 px-4 py-2 text-sm text-zinc-700">
              {user?.email}
            </span>
          </div>
        </header>

        <DashboardOverview summary={summary} />

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <ProductManager onProductsUpdated={setProducts} />
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Resumen de Actividad</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Total de Productos:</span>
                <span className="font-bold text-lg">{products.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Ingresos Registrados:</span>
                <span className="font-bold text-lg">{sales.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Gastos Registrados:</span>
                <span className="font-bold text-lg">{expenses.length}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Productos Bajo Stock:</span>
                <span className="font-bold text-lg text-orange-600">{summary.lowStockCount}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <ExpenseManager onExpensesUpdated={setExpenses} />
          <ReportCharts sales={sales} expenses={expenses} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardContent />
    </ProtectedRoute>
  );
}
