"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Expense, Sale } from "@/types/shop";

const COLORS = ["#0f172a", "#475569", "#f59e0b", "#ef4444", "#14b8a6"];

export default function ReportCharts({ sales, expenses }: { sales: Sale[]; expenses: Expense[] }) {
  const revenueByProduct = sales.reduce<Record<string, number>>((acc, sale) => {
    acc[sale.productName] = (acc[sale.productName] ?? 0) + sale.totalAmount;
    return acc;
  }, {});

  const revenueData = Object.entries(revenueByProduct).map(([name, total]) => ({ name, total }));
  const expenseTotal = expenses.reduce((sum, item) => sum + item.amount, 0);
  const incomeTotal = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const comparisonData = [
    { name: "Ingresos", value: incomeTotal },
    { name: "Gastos", value: expenseTotal },
  ];

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Reportes</h2>
        <p className="text-sm text-zinc-600">Visualiza el comportamiento de ventas y gastos.</p>
      </div>
      <div className="grid gap-8 xl:grid-cols-2">
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
