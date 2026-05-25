import { Bell, CheckCheck, Package, Tag, Info, MessageSquare, Star, ShoppingBag, Users } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { useNotifications } from "@/lib/useNotifications";
import { cn } from "@/lib/utils";

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

export default function CustomerNotificationsPage() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-serif text-2xl font-bold">Notifications</h1>
              {unreadCount > 0 && <p className="text-sm text-muted-foreground mt-0.5">{unreadCount} unread</p>}
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5" data-testid="button-mark-all-read">
                <CheckCheck className="w-4 h-4" /> Mark all read
              </Button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="text-center py-20">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map(n => {
                const Icon = TYPE_ICONS[n.type] ?? Bell;
                return (
                  <Card
                    key={n.id}
                    className={cn("border-border transition-all cursor-pointer hover:shadow-sm", !n.isRead && "border-primary/20 bg-primary/3")}
                    onClick={() => { if (!n.isRead) markRead(n.id); }}
                    data-testid={`card-notification-${n.id}`}
                  >
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0", n.isRead ? "bg-muted" : "bg-primary/10")}>
                        <Icon className={cn("w-4 h-4", n.isRead ? "text-muted-foreground" : "text-primary")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-medium text-sm">{n.title}</div>
                          {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {n.link && (
                            <Link href={n.link} className="text-xs text-primary hover:underline" onClick={e => e.stopPropagation()}>
                              View →
                            </Link>
                          )}
                          {!n.isRead && (
                            <button
                              onClick={e => { e.stopPropagation(); markRead(n.id); }}
                              className="text-xs text-primary hover:underline"
                              data-testid={`button-mark-read-${n.id}`}
                            >
                              Mark as read
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
        </div>
      </main>
    </div>
  );
}
