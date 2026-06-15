import type { DashboardSummary } from "@/types/shop";

export default function DashboardOverview({ summary }: { summary: DashboardSummary }) {
  return (
    /* Se cambió grid-cols-1 por grid-cols-2 en móviles para aprovechar el ancho */
    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
      {[
        { label: "Productos", value: summary.totalProducts, accent: "bg-slate-950 text-white shadow-slate-200" },
        { label: "Ventas", value: summary.totalSales, accent: "bg-white text-slate-950 border-zinc-200" },
        { label: "Ingresos", value: `$${summary.totalRevenue.toFixed(2)}`, accent: "bg-white text-emerald-600 border-zinc-200" },
        { label: "Gastos", value: `$${summary.totalExpenses.toFixed(2)}`, accent: "bg-white text-slate-950" },
        { label: "Stock bajo", value: summary.lowStockCount, accent: "bg-amber-50 text-amber-700 border-amber-200 col-span-2 md:col-span-1" },
      ].map((card, index) => (
        <div key={card.label} className={`rounded-3xl border p-6 transition-all hover:scale-[1.02] shadow-sm ${card.accent}`}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">{card.label}</p>
          <p className="mt-4 text-3xl font-semibold">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
