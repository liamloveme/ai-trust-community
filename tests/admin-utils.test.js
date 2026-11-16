const test=require('node:test');
const assert=require('node:assert/strict');
const {parseMuteDate,maskClientIp,toAuditDetails,auditSummary}=require('../src/admin-utils');
test('custom mute UTC exact minutes and valid leap date',()=>{
 const now=Date.UTC(2026,0,1);
 assert.equal(parseMuteDate('2028-02-29T13:04:00Z',now).toISOString(),'2028-02-29T13:04:00.000Z');
 for(const invalid of ['2028-02-30T13:04:00Z','2028-02-29T13:04:12Z','2028-02-29T13:04:00+08:00','bad','2026-01-01T00:00:00Z'])assert.throws(()=>parseMuteDate(invalid,now));
 assert.throws(()=>parseMuteDate('2033-01-01T00:00:00Z',now));
});
test('audit data excludes credentials and masks secrets embedded in notes',()=>{
 const out=toAuditDetails({password:'abc',apiKey:'abc',address:'0x'+'a'.repeat(40),reason:'违规请求 Bearer '+ 'a'.repeat(30)+' token sk-'+ 'b'.repeat(30),status:'removed',n:12});
 assert.equal(out.password,undefined);assert.equal(out.apiKey,undefined);assert.equal(out.address,undefined);
 assert.doesNotMatch(out.reason,/a{30}|b{30}/);assert.match(out.reason,/REDACTED/);
 assert.equal(out.status,'removed');assert.equal(out.n,12);
});
test('audit event summary and source IP are privacy-conscious',()=>{
 assert.match(auditSummary('user.mute',{target_name:'用户3',reason:'刷屏'}),/用户3/);
 assert.equal(maskClientIp('203.0.113.28'),'203.0.113.0/24');
 assert.equal(maskClientIp('bad'),null);
});
test('API 日期统一输出UTC且不修改用户正文',()=>{
 const {utcDates}=require('../src/admin-utils');
 const source={created_at:'2026-11-16 10:00:00',body:'2026-11-16 10:00:00',nested:[{mute_until:'2026-11-17 01:02:03',title:'original'}]};
 const out=utcDates(source);
 assert.equal(out.created_at,'2026-11-16T10:00:00Z');assert.equal(out.body,source.body);assert.equal(source.created_at,'2026-11-16 10:00:00');
 assert.equal(out.nested[0].mute_until,'2026-11-17T01:02:03Z');
});
