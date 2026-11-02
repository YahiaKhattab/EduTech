/* Dates and small text helpers. */
(function () {
  'use strict';
  const UI = window.UI = window.UI || {};
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  /* '2026-10-30' -> '30 October' */
  UI.day = iso => { if (!iso) return ''; const d = new Date(iso); return d.getDate() + ' ' + MONTHS[d.getMonth()]; };
  UI.shortDay = iso => { if (!iso) return ''; const d = new Date(iso); return d.getDate() + ' ' + MONTHS[d.getMonth()].slice(0, 3); };

  /* ISO time -> 'Just now', '5 minutes ago', 'Today, 10:15', '30 October' */
  UI.ago = iso => {
    if (!iso) return '';
    const d = new Date(iso); const mins = Math.round((Date.now() - d.getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + ' minute' + (mins === 1 ? '' : 's') + ' ago';
    const sameDay = new Date().toDateString() === d.toDateString();
    if (sameDay) return 'Today, ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    return UI.day(iso);
  };

  UI.pct = (got, max) => Math.round(got / max * 100);
  UI.plural = (n, word) => n + ' ' + word + (n === 1 ? '' : 's');
  /* ['a','b','c'] -> 'a, b and c' */
  UI.list = arr => arr.length < 2 ? arr.join('') : arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
})();
