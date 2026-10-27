// First-run data. After the first start everything lives in data/db.json and is edited from /admin.
// Photos are free-licence Unsplash images (https://unsplash.com/license); replace them with your own from the admin panel.
import type { DB, Product } from "./types";

const U = (id: string) => `https://images.unsplash.com/${id}`;

const DESC: Record<string, string> = {
  ring: "Hand-finished by our karigars and polished to a mirror shine. Free resizing within 30 days.",
  earring: "Light on the ear and secure with screw-back locks. Comes in a velvet Swarnika box.",
  necklace: "A statement piece crafted for celebrations, with an adjustable dori for the perfect fit.",
  pendant: "Pairs with any chain. Chain sold separately unless mentioned.",
  bangle: "Comfort-fit inner curve for all-day wear. Available in multiple sizes.",
  bracelet: "Secure box clasp with a safety catch. Adjustable by one link in store.",
  chain: "Strong, flexible links that sit flat. Lobster clasp.",
  mangalsutra: "Traditional black beads finished with a modern pendant.",
  nosepin: "Hypoallergenic screw fitting, comfortable for everyday wear.",
  coin: "999.9 purity coin in tamper-proof certified packaging.",
};

type Row = [string, string, string, Product["metal"], Product["purity"], Product["stone"], number, number, Product["occasion"], Product["gender"], string, Product["tags"], number, number, number, string[]];
const rows: Row[] = [
  ["sw-101", "Lotus Bloom Gold Ring", "ring", "yellow", "22KT", "none", 3.2, 0, "Daily Wear", "Women", "Kamal", ["bestseller"], 4.8, 212, 14, ["photo-1598560917807-1bae44bd2be8", "photo-1617038260897-41a1f14a8ca0"]],
  ["sw-102", "Solitaire Promise Ring", "ring", "white", "18KT", "diamond", 2.8, 48000, "Wedding", "Women", "Ever After", ["trending"], 4.9, 156, 12, ["photo-1605100804763-247f67b3557e", "photo-1607703829739-c05b7beddf60"]],
  ["sw-103", "Emerald Leaf Cocktail Ring", "ring", "yellow", "18KT", "emerald", 4.1, 22000, "Party", "Women", "Vanya", ["new"], 4.6, 48, 14, ["photo-1626784213922-d9f1e050cf8f", "photo-1543294001-f7cd5d7fb516"]],
  ["sw-104", "Classic Band for Him", "ring", "platinum", "PT950", "none", 7.5, 0, "Wedding", "Men", "Ever After", [], 4.7, 88, 18, ["photo-1615655114865-4cc1bda5901e", "photo-1719924998065-0c60e329ef58"]],
  ["sw-105", "Rose Petal Stackable Ring", "ring", "rose", "18KT", "diamond", 1.9, 9500, "Office Wear", "Women", "Petal", ["new", "trending"], 4.6, 48, 14, ["photo-1603561591411-07134e71a2a9", "photo-1608508644127-ba99d7732fee"]],
  ["sw-106", "Ruby Halo Ring", "ring", "yellow", "22KT", "ruby", 3.6, 14000, "Festive", "Women", "Rang", [], 4.6, 48, 14, ["photo-1613945407943-59cd755fd69e", "photo-1631982690223-8aa4be0a2497"]],

  ["sw-201", "Temple Jhumka Earrings", "earring", "yellow", "22KT", "none", 9.8, 0, "Festive", "Women", "Mandir", ["bestseller"], 4.9, 341, 16, ["photo-1671642883395-0ab89c3ac890", "photo-1701450723521-788008974862"]],
  ["sw-202", "Diamond Drop Studs", "earring", "white", "18KT", "diamond", 2.4, 36000, "Party", "Women", "Ever After", ["trending"], 4.6, 48, 14, ["photo-1621939745912-aad97fd3a34d", "photo-1535632066927-ab7c9ab60908"]],
  ["sw-203", "Pearl Chandbali", "earring", "yellow", "22KT", "pearl", 7.2, 6000, "Wedding", "Women", "Rang", [], 4.6, 48, 14, ["photo-1590166223826-12dee1677420", "photo-1652766540048-de0a878a3266"]],
  ["sw-204", "Everyday Hoops", "earring", "rose", "18KT", "none", 3.1, 0, "Daily Wear", "Women", "Petal", ["new"], 4.6, 48, 14, ["photo-1617038220319-276d3cfab638", "photo-1671644730555-916aa8d8157f"]],
  ["sw-205", "Tiny Star Studs for Kids", "earring", "yellow", "22KT", "none", 1.1, 0, "Daily Wear", "Kids", "Little Stars", [], 4.8, 64, 14, ["photo-1693212793204-bcea856c75fe"]],
  ["sw-206", "Emerald Cluster Studs", "earring", "yellow", "18KT", "emerald", 2.9, 18000, "Office Wear", "Women", "Vanya", [], 4.6, 48, 14, ["photo-1535632066927-ab7c9ab60908", "photo-1693212793204-bcea856c75fe"]],

  ["sw-301", "Rani Haar Bridal Necklace", "necklace", "yellow", "22KT", "ruby", 62, 42000, "Wedding", "Women", "Rang", ["bestseller"], 4.9, 97, 18, ["photo-1705326454924-f6777522b030", "photo-1650455221359-3aebf920bcc5"]],
  ["sw-302", "Diamond Riviera Necklace", "necklace", "white", "18KT", "diamond", 18, 245000, "Party", "Women", "Ever After", ["trending"], 4.8, 41, 14, ["photo-1722410180687-b05b50922362", "photo-1573408301185-9146fe634ad0"]],
  ["sw-303", "Kundan Choker", "necklace", "yellow", "22KT", "emerald", 38, 28000, "Wedding", "Women", "Mandir", ["new"], 4.6, 48, 14, ["photo-1705326452390-3ecf6070595f", "photo-1601121141461-9d6647bca1ed"]],
  ["sw-304", "Minimal Bar Necklace", "necklace", "rose", "18KT", "none", 4.6, 0, "Office Wear", "Women", "Petal", [], 4.6, 48, 14, ["photo-1616837874254-8d5aaa63e273", "photo-1601821765780-754fa98637c1"]],

  ["sw-401", "Om Gold Pendant", "pendant", "yellow", "22KT", "none", 2.6, 0, "Daily Wear", "Unisex", "Kamal", ["bestseller"], 4.7, 189, 14, ["photo-1569397288884-4d43d6738fbd", "photo-1506630448388-4e683c67ddb0"]],
  ["sw-402", "Heart Diamond Pendant", "pendant", "rose", "18KT", "diamond", 1.8, 14500, "Party", "Women", "Petal", ["trending"], 4.6, 48, 14, ["photo-1605100804567-1ffe942b5cd6", "photo-1598560917505-59a3ad559071"]],
  ["sw-403", "Ruby Teardrop Pendant", "pendant", "yellow", "18KT", "ruby", 2.2, 11000, "Festive", "Women", "Rang", ["new"], 4.6, 48, 14, ["photo-1602752250055-5ebb552fc3ae", "photo-1682629846138-7db022565bd5"]],

  ["sw-501", "Carved Kada Bangle", "bangle", "yellow", "22KT", "none", 24, 0, "Festive", "Women", "Mandir", ["bestseller"], 4.8, 132, 15, ["photo-1690175867343-2af70ea57537", "photo-1679156271456-d6068c543ee7"]],
  ["sw-502", "Diamond Line Bangle", "bangle", "white", "18KT", "diamond", 12, 68000, "Party", "Women", "Ever After", [], 4.6, 48, 14, ["photo-1611598935678-c88dca238fce", "photo-1692249444938-1d39b550a441"]],
  ["sw-503", "Men's Bold Kada", "bangle", "yellow", "22KT", "none", 32, 0, "Festive", "Men", "Shaurya", ["trending"], 4.6, 48, 14, ["photo-1723144290967-b9a692207d04", "photo-1723144290281-de6d80a79028"]],

  ["sw-601", "Tennis Bracelet", "bracelet", "white", "18KT", "diamond", 9.5, 120000, "Party", "Women", "Ever After", ["trending"], 4.9, 52, 14, ["photo-1573408301185-9146fe634ad0", "photo-1611598935678-c88dca238fce"]],
  ["sw-602", "Rose Charm Bracelet", "bracelet", "rose", "18KT", "none", 5.4, 0, "Daily Wear", "Women", "Petal", ["new"], 4.6, 48, 14, ["photo-1717605383946-96c6884c36b4", "photo-1708221235482-a6e2a807198f"]],
  ["sw-603", "Men's Link Bracelet", "bracelet", "yellow", "22KT", "none", 14, 0, "Office Wear", "Men", "Shaurya", [], 4.6, 48, 14, ["photo-1619119069152-a2b331eb392a", "photo-1602173574767-37ac01994b2a"]],

  ["sw-701", "Rope Chain 20\"", "chain", "yellow", "22KT", "none", 8.2, 0, "Daily Wear", "Unisex", "Kamal", ["bestseller"], 4.7, 260, 10, ["photo-1611107683227-e9060eccd846", "photo-1602173574767-37ac01994b2a"]],
  ["sw-702", "Box Chain for Him", "chain", "yellow", "22KT", "none", 15, 0, "Daily Wear", "Men", "Shaurya", [], 4.6, 77, 10, ["photo-1602173574767-37ac01994b2a", "photo-1611107683227-e9060eccd846"]],

  ["sw-801", "Black Bead Mangalsutra", "mangalsutra", "yellow", "22KT", "none", 6.5, 0, "Daily Wear", "Women", "Bandhan", ["bestseller"], 4.8, 301, 14, ["photo-1651160670627-2896ddf7822f", "photo-1620656798579-1984d9e87df7"]],
  ["sw-802", "Diamond Mangalsutra", "mangalsutra", "yellow", "18KT", "diamond", 5.2, 21000, "Wedding", "Women", "Bandhan", ["new"], 4.6, 48, 14, ["photo-1620656798579-1984d9e87df7", "photo-1633934542430-0905ccb5f050"]],

  ["sw-901", "Petite Nose Pin", "nosepin", "yellow", "22KT", "none", 0.4, 0, "Daily Wear", "Women", "Kamal", [], 4.5, 120, 20, ["photo-1671644730555-916aa8d8157f"]],
  ["sw-902", "Diamond Nose Pin", "nosepin", "white", "18KT", "diamond", 0.5, 6500, "Party", "Women", "Ever After", ["trending"], 4.6, 48, 14, ["photo-1621939745912-aad97fd3a34d"]],

  ["sw-951", "Lakshmi Gold Coin 5g", "coin", "yellow", "24KT", "none", 5, 0, "Festive", "Unisex", "Investment", ["bestseller"], 4.9, 512, 4, ["photo-1589180176337-503fed4bcfe0", "photo-1599038988300-2e3f04d87f8b"]],
  ["sw-952", "Gold Coin 10g", "coin", "yellow", "24KT", "none", 10, 0, "Festive", "Unisex", "Investment", [], 4.9, 280, 4, ["photo-1623743587733-469438d17975", "photo-1633484188188-3d985053a572"]],
];

