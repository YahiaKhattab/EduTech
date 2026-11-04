/* Parent / Progress (prototype board "Parent / Progress"): grades over time, weak spots,
   and the support plans the teacher shared. Only checked and released results. */
(function () {
  'use strict';
  const { h } = UI;
  const P = UI.parent;
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function seen(s) {
    if (s.first === s.last) return (s.better ? 'Seen ' : 'Seen in the exam on ') + UI.shortDay(s.first);
    return 'First seen ' + UI.shortDay(s.first) + (s.better ? ' · not seen since ' + UI.shortDay(s.last) : ' · last seen ' + UI.shortDay(s.last));
  }

  UI.route('parent/progress', {
    role: 'parent', title: 'Progress',
    render() {
      const v = P.view(); const teacher = v.teacher.name;
      const list = UI.finishedExams(v.child.id, id => '#/parent/results/' + id);
      const spots = UI.weakSpots(list);
      const since = list.length ? ' since ' + MONTHS[new Date(list[0].date).getMonth()] : '';

      const weak = UI.card(null, h('h2', null, 'Weak spots'),
        spots.length ? h('div', { class: 'stack-sm' }, spots.map(s => h('div', { class: 'list-row spot-row' },
          h('div', { class: 'grow' }, h('strong', null, s.label), h('p', { class: 'secondary small' }, seen(s))),
          s.better ? UI.pill('Solved', 'success', 'check') : UI.pill('Still practising', 'warning', 'clock'))))
          : h('p', { class: 'secondary' }, 'No weak spots right now.'));

      const plans = UI.card(null, h('h2', null, 'Support plans from ' + teacher),
        v.plans.length ? h('div', { class: 'stack-sm' }, v.plans.slice().reverse().map(p => h('div', { class: 'plan-row' },
          h('strong', { class: 'plan-row__date' }, UI.shortDay(p.sentAt)),
          h('span', { class: 'grow' }, [p.topic, p.practice, p.status === 'active' ? 'check ' + p.followUp : null].filter(Boolean).join(' · ')),
          p.status === 'active' ? UI.pill('Active', 'brand', 'clock') : UI.pill('Finished' + (p.solved ? ' · solved' : ''), 'success', 'check'))))
          : h('p', { class: 'secondary' }, 'No support plans yet. If ' + teacher + ' makes one, you will see it here.'),
        h('p', { class: 'small muted' }, 'You only see results and red flags that ' + teacher + ' has checked and confirmed.'));

      return h('main', { class: 'page' },
        h('div', null, h('h1', null, v.child.first + "'s progress"), h('p', { class: 'secondary' }, 'Results checked by ' + teacher + since)),
        h('div', { class: 'cols' },
          UI.card(null, h('h2', null, 'Grades over time'), UI.marksChart(list), UI.chartLegend()),
          weak),
        plans);
    }
  });
})();
