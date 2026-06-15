"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Expense, Sale } from "@/types/shop";

const COLORS = ["#0f172a", "#475569", "#f59e0b", "#ef4444", "#14b8a6"];

export default function ReportCharts({ sales, expenses }: { sales: Sale[]; expenses: Expense[] }) {
  const [filter, setFilter] = useState<"all" | "today" | "week">("all");

  const filterData = <T extends { fechaCreacion?: any; createdAt?: any }>(data: T[]) => {
    const now = new Date();
    return data.filter(item => {
      const date = item.fechaCreacion?.toDate ? item.fechaCreacion.toDate() : 
                   item.createdAt?.toDate ? item.createdAt.toDate() : new Date();
      
      if (filter === "today") return date.toDateString() === now.toDateString();
      if (filter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return date >= weekAgo;
      }
      return true;
    });
  };

  const filteredSales = filterData(sales);
  const filteredExpenses = filterData(expenses);

  const revenueByProduct = filteredSales.reduce<Record<string, number>>((acc, sale) => {
    acc[sale.productName] = (acc[sale.productName] ?? 0) + sale.totalAmount;
    return acc;
  }, {});

  // Agrupar ventas por fecha para el gráfico de línea
  const salesByDate = filteredSales.reduce<Record<string, number>>((acc, sale) => {
    const date = sale.fechaCreacion?.toDate ? sale.fechaCreacion.toDate().toLocaleDateString() : new Date().toLocaleDateString();
    acc[date] = (acc[date] ?? 0) + sale.totalAmount;
    return acc;
  }, {});

  const revenueData = Object.entries(revenueByProduct).map(([name, total]) => ({ name, total }));
  const timelineData = Object.entries(salesByDate).map(([date, total]) => ({ date, total }));
  const expenseTotal = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
  const incomeTotal = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const comparisonData = [
    { name: "Ingresos", value: incomeTotal },
    { name: "Gastos", value: expenseTotal },
  ];

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Reportes</h2>
          <p className="text-sm text-zinc-600">Visualiza el comportamiento de ventas y gastos.</p>
        </div>
        <div className="flex bg-zinc-100 p-1 rounded-xl">
          {(["all", "today", "week"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filter === f ? "bg-white shadow-sm text-slate-900" : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {f === "all" ? "Histórico" : f === "today" ? "Hoy" : "Últimos 7 días"}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-8 xl:grid-cols-3">
        <div className="h-96 rounded-3xl border border-zinc-200 bg-white p-4 xl:col-span-2">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-600">Tendencia de Ventas Diarias</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value: any) => [`$${value.toFixed(2)}`, "Ventas"]} />
              <Line type="monotone" dataKey="total" stroke="#0f172a" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="h-96 rounded-3xl border border-zinc-200 bg-white p-4">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-600">Ingresos por producto</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData} margin={{ top: 8, right: 16, left: -8, bottom: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: any) => [`$${value?.toFixed(2) ?? "0.00"}`, "Total"]} />
              <Legend />
              <Bar dataKey="total" fill="#0f172a">
                {revenueData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="h-96 rounded-3xl border border-zinc-200 bg-white p-4">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-600">Ingresos vs Gastos</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={comparisonData} dataKey="value" nameKey="name" cx="50%" cy="42%" outerRadius={100} fill="#0f172a" label />
              <Tooltip formatter={(value: any) => [`$${value?.toFixed(2) ?? "0.00"}`, "Total"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
