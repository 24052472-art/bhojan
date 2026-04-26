"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
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
          toast.error("Could not load profile. Check database permissions.");
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
      toast.error("Failed to load menu items. Check RLS policies.");
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
    <div className="max-w-[1400px] mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tighter uppercase italic text-white">Menu <span className="text-slate-500">Items</span></h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Managing {items.length} dishes.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
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
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 rounded-2xl h-12 px-6 font-black uppercase tracking-tighter shadow-xl shadow-primary/20 text-black">
            <Plus className="w-4 h-4" /> New Item
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        <aside className="space-y-6">
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..." 
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-4 text-sm focus:border-primary/50 outline-none transition-all text-white font-bold"
              />
           </div>

           <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-700 px-4 mb-2 italic">Categories</p>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-[10px] uppercase tracking-widest transition-all font-black ${
                    selectedCategory === cat
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
                  }`}
                >
                  {cat}
                  {selectedCategory === cat && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                </button>
              ))}
           </div>
        </aside>

        <div className="lg:col-span-4">
          {isFetching ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredItems.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                  <Card key={item.id} className="p-0 border-white/5 bg-slate-900/40 hover:border-primary/30 transition-all flex flex-col h-full rounded-[32px] overflow-hidden group">
                    <div className="relative h-48 overflow-hidden">
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80" />
                      <div className="absolute top-4 left-4">
                         <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] ${item.is_veg ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'} backdrop-blur-md`}>
                            {item.is_veg ? 'Veg' : 'Non-Veg'}
                         </span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between">
                       <div>
                         <div className="flex justify-between items-start gap-4">
                            <h4 className="font-black text-xl text-white tracking-tight uppercase leading-none">{item.name}</h4>
                            <span className="font-black text-xl text-primary leading-none italic">₹{item.price}</span>
                         </div>
                         <p className="text-[10px] text-slate-500 uppercase mt-2 font-black tracking-widest">{item.category}</p>
                       </div>
                       <div className="mt-6 flex items-center justify-between pt-6 border-t border-white/5">
                          <button 
                            onClick={() => toggleAvailability(item)}
                            className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-all border ${item.is_available ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-slate-600 bg-white/5 border-white/5'}`}
                          >
                            {item.is_available ? 'Live in Menu' : 'Suspended'}
                          </button>
                          <div className="flex gap-4">
                            <button onClick={() => openEditModal(item)} className="text-slate-500 hover:text-white transition-colors"><Edit2 className="w-5 h-5" /></button>
                            <button onClick={() => deleteItem(item.id)} className="text-slate-500 hover:text-red-400 transition-colors"><Trash2 className="w-5 h-5" /></button>
                          </div>
                       </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="border border-white/5 rounded-[32px] overflow-hidden bg-slate-900/20">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-700">
                    <tr>
                      <th className="px-8 py-6">Item Identity</th>
                      <th className="px-8 py-6">Category</th>
                      <th className="px-8 py-6">Price</th>
                      <th className="px-8 py-6 text-right">Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredItems.map(item => (
                      <tr key={item.id} className="hover:bg-white/[0.02] group transition-all">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-white/10">
                              <img src={item.image_url} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex items-center gap-3">
                               <span className="font-black text-white text-base uppercase tracking-tighter">{item.name}</span>
                               {item.is_veg && <div className="w-2 h-2 rounded-full bg-green-500" />}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-slate-500 font-black uppercase text-[10px] tracking-widest">{item.category}</td>
                        <td className="px-8 py-6 font-black text-primary text-base italic">₹{item.price}</td>
                        <td className="px-8 py-6 text-right">
                           <div className="flex justify-end gap-6 items-center">
                              <button 
                                onClick={() => toggleAvailability(item)}
                                className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full border ${item.is_available ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-slate-600 bg-white/5 border-white/5'}`}
                              >
                                {item.is_available ? 'Active' : 'Off'}
                              </button>
                              <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEditModal(item)} className="text-slate-500 hover:text-white"><Edit2 className="w-5 h-5" /></button>
                                <button onClick={() => deleteItem(item.id)} className="text-slate-500 hover:text-red-400"><Trash2 className="w-5 h-5" /></button>
                              </div>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[48px] text-slate-700 space-y-4">
              <ImageIcon className="w-10 h-10 opacity-20" />
              <p className="text-[10px] font-black uppercase tracking-widest">No dishes in your collection.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/90 backdrop-blur-xl p-4 sm:p-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-[48px] p-12 shadow-2xl relative"
            >
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-4xl font-black text-white uppercase tracking-tighter italic">{editingItem ? "Edit" : "New"} <span className="text-primary text-3xl">Dish</span></h3>
                <button onClick={closeModal} className="text-slate-500 hover:text-white"><X className="w-8 h-8" /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Dish Name</label>
                  <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-[24px] px-8 py-5 outline-none focus:border-primary/50 text-base text-white font-black uppercase tracking-tighter" placeholder="E.g. Royal Burger" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Price (₹)</label>
                    <input required type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-[24px] px-8 py-5 outline-none focus:border-primary/50 text-base text-white font-black tracking-tighter" placeholder="00" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Category</label>
                    <input required type="text" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-[24px] px-8 py-5 outline-none focus:border-primary/50 text-base text-white font-black uppercase tracking-tighter" placeholder="Mains" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Image Source (Optional)</label>
                  <input type="url" value={formData.image} onChange={(e) => setFormData({...formData, image: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-[24px] px-8 py-5 outline-none focus:border-primary/50 text-xs text-white" placeholder="https://..." />
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setFormData({...formData, isVeg: true})} className={`flex-1 py-5 rounded-[24px] border text-[10px] font-black uppercase tracking-[0.2em] transition-all ${formData.isVeg ? 'border-green-500/50 bg-green-500/5 text-green-400' : 'border-white/5 text-slate-700'}`}>Veg Item</button>
                  <button type="button" onClick={() => setFormData({...formData, isVeg: false})} className={`flex-1 py-5 rounded-[24px] border text-[10px] font-black uppercase tracking-[0.2em] transition-all ${!formData.isVeg ? 'border-red-500/50 bg-red-500/5 text-red-400' : 'border-white/5 text-slate-700'}`}>Non-Veg Item</button>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full py-10 rounded-[32px] text-xl font-black uppercase tracking-tighter mt-4 text-black">
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (editingItem ? "Update Identity" : "Launch Item")}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
