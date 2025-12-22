"use client";

import { Toaster } from "react-hot-toast";
import ClientLayout from "../layout/clientLayout";

export default function ClientLayoutWrapper({ children }) {
  return (
    <ClientLayout>
      {children}
      <Toaster position="bottom-right" />
    </ClientLayout>
  );
}
