"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Utensils, ArrowRight, Loader2, CheckCircle2, Eye, EyeOff, User, Mail, Lock } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/firebase/config";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    restaurantName: "",
    fullName: ""
  });
  
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Sign up with Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: formData.fullName });

      const isSuperAdmin = formData.email.toLowerCase() === "abhi.kush047@gmail.com";

      if (isSuperAdmin) {
        // Super Admin Bypass: No restaurant needed
        await supabase.from("profiles").upsert({ 
          id: user.uid,
          role: 'super_admin',
          full_name: formData.fullName
        });
        toast.success("Platform Master Account Created!");
        router.push("/dashboard/super-admin");
      } else {
        // Regular Restaurant Flow
        const randomSuffix = Math.floor(Math.random() * 1000);
        const slug = `${formData.restaurantName.toLowerCase().replace(/\s+/g, '-')}-${randomSuffix}`;
        
        const { data: resData, error: resError } = await supabase.from("restaurants").insert([
          { name: formData.restaurantName, slug: slug, is_active: true }
        ]).select().single();

        if (resError) throw new Error(`Restaurant Creation Failed: ${resError.message}`);

        const { error: profileError } = await supabase.from("profiles").upsert({ 
          id: user.uid,
          restaurant_id: resData.id,
          role: 'owner',
          full_name: formData.fullName,
          email: formData.email // Ensure email is saved for self-healing login
        });

        if (profileError) throw new Error(`Profile Sync Failed: ${profileError.message}`);

        toast.success("Welcome Aboard!");
        setStep(3);
        setTimeout(() => router.push("/dashboard/admin"), 2000);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[150px] rounded-full" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-accent/10 blur-[150px] rounded-full" />

      <Card className="w-full max-w-xl p-12 border-white/5 bg-slate-900/20 backdrop-blur-3xl rounded-[48px] relative z-10 shadow-2xl">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="text-center space-y-2">
                <h1 className="text-4xl font-black uppercase tracking-tighter text-white">Start Your <span className="text-primary">Journey</span></h1>
                <p className="text-slate-400 font-medium">Create your secure account powered by Firebase.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input type="text" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="Abhi Kushwaha" className="w-full bg-white/5 border border-white/5 rounded-3xl pl-16 pr-8 py-5 outline-none focus:border-primary/50 text-white font-bold" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input type="email" name="email" autoComplete="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="name@example.com" className="w-full bg-white/5 border border-white/5 rounded-3xl pl-16 pr-8 py-5 outline-none focus:border-primary/50 text-white font-bold" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="••••••••" className="w-full bg-white/5 border border-white/5 rounded-3xl pl-16 pr-14 py-5 outline-none focus:border-primary/50 text-white font-bold" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button onClick={() => setStep(2)} className="w-full py-10 rounded-[32px] text-xl font-black uppercase tracking-tighter gap-3">
                Next <ArrowRight className="w-6 h-6" />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.form onSubmit={handleSignup} key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="text-center space-y-2">
                <h1 className="text-4xl font-black uppercase tracking-tighter text-white">Your <span className="text-accent">Restaurant</span></h1>
                <p className="text-slate-400 font-medium">Finalize your onboarding.</p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Utensils className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input required type="text" value={formData.restaurantName} onChange={(e) => setFormData({...formData, restaurantName: e.target.value})} placeholder="Restaurant Name" className="w-full bg-white/5 border border-white/5 rounded-3xl pl-16 pr-8 py-5 outline-none focus:border-accent/50 text-white font-bold text-lg" />
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 py-10 rounded-[32px] font-black uppercase border-white/5">Back</Button>
                <Button type="submit" disabled={isLoading} className="flex-[2] py-10 rounded-[32px] text-xl font-black uppercase bg-accent text-white">
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Launch"}
                </Button>
              </div>
            </motion.form>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 py-10">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 mx-auto"><CheckCircle2 className="w-12 h-12 text-primary" /></div>
              <h1 className="text-4xl font-black uppercase text-white">Welcome Master!</h1>
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500 font-medium">
            Already have an account? <Link href="/login" className="text-primary font-bold hover:underline">Sign In</Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
