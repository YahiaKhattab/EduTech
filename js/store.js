/* EduTech shared state.
   One state object for the student, teacher and parent views. Every change goes through an
   action below, is saved in the browser (localStorage) and is broadcast to other open tabs,
   so a teacher action shows up on the student and parent screens.

   Rules enforced here (not in the screens), so no screen can break them:
   R1  Students and parents only see a released snapshot, never AI suggestions.
   R2  "Confirm text" is refused until every doubtful word is resolved.
   R3  "Release" is refused until every gap and red flag is decided and no re-check is open.
   R4  Correcting text after grading marks every mark, weakness and red flag built on it "Re-check".
   R5  The note to the student is refused until all re-checks are resolved.
   R6  Dismissing a red flag, or keeping an old mark, needs a reason. */
(function (root) {
  'use strict';
  const Data = (typeof module !== 'undefined' && module.exports) ? require('./data.js') : root.EduTechData;
  const KEY = 'edutech-demo-v3';   // bump when the demo data changes, so old saved data is ignored
  const clone = o => JSON.parse(JSON.stringify(o));

  let state = null;
  let past = [];
  const listeners = new Set();
  let clock = () => new Date().toISOString();

  /* ---------- storage (wrapped: private windows and file:// can refuse it) ---------- */
  const storage = (() => { try { const ls = root.localStorage; ls.setItem('__t', '1'); ls.removeItem('__t'); return ls; } catch (e) { return null; } })();
  function save() { if (!storage) return; try { storage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } }
  function load() { if (!storage) return null; try { const s = storage.getItem(KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
  function emit() { listeners.forEach(fn => { try { fn(state); } catch (e) { console.error(e); } }); }
  if (root.addEventListener) root.addEventListener('storage', e => { if (e.key === KEY) { state = load() || clone(Data.seed); emit(); } });

  /* A fresh demo: the seed data plus the preloaded uploads. */
  function fresh() {
    state = clone(Data.seed);
    (state.preload || []).forEach(p => { submitExam(p.studentId, p.templateId, p.pages, true); if (p.read) runOCR(p.templateId + '-' + p.studentId, true); });
    past = [];
    return state;
  }
  function init() { state = load() || fresh(); save(); return state; }
  function commit(label) { save(); emit(); return { ok: true, label }; }
  function fail(reason) { return { ok: false, reason }; }
  function remember() { past.push(JSON.stringify(state)); if (past.length > 30) past.shift(); }

  /* ---------- helpers ---------- */
  const tpl = exam => state.templates[exam.templateId];
  const exam = id => state.exams[id];
  const qInfo = (ex, q) => tpl(ex).questions.find(x => x.q === q);
  const ans = (ex, q) => ex.answers.find(a => a.q === q);
  function aiFor(ex, q, text) {
    const row = (tpl(ex).ai[q] || {})[text];
    if (!row) return { mark: 0, feedback: 'The AI could not match this answer. Please check it yourself.', mistake: null, unsure: true };
    return { mark: row[0], feedback: row[1], mistake: row[2] || null, unsure: false };
  }
  function notify(to, title, body, link) { state.notifications.unshift({ id: 'n' + Date.now() + Math.random().toString(16).slice(2, 6), to, title, body, at: clock(), read: false, link: link || null }); }
  const UI_pages = n => n + (n === 1 ? ' page' : ' pages');
  const parentsOf = studentId => Object.values(state.users).filter(u => u.role === 'parent' && u.childId === studentId).map(u => u.id);
  const finalMark = m => (m.teacher !== null && m.teacher !== undefined) ? m.teacher : m.ai;
  const score = ex => Object.values(ex.marks).reduce((s, m) => s + finalMark(m), 0);
  /* Questions that show the template's weakness topic with lost marks (the AI's evidence). */
  function weaknessEvidence(ex, useSuggested) {
    const topic = (tpl(ex).conclusions.weakness || {}).topic; if (!topic) return [];
    return tpl(ex).questions.filter(qi => {
      const m = ex.marks[qi.q]; const mark = useSuggested && m.recheck ? m.suggested.mark : finalMark(m);
      return qi.topic === topic && mark < qi.max;
    }).map(qi => qi.q);
  }
  function openRechecks(ex) { return Object.values(ex.marks).filter(m => m.recheck).length + ex.gaps.filter(g => g.recheck).length; }

  /* ---------- labels shown in the views (one place, so they stay consistent) ---------- */
  function teacherStatus(ex) {
    if (ex.stage === 'released') return 'Reviewed';
    if (ex.stage === 'recheck' || (ex.marks && openRechecks(ex) > 0)) return 'Re-check needed';
    return 'To review';
  }
  function studentStatus(ex) {
    return { sent: 'Sent', read: 'Read', graded: 'Teacher checking', recheck: 'Second look', released: 'Ready' }[ex.stage] || 'Sent';
  }

  /* ---------- student actions ---------- */
  function submitExam(studentId, templateId, pages, quiet) {
    const a = state.assignments.find(x => x.studentId === studentId && x.templateId === templateId);
    if (!a) return fail('No such exam for this student.');
    const id = templateId + '-' + studentId;
    if (state.exams[id] && state.exams[id].stage !== 'sent') return fail('This exam was already sent.');
    remember();
    const t = state.templates[templateId];
    state.exams[id] = {
      id, templateId, studentId, stage: 'sent', uploadedAt: clock(), pages: pages || 3, language: t.language,
      answers: a.answers.map(x => ({ q: x.q, truth: x.truth, ocr: x.ocr, text: null, doubt: x.doubt || null, resolved: !x.doubt })),
      marks: null, gaps: [], practiceApproved: false, overallFeedback: t.overallFeedback,
      corrections: [], released: null, releasedAt: null, changeNotes: []
    };
    notify('sherin', state.users[studentId].name + ' uploaded an exam', t.subject + ' · ' + t.title + ' · ' + UI_pages(pages || 3), { view: 'teacher-verify', examId: id });
    return quiet ? { ok: true } : commit('submitExam');
  }
  /* Simulated OCR finishing (the screen calls this after a short delay). */
  function runOCR(examId, quiet) {
    const ex = exam(examId); if (!ex || ex.stage !== 'sent') return fail('Nothing to read.');
    remember(); ex.answers.forEach(a => { a.text = a.ocr; }); ex.stage = 'read';
    return quiet ? { ok: true } : commit('runOCR');
  }

  /* ---------- teacher: verify text (before grading) ---------- */
  function resolveWord(examId, q, value) {
    const ex = exam(examId); if (!ex || ex.stage !== 'read') return fail('Text can only be verified before grading.');
    const a = ans(ex, q); if (!a) return fail('No such question.'); if (!value || !value.trim()) return fail('Type the word first.');
    remember(); const from = a.text; a.text = value.trim(); a.resolved = true;
    ex.corrections.push({ at: clock(), q, from, to: a.text, phase: 'first check', affected: [] });
    return commit('resolveWord');
  }
  function confirmText(examId) {
    const ex = exam(examId); if (!ex || ex.stage !== 'read') return fail('This exam is not waiting for text verification.');
    const left = ex.answers.filter(a => !a.resolved).length; if (left) return fail('Check all ' + left + ' highlighted words first.');   // R2
    remember(); grade(ex); ex.stage = 'graded';
    return commit('confirmText');
  }
  /* Simulated AI grading + learning-gap and red-flag detection. */
  function grade(ex) {
    const t = tpl(ex); ex.marks = {};
    t.questions.forEach(qi => { const r = aiFor(ex, qi.q, ans(ex, qi.q).text); ex.marks[qi.q] = { ai: r.mark, aiFeedback: r.feedback, mistake: r.mistake, teacher: null, feedback: null, recheck: false, suggested: null, keptReason: null }; });
    const c = t.conclusions; ex.gaps = [];
    const ev = weaknessEvidence(ex, false);
    if (c.weakness && ev.length) ex.gaps.push({ id: 'weakness', kind: 'weakness', label: c.weakness.label, basedOn: ev, status: 'suggested', recheck: false, newBasedOn: null, reason: null });
    if (c.recurring) ex.gaps.push({ id: 'recurring', kind: 'recurring', label: c.recurring.label, basedOn: c.recurring.basedOn.slice(), note: c.recurring.alsoSeen, status: 'suggested', recheck: false, newBasedOn: null, reason: null });
    if (c.redFlag && ev.length >= 2) ex.gaps.push({ id: 'redflag', kind: 'redflag', label: c.redFlag.label, childLabel: c.redFlag.childLabel, basedOn: ev.slice(), note: c.redFlag.extra, status: 'suggested', recheck: false, newBasedOn: null, reason: null });
  }

  /* ---------- teacher: review grades ---------- */
  function setTeacherMark(examId, q, value) {
    const ex = exam(examId); if (!ex || !ex.marks) return fail('Not graded yet.');
    const qi = qInfo(ex, q); const v = Number(value);
    if (!Number.isFinite(v) || v < 0 || v > qi.max) return fail('Enter a mark from 0 to ' + qi.max + '.');
    const m = ex.marks[q]; if ((m.teacher != null ? m.teacher : m.ai) === v) return { ok: true, unchanged: true };   // nothing to change or undo
    remember(); m.teacher = v; return commit('setTeacherMark');
  }
  function setFeedback(examId, q, text) { const ex = exam(examId); if (!ex || !ex.marks) return fail('Not graded yet.'); remember(); ex.marks[q].feedback = text; return commit('setFeedback'); }
  function setOverallFeedback(examId, text) { const ex = exam(examId); if (!ex) return fail('No exam.'); remember(); ex.overallFeedback = text; return commit('setOverallFeedback'); }
  function approvePractice(examId, yes) { const ex = exam(examId); if (!ex || !ex.marks) return fail('Not graded yet.'); remember(); ex.practiceApproved = !!yes; return commit('approvePractice'); }
  function decideGap(examId, gapId, decision, reason) {
    const ex = exam(examId); const g = ex && ex.gaps.find(x => x.id === gapId); if (!g) return fail('No such suggestion.');
    if (decision === 'dismissed' && !(reason && reason.trim())) return fail('Give a reason for dismissing.');      // R6
    if (decision !== 'confirmed' && decision !== 'dismissed') return fail('Unknown decision.');
    remember(); g.status = decision; g.reason = decision === 'dismissed' ? reason.trim() : null; return commit('decideGap');
  }
  function canRelease(examId) {
    const ex = exam(examId); if (!ex || ex.stage !== 'graded') return fail('Only graded exams can be released.');
    const undecided = ex.gaps.filter(g => g.status === 'suggested').length; if (undecided) return fail('Confirm or dismiss the ' + undecided + ' remaining suggestion(s) first.');
    if (openRechecks(ex)) return fail('Resolve the re-checks first.');
    return { ok: true };
  }
  function release(examId) {
    const c = canRelease(examId); if (!c.ok) return c;                                                                      // R3
    remember(); const ex = exam(examId); ex.released = snapshot(ex); ex.releasedAt = clock(); ex.stage = 'released';
    const t = tpl(ex); const st = state.users[ex.studentId];
    notify(ex.studentId, 'Your ' + t.subject + ' results are ready', t.title + ' · tap to see your grade and feedback.', { view: 'student-results', examId });
    parentsOf(ex.studentId).forEach(p => notify(p, t.subject + ' results released', t.title + ' · ' + st.first + ' scored ' + ex.released.pct + '%.', { view: 'parent-results', examId }));
    return commit('release');
  }

  /* ---------- teacher: correction after grading (Correction Impact Flags) ---------- */
  function correctText(examId, q, value) {
    const ex = exam(examId); if (!ex || !ex.marks) return fail('Use Verify text before grading.');
    const a = ans(ex, q); if (!a) return fail('No such question.'); const to = (value || '').trim();
    if (!to) return fail('Type the corrected text.'); if (to === a.text) return fail('That is the same as the current text.');
    remember();
    const from = a.text; a.text = to; const affected = [];
    const m = ex.marks[q]; m.recheck = true; m.suggested = aiFor(ex, q, to); affected.push('Question ' + q + ' mark');          // R4
    const newEv = weaknessEvidence(ex, true);
    ex.gaps.forEach(g => {
      if (g.status === 'dismissed' || !g.basedOn.includes(q)) return;
      g.recheck = true; g.newBasedOn = (g.kind === 'recurring') ? g.basedOn.slice() : newEv.slice(); affected.push(g.kind === 'redflag' ? 'Red flag' : g.kind === 'weakness' ? 'Weakness' : 'Recurring mistake');
    });
    const wasReleased = ex.stage === 'released';
    ex.corrections.push({ at: clock(), q, from, to, phase: wasReleased ? 'after release' : 'after AI grading', affected });
    if (wasReleased) {
      ex.stage = 'recheck';
      notify(ex.studentId, 'Your teacher is taking a second look', 'Mrs. Sherin is checking Question ' + q + ' again. Your results will be ready soon.', { view: 'student-tracker', examId });
    }
    return Object.assign(commit('correctText'), { affected });
  }
  function resolveMark(examId, q, decision, reason) {
    const ex = exam(examId); const m = ex && ex.marks && ex.marks[q]; if (!m || !m.recheck) return fail('Nothing to re-check here.');
    if (decision === 'keep' && !(reason && reason.trim())) return fail('Say why you keep the old mark.');                        // R6
    remember();
    if (decision === 'change') { m.ai = m.suggested.mark; m.aiFeedback = m.suggested.feedback; m.mistake = m.suggested.mistake; m.teacher = m.suggested.mark; m.feedback = null; m.keptReason = null; }
    else { m.teacher = finalMark(m); m.keptReason = reason.trim(); }
    m.recheck = false; m.suggested = null; return commit('resolveMark');
  }
  function resolveGap(examId, gapId, decision, reason) {
    const ex = exam(examId); const g = ex && ex.gaps.find(x => x.id === gapId); if (!g || !g.recheck) return fail('Nothing to re-check here.');
    if (decision === 'remove' && !(reason && reason.trim())) return fail('Give a reason for removing it.');                      // R6
    remember();
    if (decision === 'keep') { g.basedOn = g.newBasedOn || g.basedOn; g.status = 'confirmed'; } else { g.status = 'dismissed'; g.reason = reason.trim(); }
    g.recheck = false; g.newBasedOn = null; return commit('resolveGap');
  }
  function draftNote(examId) {
    const ex = exam(examId); if (!ex || !ex.released) return '';
    const before = ex.released; const after = snapshot(ex);
    const changed = after.questions.filter(q => { const b = before.questions.find(x => x.q === q.q); return b && b.mark !== q.mark; });
    const parts = changed.map(q => 'Question ' + q.q + ' from ' + before.questions.find(x => x.q === q.q).mark + ' to ' + q.mark + ' points');
    if (!parts.length) return 'Your teacher took a second look at your exam. Your score did not change.';
    return 'Your teacher took a second look and changed ' + parts.join(' and ') + ', because the computer misread your answer. Your score went from ' + before.score + ' to ' + after.score + '.';
  }
  function approveNote(examId, text) {
    const ex = exam(examId); if (!ex || ex.stage !== 'recheck') return fail('There is no released grade waiting for a note.');
    if (openRechecks(ex)) return fail('Resolve the ' + openRechecks(ex) + ' re-check(s) first.');                                 // R5
    remember();
    const before = ex.released; const after = snapshot(ex); const note = (text && text.trim()) || draftNote(examId);
    const since = ex.changeNotes.length ? ex.changeNotes[ex.changeNotes.length - 1].at : ex.releasedAt;
    const fixes = ex.corrections.filter(c => c.phase === 'after release' && c.at > since).map(c => ({ q: c.q, read: c.from, written: c.to }));   // what the scanner misread
    const marks = after.questions.filter(q => q.mark !== before.questions.find(b => b.q === q.q).mark).map(q => ({ q: q.q, from: before.questions.find(b => b.q === q.q).mark, to: q.mark }));
    after.changeNote = { text: note, fromScore: before.score, toScore: after.score, fromPct: before.pct, toPct: after.pct, fixes, marks, at: clock() };
    ex.changeNotes.push(after.changeNote); ex.released = after; ex.stage = 'released';
    const t = tpl(ex); const st = state.users[ex.studentId];
    notify(ex.studentId, 'Mrs. Sherin took a second look', 'Your ' + t.subject + ' score changed from ' + before.score + ' to ' + after.score + '. Tap to see what changed.', { view: 'student-results', examId });
    parentsOf(ex.studentId).forEach(p => notify(p, t.subject + ' grade updated: ' + before.pct + '% → ' + after.pct + '%', 'The scanner misread one of ' + st.first + "'s answers. Mrs. Sherin corrected it.", { view: 'parent-results', examId }));
    return commit('approveNote');
  }

  /* ---------- teacher: class support ---------- */
  function decideClassFlag(flagId, decision, reason) {
    const f = state.classFlags.find(x => x.id === flagId); if (!f) return fail('No such flag.');
    if (decision === 'dismissed' && !(reason && reason.trim())) return fail('Give a reason for dismissing.');
    if (!['confirmed', 'dismissed', 'suggested'].includes(decision)) return fail('Unknown decision.');   // 'suggested' = undo
    remember(); f.status = decision; f.reason = decision === 'dismissed' ? reason.trim() : null; return commit('decideClassFlag');
  }
  function sendSupportPlan(studentId, plan) {
    if (!state.users[studentId]) return fail('No such student.');
    remember();
    const p = { id: 'plan-' + Date.now(), studentId, topic: plan.topic || 'Comparing fractions', kind: plan.kind || 'Extra exercises', practice: plan.practice || '5 questions', message: plan.message || '', notifyParent: !!plan.notifyParent, sentAt: clock(), status: 'active', followUp: 'after the next fractions exam' };
    state.plans.push(p);
    notify(studentId, 'Mrs. Sherin sent you practice', p.topic + ' · ' + p.practice + '.', { view: 'student-progress' });
    if (p.notifyParent) parentsOf(studentId).forEach(pid => notify(pid, 'Support plan for ' + p.topic.toLowerCase(), 'Mrs. Sherin sent ' + state.users[studentId].first + ' ' + p.practice + '. She will check again ' + p.followUp + '.', { view: 'parent-progress' }));
    return commit('sendSupportPlan');
  }
  /* Messages between a parent and the teacher. opts: { examId, replyTo } */
  function sendMessage(fromId, toId, text, opts) {
    opts = opts || {};
    const from = state.users[fromId], to = state.users[toId];
    if (!from || !to) return fail('Unknown sender or receiver.');
    if (!(text && text.trim())) return fail('Write a message first.');
    remember();
    const m = { id: 'm' + Date.now() + Math.random().toString(16).slice(2, 6), from: fromId, to: toId, text: text.trim(), at: clock(), examId: opts.examId || null, replyTo: opts.replyTo || null };
    state.messages.push(m);
    const who = from.role === 'parent' ? from.name + ' (' + state.users[from.childId].first + "'s parent)" : from.name;
    notify(toId, (opts.replyTo ? 'Reply from ' : 'Message from ') + who, m.text.slice(0, 90) + (m.text.length > 90 ? '…' : ''), { view: to.role + '-home', messageId: m.id });
    return Object.assign(commit('sendMessage'), { id: m.id });
  }
  function markRead(userId) { remember(); state.notifications.forEach(n => { if (n.to === userId) n.read = true; }); return commit('markRead'); }
  function markNotificationRead(id) { const n = state.notifications.find(x => x.id === id); if (!n || n.read) return fail('Already read.'); n.read = true; return commit('markNotificationRead'); }
  function undo() { if (!past.length) return fail('Nothing to undo.'); state = JSON.parse(past.pop()); return commit('undo'); }
  function reset() { fresh(); return commit('reset'); }

  /* ---------- the student-safe snapshot (R1) ---------- */
  function snapshot(ex) {
    const t = tpl(ex); const sc = score(ex);
    const questions = t.questions.map(qi => {
      const m = ex.marks[qi.q]; const mark = finalMark(m);
      return { q: qi.q, label: qi.label, max: qi.max, mark, topic: qi.topic, status: mark === qi.max ? 'correct' : mark === 0 ? 'notyet' : 'almost',
        feedback: m.feedback || m.aiFeedback, yourAnswer: ans(ex, qi.q).text, right: qi.right, why: qi.why || null, tip: qi.tip || null };
    });
    const topics = {}; questions.forEach(q => { (topics[q.topic] = topics[q.topic] || { got: 0, max: 0 }); topics[q.topic].got += q.mark; topics[q.topic].max += q.max; });
    const confirmed = ex.gaps.filter(g => g.status === 'confirmed');
    const w = confirmed.find(g => g.kind === 'weakness'); const rf = confirmed.find(g => g.kind === 'redflag');
    return {
      examId: ex.id, subject: t.subject, title: t.title, score: sc, max: t.max, pct: Math.round(sc / t.max * 100),
      questions, topics, strengths: Object.keys(topics).filter(k => topics[k].got === topics[k].max),
      weakness: w ? { label: w.label, questions: w.basedOn.slice() } : null,
      redFlag: rf ? { label: rf.label, childLabel: rf.childLabel, questions: rf.basedOn.slice(), note: rf.note || null,
        parentLabel: t.conclusions.redFlag.parentLabel, parentWhy: t.conclusions.redFlag.parentWhy, topic: t.conclusions.redFlag.topic } : null,
      practice: ex.practiceApproved ? t.practice : null, overallFeedback: ex.overallFeedback, changeNote: null,
      homeTip: w && t.homeTip ? (t.homeTip[w.label] || null) : null
    };
  }

  /* ---------- views (read-only selectors) ---------- */
  const views = {
    student(studentId) {
      const live = Object.values(state.exams).filter(e => e.studentId === studentId).map(e => {
        const t = tpl(e); return { examId: e.id, subject: t.subject, title: t.title, status: studentStatus(e), stage: e.stage, uploadedAt: e.uploadedAt,
          results: e.stage === 'released' ? e.released : null };                                   // R1: nothing before release, nothing during a second look
      });
      const notStarted = state.assignments.filter(a => a.studentId === studentId && !state.exams[a.templateId + '-' + studentId]).map(a => ({ templateId: a.templateId, subject: state.templates[a.templateId].subject, title: state.templates[a.templateId].title, date: state.templates[a.templateId].date }));
      return { user: state.users[studentId], exams: live, toUpload: notStarted, history: state.history.filter(h => h.studentId === studentId),
        plans: state.plans.filter(p => p.studentId === studentId), notifications: state.notifications.filter(n => n.to === studentId) };
    },
    parent(parentId) {
      const p = state.users[parentId]; const child = state.users[p.childId]; const s = views.student(p.childId);
      const status = e => e.stage === 'released' ? 'Ready' : e.stage === 'recheck' ? 'Second look' : 'Teacher checking';
      const exams = s.exams.map(e => ({ examId: e.examId, subject: e.subject, title: e.title, stage: e.stage, status: status(e), uploadedAt: e.uploadedAt, releasedAt: state.exams[e.examId].releasedAt || null,
        date: state.templates[e.examId.slice(0, -(p.childId.length + 1))].date, results: e.results }));                  // R1: results only after release
      const released = exams.filter(e => e.results).map(e => e.results);
      return { user: p, child, teacher: state.users[child.teacherId], exams,
        redFlags: released.filter(r => r.redFlag).map(r => Object.assign({ examId: r.examId }, r.redFlag)),
        history: s.history, plans: s.plans.filter(x => x.notifyParent),                                                    // only plans the teacher chose to share
        messages: state.messages.filter(m => m.from === parentId || m.to === parentId),
        notifications: state.notifications.filter(n => n.to === parentId) };
    },
    teacher() {
      const live = Object.values(state.exams).map(e => { const t = tpl(e); const doubts = e.answers.filter(a => !a.resolved).length;
        return { examId: e.id, studentId: e.studentId, student: state.users[e.studentId].name, subject: t.subject, title: t.title, stage: e.stage, status: teacherStatus(e),
          flagNote: e.stage === 'read' ? (doubts ? doubts + ' doubtful words' : 'Text looks clear') : (e.marks && openRechecks(e)) ? openRechecks(e) + ' results to re-check' : (e.gaps.find(g => g.kind === 'redflag' && g.status === 'confirmed') ? 'Red flag confirmed' : null), live: true }; });
      const others = state.otherQueue.map(o => Object.assign({}, o, { student: state.users[o.studentId].name, status: { read: 'To review', recheck: 'Re-check needed', released: 'Reviewed' }[o.stage], live: false }));
      const order = { 'Re-check needed': 0, 'To review': 1, 'Reviewed': 2 };
      const rows = live.concat(others).sort((a, b) => order[a.status] - order[b.status]);
      const counts = { 'To review': 0, 'Re-check needed': 0, 'Reviewed': 12 }; rows.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
      const liveFlags = Object.values(state.exams).filter(e => e.stage === 'released' || e.stage === 'recheck').flatMap(e => e.gaps.filter(g => g.kind === 'redflag').map(g => ({ id: e.id + ':redflag', studentId: e.studentId, label: g.label, evidence: 'Questions ' + g.basedOn.join(', ') + (g.note ? ' · ' + g.note : ''), status: g.recheck ? 'recheck' : g.status, live: true, examId: e.id })));
      return { rows, counts, classFlags: liveFlags.concat(state.classFlags), classMistakes: state.classMistakes, notifications: state.notifications.filter(n => n.to === 'sherin'), messages: state.messages.filter(m => m.to === 'sherin' || m.from === 'sherin') };
    },
    exam(examId) { return exam(examId) ? clone(exam(examId)) : null; },     // teacher detail view
    openRechecks(examId) { return exam(examId) ? openRechecks(exam(examId)) : 0; }
  };

  const api = {
    init, get state() { return state; }, subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    setClock(fn) { clock = fn; },
    actions: { submitExam, runOCR, resolveWord, confirmText, setTeacherMark, setFeedback, setOverallFeedback, approvePractice, decideGap, canRelease, release,
      correctText, resolveMark, resolveGap, draftNote, approveNote, decideClassFlag, sendSupportPlan, sendMessage, markRead, markNotificationRead, undo, reset },
    views
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.EduTech = api;
})(typeof window !== 'undefined' ? window : globalThis);
