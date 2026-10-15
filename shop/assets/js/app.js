// ─── Safe storage (private browsing / blocked storage) ───
(function(){try{localStorage.setItem('__rj','1');localStorage.removeItem('__rj');}catch(e){var m={};var mem={getItem:function(k){return k in m?m[k]:null},setItem:function(k,v){m[k]=String(v)},removeItem:function(k){delete m[k]},clear:function(){m={}},key:function(i){return Object.keys(m)[i]||null},get length(){return Object.keys(m).length}};try{Object.defineProperty(window,'localStorage',{value:mem,configurable:true})}catch(_){}}})();

// ─── SITE CONFIG — edit here ───────────────────────────────
// LEADS_ENDPOINT: paste your Google Apps Script web-app URL to receive every order,
// registration, newsletter sign-up and appointment in a Google Sheet (opens in Excel).
// Leave empty to keep data only on the visitor's device + WhatsApp message.
var RJ_METAL = 'all';
// ═══════════════════════════════════════════════════════════════
// PRODUCT DATA
// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════
let cart = [], wishlist = [], currentFilter = 'all', currentSort = 'default';
function cmpHas(n) { return typeof window.__cmpList !== 'undefined' && window.__cmpList.includes(n); }
let priceMin = 0, priceMax = Infinity;
let qtyModal = 1, selectedProduct = null;

// ═══════════════════════════════════════════════════════════════
// RENDER PRODUCTS
// ═══════════════════════════════════════════════════════════════
function getFiltered() {
  let list = currentFilter === 'all' ? [...PRODUCTS] : PRODUCTS.filter(p => p.cat === currentFilter);
  if (RJ_METAL !== 'all') list = list.filter(p => { const m = (p.metal || '').toLowerCase(); return RJ_METAL === 'yellow' ? m.includes('yellow') : RJ_METAL === 'white' ? m.includes('white') : (m.includes('rose') || m.includes('pink')); });
  // Price range filter
  list = list.filter(p => p.price >= priceMin && p.price <= priceMax);
  if (currentSort === 'price-asc') list.sort((a,b) => a.price - b.price);
  else if (currentSort === 'price-desc') list.sort((a,b) => b.price - a.price);
  else if (currentSort === 'name') list.sort((a,b) => a.name.localeCompare(b.name));
  return list;
}

function applyPriceFilter() {
  const minEl = document.getElementById('priceMin');
  const maxEl = document.getElementById('priceMax');
  priceMin = parseFloat(minEl?.value) || 0;
  priceMax = parseFloat(maxEl?.value) || Infinity;
  if (priceMax < priceMin) { priceMax = Infinity; if (maxEl) maxEl.value = ''; }
  renderProducts();
}

function renderProducts() {
  const g = document.getElementById('pgrid');
  const list = getFiltered();
  document.getElementById('pgCount').textContent = `Showing ${list.length} piece${list.length !== 1 ? 's' : ''}`;
  g.innerHTML = '';
  list.forEach((p, idx) => {
    const inWish = wishlist.some(w => w.name === p.name);
    const lbl = p.lbl ? `<div class="plbl ${p.lc}">${p.lbl}</div>` : '';
    const c = document.createElement('div');
    c.className = 'pc';
    c.dataset.name = p.name;
    c.style.animationDelay = `${idx * 0.05}s`;
    c.innerHTML = `
      <div class="pi-wrap">
        <img class="pi" src="${p.img}" alt="${p.name}" loading="lazy"
          onerror="this.style.display='none';this.parentNode.querySelector('.pfall').style.display='flex'">
        <div class="pfall"><i class="fas fa-gem" style="font-size:2.5rem;color:var(--gold)"></i><span style="font-size:.75rem;color:var(--muted);padding:0 1rem;text-align:center">${p.name}</span></div>
        ${lbl}
        <div class="p-acts">
          <button class="pa ${inWish ? 'wishlisted' : ''}" onclick="toggleWishItem(event,this,${idx})" title="Wishlist"><i class="fas fa-heart"></i></button>
          <button class="pa" onclick="openProduct(event,${idx})" title="Quick View"><i class="fas fa-eye"></i></button>
          <button class="pa" onclick="tryOnProduct(event)" title="Try On"><i class="fas fa-camera"></i></button>
          <button class="pa pa-cmp ${cmpHas(p.name) ? 'cmp-on' : ''}" onclick="toggleCompare(event,${idx})" title="Compare"><i class="fas fa-scale-balanced"></i></button>
        </div>
      </div>
      <div class="pinfo">
        <div class="pbrand">${p.brand}</div>
        <h3 class="pname" onclick="openProduct(event,${idx})">${p.name}</h3>
        <p class="pdesc">${p.desc}</p>
        <div class="pfooter">
          <div class="pprice">${money(p.price)}<span> / pc</span></div>
          <button class="pcart" id="cartBtn_${idx}" onclick="addToCart(event,${idx})">Add to Cart</button>
        </div>
      </div>`;
    g.appendChild(c);
  });
}

function filterP(cat, btn) {
  currentFilter = cat;
  document.querySelectorAll('.fb').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
  renderProducts();
}

function filterTo(cat) {
  currentFilter = cat;
  document.querySelectorAll('.fb').forEach(b => {
    b.classList.remove('on');
    if ((b.textContent.toLowerCase().includes(cat) || (cat === 'vca' && b.textContent.includes('Van Cleef')) || (cat === 'messika' && b.textContent.includes('Messika')) || (cat === 'bulgari' && b.textContent.includes('Bulgari')) || (cat === 'flower' && b.textContent.includes('Flower')))) b.classList.add('on');
  });
  renderProducts();
  document.getElementById('products').scrollIntoView({behavior:'smooth'});
}

function sortProducts() {
  currentSort = document.getElementById('sortSel').value;
  renderProducts();
}

// ═══════════════════════════════════════════════════════════════
// CART
// ═══════════════════════════════════════════════════════════════
function addToCart(e, idx) {
  if (e) e.stopPropagation();
  const list = getFiltered();
  const p = list[idx];
  if (!p) return;
  const existing = cart.find(c => c.name === p.name);
  if (existing) { existing.qty++; }
  else { cart.push({...p, qty: 1}); }
  updateCartUI();
  const btn = document.getElementById(`cartBtn_${idx}`);
  if (btn) { btn.textContent = 'Added ✓'; btn.classList.add('added'); setTimeout(() => { btn.textContent = 'Add to Cart'; btn.classList.remove('added'); }, 2000); }
  showToast(`"${p.name.slice(0,28)}" added to cart!`, 'ok');
}

function updateCartUI() {
  const total = cartTotals().total;
  const totalItems = cart.reduce((s, c) => s + c.qty, 0);
  document.getElementById('cBdg').textContent = totalItems;
  document.getElementById('cBdg').style.display = totalItems > 0 ? 'block' : 'none';
  document.getElementById('cartTotalAmt').textContent = money(total);
  { const _ot = document.getElementById('orderTotal'); if (_ot) _ot.textContent = money(total); }
  const ef = document.getElementById('cartEmpty');
  const cf = document.getElementById('cartFooter');
  const ci = document.getElementById('cartItems');
  if (cart.length === 0) { ci.querySelectorAll('.cart-item').forEach(i => i.remove()); ef.style.display = 'block'; cf.style.display = 'none'; }
  else {
    ef.style.display = 'none'; cf.style.display = 'block';
    const items = ci.querySelectorAll('.cart-item'); items.forEach(i => i.remove());
    cart.forEach((item, i) => {
      const d = document.createElement('div'); d.className = 'cart-item';
      d.innerHTML = `<img class="ci-img" src="${item.img}" onerror="this.src='https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=120'">
        <div class="ci-info">
          <div class="ci-name">${item.name}</div>
          <div class="ci-price">${money(item.price * item.qty)}</div>
          <div class="ci-qty">
            <button class="qty-btn" onclick="changeQty(${i},-1)">−</button>
            <span style="font-size:.9rem;font-weight:600">${item.qty}</span>
            <button class="qty-btn" onclick="changeQty(${i},1)">+</button>
          </div>
        </div>
        <button class="ci-del" onclick="removeFromCart(${i})"><i class="fas fa-trash"></i></button>`;
      ci.appendChild(d);
    });
  }
  // update checkout summary
  let summaryHtml = cart.map(c => `<div class="cs-row"><span>${c.name.slice(0,32)} × ${c.qty}</span><span>${money(c.price*c.qty)}</span></div>`).join('');
  summaryHtml += `<div class="cs-row" style="color:var(--muted)"><span>Delivery</span><span>Free</span></div>`;
  { const T = cartTotals(); if (T.pct) summaryHtml += `<div class="cs-row" style="color:#2A6846;font-weight:600"><span>Member discount (${T.pct}%)</span><span>− ${money(T.disc)}</span></div>`; }
  summaryHtml += `<div class="cs-row total"><span>Total</span><span style="color:var(--gold)">${money(total)}</span></div>`;
  { const _cs = document.getElementById('checkoutSummary'); if (_cs) _cs.innerHTML = summaryHtml; }
}

function changeQty(i, delta) {
  cart[i].qty += delta;
  if (cart[i].qty <= 0) cart.splice(i, 1);
  updateCartUI();
}

function removeFromCart(i) { cart.splice(i, 1); updateCartUI(); showToast('Item removed', 'er'); }

function toggleCart() {
  const s = document.getElementById('cartSidebar');
  const ov = document.getElementById('overlay');
  s.classList.toggle('open');
  ov.classList.toggle('open');
  document.getElementById('wishSidebar').classList.remove('open');
}

