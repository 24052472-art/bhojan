"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { 
  Plus, 
  Search, 
  Users, 
  UtensilsCrossed, 
  ExternalLink, 
  Settings,
  Trash2,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";

export default function SuperAdminRestaurants() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchRestaurants();
  }, []);

  async function fetchRestaurants() {
    setIsLoading(true);
    const { data } = await supabase
      .from("restaurants")
      .select(`
        *,
        user_profiles (count),
        menu_items (count)
      `);
    setRestaurants(data || []);
    setIsLoading(false);
  }

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      // Step 1: Clean all dependencies manually (Manual Cascade)
      await supabase.from("order_items").delete().filter("order_id", "in", 
        supabase.from("orders").select("id").eq("restaurant_id", id)
      );
      await supabase.from("orders").delete().eq("restaurant_id", id);
      await supabase.from("menu_items").delete().eq("restaurant_id", id);
      await supabase.from("tables").delete().eq("restaurant_id", id);
      await supabase.from("user_profiles").delete().eq("restaurant_id", id);
      
      // Step 2: Delete the actual restaurant
      const { error } = await supabase.from("restaurants").delete().eq("id", id);
      if (error) throw error;

      toast.success("Restaurant & Dependencies Purged.");
      fetchRestaurants();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeleteConfirm(null);
      setIsLoading(false);
    }
  };

  const filtered = restaurants.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-20">
      <Card className="bg-slate-900/40 border-white/5 rounded-[48px] p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 blur-[100px] -z-10" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[32px] bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xl shadow-primary/20">
              <UtensilsCrossed className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-none">Marketplace</h1>
              <p className="text-slate-500 font-bold text-xs tracking-widest uppercase">Managing {restaurants.length} total environments.</p>
            </div>
          </div>
          <Button className="h-16 px-10 rounded-3xl bg-white text-black font-black uppercase tracking-tighter gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5">
            <Plus className="w-6 h-6" /> Onboard Tenant
          </Button>
        </div>
      </Card>

      <div className="relative max-w-2xl mx-auto group">
        <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
        <input 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for a restaurant or slug..."
          className="w-full bg-slate-900/40 border border-white/5 rounded-[32px] pl-20 pr-8 py-6 text-white font-bold outline-none focus:border-primary/30 transition-all text-lg"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((res) => (
          <Card key={res.id} className="bg-[#0b1120] border-white/5 rounded-[48px] overflow-hidden group hover:border-primary/20 transition-all duration-500 relative">
             <CardContent className="p-10 space-y-8">
                <div className="flex justify-between items-start">
                   <div className="w-16 h-16 rounded-[24px] bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors">
                      <UtensilsCrossed className="w-8 h-8" />
                   </div>
                   <div className="flex flex-col items-end gap-2">
                     <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                       <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" /> Live
                     </span>
                     <button 
                       onClick={() => setDeleteConfirm(res.id)}
                       className="p-2 text-slate-700 hover:text-red-500 transition-colors"
                     >
                       <Trash2 className="w-5 h-5" />
                     </button>
                   </div>
                </div>

                <div>
                   <h3 className="text-3xl font-black text-white tracking-tighter truncate">{res.name}</h3>
                   <p className="text-xs font-bold text-slate-600 tracking-widest uppercase mt-1">bhojan.app/{res.slug}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-1">
                      <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Users</p>
                      <div className="flex items-center gap-2">
                         <Users className="w-4 h-4 text-slate-500" />
                         <span className="text-xl font-black text-white">{res.user_profiles?.[0]?.count || 0}</span>
                      </div>
                   </div>
                   <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-1">
                      <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Dishes</p>
                      <div className="flex items-center gap-2">
                         <UtensilsCrossed className="w-4 h-4 text-slate-500" />
                         <span className="text-xl font-black text-white">{res.menu_items?.[0]?.count || 0}</span>
                      </div>
                   </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex gap-3">
                   <Button variant="outline" className="flex-1 h-14 rounded-2xl border-white/5 hover:bg-white/5 font-black uppercase text-[10px] tracking-widest gap-2">
                     <Settings className="w-4 h-4" /> Config
                   </Button>
                   <Button variant="outline" className="w-14 h-14 rounded-2xl border-white/5 hover:bg-primary hover:text-black hover:border-primary transition-all">
                      <ExternalLink className="w-5 h-5" />
                   </Button>
                </div>
             </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#020617]/90 backdrop-blur-xl">
           <Card className="w-full max-w-md p-10 bg-slate-900 border-red-500/20 rounded-[40px] text-center space-y-6 animate-in zoom-in-95">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Confirm Purge?</h3>
                <p className="text-slate-500 text-sm font-medium">This will manually delete all users, menu items, and tables linked to this restaurant. This cannot be undone.</p>
              </div>
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-2xl border-white/5">Cancel</Button>
                <Button 
                  onClick={() => handleDelete(deleteConfirm)} 
                  className="flex-1 bg-red-500 text-white hover:bg-red-600 rounded-2xl gap-2"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />} Delete Everything
                </Button>
              </div>
           </Card>
        </div>
      )}
    </div>
  );
}
