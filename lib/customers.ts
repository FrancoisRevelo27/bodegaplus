import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Customer } from "@/types/shop";

const CUSTOMERS_COLLECTION = "customers";

export async function createCustomer(customer: Omit<Customer, "id" | "createdAt">) {
  try {
    const docRef = await addDoc(collection(db, CUSTOMERS_COLLECTION), {
      ...customer,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return { id: docRef.id, ...customer };
  } catch (error) {
    console.error("Error creating customer:", error);
    throw error;
  }
}

export async function updateCustomer(id: string, updates: Partial<Customer>) {
  try {
    const docRef = doc(db, CUSTOMERS_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
    return { id, ...updates };
  } catch (error) {
    console.error("Error updating customer:", error);
    throw error;
  }
}

export async function deleteCustomer(id: string) {
  try {
    await deleteDoc(doc(db, CUSTOMERS_COLLECTION, id));
    return true;
  } catch (error) {
    console.error("Error deleting customer:", error);
    throw error;
  }
}

export async function getCustomerByCedula(cedula: string): Promise<Customer | null> {
  try {
    const q = query(collection(db, CUSTOMERS_COLLECTION), where("cedula", "==", cedula));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Customer;
  } catch (error) {
    console.error("Error getting customer by cedula:", error);
    throw error;
  }
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  try {
    const docSnap = await getDoc(doc(db, CUSTOMERS_COLLECTION, id));
    if (!docSnap.exists()) {
      return null;
    }
    return { id: docSnap.id, ...docSnap.data() } as Customer;
  } catch (error) {
    console.error("Error getting customer by id:", error);
    throw error;
  }
}

export async function getAllCustomers(): Promise<Customer[]> {
  try {
    const querySnapshot = await getDocs(collection(db, CUSTOMERS_COLLECTION));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Customer[];
  } catch (error) {
    console.error("Error getting customers:", error);
    throw error;
  }
}

export async function searchCustomers(searchTerm: string): Promise<Customer[]> {
  try {
    // Firebase doesn't support full-text search, so we fetch all and filter
    const customers = await getAllCustomers();
    const term = searchTerm.toLowerCase();

    return customers.filter(
      (c) =>
        c.nombre.toLowerCase().includes(term) ||
        c.apellido.toLowerCase().includes(term) ||
        c.cedula.includes(term) ||
        c.email.toLowerCase().includes(term)
    );
  } catch (error) {
    console.error("Error searching customers:", error);
    throw error;
  }
}
