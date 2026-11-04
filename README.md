# Swarnika Jewels — jewellery store with customer accounts and admin panel (Next.js + Postgres)

## 1. Run it on your computer

1. Install Node.js 20 or newer.
2. In this folder run:
   ```
   npm install
   npm run dev
   ```
3. Open http://localhost:3000 (the shop) and http://localhost:3000/admin (the admin panel).

No database setup is needed on your PC: a built-in Postgres (PGlite) saves everything in the `data/` folder.
To use a real Postgres instead, put `DATABASE_URL=...` in a `.env.local` file.

## 2. How logging in works

### Admin / staff
1. **First time:** open `/admin`. It goes to **/admin/setup**, where you create the **Owner** account (name, email, password).
   This page only works once — after the owner exists it is closed for good.
2. **After that:** staff sign in at **/admin/login** with email + password.
3. The owner adds more people in **Admin → Staff & Roles**:
   - **Owner** — everything, including staff accounts and backups.
   - **Manager** — everything except staff accounts and backups.
   - **Staff** — orders, appointments, messages, customers, products and reviews only.
4. Forgot password: **/admin/forgot** (needs email set up) — or the owner resets it from Staff & Roles.
5. Wrong passwords are limited (8 tries per 15 minutes) and every sign-in is recorded in **Activity Log**.

### Customers
- Create an account at **/register**, log in at **/login** with **email or mobile number** + password.
- The person icon in the header opens **My Account**: orders and their status, saved addresses, profile, password, wishlist.
- Wishlist and addresses follow the customer to any device; checkout fills in their saved address.
- Guests can still check out without an account and track orders at **/track**.
- Forgot password: **/forgot-password**. If email isn't set up, the customer calls you and staff press
  **Create password reset link** on the customer's page in the admin and send it on WhatsApp.

## 3. Hosting on Vercel with the free Neon database

1. Push this folder to GitHub and import it in Vercel (Framework: Next.js, no other settings needed).
2. In your Vercel project open **Storage → Create Database → Neon (Serverless Postgres) → Free plan**,
   then **Connect** it to the project (tick Production and Preview). This adds `DATABASE_URL` automatically.
3. **Deployments → ⋯ → Redeploy.**
4. Open `https://your-site.vercel.app/admin` and create the owner account.

The tables and demo products are created by themselves on the first visit. Uploaded photos are stored in the
database too (up to about 4 MB each on Vercel), so no other storage service is needed.

Without a database connected the site still opens on Vercel with demo data, but nothing can be saved — the admin
shows a banner explaining how to connect Neon.

Recommended environment variables (Vercel → Settings → Environment Variables): `SITE_URL`, `SESSION_SECRET`,
and the `SMTP_*` values if you want emails. See `.env.example`.

### Own server (VPS or office PC)
`npm install && npm run build && npm start` (port 3000). Put it behind https (e.g. Caddy or Nginx) and set
`COOKIE_SECURE=1`. Use `DATABASE_URL` for a Postgres server, or leave it empty to use the built-in one in `data/`.

## 4. Online payments (Razorpay), DTDC courier, COD and GST

Everything below is switched on by adding keys in **Vercel → Settings → Environment Variables** and then
**Deployments → ⋯ → Redeploy**. Admin → Gold Rates & Settings shows a green dot for each connection that works.

### Razorpay (UPI, cards, netbanking, wallets, EMI)
1. Sign up at razorpay.com and finish the business KYC.
2. Dashboard → **Account & Settings → API Keys → Generate Test Key**. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in Vercel, redeploy.
3. Place a test order on your site with Razorpay's test UPI/card details (no real money moves).
4. Dashboard → **Webhooks → Add New Webhook**: URL `https://YOUR-SITE/api/payments/razorpay/webhook`, any secret you choose,
   events `payment.captured`, `payment.failed`, `refund.processed`. Put the same secret in `RAZORPAY_WEBHOOK_SECRET`.
   (This confirms payments even if the customer closes the browser right after paying.)
