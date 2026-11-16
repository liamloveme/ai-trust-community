require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const {limiter,redis} = require('./rate');
const multer = require('multer');
const sharp = require('sharp');
const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs/promises');
const {pool} = require('./db');
const {MAX_POST_PUBLIC_IMAGES,MAX_POST_PRIVATE_IMAGES,MAX_COMMENT_IMAGES,MAX_STICKER_BYTES,MAX_PERSONAL_STICKERS,validImageIds,stickerIds,stickerPlaceholderCount,canUseSticker}=require('./media-policy');
const {cleanup} = require('./maintenance');
const {canModerateAuthor, canMuteUser, isMuted, validSectionSlug} = require('./policy');
const {PERMISSIONS, cookieName, hashToken, newToken, hashPassword, verifyPassword, hasSensitiveData} = require('./security');
const {normalizeDonations,signConfig,verifyConfig} = require('./donations');
const {translatePublicPost,localeCode,translationCapabilities} = require('./translate');
const {TOKEN_LIFETIME_MINUTES,validPassword,validResetToken,normalizeEmail,emailFormat,makeResetToken,tokenDigest,publicResetResponse}=require('./password-policy');
const resetMailer=require('./reset-mailer');
const {auditVisibility}=require('./audit-scope');
const {validateBatch,bulkReviewAllowed,bulkTransition}=require('./bulk-policy');

