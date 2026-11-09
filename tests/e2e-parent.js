/* Browser walk-through of the parent view (Playwright). Run: node tests/e2e-parent.js [outDir] */
const { chromium } = require('playwright');
const path = require('path');
const out = process.argv[2] || '/tmp/shots';
require('fs').mkdirSync(out, { recursive: true });
const url = 'file://' + path.resolve(__dirname, '..', 'index.html');
let n = 0; const log = m => console.log(String(++n).padStart(2, '0') + ' ' + m);
const expect = (cond, m) => { if (!cond) throw new Error('EXPECTED: ' + m); log('✓ ' + m); };
const ID = 'maths-fractions-omar';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|fonts\.g/.test(m.text())) errors.push(m.text()); });
  const shot = name => page.screenshot({ path: out + '/p-' + name + '.png', fullPage: true });
  const go = async hash => { await page.goto(url + hash); await page.waitForTimeout(300); };
  const main = () => page.locator('main').innerText();
  const run = fn => page.evaluate(fn);
  const fractionsRow = () => page.locator('main .list-row:has-text("Fractions")');

  /* Teacher steps done through the store (the teacher screens are tested in e2e-teacher.js). */
  const teacherReleases = () => run(() => { const A = EduTech.actions, id = 'maths-fractions-omar';
    A.runOCR(id); A.resolveWord(id, 2, '72'); A.resolveWord(id, 3, '32 stickers'); A.resolveWord(id, 4, '2/3'); A.confirmText(id);
    ['weakness', 'recurring', 'redflag'].forEach(g => A.decideGap(id, g, 'confirmed')); A.approvePractice(id, true); A.release(id); });

  await go('#/parent/home');
  await run(() => { localStorage.clear(); EduTech.actions.reset(); });
  await go('#/parent/home');
  await shot('01-home-start');
  expect(/Mr\. Ahmad/.test(await main()) && (await page.locator('main .list-row').count()) === 3, 'home: greeting and 3 past exams');
  expect(await page.locator('.nav__user .avatar').innerText() === 'MA' && /Omar · Grade 4/.test(await page.locator('.child-switch').innerText()), 'nav: child switch and MA');

  /* Omar uploads: the parent sees the exam but no grade (R1) */
  await run(() => EduTech.actions.submitExam('omar', 'maths-fractions', 3));
  await go('#/parent/home');
  const row = await fractionsRow().innerText();
  expect(/is checking it/.test(row) && /Teacher checking/.test(row) && !/%/.test(row), 'uploaded exam: "Teacher checking", no grade');
  expect(await fractionsRow().evaluate(el => el.tagName) === 'DIV', 'an exam being checked is not a link');
  await go('#/parent/results/' + ID);
  expect(/Not ready yet/.test(await main()), 'results page is locked before release');

  /* Released */
  await teacherReleases();
  await go('#/parent/home');
  expect(/72%/.test(await fractionsRow().innerText()), 'home row shows 72% after release');
  const home = await main();
  expect(/Omar needs extra support in fractions/.test(home) && /Confirmed by Mrs\. Sherin/.test(home) && /How you can help at home/.test(home), 'support box: concern, confirmed chip and home tip');
  expect(/will share a support plan/.test(home), 'no plan yet: says one will come');
  await shot('02-home-released');
  await page.click('main .notif:has-text("Maths results released")'); await page.waitForTimeout(300);
  expect(page.url().endsWith('#/parent/results/' + ID), 'the update opens the results');
  const res = await main();
  expect(/Omar's results · Maths/.test(res) && /Marks by topic/.test(res) && /Strong in multiplication/.test(res) && /Support plan/.test(res) && /feedback to Omar/.test(res), 'results: grade, topics, feedback and support');
  expect(!/\bAI\b/.test(res), 'R1: no AI wording on the parent results');
  await shot('03-results');

  /* Second look: grade and concern hidden */
  await run(() => EduTech.actions.correctText('maths-fractions-omar', 5, '3/8, 1/2, 7/8'));
  await page.waitForTimeout(200);
  expect(/taking a second look/.test(await main()), 'during the second look the grade is hidden');
  await go('#/parent/home');
  expect(!/needs extra support/.test(await main()) && /Second look/.test(await fractionsRow().innerText()), 'home: row says Second look, concern hidden');
  await shot('04-home-second-look');

  /* Note approved, then a support plan */
  await run(() => { const A = EduTech.actions, id = 'maths-fractions-omar';
    A.resolveMark(id, 5, 'change'); A.resolveGap(id, 'weakness', 'keep'); A.resolveGap(id, 'redflag', 'keep'); A.approveNote(id, A.draftNote(id));
    A.sendSupportPlan('omar', { topic: 'Comparing fractions', kind: 'Extra exercises', practice: '5 practice questions', notifyParent: true }); });
  await go('#/parent/home');
  const r2 = await fractionsRow().innerText();
  expect(/80%/.test(r2) && /Updated after a second look/.test(r2), 'home row: 80% and "Updated after a second look"');
  expect(/has started a support plan: 5 practice questions this week/.test(await main()), 'support box mentions the plan');
  await shot('05-home-updated');
  await fractionsRow().click(); await page.waitForTimeout(300);
  const upd = await main();
  expect(/The grade was updated after a second look/.test(upd) && /as "1\/8" instead of "7\/8"/.test(upd) && /Question 5 went from 0 to 2 points/.test(upd) && /72% to 80%/.test(upd) && /support plan stays in place/.test(upd), 'results: what changed, in parent words');
  expect(/Extra exercises: comparing fractions \(5 practice questions\)/.test(upd), 'results: the support plan');
  await shot('06-results-updated');

  /* Progress */
  await page.click('a.nav__link:has-text("Progress")'); await page.waitForTimeout(300);
  const prog = await main();
  expect(/since September/.test(prog) && /Still practising/.test(prog) && /Solved/.test(prog) && /Active/.test(prog) && /Finished · solved/.test(prog), 'progress: weak spots and both plans');
  await shot('07-progress');

  /* Message the teacher about the exam */
  await go('#/parent/results/' + ID);
  await page.click('main button:has-text("Message Mrs. Sherin")'); await page.waitForTimeout(200);
  expect(/About: Omar · Maths · Fractions and Word Problems/.test(await page.locator('.dialog').innerText()), 'dialog says what it is about');
  expect(await page.locator('.dialog button:has-text("Send message")').isDisabled(), 'Send is locked while the message is empty');
  await page.type('#msg-text', 'Thank you for the support plan. We will practise the fraction questions at home this week.');
  await shot('08-message-dialog');
  await page.click('.dialog button:has-text("Send message")'); await page.waitForTimeout(200);
  expect(/Message sent to Mrs\. Sherin/.test(await page.locator('.toasts').innerText()), 'toast: message sent');
  await go('#/parent/home'); await shot('09-home-message-sent');

  /* Teacher replies; the parent opens the conversation from the update */
  await go('#/teacher/home');
  expect(/Message from Mr\. Ahmad \(Omar's parent\)/.test(await main()) && /About Maths/.test(await main()), 'teacher sees the message and the exam it is about');
  expect((await page.locator('main .notif:has-text("Message from Mr. Ahmad")').count()) === 1, 'teacher sees the message once');
  await page.click('button:has-text("Reply")'); await page.waitForTimeout(200);
  await page.fill('#reply-text', 'Thank you, Mr. Ahmad. Try the pizza question with him this week.');
  await page.click('.dialog button:has-text("Send reply")'); await page.waitForTimeout(200);
  expect(/You replied/.test(await main()), 'teacher sees her reply under the message');
  await go('#/parent/home');
  await page.click('main .notif:has-text("Reply from Mrs. Sherin")'); await page.waitForTimeout(300);
  const th = await page.locator('.dialog').innerText();
  expect(/Messages with Mrs\. Sherin/.test(th) && /We will practise/.test(th) && /pizza question/.test(th), 'the reply opens the whole conversation');
  await shot('10-thread');
  await page.keyboard.press('Escape');

  /* Phone width */
  await page.setViewportSize({ width: 390, height: 844 });
  for (const hsh of ['#/parent/home', '#/parent/results/' + ID, '#/parent/progress']) {
    await go(hsh);
    const over = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(!over, 'no horizontal scroll on a phone: ' + hsh);
    await shot('11-mobile-' + hsh.split('/')[2]);
  }

  console.log('errors:', errors.length ? errors : 'none');
  await browser.close();
  if (errors.length) process.exit(1);
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
