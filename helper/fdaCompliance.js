
"use client";

import { db } from "@/firebase/config";
import { 
  collection, addDoc, getDocs, query, where, 
  orderBy, Timestamp, doc, updateDoc, writeBatch 
} from "firebase/firestore";

// FDA: Report Adverse Drug Reaction
export const reportAdverseReaction = async (userId, reactionData) => {
  try {
    const reactionsRef = collection(db, "adverseReactions");
    
    const reactionReport = {
      pharmacyId: userId,
      medicineId: reactionData.medicineId,
      medicineName: reactionData.medicineName,
      batchNumber: reactionData.batchNumber,
      
      // Patient Info (anonymous for reporting)
      patientAge: reactionData.patientAge,
      patientGender: reactionData.patientGender,
      patientInitials: reactionData.patientInitials,
      
      // Reaction Details
      reaction: reactionData.reaction,
      severity: reactionData.severity, // "mild", "moderate", "severe"
      dateOccurred: reactionData.dateOccurred,
      dateReported: new Date().toISOString().split('T')[0],
      
      // Clinical Details
      symptoms: reactionData.symptoms || [],
      outcome: reactionData.outcome || "",
      treatmentGiven: reactionData.treatmentGiven || "",
      
      // Reporting
      reportedBy: userId,
      reportedToFDA: false, // Will be set when submitted to Rwanda FDA
      fdaReference: "",
      
      // System
      createdAt: Timestamp.now(),
      status: "draft" // "draft", "submitted", "acknowledged"
    };
    
    const docRef = await addDoc(reactionsRef, reactionReport);
    
    return {
      success: true,
      id: docRef.id,
      message: "Raporo yo guhangayika yakozwe"
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// FDA: Product Recall Management
export const recordProductRecall = async (userId, recallData) => {
  try {
    const recallsRef = collection(db, "productRecalls");
    
    const recallRecord = {
      pharmacyId: userId,
      medicineId: recallData.medicineId,
      medicineName: recallData.medicineName,
      batchNumber: recallData.batchNumber,
      
      // Recall Details
      recallDate: recallData.recallDate,
      reason: recallData.reason, // "FDA Recall", "Manufacturer Recall", "Quality Issue"
      noticeNumber: recallData.noticeNumber,
      noticeUrl: recallData.noticeUrl,
      
      // Affected Stock
      affectedQuantity: recallData.affectedQuantity,
      quarantinedQuantity: 0,
      returnedQuantity: 0,
      destroyedQuantity: 0,
      
      // Actions
      actionTaken: "quarantined", // "quarantined", "returned", "destroyed"
      actionDate: null,
      actionBy: null,
      
      // Compliance
      fdaAcknowledged: false,
      completionDate: null,
      
      // System
      createdAt: Timestamp.now(),
      status: "active"
    };
    
    const docRef = await addDoc(recallsRef, recallRecord);
    
    // Quarantine affected stock
    if (recallData.medicineId) {
      const medicineRef = doc(db, "medicines", recallData.medicineId);
      await updateDoc(medicineRef, {
        isQuarantined: true,
        quarantineReason: `Recall: ${recallData.reason}`,
        updatedAt: new Date()
      });
    }
    
    return {
      success: true,
      id: docRef.id,
      message: "Kwakuwa umuti kwanditswe"
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// FDA: Temperature & Humidity Monitoring
export const logTemperatureReading = async (sensorData) => {
  try {
    const tempLogsRef = collection(db, "temperatureLogs");
    
    const reading = {
      pharmacyId: sensorData.pharmacyId,
      sensorId: sensorData.sensorId,
      location: sensorData.location, // "cold_room", "refrigerator_1", "shelf"
      
      // Readings
      temperature: sensorData.temperature,
      humidity: sensorData.humidity || null,
      
      // Compliance Check
      requiredRange: sensorData.requiredRange || { min: 2, max: 8 },
      isWithinRange: sensorData.temperature >= 2 && sensorData.temperature <= 8,
      
      // Alert
      alertTriggered: sensorData.temperature < 2 || sensorData.temperature > 8,
      alertType: sensorData.temperature < 2 ? "too_cold" : 
                sensorData.temperature > 8 ? "too_hot" : null,
      
      // System
      timestamp: Timestamp.now(),
      recordedAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(tempLogsRef, reading);
    
    // Trigger alert if needed
    if (reading.alertTriggered) {
      await createComplianceAlert(
        sensorData.pharmacyId,
        "temperature_out_of_range",
        `Temperature ${reading.temperature}°C at ${reading.location}`,
        "high"
      );
    }
    
    return {
      success: true,
      id: docRef.id,
      message: "Imyigaragambyo yanditswe"
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// FDA: Generate Compliance Checklist
export const getComplianceChecklist = async (userId) => {
  const today = new Date();
  const checklist = {
    date: today.toISOString().split('T')[0],
    items: [
      {
        id: "batch_tracking",
        description: "Batch numbers recorded for all medicines",
        required: true,
        status: "pending",
        fdaRequirement: true
      },
      {
        id: "prescription_log",
        description: "Prescription book updated for controlled substances",
        required: true,
        status: "pending",
        fdaRequirement: true
      },
      {
        id: "temperature_monitoring",
        description: "Temperature logs recorded (refrigerated products)",
        required: true,
        status: "pending",
        fdaRequirement: true
      },
      {
        id: "stock_reconciliation",
        description: "Physical stock count matches system",
        required: false,
        status: "pending",
        fdaRequirement: true
      },
      {
        id: "expiry_check",
        description: "Expired products removed from shelf",
        required: true,
        status: "pending",
        fdaRequirement: true
      },
      {
        id: "z_report",
        description: "Z-report generated for previous day",
        required: true,
        status: "pending",
        rraRequirement: true
      },
      {
        id: "vat_calculation",
        description: "VAT correctly calculated on all sales",
        required: true,
        status: "pending",
        rraRequirement: true
      }
    ]
  };
  
  // Check each item status
  // This would involve checking actual data
  // For now, return template
  
  return {
    success: true,
    data: checklist,
    message: "Urutonde rw'ubukode rwabonetse"
  };
};

// FDA: Generate Closing Stock Report (for change of ownership)
export const generateClosingStockReport = async (userId, closureData) => {
  try {
    // Get all active medicines
    const medicinesRef = collection(db, "medicines");
    const q = query(
      medicinesRef,
      where("pharmacyId", "==", userId),
      where("isActive", "==", true),
      where("quantity", ">", 0)
    );
    
    const snapshot = await getDocs(q);
    const medicines = [];
    let totalValue = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const value = (data.quantity || 0) * (data.price || 0);
      totalValue += value;
      
      medicines.push({
        name: data.name,
        batchNumber: data.batchNumber,
        quantity: data.quantity,
        unitPrice: data.price,
        totalValue: value,
        expiry: data.expiry,
        category: data.category
      });
    });
    
    const report = {
      reportType: "closing_stock",
      pharmacyId: userId,
      reportDate: new Date().toISOString().split('T')[0],
      reason: closureData.reason, // "sale", "closure", "relocation"
      effectiveDate: closureData.effectiveDate,
      
      // Stock Summary
      totalItems: medicines.length,
      totalQuantity: medicines.reduce((sum, m) => sum + m.quantity, 0),
      totalValue: totalValue,
      
      // Disposition
      disposition: closureData.disposition, // "transfer", "destroy", "return"
      receivingParty: closureData.receivingParty || "",
      
      // Witness
      witnessName: closureData.witnessName,
      witnessSignature: closureData.witnessSignature || "",
      witnessId: closureData.witnessId || "",
      
      // Stock Details
      medicines: medicines,
      
      // Compliance
      fdaAcknowledged: false,
      rraAcknowledged: false,
      
      // System
      createdAt: Timestamp.now(),
      generatedBy: userId
    };
    
    // Save report
    const reportRef = collection(db, "closingStockReports");
    const docRef = await addDoc(reportRef, report);
    
    return {
      success: true,
      id: docRef.id,
      data: report,
      message: "Raporo y'umubare w'imiti yakozwe"
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// FDA: CAPA (Corrective Action Preventive Action) Tracking
export const createCAPA = async (userId, capaData) => {
  try {
    const capaRef = collection(db, "capaRecords");
    
    const capaRecord = {
      pharmacyId: userId,
      
      // Inspection Details
      inspectionDate: capaData.inspectionDate,
      inspector: capaData.inspector,
      inspectionType: capaData.inspectionType, // "FDA", "RRA", "Internal"
      
      // Finding
      finding: capaData.finding,
      requirement: capaData.requirement, // Which regulation was violated
      severity: capaData.severity, // "minor", "major", "critical"
      
      // Corrective Action
      correctiveAction: capaData.correctiveAction,
      responsiblePerson: capaData.responsiblePerson,
      dueDate: capaData.dueDate,
      
      // Preventive Action
      preventiveAction: capaData.preventiveAction || "",
      
      // Status
      status: "open", // "open", "in_progress", "closed", "verified"
      completedDate: null,
      verifiedBy: null,
      verifiedDate: null,
      
      // System
      createdAt: Timestamp.now(),
      createdBy: userId
    };
    
    const docRef = await addDoc(capaRef, capaRecord);
    
    return {
      success: true,
      id: docRef.id,
      message: "CAPA yakozwe"
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Helper: Create compliance alert
const createComplianceAlert = async (pharmacyId, type, message, severity) => {
  try {
    const alertsRef = collection(db, "complianceAlerts");
    
    await addDoc(alertsRef, {
      pharmacyId,
      type,
      message,
      severity, // "low", "medium", "high", "critical"
      acknowledged: false,
      createdAt: Timestamp.now(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    
  } catch (error) {
    console.error("Error creating compliance alert:", error);
  }
};