import { ProtectedRoute } from "@/components/ProtectedRoute";
import DashboardNav from "@/components/DashboardNav";

export default function UsuariosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DashboardNav />
      <div className="min-h-screen bg-zinc-50">
        {children}
      </div>
    </>
  );
}
