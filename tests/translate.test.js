'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {localeCode,endpoint,translatePublicPost,LANGUAGE_CODES}=require('../src/translate');
test('Only known 24 website languages accepted; no arbitrary URL injection',()=>{
 assert.equal(Object.keys(LANGUAGE_CODES).length,24);
 assert.equal(localeCode('zh-TW'),'zt');assert.equal(localeCode('es'),'es');assert.equal(localeCode('whatever'),null);
 process.env.TRANSLATE_INTERNAL_URL='https://evil.example/';assert.throws(endpoint,/内网/);
 process.env.TRANSLATE_INTERNAL_URL='http://translate:5000/';assert.equal(endpoint().hostname,'translate');
});
test('Machine translator sends public title and body only, checks language models, caches result',async()=>{
 const old=global.fetch,calls=[];
 global.fetch=async(url,opts)=>{calls.push({url:String(url),body:opts?.body});if(String(url).endsWith('/languages'))return {ok:true,text:async()=>JSON.stringify([{code:'es',name:'Spanish'}])};return {ok:true,text:async()=>JSON.stringify({translatedText:JSON.parse(opts.body).q+' (es)'})};};
 try{
  const post={id:'1569',title:'title',body:'body',updated_at:'2026-11-16'};
  const first=await translatePublicPost(post,'es');assert.equal(first.translated.title,'title (es)');assert.equal(first.translated.body,'body (es)');
  assert.equal(calls.length,3);assert.ok(calls.every(x=>x.url.startsWith('http://translate:5000/')));
  const again=await translatePublicPost(post,'es');assert.equal(again.fromCache,true);assert.equal(calls.length,3);
  await assert.rejects(()=>translatePublicPost({...post,id:'x2'},'fa'),/语言模型/);
  assert.equal(calls.length,3); // /languages is cached for one minute.
 }finally{global.fetch=old;delete process.env.TRANSLATE_INTERNAL_URL;}
});

test('巴西语言模型及受信私网地址校验',()=>{
 assert.equal(localeCode('pt-BR'),'pb');
 process.env.TRANSLATE_INTERNAL_URL='http://10.20.0.5:5000';assert.equal(endpoint().hostname,'10.20.0.5');
 process.env.TRANSLATE_INTERNAL_URL='http://8.8.8.8:5000';assert.throws(endpoint);
 process.env.TRANSLATE_INTERNAL_URL='http://translate:5000/?redirect=evil';assert.throws(endpoint);
 process.env.TRANSLATE_INTERNAL_URL='http://translate:5000/';
});
function engineFixture(port,handler){
 const old=global.fetch,calls=[];
 process.env.TRANSLATE_INTERNAL_URL='http://127.0.0.1:'+port;
 global.fetch=async(url,opts)=>{
  calls.push({url:String(url),body:opts?.body});
  if(String(url).endsWith('/languages'))return {ok:true,text:async()=>JSON.stringify([{code:'es'},{code:'pb'}])};
  const payload=JSON.parse(opts.body);
  const value=handler?await handler(payload,opts):payload.q+' translated';
  return {ok:true,text:async()=>JSON.stringify({translatedText:value})};
 };
 return {calls,close(){global.fetch=old;delete process.env.TRANSLATE_INTERNAL_URL;delete process.env.TRANSLATE_MODEL_REVISION;delete process.env.TRANSLATE_CONCURRENCY;delete process.env.TRANSLATE_QUEUE_SIZE;}};
}
test('翻译缓存忽略浏览时间变化，正文及模型变更仍会重新翻译',async()=>{
 const f=engineFixture(5101);
 try{
  const p={id:'cache-regression',title:'title',body:'body',updated_at:'2026-11-16 01:00:00'};
  await translatePublicPost(p,'es');assert.equal(f.calls.length,3);
  assert.equal((await translatePublicPost({...p,updated_at:'2026-11-16 02:00:00'},'es')).fromCache,true);assert.equal(f.calls.length,3);
  await translatePublicPost({...p,body:'new body'},'es');assert.equal(f.calls.length,5);
  process.env.TRANSLATE_MODEL_REVISION='2';await translatePublicPost(p,'es');assert.equal(f.calls.length,7);
 }finally{f.close();}
});
test('同篇并发翻译合并成一次引擎工作，不重复发送证据',async()=>{
 const f=engineFixture(5102,async q=>{await new Promise(r=>setTimeout(r,5));return q.q+' translated';});
 try{
  const p={id:'dedup',title:'title',body:'body',privateEvidence:'NEVER_SEND_THIS'};
  const results=await Promise.all(Array.from({length:8},()=>translatePublicPost(p,'es')));
  assert.equal(results.length,8);assert.equal(f.calls.filter(x=>x.body).length,2);
  assert.ok(f.calls.every(x=>!String(x.body).includes('NEVER_SEND_THIS')));
 }finally{f.close();}
});
test('翻译并发有上限，排队已满时返回429，完成后继续队列',async()=>{
 process.env.TRANSLATE_CONCURRENCY='1';process.env.TRANSLATE_QUEUE_SIZE='1';
 let release,started;const gate=new Promise(r=>{release=r}),start=new Promise(r=>{started=r});let active=0,peak=0;
 const f=engineFixture(5103,async q=>{active++;peak=Math.max(peak,active);started();await gate;active--;return q.q+' translated';});
 const post=id=>({id,title:'title',body:'body'});
 try{
  const first=translatePublicPost(post('first'),'es');await start;
  const second=translatePublicPost(post('second'),'es');
  await assert.rejects(()=>translatePublicPost(post('third'),'es'),e=>e.status===429);
  release();await Promise.all([first,second]);assert.equal(peak,1);
 }finally{release();f.close();}
});
test('能力接口只公布当前模型包含的目标语言',async()=>{
 const f=engineFixture(5104);
 try{const {translationCapabilities}=require('../src/translate');const c=await translationCapabilities();assert.equal(c.available,true);assert.ok(c.locales.includes('pt-BR'));assert.ok(!c.locales.includes('ja'));}finally{f.close();}
});
