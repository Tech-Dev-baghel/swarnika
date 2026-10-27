"use client";

import { img, inr, priceOf } from "@/lib/pricing";
import { GENDERS, METAL_LABEL, METALS, OCCASIONS, PURITIES, STONE_LABEL, STONES, TAGS, type Category, type Rate } from "@/lib/types";
import type { FieldDef } from "./fields";

export type Extra = { categories: Category[]; rates: Rate[] };
type Row = Record<string, unknown> & { id: string };
export type Column = { label: string; render: (r: Row, x: Extra) => React.ReactNode; className?: string };
export type Config = {
  title: string;
  singular: string;
  resource: string;
  description: string;
  fields: (x: Extra) => FieldDef[];
  columns: Column[];
  defaults: (x: Extra) => Record<string, unknown>;
  search: string[];
  sortable?: boolean;
};

const opts = (arr: readonly string[], label?: Record<string, string>) => arr.map((v) => ({ value: v, label: label?.[v] ?? v }));

const Thumb = ({ src, round }: { src?: unknown; round?: boolean }) =>
  src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={img(String(src), 120)} alt="" className={`h-12 w-12 object-cover ${round ? "rounded-full" : "rounded-lg"} bg-stone-100`} />
  ) : <div className="h-12 w-12 rounded-lg bg-stone-100" />;

const Badge = ({ on, yes = "Active", no = "Hidden" }: { on: unknown; yes?: string; no?: string }) => (
  <span className={`rounded-full px-2 py-0.5 text-xs ${on ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-600"}`}>{on ? yes : no}</span>
);

