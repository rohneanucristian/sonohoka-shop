// The one and only source of truth for prices. The front end sends product
// IDs and quantities; this file decides what they actually cost, so nobody
// can edit the page's HTML/JS to pay less than the real price.
// Prices are in pence (GBP).

module.exports = {
  'sea-mist': { name: 'Sea Mist — Styling Spray', price: 1900 },
};
