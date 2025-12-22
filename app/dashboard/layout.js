// app/dashboard/layout.js
"use client";

import TopBar from "@/components/TopBar";
import Sidebar from "@/components/sidebar";
import TabBar from "@/components/TabBar";
import { SearchProvider } from "@/context/searchContext";

export default function Layout({ children }) {
  return (
    <SearchProvider>
      <div className="h-screen flex bg-gray-50 overflow-hidden">
        
        {/* Sidebar (desktop only) */}
        <Sidebar />

        <div className="flex flex-col flex-1">
          <TopBar />

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
            {children}
          </main>

          {/* Mobile TabBar */}
          <TabBar />
        </div>
      </div>
    </SearchProvider>
  );
}