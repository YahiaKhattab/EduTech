/* Browser walk-through of the student view, Student New design (Playwright).
   Run: node tests/e2e-student.js [outDir]
   Covers: messages and read state, English results, Maths upload (add, remove, retake, change),
   German upload, R1 locks, second look, results, practice plan, My Progress and phone width. */
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
  page.on('console', m => { if (m.type() === 'error' && !/ERR_|fonts\.g/.test(m.text())) errors.push(m.text()); });
  const shot = async name => { await page.evaluate(() => { scrollTo(0, 0); document.querySelectorAll('.toast').forEach(t => t.remove()); }); await page.screenshot({ path: out + '/s-' + name + '.png', fullPage: true }); };
  const wait = t => page.waitForTimeout(t || 250);
  const go = async hash => { await page.goto(url + hash); await wait(300); };
  const text = sel => page.locator(sel).first().innerText();
  const count = sel => page.locator(sel).count();
  const sv = () => page.evaluate(() => EduTech.views.student('omar'));
  const unread = async () => (await sv()).notifications.filter(x => !x.read).length;
  const shortcut = async label => { await page.click('.demo-btn'); await page.click('.demo-menu__list button:has-text("' + label + '")'); await wait(400); };
  const tickAll = async () => { for (const t of ['All pages', 'clear', 'name']) await page.click('.s-check:has-text("' + t + '")'); };

  await go('#/student/home');
  await page.evaluate(() => { localStorage.clear(); EduTech.actions.reset(); });
  await go('#/student/home'); await shot('01-home');

  /* Home and messages */
  expect((await text('.s-bell__count')) === '2', 'bell shows 2 new messages (practice + English results)');
  expect((await text('.s-hero')).includes('2 exams to send'), 'upload card: 2 exams to send (Maths + German)');
  expect((await count('.s-exams .s-exam')) === 3, 'My exams shows the 3 finished exams, no invented ones');
  await page.click('.s-bell'); await wait();
  expect((await count('.s-panel .s-msg--new')) === 2, 'Messages panel lists 2 new messages');
  await page.click('.s-panel .s-msg:has-text("English results")'); await wait();
  expect(/student\/results\/h3/.test(page.url()), 'English message opens the English results');
  expect(await unread() === 1, 'opening it marks only that message read');
  expect((await text('.s-score')).includes('18') && (await text('.s-explain')).includes('Question 4'), 'English results: 18 / 20, first not-full question open (Q4)');
  await shot('02-english-results');

  /* Maths upload */
  await go('#/student/upload');
  expect(await page.locator('button:has-text("Send to Mrs. Sherin")').isDisabled(), 'Send is locked before anything is filled in');
  expect(await page.locator('.s-subject-opt:has-text("English")').isDisabled(), 'English tile: nothing to send, disabled');
  await page.click('.s-subject-opt:has-text("Maths")'); await wait();
  expect((await text('.s-select')).includes('Fractions and Word Problems'), 'Maths picks the only Maths exam');
  expect((await text('.s-seg button[aria-pressed="true"]')).includes('English'), 'language follows the exam (English)');
  await page.click('button:has-text("Use 3 sample pages")'); await wait();
  await page.click('button[aria-label="Remove page 3"]'); await wait();
  expect((await text('.s-pages__note')).includes('2 of 3'), 'removing a page shows 2 of 3 pages');
  await page.click('.s-add'); await wait();
  expect((await text('.s-pages__note')).includes('3 of 3'), 'Add a page brings it back to 3 of 3');
  await page.click('.s-page:nth-child(2) button:has-text("Retake")'); await page.click('.dialog button:has-text("Take new photo")'); await wait();
  expect((await text('.toasts')).includes('New photo saved for page 2'), 'Retake replaces page 2');
  await page.click('.s-summary button:has-text("Change")'); await page.click('.dialog button:has-text("Keep my photos")'); await wait();
  expect((await count('.s-page')) === 3, 'Change asks first; keeping the photos keeps all 3');
  await tickAll(); await shot('03-upload-ready');
  await page.click('button:has-text("Send to Mrs. Sherin")');
  await page.waitForURL(/student\/exam\/maths-fractions-omar/, { timeout: 6000 }); await wait();
  expect((await text('.s-banner')).includes('3 pages'), 'tracker shows the "sent" banner with 3 pages');
  expect(await page.locator('.s-next button:has-text("See my results")').isDisabled(), 'See my results is locked (R1)');
  const arrived = (await sv()).notifications.filter(x => x.title === 'Your Maths exam arrived');
  expect(arrived.length === 1 && !arrived[0].read, '"Your Maths exam arrived" message created once, unread');
  await shot('04-tracker-sent');
  await go('#/student/results/maths-fractions-omar');
  expect((await text('main')).includes('Not ready yet'), 'results URL before release says Not ready yet');
  await wait(4300);
  expect((await sv()).exams[0].status === 'Read', 'after the text is read the status is Read');

  /* German upload */
  await go('#/student/upload');
  await page.click('.s-subject-opt:has-text("Deutsch")'); await wait();
  expect((await text('.s-seg button[aria-pressed="true"]')).includes('Deutsch'), 'German exam switches the language to Deutsch');
  await page.click('button:has-text("Use 1 sample page")'); await tickAll();
  await page.click('button:has-text("Send to Mrs. Sherin")'); await page.waitForURL(/deutsch-mein-tag-omar/, { timeout: 6000 }); await wait();
  const de = await page.evaluate(() => ({ t: EduTech.views.teacher('sherin'), p: EduTech.views.parent('ahmad') }));
  const row = de.t.rows.find(r => r.examId === 'deutsch-mein-tag-omar');
  expect(row && row.status === 'To review', 'teacher queue has the German exam as To review');
  const pe = de.p.exams.find(e => e.examId === 'deutsch-mein-tag-omar');
  expect(pe && pe.status === 'Teacher checking' && !pe.results, 'parent sees Teacher checking, no grade');
  await go('#/teacher/home');
  expect((await count('tbody tr:has-text("Omar")')) === 2, 'teacher table lists both of Omar\'s exams');
  await go('#/student/upload');
  expect((await text('main')).includes('Nothing to upload'), 'upload page: nothing left to send');

  /* Mark all as read */
  await go('#/student/home'); await page.click('.s-bell'); await page.click('.s-panel button:has-text("Mark all as read")'); await wait();
  expect(await unread() === 0 && (await count('.s-bell__count')) === 0, 'Mark all as read clears the count');

  /* Release, results, practice plan */
  await shortcut('Verify text'); await shortcut('Confirm grades');
  await go('#/student/exam/maths-fractions-omar');
  expect(!(await page.locator('.s-next a:has-text("See my results")').count() === 0), 'tracker: Ready unlocks See my results');
  await page.click('.s-next a:has-text("See my results")'); await wait();
  const score = await text('.s-score');
  expect(score.includes('72%') && score.includes('18'), 'results: 18 / 25, 72%');
  expect(!/great job|excellent|well done/i.test(score), 'praise is factual, not tied to the grade');
  await page.click('.s-qtile:has-text("Q8")'); await wait();
  expect((await text('.s-explain')).includes('3 slices'), 'Q8 explanation: 3 slices');
  await page.click('button:has-text("See practice plan")'); await wait();
  expect((await text('.dialog')).includes('How to do it'), 'practice plan pop-up opens');
  await page.click('.dialog button:has-text("Got it")'); await shot('05-results');

  /* Second look hides the grade */
  await shortcut('Correct the misread');
  await go('#/student/exam/maths-fractions-omar');
  expect((await count('.s-card--second')) === 1, 'tracker shows the second-look card');
  await go('#/student/results/maths-fractions-omar');
  expect(!(await text('main')).includes('72%') && (await text('main')).includes('second look'), 'results are hidden during the second look');
  await go('#/student/home');
  expect((await text('[data-exam="maths-fractions-omar"]')).includes('Second look'), 'Home card says Second look');
  await shortcut('Re-check everything');
  await go('#/student/results/maths-fractions-omar');
  expect((await text('.s-score')).includes('80%') && (await count('.s-qtile__tag')) === 1, 'after the note: 80% and Q5 marked Changed');
  await shot('06-results-updated');

  /* My Progress */
  await go('#/student/progress');
  expect((await count('.s-chart__col')) === 4 && (await count('.s-chart__col a')) === 2, 'chart: 4 bars, only the 2 with a results page are links');
  await page.click('.s-practice:has-text("number line") button'); await wait();
  expect((await text('.dialog')).includes('Fractions on a number line'), 'number-line practice plan opens');
  await page.keyboard.press('Escape'); await shot('07-progress');

  /* Phone width */
  await page.setViewportSize({ width: 390, height: 844 });
  for (const hsh of ['#/student/home', '#/student/upload', '#/student/exam/maths-fractions-omar', '#/student/results/maths-fractions-omar', '#/student/results/h3', '#/student/progress']) {
    await go(hsh);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(!overflow, 'no horizontal scroll on a phone: ' + hsh);
  }
  await shot('08-phone-progress');

  console.log('errors:', errors.length ? errors : 'none');
  await browser.close();
  if (errors.length) process.exit(1);
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
