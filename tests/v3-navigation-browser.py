#!/usr/bin/env python3
"""Real Chromium integration checks of source-aware list navigation (offline preview)."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json

ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'AI交易守望站-独立HTML预览.html').read_text(encoding='utf-8')
results=[]
errors=[]
def check(ok, label):
    results.append({'case':label,'passed':bool(ok)})
    print(('PASS' if ok else 'FAIL'),label,flush=True)

def login(p,email):
    p.locator('#accountButton').click()
    p.locator('#authForm [name=email]').fill(email)
    p.locator('#authForm [name=password]').fill('Demo123456!')
    p.locator('#authForm button[type=submit]').click()
    p.locator('#authForm').wait_for(state='detached',timeout=5000)

with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    p=browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
    p.set_default_timeout(7000)
    p.on('pageerror',lambda err:errors.append(str(err)))
    p.set_content(HTML,wait_until='load')
    p.locator('.feed-shell .post-card, .feed-shell [data-action="detail"]').first.wait_for(timeout=10000)

    # Anonymous visitor: home to detail to same home, then search result to search list
    p.locator('#postList [data-action="detail"]').first.click()
    check(p.locator('.detail-page').count()==1,'public list opens post detail')
    p.locator('.detail-page [data-action=back]').click()
    check(p.locator('.feed-shell').count()==1,'public back returns to feed')
    p.locator('#searchInput').fill('API Key')
    p.locator('#searchSubmit').click()
    p.locator('.search-result-summary').wait_for()
    results_before=p.locator('.search-result-summary').inner_text()
    p.locator('#postList [data-action="detail"]').first.click()
    p.locator('.detail-page [data-action=back]').click()
    check(p.locator('.search-result-summary').count()==1 and 'API Key' in p.locator('#searchInput').input_value() and p.locator('.search-result-summary').inner_text()==results_before,'search result back preserves original keyword')

    # Dedicated forum navigation should remain on the same list.
    p.locator('[data-action=nav][data-view=exposure]').click()
    p.locator('#postList [data-action="detail"]').first.click()
    p.locator('.detail-page [data-action=back]').click()
    check('风险曝光专区' in p.locator('#mainContent').inner_text(),'exposure detail returns to exposure list')
    p.locator('[data-action=section][data-slug=api]').click()
    p.locator('#postList [data-action="detail"]').first.click()
    p.locator('.detail-page [data-action=back]').click()
    check(p.locator('[data-action=section][data-slug=api].active').count()==1,'custom section detail returns to same section')

    # An independent discussion section must remain selected.
    p.locator('[data-action=nav][data-view=discussion]').click()
    p.locator('#postList [data-action=detail]').first.click()
    p.locator('.detail-page [data-action=back]').click()
    check(p.locator('[data-action=nav][data-view=discussion].active').count()==1,'discussion detail returns to discussion list')

    # Posting a comment in details must not destroy its source context.
    login(p,'member@demo.test')
    p.locator('[data-action=nav][data-view=mine]').click()
    p.locator('#postList [data-action=detail]').first.click()
    p.locator('#commentBody').fill('参与友好讨论并保留审核与返回来源的测试内容。')
    p.locator('#commentForm button[type=submit]').click()
    p.locator('.detail-page [data-action=back]').click()
    check(p.locator('[data-action=nav][data-view=mine].active').count()==1,'comment submission keeps my posts source')
    p.locator('#accountButton').click()

    # Super administrator: published -> detail -> return same tab; queue similarly.
    login(p,'root@demo.test')
    p.locator('.super-entry').click()
    p.locator('.admin-tabs [data-tab=published]').click()
    p.locator('[data-tab=published].active').wait_for()
    p.locator('#adminPanel [data-action=detail]').first.click()
    check(p.locator('.detail-page [data-action=back]').inner_text().find('帖子管理 / 下架')>=0,'back button shows administrative origin')
    p.locator('.detail-page [data-action=back]').click()
    check(p.locator('[data-tab=published].active').count()==1 and p.locator('#adminPanel [data-action=detail]').count()>=1,'super published list restored')
    p.locator('.admin-tabs [data-tab=posts]').click()
    p.locator('#adminPanel [data-action=detail]').first.click()
    p.locator('.detail-page [data-action=back]').click()
    check(p.locator('[data-tab=posts].active').count()==1 and '待审帖子' in p.locator('#adminPanel').inner_text() or p.locator('[data-tab=posts].active').count()==1,'super pending review queue restored')

    # Super administrator can also remove a moderator-authored post.
    p.locator('.admin-tabs [data-tab=published]').click()
    admin_post=p.locator('#adminPanel .admin-item').filter(has_text='管理员公告')
    check(admin_post.count()==1,'super list includes moderator-authored content')
    admin_post.locator('[data-action=detail]').click()
    p.on('dialog',lambda d: d.accept('基于审核记录和站内政策移除此帖') if d.type=='prompt' else d.accept())
    p.locator('.detail-page [data-action=review-post]').click()
    p.locator('.admin-tabs [data-tab=published].active').wait_for(timeout=6000)
    check(p.locator('#adminPanel .admin-item').filter(has_text='管理员公告').count()==0,'super removal returns and refreshes its management list')

    # Moderator administration: must never fall back to public home.
    p.locator('#accountButton').click()
    login(p,'mod@demo.test')
    p.locator('.admin-entry').click()
    p.locator('.admin-tabs [data-tab=published]').click()
    p.locator('#adminPanel [data-action=detail]').first.click()
    p.locator('.detail-page [data-action=back]').click()
    check(p.locator('[data-tab=published].active').count()==1 and p.locator('#adminPanel [data-action=detail]').count()>=1,'moderator published list restored')
    p.locator('.admin-tabs [data-tab=posts]').click()
    p.locator('#adminPanel [data-action=detail]').first.click()
    p.locator('.detail-page [data-action=back]').click()
    check(p.locator('[data-tab=posts].active').count()==1,'moderator pending review queue restored')
    p.locator('.admin-tabs [data-tab=published]').click()
    p.locator('#adminPanel [data-action=detail]').first.click()
    # Admin remove in detail should restore the source management tab and refresh it.
    # two dialogs prompt+confirm - ensure event handler auto-resolves each.
    p.locator('.detail-page [data-action=review-post]').first.click()
    p.locator('[data-tab=published].active').wait_for(timeout=5000)
    check(p.locator('.detail-page').count()==0 and p.locator('#adminPanel').count()==1,'review in detail returns to administrative list')

    # All three major responsive sizes test the return destination / no document overflow.
    for width in (320,390,768,1024,1440):
        p.set_viewport_size({'width':width,'height':900})
        p.wait_for_timeout(80)
        check(p.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 2'),f'no horizontal overflow at {width}px')
    check(not errors,'no uncaught JavaScript browser errors')
    p.set_viewport_size({'width':1440,'height':900})
    p.screenshot(path=str(ROOT/'tests/v3-admin-navigation.png'),full_page=False)
    browser.close()

report={'cases':results,'page_errors':errors,'total':len(results),'passed':sum(x['passed'] for x in results)}
(ROOT/'tests/v3-navigation-report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False),encoding='utf-8')
print('RESULT',report['passed'],'/',report['total'],'ERRORS',errors)
if report['passed']!=report['total'] or errors: raise SystemExit(1)
