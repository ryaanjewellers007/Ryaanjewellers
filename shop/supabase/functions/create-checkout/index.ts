// Supabase Edge Function: create-checkout
// Re-prices the basket from the database (the browser's prices are never trusted),
// stores a pending order and returns a Stripe Checkout URL.
//
// Secrets (supabase secrets set ...):
//   SITE_ORIGIN           https://<your-github-pages-site>   (no trailing slash)
//   STRIPE_SECRET_KEY     sk_live_... / sk_test_...
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.
import { createClient } from 'npm:@supabase/supabase-js@2';

const SITE = (Deno.env.get('SITE_ORIGIN') ?? '').replace(/\/$/, '');
const REF_RE = /^RJ-[A-F0-9]{8}$/;
const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cors(req: Request) {
  const origin = req.headers.get('origin') ?? '';
  return {
    'Access-Control-Allow-Origin': origin === SITE ? origin : SITE,
    'Access-Control-Allow-Headers': 'content-type, apikey, authorization, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(req), 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors(req) });
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405);

  try {
    const body = await req.json();
    const ref = String(body?.ref ?? '');
    const c = body?.customer ?? {};
    const items = Array.isArray(body?.items) ? body.items : [];

    if (!REF_RE.test(ref)) return json(req, { error: 'Invalid order reference.' }, 400);
    if (!c.name || !PHONE_RE.test(String(c.phone ?? '')) || !EMAIL_RE.test(String(c.email ?? ''))
        || String(c.address ?? '').length < 8) {
      return json(req, { error: 'Please check your name, phone, email and address.' }, 400);
    }
    if (items.length === 0 || items.length > 50) return json(req, { error: 'Your bag is empty or too large.' }, 400);

    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // 1. Authoritative prices from the database.
    const ids = [...new Set(items.map((i: any) => String(i.id)))];
    const { data: products, error: pErr } = await sb
      .from('products').select('id,name,price_aed').eq('active', true).in('id', ids);
    if (pErr) throw pErr;
    const byId = new Map((products ?? []).map((p) => [p.id, p]));

    // 2. Optional coupon (validated server-side).
    let pct = 0;
    if (body?.coupon) {
      const { data: cp } = await sb.from('coupons').select('percent_off,active')
        .eq('code', String(body.coupon).toUpperCase()).maybeSingle();
      if (cp?.active) pct = cp.percent_off;
    }

    // 3. Build lines in fils (AED x 100).
    const lines = items.map((i: any) => {
      const p = byId.get(String(i.id));
      const qty = Math.floor(Number(i.qty));
      if (!p) throw new Error(`Unknown product ${i.id}`);
      if (!(qty >= 1 && qty <= 20)) throw new Error('Quantity must be between 1 and 20');
      const unit = Math.round(Number(p.price_aed) * 100 * (100 - pct) / 100);
      return { id: p.id, name: p.name as string, qty, unit };
    });
    const totalFils = lines.reduce((s, l) => s + l.unit * l.qty, 0);

    // 4. Store the pending order (unique ref prevents replays).
    const { error: oErr } = await sb.from('orders').insert({
      ref, status: 'pending',
      customer: { name: c.name, phone: c.phone, email: c.email, address: c.address, notes: c.notes ?? '' },
      items: lines, total_fils: totalFils, currency: 'aed', coupon: pct ? 'RYAAN5' : null,
    });
    if (oErr) throw oErr;

    // 5. Create the Stripe Checkout Session (form-encoded REST call, no SDK needed).
    const form = new URLSearchParams();
    form.set('mode', 'payment');
    form.set('success_url', `${SITE}/?order=success&ref=${ref}`);
    form.set('cancel_url', `${SITE}/?order=cancelled&ref=${ref}`);
    form.set('client_reference_id', ref);
    form.set('customer_email', String(c.email));
    form.set('metadata[ref]', ref);
    lines.forEach((l, i) => {
      form.set(`line_items[${i}][quantity]`, String(l.qty));
      form.set(`line_items[${i}][price_data][currency]`, 'aed');
      form.set(`line_items[${i}][price_data][unit_amount]`, String(l.unit));
      form.set(`line_items[${i}][price_data][product_data][name]`, l.name.slice(0, 250));
    });

    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
    });
    const session = await r.json();
    if (!r.ok) {
      console.error('stripe error', session?.error?.message);
      await sb.from('orders').update({ status: 'expired' }).eq('ref', ref);
      return json(req, { error: 'Payment could not be started. Please try again or contact us on WhatsApp.' }, 502);
    }

    await sb.from('orders').update({ stripe_session_id: session.id }).eq('ref', ref);
    return json(req, { url: session.url, ref });
  } catch (err) {
    console.error('create-checkout', err);
    return json(req, { error: 'Something went wrong. Please try again or contact us on WhatsApp.' }, 400);
  }
});
