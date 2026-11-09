/* Upload your exam (Student New design, M2 wireframe screen 2, features S1 and S7):
   1 which exam, 2 add pages, 3 check, then send. Sending goes through store.actions.submitExam,
   so the teacher queue and the parent view update from the same data. */
(function () {
  'use strict';
  const { h, icon } = UI;
  const store = window.EduTech;
  const S = UI.S;
  const ME = 'omar';
  const SUBJECTS = ['Maths', 'English', 'Deutsch', 'Science'];
  const LANGS = [['en', 'English'], ['de', 'Deutsch']];
  const CHECKS = ['All pages are included', 'The photos are clear, not blurry', 'My name is on the paper'];
  const TIPS = [['lightbulb', 'Use a bright room with no shadows.'], ['file', 'Put the paper flat on a table.'], ['image', 'Fit the whole page in the photo.'], ['camera', 'Take one photo for each page.']];
  const MAX_PAGES = 10;

  /* The form keeps its own state between re-renders until the exam is sent. */
  const draft = {};
  const resetDraft = () => Object.assign(draft, { subject: '', templateId: '', language: 'en', pages: [], checks: [false, false, false] });
  resetDraft();
  let fileInput = null; let replaceIndex = null;
  const tpl = () => draft.templateId ? store.state.templates[draft.templateId] : null;
  const clearChecks = () => { draft.checks = [false, false, false]; };

  function choose(templateId) {
    draft.templateId = templateId;
    const t = tpl(); if (t) draft.language = t.language;   // the exam's own language; the student can still change it
    UI.render();
  }

  /* ---------- Photos ---------- */
  function addFiles(files) {
    const imgs = [...files].filter(f => f.type.startsWith('image/'));
    if (!imgs.length) { UI.toast('Please choose photos (JPG or PNG).', { tone: 'recheck' }); return; }
    const retake = replaceIndex;
    imgs.forEach(f => {
      const page = { kind: 'photo', url: URL.createObjectURL(f), name: f.name };
      if (replaceIndex !== null) { draft.pages[replaceIndex] = page; replaceIndex = null; } else if (draft.pages.length < MAX_PAGES) draft.pages.push(page);
    });
    clearChecks();                                   // new pages: tick the checks again
    UI.render();
    if (retake !== null) UI.toast('New photo saved for page ' + (retake + 1) + '.');
  }
  function pickFiles(capture, index) {
    replaceIndex = (index === undefined) ? null : index;
    fileInput = fileInput || h('input', { type: 'file', accept: 'image/*', multiple: true, class: 'sr-only', tabindex: '-1', 'data-upload': 'photos', onChange: e => { addFiles(e.target.files); e.target.value = ''; } });
    if (!fileInput.isConnected) document.body.appendChild(fileInput);
    if (capture) fileInput.setAttribute('capture', 'environment'); else fileInput.removeAttribute('capture');
    fileInput.multiple = index === undefined;
    fileInput.click();
  }
  const isDemo = () => draft.pages.length && draft.pages.every(p => p.kind === 'sample');
  function addPage() {
    if (isDemo()) { draft.pages.push({ kind: 'sample' }); clearChecks(); UI.render(); UI.toast('Page ' + draft.pages.length + ' added.'); }
    else pickFiles(false);
  }
  /* Retake: a real photo opens the camera; a demo page shows a camera preview first. */
  function retake(i) {
    if (draft.pages[i].kind === 'photo') { pickFiles(true, i); return; }
    UI.dialog(close => [
      h('div', { class: 's-dialog-head' }, h('h2', null, 'Retake page ' + (i + 1)), h('button', { type: 'button', class: 's-close', 'aria-label': 'Close', onClick: close }, icon('x', 22))),
      h('div', { class: 's-camera', 'aria-hidden': 'true' }, h('div', { class: 's-paper' })),
      h('p', { class: 's-caption' }, 'Hold the camera over the whole page. The new photo takes the place of the old one.'),
      h('div', { class: 'dialog__foot' }, UI.button({ label: 'Cancel', variant: 'ghost', onClick: close }),
        UI.button({ label: 'Take new photo', icon: 'camera', onClick: () => { draft.pages[i] = { kind: 'sample', retaken: true }; clearChecks(); close(); UI.render(); UI.toast('New photo saved for page ' + (i + 1) + '.'); } }))]);
  }

  /* ---------- Step 1: which exam ---------- */
  function examPicker(v, subject) {
    const list = store.state.assignments.filter(a => a.studentId === ME && store.state.templates[a.templateId].subject === subject);
    UI.dialog(close => [
      h('div', { class: 's-dialog-head' }, S.subject(subject, 'sm'), h('h2', null, 'Which ' + subject + ' exam?'), h('button', { type: 'button', class: 's-close', 'aria-label': 'Close', onClick: close }, icon('x', 22))),
      h('div', { class: 's-menu' }, list.map(a => {
        const t = store.state.templates[a.templateId]; const sent = v.exams.find(e => e.templateId === a.templateId);
        return h('button', { type: 'button', class: 's-menu__opt', disabled: !!sent, 'aria-current': a.templateId === draft.templateId ? 'true' : null,
          onClick: () => { close(); choose(a.templateId); } },
        S.subject(subject, 'sm'), h('span', { class: 'grow', style: { flex: '1' } }, h('strong', null, t.title), h('span', { class: 's-caption' }, 'Given back ' + UI.day(t.date) + ' · ' + UI.plural(t.pages || 1, 'page'))),
        sent ? S.chip(sent.status, 'Already sent') : icon('chevron-right', 22));
      }))]);
  }

  function subjectTiles(v) {
    return h('div', { class: 's-subjects', role: 'group', 'aria-label': 'Subject' }, SUBJECTS.map(s => {
      const open = v.toUpload.filter(x => x.subject === s);
      const sent = v.exams.some(e => e.subject === s);
      const on = draft.subject === s;
      return h('button', { type: 'button', class: 's-subject-opt', 'aria-pressed': String(on), disabled: !open.length, style: open.length ? null : { opacity: .6, cursor: 'not-allowed' },
        onClick: () => { draft.subject = s; draft.templateId = ''; if (open.length === 1) choose(open[0].templateId); else { UI.render(); examPicker(v, s); } } },
      S.subject(s, 'sm'), h('span', { style: { display: 'grid' } }, s,
        h('span', { class: 's-caption', style: { fontFamily: 'var(--font)', fontWeight: 400 } }, open.length ? UI.plural(open.length, 'exam') + ' to send' : sent ? 'Sent' : 'Nothing to send')),
      on ? h('span', { class: 's-subject-opt__tick' }, icon('check', 16)) : null);
    }));
  }

  function languageSwitch(locked) {
    return h('div', null, h('span', { class: 's-label', id: 'lang-label' }, 'Exam language'),
      h('div', { class: 's-seg' + (locked ? ' s-seg--off' : ''), role: 'group', 'aria-labelledby': 'lang-label' }, LANGS.map(([code, name]) =>
        h('button', { type: 'button', 'aria-pressed': String(draft.language === code), disabled: locked, onClick: () => { draft.language = code; UI.render(); } },
          draft.language === code ? icon('check', 18) : null, name))),
      h('p', { class: 's-help' }, locked ? 'Remove your photos to change this.' : 'Choose Deutsch if your exam is written in German.'));
  }

  function step1(v, done) {
    const t = tpl();
    const head = h('div', { class: 's-step__head' }, h('span', { class: 's-step__num ' + (done ? 's-step__num--done' : 's-step__num--now') }, done ? icon('check', 22) : '1'),
      h('h2', null, 'Which exam?'), h('span', { class: 's-step__state ' + (done ? 's-step__state--done' : 's-step__state--now') }, done ? 'Done' : 'Now'));
    if (done && draft.pages.length) {   // collapsed once pages are added; Change asks first because it clears them
      return S.card({ class: 's-card s-step', 'data-step': '1' }, head,
        h('div', { class: 's-summary' }, S.subject(t.subject, 'sm'),
          h('span', { style: { flex: '1' } }, h('strong', null, t.title), h('span', { class: 's-caption' }, t.subject + ' · written in ' + (draft.language === 'de' ? 'Deutsch' : 'English') + ' · ' + UI.plural(t.pages || 1, 'page'))),
          UI.button({ label: 'Change', icon: 'edit', variant: 'secondary', onClick: () => UI.dialog(close => [
            h('h2', null, 'Change the exam?'), h('p', null, 'Your ' + UI.plural(draft.pages.length, 'photo') + ' will be removed, so you can start again with the right exam.'),
            h('div', { class: 'dialog__foot' }, UI.button({ label: 'Keep my photos', variant: 'ghost', onClick: close }),
              UI.button({ label: 'Change exam', icon: 'edit', onClick: () => { draft.pages = []; clearChecks(); close(); UI.render(); } }))]) })));
    }
    return S.card({ class: 's-card s-step', 'data-step': '1' }, head, subjectTiles(v),
      h('div', { class: 's-fields' }, languageSwitch(false),
        h('div', null, h('span', { class: 's-label', id: 'exam-label' }, 'Exam'),
          h('button', { type: 'button', class: 's-select', 'aria-labelledby': 'exam-label', disabled: !draft.subject, onClick: () => examPicker(v, draft.subject) },
            h('span', null, t ? t.title + ' · ' + UI.day(t.date) : draft.subject ? 'Choose the exam' : 'Choose a subject first'), icon('chevron-down', 22)))));
  }

  /* ---------- Step 2: pages ---------- */
  function step2(ready) {
    const t = tpl(); const want = t ? (t.pages || 1) : 0; const have = draft.pages.length; const done = have > 0;
    const head = h('div', { class: 's-step__head' }, h('span', { class: 's-step__num' + (done ? ' s-step__num--done' : ready ? ' s-step__num--now' : '') }, done ? icon('check', 22) : '2'),
      h('h2', null, 'Add your pages'), h('span', { class: 's-step__state' + (ready && !done ? ' s-step__state--now' : done ? ' s-step__state--done' : '') }, done ? have + ' of ' + want : ready ? 'Now' : 'Next'));
    if (!done) {
      return S.card({ class: 's-card s-step' + (ready ? '' : ' s-step--locked'), 'data-step': '2' }, head,
        h('div', { class: 's-drop' + (ready ? ' s-drop--on' : ''),
          onDragover: e => { if (!ready) return; e.preventDefault(); e.currentTarget.classList.add('s-drop--over'); },
          onDragleave: e => e.currentTarget.classList.remove('s-drop--over'),
          onDrop: e => { e.preventDefault(); e.currentTarget.classList.remove('s-drop--over'); if (ready) addFiles(e.dataTransfer.files); } },
        h('span', { class: 's-drop__art' }, icon('camera', 44)),
        h('div', null, h('strong', null, ready ? 'Take a photo of each page (' + UI.plural(want, 'page') + ')' : 'Choose your exam first'),
          h('div', { class: 's-row', style: { flexWrap: 'wrap', gap: '12px' } },
            UI.button({ label: 'Take a photo', icon: 'camera', disabled: !ready, onClick: () => pickFiles(true) }),
            UI.button({ label: 'Choose photos', icon: 'image', variant: 'secondary', disabled: !ready, onClick: () => pickFiles(false) })),
          ready ? h('button', { type: 'button', class: 'link-btn', style: { marginTop: '10px' }, onClick: () => { draft.pages = Array.from({ length: want }, () => ({ kind: 'sample' })); clearChecks(); UI.render(); } },
            'No photos? Use ' + UI.plural(want, 'sample page') + ' (demo)') : null)));
    }
    const all = have >= want;
    return S.card({ class: 's-card s-step', 'data-step': '2' }, head,
      h('div', { class: 's-pages' },
        draft.pages.map((p, i) => h('div', { class: 's-page' },
          h('div', { class: 's-paper' }, p.kind === 'photo' ? h('img', { src: p.url, alt: 'Page ' + (i + 1) }) : null, h('span', { class: 's-paper__ok' }, icon('check', 16))),
          h('strong', null, 'Page ' + (i + 1)),
          h('div', { class: 's-page__actions' },
            UI.button({ label: 'Retake', icon: 'camera', variant: 'secondary', onClick: () => retake(i) }),
            h('button', { type: 'button', class: 's-icon-btn', 'aria-label': 'Remove page ' + (i + 1), title: 'Remove page', onClick: () => { draft.pages.splice(i, 1); clearChecks(); UI.render(); } }, icon('trash', 18))))),
        h('button', { type: 'button', class: 's-add', disabled: have >= MAX_PAGES, onClick: addPage }, icon('plus', 30), 'Add a page'),
        h('div', { class: 's-pages__note' + (all ? ' s-pages__note--done' : '') }, h('strong', null, have + ' of ' + want + ' pages'),
          h('span', { class: 's-caption' }, all ? 'All pages added. Tap Retake if a photo is blurry.' : 'Add page ' + (have + 1) + ' next.'))));
  }

  /* ---------- Step 3: checks ---------- */
  function step3(ready, done) {
    return S.card({ class: 's-card s-step' + (ready ? '' : ' s-step--locked'), 'data-step': '3' },
      h('div', { class: 's-step__head' }, h('span', { class: 's-step__num' + (done ? ' s-step__num--done' : ready ? ' s-step__num--now' : '') }, done ? icon('check', 22) : '3'),
        h('h2', null, 'Check before you send'), h('span', { class: 's-step__state' + (done ? ' s-step__state--done' : ready ? ' s-step__state--now' : '') }, done ? 'Done' : ready ? draft.checks.filter(Boolean).length + ' of 3' : 'Next')),
      h('div', { class: 's-checks' }, CHECKS.map((label, i) => h('label', { class: 's-check' + (draft.checks[i] ? ' s-check--on' : '') + (ready ? '' : ' s-check--off') },
        h('input', { type: 'checkbox', checked: draft.checks[i], disabled: !ready, onChange: e => { draft.checks[i] = e.target.checked; UI.render(); } }),
        h('span', { class: 's-check__box' }, draft.checks[i] ? icon('check', 22) : null), label))));
  }

  /* ---------- Send ---------- */
  function sendExam() {
    const pages = draft.pages.length; const templateId = draft.templateId;
    let shown = 0;
    const bar = UI.bar(0); const label = h('p', { class: 's-caption' }, 'Page 1 of ' + pages);
    const dlg = UI.dialog(() => [h('div', { class: 's-sending' }, S.pip('happy', 64),
      h('div', { style: { flex: '1' } }, h('h2', null, 'Sending your exam…'), bar, label))]);
    const tick = setInterval(() => {
      shown++; bar.firstChild.style.width = Math.round(shown / pages * 100) + '%';
      label.textContent = 'Page ' + Math.min(shown + 1, pages) + ' of ' + pages;
      if (shown >= pages) {
        clearInterval(tick);
        setTimeout(() => {
          const r = store.actions.submitExam(ME, templateId, pages);
          dlg.close();
          if (!r.ok) { UI.toast(r.reason, { tone: 'recheck' }); return; }
          resetDraft();
          S.justSent = templateId + '-' + ME;      // the tracker shows a "sent" banner once
          UI.go('#/student/exam/' + templateId + '-' + ME);
          UI.toast('Your exam was sent to ' + S.teacher() + '!');
        }, 300);
      }
    }, 450);
  }

  UI.route('student/upload', {
    role: 'student', title: 'Upload your exam',
    render() {
      const v = store.views.student(ME);
      if (draft.templateId && !v.toUpload.some(x => x.templateId === draft.templateId)) resetDraft();   // sent elsewhere or demo reset
      const page = h('main', { class: 'page' }, UI.backLink('#/student/home', 'Back to Home'),
        h('div', null, h('h1', null, 'Upload your exam'), h('p', { class: 's-sub' }, 'Three quick steps, then ' + S.teacher() + ' can check it.')));

      if (!v.toUpload.length) {
        page.appendChild(S.card({ class: 's-card s-empty' }, S.pip('happy', 72),
          h('div', { class: 's-stack', style: { gap: '12px' } }, h('h2', null, 'Nothing to upload'),
            h('p', { class: 's-sub' }, 'You have sent all your exams. You can follow them on Home.'),
            h('div', null, UI.button({ label: 'Back to Home', icon: 'home', variant: 'secondary', size: 'lg', href: '#/student/home' })))));
        return page;
      }

      const ok1 = !!(draft.subject && draft.templateId);
      const ok2 = ok1 && draft.pages.length > 0;
      const ok3 = ok2 && draft.checks.every(Boolean);
      const hint = !ok1 ? 'Choose your exam first.' : !ok2 ? 'Add your pages to continue.' : !ok3 ? 'Tick all three boxes to send.' : 'Everything is ready.';

      const sendbar = S.card({ class: 's-card s-sendbar' },
        h('div', { class: 's-sendbar__text' }, h('strong', null, ok3 ? 'Ready to send!' : 'Almost there'), h('span', { class: 's-caption', id: 'send-hint', 'aria-live': 'polite' }, hint)),
        UI.button({ label: 'Cancel', variant: 'ghost', onClick: () => { resetDraft(); UI.go('#/student/home'); } }),
        UI.button({ label: 'Send to ' + S.teacher(), icon: 'send', size: 'lg', disabled: !ok3, describedBy: 'send-hint', onClick: sendExam }));

      const tips = S.card({ class: 's-card s-card--sun s-tips', 'aria-labelledby': 'tips-title' }, h('h3', { id: 'tips-title' }, 'Tips for a clear photo'),
        TIPS.map(([ic, text]) => h('div', { class: 's-tip' }, h('span', { class: 's-tip__icon' }, icon(ic, 22)), text)));

      page.appendChild(h('div', { class: 's-upload' }, h('div', { class: 's-stack' }, step1(v, ok1), step2(ok1), step3(ok2, ok3), sendbar), tips));
      return page;
    }
  });
})();
