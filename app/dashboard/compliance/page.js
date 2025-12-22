// app/dashboard/compliance/page.js
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/auth";
import { 
  Shield, FileText, AlertTriangle, CheckCircle, 
  DollarSign, Receipt, Trash2, RefreshCw, Thermometer,
  Users, Barcode, Building, Calendar, Package, TrendingUp
} from "lucide-react";
import Link from "next/link";
import { generateXReport, generateZReport, generateKinyarwandaAuditReport } from "@/helper/rraCompliance";
import { getMedicines, getDisposalRecords, getExpiringMedicines } from "@/helper/inventory";
import { getTransactions } from "@/helper/transactions";

export default function ComplianceDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [complianceStats, setComplianceStats] = useState({
    rra: { status: "warning", issues: [] },
    fda: { status: "warning", issues: [] },
    lastZReport: null,
    expiringMedicines: 0,
    lowStockMedicines: 0,
    todaySales: 0,
    todayVAT: 0
  });

  const [todaysXReport, setTodaysXReport] = useState(null);

  useEffect(() => {
    if (user) {
      loadComplianceData();
    }
  }, [user]);

  const loadComplianceData = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Load various compliance data
      const issues = [];
      
      // Check if Z-report was generated today
      const today = new Date().toISOString().split('T')[0];
      const lastZReport = localStorage.getItem(`lastZReport_${user.uid}`);
      
      // Get today's transactions for X-report
      const transactionsResult = await getTransactions(user.uid, { 
        fromDate: today, 
        toDate: today 
      });
      
      // Get medicines for compliance checks
      const medicinesResult = await getMedicines(user.uid);
      const disposalsResult = await getDisposalRecords(user.uid);
      const expiringResult = await getExpiringMedicines(user.uid, 30);
      
      // FDA Compliance Checks
      if (medicinesResult.success) {
        const medicines = medicinesResult.data;
        
        // Check for medicines without batch numbers
        const noBatch = medicines.filter(m => !m.batchNumber);
        if (noBatch.length > 0) {
          issues.push(`${noBatch.length} medicines without batch numbers`);
        }
        
        // Check for expired medicines
        const expired = medicines.filter(m => new Date(m.expiry) < new Date());
        if (expired.length > 0) {
          issues.push(`${expired.length} expired medicines need disposal`);
        }
        
        // Check controlled substances without prescription records
        const controlled = medicines.filter(m => m.requiresPrescription);
        setComplianceStats(prev => ({
          ...prev,
          expiringMedicines: expiringResult.success ? expiringResult.data.length : 0,
          lowStockMedicines: medicines.filter(m => m.quantity < m.minStock).length
        }));
      }
      
      // RRA Compliance Checks
      if (transactionsResult.success) {
        const todaysTransactions = transactionsResult.data.filter(tx => !tx.isVoided);
        const todaySales = todaysTransactions.reduce((sum, tx) => sum + (tx.total || 0), 0);
        const todayVAT = todaysTransactions.reduce((sum, tx) => sum + (tx.vatAmount || 0), 0);
        
        setComplianceStats(prev => ({
          ...prev,
          todaySales,
          todayVAT,
          lastZReport: lastZReport
        }));
        
        // Generate X-report preview
        if (todaysTransactions.length > 0) {
          const xReport = await generateXReport(user.uid);
          if (xReport.success) {
            setTodaysXReport(xReport.report);
          }
        }
        
        // Check if Z-report was generated today
        if (!lastZReport || lastZReport !== today) {
          issues.push("Z-Report not generated today");
        }
      }
      
      // Set compliance status
      const fdaStatus = issues.length > 0 ? "warning" : "success";
      const rraStatus = (!lastZReport || lastZReport !== today) ? "warning" : "success";
      
      setComplianceStats(prev => ({
        ...prev,
        fda: { status: fdaStatus, issues: issues.filter(i => i.includes('medicines') || i.includes('batch')) },
        rra: { status: rraStatus, issues: issues.filter(i => i.includes('Z-Report')) }
      }));
      
    } catch (error) {
      console.error("Error loading compliance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateXReport = async () => {
    if (!user) return;
    
    const result = await generateXReport(user.uid);
    if (result.success) {
      setTodaysXReport(result.report);
      alert(`X-Report generated: ${result.report.totals.total} RWF`);
    }
  };

  const handleGenerateZReport = async () => {
    if (!user) return;
    
    if (!confirm("Uracyizeye kubona Z-Report? Ibi bizafunga ibikorwa by'uyu munsi.")) {
      return;
    }
    
    const result = await generateZReport(user.uid);
    if (result.success) {
      localStorage.setItem(`lastZReport_${user.uid}`, new Date().toISOString().split('T')[0]);
      setComplianceStats(prev => ({ ...prev, lastZReport: new Date().toISOString().split('T')[0] }));
      alert("Umunsi ufunga neza! Z-Report yakozwe.");
    } else {
      alert("Habaye ikosa: " + result.error);
    }
  };

  const handleGenerateAuditReport = async () => {
    if (!user) return;
    
    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - 1);
    
    const result = await generateKinyarwandaAuditReport(user.uid, {
      fromDate: fromDate.toISOString().split('T')[0],
      toDate: new Date().toISOString().split('T')[0]
    });
    
    if (result.success) {
      // Generate printable report
      const html = `
        <html>
          <head><title>Raporo y'Ubugenzuzi</title></head>
          <body style="padding: 20px; font-family: Arial;">
            <h1>RAPORO Y'UBUGENZUZI</h1>
            <h3>${result.data.pharmacyId}</h3>
            <h4>${result.data.period}</h4>
            <hr>
            <pre>${JSON.stringify(result.data, null, 2)}</pre>
          </body>
        </html>
      `;
      
      const printWindow = window.open("", "_blank");
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ubukode bwa FDA & RRA</h1>
          <p className="text-gray-600">Gerageza no gucunga imyitwarire y'ubukode</p>
        </div>
        <button 
          onClick={loadComplianceData}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          <RefreshCw size={16} /> Gerageza Ubukode
        </button>
      </div>

      {/* Compliance Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RRA Compliance */}
        <div className={`p-6 rounded-xl border ${
          complianceStats.rra.status === 'success' 
            ? 'border-green-200 bg-green-50' 
            : 'border-yellow-200 bg-yellow-50'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${
              complianceStats.rra.status === 'success' ? 'bg-green-100' : 'bg-yellow-100'
            }`}>
              <DollarSign className={complianceStats.rra.status === 'success' ? 'text-green-600' : 'text-yellow-600'} />
            </div>
            <div>
              <h3 className="font-bold text-lg">RRA Compliance</h3>
              <p className="text-sm text-gray-600">Tax & Revenue Authority</p>
            </div>
            <div className="ml-auto">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                complianceStats.rra.status === 'success' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {complianceStats.rra.status === 'success' ? 'Compliant' : 'Attention Needed'}
              </span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Today's Sales</span>
              <span className="font-bold">RWF {complianceStats.todaySales.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">VAT Payable</span>
              <span className="font-bold text-blue-600">RWF {complianceStats.todayVAT.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Z-Report Today</span>
              <span className={complianceStats.lastZReport === new Date().toISOString().split('T')[0] ? 'text-green-600' : 'text-red-600'}>
                {complianceStats.lastZReport === new Date().toISOString().split('T')[0] ? '✅ Generated' : '❌ Not Generated'}
              </span>
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleGenerateXReport}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              X-Report
            </button>
            <button
              onClick={handleGenerateZReport}
              className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
            >
              Z-Report
            </button>
          </div>
        </div>

        {/* FDA Compliance */}
        <div className={`p-6 rounded-xl border ${
          complianceStats.fda.status === 'success' 
            ? 'border-green-200 bg-green-50' 
            : 'border-yellow-200 bg-yellow-50'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${
              complianceStats.fda.status === 'success' ? 'bg-green-100' : 'bg-yellow-100'
            }`}>
              <Shield className={complianceStats.fda.status === 'success' ? 'text-green-600' : 'text-yellow-600'} />
            </div>
            <div>
              <h3 className="font-bold text-lg">FDA Compliance</h3>
              <p className="text-sm text-gray-600">Food & Drugs Authority</p>
            </div>
            <div className="ml-auto">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                complianceStats.fda.status === 'success' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {complianceStats.fda.status === 'success' ? 'Compliant' : 'Attention Needed'}
              </span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Expiring Soon (30 days)</span>
              <span className={`font-bold ${complianceStats.expiringMedicines > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {complianceStats.expiringMedicines} medicines
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Low Stock</span>
              <span className={`font-bold ${complianceStats.lowStockMedicines > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                {complianceStats.lowStockMedicines} medicines
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Batch Tracking</span>
              <span className={complianceStats.fda.issues.length === 0 ? 'text-green-600' : 'text-red-600'}>
                {complianceStats.fda.issues.length === 0 ? '✅ Complete' : '❌ Issues Found'}
              </span>
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <Link
              href="/dashboard/compliance/disposal"
              className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 text-center"
            >
              Record Disposal
            </Link>
            <Link
              href="/dashboard/compliance/reconciliation"
              className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 text-center"
            >
              Stock Count
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-lg mb-4">Quick Compliance Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/dashboard/compliance/prescriptions"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center"
          >
            <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="font-medium">Prescription Log</div>
            <div className="text-sm text-gray-500">FDA Required</div>
          </Link>
          
          <button
            onClick={handleGenerateAuditReport}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center"
          >
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="font-medium">Audit Report</div>
            <div className="text-sm text-gray-500">RRA/FDA Format</div>
          </button>
          
          <Link
            href="/dashboard/compliance/batch-tracking"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center"
          >
            <Barcode className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="font-medium">Batch Tracking</div>
            <div className="text-sm text-gray-500">Recall Management</div>
          </Link>
          
          <Link
            href="/dashboard/compliance/temperature"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center"
          >
            <Thermometer className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <div className="font-medium">Temperature Log</div>
            <div className="text-sm text-gray-500">Cold Chain</div>
          </Link>
        </div>
      </div>

      {/* X-Report Preview */}
      {todaysXReport && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4">Today's X-Report Preview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500">Transactions</div>
              <div className="text-2xl font-bold">{todaysXReport.totals.transactions}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500">Total Sales</div>
              <div className="text-2xl font-bold text-green-600">
                RWF {todaysXReport.totals.total.toLocaleString()}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500">VAT Amount</div>
              <div className="text-2xl font-bold text-blue-600">
                RWF {todaysXReport.totals.vatAmount.toLocaleString()}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500">Cash in Drawer</div>
              <div className="text-2xl font-bold">
                RWF {todaysXReport.totals.cash.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Report ID: {todaysXReport.reportId} | Generated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Compliance Issues */}
      {(complianceStats.rra.issues.length > 0 || complianceStats.fda.issues.length > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-2 text-red-700 mb-3">
            <AlertTriangle size={20} />
            <h3 className="font-bold">⚠️ Ibyakozwe ntabwo bihuje</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {complianceStats.rra.issues.length > 0 && (
              <div>
                <h4 className="font-medium text-red-700 mb-2">RRA Issues:</h4>
                <ul className="text-sm text-red-600 list-disc pl-5">
                  {complianceStats.rra.issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
            {complianceStats.fda.issues.length > 0 && (
              <div>
                <h4 className="font-medium text-red-700 mb-2">FDA Issues:</h4>
                <ul className="text-sm text-red-600 list-disc pl-5">
                  {complianceStats.fda.issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compliance Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-blue-800 mb-3">FDA & RRA Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-blue-700 mb-2">FDA Requirements:</h4>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• Batch numbers for all medicines</li>
              <li>• Prescription log for controlled substances</li>
              <li>• Temperature monitoring for refrigerated products</li>
              <li>• Adverse reaction reporting system</li>
              <li>• Proper disposal records for expired/damaged medicines</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-700 mb-2">RRA Requirements:</h4>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• Sequential receipt numbers (REC-YYYYMM-0001)</li>
              <li>• Correct VAT calculation (0% or 18%)</li>
              <li>• Daily Z-Reports (cannot delete transactions)</li>
              <li>• Void transactions instead of delete</li>
              <li>• Maintain audit trail for 7 years</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}