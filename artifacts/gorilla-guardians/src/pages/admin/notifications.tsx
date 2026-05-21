import { useState } from "react";
import { Bell, Send, CheckCheck, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useListNotifications, useMarkAllNotificationsRead, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

const TYPE_COLORS: Record<string, string> = {
  order: "bg-blue-50 text-blue-700 border-blue-200",
  system: "bg-purple-50 text-purple-700 border-purple-200",
  promo: "bg-amber-50 text-amber-700 border-amber-200",
  message: "bg-green-50 text-green-700 border-green-200",
};

const demoNotifs = [
  { id: 1, title: "New Order Received", message: "Order ORD-012 placed by Sarah Johnson for $210.", type: "order", isRead: false, createdAt: new Date(Date.now() - 15*60000).toISOString() },
  { id: 2, title: "Stock Alert", message: "Imigongo Triangle Panel has only 2 units left in stock.", type: "system", isRead: false, createdAt: new Date(Date.now() - 3*3600000).toISOString() },
  { id: 3, title: "New Review Pending", message: "A 5-star review for Peace Basket is awaiting moderation.", type: "system", isRead: true, createdAt: new Date(Date.now() - 24*3600000).toISOString() },
  { id: 4, title: "Monthly Report Ready", message: "Your May 2026 sales report has been generated.", type: "promo", isRead: true, createdAt: new Date(Date.now() - 2*24*3600000).toISOString() },
  { id: 5, title: "New Message", message: "Customer James Lee sent a message about order ORD-004.", type: "message", isRead: false, createdAt: new Date(Date.now() - 5*3600000).toISOString() },
];

export default function AdminNotificationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [sendOpen, setSendOpen] = useState(false);
  const [sendForm, setSendForm] = useState({ title: "", message: "", type: "system", targetRole: "all" });

  const { data: notifsData, isLoading } = useListNotifications({ limit: 100 });
  const markAll = useMarkAllNotificationsRead();

  const notifs = Array.isArray(notifsData) && notifsData.length > 0 ? notifsData : demoNotifs;
  const filtered = notifs.filter((n: any) => filter === "all" ? true : filter === "unread" ? !n.isRead : n.isRead);
  const unreadCount = notifs.filter((n: any) => !n.isRead).length;

  const handleMarkAll = () => {
    markAll.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "All notifications marked as read" });
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      },
    });
  };

  const handleSend = () => {
    if (!sendForm.title || !sendForm.message) return;
    toast({ title: "Notification sent!", description: `Sent to ${sendForm.targetRole === "all" ? "all users" : `${sendForm.targetRole}s`}.` });
    setSendOpen(false);
    setSendForm({ title: "", message: "", type: "system", targetRole: "all" });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-serif text-2xl font-bold">Notifications</h1>
              <p className="text-sm text-muted-foreground">{unreadCount} unread · {notifs.length} total</p>
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" className="gap-2 text-sm" onClick={handleMarkAll} disabled={markAll.isPending}>
                  <CheckCheck className="w-4 h-4" /> Mark all read
                </Button>
              )}
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" onClick={() => setSendOpen(true)}>
                <Send className="w-4 h-4" /> Send Notification
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-5">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">{Array.from({length:5}).map((_,i)=><div key={i} className="h-20 bg-muted rounded-xl animate-pulse"/>)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20"><Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3"/><p>No notifications.</p></div>
          ) : (
            <div className="space-y-2">
              {filtered.map((n: any) => (
                <Card key={n.id} className={`border-border transition-colors ${!n.isRead ? "border-l-4 border-l-primary bg-primary/2" : ""}`} data-testid={`card-notif-${n.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 mt-2 ${!n.isRead ? "bg-primary" : "bg-transparent"}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{n.title}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${TYPE_COLORS[n.type] ?? "bg-muted text-muted-foreground border-border"}`}>{n.type}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{n.message}</p>
                          <p className="text-xs text-muted-foreground/60 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send Notification</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Target Audience</Label>
              <Select value={sendForm.targetRole} onValueChange={v => setSendForm(f => ({ ...f, targetRole: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="customer">Customers</SelectItem>
                  <SelectItem value="artisan">Artisans</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={sendForm.type} onValueChange={v => setSendForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="promo">Promotion</SelectItem>
                  <SelectItem value="order">Order</SelectItem>
                  <SelectItem value="message">Message</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={sendForm.title} onChange={e => setSendForm(f => ({ ...f, title: e.target.value }))} placeholder="Notification title..." />
            </div>
            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea value={sendForm.message} onChange={e => setSendForm(f => ({ ...f, message: e.target.value }))} rows={3} placeholder="Notification message..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(false)}>Cancel</Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" onClick={handleSend}>
              <Send className="w-4 h-4" /> Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
