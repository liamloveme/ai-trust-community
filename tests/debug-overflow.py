from playwright.sync_api import sync_playwright
from pathlib import Path
h=(Path(__file__).parents[1]/'AI交易守望站-独立HTML预览.html').read_text()
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 a=b.new_page(viewport={'width':1024,'height':780});a.set_content(h)
 a.locator('#accountButton').click();a.locator('[name=email]').fill('root@demo.test');a.locator('[name=password]').fill('Demo123456!');a.locator('#authForm [type=submit]').click();a.wait_for_timeout(120)
 a.locator('#adminNavSlot [data-view=admin]').click();a.wait_for_timeout(180)
 a.locator('[data-tab=stickers]').first.click();a.wait_for_timeout(200)
 print(a.evaluate('''() => [...document.querySelectorAll('body *')].map(el=>{const r=el.getBoundingClientRect();return {tag:el.tagName,cl:el.className,x:r.x,width:r.width,right:r.right};}).filter(x=>x.right>innerWidth+1).sort((a,b)=>b.right-a.right).slice(0,30)'''))
 b.close()
