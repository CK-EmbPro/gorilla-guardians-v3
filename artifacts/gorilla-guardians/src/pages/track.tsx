import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { Search, Package, Truck, CheckCircle2, Clock, MapPin, Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";

const BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

const STATUSES = ["processing", "packed", "shipped", "in_transit", "out_for_delivery", "delivered"];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  processing: { label: "Processing", color: "bg-blue-100 text-blue-800", icon: Clock },
  packed: { label: "Packed", color: "bg-purple-100 text-purple-800", icon: Package },
  shipped: { label: "Shipped", color: "bg-indigo-100 text-indigo-800", icon: Truck },
  in_transit: { label: "In Transit", color: "bg-orange-100 text-orange-800", icon: Truck },
  out_for_delivery: { label: "Out for Delivery", color: "bg-yellow-100 text-yellow-800", icon: Truck },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
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

export default function TrackPage() {
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  const urlNumber = params.get("number") ?? "";

  const [input, setInput] = useState(urlNumber);
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (urlNumber) {
      doSearch(urlNumber);
    }
  }, [urlNumber]);

  async function doSearch(num: string) {
    if (!num.trim()) return;
    setLoading(true);
    setError(null);
    setTracking(null);
    try {
      const res = await fetch(`${BASE}/api/delivery/track/${encodeURIComponent(num.trim())}`, { credentials: "include" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Tracking number not found.");
        return;
      }
      const data: TrackingData = await res.json();
      setTracking(data);
    } catch {
      setError("Failed to fetch tracking info. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    doSearch(input);
  }

  const currentStatusIdx = tracking ? STATUSES.indexOf(tracking.status) : -1;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Truck className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-serif text-3xl font-bold mb-2">Track Your Order</h1>
          <p className="text-muted-foreground text-sm">Enter your tracking number to see the delivery status</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <Input
            placeholder="e.g. GG-20240601-ABC123"
            value={input}
            onChange={e => setInput(e.target.value)}
            className="font-mono"
            data-testid="input-tracking-number"
          />
          <Button type="submit" disabled={loading} className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground" data-testid="button-track">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span className="ml-1.5">Track</span>
          </Button>
        </form>

        {error && (
          <Card className="border-destructive/30 bg-destructive/5 mb-6">
            <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        {tracking && (
          <div className="space-y-5" data-testid="tracking-result">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">Order #{tracking.orderId}</CardTitle>
                    {tracking.trackingNumber && (
                      <p className="text-sm font-mono text-muted-foreground mt-0.5">{tracking.trackingNumber}</p>
                    )}
                  </div>
                  <Badge className={cn("text-xs shrink-0", STATUS_CONFIG[tracking.status]?.color ?? "bg-muted text-muted-foreground")}>
                    {STATUS_CONFIG[tracking.status]?.label ?? tracking.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-2.5">
                {tracking.carrier && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Truck className="w-4 h-4 shrink-0" />
                    <span>Carrier: <span className="font-medium text-foreground">{tracking.carrier}</span></span>
                  </div>
                )}
                {tracking.estimatedDelivery && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>Est. Delivery: <span className="font-medium text-foreground">{tracking.estimatedDelivery}</span></span>
                  </div>
                )}
                {tracking.currentLocation && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>Location: <span className="font-medium text-foreground">{tracking.currentLocation}</span></span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>Last updated: <span className="font-medium text-foreground">{new Date(tracking.updatedAt).toLocaleString()}</span></span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Status Progress</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
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
          </div>
        )}
      </main>
    </div>
  );
}
