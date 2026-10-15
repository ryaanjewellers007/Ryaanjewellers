/* ═══════════════════════════════════════════════════════════════
   RYAAN JEWELLERS — site configuration
   Edit this file to change contact details or connect services.
   Everything here ships to the browser, so NEVER put secret keys
   in this file. Secret keys live only in Supabase / Stripe.
   ═══════════════════════════════════════════════════════════════ */
window.RJ_CONFIG = {
  WHATSAPP: '971543746476',                          // international format, no "+"
  EMAIL: 'info@ryaanjewellers.com',
  PAYPAL_ME: 'https://paypal.me/ThanseerShameem',
  FX_URL: 'https://open.er-api.com/v6/latest/AED',   // free currency rates, no key needed
  GOLD_API_KEY: '',          // goldapi.io key for live gold rates. Empty = reference rates shown
  LEADS_ENDPOINT: ''         // Google Apps Script web-app URL: every order/lead lands in a Google Sheet
};

/* Server checkout (Supabase Edge Function + Stripe, see SETUP.md).
   Leave API_URL empty to run in standalone mode (orders confirmed on WhatsApp). */
window.SHOP = {
  API_URL: '',    // e.g. https://YOUR-PROJECT.supabase.co/functions/v1/create-checkout
  ANON_KEY: ''    // Supabase "anon public" key. NEVER the service_role key.
};
