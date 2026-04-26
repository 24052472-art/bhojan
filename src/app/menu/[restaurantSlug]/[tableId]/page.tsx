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
  Wifi
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
        console.log("CUSTOMER: Status Update Received", newStatus);
        
        if (newStatus === 'preparing') {
          triggerNotification('PREPARING');
        } else if (newStatus === 'ready') {
          triggerNotification('COOKED');
        }

        if (newStatus === 'completed') {
          localStorage.removeItem(`order_${params.restaurantSlug}_${params.tableId}`);
          setCurrentOrder(null);
        } else {
          setCurrentOrder(prev => prev ? { ...prev, status: newStatus } : null);
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
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 pb-32">
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
            initial={{ opacity: 0, scale: 0.5, y: -100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -100 }}
            className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
          >
            <div className={cn(
              "p-12 rounded-[64px] border-4 flex flex-col items-center gap-6 shadow-[0_0_100px_rgba(0,0,0,0.5)]",
              notification.type === 'COOKED' ? 'bg-emerald-500 border-emerald-400' : 'bg-orange-500 border-orange-400'
            )}>
              <div className="text-9xl animate-bounce">
                {notification.type === 'COOKED' ? '🍳' : '🔥'}
              </div>
              <h2 className="text-6xl font-black italic uppercase tracking-tighter text-black leading-none">
                {notification.type === 'COOKED' ? 'READY!' : 'COOKING!'}
              </h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-40 glass border-b border-white/5 p-6 rounded-b-[40px] flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none">{restaurant?.name || 'Bhojan'}</h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-2">
            STATION <span className="text-primary">{params.tableId}</span>
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 shadow-2xl">
          <ChefHat className="w-6 h-6 text-primary" />
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-8">
        <div className="relative h-56 rounded-[40px] overflow-hidden shadow-2xl border border-white/5">
          <img 
            src={restaurant?.banner_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800"} 
            alt="Restaurant" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent" />
          <div className="absolute bottom-8 left-8">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">{restaurant?.name}</h2>
            <div className="flex items-center gap-3 mt-2">
              <Star className="w-4 h-4 text-primary fill-primary" />
              <span className="text-sm font-black italic uppercase">Premium Experience</span>
            </div>
          </div>
        </div>
      </section>

      {/* Current Order Tracker */}
      {currentOrder && (
        <section className="px-6 mb-8">
          <div className="bg-primary/10 border border-primary/20 p-6 rounded-[32px] flex items-center justify-between shadow-2xl shadow-primary/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center animate-pulse">
                <ChefHat className="w-6 h-6 text-black" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">Live Order Status</p>
                <p className="text-xl font-black uppercase italic tracking-tighter text-white">
                  {currentOrder.status === 'pending' ? 'Received' : currentOrder.status.toUpperCase()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Station</p>
              <p className="text-xl font-black text-white italic">{params.tableId}</p>
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="px-6 mb-8 overflow-x-auto no-scrollbar flex gap-3">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "whitespace-nowrap px-8 py-3.5 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl border",
              selectedCategory === cat
                ? "bg-primary text-black border-primary"
                : "bg-white/5 text-slate-500 border-white/5 hover:text-white"
            )}
          >
            {cat}
          </button>
        ))}
      </section>

      {/* Menu Items */}
      <section className="px-6 space-y-4">
        {filteredMenu.map((item) => (
          <motion.div 
            layout
            key={item.id} 
            onClick={() => !cart.find(i => i.id === item.id) && addToCart(item)}
            className="bg-white/[0.02] border border-white/[0.03] p-4 rounded-[32px] flex gap-5 group hover:border-primary/50 transition-all duration-500 cursor-pointer shadow-2xl"
          >
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-[24px] md:rounded-[30px] overflow-hidden bg-white/5 border border-white/5 shrink-0 shadow-2xl">
              <img src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            </div>
            <div className="flex-1 flex flex-col justify-between py-1">
              <div>
                <div className="flex justify-between items-start">
                  <h4 className="text-lg md:text-xl font-black uppercase italic tracking-tighter group-hover:text-primary transition-colors">{item.name}</h4>
                  <div className={cn("w-3 h-3 rounded-full shadow-2xl", item.is_veg ? 'bg-emerald-500' : 'bg-red-500')} />
                </div>
                <p className="text-[10px] md:text-[11px] font-black text-slate-700 uppercase tracking-widest mt-1 line-clamp-2 italic">{item.description || 'No description available.'}</p>
              </div>
              <div className="flex justify-between items-end mt-4">
                <span className="text-2xl md:text-3xl font-black italic tracking-tighter text-white group-hover:text-primary transition-colors">₹{item.price}</span>
                {cart.find(i => i.id === item.id) ? (
                  <div className="flex items-center gap-5 bg-primary text-black px-4 py-2 rounded-[16px] font-black shadow-2xl shadow-primary/20">
                    <button onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}><Minus className="w-5 h-5" /></button>
                    <span className="text-lg italic">{cart.find(i => i.id === item.id).quantity}</span>
                    <button onClick={(e) => { e.stopPropagation(); addToCart(item); }}><Plus className="w-5 h-5" /></button>
                  </div>
                ) : (
                  <button className="bg-white/5 p-3 rounded-[16px] border border-white/5 hover:bg-primary hover:text-black transition-all shadow-2xl active:scale-90">
                    <Plus className="w-6 h-6" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Cart Float */}
      <AnimatePresence>
        {cart.length > 0 && !showCheckout && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-10 left-6 right-6 z-50"
          >
            <button 
              onClick={() => setShowCheckout(true)}
              className="w-full bg-primary p-6 rounded-[32px] flex items-center justify-between shadow-[0_20px_60px_rgba(0,212,255,0.4)] border-4 border-black group"
            >
              <div className="flex items-center gap-5">
                <div className="bg-black p-3 rounded-2xl group-hover:rotate-12 transition-transform">
                  <ShoppingBag className="w-7 h-7 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-black/60 uppercase tracking-widest italic">{cart.length} Selections</p>
                  <p className="text-2xl font-black text-black italic leading-none mt-1">₹{subtotal}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 font-black text-black uppercase italic tracking-tighter text-lg">
                View Bucket <ChevronRight className="w-6 h-6" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Sheet */}
      <AnimatePresence>
        {showCheckout && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCheckout(false)}
              className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[60]"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="fixed bottom-0 left-0 right-0 bg-[#05070a] rounded-t-[64px] z-[70] p-10 max-h-[90vh] overflow-y-auto border-t border-white/10 shadow-2xl custom-scrollbar no-scrollbar"
            >
              <div className="w-16 h-1.5 bg-white/10 rounded-full mx-auto mb-10" />
              
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-4xl font-black italic uppercase tracking-tighter">Your <span className="text-primary">Bucket</span></h3>
                <Button variant="ghost" onClick={() => setShowCheckout(false)} className="rounded-2xl w-12 h-12 bg-white/5 text-slate-500 hover:text-white"><Minus className="w-6 h-6" /></Button>
              </div>

              <div className="space-y-6 mb-10">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center group">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-[20px] overflow-hidden bg-white/5 border border-white/5 shadow-2xl">
                        <img src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      </div>
                      <div>
                        <p className="font-black uppercase italic text-lg group-hover:text-primary transition-colors">{item.name}</p>
                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mt-1 italic">₹{item.price} × {item.quantity}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 bg-white/5 p-2 rounded-[16px] border border-white/5">
                      <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center hover:text-red-500 transition-colors"><Minus className="w-4 h-4" /></button>
                      <span className="font-black text-primary text-base">{item.quantity}</span>
                      <button onClick={() => addToCart(item)} className="w-8 h-8 flex items-center justify-center hover:text-primary transition-colors"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-10 border-t border-white/5 mb-10">
                <div className="flex justify-between items-end">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic leading-none">Aggregated Subtotal</p>
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] italic leading-none">Inclusive of levies</p>
                   </div>
                   <p className="text-4xl font-black italic tracking-tighter text-white leading-none">₹{subtotal}</p>
                </div>
              </div>

              <Button 
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder || cart.length === 0}
                className="w-full h-20 rounded-[30px] bg-primary text-black text-2xl font-black italic uppercase tracking-tighter shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {isPlacingOrder ? <Loader2 className="w-8 h-8 animate-spin" /> : "Initiate Order"}
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
