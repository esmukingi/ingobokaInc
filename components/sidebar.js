"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  CreditCard,
  Wallet,
  Calendar,
  Settings,
} from "lucide-react";

import Logo from "@/assets/Logo.png";

const links = [
  { label: "Incamake", href: "/dashboard", icon: LayoutDashboard },
  { label: "Ububiko", href: "/dashboard/inventory", icon: Package },
  { label: "Kugurisha", href: "/dashboard/transactions", icon: CreditCard },
  { label: "Ibyasohowe", href: "/dashboard/expenses", icon: Wallet },
  { label: "Ibyataye Garanti", href: "/dashboard/expiry", icon: Calendar },
  { label: "Konti yange", href: "/dashboard/settings", icon: Settings },
];
export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-72 h-screen flex-col bg-white shadow-sm">
      
      {/* Logo section */}
      <div className="px-6 py-6 flex items-center gap-3">
        <Image
          src={Logo}
          alt="Ingoboka Inc"
          width={160}
          height={40}
          className="object-contain"
          priority
        />
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2 px-4 mt-4">
        {links.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;

          return (
            <Link
              key={label}
              href={href}
              className={`
                flex items-center gap-4 px-4 py-3 rounded-xl text-[15px] transition-all
                ${
                  active
                    ? "bg-green-50 text-green-700 font-semibold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }
              `}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom spacing / future user card */}
      <div className="mt-auto px-6 py-6 text-xs text-gray-400">
        © Ingoboka Inc
      </div>
    </aside>
  );
}
