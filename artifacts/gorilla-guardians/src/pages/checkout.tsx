import { useState } from "react";
import { useLocation } from "wouter";
import { Lock, ShieldCheck, Truck, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useGetCart, useCreateOrder, useCreateOrderCheckoutSession, useClearCart, getGetCartQueryKey, OrderInputShippingType } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";

const SHIPPING_TYPES = [
  { id: "global", label: "International Shipping (7–14 days)", price: 25 },
  { id: "pickup", label: "Village Pickup (Free)", price: 0 },
];

export default function CheckoutPage() {
  const { data: cart } = useGetCart();
  const createOrder = useCreateOrder();
  const clearCart = useClearCart();
  const createCheckoutSession = useCreateOrderCheckoutSession();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState<"shipping" | "payment">("shipping");
  const [shippingType, setShippingType] = useState<OrderInputShippingType>("global");
  const [form, setForm] = useState({
    name: "", email: "", phone: "", address: "", city: "", country: "", postalCode: "",
  });

  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const shipping = SHIPPING_TYPES.find(s => s.id === shippingType)?.price ?? 25;
  const total = subtotal + shipping;

  // Card details are entered on Stripe's own hosted Checkout page, never on this site, so there's
  // no "card number" form here. We just create the order, then redirect to the Checkout session
  // Stripe gives us back. The order is preserved either way: if the visitor cancels on Stripe's
  // page, they land back on /checkout with their cart intact, ready to retry.
  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.address) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    const shippingAddress = `${form.name}, ${form.address}, ${form.city}, ${form.postalCode}, ${form.country}`;
    const orderItems = items.map((item: any) => ({ productId: item.productId, quantity: item.quantity }));

    createOrder.mutate({
      data: {
        items: orderItems,
        paymentMethod: "card",
        shippingAddress,
        shippingType,
        notes: undefined,
      }
    }, {
      onSuccess: (order: any) => {
        clearCart.mutate(undefined);
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        createCheckoutSession.mutate({ id: order.id }, {
          onSuccess: (session: any) => {
            window.location.href = session.url;
          },
          onError: () => {
            setLocation(`/payment-failed?orderId=${order.id}&reason=Could+not+start+checkout.+Your+order+is+saved.`);
          },
        });
      },
      onError: () => {
        setLocation("/payment-failed?reason=Payment+could+not+be+processed.+Your+cart+is+saved.");
      },
    });
  };

  const isSubmitting = createOrder.isPending || createCheckoutSession.isPending;

  const updateForm = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-serif text-3xl font-bold mb-8">Checkout</h1>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-10">
          {["Shipping", "Payment"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === s.toLowerCase() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{i + 1}</div>
              <span className={`text-sm font-medium ${step === s.toLowerCase() ? "text-primary" : "text-muted-foreground"}`}>{s}</span>
              {i === 0 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Form */}
          <div className="lg:col-span-2">
            {step === "shipping" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Shipping Address</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Full Name *</Label>
                        <Input value={form.name} onChange={e => updateForm("name", e.target.value)} className="mt-1" placeholder="Sarah Johnson" data-testid="input-name" />
                      </div>
                      <div>
                        <Label>Email *</Label>
                        <Input type="email" value={form.email} onChange={e => updateForm("email", e.target.value)} className="mt-1" placeholder="you@example.com" data-testid="input-email-checkout" />
                      </div>
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input value={form.phone} onChange={e => updateForm("phone", e.target.value)} className="mt-1" placeholder="+1 234 567 8900" data-testid="input-phone" />
                    </div>
                    <div>
                      <Label>Street Address *</Label>
                      <Input value={form.address} onChange={e => updateForm("address", e.target.value)} className="mt-1" placeholder="123 Main Street" data-testid="input-address" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>City</Label>
                        <Input value={form.city} onChange={e => updateForm("city", e.target.value)} className="mt-1" placeholder="New York" data-testid="input-city" />
                      </div>
                      <div>
                        <Label>Postal Code</Label>
                        <Input value={form.postalCode} onChange={e => updateForm("postalCode", e.target.value)} className="mt-1" placeholder="10001" data-testid="input-postal" />
                      </div>
                      <div>
                        <Label>Country</Label>
                        <Input value={form.country} onChange={e => updateForm("country", e.target.value)} className="mt-1" placeholder="United States" data-testid="input-country" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><Truck className="w-5 h-5 text-primary" /> Shipping Method</CardTitle></CardHeader>
                  <CardContent>
                    <RadioGroup value={shippingType} onValueChange={(v) => setShippingType(v as OrderInputShippingType)} className="space-y-3">
                      {SHIPPING_TYPES.map(s => (
                        <div key={s.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${shippingType === s.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`} onClick={() => setShippingType(s.id as OrderInputShippingType)} data-testid={`option-shipping-${s.id}`}>
                          <RadioGroupItem value={s.id} id={s.id} />
                          <Label htmlFor={s.id} className="cursor-pointer flex-1">{s.label}</Label>
                          <span className="font-semibold text-primary">{s.price === 0 ? "Free" : `$${s.price}`}</span>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>

                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setStep("payment")} data-testid="button-continue-payment">
                  Continue to Payment
                </Button>
              </div>
            )}

            {step === "payment" && (
              <div className="space-y-6">
                <Button variant="ghost" onClick={() => setStep("shipping")} className="mb-2 text-primary">← Back to Shipping</Button>
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="w-5 h-5 text-primary" /> Secure Payment</CardTitle></CardHeader>
                  <CardContent>
                    <div className="p-4 bg-muted/50 rounded-lg flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">
                        You'll enter your card details on Stripe's secure checkout page — we never see or store your
                        card number. After payment, you'll be brought right back here.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  data-testid="button-place-order"
                >
                  {isSubmitting ? "Redirecting to Stripe..." : `Continue to Payment — $${total.toFixed(2)}`}
                </Button>
                <p className="text-xs text-center text-muted-foreground">Your payment is secure. Every purchase supports artisan families in Rwanda.</p>
              </div>
            )}
          </div>

          {/* Order summary */}
          <div>
            <Card className="sticky top-24">
              <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {items.map((item: any) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="truncate mr-2">{item.product?.name ?? `Product #${item.productId}`} × {item.quantity}</span>
                    <span className="shrink-0 font-medium">${item.subtotal?.toFixed(2)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Shipping</span><span>{shipping === 0 ? "Free" : `$${shipping}`}</span></div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary" data-testid="text-checkout-total">${total.toFixed(2)}</span>
                </div>
                <div className="bg-primary/5 rounded-lg p-3 text-xs text-muted-foreground">
                  Your purchase directly supports {items.length} artisan{items.length !== 1 ? "s" : ""} in Musanze, Rwanda.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
