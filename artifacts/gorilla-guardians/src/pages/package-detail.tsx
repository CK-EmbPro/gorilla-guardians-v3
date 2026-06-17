import { useState, useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { Layers, TreePine, Calendar, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useGetPackage, useBookPackage, getGetPackageQueryKey } from "@workspace/api-client-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/trackEvent";

export default function PackageDetailPage() {
  const [, params] = useRoute("/packages/:id");
  const [, setLocation] = useLocation();
  const id = Number(params?.id);
  const { toast } = useToast();

  useEffect(() => {
    if (id) trackEvent("view_package", id);
  }, [id]);

  const { data: pkg, isLoading } = useGetPackage(id, { query: { enabled: !!id, queryKey: getGetPackageQueryKey(id) } });
  const bookPackage = useBookPackage();

  const [date, setDate] = useState("");
  const [participants, setParticipants] = useState(1);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-16 animate-pulse">
          <div className="aspect-video bg-muted rounded-2xl mb-8" />
          <div className="h-8 bg-muted rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-24 text-center">
          <h2 className="font-serif text-2xl font-bold mb-4">Package not found</h2>
          <Link href="/packages"><Button>Back to Packages</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const discountedPrice = (pkg as any).price * (1 - ((pkg as any).discountPercent ?? 0) / 100);
  const totalCost = discountedPrice * participants;
  const experiences: any[] = (pkg as any).experiences ?? [];
  const maxParticipants = Math.min(...experiences.map(e => e.capacity), 99);

  const handleBook = () => {
    if (!date) { toast({ title: "Please select a date", variant: "destructive" }); return; }
    bookPackage.mutate({ id, data: { date, participants } }, {
      onSuccess: (res: any) => {
        toast({ title: "Package booked!", description: `Reference: ${res.packageBookingRef}` });
        setLocation(`/customer/bookings`);
      },
      onError: (err: any) => {
        toast({ title: "Could not complete booking", description: err?.message ?? "Please try a different date.", variant: "destructive" });
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="aspect-[21/9] bg-gradient-to-br from-primary/10 to-secondary/10 relative overflow-hidden max-h-[500px]">
        {(pkg as any).images?.length > 0 ? (
          <img src={(pkg as any).images[0]} alt={(pkg as any).title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center imigongo-pattern">
            <Layers className="w-20 h-20 text-primary/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-8 left-8">
          <Badge className="bg-accent text-accent-foreground mb-2">Experience Package</Badge>
          <h1 className="font-serif text-4xl font-bold text-white">{(pkg as any).title}</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="font-serif text-2xl font-bold mb-3">About This Package</h2>
              <p className="text-muted-foreground leading-relaxed">{(pkg as any).description}</p>
            </div>

            <div>
              <h2 className="font-serif text-2xl font-bold mb-4">What's Included</h2>
              <div className="space-y-3">
                {experiences.map(exp => (
                  <Card key={exp.id} className="border-border">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <TreePine className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{exp.title}</h3>
                        <p className="text-xs text-muted-foreground">{exp.duration} · Up to {exp.capacity} people</p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Card className="sticky top-24 shadow-xl border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-baseline gap-2 mb-1">
                  {(pkg as any).discountPercent > 0 && (
                    <span className="text-sm text-muted-foreground line-through">${(pkg as any).price}</span>
                  )}
                  <span className="text-3xl font-bold text-primary">${discountedPrice.toFixed(0)}</span>
                  <span className="text-muted-foreground text-sm">/ person</span>
                </div>
                {(pkg as any).discountPercent > 0 && (
                  <p className="text-xs text-accent-foreground bg-accent/20 inline-block px-2 py-0.5 rounded mb-4">
                    Save {(pkg as any).discountPercent}% vs booking separately
                  </p>
                )}

                <div className="space-y-4 mb-6 mt-4">
                  <div>
                    <Label className="text-sm font-medium">Date (applies to every included experience)</Label>
                    <Input
                      type="date"
                      value={date}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={e => setDate(e.target.value)}
                      className="mt-1"
                      data-testid="input-package-date"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Participants</Label>
                    <div className="flex items-center border border-border rounded-lg mt-1">
                      <button onClick={() => setParticipants(p => Math.max(1, p - 1))} className="px-3 py-2 hover:bg-muted">−</button>
                      <span className="flex-1 text-center font-medium">{participants}</span>
                      <button onClick={() => setParticipants(p => Math.min(maxParticipants || 99, p + 1))} className="px-3 py-2 hover:bg-muted">+</button>
                    </div>
                  </div>
                </div>

                <Separator className="mb-4" />
                <div className="flex justify-between font-bold mb-4">
                  <span>Total</span>
                  <span className="text-primary">${totalCost.toFixed(2)}</span>
                </div>

                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={handleBook}
                  disabled={bookPackage.isPending}
                  data-testid="button-book-package"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {bookPackage.isPending ? "Booking..." : "Book This Package"}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-3">
                  Creates one booking per included experience. No payment required until each is confirmed.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
