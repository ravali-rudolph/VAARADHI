// ============================================================
//  VAARADHI SWEETS — app.js
//  Full frontend logic:
//  1. Shopping Cart
//  2. Search & Filter
//  3. Impulse Buying AI (scrolling, time, revisit, late-night)
//  4. Discount / Urgency Popups
//  5. Countdown Timer
//  6. Toast Notifications
// ============================================================

// ── PRODUCTS DATA ────────────────────────────────────────────
const PRODUCTS = [
  { id: 1,  name: "Kovapuri",         telugu: "కోవాపురి",       price: 400,  unit: "kg",    img: "assests/images/kovapuri.webp",          tag: "Best Seller", category: "milk" },
  { id: 2,  name: "Rasagulla",        telugu: "రసగుల్లా",       price: 580,  unit: "dozen", img: "assests/images/rasagulla.webp",          tag: "",            category: "milk" },
  { id: 3,  name: "Ice Cream Burfi",  telugu: "ఐస్‌క్రీమ్ బర్ఫీ", price: 700, unit: "kg",  img: "assests/images/Ice-Cream-Burfi-1.webp",  tag: "",            category: "burfi" },
  { id: 4,  name: "Soan Papdi",       telugu: "సోన్ పప్డీ",     price: 450,  unit: "kg",    img: "assests/images/soan papidi.jpg",         tag: "",            category: "dry" },
  { id: 5,  name: "Palkova",          telugu: "పాలకోవా",        price: 560,  unit: "kg",    img: "assests/images/palkova.webp",            tag: "",            category: "milk" },
  { id: 6,  name: "Mysore Pak",       telugu: "మైసూర్ పాక్",   price: 560,  unit: "kg",    img: "assests/images/mysore Pak.webp",         tag: "",            category: "burfi" },
  { id: 7,  name: "Apple Pala Kova",  telugu: "ఆపిల్ పాలకోవా", price: 800,  unit: "kg",    img: "assests/images/apple pala kova.webp",   tag: "",            category: "milk" },
  { id: 8,  name: "Kaju Katli",       telugu: "కాజూ కట్లి",    price: 1300, unit: "kg",    img: "assests/images/kaju katli.webp",         tag: "Premium",     category: "dry" },
  { id: 9,  name: "Motichur Laddu",   telugu: "మోతిచూర్ లడ్డు",price: 660,  unit: "kg",    img: "assests/images/Motichur-Laddu.webp",     tag: "",            category: "laddu" },
  { id: 10, name: "Bobbatlu",         telugu: "బొబ్బట్లు",      price: 400,  unit: "dozen", img: "assests/images/bobbatlu.jpg",            tag: "Traditional", category: "traditional" },
  { id: 11, name: "Gavvalu",          telugu: "గవ్వలు",         price: 300,  unit: "kg",    img: "assests/images/gavvalu.webp",            tag: "",            category: "traditional" },
  { id: 12, name: "Mithai",           telugu: "మిఠాయి",         price: 500,  unit: "kg",    img: "assests/images/mithai.jpg",              tag: "",            category: "traditional" },
  { id: 13, name: "Kaja",             telugu: "ఖాజా",           price: 480,  unit: "kg",    img: "assests/images/kajakaja.webp",           tag: "",            category: "traditional" },
  { id: 14, name: "Kommulu",          telugu: "కొమ్ములు",       price: 380,  unit: "kg",    img: "assests/images/kommulu.jpg",             tag: "",            category: "traditional" },
  { id: 15, name: "Ravva Laddu",      telugu: "రవ్వ లడ్డు",    price: 470,  unit: "kg",    img: "assests/images/ravva-laddu.jpg",         tag: "",            category: "laddu" },
  { id: 16, name: "Putharekhulu",     telugu: "పూతరేకులు",      price: 1150, unit: "kg",    img: "assests/images/putharekhulu.jpg",        tag: "Rare",        category: "traditional" },
  { id: 17, name: "Gulab Jamun",      telugu: "గులాబ్ జామున్", price: 600,  unit: "kg",    img: "assests/images/gulab jamun.webp",        tag: "",            category: "milk" },
  { id: 18, name: "Kakinada Kaja",    telugu: "కాకినాడ ఖాజా",  price: 650,  unit: "kg",    img: "assests/images/kakinada kaja.jpg",       tag: "Local Fav",   category: "traditional" },
  { id: 19, name: "Kalakand",         telugu: "కలాకండ్",        price: 760,  unit: "kg",    img: "assests/images/kalakand.jpg",            tag: "",            category: "milk" },
  { id: 20, name: "Dry Fruit Laddo",  telugu: "డ్రై ఫ్రూట్ లడ్డు", price: 1350, unit: "kg", img: "assests/images/dryfruit laddo.webp",  tag: "Premium",     category: "laddu" },
];

