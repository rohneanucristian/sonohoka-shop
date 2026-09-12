// Shared helper for talking to PayPal's REST API from the two PayPal
// functions below. Uses PAYPAL_ENV=live to switch to real payments once
// you're ready — it defaults to PayPal's sandbox (test mode) so nothing is
// charged for real until you deliberately flip that switch.

function apiBase() {
  return process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

async function getAccessToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    throw new Error('Could not authenticate with PayPal — check PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET.');
  }
  const data = await res.json();
  return data.access_token;
}

module.exports = { apiBase, getAccessToken };
