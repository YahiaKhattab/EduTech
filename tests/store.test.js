/* Run: node tests/store.test.js
   Plays the full demo story through the shared state and checks rules R1–R6. */
const S = require('../js/store.js');
let t = 0; S.setClock(() => new Date(Date.UTC(2026, 10, 2, 9, 0, t++)).toISOString());
let pass = 0, failN = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log('  ✓ ' + msg); } else { failN++; console.log('  ✗ ' + msg); } };
const A = S.actions, V = S.views;
const ID = 'maths-fractions-omar';

S.init(); A.reset();

console.log('\nStudent uploads');
ok(V.student('omar').toUpload.length === 1, 'Omar has one exam to upload');
ok(A.submitExam('omar', 'maths-fractions', 3).ok, 'submit works');
ok(V.student('omar').exams[0].status === 'Sent', 'student sees "Sent"');
ok(V.teacher().notifications[0].title.includes('Omar Khaled uploaded'), 'teacher is notified of the upload');
ok(A.runOCR(ID).ok && V.student('omar').exams[0].status === 'Read', 'after OCR the student sees "Read"');

console.log('\nTeacher verifies text (R2)');
ok(!A.confirmText(ID).ok, 'confirm text refused while 3 words are unchecked');
ok(A.resolveWord(ID, 2, '72').ok && A.resolveWord(ID, 3, '32 stickers').ok, 'resolve words 1 and 2');
ok(A.confirmText(ID).reason === 'Check all 1 highlighted words first.', 'still refused with 1 left');
ok(A.resolveWord(ID, 4, '2/3').ok, 'resolve word 3');
ok(V.exam(ID).answers.find(a => a.q === 5).text === '3/8, 1/2, 1/8', 'Q5 misread is NOT flagged (confident OCR)');
ok(A.confirmText(ID).ok, 'confirm text works when all are checked');

console.log('\nAI grading and review (R1, R3)');
let ex = V.exam(ID);
ok(Object.values(ex.marks).reduce((s, m) => s + m.ai, 0) === 18, 'AI total is 18 / 25 (72%)');
ok(JSON.stringify(ex.gaps.map(g => g.id)) === '["weakness","recurring","redflag"]', 'AI suggests weakness, recurring mistake and red flag');
ok(JSON.stringify(ex.gaps.find(g => g.id === 'weakness').basedOn) === '[4,5,7]', 'weakness is based on Q4, Q5, Q7');
ok(V.student('omar').exams[0].status === 'Teacher checking' && V.student('omar').exams[0].results === null, 'R1: student sees no grade while teacher reviews');
ok(!A.release(ID).ok, 'R3: release refused with undecided suggestions');
ok(!A.decideGap(ID, 'recurring', 'dismissed', '').ok, 'R6: dismiss without reason refused');
A.decideGap(ID, 'weakness', 'confirmed'); A.decideGap(ID, 'recurring', 'confirmed'); A.decideGap(ID, 'redflag', 'confirmed');
A.approvePractice(ID, true);
ok(A.setTeacherMark(ID, 4, 9).ok === false, 'teacher mark above max refused');
ok(A.release(ID).ok, 'release works once everything is decided');
let sv = V.student('omar').exams[0];
ok(sv.status === 'Ready' && sv.results.score === 18 && sv.results.pct === 72, 'student sees 18 / 25 (72%)');
ok(sv.results.redFlag.childLabel === 'Extra help with fractions', 'student sees the child-friendly red flag');
ok(sv.results.practice && sv.results.practice.id === 'p-compare', 'approved practice reaches the student');
ok(!('ai' in sv.results.questions[0]) && !('aiFeedback' in sv.results.questions[0]), 'R1: snapshot has no AI fields');
let pv = V.parent('ahmad');
ok(pv.redFlags.length === 1 && pv.exams.find(e => e.examId === ID).results.pct === 72, 'parent sees 72% and the confirmed red flag');
ok(pv.notifications[0].title === 'Maths results released', 'parent is notified');

