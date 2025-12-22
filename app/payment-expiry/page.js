"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import { AlertCircle, Phone } from "lucide-react";

export default function PaymentExpiredPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-4 md:px-12 py-10">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-8 md:p-10 text-center">
          
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 flex items-center justify-center rounded-full bg-red-100">
              <AlertCircle size={40} className="text-red-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">
            Ubwishyu Bwarangiye
          </h1>

          {/* Description */}
          <p className="text-gray-600 leading-relaxed mb-6">
            Kwishyura kwa konti yawe kwarangiye. Kugira ngo ukomeze gukoresha
            sisitemu ya <span className="font-medium text-gray-800">Ingoboka Inc</span> 
            nta nkomyi, turagusaba kuvugurura ubwishyu bwawe bw’ukwezi gukurikira.
          </p>

          {/* Highlight message */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-700">
              Kuvugurura ubwishyu bizatuma:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-gray-600 text-left">
              <li>• Ukomeze gucunga imiti n’ibikorwa byawe neza</li>
              <li>• Wirinde guhagarikwa kwa serivisi</li>
              <li>• Uhabwe ubufasha bwihuse igihe cyose ubikeneye</li>
            </ul>
          </div>

          {/* Call to action */}
          <p className="text-gray-700 mb-3">
            Nyamuneka hamagara iyi nimero kugirango uvugurure ubwishyu:
          </p>

          <div className="flex justify-center">
            <a
              href="tel:+250732754111"
              className="flex items-center gap-3 px-6 py-3 rounded-xl bg-green-600 text-white text-lg font-medium hover:bg-green-700 transition shadow-md"
            >
              <Phone size={20} />
              +250 732 754 111
            </a>
          </div>

          {/* Footer note */}
          <p className="text-xs text-gray-500 mt-6">
            Serivisi yawe izahita isubira gukora nyuma yo kwemeza ubwishyu.
          </p>
        </div>
      </main>
    </div>
  );
}
