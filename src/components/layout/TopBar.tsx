"use client";

import { Bell, Search, Settings, HelpCircle, Wifi } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { auth as firebaseAuth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { Bell as BellIcon, Search as SearchIcon, Menu as MenuIcon } from "lucide-react";

interface TopBarProps {
  onMenuClick?: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const [profile, setProfile] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const staffSessionStr = localStorage.getItem("staff_session");
    if (staffSessionStr) {
      try {
        const staff = JSON.parse(staffSessionStr);
        setProfile({ full_name: staff.name, role: staff.role });
      } catch (e) {}
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", user.uid).single();
        if (data) setProfile(data);
      }
    });
    return () => unsubscribe();
  }, []);

  const displayName = profile?.full_name || "Operator";
  
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Platform Owner';
      case 'owner': return 'Restaurant Owner';
      case 'waiter': return 'Service Waiter';
      case 'kitchen': return 'Kitchen Staff';
      default: return 'Station Staff';
    }
  };

  const displayRole = getRoleLabel(profile?.role || 'staff');
  const displayAvatar = profile?.avatar_url || `https://ui-avatars.com/api/?name=${displayName.replace(/\s+/g, '+')}&background=00d4ff&color=fff&bold=true`;

  return (
    <header className="h-20 border-b border-white/5 bg-[#05070a]/80 backdrop-blur-3xl sticky top-0 z-[90] px-4 md:px-8 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors"
        >
          <MenuIcon className="w-6 h-6" />
        </button>

        <div className="hidden md:flex flex-1 max-w-xl">
          <div className="relative group w-full">
            <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search intelligence..." 
              className="w-full bg-white/5 border border-white/5 rounded-[20px] pl-14 pr-8 py-3 text-xs outline-none focus:border-primary/50 transition-all text-white font-black uppercase tracking-widest placeholder:text-slate-700"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <button className="relative p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-primary/10 hover:text-primary transition-all text-slate-500 group">
          <BellIcon className="w-5 h-5 group-hover:animate-swing" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-accent rounded-full border-2 border-[#05070a] shadow-[0_0_10px_#00ff88]" />
        </button>
        
        <div className="flex items-center gap-3 md:gap-4 pl-3 md:pl-6 border-l border-white/5 min-w-0">
          <div className="text-right hidden sm:block min-w-0">
            <p className="text-[10px] md:text-sm font-black text-white leading-none uppercase tracking-tighter italic truncate max-w-[120px]">{displayName}</p>
            <p className="text-[8px] text-slate-600 uppercase font-black tracking-widest mt-1.5 truncate">{displayRole}</p>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 p-[1px] shadow-2xl group cursor-pointer transition-all hover:scale-110 border border-white/5 shrink-0">
            <div className="w-full h-full rounded-[11px] md:rounded-[15px] bg-slate-900 flex items-center justify-center overflow-hidden">
              <img src={displayAvatar} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
