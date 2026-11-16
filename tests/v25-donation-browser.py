"""V2.5 Chromium regression against the generated standalone HTML (offline mock only)."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
root=Path(__file__).resolve().parents[1]
html=(root/'AI交易守望站-独立HTML预览.html').read_text(encoding='utf8')
issues=[]
widths=[320,390,768,1024,1440]
langs=['zh-CN','en','ja','es','ar','fa','fr','ms']
expected={'BTC':['Bitcoin'],'USDT':['TRC20','BEP20','ERC20','SOL','Aptos','Plasma'],'USDC':['BEP20','ERC20','SOL','Aptos','Base']}
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width in widths:
  page=browser.new_page(viewport={'width':width,'height':900},device_scale_factor=1)
  page.on('pageerror',lambda e:issues.append('JS error: '+str(e)))
  page.set_content(html,wait_until='load')
  page.wait_for_selector('#accountButton')
  page.locator('#accountButton').click()
  page.locator('#authForm [name=email]').fill('root@demo.test')
  page.locator('#authForm [name=password]').fill('Demo123456!')
  page.locator('#authForm button[type=submit]').click()
  page.wait_for_timeout(80)
  page.locator('.super-entry').click()
  page.wait_for_timeout(65)
  page.locator('[data-tab=donations]').click()
  page.wait_for_timeout(55)
  page.locator('[data-action=donation-add]').click()
  row=page.locator('.donation-row').first
  assert row.locator('select[data-donate-field=network]').count()==0, 'BTC must not show network selector'
  assert row.locator('input[type=hidden][data-donate-field=network]').input_value()=='Bitcoin'
  assert row.locator('input[data-donate-field=address]').count()==1
  # Asset switch rebuilds the row and discards old address so it cannot be reused on the wrong chain.
  row.locator('input[data-donate-field=address]').fill('1BoatSLRHtKNngkdXEeobR76b53LETtpyT')
  row.locator('select[data-donate-field=asset]').select_option('USDT')
  row=page.locator('.donation-row').first
  opts=row.locator('select[data-donate-field=network] option').evaluate_all('(els)=>els.map(el=>el.value)')
  assert opts==expected['USDT'],(width,'USDT',opts)
  assert row.locator('[data-donate-field=address]').input_value()==''
  row.locator('select[data-donate-field=network]').select_option('Plasma')
  row.locator('input[data-donate-field=address]').fill('0x1111111111111111111111111111111111111111')
  row.locator('select[data-donate-field=asset]').select_option('USDC')
  row=page.locator('.donation-row').first
  opts=row.locator('select[data-donate-field=network] option').evaluate_all('(els)=>els.map(el=>el.value)')
  assert opts==expected['USDC'],(width,'USDC',opts)
  assert row.locator('[data-donate-field=address]').input_value()==''
  row.locator('select[data-donate-field=network]').select_option('Base')
  row.locator('input[data-donate-field=address]').fill('0x1111111111111111111111111111111111111111')
  # Change back to BTC hides dropdown again.
  row.locator('select[data-donate-field=asset]').select_option('BTC')
  row=page.locator('.donation-row').first
  assert row.locator('select[data-donate-field=network]').count()==0
  assert row.locator('input[data-donate-field=network]').input_value()=='Bitcoin'
  row.locator('input[data-donate-field=address]').fill('1BoatSLRHtKNngkdXEeobR76b53LETtpyT')
  # Add a second entry and verify USDT network and address remain user-editable.
  page.locator('[data-action=donation-add]').click()
  row2=page.locator('.donation-row').nth(1)
  row2.locator('[data-donate-field=asset]').select_option('USDT')
  row2=page.locator('.donation-row').nth(1)
  row2.locator('select[data-donate-field=network]').select_option('TRC20')
  row2.locator('[data-donate-field=address]').fill('TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL')
  page.locator('#donationForm [name=password]').fill('Demo123456!')
  page.locator('#donationForm button[type=submit]').click()
  page.wait_for_timeout(100)
  assert page.locator('.donation-public-address').count()==2, 'saved 2 donation addresses'
  assert page.locator('.donation-public-address').nth(0).locator('b').inner_text().startswith('BTC')
  assert 'TRC20' in page.locator('.donation-public-address').nth(1).inner_text()
  # Language switches should not alter the stored asset/network values or rebuild data accidentally.
  for lang in langs:
   page.select_option('#languageSelect',lang)
   page.wait_for_timeout(25)
   row2=page.locator('.donation-row').nth(1)
   if not row2.count():
    page.locator('[data-tab=donations]').click();page.wait_for_timeout(35)
    row2=page.locator('.donation-row').nth(1)
   assert row2.locator('[data-donate-field=asset]').input_value()=='USDT',lang
   assert row2.locator('[data-donate-field=network]').input_value()=='TRC20',lang
   assert page.evaluate('document.documentElement.scrollWidth')<=width+1,(width,lang,'overflow')
  if width==1440:
   page.select_option('#languageSelect','zh-CN');page.wait_for_timeout(40)
   page.screenshot(path=str(root/'tests/v25-btc-usdt.png'),full_page=False)
   page.locator('.donation-row').first.locator('[data-donate-field=asset]').select_option('USDC')
   page.screenshot(path=str(root/'tests/v25-usdc-networks.png'),full_page=False)
  if width==390:
   page.screenshot(path=str(root/'tests/v25-mobile-donations.png'),full_page=False)
  page.close()
 browser.close()
report={'result':'pass' if not issues else 'fail','tested_widths':widths,'tested_languages':langs,'count_checks':len(widths)*len(langs),'js_errors':issues}
(root/'tests/v25-browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
assert not issues,issues
