"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
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
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.uid)
          .single();
        
        setAdminProfile(profile);
        if (profile?.restaurant_id) {
          fetchStaff(profile.restaurant_id);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  async function fetchStaff(restaurantId: string) {
    setIsLoading(true);
    const { data } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .neq("role", "owner")
      .neq("role", "super_admin");
    
    setStaff(data || []);
    setIsLoading(false);
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
      
      const { error } = await supabase.from("user_profiles").insert([{
        id: staffId,
        full_name: newStaff.fullName,
        role: newStaff.role,
        restaurant_id: adminProfile.restaurant_id,
        staff_passcode: newStaff.passcode, // SAVING THE PASSCODE HERE
      }]);

      if (error) throw error;
      
      toast.success(`${newStaff.role} Account Deployed!`);
      setIsAdding(false);
      fetchStaff(adminProfile.restaurant_id);
      setNewStaff({ fullName: "", role: "waiter", passcode: "" });
    } catch (e: any) {
      toast.error("Error: Make sure to run the SQL command to add 'staff_passcode' column in Supabase.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from("user_profiles").delete().eq("id", id);
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
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest">
            <Users className="w-3 h-3" /> Staff Registry
          </div>
          <h2 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">The <span className="text-slate-500">Crew</span></h2>
          <p className="text-slate-400 font-medium">Provision and manage your service and kitchen workforce.</p>
        </div>
        
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            onClick={handleCopyLink}
            className="h-16 px-6 rounded-3xl border-white/10 hover:bg-white/5 font-black uppercase text-[10px] tracking-widest gap-2"
          >
            <Copy className="w-4 h-4" /> Copy Staff Link
          </Button>
          <Button onClick={() => setIsAdding(true)} className="h-16 px-8 rounded-3xl gap-3 font-black uppercase tracking-tighter shadow-xl shadow-primary/20 text-black">
            <UserPlus className="w-6 h-6" /> Recruit Staff
          </Button>
        </div>
      </div>

      {isLoading && staff.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.map((member) => (
            <Card key={member.id} className="bg-slate-900/40 border-white/5 rounded-[40px] overflow-hidden group hover:border-primary/20 transition-all">
              <CardContent className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div className={`p-5 rounded-3xl border border-white/5 ${member.role === 'waiter' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-orange-500/10 text-orange-400'}`}>
                    {member.role === 'waiter' ? <Smartphone className="w-8 h-8" /> : <ChefHat className="w-8 h-8" />}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{member.role}</span>
                    <div className="flex items-center gap-2 mt-1">
                       <p className="text-xs text-white font-black uppercase tracking-tighter">ID: {member.id.slice(6)}</p>
                       <button onClick={() => {
                         navigator.clipboard.writeText(member.id.slice(6));
                         toast.success("Staff ID Copied");
                       }} className="text-slate-700 hover:text-primary"><Copy className="w-3 h-3" /></button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white truncate">{member.full_name}</h3>
                  <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest mt-2">
                    <Lock className="w-3 h-3" /> <span>Credential Active</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex gap-3">
                  <Button variant="outline" className="flex-1 rounded-2xl border-white/5 hover:bg-white/5 font-bold uppercase text-[10px] tracking-widest">Config</Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setDeleteConfirm(member.id)}
                    className="px-4 rounded-2xl border-white/5 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {staff.length === 0 && !isLoading && (
            <div className="col-span-full py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/5">
                <Users className="w-10 h-10 text-slate-700" />
              </div>
              <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No staff accounts provisioned yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#020617]/90 backdrop-blur-xl">
           <Card className="w-full max-w-md p-10 bg-slate-900 border-red-500/20 rounded-[40px] text-center space-y-6 animate-in zoom-in-95">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Dismiss Staff?</h3>
                <p className="text-slate-500 text-sm font-medium">This staff member will lose access to their dashboard immediately.</p>
              </div>
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-2xl border-white/5">Cancel</Button>
                <Button 
                  onClick={() => handleDeleteStaff(deleteConfirm)} 
                  className="flex-1 bg-red-500 text-white hover:bg-red-600 rounded-2xl gap-2"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />} Dismiss
                </Button>
              </div>
           </Card>
        </div>
      )}

      {/* Recruitment Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#020617]/90 backdrop-blur-xl">
           <Card className="w-full max-w-xl p-12 bg-slate-900 rounded-[48px] border-white/5 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                   <UserPlus className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-4xl font-black text-white uppercase tracking-tighter">Recruit <span className="text-primary">Staff</span></h3>
                <p className="text-slate-500 font-medium italic text-sm">Deploy a new digital identity for your team instantly.</p>
              </div>

              <form onSubmit={handleAddStaff} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Full Name</label>
                  <input 
                    required 
                    value={newStaff.fullName} 
                    onChange={e => setNewStaff({...newStaff, fullName: e.target.value})}
                    placeholder="E.g. John Doe" 
                    className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-5 text-white outline-none focus:border-primary/50 font-bold" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Role</label>
                    <select 
                      value={newStaff.role}
                      onChange={e => setNewStaff({...newStaff, role: e.target.value as any})}
                      className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-5 text-white outline-none focus:border-primary/50 font-bold appearance-none cursor-pointer"
                    >
                      <option value="waiter">Waiter</option>
                      <option value="kitchen">Kitchen Staff</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Staff Passcode</label>
                    <input 
                      required 
                      type="password" 
                      maxLength={6}
                      value={newStaff.passcode}
                      onChange={e => setNewStaff({...newStaff, passcode: e.target.value})}
                      placeholder="4-6 Digits" 
                      className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-5 text-white outline-none focus:border-primary/50 font-bold" 
                    />
                  </div>
                </div>

                <div className="pt-6 flex gap-4">
                  <Button variant="outline" type="button" onClick={() => setIsAdding(false)} className="flex-1 py-10 rounded-[32px] border-white/5 uppercase font-black tracking-widest text-[10px]">Cancel</Button>
                  <Button type="submit" className="flex-[2] py-10 rounded-[32px] text-xl font-black uppercase tracking-tighter text-black">
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Deploy Account"}
                  </Button>
                </div>
              </form>
           </Card>
        </div>
      )}
    </div>
  );
}
