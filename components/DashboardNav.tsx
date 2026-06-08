"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardNav() {
  const { userProfile, isAdmin, logout } = useAuth();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const menuItems = [
    { href: "/dashboard", label: "Dashboard", roles: ["admin"] },
    { href: "/clientes", label: "Clientes", roles: ["admin", "empleado"] },
    { href: "/ventas", label: "Ventas", roles: ["admin", "empleado"] },
    { href: "/auditoria", label: "Auditoría", roles: ["admin"] },
    { href: "/configuracion", label: "Configuración", roles: ["admin"] },
    { href: "/usuarios", label: "Usuarios", roles: ["admin"] },
  ];

  const visibleItems = menuItems.filter((item) => {
    if (!userProfile) return false;
    return item.roles.includes(userProfile.rol);
  });

  return (
    <nav className="bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-bold">
              BodegaPlus
            </Link>
          </div>

          {/* Menu items */}
          <div className="hidden md:flex items-center gap-1">
            {visibleItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive(item.href)
                    ? "bg-slate-700 text-white"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* User info and logout */}
          <div className="flex items-center gap-4">
            <div className="text-sm hidden sm:block">
              <p className="font-semibold">{userProfile?.nombre}</p>
              <p className="text-slate-400 text-xs">
                {userProfile?.rol === "admin" ? "Administrador" : "Empleado"}
              </p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm font-semibold transition"
            >
              Salir
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden flex gap-1 pb-3 flex-wrap">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-md text-xs font-medium transition ${
                isActive(item.href)
                  ? "bg-slate-700 text-white"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
