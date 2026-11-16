const test=require('node:test');const assert=require('node:assert/strict');
const {canModerateAuthor,canMuteUser,isMuted,validSectionSlug}=require('../src/policy');
const member={id:'8',role:'member'},mod={id:'2',role:'moderator'},root={id:'1',role:'super_admin'};
test('普通会员永远无后台删帖权限',()=>{
 for(const role of ['member','moderator','super_admin'])assert.equal(canModerateAuthor(member,role),false);
});
test('普通管理员仅能审核/删帖普通会员；超级管理员可处理管理员及会员',()=>{
 assert.equal(canModerateAuthor(mod,'member'),true);
 assert.equal(canModerateAuthor(mod,'moderator'),false);
 assert.equal(canModerateAuthor(mod,'super_admin'),false);
 assert.equal(canModerateAuthor(root,'member'),true);
 assert.equal(canModerateAuthor(root,'moderator'),true);
 assert.equal(canModerateAuthor(root,'super_admin'),true);
});
test('禁言身份矩阵，自身和最高管理员不可禁言',()=>{
 assert.equal(canMuteUser(mod,'member','3'),true);
 assert.equal(canMuteUser(mod,'moderator','9'),false);
 assert.equal(canMuteUser(mod,'super_admin','1'),false);
 assert.equal(canMuteUser(root,'moderator','2'),true);
 assert.equal(canMuteUser(root,'super_admin','9'),false);
 assert.equal(canMuteUser(root,'member','1'),false);
 assert.equal(canMuteUser(member,'member','9'),false);
});
test('UTC 禁言日期与栏目 slug 校验',()=>{
 assert.equal(isMuted('2099-12-31 23:59:59',Date.parse('2026-01-01T00:00:00Z')),true);
 assert.equal(isMuted('2020-01-01 00:00:00',Date.parse('2026-01-01T00:00:00Z')),false);
 assert.equal(isMuted(null),false);
 assert.equal(validSectionSlug('api-key-v2'),true);
 assert.equal(validSectionSlug('javascript:alert(1)'),false);
 assert.equal(validSectionSlug('<script>'),false);
});
