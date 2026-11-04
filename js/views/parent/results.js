/* Parent / Exam results (prototype board "Parent / Exam results"): the released grade, what changed after a
   second look, marks by topic, the teacher's feedback and the support plan. Locked until the teacher releases it (R1). */
(function () {
  'use strict';
  const { h, icon } = UI;
  const P = UI.parent;

  function locked(e, v) {
    const second = e && e.status === 'Second look';
    return UI.card(null, h('div', { class: 'empty' },
      UI.badge(second ? 'refresh' : 'lock', { size: 'lg', bg: second ? 'recheck-bg' : null, fg: second ? 'recheck-fg' : null }),
      h('h2', null, second ? v.teacher.name + ' is taking a second look' : 'Not ready yet'),
      h('p', { class: 'body-l secondary' }, second
        ? 'She is re-checking part of this exam, so the grade is hidden for a moment. You will get an update when she has finished.'
        : 'You can see ' + v.child.first + "'s grade after " + v.teacher.name + ' has checked the exam. You will get an update.'),
      e ? UI.chip(e.status, true) : null));
  }

  /* '3/8, 1/2, 1/8' vs '3/8, 1/2, 7/8' -> ['1/8', '7/8'] (only the part that was misread). */
  function misread(read, written) {
    const a = read.split(/,\s*/), b = written.split(/,\s*/);
    if (a.length !== b.length) return [read, written];
    const i = a.findIndex((x, k) => x !== b[k]);
    return a.filter((x, k) => x !== b[k]).length === 1 ? [a[i], b[i]] : [read, written];
  }

  /* "The grade was updated after a second look" in parent words. */
  function changeText(r, v, plan) {
    const n = r.changeNote; const child = v.child.first; const t = v.teacher.name;
    const fixes = (n.fixes || []).map(f => { const [x, y] = misread(f.read, f.written); return 'the scanner read ' + child + "'s answer to Question " + f.q + ' as "' + x + '" instead of "' + y + '"'; });
    const marks = (n.marks || []).map(m => 'Question ' + m.q + ' went from ' + m.from + ' to ' + m.to + ' point' + (m.to === 1 ? '' : 's'));
    let s = fixes.length ? UI.list(fixes) + '. ' : 'The scanner misread one of ' + child + "'s answers. ";
    s = s.charAt(0).toUpperCase() + s.slice(1);
    s += t + ' corrected it and re-checked everything that depended on it: ' + (marks.length ? UI.list(marks) + ', so ' : '') + 'the grade went from ' + n.fromPct + '% to ' + n.toPct + '%.';
    if (r.redFlag) s += plan ? ' The ' + r.redFlag.topic + ' support plan stays in place.' : ' The extra support in ' + r.redFlag.topic + ' stays in place.';
    return s;
  }

  /* Marks by topic: strong topics first, then the ones still being practised. */
  function topics(r) {
    const list = Object.entries(r.topics).map(([name, t]) => ({ name, got: t.got, max: t.max, strong: t.got === t.max })).sort((a, b) => Number(b.strong) - Number(a.strong));
    return h('div', { class: 'topic-table', role: 'table', 'aria-label': 'Marks by topic' }, list.map(t => h('div', { class: 'topic-row', role: 'row' },
      h('strong', { role: 'cell' }, t.name),
      h('span', { role: 'cell', class: 'topic-row__bar' }, UI.bar(t.max ? t.got / t.max : 0, t.strong ? 'success-fg' : 'warning-fg')),
      h('span', { role: 'cell', class: 'secondary' }, t.got + ' / ' + t.max),
      h('span', { role: 'cell' }, t.strong ? UI.pill('Strong', 'success', 'check') : UI.pill('Practising', 'warning', 'clock')))));
  }

  UI.route('parent/results', {
    role: 'parent', title: 'Exam results',
    render(examId) {
      const v = P.view(); const e = v.exams.find(x => x.examId === examId);
      const page = h('main', { class: 'page' }, UI.backLink('#/parent/home', 'Back to Home'));
      if (!e || !e.results) { page.appendChild(locked(e, v)); return page; }

      const r = e.results; const n = r.changeNote; const child = v.child.first; const teacher = v.teacher.name;
      const plan = v.plans.filter(p => p.status === 'active').pop();
      const strong = Object.keys(r.topics).filter(k => r.topics[k].got === r.topics[k].max);
      const weak = Object.keys(r.topics).filter(k => r.topics[k].got < r.topics[k].max);

      page.appendChild(h('div', { class: 'page__head' },
        h('div', null, h('h1', null, child + "'s results · " + r.subject + ' · ' + r.title),
          h('p', { class: 'secondary' }, 'Checked by ' + teacher + ' on ' + UI.day(e.releasedAt) + (n ? ' · updated ' + UI.day(n.at) : ''))),
        UI.chip('Teacher confirmed', true)));

      if (n) page.appendChild(h('section', { class: 'callout callout--recheck', 'aria-labelledby': 'changed-title' },
        UI.badge('refresh', { fg: 'recheck-fg' }),
        h('div', { class: 'stack-sm grow' },
          h('h2', { id: 'changed-title', style: { color: 'var(--recheck-fg)', fontSize: 'var(--fs-h3)' } }, 'The grade was updated after a second look'),
          h('p', null, changeText(r, v, plan)))));

      const left = h('div', { class: 'stack' },
        UI.card(null, h('div', { class: 'grade' },
          h('div', { class: 'grade__ring', role: 'img', 'aria-label': r.score + ' out of ' + r.max }, h('span', { class: 'grade__score' }, String(r.score)), h('span', { class: 'secondary', style: { fontWeight: 600 } }, 'out of ' + r.max)),
          h('div', { class: 'stack-sm grow' }, h('p', { class: 'display' }, r.pct + '%'),
            h('p', { class: 'body-l secondary' }, (strong.length ? 'Strong in ' + UI.list(strong.map(s => s.toLowerCase())) + '. ' : '') +
              (weak.length ? UI.list(weak) + (weak.length === 1 ? ' still needs' : ' still need') + ' practice.' : 'Full marks in every topic!'))))),
        UI.card({ class: 'card card--flush' }, h('h2', { class: 'card__title' }, 'Marks by topic'), topics(r)));

      const right = h('div', { class: 'stack' },
        UI.card(null, h('div', { class: 'row' }, UI.badge('message', { size: 'sm', iconSize: 18, bg: 'brand-muted', fg: 'text-brand' }), h('h3', null, teacher + "'s feedback to " + child)),
          h('p', null, r.overallFeedback)),

        r.redFlag ? UI.card(null, h('div', { class: 'row' }, UI.badge('flag', { size: 'sm', iconSize: 18, bg: 'danger-bg', fg: 'danger-fg' }), h('h3', null, 'Support plan')),
          h('ul', { class: 'checklist' }, (plan
            ? [plan.kind + ': ' + plan.topic.toLowerCase() + ' (' + plan.practice + ')', 'Sent to ' + child + ' on ' + UI.day(plan.sentAt), 'Checked again ' + plan.followUp]
            : [teacher + ' noticed that ' + child + ' ' + r.redFlag.parentLabel + ' (Questions ' + UI.list(r.redFlag.questions.map(String)) + ').', 'She will share a support plan with you soon.'])
            .map(t => h('li', null, h('span', { style: { color: 'var(--success-fg)' } }, icon('check', 18)), h('span', null, t)))),
          UI.button({ label: 'Message ' + teacher, icon: 'message', variant: 'secondary', block: true, onClick: () => P.messageDialog(e.examId) }))
          : UI.button({ label: 'Message ' + teacher, icon: 'message', variant: 'secondary', block: true, onClick: () => P.messageDialog(e.examId) }));

      page.appendChild(h('div', { class: 'cols' }, left, right));
      return page;
    }
  });
})();