console.log('\nCorrection after release (R4, R5)');
const r = A.correctText(ID, 5, '3/8, 1/2, 7/8');
ok(r.ok && JSON.stringify(r.affected) === '["Question 5 mark","Weakness","Red flag"]', 'correction flags Q5 mark, weakness and red flag (not the recurring mistake)');
ok(V.openRechecks(ID) === 3, '3 re-checks open');
sv = V.student('omar').exams[0];
ok(sv.status === 'Second look' && sv.results === null, 'student sees "Second look" and no grade');
ok(V.student('omar').notifications[0].title === 'Your teacher is taking a second look', 'student is told about the second look');
ok(V.teacher().rows[0].status === 'Re-check needed', 'teacher queue shows Re-check needed first');
ok(!A.approveNote(ID, '').ok, 'R5: note refused while re-checks are open');
ok(V.exam(ID).marks[5].suggested.mark === 2, 'AI now suggests 2 / 2 for Q5');
ok(!A.resolveMark(ID, 5, 'keep', '').ok, 'R6: keeping the old mark without a reason is refused');
ok(A.resolveMark(ID, 5, 'change').ok, 'change Q5 to 2 / 2');
ok(JSON.stringify(V.exam(ID).gaps.find(g => g.id === 'weakness').newBasedOn) === '[4,7]', 'weakness evidence would shrink to Q4, Q7');
A.resolveGap(ID, 'weakness', 'keep'); A.resolveGap(ID, 'redflag', 'keep');
ok(V.openRechecks(ID) === 0, 'all re-checks resolved');
const note = A.draftNote(ID);
ok(note === 'Your teacher took a second look and changed Question 5 from 0 to 2 points, because the computer misread your answer. Your score went from 18 to 20.', 'drafted note matches the prototype');
ok(A.approveNote(ID, note).ok, 'approve and send the note');
sv = V.student('omar').exams[0];
ok(sv.status === 'Ready' && sv.results.score === 20 && sv.results.pct === 80, 'student sees 20 / 25 (80%)');
ok(sv.results.changeNote && sv.results.changeNote.fromScore === 18, 'student sees what changed');
ok(JSON.stringify(sv.results.weakness.questions) === '[4,7]', 'weakness now based on Q4, Q7');
ok(sv.results.topics['Comparing fractions'].got === 4 && sv.results.topics['Comparing fractions'].max === 9, 'comparing fractions = 4 / 9 (44%)');
pv = V.parent('ahmad');
ok(pv.notifications[0].title === 'Maths grade updated: 72% → 80%', 'parent is told: 72% → 80%');
const hist = V.exam(ID).corrections;
ok(hist.length === 4 && hist[3].phase === 'after release' && hist[3].from === '3/8, 1/2, 1/8', 'correction history keeps all 4 changes');

console.log('\nClass support');
ok(!A.decideClassFlag('f-youssef', 'dismissed', '').ok, 'dismissing Youssef\'s flag needs a reason');
ok(A.decideClassFlag('f-youssef', 'dismissed', 'Careless mistakes').ok, 'dismiss with a reason');
ok(A.sendSupportPlan('omar', { kind: 'Extra exercises', notifyParent: true }).ok, 'send support plan');
ok(V.parent('ahmad').notifications[0].title === 'Support plan for comparing fractions', 'parent gets the support plan');
ok(A.sendMessage('ahmad', 'sherin', 'Thank you!').ok && V.teacher().messages.length === 1, 'parent message reaches the teacher');

console.log('\nGerman exam (preloaded)');
ok(V.exam('deutsch-mein-tag-lina').stage === 'read', "Lina's German exam is waiting for text verification");
A.resolveWord('deutsch-mein-tag-lina', 1, 'Straße'); A.resolveWord('deutsch-mein-tag-lina', 2, 'Ich bin müde.'); A.resolveWord('deutsch-mein-tag-lina', 3, 'Brot mit Käse');
ok(A.confirmText('deutsch-mein-tag-lina').ok, 'German text confirmed with ß and umlauts');
ok(Object.values(V.exam('deutsch-mein-tag-lina').marks).reduce((s, m) => s + m.ai, 0) === 12, 'German exam graded 12 / 12');

console.log('\nUndo and reset');
ok(A.undo().ok, 'undo works');
ok(A.decideClassFlag('f-youssef', 'suggested').ok, "undo a class flag decision");
A.reset(); ok(Object.keys(S.state.exams).join() === 'deutsch-mein-tag-lina' && V.student('omar').toUpload.length === 1, 'reset restores the starting demo');

console.log('\n' + pass + ' passed, ' + failN + ' failed');
process.exit(failN ? 1 : 0);