const app = express();
const PORT = Number(process.env.PORT || 3000);
if(process.env.NODE_ENV==='production' && !/^[0-9a-f]{64,}$/i.test(process.env.DONATION_CONFIG_HMAC_KEY||'')) throw new Error('生产环境必须设置随机64位十六进制 DONATION_CONFIG_HMAC_KEY');
const UPLOAD_DIR = path.resolve(__dirname, '../data/uploads');
const STICKER_DIR=path.resolve(__dirname,'../data/stickers');
const COOKIE_SECURE = process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true';
const TRUSTED_ORIGIN = process.env.PUBLIC_ORIGIN || '';
if (process.env.NODE_ENV === 'production' && (!TRUSTED_ORIGIN.startsWith('https://') || !process.env.TURNSTILE_SECRET || !process.env.TURNSTILE_SITEKEY)) {throw new Error('生产环境需要 PUBLIC_ORIGIN=https://... 和 Turnstile SITEKEY/SECRET');}
const CSRF_COOKIE=process.env.NODE_ENV==='production'?'__Host-trust_forum_guest_csrf':'trust_forum_guest_csrf';
const SESS_SECONDS = 60 * 60 * 24 * 7;
// Only trust the actual controlled reverse-proxy chain. Docker binds the app to loopback.
const proxySetting=process.env.TRUST_PROXY;
if(process.env.NODE_ENV==='production'&&(proxySetting===undefined||proxySetting===''))throw Error('生产环境必须明确配置 TRUST_PROXY，直连填0，单层受信反代填1');
if(proxySetting&&proxySetting!=='0'){
  if(/^[1-9]\d?$/.test(proxySetting))app.set('trust proxy',Number(proxySetting));
  else {if(proxySetting==='true')throw Error('TRUST_PROXY 不允许信任所有来源');app.set('trust proxy',proxySetting.split(',').map(x=>x.trim()).filter(Boolean));}
}
app.disable('x-powered-by');
app.use(helmet({referrerPolicy:{policy:'no-referrer'},contentSecurityPolicy: {directives: {defaultSrc: ["'self'"], scriptSrc: ["'self'",'https://challenges.cloudflare.com'], frameSrc: ["'self'",'https://challenges.cloudflare.com'], styleSrc: ["'self'"], imgSrc: ["'self'", 'data:', 'blob:'], connectSrc: ["'self'",'https://challenges.cloudflare.com'], objectSrc: ["'none'"], frameAncestors: ["'none'"]}}}));
app.use(express.json({limit: '96kb'}));
const {utcDates}=require('./admin-utils');
app.use('/api',(req,res,next)=>{const json=res.json;res.json=function(value){return json.call(this,utcDates(value));};res.set('Cache-Control','no-store');next();});
// Health probes do not consume visitor quotas or depend on a logged-in session.
const healthLimit=require('express-rate-limit')({limit:120,windowMs:60000,standardHeaders:'draft-7',legacyHeaders:false,message:{error:'检查请求过于频繁'}});
app.get('/api/live',healthLimit,(req,res)=>res.json({ok:true,service:'trust-forum'}));
async function probe(fn){let timer;try{return await Promise.race([Promise.resolve().then(fn).then(()=>true,()=>false),new Promise(resolve=>{timer=setTimeout(()=>resolve(false),3500);})]);}finally{clearTimeout(timer);}}
app.get('/api/health',healthLimit,async(req,res)=>{
  const [database,redisReady]=await Promise.all([probe(()=>pool.query('SELECT 1')),redis?probe(()=>redis.ping()):Promise.resolve(process.env.NODE_ENV!=='production')]);
  res.status(database&&redisReady?200:503).json({ok:database&&redisReady,service:'trust-forum',checks:{database,redis:redisReady}});
});
const apiLimit=limiter(1200,15*60*1000,{name:'api-global'});
const mediaLimit=limiter(2400,15*60*1000,{name:'api-media'});
app.use('/api',(req,res,next)=>(/^\/(?:media\/|stickers\/[1-9]\d*\/image$)/.test(req.path)?mediaLimit:apiLimit)(req,res,next));
app.use((req,res,next)=>{req.auditRequestId=crypto.randomUUID();next();});
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const fail = (message, status = 400) => { const e = new Error(message); e.status = status; throw e; };
function asId(value) { const s = String(value || ''); if (!/^[1-9]\d{0,17}$/.test(s)) fail('无效的 ID'); return s; }
function str(value, max = 500) {return typeof value === 'string' ? value.trim().slice(0, max + 1) : '';}
function bounded(value, min, max, label) { const s = str(value, max); if (s.length < min || s.length > max) fail(`${label}需为 ${min}-${max} 个字符`); return s; }
function inSet(value, options, label) {if (!options.includes(value)) fail(`${label}不合法`); return value;}
function cookies(req) {const cookie = req.headers.cookie || ''; const out = {}; cookie.split(';').forEach(pair => {const i = pair.indexOf('='); if(i > 0) out[pair.slice(0,i).trim()] = pair.slice(i+1).trim();}); return out;}
function setSessionCookie(res, token) {res.cookie(cookieName, token, {httpOnly: true, secure: COOKIE_SECURE, sameSite: 'lax', path: '/', maxAge: SESS_SECONDS * 1000});}
function clearSessionCookie(res) {res.clearCookie(cookieName, {httpOnly: true, secure: COOKIE_SECURE, sameSite: 'lax', path: '/'});}
function safeEquals(a,b) {if(typeof a!=='string'||typeof b!=='string'||!/^([0-9a-f]{64})$/.test(a)||!/^([0-9a-f]{64})$/.test(b))return false;return crypto.timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));}
async function verifyTurnstile(req) {
  if(!process.env.TURNSTILE_SECRET) return;
  const token = str(req.body?.turnstileToken,2048);
  if(!token) fail('请完成人机验证',403);
  let data;
  try { const ctrl = new AbortController(); const timer = setTimeout(()=>ctrl.abort(),5000);
    try {const r=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',
      headers:{'content-type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({secret:process.env.TURNSTILE_SECRET,response:token,remoteip:req.ip}),signal:ctrl.signal});data=await r.json();}
    finally {clearTimeout(timer);}
  } catch {fail('人机验证服务暂不可用，请稍后重试',503);}
  if(!data?.success) fail('人机验证未通过，请刷新后重试',403);
}
function publicUser(user) {return {id: String(user.id), username:user.username, role:user.role, state:user.state, mute_until:user.mute_until ? (String(user.mute_until).includes('T')?String(user.mute_until):String(user.mute_until).replace(' ','T')+'Z') : null, permissions: user.permissions || []};}
const {toAuditDetails, auditSummary, maskClientIp, parseMuteDate}=require('./admin-utils');
async function logAction(req, action, type, id, details = {}, connection=pool) {
  const cleaned=toAuditDetails(details);
  const targetId=String(id);
  const targetName=String(cleaned.target_name||cleaned.title||cleaned.username||'').slice(0,80);
  await connection.query(`INSERT INTO audit_logs
    (actor_id,actor_name,actor_role,action,target_type,target_id,target_name,summary,request_ip,request_id,details)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`,[
    req.user.id,req.user.username,req.user.role,action,type,targetId,targetName,
    auditSummary(action,cleaned).slice(0,500),maskClientIp(req.ip),req.auditRequestId,JSON.stringify(cleaned)
  ]);
}
async function transaction(work){
  const conn=await pool.getConnection();
  try{await conn.beginTransaction();const value=await work(conn);await conn.commit();return value;}
  catch(err){await conn.rollback().catch(()=>{});throw err;}finally{conn.release();}
}
async function unlinkSticker(filename){await fs.unlink(path.join(STICKER_DIR,filename)).catch(e=>{if(e.code!=='ENOENT')console.error('[sticker cleanup]',e.message);});}
app.use('/api', wrap(async(req, res, next) => {
  const token = cookies(req)[cookieName];
  if (token && /^[0-9a-f]{64}$/.test(token)) {
    const [rows] = await pool.query(`SELECT u.id,u.username,u.email,u.role,u.state,u.mute_until,s.id session_id,s.csrf_token
      FROM sessions s JOIN users u ON u.id=s.user_id
      WHERE s.token_hash=? AND s.expires_at > UTC_TIMESTAMP() LIMIT 1`, [hashToken(token)]);
    if(rows[0] && rows[0].state === 'active') {
      const u = rows[0];
      const [perms] = u.role==='moderator' ? await pool.query('SELECT permission_name FROM admin_permissions WHERE user_id=?',[u.id]) : [[]];
      req.user = {...u, permissions: perms.map(p=>p.permission_name)};
    }
  }
  if (!['GET','HEAD','OPTIONS'].includes(req.method)) {
    const origin=req.get('origin');
    if(origin && origin !== (TRUSTED_ORIGIN || `${req.protocol}://${req.get('host')}`)) fail('来源校验失败',403);
    if(req.get('sec-fetch-site') === 'cross-site') fail('跨站请求已拒绝',403);
    const expected = req.user?.csrf_token || cookies(req)[CSRF_COOKIE];
    if(!safeEquals(req.get('x-csrf-token'),expected)) fail('安全校验失败，请刷新后重试',403);
  }
  next();
}));
const mustLogin = (req, res, next) => req.user ? next() : next(Object.assign(new Error('请先登录'), {status: 401}));
function permitted(req, permission) {return req.user && (req.user.role === 'super_admin' || (req.user.role === 'moderator' && req.user.permissions.includes(permission)));}
const requirePermission = permission => (req,res,next) => permitted(req,permission) ? next() : next(Object.assign(new Error('没有该管理权限'),{status:403}));
const mustSpeak = (req,res,next) => { if(isMuted(req.user?.mute_until)) return next(Object.assign(new Error('账号正在禁言，请联系管理员或等待期限结束'),{status:403})); next(); };
const requireSuper = (req,res,next) => req.user && req.user.role === 'super_admin' ? next() : next(Object.assign(new Error('仅超级管理员可以操作'),{status:403}));
async function issueSession(user, res) {
  const token = newToken(), csrf = newToken();
  await pool.query('INSERT INTO sessions (user_id,token_hash,csrf_token,expires_at) VALUES (?,?,?,DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 DAY))', [user.id,hashToken(token),csrf]);
  setSessionCookie(res,token);
  res.json({user:publicUser(user),csrf});
}
app.get('/api/auth/me', (req,res)=> {
  let guestCsrf=cookies(req)[CSRF_COOKIE];
  if(!guestCsrf || !/^[a-f0-9]{64}$/.test(guestCsrf)){guestCsrf=newToken();res.cookie(CSRF_COOKIE,guestCsrf,{httpOnly:true,secure:COOKIE_SECURE,sameSite:'lax',path:'/',maxAge:24*3600*1000});}
  res.set('Cache-Control','no-store');
  res.json({user:req.user?publicUser(req.user):null,csrf:req.user?.csrf_token||guestCsrf});
});
app.post('/api/auth/register', limiter(8, 60*60*1000, {name:'register',email:true}), wrap(async(req,res)=>{
  if(req.user) fail('请先退出当前账号后再注册',409);
  await verifyTurnstile(req);
  const username = bounded(req.body.username,3,24,'昵称');
  const email = bounded(req.body.email,5,190,'邮箱').toLowerCase();
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || /[<>"'\\]/.test(username)) fail('昵称或邮箱格式不正确');
  if (password.length < 10 || password.length > 128) fail('密码长度需为 10-128 位');
  try {
    const [result] = await pool.query('INSERT INTO users (username,email,password_hash) VALUES (?,?,?)',[username,email,hashPassword(password)]);
    await issueSession({id:result.insertId,username,role:'member',state:'active',permissions:[]},res);
  } catch(err) {if(err.code === 'ER_DUP_ENTRY') fail('昵称或邮箱已被使用',409); throw err;}
}));
app.post('/api/auth/login', limiter(12, 15*60*1000, {name:'login',email:true}), wrap(async(req,res)=>{
  await verifyTurnstile(req);
  const email = str(req.body.email,190).toLowerCase();
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if(password.length > 128) fail('登录失败',401);
  const [rows] = await pool.query('SELECT * FROM users WHERE email=? LIMIT 1',[email]);
  const user = rows[0];
  if (!user || !verifyPassword(password,user.password_hash)) fail('邮箱或密码错误',401);
  if(user.state !== 'active') fail('账号不可用，请联系管理员',403);
  if (req.user) await pool.query('DELETE FROM sessions WHERE id=?',[req.user.session_id]);
  // Rotate to a fresh opaque session after successful authentication.
  const [perms] = user.role==='moderator' ? await pool.query('SELECT permission_name FROM admin_permissions WHERE user_id=?',[user.id]) : [[]];
  await issueSession({...user,permissions:perms.map(p=>p.permission_name)},res);
}));
// V2.7: password recovery links are single-use, 20 minutes, stored only as SHA-256.
// The response NEVER confirms account existence or leaks the reset token.
app.post('/api/auth/password/forgot',limiter(5,60*60*1000,{name:'forgot-password',email:true}),wrap(async(req,res)=>{
  await verifyTurnstile(req);
  if(!resetMailer.configured())fail('邮件重置暂不可用，请联系网站管理员配置邮件服务',503);
  const email=normalizeEmail(req.body?.email);
  if(!emailFormat(email))fail('请填写有效的邮箱地址');
  const [rows]=await pool.query("SELECT id,email FROM users WHERE email=? AND state='active' LIMIT 1",[email]);
  if(rows[0]){
    const token=makeResetToken();
    const conn=await pool.getConnection();
    try{await conn.beginTransaction();
      await conn.query('DELETE FROM password_reset_tokens WHERE user_id=?',[rows[0].id]);
      await conn.query('INSERT INTO password_reset_tokens (user_id,token_hash,expires_at) VALUES (?,?,DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? MINUTE))',[rows[0].id,tokenDigest(token),TOKEN_LIFETIME_MINUTES]);
      await conn.commit();
    }catch(e){await conn.rollback();throw e;}finally{conn.release();}
    try {await resetMailer.sendPasswordReset(rows[0].email,token);}
    catch(e){console.error('[password-reset] 邮件发送失败，已清理令牌');await pool.query('DELETE FROM password_reset_tokens WHERE token_hash=?',[tokenDigest(token)]);}
  }
  res.set('Cache-Control','no-store');res.json(publicResetResponse());
}));
app.post('/api/auth/password/reset',limiter(8,60*60*1000,{name:'password-reset'}),wrap(async(req,res)=>{
  const token=req.body?.token,password=req.body?.newPassword;
  if(!validResetToken(token))fail('重置链接无效或已失效',400);
  if(!validPassword(password))fail('新密码长度需为10-128位',400);
  const conn=await pool.getConnection();
  try{await conn.beginTransaction();
    const [rows]=await conn.query(`SELECT t.id,t.user_id,u.state FROM password_reset_tokens t
      JOIN users u ON u.id=t.user_id WHERE t.token_hash=? AND t.expires_at>UTC_TIMESTAMP() FOR UPDATE`,[tokenDigest(token)]);
    if(!rows.length||rows[0].state!=='active')fail('重置链接已过期或已使用',400);
    await conn.query('UPDATE users SET password_hash=? WHERE id=?',[hashPassword(password),rows[0].user_id]);
    await conn.query('DELETE FROM password_reset_tokens WHERE user_id=?',[rows[0].user_id]);
    await conn.query('DELETE FROM sessions WHERE user_id=?',[rows[0].user_id]);
    await conn.commit();
  }catch(e){await conn.rollback();throw e;}finally{conn.release();}
  clearSessionCookie(res);res.set('Cache-Control','no-store');res.json({ok:true,message:'密码已重设，请使用新密码登录。'});
}));
app.post('/api/auth/password/change',mustLogin,limiter(8,60*60*1000,{name:'password-change',user:true}),wrap(async(req,res)=>{
  const {currentPassword,newPassword}=req.body||{};
  if(typeof currentPassword!=='string'||currentPassword.length>128||!validPassword(newPassword))fail('请输入当前密码及长度为10-128位的新密码');
  if(currentPassword===newPassword)fail('新密码不能与原密码相同');
  const conn=await pool.getConnection();
  try{await conn.beginTransaction();
    const [[u]]=await conn.query('SELECT password_hash FROM users WHERE id=? FOR UPDATE',[req.user.id]);
    if(!u||!verifyPassword(currentPassword,u.password_hash))fail('当前密码错误',403);
    await conn.query('UPDATE users SET password_hash=? WHERE id=?',[hashPassword(newPassword),req.user.id]);
    await conn.query('DELETE FROM password_reset_tokens WHERE user_id=?',[req.user.id]);
    await conn.query('DELETE FROM sessions WHERE user_id=? AND id<>?',[req.user.id,req.user.session_id]);
    await logAction(req,'account.password_changed','user',req.user.id,{target_name:req.user.username},conn);
    await conn.commit();
  }catch(e){await conn.rollback();throw e;}finally{conn.release();}
  res.set('Cache-Control','no-store');res.json({ok:true,message:'密码修改成功，其他设备已退出登录。'});
}));

app.post('/api/auth/logout', mustLogin, wrap(async(req,res)=>{
  await pool.query('DELETE FROM sessions WHERE id=?',[req.user.session_id]);
  clearSessionCookie(res); res.json({ok:true});
}));

// Donation address configuration: signed against tampering in MySQL, updated only by super-admin.
async function loadDonationSettings(conn=pool,locked=false){
  const [rows]=await conn.query(`SELECT setting_value,revision,integrity_mac FROM site_settings WHERE setting_key='donations' ${locked?'FOR UPDATE':''}`);
  if(!rows.length)return {revision:0,items:[]};
  const r=rows[0];
  let items;try{items=typeof r.setting_value==='string'?JSON.parse(r.setting_value):r.setting_value;items=normalizeDonations(items,{allowLegacy:true});}catch{const e=new Error('捐赠配置完整性校验失败，已停止展示');e.status=503;throw e;}
  if(!verifyConfig(Number(r.revision),items,r.integrity_mac)){
    console.error('[security] donation config integrity mismatch');
    const e=new Error('捐赠配置完整性校验失败，已停止展示');e.status=503;throw e;
  }
  return {revision:Number(r.revision),items};
}
app.get('/api/site/donations',wrap(async(req,res)=>{
  res.set('Cache-Control','no-store, max-age=0');
  res.json(await loadDonationSettings());
}));
app.get('/api/admin/donations',mustLogin,requireSuper,wrap(async(req,res)=>{
  res.set('Cache-Control','no-store, max-age=0');res.json(await loadDonationSettings());
}));
app.post('/api/admin/donations',mustLogin,requireSuper,limiter(6,3600*1000,{name:'donation-config',user:true}),wrap(async(req,res)=>{
  const password=typeof req.body?.password==='string'?req.body.password:'';
  if(!password||password.length>128)fail('请输入当前超级管理员密码',403);
  const [[user]]=await pool.query("SELECT password_hash FROM users WHERE id=? AND role=\'super_admin\' AND state=\'active\'",[req.user.id]);
  if(!user||!verifyPassword(password,user.password_hash))fail('管理员密码验证失败',403);
  if(!Number.isSafeInteger(req.body?.revision)||req.body.revision<0)fail('配置版本号无效');
  const items=normalizeDonations(req.body?.items);
  const conn=await pool.getConnection();
  let locked=false;
  try{
    // Serialize all editors, including the initial insert when no settings row exists.
    const [[acquired]]=await conn.query("SELECT GET_LOCK('trust_forum_donations_config', 5) acquired");
    if(Number(acquired.acquired)!==1)fail('配置正被其他管理员编辑，请稍后重试',409);
    locked=true;
    await conn.beginTransaction();
    const current=await loadDonationSettings(conn,true);
    if(current.revision!==req.body.revision)fail('配置已被其他会话更新，请刷新后重试',409);
    const revision=current.revision+1;
    const mac=signConfig(revision,items);
    await conn.query(`INSERT INTO site_settings (setting_key,setting_value,revision,integrity_mac,updated_by)
      VALUES ('donations',?,?,?,?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value),revision=VALUES(revision),integrity_mac=VALUES(integrity_mac),updated_by=VALUES(updated_by)`,
      [JSON.stringify(items),revision,mac,req.user.id]);
    await logAction(req,'donations.update','site_setting','donations',{
      previousRevision:current.revision,revision,assets_networks:items.map(x=>`${x.asset}/${x.network}`)
    },conn);
    await conn.commit();res.set('Cache-Control','no-store').json({ok:true,revision,items});
  }catch(err){await conn.rollback();throw err;}finally{
    if(locked)try{await conn.query("DO RELEASE_LOCK('trust_forum_donations_config')");}catch(e){console.error('[donations] failed to release advisory lock',e.message);}
    conn.release();
  }
}));
app.get('/api/stats', wrap(async(req,res)=>{
  const [[a]] = await pool.query("SELECT COUNT(*) posts, SUM(type='exposure') exposures FROM posts WHERE status='published'");
  const [[b]] = await pool.query('SELECT COUNT(*) members FROM users');
  res.json({posts:Number(a.posts||0),exposures:Number(a.exposures||0),members:Number(b.members||0)});
}));
const postSelect = `SELECT p.id,p.type,p.category,p.title,p.body,p.anonymous,p.status,p.views,p.created_at,p.moderation_note,
  CASE WHEN p.anonymous=1 THEN 'member' ELSE u.role END author_role,
  CASE WHEN p.anonymous=1 THEN '匿名用户' ELSE u.username END author,
  (SELECT COUNT(*) FROM comments c WHERE c.post_id=p.id AND c.status='published') comments_count,
  (SELECT COUNT(*) FROM post_likes l WHERE l.post_id=p.id) likes_count,
  (SELECT COUNT(*) FROM attachments a WHERE a.post_id=p.id AND a.purpose='public') images_count
  FROM posts p JOIN users u ON u.id=p.author_id`;
app.get('/api/posts', wrap(async(req,res)=>{
  const type = ['discussion','exposure'].includes(req.query.type) ? req.query.type : null;
  const category = /^[a-z0-9-]{1,64}$/.test(String(req.query.category||'')) ? req.query.category : null;
  const sort = req.query.sort === 'hot' ? 'hot' : 'new';
  const page = Math.min(100,Math.max(1,Number.parseInt(req.query.page,10)||1));
  const q = str(req.query.q,70);
  if(q.length>70)fail('搜索关键词不得超过70字',400);
  const args = [], terms = ["p.status='published'"];
  if(type){terms.push('p.type=?');args.push(type);}
  if(category){terms.push('p.category=?');args.push(category);}
  if(q){
    for(const word of q.split(/\s+/).filter(Boolean).slice(0,8)) {
      terms.push('(LOCATE(?,p.title)>0 OR LOCATE(?,p.body)>0 OR (p.anonymous=0 AND LOCATE(?,u.username)>0) OR LOCATE(?,p.category)>0)');
      args.push(word,word,word,word);
    }
  }
  const sql = `${postSelect} WHERE ${terms.join(' AND ')} ORDER BY ${sort==='new'?'p.created_at DESC':'likes_count DESC, p.created_at DESC'} LIMIT 15 OFFSET ?`;
  const [rows] = await pool.query(sql,[...args,(page-1)*15]);
  res.json({items:rows.map(r=>({...r,id:String(r.id),body:r.body.slice(0,260)})),page,hasMore:rows.length===15});
}));
app.get('/api/posts/mine', mustLogin, wrap(async(req,res)=>{
  const [rows] = await pool.query(`${postSelect} WHERE p.author_id=? ORDER BY p.created_at DESC LIMIT 50`,[req.user.id]);
  res.json({items:rows.map(r=>({...r,id:String(r.id)}))});
}));
app.get('/api/posts/:id', wrap(async(req,res)=>{
  const id = asId(req.params.id);
  const [rows] = await pool.query(`${postSelect} WHERE p.id=? LIMIT 1`,[id]);
  if(!rows.length) fail('帖子不存在',404);
  const [[ownership]] = await pool.query('SELECT p.author_id,u.role author_role FROM posts p JOIN users u ON u.id=p.author_id WHERE p.id=?',[id]);
  const allowed = rows[0].status==='published' || (req.user && (String(ownership.author_id)===String(req.user.id) || ((permitted(req,'posts.review') || permitted(req,'posts.remove')) && canModerateAuthor(req.user,ownership.author_role))));
  if(!allowed) fail('帖子不存在或尚未公开',404);
  if(rows[0].status === 'published') await pool.query('UPDATE posts SET views=views+1 WHERE id=?',[id]);
  const [attachments] = await pool.query('SELECT id,purpose FROM attachments WHERE post_id=? ORDER BY id',[id]);
  const [comments] = await pool.query(`SELECT c.id,c.body,c.status,c.created_at,u.username author,u.role author_role FROM comments c JOIN users u ON u.id=c.author_id
    WHERE c.post_id=? AND (c.status='published' OR c.author_id=? OR (? AND (u.role='member' OR ?))) ORDER BY c.created_at ASC LIMIT 200`,
    [id,req.user?.id||0,permitted(req,'comments.review')?1:0,req.user?.role==='super_admin'?1:0]);
  const [commentImages] = await pool.query('SELECT id,comment_id FROM attachments WHERE comment_id IN (SELECT id FROM comments WHERE post_id=?) AND purpose=\'public\'', [id]);
  res.json({post:{...rows[0],id:String(rows[0].id)},attachments:attachments.filter(a=>a.purpose==='public' || (req.user && (String(ownership.author_id)===String(req.user.id)||(permitted(req,'posts.review') && canModerateAuthor(req.user,ownership.author_role))))).map(a=>({id:String(a.id),purpose:a.purpose,url:`/api/media/${a.id}`})),comments:comments.map(c=>({...c,id:String(c.id), images:commentImages.filter(img=>String(img.comment_id)===String(c.id)).map(img=>({id:String(img.id),url:`/api/media/${img.id}`}))}))});
}));

// No HTML or secret evidence is forwarded. Only published public title/body to private LibreTranslate.
app.get('/api/translation/languages',limiter(60,15*60*1000,{name:'translation-capabilities'}),wrap(async(req,res)=>{
  try{res.json(await translationCapabilities());}catch{res.json({available:false,locales:[],languages:[]});}
}));
app.post('/api/posts/:id/translate', limiter(12,15*60*1000,{name:'post-translate',user:true}), wrap(async(req,res)=>{
  const id=asId(req.params.id), target=str(req.body?.target,16);
  if(!localeCode(target))fail('目标语言不受支持',422);
  const [rows]=await pool.query("SELECT id,title,body,updated_at FROM posts WHERE id=? AND status='published' LIMIT 1",[id]);
  if(!rows.length)fail('只能翻译已公开帖子',404);
  const result=await translatePublicPost(rows[0],target);
  res.set('Cache-Control','private, no-store').json(result);
}));
const upload = multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024,files:1,fields:1,parts:2,fieldSize:32,fieldNameSize:32,headerPairs:64,fieldArrayIndexLimit:10},fileFilter:(req,file,cb)=>{
  if(!['image/jpeg','image/png','image/webp'].includes(file.mimetype)) return cb(Object.assign(new Error('仅支持 JPG/PNG/WEBP 图片，不支持视频及其他文件'),{status:400}));
  cb(null,true);
}});
app.post('/api/upload', mustLogin, mustSpeak, limiter(100,60*60*1000,{name:'upload',user:true}), upload.single('image'), wrap(async(req,res)=>{
  if(!req.file) fail('请选择图片');
  const [[unattached]] = await pool.query('SELECT COUNT(*) AS n FROM attachments WHERE uploader_id=? AND post_id IS NULL AND comment_id IS NULL',[req.user.id]);
  if(Number(unattached.n)>=45) fail('未绑定帖子图片已达上限，请先完成发帖或等待过期清理',429);
  const purpose = inSet(req.body.purpose,['public','private'],'附件用途');
  let metadata;
  try {metadata = await sharp(req.file.buffer,{limitInputPixels:24e6}).metadata();}
  catch{fail('文件不是有效图片');}
  if(!['jpeg','png','webp'].includes(metadata.format) || (metadata.pages||1)>1) fail('仅允许静态 JPG/PNG/WEBP 图片');
  const name = crypto.randomUUID()+'.webp';
  await fs.mkdir(UPLOAD_DIR,{recursive:true});
  await sharp(req.file.buffer,{limitInputPixels:24e6}).rotate().resize({width:1800,height:1800,fit:'inside',withoutEnlargement:true}).webp({quality:82}).toFile(path.join(UPLOAD_DIR,name));
  const stats = await fs.stat(path.join(UPLOAD_DIR,name));
  const [result] = await pool.query('INSERT INTO attachments (uploader_id,purpose,filename,size_bytes) VALUES (?,?,?,?)',[req.user.id,purpose,name,stats.size]);
  res.status(201).json({id:String(result.insertId),url:`/api/media/${result.insertId}`,purpose});
}));
app.get('/api/media/:id', wrap(async(req,res)=>{
  const id = asId(req.params.id);
  const [rows] = await pool.query(`SELECT a.id,a.uploader_id,a.purpose,a.filename,a.post_id,a.comment_id,p.status,c.status comment_status,cp.status comment_post_status,pu.role post_author_role,cu.role comment_author_role
    FROM attachments a LEFT JOIN posts p ON p.id=a.post_id
    LEFT JOIN comments c ON c.id=a.comment_id LEFT JOIN posts cp ON cp.id=c.post_id
    LEFT JOIN users pu ON pu.id=p.author_id LEFT JOIN users cu ON cu.id=c.author_id WHERE a.id=? LIMIT 1`,[id]);
  if(!rows.length) fail('附件不存在',404);
  const a = rows[0], owner = req.user && String(a.uploader_id)===String(req.user.id);
  const publicAccess = a.purpose==='public' && ((a.post_id && a.status==='published') || (a.comment_id && a.comment_status==='published' && a.comment_post_status==='published'));
  const staffAccess = (a.post_id && permitted(req,'posts.review') && canModerateAuthor(req.user,a.post_author_role)) ||
    (a.comment_id && (permitted(req,'comments.review')||permitted(req,'comments.remove')) && canModerateAuthor(req.user,a.comment_author_role));
  if(!(publicAccess||owner||staffAccess)) fail('附件无访问权限',403);
  // No caching: takedowns must not be undermined by public CDN caches.
  res.set('Cache-Control','private, no-store');
  res.set('X-Content-Type-Options','nosniff');
  res.type('image/webp').sendFile(path.join(UPLOAD_DIR,a.filename));
}));
// Only own, enabled sticker IDs can be embedded; record usage to grant image access ONLY for published content.
async function validateOwnedStickers(conn,body,ownerId){
  const ids=stickerIds(body);
  if(ids.length>20 || stickerPlaceholderCount(body)>20)fail('单篇内容最多使用20个自定义表情');
  if(!ids.length)return ids;
  const [rows]=await conn.query(`SELECT id,owner_id,status FROM custom_stickers WHERE id IN (${ids.map(()=>'?').join(',')}) FOR UPDATE`,ids);
  if(rows.length!==ids.length || rows.some(x=>!canUseSticker(x,ownerId)))fail('包含无效、已被禁用或非本人的自定义表情',403);
  return ids;
}
async function recordStickerUses(conn,ids,kind,targetId){
  for(const id of ids)await conn.query('INSERT INTO sticker_usages (sticker_id,post_id,comment_id) VALUES (?,?,?)', [id,kind==='post'?targetId:null,kind==='comment'?targetId:null]);
}
const stickerUpload=multer({storage:multer.memoryStorage(),limits:{fileSize:MAX_STICKER_BYTES,files:1,fields:0,parts:1},fileFilter:(req,file,cb)=>{
 if(!['image/png','image/jpeg','image/webp'].includes(file.mimetype))return cb(Object.assign(new Error('自定义表情仅支持静态 JPG/PNG/WebP'),{status:400}));cb(null,true);
}});
app.get('/api/stickers/mine',mustLogin,wrap(async(req,res)=>{
 const [rows]=await pool.query("SELECT id,label,status,created_at FROM custom_stickers WHERE owner_id=? AND status<>'deleted' ORDER BY id DESC LIMIT 200",[req.user.id]);
 res.set('Cache-Control','private,no-store');res.json({items:rows.map(x=>({...x,id:String(x.id),url:`/api/stickers/${x.id}/image`}))});
}));
app.post('/api/stickers/upload',mustLogin,mustSpeak,limiter(35,60*60*1000,{name:'sticker-upload',user:true}),stickerUpload.single('image'),wrap(async(req,res)=>{
 if(!req.file)fail('请选择表情图片');
 const [[row]]=await pool.query("SELECT COUNT(*) n FROM custom_stickers WHERE owner_id=? AND status<>'deleted'",[req.user.id]);
 if(Number(row.n)>=MAX_PERSONAL_STICKERS)fail('个人表情库最多保存200张，请先删除旧表情',409);
 let meta;try{meta=await sharp(req.file.buffer,{limitInputPixels:4e6}).metadata();}catch{fail('不是有效的图片文件');}
 if(!['jpeg','png','webp'].includes(meta.format)||(meta.pages||1)>1)fail('只允许静态 JPG/PNG/WebP 图片');
 const filename=crypto.randomUUID()+'.webp';await fs.mkdir(STICKER_DIR,{recursive:true});
 const file=path.join(STICKER_DIR,filename);
 try{
  const out=await sharp(req.file.buffer,{limitInputPixels:4e6}).rotate().resize(320,320,{fit:'inside',withoutEnlargement:true}).webp({quality:80}).toBuffer();
  if(out.length>MAX_STICKER_BYTES)fail('处理后表情超过1 MB，请使用更小的图片');
  await fs.writeFile(file,out,{flag:'wx'});
  const saved=await transaction(async conn=>{
    await conn.query('SELECT id FROM users WHERE id=? FOR UPDATE',[req.user.id]);
    const [[count]]=await conn.query("SELECT COUNT(*) n FROM custom_stickers WHERE owner_id=? AND status<>'deleted'",[req.user.id]);
    if(Number(count.n)>=MAX_PERSONAL_STICKERS)fail('个人表情库最多保存200张，请先删除旧表情',409);
    const [result]=await conn.query('INSERT INTO custom_stickers(owner_id,filename,bytes,label) VALUES (?,?,?,?)',[req.user.id,filename,out.length,'自定义表情']);
    await logAction(req,'sticker.upload','sticker',result.insertId,{owner_id:String(req.user.id),bytes:out.length},conn);return result;
  });
  res.status(201).json({id:String(saved.insertId),url:`/api/stickers/${saved.insertId}/image`,status:'active'});
 }catch(e){await fs.unlink(file).catch(()=>{});throw e;}
}));
app.get('/api/stickers/:id/image',wrap(async(req,res)=>{
 const id=asId(req.params.id);
 const [[s]]=await pool.query('SELECT id,owner_id,filename,status FROM custom_stickers WHERE id=?',[id]);
 if(!s || s.status==='deleted')fail('表情不存在或已删除',404);
 const owner=req.user&&String(s.owner_id)===String(req.user.id);
 const [[account]]=await pool.query('SELECT role FROM users WHERE id=?',[s.owner_id]);
 const staff=(permitted(req,'stickers.review')||permitted(req,'stickers.remove')) && canModerateAuthor(req.user,account?.role);
 if(s.status==='disabled' && !owner && !staff)fail('该表情已被禁用',404);
 let visible=owner||staff;
 if(!visible){
  const [[r]]=await pool.query(`SELECT EXISTS(
     SELECT 1 FROM sticker_usages su JOIN posts p ON p.id=su.post_id WHERE su.sticker_id=? AND p.status='published'
     UNION ALL SELECT 1 FROM sticker_usages su JOIN comments c ON c.id=su.comment_id JOIN posts p ON p.id=c.post_id WHERE su.sticker_id=? AND c.status='published' AND p.status='published'
   ) AS visible`,[id,id]);visible=!!r.visible;
 }
 if(!visible)fail('无权查看私人表情库中的图片',403);
 res.set('Cache-Control','private,no-store');res.set('X-Content-Type-Options','nosniff');res.type('image/webp').sendFile(path.join(STICKER_DIR,s.filename));
}));
app.post('/api/stickers/:id/delete',mustLogin,wrap(async(req,res)=>{
  const id=asId(req.params.id);
  const filename=await transaction(async conn=>{
    const [[s]]=await conn.query('SELECT owner_id,filename,status FROM custom_stickers WHERE id=? FOR UPDATE',[id]);
    if(!s||String(s.owner_id)!==String(req.user.id))fail('没有权限操作该表情',403);
    if(s.status==='deleted')fail('表情已删除',404);
    await conn.query("UPDATE custom_stickers SET status='deleted' WHERE id=?",[id]);
    await logAction(req,'sticker.owner_delete','sticker',id,{},conn);return s.filename;
  });await unlinkSticker(filename);res.json({ok:true});
}));
app.get('/api/admin/stickers',mustLogin,wrap(async(req,res)=>{
 if(!permitted(req,'stickers.review')&&!permitted(req,'stickers.remove'))fail('没有表情包审核权限',403);
 const [rows]=await pool.query("SELECT s.id,s.owner_id,s.label,s.status,s.created_at,u.username owner,u.role owner_role FROM custom_stickers s JOIN users u ON u.id=s.owner_id WHERE s.status<>'deleted' AND (? = 'super_admin' OR u.role='member') ORDER BY s.id DESC LIMIT 200",[req.user.role]);
 res.set('Cache-Control','private,no-store');res.json({items:rows.map(x=>({...x,id:String(x.id),owner_id:String(x.owner_id),url:`/api/stickers/${x.id}/image`}))});
}));
app.post('/api/admin/stickers/:id/status',mustLogin,requirePermission('stickers.remove'),wrap(async(req,res)=>{
  const id=asId(req.params.id),status=inSet(req.body.status,['active','disabled','deleted'],'表情处理方式');
  const filename=await transaction(async conn=>{
    const [[s]]=await conn.query('SELECT s.id,s.owner_id,s.filename,s.status,u.role owner_role FROM custom_stickers s JOIN users u ON u.id=s.owner_id WHERE s.id=? FOR UPDATE',[id]);
    if(!s||s.status==='deleted')fail('表情不存在',404);
    if(!canModerateAuthor(req.user,s.owner_role))fail('普通管理员不能处理其他管理员的表情',403);
    await conn.query('UPDATE custom_stickers SET status=? WHERE id=?',[status,id]);
    await logAction(req,'sticker.'+status,'sticker',id,{owner_id:String(s.owner_id),owner_role:s.owner_role,before_status:s.status,status},conn);return s.filename;
  });if(status==='deleted')await unlinkSticker(filename);res.json({ok:true,status});
}));
app.post('/api/posts', mustLogin, mustSpeak, limiter(12,60*60*1000,{name:'post',user:true}), wrap(async(req,res)=>{
  const type = inSet(req.body.type,['discussion','exposure'],'帖子类型');
  const category = bounded(req.body.category,2,64,'分区');
  const [[section]] = await pool.query('SELECT kind FROM forum_sections WHERE slug=? AND enabled=1',[category]);
  if(!section || section.kind==='page') fail('该栏目不存在、已关闭或不允许发帖');
  if(section.kind==='exposure' && type!=='exposure') fail('此板块仅允许风险线索帖子');
  const title = bounded(req.body.title,6,140,'标题');
  const body = bounded(req.body.body,15,6000,'正文');
  const anonymous = !!req.body.anonymous;
  const publicIds = Array.isArray(req.body.publicImages) ? req.body.publicImages.map(asId) : [];
  const privateIds = Array.isArray(req.body.privateEvidence) ? req.body.privateEvidence.map(asId) : [];
  const all = [...publicIds,...privateIds];
  if(!validImageIds(publicIds,MAX_POST_PUBLIC_IMAGES)||!validImageIds(privateIds,MAX_POST_PRIVATE_IMAGES)||new Set(all).size!==all.length) fail('公开图片最多20张、私密证据最多20张，且不能重复');
  if(hasSensitiveData(`${title} ${body}`)) fail('正文疑似含密钥、联系方式或其他敏感信息，请脱敏后再发布；完整证据可作为保密证据上传');
  const status = type==='exposure' || all.length ? 'pending' : 'published';
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if(all.length){
      const placeholders = all.map(()=>'?').join(',');
      const [a] = await connection.query(`SELECT id,purpose,post_id,comment_id,uploader_id FROM attachments WHERE id IN (${placeholders}) FOR UPDATE`,all);
      if(a.length!==all.length || a.some(x => (x.post_id || x.comment_id) || String(x.uploader_id)!==String(req.user.id) || (publicIds.includes(String(x.id)) ? x.purpose!=='public' : x.purpose!=='private')))
        fail('附件无效或已被其他帖子使用');
    }
    const sid=await validateOwnedStickers(connection,body,req.user.id);
    const [result] = await connection.query('INSERT INTO posts (author_id,type,category,title,body,anonymous,status) VALUES (?,?,?,?,?,?,?)',[req.user.id,type,category,title,body,anonymous?1:0,status]);
    if(all.length) await connection.query(`UPDATE attachments SET post_id=? WHERE id IN (${all.map(()=>'?').join(',')})`,[result.insertId,...all]);
    await recordStickerUses(connection,sid,'post',result.insertId);
    await connection.commit();
    res.status(201).json({id:String(result.insertId),status,message:status==='pending'?'提交成功，等待审核':'发布成功'});
  } catch(err) {await connection.rollback();throw err;} finally{connection.release();}
}));
app.post('/api/posts/:id/like', mustLogin, limiter(90,15*60*1000,{name:'like',user:true}), wrap(async(req,res)=>{
  const id = asId(req.params.id);
  const [[post]] = await pool.query('SELECT status FROM posts WHERE id=?',[id]);
  if(post?.status!=='published') fail('帖子不存在',404);
  const [result] = await pool.query('INSERT IGNORE INTO post_likes (user_id,post_id) VALUES (?,?)',[req.user.id,id]);
  if(!result.affectedRows) await pool.query('DELETE FROM post_likes WHERE user_id=? AND post_id=?',[req.user.id,id]);
  const [[count]] = await pool.query('SELECT COUNT(*) total FROM post_likes WHERE post_id=?',[id]);
  res.json({liked:!!result.affectedRows,likes:Number(count.total)});
}));
app.post('/api/posts/:id/comments', mustLogin, mustSpeak, limiter(40,60*60*1000,{name:'comment',user:true}), wrap(async(req,res)=>{
  const id = asId(req.params.id);
  const body = str(req.body.body,1600);
  const images = Array.isArray(req.body.images) ? req.body.images.map(asId) : [];
  if(!validImageIds(images,MAX_COMMENT_IMAGES)) fail('评论最多支持20张图片且不能重复');
  if(body.length>1600 || (body.length<2 && images.length===0)) fail('请输入至少 2 个字或上传图片');
  const [[post]] = await pool.query('SELECT type,status FROM posts WHERE id=?',[id]);
  if(post?.status!=='published') fail('帖子不存在或未公开',404);
  if(hasSensitiveData(body)) fail('评论可能包含个人敏感联系方式，请先脱敏');
  const status = (post.type==='exposure'||images.length) ? 'pending' : 'published';
  const conn=await pool.getConnection();
  try {
    await conn.beginTransaction();
    if(images.length) {
      const [attachments]=await conn.query(`SELECT id FROM attachments WHERE id IN (${images.map(()=>'?').join(',')}) AND uploader_id=? AND purpose='public' AND post_id IS NULL AND comment_id IS NULL FOR UPDATE`,[...images,req.user.id]);
      if(attachments.length!==images.length) fail('评论图片不存在、无权使用或已经绑定');
    }
    const sid=await validateOwnedStickers(conn,body,req.user.id);
    const [result]=await conn.query('INSERT INTO comments (post_id,author_id,body,status) VALUES (?,?,?,?)',[id,req.user.id,body,status]);
    if(images.length)await conn.query(`UPDATE attachments SET comment_id=? WHERE id IN (${images.map(()=>'?').join(',')})`,[result.insertId,...images]);
    await recordStickerUses(conn,sid,'comment',result.insertId);
    await conn.commit();res.status(201).json({id:String(result.insertId),status});
  }catch(err){await conn.rollback();throw err;}finally{conn.release();}
}));
app.post('/api/reports', mustLogin, limiter(10,60*60*1000,{name:'report',user:true}), wrap(async(req,res)=>{
  const targetType = inSet(req.body.targetType,['post','comment'],'举报对象');
  const targetId = asId(req.body.targetId);
  const reason = inSet(req.body.reason,['fraud','privacy','false_info','abuse','other'],'举报原因');
  const details = bounded(req.body.details,10,2000,'举报说明');
  const table = targetType==='post'?'posts':'comments';
  const [[target]] = await pool.query(`SELECT id FROM ${table} WHERE id=? AND status='published'`,[targetId]);
  if(!target) fail('举报对象不存在',404);
  const [result] = await pool.query('INSERT INTO reports (reporter_id,target_type,target_id,reason,details) VALUES (?,?,?,?,?)',[req.user.id,targetType,targetId,reason,details]);
  res.status(201).json({id:String(result.insertId),message:'已收到举报，将由管理人员核查'});
}));
app.post('/api/appeals', mustLogin, limiter(5,60*60*1000,{name:'appeal',user:true}), wrap(async(req,res)=>{
  const postId = asId(req.body.postId), reason = bounded(req.body.reason,10,2000,'申诉说明');
  const [[post]] = await pool.query('SELECT id FROM posts WHERE id=?',[postId]);
  if(!post) fail('帖子不存在',404);
  const [result] = await pool.query('INSERT INTO appeals (post_id,applicant_id,reason) VALUES (?,?,?)',[postId,req.user.id,reason]);
  res.status(201).json({id:String(result.insertId),message:'申诉已提交'});
}));
app.get('/api/admin/posts', mustLogin, requirePermission('posts.remove'), wrap(async(req,res)=>{
  const [rows]=await pool.query(`${postSelect} WHERE p.status='published' ${req.user.role==='super_admin'?'':"AND u.role='member'"} ORDER BY p.created_at DESC LIMIT 100`);
  res.json({items:rows.map(x=>({...x,id:String(x.id)}))});
}));
app.get('/api/admin/comments/published', mustLogin, requirePermission('comments.remove'), wrap(async(req,res)=>{
  const [rows]=await pool.query(`SELECT c.id,c.post_id,c.body,c.created_at,u.username author,u.role author_role,p.title post_title FROM comments c
    JOIN users u ON u.id=c.author_id JOIN posts p ON p.id=c.post_id
    WHERE c.status='published' ${req.user.role==='super_admin'?'':"AND u.role='member'"}
    ORDER BY c.created_at DESC LIMIT 100`);
  res.json({items:rows.map(x=>({...x,id:String(x.id),post_id:String(x.post_id)}))});
}));
app.get('/api/admin/queue', mustLogin, requirePermission('posts.review'), wrap(async(req,res)=>{
  const [rows] = await pool.query(`${postSelect} WHERE p.status='pending' ${req.user.role==='super_admin'?'':"AND u.role='member'"} ORDER BY p.created_at ASC LIMIT 100`);
  res.json({items:rows.map(p=>({...p,id:String(p.id)}))});
}));
app.get('/api/admin/comments/:id/context',mustLogin,wrap(async(req,res)=>{
  if(!permitted(req,'comments.review')&&!permitted(req,'comments.remove'))fail('没有评论管理权限',403);
  const id=asId(req.params.id);
  const [[c]]=await pool.query('SELECT c.id,c.post_id,c.body,c.status,c.created_at,u.username author,u.role author_role,p.title post_title,p.body post_body,p.status post_status,pu.role post_author_role FROM comments c JOIN users u ON u.id=c.author_id JOIN posts p ON p.id=c.post_id JOIN users pu ON pu.id=p.author_id WHERE c.id=?',[id]);
  if(!c)fail('评论不存在',404);
  if(!canModerateAuthor(req.user,c.author_role))fail('无权查看其他管理员的评论',403);
  const [images]=await pool.query("SELECT id FROM attachments WHERE comment_id=? AND purpose='public' ORDER BY id",[id]);
  const parentVisible=c.post_status==='published'||(canModerateAuthor(req.user,c.post_author_role)&&(permitted(req,'posts.review')||permitted(req,'posts.remove')));
  res.json({comment:{id:String(c.id),body:c.body,status:c.status,author:c.author,created_at:c.created_at,images:images.map(x=>({id:String(x.id),url:'/api/media/'+x.id}))},post:{id:String(c.post_id),title:parentVisible?c.post_title:'',body:parentVisible?c.post_body:'',status:c.post_status,restricted:!parentVisible}});
}));
app.get('/api/admin/comments', mustLogin, requirePermission('comments.review'), wrap(async(req,res)=>{
  const [rows] = await pool.query(`SELECT c.id,c.post_id,c.body,c.created_at,u.username author,p.title post_title FROM comments c JOIN users u ON u.id=c.author_id JOIN posts p ON p.id=c.post_id WHERE c.status='pending' ${req.user.role==='super_admin'?'':"AND u.role='member'"} ORDER BY c.created_at ASC LIMIT 100`);
  res.json({items:rows.map(r=>({...r,id:String(r.id),post_id:String(r.post_id)}))});
}));
app.post('/api/admin/posts/:id/review',mustLogin,wrap(async(req,res)=>{
  const id=asId(req.params.id),decision=inSet(req.body.decision,['published','rejected','removed'],'审核结果'),note=str(req.body.note,500);
  if(note.length>500||(decision!=='published'&&note.length<5))fail('下架或驳回帖子须填写5-500字处理依据');
  if(!permitted(req,decision==='removed'?'posts.remove':'posts.review'))fail('没有对应管理权限',403);
  await transaction(async conn=>{
    const [[post]]=await conn.query('SELECT p.status,p.title,u.role author_role FROM posts p JOIN users u ON u.id=p.author_id WHERE p.id=? FOR UPDATE',[id]);
    if(!post)fail('帖子不存在',404);
    if(!canModerateAuthor(req.user,post.author_role))fail('普通管理员不能处理其他管理员的帖子',403);
    if(decision==='published'&&!['pending','rejected'].includes(post.status))fail('只能发布待审或驳回的帖子',409);
    if(decision==='rejected'&&post.status!=='pending'||decision==='removed'&&post.status!=='published')fail('帖子状态已改变，请刷新列表',409);
    await conn.query('UPDATE posts SET status=?,moderation_note=?,reviewed_by=?,reviewed_at=UTC_TIMESTAMP() WHERE id=?',[decision,note||null,req.user.id,id]);
    await logAction(req,'post.'+decision,'post',id,{note,before_status:post.status,status:decision,target_name:post.title},conn);
  });res.json({ok:true});
}));
app.post('/api/admin/comments/:id/review',mustLogin,wrap(async(req,res)=>{
  const id=asId(req.params.id),decision=inSet(req.body.decision,['published','hidden'],'评论审核结果'),note=str(req.body.note,500);
  if(note.length>500||(decision==='hidden'&&note.length<5))fail('隐藏评论须填写5-500字处理依据');
  if(!permitted(req,decision==='hidden'?'comments.remove':'comments.review'))fail('没有对应管理权限',403);
  await transaction(async conn=>{
    const [[c]]=await conn.query('SELECT c.status,c.body,c.post_id,u.role,u.username FROM comments c JOIN users u ON u.id=c.author_id WHERE c.id=? FOR UPDATE',[id]);
    if(!c)fail('评论不存在',404);
    if(!canModerateAuthor(req.user,c.role))fail('普通管理员不能处理其他管理员的评论',403);
    if(!bulkTransition('comments',decision,c.status))fail('评论状态已改变，请刷新列表',409);
    await conn.query('UPDATE comments SET status=? WHERE id=?',[decision,id]);
    await logAction(req,'comment.'+decision,'comment',id,{before_status:c.status,status:decision,note,target_name:c.username,post_id:String(c.post_id),excerpt:c.body.slice(0,100)},conn);
  });res.json({ok:true});
}));
app.get('/api/admin/reports', mustLogin, requirePermission('reports.review'), wrap(async(req,res)=>{
  const [rows] = await pool.query("SELECT r.*,u.username reporter FROM reports r JOIN users u ON u.id=r.reporter_id WHERE r.status='pending' ORDER BY r.created_at ASC LIMIT 100");
  res.json({items:rows.map(r=>({...r,id:String(r.id),target_id:String(r.target_id)}))});
}));
app.post('/api/admin/reports/:id/review',mustLogin,requirePermission('reports.review'),wrap(async(req,res)=>{
  const id=asId(req.params.id),status=inSet(req.body.status,['resolved','dismissed'],'处理结果'),note=bounded(req.body.note,5,500,'处理依据');
  await transaction(async conn=>{
    const [[r]]=await conn.query('SELECT target_type,target_id,reason,status FROM reports WHERE id=? FOR UPDATE',[id]);
    if(!r||r.status!=='pending')fail('举报不存在或已处理',409);
    const authorSql=r.target_type==='post'?'SELECT u.role FROM posts p JOIN users u ON u.id=p.author_id WHERE p.id=? FOR UPDATE':'SELECT u.role FROM comments c JOIN users u ON u.id=c.author_id WHERE c.id=? FOR UPDATE';
    const [[author]]=await conn.query(authorSql,[r.target_id]);
    if(author&&!canModerateAuthor(req.user,author.role))fail('不能处理有关其他管理员的举报',403);
    await conn.query("UPDATE reports SET status=?,handling_note=?,handled_by=?,handled_at=UTC_TIMESTAMP() WHERE id=? AND status='pending'",[status,note,req.user.id,id]);
    await logAction(req,'report.'+status,'report',id,{status,note,related_type:r.target_type,related_id:String(r.target_id),report_reason:r.reason},conn);
  });res.json({ok:true});
}));
app.get('/api/admin/appeals', mustLogin, requirePermission('appeals.review'), wrap(async(req,res)=>{
  const [rows] = await pool.query("SELECT a.*,u.username applicant,p.title post_title FROM appeals a JOIN users u ON u.id=a.applicant_id JOIN posts p ON p.id=a.post_id WHERE a.status='pending' ORDER BY a.created_at ASC LIMIT 100");
  res.json({items:rows.map(r=>({...r,id:String(r.id),post_id:String(r.post_id)}))});
}));
app.post('/api/admin/appeals/:id/review',mustLogin,requirePermission('appeals.review'),wrap(async(req,res)=>{
  const id=asId(req.params.id),status=inSet(req.body.status,['accepted','denied'],'申诉处理结果'),note=bounded(req.body.note,5,500,'处理依据');
  await transaction(async conn=>{
    const [[a]]=await conn.query("SELECT a.*,u.role author_role FROM appeals a JOIN posts p ON p.id=a.post_id JOIN users u ON u.id=p.author_id WHERE a.id=? AND a.status='pending' FOR UPDATE",[id]);
    if(!a)fail('申诉不存在或已处理',409);
    if(!canModerateAuthor(req.user,a.author_role))fail('不能处理有关其他管理员的申诉',403);
    await conn.query('UPDATE appeals SET status=?,handling_note=?,handled_by=?,handled_at=UTC_TIMESTAMP() WHERE id=?',[status,note,req.user.id,id]);
    if(status==='accepted')await conn.query("UPDATE posts SET status='pending',moderation_note='申诉通过，重新审核' WHERE id=? AND status IN ('removed','rejected')",[a.post_id]);
    await logAction(req,'appeal.'+status,'appeal',id,{note,status,post_id:String(a.post_id),applicant_id:String(a.applicant_id)},conn);
  });res.json({ok:true});
}));
// V3.1: bounded bulk moderation, per-item transaction + permission check + audit.
// No unchecked SQL IN (...) UPDATE is permitted; all records are reloaded under row locks.
app.post('/api/admin/batch',mustLogin,limiter(8,15*60*1000,{name:'admin-batch',user:true}),wrap(async(req,res)=>{
  const {resource,action,ids,note,reviewedEvidence,permission}=validateBatch(req.body);
  if(!permitted(req,permission))fail('没有执行此批量操作的权限',403);
  const batchId=crypto.randomUUID();
  const results=[];
  for(const id of ids){
    const conn=await pool.getConnection();
    let stickerToRemove=null;
    try{
      await conn.beginTransaction();
      let item,args=[id];
      if(resource==='posts'){
        [[item]]=await conn.query(`SELECT p.id,p.title,p.body,p.type,p.status,u.role author_role,
          (SELECT COUNT(*) FROM attachments a WHERE a.post_id=p.id) attachments_count
          FROM posts p JOIN users u ON u.id=p.author_id WHERE p.id=? FOR UPDATE`,args);
      }else if(resource==='comments'){
        [[item]]=await conn.query(`SELECT c.id,c.status,c.body,c.post_id,u.role author_role,p.type post_type,
          (SELECT COUNT(*) FROM attachments a WHERE a.comment_id=c.id) attachments_count
          FROM comments c JOIN users u ON u.id=c.author_id JOIN posts p ON p.id=c.post_id WHERE c.id=? FOR UPDATE`,args);
      }else if(resource==='reports'){
        [[item]]=await conn.query('SELECT id,status,target_type,target_id,reason FROM reports WHERE id=? FOR UPDATE',args);
      }else if(resource==='appeals'){
        [[item]]=await conn.query(`SELECT a.id,a.status,a.post_id,a.applicant_id,u.role author_role
          FROM appeals a JOIN posts p ON p.id=a.post_id JOIN users u ON u.id=p.author_id
          WHERE a.id=? FOR UPDATE`,args);
      }else if(resource==='users'){
        [[item]]=await conn.query('SELECT id,username,role,mute_until FROM users WHERE id=? FOR UPDATE',args);
      }else if(resource==='stickers'){
        [[item]]=await conn.query(`SELECT s.id,s.status,s.filename,s.owner_id,u.role author_role
          FROM custom_stickers s JOIN users u ON u.id=s.owner_id WHERE s.id=? FOR UPDATE`,args);
      }else if(resource==='sections'){
        [[item]]=await conn.query('SELECT id,title,slug,enabled FROM forum_sections WHERE id=? FOR UPDATE',args);
      }
      if(!item)fail('记录不存在或已被删除',404);
      if(!bulkTransition(resource,action,resource==='sections'?!!item.enabled:item.status))fail('记录状态已改变或操作不适用',409);
      if(!bulkReviewAllowed(resource,action,item,reviewedEvidence))fail('审核举报曝光/图片前，必须确认已逐项核对文字、附件与证据',409);
      if(['posts','comments','appeals','stickers'].includes(resource)&&!canModerateAuthor(req.user,item.author_role))fail('不能处理其他管理员的内容',403);
      if(resource==='users'&&!canMuteUser(req.user,item.role,id))fail('不能禁言自身或无权处理该身份',403);
      if(resource==='reports'){
        const authorSql=item.target_type==='post'
          ?'SELECT u.role FROM posts p JOIN users u ON u.id=p.author_id WHERE p.id=?'
          :'SELECT u.role FROM comments c JOIN users u ON u.id=c.author_id WHERE c.id=?';
        const [[author]]=await conn.query(authorSql,[item.target_id]);
        if(author&&!canModerateAuthor(req.user,author.role))fail('不能处理有关其他管理员的举报',403);
      }
      const details={batch_id:batchId,note,before_status:item.status||null,status:action,
        target_name:item.title||item.username||item.slug||'',post_id:item.post_id?String(item.post_id):null,
        reviewed_evidence:reviewedEvidence&&action==='published',selected_count:ids.length};
      if(resource==='posts'){
        await conn.query('UPDATE posts SET status=?,moderation_note=?,reviewed_by=?,reviewed_at=UTC_TIMESTAMP() WHERE id=?',[action,note,req.user.id,id]);
      }else if(resource==='comments'){
        await conn.query('UPDATE comments SET status=? WHERE id=?',[action,id]);
        details.excerpt=item.body.slice(0,100);
      }else if(resource==='reports'){
        await conn.query('UPDATE reports SET status=?,handling_note=?,handled_by=?,handled_at=UTC_TIMESTAMP() WHERE id=?',[action,note,req.user.id,id]);
        details.related_type=item.target_type;details.related_id=String(item.target_id);
      }else if(resource==='appeals'){
        await conn.query('UPDATE appeals SET status=?,handling_note=?,handled_by=?,handled_at=UTC_TIMESTAMP() WHERE id=?',[action,note,req.user.id,id]);
        if(action==='accepted')await conn.query("UPDATE posts SET status='pending',moderation_note='申诉获受理，需重新人工核查' WHERE id=? AND status IN ('rejected','removed')",[item.post_id]);
      }else if(resource==='users'){
        const until=action==='mute24h'?new Date(Date.now()+86400000).toISOString().slice(0,19).replace('T',' '):null;
        await conn.query('UPDATE users SET mute_until=?,mute_reason=? WHERE id=?',[until,action==='mute24h'?note:null,id]);
        details.until=until;details.before_until=item.mute_until;
      }else if(resource==='stickers'){
        await conn.query('UPDATE custom_stickers SET status=? WHERE id=?',[action,id]);
        if(action==='deleted')stickerToRemove=item.filename;
      }else if(resource==='sections'){
        await conn.query('UPDATE forum_sections SET enabled=? WHERE id=?',[action==='enabled'?1:0,id]);
        details.before_status=item.enabled?'enabled':'disabled';
      }
      const auditAction=resource==='users'?(action==='mute24h'?'user.mute':'user.unmute'):
        resource==='sections'?'section.update':resource==='stickers'?'sticker.'+action:
        ({posts:'post',comments:'comment',reports:'report',appeals:'appeal'}[resource])+'.'+action;
      await logAction(req,auditAction,resource.slice(0,-1)==='sticker'?'sticker':resource.slice(0,-1),id,details,conn);
      await conn.commit();
      results.push({id,ok:true});
      if(stickerToRemove)await fs.unlink(path.join(STICKER_DIR,stickerToRemove)).catch(e=>{
        if(e.code!=='ENOENT')console.error('[batch] sticker cleanup',e.message);
      });
    }catch(err){await conn.rollback().catch(()=>{});results.push({id,ok:false,error:err.status>=400&&err.status<500?err.message:'处理失败，请联系管理员检查服务器日志'});}
    finally{conn.release();}
  }
  const succeeded=results.filter(x=>x.ok).length;
  res.json({batchId,resource,action,requested:ids.length,succeeded,failed:ids.length-succeeded,results});
}));

