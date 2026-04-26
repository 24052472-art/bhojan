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
    
    // Use a unique name to avoid conflict with existing channels in the cache
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
    if (!selectedTable) return toast.error("Please select a table first!");
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
    toast.success("Dish removed from bucket");
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
    if (cart.length === 0) return toast.error("Bucket is empty!");
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
          customer_name: customer.name || "Guest",
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
      toast.success("Preparation Started!");
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
        settled_by: `Waiter: ${profile?.full_name || 'Staff'}`,
        settled_at: new Date().toISOString()
      }).eq("id", selectedTable.activeOrder.id);
      
      if (orderError) throw orderError;

      const { error: tableError } = await supabase.from("tables").update({ status: 'available' }).eq("id", selectedTable.id);
      
      if (!tableError) {
        toast.success(`Station ${selectedTable.table_number} is now Available!`);
      }
      
      if (customerEmail) {
        await sendReceiptEmail({
          email: customerEmail,
          orderId: selectedTable.activeOrder.id,
          customerName: customer.name || "Guest",
          items: selectedTable.activeOrder.order_items,
          total: grandTotal,
          restaurantName: restaurant?.name || "Bhojan Restaurant"
        });
        toast.success(`Receipt sent to ${customerEmail}`);
      }

      toast.success("Transaction Finalized!");
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
    <div className="min-h-screen bg-[#05070a] text-slate-300 flex flex-col font-sans overflow-hidden">
      <div className={`fixed top-4 right-4 z-[200] px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-2 border ${isLive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
         <Wifi className={`w-3 h-3 ${isLive ? '' : 'animate-pulse'}`} />
         {isLive ? 'LIVE SYNC V3' : 'SYNC OFFLINE'}
      </div>

      <header className="px-8 py-5 flex items-center justify-between sticky top-0 z-50 bg-[#05070a]/95 backdrop-blur-3xl border-b border-white/[0.03]">
        <div className="flex items-center gap-5">
          {selectedTable && (
            <button onClick={() => setSelectedTable(null)} className="h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all active:scale-90">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="flex flex-col">
            <h1 className="text-lg font-black italic tracking-tighter uppercase leading-none text-white">
              {selectedTable ? `STATION T-${selectedTable.table_number}` : 'SERVICE HUB'}
            </h1>
            <span className="text-[7px] font-black uppercase tracking-[0.4em] mt-1 text-slate-600">{profile?.full_name || 'Waiter'}</span>
          </div>
        </div>

        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
          {(['tables', 'menu', 'orders'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab !== 'menu') setSelectedTable(null);
              }}
              className={`px-6 py-2 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] transition-all ${
                activeTab === tab ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 p-6 max-w-[1800px] mx-auto w-full flex flex-col relative z-10 overflow-hidden">
        {activeTab === 'tables' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-5 overflow-y-auto pr-2 custom-scrollbar no-scrollbar">
            {tables.map((table) => {
              const status = table.activeOrder?.status;
              const isReady = status === 'ready';
              const isOccupied = table.status === 'occupied';
              return (
                <button
                  key={table.id}
                  onClick={() => handleTableClick(table)}
                  className={`relative aspect-square rounded-[32px] border transition-all duration-500 flex flex-col items-center justify-center gap-1.5 ${
                    isOccupied 
                      ? isReady 
                        ? 'border-emerald-500/50 bg-emerald-500/5' 
                        : 'border-orange-500/50 bg-orange-500/5'
                      : 'border-white/5 bg-white/[0.01] hover:border-primary/20 hover:bg-white/[0.03]'
                  }`}
                >
                  {isOccupied && (
                    <div className="absolute top-4 right-4">
                      {isReady ? <Bell className="w-4 h-4 text-emerald-500 animate-bounce" /> : <Flame className="w-4 h-4 text-orange-500 animate-pulse" />}
                    </div>
                  )}
                  <span className="text-2xl font-black italic tracking-tighter text-white">{table.table_number}</span>
                  <span className="text-[7px] font-black uppercase tracking-widest opacity-20">{table.status}</span>
                </button>
              );
            })}
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="flex flex-col lg:flex-row gap-8 flex-1 overflow-hidden relative">
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
               <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-5 py-2.5 rounded-lg text-[7.5px] font-black uppercase tracking-widest transition-all border ${
                        selectedCategory === cat ? 'bg-primary text-black border-primary' : 'bg-white/5 text-slate-500 border-white/5 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 overflow-y-auto pr-4 pb-20 custom-scrollbar no-scrollbar">
                 {filteredMenu.map((item) => (
                   <div 
                    key={item.id} 
                    onClick={() => addToCart(item)} 
                    className="bg-white/[0.01] border border-white/[0.05] rounded-[24px] p-5 flex items-center gap-5 relative group hover:border-primary/30 hover:bg-white/[0.03] transition-all duration-300 cursor-pointer active:scale-95 shadow-lg"
                   >
                     <div className={`absolute top-4 right-4 w-1 h-1 rounded-full ${item.is_veg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                     <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex-shrink-0 flex items-center justify-center text-xl font-black text-primary uppercase italic">
                       {item.name.charAt(0)}
                     </div>
                     <div className="flex-1 min-w-0">
                       <h4 className="text-sm font-black uppercase italic tracking-tighter leading-tight text-white group-hover:text-primary transition-colors">{item.name}</h4>
                       <div className="flex items-center gap-3 mt-1.5">
                         <span className="text-lg font-black text-white italic">₹{item.price}</span>
                         <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-all">
                            <Plus className="w-3 h-3" />
                         </div>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>

            {selectedTable && (
              <div className="w-full lg:w-[320px] flex flex-col gap-4 h-full animate-in slide-in-from-right duration-500">
                <div className={`flex-1 bg-[#0b1118]/90 backdrop-blur-3xl rounded-[40px] border flex flex-col shadow-2xl overflow-hidden transition-all duration-300 ${isBucketPulsing ? 'border-primary/50 scale-[1.02]' : 'border-white/5'}`}>
                    <div className="px-6 pt-6 pb-4 border-b border-white/[0.03] space-y-3">
                      <div className="bg-black/40 rounded-2xl p-3 flex items-center justify-between border border-white/5">
                          <div className="flex items-center gap-3">
                            <ShoppingCart className="w-4 h-4 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-tighter text-white">Punch Pad T-{selectedTable.table_number}</span>
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative group">
                           <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 group-focus-within:text-primary transition-colors" />
                           <input 
                              type="text" 
                              placeholder="GUEST NAME" 
                              value={customer.name}
                              onChange={(e) => setCustomer(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full bg-black/20 border border-white/5 rounded-xl pl-8 pr-3 py-2.5 text-[8px] font-black uppercase tracking-widest text-white placeholder:text-slate-700 focus:border-primary/30 focus:bg-primary/5 outline-none transition-all"
                           />
                        </div>
                        <div className="relative group">
                           <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 group-focus-within:text-primary transition-colors" />
                           <input 
                              type="text" 
                              placeholder="PHONE NO" 
                              value={customer.phone}
                              onChange={(e) => setCustomer(prev => ({ ...prev, phone: e.target.value }))}
                              className="w-full bg-black/20 border border-white/5 rounded-xl pl-8 pr-3 py-2.5 text-[8px] font-black uppercase tracking-widest text-white placeholder:text-slate-700 focus:border-primary/30 focus:bg-primary/5 outline-none transition-all"
                           />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar no-scrollbar">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center justify-between group/item">
                          <div className="flex-1"><p className="font-black uppercase italic text-[11px] text-white leading-none">{item.name}</p></div>
                          <div className="flex items-center gap-2 bg-black/40 rounded-lg p-1">
                            <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 hover:text-red-500"><Minus className="w-2 h-2" /></button>
                            <span className="font-black text-primary text-[10px]">{item.qty}</span>
                            <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 hover:text-primary"><Plus className="w-2 h-2" /></button>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="ml-2 text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      ))}
                      {selectedTable.activeOrder && (
                        <div className="pt-4 border-t border-white/5 opacity-30 space-y-2">
                          {selectedTable.activeOrder.order_items.map((item: any) => (
                            <div key={item.id} className="flex justify-between text-[9px] font-black uppercase">
                              <span>{item.quantity}x {item.menu_items?.name}</span>
                              <span>₹{item.total_price}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="p-6 bg-black/20 space-y-4">
                      <div className="flex justify-between items-end">
                        <p className="text-4xl font-black text-white italic tracking-tighter">₹{cart.reduce((acc, curr) => acc + (curr.price * curr.qty), selectedTable.activeOrder?.total_amount || 0)}</p>
                      </div>
                      <Button onClick={handlePlaceOrder} disabled={isLoading || cart.length === 0} className="w-full h-14 rounded-2xl bg-primary text-black font-black uppercase tracking-widest text-[9px]">Transmit</Button>
                      {selectedTable.activeOrder && (
                        <Button onClick={() => setIsCheckoutOpen(true)} className="w-full h-12 rounded-2xl bg-white text-black font-black uppercase text-[8px] tracking-widest">Final Settlement</Button>
                      )}
                    </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="flex-1 flex flex-col gap-6 overflow-hidden animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 overflow-y-auto pr-4 custom-scrollbar no-scrollbar">
                {activeOrders.length === 0 && (
                  <div className="col-span-full h-[60vh] flex flex-col items-center justify-center opacity-10 space-y-4">
                     <UtensilsCrossed className="w-20 h-20" />
                     <p className="text-xs font-black uppercase tracking-[0.5em]">No Active Tables</p>
                  </div>
                )}
                {activeOrders.map(table => (
                  <div key={table.id} className="bg-white/[0.01] border border-white/[0.05] rounded-[40px] p-8 flex flex-col gap-6 hover:border-primary/20 transition-all group">
                     <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl font-black text-white italic">
                              {table.table_number}
                           </div>
                           <div>
                              <h4 className="text-lg font-black uppercase italic tracking-tighter text-white">{table.activeOrder.customer_name}</h4>
                              <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1 flex items-center gap-2">
                                 <Clock className="w-3 h-3" /> {new Date(table.activeOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                           </div>
                        </div>
                        <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                           table.activeOrder.status === 'ready' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-orange-500/10 border-orange-500/20 text-orange-500'
                        }`}>
                           {table.activeOrder.status}
                        </div>
                     </div>
                     <div className="space-y-3">
                        {table.activeOrder.order_items.map((item: any) => (
                           <div key={item.id} className="flex justify-between items-center text-[10px] font-black uppercase italic">
                              <span className="text-slate-400">{item.quantity}x {item.menu_items?.name}</span>
                              <span className="text-slate-600">₹{item.total_price}</span>
                           </div>
                        ))}
                     </div>
                     <div className="pt-6 border-t border-white/5 flex justify-between items-end">
                        <div>
                           <p className="text-[7px] font-black text-slate-700 uppercase tracking-widest">Running Total</p>
                           <p className="text-3xl font-black text-white italic tracking-tighter mt-1">₹{table.activeOrder.total_amount}</p>
                        </div>
                        <Button onClick={() => handleTableClick(table)} className="h-12 w-12 rounded-2xl bg-white/5 hover:bg-primary hover:text-black border border-white/10 flex items-center justify-center transition-all">
                           <ChevronRight className="w-5 h-5" />
                        </Button>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </main>

      {/* Settlement Modal (Unchanged) */}
      {isCheckoutOpen && selectedTable?.activeOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 backdrop-blur-3xl bg-black/60 animate-in fade-in">
          <div className="bg-[#0b1218] w-full max-w-4xl rounded-[48px] border border-white/5 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[75vh]">
            <div className="flex-1 p-12 overflow-y-auto space-y-10 border-r border-white/5 no-scrollbar">
              <div className="flex justify-between items-center">
                 <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white">Guest <span className="text-primary">Invoice</span></h3>
                 <button onClick={() => setIsCheckoutOpen(false)} className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-4">
                {selectedTable.activeOrder.order_items.map((item: any) => (
                  <div key={item.id} className="flex justify-between font-black uppercase italic text-[11px]">
                    <span className="text-slate-300">{item.quantity}x {item.menu_items?.name}</span>
                    <span className="text-slate-600">₹{item.total_price}</span>
                  </div>
                ))}
              </div>
              <div className="pt-8 border-t border-white/5 space-y-3">
                 {(() => {
                    const subtotal = selectedTable.activeOrder.total_amount || 0;
                    const cgst = (subtotal * (restaurant?.cgst_percent || 2.5)) / 100;
                    const sgst = (subtotal * (restaurant?.sgst_percent || 2.5)) / 100;
                    const service = (subtotal * (restaurant?.service_charge_percent || 5)) / 100;
                    const grandTotal = subtotal + cgst + sgst + service;
                    return (
                      <>
                        <div className="flex justify-between text-[8px] font-bold text-slate-500 uppercase tracking-widest"><span>Net Amount</span><span>₹{subtotal.toFixed(2)}</span></div>
                        <div className="flex justify-between items-end pt-8 border-t border-white/10 mt-4">
                           <span className="text-xl font-black text-primary italic uppercase leading-none">Total Due</span>
                           <span className="text-6xl font-black italic tracking-tighter text-white leading-none">₹{grandTotal.toFixed(0)}</span>
                        </div>
                      </>
                    )
                 })()}
              </div>
            </div>
            <div className="w-full md:w-[320px] bg-primary/[0.02] p-12 flex flex-col justify-between items-center border-l border-white/5">
              <div className="space-y-8 w-full text-center">
                <div className="w-full aspect-square bg-white rounded-[32px] p-6 flex items-center justify-center">
                  {restaurant?.qr_code_url ? <img src={restaurant.qr_code_url} className="w-full h-full object-contain" /> : <QrCode className="w-12 h-12 text-slate-300" />}
                </div>
                <input placeholder="EMAIL RECEIPT" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="w-full bg-[#05070a] border border-white/5 rounded-xl px-4 py-3 text-[8px] font-black text-center" />
              </div>
              <Button onClick={handleFinalCheckout} disabled={isProcessingPayment} className="w-full h-16 rounded-[24px] bg-primary text-black font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/10">
                 {isProcessingPayment ? <Loader2 className="w-5 h-5 animate-spin" /> : "Paid & Close Table"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
