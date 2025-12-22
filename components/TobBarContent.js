"use client";

import { Bell, LogOut, Menu, User } from "lucide-react";
import SearchInput from "./searchInput";
import { useRouter } from "next/navigation";
export default function TopBar({ searchPlaceholder, onMenuClick }) {
  const router = useRouter();
  return (
    <header className="h-24 bg-white flex items-center justify-between px-4 md:px-6 shadow-sm">
      
      {/* LEFT: Mobile menu + User icon */}
      <div className="flex items-center gap-3">
        
        {/* Mobile menu */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
          onClick={onMenuClick}
        >
          <Menu size={22} className="text-gray-700" />
        </button>

        {/* User avatar */}
        <div 
        onClick={() => router.push('/dashboard')}
        className="hidden md:flex items-center justify-center w-10 h-10 cursor-pointer rounded-full bg-green-100 text-green-700">
          <User size={20} />
        </div>
      </div>

      {/* CENTER: Search */}
      <div className="hidden md:flex flex-1 justify-center max-w-xl">
        <SearchInput
          placeholder={searchPlaceholder || "Shakisha imiti, ibikorwa..."}
        />
      </div>

      {/* RIGHT: Actions */}
      <div className="flex items-center gap-5">
        
        {/* Notifications */}
        <button 
        onClick={() => router.push('/dashboard/notifications')}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition">
          <Bell size={22} className="text-gray-600" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full"></span>
        </button>

        {/* Logout */}
        <button 
        onClick={() => router.push('/login')}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition">
          <LogOut size={18} />
          <span className="hidden sm:inline">Sohoka</span>
        </button>
      </div>
    </header>
  );
}
