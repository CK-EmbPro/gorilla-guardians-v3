import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Package, Users, BookOpen, ShoppingBag, Star, MessageSquare,
  Bell, FileText, Calendar, BarChart2, Heart, LogOut, ChevronLeft, ChevronRight,
  Megaphone, TreePine, Truck, Settings, User, DollarSign, PlusCircle, Globe, Mail,
  ScanLine, UserCheck, Layers,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth, type UserRole } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  // Customer
  { href: "/customer/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["customer"] },
  { href: "/customer/orders", label: "My Orders", icon: ShoppingBag, roles: ["customer"] },
  { href: "/customer/bookings", label: "My Bookings", icon: Calendar, roles: ["customer"] },
  { href: "/customer/wishlist", label: "Wishlist", icon: Heart, roles: ["customer"] },
  { href: "/customer/messages", label: "Messages", icon: MessageSquare, roles: ["customer"] },
  { href: "/customer/notifications", label: "Notifications", icon: Bell, roles: ["customer"] },
  { href: "/customer/feedback", label: "Feedback", icon: FileText, roles: ["customer"] },
  // Artisan
  { href: "/artisan/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["artisan"] },
  { href: "/artisan/products", label: "My Products", icon: Package, roles: ["artisan"] },
  { href: "/artisan/products/new", label: "Add Product", icon: PlusCircle, roles: ["artisan"] },
  { href: "/artisan/earnings", label: "Earnings", icon: DollarSign, roles: ["artisan"] },
  { href: "/artisan/messages", label: "Messages", icon: MessageSquare, roles: ["artisan"] },
  // Staff
  { href: "/staff/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["staff"] },
  { href: "/staff/orders", label: "Orders", icon: ShoppingBag, roles: ["staff"] },
  { href: "/staff/products", label: "Products", icon: Package, roles: ["staff"] },
  { href: "/staff/messages", label: "Messages", icon: MessageSquare, roles: ["staff"] },
  { href: "/admin/bookings", label: "Bookings", icon: Calendar, roles: ["staff"] },
  { href: "/booking-verify", label: "Verify QR", icon: ScanLine, roles: ["staff"] },
  { href: "/admin/delivery", label: "Delivery", icon: Truck, roles: ["staff"] },
  { href: "/admin/notifications", label: "Notifications", icon: Bell, roles: ["staff"] },
  { href: "/admin/feedback", label: "Feedback", icon: Megaphone, roles: ["staff"] },
  // Admin
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "super_admin"] },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2, roles: ["admin", "super_admin"] },
  { href: "/admin/products", label: "Products", icon: Package, roles: ["admin", "super_admin"] },
  { href: "/admin/artisans", label: "Artisans", icon: Users, roles: ["admin", "super_admin"] },
  { href: "/admin/experiences", label: "Experiences", icon: TreePine, roles: ["admin", "super_admin"] },
  { href: "/admin/packages", label: "Packages", icon: Layers, roles: ["admin", "super_admin"] },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag, roles: ["admin", "super_admin"] },
  { href: "/admin/delivery", label: "Delivery", icon: Truck, roles: ["admin", "super_admin"] },
  { href: "/admin/users", label: "Users", icon: User, roles: ["admin", "super_admin"] },
  { href: "/admin/bookings", label: "Bookings", icon: Calendar, roles: ["admin", "super_admin"] },
  { href: "/admin/guides", label: "Tour Guides", icon: UserCheck, roles: ["admin", "super_admin"] },
  { href: "/booking-verify", label: "Verify QR", icon: ScanLine, roles: ["admin", "super_admin"] },
  { href: "/admin/reviews", label: "Reviews", icon: Star, roles: ["admin", "super_admin"] },
  { href: "/admin/stories", label: "Stories", icon: BookOpen, roles: ["admin", "super_admin"] },
  { href: "/admin/events", label: "Events", icon: Calendar, roles: ["admin", "super_admin"] },
  { href: "/admin/homepage", label: "Homepage CMS", icon: Globe, roles: ["admin", "super_admin"] },
  { href: "/admin/notifications", label: "Notifications", icon: Bell, roles: ["admin", "super_admin"] },
  { href: "/admin/email-logs", label: "Email Logs", icon: Mail, roles: ["admin", "super_admin"] },
  { href: "/admin/feedback", label: "Feedback", icon: Megaphone, roles: ["admin", "super_admin"] },
];

const BOTTOM_ITEMS: NavItem[] = [
  { href: "/profile", label: "Profile", icon: User, roles: ["customer", "artisan", "staff", "admin", "super_admin"] },
  { href: "/admin/settings", label: "Settings", icon: Settings, roles: ["admin", "super_admin"] },
];

export default function DashboardSidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(user.role));
  const visibleBottom = BOTTOM_ITEMS.filter(item => item.roles.includes(user.role));

  const isActive = (href: string) => location === href || (href !== "/" && location.startsWith(href + "/"));

  return (
    <aside className={cn(
      "flex flex-col h-screen sticky top-0 bg-sidebar text-sidebar-foreground transition-all duration-300 shrink-0",
      collapsed ? "w-16" : "w-60"
    )}>
      {/* Logo area */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-xs font-bold shrink-0">GG</div>
        {!collapsed && (
          <div>
            <div className="font-serif text-sm font-bold leading-tight">Gorilla Guardians</div>
            <div className="text-[10px] opacity-60 uppercase tracking-wider capitalize">{user.role.replace("_", " ")}</div>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {visibleItems.map(item => {
          const active = isActive(item.href);
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              data-testid={`link-nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors group",
                active
                  ? "bg-white/15 text-white"
                  : "text-sidebar-foreground/70 hover:bg-white/8 hover:text-white"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom links */}
      <div className="border-t border-sidebar-border p-3 space-y-0.5">
        {!collapsed && (
          <div className="px-3 py-2 mb-1">
            <div className="text-xs font-medium truncate">{user.name}</div>
            <div className="text-[10px] opacity-60">{user.email}</div>
          </div>
        )}

        {visibleBottom.map(item => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              data-testid={`link-nav-${item.label.toLowerCase()}`}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-white/15 text-white"
                  : "text-sidebar-foreground/70 hover:text-white hover:bg-white/8"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground/70 hover:text-white hover:bg-white/8 text-sm transition-colors">
          <ChevronLeft className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Back to Site</span>}
        </Link>
        <button
          onClick={logout}
          data-testid="button-logout-sidebar"
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground/70 hover:text-white hover:bg-white/8 text-sm transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center py-1.5 rounded-md text-sidebar-foreground/40 hover:text-white/60 transition-colors"
          data-testid="button-collapse-sidebar"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
