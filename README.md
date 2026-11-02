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

Until the teacher view is added, use **Simulate teacher** in the demo bar to move Omar's exam through the teacher steps.

## Project structure

```
index.html              loads everything in order
css/
  tokens.css            colours, type, spacing (same as the design system)
  base.css              page layout, demo bar, navigation
  components.css        buttons, chips, cards, fields, dialogs, toasts
  student.css           student screens
js/
  data.js               demo data (exams, OCR readings, simulated AI)
  store.js              shared state, all actions and rules
  ui/                   small helpers: dom, icons, format, components, router
  views/student/        home, upload, tracker, results, progress
  demo.js               simulated OCR delay and "Simulate teacher" menu
  app.js                app shell (demo bar, navigation, page)
tests/
  store.test.js         plays the whole story through the store
```

## Tests

With Node.js installed: `node tests/store.test.js` (checks the full story and all six rules).

## Progress

- [x] Part 1 · Shared state and student view
- [ ] Part 2 · Teacher view
- [ ] Part 3 · Parent view

## AI use

This code was written with the help of Claude (Anthropic), following our own Milestone 2 research and Milestone 3 prototype. The chat history is included in our submission as the brief requires.
