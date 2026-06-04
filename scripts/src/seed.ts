import { createHash } from "crypto";
import {
  db,
  usersTable, categoriesTable, artisansTable, productsTable,
  experiencesTable, storiesTable, eventsTable, notificationsTable,
  reviewsTable, deliveryTrackingTable, ordersTable, orderItemsTable,
} from "@workspace/db";

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "gorilla-salt").digest("hex");
}

async function seed() {
  console.log("Seeding database...");

  // USERS
  const userRows = await db.insert(usersTable).values([
    { email: "super_admin@gorillaguardians.rw", passwordHash: hashPassword("admin123"), name: "Jean-Paul Habimana", role: "super_admin", avatar: null, phone: "+250788000001" },
    { email: "admin@gorillaguardians.rw", passwordHash: hashPassword("admin123"), name: "Marie Uwimana", role: "admin", avatar: null, phone: "+250788000002" },
    { email: "staff@gorillaguardians.rw", passwordHash: hashPassword("admin123"), name: "Emmanuel Nkurunziza", role: "staff", avatar: null, phone: "+250788000003" },
    { email: "artisan@gorillaguardians.rw", passwordHash: hashPassword("admin123"), name: "Celestine Mukamana", role: "artisan", avatar: null, phone: "+250788000004" },
    { email: "customer@gorillaguardians.rw", passwordHash: hashPassword("admin123"), name: "Sarah Johnson", role: "customer", avatar: null, phone: "+14155550100" },
  ]).onConflictDoNothing().returning();
  console.log(`Users: ${userRows.length} inserted`);

  // CATEGORIES
  const catRows = await db.insert(categoriesTable).values([
    { name: "Imigongo Art", slug: "imigongo-art", description: "Traditional Rwandan geometric cow-dung paintings, now made with natural pigments", image: null },
    { name: "Woven Baskets", slug: "woven-baskets", description: "Handwoven peace baskets and storage baskets using traditional Rwandan techniques", image: null },
    { name: "Jewelry", slug: "jewelry", description: "Handcrafted jewelry using beads, brass, and natural materials from Rwanda", image: null },
    { name: "Ceramics", slug: "ceramics", description: "Traditional Rwandan pottery and contemporary ceramic art pieces", image: null },
    { name: "Textiles", slug: "textiles", description: "Hand-dyed and woven fabrics in vibrant Rwandan patterns and colors", image: null },
    { name: "Wood Carvings", slug: "wood-carvings", description: "Handcarved wooden sculptures, masks, and decorative items", image: null },
  ]).onConflictDoNothing().returning();
  console.log(`Categories: ${catRows.length} inserted`);

  // Get existing users and categories
  const users = await db.select().from(usersTable);
  const categories = await db.select().from(categoriesTable);
  const artisanUser = users.find(u => u.role === "artisan");
  const staffUser = users.find(u => u.role === "staff");

  if (!artisanUser) { console.log("No artisan user found"); return; }

  // ARTISANS — skip if already seeded
  const existingArtisans = await db.select({ id: artisansTable.id }).from(artisansTable);
  if (existingArtisans.length > 0) {
    console.log(`Artisans: ${existingArtisans.length} already exist, skipping`);
  } else {
  const artisanRows = await db.insert(artisansTable).values([
    {
      userId: artisanUser.id,
      name: "Celestine Mukamana",
      photo: null,
      biography: "Celestine grew up in Musanze watching her mother weave baskets. After joining Gorilla Guardians Village, she turned her craft into a livelihood supporting her 4 children.",
      skills: ["basket weaving", "imigongo art", "natural dyeing"],
      story: "I used to watch the forest being cleared. Now I protect it through my craft. Every basket I weave tells a story of hope.",
      galleryImages: [],
      isConservationAmbassador: true,
    },
    {
      userId: staffUser?.id ?? artisanUser.id,
      name: "Emmanuel Nkurunziza",
      photo: null,
      biography: "Emmanuel is a master woodcarver from Musanze who learned from his grandfather. His carvings depict the rich wildlife of Volcanoes National Park.",
      skills: ["wood carving", "sculpture", "furniture making"],
      story: "My grandfather taught me that every tree has a spirit. I carve to honor that spirit and share Rwanda's wildlife with the world.",
      galleryImages: [],
      isConservationAmbassador: false,
    },
    {
      userId: artisanUser.id,
      name: "Alphonsine Umubyeyi",
      photo: null,
      biography: "Alphonsine is known across Musanze for her vibrant Imigongo paintings. Each piece takes weeks to create using traditional geometric patterns.",
      skills: ["imigongo painting", "natural pigments", "pattern design"],
      story: "Imigongo is not just art — it is our identity. Through each geometric pattern, I pass on the wisdom of our ancestors.",
      galleryImages: [],
      isConservationAmbassador: true,
    },
    {
      userId: artisanUser.id,
      name: "Jean-Pierre Nshimiyimana",
      photo: null,
      biography: "Jean-Pierre creates stunning ceramic pieces inspired by traditional Rwandan pottery. He has trained over 30 youth artisans in his community.",
      skills: ["pottery", "ceramics", "glazing", "teaching"],
      story: "Pottery connects me to the earth and to my ancestors. I am proud to teach young people this ancient skill.",
      galleryImages: [],
      isConservationAmbassador: false,
    },
  ]).onConflictDoNothing().returning();
  console.log(`Artisans: ${artisanRows.length} inserted`);
  } // end else (artisans not yet seeded)

  const artisans = await db.select().from(artisansTable);
  const cats = await db.select().from(categoriesTable);

  const imigongo = cats.find(c => c.slug === "imigongo-art");
  const baskets = cats.find(c => c.slug === "woven-baskets");
  const jewelry = cats.find(c => c.slug === "jewelry");
  const ceramics = cats.find(c => c.slug === "ceramics");
  const textiles = cats.find(c => c.slug === "textiles");
  const wood = cats.find(c => c.slug === "wood-carvings");

  if (!artisans[0] || !imigongo || !baskets) { console.log("Missing data"); return; }

  // PRODUCTS
  const productRows = await db.insert(productsTable).values([
    {
      name: "Imigongo Triangle Panel",
      slug: "imigongo-triangle-panel-001",
      description: "A stunning large-format Imigongo panel featuring the classic triangle pattern in earth tones. Handpainted over three weeks using natural pigments including cow dung ash, red clay, and natural charcoal.",
      culturalSignificance: "Imigongo art dates back to the 18th century in Eastern Rwanda. The geometric patterns were originally used to decorate the homes of Rwandan royalty.",
      price: 125,
      discountPrice: null,
      stock: 5,
      sku: "IMG-001",
      categoryId: imigongo.id,
      artisanId: artisans[2]?.id ?? artisans[0].id,
      images: [],
      materials: "Natural pigments, cow dung ash, red clay",
      weight: 0.8,
      dimensions: "40cm x 40cm",
      featured: true,
      active: true,
    },
    {
      name: "Peace Basket — Sunrise Pattern",
      slug: "peace-basket-sunrise-001",
      description: "A beautifully handwoven peace basket featuring the traditional sunrise pattern. Crafted from natural sisal with sweet grass coils.",
      culturalSignificance: "The Rwandan peace basket (agaseke) is traditionally given as a wedding gift symbolizing unity and abundance.",
      price: 85,
      discountPrice: 70,
      stock: 12,
      sku: "BSK-001",
      categoryId: baskets.id,
      artisanId: artisans[0].id,
      images: [],
      materials: "Sisal, sweet grass, natural dyes",
      weight: 0.3,
      dimensions: "25cm diameter x 20cm height",
      featured: true,
      active: true,
    },
    {
      name: "Gorilla Family Wood Sculpture",
      slug: "gorilla-family-sculpture-001",
      description: "An exquisitely carved wooden sculpture depicting a mountain gorilla family — silverback, mother, and baby. Each piece is unique, carved from sustainably sourced wood.",
      culturalSignificance: "Mountain gorillas are deeply sacred in Rwandan culture and central to the conservation mission of Gorilla Guardians Village.",
      price: 280,
      discountPrice: null,
      stock: 3,
      sku: "WD-001",
      categoryId: wood?.id ?? imigongo.id,
      artisanId: artisans[1].id,
      images: [],
      materials: "Sustainably sourced eucalyptus wood, beeswax finish",
      weight: 2.1,
      dimensions: "30cm x 20cm x 25cm",
      featured: true,
      active: true,
    },
    {
      name: "Traditional Ceramic Pot",
      slug: "traditional-ceramic-pot-001",
      description: "A handthrown ceramic pot inspired by ancient Rwandan pottery traditions. Features hand-incised geometric patterns and a rich terracotta glaze.",
      culturalSignificance: "Traditional Rwandan pots (inkono) were used for storing sorghum beer and water. Each region had distinctive patterns.",
      price: 95,
      discountPrice: null,
      stock: 8,
      sku: "CER-001",
      categoryId: ceramics?.id ?? imigongo.id,
      artisanId: artisans[3]?.id ?? artisans[0].id,
      images: [],
      materials: "Local clay, natural mineral glazes",
      weight: 1.2,
      dimensions: "20cm x 20cm",
      featured: false,
      active: true,
    },
    {
      name: "Beaded Maasai-Inspired Necklace",
      slug: "beaded-necklace-001",
      description: "A vibrant handmade beaded necklace combining traditional Rwandan and East African beading techniques. Bold colors representing the Rwandan flag.",
      culturalSignificance: "Beadwork in Rwanda has been used for centuries to denote social status, mark rites of passage, and celebrate beauty.",
      price: 45,
      discountPrice: 35,
      stock: 20,
      sku: "JWL-001",
      categoryId: jewelry?.id ?? imigongo.id,
      artisanId: artisans[0].id,
      images: [],
      materials: "Glass beads, brass wire, natural leather cord",
      weight: 0.1,
      dimensions: "45cm length",
      featured: true,
      active: true,
    },
    {
      name: "Kente-Inspired Table Runner",
      slug: "kente-table-runner-001",
      description: "A stunning hand-woven table runner in bold geometric patterns. Each thread is hand-dyed using traditional plant-based dyes from plants found on the slopes of Volcanoes National Park.",
      culturalSignificance: "Textile weaving in Rwanda is a community activity — women gather to weave and share stories, preserving oral traditions.",
      price: 65,
      discountPrice: null,
      stock: 15,
      sku: "TXT-001",
      categoryId: textiles?.id ?? imigongo.id,
      artisanId: artisans[0].id,
      images: [],
      materials: "Hand-dyed cotton, natural plant dyes",
      weight: 0.4,
      dimensions: "180cm x 35cm",
      featured: false,
      active: true,
    },
    {
      name: "Imigongo Round Wall Clock",
      slug: "imigongo-wall-clock-001",
      description: "A unique fusion of traditional Imigongo art and functional decor — a hand-painted wall clock featuring classic Rwandan geometric patterns.",
      culturalSignificance: "This piece bridges tradition and modernity — using ancient Rwandan art forms to create contemporary functional objects.",
      price: 150,
      discountPrice: null,
      stock: 6,
      sku: "IMG-002",
      categoryId: imigongo.id,
      artisanId: artisans[2]?.id ?? artisans[0].id,
      images: [],
      materials: "Natural pigments, hardwood base, clock mechanism",
      weight: 0.9,
      dimensions: "35cm diameter",
      featured: true,
      active: true,
    },
    {
      name: "Small Storage Basket Set (3 pieces)",
      slug: "storage-basket-set-001",
      description: "A beautiful set of three graduated storage baskets with lids. Perfect for organizing your home while supporting Rwandan artisans.",
      culturalSignificance: "Basket weaving is one of Rwanda's oldest art forms, with different regions having distinctive patterns and styles.",
      price: 110,
      discountPrice: 95,
      stock: 7,
      sku: "BSK-002",
      categoryId: baskets.id,
      artisanId: artisans[0].id,
      images: [],
      materials: "Sisal, sweet grass, natural and synthetic dyes",
      weight: 0.8,
      dimensions: "Small: 15cm, Medium: 20cm, Large: 25cm diameter",
      featured: false,
      active: true,
    },
  ]).onConflictDoNothing().returning();
  console.log(`Products: ${productRows.length} inserted`);

  // EXPERIENCES
  const expRows = await db.insert(experiencesTable).values([
    {
      title: "Gorilla Trek & Village Visit",
      slug: "gorilla-trek-village-001",
      description: "Spend a morning tracking mountain gorillas in Volcanoes National Park, then visit the Gorilla Guardians artisan village. Meet the artisans, learn their stories, and try your hand at basket weaving.",
      type: "tour",
      images: [],
      price: 650,
      duration: "Full day (8 hours)",
      capacity: 8,
      difficultyLevel: "moderate",
      includedItems: ["Gorilla permit", "Park fees", "Village lunch", "Craft workshop", "English-speaking guide"],
      meetingPoint: "Gorilla Guardians Village, Musanze",
      cancellationPolicy: "Full refund if cancelled 7+ days before. 50% refund 3-6 days. No refund within 72 hours.",
      active: true,
    },
    {
      title: "Artisan Homestay Experience",
      slug: "artisan-homestay-001",
      description: "Live with a Gorilla Guardians artisan family for 2-3 nights. Share meals, learn crafts, help with daily activities, and experience authentic Rwandan rural life.",
      type: "homestay",
      images: [],
      price: 120,
      duration: "Per night (minimum 2 nights)",
      capacity: 2,
      difficultyLevel: "easy",
      includedItems: ["Accommodation", "All meals", "Craft sessions", "Cultural activities", "Airport transfers"],
      meetingPoint: "Musanze Town Center",
      cancellationPolicy: "Full refund 14+ days before. No refund within 7 days.",
      active: true,
    },
    {
      title: "Imigongo Painting Workshop",
      slug: "imigongo-workshop-001",
      description: "Learn the ancient art of Imigongo from master artisan Alphonsine. You will create your own panel to take home, using traditional natural pigments and techniques passed down for generations.",
      type: "workshop",
      images: [],
      price: 85,
      duration: "3 hours",
      capacity: 12,
      difficultyLevel: "easy",
      includedItems: ["All materials", "Instruction", "Finished artwork to take home", "Tea and coffee"],
      meetingPoint: "Gorilla Guardians Art Studio, Musanze",
      cancellationPolicy: "Full refund 48+ hours before. No refund within 24 hours.",
      active: true,
    },
    {
      title: "Traditional Rwandan Cooking Class",
      slug: "cooking-class-001",
      description: "Cook a full traditional Rwandan feast alongside local women. Learn to make isombe (cassava leaves), ibijumba (sweet potatoes), and Rwandan bean stew from scratch using fresh market ingredients.",
      type: "cooking",
      images: [],
      price: 65,
      duration: "4 hours",
      capacity: 8,
      difficultyLevel: "easy",
      includedItems: ["Market visit", "All ingredients", "Recipe cards", "Lunch", "Local banana beer tasting"],
      meetingPoint: "Musanze Market, Main Entrance",
      cancellationPolicy: "Full refund 48+ hours before.",
      active: true,
    },
    {
      title: "Basket Weaving Masterclass",
      slug: "basket-weaving-class-001",
      description: "A deep dive into the art of Rwandan peace basket weaving with master weaver Celestine. Learn to prepare sisal, create patterns, and begin your own basket.",
      type: "workshop",
      images: [],
      price: 55,
      duration: "Half day (4 hours)",
      capacity: 10,
      difficultyLevel: "easy",
      includedItems: ["All materials", "Pattern guide booklet", "Partial basket to take home", "Refreshments"],
      meetingPoint: "Gorilla Guardians Village Workshop",
      cancellationPolicy: "Full refund 48+ hours before.",
      active: true,
    },
  ]).onConflictDoNothing().returning();
  console.log(`Experiences: ${expRows.length} inserted`);

  // STORIES
  const storyRows = await db.insert(storiesTable).values([
    {
      title: "From Poacher to Protector: Celestine's Story",
      slug: "celestine-poacher-to-protector",
      excerpt: "Celestine Mukamana once helped set snares in Volcanoes National Park. Today, her woven baskets fund the park's conservation. This is her story.",
      content: `Twenty years ago, Celestine Mukamana would wake before dawn to check the snares her family had set in Volcanoes National Park. The family needed food, and the forest provided it — at a cost none of them fully understood.

"We were not bad people," Celestine says softly, her hands never stopping their rhythmic weaving. "We were hungry people."

Today, Celestine's hands weave peace baskets — the traditional Rwandan agaseke — that sell to buyers in 47 countries. Each basket takes three weeks to complete. Each basket funds her children's school fees. Each basket protects the forest she once threatened.

The transformation began in 2015 when the Gorilla Guardians Village project reached her community. "They did not come to punish us," she remembers. "They came to ask: what do you need?"

What followed was years of craft training, market access, fair pricing — and slowly, a profound shift in how Celestine's community saw the forest. Not as something to exploit, but as something to protect — because it was now something that protected them back.

Her eldest daughter is studying environmental science in Kigali. Her son wants to be a park ranger. The forest that once felt like the family's adversary is now, unmistakably, their partner.

"Every basket I weave," Celestine says, "is a prayer for the gorillas. They do not know it. But I do."`,
      type: "artisan",
      coverImage: null,
      images: [],
      artisanId: artisans[0]?.id ?? null,
      tags: ["conservation", "artisan", "transformation", "baskets"],
      published: true,
    },
    {
      title: "The Geometry of Memory: Understanding Imigongo",
      slug: "understanding-imigongo-art",
      excerpt: "Imigongo art's bold geometric patterns have decorated Rwandan homes for three centuries. Here's what the patterns mean — and why they matter more than ever.",
      content: `Stand before an Imigongo panel and you are looking at mathematics made sacred. The bold triangles, spirals, and interlocking shapes that define Rwanda's most distinctive art form are not merely decorative — they encode centuries of cultural memory.

Originating in the Kirehe district of Eastern Rwanda in the 18th century, Imigongo was created by King Kakira's son Kakira as a way to decorate the royal court. The art spread across the kingdom, with women creating increasingly complex patterns using cow dung mixed with clay, ash, and natural pigments.

The black, white, and red color palette is not arbitrary. Black represents the earth and resilience. White represents purity and hope. Red — in traditional pieces made from red clay — represents the blood of ancestors and the vitality of the community.

At Gorilla Guardians Village, master artist Alphonsine Umubyeyi has spent thirty years learning these patterns from her mother and grandmother. She can read an Imigongo panel like a language. "This pattern," she says, tracing a spiral, "means continuity — life going on. This triangle," she points to a series of sharp angles, "means protection. Warriors standing strong."

Today, contemporary Rwandan artists are finding new languages within Imigongo's ancient grammar — adding new colors, scales, and applications. Clock faces. Furniture. Contemporary canvases. The geometry lives on, adapting without losing its soul.`,
      type: "culture",
      coverImage: null,
      images: [],
      artisanId: null,
      tags: ["culture", "imigongo", "art", "history"],
      published: true,
    },
    {
      title: "47 Countries, 200 Families: The Numbers Behind the Mission",
      slug: "impact-numbers-mission",
      excerpt: "Behind every product sold through Gorilla Guardians Village is a data point in a conservation success story. Here are the numbers — and what they mean for Rwanda's forests.",
      content: `Conservation is often measured in hectares of forest protected or species population counts. But at Gorilla Guardians Village, we measure it differently: in school fees paid, in meals on tables, in families who no longer need to enter the forest to survive.

When a family has enough income from crafts and cultural tourism, they stop setting snares. When children go to school, they learn about conservation. When communities benefit economically from the park's existence, they become its most ardent defenders.

The numbers tell the story clearly. Since 2015, over 200 artisan families have joined the Gorilla Guardians network. Average household income has increased by 340%. School enrollment in partner communities is up 67%. Reported poaching incidents in the immediate area around partner villages have fallen by 89%.

The mountain gorilla population itself has increased — from 880 in 2018 to over 1,000 today. Gorilla Guardians cannot take credit for this alone; conservation is collaborative work. But the communities that surround the park play a crucial role, and those communities are healthier and more invested in the park's future than ever before.

"We are not just selling crafts," says co-founder Jean-Paul Habimana. "We are building a conservation economy — where every purchase is an act of environmental protection, every artisan a conservation ambassador."

The goal for 2026: 500 artisan families, 100 conservation ambassadors, and a direct link drawn between every product sold and the forest it protects.`,
      type: "conservation",
      coverImage: null,
      images: [],
      artisanId: null,
      tags: ["impact", "conservation", "mission", "numbers"],
      published: true,
    },
  ]).onConflictDoNothing().returning();
  console.log(`Stories: ${storyRows.length} inserted`);

  // EVENTS
  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const twoMonths = new Date(today);
  twoMonths.setMonth(twoMonths.getMonth() + 2);
  const threeMonths = new Date(today);
  threeMonths.setMonth(threeMonths.getMonth() + 3);

  const eventRows = await db.insert(eventsTable).values([
    {
      title: "Umuganura Harvest Festival",
      slug: `umuganura-harvest-festival`,
      description: "Join us for Rwanda's traditional harvest festival celebration at Gorilla Guardians Village. Experience traditional dances, music, food, and a showcase of artisan work.",
      type: "festival",
      image: null,
      startDate: nextMonth,
      endDate: new Date(nextMonth.getTime() + 2 * 24 * 60 * 60 * 1000),
      location: "Gorilla Guardians Village, Musanze, Rwanda",
      isOnline: false,
      active: true,
    },
    {
      title: "Virtual Artisan Showcase: Meet the Makers",
      slug: `virtual-showcase`,
      description: "A live online event where you can meet Gorilla Guardians artisans, watch live demonstrations, ask questions, and place custom orders directly.",
      type: "exhibition",
      image: null,
      startDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      location: null,
      isOnline: true,
      active: true,
    },
    {
      title: "Imigongo Exhibition: Patterns of Rwanda",
      slug: `imigongo-exhibition`,
      description: "A curated exhibition of contemporary Imigongo art by Gorilla Guardians artists. Opening night reception includes traditional music and food.",
      type: "exhibition",
      image: null,
      startDate: twoMonths,
      endDate: new Date(twoMonths.getTime() + 7 * 24 * 60 * 60 * 1000),
      location: "Kigali Convention Centre, Rwanda",
      isOnline: false,
      active: true,
    },
  ]).onConflictDoNothing().returning();
  console.log(`Events: ${eventRows.length} inserted`);

  // REVIEWS
  const products = await db.select().from(productsTable);
  const customer = users.find(u => u.role === "customer");
  if (customer && products.length > 0) {
    await db.insert(reviewsTable).values([
      {
        userId: customer.id,
        productId: products[0].id,
        rating: 5,
        title: "Absolutely stunning piece",
        comment: "The Imigongo panel arrived beautifully packaged. The craftsmanship is extraordinary — every line is precise, the colors are vibrant. It now has pride of place in my living room.",
        images: [],
        isVerifiedPurchase: true,
        status: "approved",
      },
      {
        userId: customer.id,
        productId: products[1].id,
        rating: 5,
        title: "Exquisite basket, incredible story",
        comment: "Knowing that this basket was made by Celestine, whose life story is on the website, makes it so much more meaningful. Perfect quality and arrived within 2 weeks to the US.",
        images: [],
        isVerifiedPurchase: true,
        status: "approved",
      },
    ]).onConflictDoNothing();
    console.log("Reviews inserted");
  }

  // NOTIFICATIONS for customer
  if (customer) {
    await db.insert(notificationsTable).values([
      {
        userId: customer.id,
        type: "order",
        title: "Order Shipped",
        message: "Your order #1001 has been shipped and is on its way to you. Expected delivery: 7-14 days.",
        isRead: false,
        link: "/customer/orders/1",
      },
      {
        userId: customer.id,
        type: "promotion",
        title: "New Arrivals: Umuganura Collection",
        message: "Our special Umuganura harvest festival collection is now live. Get 15% off with code HARVEST15.",
        isRead: false,
        link: "/products?collection=umuganura",
      },
      {
        userId: customer.id,
        type: "system",
        title: "Welcome to Gorilla Guardians Village",
        message: "Thank you for joining our community. Every purchase you make supports artisan families and protects mountain gorillas.",
        isRead: true,
        link: "/impact",
      },
    ]).onConflictDoNothing();
    console.log("Notifications inserted");
  }

  // ORDERS
  const allProducts = await db.select().from(productsTable);
  const allUsers = await db.select().from(usersTable);
  const customerUser = allUsers.find(u => u.role === "customer");
  if (customerUser && allProducts.length >= 3) {
    const p1 = allProducts[0];
    const p2 = allProducts[1];
    const p3 = allProducts[2];

    const orderData = [
      {
        order: {
          userId: customerUser.id,
          subtotal: Number(p1.price) + Number(p2.price),
          shippingCost: 25,
          total: Number(p1.price) + Number(p2.price) + 25,
          status: "shipped",
          paymentMethod: "card",
          paymentStatus: "paid",
          shippingAddress: "Sarah Johnson, 45 Maple Street, New York, 10001, United States",
          shippingType: "global",
          trackingNumber: "GG-20260520-AB1234",
          shippingCarrier: "DHL",
        },
        items: [
          { product: p1, quantity: 1 },
          { product: p2, quantity: 1 },
        ],
        delivery: {
          status: "shipped",
          carrier: "DHL",
          estimatedDelivery: "2026-06-10",
          currentLocation: "Amsterdam Sorting Hub",
          timeline: JSON.stringify([
            { status: "processing", description: "Order placed successfully", timestamp: "2026-05-20T10:00:00Z" },
            { status: "packed", description: "Order packed and ready for collection", timestamp: "2026-05-21T14:00:00Z" },
            { status: "shipped", description: "Package collected by DHL", timestamp: "2026-05-22T09:00:00Z" },
          ]),
        },
      },
      {
        order: {
          userId: customerUser.id,
          subtotal: Number(p3.price),
          shippingCost: 0,
          total: Number(p3.price),
          status: "processing",
          paymentMethod: "momo",
          paymentStatus: "paid",
          shippingAddress: "Sarah Johnson, Gorilla Guardians Village, Musanze, Rwanda",
          shippingType: "pickup",
          trackingNumber: "GG-20260601-CD5678",
          shippingCarrier: null,
        },
        items: [
          { product: p3, quantity: 2 },
        ],
        delivery: {
          status: "processing",
          carrier: null,
          estimatedDelivery: "2026-06-15",
          currentLocation: "Gorilla Guardians Village Workshop",
          timeline: JSON.stringify([
            { status: "processing", description: "Order placed and artisan notified", timestamp: "2026-06-01T08:00:00Z" },
          ]),
        },
      },
      {
        order: {
          userId: customerUser.id,
          subtotal: Number(allProducts[3]?.price ?? p1.price),
          shippingCost: 25,
          total: Number(allProducts[3]?.price ?? p1.price) + 25,
          status: "delivered",
          paymentMethod: "paypal",
          paymentStatus: "paid",
          shippingAddress: "Sarah Johnson, 10 Baker Street, London, W1U 3BW, United Kingdom",
          shippingType: "global",
          trackingNumber: "GG-20260501-EF9012",
          shippingCarrier: "FedEx",
        },
        items: [
          { product: allProducts[3] ?? p1, quantity: 1 },
        ],
        delivery: {
          status: "delivered",
          carrier: "FedEx",
          estimatedDelivery: "2026-05-15",
          currentLocation: "Delivered",
          timeline: JSON.stringify([
            { status: "processing", description: "Order placed", timestamp: "2026-05-01T10:00:00Z" },
            { status: "packed", description: "Packed by artisan", timestamp: "2026-05-02T12:00:00Z" },
            { status: "shipped", description: "Picked up by FedEx", timestamp: "2026-05-03T08:00:00Z" },
            { status: "in_transit", description: "In transit to destination", timestamp: "2026-05-07T15:00:00Z" },
            { status: "out_for_delivery", description: "Out for delivery", timestamp: "2026-05-14T09:00:00Z" },
            { status: "delivered", description: "Delivered successfully", timestamp: "2026-05-14T14:30:00Z" },
          ]),
        },
      },
    ];

    for (const entry of orderData) {
      const [inserted] = await db.insert(ordersTable).values(entry.order as any).returning();
      for (const item of entry.items) {
        await db.insert(orderItemsTable).values({
          orderId: inserted.id,
          productId: item.product.id,
          productName: item.product.name,
          productImage: (item.product.images as string[])[0] ?? "",
          quantity: item.quantity,
          price: Number(item.product.price),
          subtotal: Number(item.product.price) * item.quantity,
        });
      }
      await db.insert(deliveryTrackingTable).values({
        orderId: inserted.id,
        trackingNumber: entry.order.trackingNumber ?? null,
        ...entry.delivery,
      } as any).onConflictDoNothing();
    }
    console.log(`Orders inserted: ${orderData.length}`);
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
