import { useState } from "react";
import { useRoute, Link } from "wouter";
import { Star, ShoppingCart, Heart, ArrowLeft, Minus, Plus, MapPin, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetProduct, useListReviews, useListProducts, useAddToWishlist, getGetProductQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCart } from "@/lib/cart";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";

export default function ProductDetailPage() {
  const [, params] = useRoute("/products/:id");
  const id = Number(params?.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useGetProduct(id, { query: { enabled: !!id, queryKey: getGetProductQueryKey(id) } });
  const { data: reviews } = useListReviews({ productId: id, status: "approved" });
  const { data: relatedData } = useListProducts({ categoryId: (product as any)?.categoryId, limit: 4 });

  const { addToCart: addToCartLocal } = useCart();
  const addToWishlist = useAddToWishlist();

  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);

  const reviewList = Array.isArray(reviews) ? reviews : [];
  const relatedProducts = relatedData?.products?.filter((p: any) => p.id !== id).slice(0, 4) ?? [];

  const handleAddToCart = () => {
    const p = resolvedProduct;
    if (!p) return;
    addToCartLocal(p, qty);
    toast({ title: "Added to cart", description: `${qty}x ${p.name} added to your cart.` });
  };

  const handleWishlist = () => {
    setWishlisted(!wishlisted);
    if (!wishlisted) {
      addToWishlist.mutate({ data: { productId: id } }, {
        onSuccess: () => toast({ title: "Added to wishlist" }),
      });
    }
  };

  const DEMO_PRODUCTS: Record<number, any> = {
    1: { id: 1, name: "Imigongo Triangle Panel", price: 125, discountPrice: null, description: "A stunning hand-painted Imigongo geometric panel crafted using centuries-old techniques with natural earth pigments. Each triangle is painted individually, creating a mesmerizing pattern unique to Rwanda.", culturalSignificance: "Imigongo art originated in eastern Rwanda and is one of the oldest art forms on the continent. The geometric patterns carry meaning about community, harmony, and the natural world.", materials: "Natural earth pigments, cow dung (traditional medium), wood panel", images: [], artisan: { id: 3, name: "Alphonsine Umubyeyi", biography: "Award-winning Imigongo artist with 30 years of experience." }, averageRating: 4.9, stock: 5, featured: true },
    2: { id: 2, name: "Peace Basket — Sunrise", price: 85, discountPrice: 70, description: "A beautifully woven Agaseke peace basket inspired by the colors of a Rwandan sunrise. Handcrafted using natural sisal and sweet grass with traditional weaving techniques passed down through generations.", culturalSignificance: "The Agaseke basket is Rwanda's national symbol of peace and prosperity. Traditionally given as gifts at weddings and to honored guests, each pattern tells a story.", materials: "Natural sisal, sweet grass, natural dyes", images: [], artisan: { id: 1, name: "Celestine Mukamana", biography: "Master basket weaver and conservation ambassador from Musanze." }, averageRating: 5.0, stock: 12, featured: true },
    3: { id: 3, name: "Gorilla Family Sculpture", price: 280, discountPrice: null, description: "A deeply moving hand-carved sculpture depicting a gorilla family group — mother, father, and infant — in a moment of tender connection. Carved from a single piece of sustainably sourced Mutondo wood.", culturalSignificance: "Mountain gorillas are the soul of Volcanoes National Park. This sculpture honors the gorillas that the Gorilla Guardians community has pledged to protect.", materials: "Sustainably sourced Mutondo wood, natural beeswax finish", images: [], artisan: { id: 2, name: "Emmanuel Nkurunziza", biography: "Third-generation woodcarver who learned his craft from his grandfather." }, averageRating: 4.8, stock: 3, featured: false },
    4: { id: 4, name: "Beaded Necklace", price: 45, discountPrice: 35, description: "A vibrant hand-beaded necklace featuring traditional Rwandan patterns in rich earth tones and bright accent colors. Each bead is hand-strung and knotted individually for durability and beauty.", culturalSignificance: "Beadwork has been worn by Rwandan women for centuries as a symbol of beauty, status, and cultural identity. The patterns carry encoded messages of love and community.", materials: "Glass seed beads, waxed cotton thread, brass clasp", images: [], artisan: { id: 1, name: "Celestine Mukamana", biography: "Master basket weaver and conservation ambassador from Musanze." }, averageRating: 4.7, stock: 20, featured: false },
  };

  const resolvedProduct = (product as any) ?? DEMO_PRODUCTS[id] ?? null;

  if (isLoading && !resolvedProduct) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-2 gap-12 animate-pulse">
            <div className="aspect-square bg-muted rounded-xl" />
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded w-1/4" />
              <div className="h-10 bg-muted rounded w-3/4" />
              <div className="h-8 bg-muted rounded w-1/4" />
              <div className="h-20 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!resolvedProduct) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-24 text-center">
          <h2 className="font-serif text-2xl font-bold mb-4">Product not found</h2>
          <Link href="/products"><Button>Back to Shop</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const p = resolvedProduct;
  const images = p.images?.length > 0 ? p.images : [null];
  const avgRating = reviewList.length > 0 ? reviewList.reduce((s: number, r: any) => s + r.rating, 0) / reviewList.length : p.averageRating ?? null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-primary">Shop</Link>
          <span>/</span>
          <span className="text-foreground">{p.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Images */}
          <div>
            <div className="aspect-square bg-muted rounded-2xl overflow-hidden mb-4 relative">
              {images[selectedImage] ? (
                <img src={images[selectedImage]} alt={p.name} className="w-full h-full object-cover" data-testid="img-product-main" />
              ) : (
                <div className="w-full h-full flex items-center justify-center imigongo-pattern">
                  <div className="text-center">
                    <Package className="w-16 h-16 text-primary/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Handcrafted in Rwanda</p>
                  </div>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img: string | null, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 ${i === selectedImage ? "border-primary" : "border-border"}`}
                    data-testid={`button-image-thumb-${i}`}
                  >
                    {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-muted" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              {p.category && <Badge variant="outline">{p.category.name}</Badge>}
              {p.featured && <Badge className="bg-accent text-accent-foreground">Featured</Badge>}
              {p.stock < 5 && p.stock > 0 && <Badge className="bg-orange-500 text-white">Only {p.stock} left</Badge>}
              {p.stock === 0 && <Badge variant="destructive">Out of stock</Badge>}
            </div>

            <h1 className="font-serif text-3xl font-bold mb-2" data-testid="text-product-name">{p.name}</h1>

            {/* Artisan link */}
            {p.artisan && (
              <Link href={`/artisans/${p.artisan.id}`} className="flex items-center gap-2 mb-4 group">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                  {p.artisan.name.charAt(0)}
                </div>
                <span className="text-sm text-muted-foreground group-hover:text-primary">by {p.artisan.name}</span>
              </Link>
            )}

            {/* Rating */}
            {avgRating && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">{avgRating.toFixed(1)} ({reviewList.length} reviews)</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-primary" data-testid="text-product-price">
                ${p.discountPrice ?? p.price}
              </span>
              {p.discountPrice && (
                <span className="text-lg text-muted-foreground line-through">${p.price}</span>
              )}
            </div>

            <p className="text-muted-foreground leading-relaxed mb-6">{p.description}</p>

            {/* Cultural significance */}
            {p.culturalSignificance && (
              <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-sm text-primary mb-1">Cultural Significance</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.culturalSignificance}</p>
              </div>
            )}

            {/* Quantity + Actions */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center border border-border rounded-lg">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="px-3 py-2 hover:bg-muted transition-colors"
                  data-testid="button-qty-minus"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 font-medium min-w-12 text-center" data-testid="text-qty">{qty}</span>
                <button
                  onClick={() => setQty(q => Math.min(p.stock || 99, q + 1))}
                  className="px-3 py-2 hover:bg-muted transition-colors"
                  data-testid="button-qty-plus"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                onClick={handleAddToCart}
                disabled={p.stock === 0}
                data-testid="button-add-to-cart"
              >
                <ShoppingCart className="w-4 h-4" />
                {p.stock === 0 ? "Out of Stock" : "Add to Cart"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleWishlist}
                className={wishlisted ? "border-destructive text-destructive" : ""}
                data-testid="button-wishlist"
              >
                <Heart className={`w-4 h-4 ${wishlisted ? "fill-destructive text-destructive" : ""}`} />
              </Button>
            </div>

            {/* Shipping info */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Truck className="w-4 h-4 text-primary" />
                <span>Ships worldwide in 7–14 days</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Made in Musanze, Rwanda</span>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 text-sm">
              {p.materials && (
                <div className="flex gap-2"><span className="text-muted-foreground w-24">Materials:</span><span>{p.materials}</span></div>
              )}
              {p.dimensions && (
                <div className="flex gap-2"><span className="text-muted-foreground w-24">Dimensions:</span><span>{p.dimensions}</span></div>
              )}
              {p.weight && (
                <div className="flex gap-2"><span className="text-muted-foreground w-24">Weight:</span><span>{p.weight} kg</span></div>
              )}
              {p.sku && (
                <div className="flex gap-2"><span className="text-muted-foreground w-24">SKU:</span><span className="font-mono text-xs">{p.sku}</span></div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs: Reviews / Artisan */}
        <div className="mt-16">
          <Tabs defaultValue="reviews">
            <TabsList>
              <TabsTrigger value="reviews">Reviews ({reviewList.length})</TabsTrigger>
              <TabsTrigger value="artisan">About the Artisan</TabsTrigger>
              <TabsTrigger value="shipping">Shipping & Returns</TabsTrigger>
            </TabsList>
            <TabsContent value="reviews" className="mt-6">
              {reviewList.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No reviews yet. Be the first to review this product!</p>
              ) : (
                <div className="space-y-4">
                  {reviewList.map((review: any) => (
                    <Card key={review.id} className="border-border" data-testid={`card-review-${review.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-semibold text-sm">{review.user?.name ?? "Verified Customer"}</div>
                            <div className="flex items-center gap-1 mt-1">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                              ))}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</div>
                        </div>
                        {review.title && <p className="font-medium text-sm mb-1">{review.title}</p>}
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                        {review.isVerifiedPurchase && (
                          <Badge variant="outline" className="mt-2 text-xs text-green-600 border-green-300">Verified Purchase</Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="artisan" className="mt-6">
              {(product as any)?.artisan ? (
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
                    {(product as any).artisan.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold mb-2">{(product as any).artisan.name}</h3>
                    <p className="text-muted-foreground mb-4">{(product as any).artisan.biography}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(product as any).artisan.skills?.map((skill: string) => (
                        <Badge key={skill} variant="secondary" className="capitalize">{skill}</Badge>
                      ))}
                    </div>
                    <Link href={`/artisans/${(product as any).artisan.id}`}>
                      <Button variant="outline" className="border-primary text-primary">View Full Profile</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Artisan information not available.</p>
              )}
            </TabsContent>
            <TabsContent value="shipping" className="mt-6">
              <div className="max-w-2xl space-y-4 text-sm text-muted-foreground">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Shipping</h4>
                  <p>All products are shipped from Musanze, Rwanda. Standard international shipping takes 7–14 business days. Express shipping (3–5 days) is available at checkout.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Returns</h4>
                  <p>We accept returns within 30 days of delivery for items in their original condition. Handmade items may have natural variations — this is part of their beauty and authenticity.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Customs & Duties</h4>
                  <p>International orders may be subject to import duties and taxes, which are the responsibility of the buyer. We ship all items with accurate customs declarations.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="font-serif text-2xl font-bold mb-6">You Might Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {relatedProducts.map((rp: any) => (
                <Link key={rp.id} href={`/products/${rp.id}`}>
                  <Card className="group hover:shadow-md transition-all cursor-pointer" data-testid={`card-related-${rp.id}`}>
                    <div className="aspect-square bg-muted overflow-hidden rounded-t-lg">
                      {rp.images?.[0] ? (
                        <img src={rp.images[0]} alt={rp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full imigongo-pattern" />
                      )}
                    </div>
                    <CardContent className="p-3">
                      <p className="text-xs font-medium line-clamp-2 mb-1 group-hover:text-primary transition-colors">{rp.name}</p>
                      <p className="text-xs font-bold text-primary">${rp.discountPrice ?? rp.price}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
