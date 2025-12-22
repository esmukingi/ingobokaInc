"use client";

import { db } from "@/firebase/config";
import { 
  collection, addDoc, updateDoc, doc, getDoc, getDocs, 
  query, where, orderBy, Timestamp, writeBatch, runTransaction,setDoc 
} from "firebase/firestore";

// Generate sequential receipt numbers for RRA compliance
export const generateReceiptNumber = async (pharmacyId) => {
  try {
    // Get or create counter for this pharmacy
    const counterRef = doc(db, "receiptCounters", pharmacyId);
    
    return await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      
      let newCount = 1;
      const today = new Date();
      const yearMonth = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
      
      if (counterDoc.exists()) {
        const data = counterDoc.data();
        // Reset if new month
        if (data.month !== yearMonth) {
          newCount = 1;
        } else {
          newCount = data.count + 1;
        }
      }
      
      // Format: RECEIPT-YYYYMM-0001
      const receiptNumber = `REC-${yearMonth}-${String(newCount).padStart(4, '0')}`;
      
      // Update counter
      transaction.set(counterRef, {
        count: newCount,
        month: yearMonth,
        lastUpdated: Timestamp.now(),
        pharmacyId: pharmacyId
      });
      
      return receiptNumber;
    });
    
  } catch (error) {
    console.error("Error generating receipt number:", error);
    // Fallback: timestamp-based ID
    return `REC-FB-${Date.now()}`;
  }
};

// RRA Compliant Transaction with VAT Calculation
export const addRRACompliantTransaction = async (userId, transactionData) => {
  try {
    // Get medicine info for VAT rate
    const medDoc = doc(db, "medicines", transactionData.medicineId);
    const medicineSnap = await getDoc(medDoc);
    const medicine = medicineSnap.exists() ? medicineSnap.data() : null;
    
    if (!medicine) {
      return { success: false, error: "Umuti ntabwo wabonetse" };
    }
    
    const vatRate = medicine.vatRate || 0;
    const quantity = Number(transactionData.quantity);
    const unitPrice = Number(transactionData.price);
    
    // Calculate amounts (RRA format)
    const subtotal = quantity * unitPrice;
    const vatAmount = subtotal * vatRate;
    const total = subtotal + vatAmount;
    
    // Generate receipt number
    const receiptNumber = await generateReceiptNumber(userId);
    
    // Create transaction record
    const transaction = {
      // RRA Required Fields
      pharmacyId: userId,
      receiptNumber,
      transactionType: "sale",
      
      // Medicine Info
      medicineId: transactionData.medicineId,
      medicine: transactionData.medicine,
      batchNumber: transactionData.batchNumber || medicine.batchNumber || "",
      category: medicine.category || "",
      
      // Quantities and Prices
      quantity,
      unitPrice,
      subtotal,
      vatRate,
      vatAmount,
      total,
      
      // Date & Time
      date: transactionData.date || new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('rw-RW'),
      timestamp: Timestamp.now(),
      
      // FDA Prescription Info (if controlled)
      prescriberName: transactionData.prescriberName || "",
      patientName: transactionData.patientName || "",
      prescriptionNumber: transactionData.prescriptionNumber || "",
      patientId: transactionData.patientId || "",
      
      // RRA Compliance Fields
      isVoided: false,
      voidReason: "",
      isClosed: false, // For Z-report
      status: "completed",
      paymentMethod: transactionData.paymentMethod || "cash",
      
      // System Fields
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      syncedToRRA: false
    };
    
    const docRef = await addDoc(collection(db, "transactions"), transaction);
    
    // Update daily sales summary for X/Z reports
    await updateDailySales(userId, total, vatAmount);
    
    // Audit trail
    await addAuditTrail(userId, "transaction", "create", docRef.id, null, transaction);
    
    return {
      success: true,
      id: docRef.id,
      receiptNumber,
      data: transaction,
      message: "Igikorwa cyashyizwe neza"
    };
    
  } catch (error) {
    console.error("Error adding RRA transaction:", error);
    return { success: false, error: error.message };
  }
};

