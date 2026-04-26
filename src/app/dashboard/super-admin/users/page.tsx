"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { 
  User, 
  Search, 
  Trash2, 
  Building2, 
  Calendar, 
  MoreVertical, 
  Loader2,
  AlertCircle,
  Mail,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";

export default function SuperAdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setIsLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select(`
        *,
        restaurants (name)
      `)
      .order("created_at", { ascending: false });
    setUsers(data || []);
    setIsLoading(false);
  }

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
      toast.success("User Access Revoked.");
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeleteConfirm(null);
      setIsLoading(false);
    }
  };

  const filtered = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest">
           <ShieldCheck className="w-3 h-3" /> Identity Control
        </div>
        <h2 className="text-6xl font-black text-white tracking-tighter uppercase leading-none italic">User <span className="text-slate-500">Access</span></h2>
        <p className="text-slate-400 font-medium">Manage global identities across the platform.</p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-xl group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
        <input 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by name, role or restaurant..."
          className="w-full bg-slate-900/40 border border-white/5 rounded-3xl pl-16 pr-6 py-5 text-white font-bold outline-none focus:border-primary/50 transition-all"
        />
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : (
          filtered.map((user) => (
            <Card key={user.id} className="bg-slate-900/40 border-white/5 rounded-[32px] overflow-hidden group hover:bg-slate-900 transition-all border-l-4 border-l-transparent hover:border-l-primary">
              <CardContent className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{user.full_name || "Anonymous"}</h3>
                      {user.role === 'super_admin' && (
                        <span className="px-2 py-0.5 rounded-md bg-primary text-black text-[8px] font-black uppercase tracking-widest">System Admin</span>
                      )}
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-black uppercase tracking-widest">Active</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                       <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                         <Building2 className="w-3 h-3" /> {user.role}
                       </span>
                       <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                         # {user.id.slice(0, 8)}
                       </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-10">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Assigned To</p>
                      <p className={`font-bold ${user.restaurants?.name ? 'text-primary' : 'text-slate-500'}`}>
                        {user.restaurants?.name || (user.role === 'super_admin' ? "Platform Command" : "Not Linked")}
                      </p>
                   </div>
                   
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Account Created</p>
                      <div className="flex items-center gap-2 text-white font-bold">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span>{new Date(user.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                      </div>
                   </div>

                   <button 
                     onClick={() => setDeleteConfirm(user.id)}
                     className="p-4 bg-red-500/5 border border-white/5 rounded-2xl text-slate-700 hover:text-red-500 hover:border-red-500/20 transition-all"
                   >
                     <Trash2 className="w-5 h-5" />
                   </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#020617]/90 backdrop-blur-xl">
           <Card className="w-full max-w-md p-12 bg-slate-900 border-red-500/20 rounded-[48px] text-center space-y-8 animate-in zoom-in-95">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
                <AlertCircle className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Revoke Access?</h3>
                <p className="text-slate-500 text-sm font-medium">You are about to permanently delete this user profile. They will immediately lose access to their dashboard.</p>
              </div>
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1 py-6 rounded-2xl border-white/5">Cancel</Button>
                <Button 
                  onClick={() => handleDelete(deleteConfirm)} 
                  className="flex-1 py-6 bg-red-500 text-white hover:bg-red-600 rounded-2xl"
                >
                   {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Delete User"}
                </Button>
              </div>
           </Card>
        </div>
      )}
    </div>
  );
}
