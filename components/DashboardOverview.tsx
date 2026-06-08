import type { DashboardSummary } from "@/types/shop";

export default function DashboardOverview({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
      {[
        { label: "Productos", value: summary.totalProducts, accent: "bg-slate-950 text-white" },
        { label: "Ventas", value: summary.totalSales, accent: "bg-slate-900 text-white" },
        { label: "Ingresos", value: `$${summary.totalRevenue.toFixed(2)}`, accent: "bg-white text-slate-950" },
        { label: "Gastos", value: `$${summary.totalExpenses.toFixed(2)}`, accent: "bg-white text-slate-950" },
        { label: "Stock bajo", value: summary.lowStockCount, accent: "bg-amber-100 text-amber-950" },
      ].map((card) => (
        <div key={card.label} className={`rounded-3xl border border-zinc-200 p-5 shadow-sm ${card.accent}`}>
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">{card.label}</p>
          <p className="mt-4 text-3xl font-semibold">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
