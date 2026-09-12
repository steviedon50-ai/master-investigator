/**
 * CASE 000 — IDENTITY UNKNOWN
 *
 * The one hand-authored investigation. Identical for every player.
 * Everything from Case 001 onward comes from the seeded generator.
 *
 * Every puzzle names the document it depends on, and the player must open
 * that document to find the clue. The puzzle screen never duplicates it.
 */

import type {
  CaseFile,
  CaseGraph,
  Evidence,
  Investigation,
  InvestigationDocument,
  Puzzle,
  Reveal,
} from '../engine/types';

export const CASE_000_ID = 'case-000';
export const AUTHORED_VERSION = 'authored-v1';

export const caseFile: CaseFile = {
  id: CASE_000_ID,
  number: 0,
  procedural: false,
  difficulty: 'apprentice',
  estimatedMinutes: 15,
  title: { key: 'case000.title', fallback: 'Identity unknown' },
  strapline: { key: 'case000.strapline', fallback: 'Case 000' },
  briefing: {
    key: 'case000.briefing',
    fallback:
      'A dossier was left for you. No covering letter, no sender, no case name — only a number. ' +
      'The material inside concerns a break-in at a records archive on the night of 14 March 1873. ' +
      'Nothing was taken. Somebody wants to know whether you can read what is in front of you.\n\n' +
      'Work the evidence. The dossier will tell you what it is called.',
  },
  objectives: [
    { id: 'obj-read', label: 'Read the case file', auto: true },
    { id: 'obj-evidence', label: 'Examine every item of evidence' },
    { id: 'obj-words', label: 'Recover four concealed words' },
    { id: 'obj-herring', label: 'Identify the unreliable source' },
    { id: 'obj-final', label: 'Submit the name of this investigation' },
  ],
  scoring: {
    base: 100,
    hintPenalties: { direction: 5, technique: 10, strong: 20, reveal: 40 },
    wrongAnswerPenalty: 3,
    wrongAnswerFloor: 15,
    parTimeSeconds: 900,
    timeBonusMax: 5,
    redHerringBonus: 5,
    contradictionBonus: 5,
    connectionBonus: 5,
  },
};

export const evidence: Evidence[] = [
  {
    id: 'ev-telegram',
    kind: 'document',
    documentId: 'doc-telegram',
    name: 'Telegram, Post Office form',
    summary: 'Franked 13 March 1873. Three groups of marks below the message line.',
    revealedBy: null,
    status: 'unresolved',
    tags: ['date', 'cipher'],
  },
  {
    id: 'ev-statement',
    kind: 'document',
    documentId: 'doc-statement',
    name: 'Witness statement — night porter',
    summary: 'Six numbered lines, signed but not dated.',
    revealedBy: null,
    status: 'unresolved',
    tags: ['witness', 'document'],
  },
  {
    id: 'ev-cutting',
    kind: 'document',
    documentId: 'doc-cutting',
    name: 'Newspaper cutting',
    summary: 'Reports the break-in. Dates it to the night of 14 March 1874.',
    revealedBy: null,
    status: 'unresolved',
    tags: ['date', 'press'],
    authoring: { unreliable: true, reason: 'year-conflict' },
  },
  {
    id: 'ev-watch',
    kind: 'object',
    name: 'Pocket watch, stopped at 2:40',
    summary: 'Found in the yard. Engraved with the initials J.R.',
    revealedBy: null,
    status: 'unresolved',
    tags: ['object'],
    authoring: { redHerring: true, reason: 'irrelevant' },
  },
  {
    id: 'ev-register',
    kind: 'document',
    documentId: 'doc-register',
    name: 'Hotel register, page 41',
    summary: 'One entry for the night of the 13th has no address beside it.',
    revealedBy: 'pz-morse',
    status: 'unresolved',
    tags: ['person', 'wordplay'],
  },
  {
    id: 'ev-notebook',
    kind: 'document',
    documentId: 'doc-notebook',
    name: 'Notebook page, four clues',
    summary: 'Four descriptions of people, no names given.',
    revealedBy: 'pz-anagram',
    status: 'unresolved',
    tags: ['research'],
  },
  {
    id: 'ev-ledger',
    kind: 'document',
    documentId: 'doc-ledger',
    name: 'Archive seal ledger',
    summary: 'Seal checked and intact, evening of 13 March 1873. Next entry: seal broken.',
    revealedBy: 'pz-research',
    status: 'unresolved',
    tags: ['date', 'record'],
  },
];

