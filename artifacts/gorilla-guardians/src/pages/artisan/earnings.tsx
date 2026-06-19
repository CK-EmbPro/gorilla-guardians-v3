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

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function ArtisanEarningsPage() {
  const { user } = useAuth();
  const { data: ordersData, isError, error } = useListOrders({ userId: user?.id ?? 4, limit: 100 });
  if (isError) console.error("[ArtisanEarnings] API error", error);
  const orders = ordersData?.orders ?? [];

  const monthlyMap: Record<string, { month: string; earnings: number; orders: number }> = {};
  orders.forEach((o: any) => {
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!monthlyMap[key]) monthlyMap[key] = { month: MONTH_NAMES[d.getMonth()], earnings: 0, orders: 0 };
    monthlyMap[key].earnings += Number(o.total) || 0;
    monthlyMap[key].orders += 1;
  });
  const monthlyData = Object.values(monthlyMap);

  const totalEarnings = orders.reduce((s: number, o: any) => s + (Number(o.total) || 0), 0);
  const now = new Date();
  const thisMonthEarnings = orders
    .filter((o: any) => { const d = new Date(o.createdAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
    .reduce((s: number, o: any) => s + (Number(o.total) || 0), 0);
  const avgOrderValue = orders.length > 0 ? Math.round(totalEarnings / orders.length) : 0;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="font-serif text-2xl font-bold">Earnings</h1>
            <p className="text-sm text-muted-foreground mt-1">Your sales and revenue overview.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { icon: DollarSign, label: "Total Earnings", value: `$${totalEarnings.toLocaleString()}`, sub: "All time", color: "bg-primary/10" },
              { icon: TrendingUp, label: "This Month", value: `$${thisMonthEarnings.toLocaleString()}`, sub: "Current month", color: "bg-green-50" },
              { icon: ShoppingBag, label: "Total Orders", value: orders.length.toString(), sub: "All time", color: "bg-secondary/10" },
              { icon: Package, label: "Avg Order Value", value: `$${avgOrderValue}`, sub: "Per sale", color: "bg-accent/10" },
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

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <Card className="border-border">
              <CardHeader><CardTitle className="text-base">Monthly Earnings</CardTitle></CardHeader>
              <CardContent>
                {monthlyData.length === 0 ? (
                  <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">No earnings data yet.</div>
                ) : (
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
                )}
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader><CardTitle className="text-base">Orders per Month</CardTitle></CardHeader>
              <CardContent>
                {monthlyData.length === 0 ? (
                  <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">No orders data yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(42 20% 90%)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="orders" fill="hsl(43 90% 50%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

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
                    {orders.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">No sales yet.</td></tr>
                    )}
                    {(orders as any[]).map((o: any, i) => (
                      <tr key={o.id ?? i} className="border-b border-border hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium text-primary">ORD-{String(o.id).padStart(3,"0")}</td>
                        <td className="px-4 py-3">{o.items?.[0]?.productName ?? o.items?.[0]?.product?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{o.customer?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <Badge className={`text-xs ${STATUS_COLORS[o.status] ?? "bg-muted"}`}>{o.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-bold">${o.total}</td>
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
