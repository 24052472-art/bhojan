"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
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
  const channelRef = useRef<any>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        fetchInitialData(user.uid);
      }
    });

    return () => {
      unsubscribeAuth();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  async function fetchInitialData(uid: string) {
    setIsLoading(true);
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*, restaurants(*)")
        .eq("id", uid)
        .single();
      
      if (error) throw error;

      if (profile?.restaurants) {
        setRestaurant(profile.restaurants);
        fetchTables(profile.restaurants.id);
        fetchStaff(profile.restaurants.id);
        
        // Clean up existing channel if any
        if (channelRef.current) {
          await supabase.removeChannel(channelRef.current);
        }

        const channel = supabase
          .channel(`tables-live-${profile.restaurants.id}-${Date.now()}`)
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'tables',
            filter: `restaurant_id=eq.${profile.restaurants.id}`
          }, (payload) => {
            fetchTables(profile.restaurants.id);
          })
          .subscribe();

        channelRef.current = channel;
      } else {
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error("Initial data fetch error:", err);
      setIsLoading(false);
    }
  }

  const fetchTables = async (resId: string) => {
    try {
      const { data, error } = await supabase
        .from("tables")
        .select("*, profiles!assigned_waiter_id(full_name)")
        .eq("restaurant_id", resId)
        .order("table_number", { ascending: true });
      
      if (error) throw error;
      setTables(data || []);
    } catch (err: any) {
      console.error("Fetch tables error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetStatus = async (tableId: string) => {
    const { error } = await supabase
      .from("tables")
      .update({ status: 'available' })
      .eq("id", tableId);

    if (error) {
      toast.error("Failed to reset table.");
    } else {
      toast.success("Station Released!");
    }
  };

  async function fetchStaff(restaurantId: string) {
    const { data } = await supabase.from("profiles").select("*").eq("restaurant_id", restaurantId).eq("role", "waiter");
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

  const downloadQRCode = (id: string, fileName: string) => {
    const svg = document.getElementById(id);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${fileName}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
      toast.success(`${fileName} Kit Ready!`);
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="w-full space-y-6 md:space-y-10 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest">
            <QrCode className="w-3 h-3" /> Floor Map
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none italic">Seating <span className="text-slate-500">Zone</span></h2>
          <p className="text-slate-400 text-xs md:text-sm font-medium">Manage tables, capacities, and digital menu access.</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="h-14 md:h-16 px-6 md:px-8 rounded-[20px] md:rounded-3xl gap-3 font-black uppercase tracking-tighter shadow-xl shadow-primary/20 text-white">
          <Plus className="w-5 h-5 md:w-6 md:h-6" /> Add New Table
        </Button>
      </div>

      {/* Universal QR Gateway - Fluid Layout */}
      <Card className="bg-gradient-to-br from-fuchsia-600/10 to-transparent border-fuchsia-500/20 rounded-[32px] md:rounded-[48px] p-6 md:p-10 overflow-hidden relative group">
         <div className="absolute top-0 right-0 p-12 opacity-5 md:opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap className="w-40 h-40 text-fuchsia-500" />
         </div>
         <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 relative z-10">
            <div className="bg-white p-4 rounded-[28px] md:rounded-[40px] shadow-2xl shadow-fuchsia-500/20 shrink-0">
               <QRCodeSVG 
                  id="universal-qr"
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/scan/${restaurant?.slug || restaurant?.id}`} 
                  size={140}
                  className="md:w-[160px] md:h-[160px]"
                  level="H"
               />
            </div>
            <div className="flex-1 text-center md:text-left space-y-4 min-w-0">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/20 text-[8px] font-black text-fuchsia-400 uppercase tracking-[0.3em]">
                  Master Gateway
               </div>
               <h3 className="text-2xl md:text-4xl font-black text-white uppercase italic tracking-tighter">Universal <span className="text-fuchsia-500">QR Access</span></h3>
               <p className="text-slate-400 text-[10px] md:text-sm max-w-lg font-medium leading-relaxed">
                  Guests scan this to <span className="text-white">Choose Table</span> and <span className="text-white">Order Directly</span>. 
                  All self-service orders appear with a <span className="text-fuchsia-500">special badge</span>.
               </p>
               <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                  <Button 
                    onClick={() => downloadQRCode('universal-qr', 'Universal_QR_Kit')}
                    variant="outline" className="h-10 md:h-12 rounded-xl md:rounded-2xl border-fuchsia-500/30 text-fuchsia-400 hover:bg-fuchsia-500 hover:text-white font-black uppercase text-[8px] md:text-[10px] tracking-widest gap-2"
                  >
                     <Download className="w-4 h-4" /> Download Kit
                  </Button>
               </div>
            </div>
         </div>
      </Card>

      {/* Main Grid Content */}
      <div className="grid gap-6 md:gap-10 grid-cols-1 lg:grid-cols-3">
        {/* Tables Grid */}
        <div className="lg:col-span-2 grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {tables.map((table) => (
            <div 
              key={table.id} 
              className={`cursor-pointer group relative transition-all active:scale-[0.98] ${selectedTable?.id === table.id ? 'ring-2 ring-primary rounded-[32px] md:rounded-[40px]' : ''}`}
              onClick={() => setSelectedTable(table)}
            >
              <Card 
                className={`bg-slate-900/40 border-white/5 rounded-[32px] md:rounded-[40px] p-6 md:p-8 transition-all hover:border-primary/30 h-full`}
              >
                <div className="flex justify-between items-start mb-6 md:mb-8">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-[20px] md:rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center text-xl md:text-2xl font-black text-white">
                    {table.table_number}
                  </div>
                  <div className={`px-2 md:px-3 py-1 md:py-1.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border ${getStatusColor(table.status)}`}>
                    {table.status}
                  </div>
                </div>
                
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-center gap-3 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                    <User className="w-3.5 h-3.5 text-primary/50" />
                    <span className="truncate">{table.waiter_id ? "Assigned" : "Unassigned"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                    <Users className="w-3.5 h-3.5 text-primary/50" />
                    <span>{table.capacity} Guests</span>
                  </div>
                </div>

                <div className="mt-6 md:mt-8 flex gap-2 md:gap-3 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResetStatus(table.id);
                    }}
                    variant="outline" 
                    className="flex-1 rounded-xl md:rounded-2xl border-white/10 bg-white/5 text-slate-400 text-[8px] font-black uppercase tracking-widest h-10 md:h-12 hover:bg-white/10 hover:text-white"
                  >
                    Reset
                  </Button>
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(table.id);
                    }}
                    variant="outline" 
                    className="flex-1 rounded-xl md:rounded-2xl border-red-500/20 bg-red-500/5 text-red-500 text-[8px] font-black uppercase tracking-widest h-10 md:h-12 hover:bg-red-500 hover:text-white"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                  </Button>
                </div>
              </Card>
            </div>
          ))}
          
          {tables.length === 0 && (
             <div className="col-span-full py-16 text-center border-2 border-dashed border-white/5 rounded-[32px] md:rounded-[48px] space-y-4">
                <p className="text-slate-600 font-black uppercase tracking-widest text-[10px]">Floor map is empty.</p>
                <Button variant="outline" onClick={() => setIsAdding(true)} className="rounded-xl h-10 px-6 font-black uppercase text-[10px] tracking-widest">Create First Table</Button>
             </div>
          )}
        </div>

        {/* Side Panel Details - Drawer for mobile, sidebar for desktop */}
        <div className={cn(
          "lg:block",
          selectedTable ? "fixed inset-x-0 bottom-0 z-[110] lg:static lg:z-0 lg:block" : "hidden lg:block"
        )}>
          {selectedTable && (
            <div className="lg:hidden fixed inset-0 bg-[#020617]/80 backdrop-blur-sm z-[109]" onClick={() => setSelectedTable(null)} />
          )}
          
          <Card className={cn(
            "bg-[#0b1120] border-white/5 lg:rounded-[48px] lg:sticky lg:top-24 overflow-hidden shadow-2xl transition-all duration-500 min-h-[400px]",
            selectedTable ? "rounded-t-[32px] translate-y-0" : "translate-y-full lg:translate-y-0"
          )}>
            {selectedTable ? (
              <>
                <CardHeader className="p-6 md:p-10 pb-0 flex flex-row items-center justify-between space-y-0">
                  <div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Identity</p>
                    <CardTitle className="text-2xl md:text-3xl font-black text-white uppercase italic">Table {selectedTable.table_number}</CardTitle>
                  </div>
                  <Button variant="ghost" className="w-10 h-10 rounded-full hover:bg-white/5 text-slate-500" onClick={() => setSelectedTable(null)}>
                     <X className="w-5 h-5" />
                  </Button>
                </CardHeader>
                <CardContent className="p-6 md:p-10 space-y-8 md:space-y-10">
                  <div className="flex flex-col items-center justify-center p-6 md:p-10 bg-white/5 rounded-[28px] md:rounded-[40px] border border-white/5 relative group/qr">
                    <div className="bg-white p-4 md:p-5 rounded-[24px] md:rounded-[32px] shadow-2xl transition-transform group-hover/qr:scale-105 duration-500">
                      <QRCodeSVG 
                        id={`table-qr-${selectedTable.table_number}`}
                        value={`${window.location.origin}/menu/${restaurant?.slug}/${selectedTable.table_number}`} 
                        size={160}
                        className="md:w-[180px] md:h-[180px]"
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                    <p className="mt-4 md:mt-6 text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] text-center truncate w-full px-4">
                      Digital gateway Ready
                    </p>
                    <Button 
                      onClick={() => downloadQRCode(`table-qr-${selectedTable.table_number}`, `Table_${selectedTable.table_number}_QR`)}
                      variant="outline" className="mt-6 md:mt-8 gap-3 w-full h-12 md:h-14 rounded-xl md:rounded-2xl border-white/5 hover:bg-primary hover:text-white font-black uppercase text-[10px] tracking-widest"
                    >
                      <Download className="w-4 h-4 md:w-5 md:h-5" /> Download QR Kit
                    </Button>
                  </div>

                  <div className="space-y-4 md:space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Status</span>
                      <span className={`px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border ${getStatusColor(selectedTable.status)}`}>
                        {selectedTable.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Seating Capacity</span>
                      <span className="text-xs md:text-sm font-black text-white">{selectedTable.capacity} People</span>
                    </div>
                  </div>

                  <div className="pt-6 md:pt-10 border-t border-white/5 grid grid-cols-2 gap-3 md:gap-4 pb-4 md:pb-0">
                    <Button 
                      variant="outline" 
                      onClick={() => handleDelete(selectedTable.id)}
                      className="h-12 md:h-14 rounded-xl md:rounded-2xl border-white/5 text-red-500 hover:bg-red-500/10 font-black uppercase text-[10px] tracking-widest gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Purge
                    </Button>
                    <Button className="h-12 md:h-14 rounded-xl md:rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 text-white">
                      <Edit2 className="w-4 h-4" /> Edit
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <div className="h-[500px] lg:h-[600px] flex flex-col items-center justify-center text-center p-8 md:p-12 space-y-6">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-[28px] md:rounded-[32px] bg-white/5 flex items-center justify-center relative">
                  <QrCode className="w-8 h-8 md:w-10 md:h-10 text-slate-800" />
                  <div className="absolute inset-0 bg-primary/5 blur-xl -z-10 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-black text-xl md:text-2xl text-white uppercase tracking-tighter leading-tight">Empty <br className="hidden md:block" /> Station</h3>
                  <p className="text-[10px] md:text-sm text-slate-500 font-medium max-w-[180px] mx-auto">Select a table from the floor map to generate its digital gateway.</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Add Table Modal - Fully Responsive */}
      {isAdding && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 bg-[#020617]/90 backdrop-blur-xl animate-in fade-in duration-300">
           <Card className="w-full max-w-lg p-6 md:p-12 bg-[#0b1120] rounded-[32px] md:rounded-[48px] border-white/5 shadow-2xl space-y-8 md:space-y-10 animate-in zoom-in-95 duration-500 relative">
              <button onClick={() => setIsAdding(false)} className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center space-y-2">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20 text-primary">
                   <Plus className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">Expand <span className="text-primary">Floor</span></h3>
                <p className="text-slate-500 font-medium italic text-[10px] md:text-sm">Add a new seating zone to your restaurant.</p>
              </div>

              <form onSubmit={handleAddTable} className="space-y-4 md:space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 md:ml-6">Table Identity (e.g. T-01)</label>
                  <input 
                    required 
                    value={newTable.number} 
                    onChange={e => setNewTable({...newTable, number: e.target.value})}
                    placeholder="T-00" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl px-6 md:px-8 py-4 md:py-6 text-white outline-none focus:border-primary/50 font-black text-lg md:text-xl placeholder:text-slate-800" 
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 md:ml-6">Guest Capacity</label>
                  <input 
                    required 
                    type="number"
                    value={newTable.capacity || ""}
                    onChange={e => setNewTable({...newTable, capacity: e.target.value === "" ? 0 : parseInt(e.target.value)})}
                    placeholder="4" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl px-6 md:px-8 py-4 md:py-6 text-white outline-none focus:border-primary/50 font-black text-lg md:text-xl placeholder:text-slate-800" 
                  />
                </div>

                <div className="pt-4 md:pt-6 flex gap-3 md:gap-4">
                  <Button variant="outline" type="button" onClick={() => setIsAdding(false)} className="flex-1 py-6 md:py-10 rounded-2xl md:rounded-[32px] border-white/5 bg-white/5 text-slate-500 uppercase font-black tracking-widest text-[8px] md:text-[10px]">Cancel</Button>
                  <Button type="submit" className="flex-[2] py-6 md:py-10 rounded-2xl md:rounded-[32px] text-lg md:text-xl font-black uppercase tracking-tighter text-white">
                    {isLoading ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" /> : "Deploy Table"}
                  </Button>
                </div>
              </form>
           </Card>
        </div>
      )}
    </div>
  );
}
