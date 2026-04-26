"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  X, 
  Image as ImageIcon,
  Check,
  Loader2,
  LayoutGrid,
  List as ListIcon
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { auth as firebaseAuth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function MenuManagement() {
  const [items, setItems] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  
  const supabase = createClient();

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    image: "",
    isVeg: true
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        try {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("restaurant_id")
            .eq("id", user.uid)
            .single();

          if (error) throw error;

          if (profile?.restaurant_id) {
            setRestaurantId(profile.restaurant_id);
            fetchItems(profile.restaurant_id);
          } else {
            setIsFetching(false);
            toast.error("Restaurant not linked to this account.");
          }
        } catch (err: any) {
          console.error("Profile fetch error:", err);
          setIsFetching(false);
          toast.error("Could not load profile.");
        }
      } else {
        setIsFetching(false);
      }
    });
    return () => unsubscribe();
  }, []);

  async function fetchItems(resId: string) {
    setIsFetching(true);
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", resId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      if (data) setItems(data);
    } catch (err: any) {
      toast.error("Failed to load menu items.");
    } finally {
      setIsFetching(false);
    }
  }

  const categories = useMemo(() => {
    const cats = new Set(items.map(item => item.category).filter(Boolean));
    return ["All", ...Array.from(cats)];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.category?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;
    setIsLoading(true);

    try {
      const itemData = {
        restaurant_id: restaurantId,
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        image_url: formData.image || `https://ui-avatars.com/api/?name=${formData.name}&background=random`,
        is_veg: formData.isVeg,
        is_available: true
      };

      if (editingItem) {
        const { error } = await supabase.from("menu_items").update(itemData).eq("id", editingItem.id);
        if (error) throw error;
        toast.success("Updated");
      } else {
        const { error } = await supabase.from("menu_items").insert([itemData]);
        if (error) throw error;
        toast.success("Added");
      }

      closeModal();
      fetchItems(restaurantId);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAvailability = async (item: any) => {
    const { error } = await supabase
      .from("menu_items")
      .update({ is_available: !item.is_available })
      .eq("id", item.id);
    
    if (!error) {
      setItems(items.map(i => i.id === item.id ? { ...i, is_available: !item.is_available } : i));
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (!error) {
      toast.success("Deleted");
      if (restaurantId) fetchItems(restaurantId);
    }
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price.toString(),
      category: item.category || "",
      image: item.image_url || "",
      isVeg: item.is_veg
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ name: "", price: "", category: "", image: "", isVeg: true });
  };

  return (
    <div className="w-full space-y-6 md:space-y-10 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic text-white leading-none">Menu <span className="text-slate-500">Items</span></h2>
          <p className="text-slate-500 text-[10px] md:text-sm font-black uppercase tracking-widest italic">Managing {items.length} artisan recipes.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
            <button 
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white/10 text-primary" : "text-slate-500 hover:text-white"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white/10 text-primary" : "text-slate-500 hover:text-white"}`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="flex-1 sm:flex-none gap-2 rounded-[20px] md:rounded-2xl h-14 md:h-12 px-6 font-black uppercase tracking-widest text-[10px] md:text-sm shadow-xl shadow-primary/20 text-white">
            <Plus className="w-4 h-4 md:w-5 md:h-5" /> New Item
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
        {/* Navigation Sidebar / Horizontal on Mobile */}
        <aside className="w-full lg:w-72 space-y-6 md:space-y-8">
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search menu..." 
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-xs md:text-sm focus:border-primary/50 outline-none transition-all text-white font-black uppercase tracking-widest placeholder:text-slate-800"
              />
           </div>

           <div className="space-y-4">
              <p className="hidden lg:block text-[10px] font-black uppercase tracking-[0.3em] text-slate-700 px-4 italic">Collections</p>
              <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "flex items-center justify-between px-6 py-4 rounded-[20px] text-[10px] uppercase tracking-widest transition-all font-black shrink-0 lg:shrink-1",
                      selectedCategory === cat
                        ? "bg-primary/10 text-primary border border-primary/20 shadow-2xl shadow-primary/5"
                        : "text-slate-500 hover:bg-white/5 hover:text-slate-200 border border-transparent"
                    )}
                  >
                    <span className="truncate">{cat}</span>
                    {selectedCategory === cat && <div className="hidden lg:block w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_#00d4ff]" />}
                  </button>
                ))}
              </div>
           </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {isFetching ? (
            <div className="h-96 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-700 animate-pulse">Syncing Vault</p>
              </div>
            </div>
          ) : filteredItems.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                {filteredItems.map((item) => (
                  <Card key={item.id} className="p-0 border-white/5 bg-[#0b1120] hover:border-primary/30 transition-all flex flex-col h-full rounded-[40px] overflow-hidden group shadow-2xl">
                    <div className="relative h-56 overflow-hidden">
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-90" />
                      <div className="absolute top-6 left-6 flex flex-col gap-2">
                         <span className={cn(
                           "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest backdrop-blur-xl shadow-2xl border transition-all duration-500",
                           item.is_veg ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 'bg-red-500/20 text-red-400 border-red-500/20'
                         )}>
                            {item.is_veg ? 'Veg Signature' : 'Premium Non-Veg'}
                         </span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0b1120] via-transparent to-transparent opacity-60" />
                    </div>
                    <div className="p-8 flex-1 flex flex-col">
                       <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-4">
                             <h4 className="font-black text-2xl text-white tracking-tighter uppercase leading-none italic truncate group-hover:text-primary transition-colors">{item.name}</h4>
                             <span className="font-black text-2xl text-white leading-none italic tracking-tighter">₹{item.price}</span>
                          </div>
                          <p className="text-[10px] text-slate-600 uppercase mt-2 font-black tracking-widest">{item.category}</p>
                       </div>
                       <div className="mt-8 pt-8 border-t border-white/[0.03] flex items-center justify-between">
                          <button 
                            onClick={() => toggleAvailability(item)}
                            className={cn(
                              "text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all border shrink-0",
                              item.is_available ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'text-slate-600 bg-white/5 border-white/5'
                            )}
                          >
                            {item.is_available ? 'Live Sync Active' : 'Hold Pattern'}
                          </button>
                          <div className="flex gap-5">
                            <button onClick={() => openEditModal(item)} className="text-slate-700 hover:text-white transition-all hover:scale-110 active:scale-90"><Edit2 className="w-5 h-5" /></button>
                            <button onClick={() => deleteItem(item.id)} className="text-slate-700 hover:text-red-500 transition-all hover:scale-110 active:scale-90"><Trash2 className="w-5 h-5" /></button>
                          </div>
                       </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="border border-white/5 rounded-[40px] overflow-hidden bg-slate-900/10 shadow-2xl">
                <div className="overflow-x-auto custom-scrollbar no-scrollbar">
                  <table className="w-full text-left min-w-[800px]">
                    <thead className="bg-white/[0.02] text-[10px] font-black uppercase tracking-[0.4em] text-slate-700">
                      <tr>
                        <th className="px-10 py-8">Item Identity</th>
                        <th className="px-10 py-8">Classification</th>
                        <th className="px-10 py-8">Value</th>
                        <th className="px-10 py-8 text-right">Operations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                      {filteredItems.map(item => (
                        <tr key={item.id} className="hover:bg-white/[0.02] group transition-all cursor-default">
                          <td className="px-10 py-8">
                            <div className="flex items-center gap-6">
                              <div className="w-16 h-16 rounded-[24px] overflow-hidden shrink-0 border border-white/10 shadow-xl group-hover:border-primary/50 transition-all duration-500">
                                <img src={item.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              </div>
                              <div className="flex items-center gap-4">
                                 <span className="font-black text-white text-xl uppercase tracking-tighter italic group-hover:text-primary transition-colors">{item.name}</span>
                                 <div className={cn("w-2 h-2 rounded-full", item.is_veg ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]')} />
                              </div>
                            </div>
                          </td>
                          <td className="px-10 py-8 text-slate-600 font-black uppercase text-[11px] tracking-[0.2em]">{item.category}</td>
                          <td className="px-10 py-8 font-black text-white text-2xl italic tracking-tighter">₹{item.price}</td>
                          <td className="px-10 py-8">
                             <div className="flex justify-end gap-8 items-center">
                                <button 
                                  onClick={() => toggleAvailability(item)}
                                  className={cn(
                                    "text-[9px] font-black uppercase px-4 py-2 rounded-xl border transition-all shrink-0",
                                    item.is_available ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-slate-700 bg-white/5 border-white/5'
                                  )}
                                >
                                  {item.is_available ? 'Ready' : 'Standby'}
                                </button>
                                <div className="flex gap-6 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                  <button onClick={() => openEditModal(item)} className="text-slate-600 hover:text-white transition-colors"><Edit2 className="w-5 h-5" /></button>
                                  <button onClick={() => deleteItem(item.id)} className="text-slate-600 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                                </div>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : (
            <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[60px] text-slate-800 space-y-6">
              <div className="w-24 h-24 rounded-[32px] bg-white/5 flex items-center justify-center animate-pulse">
                <ImageIcon className="w-10 h-10 opacity-20" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-700">Vault Empty</p>
                <p className="text-[10px] font-medium text-slate-800">No dishes match your current filter parameters.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal - Polished SaaS UX */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] grid place-items-center bg-[#020617]/95 backdrop-blur-2xl p-4 md:p-8 overflow-y-auto py-12 custom-scrollbar">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#0b1120] border border-white/10 w-full max-w-xl rounded-[40px] md:rounded-[60px] p-8 md:p-16 shadow-2xl relative"
            >
              <button onClick={closeModal} className="absolute top-8 right-8 md:top-12 md:right-12 p-2 rounded-2xl bg-white/5 text-slate-600 hover:text-white transition-all hover:rotate-90"><X className="w-6 h-6 md:w-8 md:h-8" /></button>
              
              <div className="mb-10 md:mb-16">
                <h3 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter italic leading-none">{editingItem ? "Refine" : "Create"} <span className="text-primary md:text-4xl block mt-2">Intelligence</span></h3>
                <p className="text-slate-600 font-medium italic text-xs md:text-sm mt-4 uppercase tracking-widest">Disclosing new culinary assets to the platform.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-6">Assigned Asset Name</label>
                  <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-[28px] md:rounded-[32px] px-8 py-5 md:py-7 outline-none focus:border-primary/50 text-base md:text-xl text-white font-black tracking-tighter placeholder:text-slate-900" placeholder="E.G. TRUFFLE ELITE BURGER" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-6">Price Points (₹)</label>
                    <input required type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-[28px] md:rounded-[32px] px-8 py-5 md:py-7 outline-none focus:border-primary/50 text-base md:text-xl text-white font-black tracking-tighter placeholder:text-slate-900" placeholder="0.00" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-6">Sector Classification</label>
                    <input required type="text" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-[28px] md:rounded-[32px] px-8 py-5 md:py-7 outline-none focus:border-primary/50 text-base md:text-xl text-white font-black tracking-tighter placeholder:text-slate-900" placeholder="MAINS" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-6">Visual Resource URI (Optional)</label>
                  <input type="url" value={formData.image} onChange={(e) => setFormData({...formData, image: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-[28px] md:rounded-[32px] px-8 py-5 md:py-7 outline-none focus:border-primary/50 text-[10px] text-white font-medium" placeholder="HTTPS://IMG.BHOJAN.CO/ASSET-01" />
                </div>
                <div className="flex gap-4 p-2 bg-white/[0.02] rounded-[32px] md:rounded-[40px] border border-white/5">
                  <button type="button" onClick={() => setFormData({...formData, isVeg: true})} className={cn(
                    "flex-1 py-5 md:py-7 rounded-[24px] md:rounded-[32px] text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500",
                    formData.isVeg ? 'bg-emerald-500 text-white shadow-2xl shadow-emerald-500/20' : 'text-slate-700 hover:text-slate-400'
                  )}>Veg Base</button>
                  <button type="button" onClick={() => setFormData({...formData, isVeg: false})} className={cn(
                    "flex-1 py-5 md:py-7 rounded-[24px] md:rounded-[32px] text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500",
                    !formData.isVeg ? 'bg-red-500 text-white shadow-2xl shadow-red-500/20' : 'text-slate-700 hover:text-slate-400'
                  )}>Meat Base</button>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full py-8 md:py-12 rounded-[32px] md:rounded-[40px] text-xl md:text-2xl font-black uppercase tracking-tighter text-white mt-4 shadow-2xl shadow-primary/30 group">
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                    <span className="flex items-center gap-4">
                      {editingItem ? "Apply Intelligence Update" : "Authorize Asset Launch"}
                      <Check className="w-6 h-6 md:w-8 md:h-8 group-hover:translate-x-2 transition-transform" />
                    </span>
                  )}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
