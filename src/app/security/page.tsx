"use client";

import { ChevronLeft, Lock, ShieldCheck, Zap, Database, Globe } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[#05070a] text-white selection:bg-primary/30 font-sans antialiased">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-6 md:px-12 py-6 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <Link href="/" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-primary text-xl italic shadow-2xl backdrop-blur-3xl hover:bg-white/10 transition-all">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <span className="text-xl font-black tracking-tighter uppercase italic">Security Matrix</span>
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
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter">Hardened <br /> <span className="text-slate-800">Defenses.</span></h1>
            <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.3em]">Infrastructure Integrity Report</p>
          </div>

          <div className="grid gap-6">
            {[
              { 
                title: "Multi-Tenant Isolation", 
                desc: "Each restaurant operates in a logically isolated environment. Data leakage is prevented through Row Level Security (RLS) and strict tenant mapping.",
                icon: ShieldCheck
              },
              { 
                title: "End-to-End Encryption", 
                desc: "All traffic is tunneled through TLS 1.3. Sensitive data, including financial logs and credentials, is encrypted using AES-256 at rest.",
                icon: Zap
              },
              { 
                title: "Global Redundancy", 
                desc: "Data is replicated across multiple geographical clusters (Vercel Edge & Supabase Nodes) to ensure zero data loss during regional outages.",
                icon: Globe
              },
              { 
                title: "Authentication Layers", 
                desc: "Enterprise-grade identity management via Firebase Auth with MFA support and granular RBAC (Role-Based Access Control).",
                icon: Database
              }
            ].map((feature, i) => (
              <div key={i} className="sector-card p-10 flex flex-col md:flex-row gap-10 items-start">
                 <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-primary shrink-0">
                    <feature.icon className="w-8 h-8" />
                 </div>
                 <div className="space-y-4">
                    <h2 className="text-2xl font-black uppercase italic tracking-tight">{feature.title}</h2>
                    <p className="text-slate-500 leading-relaxed font-medium">
                       {feature.desc}
                    </p>
                 </div>
              </div>
            ))}
          </div>

          <div className="sector-card p-12 bg-primary/5 border-primary/20 text-center space-y-6">
             <h3 className="text-2xl font-black uppercase italic tracking-tighter">Reporting a Vulnerability?</h3>
             <p className="text-slate-400 text-sm max-w-lg mx-auto">
                Security is our highest priority. If you discover a system anomaly, please contact our security team at security@bhojan.cloud.
             </p>
             <button className="px-8 py-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                Submit Report
             </button>
          </div>
        </motion.div>
      </main>

      <footer className="py-20 px-6 border-t border-white/[0.03] text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">
          Bhojan Security Systems • Version 1.0.4
        </p>
      </footer>
    </div>
  );
}
