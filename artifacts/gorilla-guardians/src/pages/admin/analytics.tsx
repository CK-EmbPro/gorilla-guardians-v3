import { useState } from "react";
import { Download, TrendingUp, Users, ShoppingBag, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell,
} from "recharts";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { useGetSalesAnalytics } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const COLORS = ["#2d6a4f", "#f4a261", "#6b4226", "#219ebc", "#e63946"];

const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const revenueData = months.map((month, i) => ({
  month,
  revenue: [3200, 2900, 4100, 3800, 5200, 4700, 6100, 5600, 4800, 6800, 7200, 8400][i],
  orders: [28, 24, 36, 31, 45, 40, 54, 49, 42, 58, 62, 73][i],
  customers: [12, 10, 16, 14, 20, 18, 24, 22, 19, 26, 28, 33][i],
}));

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
  const { data: salesData } = useGetSalesAnalytics({ period: period as any });

  const sales = Array.isArray(salesData) && salesData.length > 0 ? salesData : revenueData;
  const totalRevenue = revenueData.reduce((s, m) => s + m.revenue, 0);
  const totalOrders = revenueData.reduce((s, m) => s + m.orders, 0);
  const totalCustomers = revenueData.reduce((s, m) => s + m.customers, 0);

  const handleExport = (format: string) => {
    toast({ title: `Exporting as ${format}…`, description: "Your file will be ready shortly." });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-serif text-2xl font-bold">Analytics</h1>
              <p className="text-sm text-muted-foreground mt-1">Sales trends, revenue, and customer growth.</p>
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

          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { icon: DollarSign, label: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, change: "+18%", color: "bg-primary/10" },
              { icon: ShoppingBag, label: "Total Orders", value: totalOrders.toString(), change: "+12%", color: "bg-secondary/10" },
              { icon: Users, label: "New Customers", value: totalCustomers.toString(), change: "+24%", color: "bg-accent/10" },
              { icon: TrendingUp, label: "Avg Order Value", value: `$${Math.round(totalRevenue / totalOrders)}`, change: "+6%", color: "bg-blue-50" },
            ].map(({ icon: Icon, label, value, change, color }) => (
              <Card key={label} className="border-border">
                <CardContent className="p-5">
                  <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-2xl font-serif font-bold mb-0.5">{value}</div>
                  <div className="text-sm text-muted-foreground">{label}</div>
                  <div className="text-xs text-green-600 font-medium mt-1">{change} vs last period</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="revenue" className="space-y-6">
            <TabsList>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="geography">Geography</TabsTrigger>
            </TabsList>

            <TabsContent value="revenue">
              <div className="grid lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-border">
                  <CardHeader><CardTitle className="text-base">Monthly Revenue (2026)</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={revenueData}>
                        <defs>
                          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(152 42% 28%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(152 42% 28%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(42 20% 90%)" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
                        <Area type="monotone" dataKey="revenue" stroke="hsl(152 42% 28%)" fill="url(#revGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardHeader><CardTitle className="text-base">Sales by Category</CardTitle></CardHeader>
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

            <TabsContent value="orders">
              <Card className="border-border">
                <CardHeader><CardTitle className="text-base">Monthly Orders (2026)</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(42 20% 90%)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="orders" fill="hsl(43 90% 50%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customers">
              <Card className="border-border">
                <CardHeader><CardTitle className="text-base">Customer Growth (2026)</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(42 20% 90%)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="customers" stroke="hsl(152 42% 28%)" strokeWidth={2} dot={{ fill: "hsl(152 42% 28%)", r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="geography">
              <Card className="border-border">
                <CardHeader><CardTitle className="text-base">Top Countries by Revenue</CardTitle></CardHeader>
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
