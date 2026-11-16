"""V2.3 i18n smoke test with offline preview (no external network or database)."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
ROOT=Path(__file__).resolve().parents[1]
LANGUAGES=['zh-CN','zh-TW','en','ja','ko','fr','de','es','pt-BR','it','ru','ar','hi','th','vi','ms','id','tr','nl','pl','uk','fa','bn','ur']
ISSUES=[]; runs=0
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for width in [320,390,768,1024,1440]:
  page=browser.new_page(viewport={'width':width,'height':900})
  page.on('pageerror',lambda e:ISSUES.append({'width':width,'error':str(e)}))
  page.set_content((ROOT/'AI交易守望站-独立HTML预览.html').read_text(encoding='utf-8'),wait_until='load')
  page.wait_for_selector('#languageSelect')
  for lang in LANGUAGES:
   page.select_option('#languageSelect',lang)
   runs+=1
   data=page.evaluate('''()=>({nav:document.querySelector('.sidebar-title')?.innerText,rail:document.querySelector('.right-head')?.innerText,feed:document.querySelector('.feed-heading h2')?.innerText,dir:document.documentElement.dir,sw:document.documentElement.scrollWidth,width:innerWidth,lang:document.documentElement.lang})''')
   if data['sw']>width: ISSUES.append({'width':width,'lang':lang,'issue':'page overflows','delta':data['sw']-width})
   if lang in ['ar','fa','ur'] and data['dir']!='ltr':ISSUES.append({'width':width,'lang':lang,'issue':'columns reversed'})
   if lang!='zh-CN' and any(x in data['feed'] for x in ['最新社区动态','Latest community activity'] if lang!='en' or x!='Latest community activity'):ISSUES.append({'width':width,'lang':lang,'issue':'feed untranslated'})
  if width==1440:
   page.select_option('#languageSelect','en')
   page.locator('#accountButton').click()
   assert 'Offline preview' in page.locator('.demo-login').inner_text()
   page.locator('#authForm [name=email]').fill('root@demo.test')
   page.locator('#authForm [name=password]').fill('Demo123456!')
   page.locator('#authForm button[type=submit]').click()
   page.wait_for_timeout(200)
   assert 'Staff only' in page.locator('#adminNavSlot').inner_text()
   page.locator('[data-view=super]').first.click()
   page.wait_for_timeout(450)
   assert 'Only super admins' in page.locator('#mainContent').inner_text()
   page.select_option('#languageSelect','ar')
   assert 'المدير الأعلى' in page.locator('#mainContent').inner_text()
   page.screenshot(path=str(ROOT/'tests/v23-ar-super.png'))
  page.close()
 browser.close()
report={'language_options':len(LANGUAGES),'responsive_sizes':[320,390,768,1024,1440],'checks':runs,'issues':ISSUES}
(ROOT/'tests/v23-i18n-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
if ISSUES:raise SystemExit(1)
