import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Star, Clock, Users, Filter, TreePine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListExperiences } from "@workspace/api-client-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const EXPERIENCE_TYPES = ["all", "tour", "homestay", "workshop", "cooking", "dance"];
const TYPE_COLORS: Record<string, string> = {
  tour: "bg-primary/10 text-primary border-primary/20",
  homestay: "bg-secondary/10 text-secondary border-secondary/20",
  workshop: "bg-accent/20 text-amber-800 border-accent/30",
  cooking: "bg-orange-100 text-orange-800 border-orange-200",
  dance: "bg-purple-100 text-purple-800 border-purple-200",
};

export default function ExperiencesPage() {
  const [type, setType] = useState("all");
  const [priceSort, setPriceSort] = useState("all");

  const { data: expData, isLoading, isError, error } = useListExperiences({
    type: type !== "all" ? type : undefined,
    limit: 20,
  });
  if (isError) console.error("[Experiences] API error", error);
  const experiences = expData?.experiences ?? [];
  const filtered = type === "all" ? experiences : experiences.filter((e: any) => e.type === type);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground py-24 overflow-hidden">
        <div className="absolute inset-0 imigongo-pattern opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge className="bg-accent text-accent-foreground mb-4">Come to Rwanda</Badge>
            <h1 className="font-serif text-5xl font-bold mb-4">Immersive Experiences</h1>
            <p className="text-xl opacity-80 max-w-2xl mx-auto">
              Trek gorillas. Weave baskets. Cook Rwandan food. Stay with artisan families. Experience the culture that creates every piece you buy.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filter bar */}
        <div className="flex flex-wrap gap-3 mb-10 items-center">
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE_TYPES.map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors border ${
                  type === t ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40"
                }`}
                data-testid={`button-filter-${t}`}
              >
                {t === "all" ? "All Experiences" : t}
              </button>
            ))}
          </div>
          <div className="ml-auto">
            <Select value={priceSort} onValueChange={setPriceSort}>
              <SelectTrigger className="w-44" data-testid="select-sort-experiences">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Sort by</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="rating">Top Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Experience cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-muted" />
                <CardContent className="p-5 space-y-3">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No experiences found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((exp: any, i) => (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <Link href={`/experiences/${exp.id}`}>
                  <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-border h-full" data-testid={`card-experience-${exp.id}`}>
                    <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 relative overflow-hidden">
                      {exp.images?.length > 0 ? (
                        <img src={exp.images[0]} alt={exp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center imigongo-pattern">
                          <TreePine className="w-14 h-14 text-primary/30" />
                        </div>
                      )}
                      <Badge className={`absolute top-3 left-3 capitalize text-xs border ${TYPE_COLORS[exp.type] ?? "bg-muted"}`}>{exp.type}</Badge>
                      {exp.averageRating && (
                        <div className="absolute top-3 right-3 bg-white/90 rounded-full px-2 py-0.5 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-accent text-accent" />
                          <span className="text-xs font-medium text-foreground">{exp.averageRating}</span>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-5 flex flex-col h-full">
                      <h3 className="font-serif font-bold text-lg mb-2 group-hover:text-primary transition-colors">{exp.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{exp.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {exp.duration}</span>
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Up to {exp.capacity}</span>
                      </div>
                      {Array.isArray(exp.includedItems) && exp.includedItems.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {exp.includedItems.slice(0, 2).map((item: string) => (
                            <Badge key={item} variant="outline" className="text-xs">{item}</Badge>
                          ))}
                          {exp.includedItems.length > 2 && (
                            <Badge variant="outline" className="text-xs">+{exp.includedItems.length - 2} more</Badge>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-bold text-primary" data-testid={`text-price-exp-${exp.id}`}>${exp.price}</span>
                          <span className="text-xs text-muted-foreground"> / person</span>
                        </div>
                        <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground" data-testid={`button-book-${exp.id}`}>
                          Book Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
