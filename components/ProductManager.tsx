"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/types/shop";
import {
  addProduct,
  deleteProduct,
  fetchProducts,
  updateProduct,
} from "@/lib/firestore";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function ProductManager({ onProductsUpdated }: { onProductsUpdated: (products: Product[]) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", sku: "", unitPrice: "", stock: "" });
  const [operationId, setOperationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchProducts();
      setProducts(items);
      onProductsUpdated(items);
    } catch (err) {
      setError("No se pudieron cargar los productos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOperationId("add");
    setError(null);
    try {
      await addProduct({
        name: form.name,
        sku: form.sku,
        unitPrice: Number(form.unitPrice),
        stock: Number(form.stock),
      });
      setForm({ name: "", sku: "", unitPrice: "", stock: "" });
      await loadProducts();
    } catch (err) {
      setError("Error al agregar el producto. Revisa los datos.");
    } finally {
      setOperationId(null);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDelete = async (productId: string) => {
    setOperationId(productId);
    setError(null);
    try {
      await deleteProduct(productId);
      await loadProducts();
    } catch (err) {
      setError("No se pudo eliminar el producto.");
    } finally {
      setOperationId(null);
    }
  };

  const handleUpdate = async (product: Product) => {
    setOperationId(product.id ?? null);
    setError(null);
    try {
      await updateProduct(product.id!, {
        name: product.name,
        sku: product.sku,
        unitPrice: product.unitPrice,
        stock: product.stock,
      });
      await loadProducts();
    } catch (err) {
      setError("No se pudo actualizar el producto.");
    } finally {
      setOperationId(null);
    }
  };

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Productos</h2>
          <p className="text-sm text-zinc-600">Administra el inventario y actualiza el stock.</p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="mt-6 grid gap-3 md:grid-cols-4">
        <input
          value={form.name}
          onChange={(e) => handleFieldChange("name", e.target.value)}
          placeholder="Nombre"
          className="rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
          required
        />
        <input
          value={form.sku}
          onChange={(e) => handleFieldChange("sku", e.target.value)}
          placeholder="Código de producto"
          className="rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
          required
        />
        <input
          value={form.unitPrice}
          onChange={(e) => handleFieldChange("unitPrice", e.target.value)}
          placeholder="Precio unitario"
          type="number"
          min="0"
          step="0.01"
          className="rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
          required
        />
        <input
          value={form.stock}
          onChange={(e) => handleFieldChange("stock", e.target.value)}
          placeholder="Stock"
          type="number"
          min="0"
          className="rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
          required
        />
        <button
          type="submit"
          disabled={operationId === "add"}
          className="col-span-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-1"
        >
          {operationId === "add" ? "Agregando..." : "Agregar producto"}
        </button>
      </form>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-8 overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead>
              <tr className="bg-zinc-50 text-left text-zinc-700">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Código de producto</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {products.map((product) => (
                <tr key={product.id} className={product.stock <= 5 ? "bg-amber-50" : ""}>
                  <td className="px-4 py-3">
                    <input
                      value={product.name}
                      onChange={(event) =>
                        setProducts((current) =>
                          current.map((item) =>
                            item.id === product.id ? { ...item, name: event.target.value } : item
                          )
                        )
                      }
                      className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm outline-none"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      value={product.sku}
                      onChange={(event) =>
                        setProducts((current) =>
                          current.map((item) =>
                            item.id === product.id ? { ...item, sku: event.target.value } : item
                          )
                        )
                      }
                      className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm outline-none"
                    />
                  </td>
                  <td className="px-4 py-3 w-32">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={product.unitPrice}
                      onChange={(event) =>
                        setProducts((current) =>
                          current.map((item) =>
                            item.id === product.id ? { ...item, unitPrice: Number(event.target.value) } : item
                          )
                        )
                      }
                      className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm outline-none"
                    />
                  </td>
                  <td className="px-4 py-3 w-28">
                    <input
                      type="number"
                      min="0"
                      value={product.stock}
                      onChange={(event) =>
                        setProducts((current) =>
                          current.map((item) =>
                            item.id === product.id ? { ...item, stock: Number(event.target.value) } : item
                          )
                        )
                      }
                      className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm outline-none"
                    />
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <button
                      type="button"
                      onClick={() => handleUpdate(product)}
                      disabled={operationId === product.id}
                      className="rounded-full bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(product.id!)}
                      disabled={operationId === product.id}
                      className="rounded-full bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
