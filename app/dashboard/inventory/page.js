// app/dashboard/inventory/page.js
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/auth";
import { getMedicines, deleteMedicine } from "@/helper/inventory";
import {
  Package,
  AlertTriangle,
  Calendar,
  Plus,
  Edit,
  Trash2,
  Loader,
  Search,
  Barcode,
  Building,
  Shield,
  Download,
  Filter
} from "lucide-react";

export default function InventoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!authLoading && user) {
      fetchInventory();
    }
  }, [authLoading, user]);

  const fetchInventory = async () => {
    if (!user) return;
    
    setLoading(true);
    const result = await getMedicines(user.uid);
    
    if (result.success) {
      setInventory(result.data);
    } else {
      console.error("Ntibyakunze gukuramo imiti:", result.message);
    }
    
    setLoading(false);
  };

  const handleDelete = async (medicineId) => {
    if (!confirm("Urifuza gusiba iyi miti? Ibi bizandika nk'icyangirizo.")) return;
    
    setDeletingId(medicineId);
    const result = await deleteMedicine(medicineId, user.uid);
    
    if (result.success) {
      setInventory(prev => prev.filter(item => item.id !== medicineId));
    } else {
      alert(result.message);
    }
    
    setDeletingId(null);
  };

  const today = new Date();

  const getStatus = (item) => {
    const expiryDate = new Date(item.expiry);
    const daysLeft = (expiryDate - today) / (1000 * 60 * 60 * 24);

    if (daysLeft <= 0) {
      return {
        label: "Yarangiye igihe",
        color: "text-red-600 bg-red-50",
        icon: AlertTriangle,
        priority: 1
      };
    }
    if (daysLeft <= 30) {
      return {
        label: "Igiye kurangira",
        color: "text-orange-600 bg-orange-50",
        icon: Calendar,
        priority: 2
      };
    }
    if (item.quantity < item.minStock) {
      return {
        label: "Igiye kubura",
        color: "text-yellow-700 bg-yellow-50",
        icon: Package,
        priority: 3
      };
    }
    return {
      label: "Imeze neza",
      color: "text-green-700 bg-green-50",
      icon: Package,
      priority: 4
    };
  };

  // Filter medicines based on search and filter
  const filteredInventory = inventory
    .filter(medicine => {
      const matchesSearch = 
        medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      
      switch (filter) {
        case "expired":
          return new Date(medicine.expiry) <= today;
        case "expiring":
          const expiryDate = new Date(medicine.expiry);
          const daysLeft = (expiryDate - today) / (1000 * 60 * 60 * 24);
          return daysLeft <= 30 && daysLeft > 0;
        case "lowStock":
          return medicine.quantity < medicine.minStock;
        case "controlled":
          return medicine.requiresPrescription === true;
        default:
          return true;
      }
    })
    .sort((a, b) => {
      const statusA = getStatus(a);
      const statusB = getStatus(b);
      return statusA.priority - statusB.priority;
    });

  if (authLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="p-3 md:p-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
              Ububiko bw'Imiti
            </h1>
            <p className="text-sm text-gray-500">
              Reba na gucunga imiti yawe
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={fetchInventory}
              className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition text-sm"
              disabled={loading}
            >
              {loading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Ongera urebe</span>
                </>
              )}
            </button>
            
            <Link
              href="/dashboard/inventory/add"
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition text-sm"
            >
              <Plus size={16} />
              <span className="whitespace-nowrap">Ongeramo Umuti</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
          <input
            type="text"
            placeholder="Shakisha imiti, numero ya lot, uwayiduhaye..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 text-sm rounded-lg border ${
              filter === "all"
                ? "bg-green-100 text-green-700 border-green-300"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Byose
          </button>
          <button
            onClick={() => setFilter("expiring")}
            className={`px-3 py-1.5 text-sm rounded-lg border ${
              filter === "expiring"
                ? "bg-orange-100 text-orange-700 border-orange-300"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Igiye kurangira
          </button>
          <button
            onClick={() => setFilter("expired")}
            className={`px-3 py-1.5 text-sm rounded-lg border ${
              filter === "expired"
                ? "bg-red-100 text-red-700 border-red-300"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Yarangiye igihe
          </button>
          <button
            onClick={() => setFilter("lowStock")}
            className={`px-3 py-1.5 text-sm rounded-lg border ${
              filter === "lowStock"
                ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Igiye kubura
          </button>
          <button
            onClick={() => setFilter("controlled")}
            className={`px-3 py-1.5 text-sm rounded-lg border ${
              filter === "controlled"
                ? "bg-red-100 text-red-700 border-red-300"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Igiyobokamana
          </button>
        </div>
      </div>

      {/* Important Notice */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 text-blue-700 text-sm">
          <Shield size={16} />
          <span><strong>Ibikenewe:</strong> Imiti yose igomba kugira itariki yo kurangirira na VAT rate. No. ya Lot, Uwayiduhaye n'Umushobyi ntabwo ari ngombwa.</span>
        </div>
      </div>

      {/* Inventory Table */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-8 flex items-center justify-center">
          <Loader className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : filteredInventory.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            {searchTerm || filter !== "all" ? "Nta miti ibonetse" : "Nta miti yashyizweho"}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm 
              ? "Reba neza izina ry'umuti ushaka"
              : "Tangira gukora ububiko bw'imitisha"
            }
          </p>
          {!searchTerm && filter === "all" && (
            <Link
              href="/dashboard/inventory/add"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition text-sm"
            >
              <Plus size={16} />
              Tangira gukora ububiko
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-hidden bg-white rounded-xl shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Umuti</th>
                    <th className="px-4 py-3 text-left font-medium">Ubwoko</th>
                    <th className="px-4 py-3 text-left font-medium">Lot #</th>
                    <th className="px-4 py-3 text-left font-medium">Kurangira</th>
                    <th className="px-4 py-3 text-left font-medium">Umubare</th>
                    <th className="px-4 py-3 text-left font-medium">Igiciro</th>
                    <th className="px-4 py-3 text-left font-medium">Imimerere </th>
                    <th className="px-4 py-3 text-left font-medium">Ibikorwa</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredInventory.map((item) => {
                    const status = getStatus(item);
                    const StatusIcon = status.icon;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800">{item.name}</div>
                          {item.requiresPrescription && (
                            <div className="text-xs text-red-600 mt-1">
                              <Shield size={12} className="inline mr-1" />
                              Igiyobokamana
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {item.category}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Barcode size={14} className="text-gray-400" />
                            <span className="font-mono text-xs">
                              {item.batchNumber || "Nta numero"}
                            </span>
                          </div>
                          {item.supplier && (
                            <div className="text-xs text-gray-500 mt-1 truncate max-w-[150px]" title={item.supplier}>
                              <Building size={10} className="inline mr-1" />
                              {item.supplier}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-gray-600">
                            {new Date(item.expiry).toLocaleDateString()}
                          </div>
                          <div className={`text-xs ${
                            new Date(item.expiry) <= today 
                              ? 'text-red-600 font-medium' 
                              : 'text-gray-500'
                          }`}>
                            {new Date(item.expiry) <= today 
                              ? 'Yarangiye!' 
                              : `${Math.ceil((new Date(item.expiry) - today) / (1000 * 60 * 60 * 24))} iminsi isigaye`}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-medium ${
                            item.quantity < item.minStock ? 'text-red-600' : 'text-gray-800'
                          }`}>
                            {item.quantity}
                          </span>
                          <div className="text-xs text-gray-500">Buri: {item.minStock}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-gray-800">
                            {item.price?.toLocaleString()} RWF
                          </div>
                          <div className={`text-xs ${
                            item.vatRate === 0 ? 'text-green-600' : 'text-blue-600'
                          }`}>
                            {item.vatRate === 0 ? 'Nta VAT' : `${(item.vatRate * 100)}% VAT`}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${status.color}`}
                          >
                            <StatusIcon size={14} />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Link
                              href={`/dashboard/inventory/edit/${item.id}`}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                              title="Hindura"
                            >
                              <Edit size={16} />
                            </Link>
                            <button
                              onClick={() => handleDelete(item.id)}
                              disabled={deletingId === item.id}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded disabled:opacity-50"
                              title="Siba"
                            >
                              {deletingId === item.id ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden flex flex-col gap-3">
            {filteredInventory.map((item) => {
              const status = getStatus(item);
              const StatusIcon = status.icon;
              const daysLeft = Math.ceil((new Date(item.expiry) - today) / (1000 * 60 * 60 * 24));

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-sm p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-start gap-2">
                        <h3 className="font-semibold text-gray-800">{item.name}</h3>
                        {item.requiresPrescription && (
                          <Shield size={14} className="text-red-600 mt-0.5 flex-shrink-0" />
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{item.category}</div>
                    </div>
                    <span
                      className={`ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}
                    >
                      <StatusIcon size={12} />
                      {status.label}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    <div>
                      <div className="text-gray-500 text-xs">No. ya Lot</div>
                      <div className="font-medium flex items-center gap-1">
                        <Barcode size={12} className="text-gray-400" />
                        {item.batchNumber || "Nta numero"}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Kureka</div>
                      <div className={`font-medium ${
                        daysLeft <= 0 ? 'text-red-600' : ''
                      }`}>
                        {new Date(item.expiry).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {daysLeft <= 0 
                          ? 'Yarangiye!' 
                          : `${daysLeft} iminsi`}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Umubare</div>
                      <div className={`font-medium ${
                        item.quantity < item.minStock ? 'text-red-600' : ''
                      }`}>
                        {item.quantity} / {item.minStock}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Igiciro</div>
                      <div className="font-medium">
                        {item.price?.toLocaleString()} RWF
                      </div>
                      <div className={`text-xs ${
                        item.vatRate === 0 ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {item.vatRate === 0 ? 'Nta VAT' : `${(item.vatRate * 100)}% VAT`}
                      </div>
                    </div>
                  </div>
                  
                  {item.supplier && (
                    <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Building size={12} />
                        <span className="truncate">{item.supplier}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <Link
                      href={`/dashboard/inventory/edit/${item.id}`}
                      className="flex-1 flex items-center justify-center gap-2 text-blue-600 text-sm font-medium py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                    >
                      <Edit size={14} />
                      Hindura
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="flex-1 flex items-center justify-center gap-2 text-red-600 text-sm font-medium py-2 bg-red-50 hover:bg-red-100 rounded-lg transition disabled:opacity-50"
                    >
                      {deletingId === item.id ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Irasibwa...
                        </>
                      ) : (
                        <>
                          <Trash2 size={14} />
                          Siba
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Summary Stats */}
      {filteredInventory.length > 0 && (
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="text-xs text-gray-500">Imiti yose</div>
            <div className="text-lg font-bold text-gray-900">{filteredInventory.length}</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="text-xs text-gray-500">Umubare wose</div>
            <div className="text-lg font-bold text-green-600">
              {filteredInventory.reduce((sum, item) => sum + (item.quantity || 0), 0)}
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="text-xs text-gray-500">Igiyobokamana</div>
            <div className="text-lg font-bold text-red-600">
              {filteredInventory.filter(item => item.requiresPrescription).length}
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="text-xs text-gray-500">Agaciro yose</div>
            <div className="text-lg font-bold text-blue-600">
              RWF {filteredInventory.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/dashboard/inventory/disposal"
          className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition text-sm"
        >
          <Trash2 size={14} />
          Andika icyangirizo
        </Link>
        <Link
          href="/dashboard/inventory/reconciliation"
          className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition text-sm"
        >
          <Package size={14} />
          Kubara imiti
        </Link>
        <button
          onClick={() => {
            // Export functionality
            const csvContent = "data:text/csv;charset=utf-8," 
              + ["Izina,Icyiciro,Umubare,Igiciro,Itariki,Kureka,No. ya Lot,Uwayiduhaye,VAT"]
              .concat(filteredInventory.map(item => 
                `"${item.name}","${item.category}",${item.quantity},${item.price},"${item.expiry}","${item.batchNumber || ''}","${item.supplier || ''}",${item.vatRate * 100}%`
              ))
              .join("\n");
            
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `ububiko_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition text-sm"
          disabled={filteredInventory.length === 0}
        >
          <Download size={14} />
          Kuramo amakuru
        </button>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Amabara:</h4>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1 text-xs">
            <div className="w-3 h-3 rounded-full bg-green-100 border border-green-300"></div>
            <span className="text-gray-600">Imeze neza</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div className="w-3 h-3 rounded-full bg-red-100 border border-red-300"></div>
            <span className="text-gray-600">Yarangiye / Irasiba</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div className="w-3 h-3 rounded-full bg-orange-100 border border-orange-300"></div>
            <span className="text-gray-600">Igiye kurangira</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-300"></div>
            <span className="text-gray-600">Igiye kubura</span>
          </div>
        </div>
      </div>
    </div>
  );
}