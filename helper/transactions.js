"use client";

import { db } from "@/firebase/config";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
  limit,
  getDoc // Added missing import
} from "firebase/firestore";

const TRANSACTIONS_COLLECTION = "transactions";

// Use RRA compliant transaction instead
export { addRRACompliantTransaction as addTransaction } from "./rraCompliance";

export const getTransactions = async (userId, filters = {}) => {
  try {
    let q = collection(db, TRANSACTIONS_COLLECTION);
    
    const constraints = [
      where("pharmacyId", "==", userId)
    ];
    
    if (filters.fromDate) {
      constraints.push(where("date", ">=", filters.fromDate));
    }
    
    if (filters.toDate) {
      constraints.push(where("date", "<=", filters.toDate));
    }
    
    if (filters.medicine) {
      constraints.push(where("medicine", "==", filters.medicine));
    }
    
    if (filters.status && filters.status !== "") {
      constraints.push(where("status", "==", filters.status));
    }
    
    if (filters.isVoided !== undefined) {
      constraints.push(where("isVoided", "==", filters.isVoided));
    }
    
    // RRA: Order by receipt number for proper sequence
    constraints.push(orderBy("receiptNumber", "desc"));
    
    // Pagination
    if (filters.limit) {
      constraints.push(limit(filters.limit));
    }
    
    q = query(q, ...constraints);
    
    const querySnapshot = await getDocs(q);
    const transactions = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        ...data,
        // Make sure all optional fields have default values
        prescriberName: data.prescriberName || "",
        patientName: data.patientName || "",
        prescriptionNumber: data.prescriptionNumber || "",
        patientId: data.patientId || "",
        date: data.date || data.createdAt?.toDate().toISOString().split('T')[0],
        displayDate: formatDisplayDate(data.date),
        formattedTotal: formatRwf(data.total)
      });
    });
    
    return { 
      success: true, 
      data: transactions,
      total: transactions.length
    };
  } catch (error) {
    console.error("Error getting transactions: ", error);
    return { success: false, error: error.message };
  }
};

// FDA: Get prescription transactions - FIXED with proper filtering
export const getPrescriptionTransactions = async (userId, filters = {}) => {
  try {
    let q = collection(db, TRANSACTIONS_COLLECTION);
    
    // Only show transactions that have prescription info (not necessarily all fields filled)
    const constraints = [
      where("pharmacyId", "==", userId),
      // Show transactions where any prescription field is filled
      where("requiresPrescription", "==", true)
    ];
    
    if (filters.fromDate) {
      constraints.push(where("date", ">=", filters.fromDate));
    }
    
    if (filters.toDate) {
      constraints.push(where("date", "<=", filters.toDate));
    }
    
    if (filters.medicine) {
      constraints.push(where("medicine", "==", filters.medicine));
    }
    
    // Optional: Filter by specific prescription field
    if (filters.hasPrescriberName) {
      constraints.push(where("prescriberName", "!=", ""));
    }
    
    constraints.push(orderBy("date", "desc"));
    
    q = query(q, ...constraints);
    
    const querySnapshot = await getDocs(q);
    const transactions = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        ...data,
        // Set defaults for optional fields
        prescriberName: data.prescriberName || "N/A",
        patientName: data.patientName || "N/A",
        prescriptionNumber: data.prescriptionNumber || "N/A",
        patientId: data.patientId || "N/A",
        date: data.date,
        displayDate: formatDisplayDate(data.date)
      });
    });
    
    return { 
      success: true, 
      data: transactions,
      message: `${transactions.length} ibikorwa by'ibirego byabonetse`
    };
  } catch (error) {
    console.error("Error getting prescription transactions: ", error);
    return { success: false, error: error.message };
  }
};

