"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Hero from "../../assets/heroS.png";
import { signup } from "@/helper/auth";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

const Page = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await signup(email, password);
    setLoading(false);

    if (res.success) {
      toast.success("Konti yawe ifunguye neza!");
      router.push("/authSetup");
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <div className="flex flex-1 flex-col md:flex-row items-center justify-center px-4 md:px-12 py-8">
        <div className="w-full md:w-1/2 flex justify-center mb-8 md:mb-0">
          <Image
            src={Hero}
            alt="Happy doctor using system"
            className="object-contain"
            width={500}
            height={500}
          />
        </div>

        <div className="w-full md:w-1/2 max-w-md bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-semibold text-gray-800 mb-6">
            Iyandikishe
          </h2>

          <form className="flex flex-col gap-4" onSubmit={handleSignup}>
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
                placeholder="Shyiramo Ijambo banga"
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
              {loading ? "Tegereza..." : "Iyandikishe"}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-500">
            Ufite konti?{" "}
            <a
              href="/login"
              className="text-green-600 font-medium hover:underline"
            >
              Injira
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Page;
