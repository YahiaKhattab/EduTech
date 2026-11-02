/* Student Home: greeting, upload card, my exams, notifications (wireframe screen 1). */
(function () {
  'use strict';
  const { h, icon } = UI;
  const store = window.EduTech;
  const ME = 'omar';

  function examRow(e) {
    const ready = e.status === 'Ready';
    const href = ready ? '#/student/results/' + e.examId : '#/student/exam/' + e.examId;
    return h('a', { class: 'list-row', href },
      UI.badge('file', { bg: ready ? 'brand-muted' : 'bg-subtle', fg: ready ? 'text-brand' : 'icon-default' }),
      h('span', { class: 'grow' },
        h('h3', null, e.subject + ' · ' + e.title),
        h('span', { class: 'secondary', style: { display: 'block', fontSize: 'var(--fs-body)' } },
          ready ? 'Results ready · ' + e.results.score + ' / ' + e.results.max : 'Sent ' + UI.ago(e.uploadedAt).toLowerCase().replace(/^today, /, 'today at '))),
      ready && e.results.changeNote ? UI.chip('Second look', false, 'Updated') : null,
      UI.chip(e.status),
      icon('chevron-right', 24));
  }

  function historyRow(x) {
    return h('a', { class: 'list-row', href: '#/student/progress' },
      UI.badge('file', { bg: 'brand-muted', fg: 'text-brand' }),
      h('span', { class: 'grow' }, h('h3', null, x.subject + ' · ' + x.title),
        h('span', { class: 'secondary', style: { display: 'block', fontSize: 'var(--fs-body)' } }, 'Checked ' + UI.day(x.date) + ' · ' + x.score + ' / ' + x.max)),
      UI.chip('Ready'), icon('chevron-right', 24));
  }

  UI.route('student/home', {
    role: 'student', title: 'Home',
    render() {
      const v = store.views.student(ME);
      const hasExams = v.exams.length || v.history.length;
      const recent = v.history.slice().sort((a, b) => b.date.localeCompare(a.date));
      const unread = v.notifications.filter(n => !n.read).length;

      return h('main', { class: 'page' },
        h('div', null, h('p', { class: 'display' }, 'Hi, ' + v.user.first + '!'),
          h('p', { class: 'body-l secondary' }, 'Grade ' + v.user.grade + ' · ' + store.state.users[v.user.teacherId].name + "'s class")),

        h('section', { class: 'upload-hero', 'aria-labelledby': 'upload-title' },
          UI.badge('upload', { size: 'lg' }),
          h('div', { class: 'grow' }, h('h2', { id: 'upload-title' }, 'Upload your exam'),
            h('p', { class: 'body-l secondary' }, v.toUpload.length ? 'Take a photo of each page and send it to your teacher.' : 'You have sent all your exams. Well done!')),
          UI.button({ label: 'Upload exam', icon: 'upload', size: 'lg', href: '#/student/upload', disabled: !v.toUpload.length })),

        h('div', { class: 'cols' },
          UI.card(null, h('h2', null, 'My exams'),
            hasExams ? h('div', { class: 'stack-sm' }, v.exams.map(examRow), recent.map(historyRow))
              : h('div', { class: 'empty' }, UI.badge('file', { size: 'lg' }), h('h3', null, 'No exams yet'),
                h('p', { class: 'body-l secondary' }, 'When you get an exam back, upload it here so your teacher can check it.'),
                UI.button({ label: 'Upload my first exam', icon: 'upload', variant: 'secondary', size: 'lg', href: '#/student/upload' }))),

          UI.card(null,
            h('div', { class: 'card__head' }, h('h2', null, 'Notifications'), unread ? UI.pill(unread + ' new', 'brand') : null),
            v.notifications.length ? h('div', { class: 'stack-sm' }, v.notifications.slice(0, 5).map(n => UI.notification(n, UI.openNotification)))
              : h('p', { class: 'body-l secondary' }, 'Nothing new yet. Messages from your teacher will show up here.'))));
    }
  });
})();
