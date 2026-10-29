import type { Category } from "./types";
import { METAL_LABEL } from "./types";

export type MenuGroup = { title: string; links: { label: string; href: string }[] };
export type MenuItem = { label: string; href: string; groups?: MenuGroup[]; promo?: string; image?: string };

const priceGroup: MenuGroup = {
  title: "Shop by Price",
  links: [
    { label: "Under ₹25,000", href: "/shop?max=25000" },
    { label: "₹25,000 – ₹50,000", href: "/shop?min=25000&max=50000" },
    { label: "₹50,000 – ₹1 Lakh", href: "/shop?min=50000&max=100000" },
    { label: "Above ₹1 Lakh", href: "/shop?min=100000" },
  ],
};
const occasionGroup: MenuGroup = {
  title: "Occasion",
  links: ["Daily Wear", "Office Wear", "Party", "Wedding", "Festive"].map((o) => ({ label: o, href: `/shop?occasion=${encodeURIComponent(o)}` })),
};
const genderGroup: MenuGroup = { title: "Gender", links: ["Women", "Men", "Kids"].map((g) => ({ label: g, href: `/shop?gender=${g}` })) };

export function buildMenu(cats: Category[], images: { gold?: string; diamond?: string; wedding?: string; all?: string; gifting?: string; earring?: string }): MenuItem[] {
  const c = (slug: string, extra = "") => `/shop?category=${slug}${extra}`;
  const has = (s: string) => cats.some((x) => x.slug === s);
  const catLinks = (slugs: string[], extra = "") => slugs.filter(has).map((s) => ({ label: cats.find((x) => x.slug === s)!.label, href: c(s, extra) }));
  return [
    { label: "All Jewellery", href: "/shop", promo: "Every design, one place", image: images.all, groups: [
      { title: "Category", links: cats.map((x) => ({ label: x.label, href: c(x.slug) })) }, priceGroup, occasionGroup,
    ] },
    { label: "Gold", href: "/shop?stone=none", promo: "BIS hallmarked 22KT & 24KT", image: images.gold, groups: [
      { title: "Gold Jewellery", links: catLinks(["earring", "ring", "bangle", "chain", "pendant", "mangalsutra"], "&stone=none") },
      { title: "Metal Colour", links: (["yellow", "rose", "white"] as const).map((m) => ({ label: METAL_LABEL[m], href: `/shop?metal=${m}` })) },
      priceGroup,
    ] },
    { label: "Diamond", href: "/shop?stone=diamond", promo: "Certified, conflict-free", image: images.diamond, groups: [
      { title: "Diamond Jewellery", links: catLinks(["ring", "earring", "pendant", "necklace", "bracelet", "nosepin"], "&stone=diamond") },
      occasionGroup, genderGroup,
    ] },
    { label: "Earrings", href: c("earring"), image: images.earring, groups: [
      { title: "Metal & Stone", links: [{ label: "Diamond", href: c("earring", "&stone=diamond") }, { label: "Gold", href: c("earring", "&stone=none") }, { label: "Rose Gold", href: c("earring", "&metal=rose") }] },
      occasionGroup, priceGroup,
    ] },
    { label: "Daily Wear", href: "/shop?occasion=Daily%20Wear" },
    { label: "Gemstone", href: "/shop?stone=ruby", groups: [
      { title: "Gemstone", links: [{ label: "Ruby", href: "/shop?stone=ruby" }, { label: "Emerald", href: "/shop?stone=emerald" }, { label: "Pearl", href: "/shop?stone=pearl" }] },
    ] },
    { label: "Wedding", href: "/shop?occasion=Wedding", promo: "Brides of every region", image: images.wedding, groups: [
      { title: "Bridal", links: [...catLinks(["necklace", "mangalsutra", "bangle"], "&occasion=Wedding"), { label: "Wedding Bands", href: "/shop?category=ring&occasion=Wedding" }] },
      { title: "Regional Brides", links: ["Bengali", "Gujarati", "Marathi", "Punjabi", "Tamil", "Telugu"].map((r) => ({ label: `${r} Bride`, href: "/shop?occasion=Wedding" })) },
    ] },
    { label: "Gifting", href: "/shop?max=25000", image: images.gifting, groups: [
      { title: "Gifts For", links: [{ label: "Her", href: "/shop?gender=Women&max=50000" }, { label: "Him", href: "/shop?gender=Men" }, { label: "Kids", href: "/shop?gender=Kids" }] },
      { title: "Occasion", links: [{ label: "Birthday", href: "/shop?max=25000" }, { label: "Anniversary", href: "/shop?stone=diamond" }, { label: "Festive", href: "/shop?occasion=Festive" }] },
      { title: "More", links: [{ label: "Gift Cards", href: "/#gifting" }, ...catLinks(["coin"])] },
    ] },
    { label: "Under 50K", href: "/shop?max=50000" },
    { label: "More", href: "/gold-rate", groups: [
      { title: "Invest", links: [{ label: "Today's Gold Rate", href: "/gold-rate" }, { label: "Savings Plan", href: "/#savings" }, { label: "Gold Exchange", href: "/stores" }] },
      { title: "Services", links: [{ label: "Store Locator", href: "/stores" }, { label: "Book an Appointment", href: "/stores" }, { label: "Ring Size Guide", href: "/#guide" }, { label: "Track Order", href: "/track" }] },
      { title: "About", links: [{ label: "About Us", href: "/about" }, { label: "Collections", href: "/collections" }, { label: "FAQ", href: "/faq" }, { label: "Contact Us", href: "/contact" }] },
    ] },
  ];
}
