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
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ role = "owner", isOpen, onClose }: SidebarProps) {
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
      const keysToClear = [
        "staff_session", "waiter_cart", "waiter_table", 
        "waiter_customer", "waiter_step", "bhojan_role",
        "staff_session_v2", "waiter_orders"
      ];
      keysToClear.forEach(key => localStorage.removeItem(key));
      await firebaseAuth.signOut();
      window.location.assign("/");
    } catch (error) {
      console.error("Logout failed", error);
      window.location.assign("/");
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      <aside className={cn(
        "w-72 glass h-screen flex flex-col fixed lg:sticky top-0 z-[101] border-r border-white/5 bg-[#05070a]/95 backdrop-blur-3xl transition-transform duration-500 ease-spring",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-tighter italic">
              BHOJAN
            </h1>
            <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase mt-1">Management Suite</p>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 rounded-xl bg-white/5 text-slate-500">
             <QrCode className="w-5 h-5 rotate-45" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto no-scrollbar py-4">
          {currentMenu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (window.innerWidth < 1024) onClose?.();
              }}
              className={cn(
                "flex items-center gap-4 px-5 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all duration-300 group",
                pathname === item.href 
                  ? "bg-primary text-white shadow-2xl shadow-primary/20" 
                  : "text-slate-500 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", pathname === item.href ? "text-white" : "text-slate-700")} />
              <span>{item.name}</span>
              {pathname === item.href && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_white]" />}
            </Link>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-white/5 bg-white/[0.01]">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-[24px] text-red-500/50 hover:bg-red-500/10 hover:text-red-400 transition-all font-black uppercase text-[10px] tracking-widest group"
          >
            <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>
    </>
  );
}
