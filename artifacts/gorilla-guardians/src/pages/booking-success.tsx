import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Calendar, Users, Clock, ArrowRight, Ticket, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

export default function BookingSuccessPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const search = useSearch();
  const params = new URLSearchParams(search);

  const experienceName = params.get("experience") ?? "Your Experience";
  const date = params.get("date") ?? "";
  const participants = params.get("participants") ?? "1";
  const total = params.get("total");
  const bookingId = params.get("bookingId");

  // Fetch booking to get the booking reference
  const { data: booking } = useQuery<any>({
    queryKey: ["booking-success", bookingId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/bookings/${bookingId}`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!bookingId,
    staleTime: 1000 * 60 * 5,
  });

  const bookingRef = booking?.bookingReference ?? null;

  const copyRef = () => {
    if (bookingRef) {
      navigator.clipboard.writeText(bookingRef).then(() => {
        toast({ title: "Copied!", description: "Booking reference copied to clipboard." });
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-full bg-green-100 mx-auto mb-5 flex items-center justify-center">
            <CheckCircle2 className="w-11 h-11 text-green-600" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-primary mb-3">Booking Submitted!</h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Your booking has been received. Our team will confirm it within 24 hours.
          </p>
        </div>

        {/* Booking Reference — prominent */}
        {bookingRef && (
          <Card className="mb-5 border-2 border-primary/20 bg-primary/5">
            <CardContent className="p-5 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Your Booking Reference</p>
              <div className="flex items-center justify-center gap-3">
                <code className="text-3xl font-mono font-bold text-primary tracking-wider">{bookingRef}</code>
                <button onClick={copyRef} className="p-2 rounded-lg hover:bg-primary/10 transition-colors" title="Copy reference">
                  <Copy className="w-5 h-5 text-primary" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Keep this reference to track and manage your booking.</p>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6 border-green-200 bg-green-50/40">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-semibold text-lg text-primary mb-2">Booking Summary</h2>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-base">{experienceName}</div>
                {date && <div className="text-sm text-muted-foreground mt-0.5">📅 {new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>}
              </div>
            </div>

            <Separator />

            {bookingId && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Booking ID</span>
                <span className="font-semibold">#{bookingId}</span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Participants
              </span>
              <span className="font-semibold">{participants} {Number(participants) === 1 ? "person" : "people"}</span>
            </div>

            {total && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold text-primary">${total}</span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="text-amber-600 font-semibold">⏳ Pending Confirmation</span>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> What Happens Next?
            </h3>
            <div className="space-y-3">
              {[
                { icon: "📧", text: "You'll receive an email confirmation shortly" },
                { icon: "✅", text: "Our team reviews and approves your booking (within 24h)" },
                { icon: "🎫", text: "Once approved, your digital ticket with QR code will be ready" },
                { icon: "🦍", text: "Get ready for an unforgettable Rwandan experience!" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            onClick={() => setLocation(bookingId ? `/bookings/${bookingId}` : "/customer/bookings")}
            data-testid="button-view-bookings"
          >
            <Calendar className="w-4 h-4" />
            View Booking Details
          </Button>
          {bookingId && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setLocation(`/booking-ticket/${bookingId}`)}
            >
              <Ticket className="w-4 h-4" /> View Ticket
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setLocation("/experiences")}
            data-testid="button-browse-experiences"
          >
            Browse More Experiences
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
