import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Heart, Menu, X, User, LogOut, ChevronDown, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth, getRedirectPath } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import NotificationBell from "./NotificationBell";

const LANGUAGES = [
  { code: "en", label: "EN", full: "English" },
  { code: "fr", label: "FR", full: "Français" },
  { code: "rw", label: "RW", full: "Kinyarwanda" },
];

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop" },
  { href: "/artisans", label: "Artisans" },
  { href: "/experiences", label: "Experiences" },
  { href: "/packages", label: "Packages" },
  { href: "/stories", label: "Stories" },
  { href: "/impact", label: "Impact" },
];

export default function Navbar() {
  const [location] = useLocation();
  const { user, logout, hasRole } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lang, setLang] = useState("en");

  const { itemCount: cartCount } = useCart();

  const dashboardPath = user ? getRedirectPath(user.role) : "/login";

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">GG</div>
            <div className="hidden sm:block">
              <div className="font-serif text-lg font-bold text-primary leading-tight">Gorilla Guardians</div>
              <div className="text-[10px] text-muted-foreground tracking-widest uppercase">Village, Rwanda</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location === link.href
                    ? "text-primary bg-primary/8"
                    : "text-foreground/70 hover:text-primary hover:bg-primary/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/events" className="px-3 py-2 rounded-md text-sm font-medium text-foreground/70 hover:text-primary hover:bg-primary/5">Events</Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Language */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground" data-testid="button-language">
                  <Globe className="w-3.5 h-3.5" />
                  {LANGUAGES.find(l => l.code === lang)?.label}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                {LANGUAGES.map(l => (
                  <DropdownMenuItem key={l.code} onClick={() => setLang(l.code)} className="text-sm">
                    <span className="font-medium w-6">{l.label}</span> {l.full}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Cart */}
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative" data-testid="button-cart">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-[10px] flex items-center justify-center bg-primary" data-testid="text-cart-count">
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Notification Bell — only for logged-in users */}
            {user && <NotificationBell />}

            {/* User menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2" data-testid="button-user-menu">
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-semibold">
                      {user.name.charAt(0)}
                    </div>
                    <span className="hidden sm:block text-sm max-w-24 truncate">{user.name.split(" ")[0]}</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <div className="text-sm font-medium truncate">{user.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{user.role.replace("_", " ")}</div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={dashboardPath} className="flex items-center gap-2 cursor-pointer" data-testid="link-dashboard">
                      <User className="w-4 h-4" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {!hasRole("artisan", "staff", "admin", "super_admin") && (
                    <DropdownMenuItem asChild>
                      <Link href="/customer/wishlist" className="flex items-center gap-2 cursor-pointer">
                        <Heart className="w-4 h-4" /> Wishlist
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive gap-2" data-testid="button-logout">
                    <LogOut className="w-4 h-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground" data-testid="button-login">
                  Sign in
                </Button>
              </Link>
            )}

            {/* Mobile menu toggle */}
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(!mobileOpen)} data-testid="button-mobile-menu">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-white px-4 pb-4 pt-2">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2.5 rounded-md text-sm font-medium ${
                location === link.href ? "text-primary bg-primary/8" : "text-foreground/70"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/events" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-md text-sm font-medium text-foreground/70">Events</Link>
        </div>
      )}
    </nav>
  );
}
