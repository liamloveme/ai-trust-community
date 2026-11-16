'use strict';
const MAX_POST_PUBLIC_IMAGES = 20;
const MAX_POST_PRIVATE_IMAGES = 20;
const MAX_COMMENT_IMAGES = 20;
const MAX_STICKER_BYTES = 1024 * 1024;
const MAX_PERSONAL_STICKERS = 200;
function validImageIds(ids, max) {return Array.isArray(ids) && ids.length <= max && ids.every(x => /^[1-9]\d{0,17}$/.test(String(x))) && (new Set(ids.map(String))).size===ids.length;}
function stickerIds(body){return [...new Set([...String(body||'').matchAll(/\[sticker:([1-9]\d{0,17})\]/g)].map(x=>x[1]))];}
function stickerPlaceholderCount(body){return (String(body||'').match(/\[sticker:/g)||[]).length;}
function canUseSticker(sticker, actorId){return sticker && sticker.status==='active' && String(sticker.owner_id)===String(actorId);}
module.exports={MAX_POST_PUBLIC_IMAGES,MAX_POST_PRIVATE_IMAGES,MAX_COMMENT_IMAGES,MAX_STICKER_BYTES,MAX_PERSONAL_STICKERS,validImageIds,stickerIds,stickerPlaceholderCount,canUseSticker};
