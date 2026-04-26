"use client";

import { ChevronLeft, FileText } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#05070a] text-white selection:bg-primary/30 font-sans antialiased">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-6 md:px-12 py-6 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <Link href="/" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-primary text-xl italic shadow-2xl backdrop-blur-3xl hover:bg-white/10 transition-all">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <span className="text-xl font-black tracking-tighter uppercase italic">Terms of Service</span>
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
              <FileText className="w-8 h-8" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter">System <br /> <span className="text-slate-800">Protocol.</span></h1>
            <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.3em]">Agreement Version: 2.0</p>
          </div>

          <div className="sector-card p-8 md:p-16 space-y-12 bg-white/[0.01]">
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase italic tracking-tight">01. Service Provision</h2>
              <p className="text-slate-400 leading-relaxed font-medium">
                By deploying the Bhojan platform, you agree to comply with these terms. We provide a cloud-based restaurant management ecosystem including POS, KDS, and Digital Menu infrastructure.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase italic tracking-tight">02. License & Access</h2>
              <p className="text-slate-400 leading-relaxed font-medium">
                Bhojan grants you a non-exclusive, non-transferable license to access the platform. You are responsible for all activity occurring under your account and must maintain the confidentiality of your staff credentials and API keys.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase italic tracking-tight">03. Operational Reliability</h2>
              <p className="text-slate-400 leading-relaxed font-medium">
                We aim for 99.9% uptime. However, service may be interrupted for critical infrastructure maintenance. We are not liable for any revenue loss during unforeseen downtime or third-party service failures (e.g., Supabase or Firebase outages).
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase italic tracking-tight">04. Prohibited Usage</h2>
              <p className="text-slate-400 leading-relaxed font-medium">
                Any attempt to reverse engineer the Bhojan binary, circumvent security layers, or use the platform for fraudulent transactions will result in immediate system termination and account liquidation.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase italic tracking-tight">05. Termination</h2>
              <p className="text-slate-400 leading-relaxed font-medium">
                You may terminate your subscription at any time. Upon termination, your access will be revoked, and your restaurant's data will be purged from our active clusters within 30 days.
              </p>
            </section>
          </div>
        </motion.div>
      </main>

      <footer className="py-20 px-6 border-t border-white/[0.03] text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">
          Bhojan Cloud Infrastructure • Operating Standards
        </p>
      </footer>
    </div>
  );
}
