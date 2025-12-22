"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth";
import { addMedicine } from "@/helper/inventory";
import {
  Package,
  Calendar,
  Layers,
  Hash,
  DollarSign,
  ArrowLeft,
  Save,
  Loader,
  Barcode,
  Building,
  Shield,
  Percent
} from "lucide-react";

export default function AddInventoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category: "",
    quantity: "",
    minStock: "10",
    price: "",
    expiry: "",
    description: "",
    batchNumber: "",
    supplier: "",
    vatRate: "0",
    requiresPrescription: false,
    manufacturer: "",
    storageCondition: "Room Temperature",
    isControlled: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert("Ntabwo winjiriye. Winjire mbere.");
      return;
    }

    setLoading(true);

    try {
      // Convert to proper types
      const submissionData = {
        ...form,
        vatRate: parseFloat(form.vatRate),
        quantity: Number(form.quantity),
        minStock: Number(form.minStock),
        price: Number(form.price),
        expiry: form.expiry || getDefaultExpiry() // Set default expiry if not provided
      };

      const result = await addMedicine(user.uid, submissionData);
      
      if (result.success) {
        alert("Umuti wongewe neza!");
        router.push("/dashboard/inventory");
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Habaye ikibazo. Ongera ugerageze.");
    } finally {
      setLoading(false);
    }
  };

  // Set default expiry to 2 years from now
  const getDefaultExpiry = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 2);
    return date.toISOString().split('T')[0];
  };

  // Set default expiry on component mount
  useState(() => {
    if (!form.expiry) {
      setForm(prev => ({
        ...prev,
        expiry: getDefaultExpiry()
      }));
    }
  });

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-gray-100 transition"
          disabled={loading}
        >
          <ArrowLeft />
        </button>

        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Ongeramo Umuti Mushya
          </h1>
          <p className="text-sm text-gray-500">
            Injiza amakuru y'umuti winjiye mu bubiko
          </p>
        </div>
      </div>

      {/* Compliance Notice - Updated */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Shield className="text-blue-600 mt-0.5" size={18} />
          <div className="text-sm text-blue-700">
            <strong>Iki genzi:</strong> Batch numbers, Supplier na Manufacturer Ntago ari itegeko. 
           Igihe Umuti Uzarangirira ndetse na VAT ni ingenzi.
          </div>
        </div>
      </div>

      {/* FORM CARD */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-sm p-6 max-w-3xl space-y-6"
      >
        {/* MEDICINE NAME */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Izina ry' Umuti *
          </label>
          <div className="relative mt-1">
            <Package className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              name="name"
              required
              placeholder="Urugero: Paracetamol 500mg"
              value={form.name}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600"
              disabled={loading}
            />
          </div>
        </div>

        {/* CATEGORY */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Category || Ikinshiro*
          </label>
          <div className="relative mt-1">
            <Layers className="absolute left-3 top-3 text-gray-400" size={18} />
            <select
              name="category"
              required
              value={form.category}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-green-600"
              disabled={loading}
            >
              <option value="">Select Category</option>
              <option value="Analgesics">Analgesics</option>
              <option value="Antibiotics">Antibiotics</option>
              <option value="Antipyretics">Antipyretics</option>
              <option value="Antimalarials">Antimalarials</option>
              <option value="Antivirals">Antivirals</option>
              <option value="Antifungals">Antifungals</option>
              <option value="Antihistamines">Antihistamines</option>
              <option value="Antacids">Antacids</option>
              <option value="Anti-inflammatory">Anti-inflammatory</option>
              <option value="Antidiarrheals">Antidiarrheals</option>
              <option value="Antiemetics">Antiemetics</option>
              <option value="Bronchodilators">Bronchodilators</option>
              <option value="Cough Suppressants">Cough Suppressants</option>
              <option value="Decongestants">Decongestants</option>
              <option value="Diuretics">Diuretics</option>
              <option value="Vitamins & Supplements">Vitamins & Supplements</option>
              <option value="First Aid">First Aid</option>
              <option value="Medical Devices">Medical Devices</option>
              <option value="Cosmetics">Cosmetics</option>
              <option value="Baby Care">Baby Care</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* BATCH NUMBER & SUPPLIER - OPTIONAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Barcode size={14} /> Batch Number
            </label>
            <div className="relative mt-1">
              <input
                type="text"
                name="batchNumber"
                placeholder="Optional: e.g., LOT-2024-01"
                value={form.batchNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Ni amahitamo - bisabwa na FDA mu kugenzura</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Building size={14} /> Supplier
            </label>
            <div className="relative mt-1">
              <input
                type="text"
                name="supplier"
                placeholder="Urugero: e.g., Rwanda Pharma Ltd"
                value={form.supplier}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Ni Amahitamo</p>
          </div>
        </div>

        {/* MANUFACTURER & STORAGE - OPTIONAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Abakoze imiti
            </label>
            <input
              type="text"
              name="manufacturer"
              placeholder="Urugero: e.g., Rwanda Pharma"
              value={form.manufacturer}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Optional</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Uko igombwa Kubikwa
            </label>
            <select
              name="storageCondition"
              value={form.storageCondition}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-green-600"
              disabled={loading}
            >
              <option value="Room Temperature">Room Temperature</option>
              <option value="Refrigerated">Refrigerated (2-8°C)</option>
              <option value="Cold Chain">Cold Chain</option>
              <option value="Protected from Light">Protected from Light</option>
              <option value="Dry Place">Dry Place</option>
              <option value="Air Tight Container">Air Tight Container</option>
            </select>
          </div>
        </div>

        {/* QUANTITY + MIN STOCK */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Ingano *
            </label>
            <div className="relative mt-1">
              <Hash className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="number"
                name="quantity"
                required
                min="0"
                value={form.quantity}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600"
                disabled={loading}
                placeholder="Shyiramo Ingano"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Ingano noya Yo kumenyesha Ko yenda gushira *
            </label>
            <div className="relative mt-1">
              <Hash className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="number"
                name="minStock"
                required
                min="1"
                value={form.minStock}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* PRICE + VAT RATE (RRA Requirements) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Igiciro (RWF) *
            </label>
            <div className="relative mt-1">
              <DollarSign className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="number"
                name="price"
                required
                min="0"
                step="1"
                value={form.price}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600"
                disabled={loading}
                placeholder="Enter price"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              VAT Rate (RRA) *
            </label>
            <div className="relative mt-1">
              <Percent className="absolute left-3 top-3 text-gray-400" size={18} />
              <select
                name="vatRate"
                required
                value={form.vatRate}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-green-600"
                disabled={loading}
              >
                <option value="0">0% (Essential Medicine)</option>
                <option value="0.18">18% (Standard Rate)</option>
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-1">Most essential medicines are 0% VAT</p>
          </div>
        </div>

        {/* EXPIRY DATE & PRESCRIPTION REQUIREMENT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700">
             Igihe izarangirira *
            </label>
            <div className="relative mt-1">
              <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="date"
                name="expiry"
                required
                value={form.expiry}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600"
                disabled={loading}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="requiresPrescription"
                checked={form.requiresPrescription}
                onChange={handleChange}
                className="rounded border-gray-300"
                disabled={loading}
              />
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Shield size={14} /> Requires Prescription
              </span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isControlled"
                checked={form.isControlled}
                onChange={handleChange}
                className="rounded border-gray-300"
                disabled={loading}
              />
              <span className="text-sm font-medium text-gray-700">
                Controlled Substance (FDA Controlled)
              </span>
            </label>
          </div>
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Vuga Ku muti wae
          </label>
          <textarea
            name="description"
            rows={3}
            value={form.description}
            onChange={handleChange}
            placeholder="Optional additional description"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600"
            disabled={loading}
          />
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2 rounded-lg border text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            disabled={loading}
          >
            Hagarika  
          </button>

          <button
            type="submit"
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Bika
              </>
            )}
          </button>
        </div>
      </form>

      {/* Help Section - Updated */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <h4 className="font-medium text-gray-800 mb-2">Instructions:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span><strong>Required:</strong> Medicine name, category, quantity, price, expiry date, and VAT rate</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span><strong>Optional:</strong> Batch number, supplier, manufacturer, and description</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>You can continue even if you don't have batch number or supplier information</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>You can update these details later when editing the medicine</span>
          </li>
        </ul>
      </div>
    </div>
  );
}