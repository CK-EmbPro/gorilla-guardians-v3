import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Save, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useCreateProduct,
  useUpdateProduct,
  useGetProduct,
  useListArtisans,
  useListCategories,
  getListProductsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { ImageUpload } from "@/components/ui/image-upload";

const blank = {
  name: "",
  description: "",
  culturalSignificance: "",
  price: "",
  discountPrice: "",
  stock: "10",
  sku: "",
  categoryId: "",
  artisanId: "",
  materials: "",
  dimensions: "",
  weight: "",
  featured: false,
  active: true,
  images: [] as string[],
};

interface ProductFormPageProps {
  productId?: number;
}

export default function ProductFormPage({ productId }: ProductFormPageProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isNew = !productId;

  const [form, setForm] = useState({ ...blank });

  const { data: existing, isLoading: loadingProduct } = useGetProduct(
    productId!,
    { query: { enabled: !!productId } }
  );
  const { data: artisansData } = useListArtisans({ limit: 100 });
  const { data: categoriesData } = useListCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const artisans = Array.isArray(artisansData) ? artisansData : [];
  const categories = Array.isArray(categoriesData) ? categoriesData : [];

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name ?? "",
        description: existing.description ?? "",
        culturalSignificance: (existing as any).culturalSignificance ?? "",
        price: String(existing.price ?? ""),
        discountPrice: existing.discountPrice ? String(existing.discountPrice) : "",
        stock: String(existing.stock ?? ""),
        sku: (existing as any).sku ?? "",
        categoryId: existing.category?.id ? String(existing.category.id) : "",
        artisanId: existing.artisan?.id ? String(existing.artisan.id) : "",
        materials: (existing as any).materials ?? "",
        dimensions: (existing as any).dimensions ?? "",
        weight: (existing as any).weight ? String((existing as any).weight) : "",
        featured: (existing as any).featured ?? false,
        active: (existing as any).active ?? true,
        images: (existing as any).images ?? [],
      });
    }
  }, [existing]);

  const set = (key: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const buildPayload = () => ({
    name: form.name,
    description: form.description || undefined,
    culturalSignificance: form.culturalSignificance || undefined,
    price: Number(form.price),
    discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
    stock: Number(form.stock),
    sku: form.sku || undefined,
    categoryId: form.categoryId ? Number(form.categoryId) : undefined,
    artisanId: form.artisanId ? Number(form.artisanId) : undefined,
    materials: form.materials || undefined,
    dimensions: form.dimensions || undefined,
    weight: form.weight ? Number(form.weight) : undefined,
    featured: form.featured,
    active: form.active,
    images: form.images,
  });

  const handleSave = () => {
    if (!form.name || !form.price) {
      toast({ title: "Name and price are required", variant: "destructive" });
      return;
    }
    const payload = buildPayload();
    if (isNew) {
      createProduct.mutate(
        { data: payload as any },
        {
          onSuccess: () => {
            toast({ title: "Product created successfully" });
            queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
            navigate("/admin/products");
          },
          onError: (err: any) => {
            toast({ title: "Failed to create product", description: err?.message, variant: "destructive" });
          },
        }
      );
    } else {
      updateProduct.mutate(
        { id: productId!, data: payload as any },
        {
          onSuccess: () => {
            toast({ title: "Product updated successfully" });
            queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
            navigate("/admin/products");
          },
          onError: (err: any) => {
            toast({ title: "Failed to update product", description: err?.message, variant: "destructive" });
          },
        }
      );
    }
  };

  const isPending = createProduct.isPending || updateProduct.isPending;

  if (!isNew && loadingProduct) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="space-y-4 max-w-3xl mx-auto">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/products")} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <div>
              <h1 className="font-serif text-2xl font-bold">
                {isNew ? "Add New Product" : "Edit Product"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isNew ? "Create a new product listing" : `Editing: ${existing?.name}`}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="border-border">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Package className="w-4 h-4" />Basic Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Product Name <span className="text-destructive">*</span></Label>
                  <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Imigongo Triangle Panel" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>SKU</Label>
                    <Input value={form.sku} onChange={e => set("sku", e.target.value)} placeholder="e.g. IMG-001" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Stock Quantity</Label>
                    <Input type="number" min="0" value={form.stock} onChange={e => set("stock", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={4} placeholder="Describe the product..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Cultural Significance</Label>
                  <Textarea value={form.culturalSignificance} onChange={e => set("culturalSignificance", e.target.value)} rows={3} placeholder="Explain the cultural story behind this piece..." />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader><CardTitle className="text-base">Pricing</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Price (USD) <span className="text-destructive">*</span></Label>
                  <Input type="number" min="0" step="0.01" value={form.price} onChange={e => set("price", e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-1.5">
                  <Label>Sale Price (USD)</Label>
                  <Input type="number" min="0" step="0.01" value={form.discountPrice} onChange={e => set("discountPrice", e.target.value)} placeholder="Leave blank if no sale" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader><CardTitle className="text-base">Category & Artisan</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={form.categoryId} onValueChange={v => set("categoryId", v)}>
                    <SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c: any) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Artisan</Label>
                  <Select value={form.artisanId} onValueChange={v => set("artisanId", v)}>
                    <SelectTrigger><SelectValue placeholder="Select artisan..." /></SelectTrigger>
                    <SelectContent>
                      {artisans.map((a: any) => (
                        <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader><CardTitle className="text-base">Physical Details</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Materials</Label>
                  <Input value={form.materials} onChange={e => set("materials", e.target.value)} placeholder="e.g. Natural pigments, clay" />
                </div>
                <div className="space-y-1.5">
                  <Label>Dimensions</Label>
                  <Input value={form.dimensions} onChange={e => set("dimensions", e.target.value)} placeholder="e.g. 40cm x 40cm" />
                </div>
                <div className="space-y-1.5">
                  <Label>Weight (kg)</Label>
                  <Input type="number" min="0" step="0.1" value={form.weight} onChange={e => set("weight", e.target.value)} placeholder="0.0" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader><CardTitle className="text-base">Images</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <ImageUpload
                  label="Primary Image"
                  value={form.images[0]}
                  onChange={url => set("images", url ? [url, ...form.images.slice(1)] : form.images.slice(1))}
                />
                {form.images[0] && (
                  <ImageUpload
                    label="Secondary Image (optional)"
                    value={form.images[1]}
                    onChange={url => set("images", url ? [form.images[0], url] : [form.images[0]])}
                  />
                )}
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader><CardTitle className="text-base">Visibility</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Active (visible on shop)</p>
                    <p className="text-xs text-muted-foreground">Customers can find and purchase this product</p>
                  </div>
                  <Switch checked={form.active} onCheckedChange={v => set("active", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Featured</p>
                    <p className="text-xs text-muted-foreground">Show on homepage featured products section</p>
                  </div>
                  <Switch checked={form.featured} onCheckedChange={v => set("featured", v)} />
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-3 pb-8">
              <Button variant="outline" onClick={() => navigate("/admin/products")}>Cancel</Button>
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                onClick={handleSave}
                disabled={isPending}
              >
                <Save className="w-4 h-4" />
                {isPending ? "Saving..." : isNew ? "Create Product" : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
