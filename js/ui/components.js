/* Reusable UI pieces. Each returns a DOM element. */
(function () {
  'use strict';
  const UI = window.UI = window.UI || {};
  const { h, icon } = UI;

  /* Button. { label, icon, variant: primary|secondary|ghost|danger, size: md|lg, disabled, onClick, href, title, block } */
  UI.button = function button(o) {
    const cls = ['btn', 'btn--' + (o.variant || 'primary'), o.size === 'lg' ? 'btn--lg' : '', o.block ? 'btn--block' : ''].join(' ').trim();
    const kids = [o.icon ? icon(o.icon, o.size === 'lg' ? 22 : 20) : null, o.label];
    if (o.href && !o.disabled) return h('a', { class: cls, href: o.href, title: o.title }, kids);
    return h('button', { type: o.type || 'button', class: cls, disabled: !!o.disabled, title: o.title, onClick: o.onClick, 'aria-describedby': o.describedBy }, kids);
  };

  /* Status chip: always icon + word + colour. Same statuses as the design system. */
  const CHIPS = {
    'Sent': ['neutral', 'upload'], 'Read': ['info', 'eye'], 'Teacher checking': ['warning', 'clock'], 'Second look': ['recheck', 'refresh'], 'Ready': ['success', 'check-circle'],
    'To review': ['warning', 'clock'], 'Re-check needed': ['recheck', 'refresh'], 'Reviewed': ['success', 'check-circle'],
    'Red flag': ['danger', 'flag'], 'Flag dismissed': ['neutral', 'x'], 'AI suggestion': ['brand', 'sparkle'], 'Teacher confirmed': ['success', 'check']
  };
  UI.chip = function chip(status, large, label) {
    const [tone, ic] = CHIPS[status] || ['neutral', 'info'];
    return h('span', { class: 'chip tone-' + tone + (large ? ' chip--lg' : '') }, icon(ic, large ? 18 : 16), label || status);
  };
  UI.pill = (label, tone, ic) => h('span', { class: 'pill tone-' + (tone || 'neutral') }, ic ? icon(ic, 16) : null, label);

  /* Round icon badge. tone sets background/colour. */
  UI.badge = function badge(ic, o) {
    o = o || {};
    const el = h('span', { class: 'badge' + (o.size ? ' badge--' + o.size : ''), 'aria-hidden': 'true' }, icon(ic, o.iconSize || (o.size === 'lg' ? 32 : o.size === 'sm' ? 18 : 24)));
    if (o.bg) el.style.background = 'var(--' + o.bg + ')';
    if (o.fg) el.style.color = 'var(--' + o.fg + ')';
    return el;
  };

  UI.card = (attrs, ...children) => h('section', Object.assign({ class: 'card' }, attrs || {}), children);

  UI.backLink = (href, label) => h('a', { class: 'back-link', href }, icon('arrow-left', 20), label);

  /* Notification row (a button: opening it marks it read). */
  UI.notification = function notification(n, onOpen) {
    return h('button', { type: 'button', class: 'notif' + (n.read ? '' : ' notif--unread'), onClick: () => onOpen(n) },
      UI.badge('message', { iconSize: 20 }),
      h('span', { class: 'grow' },
        h('span', { class: 'notif__title', style: { display: 'block' } }, n.title),
        h('span', { class: 'notif__body', style: { display: 'block' } }, n.body),
        h('span', { class: 'caption', style: { display: 'block' } }, UI.ago(n.at))),
      n.read ? null : h('span', { class: 'notif__dot' }, h('span', { class: 'sr-only' }, 'Unread')));
  };

  /* Toast messages (announced to screen readers). */
  let region = null;
  UI.toast = function toast(message, o) {
    o = o || {};
    if (!region) { region = h('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' }); document.body.appendChild(region); }
    const tone = o.tone || 'success';
    const el = h('div', { class: 'toast tone-' + tone }, icon(tone === 'info' ? 'info' : tone === 'recheck' ? 'refresh' : 'check-circle', 22), h('span', null, message),
      o.action ? h('button', { type: 'button', onClick: () => { o.action.onClick(); el.remove(); } }, o.action.label) : null);
    region.appendChild(el);
    while (region.children.length > 2) region.firstChild.remove();   // show at most two
    setTimeout(() => el.remove(), o.duration || 5000);
  };

  /* Modal dialog. Returns { close }. Escape and the backdrop close it; focus goes in and comes back. */
  const openDialogs = new Set();
  window.addEventListener('hashchange', () => openDialogs.forEach(close => close()));   // a new page never keeps an old dialog

  UI.dialog = function dialog(build) {
    const before = document.activeElement;
    const close = () => {
      if (!openDialogs.delete(close)) return;   // already closed
      backdrop.remove(); document.removeEventListener('keydown', onKey); if (before && before.isConnected && before.focus) before.focus();
    };
    openDialogs.add(close);
    const onKey = e => { if (e.key === 'Escape') close(); };
    const box = h('div', { class: 'dialog', role: 'dialog', 'aria-modal': 'true' });
    const backdrop = h('div', { class: 'dialog-backdrop', onClick: e => { if (e.target === backdrop) close(); } }, box);
    UI.append(box, build(close));
    const title = box.querySelector('h2'); if (title) { title.id = 'dialog-title'; box.setAttribute('aria-labelledby', 'dialog-title'); }
    document.body.appendChild(backdrop); document.addEventListener('keydown', onKey);
    const first = box.querySelector('button, [href], input, select, textarea'); if (first) first.focus();
    return { close };
  };

  /* Progress bar */
  UI.bar = (fraction, color) => h('div', { class: 'bar', role: 'presentation' }, h('div', { class: 'bar__fill', style: { width: Math.round(fraction * 100) + '%', background: color ? 'var(--' + color + ')' : null } }));
})();
