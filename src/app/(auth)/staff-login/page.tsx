"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Users, Lock, Loader2, ArrowRight, Smartphone, ChefHat } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";

export default function StaffLoginPage() {
  const [staffId, setStaffId] = useState("");
  const [passcode, setPasscode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formattedId = staffId.toLowerCase().startsWith("staff_") ? staffId.toLowerCase() : `staff_${staffId.toLowerCase()}`;
      
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", formattedId)
        .single();

      if (error || !data) throw new Error("Invalid Staff ID. Please check with your manager.");
      
      if (data.staff_passcode !== passcode) {
        throw new Error("Incorrect Passcode. Access Denied.");
      }
      
      // CREATE STAFF SESSION IN LOCALSTORAGE
      localStorage.setItem("staff_session", JSON.stringify({
        id: data.id,
        role: data.role,
        name: data.full_name,
        restaurant_id: data.restaurant_id
      }));

      toast.success(`Welcome to the shift, ${data.full_name}!`);
      
      const target = data.role === 'waiter' ? "/dashboard/waiter" : "/dashboard/kitchen";
      window.location.assign(target);
    } catch (error: any) {
      toast.error(error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full" />
      
      <Card className="w-full max-w-md p-12 bg-slate-900/40 backdrop-blur-3xl border-white/5 rounded-[48px] shadow-2xl relative z-10 text-center border-b-primary/20">
        <div className="space-y-10">
          <div className="flex justify-center gap-4">
             <div className="p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 text-cyan-400">
                <Smartphone className="w-6 h-6" />
             </div>
             <div className="p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20 text-orange-400">
                <ChefHat className="w-6 h-6" />
             </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">STAFF <span className="text-primary">PORTAL</span></h1>
            <p className="text-slate-500 font-bold text-[10px] tracking-[0.4em] uppercase">Bhojan Workforce Entry</p>
          </div>

          <form onSubmit={handleStaffLogin} className="space-y-6">
            <div className="space-y-3">
               <div className="relative group">
                 <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-primary transition-colors">
                    <Users className="w-5 h-5" />
                 </div>
                 <input 
                   required 
                   value={staffId} 
                   onChange={(e) => setStaffId(e.target.value)}
                   placeholder="Enter Staff ID" 
                   className="w-full bg-white/5 border border-white/5 rounded-3xl pl-16 pr-8 py-6 outline-none focus:border-primary/50 text-white font-bold transition-all placeholder:text-slate-700 text-lg" 
                 />
               </div>
               
               <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-primary transition-colors">
                    <Lock className="w-5 h-5" />
                 </div>
                 <input 
                   required 
                   type="password" 
                   value={passcode} 
                   onChange={(e) => setPasscode(e.target.value)}
                   placeholder="Passcode" 
                   className="w-full bg-white/5 border border-white/5 rounded-3xl pl-16 pr-8 py-6 outline-none focus:border-primary/50 text-white font-bold transition-all placeholder:text-slate-700 text-lg" 
                 />
               </div>
            </div>

            <Button disabled={isLoading} type="submit" className="w-full py-10 rounded-[32px] text-2xl font-black uppercase tracking-tighter bg-primary text-black shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all">
              {isLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : (
                <>
                  Start Shift
                  <ArrowRight className="w-6 h-6" />
                </>
              )}
            </Button>
          </form>

          <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">
            Don't have an ID? Contact your manager.
          </p>
        </div>
      </Card>
    </div>
  );
}