// RRA: Void transaction instead of delete
export const voidTransaction = async (transactionId, reason, userId) => {
  try {
    const transactionRef = doc(db, "transactions", transactionId);
    const transactionSnap = await getDoc(transactionRef);
    
    if (!transactionSnap.exists()) {
      return { success: false, error: "Igikorwa ntabwo kibaranga" };
    }
    
    const oldData = transactionSnap.data();
    
    // Check if already closed (Z-report generated)
    if (oldData.isClosed) {
      return { 
        success: false, 
        error: "Ntushobora guhagarika igikorwa cyafunzwe (Z-report yakoze)" 
      };
    }
    
    await updateDoc(transactionRef, {
      isVoided: true,
      voidReason: reason,
      voidedBy: userId,
      voidedAt: Timestamp.now(),
      status: "voided",
      updatedAt: Timestamp.now()
    });
    
    // Audit trail
    await addAuditTrail(userId, "transaction", "void", transactionId, oldData, {
      isVoided: true,
      voidReason: reason,
      status: "voided"
    });
    
    // Reverse stock adjustment if needed
    if (oldData.medicineId) {
      const medicineRef = doc(db, "medicines", oldData.medicineId);
      const medicineSnap = await getDoc(medicineRef);
      
      if (medicineSnap.exists()) {
        const currentQty = medicineSnap.data().quantity;
        const newQty = currentQty + oldData.quantity;
        
        await updateDoc(medicineRef, {
          quantity: newQty,
          updatedAt: new Date()
        });
        
        // Record adjustment
        const adjustmentsRef = collection(db, "stockAdjustments");
        await addDoc(adjustmentsRef, {
          pharmacyId: userId,
          medicineId: oldData.medicineId,
          adjustment: oldData.quantity,
          reason: `Transaction voided: ${reason}`,
          reference: `Transaction ${transactionId}`,
          adjustedBy: userId,
          adjustedAt: Timestamp.now()
        });
      }
    }
    
    return { 
      success: true, 
      message: "Igikorwa cyahagaritswe neza" 
    };
    
  } catch (error) {
    console.error("Error voiding transaction:", error);
    return { success: false, error: error.message };
  }
};

// RRA: X-Report (Mid-day snapshot)
export const generateXReport = async (userId) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const q = query(
      collection(db, "transactions"),
      where("pharmacyId", "==", userId),
      where("date", "==", today),
      where("isVoided", "==", false)
    );
    
    const snapshot = await getDocs(q);
    
    let totals = {
      transactions: 0,
      voidedTransactions: 0,
      subtotal: 0,
      vatAmount: 0,
      total: 0,
      cash: 0,
      mobileMoney: 0,
      card: 0
    };
    
    const transactions = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      totals.transactions++;
      totals.subtotal += data.subtotal || 0;
      totals.vatAmount += data.vatAmount || 0;
      totals.total += data.total || 0;
      
      // Payment method breakdown
      if (data.paymentMethod === "cash") totals.cash += data.total || 0;
      else if (data.paymentMethod === "mobile") totals.mobileMoney += data.total || 0;
      else if (data.paymentMethod === "card") totals.card += data.total || 0;
      
      transactions.push({
        id: doc.id,
        receiptNumber: data.receiptNumber,
        ...data
      });
    });
    
    // Get voided transactions
    const voidedQ = query(
      collection(db, "transactions"),
      where("pharmacyId", "==", userId),
      where("date", "==", today),
      where("isVoided", "==", true)
    );
    
    const voidedSnapshot = await getDocs(voidedQ);
    totals.voidedTransactions = voidedSnapshot.size;
    
    const report = {
      type: "X-Report",
      reportId: `X-${Date.now()}`,
      date: today,
      generatedAt: Timestamp.now(),
      generatedBy: userId,
      totals,
      transactionCount: transactions.length,
      transactions: transactions.slice(0, 50), // Limit for preview
      summary: {
        netTotal: totals.total,
        totalVAT: totals.vatAmount,
        totalExVAT: totals.subtotal
      }
    };
    
    // Save report
    const reportRef = await addDoc(collection(db, "xReports"), report);
    
    return {
      success: true,
      id: reportRef.id,
      report,
      message: "X-Report yakozwe neza"
    };
    
  } catch (error) {
    console.error("Error generating X-report:", error);
    return { success: false, error: error.message };
  }
};

