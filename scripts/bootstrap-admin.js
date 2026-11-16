const {pool} = require('../src/db');
const {hashPassword} = require('../src/security');
(async () => {
  const {INIT_ADMIN_USERNAME: username, INIT_ADMIN_EMAIL: email, INIT_ADMIN_PASSWORD: password} = process.env;
  if (!username || !email || !password) {
    console.log('[bootstrap] Admin bootstrap skipped: INIT_ADMIN_* not all set.');
    return;
  }
  if (password.length < 12 || password.startsWith('CHANGE_TO_')) throw Error('Please set a strong initial admin password (>=12 characters).');
  const [existing] = await pool.query("SELECT id FROM users WHERE role='super_admin' LIMIT 1");
  if (existing.length) {
    console.log('[bootstrap] Super admin already exists; not overwriting.');
    return;
  }
  await pool.query('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [username, email.toLowerCase(), hashPassword(password), 'super_admin']);
  console.log('[bootstrap] Initial super administrator created. Remove INIT_ADMIN_* secrets from environment.');
})().catch(e => {console.error('[bootstrap] Failed:', e.message); process.exitCode = 1;}).finally(() => pool.end());
