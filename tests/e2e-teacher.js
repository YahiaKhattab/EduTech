/* Browser walk-through of the teacher view (Playwright). Run: node tests/e2e-teacher.js [outDir] */
const { chromium } = require('playwright');
const path = require('path');
const out = process.argv[2] || '/tmp/shots';
require('fs').mkdirSync(out, { recursive: true });
const url = 'file://' + path.resolve(__dirname, '..', 'index.html');
let n = 0; const log = m => console.log(String(++n).padStart(2, '0') + ' ' + m);
const expect = (cond, m) => { if (!cond) throw new Error('EXPECTED: ' + m); log('✓ ' + m); };

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|fonts\.g/.test(m.text())) errors.push(m.text()); });
  const shot = name => page.screenshot({ path: out + '/t-' + name + '.png', fullPage: true });
  const click = async (sel, i) => { await page.locator(sel).nth(i || 0).click(); await page.waitForTimeout(250); };
  /* A button or button-styled link with this label, optionally inside a scope selector. */
  const btn = (label, scope) => { const s = scope ? scope + ' ' : ''; return s + 'button:has-text("' + label + '"), ' + s + 'a.btn:has-text("' + label + '")'; };
  const text = sel => page.locator(sel).first().innerText();
  const dialog = '.dialog';

  await page.goto(url + '#/teacher/home');
  await page.evaluate(() => { localStorage.clear(); EduTech.actions.reset(); EduTech.actions.submitExam('omar', 'maths-fractions', 3); });
  await page.waitForTimeout(4600);
  await page.goto(url + '#/teacher/home'); await page.waitForTimeout(300);
  await shot('01-home');
  expect((await page.locator('tbody tr').count()) === 6, 'queue shows 6 exams (Omar, Lina + 4 others)');

  /* Verify text */
  await click(btn('Verify text', 'tr:has-text("Omar Khaled")'));
  expect(await page.locator(btn('Confirm text and continue')).isDisabled(), 'Confirm is locked with 3 words unchecked');
  await shot('02-verify-0');
  await click('.check-item:has-text("Question 2") button:has-text("72")');
  await click('.check-item:has-text("Question 3") button:has-text("32 stickers")');
  expect((await text('.card__head:has-text("Words to check")')).includes('2 of 3'), 'progress shows 2 of 3');
  await click('.check-item:has-text("Question 4") button:has-text("2/3")');
  await shot('03-verify-3');
  await click(btn('Confirm text and continue'));
  await page.waitForTimeout(400); await shot('04-ai-grading');
  await page.waitForURL(/teacher\/review/, { timeout: 4000 }); await page.waitForTimeout(400);
  expect((await text('.total-bar')).includes('18 / 25'), 'AI total is 18 / 25');
  await shot('05-review-questions');
  expect(await page.locator(btn('Confirm grades and release')).isDisabled(), 'Release locked until gaps decided');

  /* Questions: override a mark and undo it, approve practice */
  await page.fill('.mark-input', '1'); await page.locator('.mark-input').dispatchEvent('change'); await page.waitForTimeout(250);
  expect((await text('.total-bar')).includes('19 / 25'), 'teacher mark changes the total (19 / 25)');
  await click('.toast button:has-text("Undo")');
  expect((await text('.total-bar')).includes('18 / 25'), 'Undo restores 18 / 25');
  await click('label:has-text("Approve for Omar") input');

  /* Gaps */
  await click('a.tab:has-text("Gaps and flags")');
  await shot('06-gaps-suggested');
  await click(btn('Confirm', '.gap:has-text("Weakness")'));
  await click(btn('Confirm', '.gap:has-text("Recurring mistake")'));
  await click(btn('Confirm red flag', '.gap:has-text("Red flag")'));
  await shot('07-gaps-confirmed');
  await click(btn('Confirm grades and release'));
  await shot('08-release-dialog');
  await click(btn('Release results', dialog));
  await page.waitForTimeout(300); await shot('09-home-released');
  const sv = await page.evaluate(() => EduTech.views.student('omar').exams[0]);
  expect(sv.status === 'Ready' && sv.results.pct === 72, 'student now sees 72%');

  /* Correction Impact Flags */
  await click(btn('View', 'tr:has-text("Omar Khaled")'));
  await click('.qlist__item:has-text("Q5")');
  await shot('10-released-q5');
  await click('button:has-text("Edit extracted text")');
  await page.fill(dialog + ' input.input', '3/8, 1/2, 7/8');
  await shot('11-edit-dialog');
  await click(btn('Save correction', dialog));
  expect((await text(dialog + ' h2')).includes('affects 3 results'), 'impact dialog: 3 results affected');
  await shot('12-impact');
  await click(btn('Re-check now', dialog));
  expect(await page.locator(btn('Notify student of change')).isDisabled(), 'Notify locked while re-checks are open');
  const st = await page.evaluate(() => EduTech.views.student('omar').exams[0]);
  expect(st.status === 'Second look' && !st.results, 'student sees "Second look" and no grade');
  await shot('13-recheck-q5');
  await click(btn('Change to 2 / 2'));
  expect((await text('.total-bar')).includes('20 / 25'), 'total is 20 / 25 after change');
  await click('a.tab:has-text("Gaps and flags")');
  await shot('14-gaps-recheck');
  await click(btn('Keep weakness', '.gap:has-text("Weakness")'));
  await click(btn('Keep red flag', '.gap:has-text("Red flag")'));
  await click('a.tab:has-text("History")');
  await shot('15-history');
  await click(btn('Notify student of change'));
  await shot('16-note');
  await click(btn('Approve and send', dialog));
  const st2 = await page.evaluate(() => EduTech.views.student('omar').exams[0].results);
  expect(st2.pct === 80 && st2.changeNote, 'student sees 80% with the note');

  /* Class gaps */
  await click('a.nav__link:has-text("Class gaps")');
  await shot('17-class');
  await click(btn('Dismiss', '.flag-row:has-text("Youssef")'));
  await click(btn('Dismiss flag', dialog));
  expect((await text('.flag-row:has-text("Youssef")')).includes('Dismissed'), "Youssef's flag dismissed with a reason");
  await click(btn('Send support plan'));
  const parentNotes = await page.evaluate(() => EduTech.views.parent('ahmad').notifications.map(n => n.title));
  expect(parentNotes[0].startsWith('Support plan'), 'parent got the support plan');
  await click('a.segmented__opt:has-text("Student")');
  await shot('18-student-tab');

  /* German verify with the ß key */
  await click('a.nav__link:has-text("Home")');
  await click(btn('Verify text', 'tr:has-text("Lina Hassan")'));
  await click('.check-item:has-text("Question 1") button:has-text("Other")');
  await page.fill('.editor input', 'Stra'); await page.click('.editor .key:has-text("ß")'); await page.type('.editor input', 'e');
  await shot('19-german-typing');
  await click(btn('Save', '.editor'));
  await click('.check-item:has-text("Question 2") button:has-text("Ich bin müde.")');
  await click('.check-item:has-text("Question 3") button:has-text("Brot mit Käse")');
  expect((await page.evaluate(() => EduTech.views.exam('deutsch-mein-tag-lina').answers[0].text)) === 'Straße', 'typed "Straße" with the ß key');
  await click(btn('Confirm text and continue'));
  await page.waitForURL(/teacher\/review/, { timeout: 4000 }); await page.waitForTimeout(300);
  expect((await text('.total-bar')).includes('12 / 12'), 'German exam graded 12 / 12');

  /* Phone width */
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url + '#/teacher/review/maths-fractions-omar/questions'); await page.waitForTimeout(300);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  await shot('20-mobile-review'); expect(!overflow, 'no horizontal scroll on a phone');

  console.log('errors:', errors.length ? errors : 'none');
  await browser.close();
  if (errors.length) process.exit(1);
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
