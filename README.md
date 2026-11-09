# EduTech · coded front-end

AI-assisted assessment and learning gap detection for children in Grades 1–5.
CSEN 909 Human Computer Interaction, Winter 2026, German University in Cairo · **Team #30**
(Yahia Hany Khattab · Youssef Hesham · Samer Eyad Waly · Kerollos Mohsen · Islam Hatem)

**Live demo:** https://yahiakhattab.github.io/EduTech/
**Repository:** https://github.com/YahiaKhattab/EduTech

This is the optional coded front-end for Milestone 3. It follows our high-fidelity prototype (Penpot) screen by screen. 

## Run it

No installation and no build step. Open the [live demo](https://yahiakhattab.github.io/EduTech/), or run it locally:

- **Easiest:** download or clone the repository and double-click `index.html`. It opens in your browser.
- **In VS Code:** install the *Live Server* extension, right-click `index.html` → **Open with Live Server**.

Use the dark **Demo** bar at the top to switch role (Student / Teacher / Parent). Click **Reset demo** once before you start: the demo data is saved in your browser, so this gives everyone the same starting point.

## How it works

- **One shared state** (`js/store.js`) holds every exam for all three views. A teacher action really changes what the student and the parent see, even in another browser tab. It is saved in the browser (localStorage).
- **The rules live in the store, not in the screens**, so no screen can break them:
  1. Students and parents only see results the teacher has released, never AI suggestions.
  2. *Confirm text* is locked until every doubtful word is checked.
  3. *Release* is locked until every weakness and red flag is confirmed or dismissed.
  4. **Correction Impact Flags (our unique feature):** correcting text after grading marks every mark, weakness and red flag built on it as *Re-check*.
  5. The note to the student is locked until all re-checks are resolved.
  6. Dismissing a red flag, or keeping an old mark, needs a reason.
- **OCR and AI are simulated**, as the project brief allows. Each answer has a fixed OCR reading, and the "AI" looks up a mark and feedback for the text it receives. That is why correcting a misread really changes the AI's suggestion.

## Demo story

Omar (Grade 4) uploads his Maths exam *Fractions and Word Problems*. The OCR misreads his "7/8" as "1/8", the AI grades 18/25 (72%), and Mrs. Sherin confirms and releases it. Later she spots the misread, corrects it, re-checks the three results built on it, and approves a note: Omar's grade becomes 20/25 (80%), and his parent, Mr. Ahmad, is told what changed.

### Try it as the student

1. Click **Reset demo**, then **Student**. Omar has 2 new messages (bell) and 2 exams to send: Maths and German.
2. Open the bell and tap **Your English results are ready**: every question explained, with what he did well.
3. **Upload my exam** → **Maths**. The exam and its 3 pages fill in. Use **No photos? Use 3 sample pages (demo)** or real photos, try **Retake** and **Add a page**, tick the three checks → **Send to Mrs. Sherin**.
4. The tracker shows where the exam is: *Sent*, then *Read* after a few seconds. **See my results** stays locked until the teacher releases them.
5. Upload the German exam *Mein Tag* the same way: the language switches to Deutsch by itself.
6. After the teacher releases the Maths exam (or **Shortcuts**): open the results, tap a question tile for the explanation, and open **See practice plan**. During a second look the grade is hidden; afterwards the changed question is marked and a note explains why.
7. **My Progress**: marks over time, practice from Mrs. Sherin (**See plan**), and the things Omar is working on.

### Try it as the teacher

1. Click **Reset demo**, then **Teacher**. Lina's German exam is already waiting.
2. Switch to **Student** and upload Omar's Maths exam (or use **Shortcuts → Omar uploads his Maths exam**). After a few seconds it is read.
3. As **Teacher**: *Verify text* → pick the right reading for the 3 doubtful words → *Confirm text and continue*. The AI grades it.
4. *Grade review*: check the marks, then on **Gaps and flags** confirm or dismiss each item → *Confirm grades and release*.
5. Open the exam again (**View**), select **Q5**, click *Edit extracted text* and change `1/8` to `7/8`. The impact dialog shows the 3 results built on it. Choose *Re-check now*.
6. Change Q5 to 2 / 2, keep or remove the weakness and the red flag (with a reason), then *Notify student of change* → *Approve and send*.
7. **Class gaps**: confirm or dismiss Youssef's red flag, and send Omar a support plan (the parent is told too).

### Try it as the parent

1. Click **Parent**. Mr. Ahmad sees Omar's recent exams. A grade appears only after Mrs. Sherin releases it; before that the exam says *Teacher checking*.
2. After the release, a red box explains Mrs. Sherin's support concern in parent words, with one idea for helping at home. **Updates from school** lists every notification.
3. Open the Maths exam: the grade, marks by topic, Mrs. Sherin's feedback and the support plan. During a second look the grade is hidden again; afterwards the page explains what the scanner misread and how the grade changed (72% → 80%).
4. **Message Mrs. Sherin** (from Home or from an exam). As **Teacher**, the message appears on Home with a **Reply** button. The reply shows up in the parent's updates and opens the conversation.
5. **Progress**: grades over time, weak spots (still practising / solved) and the support plans Mrs. Sherin shared.

The **Shortcuts** menu in the demo bar jumps Omar's Maths exam to the next stage, using the same actions as the screens. It is handy when recording the video.

## Testing

**Store tests (Node.js only).** These play the whole story through the store and check all six rules, plus the German upload and the student messages:

```
node tests/store.test.js
```

Expected: `77 passed, 0 failed`.

**Browser tests (Playwright).** These click through each view in a real browser and save screenshots to the folder you name. Set up once:

```
npm install --no-save playwright
npx playwright install chromium
```

Then:

```
node tests/e2e-student.js out/student
node tests/e2e-teacher.js out/teacher
node tests/e2e-parent.js  out/parent
```

Each prints a numbered list of checks and ends with `errors: none`. Expected: student 43, teacher 18, parent 28 checks. They include no horizontal scrolling at phone width.

**By hand:** follow *Demo story* above, after **Reset demo**.

## Deploy (GitHub Pages)

The live demo is deployed from this repository:

1. On GitHub, open the repository → **Settings** → **Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
3. After about a minute the site is live at `https://<your-username>.github.io/EduTech/`. Every push to `main` updates it.

No build step or server settings are needed: all paths are relative, and the pages use `#/` addresses, so reloading any page works.

## Project structure

```
index.html              loads everything in order
css/
  tokens.css            colours, type, spacing (same as the design system)
  base.css              page layout, demo bar, navigation
  components.css        buttons, chips, cards, fields, dialogs, toasts
  student.css           student screens (shared pieces also used by the parent view)
  student-kit.css       "Student New" design, scoped to the student view
  teacher.css           teacher screens
  parent.css            parent screens
js/
  data.js               demo data (exams, OCR readings, simulated AI)
  store.js              shared state, all actions and rules
  ui/                   small helpers: dom, icons, format, components, router, progress
  views/student/        kit (shared student pieces), home, upload, tracker, results, progress
  views/teacher/        shared (helpers), home, verify, review (+ questions, gaps, history tabs), gaps
  views/parent/         shared (helpers, message dialog), home, results, progress
  demo.js               simulated OCR delay and the "Shortcuts" menu
  app.js                app shell (demo bar, navigation, page)
tests/
  store.test.js         plays the whole story through the store
  e2e-student.js        browser test of the student view
  e2e-teacher.js        browser test of the teacher view
  e2e-parent.js         browser test of the parent view
```

## AI use

This code was written with the help of Claude (Anthropic), following our own Milestone 2 research and Milestone 3 prototype. The chat history is included in our submission as the brief requires.
