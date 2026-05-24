import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Search, Filter, Star, Heart, ShoppingCart, Grid3X3, List, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { useCart } from "@/lib/cart";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";

export default function ProductsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);

  const { data: categories } = useListCategories();
  const { data: productsData, isLoading } = useListProducts({
    search: search || undefined,
    categoryId: categoryId !== "all" ? Number(categoryId) : undefined,
    minPrice: priceRange[0] || undefined,
    maxPrice: priceRange[1] < 500 ? priceRange[1] : undefined,
    page,
    limit: 12,
  });

  const { addToCart } = useCart();

  const DEMO_PRODUCTS = [
    { id: 1, name: "Imigongo Triangle Panel", price: 125, discountPrice: null, images: [], artisan: { name: "Alphonsine Umubyeyi" }, averageRating: 4.9, reviewCount: 23, stock: 5, featured: true },
    { id: 2, name: "Peace Basket — Sunrise", price: 85, discountPrice: 70, images: [], artisan: { name: "Celestine Mukamana" }, averageRating: 5.0, reviewCount: 41, stock: 12, featured: true },
    { id: 3, name: "Gorilla Family Sculpture", price: 280, discountPrice: null, images: [], artisan: { name: "Emmanuel Nkurunziza" }, averageRating: 4.8, reviewCount: 15, stock: 3, featured: false },
    { id: 4, name: "Beaded Necklace", price: 45, discountPrice: 35, images: [], artisan: { name: "Celestine Mukamana" }, averageRating: 4.7, reviewCount: 38, stock: 20, featured: false },
  ];

  const apiProducts = productsData?.products ?? [];
  const products = apiProducts.length > 0 ? apiProducts : DEMO_PRODUCTS;
  const total = products.length;
  const totalPages = productsData?.totalPages ?? 1;
  const catList = Array.isArray(categories) ? categories : [];

  const handleAddToCart = (product: any) => {
    addToCart(product, 1);
    toast({ title: "Added to cart", description: `${product.name} added to your cart.` });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-bold mb-2">Rwandan Handcrafts</h1>
          <p className="text-muted-foreground">Every piece handmade by artisans in Musanze, Rwanda — each purchase supports a family.</p>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
              data-testid="input-search-products"
            />
          </div>

          <Select value={categoryId} onValueChange={v => { setCategoryId(v); setPage(1); }}>
            <SelectTrigger className="w-44" data-testid="select-category">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {catList.map((cat: any) => (
                <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40" data-testid="select-sort">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="rating">Top Rated</SelectItem>
            </SelectContent>
          </Select>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2" data-testid="button-filters">
                <SlidersHorizontal className="w-4 h-4" /> Filters
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="py-6 space-y-6">
                <div>
                  <label className="text-sm font-medium mb-4 block">Price Range: ${priceRange[0]} — ${priceRange[1]}</label>
                  <Slider
                    value={priceRange}
                    onValueChange={v => setPriceRange(v)}
                    min={0}
                    max={500}
                    step={10}
                    className="mt-2"
                  />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex border border-border rounded-md overflow-hidden">
            <Button
              variant={view === "grid" ? "default" : "ghost"}
              size="icon"
              className="rounded-none h-9 w-9"
              onClick={() => setView("grid")}
              data-testid="button-view-grid"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={view === "list" ? "default" : "ghost"}
              size="icon"
              className="rounded-none h-9 w-9"
              onClick={() => setView("list")}
              data-testid="button-view-list"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Results count */}
        <div className="text-sm text-muted-foreground mb-6">
          {total > 0 ? `Showing ${products.length} of ${total} products` : "No products found"}
        </div>

        {/* Product grid */}
        {isLoading && products.length === 0 ? (
          <div className={`grid gap-6 ${view === "grid" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"}`}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-square bg-muted" />
                <CardContent className="p-4 space-y-2">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className={`grid gap-6 ${view === "grid" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"}`}>
            {products.map((product: any, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                data-testid={`card-product-${product.id}`}
              >
                {view === "grid" ? (
                  <Card className="group hover:shadow-lg transition-all overflow-hidden border-border">
                    <Link href={`/products/${product.id}`} className="block">
                      <div className="aspect-square bg-muted relative overflow-hidden">
                        {product.images?.length > 0 ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center imigongo-pattern">
                            <ShoppingCart className="w-10 h-10 text-primary/30" />
                          </div>
                        )}
                        {product.discountPrice && (
                          <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs">Sale</Badge>
                        )}
                        {product.stock < 5 && product.stock > 0 && (
                          <Badge className="absolute top-2 right-2 bg-orange-500 text-white text-xs">Only {product.stock} left</Badge>
                        )}
                      </div>
                    </Link>
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground mb-0.5">{product.artisan?.name}</p>
                      <Link href={`/products/${product.id}`}>
                        <h3 className="font-medium text-sm leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">{product.name}</h3>
                      </Link>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          {product.discountPrice ? (
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-bold text-primary" data-testid={`text-price-${product.id}`}>${product.discountPrice}</span>
                              <span className="text-xs text-muted-foreground line-through">${product.price}</span>
                            </div>
                          ) : (
                            <span className="font-bold text-primary" data-testid={`text-price-${product.id}`}>${product.price}</span>
                          )}
                        </div>
                        {product.averageRating && (
                          <div className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-accent text-accent" />
                            <span className="text-xs text-muted-foreground">{product.averageRating}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-8"
                        onClick={() => handleAddToCart(product)}
                        data-testid={`button-add-cart-${product.id}`}
                      >
                        <ShoppingCart className="w-3 h-3 mr-1" /> Add to Cart
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="hover:shadow-md transition-all overflow-hidden border-border">
                    <div className="flex gap-4 p-4">
                      <Link href={`/products/${product.id}`} className="shrink-0">
                        <div className="w-28 h-28 bg-muted rounded-lg overflow-hidden">
                          {product.images?.length > 0 ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center imigongo-pattern" />
                          )}
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">{product.artisan?.name}</p>
                        <Link href={`/products/${product.id}`}>
                          <h3 className="font-semibold hover:text-primary transition-colors">{product.name}</h3>
                        </Link>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{product.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="font-bold text-primary" data-testid={`text-price-list-${product.id}`}>${product.discountPrice ?? product.price}</span>
                          {product.averageRating && (
                            <div className="flex items-center gap-0.5">
                              <Star className="w-3.5 h-3.5 fill-accent text-accent" />
                              <span className="text-xs">{product.averageRating} ({product.reviewCount})</span>
                            </div>
                          )}
                          <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs" onClick={() => handleAddToCart(product)} data-testid={`button-add-cart-list-${product.id}`}>
                            Add to Cart
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)} data-testid="button-prev-page">Previous</Button>
            <span className="flex items-center px-4 text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} data-testid="button-next-page">Next</Button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
