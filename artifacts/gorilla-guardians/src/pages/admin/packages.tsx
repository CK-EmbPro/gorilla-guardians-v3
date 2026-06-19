import { useState } from "react";
import { Plus, Search, Edit, Layers, TreePine } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useListPackages, useCreatePackage, useUpdatePackage, useListExperiences, getListPackagesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { ImageUpload } from "@/components/ui/image-upload";

const blank = { title: "", description: "", price: "", discountPercent: "0", active: true, images: [] as string[], experienceIds: [] as number[] };

export default function AdminPackagesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState<any>(null);
  const [isNew, setIsNew] = useState(false);

  const { data: packages, isLoading } = useListPackages();
  const { data: experiencesData } = useListExperiences({ limit: 100 });
  const createPkg = useCreatePackage();
  const updatePkg = useUpdatePackage();

  const packageList: any[] = Array.isArray(packages) ? packages : [];
  const allExperiences: any[] = experiencesData?.experiences ?? [];
  const filtered = search
    ? packageList.filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
    : packageList;

  const toggleExperience = (expId: number) => {
    setEditItem((item: any) => {
      const ids: number[] = item.experienceIds ?? [];
      return { ...item, experienceIds: ids.includes(expId) ? ids.filter(id => id !== expId) : [...ids, expId] };
    });
  };

  const handleSave = () => {
    if (!editItem?.title || !editItem?.price || (editItem.experienceIds ?? []).length < 2) {
      toast({ title: "Title, price, and at least 2 experiences are required", variant: "destructive" });
      return;
    }
    const payload = {
      title: editItem.title,
      description: editItem.description ?? "",
      price: Number(editItem.price),
      discountPercent: Number(editItem.discountPercent ?? 0),
      active: editItem.active ?? true,
      images: editItem.images ?? [],
      experienceIds: editItem.experienceIds,
    };
    const onSettled = (label: string) => ({
      onSuccess: () => {
        toast({ title: label });
        setEditItem(null);
        queryClient.invalidateQueries({ queryKey: getListPackagesQueryKey() });
      },
      onError: (err: any) => toast({ title: "Failed to save package", description: err?.message ?? "Please try again.", variant: "destructive" }),
    });
    if (isNew) {
      createPkg.mutate({ data: payload as any }, onSettled("Package created"));
    } else {
      updatePkg.mutate({ id: editItem.id, data: payload as any }, onSettled("Package updated"));
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-serif text-2xl font-bold">Experience Packages</h1>
              <p className="text-sm text-muted-foreground">{packageList.length} package{packageList.length !== 1 ? "s" : ""} configured</p>
            </div>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              onClick={() => { setEditItem({ ...blank }); setIsNew(true); }}
              disabled={allExperiences.length < 2}
              title={allExperiences.length < 2 ? "Need at least 2 experiences before you can create a package" : undefined}
            >
              <Plus className="w-4 h-4" /> Add Package
            </Button>
          </div>

          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search packages..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 max-w-sm" />
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-56 bg-muted rounded-xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20"><Layers className="w-10 h-10 text-muted-foreground mx-auto mb-3" /><p>No packages yet.</p></div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((pkg: any) => (
                <Card key={pkg.id} className="border-border overflow-hidden group" data-testid={`card-admin-package-${pkg.id}`}>
                  <div className="aspect-video bg-muted overflow-hidden relative">
                    {pkg.images?.[0] ? (
                      <img src={pkg.images[0]} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/5">
                        <Layers className="w-10 h-10 text-primary/40" />
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 flex gap-1.5">
                      <Badge className="bg-primary/90 text-white text-xs">${pkg.price}</Badge>
                      {pkg.discountPercent > 0 && <Badge className="bg-accent text-accent-foreground text-xs">-{pkg.discountPercent}%</Badge>}
                      {!pkg.active && <Badge variant="outline" className="text-xs bg-white">Inactive</Badge>}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium mb-1 line-clamp-1">{pkg.title}</h3>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {pkg.experiences?.map((e: any) => (
                        <Badge key={e.id} variant="outline" className="text-xs gap-1"><TreePine className="w-3 h-3" />{e.title}</Badge>
                      ))}
                    </div>
                    <Button
                      size="sm" variant="outline" className="w-full gap-1.5 text-xs"
                      onClick={() => { setEditItem({ ...pkg, price: String(pkg.price), discountPercent: String(pkg.discountPercent), experienceIds: pkg.experiences?.map((e: any) => e.id) ?? [] }); setIsNew(false); }}
                    >
                      <Edit className="w-3 h-3" /> Edit
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isNew ? "Add Package" : "Edit Package"}</DialogTitle></DialogHeader>
          {editItem && (
            <div className="space-y-4 py-2">
              <ImageUpload label="Cover Image" folder="packages" value={editItem.images?.[0]} onChange={(url: string) => setEditItem((e: any) => ({ ...e, images: url ? [url] : [] }))} />
              <div className="space-y-1.5">
                <Label>Title <span className="text-destructive">*</span></Label>
                <Input value={editItem.title} onChange={e => setEditItem((x: any) => ({ ...x, title: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={editItem.description ?? ""} onChange={e => setEditItem((x: any) => ({ ...x, description: e.target.value }))} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Price ($/person) <span className="text-destructive">*</span></Label>
                  <Input type="number" value={editItem.price} onChange={e => setEditItem((x: any) => ({ ...x, price: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Discount (%)</Label>
                  <Input type="number" min={0} max={100} value={editItem.discountPercent} onChange={e => setEditItem((x: any) => ({ ...x, discountPercent: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Included Experiences <span className="text-destructive">*</span> (choose 2 or more)</Label>
                <div className="border border-border rounded-lg max-h-48 overflow-y-auto divide-y divide-border">
                  {allExperiences.map(exp => (
                    <label key={exp.id} className="flex items-center gap-3 p-2.5 cursor-pointer hover:bg-muted/40 text-sm">
                      <Checkbox checked={(editItem.experienceIds ?? []).includes(exp.id)} onCheckedChange={() => toggleExperience(exp.id)} />
                      {exp.title} <span className="text-muted-foreground text-xs">(${exp.price})</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleSave} disabled={createPkg.isPending || updatePkg.isPending}>
              {(createPkg.isPending || updatePkg.isPending) ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