// RRA: Z-Report (End of day closure)
export const generateZReport = async (userId) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Generate X-report first
    const xReport = await generateXReport(userId);
    if (!xReport.success) {
      throw new Error("Failed to generate X-report");
    }
    
    // Close all today's transactions
    const q = query(
      collection(db, "transactions"),
      where("pharmacyId", "==", userId),
      where("date", "==", today),
      where("isClosed", "==", false)
    );
    
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    snapshot.docs.forEach(docSnap => {
      const ref = doc(db, "transactions", docSnap.id);
      batch.update(ref, { 
        isClosed: true,
        closedAt: Timestamp.now()
      });
    });
    
    await batch.commit();
    
    // Create Z-report
    const zReport = {
      type: "Z-Report",
      reportId: `Z-${Date.now()}`,
      date: today,
      generatedAt: Timestamp.now(),
      generatedBy: userId,
      xReportId: xReport.id,
      totals: xReport.report.totals,
      closedTransactionCount: snapshot.size,
      openingTime: "08:00", // Default, should be configurable
      closingTime: new Date().toLocaleTimeString('rw-RW'),
      cashier: "System", // Should get from auth
      startingCash: 0, // Should be entered by cashier
      endingCash: xReport.report.totals.cash,
      cashDifference: xReport.report.totals.cash - 0 // Adjust based on starting cash
    };
    
    // Save Z-report
    const zReportRef = await addDoc(collection(db, "zReports"), zReport);
    
    // Update daily summary
    await updateDailySummary(userId, today, zReport);
    
    return {
      success: true,
      id: zReportRef.id,
      report: zReport,
      message: "Umunsi ufunga neza! Z-Report yakozwe."
    };
    
  } catch (error) {
    console.error("Error generating Z-report:", error);
    return { success: false, error: error.message };
  }
};

// Helper: Update daily sales
const updateDailySales = async (userId, amount, vatAmount) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const dailyRef = doc(db, "dailySales", `${userId}_${today}`);
    
    const dailySnap = await getDoc(dailyRef);
    
    if (dailySnap.exists()) {
      const current = dailySnap.data();
      await updateDoc(dailyRef, {
        totalSales: current.totalSales + amount,
        totalVAT: current.totalVAT + vatAmount,
        transactionCount: current.transactionCount + 1,
        updatedAt: Timestamp.now()
      });
    } else {
      await setDoc(dailyRef, {
        pharmacyId: userId,
        date: today,
        totalSales: amount,
        totalVAT: vatAmount,
        transactionCount: 1,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    }
  } catch (error) {
    console.error("Error updating daily sales:", error);
  }
};

// Helper: Update daily summary
const updateDailySummary = async (userId, date, zReport) => {
  try {
    const summaryRef = doc(db, "dailySummaries", `${userId}_${date}`);
    
    await setDoc(summaryRef, {
      pharmacyId: userId,
      date,
      zReportId: zReport.reportId,
      totalSales: zReport.totals.total,
      totalVAT: zReport.totals.vatAmount,
      transactionCount: zReport.closedTransactionCount,
      closingTime: zReport.closingTime,
      closedAt: Timestamp.now(),
      syncedToRRA: false
    });
  } catch (error) {
    console.error("Error updating daily summary:", error);
  }
};

