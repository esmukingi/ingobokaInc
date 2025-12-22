"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Hero from "../../assets/hero.png";
import { login } from "@/helper/auth";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

const Page = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      toast.success("Wakiriwe neza!");
      // Don't check pharmacyCreated here - let the auth hook handle it
      // Just redirect to dashboard, the root page will handle the logic
      router.push("/dashboard");
    } else {
      toast.error(res.message || "Habaye ikibazo, ongerea ugerageze");
      if (res.redirect) {
        router.push(res.redirect);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1 flex-col md:flex-row items-center justify-center px-4 md:px-12 py-8">
        <div className="w-full md:w-1/2 flex justify-center mb-8 md:mb-0">
          <Image
            src={Hero}
            alt="Doctor using system"
            className="object-contain"
            width={500}
            height={500}
          />
        </div>

        <div className="w-full md:w-1/2 max-w-md bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-semibold text-gray-800 mb-6">
            Injira muri konti yawe
          </h2>

          <form className="flex flex-col gap-4" onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email cyangwa numero ya telefoni"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
              required
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Ijambo ry'ibanga"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-600"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-2 text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hisha" : "Erekana"}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`flex items-center justify-center gap-2 mt-4 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Tegereza..." : "Injira"}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-500">
            Nta konti?{" "}
            <Link
              href="/signup"
              className="text-green-600 font-medium hover:underline"
            >
              Iyandikishe
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Page;