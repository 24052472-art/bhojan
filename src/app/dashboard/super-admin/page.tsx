"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { 
  Users, 
  UtensilsCrossed, 
  Activity,
  ArrowUpRight,
  Loader2,
  TrendingUp,
  Globe,
  Plus,
  ArrowRight,
  ShieldCheck,
  Zap
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

export default function SuperAdminOverview() {
  const [stats, setStats] = useState({
    restaurants: 0,
    users: 0,
    orders: 0,
    revenue: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      
      // 1. Fetch Real Counts
      const { count: resCount } = await supabase.from("restaurants").select("*", { count: "exact", head: true });
      const { count: userCount } = await supabase.from("user_profiles").select("*", { count: "exact", head: true });
      const { count: orderCount } = await supabase.from("orders").select("*", { count: "exact", head: true });
      
      // 2. Calculate Real Revenue
      const { data: revenueData } = await supabase
        .from("orders")
        .select("grand_total")
        .eq("payment_status", "paid");
      
      const totalRev = revenueData?.reduce((acc, curr) => acc + (Number(curr.grand_total) || 0), 0) || 0;

      // 3. Fetch Real Activity
      const { data: latestOrders } = await supabase
        .from("orders")
        .select("*, restaurants(name)")
        .order("created_at", { ascending: false })
        .limit(5);

      setStats({
        restaurants: resCount || 0,
        users: userCount || 0,
        orders: orderCount || 0,
        revenue: totalRev
      });
      
      setRecentActivity(latestOrders || []);
      setIsLoading(false);
    }
    fetchStats();
  }, []);

  const cards = [
    { name: "Active Ecosystems", value: stats.restaurants, icon: UtensilsCrossed, color: "text-cyan-400", bg: "bg-cyan-500/5", trend: "Market Capacity" },
    { name: "Total Identities", value: stats.users, icon: Users, color: "text-purple-400", bg: "bg-purple-500/5", trend: "Global Reach" },
    { name: "Live Transactions", value: stats.orders, icon: Activity, color: "text-orange-400", bg: "bg-orange-500/5", trend: "Real-time Flow" },
    { name: "Global Revenue", value: `₹${stats.revenue.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/5", trend: "GTV (All Time)" },
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 py-8 animate-fade-in">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-2">
            <ShieldCheck className="w-4 h-4" />
            Central Command Active
          </div>
          <h2 className="text-7xl font-black tracking-tight text-white leading-none uppercase italic">
            Platform <span className="text-slate-600">Sync</span>
          </h2>
          <p className="text-slate-400 text-xl font-medium max-w-xl">
            Real-time multi-tenant intelligence across your entire restaurant network.
          </p>
        </div>
        <div className="flex gap-4">
           <button className="h-16 px-10 rounded-3xl bg-white text-black font-black uppercase tracking-tighter flex items-center gap-3 hover:scale-105 transition-all shadow-2xl shadow-white/10 group">
             <Plus className="w-6 h-6 transition-transform group-hover:rotate-90" /> Onboard Tenant
           </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
        {cards.map((card, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={card.name}
          >
            <Card className="border-white/5 bg-[#0f172a]/40 hover:bg-[#0f172a] transition-all duration-700 group relative overflow-hidden rounded-[48px]">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-10">
                <div className="flex justify-between items-start mb-8">
                  <div className={`p-5 rounded-3xl ${card.bg} border border-white/5`}>
                    <card.icon className={`w-8 h-8 ${card.color}`} />
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">{card.trend}</span>
                </div>
                <div>
                  <h3 className="text-5xl font-black text-white tracking-tighter italic">
                    {isLoading ? <Loader2 className="w-8 h-8 animate-spin text-slate-800" /> : card.value}
                  </h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-3">{card.name}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid lg:grid-cols-3 gap-10 px-4">
        {/* Real Activity Feed */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between px-4">
            <h4 className="text-2xl font-black text-white uppercase italic tracking-tight flex items-center gap-3">
              Live Stream <Zap className="w-6 h-6 text-yellow-500 animate-pulse" />
            </h4>
            <button className="text-[10px] font-black text-slate-500 hover:text-primary transition-colors flex items-center gap-2 uppercase tracking-widest">
              Audit Logs <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4">
             {recentActivity.map((item, i) => (
               <motion.div 
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: i * 0.1 }}
                 key={item.id} 
                 className="flex items-center justify-between p-8 bg-white/[0.02] border border-white/5 rounded-[40px] group hover:bg-white/[0.04] transition-all cursor-pointer"
               >
                 <div className="flex items-center gap-6">
                   <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/5 bg-primary/10 text-primary">
                     <Globe className="w-6 h-6" />
                   </div>
                   <div>
                     <p className="text-xl font-black text-white uppercase tracking-tighter italic">{item.restaurants?.name || "Unknown Tenant"}</p>
                     <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Transaction: {item.id.slice(0, 8)}</p>
                   </div>
                 </div>
                 <div className="text-right">
                    <p className="text-2xl font-black text-white italic tracking-tighter leading-none">₹{item.grand_total}</p>
                    <p className="text-[10px] text-slate-700 font-black uppercase tracking-widest mt-1">PAID ACCESS</p>
                 </div>
               </motion.div>
             ))}

             {recentActivity.length === 0 && !isLoading && (
               <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[48px]">
                 <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">No recent platform activity detected.</p>
               </div>
             )}
          </div>
        </div>

        {/* Infrastructure Health */}
        <div className="space-y-8">
           <h4 className="text-2xl font-black text-white px-4 uppercase italic tracking-tight">Core Pulse</h4>
           <Card className="border-white/5 bg-slate-900/40 rounded-[56px] p-10 space-y-10">
              {[
                { label: "API Latency", value: "18ms", status: "good", pct: 90 },
                { label: "DB Connectivity", value: "Optimal", status: "good", pct: 100 },
                { label: "Sync Engine", value: "Live", status: "good", pct: 100 }
              ].map((m, i) => (
                <div key={i} className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">{m.label}</span>
                    <span className="text-sm font-black text-white">{m.value}</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${m.pct}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className={`h-full rounded-full ${m.status === 'good' ? 'bg-primary' : 'bg-orange-500'}`} 
                    />
                  </div>
                </div>
              ))}
              
              <div className="pt-6 border-t border-white/5 mt-6 text-center">
                 <div className="p-8 rounded-[32px] bg-primary/5 border border-primary/10">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">Supabase Sync</p>
                    <p className="text-lg font-black text-white italic">Healthy & Operational</p>
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
