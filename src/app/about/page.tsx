"use client";

import { ChevronLeft, Info, Users, Target, Rocket } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#05070a] text-white selection:bg-primary/30 font-sans antialiased">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-6 md:px-12 py-6 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <Link href="/" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-primary text-xl italic shadow-2xl backdrop-blur-3xl hover:bg-white/10 transition-all">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <span className="text-xl font-black tracking-tighter uppercase italic">Our Story</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto pt-40 pb-20 px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Info className="w-8 h-8" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter">Mission <br /> <span className="text-slate-800">Statement.</span></h1>
            <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.3em]">Engineering the Future of Dining</p>
          </div>

          <div className="sector-card p-8 md:p-16 space-y-16 bg-white/[0.01]">
            <section className="space-y-6">
               <div className="flex items-center gap-4 text-primary">
                  <Rocket className="w-6 h-6" />
                  <h2 className="text-2xl font-black uppercase italic tracking-tight">The Vision</h2>
               </div>
               <p className="text-slate-400 leading-relaxed font-medium">
                  Bhojan was founded in 2026 with a singular goal: to eliminate operational friction in the restaurant industry. We believe that technology should empower chefs and staff, not complicate their work.
               </p>
            </section>

            <div className="grid md:grid-cols-2 gap-12">
               <section className="space-y-6">
                  <div className="flex items-center gap-4 text-primary">
                     <Target className="w-6 h-6" />
                     <h2 className="text-xl font-black uppercase italic tracking-tight">Precision</h2>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">
                     We build high-performance infrastructure that handles thousands of orders with sub-second latency. Every line of code is optimized for reliability.
                  </p>
               </section>
               <section className="space-y-6">
                  <div className="flex items-center gap-4 text-primary">
                     <Users className="w-6 h-6" />
                     <h2 className="text-xl font-black uppercase italic tracking-tight">Community</h2>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">
                     Bhojan is built alongside restaurant owners. We listen to the people on the floor to build features that actually matter.
                  </p>
               </section>
            </div>

            <section className="p-10 rounded-[40px] bg-white/[0.02] border border-white/[0.05] text-center space-y-4">
               <h3 className="text-xl font-black uppercase italic tracking-tight italic">Join the Elite.</h3>
               <p className="text-slate-500 text-sm">Over 500+ restaurants have already migrated to the Bhojan Ecosystem.</p>
               <Link href="/login" className="inline-block mt-4 text-primary font-black uppercase text-[10px] tracking-widest border-b border-primary/20 pb-1">
                  Start your journey
               </Link>
            </section>
          </div>
        </motion.div>
      </main>

      <footer className="py-20 px-6 border-t border-white/[0.03] text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">
          Bhojan Cloud Infrastructure • Built for the Bold
        </p>
      </footer>
    </div>
  );
}
