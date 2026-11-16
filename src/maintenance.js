const path = require('node:path');
const fs = require('node:fs/promises');
const {pool} = require('./db');
const UPLOAD_DIR = path.resolve(__dirname, '../data/uploads');
async function cleanup(){
  const [expired] = await pool.query('DELETE FROM sessions WHERE expires_at < UTC_TIMESTAMP()');
  await pool.query('DELETE FROM password_reset_tokens WHERE expires_at < UTC_TIMESTAMP()');
  let purged=0;
  // Lock and unlink only unassigned images older than 24 hours. Keep attachment semantics atomic.
  for(let round=0;round<12;round++){
    const conn=await pool.getConnection();let batch=[];
    try {
      await conn.beginTransaction();
      const [rows]=await conn.query("SELECT id,filename FROM attachments WHERE post_id IS NULL AND comment_id IS NULL AND created_at < DATE_SUB(UTC_TIMESTAMP(),INTERVAL 1 DAY) ORDER BY id LIMIT 100 FOR UPDATE");
      batch=rows;
      if(batch.length) await conn.query(`DELETE FROM attachments WHERE id IN (${batch.map(()=>'?').join(',')})`,batch.map(x=>x.id));
      await conn.commit();
    }catch(e){await conn.rollback();throw e;}finally{conn.release();}
    for(const a of batch){try{await fs.unlink(path.join(UPLOAD_DIR,a.filename));}catch(e){if(e.code!=='ENOENT')console.error('[cleanup] unlink:',e.message);}purged++;}
    if(batch.length<100)break;
  }
  return {expiredSessions:expired.affectedRows,orphanFiles:purged};
}
module.exports={cleanup};
