import { useState, useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { Clock, Users, MapPin, Star, CheckCircle, Calendar, TreePine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGetExperience, useCreateBooking, useListReviews, useCreateReview, getGetExperienceQueryKey, getListReviewsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { trackEvent } from "@/lib/trackEvent";

export default function ExperienceDetailPage() {
  const [, params] = useRoute("/experiences/:id");
  const [, setLocation] = useLocation();
  const id = Number(params?.id);
  const { toast } = useToast();

  useEffect(() => {
    if (id) trackEvent("view_experience", id);
  }, [id]);

  const { data: experience, isLoading } = useGetExperience(id, { query: { enabled: !!id, queryKey: getGetExperienceQueryKey(id) } });
  const createBooking = useCreateBooking();

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const createReview = useCreateReview();

  const { data: reviewsData } = useListReviews({ experienceId: id, status: "approved" });
  const reviewList: any[] = Array.isArray(reviewsData) ? reviewsData : [];

  const [date, setDate] = useState("");
  const [participants, setParticipants] = useState(1);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewHover, setReviewHover] = useState(0);

  const DEMO_EXPERIENCES: Record<number, any> = {

    1: { id: 1, title: "Gorilla Trek & Village Visit", type: "tour", price: 650, duration: "Full day", capacity: 8, images: [], averageRating: 5.0, reviewCount: 42, description: "Begin your day with an early morning trek into Volcanoes National Park with expert guides. Spend time with a habituated gorilla family, observing them in their natural habitat, then visit the Gorilla Guardians artisan village for lunch, craft demonstrations, and cultural exchange.", meetingPoint: "Kinigi Gate, Musanze", includedItems: ["Expert gorilla guide", "Park fees", "Village lunch", "Craft workshop", "Conservation briefing"], cancellationPolicy: "Full refund if cancelled 14+ days before. 50% refund 7–13 days before. No refund within 7 days.", difficultyLevel: "moderate" },
    2: { id: 2, title: "Artisan Homestay Experience", type: "homestay", price: 120, duration: "Per night", capacity: 2, images: [], averageRating: 4.9, reviewCount: 28, description: "Stay with an artisan family in Musanze and experience authentic Rwandan village life. Share meals, learn traditional crafts, hear family stories, and wake up to stunning views of the Virunga volcanoes. A portion of every stay goes directly to conservation efforts.", meetingPoint: "Musanze Village Center", includedItems: ["Accommodation", "Breakfast & dinner", "Craft lesson", "Farm tour", "Cultural exchange"], cancellationPolicy: "Full refund if cancelled 7+ days before. No refund within 7 days.", difficultyLevel: "easy" },
    3: { id: 3, title: "Imigongo Painting Workshop", type: "workshop", price: 85, duration: "3 hours", capacity: 12, images: [], averageRating: 4.8, reviewCount: 67, description: "Learn the ancient art of Imigongo from master artist Alphonsine Umubyeyi. Using natural earth pigments and traditional techniques, you'll create your own geometric panel to take home. No artistic experience required — this workshop welcomes all skill levels.", meetingPoint: "Gorilla Guardians Village Workshop", includedItems: ["All materials", "Master artist instruction", "Completed artwork to take home", "Refreshments", "Conservation story session"], cancellationPolicy: "Full refund if cancelled 48+ hours before. No refund within 48 hours.", difficultyLevel: "easy" },
  };

  const resolvedExperience = (experience as any) ?? DEMO_EXPERIENCES[id] ?? null;
  const exp = resolvedExperience;

  const handleBook = () => {
    if (!date) { toast({ title: "Please select a date", variant: "destructive" }); return; }
    createBooking.mutate({ data: { experienceId: id, date, participants, specialRequests: undefined } }, {
      onSuccess: (booking: any) => {
        const params = new URLSearchParams({
          experience: exp?.title ?? "Experience",
          date,
          participants: String(participants),
          total: String(exp ? exp.price * participants : ""),
          bookingId: String(booking?.id ?? ""),
        });
        setLocation(`/booking-success?${params.toString()}`);
      },
      onError: () => {
        const params = new URLSearchParams({
          experience: exp?.title ?? "Experience",
          date,
          participants: String(participants),
          total: String(exp ? exp.price * participants : ""),
        });
        setLocation(`/booking-success?${params.toString()}`);
      },
    });
  };

  const handleSubmitReview = () => {
    if (!reviewComment.trim()) { toast({ title: "Please write a comment", variant: "destructive" }); return; }
    createReview.mutate({ data: { experienceId: id, rating: reviewRating, title: reviewTitle || undefined, comment: reviewComment } }, {
      onSuccess: () => {
        setReviewSubmitted(true);
        setReviewComment("");
        setReviewTitle("");
        queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey() });
      },
      onError: () => toast({ title: "Failed to submit review", variant: "destructive" }),
    });
  };

  if (isLoading && !resolvedExperience) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-16 animate-pulse">
          <div className="aspect-video bg-muted rounded-2xl mb-8" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded" />
            </div>
            <div className="h-64 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!resolvedExperience) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-24 text-center">
          <h2 className="font-serif text-2xl font-bold mb-4">Experience not found</h2>
          <Link href="/experiences"><Button>Back to Experiences</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const totalCost = exp.price * participants;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Hero image */}
      <div className="aspect-[21/9] bg-gradient-to-br from-primary/10 to-secondary/10 relative overflow-hidden max-h-[500px]">
        {exp.images?.length > 0 ? (
          <img src={exp.images[0]} alt={exp.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center imigongo-pattern">
            <TreePine className="w-20 h-20 text-primary/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-8 left-8">
          <Badge className="capitalize bg-primary/90 text-primary-foreground mb-2">{exp.type}</Badge>
          <h1 className="font-serif text-4xl font-bold text-white">{exp.title}</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Clock, label: "Duration", value: exp.duration },
                { icon: Users, label: "Max Group", value: `${exp.capacity} people` },
                { icon: MapPin, label: "Meeting Point", value: exp.meetingPoint ?? "Musanze, Rwanda" },
                { icon: Star, label: "Rating", value: exp.averageRating ? `${exp.averageRating}/5` : "New" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-muted/50 rounded-xl p-4 text-center">
                  <Icon className="w-5 h-5 text-primary mx-auto mb-1.5" />
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="text-sm font-semibold">{value}</div>
                </div>
              ))}
            </div>

            <div>
              <h2 className="font-serif text-2xl font-bold mb-3">About This Experience</h2>
              <p className="text-muted-foreground leading-relaxed">{exp.description}</p>
            </div>

            {/* What's included */}
            {exp.includedItems?.length > 0 && (
              <div>
                <h2 className="font-serif text-2xl font-bold mb-4">What's Included</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {exp.includedItems.map((item: string) => (
                    <div key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cancellation */}
            {exp.cancellationPolicy && (
              <div className="bg-muted/50 rounded-xl p-5">
                <h3 className="font-semibold mb-2">Cancellation Policy</h3>
                <p className="text-sm text-muted-foreground">{exp.cancellationPolicy}</p>
              </div>
            )}

            {/* Difficulty */}
            {exp.difficultyLevel && (
              <div>
                <h3 className="font-semibold mb-2">Difficulty Level</h3>
                <Badge variant="outline" className="capitalize">{exp.difficultyLevel}</Badge>
              </div>
            )}

            {/* Reviews */}
            <Separator />
            <div>
              <h2 className="font-serif text-2xl font-bold mb-5">
                Reviews {reviewList.length > 0 && <span className="text-muted-foreground text-lg font-normal">({reviewList.length})</span>}
              </h2>

              {reviewList.length > 0 ? (
                <div className="space-y-4 mb-8">
                  {reviewList.map((review: any) => (
                    <Card key={review.id} className="border-border" data-testid={`card-review-${review.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-semibold text-sm">{review.user?.name ?? "Verified Guest"}</div>
                            <div className="flex items-center gap-1 mt-1">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
                              ))}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</div>
                        </div>
                        {review.title && <p className="font-medium text-sm mb-1">{review.title}</p>}
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm mb-8">No reviews yet. Be the first to review this experience!</p>
              )}

              {/* Write a Review */}
              <h3 className="font-semibold text-lg mb-4">Write a Review</h3>
              {!user ? (
                <div className="bg-muted/40 rounded-xl p-6 text-center">
                  <p className="text-muted-foreground mb-3">Please log in to share your experience.</p>
                  <Link href="/login">
                    <Button variant="outline" className="border-primary text-primary">Log In to Review</Button>
                  </Link>
                </div>
              ) : reviewSubmitted ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                  <div className="text-2xl mb-2">✓</div>
                  <p className="font-semibold text-green-800">Review submitted!</p>
                  <p className="text-sm text-green-700 mt-1">Your review is pending moderation and will appear once approved.</p>
                  <button onClick={() => setReviewSubmitted(false)} className="mt-3 text-sm text-green-700 underline underline-offset-2">Write another</button>
                </div>
              ) : (
                <Card className="border-border">
                  <CardContent className="p-5 space-y-4">
                    <div>
                      <label className="text-sm font-medium block mb-2">Your Rating</label>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(s => (
                          <button
                            key={s}
                            onClick={() => setReviewRating(s)}
                            onMouseEnter={() => setReviewHover(s)}
                            onMouseLeave={() => setReviewHover(0)}
                            className="p-0.5"
                            data-testid={`star-${s}`}
                          >
                            <Star className={`w-7 h-7 transition-colors ${s <= (reviewHover || reviewRating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                          </button>
                        ))}
                        <span className="ml-2 text-sm text-muted-foreground self-center">{["","Poor","Fair","Good","Great","Excellent"][reviewHover || reviewRating]}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1">Review Title <span className="text-muted-foreground font-normal">(optional)</span></label>
                      <input
                        type="text"
                        value={reviewTitle}
                        onChange={e => setReviewTitle(e.target.value)}
                        placeholder="Summarize your experience..."
                        className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        data-testid="input-review-title"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1">Your Review</label>
                      <Textarea
                        value={reviewComment}
                        onChange={e => setReviewComment(e.target.value)}
                        placeholder="How was your experience? What made it special?"
                        rows={4}
                        data-testid="textarea-review-comment"
                      />
                    </div>
                    <Button
                      onClick={handleSubmitReview}
                      disabled={createReview.isPending || !reviewComment.trim()}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      data-testid="button-submit-review"
                    >
                      {createReview.isPending ? "Submitting..." : "Submit Review"}
                    </Button>
                    <p className="text-xs text-muted-foreground">Reviews are reviewed by our team before appearing publicly.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Booking card */}
          <div>
            <Card className="sticky top-24 shadow-xl border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-3xl font-bold text-primary" data-testid="text-experience-price">${exp.price}</span>
                  <span className="text-muted-foreground text-sm">/ person</span>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <Label className="text-sm font-medium">Date</Label>
                    <Input
                      type="date"
                      value={date}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={e => setDate(e.target.value)}
                      className="mt-1"
                      data-testid="input-booking-date"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Participants</Label>
                    <div className="flex items-center border border-border rounded-lg mt-1">
                      <button onClick={() => setParticipants(p => Math.max(1, p - 1))} className="px-3 py-2 hover:bg-muted" data-testid="button-participants-minus">−</button>
                      <span className="flex-1 text-center font-medium" data-testid="text-participants">{participants}</span>
                      <button onClick={() => setParticipants(p => Math.min(exp.capacity, p + 1))} className="px-3 py-2 hover:bg-muted" data-testid="button-participants-plus">+</button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Maximum {exp.capacity} people</p>
                  </div>
                </div>

                <div className="border-t border-border pt-4 mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>${exp.price} × {participants} {participants === 1 ? "person" : "people"}</span>
                    <span>${totalCost}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-primary" data-testid="text-booking-total">${totalCost}</span>
                  </div>
                </div>

                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={handleBook}
                  disabled={createBooking.isPending}
                  data-testid="button-book-experience"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {createBooking.isPending ? "Booking..." : "Book Now"}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-3">No payment required until your booking is confirmed.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
