import { ProtectedRoute } from "@/components/ProtectedRoute";
import EmailConfiguration from "@/components/EmailConfiguration";
import DashboardNav from "@/components/DashboardNav";

export default function ConfiguracionPage() {
  return (
    <>
      <DashboardNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProtectedRoute requiredRole="admin">
          <EmailConfiguration />
        </ProtectedRoute>
      </div>
    </>
  );
}
