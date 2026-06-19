import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { useCreateProduct, useListCategories, getListProductsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { ImageUpload } from "@/components/ui/image-upload";

export default function ArtisanNewProductPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createProduct = useCreateProduct();
  const { data: categories } = useListCategories();
  const catList = Array.isArray(categories) ? categories : [];

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    discountPrice: "",
    stock: "10",
    categoryId: "",
    materials: "",
    dimensions: "",
    weight: "",
    image: "",
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.categoryId) {
      toast({ title: "Missing required fields", description: "Name, price, and category are required.", variant: "destructive" });
      return;
    }
    createProduct.mutate(
      {
        data: {
          name: form.name,
          description: form.description,
          price: Number(form.price),
          discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
          stock: Number(form.stock),
          categoryId: Number(form.categoryId),
          artisanId: user?.id ?? 4,
          images: form.image ? [form.image] : [],
          materials: form.materials ? form.materials.split(",").map(m => m.trim()) : [],
          dimensions: form.dimensions || undefined,
          weight: form.weight || undefined,
        } as any,
      },
      {
        onSuccess: () => {
          toast({ title: "Product created!", description: "Your product is now live." });
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          setLocation("/artisan/products");
        },
        onError: () => {
          toast({ title: "Failed to create product", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setLocation("/artisan/products")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Products
          </button>

          <div className="mb-6">
            <h1 className="font-serif text-2xl font-bold">Add New Product</h1>
            <p className="text-sm text-muted-foreground mt-1">Share your handcraft with the world.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <Card className="border-border">
                <CardHeader><CardTitle className="text-base">Product Image</CardTitle></CardHeader>
                <CardContent>
                  <ImageUpload
                    value={form.image}
                    onChange={url => setForm(f => ({ ...f, image: url }))}
                    label="Main product photo"
                    folder="products"
                  />
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader><CardTitle className="text-base">Basic Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Product Name <span className="text-destructive">*</span></Label>
                    <Input value={form.name} onChange={set("name")} placeholder="e.g. Imigongo Geometric Panel" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea value={form.description} onChange={set("description")} placeholder="Tell the story behind this piece..." rows={4} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Category <span className="text-destructive">*</span></Label>
                    <Select value={form.categoryId} onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {catList.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader><CardTitle className="text-base">Pricing & Inventory</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Price ($) <span className="text-destructive">*</span></Label>
                      <Input type="number" value={form.price} onChange={set("price")} min="0" step="0.01" placeholder="0.00" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Sale Price ($)</Label>
                      <Input type="number" value={form.discountPrice} onChange={set("discountPrice")} min="0" step="0.01" placeholder="Optional" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Stock Quantity</Label>
                    <Input type="number" value={form.stock} onChange={set("stock")} min="0" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader><CardTitle className="text-base">Product Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Materials (comma-separated)</Label>
                    <Input value={form.materials} onChange={set("materials")} placeholder="e.g. Sisal, Natural dye, Grass" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Dimensions</Label>
                      <Input value={form.dimensions} onChange={set("dimensions")} placeholder="e.g. 30cm × 30cm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Weight</Label>
                      <Input value={form.weight} onChange={set("weight")} placeholder="e.g. 250g" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3 pb-8">
                <Button type="button" variant="outline" onClick={() => setLocation("/artisan/products")} className="flex-1">Cancel</Button>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={createProduct.isPending}>
                  {createProduct.isPending ? "Creating..." : "Create Product"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