app.get('/api/admin/users', mustLogin, wrap(async(req,res)=>{
  if(!(req.user.role==='super_admin'||permitted(req,'users.view')||permitted(req,'users.mute'))) fail('没有查看用户的权限',403);
  const q=str(req.query.q,80), role=str(req.query.role,20);
  if(q.length>80)fail('查询词不能超过80个字符');
  if(role&&!['member','moderator','super_admin'].includes(role))fail('角色过滤无效');
  const conditions=[],params=[];
  if(q){
    const escaped=q.replace(/[\\%_]/g,c=>'\\'+c);
    if(/^[1-9]\d{0,17}$/.test(q)){
      conditions.push('(id=? OR username LIKE ?'+(req.user.role==='super_admin'?' OR email LIKE ?':'')+')');
      params.push(q,`%${escaped}%`);if(req.user.role==='super_admin')params.push(`%${escaped}%`);
    }else{
      conditions.push('(username LIKE ?'+(req.user.role==='super_admin'?' OR email LIKE ?':'')+')');
      params.push(`%${escaped}%`);if(req.user.role==='super_admin')params.push(`%${escaped}%`);
    }
  }
  if(role){conditions.push('role=?');params.push(role);}
  const sql='SELECT id,username,email,role,state,mute_until,mute_reason,created_at FROM users '+
    (conditions.length?'WHERE '+conditions.join(' AND '):'')+' ORDER BY id DESC LIMIT 200';
  const [rows] = await pool.query(sql,params);
  const [perms] = await pool.query('SELECT user_id,permission_name FROM admin_permissions WHERE user_id IN ('+
    (rows.length?rows.map(()=>'?').join(','):'NULL')+')',rows.map(x=>x.id));
  res.set('Cache-Control','private,no-store');
  res.json({items:rows.map(u=>({...u,email:req.user.role==='super_admin'?u.email:null,id:String(u.id),permissions:perms.filter(p=>String(p.user_id)===String(u.id)).map(p=>p.permission_name)})),availablePermissions:PERMISSIONS});
}));
app.post('/api/admin/users/:id/permissions', mustLogin, requireSuper, wrap(async(req,res)=>{
  const id=asId(req.params.id), role=inSet(req.body.role,['member','moderator'],'用户角色');
  const requested = Array.isArray(req.body.permissions)?req.body.permissions:[];
  if(requested.some(p=>!PERMISSIONS.includes(p)) || new Set(requested).size!==requested.length) fail('包含非法或重复的权限');
  if(String(req.user.id)===id) fail('不能修改自己的权限');
  if(role==='member' && requested.length) fail('普通用户不能保留管理权限');
  if(role==='moderator' && !requested.length) fail('任命管理员时至少需要一项管理权限');
  const conn=await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[target]] = await conn.query('SELECT id,username,role FROM users WHERE id=? FOR UPDATE',[id]);
    if(!target) fail('用户不存在',404);
    if(target.role==='super_admin') fail('不能更改超级管理员权限',403);
    const [previousPermissions]=await conn.query('SELECT permission_name FROM admin_permissions WHERE user_id=? FOR UPDATE',[id]);
    await conn.query('UPDATE users SET role=? WHERE id=?',[role,id]);
    await conn.query('DELETE FROM admin_permissions WHERE user_id=?',[id]);
    if(role==='moderator') for(const permission of requested) await conn.query('INSERT INTO admin_permissions (user_id,permission_name,granted_by) VALUES (?,?,?)',[id,permission,req.user.id]);
    // Invalidate all sessions so permissions are reflected at next login.
    await conn.query('DELETE FROM sessions WHERE user_id=?',[id]);
    await logAction(req,'user.permissions_changed','user',id,{before_role:target.role,role,before_permissions:previousPermissions.map(x=>x.permission_name),permissions:role==='moderator'?requested:[],target_name:target.username},conn);
    await conn.commit();res.json({ok:true});
  }catch(e){await conn.rollback();throw e;}finally{conn.release();}
}));
app.get('/api/admin/audit', mustLogin, (req,res,next)=>['moderator','super_admin'].includes(req.user.role)?next():fail('仅管理员可查看操作日志',403), wrap(async(req,res)=>{
  const q=str(req.query.q,80), page=Math.max(1,Math.min(50,Number.parseInt(req.query.page,10)||1));
  if(q.length>80)fail('审计查询过长');
  // Restrict audit visibility before searching or paging, not after returning rows.
  const {where,params}=auditVisibility(req.user.role,req.user.id);
  if(q){where.push('(a.action LIKE ? OR a.actor_name LIKE ? OR a.target_name LIKE ? OR a.target_id=?)');
    const escaped=q.replace(/[\\%_]/g,c=>'\\'+c);
    params.push(`%${escaped}%`,`%${escaped}%`,`%${escaped}%`,/^\d+$/.test(q)?q:'0');}
  const sql=`SELECT a.id,a.actor_id,a.actor_name,a.actor_role,a.action,a.target_type,a.target_id,a.target_name,
    a.summary,a.details,a.request_ip,a.request_id,a.created_at,u.username actor
    FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_id
    ${where.length?'WHERE '+where.join(' AND '):''} ORDER BY a.id DESC LIMIT 50 OFFSET ?`;
  const [rows]=await pool.query(sql,[...params,(page-1)*50]);
  res.set('Cache-Control','private,no-store');
  res.json({items:rows.map(r=>({...r,id:String(r.id),actor_id:r.actor_id?String(r.actor_id):null,created_at:new Date(typeof r.created_at==='string'&&/^\d{4}-\d\d-\d\d /.test(r.created_at)?r.created_at.replace(' ','T')+'Z':r.created_at).toISOString(),actor:r.actor_name||r.actor||'已注销账号',details:typeof r.details==='string'?JSON.parse(r.details):r.details})),page,hasMore:rows.length===50});
}));
// Public section catalog, including custom standalone pages (rendered as escaped text).
app.get('/api/sections', wrap(async(req,res)=>{
  const [rows]=await pool.query('SELECT id,slug,title,icon,kind,description,page_content,enabled,sort_order FROM forum_sections WHERE enabled=1 ORDER BY sort_order,id LIMIT 80');
  res.json({items:rows.map(x=>({...x,id:String(x.id)}))});
}));
app.get('/api/admin/sections',mustLogin,requirePermission('sections.manage'),wrap(async(req,res)=>{
  const [rows]=await pool.query('SELECT id,slug,title,icon,kind,description,page_content,enabled,sort_order FROM forum_sections ORDER BY sort_order,id LIMIT 100');
  res.json({items:rows.map(x=>({...x,id:String(x.id)}))});
}));
function sectionFields(input, update=false){
  const out={title:bounded(input.title,2,40,'栏目名称'),kind:inSet(input.kind,['discussion','exposure','page'],'栏目类型'),
    icon:bounded(input.icon||'◈',1,8,'图标'),description:str(input.description,240),
    page_content:str(input.page_content,10000),sort_order:Number(input.sort_order)||100,enabled:input.enabled===false||input.enabled===0?0:1};
  if(!Number.isInteger(out.sort_order)||out.sort_order<1||out.sort_order>9999)fail('排序必须为 1-9999');
  if(out.kind!=='page')out.page_content='';
  if(!update){out.slug=bounded(input.slug,2,64,'栏目标识').toLowerCase();if(!validSectionSlug(out.slug))fail('栏目标识只能包含小写字母、数字和连字符');}
  return out;
}
app.post('/api/admin/sections',mustLogin,requirePermission('sections.manage'),wrap(async(req,res)=>{
  const s=sectionFields(req.body);
  try{
    const id=await transaction(async conn=>{
      const [r]=await conn.query('INSERT INTO forum_sections (slug,title,icon,kind,description,page_content,enabled,sort_order,created_by) VALUES (?,?,?,?,?,?,?,?,?)',[s.slug,s.title,s.icon,s.kind,s.description,s.page_content,s.enabled,s.sort_order,req.user.id]);
      await logAction(req,'section.create','section',r.insertId,{slug:s.slug},conn);return r.insertId;
    });res.status(201).json({id:String(id)});
  }catch(err){if(err.code==='ER_DUP_ENTRY')fail('栏目标识已存在',409);throw err;}
}));
app.post('/api/admin/sections/:id/update',mustLogin,requirePermission('sections.manage'),wrap(async(req,res)=>{
  const id=asId(req.params.id),s=sectionFields(req.body,true);
  await transaction(async conn=>{
    const [[old]]=await conn.query('SELECT slug,kind FROM forum_sections WHERE id=? FOR UPDATE',[id]);if(!old)fail('栏目不存在',404);
    if(old.kind!==s.kind){const [[c]]=await conn.query('SELECT COUNT(*) total FROM posts WHERE category=?',[old.slug]);if(Number(c.total)>0)fail('已有帖子栏目不能更改栏目类型，请新增栏目',409);}
    await conn.query('UPDATE forum_sections SET title=?,icon=?,kind=?,description=?,page_content=?,enabled=?,sort_order=? WHERE id=?',[s.title,s.icon,s.kind,s.description,s.page_content,s.enabled,s.sort_order,id]);
    await logAction(req,'section.update','section',id,{enabled:s.enabled,title:s.title},conn);
  });res.json({ok:true});
}));
app.post('/api/admin/sections/:id/delete',mustLogin,requirePermission('sections.manage'),wrap(async(req,res)=>{
  const id=asId(req.params.id);
  await transaction(async conn=>{
    const [[old]]=await conn.query('SELECT slug FROM forum_sections WHERE id=? FOR UPDATE',[id]);if(!old)fail('栏目不存在',404);
    const [[count]]=await conn.query('SELECT COUNT(*) total FROM posts WHERE category=?',[old.slug]);
    if(Number(count.total)>0)fail('该栏目已有帖子，不能永久删除，请停用栏目以保留历史数据',409);
    await conn.query('DELETE FROM forum_sections WHERE id=?',[id]);await logAction(req,'section.delete','section',id,{slug:old.slug},conn);
  });res.json({ok:true});
}));
app.post('/api/admin/users/:id/mute',mustLogin,requirePermission('users.mute'),wrap(async(req,res)=>{
  const id=asId(req.params.id),duration=inSet(req.body.duration,['1h','24h','7d','permanent','unmute','custom'],'禁言时长');
  const customUntil=duration==='custom'?parseMuteDate(req.body.until):null;
  const reason=str(req.body.reason,300);
  if(duration!=='unmute' && reason.length<5)fail('请填写至少 5 字的禁言原因');
  if(String(req.user.id)===id)fail('不可禁言自己',403);
  const conn=await pool.getConnection();try{
    await conn.beginTransaction();
    const [[target]]=await conn.query('SELECT username,role,mute_until FROM users WHERE id=? FOR UPDATE',[id]);
    if(!target)fail('用户不存在',404);
    if(!canMuteUser(req.user,target.role,id))fail('无权禁言该身份',403);
    const until=duration==='unmute'?null:duration==='permanent'?'9999-12-31 23:59:59':
      (duration==='custom'?customUntil:new Date(Date.now()+({'1h':3600000,'24h':86400000,'7d':604800000}[duration]))).toISOString().slice(0,19).replace('T',' ');
    await conn.query('UPDATE users SET mute_until=?,mute_reason=? WHERE id=?',[until,duration==='unmute'?null:reason,id]);
    await logAction(req,duration==='unmute'?'user.unmute':'user.mute','user',id,
      {target_name:target.username,target_role:target.role,duration,until,reason,before_until:target.mute_until},conn);
    await conn.commit();res.json({ok:true,mute_until:until});
  }catch(e){await conn.rollback();throw e;}finally{conn.release();}
}));
app.get('/api/meta', (req,res)=>res.json({permissions:PERMISSIONS,maxUploadMb:5,allowedTypes:['image/jpeg','image/png','image/webp'],maxImagesPerType:20,maxCommentImages:20,maxStickerMb:1,maxPersonalStickers:200,turnstileSitekey:process.env.TURNSTILE_SITEKEY || ''}));
// No /uploads static route: each image must pass its visibility check above.
app.use(express.static(path.join(__dirname,'../public'),{index:'index.html',maxAge:'5m'}));
app.get('*',(req,res)=> {if(req.path.startsWith('/api/'))return res.status(404).json({error:'接口不存在'});res.sendFile(path.join(__dirname,'../public/index.html'));});
app.use((err,req,res,next)=>{
  if(res.headersSent) return next(err);
  const status = err.status || (err instanceof multer.MulterError ? 400 : 500);
  if(status >= 500) console.error('[server]',err);
  if(err.retryAfter)res.set('Retry-After',String(err.retryAfter));
  res.status(status).json({error:status>=500?'服务器暂时不可用':err.message});
});
async function start(){
  await fs.mkdir(UPLOAD_DIR,{recursive:true});
  await fs.mkdir(STICKER_DIR,{recursive:true});
  await pool.query('SELECT 1');
  if(redis) await redis.connect();
  app.listen(PORT,'0.0.0.0',()=>console.log(`[trust-forum] http://localhost:${PORT}`));
  // Periodic hygiene for orphaned uploads and expired DB sessions.
  const maintenanceTimer=setInterval(()=>cleanup().catch(e=>console.error('[maintenance]',e.message)),6*3600*1000);
  maintenanceTimer.unref();
}
if(require.main===module) start().catch(e=>{console.error('Startup error:',e.message);process.exit(1);});
module.exports={app,start};
