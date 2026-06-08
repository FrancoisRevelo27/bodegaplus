import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Expense, Product, Sale } from "@/types/shop";

export async function addProduct(product: Omit<Product, "id">) {
  return await addDoc(collection(db, "products"), {
    ...product,
    createdAt: serverTimestamp(),
  });
}

export async function updateProduct(productId: string, updates: Partial<Product>) {
  return await updateDoc(doc(db, "products", productId), {
    ...updates,
  });
}

export async function deleteProduct(productId: string) {
  return await deleteDoc(doc(db, "products", productId));
}

export async function fetchProducts() {
  const productsQuery = query(collection(db, "products"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(productsQuery);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Product) }));
}

export async function addSale(sale: Omit<Sale, "id">) {
  const saleRef = collection(db, "sales");
  const productRef = doc(db, "products", sale.productId);

  return await runTransaction(db, async (transaction) => {
    const productSnapshot = await transaction.get(productRef);
    if (!productSnapshot.exists()) {
      throw new Error("El producto no existe");
    }

    const currentStock = productSnapshot.data()?.stock ?? 0;
    if (currentStock < sale.quantity) {
      throw new Error("Stock insuficiente");
    }

    transaction.update(productRef, {
      stock: currentStock - sale.quantity,
    });

    return await addDoc(saleRef, {
      ...sale,
      createdAt: serverTimestamp(),
    });
  });
}

export async function fetchSales() {
  const salesQuery = query(collection(db, "sales"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(salesQuery);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Sale) }));
}

export async function addExpense(expense: Omit<Expense, "id">) {
  return await addDoc(collection(db, "expenses"), {
    ...expense,
    createdAt: serverTimestamp(),
  });
}

export async function fetchExpenses() {
  const expenseQuery = query(collection(db, "expenses"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(expenseQuery);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Expense) }));
}

export async function fetchLowStockProducts(threshold = 5) {
  const lowStockQuery = query(collection(db, "products"), where("stock", "<=", threshold));
  const snapshot = await getDocs(lowStockQuery);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Product) }));
}
