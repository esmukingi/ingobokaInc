// /helper/expenses.js
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  doc,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/firebase/config';

/**
 * Adds a new expense to Firestore
 */
export const addExpense = async (expenseData, userId) => {
  try {
    if (!expenseData.description || !expenseData.amount || !expenseData.date) {
      return { success: false, message: "Shyiramo ibisobanuro, amafaranga, n'itariki." };
    }

    const amountNum = Number(expenseData.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return { success: false, message: "Amafaranga agomba kuba inomero nini kurusha zero." };
    }

    const expenseRef = collection(db, 'expenses');
    const newExpense = {
      description: expenseData.description,
      amount: amountNum,
      date: expenseData.date, // YYYY-MM-DD format
      category: expenseData.category || 'Other',
      userId: userId,
      createdAt: Timestamp.now(),
      receiptNumber: generateReceiptNumber()
    };

    const docRef = await addDoc(expenseRef, newExpense);
    return {
      success: true,
      message: "Amafaranga yatanzwe yongewemo neza!",
      id: docRef.id,
      receiptNumber: newExpense.receiptNumber
    };
  } catch (error) {
    console.error("Error adding expense:", error);
    return { 
      success: false, 
      message: `Habaye ikosa: ${error.code === 'permission-denied' ? 'Nta mweragwe wohereza.' : error.message}` 
    };
  }
};

/**
 * Fetches expenses with optional filters
 */
export const getExpenses = async (userId, filters = {}) => {
  try {
    const expensesRef = collection(db, 'expenses');
    let q = query(expensesRef, where('userId', '==', userId));

    // Apply filters
    if (filters.fromDate) {
      q = query(q, where('date', '>=', filters.fromDate));
    }
    if (filters.toDate) {
      q = query(q, where('date', '<=', filters.toDate));
    }
    if (filters.category && filters.category !== "all" && filters.category !== "") {
      q = query(q, where('category', '==', filters.category));
    }

    // Order by date (newest first)
    q = query(q, orderBy('date', 'desc'));

    const querySnapshot = await getDocs(q);
    const expenses = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      expenses.push({
        id: doc.id,
        ...data,
        // Format date for display
        formattedDate: formatDateForDisplay(data.date),
        // Convert Timestamp to string if needed
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
      });
    });

    return { success: true, data: expenses };
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return { 
      success: false, 
      message: `Ntabwo byakunze: ${error.message}`,
      error: error.code
    };
  }
};

/**
 * Gets expense report with summary statistics
 */
export const getExpenseReport = async (userId, fromDate = null, toDate = null) => {
  try {
    // Prepare filters for getExpenses
    const filters = {};
    if (fromDate) filters.fromDate = fromDate;
    if (toDate) filters.toDate = toDate;

    // Get expenses with date filters
    const result = await getExpenses(userId, filters);
    
    if (!result.success) {
      return result; // Return the error from getExpenses
    }

    const expenses = result.data;
    
    // Calculate summary statistics
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    // Get unique categories
    const categories = [...new Set(expenses.map(exp => exp.category).filter(Boolean))];
    
    // Calculate category totals
    const categoryTotals = {};
    expenses.forEach(exp => {
      if (!categoryTotals[exp.category]) {
        categoryTotals[exp.category] = 0;
      }
      categoryTotals[exp.category] += exp.amount;
    });

    // Calculate daily totals
    const dailyTotals = {};
    expenses.forEach(exp => {
      if (!dailyTotals[exp.date]) {
        dailyTotals[exp.date] = 0;
      }
      dailyTotals[exp.date] += exp.amount;
    });

    // Find largest and smallest expenses
    const largestExpense = expenses.length > 0 ? 
      expenses.reduce((max, exp) => exp.amount > max.amount ? exp : max, expenses[0]) : null;
    
    const smallestExpense = expenses.length > 0 ? 
      expenses.reduce((min, exp) => exp.amount < min.amount ? exp : min, expenses[0]) : null;

    return {
      success: true,
      data: {
        // Summary
        totalTransactions: expenses.length,
        totalAmount,
        averageExpense: expenses.length > 0 ? totalAmount / expenses.length : 0,
        
        // Categories
        categories,
        categoryTotals,
        
        // Time-based
        dailyTotals,
        
        // Extremes
        largestExpense: largestExpense ? {
          description: largestExpense.description,
          amount: largestExpense.amount,
          date: largestExpense.date
        } : null,
        
        smallestExpense: smallestExpense ? {
          description: smallestExpense.description,
          amount: smallestExpense.amount,
          date: smallestExpense.date
        } : null,
        
        // Date range
        dateRange: {
          from: fromDate || (expenses.length > 0 ? expenses[expenses.length - 1].date : null),
          to: toDate || (expenses.length > 0 ? expenses[0].date : null)
        },
        
        // Raw data for tables
        expenses
      }
    };
  } catch (error) {
    console.error("Error getting expense report:", error);
    return { 
      success: false, 
      message: `Ikosa mu gukora raporo: ${error.message}` 
    };
  }
};

