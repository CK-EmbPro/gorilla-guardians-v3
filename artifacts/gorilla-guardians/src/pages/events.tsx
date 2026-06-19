import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Calendar, MapPin, Globe, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useListEvents } from "@workspace/api-client-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function EventsPage() {
  const [, navigate] = useLocation();
  const { data: events, isLoading, isError, error } = useListEvents({ upcoming: true });
  if (isError) console.error("[Events] API error", error);
  const eventList = Array.isArray(events) ? events : [];

  const TYPE_COLORS: Record<string, string> = {
    festival: "bg-accent/20 text-amber-800",
    exhibition: "bg-blue-100 text-blue-800",
    workshop: "bg-green-100 text-green-800",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge className="bg-accent text-accent-foreground mb-4">Coming Up</Badge>
            <h1 className="font-serif text-5xl font-bold mb-4">Events & Festivals</h1>
            <p className="text-lg opacity-80 max-w-2xl mx-auto">Cultural festivals, virtual showcases, and artisan exhibitions celebrating Rwandan heritage.</p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Card key={i} className="h-40 animate-pulse" />)
        ) : eventList.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No upcoming events.</p>
          </div>
        ) : (
          eventList.map((event: any, i) => (
            <motion.div key={event.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow border-border" data-testid={`card-event-${event.id}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Date badge */}
                    <div className="shrink-0 text-center bg-primary/5 rounded-xl px-6 py-4 min-w-20">
                      <div className="text-2xl font-serif font-bold text-primary">
                        {new Date(event.startDate).getDate()}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">
                        {new Date(event.startDate).toLocaleDateString("en-US", { month: "short" })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(event.startDate).getFullYear()}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge className={`capitalize text-xs ${TYPE_COLORS[event.type] ?? "bg-muted"}`}>{event.type}</Badge>
                        {event.isOnline && (
                          <Badge variant="outline" className="text-xs gap-1"><Globe className="w-3 h-3" /> Online Event</Badge>
                        )}
                      </div>
                      <h3 className="font-serif text-xl font-bold mb-2" data-testid={`text-event-title-${event.id}`}>{event.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{event.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-primary" />
                          <span>
                            {new Date(event.startDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                            {event.endDate && ` – ${new Date(event.endDate).toLocaleDateString("en-US", { month: "long", day: "numeric" })}`}
                          </span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <Link href={`/events/${event.id}`}>
                        <Button variant="ghost" className="text-primary" data-testid={`button-event-details-${event.id}`}>
                          View Details
                        </Button>
                      </Link>
                      <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground" onClick={() => navigate(`/events/${event.id}`)} data-testid={`button-event-register-${event.id}`}>
                        Register Interest
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
      <Footer />
    </div>
  );
}
