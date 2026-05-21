import { DollarSign, TrendingUp, ShoppingBag, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { useListOrders } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const monthlyData = months.map((month, i) => ({
  month,
  earnings: [420, 380, 560, 490, 720, 650, 810, 740, 620, 880, 950, 1120][i],
  orders: [8, 7, 11, 9, 14, 12, 16, 15, 12, 17, 19, 22][i],
}));

const demoSales = [
  { id: "ORD-001", product: "Imigongo Triangle Panel", buyer: "Sarah J.", amount: 125, status: "delivered", date: "2026-05-10" },
  { id: "ORD-002", product: "Peace Basket — Sunrise", buyer: "Pierre M.", amount: 70, status: "shipped", date: "2026-05-14" },
  { id: "ORD-003", product: "Beaded Necklace Set", buyer: "Amira K.", amount: 45, status: "processing", date: "2026-05-18" },
  { id: "ORD-004", product: "Kente Table Runner", buyer: "James L.", amount: 65, status: "delivered", date: "2026-05-08" },
  { id: "ORD-005", product: "Imigongo Triangle Panel", buyer: "Nina S.", amount: 125, status: "pending", date: "2026-05-19" },
];

export default function ArtisanEarningsPage() {
  const { user } = useAuth();
  const { data: ordersData } = useListOrders({ userId: user?.id ?? 4, limit: 10 });
  const orders = ordersData?.orders ?? demoSales;

  const totalEarnings = monthlyData.reduce((s, m) => s + m.earnings, 0);
  const currentMonth = monthlyData[new Date().getMonth()];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="font-serif text-2xl font-bold">Earnings</h1>
            <p className="text-sm text-muted-foreground mt-1">Your sales and revenue overview.</p>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { icon: DollarSign, label: "Total Earnings", value: `$${totalEarnings.toLocaleString()}`, sub: "All time", color: "bg-primary/10" },
              { icon: TrendingUp, label: "This Month", value: `$${currentMonth.earnings}`, sub: "+15% vs last", color: "bg-green-50" },
              { icon: ShoppingBag, label: "Total Orders", value: monthlyData.reduce((s, m) => s + m.orders, 0).toString(), sub: "All time", color: "bg-secondary/10" },
              { icon: Package, label: "Avg Order Value", value: `$${Math.round(totalEarnings / monthlyData.reduce((s, m) => s + m.orders, 0))}`, sub: "Per sale", color: "bg-accent/10" },
            ].map(({ icon: Icon, label, value, sub, color }) => (
              <Card key={label} className="border-border">
                <CardContent className="p-5">
                  <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-2xl font-serif font-bold mb-0.5">{value}</div>
                  <div className="text-sm text-muted-foreground">{label}</div>
                  <div className="text-xs text-muted-foreground/60 mt-0.5">{sub}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <Card className="border-border">
              <CardHeader><CardTitle className="text-base">Monthly Earnings (2026)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(152 42% 28%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(152 42% 28%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(42 20% 90%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => [`$${v}`, "Earnings"]} />
                    <Area type="monotone" dataKey="earnings" stroke="hsl(152 42% 28%)" fill="url(#earningsGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader><CardTitle className="text-base">Orders per Month</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(42 20% 90%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="orders" fill="hsl(43 90% 50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent sales */}
          <Card className="border-border">
            <CardHeader><CardTitle className="text-base">Recent Sales</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Buyer</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(orders as any[]).map((o: any, i) => (
                      <tr key={o.id ?? i} className="border-b border-border hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium text-primary">{o.id?.toString().startsWith("ORD") ? o.id : `ORD-${String(o.id).padStart(3,"0")}`}</td>
                        <td className="px-4 py-3">{o.product ?? "Product"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{o.buyer ?? o.customer?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{o.date ? new Date(o.date).toLocaleDateString() : new Date(o.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <Badge className={`text-xs ${STATUS_COLORS[o.status] ?? "bg-muted"}`}>{o.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-bold">${o.amount ?? o.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
