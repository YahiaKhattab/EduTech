/* Demo helpers (not part of the product).
   1. Simulated OCR: a few seconds after a student sends an exam, its text is "read".
   2. "Shortcuts" menu: jumps Omar's Maths exam to the next stage (handy when recording the video,
      or when showing one view without clicking through the other). Every step uses the same store
      actions as the real screens, so all rules still apply. */
(function () {
  'use strict';
  const { h } = UI;
  const store = window.EduTech;
  const A = store.actions;
  const OCR_DELAY = 4000;
  const scheduled = new Set();

  /* 1. Simulated OCR */
  function scheduleOCR() {
    Object.values(store.state.exams || {}).forEach(ex => {
      if (ex.stage === 'sent' && !scheduled.has(ex.id)) {
        scheduled.add(ex.id);
        setTimeout(() => { scheduled.delete(ex.id); const e = store.state.exams[ex.id]; if (e && e.stage === 'sent') A.runOCR(ex.id); }, OCR_DELAY);
      }
    });
  }
  store.subscribe(scheduleOCR);
  setTimeout(scheduleOCR, 0);

  /* 2. Teacher shortcuts */
  const examId = 'maths-fractions-omar';
  const steps = [
    { label: "Omar uploads his Maths exam (student)", when: ex => !ex, run: () => A.submitExam('omar', 'maths-fractions', 3) },
    { label: 'Verify text and let the AI grade', when: ex => ex && ex.stage === 'read', run: () => {
      store.views.exam(examId).answers.filter(a => !a.resolved).forEach(a => A.resolveWord(examId, a.q, a.doubt.options[0]));
      return A.confirmText(examId);
    } },
    { label: 'Confirm grades, gaps and red flag, then release', when: ex => ex && ex.stage === 'graded', run: () => {
      store.views.exam(examId).gaps.filter(g => g.status === 'suggested').forEach(g => A.decideGap(examId, g.id, 'confirmed'));
      A.approvePractice(examId, true); return A.release(examId);
    } },
    { label: 'Correct the misread Question 5 (1/8 → 7/8)', when: ex => ex && ex.stage === 'released' && !ex.changeNotes.length, run: () => A.correctText(examId, 5, '3/8, 1/2, 7/8') },
    { label: 'Re-check everything and send the note', when: ex => ex && ex.stage === 'recheck', run: () => {
      const e = store.views.exam(examId);
      Object.entries(e.marks).filter(([, m]) => m.recheck).forEach(([q]) => A.resolveMark(examId, Number(q), 'change'));
      e.gaps.filter(g => g.recheck).forEach(g => A.resolveGap(examId, g.id, 'keep'));
      return A.approveNote(examId, A.draftNote(examId));
    } }
  ];

  let open = false;
  document.addEventListener('click', () => { if (open) { open = false; UI.render(); } });

  UI.demoMenu = function demoMenu() {
    const ex = store.state.exams[examId];
    const wrap = h('div', { class: 'demo-menu' });
    wrap.appendChild(h('button', { type: 'button', class: 'demo-btn', 'aria-expanded': String(open), onClick: e => { e.stopPropagation(); open = !open; UI.render(); } }, 'Shortcuts ▾'));
    if (open) {
      const next = steps.find(s => s.when(ex));
      wrap.appendChild(h('div', { class: 'demo-menu__list', onClick: e => e.stopPropagation() },
        h('div', { class: 'demo-menu__hint' }, ex ? "Omar's Maths exam · stage: " + ex.stage : "Omar's Maths exam is not uploaded yet."),
        steps.map(s => h('button', { type: 'button', disabled: s !== next, onClick: () => {
          open = false; const r = s.run();
          UI.toast(r && r.ok === false ? r.reason : 'Done: ' + s.label.charAt(0).toLowerCase() + s.label.slice(1) + '.', { tone: r && r.ok === false ? 'recheck' : 'info' });
          UI.render();
        } }, s.label))));
    }
    return wrap;
  };
})();
