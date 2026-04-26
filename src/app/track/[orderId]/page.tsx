"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { 
  CheckCircle2, 
  ChefHat, 
  Clock, 
  Utensils, 
  ChevronLeft,
  MessageCircle,
  Star
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const steps = [
  { id: 'pending', name: 'Order Placed', time: '12:45 PM', icon: Clock, done: true },
  { id: 'preparing', name: 'Kitchen is Cooking', time: '12:48 PM', icon: ChefHat, done: true },
  { id: 'ready', name: 'Ready to Serve', time: '-', icon: CheckCircle2, done: false },
  { id: 'served', name: 'Enjoy your meal!', time: '-', icon: Utensils, done: false },
];

export default function OrderTracking({ params }: { params: { orderId: string } }) {
  return (
    <div className="min-h-screen bg-[#020617] text-white p-6">
      <header className="flex items-center gap-4 mb-10">
        <Link href="/" className="w-10 h-10 rounded-full glass flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Track Your Order</h1>
          <p className="text-xs text-slate-500 uppercase tracking-widest">Order ID: {params.orderId || "#ORD-1234"}</p>
        </div>
      </header>

      <section className="space-y-8">
        <div className="text-center space-y-4 py-8">
          <div className="w-24 h-24 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto relative">
             <ChefHat className="w-12 h-12 text-primary animate-bounce" />
             <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
          <div>
            <h2 className="text-2xl font-black">Kitchen is Cooking</h2>
            <p className="text-slate-400 text-sm">Chef Rahul is preparing your Paneer Tikka.</p>
          </div>
        </div>

        <Card className="p-0 overflow-hidden border-white/5">
          <div className="p-6 space-y-8">
            {steps.map((step, idx) => (
              <div key={step.id} className="relative flex gap-6">
                {idx !== steps.length - 1 && (
                  <div className={`absolute left-6 top-10 w-[2px] h-10 ${step.done ? 'bg-primary' : 'bg-white/10'}`} />
                )}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 z-10 ${
                  step.done ? 'bg-primary text-slate-950 shadow-[0_0_20px_rgba(0,212,255,0.4)]' : 'bg-white/5 text-slate-600 border border-white/10'
                }`}>
                  <step.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex justify-between items-center">
                    <p className={`font-bold ${step.done ? 'text-white' : 'text-slate-600'}`}>{step.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">{step.time}</p>
                  </div>
                  {step.id === 'preparing' && (
                    <p className="text-xs text-primary mt-1 font-medium animate-pulse">Estimated: 8 mins remaining</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <button className="glass p-6 rounded-[30px] flex flex-col items-center gap-3 border-white/5">
            <MessageCircle className="w-6 h-6 text-primary" />
            <span className="text-xs font-bold">Call Waiter</span>
          </button>
          <button className="glass p-6 rounded-[30px] flex flex-col items-center gap-3 border-white/5">
             <Star className="w-6 h-6 text-accent" />
             <span className="text-xs font-bold">Rate Experience</span>
          </button>
        </div>
      </section>

      <footer className="mt-12 text-center">
        <p className="text-[10px] text-slate-600 uppercase tracking-[0.3em] font-bold">
          Bhojan Real-Time Tracking Engine
        </p>
      </footer>
    </div>
  );
}
