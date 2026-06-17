import { Link } from "wouter";
import { motion } from "framer-motion";
import { Layers, TreePine, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useListPackages } from "@workspace/api-client-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function PackagesPage() {
  const { data: packages, isLoading } = useListPackages();
  const packageList: any[] = Array.isArray(packages) ? packages : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground py-24 overflow-hidden">
        <div className="absolute inset-0 imigongo-pattern opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge className="bg-accent text-accent-foreground mb-4">Save More, Experience More</Badge>
            <h1 className="font-serif text-5xl font-bold mb-4">Experience Packages</h1>
            <p className="text-xl opacity-80 max-w-2xl mx-auto">
              Bundle related experiences together — like a Gorilla Trek with a Cultural Village Visit — at one combined price.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse"><div className="aspect-video bg-muted" /><CardContent className="p-5 space-y-3"><div className="h-5 bg-muted rounded w-3/4" /><div className="h-3 bg-muted rounded" /></CardContent></Card>
            ))}
          </div>
        ) : packageList.length === 0 ? (
          <div className="text-center py-20">
            <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-semibold text-lg mb-2">No packages available yet</h2>
            <p className="text-muted-foreground text-sm mb-6">Check back soon, or browse individual experiences.</p>
            <Link href="/experiences"><Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Browse Experiences</Button></Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packageList.map((pkg: any, i: number) => {
              const discountedPrice = pkg.price * (1 - (pkg.discountPercent ?? 0) / 100);
              return (
                <motion.div key={pkg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                  <Link href={`/packages/${pkg.id}`}>
                    <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-border h-full" data-testid={`card-package-${pkg.id}`}>
                      <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 relative overflow-hidden">
                        {pkg.images?.length > 0 ? (
                          <img src={pkg.images[0]} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center imigongo-pattern">
                            <Layers className="w-14 h-14 text-primary/30" />
                          </div>
                        )}
                        {pkg.discountPercent > 0 && (
                          <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground">Save {pkg.discountPercent}%</Badge>
                        )}
                      </div>
                      <CardContent className="p-5 flex flex-col h-full">
                        <h3 className="font-serif font-bold text-lg mb-2 group-hover:text-primary transition-colors">{pkg.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{pkg.description}</p>
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {pkg.experiences?.map((exp: any) => (
                            <Badge key={exp.id} variant="outline" className="text-xs gap-1">
                              <TreePine className="w-3 h-3" /> {exp.title}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            {pkg.discountPercent > 0 && (
                              <span className="text-xs text-muted-foreground line-through mr-1.5">${pkg.price}</span>
                            )}
                            <span className="text-2xl font-bold text-primary">${discountedPrice.toFixed(0)}</span>
                            <span className="text-xs text-muted-foreground"> / person</span>
                          </div>
                          <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5">
                            View <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
