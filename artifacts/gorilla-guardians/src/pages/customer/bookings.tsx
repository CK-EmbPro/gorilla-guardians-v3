import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Calendar, Clock, Users, DollarSign, ChevronDown, ChevronUp, RefreshCw, XCircle, Ticket, Eye, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useListBookings, useUpdateBooking, getListBookingsQueryKey } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-blue-100 text-blue-800 border-blue-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  checked_in: "bg-purple-100 text-purple-800 border-purple-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  completed: "bg-gray-100 text-gray-700 border-gray-200",
};

const PAYMENT_COLORS: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700",
  paid: "bg-green-50 text-green-700",
  failed: "bg-red-50 text-red-700",
  refunded: "bg-gray-50 text-gray-600",
};

function RescheduleModal({ booking, onClose, onSuccess }: { booking: any; onClose: () => void; onSuccess: () => void }) {
  const [date, setDate] = useState(booking.date || "");
  const [participants, setParticipants] = useState(String(booking.participants || 1));
  const [reason, setReason] = useState("");
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleReschedule = async () => {
    if (!date) { toast({ title: "Please select a date", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ date, participants: Number(participants), reason }),
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: data.error ?? "Failed to reschedule", variant: "destructive" }); return; }
      toast({ title: "Booking rescheduled!", description: `New date: ${date}` });
      onSuccess();
      onClose();
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-6 space-y-4">
          <h3 className="font-semibold text-lg">Reschedule Booking</h3>
          <div>
            <label className="text-sm font-medium mb-1.5 block">New Date *</label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().slice(0, 10)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Participants</label>
            <Input type="number" min={1} value={participants} onChange={e => setParticipants(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Reason (optional)</label>
            <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Why are you rescheduling?" />
          </div>
          <div className="flex gap-2 pt-1">
            <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleReschedule} disabled={loading}>
              {loading ? "Rescheduling..." : "Confirm Reschedule"}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function BookingCard({ b, onCancel, cancelling }: { b: any; onCancel: (id: number) => void; cancelling: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const canCancel = ["pending", "approved"].includes(b.status);
  const canReschedule = ["pending", "approved", "confirmed"].includes(b.status);
  const showTicket = ["approved", "confirmed", "checked_in"].includes(b.status);
  const isPast = b.date < new Date().toISOString().slice(0, 10);

  const copyRef = () => {
    if (b.bookingReference) {
      navigator.clipboard.writeText(b.bookingReference).then(() => {
        toast({ title: "Copied!", description: "Booking reference copied." });
      });
    }
  };

  return (
    <>
      <Card className="border-border" data-testid={`card-booking-${b.id}`}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3 gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center flex-wrap gap-2 mb-1.5">
                {b.experience?.type && (
                  <Badge variant="outline" className="capitalize text-xs">{b.experience.type}</Badge>
                )}
                <Badge className={`capitalize text-xs border ${STATUS_COLORS[b.status] ?? "bg-muted"}`} data-testid={`badge-booking-status-${b.id}`}>
                  {b.status.replace("_", " ")}
                </Badge>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAYMENT_COLORS[b.paymentStatus] ?? "bg-muted"}`}>
                  Payment: {b.paymentStatus}
                </span>
              </div>
              <h3 className="font-semibold">{b.experience?.title ?? `Booking #${b.id}`}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                {b.bookingReference ? (
                  <button onClick={copyRef} className="flex items-center gap-1 text-xs font-mono text-primary hover:text-primary/80 transition-colors group">
                    <code className="bg-primary/10 px-1.5 py-0.5 rounded">{b.bookingReference}</code>
                    <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ) : (
                  <p className="text-xs text-muted-foreground">Booking #{b.id}</p>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-bold text-primary text-lg">${b.totalAmount}</div>
              <div className="text-xs text-muted-foreground">{b.participants} pax</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground mb-3">
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-primary" />{b.date}</span>
            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-primary" />{b.participants} participant{b.participants !== 1 ? "s" : ""}</span>
            {b.experience?.duration && <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary" />{b.experience.duration}</span>}
            <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-primary" />${b.totalAmount} total</span>
          </div>

          {b.guide && (
            <div className="text-xs text-muted-foreground bg-primary/5 px-3 py-2 rounded-lg mb-3 flex items-center gap-2">
              <span className="font-medium text-primary">Guide:</span> {b.guide.name}
              {b.guide.languages?.length > 0 && ` · ${b.guide.languages.join(", ")}`}
            </div>
          )}

          {b.specialRequests && (
            <p className="text-xs text-muted-foreground bg-muted/40 px-3 py-2 rounded-lg mb-3">
              Special requests: {b.specialRequests}
            </p>
          )}

          {b.checkinAt && (
            <div className="text-xs text-purple-700 bg-purple-50 border border-purple-200 px-3 py-2 rounded-lg mb-3">
              ✓ Checked in at {new Date(b.checkinAt).toLocaleString()}
            </div>
          )}

          {b.experience?.meetingPoint && expanded && (
            <div className="text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg mb-3">
              <span className="font-medium">Meeting point:</span> {b.experience.meetingPoint}
            </div>
          )}

          {b.experience?.cancellationPolicy && expanded && (
            <div className="text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg mb-3">
              <span className="font-medium">Cancellation policy:</span> {b.experience.cancellationPolicy}
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-1">
            <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {expanded ? "Less detail" : "More detail"}
            </button>
            <div className="flex gap-2 flex-wrap justify-end">
              <button
                onClick={() => setLocation(`/bookings/${b.id}`)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:bg-muted/50 transition-colors font-medium"
              >
                <Eye className="w-3.5 h-3.5" /> View
              </button>
              {showTicket && (
                <button
                  onClick={() => setLocation(`/booking-ticket/${b.id}`)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-primary/30 text-primary hover:bg-primary/5 transition-colors font-medium"
                >
                  <Ticket className="w-3.5 h-3.5" /> Ticket
                </button>
              )}
              {canReschedule && !isPast && (
                <button
                  onClick={() => setShowReschedule(true)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors font-medium"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Reschedule
                </button>
              )}
              {canCancel && !isPast && (
                <button
                  onClick={() => onCancel(b.id)}
                  disabled={cancelling}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium disabled:opacity-60"
                  data-testid={`button-cancel-booking-${b.id}`}
                >
                  <XCircle className="w-3.5 h-3.5" /> Cancel
                </button>
              )}
              {b.experience?.slug && (
                <Link href={`/experiences/${b.experience.slug ?? b.experience.id}`}>
                  <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:bg-muted/50 transition-colors font-medium">
                    <RefreshCw className="w-3.5 h-3.5" /> Rebook
                  </button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      {showReschedule && (
        <RescheduleModal
          booking={b}
          onClose={() => setShowReschedule(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() })}
        />
      )}
    </>
  );
}

export default function CustomerBookingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: bookings, isLoading } = useListBookings({ userId: user?.id, limit: 50 } as any);
  const updateBooking = useUpdateBooking();
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const bookingList: any[] = Array.isArray(bookings) ? bookings : [];

  const upcoming = bookingList.filter(b => b.date >= new Date().toISOString().slice(0, 10) && b.status !== "cancelled");
  const past = bookingList.filter(b => b.date < new Date().toISOString().slice(0, 10) || b.status === "cancelled");

  const handleCancel = (id: number) => {
    setCancellingId(id);
    updateBooking.mutate({ id, data: { status: "cancelled" } as any }, {
      onSuccess: () => {
        toast({ title: "Booking cancelled", description: "Your booking has been cancelled." });
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
      },
      onError: () => toast({ title: "Failed to cancel", variant: "destructive" }),
      onSettled: () => setCancellingId(null),
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="font-serif text-2xl font-bold">My Bookings</h1>
              <p className="text-sm text-muted-foreground">{bookingList.length} booking{bookingList.length !== 1 ? "s" : ""} total</p>
            </div>
            <Link href="/experiences">
              <Button size="sm" variant="outline">Browse Experiences</Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />)}</div>
          ) : bookingList.length === 0 ? (
            <div className="text-center py-20">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-semibold text-lg mb-2">No bookings yet</h2>
              <p className="text-muted-foreground text-sm mb-6">Book a cultural experience in Rwanda.</p>
              <Link href="/experiences"><Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Browse Experiences</Button></Link>
            </div>
          ) : (
            <div className="space-y-6">
              {upcoming.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Upcoming ({upcoming.length})</h2>
                  <div className="space-y-3">
                    {upcoming.map(b => (
                      <BookingCard key={b.id} b={b} onCancel={handleCancel} cancelling={cancellingId === b.id} />
                    ))}
                  </div>
                </div>
              )}
              {past.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Past & Cancelled ({past.length})</h2>
                  <div className="space-y-3 opacity-80">
                    {past.map(b => (
                      <BookingCard key={b.id} b={b} onCancel={handleCancel} cancelling={cancellingId === b.id} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
