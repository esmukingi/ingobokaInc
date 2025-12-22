"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/auth";
import { updateMedicine, getMedicines } from "@/helper/inventory";
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

export default function EditMedicinePage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [medicine, setMedicine] = useState(null);

  const [form, setForm] = useState({
    name: "",
    category: "",
    quantity: "",
    minStock: "",
    price: "",
    expiry: "",
    description: "",
    batchNumber: "",
    supplier: "",
    vatRate: "0",
    requiresPrescription: false,
    manufacturer: "",
    storageCondition: "Room Temperature"
  });

  // Fetch medicine data on mount
  useEffect(() => {
    const fetchMedicine = async () => {
      if (!user || !params.id) return;
      
      setLoading(true);
      try {
        const result = await getMedicines(user.uid);
        
        if (result.success) {
          const foundMedicine = result.data.find(med => med.id === params.id);
          
          if (foundMedicine) {
            setMedicine(foundMedicine);
            setForm({
              name: foundMedicine.name || "",
              category: foundMedicine.category || "",
              quantity: foundMedicine.quantity || "",
              minStock: foundMedicine.minStock || "",
              price: foundMedicine.price || "",
              expiry: foundMedicine.expiry || "",
              description: foundMedicine.description || "",
              batchNumber: foundMedicine.batchNumber || "",
              supplier: foundMedicine.supplier || "",
              vatRate: foundMedicine.vatRate?.toString() || "0",
              requiresPrescription: foundMedicine.requiresPrescription || false,
              manufacturer: foundMedicine.manufacturer || "",
              storageCondition: foundMedicine.storageCondition || "Room Temperature"
            });
          } else {
            alert("Imiti ntabwo ibonetse.");
            router.push("/dashboard/inventory");
          }
        }
      } catch (error) {
        console.error("Error fetching medicine:", error);
        alert("Habaye ikibazo. Ongera ugerageze.");
      } finally {
        setLoading(false);
      }
    };

    fetchMedicine();
  }, [user, params.id, router]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user || !medicine) return;

    setSaving(true);

    try {
      // Convert vatRate to number
      const submissionData = {
        ...form,
        vatRate: parseFloat(form.vatRate),
        quantity: Number(form.quantity),
        minStock: Number(form.minStock),
        price: Number(form.price)
      };

      const result = await updateMedicine(medicine.id, user.uid, submissionData);
      
      if (result.success) {
        alert("Umuti wahinduwe neza!");
        router.push("/dashboard/inventory");
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Habaye ikibazo. Ongera ugerageze.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!medicine) {
    return null;
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-gray-100 transition"
          disabled={saving}
        >
          <ArrowLeft />
        </button>

        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Hindura Imiti: {medicine.name}
          </h1>
          <p className="text-sm text-gray-500">
            Hindura amakuru y'umuti
          </p>
        </div>
      </div>

      {/* Compliance Notice - Updated */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Shield className="text-yellow-600 mt-0.5" size={18} />
          <div className="text-sm text-yellow-700">
            <strong>Ibyo ukeneye gusobanukirwa:</strong> No. ya Lot, Uwayiduhaye n'Umushobyi 
            ntabwo ari ngombwa. Ushobora kubireka ubusa niba utabizi.
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
            Izina ry'Umuti *
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
              disabled={saving}
            />
          </div>
        </div>

        {/* CATEGORY */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Icyiciro cy'Umuti *
          </label>
          <div className="relative mt-1">
            <Layers className="absolute left-3 top-3 text-gray-400" size={18} />
            <select
              name="category"
              required
              value={form.category}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-green-600"
              disabled={saving}
            >
              <option value="">Hitamo icyiciro</option>
              <option value="Pain Relief">Ibicururwa</option>
              <option value="Antibiotic">Antibiyotike</option>
              <option value="Cold & Flu">Umusatsi n'imitsi</option>
              <option value="Vitamins">Vitamin</option>
              <option value="Rehydration">Gusubiza amazi mu mubiri</option>
              <option value="Controlled Substance">Igiyobokamana</option>
              <option value="Other">Ibindi</option>
            </select>
          </div>
        </div>

        {/* BATCH NUMBER & SUPPLIER - NOW OPTIONAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Barcode size={14} /> No. ya Lot (Batch)
            </label>
            <div className="relative mt-1">
              <input
                type="text"
                name="batchNumber"
                placeholder="Niba uyifite, urugero: BATCH-2024-01"
                value={form.batchNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600"
                disabled={saving}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Building size={14} /> Uwayiduhaye (Supplier)
            </label>
            <div className="relative mt-1">
              <input
                type="text"
                name="supplier"
                placeholder="Niba uyifite, urugero: Rwanda Pharma Ltd"
                value={form.supplier}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600"
                disabled={saving}
              />
            </div>
          </div>
        </div>

        {/* MANUFACTURER & STORAGE - NOW OPTIONAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Umushobyi (Manufacturer)
            </label>
            <input
              type="text"
              name="manufacturer"
              placeholder="Niba uyifite, urugero: Rwanda Pharma"
              value={form.manufacturer}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600"
              disabled={saving}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Ububiko (Storage)
            </label>
            <select
              name="storageCondition"
              value={form.storageCondition}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-green-600"
              disabled={saving}
            >
              <option value="Room Temperature">Ubushyuhe bwa kijijini</option>
              <option value="Refrigerated">Ibijyanye no gufirijeya (2-8°C)</option>
              <option value="Cold Chain">Cold Chain</option>
              <option value="Protected from Light">Kurinda umweru</option>
            </select>
          </div>
        </div>

        {/* QUANTITY + MIN STOCK */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Ingano Yinjijwe *
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
                disabled={saving}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Ingano Ntoya (Alert) *
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
                disabled={saving}
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
                disabled={saving}
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
                disabled={saving}
              >
                <option value="0">0% (Imiti ngenderwaho)</option>
                <option value="0.18">18% (Icyiciro gisanzwe)</option>
              </select>
            </div>
          </div>
        </div>

        {/* EXPIRY DATE & PRESCRIPTION REQUIREMENT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Itariki Izarangiriraho *
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
                disabled={saving}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="flex items-center pt-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="requiresPrescription"
                checked={form.requiresPrescription}
                onChange={handleChange}
                className="rounded border-gray-300"
                disabled={saving}
              />
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Shield size={14} /> Igomba impapuro z'ubuvuzi
              </span>
            </label>
            {form.requiresPrescription && (
              <span className="ml-2 text-xs text-red-600">(FDA Controlled)</span>
            )}
          </div>
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Ibisobanuro
          </label>
          <textarea
            name="description"
            rows={3}
            value={form.description}
            onChange={handleChange}
            placeholder="Ibisobanuro by'inyongera ku muti"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600"
            disabled={saving}
          />
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2 rounded-lg border text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            disabled={saving}
          >
            Hagarika
          </button>

          <button
            type="submit"
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Bikorwa...
              </>
            ) : (
              <>
                <Save size={18} />
                Hindura Umuti
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}