export const documents: InvestigationDocument[] = [
  {
    id: 'doc-telegram',
    style: 'telegram',
    header: 'POST OFFICE TELEGRAPHS — HANDED IN 13 MAR 1873, 9.42 P.M.',
    body:
      'ARCHIVE SEAL HOLDS. NOTHING MOVED. I WILL NOT WRITE THE NAME.\n' +
      'THE FIRST PART OF IT IS BELOW.\n\n' +
      '   -    ....    .',
    footnote: 'Received at Lombard Street office. No reply paid.',
    marks: ['fold', 'stamp'],
    hiddenClue: 'morse',
  },
  {
    id: 'doc-statement',
    style: 'typewritten',
    header: 'STATEMENT OF THE NIGHT PORTER',
    body:
      '1. Mist had settled over the yard before ten.\n' +
      '2. About that hour I heard the gate.\n' +
      '3. Someone crossed to the archive door.\n' +
      '4. Twice he stopped, as if listening.\n' +
      '5. Every light in the building was out.\n' +
      '6. Returning at dawn, I found the seal broken.',
    footnote: 'Signed, W. Ainsley. Taken at the station house.',
    marks: ['typewriter', 'age'],
    hiddenClue: 'acrostic',
  },
  {
    id: 'doc-register',
    style: 'handwritten',
    header: 'THE GRESHAM HOTEL — REGISTER, PAGE 41',
    body:
      '13 Mar — Mr H. Calloway, Bristol\n' +
      '13 Mar — Miss E. Pardoe, Leeds\n' +
      '13 Mar — AGENT VISITOR, —\n' +
      '14 Mar — Mr T. Hollis, London',
    footnote: 'The third entry is written in a different hand.',
    marks: ['ink', 'age'],
    hiddenClue: 'anagram',
  },
  {
    id: 'doc-notebook',
    style: 'notebook',
    header: 'LOOSE PAGE, NO HEADING',
    body:
      'Four people. I have written what they did, not what they were called.\n' +
      'Take the first letter of each name, in the order given.\n\n' +
      'i. The astronomer who turned an improved telescope on Jupiter, and stood trial in 1633.\n' +
      'ii. The Norwegian who reached the South Pole first, in December 1911.\n' +
      'iii. The Flemish cartographer whose 1569 projection still carries his name.\n' +
      'iv. The physicist who published the special theory of relativity in 1905.',
    footnote: 'The page is torn along the left edge.',
    marks: ['pencil'],
    hiddenClue: 'research',
  },
  {
    id: 'doc-cutting',
    style: 'newsprint',
    header: 'THE CITY CHRONICLE — LATE EDITION',
    body:
      'ARCHIVE ENTERED IN THE NIGHT\n\n' +
      'The records archive on Gaunt Lane was entered during the night of 14 March 1874. ' +
      'The seal on the inner door was found broken at dawn. Nothing is reported missing. ' +
      'A pocket watch recovered from the yard is not believed to be connected.',
    footnote: 'No byline. Cutting is undated.',
    marks: ['newsprint', 'age'],
    hiddenClue: null,
  },
  {
    id: 'doc-ledger',
    style: 'ruled',
    header: 'ARCHIVE SEAL LEDGER',
    body:
      '13 MAR 1873, 6.00 P.M. — Seal checked. Intact. — W.A.\n' +
      '14 MAR 1873, 6.10 A.M. — Seal broken. Reported. — W.A.',
    footnote: 'Ledger held at the archive. Entries in one hand.',
    marks: ['ruled', 'ink'],
    hiddenClue: null,
  },
];

