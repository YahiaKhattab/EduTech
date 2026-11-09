/* My Progress (Student New design, M2 wireframe screen 5, feature S4): marks over time,
   practice from the teacher, and the things I am working on.
   The exam list and weak spots come from js/ui/progress.js (shared with the parent view);
   the chart here is the student's own, so the parent chart is not changed. */
(function () {
  'use strict';
  const { h, icon } = UI;
  const store = window.EduTech;
  const S = UI.S;
  const ME = 'omar';

  /* Bars in subject colours. Only exams with a results page get a link; the others are plain bars. */
  function chart(list) {
    return h('div', { class: 's-chart' },
      h('ul', { class: 's-chart__bars', 'aria-label': 'My marks, oldest first' }, list.map(x => {
        const p = UI.pct(x.score, x.max);
        return h('li', { class: 's-chart__col' },
          h('span', { class: 's-chart__pct' }, p + '%'),
          h('span', { class: 's-chart__bar s-chart__bar--' + x.subject.toLowerCase(), style: '--p: ' + p, 'aria-hidden': 'true' }),
          h('span', { class: 's-chart__label' }, h('strong', null, x.title), h('span', null, x.subject + ' · ' + UI.shortDay(x.date)), h('span', { class: 'sr-only' }, ', ' + p + '%')),
          x.href ? h('a', { class: 's-chart__link', href: x.href }, 'See results', icon('chevron-right', 16)) : null);
      })),
      h('div', { class: 's-chart__legend', 'aria-hidden': 'true' }, [...new Set(list.map(x => x.subject))].map(s => h('span', null, h('i', { class: 's-chart__bar--' + s.toLowerCase() }), s))));
  }

  /* Practice: what the teacher sent (student-only list), practice approved on released exams,
     and support plans. Each one opens the practice-plan pop-up. */
  function practiceItems(v) {
    const items = v.practice.map(p => ({ plan: p, sub: p.size + ' · sent ' + UI.day(p.sentAt), done: false }))
      .concat(v.exams.filter(e => e.results && e.results.practice).map(e => ({ plan: e.results.practice, sub: e.results.practice.size + ' · from your ' + e.subject + ' exam', done: false })))
      .concat(v.plans.map(p => ({ plan: { title: p.topic, size: p.practice || 'Practice from your teacher', what: p.message || null, how: [] }, sub: p.status === 'finished' ? 'Finished' : (p.practice || '') + ' · sent ' + UI.day(p.sentAt), done: p.status === 'finished' })));
    const seen = new Set();
    return items.filter(x => { const k = x.plan.title.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
  }

  UI.route('student/progress', {
    role: 'student', title: 'My progress',
    render() {
      const v = store.views.student(ME);
      const list = UI.finishedExams(ME, id => '#/student/results/' + id)
        .map(x => x.detail ? Object.assign({}, x, { href: '#/student/results/' + x.id }) : x);
      const spots = UI.weakSpots(list);
      const practice = practiceItems(v);

      const marks = S.card({ class: 's-card', 'aria-labelledby': 'marks-title' },
        h('h2', { id: 'marks-title' }, 'My marks'),
        list.length ? chart(list) : h('p', { class: 's-empty-line' }, icon('chart', 22), 'Your marks show up here after ' + S.teacher() + ' checks an exam.'));

      const practiceCard = S.card({ class: 's-card', 'aria-labelledby': 'practice-title' },
        h('h2', { id: 'practice-title' }, 'Practice from ' + S.teacher()),
        practice.length ? practice.map(x => h('div', { class: 's-practice' + (x.done ? ' s-practice--done' : '') },
          h('span', { class: 's-plan__icon' }, icon(x.done ? 'check' : 'book', 24)),
          h('div', { style: { flex: '1', minWidth: '170px' } }, h('strong', null, x.plan.title), h('span', { class: 's-caption' }, x.sub)),
          UI.button({ label: 'See plan', variant: 'secondary', onClick: () => S.practicePlan(x.plan) })))
          : h('p', { class: 's-empty-line' }, icon('book', 22), 'No practice yet.'));

      const working = S.card({ class: 's-card', 'aria-labelledby': 'working-title' },
        h('h2', { id: 'working-title' }, 'Things I am working on'),
        spots.length ? h('div', { class: 's-spots' }, spots.map(s => h('div', { class: 's-spot s-spot--' + (s.better ? 'better' : 'now') },
          h('span', { class: 's-spot__icon' }, icon(s.better ? 'flower' : 'sprout', 28)),
          h('div', { style: { flex: '1' } }, h('strong', null, s.label),
            h('span', { class: 's-caption' }, 'First seen ' + UI.day(s.first) + (s.better ? ' · not seen since ' + UI.day(s.last) : ' · last seen ' + UI.day(s.last)))),
          S.chip(s.better ? 'Ready' : 'Teacher checking', s.better ? 'Better now' : 'Practising'))))
          : h('p', { class: 's-empty-line' }, icon('sprout', 22), 'Nothing to work on right now.'));

      return h('main', { class: 'page' },
        h('div', null, h('h1', null, 'My progress'), h('p', { class: 's-sub' }, 'See how your marks change, and what to practise next.')),
        marks,
        h('div', { class: 's-cols s-cols--even' }, practiceCard, working));
    }
  });
})();
