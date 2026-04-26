"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Hash, 
  Loader2, 
  Flame, 
  Bell, 
  Utensils,
  X,
  QrCode,
  Mail,
  Printer,
  ChevronRight,
  ArrowRight,
  Calendar,
  UserCheck
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { auth as firebaseAuth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-hot-toast";
import { sendReceiptEmail } from "@/lib/actions/email";

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [filter, setFilter] = useState("all");

  // Checkout States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [customerEmail, setCustomerEmail] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const supabase = createClient();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) getProfile(user.uid);
    });
    return () => {
      unsubscribe();
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  async function getProfile(uid: string) {
    const { data } = await supabase.from("user_profiles").select("*").eq("id", uid).single();
    setProfile(data);
    if (data?.restaurant_id) {
      fetchRestaurant(data.restaurant_id);
      fetchOrders(data.restaurant_id);
      subscribeToOrders(data.restaurant_id);
    }
  }

  async function fetchRestaurant(resId: string) {
    const { data } = await supabase.from("restaurants").select("*").eq("id", resId).single();
    setRestaurant(data);
  }

  async function fetchOrders(resId: string) {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        tables (*),
        order_items (
          *,
          menu_items (name)
        )
      `)
      .eq("restaurant_id", resId)
      .order("created_at", { ascending: false });
    
    if (error) console.error(error);
    else setOrders(data || []);
    setIsLoading(false);
  }

  function subscribeToOrders(resId: string) {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    
    const channelName = `admin-live-${resId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        console.log("ADMIN SYNC: Order Change Detected", payload);
        fetchOrders(resId);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, (payload) => {
        console.log("ADMIN SYNC: Table Change Detected", payload);
        fetchOrders(resId);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => fetchOrders(resId))
      .subscribe((status) => {
        console.log("ADMIN SYNC STATUS:", status);
      });
      
    channelRef.current = channel;
  }

  const calculateTotal = (order: any) => {
    if (!order || !restaurant) return { subtotal: 0, cgst: 0, sgst: 0, service: 0, total: 0 };
    const subtotal = order.total_amount || 0;
    const cgst = (subtotal * (restaurant.cgst_percent || 2.5)) / 100;
    const sgst = (subtotal * (restaurant.sgst_percent || 2.5)) / 100;
    const service = (subtotal * (restaurant.service_charge_percent || 5)) / 100;
    const total = subtotal + cgst + sgst + service;
    return { subtotal, cgst, sgst, service, total };
  };

  const handleFinalCheckout = async () => {
    if (!selectedOrder) return;
    setIsProcessingPayment(true);
    
    try {
      const totals = calculateTotal(selectedOrder);
      await supabase.from("orders").update({ 
        status: 'completed', 
        payment_status: 'paid',
        grand_total: totals.total,
        customer_email: customerEmail,
        settled_by: 'Admin',
        settled_at: new Date().toISOString()
      }).eq("id", selectedOrder.id);
      
      if (selectedOrder.table_id) {
        const { error: tableError } = await supabase.from("tables").update({ status: 'available' }).eq("id", selectedOrder.table_id);
        if (!tableError) {
          toast.success(`Station ${selectedOrder.tables?.table_number} is now Available!`);
        }
      }

      if (customerEmail) {
        const emailResult = await sendReceiptEmail({
          email: customerEmail,
          orderId: selectedOrder.id,
          customerName: selectedOrder.customer_name || "Guest",
          items: selectedOrder.order_items,
          total: totals.total,
          restaurantName: restaurant?.name || "Bhojan Restaurant"
        });
        
        if (emailResult.success) {
          toast.success(`Receipt sent to ${customerEmail}`);
        } else {
          console.error("EMAIL TRIGGER FAILED:", emailResult.error);
          toast.error("Email failed, but table settled.");
        }
      }

      toast.success("Transaction Finalized!");
      setIsCheckoutOpen(false);
      setSelectedOrder(null);
      fetchOrders(profile.restaurant_id);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Delete this order?")) return;
    await supabase.from("order_items").delete().eq("order_id", orderId);
    await supabase.from("orders").delete().eq("id", orderId);
    toast.success("Order Purged");
    fetchOrders(profile.restaurant_id);
  };

  const filteredOrders = orders.filter(o => {
    if (filter === "all") return true;
    if (filter === "pending") return o.status === "pending" || o.status === "preparing";
    if (filter === "completed") return o.status === "completed" || o.status === "ready";
    return true;
  });

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'preparing': return { icon: <Flame className="w-8 h-8 animate-pulse text-orange-500" />, label: "COOKING", color: "text-orange-500", bg: "bg-orange-500/10" };
      case 'ready': return { icon: <Bell className="w-8 h-8 animate-bounce text-emerald-500" />, label: "READY", color: "text-emerald-500", bg: "bg-emerald-500/10" };
      case 'completed': return { icon: <CheckCircle2 className="w-8 h-8 text-emerald-500" />, label: "PAID", color: "text-emerald-500", bg: "bg-emerald-500/10" };
      default: return { icon: <Clock className="w-8 h-8 text-slate-500" />, label: "PENDING", color: "text-slate-500", bg: "bg-white/5" };
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-10 pb-20 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-10">
        <div className="space-y-4">
           <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-[0.3em]">
              <Hash className="w-3 h-3" /> Live Transaction Stream
           </div>
           <h2 className="text-7xl font-black text-white tracking-tighter uppercase leading-none italic">
             Command <span className="text-slate-500">Orders</span>
           </h2>
        </div>
        <div className="flex bg-white/5 p-1.5 rounded-3xl border border-white/10 shadow-2xl">
           {["all", "pending", "completed"].map(t => (
             <button 
               key={t} onClick={() => setFilter(t)}
               className={`px-8 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${filter === t ? 'bg-primary text-black' : 'text-slate-500 hover:text-white'}`}
             >
               {t}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredOrders.map((order) => {
          const status = getStatusDisplay(order.status);
          const totals = calculateTotal(order);
          
          return (
            <Card key={order.id} className={`bg-[#0b1120] border-2 rounded-[48px] overflow-hidden group transition-all duration-500 shadow-2xl ${
              order.status === 'preparing' ? 'border-orange-500/20' : 
              order.status === 'ready' ? 'border-emerald-500/20' : 'border-white/5'
            }`}>
              <CardContent className="p-0 flex flex-col md:flex-row">
                 <div className={`w-full md:w-32 flex flex-col items-center justify-center p-8 gap-2 ${status.bg}`}>
                    {status.icon}
                    <span className={`text-[10px] font-black tracking-widest ${status.color}`}>{status.label}</span>
                 </div>

                 <div className="flex-1 p-10 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="flex items-center gap-8 cursor-pointer group" onClick={() => { setSelectedOrder(order); setIsCheckoutOpen(true); }}>
                       <div className="w-20 h-20 rounded-[32px] bg-white/5 border border-white/10 flex flex-col items-center justify-center group-hover:border-primary/50 transition-all">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">T</span>
                          <span className="text-3xl font-black text-white italic leading-none">{order.tables?.table_number || '!!'}</span>
                       </div>
                       <div>
                          <h4 className="text-3xl font-black text-white uppercase italic tracking-tighter group-hover:text-primary transition-all flex items-center gap-2">
                            {order.customer_name} <ArrowRight className="w-6 h-6 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" />
                          </h4>
                          <div className="flex flex-wrap items-center gap-4 mt-1">
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {formatDate(order.created_at)}
                             </p>
                             {order.settled_by && (
                               <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                                  <UserCheck className="w-3 h-3" /> {order.settled_by}
                               </p>
                             )}
                             {!order.waiter_id && (
                                <div className="px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-[8px] font-black text-fuchsia-500 uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_10px_rgba(217,70,239,0.1)]">
                                   <Zap className="w-3 h-3" /> QR ORDER
                                </div>
                             )}
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mt-4">
                             {order.order_items?.map((item: any) => (
                               <span key={item.id} className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-tight">
                                  {item.quantity}x {item.menu_items?.name}
                               </span>
                             ))}
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-12">
                       <div className="text-right">
                          <p className="text-5xl font-black text-white italic tracking-tighter leading-none">₹{order.grand_total || totals.total.toFixed(0)}</p>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">{order.payment_status.toUpperCase()}</p>
                       </div>
                       <div className="flex gap-4">
                          <Button 
                            onClick={() => handleDeleteOrder(order.id)}
                            className="h-16 w-16 rounded-3xl bg-white/5 border border-white/10 text-slate-500 hover:bg-red-500 hover:text-white transition-all"
                          >
                             <Trash2 className="w-6 h-6" />
                          </Button>
                       </div>
                    </div>
                 </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Admin Checkout Modal Overlay */}
      {isCheckoutOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-3xl bg-slate-950/80 animate-in fade-in duration-300">
          <div className="bg-[#0b1120] w-full max-w-4xl rounded-[64px] border-2 border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col md:flex-row h-[90vh]">
            <div className="flex-1 p-12 overflow-y-auto space-y-10 border-r border-white/5">
              <div className="flex justify-between items-center">
                <h3 className="text-4xl font-black italic uppercase tracking-tighter">Admin <span className="text-primary">Settlement</span></h3>
                <Button variant="ghost" onClick={() => setIsCheckoutOpen(false)} className="rounded-full w-12 h-12 bg-white/5"><X /></Button>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Item Breakdown</p>
                {selectedOrder.order_items.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <span className="font-black uppercase italic text-sm">{item.quantity}x {item.menu_items?.name}</span>
                    <span className="font-black italic">₹{item.total_price}</span>
                  </div>
                ))}
              </div>

              <div className="pt-8 border-t border-white/5 space-y-4">
                 {(() => {
                    const t = calculateTotal(selectedOrder);
                    return (
                      <>
                        <div className="flex justify-between text-slate-400 font-bold uppercase text-[10px]">
                           <span>Subtotal</span>
                           <span>₹{t.subtotal}</span>
                        </div>
                        <div className="flex justify-between text-slate-400 font-bold uppercase text-[10px]">
                           <span>Taxes & Service</span>
                           <span>₹{(t.cgst + t.sgst + t.service).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-end pt-4">
                           <span className="text-xl font-black text-primary italic uppercase tracking-widest">Settlement Amount</span>
                           <span className="text-6xl font-black italic tracking-tighter">₹{t.total.toFixed(0)}</span>
                        </div>
                      </>
                    )
                 })()}
              </div>
            </div>

            <div className="w-full md:w-[400px] bg-primary/5 p-12 flex flex-col justify-between">
              <div className="space-y-10">
                <div className="w-full aspect-square bg-white rounded-[48px] p-6 shadow-2xl flex items-center justify-center">
                  {restaurant?.qr_code_url ? (
                    <img src={restaurant.qr_code_url} className="w-full h-full object-contain" />
                  ) : <QrCode className="w-20 h-20 text-slate-300" />}
                </div>
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Receipt Email</p>
                   <input 
                     type="email"
                     placeholder="customer@email.com"
                     value={customerEmail}
                     onChange={(e) => setCustomerEmail(e.target.value)}
                     className="w-full bg-[#0b1120] border border-white/10 rounded-3xl px-8 py-5 text-sm outline-none font-bold"
                   />
                </div>
              </div>

              <div className="space-y-4">
                <Button 
                  onClick={handleFinalCheckout}
                  disabled={isProcessingPayment}
                  className="w-full h-24 rounded-[32px] bg-primary text-black font-black uppercase tracking-widest text-lg shadow-2xl"
                >
                  {isProcessingPayment ? <Loader2 className="w-8 h-8 animate-spin" /> : "Complete Settlement"}
                </Button>
                <button className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition-colors flex items-center justify-center gap-2">
                   <Printer className="w-4 h-4" /> Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
