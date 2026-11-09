/* Student Home (Student New design, M2 wireframe screen 1): greeting, upload card,
   my exams with where each one is, and the latest messages. */
(function () {
  'use strict';
  const { h, icon } = UI;
  const store = window.EduTech;
  const S = UI.S;
  const ME = 'omar';
  const MAX_CARDS = 4;

  /* An exam that is still on its way, or ready (live exam from the store). */
  function liveCard(e) {
    const ready = e.status === 'Ready';
    const updated = ready && e.results.changeNote;
    const head = h('div', { class: 's-row' }, S.subject(e.subject, 'md'),
      h('span', { class: 's-exam__title' }, h('strong', null, e.title), h('span', null, e.subject)));
    if (ready) {
      return S.card({ class: 's-card s-exam s-card--ready', 'data-exam': e.examId }, head,
        h('div', { class: 's-where__chips' }, S.chip('Ready'), updated ? S.chip('Second look', 'Updated') : null),
        h('p', { class: 's-caption' }, (e.releasedAt ? 'Checked ' + UI.day(e.releasedAt) : 'Checked by ' + S.teacher()) + (updated ? ' · one question changed' : '')),
        UI.button({ label: 'See my results', icon: 'star', href: '#/student/results/' + e.examId }));
    }
    const second = e.status === 'Second look';
    return S.card({ class: 's-card s-exam ' + (second ? 's-card--second' : 's-card--now'), 'data-exam': e.examId }, head,
      h('div', { class: 's-where' },
        h('span', { class: 's-label', style: { margin: 0 } }, 'Where is it now?'),
        S.dots(e.status),
        h('div', { class: 's-where__chips' }, S.chip(e.status))),
      h('p', { class: 's-caption' }, second ? S.teacher() + ' is checking one question again. Your result comes back when she finishes.'
        : S.sentText(e.uploadedAt) + ' · ' + S.teacher() + ' will check it soon.'),
      UI.button({ label: 'Track my exam', icon: 'arrow-right', variant: 'secondary', href: '#/student/exam/' + e.examId }));
  }

  /* An exam that was finished before this demo starts (history). */
  function historyCard(x) {
    return S.card({ class: 's-card s-exam', 'data-exam': x.id },
      h('div', { class: 's-row' }, S.subject(x.subject, 'md'),
        h('span', { class: 's-exam__title' }, h('strong', null, x.title), h('span', null, x.subject))),
      h('div', { class: 's-where__chips' }, S.chip('Ready')),
      h('p', { class: 's-caption' }, 'Checked ' + UI.day(x.date)),
      x.detail ? UI.button({ label: 'See my results', icon: 'star', variant: 'secondary', href: '#/student/results/' + x.id })
        : UI.button({ label: 'See in My Progress', icon: 'chart', variant: 'ghost', href: '#/student/progress' }));
  }

  function uploadHero(v) {
    const n = v.toUpload.length;
    return S.card({ class: 's-card s-card--sun s-hero', 'aria-labelledby': 'upload-title' },
      h('span', { class: 's-hero__art' }, S.pip('happy', 64)),
      h('div', { class: 'grow', style: { flex: '1', minWidth: '240px' } },
        h('h2', { id: 'upload-title' }, n ? 'Got an exam back?' : 'All your exams are sent'),
        h('p', { class: 's-sub' }, n ? 'Take a photo of each page and send it to ' + S.teacher() + '. '
          + (n === 1 ? 'You have 1 exam to send.' : 'You have ' + n + ' exams to send.')
          : S.teacher() + ' has everything. You can follow each exam below.')),
      n ? UI.button({ label: 'Upload my exam', icon: 'camera', size: 'lg', href: '#/student/upload' }) : null);
  }

  function messagesCard(v) {
    const list = v.notifications;
    const unread = list.filter(n => !n.read);
    const top = unread.concat(list.filter(n => n.read)).slice(0, 3);
    return S.card({ class: 's-card s-msgs-card', 'aria-labelledby': 'msgs-title' },
      h('div', { class: 's-panel__head' }, icon('bell', 26), h('h2', { id: 'msgs-title' }, 'Messages for you'),
        unread.length ? h('span', { class: 's-count' }, unread.length + ' new') : null),
      list.length ? top.map(n => S.message(n, UI.openNotification))
        : h('p', { class: 's-empty-line' }, icon('bell', 22), 'Nothing new yet. Messages from ' + S.teacher() + ' will show up here.'),
      list.length > 3 ? h('div', { class: 's-panel__foot' },
        h('button', { type: 'button', class: 'btn btn--ghost', onClick: e => { e.stopPropagation(); UI.openMessages(); } }, icon('bell', 20), 'See all messages')) : null);
  }

  UI.route('student/home', {
    role: 'student', title: 'Home',
    render() {
      const v = store.views.student(ME);
      const live = v.exams.slice().sort((a, b) => (b.uploadedAt || '').localeCompare(a.uploadedAt || ''));
      const past = v.history.slice().sort((a, b) => b.date.localeCompare(a.date));
      const cards = live.map(liveCard).concat(past.map(historyCard));
      const shown = cards.slice(0, Math.max(MAX_CARDS, live.length));

      const exams = S.card({ class: 's-card', 'aria-labelledby': 'exams-title' },
        h('div', { class: 's-row' }, h('h2', { id: 'exams-title', style: { flex: '1' } }, 'My exams'),
          cards.length > shown.length ? UI.button({ label: 'See all', icon: 'chart', variant: 'ghost', href: '#/student/progress' }) : null),
        cards.length ? h('div', { class: 's-exams' }, shown)
          : h('div', { class: 's-empty' }, S.pip('waiting', 72),
            h('div', null, h('h3', null, 'No exams yet'), h('p', { class: 's-sub' }, 'When you get an exam back, upload it here so ' + S.teacher() + ' can check it.'))));

      return h('main', { class: 'page' },
        h('div', { class: 's-hello' }, h('h1', null, 'Hi, ' + v.user.first + '!'),
          h('p', { class: 's-sub' }, 'Grade ' + v.user.grade + ' · ' + store.state.users[v.user.teacherId].name + "'s class")),
        h('div', { class: 's-cols' }, h('div', { class: 's-stack' }, uploadHero(v), exams), messagesCard(v)));
    }
  });
})();
