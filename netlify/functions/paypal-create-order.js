// Creates a PayPal order from the customer's basket, pricing it from
// products.js (never from anything the browser sends) so the amount can't
// be tampered with client-side.
const products = require('./products');
const { apiBase, getAccessToken } = require('./paypal-client');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    return { statusCode: 500, body: JSON.stringify({ error: 'PayPal is not configured yet (missing PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET).' }) };
  }

  try {
    const { items } = JSON.parse(event.body || '{}');
    if (!Array.isArray(items) || items.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Basket is empty.' }) };
    }

    let totalPence = 0;
    const paypalItems = items.map(({ id, qty }) => {
      const product = products[id];
      if (!product) throw new Error(`Unknown product: ${id}`);
      const quantity = Math.max(1, Math.min(20, parseInt(qty, 10) || 1));
      totalPence += product.price * quantity;
      return {
        name: product.name,
        quantity: String(quantity),
        unit_amount: { currency_code: 'GBP', value: (product.price / 100).toFixed(2) },
      };
    });

    const totalValue = (totalPence / 100).toFixed(2);
    const accessToken = await getAccessToken();

    const res = await fetch(`${apiBase()}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE', application_context: { shipping_preference: 'GET_FROM_FILE' },
        purchase_units: [{
          amount: {
            currency_code: 'GBP',
            value: totalValue,
            breakdown: { item_total: { currency_code: 'GBP', value: totalValue } },
          },
          items: paypalItems,
        }],
      }),
    });

    const order = await res.json();
    if (!res.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: order.message || 'PayPal rejected the order.' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ id: order.id }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