// FDA: Get batch history - UPDATED
export const getBatchHistory = async (userId, batchNumber) => {
  try {
    const q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where("pharmacyId", "==", userId),
      where("batchNumber", "==", batchNumber),
      orderBy("date", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const transactions = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        ...data,
        date: data.date,
        displayDate: formatDisplayDate(data.date),
        // Optional prescription fields
        prescriberName: data.prescriberName || "",
        patientName: data.patientName || ""
      });
    });
    
    // Import and use disposal records if available
    let disposals = [];
    try {
      const { getDisposalRecords } = await import("./inventory");
      const disposalsResult = await getDisposalRecords(userId, { batchNumber });
      if (disposalsResult.success) {
        disposals = disposalsResult.data;
      }
    } catch (error) {
      console.warn("Could not load disposal records:", error);
    }
    
    return {
      success: true,
      data: {
        transactions,
        disposals
      },
      summary: {
        totalSold: transactions.reduce((sum, tx) => sum + (tx.quantity || 0), 0),
        totalDisposed: disposals.reduce((sum, d) => sum + (d.quantity || 0), 0)
      }
    };
  } catch (error) {
    console.error("Error getting batch history:", error);
    return { success: false, error: error.message };
  }
};

// Add transaction with optional prescription fields
export const addTransactionWithOptionalPrescription = async (userId, transactionData) => {
  try {
    const transactionRef = collection(db, TRANSACTIONS_COLLECTION);
    
    // Prepare data with optional fields
    const dataToSave = {
      ...transactionData,
      pharmacyId: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      // Make prescription fields optional - only include if they have values
      ...(transactionData.prescriberName && { prescriberName: transactionData.prescriberName }),
      ...(transactionData.patientName && { patientName: transactionData.patientName }),
      ...(transactionData.prescriptionNumber && { prescriptionNumber: transactionData.prescriptionNumber }),
      ...(transactionData.patientId && { patientId: transactionData.patientId }),
      // These should always be present
      isVoided: false,
      status: "completed"
    };
    
    const docRef = await addDoc(transactionRef, dataToSave);
    
    // Add audit trail
    await addAuditTrail(userId, "transaction", "create", docRef.id, null, dataToSave);
    
    return { 
      success: true, 
      id: docRef.id,
      message: "Transaction added successfully" 
    };
  } catch (error) {
    console.error("Error adding transaction:", error);
    return { success: false, error: error.message };
  }
};

// Update transaction - FIXED to handle optional fields
export const updateTransaction = async (userId, transactionId, updateData) => {
  try {
    const transactionRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);
    const docSnap = await getDoc(transactionRef);
    
    if (!docSnap.exists()) {
      return { success: false, error: "Transaction not found" };
    }
    
    const oldData = docSnap.data();
    
    // RRA: Cannot update closed transactions
    if (oldData.isClosed) {
      return { 
        success: false, 
        error: "Ntushobora guhindura igikorwa cyafunzwe (Z-report yakoze)" 
      };
    }
    
    // Prepare update data with optional prescription fields
    const finalUpdateData = {
      ...updateData,
      updatedAt: Timestamp.now(),
      // Only update prescription fields if provided
      ...(updateData.prescriberName !== undefined && { prescriberName: updateData.prescriberName }),
      ...(updateData.patientName !== undefined && { patientName: updateData.patientName }),
      ...(updateData.prescriptionNumber !== undefined && { prescriptionNumber: updateData.prescriptionNumber }),
      ...(updateData.patientId !== undefined && { patientId: updateData.patientId })
    };
    
    await updateDoc(transactionRef, finalUpdateData);
    
    // Audit trail
    await addAuditTrail(userId, "transaction", "update", transactionId, oldData, finalUpdateData);
    
    return { success: true, message: "Igikorwa cyahinduwe neza" };
  } catch (error) {
    console.error("Error updating transaction: ", error);
    return { success: false, error: error.message };
  }
};

// Helper functions
const formatDisplayDate = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  } catch (error) {
    return dateString;
  }
};

const formatRwf = (amount) => {
  return `Rwf ${Number(amount || 0).toLocaleString('rw-RW')}`;
};

// Audit trail function
const addAuditTrail = async (userId, entityType, action, entityId, oldValue, newValue) => {
  try {
    const auditRef = collection(db, "auditTrails");
    
    await addDoc(auditRef, {
      userId,
      entityType,
      action,
      entityId,
      oldValue: oldValue ? JSON.stringify(oldValue) : null,
      newValue: newValue ? JSON.stringify(newValue) : null,
      timestamp: Timestamp.now(),
      ipAddress: typeof window !== 'undefined' ? window.location.hostname : 'server'
    });
    
  } catch (error) {
    console.error("Error adding audit trail:", error);
  }
};