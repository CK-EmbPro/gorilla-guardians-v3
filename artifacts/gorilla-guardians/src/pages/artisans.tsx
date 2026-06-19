import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Search, Star, Package, Users, Award } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useListArtisans } from "@workspace/api-client-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function ArtisansPage() {
  const [search, setSearch] = useState("");
  const { data: artisansData, isLoading, isError, error } = useListArtisans({ search: search || undefined, limit: 20 });
  if (isError) console.error("[Artisans] API error", error);
  const artisans = Array.isArray(artisansData) ? artisansData : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge className="bg-accent text-accent-foreground mb-4">The Makers</Badge>
            <h1 className="font-serif text-5xl font-bold mb-4">Meet Our Artisans</h1>
            <p className="text-lg opacity-80 max-w-2xl mx-auto">
              Former poachers turned conservation ambassadors. Master craftspeople. Community leaders. The people behind every piece you buy.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search */}
        <div className="relative max-w-md mb-10">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search artisans..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-artisans"
          />
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-muted" />
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : artisans.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No artisans found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {artisans.map((artisan: any, i) => (
              <motion.div key={artisan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Link href={`/artisans/${artisan.id}`}>
                  <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-border" data-testid={`card-artisan-${artisan.id}`}>
                    <div className="aspect-[4/3] relative overflow-hidden">
                      {artisan.photo ? (
                        <img src={artisan.photo} alt={artisan.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-testid={`img-artisan-${artisan.id}`} />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center imigongo-pattern">
                          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-3xl font-serif font-bold text-primary/60">{artisan.name.charAt(0)}</span>
                          </div>
                        </div>
                      )}
                      {artisan.isConservationAmbassador && (
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-accent text-accent-foreground text-xs gap-1">
                            <Award className="w-3 h-3" /> Ambassador
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors" data-testid={`text-artisan-name-${artisan.id}`}>{artisan.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{artisan.biography}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {Array.isArray(artisan.skills) && artisan.skills.slice(0, 2).map((skill: string) => (
                          <Badge key={skill} variant="secondary" className="text-xs capitalize">{skill}</Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          <span>{artisan.productCount ?? 0} products</span>
                        </div>
                        {artisan.averageRating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-accent text-accent" />
                            <span>{artisan.averageRating}</span>
                          </div>
                        )}
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
