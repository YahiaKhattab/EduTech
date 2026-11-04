/* Parent / Home (prototype boards "Parent / Home" and "Home · message sent"):
   the teacher's support concern, recent exams (a grade only after release) and updates from school. */
(function () {
  'use strict';
  const { h, icon } = UI;
  const P = UI.parent;
  const MAX_ROWS = 4;

  /* Recent exams: exams in this demo first, then earlier ones, newest first. */
  function rows(v) {
    const live = v.exams.map(e => {
      const r = e.results;
      if (e.status === 'Ready') return { key: e.examId, title: e.subject + ' · ' + e.title, href: '#/parent/results/' + e.examId, pct: r.pct,
        sub: 'Checked ' + UI.shortDay(e.releasedAt) + (r.changeNote ? ' · updated ' + UI.shortDay(r.changeNote.at) : ''),
        chip: r.changeNote ? UI.chip('Second look', false, 'Updated after a second look') : null };
      if (e.status === 'Second look') return { key: e.examId, title: e.subject + ' · ' + e.title, href: null, pct: null,
        sub: 'Checked ' + UI.shortDay(e.releasedAt) + ' · ' + v.teacher.name + ' is taking a second look', chip: UI.chip('Second look') };
      const today = new Date(e.uploadedAt).toDateString() === new Date().toDateString();
      return { key: e.examId, title: e.subject + ' · ' + e.title, href: null, pct: null,
        sub: 'Sent ' + (today ? 'today' : UI.shortDay(e.uploadedAt)) + ' · ' + v.teacher.name + ' is checking it', chip: UI.chip('Teacher checking') };
    });
    const past = v.history.slice().sort((a, b) => b.date.localeCompare(a.date)).map(x => ({ key: x.id, title: x.subject + ' · ' + x.title,
      href: '#/parent/progress', pct: UI.pct(x.score, x.max), sub: 'Checked ' + UI.shortDay(x.date), chip: null }));
    return live.concat(past).slice(0, MAX_ROWS);
  }

  function row(x) {
    const kids = [UI.badge('file', { bg: x.href ? 'brand-muted' : 'bg-subtle', fg: x.href ? 'text-brand' : 'icon-default' }),
      h('span', { class: 'grow' }, h('h3', null, x.title), h('span', { class: 'secondary', style: { display: 'block', fontSize: 'var(--fs-body)' } }, x.sub)),
      x.chip, x.pct !== null ? h('span', { class: 'exam-pct' }, x.pct + '%') : null,
      h('span', { class: x.href ? 'row-chevron' : 'row-chevron row-chevron--off' }, icon('chevron-right', 22))];
    return x.href ? h('a', { class: 'list-row', href: x.href }, kids) : h('div', { class: 'list-row list-row--waiting' }, kids);
  }

  /* The teacher's confirmed support concern (a red flag), in parent words, with one idea for home. */
  function support(v, rf) {
    const e = v.exams.find(x => x.examId === rf.examId); const plan = v.plans.filter(p => p.status === 'active').pop();
    const tip = e && e.results.homeTip;
    return h('section', { class: 'callout callout--danger', 'aria-labelledby': 'support-title' },
      UI.badge('flag', { fg: 'danger-fg' }),
      h('div', { class: 'stack-sm grow' },
        h('div', { class: 'row row--wrap' }, h('h2', { id: 'support-title', style: { fontSize: 'var(--fs-h2)' } }, v.child.first + ' ' + rf.parentLabel),
          UI.pill('Confirmed by ' + v.teacher.name, 'success', 'check')),
        h('p', { class: 'body-l' }, (v.child.he || v.child.first) + ' ' + rf.parentWhy + '. ' + (plan
          ? v.teacher.name + ' has started a support plan: ' + plan.practice + ' this week and a check ' + plan.followUp + '.'
          : v.teacher.name + ' will share a support plan with you soon.')),
        tip ? h('div', { class: 'home-tip' }, h('span', { style: { color: 'var(--text-brand)' } }, icon('lightbulb', 22)), h('span', null, 'How you can help at home: ' + tip)) : null,
        h('div', null, UI.button({ label: 'See ' + (v.child.his || v.child.first + "'s") + ' progress', icon: 'chart', href: '#/parent/progress' }))));
  }

  UI.route('parent/home', {
    role: 'parent', title: 'Home',
    render() {
      const v = P.view();
      return h('main', { class: 'page' },
        h('div', { class: 'page__head' },
          h('div', null, h('h1', null, P.greeting() + ', ' + v.user.name),
            h('p', { class: 'secondary' }, 'Here is how ' + v.child.first + ' is doing in ' + v.teacher.name + "'s class (Grade " + v.child.className + '). You only see results ' + v.teacher.name + ' has checked.')),
          UI.button({ label: 'Message ' + v.teacher.name, icon: 'message', variant: 'secondary', onClick: () => P.messageDialog() })),

        v.redFlags.map(rf => support(v, rf)),

        h('div', { class: 'cols' },
          UI.card(null, h('h2', null, 'Recent exams'), h('div', { class: 'stack-sm' }, rows(v).map(row))),
          UI.card(null, h('h2', null, 'Updates from school'),
            v.notifications.length ? h('div', { class: 'stack-sm' }, v.notifications.slice(0, 5).map(n => UI.notification(n, UI.openNotification)))
              : h('p', { class: 'secondary' }, 'Nothing new yet. You will be told when ' + v.teacher.name + ' releases results.'))));
    }
  });
})();