/**
 * Gets all unique expense categories for a user
 */
export const getExpenseCategories = async (userId) => {
  try {
    const result = await getExpenses(userId);
    if (!result.success) return { success: false, data: [] };

    const categories = [...new Set(result.data.map(exp => exp.category))];
    return { success: true, data: categories };
  } catch (error) {
    console.error("Error getting categories:", error);
    return { success: false, data: [], message: error.message };
  }
};

/**
 * Deletes an expense
 */
export const deleteExpense = async (expenseId, userId) => {
  try {
    const expenseRef = doc(db, 'expenses', expenseId);
    
    // Optional: Verify the expense belongs to the user before deleting
    // You might want to add this security check
    await deleteDoc(expenseRef);
    
    return { 
      success: true, 
      message: "Amafaranga yasibwe neza." 
    };
  } catch (error) {
    console.error("Error deleting expense:", error);
    return { 
      success: false, 
      message: `Ntabwo yasibwe: ${error.message}` 
    };
  }
};

/**
 * Gets expense summary statistics for dashboard
 */
export const getExpenseSummary = async (userId, period = 'month') => {
  try {
    const today = new Date();
    let startDate = '';
    
    switch(period) {
      case 'week':
        startDate = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    }

    const result = await getExpenses(userId, { fromDate: startDate });
    
    if (!result.success) {
      return { success: false, data: {} };
    }

    const expenses = result.data;
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    // Group by category
    const byCategory = expenses.reduce((acc, exp) => {
      if (!acc[exp.category]) acc[exp.category] = 0;
      acc[exp.category] += exp.amount;
      return acc;
    }, {});

    // Daily spending
    const byDate = expenses.reduce((acc, exp) => {
      if (!acc[exp.date]) acc[exp.date] = 0;
      acc[exp.date] += exp.amount;
      return acc;
    }, {});

    return {
      success: true,
      data: {
        totalExpenses: expenses.length,
        totalAmount,
        averagePerDay: expenses.length > 0 ? totalAmount / expenses.length : 0,
        byCategory,
        byDate,
        expenses
      }
    };
  } catch (error) {
    console.error("Error getting summary:", error);
    return { success: false, data: {}, message: error.message };
  }
};

/**
 * Generates CSV for export
 */
export const generateExpenseCSV = (expenses) => {
  if (!expenses || expenses.length === 0) return '';
  
  const headers = ['ID', 'Ibisobanuro', 'Icyiciro', 'Amafaranga (Rwf)', 'Itariki', 'Numero ya Resi'];
  const rows = expenses.map(exp => [
    exp.id.substring(0, 8),
    `"${exp.description.replace(/"/g, '""')}"`,
    exp.category,
    exp.amount,
    exp.date,
    exp.receiptNumber || 'N/A'
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
};

/**
 * Helper functions
 */
const generateReceiptNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `EXP-${year}${month}${day}-${random}`;
};

const formatDateForDisplay = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('rw-RW', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};