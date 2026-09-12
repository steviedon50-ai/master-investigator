export const reveal: Reveal = {
  sequence: [
    { at: 0, text: 'IDENTITY VERIFIED' },
    { at: 900, word: 'THE' },
    { at: 1500, word: 'MASTER' },
    { at: 2100, word: 'INVESTIGATOR' },
    { at: 2700, word: 'GAME' },
    { at: 3600, title: 'THE MASTER INVESTIGATOR GAME' },
    { at: 4600, text: 'You did not name a case. You named this.' },
    { at: 5800, text: 'Advanced Code-Breaking, Research and Deduction' },
    { at: 6800, text: 'Your real cases are now available.' },
  ],
  reducedMotionFallback: {
    title: 'THE MASTER INVESTIGATOR GAME',
    lines: [
      'You did not name a case. You named this.',
      'Your real cases are now available.',
    ],
  },
  unlocks: { titleDiscovered: true, mainMenu: true, nextCaseNumber: 1 },
};
