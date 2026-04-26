"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
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
  UserCheck,
  Zap
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { auth as firebaseAuth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { sendReceiptEmail } from "@/lib/actions/email";
import { generateReceipt } from "@/lib/pdf/generateReceipt";
import { Download } from "lucide-react";

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
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
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
        fetchOrders(resId);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, (payload) => {
        fetchOrders(resId);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => fetchOrders(resId))
      .subscribe();
      
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
        await supabase.from("tables").update({ status: 'available' }).eq("id", selectedOrder.table_id);
      }

      if (customerEmail) {
        await sendReceiptEmail({
          email: customerEmail,
          orderId: selectedOrder.id,
          customerName: selectedOrder.customer_name || "Guest",
          items: selectedOrder.order_items,
          total: totals.total,
          restaurantName: restaurant?.name || "Bhojan Restaurant"
        });
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

  const handleDownloadReceipt = () => {
    if (!selectedOrder) return;
    const totals = calculateTotal(selectedOrder);
    generateReceipt({
      id: selectedOrder.id,
      customer_name: selectedOrder.customer_name || "Guest",
      customer_phone: selectedOrder.customer_phone || "",
      table_number: selectedOrder.tables?.table_number || "N/A",
      items: selectedOrder.order_items,
      subtotal: totals.subtotal,
      cgst: totals.cgst,
      sgst: totals.sgst,
      serviceCharge: totals.service,
      total: totals.total
    }, restaurant);
    toast.success("Receipt Generated");
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
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="w-full space-y-6 md:space-y-10 pb-20 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.03] pb-10">
        <div className="space-y-4">
           <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-[0.3em]">
              <Hash className="w-3 h-3" /> Live Transaction Stream
           </div>
           <h2 className="text-4xl md:text-7xl font-black text-white tracking-tighter uppercase leading-none italic">
             Command <span className="text-slate-500">Orders</span>
           </h2>
        </div>
        <div className="flex bg-white/5 p-1.5 rounded-[20px] md:rounded-3xl border border-white/10 shadow-2xl overflow-x-auto no-scrollbar shrink-0">
           {["all", "pending", "completed"].map(t => (
             <button 
               key={t} onClick={() => setFilter(t)}
               className={`px-6 md:px-8 py-3 rounded-[15px] md:rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${filter === t ? 'bg-primary text-black shadow-xl' : 'text-slate-500 hover:text-white'}`}
             >
               {t}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-6">
        {filteredOrders.map((order) => {
          const status = getStatusDisplay(order.status);
          const totals = calculateTotal(order);
          
          return (
            <Card key={order.id} className={cn(
              "bg-[#0b1120] border-2 rounded-[32px] md:rounded-[48px] overflow-hidden group transition-all duration-500 shadow-2xl",
              order.status === 'preparing' ? 'border-orange-500/20' : 
              order.status === 'ready' ? 'border-emerald-500/20' : 'border-white/[0.03]'
            )}>
              <CardContent className="p-0 flex flex-col md:flex-row h-full">
                 <div className={`w-full md:w-32 flex flex-row md:flex-col items-center justify-center p-6 md:p-8 gap-4 md:gap-2 ${status.bg} shrink-0`}>
                    {status.icon}
                    <span className={`text-[10px] font-black tracking-widest ${status.color}`}>{status.label}</span>
                 </div>

                 <div className="flex-1 p-6 md:p-10 flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-10">
                    <div className="flex items-center gap-6 md:gap-8 cursor-pointer group w-full lg:w-auto" onClick={() => { setSelectedOrder(order); setIsCheckoutOpen(true); }}>
                       <div className="w-16 h-16 md:w-20 md:h-20 rounded-[24px] md:rounded-[32px] bg-white/5 border border-white/10 flex flex-col items-center justify-center group-hover:border-primary/50 transition-all shrink-0">
                          <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">STATION</span>
                          <span className="text-2xl md:text-3xl font-black text-white italic leading-none">{order.tables?.table_number || '!!'}</span>
                       </div>
                       <div className="min-w-0 flex-1">
                          <h4 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter group-hover:text-primary transition-all flex items-center gap-3 truncate">
                            {order.customer_name} <ArrowRight className="hidden md:block w-6 h-6 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" />
                          </h4>
                          <div className="flex flex-wrap items-center gap-3 mt-1.5">
                             <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {formatDate(order.created_at)}
                             </p>
                             {!order.waiter_id && (
                                <div className="px-3 py-1 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20 text-[8px] font-black text-fuchsia-500 uppercase tracking-widest flex items-center gap-1.5">
                                   <Zap className="w-3 h-3" /> DIGITAL SCAN
                                </div>
                             )}
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mt-4">
                             {order.order_items?.slice(0, 3).map((item: any) => (
                               <span key={item.id} className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-tight">
                                  {item.quantity}× {item.menu_items?.name}
                               </span>
                             ))}
                             {order.order_items?.length > 3 && (
                               <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[8px] md:text-[9px] font-black text-primary uppercase">+{order.order_items.length - 3} MORE</span>
                             )}
                          </div>
                       </div>
                    </div>

                    <div className="flex flex-row md:flex-row items-center justify-between lg:justify-end gap-8 md:gap-12 w-full lg:w-auto pt-6 lg:pt-0 border-t lg:border-t-0 border-white/[0.03]">
                       <div className="text-left lg:text-right">
                          <p className="text-3xl md:text-5xl font-black text-white italic tracking-tighter leading-none">₹{order.grand_total || totals.total.toFixed(0)}</p>
                          <p className={cn("text-[9px] md:text-[10px] font-black uppercase tracking-widest mt-2", order.payment_status === 'paid' ? 'text-emerald-500' : 'text-slate-600')}>
                             {order.payment_status.toUpperCase()}
                          </p>
                       </div>
                       <div className="flex gap-3 md:gap-4">
                          <Button 
                            variant="outline"
                            onClick={() => handleDeleteOrder(order.id)}
                            className="h-14 w-14 md:h-16 md:w-16 rounded-[20px] md:rounded-3xl border-white/10 hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-90"
                          >
                             <Trash2 className="w-5 h-5 md:w-6 md:h-6" />
                          </Button>
                       </div>
                    </div>
                 </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Admin Checkout Modal Overlay - Fully Responsive */}
      <AnimatePresence>
        {isCheckoutOpen && selectedOrder && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 backdrop-blur-2xl bg-slate-950/90 animate-in fade-in duration-300 overflow-y-auto py-12 custom-scrollbar">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-[#0b1120] w-full max-w-5xl rounded-[40px] md:rounded-[64px] border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[500px]"
            >
              {/* Order Details Column */}
              <div className="flex-1 p-8 md:p-16 overflow-y-auto space-y-10 border-b md:border-b-0 md:border-r border-white/5">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white leading-none">Admin <span className="text-primary block mt-1">Settlement</span></h3>
                    <p className="text-[9px] md:text-[10px] font-black text-slate-700 uppercase tracking-widest italic">Identity Identifier: {selectedOrder.id.slice(-8)}</p>
                  </div>
                  <Button variant="ghost" onClick={() => setIsCheckoutOpen(false)} className="rounded-2xl w-12 h-12 md:w-14 md:h-14 bg-white/5 text-slate-500 hover:text-white"><X className="w-6 h-6" /></Button>
                </div>

                <div className="space-y-6">
                  <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] border-b border-white/5 pb-4 italic">Resource Breakdown</p>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                    {selectedOrder.order_items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center group">
                        <span className="font-black uppercase italic text-sm md:text-base text-white group-hover:text-primary transition-colors">{item.quantity}× {item.menu_items?.name}</span>
                        <span className="font-black italic text-white tracking-tighter">₹{item.total_price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8 border-t border-white/5 space-y-4">
                   {(() => {
                      const t = calculateTotal(selectedOrder);
                      return (
                        <>
                          <div className="flex justify-between text-slate-600 font-black uppercase text-[10px] tracking-widest">
                             <span>Asset Subtotal</span>
                             <span>₹{t.subtotal}</span>
                          </div>
                          <div className="flex justify-between text-slate-600 font-black uppercase text-[10px] tracking-widest">
                             <span>Applied Levies (GST/SC)</span>
                             <span>₹{(t.cgst + t.sgst + t.service).toFixed(0)}</span>
                          </div>
                          <div className="flex justify-between items-end pt-6">
                             <span className="text-sm md:text-base font-black text-primary italic uppercase tracking-widest">Settlement Sum</span>
                             <span className="text-5xl md:text-7xl font-black italic tracking-tighter text-white leading-none">₹{t.total.toFixed(0)}</span>
                          </div>
                        </>
                      )
                   })()}
                </div>
              </div>

              {/* Payment Processing Column */}
              <div className="w-full md:w-[400px] bg-primary/[0.02] p-8 md:p-12 flex flex-col justify-between overflow-y-auto no-scrollbar">
                <div className="space-y-8 md:space-y-12">
                  <div className="text-center space-y-2">
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[8px] font-black text-primary uppercase tracking-[0.3em]">
                        Digital Sequence
                     </div>
                     <p className="text-sm font-black text-white uppercase italic tracking-widest mt-2">Merchant Protocol</p>
                  </div>

                  <div className="w-full aspect-square bg-white rounded-[40px] md:rounded-[48px] p-8 md:p-10 shadow-2xl flex items-center justify-center relative group">
                    <div className="absolute inset-0 bg-primary/5 rounded-[48px] blur-3xl -z-10 group-hover:bg-primary/10 transition-all" />
                    {restaurant?.merchant_qr_url ? (
                      <img src={restaurant.merchant_qr_url} className="w-full h-full object-contain" alt="QR" />
                    ) : <QrCode className="w-20 h-20 text-slate-200" />}
                  </div>

                  <div className="space-y-4">
                     <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-center italic">Email Confirmation</p>
                     <div className="relative">
                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800" />
                        <input 
                          type="email"
                          placeholder="CLIENT@VAULT.COM"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="w-full bg-[#0b1120] border border-white/10 rounded-[24px] pl-14 pr-8 py-5 md:py-6 text-[10px] md:text-xs outline-none font-black text-white focus:border-primary/50 transition-all uppercase tracking-widest placeholder:text-slate-900"
                        />
                     </div>
                  </div>
                </div>

                <div className="space-y-4 mt-12 md:mt-0">
                  <Button 
                    onClick={handleFinalCheckout}
                    disabled={isProcessingPayment}
                    className="w-full h-20 md:h-24 rounded-[28px] md:rounded-[32px] bg-primary text-black font-black uppercase tracking-widest text-base md:text-xl shadow-2xl shadow-primary/20 active:scale-95 transition-all"
                  >
                    {isProcessingPayment ? <Loader2 className="w-6 h-6 animate-spin" /> : "Authorize Settlement"}
                  </Button>
                  <button 
                    onClick={handleDownloadReceipt}
                    className="w-full py-4 text-[9px] font-black uppercase tracking-widest text-slate-700 hover:text-white transition-all flex items-center justify-center gap-2 group"
                  >
                     <Download className="w-4 h-4 group-hover:scale-110 transition-transform" /> Download Resource Receipt
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
