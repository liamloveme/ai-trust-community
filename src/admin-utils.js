// Centralized validation & redacted audit descriptors; all dates are UTC.
function utcDates(value,key=''){
 if(value instanceof Date)return value.toISOString();
 if(Array.isArray(value))return value.map(x=>utcDates(x));
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,utcDates(v,k)]));
 if(typeof value==='string'&&/(?:_at|_until)$|^until$/.test(key)&&/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d(?:\.\d{1,6})?$/.test(value))return value.replace(' ','T')+'Z';
 return value;
}
function parseMuteDate(value,now=Date.now()) {
  if(typeof value!=='string'||!/^(\d{4}-\d\d-\d\d)T(\d\d):(\d\d):(00)Z$/.test(value))throw Error('请选择含时区的有效禁言结束日期（精确到分钟）');
  const d=new Date(value);
  if(!Number.isFinite(d.getTime())||d.toISOString().replace('.000Z','Z')!==value)throw Error('禁言日期不存在');
  if(d.getTime()<=now+60000)throw Error('禁言结束时间至少要晚于当前一分钟');
  if(d.getTime()>now+5*366*86400000)throw Error('自定义禁言最多5年');
  return d;
}
function maskClientIp(ip) {
  if(typeof ip!=='string')return null;
  if(/^\d{1,3}(?:\.\d{1,3}){3}$/.test(ip))return ip.replace(/\.\d+$/,'.0/24');
  if(ip.includes(':'))return ip.split(':').slice(0,4).join(':')+'::/64';
  return null;
}
function redactAuditText(value){
 return String(value).replace(/\b(?:sk-|sk_live_|Bearer\s+)[a-zA-Z0-9_.\-]{12,}/gi,'[REDACTED]')
  .replace(/\b(?:0x[a-fA-F0-9]{40}|bc1[ac-hj-np-z02-9]{20,90})\b/g,'[REDACTED_ADDRESS]');
}
function toAuditDetails(details){
 const out={};const forbidden=/(password|secret|token|privatekey|api.?key|cookie|address)/i;
 for(const [key,value] of Object.entries(details||{})){
  if(forbidden.test(key))continue;
  const text=typeof value==='string'?redactAuditText(value.slice(0,300)):value;
  if(Array.isArray(text))out[key]=text.slice(0,20).map(x=>redactAuditText(String(x).slice(0,50)));
  else if(typeof text==='string'||typeof text==='number'||typeof text==='boolean'||text===null)out[key]=text;
 }
 return out;
}
const LABELS={
 'user.mute':'禁言用户','user.unmute':'解除禁言','user.permissions_changed':'管理员任免与权限修改',
 'post.published':'审核通过帖子','post.rejected':'驳回帖子','post.removed':'下架帖子',
 'comment.published':'审核通过评论','comment.hidden':'隐藏评论',
 'report.resolved':'处理举报','report.dismissed':'驳回举报',
 'appeal.accepted':'接受申诉复核','appeal.denied':'驳回申诉',
 'sticker.upload':'上传个人表情','sticker.active':'恢复表情','sticker.disabled':'禁用表情','sticker.deleted':'删除表情',
 'sticker.owner_delete':'用户删除个人表情','section.create':'新建栏目','section.update':'修改栏目','section.delete':'删除栏目',
 'donations.update':'修改捐赠地址设置'
};
function auditSummary(action,details={}){
 const base=LABELS[action]||action;
 const extra=[details.target_name,details.before_role&&details.role?`${details.before_role} → ${details.role}`:null,
 details.until?`截至 ${details.until} UTC`:null,details.note||details.reason].filter(Boolean).join(' · ');
 return base+(extra?'：'+extra:'');
}
module.exports={utcDates,parseMuteDate,maskClientIp,toAuditDetails,auditSummary,redactAuditText,LABELS};
