/* Teacher Home: what needs attention first (wireframe screen 6, features T5 and T9). */
(function () {
  'use strict';
  const { h, icon } = UI;
  const store = window.EduTech;
  let filter = null;           // 'To review' | 'Re-check needed' | 'Reviewed' | null

  const SUMMARY = [
    ['To review', 'warning', 'clock', 'Check the extracted text, then the AI grades'],
    ['Re-check needed', 'recheck', 'refresh', 'Results changed by a text correction'],
    ['Reviewed', 'success', 'check-circle', 'Confirmed and released to students']
  ];

  /* Export released grades as a CSV file (feature T9: the school records). */
  function exportCSV() {
    const rows = [['Student', 'Subject', 'Exam', 'Score', 'Max', 'Percent', 'Weakness', 'Red flag', 'Released']];
    const name = id => store.state.users[id].name;
    store.state.history.forEach(e => rows.push([name(e.studentId), e.subject, e.title, e.score, e.max, Math.round(100 * e.score / e.max) + '%', e.weakness || '', '', e.date]));
    Object.values(store.state.exams).filter(e => e.released).forEach(e => {
      const r = e.released; rows.push([name(e.studentId), r.subject, r.title, r.score, r.max, r.pct + '%', r.weakness ? r.weakness.label : '', r.redFlag ? r.redFlag.label : '', String(e.releasedAt).slice(0, 10)]);
    });
    if (rows.length === 1) { UI.toast('No released results to export yet.', { tone: 'info' }); return; }
    const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\r\n');
    const a = h('a', { href: URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })), download: 'class-4B-grades.csv' });
    document.body.appendChild(a); a.click(); a.remove();
    UI.toast('Exported ' + UI.plural(rows.length - 1, 'result') + ' to class-4B-grades.csv.');
  }

  function row(r) {
    const act = UI.teacher.actionFor(r);
    const initials = r.student.split(' ').map(w => w[0]).join('');
    let flag = r.flagNote;
    let flagTone = /re-check/.test(flag || '') ? 'recheck' : /Red flag/.test(flag || '') ? 'danger' : /doubtful/.test(flag || '') ? 'warning' : 'neutral';
    if (r.stage === 'sent') { flag = 'Reading the text…'; flagTone = 'info'; }
    return h('tr', null,
      h('td', null, h('div', { class: 'row' }, h('span', { class: 'avatar avatar--sm' }, initials),
        h('div', null, h('strong', null, r.student), h('div', { class: 'small secondary' }, r.subject + ' · ' + r.title)))),
      h('td', null, UI.chip(r.status)),
      h('td', null, flag ? UI.pill(flag, flagTone, flagTone === 'recheck' ? 'refresh' : flagTone === 'danger' ? 'flag' : flagTone === 'warning' ? 'alert' : flagTone === 'info' ? 'clock' : 'check') : h('span', { class: 'muted' }, '—')),
      h('td', { class: 'num' }, act.demoOnly
        ? UI.button({ label: act.label, variant: r.status === 'Reviewed' ? 'secondary' : 'primary', onClick: UI.teacher.demoOnly })
        : UI.button({ label: act.label, variant: act.secondary ? 'secondary' : 'primary', href: act.href, disabled: act.disabled })));
  }

  UI.route('teacher/home', {
    role: 'teacher', title: 'Home',
    render() {
      const v = store.views.teacher();
      const rows = filter ? v.rows.filter(r => r.status === filter) : v.rows;
      const inbox = v.notifications.slice(0, 5);

      return h('main', { class: 'page' },
        h('div', { class: 'page__head' }, h('div', null, h('h1', null, 'Good morning, ' + store.state.users.sherin.name),
          h('p', { class: 'secondary' }, 'Class 4B · 18 students · Here is what needs your attention today.')),
          UI.button({ label: 'Export grades (CSV)', icon: 'file', variant: 'secondary', onClick: exportCSV })),

        h('div', { class: 'summary', role: 'group', 'aria-label': 'Filter by status' }, SUMMARY.map(([label, tone, ic, hint]) =>
          h('button', { type: 'button', class: 'summary__box', 'aria-pressed': String(filter === label), onClick: () => { filter = filter === label ? null : label; UI.render(); } },
            UI.badge(ic, { bg: tone + '-bg', fg: tone + '-fg' }),
            h('span', null, h('span', { class: 'secondary', style: { display: 'block', fontWeight: 600 } }, label),
              h('span', { class: 'summary__count' }, String(v.counts[label] || 0)), h('span', { class: 'small muted', style: { display: 'block' } }, hint))))),

        h('div', { class: 'cols' },
          h('section', { class: 'card card--flush' },
            h('div', { class: 'card__head', style: { padding: '16px 20px' } }, h('h2', { style: { fontSize: 'var(--fs-h3)' } }, filter ? filter : 'Needs attention first'),
              filter ? h('button', { type: 'button', class: 'link-btn', onClick: () => { filter = null; UI.render(); } }, 'Show all') : null),
            h('div', { class: 'table-wrap' }, h('table', { class: 'table' },
              h('thead', null, h('tr', null, h('th', null, 'Student and exam'), h('th', null, 'Status'), h('th', null, 'Flags'), h('th', { class: 'num' }, h('span', { class: 'sr-only' }, 'Action')))),
              h('tbody', null, rows.length ? rows.map(row) : h('tr', null, h('td', { colspan: '4', class: 'secondary' }, 'Nothing here right now.')))))),

          UI.card(null, h('h2', { style: { fontSize: 'var(--fs-h3)' } }, 'Messages and new submissions'),
            v.messages.slice().reverse().map(m => h('div', { class: 'notif notif--unread', style: { cursor: 'default' } }, UI.badge('message', { iconSize: 20 }),
              h('span', { class: 'grow' }, h('span', { class: 'notif__title', style: { display: 'block' } }, 'Message from ' + store.state.users[m.from].name),
                h('span', { class: 'notif__body', style: { display: 'block' } }, m.text), h('span', { class: 'caption' }, UI.ago(m.at))))),
            inbox.length ? inbox.map(n => UI.notification(n, UI.openNotification)) : (v.messages.length ? null : h('p', { class: 'secondary' }, 'No new messages.')))));
    }
  });
})();
