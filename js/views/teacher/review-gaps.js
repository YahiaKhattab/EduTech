/* Grade Review · Gaps and flags tab: confirm or dismiss the AI's weakness, recurring mistake and red flag,
   and re-check them when the evidence they were built on changed (features T6, T7, T3). */
(function () {
  'use strict';
  const { h, icon } = UI;
  const store = window.EduTech;
  const A = store.actions;
  const T = UI.teacher;
  T.reviewTabs = T.reviewTabs || {};

  const KIND = {
    weakness: ['Weakness', 'target', 'brand-subtle', 'text-brand'],
    recurring: ['Recurring mistake', 'refresh', 'warning-bg', 'warning-fg'],
    redflag: ['Red flag', 'flag', 'danger-bg', 'danger-fg']
  };
  const qs = list => 'Questions ' + UI.list(list.map(String));

  function gapCard(ex, g) {
    const [kindLabel, ic, bg, fg] = KIND[g.kind];
    const first = T.firstName(ex.studentId);
    const editable = T.editable(ex);
    let chip, body, why = null, actions = [];
    if (g.recheck) {
      chip = UI.chip('Re-check needed');
      body = 'Evidence changed: it was based on ' + qs(g.basedOn) + '. With your correction, ' + (g.newBasedOn.length ? 'only ' + qs(g.newBasedOn) + ' still show' + (g.newBasedOn.length === 1 ? 's' : '') + ' it.' : 'no question shows it any more.');
      why = g.kind === 'redflag' ? 'Decide whether ' + first + ' still needs extra support with less evidence.' : 'Decide whether to keep it.';
      actions = [UI.button({ label: g.kind === 'redflag' ? 'Keep red flag' : 'Keep ' + kindLabel.toLowerCase(), onClick: () => T.done(A.resolveGap(ex.id, g.id, 'keep'), kindLabel + ' kept.') }),
        UI.button({ label: 'Remove', variant: 'ghost', onClick: () => T.askReason({ title: 'Remove this ' + kindLabel.toLowerCase() + '?', text: g.label + '. Say why, so it is clear later.', confirm: 'Remove',
          options: ['The remaining evidence is not enough', 'It was caused by the misread'], onConfirm: reason => T.done(A.resolveGap(ex.id, g.id, 'remove', reason), kindLabel + ' removed.') }) })];
    } else if (g.status === 'suggested') {
      chip = UI.chip('AI suggestion');
      body = g.kind === 'recurring' ? (g.note || '') : 'Found in ' + qs(g.basedOn) + (g.kind === 'redflag' && g.note ? ', ' + g.note : '') + '.';
      why = g.kind === 'weakness' ? 'Each wrong answer chose the fraction with the bigger bottom number as the bigger fraction.' : g.kind === 'redflag' ? first + ' will see this as "' + g.childLabel + '", with your practice plan. The words "red flag" are never shown to the child.' : null;
      actions = [UI.button({ label: g.kind === 'redflag' ? 'Confirm red flag' : 'Confirm', variant: g.kind === 'redflag' ? 'danger' : 'primary', disabled: !editable, onClick: () => T.done(A.decideGap(ex.id, g.id, 'confirmed'), kindLabel + ' confirmed.') }),
        UI.button({ label: g.kind === 'redflag' ? 'Dismiss with a reason' : 'Dismiss', variant: 'ghost', disabled: !editable, onClick: () => T.askReason({ title: 'Dismiss this ' + kindLabel.toLowerCase() + '?', text: g.label + '. Tell us why, so you and the AI can learn from it.', confirm: 'Dismiss', danger: false,
          options: ['Careless mistakes, the student knows the topic', 'One-off: the student was ill or absent', 'The AI misread the evidence'], note: first + ' will not see anything about it.', onConfirm: reason => T.done(A.decideGap(ex.id, g.id, 'dismissed', reason), kindLabel + ' dismissed. Your reason is saved.') }) })];
    } else if (g.status === 'confirmed') {
      chip = UI.chip('Teacher confirmed');
      body = g.kind === 'recurring' ? (g.note || '') : 'Based on ' + qs(g.basedOn) + (g.kind === 'redflag' && g.note ? ', ' + g.note : '') + '.';
      const touched = ex.corrections.some(c => c.phase !== 'first check' && c.affected.length) && g.kind === 'recurring';
      if (touched) body = 'Not affected by your correction. ' + body;
    } else {
      chip = UI.chip(g.kind === 'redflag' ? 'Flag dismissed' : 'Flag dismissed', false, 'Dismissed');
      body = 'Reason: ' + (g.reason || '—');
    }
    return h('section', { class: 'card gap' + (g.recheck ? ' gap--recheck' : '') + (g.status === 'dismissed' ? ' gap--dismissed' : '') },
      h('div', { class: 'row' }, UI.badge(ic, { size: 'sm', iconSize: 20, bg, fg }), h('div', { class: 'grow' }, h('span', { class: 'small secondary', style: { fontWeight: 600 } }, kindLabel), h('h3', null, g.label)), chip),
      body ? h('p', { class: 'secondary' }, body) : null,
      why ? h('div', { class: 'callout callout--info', style: { padding: '8px 12px' } }, h('span', { style: { color: g.recheck ? 'var(--recheck-fg)' : 'var(--text-brand)' } }, icon(g.recheck ? 'refresh' : 'sparkle', 16)), h('span', { class: 'small' }, why)) : null,
      actions.length ? h('div', { class: 'row row--wrap' }, actions) : null);
  }

  T.reviewTabs.gaps = function (ex) {
    const first = T.firstName(ex.studentId);
    const confirmed = ex.gaps.filter(g => g.status === 'confirmed' && !g.recheck);
    const rf = confirmed.find(g => g.kind === 'redflag'); const w = confirmed.find(g => g.kind === 'weakness');
    const preview = UI.card(null, h('h2', { style: { fontSize: 'var(--fs-h3)' } }, 'What ' + first + ' will see'),
      h('p', { class: 'small secondary' }, 'Only confirmed items reach ' + first + ', in child-friendly words.'),
      ex.stage === 'recheck' ? h('div', { class: 'callout callout--recheck', style: { padding: '10px 14px' } }, h('span', { style: { color: 'var(--recheck-fg)' } }, icon('refresh', 18)),
        h('span', { class: 'small' }, 'Right now ' + first + ' sees "Second look" instead of results. Items you keep show here again after you send the note.')) : null,
      !rf && !w ? h('p', { class: 'small muted' }, ex.stage === 'recheck' ? 'Nothing to show until you decide the re-checks.' : 'Nothing confirmed yet.') : null,
      w ? h('div', { class: 'callout callout--info', style: { padding: '12px 14px', display: 'grid', gap: '4px' } }, h('strong', { class: 'small' }, 'What to practise: ' + w.label),
        h('span', { class: 'small secondary' }, 'This was tricky in ' + qs(w.basedOn) + '.')) : null,
      rf ? h('div', { class: 'callout callout--brand', style: { padding: '12px 14px', display: 'grid', gap: '4px' } }, h('div', { class: 'row', style: { color: 'var(--text-brand)' } }, icon('flag', 18), h('strong', null, rf.childLabel)),
        h('span', { class: 'small' }, store.state.users.sherin.name + ' noticed that this needs a bit more practice. She made a short practice plan for you.')) : null);
    return h('div', { class: 'cols' },
      h('div', { class: 'stack' }, ex.gaps.length ? ex.gaps.map(g => gapCard(ex, g)) : UI.card(null, h('p', { class: 'secondary' }, 'The AI found no learning gaps or red flags in this exam.'))),
      preview);
  };
})();
