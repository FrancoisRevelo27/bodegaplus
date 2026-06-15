"use client";

import { useState, useEffect } from "react";
import { Customer, Invoice, SaleItem, Product } from "@/types/shop";
import { getCustomerByCedula, createCustomer } from "@/lib/customers";
import { createInvoice, getLatestInvoiceNumber } from "@/lib/invoices";
import { createAuditLog } from "@/lib/auditLogs";
import { useAuth } from "@/context/AuthContext";
import { downloadInvoicePDF } from "@/lib/pdfGenerator";
import { getDocs, collection, query, where, getDoc, doc, writeBatch, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function SalesManager() {
  const { user, userProfile } = useAuth();
  const [cedula, setCedula] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [ivaPercentage, setIvaPercentage] = useState(15);
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [showRegisterCustomer, setShowRegisterCustomer] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    cedula: "",
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    direccion: "",
    ciudad: "",
  });

  useEffect(() => {
    loadProducts();
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const configDoc = await getDoc(doc(db, "settings", "general"));
      if (configDoc.exists()) {
        const data = configDoc.data();
        if (data.ivaPercentage !== undefined) {
          setIvaPercentage(Number(data.ivaPercentage));
        }
      }
    } catch (err) {
      console.error("Error loading config:", err);
    }
  };

  const loadProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const productsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];
      setProducts(productsData);
    } catch (err) {
      console.error("Error loading products:", err);
    }
  };

  const registerNewCustomer = async () => {
    if (
      !newCustomerForm.cedula ||
      !newCustomerForm.nombre ||
      !newCustomerForm.apellido ||
      !newCustomerForm.email
    ) {
      setError("Campos requeridos: Cédula, Nombre, Apellido, Email");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const newCustomer = await createCustomer({
        ...newCustomerForm,
        cedula: newCustomerForm.cedula.toUpperCase(),
      });

      // Crear log de auditoría
      if (userProfile) {
        await createAuditLog({
          tipo: "registro_cliente",
          usuarioId: userProfile.uid,
          usuarioNombre: userProfile.nombre,
          usuarioEmail: userProfile.email,
          descripcion: `Nuevo cliente registrado: ${newCustomerForm.nombre} ${newCustomerForm.apellido}`,
          detalles: {
            customerCedula: newCustomerForm.cedula,
          },
        });
      }

      setSuccess("Cliente registrado. Ahora búscalo por cédula.");
      setNewCustomerForm({
        cedula: "",
        nombre: "",
        apellido: "",
        email: "",
        telefono: "",
        direccion: "",
        ciudad: "",
      });
      setShowRegisterCustomer(false);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Error al registrar cliente");
    } finally {
      setLoading(false);
    }
  };

  const searchCustomer = async () => {
    setError("");
    setCustomer(null);
    setCart([]);

    if (!cedula.trim()) {
      setError("Por favor ingrese una cédula");
      return;
    }

    try {
      setLoading(true);
      const foundCustomer = await getCustomerByCedula(cedula.toUpperCase());

      if (!foundCustomer) {
        setError("Cliente no encontrado. Debe registrar el cliente primero.");
        return;
      }

      setCustomer(foundCustomer);
      setError("");
    } catch (err: any) {
      setError(err.message || "Error al buscar cliente");
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeSearch = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && barcodeInput.trim()) {
      const product = products.find(p => 
        p.barcode?.trim() === barcodeInput.trim() || p.sku?.trim() === barcodeInput.trim()
      );
      
      if (product) {
        if (product.stock <= 0) {
          setError("Producto sin stock");
        } else {
          addItemToCart(product, 1);
          setSuccess(`Agregado: ${product.name}`);
          setTimeout(() => setSuccess(""), 2000);
        }
      } else {
        setError("Producto no encontrado por código");
      }
      setBarcodeInput("");
    }
  };

  const addItemToCart = (product: Product, qty: number) => {
    const existingItem = cart.find((c) => c.productId === product.id);
    const currentQtyInCart = existingItem ? existingItem.quantity : 0;

    if (currentQtyInCart + qty > product.stock) {
      setError(`Stock insuficiente para "${product.name}" (Disponible: ${product.stock})`);
      return;
    }

    const item: SaleItem = {
      productId: product.id!,
      productName: product.name,
      quantity: qty,
      unitPrice: product.unitPrice,
      subtotal: qty * product.unitPrice,
    };

    if (existingItem) {
      setCart(cart.map((c) => 
        c.productId === product.id 
          ? { ...c, quantity: c.quantity + qty, subtotal: (c.quantity + qty) * c.unitPrice } 
          : c
      ));
    } else {
      setCart([...cart, item]);
    }
    setError("");
  };

  const addToCart = () => {
    if (!selectedProduct || !quantity) {
      setError("Seleccione producto y cantidad");
      return;
    }

    const product = products.find((p) => p.id === selectedProduct);
    if (!product) {
      setError("Producto no encontrado");
      return;
    }

    const qty = parseInt(quantity);
    addItemToCart(product, qty);

    setSelectedProduct("");
    setQuantity("1");
    setError("");
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const iva = subtotal * (ivaPercentage / 100);
    const total = subtotal + iva;

    return { subtotal, iva, total };
  };

  const completeTransaction = async () => {
    if (!customer || !userProfile) {
      setError("Error: Cliente o usuario no disponible");
      return;
    }

    if (cart.length === 0) {
      setError("El carrito está vacío");
      return;
    }

    setLoading(true);
    setError("");

    const batch = writeBatch(db);
    const invoiceRef = doc(collection(db, "invoices"));

    try {
      const { subtotal, iva, total } = calculateTotals();
      const numeroFactura = await getLatestInvoiceNumber();

      const invoiceData: Omit<Invoice, "id" | "fechaCreacion"> = {
        numeroFactura,
        customerId: customer.id!,
        customerName: `${customer.nombre} ${customer.apellido}`.trim(),
        customerCedula: customer.cedula,
        customerEmail: customer.email,
        items: cart,
        subtotal,
        iva,
        total,
        vendedorId: userProfile.uid,
        vendedorNombre: userProfile.nombre,
        estado: "generada",
        observaciones,
      };

      // Agregar la factura al batch
      batch.set(invoiceRef, { ...invoiceData, fechaCreacion: new Date() });

      for (const item of cart) {
        const saleRef = doc(collection(db, "sales"));
        batch.set(saleRef, {
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalAmount: item.subtotal,
          fechaCreacion: new Date(),
          vendedorId: userProfile.uid,
          invoiceId: invoiceRef.id
        });

        // Actualización de stock atómica
        const productRef = doc(db, "products", item.productId);
        batch.update(productRef, { stock: increment(-item.quantity) });
      }

      // Ejecutamos todos los cambios en la base de datos de una sola vez
      await batch.commit();

      // Crear log de auditoría
      await createAuditLog({
        tipo: "venta",
        usuarioId: userProfile.uid,
        usuarioNombre: userProfile.nombre,
        usuarioEmail: userProfile.email,
        descripcion: `Venta realizada a ${customer.nombre} ${customer.apellido}`,
        detalles: {
          invoiceId: invoiceRef.id,
          customerCedula: customer.cedula,
          total,
          itemsCount: cart.length,
        },
      });

      // Descargar PDF
      const invoiceForPDF = { ...invoiceData, id: invoiceRef.id, fechaCreacion: new Date() } as Invoice;
      downloadInvoicePDF(invoiceForPDF);

      setSuccess("Factura generada y descargada exitosamente");
      setCart([]);
      setCedula("");
      setCustomer(null);
      setObservaciones("");

      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Error al completar la venta");
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, iva, total } = calculateTotals();

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Gestor de Ventas</h2>
        <p className="text-sm text-zinc-600">Genera facturas rápidas y descuenta stock automáticamente.</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-2xl text-sm border border-red-100">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-sm border border-emerald-100">
          {success}
        </div>
      )}

      {/* Búsqueda de cliente */}
      <div className="mb-8 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-6">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-500">1. Identificación del Cliente</h3>
        
        {!showRegisterCustomer ? (
          <div className="flex flex-wrap gap-2 mb-4">
            <input
              type="text"
              placeholder="Ingrese cédula del cliente"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && searchCustomer()}
              className="min-w-[240px] flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-slate-900"
              disabled={!!customer}
            />
            <button
              onClick={searchCustomer}
              disabled={loading || !!customer}
              className="rounded-full bg-slate-950 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Buscando..." : "Buscar"}
            </button>
            <button
              onClick={() => setShowRegisterCustomer(true)}
              className="rounded-full border border-zinc-300 bg-white px-6 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              + Nuevo Cliente
            </button>
            {customer && (
              <button
                onClick={() => {
                  setCustomer(null);
                  setCedula("");
                  setCart([]);
                }}
                className="rounded-full bg-zinc-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
              >
                Limpiar
              </button>
            )}
          </div>
        ) : (
          <div className="mb-4 p-6 border border-zinc-200 rounded-2xl bg-white shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-zinc-800">Registrar Nuevo Cliente</h4>
              <button
                onClick={() => setShowRegisterCustomer(false)}
                className="text-gray-500 hover:text-gray-700 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <input
                type="text"
                placeholder="Cédula *"
                value={newCustomerForm.cedula}
                onChange={(e) =>
                  setNewCustomerForm({ ...newCustomerForm, cedula: e.target.value })
                }
                className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-slate-900"
              />
              <input
                type="text"
                placeholder="Nombre *"
                value={newCustomerForm.nombre}
                onChange={(e) =>
                  setNewCustomerForm({ ...newCustomerForm, nombre: e.target.value })
                }
                className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-slate-900"
              />
              <input
                type="text"
                placeholder="Apellido *"
                value={newCustomerForm.apellido}
                onChange={(e) =>
                  setNewCustomerForm({ ...newCustomerForm, apellido: e.target.value })
                }
                className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-slate-900"
              />
              <input
                type="email"
                placeholder="Email *"
                value={newCustomerForm.email}
                onChange={(e) =>
                  setNewCustomerForm({ ...newCustomerForm, email: e.target.value })
                }
                className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-slate-900"
              />
              <input
                type="tel"
                placeholder="Teléfono"
                value={newCustomerForm.telefono}
                onChange={(e) =>
                  setNewCustomerForm({ ...newCustomerForm, telefono: e.target.value })
                }
                className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-slate-900"
              />
              <input
                type="text"
                placeholder="Ciudad"
                value={newCustomerForm.ciudad}
                onChange={(e) =>
                  setNewCustomerForm({ ...newCustomerForm, ciudad: e.target.value })
                }
                className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-slate-900"
              />
              <input
                type="text"
                placeholder="Dirección"
                value={newCustomerForm.direccion}
                onChange={(e) =>
                  setNewCustomerForm({ ...newCustomerForm, direccion: e.target.value })
                }
                className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-slate-900 md:col-span-2"
              />
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-100">
              <button
                onClick={registerNewCustomer}
                disabled={loading}
                className="flex-1 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? "Guardando..." : "Guardar Cliente"}
              </button>
            </div>
          </div>
        )}

        {customer && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="font-semibold">{customer.nombre} {customer.apellido}</p>
            <p className="text-sm text-gray-600">Cédula: {customer.cedula}</p>
            <p className="text-sm text-gray-600">Email: {customer.email}</p>
            <p className="text-sm text-gray-600">Teléfono: {customer.telefono}</p>
          </div>
        )}
      </div>

      {customer && (
        <>
          {/* Agregar productos */}
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">2. Agregar Productos</h3>
            
            <div className="mb-4">
              <label className="text-xs font-bold text-zinc-500 uppercase">Escanear Código de Barras / SKU</label>
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={handleBarcodeSearch}
                placeholder="Pase el escáner o escriba el código..."
                className="mt-1 w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-slate-900 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4">
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="sm:col-span-7 px-3 py-2 border rounded-xl bg-white outline-none focus:border-slate-900"
              >
                <option value="">Seleccione un producto</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} (Stock: {product.stock}) - ${product.unitPrice.toFixed(2)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Cantidad"
                className="sm:col-span-2 px-3 py-2 border rounded-xl bg-white outline-none focus:border-slate-900"
              />
              <button
                onClick={addToCart}
                className="sm:col-span-3 px-4 py-2 bg-emerald-600 text-white font-bold rounded-full hover:bg-emerald-700 transition"
              >
                Agregar
              </button>
            </div>
          </div>

          {/* Carrito */}
          <div className="mb-6 p-4 border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">3. Detalle de la Venta</h3>
            {cart.length === 0 ? (
              <p className="text-gray-500">El carrito está vacío</p>
            ) : (
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="p-2 text-left">Producto</th>
                      <th className="p-2 text-center">Cantidad</th>
                      <th className="p-2 text-center">Precio Unitario</th>
                      <th className="p-2 text-center">Subtotal</th>
                      <th className="p-2 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => (
                      <tr key={item.productId} className="border-b hover:bg-gray-50">
                        <td className="p-2">{item.productName}</td>
                        <td className="p-2 text-center">{item.quantity}</td>
                        <td className="p-2 text-center">${item.unitPrice.toFixed(2)}</td>
                        <td className="p-2 text-center font-semibold">
                          ${item.subtotal.toFixed(2)}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Observaciones */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Observaciones (opcional)</label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Agregar notas sobre la venta..."
                className="w-full px-3 py-2 border rounded"
                rows={3}
              />
            </div>

            {/* Totales */}
            <div className="p-4 bg-blue-50 rounded border border-blue-200">
              <div className="flex justify-between mb-2">
                <span className="font-semibold">Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-semibold">IVA ({ivaPercentage}%):</span>
                <span>${iva.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>TOTAL:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Botón de finalizar */}
            <button
              onClick={completeTransaction}
              disabled={loading || cart.length === 0}
              className="mt-4 w-full px-4 py-3 bg-green-600 text-white font-bold rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Procesando..." : "Generar Factura y Descargar PDF"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
