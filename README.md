# Sonohoka website — with working basket, Stripe, and PayPal checkout

## What's in here

- `index.html` — the site itself (single page): hero, the Home Cut haircut
  service (Essex &amp; London, booked via WhatsApp), the Sea Mist product
  spotlight with "Add to basket," a how-to-use ritual, ingredients, and
  testimonials. Dark red/black/white theme throughout.
- `cart.js` — the basket: add/remove/change quantity, opens the basket drawer,
  and talks to the two payment providers below.
- `success.html` / `cancel.html` — pages a customer lands on after paying (or
  cancelling) with Stripe.
- `netlify/functions/` — small server-side functions (they run on Netlify's
  servers, not in the browser):
  - `products.js` — the **real** prices. Nothing the browser sends is trusted;
    every order is priced from this file, so the site can't be tricked into
    charging less than it should.
  - `create-checkout-session.js` — builds a Stripe Checkout session from the
    basket and returns its URL. The browser redirects there; Stripe hosts the
    actual payment page (cards, and Apple Pay automatically where supported —
    no extra setup needed for that part).
  - `paypal-create-order.js` / `paypal-capture-order.js` — same idea for
    PayPal: create the order, then capture payment once the customer approves
    it in the PayPal popup.

## Before this goes live, you need to do three things

### 1. Add your Stripe secret key
In your Netlify site → **Site settings → Environment variables**, add:
- `STRIPE_SECRET_KEY` — from your Stripe dashboard, Developers → API keys.
  Use the one that starts `sk_test_...` first for testing, then swap in the
  `sk_live_...` one when you're ready to take real payments.

Never put this key in `index.html` or any file that goes to the browser —
it only belongs in Netlify's environment variables, which is why it isn't
in this project already.

### 2. Add your PayPal credentials
Still in Environment variables, add:
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_ENV` — set to `sandbox` while testing, `live` when you're ready for
  real payments (it defaults to sandbox if you leave this out).

You'll find the Client ID and Secret in the PayPal Developer Dashboard
(developer.paypal.com) → Apps & Credentials. Use a **Sandbox** app first,
then switch to your **Live** app's credentials when you flip `PAYPAL_ENV`.

### 3. Put your PayPal Client ID into the page itself
Open `index.html`, search for `YOUR_PAYPAL_CLIENT_ID` (near the bottom, in
the PayPal SDK `<script>` tag), and replace it with the same Client ID you
used above. This one is meant to be public — it's how the PayPal button
knows which account to pay into — so it's fine for it to live in the HTML.

## Deploying it

The easiest way, with no command line:

1. Create a free account at [github.com](https://github.com) if you don't
   have one, and create a new repository.
2. Upload every file in this folder to that repository (GitHub's web
   interface lets you drag and drop files in).
3. Create a free account at [netlify.com](https://netlify.com), choose
   **Add new site → Import an existing project**, and connect it to that
   GitHub repository. Netlify will detect `netlify.toml` automatically and
   deploy both the site and the functions.
4. Add the environment variables from steps 1–2 above in Netlify's dashboard,
   then trigger a redeploy (Deploys → Trigger deploy).
5. Test a purchase yourself using Stripe's test card `4242 4242 4242 4242`
   (any future expiry date, any CVC) and a PayPal sandbox buyer account,
   before switching either provider to live mode.
6. Once you're happy, connect your own domain under Site settings → Domain
   management.

## Editing this later

Everything here is plain HTML, CSS, and JavaScript — no build step, no
compiled code — so you (or anyone comfortable with basic code) can open any
file in a text editor and change it directly: colours are CSS variables at
the top of `index.html`'s `<style>` block, copy is plain text in the HTML,
and prices/products are in `cart.js` and `netlify/functions/products.js` (see
above — keep both in sync). Easiest of all: just come back and tell me what
to change, and I'll edit these same files and send you the updated project.

There's also a live preview link (from earlier in this chat) showing the
current design — I can keep updating that at the same URL as we make
changes, so you always have a quick way to look at (and share) how it looks.
Note that the preview is for visuals only; the actual basket/checkout only
works once this project is deployed with its Stripe/PayPal keys, since the
preview link can't run the server-side code that talks to them.

## Things worth knowing

- **Sea Mist is the only product now** — Thermal Shield, Matte Clay, and
  Gloss have all been removed at your request. The range is a single-item
  spotlight for now; adding a second product later just means duplicating
  the product card markup and adding it back to `cart.js` and
  `netlify/functions/products.js`, or asking me to do it.
- **Prices live in two places on purpose**: `cart.js` shows a price so the
  basket looks right instantly, but `netlify/functions/products.js` is what
  actually decides what a customer is charged. If you change a price, update
  both files so they match, or the basket display and the real charge will
  disagree.
- **The "Home Cut" home-visit section** now books entirely via WhatsApp
  (07446 335119) — the button opens a pre-filled chat. It isn't wired into
  the basket/payment flow — let me know if you'd like a deposit or full
  payment collected upfront for haircuts too, and I can add it the same way
  as Sea Mist.
- **This is a live payments integration** — once your Stripe/PayPal accounts
  are in live mode, real money moves. Test thoroughly in sandbox/test mode
  first, and keep an eye on your Stripe and PayPal dashboards after launch.
