export interface TourQA {
  question: string;
  keywords: string[];
  answer: string;
}

export const TOUR_QA: TourQA[] = [
  {
    question: "What can I do in 2 days near Volcanoes National Park?",
    keywords: ["2 days", "two days", "volcanoes", "national park", "what can i do", "itinerary", "weekend"],
    answer:
      "In 2 days near Volcanoes National Park you can combine gorilla trekking on day 1 (permits must be booked in advance via the Rwanda Development Board) with our Artisan Village Morning experience in Musanze. On day 2, the Golden Monkey trek is a lighter, equally rewarding alternative — pair it with an afternoon at the Gorilla Guardians craft market for a full cultural and wildlife day. Browse our Experiences and Packages pages to book a bundled itinerary.",
  },
  {
    question: "Which experiences are family-friendly?",
    keywords: ["family", "family-friendly", "kids", "children", "child", "families", "all ages"],
    answer:
      "Our most family-friendly experiences are the Artisan Weaving Workshop (all ages welcome — children love the hands-on craft), the Traditional Cooking Class (great for families with children 6+), and the Cultural Village Walk (gentle terrain, about 2 hours). Note: gorilla trekking requires participants to be at least 15 years old per Rwanda Development Board rules.",
  },
  {
    question: "What crafts are handmade by women artisans?",
    keywords: ["women", "female", "woman", "handmade by women", "women artisans", "cooperative"],
    answer:
      "The majority of our basket-weaving, agaseke (peace baskets), imigongo wall-art, and sisal jewellery collections are crafted by women artisans in our Musanze cooperative. Look for the 'Women's Cooperative' badge on product pages. Over 80% of our artisan membership is women, and all revenue shares go directly to the producing artisan.",
  },
  {
    question: "How do I book a gorilla trekking experience?",
    keywords: ["gorilla", "trekking", "trek", "gorilla permit", "book gorilla"],
    answer:
      "Gorilla trekking permits are issued by the Rwanda Development Board. We partner with licensed guides and can arrange transport, accommodation, and an artisan village stop around your trek. Browse our Experiences page, select your preferred date, and we'll confirm availability and share full preparation guides within 24 hours.",
  },
  {
    question: "What is the best time of year to visit Rwanda?",
    keywords: ["best time", "when to visit", "season", "weather", "dry season", "rainy", "when should i go"],
    answer:
      "The best times to visit Rwanda are the two dry seasons: June–September and December–February. June–September is peak gorilla trekking season with drier trails and clearer views. December–January offers wildlife alongside a lush green landscape. Gorilla permits sell out months ahead during peak season, so book early.",
  },
  {
    question: "How does revenue from purchases support conservation?",
    keywords: ["conservation", "impact", "revenue", "support", "where does money go", "profit", "donation"],
    answer:
      "72% of every purchase goes directly to the producing artisan or their family. 18% funds community conservation programs (anti-poaching patrol support, habitat restoration). 10% supports the Volcanoes National Park protection fund. We are a registered Rwandan social enterprise with no shareholders — all profits are reinvested in the community and gorilla habitat.",
  },
  {
    question: "How long do experiences typically last?",
    keywords: ["how long", "duration", "hours", "length", "how many hours", "time"],
    answer:
      "Duration varies by experience: the Artisan Weaving Workshop runs 2.5 hours, the Cultural Village Walk 2 hours, the Traditional Cooking Class 3 hours, and full-day gorilla trekking is 6–8 hours. Each experience detail page shows the exact duration. For multi-day options, check our Packages section.",
  },
  {
    question: "Can I customise or commission a product?",
    keywords: ["custom", "commission", "bespoke", "personalise", "personalize", "special order", "customise", "customize"],
    answer:
      "Yes! Most artisans accept custom commissions — specific colours, patterns, sizes, or personalisations. After any purchase you can message the artisan directly from your customer dashboard. For a new commission, use the Contact page and describe your idea — our team will connect you with the right artisan within 48 hours.",
  },
  {
    question: "What payment methods do you accept?",
    keywords: ["payment", "pay", "credit card", "visa", "stripe", "how to pay", "checkout"],
    answer:
      "We accept all major credit and debit cards (Visa, Mastercard, Amex) via secure Stripe Checkout. For experience bookings, payment is only taken after an admin confirms your booking — you'll receive a 'Pay Now' link at that point. All transactions use SSL encryption.",
  },
  {
    question: "Is there a minimum age for experiences?",
    keywords: ["age", "minimum age", "how old", "age limit", "children allowed", "kids allowed"],
    answer:
      "Gorilla trekking requires participants to be at least 15 years old per Rwanda Development Board policy. Most other experiences — weaving workshops, cooking classes, cultural walks — welcome all ages. Check the experience detail page for specific age guidance.",
  },
  {
    question: "How do I track my order?",
    keywords: ["track", "order", "shipping", "delivery", "tracking", "where is my order"],
    answer:
      "You can track your order from the Track page (link in the footer) using your tracking number, or from your customer dashboard under Orders. We'll also email you a tracking link when your order ships. Standard international shipping from Musanze, Rwanda takes 7–14 business days.",
  },
  {
    question: "How do I become an artisan on the platform?",
    keywords: ["become artisan", "join", "enroll", "artisan program", "sign up as artisan"],
    answer:
      "We run community enrollment twice per year. Contact us through the Contact page or email hello@gorillaguardians.rw. Preference is given to families in the park's buffer zone. We provide training, materials, and market access once enrolled.",
  },
];

export const SUGGESTED_QUESTIONS = [
  "What can I do in 2 days near Volcanoes National Park?",
  "Which experiences are family-friendly?",
  "What crafts are handmade by women artisans?",
  "How does revenue support conservation?",
];
