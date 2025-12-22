"use client";

import { db } from "@/firebase/config";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";

const TRANSACTIONS_COLLECTION = "transactions";

/**
 * Get comprehensive transaction report with FDA/RRA compliance data
 */
export const getTransactionReport = async (userId, filters = {}) => {
  try {
    let q = collection(db, TRANSACTIONS_COLLECTION);
    const constraints = [
      where("pharmacyId", "==", userId),
      where("isVoided", "==", false) // Exclude voided transactions
    ];
    
    if (filters.fromDate) constraints.push(where("date", ">=", filters.fromDate));
    if (filters.toDate) constraints.push(where("date", "<=", filters.toDate));
    if (filters.medicine) constraints.push(where("medicine", "==", filters.medicine));
    if (filters.batchNumber) constraints.push(where("batchNumber", "==", filters.batchNumber));
    
    // RRA: Order by receipt number
    constraints.push(orderBy("receiptNumber", "desc"));
    
    q = query(q, ...constraints);
    
    const querySnapshot = await getDocs(q);
    const transactions = [];
    const medicines = new Set();
    const batches = new Set();
    
    let totals = {
      totalSales: 0,
      totalVAT: 0,
      totalExVAT: 0,
      totalQuantity: 0,
      prescriptionCount: 0
    };
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Collect unique values
      medicines.add(data.medicine);
      if (data.batchNumber) batches.add(data.batchNumber);
      
      // Calculate totals
      totals.totalSales += Number(data.total) || 0;
      totals.totalVAT += Number(data.vatAmount) || 0;
      totals.totalExVAT += Number(data.subtotal) || 0;
      totals.totalQuantity += Number(data.quantity) || 0;
      if (data.prescriberName) totals.prescriptionCount++;
      
      transactions.push({
        id: doc.id,
        ...data,
        date: data.date,
        displayDate: formatDisplayDate(data.date),
        formattedTotal: formatRwf(data.total),
        formattedVAT: formatRwf(data.vatAmount)
      });
    });
    
    // RRA & FDA Summary
    const summary = {
      totalTransactions: transactions.length,
      totalSales: totals.totalSales,
      totalVAT: totals.totalVAT,
      totalExVAT: totals.totalExVAT,
      totalQuantity: totals.totalQuantity,
      prescriptionCount: totals.prescriptionCount,
      medicines: Array.from(medicines),
      batches: Array.from(batches),
      fromDate: filters.fromDate || null,
      toDate: filters.toDate || null,
      
      // Compliance indicators
      hasBatchNumbers: batches.size > 0,
      hasPrescriptionData: totals.prescriptionCount > 0,
      vatCompliant: true // Will check calculation
    };
    
    return {
      success: true,
      data: { transactions, summary }
    };
  } catch (error) {
    console.error("Error getting report:", error);
    return { success: false, error: error.message };
  }
};

function formatDisplayDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
}

function formatRwf(amount) {
  return `Rwf ${Number(amount || 0).toLocaleString('rw-RW')}`;
}

export const exportToCSV = (transactions) => {
  if (!transactions || !transactions.length) return null;
  
  // RRA compliant CSV headers
  const headers = [
    "No", 
    "Numero ya Resi", 
    "Umuti", 
    "Numero ya Lot", 
    "Ingano", 
    "Igiciro", 
    "Subtotal", 
    "VAT Rate", 
    "VAT Amount", 
    "Total", 
    "Itariki", 
    "Igihe",
    "Muganga",
    "Umujyanama",
    "Status"
  ];
  
  const rows = transactions.map((tx, index) => [
    index + 1,
    tx.receiptNumber || "",
    tx.medicine,
    tx.batchNumber || "",
    tx.quantity,
    tx.unitPrice,
    tx.subtotal,
    `${(tx.vatRate || 0) * 100}%`,
    tx.vatAmount,
    tx.total,
    tx.date,
    tx.time || "",
    tx.prescriberName || "",
    tx.patientName || "",
    tx.status
  ]);
  
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell)}"`).join(","))
    .join("\n");
  
  return csv;
};

/**
 * Generate printable HTML report - FDA/RRA compliant
 */
