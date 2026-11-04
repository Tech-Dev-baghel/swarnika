import "server-only";
import type { Order, Settings, TrackEvent } from "./types";

/**
 * DTDC (Shipsy platform) — ask your DTDC account manager for API access. Environment variables:
 *   DTDC_API_KEY, DTDC_CUSTOMER_CODE           booking, label, cancel
 *   DTDC_SERVICE_TYPE                          e.g. "B2C PRIORITY" (the service name on your DTDC contract)
 *   DTDC_TRACK_USERNAME, DTDC_TRACK_PASSWORD   tracking API login (separate from the booking key)
 *   DTDC_ENV=staging                           use DTDC's test servers while trying it out
 * The exact field list can differ by contract — compare with the API document DTDC gives you.
 */
const env = (k: string) => process.env[k] || "";
const staging = () => env("DTDC_ENV") === "staging";
const URLS = () => ({
  api: env("DTDC_API_BASE") || (staging() ? "https://demodashboardapi.shipsy.in/api/" : "https://dtdcapi.shipsy.io/api/"),
  label: env("DTDC_LABEL_URL") || (staging() ? "https://demodashboardapi.shipsy.in/api/customer/integration/consignment/shippinglabel/stream" : "https://dtdcapi.shipsy.io/api/customer/integration/consignment/shippinglabel/stream"),
  auth: env("DTDC_AUTH_URL") || (staging() ? "https://dtdcstagingapi.dtdc.com/dtdc-tracking-api/dtdc-api/api/dtdc/authenticate" : "https://blktracksvc.dtdc.com/dtdc-api/api/dtdc/authenticate"),
  track: env("DTDC_TRACK_URL") || (staging() ? "https://dtdcstagingapi.dtdc.com/dtdc-tracking-api/dtdc-api/rest/JSONCnTrk/getTrackDetails" : "https://blktracksvc.dtdc.com/dtdc-api/rest/JSONCnTrk/getTrackDetails"),
  pincode: env("DTDC_PINCODE_URL") || "https://smarttrack.ctbsplus.dtdc.com/ratecalapi/PincodeApiCall",
});

export const dtdcEnabled = () => Boolean(env("DTDC_API_KEY") && env("DTDC_CUSTOMER_CODE"));
export const dtdcTrackingEnabled = () => Boolean(env("DTDC_TRACK_USERNAME") && env("DTDC_TRACK_PASSWORD"));
export class DtdcError extends Error {}

const T = (ms = 15000) => AbortSignal.timeout(ms);
const keyHeaders = () => ({ "Content-Type": "application/json", "api-key": env("DTDC_API_KEY") });

/** Splits a long address into two lines of at most ~100 characters. */
function lines(a: string) {
  const s = a.replace(/\s+/g, " ").trim();
  if (s.length <= 100) return [s, ""];
  const cut = s.lastIndexOf(",", 100) > 40 ? s.lastIndexOf(",", 100) + 1 : 100;
  return [s.slice(0, cut).trim(), s.slice(cut, cut + 100).trim()];
}

export type ShipInput = { weightKg: number; lengthCm?: number; widthCm?: number; heightCm?: number; declaredValue: number; codAmount: number; description: string };

