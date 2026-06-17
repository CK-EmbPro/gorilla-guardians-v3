import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { Star, ShoppingCart, Heart, ArrowLeft, Minus, Plus, MapPin, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetProduct, useListReviews, useListProducts, useAddToWishlist, useCreateReview, getGetProductQueryKey, getListReviewsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCart } from "@/lib/cart";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Textarea } from "@/components/ui/textarea";
import { Link as WouterLink } from "wouter";
import { trackEvent } from "@/lib/trackEvent";

export default function ProductDetailPage() {
  const [, params] = useRoute("/products/:id");
  const id = Number(params?.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (id) trackEvent("view_product", id);
  }, [id]);

  const { data: product, isLoading } = useGetProduct(id, { query: { enabled: !!id, queryKey: getGetProductQueryKey(id) } });
  const { data: reviews } = useListReviews({ productId: id, status: "approved" });
  const { data: relatedData } = useListProducts({ categoryId: (product as any)?.categoryId, limit: 4 });

  const { addToCart: addToCartLocal } = useCart();
  const addToWishlist = useAddToWishlist();

  const { user } = useAuth();
  const createReview = useCreateReview();

  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewHover, setReviewHover] = useState(0);

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

  const handleSubmitReview = () => {
    if (!reviewComment.trim()) { toast({ title: "Please write a comment", variant: "destructive" }); return; }
    createReview.mutate({ data: { productId: id, rating: reviewRating, title: reviewTitle || undefined, comment: reviewComment } }, {
      onSuccess: () => {
        setReviewSubmitted(true);
        setReviewComment("");
        setReviewTitle("");
        queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey() });
      },
      onError: () => toast({ title: "Failed to submit review", variant: "destructive" }),
    });
  };

  const resolvedProduct = (product as any) ?? null;

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

              {/* Write a Review */}
              <div className="mt-10 border-t border-border pt-8">
                <h3 className="font-serif text-xl font-bold mb-5">Write a Review</h3>
                {!user ? (
                  <div className="bg-muted/40 rounded-xl p-6 text-center">
                    <p className="text-muted-foreground mb-3">Please log in to share your experience with this product.</p>
                    <WouterLink href="/login">
                      <Button variant="outline" className="border-primary text-primary">Log In to Review</Button>
                    </WouterLink>
                  </div>
                ) : reviewSubmitted ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                    <div className="text-2xl mb-2">✓</div>
                    <p className="font-semibold text-green-800">Review submitted!</p>
                    <p className="text-sm text-green-700 mt-1">Your review is pending moderation and will appear once approved.</p>
                    <button onClick={() => setReviewSubmitted(false)} className="mt-3 text-sm text-green-700 underline underline-offset-2">Write another</button>
                  </div>
                ) : (
                  <Card className="border-border">
                    <CardContent className="p-5 space-y-4">
                      <div>
                        <label className="text-sm font-medium block mb-2">Your Rating</label>
                        <div className="flex gap-1">
                          {[1,2,3,4,5].map(s => (
                            <button
                              key={s}
                              onClick={() => setReviewRating(s)}
                              onMouseEnter={() => setReviewHover(s)}
                              onMouseLeave={() => setReviewHover(0)}
                              className="p-0.5"
                              data-testid={`star-${s}`}
                            >
                              <Star className={`w-7 h-7 transition-colors ${s <= (reviewHover || reviewRating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                            </button>
                          ))}
                          <span className="ml-2 text-sm text-muted-foreground self-center">{["","Poor","Fair","Good","Great","Excellent"][reviewHover || reviewRating]}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1">Review Title <span className="text-muted-foreground font-normal">(optional)</span></label>
                        <input
                          type="text"
                          value={reviewTitle}
                          onChange={e => setReviewTitle(e.target.value)}
                          placeholder="Summarize your experience..."
                          className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          data-testid="input-review-title"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1">Your Review</label>
                        <Textarea
                          value={reviewComment}
                          onChange={e => setReviewComment(e.target.value)}
                          placeholder="Tell others about your experience with this product. What did you love? How is the quality?"
                          rows={4}
                          data-testid="textarea-review-comment"
                        />
                      </div>
                      <Button
                        onClick={handleSubmitReview}
                        disabled={createReview.isPending || !reviewComment.trim()}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        data-testid="button-submit-review"
                      >
                        {createReview.isPending ? "Submitting..." : "Submit Review"}
                      </Button>
                      <p className="text-xs text-muted-foreground">Reviews are reviewed by our team before appearing publicly.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
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
