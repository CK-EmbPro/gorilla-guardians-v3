import { Bell, Check, CheckCheck, Package, Tag, Info, MessageSquare, Star, ShoppingBag, Users } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const recent = notifications.slice(0, 6);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notification-bell"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-[10px] flex items-center justify-center bg-destructive text-destructive-foreground animate-pulse"
              data-testid="text-unread-count"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0 shadow-lg" data-testid="dropdown-notifications">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <Badge className="bg-primary text-primary-foreground text-xs px-1.5 py-0">{unreadCount}</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead()}
              className="text-xs text-primary hover:underline flex items-center gap-1"
              data-testid="button-mark-all-read-dropdown"
            >
              <CheckCheck className="w-3 h-3" /> All read
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {recent.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            recent.map(n => {
              const Icon = TYPE_ICONS[n.type] ?? Bell;
              return (
                <div
                  key={n.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-muted/40 transition-colors cursor-pointer group",
                    !n.isRead && "bg-primary/3"
                  )}
                  onClick={() => { if (!n.isRead) markRead(n.id); }}
                  data-testid={`notification-item-${n.id}`}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                    n.isRead ? "bg-muted" : "bg-primary/15"
                  )}>
                    <Icon className={cn("w-3.5 h-3.5", n.isRead ? "text-muted-foreground" : "text-primary")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <p className={cn("text-xs font-medium truncate", !n.isRead && "text-foreground")}>{n.title}</p>
                      {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1" />}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-border px-4 py-2.5">
          <Link href="/notifications" className="block w-full text-center text-xs text-primary hover:underline font-medium" data-testid="link-view-all-notifications">
            View all notifications
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
