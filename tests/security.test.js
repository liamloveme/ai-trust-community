const test = require('node:test');
const assert = require('node:assert/strict');
const {PERMISSIONS,newToken,hashToken,hashPassword,verifyPassword,hasSensitiveData} = require('../src/security');
test('权限键固定且无重复',()=>{assert.equal(new Set(PERMISSIONS).size,PERMISSIONS.length);assert.ok(PERMISSIONS.includes('posts.remove'));assert.ok(PERMISSIONS.includes('audit.view'));});
test('密码哈希每次随机加盐且校验失败安全',()=>{
 const p='StrongExample_Password_2026!';const a=hashPassword(p),b=hashPassword(p);
 assert.notEqual(a,b);assert.ok(verifyPassword(p,a));assert.ok(!verifyPassword('wrong password',a));assert.ok(!verifyPassword(p,'corrupted'));
});
test('匿名随机令牌、摘要和长度',()=>{const a=newToken(),b=newToken();assert.match(a,/^[0-9a-f]{64}$/);assert.notEqual(a,b);assert.match(hashToken(a),/^[0-9a-f]{64}$/);assert.notEqual(hashToken(a),a);});
test('敏感数据基础模式检查',()=>{
 assert.ok(hasSensitiveData('备用联系 test-person@example.com'));
 assert.ok(hasSensitiveData('token sk-proj-ABCDEF0123456789ZZ'));
 assert.ok(hasSensitiveData('致电 13812345678'));
 assert.equal(hasSensitiveData('这是一条没有个人信息的社区经验分享'),false);
});
