/* Grade Review: header, tabs and the release / notify bar (wireframe screen 8, features T2, T3, T4, X1).
   The three tabs live in review-questions.js, review-gaps.js and review-history.js. */
(function () {
  'use strict';
  const { h, icon } = UI;
  const store = window.EduTech;
  const A = store.actions;
  const T = UI.teacher;
  T.reviewTabs = T.reviewTabs || {};
  T.selected = T.selected || {};          // examId -> selected question number

  const finalMark = m => (m.teacher !== null && m.teacher !== undefined) ? m.teacher : m.ai;
  T.finalMark = finalMark;
  T.total = ex => Object.values(ex.marks).reduce((s, m) => s + finalMark(m), 0);
  T.editable = ex => ex.stage === 'graded' || ex.stage === 'recheck';

  /* Show the result of an action: a toast, with Undo when it worked. */
  T.done = function (r, message, undoable) {
    if (!r.ok) { UI.toast(r.reason, { tone: 'recheck' }); return false; }
    if (message) UI.toast(message, undoable === false ? {} : { action: { label: 'Undo', onClick: () => A.undo() } });
    return true;
  };

  /* Ask for a reason (dismissing a flag, keeping an old mark, removing a weakness: rule R6). */
  T.askReason = function (o) {
    let chosen = o.options[0]; let other = '';
    const otherInput = h('input', { class: 'input', placeholder: 'Type the reason', 'aria-label': 'Other reason', onInput: e => { other = e.target.value; } });
    UI.dialog(close => [h('h2', null, o.title), h('p', { class: 'secondary' }, o.text),
      h('fieldset', { class: 'stack-sm', style: { border: 0, padding: 0, margin: 0 } }, h('legend', { class: 'sr-only' }, 'Reason'),
        o.options.concat(['Other reason']).map((label, i) => h('label', { class: 'checkbox' },
          h('input', { type: 'radio', name: 'reason', checked: i === 0, onChange: () => { chosen = label; } }), label))),
      otherInput,
      o.note ? h('p', { class: 'small secondary' }, o.note) : null,
      h('div', { class: 'dialog__foot' }, UI.button({ label: 'Cancel', variant: 'ghost', onClick: close }),
        UI.button({ label: o.confirm, variant: o.danger ? 'danger' : 'primary', onClick: () => {
          const reason = chosen === 'Other reason' ? other.trim() : chosen;
          if (!reason) { otherInput.focus(); UI.toast('Type the reason first.', { tone: 'recheck' }); return; }
          close(); o.onConfirm(reason);
        } }))]);
  };

  /* Edit extracted text after grading: the start of Correction Impact Flags. */
  T.editText = function (ex, q) {
    const a = ex.answers.find(x => x.q === q); const german = store.state.templates[ex.templateId].language === 'de';
    const builtOn = ['Question ' + q + ' mark · ' + (ex.marks[q].ai) + ' / ' + store.state.templates[ex.templateId].questions.find(x => x.q === q).max]
      .concat(ex.gaps.filter(g => g.status !== 'dismissed' && g.basedOn.includes(q)).map(g => (g.kind === 'redflag' ? 'Red flag · ' : g.kind === 'weakness' ? 'Weakness · ' : 'Recurring mistake · ') + g.label));
    const input = h('input', { class: 'input', value: a.text, lang: german ? 'de' : 'en', 'aria-label': 'Corrected text' });
    UI.dialog(close => [h('h2', null, 'Correct the extracted text · Question ' + q),
      ex.stage === 'released' ? h('div', { class: 'callout callout--recheck', style: { padding: '12px 16px' } }, icon('refresh', 20),
        h('span', { class: 'small' }, T.firstName(ex.studentId) + ' already saw these results. Everything built on this text will be marked Re-check, and the student sees "second look" until you finish.')) : null,
      T.paper(ex, { only: [q] }),
      h('div', { class: 'field' }, h('span', { class: 'field__label' }, 'The computer read'), h('p', { class: 'body-l', style: { color: 'var(--danger-fg)' } }, a.text)),
      h('label', { class: 'field' }, h('span', { class: 'field__label' }, 'Change it to'), input),
      h('div', null, h('p', { class: 'field__label' }, 'Results built on this text'), h('ul', { class: 'stack-sm', style: { margin: '6px 0 0', paddingLeft: '20px' } }, builtOn.map(b => h('li', null, b)))),
      h('div', { class: 'dialog__foot' }, UI.button({ label: 'Cancel', variant: 'ghost', onClick: close }),
        UI.button({ label: 'Save correction', icon: 'check', onClick: () => {
          const r = A.correctText(ex.id, q, input.value);
          if (!r.ok) { UI.toast(r.reason, { tone: 'recheck' }); return; }
          close(); T.impact(ex.id, q, a.text, input.value.trim(), r.affected);
        } }))]);
    setTimeout(() => { input.focus(); input.select(); }, 0);
  };

  /* "Your correction affects N results" */
  T.impact = function (examId, q, from, to, affected) {
    UI.dialog(close => [h('div', { class: 'row' }, UI.badge('refresh', { bg: 'recheck-bg', fg: 'recheck-fg' }), h('h2', null, 'Your correction affects ' + UI.plural(affected.length, 'result'))),
      h('p', { class: 'secondary' }, 'Question ' + q + ': "' + from + '" is now "' + to + '". These were built on the old text, so they are marked Re-check:'),
      h('ul', { class: 'stack-sm', style: { listStyle: 'none', padding: 0, margin: 0 } }, affected.map(a => h('li', { class: 'list-row', style: { borderColor: 'var(--recheck-border)' } },
        UI.badge(a.startsWith('Question') ? 'file' : a === 'Red flag' ? 'flag' : 'target', { size: 'sm', iconSize: 18, bg: 'recheck-bg', fg: 'recheck-fg' }), h('strong', { class: 'grow' }, a), UI.chip('Re-check needed')))),
      h('div', { class: 'dialog__foot' }, UI.button({ label: 'Undo correction', variant: 'ghost', onClick: () => { A.undo(); close(); UI.toast('Correction undone.', { tone: 'info' }); } }),
        UI.button({ label: 'Re-check now', icon: 'arrow-right', onClick: () => { close(); T.selected[examId] = q; UI.go('#/teacher/review/' + examId + '/questions'); } }))]);
  };

  function releaseDialog(ex) {
    const t = store.state.templates[ex.templateId]; const total = T.total(ex);
    const conf = ex.gaps.filter(g => g.status === 'confirmed');
    const items = [['file', 'Grade: ' + total + ' / ' + t.max + ' (' + UI.pct(total, t.max) + '%)'], ['message', 'Your feedback on ' + t.questions.length + ' questions']]
      .concat(conf.filter(g => g.kind === 'weakness').map(g => ['target', 'Weakness: ' + g.label]))
      .concat(conf.filter(g => g.kind === 'redflag').map(g => ['flag', g.childLabel + ' (your confirmed red flag)']))
      .concat(ex.practiceApproved ? [['book', 'Practice: ' + t.practice.title]] : []);
    const first = T.firstName(ex.studentId);
    UI.dialog(close => [h('h2', null, 'Release results to ' + first + '?'), h('p', { class: 'secondary' }, first + ' will be notified and will see:'),
      h('ul', { class: 'stack-sm', style: { listStyle: 'none', padding: 0, margin: 0 } }, items.map(([ic, l]) => h('li', { class: 'row' }, h('span', { style: { color: 'var(--text-brand)' } }, icon(ic, 20)), l))),
      h('div', { class: 'callout callout--info', style: { padding: '10px 14px' } }, icon('info', 18), h('span', { class: 'small secondary' }, 'You can still correct anything later. If a released grade changes, ' + first + ' sees a short note that you approve first.')),
      h('div', { class: 'dialog__foot' }, UI.button({ label: 'Cancel', variant: 'ghost', onClick: close }),
        UI.button({ label: 'Release results', icon: 'send', onClick: () => { const r = A.release(ex.id); close(); if (T.done(r, 'Results released to ' + first + '.', false)) UI.go('#/teacher/home'); } }))]);
  }

  function noteDialog(ex) {
    const draft = A.draftNote(ex.id); const before = ex.released; const total = T.total(ex); const max = before.max;
    const changed = before.questions.filter(bq => finalMark(ex.marks[bq.q]) !== bq.mark);
    const ta = h('textarea', { class: 'textarea', rows: '4', 'aria-label': 'Note to ' + T.firstName(ex.studentId) }, draft);
    UI.dialog(close => [h('h2', null, 'Grade changed after release'),
      h('div', { class: 'row row--wrap' }, changed.map(bq => h('div', { class: 'stat' }, h('span', { class: 'small secondary' }, 'Question ' + bq.q), h('strong', null, bq.mark + ' → ' + finalMark(ex.marks[bq.q]) + ' points'))),
        h('div', { class: 'stat' }, h('span', { class: 'small secondary' }, 'Total'), h('strong', null, before.score + ' → ' + total + ' (' + before.pct + '% → ' + UI.pct(total, max) + '%)'))),
      h('div', { class: 'row' }, h('span', { class: 'field__label' }, 'Note to ' + T.firstName(ex.studentId)), UI.chip('AI suggestion')), ta,
      h('p', { class: 'small muted' }, 'Written in simple words for a Grade 4 student. You can edit it. The parent is told too.'),
      h('div', { class: 'dialog__foot' }, UI.button({ label: 'Cancel', variant: 'ghost', onClick: close }),
        UI.button({ label: 'Approve and send', icon: 'send', onClick: () => { const r = A.approveNote(ex.id, ta.value); close(); if (T.done(r, 'Note sent to ' + T.firstName(ex.studentId) + '. The results now show what changed.', false)) UI.go('#/teacher/home'); } }))]);
  }

  function bottomBar(ex) {
    const t = store.state.templates[ex.templateId]; const total = T.total(ex); const open = store.views.openRechecks(ex.id);
    const bar = h('div', { class: 'total-bar' },
      h('div', { class: 'grow' }, h('span', { class: 'small secondary', style: { fontWeight: 600 } }, 'Total and final mark'),
        h('div', { class: 'row' }, h('strong', { style: { fontSize: 'var(--fs-h2)' } }, total + ' / ' + t.max), h('span', { class: 'secondary' }, '(' + UI.pct(total, t.max) + '%)'),
          ex.stage === 'graded' ? UI.pill('AI suggested, you confirm', 'brand', 'sparkle') : null,
          ex.released && total !== ex.released.score ? UI.pill('was ' + ex.released.score + ' / ' + t.max, 'recheck', 'refresh') : null)));
    if (ex.stage === 'graded') {
      const can = A.canRelease(ex.id);
      if (!can.ok) bar.appendChild(h('p', { class: 'small secondary', id: 'release-hint' }, can.reason));
      bar.appendChild(UI.button({ label: 'Confirm grades and release', icon: 'check', disabled: !can.ok, describedBy: 'release-hint', onClick: () => releaseDialog(ex) }));
    } else if (ex.stage === 'recheck') {
      if (open) bar.appendChild(h('p', { class: 'small', id: 'notify-hint', style: { color: 'var(--recheck-fg)', fontWeight: 600 } }, 'Resolve ' + UI.plural(open, 're-check') + ' first'));
      bar.appendChild(UI.button({ label: 'Notify student of change', icon: 'send', disabled: !!open, describedBy: 'notify-hint', onClick: () => noteDialog(ex) }));
    } else if (ex.stage === 'released') {
      bar.appendChild(h('p', { class: 'small secondary' }, 'Released ' + UI.day(ex.releasedAt) + '. Spot a misread? Use "Edit extracted text" on the question.'));
    }
    return bar;
  }

  UI.route('teacher/review', {
    role: 'teacher', title: 'Grade review',
    render(param) {
      const [examId, tabParam] = (param || '').split('/');
      const ex = store.views.exam(examId);
      const page = h('main', { class: 'page' }, UI.backLink('#/teacher/home', 'Back to Home'));
      if (!ex || !ex.marks) {
        page.appendChild(UI.card(null, h('h2', null, ex ? 'Not graded yet' : 'Exam not found'), h('p', { class: 'secondary' }, ex ? 'Verify the extracted text first.' : 'It may have been removed when the demo was reset.'),
          ex ? UI.button({ label: 'Verify text', icon: 'arrow-right', href: '#/teacher/verify/' + ex.id }) : null));
        return page;
      }
      const t = store.state.templates[ex.templateId];
      const openMarks = Object.values(ex.marks).filter(m => m.recheck).length; const openGaps = ex.gaps.filter(g => g.recheck).length;
      const undecided = ex.gaps.filter(g => g.status === 'suggested').length;
      const tab = ['questions', 'gaps', 'history'].includes(tabParam) ? tabParam : (openMarks || !openGaps ? 'questions' : 'gaps');

      page.appendChild(h('div', { class: 'page__head' }, h('div', null, h('h1', null, 'Grade review'),
        h('p', { class: 'secondary' }, T.studentName(ex.studentId) + ' · ' + t.subject + ' · ' + t.title + (ex.releasedAt ? ' · Released ' + UI.day(ex.releasedAt) : ''))),
        UI.chip(ex.stage === 'released' ? 'Reviewed' : ex.stage === 'recheck' || openMarks + openGaps ? 'Re-check needed' : 'To review', true)));
      page.appendChild(T.workflow(ex.stage === 'released' ? 5 : 3));

      const badge = { questions: openMarks ? [openMarks + ' to re-check', 'recheck'] : null,
        gaps: openGaps ? [openGaps + ' to re-check', 'recheck'] : undecided ? [undecided + ' to decide', 'brand'] : ex.gaps.length ? ['Decided', 'success'] : null,
        history: ex.corrections.length ? [UI.plural(ex.corrections.length, 'change'), 'neutral'] : null };
      page.appendChild(h('div', { class: 'tabs', role: 'tablist' }, [['questions', 'Questions'], ['gaps', 'Gaps and flags'], ['history', 'History']].map(([id, label]) =>
        h('a', { class: 'tab', role: 'tab', 'aria-selected': String(tab === id), href: '#/teacher/review/' + ex.id + '/' + id }, label, badge[id] ? UI.pill(badge[id][0], badge[id][1]) : null))));

      page.appendChild(h('div', { role: 'tabpanel' }, T.reviewTabs[tab](ex)));
      page.appendChild(bottomBar(ex));
      return page;
    }
  });
})();
