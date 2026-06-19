import { Link } from "wouter";
import { Package, DollarSign, Star, MessageSquare, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useListProducts, useListReviews, useGetDashboardStats } from "@workspace/api-client-react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { useAuth } from "@/lib/auth";

export default function ArtisanDashboard() {
  const { user } = useAuth();
  const { data: productsData } = useListProducts({ artisanId: 1, limit: 5 });
  const { data: reviews } = useListReviews({ status: "approved" });
  const { data: stats } = useGetDashboardStats();

  const products = productsData?.products ?? [];
  const reviewList = Array.isArray(reviews) ? reviews : [];
  const avgRating = reviewList.length > 0 ? (reviewList.reduce((s: number, r: any) => s + r.rating, 0) / reviewList.length).toFixed(1) : null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold">Artisan Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, {user?.name?.split(" ")[0]}. Here's how your products are performing.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Package, label: "My Products", value: products.length, color: "bg-primary/10", href: "/artisan/products" },
              { icon: DollarSign, label: "Total Earnings", value: "—", color: "bg-secondary/10", href: "/artisan/earnings" },
              { icon: Star, label: "Avg Rating", value: avgRating ?? "—", color: "bg-accent/10", href: null },
              { icon: MessageSquare, label: "Messages", value: 3, color: "bg-blue-50", href: "/artisan/messages" },
            ].map(({ icon: Icon, label, value, color, href }) => (
              <Card key={label} className={`border-border ${href ? "hover:shadow-md cursor-pointer" : ""} transition-shadow`}>
                <CardContent className="p-5">
                  <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-2xl font-bold mb-0.5">{value}</div>
                  <div className="text-sm text-muted-foreground">{label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Earnings chart */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Monthly Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
                No earnings data yet. <a href="/artisan/earnings" className="text-primary ml-1 underline">View detailed earnings</a>
              </div>
            </CardContent>
          </Card>

          {/* My products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">My Products</CardTitle>
              <Link href="/artisan/products/new">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1">
                  <Plus className="w-4 h-4" /> Add Product
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No products listed yet. Add your first product!</p>
              ) : (
                <div className="space-y-3">
                  {products.map((p: any) => (
                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/40 transition-colors" data-testid={`row-product-${p.id}`}>
                      <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0">
                        {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full imigongo-pattern" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground">Stock: {p.stock}</div>
                      </div>
                      <div className="text-sm font-bold text-primary">${p.price}</div>
                      <Badge variant={p.active ? "secondary" : "outline"} className="text-xs">{p.active ? "Active" : "Inactive"}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
