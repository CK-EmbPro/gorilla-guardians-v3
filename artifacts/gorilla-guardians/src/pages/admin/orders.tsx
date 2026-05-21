import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useListOrders, useUpdateOrder, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const demoOrders = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  customer: { name: ["Sarah J.","Pierre M.","Amira K.","James L.","Nina S.","Hana T.","Lucas B.","Mei C.","Omar D.","Emma W.","Carlos G.","Fatou S."][i] },
  total: [210,85,450,125,65,320,175,240,90,380,155,70][i],
  status: ["shipped","pending","processing","delivered","pending","shipped","processing","delivered","pending","shipped","delivered","cancelled"][i],
  createdAt: new Date(Date.now() - i * 24 * 3600000).toISOString(),
  items: [{ product: { name: ["Imigongo Panel","Peace Basket","Wood Sculpture","Ceramic Pot","Necklace","Table Runner","Drum","Mask","Bracelet","Painting","Bowl","Cloth"][i] }, quantity: 1 }],
}));

export default function AdminOrdersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("");

  const { data: ordersData, isLoading } = useListOrders({ status: statusFilter !== "all" ? statusFilter as any : undefined, limit: 100 });
  const updateOrder = useUpdateOrder();
  const orders = ordersData?.orders ?? demoOrders;
  const filtered = orders.filter((o: any) => !search || `ORD-${String(o.id).padStart(3,"0")} ${o.customer?.name ?? ""}`.toLowerCase().includes(search.toLowerCase()));

  const handleUpdateStatus = () => {
    if (!selectedOrder || !newStatus) return;
    updateOrder.mutate({ id: selectedOrder.id, data: { status: newStatus as any } }, {
      onSuccess: () => {
        toast({ title: "Order status updated" });
        setSelectedOrder(null);
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
      },
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="font-serif text-2xl font-bold">Orders</h1>
            <p className="text-sm text-muted-foreground">{filtered.length} orders total</p>
          </div>

          <div className="flex flex-wrap gap-3 mb-5">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by order ID or customer..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44">
                <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {["pending","processing","shipped","delivered","cancelled"].map(s => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">{Array.from({length:6}).map((_,i)=><div key={i} className="h-12 bg-muted rounded-xl animate-pulse"/>)}</div>
          ) : (
            <Card className="border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Items</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((o: any) => (
                      <tr key={o.id} className="border-b border-border hover:bg-muted/20 transition-colors" data-testid={`row-admin-order-${o.id}`}>
                        <td className="px-4 py-3 font-medium text-primary">ORD-{String(o.id).padStart(3,"0")}</td>
                        <td className="px-4 py-3">{o.customer?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs max-w-[160px] truncate">{o.items?.map((i: any) => i.product?.name ?? "Item").join(", ") ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3"><Badge className={`text-xs ${STATUS_COLORS[o.status] ?? "bg-muted"}`}>{o.status}</Badge></td>
                        <td className="px-4 py-3 text-right font-bold">${o.total}</td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setSelectedOrder(o); setNewStatus(o.status); }}>Update</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </main>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Order</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">Order <span className="font-medium text-foreground">ORD-{String(selectedOrder?.id ?? "").padStart(3,"0")}</span> · <span className="font-medium text-foreground">{selectedOrder?.customer?.name}</span></p>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["pending","processing","shipped","delivered","cancelled"].map(s => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>Cancel</Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleUpdateStatus} disabled={updateOrder.isPending}>
              {updateOrder.isPending ? "Saving..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
