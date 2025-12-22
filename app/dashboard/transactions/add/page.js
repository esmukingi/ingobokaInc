// app/dashboard/transactions/add/page.js - FIXED VALIDATION
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Plus, Loader2, Pill, Tag, Package, 
  DollarSign, Calendar, Search, User, UserCircle,
  Shield, Percent, FileText, Info
} from "lucide-react";
import { addRRACompliantTransaction } from "@/helper/rraCompliance";
import { getMedicines, updateMedicineStock } from "@/helper/inventory";
import { useAuth } from "@/hooks/auth"; 

export default function AddTransactionPage() {
  const { user } = useAuth(); 
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingMedicines, setIsLoadingMedicines] = useState(false);
  const [medicinesList, setMedicinesList] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // FDA Fields for controlled substances - ALL OPTIONAL
  const [prescriberName, setPrescriberName] = useState("");
  const [patientName, setPatientName] = useState("");
  const [prescriptionNumber, setPrescriptionNumber] = useState("");
  const [patientId, setPatientId] = useState("");
  
  // RRA Fields
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [showPrescriptionFields, setShowPrescriptionFields] = useState(false);
  const [prescriptionFieldsRequired, setPrescriptionFieldsRequired] = useState(false);

  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    setDate(formattedDate);
  }, []);

  useEffect(() => {
    if (user) {
      loadMedicines();
    }
  }, [user]);

  const loadMedicines = async () => {
    if (!user) return;
    
    setIsLoadingMedicines(true);
    try {
      const result = await getMedicines(user.uid);
      
      if (result.success) {
        const availableMedicines = result.data.filter(med => med.quantity > 0);
        setMedicinesList(result.data);
        setFilteredMedicines(availableMedicines);
      } else {
        setErrorMessage(`Habaye ikosa mu kuzana imiti: ${result.message}`);
      }
      
    } catch (error) {
      console.error("Ikosa mu kuzana imiti:", error);
      setErrorMessage(`Habaye ikosa mu kuzana imiti: ${error.message}`);
    } finally {
      setIsLoadingMedicines(false);
    }
  };

  useEffect(() => {
    if (searchTerm.trim() === "") {
      const available = medicinesList.filter(med => med.quantity > 0);
      setFilteredMedicines(available);
    } else {
      const filtered = medicinesList.filter(med => {
        const searchLower = searchTerm.toLowerCase();
        const nameMatch = med.name?.toLowerCase().includes(searchLower) || false;
        const categoryMatch = med.category?.toLowerCase().includes(searchLower) || false;
        const batchMatch = med.batchNumber?.toLowerCase().includes(searchLower) || false;
        return (nameMatch || categoryMatch || batchMatch) && med.quantity > 0;
      });
      setFilteredMedicines(filtered);
    }
  }, [searchTerm, medicinesList]);

  const handleSelectMedicine = (medicine) => {
    setSelectedMedicine(medicine);
    setSearchTerm(medicine.name);
    
    if (medicine.price) {
      setPrice(medicine.price.toString());
    }
    
    // Show prescription fields if medicine requires prescription
    if (medicine.requiresPrescription) {
      setShowPrescriptionFields(true);
      // Make prescription fields REQUIRED only if medicine is controlled substance
      // For regular prescription medicines, they can be optional
      setPrescriptionFieldsRequired(medicine.isControlled || false);
    } else {
      setShowPrescriptionFields(false);
      setPrescriptionFieldsRequired(false);
      // Clear fields if not needed
      setPrescriberName("");
      setPatientName("");
      setPrescriptionNumber("");
      setPatientId("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setErrorMessage("Ntabwo wemewe. Gerageza kongera winjire.");
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    // BASIC VALIDATION ONLY
    if (!selectedMedicine) {
      setErrorMessage("Nyamuneka hitamo umuti.");
      setIsSubmitting(false);
      return;
    }

    if (!quantity || quantity.trim() === "") {
      setErrorMessage("Nyamuneka shyiraho ingano.");
      setIsSubmitting(false);
      return;
    }

    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum)) {
      setErrorMessage("Ingano igomba kuba inomero.");
      setIsSubmitting(false);
      return;
    }

    if (quantityNum <= 0) {
      setErrorMessage("Ingano igomba kuba niba.");
      setIsSubmitting(false);
      return;
    }

    if (quantityNum > selectedMedicine.quantity) {
      setErrorMessage(`Nta mubare uhingutse. Irabura: ${selectedMedicine.quantity}`);
      setIsSubmitting(false);
      return;
    }

    if (!price || price.trim() === "") {
      setErrorMessage("Nyamuneka shyiraho igiciro.");
      setIsSubmitting(false);
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum)) {
      setErrorMessage("Igiciro kigomba kuba inomero.");
      setIsSubmitting(false);
      return;
    }

    if (priceNum <= 0) {
      setErrorMessage("Igiciro kigomba kuba niba.");
      setIsSubmitting(false);
      return;
    }

    if (!date) {
      setErrorMessage("Nyamuneka shyiraho itariki.");
      setIsSubmitting(false);
      return;
    }

    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) {
      setErrorMessage("Itariki si nziza.");
      setIsSubmitting(false);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate > today) {
      setErrorMessage("Itariki igomba kuba ari iy'uwa munsi cyangwa ishize.");
      setIsSubmitting(false);
      return;
    }

    // REMOVED THE PRESCRIPTION VALIDATION BLOCK - ALL FIELDS ARE OPTIONAL
    // The only exception is if medicine.isControlled === true, but we'll handle that differently

    try {
      // Prepare transaction data with OPTIONAL prescription fields
      const transactionData = {
        medicine: selectedMedicine.name,
        medicineId: selectedMedicine.id,
        category: selectedMedicine.category,
        batchNumber: selectedMedicine.batchNumber || "",
        quantity: quantityNum,
        price: priceNum,
        date,
        paymentMethod,
        
        // FDA Prescription Info - OPTIONAL (include even if empty)
        prescriberName: prescriberName || "",
        patientName: patientName || "",
        prescriptionNumber: prescriptionNumber || "",
        patientId: patientId || "",
        
        // Mark if medicine requires prescription
        requiresPrescription: selectedMedicine.requiresPrescription || false,
        isControlled: selectedMedicine.isControlled || false
      };

      // Show warning for controlled substances without prescription
      if (selectedMedicine.isControlled && (!prescriberName || !patientName)) {
        const confirmSale = window.confirm(
          "⚠️ Iki kijyana ni kimwe mu bita 'Controlled Substances' (narcotics, opioids, etc.). \n\n" +
          "FDA itanga amabwiriza yo kugira impapuro kuri ibi bijyana. \n\n" +
          "Emeza ko uzi ko ikijyana gifite impapuro n'ibyo byakozwe n'umuganga?"
        );
        
        if (!confirmSale) {
          setIsSubmitting(false);
          return;
        }
      }

      const transactionResult = await addRRACompliantTransaction(user.uid, transactionData);

      if (!transactionResult.success) {
        setErrorMessage(`Habaye ikosa mu gushyira igikorwa: ${transactionResult.error}`);
        setIsSubmitting(false);
        return;
      }

      // Update stock
      const newQuantity = selectedMedicine.quantity - quantityNum;
      const updateResult = await updateMedicineStock(
        selectedMedicine.id, 
        newQuantity, 
        user.uid, 
        `Gurishwa: ${quantityNum}, resi: ${transactionResult.receiptNumber}`
      );

      if (!updateResult.success) {
        console.warn(`Stock update warning: ${updateResult.message}`);
        // Don't fail the transaction if stock update fails
      }

      // Show success with receipt number
      setSuccessMessage(`✅ Igikorwa cyashyizwe neza! Numero ya Resi: ${transactionResult.receiptNumber}`);

      // Reset form after 3 seconds
      setTimeout(() => {
        resetForm();
        loadMedicines();
      }, 3000);

    } catch (error) {
      console.error("Ikosa mu gushyira mu rupapuro:", error);
      setErrorMessage("Habaye ikosa mu koshya gushyira mu rupapuro. Gerageza nanone.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedMedicine(null);
    setQuantity("");
    setPrice("");
    const today = new Date();
    setDate(today.toISOString().split('T')[0]);
    setSearchTerm("");
    setPrescriberName("");
    setPatientName("");
    setPrescriptionNumber("");
    setPatientId("");
    setPaymentMethod("cash");
    setShowPrescriptionFields(false);
    setPrescriptionFieldsRequired(false);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const getTodayDate = () => {
    const today = new Date();
    return `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
  };

  // Calculate VAT
  const vatRate = selectedMedicine?.vatRate || 0;
  const subtotal = parseFloat(quantity || 0) * parseFloat(price || 0);
  const vatAmount = subtotal * vatRate;
  const total = subtotal + vatAmount;

  if (!user) {
    return (
      <div className="p-4 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
          <p className="mt-2 text-sm text-gray-600">Irazana...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Link 
            href="/dashboard/transactions" 
            className="flex items-center gap-1 text-green-600 hover:text-green-700 text-sm"
          >
            <ArrowLeft size={16} />
            <span>Subira inyuma</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Plus size={24} className="text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Ongeramo Igikorwa</h1>
            <p className="text-sm text-gray-500 mt-1">Hitamo umuti wari mububiko, hanyuma ushyiremo igikorwa</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto">
        {/* Success / Error Messages */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium">{successMessage}</span>
            </div>
          </div>
        )}
        
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 text-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="font-medium">{errorMessage}</span>
            </div>
          </div>
        )}

        {/* FDA Compliance Notice */}
        {showPrescriptionFields && (
          <div className={`mb-4 p-3 rounded-lg border ${prescriptionFieldsRequired ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
            <div className={`flex items-center gap-2 text-sm ${prescriptionFieldsRequired ? 'text-red-700' : 'text-blue-700'}`}>
              <Shield size={16} />
              <span>
                {prescriptionFieldsRequired 
                  ? <strong>⚠️ Ibikenewe:</strong> 
                  : <strong>💡 Inama:</strong>
                } 
                {prescriptionFieldsRequired 
                  ? " Iyi miti ikenewe impapuro (controlled substance)." 
                  : " Iyi miti iragenewe impapuro, ariko amakuru ashobora kureka."
                }
              </span>
            </div>
          </div>
        )}

        <div className="bg-white shadow-sm rounded-xl p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Medicine Search */}
            <div>
              <label className="text-gray-800 font-medium flex items-center gap-2 mb-2 text-sm">
                <Pill size={16} className="text-green-600" />
                Shakisha Umuti
              </label>
              
              <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border border-gray-300 rounded-lg pl-9 pr-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Andika izina ry'umuti, lot, cyangwa icyiciro..."
                  disabled={isLoadingMedicines || isSubmitting}
                />
                
                {isLoadingMedicines && (
                  <Loader2 size={16} className="absolute right-3 top-3 animate-spin text-green-500" />
                )}
              </div>

              {/* Selected Medicine Info */}
              {selectedMedicine && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 text-sm">{selectedMedicine.name}</div>
                      <div className="text-xs text-gray-600 mt-2 flex flex-wrap gap-1">
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                          {selectedMedicine.category}
                        </span>
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          Irabura: <span className="font-bold">{selectedMedicine.quantity}</span>
                        </span>
                        {selectedMedicine.batchNumber && (
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            Lot: {selectedMedicine.batchNumber}
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded ${
                          selectedMedicine.vatRate === 0 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          VAT: {selectedMedicine.vatRate === 0 ? '0%' : '18%'}
                        </span>
                        {selectedMedicine.requiresPrescription && (
                          <span className={`px-2 py-1 rounded flex items-center gap-1 ${
                            selectedMedicine.isControlled 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            <Shield size={10} />
                            {selectedMedicine.isControlled ? 'Ikenewe Impapuro' : 'Igenewe Impapuro'}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMedicine(null);
                        setSearchTerm("");
                        setPrice("");
                        setShowPrescriptionFields(false);
                        setPrescriptionFieldsRequired(false);
                      }}
                      className="text-red-600 hover:text-red-700 text-sm ml-2"
                      disabled={isSubmitting}
                    >
                      Hanagura
                    </button>
                  </div>
                </div>
              )}

              {/* Medicine Suggestions */}
              {!selectedMedicine && searchTerm && filteredMedicines.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                  {filteredMedicines.map((medicine) => (
                    <button
                      type="button"
                      key={medicine.id}
                      onClick={() => handleSelectMedicine(medicine)}
                      className="w-full text-left p-3 border-b border-gray-100 hover:bg-green-50 transition flex justify-between items-center"
                      disabled={isSubmitting}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 text-sm">{medicine.name}</div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                          <span>{medicine.category}</span>
                          <span className="text-blue-600 font-semibold">
                            • Irabura: {medicine.quantity}
                          </span>
                        </div>
                        {medicine.requiresPrescription && (
                          <div className={`text-xs mt-1 flex items-center gap-1 ${
                            medicine.isControlled ? 'text-red-600' : 'text-blue-600'
                          }`}>
                            <Shield size={10} />
                            {medicine.isControlled ? 'Ikenewe Impapuro' : 'Igenewe Impapuro'}
                          </div>
                        )}
                      </div>
                      {medicine.price > 0 && (
                        <div className="text-green-600 font-bold text-sm ml-3">
                          Rwf {medicine.price.toLocaleString()}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {!selectedMedicine && searchTerm && filteredMedicines.length === 0 && !isLoadingMedicines && (
                <div className="mt-2 p-4 text-center border border-gray-200 rounded-lg bg-gray-50">
                  <Pill size={24} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600 text-sm">Nta mubare uhingutse wabonetse</p>
                </div>
              )}
            </div>

            {/* Transaction Details */}
            {selectedMedicine && (
              <>
                {/* Quantity and Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-800 font-medium text-sm mb-1 block">
                      Ingano
                    </label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      min="1"
                      max={selectedMedicine.quantity}
                      step="1"
                      className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder={`Max: ${selectedMedicine.quantity}`}
                      required
                      disabled={isSubmitting}
                    />
                    <div className="flex gap-1 mt-1">
                      {[1, 5, 10].map((num) => (
                        <button
                          type="button"
                          key={num}
                          onClick={() => setQuantity(num.toString())}
                          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition"
                          disabled={isSubmitting}
                        >
                          {num}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setQuantity(selectedMedicine.quantity.toString())}
                        className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded transition"
                        disabled={isSubmitting}
                      >
                        Irabura ryose
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-800 font-medium text-sm mb-1 block">
                      Igiciro (Rwf)
                    </label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      min="0"
                      step="100"
                      className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Igiciro"
                      required
                      disabled={isSubmitting}
                    />
                    {selectedMedicine.price > 0 && (
                      <div className="mt-1">
                        <button
                          type="button"
                          onClick={() => setPrice(selectedMedicine.price.toString())}
                          className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition"
                          disabled={isSubmitting}
                        >
                          Igiciro ryari mububiko
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="text-gray-800 font-medium text-sm mb-1 block">
                    Uburyo bwo kwishyura
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {value: 'cash', label: 'Amafaranga'},
                      {value: 'mobile', label: 'Mobile'},
                      {value: 'card', label: 'Ikarita'}
                    ].map((method) => (
                      <button
                        type="button"
                        key={method.value}
                        onClick={() => setPaymentMethod(method.value)}
                        className={`p-2 rounded-lg border text-center text-sm ${
                          paymentMethod === method.value 
                            ? 'border-green-500 bg-green-50 text-green-700' 
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                        disabled={isSubmitting}
                      >
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* FDA Prescription Fields - OPTIONAL */}
                {showPrescriptionFields && (
                  <div className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-800 text-sm">
                        Amakuru y'Impapuro (Bishoboka)
                      </h3>
                      <Info size={14} className="text-gray-400" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-700">
                          Izina rya Muganga {prescriptionFieldsRequired && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="text"
                          value={prescriberName}
                          onChange={(e) => setPrescriberName(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-sm mt-1"
                          placeholder="Dr. John Doe"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700">
                          Izina ry'umujyanama {prescriptionFieldsRequired && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="text"
                          value={patientName}
                          onChange={(e) => setPatientName(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-sm mt-1"
                          placeholder="Izina ry'umujyanama"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700">No. ya Prescription</label>
                        <input
                          type="text"
                          value={prescriptionNumber}
                          onChange={(e) => setPrescriptionNumber(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-sm mt-1"
                          placeholder="RX-2024-00123"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700">ID Number</label>
                        <input
                          type="text"
                          value={patientId}
                          onChange={(e) => setPatientId(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-sm mt-1"
                          placeholder="119988...."
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    
                    {!prescriptionFieldsRequired && (
                      <div className="mt-2 text-xs text-gray-500">
                        <p>Amakuru ashobora kureka. Shyiramo niba biriho.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Total Calculation */}
                {quantity && price && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="grid grid-cols-3 gap-3 mb-2">
                      <div>
                        <div className="text-xs text-gray-600">Subtotal</div>
                        <div className="font-bold text-gray-800 text-sm">
                          Rwf {subtotal.toLocaleString()}
                        </div>
                      </div>
                      {vatRate > 0 && (
                        <div>
                          <div className="text-xs text-gray-600">VAT ({vatRate * 100}%)</div>
                          <div className="font-bold text-blue-600 text-sm">
                            Rwf {vatAmount.toLocaleString()}
                          </div>
                        </div>
                      )}
                      <div>
                        <div className="text-xs text-gray-600">Total</div>
                        <div className="font-bold text-green-700 text-sm">
                          Rwf {total.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {quantity} × {parseFloat(price || 0).toLocaleString()} = {subtotal.toLocaleString()}
                      {vatRate > 0 && ` + ${vatAmount.toLocaleString()} VAT = ${total.toLocaleString()}`}
                    </div>
                    
                    <div className="flex justify-between items-center mt-3 pt-3 border-t">
                      <div>
                        <div className="text-xs text-gray-600">Umubare usigaye</div>
                        <div className={`font-bold text-sm ${
                          (selectedMedicine.quantity - parseInt(quantity || 0)) < 10 
                            ? "text-red-600" 
                            : "text-green-600"
                        }`}>
                          {selectedMedicine.quantity - parseInt(quantity || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Date */}
                <div>
                  <label className="text-gray-800 font-medium text-sm mb-1 block">
                    Itariki y'igikorwa
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                    disabled={isSubmitting}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Itariki y'uwa munsi: {getTodayDate()}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || !quantity || !price || !user}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-medium rounded-lg transition text-sm ${
                      isSubmitting || !quantity || !price || !user
                        ? "bg-green-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Iracyakozwa...
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        {selectedMedicine.quantity < parseInt(quantity || 0) ? 
                          "Nta mubare uhingutse" : 
                          "Ongeramo Igikorwa"
                        }
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Loading State */}
            {isLoadingMedicines && !selectedMedicine && (
              <div className="text-center p-4">
                <Loader2 size={24} className="animate-spin text-green-500 mx-auto" />
                <p className="text-gray-600 text-sm mt-2">Imiti irazanwa...</p>
              </div>
            )}
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-800 text-sm mb-2">Amabwiriza:</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li className="flex items-start gap-1">
              <span className="text-green-500">✓</span>
              <span>Imiti y'ibirego (controlled) amakuru y'impapuro arashobora kureka</span>
            </li>
            <li className="flex items-start gap-1">
              <span className="text-green-500">✓</span>
              <span>Imiti y'impapuro (prescription) amakuru ashobora kureka</span>
            </li>
            <li className="flex items-start gap-1">
              <span className="text-green-500">✓</span>
              <span>Burigikorwa kizahabwa numero ya resi itandukanye</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}