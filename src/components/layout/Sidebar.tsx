"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { auth as firebaseAuth } from "@/lib/firebase/config";
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  Table2, 
  ClipboardList, 
  Users, 
  BarChart3, 
  Settings, 
  ChefHat, 
  LogOut,
  CreditCard,
  QrCode
} from "lucide-react";

interface SidebarProps {
  role?: "super_admin" | "owner" | "waiter" | "kitchen";
}

export default function Sidebar({ role = "owner" }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = {
    super_admin: [
      { name: "Overview", href: "/dashboard/super-admin", icon: LayoutDashboard },
      { name: "Restaurants", href: "/dashboard/super-admin/restaurants", icon: UtensilsCrossed },
      { name: "Subscriptions", href: "/dashboard/super-admin/subscriptions", icon: CreditCard },
      { name: "Users", href: "/dashboard/super-admin/users", icon: Users },
    ],
    owner: [
      { name: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
      { name: "Menu", href: "/dashboard/admin/menu", icon: UtensilsCrossed },
      { name: "Tables", href: "/dashboard/admin/tables", icon: Table2 },
      { name: "Orders", href: "/dashboard/admin/orders", icon: ClipboardList },
      { name: "Staff", href: "/dashboard/admin/staff", icon: Users },
      { name: "Analytics", href: "/dashboard/admin/analytics", icon: BarChart3 },
      { name: "Settings", href: "/dashboard/admin/settings", icon: Settings },
    ],
    waiter: [
      { name: "Tables", href: "/dashboard/waiter", icon: Table2 },
      { name: "Menu", href: "/dashboard/admin/menu", icon: UtensilsCrossed },
      { name: "Orders", href: "/dashboard/admin/orders", icon: ClipboardList },
    ],
    kitchen: [
      { name: "KDS Feed", href: "/dashboard/kitchen", icon: ChefHat },
      { name: "KDS Display", href: "/dashboard/kitchen/tv", icon: LayoutDashboard },
    ],
  };

  const currentMenu = menuItems[role] || menuItems.owner;

  const handleLogout = async () => {
    try {
      localStorage.removeItem("staff_session");
      localStorage.removeItem("waiter_cart");
      localStorage.removeItem("waiter_table");
      localStorage.removeItem("waiter_customer");
      localStorage.removeItem("waiter_step");
      
      await firebaseAuth.signOut();
      router.push("/login");
      router.refresh();
      setTimeout(() => window.location.reload(), 100);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <aside className="w-64 glass h-screen flex flex-col sticky top-0 border-r border-white/5 bg-slate-900/50 backdrop-blur-3xl">
      <div className="p-8 text-center sm:text-left">
        <h1 className="text-2xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-tighter italic">
          BHOJAN
        </h1>
        <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase mt-1">Management Suite</p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {currentMenu.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-200",
              pathname === item.href 
                ? "bg-primary text-black shadow-lg shadow-primary/20" 
                : "text-slate-500 hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon className={cn("w-5 h-5", pathname === item.href ? "text-black" : "text-slate-700")} />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-white/5">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-red-500/50 hover:bg-red-500/10 hover:text-red-400 transition-all font-black uppercase text-[10px] tracking-widest"
        >
          <LogOut className="w-5 h-5" />
          <span>Terminate Session</span>
        </button>
      </div>
    </aside>
  );
}