// ═══════════════════════════════════════════════════════════════
// WISHLIST
// ═══════════════════════════════════════════════════════════════
function toggleWishItem(e, btn, idx) {
  if (e) e.stopPropagation();
  const list = getFiltered();
  const p = list[idx];
  const ei = wishlist.findIndex(w => w.name === p.name);
  if (ei >= 0) { wishlist.splice(ei, 1); btn.classList.remove('wishlisted'); showToast('Removed from wishlist', ''); }
  else { wishlist.push(p); btn.classList.add('wishlisted'); showToast('Added to wishlist! ❤️', 'ok'); }
  updateWishUI();
}

function updateWishUI() {
  document.getElementById('wBdg').textContent = wishlist.length;
  document.getElementById('wBdg').style.display = wishlist.length > 0 ? 'block' : 'none';
  const wi = document.getElementById('wishItems');
  wi.innerHTML = '';
  if (wishlist.length === 0) { wi.innerHTML = '<div class="cart-empty"><i class="fas fa-heart"></i><p>Your wishlist is empty</p></div>'; return; }
  wishlist.forEach((p, i) => {
    const d = document.createElement('div'); d.className = 'cart-item';
    d.innerHTML = `<img class="ci-img" src="${p.img}" onerror="this.src='https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=120'">
      <div class="ci-info">
        <div class="ci-name">${p.name}</div>
        <div class="ci-price">${money(p.price)}</div>
        <button class="pcart" style="margin-top:.5rem" onclick="moveToCart(${i})">Add to Cart</button>
      </div>
      <button class="ci-del" onclick="removeWish(${i})"><i class="fas fa-times"></i></button>`;
    wi.appendChild(d);
  });
}

function moveToCart(i) {
  const p = wishlist[i];
  const ex = cart.find(c => c.name === p.name);
  if (ex) ex.qty++; else cart.push({...p, qty:1});
  wishlist.splice(i, 1);
  updateCartUI(); updateWishUI();
  showToast('Moved to cart!', 'ok');
}

function removeWish(i) { wishlist.splice(i, 1); updateWishUI(); }

function toggleWish() {
  const s = document.getElementById('wishSidebar');
  const ov = document.getElementById('overlay');
  s.classList.toggle('open');
  ov.classList.toggle('open');
  document.getElementById('cartSidebar').classList.remove('open');
}

// ═══════════════════════════════════════════════════════════════
// CHECKOUT
// ═══════════════════════════════════════════════════════════════
function openCheckout() {
  if (cart.length === 0) { showToast('Your cart is empty!', 'er'); return; }
  document.getElementById('cartSidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
  updateCartUI();
  document.getElementById('checkoutModal').classList.add('open');
  document.getElementById('checkoutTitle').textContent = 'Secure Checkout';
  document.getElementById('checkoutBody').style.display = 'block';
}

function closeCheckout() { document.getElementById('checkoutModal').classList.remove('open'); }

function selPay(el, method) {
  document.querySelectorAll('.pay-opt').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
}


// ═══════════════════════════════════════════════════════════════
// PRODUCT DETAIL MODAL
// ═══════════════════════════════════════════════════════════════
function openProduct(e, idx) {
  if (e) e.stopPropagation();
  const list = getFiltered();
  selectedProduct = (idx && typeof idx === 'object') ? idx : list[idx];
  const p = selectedProduct;
  qtyModal = 1;
  document.getElementById('pmGrid').innerHTML = `
    <div class="pm-img-side"><img src="${p.img}" alt="${p.name}" onerror="this.src='https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600'"></div>
    <div class="pm-info-side">
      <button class="close-btn" onclick="closeProduct()" style="align-self:flex-end"><i class="fas fa-times"></i></button>
      <div class="pm-brand">${p.brand}</div>
      <div class="pm-name">${p.name}</div>
      <div class="pm-price">${money(p.price)}</div>
      <div class="pm-desc">${p.desc}</div>
      <div class="pm-specs">
        <div class="pm-spec-row"><span class="pm-spec-label">Metal</span><span class="pm-spec-val">${p.metal}</span></div>
        <div class="pm-spec-row"><span class="pm-spec-label">Weight</span><span class="pm-spec-val">${p.weight}</span></div>
        <div class="pm-spec-row"><span class="pm-spec-label">Certification</span><span class="pm-spec-val">${p.certification}</span></div>
        <div class="pm-spec-row"><span class="pm-spec-label">Delivery</span><span class="pm-spec-val">Free in Dubai</span></div>
      </div>
      <div class="qty-wrap">
        <span style="font-size:.78rem;font-weight:600;letter-spacing:1px;color:var(--muted);text-transform:uppercase">Qty</span>
        <div class="qty-big">
          <button onclick="changeModalQty(-1)">−</button>
          <span id="modalQty">1</span>
          <button onclick="changeModalQty(1)">+</button>
        </div>
        <span style="font-size:.88rem;color:var(--muted)">Total: <strong style="color:var(--gold)" id="modalTotal">${money(p.price)}</strong></span>
      </div>
      <div style="display:flex;flex-direction:column;gap:.75rem">
        <button class="btn btn-gold" style="justify-content:center" onclick="addModalToCart()"><i class="fas fa-shopping-bag"></i>Add to Cart</button>
        <a href="https://wa.me/971543746476?text=I+want+to+order+${encodeURIComponent(p.name)}+AED+${p.price}" target="_blank" class="btn btn-dark" style="justify-content:center"><i class="fab fa-whatsapp"></i>Order via WhatsApp</a>
      </div>
    </div>`;
  document.getElementById('productModal').classList.add('open');
}

function changeModalQty(delta) {
  qtyModal = Math.max(1, qtyModal + delta);
  document.getElementById('modalQty').textContent = qtyModal;
  document.getElementById('modalTotal').textContent = money(selectedProduct.price * qtyModal);
}

function addModalToCart() {
  for (let i = 0; i < qtyModal; i++) {
    const ex = cart.find(c => c.name === selectedProduct.name);
    if (ex) ex.qty++; else cart.push({...selectedProduct, qty:1});
  }
  updateCartUI();
  closeProduct();
  showToast(`Added ${qtyModal} × "${selectedProduct.name.slice(0,24)}"`, 'ok');
}

function closeProduct() { document.getElementById('productModal').classList.remove('open'); }

// ═══════════════════════════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════════════════════════
function openSearch() {
  document.getElementById('searchOverlay').classList.add('open');
  setTimeout(() => document.getElementById('searchInput').focus(), 100);
}

function closeSearch() {
  document.getElementById('searchOverlay').classList.remove('open');
  document.getElementById('searchInput').value = '';
  document.getElementById('searchResults').style.display = 'none';
}

function doSearch(q) {
  const res = document.getElementById('searchResults');
  if (!q.trim()) { res.style.display = 'none'; return; }
  const matches = PRODUCTS.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.brand.toLowerCase().includes(q.toLowerCase()) || p.desc.toLowerCase().includes(q.toLowerCase()));
  if (matches.length === 0) { res.style.display = 'block'; res.innerHTML = '<div class="sr-item"><span style="color:var(--muted)">No results found</span></div>'; return; }
  res.style.display = 'block';
  res.innerHTML = matches.slice(0,8).map((p, i) => `
    <div class="sr-item" onclick="searchSelect(${PRODUCTS.indexOf(p)})">
      <img src="${p.img}" onerror="this.src='https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=80'">
      <div style="flex:1"><div class="sr-name">${p.name}</div><div class="sr-price">${money(p.price)}</div></div>
    </div>`).join('');
}

function searchSelect(idx) {
  closeSearch();
  openProduct(null, PRODUCTS.indexOf(PRODUCTS[idx]));
}

// ═══════════════════════════════════════════════════════════════
// VIRTUAL TRY-ON
// ═══════════════════════════════════════════════════════════════
let tryonStream = null;

function startCamera() {
  if (!navigator.mediaDevices) { showToast('Camera not supported. Use Upload instead.', 'er'); return; }
  navigator.mediaDevices.getUserMedia({video: {facingMode: 'user'}}).then(stream => {
    tryonStream = stream;
    const video = document.getElementById('tryonVideo');
    video.srcObject = stream;
    video.style.display = 'block';
    document.getElementById('tryIco').style.display = 'none';
    document.getElementById('tryTitle').style.display = 'none';
    document.getElementById('tryDesc').style.display = 'none';
    document.getElementById('tryonResult').style.display = 'flex';
    document.getElementById('tryonResult').style.justifyContent = 'center';
    showToast('Camera active! Point your wrist at the camera 📷', 'ok');
  }).catch(() => showToast('Camera access denied. Use Upload instead.', 'er'));
}

function uploadPhoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.getElementById('tryonCanvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width; canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      // Simple overlay effect — golden tint on wrist area
      ctx.fillStyle = 'rgba(var(--gold-rgb),0.15)';
      ctx.fillRect(0, img.height * 0.6, img.width, img.height * 0.2);
      canvas.style.display = 'block';
      document.getElementById('tryonVideo').style.display = 'none';
      document.getElementById('tryIco').style.display = 'none';
      document.getElementById('tryTitle').style.display = 'none';
      document.getElementById('tryDesc').style.display = 'none';
      document.getElementById('tryonResult').style.display = 'flex';
      document.getElementById('tryonResult').style.justifyContent = 'center';
      showToast('Photo uploaded! Send to WhatsApp for professional try-on ✨', 'ok');
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function resetTryon() {
  if (tryonStream) { tryonStream.getTracks().forEach(t => t.stop()); tryonStream = null; }
  document.getElementById('tryonVideo').style.display = 'none';
  document.getElementById('tryonCanvas').style.display = 'none';
  document.getElementById('tryIco').style.display = 'block';
  document.getElementById('tryTitle').style.display = 'block';
  document.getElementById('tryDesc').style.display = 'block';
  document.getElementById('tryonResult').style.display = 'none';
}

function saveTriedOn() {
  const canvas = document.getElementById('tryonCanvas');
  if (canvas.style.display === 'none') { showToast('Take a screenshot of your camera view!', ''); return; }
  const a = document.createElement('a'); a.download = 'ryaan-tryon.jpg'; a.href = canvas.toDataURL('image/jpeg', 0.9); a.click();
  showToast('Image saved!', 'ok');
}

function tryOnProduct(e) { if (e) e.stopPropagation(); document.getElementById('tryon').scrollIntoView({behavior:'smooth'}); showToast('Scroll down to try on this piece!', 'ok'); }

// ═══════════════════════════════════════════════════════════════
// AI CHATBOT
// ═══════════════════════════════════════════════════════════════
let chatOpen = false, chatLoading = false;


function toggleChat() {
  chatOpen = !chatOpen;
  document.getElementById('chatWindow').classList.toggle('open', chatOpen);
  if (chatOpen) document.getElementById('chatInput').focus();
}

function chatSuggest(msg) {
  document.getElementById('chatInput').value = msg;
  sendChat();
}

function chatKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
}


function appendMsg(text, role) {
  const msgs = document.getElementById('chatMessages');
  const d = document.createElement('div');
  d.className = `msg ${role}`;
  const now = new Date(); const time = now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  d.innerHTML = `<div class="msg-bubble">${text}</div><div class="msg-time">${time}</div>`;
  msgs.appendChild(d);
  scrollChat();
}

function scrollChat() {
  const msgs = document.getElementById('chatMessages');
  msgs.scrollTop = msgs.scrollHeight;
}

// ═══════════════════════════════════════════════════════════════
// GOLD PRICE TICKER
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// LIVE GOLD PRICE — metalpriceapi.com
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// LIVE GOLD PRICE — GoldAPI.io (Real-time Dubai rates)
// API: https://www.goldapi.io  |  Key active ✓
// ═══════════════════════════════════════════════════════════════
const GOLD_API_KEY = (window.RJ_CONFIG && RJ_CONFIG.GOLD_API_KEY) || '';
const GOLD_API_URL = 'https://www.goldapi.io/api/XAU/AED';

let goldRates = { g24k: 0, g22k: 0, g21k: 0, g18k: 0, price_oz: 0, ch: 0, chp: 0, lastUpdated: null };
let liveActive = false;

async function fetchGoldPrice() {
  try {
    if (!GOLD_API_KEY) throw new Error('no GoldAPI key configured');
    showGoldLoading(true);
    const res = await fetch(GOLD_API_URL, {
      headers: {
        'x-access-token': GOLD_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.price_gram_24k) throw new Error('Invalid response');
    goldRates = {
      g24k:     +data.price_gram_24k.toFixed(2),
      g22k:     +data.price_gram_22k.toFixed(2),
      g21k:     +data.price_gram_21k.toFixed(2),
      g18k:     +data.price_gram_18k.toFixed(2),
      price_oz: +data.price.toFixed(2),
      ch:       +(data.ch  || 0).toFixed(2),
      chp:      +(data.chp || 0).toFixed(3),
      lastUpdated: new Date()
    };
    liveActive = true;
    updateGoldBadge();
    buildTicker();
    calcGoldValue();
    console.log('✅ GoldAPI.io live rates loaded:', goldRates);
  } catch(err) {
    console.warn('GoldAPI.io error – using fallback rates:', err.message);
    // Dubai market fallback rates (approx)
    goldRates = { g24k: 601.14, g22k: 551.05, g21k: 526.00, g18k: 450.86, price_oz: 18693, ch: 0, chp: 0, lastUpdated: null };
    liveActive = false;
    updateGoldBadge();
    buildTicker();
    calcGoldValue();
  } finally {
    showGoldLoading(false);
  }
}

function showGoldLoading(on) {
  const el = document.getElementById('goldLive');
  if (!el) return;
  el.innerHTML = on
    ? '<i class="fas fa-circle-notch fa-spin"></i>&nbsp; Fetching live Dubai gold rates...'
    : formatGoldBadge();
}

function formatGoldBadge() {
  const changeColor = goldRates.ch >= 0 ? '#4CAF50' : '#f44336';
  const changeIcon  = goldRates.ch >= 0 ? '▲' : '▼';
  const changeTxt   = goldRates.ch !== 0 ? `<span style="color:${changeColor};margin-left:.6rem">${changeIcon} AED ${Math.abs(goldRates.ch).toFixed(2)} (${Math.abs(goldRates.chp).toFixed(2)}%)</span>` : '';
  const liveDot     = liveActive ? '<span style="display:inline-block;width:7px;height:7px;background:#4CAF50;border-radius:50%;margin-right:.45rem;box-shadow:0 0 6px #4CAF50"></span>' : '';
  const updTxt      = goldRates.lastUpdated
    ? goldRates.lastUpdated.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})
    : 'Fallback';
  return `${liveDot}<strong>LIVE:</strong>&nbsp;
    24K <strong>AED ${goldRates.g24k}/g</strong>&nbsp;·&nbsp;
    22K <strong>AED ${goldRates.g22k}/g</strong>&nbsp;·&nbsp;
    21K <strong>AED ${goldRates.g21k}/g</strong>&nbsp;·&nbsp;
    18K <strong>AED ${goldRates.g18k}/g</strong>${changeTxt}
    <span style="opacity:.65;font-size:.68rem;margin-left:.8rem">Updated ${updTxt}</span>`;
}

function updateGoldBadge() {
  const el = document.getElementById('goldLive');
  if (el) el.innerHTML = formatGoldBadge();
}

// ─── GOLD VALUE CALCULATOR ────────────────────────────────────
function calcGoldValue() {
  const weight = parseFloat(document.getElementById('calcWeight')?.value) || 0;
  const karat = document.getElementById('calcKarat')?.value || '18';
  if (weight <= 0) {
    document.getElementById('calcResult').textContent = 'AED 0.00';
    document.getElementById('calcBreakdown').textContent = 'Enter a valid weight';
    return;
  }
  const rateMap = {
    '24': goldRates.g24k || 601.14,
    '22': goldRates.g22k || 551.05,
    '21': goldRates.g21k || 526.00,
    '18': goldRates.g18k || 450.86,
    '14': +( (goldRates.g18k || 450.86) * (585/750) ).toFixed(2)
  };
  const rate = rateMap[karat];
  const total = weight * rate;
  document.getElementById('calcResult').textContent = `AED ${total.toLocaleString('en-AE', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
  document.getElementById('calcBreakdown').textContent = `${weight}g × ${karat}K (AED ${rate.toFixed(2)}/g)`;
  // Update WhatsApp link
  const wa = document.getElementById('calcWaBtn');
  if (wa) {
    wa.href = `https://wa.me/971543746476?text=${encodeURIComponent(`I want to sell gold\nWeight: ${weight}g\nKarat: ${karat}K\nEstimated value: AED ${total.toFixed(2)}\n\nPlease confirm the final rate after testing.`)}`;
  }
}

function buildTicker() {
  const items = [
    { k: '24K (999)', v: `AED ${goldRates.g24k}/g` },
    { k: '22K (916)', v: `AED ${goldRates.g22k}/g` },
    { k: '21K (875)', v: `AED ${goldRates.g21k}/g` },
    { k: '18K (750)', v: `AED ${goldRates.g18k}/g` },
    { k: 'USD/AED', v: '3.6725' },
    { k: 'Diamond 0.5ct', v: 'AED 2,800+' },
    { k: 'Free Purity Test', v: 'Today Only' },
    { k: 'Buy/Sell Gold', v: 'Best Rate' },
    { k: 'Home Service', v: 'Available' },
    { k: 'WhatsApp Order', v: '+971 54 374 6476' },
    { k: '24K (999)', v: `AED ${goldRates.g24k}/g` },
    { k: '22K (916)', v: `AED ${goldRates.g22k}/g` },
    { k: '21K (875)', v: `AED ${goldRates.g21k}/g` },
    { k: '18K (750)', v: `AED ${goldRates.g18k}/g` },
    { k: 'USD/AED', v: '3.6725' },
    { k: 'Diamond 0.5ct', v: 'AED 2,800+' },
    { k: 'Free Purity Test', v: 'Today Only' },
    { k: 'Buy/Sell Gold', v: 'Best Rate' },
    { k: 'Home Service', v: 'Available' },
    { k: 'WhatsApp Order', v: '+971 54 374 6476' },
  ];
  document.getElementById('tickerInner').innerHTML = items.map(p =>
    `<span class="ticker-item"><i class="fas fa-gem"></i>${p.k}: <strong>${p.v}</strong></span>`
  ).join('');
}

// ═══════════════════════════════════════════════════════════════
// INSTAGRAM GRID
// ═══════════════════════════════════════════════════════════════
function buildInstagram() {
  const imgs = [
    B+'Vancleef%20Bracelet%20%20Carnelian%20.jpg',
    B+'Messika%20rose%20uno%20move.jpg',
    B+'Serpenti%20Bvulgari%20Chocker.jpg',
    B+'Messika-Move-Classic-03998-WG.jpg',
    B+'Vancleef%20Bracelet%20Tiger%20Eyes.jpg',
    B+'Chopard%20Earring.jpg',
    B+'messika_-_packshot_-_collier_lucky_eye_pav_vue_1_07525_yg.webp',
    B+'Vancleef%20Bracelet%20Mother%20of%20pearl.jpg',
    B+'Heart%20Bangle.jpg',
  ];
  const g = document.getElementById('igGrid');
  imgs.forEach((src, i) => {
    const d = document.createElement('div'); d.className = 'ig-post';
    d.onclick = () => window.open('https://instagram.com/ryaanjewellers','_blank');
    d.innerHTML = `<img src="${src}" loading="lazy" onerror="this.style.opacity='.2'">
      <div class="ig-ov">
        <span class="ig-stat"><i class="fas fa-heart"></i>${(Math.random()*4000+800|0).toLocaleString()}</span>
        <span class="ig-stat"><i class="fas fa-comment"></i>${Math.random()*140+30|0}</span>
      </div>`;
    g.appendChild(d);
  });
}

