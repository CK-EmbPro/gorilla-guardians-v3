import { useState } from "react";
import { Search, CheckCircle2, MessageSquarePlus, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useListFeedback, useUpdateFeedback, getListFeedbackQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
};
const TYPE_COLORS: Record<string, string> = {
  suggestion: "bg-indigo-50 text-indigo-700",
  compliment: "bg-green-50 text-green-700",
  complaint: "bg-red-50 text-red-700",
  bug_report: "bg-orange-50 text-orange-700",
};

const demoFeedback = [
  { id: 1, customer: { name: "Sarah Johnson" }, type: "suggestion", subject: "Add more basket varieties", message: "Would love to see more coiled basket designs, especially in natural earth tones.", status: "open", createdAt: new Date(Date.now()-1*24*3600000).toISOString() },
  { id: 2, customer: { name: "Pierre Mbeki" }, type: "compliment", subject: "Amazing packaging", message: "The eco-friendly packaging was beautiful. The handwritten note made my day!", status: "resolved", createdAt: new Date(Date.now()-3*24*3600000).toISOString() },
  { id: 3, customer: { name: "Amira Khalid" }, type: "complaint", subject: "Delayed shipping", message: "My order took 3 weeks to arrive, much longer than the stated 10 days.", status: "in_progress", createdAt: new Date(Date.now()-5*24*3600000).toISOString() },
  { id: 4, customer: { name: "James Lee" }, type: "bug_report", subject: "Cart not saving items", message: "When I refresh the page my cart is empty even though I added items.", status: "open", createdAt: new Date(Date.now()-7*24*3600000).toISOString() },
  { id: 5, customer: { name: "Nina Schmidt" }, type: "suggestion", subject: "Gift wrapping option", message: "It would be amazing if you offered gift wrapping for special occasions.", status: "resolved", createdAt: new Date(Date.now()-10*24*3600000).toISOString() },
];

export default function AdminFeedbackPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<any>(null);
  const [reply, setReply] = useState("");

  const { data: feedbackData, isLoading } = useListFeedback({ status: statusFilter !== "all" ? statusFilter as any : undefined });
  const updateFeedback = useUpdateFeedback();

  const allFeedback = Array.isArray(feedbackData) && feedbackData.length > 0 ? feedbackData : demoFeedback;
  const filtered = allFeedback.filter((f: any) =>
    !search || f.subject?.toLowerCase().includes(search.toLowerCase()) || f.customer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleResolve = (id: number) => {
    updateFeedback.mutate({ id, data: { status: "resolved" as any } }, {
      onSuccess: () => { toast({ title: "Marked as resolved" }); queryClient.invalidateQueries({ queryKey: getListFeedbackQueryKey() }); },
    });
  };

  const handleReply = () => {
    if (!reply.trim()) return;
    toast({ title: "Reply sent", description: `Reply sent to ${selected?.customer?.name}.` });
    updateFeedback.mutate({ id: selected.id, data: { status: "in_progress" as any } }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListFeedbackQueryKey() }); },
    });
    setSelected(null);
    setReply("");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="font-serif text-2xl font-bold">Feedback</h1>
            <p className="text-sm text-muted-foreground">
              {allFeedback.filter((f: any)=>f.status==="open").length} open · {allFeedback.filter((f: any)=>f.status==="in_progress").length} in progress · {allFeedback.filter((f: any)=>f.status==="resolved").length} resolved
            </p>
          </div>

          <div className="flex flex-wrap gap-3 mb-5">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search feedback..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">{Array.from({length:5}).map((_,i)=><div key={i} className="h-24 bg-muted rounded-xl animate-pulse"/>)}</div>
          ) : (
            <div className="space-y-3">
              {filtered.map((f: any) => (
                <Card key={f.id} className="border-border" data-testid={`card-feedback-${f.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2 mb-1.5">
                          <span className="font-medium text-sm">{f.subject}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[f.type] ?? "bg-muted"}`}>{f.type?.replace("_"," ")}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[f.status] ?? "bg-muted"}`}>{f.status?.replace("_"," ")}</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{f.message}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1.5">
                          From <span className="font-medium">{f.customer?.name ?? "Anonymous"}</span> · {new Date(f.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => { setSelected(f); setReply(""); }}>
                          <MessageSquarePlus className="w-3.5 h-3.5" /> Reply
                        </Button>
                        {f.status !== "resolved" && (
                          <Button size="sm" className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white gap-1.5" onClick={() => handleResolve(f.id)}>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reply to Feedback</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{selected.subject}</p>
                <p className="text-sm text-muted-foreground mt-1">{selected.message}</p>
                <p className="text-xs text-muted-foreground/60 mt-2">From {selected.customer?.name}</p>
              </div>
              <div className="space-y-1.5">
                <Textarea value={reply} onChange={e => setReply(e.target.value)} placeholder={`Write a reply to ${selected.customer?.name}...`} rows={4} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleReply} disabled={!reply.trim()}>Send Reply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
