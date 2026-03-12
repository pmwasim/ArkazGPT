"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, ClipboardList, Truck, CheckSquare, Users,
  BookOpen, Receipt, Package, Wrench, MapPin, FileText, Settings,
  ChevronLeft, ChevronRight, Building2
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/service-receipts", label: "Service Receipts", icon: ClipboardList },
  { href: "/delivery-notes", label: "Delivery Notes", icon: Truck },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/field-service", label: "Field Service", icon: MapPin },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/projects", label: "Projects", icon: Building2 },
  { href: "/stock", label: "Stock", icon: Package },
  { href: "/tools", label: "Tools", icon: Wrench },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/accounts", label: "Accounts", icon: BookOpen },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-gray-900 text-white transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">A</div>
            <span className="font-bold text-lg">ArkazGPT</span>
          </div>
        )}
        {collapsed && <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-sm mx-auto">A</div>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn("p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white", collapsed && "mx-auto mt-1")}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white",
                collapsed && "justify-center px-2"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
