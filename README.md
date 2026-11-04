# EduTech · coded front-end

AI-assisted assessment and learning gap detection for children in Grades 1–5.
CSEN 909 Human Computer Interaction, Winter 2026, German University in Cairo · **Team #30**
(Yahia Hany Khattab · Youssef Hesham · Samer Eyad Waly · Kerollos Mohsen · Islam Hatem)

This is the optional coded front-end for Milestone 3. It follows our high-fidelity prototype (Penpot) screen by screen.

## Run it

No installation and no build step.

- **Easiest:** double-click `index.html`. It opens in your browser.
- **In VS Code:** install the *Live Server* extension, right-click `index.html` → **Open with Live Server**.

Use the dark **Demo** bar at the top to switch role (Student / Teacher / Parent) and to **Reset demo** before recording.

## Deploy (GitHub Pages)

1. On GitHub, open the repository → **Settings** → **Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
3. After about a minute the site is live at `https://<your-username>.github.io/EduTech/`.

GitHub Pages on a *private* repository needs GitHub Pro (free with the GitHub Student Developer Pack). Otherwise make the repository public before submission.

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

The **Shortcuts** menu in the demo bar jumps Omar's exam to the next stage, using the same actions as the screens. It is handy when recording the video.

## Project structure

```
index.html              loads everything in order
css/
  tokens.css            colours, type, spacing (same as the design system)
  base.css              page layout, demo bar, navigation
  components.css        buttons, chips, cards, fields, dialogs, toasts
  student.css           student screens
  teacher.css           teacher screens
  parent.css            parent screens
js/
  data.js               demo data (exams, OCR readings, simulated AI)
  store.js              shared state, all actions and rules
  ui/                   small helpers: dom, icons, format, components, router, progress
  views/student/        home, upload, tracker, results, progress
  views/teacher/        shared (helpers), home, verify, review (+ questions, gaps, history tabs), gaps
  views/parent/         shared (helpers, message dialog), home, results, progress
  demo.js               simulated OCR delay and the "Shortcuts" menu
  app.js                app shell (demo bar, navigation, page)
tests/
  store.test.js         plays the whole story through the store
```

## Tests

With Node.js installed: `node tests/store.test.js` (checks the full story and all six rules).

## Progress

- [x] Part 1 · Shared state and student view
- [x] Part 2 · Teacher view
- [x] Part 3 · Parent view

## AI use

This code was written with the help of Claude (Anthropic), following our own Milestone 2 research and Milestone 3 prototype. The chat history is included in our submission as the brief requires.
