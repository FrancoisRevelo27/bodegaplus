import { ProtectedRoute } from "@/components/ProtectedRoute";
import AuditTrail from "@/components/AuditTrail";
import DashboardNav from "@/components/DashboardNav";

export default function AuditoriaPage() {
  return (
    <>
      <DashboardNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProtectedRoute requiredRole="admin">
          <AuditTrail />
        </ProtectedRoute>
      </div>
    </>
  );
}
