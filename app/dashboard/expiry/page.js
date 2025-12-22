"use client";

import React, { useState, useEffect } from "react";
import { Calendar, AlertTriangle, RefreshCw, Loader, Package, X } from "lucide-react";
import { useAuth } from "@/hooks/auth";
import { getMedicines } from "@/helper/inventory";
import Link from "next/link";

// Alert Card component
const AlertCard = ({ title, count, color, icon, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between p-4 rounded-xl shadow-md ${color} hover:scale-105 transform transition duration-300`}
  >
    <div>
      <p className="text-xs font-medium text-white">{title}</p>
      <p className="text-xl font-bold text-white mt-1">{count}</p>
    </div>
    {icon}
  </button>
);

// Medicine row component
const MedicineRow = ({ med }) => {
  const today = new Date();
  const expiryDate = new Date(med.expiry);
  const timeDiff = expiryDate.getTime() - today.getTime();
  const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  const getStatusInfo = () => {
    if (daysLeft <= 0) {
      return {
        text: "Yararengeje",
        color: "text-red-600",
        bgColor: "bg-red-100",
        statusColor: "bg-red-600"
      };
    }
    if (daysLeft <= 7) {
      return {
        text: `${daysLeft} iminsi`,
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
        statusColor: "bg-yellow-500"
      };
    }
    return {
      text: `${daysLeft} iminsi`,
      color: "text-green-600",
      bgColor: "bg-green-100",
      statusColor: "bg-green-600"
    };
  };

  const status = getStatusInfo();

  return (
    <tr className="border-b hover:bg-gray-50 transition">
      <td className="py-3 px-3">
        <div className="font-medium text-gray-800">{med.name}</div>
        {med.batchNumber && (
          <div className="text-xs text-gray-500 mt-1">Lot: {med.batchNumber}</div>
        )}
      </td>
      <td className="py-3 px-3 text-gray-600">{med.category || "N/A"}</td>
      <td className="py-3 px-3">
        <div className={`font-medium ${med.quantity < (med.minStock || 10) ? "text-red-600" : "text-gray-800"}`}>
          {med.quantity}
        </div>
      </td>
      <td className="py-3 px-3">
        <span className={`font-semibold ${status.color}`}>
          {status.text}
        </span>
      </td>
      <td className="py-3 px-3">{new Date(med.expiry).toLocaleDateString()}</td>
    </tr>
  );
};

// Mobile Medicine Card
const MedicineCard = ({ med }) => {
  const today = new Date();
  const expiryDate = new Date(med.expiry);
  const timeDiff = expiryDate.getTime() - today.getTime();
  const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  const getStatusInfo = () => {
    if (daysLeft <= 0) {
      return {
        text: "Yararengeje",
        color: "text-red-600",
        bgColor: "bg-red-100",
      };
    }
    if (daysLeft <= 7) {
      return {
        text: `${daysLeft} iminsi`,
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
      };
    }
    return {
      text: `${daysLeft} iminsi`,
      color: "text-green-600",
      bgColor: "bg-green-100",
    };
  };

  const status = getStatusInfo();

  return (
    <div key={med.id} className="bg-white rounded-xl shadow-sm p-3 hover:shadow-md transition">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="font-medium text-gray-800 text-sm">{med.name}</h2>
          {med.batchNumber && (
            <div className="text-xs text-gray-500 mt-1">Lot: {med.batchNumber}</div>
          )}
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${status.bgColor} ${status.color}`}>
          {status.text}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
        <div>
          <span className="text-gray-500">Icyiciro:</span>
          <div className="font-medium">{med.category || "N/A"}</div>
        </div>
        <div>
          <span className="text-gray-500">Umubare:</span>
          <div className={`font-medium ${med.quantity < (med.minStock || 10) ? "text-red-600" : ""}`}>
            {med.quantity}
          </div>
        </div>
      </div>
      <div className="text-xs text-gray-500 mt-2">
        Itariki: {new Date(med.expiry).toLocaleDateString()}
      </div>
    </div>
  );
};

