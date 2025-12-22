
"use client";

import { db } from "@/firebase/config";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  writeBatch,
  getDoc 
} from "firebase/firestore";

export const addMedicine = async (userId, medicineData) => {
  try {
    const medicinesRef = collection(db, "medicines");
    
    const medicineWithMeta = {
      name: medicineData.name,
      category: medicineData.category,

      quantity: Number(medicineData.quantity),
      minStock: Number(medicineData.minStock),
      
 
      batchNumber: medicineData.batchNumber || "",
      expiry: medicineData.expiry,
      supplier: medicineData.supplier || "",
      manufacturer: medicineData.manufacturer || "",
      requiresPrescription: medicineData.requiresPrescription || false,
      isControlled: medicineData.isControlled || false,
      storageCondition: medicineData.storageCondition || "Room Temperature",
      
      
      price: Number(medicineData.price),
      vatRate: medicineData.vatRate || 0, 
      vatExempt: medicineData.vatExempt || false,
      
     
      description: medicineData.description || "",
      atcCode: medicineData.atcCode || "",
      gtin: medicineData.gtin || "", 
      countryOfOrigin: medicineData.countryOfOrigin || "",
    
      pharmacyId: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      lastAudited: null,
      isActive: true
    };

    const docRef = await addDoc(medicinesRef, medicineWithMeta);
    
    await addAuditTrail(userId, "medicine", "create", docRef.id, null, medicineWithMeta);
    
    return {
      success: true,
      id: docRef.id,
      message: "Umuti wongewe neza"
    };
    
  } catch (error) {
    console.error("Error adding medicine:", error);
    return {
      success: false,
      message: `Ikosa: ${error.message}`
    };
  }
};
export const updateMedicine = async (medicineId, userId, medicineData) => {
  try {
    const medicineDoc = doc(db, "medicines", medicineId);
    const oldData = (await getDocs(medicineDoc)).data();
    
    const updateData = {
      name: medicineData.name,
      category: medicineData.category,
      quantity: Number(medicineData.quantity),
      minStock: Number(medicineData.minStock),
      price: Number(medicineData.price),
      expiry: medicineData.expiry,
      batchNumber: medicineData.batchNumber || "",
      supplier: medicineData.supplier || "",
      vatRate: medicineData.vatRate || oldData?.vatRate || 0,
      requiresPrescription: medicineData.requiresPrescription || false,
      isControlled: medicineData.isControlled || false,
      description: medicineData.description || "",
      updatedAt: Timestamp.now()
    };

    await updateDoc(medicineDoc, updateData);
    
    // Audit trail
    await addAuditTrail(userId, "medicine", "update", medicineId, oldData, updateData);
    
    return {
      success: true,
      message: "Umuti wahinduwe neza"
    };
    
  } catch (error) {
    console.error("Error updating medicine:", error);
    return {
      success: false,
      message: `Ikosa: ${error.message}`
    };
  }
};

export const deleteMedicine = async (medicineId, userId) => {
  try {
    const medicineDoc = doc(db, "medicines", medicineId);
    const oldData = (await getDocs(medicineDoc)).data();
    
    // FDA requires soft delete for records
    await updateDoc(medicineDoc, {
      isActive: false,
      deletedAt: Timestamp.now(),
      deletedBy: userId
    });
    
    // Audit trail
    await addAuditTrail(userId, "medicine", "delete", medicineId, oldData, null);
    
    return {
      success: true,
      message: "Umuti wasibwe"
    };
    
  } catch (error) {
    console.error("Error deleting medicine:", error);
    return {
      success: false,
      message: `Ikosa: ${error.message}`
    };
  }
};

// FDA: Batch tracking
export const getMedicineByBatch = async (userId, batchNumber) => {
  try {
    const medicinesRef = collection(db, "medicines");
    const q = query(
      medicinesRef, 
      where("pharmacyId", "==", userId),
      where("batchNumber", "==", batchNumber),
      where("isActive", "==", true)
    );
    
    const querySnapshot = await getDocs(q);
    const medicines = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      medicines.push({ 
        id: doc.id, 
        ...data,
        expiry: data.expiry,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date()
      });
    });
    
    return {
      success: true,
      data: medicines
    };
    
  } catch (error) {
    console.error("Error fetching medicines by batch:", error);
    return {
      success: false,
      message: `Ikosa: ${error.message}`,
      data: []
    };
  }
};

