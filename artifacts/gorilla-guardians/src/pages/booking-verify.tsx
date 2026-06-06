import { useState } from "react";
import { useSearch } from "wouter";
import { QRCodeSVG } from "qrcode.react";
import { Search, CheckCircle2, XCircle, AlertTriangle, UserCheck, Users, Calendar, DollarSign, User, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { useAuth } from "@/lib/auth";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-blue-100 text-blue-800 border-blue-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  checked_in: "bg-purple-100 text-purple-800 border-purple-200",
  completed: "bg-gray-100 text-gray-700 border-gray-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

export default function BookingVerifyPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const [ref, setRef] = useState(params.get("ref") ?? "");
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleVerify = async () => {
    if (!ref.trim()) { toast({ title: "Enter a booking reference", variant: "destructive" }); return; }
    setLoading(true);
    setNotFound(false);
    setBooking(null);
    try {
      const res = await fetch("/api/bookings/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ref: ref.trim().toUpperCase() }),
      });
      if (res.status === 404) { setNotFound(true); return; }
      if (!res.ok) throw new Error("Verification failed");
      setBooking(await res.json());
    } catch {
      toast({ title: "Verification failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async () => {
    if (!booking) return;
    setCheckingIn(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/checkin`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.status === 409) {
        toast({ title: "Already checked in", description: `Checked in at ${new Date(data.checkinAt).toLocaleString()}` });
        setBooking(data.booking);
        return;
      }
      if (!res.ok) { toast({ title: data.error ?? "Check-in failed", variant: "destructive" }); return; }
      toast({ title: "✓ Checked in successfully!", description: `${booking.user?.name} is now checked in.` });
      setBooking(data.booking);
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setCheckingIn(false);
    }
  };

  const isStaff = user && ["staff", "admin", "super_admin"].includes(user.role);
  const canCheckin = booking && ["approved", "confirmed"].includes(booking.status) && !booking.checkinAt;

  const formattedDate = booking?.date
    ? new Date(booking.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : booking?.date;

  const content = (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold mb-1 flex items-center gap-2">
          <ScanLine className="w-6 h-6 text-primary" /> QR Code Verification
        </h1>
        <p className="text-muted-foreground text-sm">Enter or scan a booking reference to verify and check in a visitor.</p>
      </div>

      {/* Search */}
      <Card className="border-border mb-6">
        <CardContent className="p-5">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9 font-mono uppercase"
                placeholder="GG-XXXXXXXX"
                value={ref}
                onChange={e => setRef(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === "Enter" && handleVerify()}
              />
            </div>
            <Button className="bg-primary hover:bg-primary/90 gap-2" onClick={handleVerify} disabled={loading}>
              {loading ? "Verifying..." : "Verify"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Not found */}
      {notFound && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="font-semibold text-red-700 text-lg mb-1">Booking Not Found</h3>
            <p className="text-red-600 text-sm">No booking found with reference <code className="font-mono">{ref}</code>. Please check the reference and try again.</p>
          </CardContent>
        </Card>
      )}

      {/* Booking Result */}
      {booking && (
        <div className="space-y-4">
          {/* Status Banner */}
          <div className={`rounded-xl p-4 border-2 flex items-center gap-4 ${
            booking.checkinAt ? "bg-purple-50 border-purple-200" :
            booking.status === "confirmed" || booking.status === "approved" ? "bg-green-50 border-green-200" :
            booking.status === "cancelled" ? "bg-red-50 border-red-200" :
            "bg-yellow-50 border-yellow-200"
          }`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
              booking.checkinAt ? "bg-purple-100" :
              booking.status === "confirmed" || booking.status === "approved" ? "bg-green-100" :
              "bg-yellow-100"
            }`}>
              {booking.checkinAt
                ? <UserCheck className="w-6 h-6 text-purple-600" />
                : booking.status === "confirmed" || booking.status === "approved"
                  ? <CheckCircle2 className="w-6 h-6 text-green-600" />
                  : <AlertTriangle className="w-6 h-6 text-yellow-600" />}
            </div>
            <div className="flex-1">
              <div className="font-bold text-base">{
                booking.checkinAt ? "Already Checked In" :
                booking.status === "confirmed" || booking.status === "approved" ? "Valid — Ready to Check In" :
                booking.status === "cancelled" ? "Booking Cancelled" :
                "Booking Pending Approval"
              }</div>
              {booking.checkinAt && (
                <div className="text-sm text-purple-700">Checked in at {new Date(booking.checkinAt).toLocaleString()}</div>
              )}
            </div>
            <Badge className={`capitalize border ${STATUS_COLORS[booking.status] ?? "bg-muted"}`}>
              {booking.status.replace("_", " ")}
            </Badge>
          </div>

          {/* Booking Details */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{booking.experience?.title ?? "Experience"}</CardTitle>
                  <code className="text-sm font-mono text-primary font-bold">{booking.bookingReference}</code>
                </div>
                {booking.qrCodeData && (
                  <div className="bg-white p-2 rounded-lg border border-border">
                    <QRCodeSVG value={booking.qrCodeData} size={80} level="M" />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <div>
                    <div className="text-xs text-muted-foreground">Guest</div>
                    <div className="font-semibold">{booking.user?.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{booking.user?.email ?? ""}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <div>
                    <div className="text-xs text-muted-foreground">Date</div>
                    <div className="font-semibold text-xs">{formattedDate}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <div>
                    <div className="text-xs text-muted-foreground">Participants</div>
                    <div className="font-semibold">{booking.participants} {booking.participants === 1 ? "person" : "people"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <div>
                    <div className="text-xs text-muted-foreground">Amount</div>
                    <div className="font-semibold">${Number(booking.totalAmount).toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {booking.guide && (
                <div className="bg-muted/40 rounded-lg p-3 text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">Guide:</span>
                  <span className="font-medium">{booking.guide.name}</span>
                </div>
              )}

              {isStaff && (
                <div className="pt-2">
                  {canCheckin ? (
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
                      onClick={handleCheckin}
                      disabled={checkingIn}
                    >
                      <UserCheck className="w-4 h-4" />
                      {checkingIn ? "Checking In..." : "Check In Visitor"}
                    </Button>
                  ) : booking.checkinAt ? (
                    <div className="w-full bg-purple-100 text-purple-700 font-semibold text-sm py-3 px-4 rounded-lg text-center flex items-center justify-center gap-2">
                      <UserCheck className="w-4 h-4" /> Checked In at {new Date(booking.checkinAt).toLocaleTimeString()}
                    </div>
                  ) : booking.status === "cancelled" ? (
                    <div className="w-full bg-red-100 text-red-700 font-semibold text-sm py-3 px-4 rounded-lg text-center flex items-center justify-center gap-2">
                      <XCircle className="w-4 h-4" /> Booking Cancelled — Cannot Check In
                    </div>
                  ) : (
                    <div className="w-full bg-yellow-100 text-yellow-700 font-semibold text-sm py-3 px-4 rounded-lg text-center flex items-center justify-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Booking Pending — Not Yet Ready for Check-In
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full" onClick={() => { setBooking(null); setRef(""); setNotFound(false); }}>
            Verify Another Booking
          </Button>
        </div>
      )}
    </div>
  );

  if (isStaff) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {content}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-10">{content}</main>
    </div>
  );
}
