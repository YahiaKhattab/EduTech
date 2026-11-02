/* Exam Status Tracker: where is my exam? (wireframe screen 3, feature S6).
   The grade stays locked until the teacher has confirmed it (rule R1). */
(function () {
  'use strict';
  const { h, icon } = UI;
  const store = window.EduTech;
  const ME = 'omar';

  const STEPS = [
    ['Sent', 'upload', 'Your photos arrived.'],
    ['Read', 'eye', 'The computer read your answers.'],
    ['Teacher checking', 'clock', 'is checking your answers.'],
    ['Ready', 'star', 'Your results are ready!']
  ];
  const STAGE_INDEX = { sent: 0, read: 1, graded: 2, recheck: 2, released: 3 };

  UI.route('student/exam', {
    role: 'student', title: 'Where is my exam?',
    render(examId) {
      const v = store.views.student(ME);
      const e = v.exams.find(x => x.examId === examId);
      if (!e) return h('main', { class: 'page' }, UI.backLink('#/student/home', 'Back to Home'),
        UI.card(null, h('div', { class: 'empty' }, h('h2', null, 'Exam not found'), h('p', { class: 'secondary' }, 'It may have been removed when the demo was reset.'))));

      const teacher = store.state.users.sherin.name;
      const at = STAGE_INDEX[e.stage]; const second = e.stage === 'recheck'; const ready = e.stage === 'released';
      const journey = h('ol', { class: 'journey', style: { listStyle: 'none', padding: 0, margin: 0 } });
      STEPS.forEach(([label, ic, caption], i) => {
        let state = i < at || (ready && i === 3) ? 'done' : i === at ? 'current' : 'upcoming';
        if (second && i === 2) state = 'attention';
        const capText = i === 2 ? (second ? teacher + ' is taking a second look.' : teacher + ' ' + caption) : caption;
        journey.appendChild(h('li', { class: 'journey__step journey__step--' + state, 'aria-current': state === 'current' || state === 'attention' ? 'step' : null },
          h('span', { class: 'journey__icon' }, icon(state === 'done' ? 'check' : state === 'attention' ? 'refresh' : ic, 28)),
          h('span', { class: 'journey__label' }, label),
          h('span', { class: 'journey__caption' }, capText),
          h('span', { class: 'sr-only' }, state === 'done' ? '(done)' : state === 'upcoming' ? '(not yet)' : '(now)')));
        if (i < 3) journey.appendChild(h('li', { class: 'journey__line' + (i < at || ready ? ' journey__line--done' : ''), 'aria-hidden': 'true' }));
      });

      return h('main', { class: 'page' }, UI.backLink('#/student/home', 'Back to Home'),
        h('div', { class: 'page__head' }, h('div', null, h('h1', null, e.subject + ' · ' + e.title),
          h('p', { class: 'body-l secondary' }, 'Sent ' + UI.ago(e.uploadedAt).toLowerCase() + ' · ' + teacher)), UI.chip(e.status, true)),

        UI.card(null, h('h2', null, 'Where is my exam?'), journey),

        second
          ? h('section', { class: 'callout callout--recheck' }, UI.badge('refresh', { fg: 'recheck-fg' }),
              h('div', { class: 'stack-sm' }, h('h3', { style: { color: 'var(--recheck-fg)' } }, 'Your teacher is taking a second look'),
                h('p', { class: 'body-l' }, teacher + ' is checking your exam again to make sure your mark is right. Nothing is wrong. Your results will be ready soon.')))
          : UI.card(null, h('h3', null, 'Notes from your teacher'),
              h('p', { class: 'body-l secondary' }, ready ? teacher + ' left you feedback. Open your results to read it.' : 'No notes yet. If your teacher takes a second look at your exam, a note will appear here.')),

        h('div', { class: 'row row--wrap' },
          UI.button({ label: 'View results', icon: ready ? 'arrow-right' : 'lock', size: 'lg', disabled: !ready, href: '#/student/results/' + e.examId, describedBy: 'lock-hint' }),
          UI.button({ label: 'Back to Home', icon: 'home', variant: 'secondary', size: 'lg', href: '#/student/home' }),
          ready ? null : h('p', { class: 'secondary', id: 'lock-hint' }, 'You can see your grade after ' + teacher + ' has checked your exam.')));
    }
  });
})();
