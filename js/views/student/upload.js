/* Upload Exam: 3 steps (about the exam, add pages, check) then send (wireframe screen 2, features S1 and S7). */
(function () {
  'use strict';
  const { h, icon } = UI;
  const store = window.EduTech;
  const ME = 'omar';
  const CHECKS = ['All pages are included', 'The photos are clear, not blurry', 'My name is written on the paper'];

  /* The form keeps its own state between re-renders until the exam is sent. */
  const draft = { subject: '', templateId: '', language: 'en', pages: [], checks: [false, false, false] };
  const resetDraft = () => Object.assign(draft, { subject: '', templateId: '', language: 'en', pages: [], checks: [false, false, false] });
  let fileInput = null; let replaceIndex = null;

  function addFiles(files) {
    const imgs = [...files].filter(f => f.type.startsWith('image/'));
    if (!imgs.length) { UI.toast('Please choose photos (JPG or PNG).', { tone: 'recheck' }); return; }
    imgs.forEach(f => {
      const page = { kind: 'photo', url: URL.createObjectURL(f), name: f.name };
      if (replaceIndex !== null) { draft.pages[replaceIndex] = page; replaceIndex = null; } else draft.pages.push(page);
    });
    draft.checks = [false, false, false];          // new pages: tick the checks again
    UI.render();
  }
  function pickFiles(capture, index) {
    replaceIndex = (index === undefined) ? null : index;
    fileInput = fileInput || h('input', { type: 'file', accept: 'image/*', multiple: true, class: 'sr-only', tabindex: '-1', onChange: e => { addFiles(e.target.files); e.target.value = ''; } });
    if (!fileInput.isConnected) document.body.appendChild(fileInput);
    if (capture) fileInput.setAttribute('capture', 'environment'); else fileInput.removeAttribute('capture');
    fileInput.multiple = index === undefined;
    fileInput.click();
  }

  function stepHead(n, title, done) {
    return h('div', { class: 'step-head' }, h('span', { class: 'step-num' + (done ? ' step-num--done' : '') }, done ? icon('check', 20) : String(n)),
      h('h2', null, title), done ? h('span', { class: 'sr-only' }, '(done)') : null);
  }

  function sendExam() {
    const pages = draft.pages.length; const templateId = draft.templateId;
    let shown = 0;
    const bar = UI.bar(0); const label = h('p', { class: 'secondary' }, 'Page 1 of ' + pages);
    const dlg = UI.dialog(() => [h('div', { class: 'sending' }, UI.badge('send', { size: 'lg', bg: 'brand-subtle', fg: 'text-brand' }), h('h2', null, 'Sending your exam…'), bar, label)]);
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
          UI.go('#/student/exam/' + templateId + '-' + ME);
          UI.toast('Your exam was sent to ' + store.state.users.sherin.name + '!');
        }, 300);
      }
    }, 450);
  }

  UI.route('student/upload', {
    role: 'student', title: 'Upload your exam',
    render() {
      const v = store.views.student(ME);
      const page = h('main', { class: 'page' }, UI.backLink('#/student/home', 'Back to Home'),
        h('div', null, h('h1', null, 'Upload your exam'), h('p', { class: 'body-l secondary' }, 'Three quick steps, then ' + store.state.users.sherin.name + ' can check it.')));

      if (!v.toUpload.length) {
        page.appendChild(UI.card(null, h('div', { class: 'empty' }, UI.badge('check-circle', { size: 'lg', bg: 'success-bg', fg: 'success-fg' }),
          h('h2', null, 'Nothing to upload'), h('p', { class: 'body-l secondary' }, 'You have already sent all your exams. Your teacher will check them soon.'),
          UI.button({ label: 'Back to Home', icon: 'home', variant: 'secondary', size: 'lg', href: '#/student/home' }))));
        return page;
      }

      const subjects = [...new Set(v.toUpload.map(x => x.subject))];
      const exams = v.toUpload.filter(x => x.subject === draft.subject);
      const step1 = !!(draft.subject && draft.templateId);
      const step2 = draft.pages.length > 0;
      const allChecked = draft.checks.every(Boolean);
      const canSend = step1 && step2 && allChecked;

      /* Step 1 */
      const subjectSel = h('select', { class: 'select', id: 'subject', onChange: e => {
        draft.subject = e.target.value; const only = v.toUpload.filter(x => x.subject === draft.subject);
        draft.templateId = only.length === 1 ? only[0].templateId : '';
        const t = draft.templateId && store.state.templates[draft.templateId]; if (t) draft.language = t.language; UI.render();
      } }, h('option', { value: '' }, 'Choose a subject'), subjects.map(s => h('option', { value: s, selected: s === draft.subject }, s)));
      const langSel = h('select', { class: 'select', id: 'language', 'aria-describedby': 'language-help', onChange: e => { draft.language = e.target.value; } },
        h('option', { value: 'en', selected: draft.language === 'en' }, 'English'), h('option', { value: 'de', selected: draft.language === 'de' }, 'Deutsch'));
      const examSel = h('select', { class: 'select', id: 'exam', disabled: !draft.subject, onChange: e => { draft.templateId = e.target.value; UI.render(); } },
        h('option', { value: '' }, draft.subject ? 'Choose the exam' : 'Choose a subject first'),
        exams.map(x => h('option', { value: x.templateId, selected: x.templateId === draft.templateId }, x.title + ' · ' + UI.day(x.date))));

      const card1 = UI.card(null, stepHead(1, 'About your exam', step1),
        h('div', { class: 'form-row' },
          h('div', { class: 'field' }, h('label', { class: 'field__label', for: 'subject' }, 'Subject'), subjectSel),
          h('div', { class: 'field' }, h('label', { class: 'field__label', for: 'language' }, 'Exam language'), langSel,
            h('span', { class: 'field__help', id: 'language-help' }, 'Choose Deutsch if your exam is written in German.'))),
        h('div', { class: 'field' }, h('label', { class: 'field__label', for: 'exam' }, 'Which exam?'), examSel));

      /* Step 2 */
      let pagesArea;
      if (!step2) {
        pagesArea = h('div', { class: 'dropzone' + (step1 ? '' : ' dropzone--off'),
          onDragover: e => { if (!step1) return; e.preventDefault(); e.currentTarget.classList.add('dropzone--over'); },
          onDragleave: e => e.currentTarget.classList.remove('dropzone--over'),
          onDrop: e => { e.preventDefault(); e.currentTarget.classList.remove('dropzone--over'); if (step1) addFiles(e.dataTransfer.files); } },
          h('span', { style: { color: 'var(--text-brand)' } }, icon('image', 40)),
          h('p', { class: 'body-l' }, 'Take a photo of each page, or drag your photos here'),
          h('div', { class: 'row row--wrap', style: { justifyContent: 'center' } },
            UI.button({ label: 'Take a photo', icon: 'camera', size: 'lg', disabled: !step1, onClick: () => pickFiles(true) }),
            UI.button({ label: 'Choose files', icon: 'image', variant: 'secondary', size: 'lg', disabled: !step1, onClick: () => pickFiles(false) })),
          step1 ? h('button', { type: 'button', class: 'link-btn', onClick: () => { draft.pages = [{ kind: 'sample' }, { kind: 'sample' }, { kind: 'sample' }]; UI.render(); } }, 'No photos? Use 3 sample pages (demo)')
            : h('p', { class: 'secondary' }, 'Fill in step 1 first.'));
      } else {
        pagesArea = h('div', { class: 'stack-sm' },
          h('div', { class: 'pages' },
            draft.pages.map((p, i) => h('div', { class: 'page-thumb' },
              h('div', { class: 'paper' + (p.kind === 'sample' ? ' paper--sample' : '') }, p.kind === 'photo' ? h('img', { src: p.url, alt: 'Page ' + (i + 1) }) : null),
              h('strong', { class: 'small' }, 'Page ' + (i + 1)),
              h('div', { class: 'page-thumb__actions' },
                h('button', { type: 'button', 'aria-label': 'Retake page ' + (i + 1), onClick: () => p.kind === 'sample' ? UI.toast('Page ' + (i + 1) + ' retaken.', { tone: 'info' }) : pickFiles(true, i) }, icon('camera', 16), 'Retake'),
                h('button', { type: 'button', 'aria-label': 'Remove page ' + (i + 1), onClick: () => { draft.pages.splice(i, 1); draft.checks = [false, false, false]; UI.render(); } }, icon('trash', 16), h('span', { class: 'sr-only' }, 'Remove'))))),
            h('button', { type: 'button', class: 'add-tile', onClick: () => pickFiles(false) }, icon('plus', 28), 'Add a page')),
          h('p', { class: 'secondary' }, UI.plural(draft.pages.length, 'page') + ' added. Tap Retake if a photo is blurry.'));
      }
      const card2 = UI.card(null, stepHead(2, 'Add your pages', step2), pagesArea);

      /* Step 3 */
      const card3 = UI.card(null, stepHead(3, 'Check before you send', allChecked && step2),
        h('div', { class: 'stack-sm' }, CHECKS.map((label, i) => h('label', { class: 'checkbox' + (step2 ? '' : ' checkbox--disabled') },
          h('input', { type: 'checkbox', checked: draft.checks[i], disabled: !step2, onChange: e => { draft.checks[i] = e.target.checked; UI.render(); } }), label))));

      const hint = !step1 ? 'Fill in step 1 first.' : !step2 ? 'Add your pages to continue.' : !allChecked ? 'Tick all three boxes to send your exam.' : '';
      const foot = h('div', { class: 'upload-foot' },
        UI.button({ label: 'Cancel', variant: 'ghost', size: 'lg', onClick: () => { resetDraft(); UI.go('#/student/home'); } }),
        h('p', { class: 'grow secondary', id: 'send-hint', 'aria-live': 'polite' }, hint),
        UI.button({ label: 'Send to my teacher', icon: 'send', size: 'lg', disabled: !canSend, describedBy: 'send-hint', onClick: sendExam }));

      const tips = UI.card(null, h('div', { class: 'card__head' }, h('span', { style: { color: 'var(--text-brand)' } }, icon('info')), h('h3', null, 'Tips for a clear photo')),
        h('ul', { class: 'stack-sm', style: { listStyle: 'none', padding: 0, margin: 0 } },
          ['Put the paper flat on a table.', 'Use a bright room with no shadows.', 'Fit the whole page in the photo.', 'Take one photo for each page.']
            .map(t => h('li', { class: 'row', style: { alignItems: 'flex-start' } }, h('span', { style: { color: 'var(--success-fg)' } }, icon('check', 20)), t))));

      page.appendChild(h('div', { class: 'cols' }, h('div', { class: 'stack' }, card1, card2, card3, foot), tips));
      return page;
    }
  });
})();
