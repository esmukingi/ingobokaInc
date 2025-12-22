"use client";

import React, { useState, useEffect } from "react";
import { 
  User, 
  Lock, 
  Settings as SettingsIcon, 
  CreditCard, 
  Loader, 
  AlertCircle, 
  CheckCircle,
  Eye,
  EyeOff,
  LogOut
} from "lucide-react";
import { useAuth } from "@/hooks/auth";
import { updateUserProfile, updateUserPassword, updateUserData } from "@/helper/authHelper";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/config";

export default function SettingsPage() {
  const router = useRouter();
  const { user, userData, token, loading: authLoading, refreshUserData } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setName(user.displayName || userData?.pharmacyName || "");
      setEmail(user.email || "");
    }
  }, [user, userData]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setProfileLoading(true);
    setError("");
    setSuccess("");

    try {
      // Update profile in Firebase Auth
      const profileResult = await updateUserProfile(user, { displayName: name });
      
      if (!profileResult.success) {
        setError(profileResult.message);
        setProfileLoading(false);
        return;
      }

      // Update pharmacy name in Firestore if it's different from display name
      if (userData?.pharmacyName !== name) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          await updateDoc(userDocRef, {
            pharmacyName: name,
            updatedAt: new Date().toISOString()
          });
          
          // Refresh user data
          await refreshUserData();
        } catch (firestoreError) {
          console.error("Error updating Firestore:", firestoreError);
          // Continue even if Firestore update fails - auth update was successful
        }
      }

      setSuccess("Amakuru yawe yagiye ahinduka neza!");
      setTimeout(() => setSuccess(""), 3000);
      
    } catch (err) {
      console.error("Profile update error:", err);
      setError("Habaye ikosa mu guhindura amakuru. Gerageza nanone.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setPasswordLoading(true);
    setError("");
    setSuccess("");

    // Validation
    if (!currentPassword) {
      setError("Shyiramo ijambo ry'ibanga ryo muri iki gihe.");
      setPasswordLoading(false);
      return;
    }

    if (!newPassword) {
      setError("Shyiramo ijambo ry'ibanga rishya.");
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("Ijambo ry'ibanga rigomba kuba nibura imibare 6.");
      setPasswordLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Ijambo ry'ibanga rishya ntabwo ryahuye.");
      setPasswordLoading(false);
      return;
    }

    try {
      const result = await updateUserPassword(user, currentPassword, newPassword);
      
      if (result.success) {
        setSuccess("Ijambo ry'ibanga ryahindutse neza!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error("Password update error:", err);
      setError("Habaye ikosa mu guhindura ijambo ry'ibanga. Gerageza nanone.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    if (confirm("Urifuza gusohoka muri konti yawe?")) {
      try {
        await signOut(auth);
        router.push("/login");
      } catch (error) {
        console.error("Logout error:", error);
        setError("Habaye ikosa mu gusohoka. Gerageza nanone.");
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Nta makuru";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('rw-RW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (authLoading) {
    return (
      <div className="flex-1 p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-green-600 mx-auto" />
          <p className="mt-2 text-gray-600">Irazana amakuru...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Ntabwo wemewe</h2>
          <p className="text-gray-600 mb-4">Injira kugirango urebe amakuru yawe</p>
          <button
            onClick={() => router.push("/login")}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Injira
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Page Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <SettingsIcon size={20} className="text-green-600" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Igenamiterere rya Konti</h1>
              <p className="text-sm text-gray-600 mt-1">Gucunga amakuru ya konti na Pharmacy yawe</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut size={14} />
            Sohoka
          </button>
        </div>
      </header>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700 text-sm">
            <CheckCircle size={16} />
            <span className="font-medium">{success}</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle size={16} />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Account / Subscription Status */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white shadow-sm rounded-xl p-4">
          <h2 className="text-base font-semibold text-gray-700 flex items-center gap-2 mb-3">
            <User size={18} /> Amakuru ya Konti
          </h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500">Izina rya Pharmacy:</span>
              <div className="font-medium text-gray-800">
                {userData?.pharmacyName || user.displayName || "Nta izina ryashyizweho"}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Email:</span>
              <div className="font-medium text-gray-800">{user.email}</div>
            </div>
            <div>
              <span className="text-gray-500">ID ya Konti:</span>
              <div className="font-mono text-xs text-gray-500 truncate">{user.uid}</div>
            </div>
            <div>
              <span className="text-gray-500">Yinjiriye:</span>
              <div className="font-medium text-gray-800">
                {user.metadata?.creationTime ? 
                  formatDate(user.metadata.creationTime) : 
                  "Nta makuru"}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-xl p-4">
          <h2 className="text-base font-semibold text-gray-700 flex items-center gap-2 mb-3">
            <CreditCard size={18} /> Ubwishyu & Igihe
          </h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500">Ubwishyu:</span>
              <div>
                <span className={`font-medium ${userData?.subscriptionActive ? "text-green-600" : "text-red-600"}`}>
                  {userData?.subscriptionActive ? "Bwakiriwe ✓" : "Bwarangiye ✗"}
                </span>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Igihe kitararangira:</span>
              <div className="font-medium text-gray-800">
                {userData?.subscriptionExpiry ? 
                  formatDate(userData.subscriptionExpiry) : 
                  "Nta makuru"}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Inyungu:</span>
              <div className="font-medium text-gray-800">
                {userData?.subscriptionActive ? "Byuzuye" : "Byahanutse"}
              </div>
            </div>
            <div className="pt-2">
              <button
                onClick={() => router.push("/payment-waiting")}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                Hindura ubwishyu →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Profile Update Form */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white shadow-sm rounded-xl p-4">
          <h2 className="text-base font-semibold mb-3 text-gray-800 flex items-center gap-2">
            <User size={18} /> Hindura Amakuru ya Konti
          </h2>
          <form className="flex flex-col gap-3" onSubmit={handleProfileUpdate}>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Izina rya Pharmacy</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Andika izina rya Pharmacy"
                disabled={profileLoading}
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
                disabled
                title="Ntushobora guhindura email"
              />
              <p className="text-xs text-gray-500 mt-1">Ntushobora guhindura email</p>
            </div>
            
            <button
              type="submit"
              disabled={profileLoading || !name.trim()}
              className={`mt-1 px-4 py-2.5 text-sm font-medium rounded-lg transition ${
                profileLoading || !name.trim()
                  ? "bg-green-300 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              {profileLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader size={14} className="animate-spin" />
                  Iracyakorwa...
                </span>
              ) : "Hindura Amakuru"}
            </button>
          </form>
        </div>

        {/* Password Update Form */}
        <div className="bg-white shadow-sm rounded-xl p-4">
          <h2 className="text-base font-semibold mb-3 text-gray-800 flex items-center gap-2">
            <Lock size={18} /> Hindura Ijambo ry'Ibanga
          </h2>
          <form className="flex flex-col gap-3" onSubmit={handlePasswordUpdate}>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Ijambo ry'ibanga ryo muri iki gihe</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ijambo ry'ibanga ryo muri iki gihe"
                  disabled={passwordLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Ijambo ry'ibanga rishya</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ijambo ry'ibanga rishya (nibura imibare 6)"
                  disabled={passwordLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Sangira ijambo ry'ibanga</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Sangira ijambo ry'ibanga rishya"
                  disabled={passwordLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
              className={`mt-1 px-4 py-2.5 text-sm font-medium rounded-lg transition ${
                passwordLoading || !currentPassword || !newPassword || !confirmPassword
                  ? "bg-green-300 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              {passwordLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader size={14} className="animate-spin" />
                  Iracyakorwa...
                </span>
              ) : "Hindura Ijambo ry'Ibanga"}
            </button>
          </form>
        </div>
      </section>

      {/* Additional Info */}
      <div className="bg-white shadow-sm rounded-xl p-4">
        <h3 className="text-base font-semibold mb-3 text-gray-800">Amabwiriza y'Umwirondoro</h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5"></div>
            <span>Ijambo ry'ibanga rigomba kuba nibura imibare 6</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5"></div>
            <span>Ntushobora guhindura email, iyo ubikeneye, wandike kuri support@example.rw</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5"></div>
            <span>Ubwishyu bwawe buri kumugaragaro muri kigize cy'Ubwishyu</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5"></div>
            <span>Amakuru yose ashyizwe muburyo butagenewe kugaragaza</span>
          </li>
        </ul>
      </div>
    </div>
  );
}