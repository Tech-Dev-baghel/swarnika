export type Metal = "yellow" | "rose" | "white" | "platinum";
export type Stone = "none" | "diamond" | "ruby" | "emerald" | "pearl";
export type Purity = "24KT" | "22KT" | "18KT" | "PT950";
export type Occasion = "Daily Wear" | "Office Wear" | "Party" | "Wedding" | "Festive";
export type Gender = "Women" | "Men" | "Kids" | "Unisex";
export type Tag = "new" | "bestseller" | "trending";

export const METALS: Metal[] = ["yellow", "rose", "white", "platinum"];
export const STONES: Stone[] = ["none", "diamond", "ruby", "emerald", "pearl"];
export const PURITIES: Purity[] = ["24KT", "22KT", "18KT", "PT950"];
export const OCCASIONS: Occasion[] = ["Daily Wear", "Office Wear", "Party", "Wedding", "Festive"];
export const GENDERS: Gender[] = ["Women", "Men", "Kids", "Unisex"];
export const TAGS: Tag[] = ["new", "bestseller", "trending"];

export const METAL_LABEL: Record<Metal, string> = {
  yellow: "Yellow Gold", rose: "Rose Gold", white: "White Gold", platinum: "Platinum",
};
export const STONE_LABEL: Record<Stone, string> = {
  none: "Plain Gold", diamond: "Diamond", ruby: "Ruby", emerald: "Emerald", pearl: "Pearl",
};

export type Product = {
  id: string;
  name: string;
  category: string; // Category.slug
  metal: Metal;
  purity: Purity;
  stone: Stone;
  weight: number;
  stoneValue: number;
  makingPct: number;
  occasion: Occasion;
  gender: Gender;
  collection: string;
  tags: Tag[];
  rating: number;
  reviews: number;
  images: string[];
  description: string;
  stock: number;
  active: boolean;
};

export type Category = { id: string; slug: string; label: string; image: string; order: number };
export type Slide = { id: string; eyebrow: string; title: string; cta: string; href: string; image: string; active: boolean; order: number };
export type Collection = { id: string; name: string; blurb: string; image: string; order: number };
export type Bride = { id: string; name: string; image: string; order: number };
export type StoreLoc = { id: string; city: string; name: string; address: string; phone: string; hours: string; image: string };
export type Testimonial = { id: string; name: string; city: string; text: string; item: string; rating: number };
export type Coupon = { id: string; code: string; type: "percent" | "flat"; value: number; active: boolean };
export type Rate = { purity: Purity; label: string; perGram: number; change: number };

export type Settings = {
  brandName: string;
  tagline: string;
  promoEnabled: boolean;
  promoText: string;
  promoLinkText: string;
  promoLink: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  email: string;
  address: string;
  rateCity: string;
  rateUpdated: string;
  savingsBonusPct: number;
  marquee: string;
  storeImage: string;
};

export type OrderStatus = "new" | "confirmed" | "shipped" | "delivered" | "cancelled";
export type Order = {
  id: string;
  createdAt: string;
  customerId?: string | null;
  notes?: string;
  customer: { name: string; phone: string; email: string; address: string; city: string; pincode: string };
  items: { id: string; name: string; qty: number; size?: string; price: number; image?: string }[];
  subtotal: number;
  discount: number;
  coupon?: string;
  total: number;
  status: OrderStatus;
};
export type Appointment = {
  id: string; createdAt: string; store: string; type: "visit" | "video";
  name: string; phone: string; date: string; status: "pending" | "confirmed" | "done" | "cancelled";
};
export type Address = { id: string; label: string; name: string; phone: string; address: string; city: string; pincode: string; isDefault?: boolean };
export type Customer = {
  id: string; name: string; email: string | null; phone: string | null; addresses: Address[]; wishlist: string[];
  active: boolean; createdAt: string; lastLogin: string | null;
};
export type Role = "owner" | "manager" | "staff";
export type AdminUser = { id: string; name: string; email: string; role: Role; active: boolean; createdAt: string; lastLogin: string | null };
export type Review = { id: string; createdAt: string; productId: string; customerId: string | null; name: string; rating: number; title: string; body: string; status: "pending" | "approved" | "rejected" };
export type Message = { id: string; createdAt: string; name: string; email: string; phone: string; subject: string; body: string; status: "new" | "read" | "replied" | "closed" };
export type Page = { slug: string; title: string; body: string; updatedAt: string };
export type AuditEntry = { id: string; createdAt: string; actor: string; action: string; detail: string };
export type Subscriber = { id: string; email: string; createdAt: string };

/** Shape of a full backup file. */
export type DB = {
  settings: Settings;
  rates: Rate[];
  products: Product[];
  categories: Category[];
  slides: Slide[];
  collections: Collection[];
  brides: Bride[];
  stores: StoreLoc[];
  testimonials: Testimonial[];
  coupons: Coupon[];
  orders: Order[];
  appointments: Appointment[];
  subscribers: Subscriber[];
  pages?: Page[];
  reviews?: Review[];
  messages?: Message[];
};

/** The subset of the database the storefront needs (no orders / customer data). */
export type PublicData = Pick<DB, "settings" | "rates" | "categories" | "slides" | "collections" | "brides" | "stores" | "testimonials"> & {
  products: Product[];
};
