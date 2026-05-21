import { useState } from "react";
import { Plus, Search, Edit, BookOpen, Eye } from "lucide-react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListStories, useCreateStory, getListStoriesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { useAuth } from "@/lib/auth";
import { ImageUpload } from "@/components/ui/image-upload";

const blank = { title: "", excerpt: "", content: "", coverImage: "", category: "artisan_spotlight", status: "draft" };

export default function AdminStoriesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState<any>(null);

  const { data: storiesData, isLoading } = useListStories({ limit: 50 });
  const createStory = useCreateStory();

  const stories = Array.isArray(storiesData) ? storiesData : [];

  const handleSave = () => {
    if (!editItem?.title) return;
    createStory.mutate(
      { data: { ...editItem, authorId: user?.id ?? 2 } },
      {
        onSuccess: () => {
          toast({ title: "Story created" });
          setEditItem(null);
          queryClient.invalidateQueries({ queryKey: getListStoriesQueryKey() });
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
              <h1 className="font-serif text-2xl font-bold">Stories</h1>
              <p className="text-sm text-muted-foreground">{stories.length} stories published</p>
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" onClick={() => setEditItem({ ...blank })}>
              <Plus className="w-4 h-4" /> New Story
            </Button>
          </div>

          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search stories..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 max-w-sm" />
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({length:4}).map((_,i)=><div key={i} className="h-48 bg-muted rounded-xl animate-pulse"/>)}
            </div>
          ) : stories.length === 0 ? (
            <div className="text-center py-20"><BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3"/><p>No stories yet. Create your first one!</p></div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stories.map((s: any) => (
                <Card key={s.id} className="border-border overflow-hidden" data-testid={`card-story-${s.id}`}>
                  <div className="aspect-video bg-muted overflow-hidden">
                    {s.coverImage ? (
                      <img src={s.coverImage} alt={s.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-8 h-8 text-muted-foreground/30"/></div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-medium text-sm line-clamp-2 flex-1">{s.title}</h3>
                      <Badge variant={s.status === "published" ? "default" : "secondary"} className="text-xs shrink-0">{s.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{s.excerpt}</p>
                    <p className="text-xs text-muted-foreground/60">{new Date(s.createdAt).toLocaleDateString()}</p>
                    <div className="flex gap-2 mt-3">
                      <Link href={`/stories/${s.id}`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs"><Eye className="w-3 h-3"/>View</Button>
                      </Link>
                      <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-xs" onClick={() => setEditItem({ ...s })}>
                        <Edit className="w-3 h-3"/>Edit
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Story</DialogTitle></DialogHeader>
          {editItem && (
            <div className="space-y-4 py-2">
              <ImageUpload label="Cover Image" value={editItem.coverImage} onChange={url => setEditItem((s: any) => ({ ...s, coverImage: url }))} />
              <div className="space-y-1.5">
                <Label>Title <span className="text-destructive">*</span></Label>
                <Input value={editItem.title} onChange={e => setEditItem((s: any) => ({ ...s, title: e.target.value }))} placeholder="Story title..." />
              </div>
              <div className="space-y-1.5">
                <Label>Excerpt</Label>
                <Textarea value={editItem.excerpt ?? ""} onChange={e => setEditItem((s: any) => ({ ...s, excerpt: e.target.value }))} rows={2} placeholder="Short summary..." />
              </div>
              <div className="space-y-1.5">
                <Label>Content</Label>
                <Textarea value={editItem.content ?? ""} onChange={e => setEditItem((s: any) => ({ ...s, content: e.target.value }))} rows={8} placeholder="Write the full story here..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={editItem.category} onValueChange={v => setEditItem((s: any) => ({ ...s, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="artisan_spotlight">Artisan Spotlight</SelectItem>
                      <SelectItem value="conservation">Conservation</SelectItem>
                      <SelectItem value="culture">Culture</SelectItem>
                      <SelectItem value="community">Community</SelectItem>
                      <SelectItem value="news">News</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={editItem.status} onValueChange={v => setEditItem((s: any) => ({ ...s, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleSave} disabled={createStory.isPending}>
              {createStory.isPending ? "Publishing..." : "Save Story"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
