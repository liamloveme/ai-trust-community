from pathlib import Path
from playwright.sync_api import sync_playwright
import json
p=Path(__file__).resolve().parents[1];html=(p/'AI交易守望站-独立HTML预览.html').read_text()
err=[];ok=0
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1280,'height':900})
 page.on('pageerror',lambda e:err.append(str(e)))
 page.set_content(html,wait_until='load');page.wait_for_timeout(160)
 langs=page.locator('#languageSelect option').evaluate_all('(els)=>els.map(x=>x.value)')
 for width in [320,768,1440]:
  page.set_viewport_size({'width':width,'height':900})
  for lang in langs:
   page.locator('#languageSelect').select_option(lang)
   if page.evaluate('document.documentElement.scrollWidth>window.innerWidth+2'):err.append('overflow: '+lang+':'+str(width))
   ok+=1
 b.close()
(p/'tests/v27-locale-report.json').write_text(json.dumps({'checked':ok,'errors':err},ensure_ascii=False,indent=2))
print('checks',ok,'errors',len(err),err[:5]);
if err:raise SystemExit(1)
