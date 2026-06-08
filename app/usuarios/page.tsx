import { ProtectedRoute } from "@/components/ProtectedRoute";
import CreateUserForm from "@/components/CreateUserForm";

export default function UsuariosPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <CreateUserForm />
      </div>
    </ProtectedRoute>
  );
}
