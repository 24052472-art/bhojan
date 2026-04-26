"use client";

import { 
  ChefHat, 
  Table2, 
  Smartphone, 
  BarChart3, 
  ShieldCheck, 
  Zap,
  ChevronRight,
  ArrowRight,
  Monitor,
  LayoutDashboard,
  Layers,
  Globe
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Professional CTA Button
const ButtonPrimary = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <button className={cn(
    "group relative px-8 py-4 bg-primary text-slate-950 font-black uppercase text-xs tracking-[0.2em] rounded-full overflow-hidden transition-all active:scale-95 shadow-2xl shadow-primary/20 hover:shadow-primary/40",
    className
  )}>
    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
    <span className="relative z-10 flex items-center gap-2">
      {children}
    </span>
  </button>
);

const ButtonSecondary = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <button className={cn(
    "px-8 py-4 bg-white/5 text-white font-black uppercase text-xs tracking-[0.2em] rounded-full border border-white/10 hover:bg-white/10 transition-all active:scale-95",
    className
  )}>
    {children}
  </button>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#05070a] text-white selection:bg-primary/30 font-sans antialiased overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-6 md:px-12 py-6 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-primary text-xl italic shadow-2xl backdrop-blur-3xl">
            B
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase italic hidden sm:block">Bhojan</span>
        </div>
        
        <div className="flex items-center gap-3 pointer-events-auto">
          <Link href="/login" className="hidden sm:block px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
            Login
          </Link>
          <Link href="/login">
            <button className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-3xl hover:bg-white/10 transition-all active:scale-95">
              Get Started
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 md:pt-48 pb-20 md:pb-40 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col items-center text-center gap-8 md:gap-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/[0.03] border border-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-primary"
            >
              <Zap className="w-4 h-4" /> Next-Generation Operations
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.85] uppercase italic"
            >
              Scale your <br />
              <span className="text-slate-800">Restaurant.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base md:text-xl text-slate-500 max-w-2xl font-medium leading-relaxed uppercase tracking-widest italic"
            >
              A professional Management Suite for modern dining. POS, Kitchen Matrix, and Digital Ordering—unified in one ecosystem.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-6"
            >
              <Link href="/login" className="w-full sm:w-auto">
                <ButtonPrimary className="w-full">
                  Deploy Bhojan <ChevronRight className="w-5 h-5" />
                </ButtonPrimary>
              </Link>
              <ButtonSecondary className="w-full sm:w-auto">
                System Overview
              </ButtonSecondary>
            </motion.div>
          </div>

          {/* Hero Visual */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-24 md:mt-40 relative group"
          >
            <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="relative sector-card p-2 md:p-4 overflow-hidden border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
               <div className="absolute inset-0 bg-gradient-to-t from-[#05070a] via-transparent to-transparent z-10" />
               <img 
                 src="/assets/dashboard.png" 
                 alt="Bhojan Dashboard Interface" 
                 className="w-full h-auto rounded-[24px] md:rounded-[40px] opacity-90 scale-[1.01] group-hover:scale-100 transition-transform duration-1000"
               />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section className="py-20 md:py-40 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end gap-12 mb-20 md:mb-32">
          <div className="space-y-6 max-w-xl">
            <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">
              Built for <span className="text-slate-800 text-glow">Velocity.</span>
            </h2>
            <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.3em] leading-relaxed">
              Every tool is engineered for speed, accuracy, and operational excellence in high-pressure environments.
            </p>
          </div>
          <div className="flex items-center gap-4 h-fit pb-2 border-b border-white/5">
             <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary italic">Operational Suite</span>
             <ArrowRight className="w-4 h-4 text-primary" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 auto-rows-[300px] md:auto-rows-[400px]">
          {/* Big Card - QR Ordering */}
          <motion.div 
            whileHover={{ y: -8 }}
            className="md:col-span-8 sector-card overflow-hidden flex flex-col md:flex-row p-0"
          >
            <div className="flex-1 p-10 md:p-14 flex flex-col justify-between">
               <div className="space-y-6">
                 <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xl shadow-primary/10">
                   <Smartphone className="w-8 h-8" />
                 </div>
                 <h3 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter">QR Digital Matrix</h3>
                 <p className="text-slate-500 text-[10px] md:text-xs font-black uppercase tracking-widest leading-relaxed">
                   Direct guest-to-kitchen ordering protocol. Zero latency. Instant settlement.
                 </p>
               </div>
               <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-widest italic group cursor-pointer">
                 View mobile spec <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
               </div>
            </div>
            <div className="flex-1 bg-white/5 relative p-6 md:p-10 flex items-center justify-center">
               <img src="/assets/mobile.png" className="w-auto h-full object-contain drop-shadow-2xl" alt="Mobile Preview" />
            </div>
          </motion.div>

          {/* Square Card - KDS */}
          <motion.div 
            whileHover={{ y: -8 }}
            className="md:col-span-4 sector-card p-10 md:p-14 flex flex-col justify-between"
          >
             <div className="space-y-6">
               <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                 <Monitor className="w-8 h-8" />
               </div>
               <h3 className="text-3xl font-black uppercase italic tracking-tighter">Kitchen KDS</h3>
               <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                 Real-time production tracking for culinary units.
               </p>
             </div>
             <div className="flex items-center gap-2 text-slate-800 text-[10px] font-black uppercase tracking-widest italic">
               120ms Latency
             </div>
          </motion.div>

          {/* Square Card - Analytics */}
          <motion.div 
            whileHover={{ y: -8 }}
            className="md:col-span-4 sector-card p-10 md:p-14 flex flex-col justify-between"
          >
             <div className="space-y-6">
               <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                 <BarChart3 className="w-8 h-8" />
               </div>
               <h3 className="text-3xl font-black uppercase italic tracking-tighter">Telemetry</h3>
               <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                 Data-driven insights into your revenue flow and staff performance.
               </p>
             </div>
             <div className="flex items-center gap-2 text-slate-800 text-[10px] font-black uppercase tracking-widest italic">
               Live Data Stream
             </div>
          </motion.div>

          {/* Large Card - Table Mgmt */}
          <motion.div 
            whileHover={{ y: -8 }}
            className="md:col-span-8 sector-card p-10 md:p-14 flex flex-col md:flex-row justify-between gap-12"
          >
             <div className="space-y-10 flex-1">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                   <Layers className="w-8 h-8" />
                </div>
                <div className="space-y-4">
                   <h3 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter">Station Control</h3>
                   <p className="text-slate-500 text-[10px] md:text-xs font-black uppercase tracking-widest leading-relaxed">
                     Visual floor plan editor with live status indicators and density mapping.
                   </p>
                </div>
                <div className="flex gap-4">
                   <div className="px-5 py-2 rounded-full bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest">Floor Alpha</div>
                   <div className="px-5 py-2 rounded-full bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest">Patio Beta</div>
                </div>
             </div>
             <div className="flex-1 bg-white/[0.02] rounded-[32px] border border-white/[0.03] p-8 flex items-center justify-center animate-shimmer">
                <Table2 className="w-24 h-24 text-slate-800 opacity-20" />
             </div>
          </motion.div>
        </div>
      </section>

      {/* Global Presence Section */}
      <section className="py-20 md:py-40 bg-white/[0.01] border-y border-white/[0.03] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-20">
          <div className="flex-1 space-y-10">
             <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary italic">Global Infrastructure</span>
                <h2 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">
                  Universal <br /> <span className="text-slate-800">Deployment.</span>
                </h2>
             </div>
             <p className="text-slate-500 text-sm md:text-base font-medium max-w-lg leading-relaxed italic">
                From local cafes to enterprise chains, Bhojan provides the backbone for over 500+ premium dining establishments worldwide.
             </p>
             <div className="grid grid-cols-2 gap-8">
                <div>
                   <p className="text-3xl font-black italic">500+</p>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-700 mt-2">Active Sectors</p>
                </div>
                <div>
                   <p className="text-3xl font-black italic">99.9%</p>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-700 mt-2">Uptime Matrix</p>
                </div>
             </div>
          </div>
          <div className="flex-1 relative">
             <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full" />
             <Globe className="w-full h-auto text-slate-800/10 relative z-10" strokeWidth={1} />
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-40 px-6 relative">
        <div className="max-w-5xl mx-auto sector-card p-12 md:p-32 text-center relative z-10 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
          <h2 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.9] mb-12">
            Initiate <br /> <span className="text-primary text-glow">System Scale.</span>
          </h2>
          <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.3em] mb-16 max-w-lg mx-auto leading-relaxed">
            Provision your restaurant environment in minutes. No credit card required for initial deployment.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
            <Link href="/login" className="w-full sm:w-auto">
              <ButtonPrimary className="w-full px-12">Create Account</ButtonPrimary>
            </Link>
            <button className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all border-b border-white/10 pb-2">
              Speak with Infrastructure Lead
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/[0.03]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
           <div className="flex items-center gap-4 opacity-50">
             <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-white text-lg italic">
               B
             </div>
             <span className="text-lg font-black tracking-tighter uppercase italic">Bhojan</span>
           </div>
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">
             © 2026 Bhojan Cloud Infrastructure • All rights reserved.
           </p>
           <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-800">
             <Link href="/about" className="hover:text-white transition-colors">About</Link>
             <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
             <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
             <Link href="/security" className="hover:text-white transition-colors">Security</Link>
           </div>
        </div>
      </footer>
    </div>
  );
}
