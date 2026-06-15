import { ProtectedRoute } from "@/components/ProtectedRoute";
import SalesManager from "@/components/SalesManager";
import DashboardNav from "@/components/DashboardNav";

export default function VentasPage() {
  return (
    <>
      <DashboardNav />
      {/* Ajuste de padding: menor en móviles (px-2 py-4) y estándar en escritorio */}
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
        <ProtectedRoute>
          <SalesManager />
        </ProtectedRoute>
      </div>
    </>
  );
}
