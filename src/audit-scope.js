'use strict';
function auditVisibility(role, actorId){
 if(role==='super_admin')return {where:[],params:[]};
 if(role==='moderator' && /^[1-9]\d{0,17}$/.test(String(actorId)))return {where:['a.actor_id=?'],params:[String(actorId)]};
 throw Object.assign(new Error('Only moderators and super admins may read audit logs'),{status:403});
}
module.exports={auditVisibility};
