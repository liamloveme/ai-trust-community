'use strict';
const assert=require('node:assert/strict');
const {test}=require('node:test');
const {auditVisibility}=require('../src/audit-scope');
const {validPassword,validResetToken,normalizeEmail,emailFormat,makeResetToken,tokenDigest,publicResetResponse}=require('../src/password-policy');
test('moderator audit query is forced to only own actor_id',()=>{
 assert.deepEqual(auditVisibility('moderator','9'),{where:['a.actor_id=?'],params:['9']});
 assert.deepEqual(auditVisibility('super_admin','9'),{where:[],params:[]});
 assert.throws(()=>auditVisibility('member','9'),/Only moderators/);
 assert.throws(()=>auditVisibility('moderator','9 OR 1=1'));
});
test('password reset token is non-reversible random 64 hex and hashed before database storage',()=>{
 const t1=makeResetToken(),t2=makeResetToken();
 assert.equal(t1.length,64);assert.equal(validResetToken(t1),true);assert.notEqual(t1,t2);
 assert.equal(tokenDigest(t1).length,64);assert.notEqual(tokenDigest(t1),t1);
 assert.equal(tokenDigest(t1),tokenDigest(t1));assert.equal(validResetToken('weak'),false);
});
test('password policy rejects weak and oversized input',()=>{
 assert.equal(validPassword('123456789'),false);assert.equal(validPassword('1234567890'),true);
 assert.equal(validPassword('x'.repeat(129)),false);assert.equal(validPassword(null),false);
});
test('generic email-reset response does not reveal account existence or raw token',()=>{
 assert.equal(emailFormat(normalizeEmail('  MEMBER@EXAMPLE.COM  ')),true);
 const res=publicResetResponse();assert.equal(typeof res.message,'string');assert.equal(JSON.stringify(res).includes('token'),false);
});

