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
      'The material inside concerns a break-in at a records archive on the night of 13 March 1873. ' +
      'Nothing was taken. Somebody wants to know whether you can read what is in front of you.\n\n' +
      'Work the evidence. The dossier will tell you what it is called.',
  },
  objectives: [
    { id: 'obj-evidence', label: 'Examine every item of evidence' },
    { id: 'obj-words', label: 'Recover four concealed words' },
    { id: 'obj-herring', label: 'Establish which sources can be trusted' },
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
    revealedBy: 'pz-acrostic',
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
      '1. Mist had settled over the yard.\n' +
      '2. About that hour I heard the gate.\n' +
      '3. Someone crossed to the door.\n' +
      '4. Twice he stopped, as if listening.\n' +
      '5. Every light in the yard was out.\n' +
      '6. Returning at dawn, I found the seal.',
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
    footnote: 'One entry is written in a different hand.',
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
