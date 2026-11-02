/* EduTech demo data (seed).
   Everything the three views show comes from here plus the actions in store.js.
   OCR and AI results are simulated (allowed by the brief): each answer has a fixed
   OCR reading, and the "AI" looks up a mark and feedback for the text it is given. */
(function (root) {
  'use strict';

  const users = {
    omar: { id: 'omar', role: 'student', name: 'Omar Khaled', first: 'Omar', grade: 4, className: '4B', teacherId: 'sherin' },
    sherin: { id: 'sherin', role: 'teacher', name: 'Mrs. Sherin', className: '4B', classSize: 18 },
    ahmad: { id: 'ahmad', role: 'parent', name: 'Mr. Ahmad', childId: 'omar' },
    lina: { id: 'lina', role: 'student', name: 'Lina Hassan', first: 'Lina', grade: 4, className: '4B' },
    nour: { id: 'nour', role: 'student', name: 'Nour Ibrahim', first: 'Nour', grade: 4, className: '4B' },
    youssef: { id: 'youssef', role: 'student', name: 'Youssef Adel', first: 'Youssef', grade: 4, className: '4B' },
    mariam: { id: 'mariam', role: 'student', name: 'Mariam Fathy', first: 'Mariam', grade: 4, className: '4B' },
    ali: { id: 'ali', role: 'student', name: 'Ali Mostafa', first: 'Ali', grade: 4, className: '4B' }
  };

  /* ---------- The Maths exam used in every demo flow ---------- */
  const fractionsTemplate = {
    id: 'maths-fractions', subject: 'Maths', title: 'Fractions and Word Problems', date: '2026-10-30', language: 'en', max: 25,
    practice: { id: 'p-compare', title: 'Comparing fractions with different denominators', size: '5 questions · about 10 minutes' },
    questions: [
      { q: 1, label: 'Multiplication: 6 × 7', max: 2, topic: 'Multiplication', right: '42' },
      { q: 2, label: 'Multiplication: 24 × 3', max: 3, topic: 'Multiplication', right: '72' },
      { q: 3, label: 'Word problem: stickers', max: 4, topic: 'Word problems', right: '32 stickers' },
      { q: 4, label: 'Which is bigger: 3/4 or 2/3?', max: 3, topic: 'Comparing fractions', right: '3/4 is bigger',
        why: '3/4 = 9/12 and 2/3 = 8/12. 9/12 is more than 8/12, so 3/4 is bigger.', tip: 'Make the bottom numbers the same first, then compare the top numbers.' },
      { q: 5, label: 'Put in order: 1/2, 3/8, 7/8', max: 2, topic: 'Comparing fractions', right: '3/8, 1/2, 7/8',
        why: '1/2 is the same as 4/8, so the order is 3/8, 4/8, 7/8.', tip: 'Turn every fraction into eighths before ordering.' },
      { q: 6, label: 'Shade 2/5 of the shape', max: 3, topic: 'Shading fractions', right: '2 of 5 parts shaded' },
      { q: 7, label: 'Compare 5/6 and 7/8', max: 4, topic: 'Comparing fractions', right: '7/8 is bigger',
        why: '5/6 = 20/24 and 7/8 = 21/24, so 7/8 is a little bigger.', tip: 'A bigger bottom number does not always mean a smaller fraction: compare with the same denominator.' },
      { q: 8, label: 'Word problem: pizza slices', max: 4, topic: 'Word problems', right: '3 slices' }
    ],
    /* Simulated AI: text it receives -> mark + feedback. Unknown text gets 0 and a "please check" note. */
    ai: {
      1: { '42': [2, 'Correct!'] },
      2: { '72': [3, 'Correct!'], '12': [0, '24 × 3 is not 12. Try 20 × 3 + 4 × 3.'] },
      3: { '32 stickers': [4, 'Correct, and you wrote the unit.'], '37 stickers': [0, '4 packs of 8 is 32, not 37.'] },
      4: { '2/3': [0, 'You chose 2/3, but 3/4 is bigger. Make the bottom numbers the same first: 3/4 = 9/12 and 2/3 = 8/12.', 'Comparing fractions'],
           '2/5': [0, '3/4 is bigger. Make the bottom numbers the same first.', 'Comparing fractions'] },
      5: { '3/8, 1/2, 1/8': [0, 'The order is not right yet: 1/8 is the smallest fraction here, so it should come first.', 'Comparing fractions'],
           '3/8, 1/2, 7/8': [2, 'Correct order! 3/8 is the smallest and 7/8 is the biggest.'] },
      6: { '[2 of 5 parts shaded]': [3, 'Correct shading.'] },
      7: { '5/6 is bigger': [2, 'Good working, but 7/8 is bigger: 5/6 = 20/24 and 7/8 = 21/24.', 'Comparing fractions'] },
      8: { '3 slices': [4, 'Correct!'] }
    },
    /* Which answers each AI conclusion is built on (used by Correction Impact Flags). */
    conclusions: {
      weakness: { label: 'Comparing fractions', topic: 'Comparing fractions' },
      recurring: { label: 'Thinks a bigger denominator means a bigger fraction', basedOn: [4, 7], alsoSeen: 'Also seen in the unit test on 9 October and in 3 classmates this week.' },
      redFlag: { label: 'Needs additional support in fractions', childLabel: 'Extra help with fractions', extra: 'plus the same mistake in the 9 October unit test' }
    },
    overallFeedback: 'Great job with multiplication, Omar! When you compare fractions, first make the bottom numbers the same. Then compare the top numbers. You are almost there!'
  };

  /* Omar's answers as written (truth) and as the OCR read them. */
  const omarFractionsAnswers = [
    { q: 1, truth: '42', ocr: '42' },
    { q: 2, truth: '72', ocr: '?2', doubt: { options: ['72', '12'], why: 'the 7 could be a 1' } },
    { q: 3, truth: '32 stickers', ocr: '?2 stickers', doubt: { options: ['32 stickers', '37 stickers'], why: 'the 2 could be a 7' } },
    { q: 4, truth: '2/3', ocr: '2/?', doubt: { options: ['2/3', '2/5'], why: 'the 3 could be a 5' } },
    { q: 5, truth: '3/8, 1/2, 7/8', ocr: '3/8, 1/2, 1/8' },          // confident misread: not flagged
    { q: 6, truth: '[2 of 5 parts shaded]', ocr: '[2 of 5 parts shaded]' },
    { q: 7, truth: '5/6 is bigger', ocr: '5/6 is bigger' },
    { q: 8, truth: '3 slices', ocr: '3 slices' }
  ];

  /* Lina's German exam (shows ä ö ü ß verification). */
  const germanTemplate = {
    id: 'deutsch-mein-tag', subject: 'Deutsch', title: 'Mein Tag', date: '2026-11-01', language: 'de', max: 12,
    questions: [
      { q: 1, label: 'Ergänze: Ich gehe über die ___ zur Schule.', max: 3, topic: 'Rechtschreibung', right: 'Straße' },
      { q: 2, label: 'Wie fühlst du dich am Abend?', max: 3, topic: 'Wortschatz', right: 'Ich bin müde.' },
      { q: 3, label: 'Was isst du zum Frühstück?', max: 3, topic: 'Wortschatz', right: 'Brot mit Käse' },
      { q: 4, label: 'Wann gehst du ins Bett?', max: 3, topic: 'Uhrzeit', right: 'um acht Uhr' }
    ],
    ai: {
      1: { 'Straße': [3, 'Richtig!'], 'StraBe': [1, 'Schreib ß, nicht B.'] },
      2: { 'Ich bin müde.': [3, 'Richtig!'], 'Ich bin mude.': [2, 'Vergiss die Punkte auf dem ü nicht.'] },
      3: { 'Brot mit Käse': [3, 'Richtig!'], 'Brot mit Kase': [2, 'Käse schreibt man mit ä.'] },
      4: { 'um acht Uhr': [3, 'Richtig!'] }
    },
    conclusions: {}, overallFeedback: 'Sehr gut, Lina!'
  };
  const linaGermanAnswers = [
    { q: 1, truth: 'Straße', ocr: 'Stra?e', doubt: { options: ['Straße', 'StraBe'], why: 'ß could be a B' } },
    { q: 2, truth: 'Ich bin müde.', ocr: 'Ich bin m?de.', doubt: { options: ['Ich bin müde.', 'Ich bin mude.'], why: 'the dots on ü are faint' } },
    { q: 3, truth: 'Brot mit Käse', ocr: 'Brot mit K?se', doubt: { options: ['Brot mit Käse', 'Brot mit Kase'], why: 'the dots on ä are faint' } },
    { q: 4, truth: 'um acht Uhr', ocr: 'um acht Uhr' }
  ];

  /* Exams a student can choose in the Upload screen. */
  const assignments = [
    { templateId: 'maths-fractions', studentId: 'omar', answers: omarFractionsAnswers },
    { templateId: 'deutsch-mein-tag', studentId: 'lina', answers: linaGermanAnswers }
  ];

  /* Already-finished exams (history for progress screens). Only the summary is needed. */
  const history = [
    { id: 'h1', studentId: 'omar', subject: 'Maths', title: 'Numbers to 1000', date: '2026-09-22', score: 20, max: 25, weakness: 'Carrying in multiplication' },
    { id: 'h2', studentId: 'omar', subject: 'Maths', title: 'Multiplication', date: '2026-10-09', score: 17, max: 20, weakness: null },
    { id: 'h3', studentId: 'omar', subject: 'English', title: 'Reading Comprehension', date: '2026-10-28', score: 18, max: 20, weakness: null }
  ];

  /* Other students' items so the teacher screens are not empty. Shown, not worked on, in the demo. */
  const otherQueue = [
    { id: 'x-nour', studentId: 'nour', subject: 'Science', title: 'Plants and Animals', date: '2026-10-31', stage: 'read', flagNote: 'Text looks clear' },
    { id: 'x-youssef', studentId: 'youssef', subject: 'Maths', title: 'Fractions and Word Problems', date: '2026-10-30', stage: 'recheck', flagNote: '2 results to re-check' },
    { id: 'x-mariam', studentId: 'mariam', subject: 'Maths', title: 'Fractions and Word Problems', date: '2026-10-30', stage: 'released', flagNote: 'Red flag confirmed' },
    { id: 'x-ali', studentId: 'ali', subject: 'English', title: 'Reading Comprehension', date: '2026-10-28', stage: 'released', flagNote: null }
  ];

  /* Class-level red flags from other students (Class gaps screen). */
  const classFlags = [
    { id: 'f-youssef', studentId: 'youssef', label: 'Needs additional support in fractions', evidence: 'Questions 4, 5, 7 · unit test 9 Oct', status: 'suggested' },
    { id: 'f-mariam', studentId: 'mariam', label: 'Needs additional support in fractions', evidence: 'Questions 4, 5, 7, 8', status: 'confirmed' },
    { id: 'f-ali', studentId: 'ali', label: 'Reading speed below class level', evidence: 'Reading Comprehension · 28 Oct', status: 'dismissed', reason: 'One-off: he was ill that week' }
  ];

  const classMistakes = [
    { label: 'Comparing fractions with different denominators', students: 7 },
    { label: 'Choosing the operation in word problems', students: 4 },
    { label: 'Carrying in multiplication', students: 2 }
  ];

  const seed = {
    version: 1,
    users,
    templates: { 'maths-fractions': fractionsTemplate, 'deutsch-mein-tag': germanTemplate },
    assignments, history, otherQueue, classFlags, classMistakes,
    exams: {},          // live exams, created by uploads (see store.js)
    plans: [            // support plans
      { id: 'plan-carry', studentId: 'omar', topic: 'Carrying in multiplication', kind: 'Extra exercises', sentAt: '2026-09-23', status: 'finished', notifyParent: false }
    ],
    notifications: [],
    messages: []
  };

  const api = { seed };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.EduTechData = api;
})(typeof window !== 'undefined' ? window : globalThis);
