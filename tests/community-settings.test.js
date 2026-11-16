'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {pinInput,canPin,normalizeContacts,publicContacts,contactsMac,verifyContacts}=require('../src/community-settings');
test('首页置顶仅超管，板块置顶允许两种管理员，普通会员均禁止',()=>{
 for(const role of ['super_admin','moderator','member'])for(const scope of ['home','section'])assert.equal(canPin({role},scope),role==='super_admin'||role==='moderator'&&scope==='section');
 assert.equal(canPin(null,'home'),false);assert.equal(canPin({role:'super_admin'},'other'),false);
});
test('置顶输入不能伪造范围、批量字段或字符串布尔值',()=>{
 assert.deepEqual(pinInput({scope:'section',pinned:false}),{scope:'section',pinned:false});
 for(const x of [null,[],{scope:'home',pinned:'true'},{scope:'all',pinned:true},{scope:'section',pinned:true,home_pinned:1}])assert.throws(()=>pinInput(x),{status:400});
});
test('联系方式允许四种独立类型，拒绝重复、超量、空启用值及控制字符',()=>{
 const item={type:'qq',value:' 123456 ',enabled:true};assert.equal(normalizeContacts({enabled:true,items:[item]}).items[0].value,'123456');
 for(const items of [[item,item],Array(5).fill(item),[{...item,value:' '}],[{...item,value:'abc\nxyz'}],[{...item,type:'javascript'}]])assert.throws(()=>normalizeContacts({enabled:true,items}),{status:400});
 assert.deepEqual(normalizeContacts({enabled:false,items:[{...item,value:'',enabled:false}]}).items[0].value,'');
});
test('公开配置关闭后不返回草稿，单项关闭后隐藏该项',()=>{
 const items=[{type:'qq',value:'public',enabled:true},{type:'x',value:'PRIVATE-DRAFT',enabled:false}];
 assert.deepEqual(publicContacts({enabled:false,items}),{enabled:false,items:[]});
 assert.deepEqual(publicContacts({enabled:true,items}),{enabled:true,items:[{type:'qq',value:'public'}]});
});
test('联系方式签名绑定版本、内容与用途，篡改时拒绝验证',()=>{
 const old=process.env.DONATION_CONFIG_HMAC_KEY;process.env.DONATION_CONFIG_HMAC_KEY='ab'.repeat(32);
 try{const c={enabled:true,items:[{type:'qq',value:'123456',enabled:true}]},mac=contactsMac(1,c);assert.equal(verifyContacts(1,c,mac),true);assert.equal(verifyContacts(2,c,mac),false);assert.equal(verifyContacts(1,{...c,enabled:false},mac),false);assert.equal(verifyContacts(1,c,'bad'),false);}finally{if(old===undefined)delete process.env.DONATION_CONFIG_HMAC_KEY;else process.env.DONATION_CONFIG_HMAC_KEY=old;}
});