// ═══════════════════════════════════════════════════════════════
// QR CODES
// ═══════════════════════════════════════════════════════════════
function buildQR() {
  if (typeof QRCode === 'undefined') return;
  const opts = {width:145,height:145,colorDark:'#1A1108',colorLight:'#FFFFFF',correctLevel:QRCode.CorrectLevel.H};
  // qr1 uses real PayPal QR image for Thanseer Shameem
  // PayPal link: https://paypal.me/ThanseerShameem
  new QRCode(document.getElementById('qr2'), {...opts,text:'https://pay.ryaanjewellers.com'});
  new QRCode(document.getElementById('qr3'), {...opts,text:'https://ryaanjewellers007.github.io/Ryaanjewellers/'});
  new QRCode(document.getElementById('qr4'), {...opts,text:'https://wa.me/971543746476?text=Hello+Ryaan+Jewellers'});
}

// ═══════════════════════════════════════════════════════════════
// THEME
// ═══════════════════════════════════════════════════════════════
function toggleMob() { document.getElementById('mobMenu').classList.toggle('open'); document.getElementById('overlay').classList.toggle('open'); }
function closeMob() { document.getElementById('mobMenu').classList.remove('open'); document.getElementById('overlay').classList.remove('open'); }
function closeAll() { document.getElementById('cartSidebar').classList.remove('open'); document.getElementById('wishSidebar').classList.remove('open'); document.getElementById('mobMenu').classList.remove('open'); document.getElementById('overlay').classList.remove('open'); }

// ═══════════════════════════════════════════════════════════════
// APPOINTMENT
// ═══════════════════════════════════════════════════════════════
function submitAppt(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.form-btn');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  btn.disabled = true;
  setTimeout(() => {
    btn.innerHTML = '<i class="fas fa-calendar-check"></i>Request Appointment';
    btn.disabled = false;
    e.target.reset();
    showToast('Appointment requested! We will contact you within 2 hours.', 'ok');
  }, 2000);
}

// ═══════════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════════
function showToast(msg, type='') {
  const el = document.getElementById('toastEl');
  const ico = document.getElementById('toastIco');
  document.getElementById('toastMsg').textContent = msg;
  el.className = `toast ${type === 'ok' ? 'ok' : type === 'er' ? 'er' : ''} show`;
  ico.className = type === 'ok' ? 'fas fa-check-circle' : type === 'er' ? 'fas fa-times-circle' : 'fas fa-gem';
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 4500);
}

// ═══════════════════════════════════════════════════════════════
// SCROLL ANIMATIONS
// ═══════════════════════════════════════════════════════════════
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)'; } });
}, {threshold: 0.1});

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {
  const d = document.getElementById('apptDate');
  if (d) d.min = new Date().toISOString().split('T')[0];
  fetchGoldPrice();
  setInterval(fetchGoldPrice, 300000); // refresh every 5 min
  renderProducts();
  buildInstagram();
  setTimeout(buildQR, 300);
  setTimeout(() => document.getElementById('loader').classList.add('gone'), 1100);
  initCookie();
  initLeadBar();
  showMemberGreeting();
  calcGoldValue(); // init gold calculator with current/fallback rates
  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const t = document.querySelector(a.getAttribute('href'));
      if (t) { e.preventDefault(); t.scrollIntoView({behavior:'smooth',block:'start'}); }
    });
  });
  // ESC key handlers
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeSearch();
      closeProduct();
      closeCheckout();
      closeAll();
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// CUSTOMER CAPTURE & CRM SYSTEM
// ═══════════════════════════════════════════════════════════════

// ─── COOKIE CONSENT ───────────────────────────────────────────
function acceptCookie() {
  localStorage.setItem('rjCookie', 'accepted');
  document.getElementById('cookieBar').classList.add('hidden');
  // Start popup timer after cookie accepted
  setTimeout(() => {
    if (!localStorage.getItem('rjNLDone')) showNLPopup();
  }, 25000); // 25 seconds
}
function dismissCookie() {
  localStorage.setItem('rjCookie', 'declined');
  document.getElementById('cookieBar').classList.add('hidden');
}
function initCookie() {
  if (!localStorage.getItem('rjCookie')) {
    document.getElementById('cookieBar').classList.remove('hidden');
  } else {
    document.getElementById('cookieBar').classList.add('hidden');
    // Already accepted → trigger popup later
    if (!localStorage.getItem('rjNLDone')) setTimeout(showNLPopup, 30000);
  }
}

// ─── NEWSLETTER POPUP ─────────────────────────────────────────
function showNLPopup() {
  if (localStorage.getItem('rjNLDone')) return;
  document.getElementById('nlPopup').classList.add('open');
}
function openNL() { document.getElementById('nlPopup').classList.add('open'); }
function closeNL() { document.getElementById('nlPopup').classList.remove('open'); }

function submitNL() {
  const name  = document.getElementById('nlName').value.trim();
  const email = document.getElementById('nlEmail').value.trim();
  const phone = document.getElementById('nlPhone').value.trim();
  if (!email) { showToast('Please enter your email!', 'er'); return; }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) { showToast('Please enter a valid email!', 'er'); return; }
  // Save to localStorage (in a real setup, POST to your backend/Mailchimp)
  const leads = JSON.parse(localStorage.getItem('rjLeads') || '[]');
  leads.push({ name, email, phone, date: new Date().toISOString(), source: 'popup' });
  sendLead('newsletter', { name, email, phone, source: 'popup' });
  localStorage.setItem('rjLeads', JSON.stringify(leads));
  localStorage.setItem('rjNLDone', '1');
  localStorage.setItem('rjMemberName', name || 'VIP Member');
  localStorage.setItem('rjDiscount', '5');
  // Show success
  document.getElementById('nlBody').innerHTML = `
    <div class="nl-success">
      <div class="check"><i class="fas fa-check"></i></div>
      <h3 style="font-family:var(--serif);font-size:1.6rem;color:var(--txt);margin-bottom:.75rem">Welcome, ${esc(name) || 'Friend'}! 💎</h3>
      <p style="color:var(--muted);margin-bottom:1.5rem">Your 5% discount is active! Use code <strong style="color:var(--gold)">RYAAN5</strong> at checkout.</p>
      <a href="https://wa.me/971543746476?text=Hi+Ryaan+Jewellers!+I+just+subscribed+(${encodeURIComponent(email)})+and+want+to+shop+with+my+5%25+discount" target="_blank" class="btn btn-dark" style="justify-content:center;width:100%;margin-bottom:.75rem">
        <i class="fab fa-whatsapp"></i>Message Us on WhatsApp
      </a>
      <button class="btn btn-gold" style="justify-content:center;width:100%" onclick="closeNL()">Start Shopping</button>
    </div>`;
  showToast('Welcome to Ryaan VIP! 5% discount unlocked 🎉', 'ok');
  setTimeout(closeNL, 8000);
  // Show floating lead bar (hide now that they joined)
  document.getElementById('leadBar').style.display = 'none';
}

// ─── LEAD BAR ─────────────────────────────────────────────────
function initLeadBar() {
  if (!localStorage.getItem('rjNLDone')) {
    setTimeout(() => document.getElementById('leadBar').classList.add('show'), 8000);
  } else {
    document.getElementById('leadBar').style.display = 'none';
  }
}

// Exit intent
document.addEventListener('mouseleave', (e) => {
  if (e.clientY <= 0 && !localStorage.getItem('rjNLDone')) {
    showNLPopup();
  }
});

// ─── CUSTOMER REGISTER / CRM ──────────────────────────────────
function openCRM()  { document.getElementById('crmModal').classList.add('open'); }
function closeCRM() { document.getElementById('crmModal').classList.remove('open'); }

function switchTab(tab) {
  document.querySelectorAll('.crm-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.crm-panel').forEach(p => p.classList.remove('active'));
  const tabMap = { register: 0, login: 1, benefits: 2 };
  document.querySelectorAll('.crm-tab')[tabMap[tab]].classList.add('active');
  document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
}

