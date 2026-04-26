"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
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
  HistoryIcon
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
      subscribeToOrders(staff.restaurant_id);
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
    const { data } = await supabase.from("user_profiles").select("*").eq("id", uid).single();
    setProfile(data);
    if (data?.restaurant_id) {
      fetchInitialData(data.restaurant_id);
      subscribeToOrders(data.restaurant_id);
    }
  }

  async function fetchInitialData(resId: string) {
    setIsLoading(true);
    await fetchStaff(resId);
    await fetchLiveOrders(resId);
    setIsLoading(false);
  }

  async function fetchStaff(resId: string) {
    const { data } = await supabase.from("user_profiles").select("id, full_name").eq("restaurant_id", resId);
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

  function subscribeToOrders(restaurantId: string) {
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const channel = supabase
      .channel(`kds-feed-v3-${restaurantId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` }, () => fetchLiveOrders(restaurantId))
      .subscribe();
    channelRef.current = channel;
  }

  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    if (error) toast.error("Update Failed");
    else {
      toast.success(newStatus === 'preparing' ? "Order is Cooking" : "Order is Ready");
      if (profile?.restaurant_id) fetchLiveOrders(profile.restaurant_id);
    }
  };

  if (isLoading && orders.length === 0) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Opening The Pass...</p>
    </div>
  );

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
      {/* Optimized Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-white/5 pb-6 gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none">
            {view === 'active' ? 'Kitchen' : 'Order' } <span className="text-primary">{view === 'active' ? 'Feed' : 'History'}</span>
          </h1>
          <div className="text-slate-500 text-[9px] font-black uppercase tracking-widest mt-2 flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${view === 'active' ? 'bg-emerald-500' : 'bg-slate-500'}`} /> 
            {view === 'active' ? 'Live Production Stream' : 'Archive Data'}
          </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
              {['active', 'completed'].map((v) => (
                <button 
                  key={v}
                  onClick={() => setView(v as any)}
                  className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${view === v ? 'bg-primary text-black' : 'text-slate-500 hover:text-white'}`}
                >
                  {v}
                </button>
              ))}
           </div>
           <Button variant="outline" onClick={() => profile?.restaurant_id && fetchInitialData(profile.restaurant_id)} className="h-10 w-10 rounded-xl border-white/10 p-0">
              <RefreshCcw className="w-4 h-4" />
           </Button>
        </div>
      </div>

      {/* Grid with better break points */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
        {orders.map((order) => {
          const timeElapsed = Math.floor((new Date().getTime() - new Date(order.created_at).getTime()) / 60000);
          
          return (
            <Card key={order.id} className={`bg-slate-900/60 border rounded-[32px] overflow-hidden transition-all shadow-xl ${order.status === 'preparing' ? 'border-orange-500/40' : 'border-white/5'}`}>
               <div className="p-5 md:p-6 space-y-6">
                  {/* Compact Header */}
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black italic shadow-lg ${order.status === 'preparing' ? 'bg-orange-500 text-black' : 'bg-white/5 text-white border border-white/10'}`}>
                           <span className="text-[7px] opacity-60 leading-none">T</span>
                           <span className="text-2xl leading-none">{order.tables?.table_number}</span>
                        </div>
                        <div className="min-w-0">
                           <p className="text-base font-black text-white uppercase italic tracking-tighter truncate">{order.customer_name || "Guest"}</p>
                           <div className="flex items-center gap-1.5 mt-0.5">
                              <User className="w-2.5 h-2.5 text-primary" />
                              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest truncate">Server: {staffMap[order.waiter_id] || "Service"}</p>
                           </div>
                        </div>
                     </div>
                     <div className={`px-3 py-2 rounded-xl flex items-center gap-1.5 ${timeElapsed > 15 && view === 'active' ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-slate-500'}`}>
                        <Timer className="w-3.5 h-3.5" />
                        <span className="font-black italic text-base leading-none">{timeElapsed}m</span>
                     </div>
                  </div>

                  {/* List Items */}
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                     {order.order_items?.map((item: any) => (
                       <div key={item.id} className="flex items-center gap-3 bg-white/[0.03] p-3 rounded-2xl border border-white/[0.05] group hover:bg-white/[0.05] transition-colors">
                          <span className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-black text-sm italic flex-shrink-0">{item.quantity}</span>
                          <span className="text-white font-bold uppercase text-[13px] italic tracking-tight truncate leading-none">{item.menu_items?.name}</span>
                       </div>
                     ))}
                  </div>

                  {/* Action Row */}
                  <div className="pt-2">
                    {view === 'active' ? (
                      order.status === 'pending' ? (
                        <Button 
                          onClick={() => updateStatus(order.id, 'preparing')}
                          className="w-full py-6 rounded-2xl bg-orange-500 text-black font-black uppercase tracking-widest text-[10px] hover:bg-orange-600 shadow-lg shadow-orange-500/10 active:scale-95 transition-all"
                        >
                          <Flame className="w-4 h-4 mr-2" /> Start Cooking
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => updateStatus(order.id, 'ready')}
                          className="w-full py-6 rounded-2xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 shadow-lg shadow-emerald-500/10 active:scale-95 transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Ready
                        </Button>
                      )
                    ) : (
                      <div className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Status: {order.status.toUpperCase()}</span>
                      </div>
                    )}
                  </div>
               </div>
            </Card>
          );
        })}

        {orders.length === 0 && (
          <div className="col-span-full py-40 text-center opacity-10">
             <HistoryIcon className="w-24 h-24 mx-auto text-slate-500 mb-6" />
             <p className="text-2xl font-black text-white uppercase tracking-tighter italic">Queue is Empty</p>
          </div>
        )}
      </div>
    </div>
  );
}
