import {
  collection,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  Timestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";
import { Invoice, SaleItem } from "@/types/shop";

const INVOICES_COLLECTION = "invoices";

export async function createInvoice(invoice: Omit<Invoice, "id" | "fechaCreacion">) {
  try {
    const docRef = await addDoc(collection(db, INVOICES_COLLECTION), {
      ...invoice,
      fechaCreacion: Timestamp.now(),
    });
    return { id: docRef.id, ...invoice };
  } catch (error) {
    console.error("Error creating invoice:", error);
    throw error;
  }
}

export async function updateInvoice(id: string, updates: Partial<Invoice>) {
  try {
    const docRef = doc(db, INVOICES_COLLECTION, id);
    await updateDoc(docRef, updates);
    return { id, ...updates };
  } catch (error) {
    console.error("Error updating invoice:", error);
    throw error;
  }
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  try {
    const docSnap = await getDoc(doc(db, INVOICES_COLLECTION, id));
    if (!docSnap.exists()) {
      return null;
    }
    return { id: docSnap.id, ...docSnap.data() } as Invoice;
  } catch (error) {
    console.error("Error getting invoice:", error);
    throw error;
  }
}

export async function getInvoicesByCustomer(customerId: string): Promise<Invoice[]> {
  try {
    const q = query(
      collection(db, INVOICES_COLLECTION),
      where("customerId", "==", customerId),
      orderBy("fechaCreacion", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Invoice[];
  } catch (error) {
    console.error("Error getting invoices by customer:", error);
    throw error;
  }
}

export async function getInvoicesByVendor(vendedorId: string): Promise<Invoice[]> {
  try {
    const q = query(
      collection(db, INVOICES_COLLECTION),
      where("vendedorId", "==", vendedorId),
      orderBy("fechaCreacion", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Invoice[];
  } catch (error) {
    console.error("Error getting invoices by vendor:", error);
    throw error;
  }
}

export async function getAllInvoices(): Promise<Invoice[]> {
  try {
    const q = query(collection(db, INVOICES_COLLECTION), orderBy("fechaCreacion", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Invoice[];
  } catch (error) {
    console.error("Error getting all invoices:", error);
    throw error;
  }
}

export async function getLatestInvoiceNumber(): Promise<string> {
  try {
    const q = query(collection(db, INVOICES_COLLECTION), orderBy("fechaCreacion", "desc"), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return "FAC-001";
    }

    const lastInvoice = querySnapshot.docs[0].data();
    const lastNumber = parseInt(lastInvoice.numeroFactura.split("-")[1]) || 0;
    const nextNumber = (lastNumber + 1).toString().padStart(3, "0");

    return `FAC-${nextNumber}`;
  } catch (error) {
    console.error("Error getting latest invoice number:", error);
    return "FAC-001";
  }
}
