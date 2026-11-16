'use strict';
const crypto=require('node:crypto');
const CONTACT_TYPES=Object.freeze(['qq','telegram','x','tiktok','wechat','discord','whatsapp','email','other']);
function invalid(message){return Object.assign(new Error(message),{status:400});}
function staff(actor){return !!actor&&['super_admin','moderator'].includes(actor.role);}
function pinInput(body){
 if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>!['scope','pinned'].includes(k)))throw invalid('置顶参数不合法');
 if(!['home','section'].includes(body.scope)||typeof body.pinned!=='boolean')throw invalid('请选择合法的置顶范围和开关状态');
 return {scope:body.scope,pinned:body.pinned};
}
function canPin(actor,scope){return scope==='home'?actor?.role==='super_admin':scope==='section'&&staff(actor);}
function normalizeContacts(input){
 if(!input||typeof input!=='object'||typeof input.enabled!=='boolean'||!Array.isArray(input.items)||input.items.length>4)throw invalid('联系方式最多4项，开关必须为布尔值');
 const seen=new Set();
 const items=input.items.map((x,i)=>{
  if(!x||typeof x!=='object'||!CONTACT_TYPES.includes(x.type)||typeof x.value!=='string'||typeof x.enabled!=='boolean')throw invalid('第'+(i+1)+'项联系方式格式不正确');
  if(seen.has(x.type))throw invalid('联系方式类型不能重复');seen.add(x.type);
  const value=x.value.trim();
  if(value.length>120||/[\u0000-\u001f\u007f]/.test(value))throw invalid('联系方式最多120字，不能包含控制字符');
  if(x.enabled&&!value)throw invalid('已启用的联系方式必须填写账号或号码');
  return {type:x.type,value,enabled:x.enabled};
 });
 return {enabled:input.enabled,items};
}
function publicContacts(config){return {enabled:config.enabled,items:config.enabled?config.items.filter(x=>x.enabled&&x.value).map(({type,value})=>({type,value})):[]};}
function contactsMac(revision,config){
 const key=process.env.DONATION_CONFIG_HMAC_KEY||'';
 if(!/^[a-f0-9]{64,}$/i.test(key))throw Object.assign(new Error('页脚配置签名密钥缺失或格式错误'),{status:503});
 return crypto.createHmac('sha256',Buffer.from(key,'hex')).update('footer_contacts:v1:'+JSON.stringify({revision,...config})).digest('hex');
}
function verifyContacts(revision,config,signature){
 if(typeof signature!=='string'||!/^[a-f0-9]{64}$/i.test(signature))return false;
 return crypto.timingSafeEqual(Buffer.from(contactsMac(revision,config),'hex'),Buffer.from(signature,'hex'));
}
module.exports={CONTACT_TYPES,staff,pinInput,canPin,normalizeContacts,publicContacts,contactsMac,verifyContacts};
