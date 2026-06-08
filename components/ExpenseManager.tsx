"use client";

import { useEffect, useState } from "react";
import type { Expense } from "@/types/shop";
import { addExpense, fetchExpenses } from "@/lib/firestore";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";

export default function ExpenseManager({ onExpensesUpdated }: { onExpensesUpdated: (expenses: Expense[]) => void }) {
  const { isAdmin } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [operation, setOperation] = useState(false);

  // Si no es admin, no mostrar nada
  if (!isAdmin?.()) {
    return null;
  }

  const loadExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchExpenses();
      setExpenses(items);
      onExpensesUpdated(items);
    } catch (err) {
      setError("No se pudieron cargar los gastos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setOperation(true);

    try {
      await addExpense({
        description,
        amount: Number(amount),
      });
      setDescription("");
      setAmount("");
      await loadExpenses();
    } catch (err) {
      setError("No se pudo registrar el gasto.");
    } finally {
      setOperation(false);
    }
  };

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Gastos</h2>
          <p className="text-sm text-zinc-600">Registra gastos operativos y controla sus totales.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-3 md:grid-cols-3">
        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Descripción"
          className="rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
          required
        />
        <input
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="Monto"
          type="number"
          min="0"
          step="0.01"
          className="rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
          required
        />
        <button
          type="submit"
          disabled={operation}
          className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {operation ? "Guardando..." : "Registrar gasto"}
        </button>
      </form>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <div className="mt-8 overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead>
              <tr className="bg-zinc-50 text-left text-zinc-700">
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td className="px-4 py-3">{expense.description}</td>
                  <td className="px-4 py-3">${expense.amount.toFixed(2)}</td>
                  <td className="px-4 py-3">{expense.createdAt?.toDate ? expense.createdAt.toDate().toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