export default function ExpiryPage() {
  const { user, loading: authLoading } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // "all", "expired", "near-expiry"
  const [filteredMedicines, setFilteredMedicines] = useState([]);

  const today = new Date();

  // Fetch medicines
  const fetchMedicines = async () => {
    if (!user) return;
    
    setLoading(true);
    setError("");
    
    try {
      const result = await getMedicines(user.uid);
      
      if (result.success) {
        // Calculate days left for each medicine
        const medicinesWithDays = result.data.map(med => {
          const expiryDate = new Date(med.expiry);
          const timeDiff = expiryDate.getTime() - today.getTime();
          const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
          return {
            ...med,
            daysLeft
          };
        });
        
        setMedicines(medicinesWithDays);
      } else {
        setError(result.message || "Ntabwo byakunze gukura imiti.");
      }
    } catch (err) {
      console.error("Error fetching medicines:", err);
      setError("Habaye ikosa mu kuzana imiti. Gerageza nanone.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchMedicines();
    }
  }, [authLoading, user]);

  // Calculate counts
  const expiredCount = medicines.filter(m => m.daysLeft <= 0).length;
  const nearExpiryCount = medicines.filter(m => m.daysLeft > 0 && m.daysLeft <= 7).length;
  const lowStockCount = medicines.filter(m => m.quantity < (m.minStock || 10)).length;
  const totalCount = medicines.length;

  // Filter medicines based on selected filter
  useEffect(() => {
    let filtered = medicines;
    
    switch(filter) {
      case "expired":
        filtered = medicines.filter(m => m.daysLeft <= 0);
        break;
      case "near-expiry":
        filtered = medicines.filter(m => m.daysLeft > 0 && m.daysLeft <= 7);
        break;
      case "low-stock":
        filtered = medicines.filter(m => m.quantity < (m.minStock || 10));
        break;
      default:
        filtered = medicines;
    }
    
    setFilteredMedicines(filtered);
  }, [filter, medicines]);

  if (authLoading || loading) {
    return (
      <div className="flex-1 p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
          <p className="mt-2 text-gray-600">Irazana...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6 bg-gray-50 min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle size={20} />
            <span className="font-medium">{error}</span>
          </div>
          <button
            onClick={fetchMedicines}
            className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
          >
            Gerageza nanone
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 bg-gray-50 min-h-screen space-y-4">

      {/* Page Header */}
      <header className="mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar size={20} className="text-orange-500" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
                Imiti Izarangira Vuba
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Reba ibikoresho by'imiti byarengeje igihe cyangwa izarangira mu minsi mike.
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={fetchMedicines}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              {loading ? "Iracyakora..." : "Ongera Uzane"}
            </button>
            <Link
              href="/dashboard/inventory"
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Package size={14} />
              Reba Ububiko
            </Link>
          </div>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-2 text-sm font-medium ${filter === "all" ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
        >
          Byose ({totalCount})
        </button>
        <button
          onClick={() => setFilter("expired")}
          className={`px-3 py-2 text-sm font-medium ${filter === "expired" ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}
        >
          Yararengeje ({expiredCount})
        </button>
        <button
          onClick={() => setFilter("near-expiry")}
          className={`px-3 py-2 text-sm font-medium ${filter === "near-expiry" ? 'border-b-2 border-yellow-600 text-yellow-600' : 'text-gray-500'}`}
        >
          Mu minsi 7 ({nearExpiryCount})
        </button>
        <button
          onClick={() => setFilter("low-stock")}
          className={`px-3 py-2 text-sm font-medium ${filter === "low-stock" ? 'border-b-2 border-orange-600 text-orange-600' : 'text-gray-500'}`}
        >
          Irabura ({lowStockCount})
        </button>
      </div>

      {/* Alerts Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button onClick={() => setFilter("all")}>
          <div className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition">
            <div className="text-xs text-gray-500">Imiti yose</div>
            <div className="text-lg font-bold text-gray-900">{totalCount}</div>
          </div>
        </button>
        
        <button onClick={() => setFilter("expired")}>
          <div className="bg-red-50 p-3 rounded-lg shadow-sm hover:shadow-md transition border border-red-100">
            <div className="text-xs text-red-600">Imiti Yararengeje</div>
            <div className="text-lg font-bold text-red-600">{expiredCount}</div>
          </div>
        </button>
        
        <button onClick={() => setFilter("near-expiry")}>
          <div className="bg-yellow-50 p-3 rounded-lg shadow-sm hover:shadow-md transition border border-yellow-100">
            <div className="text-xs text-yellow-600">Imiti Izarangira mu minsi 7</div>
            <div className="text-lg font-bold text-yellow-600">{nearExpiryCount}</div>
          </div>
        </button>
        
        <button onClick={() => setFilter("low-stock")}>
          <div className="bg-orange-50 p-3 rounded-lg shadow-sm hover:shadow-md transition border border-orange-100">
            <div className="text-xs text-orange-600">Irabura</div>
            <div className="text-lg font-bold text-orange-600">{lowStockCount}</div>
          </div>
        </button>
      </section>

      {/* Active Filter Display */}
      {filter !== "all" && (
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-blue-700">
                {filter === "expired" && `Uri kureba imiti yararengeje: ${expiredCount}`}
                {filter === "near-expiry" && `Uri kureba imiti izarangira mu minsi 7: ${nearExpiryCount}`}
                {filter === "low-stock" && `Uri kureba imiti irabura: ${lowStockCount}`}
              </span>
            </div>
            <button
              onClick={() => setFilter("all")}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Reba byose
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredMedicines.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          {filter === "all" ? (
            <>
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Nta miti yashyizweho
              </h3>
              <p className="text-gray-500 mb-4">
                Tangira gukora ububiko bw'imitisha mu kigize "Ububiko bw'Imiti"
              </p>
              <Link
                href="/dashboard/inventory/add"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
              >
                Tangira gukora ububiko
              </Link>
            </>
          ) : (
            <>
              <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                {filter === "expired" && "Nta miti yararengeje"}
                {filter === "near-expiry" && "Nta miti izarangira mu minsi 7"}
                {filter === "low-stock" && "Nta miti irabura"}
              </h3>
              <p className="text-gray-500 mb-4">
                {filter === "expired" && "Ibyiza! Nta miti yararengeje."}
                {filter === "near-expiry" && "Ibyiza! Nta miti izarangira mu minsi iri imbere."}
                {filter === "low-stock" && "Ibyiza! Nta miti irabura."}
              </p>
              <button
                onClick={() => setFilter("all")}
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                Reba imiti yose
              </button>
            </>
          )}
        </div>
      )}

      {/* DESKTOP TABLE */}
      {filteredMedicines.length > 0 && (
        <>
          <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">Izina ry'umuti</th>
                  <th className="px-4 py-3 text-left">Ubwoko</th>
                  <th className="px-4 py-3 text-left">Umubare</th>
                  <th className="px-4 py-3 text-left">Igihe gisigaye</th>
                  <th className="px-4 py-3 text-left">Itariki izarangiriraho</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredMedicines.map((med) => (
                  <MedicineRow key={med.id} med={med} />
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS */}
          <div className="md:hidden flex flex-col gap-3">
            {filteredMedicines.map((med) => (
              <MedicineCard key={med.id} med={med} />
            ))}
          </div>
        </>
      )}

      {/* Important Notice */}
      <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
        <div className="flex items-center gap-2 text-orange-700 text-sm">
          <AlertTriangle size={16} />
          <span>
            <strong>Amabwiriza:</strong> Imiti yararengeje igomba gusibwa mububiko no kwandikwa 
            nk'icyangirizo. Reba kigize "Icyangirizo" mu kigize cy'Ubukode.
          </span>
        </div>
      </div>
    </div>
  );
}