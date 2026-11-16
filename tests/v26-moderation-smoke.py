from pathlib import Path
from playwright.sync_api import sync_playwright
import json
root=Path(__file__).resolve().parents[1]
html=(root/'AI交易守望站-独立HTML预览.html').read_text(encoding='utf-8')
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],headless=True)
 page=browser.new_page(viewport={'width':1360,'height':850});page.set_default_timeout(4000)
 errors=[];dialogs=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 def handle_dialog(dialog):
  dialogs.append(dialog.type)
  if dialog.type=='prompt':dialog.accept('已复核投稿证据，存在违反社区规范的公开内容')
  else:dialog.accept()
 page.on('dialog',handle_dialog)
 page.set_content(html)
 page.locator('#accountButton').click()
 page.locator('#authForm [name=email]').fill('root@demo.test')
 page.locator('#authForm [name=password]').fill('Demo123456!')
 page.locator('#authForm button[type=submit]').click();page.wait_for_timeout(120)
 page.locator('.super-entry').click();page.wait_for_timeout(70)
 page.locator('.admin-tabs [data-tab=published]').click();page.wait_for_timeout(130)
 assert page.locator('[data-action=review-post][data-decision=removed]').count()>0
 page.locator('[data-action=review-post][data-decision=removed]').first.click();page.wait_for_timeout(140)
 page.locator('.admin-tabs [data-tab=audit]').click();page.wait_for_timeout(140)
 details=page.locator('#adminPanel').inner_text()
 assert '已复核投稿证据' in details and '帖子下架' in details,details[:500]
 assert dialogs==['prompt','confirm'], dialogs
 assert not errors,errors
 browser.close()
 report={'version':'V2.6','moderation_reason_and_audit':'passed','dialogs_handled':dialogs,'page_errors':errors,'scope':'standalone browser preview only'}
 (root/'tests/v26-moderation-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps(report,ensure_ascii=False,indent=2))
