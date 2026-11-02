/* Tiny DOM helper: h('div', { class: 'card' }, 'text', child, [more]) -> element.
   Text is always added as text (never as HTML), so data can't inject markup. */
(function () {
  'use strict';
  const UI = window.UI = window.UI || {};

  UI.h = function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (value === null || value === undefined || value === false) continue;
      if (key === 'class') el.className = value;
      else if (key === 'style' && typeof value === 'object') Object.assign(el.style, value);
      else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value);
      else if (key === 'dataset') Object.assign(el.dataset, value);
      else el.setAttribute(key, value === true ? '' : value);
    }
    UI.append(el, children);
    return el;
  };

  UI.append = function append(el, children) {
    for (const child of [children].flat(Infinity)) {
      if (child === null || child === undefined || child === false || child === '') continue;
      el.appendChild(child instanceof Node ? child : document.createTextNode(String(child)));
    }
    return el;
  };

  UI.clear = el => { while (el.firstChild) el.removeChild(el.firstChild); return el; };
})();