function submitRegister() {
  const first   = document.getElementById('regFirst').value.trim();
  const last    = document.getElementById('regLast').value.trim();
  const email   = document.getElementById('regEmail').value.trim();
  const phone   = document.getElementById('regPhone').value.trim();
  const consent = document.getElementById('regConsent').checked;
  if (!first || !email || !phone) { showToast('Please fill all required fields!', 'er'); return; }
  if (!consent) { showToast('Please agree to receive updates to continue.', 'er'); return; }
  // Store customer data
  const customer = { first, last, email, phone, city: document.getElementById('regCity').value, interest: document.getElementById('regInterest').value, joined: new Date().toISOString(), source: 'register' };
  const customers = JSON.parse(localStorage.getItem('rjCustomers') || '[]');
  customers.push(customer);
  sendLead('registration', customer);
  localStorage.setItem('rjCustomers', JSON.stringify(customers));
  localStorage.setItem('rjNLDone', '1');
  localStorage.setItem('rjMemberName', first);
  localStorage.setItem('rjDiscount', '5');
  localStorage.setItem('rjMemberEmail', email);
  // WhatsApp notification to owner with new customer details
  const ownerMsg = `New Customer Registration!%0A%0AName: ${first} ${last}%0AEmail: ${email}%0APhone: ${phone}%0ACity: ${document.getElementById('regCity').value}%0AInterest: ${document.getElementById('regInterest').value}%0ADate: ${new Date().toLocaleDateString()}`;
  // Send welcome panel
  document.getElementById('tabRegister').innerHTML = `
    <div class="nl-success">
      <div class="check"><i class="fas fa-gem"></i></div>
      <h3 style="font-family:var(--serif);font-size:1.6rem;color:var(--txt);margin-bottom:.75rem">Welcome, ${esc(first)}! 💎</h3>
      <p style="color:var(--muted);margin-bottom:.5rem">Your Ryaan VIP account is created!</p>
      <p style="background:var(--gold-p);border:1px solid var(--gold);border-radius:4px;padding:1rem;margin:1rem 0;font-size:.9rem;color:var(--txt)">
        🎁 <strong>Discount Code: RYAAN5</strong><br>
        <span style="font-size:.8rem;color:var(--muted)">5% off your first order — mention this when ordering</span>
      </p>
      <a href="https://wa.me/971543746476?text=${ownerMsg}" target="_blank" class="btn btn-dark" style="justify-content:center;width:100%;margin-bottom:.75rem">
        <i class="fab fa-whatsapp"></i>Confirm on WhatsApp
      </a>
      <button class="btn btn-gold" style="justify-content:center;width:100%" onclick="closeCRM()">Start Shopping!</button>
    </div>`;
  showToast(`Welcome ${first}! Account created. 5% discount unlocked 🎉`, 'ok');
  document.getElementById('leadBar').style.display = 'none';
}

function submitLogin() {
  showToast('Signing in via WhatsApp for now. Full login coming soon!', '');
  window.open('https://wa.me/971543746476?text=I+want+to+access+my+Ryaan+Jewellers+account', '_blank');
}

// ─── FOOTER NEWSLETTER ────────────────────────────────────────
function footerNLSubmit() {
  const email = document.getElementById('footerNlEmail').value.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast('Please enter a valid email address!', 'er'); return;
  }
  const leads = JSON.parse(localStorage.getItem('rjLeads') || '[]');
  leads.push({ email, date: new Date().toISOString(), source: 'footer' });
  sendLead('newsletter', { email, source: 'footer' });
  localStorage.setItem('rjLeads', JSON.stringify(leads));
  localStorage.setItem('rjNLDone', '1');
  document.getElementById('footerNlEmail').value = '';
  showToast('Subscribed! Welcome to the Ryaan family 💎', 'ok');
}

// ─── MEMBER GREETING ──────────────────────────────────────────
function showMemberGreeting() {
  const name = localStorage.getItem('rjMemberName');
  const discount = localStorage.getItem('rjDiscount');
  if (name && discount) {
    const bar = document.getElementById('goldLive');
    if (bar) {
      bar.title = `Welcome back ${name}! Your ${discount}% discount (RYAAN5) is active.`;
    }
  }
}



