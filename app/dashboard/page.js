"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  RefreshCw,
  Loader,
  Users,
  Clock,
  Pill,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Activity,
  CreditCard,
  BarChart3,
  CheckCircle,
  XCircle,
  Plus,
  Eye,
  Search,
  ChevronRight,
  FileText
} from "lucide-react";
import { useAuth } from "@/hooks/auth";
import { getMedicines } from "@/helper/inventory";
import { getExpenses } from "@/helper/expenses";
import { getTransactions } from "@/helper/transactions";
import DashboardSearchResults from "@/components/DashboardSearchResults";
import { useSearch } from "@/context/searchContext";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { searchQuery } = useSearch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [dashboardData, setDashboardData] = useState({
    // Inventory Stats
    totalMedicines: 0,
    totalStockValue: 0,
    expiredCount: 0,
    expiredLoss: 0,
    lowStockCount: 0,
    nearExpiryCount: 0,
    
    // Sales Stats
    todaySales: 0,
    yesterdaySales: 0,
    weeklySales: 0,
    monthlySales: 0,
    changePercent: 0,
    isPositive: true,
    
    // Customer Stats
    todayTransactions: 0,
    todayCustomers: 0,
    avgTransactionValue: 0,
    
    // Expense Stats
    todayExpenses: 0,
    monthlyExpenses: 0,
    profitMargin: 0,
    
    // Lists
    nearExpiryMedicines: [],
    topSellingMedicines: [],
    lowStockMedicines: [],
    recentTransactions: []
  });

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    setError("");
    
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const todayStr = today.toISOString().split('T')[0];
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      // Start of week (Monday)
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + 1);
      const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
      
      // Start of month
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfMonthStr = startOfMonth.toISOString().split('T')[0];
      
      console.log("📊 Fetching dashboard data...");
      
      // 1. Fetch Medicines
      const medicinesResult = await getMedicines(user.uid);
      let totalMedicines = 0;
      let totalStockValue = 0;
      let expiredCount = 0;
      let expiredLoss = 0;
      let lowStockCount = 0;
      let nearExpiryCount = 0;
      let nearExpiryList = [];
      let lowStockList = [];
      
      if (medicinesResult.success && medicinesResult.data) {
        totalMedicines = medicinesResult.data.length;
        
        medicinesResult.data.forEach(medicine => {
          // Calculate stock value
          const stockValue = (medicine.quantity || 0) * (medicine.price || 0);
          totalStockValue += stockValue;
          
          // Calculate expiry
          if (medicine.expiry) {
            const expiryDate = new Date(medicine.expiry);
            const timeDiff = expiryDate.getTime() - today.getTime();
            const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
            
            // Expired medicines
            if (daysLeft <= 0) {
              expiredCount++;
              expiredLoss += stockValue;
            }
            // Near expiry (30 days or less)
            else if (daysLeft <= 30) {
              nearExpiryCount++;
              if (nearExpiryList.length < 5) {
                nearExpiryList.push({
                  id: medicine.id,
                  name: medicine.name,
                  days: daysLeft,
                  expiryDate: medicine.expiry,
                  quantity: medicine.quantity,
                  batch: medicine.batchNumber || "N/A"
                });
              }
            }
          }
          
          // Low stock (below minimum stock)
          const minStock = medicine.minStock || 10;
          if (medicine.quantity < minStock) {
            lowStockCount++;
            if (lowStockList.length < 5) {
              lowStockList.push({
                id: medicine.id,
                name: medicine.name,
                quantity: medicine.quantity,
                minStock: minStock,
                needed: minStock - medicine.quantity,
                price: medicine.price
              });
            }
          }
        });
        
        // Sort near expiry by days left
        nearExpiryList.sort((a, b) => a.days - b.days);
        // Sort low stock by severity
        lowStockList.sort((a, b) => (b.minStock - b.quantity) - (a.minStock - a.quantity));
      }
      
      // 2. Fetch Transactions
      const transactionsResult = await getTransactions(user.uid, { isVoided: false });
      let todaySales = 0;
      let yesterdaySales = 0;
      let weeklySales = 0;
      let monthlySales = 0;
      let todayTransactions = 0;
      let todayCustomers = new Set();
      let transactionTotal = 0;
      let topSellingMap = new Map();
      let recentTransactionsList = [];
      
      if (transactionsResult.success && transactionsResult.data) {
        transactionsResult.data.forEach(transaction => {
          const transactionDate = transaction.date;
          const amount = transaction.total || 0;
          const medicineName = transaction.medicine;
          
          if (transactionDate === todayStr) {
            todaySales += amount;
            todayTransactions++;
            todayCustomers.add(transaction.id)
            transactionTotal += amount;
            recentTransactionsList.push({
              id: transaction.id,
              medicine: medicineName,
              amount: amount,
              time: transaction.createdAt || transaction.date,
              receipt: transaction.receiptNumber,
              customer: transaction.customerName || "Customer"
            });
          }
          
          // Yesterday's sales
          if (transactionDate === yesterdayStr) {
            yesterdaySales += amount;
          }
          
          // Weekly sales
          if (transactionDate >= startOfWeekStr) {
            weeklySales += amount;
          }
          
          // Monthly sales
          if (transactionDate >= startOfMonthStr) {
            monthlySales += amount;
          }
          
          // Track top selling medicines (this month)
          if (transactionDate >= startOfMonthStr) {
            const current = topSellingMap.get(medicineName) || { count: 0, revenue: 0 };
            topSellingMap.set(medicineName, {
              count: current.count + (transaction.quantity || 1),
              revenue: current.revenue + amount
            });
          }
        });
        
        const topSellingArray = Array.from(topSellingMap, ([name, data]) => ({
          name,
          sold: data.count,
          revenue: data.revenue
        }));
        
        topSellingArray.sort((a, b) => b.revenue - a.revenue);
        const topSellingList = topSellingArray.slice(0, 5);
        
        // Sort recent transactions by time (newest first)
        recentTransactionsList.sort((a, b) => new Date(b.time) - new Date(a.time));
        recentTransactionsList = recentTransactionsList.slice(0, 5);
        
        // Calculate average transaction value
        const avgTransactionValue = todayTransactions > 0 ? todaySales / todayTransactions : 0;
        
        // 3. Calculate sales change
        const changePercent = yesterdaySales === 0 ? 0 : 
          Number((((todaySales - yesterdaySales) / yesterdaySales) * 100).toFixed(1));
        const isPositive = changePercent >= 0;
        
        // 4. Fetch Expenses
        const expensesResult = await getExpenses(user.uid, { 
          fromDate: startOfMonthStr 
        });
        let monthlyExpenses = 0;
        let todayExpenses = 0;
        
        if (expensesResult.success && expensesResult.data) {
          expensesResult.data.forEach(expense => {
            monthlyExpenses += expense.amount || 0;
            if (expense.date === todayStr) {
              todayExpenses += expense.amount || 0;
            }
          });
        }
        
        
        const grossProfit = monthlySales - monthlyExpenses;
        const profitMargin = monthlySales > 0 ? 
          Number(((grossProfit / monthlySales) * 100).toFixed(1)) : 0;
        

        setDashboardData({
          totalMedicines,
          totalStockValue,
          expiredCount,
          expiredLoss,
          lowStockCount,
          nearExpiryCount,
          
          todaySales,
          yesterdaySales,
          weeklySales,
          monthlySales,
          changePercent,
          isPositive,
          
          todayTransactions,
          todayCustomers: todayCustomers.size,
          avgTransactionValue,
          
          todayExpenses,
          monthlyExpenses,
          profitMargin,
          
          nearExpiryMedicines: nearExpiryList,
          topSellingMedicines: topSellingList,
          lowStockMedicines: lowStockList,
          recentTransactions: recentTransactionsList
        });
        
        setLastUpdated(new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }));
      }
      
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Byanze Kuzana Amakuru ongera uri freshinge page.");
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const refreshData = () => {
    fetchDashboardData();
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `RWF ${Number(amount).toLocaleString()}`;
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return "Just now";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Initial fetch
  useEffect(() => {
    if (!authLoading && user) {
      fetchDashboardData();
      
      // Refresh every 5 minutes
      const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [authLoading, user]);

  if (authLoading || loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Nta Konti Ufite</h2>
          <p className="text-gray-600 mb-4">Banza ushyiremo imyirondoro Ubundi Ukomeze</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-4 bg-gray-50 min-h-screen">
      {/* SHOW SEARCH RESULTS IF SEARCHING */}
      {searchQuery && <DashboardSearchResults />}
      {!searchQuery && (
        <>
          {/* HEADER */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
                  Konti Yawe
                </h1>
                <p className="text-sm text-gray-500">
                  Incamake kuri Pharmacy yawe
                </p>
              </div>
              
              <div className="flex gap-2">
                <div className="text-xs text-gray-500 bg-white px-3 py-2 rounded-lg border border-gray-300">
                  Yavuguruwe: {lastUpdated}
                </div>
                <button
                  onClick={refreshData}
                  disabled={loading}
                  className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition text-sm"
                >
                  {loading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      <span>Refreshinga</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="flex flex-wrap gap-3 mt-4">
              <Link
                href="/dashboard/inventory/add"
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition text-sm"
              >
                <Plus size={16} />
                <span className="whitespace-nowrap">Ongeraho Umuti</span>
              </Link>
              <Link
                href="/dashboard/transactions"
                className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition text-sm"
              >
                <ShoppingCart size={16} />
                Ibyagurishijwe Bishya
              </Link>
              <Link
                href="/dashboard/expenses"
                className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition text-sm"
              >
                <CreditCard size={16} />
                Ibyasohowe
              </Link>
              <Link
                href="/dashboard/reports"
                className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition text-sm"
              >
                <BarChart3 size={16} />
                Kureba Raporo
              </Link>
            </div>
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 text-sm">
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* ALERTS ROW */}
          {(dashboardData.expiredCount > 0 || dashboardData.lowStockCount > 0 || dashboardData.nearExpiryCount > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              {dashboardData.expiredCount > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <div>
                        <div className="font-medium text-gray-800">Imiti Yataye Garanti</div>
                        <div className="text-sm text-gray-600">{dashboardData.expiredCount} ni bwo bwoko bwarangiye</div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-red-600">
                      {formatCurrency(dashboardData.expiredLoss)}
                    </div>
                  </div>
                  <Link
                    href="/dashboard/expiry"
                    className="inline-block mt-2 text-sm text-red-700 hover:text-red-800"
                  >
                    Reba Birambuye →
                  </Link>
                </div>
              )}

              {dashboardData.lowStockCount > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <div>
                        <div className="font-medium text-gray-800">Stocke yabaye nye</div>
                        <div className="text-sm text-gray-600">{dashboardData.lowStockCount} bwoko bukeneye kongera kongerwa</div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-yellow-700">
                      {dashboardData.lowStockCount} item
                    </div>
                  </div>
                  <Link
                    href="/dashboard/inventory"
                    className="inline-block mt-2 text-sm text-yellow-700 hover:text-yellow-800"
                  >
                    Reba Birambuye →
                  </Link>
                </div>
              )}

              {dashboardData.nearExpiryCount > 0 && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-orange-600" />
                      <div>
                        <div className="font-medium text-gray-800">Iyenda Guta Garanti</div>
                        <div className="text-sm text-gray-600">{dashboardData.nearExpiryCount} ni bwo bwoko bwenda Kurangiza manda</div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-orange-700">
                      {dashboardData.nearExpiryCount} ibikoresho
                    </div>
                  </div>
                  <Link
                    href="/dashboard/expiry"
                    className="inline-block mt-2 text-sm text-orange-700 hover:text-orange-800"
                  >
                    Reba Birambuye →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* MAIN STATS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 flex items-center justify-center bg-green-100 rounded-lg">
                  <DollarSign className="text-green-600" size={20} />
                </div>
                {dashboardData.changePercent !== undefined && (
                  <div className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${
                    dashboardData.isPositive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {dashboardData.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {Math.abs(dashboardData.changePercent)}%
                  </div>
                )}
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-1">{formatCurrency(dashboardData.todaySales)}</h3>
              <p className="text-sm text-gray-600 mb-2">Imiti yagurishijwe uyu munsi</p>
              <p className="text-xs text-gray-500">{dashboardData.todayTransactions} wagurishijijwe</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-lg">
                  <Package className="text-blue-600" size={20} />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-1">{dashboardData.totalMedicines}</h3>
              <p className="text-sm text-gray-600 mb-2">Imiti Yose ufitemo</p>
              <p className="text-xs text-gray-500">Agaciro Kayo: {formatCurrency(dashboardData.totalStockValue)}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 flex items-center justify-center bg-purple-100 rounded-lg">
                  <Users className="text-purple-600" size={20} />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-1">{dashboardData.todayCustomers}</h3>
              <p className="text-sm text-gray-600 mb-2">Abakiriya Twagize uyu munsi</p>
              <p className="text-xs text-gray-500">Muri make: {formatCurrency(dashboardData.avgTransactionValue)}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 flex items-center justify-center bg-red-100 rounded-lg">
                  <TrendingDown className="text-red-600" size={20} />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-1">{formatCurrency(dashboardData.todayExpenses)}</h3>
              <p className="text-sm text-gray-600 mb-2">Ibya sohotse uyu munsi</p>
              <p className="text-xs text-gray-500">Ku kwezi: {formatCurrency(dashboardData.monthlyExpenses)}</p>
            </div>
          </div>

          {/* CHARTS & DETAILS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {/* PERFORMANCE METRICS */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-green-100 rounded-lg">
                    <Activity className="text-green-600" size={20} />
                  </div>
                  <span className="text-2xl font-bold text-gray-800">{formatCurrency(dashboardData.weeklySales)}</span>
                </div>
                
                <h4 className="font-medium text-gray-800 mb-1">Iki Cy'umweru</h4>
                <p className="text-sm text-gray-500">Guhera k'uwambere</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-lg">
                    <BarChart3 className="text-blue-600" size={20} />
                  </div>
                  <span className="text-2xl font-bold text-gray-800">{formatCurrency(dashboardData.monthlySales)}</span>
                </div>
                
                <h4 className="font-medium text-gray-800 mb-1">Uku Kwezi</h4>
                <p className="text-sm text-gray-500">igiteranyo</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${
                    dashboardData.profitMargin >= 20 ? 'bg-green-100' :
                    dashboardData.profitMargin >= 10 ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    <TrendingUp className={
                      dashboardData.profitMargin >= 20 ? 'text-green-600' :
                      dashboardData.profitMargin >= 10 ? 'text-yellow-600' : 'text-red-600'
                    } size={20} />
                  </div>
                  <span className="text-2xl font-bold text-gray-800">{dashboardData.profitMargin}%</span>
                </div>
                
                <h4 className="font-medium text-gray-800 mb-1">Inyugu</h4>
                <p className="text-sm text-gray-500">Iki gereranyo ku abura kuyo washoye</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-purple-100 rounded-lg">
                    <Package className="text-purple-600" size={20} />
                  </div>
                  <span className="text-2xl font-bold text-gray-800">{formatCurrency(dashboardData.totalStockValue)}</span>
                </div>
                
                <h4 className="font-medium text-gray-800 mb-1">Agaciro ka stock</h4>
                <p className="text-sm text-gray-500">Uko agana</p>
              </div>
            </div>

            {/* RECENT TRANSACTIONS */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Ibiherutswe Kugurishwa</h3>
                <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                  Uyu munsi
                </span>
              </div>
              
              {dashboardData.recentTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Nta cyagurishijwe uyu munsi</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboardData.recentTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <ShoppingCart size={18} className="text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-sm text-gray-800">{tx.customer}</div>
                          <div className="text-xs text-gray-500">{tx.medicine}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600 text-sm">
                          {formatCurrency(tx.amount)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatTimeAgo(tx.time)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {dashboardData.recentTransactions.length > 0 && (
                <Link
                  href="/dashboard/transactions"
                  className="flex items-center justify-center gap-2 w-full mt-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  Reba Uko byangurishijwe
                  <ChevronRight size={14} />
                </Link>
              )}
            </div>
          </div>

          {/* INVENTORY SECTIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* NEAR EXPIRY */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-800">Iyenda Guta Garanti</h3>
                  <p className="text-sm text-gray-500">Ibura Iminsi 30</p>
                </div>
                <div className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                  {dashboardData.nearExpiryCount} items
                </div>
              </div>

              {dashboardData.nearExpiryMedicines.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Nta muti wenda kurangiza manda</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {dashboardData.nearExpiryMedicines.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-800 text-sm">{item.name}</div>
                        <div className="text-xs text-gray-500">
                          Batch: {item.batch} • Qty: {item.quantity}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          item.days <= 7 ? 'text-red-600' :
                          item.days <= 14 ? 'text-orange-600' :
                          'text-yellow-600'
                        }`}>
                          {item.days <= 0 ? 'Expired' : `${item.days} days`}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(item.expiryDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {dashboardData.nearExpiryMedicines.length > 0 && (
                <Link
                  href="/dashboard/expiry"
                  className="flex items-center justify-center gap-2 w-full mt-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                 Reba Raporo Yiyenda Kuarangiza manda
                  <Eye size={14} />
                </Link>
              )}
            </div>

            {/* TOP SELLING */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-800">Imiti Yambere yagurishijwe cyane</h3>
                  <p className="text-sm text-gray-500">Uku kwezi</p>
                </div>
                <div className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  5 ya mbere
                </div>
              </div>

              {dashboardData.topSellingMedicines.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Nta muti wagurishijijwe</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboardData.topSellingMedicines.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 text-sm">{item.name}</div>
                        <div className="text-xs text-gray-500">
                          {item.sold} niyo ngano yaguzwe
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600 text-sm">
                          {formatCurrency(item.revenue)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Agaciro
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {dashboardData.topSellingMedicines.length > 0 && (
                <Link
                  href="/dashboard/transactions/report"
                  className="flex items-center justify-center gap-2 w-full mt-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  Reba Raporo Y'ibyaguzwe
                  <BarChart3 size={14} />
                </Link>
              )}
            </div>
          </div>

          {/* LOW STOCK SECTION */}
          {dashboardData.lowStockMedicines.length > 0 && (
            <div className="mb-6">
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-800">Imiti yabaye mike</h3>
                    <p className="text-sm text-gray-500">Ukeneye gushyiramo indi</p>
                  </div>
                  <div className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                    {dashboardData.lowStockCount} items
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dashboardData.lowStockMedicines.map((item) => (
                    <div key={item.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-medium text-gray-800 text-sm">{item.name}</div>
                        <div className="text-xs text-white bg-red-500 px-2 py-1 rounded-full">
                          Stock Yabaye nye
                        </div>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Ibyaribihari:</span>
                          <span className="font-bold text-red-600">{item.quantity}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Amake:</span>
                          <span className="text-gray-700">{item.minStock}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Ibikeneye kongerwa:</span>
                          <span className="font-bold text-green-600">+{item.needed}</span>
                        </div>
                        {item.price && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Agaciro:</span>
                            <span className="text-blue-600 font-medium">
                              {formatCurrency(item.quantity * item.price)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-4">
                  <Link
                    href="/dashboard/inventory/add"
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition text-sm font-medium"
                  >
                    <Plus size={16} />
                    Ongera imiti muri Stocke
                  </Link>
                  <Link
                    href="/dashboard/inventory"
                    className="flex-1 flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                  >
                    <Eye size={16} />
                    Reba Stock y'imiti
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* QUICK SUMMARY */}
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-xs text-gray-500">Imiti yose Dufite</div>
              <div className="text-lg font-bold text-gray-900">{dashboardData.totalMedicines}</div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-xs text-gray-500">Ayacurujwe Uyu munsi</div>
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(dashboardData.todaySales)}
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-xs text-gray-500">Abakiriya Dufite</div>
              <div className="text-lg font-bold text-purple-600">
                {dashboardData.todayCustomers}
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-xs text-gray-500">Abura Kugirango tubone inyungu</div>
              <div className="text-lg font-bold text-blue-600">
                {dashboardData.profitMargin}%
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              pharmacy yahinduwe {lastUpdated} • Kongera kugenzura amakuru buri minota 5
            </p>
          </div>
        </>
      )}
    </div>
  );
}