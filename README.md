# Swarnika Jewels — jewellery store with admin panel (Next.js)

## 1. Run it on your computer
```bash
npm install
npm run dev
```
- Website: http://localhost:3000
- Admin panel: http://localhost:3000/admin (default password **admin123**)

Needs Node.js 20 or newer.

## 2. Before going live (5-minute checklist)
1. Copy `.env.example` to `.env.local` and fill it in:
   - `ADMIN_PASSWORD`: your own strong password. **Required.**
   - `SESSION_SECRET`: any long random text.
   - `SITE_URL`: your real web address, such as https://www.yourstore.com.
   - `COOKIE_SECURE=1`: set this once the site runs on https.
   - Optional: `SMTP_*` settings, so you get an email for every new order or appointment and customers get an order confirmation.
2. In **Admin → Gold Rates & Settings**, set:
   - your brand name, phone, email and address
   - your WhatsApp number (this shows a chat button on the site) and Instagram
   - today's gold rates
3. In **Admin → Products**, replace the demo photos and prices with your own designs. Hide or delete the demo items you don't sell.
4. Edit or replace the demo content: **Stores**, **Reviews**, **Homepage Banners** and **Coupons**.
5. Build and start the site:
   ```bash
   npm run build
   npm start          # runs on port 3000; set PORT=8080 to change it
   ```
   To keep it running after you close the window (and restart it automatically), use PM2:
   ```bash
   npm install -g pm2
   pm2 start npm --name swarnika -- start
   pm2 save
   ```

## 3. Hosting
The store saves its data to files in the `data/` folder, so it needs a host with a permanent disk:
- a VPS (Hostinger, DigitalOcean, AWS Lightsail and similar) with Node 20+
- Railway or Render with a persistent volume mounted at `/data` of the project
- your own office PC or server

Put Nginx or Caddy in front of it for https and your domain.

Vercel and Netlify won't work as-is, because they don't keep files between requests.

## 4. Daily use (admin panel)
| What you want to do | Where |
| --- | --- |
| Update today's gold rate (all prices recalculate) | Gold Rates & Settings |
| Add or edit a product, upload photos, set stock, hide or show it | Products |
| See new orders, call or WhatsApp the customer, update the status, print an invoice | Orders |
| Store visit and video call requests | Appointments |
| Discount codes | Coupons |
| Homepage banners, categories, collections, brides, stores and reviews | their own sections |
| Download a backup of everything, or restore one | Backup & Restore |

Customers can follow their order at **/track** using the order number and their phone number.

Cancelling an order puts its items back in stock. Un-cancelling takes them out again.

## 5. Backups
- `data/db.json` holds all your data (products, orders, settings).
- `data/uploads/` holds the photos you uploaded.

Copy both somewhere safe regularly, or use **Admin → Backup & Restore**.

To reset to the demo content, stop the site and delete `data/db.json`.

## Notes
- Demo photos are free-licence images from Unsplash (https://unsplash.com/license), loaded from Unsplash's servers. Replace them with your own product photography.
- Payments are confirmed by phone, cash on delivery or a UPI link. Online card or UPI checkout (Razorpay, Cashfree) isn't included yet.
- All animations switch off automatically for visitors who have "reduce motion" turned on.
