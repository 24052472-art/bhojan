"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { 
  Building2, 
  CreditCard, 
  QrCode, 
  Save, 
  Upload, 
  MapPin, 
  Phone, 
  Percent,
  Info,
  Loader2
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("restaurant");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [restaurant, setRestaurant] = useState<any>({
    name: "",
    slug: "",
    address: "",
    phone: "",
    logo_url: "",
    merchant_qr_url: "",
    bank_details: {
      account_name: "",
      bank_name: "",
      account_number: "",
      ifsc: ""
    },
    cgst_percent: 2.5,
    sgst_percent: 2.5,
    service_charge_percent: 5,
    gst_number: ""
  });

  const supabase = createClient();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: profile } = await supabase.from("user_profiles").select("restaurant_id").single();
      if (!profile?.restaurant_id) return;

      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", profile.restaurant_id)
        .single();

      if (error) throw error;
      if (data) {
        setRestaurant({
          ...data,
          bank_details: data.bank_details || {
            account_name: "",
            bank_name: "",
            account_number: "",
            ifsc: ""
          }
        });
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("restaurants")
        .update({
          name: restaurant.name,
          slug: restaurant.slug,
          address: restaurant.address,
          phone: restaurant.phone,
          logo_url: restaurant.logo_url,
          merchant_qr_url: restaurant.merchant_qr_url,
          bank_details: restaurant.bank_details,
          cgst_percent: parseFloat(restaurant.cgst_percent),
          sgst_percent: parseFloat(restaurant.sgst_percent),
          service_charge_percent: parseFloat(restaurant.service_charge_percent),
          gst_number: restaurant.gst_number
        })
        .eq("id", restaurant.id);

      if (error) throw error;
      toast.success("Settings updated successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Restaurant <span className="text-primary">Settings</span></h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Configure your brand, billing, and payment methods.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="h-14 px-8 rounded-2xl bg-primary text-black font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 hover:scale-105 transition-all"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
        </Button>
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
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? "bg-primary text-slate-950 shadow-lg shadow-primary/20"
                : "bg-transparent text-slate-400 hover:text-foreground"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.name}
          </button>
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === "restaurant" && (
          <Card className="bg-[#0b1120] border-white/5 rounded-[48px] p-8">
            <CardHeader className="px-0 pt-0 pb-10">
              <CardTitle className="text-xl font-black uppercase italic tracking-tighter">Basic Information</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">How customers and staff see your restaurant.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-10">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Logo URL</label>
                  <div className="w-32 h-32 rounded-3xl bg-white/5 border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-slate-500 hover:border-primary/50 hover:bg-primary/5 transition-all relative overflow-hidden group">
                    {restaurant.logo_url ? (
                      <img src={restaurant.logo_url} className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                  </div>
                  <input 
                    type="text" 
                    placeholder="IMAGE URL"
                    value={restaurant.logo_url || ""} 
                    onChange={(e) => setRestaurant({...restaurant, logo_url: e.target.value})}
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none focus:border-primary/30 transition-all" 
                  />
                </div>
                <div className="flex-1 w-full space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Restaurant Name</label>
                      <input 
                        type="text" 
                        value={restaurant.name} 
                        onChange={(e) => setRestaurant({...restaurant, name: e.target.value})}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-black uppercase italic outline-none focus:border-primary/30 transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Slug (URL)</label>
                      <input 
                        type="text" 
                        value={restaurant.slug} 
                        onChange={(e) => setRestaurant({...restaurant, slug: e.target.value})}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-black italic outline-none focus:border-primary/30 transition-all" 
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MapPin className="w-3 h-3" /> Address
                  </label>
                  <textarea 
                    value={restaurant.address || ""} 
                    onChange={(e) => setRestaurant({...restaurant, address: e.target.value})}
                    className="w-full bg-white/5 border border-white/5 rounded-3xl px-6 py-5 text-sm font-black uppercase italic outline-none focus:border-primary/30 transition-all min-h-[140px]" 
                  />
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Phone className="w-3 h-3" /> Contact Number
                    </label>
                    <input 
                      type="text" 
                      value={restaurant.phone || ""} 
                      onChange={(e) => setRestaurant({...restaurant, phone: e.target.value})}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-black italic outline-none focus:border-primary/30 transition-all" 
                    />
                  </div>
                  <div className="p-6 bg-primary/5 rounded-[32px] border border-primary/10 flex gap-4">
                    <Info className="w-5 h-5 text-primary shrink-0" />
                    <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest">
                      Your restaurant details are shown on the digital menu and printed on the receipts.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "billing" && (
          <Card className="bg-[#0b1120] border-white/5 rounded-[48px] p-8">
            <CardHeader className="px-0 pt-0 pb-10">
              <CardTitle className="text-xl font-black uppercase italic tracking-tighter">Tax & Service Charges</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Configure GST and other additional fees.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GST Number (Optional)</label>
                    <input 
                      type="text" 
                      value={restaurant.gst_number || ""} 
                      onChange={(e) => setRestaurant({...restaurant, gst_number: e.target.value})}
                      placeholder="e.g. 07AAAAA0000A1Z5" 
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-black uppercase italic outline-none focus:border-primary/30 transition-all" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CGST (%)</label>
                      <input 
                        type="number" 
                        value={restaurant.cgst_percent} 
                        onChange={(e) => setRestaurant({...restaurant, cgst_percent: e.target.value})}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-black italic outline-none focus:border-primary/30 transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SGST (%)</label>
                      <input 
                        type="number" 
                        value={restaurant.sgst_percent} 
                        onChange={(e) => setRestaurant({...restaurant, sgst_percent: e.target.value})}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-black italic outline-none focus:border-primary/30 transition-all" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Charge (%)</label>
                    <input 
                      type="number" 
                      value={restaurant.service_charge_percent} 
                      onChange={(e) => setRestaurant({...restaurant, service_charge_percent: e.target.value})}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-black italic outline-none focus:border-primary/30 transition-all" 
                    />
                  </div>
                </div>
                <div className="p-8 bg-white/5 rounded-[40px] border border-white/5 space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Bill Summary Preview</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs font-black uppercase italic">
                      <span className="text-slate-400">Subtotal</span>
                      <span>₹1,000.00</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-black uppercase italic">
                      <span className="text-slate-400">CGST ({restaurant.cgst_percent}%)</span>
                      <span>₹{(1000 * restaurant.cgst_percent / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-black uppercase italic">
                      <span className="text-slate-400">SGST ({restaurant.sgst_percent}%)</span>
                      <span>₹{(1000 * restaurant.sgst_percent / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-black uppercase italic">
                      <span className="text-slate-400">Service Charge ({restaurant.service_charge_percent}%)</span>
                      <span>₹{(1000 * restaurant.service_charge_percent / 100).toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-white/10 my-4" />
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Grand Total</span>
                      <span className="text-4xl font-black italic text-primary tracking-tighter">
                        ₹{(1000 * (1 + (parseFloat(restaurant.cgst_percent) + parseFloat(restaurant.sgst_percent) + parseFloat(restaurant.service_charge_percent)) / 100)).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "payments" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <Card className="bg-[#0b1120] border-white/5 rounded-[48px] p-8">
              <CardHeader className="px-0 pt-0 pb-10">
                <CardTitle className="text-xl font-black uppercase italic tracking-tighter">Merchant QR Code</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Upload your UPI/Payment QR code URL.</CardDescription>
              </CardHeader>
              <CardContent className="px-0 space-y-6">
                <div className="w-full aspect-square max-w-[280px] mx-auto rounded-[48px] bg-white/5 border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-slate-500 hover:border-primary/50 hover:bg-primary/5 transition-all relative overflow-hidden group">
                  {restaurant.merchant_qr_url ? (
                    <img src={restaurant.merchant_qr_url} className="w-full h-full object-contain p-8" />
                  ) : (
                    <QrCode className="w-12 h-12" />
                  )}
                </div>
                <input 
                  type="text" 
                  placeholder="MERCHANT QR URL"
                  value={restaurant.merchant_qr_url || ""} 
                  onChange={(e) => setRestaurant({...restaurant, merchant_qr_url: e.target.value})}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-primary/30 transition-all" 
                />
                <div className="p-6 bg-accent/5 rounded-[32px] border border-accent/10 flex gap-4">
                  <QrCode className="w-5 h-5 text-accent shrink-0" />
                  <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest">
                    This QR code will be displayed to customers on the checkout page of the digital menu.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0b1120] border-white/5 rounded-[48px] p-8">
              <CardHeader className="px-0 pt-0 pb-10">
                <CardTitle className="text-xl font-black uppercase italic tracking-tighter">Bank Details</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Direct bank transfer information.</CardDescription>
              </CardHeader>
              <CardContent className="px-0 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Holder Name</label>
                    <input 
                      type="text" 
                      value={restaurant.bank_details.account_name} 
                      onChange={(e) => setRestaurant({...restaurant, bank_details: {...restaurant.bank_details, account_name: e.target.value}})}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-black uppercase italic outline-none focus:border-primary/30 transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank Name</label>
                    <input 
                      type="text" 
                      value={restaurant.bank_details.bank_name} 
                      onChange={(e) => setRestaurant({...restaurant, bank_details: {...restaurant.bank_details, bank_name: e.target.value}})}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-black uppercase italic outline-none focus:border-primary/30 transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Number</label>
                    <input 
                      type="text" 
                      value={restaurant.bank_details.account_number} 
                      onChange={(e) => setRestaurant({...restaurant, bank_details: {...restaurant.bank_details, account_number: e.target.value}})}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-black italic outline-none focus:border-primary/30 transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IFSC Code</label>
                    <input 
                      type="text" 
                      value={restaurant.bank_details.ifsc} 
                      onChange={(e) => setRestaurant({...restaurant, bank_details: {...restaurant.bank_details, ifsc: e.target.value}})}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-black italic outline-none focus:border-primary/30 transition-all" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
