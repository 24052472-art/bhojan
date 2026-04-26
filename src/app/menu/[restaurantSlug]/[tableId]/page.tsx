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
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-[#F15A24]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#1F2937] pb-32">
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-0 z-50 bg-[#F3F4F6] flex flex-col items-center justify-center p-10 text-center overflow-y-auto no-scrollbar"
          >
            <div className="absolute top-12 left-1/2 -translate-x-1/2">
               <h1 className="text-xl font-black italic tracking-tighter uppercase text-gray-400">{restaurant?.name}</h1>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Order Confirmed</p>
            </div>

            <div className="space-y-12 w-full max-w-sm">
               <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-emerald-50 flex items-center justify-center mx-auto border-4 border-white shadow-xl">
                    <CheckCircle2 className="w-16 h-16 text-[#16A34A]" />
                  </div>
                  <div className="absolute inset-0 bg-emerald-100 blur-3xl rounded-full -z-10 animate-pulse" />
               </div>

               <div className="space-y-4">
                  <h2 className="text-5xl font-black italic uppercase tracking-tighter text-gray-900 leading-tight">
                    CHEF <span className="text-[#16A34A]">NOTIFIED</span>
                  </h2>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                    YOUR ORDER FOR TABLE <span className="text-gray-900">{params.tableId}</span> IS BEING PREPARED.
                  </p>
               </div>

               <div className="bg-white border border-gray-100 p-8 rounded-[40px] shadow-sm space-y-6">
                  <div className="flex justify-between items-center">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Order Status</p>
                     <span className={cn(
                       "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                       currentOrder.status === 'pending' ? 'bg-orange-50 text-white border-orange-100' : 
                       currentOrder.status === 'preparing' ? 'bg-blue-500 text-white border-blue-100' : 
                       'bg-[#16A34A] text-white border-green-100'
                     )}>
                       {currentOrder.status}
                     </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-50 pt-6">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Station</p>
                     <p className="text-xl font-extrabold text-gray-900 italic">T-{params.tableId}</p>
                  </div>
               </div>

               <div className="space-y-4 pt-10">
                  <button 
                    onClick={() => setCurrentOrder(null)}
                    className="w-full h-16 rounded-2xl bg-white border border-gray-200 text-gray-900 font-bold uppercase tracking-widest text-sm hover:border-[#F15A24] transition-all shadow-sm"
                  >
                    Add More Items
                  </button>
                  <div className="flex flex-col items-center gap-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic leading-none">Powered by Bhojan Sync</p>
                    <div className="w-12 h-1 bg-gray-200 rounded-full mt-2" />
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-40 bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#F15A24] flex items-center justify-center text-white font-black italic">
            {restaurant?.name?.charAt(0) || 'B'}
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-none">{restaurant?.name || 'Bhojan'}</h1>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mt-1">Table {params.tableId}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <button className="text-gray-400 hover:text-gray-600"><Search className="w-5 h-5" /></button>
           <button className="text-gray-400 hover:text-gray-600 relative">
             <ShoppingBag className="w-5 h-5" />
             {cart.length > 0 && (
               <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#F15A24] text-white text-[8px] font-bold flex items-center justify-center rounded-full">
                 {cart.length}
               </span>
             )}
           </button>
        </div>
      </header>

      {/* Hero / Restaurant Info */}
      <section className="bg-white px-6 py-8 mb-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-[#F15A24] uppercase tracking-widest">
            <Star className="w-3 h-3 fill-[#F15A24]" />
            Best in {restaurant?.city || 'the area'}
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Enjoy your meal at {restaurant?.name}</h2>
          <div className="flex items-center gap-6 text-xs text-gray-500 font-medium">
             <div className="flex items-center gap-1"><Building className="w-4 h-4" /> Dine-in</div>
             <div className="flex items-center gap-1"><Info className="w-4 h-4" /> Details</div>
          </div>
        </div>
      </section>

      {/* Menu Sections */}
      <section className="px-4 pb-40">
        <div className="space-y-8">
          {categories.filter(c => c !== "All").map((category) => (
            <div key={category} id={`category-${category}`} className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 ml-2">{category}</h3>
              <div className="space-y-3">
                {menu.filter(i => i.category === category).map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-white p-4 rounded-2xl flex gap-4 shadow-sm active:scale-[0.98] transition-all"
                  >
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                      <img 
                        src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"} 
                        alt={item.name} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                           <div className={cn("w-2 h-2 rounded-full", item.is_veg ? "bg-green-500" : "bg-red-500")} />
                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.is_veg ? 'VEG' : 'NON-VEG'}</span>
                        </div>
                        <h4 className="text-base font-bold text-gray-900 leading-snug line-clamp-1">{item.name}</h4>
                        <p className="text-[11px] text-gray-400 font-medium line-clamp-1 mt-0.5">{item.description || 'Tasty and fresh.'}</p>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-lg font-extrabold text-gray-900">₹{item.price}</span>
                        {cart.find(i => i.id === item.id) ? (
                          <div className="flex items-center gap-4 bg-[#F15A24]/10 text-[#F15A24] px-3 py-1.5 rounded-full border border-[#F15A24]/20">
                            <button onClick={() => removeFromCart(item.id)}><Minus className="w-4 h-4" /></button>
                            <span className="text-sm font-bold w-4 text-center">{cart.find(i => i.id === item.id).quantity}</span>
                            <button onClick={() => addToCart(item)}><Plus className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => addToCart(item)}
                            className="bg-white border border-gray-200 text-[#F15A24] text-[10px] font-bold px-6 py-2 rounded-full shadow-sm hover:border-[#F15A24] transition-all uppercase tracking-widest"
                          >
                            ADD
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
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

      {/* Sticky Cart Bar (Zapmenus style) */}
      <AnimatePresence>
        {cart.length > 0 && !showCheckout && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-6 left-4 right-4 z-50"
          >
            <button 
              onClick={() => setShowCheckout(true)}
              className="w-full bg-[#16A34A] h-16 rounded-2xl flex items-center justify-between px-6 shadow-[0_10px_30px_rgba(22,163,74,0.3)] group"
            >
              <div className="flex items-center gap-4">
                 <div className="bg-white/20 p-2 rounded-lg">
                    <ShoppingBag className="w-5 h-5 text-white" />
                 </div>
                 <div className="text-left">
                    <p className="text-[10px] text-white/80 font-bold uppercase tracking-wider">{cart.reduce((a,b) => a+b.quantity, 0)} Items</p>
                    <p className="text-lg text-white font-black">₹{subtotal}</p>
                 </div>
              </div>
              <div className="flex items-center gap-1 text-white font-bold text-sm uppercase tracking-widest">
                View Order <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Bottom Sheet */}
      <AnimatePresence>
        {showCategoryMenu && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCategoryMenu(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-[70] p-8 pb-12 shadow-2xl"
            >
               <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-8" />
               <h3 className="text-lg font-black uppercase tracking-widest text-gray-400 mb-6 italic">Select Category</h3>
               <div className="grid grid-cols-2 gap-4">
                 {categories.filter(c => c !== "All").map(cat => (
                   <button
                    key={cat}
                    onClick={() => {
                      document.getElementById(`category-${cat}`)?.scrollIntoView({ behavior: 'smooth' });
                      setShowCategoryMenu(false);
                    }}
                    className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-[#F15A24] transition-all group"
                   >
                     <span className="text-sm font-bold text-gray-700 group-hover:text-[#F15A24]">{cat}</span>
                     <span className="text-[10px] font-bold text-gray-400 italic">{menu.filter(i => i.category === cat).length}</span>
                   </button>
                 ))}
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Checkout Sheet (Refined) */}
      <AnimatePresence>
        {showCheckout && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCheckout(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60]"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] z-[70] p-8 max-h-[85vh] overflow-y-auto no-scrollbar shadow-2xl"
            >
              <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-8" />
              
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Your Order</h3>
                  <p className="text-xs text-gray-400 font-medium">Review your items before placing order</p>
                </div>
                <button 
                  onClick={() => setShowCheckout(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <div className="space-y-6 mb-10">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-gray-200 shadow-sm">
                        <img src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                        <p className="text-[11px] font-bold text-[#F15A24] mt-0.5">₹{item.price}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                      <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 flex items-center justify-center text-gray-400"><Minus className="w-3.5 h-3.5" /></button>
                      <span className="font-black text-gray-900 text-sm w-4 text-center">{item.quantity}</span>
                      <button onClick={() => addToCart(item)} className="w-6 h-6 flex items-center justify-center text-[#F15A24]"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-6 border-t border-gray-100 mb-8">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Item Total</span>
                  <span className="text-gray-900 font-bold">₹{subtotal}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Taxes & Fees</span>
                  <span className="text-gray-900 font-bold">₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                  <span className="text-gray-900 font-black text-lg">Grand Total</span>
                  <span className="text-[#16A34A] font-black text-2xl">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder || cart.length === 0}
                className="w-full h-16 rounded-2xl bg-[#16A34A] text-white text-lg font-black uppercase tracking-widest shadow-xl shadow-green-200 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                {isPlacingOrder ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Place Order
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
