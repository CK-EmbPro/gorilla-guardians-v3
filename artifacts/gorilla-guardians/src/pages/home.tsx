import { useRef } from "react";
import { Link } from "wouter";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Star, TreePine, Users, Globe, ShoppingBag, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useGetFeaturedProducts, useListArtisans, useListExperiences, useGetImpactStats, useListStories, useListEvents } from "@workspace/api-client-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

function AnimatedCounter({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="text-center">
      <motion.div
        className="text-4xl lg:text-5xl font-serif font-bold text-primary"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.6, type: "spring" }}
      >
        {inView ? value.toLocaleString() : "0"}{suffix}
      </motion.div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

export default function HomePage() {
  const { data: featuredProducts } = useGetFeaturedProducts();
  const { data: artisansData } = useListArtisans({ page: 1, limit: 4 });
  const { data: experiencesData } = useListExperiences({ page: 1, limit: 3 });
  const { data: impact } = useGetImpactStats();
  const { data: stories } = useListStories({ page: 1, limit: 3 });
  const { data: events } = useListEvents({ upcoming: true });

  const artisans = Array.isArray(artisansData) ? artisansData : [];
  const experiences = experiencesData?.experiences ?? [];
  const products = featuredProducts ?? [];
  const storyList = Array.isArray(stories) ? stories.slice(0, 3) : [];
  const eventList = Array.isArray(events) ? events.slice(0, 3) : [];

  // Fallback demo products if API empty
  const demoProducts = products.length > 0 ? products : [
    { id: 1, name: "Imigongo Triangle Panel", price: 125, images: [], artisan: { name: "Alphonsine Umubyeyi" }, averageRating: 4.9, reviewCount: 23 },
    { id: 2, name: "Peace Basket — Sunrise", price: 85, discountPrice: 70, images: [], artisan: { name: "Celestine Mukamana" }, averageRating: 5.0, reviewCount: 41 },
    { id: 3, name: "Gorilla Family Sculpture", price: 280, images: [], artisan: { name: "Emmanuel Nkurunziza" }, averageRating: 4.8, reviewCount: 15 },
    { id: 4, name: "Beaded Necklace", price: 45, discountPrice: 35, images: [], artisan: { name: "Celestine Mukamana" }, averageRating: 4.7, reviewCount: 38 },
  ];

  const demoArtisans = artisans.length > 0 ? artisans : [
    { id: 1, name: "Celestine Mukamana", biography: "Master basket weaver and conservation ambassador from Musanze.", skills: ["basket weaving", "imigongo art"], photo: null, productCount: 12, averageRating: 4.9 },
    { id: 2, name: "Emmanuel Nkurunziza", biography: "Third-generation woodcarver who learned his craft from his grandfather.", skills: ["wood carving", "sculpture"], photo: null, productCount: 8, averageRating: 4.8 },
    { id: 3, name: "Alphonsine Umubyeyi", biography: "Award-winning Imigongo artist with 30 years of experience.", skills: ["imigongo painting"], photo: null, productCount: 15, averageRating: 5.0 },
    { id: 4, name: "Jean-Pierre Nshimiyimana", biography: "Ceramics master who has trained over 30 youth artisans.", skills: ["pottery", "ceramics"], photo: null, productCount: 10, averageRating: 4.7 },
  ];

  const impactData = impact ?? {
    familiesSupported: 200,
    artisansEmpowered: 200,
    countriesReached: 47,
    totalOrders: 3840,
    conservationAmbassadors: 85,
    treesProtected: 12500,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground">
        <div className="absolute inset-0 imigongo-pattern opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
              <Badge className="bg-accent text-accent-foreground mb-6 text-xs font-medium px-3 py-1">
                Handmade in Rwanda, With Love
              </Badge>
              <h1 className="font-serif text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Buy a Craft,<br />
                <span className="text-accent">Build a Future.</span>
              </h1>
              <p className="text-lg opacity-85 leading-relaxed mb-8 max-w-lg">
                Every piece sold through Gorilla Guardians Village supports a family in Musanze, Rwanda — and protects the mountain gorillas that share their forest.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/products">
                  <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold" data-testid="button-shop-now">
                    <ShoppingBag className="w-5 h-5 mr-2" /> Shop Now
                  </Button>
                </Link>
                <Link href="/experiences">
                  <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 bg-transparent" data-testid="button-experiences">
                    <TreePine className="w-5 h-5 mr-2" /> Book Experience
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }} className="hidden lg:block">
              <div className="relative">
                <div className="w-full h-80 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                  <div className="text-center opacity-60">
                    <div className="w-24 h-24 rounded-full bg-white/20 mx-auto mb-4 flex items-center justify-center">
                      <TreePine className="w-12 h-12 text-white/60" />
                    </div>
                    <p className="text-sm text-white/60">Artisan village photography</p>
                  </div>
                </div>
                {/* Floating stats */}
                <div className="absolute -bottom-6 -left-6 bg-white rounded-xl p-4 shadow-xl">
                  <div className="text-2xl font-serif font-bold text-primary">200+</div>
                  <div className="text-xs text-muted-foreground">Artisan families</div>
                </div>
                <div className="absolute -top-6 -right-6 bg-accent rounded-xl p-4 shadow-xl">
                  <div className="text-2xl font-serif font-bold text-accent-foreground">47</div>
                  <div className="text-xs text-accent-foreground/80">Countries</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Impact counter strip */}
      <section className="bg-white border-y border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <AnimatedCounter value={impactData.familiesSupported} label="Families Supported" suffix="+" />
            <AnimatedCounter value={impactData.artisansEmpowered} label="Artisans Empowered" suffix="+" />
            <AnimatedCounter value={impactData.countriesReached} label="Countries Reached" />
            <AnimatedCounter value={impactData.treesProtected} label="Trees Protected" suffix="+" />
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <Badge variant="outline" className="text-primary border-primary/30 mb-3">Featured Crafts</Badge>
            <h2 className="font-serif text-4xl font-bold">Handpicked For You</h2>
            <p className="text-muted-foreground mt-2">Each piece tells a story of skill, culture, and conservation.</p>
          </div>
          <Link href="/products">
            <Button variant="ghost" className="text-primary gap-1" data-testid="link-view-all-products">
              View all <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {demoProducts.slice(0, 4).map((product: any, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={`/products/${product.id}`}>
                <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border-border" data-testid={`card-product-${product.id}`}>
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center imigongo-pattern">
                        <div className="text-center p-4">
                          <div className="w-12 h-12 rounded-full bg-primary/20 mx-auto mb-2 flex items-center justify-center">
                            <ShoppingBag className="w-6 h-6 text-primary/60" />
                          </div>
                          <p className="text-xs text-muted-foreground">Handcrafted in Rwanda</p>
                        </div>
                      </div>
                    )}
                    {product.discountPrice && (
                      <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs">Sale</Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">{product.artisan?.name}</p>
                    <h3 className="font-medium text-sm leading-tight mb-2 group-hover:text-primary transition-colors">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        {product.discountPrice ? (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-primary" data-testid={`text-price-${product.id}`}>${product.discountPrice}</span>
                            <span className="text-xs text-muted-foreground line-through">${product.price}</span>
                          </div>
                        ) : (
                          <span className="font-bold text-primary" data-testid={`text-price-${product.id}`}>${product.price}</span>
                        )}
                      </div>
                      {product.averageRating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-accent text-accent" />
                          <span className="text-xs text-muted-foreground">{product.averageRating}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Mission Banner */}
      <section className="bg-secondary/10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {[
              { icon: Users, title: "Support Artisan Families", text: "200+ families earn sustainable income from their crafts, funding education, healthcare, and better lives." },
              { icon: TreePine, title: "Protect the Forest", text: "When communities thrive from conservation, poaching disappears. Our artisans are now the park's strongest defenders." },
              { icon: Globe, title: "Share Rwandan Culture", text: "Every piece carries centuries of cultural knowledge — geometric patterns, weaving traditions, and stories of resilience." },
            ].map(({ icon: Icon, title, text }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center p-8"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-5 flex items-center justify-center">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-serif text-xl font-bold mb-3">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet the Artisans */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <Badge variant="outline" className="text-primary border-primary/30 mb-3">The Makers</Badge>
            <h2 className="font-serif text-4xl font-bold">Meet Our Artisans</h2>
            <p className="text-muted-foreground mt-2">Former poachers turned conservation ambassadors, master craftspeople, community leaders.</p>
          </div>
          <Link href="/artisans">
            <Button variant="ghost" className="text-primary gap-1">All artisans <ChevronRight className="w-4 h-4" /></Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {demoArtisans.slice(0, 4).map((artisan: any, i) => (
            <motion.div
              key={artisan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={`/artisans/${artisan.id}`}>
                <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden" data-testid={`card-artisan-${artisan.id}`}>
                  <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 to-secondary/10 relative overflow-hidden">
                    {artisan.photo ? (
                      <img src={artisan.photo} alt={artisan.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center imigongo-pattern">
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                          <Users className="w-8 h-8 text-primary/60" />
                        </div>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">{artisan.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{artisan.biography}</p>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(artisan.skills) && artisan.skills.slice(0, 2).map((skill: string) => (
                        <Badge key={skill} variant="secondary" className="text-xs capitalize">{skill}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Experiences */}
      <section className="bg-primary/5 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <Badge variant="outline" className="text-primary border-primary/30 mb-3">Immersive Experiences</Badge>
              <h2 className="font-serif text-4xl font-bold">Come to Rwanda</h2>
              <p className="text-muted-foreground mt-2">Trek gorillas, weave baskets, cook Rwandan food, stay with artisan families.</p>
            </div>
            <Link href="/experiences">
              <Button variant="ghost" className="text-primary gap-1">All experiences <ChevronRight className="w-4 h-4" /></Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(experiences.length > 0 ? experiences : [
              { id: 1, title: "Gorilla Trek & Village Visit", type: "tour", price: 650, duration: "Full day", capacity: 8, images: [], averageRating: 5.0, reviewCount: 42 },
              { id: 2, title: "Artisan Homestay Experience", type: "homestay", price: 120, duration: "Per night", capacity: 2, images: [], averageRating: 4.9, reviewCount: 28 },
              { id: 3, title: "Imigongo Painting Workshop", type: "workshop", price: 85, duration: "3 hours", capacity: 12, images: [], averageRating: 4.8, reviewCount: 67 },
            ]).slice(0, 3).map((exp: any, i) => (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={`/experiences/${exp.id}`}>
                  <Card className="group hover:shadow-lg transition-all overflow-hidden cursor-pointer" data-testid={`card-experience-${exp.id}`}>
                    <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 relative overflow-hidden">
                      {exp.images?.length > 0 ? (
                        <img src={exp.images[0]} alt={exp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center imigongo-pattern">
                          <TreePine className="w-12 h-12 text-primary/30" />
                        </div>
                      )}
                      <Badge className="absolute top-3 left-3 capitalize bg-primary/90 text-primary-foreground text-xs">{exp.type}</Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{exp.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span>{exp.duration}</span>
                        <span>Up to {exp.capacity} people</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary text-lg" data-testid={`text-price-exp-${exp.id}`}>
                          ${exp.price}<span className="text-xs font-normal text-muted-foreground"> / person</span>
                        </span>
                        {exp.averageRating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-accent text-accent" />
                            <span className="text-xs">{exp.averageRating}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stories */}
      {storyList.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <Badge variant="outline" className="text-primary border-primary/30 mb-3">Cultural Stories</Badge>
              <h2 className="font-serif text-4xl font-bold">Stories from Rwanda</h2>
            </div>
            <Link href="/stories">
              <Button variant="ghost" className="text-primary gap-1">All stories <ChevronRight className="w-4 h-4" /></Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {storyList.map((story: any, i) => (
              <motion.div key={story.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Link href={`/stories/${story.id}`}>
                  <Card className="group hover:shadow-lg transition-all cursor-pointer overflow-hidden">
                    <div className="aspect-video bg-primary/5 flex items-center justify-center imigongo-pattern">
                      <div className="text-center p-4">
                        <Badge variant="outline" className="text-xs capitalize mb-2">{story.type}</Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <Badge variant="outline" className="text-xs capitalize mb-2">{story.type}</Badge>
                      <h3 className="font-serif font-bold text-sm mb-2 group-hover:text-primary transition-colors line-clamp-2">{story.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-3">{story.excerpt}</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-primary text-primary-foreground py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-serif text-4xl lg:text-5xl font-bold mb-6">
              Your Purchase Changes Lives
            </h2>
            <p className="text-lg opacity-85 mb-8 max-w-2xl mx-auto">
              Every basket, every painting, every carved sculpture you buy sends a child to school, keeps a family fed, and protects the mountain gorillas of Rwanda.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/products">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
                  Start Shopping
                </Button>
              </Link>
              <Link href="/impact">
                <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 bg-transparent">
                  See Our Impact <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
