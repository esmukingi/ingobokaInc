// app/dashboard/transactions/page.js
"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, ArrowRight, FileText, RefreshCw, Receipt, User, UserCircle } from "lucide-react";
import Link from "next/link";
import { getTransactions } from "@/helper/transactions.js";
import { useAuth } from "@/hooks/auth";

const TransactionRow = ({ tx }) => (
  <tr className="border-b hover:bg-gray-50 transition">
    <td className="px-3 py-3 text-sm font-mono text-gray-600">{tx.receiptNumber || tx.id.substring(0, 8)}</td> 
    <td className="px-3 py-3 text-sm text-gray-800">
      <div className="font-medium">{tx.medicine}</div>
      {tx.batchNumber && (
        <div className="text-xs text-gray-500">Lot: {tx.batchNumber}</div>
      )}
    </td> 
    <td className="px-3 py-3 text-sm text-gray-600 text-center">{tx.quantity}</td>
    <td className="px-3 py-3 text-sm text-gray-600">
      <div>Rwf {tx.subtotal?.toLocaleString() || tx.total?.toLocaleString()}</div>
      {tx.vatAmount > 0 && (
        <div className="text-xs text-gray-500">VAT: {tx.vatAmount?.toLocaleString()}</div>
      )}
    </td>
    <td className="px-3 py-3 text-sm font-semibold text-gray-800">Rwf {tx.total?.toLocaleString()} </td>
    <td className="px-3 py-3 text-sm text-gray-500">{tx.date}</td> 
    <td className="px-3 py-3 text-sm">
      {tx.prescriberName && (
        <div className="flex items-center gap-1 text-xs text-blue-600 mb-1">
          <UserCircle size={12} />
          <span className="truncate max-w-[80px]">{tx.prescriberName}</span>
        </div>
      )}
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ 
        tx.status === "voided" || tx.isVoided ? "bg-red-100 text-red-700" :
        tx.status === "Yarakozwe" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700" 
      }`}>
        {tx.isVoided ? "Yahagaritswe" : tx.status || "Yarakozwe"}
      </span>
    </td> 
  </tr>
);

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showVoided, setShowVoided] = useState(false);

  const loadTransactions = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    const result = await getTransactions(user.uid, { isVoided: false });
    
    if (result.success) {
      setTransactions(result.data);
      setError("");
    } else {
      setError("Habaye ikosa mu kuzana ibikorwa: " + result.error);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  // Filter transactions based on showVoided
  const filteredTransactions = showVoided 
    ? transactions.filter(tx => tx.isVoided)
    : transactions.filter(tx => !tx.isVoided);

  // Get today's sales
  const today = new Date().toISOString().split('T')[0];
  const todaysTransactions = transactions.filter(tx => tx.date === today && !tx.isVoided);
  const todaysTotal = todaysTransactions.reduce((sum, tx) => sum + (tx.total || 0), 0);

  return (
    <div className="flex-1 bg-gray-50 min-h-screen p-4 md:p-6 space-y-4">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2">
          <CreditCard size={24} className="text-green-600" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Ibikorwa by'Imiti</h1>
            <p className="text-sm text-gray-500">
              Reba ibikorwa by'imiti yose
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={loadTransactions}
            disabled={isLoading || !user}
            className="flex items-center justify-center gap-2 bg-gray-600 text-white px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            {isLoading ? "Iracyakora..." : "Ongera Uzane"}
          </button>
          <Link
            href="/dashboard/transactions/add"
            className="flex items-center justify-center gap-2 bg-green-600 text-white px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition"
          >
            <span className="whitespace-nowrap">Ongeramo Igikorwa</span>
            <ArrowRight size={14} />
          </Link>
          {/* ADDED: Make Report Button */}
          <Link
            href="/dashboard/transactions/report"
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            <FileText size={14} />
            <span className="whitespace-nowrap">Kora Raporo</span>
          </Link>
        </div>
      </header>

      {/* Today's Stats - Improved for small screens */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-xl shadow-sm">
          <div className="text-xs text-gray-500">Uyu munsi</div>
          <div className="text-lg font-bold text-gray-900">{todaysTransactions.length}</div>
          <div className="text-xs text-gray-600">Ibikorwa</div>
        </div>
        <div className="bg-white p-3 rounded-xl shadow-sm">
          <div className="text-xs text-gray-500">Uyu munsi</div>
          <div className="text-lg font-bold text-green-600">Rwf {todaysTotal.toLocaleString()}</div>
          <div className="text-xs text-gray-600">Umusaruro</div>
        </div>
        <div className="bg-white p-3 rounded-xl shadow-sm">
          <div className="text-xs text-gray-500">VAT Uyu munsi</div>
          <div className="text-lg font-bold text-blue-600">
            Rwf {todaysTransactions.reduce((sum, tx) => sum + (tx.vatAmount || 0), 0).toLocaleString()}
          </div>
          <div className="text-xs text-gray-600">Kuri RRA</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setShowVoided(false)}
          className={`flex-1 px-3 py-2 text-sm font-medium ${!showVoided ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500'}`}
        >
          Bikora ({transactions.filter(tx => !tx.isVoided).length})
        </button>
        <button
          onClick={() => setShowVoided(true)}
          className={`flex-1 px-3 py-2 text-sm font-medium ${showVoided ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}
        >
          Yahagaritswe ({transactions.filter(tx => tx.isVoided).length})
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="mt-2 text-sm text-gray-600">Ibikorwa birazanwa...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* DESKTOP TABLE - Adjusted for smaller screens */}
      {!isLoading && !error && (
        <>
          <div className="hidden md:block bg-white shadow-sm rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-3 py-3 text-left">No. ya Resi</th>
                    <th className="px-3 py-3 text-left">Umuti</th>
                    <th className="px-3 py-3 text-left">Ingano</th>
                    <th className="px-3 py-3 text-left">Subtotal</th>
                    <th className="px-3 py-3 text-left">Total</th>
                    <th className="px-3 py-3 text-left">Itariki</th>
                    <th className="px-3 py-3 text-left">Imimerere</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredTransactions.map((tx) => (
                    <TransactionRow key={tx.id} tx={tx} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE CARDS - Improved spacing */}
          <div className="md:hidden flex flex-col gap-3">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-white rounded-xl shadow-sm p-3 flex flex-col gap-2"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800 text-sm">{tx.medicine}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <Receipt size={12} />
                      {tx.receiptNumber || tx.id.substring(0, 8)}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ml-2 ${
                    tx.isVoided ? "bg-red-100 text-red-700" :
                    tx.status === "Yarakozwe" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {tx.isVoided ? "Yahagaritswe" : tx.status || "Yarakozwe"}
                  </span>
                </div>
                
                {tx.prescriberName && (
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <User size={12} />
                    <span className="truncate">Dr: {tx.prescriberName}</span>
                  </div>
                )}
                
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <div>
                    <div className="text-xs text-gray-500">Ingano</div>
                    <div className="font-medium text-sm">{tx.quantity}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Igiteranyo</div>
                    <div className="font-medium text-sm text-green-600">Rwf {tx.total?.toLocaleString()}</div>
                  </div>
                  {tx.batchNumber && (
                    <div>
                      <div className="text-xs text-gray-500">Lot</div>
                      <div className="font-medium text-xs">{tx.batchNumber}</div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="text-xs text-gray-400">{tx.date}</div>
                  {tx.vatAmount > 0 && (
                    <div className="text-xs text-blue-600">
                      VAT: Rwf {tx.vatAmount?.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredTransactions.length === 0 && (
        <div className="text-center py-8 bg-white rounded-xl shadow-sm">
          <CreditCard size={40} className="mx-auto text-gray-400" />
          <h3 className="mt-3 text-base font-medium text-gray-900">
            {showVoided ? "Nta bikorwa byahagaritswe" : "Nta bikorwa birabonetse"}
          </h3>
          <p className="mt-1 text-sm text-gray-500 max-w-xs mx-auto">
            {showVoided 
              ? "Nta bikorwa byahagaritswe kugeza ubu"
              : "Tangira ukoresha sisitemu ukoresheje buto y'Ongeramo Igikorwa."
            }
          </p>
          {!showVoided && (
            <Link
              href="/dashboard/transactions/add"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm mt-3"
            >
              Tangira ukora ibikorwa
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
      )}

      {/* Important Notice */}
      {filteredTransactions.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center gap-2 text-blue-700">
            <Receipt size={18} />
            <div className="text-sm">
              <h4 className="font-medium">Ibikenewe:</h4>
              <ul className="text-blue-600 mt-1 space-y-1">
                <li className="flex items-start gap-1">
                  <span>•</span>
                  <span>Burigikorwa kigira inomero ya resi itandukanye</span>
                </li>
                <li className="flex items-start gap-1">
                  <span>•</span>
                  <span>Ntushobora gusiba igikorwa, ushobora gukihagarika gusa</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {filteredTransactions.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="text-xs text-gray-500">Igiteranyo cy'ingano</div>
            <div className="text-lg font-bold text-blue-600">
              {filteredTransactions.reduce((sum, tx) => sum + (parseInt(tx.quantity) || 0), 0)}
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="text-xs text-gray-500">Igiteranyo cy'amafaranga</div>
            <div className="text-lg font-bold text-green-600">
              Rwf {filteredTransactions.reduce((sum, tx) => sum + (tx.total || 0), 0).toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}