// Supabase Edge Function: stripe-webhook
// Stripe → Developers → Webhooks → endpoint URL:
//   https://<project>.supabase.co/functions/v1/stripe-webhook
// Events: checkout.session.completed, checkout.session.expired
// Deploy with --no-verify-jwt (Stripe does not send a Supabase JWT).
//
// Secrets: STRIPE_WEBHOOK_SECRET (whsec_...), plus SUPABASE_* (automatic).
import { createClient } from 'npm:@supabase/supabase-js@2';

const enc = new TextEncoder();

// Verifies the Stripe-Signature header (HMAC-SHA256 over "t.payload", 5-minute tolerance).
async function verifySignature(payload: string, header: string, secret: string): Promise<boolean> {
  const parts = header.split(',').map((p) => p.trim());
  const t = parts.find((p) => p.startsWith('t='))?.slice(2);
  const sigs = parts.filter((p) => p.startsWith('v1=')).map((p) => p.slice(3));
  if (!t || sigs.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;

  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(`${t}.${payload}`));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return sigs.includes(hex);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const payload = await req.text();
  const ok = await verifySignature(
    payload, req.headers.get('stripe-signature') ?? '', Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '',
  );
  if (!ok) return new Response('Invalid signature', { status: 400 });

  const event = JSON.parse(payload);
  const session = event?.data?.object;
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  if (event.type === 'checkout.session.completed' && session?.payment_status === 'paid') {
    const { error } = await sb.from('orders')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('stripe_session_id', session.id);
    if (error) return new Response('DB error', { status: 500 });
  } else if (event.type === 'checkout.session.expired') {
    await sb.from('orders').update({ status: 'expired' }).eq('stripe_session_id', session.id).eq('status', 'pending');
  }
  return new Response('ok', { status: 200 });
});
