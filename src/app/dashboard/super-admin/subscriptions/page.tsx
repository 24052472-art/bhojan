"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Plus, CreditCard, CheckCircle2, TrendingUp } from "lucide-react";

export default function SubscriptionsPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Subscription Plans</h2>
          <p className="text-slate-400">Configure tiers and pricing for the Bhojan platform.</p>
        </div>
        <Button className="gap-2 bg-accent text-slate-950 hover:bg-accent-dark">
          <Plus className="w-4 h-4" /> Create New Plan
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {[
          { name: "Starter", price: "₹999", color: "text-slate-400", features: ["Up to 5 Tables", "2 Staff Members", "Basic Analytics"] },
          { name: "Pro", price: "₹2,499", color: "text-primary", features: ["Unlimited Tables", "10 Staff Members", "Advanced Analytics", "QR Payments"] },
          { name: "Enterprise", price: "₹4,999", color: "text-accent", features: ["Custom Branded App", "Unlimited Staff", "API Access", "Priority Support"] },
        ].map((plan) => (
          <Card key={plan.name} className="relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity`}>
              <CreditCard className="w-24 h-24" />
            </div>
            <div className="space-y-6">
              <div>
                <h3 className={`text-2xl font-black ${plan.color}`}>{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-slate-500 text-sm">/month</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {plan.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                    {f}
                  </div>
                ))}
              </div>

              <Button variant="outline" className="w-full">Edit Plan Details</Button>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue from Subscriptions</CardTitle>
          <CardDescription>Monthly recurring revenue (MRR) tracking.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-white/5 rounded-[40px] text-slate-600">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Revenue chart will appear here as you add more tenants.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
