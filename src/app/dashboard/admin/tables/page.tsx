"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  Plus, 
  QrCode, 
  User, 
  Users, 
  Trash2, 
  Settings2, 
  Download, 
  Edit2,
  Loader2,
  CheckCircle2,
  Zap,
  X
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { createClient } from "@/lib/supabase/client";
import { auth as firebaseAuth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-hot-toast";

export default function TableManagement() {
  const [tables, setTables] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [staff, setStaff] = useState<any[]>([]);

  const [newTable, setNewTable] = useState({
    number: "",
    capacity: 4
  });

  const supabase = createClient();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        fetchInitialData(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  async function fetchInitialData(uid: string) {
    setIsLoading(true);
    // 1. Get Profile & Restaurant
    const { data: profile } = await supabase.from("user_profiles").select("*, restaurants(*)").eq("id", uid).single();
    if (profile?.restaurants) {
      setRestaurant(profile.restaurants);
      fetchTables(profile.restaurants.id);
      fetchStaff(profile.restaurants.id);
    }
  }

  async function fetchTables(restaurantId: string) {
    const { data } = await supabase.from("tables").select("*").eq("restaurant_id", restaurantId).order("table_number", { ascending: true });
    setTables(data || []);
    setIsLoading(false);
  }

  async function fetchStaff(restaurantId: string) {
    const { data } = await supabase.from("user_profiles").select("*").eq("restaurant_id", restaurantId).eq("role", "waiter");
    setStaff(data || []);
  }

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from("tables").insert([{
        restaurant_id: restaurant.id,
        table_number: newTable.number,
        capacity: newTable.capacity,
        status: 'available'
      }]);
      if (error) throw error;
      toast.success(`Table ${newTable.number} Added!`);
      setIsAdding(false);
      fetchTables(restaurant.id);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this table? This will disrupt any active orders.")) return;
    try {
      const { error } = await supabase.from("tables").delete().eq("id", id);
      if (error) throw error;
      toast.success("Table Purged.");
      setSelectedTable(null);
      fetchTables(restaurant.id);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "occupied": return "bg-primary/10 text-primary border-primary/20";
      case "reserved": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      default: return "bg-slate-500/10 text-slate-400 border-white/5";
    }
  };

  if (isLoading && tables.length === 0) return (
    <div className="flex justify-center py-40">
       <Loader2 className="w-12 h-12 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest">
            <QrCode className="w-3 h-3" /> Floor Map
          </div>
          <h2 className="text-5xl font-black text-white tracking-tighter uppercase leading-none italic">Seating <span className="text-slate-500">Zone</span></h2>
          <p className="text-slate-400 font-medium">Manage tables, capacities, and digital menu access.</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="h-16 px-8 rounded-3xl gap-3 font-black uppercase tracking-tighter shadow-xl shadow-primary/20 text-black">
          <Plus className="w-6 h-6" /> Add New Table
        </Button>
      </div>

      {/* Universal QR Gateway */}
      <Card className="bg-gradient-to-br from-fuchsia-600/10 to-transparent border-fuchsia-500/20 rounded-[48px] p-10 overflow-hidden relative group">
         <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap className="w-40 h-40 text-fuchsia-500" />
         </div>
         <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
            <div className="bg-white p-6 rounded-[40px] shadow-2xl shadow-fuchsia-500/20">
               <QRCodeSVG 
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/scan/${restaurant?.slug || restaurant?.id}`} 
                  size={160}
                  level="H"
               />
            </div>
            <div className="flex-1 text-center md:text-left space-y-4">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/20 text-[8px] font-black text-fuchsia-400 uppercase tracking-[0.3em]">
                  Master Gateway
               </div>
               <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">Universal <span className="text-fuchsia-500">QR Access</span></h3>
               <p className="text-slate-400 text-sm max-w-lg font-medium leading-relaxed">
                  Keep this QR on your tables or entrance. Guests can scan this to <span className="text-white">Choose their Table</span>, <span className="text-white">Enter Details</span>, and <span className="text-white">Order Directly</span>. 
                  All self-service orders will appear in your feed with a special fuchsia badge.
               </p>
               <div className="flex flex-wrap gap-4 pt-2">
                  <Button variant="outline" className="h-12 rounded-2xl border-fuchsia-500/30 text-fuchsia-400 hover:bg-fuchsia-500 hover:text-black font-black uppercase text-[10px] tracking-widest gap-2">
                     <Download className="w-4 h-4" /> Download Master Kit
                  </Button>
                  <Button variant="outline" className="h-12 rounded-2xl border-white/10 bg-white/5 text-slate-400 hover:text-white font-black uppercase text-[10px] tracking-widest gap-2">
                     <Edit2 className="w-4 h-4" /> Customize Flow
                  </Button>
               </div>
            </div>
         </div>
      </Card>

      <div className="grid gap-10 lg:grid-cols-3">
        {/* Tables Grid */}
        <div className="lg:col-span-2 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {tables.map((table) => (
            <div 
              key={table.id} 
              className={`cursor-pointer group relative transition-all active:scale-[0.98] ${selectedTable?.id === table.id ? 'ring-2 ring-primary rounded-[40px]' : ''}`}
              onClick={() => setSelectedTable(table)}
            >
              <Card 
                className={`bg-slate-900/40 border-white/5 rounded-[40px] p-8 transition-all hover:border-primary/30 h-full`}
              >
                <div className="flex justify-between items-start mb-8">
                  <div className="w-16 h-16 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center text-2xl font-black text-white">
                    {table.table_number}
                  </div>
                  <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(table.status)}`}>
                    {table.status}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-slate-500 font-bold text-xs uppercase tracking-widest">
                    <User className="w-4 h-4 text-primary/50" />
                    <span>{table.waiter_id ? "Assigned" : "Unassigned"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 font-bold text-xs uppercase tracking-widest">
                    <Users className="w-4 h-4 text-primary/50" />
                    <span>{table.capacity} Guests</span>
                  </div>
                </div>

                <div className="mt-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                  <Button variant="outline" className="flex-1 rounded-2xl border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-widest h-12">Assign</Button>
                  <Button variant="outline" className="w-12 h-12 rounded-2xl border-white/5 bg-white/5 flex items-center justify-center"><Settings2 className="w-4 h-4" /></Button>
                </div>
              </Card>
            </div>
          ))}
          
          {tables.length === 0 && (
             <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[48px] space-y-4">
                <p className="text-slate-600 font-black uppercase tracking-widest text-xs">Floor map is empty.</p>
                <Button variant="outline" onClick={() => setIsAdding(true)} className="rounded-2xl">Create First Table</Button>
             </div>
          )}
        </div>

        {/* Side Panel Details */}
        <div>
          <Card className="sticky top-24 bg-[#0b1120] border-white/5 rounded-[48px] overflow-hidden">
            {selectedTable ? (
              <>
                <CardHeader className="p-10 pb-0 flex flex-row items-center justify-between space-y-0">
                  <div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Identity</p>
                    <CardTitle className="text-3xl font-black text-white uppercase italic">Table {selectedTable.table_number}</CardTitle>
                  </div>
                  <Button variant="ghost" className="w-10 h-10 rounded-full hover:bg-white/5" onClick={() => setSelectedTable(null)}>
                     <X className="w-5 h-5" />
                  </Button>
                </CardHeader>
                <CardContent className="p-10 space-y-10">
                  <div className="flex flex-col items-center justify-center p-10 bg-white/5 rounded-[40px] border border-white/5 relative group/qr">
                    <div className="bg-white p-5 rounded-[32px] shadow-2xl transition-transform group-hover/qr:scale-105 duration-500">
                      <QRCodeSVG 
                        value={`${window.location.origin}/menu/${restaurant?.slug}/${selectedTable.table_number}`} 
                        size={180}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                    <p className="mt-6 text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] text-center">
                      Digital Menu Link
                    </p>
                    <Button variant="outline" className="mt-8 gap-3 w-full h-14 rounded-2xl border-white/5 hover:bg-primary hover:text-black font-black uppercase text-[10px] tracking-widest">
                      <Download className="w-5 h-5" /> Download QR Kit
                    </Button>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Status</span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(selectedTable.status)}`}>
                        {selectedTable.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Seating Capacity</span>
                      <span className="text-sm font-black text-white">{selectedTable.capacity} People</span>
                    </div>
                  </div>

                  <div className="pt-10 border-t border-white/5 grid grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => handleDelete(selectedTable.id)}
                      className="h-14 rounded-2xl border-white/5 text-red-500 hover:bg-red-500/10 font-black uppercase text-[10px] tracking-widest gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Purge
                    </Button>
                    <Button className="h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 text-black">
                      <Edit2 className="w-4 h-4" /> Edit Details
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <div className="h-[600px] flex flex-col items-center justify-center text-center p-12 space-y-6">
                <div className="w-24 h-24 rounded-[32px] bg-white/5 flex items-center justify-center relative">
                  <QrCode className="w-10 h-10 text-slate-800" />
                  <div className="absolute inset-0 bg-primary/5 blur-xl -z-10 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-black text-2xl text-white uppercase tracking-tighter">Empty Station</h3>
                  <p className="text-sm text-slate-500 font-medium max-w-[200px] mx-auto">Select a table from the floor map to generate its digital gateway.</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Add Table Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#020617]/90 backdrop-blur-xl">
           <Card className="w-full max-w-lg p-12 bg-slate-900 rounded-[48px] border-white/5 shadow-2xl space-y-10 animate-in zoom-in-95">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20 text-primary">
                   <Plus className="w-8 h-8" />
                </div>
                <h3 className="text-4xl font-black text-white uppercase tracking-tighter">Expand <span className="text-primary">Floor</span></h3>
                <p className="text-slate-500 font-medium italic text-sm">Add a new seating zone to your restaurant.</p>
              </div>

              <form onSubmit={handleAddTable} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-6">Table Identity (e.g. T-01)</label>
                  <input 
                    required 
                    value={newTable.number} 
                    onChange={e => setNewTable({...newTable, number: e.target.value})}
                    placeholder="T-00" 
                    className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-6 text-white outline-none focus:border-primary/50 font-black text-xl" 
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-6">Guest Capacity</label>
                  <input 
                    required 
                    type="number"
                    value={newTable.capacity || ""}
                    onChange={e => setNewTable({...newTable, capacity: e.target.value === "" ? 0 : parseInt(e.target.value)})}
                    placeholder="4" 
                    className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-6 text-white outline-none focus:border-primary/50 font-black text-xl" 
                  />
                </div>

                <div className="pt-6 flex gap-4">
                  <Button variant="outline" type="button" onClick={() => setIsAdding(false)} className="flex-1 py-10 rounded-[32px] border-white/5 uppercase font-black tracking-widest text-[10px]">Cancel</Button>
                  <Button type="submit" className="flex-[2] py-10 rounded-[32px] text-xl font-black uppercase tracking-tighter text-black">
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Deploy Table"}
                  </Button>
                </div>
              </form>
           </Card>
        </div>
      )}
    </div>
  );
}
