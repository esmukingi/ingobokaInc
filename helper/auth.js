// helper/auth.js
"use client";

import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from "firebase/auth";
import { auth, db } from "@/firebase/config";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import useAuthStore from "@/store/authStore";

export const signup = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    const token = await firebaseUser.getIdToken();

    useAuthStore.getState().setUser(firebaseUser, token);

    return { success: true, user: firebaseUser };
  } catch (error) {
    let message = "Hari ikibazo. Ongera ugerageze.";
    switch (error.code) {
      case "auth/email-already-in-use":
        message = "Email imaze gukoreshwa. Hamagara +250 732 754 111 niba wibagiwe password";
        break;
      case "auth/invalid-email":
        message = "Iyi email ntabwo yanditse neza";
        break;
      case "auth/weak-password":
        message = "Password ntabwo ikomeye";
        break;
      default:
        message = error.message;
    }
    return { success: false, message };
  }
};

export const createPharmacy = async (userId, pharmacyData) => {
  try {
    console.log("📝 Creating pharmacy for user:", userId);
    console.log("📦 Pharmacy data:", pharmacyData);
    
    const userDocRef = doc(db, "users", userId);
    const pharmacyDataWithMeta = {
      ...pharmacyData,
      subscriptionActive: false,
      subscriptionExpiry: null,
      pharmacyCreated: true, 
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: "pending_payment", 
    };
    
    console.log("📤 Writing to Firestore:", userDocRef.path);
    
    await setDoc(userDocRef, pharmacyDataWithMeta);
    

    const verifyDoc = await getDoc(userDocRef);
    console.log("✅ Pharmacy created successfully!");
    console.log("✅ Document exists:", verifyDoc.exists());
    
    return { 
      success: true, 
      data: verifyDoc.data(),
      message: "Pharmacy created successfully. Please complete payment."
    };
    
  } catch (error) {
    console.error("❌ Error creating pharmacy:", error);
    return { 
      success: false, 
      message: error.message || "Hari ikibazo mu gukora pharmacy",
      errorCode: error.code 
    };
  }
};

export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    const token = await firebaseUser.getIdToken();

    const userDocRef = doc(db, "users", firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return { success: false, message: "Pharmacy ntabwo ibonetse muri sisitemu.", redirect: "/authSetup" };
    }

    const userData = userDocSnap.data();
    const now = new Date();

    if (!userData.subscriptionActive || userData.subscriptionExpiry?.toDate() < now) {
      return { success: false, message: "Ubwishyu bwawe bwararangiye. Hamagara +250 732 754 111", redirect: "/subscriptionExp" };
    }

    useAuthStore.getState().setUser(firebaseUser, token);
    return { success: true, user: firebaseUser };
  } catch (error) {
    let message = "Hari ikibazo. Ongera ugerageze.";
    switch (error.code) {
      case "auth/user-not-found":
        message = "Pharmacy ntabwo ibonetse. Iyandikishe.";
        break;
      case "auth/wrong-password":
        message = "Password siyo. Ongera ugerageze.";
        break;
      case "auth/invalid-email":
        message = "Email ntabwo ari yo. Ongera ugerageze.";
        break;
      case "auth/user-disabled":
        message = "Konti yawe yafunze. Hamagara +250 732 754 111";
        break;
      default:
        message = error.message;
    }
    return { success: false, message };
  }
};

export const logout = async () => {
  await auth.signOut();
  useAuthStore.getState().clearUser();
};
