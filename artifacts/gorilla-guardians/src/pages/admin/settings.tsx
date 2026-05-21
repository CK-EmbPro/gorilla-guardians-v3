import { useState } from "react";
import { Save, Globe, CreditCard, Truck, Languages, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettingsPage() {
  const { toast } = useToast();

  const [general, setGeneral] = useState({
    siteName: "Gorilla Guardians Village",
    tagline: "Handmade in Rwanda, With Love",
    contactEmail: "hello@gorillaguardians.rw",
    phone: "+250 788 000 000",
    address: "Musanze, Northern Province, Rwanda",
    maintenanceMode: false,
  });

  const [payment, setPayment] = useState({
    currency: "USD",
    stripeEnabled: true,
    paypalEnabled: false,
    mobileMoneyEnabled: true,
    mtnNumber: "+250788000000",
    commissionRate: "15",
  });

  const [shipping, setShipping] = useState({
    freeShippingThreshold: "150",
    standardRate: "12",
    expressRate: "25",
    processingDays: "3",
    carriers: "DHL, FedEx, Rwanda Post",
  });

  const [language, setLanguage] = useState({
    defaultLanguage: "en",
    supportedLanguages: ["en", "fr", "rw"],
  });

  const [notifications, setNotifications] = useState({
    emailOnNewOrder: true,
    emailOnNewReview: true,
    emailOnLowStock: true,
    stockThreshold: "5",
  });

  const handleSave = (section: string) => {
    toast({ title: `${section} settings saved` });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="font-serif text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">Configure your store settings.</p>
          </div>

          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid grid-cols-5 w-full max-w-2xl">
              <TabsTrigger value="general" className="gap-1.5"><Globe className="w-3.5 h-3.5"/>General</TabsTrigger>
              <TabsTrigger value="payment" className="gap-1.5"><CreditCard className="w-3.5 h-3.5"/>Payment</TabsTrigger>
              <TabsTrigger value="shipping" className="gap-1.5"><Truck className="w-3.5 h-3.5"/>Shipping</TabsTrigger>
              <TabsTrigger value="language" className="gap-1.5"><Languages className="w-3.5 h-3.5"/>Language</TabsTrigger>
              <TabsTrigger value="notifications" className="gap-1.5"><Bell className="w-3.5 h-3.5"/>Alerts</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <Card className="border-border">
                <CardHeader><CardTitle className="text-base">General Settings</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Site Name", key: "siteName" },
                    { label: "Tagline", key: "tagline" },
                    { label: "Contact Email", key: "contactEmail" },
                    { label: "Phone", key: "phone" },
                    { label: "Address", key: "address" },
                  ].map(({ label, key }) => (
                    <div key={key} className="space-y-1.5">
                      <Label>{label}</Label>
                      <Input value={(general as any)[key]} onChange={e => setGeneral(g => ({ ...g, [key]: e.target.value }))} />
                    </div>
                  ))}
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <div className="text-sm font-medium">Maintenance Mode</div>
                      <div className="text-xs text-muted-foreground">Disable public access to the store</div>
                    </div>
                    <Switch checked={general.maintenanceMode} onCheckedChange={v => setGeneral(g => ({ ...g, maintenanceMode: v }))} />
                  </div>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" onClick={() => handleSave("General")}>
                    <Save className="w-4 h-4" /> Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payment">
              <Card className="border-border">
                <CardHeader><CardTitle className="text-base">Payment Settings</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Default Currency</Label>
                    <Select value={payment.currency} onValueChange={v => setPayment(p => ({ ...p, currency: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="RWF">RWF (Fr)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Artisan Commission Rate (%)</Label>
                    <Input type="number" value={payment.commissionRate} onChange={e => setPayment(p => ({ ...p, commissionRate: e.target.value }))} min="0" max="100" />
                  </div>
                  {[
                    { label: "Stripe Payments", key: "stripeEnabled" },
                    { label: "PayPal", key: "paypalEnabled" },
                    { label: "Mobile Money (MTN)", key: "mobileMoneyEnabled" },
                  ].map(({ label, key }) => (
                    <div key={key} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <span className="text-sm font-medium">{label}</span>
                      <Switch checked={(payment as any)[key]} onCheckedChange={v => setPayment(p => ({ ...p, [key]: v }))} />
                    </div>
                  ))}
                  {payment.mobileMoneyEnabled && (
                    <div className="space-y-1.5">
                      <Label>MTN Number</Label>
                      <Input value={payment.mtnNumber} onChange={e => setPayment(p => ({ ...p, mtnNumber: e.target.value }))} />
                    </div>
                  )}
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" onClick={() => handleSave("Payment")}>
                    <Save className="w-4 h-4" /> Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="shipping">
              <Card className="border-border">
                <CardHeader><CardTitle className="text-base">Shipping Settings</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Free Shipping Above ($)", key: "freeShippingThreshold" },
                      { label: "Standard Rate ($)", key: "standardRate" },
                      { label: "Express Rate ($)", key: "expressRate" },
                      { label: "Processing Days", key: "processingDays" },
                    ].map(({ label, key }) => (
                      <div key={key} className="space-y-1.5">
                        <Label>{label}</Label>
                        <Input type="number" value={(shipping as any)[key]} onChange={e => setShipping(s => ({ ...s, [key]: e.target.value }))} />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Shipping Carriers</Label>
                    <Textarea value={shipping.carriers} onChange={e => setShipping(s => ({ ...s, carriers: e.target.value }))} rows={2} />
                  </div>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" onClick={() => handleSave("Shipping")}>
                    <Save className="w-4 h-4" /> Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="language">
              <Card className="border-border">
                <CardHeader><CardTitle className="text-base">Language Settings</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Default Language</Label>
                    <Select value={language.defaultLanguage} onValueChange={v => setLanguage(l => ({ ...l, defaultLanguage: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="rw">Kinyarwanda</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Supported Languages</Label>
                    {[{code:"en",label:"English"},{code:"fr",label:"Français"},{code:"rw",label:"Kinyarwanda"}].map(lang => (
                      <div key={lang.code} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <span className="text-sm">{lang.label}</span>
                        <Switch checked={language.supportedLanguages.includes(lang.code)} onCheckedChange={v => setLanguage(l => ({ ...l, supportedLanguages: v ? [...l.supportedLanguages, lang.code] : l.supportedLanguages.filter(x => x !== lang.code) }))} />
                      </div>
                    ))}
                  </div>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" onClick={() => handleSave("Language")}>
                    <Save className="w-4 h-4" /> Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card className="border-border">
                <CardHeader><CardTitle className="text-base">Notification Settings</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Email on new order", key: "emailOnNewOrder" },
                    { label: "Email on new review", key: "emailOnNewReview" },
                    { label: "Low stock alerts", key: "emailOnLowStock" },
                  ].map(({ label, key }) => (
                    <div key={key} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <span className="text-sm font-medium">{label}</span>
                      <Switch checked={(notifications as any)[key]} onCheckedChange={v => setNotifications(n => ({ ...n, [key]: v }))} />
                    </div>
                  ))}
                  <div className="space-y-1.5">
                    <Label>Low Stock Threshold (units)</Label>
                    <Input type="number" value={notifications.stockThreshold} onChange={e => setNotifications(n => ({ ...n, stockThreshold: e.target.value }))} min="1" className="w-32" />
                  </div>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" onClick={() => handleSave("Notification")}>
                    <Save className="w-4 h-4" /> Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
