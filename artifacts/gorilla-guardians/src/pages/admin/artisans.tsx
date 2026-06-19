import { useState } from "react";
import { Plus, Search, Edit, Users, Star, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListArtisans, useUpdateArtisan, useCreateArtisan, getListArtisansQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { ImageUpload } from "@/components/ui/image-upload";

const blank = { name: "", bio: "", specialty: "", location: "Musanze, Rwanda", isAmbassador: false, photo: "" };

export default function AdminArtisansPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState<any>(null);
  const [isNew, setIsNew] = useState(false);

  const { data: artisansData, isLoading } = useListArtisans({ search: search || undefined, limit: 50 });
  const updateArtisan = useUpdateArtisan();
  const createArtisan = useCreateArtisan();

  const artisans = Array.isArray(artisansData) ? artisansData : [];

  const openNew = () => { setEditItem({ ...blank }); setIsNew(true); };
  const openEdit = (a: any) => { setEditItem({ ...a }); setIsNew(false); };

  const buildArtisanPayload = (item: any) => ({
    name: item.name,
    photo: item.photo || undefined,
    biography: item.bio ?? item.biography ?? undefined,
    skills: item.skills ?? [],
    story: item.story ?? undefined,
    galleryImages: item.galleryImages ?? [],
    videoUrl: item.videoUrl ?? undefined,
    isConservationAmbassador: item.isAmbassador ?? item.isConservationAmbassador ?? false,
  });

  const handleSave = () => {
    if (!editItem?.name) return;
    const payload = buildArtisanPayload(editItem);
    if (isNew) {
      createArtisan.mutate({ data: { ...payload, userId: 1 } as any }, {
        onSuccess: () => {
          toast({ title: "Artisan created" });
          setEditItem(null);
          queryClient.invalidateQueries({ queryKey: getListArtisansQueryKey() });
        },
        onError: (err: any) => {
          toast({ title: "Failed to save artisan", description: err?.message ?? "Please try again.", variant: "destructive" });
        },
      });
    } else {
      updateArtisan.mutate({ id: editItem.id, data: payload }, {
        onSuccess: () => {
          toast({ title: "Artisan updated" });
          setEditItem(null);
          queryClient.invalidateQueries({ queryKey: getListArtisansQueryKey() });
        },
        onError: (err: any) => {
          toast({ title: "Failed to save artisan", description: err?.message ?? "Please try again.", variant: "destructive" });
        },
      });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-serif text-2xl font-bold">Artisans</h1>
              <p className="text-sm text-muted-foreground">{artisans.length} artisans registered</p>
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" onClick={openNew}>
              <Plus className="w-4 h-4" /> Add Artisan
            </Button>
          </div>

          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search artisans..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 max-w-sm" />
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />)}
            </div>
          ) : artisans.length === 0 ? (
            <div className="text-center py-20"><Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" /><p>No artisans found.</p></div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {artisans.map((a: any) => (
                <Card key={a.id} className="border-border overflow-hidden" data-testid={`card-admin-artisan-${a.id}`}>
                  <div className="aspect-video bg-muted relative">
                    {a.photo ? (
                      <img src={a.photo} alt={a.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-2xl font-bold text-primary">{a.name?.[0]}</span>
                        </div>
                      </div>
                    )}
                    {a.isAmbassador && (
                      <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground gap-1 text-xs">
                        <Award className="w-3 h-3" /> Ambassador
                      </Badge>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium">{a.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{a.specialty ?? "Artisan"}</p>
                      </div>
                      <div className="flex items-center gap-0.5 text-xs text-amber-500 shrink-0">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{a.averageRating?.toFixed(1) ?? "5.0"}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{a.bio}</p>
                    <Button size="sm" variant="outline" className="mt-3 w-full gap-1.5 text-xs" onClick={() => openEdit(a)}>
                      <Edit className="w-3 h-3" /> Edit Profile
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
          <DialogHeader><DialogTitle>{isNew ? "Add Artisan" : "Edit Artisan"}</DialogTitle></DialogHeader>
          {editItem && (
            <div className="space-y-4 py-2">
              <ImageUpload label="Profile Photo" folder="artisans" value={editItem.photo} onChange={url => setEditItem((a: any) => ({ ...a, photo: url }))} aspect="square" />
              <div className="space-y-1.5">
                <Label>Full Name <span className="text-destructive">*</span></Label>
                <Input value={editItem.name} onChange={e => setEditItem((a: any) => ({ ...a, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Specialty</Label>
                <Input value={editItem.specialty ?? ""} onChange={e => setEditItem((a: any) => ({ ...a, specialty: e.target.value }))} placeholder="e.g. Basket Weaving" />
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input value={editItem.location ?? ""} onChange={e => setEditItem((a: any) => ({ ...a, location: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Bio</Label>
                <Textarea value={editItem.bio ?? ""} onChange={e => setEditItem((a: any) => ({ ...a, bio: e.target.value }))} rows={4} />
              </div>
              <div className="space-y-1.5">
                <Label>Ambassador Status</Label>
                <Select value={editItem.isAmbassador ? "true" : "false"} onValueChange={v => setEditItem((a: any) => ({ ...a, isAmbassador: v === "true" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Regular Artisan</SelectItem>
                    <SelectItem value="true">Conservation Ambassador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleSave} disabled={updateArtisan.isPending || createArtisan.isPending}>
              {(updateArtisan.isPending || createArtisan.isPending) ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
