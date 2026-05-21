import { useState } from "react";
import { Search, Star, CheckCircle2, XCircle, Filter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListReviews, useUpdateReview, getListReviewsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const demoReviews = [
  { id: 1, reviewer: { name: "Sarah Johnson" }, product: { name: "Imigongo Triangle Panel" }, rating: 5, comment: "Absolutely beautiful! The geometric patterns are stunning. Arrived very well packaged.", status: "pending", createdAt: new Date(Date.now() - 1*24*3600000).toISOString() },
  { id: 2, reviewer: { name: "Pierre Mbeki" }, product: { name: "Peace Basket — Sunrise" }, rating: 4, comment: "Great quality basket, exactly as described. The colors are vibrant.", status: "approved", createdAt: new Date(Date.now() - 3*24*3600000).toISOString() },
  { id: 3, reviewer: { name: "Amira Khalid" }, product: { name: "Gorilla Family Sculpture" }, rating: 5, comment: "This sculpture is a masterpiece. Every detail is perfect.", status: "pending", createdAt: new Date(Date.now() - 5*24*3600000).toISOString() },
  { id: 4, reviewer: { name: "James Lee" }, product: { name: "Traditional Ceramic Pot" }, rating: 3, comment: "Nice pot but slightly smaller than expected based on the photos.", status: "approved", createdAt: new Date(Date.now() - 7*24*3600000).toISOString() },
  { id: 5, reviewer: { name: "Nina Schmidt" }, product: { name: "Beaded Necklace" }, rating: 5, comment: "I get so many compliments when I wear this! Will definitely order again.", status: "approved", createdAt: new Date(Date.now() - 10*24*3600000).toISOString() },
  { id: 6, reviewer: { name: "Lucas Brown" }, product: { name: "Kente Table Runner" }, rating: 2, comment: "Colors faded after first wash despite following care instructions.", status: "pending", createdAt: new Date(Date.now() - 12*24*3600000).toISOString() },
];

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({length:5}).map((_,i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: reviewsData, isLoading } = useListReviews({ status: statusFilter !== "all" ? statusFilter as any : undefined });
  const updateReview = useUpdateReview();

  const reviews = Array.isArray(reviewsData) && reviewsData.length > 0 ? reviewsData : demoReviews;
  const filtered = reviews.filter((r: any) =>
    (!search || r.comment?.toLowerCase().includes(search.toLowerCase()) || r.reviewer?.name?.toLowerCase().includes(search.toLowerCase()) || r.product?.name?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleModerate = (id: number, status: "approved" | "rejected") => {
    updateReview.mutate({ id, data: { status } }, {
      onSuccess: () => {
        toast({ title: `Review ${status}` });
        queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey() });
      },
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="font-serif text-2xl font-bold">Reviews</h1>
            <p className="text-sm text-muted-foreground">{filtered.length} reviews · {reviews.filter((r:any)=>r.status==="pending").length} pending moderation</p>
          </div>

          <div className="flex flex-wrap gap-3 mb-5">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search reviews..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reviews</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">{Array.from({length:5}).map((_,i)=><div key={i} className="h-20 bg-muted rounded-xl animate-pulse"/>)}</div>
          ) : (
            <div className="space-y-3">
              {filtered.map((r: any) => (
                <Card key={r.id} className="border-border p-4" data-testid={`card-review-${r.id}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                        <span className="font-medium text-sm">{r.reviewer?.name ?? "Anonymous"}</span>
                        <span className="text-muted-foreground text-xs">on</span>
                        <span className="text-sm text-primary font-medium">{r.product?.name ?? "Product"}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status] ?? "bg-muted"}`}>{r.status}</span>
                      </div>
                      <StarDisplay rating={r.rating} />
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{r.comment}</p>
                      <p className="text-xs text-muted-foreground/60 mt-2">{new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                    {r.status === "pending" && (
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1.5 h-8 text-xs" onClick={() => handleModerate(r.id, "approved")}>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 gap-1.5 h-8 text-xs" onClick={() => handleModerate(r.id, "rejected")}>
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
