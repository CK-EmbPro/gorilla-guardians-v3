import { useParams, Link } from "wouter";
import { ArrowLeft, Package, Truck, CheckCircle2, Clock, MapPin, Calendar, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useSSE } from "@/lib/useSSE";

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
const authHeaders = () => {
  const token = localStorage.getItem("gg_auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const STATUSES = ["processing", "packed", "shipped", "in_transit", "out_for_delivery", "delivered"];

const STATUS_CONFIG: Record<string, { label: string; orderColor: string; icon: any }> = {
  processing: { label: "Processing", orderColor: "bg-blue-100 text-blue-800", icon: Clock },
  packed: { label: "Packed", orderColor: "bg-purple-100 text-purple-800", icon: Package },
  shipped: { label: "Shipped", orderColor: "bg-indigo-100 text-indigo-800", icon: Truck },
  in_transit: { label: "In Transit", orderColor: "bg-orange-100 text-orange-800", icon: Truck },
  out_for_delivery: { label: "Out for Delivery", orderColor: "bg-yellow-100 text-yellow-800", icon: Truck },
  delivered: { label: "Delivered", orderColor: "bg-green-100 text-green-800", icon: CheckCircle2 },
  pending: { label: "Pending", orderColor: "bg-yellow-100 text-yellow-800", icon: Clock },
  cancelled: { label: "Cancelled", orderColor: "bg-red-100 text-red-800", icon: Clock },
};

interface TrackingData {
  orderId: number;
  status: string;
  trackingNumber: string | null;
  carrier: string | null;
  estimatedDelivery: string | null;
  currentLocation: string | null;
  timeline: { status: string; description: string; timestamp: string; location?: string | null }[];
  updatedAt: string;
}

interface OrderData {
  id: number;
  status: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  createdAt: string;
  trackingNumber: string | null;
  shippingAddress: string;
  paymentMethod: string;
  items: { productName: string; quantity: number; price: number; subtotal: number }[];
}

export default function CustomerOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = Number(params?.id);
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  async function fetchData() {
    if (!orderId) return;
    try {
      const [orderRes, trackRes] = await Promise.all([
        fetch(`${API_BASE}/api/orders/${orderId}`, { credentials: "include", headers: authHeaders() }),
        fetch(`${API_BASE}/api/delivery/${orderId}`, { credentials: "include", headers: authHeaders() }),
      ]);
      if (orderRes.ok) setOrder(await orderRes.json());
      if (trackRes.ok) setTracking(await trackRes.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchData(); }, [orderId]);

  useSSE(user?.id, (event, data: any) => {
    if (event === "delivery_update" && data?.orderId === orderId) {
      fetchData();
    }
  });

  function copyTracking() {
    if (!order?.trackingNumber) return;
    navigator.clipboard.writeText(order.trackingNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const currentStatusIdx = tracking ? STATUSES.indexOf(tracking.status) : -1;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/customer/orders">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ArrowLeft className="w-4 h-4" /> Orders
              </Button>
            </Link>
            <h1 className="font-serif text-xl font-bold">Order #{orderId}</h1>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Card key={i} className="h-32 animate-pulse bg-muted" />)}
            </div>
          ) : !order ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">Order not found.</CardContent>
            </Card>
          ) : (
            <div className="space-y-5">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">Order Summary</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Placed {new Date(order.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <Badge className={cn("text-xs", STATUS_CONFIG[order.status]?.orderColor ?? "bg-muted")}>
                      {STATUS_CONFIG[order.status]?.label ?? order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm border-b border-border last:border-0 pb-2 last:pb-0">
                      <span className="text-foreground">{item.productName} <span className="text-muted-foreground">×{item.quantity}</span></span>
                      <span className="font-medium">${item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="pt-1 space-y-1 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span><span>${order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Shipping</span><span>{order.shippingCost === 0 ? "Free" : `$${order.shippingCost.toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-base border-t border-border pt-2 mt-1">
                      <span>Total</span><span className="text-primary">${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {order.trackingNumber && (
                <Card className="border-primary/20 bg-primary/3">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">Tracking Number</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={copyTracking} className="gap-1.5 text-xs h-7">
                        {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                        {copied ? "Copied!" : "Copy"}
                      </Button>
                    </div>
                    <p className="font-mono text-lg font-bold text-primary mt-1">{order.trackingNumber}</p>
                    <Link href={`/track?number=${order.trackingNumber}`}>
                      <Button variant="link" className="p-0 h-auto text-xs text-primary mt-1">
                        Track publicly →
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {tracking && (
                <>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Delivery Status</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <div className="flex items-center gap-0">
                        {STATUSES.map((s, idx) => {
                          const done = idx <= currentStatusIdx;
                          const Ic = STATUS_CONFIG[s]?.icon ?? Package;
                          return (
                            <div key={s} className="flex items-center flex-1 last:flex-none">
                              <div className="flex flex-col items-center">
                                <div className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
                                  done ? "border-primary bg-primary text-primary-foreground" : "border-muted bg-muted text-muted-foreground"
                                )}>
                                  <Ic className="w-3.5 h-3.5" />
                                </div>
                                <span className={cn("text-[9px] mt-1 text-center w-14 leading-tight", done ? "text-primary font-medium" : "text-muted-foreground")}>
                                  {STATUS_CONFIG[s]?.label}
                                </span>
                              </div>
                              {idx < STATUSES.length - 1 && (
                                <div className={cn("h-0.5 flex-1 mb-4", idx < currentStatusIdx ? "bg-primary" : "bg-muted")} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {tracking.carrier && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Truck className="w-4 h-4" /> Carrier: <span className="text-foreground font-medium">{tracking.carrier}</span>
                        </div>
                      )}
                      {tracking.estimatedDelivery && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" /> Est. Delivery: <span className="text-foreground font-medium">{tracking.estimatedDelivery}</span>
                        </div>
                      )}
                      {tracking.currentLocation && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" /> Location: <span className="text-foreground font-medium">{tracking.currentLocation}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {tracking.timeline.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Tracking History</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-0">
                          {[...tracking.timeline].reverse().map((event, idx) => {
                            const Ic = STATUS_CONFIG[event.status]?.icon ?? Package;
                            const isFirst = idx === 0;
                            return (
                              <div key={idx} className="flex gap-3 pb-4 last:pb-0 relative">
                                {idx < tracking.timeline.length - 1 && (
                                  <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-muted" />
                                )}
                                <div className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10",
                                  isFirst ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                )}>
                                  <Ic className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 pt-1">
                                  <div className={cn("text-sm font-medium", isFirst ? "text-foreground" : "text-muted-foreground")}>
                                    {STATUS_CONFIG[event.status]?.label ?? event.status}
                                  </div>
                                  <div className="text-xs text-muted-foreground">{event.description}</div>
                                  {event.location && (
                                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                      <MapPin className="w-3 h-3" /> {event.location}
                                    </div>
                                  )}
                                  <div className="text-xs text-muted-foreground/60 mt-0.5">
                                    {new Date(event.timestamp).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Shipping Details</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-sm space-y-1">
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{order.shippingAddress}</span>
                  </div>
                  <div className="text-muted-foreground capitalize">Payment: {order.paymentMethod}</div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