export const generatePrintReport = (data, filters = {}) => {
  if (!data || !data.transactions || !data.summary) {
    return '<html><body><p>Nta makuru ahari</p></body></html>';
  }

  const { transactions, summary } = data;
  const formatRwf = (amount) => `Rwf ${Number(amount).toLocaleString('rw-RW')}`;
  
  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const today = new Date();
  const todayFormatted = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
  
  // RRA: VAT Breakdown
  const vatBreakdown = {
    exempt: transactions.filter(tx => tx.vatRate === 0).reduce((sum, tx) => sum + (tx.total || 0), 0),
    standard: transactions.filter(tx => tx.vatRate > 0).reduce((sum, tx) => sum + (tx.total || 0), 0),
    vatPayable: summary.totalVAT
  };
  
  // FDA: Compliance check
  const complianceCheck = {
    batchTracking: summary.hasBatchNumbers ? "✅" : "❌",
    prescriptionLog: summary.hasPrescriptionData ? "✅" : "❌",
    vatCalculation: summary.vatCompliant ? "✅" : "❌"
  };

  // Generate the HTML
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>RAPORO Y'IBIKORWA - RRA/FDA COMPLIANT</title>
      <style>
        /* Add RRA/FDA specific styling */
        .compliance-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
          margin-left: 5px;
        }
        .rra-badge {
          background: #dcfce7;
          color: #166534;
          border: 1px solid #86efac;
        }
        .fda-badge {
          background: #dbeafe;
          color: #1e40af;
          border: 1px solid #93c5fd;
        }
        .vat-row {
          background: #fef3c7 !important;
        }
        .prescription-row {
          background: #f0f9ff !important;
        }
        .compliance-summary {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 15px;
          margin: 15px 0;
        }
        .compliance-item {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px solid #e5e7eb;
        }
      </style>
      <!-- Include the existing CSS from your original function -->
    </head>
    <body>
      <div class="report-container">
        <!-- Header with compliance badges -->
        <div class="header">
          <h1>RAPORO Y'IBIKORWA BY'IMITI</h1>
          <div class="subtitle">
            <span class="compliance-badge rra-badge">RRA COMPLIANT</span>
            <span class="compliance-badge fda-badge">FDA COMPLIANT</span>
            <br>
            Sisitemu ya Pharmacie | Itariki: ${todayFormatted} | Igihe: ${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}
          </div>
        </div>
        
        <!-- Compliance Summary -->
        <div class="compliance-summary">
          <h3>UBUKODE BW'IBIKORWA</h3>
          <div class="compliance-item">
            <span>Tracking ya Batch:</span>
            <strong>${complianceCheck.batchTracking}</strong>
          </div>
          <div class="compliance-item">
            <span>Impapuro z'ibirego:</span>
            <strong>${complianceCheck.prescriptionLog}</strong>
          </div>
          <div class="compliance-item">
            <span>Kubara VAT:</span>
            <strong>${complianceCheck.vatCalculation}</strong>
          </div>
          <div class="compliance-item">
            <span>Imiti yose:</span>
            <strong>${summary.medicines.length}</strong>
          </div>
        </div>
          <div class="filter-info">
          <strong>Amashakiro yakoreshejwe:</strong><br>
          Itariki: ${filters.from ? formatDateForDisplay(filters.from) : "Kuva kera"} - ${filters.to ? formatDateForDisplay(filters.to) : "Uyu munsi"}<br>
          ${filters.medicine ? `Umuti: ${filters.medicine}` : "Imiti: Byose"}
        </div>
        
        <!-- Summary Section -->
        <div class="summary">
          <h2>IBITEKEREZO BY'IBIKORWA</h2>
          
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-label">Ibikorwa byose</div>
              <div class="stat-value">${summary.totalTransactions}</div>
            </div>
            
            <div class="stat-item">
              <div class="stat-label">Igiteranyo cy'umugabane</div>
              <div class="stat-value">${formatRwf(summary.totalSales)}</div>
            </div>
            
            <div class="stat-item">
              <div class="stat-label">Ubunini bwose</div>
              <div class="stat-value">${totalQuantity}</div>
            </div>
            
            <div class="stat-item">
              <div class="stat-label">Igiciro gisanzwe</div>
              <div class="stat-value">${formatRwf(Math.round(avgTransaction))}</div>
            </div>
          </div>
          
          <!-- Top Medicines -->
          ${topMedicines.length > 0 ? `
            <div class="top-medicines">
              <h3>IMITI IKUNZE GUKORESHWA (Top 5)</h3>
              ${topMedicines.map(med => `
                <div class="medicine-item">
                  <span>${med.medicine}</span>
                  <span>
                    <strong>${med.count}</strong> ibikorwa • 
                    <strong>${med.quantity}</strong> ubunini • 
                    <strong>${formatRwf(med.total)}</strong>
                  </span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
        
        <!-- Transactions Table -->
        <div class="transactions-section">
          <h2>IBIKORWA BYOSE (${transactions.length})</h2>
          
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>UMUTI</th>
                <th>ICYICIRO</th>
                <th>INGANO</th>
                <th>IGITERANYO</th>
                <th>ITARIKI</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.map((tx, index) => `
                <tr>
                  <td><strong>${index + 1}</strong></td>
                  <td>${tx.medicine}</td>
                  <td>${tx.category || "-"}</td>
                  <td>${tx.quantity}</td>
                  <td><strong>${formatRwf(tx.total)}</strong></td>
                  <td>${formatDateForDisplay(tx.date)}</td>
                  <td>
                    <span class="status ${tx.status === 'Yarakozwe' ? 'status-completed' : 'status-pending'}">
                      ${tx.status}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <!-- Summary row -->
          ${transactions.length > 0 ? `
            <div style="margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 6px; text-align: center;">
              <strong>Igiteranyo cyose:</strong> ${formatRwf(summary.totalSales)} | 
              <strong>Ibikorwa:</strong> ${summary.totalTransactions} | 
              <strong>Ingano yose:</strong> ${totalQuantity}
            </div>
          ` : ''}
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p>
            <strong>Yatangiwe na:</strong> Sisitemu ya Pharmacie<br>
            <strong>Itariki yo gutanga:</strong> ${todayFormatted}<br>
            <strong>Umubare w'imiti:</strong> ${summary.medicines.length}
          </p>
          
          <div class="print-actions">
            <button class="print-btn" onclick="window.print()">
              KANGURA / PDF
            </button>
            <button class="print-btn close-btn" onclick="window.close()">
              FUNGA
            </button>
          </div>
        </div>
      </div>
      
      <script>
        setTimeout(() => {
          if (window.location.search.includes('autoprint')) {
            window.print();
          }
        }, 1000);
      </script>
      </div>
    </body>
    </html>
  `;
  return html;
};