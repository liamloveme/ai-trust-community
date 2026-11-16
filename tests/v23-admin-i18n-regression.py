"""Regression: V2.3 interface admin words do not revert to Chinese for selected locales.
All tests use standalone in-memory mock data, not a real database.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, re
root=Path(__file__).resolve().parents[1]
html=(root/'AI交易守望站-独立HTML预览.html').read_text('utf8')
langs=['en','zh-TW','ja','ko','fr','de','es','pt-BR','it','ru','ar','hi','th','vi','ms','id','tr','nl','pl','uk','fa','bn','ur']
keys=['超级管理员已登录','👑 管理员任免与授权','普通管理员只可禁言或解除普通会员禁言；超级管理员可处理普通会员、管理员并更改管理权限。所有行为会写入审计日志。','可新建讨论板块或独立图文页面。关闭后的栏目不在公开导航显示；已有帖子栏目不允许直接删除。','只有超级管理员能修改。把角色切回普通用户，可立即撤销全部管理权限。','打开权限中心 →','管理权限清单','设置管理员权限','登录成功','不予采纳','驳回举报','已处理','排序']
errors=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':900})
 page.on('pageerror',lambda e: errors.append({'type':'pageerror','error':str(e)}))
 page.set_content(html,wait_until='load')
 for lang in langs:
  page.select_option('#languageSelect',lang)
  values=page.evaluate('keys=>keys.map(k=>window.TrustI18n.tr(k))',keys)
  for key,val in zip(keys,values):
   if (key==val and not (lang=='zh-TW' and key=='排序')) or (lang not in ['ja','zh-TW'] and re.search('[\u3400-\u9fff]',val)):
    errors.append({'type':'untranslated fixed UI','lang':lang,'key':key,'value':val})
 # Test two roles in two locale directions
 for lang in ['en','ar']:
  page.select_option('#languageSelect',lang)
  page.locator('#accountButton').click()
  page.locator('#authForm [name=email]').fill('root@demo.test')
  page.locator('#authForm [name=password]').fill('Demo123456!')
  page.locator('#authForm button[type=submit]').click();page.wait_for_timeout(150)
  page.locator('[data-view=admin]').first.click();page.wait_for_timeout(100)
  page.locator('[data-tab=users]').first.click();page.wait_for_timeout(100)
  e=page.locator('#adminPanel .muted.small').first.inner_text()
  if '普通管理员只可' in e:errors.append({'type':'mixed admin UI','lang':lang,'text':e})
  page.locator('[data-view=super]').first.click();page.wait_for_timeout(100)
  a=page.locator('#mainContent').inner_text()
  if '超级管理员已登录' in a:errors.append({'type':'mixed super UI','lang':lang})
  if lang=='ar':page.screenshot(path=str(root/'tests/v23-ar-super-final.png'))
  page.locator('[data-action=logout]').first.click();page.wait_for_timeout(130)
 browser.close()
report={'languages':len(langs),'fixed_terms':len(keys),'checks':len(langs)*len(keys)+4,'issues':errors}
(root/'tests/v23-admin-locale-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(report,ensure_ascii=False))
if errors:raise SystemExit(1)
