// Placeholder editorial content standing in for the future CMS. Shapes mirror
// the "Data model (representational)" section of the design handoff:
// Article (title, slug, accessType, price, category, tags, publishedAt) and
// Book (title, cover, formats[], purchaseLinks[]).

export type Access = "free" | "paid" | "members" | "preview";

export type Article = {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  dek?: string;
  category: string;
  subcategory?: string;
  access: Access;
  price?: string;
  date: string;
  readTime: string;
  author?: string;
  body?: string;
  seoTitle?: string;
  seoDescription?: string;
  ogImageUrl?: string;
  featuredImageUrl?: string;
  videoUrl?: string;
  videoThumbnailUrl?: string;
  status?: string;
  /** Set only when a downloadable file is attached — never the storage path itself. */
  attachmentFormat?: "pdf" | "docx";
  featured?: boolean;
  /** An external copy of this piece (ResearchGate, Academia.edu, a journal site…). */
  externalUrl?: string;
  externalLabel?: string;
};

export const articles: Article[] = [
  {
    slug: "on-writing-as-a-second-country",
    title: "On Writing as a Second Country",
    dek: "Migration, memory and the languages we write in when the first one is no longer enough.",
    excerpt:
      "A long essay on migration, memory and the languages we write in when the first one is no longer enough.",
    category: "ESSAY",
    access: "paid",
    price: "$3.00",
    date: "Sept 12, 2026",
    readTime: "12 min",
    author: "Omini Nfawa",
  },
  {
    slug: "coastal-erosion-and-the-politics-of-retreat",
    title: "Coastal Erosion and the Politics of Retreat",
    excerpt:
      "A field study of three delta towns weighing relocation against a shrinking coastline.",
    category: "RESEARCH",
    access: "paid",
    date: "Aug 28, 2026",
    readTime: "18 min",
    author: "Omini Nfawa",
  },
  {
    slug: "the-house-on-ndoli-street",
    title: "The House on Ndoli Street",
    excerpt:
      "A short story about a house that keeps changing hands, and the one thing no owner ever moves.",
    category: "FICTION",
    access: "free",
    date: "Aug 12, 2026",
    readTime: "9 min",
    author: "Omini Nfawa",
  },
  {
    slug: "a-conversation-on-independent-publishing",
    title: "A Conversation on Independent Publishing",
    excerpt:
      "Talking with a small-press editor about what changes when a writer builds their own platform.",
    category: "INTERVIEW",
    access: "free",
    date: "Jul 30, 2026",
    readTime: "15 min",
    author: "Omini Nfawa",
  },
];

export function getArticle(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export type Book = {
  id?: string;
  slug: string;
  title: string;
  kind: string;
  year: string;
  pages?: string;
  excerpt: string;
  coverImageUrl?: string;
  authorNote?: string;
  author?: string;
  ogImageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  purchaseLinks: { label: string; platform: string; url: string }[];
  formats: string[];
  status?: string;
  upcoming?: boolean;
  featured?: boolean;
};

export const books: Book[] = [
  {
    slug: "the-long-return",
    title: "The Long Return",
    kind: "Novel",
    year: "2026",
    pages: "312 pages",
    excerpt:
      "A family separated by three borders finds its way back to a single house, one letter at a time. Told across four decades and three countries, it is a novel about what a house remembers when the people who built it are gone.",
    purchaseLinks: [
      { label: "Buy on Selar", platform: "selar", url: "https://selar.co/" },
      { label: "Buy on Amazon", platform: "amazon", url: "https://amazon.com/" },
      { label: "Google Books", platform: "google", url: "https://books.google.com/" },
    ],
    formats: ["Ebook", "Paperback", "Audio"],
  },
  {
    slug: "correspondence",
    title: "Correspondence",
    kind: "Novel",
    year: "2022",
    excerpt: "A novel told entirely in letters between two estranged siblings.",
    purchaseLinks: [{ label: "Buy on Amazon", platform: "amazon", url: "https://amazon.com/" }],
    formats: ["Ebook", "Paperback"],
  },
  {
    slug: "the-water-line",
    title: "The Water Line",
    kind: "Essays",
    year: "2019",
    excerpt: "Essays on the Niger Delta's shifting coastline.",
    purchaseLinks: [{ label: "Buy on Amazon", platform: "amazon", url: "https://amazon.com/" }],
    formats: ["Ebook", "Paperback"],
  },
  {
    slug: "small-hours",
    title: "Small Hours",
    kind: "Poetry",
    year: "2016",
    excerpt: "A debut poetry collection.",
    purchaseLinks: [{ label: "Buy on Amazon", platform: "amazon", url: "https://amazon.com/" }],
    formats: ["Paperback"],
  },
];

export const upcomingBooks: Book[] = [
  {
    slug: "a-small-country-of-rain",
    title: "A Small Country of Rain",
    kind: "Essays",
    year: "2027",
    excerpt: "",
    purchaseLinks: [],
    formats: [],
    upcoming: true,
  },
  {
    slug: "field-notes",
    title: "Field Notes",
    kind: "Research",
    year: "2027",
    excerpt: "",
    purchaseLinks: [],
    formats: [],
    upcoming: true,
  },
  {
    slug: "ndoli-street-and-other-stories",
    title: "Ndoli Street & Other Stories",
    kind: "Fiction",
    year: "2027",
    excerpt: "",
    purchaseLinks: [],
    formats: [],
    upcoming: true,
  },
];

export function getBook(slug: string): Book | undefined {
  return books.find((b) => b.slug === slug);
}
