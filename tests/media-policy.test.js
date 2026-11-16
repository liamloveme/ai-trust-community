'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const media=require('../src/media-policy');
const {PERMISSIONS}=require('../src/security');
function ids(n){return Array.from({length:n},(_,i)=>String(i+1));}
test('公开图片、私密证据、评论分别允许20张，拒绝第21张',()=>{
 assert.equal(media.MAX_POST_PUBLIC_IMAGES,20);
 assert.equal(media.MAX_POST_PRIVATE_IMAGES,20);
 assert.equal(media.MAX_COMMENT_IMAGES,20);
 for(const cap of [media.MAX_POST_PUBLIC_IMAGES,media.MAX_POST_PRIVATE_IMAGES,media.MAX_COMMENT_IMAGES]){
  assert.ok(media.validImageIds(ids(cap),cap));
  assert.ok(!media.validImageIds(ids(cap+1),cap));
 }
 assert.ok(!media.validImageIds(['1','1'],20));
 assert.ok(!media.validImageIds(['1','oops'],20));
});
test('自定义表情 <=1MB; 每人200张; 管理权限可单独配置',()=>{
 assert.equal(media.MAX_STICKER_BYTES,1048576);
 assert.equal(media.MAX_PERSONAL_STICKERS,200);
 assert.ok(PERMISSIONS.includes('stickers.review'));
 assert.ok(PERMISSIONS.includes('stickers.remove'));
});
test('表情 token去重，只允许自己使用未被禁用的表情',()=>{
 assert.deepEqual(media.stickerIds('a[sticker:1] [sticker:2][sticker:1]'),['1','2']);
 assert.equal(media.stickerPlaceholderCount('a[sticker:1][sticker:1]'),2);
 assert.equal(media.canUseSticker({owner_id:9,status:'active'},'9'),true);
 assert.equal(media.canUseSticker({owner_id:9,status:'active'},'8'),false);
 assert.equal(media.canUseSticker({owner_id:9,status:'disabled'},'9'),false);
 assert.equal(media.canUseSticker({owner_id:9,status:'deleted'},'9'),false);
});
