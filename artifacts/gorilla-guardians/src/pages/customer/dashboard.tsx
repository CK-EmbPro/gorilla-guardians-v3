import { Link } from "wouter";
import { ShoppingBag, Calendar, Heart, Bell, MessageSquare, Star, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useListOrders, useListBookings, useGetWishlist, useListNotifications } from "@workspace/api-client-react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { useAuth } from "@/lib/auth";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  confirmed: "bg-green-100 text-green-800",
};

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { data: ordersData } = useListOrders({ userId: user?.id, limit: 5 });
  const { data: bookings } = useListBookings({ userId: user?.id, limit: 3 });
  const { data: wishlist } = useGetWishlist();
  const { data: notifications } = useListNotifications({ unreadOnly: true });

  const orders = ordersData?.orders ?? [];
  const bookingList = Array.isArray(bookings) ? bookings : [];
  const wishlistItems = Array.isArray(wishlist) ? wishlist : [];
  const unreadNotifs = Array.isArray(notifications) ? notifications : [];


  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold">Welcome back, {user?.name?.split(" ")[0]}</h1>
            <p className="text-muted-foreground mt-1">Thank you for supporting Rwandan artisans. Here's your activity.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { icon: ShoppingBag, label: "Total Orders", value: orders.length, href: "/customer/orders", color: "bg-primary/10" },
              { icon: Calendar, label: "Bookings", value: bookingList.length, href: "/customer/bookings", color: "bg-secondary/10" },
              { icon: Heart, label: "Wishlist", value: wishlistItems.length, href: "/customer/wishlist", color: "bg-red-50" },
              { icon: Bell, label: "Notifications", value: unreadNotifs.length, href: "/customer/notifications", color: "bg-accent/10" },
            ].map(({ icon: Icon, label, value, href, color }) => (
              <Link key={label} href={href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-border">
                  <CardContent className="p-5">
                    <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-2xl font-bold mb-0.5" data-testid={`text-customer-stat-${label.toLowerCase().replace(/\s/g, "-")}`}>{value}</div>
                    <div className="text-sm text-muted-foreground">{label}</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent orders */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Recent Orders</CardTitle>
                <Link href="/customer/orders">
                  <Button variant="ghost" size="sm" className="text-primary text-xs">View all</Button>
                </Link>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No orders yet. <Link href="/products" className="text-primary hover:underline">Start shopping</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order: any) => (
                      <Link key={order.id} href={`/customer/orders/${order.id}`}>
                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" data-testid={`row-order-${order.id}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Package className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <div className="text-sm font-medium">Order #{order.id}</div>
                              <div className="text-xs text-muted-foreground">{order.items?.[0]?.productName ?? "Products"}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-primary">${order.total}</div>
                            <Badge className={`text-xs ${STATUS_COLORS[order.status] ?? "bg-muted"}`}>{order.status}</Badge>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bookings + Notifications */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-base">Upcoming Bookings</CardTitle>
                  <Link href="/customer/bookings">
                    <Button variant="ghost" size="sm" className="text-primary text-xs">View all</Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {bookingList.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      No bookings yet. <Link href="/experiences" className="text-primary hover:underline">Book an experience</Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {bookingList.slice(0, 2).map((b: any) => (
                        <div key={b.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30" data-testid={`row-booking-${b.id}`}>
                          <div>
                            <div className="text-sm font-medium">{b.experience?.title ?? "Experience"}</div>
                            <div className="text-xs text-muted-foreground">{b.date} · {b.participants} person(s)</div>
                          </div>
                          <Badge className={`text-xs ${STATUS_COLORS[b.status] ?? "bg-muted"}`}>{b.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-base">Notifications</CardTitle>
                  <Link href="/customer/notifications">
                    <Button variant="ghost" size="sm" className="text-primary text-xs">See all</Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {unreadNotifs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">All caught up!</p>
                  ) : (
                    <div className="space-y-2">
                      {unreadNotifs.slice(0, 3).map((n: any) => (
                        <div key={n.id} className="flex items-start gap-2 p-2 rounded-lg bg-primary/5" data-testid={`notif-${n.id}`}>
                          <Bell className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-medium">{n.title}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">{n.message}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quick links */}
          <div className="mt-8">
            <h2 className="font-semibold mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/products"><Button variant="outline" className="gap-2 border-primary/30 text-primary"><ShoppingBag className="w-4 h-4" /> Shop Products</Button></Link>
              <Link href="/experiences"><Button variant="outline" className="gap-2 border-primary/30 text-primary"><Calendar className="w-4 h-4" /> Book Experience</Button></Link>
              <Link href="/customer/messages"><Button variant="outline" className="gap-2"><MessageSquare className="w-4 h-4" /> Messages</Button></Link>
              <Link href="/customer/feedback"><Button variant="outline" className="gap-2"><Star className="w-4 h-4" /> Leave Feedback</Button></Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