const products: Product[] = rows.map(([id, name, category, metal, purity, stone, weight, stoneValue, occasion, gender, collection, tags, rating, reviews, makingPct, imgs]) => ({
  id, name, category, metal, purity, stone, weight, stoneValue, occasion, gender, collection, tags, rating, reviews, makingPct,
  images: imgs.map(U), description: DESC[category] ?? "", stock: 10, active: true,
}));

const CAT_IMG: Record<string, string> = {
  earring: "photo-1617038220319-276d3cfab638", ring: "photo-1605100804763-247f67b3557e", necklace: "photo-1705326454924-f6777522b030",
  pendant: "photo-1605100804567-1ffe942b5cd6", bangle: "photo-1690175867343-2af70ea57537", bracelet: "photo-1611598935678-c88dca238fce",
  mangalsutra: "photo-1651160670627-2896ddf7822f", chain: "photo-1611107683227-e9060eccd846", nosepin: "photo-1621939745912-aad97fd3a34d", coin: "photo-1589180176337-503fed4bcfe0",
};
const CAT_LABEL: Record<string, string> = {
  earring: "Earrings", ring: "Rings", necklace: "Necklaces", pendant: "Pendants", bangle: "Bangles", bracelet: "Bracelets",
  mangalsutra: "Mangalsutra", chain: "Chains", nosepin: "Nose Pins", coin: "Gold Coins",
};

