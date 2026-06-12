# Gorilla Guardians HandCrafts — Visual Design Specification

**Project:** Gorilla Guardians HandCrafts
**Stack:** React 18 + TypeScript + Vite + Tailwind CSS 3 + shadcn/ui
**Date:** 2026-05-15
**Author:** UI Designer Agent

> All class names below are Tailwind utilities referencing CSS custom properties defined in
> `src/index.css`. All colors are HSL and MUST use the design token variables — never raw
> hex or RGB values. shadcn/ui components are pre-installed in `src/components/ui/`.

---

## Design Token Reference (do not add to this list)

All tokens are defined as CSS custom properties in `src/index.css` under `:root`.
Tailwind maps them via `tailwind.config.ts`.

| Token | CSS Variable | HSL Value | Usage |
|-------|-------------|-----------|-------|
| `bg-background` | `--background` | `35 20% 97%` | Page background, section fills |
| `text-foreground` | `--foreground` | `28 35% 15%` | Primary body text, headings |
| `bg-primary` | `--primary` | `145 45% 28%` | CTAs, active nav, conservation accent |
| `text-primary-foreground` | `--primary-foreground` | `0 0% 98%` | Text on primary bg |
| `bg-secondary` | `--secondary` | `28 40% 45%` | Earth-brown accents, secondary buttons |
| `text-secondary-foreground` | `--secondary-foreground` | `0 0% 98%` | Text on secondary bg |
| `bg-muted` | `--muted` | `35 15% 92%` | Subtle section fills, skeleton loaders |
| `text-muted-foreground` | `--muted-foreground` | `28 20% 40%` | Captions, labels, placeholder text |
| `bg-accent` | `--accent` | `42 88% 55%` | Golden-yellow highlights, badges, icons |
| `text-accent-foreground` | `--accent-foreground` | `28 35% 15%` | Text on accent bg |
| `bg-card` | `--card` | `0 0% 100%` | Cards, panels, dialogs |
| `border-border` | `--border` | `35 15% 88%` | Input borders, card borders, dividers |
| `bg-destructive` | `--destructive` | `0 84.2% 60.2%` | Error states, delete actions |
| `rounded-lg` | `--radius` | `0.75rem` | Default border radius for cards |

### Gradient Utilities (defined in `src/index.css`)
| Class | Usage |
|-------|-------|
| `.gradient-earth` | Earth-brown → forest-green; hero overlays, section dividers |
| `.gradient-hope` | Golden → earth-brown; accent banners, CTA backgrounds |
| `.gradient-forest` | Forest-green top → darker green bottom; full-bleed hero |
| `.gradient-subtle` | Light cream → muted; alternating section backgrounds |

### Shadow Utilities
| Class | Usage |
|-------|-------|
| `.shadow-warm` | Warm brown shadow; product cards, experience cards |
| `.shadow-forest` | Deep green shadow; primary CTA buttons, hero elements |

### Transition
Use `.transition-smooth` (`all 0.4s cubic-bezier(0.4, 0, 0.2, 1)`) on interactive elements.

---

## Typography Conventions

| Role | Tailwind Classes |
|------|-----------------|
| Page hero headline | `text-4xl md:text-6xl font-bold text-foreground leading-tight` |
| Section heading | `text-2xl md:text-3xl font-bold text-foreground` |
| Sub-heading / card title | `text-lg font-semibold text-foreground` |
| Body copy | `text-base text-foreground leading-relaxed` |
| Caption / label | `text-sm text-muted-foreground` |
| Price | `text-xl font-bold text-primary` |
| Badge text | `text-xs font-semibold uppercase tracking-wide` |

---

## Section 1 — Navbar (`src/components/Navbar.tsx`)

### Design Intent
Fixed top bar with the brand name left-aligned, navigation centre, and cart + language
selector right-aligned. On mobile, navigation collapses into a sheet (shadcn/ui `Sheet`).
Cart badge shows item count when non-zero using the accent colour.

