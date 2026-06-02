import { useState, useEffect } from "react";
import { Save, Globe, Image, Star, TreePine, Users, Calendar, Type, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useListProducts, useUpdateProduct, useListArtisans, useListExperiences, useListEvents, getListProductsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

async function fetchHomepage() {
  const res = await fetch(`${BASE}/api/homepage`, { credentials: "include" });
  return res.json();
}

async function saveSection(key: string, content: any) {
  const res = await fetch(`${BASE}/api/homepage/${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ content }),
  });
  return res.json();
}

export default function AdminHomepagePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sections, setSections] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const { data: productsData } = useListProducts({ limit: 50 });
  const { data: artisansData } = useListArtisans({ limit: 50 });
  const { data: experiencesData } = useListExperiences({ limit: 20 });
  const { data: eventsData } = useListEvents({});
  const updateProduct = useUpdateProduct();

  const products = productsData?.products ?? [];
  const artisans = Array.isArray(artisansData) ? artisansData : [];
  const experiences = experiencesData?.experiences ?? [];
  const events = Array.isArray(eventsData) ? eventsData : [];

  useEffect(() => {
    fetchHomepage().then(data => { setSections(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const updateSectionField = (key: string, field: string, value: any) => {
    setSections(prev => ({
      ...prev,
      [key]: { ...prev[key], content: { ...(prev[key]?.content ?? {}), [field]: value } },
    }));
  };

  const handleSave = async (key: string) => {
    setSaving(key);
    try {
      await saveSection(key, sections[key]?.content ?? {});
      toast({ title: "Saved!", description: `${key.replace(/_/g, " ")} section updated.` });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const toggleFeaturedProduct = (productId: number, current: boolean) => {
    updateProduct.mutate({ id: productId, data: { featured: !current } as any }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        toast({ title: !current ? "Product featured" : "Product unfeatured" });
      },
    });
  };

  const toggleFeaturedIds = (sectionKey: string, id: number) => {
    const current: number[] = sections[sectionKey]?.content?.featuredIds ?? [];
    const updated = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    setSections(prev => ({
      ...prev,
      [sectionKey]: { ...prev[sectionKey], content: { ...(prev[sectionKey]?.content ?? {}), featuredIds: updated } },
    }));
  };

  const hero = sections.hero?.content ?? {};
  const aboutVillage = sections.about_village?.content ?? {};
  const featuredExps = sections.featured_experiences?.content ?? {};
  const featuredArtisans = sections.featured_artisans?.content ?? {};
  const featuredEvents = sections.featured_events?.content ?? {};
  const gallery = sections.gallery?.content ?? {};

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <DashboardSidebar />
        <main className="flex-1 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <h1 className="font-serif text-2xl font-bold">Homepage Content</h1>
            <p className="text-sm text-muted-foreground">Changes are saved immediately and appear live on the homepage.</p>
          </div>

          <Tabs defaultValue="hero">
            <TabsList className="flex-wrap h-auto gap-1 mb-6">
              <TabsTrigger value="hero" className="gap-1.5"><Globe className="w-3.5 h-3.5" />Hero</TabsTrigger>
              <TabsTrigger value="products" className="gap-1.5"><Star className="w-3.5 h-3.5" />Products</TabsTrigger>
              <TabsTrigger value="experiences" className="gap-1.5"><TreePine className="w-3.5 h-3.5" />Experiences</TabsTrigger>
              <TabsTrigger value="artisans" className="gap-1.5"><Users className="w-3.5 h-3.5" />Artisans</TabsTrigger>
              <TabsTrigger value="events" className="gap-1.5"><Calendar className="w-3.5 h-3.5" />Events</TabsTrigger>
              <TabsTrigger value="text" className="gap-1.5"><Type className="w-3.5 h-3.5" />Text</TabsTrigger>
              <TabsTrigger value="gallery" className="gap-1.5"><Image className="w-3.5 h-3.5" />Gallery</TabsTrigger>
            </TabsList>

            {/* HERO */}
            <TabsContent value="hero">
              <Card className="border-border">
                <CardHeader><CardTitle className="text-base">Hero Banner</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm">Heading</Label>
                    <Input value={hero.heading ?? ""} onChange={e => updateSectionField("hero", "heading", e.target.value)} className="mt-1" placeholder="Handmade in Rwanda, With Love" />
                  </div>
                  <div>
                    <Label className="text-sm">Subheading</Label>
                    <Textarea value={hero.subheading ?? ""} onChange={e => updateSectionField("hero", "subheading", e.target.value)} className="mt-1" rows={2} placeholder="Every purchase protects mountain gorillas..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Button Text</Label>
                      <Input value={hero.buttonText ?? ""} onChange={e => updateSectionField("hero", "buttonText", e.target.value)} className="mt-1" placeholder="Shop Now" />
                    </div>
                    <div>
                      <Label className="text-sm">Button Link</Label>
                      <Input value={hero.buttonLink ?? ""} onChange={e => updateSectionField("hero", "buttonLink", e.target.value)} className="mt-1" placeholder="/products" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm">Background Image URL</Label>
                    <Input value={hero.backgroundImage ?? ""} onChange={e => updateSectionField("hero", "backgroundImage", e.target.value || null)} className="mt-1" placeholder="https://..." />
                  </div>
                  <Button onClick={() => handleSave("hero")} disabled={saving === "hero"} className="gap-2">
                    <Save className="w-4 h-4" /> {saving === "hero" ? "Saving..." : "Save Hero"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* FEATURED PRODUCTS */}
            <TabsContent value="products">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base">Featured Products</CardTitle>
                  <p className="text-xs text-muted-foreground">Toggle which products appear in the featured section on the homepage.</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {products.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                        <div>
                          <div className="text-sm font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground">${p.price} · {p.category?.name ?? "Uncategorized"} · Stock: {p.stock}</div>
                        </div>
                        <button
                          onClick={() => toggleFeaturedProduct(p.id, p.featured)}
                          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors border ${p.featured ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"}`}
                          data-testid={`toggle-featured-${p.id}`}
                        >
                          {p.featured ? "★ Featured" : "Feature"}
                        </button>
                      </div>
                    ))}
                    {products.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No products found.</p>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* FEATURED EXPERIENCES */}
            <TabsContent value="experiences">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base">Featured Experiences</CardTitle>
                  <p className="text-xs text-muted-foreground">Select experiences to highlight on the homepage.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Section Title</Label>
                      <Input value={featuredExps.title ?? ""} onChange={e => updateSectionField("featured_experiences", "title", e.target.value)} className="mt-1" placeholder="Immersive Experiences" />
                    </div>
                    <div>
                      <Label className="text-sm">Subtitle</Label>
                      <Input value={featuredExps.subtitle ?? ""} onChange={e => updateSectionField("featured_experiences", "subtitle", e.target.value)} className="mt-1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {experiences.map((e: any) => {
                      const featured = (featuredExps.featuredIds ?? []).includes(e.id);
                      return (
                        <div key={e.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30">
                          <div>
                            <div className="text-sm font-medium">{e.title}</div>
                            <div className="text-xs text-muted-foreground capitalize">{e.type} · ${e.price}/person · {e.duration}</div>
                          </div>
                          <button
                            onClick={() => toggleFeaturedIds("featured_experiences", e.id)}
                            className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${featured ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"}`}
                          >
                            {featured ? "★ Featured" : "Feature"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <Button onClick={() => handleSave("featured_experiences")} disabled={saving === "featured_experiences"} className="gap-2">
                    <Save className="w-4 h-4" /> {saving === "featured_experiences" ? "Saving..." : "Save"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* FEATURED ARTISANS */}
            <TabsContent value="artisans">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base">Featured Artisans</CardTitle>
                  <p className="text-xs text-muted-foreground">Select artisans to highlight on the homepage.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Section Title</Label>
                      <Input value={featuredArtisans.title ?? ""} onChange={e => updateSectionField("featured_artisans", "title", e.target.value)} className="mt-1" placeholder="Meet Our Artisans" />
                    </div>
                    <div>
                      <Label className="text-sm">Subtitle</Label>
                      <Input value={featuredArtisans.subtitle ?? ""} onChange={e => updateSectionField("featured_artisans", "subtitle", e.target.value)} className="mt-1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {artisans.map((a: any) => {
                      const featured = (featuredArtisans.featuredIds ?? []).includes(a.id);
                      return (
                        <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{a.name.charAt(0)}</div>
                            <div>
                              <div className="text-sm font-medium">{a.name}</div>
                              <div className="text-xs text-muted-foreground">{a.skills?.slice(0, 2).join(", ")}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleFeaturedIds("featured_artisans", a.id)}
                            className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${featured ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"}`}
                          >
                            {featured ? "★ Featured" : "Feature"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <Button onClick={() => handleSave("featured_artisans")} disabled={saving === "featured_artisans"} className="gap-2">
                    <Save className="w-4 h-4" /> {saving === "featured_artisans" ? "Saving..." : "Save"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* FEATURED EVENTS */}
            <TabsContent value="events">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base">Featured Events</CardTitle>
                  <p className="text-xs text-muted-foreground">Select events to highlight on the homepage.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {events.map((e: any) => {
                      const featured = (featuredEvents.featuredIds ?? []).includes(e.id);
                      return (
                        <div key={e.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30">
                          <div>
                            <div className="text-sm font-medium">{e.title}</div>
                            <div className="text-xs text-muted-foreground capitalize">{e.type} · {new Date(e.startDate).toLocaleDateString()}</div>
                          </div>
                          <button
                            onClick={() => toggleFeaturedIds("featured_events", e.id)}
                            className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${featured ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"}`}
                          >
                            {featured ? "★ Featured" : "Feature"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <Button onClick={() => handleSave("featured_events")} disabled={saving === "featured_events"} className="gap-2">
                    <Save className="w-4 h-4" /> {saving === "featured_events" ? "Saving..." : "Save"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TEXT SECTIONS */}
            <TabsContent value="text">
              <Card className="border-border">
                <CardHeader><CardTitle className="text-base">About the Village</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm">Heading</Label>
                    <Input value={aboutVillage.heading ?? ""} onChange={e => updateSectionField("about_village", "heading", e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm">Body Text</Label>
                    <Textarea value={aboutVillage.body ?? ""} onChange={e => updateSectionField("about_village", "body", e.target.value)} className="mt-1" rows={4} />
                  </div>
                  <Button onClick={() => handleSave("about_village")} disabled={saving === "about_village"} className="gap-2">
                    <Save className="w-4 h-4" /> {saving === "about_village" ? "Saving..." : "Save"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* GALLERY */}
            <TabsContent value="gallery">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base">Homepage Gallery</CardTitle>
                  <p className="text-xs text-muted-foreground">Add image URLs to display in the homepage gallery section.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm">Gallery Title</Label>
                    <Input value={gallery.title ?? ""} onChange={e => updateSectionField("gallery", "title", e.target.value)} className="mt-1" placeholder="Life at the Village" />
                  </div>
                  <div>
                    <Label className="text-sm">Image URLs (one per line)</Label>
                    <Textarea
                      value={(gallery.images ?? []).join("\n")}
                      onChange={e => updateSectionField("gallery", "images", e.target.value.split("\n").map((s: string) => s.trim()).filter(Boolean))}
                      className="mt-1 font-mono text-xs"
                      rows={6}
                      placeholder={"https://example.com/image1.jpg\nhttps://example.com/image2.jpg"}
                    />
                  </div>
                  {(gallery.images ?? []).length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {(gallery.images ?? []).slice(0, 8).map((img: string, i: number) => (
                        <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted">
                          <img src={img} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        </div>
                      ))}
                    </div>
                  )}
                  <Button onClick={() => handleSave("gallery")} disabled={saving === "gallery"} className="gap-2">
                    <Save className="w-4 h-4" /> {saving === "gallery" ? "Saving..." : "Save Gallery"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
