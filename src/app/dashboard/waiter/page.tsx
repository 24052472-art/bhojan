"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { 
  Plus, 
  Minus, 
  Trash2, 
  Send, 
  User, 
  Phone, 
  ArrowLeft, 
  CheckCircle2, 
  X, 
  QrCode, 
  Mail, 
  Loader2, 
  Flame, 
  LayoutGrid, 
  ShieldAlert,
  ShoppingCart,
  Zap,
  Bell,
  Search,
  ChevronRight,
  Info,
  Printer,
  CreditCard,
  ChefHat,
  Wifi,
  UtensilsCrossed,
  Clock
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { auth as firebaseAuth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-hot-toast";
import { sendReceiptEmail } from "@/lib/actions/email";

export default function WaiterDashboard() {
  const [tables, setTables] = useState<any[]>([]);
  const [menu, setMenu] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'tables' | 'menu' | 'orders'>('tables');
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [isBucketPulsing, setIsBucketPulsing] = useState(false);
  const [isLive, setIsLive] = useState(false);
  
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

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
      return () => {
        unsubscribe();
        if (channelRef.current) supabase.removeChannel(channelRef.current);
      };
    }
  }, []);

  async function getProfile(uid: string) {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
    setProfile(data);
    if (data?.restaurant_id) {
      fetchInitialData(data.restaurant_id);
      setupRealtime(data.restaurant_id);
    }
  }

  function setupRealtime(resId: string) {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    
    const channelName = `waiter-live-${resId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchData(resId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, () => fetchData(resId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => fetchData(resId))
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });
      
    channelRef.current = channel;
  }

  async function fetchInitialData(resId: string) {
    fetchRestaurant(resId);
    fetchData(resId);
  }

  async function fetchRestaurant(resId: string) {
    const { data } = await supabase.from("restaurants").select("*").eq("id", resId).single();
    setRestaurant(data);
  }

  async function fetchData(restaurantId: string) {
    const { data: tableData } = await supabase
      .from("tables")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("table_number", { ascending: true });

    const { data: orderData } = await supabase
      .from("orders")
      .select(`*, order_items(*, menu_items(*))`)
      .eq("restaurant_id", restaurantId)
      .not("status", "eq", "completed")
      .not("payment_status", "eq", "paid");

    const { data: menuData } = await supabase
      .from("menu_items")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("is_available", true);

    const processedTables = tableData?.map(t => {
      const active = orderData?.find((o: any) => o.table_id === t.id);
      return { ...t, activeOrder: active };
    });

    if (menuData) {
      const cats = ["All", ...Array.from(new Set(menuData.map((m: any) => m.category)))];
      setCategories(cats);
    }

    setTables(processedTables || []);
    setMenu(menuData || []);
  }

  const handleTableClick = (table: any) => {
    setSelectedTable(table);
    if (table.activeOrder) {
      setCustomer({ name: table.activeOrder.customer_name, phone: table.activeOrder.customer_phone });
    } else {
      setCustomer({ name: '', phone: '' });
    }
    setCart([]);
    setActiveTab('menu');
  };

  const addToCart = (item: any) => {
    if (!selectedTable) return toast.error("Selection Required");
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
    setIsBucketPulsing(true);
    setTimeout(() => setIsBucketPulsing(false), 300);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
    toast.success("De-selected");
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (!existing) return prev;
      const newQty = existing.qty + delta;
      if (newQty <= 0) return prev.filter(i => i.id !== id);
      return prev.map(i => i.id === id ? { ...i, qty: newQty } : i);
    });
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setIsLoading(true);
    try {
      const newRoundTotal = cart.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
      const activeOrder = selectedTable.activeOrder;
      if (activeOrder) {
        const orderItems = cart.map(item => ({
          order_id: activeOrder.id,
          menu_item_id: item.id,
          quantity: item.qty,
          unit_price: item.price,
          total_price: item.price * item.qty 
        }));
        await supabase.from("order_items").insert(orderItems);
        await supabase.from("orders").update({ 
          status: 'pending', 
          total_amount: (activeOrder.total_amount || 0) + newRoundTotal,
          grand_total: (activeOrder.grand_total || 0) + newRoundTotal,
          customer_name: customer.name || activeOrder.customer_name,
          customer_phone: customer.phone || activeOrder.customer_phone
        }).eq("id", activeOrder.id);
      } else {
        const { data: order, error: orderError } = await supabase.from("orders").insert([{
          restaurant_id: profile.restaurant_id,
          table_id: selectedTable.id,
          waiter_id: profile.id?.includes('staff_') ? null : profile.id,
          customer_name: customer.name || "GUEST ASSET",
          customer_phone: customer.phone || "",
          status: 'pending',
          payment_status: 'unpaid',
          total_amount: newRoundTotal,
          grand_total: newRoundTotal
        }]).select().single();
        if (orderError) throw orderError;
        const orderItems = cart.map(item => ({
          order_id: order.id,
          menu_item_id: item.id,
          quantity: item.qty,
          unit_price: item.price,
          total_price: item.price * item.qty 
        }));
        await supabase.from("order_items").insert(orderItems);
        await supabase.from("tables").update({ status: 'occupied' }).eq("id", selectedTable.id);
      }
      toast.success("Order Synchronized");
      setCart([]);
      setSelectedTable(null);
      setActiveTab('tables');
      fetchData(profile.restaurant_id);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalCheckout = async () => {
    if (!selectedTable?.activeOrder) return;
    setIsProcessingPayment(true);
    try {
      const subtotal = selectedTable.activeOrder.total_amount || 0;
      const cgst = (subtotal * (restaurant?.cgst_percent || 2.5)) / 100;
      const sgst = (subtotal * (restaurant?.sgst_percent || 2.5)) / 100;
      const service = (subtotal * (restaurant?.service_charge_percent || 5)) / 100;
      const grandTotal = subtotal + cgst + sgst + service;
      
      const { error: orderError } = await supabase.from("orders").update({ 
        status: 'completed', 
        payment_status: 'paid', 
        grand_total: grandTotal, 
        customer_email: customerEmail,
        settled_by: `STAFF: ${profile?.full_name || 'SYSTEM'}`,
        settled_at: new Date().toISOString()
      }).eq("id", selectedTable.activeOrder.id);
      
      if (orderError) throw orderError;

      await supabase.from("tables").update({ status: 'available' }).eq("id", selectedTable.id);
      
      if (customerEmail) {
        await sendReceiptEmail({
          email: customerEmail,
          orderId: selectedTable.activeOrder.id,
          customerName: customer.name || "GUEST",
          items: selectedTable.activeOrder.order_items,
          total: grandTotal,
          restaurantName: restaurant?.name || "BHOJAN"
        });
        toast.success("Receipt Transmission Success");
      }

      toast.success("Transaction Complete");
      setIsCheckoutOpen(false);
      setSelectedTable(null);
      setActiveTab('tables');
      fetchData(profile.restaurant_id);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const filteredMenu = selectedCategory === "All" ? menu : menu.filter(item => item.category === selectedCategory);
  const activeOrders = tables.filter(t => t.activeOrder);

  return (
    <div className="w-full flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-160px)] relative overflow-hidden bg-[#05070a] rounded-[40px] md:rounded-[56px] border border-white/5 shadow-2xl">
      <div className={cn(
        "absolute top-8 right-8 z-[60] px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border shadow-2xl transition-all duration-500",
        isLive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-emerald-500/10' : 'bg-red-500/10 border-red-500/20 text-red-500 animate-pulse'
      )}>
         <Wifi className={cn("w-3.5 h-3.5", !isLive && 'animate-ping')} />
         {isLive ? 'LIVE NETWORK' : 'SYNC DISCONNECTED'}
      </div>

      <header className="px-6 md:px-12 py-6 md:py-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10 border-b border-white/[0.03] shrink-0">
        <div className="flex items-center gap-6 w-full md:w-auto">
          {selectedTable && (
            <button onClick={() => setSelectedTable(null)} className="h-12 w-12 md:h-14 md:w-14 rounded-2xl md:rounded-3xl bg-white/5 flex items-center justify-center hover:bg-primary hover:text-black transition-all active:scale-90 border border-white/5">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-4xl font-black italic tracking-tighter uppercase leading-none text-white">
              {selectedTable ? `STATION T-${selectedTable.table_number}` : 'SERVICE CONTROL'}
            </h1>
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] mt-2 text-slate-700 italic leading-none">{profile?.full_name || 'OPERATIONAL STAFF'}</span>
          </div>
        </div>

        <div className="flex bg-white/5 p-1.5 rounded-[20px] md:rounded-3xl border border-white/10 w-full md:w-auto overflow-x-auto no-scrollbar shadow-2xl">
          {(['tables', 'menu', 'orders'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab !== 'menu') setSelectedTable(null);
              }}
              className={cn(
                "px-6 md:px-10 py-3 md:py-4 rounded-[15px] md:rounded-[20px] text-[9px] font-black uppercase tracking-[0.2em] transition-all flex-1 md:flex-none whitespace-nowrap",
                activeTab === tab ? 'bg-primary text-black shadow-2xl shadow-primary/20 scale-105' : 'text-slate-600 hover:text-white'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 p-6 md:p-12 overflow-hidden flex flex-col relative">
        {activeTab === 'tables' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4 md:gap-6 overflow-y-auto pr-2 custom-scrollbar no-scrollbar">
            {tables.map((table) => {
              const status = table.activeOrder?.status;
              const isReady = status === 'ready';
              const isOccupied = table.status === 'occupied';
              return (
                <button
                  key={table.id}
                  onClick={() => handleTableClick(table)}
                  className={cn(
                    "relative aspect-square rounded-[32px] md:rounded-[40px] border transition-all duration-500 flex flex-col items-center justify-center gap-2 group",
                    isOccupied 
                      ? isReady 
                        ? 'border-emerald-500/40 bg-emerald-500/5 shadow-[0_0_30px_rgba(16,185,129,0.1)]' 
                        : 'border-orange-500/40 bg-orange-500/5 shadow-[0_0_30px_rgba(249,115,22,0.1)]'
                      : 'border-white/5 bg-white/[0.01] hover:border-primary/40 hover:bg-primary/5 hover:scale-105'
                  )}
                >
                  {isOccupied && (
                    <div className="absolute top-4 right-4">
                      {isReady ? <Bell className="w-5 h-5 text-emerald-500 animate-bounce" /> : <Flame className="w-5 h-5 text-orange-500 animate-pulse" />}
                    </div>
                  )}
                  <span className={cn("text-3xl md:text-4xl font-black italic tracking-tighter transition-all duration-500", isOccupied ? 'text-white' : 'text-slate-800 group-hover:text-primary')}>{table.table_number}</span>
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-20 italic">{table.status}</span>
                </button>
              );
            })}
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="flex flex-col lg:flex-row gap-8 md:gap-12 flex-1 overflow-hidden relative h-full">
            <div className="flex-1 flex flex-col gap-8 overflow-hidden h-full">
               <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar shrink-0">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "px-8 md:px-10 py-3 md:py-4 rounded-[15px] md:rounded-[20px] text-[9px] font-black uppercase tracking-widest transition-all border whitespace-nowrap",
                        selectedCategory === cat ? 'bg-primary text-black border-primary shadow-2xl shadow-primary/20' : 'bg-white/5 text-slate-700 border-white/10 hover:text-white'
                      )}
                    >
                      {cat}
                    </button>
                  ))}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 overflow-y-auto pr-4 pb-20 custom-scrollbar no-scrollbar">
                 {filteredMenu.map((item) => (
                   <div 
                    key={item.id} 
                    onClick={() => addToCart(item)} 
                    className="bg-white/[0.02] border border-white/[0.03] rounded-[32px] md:rounded-[40px] p-6 flex items-center gap-6 relative group hover:border-primary/50 hover:bg-primary/[0.02] transition-all duration-500 cursor-pointer active:scale-95 shadow-2xl"
                   >
                     <div className={cn("absolute top-6 right-6 w-2 h-2 rounded-full", item.is_veg ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]')} />
                     <div className="w-16 h-16 md:w-20 md:h-20 rounded-[20px] md:rounded-[28px] bg-white/5 border border-white/5 flex-shrink-0 flex items-center justify-center text-2xl md:text-3xl font-black text-primary uppercase italic shadow-2xl">
                       {item.name.charAt(0)}
                     </div>
                     <div className="flex-1 min-w-0">
                       <h4 className="text-base md:text-lg font-black uppercase italic tracking-tighter leading-tight text-white group-hover:text-primary transition-all mb-2">{item.name}</h4>
                       <div className="flex items-center gap-4">
                         <span className="text-xl md:text-2xl font-black text-white italic tracking-tighter">₹{item.price}</span>
                         <div className="w-8 h-8 rounded-[12px] bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-all border border-primary/20">
                            <Plus className="w-4 h-4" />
                         </div>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>

            {selectedTable && (
              <div className="w-full lg:w-[400px] flex flex-col gap-6 h-full animate-in slide-in-from-right duration-700 pb-4">
                <div className={cn(
                  "flex-1 bg-[#0b1118] rounded-[48px] md:rounded-[64px] border flex flex-col shadow-2xl overflow-hidden transition-all duration-500 h-full relative",
                  isBucketPulsing ? 'border-primary/50 scale-[1.02] shadow-primary/10' : 'border-white/5'
                )}>
                    <div className="px-8 md:px-10 pt-10 pb-6 border-b border-white/[0.03] space-y-6">
                      <div className="bg-black/40 rounded-[28px] p-5 flex items-center justify-between border border-white/5">
                          <div className="flex items-center gap-4">
                            <ShoppingCart className="w-5 h-5 text-primary" />
                            <span className="text-xs font-black uppercase tracking-tighter text-white italic">OPERATIONAL PAD T-{selectedTable.table_number}</span>
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <div className="relative group">
                           <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800 group-focus-within:text-primary transition-colors" />
                           <input 
                              type="text" 
                              placeholder="CLIENT IDENTIFIER" 
                              value={customer.name}
                              onChange={(e) => setCustomer(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full bg-black/40 border border-white/5 rounded-[24px] pl-12 pr-6 py-5 text-[10px] font-black tracking-widest text-white placeholder:text-slate-900 focus:border-primary/50 outline-none transition-all"
                           />
                        </div>
                        <div className="relative group">
                           <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800 group-focus-within:text-primary transition-colors" />
                           <input 
                              type="text" 
                              placeholder="COMMS NUMBER" 
                              value={customer.phone}
                              onChange={(e) => setCustomer(prev => ({ ...prev, phone: e.target.value }))}
                              className="w-full bg-black/40 border border-white/5 rounded-[24px] pl-12 pr-6 py-5 text-[10px] font-black uppercase tracking-widest text-white placeholder:text-slate-900 focus:border-primary/50 outline-none transition-all"
                           />
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-8 md:px-10 py-8 space-y-6 custom-scrollbar no-scrollbar">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center justify-between group/item">
                          <div className="flex-1 min-w-0 pr-4">
                            <p className="font-black uppercase italic text-sm md:text-base text-white leading-none truncate group-hover/item:text-primary transition-colors">{item.name}</p>
                          </div>
                          <div className="flex items-center gap-3 bg-black/60 rounded-[20px] p-2 border border-white/5">
                            <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center hover:text-red-500 transition-colors"><Minus className="w-3 h-3" /></button>
                            <span className="font-black text-primary text-sm tracking-tighter min-w-[20px] text-center">{item.qty}</span>
                            <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center hover:text-primary transition-colors"><Plus className="w-3 h-3" /></button>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="ml-4 text-red-500 opacity-40 hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ))}
                      {selectedTable.activeOrder && (
                        <div className="pt-8 border-t border-white/[0.03] space-y-4">
                          <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em] italic">Current Sequence</p>
                          {selectedTable.activeOrder.order_items.map((item: any) => (
                            <div key={item.id} className="flex justify-between text-[11px] font-black uppercase italic tracking-tight">
                              <span className="text-slate-600">{item.quantity}x {item.menu_items?.name}</span>
                              <span className="text-slate-800">₹{item.total_price}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="px-8 md:px-10 py-10 bg-black/40 border-t border-white/[0.03] space-y-6">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                           <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] italic">Aggregated Value</p>
                           <p className="text-[8px] font-black text-slate-800 uppercase tracking-widest">Inclusive of base levies</p>
                        </div>
                        <p className="text-5xl md:text-6xl font-black text-white italic tracking-tighter leading-none shadow-2xl">₹{cart.reduce((acc, curr) => acc + (curr.price * curr.qty), selectedTable.activeOrder?.total_amount || 0)}</p>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <Button onClick={handlePlaceOrder} disabled={isLoading || cart.length === 0} className="w-full h-16 md:h-20 rounded-[28px] md:rounded-[36px] bg-primary text-black font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Synchronize Sequence</Button>
                        {selectedTable.activeOrder && (
                          <Button onClick={() => setIsCheckoutOpen(true)} className="w-full h-14 rounded-[24px] bg-white text-black font-black uppercase text-[9px] tracking-widest border border-white/10 hover:bg-slate-200 transition-all shadow-2xl">Execute Final Settlement</Button>
                        )}
                      </div>
                    </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="flex-1 flex flex-col gap-8 overflow-hidden animate-in fade-in duration-1000">
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 md:gap-10 overflow-y-auto pr-4 pb-20 custom-scrollbar no-scrollbar">
                {activeOrders.length === 0 && (
                  <div className="col-span-full h-[60vh] flex flex-col items-center justify-center space-y-8">
                     <div className="w-24 h-24 bg-white/5 rounded-[40px] flex items-center justify-center border border-white/5 animate-pulse">
                        <UtensilsCrossed className="w-12 h-12 text-slate-800" />
                     </div>
                     <div className="text-center space-y-2">
                        <p className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter italic">No Operational Sequences</p>
                        <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.4em]">Sector currently in standby mode.</p>
                     </div>
                  </div>
                )}
                {activeOrders.map(table => (
                  <div key={table.id} className="bg-[#0b1118] border border-white/[0.03] rounded-[48px] p-8 md:p-10 flex flex-col gap-8 hover:border-primary/40 transition-all group shadow-2xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -translate-y-16 translate-x-16" />
                     <div className="flex justify-between items-start relative">
                        <div className="flex items-center gap-5">
                           <div className="w-16 h-16 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center text-3xl font-black text-white italic shadow-2xl group-hover:text-primary transition-colors">
                              {table.table_number}
                           </div>
                           <div>
                              <h4 className="text-xl font-black uppercase italic tracking-tighter text-white leading-none mb-2">{table.activeOrder.customer_name}</h4>
                              <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2 italic">
                                 <Clock className="w-4 h-4" /> {new Date(table.activeOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                           </div>
                        </div>
                        <div className={cn(
                          "px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all duration-500",
                           table.activeOrder.status === 'ready' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-emerald-500/10' : 'bg-orange-500/10 border-orange-500/20 text-orange-500 shadow-orange-500/10'
                        )}>
                           {table.activeOrder.status}
                        </div>
                     </div>
                     <div className="space-y-4 flex-1">
                        {table.activeOrder.order_items.map((item: any) => (
                           <div key={item.id} className="flex justify-between items-center text-xs font-black uppercase italic tracking-tight">
                              <span className="text-slate-600 leading-none">{item.quantity}x {item.menu_items?.name}</span>
                              <span className="text-slate-800 leading-none">₹{item.total_price}</span>
                           </div>
                        ))}
                     </div>
                     <div className="pt-8 border-t border-white/[0.03] flex justify-between items-end relative">
                        <div className="space-y-1">
                           <p className="text-[9px] font-black text-slate-800 uppercase tracking-widest italic">Running Total</p>
                           <p className="text-4xl font-black text-white italic tracking-tighter leading-none shadow-2xl mt-1">₹{table.activeOrder.total_amount}</p>
                        </div>
                        <Button onClick={() => handleTableClick(table)} className="h-14 w-14 rounded-2xl bg-white/5 hover:bg-primary hover:text-black border border-white/10 flex items-center justify-center transition-all shadow-2xl active:scale-90">
                           <ChevronRight className="w-6 h-6" />
                        </Button>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </main>

      {/* Settlement Modal (Unchanged Logic, Enhanced UI) */}
      {isCheckoutOpen && selectedTable?.activeOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 backdrop-blur-3xl bg-black/80 animate-in fade-in duration-500">
          <div className="bg-[#05070a] w-full max-w-6xl rounded-[48px] md:rounded-[64px] border border-white/10 shadow-2xl overflow-hidden flex flex-col lg:flex-row h-full max-h-[90vh]">
            <div className="flex-1 p-10 md:p-16 overflow-y-auto space-y-12 border-r border-white/5 no-scrollbar custom-scrollbar relative">
              <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full -translate-y-32 -translate-x-32" />
              <div className="flex justify-between items-center relative">
                 <div className="space-y-2">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic leading-none">Resource Protocol</p>
                    <h3 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white leading-none">Guest <span className="text-slate-500">Settlement</span></h3>
                 </div>
                 <button onClick={() => setIsCheckoutOpen(false)} className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-500 hover:text-black transition-all border border-white/5"><X className="w-6 h-6" /></button>
              </div>
              <div className="space-y-6 relative">
                <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em] italic">Sequence Log</p>
                {selectedTable.activeOrder.order_items.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center font-black uppercase italic text-sm md:text-lg tracking-tighter">
                    <span className="text-slate-500 leading-none">{item.quantity}x {item.menu_items?.name}</span>
                    <span className="text-slate-800 leading-none">₹{item.total_price}</span>
                  </div>
                ))}
              </div>
              <div className="pt-12 border-t border-white/[0.03] space-y-6 relative">
                 {(() => {
                    const subtotal = selectedTable.activeOrder.total_amount || 0;
                    const cgst = (subtotal * (restaurant?.cgst_percent || 2.5)) / 100;
                    const sgst = (subtotal * (restaurant?.sgst_percent || 2.5)) / 100;
                    const service = (subtotal * (restaurant?.service_charge_percent || 5)) / 100;
                    const grandTotal = subtotal + cgst + sgst + service;
                    return (
                      <div className="space-y-4">
                        <div className="flex justify-between text-[11px] font-black text-slate-700 uppercase tracking-widest italic"><span>Operational Base</span><span>₹{subtotal.toFixed(2)}</span></div>
                        <div className="flex justify-between text-[11px] font-black text-slate-800 uppercase tracking-widest italic"><span>GST Modules ({restaurant?.cgst_percent + restaurant?.sgst_percent || 5}%)</span><span>₹{(cgst + sgst).toFixed(2)}</span></div>
                        <div className="flex justify-between text-[11px] font-black text-slate-800 uppercase tracking-widest italic"><span>Service Protocol ({restaurant?.service_charge_percent || 5}%)</span><span>₹{service.toFixed(2)}</span></div>
                        <div className="flex justify-between items-end pt-12 border-t border-white/10 mt-8">
                           <div className="space-y-1">
                              <span className="text-2xl font-black text-primary italic uppercase leading-none tracking-tighter">Total Liquidation</span>
                              <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] italic">Full resource synchronization</p>
                           </div>
                           <span className="text-7xl md:text-9xl font-black italic tracking-tighter text-white leading-none shadow-2xl">₹{grandTotal.toFixed(0)}</span>
                        </div>
                      </div>
                    )
                 })()}
              </div>
            </div>
            <div className="w-full lg:w-[450px] bg-white/[0.01] p-10 md:p-16 flex flex-col justify-between items-center border-l border-white/5 overflow-y-auto no-scrollbar custom-scrollbar relative">
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full translate-y-32 translate-x-32" />
              <div className="space-y-12 w-full relative">
                <div className="text-center space-y-3">
                   <p className="text-[11px] font-black uppercase tracking-[0.5em] text-primary leading-none">Transmission Channel</p>
                   <p className="text-xs font-black text-slate-800 uppercase tracking-widest leading-none">Merchant Paylink Matrix</p>
                </div>

                <div className="w-full aspect-square bg-white rounded-[48px] p-10 md:p-12 flex items-center justify-center shadow-2xl shadow-black relative group">
                  <div className="absolute inset-0 bg-primary/5 rounded-[48px] scale-110 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  {restaurant?.merchant_qr_url ? (
                    <img src={restaurant.merchant_qr_url} className="w-full h-full object-contain relative" alt="QR" />
                  ) : (
                    <QrCode className="w-20 h-20 text-slate-200 relative" />
                  )}
                </div>

                <div className="space-y-6 pt-10 border-t border-white/[0.03]">
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary text-center italic">Institutional Matrix</p>
                   <div className="grid grid-cols-1 gap-4">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                         <span className="text-slate-800 italic">Entity</span>
                         <span className="text-white italic tracking-tighter">{restaurant?.bank_details?.bank_name || 'NOT CONFIGURED'}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                         <span className="text-slate-800 italic">Resource ID</span>
                         <span className="text-white italic tracking-tighter">{restaurant?.bank_details?.account_number || 'NULL'}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                         <span className="text-slate-800 italic">IFSC Sequence</span>
                         <span className="text-white italic tracking-tighter">{restaurant?.bank_details?.ifsc || 'NULL'}</span>
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-800 text-center italic">Transmission Log Email</p>
                  <input 
                    placeholder="CLIENT@NETWORK.COM" 
                    value={customerEmail} 
                    onChange={(e) => setCustomerEmail(e.target.value)} 
                    className="w-full bg-black border border-white/5 rounded-[24px] px-8 py-6 text-[11px] font-black text-center text-white focus:border-primary/50 outline-none transition-all shadow-2xl tracking-widest" 
                  />
                </div>
              </div>
              <Button onClick={handleFinalCheckout} disabled={isProcessingPayment} className="w-full h-20 md:h-24 rounded-[32px] md:rounded-[40px] bg-primary text-black font-black uppercase tracking-[0.3em] text-sm shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all mt-12 relative">
                 {isProcessingPayment ? <Loader2 className="w-6 h-6 animate-spin" /> : "Commit Transaction"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
