"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Utensils,
  Bell,
  RefreshCcw,
  Loader2,
  Table2,
  Flame,
  Timer,
  History,
  User,
  HistoryIcon,
  Smartphone
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { auth as firebaseAuth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-hot-toast";

export default function KitchenDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [staffMap, setStaffMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [view, setView] = useState<'active' | 'completed'>('active');

  const supabase = createClient();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    const staffSessionStr = localStorage.getItem("staff_session");
    if (staffSessionStr) {
      const staff = JSON.parse(staffSessionStr);
      setProfile(staff);
      fetchInitialData(staff.restaurant_id);
      setupRealtime(staff.restaurant_id);
    } else {
      const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
        if (user) getProfile(user.uid);
      });
      return () => unsubscribe();
    }

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [view]);

  async function getProfile(uid: string) {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
    setProfile(data);
    if (data?.restaurant_id) {
      fetchInitialData(data.restaurant_id);
      setupRealtime(data.restaurant_id);
    }
  }

  async function fetchInitialData(resId: string) {
    setIsLoading(true);
    await fetchStaff(resId);
    await fetchLiveOrders(resId);
    setIsLoading(false);
  }

  async function fetchStaff(resId: string) {
    const { data } = await supabase.from("profiles").select("id, full_name").eq("restaurant_id", resId);
    if (data) {
      const map: Record<string, string> = {};
      data.forEach(s => map[s.id] = s.full_name);
      setStaffMap(map);
    }
  }

  async function fetchLiveOrders(restaurantId: string) {
    const statusFilter = view === 'active' ? ["pending", "preparing"] : ["ready", "completed"];

    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        tables (table_number),
        order_items (
          *,
          menu_items (name)
        )
      `)
      .eq("restaurant_id", restaurantId)
      .in("status", statusFilter)
      .order("created_at", { ascending: view === 'active' });

    if (error) {
      console.error("KDS ERROR:", error);
    } else {
      setOrders(data || []);
    }
  }

  async function setupRealtime(restaurantId: string) {
    if (!restaurantId) return;

    if (channelRef.current && channelRef.current.topic === `realtime:bhojan-sync-${restaurantId}`) {
      if (channelRef.current.state === 'joined') return;
    }

    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    const channelName = `bhojan-sync-${restaurantId}`;
    console.log(`KITCHEN: Initializing Sync Channel: ${channelName}`);
    
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: true }, // Removed ack for lower latency
      },
    });

    channel
      .on('broadcast', { event: 'refresh_kitchen' }, (payload) => {
        console.log("KITCHEN: Instant Refresh Triggered", payload);
        fetchLiveOrders(restaurantId);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload: any) => {
        console.log("KITCHEN: New Order Detected via DB", payload);
        fetchLiveOrders(restaurantId);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload: any) => {
        console.log("KITCHEN: Order Update Detected via DB", payload);
        fetchLiveOrders(restaurantId);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => {
        fetchLiveOrders(restaurantId);
      })
      .subscribe((status, err) => {
        console.log(`KITCHEN REALTIME STATUS: ${status}`, err || '');
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setTimeout(() => setupRealtime(restaurantId), 3000);
        }
      });
      
    channelRef.current = channel;
  }

  const updateStatus = async (orderId: string, newStatus: string, tableNum?: string) => {
    console.log("KITCHEN: Action Initiated", { orderId, newStatus, tableNum });
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    if (error) {
      console.error("KITCHEN: Transmission Failed", error);
      toast.error("Transmission Error");
    } else {
      const broadcastType = newStatus === 'preparing' ? 'PREPARING' : 'COOKED';
      toast.success(newStatus === 'preparing' ? "Production Initiated" : "Extraction Ready");
      
      // Broadcast to Waiter
      if (channelRef.current) {
        console.log("KITCHEN: Broadcasting Signal To Waiters & Customers...", { broadcastType, tableNum });
        channelRef.current.send({
          type: 'broadcast',
          event: 'refresh_waiter',
          payload: { 
            type: broadcastType, 
            tableNum: tableNum || '??' 
          }
        });

        // Broadcast specifically for the customer tracking this order
        channelRef.current.send({
          type: 'broadcast',
          event: 'refresh_customer',
          payload: { 
            type: broadcastType, 
            orderId: orderId 
          }
        });
      }

      if (profile?.restaurant_id) fetchLiveOrders(profile.restaurant_id);
    }
  };

  if (isLoading && orders.length === 0) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em]">Synchronizing Production Queue</p>
    </div>
  );

  return (
    <div className="w-full space-y-6 md:space-y-10 pb-20 relative">
      {/* Optimized Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-white/[0.03] pb-8 gap-6">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-[0.3em]">
            <ChefHat className="w-3 h-3" /> Station Control
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
            {view === 'active' ? 'Production' : 'History'} <span className="text-slate-500">{view === 'active' ? 'Matrix' : 'Log'}</span>
          </h1>
          <div className="text-slate-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 italic">
            <div className={cn("w-2 h-2 rounded-full", view === 'active' ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-700')} />
            {view === 'active' ? 'Live Stream Protocol Active' : 'Accessing Archive Segments'}
          </div>
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto overflow-x-auto no-scrollbar shrink-0">
          <div className="flex bg-white/5 p-1.5 rounded-[20px] md:rounded-3xl border border-white/10 shadow-2xl shrink-0">
            {['active', 'completed'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v as any)}
                className={cn(
                  "px-6 md:px-8 py-3 rounded-[15px] md:rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
                  view === v ? 'bg-primary text-black shadow-xl' : 'text-slate-600 hover:text-white'
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <Button variant="outline" onClick={() => profile?.restaurant_id && fetchInitialData(profile.restaurant_id)} className="h-14 w-14 md:h-16 md:w-16 rounded-[20px] md:rounded-3xl border-white/10 shrink-0 hover:bg-white/5">
            <RefreshCcw className="w-5 h-5 md:w-6 md:h-6" />
          </Button>
        </div>
      </div>

      {/* Grid with better break points */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-8">
        {orders.map((order) => {
          const timeElapsed = Math.floor((new Date().getTime() - new Date(order.created_at).getTime()) / 60000);

          return (
            <Card key={order.id} className={cn(
              "bg-[#0b1120] border-2 rounded-[32px] md:rounded-[48px] overflow-hidden group transition-all duration-500 shadow-2xl relative",
              order.status === 'preparing' ? 'border-orange-500/20' : 'border-white/[0.03]'
            )}>
              <div className="p-6 md:p-10 space-y-8">
                {/* Compact Header */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={cn(
                      "w-16 h-16 md:w-20 md:h-20 rounded-[24px] md:rounded-[32px] flex flex-col items-center justify-center font-black italic shadow-2xl shrink-0 transition-all duration-500",
                      order.status === 'preparing' ? 'bg-orange-500 text-black scale-105' : 'bg-white/5 text-white border border-white/10'
                    )}>
                      <span className="text-[8px] md:text-[10px] opacity-40 leading-none mb-1">STATION</span>
                      <span className="text-3xl md:text-4xl leading-none tracking-tighter">{order.tables?.table_number || '!!'}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tighter truncate leading-none mb-1.5 group-hover:text-primary transition-colors">{order.customer_name || "GUEST ASSET"}</p>
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-slate-700" />
                        <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest truncate italic">Server: {staffMap[order.waiter_id] || "Service Protocol"}</p>
                      </div>
                    </div>
                  </div>
                  <div className={cn(
                    "px-4 py-3 rounded-[20px] flex items-center gap-2 border shrink-0 transition-all duration-500",
                    timeElapsed > 15 && view === 'active' ? 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'bg-white/5 text-slate-600 border-white/10'
                  )}>
                    <Timer className={cn("w-4 h-4", timeElapsed > 15 && view === 'active' && 'animate-pulse')} />
                    <span className="font-black italic text-xl leading-none tracking-tighter">{timeElapsed}m</span>
                  </div>
                </div>

                {/* List Items */}
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-4 bg-white/[0.03] p-4 rounded-[24px] border border-white/[0.03] group/item hover:bg-white/[0.05] transition-all">
                      <span className="w-10 h-10 rounded-[14px] bg-primary/10 text-primary flex items-center justify-center font-black text-lg italic shrink-0 border border-primary/20 shadow-lg group-hover/item:scale-110 transition-transform">{item.quantity}</span>
                      <span className="text-white font-black uppercase text-sm md:text-base italic tracking-tight truncate leading-none flex-1">{item.menu_items?.name}</span>
                    </div>
                  ))}
                </div>

                {/* Action Row */}
                <div className="pt-4">
                  {view === 'active' ? (
                    order.status === 'pending' ? (
                      <Button
                        onClick={() => updateStatus(order.id, 'preparing', order.tables?.table_number)}
                        className="w-full py-8 md:py-10 rounded-[28px] md:rounded-[32px] bg-orange-500 text-black font-black uppercase tracking-widest text-[10px] hover:bg-orange-600 shadow-2xl shadow-orange-500/20 active:scale-95 transition-all gap-2"
                      >
                        <Flame className="w-5 h-5" /> Initiate Production
                      </Button>
                    ) : (
                      <Button
                        onClick={() => updateStatus(order.id, 'ready', order.tables?.table_number)}
                        className="w-full py-8 md:py-10 rounded-[28px] md:rounded-[32px] bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all gap-2"
                      >
                        <CheckCircle2 className="w-5 h-5" /> Cooked
                      </Button>
                    )
                  ) : (
                    <div className="w-full py-6 rounded-[28px] md:rounded-[32px] bg-white/[0.02] border border-white/5 text-center">
                      <span className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em] italic">Sequence: {order.status.toUpperCase()}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}

        {orders.length === 0 && (
          <div className="col-span-full py-40 text-center space-y-6">
            <div className="w-24 h-24 bg-white/5 rounded-[40px] flex items-center justify-center mx-auto border border-white/5 animate-pulse">
              <HistoryIcon className="w-12 h-12 text-slate-800" />
            </div>
            <div className="space-y-2">
              <p className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter italic leading-none">Production Queue Empty</p>
              <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em]">No active sequences detected in this sector.</p>
            </div>
          </div>
      </div>

      {/* PWA Install Promo */}
      <div className="mt-20 p-10 rounded-[64px] bg-primary/5 border border-primary/10 space-y-8 max-w-2xl mx-auto mb-20">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center">
              <Smartphone className="w-8 h-8 text-primary" />
           </div>
           <div className="space-y-1">
              <h3 className="text-xl font-black uppercase italic tracking-tighter text-white leading-none">Install Kitchen KDS</h3>
              <p className="text-xs font-black uppercase tracking-widest text-slate-700">Add to Home Screen for native experience</p>
           </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
           <div className="p-6 rounded-[40px] bg-white/5 border border-white/5 space-y-3">
              <p className="text-xs font-black text-white uppercase italic tracking-widest">Apple / Safari</p>
              <p className="text-[10px] text-slate-500 uppercase font-medium leading-relaxed tracking-widest">Share → Add to Home Screen</p>
           </div>
           <div className="p-6 rounded-[40px] bg-white/5 border border-white/5 space-y-3">
              <p className="text-xs font-black text-white uppercase italic tracking-widest">Android / Chrome</p>
              <p className="text-[10px] text-slate-500 uppercase font-medium leading-relaxed tracking-widest">Menu → Install App</p>
           </div>
        </div>
      </div>
    </div>
  );
}
