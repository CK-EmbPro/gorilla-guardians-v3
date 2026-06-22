import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { Printer, ArrowLeft, CheckCircle2, XCircle, AlertTriangle, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/Navbar";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-blue-100 text-blue-800 border-blue-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  checked_in: "bg-purple-100 text-purple-800 border-purple-200",
  completed: "bg-gray-100 text-gray-700 border-gray-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <AlertTriangle className="w-4 h-4" />,
  approved: <CheckCircle2 className="w-4 h-4" />,
  confirmed: <CheckCircle2 className="w-4 h-4" />,
  checked_in: <UserCheck className="w-4 h-4" />,
  completed: <CheckCircle2 className="w-4 h-4" />,
  cancelled: <XCircle className="w-4 h-4" />,
};

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
const authHeaders = (extra?: Record<string, string>) => {
  const token = localStorage.getItem("gg_auth_token");
  return { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra };
};

export default function BookingTicketPage() {
  const [, params] = useRoute("/booking-ticket/:id");
  const [, setLocation] = useLocation();
  const id = params?.id;

  const { data: ticket, isLoading, error } = useQuery<any>({
    queryKey: ["ticket", id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/bookings/${id}/ticket`, { credentials: "include", headers: authHeaders() });
      if (!res.ok) throw new Error("Ticket not found");
      return res.json();
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="h-64 bg-muted animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <XCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-serif text-2xl font-bold mb-2">Ticket Not Found</h1>
          <Button onClick={() => setLocation("/customer/bookings")}>My Bookings</Button>
        </div>
      </div>
    );
  }

  const formattedDate = ticket.date
    ? new Date(ticket.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : ticket.date;

  const qrValue = ticket.qrCodeData || ticket.bookingReference || `GG-BOOKING-${ticket.bookingId}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="print:hidden">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 pt-6 flex items-center justify-between">
          <button onClick={() => setLocation(`/bookings/${id}`)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Booking
          </button>
          <Button onClick={() => window.print()} className="gap-2 bg-primary hover:bg-primary/90">
            <Printer className="w-4 h-4" /> Print / Download
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 print:py-0 print:px-0">
        {/* Ticket Card */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-xl border border-border print:shadow-none print:border-gray-200">
          {/* Ticket Header */}
          <div className="bg-primary px-8 py-6 text-primary-foreground">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-widest opacity-70 mb-1">Gorilla Guardians Village</div>
                <h1 className="font-serif text-2xl font-bold leading-tight">
                  {ticket.experience?.title ?? "Experience Ticket"}
                </h1>
                <div className="mt-2 flex items-center gap-2">
                  <Badge className={`capitalize text-xs border ${STATUS_COLORS[ticket.status] ?? "bg-white/20"}`}>
                    <span className="flex items-center gap-1">
                      {STATUS_ICONS[ticket.status]}
                      {ticket.status.replace("_", " ")}
                    </span>
                  </Badge>
                </div>
              </div>
              <div className="text-right opacity-80">
                <div className="text-xs">Type</div>
                <div className="text-sm font-semibold capitalize">{ticket.experience?.type ?? "Experience"}</div>
              </div>
            </div>
          </div>

          {/* Ticket Tear Line */}
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-gray-50 -ml-3 shrink-0 border-r border-dashed border-border" />
            <div className="flex-1 border-t border-dashed border-border" />
            <div className="w-6 h-6 rounded-full bg-gray-50 -mr-3 shrink-0" />
          </div>

          {/* Ticket Body */}
          <div className="px-8 py-6">
            <div className="flex flex-col sm:flex-row items-start gap-8">
              {/* Left: booking info */}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Date</div>
                    <div className="font-semibold text-sm">{formattedDate}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Guests</div>
                    <div className="font-semibold text-sm">{ticket.participants} {ticket.participants === 1 ? "person" : "people"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Paid</div>
                    <div className="font-bold text-primary">${Number(ticket.totalAmount).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Payment</div>
                    <div className={`font-semibold text-sm capitalize ${ticket.paymentStatus === "paid" ? "text-green-700" : "text-amber-700"}`}>
                      {ticket.paymentStatus}
                    </div>
                  </div>
                  {ticket.customer && (
                    <div className="col-span-2">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Guest Name</div>
                      <div className="font-semibold text-sm">{ticket.customer.name}</div>
                    </div>
                  )}
                  {ticket.guide && (
                    <div className="col-span-2">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Your Guide</div>
                      <div className="font-semibold text-sm">{ticket.guide.name}</div>
                      {ticket.guide.languages?.length > 0 && (
                        <div className="text-xs text-muted-foreground">{ticket.guide.languages.join(", ")}</div>
                      )}
                    </div>
                  )}
                  {ticket.experience?.meetingPoint && (
                    <div className="col-span-2">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Meeting Point</div>
                      <div className="text-sm">{ticket.experience.meetingPoint}</div>
                    </div>
                  )}
                  {ticket.checkinAt && (
                    <div className="col-span-2">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Checked In</div>
                      <div className="text-sm text-purple-700 font-semibold">{new Date(ticket.checkinAt).toLocaleString()}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: QR code */}
              <div className="flex flex-col items-center gap-3 shrink-0">
                <div className="bg-white p-3 rounded-xl border-2 border-gray-100 shadow-sm">
                  <QRCodeSVG value={qrValue} size={140} level="M" />
                </div>
                <div className="text-center">
                  <code className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded block">
                    {ticket.bookingReference}
                  </code>
                  <div className="text-xs text-muted-foreground mt-1">Scan to verify</div>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Footer */}
          <div className="bg-muted/30 px-8 py-4 border-t border-border">
            <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
              <span>Booking #{ticket.bookingId}</span>
              <span>Issued: {new Date(ticket.issuedAt).toLocaleDateString()}</span>
              <span>gorillaguardians.rw</span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4 print:hidden">
          Use browser Print (Ctrl/Cmd + P) to save as PDF or print this ticket.
        </p>
      </div>
    </div>
  );
}
