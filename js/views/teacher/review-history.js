/* Grade Review · History tab: every change to the extracted text and what it affected (feature T4, correction trail). */
(function () {
  'use strict';
  const { h } = UI;
  const T = UI.teacher;
  T.reviewTabs = T.reviewTabs || {};

  const time = iso => { const d = new Date(iso); return UI.shortDay(iso) + ', ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };

  T.reviewTabs.history = function (ex) {
    const open = ex.marks && (Object.values(ex.marks).some(m => m.recheck) || ex.gaps.some(g => g.recheck));
    const rows = ex.corrections.slice().reverse();
    return h('section', { class: 'card card--flush' },
      h('div', { style: { padding: '20px 24px 12px' } }, h('h2', { style: { fontSize: 'var(--fs-h3)' } }, 'Correction history'),
        h('p', { class: 'small secondary' }, 'Every change to the extracted text, and which results it affected. Kept for your records.')),
      rows.length ? h('div', { class: 'table-wrap' }, h('table', { class: 'table' },
        h('thead', null, h('tr', null, ['When', 'What changed', 'The computer read', 'Changed to', 'Affected results', 'Status'].map(c => h('th', null, c)))),
        h('tbody', null, rows.map((c, i) => {
          const latest = i === 0 && c.affected.length;
          const status = !c.affected.length ? UI.pill('Checked', 'success', 'check') : latest && open ? UI.pill('Re-check open', 'recheck', 'refresh') : UI.pill('Re-checked', 'success', 'check');
          return h('tr', null, h('td', { class: 'small' }, time(c.at)), h('td', null, 'Question ' + c.q + ' · ' + c.phase),
            h('td', null, h('strong', { style: { color: 'var(--danger-fg)' } }, c.from)), h('td', null, h('strong', { style: { color: 'var(--success-fg)' } }, c.to)),
            h('td', { class: 'small' }, c.affected.length ? c.affected.join(' · ') : 'None (before AI grading)'), h('td', null, status));
        })))) : h('p', { class: 'secondary', style: { padding: '0 24px 24px' } }, 'No corrections yet.'));
  };
})();
