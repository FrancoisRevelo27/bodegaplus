import {
  collection,
  addDoc,
  updateDoc,
  query,
  getDocs,
  getDoc,
  doc,
  Timestamp,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { EmailConfig } from "@/types/shop";

const EMAIL_CONFIG_COLLECTION = "email_config";

export async function saveEmailConfig(config: Omit<EmailConfig, "id" | "createdAt">) {
  try {
    // Check if config already exists
    const querySnapshot = await getDocs(collection(db, EMAIL_CONFIG_COLLECTION));

    if (!querySnapshot.empty) {
      // Update existing
      const docId = querySnapshot.docs[0].id;
      const docRef = doc(db, EMAIL_CONFIG_COLLECTION, docId);
      await updateDoc(docRef, {
        ...config,
        updatedAt: Timestamp.now(),
      });
      return { id: docId, ...config };
    }

    // Create new
    const docRef = await addDoc(collection(db, EMAIL_CONFIG_COLLECTION), {
      ...config,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return { id: docRef.id, ...config };
  } catch (error) {
    console.error("Error saving email config:", error);
    throw error;
  }
}

export async function getEmailConfig(): Promise<EmailConfig | null> {
  try {
    const querySnapshot = await getDocs(collection(db, EMAIL_CONFIG_COLLECTION));

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as EmailConfig;
  } catch (error) {
    console.error("Error getting email config:", error);
    throw error;
  }
}

export async function deleteEmailConfig() {
  try {
    const querySnapshot = await getDocs(collection(db, EMAIL_CONFIG_COLLECTION));

    if (!querySnapshot.empty) {
      const docId = querySnapshot.docs[0].id;
      await deleteDoc(doc(db, EMAIL_CONFIG_COLLECTION, docId));
    }

    return true;
  } catch (error) {
    console.error("Error deleting email config:", error);
    throw error;
  }
}
