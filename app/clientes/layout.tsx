import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "BodegaPlus",
  description: "Sistema de gestión de ventas y inventario",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50">
      {children}
    </div>
  );
}
