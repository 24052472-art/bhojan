"use client";

import { useState } from "react";
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
  QrCode as QrIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const categories = ["Starters", "Main Course", "Breads", "Desserts", "Drinks"];

const menuItems = [
  { id: 1, name: "Paneer Tikka", category: "Starters", price: 280, isVeg: true, image: "https://images.unsplash.com/photo-1567184109171-969977dc3932?w=400", description: "Soft paneer cubes marinated in spices and grilled to perfection." },
  { id: 2, name: "Butter Chicken", category: "Main Course", price: 450, isVeg: false, image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400", description: "Creamy tomato based gravy with tender chicken pieces." },
  { id: 3, name: "Dal Makhani", category: "Main Course", price: 320, isVeg: true, image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400", description: "Slow cooked black lentils with butter and cream." },
  { id: 4, name: "Garlic Naan", category: "Breads", price: 60, isVeg: true, image: "https://images.unsplash.com/photo-1601050638917-3606611995c6?w=400", description: "Freshly baked flatbread topped with garlic and coriander." },
];

export default function PublicMenu({ params }: { params: { restaurantSlug: string, tableId: string } }) {
  const [selectedCategory, setSelectedCategory] = useState("Starters");
  const [cart, setCart] = useState<any[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);

  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing?.quantity === 1) {
        return prev.filter((i) => i.id !== id);
      }
      return prev.map((i) => i.id === id ? { ...i, quantity: i.quantity - 1 } : i);
    });
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = subtotal * 0.05;
  const grandTotal = subtotal + tax;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-white/5 p-6 rounded-b-[40px] flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bhojan</h1>
          <p className="text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2">
            Table <span className="text-primary font-bold">{params.tableId || "T-01"}</span>
          </p>
        </div>
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
          <Info className="w-5 h-5 text-primary" />
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-8">
        <div className="relative h-48 rounded-[40px] overflow-hidden group">
          <img 
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800" 
            alt="Restaurant" 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
          <div className="absolute bottom-6 left-6">
            <h2 className="text-2xl font-bold">Bhojan Fine Dine</h2>
            <div className="flex items-center gap-2 mt-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-semibold">4.8</span>
              <span className="text-xs text-slate-400">• 500+ Ratings</span>
            </div>
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="px-6 mb-6">
        <div className="glass px-6 py-4 rounded-[30px] flex items-center gap-4">
          <Search className="w-5 h-5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search for dishes..." 
            className="bg-transparent border-none outline-none w-full text-sm"
          />
        </div>
      </section>

      {/* Categories */}
      <section className="px-6 mb-8 overflow-x-auto scrollbar-hide flex gap-3">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap px-6 py-3 rounded-full text-sm font-bold transition-all ${
              selectedCategory === cat
                ? "bg-primary text-slate-950 shadow-lg shadow-primary/20"
                : "glass text-slate-400"
            }`}
          >
            {cat}
          </button>
        ))}
      </section>

      {/* Menu Items */}
      <section className="px-6 space-y-6">
        {menuItems.map((item) => (
          <motion.div 
            layout
            key={item.id} 
            className="glass p-4 rounded-[30px] flex gap-4 border-white/5"
          >
            <div className="w-24 h-24 rounded-[25px] overflow-hidden shrink-0">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 flex flex-col justify-between py-1">
              <div>
                <div className="flex justify-between items-start">
                  <h4 className="font-bold">{item.name}</h4>
                  <span className={`w-3 h-3 rounded-sm border-2 ${item.isVeg ? 'border-green-500 p-[1px]' : 'border-red-500 p-[1px]'}`}>
                    <div className={`w-full h-full rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{item.description}</p>
              </div>
              <div className="flex justify-between items-end mt-2">
                <span className="font-bold text-primary">₹{item.price}</span>
                {cart.find(i => i.id === item.id) ? (
                  <div className="flex items-center gap-4 bg-primary text-slate-950 px-3 py-1.5 rounded-full font-bold">
                    <button onClick={() => removeFromCart(item.id)}><Minus className="w-4 h-4" /></button>
                    <span className="text-sm">{cart.find(i => i.id === item.id).quantity}</span>
                    <button onClick={() => addToCart(item)}><Plus className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <button 
                    onClick={() => addToCart(item)}
                    className="bg-white/5 hover:bg-white/10 p-2 rounded-full border border-white/10 transition-all"
                  >
                    <Plus className="w-5 h-5 text-primary" />
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
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-8 left-6 right-6 z-50"
          >
            <button 
              onClick={() => setShowCheckout(true)}
              className="w-full bg-gradient-to-r from-primary to-accent p-6 rounded-[30px] flex items-center justify-between shadow-[0_20px_40px_rgba(0,212,255,0.4)]"
            >
              <div className="flex items-center gap-4">
                <div className="bg-slate-950/20 p-2 rounded-xl">
                  <ShoppingBag className="w-6 h-6 text-slate-950" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-950/60 uppercase tracking-widest">{cart.length} Items Selected</p>
                  <p className="text-xl font-black text-slate-950">₹{subtotal}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 font-black text-slate-950">
                View Cart <ChevronRight className="w-6 h-6" />
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
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="fixed bottom-0 left-0 right-0 glass rounded-t-[50px] z-[70] p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-8" />
              
              <h3 className="text-2xl font-black mb-8">Your Order</h3>

              <div className="space-y-6 mb-8">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/5">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold">{item.name}</p>
                        <p className="text-xs text-slate-500">₹{item.price} x {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-black">₹{item.price * item.quantity}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-6 border-t border-white/10 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="font-bold">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">GST (5%)</span>
                  <span className="font-bold">₹{tax}</span>
                </div>
                <div className="flex justify-between text-2xl font-black text-primary">
                  <span>Grand Total</span>
                  <span>₹{grandTotal}</span>
                </div>
              </div>

              {/* MERCHANT PAYMENT SECTION (Requested Feature) */}
              <div className="mb-10 space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400">Payment Methods</h4>
                <div className="grid grid-cols-2 gap-4">
                  <button className="glass p-4 rounded-3xl flex flex-col items-center gap-3 border-primary/20 bg-primary/5">
                    <QrIcon className="w-6 h-6 text-primary" />
                    <span className="text-xs font-bold">UPI / QR</span>
                  </button>
                  <button className="glass p-4 rounded-3xl flex flex-col items-center gap-3 opacity-40">
                    <CreditCard className="w-6 h-6" />
                    <span className="text-xs font-bold">Card</span>
                  </button>
                </div>

                <div className="p-6 glass bg-white/5 rounded-[30px] border border-white/10 space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="bg-white p-3 rounded-2xl shadow-xl">
                      {/* Placeholder for the merchant QR uploaded in admin dashboard */}
                      <div className="w-40 h-40 bg-slate-100 flex items-center justify-center text-slate-400 text-center p-4">
                        <QrIcon className="w-12 h-12 opacity-20" />
                      </div>
                    </div>
                    <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest leading-relaxed">
                      Scan the QR code above or use bank details below to pay
                    </p>
                  </div>

                  <div className="space-y-3 pt-6 border-t border-white/5">
                    <div className="flex items-center gap-3 text-xs">
                      <Building className="w-4 h-4 text-slate-500" />
                      <div className="flex-1">
                        <p className="text-slate-500">Bank Name</p>
                        <p className="font-bold">HDFC Bank</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <CreditCard className="w-4 h-4 text-slate-500" />
                      <div className="flex-1">
                        <p className="text-slate-500">A/C Number</p>
                        <p className="font-bold">50100123456789</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Button className="w-full py-6 rounded-[30px] text-xl font-black gap-3 shadow-[0_20px_40px_rgba(0,212,255,0.3)]">
                Place Order Now
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
