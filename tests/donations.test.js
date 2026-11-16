'use strict';
const test=require('node:test'), assert=require('node:assert/strict');
const {NETWORKS_BY_ASSET,normalizeDonations,validAddress,signConfig,verifyConfig}=require('../src/donations');
const btc='1BoatSLRHtKNngkdXEeobR76b53LETtpyT';
const evm='0x1111111111111111111111111111111111111111';
const tron='TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL';
const sol='So11111111111111111111111111111111111111112';
const aptos='0x1';
const k='d'.repeat(64);
test('V2.5 allowed networks are exact per currency; BTC has no multi-chain choices',()=>{
 assert.deepEqual(NETWORKS_BY_ASSET.BTC,['Bitcoin']);
 assert.deepEqual(NETWORKS_BY_ASSET.USDT,['TRC20','BEP20','ERC20','SOL','Aptos','Plasma']);
 assert.deepEqual(NETWORKS_BY_ASSET.USDC,['BEP20','ERC20','SOL','Aptos','Base']);
 assert.equal(validAddress('BTC','Bitcoin',btc),true);
 assert.equal(validAddress('BTC','ERC20',btc),false);
 assert.equal(validAddress('BTC','Ethereum',btc),false);
});
test('USDT TRC20 accepts checked Tron T-address but not a corrupt checksum',()=>{
 assert.equal(validAddress('USDT','TRC20',tron),true);
 assert.equal(validAddress('USDT','TRC20',tron.slice(0,-1)+(tron.at(-1)==='A'?'B':'A')),false);
 assert.equal(validAddress('USDC','TRC20',tron),false);
 assert.equal(validAddress('USDT','TRC20',evm),false);
});
test('SOL and Aptos address families validate; exclude invalid EVM/zero accounts',()=>{
 assert.equal(validAddress('USDT','SOL',sol),true);
 assert.equal(validAddress('USDC','SOL',sol),true);
 assert.equal(validAddress('USDT','SOL','11111111111111111111111111111111'),false);
 assert.equal(validAddress('USDC','Aptos',aptos),true);
 assert.equal(validAddress('USDT','Aptos',aptos),true);
 assert.equal(validAddress('USDT','Aptos','0x0'),false);
 assert.equal(validAddress('USDT','Aptos',evm),true);
 assert.equal(validAddress('USDC','Aptos','invalid'),false);
});
test('BEP20, ERC20, Base and Plasma are EVM shaped only for permitted assets',()=>{
 for(const [coin,network] of [['USDT','BEP20'],['USDT','ERC20'],['USDT','Plasma'],['USDC','BEP20'],['USDC','ERC20'],['USDC','Base']])assert.equal(validAddress(coin,network,evm),true,coin+'/'+network);
 for(const [coin,network] of [['USDT','Base'],['USDC','Plasma'],['USDC','Polygon'],['USDT','Arbitrum'],['USDC','Ethereum']])assert.equal(validAddress(coin,network,evm),false,coin+'/'+network);
 assert.equal(validAddress('USDT','ERC20','0x'+'0'.repeat(40)),false);
});
test('Strict writes reject invalid network/asset pairs; old V2.4 rows are read-only compatible',()=>{
 assert.deepEqual(normalizeDonations([]),[]);
 const a=normalizeDonations([{asset:'BTC',network:'Bitcoin',address:btc}]);assert.match(a[0].id,/^[a-f\d-]{36}$/);
 assert.deepEqual(normalizeDonations(a),a);
 assert.throws(()=>normalizeDonations([{asset:'USDC',network:'Polygon',address:evm}]),/对应网络不合法/);
 assert.throws(()=>normalizeDonations([{asset:'USDT',network:'Base',address:evm}]),/对应网络不合法/);
 const prev={id:require('node:crypto').randomUUID(),asset:'USDT',network:'Ethereum',address:evm};
 assert.throws(()=>normalizeDonations([prev]),/对应网络不合法/);
 assert.deepEqual(normalizeDonations([prev],{allowLegacy:true}),[prev]);
 assert.throws(()=>normalizeDonations(Array.from({length:11},()=>a[0])),/最多10项/);
 assert.throws(()=>normalizeDonations([a[0],a[0]]),/重复/);
});
test('HMAC keeps legacy data verifiable; any unsigned mutation fails closed',()=>{
 process.env.DONATION_CONFIG_HMAC_KEY=k;
 const entries=normalizeDonations([{asset:'BTC',network:'Bitcoin',address:btc},{asset:'USDT',network:'TRC20',address:tron}]);
 const mac=signConfig(1,entries); assert.equal(verifyConfig(1,entries,mac),true);
 assert.equal(verifyConfig(2,entries,mac),false);
 assert.equal(verifyConfig(1,[{...entries[0],address:btc}, {...entries[1],network:'BEP20'}],mac),false);
 assert.equal(verifyConfig(1,entries,'00'.repeat(32)),false);
 const old=normalizeDonations([{asset:'USDT',network:'Ethereum',address:evm}],{allowLegacy:true});
 const oldMac=signConfig(2,old);
 assert.equal(verifyConfig(2,normalizeDonations(old,{allowLegacy:true}),oldMac),true);
 process.env.DONATION_CONFIG_HMAC_KEY='a'.repeat(64);
 assert.equal(verifyConfig(1,entries,mac),false);
 delete process.env.DONATION_CONFIG_HMAC_KEY;
 assert.throws(()=>signConfig(1,entries),/签名密钥/);
});
