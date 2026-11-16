'use strict';
// SMTP is mandatory for production password recovery. Never return the token to the browser or log it.
let transport;
function configured(){return Boolean(process.env.SMTP_HOST&&process.env.SMTP_FROM&&process.env.PUBLIC_ORIGIN?.startsWith('https://')&&process.env.SMTP_USER&&process.env.SMTP_PASSWORD);}
async function sendPasswordReset(email, token){
 if(!configured())throw new Error('SMTP_NOT_CONFIGURED');
 if(!transport){const nodemailer=require('nodemailer');transport=nodemailer.createTransport({
  host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||465),
  secure:Number(process.env.SMTP_PORT||465)===465,requireTLS:true,
  auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD},
  tls:{minVersion:'TLSv1.2'},connectionTimeout:8000,greetingTimeout:8000,socketTimeout:10000
 });}
 const url=new URL('/',process.env.PUBLIC_ORIGIN);url.hash='reset='+token;
 await transport.sendMail({from:process.env.SMTP_FROM,to:email,subject:'AI交易守望站 · 重置登录密码',
  text:`有人请求重置此账号密码。请在 20 分钟内访问以下一次性链接：\n${url.href}\n\n如果不是你本人操作，请忽略本邮件。我们不会索取你的密码或 API Key。`,
  html:undefined});
}
module.exports={configured,sendPasswordReset};
