/**
 * Case generator.
 *
 * Seed in, playable investigation out. Every choice comes from the seeded RNG,
 * so the same player always gets the same Case 014.
 *
 * Two things separate a generated case from a puzzle chain: a contradiction
 * the player has to resolve, and a red herring they have to ignore. Both are
 * planted here rather than added later, because the documents have to be built
 * around them — a false date has to be false about something.
 */

import { acceptedFor, entitiesOfKind, type Entity } from '../data/knowledge';
import { rngForCase, type Rng } from './rng';
import type {
  CaseSeedParts,
  Difficulty,
  Evidence,
  Investigation,
  InvestigationDocument,
  Puzzle,
} from './types';

const CASE_TITLES = [
  'The Missing Archive',
  'The Silent Cartographer',
  'The Vanishing Letter',
  'The Borrowed Name',
  'The Unsigned Statement',
  'The Second Ledger',
  'The Quiet Hour',
  'The Wrong Address',
  'The Long Walk Back',
  'The Unposted Letter',
  'The Fourth Witness',
  'The Empty Case',
  'The Night Register',
  'The Corrected Entry',
  'The Absent Clerk',
  'The Broken Seal',
];

const SUBJECTS = [
  'a locked reading room',
  'a private collection',
  'a records office',
  'a university library',
  'a shipping agent\u2019s office',
  'a solicitor\u2019s strongroom',
  'a museum store',
];

/* Objects that could plausibly be found and mean nothing. */
const HERRINGS = [
  { name: 'Pocket watch, stopped', summary: 'Found in the yard. Engraved with two initials.' },
  { name: 'Single glove', summary: 'Left on the step. No pair found.' },
  { name: 'Railway ticket, unused', summary: 'Dated the week before. Never punched.' },
  { name: 'Brass key, unmarked', summary: 'Fits nothing in the building.' },
  { name: 'Torn photograph', summary: 'A doorway. Nobody in frame.' },
  { name: 'Empty envelope', summary: 'Addressed, sealed, never posted.' },
];

const PAR_SECONDS: Record<Difficulty, number> = {
  apprentice: 600,
  investigator: 900,
  expert: 1500,
  master: 2400,
  black: 4200,
};

const MORSE: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.',
  H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.',
  O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-',
  V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
};

function toMorse(word: string): string {
  return word
    .toUpperCase()
    .split('')
    .map((c) => MORSE[c] ?? '')
    .filter(Boolean)
    .join('   ');
}

const LINE_STARTS: Record<string, string[]> = {
  A: ['About that hour the bell rang.', 'A light showed at the stair.'],
  B: ['Before ten the yard was empty.', 'Both doors were bolted.'],
  C: ['Cold had settled on the step.', 'Crossing the hall, I heard nothing.'],
  D: ['Dusk came early that evening.', 'Down the corridor a door shut.'],
  E: ['Every lamp had been put out.', 'Even the clock had stopped.'],
  F: ['First I checked the outer gate.', 'For a moment I heard breathing.'],
  G: ['Gas was low in the passage.', 'Going up, I found the door open.'],
  H: ['Half past the hour, all quiet.', 'He did not speak to me.'],
  I: ['I saw no one on the stair.', 'It was raining by then.'],
  J: ['Just after, the gate closed.', 'January had been colder.'],
  K: ['Keys were on their hook.', 'Knocking brought no answer.'],
  L: ['Light rain began at eleven.', 'Later I found the seal broken.'],
  M: ['Mist had settled over the yard.', 'Morning found the room empty.'],
  N: ['Nothing seemed out of place.', 'No one passed me in the hall.'],
  O: ['Only the porter was awake.', 'Outside, the street was empty.'],
  P: ['Past the office, all was dark.', 'Passing the desk, I saw nothing.'],
  Q: ['Quiet held until the small hours.', 'Quite suddenly, a door closed.'],
  R: ['Returning at dawn, I found it.', 'Rain had washed the step clean.'],
  S: ['Someone crossed to the door.', 'Silence, until the gate.'],
  T: ['Twice he stopped, as if listening.', 'The lamp had been turned down.'],
  U: ['Under the door, no light.', 'Until then I had heard nothing.'],
  V: ['Very little moved after ten.', 'Voices carried from the street.'],
  W: ['Wind took the gate twice.', 'We had locked up at nine.'],
  X: ['X marks the ledger entry.', 'X was written in the margin.'],
  Y: ['Yard gate stood unlocked.', 'Yesterday it had been secure.'],
  Z: ['Zero visibility after midnight.', 'Zealous, I checked again.'],
};

