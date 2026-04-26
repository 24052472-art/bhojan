"use client";

import { ChevronLeft, Shield } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#05070a] text-white selection:bg-primary/30 font-sans antialiased">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-6 md:px-12 py-6 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <Link href="/" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-primary text-xl italic shadow-2xl backdrop-blur-3xl hover:bg-white/10 transition-all">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <span className="text-xl font-black tracking-tighter uppercase italic">Privacy Policy</span>
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
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter">Data <br /> <span className="text-slate-800">Governance.</span></h1>
            <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.3em]">Last Updated: April 2026</p>
          </div>

          <div className="sector-card p-8 md:p-16 space-y-12 bg-white/[0.01]">
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase italic tracking-tight">01. Overview</h2>
              <p className="text-slate-400 leading-relaxed font-medium">
                Bhojan Cloud Infrastructure ("Bhojan", "we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our restaurant management platform.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase italic tracking-tight">02. Data Collection</h2>
              <div className="grid gap-4">
                {[
                  { title: "Identity", desc: "Full name, restaurant name, and professional credentials." },
                  { title: "Operations", desc: "Menu items, table layouts, staff assignments, and transaction logs." },
                  { title: "Telemetry", desc: "Usage patterns, device identifiers, and performance metrics." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.03]">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                    <div>
                      <p className="font-black uppercase text-[10px] tracking-widest text-white">{item.title}</p>
                      <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase italic tracking-tight">03. Security Protocols</h2>
              <p className="text-slate-400 leading-relaxed font-medium">
                We employ enterprise-grade multi-tenant isolation. Your restaurant's data is logically separated from other tenants and encrypted at rest using AES-256 standards. Access is restricted via OAuth2 and Firebase Authentication protocols.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase italic tracking-tight">04. Data Sovereignty</h2>
              <p className="text-slate-400 leading-relaxed font-medium">
                You retain full ownership of your operational data. You may export or request deletion of your data at any time via the Admin Console or by contacting our infrastructure lead.
              </p>
            </section>
          </div>
        </motion.div>
      </main>

      <footer className="py-20 px-6 border-t border-white/[0.03] text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">
          Bhojan Cloud Infrastructure • Trust & Transparency
        </p>
      </footer>
    </div>
  );
}