### Tailwind Structure
```tsx
{/* Root */}
<nav className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
  <div className="container mx-auto px-4 h-16 flex items-center justify-between">

    {/* Brand */}
    <a href="/" className="text-xl font-bold text-primary transition-smooth hover:opacity-80">
      Gorilla Guardians
    </a>

    {/* Desktop nav links */}
    <div className="hidden md:flex items-center gap-6">
      <a href="/experiences" className="text-sm font-medium text-foreground hover:text-primary transition-smooth">
        Experiences
      </a>
      <a href="/events" className="text-sm font-medium text-foreground hover:text-primary transition-smooth">
        Events
      </a>
      <a href="/dashboard" className="text-sm font-medium text-foreground hover:text-primary transition-smooth">
        Dashboard
      </a>
    </div>

    {/* Right actions */}
    <div className="flex items-center gap-3">
      {/* Language selector — see Section 6 */}
      <LanguageSelector />

      {/* Cart trigger */}
      <button className="relative p-2 rounded-md hover:bg-muted transition-smooth">
        <ShoppingCart className="h-5 w-5 text-foreground" />
        {/* Badge — only when cart has items */}
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-accent text-accent-foreground
                           text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {itemCount}
          </span>
        )}
      </button>
    </div>
  </div>
</nav>
```

---

## Section 2 — Hero (`src/components/Hero.tsx`)

### Design Intent
Full-viewport hero with a forest-green gradient overlay on a background image.
Headline and subtext left-aligned on desktop, centred on mobile.
Two CTAs: primary (Shop Now) and outlined (Learn More).

### Tailwind Structure
```tsx
{/* Hero wrapper */}
<section className="relative min-h-screen flex items-center justify-center overflow-hidden">

  {/* Background image */}
  <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
       style={{ backgroundImage: `url(${heroImage})` }} />

  {/* Gradient overlay */}
  <div className="absolute inset-0 gradient-forest opacity-80" />

  {/* Content */}
  <div className="relative z-10 container mx-auto px-4 py-24 text-center md:text-left">
    <div className="max-w-2xl">

      {/* Eyebrow badge */}
      <span className="inline-block mb-4 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold uppercase tracking-wider">
        Rwanda Handcrafts
      </span>

      {/* Main headline */}
      <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground leading-tight mb-6">
        {t('hero.title', { en: 'Authentic Crafts,\nReal Impact', fr: 'Artisanat Authentique,\nVrai Impact', rw: 'Ubuhanga Nyakuri,\nIngaruka Nyayo' })}
      </h1>

      {/* Sub-copy */}
      <p className="text-lg text-primary-foreground/85 mb-8 leading-relaxed max-w-xl">
        {t('hero.subtitle', { en: 'Support Rwandan artisans and gorilla conservation with every purchase.', fr: '...', rw: '...' })}
      </p>

      {/* CTAs */}
      <div className="flex flex-wrap gap-4">
        <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-forest transition-smooth">
          {t('hero.cta.shop', { en: 'Shop Now', fr: 'Acheter', rw: 'Gura Ubu' })}
        </Button>
        <Button size="lg" variant="outline"
                className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 transition-smooth">
          {t('hero.cta.learn', { en: 'Learn More', fr: 'En Savoir Plus', rw: 'Menya Birenzeho' })}
        </Button>
      </div>

    </div>
  </div>
</section>
```

---

## Section 3 — Product Card (`src/components/ProductCard.tsx`)

### Design Intent
Rounded card (`rounded-lg`) with a square image top, product name, price, and an
"Add to Cart" button. Hover state lifts the card with `shadow-warm`. Conservation
impact badge optional (accent pill top-right of image).

