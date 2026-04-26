"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Mail, Lock, Loader2, Eye, EyeOff, LayoutDashboard, ArrowRight } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/firebase/config";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setSession(user);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleEnter = async (e?: any) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No active session");

      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.uid)
        .single();

      if (error || !profile) throw new Error("Profile not found");

      let target = "/dashboard/admin";
      if (profile.role === 'super_admin') target = "/dashboard/super-admin";
      if (profile.role === 'waiter') target = "/dashboard/waiter";
      if (profile.role === 'kitchen') target = "/dashboard/kitchen";

      window.location.assign(target);
    } catch (err: any) {
      toast.error(err.message);
      setIsLoading(false);
    }
  };

  const handleOwnerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Identity Verified!");
      handleEnter();
    } catch (error: any) {
      toast.error(error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full" />
      
      <Card className="w-full max-w-md p-12 bg-slate-900/40 backdrop-blur-3xl border-white/5 rounded-[48px] shadow-2xl relative z-10 text-center border-t-primary/20">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-none">BHOJAN</h1>
            <p className="text-slate-500 font-bold text-[10px] tracking-[0.4em] uppercase">Cloud Infrastructure</p>
          </div>

          {session ? (
            <div className="space-y-6">
               <div className="p-8 bg-primary/5 border border-primary/20 rounded-[32px]">
                  <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-2">Authenticated As</p>
                  <p className="text-white font-bold truncate text-sm tracking-tight">{session.email}</p>
               </div>
               
               <Button 
                 onClick={handleEnter}
                 className="w-full py-10 rounded-[32px] text-2xl font-black uppercase tracking-tighter bg-primary text-black hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/30 flex items-center justify-center gap-3"
               >
                 {isLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : <><LayoutDashboard className="w-8 h-8" /> ENTER SUITE</>}
               </Button>

               <button 
                 onClick={() => auth.signOut().then(() => window.location.reload())}
                 className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] hover:text-red-400"
               >
                 Switch Account
               </button>
            </div>
          ) : (
            <form onSubmit={handleOwnerLogin} className="space-y-6">
              <div className="space-y-3">
                 <div className="relative group">
                   <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-primary transition-colors">
                      <Mail className="w-5 h-5" />
                   </div>
                   <input 
                     required 
                     type="email" 
                     value={email} 
                     onChange={(e) => setEmail(e.target.value)}
                     placeholder="OWNER EMAIL" 
                     className="w-full bg-white/5 border border-white/5 rounded-3xl pl-16 pr-8 py-5 outline-none focus:border-primary/50 text-white font-bold transition-all placeholder:text-slate-700 uppercase text-xs tracking-widest" 
                   />
                 </div>
                 
                 <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-primary transition-colors">
                      <Lock className="w-5 h-5" />
                   </div>
                   <input 
                     required 
                     type={showPassword ? "text" : "password"} 
                     value={password} 
                     onChange={(e) => setPassword(e.target.value)}
                     placeholder="ACCESS KEY" 
                     className="w-full bg-white/5 border border-white/5 rounded-3xl pl-16 pr-8 py-5 outline-none focus:border-primary/50 text-white font-bold transition-all placeholder:text-slate-700 uppercase text-xs tracking-widest" 
                   />
                   <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                     {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                   </button>
                 </div>
              </div>

              <Button disabled={isLoading} type="submit" className="w-full py-10 rounded-[32px] text-2xl font-black uppercase tracking-tighter bg-primary text-black shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all">
                {isLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : (
                  <>
                    Verify & Launch
                    <ArrowRight className="w-6 h-6" />
                  </>
                )}
              </Button>
            </form>
          )}

          {!session && (
            <Link href="/signup" className="block text-xs text-slate-600 font-black uppercase tracking-[0.3em] hover:text-primary transition-colors">
              Onboard Restaurant
            </Link>
          )}
        </div>
      </Card>
      
      {/* Background Decor */}
      <div className="fixed -bottom-32 -right-32 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
    </div>
  );
}
