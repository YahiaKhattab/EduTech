/* My Progress: marks over time, practice, what I'm working on, all exams (wireframe screen 5, feature S4).
   The list, weak spots and chart come from js/ui/progress.js (shared with the parent view). */
(function () {
  'use strict';
  const { h, icon } = UI;
  const store = window.EduTech;
  const ME = 'omar';

  UI.route('student/progress', {
    role: 'student', title: 'My progress',
    render() {
      const v = store.views.student(ME);
      const list = UI.finishedExams(ME, id => '#/student/results/' + id);
      const spots = UI.weakSpots(list);
      const practice = v.exams.filter(e => e.results && e.results.practice).map(e => ({ title: e.results.practice.title, sub: e.results.practice.size, done: false }))
        .concat(v.plans.filter(p => p.status === 'active').map(p => ({ title: p.topic, sub: p.practice || 'Practice from your teacher', done: false })))
        .concat(v.plans.filter(p => p.status === 'finished').map(p => ({ title: p.topic, sub: 'Finished', done: true })));
      const seen = new Set(); const practiceList = practice.filter(p => { const k = p.title.toLowerCase().slice(0, 18); if (seen.has(k)) return false; seen.add(k); return true; });

      return h('main', { class: 'page' },
        h('div', null, h('p', { class: 'display' }, 'My progress'), h('p', { class: 'body-l secondary' }, 'See how your marks change, and what to practise next.')),

        h('div', { class: 'cols' },
          UI.card(null, h('div', { class: 'card__head' }, h('h2', null, 'My marks'), UI.chartLegend()),
            UI.marksChart(list)),
          UI.card(null, h('h2', null, 'Practice from your teacher'),
            practiceList.length ? practiceList.map(p => h('div', { class: 'list-row', style: { background: p.done ? 'var(--bg-surface)' : 'var(--bg-subtle)', border: p.done ? null : '0' } },
              UI.badge(p.done ? 'check' : 'book', { size: 'sm', iconSize: 20, bg: p.done ? 'success-bg' : 'bg-surface', fg: p.done ? 'success-fg' : 'text-brand' }),
              h('div', { class: 'grow' }, h('strong', null, p.title), h('p', { class: 'secondary small' }, p.sub)),
              p.done ? null : UI.pill('New', 'brand'))) : h('p', { class: 'secondary' }, 'No practice yet.'))),

        UI.card(null, h('h2', null, 'Things I am working on'),
          spots.length ? spots.map(s => h('div', { class: 'list-row' },
            UI.badge(s.better ? 'trend' : 'target', { bg: s.better ? 'success-bg' : 'warning-bg', fg: s.better ? 'success-fg' : 'warning-fg' }),
            h('div', { class: 'grow' }, h('h3', null, s.label), h('p', { class: 'secondary', style: { fontSize: 'var(--fs-body)' } },
              'First seen ' + UI.day(s.first) + (s.better ? ' · not seen since ' + UI.day(s.last) : ' · last seen ' + UI.day(s.last)))),
            s.better ? UI.pill('Better now!', 'success', 'check') : UI.pill('Practising', 'warning', 'clock'))) : h('p', { class: 'secondary' }, 'Nothing to work on right now. Great job!')),

        h('section', { class: 'stack-sm' }, h('h2', null, 'All my exams'),
          h('div', { class: 'exam-cards' }, list.slice().reverse().map(x => {
            const inner = [h('span', { class: 'small', style: { fontWeight: 600, color: x.subject === 'English' ? 'var(--info-fg)' : 'var(--text-brand)' } }, x.subject),
              h('h3', null, x.title), h('span', { class: 'secondary small' }, UI.day(x.date)), h('span', { style: { fontSize: 'var(--fs-h1)', fontWeight: 700 } }, UI.pct(x.score, x.max) + '%'),
              h('span', null, x.weakness ? UI.pill(x.weakness, 'warning', 'target') : UI.pill('No weak spots', 'success', 'star'))];
            return x.href ? h('a', { class: 'card', href: x.href, style: { textDecoration: 'none', color: 'inherit', gap: '8px' } }, inner) : h('div', { class: 'card', style: { gap: '8px' } }, inner);
          }))));
    }
  });
})();
