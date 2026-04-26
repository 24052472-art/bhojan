"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  Building2, 
  CreditCard, 
  QrCode, 
  Save, 
  Upload, 
  MapPin, 
  Phone, 
  Percent,
  Info
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("restaurant");

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight">Restaurant Settings</h2>
        <p className="text-slate-400">Configure your brand, billing, and payment methods.</p>
      </div>

      <div className="flex items-center gap-2 p-1 bg-white/5 rounded-2xl border border-white/10 w-fit">
        {[
          { id: "restaurant", name: "Restaurant Profile", icon: Building2 },
          { id: "billing", name: "Billing & Taxes", icon: Percent },
          { id: "payments", name: "Payments & QR", icon: CreditCard },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-primary text-slate-950 shadow-lg shadow-primary/20"
                : "bg-transparent text-slate-400 hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.name}
          </button>
        ))}
      </div>

      {activeTab === "restaurant" && (
        <div className="grid gap-8 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>How customers and staff see your restaurant.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-8">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-3xl bg-white/5 border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-slate-500 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                    <Upload className="w-6 h-6 mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-center">Logo</span>
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Restaurant Name</label>
                      <input type="text" defaultValue="Bhojan Fine Dine" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Slug (URL)</label>
                      <input type="text" defaultValue="bhojan-fine-dine" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 transition-all" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MapPin className="w-3 h-3" /> Address
                  </label>
                  <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 transition-all min-h-[100px]" defaultValue="123, Food Street, Cyber Hub, Gurgaon - 122002" />
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Phone className="w-3 h-3" /> Contact Number
                    </label>
                    <input type="text" defaultValue="+91 98765 43210" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 transition-all" />
                  </div>
                  <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-3">
                    <Info className="w-5 h-5 text-primary shrink-0" />
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Your restaurant details are shown on the digital menu and printed on the receipts.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "billing" && (
        <div className="grid gap-8 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle>Tax & Service Charges</CardTitle>
              <CardDescription>Configure GST and other additional fees.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">GST Number (Optional)</label>
                    <input type="text" placeholder="e.g. 07AAAAA0000A1Z5" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">CGST (%)</label>
                      <input type="number" defaultValue={2.5} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">SGST (%)</label>
                      <input type="number" defaultValue={2.5} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 transition-all" />
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Service Charge (%)</label>
                    <input type="number" defaultValue={5} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 transition-all" />
                  </div>
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
                    <h4 className="text-sm font-semibold">Bill Summary Preview</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Subtotal</span>
                        <span>₹1,000.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">CGST (2.5%)</span>
                        <span>₹25.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">SGST (2.5%)</span>
                        <span>₹25.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Service Charge (5%)</span>
                        <span>₹50.00</span>
                      </div>
                      <div className="h-[1px] bg-white/10 my-2" />
                      <div className="flex justify-between text-base font-bold text-primary">
                        <span>Grand Total</span>
                        <span>₹1,100.00</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "payments" && (
        <div className="grid gap-8 animate-fade-in">
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Merchant QR Code</CardTitle>
                <CardDescription>Upload your UPI/Payment QR code to show at checkout.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="w-full aspect-square max-w-[250px] mx-auto rounded-3xl bg-white/5 border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-slate-500 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer relative overflow-hidden group">
                  <Upload className="w-8 h-8 mb-3" />
                  <span className="text-xs font-bold uppercase tracking-widest text-center">Upload QR Code</span>
                  <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="primary" size="sm">Choose Image</Button>
                  </div>
                </div>
                <div className="p-4 bg-accent/5 rounded-2xl border border-accent/10 flex gap-3">
                  <QrCode className="w-5 h-5 text-accent shrink-0" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    This QR code will be displayed to customers on the checkout page of the digital menu.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bank Details</CardTitle>
                <CardDescription>Direct bank transfer information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Account Holder Name</label>
                  <input type="text" placeholder="e.g. Bhojan Hospitality Pvt Ltd" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Bank Name</label>
                  <input type="text" placeholder="e.g. HDFC Bank" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Account Number</label>
                  <input type="text" placeholder="e.g. 50100123456789" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">IFSC Code</label>
                  <input type="text" placeholder="e.g. HDFC0001234" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 transition-all" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-4">
        <Button variant="ghost">Discard Changes</Button>
        <Button className="gap-2 px-12">
          <Save className="w-4 h-4" /> Save Settings
        </Button>
      </div>
    </div>
  );
}
