import { Link } from "wouter";
import { Package, ChevronRight, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useListOrders } from "@workspace/api-client-react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { useAuth } from "@/lib/auth";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function CustomerOrdersPage() {
  const { user } = useAuth();
  const { data: ordersData, isLoading, isError, error } = useListOrders({ userId: user?.id, limit: 20 });
  if (isError) console.error("[CustomerOrders] API error", error);
  const orders = ordersData?.orders ?? [];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-serif text-2xl font-bold mb-6">My Orders</h1>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => <Card key={i} className="h-28 animate-pulse" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-semibold text-lg mb-2">No orders yet</h2>
              <p className="text-muted-foreground text-sm mb-6">Every purchase supports artisan families in Rwanda.</p>
              <Link href="/products"><Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Start Shopping</Button></Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order: any) => (
                <Card key={order.id} className="border-border hover:shadow-md transition-shadow" data-testid={`card-order-${order.id}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-semibold">Order #{order.id}</div>
                        <div className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${STATUS_COLORS[order.status] ?? "bg-muted"}`} data-testid={`badge-order-status-${order.id}`}>{order.status}</Badge>
                        <div className="font-bold text-primary">${order.total}</div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mb-3">
                      {order.items?.map((item: any) => item.productName).join(", ")}
                    </div>
                    {order.trackingNumber && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 bg-muted/40 px-3 py-2 rounded-lg">
                        <Truck className="w-3.5 h-3.5 text-primary" />
                        <span>Tracking: <span className="font-mono font-medium">{order.trackingNumber}</span></span>
                        {order.shippingCarrier && <span>via {order.shippingCarrier}</span>}
                      </div>
                    )}
                    <div className="flex justify-end">
                      <Link href={`/customer/orders/${order.id}`}>
                        <Button variant="ghost" size="sm" className="text-primary gap-1" data-testid={`button-view-order-${order.id}`}>
                          View Details <ChevronRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
