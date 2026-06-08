import { ProtectedRoute } from "@/components/ProtectedRoute";
import CustomerManager from "@/components/CustomerManager";
import DashboardNav from "@/components/DashboardNav";

export default function ClientesPage() {
  return (
    <>
      <DashboardNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProtectedRoute>
          <CustomerManager />
        </ProtectedRoute>
      </div>
    </>
  );
}
