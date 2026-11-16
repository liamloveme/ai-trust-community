/** Authorization predicates: UI state is never trusted. */
function canModerateAuthor(actor, authorRole) {
  return !!actor && (actor.role === 'super_admin' || (actor.role === 'moderator' && authorRole === 'member'));
}
function canMuteUser(actor, targetRole, targetId) {
  return !!actor && String(actor.id) !== String(targetId) && targetRole !== 'super_admin'
    && (actor.role === 'super_admin' || (actor.role === 'moderator' && targetRole === 'member'));
}
function muteDeadline(utcDateString) {
  if (!utcDateString) return 0;
  const text=String(utcDateString);
  return Date.parse(text.replace(' ','T').replace(/(?:Z|[+-]\d\d:\d\d)$/,'')+'Z');
}
function isMuted(utcDateString, now = Date.now()) {return muteDeadline(utcDateString)>now;}
function validSectionSlug(slug) {return /^[a-z][a-z0-9-]{1,63}$/.test(slug);}
module.exports={canModerateAuthor,canMuteUser,isMuted,validSectionSlug};
