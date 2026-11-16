"""V2.4 standalone HTML Chromium checks, not production MySQL/Redis/Docker verification."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1];url=(ROOT/'AI交易守望站-独立HTML预览.html').read_text(encoding='utf-8')
langs=['zh-CN','zh-TW','en','ja','ko','fr','de','es','pt-BR','it','ru','ar','hi','th','vi','ms','id','tr','nl','pl','uk','fa','bn','ur']
widths=[320,390,768,1024,1440];problems=[];checks=0
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width in widths:
  page=browser.new_page(viewport={'width':width,'height':900})
  page.on('pageerror',lambda e:problems.append({'width':width,'error':str(e)}))
  page.set_content(url,wait_until='load')
  page.wait_for_selector('#languageSelect');page.wait_for_timeout(120)
  for lang in langs:
   page.select_option('#languageSelect',lang);page.wait_for_timeout(25)
   data=page.evaluate('''()=>({w:document.documentElement.scrollWidth,dir:document.documentElement.dir,right:document.querySelector('.footer-right').innerText,
left:document.querySelector('.donation-prompt').innerText,lang:document.documentElement.lang})''')
   if data['w']>width+1:problems.append({'width':width,'lang':lang,'overflow':data['w']-width})
   if data['dir']!='ltr':problems.append({'width':width,'lang':lang,'unexpected-columns-reversal':data['dir']})
   if lang!='zh-CN' and data['left']=='为维持网站正常运营，希望大家积极捐赠加密货币维持运营':problems.append({'width':width,'lang':lang,'footer-prompt-untranslated':True})
   if lang=='zh-CN' and '公益信息交流，不提供交易担保' not in data['right']:problems.append({'width':width,'lang':lang,'footer-failed-to-restore':data['right'][:100]})
   checks+=1
  if width==1440:
   page.select_option('#languageSelect','es');page.select_option('#languageSelect','ja');page.select_option('#languageSelect','zh-CN')
   assert '公益信息交流，不提供交易担保' in page.locator('.footer-right').inner_text(), 'footer did not restore'
   assert '为维持网站正常运营' in page.locator('.donation-prompt').inner_text()
   page.locator('[data-action=detail][data-id="105"]').first.click();page.wait_for_timeout(70)
   page.select_option('#languageSelect','es')
   assert 'Denunciar' in page.locator('.detail-toolbar').inner_text()
   assert 'Apelar' in page.locator('.detail-toolbar').inner_text()
   assert 'Comentarios' in page.locator('.comment-title').inner_text()
   page.locator('[data-action=translate-post]').click();page.wait_for_timeout(100)
   assert '¡Hola a todos!' in page.locator('.detail-title').inner_text()
   page.locator('[data-action=translate-post]').click();page.wait_for_timeout(30)
   assert '新人报到' in page.locator('.detail-title').inner_text()
   page.screenshot(path=str(ROOT/'tests/v24-post-translation.png'))
   # member cannot view/write donation settings, moderator also cannot.
   page.locator('#accountButton').click();page.locator('#authForm [name=email]').fill('member@demo.test');page.locator('#authForm [name=password]').fill('Demo123456!');page.locator('#authForm button[type=submit]').click();page.wait_for_timeout(80)
   assert page.locator('.super-entry').count()==0
   denied=page.evaluate('''async()=>{try{await window.fetch('/api/admin/donations');return null}catch(e){return 'sandbox blocked'}}''') # Standalone preview not fetch-backed; role checks below.
   page.locator('#accountButton').click();page.wait_for_timeout(30)
   page.locator('#accountButton').click();page.locator('#authForm [name=email]').fill('mod@demo.test');page.locator('#authForm [name=password]').fill('Demo123456!');page.locator('#authForm button[type=submit]').click();page.wait_for_timeout(70)
   assert page.locator('.super-entry').count()==0
   page.locator('#accountButton').click();page.wait_for_timeout(30)
   page.locator('#accountButton').click();page.locator('#authForm [name=email]').fill('root@demo.test');page.locator('#authForm [name=password]').fill('Demo123456!');page.locator('#authForm button[type=submit]').click();page.wait_for_timeout(100)
   assert page.locator('.super-entry').count()==1
   page.locator('.super-entry').click();page.wait_for_timeout(120)
   page.locator('[data-tab=donations]').click();page.wait_for_timeout(80)
   page.locator('[data-action=donation-add]').click();page.locator('[data-donate-field=address]').fill('1BoatSLRHtKNngkdXEeobR76b53LETtpyT')
   page.locator('#donationForm [name=password]').fill('WrongPassword!')
   page.locator('#donationForm [type=submit]').click();page.wait_for_timeout(70)
   assert page.locator('.donation-public-address').count()==0
   page.locator('#donationForm [name=password]').fill('Demo123456!')
   page.locator('#donationForm [type=submit]').click();page.wait_for_timeout(130)
   assert page.locator('.donation-public-address').count()==1
   page.select_option('#languageSelect','en')
   assert 'Please help keep this community' in page.locator('.donation-prompt').inner_text()
   assert 'Copy address' in page.locator('.donation-public-address').inner_text()
   page.screenshot(path=str(ROOT/'tests/v24-donations-super.png'),full_page=True)
  page.close()
 browser.close()
report={'checks':checks,'languages':len(langs),'widths':widths,'js_errors_or_issues':problems}
(ROOT/'tests/v24-browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
assert not problems,problems
