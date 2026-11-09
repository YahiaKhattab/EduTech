/* Line icons (24 × 24, 2 px stroke), the same set as the Penpot design system. */
(function () {
  'use strict';
  const UI = window.UI = window.UI || {};

  const PATHS = {
    'check': '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    'x': '<path d="M6 6l12 12M18 6L6 18"/>',
    'chevron-right': '<path d="M9 6l6 6-6 6"/>',
    'chevron-down': '<path d="M6 9l6 6 6-6"/>',
    'chevron-up': '<path d="M6 15l6-6 6 6"/>',
    'arrow-left': '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
    'plus': '<path d="M12 5v14M5 12h14"/>',
    'upload': '<path d="M12 15V4M7 9l5-5 5 5"/><path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>',
    'camera': '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
    'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    'check-circle': '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
    'eye': '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    'refresh': '<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.5 4.5L20 16"/><path d="M20 20v-4h-4"/>',
    'flag': '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
    'alert': '<path d="M12 3L2 20h20L12 3z"/><path d="M12 10v4M12 17v.5"/>',
    'info': '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    'bell': '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4l2-2z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    'home': '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
    'chart': '<path d="M4 4v16h16"/><path d="M8 16v-4M12 16V8M16 16v-6"/>',
    'trend': '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    'users': '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14a6 6 0 0 1 3.5 6"/>',
    'file': '<path d="M6 3h8l5 5v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5M8.5 13h7M8.5 17h5"/>',
    'edit': '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
    'sparkle': '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/><path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z"/>',
    'lock': '<rect x="5" y="11" width="14" height="10" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    'send': '<path d="M21 3L10 14"/><path d="M21 3l-7 18-4-7-7-4 18-7z"/>',
    'image': '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5-9 9"/>',
    'trash': '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    'message': '<path d="M4 5h16v11H9l-5 4V5z"/>',
    'star': '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3z"/>',
    'book': '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z"/><path d="M4 19a2 2 0 0 1 2-2h13"/>',
    'target': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    'lightbulb': '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    'rotate': '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    /* Student view (Student New in Penpot) */
    'mail': '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    'glasses': '<circle cx="6.5" cy="14.5" r="3.8"/><circle cx="17.5" cy="14.5" r="3.8"/><path d="M10.3 14a2 2 0 0 1 3.4 0"/><path d="M2.7 13.5 5 7.5c.6-1.3 1.4-2 2.8-2"/><path d="M21.3 13.5 19 7.5c-.6-1.3-1.4-2-2.8-2"/>',
    'pencil': '<path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
    'search': '<circle cx="11" cy="11" r="7.5"/><path d="m21 21-4.6-4.6"/>',
    'hand': '<path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v6"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.4l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15"/>',
    'heart': '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/>',
    'sprout': '<path d="M7 21h10"/><path d="M12 21v-9"/><path d="M12 12c0-3.5-2.5-6-7-6 0 4 2.5 6 7 6Z"/><path d="M12 10c0-3 2.2-5.5 6.5-5.5 0 3.8-2.4 5.5-6.5 5.5Z"/>',
    'flower': '<circle cx="12" cy="8" r="2.2"/><path d="M12 5.8c0-2 1-3.3 2.3-3.3s1.7 1.6.6 3c1.7-.7 3.1.1 3.1 1.4s-1.6 1.8-3.4 1.1c1.4.9 1.5 2.6.3 3.2s-2.4-.4-2.9-2.1c-.5 1.7-1.7 2.7-2.9 2.1s-1.1-2.3.3-3.2c-1.8.7-3.4.2-3.4-1.1s1.4-2.1 3.1-1.4c-1.1-1.4-.7-3 .6-3S12 3.8 12 5.8Z"/><path d="M12 12.5V21"/><path d="M12 17c-2.2-2.4-4.7-2.4-5.6-1.6 1 1.6 3.4 2.1 5.6 1.6Zm0-1c2-2 4.4-2 5.2-1.2-.9 1.4-3.2 1.8-5.2 1.2Z"/><path d="M7 21h10"/>',
    'maths': '<path d="M4.5 7h6M7.5 4v6"/><path d="M13.5 7h6"/><path d="m5 14.5 5 5M10 14.5l-5 5"/><path d="M13.5 17h6"/><circle cx="16.5" cy="14.3" r=".6"/><circle cx="16.5" cy="19.7" r=".6"/>',
    'english': '<path d="M2.5 5h5.5a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2.5z"/><path d="M21.5 5H16a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h6.5z"/>',
    'deutsch': '<path d="M3 5.5h9"/><path d="M7.5 3v2.5"/><path d="M10.5 5.5c-1 4-3.5 7-7 9"/><path d="M5.5 9c1 2.3 2.8 4 5 5"/><path d="m21.5 21-4.5-10-4.5 10"/><path d="M14 17.5h6"/>',
    'science': '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z"/><path d="M3 21c0-3 1.9-5.4 5.1-6 2.4-.5 4.9-2 5.9-3"/>'
  };

  /* Returns an <svg> element. Icons are decorative (aria-hidden): every icon sits next to a word. */
  UI.icon = function icon(name, size) {
    const s = size || 24;
    const span = document.createElement('span');
    span.className = 'icon';
    span.style.display = 'inline-flex';
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (PATHS[name] || '') + '</svg>';
    return span;
  };
})();
