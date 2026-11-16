'use strict';
const crypto=require('node:crypto');
// Endpoints come only from deployment configuration, never from a user request.
const LANGUAGE_CODES={
  'zh-CN':'zh','zh-TW':'zt',en:'en',ja:'ja',ko:'ko',fr:'fr',de:'de',es:'es','pt-BR':'pb',it:'it',ru:'ru',ar:'ar',hi:'hi',th:'th',vi:'vi',ms:'ms',id:'id',tr:'tr',nl:'nl',pl:'pl',uk:'uk',fa:'fa',bn:'bn',ur:'ur'
};
function localeCode(locale){return Object.prototype.hasOwnProperty.call(LANGUAGE_CODES,locale)?LANGUAGE_CODES[locale]:null;}
const mem=new Map(),inflight=new Map(),languageCache=new Map();
let active=0;
const queue=[];
function option(name,fallback,min,max){const n=Number(process.env[name]);return Number.isInteger(n)&&n>=min&&n<=max?n:fallback;}
function error(message,status=503){return Object.assign(new Error(message),{status});}
function endpoint(){
  const address=process.env.TRANSLATE_INTERNAL_URL||'http://translate:5000';
  let url;try{url=new URL(address);}catch{throw error('翻译服务地址无效');}
  const host=url.hostname;
  const octets=/^\d+\.\d+\.\d+\.\d+$/.test(host)?host.split('.').map(Number):[];
  const privateIp=octets.length===4&&octets.every(n=>n>=0&&n<=255)&&
    (octets[0]===10||octets[0]===127||octets[0]===192&&octets[1]===168||octets[0]===172&&octets[1]>=16&&octets[1]<=31);
  const allowed=['translate','localhost','[::1]',...(process.env.TRANSLATE_ALLOWED_HOSTS||'').split(',').map(x=>x.trim()).filter(Boolean)];
  if(!['http:','https:'].includes(url.protocol)||!(privateIp||allowed.includes(host))||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw error('翻译服务必须使用受信内网服务');
  return url;
}
async function fetchJson(route,opts,timeout=option('TRANSLATE_TIMEOUT_MS',30000,1000,120000)){
  const base=endpoint();const url=new URL(route,base);
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeout);
  try{
    const response=await fetch(url,{...opts,signal:controller.signal,redirect:'error'});
    const text=await response.text();let result;try{result=JSON.parse(text)}catch{throw error('翻译服务返回了无效数据');}
    if(!response.ok){const e=new Error('翻译服务不支持当前语言或暂时不可用');e.status=response.status===400?422:503;throw e;}
    return result;
  }catch(err){if(err.status)throw err;const e=new Error('翻译引擎暂时不可用，请稍后重试');e.status=503;throw e;}
  finally{clearTimeout(timer);}
}
function engineSlot(){
  const limit=option('TRANSLATE_CONCURRENCY',2,1,8);
  if(active<limit){active++;return Promise.resolve();}
  if(queue.length>=option('TRANSLATE_QUEUE_SIZE',32,1,200))return Promise.reject(Object.assign(error('翻译请求较多，请稍后重试',429),{retryAfter:10}));
  return new Promise((resolve,reject)=>{
    const item={resolve:()=>{clearTimeout(item.timer);resolve();}};
    item.timer=setTimeout(()=>{const i=queue.indexOf(item);if(i!==-1)queue.splice(i,1);reject(Object.assign(error('翻译排队超时，请稍后重试',429),{retryAfter:10}));},option('TRANSLATE_QUEUE_WAIT_MS',15000,1000,60000));
    queue.push(item);
  });
}
function releaseSlot(){const item=queue.shift();if(item)item.resolve();else active--;}
function cacheClient(){return process.env.REDIS_ENABLED==='true'?require('./rate').redis:null;}
async function cached(key){
  const client=cacheClient();
  if(client){const raw=await client.get('tf:translation:'+key);if(raw){try{const x=JSON.parse(raw);if(typeof x.title==='string'&&typeof x.body==='string')return x;}catch{}}return null;}
  const x=mem.get(key);if(x&&x.expires>Date.now())return x.translated;if(x)mem.delete(key);return null;
}
async function save(key,translated){
  const client=cacheClient();
  if(client){
    // Bound the shared cache so translated text cannot crowd out security rate-limit keys.
    await client.eval(`local index=KEYS[1]; local k=KEYS[2];
      redis.call('ZREMRANGEBYSCORE',index,0,tonumber(ARGV[2])-1800000);
      redis.call('SET',k,ARGV[1],'EX',1800); redis.call('ZADD',index,ARGV[2],k);
      local old=redis.call('ZRANGE',index,0,-501);
      for _,v in ipairs(old) do redis.call('DEL',v); redis.call('ZREM',index,v); end;
      redis.call('EXPIRE',index,1800); return 1`,2,'tf:translation:index','tf:translation:'+key,JSON.stringify(translated),Date.now());return;
  }
  if(mem.size>=2000)mem.delete(mem.keys().next().value);mem.set(key,{translated,expires:Date.now()+1800000});
}
async function supportedLanguages(){
  const key=String(endpoint()),prev=languageCache.get(key);
  if(prev&&prev.expires>Date.now())return prev.promise;
  const promise=fetchJson('/languages',{method:'GET'},5000).then(items=>{
    if(!Array.isArray(items)||items.some(x=>typeof x.code!=='string'))throw error('翻译服务语言列表无效');
    return items;
  });
  const entry={promise,expires:Date.now()+60000};languageCache.set(key,entry);
  try{return await promise;}catch(e){if(languageCache.get(key)===entry)languageCache.delete(key);throw e;}
}
async function translationCapabilities(){
  const languages=await supportedLanguages();
  return {available:true,locales:Object.keys(LANGUAGE_CODES).filter(x=>languages.some(y=>y.code===LANGUAGE_CODES[x])),languages:languages.map(x=>({code:x.code,name:x.name,targets:x.targets||[]}))};
}
async function translatePublicPost(post,target){
  const lang=localeCode(target);
  if(!lang){const e=new Error('不支持此目标语言');e.status=422;throw e;}
  const text=String(post.title||'')+'\n'+String(post.body||'');
  if(text.length>8500){const e=new Error('帖子过长，暂不支持整篇翻译');e.status=413;throw e;}
  const key=crypto.createHash('sha256').update(JSON.stringify([String(endpoint()),process.env.TRANSLATE_MODEL_REVISION||'1',String(post.id),target,String(post.title||''),String(post.body||'')])).digest('hex');
  const prev=await cached(key);if(prev)return {translated:prev,fromCache:true};
  if(inflight.has(key))return inflight.get(key);
  const pending=(async()=>{
    await engineSlot();
    try{
      const again=await cached(key);if(again)return {translated:again,fromCache:true};
      const supported=await supportedLanguages();
      if(!supported.some(x=>x.code===lang))throw error('当前翻译引擎尚未安装此语言模型',422);
      const translate=async q=>{
        if(!q)return '';
        const r=await fetchJson('/translate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({q,source:'auto',target:lang,format:'text'})});
        if(typeof r.translatedText!=='string'||!r.translatedText.trim())throw error('翻译服务未返回有效内容');
        return r.translatedText.slice(0,20000);
      };
      // One engine request at a time per slot; never forward attachments, evidence or comments.
      const title=await translate(String(post.title||'')),body=await translate(String(post.body||''));
      const translated={title,body,lang:target,source:'auto',provider:'LibreTranslate'};
      await save(key,translated);return {translated,fromCache:false};
    }finally{releaseSlot();}
  })();
  inflight.set(key,pending);
  try{return await pending;}finally{if(inflight.get(key)===pending)inflight.delete(key);}
}
module.exports={localeCode,endpoint,translatePublicPost,translationCapabilities,LANGUAGE_CODES};
