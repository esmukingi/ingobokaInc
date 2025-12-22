"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set) => ({
      authUser: null,
      token: null,

      setUser: (authUser, token) => {
        set({ authUser, token });
      },

      clearUser: () => {
        set({ authUser: null, token: null });
      },
    }),
    {
      name: "auth-storage",
      getStorage: () => {
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        return null;
      },
    }
  )
);

export default useAuthStore;