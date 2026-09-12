/* Sonohoka basket + checkout logic.
   Prices shown here are for display only — the server functions look up
   the real prices from netlify/functions/products.js before charging anyone,
   so nothing in this file can be tampered with to change what a customer pays. */

const PRODUCTS = {
  'sea-mist': { name: 'Sea Mist', price: 19.00 },
};

const CART_KEY = 'sonohoka_cart';

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  renderCart();
}

function addToCart(id) {
  const cart = getCart();
  cart[id] = (cart[id] || 0) + 1;
  saveCart(cart);
  openBasket();
}

function setQty(id, qty) {
  const cart = getCart();
  if (qty <= 0) {
    delete cart[id];
  } else {
    cart[id] = Math.min(20, qty);
  }
  saveCart(cart);
}

function removeFromCart(id) {
  const cart = getCart();
  delete cart[id];
  saveCart(cart);
}

function cartEntries() {
  const cart = getCart();
  return Object.entries(cart)
    .filter(([id]) => PRODUCTS[id])
    .map(([id, qty]) => ({ id, qty, ...PRODUCTS[id] }));
}

function cartCount() {
  return cartEntries().reduce((sum, item) => sum + item.qty, 0);
}

function cartTotal() {
  return cartEntries().reduce((sum, item) => sum + item.qty * item.price, 0);
}

function money(n) {
  return `£${n.toFixed(2)}`;
}

function renderCart() {
  const countEl = document.getElementById('basket-count');
  const itemsEl = document.getElementById('basket-items');
  const subtotalEl = document.getElementById('basket-subtotal');
  if (!itemsEl) return;

  const entries = cartEntries();
  countEl.textContent = cartCount();

  if (entries.length === 0) {
    itemsEl.innerHTML = '<p class="basket-empty">Your basket is empty.</p>';
  } else {
    itemsEl.innerHTML = entries.map(item => `
      <div class="basket-item">
        <div>
          <p class="basket-item-name">${item.name}</p>
          <p class="basket-item-price">${money(item.price * item.qty)}</p>
          <div class="basket-item-qty">
            <button class="qty-btn" data-action="dec" data-id="${item.id}" aria-label="Decrease quantity">&minus;</button>
            <span>${item.qty}</span>
            <button class="qty-btn" data-action="inc" data-id="${item.id}" aria-label="Increase quantity">&plus;</button>
          </div>
        </div>
        <button class="basket-remove" data-action="remove" data-id="${item.id}">Remove</button>
      </div>
    `).join('');
  }
  subtotalEl.textContent = money(cartTotal());
}

function openBasket() {
  document.getElementById('basket-drawer').classList.add('open');
  document.getElementById('basket-overlay').classList.add('open');
}

function closeBasket() {
  document.getElementById('basket-drawer').classList.remove('open');
  document.getElementById('basket-overlay').classList.remove('open');
}

function setStatus(msg) {
  const el = document.getElementById('checkout-status');
  if (el) el.textContent = msg || '';
}

document.addEventListener('DOMContentLoaded', () => {
  renderCart();

  document.getElementById('basket-open')?.addEventListener('click', openBasket);
  document.getElementById('basket-close')?.addEventListener('click', closeBasket);
  document.getElementById('basket-overlay')?.addEventListener('click', closeBasket);

  document.querySelectorAll('.btn-add').forEach(btn => {
    btn.addEventListener('click', () => addToCart(btn.dataset.id));
  });

  document.getElementById('basket-items')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    const cart = getCart();
    if (btn.dataset.action === 'inc') setQty(id, (cart[id] || 0) + 1);
    if (btn.dataset.action === 'dec') setQty(id, (cart[id] || 0) - 1);
    if (btn.dataset.action === 'remove') removeFromCart(id);
  });

  // ---- Stripe checkout (redirects to Stripe's hosted page — Apple Pay
  // appears automatically there on supported devices, no extra setup) ----
  document.getElementById('checkout-stripe')?.addEventListener('click', async () => {
    const items = cartEntries().map(({ id, qty }) => ({ id, qty }));
    if (items.length === 0) { setStatus('Your basket is empty.'); return; }
    setStatus('Redirecting to secure checkout…');
    try {
      const res = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setStatus(data.error || 'Something went wrong — please try again.');
      }
    } catch (err) {
      setStatus('Could not reach checkout — check your connection and try again.');
    }
  });

  // ---- PayPal checkout ----
  if (window.paypal) {
    paypal.Buttons({
      style: { color: 'black', shape: 'rect', label: 'paypal', height: 45 },
      createOrder: async () => {
        const items = cartEntries().map(({ id, qty }) => ({ id, qty }));
        if (items.length === 0) { setStatus('Your basket is empty.'); throw new Error('empty basket'); }
        const res = await fetch('/.netlify/functions/paypal-create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
        });
        const order = await res.json();
        if (!order.id) throw new Error(order.error || 'Could not create PayPal order');
        return order.id;
      },
      onApprove: async (data) => {
        setStatus('Confirming payment…');
        const res = await fetch('/.netlify/functions/paypal-capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderID: data.orderID }),
        });
        const capture = await res.json();
        if (capture.status === 'COMPLETED') {
          localStorage.removeItem(CART_KEY);
          window.location.href = '/success.html';
        } else {
          setStatus('Payment could not be confirmed — please try again.');
        }
      },
      onError: () => setStatus('PayPal ran into a problem — please try again.'),
    }).render('#paypal-button-container');
  }
});