/** Books a consignment. Returns the AWB (DTDC "reference_number"). */
export async function createShipment(o: Order, s: Settings, x: ShipInput): Promise<{ awb: string; raw: unknown }> {
  if (!dtdcEnabled()) throw new DtdcError("DTDC isn't set up yet. Add DTDC_API_KEY and DTDC_CUSTOMER_CODE in the environment variables.");
  if (!s.pickupPincode || !s.pickupAddress || !s.pickupPhone) throw new DtdcError("Fill the pickup address, pincode and phone in Settings → Shipping first.");
  const [o1, o2] = lines(s.pickupAddress), [d1, d2] = lines(o.customer.address);
  const body = {
    consignments: [{
      customer_code: env("DTDC_CUSTOMER_CODE"),
      service_type_id: env("DTDC_SERVICE_TYPE") || "B2C PRIORITY",
      load_type: "NON-DOCUMENT",
      description: x.description.slice(0, 100),
      dimension_unit: "cm", length: String(x.lengthCm ?? 15), width: String(x.widthCm ?? 12), height: String(x.heightCm ?? 8),
      weight_unit: "kg", weight: String(Math.max(0.1, x.weightKg)),
      declared_value: String(Math.round(x.declaredValue)),
      num_pieces: "1",
      customer_reference_number: o.id,
      cod_collection_mode: x.codAmount > 0 ? "cash" : "",
      cod_amount: String(Math.round(x.codAmount)),
      commodity_id: env("DTDC_COMMODITY_ID") || "",
      is_risk_surcharge_applicable: true,
      invoice_number: o.invoiceNo ?? o.id,
      invoice_date: (o.invoiceDate ?? o.createdAt).slice(0, 10),
      origin_details: { name: s.pickupName || s.legalName || s.brandName, phone: s.pickupPhone.replace(/\D/g, "").slice(-10), alternate_phone: "", address_line_1: o1, address_line_2: o2, pincode: s.pickupPincode, city: s.pickupCity, state: s.pickupState },
      destination_details: { name: o.customer.name, phone: o.customer.phone.replace(/\D/g, "").slice(-10), alternate_phone: "", address_line_1: d1, address_line_2: d2, pincode: o.customer.pincode, city: o.customer.city, state: o.customer.state ?? "" },
      pieces_detail: [],
    }],
  };
  const r = await fetch(URLS().api + "customer/integration/consignment/softdata", { method: "POST", headers: keyHeaders(), body: JSON.stringify(body), signal: T(), cache: "no-store" });
  const j = (await r.json().catch(() => ({}))) as { status?: string; data?: { success?: boolean; reference_number?: string; message?: string; reason?: string }[]; message?: string };
  const d = j.data?.[0];
  if (!r.ok || !d?.success || !d.reference_number) throw new DtdcError(`DTDC did not accept the shipment: ${d?.message || d?.reason || j.message || `HTTP ${r.status}`}`);
  return { awb: d.reference_number, raw: j };
}

/** 4×6 shipping label as a PDF. */
export async function labelPdf(awb: string): Promise<ArrayBuffer> {
  const u = `${URLS().label}?reference_number=${encodeURIComponent(awb)}&label_code=SHIP_LABEL_4X6&label_format=pdf`;
  const r = await fetch(u, { headers: keyHeaders(), signal: T(), cache: "no-store" });
  if (!r.ok) throw new DtdcError(`DTDC label not available (HTTP ${r.status})`);
  const buf = await r.arrayBuffer();
  // Some accounts return JSON with a base64 label instead of a raw PDF.
  if ((r.headers.get("content-type") || "").includes("json")) {
    const j = JSON.parse(Buffer.from(buf).toString("utf8")) as { label?: string; data?: { label?: string }[] };
    const b64 = j.label || j.data?.[0]?.label;
    if (!b64) throw new DtdcError("DTDC returned no label");
    const out = Buffer.from(b64, "base64");
    return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer;
  }
  return buf;
}

export async function cancelShipment(awb: string) {
  const r = await fetch(URLS().api + "customer/integration/consignment/cancel", { method: "POST", headers: keyHeaders(), body: JSON.stringify({ AWBNo: [awb], customerCode: env("DTDC_CUSTOMER_CODE") }), signal: T(), cache: "no-store" });
  const j = (await r.json().catch(() => ({}))) as { status?: string; success?: boolean; message?: string };
  if (!r.ok || j.success === false || /fail|error/i.test(String(j.status ?? ""))) throw new DtdcError(`DTDC could not cancel: ${j.message || `HTTP ${r.status}`}`);
}

