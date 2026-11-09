/* App shell: demo bar, top navigation, and the page area. Re-renders when the hash or the shared state changes. */
(function () {
  'use strict';
  const { h, icon } = UI;
  const store = window.EduTech;

  const ROLES = [
    { id: 'student', label: 'Student', user: 'omar' },
    { id: 'teacher', label: 'Teacher', user: 'sherin' },
    { id: 'parent', label: 'Parent', user: 'ahmad' }
  ];
  const NAV = {
    student: [['Home', 'home', '#/student/home', ['student/home', 'student/upload', 'student/exam', 'student/results']], ['My Progress', 'chart', '#/student/progress', ['student/progress']]],
    teacher: [['Home', 'home', '#/teacher/home', ['teacher/home', 'teacher/verify', 'teacher/review']], ['Class gaps', 'users', '#/teacher/gaps', ['teacher/gaps']]],
    parent: [['Home', 'home', '#/parent/home', ['parent/home', 'parent/results']], ['Progress', 'chart', '#/parent/progress', ['parent/progress']]]
  };
  let bellOpen = false;

  function demoBar(role) {
    const ready = UI.roles();
    return h('div', { class: 'demo-bar' },
      h('span', { class: 'demo-bar__label' }, 'Demo · view as'),
      h('div', { class: 'role-switch', role: 'group', 'aria-label': 'Choose a role' },
        ROLES.map(r => h('button', { type: 'button', 'aria-pressed': String(r.id === role), disabled: !ready.includes(r.id),
          title: ready.includes(r.id) ? null : 'Coming in a later part', onClick: () => UI.go('#/' + r.id + '/home') }, r.label))),
      h('span', { class: 'demo-bar__spacer' }),
      UI.demoMenu ? UI.demoMenu() : null,
      h('button', { type: 'button', class: 'demo-btn', onClick: () => {
        UI.dialog(close => [h('h2', null, 'Reset the demo?'), h('p', { class: 'secondary' }, 'All uploads, grades and messages go back to the start. Use this before recording the video.'),
          h('div', { class: 'dialog__foot' }, UI.button({ label: 'Cancel', variant: 'ghost', onClick: close }),
            UI.button({ label: 'Reset demo', icon: 'rotate', variant: 'danger', onClick: () => { store.actions.reset(); close(); UI.go('#/' + role + '/home'); UI.toast('Demo reset.', { tone: 'info' }); } }))]);
      } }, 'Reset demo'));
  }

  function notificationsButton(userId) {
    const list = store.state.notifications.filter(n => n.to === userId);
    const unread = list.filter(n => !n.read).length;
    const wrap = h('div', { style: { position: 'relative' } });
    /* Student view: the bell shows how many messages are new and opens "Messages for you" (Student New design). */
    const btn = h('button', { type: 'button', class: 'icon-btn s-bell', 'aria-expanded': String(bellOpen), 'aria-label': 'Messages' + (unread ? ', ' + unread + ' new' : ''),
      onClick: e => { e.stopPropagation(); bellOpen = !bellOpen; render(); } }, icon('bell', 26), unread ? h('span', { class: 's-bell__count', 'aria-hidden': 'true' }, String(unread)) : null);
    wrap.appendChild(btn);
    if (bellOpen) wrap.appendChild(UI.S.messagesPanel(list, {
      onOpen: UI.openNotification,
      onClose: () => { bellOpen = false; render(); btnFocus(); },
      onMarkAll: () => store.actions.markRead(userId)
    }));
    return wrap;
  }

  const btnFocus = () => { const b = document.querySelector('.s-bell'); if (b) b.focus(); };
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && bellOpen) { bellOpen = false; render(); btnFocus(); } });

  UI.openMessages = () => { bellOpen = true; render(); const p = document.querySelector('.s-panel .s-close'); if (p) p.focus(); };

  UI.openNotification = function (n) {
    bellOpen = false;
    if (!n.read) store.actions.markNotificationRead(n.id);
    if (UI.onNotification && UI.onNotification(n)) return;   // a view can handle it itself (e.g. the parent opens a message)
    const target = UI.linkFor(n.link); if (target) UI.go(target); else render();
  };

  function nav(role, path) {
    const r = ROLES.find(x => x.id === role); const user = store.state.users[r.user];
    const initials = user.initials || user.name.replace(/^(Mrs?\.|Ms\.)\s*/, '').split(' ').map(w => w[0]).join('').slice(0, 2);
    return h('header', { class: 'nav' },
      h('a', { class: 'nav__logo', href: '#/' + role + '/home' }, h('span', { class: 'nav__mark' }, icon('book', 20)), 'EduTech',
        role !== 'student' ? h('span', { class: 'nav__role' }, r.label) : null),
      h('nav', { class: 'nav__links', 'aria-label': 'Main' }, NAV[role].map(([label, ic, href, paths]) =>
        h('a', { class: 'nav__link', href, 'aria-current': paths.includes(path) ? 'page' : null }, icon(ic, 20), label))),
      role === 'parent' ? h('div', { class: 'nav__user' }, UI.childSwitch ? UI.childSwitch(user) : null, h('span', { class: 'avatar', title: user.name, 'aria-label': user.name }, initials))
        : h('div', { class: 'nav__user' }, role === 'student' ? notificationsButton(user.id) : null,
          h('span', { class: 'avatar' }, role === 'student' ? user.first[0] : initials), h('span', null, role === 'student' ? user.first : user.name)));
  }

  const root = document.getElementById('app');
  function render() {
    const { path, param, def } = UI.current();
    const role = path.split('/')[0];
    document.body.className = role;
    UI.clear(root);
    let page;
    try { page = def.render(param); }
    catch (e) { console.error(e); page = h('main', { class: 'page' }, h('p', null, 'Something went wrong on this screen. Try Reset demo.')); }
    UI.append(root, [demoBar(role), nav(role, path), page]);
    document.title = (def.title ? (typeof def.title === 'function' ? def.title(param) : def.title) + ' · ' : '') + 'EduTech';
  }
  UI.render = render;

  store.init();
  store.subscribe(() => render());
  window.addEventListener('hashchange', () => { bellOpen = false; render(); window.scrollTo(0, 0); });
  document.addEventListener('click', () => { if (bellOpen) { bellOpen = false; render(); } });
  if (!location.hash) location.hash = '#/student/home';
  render();
})();