export const puzzles: Puzzle[] = [
  {
    id: 'pz-inspect',
    type: 'inspection',
    stage: 1,
    difficulty: 'apprentice',
    title: 'Open the dossier',
    description:
      'Every investigation starts the same way: look at what you actually have. ' +
      'Go to Evidence and open all four items, then come back here.',
    data: {
      requiresInspected: ['ev-telegram', 'ev-statement', 'ev-cutting', 'ev-watch'],
    },
    solution: null,
    acceptedAnswers: [],
    dependencies: [],
    unlockConditions: [],
    researchRequired: false,
    teaches: ['case-file', 'evidence-list', 'document-viewer'],
    hints: [
      {
        level: 'direction',
        penalty: 5,
        text: 'Four items are open to you now. Tap each one and read it.',
      },
    ],
    explanation:
      'Inspecting an item logs it. Every clue in this case is inside a document — ' +
      'the puzzle will tell you which one, but it will never copy the clue out for you.',
    rewards: { log: 'Dossier opened' },
    nextPuzzles: ['pz-morse'],
  },
  {
    id: 'pz-morse',
    type: 'cipher.morse',
    stage: 2,
    difficulty: 'apprentice',
    title: 'The marks below the message',
    description:
      'Open the telegram. It refuses to write a name, then prints three groups of marks ' +
      'below the message. Decode them and enter the word they spell.',
    data: { documentId: 'doc-telegram', alphabet: 'international-morse' },
    solution: 'THE',
    acceptedAnswers: ['the'],
    dependencies: ['pz-inspect'],
    unlockConditions: [{ type: 'puzzleSolved', id: 'pz-inspect' }],
    researchRequired: false,
    teaches: ['cipher', 'answer-submission', 'hints'],
    hints: [
      {
        level: 'direction',
        penalty: 5,
        text: 'Dots and dashes, sent by telegraph. The clue is the medium.',
      },
      {
        level: 'technique',
        penalty: 10,
        text: 'Morse code. Three groups means three letters. A single dash is one of the commonest letters in English.',
      },
      { level: 'strong', penalty: 20, text: 'Dash is T. Four dots is H. A single dot is E.' },
      { level: 'reveal', penalty: 40, text: 'The word is THE.' },
    ],
    explanation:
      'Morse is language-independent, which is why it is the first cipher you meet. ' +
      'Note where the clue was: on the document, not on this screen. That holds for the rest of the case.',
    rewards: {
      evidence: ['ev-register'],
      fragment: { slot: 1, word: 'THE' },
      log: 'First word recovered',
    },
    nextPuzzles: ['pz-acrostic'],
  },
  {
    id: 'pz-acrostic',
    type: 'language.acrostic',
    stage: 3,
    difficulty: 'apprentice',
    title: 'What the porter did not say',
    description:
      'Open the night porter\u2019s statement. Six numbered lines that tell you almost nothing. ' +
      'It was not written for its content. Read down the left-hand edge.',
    data: { documentId: 'doc-statement', extraction: 'first-letter-per-line', lines: 6 },
    solution: 'MASTER',
    acceptedAnswers: ['master'],
    dependencies: ['pz-morse'],
    unlockConditions: [{ type: 'puzzleSolved', id: 'pz-morse' }],
    researchRequired: false,
    teaches: ['document-inspection', 'hidden-clue', 'notes'],
    hints: [
      { level: 'direction', penalty: 5, text: 'Six lines, six letters.' },
      {
        level: 'technique',
        penalty: 10,
        text: 'An acrostic: take the first letter of each line in order.',
      },
      { level: 'strong', penalty: 20, text: 'M, A, S, T, E, R.' },
      { level: 'reveal', penalty: 40, text: 'The word is MASTER.' },
    ],
    explanation:
      'Not every document hides something. This one announced itself by being oddly ' +
      'numbered and oddly empty. Suspect the format before you suspect the content.',
    rewards: { fragment: { slot: 2, word: 'MASTER' }, log: 'Second word recovered' },
    nextPuzzles: ['pz-anagram'],
  },
  {
    id: 'pz-anagram',
    type: 'language.anagram',
    stage: 4,
    difficulty: 'apprentice',
    title: 'The guest with no address',
    description:
      'Open the hotel register. Three guests gave a town; the fourth entry gives a ' +
      'description in place of a name, in a different hand. Rearrange its twelve letters ' +
      'into a single word.',
    data: { documentId: 'doc-register' },
    solution: 'INVESTIGATOR',
    acceptedAnswers: ['investigator'],
    dependencies: ['pz-acrostic'],
    unlockConditions: [{ type: 'puzzleSolved', id: 'pz-acrostic' }],
    researchRequired: false,
    teaches: ['wordplay', 'evidence-connection'],
    hints: [
      {
        level: 'direction',
        penalty: 5,
        text: 'The entry is not a name and not a lie. It is the same word, disturbed.',
      },
      {
        level: 'technique',
        penalty: 10,
        text: 'An anagram of all twelve letters. The word describes what you are doing right now.',
      },
      { level: 'strong', penalty: 20, text: 'It begins with I and ends with R.' },
      { level: 'reveal', penalty: 40, text: 'The word is INVESTIGATOR.' },
    ],
    explanation:
      'Language puzzles like this only work in the language they were built for. Generated ' +
      'cases build their word puzzles in your chosen language rather than transl