// FDA: Get medicines requiring prescription
export const getControlledMedicines = async (userId) => {
  try {
    const medicinesRef = collection(db, "medicines");
    const q = query(
      medicinesRef, 
      where("pharmacyId", "==", userId),
      where("requiresPrescription", "==", true),
      where("isActive", "==", true),
      orderBy("name", "asc")
    );
    
    const querySnapshot = await getDocs(q);
    const medicines = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      medicines.push({ 
        id: doc.id, 
        ...data,
        expiry: data.expiry,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date()
      });
    });
    
    return {
      success: true,
      data: medicines
    };
    
  } catch (error) {
    console.error("Error fetching controlled medicines:", error);
    return {
      success: false,
      message: `Ikosa: ${error.message}`,
      data: []
    };
  }
};

// FDA: Record disposal of medicines
export const recordMedicineDisposal = async (userId, disposalData) => {
  try {
    const disposalsRef = collection(db, "medicineDisposals");
    
    const disposalRecord = {
      pharmacyId: userId,
      medicineId: disposalData.medicineId,
      medicineName: disposalData.medicineName,
      batchNumber: disposalData.batchNumber,
      quantity: Number(disposalData.quantity),
      reason: disposalData.reason, // "expired", "damaged", "recalled", "contaminated"
      disposalMethod: disposalData.method, // "incineration", "returned", "burial"
      disposalDate: new Date().toISOString().split('T')[0],
      recordedBy: disposalData.recordedBy,
      witness: disposalData.witness || "",
      notes: disposalData.notes || "",
      createdAt: Timestamp.now()
    };
    
    // Reduce stock in inventory
    const medicineRef = doc(db, "medicines", disposalData.medicineId);
    const medicineSnap = await getDoc(medicineRef);
    
    if (medicineSnap.exists()) {
      const currentQty = medicineSnap.data().quantity;
      const newQty = currentQty - disposalData.quantity;
      
      await updateDoc(medicineRef, {
        quantity: newQty,
        updatedAt: new Date()
      });
    }
    
    const docRef = await addDoc(disposalsRef, disposalRecord);
    
    // Audit trail
    await addAuditTrail(userId, "disposal", "create", docRef.id, null, disposalRecord);
    
    return {
      success: true,
      id: docRef.id,
      message: "Icyangirizo cyanditswe neza"
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Ikosa: ${error.message}`
    };
  }
};

// FDA: Stock Reconciliation
export const recordStockReconciliation = async (userId, reconciliationData) => {
  try {
    const reconciliationRef = collection(db, "stockReconciliations");
    
    const record = {
      pharmacyId: userId,
      medicineId: reconciliationData.medicineId,
      medicineName: reconciliationData.medicineName,
      batchNumber: reconciliationData.batchNumber,
      systemQuantity: Number(reconciliationData.systemQuantity), // From your system
      physicalQuantity: Number(reconciliationData.physicalQuantity), // Actual count
      difference: Number(reconciliationData.systemQuantity) - Number(reconciliationData.physicalQuantity),
      countedBy: reconciliationData.countedBy,
      countDate: new Date().toISOString().split('T')[0],
      notes: reconciliationData.notes || "",
      createdAt: Timestamp.now()
    };
    
    const docRef = await addDoc(reconciliationRef, record);
    
    // If discrepancy found, create adjustment
    if (record.difference !== 0) {
      await createStockAdjustment(userId, {
        medicineId: reconciliationData.medicineId,
        adjustment: -record.difference,
        reason: `Stock reconciliation: ${record.difference} units difference`,
        reference: `Reconciliation ${docRef.id}`
      });
    }
    
    return { 
      success: true, 
      id: docRef.id,
      message: "Kubara byanditswe neza"
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Helper function for stock adjustment
const createStockAdjustment = async (userId, adjustmentData) => {
  try {
    const adjustmentsRef = collection(db, "stockAdjustments");
    
    const adjustment = {
      pharmacyId: userId,
      medicineId: adjustmentData.medicineId,
      adjustment: Number(adjustmentData.adjustment),
      reason: adjustmentData.reason,
      reference: adjustmentData.reference,
      adjustedBy: userId,
      adjustedAt: Timestamp.now()
    };
    
    await addDoc(adjustmentsRef, adjustment);
    
    // Update medicine quantity
    const medicineRef = doc(db, "medicines", adjustmentData.medicineId);
    const medicineSnap = await getDoc(medicineRef);
    
    if (medicineSnap.exists()) {
      const currentQty = medicineSnap.data().quantity;
      const newQty = currentQty + Number(adjustmentData.adjustment);
      
      await updateDoc(medicineRef, {
        quantity: newQty,
        updatedAt: new Date()
      });
    }
    
  } catch (error) {
    console.error("Error creating stock adjustment:", error);
  }
};

// Update stock function with audit trail
export const updateMedicineStock = async (medicineId, newQuantity, userId, reason = "") => {
  try {
    const medicineDoc = doc(db, "medicines", medicineId);
    const oldData = (await getDoc(medicineDoc)).data();
    
    await updateDoc(medicineDoc, {
      quantity: Number(newQuantity),
      updatedAt: new Date()
    });
    
    // Record stock adjustment
    if (oldData && oldData.quantity !== Number(newQuantity)) {
      const adjustment = Number(newQuantity) - oldData.quantity;
      
      const adjustmentsRef = collection(db, "stockAdjustments");
      await addDoc(adjustmentsRef, {
        pharmacyId: userId,
        medicineId: medicineId,
        adjustment: adjustment,
        reason: reason || "Manual stock update",
        adjustedBy: userId,
        adjustedAt: Timestamp.now()
      });
    }
    
    return {
      success: true,
      message: "Umubare w'umuti wahinduwe neza"
    };
    
  } catch (error) {
    console.error("Error updating medicine stock:", error);
    return {
      success: false,
      message: `Ikosa: ${error.message}`
    };
  }
};

// Get expiring medicines with batch info
export const getExpiringMedicines = async (userId, daysThreshold = 30) => {
  try {
    const result = await getMedicines(userId);
    if (!result.success) return { success: false, data: [] };
    
    const today = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(today.getDate() + daysThreshold);
    
    const expiringMedicines = result.data.filter(medicine => {
      const expiryDate = new Date(medicine.expiry);
      return expiryDate <= thresholdDate && expiryDate >= today;
    }).map(medicine => {
      const expiryDate = new Date(medicine.expiry);
      const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      return { 
        ...medicine, 
        daysLeft,
        batchNumber: medicine.batchNumber || "N/A",
        supplier: medicine.supplier || "N/A"
      };
    });
    
    return {
      success: true,
      data: expiringMedicines
    };
    
  } catch (error) {
    console.error("Error fetching expiring medicines:", error);
    return {
      success: false,
      data: []
    };
  }
};

// Get disposal records
export const getDisposalRecords = async (userId, filters = {}) => {
  try {
    let q = collection(db, "medicineDisposals");
    const constraints = [
      where("pharmacyId", "==", userId)
    ];
    
    if (filters.reason) {
      constraints.push(where("reason", "==", filters.reason));
    }
    
    if (filters.fromDate) {
      constraints.push(where("disposalDate", ">=", filters.fromDate));
    }
    
    if (filters.toDate) {
      constraints.push(where("disposalDate", "<=", filters.toDate));
    }
    
    constraints.push(orderBy("createdAt", "desc"));
    
    q = query(q, ...constraints);
    
    const querySnapshot = await getDocs(q);
    const disposals = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      disposals.push({
        id: doc.id,
        ...data,
        disposalDate: data.disposalDate,
        createdAt: data.createdAt?.toDate?.() || new Date()
      });
    });
    
    return {
      success: true,
      data: disposals
    };
    
  } catch (error) {
    console.error("Error fetching disposal records:", error);
    return {
      success: false,
      data: []
    };
  }
};

// FDA: Generate Prescription Log Report
export const getPrescriptionLog = async (userId, filters = {}) => {
  try {
    // Get all transactions for controlled medicines
    const transactionsResult = await getTransactions(userId, filters);
    if (!transactionsResult.success) return { success: false, data: [] };
    
    // Filter only transactions with prescription info
    const prescriptionTransactions = transactionsResult.data.filter(tx => 
      tx.prescriberName && tx.patientName
    );
    
    return {
      success: true,
      data: prescriptionTransactions
    };
    
  } catch (error) {
    console.error("Error fetching prescription log:", error);
    return {
      success: false,
      data: []
    };
  }
};

// Audit Trail Function (for all compliance tracking)
const addAuditTrail = async (userId, entityType, action, entityId, oldValue, newValue) => {
  try {
    const auditRef = collection(db, "auditTrails");
    
    await addDoc(auditRef, {
      userId,
      entityType, // "medicine", "transaction", "disposal"
      action, // "create", "update", "delete", "view"
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

// Keep existing functions but update to include audit trails
export const getMedicines = async (userId) => {
  try {
    const medicinesRef = collection(db, "medicines");
    const q = query(
      medicinesRef, 
      where("pharmacyId", "==", userId),
      where("isActive", "==", true),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const medicines = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      medicines.push({ 
        id: doc.id, 
        ...data,
        expiry: data.expiry,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date()
      });
    });
    
    return {
      success: true,
      data: medicines
    };
    
  } catch (error) {
    console.error("Error fetching medicines:", error);
    return {
      success: false,
      message: `Ikosa: ${error.message}`,
      data: []
    };
  }
};