/* Hash router: '#/student/results/maths-fractions-omar' -> view 'student/results' with param.
   Views register themselves with UI.route(path, { role, nav, render }). */
(function () {
  'use strict';
  const UI = window.UI = window.UI || {};
  const routes = {};

  UI.route = (path, def) => { routes[path] = def; };
  UI.roles = () => [...new Set(Object.values(routes).map(r => r.role))];
  UI.go = hash => { if (location.hash === hash) UI.render(); else location.hash = hash; };

  /* Returns { path, param, def } for the current hash, falling back to the role's home. */
  UI.current = function current() {
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    const path = parts.slice(0, 2).join('/');
    const param = parts.slice(2).map(decodeURIComponent).join('/') || null;
    if (routes[path]) return { path, param, def: routes[path] };
    const role = UI.roles().includes(parts[0]) ? parts[0] : 'student';
    return { path: role + '/home', param: null, def: routes[role + '/home'], redirected: true };
  };

  /* Where a notification link opens. Views for later parts are listed already. */
  UI.linkFor = function linkFor(link) {
    if (!link) return null;
    const map = {
      'student-results': '#/student/results/', 'student-tracker': '#/student/exam/', 'student-progress': '#/student/progress',
      'teacher-home': '#/teacher/home', 'teacher-verify': '#/teacher/verify/', 'teacher-review': '#/teacher/review/',
      'parent-results': '#/parent/results/', 'parent-progress': '#/parent/progress', 'parent-home': '#/parent/home'
    };
    const base = map[link.view]; if (!base) return null;
    return base.endsWith('/') ? base + encodeURIComponent(link.examId || '') : base;
  };
})();