export const SEED: DB = {
  settings: {
    brandName: "Swarnika",
    tagline: "Hallmarked gold, certified diamonds and honest pricing — handcrafted in India since our first workshop in Jaipur.",
    promoEnabled: true,
    promoText: "Festive pre-booking is open — reserve gold coins now and collect in store.",
    promoLinkText: "Book now",
    promoLink: "/shop?category=coin",
    phone: "+91 22 4000 1000",
    whatsapp: "",
    instagram: "",
    email: "care@swarnika.example",
    address: "42 Linking Road, Bandra West, Mumbai 400050",
    rateCity: "Mumbai",
    rateUpdated: "Today, 10:30 AM",
    savingsBonusPct: 75,
    marquee: "BIS Hallmarked Gold · Certified Diamonds · Lifetime Exchange · Free Insured Shipping · 15-Day Returns · Video Call Shopping",
    storeImage: U("photo-1626136978522-b67ac41126e9"),
  },
  rates: [
    { purity: "24KT", label: "24 Karat (999)", perGram: 12450, change: 0.42 },
    { purity: "22KT", label: "22 Karat (916)", perGram: 11410, change: 0.38 },
    { purity: "18KT", label: "18 Karat (750)", perGram: 9340, change: 0.35 },
    { purity: "PT950", label: "Platinum (950)", perGram: 4210, change: -0.12 },
  ],
  products,
  categories: Object.keys(CAT_LABEL).map((slug, i) => ({ id: `cat-${slug}`, slug, label: CAT_LABEL[slug], image: U(CAT_IMG[slug]), order: i })),
  slides: [
    { id: "sl-1", eyebrow: "Festive Edit 2026", title: "Gold that glows with every celebration", cta: "Shop Festive", href: "/shop?occasion=Festive", image: U("photo-1617627143750-d86bc21e42bb"), active: true, order: 0 },
    { id: "sl-2", eyebrow: "Ever After · Diamonds", title: "Brilliance for the moments that last", cta: "Explore Diamonds", href: "/shop?stone=diamond", image: U("photo-1481980235850-66e47651e431"), active: true, order: 1 },
    { id: "sl-3", eyebrow: "The Bridal Edit", title: "Heirlooms for the brides of tomorrow", cta: "Shop Wedding", href: "/shop?occasion=Wedding", image: U("photo-1733937108021-d5db469f2216"), active: true, order: 2 },
    { id: "sl-4", eyebrow: "Petal · Everyday", title: "Light gold for every single day", cta: "Shop Daily Wear", href: "/shop?occasion=Daily%20Wear", image: U("photo-1616837874254-8d5aaa63e273"), active: true, order: 3 },
  ],
  collections: [
    { id: "co-1", name: "Mandir", blurb: "Temple craft, hand-carved", image: U("photo-1650455221359-3aebf920bcc5"), order: 0 },
    { id: "co-2", name: "Ever After", blurb: "Diamonds for forever", image: U("photo-1763129636638-615f11f1ad80"), order: 1 },
    { id: "co-3", name: "Petal", blurb: "Featherlight rose gold", image: U("photo-1603561591411-07134e71a2a9"), order: 2 },
    { id: "co-4", name: "Rang", blurb: "Rubies, pearls & colour", image: U("photo-1688382654723-a7366006519b"), order: 3 },
  ],
  brides: [
    ["Bengali", "photo-1617627143750-d86bc21e42bb"], ["Gujarati", "photo-1652374968229-a66a1c170c04"], ["Marathi", "photo-1641699862936-be9f49b1c38d"],
    ["Punjabi", "photo-1740431377901-c2f28d50c759"], ["Tamil", "photo-1733937108021-d5db469f2216"], ["Telugu", "photo-1688382654723-a7366006519b"],
  ].map(([name, id], i) => ({ id: `br-${i}`, name, image: U(id), order: i })),
  stores: [
    ["Mumbai", "Swarnika – Linking Road", "42 Linking Road, Bandra West, Mumbai 400050", "+91 22 4000 1001", "10:30 AM – 9:00 PM"],
    ["Mumbai", "Swarnika – Phoenix Palladium", "Lower Parel, Mumbai 400013", "+91 22 4000 1002", "11:00 AM – 9:30 PM"],
    ["Delhi", "Swarnika – Karol Bagh", "Ajmal Khan Road, Karol Bagh, New Delhi 110005", "+91 11 4000 2001", "10:30 AM – 8:30 PM"],
    ["Delhi", "Swarnika – South Extension", "Part II, South Extension, New Delhi 110049", "+91 11 4000 2002", "11:00 AM – 9:00 PM"],
    ["Bengaluru", "Swarnika – Jayanagar", "4th Block, Jayanagar, Bengaluru 560011", "+91 80 4000 3001", "10:30 AM – 9:00 PM"],
    ["Chennai", "Swarnika – T. Nagar", "Usman Road, T. Nagar, Chennai 600017", "+91 44 4000 4001", "10:00 AM – 9:00 PM"],
    ["Kolkata", "Swarnika – Gariahat", "Gariahat Road, Kolkata 700019", "+91 33 4000 5001", "10:30 AM – 8:30 PM"],
    ["Ahmedabad", "Swarnika – CG Road", "CG Road, Navrangpura, Ahmedabad 380009", "+91 79 4000 6001", "10:30 AM – 9:00 PM"],
    ["Hyderabad", "Swarnika – Banjara Hills", "Road No. 1, Banjara Hills, Hyderabad 500034", "+91 40 4000 7001", "10:30 AM – 9:00 PM"],
    ["Pune", "Swarnika – FC Road", "Fergusson College Road, Shivajinagar, Pune 411004", "+91 20 4000 8001", "10:30 AM – 9:00 PM"],
  ].map(([city, name, address, phone, hours], i) => ({ id: `st-${i}`, city, name, address, phone, hours, image: "" })),
  testimonials: [
    { id: "t-1", name: "Meera K.", city: "Pune", text: "The jhumkas were even prettier in person, and the store team resized them the same day.", item: "Temple Jhumka Earrings", rating: 5 },
    { id: "t-2", name: "Arjun S.", city: "Bengaluru", text: "Booked a video appointment, picked the solitaire, and had it delivered before our anniversary.", item: "Solitaire Promise Ring", rating: 5 },
    { id: "t-3", name: "Farah N.", city: "Hyderabad", text: "Clear price breakup and an exchange value that was honest. That's why I keep coming back.", item: "Gold Exchange", rating: 5 },
  ],
  coupons: [
    { id: "cp-1", code: "FIRST500", type: "flat", value: 500, active: true },
    { id: "cp-2", code: "FESTIVE5", type: "percent", value: 5, active: true },
  ],
  orders: [],
  appointments: [],
  subscribers: [],
};
