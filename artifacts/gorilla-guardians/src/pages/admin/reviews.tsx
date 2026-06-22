import { useState } from "react";
import { Search, Star, CheckCircle2, XCircle, Trash2, Filter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListReviews, useUpdateReview, getListReviewsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
const authHeaders = (extra?: Record<string, string>) => {
  const token = localStorage.getItem("gg_auth_token");
  return { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra };
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
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
  const [deleting, setDeleting] = useState<number | null>(null);

  const { data: reviewsData, isLoading } = useListReviews({ status: statusFilter !== "all" ? statusFilter as any : undefined });
  const updateReview = useUpdateReview();

  const reviews: any[] = Array.isArray(reviewsData) ? reviewsData : [];

  const filtered = reviews.filter((r: any) => {
    const q = search.toLowerCase();
    const reviewerName = r.user?.name ?? r.reviewer?.name ?? "";
    const productName = r.product?.name ?? "";
    const expTitle = r.experience?.title ?? "";
    return !q ||
      r.comment?.toLowerCase().includes(q) ||
      reviewerName.toLowerCase().includes(q) ||
      productName.toLowerCase().includes(q) ||
      expTitle.toLowerCase().includes(q);
  });

  const pendingCount = reviews.filter((r: any) => r.status === "pending").length;

  const handleModerate = (id: number, status: "approved" | "rejected") => {
    updateReview.mutate({ id, data: { status } }, {
      onSuccess: () => {
        toast({ title: `Review ${status}` });
        queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey() });
      },
      onError: () => toast({ title: "Failed", variant: "destructive" }),
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this review permanently?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`${API_BASE}/api/reviews/${id}`, { method: "DELETE", headers: authHeaders(), credentials: "include" });
      if (!res.ok) throw new Error();
      toast({ title: "Review deleted" });
      queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey() });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="font-serif text-2xl font-bold">Reviews</h1>
            <p className="text-sm text-muted-foreground">
              {reviews.length} reviews · {pendingCount} pending moderation
            </p>
          </div>

          <div className="flex flex-wrap gap-3 mb-5">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by reviewer, product, or comment..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
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
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>{search || statusFilter !== "all" ? "No reviews match your filters." : "No reviews yet."}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((r: any) => {
                const reviewerName = r.user?.name ?? r.reviewer?.name ?? "Anonymous";
                const subjectName = r.product?.name ?? r.experience?.title ?? "Item";
                const subjectType = r.product ? "product" : r.experience ? "experience" : null;
                return (
                  <Card key={r.id} className="border-border p-4" data-testid={`card-review-${r.id}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2 mb-1.5">
                          <span className="font-medium text-sm">{reviewerName}</span>
                          <span className="text-muted-foreground text-xs">·</span>
                          <span className="text-sm">
                            <span className="text-xs text-muted-foreground capitalize">{subjectType}: </span>
                            <span className="text-primary font-medium">{subjectName}</span>
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status] ?? "bg-muted"}`}>
                            {r.status}
                          </span>
                        </div>
                        <StarDisplay rating={r.rating} />
                        {r.title && <p className="text-sm font-medium mt-1.5">{r.title}</p>}
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{r.comment}</p>
                        <p className="text-xs text-muted-foreground/60 mt-2">
                          {new Date(r.createdAt).toLocaleDateString()} · {r.user?.email ?? ""}
                          {r.isVerifiedPurchase && <span className="ml-2 text-green-600">✓ Verified</span>}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        {r.status === "pending" && (
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white gap-1.5 h-8 text-xs"
                              onClick={() => handleModerate(r.id, "approved")}
                              disabled={updateReview.isPending}
                              data-testid={`button-approve-${r.id}`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50 gap-1.5 h-8 text-xs"
                              onClick={() => handleModerate(r.id, "rejected")}
                              disabled={updateReview.isPending}
                              data-testid={`button-reject-${r.id}`}
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </Button>
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-red-600 hover:bg-red-50 h-8 text-xs gap-1"
                          onClick={() => handleDelete(r.id)}
                          disabled={deleting === r.id}
                          data-testid={`button-delete-${r.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> {deleting === r.id ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
