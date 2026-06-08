import type { Metadata } from "next";
import { ReactNode } from "react";
import DashboardNav from "@/components/DashboardNav";

export const metadata: Metadata = {
  title: "Dashboard | BodegaPlus",
  description: "Panel de control para inventario, ventas, gastos y reportes.",
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <DashboardNav />
      <div className="min-h-screen bg-zinc-50 text-zinc-950">{children}</div>
    </>
  );
}
