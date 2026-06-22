import { useState, useEffect } from "react";
import { Truck, Search, RefreshCw, CheckCircle2, Package, Clock, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
const authHeaders = (extra?: Record<string, string>) => {
  const token = localStorage.getItem("gg_auth_token");
  return { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra };
};

const DELIVERY_STATUSES = [
  { value: "processing", label: "Processing" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "in_transit", label: "In Transit" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
];

const STATUS_CONFIG: Record<string, { color: string; icon: any }> = {
  processing: { color: "bg-blue-100 text-blue-800", icon: Clock },
  packed: { color: "bg-purple-100 text-purple-800", icon: Package },
  shipped: { color: "bg-indigo-100 text-indigo-800", icon: Truck },
  in_transit: { color: "bg-orange-100 text-orange-800", icon: Truck },
  out_for_delivery: { color: "bg-yellow-100 text-yellow-800", icon: Truck },
  delivered: { color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
};

interface Order {
  id: number;
  status: string;
  total: number;
  trackingNumber: string | null;
  createdAt: string;
  items: { productName: string; quantity: number }[];
}

interface TrackingData {
  orderId: number;
  status: string;
  trackingNumber: string | null;
  carrier: string | null;
  estimatedDelivery: string | null;
  currentLocation: string | null;
  timeline: any[];
  updatedAt: string;
}

export default function AdminDeliveryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [carrier, setCarrier] = useState("");
  const [estDelivery, setEstDelivery] = useState("");
  const [location, setLocation] = useState("");
  const { toast } = useToast();

  useEffect(() => { fetchOrders(); }, []);

  async function fetchOrders() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/orders?limit=50`, { credentials: "include", headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders ?? []);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function selectOrder(order: Order) {
    setSelected(order);
    setNewStatus("");
    setCarrier("");
    setEstDelivery("");
    setLocation("");
    setTracking(null);
    try {
      const res = await fetch(`${API_BASE}/api/delivery/${order.id}`, { credentials: "include", headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTracking(data);
        setNewStatus(data.status ?? "");
        setCarrier(data.carrier ?? "");
        setEstDelivery(data.estimatedDelivery ?? "");
        setLocation(data.currentLocation ?? "");
      }
    } catch { /* ignore */ }
  }

  async function updateDelivery() {
    if (!selected || !newStatus) return;
    setUpdating(true);
    try {
      const res = await fetch(`${API_BASE}/api/delivery/${selected.id}`, {
        method: "PATCH",
        headers: authHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({
          status: newStatus,
          carrier: carrier || undefined,
          estimatedDelivery: estDelivery || undefined,
          currentLocation: location || undefined,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTracking(updated);
        toast({ title: "Delivery updated", description: `Order #${selected.id} is now ${newStatus.replace("_", " ")}` });
        fetchOrders();
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Update failed", description: err.error ?? "Something went wrong", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", description: "Failed to update delivery", variant: "destructive" });
    } finally { setUpdating(false); }
  }

  const filtered = orders.filter(o =>
    search === "" ||
    String(o.id).includes(search) ||
    (o.trackingNumber ?? "").toLowerCase().includes(search.toLowerCase()) ||
    o.items.some(i => i.productName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-serif text-2xl font-bold flex items-center gap-2">
                <Truck className="w-6 h-6 text-primary" /> Delivery Management
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">Update delivery statuses and track shipments</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchOrders} className="gap-1.5" data-testid="button-refresh-orders">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order ID or tracking number..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-orders"
                />
              </div>

              <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i} className="h-20 animate-pulse bg-muted" />
                  ))
                ) : filtered.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground text-sm">No orders found</CardContent>
                  </Card>
                ) : (
                  filtered.map(order => {
                    const Ic = STATUS_CONFIG[order.status]?.icon ?? Package;
                    return (
                      <Card
                        key={order.id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-sm border",
                          selected?.id === order.id ? "border-primary shadow-sm" : "border-border"
                        )}
                        onClick={() => selectOrder(order)}
                        data-testid={`card-order-${order.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-semibold text-sm">Order #{order.id}</div>
                            <Badge className={cn("text-xs", STATUS_CONFIG[order.status]?.color ?? "bg-muted")}>
                              {order.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mb-1">
                            {order.items.map(i => i.productName).join(", ")}
                          </div>
                          {order.trackingNumber && (
                            <div className="text-xs font-mono text-muted-foreground">{order.trackingNumber}</div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              {!selected ? (
                <Card className="h-full flex items-center justify-center">
                  <CardContent className="text-center text-muted-foreground py-16">
                    <Truck className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>Select an order to update its delivery status</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>Update Order #{selected.id}</span>
                      {selected.trackingNumber && (
                        <span className="text-xs font-mono text-muted-foreground font-normal">{selected.trackingNumber}</span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Delivery Status *</label>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger data-testid="select-delivery-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {DELIVERY_STATUSES.map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Carrier</label>
                      <Input
                        placeholder="e.g. DHL, FedEx, Rwanda Post"
                        value={carrier}
                        onChange={e => setCarrier(e.target.value)}
                        data-testid="input-carrier"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Estimated Delivery</label>
                      <Input
                        placeholder="e.g. June 5, 2026"
                        value={estDelivery}
                        onChange={e => setEstDelivery(e.target.value)}
                        data-testid="input-est-delivery"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Current Location</label>
                      <Input
                        placeholder="e.g. Kigali Sorting Facility"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        data-testid="input-location"
                      />
                    </div>

                    <Button
                      onClick={updateDelivery}
                      disabled={updating || !newStatus}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      data-testid="button-update-delivery"
                    >
                      {updating ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Truck className="w-4 h-4 mr-2" />}
                      Update Delivery Status
                    </Button>

                    {tracking && tracking.timeline.length > 0 && (
                      <div className="pt-2 border-t border-border">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Timeline</p>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {[...tracking.timeline].reverse().map((event: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 text-xs">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                              <div>
                                <span className="font-medium capitalize">{(event.status ?? "").replace("_", " ")}</span>
                                <span className="text-muted-foreground ml-1">— {event.description}</span>
                                <div className="text-muted-foreground/60">{new Date(event.timestamp).toLocaleString()}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
