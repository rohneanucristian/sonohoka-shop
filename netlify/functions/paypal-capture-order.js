// Captures (finalizes) a PayPal order the customer has just approved.
const { apiBase, getAccessToken } = require('./paypal-client');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { orderID } = JSON.parse(event.body || '{}');
    if (!orderID) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing orderID.' }) };
    }

    const accessToken = await getAccessToken();
    const res = await fetch(`${apiBase()}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const capture = await res.json();
    if (!res.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: capture.message || 'PayPal could not capture this order.' }) };
    }

    return { statusCode: 200, body: JSON.stringify(capture) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
