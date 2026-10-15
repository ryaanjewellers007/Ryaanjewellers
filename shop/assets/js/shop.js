/* ═══════════════════════════════════════════════════════════════
   RYAAN JEWELLERS — checkout
   Two modes, chosen from config.js:
   1. Server checkout (SHOP.API_URL set): the server re-prices the cart from
      the database, stores a pending order and opens a Stripe page
      (card / Apple Pay). Stripe's webhook then marks the order paid.
   2. Standalone (no API): the order is kept on this device, sent to the
      Google Sheet endpoint if configured, and confirmed on WhatsApp.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const h = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => 'AED ' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const PAY_LABEL = { card: 'Card / Apple Pay', paypal: 'PayPal', cod: 'Cash or bank transfer' };
  const PAY_NOTE = {
    card: () => serverMode()
      ? 'You will be taken to a secure Stripe page to pay by card or Apple Pay.'
      : 'Our team will send a secure card payment link when they confirm your order on WhatsApp.',
    paypal: () => 'Once you place your order, pay via PayPal. Our team confirms the exact amount on WhatsApp.',
    cod: () => 'Pay in cash or by bank transfer on delivery or at our Gold Souk boutique. Our team confirms details on WhatsApp.'
  };
  const ORDERS_KEY = 'rjOrders';
  const serverMode = () => !!(window.SHOP && SHOP.API_URL);
  const formHTML = $('checkoutBody') ? $('checkoutBody').innerHTML : '';
  const btnHTML = (document.querySelector('#checkoutBody .form-btn') || {}).innerHTML || '';
  let payMethod = 'card';

  function renderPayNote() {
    const note = $('payNote');
    if (note) note.textContent = (PAY_NOTE[payMethod] || PAY_NOTE.card)();
  }

  window.selPay = function (el, method) {
    document.querySelectorAll('.pay-opt').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    payMethod = method;
    renderPayNote();
  };

  function readCustomer() {
    const v = id => (($(id) && $(id).value) || '').trim();
    return {
      firstName: v('firstName'), lastName: v('lastName'),
      name: (v('firstName') + ' ' + v('lastName')).trim(),
      phone: v('phone'), email: v('email'), address: v('address'), notes: v('notes')
    };
  }

  function validate(c) {
    if (!c.firstName || !c.lastName) return 'Please enter your first and last name.';
    if (!/^\+?[0-9 ()-]{7,20}$/.test(c.phone)) return 'Please enter a valid phone / WhatsApp number.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) return 'Please enter a valid email address.';
    if (c.address.length < 8) return 'Please enter your full delivery address.';
    if (!cart.length) return 'Your bag is empty.';
    return '';
  }

  function newRef() {
    const b = crypto.getRandomValues(new Uint8Array(4));
    return 'RJ-' + Array.from(b, x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  function buildOrder(customer) {
    const T = cartTotals();
    return {
      ref: newRef(),
      createdAt: new Date().toISOString(),
      payment: payMethod,
      customer,
      items: cart.map(c => ({ id: c.id, name: c.name, qty: c.qty, unitPrice: c.price, lineTotal: c.price * c.qty })),
      subtotal: T.sub,
      discountPct: T.pct,
      discount: T.disc,
      total: T.total,
      currency: 'AED',
      coupon: T.pct ? 'RYAAN5' : ''
    };
  }

  function saveLocal(order) {
    try {
      const list = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
      list.push(order);
      localStorage.setItem(ORDERS_KEY, JSON.stringify(list.slice(-50)));
    } catch (e) { /* storage blocked: order still goes to WhatsApp */ }
  }

  function whatsappText(order) {
    const c = order.customer;
    const lines = [
      `New order ${order.ref} · Ryaan Jewellers website`,
      `Name: ${c.name}`, `Phone: ${c.phone}`, `Email: ${c.email}`, `Address: ${c.address}`,
      c.notes ? `Notes: ${c.notes}` : null,
      '', 'Items:',
      ...order.items.map(i => `• ${i.name} × ${i.qty} = ${fmt(i.lineTotal)}`),
      order.discount ? `Member discount (${order.discountPct}%): −${fmt(order.discount)}` : null,
      `Total: ${fmt(order.total)}`,
      `Payment: ${PAY_LABEL[order.payment]}`,
      'Please confirm availability, final price and delivery.'
    ];
    return lines.filter(x => x !== null).join('\n');
  }

  const waLink = text => `https://wa.me/${RJ_CONFIG.WHATSAPP}?text=${encodeURIComponent(text)}`;

  function setBusy(on, label) {
    const btn = document.querySelector('#checkoutBody .form-btn');
    if (!btn) return;
    btn.disabled = on;
    btn.innerHTML = on ? `<i class="fas fa-spinner fa-spin"></i> ${label}` : btnHTML;
    if (!on) { const t = $('orderTotal'); if (t) t.textContent = fmt(cartTotals().total); }
  }

  function showSuccess(order) {
    const c = order.customer;
    const paypal = order.payment === 'paypal'
      ? `<a href="${h(RJ_CONFIG.PAYPAL_ME)}" target="_blank" rel="noopener" class="btn btn-gold" style="justify-content:center;width:100%;margin-bottom:.75rem;background:#0070BA;color:#fff"><i class="fab fa-paypal"></i>Pay with PayPal</a>` : '';
    $('checkoutTitle').textContent = 'Order Received ✓';
    $('checkoutBody').innerHTML = `<div class="order-success">
      <div class="check"><i class="fas fa-check"></i></div>
      <h2 style="font-family:var(--serif);font-size:1.8rem;color:var(--txt);margin-bottom:1rem">Thank you, ${h(c.firstName)}!</h2>
      <p style="color:var(--muted);margin-bottom:1rem">Your order reference is <strong style="color:var(--txt)">${h(order.ref)}</strong>. Please keep it for your records.</p>
      <p style="font-size:.9rem;color:var(--txt2);margin-bottom:1.5rem">Total: <strong style="color:var(--gold)">${fmt(order.total)}</strong> · ${h(PAY_LABEL[order.payment])}</p>
      <p style="font-size:.82rem;color:var(--muted);margin-bottom:1.5rem">Our team confirms availability, final price and delivery on WhatsApp.</p>
      <a href="${h(waLink(whatsappText(order)))}" target="_blank" rel="noopener" class="btn btn-dark" style="justify-content:center;width:100%;margin-bottom:.75rem"><i class="fab fa-whatsapp"></i>Confirm on WhatsApp</a>
      ${paypal}
      <button class="btn btn-gold" style="justify-content:center;width:100%" onclick="closeCheckout()">Close</button>
    </div>`;
  }

  function restoreForm() {
    const body = $('checkoutBody');
    if (body && body.querySelector('.order-success') && formHTML) {
      body.innerHTML = formHTML;
      $('checkoutTitle').textContent = 'Secure Checkout';
      payMethod = (document.querySelector('.pay-opt.selected') || {}).dataset?.method || 'card';
    }
  }

  window.placeOrder = async function () {
    const customer = readCustomer();
    const err = validate(customer);
    if (err) { showToast(err, 'er'); return; }

    const order = buildOrder(customer);

    // ── Server checkout: card / Apple Pay through Stripe ──
    if (serverMode() && payMethod === 'card') {
      setBusy(true, 'Opening secure payment…');
      try {
        const res = await fetch(SHOP.API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: SHOP.ANON_KEY, Authorization: 'Bearer ' + SHOP.ANON_KEY },
          body: JSON.stringify({
            ref: order.ref,
            customer: { name: customer.name, phone: customer.phone, email: customer.email, address: customer.address, notes: customer.notes },
            items: order.items.map(i => ({ id: i.id, qty: i.qty })),
            coupon: order.coupon
          })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.url) throw new Error(data.error || 'Could not start payment. Please try again.');
        saveLocal({ ...order, status: 'pending_payment' });
        window.location.href = data.url;   // cart is cleared when Stripe returns with ?order=success
      } catch (e) {
        setBusy(false);
        showToast(e.message || 'Something went wrong', 'er');
      }
      return;
    }

    // ── Standalone: keep on device, sync to sheet, confirm on WhatsApp ──
    order.status = order.payment === 'card' ? 'awaiting_payment_link' : 'new';
    saveLocal(order);
    if (typeof sendLead === 'function') {
      sendLead('order', { ref: order.ref, total: order.total, payment: order.payment, status: order.status, customer, items: order.items });
    }
    cart = [];
    persistCart();
    updateCartUI();
    showSuccess(order);
  };

  function handleReturn() {
    const q = new URLSearchParams(location.search);
    const state = q.get('order');
    if (!state) return;
    if (state === 'success') {
      cart = []; persistCart(); updateCartUI();
      showToast('Payment received. Thank you!', 'ok');
    } else if (state === 'cancelled') {
      showToast('Payment cancelled. Your bag is saved.', '');
    }
    history.replaceState(null, '', location.pathname + location.hash);
  }

  const originalOpen = window.openCheckout;
  window.openCheckout = function () {
    if (!cart.length) { showToast('Your cart is empty!', 'er'); return; }
    restoreForm();
    originalOpen();
    renderPayNote();
  };

  renderPayNote();
  handleReturn();
})();
