/* Class Gaps and Red Flags (wireframe screen 10, features T6, T7): recurring mistakes, red flags to decide,
   one student's follow-up, and a support plan to send (HTA 3: identify and support students who need help). */
(function () {
  'use strict';
  const { h, icon } = UI;
  const store = window.EduTech;
  const A = store.actions;
  const T = UI.teacher;
  const draft = { kind: 'Extra exercises', message: 'Hi Omar! Here is some extra practice on comparing fractions. Try it this week, and we will look at it together on Thursday.', notifyParent: true };
  let selectedStudent = 'omar';

  function flagRow(f) {
    const who = store.state.users[f.studentId];
    const initials = who.name.split(' ').map(w => w[0]).join('');
    const live = !!f.live; const status = f.status;
    let right;
    if (status === 'suggested') right = [UI.chip('AI suggestion'),
      UI.button({ label: 'Confirm', variant: 'danger', onClick: () => T.done(A.decideClassFlag(f.id, 'confirmed'), 'Red flag confirmed for ' + who.name + '.') }),
      UI.button({ label: 'Dismiss', variant: 'ghost', onClick: () => T.askReason({ title: 'Dismiss this red flag?', text: who.name + ' · ' + f.label + '. Tell us why, so you and the AI can learn from it.', confirm: 'Dismiss flag',
        options: ['Careless mistakes, the student knows the topic', 'One-off: the student was ill or absent', 'The AI misread the evidence'], note: who.first + ' will not see anything about this flag. You can undo it.',
        onConfirm: reason => T.done(A.decideClassFlag(f.id, 'dismissed', reason), 'Red flag dismissed for ' + who.name + '. Your reason is saved.') }) })];
    else if (status === 'recheck') right = [UI.chip('Re-check needed'), UI.button({ label: 'Re-check', href: '#/teacher/review/' + f.examId + '/gaps' })];
    else if (status === 'confirmed') right = [UI.chip('Red flag'), UI.button({ label: 'Evidence', icon: 'eye', variant: 'ghost', href: live ? '#/teacher/review/' + f.examId + '/gaps' : null, onClick: live ? null : T.demoOnly }),
      live ? null : UI.button({ label: 'Undo', variant: 'ghost', onClick: () => T.done(A.decideClassFlag(f.id, 'suggested'), 'Decision undone.', false) })];
    else right = [UI.chip('Flag dismissed'), UI.button({ label: 'Undo', variant: 'ghost', onClick: () => T.done(A.decideClassFlag(f.id, 'suggested'), 'Decision undone.', false) })];
    return h('li', { class: 'list-row flag-row' + (status === 'dismissed' ? ' is-dismissed' : '') + (f.studentId === selectedStudent ? ' is-selected' : '') },
      h('span', { class: 'avatar avatar--sm' }, initials),
      h('div', { class: 'grow' }, h('strong', null, who.name), h('div', { class: 'small' }, f.label), h('div', { class: 'small secondary' }, status === 'dismissed' ? 'Dismissed: ' + f.reason : f.evidence)),
      h('div', { class: 'row row--wrap', style: { justifyContent: 'flex-end' } }, right));
  }

  function supportPlan(studentId) {
    const who = store.state.users[studentId];
    const active = store.state.plans.filter(p => p.studentId === studentId && p.status === 'active');
    const send = () => {
      const r = A.sendSupportPlan(studentId, { topic: 'Comparing fractions', kind: draft.kind, practice: '5 practice questions', message: draft.message, notifyParent: draft.notifyParent });
      T.done(r, 'Support plan sent to ' + who.first + (draft.notifyParent ? ' and his parent' : '') + '. You will be reminded after the next fractions exam.', false);
    };
    return UI.card(null, h('h2', { style: { fontSize: 'var(--fs-h3)' } }, 'Support plan for ' + who.first),
      active.length ? h('div', { class: 'callout callout--info', style: { padding: '10px 14px' } }, h('span', { style: { color: 'var(--success-fg)' } }, icon('check-circle', 20)),
        h('span', { class: 'small' }, 'Plan sent ' + UI.ago(active[active.length - 1].sentAt).toLowerCase() + ': ' + active[active.length - 1].kind.toLowerCase() + ' on comparing fractions. Follow-up ' + active[active.length - 1].followUp + '.')) : null,
      h('fieldset', { class: 'stack-sm', style: { border: 0, padding: 0, margin: 0 } }, h('legend', { class: 'field__label' }, 'Kind of help'),
        h('div', { class: 'segmented' }, ['Extra exercises', 'Small group', 'Whole class'].map(k => h('label', { class: 'segmented__opt' + (draft.kind === k ? ' is-on' : '') },
          h('input', { type: 'radio', name: 'kind', class: 'sr-only', checked: draft.kind === k, onChange: () => { draft.kind = k; UI.render(); } }), k)))),
      h('div', { class: 'row', style: { background: 'var(--bg-subtle)', padding: '10px', borderRadius: 'var(--r-md)' } }, h('span', { style: { color: 'var(--text-brand)' } }, icon('book', 20)),
        h('span', { class: 'small' }, 'Comparing fractions · 5 questions (approved)')),
      h('label', { class: 'field' }, h('span', { class: 'field__label' }, 'Message to ' + who.first),
        h('textarea', { class: 'textarea', rows: '3', onInput: e => { draft.message = e.target.value; } }, draft.message)),
      h('label', { class: 'checkbox' }, h('input', { type: 'checkbox', checked: draft.notifyParent, onChange: e => { draft.notifyParent = e.target.checked; } }), 'Also tell the parent'),
      h('p', { class: 'small secondary row' }, icon('clock', 16), 'You will be reminded after the next fractions exam.'),
      UI.button({ label: active.length ? 'Send an updated plan' : 'Send support plan', icon: 'send', block: true, onClick: send }));
  }

  /* Weak spots across exams: "Still there" or "Solved" (HTA 3 task 5, follow up). */
  function followUp(studentId) {
    const v = store.views.student(studentId);
    const list = v.history.map(x => ({ subject: x.subject, title: x.title, date: x.date, pct: UI.pct(x.score, x.max), weakness: x.weakness }))
      .concat(v.exams.filter(e => e.results).map(e => ({ subject: e.subject, title: e.title, date: store.state.templates[e.examId.replace('-' + studentId, '')].date, pct: e.results.pct, weakness: e.results.weakness ? e.results.weakness.label : null })))
      .sort((a, b) => a.date.localeCompare(b.date));
    const spots = {};
    list.forEach((x, i) => { if (x.weakness) spots[x.weakness] = { first: (spots[x.weakness] || {}).first || x.date, last: x.date, i }; });
    return { list, spots: Object.entries(spots).map(([label, s]) => ({ label, first: s.first, last: s.last, solved: list.slice(s.i + 1).some(y => y.subject === list[s.i].subject) })) };
  }

  function timeline(studentId) {
    const ev = [];
    Object.values(store.state.exams).filter(e => e.studentId === studentId).forEach(e => {
      const t = store.state.templates[e.templateId];
      if (e.releasedAt) ev.push([e.releasedAt, 'flag', 'danger', t.title + ' released' + (e.gaps.some(g => g.kind === 'redflag' && g.status === 'confirmed') ? '. Red flag confirmed: needs additional support in fractions.' : '.')]);
      e.corrections.filter(c => c.phase !== 'first check').forEach(c => ev.push([c.at, 'refresh', 'recheck', 'Question ' + c.q + ' corrected ' + c.phase + ' ("' + c.from + '" → "' + c.to + '"). Re-checked: ' + c.affected.join(', ') + '.']));
      e.changeNotes.forEach(n => ev.push([n.at, 'send', 'info', 'Note sent: grade ' + n.fromPct + '% → ' + n.toPct + '%.']));
    });
    store.state.plans.filter(p => p.studentId === studentId).forEach(p => ev.push([p.sentAt, p.status === 'finished' ? 'check' : 'book', p.status === 'finished' ? 'success' : 'info', 'Support plan: ' + p.kind.toLowerCase() + ' on ' + p.topic.toLowerCase() + (p.notifyParent ? ' (parent told)' : '') + (p.status === 'finished' ? ', finished.' : '.')]));
    return ev.sort((a, b) => b[0].localeCompare(a[0]));
  }

  UI.route('teacher/gaps', {
    role: 'teacher', title: 'Class gaps',
    render(param) {
      const tab = param === 'student' ? 'student' : 'class';
      const v = store.views.teacher();
      const page = h('main', { class: 'page' },
        h('div', { class: 'page__head' }, h('div', null, h('h1', null, 'Class gaps and red flags'),
          h('p', { class: 'secondary' }, tab === 'class' ? 'Class 4B · Maths · last 30 days · based on confirmed results only' : 'One student across all exams · confirmed results only')),
          h('div', { class: 'segmented', role: 'tablist' }, [['class', 'Class'], ['student', 'Student']].map(([id, label]) =>
            h('a', { class: 'segmented__opt' + (tab === id ? ' is-on' : ''), role: 'tab', 'aria-selected': String(tab === id), href: '#/teacher/gaps/' + id }, label)))));

      let left;
      if (tab === 'class') {
        const waiting = v.classFlags.filter(f => f.status === 'suggested' || f.status === 'recheck').length;
        left = h('div', { class: 'stack' },
          UI.card(null, h('h2', { style: { fontSize: 'var(--fs-h3)' } }, 'Recurring mistakes'),
            v.classMistakes.map(m => h('div', { class: 'stack-sm', style: { gap: '6px' } }, h('div', { class: 'row' }, h('span', { class: 'grow' }, m.label), h('span', { class: 'small secondary' }, m.students + ' of 18 students')),
              UI.bar(m.students / 18, m.students >= 4 ? 'warning-fg' : 'icon-muted')))),
          UI.card(null, h('div', { class: 'card__head' }, h('h2', { style: { fontSize: 'var(--fs-h3)' } }, 'Red flags'), h('span', { class: 'small secondary' }, waiting + ' waiting for you')),
            h('ul', { class: 'stack-sm', style: { listStyle: 'none', padding: 0, margin: 0 } }, v.classFlags.map(flagRow))));
      } else {
        const who = store.state.users[selectedStudent];
        const f = followUp(selectedStudent); const ev = timeline(selectedStudent);
        left = h('div', { class: 'stack' },
          UI.card({ class: 'card' }, h('label', { class: 'row row--wrap' }, h('span', { class: 'field__label' }, 'Student'),
            h('select', { class: 'select', style: { maxWidth: '320px' }, onChange: e => { if (e.target.value !== 'omar') { e.target.value = 'omar'; T.demoOnly(); } } },
              Object.values(store.state.users).filter(u => u.role === 'student').map(u => h('option', { value: u.id, selected: u.id === selectedStudent }, u.name))))),
          UI.card(null, h('h2', { style: { fontSize: 'var(--fs-h3)' } }, who.first + "'s exams"),
            h('div', { class: 'table-wrap' }, h('table', { class: 'table' }, h('thead', null, h('tr', null, h('th', null, 'Date'), h('th', null, 'Exam'), h('th', null, 'Grade'), h('th', null, 'Weak spot'))),
              h('tbody', null, f.list.slice().reverse().map(x => h('tr', null, h('td', { class: 'small' }, UI.shortDay(x.date)), h('td', null, x.subject + ' · ' + x.title), h('td', null, h('strong', null, x.pct + '%')),
                h('td', null, x.weakness ? UI.pill(x.weakness, 'warning', 'target') : h('span', { class: 'muted' }, '—')))))))),
          UI.card(null, h('h2', { style: { fontSize: 'var(--fs-h3)' } }, 'Follow-up on weaknesses'),
            f.spots.map(s => h('div', { class: 'row' }, h('div', { class: 'grow' }, h('strong', null, s.label), h('div', { class: 'small secondary' }, 'First seen ' + UI.shortDay(s.first) + (s.solved ? ' · not seen since' : ' · last seen ' + UI.shortDay(s.last)))),
              s.solved ? UI.pill('Solved', 'success', 'check') : UI.pill('Still there', 'warning', 'clock')))),
          UI.card(null, h('h2', { style: { fontSize: 'var(--fs-h3)' } }, who.first + "'s timeline"),
            ev.length ? h('ol', { class: 'timeline' }, ev.map(([at, ic, tone, text]) => h('li', null, h('span', { class: 'small secondary timeline__date' }, UI.shortDay(at)),
              UI.badge(ic, { size: 'sm', iconSize: 16, bg: tone + '-bg', fg: tone + '-fg' }), h('span', null, text)))) : h('p', { class: 'secondary' }, 'Nothing yet.')));
      }
      page.appendChild(h('div', { class: 'cols' }, left, supportPlan(selectedStudent)));
      return page;
    }
  });
})();
