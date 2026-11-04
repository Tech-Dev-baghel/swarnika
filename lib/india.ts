/** Indian states / union territories with their GST state codes. */
export const STATES: { code: string; name: string }[] = [
  { code: "35", name: "Andaman and Nicobar Islands" }, { code: "37", name: "Andhra Pradesh" }, { code: "12", name: "Arunachal Pradesh" },
  { code: "18", name: "Assam" }, { code: "10", name: "Bihar" }, { code: "04", name: "Chandigarh" }, { code: "22", name: "Chhattisgarh" },
  { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu" }, { code: "07", name: "Delhi" }, { code: "30", name: "Goa" },
  { code: "24", name: "Gujarat" }, { code: "06", name: "Haryana" }, { code: "02", name: "Himachal Pradesh" }, { code: "01", name: "Jammu and Kashmir" },
  { code: "20", name: "Jharkhand" }, { code: "29", name: "Karnataka" }, { code: "32", name: "Kerala" }, { code: "38", name: "Ladakh" },
  { code: "31", name: "Lakshadweep" }, { code: "23", name: "Madhya Pradesh" }, { code: "27", name: "Maharashtra" }, { code: "14", name: "Manipur" },
  { code: "17", name: "Meghalaya" }, { code: "15", name: "Mizoram" }, { code: "13", name: "Nagaland" }, { code: "21", name: "Odisha" },
  { code: "34", name: "Puducherry" }, { code: "03", name: "Punjab" }, { code: "08", name: "Rajasthan" }, { code: "11", name: "Sikkim" },
  { code: "33", name: "Tamil Nadu" }, { code: "36", name: "Telangana" }, { code: "16", name: "Tripura" }, { code: "09", name: "Uttar Pradesh" },
  { code: "05", name: "Uttarakhand" }, { code: "19", name: "West Bengal" },
];

const norm = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z]/g, "");
/** Finds a state by name (tolerant of case, "&", "NCT of Delhi" etc.). */
export function findState(name?: string | null) {
  if (!name) return undefined;
  const n = norm(name);
  return STATES.find((s) => norm(s.name) === n) ?? STATES.find((s) => n.includes(norm(s.name)) || norm(s.name).includes(n));
}
export const stateCode = (name?: string | null) => findState(name)?.code ?? "";

/** GST split for a GST-inclusive amount (jewellery: 3%). Same state → CGST + SGST, otherwise IGST. */
export function gstSplit(inclusive: number, ratePct: number, sellerState: string, buyerState: string) {
  const taxable = Math.round((inclusive / (1 + ratePct / 100)) * 100) / 100;
  const tax = Math.round((inclusive - taxable) * 100) / 100;
  const intra = Boolean(sellerState) && stateCode(sellerState) !== "" && stateCode(sellerState) === stateCode(buyerState);
  const half = Math.round((tax / 2) * 100) / 100;
  return { taxable, tax, intra, cgst: intra ? half : 0, sgst: intra ? Math.round((tax - half) * 100) / 100 : 0, igst: intra ? 0 : tax };
}

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const two = (n: number) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? " " + ONES[n % 10] : ""}`);
const three = (n: number) => (n >= 100 ? `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? " " + two(n % 100) : ""}` : two(n));
/** 112345 → "One Lakh Twelve Thousand Three Hundred Forty Five Rupees Only" (Indian numbering). */
export function rupeesInWords(amount: number) {
  let n = Math.round(amount);
  if (n === 0) return "Zero Rupees Only";
  const parts: string[] = [];
  const crore = Math.floor(n / 1e7); n %= 1e7;
  const lakh = Math.floor(n / 1e5); n %= 1e5;
  const thousand = Math.floor(n / 1e3); n %= 1e3;
  if (crore) parts.push(`${three(crore)} Crore`);
  if (lakh) parts.push(`${two(lakh)} Lakh`);
  if (thousand) parts.push(`${two(thousand)} Thousand`);
  if (n) parts.push(three(n));
  return `${parts.join(" ")} Rupees Only`;
}
