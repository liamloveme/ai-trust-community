'use strict';
// All donations are public receiving addresses only. The secret never enters MySQL or the browser.
const crypto = require('node:crypto');
const MAX_DONATIONS = 10;
const NETWORKS_BY_ASSET = require('../public/donation-networks');
const COINS = new Set(Object.keys(NETWORKS_BY_ASSET));
// Read-only legacy support for already-signed V2.4 configurations. New saves use the V2.5 allowlist.
const LEGACY_EVM_NETWORKS = new Set(['Ethereum', 'Base', 'Arbitrum', 'Polygon']);
const BASE58='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function isBase58Check(s) {
  try {
    let n=0n;
    for(const c of s){const i=BASE58.indexOf(c); if(i<0)return false;n=n*58n+BigInt(i);}
    let hex=n.toString(16);if(hex.length%2)hex='0'+hex;
    const lead=(s.match(/^1+/)||[''])[0].length;
    const decoded=Buffer.concat([Buffer.alloc(lead),Buffer.from(hex,'hex')]);
    if(decoded.length!==25)return false;
    if(![0,5].includes(decoded[0]))return false;
    const checksum=crypto.createHash('sha256').update(crypto.createHash('sha256').update(decoded.subarray(0,-4)).digest()).digest().subarray(0,4);
    return crypto.timingSafeEqual(checksum,decoded.subarray(-4));
  }catch{return false;}
}
function bech32Polymod(values) {
  const gen=[0x3b6a57b2,0x26508e6d,0x1ea119fa,0x3d4233dd,0x2a1462b3];let chk=1;
  for(const v of values){const b=chk>>>25;chk=((chk & 0x1ffffff)<<5)^v;for(let i=0;i<5;i++)if((b>>>i)&1)chk^=gen[i];}
  return chk>>>0;
}
function isBech32Bitcoin(s){
  if(typeof s!=='string'||s.length<14||s.length>90||s!==s.toLowerCase())return false;
  const sep=s.lastIndexOf('1');if(!s.startsWith('bc1')||sep!==2)return false;
  const alpha='qpzry9x8gf2tvdw0s3jn54khce6mua7l',data=[];
  for(const c of s.slice(sep+1)){const x=alpha.indexOf(c);if(x<0)return false;data.push(x);}
  if(data.length<7)return false;
  const version=data[0];if(version>16)return false;
  const hrp=[...('bc')].map(c=>c.charCodeAt(0));
  const check=bech32Polymod([...hrp.map(x=>x>>5),0,...hrp.map(x=>x&31),...data]);
  if(check!==(version===0?1:0x2bc830a3))return false;
  const payload=data.slice(1,-6);let bits=0,acc=0,bytes=[];
  for(const v of payload){acc=(acc<<5)|v;bits+=5;while(bits>=8){bits-=8;bytes.push((acc>>bits)&255);}}
  if(bits>=5||(acc & ((1<<bits)-1))!==0)return false;
  return version===0?[20,32].includes(bytes.length):(bytes.length>=2&&bytes.length<=40);
}
function decodeBase58(s) {
  if(typeof s!=='string'||!s||s.length>150)return null;
  let n=0n;
  for(const c of s){const i=BASE58.indexOf(c);if(i<0)return null;n=n*58n+BigInt(i);}
  let hex=n===0n?'':n.toString(16);
  if(hex.length%2)hex='0'+hex;
  const zeroes=(s.match(/^1+/)||[''])[0].length;
  return Buffer.concat([Buffer.alloc(zeroes),hex?Buffer.from(hex,'hex'):Buffer.alloc(0)]);
}
function isTronAddress(s) {
  if(typeof s!=='string'||!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(s))return false;
  const b=decodeBase58(s);
  if(!b||b.length!==25||b[0]!==0x41)return false;
  const digest=crypto.createHash('sha256').update(crypto.createHash('sha256').update(b.subarray(0,21)).digest()).digest();
  return crypto.timingSafeEqual(digest.subarray(0,4),b.subarray(21));
}
function isSolanaAddress(s){
  if(typeof s!=='string'||s.length<32||s.length>44)return false;
  const b=decodeBase58(s);
  return Boolean(b&&b.length===32&&b.some(x=>x!==0));
}
function validAddress(asset,network,address,{allowLegacy=false}={}){
  if(typeof address!=='string'||!address||address.length>100)return false;
  if(asset==='BTC')return network==='Bitcoin'&&(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)&&isBase58Check(address)||isBech32Bitcoin(address));
  if(!COINS.has(asset)||!(NETWORKS_BY_ASSET[asset]||[]).includes(network)){
    // Legacy records are never allowed in new writes, but must stay readable and HMAC-verifiable.
    return Boolean(allowLegacy&&['USDT','USDC'].includes(asset)&&LEGACY_EVM_NETWORKS.has(network)&&/^0x[0-9a-fA-F]{40}$/.test(address)&&!/^0x0{40}$/i.test(address));
  }
  if(['ERC20','BEP20','Base','Plasma'].includes(network))return /^0x[0-9a-fA-F]{40}$/.test(address)&&!/^0x0{40}$/i.test(address);
  if(network==='TRC20')return isTronAddress(address);
  if(network==='SOL')return isSolanaAddress(address);
  if(network==='Aptos')return /^0x[0-9a-fA-F]{1,64}$/.test(address)&&!/^0x0+$/i.test(address);
  return false;
}
function normalizeDonations(items,{allowLegacy=false}={}){
  if(!Array.isArray(items)||items.length>MAX_DONATIONS)throw Error('捐赠地址最多10项');
  const seen=new Set(), ids=new Set();
  return items.map((item,i)=>{
    if(!item||typeof item!=='object')throw Error('捐赠地址格式错误');
    const asset=String(item.asset||'').trim().toUpperCase(),network=String(item.network||'').trim(),address=String(item.address||'').trim();
    if(!COINS.has(asset)||!validAddress(asset,network,address,{allowLegacy}))throw Error(`第${i+1}项捐赠地址或对应网络不合法，请核对链及地址`);
    const id=typeof item.id==='string'&&/^[0-9a-f-]{36}$/i.test(item.id)?item.id:crypto.randomUUID();
    const key=`${asset}:${network}:${address.toLowerCase()}`;
    if(seen.has(key)||ids.has(id))throw Error('不能重复设置相同捐赠地址');
    seen.add(key);ids.add(id);return {id,asset,network,address};
  });
}
function signingKey(){const k=process.env.DONATION_CONFIG_HMAC_KEY||'';if(!/^[a-f0-9]{64,}$/i.test(k))throw Error('捐赠配置签名密钥缺失或格式错误');return Buffer.from(k,'hex');}
function signConfig(revision,items){return crypto.createHmac('sha256',signingKey()).update(JSON.stringify({revision,items})).digest('hex');}
function verifyConfig(revision,items,signature){
  if(typeof signature!=='string'||!/^[a-f0-9]{64}$/i.test(signature))return false;
  const expected=signConfig(revision,items);
  return crypto.timingSafeEqual(Buffer.from(expected,'hex'),Buffer.from(signature,'hex'));
}
module.exports={MAX_DONATIONS,NETWORKS_BY_ASSET,normalizeDonations,validAddress,signConfig,verifyConfig};
