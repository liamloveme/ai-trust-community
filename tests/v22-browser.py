from playwright.sync_api import sync_playwright
from pathlib import Path
from PIL import Image
import tempfile
ROOT=Path(__file__).resolve().parents[1]
URL='http://127.0.0.1:8765/AI交易守望站-独立HTML预览.html'
PNG=Path(tempfile.gettempdir())/'forum-v22-test.png'
Image.new('RGB',(80,80),'teal').save(PNG)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--allow-file-access-from-files'])
 page=browser.new_page(viewport={'width':1280,'height':950},device_scale_factor=1)
 errors=[]
 page.on('pageerror',lambda e: errors.append(str(e)))
 page.set_content((ROOT/'AI交易守望站-独立HTML预览.html').read_text(encoding='utf-8'))
 page.wait_for_timeout(350)
 print('page loaded',page.title(), 'errors:',errors)
 print('language:',page.locator('#languageSelect').count(),page.locator('#languageSelect option').count())
 page.locator('#languageSelect').select_option('en');page.wait_for_timeout(200)
 print('en nav text:',page.locator('#sideNav').inner_text()[:130]);print('eng buttons',page.locator('#accountButton').inner_text())
 page.locator('#languageSelect').select_option('zh-CN');page.wait_for_timeout(100)
 page.locator('#accountButton').click()
 page.locator('input[name=email]').fill('member@demo.test');page.locator('input[name=password]').fill('Demo123456!');page.locator('#authForm button[type=submit]').click()
 page.wait_for_timeout(250)
 print('member nav:',page.locator('#adminNavSlot').inner_text())
 page.locator('[data-action=compose]').first.click();page.wait_for_timeout(120)
 print('labels:',page.locator('.upload-zone').all_inner_texts())
 page.locator('[data-action=emoji-toggle][data-target=composeBody]').click()
 page.locator('[data-action=emoji-category][data-category=my]').first.click()
 page.wait_for_timeout(180)
 print('my picker:',page.locator('#my-sticker-toolbar-composeBody').is_visible())
 page.locator('input[data-sticker-upload=composeBody]').set_input_files(str(PNG))
 page.wait_for_timeout(300)
 print('stickers after upload:',page.locator('.sticker-tile').count(),page.locator('#emoji-grid-composeBody').inner_text()[:150])
 page.locator('.sticker-tile [data-action=sticker-insert]').first.click();page.wait_for_timeout(120)
 print('input after inserting:',page.locator('#composeBody').input_value())
 # photo 20 each, fixture generated new paths distinct but duplicate files permitted
 page.locator('#publicFiles').set_input_files([str(PNG)]*20)
 page.wait_for_timeout(2500)
 print('public uploaded:',page.locator('#publicUploaded').inner_text()[-80:])
 page.locator('#privateFiles').set_input_files([str(PNG)]*20)
 page.wait_for_timeout(2500)
 print('private uploaded:',page.locator('#privateUploaded').inner_text()[-80:])
 page.locator('#composeBody').fill('我是社区新会员，这是带图与自定义表情的测试帖子，包含一些示例图片记录。[sticker:110]')
 page.locator('input[name=title]').fill('交易纠纷资料上传验证 20 + 20 张照片')
 page.locator('#composeForm button[type=submit]').click();page.wait_for_timeout(400)
 print('post submit feedback:',page.locator('#toastArea').inner_text())
 # user-owned photo comments needs published post
 page.locator('[data-action=close-modal]').all()
 # logout/login as super
 page.locator('#accountButton').click();page.wait_for_timeout(150)
 page.locator('#accountButton').click();page.locator('input[name=email]').fill('root@demo.test');page.locator('input[name=password]').fill('Demo123456!');page.locator('#authForm button[type=submit]').click();page.wait_for_timeout(180)
 print('super nav',page.locator('#adminNavSlot').inner_text())
 page.locator('[data-action=nav][data-view=admin]').click();page.wait_for_timeout(220)
 page.locator('[data-action=admin-tab][data-tab=stickers]').first.click();page.wait_for_timeout(250)
 print('admin stickers panel',page.locator('.sticker-mod-card').count(),page.locator('#adminPanel').inner_text()[:300])
 page.screenshot(path=str(ROOT/'tests/v22-desktop-preview.png'),full_page=True)
 for w in (320,390,768,1024,1440):
  page.set_viewport_size({'width':w,'height':780});page.wait_for_timeout(160)
  box=page.evaluate('({scroll:document.documentElement.scrollWidth,view:innerWidth})');print('width',w,box)
 print('JS ERRORS',errors)
 browser.close()
