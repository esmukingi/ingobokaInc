"use client";
import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import { Home, User } from "lucide-react";
import { createPharmacy } from "@/helper/auth"; 
import useAuthStore from "@/store/authStore";
import { useRouter } from "next/navigation";

const districts = [
  "Kigali", "Rwamagana", "Huye", "Musanze", "Rubavu", "Nyamagabe"
];

const Page = () => {
  const [pharmacyName, setPharmacyName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [district, setDistrict] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const user = useAuthStore((state) => state.authUser);
  const router = useRouter();

  const handleNext = async (e) => {
    e.preventDefault();
    if (!user) {
      setError("User not authenticated!");
      return;
    }

    setLoading(true);
    setError("");

    const pharmacyData = {
      pharmacyName,
      ownerName,
      district,
    };

    const result = await createPharmacy(user.uid, pharmacyData);
    setLoading(false);

    if (result.success) {
      router.push("/payment-waiting");
    } else {
      setError(result.message || "Hari ikibazo mu gukora pharmacy.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex flex-1 flex-col md:flex-row items-center justify-center px-4 md:px-12 py-8">
        <div className="hidden md:flex md:w-1/2 justify-center items-start">
          <div className="text-center">
            <Home size={60} className="text-green-600 mb-4 mx-auto" />
            <h3 className="text-xl font-semibold text-gray-800">Shyiramo amakuru yawe</h3>
            <p className="text-gray-500 mt-2">Gusa amakuru y'ingenzi ku ivuriro ryawe</p>
          </div>
        </div>

        <div className="w-full md:w-1/2 max-w-md bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center mb-6">
            <div className="flex-1 h-2 bg-gray-200 rounded-full relative">
              <div className="h-2 bg-green-600 rounded-full w-1/2"></div>
            </div>
            <p className="ml-3 text-sm text-gray-500">Step 1 of 2</p>
          </div>

          {error && <p className="text-red-600 mb-4">{error}</p>}

          <form className="flex flex-col gap-5" onSubmit={handleNext}>
            <div className="flex items-center gap-3 border border-gray-300 rounded-lg px-4 py-2 focus-within:ring-2 focus-within:ring-green-600 transition">
              <Home size={20} className="text-green-600" />
              <input
                type="text"
                placeholder="Izina rya pharmacy"
                value={pharmacyName}
                onChange={(e) => setPharmacyName(e.target.value)}
                className="w-full outline-none"
                required
              />
            </div>

            <div className="flex items-center gap-3 border border-gray-300 rounded-lg px-4 py-2 focus-within:ring-2 focus-within:ring-green-600 transition">
              <User size={20} className="text-green-600" />
              <input
                type="text"
                placeholder="Izina ry'umuyobozi"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full outline-none"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-gray-700 font-medium">Hitamo akarere</label>
              <div className="grid grid-cols-2 gap-3">
                {districts.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDistrict(d)}
                    className={`px-4 py-2 rounded-lg border transition ${
                      district === d
                        ? "bg-green-600 text-white border-green-600"
                        : "border-gray-300 text-gray-700 hover:bg-green-50"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`mt-4 w-full px-4 py-2 font-medium rounded-lg transition ${
                loading
                  ? "bg-green-300 text-white cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {loading ? "Birimo gukorwa..." : "Komeza"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Page;