/* ---------------- tracking (token cached in memory for ~12 hours) */
const g = globalThis as unknown as { __dtdcToken?: { v: string; exp: number } };
async function token() {
  if (g.__dtdcToken && g.__dtdcToken.exp > Date.now()) return g.__dtdcToken.v;
  const u = `${URLS().auth}?username=${encodeURIComponent(env("DTDC_TRACK_USERNAME"))}&password=${encodeURIComponent(env("DTDC_TRACK_PASSWORD"))}`;
  const r = await fetch(u, { signal: T(), cache: "no-store" });
  const t = (await r.text()).trim().replace(/^"|"$/g, "");
  if (!r.ok || !t || t.length > 400 || /error|invalid/i.test(t)) throw new DtdcError("DTDC tracking login failed — check DTDC_TRACK_USERNAME / DTDC_TRACK_PASSWORD.");
  g.__dtdcToken = { v: t, exp: Date.now() + 12 * 3600 * 1000 };
  return t;
}

/** "28102026" + "1435" → ISO time (IST). */
function dtdcTime(d?: string, t?: string) {
  if (!d || !/^\d{8}$/.test(d)) return new Date().toISOString();
  const hh = t && /^\d{3,4}$/.test(t) ? t.padStart(4, "0") : "0000";
  return new Date(`${d.slice(4)}-${d.slice(2, 4)}-${d.slice(0, 2)}T${hh.slice(0, 2)}:${hh.slice(2)}:00+05:30`).toISOString();
}

export type Tracking = { status: string; delivered: boolean; returned: boolean; events: TrackEvent[] };
export async function track(awb: string): Promise<Tracking> {
  if (!dtdcTrackingEnabled()) throw new DtdcError("DTDC tracking isn't set up (DTDC_TRACK_USERNAME / DTDC_TRACK_PASSWORD).");
  const r = await fetch(URLS().track, {
    method: "POST", headers: { "Content-Type": "application/json", "x-access-token": await token() },
    body: JSON.stringify({ trkType: "cnno", strcnno: awb, addtnlDtl: "Y" }), signal: T(), cache: "no-store",
  });
  if (r.status === 401) g.__dtdcToken = undefined;
  const j = (await r.json().catch(() => ({}))) as {
    statusFlag?: boolean; errorDetails?: { name?: string; value?: string }[];
    trackHeader?: { strStatus?: string; strStatusTransOn?: string; strStatusTransTime?: string };
    trackDetails?: { strCode?: string; strAction?: string; strOrigin?: string; strDestination?: string; strActionDate?: string; strActionTime?: string; sTrRemarks?: string }[];
  };
  if (!r.ok || j.statusFlag === false) throw new DtdcError(`DTDC tracking: ${j.errorDetails?.[0]?.value || `HTTP ${r.status}`}`);
  const events: TrackEvent[] = (j.trackDetails ?? []).map((e) => ({
    at: dtdcTime(e.strActionDate, e.strActionTime), status: e.strAction || e.strCode || "", location: e.strOrigin || e.strDestination || "", remarks: e.sTrRemarks || "",
  })).sort((a, b) => b.at.localeCompare(a.at));
  const status = j.trackHeader?.strStatus || events[0]?.status || "Booked";
  return { status, events, delivered: /deliver/i.test(status) && !/undeliver|not deliver|rto/i.test(status), returned: /rto|return/i.test(status) };
}

/* ---------------- pincode serviceability */
export type Serviceability = { serviceable: boolean | null; cod: boolean | null };
export async function serviceability(from: string, to: string): Promise<Serviceability> {
  const r = await fetch(URLS().pincode, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orgPincode: from, desPincode: to }), signal: T(6000), cache: "no-store" });
  const j = (await r.json().catch(() => null)) as Record<string, unknown> | null;
  if (!r.ok || !j) return { serviceable: null, cod: null };
  const zip = (j.ZIPCODE_RESP as Record<string, string>[] | undefined)?.[0];
  const list = (j.SERV_LIST as Record<string, string>[] | undefined) ?? [];
  const flag = zip?.SERVFLAG ?? zip?.SERV_FLAG;
  const serviceable = flag ? flag === "Y" : list.length ? list.some((x) => Object.entries(x).some(([k, v]) => /serv/i.test(k) && !/cod/i.test(k) && v === "Y")) : null;
  const codVals = list.flatMap((x) => Object.entries(x).filter(([k]) => /cod/i.test(k)).map(([, v]) => v));
  return { serviceable, cod: codVals.length ? codVals.includes("Y") : null };
}
