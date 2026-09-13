// Creates a Stripe Checkout Session for the customer's basket and hands
// back its URL. The browser then redirects there — Stripe hosts the actual
// payment page, so card details (and Apple Pay, where supported) never
// touch this site directly.
const Stripe = require('stripe');
const products = require('./products');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Stripe is not configured yet (missing STRIPE_SECRET_KEY).' }) };
  }

  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const { items } = JSON.parse(event.body || '{}');

    if (!Array.isArray(items) || items.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Basket is empty.' }) };
    }

    const line_items = items.map(({ id, qty }) => {
      const product = products[id];
      if (!product) throw new Error(`Unknown product: ${id}`);
      const quantity = Math.max(1, Math.min(20, parseInt(qty, 10) || 1));
      return {
        price_data: {
          currency: 'gbp',
          product_data: { name: product.name },
          unit_amount: product.price,
        },
        quantity,
      };
    });

    const siteUrl = process.env.URL || `https://${event.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'], shipping_address_collection: { allowed_countries: ['GB'] }, phone_number_collection: { enabled: true },
      line_items,
      success_url: `${siteUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/cancel.html`,
    });

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
