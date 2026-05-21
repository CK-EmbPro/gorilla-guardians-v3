import { useState } from "react";
import { Search, Edit, Eye } from "lucide-react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useListProducts, useUpdateProduct, getListProductsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { ImageUpload } from "@/components/ui/image-upload";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  draft: "bg-gray-100 text-gray-700",
  out_of_stock: "bg-red-100 text-red-700",
};

export default function StaffProductsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editProduct, setEditProduct] = useState<any>(null);

  const { data: productsData, isLoading } = useListProducts({ search: search || undefined, limit: 50 });
  const updateProduct = useUpdateProduct();

  const products = productsData?.products ?? [];

  const handleUpdate = () => {
    if (!editProduct) return;
    updateProduct.mutate(
      { id: editProduct.id, data: { name: editProduct.name, description: editProduct.description, price: Number(editProduct.price), stock: Number(editProduct.stock), images: editProduct.images ?? [] } },
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
          <div className="mb-8">
            <h1 className="font-serif text-2xl font-bold">Products</h1>
            <p className="text-sm text-muted-foreground">{products.length} products in catalog</p>
          </div>

          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 max-w-sm" />
          </div>

          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}</div>
          ) : (
            <Card className="border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Artisan</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Price</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stock</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p: any) => (
                      <tr key={p.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-muted overflow-hidden shrink-0">
                              {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full imigongo-pattern" />}
                            </div>
                            <span className="font-medium">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{p.artisan?.name ?? "—"}</td>
                        <td className="px-4 py-3 font-medium">${p.price}</td>
                        <td className="px-4 py-3"><span className={p.stock <= 5 ? "text-red-600 font-medium" : ""}>{p.stock}</span></td>
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

      <Dialog open={!!editProduct} onOpenChange={() => setEditProduct(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Product</DialogTitle></DialogHeader>
          {editProduct && (
            <div className="space-y-4 py-2">
              <ImageUpload label="Product Image" value={editProduct.images?.[0]} onChange={url => setEditProduct((p: any) => ({ ...p, images: url ? [url] : [] }))} />
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
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProduct(null)}>Cancel</Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleUpdate} disabled={updateProduct.isPending}>
              {updateProduct.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
