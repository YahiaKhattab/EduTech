/* My results (Student New design, M2 wireframe screen 4, features S2, S3, S8).
   Shows only the released snapshot: never AI suggestions, never during a second look (R1).
   Praise is factual (what was right), never tied to the grade. Also opens the English results
   that were checked before the demo starts (history h3). */
(function () {
  'use strict';
  const { h, icon } = UI;
  const store = window.EduTech;
  const S = UI.S;
  const ME = 'omar';
  const LOOK = { correct: ['ready', 'check', 'Correct'], almost: ['check', 'star', 'Almost'], notyet: ['second', 'refresh', 'Not yet'] };
  let picked = {};                                        // examId -> question number that is open

  const statusOf = (mark, max) => mark === max ? 'correct' : mark === 0 ? 'notyet' : 'almost';

  /* Same shape for a live exam and a history entry. */
  function fromExam(e) {
    const r = e.results; const note = r.changeNote;
    return { id: e.examId, subject: r.subject, title: r.title, score: r.score, max: r.max, pct: r.pct, checked: e.releasedAt,
      questions: r.questions, strengths: r.strengths, weakness: r.weakness, practiseNote: null, redFlag: r.redFlag,
      overallFeedback: r.overallFeedback, practice: r.practice, note,
      changed: note ? (note.text.match(/Question (\d+)/g) || []).map(s => Number(s.split(' ')[1])) : [] };
  }
  function fromHistory(x) {
    const d = x.detail;
    return { id: x.id, subject: x.subject, title: x.title, score: x.score, max: x.max, pct: UI.pct(x.score, x.max), checked: x.date, story: d.story,
      questions: d.questions.map(q => Object.assign({ status: statusOf(q.mark, q.max), feedback: null }, q)),
      strengths: d.strengths, weakness: null, practiseNote: d.practiseNote, redFlag: null, overallFeedback: d.overallFeedback, practice: null, note: null, changed: [] };
  }

  function tile(r, q, open) {
    const [tone, ic, word] = LOOK[q.status];
    const changed = r.changed.includes(q.q);
    return h('button', { type: 'button', class: 's-qtile s-qtile--' + tone, 'aria-pressed': String(open), 'aria-controls': 'q-panel',
      'aria-label': 'Question ' + q.q + ': ' + word + ', ' + q.mark + ' out of ' + q.max + (changed ? ', changed after a second look' : ''),
      onClick: () => { picked[r.id] = q.q; UI.render(); const p = document.getElementById('q-panel'); if (p) p.focus(); } },
    h('span', { class: 's-qtile__top' }, h('strong', null, 'Q' + q.q), h('span', { class: 's-qtile__icon' }, icon(ic, 18))),
    h('span', { class: 's-qtile__mark' }, q.mark + ' / ' + q.max),
    h('span', { class: 's-qtile__word' }, word),
    changed ? h('span', { class: 's-qtile__tag' }, 'Changed') : null);
  }

  function panel(r, q) {
    const [tone, , word] = LOOK[q.status];
    const changed = r.changed.includes(q.q);
    const row = (label, text, cls) => text ? h('div', { class: 's-explain__row' + (cls ? ' ' + cls : '') }, h('dt', null, label), h('dd', null, text)) : null;
    return h('section', { class: 's-explain s-explain--' + tone, id: 'q-panel', tabindex: '-1', 'aria-live': 'polite', 'aria-labelledby': 'q-panel-title' },
      h('div', { class: 's-row', style: { flexWrap: 'wrap' } }, h('h3', { id: 'q-panel-title', style: { flex: '1' } }, 'Question ' + q.q + ' · ' + q.label),
        changed ? S.chip('Second look', 'Changed') : null, h('span', { class: 's-explain__mark' }, word + ' · ' + q.mark + ' / ' + q.max)),
      q.text ? h('p', { class: 's-explain__q' }, q.text) : null,
      h('dl', null,
        row('Your answer', q.yourAnswer),
        q.status !== 'correct' ? row('Right answer', q.right, 's-explain__row--right') : null,
        row('Why', q.why),
        q.feedback && q.feedback !== q.why ? row(S.teacher() + ' says', q.feedback) : null),
      q.tip && q.status !== 'correct' ? h('p', { class: 's-explain__tip' }, h('span', { class: 's-tip__icon' }, icon('lightbulb', 22)), h('span', null, h('strong', null, 'Tip: '), q.tip)) : null);
  }

  /* Factual praise: what was fully right. Never "great job" for a number. */
  function praise(r) {
    const full = r.questions.filter(q => q.status === 'correct').length;
    const parts = ['You got ' + full + ' of ' + r.questions.length + ' questions fully right.'];
    if (r.strengths.length) parts.push('Every mark in ' + UI.list(r.strengths) + '.');
    return parts.join(' ');
  }

  function scoreCard(r) {
    return S.card({ class: 's-card s-score', 'aria-labelledby': 'score-title' },
      h('div', { class: 's-score__ring', role: 'img', 'aria-label': r.score + ' out of ' + r.max + ', ' + r.pct + ' percent' },
        h('strong', null, String(r.score)), h('span', null, 'out of ' + r.max)),
      h('div', { class: 's-stack', style: { gap: '10px' } },
        h('h2', { id: 'score-title', class: 's-score__pct' }, r.pct + '%'),
        h('p', { class: 's-sub', style: { color: 'var(--s-ink)' } }, praise(r)),
        h('div', { class: 's-where__chips' }, S.chip('Ready', 'Checked by ' + S.teacher()), r.note ? S.chip('Second look', 'Updated') : null)));
  }

  function side(r) {
    const kids = [];
    kids.push(S.card({ class: 's-card', 'aria-labelledby': 'good-title' }, h('h3', { id: 'good-title' }, 'What you are good at'),
      r.strengths.length ? r.strengths.map(s => h('div', { class: 's-tip' }, h('span', { class: 's-tip__icon', style: { background: 'var(--s-ready-bg)', color: 'var(--s-ready-fg)' } }, icon('flower', 22)), s))
        : h('p', { class: 's-caption' }, 'Keep practising. Each exam shows what you can already do.'),
      r.weakness || r.practiseNote ? [h('div', { class: 's-divider' }), h('h3', null, 'What to practise'),
        h('div', { class: 's-tip', style: { alignItems: 'flex-start' } }, h('span', { class: 's-tip__icon', style: { background: 'var(--s-check-bg)' } }, icon('sprout', 22)),
          h('div', null, r.weakness ? [h('strong', null, r.weakness.label), h('p', { class: 's-caption' }, 'This was tricky in Questions ' + UI.list(r.weakness.questions.map(String)) + '.')] : r.practiseNote))] : null));
    if (r.redFlag) kids.push(S.card({ class: 's-card s-help-card', 'aria-labelledby': 'help-title' },
      h('div', { class: 's-row' }, h('span', { class: 's-plan__icon' }, icon('hand', 26)), h('h3', { id: 'help-title' }, r.redFlag.childLabel)),
      h('p', null, S.teacher() + ' noticed that ' + (r.weakness ? r.weakness.label.toLowerCase() : 'this topic') + ' needs a bit more practice. She will help you in class, and you can ask her anytime.')));
    kids.push(S.card({ class: 's-card', 'aria-labelledby': 'from-title' },
      h('div', { class: 's-row' }, h('span', { class: 's-plan__icon', style: { background: 'var(--s-brand-tint)' } }, icon('message', 24)), h('h3', { id: 'from-title' }, 'From ' + S.teacher())),
      h('p', null, r.overallFeedback)));
    if (r.practice) kids.push(S.card({ class: 's-card', 'aria-labelledby': 'practice-title' }, h('h3', { id: 'practice-title' }, 'Practice from ' + S.teacher()),
      h('div', { class: 's-plan__topic' }, h('span', { class: 's-plan__icon' }, icon('book', 24)), h('span', null, h('strong', { style: { fontSize: '18px' } }, r.practice.title), h('span', { class: 's-caption', style: { display: 'block' } }, r.practice.size))),
      UI.button({ label: 'See practice plan', icon: 'book', variant: 'secondary', onClick: () => S.practicePlan(r.practice) })));
    return h('div', { class: 's-stack' }, kids);
  }

  UI.route('student/results', {
    role: 'student', title: 'My results',
    render(examId) {
      const v = store.views.student(ME);
      const e = v.exams.find(x => x.examId === examId);
      const past = v.history.find(x => x.id === examId && x.detail);
      const page = h('main', { class: 'page' }, UI.backLink('#/student/home', 'Back to Home'));

      if (!past && (!e || !e.results)) {          // R1: locked until the teacher releases it, hidden during a second look
        page.appendChild(S.card({ class: 's-card s-empty' }, h('span', { class: 's-hero__art', style: { background: 'var(--s-subtle)', color: 'var(--s-ink2)' } }, icon('lock', 44)),
          h('div', { class: 's-stack', style: { gap: '12px' } }, h('h2', null, 'Not ready yet'),
            h('p', { class: 's-sub' }, e && e.status === 'Second look' ? S.teacher() + ' is taking a second look. Your result comes back when she finishes.'
              : 'You can see your results after ' + S.teacher() + ' has checked your exam.'),
            e ? h('div', null, UI.button({ label: 'Where is my exam?', icon: 'arrow-right', variant: 'secondary', size: 'lg', href: '#/student/exam/' + e.examId })) : null)));
        return page;
      }

      const r = past ? fromHistory(past) : fromExam(e);
      if (!r.questions.some(q => q.q === picked[r.id])) {
        const first = r.questions.find(q => q.status !== 'correct') || r.questions[0];
        picked[r.id] = first.q;
      }
      const open = r.questions.find(q => q.q === picked[r.id]);

      page.appendChild(h('div', { class: 's-title' }, S.subject(r.subject, 'lg'),
        h('div', { style: { flex: '1', minWidth: '220px' } }, h('h1', null, r.title),
          h('p', { class: 's-sub' }, r.subject + (r.story ? ' · ' + r.story : '') + (r.checked ? ' · checked ' + UI.day(r.checked) : '') + (r.note ? ' · updated ' + UI.day(r.note.at) : ''))),
        S.chip('Ready', null, true)));

      const answers = S.card({ class: 's-card', 'aria-labelledby': 'answers-title' },
        h('div', { class: 's-row', style: { flexWrap: 'wrap' } }, h('h2', { id: 'answers-title', style: { flex: '1' } }, 'Your answers'), h('span', { class: 's-caption' }, 'Tap a question to see why')),
        h('div', { class: 's-qgrid' }, r.questions.map(q => tile(r, q, q.q === open.q))),
        panel(r, open));

      const note = r.note ? S.card({ class: 's-card s-card--second', 'aria-labelledby': 'note-title' },
        h('div', { class: 's-row' }, h('span', { class: 's-banner__icon', style: { background: '#fff', color: 'var(--s-second-fg)' } }, icon('search', 26)),
          h('h2', { id: 'note-title', style: { color: 'var(--s-second-fg)', fontSize: '22px' } }, S.teacher() + ' took a second look')),
        h('p', null, r.note.text), h('p', { class: 's-caption' }, 'Approved by ' + S.teacher() + ' · ' + UI.day(r.note.at))) : null;

      page.appendChild(h('div', { class: 's-cols' }, h('div', { class: 's-stack' }, scoreCard(r), answers, note), side(r)));
      return page;
    }
  });
})();
