import "server-only";
import nodemailer from "nodemailer";
import type { Appointment, Order } from "./types";

/**
 * Optional email alerts. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (and optionally
 * MAIL_FROM, NOTIFY_EMAIL) in .env.local to enable. Without them, nothing is sent.
 */
const enabled = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

function transport() {
  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST, port, secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

async function send(to: string | undefined, subject: string, html: string) {
  if (!enabled() || !to) return;
  try {
    await transport().sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, html });
  } catch (e) {
    console.error("[mail] could not send:", (e as Error).message);
  }
}

export function orderEmails(o: Order, brand: string, shopEmail: string) {
  const rows = o.items.map((i) => `<tr><td>${esc(i.name)}${i.size ? ` (size ${esc(i.size)})` : ""} × ${i.qty}</td><td align="right">${inr(i.price * i.qty)}</td></tr>`).join("");
  const table = `<table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif">${rows}
    ${o.discount ? `<tr><td>Discount ${esc(o.coupon ?? "")}</td><td align="right">−${inr(o.discount)}</td></tr>` : ""}
    ${o.shippingFee ? `<tr><td>Shipping</td><td align="right">${inr(o.shippingFee)}</td></tr>` : ""}
    ${o.codFee ? `<tr><td>Cash on delivery fee</td><td align="right">${inr(o.codFee)}</td></tr>` : ""}
    <tr><td><b>Total</b></td><td align="right"><b>${inr(o.total)}</b></td></tr></table>`;
  const c = o.customer;
  void send(process.env.NOTIFY_EMAIL || shopEmail, `New order ${o.id} — ${inr(o.total)} — ${o.paymentStatus === "paid" ? "PAID ONLINE" : "Cash on delivery"}`,
    `<p><b>${esc(c.name)}</b> · ${esc(c.phone)} ${c.email ? "· " + esc(c.email) : ""}<br>${esc(c.address)}, ${esc(c.city)} – ${esc(c.pincode)}</p>${table}`);
  if (c.email) void send(c.email, `${brand}: order ${o.id} received`,
    `<p>Dear ${esc(c.name)},</p><p>Thank you for shopping with ${esc(brand)}. We've received your order <b>${o.id}</b>${o.paymentStatus === "paid" ? " and your payment" : ""}. ${o.paymentStatus === "paid" ? "We'll let you know as soon as it ships." : "We'll call you shortly to confirm delivery. Please keep the amount ready for cash on delivery."}</p>${table}<p>Track it anytime with your order number and phone.</p>`);
}

export function appointmentEmail(a: Appointment, shopEmail: string) {
  void send(process.env.NOTIFY_EMAIL || shopEmail, `New ${a.type === "video" ? "video call" : "store visit"} request — ${a.name}`,
    `<p>${esc(a.name)} · ${esc(a.phone)}<br>Store: ${esc(a.store)}<br>Preferred time: ${esc(a.date || "Any time")}</p>`);
}

export function resetEmail(to: string, brand: string, link: string, name: string) {
  return send(to, `${brand}: reset your password`,
    `<p>Hi ${esc(name)},</p><p>Click the link below to set a new password. It works for 1 hour.</p><p><a href="${link}">${link}</a></p><p>If you didn't ask for this, you can ignore this email.</p>`);
}
export function welcomeEmail(to: string, brand: string, name: string) {
  void send(to, `Welcome to ${brand}`, `<p>Hi ${esc(name)},</p><p>Your ${esc(brand)} account is ready. You can track orders, save addresses and keep a wishlist.</p>`);
}
export function messageAlert(shopEmail: string, m: { name: string; email: string; phone: string; subject: string; body: string }) {
  void send(process.env.NOTIFY_EMAIL || shopEmail, `New message: ${m.subject || "Contact form"}`,
    `<p><b>${esc(m.name)}</b> · ${esc(m.email)} · ${esc(m.phone)}</p><p>${esc(m.body).replace(/\n/g, "<br>")}</p>`);
}
export function shippedEmail(o: Order) {
  const sh = o.shipment;
  if (!o.customer.email || !sh) return;
  void send(o.customer.email, `Your order ${o.id} is on its way`,
    `<p>Dear ${esc(o.customer.name)},</p><p>Your order <b>${o.id}</b> has been shipped with ${sh.carrier === "dtdc" ? "DTDC" : esc(sh.carrierName ?? "our courier")}.</p><p>Tracking number (AWB): <b>${esc(sh.awb)}</b></p><p>You can follow it on our website under Track Order.</p>`);
}
export const mailEnabled = enabled;