### Tailwind Structure
```tsx
<div className="group bg-card rounded-lg overflow-hidden border border-border
                transition-smooth hover:-translate-y-1 hover:shadow-warm cursor-pointer">

  {/* Image container — 1:1 aspect ratio */}
  <div className="relative aspect-square overflow-hidden bg-muted">
    <img
      src={product.image}
      alt={product.title}
      loading="lazy"
      className="w-full h-full object-cover transition-smooth group-hover:scale-105"
    />
    {/* Optional conservation badge */}
    {product.conservationTag && (
      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full
                       bg-accent text-accent-foreground text-xs font-semibold">
        {product.conservationTag}
      </span>
    )}
  </div>

  {/* Card body */}
  <div className="p-4">
    {/* Title */}
    <h3 className="text-base font-semibold text-foreground line-clamp-2 mb-1">
      {product.title}
    </h3>

    {/* Artisan / institution label */}
    <p className="text-sm text-muted-foreground mb-3">{product.vendor}</p>

    {/* Price row */}
    <div className="flex items-center justify-between">
      <span className="text-lg font-bold text-primary">
        {formatPrice(product.price)}
      </span>
      <Button
        size="sm"
        onClick={() => addToCart(product)}
        className="bg-secondary hover:bg-secondary/90 text-secondary-foreground transition-smooth">
        Add to Cart
      </Button>
    </div>
  </div>
</div>
```

---

## Section 4 — Cart Drawer (`src/components/CartDrawer.tsx`)

### Design Intent
shadcn/ui `Sheet` sliding in from the right. Header with cart title + item count.
Scrollable item list in the middle. Fixed footer with subtotal and Checkout button.
Empty state with a gorilla icon and a "Start Shopping" link.

### Tailwind Structure
```tsx
{/* Sheet content */}
<SheetContent className="flex flex-col w-full sm:max-w-md bg-card">

  {/* Header */}
  <SheetHeader className="border-b border-border pb-4">
    <SheetTitle className="text-lg font-semibold text-foreground">
      Your Cart
      {items.length > 0 && (
        <span className="ml-2 text-sm font-normal text-muted-foreground">
          ({items.length} {items.length === 1 ? 'item' : 'items'})
        </span>
      )}
    </SheetTitle>
  </SheetHeader>

  {/* Item list — scrollable */}
  <div className="flex-1 overflow-y-auto py-4 space-y-4">
    {items.length === 0 ? (
      {/* Empty state */}
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-12">
        <ShoppingCart className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">Your cart is empty.</p>
        <Button variant="outline" asChild>
          <a href="/">Start Shopping</a>
        </Button>
      </div>
    ) : (
      items.map(item => (
        <div key={item.id} className="flex gap-3 items-start">
          {/* Thumbnail */}
          <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
          </div>
          {/* Details */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground line-clamp-2">{item.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.variantTitle}</p>
            {/* Quantity + remove */}
            <div className="flex items-center gap-2 mt-2">
              <QuantityControl itemId={item.id} quantity={item.quantity} />
              <button
                onClick={() => removeItem(item.id)}
                className="text-xs text-muted-foreground hover:text-destructive transition-smooth">
                Remove
              </button>
            </div>
          </div>
          {/* Line price */}
          <p className="text-sm font-semibold text-primary flex-shrink-0">
            {formatPrice(item.price * item.quantity)}
          </p>
        </div>
      ))
    )}
  </div>

  {/* Footer */}
  {items.length > 0 && (
    <div className="border-t border-border pt-4 space-y-4">
      <div className="flex justify-between text-base font-semibold text-foreground">
        <span>Subtotal</span>
        <span className="text-primary">{formatPrice(subtotal)}</span>
      </div>
      <p className="text-xs text-muted-foreground">Shipping and taxes calculated at checkout.</p>
      <Button
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-forest transition-smooth"
        onClick={handleCheckout}>
        Checkout
      </Button>
    </div>
  )}
</SheetContent>
```

---

## Section 5 — Experience / Event Card (`src/components/ExperienceCard.tsx`)

### Design Intent
Landscape-oriented card (image left on desktop, stacked on mobile). Earth-brown
secondary accent for the category badge. Duration and price displayed inline.
Booking CTA uses the primary colour.

