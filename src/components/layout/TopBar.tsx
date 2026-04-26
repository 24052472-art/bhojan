"use client";

import { Bell, Search } from "lucide-center";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { auth as firebaseAuth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { Bell as BellIcon, Search as SearchIcon } from "lucide-react";

export default function TopBar() {
  const [profile, setProfile] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    // 1. CHECK FOR STAFF SESSION (LOCALSTORAGE)
    const staffSessionStr = localStorage.getItem("staff_session");
    if (staffSessionStr) {
      try {
        const staff = JSON.parse(staffSessionStr);
        setProfile({
          full_name: staff.name,
          role: staff.role
        });
      } catch (e) {}
    }

    // 2. WATCH FIREBASE AUTH (OWNERS / SUPER ADMINS)
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        const { data } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.uid)
          .single();
        
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
    <header className="h-20 border-b border-white/5 bg-slate-950/50 backdrop-blur-3xl sticky top-0 z-50 px-8 flex items-center justify-between">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search tickets, tables, items..." 
            className="w-full bg-white/5 border border-white/5 rounded-3xl pl-14 pr-8 py-3 text-sm outline-none focus:border-primary/50 transition-all text-white font-black uppercase tracking-tighter placeholder:text-slate-700"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2.5 rounded-2xl bg-white/5 border border-white/5 hover:bg-primary/10 hover:text-primary transition-all text-slate-500">
          <BellIcon className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-accent rounded-full border-2 border-slate-950 shadow-[0_0_10px_#00ff88]" />
        </button>
        
        <div className="flex items-center gap-4 pl-6 border-l border-white/5">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-white leading-none uppercase tracking-tighter italic">{displayName}</p>
            <p className="text-[9px] text-slate-600 uppercase font-black tracking-[0.2em] mt-2">{displayRole}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 p-[1px] shadow-2xl group cursor-pointer transition-all hover:scale-110 border border-white/5">
            <div className="w-full h-full rounded-[15px] bg-slate-900 flex items-center justify-center overflow-hidden">
              <img src={displayAvatar} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
