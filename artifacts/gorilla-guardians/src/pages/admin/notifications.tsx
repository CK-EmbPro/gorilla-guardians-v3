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
import { useToast } from "@/hooks/use-toast";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { useNotifications } from "@/lib/useNotifications";

const TYPE_COLORS: Record<string, string> = {
  order: "bg-blue-50 text-blue-700 border-blue-200",
  system: "bg-purple-50 text-purple-700 border-purple-200",
  promotion: "bg-amber-50 text-amber-700 border-amber-200",
  message: "bg-green-50 text-green-700 border-green-200",
  booking: "bg-teal-50 text-teal-700 border-teal-200",
};

const BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

export default function AdminNotificationsPage() {
  const { toast } = useToast();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [filter, setFilter] = useState("all");
  const [sendOpen, setSendOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendForm, setSendForm] = useState({ title: "", message: "", type: "system", targetUserId: "" });

  const filtered = notifications.filter((n: any) => filter === "all" ? true : filter === "unread" ? !n.isRead : n.isRead);

  const handleMarkAll = async () => {
    await markAllRead();
    toast({ title: "All notifications marked as read" });
  };

  const handleSend = async () => {
    if (!sendForm.title || !sendForm.message || !sendForm.targetUserId) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`${BASE}/api/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: Number(sendForm.targetUserId),
          type: sendForm.type,
          title: sendForm.title,
          message: sendForm.message,
        }),
      });
      if (!res.ok) throw new Error("Failed to send");
      toast({ title: "Notification sent!", description: `Delivered to user #${sendForm.targetUserId} via SSE in real-time.` });
      setSendOpen(false);
      setSendForm({ title: "", message: "", type: "system", targetUserId: "" });
    } catch {
      toast({ title: "Failed to send notification", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-serif text-2xl font-bold">Notifications</h1>
              <p className="text-sm text-muted-foreground">{unreadCount} unread · {notifications.length} total · <span className="text-primary">live updates via SSE</span></p>
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" className="gap-2 text-sm" onClick={handleMarkAll}>
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

          {filtered.length === 0 ? (
            <div className="text-center py-20"><Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30"/><p className="text-muted-foreground">No notifications.</p></div>
          ) : (
            <div className="space-y-2">
              {filtered.map((n: any) => (
                <Card key={n.id} className={`border-border transition-colors ${!n.isRead ? "border-l-4 border-l-primary bg-primary/2" : ""}`} data-testid={`card-notif-${n.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-2 h-2 rounded-full shrink-0 mt-2 ${!n.isRead ? "bg-primary" : "bg-transparent"}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
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
          <DialogHeader><DialogTitle>Send Real-Time Notification</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Target User ID</Label>
              <Input
                type="number"
                value={sendForm.targetUserId}
                onChange={e => setSendForm(f => ({ ...f, targetUserId: e.target.value }))}
                placeholder="e.g. 1 (customer), 2 (artisan)..."
              />
              <p className="text-xs text-muted-foreground">User IDs: 1=Jean-Paul, 2=Marie, 3=Celestine, 4=Emmanuel, 5=Staff</p>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={sendForm.type} onValueChange={v => setSendForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="order">Order</SelectItem>
                  <SelectItem value="booking">Booking</SelectItem>
                  <SelectItem value="message">Message</SelectItem>
                  <SelectItem value="promotion">Promotion</SelectItem>
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
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" onClick={handleSend} disabled={sending}>
              <Send className="w-4 h-4" /> {sending ? "Sending…" : "Send Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
