"use client";

import { useState, useEffect } from "react";
import { Customer, Invoice, SaleItem, Product } from "@/types/shop";
import { getCustomerByCedula, createCustomer } from "@/lib/customers";
import { createInvoice, getLatestInvoiceNumber } from "@/lib/invoices";
import { createAuditLog } from "@/lib/auditLogs";
import { useAuth } from "@/context/AuthContext";
import { downloadInvoicePDF } from "@/lib/pdfGenerator";
import { getDocs, collection, query, where, getDoc, doc, updateDoc, increment, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function SalesManager() {
  const { user, userProfile } = useAuth();
  const [cedula, setCedula] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [ivaPercentage, setIvaPercentage] = useState(12);
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
    if (qty <= 0 || qty > product.stock) {
      setError(`Cantidad inválida o stock insuficiente (disponible: ${product.stock})`);
      return;
    }

    const item: SaleItem = {
      productId: product.id!,
      productName: product.name,
      quantity: qty,
      unitPrice: product.unitPrice,
      subtotal: qty * product.unitPrice,
    };

    // Verificar si el producto ya está en el carrito
    const existingItem = cart.find((c) => c.productId === product.id);
    if (existingItem) {
      // Actualizar cantidad
      const newQty = existingItem.quantity + qty;
      if (newQty > product.stock) {
        setError(`No hay suficiente stock para esta cantidad (disponible: ${product.stock})`);
        return;
      }
      setCart(
        cart.map((c) =>
          c.productId === product.id
            ? {
                ...c,
                quantity: newQty,
                subtotal: newQty * c.unitPrice,
              }
            : c
        )
      );
    } else {
      setCart([...cart, item]);
    }

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

    try {
      const { subtotal, iva, total } = calculateTotals();
      const numeroFactura = await getLatestInvoiceNumber();

      const invoice: Omit<Invoice, "id" | "fechaCreacion"> = {
        numeroFactura,
        customerId: customer.id!,
        customerName: `${customer.nombre} ${customer.apellido}`,
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

      const createdInvoice = await createInvoice(invoice);

      // REGISTRO PARA REPORTES: Guardar cada item en la colección 'sales'
      for (const item of cart) {
        await addDoc(collection(db, "sales"), {
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalAmount: item.subtotal,
          fechaCreacion: new Date(),
          vendedorId: userProfile.uid
        });
      }

      // ACTUALIZACIÓN DE STOCK: Descontar productos vendidos
      for (const item of cart) {
        const productRef = doc(db, "products", item.productId);
        await updateDoc(productRef, {
          stock: increment(-item.quantity)
        });
      }

      // Crear log de auditoría
      await createAuditLog({
        tipo: "venta",
        usuarioId: userProfile.uid,
        usuarioNombre: userProfile.nombre,
        usuarioEmail: userProfile.email,
        descripcion: `Venta realizada a ${customer.nombre} ${customer.apellido}`,
        detalles: {
          invoiceId: createdInvoice.id,
          customerCedula: customer.cedula,
          total,
          itemsCount: cart.length,
        },
      });

      // Descargar PDF
      const invoiceWithId = { ...createdInvoice, id: createdInvoice.id || "" } as Invoice;
      downloadInvoicePDF(invoiceWithId);

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
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Gestor de Ventas</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* Búsqueda de cliente */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">1. Buscar o Registrar Cliente</h3>
        
        {!showRegisterCustomer ? (
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Ingrese cédula del cliente"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && searchCustomer()}
              className="flex-1 px-3 py-2 border rounded"
              disabled={!!customer}
            />
            <button
              onClick={searchCustomer}
              disabled={loading || !!customer}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Buscando..." : "Buscar"}
            </button>
            <button
              onClick={() => setShowRegisterCustomer(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
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
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Limpiar
              </button>
            )}
          </div>
        ) : (
          <div className="mb-4 p-4 border rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold">Registrar Nuevo Cliente</h4>
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
                className="px-3 py-2 border rounded text-sm"
              />
              <input
                type="text"
                placeholder="Nombre *"
                value={newCustomerForm.nombre}
                onChange={(e) =>
                  setNewCustomerForm({ ...newCustomerForm, nombre: e.target.value })
                }
                className="px-3 py-2 border rounded text-sm"
              />
              <input
                type="text"
                placeholder="Apellido *"
                value={newCustomerForm.apellido}
                onChange={(e) =>
                  setNewCustomerForm({ ...newCustomerForm, apellido: e.target.value })
                }
                className="px-3 py-2 border rounded text-sm"
              />
              <input
                type="email"
                placeholder="Email *"
                value={newCustomerForm.email}
                onChange={(e) =>
                  setNewCustomerForm({ ...newCustomerForm, email: e.target.value })
                }
                className="px-3 py-2 border rounded text-sm"
              />
              <input
                type="tel"
                placeholder="Teléfono"
                value={newCustomerForm.telefono}
                onChange={(e) =>
                  setNewCustomerForm({ ...newCustomerForm, telefono: e.target.value })
                }
                className="px-3 py-2 border rounded text-sm"
              />
              <input
                type="text"
                placeholder="Ciudad"
                value={newCustomerForm.ciudad}
                onChange={(e) =>
                  setNewCustomerForm({ ...newCustomerForm, ciudad: e.target.value })
                }
                className="px-3 py-2 border rounded text-sm"
              />
              <input
                type="text"
                placeholder="Dirección"
                value={newCustomerForm.direccion}
                onChange={(e) =>
                  setNewCustomerForm({ ...newCustomerForm, direccion: e.target.value })
                }
                className="px-3 py-2 border rounded text-sm md:col-span-2"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={registerNewCustomer}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Guardando..." : "Guardar Cliente"}
              </button>
              <button
                onClick={() => setShowRegisterCustomer(false)}
                className="flex-1 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Cancelar
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
            <div className="flex gap-2 mb-4">
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="flex-1 px-3 py-2 border rounded"
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
                className="w-24 px-3 py-2 border rounded"
              />
              <button
                onClick={addToCart}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
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
