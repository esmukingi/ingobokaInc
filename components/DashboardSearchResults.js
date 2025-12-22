// components/DashboardSearchResults.js
"use client";

import { Search, X, Pill, DollarSign, Receipt, User, Calendar, ExternalLink, Package, Building, Filter } from "lucide-react";
import Link from "next/link";
import { useSearch } from "@/context/searchContext";
import { useRouter } from "next/navigation";

export default function DashboardSearchResults() {
  const { searchQuery, searchResults, clearSearch } = useSearch();
  const router = useRouter();

  if (!searchQuery || searchResults.length === 0) {
    return null;
  }

  const getResultIcon = (type) => {
    switch (type) {
      case 'medicine': return <Pill className="w-4 h-4" />;
      case 'transaction': return <DollarSign className="w-4 h-4" />;
      case 'expense': return <Receipt className="w-4 h-4" />;
      case 'customer': return <User className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'medicine': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'transaction': return 'bg-green-100 text-green-700 border border-green-200';
      case 'expense': return 'bg-red-100 text-red-700 border border-red-200';
      case 'customer': return 'bg-purple-100 text-purple-700 border border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  const getTypeTitle = (type) => {
    switch (type) {
      case 'medicine': return 'Medicines';
      case 'transaction': return 'Transactions';
      case 'expense': return 'Expenses';
      case 'customer': return 'Customers';
      default: return 'Other';
    }
  };

  const getTypeLink = (type) => {
    switch (type) {
      case 'medicine': return '/dashboard/inventory';
      case 'transaction': return '/dashboard/transactions';
      case 'expense': return '/dashboard/expenses';
      case 'customer': return '/dashboard/customers';
      default: return '/dashboard';
    }
  };

  // Group results by type
  const groupedResults = searchResults.reduce((groups, result) => {
    if (!groups[result.type]) {
      groups[result.type] = [];
    }
    groups[result.type].push(result);
    return groups;
  }, {});

  // Format currency
  const formatCurrency = (amount) => {
    return `RWF ${Number(amount).toLocaleString()}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="p-3 md:p-4 bg-gray-50 min-h-screen">
      {/* Search Results Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
              Ibisubizo byo Gushakisha
            </h1>
            <p className="text-sm text-gray-500">
              Wabonye {searchResults.length} ibisubizo ku "{searchQuery}"
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={clearSearch}
              className="flex items-center gap-2 border border-gray-300 text-gray-700 
                px-4 py-2.5 rounded-lg hover:bg-gray-50 transition text-sm"
            >
              <X size={16} />
              <span>Hagarika gushakisha</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <div className="text-xs text-gray-500">Ibisubizo byose</div>
          <div className="text-lg font-bold text-gray-900">{searchResults.length}</div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <div className="text-xs text-gray-500">Ubusobanuro</div>
          <div className="text-lg font-bold text-purple-600">
            {new Set(searchResults.map(r => r.type)).size}
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <div className="text-xs text-gray-500">Umushahara</div>
          <div className="text-lg font-bold text-green-600">
            RWF {searchResults
              .filter(r => r.type === 'transaction')
              .reduce((sum, tx) => sum + (tx.total || 0), 0)
              .toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <div className="text-xs text-gray-500">Agaciro ka Stock</div>
          <div className="text-lg font-bold text-blue-600">
            RWF {searchResults
              .filter(r => r.type === 'medicine')
              .reduce((sum, med) => sum + ((med.quantity || 0) * (med.price || 0)), 0)
              .toLocaleString()}
          </div>
        </div>
      </div>

      {/* Results by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {Object.entries(groupedResults).map(([type, items]) => (
          <div key={type} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  type === 'medicine' ? 'bg-blue-100' :
                  type === 'transaction' ? 'bg-green-100' :
                  type === 'expense' ? 'bg-red-100' :
                  type === 'customer' ? 'bg-purple-100' :
                  'bg-gray-100'
                }`}>
                  {getResultIcon(type)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{getTypeTitle(type)}</h3>
                  <p className="text-sm text-gray-500">{items.length} items found</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeBadgeColor(type)}`}>
                {items.length}
              </span>
            </div>
            
            <div className="space-y-2">
              {items.slice(0, 5).map((result, index) => (
                <Link
                  key={`${type}-${result.id || index}`}
                  href={result.link || '#'}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100">
                        {getResultIcon(type)}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-800 truncate text-sm">
                        {result.displayName || 'Unnamed'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {type === 'medicine' && (
                          <div className="flex items-center gap-2">
                            <span>Ubwoko: {result.category || 'N/A'}</span>
                            {result.quantity !== undefined && (
                              <>
                                <span>•</span>
                                <span>Umubare: {result.quantity}</span>
                              </>
                            )}
                          </div>
                        )}
                        {type === 'transaction' && (
                          <div className="flex items-center gap-2">
                            <span>Umukiriya: {result.customerName || 'Unknown'}</span>
                            <span>•</span>
                            <span>{result.date ? formatDate(result.date) : ''}</span>
                          </div>
                        )}
                        {type === 'expense' && (
                          <div className="flex items-center gap-2">
                            <span>Ubwoko: {result.category || 'N/A'}</span>
                          </div>
                        )}
                        {type === 'customer' && (
                          <div className="flex items-center gap-2">
                            <span>Ingurane: {result.transactionCount || 0}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {type === 'transaction' && result.total !== undefined && (
                    <div className="text-green-600 font-medium text-sm">
                      {formatCurrency(result.total)}
                    </div>
                  )}
                  {type === 'expense' && result.amount !== undefined && (
                    <div className="text-red-600 font-medium text-sm">
                      {formatCurrency(result.amount)}
                    </div>
                  )}
                  {type === 'medicine' && result.price !== undefined && (
                    <div className="text-blue-600 font-medium text-sm">
                      {formatCurrency(result.price)}
                    </div>
                  )}
                </Link>
              ))}
              
              {items.length > 5 && (
                <button
                  onClick={() => {
                    const searchParams = new URLSearchParams();
                    searchParams.set('search', searchQuery);
                    router.push(`${getTypeLink(type)}?${searchParams.toString()}`);
                  }}
                  className="w-full text-center py-2.5 text-sm text-gray-700 hover:text-gray-900 
                    hover:bg-gray-50 border border-gray-200 rounded-lg transition"
                >
                  Reba ibindi {items.length - 5} {getTypeTitle(type).toLowerCase()} →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* All Results Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Ibisubizo byose byo gushakisha</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Filter size={14} />
              <span>Showing {Math.min(searchResults.length, 10)} of {searchResults.length}</span>
            </div>
          </div>
        </div>
        
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Ubwoko</th>
                <th className="px-4 py-3 text-left font-medium">Izina</th>
                <th className="px-4 py-3 text-left font-medium">Ibindi</th>
                <th className="px-4 py-3 text-left font-medium">Umubare / Agaciro</th>
                <th className="px-4 py-3 text-left font-medium">Itariki</th>
                <th className="px-4 py-3 text-left font-medium">Ibikorwa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {searchResults.slice(0, 10).map((result, index) => (
                <tr key={index} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(result.type)}`}>
                      {getResultIcon(result.type)}
                      {result.typeLabel || result.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{result.displayName || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-sm">
                    {result.type === 'medicine' && result.category && (
                      <div className="flex items-center gap-1">
                        <Package size={12} />
                        <span>{result.category}</span>
                      </div>
                    )}
                    {result.type === 'transaction' && result.customerName && (
                      <div className="flex items-center gap-1">
                        <User size={12} />
                        <span>{result.customerName}</span>
                      </div>
                    )}
                    {result.type === 'expense' && result.category && (
                      <div className="flex items-center gap-1">
                        <Receipt size={12} />
                        <span>{result.category}</span>
                      </div>
                    )}
                    {result.type === 'customer' && (
                      <div>
                        <span className="text-xs">Ingurane: {result.transactionCount || 0}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {result.type === 'transaction' && result.total !== undefined && (
                      <div className="font-medium text-green-600">
                        {formatCurrency(result.total)}
                      </div>
                    )}
                    {result.type === 'expense' && result.amount !== undefined && (
                      <div className="font-medium text-red-600">
                        {formatCurrency(result.amount)}
                      </div>
                    )}
                    {result.type === 'medicine' && result.price !== undefined && (
                      <div className="font-medium text-blue-600">
                        {formatCurrency(result.price)}
                      </div>
                    )}
                    {result.type === 'customer' && result.totalSpent !== undefined && (
                      <div className="font-medium text-purple-600">
                        {formatCurrency(result.totalSpent)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {result.date || result.expiry || result.lastPurchase 
                      ? formatDate(result.date || result.expiry || result.lastPurchase)
                      : 'N/A'
                    }
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={result.link || '#'}
                      className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
                    >
                      <span>Reba</span>
                      <ExternalLink size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden">
          {searchResults.slice(0, 10).map((result, index) => (
            <div key={index} className="p-4 border-b hover:bg-gray-50 transition">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(result.type)}`}>
                    {getResultIcon(result.type)}
                    {result.typeLabel || result.type}
                  </span>
                  <div className="font-medium text-gray-800 text-sm">
                    {result.displayName || 'N/A'}
                  </div>
                </div>
                <Link
                  href={result.link || '#'}
                  className="text-green-600 hover:text-green-700"
                >
                  <ExternalLink size={14} />
                </Link>
              </div>
              
              <div className="text-xs text-gray-600 mb-2">
                {result.type === 'medicine' && result.category && (
                  <div className="flex items-center gap-1">
                    <Package size={12} />
                    <span>{result.category}</span>
                  </div>
                )}
                {result.type === 'transaction' && result.customerName && (
                  <div className="flex items-center gap-1">
                    <User size={12} />
                    <span>{result.customerName}</span>
                  </div>
                )}
                {result.type === 'expense' && result.category && (
                  <div className="flex items-center gap-1">
                    <Receipt size={12} />
                    <span>{result.category}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                {result.type === 'transaction' && result.total !== undefined && (
                  <div className="font-medium text-green-600 text-sm">
                    {formatCurrency(result.total)}
                  </div>
                )}
                {result.type === 'expense' && result.amount !== undefined && (
                  <div className="font-medium text-red-600 text-sm">
                    {formatCurrency(result.amount)}
                  </div>
                )}
                {result.type === 'medicine' && result.price !== undefined && (
                  <div className="font-medium text-blue-600 text-sm">
                    {formatCurrency(result.price)}
                  </div>
                )}
                {result.type === 'customer' && result.totalSpent !== undefined && (
                  <div className="font-medium text-purple-600 text-sm">
                    {formatCurrency(result.totalSpent)}
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  {result.date || result.expiry || result.lastPurchase 
                    ? formatDate(result.date || result.expiry || result.lastPurchase)
                    : 'N/A'
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {searchResults.length > 10 && (
          <div className="p-4 border-t">
            <button
              onClick={() => router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`)}
              className="w-full text-center py-2.5 text-sm text-gray-700 hover:text-gray-900 
                hover:bg-gray-50 border border-gray-200 rounded-lg transition"
            >
              Reba ibindi {searchResults.length - 10} ibisubizo byo gushakisha →
            </button>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mt-6">
        <button
          onClick={clearSearch}
          className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition text-sm"
        >
          <X size={16} />
          Subira ku mugaragaro
        </button>
        <Link
          href="/dashboard/inventory/add"
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition text-sm"
        >
          <Package size={16} />
          Ongeramo imiti
        </Link>
        <Link
          href="/dashboard/transactions"
          className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition text-sm"
        >
          <DollarSign size={16} />
          Tangira ubucuruzi
        </Link>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Amabara y'ubwoko:</h4>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1 text-xs">
            <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-300"></div>
            <span className="text-gray-600">Imiti</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div className="w-3 h-3 rounded-full bg-green-100 border border-green-300"></div>
            <span className="text-gray-600">Ubucuruzi</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div className="w-3 h-3 rounded-full bg-red-100 border border-red-300"></div>
            <span className="text-gray-600">Ingaruka</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div className="w-3 h-3 rounded-full bg-purple-100 border border-purple-300"></div>
            <span className="text-gray-600">Abakiriya</span>
          </div>
        </div>
      </div>
    </div>
  );
}