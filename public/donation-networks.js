/* V2.5 donation currency/network policy. Shared by browser and Node; keep one source of truth. */
(function (root, factory) {
  'use strict';
  const value = factory();
  if (typeof module === 'object' && module.exports) module.exports = value;
  if (typeof window !== 'undefined') window.TrustDonationNetworks = value;
})(this, function () {
  'use strict';
  const rows = {
    BTC: ['Bitcoin'],
    USDT: ['TRC20', 'BEP20', 'ERC20', 'SOL', 'Aptos', 'Plasma'],
    USDC: ['BEP20', 'ERC20', 'SOL', 'Aptos', 'Base']
  };
  for (const value of Object.values(rows)) Object.freeze(value);
  return Object.freeze(rows);
});
