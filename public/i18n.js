/* V2.4: explicit language selection, never IP/browser autodetect. User-authored content is not auto-translated. */
(function(){'use strict';
const LANGUAGES=[
 ['zh-CN','简体中文'],['zh-TW','繁體中文'],['en','English'],['ja','日本語'],['ko','한국어'],
 ['fr','Français'],['de','Deutsch'],['es','Español'],['pt-BR','Português'],['it','Italiano'],
 ['ru','Русский'],['ar','العربية'],['hi','हिन्दी'],['th','ไทย'],['vi','Tiếng Việt'],
 ['ms','Bahasa Melayu'],['id','Bahasa Indonesia'],['tr','Türkçe'],['nl','Nederlands'],
 ['pl','Polski'],['uk','Українська'],['fa','فارسی'],['bn','বাংলা'],['ur','اردو']
];
const CORE=['社区首页','举报曝光','交流讨论','我的帖子','防骗指南','管理员后台','超级管理员后台','登录','退出','发表帖子','表情','我的表情','上传自定义表情','公开图片','私密证据','提交评论','提交帖子','注册新账号','语言','禁用','恢复','删除','表情包治理','栏目管理'];
const CORE_TEXT={
'en':['Community home','Risk reports','Discussion','My posts','Safety guide','Moderator console','Super admin console','Log in','Log out','Create post','Emoji','My stickers','Upload custom sticker','Public images','Private evidence','Post comment','Submit post','Create account','Language','Disable','Restore','Delete','Sticker moderation','Section management'],
'zh-TW':['社區首頁','檢舉曝光','交流討論','我的貼文','防騙指南','管理員後台','超級管理員後台','登入','登出','發表貼文','表情','我的表情','上傳自訂表情','公開圖片','私人證據','送出留言','送出貼文','註冊新帳號','語言','停用','恢復','刪除','表情管理','欄目管理'],
'ja':['コミュニティ','通報','ディスカッション','自分の投稿','安全ガイド','管理者画面','最高管理者画面','ログイン','ログアウト','投稿する','絵文字','マイスタンプ','スタンプを追加','公開画像','非公開証拠','コメントを投稿','投稿を送信','新規登録','言語','無効化','復元','削除','スタンプ管理','カテゴリー管理'],
'ko':['커뮤니티 홈','신고 게시판','토론','내 게시물','안전 가이드','관리자 콘솔','최고 관리자 콘솔','로그인','로그아웃','게시물 작성','이모지','내 스티커','스티커 업로드','공개 이미지','비공개 증거','댓글 등록','게시물 등록','회원가입','언어','비활성화','복원','삭제','스티커 관리','게시판 관리'],
'fr':['Accueil','Signalements','Discussions','Mes publications','Guide de sécurité','Modération','Super administration','Connexion','Déconnexion','Publier','Émojis','Mes autocollants','Ajouter un autocollant','Images publiques','Preuves privées','Commenter','Envoyer','Créer un compte','Langue','Désactiver','Restaurer','Supprimer','Modérer les autocollants','Gérer les rubriques'],
'de':['Startseite','Meldungen','Diskussion','Meine Beiträge','Sicherheitsleitfaden','Moderation','Superadministration','Anmelden','Abmelden','Beitrag erstellen','Emoji','Meine Sticker','Sticker hochladen','Öffentliche Bilder','Private Belege','Kommentar senden','Beitrag senden','Registrieren','Sprache','Deaktivieren','Wiederherstellen','Löschen','Sticker verwalten','Rubriken verwalten'],
'es':['Inicio','Denuncias','Debate','Mis publicaciones','Guía de seguridad','Panel de moderación','Superadministración','Iniciar sesión','Cerrar sesión','Publicar','Emojis','Mis stickers','Subir sticker','Imágenes públicas','Pruebas privadas','Enviar comentario','Enviar publicación','Crear cuenta','Idioma','Desactivar','Restaurar','Eliminar','Moderar stickers','Gestionar secciones'],
'pt-BR':['Início','Denúncias','Discussões','Minhas publicações','Guia de segurança','Painel de moderação','Superadministração','Entrar','Sair','Publicar','Emojis','Meus adesivos','Enviar adesivo','Imagens públicas','Provas privadas','Enviar comentário','Enviar publicação','Criar conta','Idioma','Desativar','Restaurar','Excluir','Moderar adesivos','Gerenciar seções'],
'it':['Home','Segnalazioni','Discussioni','I miei post','Guida alla sicurezza','Moderazione','Super amministrazione','Accedi','Esci','Pubblica','Emoji','I miei sticker','Carica sticker','Immagini pubbliche','Prove private','Invia commento','Invia post','Registrati','Lingua','Disattiva','Ripristina','Elimina','Moderazione sticker','Gestisci sezioni'],
'ru':['Главная','Жалобы','Обсуждение','Мои записи','Безопасность','Панель модератора','Суперадминистратор','Войти','Выйти','Создать запись','Эмодзи','Мои стикеры','Загрузить стикер','Открытые фото','Частные доказательства','Отправить комментарий','Опубликовать','Регистрация','Язык','Отключить','Восстановить','Удалить','Модерация стикеров','Разделы'],
'ar':['الرئيسية','بلاغات','نقاشات','منشوراتي','دليل الأمان','لوحة المشرف','لوحة المشرف الأعلى','دخول','خروج','إنشاء منشور','رموز تعبيرية','ملصقاتي','رفع ملصق','صور عامة','أدلة خاصة','إرسال تعليق','نشر','إنشاء حساب','اللغة','تعطيل','استعادة','حذف','إدارة الملصقات','إدارة الأقسام'],
'hi':['समुदाय होम','रिपोर्ट','चर्चा','मेरी पोस्ट','सुरक्षा गाइड','मॉडरेटर पैनल','सुपर एडमिन','लॉग इन','लॉग आउट','पोस्ट लिखें','इमोजी','मेरे स्टिकर','स्टिकर अपलोड','सार्वजनिक चित्र','निजी प्रमाण','टिप्पणी भेजें','पोस्ट भेजें','खाता बनाएँ','भाषा','अक्षम','बहाल','हटाएँ','स्टिकर प्रबंधन','अनुभाग प्रबंधन'],
 'th':['หน้าแรก','แจ้งปัญหา','สนทนา','โพสต์ของฉัน','คู่มือความปลอดภัย','แผงผู้ดูแล','ผู้ดูแลสูงสุด','เข้าสู่ระบบ','ออกจากระบบ','เขียนโพสต์','อีโมจิ','สติกเกอร์ของฉัน','อัปโหลดสติกเกอร์','รูปสาธารณะ','หลักฐานส่วนตัว','ส่งความเห็น','ส่งโพสต์','สมัครสมาชิก','ภาษา','ปิดใช้งาน','กู้คืน','ลบ','จัดการสติกเกอร์','จัดการหมวดหมู่'],
'vi':['Trang chủ','Báo cáo','Thảo luận','Bài của tôi','Hướng dẫn an toàn','Quản trị viên','Quản trị cấp cao','Đăng nhập','Đăng xuất','Đăng bài','Emoji','Nhãn dán của tôi','Tải nhãn dán','Ảnh công khai','Bằng chứng riêng tư','Gửi bình luận','Gửi bài viết','Đăng ký','Ngôn ngữ','Vô hiệu hóa','Khôi phục','Xóa','Quản lý nhãn dán','Quản lý chuyên mục'],
'ms':['Laman utama','Laporan','Perbincangan','Siaran saya','Panduan keselamatan','Panel moderator','Pentadbir utama','Log masuk','Log keluar','Buat siaran','Emoji','Pelekat saya','Muat naik pelekat','Imej awam','Bukti peribadi','Hantar komen','Hantar siaran','Daftar akaun','Bahasa','Nyahaktif','Pulihkan','Padam','Urus pelekat','Urus kategori'],
'id':['Beranda','Laporan','Diskusi','Postingan saya','Panduan keamanan','Panel moderator','Admin utama','Masuk','Keluar','Buat postingan','Emoji','Stiker saya','Unggah stiker','Gambar publik','Bukti pribadi','Kirim komentar','Kirim postingan','Daftar akun','Bahasa','Nonaktifkan','Pulihkan','Hapus','Moderasi stiker','Kelola kategori'],
'tr':['Ana sayfa','Şikayetler','Tartışmalar','Gönderilerim','Güvenlik rehberi','Moderatör paneli','Süper yönetici','Giriş yap','Çıkış','Gönderi oluştur','Emoji','Çıkartmalarım','Çıkartma yükle','Herkese açık görseller','Özel kanıtlar','Yorum gönder','Gönder','Hesap aç','Dil','Devre dışı bırak','Geri yükle','Sil','Çıkartma yönetimi','Bölüm yönetimi'],
'nl':['Startpagina','Meldingen','Discussie','Mijn berichten','Veiligheidsgids','Moderatie','Superbeheer','Inloggen','Uitloggen','Bericht maken','Emoji','Mijn stickers','Sticker uploaden','Openbare afbeeldingen','Privébewijs','Reactie plaatsen','Bericht plaatsen','Account maken','Taal','Uitschakelen','Herstellen','Verwijderen','Stickers modereren','Rubrieken beheren'],
'pl':['Strona główna','Zgłoszenia','Dyskusje','Moje posty','Bezpieczeństwo','Panel moderatora','Superadministrator','Zaloguj się','Wyloguj się','Dodaj post','Emoji','Moje naklejki','Prześlij naklejkę','Zdjęcia publiczne','Dowody prywatne','Dodaj komentarz','Wyślij post','Załóż konto','Język','Wyłącz','Przywróć','Usuń','Moderacja naklejek','Zarządzanie działami'],
'uk':['Головна','Скарги','Обговорення','Мої дописи','Безпека','Панель модератора','Суперадміністратор','Увійти','Вийти','Створити допис','Емодзі','Мої наліпки','Завантажити наліпку','Публічні зображення','Приватні докази','Надіслати коментар','Опублікувати','Реєстрація','Мова','Вимкнути','Відновити','Видалити','Модерація наліпок','Розділи'],
'fa':['خانه','گزارش‌ها','گفتگو','پست‌های من','راهنمای امنیت','پنل ناظر','مدیر ارشد','ورود','خروج','ایجاد پست','ایموجی','استیکرهای من','بارگذاری استیکر','تصاویر عمومی','مدارک خصوصی','ثبت نظر','ارسال پست','ثبت‌نام','زبان','غیرفعال','بازیابی','حذف','مدیریت استیکر','مدیریت بخش‌ها'],
'bn':['হোম','অভিযোগ','আলোচনা','আমার পোস্ট','নিরাপত্তা গাইড','মডারেটর প্যানেল','সুপার অ্যাডমিন','লগইন','লগআউট','পোস্ট লিখুন','ইমোজি','আমার স্টিকার','স্টিকার আপলোড','পাবলিক ছবি','ব্যক্তিগত প্রমাণ','মন্তব্য পাঠান','পোস্ট করুন','নিবন্ধন','ভাষা','নিষ্ক্রিয়','পুনরুদ্ধার','মুছুন','স্টিকার নিয়ন্ত্রণ','বিভাগ ব্যবস্থাপনা'],
'ur':['ہوم','رپورٹس','گفتگو','میری پوسٹس','حفاظتی رہنما','موڈریٹر پینل','سپر ایڈمن','لاگ ان','لاگ آؤٹ','پوسٹ بنائیں','ایموجی','میرے اسٹیکرز','اسٹیکر اپ لوڈ','عوامی تصاویر','نجی ثبوت','تبصرہ بھیجیں','پوسٹ بھیجیں','رجسٹریشن','زبان','غیر فعال','بحال','حذف','اسٹیکر انتظام','سیکشن انتظام']
};
const EN_MORE={
'社区导航':'Community navigation','社区板块':'Community sections','工作人员专属 · 会员不可见':'Staff only · hidden from members',
'最新社区动态':'Latest community activity','风险曝光专区':'Risk reports','社区交流讨论':'Community discussion','我发布的帖子':'My posts',
'全部话题':'All topics','风险线索':'Risk leads','最新':'Latest','欢迎回来':'Welcome back','邮箱地址':'Email address',
'登录密码':'Password','社区昵称':'Display name','创建账号':'Create account','登录社区':'Log in to community',
'免费注册 →':'Register for free →','立即登录':'Log in now','表情包治理':'Sticker moderation','选择表情':'Choose emoji',
'设备原生 Emoji':'Native device emoji','最近':'Recent','笑脸情绪':'Smileys','手势人物':'People','动物自然':'Animals',
'美食饮品':'Food','活动娱乐':'Activities','旅行地点':'Travel','物品科技':'Objects','符号爱心':'Symbols','旗帜':'Flags',
'上传图片':'Upload images','最多 20 张 · 每张不超过 5 MB':'Up to 20 images · Max 5 MB each',
'公开图片 · 最多 20 张':'Public images · Max 20','私密证据 · 最多 20 张':'Private evidence · Max 20',
'＋ 上传自定义表情':'＋ Upload custom sticker','表情包治理':'Sticker moderation','禁言管理':'Mute management',
'后台总览':'Dashboard','待审帖子':'Pending posts','帖子管理 / 下架':'Post takedowns','待审评论':'Pending comments',
'评论管理':'Comment moderation','举报处理':'Reports','申诉复核':'Appeals','会员管理 / 禁言':'Member management',
'会员及管理员禁言':'Mutes: members & moderators','操作日志':'Audit log','操作审计':'Audit trail',
'管理员任免与授权':'Moderator roles & permissions','👑 管理员任免与授权':'👑 Moderator roles & permissions',
'提交风险线索':'Submit risk report','了解防骗指南':'Safety tips','社区安全倡议':'Community safety',
'社区概况':'Community overview','社区规则':'Community rules','交易前先做这 4 件事':'Four checks before trading',
'公开帖子':'Public posts','注册成员':'Members','开放板块':'Open sections','风险提醒':'Risk notices',
'发表社区帖子':'Create community post','发表风险线索':'Submit risk report','发布类型':'Post type',
'所属板块':'Section','帖子标题':'Title','正文内容':'Content','匿名用户':'Anonymous member',
'前台匿名显示（平台仍记录提交者账号）':'Post anonymously (account retained by platform)',
'取消':'Cancel','提交帖子':'Submit post','提交评论':'Submit comment','上传图片':'Upload images',
'交易经验':'Trading experience','灌水闲聊':'General chat','模型账号':'Model accounts','交易防骗':'Fraud prevention',
'没有找到符合的表情，试试其他词':'No matching emoji. Try another search.',
'你的私人表情库还是空的，上传一张图片试试':'Your private sticker library is empty. Upload an image.',
'点击即可插入 · 支持最近使用和肤色手势':'Click to insert · Recent emoji and skin tones',
'待审核':'Pending','已发布':'Published','已驳回':'Rejected','已下架':'Taken down','已隐藏':'Hidden',
'批准发布':'Approve','驳回':'Reject','下架帖子':'Take down post','隐藏评论':'Hide comment',
'普通会员':'Member','普通管理员':'Moderator','超级管理员':'Super admin','管理员':'Moderator','会员':'Member',
'禁用':'Disable','恢复':'Restore','删除':'Delete','保存栏目配置':'Save section',
'未授予管理权限':'No moderator permissions','＋ 任命管理员':'＋ Appoint moderator',
'设置权限 / 撤销管理员':'Change permissions / remove moderator',
'搜索交易经验、风险提醒、帖子关键词':'Search the community',
'搜索：笑、爱心、点赞、动物…':'Search emoji: smile, heart, thumbs-up…',
'说说你的看法… 可以加入表情或上传图片；请勿公开私密信息':'Share your thoughts; add emoji or images. Avoid sensitive data.',
'我的表情':'My stickers','最多200张':'Up to 200','每张 ≤1 MB · 私人表情库仅自己可见 · 最多200张 · 禁止视频/GIF':'≤1 MB each · Private library · Max 200 · No video/GIF',
'日间':'Light','夜间':'Dark','这里还没有内容':'No posts yet','提交举报线索':'Submit report',
'查看详情 ↗':'View details ↗','加载更多':'Load more','返回列表':'Back to list',
'请先登录':'Please log in','当前没有待处理事项 ✓':'Nothing needs attention ✓'
};
const zhMore={
'社区导航':'社區導覽','社区板块':'社區板塊','最新社区动态':'最新社區動態','全部话题':'所有話題',
'选择表情':'選擇表情','设备原生 Emoji':'裝置原生 Emoji','最近':'最近','上传图片':'上傳圖片',
'最多 20 张 · 每张不超过 5 MB':'最多20張 · 每張不超過5MB',
'公开图片 · 最多 20 张':'公開圖片 · 最多20張','私密证据 · 最多 20 张':'私人證據 · 最多20張',
'＋ 上传自定义表情':'＋ 上傳自訂表情','欢迎回来':'歡迎回來','邮箱地址':'電子郵件',
'登录密码':'登入密碼','社区昵称':'社區暱稱','登录社区':'登入社區','注册新账号':'註冊新帳號',
'提交风险线索':'提交風險線索','社区安全倡议':'社區安全倡議','社区规则':'社區規則',
'后台总览':'後台總覽','待审帖子':'待審貼文','帖子管理 / 下架':'貼文管理／下架',
'待审评论':'待審留言','评论管理':'留言管理','举报处理':'檢舉處理','申诉复核':'申訴複核',
'会员管理 / 禁言':'會員管理／禁言','管理员任免与授权':'管理員任免與授權',
'操作日志':'操作紀錄','普通会员':'一般會員','普通管理员':'一般管理員',
'帖子标题':'貼文標題','正文内容':'內文','保存栏目配置':'儲存欄目設定',
'你的私人表情库还是空的，上传一张图片试试':'私人表情庫是空的，快上傳一張圖片',
'每张 ≤1 MB · 私人表情库仅自己可见 · 最多200张 · 禁止视频/GIF':'每張 ≤1 MB · 私人表情庫僅自己可見 · 最多200張 · 禁止影片/GIF',
'日间':'日間','夜间':'夜間','最多200张':'最多200張'
};
const lookup={};for(const locale of LANGUAGES.map(x=>x[0])){
 if(locale==='zh-CN')continue;
 const v={};const base=CORE_TEXT[locale]||CORE_TEXT.en;
 CORE.forEach((key,i)=>{v[key]=base[i]});if(locale==='zh-TW')Object.assign(v,zhMore);if(locale==='en')Object.assign(v,EN_MORE);Object.assign(v,window.TRUST_MAIN_LOCALE_PACKS?.[locale]||{},window.TRUST_ADMIN_LOCALE_PACKS?.[locale]||{},window.TRUST_FORMS_LOCALE_PACKS?.[locale]||{},window.TRUST_EMOJI_LOCALE_PACKS?.[locale]||{},window.TRUST_GUIDE_LOCALE_PACKS?.[locale]||{},window.TRUST_IDENTITY_LOCALE_PACKS?.[locale]||{},window.TRUST_PERMISSIONS_LOCALE_PACKS?.[locale]||{},window.TRUST_FOOTER_LOCALE_PACKS?.[locale]||{},window.TRUST_V24_LOCALE_PACKS?.[locale]||{},window.TRUST_V25_LOCALE_PACKS?.[locale]||{},window.TRUST_V26_LOCALE_PACKS?.[locale]||{},window.TRUST_V27_LOCALE_PACKS?.[locale]||{},window.TRUST_V31_LOCALE_PACKS?.[locale]||{});
 lookup[locale]=v;
}
let current='zh-CN';try{const v=localStorage.getItem('tf_language');if(LANGUAGES.some(x=>x[0]===v))current=v;}catch{}
const originals=new WeakMap(),attrOriginals=new WeakMap();
function locale(){return current;}
function tr(text){
 if(current==='zh-CN')return text;
 const raw=String(text??'');const trimmed=raw.trim();
 const value=lookup[current]?.[trimmed];if(value)return raw.replace(trimmed,value);
 // Subtle UI decorators: preserve punctuation/icons rather than dropping them.
 const undecorated=trimmed.replace(/^[^\p{L}\p{N}]+/u,'');
 if(undecorated!==trimmed && lookup[current]?.[undecorated])return raw.replace(trimmed,trimmed.slice(0,-undecorated.length)+lookup[current][undecorated]);
 return raw;
}
function apply(root=document){document.documentElement.lang=current;document.documentElement.dir='ltr';document.documentElement.dataset.localeDirection=['ar','fa','ur'].includes(current)?'rtl':'ltr';
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 for(const node of nodes){const parent=node.parentElement;if(!parent||parent.closest('script,style,textarea,code,pre,.post-title,.excerpt,.detail-body,.comment-box p,.section-article,.sticker-tile,[data-no-translate]'))continue;
 let orig=originals.get(node);if(orig===undefined){orig=node.nodeValue;originals.set(node,orig);}
 const clean=orig.trim();if(!clean)continue;
 const translated=tr(clean);const next=orig.replace(clean,translated);if(node.nodeValue!==next)node.nodeValue=next;
 }
 for(const el of root.querySelectorAll?.('[placeholder],[aria-label],[title]')||[]){
  let vals=attrOriginals.get(el);if(!vals){vals={};attrOriginals.set(el,vals);}for(const attr of ['placeholder','aria-label','title']){if(!el.hasAttribute(attr))continue;if(!(attr in vals))vals[attr]=el.getAttribute(attr);const next=tr(vals[attr]);if(el.getAttribute(attr)!==next)el.setAttribute(attr,next);}
 }
}
function set(v){if(!LANGUAGES.some(x=>x[0]===v))return;current=v;try{localStorage.setItem('tf_language',v);}catch{}apply();}
window.TrustI18n={languages:LANGUAGES,locale,tr,apply,set,translations:lookup};
new MutationObserver(items=>{if(items.some(x=>x.addedNodes.length))queueMicrotask(()=>apply());}).observe(document.documentElement,{childList:true,subtree:true});
})();
