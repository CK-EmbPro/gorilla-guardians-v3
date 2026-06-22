import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User, Plus, Pencil, Trash2, Star, CheckCircle2, XCircle, Languages,
  Phone, Mail, Save, X, AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { ImageUpload } from "@/components/ui/image-upload";

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
const authHeaders = (extra?: Record<string, string>) => {
  const token = localStorage.getItem("gg_auth_token");
  return { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra };
};

const EXPERIENCE_LEVELS = ["beginner", "intermediate", "advanced", "expert"];

function GuideForm({ guide, onSave, onCancel }: { guide?: any; onSave: (data: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    name: guide?.name ?? "",
    photo: guide?.photo ?? "",
    biography: guide?.biography ?? "",
    languages: (guide?.languages ?? []).join(", "),
    experienceLevel: guide?.experienceLevel ?? "intermediate",
    available: guide?.available ?? true,
    specialties: (guide?.specialties ?? []).join(", "),
    phone: guide?.phone ?? "",
    email: guide?.email ?? "",
  });

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave({
      ...form,
      languages: form.languages.split(",").map((s: string) => s.trim()).filter(Boolean),
      specialties: form.specialties.split(",").map((s: string) => s.trim()).filter(Boolean),
      photo: form.photo || null,
      biography: form.biography || null,
      phone: form.phone || null,
      email: form.email || null,
    });
  };

  return (
    <Card className="border-primary/30 bg-primary/3">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{guide ? "Edit Guide" : "Add New Guide"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium mb-1 block">Full Name *</label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Guide name" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Experience Level</label>
            <select
              value={form.experienceLevel}
              onChange={e => setForm(f => ({ ...f, experienceLevel: e.target.value }))}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
            >
              {EXPERIENCE_LEVELS.map(l => <option key={l} value={l} className="capitalize">{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Phone</label>
            <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+250 788 000 000" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Email</label>
            <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="guide@example.com" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Languages (comma-separated)</label>
            <Input value={form.languages} onChange={e => setForm(f => ({ ...f, languages: e.target.value }))} placeholder="English, French, Kinyarwanda" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Specialties (comma-separated)</label>
            <Input value={form.specialties} onChange={e => setForm(f => ({ ...f, specialties: e.target.value }))} placeholder="Gorilla tracking, Bird watching" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium mb-1 block">Photo</label>
            <ImageUpload
              value={form.photo}
              onChange={(url: string) => setForm(f => ({ ...f, photo: url }))}
              folder="guides"
              label="Guide photo"
              aspect="square"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium mb-1 block">Biography</label>
            <textarea
              value={form.biography}
              onChange={e => setForm(f => ({ ...f, biography: e.target.value }))}
              placeholder="Brief biography..."
              rows={3}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="available" checked={form.available} onChange={e => setForm(f => ({ ...f, available: e.target.checked }))} className="w-4 h-4" />
            <label htmlFor="available" className="text-sm">Available for assignments</label>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button className="bg-primary hover:bg-primary/90 gap-2" onClick={handleSave} disabled={!form.name.trim()}>
            <Save className="w-3.5 h-3.5" /> {guide ? "Save Changes" : "Add Guide"}
          </Button>
          <Button variant="outline" onClick={onCancel} className="gap-2">
            <X className="w-3.5 h-3.5" /> Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function GuideCard({ guide, onEdit, onDelete, onToggle }: { guide: any; onEdit: () => void; onDelete: () => void; onToggle: () => void }) {
  return (
    <Card className="border-border" data-testid={`card-guide-${guide.id}`}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
            {guide.photo
              ? <img src={guide.photo} alt={guide.name} className="w-full h-full object-cover" />
              : <User className="w-6 h-6 text-primary" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{guide.name}</div>
                <div className="text-sm text-muted-foreground capitalize">{guide.experienceLevel} Guide</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={onToggle}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors ${guide.available ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200" : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"}`}
                  data-testid={`toggle-guide-${guide.id}`}
                >
                  {guide.available ? "Available" : "Unavailable"}
                </button>
              </div>
            </div>

            {guide.biography && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{guide.biography}</p>
            )}

            <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
              {Number(guide.rating) > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-500" /> {Number(guide.rating).toFixed(1)}
                  {guide.reviewCount > 0 && ` (${guide.reviewCount} reviews)`}
                </span>
              )}
              {guide.languages?.length > 0 && (
                <span className="flex items-center gap-1">
                  <Languages className="w-3 h-3" /> {guide.languages.join(", ")}
                </span>
              )}
              {guide.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {guide.phone}
                </span>
              )}
              {guide.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {guide.email}
                </span>
              )}
            </div>

            {guide.specialties?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {guide.specialties.map((s: string) => (
                  <Badge key={s} variant="outline" className="text-xs capitalize">{s}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-4 pt-3 border-t border-border">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onEdit}>
            <Pencil className="w-3 h-3" /> Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
            onClick={onDelete}
          >
            <Trash2 className="w-3 h-3" /> Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminGuidesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: guides = [], isLoading } = useQuery<any[]>({
    queryKey: ["guides"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/guides`, { credentials: "include", headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to load guides");
      return res.json();
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${API_BASE}/api/guides`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add guide");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Guide added" });
      queryClient.invalidateQueries({ queryKey: ["guides"] });
      setShowAdd(false);
    },
    onError: () => toast({ title: "Failed to add guide", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`${API_BASE}/api/guides/${id}`, {
        method: "PATCH",
        headers: authHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update guide");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Guide updated" });
      queryClient.invalidateQueries({ queryKey: ["guides"] });
      setEditingId(null);
    },
    onError: () => toast({ title: "Failed to update guide", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_BASE}/api/guides/${id}`, { method: "DELETE", headers: authHeaders(), credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete guide");
    },
    onSuccess: () => {
      toast({ title: "Guide removed" });
      queryClient.invalidateQueries({ queryKey: ["guides"] });
    },
    onError: () => toast({ title: "Failed to remove guide", variant: "destructive" }),
  });

  const availableCount = guides.filter((g: any) => g.available).length;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="font-serif text-2xl font-bold">Tour Guides</h1>
              <p className="text-sm text-muted-foreground">
                {guides.length} guide{guides.length !== 1 ? "s" : ""} · {availableCount} available
              </p>
            </div>
            <Button className="bg-primary hover:bg-primary/90 gap-2" onClick={() => setShowAdd(true)} disabled={showAdd}>
              <Plus className="w-4 h-4" /> Add Guide
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="border-border">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{guides.length}</div>
                <div className="text-xs text-muted-foreground">Total Guides</div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-700">{availableCount}</div>
                <div className="text-xs text-muted-foreground">Available Now</div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-amber-700">{guides.length - availableCount}</div>
                <div className="text-xs text-muted-foreground">Unavailable</div>
              </CardContent>
            </Card>
          </div>

          {/* Add form */}
          {showAdd && (
            <div className="mb-4">
              <GuideForm onSave={(data) => addMutation.mutate(data)} onCancel={() => setShowAdd(false)} />
            </div>
          )}

          {/* Guides list */}
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />)}
            </div>
          ) : guides.length === 0 ? (
            <div className="text-center py-20">
              <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-semibold text-lg mb-2">No guides yet</h2>
              <p className="text-muted-foreground text-sm mb-6">Add your first tour guide to start assigning them to bookings.</p>
              <Button className="bg-primary hover:bg-primary/90" onClick={() => setShowAdd(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add First Guide
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {guides.map((guide: any) => (
                editingId === guide.id ? (
                  <GuideForm
                    key={guide.id}
                    guide={guide}
                    onSave={(data) => updateMutation.mutate({ id: guide.id, data })}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <GuideCard
                    key={guide.id}
                    guide={guide}
                    onEdit={() => { setShowAdd(false); setEditingId(guide.id); }}
                    onDelete={() => deleteMutation.mutate(guide.id)}
                    onToggle={() => updateMutation.mutate({ id: guide.id, data: { available: !guide.available } })}
                  />
                )
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
