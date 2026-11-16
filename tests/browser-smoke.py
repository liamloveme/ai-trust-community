"""离线交互 E2E；利用 set_content 避免运行环境 Chromium URLBlocklist；无需后端。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from io import BytesIO
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
PAGE=(ROOT/'AI交易守望站-独立HTML预览.html').read_text(encoding='utf-8')
PNG=BytesIO();Image.new('RGB',(24,24),(120,187,171)).save(PNG,format='PNG')

def assert_has(page,selector):
    assert page.locator(selector).count(),f'Missing {selector}'

def login(page,email):
    page.locator('#accountButton').click()
    page.locator('#authForm input[name=email]').fill(email)
    page.locator('#authForm input[name=password]').fill('Demo123456!')
    page.locator('#authForm button[type=submit]').click()
    page.wait_for_timeout(80)
    assert page.locator('#modalRoot').inner_text()==''

def logout(page):
    page.locator('#accountButton').click();page.wait_for_timeout(80)

def main():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
  page.set_default_timeout(4000)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(PAGE)
  page.wait_for_timeout(80)
  assert page.locator('#adminNavSlot').inner_text()==''
  assert page.locator('#registerButton').count()==0
  print('PASS guest: no staff-only nav or role switcher')
  login(page,'member@demo.test')
  assert page.locator('#adminNavSlot').inner_text()==''
  assert '会员' in page.locator('#identityContainer').inner_text()
  assert '管理员后台' not in page.locator('body').inner_text()
  page.locator('[data-action=detail][data-id="102"]').first.click()
  page.locator('[data-action=emoji-toggle]').click()
  assert page.locator('#emoji-commentBody').is_visible()
  assert page.locator('.emoji-category').count() >= 9
  page.locator('#emoji-commentBody [data-action=emoji-category][data-category=animals]').click()
  assert page.locator('#emoji-grid-commentBody [data-emoji="🐼"]').count() == 1
  page.locator('#emoji-commentBody .emoji-search').fill('点赞')
  assert page.locator('#emoji-grid-commentBody [data-emoji="👍"]').count()==1
  page.locator('#emoji-commentBody .emoji-search').fill('')
  page.locator('[data-action=emoji-insert]').first.click()
  assert page.locator('#commentBody').input_value()
  page.locator('#emoji-commentBody [data-action=emoji-category][data-category=recent]').click()
  assert page.locator('#emoji-grid-commentBody [data-action=emoji-insert]').count() >= 1
  page.set_viewport_size({'width':320,'height':740});page.wait_for_timeout(80)
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 2'), '320px width with expanded Emoji picker overflows'
  page.set_viewport_size({'width':1440,'height':900})
  page.locator('#commentBody').fill('感谢分享，证据核查很重要 😀')
  page.locator('#commentFiles').set_input_files({'name':'evidence.png','mimeType':'image/png','buffer':PNG.getvalue()})
  page.wait_for_timeout(120)
  assert 'evidence.png' in page.locator('#commentUploaded').inner_text()
  page.locator('#commentForm button[type=submit]').click();page.wait_for_timeout(120)
  assert '评论已提交，等待审核' in page.locator('#toastArea').inner_text()
  print('PASS member: comment emoji + PNG attachment, pending moderation')
  logout(page)
  login(page,'mod@demo.test')
  assert '管理员后台' in page.locator('#adminNavSlot').inner_text()
  assert '超级管理员后台' not in page.locator('#adminNavSlot').inner_text()
  page.locator('#adminNavSlot [data-view=admin]').click();page.wait_for_timeout(80)
  assert page.locator('.admin-tabs [data-tab=sections]').count()==1
  assert '管理员已登录' in page.locator('#adminPanel').inner_text()
  assert page.locator('.admin-tabs [data-tab=users]').count()==1
  page.locator('.admin-tabs [data-tab=users]').click();page.wait_for_timeout(80)
  assert page.locator('[data-action=manage-user]').count()==0
  page.locator('.admin-tabs [data-tab=published]').click();page.wait_for_timeout(75)
  assert page.locator('[data-action=review-post][data-id="109"]').count()==0, '普通管理员不得处理管理员帖子'
  assert page.locator('[data-action=review-post][data-id="103"]').count()==1, '普通管理员必须可下架会员帖子'
  page.locator('.admin-tabs [data-tab=users]').click();page.wait_for_timeout(75)
  page.locator('[data-action=mute-user][data-id="3"]').click()
  page.locator('#muteForm select[name=duration]').select_option('1h')
  page.locator('#muteForm textarea[name=reason]').fill('多次发送违规内容')
  page.locator('#muteForm [type=submit]').click();page.wait_for_timeout(100)
  assert '禁言中' in page.locator('#adminPanel').inner_text()
  print('PASS moderator: member mute; cannot remove staff post or grant roles')
  logout(page)
  login(page,'member@demo.test')
  page.locator('[data-action=compose]').first.click();page.wait_for_timeout(30)
  assert '发表' in page.locator('.modal-head').inner_text()
  page.locator('#composeForm input[name=title]').fill('关于接口稳定性的对比交流')
  page.locator('#composeForm textarea[name=body]').fill('我想讨论如何客观测试 API 延迟和各模型稳定性。')
  page.locator('#composeForm [type=submit]').click();page.wait_for_timeout(90)
  assert '禁言' in page.locator('#toastArea').inner_text()
  print('PASS muted member: cannot publish post')
  page.locator('[data-action=close-modal]').first.click()
  logout(page)
  login(page,'root@demo.test')
  assert '超级管理员后台' in page.locator('#adminNavSlot').inner_text()
  page.locator('#adminNavSlot [data-view=super]').click();page.wait_for_timeout(80)
  assert '管理员任免与权限管理' in page.locator('#adminPanel').inner_text()
  page.locator('.admin-tabs [data-tab=users]').click();page.wait_for_timeout(80)
  assert page.locator('[data-action=manage-user][data-id="2"]').count()==1
  page.locator('[data-action=manage-user][data-id="3"]').click()
  page.locator('#permissionForm select[name=role]').select_option('moderator')
  page.locator('#permissionForm input[name=permission][value="posts.review"]').check()
  page.locator('#permissionForm [type=submit]').click();page.wait_for_timeout(100)
  assert page.locator('.modal').count()==0
  print('PASS super admin: grant role and limited permission')
  page.locator('#adminNavSlot [data-view=admin]').click();page.wait_for_timeout(80)
  page.locator('.admin-tabs [data-tab=published]').click();page.wait_for_timeout(70)
  assert page.locator('[data-action=review-post][data-id="109"]').count()==1, '超级管理员应能下架管理员帖子'
  print('PASS super admin: moderation of administrator-authored posts available')
  page.locator('.admin-tabs [data-tab=sections]').click();page.wait_for_timeout(70)
  page.locator('[data-action=create-section]').click()
  page.locator('#sectionForm input[name=title]').fill('公告与规则')
  page.locator('#sectionForm input[name=slug]').fill('announcements')
  page.locator('#sectionForm select[name=kind]').select_option('page')
  page.locator('#sectionForm textarea[name=page_content]').fill('欢迎来到公告页\n谨慎发布个人资料和密钥。')
  page.locator('#sectionForm [type=submit]').click();page.wait_for_timeout(120)
  assert_has(page,'#sideNav [data-slug="announcements"]')
  page.locator('#sideNav [data-slug="announcements"]').click();page.wait_for_timeout(40)
  assert '谨慎发布个人资料和密钥' in page.locator('#mainContent').inner_text()
  print('PASS super admin: create standalone page and navigate')
  page.locator('#themeButton').click()
  assert page.locator('html').get_attribute('data-theme')=='dark'
  page.screenshot(path=str(ROOT/'tests/v2-desktop-night.png'),full_page=True)
  print('PASS theme: switches to night')
  # independently render at mobile/tablet widths; check horizontal overflow and admin access
  for width,height,name in [(320,760,'small-mobile'),(390,844,'phone'),(768,1024,'tablet'),(1024,768,'ipad-landscape'),(1440,900,'desktop')]:
    page.set_viewport_size({'width':width,'height':height})
    page.wait_for_timeout(60)
    actual=page.evaluate('({vw:innerWidth,doc:document.documentElement.scrollWidth,body:document.body.scrollWidth})')
    assert actual['doc']<=actual['vw']+2, f'horizontal overflow on {name}: {actual}'
    if name in ('phone','tablet'):
      page.screenshot(path=str(ROOT/f'tests/v2-{name}-night.png'),full_page=True)
    print('PASS responsive',name,width,actual['doc'])
  assert not errors,errors
  print('PASS browser pageerror: 0')
  page.set_viewport_size({'width':1440,'height':900})
  page.locator('#adminNavSlot [data-view=super]').click();page.wait_for_timeout(60)
  page.locator('[data-action=manage-user][data-id="2"]').click()
  page.locator('#permissionForm select[name=role]').select_option('member')
  page.locator('#permissionForm button[type=submit]').click();page.wait_for_timeout(100)
  assert '会员' in page.locator('.staff-user-card').filter(has_text='值班版主').inner_text()
  logout(page);login(page,'mod@demo.test')
  assert page.locator('#adminNavSlot').inner_text()==''
  print('PASS role revocation: former moderator loses admin sidebar')
  browser.close()

if __name__=='__main__':main()
