"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  UtensilsCrossed, 
  User, 
  Phone, 
  Plus, 
  Minus, 
  ShoppingCart, 
  ChevronRight, 
  CheckCircle2, 
  ChefHat,
  Search,
  ArrowRight,
  Loader2,
  Trash2,
  MapPin,
  QrCode
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "react-hot-toast";

export default function GuestScanPage() {
  const { restaurantSlug } = useParams();
  const [step, setStep] = useState<'table' | 'info' | 'menu' | 'success'>('table');
  const [restaurant, setRestaurant] = useState<any>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [menu, setMenu] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [guest, setGuest] = useState({ name: '', phone: '' });
  const [cart, setCart] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    fetchInitialData();
    // Hydrate from localStorage
    const savedGuest = localStorage.getItem('bhojan_guest');
    const savedCart = localStorage.getItem('bhojan_cart');
    const savedTable = localStorage.getItem('bhojan_table');

    if (savedGuest) setGuest(JSON.parse(savedGuest));
    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedTable) {
      const table = JSON.parse(savedTable);
      setSelectedTable(table);
      // If we have table and guest, jump to menu
      if (savedGuest) setStep('menu');
    }
  }, [restaurantSlug]);

  // Sync to localStorage
  useEffect(() => {
    if (guest.name) localStorage.setItem('bhojan_guest', JSON.stringify(guest));
    if (cart.length > 0) localStorage.setItem('bhojan_cart', JSON.stringify(cart));
    if (selectedTable) localStorage.setItem('bhojan_table', JSON.stringify(selectedTable));
  }, [guest, cart, selectedTable]);

  async function fetchInitialData() {
    setIsPageLoading(true);
    try {
      // 1. DYNAMIC FETCH: Try finding by ID first, then by Slug
      let { data: resData, error: resError } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", restaurantSlug)
        .single();

      if (resError || !resData) {
        const { data: resDataBySlug } = await supabase
          .from("restaurants")
          .select("*")
          .eq("slug", restaurantSlug)
          .single();
        
        if (resDataBySlug) {
          resData = resDataBySlug;
          setRestaurant(resDataBySlug);
        } else {
          throw new Error("Restaurant Profile not found.");
        }
      } else {
        setRestaurant(resData);
      }

      const activeResId = resData?.id;

      // 2. FAILSAFE TABLE FETCH: Ensure tables are fetched for the active ID
      const { data: tableData, error: tableError } = await supabase
        .from("tables")
        .select("*")
        .eq("restaurant_id", activeResId)
        .order("table_number", { ascending: true });

      if (tableError) console.error("Table Fetch Error:", tableError);

      const { data: menuData } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", activeResId)
        .eq("is_available", true);

      setTables(tableData || []);
      setMenu(menuData || []);
      
      if (menuData) {
        setCategories(["All", ...Array.from(new Set(menuData.map((m: any) => m.category || "General")))]);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsPageLoading(false);
    }
  }

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
    toast.success(`${item.name} added!`, { position: 'bottom-center' });
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
      const totalAmount = cart.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
      
      // Check if there is an active order for this table already
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("*")
        .eq("table_id", selectedTable.id)
        .not("status", "eq", "completed")
        .not("payment_status", "eq", "paid")
        .single();

      let orderId: string;

      if (existingOrder) {
        orderId = existingOrder.id;
        const orderItems = cart.map(item => ({
          order_id: orderId,
          menu_item_id: item.id,
          quantity: item.qty,
          unit_price: item.price,
          total_price: item.price * item.qty 
        }));
        await supabase.from("order_items").insert(orderItems);
        await supabase.from("orders").update({ 
          total_amount: (existingOrder.total_amount || 0) + totalAmount,
          grand_total: (existingOrder.grand_total || 0) + totalAmount,
          status: 'pending' // Move back to pending for kitchen to see new items
        }).eq("id", orderId);
      } else {
        const { data: newOrder, error: orderError } = await supabase.from("orders").insert([{
          restaurant_id: restaurant.id,
          table_id: selectedTable.id,
          customer_name: guest.name || "Self-Order",
          customer_phone: guest.phone || "",
          status: 'pending',
          payment_status: 'unpaid',
          total_amount: totalAmount,
          grand_total: totalAmount
        }]).select().single();
        
        if (orderError) throw orderError;
        orderId = newOrder.id;

        const orderItems = cart.map(item => ({
          order_id: orderId,
          menu_item_id: item.id,
          quantity: item.qty,
          unit_price: item.price,
          total_price: item.price * item.qty 
        }));
        await supabase.from("order_items").insert(orderItems);
        await supabase.from("tables").update({ status: 'occupied' }).eq("id", selectedTable.id);
      }

      setStep('success');
      setCart([]);
      localStorage.removeItem('bhojan_cart');
      toast.success("Order Sent to Kitchen!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-[#05070a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const filteredMenu = selectedCategory === "All" ? menu : menu.filter(m => m.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#05070a] text-white font-sans overflow-x-hidden selection:bg-primary/30">
      {/* Header */}
      <header className="px-6 py-8 flex flex-col items-center text-center space-y-2 border-b border-white/5 sticky top-0 bg-[#05070a]/80 backdrop-blur-3xl z-50">
         {restaurant?.logo_url ? (
            <div className="w-16 h-16 rounded-2xl overflow-hidden mb-2 shadow-lg shadow-primary/10 border border-white/10">
               <img src={restaurant.logo_url} className="w-full h-full object-cover" alt="Logo" />
            </div>
         ) : (
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mb-2 shadow-lg shadow-primary/20 animate-pulse">
               <UtensilsCrossed className="w-6 h-6 text-black" />
            </div>
         )}
         <h1 className="text-xl font-black uppercase italic tracking-tighter text-white">{restaurant?.name || 'BHOJAN'}</h1>
         <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-500">Self-Service Gateway</p>
      </header>

      <main className="p-6 max-w-md mx-auto">
        {step === 'table' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="text-center">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter">Choose your <span className="text-primary">Station</span></h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Which table are you sitting at?</p>
             </div>
             <div className="grid grid-cols-3 gap-3">
                {tables.map(table => (
                  <button 
                    key={table.id}
                    onClick={() => {
                      setSelectedTable(table);
                      setStep('info');
                    }}
                    className={`aspect-square rounded-3xl border flex flex-col items-center justify-center transition-all active:scale-95 ${
                      table.status === 'occupied' 
                        ? 'border-orange-500/30 bg-orange-500/5 text-orange-500' 
                        : 'border-white/5 bg-white/5 hover:border-primary/50 text-white'
                    }`}
                  >
                    <span className="text-2xl font-black italic">{table.table_number}</span>
                    <span className="text-[7px] font-black uppercase tracking-widest opacity-30 mt-1">{table.status}</span>
                  </button>
                ))}
             </div>

             {tables.length === 0 && (
                <div className="py-20 text-center space-y-4">
                   <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto opacity-20">
                      <MapPin className="w-8 h-8 text-white" />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">No active stations found.</p>
                   <Button onClick={() => fetchInitialData()} variant="outline" className="h-12 px-8 rounded-2xl border-white/10 text-xs font-black uppercase tracking-widest">
                      Refresh Map
                   </Button>
                </div>
             )}
          </div>
        )}

        {step === 'info' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="text-center">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter">Let's <span className="text-primary">Check-in</span></h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Station {selectedTable.table_number} is waiting for you</p>
             </div>
             <div className="space-y-4">
                <div className="relative group">
                   <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                   <input 
                      placeholder="FULL NAME" 
                      value={guest.name}
                      onChange={(e) => setGuest({...guest, name: e.target.value})}
                      className="w-full h-16 bg-white/5 border border-white/5 rounded-3xl pl-12 pr-6 text-xs font-black uppercase tracking-widest focus:border-primary/30 outline-none transition-all"
                   />
                </div>
                <div className="relative group">
                   <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                   <input 
                      placeholder="PHONE NUMBER" 
                      value={guest.phone}
                      onChange={(e) => setGuest({...guest, phone: e.target.value})}
                      className="w-full h-16 bg-white/5 border border-white/5 rounded-3xl pl-12 pr-6 text-xs font-black uppercase tracking-widest focus:border-primary/30 outline-none transition-all"
                   />
                </div>
                <Button 
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      // Check for existing active order for this phone/table
                      const { data: activeOrder } = await supabase
                        .from("orders")
                        .select("*")
                        .eq("customer_phone", guest.phone)
                        .eq("table_id", selectedTable.id)
                        .not("status", "eq", "completed")
                        .not("payment_status", "eq", "paid")
                        .single();

                      if (activeOrder) {
                        toast.success(`Welcome back, ${guest.name}! Restoring your order.`);
                      }
                      setStep('menu');
                    } catch (e) {
                      setStep('menu');
                    } finally {
                      setIsLoading(false);
                    }
                  }} 
                  disabled={!guest.name || isLoading}
                  className="w-full h-16 rounded-3xl bg-primary text-black font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/10 mt-4 group"
                >
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Browse Menu <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /></>}
                </Button>
                <button onClick={() => setStep('table')} className="w-full text-center text-[8px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition-colors">Wrong table? Go back</button>
             </div>
          </div>
        )}

        {step === 'menu' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
             <div className="flex items-center justify-between">
                <div>
                   <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Our <span className="text-primary">Flavors</span></h2>
                   <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-1">Ordering for Station {selectedTable.table_number}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                   <Search className="w-4 h-4 text-slate-500" />
                </div>
             </div>

             <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {categories.map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2.5 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
                      selectedCategory === cat ? 'bg-primary text-black border-primary' : 'bg-white/5 text-slate-500 border-white/5'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
             </div>

             <div className="grid grid-cols-1 gap-6">
                {filteredMenu.map(item => (
                  <div key={item.id} className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[32px] overflow-hidden group active:scale-[0.98] transition-all shadow-xl shadow-black/20">
                     {/* Dish Image Container */}
                     <div className="relative h-48 w-full overflow-hidden bg-slate-800">
                        {item.image_url ? (
                           <img 
                              src={item.image_url} 
                              alt={item.name} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                           />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-transparent">
                              <ChefHat className="w-12 h-12 text-primary/20" />
                           </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest backdrop-blur-md border ${item.is_veg ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-red-500/20 border-red-500/30 text-red-400'}`}>
                           {item.is_veg ? 'Pure Veg' : 'Non-Veg'}
                        </div>
                     </div>

                     <div className="p-6 space-y-4">
                        <div className="flex justify-between items-start gap-4">
                           <div className="space-y-1">
                              <h4 className="text-lg font-black uppercase italic tracking-tighter leading-tight text-white">{item.name}</h4>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest line-clamp-2 leading-relaxed">{item.description}</p>
                           </div>
                           <span className="text-2xl font-black text-primary italic shrink-0">₹{item.price}</span>
                        </div>
                        
                        <div className="flex items-center justify-end">
                           {cart.find(i => i.id === item.id) ? (
                             <div className="flex items-center gap-4 bg-white/5 p-1.5 rounded-2xl border border-white/10 w-full justify-between">
                               <button 
                                 onClick={() => updateQty(item.id, -1)}
                                 className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 active:scale-90 transition-all"
                               >
                                  {cart.find(i => i.id === item.id)?.qty === 1 ? <Trash2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                               </button>
                               <span className="text-sm font-black text-white">{cart.find(i => i.id === item.id)?.qty} in bucket</span>
                               <button 
                                 onClick={() => addToCart(item)}
                                 className="w-10 h-10 rounded-xl bg-primary text-black flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-lg shadow-primary/20"
                               >
                                  <Plus className="w-4 h-4" />
                               </button>
                             </div>
                           ) : (
                             <Button 
                               onClick={() => addToCart(item)}
                               className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 text-primary font-black uppercase tracking-widest text-[9px] hover:bg-primary hover:text-black transition-all gap-2"
                             >
                                <Plus className="w-3 h-3" /> Add to Bucket
                             </Button>
                           )}
                        </div>
                     </div>
                  </div>
                ))}
             </div>

             {/* Cart Bottom Bar */}
             {cart.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-6 z-[60] bg-gradient-to-t from-[#05070a] via-[#05070a] to-transparent">
                   <div className="max-w-md mx-auto bg-primary rounded-[32px] p-5 shadow-2xl shadow-primary/20 flex items-center justify-between animate-in slide-in-from-bottom-10 duration-500">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-black/20 flex items-center justify-center relative">
                            <ShoppingCart className="w-5 h-5 text-black" />
                            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-[9px] font-black text-black flex items-center justify-center border-2 border-primary leading-none">{cart.reduce((a,b) => a+b.qty, 0)}</span>
                         </div>
                         <div>
                            <p className="text-[8px] font-black text-black/40 uppercase tracking-widest">Grand Total</p>
                            <p className="text-xl font-black text-black italic tracking-tighter leading-none mt-0.5">₹{cart.reduce((a,b) => a+(b.price*b.qty), 0)}</p>
                         </div>
                      </div>
                      <Button 
                        onClick={handlePlaceOrder} 
                        disabled={isLoading}
                        className="h-12 px-8 rounded-2xl bg-black text-white font-black uppercase tracking-widest text-[9px] hover:bg-black/90 active:scale-95 transition-all"
                      >
                         {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Place Order"}
                      </Button>
                   </div>
                </div>
             )}
          </div>
        )}

        {step === 'success' && (
          <div className="min-h-[80vh] flex flex-col items-center justify-start text-center space-y-10 animate-in fade-in zoom-in duration-700 pb-20">
             <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center relative mt-10">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
             </div>
             
             <div className="space-y-4">
                <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Chef <span className="text-primary">Notified</span></h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest max-w-[250px] mx-auto leading-relaxed">
                   Your order for Station {selectedTable.table_number} is being prepared.
                </p>
             </div>

             {/* Digital Payment Portal */}
             <div className="w-full bg-white/[0.03] border border-white/5 rounded-[48px] p-10 space-y-8">
                <div className="text-center">
                   <h3 className="text-lg font-black uppercase italic tracking-tighter">Scan & <span className="text-primary">Settle</span></h3>
                   <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mt-2">Skip the counter and pay now</p>
                </div>

                <div className="w-full aspect-square max-w-[200px] mx-auto bg-white rounded-3xl p-6 shadow-2xl shadow-primary/5">
                   {restaurant?.merchant_qr_url ? (
                      <img src={restaurant.merchant_qr_url} className="w-full h-full object-contain" alt="Payment QR" />
                   ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-xl">
                         <QrCode className="w-10 h-10 text-slate-300" />
                      </div>
                   )}
                </div>

                {restaurant?.bank_details?.bank_name && (
                   <div className="space-y-4 pt-4 border-t border-white/5">
                      <p className="text-[8px] font-black uppercase tracking-[0.3em] text-primary">Bank Transfer</p>
                      <div className="grid grid-cols-1 gap-3 text-left">
                         <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                            <span className="text-slate-500">Bank</span>
                            <span className="text-white italic">{restaurant.bank_details.bank_name}</span>
                         </div>
                         <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                            <span className="text-slate-500">A/C No</span>
                            <span className="text-white italic">{restaurant.bank_details.account_number}</span>
                         </div>
                         <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                            <span className="text-slate-500">IFSC</span>
                            <span className="text-white italic">{restaurant.bank_details.ifsc}</span>
                         </div>
                      </div>
                   </div>
                )}
             </div>

             <div className="pt-4 w-full max-w-[200px] space-y-3">
                <Button onClick={() => setStep('menu')} className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[8px] hover:bg-white/10">Order More</Button>
                <div className="text-[8px] font-black uppercase tracking-widest text-slate-600 mt-4 leading-relaxed">
                   {restaurant?.address} <br/>
                   Ph: {restaurant?.phone}
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Background Decor */}
      <div className="fixed -bottom-32 -left-32 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="fixed -top-32 -right-32 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none z-0" />
    </div>
  );
}
