// hooks/auth.js - FIXED version with real-time subscription monitoring
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { auth, db } from "@/firebase/config";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import useAuthStore from "@/store/authStore";
import { useRouter } from "next/navigation";

export const useAuth = () => {
  const { authUser, token, setUser, clearUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const router = useRouter();
  
  // Refs
  const firestoreUnsubscribeRef = useRef(null);
  const authUnsubscribeRef = useRef(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  
  // Check if subscription is expired
  const checkSubscriptionExpired = useCallback((data) => {
    if (!data?.subscriptionExpiry) return false;
    
    const expiryDate = data.subscriptionExpiry.toDate();
    const now = new Date();
    const isExpired = expiryDate < now;
    const isActive = data.subscriptionActive === true;
    
    return isExpired || !isActive;
  }, []);

  const setupFirestoreListener = useCallback((userId) => {
    if (firestoreUnsubscribeRef.current) {
      firestoreUnsubscribeRef.current();
    }

    const userDocRef = doc(db, "users", userId);
    
    console.log("🔍 Setting up Firestore listener for user:", userId);
    
    firestoreUnsubscribeRef.current = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          setUserData(null);
          return;
        }

        const data = docSnap.data();
        console.log("📡 Firestore data updated:", {
          ...data,
          subscriptionExpiry: data.subscriptionExpiry?.toDate()
        });
        
        setUserData(data);
        
        // Check if subscription expired
        const isSubscriptionExpired = checkSubscriptionExpired(data);
        console.log("🔍 Subscription check:", {
          expiry: data.subscriptionExpiry?.toDate(),
          now: new Date(),
          isExpired: isSubscriptionExpired
        });
        
        // If subscription expired, redirect to subscription page
        if (isSubscriptionExpired) {
          console.log("⚠️ Subscription expired, checking current route...");
          const currentPath = window.location.pathname;
          
          // Don't redirect if already on subscription page or auth pages
          if (!currentPath.includes('subscriptionExp') && 
              !currentPath.includes('login') && 
              !currentPath.includes('register')) {
            console.log("🔄 Redirecting to subscription expired page");
            router.push('/subscriptionExp');
          }
        }
        
        retryCountRef.current = 0;
      },
      (error) => {
        console.error("❌ Firestore listener error:", error);
        
        if (error.code === 'unavailable' && retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          
          setTimeout(() => {
            if (userId) {
              setupFirestoreListener(userId);
            }
          }, 1000 * retryCountRef.current);
        } else {
          setError(error);
        }
      }
    );
  }, [checkSubscriptionExpired, router]);

  // Manual refresh
  const refreshUserData = async () => {
    if (!authUser?.uid) return null;
    
    try {
      console.log("🔄 Manually refreshing user data...");
      const userDocRef = doc(db, "users", authUser.uid);
      const docSnap = await getDoc(userDocRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        
        // Check subscription status on manual refresh too
        const isSubscriptionExpired = checkSubscriptionExpired(data);
        if (isSubscriptionExpired) {
          router.push('/subscriptionExp');
        }
        
        return data;
      }
      return null;
    } catch (error) {
      console.error("❌ Manual refresh error:", error);
      return null;
    }
  };

  useEffect(() => {
    console.log("🚀 Setting up auth listener...");
    
    authUnsubscribeRef.current = auth.onAuthStateChanged(async (firebaseUser) => {
      try {
        setLoading(true);
        setError(null);
        
        if (firestoreUnsubscribeRef.current) {
          firestoreUnsubscribeRef.current();
        }

        if (!firebaseUser) {
          clearUser();
          setUserData(null);
          setLoading(false);
          return;
        }

        const freshToken = await firebaseUser.getIdToken();
        setUser(firebaseUser, freshToken);
        
        // Setup Firestore listener
        setupFirestoreListener(firebaseUser.uid);
        
        // Also get immediate data
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists()) {
          const initialData = docSnap.data();
          setUserData(initialData);
          
          // Check subscription on initial load
          const isSubscriptionExpired = checkSubscriptionExpired(initialData);
          if (isSubscriptionExpired) {
            console.log("⏰ Initial load: Subscription expired");
            router.push('/subscriptionExp');
          }
        }
        
        setLoading(false);
        
      } catch (error) {
        console.error("❌ Auth state change error:", error);
        setError(error);
        setLoading(false);
      }
    });

    return () => {
      if (authUnsubscribeRef.current) {
        authUnsubscribeRef.current();
      }
      if (firestoreUnsubscribeRef.current) {
        firestoreUnsubscribeRef.current();
      }
    };
  }, [setUser, clearUser, setupFirestoreListener, checkSubscriptionExpired, router]);

  return { 
    user: authUser, 
    userData,
    token, 
    loading, 
    error,
    isAuthenticated: !!authUser,
    hasPharmacy: !!userData?.pharmacyCreated,
    isSubscriptionActive: userData?.subscriptionActive || false,
    refreshUserData,
    checkSubscriptionExpired
  };
};