// ── 1. CART SYSTEM ───────────────────────────────────────────
let cart = JSON.parse(localStorage.getItem("vaaradhi_cart") || "[]");

function saveCart() {
  localStorage.setItem("vaaradhi_cart", JSON.stringify(cart));
  updateCartIcon();
}

function updateCartIcon() {
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  const badge = document.getElementById("cart-badge");
  if (badge) {
    badge.textContent = total;
    badge.style.display = total > 0 ? "flex" : "none";
  }
}

function addToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(i => i.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  // Track revisit for impulse AI
  trackRevisit(productId);
  saveCart();
  showToast(`${product.name} added to cart! 🛒`);
  runImpulseAI();
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.id !== productId);
  saveCart();
  renderCartPanel();
}

function changeQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart();
  renderCartPanel();
}

function getCartTotal() {
  return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function renderCartPanel() {
  const panel = document.getElementById("cart-panel");
  if (!panel) return;

  if (cart.length === 0) {
    panel.innerHTML = `
      <div style="text-align:center;padding:40px 20px;color:#888;">
        <div style="font-size:48px;margin-bottom:12px;">🍬</div>
        <p>Your cart is empty</p>
        <p style="font-size:13px;margin-top:6px;">Add some Godavari sweets!</p>
      </div>`;
    return;
  }

  let html = `<div style="display:flex;flex-direction:column;gap:12px;">`;
  cart.forEach(item => {
    html += `
      <div style="display:flex;align-items:center;gap:12px;padding:10px;background:#f9f9f6;border-radius:10px;">
        <img src="${item.img}" style="width:56px;height:56px;object-fit:cover;border-radius:8px;" onerror="this.src='assests/images/kovapuri.webp'">
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:600;color:#333;">${item.name}</div>
          <div style="font-size:12px;color:#888;">₹${item.price}/${item.unit}</div>
          <div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
            <button onclick="changeQty(${item.id},-1)" style="width:24px;height:24px;border-radius:50%;border:1px solid #ddd;cursor:pointer;background:white;font-size:16px;line-height:1;display:flex;align-items:center;justify-content:center;">−</button>
            <span style="font-weight:600;min-width:20px;text-align:center;">${item.qty}</span>
            <button onclick="changeQty(${item.id},1)" style="width:24px;height:24px;border-radius:50%;border:1px solid #ddd;cursor:pointer;background:white;font-size:16px;line-height:1;display:flex;align-items:center;justify-content:center;">+</button>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:14px;font-weight:700;color:#c89b3c;">₹${item.price * item.qty}</div>
          <button onclick="removeFromCart(${item.id})" style="margin-top:6px;font-size:11px;color:#e74c3c;border:none;background:none;cursor:pointer;">Remove</button>
        </div>
      </div>`;
  });
  html += `</div>
    <div style="border-top:1px solid #eee;margin-top:16px;padding-top:16px;">
      <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:700;color:#333;margin-bottom:16px;">
        <span>Total</span><span style="color:#708238;">₹${getCartTotal().toLocaleString('en-IN')}</span>
      </div>
      <button onclick="checkout()" style="width:100%;padding:14px;background:#708238;color:white;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;letter-spacing:0.5px;">
        Proceed to Checkout →
      </button>
    </div>`;
  panel.innerHTML = html;
}

function toggleCart() {
  const overlay = document.getElementById("cart-overlay");
  if (!overlay) return;
  overlay.classList.toggle("open");
  renderCartPanel();
}

function checkout() {
  if (cart.length === 0) { showToast("Your cart is empty!"); return; }
  const total = getCartTotal();
  const msg = `Hello! I'd like to order from Vaaradhi Sweets:\n\n` +
    cart.map(i => `• ${i.name} x${i.qty} = ₹${i.price * i.qty}`).join('\n') +
    `\n\nTotal: ₹${total.toLocaleString('en-IN')}\n\nPlease confirm my order. 🙏`;
  window.open(`https://wa.me/919121127164?text=${encodeURIComponent(msg)}`, '_blank');
}

// ── 2. SEARCH & FILTER ───────────────────────────────────────
function initSearch() {
  const bar = document.getElementById("search-bar");
  if (!bar) return;
  bar.addEventListener("input", () => filterProducts(bar.value.trim().toLowerCase()));
}

function filterProducts(query) {
  const cards = document.querySelectorAll(".product-card");
  cards.forEach(card => {
    const name = card.querySelector("h3")?.textContent.toLowerCase() || "";
    card.style.display = (!query || name.includes(query)) ? "block" : "none";
  });
}

// ── 3. IMPULSE BUYING AI ─────────────────────────────────────
const session = {
  startTime: Date.now(),
  revisits: {},
  scrollSpeed: 50,
  lastScrollY: 0,
  lastScrollTime: Date.now(),
};

function trackRevisit(productId) {
  session.revisits[productId] = (session.revisits[productId] || 0) + 1;
}

function trackScroll() {
  const now = Date.now();
  const dy = Math.abs(window.scrollY - session.lastScrollY);
  const dt = (now - session.lastScrollTime) / 1000;
  if (dt > 0) {
    const speed = Math.min(100, dy / dt / 5);
    session.scrollSpeed = Math.round(session.scrollSpeed * 0.8 + speed * 0.2);
  }
  session.lastScrollY = window.scrollY;
  session.lastScrollTime = now;
}

function runImpulseAI() {
  const timeOnSite = Math.round((Date.now() - session.startTime) / 60000);
  const maxRevisit = Math.max(...Object.values(session.revisits), 0);
  const isLateNight = new Date().getHours() >= 22 || new Date().getHours() < 5;
  const cartHasItems = cart.length > 0;

  let score = 0;
  score += Math.round(session.scrollSpeed * 0.2);
  score += Math.min(timeOnSite * 3, 30);
  score += Math.min(maxRevisit * 7, 28);
  if (isLateNight) score += 15;
  if (cartHasItems) score += 18;
  score = Math.min(score, 100);

  if (score >= 70) {
    showScarcityPopup();
  } else if (score >= 45) {
    showDiscountPopup();
  } else if (timeOnSite >= 3 && cart.length === 0) {
    showUrgencyPopup();
  }
}

// ── 4. POPUPS ────────────────────────────────────────────────
let popupShown = {};

function showScarcityPopup() {
  if (popupShown.scarcity) return;
  popupShown.scarcity = true;
  showPopup("🏆 You have great taste!", "These sweets are flying off the shelves. Only limited stock left today!", "Order Now on WhatsApp", () => checkout(), "#708238");
}

function showDiscountPopup() {
  if (popupShown.discount) return;
  popupShown.discount = true;
  showPopup("🎁 Special offer for you!", "Get FREE delivery on orders above ₹1500 today only. Add a little more sweetness!", "Shop More Sweets", () => closePopup(), "#c89b3c");
}

function showUrgencyPopup() {
  if (popupShown.urgency) return;
  popupShown.urgency = true;
  showPopup("⏰ Flash Sale Ending Soon!", "Our Godavari specials are on discount for the next 30 minutes only!", "Grab the Deals", () => closePopup(), "#b30000");
}

function showPopup(title, msg, btnText, btnAction, color) {
  const existing = document.getElementById("vaaradhi-popup");
  if (existing) existing.remove();

  const div = document.createElement("div");
  div.id = "vaaradhi-popup";
  div.style.cssText = `
    position:fixed;bottom:24px;right:24px;width:300px;
    background:white;border-radius:14px;
    box-shadow:0 8px 32px rgba(0,0,0,0.18);
    padding:20px;z-index:9999;
    animation:slideUp 0.4s ease;font-family:Arial,sans-serif;`;

  div.innerHTML = `
    <style>@keyframes slideUp{from{transform:translateY(80px);opacity:0}to{transform:translateY(0);opacity:1}}</style>
    <button onclick="closePopup()" style="position:absolute;top:10px;right:12px;background:none;border:none;font-size:18px;cursor:pointer;color:#999;">✕</button>
    <div style="font-size:16px;font-weight:700;color:#333;margin-bottom:8px;padding-right:20px;">${title}</div>
    <div style="font-size:13px;color:#666;margin-bottom:16px;line-height:1.5;">${msg}</div>
    <button onclick="popupBtn()" style="width:100%;padding:11px;background:${color};color:white;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">${btnText}</button>`;

  window._popupBtnAction = btnAction;
  document.body.appendChild(div);
  setTimeout(closePopup, 12000);
}

function popupBtn() { if (window._popupBtnAction) window._popupBtnAction(); closePopup(); }
function closePopup() { const p = document.getElementById("vaaradhi-popup"); if (p) p.remove(); }

// ── 5. COUNTDOWN TIMER ───────────────────────────────────────
function startCountdown(elementId, seconds) {
  const el = document.getElementById(elementId);
  if (!el) return;
  let remaining = seconds;
  const tick = () => {
    const h = Math.floor(remaining / 3600);
    const m = Math.floor((remaining % 3600) / 60);
    const s = remaining % 60;
    el.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    if (remaining > 0) { remaining--; setTimeout(tick, 1000); }
    else { el.textContent = "EXPIRED"; el.style.color = "#e74c3c"; }
  };
  tick();
}

// ── 6. TOAST NOTIFICATIONS ───────────────────────────────────
function showToast(message) {
  const existing = document.querySelector(".vaaradhi-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "vaaradhi-toast";
  toast.style.cssText = `
    position:fixed;top:20px;right:20px;
    background:#333;color:white;
    padding:12px 20px;border-radius:8px;
    font-size:14px;font-family:Arial,sans-serif;
    z-index:99999;animation:fadeIn 0.3s ease;
    box-shadow:0 4px 16px rgba(0,0,0,0.2);`;
  toast.innerHTML = `<style>@keyframes fadeIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}</style>${message}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ── 7. CART OVERLAY HTML INJECTION ───────────────────────────
function injectCartOverlay() {
  const html = `
    <div id="cart-overlay" style="
      position:fixed;top:0;right:-420px;width:400px;height:100vh;
      background:white;box-shadow:-4px 0 24px rgba(0,0,0,0.12);
      z-index:10000;transition:right 0.35s ease;
      display:flex;flex-direction:column;font-family:Arial,sans-serif;">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #eee;">
        <h2 style="font-size:18px;font-weight:700;color:#333;">🛒 Your Cart</h2>
        <button onclick="toggleCart()" style="background:none;border:none;font-size:22px;cursor:pointer;color:#999;">✕</button>
      </div>
      <div id="cart-panel" style="flex:1;overflow-y:auto;padding:16px 24px;"></div>
    </div>
    <div id="cart-backdrop" onclick="toggleCart()" style="
      display:none;position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:9999;"></div>`;

  const style = document.createElement("style");
  style.textContent = `
    #cart-overlay.open { right: 0 !important; }
    #cart-overlay.open ~ #cart-backdrop { display: block !important; }`;
  document.head.appendChild(style);
  document.body.insertAdjacentHTML("beforeend", html);
}

function injectCartBadge() {
  const bagIcon = document.querySelector(".fa-bag-shopping");
  if (!bagIcon) return;
  bagIcon.parentElement.style.position = "relative";
  bagIcon.parentElement.style.cursor = "pointer";
  bagIcon.parentElement.onclick = toggleCart;

  const badge = document.createElement("span");
  badge.id = "cart-badge";
  badge.style.cssText = `
    display:none;position:absolute;top:-8px;right:-8px;
    background:#b30000;color:white;border-radius:50%;
    width:18px;height:18px;font-size:11px;font-weight:700;
    align-items:center;justify-content:center;`;
  bagIcon.parentElement.appendChild(badge);
}

function injectSearchBar() {
  const header = document.querySelector("header");
  if (!header) return;
  const wrap = document.createElement("div");
  wrap.style.cssText = "position:relative;margin-left:auto;";
  wrap.innerHTML = `
    <input id="search-bar" type="text" placeholder="Search sweets..." style="
      padding:8px 16px 8px 36px;border-radius:20px;
      border:1px solid rgba(255,255,255,0.4);
      background:rgba(255,255,255,0.15);color:white;
      font-size:14px;width:200px;outline:none;"
      oninput="filterProducts(this.value.toLowerCase())">
    <i class="fa-solid fa-magnifying-glass" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,0.7);pointer-events:none;font-size:13px;"></i>`;
  const icons = document.querySelector(".icons");
  if (icons) icons.parentElement.insertBefore(wrap, icons);
}

function injectAddToCartButtons() {
  const cards = document.querySelectorAll(".product-card");
  cards.forEach((card, index) => {
    const product = PRODUCTS[index];
    if (!product) return;

    card.style.cursor = "pointer";
    card.style.position = "relative";

    const btn = document.createElement("button");
    btn.textContent = "+ Add to Cart";
    btn.style.cssText = `
      width:100%;margin-top:10px;padding:9px;
      background:#708238;color:white;border:none;
      border-radius:8px;font-size:13px;font-weight:600;
      cursor:pointer;letter-spacing:0.3px;transition:background 0.2s;`;
    btn.onmouseover = () => btn.style.background = "#5a6b2a";
    btn.onmouseout  = () => btn.style.background = "#708238";
    btn.onclick = (e) => { e.stopPropagation(); addToCart(product.id); };
    card.appendChild(btn);

    card.addEventListener("click", () => {
      trackRevisit(product.id);
      runImpulseAI();
    });
  });
}

// ── 8. INIT ──────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  injectCartOverlay();
  injectCartBadge();
  injectSearchBar();
  injectAddToCartButtons();
  initSearch();
  updateCartIcon();

  window.addEventListener("scroll", trackScroll);

  // Run AI check after 60 seconds of browsing
  setTimeout(runImpulseAI, 60000);
  // Run AI check after 3 minutes
  setTimeout(runImpulseAI, 180000);

  // Start countdown if element exists (add <span id="sale-timer"> anywhere in your HTML)
  startCountdown("sale-timer", 3600);

  console.log("✅ Vaaradhi Sweets JS loaded successfully!");
});