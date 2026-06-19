import { useRoute, Link } from "wouter";
import { Calendar, ArrowLeft, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGetStory, getGetStoryQueryKey } from "@workspace/api-client-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function StoryDetailPage() {
  const [, params] = useRoute("/stories/:id");
  const id = Number(params?.id);
  const { data: story, isLoading, isError, error } = useGetStory(id, { query: { enabled: !!id, queryKey: getGetStoryQueryKey(id) } });
  if (isError) console.error("[StoryDetail] API error", error);
  const resolvedStory = (story as any) ?? null;
  const s = resolvedStory;

  if (isLoading && !resolvedStory) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-16 animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="aspect-video bg-muted rounded-2xl" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-4 bg-muted rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!resolvedStory) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <h2 className="font-serif text-2xl font-bold mb-4">Story not found</h2>
          <Link href="/stories"><Button>Back to Stories</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/stories" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Stories
        </Link>
        <div className="mb-6">
          <Badge className={`capitalize mb-4 ${
            s.type === "artisan" ? "bg-green-100 text-green-800" :
            s.type === "culture" ? "bg-blue-100 text-blue-800" :
            "bg-primary/10 text-primary"
          }`}>{s.type}</Badge>
          <h1 className="font-serif text-4xl lg:text-5xl font-bold mb-4 leading-tight">{s.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{new Date(s.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
          </div>
        </div>

        {/* Cover image */}
        <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl overflow-hidden mb-8">
          {s.coverImage ? (
            <img src={s.coverImage} alt={s.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center imigongo-pattern">
              <BookOpen className="w-16 h-16 text-primary/30" />
            </div>
          )}
        </div>

        {/* Lead text */}
        <p className="text-xl text-muted-foreground leading-relaxed mb-8 border-l-4 border-primary/40 pl-4 italic">{s.excerpt}</p>

        {/* Content */}
        <div className="prose prose-neutral max-w-none">
          {s.content?.split("\n\n").map((paragraph: string, i: number) => (
            <p key={i} className="mb-6 leading-relaxed text-foreground/80">{paragraph}</p>
          ))}
        </div>

        {/* Tags */}
        {s.tags?.length > 0 && (
          <div className="mt-10 pt-6 border-t border-border">
            <div className="flex flex-wrap gap-2">
              {s.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-muted-foreground mb-4">Enjoyed this story? Support the artisans who inspire it.</p>
          <Link href="/products">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Shop Handcrafted Products</Button>
          </Link>
        </div>
      </article>
      <Footer />
    </div>
  );
}
