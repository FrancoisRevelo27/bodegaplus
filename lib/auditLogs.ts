import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
  limit,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "./firebase";
import { AuditLog } from "@/types/shop";

const AUDIT_COLLECTION = "audit_logs";

export async function createAuditLog(auditLog: Omit<AuditLog, "id" | "fechaCreacion">) {
  try {
    const docRef = await addDoc(collection(db, AUDIT_COLLECTION), {
      ...auditLog,
      fechaCreacion: Timestamp.now(),
    });
    return { id: docRef.id, ...auditLog };
  } catch (error) {
    console.error("Error creating audit log:", error);
    throw error;
  }
}

export async function getAuditLogsByUser(userId: string): Promise<AuditLog[]> {
  try {
    const q = query(
      collection(db, AUDIT_COLLECTION),
      where("usuarioId", "==", userId),
      orderBy("fechaCreacion", "desc"),
      limit(500)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AuditLog[];
  } catch (error) {
    console.error("Error getting audit logs by user:", error);
    throw error;
  }
}

export async function getAuditLogsByType(tipo: AuditLog["tipo"]): Promise<AuditLog[]> {
  try {
    const q = query(
      collection(db, AUDIT_COLLECTION),
      where("tipo", "==", tipo),
      orderBy("fechaCreacion", "desc"),
      limit(1000)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AuditLog[];
  } catch (error) {
    console.error("Error getting audit logs by type:", error);
    throw error;
  }
}

export async function getAuditLogsByProduct(productId: string): Promise<AuditLog[]> {
  try {
    const q = query(
      collection(db, AUDIT_COLLECTION),
      where("detalles.productId", "==", productId),
      orderBy("fechaCreacion", "desc"),
      limit(500)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AuditLog[];
  } catch (error) {
    console.error("Error getting audit logs by product:", error);
    throw error;
  }
}

export async function getAllAuditLogs(): Promise<AuditLog[]> {
  try {
    const q = query(collection(db, AUDIT_COLLECTION), orderBy("fechaCreacion", "desc"), limit(1000));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AuditLog[];
  } catch (error) {
    console.error("Error getting all audit logs:", error);
    throw error;
  }
}
