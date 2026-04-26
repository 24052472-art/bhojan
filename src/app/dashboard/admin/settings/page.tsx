"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
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
  Loader2,
  Smartphone,
  Download,
  Apple,
  Chrome
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("restaurant");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [restaurant, setRestaurant] = useState<any>({
    id: "",
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
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("restaurant_id")
        .eq("id", user.id)
        .single();
        
      if (profile?.restaurant_id) {
        fetchRestaurantData(profile.restaurant_id);
      } else {
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      setIsLoading(false);
    }
  };

  const fetchRestaurantData = async (resId: string) => {
    try {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", resId)
        .single();

      if (error) throw error;
      if (data) {
        setRestaurant({
          ...data,
          cgst_percent: (data.tax_percent || 5) / 2,
          sgst_percent: (data.tax_percent || 5) / 2,
          bank_details: data.bank_details || {
            account_name: "",
            bank_name: "",
            account_number: "",
            ifsc: ""
          }
        });
      }
    } catch (e) {
      toast.error("Failed to load details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'qr') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'logo') {
        setRestaurant({ ...restaurant, logo_url: reader.result as string });
      } else {
        setRestaurant({ ...restaurant, merchant_qr_url: reader.result as string });
      }
      toast.success("Ready to save.");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!restaurant.id) return;
    setIsSaving(true);
    try {
      const totalTax = (parseFloat(restaurant.cgst_percent) || 0) + (parseFloat(restaurant.sgst_percent) || 0);

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
          tax_percent: totalTax,
          service_charge_percent: parseFloat(restaurant.service_charge_percent) || 0,
          gst_number: restaurant.gst_number
        })
        .eq("id", restaurant.id);

      if (error) throw error;
      toast.success("Sector parameters updated!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-40">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="w-full space-y-8 md:space-y-12 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/[0.03] pb-8 md:pb-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-[0.3em]">
            <Building2 className="w-3 h-3" /> Core Configuration
          </div>
          <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white leading-none">Sector <span className="text-slate-500">Settings</span></h2>
          <p className="text-[10px] md:text-xs font-black text-slate-700 uppercase tracking-widest leading-relaxed">Configure your brand, billing, and payment protocols.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full md:w-auto h-16 px-10 rounded-[28px] bg-primary text-black font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 hover:scale-105 transition-all active:scale-95"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Commit Changes</>}
        </Button>
      </div>

      <div className="flex bg-white/5 p-1.5 rounded-[24px] md:rounded-[32px] border border-white/10 w-full md:w-fit overflow-x-auto no-scrollbar shrink-0">
        {[
          { id: "restaurant", name: "Identity", icon: Building2 },
          { id: "billing", name: "Levies", icon: Percent },
          { id: "payments", name: "Channels", icon: CreditCard },
          { id: "mobile", name: "Mobile", icon: Smartphone },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center justify-center gap-3 px-6 md:px-10 py-3 md:py-4 rounded-[20px] md:rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
              activeTab === tab.id
                ? "bg-primary text-slate-950 shadow-2xl shadow-primary/20"
                : "bg-transparent text-slate-600 hover:text-white"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="whitespace-nowrap">{tab.name}</span>
          </button>
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        {activeTab === "restaurant" && (
          <Card className="bg-[#0b1120] border-white/5 rounded-[40px] md:rounded-[56px] p-6 md:p-16 space-y-12">
            <div className="space-y-2">
              <CardTitle className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter text-white">Basic Identification</CardTitle>
              <CardDescription className="text-[9px] md:text-xs font-black uppercase tracking-widest text-slate-700 leading-relaxed">How customers and assets perceive your sector identity.</CardDescription>
            </div>
            
            <div className="space-y-12">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-10 md:gap-16">
                <div className="space-y-4 w-full lg:w-auto">
                  <label className="text-[9px] md:text-[10px] font-black text-slate-700 uppercase tracking-widest ml-4 italic">Sector Brandmark</label>
                  <div className="flex flex-col gap-6">
                    <div 
                      onClick={() => document.getElementById('logo-upload')?.click()}
                      className="w-32 h-32 md:w-44 md:h-44 rounded-[32px] md:rounded-[48px] bg-white/5 border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-slate-800 hover:border-primary/50 hover:bg-primary/5 transition-all relative overflow-hidden group cursor-pointer"
                    >
                      {restaurant.logo_url ? (
                        <img src={restaurant.logo_url} className="w-full h-full object-cover" alt="Logo" />
                      ) : (
                        <Upload className="w-8 h-8" />
                      )}
                      <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                         <span className="text-[10px] font-black uppercase text-white tracking-widest">Update</span>
                      </div>
                    </div>
                    <input 
                      type="file" 
                      id="logo-upload" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => handleImageUpload(e, 'logo')} 
                    />
                    <input 
                      type="text" 
                      placeholder="OR EXTERNAL RESOURCE URL"
                      value={restaurant.logo_url || ""} 
                      onChange={(e) => setRestaurant({...restaurant, logo_url: e.target.value})}
                      className="w-full lg:w-44 bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-[8px] font-black tracking-widest outline-none focus:border-primary/30 transition-all text-white placeholder:text-slate-900" 
                    />
                  </div>
                </div>

                <div className="flex-1 w-full space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    <div className="space-y-3">
                      <label className="text-[9px] md:text-[10px] font-black text-slate-700 uppercase tracking-widest ml-4 italic">Designated Name</label>
                      <input 
                        type="text" 
                        value={restaurant.name} 
                        onChange={(e) => setRestaurant({...restaurant, name: e.target.value})}
                        className="w-full bg-white/5 border border-white/5 rounded-[24px] px-8 py-5 md:py-6 text-base md:text-xl font-black italic outline-none focus:border-primary/50 transition-all text-white tracking-tighter" 
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[9px] md:text-[10px] font-black text-slate-700 uppercase tracking-widest ml-4 italic">Resource Slug</label>
                      <input 
                        type="text" 
                        value={restaurant.slug} 
                        onChange={(e) => setRestaurant({...restaurant, slug: e.target.value})}
                        className="w-full bg-white/5 border border-white/5 rounded-[24px] px-8 py-5 md:py-6 text-base md:text-xl font-black italic outline-none focus:border-primary/50 transition-all text-white tracking-tighter" 
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 border-t border-white/[0.03] pt-12">
                <div className="space-y-4">
                  <label className="text-[9px] md:text-[10px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2 ml-4 italic">
                    <MapPin className="w-4 h-4" /> Sector Coordinates
                  </label>
                  <textarea 
                    value={restaurant.address || ""} 
                    onChange={(e) => setRestaurant({...restaurant, address: e.target.value})}
                    placeholder="ENTER PHYSICAL SECTOR LOCATION DATA"
                    className="w-full bg-white/5 border border-white/5 rounded-[32px] px-8 py-8 text-sm md:text-base font-black italic outline-none focus:border-primary/50 transition-all min-h-[160px] text-white tracking-tighter leading-relaxed custom-scrollbar" 
                  />
                </div>
                <div className="space-y-10">
                  <div className="space-y-4">
                    <label className="text-[9px] md:text-[10px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2 ml-4 italic">
                      <Phone className="w-4 h-4" /> Comms Frequency
                    </label>
                    <input 
                      type="text" 
                      value={restaurant.phone || ""} 
                      onChange={(e) => setRestaurant({...restaurant, phone: e.target.value})}
                      placeholder="+91-00000-00000"
                      className="w-full bg-white/5 border border-white/5 rounded-[24px] px-8 py-5 md:py-6 text-base md:text-xl font-black italic outline-none focus:border-primary/50 transition-all text-white tracking-tighter" 
                    />
                  </div>
                  <div className="p-8 md:p-10 bg-primary/5 rounded-[40px] border border-primary/10 flex gap-6 items-start">
                    <Info className="w-6 h-6 text-primary shrink-0 mt-1" />
                    <div className="space-y-2">
                       <p className="text-[10px] md:text-xs font-black text-white uppercase tracking-widest italic">Synchronization Notice</p>
                       <p className="text-[10px] md:text-xs font-medium text-slate-500 leading-relaxed uppercase tracking-widest">
                         These parameters are hard-coded into the digital menu and physical resource receipts generated by this sector.
                       </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeTab === "billing" && (
          <Card className="bg-[#0b1120] border-white/5 rounded-[40px] md:rounded-[56px] p-6 md:p-16 space-y-12">
            <div className="space-y-2">
              <CardTitle className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter text-white">Fiscal Parameters</CardTitle>
              <CardDescription className="text-[9px] md:text-xs font-black uppercase tracking-widest text-slate-700 leading-relaxed">Configure resource levies and functional service fees.</CardDescription>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20">
              <div className="space-y-10">
                <div className="space-y-4">
                  <label className="text-[9px] md:text-[10px] font-black text-slate-700 uppercase tracking-widest ml-4 italic">GST Registry Identifier</label>
                  <input 
                    type="text" 
                    value={restaurant.gst_number || ""} 
                    onChange={(e) => setRestaurant({...restaurant, gst_number: e.target.value})}
                    placeholder="E.G. 07AAAAA0000A1Z5" 
                    className="w-full bg-white/5 border border-white/5 rounded-[24px] px-8 py-5 md:py-6 text-base md:text-xl font-black italic outline-none focus:border-primary/50 transition-all text-white tracking-tighter" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-6 md:gap-10">
                  <div className="space-y-4">
                    <label className="text-[9px] md:text-[10px] font-black text-slate-700 uppercase tracking-widest ml-4 italic">CGST (%)</label>
                    <input 
                      type="number" 
                      value={restaurant.cgst_percent} 
                      onChange={(e) => setRestaurant({...restaurant, cgst_percent: e.target.value})}
                      className="w-full bg-white/5 border border-white/5 rounded-[24px] px-8 py-5 md:py-6 text-base md:text-xl font-black italic outline-none focus:border-primary/50 transition-all text-white tracking-tighter" 
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[9px] md:text-[10px] font-black text-slate-700 uppercase tracking-widest ml-4 italic">SGST (%)</label>
                    <input 
                      type="number" 
                      value={restaurant.sgst_percent} 
                      onChange={(e) => setRestaurant({...restaurant, sgst_percent: e.target.value})}
                      className="w-full bg-white/5 border border-white/5 rounded-[24px] px-8 py-5 md:py-6 text-base md:text-xl font-black italic outline-none focus:border-primary/50 transition-all text-white tracking-tighter" 
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[9px] md:text-[10px] font-black text-slate-700 uppercase tracking-widest ml-4 italic">Operational Service Fee (%)</label>
                  <input 
                    type="number" 
                    value={restaurant.service_charge_percent} 
                    onChange={(e) => setRestaurant({...restaurant, service_charge_percent: e.target.value})}
                    className="w-full bg-white/5 border border-white/5 rounded-[24px] px-8 py-5 md:py-6 text-base md:text-xl font-black italic outline-none focus:border-primary/50 transition-all text-white tracking-tighter" 
                  />
                </div>
              </div>
              
              <div className="p-8 md:p-12 bg-white/5 rounded-[48px] border border-white/5 space-y-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -translate-y-16 translate-x-16" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-700 italic">Bill Logic Preview</h4>
                <div className="space-y-5">
                  <div className="flex justify-between items-center text-sm md:text-base font-black uppercase italic text-slate-400">
                    <span>Base Value</span>
                    <span className="text-white">₹1,000.00</span>
                  </div>
                  <div className="flex justify-between items-center text-sm md:text-base font-black uppercase italic text-slate-400">
                    <span>CGST ({restaurant.cgst_percent}%)</span>
                    <span className="text-white">₹{(1000 * (parseFloat(restaurant.cgst_percent) || 0) / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm md:text-base font-black uppercase italic text-slate-400">
                    <span>SGST ({restaurant.sgst_percent}%)</span>
                    <span className="text-white">₹{(1000 * (parseFloat(restaurant.sgst_percent) || 0) / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm md:text-base font-black uppercase italic text-slate-400">
                    <span>Service ({restaurant.service_charge_percent}%)</span>
                    <span className="text-white">₹{(1000 * (parseFloat(restaurant.service_charge_percent) || 0) / 100).toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-white/10 my-8" />
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">Accumulated Total</span>
                       <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Inclusive of all applied levies</p>
                    </div>
                    <span className="text-5xl md:text-6xl font-black italic text-white tracking-tighter shadow-primary/20">
                      ₹{(1000 * (1 + ((parseFloat(restaurant.cgst_percent) || 0) + (parseFloat(restaurant.sgst_percent) || 0) + (parseFloat(restaurant.service_charge_percent) || 0)) / 100)).toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeTab === "payments" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            <Card className="bg-[#0b1120] border-white/5 rounded-[40px] md:rounded-[56px] p-6 md:p-12 space-y-10">
              <div className="space-y-2">
                <CardTitle className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">Payment Protocol QR</CardTitle>
                <CardDescription className="text-[9px] md:text-xs font-black uppercase tracking-widest text-slate-700 leading-relaxed">Broadcast your UPI/Digital settlement resource.</CardDescription>
              </div>
              
              <div className="space-y-10">
                <div 
                  onClick={() => document.getElementById('qr-upload')?.click()}
                  className="w-full aspect-square max-w-[320px] mx-auto rounded-[48px] md:rounded-[64px] bg-white rounded-3xl p-8 md:p-12 shadow-2xl flex items-center justify-center relative overflow-hidden group cursor-pointer"
                >
                  {restaurant.merchant_qr_url ? (
                    <img src={restaurant.merchant_qr_url} className="w-full h-full object-contain" alt="QR" />
                  ) : (
                    <QrCode className="w-16 h-16 text-slate-200" />
                  )}
                  <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                       <span className="text-[10px] font-black uppercase text-white tracking-[0.3em]">Update Matrix</span>
                    </div>
                </div>
                <input 
                  type="file" 
                  id="qr-upload" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => handleImageUpload(e, 'qr')} 
                />
                
                <div className="space-y-4">
                  <label className="text-[9px] md:text-[10px] font-black text-slate-700 uppercase tracking-widest ml-4 italic text-center block w-full">QR Resource Locator</label>
                  <input 
                    type="text" 
                    placeholder="PASTE UPI QR RESOURCE URL"
                    value={restaurant.merchant_qr_url || ""} 
                    onChange={(e) => setRestaurant({...restaurant, merchant_qr_url: e.target.value})}
                    className="w-full bg-white/5 border border-white/5 rounded-[24px] px-8 py-5 md:py-6 text-[10px] md:text-xs font-black tracking-widest outline-none focus:border-primary/50 transition-all text-white placeholder:text-slate-900" 
                  />
                </div>

                <div className="p-8 bg-accent/5 rounded-[40px] border border-accent/10 flex gap-6 items-start">
                  <QrCode className="w-6 h-6 text-accent shrink-0 mt-1" />
                  <div className="space-y-2">
                    <p className="text-[10px] md:text-xs font-black text-white uppercase tracking-widest italic">Visual Interface</p>
                    <p className="text-[10px] md:text-xs font-medium text-slate-500 leading-relaxed uppercase tracking-widest">
                      This matrix will be projected to clients during the final checkout sequence of the digital experience.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-[#0b1120] border-white/5 rounded-[40px] md:rounded-[56px] p-6 md:p-12 space-y-10">
              <div className="space-y-2">
                <CardTitle className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">Direct Transfer Matrix</CardTitle>
                <CardDescription className="text-[9px] md:text-xs font-black uppercase tracking-widest text-slate-700 leading-relaxed">Direct synchronization with institutional banking units.</CardDescription>
              </div>
              
              <div className="space-y-8">
                {[
                  { label: "Institutional Holder", key: "account_name", placeholder: "E.G. SECTOR ONE HOLDINGS" },
                  { label: "Bank Entity", key: "bank_name", placeholder: "E.G. GLOBAL RESERVE BANK" },
                  { label: "Resource Identifier", key: "account_number", placeholder: "0000 0000 0000 0000" },
                  { label: "Routing Sequence (IFSC)", key: "ifsc", placeholder: "GRB0000001" },
                ].map((field) => (
                  <div key={field.key} className="space-y-3">
                    <label className="text-[9px] md:text-[10px] font-black text-slate-700 uppercase tracking-widest ml-4 italic">{field.label}</label>
                    <input 
                      type="text" 
                      value={restaurant.bank_details[field.key]} 
                      onChange={(e) => setRestaurant({...restaurant, bank_details: {...restaurant.bank_details, [field.key]: e.target.value}})}
                      placeholder={field.placeholder}
                      className="w-full bg-white/5 border border-white/5 rounded-[24px] px-8 py-5 md:py-6 text-sm md:text-base font-black italic outline-none focus:border-primary/50 transition-all text-white tracking-tighter placeholder:text-slate-900" 
                    />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === "mobile" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            <Card className="bg-[#0b1120] border-white/5 rounded-[40px] md:rounded-[56px] p-8 md:p-14 space-y-10">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                  <Smartphone className="w-3 h-3" /> Quick Access
                </div>
                <CardTitle className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white leading-none">Staff App <span className="text-slate-800">Deployment</span></CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-700 leading-relaxed italic">Direct link for Waiters and Kitchen units.</CardDescription>
              </div>

              <div className="flex flex-col items-center gap-8 py-4">
                <div className="bg-white p-6 rounded-[48px] shadow-2xl shadow-primary/20 relative group">
                  <QRCodeSVG 
                    id="staff-qr"
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/login`} 
                    size={200}
                    level="H"
                  />
                  <div className="absolute inset-0 bg-primary/10 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center rounded-[48px]">
                     <span className="text-[10px] font-black uppercase text-white tracking-[0.3em]">Staff Gateway</span>
                  </div>
                </div>
                <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest italic text-center max-w-[200px]">
                  Scan this on any smartphone to open the Staff Login.
                </p>
              </div>

              <div className="space-y-4 pt-6 border-t border-white/5">
                 <div className="flex items-center gap-6 p-6 bg-white/[0.02] rounded-[32px] border border-white/5">
                    <Download className="w-8 h-8 text-primary" />
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-white uppercase tracking-widest italic">PWA Protocol Enabled</p>
                       <p className="text-[9px] text-slate-500 uppercase font-medium leading-relaxed tracking-widest">Supports native-like installation on both iOS & Android.</p>
                    </div>
                 </div>
              </div>
            </Card>

            <Card className="bg-[#0b1120] border-white/5 rounded-[40px] md:rounded-[56px] p-8 md:p-14 space-y-12">
              <div className="space-y-2">
                <CardTitle className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">Installation <span className="text-slate-800">Manual</span></CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-700 leading-relaxed">Turn this web suite into a native phone app.</CardDescription>
              </div>

              <div className="space-y-10">
                <div className="space-y-6">
                   <div className="flex items-center gap-4 text-white">
                      <Apple className="w-6 h-6" />
                      <p className="text-xs font-black uppercase tracking-widest italic">For iPhone / iPad (Safari)</p>
                   </div>
                   <ol className="space-y-4 ml-10 text-[10px] font-black text-slate-500 uppercase tracking-widest list-decimal">
                      <li>Open Safari and scan the QR to the left.</li>
                      <li>Tap the <span className="text-primary italic">"Share"</span> icon (square with arrow) at the bottom.</li>
                      <li>Scroll down and tap <span className="text-white">"Add to Home Screen"</span>.</li>
                      <li>The app will now appear on your home screen.</li>
                   </ol>
                </div>

                <div className="space-y-6 border-t border-white/5 pt-10">
                   <div className="flex items-center gap-4 text-white">
                      <Chrome className="w-6 h-6" />
                      <p className="text-xs font-black uppercase tracking-widest italic">For Android (Chrome)</p>
                   </div>
                   <ol className="space-y-4 ml-10 text-[10px] font-black text-slate-500 uppercase tracking-widest list-decimal">
                      <li>Open Chrome and scan the QR to the left.</li>
                      <li>Tap the <span className="text-primary italic">"Three Dots"</span> in the top right.</li>
                      <li>Select <span className="text-white">"Install App"</span> or <span className="text-white">"Add to Home Screen"</span>.</li>
                      <li>Click "Install" to confirm.</li>
                   </ol>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
