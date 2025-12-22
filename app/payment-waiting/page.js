// app/payment-waiting/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import Loader from "@/components/Loader";
import { Phone, Mail, Clock, CheckCircle, RefreshCw } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function PaymentWaitingPage() {
  const router = useRouter();
  const { user, userData, loading, isSubscriptionActive } = useAuth();
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [lastCheck, setLastCheck] = useState("");

  useEffect(() => {
    if (!user?.uid) return;


    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLastCheck(new Date().toLocaleTimeString());
        
        if (data.subscriptionActive) {
          router.push("/dashboard");
        }
      }
    });

    // Clean up listener when component unmounts
    return () => unsubscribe();
  }, [user, router]);

  // Manually check subscription status
  const checkStatus = async () => {
    if (!user?.uid) return;
    
    setCheckingStatus(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists() && userDoc.data().subscriptionActive) {
        router.push("/dashboard");
      }
      
      setLastCheck(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Error checking status:", error);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Auto-check every 30 seconds
  useEffect(() => {
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleCall = () => {
    window.location.href = "tel:+250732754111";
  };

  const handleEmail = () => {
    const subject = "Gukoresha Sisitemu - Pharmacy";
    const body = `Muraho,\n\nNjye ${user?.email}.\n\nNashakaga gukoresha sisitemu yawe.\n\nMurakoze!`;
    window.location.href = `mailto:ngobokaben@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-4 mt-8">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-8 md:p-10 text-center">
          
          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
              <Clock className="text-green-600 w-8 h-8 animate-pulse" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">
            Ubwishyu Burimo Gusuzumwa
          </h1>

          {/* Subtitle */}
          <p className="text-gray-600 mb-8 leading-relaxed">
            Twakiriye ibisobanuro by'ubwishyu bwawe.  
            Kugira ngo bwemezwe vuba kandi uhite ukoresha dashboard yawe,
            nyamuneka twandikire cyangwa uduhamagare.
          </p>

          {/* Contact Box */}
          <div className="border border-gray-200 rounded-xl p-6 mb-8 space-y-4">
            <button
              onClick={handleCall}
              className="flex items-center justify-center gap-3 text-gray-800 hover:text-green-600 w-full"
            >
              <Phone className="text-green-600 w-5 h-5" />
              <span className="font-medium">+250 732 754 111</span>
            </button>

            <button
              onClick={handleEmail}
              className="flex items-center justify-center gap-3 text-gray-800 hover:text-green-600 w-full"
            >
              <Mail className="text-green-600 w-5 h-5" />
              <span className="font-medium">ngobokaben@gmail.com</span>
            </button>
          </div>

          {/* Status Check Button */}
          <button
            onClick={checkStatus}
            disabled={checkingStatus}
            className={`flex items-center justify-center gap-2 w-full py-3 rounded-lg mb-4 ${
              checkingStatus 
                ? "bg-gray-100 text-gray-400" 
                : "bg-green-50 text-green-700 hover:bg-green-100"
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${checkingStatus ? "animate-spin" : ""}`} />
            {checkingStatus ? "Itegereza..." : "Suzuma status"}
          </button>

          {lastCheck && (
            <p className="text-sm text-gray-500 mb-4">
              Byasuzwe: {lastCheck}
            </p>
          )}

          {/* Fast Approval Message */}
          <div className="flex items-center justify-center gap-3 bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-8">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">
              Kwemezwa bifata iminota itarenze 5 – uhite ukoresha sisitemu
            </span>
          </div>

          {/* How it works */}
          <div className="text-left bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Uburyo bwo gukora:</h3>
            <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-600">
              <li>Hamagara cyangwa ohereza email</li>
              <li>Tuzakwemerera ubwishyu</li>
              <li>Uzabona dashboard yawe mu minota mike</li>
            </ol>
          </div>

          {/* Footer Note */}
          <p className="text-sm text-gray-500">
            Murakoze kuduhitamo. Turi hano kugufasha gukoresha sisitemu byihuse kandi neza.
          </p>
        </div>
      </main>
    </div>
  );
}