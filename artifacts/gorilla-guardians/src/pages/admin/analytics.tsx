import { useState } from "react";
import { Download, TrendingUp, ShoppingBag, DollarSign, Percent, Eye, Package as PackageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell,
} from "recharts";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { useGetSalesAnalytics, useGetDashboardStats, useGetTopProducts, useGetTopExperiences, useGetMostViewed } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const COLORS = ["#2d6a4f", "#f4a261", "#6b4226", "#219ebc", "#e63946"];

// "Sales by Category" and "Top Countries" aren't part of the requested revenue/booking/conversion
// metric set and there's no category- or country-level field on orders to compute them from real
// data yet — left as illustrative placeholders, clearly separate from the real metrics above.
const categoryData = [
  { name: "Baskets", value: 38 },
  { name: "Sculptures", value: 22 },
  { name: "Paintings", value: 18 },
  { name: "Jewelry", value: 14 },
  { name: "Textiles", value: 8 },
];

const countryData = [
  { country: "USA", orders: 145, revenue: 18400 },
  { country: "UK", orders: 87, revenue: 11200 },
  { country: "Germany", orders: 63, revenue: 8100 },
  { country: "France", orders: 51, revenue: 6500 },
  { country: "Australia", orders: 44, revenue: 5600 },
  { country: "Canada", orders: 38, revenue: 4900 },
];

