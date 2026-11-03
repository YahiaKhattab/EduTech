/* Verify Extracted Text: the teacher checks what the OCR read before anything is graded
   (wireframe screen 7, features T1 and X2). Confirm is locked until every doubtful word is checked (rule R2). */
(function () {
  'use strict';
  const { h, icon } = UI;
  const store = window.EduTech;
  const A = store.actions;
  const editing = {};          // examId -> { q, value, doubt } when a word is being typed

  const GERMAN_KEYS = ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'];

  function insertAt(input, ch) {
    const s = input.selectionStart ?? input.value.length, e = input.selectionEnd ?? input.value.length;
    input.value = input.value.slice(0, s) + ch + input.value.slice(e);
    input.focus(); input.setSelectionRange(s + 1, s + 1); input.dispatchEvent(new Event('input'));
  }

  /* Inline editor for one answer, with ä ö ü ß keys for German exams. */
  function editor(ex, german) {
    const ed = editing[ex.id];
    const save = () => {
      const r = A.resolveWord(ex.id, ed.q, ed.value);
      if (!r.ok) { UI.toast(r.reason, { tone: 'recheck' }); return; }
      delete editing[ex.id]; UI.toast('Question ' + ed.q + ' saved as "' + ed.value.trim() + '".');
    };
    const input = h('input', { class: 'input', value: ed.value, 'aria-label': 'Correct text for question ' + ed.q, lang: german ? 'de' : 'en',
      onInput: e => { ed.value = e.target.value; }, onKeydown: e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { delete editing[ex.id]; UI.render(); } } });
    setTimeout(() => { if (document.activeElement !== input && input.isConnected && !input.dataset.focused) { input.dataset.focused = '1'; input.focus(); input.select(); } }, 0);
    return h('div', { class: 'editor' },
      h('div', { class: 'row row--wrap' }, input, UI.button({ label: 'Save', icon: 'check', onClick: save }), UI.button({ label: 'Cancel', variant: 'ghost', onClick: () => { delete editing[ex.id]; UI.render(); } })),
      german ? h('div', { class: 'row row--wrap', role: 'group', 'aria-label': 'German characters' }, h('span', { class: 'small secondary' }, 'Insert:'),
        GERMAN_KEYS.map(k => h('button', { type: 'button', class: 'key', onMousedown: e => e.preventDefault(), onClick: () => insertAt(input, k) }, k))) : null);
  }

  UI.route('teacher/verify', {
    role: 'teacher', title: 'Verify extracted text',
    render(examId) {
      const ex = store.views.exam(examId);
      const page = h('main', { class: 'page' }, UI.backLink('#/teacher/home', 'Back to Home'));
      if (!ex) { page.appendChild(UI.card(null, h('h2', null, 'Exam not found'), h('p', { class: 'secondary' }, 'It may have been removed when the demo was reset.'))); return page; }
      const t = store.state.templates[ex.templateId]; const german = t.language === 'de';
      const student = UI.teacher.studentName(ex.studentId);

      page.appendChild(h('div', { class: 'page__head' }, h('div', null, h('h1', null, 'Verify extracted text'),
        h('p', { class: 'secondary' }, student + ' · ' + t.subject + ' · ' + t.title + ' · Written in ' + (german ? 'German' : 'English') + ' · ' + UI.plural(ex.pages, 'page'))),
        german ? UI.pill('Deutsch · ä ö ü ß check on', 'info', 'info') : null));
      page.appendChild(UI.teacher.workflow(1));

      if (ex.stage === 'sent') { page.appendChild(UI.card(null, h('div', { class: 'empty' }, UI.badge('clock', { size: 'lg' }), h('h2', null, 'Still reading the text…'), h('p', { class: 'secondary' }, 'Come back in a moment.')))); return page; }
      if (ex.stage !== 'read') {
        page.appendChild(UI.card(null, h('div', { class: 'empty' }, UI.badge('check-circle', { size: 'lg', bg: 'success-bg', fg: 'success-fg' }), h('h2', null, 'Text already verified'),
          h('p', { class: 'secondary' }, 'To fix a misread now, open the exam and use "Edit extracted text". Results built on it will be marked Re-check.'),
          UI.button({ label: 'Open grade review', icon: 'arrow-right', href: '#/teacher/review/' + ex.id }))));
        return page;
      }

      const doubts = ex.answers.filter(a => a.doubt);
      const firstOpen = doubts.find(a => !a.resolved);
      const marks = {}; const numbers = {};
      doubts.forEach((a, i) => { numbers[a.q] = i + 1; marks[a.q] = a.resolved ? 'resolved' : a === firstOpen ? 'focus' : 'doubtful'; });
      const done = doubts.filter(a => a.resolved).length;
      const ed = editing[ex.id];

      const scan = UI.card({ class: 'card scan-card' }, h('div', { class: 'card__head' }, h('h2', { style: { fontSize: 'var(--fs-h3)' } }, 'Scanned page'), h('span', { class: 'small secondary' }, 'Page 1 of ' + ex.pages)),
        UI.teacher.paper(ex, { marks, numbers }),
        h('div', { class: 'legend' }, h('span', null, h('i', { class: 'lg-doubt' }), 'Not sure'), h('span', null, h('i', { class: 'lg-focus' }), 'Selected'), h('span', null, h('i', { class: 'lg-done' }), 'Checked')));

      const extracted = UI.card(null, h('div', { class: 'card__head' }, h('h2', { style: { fontSize: 'var(--fs-h3)' } }, 'Extracted text'), UI.pill('AI has not graded yet', 'brand', 'info')),
        h('div', { class: 'stack-sm' }, ex.answers.map(a => {
          const n = numbers[a.q]; const state = marks[a.q];
          if (ed && ed.q === a.q && !ed.doubt) return h('div', { class: 'answer' }, h('span', { class: 'answer__q' }, 'Q' + a.q), editor(ex, german));
          return h('div', { class: 'answer' }, h('span', { class: 'answer__q' }, 'Q' + a.q),
            n ? h('span', { class: 'word word--' + state }, h('span', { class: 'word__tag' }, a.resolved ? icon('check', 12) : String(n)), a.text)
              : h('span', { class: 'answer__text' }, a.text),
            h('button', { type: 'button', class: 'icon-link', 'aria-label': 'Edit question ' + a.q, title: 'Edit', onClick: () => { editing[ex.id] = { q: a.q, value: a.text, doubt: false }; UI.render(); } }, icon('edit', 18)));
        })),
        h('div', { class: 'callout callout--info', style: { padding: '10px 14px' } }, icon('edit', 18), h('span', { class: 'small secondary' }, 'Click the pencil to correct any word, even if it is not highlighted.')));

      const checks = UI.card(null, h('div', { class: 'card__head' }, h('h2', { style: { fontSize: 'var(--fs-h3)' } }, 'Words to check'),
        h('span', { class: 'small', style: { fontWeight: 600, color: done === doubts.length ? 'var(--success-fg)' : 'var(--text-secondary)' } }, done + ' of ' + doubts.length + ' checked')),
        doubts.map((a, i) => {
          const cur = a === firstOpen; const typing = ed && ed.q === a.q && ed.doubt;
          return h('div', { class: 'check-item' + (cur ? ' check-item--current' : '') },
            h('div', { class: 'row row--wrap' },
              h('span', { class: 'word__tag word__tag--lg' + (a.resolved ? ' is-done' : cur ? ' is-current' : '') }, a.resolved ? icon('check', 14) : String(i + 1)),
              h('div', { class: 'grow' }, h('strong', null, 'Question ' + a.q), h('div', { class: 'small secondary' }, a.resolved ? 'Checked: "' + a.text + '"' : 'Not sure: ' + a.doubt.why))),
            h('div', { class: 'row row--wrap check-item__opts' }, a.doubt.options.map(opt => UI.button({ label: opt, icon: a.resolved && a.text === opt ? 'check' : null, variant: a.resolved && a.text === opt ? 'primary' : 'secondary',
                onClick: () => { const r = A.resolveWord(ex.id, a.q, opt); if (!r.ok) UI.toast(r.reason, { tone: 'recheck' }); } })),
                UI.button({ label: 'Other…', variant: 'ghost', onClick: () => { editing[ex.id] = { q: a.q, value: a.text.replace(/\?/g, ''), doubt: true }; UI.render(); } })),
            typing ? editor(ex, german) : null);
        }));

      const left = doubts.length - done;
      const foot = h('div', { class: 'upload-foot' },
        UI.button({ label: 'Back', variant: 'ghost', href: '#/teacher/home' }),
        h('p', { class: 'grow secondary small', id: 'confirm-hint' }, left ? 'Check all ' + UI.plural(left, 'highlighted word') + ' to continue.' : 'All words checked.'),
        UI.button({ label: 'Confirm text and continue', icon: 'arrow-right', disabled: !!left, describedBy: 'confirm-hint', onClick: () => confirm(ex) }));

      page.appendChild(h('div', { class: 'verify-grid' }, scan, h('div', { class: 'stack' }, extracted, checks, foot)));
      return page;
    }
  });

  /* Confirm the text, show the AI grading for a moment, then open the review. */
  function confirm(ex) {
    const r = A.confirmText(ex.id); if (!r.ok) { UI.toast(r.reason, { tone: 'recheck' }); return; }
    const tasks = ['Marking each answer', 'Looking for recurring mistakes', 'Writing feedback drafts'];
    const items = tasks.map(t => h('li', { class: 'row' }, h('span', { class: 'task-icon' }, icon('clock', 20)), t));
    const dlg = UI.dialog(() => [h('div', { class: 'sending' }, UI.badge('sparkle', { size: 'lg', bg: 'brand-subtle', fg: 'text-brand' }),
      h('h2', null, 'The AI is grading ' + UI.teacher.firstName(ex.studentId) + "'s exam…"),
      h('p', { class: 'secondary' }, 'It uses the text you just confirmed. Everything it suggests stays a suggestion until you confirm it.'),
      h('ul', { class: 'stack-sm', style: { listStyle: 'none', padding: 0, margin: 0, textAlign: 'left' } }, items))]);
    items.forEach((li, i) => setTimeout(() => { const s = li.querySelector('.task-icon'); UI.clear(s); s.appendChild(icon('check-circle', 20)); s.style.color = 'var(--success-fg)'; }, 500 * (i + 1)));
    setTimeout(() => { dlg.close(); UI.go('#/teacher/review/' + ex.id); UI.toast('AI grading done. Review the suggestions.', { tone: 'info' }); }, 1900);
  }
})();
