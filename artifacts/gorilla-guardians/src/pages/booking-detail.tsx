import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Calendar, Users, Clock, DollarSign, CheckCircle2, XCircle, AlertTriangle,
  ArrowLeft, Printer, Ticket, UserCheck, MapPin, RefreshCw, User,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/lib/auth";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-blue-100 text-blue-800 border-blue-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  checked_in: "bg-purple-100 text-purple-800 border-purple-200",
  completed: "bg-gray-100 text-gray-700 border-gray-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <AlertTriangle className="w-4 h-4 text-yellow-600" />,
  approved: <CheckCircle2 className="w-4 h-4 text-blue-600" />,
  confirmed: <CheckCircle2 className="w-4 h-4 text-green-600" />,
  checked_in: <UserCheck className="w-4 h-4 text-purple-600" />,
  completed: <CheckCircle2 className="w-4 h-4 text-gray-600" />,
  cancelled: <XCircle className="w-4 h-4 text-red-600" />,
};

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
const authHeaders = (extra?: Record<string, string>) => {
  const token = localStorage.getItem("gg_auth_token");
  return { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra };
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
      const res = await fetch(`${API_BASE}/api/bookings/${booking.id}/reschedule`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
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
        <CardHeader>
          <CardTitle className="text-lg">Reschedule Booking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
          <div className="flex gap-2 pt-2">
            <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleReschedule} disabled={loading}>
              {loading ? "Rescheduling..." : "Confirm Reschedule"}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BookingDetailPage() {
  const [, params] = useRoute("/bookings/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const id = params?.id;
  const [showReschedule, setShowReschedule] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const { data: booking, isLoading, error } = useQuery<any>({
    queryKey: ["booking", id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/bookings/${id}`, { credentials: "include", headers: authHeaders() });
      if (!res.ok) throw new Error("Booking not found");
      return res.json();
    },
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/api/bookings/${id}`, {
        method: "PATCH",
        headers: authHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (!res.ok) throw new Error("Failed to cancel");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Booking cancelled" });
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
    },
    onError: () => toast({ title: "Failed to cancel", variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-16 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <XCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-serif text-2xl font-bold mb-2">Booking Not Found</h1>
          <p className="text-muted-foreground mb-6">This booking doesn't exist or you don't have access to it.</p>
          <Button onClick={() => setLocation("/customer/bookings")}>My Bookings</Button>
        </div>
      </div>
    );
  }

  const canCancel = ["pending", "approved"].includes(booking.status);
  const canReschedule = ["pending", "approved", "confirmed"].includes(booking.status);
  const showQR = ["approved", "confirmed", "checked_in"].includes(booking.status);
  const formattedDate = booking.date
    ? new Date(booking.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : booking.date;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setLocation(user?.role === "customer" ? "/customer/bookings" : "/admin/bookings")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Bookings
          </button>
        </div>

        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold mb-1">{booking.experience?.title ?? "Booking Detail"}</h1>
            {booking.bookingReference && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Reference:</span>
                <code className="text-sm font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {booking.bookingReference}
                </code>
              </div>
            )}
          </div>
          <Badge className={`capitalize text-sm border px-3 py-1 ${STATUS_COLORS[booking.status] ?? "bg-muted"}`}>
            <span className="flex items-center gap-1.5">
              {STATUS_ICONS[booking.status]}
              {booking.status.replace("_", " ")}
            </span>
          </Badge>
        </div>

        <div className="grid gap-4">
          {/* Booking Summary */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4 text-primary" />
                  <div>
                    <div className="text-xs opacity-70">Date</div>
                    <div className="font-medium text-foreground">{formattedDate}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4 text-primary" />
                  <div>
                    <div className="text-xs opacity-70">Guests</div>
                    <div className="font-medium text-foreground">{booking.participants} {booking.participants === 1 ? "person" : "people"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <div>
                    <div className="text-xs opacity-70">Total Amount</div>
                    <div className="font-bold text-foreground">${Number(booking.totalAmount).toFixed(2)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4 text-primary" />
                  <div>
                    <div className="text-xs opacity-70">Duration</div>
                    <div className="font-medium text-foreground">{booking.experience?.duration ?? "—"}</div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">Payment</span>
                  <div className={`font-semibold capitalize ${booking.paymentStatus === "paid" ? "text-green-700" : booking.paymentStatus === "failed" ? "text-red-700" : "text-amber-700"}`}>
                    {booking.paymentStatus}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Booking ID</span>
                  <div className="font-semibold">#{booking.id}</div>
                </div>
                {booking.checkinAt && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground text-xs">Checked In</span>
                    <div className="font-semibold text-purple-700">
                      {new Date(booking.checkinAt).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {booking.experience?.meetingPoint && (
                <div className="flex items-center gap-2 bg-muted/40 rounded-lg p-3 text-sm">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <span className="font-medium">Meeting Point: </span>
                    <span className="text-muted-foreground">{booking.experience.meetingPoint}</span>
                  </div>
                </div>
              )}

              {booking.specialRequests && (
                <div className="bg-muted/40 rounded-lg p-3 text-sm">
                  <span className="font-medium">Special Requests: </span>
                  <span className="text-muted-foreground">{booking.specialRequests}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Guide Info */}
          {booking.guide && (
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> Assigned Guide
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    {booking.guide.photo
                      ? <img src={booking.guide.photo} alt={booking.guide.name} className="w-full h-full rounded-full object-cover" />
                      : <User className="w-6 h-6 text-primary" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{booking.guide.name}</div>
                    <div className="text-sm text-muted-foreground capitalize">{booking.guide.experienceLevel} guide</div>
                    {booking.guide.languages?.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Languages: {booking.guide.languages.join(", ")}
                      </div>
                    )}
                    {booking.guide.biography && (
                      <div className="text-sm text-muted-foreground mt-2 line-clamp-2">{booking.guide.biography}</div>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-amber-500 text-xs">★</span>
                      <span className="text-xs text-muted-foreground">{Number(booking.guide.rating).toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* QR Code */}
          {showQR && booking.qrCodeData && (
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Your Entry QR Code</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="bg-white p-4 rounded-xl border-2 border-border shadow-sm">
                    <QRCodeSVG value={booking.qrCodeData} size={160} level="M" />
                  </div>
                  <div className="text-sm text-muted-foreground space-y-2 text-center sm:text-left">
                    <p className="font-medium text-foreground">Present this QR code at check-in</p>
                    <p>Staff will scan this code to verify your booking and check you in.</p>
                    <code className="block text-xs bg-muted px-2 py-1 rounded font-mono text-primary">
                      {booking.bookingReference}
                    </code>
                    <Button size="sm" variant="outline" onClick={() => setLocation(`/booking-ticket/${booking.id}`)}
                      className="gap-1.5 mt-2">
                      <Ticket className="w-3.5 h-3.5" /> View Full Ticket
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Booking History */}
          {booking.history && booking.history.length > 0 && (
            <Card className="border-border">
              <CardHeader className="pb-3">
                <button className="flex items-center justify-between w-full" onClick={() => setShowHistory(!showHistory)}>
                  <CardTitle className="text-base">Booking Timeline</CardTitle>
                  {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </CardHeader>
              {showHistory && (
                <CardContent>
                  <div className="relative pl-4">
                    <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />
                    {[...booking.history].reverse().map((h: any, i: number) => (
                      <div key={h.id} className="relative mb-4 last:mb-0">
                        <div className="absolute -left-2.5 top-1 w-2 h-2 rounded-full bg-primary" />
                        <div className="pl-3">
                          <div className="flex items-center gap-2">
                            <Badge className={`capitalize text-xs border ${STATUS_COLORS[h.status] ?? "bg-muted"}`}>
                              {h.status.replace("_", " ")}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(h.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {h.note && <p className="text-xs text-muted-foreground mt-1">{h.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              onClick={() => setLocation(`/booking-ticket/${booking.id}`)}
            >
              <Ticket className="w-4 h-4" /> View Ticket
            </Button>
            {canReschedule && (
              <Button variant="outline" className="gap-2" onClick={() => setShowReschedule(true)}>
                <RefreshCw className="w-4 h-4" /> Reschedule
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outline"
                className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
              >
                <XCircle className="w-4 h-4" /> Cancel Booking
              </Button>
            )}
            <Button variant="ghost" onClick={() => window.print()} className="gap-2">
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>

          {/* Cancellation Policy */}
          {booking.experience?.cancellationPolicy && (
            <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-4 py-3">
              <strong>Cancellation Policy:</strong> {booking.experience.cancellationPolicy}
            </p>
          )}
        </div>
      </main>
      <Footer />

      {showReschedule && (
        <RescheduleModal
          booking={booking}
          onClose={() => setShowReschedule(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["booking", id] })}
        />
      )}
    </div>
  );
}
