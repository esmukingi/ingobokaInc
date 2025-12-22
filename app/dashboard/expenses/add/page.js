"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Loader, AlertCircle } from "lucide-react";
import { addExpense, getExpenseCategories } from "@/helper/expenses";
import { useAuth } from "@/hooks/auth";

export default function AddExpensePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("Other");
  const [categories, setCategories] = useState(["Other", "Utilities", "Supplies", "Rent", "Salary", "Maintenance"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
    
    // Load categories from existing expenses
    if (user) {
      loadCategories();
    }
  }, [user]);

  const loadCategories = async () => {
    const result = await getExpenseCategories(user.uid);
    if (result.success && result.data.length > 0) {
      setCategories(prev => [...new Set([...prev, ...result.data])]);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!user) {
      setError("Ntabwo wemewe. Gerageza kongera winjire.");
      return;
    }

    // Validation
    if (!description.trim()) {
      setError("Shyiramo ibisobanuro.");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("Shyiramo amafaranga niba.");
      return;
    }

    if (!date) {
      setError("Hitamo itariki.");
      return;
    }

    setLoading(true);

    const result = await addExpense(
      {
        description: description.trim(),
        amount: parseFloat(amount),
        date,
        category
      },
      user.uid
    );

    setLoading(false);

    if (result.success) {
      setSuccess(`Yongewemo neza! Numero ya Resi: ${result.receiptNumber}`);
      
      // Reset form
      setDescription("");
      setAmount("");
      setCategory("Other");
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/dashboard/expenses");
      }, 2000);
    } else {
      setError(result.message);
    }
  };

  if (authLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Link 
            href="/dashboard/expenses" 
            className="flex items-center gap-1 text-green-600 hover:text-green-700 text-sm"
          >
            <ArrowLeft size={16} />
            Subira inyuma
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Plus size={20} className="text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Ongeramo Amafaranga</h1>
            <p className="text-sm text-gray-500 mt-1">Shyiramo amakuru y'amafaranga yatanzwe</p>
          </div>
        </div>
      </header>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-medium">{success}</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle size={16} />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm p-4">
        <form onSubmit={handleAddExpense} className="space-y-4">
          {/* Description */}
          <div>
            <label className="text-gray-800 font-medium text-sm mb-1 block">
              Ibisobanuro
            </label>
            <input
              type="text"
              placeholder="Andika ibisobanuro"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              required
              disabled={loading}
            />
          </div>

          {/* Amount and Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-800 font-medium text-sm mb-1 block">
                Amafaranga (Rwf)
              </label>
              <input
                type="number"
                placeholder="Shyiramo umubare"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-gray-800 font-medium text-sm mb-1 block">
                Icyiciro
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={loading}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-gray-800 font-medium text-sm mb-1 block">
              Itariki
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              required
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-medium rounded-lg transition text-sm ${
              loading
                ? "bg-green-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {loading ? (
              <>
                <Loader size={14} className="animate-spin" />
                Iracyakozwa...
              </>
            ) : (
              <>
                <Plus size={14} />
                Ongeramo Amafaranga
              </>
            )}
          </button>
        </form>

        {/* Quick Amount Buttons */}
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-gray-500 mb-2">Hitamo umubare:</p>
          <div className="flex gap-2">
            {[1000, 5000, 10000, 20000, 50000].map((num) => (
              <button
                type="button"
                key={num}
                onClick={() => setAmount(num.toString())}
                className="flex-1 px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded transition"
                disabled={loading}
              >
                {num.toLocaleString()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}