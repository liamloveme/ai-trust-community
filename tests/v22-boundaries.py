"""V2.2 interactive regression tests for upload limits, private stickers and roles.
Chromium file/localhost navigation is blocked in this sandbox, so load exact standalone HTML with set_content().
"""
from playwright.sync_api import sync_playwright
from pathlib import Path
from PIL import Image
import tempfile

ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'AI交易守望站-独立HTML预览.html').read_text(encoding='utf-8')
PNG=Path(tempfile.gettempdir())/'forum-v22-boundaries.png'
Image.new('RGB',(64,64),'#368d93').save(PNG)

def login(page,email):
    page.locator('#accountButton').click()
    page.locator('input[name=email]').fill(email)
    page.locator('input[name=password]').fill('Demo123456!')
    page.locator('#authForm button[type=submit]').click()
    page.wait_for_timeout(160)

def logout(page):
    page.locator('#accountButton').click()
    page.wait_for_timeout(100)

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1280,'height':840})
    errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content(HTML)
    page.set_default_timeout(3500)
    page.wait_for_timeout(300)
    assert page.locator('#languageSelect option').count()==24
    assert page.locator('#languageSelect').input_value()=='zh-CN'
    print('phase-member',flush=True)
    login(page,'member@demo.test')
    assert not page.locator('#adminNavSlot').inner_text().strip()
    # Add one private sticker as an ordinary member.
    page.locator('[data-action=compose]').first.click()
    page.locator('[data-action=emoji-toggle][data-target=composeBody]').click()
    page.locator('[data-action=emoji-category][data-category=my]').first.click()
    page.locator('input[data-sticker-upload=composeBody]').set_input_files(str(PNG))
    page.wait_for_timeout(220)
    assert page.locator('#emoji-grid-composeBody .sticker-tile').count()==1
    # 20 image limit in public slot; on 21st image frontend rejects.
    page.locator('#publicFiles').set_input_files([str(PNG)]*20)
    page.wait_for_timeout(1500)
    assert '20/20' in page.locator('#publicUploaded').inner_text()
    page.locator('#publicFiles').set_input_files([str(PNG)])
    page.wait_for_timeout(200)
    assert '20/20' in page.locator('#publicUploaded').inner_text()
    # 20 image limit in private evidence slot; reject 21st.
    page.locator('#privateFiles').set_input_files([str(PNG)]*20)
    page.wait_for_timeout(1500)
    assert '20/20' in page.locator('#privateUploaded').inner_text()
    page.locator('#privateFiles').set_input_files([str(PNG)])
    page.wait_for_timeout(200)
    assert '20/20' in page.locator('#privateUploaded').inner_text()
    print('phase-comment',flush=True)
    # Close composer, open a published post and upload 20 comment photos.
    page.locator('[data-action=close-modal]').first.click()
    page.locator('[data-action=detail][data-id="102"]').first.click()
    page.wait_for_timeout(180)
    page.locator('#commentFiles').set_input_files([str(PNG)]*20)
    page.wait_for_timeout(1500)
    assert '20/20' in page.locator('#commentUploaded').inner_text(), page.locator('#commentUploaded').inner_text()
    page.locator('#commentFiles').set_input_files([str(PNG)])
    page.wait_for_timeout(220)
    assert '20/20' in page.locator('#commentUploaded').inner_text()
    page.locator('#commentBody').fill('20 张评论图片测试')
    page.locator('#commentForm button[type=submit]').click()
    page.wait_for_timeout(230)
    assert page.locator('#toastArea').inner_text()
    # The member's sticker library should not be visible in another user's personal picker.
    logout(page)
    print('phase-mod',flush=True)
    login(page,'mod@demo.test')
    page.locator('[data-action=compose]').first.click()
    page.locator('[data-action=emoji-toggle][data-target=composeBody]').click()
    page.locator('[data-action=emoji-category][data-category=my]').first.click()
    page.wait_for_timeout(180)
    assert page.locator('#emoji-grid-composeBody .sticker-tile').count()==0
    # A moderator has the management panel but not a super admin-only entry.
    assert '管理员后台' in page.locator('#adminNavSlot').inner_text()
    assert '超级管理员后台' not in page.locator('#adminNavSlot').inner_text()
    # Upload moderator's own private sticker, then assert it is absent from moderator moderation list.
    page.locator('input[data-sticker-upload=composeBody]').set_input_files(str(PNG))
    page.wait_for_timeout(170)
    assert page.locator('#emoji-grid-composeBody .sticker-tile').count()==1
    page.locator('[data-action=close-modal]').first.click()
    # The moderator starts without the newly introduced sticker permission.
    page.locator('[data-action=nav][data-view=admin]').first.click()
    assert page.locator('[data-action=admin-tab][data-tab=stickers]').count()==0
    logout(page)
    print('phase-root-grant',flush=True)
    login(page,'root@demo.test')
    assert '超级管理员后台' in page.locator('#adminNavSlot').inner_text()
    page.locator('[data-action=nav][data-view=super]').first.click()
    page.wait_for_timeout(150)
    page.locator('[data-action=manage-user][data-id="2"]').first.click()
    assert page.locator('#permissionForm').count()==1
    page.locator('#permissionForm input[name=permission][value="stickers.review"]').check()
    page.locator('#permissionForm input[name=permission][value="stickers.remove"]').check()
    page.locator('#permissionForm button[type=submit]').click()
    page.wait_for_timeout(160)
    logout(page)
    print('phase-mod-granted',flush=True)
    login(page,'mod@demo.test')
    page.locator('[data-action=nav][data-view=admin]').first.click()
    page.locator('[data-action=admin-tab][data-tab=stickers]').first.click()
    page.wait_for_timeout(200)
    assert page.locator('.sticker-mod-card').count()==1, 'moderator sees only member sticker, not moderator sticker'
    assert '普通用户' in page.locator('.sticker-mod-card').inner_text()
    assert page.locator('[data-action=sticker-moderate]').count()==2
    logout(page)
    print('phase-root-verify',flush=True)
    login(page,'root@demo.test')
    page.locator('[data-action=nav][data-view=super]').first.click()
    page.locator('[data-action=admin-tab][data-tab=stickers]').first.click()
    page.wait_for_timeout(160)
    assert page.locator('.sticker-mod-card').count()==2
    assert not errors, errors
    print('PASS V2.2: 24 languages, 20+20 post, 20 comment, 21st rejection, private sticker isolation, moderator boundaries, super moderation, zero JS errors')
    browser.close()