// RRA: Generate Kinyarwanda Audit Report
export const generateKinyarwandaAuditReport = async (userId, filters = {}) => {
  try {
    const today = new Date();
    const fromDate = filters.fromDate || new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const toDate = filters.toDate || today.toISOString().split('T')[0];
    
    // Get transactions
    const transactionsResult = await getTransactions(userId, {
      fromDate,
      toDate
    });
    
    if (!transactionsResult.success) {
      throw new Error("Failed to fetch transactions");
    }
    
    const transactions = transactionsResult.data.filter(tx => !tx.isVoided);
    
    // Calculate totals
    const totals = {
      totalTransactions: transactions.length,
      totalSales: transactions.reduce((sum, tx) => sum + (tx.total || 0), 0),
      totalVAT: transactions.reduce((sum, tx) => sum + (tx.vatAmount || 0), 0),
      totalQuantity: transactions.reduce((sum, tx) => sum + (tx.quantity || 0), 0)
    };
    
    // Get medicine counts
    const medicineStats = {};
    transactions.forEach(tx => {
      if (!medicineStats[tx.medicine]) {
        medicineStats[tx.medicine] = { 
          total: 0, 
          quantity: 0, 
          count: 0,
          vatAmount: 0 
        };
      }
      medicineStats[tx.medicine].total += tx.total || 0;
      medicineStats[tx.medicine].quantity += tx.quantity || 0;
      medicineStats[tx.medicine].count += 1;
      medicineStats[tx.medicine].vatAmount += tx.vatAmount || 0;
    });
    
    const report = {
      title: "RAPORO Y'UBUGENZUZI",
      pharmacyId: userId,
      reportDate: today.toISOString().split('T')[0],
      period: `${fromDate} - ${toDate}`,
      generatedAt: Timestamp.now(),
      
      // Summary
      summary: totals,
      
      // Details
      medicineSummary: Object.entries(medicineStats)
        .map(([medicine, stats]) => ({ medicine, ...stats }))
        .sort((a, b) => b.total - a.total),
      
      // VAT Summary
      vatSummary: {
        standardRate: 0.18,
        exemptTotal: transactions
          .filter(tx => tx.vatRate === 0)
          .reduce((sum, tx) => sum + (tx.total || 0), 0),
        taxableTotal: transactions
          .filter(tx => tx.vatRate > 0)
          .reduce((sum, tx) => sum + (tx.total || 0), 0),
        vatPayable: totals.totalVAT
      },
      
      // Compliance Status
      compliance: {
        hasBatchNumbers: transactions.every(tx => tx.batchNumber),
        hasPrescriptionForControlled: true, // Implement check
        stockReconciliationDone: false, // Implement check
        zReportsUpToDate: true // Implement check
      }
    };
    
    return {
      success: true,
      data: report,
      message: "Raporo y'ubugenzuzi yakozwe"
    };
    
  } catch (error) {
    console.error("Error generating audit report:", error);
    return { success: false, error: error.message };
  }
};

// Get VAT Summary for RRA filing
export const getVATSummary = async (userId, period) => {
  try {
    const fromDate = period.fromDate;
    const toDate = period.toDate;
    
    const q = query(
      collection(db, "transactions"),
      where("pharmacyId", "==", userId),
      where("date", ">=", fromDate),
      where("date", "<=", toDate),
      where("isVoided", "==", false)
    );
    
    const snapshot = await getDocs(q);
    
    const summary = {
      period: `${fromDate} to ${toDate}`,
      totalSales: 0,
      vatExemptSales: 0,
      standardRateSales: 0,
      vatPayable: 0,
      transactions: []
    };
    
    snapshot.forEach(doc => {
      const data = doc.data();
      summary.totalSales += data.total || 0;
      
      if (data.vatRate === 0) {
        summary.vatExemptSales += data.total || 0;
      } else {
        summary.standardRateSales += data.total || 0;
        summary.vatPayable += data.vatAmount || 0;
      }
      
      summary.transactions.push({
        receiptNumber: data.receiptNumber,
        date: data.date,
        amount: data.total,
        vat: data.vatAmount
      });
    });
    
    return {
      success: true,
      data: summary,
      message: "VAT summary generated"
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Audit trail helper
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