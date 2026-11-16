'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {MAX_BULK_ITEMS,validateBatch,bulkReviewAllowed,bulkTransition}=require('../src/bulk-policy');
function payload(patch={}){return {resource:'posts',action:'published',ids:['10','11'],note:'已逐条核验并按社区发布标准完成审核',reviewedEvidence:true,...patch};}
test('批量审核包含举报曝光文章，确认人工核验后可批准',()=>{
 assert.equal(bulkReviewAllowed('posts','published',{type:'exposure',attachments_count:20},false),false);
 assert.equal(bulkReviewAllowed('posts','published',{type:'exposure',attachments_count:20},true),true);
 assert.equal(bulkReviewAllowed('posts','published',{type:'discussion',attachments_count:0},false),true);
 assert.equal(bulkReviewAllowed('posts','rejected',{type:'exposure',attachments_count:20},false),true);
});
test('风险线索评论同样可以经人工确认后批量通过',()=>{
 assert.equal(bulkReviewAllowed('comments','published',{post_type:'exposure',attachments_count:0},false),false);
 assert.equal(bulkReviewAllowed('comments','published',{post_type:'exposure',attachments_count:0},true),true);
 assert.equal(bulkReviewAllowed('comments','hidden',{post_type:'exposure',attachments_count:20},false),true);
});
test('合法批次保留权限映射、理由、核验声明',()=>{
 assert.deepEqual(validateBatch(payload()).ids,['10','11']);
 assert.equal(validateBatch(payload()).reviewedEvidence,true);
 assert.equal(validateBatch(payload()).permission,'posts.review');
 assert.equal(validateBatch(payload({action:'removed'})).permission,'posts.remove');
 assert.equal(validateBatch(payload({resource:'users',action:'mute24h'})).permission,'users.mute');
});
test('拒绝未知资源、未知动作、无理由及格式异常的 ID',()=>{
 assert.throws(()=>validateBatch(payload({resource:'admins'})));
 assert.throws(()=>validateBatch(payload({action:'super_admin'})));
 assert.throws(()=>validateBatch(payload({note:'短'})));
 assert.throws(()=>validateBatch(payload({ids:[]})));
 assert.throws(()=>validateBatch(payload({ids:['10','10']})));
 assert.throws(()=>validateBatch(payload({ids:[10]})));
 assert.throws(()=>validateBatch(payload({ids:['0']})));
 assert.throws(()=>validateBatch(payload({ids:['01']})));
 assert.throws(()=>validateBatch(payload({ids:['1 OR 1=1']})));
 assert.throws(()=>validateBatch(payload({reviewedEvidence:'true'})));
});
test('上限固定为当前页 100 条，不能一次提交无限 ID',()=>{
 assert.equal(MAX_BULK_ITEMS,100);
 const ids=Array.from({length:100},(_,i)=>String(i+1));
 assert.equal(validateBatch(payload({ids})).ids.length,100);
 assert.throws(()=>validateBatch(payload({ids:[...ids,'101']})),e=>e.status===400);
});
test('只允许合法帖子或评论状态迁移',()=>{
 assert.equal(bulkTransition('posts','published','pending'),true);
 assert.equal(bulkTransition('posts','published','published'),false);
 assert.equal(bulkTransition('posts','rejected','pending'),true);
 assert.equal(bulkTransition('posts','removed','published'),true);
 assert.equal(bulkTransition('posts','removed','removed'),false);
 assert.equal(bulkTransition('comments','published','pending'),true);
 assert.equal(bulkTransition('comments','published','published'),false);
 assert.equal(bulkTransition('comments','hidden','published'),true);
 assert.equal(bulkTransition('reports','resolved','resolved'),false);
 assert.equal(bulkTransition('appeals','denied','pending'),true);
});
test('防止栏目重复执行同一状态',()=>{
 assert.equal(bulkTransition('sections','enabled',false),true);
 assert.equal(bulkTransition('sections','enabled',true),false);
 assert.equal(bulkTransition('sections','disabled',true),true);
 assert.equal(bulkTransition('sections','disabled',false),false);
 assert.equal(bulkTransition('stickers','deleted','deleted'),false);
});
