/* Progress helpers shared by the student and parent views: the list of finished exams,
   the weak spots over time, and the marks chart. */
(function () {
  'use strict';
  const { h } = UI;
  const store = window.EduTech;

  /* Finished exams = earlier history + exams released in this demo, oldest first.
     resultsHref(examId) gives the link for a released exam (each view has its own results page). */
  UI.finishedExams = function finishedExams(childId, resultsHref) {
    const live = store.views.student(childId).exams.filter(e => e.results).map(e => ({
      id: e.examId, subject: e.subject, title: e.title, date: store.state.templates[e.examId.slice(0, -(childId.length + 1))].date,
      score: e.results.score, max: e.results.max, weakness: e.results.weakness ? e.results.weakness.label : null,
      changed: !!e.results.changeNote, href: resultsHref ? resultsHref(e.examId) : null }));
    const past = store.state.history.filter(x => x.studentId === childId).map(x => Object.assign({ href: null }, x));
    return past.concat(live).sort((a, b) => a.date.localeCompare(b.date));
  };

  /* A weak spot is "better now" when a later exam in the same subject no longer shows it. */
  UI.weakSpots = function weakSpots(list) {
    const spots = {};
    list.forEach((x, i) => { if (x.weakness) spots[x.weakness] = { first: spots[x.weakness] ? spots[x.weakness].first : x.date, last: x.date, lastIndex: i }; });
    return Object.entries(spots).map(([label, s]) => {
      const later = list.slice(s.lastIndex + 1).filter(x => x.subject === list[s.lastIndex].subject);
      return { label, first: s.first, last: s.last, better: later.length > 0 };
    }).sort((a, b) => Number(a.better) - Number(b.better));
  };

  /* Bar chart of marks (Maths purple, English blue), with labels under it. */
  UI.marksChart = function marksChart(list) {
    const chart = h('div', { class: 'chart', role: 'img', 'aria-label': 'Marks: ' + list.map(x => x.title + ' ' + UI.pct(x.score, x.max) + '%').join(', ') },
      list.map(x => { const p = UI.pct(x.score, x.max); return h('div', { class: 'chart__col' }, h('strong', null, p + '%'),
        h('div', { class: 'chart__bar' + (x.subject === 'English' ? ' chart__bar--english' : ''), style: { height: Math.round(p * 1.7) + 'px' } })); }));
    const labels = h('div', { class: 'chart__labels', 'aria-hidden': 'true' }, list.map(x => h('span', null, x.title)));
    return [chart, labels];
  };
  UI.chartLegend = () => h('div', { class: 'legend' }, h('span', null, h('i'), 'Maths'), h('span', null, h('i', { class: 'english' }), 'English'));
})();
