# Ryaan Jewellers — online store

A complete storefront for Ryaan Jewellers (Gold Souk, Deira, Dubai): product catalogue, search, filters, sorting, product pages, cart, wishlist, checkout, live gold rates, gold value calculator, and a support assistant. Bilingual interface (English / Arabic) with light and dark themes.

It runs in two modes:

| Mode | What it needs | What happens at checkout |
|---|---|---|
| **Standalone** (works out of the box on GitHub Pages) | Nothing | The order is saved on the device, sent to a Google Sheet if configured, and the customer confirms it with the team on WhatsApp. |
| **Full online payment** | Supabase + Stripe (see [SETUP.md](SETUP.md)) | Prices are re-checked on the server, the order is stored, and the customer pays by card or Apple Pay on Stripe. Stripe's webhook marks orders paid. |

## Project layout

```
index.html                  storefront markup
assets/css/styles.css       design system (light/dark tokens)
assets/js/config.js         ← contact details, integrations (edit this)
assets/js/products.js       ← product catalogue (edit this)
assets/js/app.js            catalogue, cart, wishlist, gold rates, calculator, assistant
assets/js/shop.js           checkout (standalone + server modes)
assets/js/i18n.js           Arabic translations
assets/img/                 logo, favicon and shared images
supabase/schema.sql         database tables and row-level security
supabase/seed_products.sql  generated from products.js (do not edit by hand)
supabase/functions/         create-checkout and stripe-webhook (Deno, Supabase Edge Functions)
scripts/build-seed.mjs      regenerates seed_products.sql from products.js
.github/workflows/pages.yml deploys the site to GitHub Pages on every push to main
```

## Run locally

No build step. Serve the folder with any static server:

```bash
python3 -m http.server 8000     # then open http://localhost:8000
```

## Change the catalogue

Edit `assets/js/products.js`, then run `node scripts/build-seed.mjs` so the server's price list matches. Each product needs a unique `id` (assigned automatically from its position: `RJ-001`, `RJ-002`, …). Keep ids stable once orders exist.

## Deploy

Pushing to `main` deploys automatically. One-time setup in the repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Security notes

- Nothing secret belongs in the front end. `config.js` is public. Stripe secret keys and the Supabase service-role key live only in Supabase secrets.
- Prices and discount codes are checked on the server (`create-checkout`), so a modified browser cannot change what the customer pays.
- Orders and coupons are not readable from the browser (row-level security is on).
