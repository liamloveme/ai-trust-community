"""Screenshots from the standalone source. Does not require DB, deliberately offline."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'AI交易守望站-独立HTML预览.html').read_text(encoding='utf-8')
OUT=ROOT/'tests'/'v21'
OUT.mkdir(exist_ok=True)

def login(page,email):
    page.locator('#accountButton').click()
    page.locator('#authForm input[name=email]').fill(email)
    page.locator('#authForm input[name=password]').fill('Demo123456!')
    page.locator('#authForm button[type=submit]').click()
    page.wait_for_timeout(100)

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
    page.set_content(HTML)
    page.wait_for_timeout(100)
    page.screenshot(path=str(OUT/'01-home.png'),full_page=True)
    login(page,'member@demo.test')
    page.locator('[data-action=detail][data-id="102"]').first.click()
    page.locator('[data-action=emoji-toggle]').click()
    page.locator('#emoji-commentBody [data-action=emoji-category][data-category=faces]').click()
    page.evaluate("document.querySelector('#toastArea').replaceChildren()")
    page.screenshot(path=str(OUT/'02-emoji-picker.png'),full_page=False)
    page.locator('#accountButton').click()
    login(page,'mod@demo.test')
    page.locator('#adminNavSlot [data-view=admin]').click()
    page.wait_for_timeout(100)
    page.evaluate("document.querySelector('#toastArea').replaceChildren()")
    page.screenshot(path=str(OUT/'03-moderator-console.png'),full_page=False)
    page.locator('#accountButton').click()
    login(page,'root@demo.test')
    page.locator('#adminNavSlot [data-view=super]').click()
    page.wait_for_timeout(100)
    page.evaluate("document.querySelector('#toastArea').replaceChildren()")
    page.screenshot(path=str(OUT/'04-super-admin-console.png'),full_page=True)
    page.locator('[data-action=manage-user][data-id="2"]').click()
    page.screenshot(path=str(OUT/'05-role-grants.png'),full_page=False)
    page.locator('[data-action=close-modal]').click()
    page.set_viewport_size({'width':390,'height':844})
    page.locator('#themeButton').click()
    page.screenshot(path=str(OUT/'06-phone-super-dark.png'),full_page=True)
    browser.close()
print('screenshots written to', OUT)
