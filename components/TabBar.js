"use client";

import Link from "next/link";
import { Home, Package, CreditCard, Wallet, Calendar, Settings, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";

const tabs = [
  { name: "Incamake", href: "/dashboard", icon: Home },
  { name: "Ububiko", href: "/dashboard/inventory", icon: Package },
  { name: "Kugurisha", href: "/dashboard/transactions", icon: CreditCard },
  { name: "Ibyasohowe", href: "/dashboard/expenses", icon: Wallet },
  { name: "Ibigiye Kurangira", href: "/dashboard/expiry", icon: Calendar },
  { name: "Konti yange", href: "/dashboard/settings", icon: Settings },
];

// Show first 3 tabs in main bar, rest in "More"
const mainTabs = tabs.slice(0, 3);
const moreTabs = tabs.slice(3);

export default function TabBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    const swipeThreshold = 50;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0 && currentIndex < mainTabs.length - 1) {
        // Swipe left
        setCurrentIndex(currentIndex + 1);
      } else if (diff < 0 && currentIndex > 0) {
        // Swipe right
        setCurrentIndex(currentIndex - 1);
      }
    }
  };

  return (
    <>
      {/* Mobile Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
        {/* Active Tab Indicator */}
        <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-300"
          style={{ 
            width: `${100 / mainTabs.length}%`,
            transform: `translateX(${currentIndex * 100}%)`
          }}
        />

        <div 
          className="bg-white/95 backdrop-blur-lg shadow-2xl shadow-black/10 pt-1"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex justify-between items-center px-2">
            {mainTabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href;
              
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  onClick={() => setCurrentIndex(index)}
                  className="relative flex-1"
                >
                  <div className={`flex flex-col items-center justify-center py-3 px-2 rounded-2xl mx-1 transition-all duration-300 ${
                    isActive 
                      ? 'bg-gradient-to-b from-green-100 to-emerald-50 text-green-600 scale-105' 
                      : 'text-gray-600 hover:text-green-500'
                  }`}>
                    <div className={`p-2 rounded-full transition-all duration-300 ${
                      isActive ? 'bg-green-500 text-white' : ''
                    }`}>
                      <Icon size={22} className={isActive ? 'scale-110' : ''} />
                    </div>
                    <span className={`text-xs font-medium mt-1 transition-all duration-300 ${
                      isActive ? 'font-semibold' : 'font-normal'
                    }`}>
                      {tab.name}
                    </span>
                  </div>
                  
                  {isActive && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <div className="w-1 h-1 bg-green-500 rounded-full" />
                    </div>
                  )}
                </Link>
              );
            })}

            {/* More Button */}
            <div className="flex-1 relative">
              <button
                onClick={() => setOpen(!open)}
                className={`w-full flex flex-col items-center justify-center py-3 px-2 rounded-2xl mx-1 transition-all duration-300 ${
                  open 
                    ? 'bg-gradient-to-b from-green-100 to-emerald-50 text-green-600' 
                    : 'text-gray-600 hover:text-green-500'
                }`}
              >
                <div className={`p-2 rounded-full transition-all duration-300 ${
                  open ? 'bg-green-500 text-white' : ''
                }`}>
                  <MoreHorizontal size={22} className={open ? 'scale-110' : ''} />
                </div>
                <span className={`text-xs font-medium mt-1 transition-all duration-300 ${
                  open ? 'font-semibold' : 'font-normal'
                }`}>
                  More
                </span>
              </button>
            </div>
          </div>
          
          {/* Swipe Indicator */}
          <div className="flex justify-center gap-1 pb-2 pt-1">
            {mainTabs.map((_, idx) => (
              <div 
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex 
                    ? 'bg-green-500 w-4' 
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* More Menu */}
      {open && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 z-30 md:hidden"
            onClick={() => setOpen(false)}
          />
          
          {/* Menu */}
          <div className="md:hidden fixed bottom-24 right-4 left-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 z-40 overflow-hidden border border-white/20">
            <div className="p-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-2">
                More Options
              </h3>
              
              <div className="grid grid-cols-2 gap-1">
                {moreTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = pathname === tab.href;
                  
                  return (
                    <Link
                      key={tab.name}
                      href={tab.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                        isActive 
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-600' 
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100'
                      }`}>
                        <Icon size={18} />
                      </div>
                      <span className="font-medium text-sm">{tab.name}</span>
                      
                      {isActive && (
                        <div className="ml-auto">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
            
            {/* Close Button */}
            <button
              onClick={() => setOpen(false)}
              className="w-full py-3 text-center text-gray-500 hover:text-gray-700 border-t border-gray-100 text-sm font-medium"
            >
              Close
            </button>
          </div>
        </>
      )}

      {/* Bottom safe area for iOS */}
      <div className="md:hidden h-20" />
    </>
  );
}
