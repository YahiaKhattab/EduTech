/* Where is my exam? (Student New design, M2 wireframe screen 3, feature S6).
   A road with four stops; Pip waits at the stop the exam has reached. The grade stays locked
   until the teacher has confirmed it (rule R1), and stays hidden during a second look. */
(function () {
  'use strict';
  const { h, icon } = UI;
  const store = window.EduTech;
  const S = UI.S;
  const ME = 'omar';

  const STOPS = [
    ['Sent', 'mail', 'Your photos arrived.'],
    ['Read', 'glasses', 'The computer read your answers.'],
    ['Teacher checking', 'pencil', 'TEACHER checks every answer.'],
    ['Ready', 'star', 'Your results are ready.']
  ];
  /* What Pip says at each stop. */
  const SAYS = {
    'Sent': 'I arrived safely! Next, the computer reads your answers.',
    'Read': 'Your answers are read. TEACHER will check them soon.',
    'Teacher checking': 'TEACHER is checking your answers now.',
    'Second look': 'TEACHER is checking one question again, to make sure your mark is right.',
    'Ready': 'All done! Your results are ready.'
  };
  /* The banner after sending is shown once, for the exam that was just sent. */
  window.addEventListener('hashchange', () => { if (!/student\/exam\//.test(location.hash)) S.justSent = null; });

  function road(e) {
    const at = S.stepIndex(e.status);            // 0..3, or 4 when Ready
    const now = Math.min(at, 3);
    const teacher = S.teacher();
    const list = h('ol', { class: 's-road', 'aria-label': 'Where is my exam?' },
      h('li', { class: 's-road__track', 'aria-hidden': 'true' }, h('span', { class: 's-road__fill', style: { width: Math.round(now / 3 * 100) + '%' } })));
    STOPS.forEach(([label, ic, caption], i) => {
      const done = i < at || (at === 4 && i === 3);
      const here = i === now;
      const second = here && e.status === 'Second look';
      const tone = second ? 'second' : S.tone(label);
      const name = second ? 'Second look' : label;
      list.appendChild(h('li', { class: 's-stop' + (done ? ' s-stop--done' : '') + (here ? ' s-stop--here s-stop--' + tone : ''), 'aria-current': here ? 'step' : null },
        h('div', { class: 's-stop__slot' }, here ? [h('p', { class: 's-bubble' }, SAYS[e.status].replace('TEACHER', teacher)), S.pip(e.status === 'Ready' || e.status === 'Sent' || e.status === 'Read' ? 'happy' : 'waiting', 56)] : null),
        h('span', { class: 's-stop__dot' }, icon(done && !here ? 'check' : second ? 'search' : ic, 28)),
        h('strong', { class: 's-stop__name' }, name),
        h('span', { class: 's-stop__caption' }, second ? teacher + ' is taking a second look.' : caption.replace('TEACHER', teacher)),
        h('span', { class: 'sr-only' }, done && !here ? '(done)' : here ? '(now)' : '(not yet)')));
    });
    return list;
  }

  UI.route('student/exam', {
    role: 'student', title: 'Where is my exam?',
    render(examId) {
      const v = store.views.student(ME);
      const e = v.exams.find(x => x.examId === examId);
      const back = UI.backLink('#/student/home', 'Back to Home');
      if (!e) return h('main', { class: 'page' }, back,
        S.card({ class: 's-card s-empty' }, S.pip('waiting', 72), h('div', null, h('h2', null, 'We could not find this exam'),
          h('p', { class: 's-sub' }, 'It may have been removed when the demo was reset.'))));

      const teacher = S.teacher();
      const ready = e.status === 'Ready'; const second = e.status === 'Second look';
      const t = store.state.templates[e.templateId];
      const pages = store.state.exams[e.examId] ? store.state.exams[e.examId].pages : null;

      const banner = S.justSent === e.examId && !ready ? S.card({ class: 's-card s-card--ready s-banner', role: 'status' },
        h('span', { class: 's-banner__icon' }, icon('check', 28)),
        h('div', null, h('strong', null, 'Your exam was sent!'), h('span', null, teacher + ' got ' + (pages ? UI.plural(pages, 'page') : 'your pages') + ' of ' + e.title + '.'))) : null;

      const secondCard = second ? S.card({ class: 's-card s-card--second', 'aria-labelledby': 'second-title' },
        h('div', { class: 's-row' }, h('span', { class: 's-banner__icon', style: { background: '#fff', color: 'var(--s-second-fg)' } }, icon('search', 26)),
          h('h2', { id: 'second-title', style: { color: 'var(--s-second-fg)' } }, teacher + ' is taking a second look')),
        h('p', { class: 's-sub', style: { color: 'var(--s-ink)' } }, 'She is checking one question again to make sure your mark is right. Nothing is wrong. Your result is hidden until she finishes, and you will get a message.')) : null;

      const results = S.card({ class: 's-card s-next' + (ready ? ' s-card--ready' : ''), 'aria-labelledby': 'next-title' },
        h('h2', { id: 'next-title' }, ready ? 'Your results are ready' : 'Your results'),
        h('p', { class: 's-sub', id: 'lock-hint' }, ready ? teacher + ' checked your exam and left you feedback.'
          : 'You can see your results after ' + teacher + ' has checked your exam.'),
        h('div', null, ready ? UI.button({ label: 'See my results', icon: 'star', size: 'lg', href: '#/student/results/' + e.examId })
          : UI.button({ label: 'See my results', icon: 'lock', size: 'lg', disabled: true, describedBy: 'lock-hint' })));

      const info = S.card({ class: 's-card s-facts' }, h('h3', null, 'About this exam'),
        h('dl', null,
          h('div', null, h('dt', null, 'Subject'), h('dd', null, e.subject)),
          h('div', null, h('dt', null, 'Sent'), h('dd', null, UI.ago(e.uploadedAt))),
          pages ? h('div', null, h('dt', null, 'Pages'), h('dd', null, String(pages))) : null,
          t ? h('div', null, h('dt', null, 'Language'), h('dd', null, t.language === 'de' ? 'Deutsch' : 'English')) : null,
          h('div', null, h('dt', null, 'Teacher'), h('dd', null, teacher))));

      return h('main', { class: 'page' }, back, banner,
        h('div', { class: 's-title' }, S.subject(e.subject, 'lg'),
          h('div', { style: { flex: '1', minWidth: '220px' } }, h('h1', null, e.title), h('p', { class: 's-sub' }, e.subject + ' · ' + S.sentText(e.uploadedAt))),
          S.chip(e.status, null, true)),
        S.card({ class: 's-card', 'aria-labelledby': 'road-title' }, h('h2', { id: 'road-title' }, 'Where is my exam?'), road(e)),
        secondCard,
        h('div', { class: 's-cols' }, results, info));
    }
  });
})();
