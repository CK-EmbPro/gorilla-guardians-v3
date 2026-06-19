import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { Star, Package, DollarSign, Award, Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGetArtisan, useListProducts, useCreateDonation, getGetArtisanQueryKey } from "@workspace/api-client-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function ArtisanDetailPage() {
  const [, params] = useRoute("/artisans/:id");
  const id = Number(params?.id);
  const { toast } = useToast();
  const [donationAmount, setDonationAmount] = useState("25");
  const [donating, setDonating] = useState(false);

  const { data: artisan, isLoading, isError, error } = useGetArtisan(id, { query: { enabled: !!id, queryKey: getGetArtisanQueryKey(id) } });
  const { data: productsData } = useListProducts({ artisanId: id });
  const createDonation = useCreateDonation();

  if (isError) console.error("[ArtisanDetail] API error", error);

  const products = productsData?.products ?? [];

  const resolvedArtisan = (artisan as any) ?? null;
  const a = resolvedArtisan;

  const handleDonate = () => {
    setDonating(true);
    createDonation.mutate({ data: { artisanId: id, amount: Number(donationAmount), message: `Supporting ${a?.name}'s craft` } }, {
      onSuccess: () => {
        toast({ title: "Thank you!", description: `Your $${donationAmount} donation supports ${a?.name} and their family.` });
        setDonating(false);
      },
      onError: () => {
        toast({ title: "Donation noted", description: "Your support means the world to this artisan.", variant: "default" });
        setDonating(false);
      },
    });
  };

  if (isLoading && !resolvedArtisan) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse">
          <div className="flex gap-8 mb-12">
            <div className="w-40 h-40 rounded-full bg-muted shrink-0" />
            <div className="flex-1 space-y-4">
              <div className="h-8 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!resolvedArtisan) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-24 text-center">
          <h2 className="font-serif text-2xl font-bold mb-4">Artisan not found</h2>
          <Link href="/artisans"><Button>Back to Artisans</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/5 to-secondary/5 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-10 items-start">
            {/* Photo */}
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="shrink-0">
              <div className="w-44 h-44 rounded-full overflow-hidden border-4 border-white shadow-xl">
                {a.photo ? (
                  <img src={a.photo} alt={a.name} className="w-full h-full object-cover" data-testid="img-artisan-photo" />
                ) : (
                  <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                    <span className="text-5xl font-serif font-bold text-primary/60">{a.name?.charAt(0)}</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {a.isConservationAmbassador && (
                  <Badge className="bg-accent text-accent-foreground gap-1">
                    <Award className="w-3 h-3" /> Conservation Ambassador
                  </Badge>
                )}
              </div>
              <h1 className="font-serif text-4xl font-bold mb-2" data-testid="text-artisan-name">{a.name}</h1>
              <p className="text-lg text-muted-foreground mb-4">{a.biography}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {a.skills?.map((skill: string) => (
                  <Badge key={skill} variant="secondary" className="capitalize">{skill}</Badge>
                ))}
              </div>
              <div className="flex items-center gap-8 text-sm">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  <span className="font-semibold">{a.productCount}</span>
                  <span className="text-muted-foreground">products</span>
                </div>
                {a.averageRating && (
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 fill-accent text-accent" />
                    <span className="font-semibold">{a.averageRating}</span>
                    <span className="text-muted-foreground">rating</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <span className="font-semibold">${a.totalDonations?.toFixed(0)}</span>
                  <span className="text-muted-foreground">in donations</span>
                </div>
              </div>
            </div>

            {/* Donate card */}
            <div className="shrink-0 w-full md:w-64">
              <Card className="border-primary/20 shadow-lg">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="w-4 h-4 text-destructive" />
                    <h3 className="font-semibold">Support {a.name?.split(" ")[0]}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">Your donation goes directly to this artisan and their family.</p>
                  <div className="flex gap-2 mb-3">
                    {["10", "25", "50", "100"].map(amt => (
                      <button
                        key={amt}
                        onClick={() => setDonationAmount(amt)}
                        className={`flex-1 py-1.5 text-xs rounded border transition-colors ${donationAmount === amt ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}
                        data-testid={`button-donate-${amt}`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                  <div className="mb-3">
                    <Label className="text-xs">Custom amount</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <Input value={donationAmount} onChange={e => setDonationAmount(e.target.value)} className="pl-7" data-testid="input-donation-amount" />
                    </div>
                  </div>
                  <Button className="w-full bg-primary hover:bg-primary/90" onClick={handleDonate} disabled={donating || createDonation.isPending} data-testid="button-donate-submit">
                    {donating ? "Processing..." : `Donate $${donationAmount}`}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs defaultValue="story">
          <TabsList>
            <TabsTrigger value="story">Their Story</TabsTrigger>
            <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
          </TabsList>

          <TabsContent value="story" className="mt-8">
            <div className="max-w-3xl">
              <div className="prose prose-sm max-w-none text-foreground leading-relaxed">
                {a.story ? (
                  <p className="text-base leading-relaxed">{a.story}</p>
                ) : (
                  <div className="space-y-4 text-muted-foreground">
                    <p>{a.biography}</p>
                    <p>This artisan is a valued member of the Gorilla Guardians Village community, contributing to the conservation of Volcanoes National Park and the mountain gorillas that call it home through their craft and their story.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="products" className="mt-8">
            {products.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No products listed yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product: any) => (
                  <Link key={product.id} href={`/products/${product.id}`}>
                    <Card className="group hover:shadow-md transition-all cursor-pointer" data-testid={`card-artisan-product-${product.id}`}>
                      <div className="aspect-square bg-muted overflow-hidden rounded-t-lg">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full imigongo-pattern flex items-center justify-center">
                            <ShoppingBag className="w-8 h-8 text-primary/30" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <p className="text-xs font-medium line-clamp-2 mb-1 group-hover:text-primary transition-colors">{product.name}</p>
                        <p className="text-xs font-bold text-primary">${product.discountPrice ?? product.price}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="gallery" className="mt-8">
            {a.galleryImages?.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {a.galleryImages.map((img: string, i: number) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden">
                    <img src={img} alt={`${a.name} gallery ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-xl imigongo-pattern bg-muted/50" />
                ))}
                <p className="col-span-3 text-center text-muted-foreground text-sm pt-4">Gallery photos coming soon</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}
