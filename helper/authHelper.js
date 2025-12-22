// /helper/authHelper.js
import { 
  updateProfile, 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider 
} from "firebase/auth";

/**
 * Update user profile (display name)
 */
export const updateUserProfile = async (user, profileData) => {
  try {
    if (!user) {
      return { success: false, message: "Ntabwo wemewe." };
    }

    await updateProfile(user, {
      displayName: profileData.displayName || user.displayName
    });

    return { 
      success: true, 
      message: "Amakuru yagiye ahinduka neza!" 
    };
  } catch (error) {
    console.error("Profile update error:", error);
    let message = "Habaye ikosa mu guhindura amakuru.";
    
    switch(error.code) {
      case 'auth/requires-recent-login':
        message = "Ugomba kongera winjire kugirango uhinduramakuru.";
        break;
      case 'auth/network-request-failed':
        message = "Ikosa ry'umuyoboro. Gerageza nanone.";
        break;
      default:
        message = `Ikosa: ${error.message}`;
    }
    
    return { success: false, message };
  }
};

/**
 * Update user password
 */
export const updateUserPassword = async (user, currentPassword, newPassword) => {
  try {
    if (!user) {
      return { success: false, message: "Ntabwo wemewe." };
    }

    if (!currentPassword || !newPassword) {
      return { success: false, message: "Shyiramo ijambo ry'ibanga ryose." };
    }

    if (newPassword.length < 6) {
      return { success: false, message: "Ijambo ry'ibanga rigomba kuba nibura imibare 6." };
    }

    // Re-authenticate user first
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update password
    await updatePassword(user, newPassword);

    return { 
      success: true, 
      message: "Ijambo ry'ibanga ryahindutse neza!" 
    };
  } catch (error) {
    console.error("Password update error:", error);
    let message = "Habaye ikosa mu guhindura ijambo ry'ibanga.";
    
    switch(error.code) {
      case 'auth/wrong-password':
        message = "Ijambo ry'ibanga ryo muri iki gihe ntabwo ari ryo.";
        break;
      case 'auth/weak-password':
        message = "Ijambo ry'ibanga rishya rikeye cyane. Gereranya n'irindi.";
        break;
      case 'auth/requires-recent-login':
        message = "Ugomba kongera winjire kugirango uhinduramakuru.";
        break;
      case 'auth/network-request-failed':
        message = "Ikosa ry'umuyoboro. Gerageza nanone.";
        break;
      default:
        message = `Ikosa: ${error.message}`;
    }
    
    return { success: false, message };
  }
};

/**
 * Update additional user data in Firestore
 */
export const updateUserData = async (userId, userData) => {
  try {
    if (!userId) {
      return { success: false, message: "Ntabwo ID ya konti ihari." };
    }

    // You'll need to import db from your firebase config
    // import { db } from "@/firebase/config";
    // import { doc, updateDoc } from "firebase/firestore";
    
    // const userDocRef = doc(db, "users", userId);
    // await updateDoc(userDocRef, {
    //   ...userData,
    //   updatedAt: new Date().toISOString()
    // });

    return { 
      success: true, 
      message: "Amakuru yagiye ahinduka neza!" 
    };
  } catch (error) {
    console.error("User data update error:", error);
    return { 
      success: false, 
      message: `Habaye ikosa: ${error.message}` 
    };
  }
};