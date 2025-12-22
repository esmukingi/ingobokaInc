"use client";

import React, { useState, useEffect } from "react";
import { FileText, Download, Calendar, Search, Filter, RefreshCw, X, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getTransactionReport, exportToCSV, generatePrintReport } from "@/helper/reportHelper";
import { useAuth } from "@/hooks/auth";

export default function TransactionsReportPage() {
  const { user } = useAuth(); 
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [medicine, setMedicine] = useState("");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      loadReport();
    }
  }, [user]); 

  const loadReport = async (filters = {}) => {
    if (!user) return; 
    
    setIsLoading(true);
    setError("");
    
    try {
      const result = await getTransactionReport(user.uid, filters);
      
      if (result.success) {
        setReport(result.data);
      } else {
        setError("Habaye ikosa: " + result.error);
      }
    } catch (err) {
      setError("Ntabwo wabona raporo. Gerageza nanone.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilter = () => {
    if (!user) return; 
    
    const filters = {};
    if (from) filters.fromDate = from;
    if (to) filters.toDate = to;
    if (medicine) filters.medicine = medicine;
    
    loadReport(filters);
    setShowFilters(false);
  };

  const handleClear = () => {
    setFrom("");
    setTo("");
    setMedicine("");
    setSearch("");
    if (user) {
      loadReport();
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearch(term);
  };

  const filteredTransactions = report?.transactions.filter(tx => 
    !search || 
    (tx.medicine && tx.medicine.toLowerCase().includes(search))
  ) || [];

  const handleExportCSV = () => {
    if (!report?.transactions.length) {
      alert("Nta makuru ahari yo gushyira muri CSV");
      return;
    }

    const csv = exportToCSV(report.transactions);
    if (csv) {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `raporo_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handlePrint = () => {
    if (!report || !report.transactions.length) {
      alert("Nta makuru ahari yo gushyira muri PDF");
      return;
    }

    const html = generatePrintReport(report, { from, to, medicine });
    const printWindow = window.open("", "_blank", "width=900,height=700");
    
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    } else {
      alert("Pop-up yahagaritswe. Emera pop-ups kugirango udushe raporo.");
    }
  };

  const formatRwf = (amount) => `Rwf ${Number(amount).toLocaleString()}`;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Irazana...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header - Compact */}
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText size={18} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Raporo y'Ibikorwa</h1>
              <p className="text-xs text-gray-600">Reba ibikorwa by'imiti</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Link 
              href="/dashboard/transactions" 
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft size={14} />
              Subira
            </Link>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              <Filter size={14} />
              Amashakiro
            </button>
          </div>
        </div>

        {/* Summary Stats - Smaller */}
        {report && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <div className="text-xs text-gray-500">Ibikorwa</div>
              <div className="text-base font-bold text-gray-900">{report.summary.totalTransactions}</div>
            </div>
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <div className="text-xs text-gray-500">Igiteranyo</div>
              <div className="text-base font-bold text-green-600">{formatRwf(report.summary.totalSales)}</div>
            </div>
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <div className="text-xs text-gray-500">Imiti</div>
              <div className="text-base font-bold text-blue-600">{report.summary.medicines.length}</div>
            </div>
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <div className="text-xs text-gray-500">Itariki</div>
              <div className="text-sm font-bold text-gray-900">
                {from ? from.split('-')[2] + '/' + from.split('-')[1] : "Kera"} - {to ? to.split('-')[2] + '/' + to.split('-')[1] : "Uyu munsi"}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Panel - Compact */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm p-3 mb-3 border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-gray-800 text-sm">Shakisha Ibikorwa</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Kuva Itariki</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1.5"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-600 mb-1">Kugeza Itariki</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1.5"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-600 mb-1">Umuti</label>
              <select
                value={medicine}
                onChange={(e) => setMedicine(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 bg-white"
              >
                <option value="">Byose</option>
                {report?.summary.medicines.map((med, idx) => (
                  <option key={idx} value={med}>{med}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleClear}
              className="flex-1 px-3 py-1.5 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition flex items-center justify-center gap-1"
            >
              <RefreshCw size={12} />
              Subiramo
            </button>
            <button
              onClick={handleFilter}
              disabled={!user}
              className="flex-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              Shakisha
            </button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Shakisha umuti..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={handleExportCSV}
          disabled={!report?.transactions.length || isLoading || !user}
          className="flex-1 px-3 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
        >
          <Download size={14} />
          CSV
        </button>
        <button
          onClick={handlePrint}
          disabled={!report?.transactions.length || isLoading || !user}
          className="flex-1 px-3 py-2 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
        >
          <Calendar size={14} />
          PDF
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-6">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-xs text-gray-600">Raporo irazanwa...</p>
        </div>
      )}

      {/* Error Message */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2 text-red-700 text-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Report Table */}
      {!isLoading && report && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="border-b">
            <div className="px-3 py-2 flex justify-between items-center">
              <div className="text-sm">
                <span className="font-medium text-gray-800">Ibikorwa</span>
                <span className="text-xs text-gray-500 ml-2">
                  ({filteredTransactions.length} byabonetse)
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {new Date().toLocaleDateString('rw-RW')}
              </div>
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="py-6 text-center">
              <FileText size={24} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Nta makuru abonetse</p>
              <p className="text-xs text-gray-400 mt-1">Gerageza gushakisha indi</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">No</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Umuti</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Ingano</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Igiteranyo</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Itariki</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Imimerere</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTransactions.map((tx, index) => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-700">{index + 1}</td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-gray-800 text-sm">{tx.medicine}</div>
                          {tx.category && (
                            <div className="text-xs text-gray-500">{tx.category}</div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-gray-700">{tx.quantity}</td>
                        <td className="px-3 py-2 font-semibold text-gray-900">
                          {formatRwf(tx.total)}
                        </td>
                        <td className="px-3 py-2 text-gray-600 text-xs">{tx.displayDate}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                            tx.status === "Yarakozwe" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {tx.status || "Yarakozwe"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {filteredTransactions.slice(0, 20).map((tx, index) => (
                  <div key={tx.id} className="p-2 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 text-sm">{tx.medicine}</div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                          <span>No: {index + 1}</span>
                          <span>•</span>
                          <span>{tx.displayDate}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        tx.status === "Yarakozwe" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {tx.status || "Yarakozwe"}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                      <div>
                        <div className="text-gray-500">Ingano</div>
                        <div className="font-medium">{tx.quantity}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Igiteranyo</div>
                        <div className="font-medium">{formatRwf(tx.total)}</div>
                      </div>
                    </div>
                    
                    {tx.category && (
                      <div className="mt-1">
                        <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          {tx.category}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                
                {filteredTransactions.length > 20 && (
                  <div className="p-3 text-center text-gray-500 text-xs">
                    + {filteredTransactions.length - 20} ibindi bikorwa...
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Help Text - Smaller */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="font-medium text-gray-800 text-sm mb-1">Uburyo bwo gukoresha:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>1. Kanda "Amashakiro" gufungura panel</li>
          <li>2. Hitamo itariki cyangwa umuti</li>
          <li>3. Kanda "Shakisha"</li>
          <li>4. Koresha CSV cyangwa PDF kugirango udushe raporo</li>
          <li>5. Shakisha umuti hakoresheje aho hari "Shakisha umuti..."</li>
        </ul>
      </div>
    </div>
  );
}