// HTTP regression tests use the real app and controlled DB transactions, not a live MySQL server.
test('修复版HTTP权限、事务、健康检查与评论审核回归',async t=>{
 const path=require('node:path'),fs=require('node:fs/promises');
 process.env.NODE_ENV='development';process.env.REDIS_ENABLED='false';process.env.TURNSTILE_SECRET='';process.env.TRUST_PROXY='0';
 let role='super_admin',targetRole='member',permissions=['reports.review','appeals.review','comments.review'],auditFails=false,dbDown=false;
 let state={status:'pending',audits:0},events=[];const created=[];
 async function query(sql,args=[]){
  if(dbDown)throw Error('fixture DB unavailable');
  if(sql==='SELECT 1')return [[{one:1}]];
  if(sql.includes('FROM sessions s JOIN users'))return [[{id:9,username:'fixture-admin',role,state:'active',session_id:1,csrf_token:'c'.repeat(64)}]];
  if(sql.includes('SELECT permission_name FROM admin_permissions'))return [permissions.map(permission_name=>({permission_name}))];
  if(sql.includes('SELECT target_type,target_id,reason,status FROM reports'))return [[{target_type:'post',target_id:12,reason:'abuse',status:state.status}]];
  if(sql.includes('SELECT u.role FROM posts'))return [[{role:targetRole}]];
  if(sql.startsWith('SELECT p.status,p.title'))return [[{status:state.status,title:'fixture title',author_role:targetRole}]];
  if(sql.startsWith('SELECT c.status,c.body'))return [[{status:state.status,body:'fixture comment',post_id:12,role:targetRole,username:'fixture-user'}]];
  if(sql.includes('SELECT a.*,u.role author_role'))return [[{id:1,post_id:12,applicant_id:4,status:state.status,author_role:targetRole}]];
  if(sql.startsWith('SELECT c.id,c.post_id,c.body'))return [[{id:1,post_id:12,body:'reviewable comment',status:'pending',created_at:'2026-11-16 10:00:00',author:'member',author_role:targetRole,post_title:'PRIVATE PARENT TITLE',post_body:'PRIVATE PARENT BODY',post_status:'removed',post_author_role:'member'}]];
  if(sql.startsWith('SELECT id FROM attachments WHERE comment_id'))return [[{id:7}]];
  if(sql.startsWith('SELECT COUNT(*) AS n FROM attachments'))return [[{n:0}]];
  if(sql.startsWith('INSERT INTO attachments')){created.push(args[2]);return [{insertId:created.length,affectedRows:1}];}
  if(sql.startsWith('UPDATE reports')||sql.startsWith('UPDATE posts')||sql.startsWith('UPDATE comments')||sql.startsWith('UPDATE appeals')){events.push('update');state.status=args[0];return [{affectedRows:1}];}
  if(sql.includes('INSERT INTO audit_logs')){events.push('audit');if(auditFails)throw Error('fixture audit write failure');state.audits++;return [{affectedRows:1}];}
  throw Error('Unexpected fixture SQL: '+sql);
 }
 const pool={query,async getConnection(){let snapshot;return {query,async beginTransaction(){snapshot=structuredClone(state);events.push('begin');},async commit(){events.push('commit');},async rollback(){state=snapshot;events.push('rollback');},release(){events.push('release');}};}};
 const dbFile=require.resolve('../src/db');require.cache[dbFile]={id:dbFile,filename:dbFile,loaded:true,exports:{pool}};
 const {app}=require('../src/server');const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 const url='http://127.0.0.1:'+server.address().port;
 const request=async(route,body,extra={})=>{const r=await fetch(url+route,{method:body===undefined?'GET':'POST',headers:{cookie:'trust_forum_session='+'a'.repeat(64),'x-csrf-token':'c'.repeat(64),...(body===undefined?{}:{'content-type':'application/json'}),...extra},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json()};};
 const reset=()=>{state={status:'pending',audits:0};events=[];role='super_admin';targetRole='member';auditFails=false;dbDown=false;};
 const oldError=console.error;console.error=()=>{};
 try{
  await t.test('101条和重复ID返回400并保留清楚错误',async()=>{
   const r=await request('/api/admin/batch',{resource:'posts',action:'published',ids:Array.from({length:101},(_,i)=>String(i+1)),note:'已人工核查内容'});assert.equal(r.status,400);assert.match(r.data.error,/100/);
   const d=await request('/api/admin/batch',{resource:'posts',action:'published',ids:['1','1'],note:'已人工核查内容'});assert.equal(d.status,400);
  });
  await t.test('普通管理员不能单条处理其他管理员的举报或申诉',async()=>{
   reset();role='moderator';targetRole='moderator';
   for(const [route,body] of [['/api/admin/reports/1/review',{status:'dismissed',note:'已人工核查内容'}],['/api/admin/appeals/1/review',{status:'accepted',note:'已人工核查内容'}]]){const r=await request(route,body);assert.equal(r.status,403);assert.equal(state.status,'pending');assert.equal(state.audits,0);}
  });
  await t.test('超管可处理管理员举报并同时提交审计',async()=>{
   reset();targetRole='moderator';const r=await request('/api/admin/reports/1/review',{status:'resolved',note:'已人工核查内容'});assert.equal(r.status,200);assert.equal(state.status,'resolved');assert.equal(state.audits,1);assert.ok(events.indexOf('audit')<events.indexOf('commit'));
  });
  await t.test('举报、帖子、评论审计写入失败全部回滚',async()=>{
   for(const [route,body] of [['/api/admin/reports/1/review',{status:'resolved',note:'已人工核查内容'}],['/api/admin/posts/1/review',{decision:'published',note:'已人工核查内容'}],['/api/admin/comments/1/review',{decision:'published',note:'已人工核查内容'}]]){
    reset();auditFails=true;const r=await request(route,body);assert.equal(r.status,500);assert.equal(state.status,'pending');assert.equal(state.audits,0);assert.ok(events.includes('rollback'));assert.ok(!events.includes('commit'));
   }
  });
  await t.test('评论审核员可查看评论图片且不泄露未公开父帖内容',async()=>{
   reset();role='moderator';permissions=['comments.review'];const r=await request('/api/admin/comments/1/context');assert.equal(r.status,200);assert.equal(r.data.comment.images[0].url,'/api/media/7');assert.equal(r.data.comment.created_at,'2026-11-16T10:00:00Z');assert.ok(!JSON.stringify(r.data).includes('PRIVATE PARENT'));
   targetRole='moderator';assert.equal((await request('/api/admin/comments/1/context')).status,403);
  });
  await t.test('健康就绪检查发现DB故障，存活检查仍独立返回200',async()=>{
   reset();dbDown=true;const health=await request('/api/health');assert.equal(health.status,503);assert.equal(health.data.checks.database,false);assert.equal((await request('/api/live')).status,200);
  });
  await t.test('非法CSRF返回403，普通会员不能管理',async()=>{
   reset();const r=await request('/api/admin/reports/1/review',{status:'resolved',note:'已人工核查内容'},{'x-csrf-token':'é'.repeat(64)});assert.equal(r.status,403);
   role='member';assert.equal((await request('/api/admin/reports/1/review',{status:'resolved',note:'已人工核查内容'})).status,403);
  });
  await t.test('升级sharp后JPG PNG WebP可上传重编码，伪装SVG被拒绝',async()=>{
   reset();const sharp=require('sharp');
   for(const format of ['jpeg','png','webp']){
    const bytes=await sharp({create:{width:50,height:30,channels:3,background:'#237b8b'}})[format]().toBuffer();
    const form=new FormData();form.append('image',new Blob([bytes],{type:format==='jpeg'?'image/jpeg':'image/'+format}),'test.'+format);form.append('purpose','public');
    const r=await fetch(url+'/api/upload',{method:'POST',headers:{cookie:'trust_forum_session='+'a'.repeat(64),'x-csrf-token':'c'.repeat(64)},body:form});assert.equal(r.status,201);
    const filename=created.at(-1);const meta=await sharp(path.join(__dirname,'../data/uploads',filename)).metadata();assert.equal(meta.format,'webp');assert.equal(meta.width,50);assert.equal(meta.height,30);
   }
   const fake=new FormData();fake.append('image',new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>'],{type:'image/png'}),'fake.png');fake.append('purpose','public');
   const bad=await fetch(url+'/api/upload',{method:'POST',headers:{cookie:'trust_forum_session='+'a'.repeat(64),'x-csrf-token':'c'.repeat(64)},body:fake});assert.equal(bad.status,400);
  });
 }finally{console.error=oldError;await new Promise(r=>server.close(r));for(const file of created)await fs.unlink(path.join(__dirname,'../data/uploads',file)).catch(()=>{});}
});
