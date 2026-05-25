import { Bell, CheckCheck, Package, Tag, Info, MessageSquare, Star, ShoppingBag, Users, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNotifications } from "@/lib/useNotifications";
import { cn } from "@/lib/utils";
import Navbar from "@/components/layout/Navbar";

const TYPE_ICONS: Record<string, any> = {
  order: ShoppingBag,
  booking: Package,
  payment: Package,
  delivery: Package,
  message: MessageSquare,
  review: Star,
  user: Users,
  artisan: Users,
  promotion: Tag,
  system: Info,
};

const TYPE_LABELS: Record<string, string> = {
  order: "Order",
  booking: "Booking",
  payment: "Payment",
  delivery: "Delivery",
  message: "Message",
  review: "Review",
  user: "Account",
  artisan: "Artisan",
  promotion: "Promotion",
  system: "System",
};

export default function NotificationsPage() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="font-serif text-2xl font-bold flex items-center gap-2">
              <Bell className="w-6 h-6 text-primary" />
              Notifications
            </h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5" data-testid="button-mark-all-read">
              <CheckCheck className="w-4 h-4" /> Mark all read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell className="w-14 h-14 text-muted-foreground mx-auto mb-4 opacity-30" />
            <h3 className="font-medium text-lg mb-1">No notifications yet</h3>
            <p className="text-sm text-muted-foreground">
              You'll be notified about orders, messages, and updates here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => {
              const Icon = TYPE_ICONS[n.type] ?? Bell;
              return (
                <Card
                  key={n.id}
                  className={cn(
                    "border-border transition-all cursor-pointer hover:shadow-sm",
                    !n.isRead && "border-primary/25 bg-primary/3"
                  )}
                  onClick={() => { if (!n.isRead) markRead(n.id); }}
                  data-testid={`card-notification-${n.id}`}
                >
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                      n.isRead ? "bg-muted" : "bg-primary/12"
                    )}>
                      <Icon className={cn("w-4 h-4", n.isRead ? "text-muted-foreground" : "text-primary")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn("text-sm font-medium", !n.isRead && "text-foreground")}>{n.title}</span>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {TYPE_LABELS[n.type] ?? n.type}
                          </Badge>
                        </div>
                        {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                      </div>
                      <p className="text-sm text-muted-foreground">{n.message}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(n.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {n.link && (
                          <Link href={n.link} className="text-xs text-primary hover:underline">
                            View →
                          </Link>
                        )}
                        {!n.isRead && (
                          <button
                            onClick={e => { e.stopPropagation(); markRead(n.id); }}
                            className="text-xs text-muted-foreground hover:text-primary"
                            data-testid={`button-mark-read-${n.id}`}
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
