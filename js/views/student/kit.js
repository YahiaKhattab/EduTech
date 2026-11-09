/* Student kit: the reusable pieces of the Student New design (Penpot page "Student New",
   board "Student components"): subject tile, status chip, journey dots, Pip, buttons,
   message items, the Messages panel and the practice-plan pop-up.
   Only the student screens use these; the teacher and parent views are untouched. */
(function () {
  'use strict';
  const { h, icon } = UI;
  const store = window.EduTech;
  const S = UI.S = {};

  /* ---------- Subject tile (Maths teal, English pink, Deutsch purple, Science green) ---------- */
  const SUBJ = { Maths: 'maths', English: 'english', Deutsch: 'deutsch', Science: 'science' };
  const SIZE = { lg: 44, md: 32, sm: 22 };
  S.subject = (subject, size) => h('span', { class: 's-subj s-subj--' + (SUBJ[subject] || 'maths') + ' s-subj--' + (size || 'md'), 'aria-hidden': 'true' },
    icon(SUBJ[subject] || 'book', SIZE[size || 'md']));

  /* ---------- Status chip: icon + word + colour (never colour alone) ---------- */
  const STATUS = { 'Sent': ['sent', 'mail'], 'Read': ['read', 'glasses'], 'Teacher checking': ['check', 'pencil'], 'Second look': ['second', 'search'], 'Ready': ['ready', 'star'] };
  S.tone = status => (STATUS[status] || STATUS.Sent)[0];
  S.statusIcon = status => (STATUS[status] || STATUS.Sent)[1];
  S.chip = (status, label, large) => h('span', { class: 's-chip s-chip--' + S.tone(status) + (large ? ' s-chip--lg' : '') }, icon(S.statusIcon(status), large ? 20 : 18), label || status);

  /* ---------- Journey dots (Sent · Read · Teacher checking · Ready) ---------- */
  S.STEPS = ['Sent', 'Read', 'Teacher checking', 'Ready'];
  S.stepIndex = status => status === 'Second look' ? 2 : status === 'Ready' ? 4 : Math.max(0, S.STEPS.indexOf(status));
  S.dots = function dots(status) {
    const at = S.stepIndex(status);
    const wrap = h('span', { class: 's-dots', role: 'img', 'aria-label': 'Step ' + Math.min(at + 1, 4) + ' of 4: ' + status });
    S.STEPS.forEach((step, i) => {
      if (i) wrap.appendChild(h('span', { class: 's-dots__line' + (i <= at ? ' s-dots__line--done' : '') }));
      const done = i < at; const now = i === at;
      wrap.appendChild(h('span', { class: 's-dot' + (done ? ' s-dot--done' : now ? ' s-dot--now s-dot--' + S.tone(status) : '') },
        done ? icon('check', 16) : now ? icon(S.statusIcon(status === 'Second look' ? 'Second look' : step), 16) : null));
    });
    return wrap;
  };

  /* ---------- Pip, the exam-paper friend (used at most once per screen, never next to a grade) ---------- */
  S.pip = function pip(mood, size) {
    const s = size || 84;
    const mouth = mood === 'waiting' ? '<circle cx="40" cy="65" r="3.5" fill="#2A2342"/>' : '<path d="M31 62q9 8 18 0" stroke="#2A2342" stroke-width="3.2" fill="none" stroke-linecap="round"/>';
    const el = h('span', { class: 's-pip', 'aria-hidden': 'true' });
    el.innerHTML = '<svg width="' + s + '" height="' + Math.round(s * 1.2) + '" viewBox="0 0 80 96" xmlns="http://www.w3.org/2000/svg">'
      + '<ellipse cx="40" cy="92" rx="28" ry="3.5" fill="#E9E1F5"/>'
      + '<path d="M9 6a5 5 0 0 1 5-5h39l18 18v64a5 5 0 0 1-5 5H14a5 5 0 0 1-5-5Z" fill="#fff" stroke="#2A2342" stroke-width="3"/>'
      + '<path d="M53 1v13a5 5 0 0 0 5 5h13" fill="#DDD6FB" stroke="#2A2342" stroke-width="3" stroke-linejoin="round"/>'
      + '<rect x="18" y="16" width="24" height="4" rx="2" fill="#DDD6FB"/><rect x="18" y="25" width="17" height="4" rx="2" fill="#DDD6FB"/>'
      + '<ellipse cx="22" cy="60" rx="6" ry="3.5" fill="#FFB8C8"/><ellipse cx="58" cy="60" rx="6" ry="3.5" fill="#FFB8C8"/>'
      + '<ellipse cx="30" cy="50" rx="3.6" ry="5" fill="#2A2342"/><ellipse cx="50" cy="50" rx="3.6" ry="5" fill="#2A2342"/>'
      + '<circle cx="31" cy="48" r="1.2" fill="#fff"/><circle cx="51" cy="48" r="1.2" fill="#fff"/>' + mouth + '</svg>';
    return el;
  };

  /* ---------- Small helpers ---------- */
  S.card = (attrs, ...kids) => h('section', Object.assign({ class: 's-card' }, attrs || {}), kids);
  S.teacher = () => store.state.users.sherin.name;
  S.sentText = iso => { const a = UI.ago(iso); return 'Sent ' + (a === 'Just now' ? 'just now' : /^Today/.test(a) ? a.replace('Today', 'today') : /ago$/.test(a) ? a : a); };
  /* 'Your English results are ready' -> how the message looks */
  S.kindOf = n => /second look/i.test(n.title) ? 'change' : /results are ready/i.test(n.title) ? 'results' : /practice/i.test(n.title) ? 'practice' : /arrived/i.test(n.title) ? 'received' : 'received';
  const KIND_ICON = { results: 'star', practice: 'book', change: 'refresh', received: 'mail' };

  /* ---------- Message item (Home card and the Messages panel) ---------- */
  S.message = function message(n, onOpen) {
    const kind = S.kindOf(n);
    return h('button', { type: 'button', class: 's-msg s-msg--' + kind + (n.read ? '' : ' s-msg--new'), onClick: () => onOpen(n) },
      h('span', { class: 's-msg__icon' }, icon(KIND_ICON[kind], 24)),
      h('span', { class: 's-msg__text' },
        h('span', { class: 's-msg__top' }, h('span', { class: 's-msg__title' }, n.title), n.read ? null : h('span', { class: 's-msg__new' }, 'New')),
        h('span', { class: 's-msg__body' }, n.body),
        h('span', { class: 's-msg__when' }, UI.ago(n.at))));
  };

  /* ---------- Messages panel (opened from the bell). New first, then "Seen before". ---------- */
  S.messagesPanel = function messagesPanel(list, o) {
    const unread = list.filter(n => !n.read);
    const seen = list.filter(n => n.read).slice(0, Math.max(0, 5 - unread.length));
    return h('div', { class: 's-panel', role: 'dialog', 'aria-label': 'Messages for you', onClick: e => e.stopPropagation() },
      h('div', { class: 's-panel__head' }, icon('bell', 26), h('h2', null, 'Messages for you'),
        unread.length ? h('span', { class: 's-count' }, unread.length + ' new') : null,
        h('button', { type: 'button', class: 's-close', 'aria-label': 'Close messages', onClick: o.onClose }, icon('x', 22))),
      !list.length ? h('p', { class: 's-empty-line' }, icon('bell', 22), 'Nothing new yet. Messages from ' + S.teacher() + ' will show up here.') : null,
      unread.map(n => S.message(n, o.onOpen)),
      unread.length && seen.length ? h('div', { class: 's-divider' }, h('span', null, 'Seen before')) : null,
      seen.map(n => S.message(n, o.onOpen)),
      unread.length ? h('div', { class: 's-panel__foot' }, UI.button({ label: 'Mark all as read', icon: 'check', variant: 'ghost', onClick: o.onMarkAll })) : null);
  };

  /* ---------- Practice plan pop-up (topic, how many questions, what and how) ---------- */
  S.practicePlan = function practicePlan(p) {
    UI.dialog(close => [
      h('div', { class: 's-dialog-head' }, h('h2', null, 'Practice plan'), h('button', { type: 'button', class: 's-close', 'aria-label': 'Close', onClick: close }, icon('x', 22))),
      h('div', { class: 's-plan__topic' }, h('span', { class: 's-plan__icon' }, icon('book', 26)),
        h('span', null, h('strong', null, p.title), h('span', { class: 's-caption', style: { display: 'block' } }, p.size + ' · from ' + S.teacher()))),
      p.what ? h('div', { class: 's-plan__what' }, h('h3', null, 'What you will practise'), h('p', null, p.what)) : null,
      p.how && p.how.length ? h('div', { class: 's-plan__how' }, h('h3', null, 'How to do it'),
        h('ol', null, p.how.map(step => h('li', null, step)))) : null,
      h('p', { class: 's-caption' }, S.teacher() + ' will give you the questions in class.'),
      h('div', { class: 'dialog__foot' }, UI.button({ label: 'Got it', icon: 'check', onClick: close }))]);
  };
})();
