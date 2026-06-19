import { motion } from "framer-motion";
import { DollarSign, ShoppingBag, Users, Package, TrendingUp, Star, AlertTriangle, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { useGetDashboardStats, useGetSalesAnalytics, useGetTopProducts, useGetTopExperiences, useListOrders, useListArtisans } from "@workspace/api-client-react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const CHART_COLORS = ["#2d6a4f", "#f4a261", "#6b4226", "#219ebc", "#e63946"];

function KpiCard({ icon: Icon, title, value, change, color }: { icon: any; title: string; value: string; change?: string; color?: string }) {
  return (
    <Card className="border-border hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color ?? "bg-primary/10"}`}>
            <Icon className="w-5 h-5 text-primary" />
          </div>
          {change && <Badge variant="secondary" className="text-xs">{change}</Badge>}
        </div>
        <div className="text-2xl font-serif font-bold mb-0.5" data-testid={`text-kpi-${title.toLowerCase().replace(/\s/g, "-")}`}>{value}</div>
        <div className="text-sm text-muted-foreground">{title}</div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data: stats } = useGetDashboardStats();
  const { data: salesData } = useGetSalesAnalytics({ period: "month" });
  const { data: topProducts } = useGetTopProducts({ limit: 5 });
  const { data: topExperiences } = useGetTopExperiences();
  const { data: ordersData } = useListOrders({ status: "pending", limit: 5 });
  const { data: artisansData } = useListArtisans({ limit: 5 });

  const s = stats ?? { totalRevenue: 0, totalOrders: 0, totalCustomers: 0, totalProducts: 0, totalBookings: 0, pendingOrders: 0, lowStockProducts: 0, revenueThisMonth: 0 };
  const sales = Array.isArray(salesData) ? salesData : [];
  const products = Array.isArray(topProducts) ? topProducts : [];
  const exps = Array.isArray(topExperiences) ? topExperiences : [];
  const recentOrders = ordersData?.orders ?? [];
  const artisans = Array.isArray(artisansData) ? artisansData : [];

  const pieData = [
    { name: "Products", value: s.totalOrders },
    { name: "Experiences", value: s.totalBookings },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold mb-1">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm">Gorilla Guardians Village — Mission Control</p>
          </div>

          {/* Alerts */}
          {(s.pendingOrders > 0 || s.lowStockProducts > 0) && (
            <div className="flex flex-wrap gap-3 mb-6">
              {s.pendingOrders > 0 && (
                <Badge variant="outline" className="gap-1.5 text-orange-700 border-orange-300 bg-orange-50">
                  <AlertTriangle className="w-3.5 h-3.5" /> {s.pendingOrders} orders awaiting processing
                </Badge>
              )}
              {s.lowStockProducts > 0 && (
                <Badge variant="outline" className="gap-1.5 text-red-700 border-red-300 bg-red-50">
                  <AlertTriangle className="w-3.5 h-3.5" /> {s.lowStockProducts} products low on stock
                </Badge>
              )}
            </div>
          )}

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
              <KpiCard icon={DollarSign} title="Total Revenue" value={`$${s.totalRevenue.toLocaleString()}`} change="+12%" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <KpiCard icon={ShoppingBag} title="Total Orders" value={s.totalOrders.toString()} change="+8%" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <KpiCard icon={Users} title="Customers" value={s.totalCustomers.toString()} change="+23%" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <KpiCard icon={Package} title="Products" value={s.totalProducts.toString()} />
            </motion.div>
          </div>

          {/* Charts row */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Revenue chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Revenue & Orders (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                {sales.length === 0 ? (
                  <div className="flex items-center justify-center h-60 text-sm text-muted-foreground">No sales data yet.</div>
                ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={sales.slice(-14)}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(152 42% 28%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(152 42% 28%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(42 20% 90%)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(val: number) => [`$${val.toLocaleString()}`, "Revenue"]} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(152 42% 28%)" fill="url(#colorRevenue)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Order breakdown pie */}
            <Card>
              <CardHeader><CardTitle className="text-base">Sales Breakdown</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i]} />
                      ))}
                    </Pie>
                    <Legend iconSize={10} iconType="circle" />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Bottom row */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top products */}
            <Card>
              <CardHeader><CardTitle className="text-base">Top Selling Products</CardTitle></CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No products data yet.</p>
                ) : (
                  <div className="space-y-3">
                    {products.map((p: any, i) => (
                      <div key={p.name} className="flex items-center gap-3" data-testid={`row-top-product-${i}`}>
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.totalSold} sold</div>
                        </div>
                        <div className="text-sm font-bold text-primary">${p.revenue?.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent orders */}
            <Card>
              <CardHeader><CardTitle className="text-base">Recent Orders</CardTitle></CardHeader>
              <CardContent>
                {recentOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent orders.</p>
                ) : (
                  <div className="space-y-3">
                    {recentOrders.map((o: any) => (
                      <div key={o.id} className="flex items-center justify-between" data-testid={`row-order-${o.id}`}>
                        <div>
                          <div className="text-sm font-medium">ORD-{String(o.id).padStart(3, "0")}</div>
                          <div className="text-xs text-muted-foreground">${o.total}</div>
                        </div>
                        <Badge className={`text-xs ${STATUS_COLORS[o.status] ?? "bg-muted"}`}>{o.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
