"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CreditCard, Download, CheckCircle2 } from "lucide-react";

export default function BillingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Billing & Subscription</h2>
        <p className="text-slate-400">Manage your Bhojan platform subscription and view invoices.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Active Plan</CardTitle>
            <CardDescription>You are currently on the Pro Plan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-6 bg-primary/5 rounded-[30px] border border-primary/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-xl text-primary">Pro Plan</p>
                  <p className="text-sm text-slate-500">Next billing on May 24, 2026</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">₹2,499</p>
                <p className="text-xs text-slate-500 uppercase tracking-widest">per month</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
               {[
                 "Unlimited Tables",
                 "Up to 10 Staff Members",
                 "Advanced Analytics",
                 "QR Ordering & Payments",
                 "Kitchen TV Mode",
                 "24/7 Priority Support"
               ].map((f, i) => (
                 <div key={i} className="flex items-center gap-3 text-sm text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                    {f}
                 </div>
               ))}
            </div>

            <div className="pt-6 border-t border-white/5 flex gap-4">
              <Button>Change Plan</Button>
              <Button variant="outline">Cancel Subscription</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                <div>
                  <p className="text-sm font-medium">Apr {24 - i}, 2026</p>
                  <p className="text-[10px] text-slate-500 font-mono">#INV-892{i}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold">₹2,499</span>
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-all text-slate-400">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            <Button variant="ghost" className="w-full text-xs text-slate-500">View All Invoices</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