export const CONFIGS: Record<string, Config> = {
  products: {
    title: "Products", singular: "product", resource: "products",
    description: "Every design in the store. Price is calculated live from weight × today's gold rate + making % + stone value + 3% GST.",
    search: ["name", "id", "collection", "category"],
    fields: (x) => [
      { key: "name", label: "Product name", type: "text", required: true, wide: true },
      { key: "images", label: "Photos", type: "images", wide: true },
      { key: "category", label: "Category", type: "select", required: true, options: x.categories.map((c) => ({ value: c.slug, label: c.label })) },
      { key: "collection", label: "Collection", type: "text", placeholder: "e.g. Mandir" },
      { key: "metal", label: "Metal", type: "select", required: true, options: opts(METALS, METAL_LABEL) },
      { key: "purity", label: "Purity (sets gold rate)", type: "select", required: true, options: opts(PURITIES) },
      { key: "weight", label: "Gross weight (g)", type: "number", required: true, step: 0.01, min: 0 },
      { key: "makingPct", label: "Making charges (%)", type: "number", required: true, step: 0.5, min: 0 },
      { key: "stone", label: "Stone", type: "select", required: true, options: opts(STONES, STONE_LABEL) },
      { key: "stoneValue", label: "Stone value (₹)", type: "number", min: 0 },
      { key: "occasion", label: "Occasion", type: "select", required: true, options: opts(OCCASIONS) },
      { key: "gender", label: "For", type: "select", required: true, options: opts(GENDERS) },
      { key: "stock", label: "Stock (pieces)", type: "number", min: 0 },
      { key: "active", label: "Show on website", type: "checkbox" },
      { key: "tags", label: "Badges", type: "multi", options: opts(TAGS, { new: "New", bestseller: "Bestseller", trending: "Trending" }), wide: true },
      { key: "rating", label: "Rating (0–5)", type: "number", step: 0.1, min: 0 },
      { key: "reviews", label: "Number of reviews", type: "number", min: 0 },
      { key: "description", label: "Description", type: "textarea", wide: true },
    ],
    defaults: (x) => ({ name: "", images: [], category: x.categories[0]?.slug ?? "", collection: "", metal: "yellow", purity: "22KT", weight: 2, makingPct: 14, stone: "none", stoneValue: 0, occasion: "Daily Wear", gender: "Women", stock: 5, active: true, tags: ["new"], rating: 5, reviews: 0, description: "" }),
    columns: [
      { label: "", render: (r) => <Thumb src={(r.images as string[])?.[0]} /> },
      { label: "Product", render: (r, x) => <div><p className="font-medium text-stone-900">{String(r.name)}</p><p className="text-xs text-stone-500">{r.id} · {x.categories.find((c) => c.slug === r.category)?.label ?? String(r.category)} · {String(r.purity)} {METAL_LABEL[r.metal as keyof typeof METAL_LABEL]}</p></div> },
      { label: "Weight", render: (r) => `${r.weight} g`, className: "hidden md:table-cell" },
      { label: "Price", render: (r, x) => inr(priceOf(r as never, x.rates)) },
      { label: "Stock", render: (r) => <span className={Number(r.stock) <= 2 ? "font-medium text-red-700" : ""}>{String(r.stock ?? 0)}</span>, className: "hidden sm:table-cell" },
      { label: "Status", render: (r) => <Badge on={r.active} /> },
    ],
  },
  categories: {
    title: "Categories", singular: "category", resource: "categories", sortable: true,
    description: "The circles under “Shop by Category” and the category filter. The slug is used in links (e.g. /shop?category=ring).",
    search: ["label", "slug"],
    fields: () => [
      { key: "label", label: "Name", type: "text", required: true },
      { key: "slug", label: "Slug (lowercase, no spaces)", type: "text", required: true, help: "Existing products use this slug — change carefully." },
      { key: "order", label: "Sort order", type: "number" },
      { key: "image", label: "Image", type: "image", wide: true },
    ],
    defaults: () => ({ label: "", slug: "", order: 99, image: "" }),
    columns: [
      { label: "", render: (r) => <Thumb src={r.image} round /> },
      { label: "Name", render: (r) => <span className="font-medium">{String(r.label)}</span> },
      { label: "Slug", render: (r) => <code className="text-xs">{String(r.slug)}</code> },
      { label: "Order", render: (r) => String(r.order) },
    ],
  },
  slides: {
    title: "Homepage Banners", singular: "banner", resource: "slides", sortable: true,
    description: "The large rotating slides at the top of the homepage.",
    search: ["title", "eyebrow"],
    fields: () => [
      { key: "image", label: "Banner image (wide, 1920×900 or larger)", type: "image", wide: true },
      { key: "eyebrow", label: "Small heading", type: "text" },
      { key: "title", label: "Main heading", type: "text", required: true, wide: true },
      { key: "cta", label: "Button text", type: "text", required: true },
      { key: "href", label: "Button link", type: "text", required: true, placeholder: "/shop?occasion=Festive" },
      { key: "order", label: "Sort order", type: "number" },
      { key: "active", label: "Show", type: "checkbox" },
    ],
    defaults: () => ({ image: "", eyebrow: "", title: "", cta: "Shop now", href: "/shop", order: 99, active: true }),
    columns: [
      { label: "", render: (r) => <Thumb src={r.image} /> },
      { label: "Banner", render: (r) => <div><p className="font-medium">{String(r.title)}</p><p className="text-xs text-stone-500">{String(r.eyebrow)} → {String(r.href)}</p></div> },
      { label: "Order", render: (r) => String(r.order) },
      { label: "Status", render: (r) => <Badge on={r.active} /> },
    ],
  },
  collections: {
    title: "Collections", singular: "collection", resource: "collections", sortable: true,
    description: "Signature collection tiles. Products whose “Collection” matches the name appear when a tile is clicked.",
    search: ["name"],
    fields: () => [
      { key: "name", label: "Collection name", type: "text", required: true },
      { key: "blurb", label: "Short line", type: "text" },
      { key: "order", label: "Sort order", type: "number" },
      { key: "image", label: "Image (portrait)", type: "image", wide: true },
    ],
    defaults: () => ({ name: "", blurb: "", order: 99, image: "" }),
    columns: [
      { label: "", render: (r) => <Thumb src={r.image} /> },
      { label: "Name", render: (r) => <div><p className="font-medium">{String(r.name)}</p><p className="text-xs text-stone-500">{String(r.blurb)}</p></div> },
      { label: "Order", render: (r) => String(r.order) },
    ],
  },
  brides: {
    title: "Regional Brides", singular: "bride", resource: "brides", sortable: true,
    description: "Tiles in the “Brides of Every Region” section.",
    search: ["name"],
    fields: () => [
      { key: "name", label: "Region (e.g. Bengali)", type: "text", required: true },
      { key: "order", label: "Sort order", type: "number" },
      { key: "image", label: "Image (portrait)", type: "image", wide: true },
    ],
    defaults: () => ({ name: "", order: 99, image: "" }),
    columns: [
      { label: "", render: (r) => <Thumb src={r.image} /> },
      { label: "Region", render: (r) => <span className="font-medium">{String(r.name)} Bride</span> },
      { label: "Order", render: (r) => String(r.order) },
    ],
  },
  stores: {
    title: "Stores", singular: "store", resource: "stores",
    description: "Showrooms listed in the store finder. Customers can request visits and video calls for each.",
    search: ["name", "city", "address"],
    fields: () => [
      { key: "name", label: "Store name", type: "text", required: true },
      { key: "city", label: "City", type: "text", required: true },
      { key: "address", label: "Address", type: "textarea", required: true, wide: true },
      { key: "phone", label: "Phone", type: "text" },
      { key: "hours", label: "Opening hours", type: "text", placeholder: "10:30 AM – 9:00 PM" },
    ],
    defaults: () => ({ name: "", city: "", address: "", phone: "", hours: "10:30 AM – 9:00 PM", image: "" }),
    columns: [
      { label: "Store", render: (r) => <div><p className="font-medium">{String(r.name)}</p><p className="text-xs text-stone-500">{String(r.address)}</p></div> },
      { label: "City", render: (r) => String(r.city) },
      { label: "Phone", render: (r) => String(r.phone), className: "hidden md:table-cell" },
    ],
  },
  testimonials: {
    title: "Customer Reviews", singular: "review", resource: "testimonials",
    description: "Reviews shown in “Stories from Our Family” on the homepage.",
    search: ["name", "text", "city"],
    fields: () => [
      { key: "name", label: "Customer name", type: "text", required: true },
      { key: "city", label: "City", type: "text" },
      { key: "item", label: "What they bought", type: "text" },
      { key: "rating", label: "Stars (1–5)", type: "number", min: 1 },
      { key: "text", label: "Review", type: "textarea", required: true, wide: true },
    ],
    defaults: () => ({ name: "", city: "", item: "", rating: 5, text: "" }),
    columns: [
      { label: "Customer", render: (r) => <div><p className="font-medium">{String(r.name)}</p><p className="text-xs text-stone-500">{String(r.city)}</p></div> },
      { label: "Review", render: (r) => <p className="line-clamp-2 max-w-md text-sm">{String(r.text)}</p> },
      { label: "Stars", render: (r) => "★".repeat(Number(r.rating) || 0) },
    ],
  },
  coupons: {
    title: "Coupons", singular: "coupon", resource: "coupons",
    description: "Discount codes customers can enter in the bag.",
    search: ["code"],
    fields: () => [
      { key: "code", label: "Code", type: "text", required: true, placeholder: "DIWALI10" },
      { key: "type", label: "Type", type: "select", required: true, options: [{ value: "percent", label: "Percent off" }, { value: "flat", label: "Flat ₹ off" }] },
      { key: "value", label: "Value", type: "number", required: true, min: 0 },
      { key: "active", label: "Active", type: "checkbox" },
    ],
    defaults: () => ({ code: "", type: "percent", value: 5, active: true }),
    columns: [
      { label: "Code", render: (r) => <code className="font-medium">{String(r.code)}</code> },
      { label: "Discount", render: (r) => (r.type === "percent" ? `${r.value}% off` : `${inr(Number(r.value))} off`) },
      { label: "Status", render: (r) => <Badge on={r.active} /> },
    ],
  },
};
