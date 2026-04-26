"use client";

import { Button } from "@/components/ui/Card";
import { 
  ChefHat, 
  Table2, 
  Smartphone, 
  BarChart3, 
  ShieldCheck, 
  Zap,
  ChevronRight,
  Star,
  PlayCircle
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

// Custom Button for Landing Page to match design
const LandingButton = ({ children, variant = "primary", className = "" }: any) => (
  <button className={`px-8 py-4 rounded-2xl font-bold transition-all active:scale-95 flex items-center gap-2 ${
    variant === "primary" 
      ? "bg-primary text-slate-950 shadow-[0_20px_40px_rgba(0,212,255,0.3)] hover:shadow-[0_25px_50px_rgba(0,212,255,0.4)]" 
      : "bg-white/5 text-white border border-white/10 hover:bg-white/10"
  } ${className}`}>
    {children}
  </button>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-hidden selection:bg-primary/30">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 px-8 py-4 flex items-center justify-between backdrop-blur-2xl">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent p-[1px]">
            <div className="w-full h-full rounded-[11px] bg-[#020617] flex items-center justify-center font-black text-primary">B</div>
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase">Bhojan</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#features" className="hover:text-primary transition-colors">Features</a>
          <a href="#solutions" className="hover:text-primary transition-colors">Solutions</a>
          <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Login</Link>
          <Link href="/login">
            <button className="px-6 py-2.5 rounded-xl bg-primary text-slate-950 font-bold text-sm shadow-lg shadow-primary/20">Get Started</button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-8 max-w-7xl mx-auto">
        {/* Glows */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full -z-10" />
        
        <div className="text-center space-y-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-primary"
          >
            <Zap className="w-3 h-3" /> The Future of Restaurant Management
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9]"
          >
            Manage your restaurant <br />
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-text-shimmer">with intelligence.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            A production-grade SaaS for modern dining. POS, Kitchen Display, Waiter App, and QR Ordering—all synced in real-time.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col md:flex-row items-center justify-center gap-6"
          >
            <Link href="/login">
              <LandingButton variant="primary">
                Start Free Trial <ChevronRight className="w-5 h-5" />
              </LandingButton>
            </Link>
            <LandingButton variant="secondary">
              <PlayCircle className="w-5 h-5" /> Watch Demo
            </LandingButton>
          </motion.div>
        </div>

        {/* Dashboard Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="mt-20 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent z-10" />
          <div className="glass rounded-[40px] p-4 border-white/10 shadow-2xl relative overflow-hidden">
             <img 
               src="https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1200" 
               alt="Bhojan Dashboard Preview" 
               className="w-full rounded-[30px] opacity-80"
             />
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-primary/20 backdrop-blur-xl border border-primary/30 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                  <PlayCircle className="w-10 h-10 text-primary" />
                </div>
             </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-8 max-w-7xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-4xl md:text-5xl font-black">Everything you need to scale.</h2>
          <p className="text-slate-400">Precision-engineered tools for every role in your restaurant.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { 
              title: "Kitchen TV Mode", 
              desc: "Real-time order synchronization with visual status tracking and sound alerts.",
              icon: ChefHat,
              color: "bg-orange-500/10 text-orange-400"
            },
            { 
              title: "QR Digital Menu", 
              desc: "Contactless ordering and payments directly from the customer's smartphone.",
              icon: Smartphone,
              color: "bg-primary/10 text-primary"
            },
            { 
              title: "Smart Inventory", 
              desc: "Track stock levels automatically and get notified before items run out.",
              icon: Zap,
              color: "bg-accent/10 text-accent"
            },
            { 
              title: "Table Management", 
              desc: "Visual table editor with live occupancy status and waiter assignments.",
              icon: Table2,
              color: "bg-blue-500/10 text-blue-400"
            },
            { 
              title: "Deep Analytics", 
              desc: "Identify top-selling dishes and track revenue growth with intuitive charts.",
              icon: BarChart3,
              color: "bg-purple-500/10 text-purple-400"
            },
            { 
              title: "Multi-Tenant Security", 
              desc: "Enterprise-grade isolation ensures your restaurant's data is always secure.",
              icon: ShieldCheck,
              color: "bg-green-500/10 text-green-400"
            }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className="glass p-8 rounded-[40px] border-white/5 space-y-6"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${feature.color}`}>
                <feature.icon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-white/[0.02] border-y border-white/5 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="space-y-4 text-center md:text-left">
            <div className="flex gap-1 justify-center md:justify-start">
              {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />)}
            </div>
            <h3 className="text-3xl font-bold">Trusted by 500+ Top Restaurants</h3>
            <p className="text-slate-400">Join the elite restaurants using Bhojan for their operations.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8 opacity-40 grayscale contrast-200">
             <span className="text-2xl font-black italic">ZOMATO</span>
             <span className="text-2xl font-black italic">SWIGGY</span>
             <span className="text-2xl font-black italic">STRIPE</span>
             <span className="text-2xl font-black italic">NOTION</span>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-40 px-8 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 blur-[150px] rounded-full" />
        <div className="max-w-4xl mx-auto glass p-12 md:p-20 rounded-[60px] border-primary/20 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-black mb-8">Ready to transform your dining experience?</h2>
          <p className="text-xl text-slate-400 mb-12">No credit card required. 14-day free trial on all Pro features.</p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <Link href="/login">
              <LandingButton className="w-full md:w-auto">Start Now for Free</LandingButton>
            </Link>
            <button className="text-primary font-bold hover:underline">Speak with a Specialist</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 border-t border-white/5 text-center text-slate-600 text-sm">
        <p>© 2026 Bhojan Cloud Infrastructure. All rights reserved.</p>
      </footer>
    </div>
  );
}