export default function AdminAnalyticsPage() {
  const { toast } = useToast();
  const [period, setPeriod] = useState("month");

  const { data: salesData, isLoading: salesLoading } = useGetSalesAnalytics({ period: period as any });
  const { data: stats } = useGetDashboardStats();
  const { data: topProductsData } = useGetTopProducts({ limit: 5 });
  const { data: topExperiencesData } = useGetTopExperiences();
  const { data: mostViewedExperiences } = useGetMostViewed({ eventType: "view_experience", limit: 5 });

  const sales: any[] = Array.isArray(salesData) ? salesData : [];
  const topProducts: any[] = Array.isArray(topProductsData) ? topProductsData : [];
  const topExperiences: any[] = Array.isArray(topExperiencesData) ? topExperiencesData : [];
  const mostViewed: any[] = Array.isArray(mostViewedExperiences) ? mostViewedExperiences : [];

  const handleExport = (format: string) => {
    toast({ title: `Exporting as ${format}…`, description: "Your file will be ready shortly." });
  };

  const kpis = stats ? [
    { icon: DollarSign, label: "Total Revenue", value: `$${stats.totalRevenue.toLocaleString()}`, color: "bg-primary/10" },
    { icon: ShoppingBag, label: "Total Orders", value: stats.totalOrders.toLocaleString(), color: "bg-secondary/10" },
    { icon: Percent, label: "Conversion Rate", value: `${stats.conversionRate}%`, color: "bg-accent/10" },
    { icon: TrendingUp, label: "New Customers (This Month)", value: stats.newCustomersThisMonth.toLocaleString(), color: "bg-blue-50" },
  ] : [];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-serif text-2xl font-bold">Analytics</h1>
              <p className="text-sm text-muted-foreground mt-1">Real revenue, booking, and conversion data — computed from live orders, bookings, and tracked views.</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last 7 days</SelectItem>
                  <SelectItem value="month">Last 30 days</SelectItem>
                  <SelectItem value="year">This year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2" onClick={() => handleExport("PDF")}>
                <Download className="w-4 h-4" /> PDF
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => handleExport("Excel")}>
                <Download className="w-4 h-4" /> Excel
              </Button>
            </div>
          </div>

          {/* KPI row — sourced from /analytics/dashboard, all real */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {(kpis.length > 0 ? kpis : Array.from({ length: 4 })).map((kpi: any, i) => (
              <Card key={kpi?.label ?? i} className="border-border">
                <CardContent className="p-5">
                  {kpi ? (
                    <>
                      <div className={`w-10 h-10 rounded-lg ${kpi.color} flex items-center justify-center mb-3`}>
                        <kpi.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-2xl font-serif font-bold mb-0.5">{kpi.value}</div>
                      <div className="text-sm text-muted-foreground">{kpi.label}</div>
                    </>
                  ) : (
                    <div className="h-16 bg-muted rounded animate-pulse" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="revenue" className="space-y-6">
            <TabsList>
              <TabsTrigger value="revenue">Revenue Trend</TabsTrigger>
              <TabsTrigger value="bookings">Booking Trend</TabsTrigger>
              <TabsTrigger value="performance">Top Performers</TabsTrigger>
              <TabsTrigger value="geography">Geography</TabsTrigger>
            </TabsList>

            <TabsContent value="revenue">
              <div className="grid lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-border">
                  <CardHeader><CardTitle className="text-base">Revenue Over Time</CardTitle></CardHeader>
                  <CardContent>
                    {salesLoading ? (
                      <div className="h-[280px] bg-muted rounded animate-pulse" />
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={sales}>
                          <defs>
                            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(152 42% 28%)" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(152 42% 28%)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(42 20% 90%)" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
                          <Area type="monotone" dataKey="revenue" stroke="hsl(152 42% 28%)" fill="url(#revGrad)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardHeader><CardTitle className="text-base">Sales by Category</CardTitle><p className="text-xs text-muted-foreground">Illustrative — not yet tracked per category</p></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={categoryData} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                          {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Legend iconSize={10} iconType="circle" />
                        <Tooltip formatter={(v: number) => [`${v}%`, "Share"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="bookings">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="border-border">
                  <CardHeader><CardTitle className="text-base">Orders Over Time</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={sales}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(42 20% 90%)" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="orders" fill="hsl(43 90% 50%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardHeader><CardTitle className="text-base">Experience Bookings Over Time</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={sales}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(42 20% 90%)" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="bookings" fill="hsl(152 42% 28%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance">
              <div className="grid lg:grid-cols-3 gap-6">
                <Card className="border-border">
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><PackageIcon className="w-4 h-4 text-primary" /> Most Purchased Products</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {topProducts.length === 0 ? <p className="text-sm text-muted-foreground">No sales yet.</p> : topProducts.map((p, i) => (
                      <div key={p.productId} className="flex items-center gap-3">
                        <span className="w-5 text-sm font-medium text-muted-foreground">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.totalSold} sold · {p.artisanName}</div>
                        </div>
                        <Badge variant="outline" className="text-xs">${p.revenue.toFixed(0)}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Top Booked Experiences</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {topExperiences.length === 0 ? <p className="text-sm text-muted-foreground">No bookings yet.</p> : topExperiences.map((e, i) => (
                      <div key={e.experienceId} className="flex items-center gap-3">
                        <span className="w-5 text-sm font-medium text-muted-foreground">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{e.title}</div>
                          <div className="text-xs text-muted-foreground">{e.totalBookings} bookings{e.averageRating ? ` · ${e.averageRating}★` : ""}</div>
                        </div>
                        <Badge variant="outline" className="text-xs">${e.revenue.toFixed(0)}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Eye className="w-4 h-4 text-primary" /> Most Viewed Experiences</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {mostViewed.length === 0 ? <p className="text-sm text-muted-foreground">No views tracked yet.</p> : mostViewed.map((v, i) => (
                      <div key={`${v.eventType}-${v.entityId}`} className="flex items-center gap-3">
                        <span className="w-5 text-sm font-medium text-muted-foreground">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{v.title}</div>
                        </div>
                        <Badge variant="outline" className="text-xs">{v.viewCount} views</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="geography">
              <Card className="border-border">
                <CardHeader><CardTitle className="text-base">Top Countries by Revenue</CardTitle><p className="text-xs text-muted-foreground">Illustrative — orders don't capture a structured country field yet</p></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {countryData.map((c, i) => (
                      <div key={c.country} className="flex items-center gap-4">
                        <div className="w-6 text-sm font-medium text-muted-foreground">{i + 1}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{c.country}</span>
                            <span className="text-sm font-bold">${c.revenue.toLocaleString()}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${(c.revenue / countryData[0].revenue) * 100}%` }} />
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground w-16 text-right">{c.orders} orders</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
