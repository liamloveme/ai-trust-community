'use strict';
const crypto=require('node:crypto');
const TOKEN_LIFETIME_MINUTES=20;
function validPassword(s){return typeof s==='string'&&s.length>=10&&s.length<=128;}
function validResetToken(s){return typeof s==='string'&&/^[0-9a-f]{64}$/.test(s);}
function normalizeEmail(s){return typeof s==='string'?s.trim().toLowerCase().slice(0,191):'';}
function emailFormat(s){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)&&s.length<=190;}
function makeResetToken(){return crypto.randomBytes(32).toString('hex');}
function tokenDigest(token){return crypto.createHash('sha256').update(token).digest('hex');}
function publicResetResponse(){return {message:'如果该邮箱已注册，且邮件服务可用，你将收到密码重置链接。请检查收件箱及垃圾邮件。'};}
module.exports={TOKEN_LIFETIME_MINUTES,validPassword,validResetToken,normalizeEmail,emailFormat,makeResetToken,tokenDigest,publicResetResponse};
