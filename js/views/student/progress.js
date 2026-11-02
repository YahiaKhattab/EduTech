/* My Progress: marks over time, practice, what I'm working on, all exams (wireframe screen 5, feature S4). */
(function () {
  'use strict';
  const { h, icon } = UI;
  const store = window.EduTech;
  const ME = 'omar';

  /* Finished exams = earlier history + exams released in this demo. */
  function finishedExams(v) {
    const live = v.exams.filter(e => e.results).map(e => ({ id: e.examId, subject: e.subject, title: e.title, date: store.state.templates[e.examId.replace('-' + ME, '')].date,
      score: e.results.score, max: e.results.max, weakness: e.results.weakness ? e.results.weakness.label : null, href: '#/student/results/' + e.examId }));
    const past = v.history.map(x => Object.assign({ href: null }, x));
    return past.concat(live).sort((a, b) => a.date.localeCompare(b.date));
  }

  /* A weak spot is "Better now" when a later exam no longer shows it. */
  function weakSpots(list) {
    const spots = {};
    list.forEach((x, i) => { if (x.weakness) spots[x.weakness] = { first: spots[x.weakness] ? spots[x.weakness].first : x.date, last: x.date, lastIndex: i }; });
    return Object.entries(spots).map(([label, s]) => {
      const later = list.slice(s.lastIndex + 1).filter(x => x.subject === list[s.lastIndex].subject);
      return { label, first: s.first, last: s.last, better: later.length > 0 };
    }).sort((a, b) => Number(a.better) - Number(b.better));
  }

  UI.route('student/progress', {
    role: 'student', title: 'My progress',
    render() {
      const v = store.views.student(ME);
      const list = finishedExams(v);
      const spots = weakSpots(list);
      const practice = v.exams.filter(e => e.results && e.results.practice).map(e => ({ title: e.results.practice.title, sub: e.results.practice.size, done: false }))
        .concat(v.plans.filter(p => p.status === 'active').map(p => ({ title: p.topic, sub: p.practice || 'Practice from your teacher', done: false })))
        .concat(v.plans.filter(p => p.status === 'finished').map(p => ({ title: p.topic, sub: 'Finished', done: true })));
      const seen = new Set(); const practiceList = practice.filter(p => { const k = p.title.toLowerCase().slice(0, 18); if (seen.has(k)) return false; seen.add(k); return true; });

      const chart = h('div', { class: 'chart', role: 'img', 'aria-label': 'Marks: ' + list.map(x => x.title + ' ' + UI.pct(x.score, x.max) + '%').join(', ') },
        list.map(x => { const p = UI.pct(x.score, x.max); return h('div', { class: 'chart__col' }, h('strong', null, p + '%'),
          h('div', { class: 'chart__bar' + (x.subject === 'English' ? ' chart__bar--english' : ''), style: { height: Math.round(p * 1.7) + 'px' } })); }));
      const labels = h('div', { class: 'chart__labels', 'aria-hidden': 'true' }, list.map(x => h('span', null, x.title)));

      return h('main', { class: 'page' },
        h('div', null, h('p', { class: 'display' }, 'My progress'), h('p', { class: 'body-l secondary' }, 'See how your marks change, and what to practise next.')),

        h('div', { class: 'cols' },
          UI.card(null, h('div', { class: 'card__head' }, h('h2', null, 'My marks'), h('div', { class: 'legend' }, h('span', null, h('i'), 'Maths'), h('span', null, h('i', { class: 'english' }), 'English'))),
            chart, labels),
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
