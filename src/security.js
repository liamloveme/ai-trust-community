const crypto = require('node:crypto');
const PERMISSIONS = [
  'posts.review', 'posts.remove', 'comments.review', 'comments.remove',
  'reports.review', 'appeals.review', 'users.view', 'users.mute', 'sections.manage', 'stickers.review', 'stickers.remove', 'audit.view'
];
const cookieName = process.env.NODE_ENV === 'production' ? '__Host-trust_forum_session' : 'trust_forum_session';
function hashToken(token) { return crypto.createHash('sha256').update(token).digest('hex'); }
function newToken() { return crypto.randomBytes(32).toString('hex'); }
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}
function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false;
  const [algorithm, salt, hex] = stored.split('$');
  if (algorithm !== 'scrypt' || !salt || !/^[0-9a-f]{128}$/.test(hex || '')) return false;
  const calculated = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(calculated, Buffer.from(hex, 'hex'));
}
function hasSensitiveData(value) {
  return /\b(?:sk-[A-Za-z0-9_-]{12,}|sk-proj-[A-Za-z0-9_-]{8,}|Bearer\s+[A-Za-z0-9_.-]{12,})\b/i.test(value)
    || /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(value)
    || /(?:^|\D)1[3-9]\d{9}(?!\d)/.test(value)
    || /(?:^|\D)\d{17}[0-9Xx](?!\d)/.test(value)
    || /(?:^|\D)(?:\d[ -]?){15,19}(?!\d)/.test(value);
}
module.exports = {PERMISSIONS, cookieName, hashToken, newToken, hashPassword, verifyPassword, hasSensitiveData};
