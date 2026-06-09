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
import { useAuth } from "@/context/AuthContext";
import { createAuditLog } from "@/lib/auditLogs";

export default function ProductManager({ onProductsUpdated }: { onProductsUpdated: (products: Product[]) => void }) {
  const { userProfile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", sku: "", unitPrice: "", stock: "" });

  // Estados para el ingreso de stock
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQty, setRestockAmount] = useState("");
  const [restockPrice, setRestockPrice] = useState("");

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

    // Validar SKU único
    const existing = products.find(p => p.sku.toLowerCase() === form.sku.toLowerCase());
    if (existing) {
      setError(`El código ${form.sku} ya pertenece al producto "${existing.name}". Use "Ingresar Stock" en la tabla.`);
      setOperationId(null);
      return;
    }

    try {
      await addProduct({
        name: form.name,
        sku: form.sku,
        unitPrice: Number(form.unitPrice),
        stock: Number(form.stock),
      });

      if (userProfile) {
        await createAuditLog({
          tipo: "ingreso_producto",
          usuarioId: userProfile.uid,
          usuarioNombre: userProfile.nombre,
          usuarioEmail: userProfile.email,
          descripcion: `Producto agregado: ${form.name}`,
          detalles: {
            productSku: form.sku,
            precio: Number(form.unitPrice),
            stock: Number(form.stock)
          },
        });
      }

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
      const productToDelete = products.find(p => p.id === productId);
      if (userProfile && productToDelete) {
        await createAuditLog({
          tipo: "eliminacion_producto",
          usuarioId: userProfile.uid,
          usuarioNombre: userProfile.nombre,
          usuarioEmail: userProfile.email,
          descripcion: `Producto eliminado: ${productToDelete.name}`,
          detalles: {
            productId,
            productSku: productToDelete.sku
          },
        });
      }
      
      await deleteProduct(productId);
      await loadProducts();
    } catch (err) {
      setError("No se pudo eliminar el producto.");
    } finally {
      setOperationId(null);
    }
  };

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct || !restockQty) return;
    
    setOperationId(restockProduct.id!);
    try {
      const addedStock = Number(restockQty);
      const newTotalStock = restockProduct.stock + addedStock;
      const updatedPrice = restockPrice ? Number(restockPrice) : restockProduct.unitPrice;

      await updateProduct(restockProduct.id!, {
        stock: newTotalStock,
        unitPrice: updatedPrice
      });

      if (userProfile) {
        await createAuditLog({
          tipo: "ingreso_stock",
          usuarioId: userProfile.uid,
          usuarioNombre: userProfile.nombre,
          usuarioEmail: userProfile.email,
          descripcion: `Ingreso de stock: ${restockProduct.name} (+${addedStock} unidades)`,
          detalles: {
            sku: restockProduct.sku,
            cantidadIngresada: addedStock,
            precioAnterior: restockProduct.unitPrice,
            precioNuevo: updatedPrice,
            stockFinal: newTotalStock
          },
        });
      }
      setRestockProduct(null);
      setRestockAmount("");
      setRestockPrice("");
      await loadProducts();
    } catch (err) { setError("Error al procesar ingreso de stock."); } finally { setOperationId(null); }
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

      if (userProfile) {
        await createAuditLog({
          tipo: "actualizacion_producto",
          usuarioId: userProfile.uid,
          usuarioNombre: userProfile.nombre,
          usuarioEmail: userProfile.email,
          descripcion: `Producto actualizado: ${product.name}`,
          detalles: {
            productId: product.id,
            nuevoPrecio: product.unitPrice,
            nuevoStock: product.stock
          },
        });
      }

      await loadProducts();
    } catch (err) {
      setError("No se pudo actualizar el producto.");
    } finally {
      setOperationId(null);
    }
  };

  return (
    <section className="col-span-full rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      {/* Modal/Overlay de Ingreso de Stock */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form onSubmit={handleRestock} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl border border-zinc-100">
            <h3 className="text-xl font-bold text-slate-950">Ingresar Stock</h3>
            <p className="mt-1 text-sm text-zinc-600">Producto: <span className="font-semibold">{restockProduct.name}</span></p>
            
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-zinc-500">Cantidad a Sumar</label>
                <input type="number" min="1" required value={restockQty} onChange={e => setRestockAmount(e.target.value)}
                  placeholder="Ej: 50" className="mt-1 w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-slate-900" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-zinc-500">Precio Unitario (Opcional)</label>
                <input type="number" step="0.01" value={restockPrice} onChange={e => setRestockPrice(e.target.value)}
                  placeholder={`Actual: $${restockProduct.unitPrice}`} className="mt-1 w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-slate-900" />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button type="submit" className="flex-1 rounded-full bg-slate-950 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition">Confirmar Ingreso</button>
              <button type="button" onClick={() => setRestockProduct(null)} className="flex-1 rounded-full border border-zinc-200 py-3 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 transition">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Inventario de Productos</h2>
          <p className="text-sm text-zinc-500">Administra existencias y precios de venta.</p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="grid gap-3 md:grid-cols-5 bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100">
        <input
          value={form.name}
          onChange={(e) => handleFieldChange("name", e.target.value)}
          placeholder="Nombre"
          className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-900 transition-all"
          required
        />
        <input
          value={form.sku}
          onChange={(e) => handleFieldChange("sku", e.target.value)}
          placeholder="Código de producto"
          className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-900 transition-all"
          required
        />
        <input
          value={form.unitPrice}
          onChange={(e) => handleFieldChange("unitPrice", e.target.value)}
          placeholder="Precio unitario"
          type="number"
          min="0"
          step="0.01"
          className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-900 transition-all"
          required
        />
        <input
          value={form.stock}
          onChange={(e) => handleFieldChange("stock", e.target.value)}
          placeholder="Stock"
          type="number"
          min="0"
          className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-900 transition-all"
          required
        />
        <button
          type="submit"
          disabled={operationId === "add"}
          className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60 shadow-sm"
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
                <th className="px-4 py-3 font-bold text-slate-700">Producto</th>
                <th className="px-4 py-3 font-bold text-slate-700">Código SKU</th>
                <th className="px-4 py-3 font-bold text-slate-700">Precio</th>
                <th className="px-4 py-3 font-bold text-slate-700 text-center">Stock</th>
                <th className="px-4 py-3 text-right font-bold text-slate-700">Acciones</th>
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
                      className="w-full rounded-lg border border-transparent hover:border-zinc-200 focus:bg-white focus:border-zinc-300 bg-transparent px-2 py-2 text-sm outline-none transition-all"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <input
                      value={product.sku}
                      onChange={(event) =>
                        setProducts((current) =>
                          current.map((item) =>
                            item.id === product.id ? { ...item, sku: event.target.value } : item
                          )
                        )
                      }
                      className="w-full rounded-lg border border-transparent hover:border-zinc-200 focus:bg-white focus:border-zinc-300 bg-transparent px-2 py-2 text-sm font-mono text-xs outline-none transition-all"
                    />
                  </td>
                  <td className="px-4 py-4 w-28">
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
                      className="w-full rounded-lg border border-transparent hover:border-zinc-200 focus:bg-white focus:border-zinc-300 bg-transparent px-2 py-2 text-sm outline-none transition-all"
                    />
                  </td>
                  <td className="px-4 py-4 w-24 text-center">
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
                      className="w-full text-center rounded-lg border border-transparent hover:border-zinc-200 focus:bg-white focus:border-zinc-300 bg-transparent px-2 py-2 text-sm outline-none transition-all font-bold"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => { setRestockProduct(product); setRestockPrice(product.unitPrice.toString()); }}
                        className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
                      >
                        + Stock
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdate(product)}
                        disabled={operationId === product.id}
                        className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product.id!)}
                        disabled={operationId === product.id}
                        className="inline-flex items-center rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 border border-red-100 transition-colors disabled:opacity-50"
                      >
                        Borrar
                      </button>
                    </div>
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