### Tailwind Structure
```tsx
<div className="group bg-card rounded-lg overflow-hidden border border-border
                transition-smooth hover:shadow-warm flex flex-col sm:flex-row">

  {/* Image — fixed width on desktop, full width on mobile */}
  <div className="sm:w-48 md:w-56 aspect-video sm:aspect-auto overflow-hidden bg-muted flex-shrink-0">
    <img
      src={experience.image}
      alt={experience.title}
      loading="lazy"
      className="w-full h-full object-cover transition-smooth group-hover:scale-105"
    />
  </div>

  {/* Body */}
  <div className="flex flex-col justify-between p-4 flex-1">
    <div>
      {/* Category badge */}
      <span className="inline-block mb-2 px-2 py-0.5 rounded-full bg-secondary/15 text-secondary text-xs font-semibold">
        {experience.category}
      </span>
      <h3 className="text-base font-semibold text-foreground mb-1">{experience.title}</h3>
      <p className="text-sm text-muted-foreground line-clamp-2">{experience.description}</p>
    </div>

    {/* Footer row */}
    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>⏱ {experience.duration}</span>
        <span>👥 Up to {experience.maxGuests}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-bold text-primary">{formatPrice(experience.price)}</span>
        <Button size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground transition-smooth">
          Book
        </Button>
      </div>
    </div>
  </div>
</div>
```

---

## Section 6 — Language Selector (`src/components/LanguageSelector.tsx`)

### Design Intent
Compact dropdown using shadcn/ui `DropdownMenu`. Displays the active locale as a
2–3 character code (`EN`, `FR`, `RW`). Each option shows the full native language name.

### Tailwind Structure
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="sm"
            className="text-xs font-semibold text-foreground hover:bg-muted transition-smooth gap-1">
      <Globe className="h-3.5 w-3.5" />
      {language.toUpperCase()}
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-36 bg-card border border-border shadow-warm">
    {[
      { code: 'en', label: 'English' },
      { code: 'fr', label: 'Français' },
      { code: 'rw', label: 'Kinyarwanda' },
    ].map(({ code, label }) => (
      <DropdownMenuItem
        key={code}
        onClick={() => setLanguage(code)}
        className={cn(
          'text-sm cursor-pointer transition-smooth',
          language === code
            ? 'text-primary font-semibold bg-primary/8'
            : 'text-foreground hover:bg-muted'
        )}>
        {label}
      </DropdownMenuItem>
    ))}
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Section 7 — Impact Section (`src/components/Impact.tsx`)

### Design Intent
Full-bleed section with `.gradient-earth` background. Three stat cards in a row
(or stacked on mobile) showing conservation and artisan impact metrics.
Accent-coloured large numbers for emotional impact.

### Tailwind Structure
```tsx
<section className="py-16 md:py-24 gradient-earth">
  <div className="container mx-auto px-4 text-center">

    {/* Section label */}
    <span className="inline-block mb-3 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold uppercase tracking-wider">
      Our Impact
    </span>

    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
      {t('impact.title', { en: 'Conservation Through Commerce', fr: '...', rw: '...' })}
    </h2>
    <p className="text-white/80 max-w-xl mx-auto mb-12 text-base leading-relaxed">
      {t('impact.subtitle', { en: 'Every purchase directly funds gorilla habitat protection and supports local artisans.', fr: '...', rw: '...' })}
    </p>

    {/* Stat cards */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
      {stats.map(stat => (
        <div key={stat.label}
             className="bg-white/15 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <p className="text-4xl font-bold text-accent mb-2">{stat.value}</p>
          <p className="text-sm font-medium text-white">{stat.label}</p>
          <p className="text-xs text-white/70 mt-1">{stat.description}</p>
        </div>
      ))}
    </div>

  </div>
</section>
```

---

## Section 8 — Auth Page (`src/pages/Auth.tsx`)

### Design Intent
Centred card on a `.gradient-subtle` full-page background. shadcn/ui `Tabs` for
Login / Sign Up toggle. Supabase error messages rendered inside the card using the
destructive token. No inline validation — all errors come from Supabase response.

