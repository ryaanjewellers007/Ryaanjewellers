# Setup guide

Follow these steps in order. The site already works in standalone mode after step 1. Steps 2–5 switch on card and Apple Pay payments.

## 1. Publish on GitHub Pages

1. Push this folder to a GitHub repository, with the code on the `main` branch.
2. Repository **Settings → Pages → Source: GitHub Actions**.
3. Wait for the **Deploy storefront to GitHub Pages** workflow to finish. The site URL appears in the workflow summary.
4. Put that URL in the `<link rel="canonical">`, `og:url` and JSON-LD `url` fields in `index.html` if it is not `ryaanjewellers007.github.io/ryaan-jewellers/`.

## 2. Create the Supabase project

1. Create a project at supabase.com (region: closest to the UAE, e.g. Mumbai or Frankfurt).
2. **SQL Editor → New query**: paste `supabase/schema.sql` and run it. Then paste `supabase/seed_products.sql` and run it.
3. Copy the **Project URL** and the **anon public** key from **Project Settings → API**.

## 3. Create the Stripe account

1. In the Stripe dashboard, turn on **Card** payments. Apple Pay is switched on automatically for supported devices after you verify your domain under **Settings → Payments → Apple Pay**.
2. Make sure AED is enabled as a presentment currency for your account.
3. Copy the **Secret key** (`sk_test_…` while testing, `sk_live_…` for real money).

## 4. Deploy the Edge Functions and secrets

Install the Supabase CLI and log in, then from the repository root:

```bash
supabase link --project-ref YOUR-PROJECT-REF
supabase secrets set SITE_ORIGIN=https://YOUR-SITE.github.io/YOUR-REPO STRIPE_SECRET_KEY=sk_test_...
supabase functions deploy create-checkout --no-verify-jwt
supabase functions deploy stripe-webhook --no-verify-jwt
```

`SITE_ORIGIN` must match the site URL exactly, without a trailing slash.

## 5. Connect the webhook

1. Stripe dashboard → **Developers → Webhooks → Add endpoint**.
2. Endpoint URL: `https://YOUR-PROJECT-REF.supabase.co/functions/v1/stripe-webhook`
3. Events: `checkout.session.completed` and `checkout.session.expired`.
4. Copy the **Signing secret** (`whsec_…`) and run:

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

## 6. Switch the site to server checkout

Edit `assets/js/config.js`:

```js
window.SHOP = {
  API_URL: 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/create-checkout',
  ANON_KEY: 'YOUR-ANON-PUBLIC-KEY'
};
```

Commit and push. Test with a Stripe test card (`4242 4242 4242 4242`, any future date, any CVC) before going live.

## 7. Optional: order sheet and live gold rates

- **Order sheet:** create a Google Sheet, then **Extensions → Apps Script**, deploy it as a web app (access: Anyone), and put its URL in `LEADS_ENDPOINT` in `config.js`. Every order and enquiry will be added as a row.
- **Live gold rates:** create a goldapi.io key and set `GOLD_API_KEY` in `config.js`. Without a key the site shows the reference rates in `app.js` (`fetchGoldPrice`), which should be updated regularly.

## Before going live

- Replace the placeholder product prices and confirm them against your live catalogue. The notice on the page already says prices are indicative.
- Rotate the GoldAPI key that was previously published in the storefront source. Anything in a public repository should be treated as leaked.
- Check the Stripe business details and your refund and delivery policies are shown on the site.
