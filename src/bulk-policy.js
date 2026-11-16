'use strict';
/** Hard server-side caps and workflow policy for moderated batch actions. */
const MAX_BULK_ITEMS=100;
const BULK_ACTIONS=Object.freeze({
 posts:['published','rejected','removed'],
 comments:['published','hidden'],
 reports:['resolved','dismissed'],
 appeals:['accepted','denied'],
 users:['mute24h','unmute'],
 stickers:['active','disabled','deleted'],
 sections:['enabled','disabled']
});
const BULK_PERMISSIONS=Object.freeze({
 posts:{published:'posts.review',rejected:'posts.review',removed:'posts.remove'},
 comments:{published:'comments.review',hidden:'comments.remove'},
 reports:{resolved:'reports.review',dismissed:'reports.review'},
 appeals:{accepted:'appeals.review',denied:'appeals.review'},
 users:{mute24h:'users.mute',unmute:'users.mute'},
 stickers:{active:'stickers.remove',disabled:'stickers.remove',deleted:'stickers.remove'},
 sections:{enabled:'sections.manage',disabled:'sections.manage'}
});
function validateBatch(body){
 try{
 if(!body||typeof body!=='object')throw Error('缺少批量操作参数');
 const {resource,action,ids,note,reviewedEvidence}=body;
 if(!Object.hasOwn(BULK_ACTIONS,resource)||!BULK_ACTIONS[resource].includes(action))throw Error('不支持的批量操作');
 if(!Array.isArray(ids)||ids.length<1||ids.length>MAX_BULK_ITEMS)throw Error(`请选择1-${MAX_BULK_ITEMS}条记录`);
 if(ids.some(id=>typeof id!=='string'||!/^[1-9]\d{0,17}$/.test(id)))throw Error('记录ID无效');
 if(new Set(ids).size!==ids.length)throw Error('不能选择重复记录');
 if(typeof note!=='string'||note.trim().length<5||note.trim().length>500)throw Error('批量处理必须填写5-500字审核理由');
 if(reviewedEvidence!==undefined&&typeof reviewedEvidence!=='boolean')throw Error('核验确认值不合法');
 return {resource,action,ids,note:note.trim(),reviewedEvidence:reviewedEvidence===true,permission:BULK_PERMISSIONS[resource][action]};
 }catch(err){err.status=400;throw err;}
}
function bulkReviewAllowed(resource,action,item,reviewedEvidence=false){
 // Risk reports and evidence CAN be batch approved after a human review.
 // Require an explicit, auditable declaration when approving sensitive content.
 if(action==='published'&&resource==='posts'&&(item.type==='exposure'||Number(item.attachments_count||0)>0))return reviewedEvidence===true;
 if(action==='published'&&resource==='comments'&&(item.post_type==='exposure'||Number(item.attachments_count||0)>0))return reviewedEvidence===true;
 return true;
}
function bulkTransition(resource,action,status){
 if(resource==='posts')return action==='removed'?status==='published':action==='published'?status==='pending':status==='pending';
 if(resource==='comments')return action==='published'?status==='pending':['pending','published'].includes(status);
 if(resource==='reports'||resource==='appeals')return status==='pending';
 if(resource==='stickers')return status!=='deleted'&&status!==action;
 if(resource==='sections')return action==='enabled'?!status:!!status;
 if(resource==='users')return true;
 return false;
}
module.exports={MAX_BULK_ITEMS,BULK_ACTIONS,BULK_PERMISSIONS,validateBatch,bulkReviewAllowed,bulkTransition};
