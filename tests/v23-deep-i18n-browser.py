"""V2.3 integration smoke on standalone demo: localizations + admin + UGC + author.
Not a replacement for Docker/MySQL/Redis end-to-end tests.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
r=Path(__file__).resolve().parents[1]
langs=['en','fr','ja','ar','fa','ms','zh-TW','zh-CN']
issues=[];checks=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],headless=True)
 page=b.new_page(viewport={'width':1440,'height':900})
 page.on('pageerror',lambda e:issues.append({'type':'browser','error':str(e)}))
 page.set_content((r/'AI交易守望站-独立HTML预览.html').read_text(encoding='utf8'),wait_until='load')
 for language in langs:
  page.select_option('#languageSelect',language)
  page.locator('[data-action=nav][data-view=guide]').first.click();page.wait_for_timeout(80)
  head=page.locator('.guide-page h1').inner_text()
  if language!='zh-CN' and '交易安全与社区公约' in head:issues.append({'language':language,'type':'guide untranslated'})
  page.locator('[data-action=nav][data-view=home]').first.click();page.wait_for_timeout(80)
  author=page.locator('.post-meta').first.inner_text()
  if language!='zh-CN' and ('普通会员' in author or '匿名用户' in author):issues.append({'language':language,'type':'author role untranslated','author':author})
  checks.append({'language':language,'guide':head,'author':author[:55]})
 # Login English -> super-admin member/permission list -> open post composer -> form translations
 page.select_option('#languageSelect','en')
 page.locator('#accountButton').click()
 page.locator('#authForm [name=email]').fill('root@demo.test')
 page.locator('#authForm [name=password]').fill('Demo123456!')
 page.locator('#authForm button[type=submit]').click();page.wait_for_timeout(250)
 page.locator('[data-view=super]').first.click();page.wait_for_timeout(250)
 text=page.locator('#adminPanel').inner_text()
 for bad in ['处理内容举报','处理申诉','会员禁言','查看自定义表情','禁用/删除表情','查看审计日志']:
  if bad in text: issues.append({'type':'permission untranslated','term':bad})
 page.locator('[data-action=nav][data-view=home]').first.click();page.wait_for_timeout(120)
 page.locator('[data-action=compose]').first.click();page.wait_for_timeout(90)
 body=page.locator('.modal').inner_text()
 for bad in ['发布类型','所属板块','帖子标题','正文内容','公开图片','私密证据']:
  if bad in body:issues.append({'type':'compose untranslated','term':bad})
 if '20' not in body:issues.append({'type':'upload limits missing'})
 page.screenshot(path=str(r/'tests/v23-compose-en.png'))
 page.locator('[data-action=close-modal]').first.click() if page.locator('[data-action=close-modal]').count() else None
 b.close()
result={'checks':checks,'issues':issues}
(r/'tests/v23-deep-report.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(result,ensure_ascii=False))
assert not issues,issues
