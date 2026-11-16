/* AI交易守望站 | V3.1 开源首发候选版全站前端。预览版仅模拟数据，正式版所有授权由服务端强制判定。 */
(() => {
'use strict';
const PREVIEW = window.__STANDALONE_PREVIEW__ === true;
const P = ['posts.review','posts.remove','comments.review','comments.remove','reports.review','appeals.review','users.view','users.mute','sections.manage','stickers.review','stickers.remove','audit.view'];
const PN = {'posts.review':'审核帖子','posts.remove':'下架帖子','comments.review':'审核评论','comments.remove':'隐藏评论','reports.review':'处理内容举报','appeals.review':'处理申诉','users.view':'查看用户','users.mute':'会员禁言','sections.manage':'管理社区栏目','stickers.review':'查看自定义表情','stickers.remove':'禁用/删除表情','audit.view':'查看审计日志'};
const CAT = {chat:'灌水闲聊',api:'API Key 交流',accounts:'模型账号',warning:'交易防骗',experience:'交易经验'};
function sectionTitle(x){if(!x)return '';if(!CAT[x.slug]||x.title!==CAT[x.slug])return x.title;return x.slug==='api'?'API Key · '+t('交流讨论'):t(x.title);}
const DEMO_PASSWORD='Demo123456!';
const previewResetTokens=new Map();

// Unicode emoji are rendered by each device's native emoji font (iOS shows native Apple glyphs).
// No Apple proprietary emoji images or third-party CDN assets are bundled.
const EMOJI_CATEGORIES=[
 {id:'recent',label:'最近',icon:'🕘',words:'最近 常用 历史',emojis:''},
 {id:'faces',label:'笑脸情绪',icon:'😀',words:'表情 笑脸 开心 高兴 喜欢 哭 难过 情绪',emojis:'😀 😃 😄 😁 😆 😅 😂 🤣 🥲 ☺️ 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😝 😜 🤪 🤨 🧐 🤓 😎 🥸 🤩 🥳 🙂‍↕️ 🙂‍↔️ 😏 😒 😞 😔 😟 😕 🙁 ☹️ 😣 😖 😫 😩 🥺 🥹 😢 😭 😮‍💨 😤 😠 😡 🤬 🤯 😳 🥵 🥶 😱 😨 😰 😥 😓 🤗 🤔 🫣 🤭 🫢 🫡 🤫 🫠 🤥 😶 😶‍🌫️ 😐 😑 🫤 🙄 😬 😮 😯 😲 🥱 😴 🤤 😪 😵 😵‍💫 🤐 🥴 🤢 🤮 🤧 😷 🤒 🤕 🤑 🤠 😈 👿 👹 👺 🤡 💩 👻 💀 ☠️ 👽 👾 🤖 🎃 😺 😸 😹 😻 😼 😽 🙀 😿 😾'},
 {id:'gestures',label:'手势人物',icon:'👍',words:'手势 人物 好 棒 赞 比心 鼓掌 皮肤 身体',emojis:'👋 🤚 🖐️ ✋ 🖖 🫱 🫲 🫳 🫴 👌 🤌 🤏 ✌️ 🤞 🫰 🤟 🤘 🤙 👈 👉 👆 🖕 👇 ☝️ 🫵 👍 👎 ✊ 👊 🤛 🤜 👏 🙌 🫶 👐 🤲 🤝 🙏 ✍️ 💅 🤳 💪 🦾 🦿 🦵 🦶 👂 🦻 👃 🧠 🫀 🫁 🦷 🦴 👀 👁️ 👅 👄 🫦 👶 🧒 👦 👧 🧑 👨 👩 🧔 👱 👴 👵 🙍 🙎 🙅 🙆 💁 🙋 🧏 🙇 🤦 🤷 👮 👷 💂 🕵️ 👩‍💻 👨‍💻 🧑‍💻 👩‍🏫 👨‍🏫 🧑‍🚀 👩‍⚕️ 👨‍⚕️ 🧙 🧚 🧛 🧜 🧝 🧞 🧟 💃 🕺 🧘 🧑‍🤝‍🧑 👭 👬 👫 🫂 👍🏻 👍🏼 👍🏽 👍🏾 👍🏿 👋🏻 👋🏼 👋🏽 👋🏾 👋🏿 👏🏻 👏🏼 👏🏽 👏🏾 👏🏿 🙏🏻 🙏🏼 🙏🏽 🙏🏾 🙏🏿 🫶🏻 🫶🏼 🫶🏽 🫶🏾 🫶🏿'},
 {id:'animals',label:'动物自然',icon:'🐼',words:'动物 猫 狗 小鸟 大自然 植物 花 天气',emojis:'🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐻‍❄️ 🐨 🐯 🦁 🐮 🐷 🐽 🐸 🐵 🙈 🙉 🙊 🐒 🐔 🐧 🐦 🐤 🐣 🐥 🦆 🦅 🦉 🦇 🐺 🐗 🐴 🦄 🫎 🐝 🪱 🐛 🦋 🐌 🐞 🐜 🪰 🪲 🦟 🦗 🕷️ 🦂 🐢 🐍 🦎 🦖 🦕 🐙 🦑 🦐 🦞 🦀 🐡 🐠 🐟 🐬 🐳 🐋 🦈 🦭 🐊 🐅 🐆 🦓 🦍 🦧 🐘 🦛 🦏 🐪 🐫 🦒 🦘 🦬 🐃 🐂 🐄 🐎 🐖 🐏 🐑 🦙 🐐 🦌 🐕 🐩 🦮 🐈 🐓 🦃 🦚 🦜 🦢 🦩 🕊️ 🐇 🦝 🦨 🦡 🦫 🦦 🦥 🐁 🐀 🐿️ 🦔 🐾 🐉 🐲 🌵 🎄 🌲 🌳 🌴 🪵 🌱 🌿 ☘️ 🍀 🎍 🪴 🎋 🍃 🍂 🍁 🍄 🪺 🪹 🐚 🪸 🌾 💐 🌷 🌹 🥀 🌺 🌸 🌼 🌻 🌞 🌝 🌛 🌜 ⭐ 🌟 ✨ ⚡ ☄️ 💥 🔥 🌈 ☀️ 🌤️ ⛅ 🌥️ ☁️ 🌦️ 🌧️ ⛈️ 🌩️ 🌨️ ❄️ ☃️ ⛄ 💨 💧 💦 ☔ 🌊'},
 {id:'food',label:'美食饮品',icon:'🍕',words:'食物 吃饭 水果 甜点 饮料 咖啡',emojis:'🍏 🍎 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🫐 🍈 🍒 🍑 🥭 🍍 🥥 🥝 🍅 🍆 🥑 🥦 🥬 🥒 🌶️ 🫑 🌽 🥕 🫒 🧄 🧅 🥔 🍠 🥐 🥯 🍞 🥖 🥨 🧀 🥚 🍳 🧈 🥞 🧇 🥓 🥩 🍗 🍖 🌭 🍔 🍟 🍕 🥪 🥙 🧆 🌮 🌯 🫔 🥗 🥘 🫕 🥫 🍝 🍜 🍲 🍛 🍣 🍱 🥟 🦪 🍤 🍙 🍚 🍘 🍥 🥠 🥮 🍢 🍡 🍧 🍨 🍦 🥧 🧁 🍰 🎂 🍮 🍭 🍬 🍫 🍿 🍩 🍪 🌰 🥜 🫘 🍯 🥛 🍼 🫖 ☕ 🍵 🧃 🥤 🧋 🧊 🍺 🍻 🥂 🍷 🥃 🍸 🍹 🍾'},
 {id:'activities',label:'活动娱乐',icon:'⚽',words:'活动 娱乐 运动 足球 游戏 音乐 节日',emojis:'⚽ 🏀 🏈 ⚾ 🥎 🎾 🏐 🏉 🥏 🎱 🪀 🏓 🏸 🏒 🏑 🥍 🏏 🥅 ⛳ 🪁 🛝 🏹 🎣 🤿 🥊 🥋 🎽 🛹 🛼 🛷 ⛸️ 🥌 🎿 ⛷️ 🏂 🪂 🏋️ 🤼 🤸 ⛹️ 🤺 🤾 🏌️ 🏇 🧗 🏄 🏊 🤽 🚣 🏅 🥇 🥈 🥉 🏆 🎖️ 🏵️ 🎗️ 🎫 🎟️ 🎪 🤹 🎭 🩰 🎨 🎬 🎤 🎧 🎼 🎹 🥁 🪘 🎷 🎺 🪗 🎸 🪕 🎻 🎲 ♟️ 🎯 🎳 🎮 🕹️ 🎰 🧩 🪅 🪩'},
 {id:'travel',label:'旅行地点',icon:'✈️',words:'旅行 汽车 飞机 城市 房子 地图 风景',emojis:'🚗 🚕 🚙 🚌 🚎 🏎️ 🚓 🚑 🚒 🚐 🛻 🚚 🚛 🚜 🛵 🏍️ 🛺 🚲 🛴 🚨 🚥 🚦 🛑 🚧 ⚓ ⛵ 🛶 🚤 🛳️ ⛴️ 🛥️ 🚢 ✈️ 🛩️ 🛫 🛬 🪂 💺 🚁 🚀 🛸 🚂 🚆 🚇 🚊 🚉 🚄 🚅 🚈 🚝 🚞 🚋 🚃 🚟 🚠 🚡 🚠 🗺️ 🧭 🏔️ ⛰️ 🌋 🗻 🏕️ 🏖️ 🏜️ 🏝️ 🏞️ 🏟️ 🏛️ 🏗️ 🏘️ 🏚️ 🏠 🏡 🏢 🏣 🏤 🏥 🏦 🏨 🏩 🏪 🏫 🏬 🏭 🏯 🏰 💒 🗼 🗽 ⛪ 🕌 🛕 🕍 ⛩️ 🕋 ⛲ ⛺ 🌁 🌃 🏙️ 🌄 🌅 🌆 🌇 🌉 ♨️ 🎠 🎡 🎢 💈 🎑 🛎️ 🧳'},
 {id:'objects',label:'物品科技',icon:'💻',words:'物品 电脑 手机 科技 邮件 金钱 钱 包 工具 文件',emojis:'⌚ 📱 📲 💻 ⌨️ 🖥️ 🖨️ 🖱️ 🖲️ 💽 💾 💿 📀 🧮 🎥 🎞️ 📹 📷 📸 📺 📻 🎙️ 🎚️ 🎛️ 🧭 ⏱️ ⏲️ ⏰ 🕰️ 🔋 🪫 🔌 💡 🔦 🕯️ 🪔 🧯 🛢️ 💸 💵 💴 💶 💷 🪙 💰 💳 💎 ⚖️ 🪜 🧰 🪛 🔧 🔨 ⚒️ 🛠️ ⛏️ 🪚 🔩 ⚙️ 🪤 🧱 ⛓️ 🪝 🧲 🔫 💣 🧨 🪓 🔪 🗡️ 🛡️ 🔐 🔒 🔓 🔑 🗝️ 🚪 🪑 🛋️ 🛏️ 🛌 🧸 🪆 🖼️ 🪞 🪟 🛍️ 🛒 🎁 🎈 🎀 🎊 🎉 🪄 🪀 🧴 🧼 🧽 🧹 🧺 🧻 🪣 🪥 🧷 🪡 🧵 🪢 🧶 👓 🕶️ 🥽 🥼 🦺 👔 👕 👖 🧣 🧤 🧥 🧦 👗 👘 🥻 🩱 👙 👚 👛 👜 👝 🎒 🩴 👞 👟 🥾 🥿 👠 👡 🩰 👢 👑 👒 🎩 🎓 🧢 ⛑️ 📿 💄 💍 💼 📝 ✏️ ✒️ 🖋️ 🖊️ 🖌️ 🖍️ 📚 📖 📒 📕 📗 📘 📙 📓 📔 📄 📃 📑 🗒️ 🗓️ 📆 📅 📈 📉 📊 📋 📌 📍 📎 🖇️ 📏 📐 ✂️ 🗃️ 🗂️ 🗑️ 🔍 🔎 📨 📩 ✉️ 📧 💌 📥 📤 📦 📫 📮 🗳️'},
 {id:'symbols',label:'符号爱心',icon:'❤️',words:'符号 爱心 喜欢 星星 对 错 警告 认证',emojis:'❤️ 🧡 💛 💚 💙 🩵 💜 🩷 🤎 🖤 🩶 🤍 💔 ❤️‍🔥 ❤️‍🩹 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟 ☮️ ✝️ ☪️ 🕉️ ☸️ ✡️ 🔯 🕎 ☯️ ☦️ 🛐 ⛎ ♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓ 🆔 ⚛️ 🉑 ☢️ ☣️ 📴 📳 🈶 🈚 🈸 🈺 🈷️ ✴️ 🆚 💮 🉐 ㊙️ ㊗️ 🈴 🈵 🈹 🈲 🅰️ 🅱️ 🆎 🆑 🅾️ 🆘 ❌ ⭕ 🛑 ⛔ 📛 🚫 💯 💢 ♨️ 🚷 🚯 🚳 🚱 🔞 📵 ❗ ❕ ❓ ❔ ‼️ ⁉️ ⚠️ 🚸 🔱 ⚜️ 🔰 ♻️ ✅ ☑️ ✔️ ❎ ✳️ ❇️ ❄️ ✨ ➕ ➖ ➗ ➰ ➿ 〽️ ✖️ 💲 💱 ©️ ®️ ™️ 🔚 🔙 🔛 🔝 🔜 🔠 🔡 🔢 🔣 🔤 🅿️ 🆗 🆕 🆙 🆒 🆓 0️⃣ 1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣ 8️⃣ 9️⃣ 🔟 🔴 🟠 🟡 🟢 🔵 🟣 🟤 ⚫ ⚪ 🟥 🟧 🟨 🟩 🟦 🟪 🟫 ⬛ ⬜ ▫️ ◽ ◻️ ◼️ ◾ 🔶 🔷 🔸 🔹 🔺 🔻 💠 🔘 🔲 🔳 🔈 🔉 🔊 🔇 📢 📣 🔔 🔕 🎵 🎶'},
 {id:'flags',label:'旗帜',icon:'🏳️',words:'国旗 旗帜 国家',emojis:'🏁 🚩 🎌 🏳️ 🏴 🏳️‍🌈 🏳️‍⚧️ 🇨🇳 🇭🇰 🇲🇴 🇹🇼 🇺🇸 🇨🇦 🇬🇧 🇫🇷 🇩🇪 🇮🇹 🇪🇸 🇵🇹 🇳🇱 🇧🇪 🇨🇭 🇸🇪 🇳🇴 🇫🇮 🇩🇰 🇮🇸 🇮🇪 🇦🇺 🇳🇿 🇯🇵 🇰🇷 🇸🇬 🇲🇾 🇹🇭 🇻🇳 🇵🇭 🇮🇩 🇮🇳 🇵🇰 🇦🇪 🇸🇦 🇹🇷 🇷🇺 🇺🇦 🇧🇷 🇦🇷 🇲🇽 🇿🇦 🇪🇬 🇳🇬 🇰🇪'}
];
const EMOJI_INDEX=[...new Set(EMOJI_CATEGORIES.flatMap(g=>g.emojis?g.emojis.split(' '):[]))];
const EMOJI_ALIASES={'😂':'笑哭 哈哈 开心','🤣':'爆笑','🥹':'感动','😭':'大哭','🥰':'爱心 喜欢','😍':'爱 喜欢','👍':'点赞 支持 赞','🙏':'感谢 拜托 合十','👏':'鼓掌','💪':'加油 力量','🤝':'合作 握手','💯':'满分 一百分','🔥':'火 热门','⚠️':'警告 注意','✅':'正确 通过 认可','❌':'错误 不行','🎉':'庆祝','🚀':'火箭 上涨','👀':'看看 关注','🫶':'比心','❤️':'爱心 红心','💰':'财富 金钱','📈':'上涨 股票','📉':'下跌 股票','💻':'电脑 科技','🤖':'机器人 AI','🛡️':'盾牌 安全 保护','🕵️':'调查 核查','😡':'愤怒 生气','🤔':'思考 问题','💬':'聊天 评论','📷':'照片 图片','☕':'咖啡'};
const EMOJI_DEFAULT=['😀','😂','🥰','👍','🙏','❤️','🎉','🔥','🤝','✅','😎','🤔','😭','🐼','🍕','🚀'];
const myStickers=[]; const mockStickerImages={};
let emojiRecent=(()=>{try{return JSON.parse(localStorage.getItem('tf_emoji_recent')||'[]').filter(x=>EMOJI_INDEX.includes(x)).slice(0,30);}catch{return [];}})();
const emojiTabs={};
const emojiSearch={};
let stickerTarget='';

const t = key => window.TrustI18n?.tr(key)||key;
const STATUS = {pending:'待审核',published:'已发布',rejected:'已驳回',removed:'已下架',hidden:'已隐藏',resolved:'已处理',dismissed:'已驳回',accepted:'已受理',denied:'未采纳'};
const $ = selector => document.querySelector(selector);
const h = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const utcDate=value=>typeof value==='string'&&/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d(?:\.\d+)?$/.test(value)?value.replace(' ','T')+'Z':value;
const when = value => {const d=new Date(utcDate(value));return Number.isNaN(d.getTime())?t('刚刚'):d.toLocaleDateString(window.TrustI18n?.locale()||'zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});};
const batchSelected=new Map();
const BATCH_CONFIG={
 posts:{resource:'posts',actions:[['published','批量批准'],['rejected','批量驳回']]},
 published:{resource:'posts',actions:[['removed','批量下架']]},
 comments:{resource:'comments',actions:[['published','批量通过'],['hidden','批量隐藏']]},
 commentmanage:{resource:'comments',actions:[['hidden','批量隐藏']]},
 reports:{resource:'reports',actions:[['resolved','批量标记已处理'],['dismissed','批量驳回举报']]},
 appeals:{resource:'appeals',actions:[['accepted','批量受理申诉'],['denied','批量驳回申诉']]},
 users:{resource:'users',actions:[['mute24h','批量禁言24小时'],['unmute','批量解除禁言']]},
 sections:{resource:'sections',actions:[['enabled','批量启用'],['disabled','批量停用']]},
 stickers:{resource:'stickers',actions:[['active','批量恢复'],['disabled','批量禁用'],['deleted','批量删除']]}
};
const BATCH_PERMISSIONS={posts:{published:'posts.review',rejected:'posts.review',removed:'posts.remove'},comments:{published:'comments.review',hidden:'comments.remove'},reports:{resolved:'reports.review',dismissed:'reports.review'},appeals:{accepted:'appeals.review',denied:'appeals.review'},users:{mute24h:'users.mute',unmute:'users.mute'},sections:{enabled:'sections.manage',disabled:'sections.manage'},stickers:{active:'stickers.remove',disabled:'stickers.remove',deleted:'stickers.remove'}};
const state = {returnTo:null,view:'home',type:'all',category:'',sort:'new',q:'',page:1,hasMore:false,items:[],stats:{posts:0,exposures:0,members:0},user:null,csrf:'',meta:{turnstileSitekey:''},translationCapabilities:null,adminTab:'overview',adminUserQ:'',adminUserRole:'',auditQ:'',auditPage:1,detail:null,translatedPost:null,donations:{revision:0,items:[]},sections:[],sectionSlug:'',uploaded:{public:[],private:[],comment:[]},uploadPending:0,busy:false};
let theme='light';try{theme=localStorage.getItem('tf_theme')==='dark'?'dark':'light';}catch{}
document.documentElement.dataset.theme=theme;
function toast(msg){const el=document.createElement('div');el.className='toast';el.textContent=t(msg);$('#toastArea').append(el);while($('#toastArea').children.length>2)$('#toastArea').firstElementChild.remove();setTimeout(()=>el.remove(),3200);}
function roleOk(permission){return state.user?.role==='super_admin'||(state.user?.role==='moderator'&&state.user.permissions?.includes(permission));}
function canManage(){return state.user?.role==='super_admin'||(state.user?.role==='moderator'&&state.user.permissions?.length>0);}
function roleBadge(role){const key=['member','moderator','super_admin'].includes(role)?role:'member';const title={member:'普通会员',moderator:'管理员',super_admin:'超级管理员'}[key];const icon={member:'◇',moderator:'✦',super_admin:'♛'}[key];return `<span class="identity-badge badge-${key}" title="${h(t(title))}">${icon} ${h(t(title))}</span>`;}
function emojiTools(target){return `<div class="editor-tools"><button type="button" class="tool-btn" data-action="emoji-toggle" data-target="${target}" aria-expanded="false" aria-controls="emoji-${target}" aria-label="打开表情选择器">😀 表情</button><span class="tool-hint">支持图片和 Emoji · 禁止上传视频</span><div class="emoji-picker" id="emoji-${target}" data-target="${target}" hidden><div class="emoji-top"><strong>选择表情</strong><span>设备原生 Emoji</span><button type="button" class="emoji-close" data-action="emoji-close" data-target="${target}" aria-label="收起表情选择器">×</button></div><div class="emoji-search-wrap"><span>⌕</span><input class="emoji-search" data-emoji-search="${target}" aria-label="搜索表情" type="search" placeholder="搜索：笑、爱心、点赞、动物…" /></div><div class="emoji-categories" id="emoji-tabs-${target}" role="group" aria-label="表情分类"></div><div class="emoji-grid" id="emoji-grid-${target}" role="group" aria-label="表情列表"></div><div class="my-sticker-toolbar" id="my-sticker-toolbar-${target}" hidden><label class="tool-btn">＋ 上传自定义表情<input type="file" data-sticker-upload="${target}" accept="image/jpeg,image/png,image/webp" hidden /></label><small>每张 ≤1 MB · 私人表情库仅自己可见 · 最多200张 · 禁止视频/GIF</small></div><div class="emoji-bottom">点击即可插入 · 支持最近使用和肤色手势</div></div></div>`;}
function emojiList(target){const tab=emojiTabs[target]||'recent';const q=(emojiSearch[target]||'').trim().toLowerCase();if(q){return EMOJI_INDEX.filter(e=>{const g=EMOJI_CATEGORIES.find(x=>x.emojis.split(' ').includes(e));return (e+' '+(EMOJI_ALIASES[e]||'')+' '+(g?.label||'')+' '+(g?.words||'')).toLowerCase().includes(q);});}if(tab==='recent')return emojiRecent.length?emojiRecent:EMOJI_DEFAULT;return (EMOJI_CATEGORIES.find(x=>x.id===tab)?.emojis||'').split(' ').filter(Boolean);}
async function loadMyStickers(){myStickers.splice(0,myStickers.length);if(!state.user)return;const data=await request('/api/stickers/mine');myStickers.push(...(data.items||[]));}
function renderEmoji(target,keepSearchFocus=false){const picker=$('#emoji-'+target);if(!picker)return;const tabs=$('#emoji-tabs-'+target);const mine=(emojiTabs[target]==='my');if(tabs){tabs.innerHTML=[...EMOJI_CATEGORIES,{id:'my',icon:'🖼️',label:'我的表情'}].map(g=>`<button type="button" class="emoji-category ${(emojiTabs[target]||'recent')===g.id?'selected':''}" data-action="emoji-category" data-target="${target}" data-category="${g.id}" title="${h(t(g.label))}" aria-label="${h(t(g.label))}" aria-pressed="${(emojiTabs[target]||'recent')===g.id}">${g.icon}</button>`).join('');}
const grid=$('#emoji-grid-'+target);if(grid){if(mine){grid.classList.add('sticker-personal-grid');grid.innerHTML=myStickers.length?myStickers.map(x=>`<div class="sticker-tile"><button type="button" data-action="sticker-insert" data-target="${target}" data-id="${h(x.id)}" ${x.status!=='active'?'disabled':''} title="${h(x.status==='active'?'插入我的表情':'该表情已禁用')}"><img src="${h(x.url)}" alt="自定义表情" loading="lazy"/></button><button type="button" class="sticker-remove" data-action="sticker-delete" data-id="${h(x.id)}" data-target="${target}" aria-label="删除我的表情">×</button></div>`).join(''):'<p class="emoji-no-results">你的私人表情库还是空的，上传一张图片试试</p>';}else{grid.classList.remove('sticker-personal-grid');const list=emojiList(target);grid.innerHTML=list.length?list.map(e=>`<button type="button" data-action="emoji-insert" data-target="${target}" data-emoji="${h(e)}" title="${h(EMOJI_ALIASES[e]||e)}" aria-label="插入 ${h(e)}">${e}</button>`).join(''):'<p class="emoji-no-results">没有找到符合的表情，试试其他词</p>';}}
const toolbar=$('#my-sticker-toolbar-'+target);if(toolbar)toolbar.hidden=!mine;const search=picker.querySelector('.emoji-search-wrap');if(search)search.hidden=mine;
if(!keepSearchFocus){const input=picker.querySelector('.emoji-search');if(input)input.value=emojiSearch[target]||'';}}
function insertSticker(target,id){const field=$('#'+target);if(!field)return;const value=`[sticker:${id}]`;field.setRangeText(value,field.selectionStart??field.value.length,field.selectionEnd??field.value.length,'end');field.dispatchEvent(new Event('input',{bubbles:true}));field.focus();}
function richBody(text){return h(text).replace(/\[sticker:([1-9]\d{0,17})\]/g,(_,id)=>{const sticker=PREVIEW?mock.stickers.find(x=>x.id===id):null;if(PREVIEW&&(!sticker||sticker.status!=='active'))return '<span class="sticker-unavailable">[表情已禁用]</span>';const url=PREVIEW?mockStickerImages[id]:`/api/stickers/${id}/image`;return `<img class="inline-sticker" src="${h(url||'')}" alt="用户表情" loading="lazy" />`;});}
function insertEmoji(target,emoji){const field=$('#'+target);if(!field)return;const pos=Number.isInteger(field.selectionStart)?field.selectionStart:field.value.length;const end=Number.isInteger(field.selectionEnd)?field.selectionEnd:pos;field.setRangeText(emoji,pos,end,'end');field.dispatchEvent(new Event('input',{bubbles:true}));field.focus();emojiRecent=[emoji,...emojiRecent.filter(x=>x!==emoji)].slice(0,30);try{localStorage.setItem('tf_emoji_recent',JSON.stringify(emojiRecent));}catch{}if((emojiTabs[target]||'recent')==='recent'&&!emojiSearch[target])renderEmoji(target);}

function closeModal(){$('#modalRoot').innerHTML='';}
function modal(title,body,clazz=''){ $('#modalRoot').innerHTML=`<div class="modal-shade"><section class="modal ${clazz}" role="dialog" aria-modal="true" aria-label="${h(title)}"><div class="modal-head"><h2>${h(title)}</h2><button class="modal-close" type="button" data-action="close-modal" aria-label="关闭">×</button></div><div class="modal-body">${body}</div></section></div>`;window.TrustI18n?.apply($('#modalRoot'));}
function fmt(n){return Number(n||0).toLocaleString('zh-CN');}
function postBadge(p){const x=state.sections.find(x=>x.slug===p.category);const title=x?sectionTitle(x):CAT[p.category]||'日常讨论';return p.type==='exposure'?`<span class="tag red">⚑ ${h(t('风险线索'))}</span>`:`<span class="tag blue">${h(title)}</span>`;}
const mock = (() => {
let next=110;
const ago = hrs => new Date(Date.now()-hrs*3600000).toISOString();
const users=[{id:'1',username:'站长',email:'root@demo.test',role:'super_admin',state:'active',mute_until:null,permissions:P.slice()},
 {id:'2',username:'值班版主',email:'mod@demo.test',role:'moderator',state:'active',mute_until:null,permissions:['posts.review','reports.review','comments.review','posts.remove','comments.remove','users.view','users.mute','sections.manage','stickers.review','stickers.remove']},
 {id:'3',username:'普通用户',email:'member@demo.test',role:'member',state:'active',mute_until:null,permissions:[]}];
const posts=[
 {id:'101',type:'exposure',category:'warning',title:'API Key 批量交易遇到交付争议，怎样保留证据更有效？',body:'示例案例：交易双方对交付的模型权限与有效期存在争议。建议保留付款订单、协商记录及接口响应的脱敏截图，发布前屏蔽密钥与手机号。该内容仅作演示，不指向任何真实商家。',author:'匿名用户',author_id:'3',anonymous:1,status:'published',views:1262,likes_count:63,comments_count:8,images_count:1,created_at:ago(2)},
 {id:'102',type:'discussion',category:'api',title:'如何检测大模型 API 中转服务的实际可用性？',body:'整理了几个比较实用的检查办法：确认接口地址、测试模型列表、按小额请求验证响应和计费逻辑，切忌直接暴露正式密钥。欢迎补充。',author:'云端观察者',author_role:'member',author_id:'3',status:'published',views:946,likes_count:54,comments_count:23,images_count:0,created_at:ago(4)},
 {id:'103',type:'discussion',category:'experience',title:'交易前必须做的 5 项核验，你做到了几项？',body:'不要单凭群内截图判断信誉。建议核验账号归属、交付边界、售后响应、历史评价与小额测试结果。',author:'接口研究员',author_role:'member',author_id:'3',status:'published',views:724,likes_count:41,comments_count:16,images_count:0,created_at:ago(7)},
 {id:'104',type:'exposure',category:'warning',title:'中间商收款后沟通中断：如何避免情绪化曝光？',body:'示例案例：买方付款后出现联系中断。应先核实是否存在时差或网络问题，保留完整证据，并通过客观事实描述事件。未经核查的指控应保持待审核状态。',author:'匿名用户',author_id:'3',anonymous:1,status:'published',views:1901,likes_count:72,comments_count:31,images_count:0,created_at:ago(11)},
 {id:'105',type:'discussion',category:'chat',title:'新人报到！大家主要在用哪种大模型服务？',body:'欢迎分享 API 调用经验、稳定性测试方法和避坑知识，注意不要把账号密码或密钥粘贴到公开帖子里。',author:'新手小李',author_role:'member',author_id:'3',status:'published',views:350,likes_count:18,comments_count:37,images_count:0,created_at:ago(15)},
 {id:'106',type:'discussion',category:'accounts',title:'订阅账号与按量 API 的成本怎么比较？',body:'如果业务用量波动较大，按量计费可能更灵活；固定高频使用时需结合额度和并发限制计算。欢迎交流实践。',author:'一只小模型',author_role:'member',author_id:'3',status:'published',views:612,likes_count:26,comments_count:13,images_count:0,created_at:ago(23)},
 {id:'107',type:'discussion',category:'api',title:'API 代理使用中，最容易忽视的权限风险是什么？',body:'建议使用最小权限的密钥，设置消费限额，并对不同业务分别生成独立密钥，降低误泄露后的影响。',author:'技术值班员',author_role:'member',author_id:'3',status:'published',views:883,likes_count:45,comments_count:19,images_count:0,created_at:ago(28)},
 {id:'108',type:'exposure',category:'warning',title:'关于一个尚在核查的付款纠纷线索',body:'这是一条仅在独立演示环境出现的待审案例，不会在正式环境公开。需要补充付款凭证、完整沟通记录和当事方回应。',author:'匿名用户',author_id:'3',anonymous:1,status:'pending',views:0,likes_count:0,comments_count:0,images_count:0,created_at:ago(1)}
];
posts.push({id:'109',type:'discussion',category:'api',title:'管理员公告：交易线索请先完成证据脱敏',body:'管理员示例公告：提交截图前请遮挡密钥、账户信息和交易双方敏感资料。内容审核不等于对任何指控事实的认定。',author:'值班版主',author_id:'2',author_role:'moderator',status:'published',views:231,likes_count:8,comments_count:1,images_count:0,created_at:ago(9)});
const comments={101:[{id:'1',body:'请注意对截图中的 Key 做遮挡处理。',author:'社区志愿者',author_role:'moderator',status:'published',created_at:ago(1)}],102:[{id:'2',body:'还应该设置接口用量告警。',author:'普通用户',author_role:'member',status:'published',created_at:ago(2)}]};
const reports=[{id:'51',target_type:'post',target_id:'104',reporter:'示例举报者',reason:'false_info',details:'示例：请求核对双方沟通时间线',status:'pending',created_at:ago(1)}];
const appeals=[{id:'61',post_id:'107',post_title:'API 代理使用中，最容易忽视的权限风险是什么？',applicant:'模拟申诉者',reason:'示例：需要补充证据或澄清描述',status:'pending',created_at:ago(4)}];
const audit=[{id:'1',actor:'站长',action:'forum.demo',target_type:'system',target_id:'0',details:'预览演示数据',created_at:ago(1)}];
const sections=[
{id:'1',slug:'chat',title:'灌水闲聊',kind:'discussion',icon:'☕',description:'自由聊天和互助',page_content:'',enabled:1,sort_order:10},
{id:'2',slug:'api',title:'API Key 交流',kind:'discussion',icon:'⚡',description:'模型接口交流',page_content:'',enabled:1,sort_order:20},
{id:'3',slug:'accounts',title:'模型账号',kind:'discussion',icon:'◈',description:'模型账号与订阅讨论',page_content:'',enabled:1,sort_order:30},
{id:'4',slug:'warning',title:'交易防骗',kind:'exposure',icon:'🛡',description:'审核后的交易风险线索',page_content:'',enabled:1,sort_order:40},
{id:'5',slug:'experience',title:'交易经验',kind:'discussion',icon:'◇',description:'经验分享',page_content:'',enabled:1,sort_order:50}];
const stickers=[];
const donationsStore={revision:0,items:[]};
const myUser = () => users.find(x=>state.user?.id===x.id);
function cryptoSafeRandom(){return Math.random().toString(36).slice(2)+Date.now().toString(36);}
function requireMock(permission){if(!roleOk(permission))throw Error('没有对应后台管理权限（演示）');}
function requireMockWrite(){if(!state.user)throw Error('请先登录');if(state.user.mute_until&&new Date(state.user.mute_until).getTime()>Date.now())throw Error('此账号已被禁言');}

function checkOwnPreviewStickers(body){const ids=[...new Set([...String(body||'').matchAll(/\[sticker:([1-9]\d{0,17})\]/g)].map(x=>x[1]))];if(ids.length>20)throw Error('每篇最多使用20个私人表情');if(ids.some(id=>!stickers.some(s=>s.id===id&&s.owner_id===state.user?.id&&s.status==='active')))throw Error('此表情不属于你或已被禁用');}
function itemResult(p){return {...p,images_count:p.images_count||0};}
async function api(url, options={}) {
const method=options.method||'GET', data=options.body && !(options.body instanceof FormData)?JSON.parse(options.body):options.body;
const u=new URL(url,'http://demo.local'); const path=u.pathname;

if(path==='/api/site/donations')return {revision:donationsStore.revision,items:donationsStore.items.map(x=>({...x}))};
if(path==='/api/admin/donations'&&method==='GET'){
  if(state.user?.role!=='super_admin')throw Error('仅超级管理员有权访问捐赠配置');
  return {revision:donationsStore.revision,items:donationsStore.items.map(x=>({...x}))};
}
if(path==='/api/admin/donations'&&method==='POST'){
  if(state.user?.role!=='super_admin')throw Error('无权编辑捐赠地址');
  if(data.password!==(state.user.demoPassword||DEMO_PASSWORD))throw Error('超级管理员密码验证失败');
  if(data.revision!==donationsStore.revision)throw Error('配置版本冲突，请重新加载');
  if(!Array.isArray(data.items)||data.items.length>10)throw Error('最多10条捐赠地址');
  if(data.items.some(it=>!DONATION_NETWORKS_BY_ASSET[it.asset]?.includes(it.network)))throw Error('币种与网络不匹配，请重新选择');
  const normalized=data.items.map((it,i)=>{
    const evm=/^0x[0-9a-fA-F]{40}$/.test(it.address)&&!/^0x0{40}$/i.test(it.address);
    const btc=/^(bc1[a-z0-9]{11,80}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(it.address);
    const tron=/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(it.address);
    const sol=/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(it.address);
    const aptos=/^0x[0-9a-fA-F]{1,64}$/.test(it.address)&&!/^0x0+$/i.test(it.address);
    const addressShape=it.asset==='BTC'?btc:(['BEP20','ERC20','Base','Plasma'].includes(it.network)?evm:it.network==='TRC20'?tron:it.network==='SOL'?sol:it.network==='Aptos'?aptos:false);
    if(!DONATION_NETWORKS_BY_ASSET[it.asset]?.includes(it.network)||!addressShape)throw Error(`第${i+1}项地址或网络信息不正确`);
    return {id:it.id||`${next++}-demo`,asset:it.asset,network:it.network,address:it.address};
  });
  donationsStore.items=normalized;donationsStore.revision++;adminLog('donations.update','site_setting','donations');
  return {revision:donationsStore.revision,items:normalized};
}
// Only a genuinely authored offline demonstration translation is available for one sample post.
let translationMatch=path.match(/^\/api\/posts\/(\d+)\/translate$/);
if(translationMatch&&method==='POST'){
  const sample={en:{title:'Hello, newcomers! Which AI model services do you mainly use?',body:'Please share your API experiences, stability testing methods and safety tips. Do not post passwords or secret keys publicly.'},es:{title:'¡Hola a todos! ¿Qué servicios de modelos de IA utilizan?',body:'Compartan sus experiencias con las API, las pruebas de estabilidad y los consejos de seguridad. No publiquen contraseñas ni claves secretas.'},ja:{title:'初心者です！皆さんは主にどのAIモデルサービスを使っていますか？',body:'API利用経験や安定性テスト、安全対策を共有しましょう。パスワードや秘密鍵は投稿しないでください。'}};
  if(translationMatch[1]!=='105'||!sample[data.target])throw Error('离线预览仅提供示例帖 105 的英语、西班牙语、日语演示译文；其他帖子需部署 LibreTranslate 后实际翻译。');
  return {translated:{...sample[data.target],lang:data.target,source:'demo',provider:'Offline demo'},fromCache:false};
}
if(path==='/api/stickers/mine'){if(!state.user)throw Error('请先登录');return {items:stickers.filter(x=>x.owner_id===state.user.id&&x.status!=='deleted').map(x=>({...x,url:mockStickerImages[x.id]}))};}
if(path==='/api/stickers/upload'&&method==='POST'){requireMockWrite();const file=data.get('image');if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>1048576)throw Error('自定义表情仅支持1MB以内的静态 JPG/PNG/WebP');if(stickers.filter(x=>x.owner_id===state.user.id&&x.status!=='deleted').length>=200)throw Error('私人表情库最多200张');const id=String(next++);mockStickerImages[id]=URL.createObjectURL(file);const x={id,owner_id:state.user.id,owner:state.user.username,status:'active',label:'自定义表情',created_at:new Date().toISOString()};stickers.unshift(x);adminLog('sticker.upload','sticker',id,{owner_id:state.user.id,bytes:file.size,target_name:state.user.username});return {id,url:mockStickerImages[id],status:'active'};}
let sm=path.match(/^\/api\/stickers\/(\d+)\/delete$/);if(sm){const x=stickers.find(z=>z.id===sm[1]);if(!x||x.owner_id!==state.user?.id)throw Error('只能删除自己的表情');x.status='deleted';return {ok:true};}
if(path==='/api/admin/stickers'){if(!roleOk('stickers.review')&&!roleOk('stickers.remove'))throw Error('无表情包治理权限');return {items:stickers.filter(x=>x.status!=='deleted'&&(state.user.role==='super_admin'||users.find(u=>u.id===x.owner_id)?.role==='member')).map(x=>({...x,owner_role:users.find(u=>u.id===x.owner_id)?.role,url:mockStickerImages[x.id]}))};}
sm=path.match(/^\/api\/admin\/stickers\/(\d+)\/status$/);if(sm){requireMock('stickers.remove');const x=stickers.find(z=>z.id===sm[1]);if(!x||x.status==='deleted')throw Error('表情不存在');const owner=users.find(u=>u.id===x.owner_id);if(state.user.role!=='super_admin'&&owner?.role!=='member')throw Error('普通管理员不能处理管理员的表情');if(!['disabled','active','deleted'].includes(data.status))throw Error('无效的处理状态');const oldStatus=x.status;x.status=data.status;adminLog('sticker.'+data.status,'sticker',x.id,{before_status:oldStatus,status:data.status,owner_id:x.owner_id,target_name:owner?.username});return {ok:true};}
if(path==='/api/sections')return {items:sections.filter(x=>x.enabled).map(x=>({...x}))};
if(path==='/api/meta')return {permissions:P,turnstileSitekey:'',maxUploadMb:5,maxImagesPerType:20,maxCommentImages:20,maxStickerMb:1};
if(path==='/api/auth/me')return {user:state.user,csrf:'demo-csrf'};
if(path==='/api/auth/password/forgot' && method==='POST'){
  const email=String(data.email||'').trim().toLowerCase();
  const found=users.find(x=>x.email===email&&x.state==='active');
  let demoToken=null;
  if(found){demoToken='demo-'+cryptoSafeRandom();previewResetTokens.set(demoToken,found.id);}
  return {message:'如果该邮箱已注册，你将收到重置邮件。',demoToken};
}
if(path==='/api/auth/password/reset'&&method==='POST'){
  const id=previewResetTokens.get(data.token);if(!id)throw Error('重置链接无效或已使用');
  if(typeof data.newPassword!=='string'||data.newPassword.length<10||data.newPassword.length>128)throw Error('新密码长度需为10-128位');
  const found=users.find(x=>x.id===id);found.demoPassword=data.newPassword;previewResetTokens.delete(data.token);
  if(state.user?.id===id)state.user=null;
  return {ok:true,message:'已修改密码，请重新登录'};
}
if(path==='/api/auth/password/change'&&method==='POST'){
  const found=myUser();if(!found)throw Error('请先登录');
  if(data.currentPassword!==(found.demoPassword||DEMO_PASSWORD))throw Error('当前密码错误');
  if(typeof data.newPassword!=='string'||data.newPassword.length<10||data.newPassword.length>128||data.newPassword===data.currentPassword)throw Error('新密码必须是不同的10-128位密码');
  found.demoPassword=data.newPassword;
  adminLog('account.password_changed','user',found.id,{target_name:found.username});
  return {ok:true,message:'密码修改成功'};
}
if(path==='/api/auth/login'){
 const found=users.find(x=>x.email===String(data.email||'').toLowerCase());
 if(!found||data.password!==(found.demoPassword||DEMO_PASSWORD))throw Error('演示账号或密码错误。请查看下方演示登录说明。');
 if(found.state!=='active')throw Error('演示账号不可用');
 state.user={...found};return {user:state.user,csrf:'demo-csrf'};
}
if(path==='/api/auth/register'){
 if(users.some(x=>x.email===data.email||x.username===data.username))throw Error('昵称或邮箱已使用（演示环境）');
 const found={id:String(next++),username:data.username,email:data.email,role:'member',state:'active',mute_until:null,demoPassword:data.password,permissions:[]};users.push(found);state.user={...found};return {user:found,csrf:'demo-csrf'};
}
if(path==='/api/auth/logout'){state.user=null;return {ok:true};}
if(path==='/api/stats')return {posts:posts.filter(x=>x.status==='published').length,exposures:posts.filter(x=>x.type==='exposure'&&x.status==='published').length,members:users.length};
if(path==='/api/posts/mine')return {items:posts.filter(x=>x.author_id===state.user?.id)};
if(path==='/api/posts' && method==='GET'){
 let a=posts.filter(x=>x.status==='published');
 if(u.searchParams.get('type'))a=a.filter(x=>x.type===u.searchParams.get('type'));
 if(u.searchParams.get('category'))a=a.filter(x=>x.category===u.searchParams.get('category'));
 const q=(u.searchParams.get('q')||'').toLocaleLowerCase();
 if(q)a=a.filter(x=>q.trim().split(/\s+/).every(term=>[x.title,x.body,x.author,x.category].join(' ').toLocaleLowerCase().includes(term)));
 a.sort((x,y)=>u.searchParams.get('sort')==='hot'?y.likes_count-x.likes_count:new Date(y.created_at)-new Date(x.created_at));
 const page=Number(u.searchParams.get('page')||1);return {items:a.slice((page-1)*15,page*15).map(itemResult),hasMore:a.length>page*15,page};
}
if(path==='/api/posts'&&method==='POST'){requireMockWrite();if(!sections.some(x=>x.slug===data.category&&x.enabled&&x.kind!=='page'))throw Error('栏目不存在或已关闭');if((data.publicImages||[]).length>20||(data.privateEvidence||[]).length>20)throw Error('每类最多上传20张图片');
 checkOwnPreviewStickers(data.body);const p={id:String(next++),...data,author_id:state.user.id,author:data.anonymous?'匿名用户':state.user.username,author_role:data.anonymous?'member':state.user.role,status:data.type==='exposure'||data.publicImages?.length||data.privateEvidence?.length?'pending':'published',views:0,likes_count:0,comments_count:0,images_count:data.publicImages?.length||0,created_at:new Date().toISOString()};posts.unshift(p);return {id:p.id,status:p.status,message:p.status==='pending'?'提交成功，等待审核':'发布成功'};
}
if(path==='/api/upload'&&method==='POST'){requireMockWrite();
 const file=data.get('image');if(!file)throw Error('未选择图片');
 if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5*1024*1024)throw Error('仅允许 5 MB 以内静态图片');
 const id=String(next++);mockImages[id]=URL.createObjectURL(file);return {id,url:mockImages[id],purpose:data.get('purpose')};
}
if(path.startsWith('/api/posts/')&&method==='GET'){
 const id=path.split('/')[3],p=posts.find(x=>x.id===id);if(!p)throw Error('帖子不存在');
 if(p.status!=='published'&&p.author_id!==state.user?.id&&!roleOk('posts.review')&&!roleOk('posts.remove'))throw Error('帖子尚未公开');
 p.views++;const actualAuthorRole=users.find(u=>u.id===p.author_id)?.role||'member';const isOwner=state.user?.id===p.author_id;const mayReview=roleOk('posts.review')&&(state.user?.role==='super_admin'||actualAuthorRole==='member');return {post:{...p,author_role:p.author_role||(p.anonymous?'member':actualAuthorRole)},attachments:[...(p.publicImages||[]).map(id=>({id,purpose:'public',url:mockImages[id]})),...((isOwner||mayReview)?(p.privateEvidence||[]).map(id=>({id,purpose:'private',url:mockImages[id]})):[])],comments:comments[id]||[]};
}
let m=path.match(/^\/api\/posts\/(\d+)\/like$/);if(m){const p=posts.find(x=>x.id===m[1]);p.likes_count++;return {liked:true,likes:p.likes_count};}
m=path.match(/^\/api\/posts\/(\d+)\/comments$/);if(m){requireMockWrite();if((data.images||[]).length>20)throw Error('评论最多20张图片');checkOwnPreviewStickers(data.body);const p=posts.find(x=>x.id===m[1]);const c={id:String(next++),body:data.body,author:state.user.username,author_role:state.user.role,images:(data.images||[]).map(id=>({id,url:mockImages[id]})),status:p.type==='exposure'||data.images?.length?'pending':'published',created_at:new Date().toISOString()};(comments[p.id]??=[]).push(c);return c;}
if(path==='/api/reports'&&method==='POST'){reports.unshift({id:String(next++),...data,reporter:state.user.username,status:'pending',created_at:new Date().toISOString()});return {message:'举报已提交'};}
if(path==='/api/appeals'&&method==='POST'){const p=posts.find(x=>x.id===data.postId);appeals.unshift({id:String(next++),post_id:data.postId,post_title:p?.title||'',applicant:state.user.username,reason:data.reason,status:'pending',created_at:new Date().toISOString()});return {message:'申诉已提交'};}
if(path==='/api/admin/sections'&&method==='GET'){requireMock('sections.manage');return {items:sections.map(x=>({...x}))};}
if(path==='/api/admin/posts'){requireMock('posts.remove');return {items:posts.filter(x=>x.status==='published'&&(state.user.role==='super_admin'||users.find(u=>u.id===x.author_id)?.role==='member'))};}
if(path==='/api/admin/comments/published'){requireMock('comments.remove');return {items:Object.entries(comments).flatMap(([id,items])=>items.filter(x=>x.status==='published'&&(state.user.role==='super_admin'||x.author_role!=='moderator')).map(x=>({...x,post_id:id,post_title:posts.find(p=>p.id===id)?.title}))) };}
if(path==='/api/admin/queue'){requireMock('posts.review');return {items:posts.filter(x=>x.status==='pending'&&(state.user.role==='super_admin'||users.find(u=>u.id===x.author_id)?.role==='member'))};}
m=path.match(/^\/api\/admin\/comments\/(\d+)\/context$/);if(m){requireMock('comments.review');const entry=Object.entries(comments).find(([,list])=>list.some(c=>c.id===m[1]));if(!entry)throw Error('评论不存在');const c=entry[1].find(x=>x.id===m[1]),p=posts.find(x=>x.id===entry[0]);return {comment:{...c,images:c.images||[]},post:{id:p.id,title:p.title,body:p.body,status:p.status}};}
if(path==='/api/admin/comments'){requireMock('comments.review');return {items:Object.entries(comments).flatMap(([id,c])=>c.filter(x=>x.status==='pending'&&(state.user.role==='super_admin'||x.author_role==='member')).map(x=>({...x,post_id:id,post_title:posts.find(p=>p.id===id)?.title}))) };}
if(path==='/api/admin/reports'){requireMock('reports.review');return {items:reports.filter(x=>x.status==='pending')};}
if(path==='/api/admin/appeals'){requireMock('appeals.review');return {items:appeals.filter(x=>x.status==='pending')};}
if(path==='/api/admin/users'){
 if(!roleOk('users.view')&&!roleOk('users.mute'))throw Error('没有查看用户的权限');
 const q=(u.searchParams.get('q')||'').trim().toLowerCase(),role=u.searchParams.get('role')||'';
 let found=users.filter(x=>(!role||x.role===role)&&(!q||x.id===q||x.username.toLowerCase().includes(q)||(state.user?.role==='super_admin'&&x.email.toLowerCase().includes(q))));
 return {items:found.map(x=>({...x,email:state.user?.role==='super_admin'?x.email:null})),availablePermissions:P};}

if(path==='/api/admin/audit'){
 if(!['super_admin','moderator'].includes(state.user?.role))throw Error('只有管理员可以查看日志');const q=(u.searchParams.get('q')||'').toLowerCase(),page=Number(u.searchParams.get('page')||1);
 const matched=audit.filter(x=>(state.user.role==='super_admin'||x.actor_id===state.user.id)&&(!q||[x.actor,x.action,x.target_name,x.target_id,x.summary].some(z=>String(z||'').toLowerCase().includes(q))));
 return {items:matched.slice((page-1)*50,page*50),page,hasMore:matched.length>page*50};}
function adminLog(action,type,id,details={}){
 const target=type==='user'?users.find(x=>x.id===id):null;
 audit.unshift({id:String(next++),actor:state.user.username,actor_id:state.user.id,actor_name:state.user.username,
 actor_role:state.user.role,action,target_type:type,target_id:String(id),target_name:target?.username||details.target_name||'',
 summary:action,details,request_ip:'127.0.0.0/24',request_id:'demo-'+next,created_at:new Date().toISOString()});}

if(path==='/api/admin/batch'&&method==='POST'){
 const config=BATCH_CONFIG;
 const valid=Object.values(config).some(c=>c.resource===data.resource&&c.actions.some(([a])=>a===data.action));
 if(!valid||!Array.isArray(data.ids)||data.ids.length<1||data.ids.length>100||data.ids.some(id=>typeof id!=='string'||!/^[1-9]\d{0,17}$/.test(id))||new Set(data.ids).size!==data.ids.length)throw Error('无效的批量操作或记录ID');
 if(typeof data.note!=='string'||data.note.trim().length<5||data.note.trim().length>500)throw Error('必须填写5-500字理由');
 requireMock(BATCH_PERMISSIONS[data.resource][data.action]);
 const batchId='demo-'+cryptoSafeRandom(),results=[];
 for(const id of data.ids){try{
  let row,authorRole='member',oldStatus=null;
  if(data.resource==='posts'){row=posts.find(x=>x.id===id);authorRole=users.find(u=>u.id===row?.author_id)?.role||row?.author_role||'member';oldStatus=row?.status;
   if(!row||!(data.action==='removed'?oldStatus==='published':oldStatus==='pending'))throw Error('帖子状态不适用');
   if(data.action==='published'&&(row.type==='exposure'||row.images_count||row.publicImages?.length||row.privateEvidence?.length)&&data.reviewedEvidence!==true)throw Error('须核验举报曝光与证据');
   if(state.user.role!=='super_admin'&&authorRole!=='member')throw Error('不能审核管理员帖子');row.status=data.action;
  }else if(data.resource==='comments'){
   for(const a of Object.values(comments))if(!row)row=a.find(c=>c.id===id);
   oldStatus=row?.status;if(!row||!(data.action==='published'?oldStatus==='pending':['pending','published'].includes(oldStatus)))throw Error('评论状态不适用');
   if(state.user.role!=='super_admin'&&row.author_role!=='member')throw Error('无权操作此评论');
   if(data.action==='published'&&data.reviewedEvidence!==true)throw Error('批量通过评论须确认核验');row.status=data.action;
  }else if(data.resource==='reports'){row=reports.find(x=>x.id===id);oldStatus=row?.status;if(oldStatus!=='pending')throw Error('举报已处理');row.status=data.action;
  }else if(data.resource==='appeals'){row=appeals.find(x=>x.id===id);oldStatus=row?.status;if(oldStatus!=='pending')throw Error('申诉已处理');row.status=data.action;
   if(data.action==='accepted'){const p=posts.find(x=>x.id===row.post_id);if(p&&['rejected','removed'].includes(p.status))p.status='pending';}
  }else if(data.resource==='users'){row=users.find(x=>x.id===id);if(!row||row.id===state.user.id||row.role==='super_admin'||(state.user.role!=='super_admin'&&row.role!=='member'))throw Error('无权禁言该身份');oldStatus=row.mute_until;row.mute_until=data.action==='mute24h'?new Date(Date.now()+86400000).toISOString():null;row.mute_reason=data.note;
  }else if(data.resource==='stickers'){row=stickers.find(x=>x.id===id);if(!row||row.status==='deleted'||(state.user.role!=='super_admin'&&users.find(u=>u.id===row.owner_id)?.role!=='member'))throw Error('无权处理该表情');oldStatus=row.status;row.status=data.action;
  }else if(data.resource==='sections'){row=sections.find(x=>x.id===id);if(!row)throw Error('栏目不存在');oldStatus=row.enabled;row.enabled=data.action==='enabled'?1:0;}
  adminLog(data.resource==='users'?'user.'+(data.action==='mute24h'?'mute':'unmute'):({posts:'post',comments:'comment',reports:'report',appeals:'appeal',stickers:'sticker',sections:'section'}[data.resource])+'.'+data.action,data.resource.slice(0,-1),id,{batch_id:batchId,note:data.note,before_status:oldStatus,status:data.action,reviewed_evidence:!!data.reviewedEvidence});
  results.push({id,ok:true});
 }catch(e){results.push({id,ok:false,error:e.message});}}
 return {batchId,requested:data.ids.length,succeeded:results.filter(r=>r.ok).length,failed:results.filter(r=>!r.ok).length,results};
}
m=path.match(/^\/api\/admin\/posts\/(\d+)\/review$/);
if(m){const p=posts.find(x=>x.id===m[1]);if(!p||!roleOk(data.decision==='removed'?'posts.remove':'posts.review'))throw Error('无权审核该帖子');if(state.user.role!=='super_admin'&&users.find(x=>x.id===p.author_id)?.role!=='member')throw Error('普通管理员不能处理管理员的帖子');const beforeStatus=p.status;p.status=data.decision;adminLog('post.'+data.decision,'post',p.id,{note:data.note,before_status:beforeStatus,status:data.decision,target_name:p.title});return {ok:true};}
m=path.match(/^\/api\/admin\/comments\/(\d+)\/review$/);
if(m){requireMock(data.decision==='hidden'?'comments.remove':'comments.review');for(const a of Object.values(comments)){const c=a.find(x=>x.id===m[1]);if(c){if(state.user.role!=='super_admin'&&['moderator','super_admin'].includes(c.author_role))throw Error('普通管理员不能处理管理员的评论');const beforeStatus=c.status;c.status=data.decision;adminLog('comment.'+data.decision,'comment',c.id,{note:data.note,before_status:beforeStatus,status:data.decision,target_name:c.author,excerpt:c.body.slice(0,100)});return {ok:true};}}throw Error('评论不存在');}
m=path.match(/^\/api\/admin\/reports\/(\d+)\/review$/);
if(m){requireMock('reports.review');const r=reports.find(x=>x.id===m[1]);r.status=data.status;adminLog('report.'+data.status,'report',r.id,{note:data.note,status:data.status,target_name:r.reason,related_id:r.target_id});return {ok:true};}
m=path.match(/^\/api\/admin\/appeals\/(\d+)\/review$/);
if(m){requireMock('appeals.review');const a=appeals.find(x=>x.id===m[1]);a.status=data.status;adminLog('appeal.'+data.status,'appeal',a.id,{note:data.note,status:data.status,post_id:a.post_id,target_name:a.applicant});if(data.status==='accepted'){const p=posts.find(x=>x.id===a.post_id);if(['rejected','removed'].includes(p?.status))p.status='pending';}return {ok:true};}
m=path.match(/^\/api\/admin\/users\/(\d+)\/permissions$/);
if(m){if(state.user.role!=='super_admin')throw Error('只有超级管理员可以设置权限');const x=users.find(z=>z.id===m[1]);if(!x||x.role==='super_admin')throw Error('不能更改超管');if(!['member','moderator'].includes(data.role)||data.permissions.some(p=>!P.includes(p)))throw Error('非法管理权限');if(data.role==='moderator'&&!data.permissions.length)throw Error('任命管理员须至少授予一项权限');const beforeRole=x.role,beforePerms=[...x.permissions];x.role=data.role;x.permissions=data.role==='moderator'?data.permissions:[];
 if(state.user?.id===x.id)state.user={...x};adminLog('user.permissions_changed','user',x.id,{before_role:beforeRole,role:data.role,before_permissions:beforePerms,permissions:x.permissions,target_name:x.username});return {ok:true};}
m=path.match(/^\/api\/admin\/users\/(\d+)\/mute$/);
if(m){requireMock('users.mute');const x=users.find(u=>u.id===m[1]);if(!x||x.role==='super_admin'||(state.user.role!=='super_admin'&&x.role!=='member'))throw Error('无权禁言该用户');const secs={'1h':3600,'24h':86400,'7d':604800,'permanent':10**11,'unmute':0,'custom':-1}[data.duration];
 if(secs===undefined)throw Error('时长无效');if(data.duration!=='unmute'&&String(data.reason||'').trim().length<5)throw Error('请填写至少5个字的理由');
 const until=secs===-1?new Date(data.until):secs?new Date(Date.now()+secs*1000):null;
 if(secs===-1&&(!/\d{4}-\d\d-\d\dT\d\d:\d\d:00Z/.test(data.until)||!Number.isFinite(until.getTime())||until.getTime()<=Date.now()+60000||until.getTime()>Date.now()+5*366*86400000))throw Error('请选择未来五年内精确到分钟的禁言结束时间');
 const beforeUntil=x.mute_until;x.mute_until=until?until.toISOString():null;x.mute_reason=data.reason||'';
 adminLog(data.duration==='unmute'?'user.unmute':'user.mute','user',x.id,{duration:data.duration,until:x.mute_until,before_until:beforeUntil,reason:data.reason,target_name:x.username});return {ok:true};}
if(path==='/api/admin/sections'&&method==='POST'){requireMock('sections.manage');if(sections.some(x=>x.slug===data.slug))throw Error('标识重复');const x={...data,id:String(next++),enabled:Number(data.enabled)};sections.push(x);adminLog('section.create','section',x.id);return {id:x.id};}
m=path.match(/^\/api\/admin\/sections\/(\d+)\/(update|delete)$/);
if(m){requireMock('sections.manage');const x=sections.find(z=>z.id===m[1]);if(!x)throw Error('栏目不存在');if(m[2]==='delete'){if(posts.some(z=>z.category===x.slug))throw Error('已有帖子栏目不能永久删除，请关闭栏目');sections.splice(sections.indexOf(x),1);}else Object.assign(x,{...data,slug:x.slug,enabled:Number(data.enabled)});adminLog('section.'+m[2],'section',m[1]);return {ok:true};}
throw Error('预览环境尚不支持该操作');
}
return {api,users,stickers,images:{}};
})();
const mockImages={};
async function request(url,opts={}){
if(PREVIEW)return mock.api(url,opts);
const headers={'x-csrf-token':state.csrf,...(opts.body instanceof FormData?{}:{'content-type':'application/json'}),...opts.headers};
let r;try{r=await fetch(url,{credentials:'same-origin',...opts,headers});}catch{throw Error('网络连接失败，请检查服务器');}
const data=await r.json().catch(()=>({}));if(!r.ok)throw Error(data.error||`请求失败（${r.status}）`);return data;
}
function act(fn){Promise.resolve().then(fn).catch(e=>toast(e.message||'操作失败'));}
function setTheme(next){theme=next;document.documentElement.dataset.theme=theme;try{localStorage.setItem('tf_theme',theme);}catch{}const b=$('#themeButton');if(b)b.innerHTML=theme==='dark'?'☀ <span>日间</span>':'☾ <span>夜间</span>';}
function header(){
 $('#identityContainer').innerHTML=state.user?`<button type="button" class="identity-name identity-security" data-action="security-settings" title="账号安全 · 修改密码" aria-label="账号安全与修改密码"><span class="identity-avatar">${h(state.user.username[0]||'用')}</span><span class="identity-copy">${h(state.user.username)}</span>${roleBadge(state.user.role)}</button>`:'';
 let passwordButton=$('#passwordButton');if(!passwordButton){passwordButton=document.createElement('button');passwordButton.id='passwordButton';passwordButton.className='btn btn-light security-link';passwordButton.dataset.action='security-settings';passwordButton.type='button';passwordButton.textContent='修改密码';$('#accountButton').before(passwordButton);}passwordButton.hidden=!state.user;
 $('#accountButton').textContent=state.user?'退出':'登录';$('#accountButton').dataset.action=state.user?'logout':'auth';
 $('#previewLabel').hidden=!PREVIEW;
 let b=$('#themeButton');if(!b){b=document.createElement('button');b.id='themeButton';b.className='btn btn-light theme-btn';b.dataset.action='theme';$('.head-actions').insertBefore(b,$('#identityContainer'));}setTheme(theme);
 let l=$('#languageSelect');if(!l){l=document.createElement('select');l.id='languageSelect';l.className='language-select';l.setAttribute('aria-label','语言');l.title='语言 / Language';l.innerHTML=window.TrustI18n.languages.map(([code,label])=>`<option value="${code}">${label}</option>`).join('');$('.head-actions').insertBefore(l,b);}l.value=window.TrustI18n.locale();const cp=document.querySelector('.head-actions [data-action=compose]');if(cp)cp.setAttribute('data-i18n-mobile-post',t('发表帖子'));
 $('#searchInput').value=state.q;
}
function side(){
 const nav=[['home','⌂','社区首页'],['exposure','⚑','举报曝光'],['discussion','☷','交流讨论'],['mine','▤','我的帖子'],['guide','⬡','防骗指南']];
 const built=nav.map(([view,ico,label])=>`<button class="nav-item ${state.view===view?'active':''}" data-action="nav" data-view="${view}"><span class="nav-icon">${ico}</span>${h(label)}</button>`).join('');
 const custom=state.sections.filter(x=>x.enabled).map(x=>`<button class="nav-item ${state.view==='section'&&state.sectionSlug===x.slug?'active':''}" data-action="section" data-slug="${h(x.slug)}"><span class="nav-icon">${h(x.icon||'◈')}</span>${h(sectionTitle(x))}${x.kind==='page'?'<span class="nav-page-tag">页面</span>':''}</button>`).join('');
 $('#sideNav').innerHTML=built+`<div class="sidebar-divider"></div><div class="sidebar-title section-label">社区板块</div>`+custom;
 $('#adminNavSlot').innerHTML=canManage()?`<div class="sidebar-divider admin-divider"></div><div class="sidebar-title">🛡️ 工作人员专属 · 会员不可见</div><button class="nav-item admin-entry ${state.view==='admin'?'active':''}" data-action="nav" data-view="admin"><span class="nav-icon">⚙️</span>管理员后台<span class="nav-count">管理</span></button>${state.user.role==='super_admin'?`<button class="nav-item super-entry ${state.view==='super'?'active':''}" data-action="nav" data-view="super"><span class="nav-icon">👑</span>超级管理员后台<span class="nav-count">ROOT</span></button>`:''}<div class="staff-nav-note">🔒 仅登录后通过服务端鉴权访问</div>`:'';
}
function statsView(){const s=state.stats;$('#statsContainer').innerHTML=[['风险提醒',s.exposures],['公开帖子',s.posts],['注册成员',s.members],['开放板块',state.sections.length]].map(([l,n])=>`<div><div class="stat-number">${fmt(n)}</div><div class="stat-label">${l}</div></div>`).join('');}
function hero(){return `<section class="hero"><div class="hero-copy"><div class="hero-eyebrow">✦ 公益社区 · 证据优先 · 理性互助</div><h1>让 AI 交易更透明<br><em>让每一次信任都有依据。</em></h1><p>为大模型账号、API Key 交易参与者提供公开交流与风险线索平台。<br>分享真实经历，守护交易安全。</p><div class="hero-action"><button class="btn btn-primary" data-action="compose-exposure">⚑ 提交风险线索</button><button class="btn btn-soft" data-action="nav" data-view="guide">了解防骗指南</button></div></div><div class="hero-art" aria-hidden="true"><div class="shield-halo"><span>◈</span></div><div class="float-chip chip-1">✓ 证据审核</div><div class="float-chip chip-2">◉ 隐私保护</div></div></section>`;}
function postCard(p){return `<article class="post-card"><div class="post-row-top"><div class="post-meta"><span class="avatar">${h((p.author||'匿')[0])}</span><strong>${h(p.author)}</strong>${roleBadge(p.author_role)}<span>· ${when(p.created_at)}</span></div><div>${postBadge(p)} ${p.status!=='published'?`<span class="tag orange">${h(STATUS[p.status]||p.status)}</span>`:''}</div></div><button class="post-title" data-action="detail" data-id="${h(p.id)}">${h(p.title)}</button><div class="excerpt">${richBody(p.body?.slice(0,170)||'')} ${p.body?.length>170?'…':''}</div><div class="post-bottom"><span>◉ ${fmt(p.views)} ${h(t('阅读'))}</span><span>♧ ${fmt(p.comments_count)} ${h(t('评论'))}</span><span>♡ ${fmt(p.likes_count)} ${h(t('赞同'))}</span>${p.images_count?`<span>▧ ${fmt(p.images_count)} ${h(t('张图片'))}</span>`:''}<button class="meta-action" data-action="detail" data-id="${h(p.id)}">查看详情 ↗</button></div></article>`;}
function feed(){const title=state.q&&state.view==='home'?'搜索结果':state.view==='exposure'?'风险曝光专区':state.view==='discussion'?'社区交流讨论':state.view==='mine'?'我发布的帖子':state.view==='section'?state.sections.find(x=>x.slug===state.sectionSlug)?.title||'栏目讨论':'最新社区动态';const detail=state.q&&state.view==='home'?'在已公开帖子的标题和正文中查找匹配内容。':state.view==='exposure'?'未经核实的信息仅作为用户举报线索展示，平台不对指控背书。':state.view==='mine'?'可查看自己的待审核、已发布或被驳回内容。':state.view==='section'?state.sections.find(x=>x.slug===state.sectionSlug)?.description||'社区栏目':'分享交流 · 交易防骗 · 技术讨论';return `${state.view==='home'?hero():''}<section class="feed-shell"><div class="feed-header"><div class="feed-heading"><h2>${h(title)}</h2><p>${h(detail)}</p></div><button class="btn btn-light btn-small" data-action="compose">＋ 发帖</button></div>${state.q&&state.view==='home'?`<div class="search-result-summary" role="status"><span>${h(t('关键词'))}：<strong data-no-translate>${h(state.q)}</strong></span><span>${h(t('本页匹配'))} ${state.items.length} ${h(t('条'))}</span><button class="search-reset" type="button" data-action="search-clear">${h(t('清除搜索'))} ×</button></div>`:''}<div class="toolbar"><div class="tabs"><button class="tab ${state.type==='all'?'active':''}" data-action="filter" data-type="all">全部话题</button><button class="tab ${state.type==='exposure'?'active':''}" data-action="filter" data-type="exposure">风险线索</button><button class="tab ${state.type==='discussion'?'active':''}" data-action="filter" data-type="discussion">交流讨论</button></div><div class="sort-options"><button class="${state.sort==='new'?'active':''}" data-action="sort" data-sort="new">最新</button></div></div><div id="postList">${state.items.length?state.items.map(postCard).join(''):`<div class="empty"><div class="empty-icon">◌</div><h3>${h(t(state.q?'没有找到匹配的公开帖子':'这里还没有内容'))}</h3><p>${h(t(state.q?'请尝试其他关键词，或清除搜索查看全部帖子。':'换个关键词，或成为第一个发帖的人。'))}</p></div>`}</div>${state.hasMore?'<div class="loadmore-wrap"><button class="loadmore" data-action="more">加载更多</button></div>':''}</section>`;}
function guide(){return `<section class="guide-page"><div class="section-head"><div><h1>交易安全与社区公约</h1><p>信息公开不等于事实认定。尊重当事人、保护隐私和证据完整性。</p></div></div><div class="guide-grid"><div class="guide-card"><span>01</span><h3>交易前验证</h3><p>核对供应商资质、明确可交付的模型权限和有效期，先用小额度测试，切勿向陌生人共享账号、正式 API 密钥。</p></div><div class="guide-card"><span>02</span><h3>留存完整证据</h3><p>留存订单号、付款流水、商议过程及脱敏截图。只描述发生了什么，不根据推测给个人或企业定性。</p></div><div class="guide-card"><span>03</span><h3>线索需经审核</h3><p>风险曝光默认进入人工审核；管理员可以要求补证、拒绝公开或下架。争议各方可提交申诉。</p></div><div class="guide-card"><span>04</span><h3>隐私安全第一</h3><p>公开帖禁止身份证、银行卡、手机号、邮箱、密码和密钥。完整证据上传“仅管理员可见”，发布前也应脱敏。</p></div></div><div class="rules-banner"><h2>我们的底线</h2><p>不鼓励人肉搜索、煽动网暴、勒索、恶意诽谤或通过所谓“付费删帖”牟利。涉违法犯罪线索可依法向执法机构报案。</p><button class="btn btn-primary" data-action="compose-exposure">提交举报线索</button></div></section>`;}
function detailReturnLabel(){const source=state.returnTo; if(!source||!['admin','super'].includes(source.view))return ''; const names={posts:'待审帖子',published:'帖子管理 / 下架',comments:'待审评论',commentmanage:'评论管理',reports:'举报处理',appeals:'申诉复核',audit:'操作日志'}; return names[source.adminTab]?t(names[source.adminTab]):t(source.view==='super'?'超级管理员后台':'管理员后台');}
function translationDisabled(p){if(state.translatedPost?.id===p.id&&state.translatedPost.lang===window.TrustI18n.locale())return false;const c=state.translationCapabilities;return p.status!=='published'||!PREVIEW&&c!==null&&(!c.available||!c.locales.includes(window.TrustI18n.locale()));}
function translationHint(p){const c=state.translationCapabilities;return p.status!=='published'?'只能翻译已公开帖子':c&&!c.available?'翻译引擎暂时不可用，请稍后重试':c&&!c.locales.includes(window.TrustI18n.locale())?'当前翻译引擎尚未安装此语言模型':'';}
function updateTranslationButton(){const p=state.detail?.post,b=$('[data-action=translate-post]');if(p&&b){b.disabled=translationDisabled(p);b.title=t(translationHint(p));}}
function detailView(){const d=state.detail;if(!d)return `<div class="empty">加载中…</div>`;const p=d.post;return `<div class="detail-page"><button class="text-link" data-action="back">← ${h(t('返回列表'))}${detailReturnLabel()?` · ${h(detailReturnLabel())}`:''}</button><div class="detail-paper"><div class="detail-header">${postBadge(p)} <span>· ${when(p.created_at)}</span> ${p.status!=='published'?`<span class="status-${h(p.status)}">${h(STATUS[p.status])}</span>`:''}</div><div class="detail-title-row"><h1 class="detail-title" data-no-translate>${h(state.translatedPost?.id===p.id&&state.translatedPost.lang===window.TrustI18n.locale()?state.translatedPost.title:p.title)}</h1><button class="btn btn-light btn-small post-translate-button" ${translationDisabled(p)?'disabled':''} title="${h(t(translationHint(p)))}" data-action="translate-post" data-id="${h(p.id)}" type="button">🌐 ${h(t(state.translatedPost?.id===p.id&&state.translatedPost.lang===window.TrustI18n.locale()?'查看原文':'翻译到当前语言'))}</button></div>${state.translatedPost?.id===p.id&&state.translatedPost.lang===window.TrustI18n.locale()?`<p class="machine-translation-note">ⓘ ${h(t('自动翻译仅供参考，请核对原文'))}</p>`:''}<div class="post-meta"><span class="avatar">${h((p.author||'匿')[0])}</span><strong>${h(p.author)}</strong>${roleBadge(p.author_role)}<span>· ${fmt(p.views)} ${h(t('阅读'))}</span></div>${p.type==='exposure'?'<div class="unverified-note">⚠️ 本帖为用户提供的风险线索。即使审核通过，也不代表平台已经认定违法或诈骗行为。请独立核实。</div>':''}<p class="detail-body" data-no-translate>${state.translatedPost?.id===p.id&&state.translatedPost.lang===window.TrustI18n.locale()?h(state.translatedPost.body):richBody(p.body)}</p>${d.attachments?.filter(a=>a.purpose==='public').length?`<div class="detail-image-grid">${d.attachments.filter(a=>a.purpose==='public').map(a=>`<img src="${h(a.url)}" loading="lazy" alt="用户提交的脱敏截图" />`).join('')}</div>`:''}${d.attachments?.filter(a=>a.purpose==='private').length?`<section class="private-evidence"><strong>🔒 私密证据 · 仅提交者及授权审核员可见</strong><p>请勿下载、转发或擅自公开未经脱敏的凭证。</p><div class="detail-image-grid">${d.attachments.filter(a=>a.purpose==='private').map(a=>`<img src="${h(a.url)}" loading="lazy" alt="需要保密的交易证据" />`).join('')}</div></section>`:''}<div class="detail-toolbar"><button class="btn btn-light" data-action="like" data-id="${h(p.id)}">♡ ${h(t('赞同'))} (${fmt(p.likes_count)})</button><button class="btn btn-light" data-action="report" data-id="${h(p.id)}">⚑ ${h(t('举报内容'))}</button><button class="btn btn-light" data-action="appeal" data-id="${h(p.id)}">${h(t('申诉 / 纠错'))}</button>${p.status==='published'&&roleOk('posts.remove')&&(state.user?.role==='super_admin'||p.author_role==='member')?`<button class="btn btn-outline-danger" data-action="review-post" data-id="${h(p.id)}" data-decision="removed">${h(t('下架帖子'))}</button>`:''}</div></div><div class="detail-paper"><h2 class="comment-title">${h(t('讨论区'))} ${fmt(d.comments?.filter(c=>c.status==='published').length)}</h2>${(d.comments||[]).length?d.comments.map(c=>`<div class="comment-box"><div class="post-meta"><span class="avatar">${h((c.author||'用')[0])}</span><strong>${h(c.author)}</strong>${roleBadge(c.author_role)}<span>${when(c.created_at)}</span>${c.status!=='published'?`<span class="tag orange">${h(STATUS[c.status]||c.status)}</span>`:''}</div><p>${richBody(c.body)}</p>${c.images?.length?`<div class="comment-images">${c.images.map(img=>`<img loading="lazy" src="${h(img.url)}" alt="评论图片" />`).join('')}</div>`:''}${roleOk('comments.remove')&&(state.user?.role==='super_admin'||c.author_role==='member')?`<button class="text-link" data-action="review-comment" data-id="${h(c.id)}" data-decision="hidden">隐藏评论</button>`:''}</div>`).join(''):'<p class="muted">暂无评论，欢迎友善交流。</p>'}<form id="commentForm" class="comment-form"><textarea id="commentBody" class="form-input" name="body" maxlength="1600" placeholder="说说你的看法… 可以加入表情或上传图片；请勿公开私密信息"></textarea>${emojiTools('commentBody')}<div class="inline-file"><label class="tool-btn" for="commentFiles">▧ 上传图片</label><input id="commentFiles" type="file" accept="image/jpeg,image/png,image/webp" multiple /><small id="commentUploaded">最多 20 张 · 每张不超过 5 MB</small></div><div class="modal-actions"><button class="btn btn-primary" type="submit">提交评论</button></div></form></div></div>`;}
function adminTabs(){const tabs=[['overview','后台总览',null],['posts','待审帖子','posts.review'],['published','帖子管理 / 下架','posts.remove'],['comments','待审评论','comments.review'],['commentmanage','评论管理','comments.remove'],['reports','举报处理','reports.review'],['appeals','申诉复核','appeals.review'],['users','会员管理 / 禁言','users.view'],['sections','栏目管理','sections.manage'],['stickers','表情包治理','stickers.review'],['audit','操作日志','audit.view']];
 const list=state.view==='super'?[['staff','👑 管理员任免与授权',null],['donations','₿ 捐赠地址管理',null],...tabs]:tabs;
 return list.filter(([key,,permission])=>['audit','stickers'].includes(key)?true:key==='users'?(roleOk('users.view')||roleOk('users.mute')):key==='stickers'?(roleOk('stickers.review')||roleOk('stickers.remove')):!permission||roleOk(permission)).map(([key,label])=>`<button class="admin-tab ${state.adminTab===key?'active':''}" data-action="admin-tab" data-tab="${key}">${h(window.TrustI18n?.tr(label)||label)}</button>`).join('');}
function adminOverview(){const s=state.user?.role==='super_admin',actions=[['会员管理','users','users.view','查看成员及授权范围内的禁言状态'],['帖子下架','published','posts.remove','可管理范围内的已发布帖子'],['内容审核','posts','posts.review','待审核的举报线索与帖子'],['栏目配置','sections','sections.manage','增加讨论板块、独立内容网页']].filter(([, ,permission])=>roleOk(permission));return `<div class="admin-overview"><div class="admin-welcome"><span class="admin-welcome-icon">${s?'👑':'🛡️'}</span><div><strong>${s?'超级管理员已登录':'管理员已登录'}</strong><p>${s?'可管理全站内容、普通会员和管理员账号；独立权限中心可任命或撤销管理员。':'仅可处理普通会员的内容和禁言；不能修改其他工作人员的权限。'}</p></div></div><div class="admin-quick-grid">${actions.map(([name,tab,,description])=>`<button class="admin-quick-card" data-action="admin-tab" data-tab="${tab}"><b>${name}</b><span>${description}</span><em>进入管理 →</em></button>`).join('')}${s?`<button class="admin-quick-card admin-quick-highlight" data-action="nav" data-view="super"><b>👑 超级管理员专属后台</b><span>管理员任免、逐项授予/撤销权限、管理员禁言</span><em>打开权限中心 →</em></button>`:''}</div><p class="admin-privacy">所有管理操作由后端逐次校验权限。帖子下架为软删除，保留核查与申诉记录。</p></div>`;}

const DONATION_NETWORKS_BY_ASSET=window.TrustDonationNetworks;
function donationEditor(data){
 const items=Array.isArray(data.items)?data.items:[];
 return `<div class="donation-editor"><h2>₿ ${h(t('捐赠地址管理'))}</h2><p class="muted small">${h(t('此地址仅供捐赠，请核对区块链网络'))} · ${h(t('捐赠设置只允许超级管理员保存；每次修改都必须验证密码，并记录操作日志。'))}</p><form id="donationForm"><input name="revision" type="hidden" value="${Number(data.revision||0)}" /><div id="donationEditorRows">${items.map(donationRow).join('')}</div><button class="btn btn-soft" type="button" data-action="donation-add">＋ ${h(t('新增地址'))}</button><div class="form-group donation-password"><label>${h(t('当前超级管理员密码'))}</label><input class="form-input" name="password" type="password" autocomplete="current-password" minlength="10" maxlength="128" required /></div><div class="modal-actions"><button class="btn btn-primary" type="submit">${h(t('保存捐赠设置'))}</button></div></form></div>`;
}
function donationRow(d={}){
 const asset=DONATION_NETWORKS_BY_ASSET[d.asset]?d.asset:'BTC';
 const networks=DONATION_NETWORKS_BY_ASSET[asset];
 const selectedNetwork=asset==='BTC'?'Bitcoin':(d.network||networks[0]);
 const legacy=asset!=='BTC'&&!networks.includes(selectedNetwork);
 const networkSelect=asset==='BTC'
   ? '<input type="hidden" data-donate-field="network" value="Bitcoin" />'
   : `<select class="form-input" data-donate-field="network" aria-label="${h(t('网络'))}">${legacy?`<option value="${h(selectedNetwork)}" selected disabled>⚠ ${h(selectedNetwork)} (${h(t('旧网络需更新'))})</option>`:''}${networks.map(x=>`<option value="${h(x)}" ${selectedNetwork===x?'selected':''}>${h(x)}</option>`).join('')}</select>`;
 return `<div class="donation-row ${asset==='BTC'?'donation-btc':''}"><select class="form-input" data-donate-field="asset" aria-label="${h(t('请选择资产'))}">${['BTC','USDT','USDC'].map(x=>`<option value="${x}" ${asset===x?'selected':''}>${x}</option>`).join('')}</select>${networkSelect}<input class="form-input" data-donate-field="address" placeholder="${h(t('收款地址'))}" maxlength="100" value="${h(d.address||'')}" required /><input data-donate-field="id" type="hidden" value="${h(d.id||'')}" /><button type="button" class="btn btn-outline-danger btn-small" data-action="donation-remove">${h(t('移除地址'))}</button></div>`;
}
async function refreshDonations(){const data=await request('/api/site/donations');state.donations=data;drawDonations();}
function drawDonations(){const el=$('#donationLinks');if(!el)return;const items=state.donations?.items||[];
 el.innerHTML=items.length?items.map(x=>`<div class="donation-public-address"><b>${h(x.asset)} <small>${h(x.network)}</small></b><code title="${h(x.address)}">${h(x.address)}</code><button type="button" class="footer-copy" data-action="donation-copy" data-address="${h(x.address)}">${h(t('复制地址'))}</button></div>`).join(''):`<span class="donation-empty">${h(t('暂无公开捐赠地址'))}</span>`;
}
function adminShell(){const superView=state.view==='super';return `<section class="admin-shell"><div class="section-head"><div><h1>${superView?'👑 超级管理员后台':'🛡️ 管理员后台'}</h1><p>${superView?'管理员任免 · 禁言 · 权限管理':'内容审核 · 帖子下架 · 用户禁言 · 栏目管理'}</p></div><span class="role-pill">${state.user?.role==='super_admin'?'超级管理员':'普通管理员'}</span></div>${superView?'<div class="super-alert">仅超级管理员可任免管理员，所有权限由服务端核验。</div>':''}<div class="admin-card"><div class="admin-tabs">${adminTabs()}</div><div class="admin-panel" id="adminPanel"><div class="admin-empty">正在加载管理数据…</div></div></div></section>`;}

function batchCheckbox(id,enabled=true){if(!enabled)return '';const selected=batchSelected.get(state.adminTab)?.has(String(id));return `<label class="batch-row-check"><input type="checkbox" data-batch-id="${h(id)}" ${selected?'checked':''}/><span>${h(t('选择记录'))}</span></label>`;}
function adminItem(title,description,meta,actions,batchId=null){return `<div class="admin-item">${batchId!==null?batchCheckbox(batchId):''}<div class="mini-meta">${meta}</div><h3>${h(title)}</h3><p>${h(description)}</p><div class="admin-actions">${actions}</div></div>`;}
function batchToolbar(tab,items){const conf=BATCH_CONFIG[tab];if(!conf||!items.length)return '';const eligible=items.filter(row=>{
 if(tab==='users')return roleOk('users.mute')&&row.id!==state.user?.id&&row.role!=='super_admin'&&(state.user.role==='super_admin'||row.role==='member');
 if(tab==='stickers')return roleOk('stickers.remove')&&(state.user.role==='super_admin'||row.owner_role==='member');
 return true;
}).map(x=>String(x.id));
 const set=batchSelected.get(tab)||new Set();for(const id of [...set])if(!eligible.includes(id))set.delete(id);batchSelected.set(tab,set);
 if(!eligible.length)return '';
 const checked=eligible.every(id=>set.has(id));
 const actions=conf.actions.filter(([act])=>roleOk(BATCH_PERMISSIONS[conf.resource][act]));
 return `<div class="batch-toolbar"><label class="batch-master"><input id="batchSelectAll" type="checkbox" data-batch-all="${h(tab)}" ${checked?'checked':''}/> ${h(t('全选当前列表'))}（${eligible.length}）</label><span class="batch-count" id="batchCount">${h(t('已选择'))} ${set.size} ${h(t('条'))}</span><button class="btn btn-light btn-small" type="button" data-action="batch-clear">${h(t('清空选择'))}</button><div class="batch-actions">${actions.map(([act,label])=>`<button class="btn ${['rejected','removed','hidden','deleted','mute24h','denied'].includes(act)?'btn-outline-danger':'btn-primary'} btn-small" type="button" data-action="batch-start" data-batch-action="${act}">${h(t(label))}</button>`).join('')}</div><small class="batch-tip">最多100条/次；逐条校验权限和状态。举报曝光帖核对后也可批量批准。</small></div>`;
}
function updateBatchSelected(){const set=batchSelected.get(state.adminTab)||new Set();const counter=$('#batchCount');if(counter)counter.textContent=`${h(t('已选择'))} ${set.size} ${h(t('条'))}`;const master=$('#batchSelectAll');if(master){const inputs=[...document.querySelectorAll('#adminPanel [data-batch-id]')];master.checked=!!inputs.length&&inputs.every(i=>i.checked);master.indeterminate=inputs.some(i=>i.checked)&&!master.checked;}}
function openBatchDialog(action){const tab=state.adminTab,config=BATCH_CONFIG[tab];if(!config||!config.actions.some(([a])=>a===action))return;
 const ids=[...(batchSelected.get(tab)||[])];if(!ids.length){toast('请先勾选至少一条记录');return;}
 if(ids.length>100){toast('每次最多处理100条记录');return;}
 const label=config.actions.find(([a])=>a===action)[1];state.pendingBatch={tab,resource:config.resource,action,ids};
 const approve=['posts','comments'].includes(config.resource)&&action==='published';
 modal(label,`<form id="batchForm"><p class="muted">已选择 <b>${ids.length}</b> 条。${h(label)}将逐项核验角色、状态与审核范围；失败项不会影响成功项。</p><p class="muted">选中记录：${h(ids.slice(0,18).join('、'))}${ids.length>18?' …':''}</p><div class="form-group"><label for="batchReason">处理依据（必填，至少5字）</label><textarea id="batchReason" name="note" class="form-input" minlength="5" maxlength="500" rows="3" required placeholder="请说明已核查的材料、判断依据和采取此操作的原因"></textarea></div>${approve?`<label class="batch-attestation"><input type="checkbox" name="reviewedEvidence" required /> 我已逐条查看所选内容，对举报曝光及图片证据完成核验、脱敏检查，同意对所选记录执行批量公开。</label>`:''}<p class="muted small">操作将留存操作人、时间、批次编号、每条状态变化和处理依据。</p><div class="modal-actions"><button type="button" class="btn btn-light" data-action="close-modal">取消</button><button class="btn btn-primary" type="submit">确认${h(label)} ${ids.length} 条</button></div></form>`,'sm');
}
function userSearchTools(){return `<form id="adminUserSearchForm" class="admin-search-tools" role="search"><label class="sr-only" for="adminUserSearchInput">按 UID、昵称或注册账号查找</label><input id="adminUserSearchInput" class="form-input" name="q" maxlength="80" type="search" autocomplete="off" value="${h(state.adminUserQ||'')}" placeholder="输入 UID / 用户昵称 / 注册邮箱"><select name="role" class="form-input" aria-label="筛选账号身份"><option value="">全部身份</option>${[['member','普通会员'],['moderator','管理员'],['super_admin','超级管理员']].map(([k,v])=>`<option value="${k}" ${state.adminUserRole===k?'selected':''}>${v}</option>`).join('')}</select><button type="submit" class="btn btn-primary">🔍 搜索用户</button><button type="button" class="btn btn-light" data-action="admin-user-reset">清除</button></form>`;}
const auditActionLabels={'account.password_changed':'密码已修改','user.mute':'用户禁言','user.unmute':'解除禁言','user.permissions_changed':'管理员任免与权限调整','post.published':'帖子审核通过','post.rejected':'帖子审核驳回','post.removed':'帖子下架','comment.published':'评论通过','comment.hidden':'评论隐藏','report.resolved':'处理举报','report.dismissed':'举报驳回','appeal.accepted':'申诉受理','appeal.denied':'申诉驳回','sticker.upload':'上传私人表情','sticker.disabled':'禁用表情','sticker.active':'恢复表情','sticker.deleted':'删除表情','sticker.owner_delete':'用户自行删除表情','donations.update':'更新捐赠地址','section.create':'创建栏目','section.update':'编辑栏目','section.delete':'删除栏目'};
function fmtAuditDate(v){const d=new Date(v);return Number.isFinite(d.getTime())?d.toLocaleString(window.TrustI18n?.locale()||'zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}):String(v||'');}
function auditDetailText(raw){const x=typeof raw==='string'?(()=>{try{return JSON.parse(raw);}catch{return {};}})():raw||{};const keys={reason:'处理原因',note:'处理备注',target_name:'目标用户',before_role:'原身份',role:'新身份',before_permissions:'修改前权限',permissions:'修改后权限',duration:'禁言类型',until:'截止时间（UTC）',before_until:'此前禁言截止',before_status:'原状态',status:'新状态',owner_id:'表情所属用户UID',post_id:'关联帖子ID',excerpt:'审核内容摘录',related_id:'关联对象ID',related_type:'关联内容类型',report_reason:'原举报类型',applicant_id:'申诉者UID',bytes:'文件字节数',enabled:'栏目状态',title:'栏目名称',slug:'栏目编号',revision:'配置版本'};
 return Object.entries(x).filter(([key])=>!/(secret|password|token|privatekey|cookie|address)/i.test(key)).slice(0,20).map(([key,val])=>`<div><b>${h(keys[key]||key)}：</b>${h(Array.isArray(val)?val.join('、'):String(val??'无'))}</div>`).join('')||'<span class="muted">无附加说明（历史日志）</span>';}
async function renderAdminPanel(){if(!['admin','super'].includes(state.view))return;if(state.view==='super'&&state.user?.role!=='super_admin')return;const tr=(key)=>window.TrustI18n?.tr(key)||key;let t=state.adminTab;if(state.view==='super'&&!['staff','donations','overview','posts','published','comments','commentmanage','reports','appeals','users','sections','stickers','audit'].includes(t)){t='staff';state.adminTab=t;}if(state.view==='admin'&&t==='staff'){t='overview';state.adminTab=t;}if(t==='overview'){$('#adminPanel').innerHTML=adminOverview();window.TrustI18n?.apply($('#adminPanel'));return;}
const endpoints={donations:'/api/admin/donations',staff:'/api/admin/users',posts:'/api/admin/queue',published:'/api/admin/posts',comments:'/api/admin/comments',commentmanage:'/api/admin/comments/published',reports:'/api/admin/reports',appeals:'/api/admin/appeals',users:'/api/admin/users',sections:'/api/admin/sections',stickers:'/api/admin/stickers',audit:'/api/admin/audit'};
const tabPerms={donations:null,staff:null,posts:'posts.review',published:'posts.remove',comments:'comments.review',commentmanage:'comments.remove',reports:'reports.review',appeals:'appeals.review',users:'users.mute',sections:'sections.manage',stickers:'stickers.review',audit:'audit.view'};
if(['staff','donations'].includes(t)&&state.user?.role!=='super_admin')throw Error('只有超级管理员可以管理授权');if((t==='users'&&(roleOk('users.view')||roleOk('users.mute')))||(t==='stickers')||(t==='audit')){/* 允许自有日志，表情未授权时展示说明 */}else if(t!=='staff'&&!roleOk(tabPerms[t])){state.adminTab='overview';$('#adminPanel').innerHTML=adminOverview();window.TrustI18n?.apply($('#adminPanel'));return;}
const holder=$('#adminPanel');if(!holder)return;
if(t==='stickers'&&!roleOk('stickers.review')&&!roleOk('stickers.remove')){holder.innerHTML='<div class="admin-empty">表情包治理入口已开放查看。需由超级管理员授予「表情审核」或「表情删除」权限后才能查看和处理会员表情。</div>';return;}

const requestUrl=['staff','users'].includes(t)?endpoints[t]+'?'+new URLSearchParams({q:state.adminUserQ||'',role:state.adminUserRole||''}):t==='audit'?endpoints[t]+'?'+new URLSearchParams({q:state.auditQ||'',page:String(state.auditPage||1)}):endpoints[t];
 const data=await request(requestUrl);let a=data.items||[];let html='';
if(t==='donations'){
 state.donations={revision:data.revision,items:data.items};
 $('#adminPanel').innerHTML=donationEditor(data);window.TrustI18n?.apply($('#adminPanel'));return;
}

if(t==='posts')html=a.map(p=>adminItem(p.title,p.body,`#${h(p.id)} · ${h(p.author)} · ${when(p.created_at)}`,`<button class="btn btn-primary btn-small" data-action="detail" data-id="${h(p.id)}">核对内容</button><button class="btn btn-primary btn-small" data-action="review-post" data-id="${h(p.id)}" data-decision="published">批准发布</button><button class="btn btn-outline-danger btn-small" data-action="review-post" data-id="${h(p.id)}" data-decision="rejected">驳回</button>`,p.id)).join('');
if(t==='published')html=a.map(p=>adminItem(p.title,p.body,`#${h(p.id)} · ${h(p.author)} ${p.author_role==='moderator'?'· 管理员':''} · ${when(p.created_at)}`,`<button class="btn btn-light btn-small" data-action="detail" data-id="${h(p.id)}">查看内容</button><button class="btn btn-outline-danger btn-small" data-action="review-post" data-id="${h(p.id)}" data-decision="removed">${h(tr('下架帖子'))}</button>`,p.id)).join('');
if(t==='commentmanage')html=a.map(c=>adminItem(c.post_title||'评论',c.body,`${h(c.author)} · ${when(c.created_at)}`,`<button class="btn btn-outline-danger btn-small" data-action="review-comment" data-id="${h(c.id)}" data-decision="hidden">隐藏评论</button>`,c.id)).join('');
if(t==='comments')html=a.map(c=>adminItem(c.post_title||'待审评论',c.body,`${h(c.author)} · ${when(c.created_at)}`,`<button class="btn btn-light btn-small" data-action="review-comment-context" data-id="${h(c.id)}">核对内容</button><button class="btn btn-primary btn-small" data-action="review-comment" data-id="${h(c.id)}" data-decision="published">通过</button><button class="btn btn-outline-danger btn-small" data-action="review-comment" data-id="${h(c.id)}" data-decision="hidden">隐藏</button>`,c.id)).join('');
if(t==='reports')html=a.map(r=>adminItem(`${tr('被举报')} ${tr(r.target_type==='post'?'帖子':'评论')} #${r.target_id}`,r.details,`${h(r.reporter)} · ${h(r.reason)} · ${when(r.created_at)}`,`<button class="btn btn-primary btn-small" data-action="admin-resolve" data-kind="reports" data-id="${h(r.id)}" data-status="resolved">已处理</button><button class="btn btn-light btn-small" data-action="admin-resolve" data-kind="reports" data-id="${h(r.id)}" data-status="dismissed">驳回举报</button>`,r.id)).join('');
if(t==='appeals')html=a.map(r=>adminItem(r.post_title||`帖子 #${r.post_id}`,r.reason,`${h(r.applicant)} · ${when(r.created_at)}`,`<button class="btn btn-primary btn-small" data-action="admin-resolve" data-kind="appeals" data-id="${h(r.id)}" data-status="accepted">受理复核</button><button class="btn btn-light btn-small" data-action="admin-resolve" data-kind="appeals" data-id="${h(r.id)}" data-status="denied">不予采纳</button>`,r.id)).join('');
if(t==='staff')html=userSearchTools() + `<div class="super-team-title"><h2>👑 管理员任免与权限管理</h2><p>任命或撤销管理员，并逐项设置审核、禁言和栏目权限。</p></div><div class="staff-legend"><span>◇ 普通会员</span><span>✦ 管理员</span><span>♛ 超级管理员（不可降权）</span></div>`+a.map(u=>`<div class="user-card staff-user-card"><div class="user-info"><strong>${h(u.username)} ${roleBadge(u.role)}</strong><small>UID: ${h(u.id)} · ${h(u.email||'')} · ${u.role==='super_admin'?tr('创始管理员 / 受保护角色'):u.role==='moderator'?tr('已授权：')+h(u.permissions?.map(p=>tr(PN[p]||p)).join('、')||tr('未授予管理权限')):tr('未授予管理权限')}</small></div><div class="admin-actions">${u.role==='super_admin'?'<span class="role-pill">不可调整</span>':`<button class="btn ${u.role==='moderator'?'btn-soft':'btn-primary'} btn-small" data-action="manage-user" data-id="${h(u.id)}">${u.role==='moderator'?'设置权限 / 撤销管理员':'＋ 任命管理员'}</button>`}</div></div>`).join('');
if(t==='users')html=userSearchTools() + `<p class="muted small">普通管理员只可禁言或解除普通会员禁言；超级管理员可处理普通会员、管理员并更改管理权限。所有行为会写入审计日志。</p>`+a.map(u=>`<div class="user-card">${batchCheckbox(u.id,roleOk('users.mute')&&u.id!==state.user?.id&&u.role!=='super_admin'&&(state.user?.role==='super_admin'||u.role==='member'))}<div class="user-info"><strong>${h(u.username)} ${roleBadge(u.role)}</strong><small>UID: ${h(u.id)} · ${u.email?h(u.email)+' · ':''} ${u.mute_until&&new Date(utcDate(u.mute_until)).getTime()>Date.now()?`<span class="mute-mark">禁言中</span> · `:''}${h(u.permissions?.map(p=>tr(PN[p]||p)).join('、')||tr('未授予管理权限'))}</small></div><div class="admin-actions">${roleOk('users.mute')&&u.id!==state.user?.id&&u.role!=='super_admin'&&(state.user?.role==='super_admin'||u.role==='member')?`<button class="btn btn-light btn-small" data-action="mute-user" data-id="${h(u.id)}">${u.mute_until&&new Date(utcDate(u.mute_until)).getTime()>Date.now()?'调整禁言':'禁言管理'}</button>`:''}${state.user?.role==='super_admin'&&u.role!=='super_admin'?`<button class="btn btn-soft btn-small" data-action="manage-user" data-id="${h(u.id)}">设置管理员权限</button>`:''}</div></div>`).join('');
if(t==='sections')html=`<div class="sections-toolbar"><p class="muted small">可新建讨论板块或独立图文页面。关闭后的栏目不在公开导航显示；已有帖子栏目不允许直接删除。</p><button class="btn btn-primary btn-small" data-action="create-section">＋ 创建栏目 / 网页</button></div>`+a.map(x=>`<div class="user-card">${batchCheckbox(x.id)}<div class="user-info"><strong>${h(x.icon)} ${h(x.title)} <span class="role-pill">${x.kind==='page'?'独立网页':x.kind==='exposure'?'举报专区':'讨论板块'}</span> ${x.enabled?'':'<span class="mute-mark">已停用</span>'}</strong><small>/${h(x.slug)} · ${tr('排序')} ${x.sort_order} · ${h(x.description||'')}</small></div><div class="admin-actions"><button class="btn btn-light btn-small" data-action="edit-section" data-id="${h(x.id)}">编辑 / 开关</button><button class="btn btn-outline-danger btn-small" data-action="delete-section" data-id="${h(x.id)}">删除</button></div></div>`).join('');
if(t==='stickers')html=`<p class="muted small">普通管理员只可处理会员表情，超管可处理会员及管理员表情。每项显示上传者、UID、上传时间、当前状态。点击图片右上角红色 × 可删除。</p><div class="sticker-mod-list">`+a.filter(x=>state.user.role==='super_admin'||!['moderator','super_admin'].includes(x.owner_role||(state.adminUsers||[]).find(u=>u.id===x.owner_id)?.role||mock.users.find(u=>u.id===x.owner_id)?.role||'member')).map(x=>`<div class="sticker-mod-card sticker-mod-detailed">${batchCheckbox(x.id,roleOk('stickers.remove'))}<div class="sticker-thumbnail"><img src="${h(x.url)}" alt="${h(x.owner||'用户')}上传的表情" loading="lazy">${roleOk('stickers.remove')?`<button class="sticker-red-x" data-action="sticker-moderate" data-id="${h(x.id)}" data-status="deleted" type="button" title="删除表情（写入审计）" aria-label="删除表情 #${h(x.id)}">×</button>`:''}</div><div class="sticker-metadata"><b>${h(x.owner||'用户')} · UID ${h(x.owner_id)}</b><small>表情 #${h(x.id)} · ${h(x.status==='active'?'启用':x.status==='disabled'?'已禁用':x.status)}</small><small>上传时间：${h(fmtAuditDate(x.created_at))}</small><small>${h(x.label||'自定义表情')}</small></div><div class="admin-actions">${roleOk('stickers.remove')?`<button class="btn btn-light btn-small" data-action="sticker-moderate" data-id="${h(x.id)}" data-status="${x.status==='active'?'disabled':'active'}">${x.status==='active'?'禁用':'恢复'}</button>`:'只读'}</div></div>`).join('')+'</div>';
if(t==='audit')html=`<form id="auditSearchForm" class="audit-search-tools" role="search"><input name="q" class="form-input" type="search" maxlength="80" value="${h(state.auditQ||'')}" placeholder="按操作、用户、UID、对象查审计记录" aria-label="搜索操作审计"><button class="btn btn-primary" type="submit">查询日志</button><button class="btn btn-light" type="button" data-action="audit-search-reset">清除</button></form><p class="muted small">${state.user.role==='super_admin'?'超级管理员可查看全部管理操作':'隐私隔离：你只能查看自己执行的管理操作'}；包含操作人 UID、精确时间、对象、变更及脱敏来源IP。密码和重置令牌不入日志。</p>`+a.map(r=>`<article class="audit-record"><div class="audit-record-head"><span class="audit-event-name">${h(auditActionLabels[r.action]||r.summary||r.action)}</span><time datetime="${h(r.created_at)}">${h(fmtAuditDate(r.created_at))}</time></div><div class="audit-actors"><span>操作人：<b>${h(r.actor_name||r.actor||'未知')}</b> · UID ${h(r.actor_id||'历史缺失')} · ${h(r.actor_role||'历史角色未知')}</span><span>操作对象：${h(r.target_name||r.target_type)} · ${h(r.target_type)} #${h(r.target_id)}</span></div><div class="audit-detail">${auditDetailText(r.details)}</div><div class="audit-tail">审计编号 #${h(r.id)} · 事件 ${h(r.action)} · 来源网段 ${h(r.request_ip||'未记录')} · 请求 ${h(r.request_id||'历史缺失')}</div></article>`).join('')+(data.hasMore?`<div class="admin-actions"><button class="btn btn-light" type="button" data-action="audit-more">查看更早的 50 条记录</button></div>`:'');
holder.innerHTML=html?(batchToolbar(t,a)+html):'<div class="admin-empty">当前没有待处理事项 ✓</div>';window.TrustI18n?.apply(holder);if(t==='users'||t==='staff')state.adminUsers=a;if(t==='sections')state.adminSections=a;
}
async function loadFeed(append=false){const isMine=state.view==='mine';let res;if(isMine){if(!state.user){openAuth('login');return;}res=await request('/api/posts/mine');}else {const params=new URLSearchParams({page:String(state.page),sort:state.sort});const type=state.view==='exposure'?'exposure':state.view==='discussion'?'discussion':state.view==='section'?state.sections.find(x=>x.slug===state.sectionSlug)?.kind:state.type;if(type!=='all')params.set('type',type);if(state.view==='section')params.set('category',state.sectionSlug);else if(state.category)params.set('category',state.category);if(state.q)params.set('q',state.q);res=await request('/api/posts?'+params);}
state.items=append?[...state.items,...res.items]:res.items;state.hasMore=!!res.hasMore;}
// V3.0: Preserve the exact UI that opened the post. The previous hard-coded
// `back -> home` silently lost admin tabs, search terms and category filters.
// This is view state only: the server still independently checks every permission.
function captureDetailOrigin(){
 return {view:state.view,adminTab:state.adminTab,adminUserQ:state.adminUserQ,
  adminUserRole:state.adminUserRole,auditQ:state.auditQ,auditPage:state.auditPage,
  type:state.type,category:state.category,sectionSlug:state.sectionSlug,sort:state.sort,
  q:state.q,page:state.page,hasMore:state.hasMore,items:state.items.slice(),
  scrollY:window.scrollY||0};
}
async function returnFromDetail({refreshFeed=false}={}){
 const previous=state.returnTo;
 state.returnTo=null;
 if(!previous){await navigate('home');return;}
 // Do not resurrect a privileged page if the session/permissions have changed.
 if(previous.view==='super'&&state.user?.role!=='super_admin'){
  await navigate('home');return;
 }
 if(previous.view==='admin'&&!canManage()){
  await navigate('home');return;
 }
 if(previous.view==='section'&&!state.sections.some(s=>s.slug===previous.sectionSlug&&s.enabled)){
  await navigate('home');return;
 }
 const {scrollY,items,...rest}=previous;
 Object.assign(state,rest);
 state.items=items;
 state.detail=null;
 state.translatedPost=null;
 if(['admin','super'].includes(state.view)){
  // Load the same tab, not the default overview; wait before restoring scroll.
  render({skipAdminAutoLoad:true});
  await renderAdminPanel();
 }else if(['home','discussion','exposure','mine','section'].includes(state.view)){
  // A moderation action can remove a post from a public listing.
  // Re-query all currently loaded pages so removed items cannot linger.
  if(refreshFeed){
   const lastPage=Math.max(1,Math.min(20,Number(state.page)||1));
   for(let current=1;current<=lastPage;current++){
    state.page=current;
    await loadFeed(current>1);
   }
   state.page=lastPage;
  }
  render();
 }else render();
 window.scrollTo({top:Math.max(0,scrollY||0),behavior:'instant'});
}
async function navigate(view,opts={}){if(view==='super'&&state.user?.role!=='super_admin'){toast('只有超级管理员可进入该后台');return;}if(view==='admin'&&!canManage()){toast('没有后台管理权限');return;}if(view==='mine'&&!state.user){openAuth('login');return;}if(!opts.keepSearch)state.q='';state.returnTo=null;state.view=view;state.page=1;state.detail=null;if(view==='super')state.adminTab='staff';if(view==='admin')state.adminTab='overview';if(!opts.keepCategory)state.category='';if(['exposure','discussion'].includes(view))state.type=view;else if(view==='home'||view==='mine')state.type='all';
if(['home','discussion','exposure','mine','section'].includes(view))await loadFeed();render();window.scrollTo({top:0,behavior:'smooth'});}
function sectionPage(){const x=state.sections.find(v=>v.slug===state.sectionSlug);return `<section class="section-page"><span class="section-icon">${h(x?.icon||'◈')}</span><h1>${h(x?.title||'栏目不存在')}</h1><p>${h(x?.description||'')}</p><div class="section-article">${h(x?.page_content||'该栏目暂无介绍').replace(/\n/g,'<br>')}</div></section>`;}
function render({skipAdminAutoLoad=false}={}){header();side();statsView();drawDonations();const view=state.view;const currentSection=state.sections.find(x=>x.slug===state.sectionSlug);$('#mainContent').innerHTML=['home','discussion','exposure','mine'].includes(view)||view==='section'&&currentSection?.kind!=='page'?feed():view==='section'?sectionPage():view==='guide'?guide():view==='detail'?detailView():['admin','super'].includes(view)?adminShell():guide();if(!skipAdminAutoLoad&&['admin','super'].includes(view))act(renderAdminPanel);window.TrustI18n?.apply(document);}
async function refreshStats(){state.stats=await request('/api/stats');statsView();}

function openAuth(mode='login'){
const reg=mode==='register';
const demo=PREVIEW?`<div class="demo-login"><strong>${h(t('离线预览 · 统一登录入口'))}</strong><p>${h(t('普通会员'))}: member@demo.test<br>${h(t('普通管理员'))}: mod@demo.test<br>${h(t('超级管理员'))}: root@demo.test<br>${h(t('演示密码'))}: <code>Demo123456!</code></p><small>${h(t('仅供本地演示，正式系统没有这些账号。'))}</small></div>`:'';
modal(reg?'注册新账号':'欢迎回来',`<form id="authForm"><input type="hidden" name="mode" value="${reg?'register':'login'}" />${reg?'<div class="form-group"><label>社区昵称</label><input class="form-input" name="username" minlength="3" maxlength="24" required autocomplete="username" placeholder="设置社区昵称" /></div>':''}<div class="form-group"><label>邮箱地址</label><input class="form-input" name="email" type="email" maxlength="190" required autocomplete="email" placeholder="you@example.com" /></div><div class="form-group"><label>登录密码</label><input class="form-input" name="password" type="password" minlength="${reg?10:1}" maxlength="128" required autocomplete="${reg?'new-password':'current-password'}" placeholder="${reg?'至少 10 位密码':'请输入密码'}" /></div><div id="turnstileBox"></div><button class="btn btn-primary full-btn" type="submit">${reg?'创建账号':'登录社区'}</button></form><div class="auth-switch">${reg?'已经有账号？':'还没有账号？'} <button data-action="switch-auth" data-mode="${reg?'login':'register'}">${reg?'立即登录':'免费注册 →'}</button></div>${!reg?'<div class="auth-extra"><button type="button" data-action="forgot-password">忘记密码？通过邮箱找回</button></div>':''}${demo}`, 'sm');
if(!PREVIEW&&state.meta.turnstileSitekey)setupTurnstile();
}
function openForgotPassword(){
 modal('找回登录密码',`<form id="forgotPasswordForm"><p class="muted">输入注册邮箱。我们将发送一次性的重置链接，20分钟内有效。</p><div class="form-group"><label>注册邮箱</label><input name="email" type="email" class="form-input" maxlength="190" autocomplete="email" required placeholder="you@example.com"/></div><div id="forgotTurnstileBox"></div><button class="btn btn-primary full-btn" type="submit">发送重置链接</button></form><div class="auth-extra"><button data-action="switch-auth" data-mode="login">返回登录</button></div>`,'sm');
 if(!PREVIEW&&state.meta.turnstileSitekey)setupTurnstile('forgotTurnstileBox');
}
function openResetPassword(token){
 if(!token){toast('重置链接不正确');return;}
 modal('设置新密码',`<form id="resetPasswordForm"><input type="hidden" name="token" value="${h(token)}"/><div class="form-group"><label>新密码（至少10位）</label><input class="form-input" type="password" name="newPassword" minlength="10" maxlength="128" autocomplete="new-password" required /></div><div class="form-group"><label>确认新密码</label><input class="form-input" type="password" name="confirmPassword" minlength="10" maxlength="128" autocomplete="new-password" required/></div><button class="btn btn-primary full-btn" type="submit">确认重设密码</button></form>`,'sm');
}
function openChangePassword(){
 if(!state.user){openAuth('login');return;}
 modal('账号安全 · 修改密码',`<form id="changePasswordForm"><p class="muted">更改密码后，其他设备的登录会话会自动失效。</p><div class="form-group"><label>当前登录密码</label><input class="form-input" type="password" name="currentPassword" maxlength="128" autocomplete="current-password" required /></div><div class="form-group"><label>新密码（10-128位）</label><input class="form-input" type="password" name="newPassword" minlength="10" maxlength="128" autocomplete="new-password" required /></div><div class="form-group"><label>确认新密码</label><input class="form-input" type="password" name="confirmPassword" minlength="10" maxlength="128" autocomplete="new-password" required /></div><button class="btn btn-primary full-btn" type="submit">保存新密码</button></form>`,'sm');
}
let turnstileToken='',turnstileWidgetId=null,turnstileContainer=null,turnstileGeneration=0,turnstileLoading=null;
function setupTurnstile(boxId='turnstileBox'){
 turnstileToken='';const generation=++turnstileGeneration;
 if(turnstileWidgetId!==null&&window.turnstile){try{window.turnstile.remove(turnstileWidgetId);}catch{}}
 turnstileWidgetId=null;turnstileContainer=null;
 const render=()=>{
  const box=$('#'+boxId);if(generation!==turnstileGeneration||!box||!window.turnstile)return;
  turnstileContainer=box;
  turnstileWidgetId=window.turnstile.render(box,{sitekey:state.meta.turnstileSitekey,
   callback:token=>{if(generation===turnstileGeneration)turnstileToken=token},
   'expired-callback':()=>{if(generation===turnstileGeneration)turnstileToken=''},
   'error-callback':()=>{if(generation===turnstileGeneration)turnstileToken=''}});
 };
 if(window.turnstile){render();return;}
 if(!turnstileLoading)turnstileLoading=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.onload=resolve;script.onerror=()=>{script.remove();turnstileLoading=null;reject(Error('人机验证服务暂不可用，请稍后重试'));};document.head.append(script);});
 turnstileLoading.then(render).catch(e=>toast(e.message));
}
function refreshTurnstile(){
 turnstileToken='';if(turnstileWidgetId===null||!turnstileContainer?.isConnected||!window.turnstile)return;
 try{window.turnstile.reset(turnstileWidgetId);}catch{setupTurnstile(turnstileContainer.id);}
}
function openCompose(exposure=false){if(!state.user){openAuth('login');toast('登录后才可发帖');return;}state.uploaded={public:[],private:[],comment:[]};modal('发表'+(exposure?'风险线索':'社区帖子'),`<form id="composeForm"><div class="form-grid"><div class="form-group"><label>发布类型</label><select name="type" class="form-input"><option value="${exposure?'exposure':'discussion'}">${exposure?'风险曝光':'交流讨论'}</option><option value="${exposure?'discussion':'exposure'}">${exposure?'交流讨论':'风险曝光'}</option></select></div><div class="form-group"><label>所属板块</label><select name="category" class="form-input">${state.sections.filter(x=>x.kind!=='page'&&x.enabled).map(x=>`<option value="${h(x.slug)}" ${x.slug===(exposure?'warning':'chat')?'selected':''}>${h(sectionTitle(x))}</option>`).join('')}</select></div></div><div class="form-group"><label>帖子标题</label><input name="title" class="form-input" maxlength="140" minlength="6" required placeholder="用客观标题说明主题（6-140字）" /></div><div class="form-group"><label>正文内容</label><textarea id="composeBody" class="form-input" name="body" minlength="15" maxlength="6000" required placeholder="请描述时间线、发生的事情、交易流程、客观证据。切勿输入密钥、手机号码、证件号或银行卡号。"></textarea>${emojiTools('composeBody')}</div><div class="form-group"><label class="check-line"><input type="checkbox" name="anonymous" /> 前台匿名显示（平台仍记录提交者账号）</label></div><div class="upload-grid"><label class="upload-zone">▧ 公开图片 · 最多 20 张<input id="publicFiles" type="file" accept="image/jpeg,image/png,image/webp" multiple /><div id="publicUploaded" class="uploaded-file">JPG / PNG / WebP，单张 ≤5 MB</div></label><label class="upload-zone">⬡ 私密证据 · 最多 20 张<input id="privateFiles" type="file" accept="image/jpeg,image/png,image/webp" multiple /><div id="privateUploaded" class="uploaded-file">仅提交者及授权审核员可见</div></label></div><div class="hint danger-hint">⚠️ 风险曝光与带图帖子需要人工审核才可公开。图片不支持视频、GIF、SVG。敏感信息务必先打码。</div><div class="modal-actions"><button class="btn btn-light" type="button" data-action="close-modal">取消</button><button class="btn btn-primary" type="submit">提交帖子</button></div></form>`,'wide');}
async function uploadFiles(kind,files){const dest=kind==='private'?'private':kind==='comment'?'comment':'public';if(!files.length)return;
if(files.length+state.uploaded[dest].length>20)throw Error('每个输入栏最多支持20张图片，本次选择超过剩余数量');
if(files.some(file=>!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024))throw Error('仅支持 5MB 以内的 JPG/PNG/WebP');
state.uploadPending++;try{for(const file of files){const form=new FormData();form.append('purpose',kind==='comment'?'public':dest);form.append('image',file);const res=await request('/api/upload',{method:'POST',body:form});state.uploaded[dest].push({id:res.id,name:file.name});const feedback=$('#'+dest+'Uploaded');if(feedback)feedback.textContent=`已上传 ${state.uploaded[dest].length}/20 张 · ${file.name}`;}toast('图片上传成功');}finally{state.uploadPending--;const inp=$('#'+(dest==='public'?'publicFiles':dest==='private'?'privateFiles':'commentFiles'));if(inp)inp.value='';}}

function openReport(id){if(!state.user){openAuth('login');return;}modal('举报内容',`<form id="reportForm"><input type="hidden" name="targetId" value="${h(id)}" /><div class="form-group"><label>举报理由</label><select name="reason" class="form-input"><option value="false_info">疑似不实信息</option><option value="privacy">侵犯隐私 / 泄露密钥</option><option value="fraud">疑似诈骗线索</option><option value="abuse">辱骂或人身攻击</option><option value="other">其他问题</option></select></div><div class="form-group"><label>补充说明</label><textarea class="form-input" name="details" minlength="10" maxlength="2000" required placeholder="请提供具体理由，便于管理员核查"></textarea></div><div class="modal-actions"><button class="btn btn-primary" type="submit">提交举报</button></div></form>`,'sm');}
function openAppeal(id){if(!state.user){openAuth('login');return;}modal('申诉与纠错',`<form id="appealForm"><input type="hidden" name="postId" value="${h(id)}" /><p class="muted">当事方或相关用户可提供纠错线索。接受申诉不会自动恢复争议内容，而是进入重新审核。</p><div class="form-group"><label>申诉内容</label><textarea class="form-input" name="reason" minlength="10" maxlength="2000" required placeholder="请说明不准确之处及可以核实的事实"></textarea></div><div class="modal-actions"><button class="btn btn-primary" type="submit">提交申诉</button></div></form>`,'sm');}
function openPermission(id){if(state.user?.role!=='super_admin'){toast('只有超级管理员可以授权');return;}const u=(state.adminUsers||[]).find(x=>x.id===id);if(!u)return;
modal(`${t('授权管理')} · ${u.username}`,`<form id="permissionForm"><input type="hidden" name="id" value="${h(id)}" /><p class="hint">只有超级管理员能修改。把角色切回普通用户，可立即撤销全部管理权限。</p><div class="form-group"><label>角色设置</label><select class="form-input" name="role"><option value="member" ${u.role==='member'?'selected':''}>普通会员 · 无管理权限</option><option value="moderator" ${u.role==='moderator'?'selected':''}>普通管理员 · 按项授权</option></select></div><div class="manage-group"><strong>管理权限清单</strong><div class="permission-grid">${P.map(k=>`<label class="check-line"><input type="checkbox" name="permission" value="${h(k)}" ${u.permissions.includes(k)?'checked':''} /> ${h(PN[k])}</label>`).join('')}</div></div><div class="modal-actions"><button class="btn btn-primary" type="submit">保存权限 / 撤销授权</button></div></form>`,'sm');}
function openMute(id){const u=state.adminUsers?.find(x=>x.id===id);if(!u)return;
 const d=new Date(Date.now()+24*3600*1000);const local=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);
 modal('禁言管理 · '+u.username,`<form id="muteForm"><input type="hidden" name="id" value="${h(id)}"/><p class="hint">普通管理员只能禁言普通会员；超级管理员可禁言管理员或会员，不能禁言其他超级管理员。</p><div class="form-group"><label>禁言时长 / 解除禁言</label><select name="duration" class="form-input"><option value="1h">1 小时</option><option value="24h">24 小时</option><option value="7d">7 天</option><option value="custom">自定义日期时间（精确到分钟）</option><option value="permanent">长期禁言</option><option value="unmute">解除禁言</option></select></div><div id="muteCustomGroup" class="form-group" hidden><label>选择解除禁言的日期与时间（设备当地时间）</label><input class="form-input" type="datetime-local" name="untilLocal" min="${new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16)}" value="${local}" step="60" /><small class="muted">按本设备时区输入，提交时统一转为 UTC；最多设到未来五年。</small></div><div class="form-group"><label>原因（禁言时至少 5 字）</label><textarea name="reason" class="form-input" maxlength="300" placeholder="违规内容及处理依据"></textarea></div><button class="btn btn-primary full-btn" type="submit">保存禁言设置</button></form>`,'sm');}

function openSection(id){const x=id?state.adminSections?.find(z=>z.id===id):null;modal(x?'编辑社区栏目':'新建栏目 / 独立网页',`<form id="sectionForm"><input type="hidden" name="id" value="${h(id||'')}"/><div class="form-grid"><div class="form-group"><label>栏目名称</label><input class="form-input" required minlength="2" maxlength="40" name="title" value="${h(x?.title||'')}" placeholder="例如：服务商评价" /></div><div class="form-group"><label>栏目标识（英文，不可修改）</label><input class="form-input" required name="slug" minlength="2" maxlength="64" ${x?'readonly':''} value="${h(x?.slug||'')}" placeholder="vendor-reviews" /></div></div><div class="form-grid"><div class="form-group"><label>栏目类型</label><select name="kind" class="form-input">${[['discussion','交流讨论板块'],['exposure','风险曝光板块'],['page','独立内容网页']].map(([k,v])=>`<option value="${k}" ${x?.kind===k?'selected':''}>${v}</option>`).join('')}</select></div><div class="form-group"><label>图标（字符 / Emoji）</label><input name="icon" maxlength="8" class="form-input" value="${h(x?.icon||'◈')}" /></div></div><div class="form-group"><label>简短说明</label><input name="description" maxlength="240" class="form-input" value="${h(x?.description||'')}" /></div><div class="form-group"><label>独立网页内容（只显示纯文本，不执行 HTML）</label><textarea name="page_content" class="form-input" maxlength="10000" placeholder="如果选择独立网页，可以在这里编写正文">${h(x?.page_content||'')}</textarea></div><div class="form-grid"><div class="form-group"><label>排列顺序（数字小的靠前）</label><input name="sort_order" type="number" min="1" max="9999" class="form-input" value="${x?.sort_order||100}" /></div><div class="form-group"><label>公开状态</label><select name="enabled" class="form-input"><option value="1" ${x?.enabled===0?'':'selected'}>开放</option><option value="0" ${x?.enabled===0?'selected':''}>关闭（导航隐藏）</option></select></div></div><p class="hint">注意：更新讨论板块为独立网页时，如果已产生帖子，会拒绝修改类型。关闭不等于删除。</p><button class="btn btn-primary full-btn" type="submit">保存栏目配置</button></form>`,'wide');}
async function reloadSections(){const x=await request('/api/sections');state.sections=x.items||[];side();statsView();}
async function detail(id){
 const isNewDetail=state.view!=='detail';
 const from=isNewDetail?captureDetailOrigin():state.returnTo;
 const result=await request(`/api/posts/${encodeURIComponent(id)}`);
 if(isNewDetail)state.returnTo=from;
 state.translatedPost=null;state.uploaded.comment=[];
 state.detail=result;state.view='detail';render();window.scrollTo(0,0);
 if(!PREVIEW&&result.post.status==='published')request('/api/translation/languages').then(c=>{state.translationCapabilities=c;if(state.view==='detail'&&state.detail?.post.id===result.post.id)updateTranslationButton();}).catch(()=>{});
}
async function execute(e){const el=e.target.closest('[data-action]');if(!el)return;const {action,id,view,type,sort,category,tab,role,mode,decision,kind,status}=el.dataset;
if(action==='translate-post'){
 const lang=window.TrustI18n.locale(),post=state.detail?.post;
 if(!post)return;
 if(state.translatedPost?.id===post.id&&state.translatedPost.lang===lang){state.translatedPost=null;render();return;}
 if(lang==='zh-CN'&&/[\u3400-\u9fff]/.test(post.body)&&PREVIEW){toast('当前已是中文原文');return;}
 el.disabled=true;el.textContent=t('正在翻译…');
 try{const result=await request(`/api/posts/${encodeURIComponent(post.id)}/translate`,{method:'POST',body:JSON.stringify({target:lang})});state.translatedPost={...result.translated,id:post.id};render();}
 catch(err){el.disabled=false;el.textContent='🌐 '+t('翻译到当前语言');throw err;}
 return;
}
if(action==='donation-copy'){
 try{await navigator.clipboard.writeText(el.dataset.address||'');toast('已复制地址');}catch{toast('复制失败，请手动选中地址');}return;
}
if(action==='donation-add'){
 const rows=$('#donationEditorRows');if(rows.children.length>=10){toast('最多10条捐赠地址');return;}rows.insertAdjacentHTML('beforeend',donationRow());window.TrustI18n?.apply(rows.lastElementChild);return;
}
if(action==='donation-remove'){el.closest('.donation-row')?.remove();return;}
if(action==='admin-user-reset'){state.adminUserQ='';state.adminUserRole='';await renderAdminPanel();return;}
if(action==='audit-search-reset'){state.auditQ='';state.auditPage=1;await renderAdminPanel();return;}
if(action==='audit-more'){state.auditPage++;await renderAdminPanel();return;}
if(action==='search-go'){await performSearch();return;}
if(action==='search-clear'){state.q='';$('#searchInput').value='';await navigate('home');return;}
if(action==='theme'){setTheme(theme==='dark'?'light':'dark');return;}
if(action==='close-modal'){closeModal();return;}
if(action==='home'){await navigate('home');return;}
if(action==='nav'){await navigate(view);return;}
if(action==='section'){state.q='';state.sectionSlug=el.dataset.slug;state.view='section';state.type='all';state.category='';state.page=1;const x=state.sections.find(z=>z.slug===state.sectionSlug);if(x?.kind!=='page')await loadFeed();render();return;}
if(action==='category'){state.category=state.category===category?'':category;await navigate('home',{keepCategory:true});return;}
if(action==='filter'){state.type=type;state.page=1;await loadFeed();render();return;}
if(action==='sort'){state.sort=sort;state.page=1;await loadFeed();render();return;}
if(action==='more'){state.page++;await loadFeed(true);render();return;}
if(action==='auth'){openAuth('login');return;}
if(action==='register'){openAuth('register');return;}
if(action==='forgot-password'){openForgotPassword();return;}
if(action==='security-settings'){openChangePassword();return;}
if(action==='preview-reset'){openResetPassword(state.demoResetToken);return;}
if(action==='switch-auth'){openAuth(mode);return;}

if(action==='logout'){await request('/api/auth/logout',{method:'POST'});state.user=null;state.csrf='';myStickers.length=0;await initializeAuth();toast('已退出登录');await navigate('home');return;}
if(action==='compose'){openCompose();return;}
if(action==='compose-exposure'){openCompose(true);return;}
if(action==='rules'){await navigate('guide');return;}
if(action==='back'){await returnFromDetail();return;}
if(action==='detail'){await detail(id);return;}
if(action==='like'){if(!state.user){openAuth('login');return;}const result=await request(`/api/posts/${id}/like`,{method:'POST'});state.detail.post.likes_count=result.likes;render();return;}
if(action==='report'){openReport(id);return;}
if(action==='appeal'){openAppeal(id);return;}
if(action==='batch-clear'){batchSelected.delete(state.adminTab);await renderAdminPanel();return;}
if(action==='batch-start'){openBatchDialog(el.dataset.batchAction);return;}
if(action==='admin-tab'){if(tab==='staff'&&state.user?.role!=='super_admin'){toast('只有超级管理员可操作');return;}state.adminTab=tab;render();return;}
if(action==='emoji-toggle'){const target=el.dataset.target,pop=$('#emoji-'+target);if(pop){pop.hidden=!pop.hidden;el.setAttribute('aria-expanded',String(!pop.hidden));if(!pop.hidden){emojiTabs[target] ||= 'recent';if(emojiTabs[target]==='my')await loadMyStickers();renderEmoji(target);if(emojiTabs[target]!=='my')pop.querySelector('.emoji-search')?.focus();}}return;}
if(action==='emoji-close'){const target=el.dataset.target,pop=$('#emoji-'+target);if(pop)pop.hidden=true;document.querySelector(`[data-action=emoji-toggle][data-target="${target}"]`)?.setAttribute('aria-expanded','false');return;}
if(action==='emoji-category'){emojiTabs[el.dataset.target]=el.dataset.category;emojiSearch[el.dataset.target]='';if(el.dataset.category==='my')await loadMyStickers();renderEmoji(el.dataset.target);return;}
if(action==='emoji-insert'){insertEmoji(el.dataset.target,el.dataset.emoji);return;}
if(action==='sticker-insert'){insertSticker(el.dataset.target,el.dataset.id);return;}
if(action==='sticker-delete'){if(!confirm('删除自己收藏的这张表情？已发布内容中的图片也会失效。'))return;await request(`/api/stickers/${id}/delete`,{method:'POST',body:'{}'});await loadMyStickers();renderEmoji(el.dataset.target);toast('已从私人表情库删除');return;}
if(action==='sticker-moderate'){if(!confirm(status==='deleted'?'永久删除此表情？':'确定执行该表情审核操作？'))return;await request(`/api/admin/stickers/${id}/status`,{method:'POST',body:JSON.stringify({status})});toast('表情治理操作完成');await renderAdminPanel();return;}
if(action==='mute-user'){openMute(id);return;}
if(action==='create-section'){openSection('');return;}
if(action==='edit-section'){openSection(id);return;}
if(action==='delete-section'){if(!confirm('永久删除没有帖子的栏目？有帖子的栏目只能关闭。'))return;await request(`/api/admin/sections/${id}/delete`,{method:'POST',body:'{}'});toast('栏目已删除');await reloadSections();render();return;}
if(action==='manage-user'){openPermission(id);return;}
if(action==='review-post'){
 const note=decision==='published'?'已审核证据并核查公开信息':prompt(decision==='removed'?'填写下架依据（至少5字，审计留痕）':'填写驳回依据（至少5字，审计留痕）','');
 if(note===null)return;
 if(note.trim().length<5){toast('请填写至少5字处理原因');return;}
 if(!confirm(decision==='published'?'确认已审核证据、完成脱敏，允许公开？':decision==='removed'?'确定下架该帖子？':'确定驳回该帖子？'))return;
 await request(`/api/admin/posts/${id}/review`,{method:'POST',body:JSON.stringify({decision,note:note.trim()})});
 toast('处理成功');
 if(state.view==='detail'){
  if(['admin','super'].includes(state.returnTo?.view))await returnFromDetail();
  else if(decision==='removed')await returnFromDetail({refreshFeed:true});
  else await detail(id);
 }else if(['admin','super'].includes(state.view))await renderAdminPanel();
 else render();
 return;
}
if(action==='review-comment-context'){
 const data=await request('/api/admin/comments/'+encodeURIComponent(id)+'/context'),c=data.comment,p=data.post;
 modal('待审评论',`<section id="commentReviewContext"><h3 data-no-translate>${h(p.restricted?t('关联帖子暂未公开'):p.title)}</h3>${p.body?`<p class="detail-body" data-no-translate>${h(p.body)}</p>`:''}<hr><p class="detail-body" data-no-translate>${richBody(c.body)}</p><div class="detail-image-grid">${(c.images||[]).map(x=>`<img src="${h(x.url)}" alt="评论图片" loading="lazy">`).join('')}</div><div class="modal-actions">${roleOk('comments.review')&&c.status==='pending'?`<button class="btn btn-primary" data-action="review-comment" data-id="${h(c.id)}" data-decision="published">通过</button>`:''}${roleOk('comments.remove')&&['pending','published'].includes(c.status)?`<button class="btn btn-outline-danger" data-action="review-comment" data-id="${h(c.id)}" data-decision="hidden">隐藏</button>`:''}</div></section>`,'wide');return;
}
if(action==='review-comment'){

 const note=decision==='hidden'?prompt('请填写隐藏评论的依据（至少5字，审计留痕）',''):'经人工审核符合社区规定';
 if(note===null)return;if(note.trim().length<5){toast('请填写至少5字处理原因');return;}
 await request(`/api/admin/comments/${id}/review`,{method:'POST',body:JSON.stringify({decision,note:note.trim()})});
 if($('#commentReviewContext'))closeModal();toast('评论处理完成');
 if(state.view==='detail')await detail(state.detail.post.id);
 else if(['admin','super'].includes(state.view))await renderAdminPanel();
 else render();return;
}
if(action==='admin-resolve'){
 const note=prompt('请填写举报或申诉的处理依据（至少5字，保存到操作审计）','');
 if(note===null)return;if(note.trim().length<5){toast('请填写至少5字处理原因');return;}
 await request(`/api/admin/${kind}/${id}/review`,{method:'POST',body:JSON.stringify({status,note:note.trim()})});toast('处理成功');if(['admin','super'].includes(state.view))await renderAdminPanel();else render();return;
}
}
async function submitForm(e){const form=e.target;const formId=form.getAttribute('id');if(!['authForm','composeForm','commentForm','reportForm','appealForm','permissionForm','muteForm','sectionForm','donationForm','forgotPasswordForm','resetPasswordForm','changePasswordForm','batchForm'].includes(formId))return;e.preventDefault();const button=form.querySelector('[type=submit]');if(button)button.disabled=true;let consumedChallenge=false;
try{if(!PREVIEW&&state.meta.turnstileSitekey&&['authForm','forgotPasswordForm'].includes(formId)&&!turnstileToken)throw Error('请完成人机验证');const fd=new FormData(form);const v=k=>String(fd.get(k)||'').trim();
if(formId==='batchForm'){
 const ctx=state.pendingBatch;if(!ctx||ctx.tab!==state.adminTab)throw Error('批次页面已改变，请重新选择');
 if(v('note').length<5||v('note').length>500)throw Error('请输入5-500字处理理由');
 if(['posts','comments'].includes(ctx.resource)&&ctx.action==='published'&&!fd.has('reviewedEvidence'))throw Error('批量公开前请确认已逐项核验');
 const result=await request('/api/admin/batch',{method:'POST',body:JSON.stringify({resource:ctx.resource,action:ctx.action,ids:ctx.ids,note:v('note'),reviewedEvidence:fd.has('reviewedEvidence')})});
 batchSelected.delete(ctx.tab);state.pendingBatch=null;closeModal();await renderAdminPanel();
 const report=document.createElement('section');report.className='batch-result';report.setAttribute('role','status');report.innerHTML=`<strong>批量操作结果 · ${h(result.batchId||'演示')}</strong><p>申请 ${result.requested} 条 · 成功 ${result.succeeded} 条 · 失败 ${result.failed} 条</p>`+
 (result.results||[]).filter(x=>!x.ok).map(x=>`<p class="batch-error">#${h(x.id)}：${h(x.error||'处理失败')}</p>`).join('');
 $('#adminPanel')?.prepend(report);toast('批量处理已完成，请查看结果明细');return;
}

if(['forgotPasswordForm','resetPasswordForm','changePasswordForm'].includes(formId)){
 const newPassword=String(fd.get('newPassword')||''),confirmPassword=String(fd.get('confirmPassword')||'');
 if(formId!=='forgotPasswordForm'&&(newPassword.length<10||newPassword.length>128||newPassword!==confirmPassword))throw Error('密码必须为10-128位，且两次输入相同');
 if(formId==='forgotPasswordForm'){
   consumedChallenge=true;const r=await request('/api/auth/password/forgot',{method:'POST',body:JSON.stringify({email:v('email'),turnstileToken})});
   if(PREVIEW&&r.demoToken){state.demoResetToken=r.demoToken;modal('模拟重置邮件',`<p class="muted">${h(r.message)}<br/>独立 HTML 演示不会发真实邮件，可点击下方按钮模拟打开一次性邮件链接。</p><button class="btn btn-primary full-btn" type="button" data-action="preview-reset">打开模拟重置邮件</button>`,'sm');}
   else modal('邮件已请求',`<p>${h(r.message||'如邮箱已注册，我们会发送密码重置邮件。')}</p><button class="btn btn-soft" data-action="switch-auth" data-mode="login">返回登录</button>`,'sm');
 }else if(formId==='resetPasswordForm'){
   await request('/api/auth/password/reset',{method:'POST',body:JSON.stringify({token:v('token'),newPassword})});state.user=null;state.demoResetToken=null;closeModal();await initializeAuth();toast('密码已重置，请重新登录');openAuth('login');
 }else{
   await request('/api/auth/password/change',{method:'POST',body:JSON.stringify({currentPassword:String(fd.get('currentPassword')||''),newPassword})});closeModal();toast('密码已更新，其他设备已退出登录');
 }
 return;
}
if(formId==='authForm'){
 const payload={email:v('email'),password:String(fd.get('password')||''),turnstileToken};if(v('mode')==='register')payload.username=v('username');
 consumedChallenge=true;const auth=await request('/api/auth/'+v('mode'),{method:'POST',body:JSON.stringify(payload)});state.user=auth.user;state.csrf=auth.csrf;myStickers.length=0;closeModal();toast(v('mode')==='register'?'注册成功':'登录成功');await navigate('home');await refreshStats();return;
}
if(formId==='composeForm'){if(state.uploadPending)throw Error('图片还在上传中，请上传完成后再提交');const result=await request('/api/posts',{method:'POST',body:JSON.stringify({type:v('type'),category:v('category'),title:v('title'),body:v('body'),anonymous:fd.has('anonymous'),publicImages:state.uploaded.public.map(x=>x.id),privateEvidence:state.uploaded.private.map(x=>x.id)})});closeModal();toast(result.message||'已提交');await navigate('mine');await refreshStats();return;}
if(formId==='commentForm'){if(state.uploadPending)throw Error('图片还在上传中，请上传完成后再提交');if(!state.user){openAuth('login');return;}const id=state.detail.post.id;const result=await request(`/api/posts/${id}/comments`,{method:'POST',body:JSON.stringify({body:v('body'),images:state.uploaded.comment.map(x=>x.id)})});state.uploaded.comment=[];toast(result.status==='pending'?'评论已提交，等待审核':'评论已发布');await detail(id);return;}
if(formId==='reportForm'){await request('/api/reports',{method:'POST',body:JSON.stringify({targetType:'post',targetId:v('targetId'),reason:v('reason'),details:v('details')})});closeModal();toast('举报已提交，工作人员将核查');return;}
if(formId==='appealForm'){await request('/api/appeals',{method:'POST',body:JSON.stringify({postId:v('postId'),reason:v('reason')})});closeModal();toast('申诉已提交');return;}
if(formId==='muteForm'){
 const duration=v('duration'), local=v('untilLocal');let until;
 if(duration==='custom'){if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local))throw Error('请选择精确到分钟的结束时间');const dt=new Date(local);if(!Number.isFinite(dt.getTime())||dt.getTime()<=Date.now()+60000)throw Error('结束时间必须晚于当前一分钟');until=dt.toISOString().slice(0,16)+':00Z';}
 await request(`/api/admin/users/${v('id')}/mute`,{method:'POST',body:JSON.stringify({duration,until,reason:v('reason')})});closeModal();toast('禁言设置已更新');render();return;}
if(formId==='sectionForm'){if(!/^[a-z][a-z0-9-]{1,63}$/.test(v('slug')))throw Error('栏目标识应为 2-64 位英文小写字母、数字或连字符，首位必须是字母');const payload={title:v('title'),slug:v('slug'),kind:v('kind'),icon:v('icon'),description:v('description'),page_content:v('page_content'),sort_order:Number(v('sort_order')),enabled:v('enabled')==='1'};await request(v('id')?`/api/admin/sections/${v('id')}/update`:'/api/admin/sections',{method:'POST',body:JSON.stringify(payload)});closeModal();toast('栏目已保存');await reloadSections();render();return;}
if(formId==='donationForm'){
 if(state.user?.role!=='super_admin')throw Error('仅超级管理员有编辑权限');
 const items=[...form.querySelectorAll('.donation-row')].map(row=>({id:row.querySelector('[data-donate-field=id]').value,asset:row.querySelector('[data-donate-field=asset]').value,network:row.querySelector('[data-donate-field=network]').value,address:row.querySelector('[data-donate-field=address]').value.trim()}));
 if(items.some(it=>!DONATION_NETWORKS_BY_ASSET[it.asset]?.includes(it.network)))throw Error('币种与网络不匹配，请核对并重新选择');
 const result=await request('/api/admin/donations',{method:'POST',body:JSON.stringify({revision:Number(v('revision')),password:String(fd.get('password')||''),items})});
 state.donations={revision:result.revision,items:result.items};drawDonations();toast('捐赠信息已保存');await renderAdminPanel();return;
}
if(formId==='permissionForm'){const p=fd.getAll('permission');if(v('role')==='moderator'&&p.length===0)throw Error('任命管理员时请至少选择一项权限；如需撤销请选普通会员');await request(`/api/admin/users/${v('id')}/permissions`,{method:'POST',body:JSON.stringify({role:v('role'),permissions:v('role')==='member'?[]:p})});closeModal();toast('权限已更新');render();return;}
}catch(err){toast(err.message||'操作失败');}finally{if(consumedChallenge&&!PREVIEW&&form.isConnected)refreshTurnstile();if(button)button.disabled=false;}
}
async function initializeAuth(){const result=await request('/api/auth/me');state.user=result.user;state.csrf=result.csrf;}
async function performSearch(){
 const input=$('#searchInput');if(!input)return;
 const q=input.value.trim().replace(/\s+/g,' ').slice(0,70);
 if(!q){toast('请输入搜索关键词');input.focus();return;}
 state.q=q;state.view='home';state.type='all';state.category='';state.sectionSlug='';state.page=1;state.detail=null;
 await loadFeed();render();window.scrollTo({top:0,behavior:'smooth'});
}
document.addEventListener('input',e=>{if(e.target.matches('[data-emoji-search]')){const target=e.target.dataset.emojiSearch;emojiSearch[target]=e.target.value;renderEmoji(target,true);}});
document.addEventListener('change',e=>{
 if(e.target.matches('[data-batch-id]')){const tab=state.adminTab,set=batchSelected.get(tab)||new Set(),id=e.target.dataset.batchId;if(e.target.checked)set.add(id);else set.delete(id);batchSelected.set(tab,set);updateBatchSelected();return;}
 if(e.target.matches('[data-batch-all]')){const tab=state.adminTab,set=batchSelected.get(tab)||new Set();const inputs=[...document.querySelectorAll('#adminPanel [data-batch-id]')];for(const input of inputs){input.checked=e.target.checked;if(e.target.checked)set.add(input.dataset.batchId);else set.delete(input.dataset.batchId);}batchSelected.set(tab,set);updateBatchSelected();return;}

 if(e.target.matches('#muteForm [name="duration"]')){const panel=$('#muteCustomGroup');if(panel){panel.hidden=e.target.value!=='custom';const f=panel.querySelector('input');f.required=e.target.value==='custom';}return;}
 if(e.target.matches('[data-donate-field="asset"]')){
  const row=e.target.closest('.donation-row');if(!row)return;
  const id=row.querySelector('[data-donate-field="id"]').value;
  const asset=e.target.value;
  const fragment=document.createElement('div');fragment.innerHTML=donationRow({id,asset,address:''});
  const updated=fragment.firstElementChild;row.replaceWith(updated);
  window.TrustI18n?.apply(updated);return;
 }
 if(e.target.matches('select[data-donate-field="network"]')){
  // Even identical-looking addresses on different networks must be actively re-entered.
  const row=e.target.closest('.donation-row');if(row)row.querySelector('[data-donate-field="address"]').value='';
  return;
 }
 if(e.target.id==='languageSelect'){window.TrustI18n.set(e.target.value);state.translatedPost=null;render();return;}if(e.target.matches('[data-sticker-upload]')){const file=e.target.files?.[0];if(!file)return;const target=e.target.dataset.stickerUpload;act(async()=>{if(file.size>1048576||!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('自定义表情必须是1MB以内的静态 JPG/PNG/WebP');const f=new FormData();f.append('image',file);await request('/api/stickers/upload',{method:'POST',body:f});await loadMyStickers();emojiTabs[target]='my';renderEmoji(target);toast('已加入你的私人表情库');});e.target.value='';return;}if(['publicFiles','privateFiles','commentFiles'].includes(e.target.id))act(()=>uploadFiles(e.target.id==='publicFiles'?'public':e.target.id==='privateFiles'?'private':'comment',Array.from(e.target.files||[])));});
document.addEventListener('click',e=>act(()=>execute(e)));
document.addEventListener('submit',e=>{
 if(e.target.id==='adminUserSearchForm'){e.preventDefault();const fd=new FormData(e.target);state.adminUserQ=String(fd.get('q')||'').trim();state.adminUserRole=String(fd.get('role')||'');act(renderAdminPanel);return;}
 if(e.target.id==='auditSearchForm'){e.preventDefault();const fd=new FormData(e.target);state.auditQ=String(fd.get('q')||'').trim();state.auditPage=1;act(renderAdminPanel);return;}
 if(e.target.id==='searchForm'){e.preventDefault();act(performSearch);return;}if(e.target.matches('#authForm,#composeForm,#commentForm,#reportForm,#appealForm,#permissionForm,#muteForm,#sectionForm,#donationForm,#forgotPasswordForm,#resetPasswordForm,#changePasswordForm,#batchForm')){e.preventDefault();act(()=>submitForm(e));}});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
const incomingResetToken=new URLSearchParams(location.hash.replace(/^#/, '')).get('reset')||new URLSearchParams(location.search).get('reset');
if(incomingResetToken){try{history.replaceState(null,'',location.pathname+location.hash);}catch{}}
(async()=>{try{state.meta=await request('/api/meta');await initializeAuth();await reloadSections();await loadFeed();render();await refreshStats();await refreshDonations();if(incomingResetToken)openResetPassword(incomingResetToken);}catch(e){console.error(e);$('#mainContent').innerHTML=`<div class="empty"><h3>无法连接到社区服务</h3><p>${h(e.message)}</p><p>如果要离线体验，请打开独立 HTML 预览文件。</p></div>`;}})();
})();
