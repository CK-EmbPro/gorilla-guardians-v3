import { useState } from "react";
import { Plus, Search, Edit, TreePine, Users, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useListExperiences, useUpdateExperience, useCreateExperience, getListExperiencesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { ImageUpload } from "@/components/ui/image-upload";

const EXPERIENCE_TYPES = ["tour", "homestay", "workshop", "cooking", "dance"] as const;
const DIFFICULTY_LEVELS = ["easy", "moderate", "challenging", "difficult"] as const;

const blank = {
  title: "", description: "", price: "", durationHours: "2", maxParticipants: "8",
  images: [] as string[],
  type: "tour", active: true,
  meetingPoint: "", difficultyLevel: "", cancellationPolicy: "", includedItems: "",
};

export default function AdminExperiencesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState<any>(null);
  const [isNew, setIsNew] = useState(false);

  const { data: experiencesData, isLoading } = useListExperiences({ search: search || undefined });
  const updateExp = useUpdateExperience();
  const createExp = useCreateExperience();

  const experiences = experiencesData?.experiences ?? [];

  const buildExpPayload = (item: any) => ({
    title: item.title,
    description: item.description ?? undefined,
    price: Number(item.price),
    duration: item.duration ?? `${item.durationHours ?? 2} hours`,
    capacity: Number(item.maxParticipants ?? item.capacity ?? 8),
    images: item.images ?? [],
    type: item.type ?? "tour",
    active: item.active ?? true,
    meetingPoint: item.meetingPoint || undefined,
    difficultyLevel: item.difficultyLevel || undefined,
    cancellationPolicy: item.cancellationPolicy || undefined,
    includedItems: typeof item.includedItems === "string"
      ? item.includedItems.split(",").map((s: string) => s.trim()).filter(Boolean)
      : (item.includedItems ?? []),
  });

  const handleSave = () => {
    if (!editItem?.title || !editItem?.price) return;
    const payload = buildExpPayload(editItem);
    if (isNew) {
      createExp.mutate({ data: payload as any }, {
        onSuccess: () => {
          toast({ title: "Experience created" });
          setEditItem(null);
          queryClient.invalidateQueries({ queryKey: getListExperiencesQueryKey() });
        },
        onError: (err: any) => {
          toast({ title: "Failed to save experience", description: err?.message ?? "Please try again.", variant: "destructive" });
        },
      });
    } else {
      updateExp.mutate({ id: editItem.id, data: payload }, {
        onSuccess: () => {
          toast({ title: "Experience updated" });
          setEditItem(null);
          queryClient.invalidateQueries({ queryKey: getListExperiencesQueryKey() });
        },
        onError: (err: any) => {
          toast({ title: "Failed to save experience", description: err?.message ?? "Please try again.", variant: "destructive" });
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
              <h1 className="font-serif text-2xl font-bold">Experiences</h1>
              <p className="text-sm text-muted-foreground">{experiences.length} experiences available</p>
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" onClick={() => { setEditItem({ ...blank }); setIsNew(true); }}>
              <Plus className="w-4 h-4" /> Add Experience
            </Button>
          </div>

          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search experiences..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 max-w-sm" />
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-56 bg-muted rounded-xl animate-pulse" />)}
            </div>
          ) : experiences.length === 0 ? (
            <div className="text-center py-20"><TreePine className="w-10 h-10 text-muted-foreground mx-auto mb-3" /><p>No experiences yet.</p></div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {experiences.map((exp: any) => (
                <Card key={exp.id} className="border-border overflow-hidden group" data-testid={`card-admin-exp-${exp.id}`}>
                  <div className="aspect-video bg-muted overflow-hidden relative">
                    {exp.images?.[0] ? (
                      <img src={exp.images[0]} alt={exp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/5">
                        <TreePine className="w-10 h-10 text-primary/40" />
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2">
                      <Badge className="bg-primary/90 text-white text-xs">${exp.price}/person</Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium mb-1 line-clamp-1">{exp.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{exp.description}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{exp.duration}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />Max {exp.capacity}</span>
                    </div>
                    <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs" onClick={() => { setEditItem({ ...exp, price: String(exp.price), durationHours: String(exp.capacity), maxParticipants: String(exp.capacity), includedItems: (exp.includedItems ?? []).join(", ") }); setIsNew(false); }}>
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
          <DialogHeader><DialogTitle>{isNew ? "Add Experience" : "Edit Experience"}</DialogTitle></DialogHeader>
          {editItem && (
            <div className="space-y-4 py-2">
              <ImageUpload label="Cover Image" folder="experiences" value={editItem.images?.[0]} onChange={url => setEditItem((e: any) => ({ ...e, images: url ? [url] : [] }))} />
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
                  <Label>Type <span className="text-destructive">*</span></Label>
                  <select
                    value={editItem.type ?? "tour"}
                    onChange={e => setEditItem((x: any) => ({ ...x, type: e.target.value }))}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    {EXPERIENCE_TYPES.map(t => (
                      <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Difficulty</Label>
                  <select
                    value={editItem.difficultyLevel ?? ""}
                    onChange={e => setEditItem((x: any) => ({ ...x, difficultyLevel: e.target.value }))}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="">Not specified</option>
                    {DIFFICULTY_LEVELS.map(d => (
                      <option key={d} value={d} className="capitalize">{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Price ($) <span className="text-destructive">*</span></Label>
                  <Input type="number" value={editItem.price} onChange={e => setEditItem((x: any) => ({ ...x, price: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Duration (hrs)</Label>
                  <Input type="number" value={editItem.durationHours} onChange={e => setEditItem((x: any) => ({ ...x, durationHours: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Max Guests</Label>
                  <Input type="number" value={editItem.maxParticipants} onChange={e => setEditItem((x: any) => ({ ...x, maxParticipants: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Meeting Point</Label>
                <Input value={editItem.meetingPoint ?? ""} onChange={e => setEditItem((x: any) => ({ ...x, meetingPoint: e.target.value }))} placeholder="e.g. Volcanoes National Park Gate" />
              </div>
              <div className="space-y-1.5">
                <Label>What's Included <span className="text-xs text-muted-foreground">(comma-separated)</span></Label>
                <Input value={editItem.includedItems ?? ""} onChange={e => setEditItem((x: any) => ({ ...x, includedItems: e.target.value }))} placeholder="e.g. Guide, Transport, Lunch" />
              </div>
              <div className="space-y-1.5">
                <Label>Cancellation Policy</Label>
                <Textarea value={editItem.cancellationPolicy ?? ""} onChange={e => setEditItem((x: any) => ({ ...x, cancellationPolicy: e.target.value }))} rows={2} placeholder="e.g. Full refund up to 48 hours before the experience." />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="exp-active"
                  checked={editItem.active ?? true}
                  onChange={e => setEditItem((x: any) => ({ ...x, active: e.target.checked }))}
                  className="w-4 h-4"
                />
                <Label htmlFor="exp-active" className="cursor-pointer font-normal">Active (visible to customers)</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleSave} disabled={updateExp.isPending || createExp.isPending}>
              {(updateExp.isPending || createExp.isPending) ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
