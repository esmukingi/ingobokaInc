"use client";

import React, { useState, useEffect } from "react";
import { FileText, Download, Calendar as CalendarIcon, Search, RefreshCw, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { getExpenseReport, generateExpenseCSV, getExpenseCategories } from "@/helper/expenses.js";
import { useAuth } from "@/hooks/auth";

export default function ExpensesReportPage() {
  const { user, loading: authLoading } = useAuth();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [report, setReport] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [activeFilters, setActiveFilters] = useState({});

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    }
  }, [authLoading, user]);

  const loadData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      // Load report with date filters
      const reportResult = await getExpenseReport(user.uid, from || null, to || null);
      
      if (reportResult.success) {
        setReport(reportResult.data);
        
        // Apply initial filters
        let filtered = reportResult.data.expenses || [];
        
        // Apply category filter if set
        if (category && category !== "all") {
          filtered = filtered.filter(exp => exp.category === category);
        }
        
        // Apply search filter if set
        if (search.trim()) {
          const term = search.toLowerCase();
          filtered = filtered.filter(exp => 
            exp.description.toLowerCase().includes(term) ||
            (exp.receiptNumber && exp.receiptNumber.toLowerCase().includes(term))
          );
        }
        
        setFilteredData(filtered);
      } else {
        setError(reportResult.message || "Ntabwo wabona raporo. Gerageza nanone.");
      }

      // Load categories for dropdown
      const catResult = await getExpenseCategories(user.uid);
      if (catResult.success) {
        setCategories(catResult.data);
      }
      
    } catch (err) {
      console.error("Error loading report:", err);
      setError("Habaye ikosa mu kuzana raporo. Gerageza nanone.");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    if (!report) return;
    
    let filtered = report.expenses || [];
    
    // Apply date filters (already handled in getExpenseReport)
    // Apply category filter
    if (category && category !== "all") {
      filtered = filtered.filter(exp => exp.category === category);
    }
    
    // Apply search filter
    if (search.trim()) {
      const term = search.toLowerCase();
      filtered = filtered.filter(exp => 
        exp.description.toLowerCase().includes(term) ||
        (exp.receiptNumber && exp.receiptNumber.toLowerCase().includes(term))
      );
    }
    
    setFilteredData(filtered);
    setActiveFilters({ from, to, category, search });
  };

  // Update filters when category or search changes
  useEffect(() => {
    if (report) {
      applyFilters();
    }
  }, [category, search, report]);

  const handleExportCSV = () => {
    if (!filteredData.length) {
      alert("Nta makuru ahari yo gushyira muri CSV");
      return;
    }

    const csv = generateExpenseCSV(filteredData);
    if (!csv) {
      alert("Habaye ikosa mu kora CSV");
      return;
    }

    try {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `amafaranga_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      alert("Habaye ikosa mu gutanga CSV");
    }
  };

  const formatRwf = (amount) => {
    if (!amount && amount !== 0) return "Rwf 0";
    return `Rwf ${Number(amount).toLocaleString()}`;
  };

  const clearFilters = () => {
    setFrom("");
    setTo("");
    setCategory("all");
    setSearch("");
    // Reload data without filters
    if (user) {
      loadData();
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="mt-2 text-sm text-gray-600">Irazana...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <header className="mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText size={18} className="text-green-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Raporo y'Amafaranga</h1>
              <p className="text-xs text-gray-600">Reba ibikorwa by'amafaranga yatanzwe</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Link 
              href="/dashboard/expenses" 
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft size={14} />
              Subira
            </Link>
          </div>
        </div>

        {/* Summary Stats - Only show if we have data */}
        {report && report.expenses && report.expenses.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <div className="text-xs text-gray-500">Ibikorwa</div>
              <div className="text-base font-bold text-gray-900">
                {filteredData.length}
              </div>
            </div>
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <div className="text-xs text-gray-500">Igiteranyo</div>
              <div className="text-base font-bold text-green-600">
                {formatRwf(filteredData.reduce((sum, exp) => sum + (exp.amount || 0), 0))}
              </div>
            </div>
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <div className="text-xs text-gray-500">Ibyiciro</div>
              <div className="text-base font-bold text-blue-600">
                {[...new Set(filteredData.map(exp => exp.category).filter(Boolean))].length}
              </div>
            </div>
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <div className="text-xs text-gray-500">Itariki</div>
              <div className="text-sm font-bold text-gray-900">
                {from || report.dateRange?.from 
                  ? (from || report.dateRange.from)?.split('-')[2] + '/' + (from || report.dateRange.from)?.split('-')[1] 
                  : "Kera"
                } - {
                  to || report.dateRange?.to 
                  ? (to || report.dateRange.to)?.split('-')[2] + '/' + (to || report.dateRange.to)?.split('-')[1] 
                  : "Uyu munsi"
                }
              </div>
            </div>
          </div>
        )}

        {/* No Data Message */}
        {!isLoading && (!report || !report.expenses || report.expenses.length === 0) && (
          <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-700 text-sm">
              <AlertCircle size={14} />
              <span>Nta makuru y'amafaranga yatanzwe mubisanzwe. Tangira gutanga amafaranga.</span>
            </div>
          </div>
        )}
      </header>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-3 mb-3 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Uhereye</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1.5"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-600 mb-1">Kugeza</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1.5"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-600 mb-1">Icyiciro</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 bg-white"
              disabled={isLoading}
            >
              <option value="all">Byose</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Shakisha</label>
            <div className="flex items-center border border-gray-300 rounded px-2 py-1.5">
              <Search size={14} className="text-gray-400" />
              <input
                type="text"
                placeholder="Ibisobanuro cyangwa numero ya resi"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ml-2 w-full text-xs outline-none"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex gap-2 items-end">
            <button
              onClick={loadData}
              disabled={isLoading || !user}
              className="flex-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition flex items-center justify-center gap-1 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Iracyakora...
                </>
              ) : "Shakisha"}
            </button>
            <button
              onClick={clearFilters}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition flex items-center gap-1 disabled:opacity-50"
            >
              <RefreshCw size={12} />
              Subiramo
            </button>
          </div>
        </div>

        {/* Active Filters Display */}
        {(from || to || category !== "all" || search) && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500 mb-1">Amashakiro akoreshwa:</div>
            <div className="flex flex-wrap gap-1">
              {from && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                  Kuva: {from}
                </span>
              )}
              {to && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                  Kugeza: {to}
                </span>
              )}
              {category !== "all" && (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                  Icyiciro: {category}
                </span>
              )}
              {search && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                  Shakisha: "{search}"
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Export Button and Info */}
      <div className="mb-3">
        <button
          onClick={handleExportCSV}
          disabled={!filteredData.length || isLoading}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={14} />
          CSV Export ({filteredData.length} ibikorwa)
        </button>
        {filteredData.length > 0 && (
          <p className="text-xs text-gray-500 mt-1 text-center">
            Kanda buto kugirango udushe amakuru muri fayiri ya CSV
          </p>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-6">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
          <p className="mt-2 text-xs text-gray-600">Raporo irazanwa...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
          <button
            onClick={loadData}
            className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
          >
            Gerageza nanone
          </button>
        </div>
      )}

      {/* Report Table */}
      {!isLoading && report && filteredData.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="border-b">
            <div className="px-3 py-2 flex justify-between items-center">
              <div className="text-sm">
                <span className="font-medium text-gray-800">Ibikorwa</span>
                <span className="text-xs text-gray-500 ml-2">
                  ({filteredData.length} byabonetse)
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {new Date().toLocaleDateString('rw-RW')}
              </div>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">No.</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Ibisobanuro</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Icyiciro</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Amafaranga</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Itariki</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">No. ya Resi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.map((exp, index) => (
                  <tr key={exp.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-700">{index + 1}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-gray-800 text-sm">{exp.description}</div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {exp.category || 'Other'}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-semibold text-gray-900">
                      {formatRwf(exp.amount)}
                    </td>
                    <td className="px-3 py-2 text-gray-600 text-xs">
                      {exp.formattedDate || exp.date || 'N/A'}
                    </td>
                    <td className="px-3 py-2 text-xs font-mono text-gray-400">
                      {exp.receiptNumber?.substring(0, 12) || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {filteredData.map((exp, index) => (
              <div key={exp.id} className="p-2 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-gray-800 text-sm">{exp.description}</div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                        {exp.category || 'Other'}
                      </span>
                      <span>{exp.formattedDate || exp.date || 'N/A'}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-400">#{index + 1}</span>
                    </div>
                  </div>
                  <div className="font-semibold text-green-600 text-sm">
                    {formatRwf(exp.amount)}
                  </div>
                </div>
                
                {exp.receiptNumber && (
                  <div className="mt-2 text-xs text-gray-400 font-mono">
                    {exp.receiptNumber}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary Footer */}
          <div className="border-t p-3 bg-gray-50">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Igiteranyo:</span>
              <span className="font-bold text-green-700">
                {formatRwf(filteredData.reduce((sum, exp) => sum + (exp.amount || 0), 0))}
              </span>
            </div>
          </div>
        </div>
      ) : !isLoading && report && (
        // No results message
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <FileText size={32} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-base font-medium text-gray-900">Nta makuru abonetse</h3>
          <p className="text-sm text-gray-500 mt-1">
            {from || to || category !== "all" || search 
              ? "Nta bikorwa bihuriye namashakiro yashyizweho. Gerageza gushakisha indi."
              : "Nta makuru y'amafaranga yatanzwe. Tangira gutanga amafaranga ukoresheje buto y'Ongeramo."
            }
          </p>
          {(from || to || category !== "all" || search) && (
            <button
              onClick={clearFilters}
              className="mt-3 text-sm text-green-600 hover:text-green-700 hover:underline"
            >
              Reba byose
            </button>
          )}
        </div>
      )}

      {/* Help Section */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="font-medium text-gray-800 text-sm mb-2">Uburyo bwo gukoresha:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li className="flex items-start gap-1">
            <span className="text-green-500">✓</span>
            <span>Hitamo itariki kuva na kugeza kugirango urebe amafaranga yatanzwe mu gihe runaka</span>
          </li>
          <li className="flex items-start gap-1">
            <span className="text-green-500">✓</span>
            <span>Hitamo icyiciro kugirango urebe amafaranga yatanzwe muri icyo gice</span>
          </li>
          <li className="flex items-start gap-1">
            <span className="text-green-500">✓</span>
            <span>Shakisha ibisobanuro cyangwa numero ya resi</span>
          </li>
          <li className="flex items-start gap-1">
            <span className="text-green-500">✓</span>
            <span>Kanda "CSV Export" kugirango udushe raporo muri fayiri ya Excel</span>
          </li>
        </ul>
      </div>
    </div>
  );
}