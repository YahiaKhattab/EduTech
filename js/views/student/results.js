/* Results and Feedback (wireframe screen 4, features S2, S3, S8).
   Shows only the released snapshot: never AI suggestions, never during a second look. */
(function () {
  'use strict';
  const { h, icon } = UI;
  const store = window.EduTech;
  const ME = 'omar';
  const open = new Set();          // questions the student has opened

  const LOOK = {
    correct: ['success', 'check', 'Correct'],
    almost: ['warning', 'star', 'Almost'],
    notyet: ['warning', 'x', 'Not yet']
  };

  function question(r, q) {
    const [tone, ic, word] = LOOK[q.status];
    const isOpen = open.has(q.q);
    const id = 'q-' + q.q + '-body';
    const changed = r.changeNote && r.changedQuestions && r.changedQuestions.includes(q.q);
    return h('div', { class: 'q', 'data-open': String(isOpen) },
      h('button', { type: 'button', class: 'q__row', 'aria-expanded': String(isOpen), 'aria-controls': id,
        onClick: () => { isOpen ? open.delete(q.q) : open.add(q.q); UI.render(); } },
        UI.badge(ic, { size: 'sm', iconSize: 20, bg: tone + '-bg', fg: tone + '-fg' }),
        h('span', { class: 'grow' }, h('span', { class: 'small muted', style: { display: 'block', fontWeight: 600 } }, 'Question ' + q.q), h('span', { class: 'body-l' }, q.label)),
        changed ? UI.chip('Second look', false, 'Changed') : null,
        h('span', { class: 'q__mark' }, h('span', { class: 'small', style: { color: 'var(--' + tone + '-fg)', fontWeight: 600 } }, word), h('strong', null, q.mark + ' / ' + q.max)),
        icon(isOpen ? 'chevron-up' : 'chevron-down', 22)),
      isOpen ? h('div', { class: 'q__body', id },
        h('dl', { class: 'stack-sm', style: { margin: 0 } },
          h('div', { class: 'q__line' }, h('dt', null, 'Your answer'), h('dd', { class: 'body-l' }, q.yourAnswer)),
          q.status !== 'correct' ? h('div', { class: 'q__line' }, h('dt', null, 'Right answer'), h('dd', { class: 'body-l' }, q.right)) : null,
          q.why && q.status !== 'correct' ? h('div', { class: 'q__line' }, h('dt', null, 'Why'), h('dd', { class: 'body-l' }, q.why)) : null,
          h('div', { class: 'q__line' }, h('dt', null, 'Your teacher says'), h('dd', { class: 'body-l' }, q.feedback))),
        q.tip && q.status !== 'correct' ? h('div', { class: 'tip' }, h('span', { style: { color: 'var(--text-brand)' } }, icon('lightbulb', 22)), h('span', null, 'Tip: ' + q.tip)) : null) : null);
  }

  UI.route('student/results', {
    role: 'student', title: 'My results',
    render(examId) {
      const v = store.views.student(ME);
      const e = v.exams.find(x => x.examId === examId);
      const teacher = store.state.users.sherin.name;
      const page = h('main', { class: 'page' }, UI.backLink('#/student/home', 'Back to Home'));

      if (!e || !e.results) {          // R1: locked until the teacher releases it
        page.appendChild(UI.card(null, h('div', { class: 'empty' }, UI.badge('lock', { size: 'lg' }), h('h2', null, 'Not ready yet'),
          h('p', { class: 'body-l secondary' }, 'You can see your grade after ' + teacher + ' has checked your exam.'),
          e ? UI.button({ label: 'Where is my exam?', icon: 'arrow-right', variant: 'secondary', size: 'lg', href: '#/student/exam/' + e.examId }) : null)));
        return page;
      }

      const r = e.results;
      const note = r.changeNote;
      if (note) r.changedQuestions = (note.text.match(/Question (\d+)/g) || []).map(s => Number(s.split(' ')[1]));
      const strengths = r.strengths.length ? r.strengths : [];
      const firstName = v.user.first;

      page.appendChild(h('div', { class: 'page__head' },
        h('div', null, h('h1', null, r.subject + ' · ' + r.title), h('p', { class: 'body-l secondary' }, 'Checked by ' + teacher + (note ? ' · updated ' + UI.day(note.at) : ''))),
        UI.chip('Ready', true)));

      if (note) page.appendChild(h('section', { class: 'callout callout--recheck', 'aria-labelledby': 'changed-title' },
        UI.badge('refresh', { fg: 'recheck-fg' }),
        h('div', { class: 'stack-sm' }, h('h2', { id: 'changed-title', style: { color: 'var(--recheck-fg)', fontSize: 'var(--fs-h3)' } }, 'Your teacher took a second look'),
          h('p', { class: 'body-l' }, note.text), h('p', { class: 'caption' }, 'Approved by ' + teacher + ' · ' + UI.day(note.at)))));

      const message = r.pct >= 85 ? 'Excellent work, ' + firstName + '!' : r.pct >= 70 ? 'Good work, ' + firstName + '!' : 'Keep going, ' + firstName + '!';
      const left = h('div', { class: 'stack' },
        UI.card(null, h('div', { class: 'grade' },
          h('div', { class: 'grade__ring', role: 'img', 'aria-label': r.score + ' out of ' + r.max }, h('span', { class: 'grade__score' }, String(r.score)), h('span', { class: 'secondary', style: { fontWeight: 600 } }, 'out of ' + r.max)),
          h('div', { class: 'stack-sm grow' }, h('p', { class: 'display' }, r.pct + '%'),
            h('p', { class: 'body-l' }, message + (strengths.length ? ' You did really well on ' + UI.list(strengths.map(s => s.toLowerCase())) + '.' : '')),
            h('div', null, UI.chip('Teacher confirmed'))))),
        UI.card(null, h('div', { class: 'card__head' }, h('h2', null, 'Your answers'), h('span', { class: 'secondary small' }, 'Tap a question to see why')),
          h('div', { class: 'stack-sm' }, r.questions.map(q => question(r, q)))));

      const right = h('div', { class: 'stack' },
        UI.card(null, h('h3', null, 'What you are good at'),
          strengths.length ? strengths.map(s => h('div', { class: 'row' }, UI.badge('star', { size: 'sm', iconSize: 18, bg: 'success-bg', fg: 'success-fg' }), h('span', null, s))) : h('p', { class: 'secondary' }, 'Keep practising. You will get there!'),
          r.weakness ? [h('div', { class: 'divider' }), h('h3', null, 'What to practise'),
            h('div', { class: 'row', style: { alignItems: 'flex-start' } }, UI.badge('target', { size: 'sm', iconSize: 18, bg: 'warning-bg', fg: 'warning-fg' }),
              h('div', null, h('strong', null, r.weakness.label), h('p', { class: 'secondary', style: { fontSize: 'var(--fs-body)' } },
                'This was tricky in Questions ' + UI.list(r.weakness.questions.map(String)) + '.')))] : null),

        r.redFlag ? h('section', { class: 'callout callout--brand', style: { display: 'grid', gap: '10px' } },
          h('div', { class: 'row' }, h('span', { style: { color: 'var(--text-brand)' } }, icon('flag', 22)), h('h3', { style: { color: 'var(--text-brand)' } }, r.redFlag.childLabel)),
          h('p', null, teacher + ' noticed that ' + (r.weakness ? r.weakness.label.toLowerCase() : 'this topic') + ' needs a bit more practice. She made a short practice plan for you, and you can ask her in class anytime.')) : null,

        UI.card(null, h('div', { class: 'row' }, UI.badge('message', { size: 'sm', iconSize: 18, bg: 'brand-muted', fg: 'text-brand' }), h('h3', null, 'From ' + teacher)),
          h('p', { class: 'body-l' }, r.overallFeedback)),

        r.practice ? UI.card(null, h('h3', null, 'Practice from your teacher'),
          h('div', { class: 'row', style: { background: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--r-md)' } }, UI.badge('book', { size: 'sm', iconSize: 20, bg: 'bg-surface', fg: 'text-brand' }),
            h('div', null, h('strong', null, r.practice.title), h('p', { class: 'secondary small' }, r.practice.size))),
          UI.button({ label: 'See my practice', icon: 'arrow-right', variant: 'secondary', block: true, href: '#/student/progress' })) : null);

      page.appendChild(h('div', { class: 'cols' }, left, right));
      return page;
    }
  });
})();
