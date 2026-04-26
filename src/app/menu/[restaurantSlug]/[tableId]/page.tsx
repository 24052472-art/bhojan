"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  ShoppingBag, 
  Search, 
  ChevronRight, 
  Star, 
  Minus, 
  Plus,
  Info,
  CreditCard,
  Building,
  QrCode as QrIcon,
  Loader2,
  ChefHat,
  Wifi,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function PublicMenu({ params }: { params: { restaurantSlug: string, tableId: string } }) {
  const [restaurant, setRestaurant] = useState<any>(null);
  const [menu, setMenu] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState<any[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [isLive, setIsLive] = useState(false);
  const [notification, setNotification] = useState<{ type: 'COOKED' | 'PREPARING', id: string } | null>(null);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isPageReady, setIsPageReady] = useState(false);

  const supabase = createClient();
  const channelRef = useRef<any>(null);
  const buzzerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchData();
    // Initialize notification sound
    buzzerRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
  }, []);

  async function fetchData() {
    setIsLoading(true);
    try {
      // 1. Fetch Restaurant
      const { data: resData, error: resError } = await supabase
        .from("restaurants")
        .select("*")
        .eq("slug", params.restaurantSlug)
        .single();
      
      if (resError || !resData) throw new Error("Restaurant not found");
      setRestaurant(resData);

      // 2. Fetch Menu
      const { data: menuData } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", resData.id)
        .eq("is_available", true);
      
      const items = menuData || [];
      setMenu(items);
      const cats = ["All", ...Array.from(new Set(items.map((i: any) => i.category)))];
      setCategories(cats);

      // 3. Check for existing order in localStorage
      const savedOrderId = localStorage.getItem(`order_${params.restaurantSlug}_${params.tableId}`);
      if (savedOrderId) {
        const { data: orderData } = await supabase
          .from("orders")
          .select("*, order_items(*, menu_items(*))")
          .eq("id", savedOrderId)
          .single();
        
        if (orderData && orderData.status !== 'completed') {
          setCurrentOrder(orderData);
        } else {
          localStorage.removeItem(`order_${params.restaurantSlug}_${params.tableId}`);
        }
      }

      setupRealtime(resData.id, savedOrderId);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function setupRealtime(resId: string, orderId?: string | null) {
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
    }

    const channelName = `bhojan-sync-${resId}`;
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: true } }
    });

    channel
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: orderId ? `id=eq.${orderId}` : undefined
      }, (payload: any) => {
        const newStatus = payload.new?.status;
        console.log("CUSTOMER: Status Update Received via DB", newStatus);
        
        if (newStatus === 'preparing') {
          triggerNotification('PREPARING');
        } else if (newStatus === 'ready') {
          triggerNotification('COOKED');
        }

        if (newStatus === 'completed') {
          localStorage.removeItem(`order_${params.restaurantSlug}_${params.tableId}`);
          setCurrentOrder(null);
        } else {
          setCurrentOrder((prev: any) => prev ? { ...prev, status: newStatus } : null);
        }
      })
      .on('broadcast', { event: 'refresh_customer' }, (payload: any) => {
        const { type, orderId: bOrderId } = payload.payload;
        console.log("CUSTOMER: Instant Broadcast Received", type, bOrderId);
        
        if (bOrderId === orderId) {
          triggerNotification(type);
          // Also update status locally for immediate UI feedback
          setCurrentOrder((prev: any) => prev ? { ...prev, status: type === 'PREPARING' ? 'preparing' : 'ready' } : null);
        }
      })
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;
  }

  function triggerNotification(type: 'COOKED' | 'PREPARING') {
    if (type === 'COOKED' && buzzerRef.current) {
      buzzerRef.current.play().catch(e => console.log("Audio blocked"));
    }
    setNotification({ id: Math.random().toString(), type });
    setTimeout(() => setNotification(null), type === 'PREPARING' ? 3000 : 6000);
  }

  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing?.quantity === 1) {
        return prev.filter((i) => i.id !== id);
      }
      return prev.map((i) => i.id === id ? { ...i, quantity: i.quantity - 1 } : i);
    });
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0 || !restaurant) return;
    setIsPlacingOrder(true);
    try {
      // 1. Get Table UUID
      const { data: tableData } = await supabase
        .from("tables")
        .select("id")
        .eq("restaurant_id", restaurant.id)
        .eq("table_number", params.tableId)
        .single();
      
      if (!tableData) throw new Error("Table invalid");

      // 2. Create Order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([{
          restaurant_id: restaurant.id,
          table_id: tableData.id,
          status: 'pending',
          payment_status: 'unpaid',
          total_amount: cart.reduce((acc, i) => acc + (i.price * i.quantity), 0),
          customer_name: "Self Service Guest"
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 3. Create Items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));
      await supabase.from("order_items").insert(orderItems);

      // 4. Update Table
      await supabase.from("tables").update({ status: 'occupied' }).eq("id", tableData.id);

      // 5. Broadcast to Staff
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'refresh_kitchen',
          payload: { type: 'NEW_ORDER' }
        });
        channelRef.current.send({
          type: 'broadcast',
          event: 'refresh_waiter',
          payload: { type: 'NEW_ORDER' }
        });
      }

      localStorage.setItem(`order_${params.restaurantSlug}_${params.tableId}`, order.id);
      setCurrentOrder(order);
      setCart([]);
      setShowCheckout(false);
      toast.success("Order Placed Successfully!");
      
      // Refresh Realtime with new filter
      setupRealtime(restaurant.id, order.id);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = subtotal * 0.05;
  const grandTotal = subtotal + tax;

  const filteredMenu = selectedCategory === "All" ? menu : menu.filter(i => i.category === selectedCategory);

  if (isLoading) return (
    <div className="min-h-screen bg-[#020617] p-6 space-y-8 overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse" />
          <div className="space-y-2">
            <div className="w-24 h-4 bg-white/5 rounded animate-pulse" />
            <div className="w-16 h-2 bg-white/5 rounded animate-pulse" />
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/5 animate-pulse" />
      </div>
      <div className="w-full h-48 rounded-[40px] bg-white/5 animate-pulse" />
      <div className="flex gap-3 overflow-hidden">
        {[1,2,3,4].map(i => <div key={i} className="min-w-[100px] h-10 rounded-full bg-white/5 animate-pulse" />)}
      </div>
      <div className="space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="w-full h-32 rounded-[32px] bg-white/5 animate-pulse" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-32 selection:bg-[#00d4ff]/30">
      {/* Realtime Status Badge */}
      <div className={cn(
        "fixed top-4 right-4 z-[100] px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-2 border transition-all duration-500",
        isLive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500 animate-pulse'
      )}>
        <Wifi className="w-3 h-3" />
        {isLive ? 'Live Connection' : 'Sync Offline'}
      </div>

      {/* Status Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            key={notification.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xl pointer-events-none"
          >
            <div className={cn(
              "p-20 rounded-[100px] border-8 flex flex-col items-center gap-10 shadow-[0_0_200px_rgba(0,0,0,1)]",
              notification.type === 'COOKED' ? 'bg-emerald-500 border-emerald-400' : 'bg-orange-500 border-orange-400'
            )}>
              <motion.div 
                animate={{ 
                  scale: [1, 1.3, 1],
                  rotate: [0, 15, -15, 0]
                }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="text-[200px] leading-none"
              >
                {notification.type === 'COOKED' ? '🍳' : '🔥'}
              </motion.div>
              <h2 className="text-8xl font-black italic uppercase tracking-tighter text-black leading-none text-center">
                {notification.type === 'COOKED' ? 'FOOD READY!' : 'COOKING!'}
              </h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Order Status Screen (Matches Screenshot) */}
      <AnimatePresence>
        {currentOrder && !showCheckout && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-[#020617] flex flex-col p-8 overflow-y-auto no-scrollbar"
          >
            {/* Immersive Background Elements */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#00d4ff]/10 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#00ff88]/5 blur-[150px] pointer-events-none" />

            <div className="relative flex-1 flex flex-col items-center pt-12">
               <div className="mb-12 text-center">
                  <h1 className="text-xl font-black italic uppercase tracking-[0.3em] text-[#00d4ff]">BHOJAN <span className="text-white">SYNC</span></h1>
                  <div className="flex items-center justify-center gap-2 mt-3">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-ping" />
                     <p className="text-[9px] font-black text-[#00ff88] uppercase tracking-widest">Tracking Live Table {params.tableId}</p>
                  </div>
               </div>

               {/* Advanced Progress UI */}
               <div className="w-full max-w-sm space-y-16 mb-16">
                  <div className="flex justify-between relative">
                     {/* Progress Line */}
                     <div className="absolute top-6 left-0 right-0 h-0.5 bg-white/5 mx-6">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: currentOrder.status === 'pending' ? '15%' : currentOrder.status === 'preparing' ? '50%' : '100%' }}
                          className="h-full bg-gradient-to-r from-[#00d4ff] to-[#00ff88] shadow-[0_0_15px_#00d4ff]"
                        />
                     </div>
                     
                     {[
                       { step: 'pending', icon: Building, label: 'Received' },
                       { step: 'preparing', icon: ChefHat, label: 'Cooking' },
                       { step: 'ready', icon: CheckCircle2, label: 'Ready' }
                     ].map((s, idx) => {
                       const isActive = currentOrder.status === s.step;
                       const isPast = (s.step === 'pending' && (currentOrder.status === 'preparing' || currentOrder.status === 'ready')) || 
                                    (s.step === 'preparing' && currentOrder.status === 'ready');
                       
                       return (
                         <div key={s.step} className="relative z-10 flex flex-col items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-700",
                              isActive ? "bg-black border-[#00d4ff] shadow-[0_0_20px_rgba(0,212,255,0.4)] scale-125" : 
                              isPast ? "bg-[#00ff88] border-[#00ff88] text-black" : 
                              "bg-[#020617] border-white/10 text-white/20"
                            )}>
                               <s.icon className={cn("w-5 h-5", isActive ? "text-[#00d4ff] animate-pulse" : isPast ? "text-black" : "")} />
                            </div>
                            <span className={cn(
                              "text-[8px] font-black uppercase tracking-widest italic transition-colors duration-700",
                              isActive ? "text-[#00d4ff]" : isPast ? "text-[#00ff88]" : "text-white/20"
                            )}>{s.label}</span>
                         </div>
                       )
                     })}
                  </div>

                  <div className="text-center space-y-4">
                     <motion.h2 
                       animate={{ opacity: [0.5, 1, 0.5] }}
                       transition={{ repeat: Infinity, duration: 2 }}
                       className="text-5xl font-black italic uppercase tracking-tighter text-white"
                     >
                       {currentOrder.status === 'pending' ? 'SECURED' : currentOrder.status === 'preparing' ? 'CRAFTING' : 'READY'}
                     </motion.h2>
                     <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] max-w-[200px] mx-auto leading-relaxed">
                       {currentOrder.status === 'pending' ? 'ORDER IS IN THE QUEUE.' : 
                        currentOrder.status === 'preparing' ? 'CHEF IS WORKING THEIR MAGIC.' : 
                        'GATHER YOUR TOOLS, IT IS SERVED.'}
                     </p>
                  </div>
               </div>

               {/* Order Summary Glass Card */}
               <div className="w-full max-w-sm bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[40px] p-8 mb-12">
                  <div className="flex justify-between items-center mb-6">
                     <p className="text-[10px] font-black text-white/20 uppercase tracking-widest italic">In Preparation</p>
                     <span className="text-[10px] font-black text-[#00d4ff] italic uppercase">ID: #{currentOrder.id?.slice(-4)}</span>
                  </div>
                  <div className="space-y-4">
                     {cart.length > 0 ? cart.map((item, i) => (
                       <div key={i} className="flex justify-between items-center">
                          <p className="text-sm font-black italic text-white uppercase truncate pr-4">{item.name}</p>
                          <span className="text-xs font-black text-[#00ff88] italic">×{item.quantity}</span>
                       </div>
                     )) : (
                       <p className="text-[10px] font-black text-white/40 uppercase text-center italic">Synchronizing Menu Items...</p>
                     )}
                  </div>
               </div>

               <div className="w-full max-w-sm space-y-4">
                  <button 
                    onClick={() => setCurrentOrder(null)}
                    className="w-full h-16 rounded-[24px] bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-[#00d4ff] transition-all shadow-2xl active:scale-95"
                  >
                    ADD MORE FLAVORS
                  </button>
                  <button className="w-full h-16 rounded-[24px] bg-white/5 border border-white/10 text-white/40 font-black uppercase tracking-widest text-[9px] italic">
                    NEED ASSISTANCE?
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-40 bg-[#020617]/80 backdrop-blur-2xl border-b border-white/5 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#00d4ff] to-[#00ff88] rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative w-12 h-12 rounded-full bg-black border border-white/10 flex items-center justify-center text-[#00d4ff] font-black italic text-xl shadow-2xl">
              {restaurant?.name?.charAt(0) || 'B'}
            </div>
          </div>
          <div>
            <h1 className="text-xl font-black italic uppercase tracking-tighter text-white leading-none">{restaurant?.name || 'Bhojan'}</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
              <p className="text-[9px] text-[#00ff88] font-black uppercase tracking-[0.2em]">Live at Station {params.tableId}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-5">
           <button className="text-white/40 hover:text-[#00d4ff] transition-colors"><Search className="w-6 h-6" /></button>
           <button className="relative group">
             <div className="absolute -inset-2 bg-[#00d4ff]/20 rounded-full blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
             <ShoppingBag className="w-6 h-6 text-white relative" />
             {cart.length > 0 && (
               <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#00d4ff] text-black text-[10px] font-black flex items-center justify-center rounded-full shadow-[0_0_15px_rgba(0,212,255,0.5)]">
                 {cart.length}
               </span>
             )}
           </button>
        </div>
      </header>

      {/* Hero / Brand Experience */}
      <section className="px-6 py-8">
        <div className="relative h-64 rounded-[48px] overflow-hidden group shadow-2xl border border-white/10">
          <img 
            src={restaurant?.banner_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800"} 
            alt="Restaurant" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3s]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8">
            <div className="flex items-center gap-2 text-[10px] font-black text-[#00ff88] uppercase tracking-[0.3em] mb-3">
              <Star className="w-3.5 h-3.5 fill-[#00ff88]" />
              Signature Dining Experience
            </div>
            <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white leading-[0.9] max-w-[250px]">
              TASTE THE <span className="text-[#00d4ff]">FUTURE</span>
            </h2>
            <div className="flex items-center gap-5 mt-6">
               <div className="px-4 py-2 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60">
                 <Building className="w-4 h-4 text-[#00d4ff]" /> {restaurant?.city || 'Premium'}
               </div>
               <div className="px-4 py-2 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60">
                 <Wifi className="w-4 h-4 text-[#00ff88]" /> Instant Order
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Sections / Dynamic Grid */}
      <section className="px-4 pb-40 relative">
        <div className="space-y-12">
          {categories.filter(c => c !== "All").map((category) => (
            <div key={category} id={`category-${category}`} className="space-y-6 scroll-mt-28">
              <div className="flex items-center gap-4 ml-2">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">{category}</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
              </div>
              <div className="space-y-4">
                {menu.filter(i => i.category === category).map((item) => (
                  <motion.div 
                    layout
                    key={item.id} 
                    className="group relative bg-white/[0.03] backdrop-blur-2xl p-4 rounded-[32px] border border-white/10 flex gap-5 hover:border-[#00d4ff]/50 transition-all duration-500 overflow-hidden shadow-2xl"
                  >
                    {/* Glowing background effect */}
                    <div className="absolute -inset-20 bg-[#00d4ff]/5 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    
                    <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-[24px] overflow-hidden bg-white/5 shrink-0 border border-white/5">
                      <img 
                        src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"} 
                        alt={item.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" 
                      />
                      {item.price > 150 && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-black/80 backdrop-blur-md rounded-lg border border-[#00ff88]/30 flex items-center gap-1">
                           <div className="w-1 h-1 rounded-full bg-[#00ff88] shadow-[0_0_5px_#00ff88]" />
                           <span className="text-[7px] font-black text-[#00ff88] uppercase tracking-widest leading-none">Popular</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="relative flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                           <div className={cn("w-2.5 h-2.5 rounded-sm border border-black shadow-sm", item.is_veg ? "bg-[#00ff88]" : "bg-red-500")} />
                           <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{item.is_veg ? 'Pure Veg' : 'Non-Veg'}</span>
                        </div>
                        <h4 className="text-xl font-black italic uppercase tracking-tighter text-white group-hover:text-[#00d4ff] transition-colors leading-tight">{item.name}</h4>
                        <p className="text-[11px] text-white/40 font-bold uppercase tracking-wide line-clamp-2 mt-1.5 italic leading-relaxed">{item.description || 'A masterpiece of culinary engineering.'}</p>
                      </div>
                      <div className="flex justify-between items-end mt-4">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black text-[#00d4ff] uppercase tracking-widest leading-none mb-1">Premium</span>
                           <span className="text-2xl font-black italic tracking-tighter text-white leading-none">₹{item.price}</span>
                        </div>
                        
                        {cart.find(i => i.id === item.id) ? (
                          <div className="flex items-center gap-5 bg-white/5 backdrop-blur-xl text-white px-4 py-2 rounded-2xl border border-white/10 shadow-2xl">
                            <button onClick={() => removeFromCart(item.id)} className="hover:text-red-500 transition-colors"><Minus className="w-5 h-5" /></button>
                            <span className="text-base font-black italic">{cart.find(i => i.id === item.id).quantity}</span>
                            <button onClick={() => addToCart(item)} className="hover:text-[#00ff88] transition-colors"><Plus className="w-5 h-5" /></button>
                          </div>
                        ) : (
                          <motion.button 
                            whileTap={{ scale: 0.95 }}
                            onClick={() => addToCart(item)}
                            className="bg-[#00d4ff] text-black px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_10px_20px_rgba(0,212,255,0.3)] hover:shadow-[#00d4ff]/50 transition-all active:scale-95"
                          >
                            ADD ITEM
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Smart Recommendations Bridge */}
              <div className="py-6 px-4 rounded-[40px] bg-gradient-to-br from-[#00d4ff]/5 to-transparent border border-white/5">
                <p className="text-[10px] font-black text-[#00d4ff] uppercase tracking-[0.3em] mb-4 italic leading-none">Frequently Paired With</p>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                  {menu.slice(0, 3).map(rec => (
                    <div key={rec.id} className="min-w-[140px] space-y-3 group cursor-pointer" onClick={() => addToCart(rec)}>
                      <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/10">
                        <img src={rec.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <Plus className="w-6 h-6 text-[#00d4ff]" />
                        </div>
                      </div>
                      <p className="text-[10px] font-black text-white uppercase tracking-tighter truncate leading-none">{rec.name}</p>
                      <p className="text-[9px] font-black text-[#00ff88] leading-none tracking-widest">+ ₹{rec.price}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Floating Menu Button */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40">
        <button 
          onClick={() => setShowCategoryMenu(true)}
          className="bg-gray-900 text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl active:scale-95 transition-all"
        >
          <div className="flex flex-col gap-0.5">
            <div className="w-4 h-0.5 bg-white rounded-full" />
            <div className="w-4 h-0.5 bg-white rounded-full" />
            <div className="w-4 h-0.5 bg-white rounded-full" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest">Menu</span>
        </button>
      </div>

      {/* Sticky Cart Bar (Bhojan Next-Gen) */}
      <AnimatePresence>
        {cart.length > 0 && !showCheckout && (
          <motion.div 
            initial={{ y: 100, scale: 0.9, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 100, scale: 0.9, opacity: 0 }}
            className="fixed bottom-8 left-4 right-4 z-50"
          >
            <button 
              onClick={() => setShowCheckout(true)}
              className="w-full bg-[#00ff88] h-20 rounded-[32px] flex items-center justify-between px-8 shadow-[0_20px_40px_rgba(0,255,136,0.2)] group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              
              <div className="flex items-center gap-5 relative">
                 <div className="bg-black/20 p-3 rounded-2xl backdrop-blur-md">
                    <ShoppingBag className="w-6 h-6 text-black" />
                 </div>
                 <div className="text-left">
                    <p className="text-[10px] text-black/60 font-black uppercase tracking-[0.2em]">{cart.reduce((a,b) => a+b.quantity, 0)} SELECTIONS</p>
                    <p className="text-2xl text-black font-black italic">₹{subtotal}</p>
                 </div>
              </div>
              <div className="flex items-center gap-2 text-black font-black text-sm uppercase tracking-[0.2em] relative">
                VIEW BUCKET <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Sheet (Ultra-Premium) */}
      <AnimatePresence>
        {showCheckout && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCheckout(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[60]"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="fixed bottom-0 left-0 right-0 bg-[#020617] rounded-t-[50px] z-[70] p-10 max-h-[90vh] overflow-y-auto no-scrollbar border-t border-white/10 shadow-[0_-20px_100px_rgba(0,0,0,1)]"
            >
              <div className="w-16 h-1.5 bg-white/10 rounded-full mx-auto mb-10" />
              
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h3 className="text-4xl font-black italic uppercase tracking-tighter text-white">YOUR <span className="text-[#00d4ff]">SELECTIONS</span></h3>
                  <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em] mt-2 italic">Premium Order Experience</p>
                </div>
                <button 
                  onClick={() => setShowCheckout(false)}
                  className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="space-y-6 mb-12">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-white/[0.02] p-5 rounded-[32px] border border-white/5 group">
                    <div className="flex items-center gap-5">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl">
                        <img src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      </div>
                      <div>
                        <p className="font-black italic uppercase text-lg text-white group-hover:text-[#00d4ff] transition-colors">{item.name}</p>
                        <p className="text-[11px] font-black text-[#00ff88] mt-1.5 italic tracking-widest">₹{item.price}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
                      <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center text-white/20 hover:text-red-500 transition-colors"><Minus className="w-4 h-4" /></button>
                      <span className="font-black text-white text-base italic w-4 text-center">{item.quantity}</span>
                      <button onClick={() => addToCart(item)} className="w-8 h-8 flex items-center justify-center text-[#00d4ff] hover:scale-110 transition-transform"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-8 border-t border-white/5 mb-12">
                <div className="flex justify-between items-center">
                  <span className="text-white/30 font-black uppercase tracking-[0.2em] text-[10px]">Subtotal</span>
                  <span className="text-white font-black italic">₹{subtotal}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/30 font-black uppercase tracking-[0.2em] text-[10px]">Taxes & Service (5%)</span>
                  <span className="text-white font-black italic">₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-6 border-t border-white/10">
                  <span className="text-white font-black italic text-xl uppercase tracking-tighter">Grand Total</span>
                  <span className="text-[#00ff88] font-black italic text-4xl tracking-tighter shadow-[#00ff88]/10 drop-shadow-2xl">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder || cart.length === 0}
                className="w-full h-20 rounded-[30px] bg-gradient-to-r from-[#00d4ff] to-[#00ff88] text-black text-2xl font-black italic uppercase tracking-tighter shadow-[0_20px_50px_rgba(0,212,255,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 group"
              >
                {isPlacingOrder ? <Loader2 className="w-8 h-8 animate-spin" /> : (
                  <>
                    <CheckCircle2 className="w-7 h-7 group-hover:rotate-12 transition-transform" />
                    CONFIRM ORDER
                  </>
                )}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
