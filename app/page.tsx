import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl rounded-3xl border border-zinc-200 bg-white p-10 shadow-lg shadow-zinc-200/40">
        <div className="space-y-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight">BodegaPlus</h1>
          <p className="mx-auto max-w-2xl text-lg leading-8 text-zinc-600">
            Sistema ligero para bodegas pequeñas con inventario, ventas, gastos y reportes.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/setup"
              className="rounded-full border border-slate-950 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              Configuración Inicial
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
