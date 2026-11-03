/* Grade Review · Questions tab: AI mark vs teacher mark, feedback, practice, and the Re-check banner
   (Correction Impact Flags) for marks built on corrected text. */
(function () {
  'use strict';
  const { h, icon } = UI;
  const store = window.EduTech;
  const A = store.actions;
  const T = UI.teacher;
  T.reviewTabs = T.reviewTabs || {};

  function qStatus(ex, m) {
    if (m.recheck) return 'recheck';
    if (ex.released || m.teacher !== null || m.keptReason) return 'confirmed';
    return 'ai';
  }
  const STATUS_ICON = { ai: ['sparkle', 'text-brand', 'AI suggestion'], confirmed: ['check', 'success-fg', 'Confirmed'], recheck: ['refresh', 'recheck-fg', 'Re-check'] };

  function recheckBanner(ex, q, m, max) {
    const last = ex.corrections.filter(c => c.q === q).pop();
    return h('section', { class: 'callout callout--recheck', 'aria-labelledby': 'rc-' + q }, h('span', { style: { color: 'var(--recheck-fg)' } }, icon('refresh', 24)),
      h('div', { class: 'stack-sm grow' },
        h('h3', { id: 'rc-' + q, style: { color: 'var(--recheck-fg)', fontSize: 'var(--fs-body)' } }, 'Re-check: based on corrected evidence'),
        h('p', { class: 'small' }, 'You changed the extracted text "' + last.from + '" to "' + last.to + '". The AI gave ' + m.ai + ' / ' + max + ' and its feedback using the old text. With the corrected text, the AI now suggests ' + m.suggested.mark + ' / ' + max + '.'),
        h('p', { class: 'small secondary' }, 'New AI feedback: "' + m.suggested.feedback + '"'),
        h('div', { class: 'row row--wrap' },
          UI.button({ label: 'Keep ' + T.finalMark(m) + ' / ' + max, variant: 'secondary', onClick: () => T.askReason({
            title: 'Keep ' + T.finalMark(m) + ' / ' + max + ' for Question ' + q + '?', confirm: 'Keep ' + T.finalMark(m) + ' / ' + max,
            text: 'With the corrected text the AI thinks the answer earns ' + m.suggested.mark + ' / ' + max + '. Say why you keep the old mark. It is saved in the history.',
            options: ['The answer on the paper is still not clear enough', 'The working does not show the right method'],
            onConfirm: reason => T.done(A.resolveMark(ex.id, q, 'keep', reason), 'Kept ' + T.finalMark(m) + ' / ' + max + ' for Question ' + q + '.') }) }),
          UI.button({ label: 'Change to ' + m.suggested.mark + ' / ' + max, onClick: () => T.done(A.resolveMark(ex.id, q, 'change'), 'Question ' + q + ' changed to ' + m.suggested.mark + ' / ' + max + '.') }))));
  }

  T.reviewTabs.questions = function (ex) {
    const t = store.state.templates[ex.templateId];
    const firstRecheck = Object.entries(ex.marks).find(([, m]) => m.recheck);
    let sel = T.selected[ex.id] || (firstRecheck ? Number(firstRecheck[0]) : (t.questions.find(qi => ex.marks[qi.q].ai < qi.max) || t.questions[0]).q);
    if (!ex.marks[sel]) sel = t.questions[0].q;
    T.selected[ex.id] = sel;
    const qi = t.questions.find(x => x.q === sel); const m = ex.marks[sel]; const a = ex.answers.find(x => x.q === sel);
    const editable = T.editable(ex); const status = qStatus(ex, m);

    /* Question list */
    const list = UI.card({ class: 'card qlist' }, h('h2', { class: 'small secondary', style: { fontWeight: 600 } }, 'Questions'),
      h('ul', { class: 'qlist__items' }, t.questions.map(x => {
        const mm = ex.marks[x.q]; const st = qStatus(ex, mm); const [ic, col, label] = STATUS_ICON[st];
        return h('li', null, h('button', { type: 'button', class: 'qlist__item' + (x.q === sel ? ' is-selected' : '') + (st === 'recheck' ? ' is-recheck' : ''), 'aria-current': x.q === sel ? 'true' : null,
          onClick: () => { T.selected[ex.id] = x.q; UI.render(); } },
          h('strong', null, 'Q' + x.q), h('span', { class: 'grow secondary' }, T.finalMark(mm) + ' / ' + x.max),
          h('span', { style: { color: 'var(--' + col + ')' }, title: label }, icon(ic, 18)), h('span', { class: 'sr-only' }, label)));
      })),
      h('div', { class: 'qlist__legend' }, Object.values(STATUS_ICON).map(([ic, col, label]) => h('span', { class: 'row caption' }, h('span', { style: { color: 'var(--' + col + ')' } }, icon(ic, 14)), label))));

    /* Selected question */
    const chip = status === 'recheck' ? UI.chip('Re-check needed') : status === 'confirmed' ? UI.chip('Teacher confirmed') : UI.chip('AI suggestion');
    const markInput = h('input', { class: 'input mark-input', type: 'number', min: '0', max: String(qi.max), step: '1', value: String(T.finalMark(m)), disabled: !editable || m.recheck,
      'aria-label': 'Teacher mark for question ' + sel + ', out of ' + qi.max,
      onChange: e => { const r = A.setTeacherMark(ex.id, sel, e.target.value); if (!r.ok) { UI.toast(r.reason, { tone: 'recheck' }); e.target.value = T.finalMark(m); } else if (!r.unchanged) UI.toast('Mark for Question ' + sel + ' set to ' + e.target.value + ' / ' + qi.max + '.', { action: { label: 'Undo', onClick: () => A.undo() } }); } });
    const fb = h('textarea', { class: 'textarea', rows: '3', disabled: !editable, 'aria-label': 'Feedback for question ' + sel,
      onChange: e => T.done(A.setFeedback(ex.id, sel, e.target.value), 'Feedback for Question ' + sel + ' saved.') }, m.feedback || m.aiFeedback);
    const lastCorr = ex.corrections.filter(c => c.q === sel && c.phase !== 'first check').pop();

    const center = UI.card({ class: 'card' },
      h('div', { class: 'card__head' }, h('h2', { style: { fontSize: 'var(--fs-h3)' } }, 'Question ' + sel), chip),
      h('p', { class: 'secondary' }, qi.label),
      T.paper(ex, { only: [sel], marks: status === 'recheck' || lastCorr ? { [sel]: 'recheck' } : {} }),
      h('div', { class: 'extracted' }, h('span', { class: 'small secondary', style: { fontWeight: 600 } }, 'Extracted'), h('strong', { class: 'grow' }, a.text,
        lastCorr ? h('span', { class: 'small', style: { color: 'var(--recheck-fg)', fontWeight: 500 } }, ' (corrected from ' + lastCorr.from + ')') : null),
        ex.stage !== 'recheck' || !m.recheck ? h('button', { type: 'button', class: 'link-btn row', onClick: () => T.editText(ex, sel) }, icon('edit', 16), 'Edit extracted text') : null),
      ex.stage === 'released' && !lastCorr ? h('p', { class: 'small secondary row' }, icon('eye', 16), 'Compare the scan with the extracted answer. Spot a misread? Click Edit extracted text.') : null,
      m.recheck ? recheckBanner(ex, sel, m, qi.max) : null,
      m.keptReason ? h('div', { class: 'callout callout--info', style: { padding: '10px 14px' } }, h('span', { style: { color: 'var(--success-fg)' } }, icon('check-circle', 20)), h('span', { class: 'small' }, 'You kept this mark. Reason: ' + m.keptReason + '.')) : null,
      h('table', { class: 'table table--marks' },
        h('thead', null, h('tr', null, h('th', null, 'Strand'), h('th', null, 'AI mark'), h('th', null, 'Teacher mark'))),
        h('tbody', null, h('tr', null, h('td', null, qi.topic), h('td', null, m.ai + ' / ' + qi.max), h('td', null, h('div', { class: 'row' }, markInput, h('span', { class: 'secondary' }, '/ ' + qi.max)))))),
      h('div', { class: 'row row--wrap' }, h('span', { class: 'small secondary', style: { fontWeight: 600 } }, 'Mistake type'),
        m.mistake ? UI.pill(m.mistake, 'brand', 'check') : h('span', { class: 'small muted' }, T.finalMark(m) === qi.max ? 'None, the answer is correct' : 'None found')),
      h('label', { class: 'field' }, h('span', { class: 'field__label row' }, 'Feedback for ' + T.firstName(ex.studentId), m.feedback ? UI.chip('Teacher confirmed') : UI.chip('AI suggestion')), fb,
        h('span', { class: 'field__help' }, editable ? 'You can edit this text. ' + T.firstName(ex.studentId) + ' sees it only after you release.' : 'Released. To change it, correct the text or reopen with a correction.')));

    /* Right column: overall feedback and practice */
    const overall = h('textarea', { class: 'textarea', rows: '7', disabled: !editable, 'aria-label': 'Overall feedback',
      onChange: e => T.done(A.setOverallFeedback(ex.id, e.target.value), 'Overall feedback saved.') }, ex.overallFeedback);
    const right = h('div', { class: 'stack' },
      UI.card(null, h('h2', { style: { fontSize: 'var(--fs-h3)' } }, 'Overall feedback'), overall),
      t.practice ? UI.card(null, h('h2', { style: { fontSize: 'var(--fs-h3)' } }, 'Practice suggestion'),
        h('div', { class: 'row', style: { background: 'var(--bg-subtle)', padding: '10px', borderRadius: 'var(--r-md)' } }, h('span', { style: { color: 'var(--text-brand)' } }, icon('book', 20)),
          h('div', null, h('strong', { class: 'small' }, t.practice.title), h('div', { class: 'small secondary' }, t.practice.size))),
        h('label', { class: 'checkbox' + (editable ? '' : ' checkbox--disabled') }, h('input', { type: 'checkbox', checked: ex.practiceApproved, disabled: !editable,
          onChange: e => T.done(A.approvePractice(ex.id, e.target.checked), e.target.checked ? 'Practice approved for ' + T.firstName(ex.studentId) + '.' : 'Practice removed.') }), 'Approve for ' + T.firstName(ex.studentId))) : null);

    return h('div', { class: 'review-grid' }, list, center, right);
  };
})();