5. When it works, generate **Live** keys, replace the two key variables in Vercel, create the webhook again in Live mode, redeploy.

How it behaves: online orders are confirmed automatically when paid and get a GST invoice number. If the customer doesn't pay,
the order waits 30 minutes (they can press **Pay now** in their account or on Track Order), then cancels itself and the stock is
released. Owners and managers can refund from the order in the admin.

### DTDC
1. Ask your DTDC account manager for **API access**: API key, customer code, service type, and tracking username/password.
2. Add `DTDC_API_KEY`, `DTDC_CUSTOMER_CODE`, `DTDC_SERVICE_TYPE`, `DTDC_TRACK_USERNAME`, `DTDC_TRACK_PASSWORD` in Vercel
   (`DTDC_ENV=staging` while using their test keys). Redeploy.
3. Admin → Settings → **Courier pickup address**: fill phone, address and pincode.
4. In Admin → Orders open an order → **Book DTDC shipment** (enter parcel weight) → **Print label**. COD orders tell DTDC to collect the cash.
   **Refresh tracking** pulls DTDC's status; the order moves to Shipped/Delivered by itself, and customers see the courier timeline.
   Without DTDC keys you can still type a tracking number from any courier with **Add tracking number**.

DTDC contracts differ slightly. If DTDC rejects a booking, the admin shows DTDC's exact message — compare it with the API
document DTDC gave you.

### Cash on delivery and shipping rules (Admin → Settings → Checkout)
COD on/off, a maximum order value for COD (default ₹50,000 — jewellery above that must be paid online), an extra COD fee,
pincodes where COD is not allowed, shipping charge and free-shipping limit. The checkout and the server both apply them.
Pincodes are checked as the customer types: city and state fill in by themselves (India Post), and with DTDC connected the
site also checks DTDC delivery and COD for that pincode.

### GST invoice (Admin → Settings → GST invoice)
Fill your registered name, **GSTIN**, state and default HSN (7113 for jewellery of precious metal — confirm with your CA; each
product can have its own HSN). Invoices are numbered PREFIX/26-27/0001 per financial year when an order is paid online or
confirmed. Same state as you → CGST 1.5% + SGST 1.5%, other states → IGST 3%. Customers can add their GSTIN at checkout and
download the invoice from My Account. The CSV export includes taxable value and CGST/SGST/IGST for your accountant.

## 5. The admin panel

| Section | What it does |
|---|---|
| Dashboard | Today's sales, 30-day chart, recent orders, low stock, things waiting for you |
| Reports | Sales by day, status, product, category, city, coupon and top customers for any date range; inventory value report; CSV export |
| Orders | Search, filter, change status (stock is put back on cancel), private notes, printable invoice, CSV |
| Appointments / Messages | Store-visit and video-call requests; contact-form inbox |
| Customers | Search, order history, addresses, disable account, create password-reset link, CSV |
| Products, Categories, Collections | Full catalogue with photo upload; price = weight × today's rate + making % + stones + GST |
| Product Reviews | Approve or reject reviews written by customers |
| Banners, Brides, Stores, Testimonials, Coupons, Subscribers | Homepage and marketing content |
| Website Pages | Edit About, FAQ, Shipping, Returns, Privacy, Terms, or add new pages (shown at /p/your-page) |
| Gold Rates & Settings | Daily rates (all prices update instantly), store details, announcement bar |
| Staff & Roles, Activity Log, Backup, My Profile | Team accounts, who-did-what history, download/restore everything |

## 6. Backups
**Admin → Backup → Download now** gives one JSON file with the whole catalogue, orders, customers and settings
(passwords are never included). **Restore** loads such a file back. Neon also keeps its own point-in-time history.

## Notes
- Photos are from Unsplash for the demo — replace them with your own product photos in the admin.
- Prices, rates and stock are always checked on the server when an order is placed.
