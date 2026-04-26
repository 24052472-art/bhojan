"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight 
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from "recharts";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any[]>([
    { name: "REVENUE FLOW", value: "₹0", change: "LIVE SYNC", trend: "up", icon: TrendingUp, color: "text-primary" },
    { name: "STATION DENSITY", value: "0 / 0", change: "REALTIME", trend: "up", icon: Users, color: "text-accent" },
    { name: "SEQUENCE LOAD", value: "0", change: "ACTIVE", trend: "up", icon: ShoppingBag, color: "text-blue-400" },
    { name: "LATENCY DELTA", value: "15m", change: "STABLE", trend: "down", icon: Clock, color: "text-orange-400" },
  ]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLive, setIsLive] = useState(false);

  const supabase = createClient();

  const calculateChartData = (orders: any[]) => {
    const last7Days = Array.from({length: 7}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    }).reverse();

    const dataMap = orders.reduce((acc: any, order: any) => {
      const day = new Date(order.created_at).toLocaleDateString('en-US', { weekday: 'short' });
      acc[day] = (acc[day] || 0) + (order.grand_total || 0);
      return acc;
    }, {});

    const formatted = last7Days.map(day => ({
      name: day,
      revenue: dataMap[day] || 0
    }));

    setChartData(formatted);
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchDashboardData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase.from("profiles").select("restaurant_id").eq("id", user.id).single();
      if (!profile?.restaurant_id) return;

      const resId = profile.restaurant_id;
      const today = new Date();
      today.setHours(0,0,0,0);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: weekOrders } = await supabase.from("orders").select("grand_total, status, created_at").eq("restaurant_id", resId).gte("created_at", sevenDaysAgo.toISOString());
      const { data: totalTables } = await supabase.from("tables").select("id, status").eq("restaurant_id", resId);
      
      const todayOrders = weekOrders?.filter(o => new Date(o.created_at) >= today) || [];
      const revenue = todayOrders.filter(o => o.status === 'completed').reduce((acc, curr) => acc + (curr.grand_total || 0), 0) || 0;
      const activeTables = totalTables?.filter(t => t.status === 'occupied').length || 0;
      const orderCount = todayOrders.length || 0;

      setStats([
        { name: "REVENUE FLOW", value: `₹${revenue.toLocaleString()}`, change: "LIVE", trend: "up", icon: TrendingUp, color: "text-primary" },
        { name: "STATION DENSITY", value: `${activeTables} / ${totalTables?.length || 0}`, change: "REALTIME", trend: "up", icon: Users, color: "text-accent" },
        { name: "SEQUENCE LOAD", value: orderCount.toString(), change: "PENDING", trend: "up", icon: ShoppingBag, color: "text-blue-400" },
        { name: "LATENCY DELTA", value: "12m", change: "OPTIMAL", trend: "down", icon: Clock, color: "text-orange-400" },
      ]);

      if (weekOrders) calculateChartData(weekOrders);

      const { data: recent } = await supabase
        .from("orders")
        .select(`*, tables(table_number)`)
        .eq("restaurant_id", resId)
        .order("created_at", { ascending: false })
        .limit(6);
      
      setRecentOrders(recent || []);
      setIsLive(true);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="w-full space-y-10 md:space-y-16 pb-20 animate-in fade-in duration-1000">
      <div className="flex flex-col gap-4 relative">
        <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-1 h-12 bg-primary blur-sm hidden md:block" />
        <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-white uppercase italic leading-none">
          SYSTEM <span className="text-slate-800">MATRIX</span>
        </h2>
        <div className="flex items-center gap-4">
           <div className="h-px flex-1 bg-white/[0.03]" />
           <p className="text-slate-700 text-[10px] font-black tracking-[0.5em] uppercase italic">Operational Telemetry Data</p>
        </div>
      </div>

      <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="relative overflow-hidden group border-white/5 bg-white/[0.01] backdrop-blur-3xl p-8 md:p-10 rounded-[40px] md:rounded-[56px] hover:border-primary/20 transition-all duration-700">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] blur-3xl rounded-full -translate-y-16 translate-x-16 group-hover:bg-primary/5 transition-colors duration-700" />
            <div className="flex flex-col gap-6 relative z-10">
              <div className="flex items-center justify-between">
                 <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em] italic leading-none">{stat.name}</p>
                 <stat.icon className="w-5 h-5 text-slate-800 group-hover:text-primary transition-colors duration-500" />
              </div>
              <h3 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter leading-none shadow-2xl">{stat.value}</h3>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all duration-500",
                  stat.trend === "up" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-primary/10 text-primary border-primary/20"
                )}>
                  {stat.trend === "up" ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {stat.change}
                </div>
                <span className="text-[9px] text-slate-800 font-black uppercase tracking-widest italic">Standard Baseline</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 md:gap-12 grid-cols-1 lg:grid-cols-10">
        <Card className="lg:col-span-6 min-h-[500px] border-white/5 bg-white/[0.01] backdrop-blur-3xl p-0 overflow-hidden flex flex-col rounded-[56px] md:rounded-[72px] hover:border-primary/10 transition-all duration-700 relative">
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full -translate-y-32 -translate-x-32" />
          <CardHeader className="p-10 md:p-14 pb-0 relative">
            <div className="flex justify-between items-start">
               <div>
                  <CardTitle className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white">REVENUE <span className="text-slate-800">PULSE</span></CardTitle>
                  <CardDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-800 mt-2 italic">7-Day Fiscal Synchronization</CardDescription>
               </div>
               <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
               </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-6 md:p-14 min-h-0 relative">
            <div className="w-full h-[350px] min-h-[300px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#1e293b" 
                    fontSize={10} 
                    fontWeight={900}
                    tickLine={false} 
                    axisLine={false} 
                    dy={15}
                    className="uppercase tracking-widest italic"
                  />
                  <YAxis 
                    stroke="#1e293b" 
                    fontSize={10} 
                    fontWeight={900}
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `₹${value}`}
                    className="italic font-black"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#020617", 
                      borderColor: "#1e293b", 
                      borderRadius: "32px",
                      fontSize: "11px",
                      fontWeight: "900",
                      color: "#f8fafc",
                      padding: "20px",
                      boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em"
                    }} 
                    itemStyle={{ color: "#00d4ff" }}
                    cursor={{ stroke: "#ffffff10", strokeWidth: 1 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#00d4ff" 
                    fillOpacity={1} 
                    fill="url(#colorRev)" 
                    strokeWidth={5}
                    animationDuration={2500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4 border-white/5 bg-white/[0.01] backdrop-blur-3xl p-0 overflow-hidden flex flex-col rounded-[56px] md:rounded-[72px] hover:border-primary/10 transition-all duration-700 relative">
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full translate-y-32 translate-x-32" />
          <CardHeader className="p-10 md:p-14 pb-0 relative">
            <div className="flex justify-between items-start">
               <div>
                  <CardTitle className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white">LIVE <span className="text-slate-800">STREAM</span></CardTitle>
                  <CardDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-800 mt-2 italic">
                    {recentOrders.filter(o => o.status === 'pending' || o.status === 'ready').length} OPERATIONAL SEQUENCES
                  </CardDescription>
               </div>
               <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center animate-pulse">
                  <Clock className="w-6 h-6 text-primary" />
               </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-10 md:p-14 overflow-y-auto no-scrollbar relative">
            <div className="space-y-8">
              {recentOrders.length === 0 && (
                <div className="py-32 text-center flex flex-col items-center gap-6 opacity-20 group">
                   <div className="w-20 h-20 rounded-[32px] bg-white/5 border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                      <ShoppingBag className="w-8 h-8" />
                   </div>
                   <p className="text-[11px] font-black uppercase tracking-[0.5em] italic">System Standby</p>
                </div>
              )}
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center gap-6 group/item relative">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-[24px] md:rounded-[28px] bg-white/5 flex items-center justify-center font-black text-white border border-white/5 italic text-lg shadow-2xl group-hover/item:border-primary/50 group-hover/item:text-primary transition-all duration-500 shrink-0">
                    {order.tables?.table_number || '??'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base md:text-lg font-black text-white uppercase italic tracking-tighter truncate leading-none mb-2">STATION {order.tables?.table_number || 'ALPHA'}</p>
                    <p className="text-[10px] text-slate-800 font-black uppercase tracking-widest leading-none italic">₹{order.grand_total.toLocaleString()} • SEQ {order.id.slice(-4).toUpperCase()}</p>
                  </div>
                  <div className={cn(
                    "px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all duration-500",
                    order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-primary/10 text-primary border-primary/20'
                  )}>
                    {order.status}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
