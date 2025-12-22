// context/SearchContext.js
"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { getMedicines } from "@/helper/inventory";
import { getTransactions } from "@/helper/transactions";
import { getExpenses } from "@/helper/expenses";
import { useAuth } from "@/hooks/auth";

const SearchContext = createContext();

export function SearchProvider({ children }) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Perform global search
  const performGlobalSearch = useCallback(async (query) => {
    if (!user || !query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setShowResults(true);

    try {
      const lowerQuery = query.toLowerCase();
      const allResults = [];

      // 1. Search Medicines
      const medicinesResult = await getMedicines(user.uid);
      if (medicinesResult.success) {
        const medResults = medicinesResult.data.filter(medicine => 
          medicine.name?.toLowerCase().includes(lowerQuery) ||
          medicine.category?.toLowerCase().includes(lowerQuery) ||
          medicine.batchNumber?.toLowerCase().includes(lowerQuery) ||
          medicine.description?.toLowerCase().includes(lowerQuery) ||
          medicine.supplier?.toLowerCase().includes(lowerQuery)
        ).map(medicine => ({
          ...medicine,
          type: 'medicine',
          typeLabel: 'Medicine',
          icon: '💊',
          link: `/dashboard/inventory/edit/${medicine.id}`,
          displayName: medicine.name
        }));

        allResults.push(...medResults);
      }

      // 2. Search Transactions
      const transactionsResult = await getTransactions(user.uid, { isVoided: false });
      if (transactionsResult.success) {
        const txResults = transactionsResult.data.filter(tx => 
          tx.customerName?.toLowerCase().includes(lowerQuery) ||
          tx.medicine?.toLowerCase().includes(lowerQuery) ||
          tx.receiptNumber?.toLowerCase().includes(lowerQuery) ||
          (tx.total?.toString() || '').includes(query) ||
          tx.paymentMethod?.toLowerCase().includes(lowerQuery)
        ).map(tx => ({
          ...tx,
          type: 'transaction',
          typeLabel: 'Transaction',
          icon: '💰',
          link: `/dashboard/transactions/${tx.id}`,
          displayName: tx.customerName || tx.medicine || 'Transaction'
        }));

        allResults.push(...txResults);
      }

      // 3. Search Expenses
      const expensesResult = await getExpenses(user.uid);
      if (expensesResult.success) {
        const expResults = expensesResult.data.filter(expense => 
          expense.category?.toLowerCase().includes(lowerQuery) ||
          expense.description?.toLowerCase().includes(lowerQuery) ||
          expense.supplier?.toLowerCase().includes(lowerQuery) ||
          expense.paymentMethod?.toLowerCase().includes(lowerQuery) ||
          (expense.amount?.toString() || '').includes(query)
        ).map(expense => ({
          ...expense,
          type: 'expense',
          typeLabel: 'Expense',
          icon: '📝',
          link: `/dashboard/expenses/edit/${expense.id}`,
          displayName: expense.description || expense.category
        }));

        allResults.push(...expResults);
      }

      // 4. Search Customers (from transactions)
      if (transactionsResult.success) {
        const customersMap = new Map();
        transactionsResult.data.forEach(tx => {
          if (tx.customerName && tx.customerName.toLowerCase().includes(lowerQuery)) {
            if (!customersMap.has(tx.customerName)) {
              customersMap.set(tx.customerName, {
                name: tx.customerName,
                transactionCount: 0,
                totalSpent: 0,
                lastPurchase: tx.date
              });
            }
            const customer = customersMap.get(tx.customerName);
            customer.transactionCount++;
            customer.totalSpent += tx.total || 0;
          }
        });

        const customerResults = Array.from(customersMap.values()).map(customer => ({
          ...customer,
          type: 'customer',
          typeLabel: 'Customer',
          icon: '👤',
          link: `/dashboard/customers?search=${encodeURIComponent(customer.name)}`,
          displayName: customer.name
        }));

        allResults.push(...customerResults);
      }

      setSearchResults(allResults);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [user]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  }, []);

  // Handle search input change
  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query);
    if (query.trim().length >= 2) {
      await performGlobalSearch(query);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [performGlobalSearch]);

  return (
    <SearchContext.Provider value={{
      searchQuery,
      searchResults,
      isSearching,
      showResults,
      handleSearch,
      clearSearch,
      setShowResults,
      performGlobalSearch
    }}>
      {children}
    </SearchContext.Provider>
  );
}

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within SearchProvider");
  }
  return context;
};