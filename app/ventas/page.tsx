import { ProtectedRoute } from "@/components/ProtectedRoute";
import SalesManager from "@/components/SalesManager";
import DashboardNav from "@/components/DashboardNav";

export default function VentasPage() {
  return (
    <>
      <DashboardNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProtectedRoute>
          <SalesManager />
        </ProtectedRoute>
      </div>
    </>
  );
}
