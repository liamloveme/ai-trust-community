from pathlib import Path
from playwright.sync_api import sync_playwright
import json
root=Path(__file__).resolve().parents[1]
html=(root/'AI交易守望站-独立HTML预览.html').read_text(encoding='utf-8')
errors=[];checks=0
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],headless=True)
 for width in (320,390,768,1024,1440):
  page=browser.new_page(viewport={'width':width,'height':860});page.set_default_timeout(3500)
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='load')
  page.locator('#searchInput').fill('交易')
  page.locator('#searchSubmit').click()
  page.wait_for_timeout(120)
  assert page.locator('.search-result-summary').count()==1,(width,'search')
  checks+=1
  assert page.evaluate('document.documentElement.scrollWidth')<=width+2,(width,'overflow search')
  checks+=1
  page.locator('#searchInput').fill('')
  page.locator('#searchSubmit').click()
  page.wait_for_timeout(100)
  # empty keyword is ignored safely; public feed remains functional
  assert page.locator('#postList').count()==1,(width,'blank search')
  checks+=1
  page.locator('#accountButton').click()
  page.locator('#authForm [name=email]').fill('root@demo.test');page.locator('#authForm [name=password]').fill('Demo123456!')
  page.locator('#authForm button[type=submit]').click()
  page.wait_for_timeout(130)
  page.locator('.post-title').first.click();page.wait_for_timeout(130)
  assert page.locator('.detail-page').count()==1 and page.locator('.detail-toolbar').count()==1,(width,'post detail')
  checks+=1
  assert page.locator('.post-translate-button').count()==1,(width,'translate preserved')
  checks+=1
  assert page.evaluate('document.documentElement.scrollWidth')<=width+2,(width,'overflow detail')
  checks+=1
  page.close()
 browser.close()
assert not errors,errors
report={'version':'V2.6','viewport_widths':[320,390,768,1024,1440],'checks_passed':checks,'page_errors':errors,'scope':'Standalone preview responsive and post detail smoke, not MySQL API integration'}
(root/'tests/v26-responsive-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2))
