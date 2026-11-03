/* Helpers shared by the teacher screens: the scanned page, the 4-step workflow bar, and the
   "what does this row lead to" logic for the queue. */
(function () {
  'use strict';
  const { h, icon } = UI;
  const store = window.EduTech;
  const T = UI.teacher = {};

  /* Which screen a queue row opens, and the label of its button. */
  T.actionFor = function (row) {
    if (!row.live) return { label: row.status === 'Reviewed' ? 'View' : row.status === 'Re-check needed' ? 'Re-check' : 'Verify text', demoOnly: true };
    return {
      sent: { label: 'Reading…', disabled: true },
      read: { label: 'Verify text', href: '#/teacher/verify/' + row.examId },
      graded: { label: 'Review', href: '#/teacher/review/' + row.examId },
      recheck: { label: 'Re-check', href: '#/teacher/review/' + row.examId },
      released: { label: 'View', href: '#/teacher/review/' + row.examId, secondary: true }
    }[row.stage];
  };

  T.demoOnly = () => UI.dialog(close => [h('h2', null, 'Not part of this demo'),
    h('p', { class: 'secondary' }, "Only Omar's Maths exam and Lina's German exam are fully interactive. The other rows show what a full class looks like."),
    h('div', { class: 'dialog__foot' }, UI.button({ label: 'OK', onClick: close }))]);

  /* The four steps every exam goes through, with the current one highlighted. */
  T.workflow = function (current) {
    const steps = ['Verify text', 'AI grading', 'Review grades and flags', 'Release to student'];
    return h('ol', { class: 'workflow', 'aria-label': 'Workflow' }, steps.map((label, i) => {
      const n = i + 1; const state = n < current ? 'done' : n === current ? 'current' : 'next';
      return h('li', { class: 'workflow__step workflow__step--' + state, 'aria-current': state === 'current' ? 'step' : null },
        h('span', { class: 'workflow__num' }, state === 'done' ? icon('check', 14) : String(n)), label,
        i < 3 ? h('span', { class: 'workflow__arrow', 'aria-hidden': 'true' }, icon('chevron-right', 16)) : null);
    }));
  };

  /* A drawn answer: "[2 of 5 parts shaded]" becomes a small shaded shape, everything else is handwriting. */
  function handwriting(text, german) {
    const m = /^\[(\d+) of (\d+) parts shaded\]$/.exec(text || '');
    if (m) return h('span', { class: 'shaded', 'aria-label': text }, Array.from({ length: Number(m[2]) }, (_, i) => h('i', { class: i < Number(m[1]) ? 'on' : '' })));
    return h('span', { class: 'hand' + (german ? ' hand--de' : '') }, text);
  }

  /* The scanned page: printed questions + the student's handwriting (what is really on the paper).
     marks: { [q]: 'doubtful' | 'focus' | 'resolved' | 'recheck' }, numbers: { [q]: 1 } (tags), only: [q] (crop). */
  T.paper = function (ex, o) {
    o = o || {};
    const t = store.state.templates[ex.templateId]; const german = t.language === 'de';
    const student = store.state.users[ex.studentId];
    const qs = t.questions.filter(q => !o.only || o.only.includes(q.q));
    return h('div', { class: 'paper-scan' + (o.only ? ' paper-scan--crop' : ''), role: 'img', 'aria-label': 'Scanned page of ' + student.name + "'s exam" },
      o.only ? null : [h('p', { class: 'paper-scan__title' }, (german ? 'Klasse 4 · ' : 'Grade 4 ') + t.subject + ' · ' + t.title),
        h('p', { class: 'paper-scan__name' }, 'Name: ', handwriting(student.name, german)), h('hr')],
      qs.map(q => {
        const a = ex.answers.find(x => x.q === q.q); const mark = (o.marks || {})[q.q];
        return h('div', { class: 'paper-scan__q' }, h('p', null, q.q + ')  ' + q.label),
          h('p', { class: 'paper-scan__a' }, h('span', { class: mark ? 'scan-mark scan-mark--' + mark : '' }, handwriting(a.truth, german),
            (o.numbers || {})[q.q] ? h('span', { class: 'scan-mark__tag' }, String(o.numbers[q.q])) : null)));
      }));
  };

  T.studentName = id => store.state.users[id].name;
  T.firstName = id => store.state.users[id].first;
  T.examTitle = ex => { const t = store.state.templates[ex.templateId]; return t.subject + ' · ' + t.title; };
})();
