import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { BookOpen, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useListStories } from "@workspace/api-client-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const TYPES = ["all", "artisan", "culture", "conservation"];

export default function StoriesPage() {
  const [type, setType] = useState("all");
  const { data: stories, isLoading, isError, error } = useListStories({ type: type !== "all" ? type : undefined });
  if (isError) console.error("[Stories] API error", error);
  const storyList = Array.isArray(stories) ? stories : [];
  const filtered = type === "all" ? storyList : storyList.filter((s: any) => s.type === type);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge className="bg-accent text-accent-foreground mb-4">Cultural Storytelling</Badge>
            <h1 className="font-serif text-5xl font-bold mb-4">Stories from Rwanda</h1>
            <p className="text-lg opacity-80 max-w-2xl mx-auto">
              The lives, culture, and conservation stories behind every piece sold through Gorilla Guardians Village.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Type filter */}
        <div className="flex flex-wrap gap-2 mb-10">
          {TYPES.map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors border ${type === t ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40"}`}
              data-testid={`button-filter-story-${t}`}
            >
              {t === "all" ? "All Stories" : t}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-muted" />
                <CardContent className="p-5 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No stories found.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((story: any, i) => (
              <motion.div key={story.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Link href={`/stories/${story.id}`}>
                  <Card className="group hover:shadow-lg transition-all cursor-pointer overflow-hidden h-full" data-testid={`card-story-${story.id}`}>
                    <div className="aspect-video bg-gradient-to-br from-primary/8 to-secondary/8 flex items-center justify-center imigongo-pattern relative">
                      {story.coverImage ? (
                        <img src={story.coverImage} alt={story.title} className="w-full h-full object-cover absolute inset-0" />
                      ) : (
                        <div className="text-center p-4">
                          <BookOpen className="w-10 h-10 text-primary/30 mx-auto" />
                        </div>
                      )}
                      <Badge className={`absolute top-3 left-3 capitalize text-xs ${
                        story.type === "artisan" ? "bg-green-100 text-green-800" :
                        story.type === "culture" ? "bg-blue-100 text-blue-800" :
                        "bg-primary/10 text-primary"
                      }`}>{story.type}</Badge>
                    </div>
                    <CardContent className="p-5">
                      <h3 className="font-serif font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">{story.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{story.excerpt}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(story.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      </div>
                      {Array.isArray(story.tags) && story.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {story.tags.slice(0, 3).map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      )}
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
