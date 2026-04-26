"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { 
  Users, 
  UserPlus, 
  ChefHat, 
  Smartphone, 
  Trash2, 
  Key, 
  Mail,
  Loader2,
  ShieldCheck,
  Search,
  Lock,
  Share2,
  Copy,
  ExternalLink,
  AlertTriangle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { auth as firebaseAuth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function StaffManagement() {
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  const [newStaff, setNewStaff] = useState({
    fullName: "",
    role: "waiter" as "waiter" | "kitchen",
    passcode: ""
  });

  const supabase = createClient();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        try {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.uid)
            .single();
          
          if (error) throw error;
          
          setAdminProfile(profile);
          if (profile?.restaurant_id) {
            fetchStaff(profile.restaurant_id);
          } else {
            setIsLoading(false);
            toast.error("Restaurant not linked.");
          }
        } catch (err: any) {
          console.error("Staff page profile fetch error:", err);
          setIsLoading(false);
          toast.error("Failed to load profile.");
        }
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  async function fetchStaff(restaurantId: string) {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .neq("role", "owner")
        .neq("role", "super_admin");
      
      if (error) throw error;
      setStaff(data || []);
    } catch (err: any) {
      toast.error("Failed to load staff registry.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleCopyLink = () => {
    const link = `${window.location.origin}/staff-login`;
    navigator.clipboard.writeText(link);
    toast.success("Staff Login Link Copied!");
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile?.restaurant_id) return;
    
    setIsLoading(true);
    try {
      const staffId = `staff_${Math.random().toString(36).substr(2, 9)}`;
      
      const { error } = await supabase.from("profiles").insert([{
        id: staffId,
        full_name: newStaff.fullName,
        role: newStaff.role,
        restaurant_id: adminProfile.restaurant_id,
        staff_passcode: newStaff.passcode,
      }]);

      if (error) throw error;
      
      toast.success(`${newStaff.role} Account Deployed!`);
      setIsAdding(false);
      fetchStaff(adminProfile.restaurant_id);
      setNewStaff({ fullName: "", role: "waiter", passcode: "" });
    } catch (e: any) {
      toast.error("Error creating staff account.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
      toast.success("Staff Identity Terminated.");
      if (adminProfile?.restaurant_id) fetchStaff(adminProfile.restaurant_id);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeleteConfirm(null);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 md:space-y-10 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest">
            <Users className="w-3 h-3" /> Staff Registry
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none italic">The <span className="text-slate-500">Crew</span></h2>
          <p className="text-slate-400 text-xs md:text-sm font-medium">Provision and manage your service and kitchen workforce.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <Button 
            variant="outline" 
            onClick={handleCopyLink}
            className="h-14 md:h-16 px-6 rounded-[20px] md:rounded-3xl border-white/10 hover:bg-white/5 font-black uppercase text-[10px] tracking-widest gap-2"
          >
            <Copy className="w-4 h-4" /> Copy Link
          </Button>
          <Button onClick={() => setIsAdding(true)} className="h-14 md:h-16 px-8 rounded-[20px] md:rounded-3xl gap-3 font-black uppercase tracking-tighter shadow-xl shadow-primary/20 text-white">
            <UserPlus className="w-5 h-5 md:w-6 md:h-6" /> Recruit Staff
          </Button>
        </div>
      </div>

      {isLoading && staff.length === 0 ? (
        <div className="flex justify-center py-40">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-700 animate-pulse">Scanning Bio-Data</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {staff.map((member) => (
            <Card key={member.id} className="bg-[#0b1120] border-white/5 rounded-[32px] md:rounded-[40px] overflow-hidden group hover:border-primary/30 transition-all shadow-2xl relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <CardContent className="p-6 md:p-10 space-y-8">
                <div className="flex justify-between items-start gap-4">
                  <div className={cn(
                    "p-5 md:p-6 rounded-[24px] md:rounded-[28px] border transition-all duration-500",
                    member.role === 'waiter' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]' : 'bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.1)]'
                  )}>
                    {member.role === 'waiter' ? <Smartphone className="w-6 h-6 md:w-8 md:h-8" /> : <ChefHat className="w-6 h-6 md:w-8 md:h-8" />}
                  </div>
                  <div className="text-right flex-1 min-w-0">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">{member.role} Assets</span>
                    <div className="flex items-center justify-end gap-2 mt-2">
                       <p className="text-[10px] md:text-xs text-white font-black uppercase tracking-tighter opacity-40">#{member.id.slice(6, 12)}</p>
                       <button onClick={() => {
                         navigator.clipboard.writeText(member.id.slice(6));
                         toast.success("Credential Identifier Copied");
                       }} className="p-1.5 rounded-lg bg-white/5 text-slate-700 hover:text-primary transition-colors"><Copy className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl md:text-3xl font-black text-white truncate uppercase tracking-tighter italic">{member.full_name}</h3>
                  <div className="flex items-center gap-2 text-emerald-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">
                    <ShieldCheck className="w-3.5 h-3.5" /> <span>Credential Synchronized</span>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/[0.03] flex gap-4">
                  <Button variant="outline" className="flex-1 rounded-xl md:rounded-2xl border-white/5 hover:bg-white/5 font-black uppercase text-[9px] md:text-[10px] tracking-widest h-12">Configuration</Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setDeleteConfirm(member.id)}
                    className="w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-xl md:rounded-2xl border-white/5 hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-90"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {staff.length === 0 && !isLoading && (
            <div className="col-span-full py-32 text-center space-y-6 border-2 border-dashed border-white/[0.03] rounded-[60px]">
              <div className="w-24 h-24 bg-white/5 rounded-[32px] flex items-center justify-center mx-auto border border-white/5 animate-pulse">
                <Users className="w-10 h-10 text-slate-800" />
              </div>
              <div className="space-y-2">
                <p className="text-slate-700 font-black uppercase tracking-[0.3em] text-[10px] md:text-sm">Personnel Registry Empty</p>
                <p className="text-slate-800 font-medium text-xs">No active staff digital identities found in this sector.</p>
              </div>
              <Button onClick={() => setIsAdding(true)} className="rounded-2xl h-12 px-8 font-black uppercase text-[10px] tracking-widest">Start Recruitment</Button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation - Mobile Optimized */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-6 bg-[#020617]/95 backdrop-blur-2xl">
             <Card className="w-full max-w-md p-8 md:p-12 bg-[#0b1120] border-red-500/20 rounded-[40px] md:rounded-[56px] text-center space-y-8 animate-in zoom-in-95 duration-500 shadow-2xl relative">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-red-500/10 rounded-[32px] flex items-center justify-center mx-auto text-red-500 border border-red-500/20">
                  <AlertTriangle className="w-10 h-10 md:w-12 md:h-12" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter italic leading-none">Deactivate <span className="text-red-500">Asset?</span></h3>
                  <p className="text-slate-600 text-[10px] md:text-sm font-medium leading-relaxed">This identity will be purged from the platform. Access will be revoked <span className="text-white">instantly</span>.</p>
                </div>
                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1 py-8 rounded-[28px] border-white/5 text-slate-500 uppercase font-black tracking-widest text-[10px]">Abort</Button>
                  <Button 
                    onClick={() => handleDeleteStaff(deleteConfirm)} 
                    className="flex-1 py-8 bg-red-500 text-white hover:bg-red-600 rounded-[28px] gap-2 font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-red-500/20"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-4 h-4" />} Purge
                  </Button>
                </div>
             </Card>
          </div>
        )}
      </AnimatePresence>

      {/* Recruitment Modal - Modern SaaS UX */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-6 bg-[#020617]/95 backdrop-blur-2xl overflow-y-auto py-12 custom-scrollbar">
             <Card className="w-full max-w-xl p-8 md:p-16 bg-[#0b1120] rounded-[48px] md:rounded-[64px] border-white/10 shadow-2xl space-y-10 md:space-y-16 animate-in zoom-in-95 duration-500 relative">
                <button onClick={() => setIsAdding(false)} className="absolute top-8 right-8 md:top-12 md:right-12 p-2 rounded-2xl bg-white/5 text-slate-700 hover:text-white transition-all"><X className="w-6 h-6 md:w-8 md:h-8" /></button>
                
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-[28px] md:rounded-[32px] flex items-center justify-center mx-auto mb-6 border border-primary/20 shadow-2xl shadow-primary/10">
                     <UserPlus className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                  </div>
                  <h3 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter italic leading-none">Personnel <span className="text-primary block mt-2">Expansion</span></h3>
                  <p className="text-slate-600 font-medium italic text-[10px] md:text-sm uppercase tracking-widest leading-relaxed">Initializing new digital identity parameters for the sector.</p>
                </div>

                <form onSubmit={handleAddStaff} className="space-y-6 md:space-y-8">
                  <div className="space-y-3">
                    <label className="text-[9px] md:text-[10px] font-black text-slate-700 uppercase tracking-widest ml-6">Legal Identification Name</label>
                    <input 
                      required 
                      value={newStaff.fullName} 
                      onChange={e => setNewStaff({...newStaff, fullName: e.target.value})}
                      placeholder="E.G. JOHNATHAN DOE" 
                      className="w-full bg-white/5 border border-white/10 rounded-[28px] md:rounded-[32px] px-8 py-5 md:py-7 text-white outline-none focus:border-primary/50 font-black text-base md:text-xl tracking-tighter placeholder:text-slate-900" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    <div className="space-y-3">
                      <label className="text-[9px] md:text-[10px] font-black text-slate-700 uppercase tracking-widest ml-6">Functional Role</label>
                      <div className="relative">
                        <select 
                          value={newStaff.role}
                          onChange={e => setNewStaff({...newStaff, role: e.target.value as any})}
                          className="w-full bg-white/5 border border-white/10 rounded-[28px] md:rounded-[32px] px-8 py-5 md:py-7 text-white outline-none focus:border-primary/50 font-black text-base md:text-lg appearance-none cursor-pointer uppercase tracking-widest"
                        >
                          <option value="waiter">Service Assets</option>
                          <option value="kitchen">Culinary Unit</option>
                        </select>
                        <ChefHat className="absolute right-8 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-800 pointer-events-none" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[9px] md:text-[10px] font-black text-slate-700 uppercase tracking-widest ml-6">Access Sequence (PIN)</label>
                      <input 
                        required 
                        type="password" 
                        maxLength={6}
                        value={newStaff.passcode}
                        onChange={e => setNewStaff({...newStaff, passcode: e.target.value})}
                        placeholder="••••••" 
                        className="w-full bg-white/5 border border-white/10 rounded-[28px] md:rounded-[32px] px-8 py-5 md:py-7 text-white outline-none focus:border-primary/50 font-black text-xl md:text-2xl tracking-[0.4em] placeholder:text-slate-900" 
                      />
                    </div>
                  </div>

                  <div className="pt-8 md:pt-12 flex gap-4 md:gap-6">
                    <Button variant="outline" type="button" onClick={() => setIsAdding(false)} className="flex-1 py-8 md:py-12 rounded-[32px] md:rounded-[40px] border-white/5 bg-white/5 text-slate-700 uppercase font-black tracking-[0.3em] text-[9px] md:text-[10px] hover:text-white transition-all">Abort</Button>
                    <Button type="submit" className="flex-[2] py-8 md:py-12 rounded-[32px] md:rounded-[40px] text-xl md:text-2xl font-black uppercase tracking-tighter text-white shadow-2xl shadow-primary/30 active:scale-95 transition-all">
                      {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Deploy Identity"}
                    </Button>
                  </div>
                </form>
             </Card>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
