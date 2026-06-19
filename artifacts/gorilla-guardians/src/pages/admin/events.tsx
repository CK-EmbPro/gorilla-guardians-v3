import { useState } from "react";
import { Plus, Search, Edit, Calendar, MapPin, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListEvents, useUpdateEvent, useCreateEvent, getListEventsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { ImageUpload } from "@/components/ui/image-upload";

const blank = { title: "", description: "", location: "Musanze, Rwanda", startDate: "", endDate: "", type: "festival", image: "", isFeatured: false };

export default function AdminEventsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState<any>(null);
  const [isNew, setIsNew] = useState(false);

  const { data: eventsData, isLoading } = useListEvents({ limit: 50 });
  const updateEvent = useUpdateEvent();
  const createEvent = useCreateEvent();

  const events = Array.isArray(eventsData) ? eventsData : [];

  const buildEventPayload = (item: any) => ({
    title: item.title,
    description: item.description ?? "",
    type: item.type ?? "festival",
    image: item.image || undefined,
    startDate: item.startDate || undefined,
    endDate: item.endDate || undefined,
    location: item.location ?? undefined,
    active: item.active ?? true,
  });

  const handleSave = () => {
    if (!editItem?.title || !editItem?.startDate) return;
    const payload = buildEventPayload(editItem);
    if (isNew) {
      createEvent.mutate({ data: payload as any }, {
        onSuccess: () => { toast({ title: "Event created" }); setEditItem(null); queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() }); },
        onError: (err: any) => { toast({ title: "Failed to save event", description: err?.message ?? "Please try again.", variant: "destructive" }); },
      });
    } else {
      updateEvent.mutate({ id: editItem.id, data: payload }, {
        onSuccess: () => { toast({ title: "Event updated" }); setEditItem(null); queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() }); },
        onError: (err: any) => { toast({ title: "Failed to save event", description: err?.message ?? "Please try again.", variant: "destructive" }); },
      });
    }
  };

  const isUpcoming = (e: any) => new Date(e.startDate) >= new Date();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-serif text-2xl font-bold">Events</h1>
              <p className="text-sm text-muted-foreground">{events.length} events · {events.filter(isUpcoming).length} upcoming</p>
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" onClick={() => { setEditItem({ ...blank }); setIsNew(true); }}>
              <Plus className="w-4 h-4" /> Add Event
            </Button>
          </div>

          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 max-w-sm" />
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({length:4}).map((_,i)=><div key={i} className="h-52 bg-muted rounded-xl animate-pulse"/>)}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20"><Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3"/><p>No events yet.</p></div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((ev: any) => (
                <Card key={ev.id} className="border-border overflow-hidden" data-testid={`card-event-${ev.id}`}>
                  <div className="aspect-video bg-muted overflow-hidden relative">
                    {ev.image ? (
                      <img src={ev.image} alt={ev.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/5"><Calendar className="w-8 h-8 text-primary/40"/></div>
                    )}
                    <Badge className={`absolute top-2 left-2 text-xs ${isUpcoming(ev) ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                      {isUpcoming(ev) ? "Upcoming" : "Past"}
                    </Badge>
                    {ev.isFeatured && <Badge className="absolute top-2 right-2 text-xs bg-accent text-accent-foreground">Featured</Badge>}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium mb-2 line-clamp-2">{ev.title}</h3>
                    <div className="space-y-1 text-xs text-muted-foreground mb-3">
                      <div className="flex items-center gap-1"><Clock className="w-3 h-3"/>{new Date(ev.startDate).toLocaleDateString()}</div>
                      <div className="flex items-center gap-1"><MapPin className="w-3 h-3"/>{ev.location}</div>
                    </div>
                    <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs" onClick={() => { setEditItem({ ...ev, startDate: ev.startDate?.slice(0,10), endDate: ev.endDate?.slice(0,10) }); setIsNew(false); }}>
                      <Edit className="w-3 h-3"/> Edit
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
          <DialogHeader><DialogTitle>{isNew ? "Add Event" : "Edit Event"}</DialogTitle></DialogHeader>
          {editItem && (
            <div className="space-y-4 py-2">
              <ImageUpload label="Event Banner" folder="events" value={editItem.image} onChange={url => setEditItem((e: any) => ({ ...e, image: url }))} />
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
                  <Label>Start Date <span className="text-destructive">*</span></Label>
                  <Input type="date" value={editItem.startDate} onChange={e => setEditItem((x: any) => ({ ...x, startDate: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>End Date</Label>
                  <Input type="date" value={editItem.endDate ?? ""} onChange={e => setEditItem((x: any) => ({ ...x, endDate: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input value={editItem.location ?? ""} onChange={e => setEditItem((x: any) => ({ ...x, location: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={editItem.type ?? "festival"} onValueChange={v => setEditItem((x: any) => ({ ...x, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="festival">Festival</SelectItem>
                      <SelectItem value="exhibition">Exhibition</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="market">Market</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Featured</Label>
                  <Select value={editItem.isFeatured ? "true" : "false"} onValueChange={v => setEditItem((x: any) => ({ ...x, isFeatured: v === "true" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">No</SelectItem>
                      <SelectItem value="true">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleSave} disabled={createEvent.isPending || updateEvent.isPending}>
              {(createEvent.isPending || updateEvent.isPending) ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