### Tailwind Structure
```tsx
<div className="min-h-screen gradient-subtle flex items-center justify-center px-4">
  <div className="w-full max-w-sm bg-card rounded-xl border border-border shadow-warm p-6">

    {/* Brand mark */}
    <div className="text-center mb-6">
      <h1 className="text-xl font-bold text-primary">Gorilla Guardians</h1>
      <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
    </div>

    <Tabs defaultValue="login">
      <TabsList className="w-full mb-6 bg-muted">
        <TabsTrigger value="login" className="flex-1">Login</TabsTrigger>
        <TabsTrigger value="signup" className="flex-1">Sign Up</TabsTrigger>
      </TabsList>

      <TabsContent value="login">
        {/* Login form — React Hook Form + Zod */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <Label className="text-sm text-foreground">Email</Label>
            <Input type="email" placeholder="you@example.com"
                   className="border-border focus:ring-primary" />
          </div>
          <div className="space-y-1">
            <Label className="text-sm text-foreground">Password</Label>
            <Input type="password" placeholder="••••••••"
                   className="border-border focus:ring-primary" />
          </div>

          {/* Supabase error */}
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-smooth">
            Sign In
          </Button>
        </form>
      </TabsContent>

      {/* Sign Up tab — same pattern */}
    </Tabs>

  </div>
</div>
```

---

## Section 9 — Loading & Skeleton States

### Design Intent
Use Tailwind `animate-pulse` on muted-coloured placeholder blocks that mirror the
shape of the real content. Never show a blank page.

```tsx
{/* Product card skeleton */}
<div className="bg-card rounded-lg overflow-hidden border border-border animate-pulse">
  <div className="aspect-square bg-muted" />
  <div className="p-4 space-y-2">
    <div className="h-4 bg-muted rounded w-3/4" />
    <div className="h-3 bg-muted rounded w-1/2" />
    <div className="h-8 bg-muted rounded w-full mt-4" />
  </div>
</div>

{/* Experience card skeleton */}
<div className="bg-card rounded-lg border border-border animate-pulse flex gap-3 p-4">
  <div className="w-48 h-32 bg-muted rounded-md flex-shrink-0" />
  <div className="flex-1 space-y-2 py-1">
    <div className="h-4 bg-muted rounded w-1/4" />
    <div className="h-5 bg-muted rounded w-3/4" />
    <div className="h-3 bg-muted rounded w-full" />
    <div className="h-3 bg-muted rounded w-2/3" />
  </div>
</div>
```

---

## Section 10 — Responsive Breakpoints

| Breakpoint | Tailwind Prefix | Value | Usage |
|------------|----------------|-------|-------|
| Mobile | (none) | `< 640px` | Single column, stacked cards, collapsed nav |
| Small | `sm:` | `≥ 640px` | Two-column grids, experience card landscape |
| Medium | `md:` | `≥ 768px` | Three-column product grid, full desktop nav |
| Large | `lg:` | `≥ 1024px` | Max container width active |
| 2XL | `2xl:` | `≤ 1400px` | Container max-width (from `tailwind.config.ts`) |

Container padding: `px-4` on mobile, `px-6 md:px-8` on larger screens.
Always use `container mx-auto` from Tailwind config for centred page content.

---

## Implementation Checklist

Before implementing any new component or page:

1. **Colors**: Use only the tokens listed in the palette table above. No raw hex or `rgb()`.
2. **Spacing**: Use Tailwind spacing scale (`p-4`, `gap-6`, etc.) — no arbitrary `px` values unless unavoidable.
3. **Typography**: Follow the typography conventions table. No `text-[17px]` arbitrary sizes.
4. **Dark mode**: All token-based classes automatically support dark mode via `.dark` selector in `index.css`. Test both modes.
5. **i18n**: Every user-facing string must go through `t(key, { en, fr, rw })`. No hardcoded English strings in JSX.
6. **Images**: All `<img>` tags must have `alt` text and `loading="lazy"` for off-screen images.
7. **Accessibility**: Use semantic HTML elements (`<nav>`, `<main>`, `<section>`, `<button>`). shadcn/ui components handle ARIA attributes — do not override them without reason.
8. **Animations**: Only use `.transition-smooth` or Tailwind `transition-*` — no custom CSS keyframes unless listed in `index.css`.