function acrosticFor(rng: Rng, word: string): InvestigationDocument | null {
  const lines: string[] = [];
  for (const letter of word.toUpperCase().split('')) {
    const options = LINE_STARTS[letter];
    if (!options || options.length === 0) return null;
    lines.push(rng.pick(options));
  }

  return {
    id: 'doc-statement',
    style: 'typewritten',
    header: 'STATEMENT OF THE NIGHT PORTER',
    body: lines.map((line, i) => `${i + 1}. ${line}`).join('\n'),
    footnote: 'Signed at the station house.',
    marks: ['typewriter', 'age'],
    hiddenClue: 'acrostic',
  };
}

export interface GeneratedCase extends Investigation {
  meta: { authored: false; generatorVersion: string; seed: string };
}

export const GENERATOR_VERSION = 'gen-v2';

export function generateCase(
  parts: CaseSeedParts,
  attempt = 0,
): GeneratedCase | null {
  const rng = rngForCase({
    ...parts,
    generatorVersion: `${parts.generatorVersion}-${attempt}`,
  });

  const difficulty = parts.difficulty;

  const people = entitiesOfKind('person');
  const places = entitiesOfKind('place');
  if (people.length < 4 || places.length < 2) return null;

  const researchSubjects = rng.sample(people, 4);
  const setting = rng.pick(places);

  /* --- Dates ------------------------------------------------------ */

  /*
   * The contradiction is built from dates. Two records made at the time agree;
   * one later account is wrong. The error is deliberately small — a year out,
   * or a day — because a wildly wrong date is spotted without thinking.
   */
  const trueYear = rng.int(1868, 1912);
  const trueDay = rng.int(3, 26);
  const month = rng.pick(['JAN', 'FEB', 'MAR', 'APR', 'SEP', 'OCT', 'NOV']);

  const errorKind = rng.pick(['year', 'day'] as const);
  const falseYear = errorKind === 'year' ? trueYear + rng.pick([-1, 1]) : trueYear;
  const falseDay = errorKind === 'day' ? trueDay + rng.pick([-2, -1, 1, 2]) : trueDay;

  /* --- Hidden words ----------------------------------------------- */

  const cipherWord = setting.name.toUpperCase().replace(/[^A-Z]/g, '');
  if (cipherWord.length < 3 || cipherWord.length > 9) return null;

  const keyPerson = rng.pick(researchSubjects);
  const acrosticWord = keyPerson.name.toUpperCase().replace(/[^A-Z]/g, '');
  const statement = acrosticFor(rng, acrosticWord);
  if (!statement) return null;

  /* --- Documents --------------------------------------------------- */

  const telegram: InvestigationDocument = {
    id: 'doc-telegram',
    style: 'telegram',
    header: `POST OFFICE TELEGRAPHS — HANDED IN ${trueDay} ${month} ${trueYear}, ${rng.int(7, 11)}.${rng.int(10, 55)} P.M.`,
    body:
      'ROOM SECURE. NOTHING MOVED. I WILL NOT WRITE IT PLAINLY.\n' +
      'IT IS BELOW.\n\n' +
      `   ${toMorse(cipherWord)}`,
    footnote: 'No reply paid.',
    marks: ['fold', 'stamp'],
    hiddenClue: 'morse',
  };

  const ledger: InvestigationDocument = {
    id: 'doc-ledger',
    style: 'ruled',
    header: 'DOOR LEDGER',
    body:
      `${trueDay} ${month} ${trueYear}, 6.00 P.M. — Checked. Secure.\n` +
      `${trueDay + 1} ${month} ${trueYear}, 6.10 A.M. — Found open. Reported.`,
    footnote: 'Kept on the premises. Entries in one hand.',
    marks: ['ruled', 'ink'],
    hiddenClue: null,
  };

  /* The unreliable source. Undated, unsigned, and wrong. */
  const cutting: InvestigationDocument = {
    id: 'doc-cutting',
    style: 'newsprint',
    header: 'THE CHRONICLE — LATE EDITION',
    body:
      'ENTERED IN THE NIGHT\n\n' +
      `The premises were entered during the night of ${falseDay} ${month} ${falseYear}. ` +
      'Nothing is reported missing. An object recovered from the yard is not ' +
      'believed to be connected.',
    footnote: 'No byline. Cutting is undated.',
    marks: ['newsprint', 'age'],
    hiddenClue: null,
  };

  const notebook: InvestigationDocument = {
    id: 'doc-notebook',
    style: 'notebook',
    header: 'LOOSE PAGE, NO HEADING',
    body:
      'Four people. I have written what they did, not what they were called.\n\n' +
      researchSubjects
        .map((p, i) => `${['i', 'ii', 'iii', 'iv'][i]}. ${p.clue}`)
        .join('\n'),
    footnote: 'The page is torn along one edge.',
    marks: ['pencil'],
    hiddenClue: 'research',
  };

  const documents = [telegram, statement, ledger, cutting, notebook];

  /* --- Evidence ----------------------------------------------------- */

  const herring = rng.pick(HERRINGS);

  const evidence: Evidence[] = [
    {
      id: 'ev-telegram',
      kind: 'document',
      documentId: 'doc-telegram',
      name: 'Telegram, Post Office form',
      summary: `Franked ${trueDay} ${month} ${trueYear}. Marks below the message line.`,
      revealedBy: null,
      status: 'unresolved',
      tags: ['date', 'cipher'],
    },
    {
      id: 'ev-statement',
      kind: 'document',
      documentId: 'doc-statement',
      name: 'Witness statement — night porter',
      summary: `${acrosticWord.length} numbered lines, signed but not dated.`,
      revealedBy: null,
      status: 'unresolved',
      tags: ['witness', 'document'],
    },
    {
      id: 'ev-cutting',
      kind: 'document',
      documentId: 'doc-cutting',
      name: 'Newspaper cutting',
      summary: `Reports the break-in. Dates it to ${falseDay} ${month} ${falseYear}.`,
      revealedBy: null,
      status: 'unresolved',
      tags: ['date', 'press'],
      authoring: { unreliable: true, reason: `${errorKind}-conflict` },
    },
    {
      id: 'ev-herring',
      kind: 'object',
      name: herring.name,
      summary: herring.summary,
      revealedBy: null,
      status: 'unresolved',
      tags: ['object'],
      authoring: { redHerring: true, reason: 'irrelevant' },
    },
    {
      id: 'ev-ledger',
      kind: 'document',
      documentId: 'doc-ledger',
      name: 'Door ledger',
      summary: `Checked secure ${trueDay} ${month} ${trueYear}. Found open the next morning.`,
      revealedBy: 'gen-acrostic',
      status: 'unresolved',
      tags: ['date', 'record'],
    },
    {
      id: 'ev-notebook',
      kind: 'document',
      documentId: 'doc-notebook',
      name: 'Notebook page, four clues',
      summary: 'Four descriptions of people, no names given.',
      revealedBy: 'gen-contradiction',
      status: 'unresolved',
      tags: ['research'],
    },
  ];

  /* --- Puzzles -------------------------------------------------------- */

  const initials = researchSubjects
    .map((p) => p.name.charAt(0).toUpperCase())
    .join('');

  const wrongLabel =
    errorKind === 'year' ? 'It gives the wrong year' : 'It gives the wrong day';

  const puzzles: Puzzle[] = [
    {
      id: 'gen-inspect',
      type: 'inspection',
      stage: 1,
      difficulty,
      title: 'Open the dossier',
      description: 'Look at what you have before you look for what is missing.',
      data: {
        requiresInspected: ['ev-telegram', 'ev-statement', 'ev-cutting', 'ev-herring'],
      },
      solution: null,
      acceptedAnswers: [],
      dependencies: [],
      unlockConditions: [],
      researchRequired: false,
      hints: [
        { level: 'direction', penalty: 5, text: 'Open each item in Evidence and read it.' },
      ],
      explanation: 'The clues are in the documents, not in the puzzle text.',
      rewards: { log: 'Dossier opened' },
      nextPuzzles: ['gen-cipher'],
    },
    {
      id: 'gen-cipher',
      type: 'cipher.morse',
      stage: 2,
      difficulty,
      title: 'The marks below the message',
      description:
        'The telegram will not write it plainly, then prints it in marks. ' +
        'Enter the word they spell.',
      data: { documentId: 'doc-telegram', alphabet: 'international-morse' },
      solution: cipherWord,
      acceptedAnswers: acceptedFor(setting),
      dependencies: ['gen-inspect'],
      unlockConditions: [{ type: 'puzzleSolved', id: 'gen-inspect' }],
      researchRequired: false,
      hints: [
        { level: 'direction', penalty: 5, text: 'Dots and dashes, sent by telegraph.' },
        { level: 'technique', penalty: 10, text: 'Morse code. Each group is one letter.' },
        { level: 'strong', penalty: 20, text: `It is a place. It begins with ${cipherWord[0]}.` },
        { level: 'reveal', penalty: 40, text: `The word is ${cipherWord}.` },
      ],
      explanation: 'Ask what a document is before you ask what it says.',
      rewards: { log: 'Location recovered' },
      nextPuzzles: ['gen-acrostic'],
    },
    {
      id: 'gen-acrostic',
      type: 'language.acrostic',
      stage: 3,
      difficulty,
      title: 'What the porter did not say',
      description:
        'The statement is numbered, short, and says almost nothing. ' +
        'It was not written for its content.',
      data: {
        documentId: 'doc-statement',
        extraction: 'first-letter-per-line',
        lines: acrosticWord.length,
      },
      solution: acrosticWord,
      acceptedAnswers: acceptedFor(keyPerson),
      dependencies: ['gen-cipher'],
      unlockConditions: [{ type: 'puzzleSolved', id: 'gen-cipher' }],
      researchRequired: false,
      hints: [
        { level: 'direction', penalty: 5, text: 'Read down the left edge, not across.' },
        { level: 'technique', penalty: 10, text: 'An acrostic: the first letter of each line.' },
        { level: 'strong', penalty: 20, text: `It is a name. It begins with ${acrosticWord[0]}.` },
        { level: 'reveal', penalty: 40, text: `The name is ${keyPerson.name}.` },
      ],
      explanation: 'Suspect the format before the content.',
      rewards: { evidence: ['ev-ledger'], log: 'Name recovered' },
      nextPuzzles: ['gen-contradiction'],
    },
    {
      id: 'gen-contradiction',
      type: 'deduction.contradiction',
      stage: 4,
      difficulty,
      title: 'Accounts that disagree',
      description:
        'Your sources give different dates. Until you know which to trust, ' +
        'nothing else you find can be relied on.',
      data: {
        selectFrom: ['ev-telegram', 'ev-statement', 'ev-cutting', 'ev-ledger', 'ev-herring'],
        reasonOptions: rng.shuffle([
          { id: 'year', label: 'It gives the wrong year' },
          { id: 'day', label: 'It gives the wrong day' },
          { id: 'forged', label: 'It is a forgery' },
          { id: 'irrelevant', label: 'It has nothing to do with the case' },
        ]),
        redHerring: { evidenceId: 'ev-herring', reasonKey: 'irrelevant' },
      },
      solution: `ev-cutting|${errorKind}`,
      acceptedAnswers: [],
      dependencies: ['gen-acrostic'],
      unlockConditions: [{ type: 'puzzleSolved', id: 'gen-acrostic' }],
      researchRequired: false,
      hints: [
        { level: 'direction', penalty: 5, text: 'Line up the dates alone. Ignore everything else.' },
        {
          level: 'technique',
          penalty: 10,
          text: 'Two records were made at the time and agree. One account was written later.',
        },
        {
          level: 'strong',
          penalty: 20,
          text: 'The newspaper cutting is undated and has no byline.',
        },
        {
          level: 'reveal',
          penalty: 40,
          text: `The cutting is unreliable: ${wrongLabel.toLowerCase()}.`,
        },
      ],
      explanation:
        'Print is not proof. Records made at the time beat an account written afterwards. ' +
        'The object in the yard is a separate trap — plausible, physical, connected to nothing.',
      rewards: {
        evidence: ['ev-notebook'],
        setStatus: [
          { evidenceId: 'ev-cutting', status: 'contradicted' },
          { evidenceId: 'ev-herring', status: 'red-herring' },
          { evidenceId: 'ev-telegram', status: 'confirmed' },
          { evidenceId: 'ev-ledger', status: 'confirmed' },
        ],
        log: 'Contradiction identified',
      },
      nextPuzzles: ['gen-research'],
    },
    {
      id: 'gen-research',
      type: 'research.chain',
      stage: 5,
      difficulty,
      title: 'Four people, no names',
      description:
        'The notebook describes four people by what they did. Name each one, ' +
        'then read the initials in order.',
      data: {
        documentId: 'doc-notebook',
        combine: 'initials-in-order',
        steps: researchSubjects.map((person, i) => ({
          id: `r${i + 1}`,
          prompt: person.label,
          solution: person.name.toUpperCase(),
          acceptedAnswers: acceptedFor(person),
          initial: person.name.charAt(0).toUpperCase(),
        })),
      },
      solution: initials,
      acceptedAnswers: [initials],
      dependencies: ['gen-contradiction'],
      unlockConditions: [{ type: 'puzzleSolved', id: 'gen-contradiction' }],
      researchRequired: true,
      hints: [
        { level: 'direction', penalty: 5, text: 'All four are well documented. Look them up.' },
        {
          level: 'technique',
          penalty: 10,
          text: 'Answer all four, then read the first letters downward.',
        },
        { level: 'strong', penalty: 20, text: initials.split('').join(', ') },
        { level: 'reveal', penalty: 40, text: `The letters are ${initials}.` },
      ],
      explanation: 'Looking things up is part of the work, not cheating.',
      rewards: { log: 'Final sequence recovered' },
      nextPuzzles: [],
    },
  ];

  const title = rng.pick(CASE_TITLES);
  const subject = rng.pick(SUBJECTS);
  const caseNo = String(parts.caseNumber).padStart(3, '0');

  return {
    caseFile: {
      id: `case-${caseNo}`,
      number: parts.caseNumber,
      procedural: true,
      difficulty,
      estimatedMinutes: Math.round(PAR_SECONDS[difficulty] / 60),
      title: { key: `case${caseNo}.title`, fallback: title },
      strapline: { key: `case${caseNo}.strapline`, fallback: `Case ${caseNo}` },
      briefing: {
        key: `case${caseNo}.briefing`,
        fallback:
          `In ${setting.name}, ${trueYear}. Somebody entered ${subject} and left again ` +
          'without taking anything.\n\nNot every account of that night agrees. ' +
          'What they left behind is in front of you.',
      },
      objectives: [
        { id: 'obj-evidence', label: 'Examine every item of evidence' },
        { id: 'obj-herring', label: 'Establish which sources can be trusted' },
        { id: 'obj-final', label: 'Submit the final answer' },
      ],
      scoring: {
        base: 100,
        hintPenalties: { direction: 5, technique: 10, strong: 20, reveal: 40 },
        wrongAnswerPenalty: 3,
        wrongAnswerFloor: 15,
        parTimeSeconds: PAR_SECONDS[difficulty],
        timeBonusMax: 5,
        redHerringBonus: 5,
        contradictionBonus: 5,
        connectionBonus: 5,
      },
    },
    evidence,
    documents,
    puzzles,
    graph: {
      entry: 'gen-inspect',
      nodes: puzzles.map((p) => ({ id: p.id, stage: p.stage, next: p.nextPuzzles })),
      linear: true,
    },
    meta: {
      authored: false,
      generatorVersion: GENERATOR_VERSION,
      seed: `${parts.investigatorId}|${caseNo}|${difficulty}`,
    },
  };
}