// ═══════════════════════════════════════════════════════════════
// PREMIUM LAYER — theme · language · currency · compare · assistant
// ═══════════════════════════════════════════════════════════════
(function () {
'use strict';
const $ = id => document.getElementById(id);
const root = document.documentElement;
const LS = {
  get(k, d = null) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  json(k, d) { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v === null ? d : v; } catch (e) { return d; } }
};
window.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const esc = window.esc;

// ───────────────────────── MENUS ─────────────────────────
const MENUS = ['theme', 'cur', 'lang'];
function closeMenus(except) {
  MENUS.forEach(m => {
    if (m === except) return;
    const dd = $(m + 'DD'), b = $(m + 'Btn');
    if (dd) dd.classList.remove('open');
    if (b) b.setAttribute('aria-expanded', 'false');
  });
}
window.toggleMenu = function (m) {
  const dd = $(m + 'DD'), b = $(m + 'Btn');
  if (!dd || !b) return;
  const open = !dd.classList.contains('open');
  closeMenus(open ? m : null);
  dd.classList.toggle('open', open);
  b.setAttribute('aria-expanded', open ? 'true' : 'false');
};
document.addEventListener('click', e => { if (!e.target.closest('.ctl-wrap')) closeMenus(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeMenus(); closeCmp(); } });

// ───────────────────────── THEME ─────────────────────────
const PAL = {
  gold:    ['Classic Gold', '#C8A84B', '#1A1108'],
  navy:    ['Royal Navy',   '#C9A24D', '#0B1B3A'],
  emerald: ['Emerald',      '#C9A96A', '#062B22'],
  rose:    ['Rose Gold',    '#B76E79', '#17121A']
};
let rjPal = 'gold', rjMode = 'light';
function applyTheme() {
  if (rjPal === 'gold') root.removeAttribute('data-palette'); else root.setAttribute('data-palette', rjPal);
  const dark = rjMode === 'dark' || (rjMode === 'auto' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
  document.body.classList.toggle('dark', dark);
  document.querySelectorAll('.pal').forEach(b => b.classList.toggle('on', b.dataset.pal === rjPal));
  document.querySelectorAll('.seg [data-mode]').forEach(b => b.classList.toggle('on', b.dataset.mode === rjMode));
  const dot = $('themeDot'), p = PAL[rjPal];
  if (dot && p) dot.style.background = `linear-gradient(135deg, ${p[2]} 50%, ${p[1]} 50%)`;
  requestAnimationFrame(() => {
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', getComputedStyle(document.body).getPropertyValue('--bg').trim() || '#FEFCF5');
  });
}
window.setPalette = p => { if (!PAL[p]) return; rjPal = p; LS.set('rjPalette', p); applyTheme(); };
window.setMode = m => { rjMode = m; LS.set('rjMode', m); applyTheme(); };
window.toggleDark = () => setMode(document.body.classList.contains('dark') ? 'light' : 'dark');
if (window.matchMedia) {
  const mq = matchMedia('(prefers-color-scheme: dark)');
  const h = () => { if (rjMode === 'auto') applyTheme(); };
  mq.addEventListener ? mq.addEventListener('change', h) : mq.addListener && mq.addListener(h);
}

// ───────────────────────── LANGUAGE ─────────────────────────
const LANGS = {
  en: { n: 'English',  c: 'EN', dir: 'ltr' },
  ar: { n: 'العربية',  c: 'AR', dir: 'rtl' },
  hi: { n: 'हिन्दी',    c: 'HI', dir: 'ltr' },
  ur: { n: 'اردو',     c: 'UR', dir: 'rtl' },
  fr: { n: 'Français', c: 'FR', dir: 'ltr' }
};
let rjLang = 'en';
const I18N = window.RJ_I18N || {};
const normS = s => s.replace(/\s+/g, ' ').trim();
const _pats = {};
function compilePatterns(lang) {
  const d = I18N[lang] || {}, out = [];
  for (const k in d) {
    if (!/\{\d\}/.test(k)) continue;
    const parts = k.split(/\{\d\}/);
    const src = '^' + parts.map(p => p.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&')).join('(.+?)') + '$';
    out.push([new RegExp(src), d[k]]);
  }
  return out;
}
function tr(s, lang) {
  lang = lang || rjLang;
  if (lang === 'en' || typeof s !== 'string') return s;
  const d = I18N[lang]; if (!d) return s;
  const k = normS(s); if (!k) return s;
  if (d[k] !== undefined) return d[k];
  const pats = _pats[lang] || (_pats[lang] = compilePatterns(lang));
  for (let i = 0; i < pats.length; i++) {
    const m = k.match(pats[i][0]);
    if (m) return pats[i][1].replace(/\{(\d)\}/g, (_, n) => tr(m[+n + 1], lang));
  }
  return s;
}
window.tr = tr;
const _rec = new WeakMap();
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
function trTextNode(n) {
  const p = n.parentNode; if (!p) return;
  const tag = p.nodeName; if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return;
  if (p.closest && p.closest('[data-no-i18n]')) return;
  const cur = n.nodeValue;
  let rec = _rec.get(n);
  if (!rec || cur !== rec.t) { rec = { o: cur, t: cur }; _rec.set(n, rec); }
  if (rjLang === 'en') { if (cur !== rec.o) n.nodeValue = rec.o; rec.t = rec.o; return; }
  const o = rec.o, core = o.trim(); if (!core) return;
  const out = tr(core);
  const v = out === core ? o : o.match(/^\s*/)[0] + out + o.match(/\s*$/)[0];
  if (cur !== v) n.nodeValue = v;
  rec.t = v;
}
function trElementAttrs(el) {
  if (!el.getAttribute) return;
  const store = el.__oa || (el.__oa = {});
  for (let i = 0; i < ATTRS.length; i++) {
    const a = ATTRS[i];
    if (!el.hasAttribute(a)) continue;
    const cur = el.getAttribute(a);
    if (store[a] === undefined || (store[a].t !== cur)) store[a] = { o: cur, t: cur };
    const o = store[a].o;
    const v = rjLang === 'en' ? o : tr(o);
    if (cur !== v) el.setAttribute(a, v);
    store[a].t = v;
  }
}
function trTree(rootNode) {
  if (rootNode.nodeType === 3) { trTextNode(rootNode); return; }
  if (rootNode.nodeType !== 1 && rootNode.nodeType !== 11) return;
  if (rootNode.nodeType === 1) trElementAttrs(rootNode);
  const w = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n; while ((n = w.nextNode())) { if (n.nodeType === 3) trTextNode(n); else trElementAttrs(n); }
}
const mo = new MutationObserver(muts => {
  mo.disconnect();
  try {
    muts.forEach(m => {
      if (m.type === 'characterData') trTextNode(m.target);
      else m.addedNodes.forEach(n => trTree(n));
    });
  } finally { startObs(); }
});
const pidx = p => PRODUCTS.indexOf(p);
function startObs() { if (rjLang !== 'en') mo.observe(document.body, { childList: true, subtree: true, characterData: true }); }
let origTitle = document.title;
window.setLang = function (code) {
  if (!LANGS[code]) code = 'en';
  rjLang = code; LS.set('rjLang', code);
  const L = LANGS[code];
  root.lang = code; root.dir = L.dir;
  mo.disconnect();
  trTree(document.body);
  document.title = code === 'en' ? origTitle : tr(origTitle);
  if (code !== 'en') startObs();
  const lbl = $('langLabel'); if (lbl) lbl.textContent = L.c;
  document.querySelectorAll('#langDD .dd-opt').forEach(b => b.classList.toggle('on', b.dataset.lang === code));
  closeMenus();
};
window.rjLangNow = () => rjLang;

// ───────────────────────── CURRENCY ─────────────────────────
const CUR = {
  AED: 'UAE Dirham', USD: 'US Dollar', SAR: 'Saudi Riyal',
  EUR: 'Euro', GBP: 'British Pound', INR: 'Indian Rupee'
};
const FLOATING = ['EUR', 'GBP', 'INR'];
let rjCur = 'AED', fx = {};
function rate(c) {
  if (c === 'AED') return 1;
  if (c === 'USD') return 1 / 3.6725;      // AED is pegged to USD
  if (c === 'SAR') return 3.75 / 3.6725;   // SAR is pegged to USD
  return fx[c] || null;
}
const fmtNum = x => Number.isInteger(x) ? x.toLocaleString('en-US') : x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
window.money = function (aed, cur) {
  cur = cur || rjCur;
  const r = rate(cur);
  if (cur === 'AED' || !r) return 'AED ' + fmtNum(Math.round(aed * 100) / 100);
  try { return '≈ ' + new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(aed * r); }
  catch (e) { return 'AED ' + fmtNum(aed); }
};
function buildCurList() {
  const l = $('curList'); if (!l) return;
  l.innerHTML = Object.keys(CUR).map(c => {
    const ok = rate(c) !== null;
    return `<button class="dd-opt ${c === rjCur ? 'on' : ''}" data-cur="${c}" ${ok ? '' : 'disabled'} onclick="setCurrency('${c}')"><span>${CUR[c]}</span><small>${c}</small></button>`;
  }).join('');
}
function refreshPx() {
  document.querySelectorAll('.px[data-aed]').forEach(e => { e.textContent = money(+e.dataset.aed); });
}
window.setCurrency = function (c) {
  if (!CUR[c] || rate(c) === null) return;
  rjCur = c; LS.set('rjCur', c);
  const l = $('curLabel'); if (l) l.textContent = c;
  buildCurList(); closeMenus();
  renderProducts(); updateCartUI(); updateWishUI(); refreshPx(); renderRecent();
  if ($('cmpModal') && $('cmpModal').classList.contains('open')) openCmp();
  if ($('productModal') && $('productModal').classList.contains('open') && selectedProduct) {
    const pr = document.querySelector('.pm-price'); if (pr) pr.textContent = money(selectedProduct.price);
    changeModalQty(0);
  }
};
async function loadFx() {
  const cached = LS.json('rjFx', null);
  if (cached && Date.now() - cached.t < 6 * 3600 * 1000) { fx = cached.r; buildCurList(); return; }
  try {
    const res = await fetch(RJ_CONFIG.FX_URL);
    const j = await res.json();
    if (j && j.rates) {
      FLOATING.forEach(c => { if (j.rates[c]) fx[c] = j.rates[c]; });
      LS.set('rjFx', JSON.stringify({ t: Date.now(), r: fx }));
    }
  } catch (e) { /* floating currencies stay disabled when live rates are unavailable */ }
  buildCurList();
  if (rate(rjCur) === null) setCurrency('AED');
}

// ───────────────────────── PERSISTENCE ─────────────────────────
function persistCart() { LS.set('rjCart', JSON.stringify(cart.map(c => [c.name, c.qty]))); }
function persistWish() { LS.set('rjWish', JSON.stringify(wishlist.map(w => w.name))); }
window.persistCart = persistCart;
function restoreStore() {
  LS.json('rjCart', []).forEach(([n, q]) => { const p = PRODUCTS.find(x => x.name === n); if (p && q > 0) cart.push({ ...p, qty: q }); });
  LS.json('rjWish', []).forEach(n => { const p = PRODUCTS.find(x => x.name === n); if (p) wishlist.push(p); });
}

// ───────────────────────── DISCOUNT ─────────────────────────
let coupon = LS.get('rjCoupon', '');
function discountPct() { return (coupon === 'RYAAN5' || LS.get('rjDiscount') === '5') ? 5 : 0; }
window.cartTotals = function () {
  const sub = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const pct = discountPct();
  const disc = Math.round(sub * pct) / 100;
  return { sub, pct, disc, total: sub - disc };
};
window.applyCoupon = function () {
  const v = ($('couponIn').value || '').trim().toUpperCase();
  if (!v) return;
  if (v === 'RYAAN5') { coupon = v; LS.set('rjCoupon', v); showToast('Discount code applied — 5% off!', 'ok'); updateCartUI(); }
  else showToast('Invalid discount code', 'er');
};
function renderDiscUI() {
  const box = $('discBox'); if (!box) return;
  const T = cartTotals();
  if (T.pct > 0) box.innerHTML = `<div class="disc-row"><span>${esc(tr('Member discount'))} (${T.pct}%)</span><span>− ${money(T.disc)}</span></div>`;
  else box.innerHTML = `<div class="coupon-row"><input id="couponIn" type="text" maxlength="14" placeholder="${esc(tr('Discount code'))}" autocomplete="off"><button onclick="applyCoupon()">${esc(tr('Apply'))}</button></div>`;
  const n = $('curNote'); if (n) n.style.display = rjCur === 'AED' ? 'none' : 'block';
  trTree(box);
}

// ───────────────────────── LEADS ─────────────────────────
window.sendLead = function (type, data) {
  const rec = Object.assign({ type, ts: new Date().toISOString(), lang: rjLang, page: location.href.split('#')[0] }, data || {});
  const log = LS.json('rjLeadLog', []); log.push(rec); LS.set('rjLeadLog', JSON.stringify(log.slice(-200)));
  if (RJ_CONFIG.LEADS_ENDPOINT) {
    try { fetch(RJ_CONFIG.LEADS_ENDPOINT, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(rec), keepalive: true }); } catch (e) {}
  }
};

// ───────────────────────── WRAPS ─────────────────────────
const _ucu = window.updateCartUI;
window.updateCartUI = function () {
  _ucu();
  persistCart(); renderDiscUI();
  const n = cart.reduce((s, c) => s + c.qty, 0), b = $('cBdg2');
  if (b) { b.textContent = n; b.style.display = n ? 'block' : 'none'; }
};
const _uwu = window.updateWishUI;
window.updateWishUI = function () {
  _uwu();
  persistWish();
  const b = $('wBdg2'); if (b) { b.textContent = wishlist.length; b.style.display = wishlist.length ? 'block' : 'none'; }
};
const _bt = window.buildTicker;
window.buildTicker = function () {
  _bt();
  const a = document.querySelector('.ann');
  if (a && goldRates && goldRates.g24k) a.textContent = `✦ Today: 24K = AED ${goldRates.g24k}/g · 22K = AED ${goldRates.g22k}/g · 18K = AED ${goldRates.g18k}/g · Free Purity Testing · WhatsApp +971 54 374 6476 ✦`;
};

// ───────────────────────── FILTERS ─────────────────────────
window.filterMetal = function (m, btn) {
  window.RJ_METAL = m;
  document.querySelectorAll('.mchip').forEach(b => b.classList.toggle('on', b === btn));
  renderProducts();
};

// ───────────────────────── COMPARE ─────────────────────────
const cmp = []; window.__cmpList = cmp;
const byName = n => PRODUCTS.find(p => p.name === n);
window.toggleCompare = function (e, idx) {
  if (e) e.stopPropagation();
  const p = getFiltered()[idx]; if (!p) return;
  cmpToggleName(p.name);
};
function cmpToggleName(n) {
  const i = cmp.indexOf(n);
  if (i >= 0) cmp.splice(i, 1);
  else { if (cmp.length >= 3) { showToast('You can compare up to 3 pieces', 'er'); return; } cmp.push(n); }
  renderCmpTray(); syncCmpButtons();
}
function syncCmpButtons() {
  document.querySelectorAll('.pc').forEach(c => { const b = c.querySelector('.pa-cmp'); if (b) b.classList.toggle('cmp-on', cmp.includes(c.dataset.name)); });
}
function renderCmpTray() {
  const t = $('cmpTray'); if (!t) return;
  const slots = [0, 1, 2].map(i => {
    const p = byName(cmp[i]);
    return p ? `<div class="cmp-slot has"><img src="${esc(p.img)}" alt="${esc(p.name)}"><button class="cmp-x" onclick="cmpRemove(${i})" aria-label="Remove"><i class="fas fa-times"></i></button></div>` : `<div class="cmp-slot"><i class="fas fa-plus"></i></div>`;
  }).join('');
  $('cmpSlots').innerHTML = slots;
  $('cmpGo').disabled = cmp.length < 2;
  t.classList.toggle('show', cmp.length > 0);
}
window.cmpRemove = i => { cmp.splice(i, 1); renderCmpTray(); syncCmpButtons(); if ($('cmpModal').classList.contains('open')) { cmp.length ? openCmp() : closeCmp(); } };
window.cmpClear = () => { cmp.length = 0; renderCmpTray(); syncCmpButtons(); closeCmp(); };
window.openCmp = function () {
  if (cmp.length < 2) return;
  const ps = cmp.map(byName).filter(Boolean);
  const wt = p => parseFloat(p.weight) || 1;
  const minP = Math.min(...ps.map(p => p.price)), minG = Math.min(...ps.map(p => p.price / wt(p)));
  const row = (label, fn) => `<tr><td>${esc(label)}</td>${ps.map(p => `<td>${fn(p)}</td>`).join('')}</tr>`;
  $('cmpBody').innerHTML = `<div class="cmp-scroll"><table class="cmp-table">
    <tr><td></td>${ps.map((p, i) => `<td><img src="${esc(p.img)}" alt="${esc(p.name)}"><div style="font-family:var(--serif);font-weight:600;margin-top:.6rem">${esc(p.name)}</div></td>`).join('')}</tr>
    ${row('Style', p => esc(p.brand))}
    ${row('Metal', p => esc(p.metal))}
    ${row('Weight', p => esc(p.weight))}
    ${row('Price', p => `<span class="${p.price === minP ? 'best' : ''}">${money(p.price)}</span>`)}
    ${row('Price per gram', p => `<span class="${p.price / wt(p) === minG ? 'best' : ''}">${money(p.price / wt(p))}</span>`)}
    ${row('Certification', p => esc(p.certification))}
    ${row('Delivery', () => 'Free in Dubai')}
    <tr><td></td>${ps.map(p => `<td><button class="pcart" onclick="cmpAdd(${pidx(p)})">Add to Cart</button></td>`).join('')}</tr>
  </table></div>`;
  $('cmpModal').classList.add('open');
  trTree($('cmpBox'));
};
window.cmpAdd = function (i) {
  const p = PRODUCTS[i]; if (!p) return;
  const ex = cart.find(c => c.name === p.name); if (ex) ex.qty++; else cart.push({ ...p, qty: 1 });
  updateCartUI(); showToast(`"${p.name.slice(0, 28)}" added to cart!`, 'ok');
};
function closeCmp() { const m = $('cmpModal'); if (m) m.classList.remove('open'); }
window.closeCmp = closeCmp;

// ───────────────────────── RECENTLY VIEWED + SHARE ─────────────────────────
const slug = n => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function pushRecent(n) {
  let r = LS.json('rjRecent', []).filter(x => x !== n); r.unshift(n); r = r.slice(0, 8);
  LS.set('rjRecent', JSON.stringify(r)); renderRecent();
}
function renderRecent() {
  const w = $('rvWrap'), row = $('rvRow'); if (!w || !row) return;
  const ps = LS.json('rjRecent', []).map(byName).filter(Boolean);
  w.classList.toggle('show', ps.length > 0);
  row.innerHTML = ps.map(p => `<div class="rv-card" onclick="openProduct(null, PRODUCTS[${pidx(p)}])"><img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy"><div><b>${esc(p.name)}</b><span>${money(p.price)}</span></div></div>`).join('');
}
window.byNameGlobal = byName;
window.clearRecent = () => { LS.set('rjRecent', '[]'); renderRecent(); };
const _op = window.openProduct;
window.openProduct = function (e, idx) {
  _op(e, idx);
  const p = selectedProduct; if (!p) return;
  pushRecent(p.name);
  const side = document.querySelector('.pm-info-side');
  if (side && !side.querySelector('.pm-share')) {
    const url = location.href.split('#')[0] + '#p=' + slug(p.name);
    const msg = encodeURIComponent(`${p.name} — ${money(p.price, 'AED')}\n${url}`);
    side.insertAdjacentHTML('beforeend', `<div class="pm-share">
      <button onclick="copyLink('${slug(p.name)}')"><i class="fas fa-link"></i>Copy link</button>
      <a href="https://wa.me/?text=${msg}" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i>Share</a>
      <button onclick="cmpToggleNameG(${pidx(p)})"><i class="fas fa-scale-balanced"></i>Compare</button>
    </div>${rjCur !== 'AED' ? '<div class="pm-note">Prices are charged in AED. Other currencies are indicative.</div>' : ''}`);
    trTree(side);
  }
};
window.cmpToggleNameG = i => { if (PRODUCTS[i]) cmpToggleName(PRODUCTS[i].name); };
window.copyLink = function (s) {
  const url = location.href.split('#')[0] + '#p=' + s;
  const done = () => showToast('Link copied!', 'ok');
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, () => prompt('Copy this link', url));
  else prompt('Copy this link', url);
};
window.searchSelect = function (idx) { closeSearch(); openProduct(null, PRODUCTS[idx]); };

// ───────────────────────── ORDER (fixed message, discount, lead) ─────────────────────────
window.placeOrder = function () {
  const v = id => ($(id).value || '').trim();
  const fn = v('firstName'), ln = v('lastName'), ph = v('phone'), em = v('email'), ad = v('address'), notes = v('notes');
  if (!fn || !ln || !ph || !em || !ad) { showToast('Please fill all required fields!', 'er'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { showToast('Please enter a valid email!', 'er'); return; }
  const btn = document.querySelector('#checkoutBody .form-btn') || document.querySelector('.form-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  const T = cartTotals();
  const lines = cart.map(c => `${c.name} × ${c.qty} = AED ${fmtNum(c.price * c.qty)}`);
  const sel = document.querySelector('.pay-opt.selected span');
  const pay = sel ? sel.textContent.trim() : '';
  const text = [
    'New Order from Ryaan Jewellers Website!', '',
    `Name: ${fn} ${ln}`, `Phone: ${ph}`, `Email: ${em}`, `Address: ${ad}`, notes ? `Notes: ${notes}` : null, pay ? `Payment: ${pay}` : null, '',
    'Items:', ...lines, '',
    T.pct ? `Subtotal: AED ${fmtNum(T.sub)}` : null,
    T.pct ? `Member discount (${T.pct}%): -AED ${fmtNum(T.disc)}` : null,
    `Total: AED ${fmtNum(T.total)}`, '', 'Please confirm this order. Thank you!'
  ].filter(x => x !== null).join('\n');
  const waUrl = 'https://wa.me/971543746476?text=' + encodeURIComponent(text);
  sendLead('order', { name: `${fn} ${ln}`, phone: ph, email: em, address: ad, notes, payment: pay, items: lines.join(' | '), subtotal: T.sub, discount: T.disc, total: T.total, currency_shown: rjCur });
  setTimeout(() => {
    btn.disabled = false;
    $('checkoutBody').innerHTML = `<div class="order-success">
      <div class="check"><i class="fas fa-check"></i></div>
      <h2 style="font-family:var(--serif);font-size:1.8rem;color:var(--txt);margin-bottom:1rem">Order Placed!</h2>
      <p style="color:var(--muted);margin-bottom:2rem">Thank you ${esc(fn)}! We'll confirm your order via WhatsApp shortly.</p>
      <p style="font-size:.9rem;color:var(--txt2);margin-bottom:2rem">Order total: <strong style="color:var(--gold)">AED ${fmtNum(T.total)}</strong></p>
      <a href="${waUrl}" target="_blank" rel="noopener" class="btn btn-dark" style="justify-content:center;width:100%;margin-bottom:.75rem"><i class="fab fa-whatsapp"></i>Confirm via WhatsApp</a>
      <button class="btn btn-gold" style="justify-content:center;width:100%" onclick="closeCheckout()">Close</button>
    </div>`;
    cart.length = 0; updateCartUI();
    $('checkoutTitle').textContent = tr('Order Confirmed ✓');
    trTree($('checkoutBody'));
    if (pay.includes('PayPal')) setTimeout(() => { if (confirm(tr('Would you also like to complete payment on PayPal?'))) window.open('https://paypal.me/ThanseerShameem', '_blank', 'noopener'); }, 1000);
  }, 1200);
};

// ───────────────────────── APPOINTMENT (now captured) ─────────────────────────
window.submitAppt = function (e) {
  e.preventDefault();
  const f = e.target, els = f.querySelectorAll('input,select,textarea');
  const d = { name: els[0].value.trim(), phone: els[1].value.trim(), date: els[2].value, time: els[3].value, interest: els[4].value, message: (els[5] && els[5].value || '').trim() };
  const btn = f.querySelector('.form-btn');
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  sendLead('appointment', d);
  const text = ['Appointment request — Ryaan Jewellers', `Name: ${d.name}`, `Phone: ${d.phone}`, `Date: ${d.date}`, `Time: ${d.time}`, `Interest: ${d.interest}`, d.message ? `Message: ${d.message}` : null].filter(Boolean).join('\n');
  setTimeout(() => {
    btn.innerHTML = '<i class="fas fa-calendar-check"></i>Request Appointment'; btn.disabled = false;
    let w = $('apptWa');
    if (!w) { w = document.createElement('div'); w.id = 'apptWa'; w.style.marginTop = '1rem'; f.appendChild(w); }
    w.innerHTML = `<a class="btn btn-dark" style="width:100%;justify-content:center" target="_blank" rel="noopener" href="https://wa.me/971543746476?text=${encodeURIComponent(text)}"><i class="fab fa-whatsapp"></i>Confirm on WhatsApp</a>`;
    trTree(w);
    f.reset();
    showToast('Appointment requested! We will contact you within 2 hours.', 'ok');
  }, 900);
};

// ───────────────────────── ASSISTANT (offline, multilingual) ─────────────────────────
const KW = {
  hello:   /\b(hi|hello|hey|salam|salaam|marhaba|bonjour|salut)\b|مرحب|السلام|اهلا|أهلا|नमस्ते|हेलो|नमस्कार|ہیلو|سلام/i,
  gold:    /gold\s*(price|rate)|price of gold|\brates?\b|سعر|الذهب|اسعار|أسعار|भाव|सोने|सोना|prix de l|cours de l|\bor\b.*(prix|cours)|سونے|سونا.*(قیمت|ریٹ)|ریٹ/i,
  delivery:/deliver|shipping|ship\b|home visit|توصيل|توصيل|delivery|डिलीवरी|होम|livraison|ڈیلیوری|ترسیل/i,
  hours:   /where|location|address|open|hours|timing|موقع|عنوان|ساعات|دوام|कहाँ|पता|समय|खुला|adresse|horaire|ouvert|پتہ|کہاں|وقت/i,
  sell:    /\bsell|buy (old )?gold|scrap|old gold|exchange|بيع|اشتري|شراء|ذهب قديم|बेच|पुराना|खरीद|vendre|vends|acheter|or usagé|بیچ|پرانا/i,
  appt:    /appointment|book|visit|viewing|موعد|زيارة|حجز|अपॉइंटमेंट|बुक|rendez|réserv|ملاقات|اپائنٹمنٹ/i,
  pay:     /\bpay|payment|card|apple pay|paypal|installment|دفع|بطاقة|भुगतान|कार्ड|paiement|carte|ادائیگی|کارڈ/i,
  ret:     /return|refund|warranty|guarantee|exchange policy|إرجاع|استرجاع|ضمان|वापसी|वारंटी|retour|garantie|rembours|واپسی|وارنٹی/i,
  budget:  /under|below|less than|budget|within|up to|max|تحت|اقل|أقل|ميزانية|ميزانيتي|बजट|तक|से कम|moins de|budget|بجٹ|سے کم/i
};
const CATS = [
  [/bracelet|bangle|سوار|أساور|اسورة|कंगन|ब्रेसलेट|bracelet|bague|کنگن/i, /Bracelet|Bangle/i, 'bracelets'],
  [/necklace|choker|chain|pendant|قلادة|عقد|हार|collier|ہار|لاکٹ/i, /Necklace|Choker|Sautoir/i, 'necklaces'],
  [/\bring|خاتم|انگوٹھی|अंगूठी|\bbague/i, /\bRing\b/i, 'rings'],
  [/earring|hoop|studs|حلق|أقراط|اقراط|झुमके|बाली|boucle|بالیاں|بالیاں/i, /Earring|Hoop/i, 'earrings'],
  [/\bset\b|طقم|सेट|ensemble|سیٹ/i, /Set\b/i, 'sets']
];
function suggest(list, intro) {
  const items = list.slice(0, 3).map(p => `<a href="#" style="color:var(--gold-d);font-weight:600" onclick="openProduct(null,PRODUCTS[${pidx(p)}]);return false">${esc(p.name)}</a> — ${money(p.price)}`).join('<br>');
  return esc(tr(intro)) + '<br><br>' + items;
}
function localReply(raw) {
  const m = raw.toLowerCase();
  const num = (m.replace(/,/g, '').match(/\d{3,6}/) || [])[0];
  if (KW.budget.test(m) && num && +num >= 500) {
    const r = rate(rjCur) || 1, aed = +num / r;
    const ok = PRODUCTS.filter(p => p.price <= aed).sort((a, b) => b.price - a.price);
    if (ok.length) return suggest(ok, 'Here are some pieces within your budget:');
    return esc(tr(`Our collection starts from ${money(Math.min(...PRODUCTS.map(p => p.price)))}.`));
  }
  for (const [kw, nm, key] of CATS) {
    if (kw.test(m)) {
      const l = PRODUCTS.filter(p => nm.test(p.name)).sort((a, b) => (b.lbl ? 1 : 0) - (a.lbl ? 1 : 0) || a.price - b.price);
      if (l.length) return suggest(l, 'Here are some pieces you may like:');
    }
  }
  if (KW.gold.test(m)) return esc(tr(`Today's Dubai gold rates per gram: 24K AED ${goldRates.g24k || 601.14} · 22K AED ${goldRates.g22k || 551.05} · 21K AED ${goldRates.g21k || 526} · 18K AED ${goldRates.g18k || 450.86}. You can value your own gold in the Gold Calculator section.`));
  if (KW.sell.test(m)) return esc(tr('We buy old gold, broken jewelry and coins at market rates after free XRF purity testing, with home pickup across Dubai. Send the weight and karat on WhatsApp for a quick estimate.'));
  if (KW.delivery.test(m)) return esc(tr('Yes — we offer free delivery across Dubai, and our team can also visit your home for gold buying and viewings. Details are confirmed with you on WhatsApp.'));
  if (KW.appt.test(m)) return esc(tr('You can request a private viewing or a home visit with the Appointment form on this page, or message us on WhatsApp to book a time.'));
  if (KW.pay.test(m)) return esc(tr('We accept cards, Apple Pay, PayPal, cash and bank transfer. Every order is confirmed with you on WhatsApp.'));
  if (KW.ret.test(m)) return esc(tr('Our jewelry is hallmarked and comes with a 7-day returns policy. Please message us on WhatsApp for the exact conditions on your order.'));
  if (KW.hours.test(m)) return esc(tr('We are in the Gold Souk, Deira, Dubai, open daily from 10 AM to 10 PM. Tap Call Us or WhatsApp to reach the team.'));
  if (KW.hello.test(m)) return esc(tr("Hello! Welcome to Ryaan Jewellers 💎 Ask me about bracelets, necklaces, today's gold rate, delivery or your budget and I'll guide you."));
  return esc(tr("I'd love to help with that. For a personal answer, please message our team on WhatsApp +971 54 374 6476 💎")) +
    `<br><br><a href="https://wa.me/971543746476?text=${encodeURIComponent(raw)}" target="_blank" rel="noopener" style="color:var(--gold-d);font-weight:700"><i class="fab fa-whatsapp"></i> ${esc(tr('Chat on WhatsApp'))}</a>`;
}
window.appendMsg = function (text, role) {
  const msgs = $('chatMessages'), d = document.createElement('div');
  d.className = `msg ${role}`;
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  d.innerHTML = `<div class="msg-bubble">${role === 'user' ? esc(text) : text}</div><div class="msg-time">${time}</div>`;
  msgs.appendChild(d); scrollChat();
};
let _chatBusy = false;
window.sendChat = function () {
  const input = $('chatInput'), msg = input.value.trim();
  if (!msg || _chatBusy) return;
  input.value = ''; appendMsg(msg, 'user'); _chatBusy = true;
  const typing = document.createElement('div');
  typing.className = 'msg bot'; typing.id = 'typing';
  typing.innerHTML = '<div class="chat-typing"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>';
  $('chatMessages').appendChild(typing); scrollChat();
  setTimeout(() => { typing.remove(); appendMsg(localReply(msg), 'bot'); _chatBusy = false; }, 650);
};

// ───────────────────────── SCROLL UX ─────────────────────────
function initScrollUX() {
  const bar = $('scrollProg'), nav = document.querySelector('.nav'), btt = $('btt');
  let tick = false;
  const onScroll = () => {
    if (tick) return; tick = true;
    requestAnimationFrame(() => {
      const h = document.documentElement, max = h.scrollHeight - h.clientHeight, y = window.scrollY || h.scrollTop;
      if (bar) bar.style.width = (max > 0 ? Math.min(100, y / max * 100) : 0) + '%';
      if (nav) nav.classList.toggle('scrolled', y > 40);
      if (btt) btt.classList.toggle('show', y > 900);
      tick = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .08, rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll('.sec-head, section.sec .sec-in > *:not(.pgrid):not(.sec-head):not(.filter-bar)').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top > window.innerHeight * .95) { el.classList.add('rv'); io.observe(el); }
    });
    setTimeout(() => document.querySelectorAll('.rv:not(.in)').forEach(e => { const r = e.getBoundingClientRect(); if (r.top < window.innerHeight) e.classList.add('in'); }), 2500);
  }
}

// ───────────────────────── INIT ─────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // theme (migrate legacy key)
  rjPal = PAL[LS.get('rjPalette')] ? LS.get('rjPalette') : 'gold';
  rjMode = LS.get('rjMode') || (LS.get('rjTheme') === 'dark' ? 'dark' : 'light');
  applyTheme();
  // restore cart / wishlist, currency
  restoreStore();
  rjCur = CUR[LS.get('rjCur')] ? LS.get('rjCur') : 'AED';
  if (rate(rjCur) === null) rjCur = 'AED';
  const cl = $('curLabel'); if (cl) cl.textContent = rjCur;
  buildCurList(); loadFx();
  renderProducts(); updateCartUI(); updateWishUI(); refreshPx(); renderRecent(); renderCmpTray();
  // footer year
  const y = new Date().getFullYear();
  const w = document.createTreeWalker($('rjFooter') || document.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) if (/©\s*20\d\d/.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(/20\d\d/, y);
  // language: ?lang=xx beats saved choice
  const q = new URLSearchParams(location.search).get('lang');
  const startLang = LANGS[q] ? q : (LANGS[LS.get('rjLang')] ? LS.get('rjLang') : 'en');
  setLang(startLang);
  // deep link to a product
  const mh = location.hash.match(/^#p=(.+)$/);
  if (mh) { const p = PRODUCTS.find(x => slug(x.name) === mh[1]); if (p) setTimeout(() => openProduct(null, p), 1300); }
  initScrollUX();
});
})();

