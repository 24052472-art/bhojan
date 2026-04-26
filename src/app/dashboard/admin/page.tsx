"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
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

const data = [
  { name: "Mon", revenue: 4000 },
  { name: "Tue", revenue: 3000 },
  { name: "Wed", revenue: 2000 },
  { name: "Thu", revenue: 2780 },
  { name: "Fri", revenue: 1890 },
  { name: "Sat", revenue: 2390 },
  { name: "Sun", revenue: 3490 },
];

const stats = [
  { 
    name: "Total Revenue", 
    value: "₹45,231.89", 
    change: "+20.1%", 
    trend: "up", 
    icon: TrendingUp,
    color: "text-primary"
  },
  { 
    name: "Active Tables", 
    value: "12 / 20", 
    change: "+3 this hour", 
    trend: "up", 
    icon: Users,
    color: "text-accent"
  },
  { 
    name: "Orders Today", 
    value: "48", 
    change: "+12.5%", 
    trend: "up", 
    icon: ShoppingBag,
    color: "text-blue-400"
  },
  { 
    name: "Avg. Prep Time", 
    value: "18m", 
    change: "-2m from avg", 
    trend: "down", 
    icon: Clock,
    color: "text-orange-400"
  },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, Admin</h2>
        <p className="text-slate-400">Here's what's happening at your restaurant today.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
              <stat.icon className="w-12 h-12" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">{stat.name}</p>
              <h3 className="text-2xl font-bold">{stat.value}</h3>
              <div className="flex items-center gap-1 mt-1">
                {stat.trend === "up" ? (
                  <ArrowUpRight className="w-4 h-4 text-accent" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-primary" />
                )}
                <span className={stat.trend === "up" ? "text-accent text-xs" : "text-primary text-xs"}>
                  {stat.change}
                </span>
                <span className="text-[10px] text-slate-500 ml-1">vs last week</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 h-[400px]">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Weekly sales performance</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#0f172a", 
                    borderColor: "#ffffff10", 
                    borderRadius: "12px",
                    color: "#f8fafc" 
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#00d4ff" 
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>You have 5 orders in preparation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-primary border border-white/10">
                    {10 + i}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Table {10 + i}</p>
                    <p className="text-xs text-slate-500">3 items • ₹1,240.00</p>
                  </div>
                  <div className="px-2 py-1 rounded-full bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-wider">
                    Preparing
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
