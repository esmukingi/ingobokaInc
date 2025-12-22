"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, FileText, Trash2, Loader, RefreshCw, AlertCircle } from "lucide-react";
import { getExpenses, deleteExpense } from "@/helper/expenses";
import { useAuth } from "@/hooks/auth";

export default function ExpensesPage() {
  const { user, loading: authLoading } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (!authLoading && user) {
      fetchExpenses();
    }
  }, [authLoading, user]);

  const fetchExpenses = async () => {
    if (!user) return;
    
    setLoading(true);
    setError("");
    
    const result = await getExpenses(user.uid);
    
    if (result.success) {
      setExpenses(result.data);
      // Calculate total
      const total = result.data.reduce((sum, exp) => sum + exp.amount, 0);
      setTotalAmount(total);
    } else {
      setError(result.message || "Ntabwo byakunze gukura amafaranga.");
    }
    
    setLoading(false);
  };

  const handleDelete = async (expenseId) => {
    if (!confirm("Urifuza gusiba iki gikorwa?")) return;
    
    setDeletingId(expenseId);
    const result = await deleteExpense(expenseId, user.uid);
    
    if (result.success) {
      setExpenses(prev => prev.filter(exp => exp.id !== expenseId));
      // Recalculate total
      const updatedTotal = expenses
        .filter(exp => exp.id !== expenseId)
        .reduce((sum, exp) => sum + exp.amount, 0);
      setTotalAmount(updatedTotal);
    } else {
      alert(result.message);
    }
    
    setDeletingId(null);
  };

  if (authLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
              Ibikwiye Gutangwa (Expenses)
            </h1>
            <p className="text-sm text-gray-500">
              Reba na gucunga amafaranga yatanzwe
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchExpenses}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              {loading ? "Iracyakora..." : "Ongera Uzane"}
            </button>
            <Link
              href="/dashboard/expenses/add"
              className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition text-sm"
            >
              <Plus size={14} />
              Ongeramo
            </Link>
          </div>
        </div>
      </header>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* TOTAL SUMMARY */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <div className="text-xs text-gray-500">Imibare yose</div>
          <div className="text-lg font-bold text-gray-900">{expenses.length}</div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <div className="text-xs text-gray-500">Igiteranyo</div>
          <div className="text-lg font-bold text-green-600">
            {totalAmount.toLocaleString()} RWF
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <Link href="/dashboard/expenses/report" className="block">
            <div className="text-xs text-gray-500">Kora Raporo</div>
            <div className="text-lg font-bold text-blue-600 flex items-center gap-2">
              <FileText size={16} />
              Tangira
            </div>
          </Link>
        </div>
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">Ibisobanuro</th>
              <th className="px-4 py-3 text-left">Icyiciro</th>
              <th className="px-4 py-3 text-left">Amafaranga (Rwf)</th>
              <th className="px-4 py-3 text-left">Itariki</th>
              <th className="px-4 py-3 text-left">Numero ya Resi</th>
              <th className="px-4 py-3 text-left">Ibikorwa</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center">
                  <Loader className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                </td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                  Nta gikorwa cyo gutanga amafaranga kiraboneka
                </td>
              </tr>
            ) : (
              expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{expense.description}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {expense.amount.toLocaleString()} RWF
                  </td>
                  <td className="px-4 py-3 text-gray-500">{expense.formattedDate || expense.date}</td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-400">
                    {expense.receiptNumber || 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(expense.id)}
                      disabled={deletingId === expense.id}
                      className="text-red-600 hover:text-red-800 p-1 disabled:opacity-50"
                      title="Siba"
                    >
                      {deletingId === expense.id ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARDS */}
      <div className="md:hidden flex flex-col gap-3">
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-8 flex items-center justify-center">
            <Loader className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="text-gray-400 mb-2">Nta gikorwa cyo gutanga amafaranga kiraboneka</div>
            <Link
              href="/dashboard/expenses/add"
              className="inline-block mt-2 text-green-600 hover:text-green-700 text-sm"
            >
              Tangira gutanga
            </Link>
          </div>
        ) : (
          expenses.map((expense) => (
            <div
              key={expense.id}
              className="bg-white rounded-xl shadow-sm p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800">{expense.description}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {expense.category}
                    </span>
                    <span className="text-xs text-gray-500">{expense.formattedDate || expense.date}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(expense.id)}
                  disabled={deletingId === expense.id}
                  className="text-red-600 ml-2"
                >
                  {deletingId === expense.id ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-gray-600">
                  <span className="font-bold text-lg">
                    {expense.amount.toLocaleString()} RWF
                  </span>
                </div>
                {expense.receiptNumber && (
                  <div className="text-xs text-gray-400 font-mono">
                    {expense.receiptNumber.substring(0, 8)}...
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}