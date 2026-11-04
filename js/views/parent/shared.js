/* Parent view helpers (UI.parent): who is signed in, exam status in plain words,
   the "Message the teacher" dialog and the conversation with the teacher. */
(function () {
  'use strict';
  const { h, icon } = UI;
  const store = window.EduTech;
  const A = store.actions;
  const P = UI.parent = {};

  P.ME = 'ahmad';
  P.view = () => store.views.parent(P.ME);

  /* Greeting by the time of day. */
  P.greeting = function () {
    const hr = new Date().getHours();
    return hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
  };

  /* Nav: the child this parent follows (one child in the demo). */
  UI.childSwitch = function (user) {
    const child = store.state.users[user.childId];
    return h('button', { type: 'button', class: 'child-switch', title: 'Child', onClick: () => UI.toast('Only ' + child.first + ' is linked to this account in the demo.', { tone: 'info' }) },
      h('b', { class: 'child-switch__dot', 'aria-hidden': 'true' }, child.first[0]), child.first + ' · Grade ' + child.grade, icon('chevron-down', 18));
  };

  /* "Message the teacher" (Overlay / Message teacher). examId, when given, is what the message is about. */
  P.messageDialog = function (examId) {
    const v = P.view(); const teacher = v.teacher; const child = v.child;
    const ex = examId && v.exams.find(e => e.examId === examId);
    const about = 'About: ' + child.first + (ex ? ' · ' + ex.subject + ' · ' + ex.title : '');
    UI.dialog(close => {
      const area = h('textarea', { class: 'textarea', id: 'msg-text', rows: '4', 'aria-label': 'Your message to ' + teacher.name, placeholder: 'Write your message…',
        onInput: () => { send.disabled = !area.value.trim(); } });
      const send = UI.button({ label: 'Send message', icon: 'send', disabled: true, onClick: () => {
        const r = A.sendMessage(P.ME, teacher.id, area.value, { examId: examId || null });
        if (!r.ok) { UI.toast(r.reason, { tone: 'recheck' }); return; }
        close(); UI.toast('Message sent to ' + teacher.name + '.');
      } });
      return [
        h('h2', null, 'Message ' + teacher.name),
        h('p', { class: 'small secondary', style: { fontWeight: 600 } }, about),
        area,
        h('p', { class: 'small muted' }, teacher.name + ' usually replies within two school days.'),
        h('div', { class: 'dialog__foot' }, UI.button({ label: 'Cancel', variant: 'ghost', onClick: close }), send)
      ];
    });
  };

  /* The conversation with the teacher (opened from a "Reply from…" update). */
  P.threadDialog = function () {
    const v = P.view();
    UI.dialog(close => [
      h('h2', null, 'Messages with ' + v.teacher.name),
      h('div', { class: 'thread' }, v.messages.map(m => {
        const mine = m.from === P.ME; const ex = m.examId && v.exams.find(e => e.examId === m.examId);
        return h('div', { class: 'bubble' + (mine ? ' bubble--mine' : '') },
          h('span', { class: 'caption' }, (mine ? 'You' : store.state.users[m.from].name) + ' · ' + UI.ago(m.at) + (ex ? ' · ' + ex.subject + ' · ' + ex.title : '')),
          h('p', null, m.text));
      })),
      h('div', { class: 'dialog__foot' }, UI.button({ label: 'Close', variant: 'ghost', onClick: close }),
        UI.button({ label: 'Write again', icon: 'message', onClick: () => { close(); P.messageDialog(); } }))
    ]);
  };

  /* A reply from the teacher opens the conversation instead of a page. */
  UI.onNotification = function (n) {
    if (n.to !== P.ME || !(n.link && n.link.messageId)) return false;
    P.threadDialog(); UI.render(); return true;
  };
})();
