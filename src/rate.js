const crypto = require('node:crypto');
const rateLimit = require('express-rate-limit');
const isProd = process.env.NODE_ENV === 'production';
const enabled = process.env.REDIS_ENABLED === 'true';
if (isProd && !enabled) throw Error('生产环境必须启用 Redis 分布式限流：REDIS_ENABLED=true');
let redis = null;
if (enabled) {
  const Redis = require('ioredis');
  redis = new Redis({host:process.env.REDIS_HOST || 'redis', port:Number(process.env.REDIS_PORT || 6379),
    password:process.env.REDIS_PASSWORD || undefined, lazyConnect:true, enableOfflineQueue:false,
    maxRetriesPerRequest:1, connectTimeout:3000});
  redis.on('error', err => console.error('[redis]', err.message));
}
// Sliding-window log is atomic across multiple Node.js instances. Never falls back to open access in prod.
const SCRIPT = `local k=KEYS[1]; local now=tonumber(ARGV[1]); local period=tonumber(ARGV[2]); local lim=tonumber(ARGV[3]);
redis.call('ZREMRANGEBYSCORE',k,0,now-period); local n=redis.call('ZCARD',k);
if n>=lim then return 0 end;
redis.call('ZADD',k,now,ARGV[4]); redis.call('PEXPIRE',k,period); return 1`;
function getHash(s){return crypto.createHash('sha256').update(String(s)).digest('hex').slice(0,40);}
function limiter(limit, windowMs=900000, opts={}) {
  if (!enabled) return rateLimit({limit,windowMs,standardHeaders:'draft-7',legacyHeaders:false,
    message:{error:'请求过于频繁，请稍后再试'}});
  return async (req,res,next)=>{
    try{
      // Both IP and identity are enforced independently, preventing account-by-account password spraying.
      const labels = [`ip:${req.ip}`];
      if(opts.user && req.user) labels.push(`user:${req.user.id}`);
      if(opts.email && typeof req.body?.email === 'string') labels.push(`email:${req.body.email.trim().toLowerCase().slice(0,190)}`);
      const suffix = opts.name || req.route?.path || req.path;
      for(const label of labels){
        const key=`tf:rl:${getHash(suffix)}:${getHash(label)}`;
        const result=await redis.eval(SCRIPT,1,key,Date.now(),windowMs,limit,`${Date.now()}-${crypto.randomUUID()}`);
        if(result !== 1){res.set('Retry-After',String(Math.ceil(windowMs/1000)));return res.status(429).json({error:'请求过于频繁，请稍后再试'});}
      }
      next();
    }catch(err){console.error('[limiter]',err.message);res.status(503).json({error:'安全验证暂时不可用，请稍后重试'});}
  };
}
module.exports = {limiter,redis};
