import { useState } from "react";
import { Link } from "wouter";
import { Plus, Search, Edit, Trash2, Eye, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListProducts, useDeleteProduct, useUpdateProduct, useListCategories, getListProductsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { useAuth } from "@/lib/auth";
import { ImageUpload } from "@/components/ui/image-upload";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  draft: "bg-gray-100 text-gray-700",
  out_of_stock: "bg-red-100 text-red-700",
};

export default function ArtisanProductsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editProduct, setEditProduct] = useState<any>(null);

  const { data: productsData, isLoading } = useListProducts({ artisanId: user?.id ?? 4, limit: 50 });
  const { data: categories } = useListCategories();
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();

  const products = productsData?.products ?? [];
  const filtered = products.filter((p: any) =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase())
  );
  const catList = Array.isArray(categories) ? categories : [];

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    deleteProduct.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Product deleted" });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      },
    });
  };

  const handleUpdate = () => {
    if (!editProduct) return;
    updateProduct.mutate(
      { id: editProduct.id, data: { name: editProduct.name, description: editProduct.description, price: Number(editProduct.price), stock: Number(editProduct.stock), images: editProduct.images ?? [], categoryId: editProduct.categoryId } },
      {
        onSuccess: () => {
          toast({ title: "Product updated" });
          setEditProduct(null);
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        },
      }
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-serif text-2xl font-bold">My Products</h1>
              <p className="text-sm text-muted-foreground">{products.length} product{products.length !== 1 ? "s" : ""} listed</p>
            </div>
            <Link href="/artisan/products/new">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                <Plus className="w-4 h-4" /> Add Product
              </Button>
            </Link>
          </div>

          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 max-w-sm" />
          </div>

          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">No products yet</p>
              <p className="text-sm text-muted-foreground mt-1">Start by adding your first product.</p>
            </div>
          ) : (
            <Card className="border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Price</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stock</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p: any) => (
                      <tr key={p.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0">
                              {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full imigongo-pattern" />}
                            </div>
                            <div className="font-medium">{p.name}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium">${p.price}</td>
                        <td className="px-4 py-3">
                          <span className={p.stock <= 5 ? "text-red-600 font-medium" : ""}>{p.stock} left</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status] ?? "bg-muted"}`}>{p.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <Link href={`/products/${p.id}`}>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><Eye className="w-3.5 h-3.5" /></Button>
                            </Link>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditProduct({ ...p })}>
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(p.id, p.name)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={!!editProduct} onOpenChange={() => setEditProduct(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Product</DialogTitle></DialogHeader>
          {editProduct && (
            <div className="space-y-4 py-2">
              <ImageUpload label="Product Image" folder="products" value={editProduct.images?.[0]} onChange={url => setEditProduct((p: any) => ({ ...p, images: url ? [url] : [] }))} />
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={editProduct.name} onChange={e => setEditProduct((p: any) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={editProduct.description ?? ""} onChange={e => setEditProduct((p: any) => ({ ...p, description: e.target.value }))} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Price ($)</Label>
                  <Input type="number" value={editProduct.price} onChange={e => setEditProduct((p: any) => ({ ...p, price: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Stock</Label>
                  <Input type="number" value={editProduct.stock} onChange={e => setEditProduct((p: any) => ({ ...p, stock: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={String(editProduct.categoryId ?? "")} onValueChange={v => setEditProduct((p: any) => ({ ...p, categoryId: Number(v) }))}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {catList.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProduct(null)}>Cancel</Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleUpdate} disabled={updateProduct.isPending}>
              {updateProduct.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
