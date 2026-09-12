/**
 * Case generator.
 *
 * Seed in, playable investigation out. Every choice comes from the seeded RNG,
 * so the same player always gets the same Case 014 — reproducible, never
 * regenerated on reload.
 *
 * The output is the same Investigation shape as the authored Case 000, so the
 * UI and the validator cannot tell the difference.
 */

import { acceptedFor, entitiesOfKind, entity, type Entity } from '../data/knowledge';
import { rngForCase, type Rng } from './rng';
import type {
  CaseSeedParts,
  Difficulty,
  Evidence,
  Investigation,
  InvestigationDocument,
  Puzzle,
} from './types';

/* ---------------------------------------------------------------- */
/* Story dressing                                                    */
/* ---------------------------------------------------------------- */

const CASE_TITLES = [
  'The Missing Archive',
  'The Silent Cartographer',
  'The Vanishing Letter',
  'The Borrowed Name',
  'The Unsigned Statement',
  'The Second Ledger',
  'The Quiet Hour',
  'The Wrong Address',
];

const SUBJECTS = [
  'a locked reading room',
  'a private collection',
  'a records office',
  'a university library',
  'a shipping agent\u2019s office',
];

const STAGE_COUNT: Record<Difficulty, number> = {
  apprentice: 4,
  investigator: 5,
  expert: 7,
  master: 9,
  black: 12,
};

const PAR_SECONDS: Record<Difficulty, number> = {
  apprentice: 600,
  investigator: 900,
  expert: 1500,
  master: 2400,
  black: 4200,
};

/* ---------------------------------------------------------------- */
/* Morse, for the cipher stage                                       */
/* ---------------------------------------------------------------- */

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

/* ---------------------------------------------------------------- */
/* Document builders                                                 */
/* ---------------------------------------------------------------- */

function telegramWith(rng: Rng, ciphered: string, year: number): InvestigationDocument {
  const hour = rng.int(7, 11);
  const minute = rng.int(10, 55);
  return {
    id: 'doc-telegram',
    style: 'telegram',
    header: `POST OFFICE TELEGRAPHS — HANDED IN ${rng.int(2, 27)} MAR ${year}, ${hour}.${minute} P.M.`,
    body:
      'ROOM SECURE. NOTHING MOVED. I WILL NOT WRITE IT PLAINLY.\n' +
      'IT IS BELOW.\n\n' +
      `   ${toMorse(ciphered)}`,
    footnote: 'No reply paid.',
    marks: ['fold', 'stamp'],
    hiddenClue: 'morse',
  };
}

/**
 * An acrostic statement. The lines are assembled from fragments chosen so that
 * each begins with the required letter — the sentence has to read naturally or
 * the trick is obvious.
 */
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
    // No line available for this letter: the word cannot be hidden this way.
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

/* ---------------------------------------------------------------- */
/* Generation                                                        */
/* ---------------------------------------------------------------- */

export interface GeneratedCase extends Investigation {
  meta: {
    authored: false;
    generatorVersion: string;
    seed: string;
  };
}

export const GENERATOR_VERSION = 'gen-v1';

/**
 * Builds one case. Deterministic for a given seed.
 *
 * Returns null when a valid case cannot be assembled from the available
 * knowledge — the caller regenerates with a different attempt number rather
 * than shipping something broken.
 */
export function generateCase(
  parts: CaseSeedParts,
  attempt = 0,
): GeneratedCase | null {
  const rng = rngForCase({ ...parts, generatorVersion: `${parts.generatorVersion}-${attempt}` });

  const difficulty = parts.difficulty;
  const stages = STAGE_COUNT[difficulty];

  /* --- Choose the cast ------------------------------------------ */

  const people = entitiesOfKind('person');
  const places = entitiesOfKind('place');
  if (people.length < 4 || places.length < 2) return null;

  const researchSubjects = rng.sample(people, 4);
  const setting = rng.pick(places);
  const year = setting.year ?? rng.int(1840, 1910);

  /* --- The hidden word, carried by the cipher -------------------- */

  // The cipher word is the setting's name: short, and it feeds the next stage.
  const cipherWord = setting.name.toUpperCase().replace(/[^A-Z]/g, '');
  if (cipherWord.length < 3 || cipherWord.length > 9) return null;

  /* --- The acrostic word ----------------------------------------- */

  const keyPerson = rng.pick(researchSubjects);
  const acrosticWord = keyPerson.name.toUpperCase().replace(/[^A-Z]/g, '');
  const statement = acrosticFor(rng, acrosticWord);
  if (!statement) return null;

  /* --- Documents -------------------------------------------------- */

  const telegram = telegramWith(rng, cipherWord, year);

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

  const documents: InvestigationDocument[] = [telegram, statement, notebook];

  /* --- Evidence ---------------------------------------------------- */

  const evidence: Evidence[] = [
    {
      id: 'ev-telegram',
      kind: 'document',
      documentId: 'doc-telegram',
      name: 'Telegram, Post Office form',
      summary: `Franked ${year}. Marks below the message line.`,
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
      id: 'ev-notebook',
      kind: 'document',
      documentId: 'doc-notebook',
      name: 'Notebook page, four clues',
      summary: 'Four descriptions of people, no names given.',
      revealedBy: 'gen-cipher',
      status: 'unresolved',
      tags: ['research'],
    },
  ];

  /* --- Puzzles ------------------------------------------------------ */

  const puzzles: Puzzle[] = [
    {
      id: 'gen-inspect',
      type: 'inspection',
      stage: 1,
      difficulty,
      title: 'Open the dossier',
      description: 'Look at what you have before you look for what is missing.',
      data: { requiresInspected: ['ev-telegram', 'ev-statement'] },
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
      rewards: { evidence: ['ev-notebook'], log: 'Location recovered' },
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
      rewards: { log: 'Name recovered' },
      nextPuzzles: ['gen-research'],
    },
    {
      id: 'gen-research',
      type: 'research.chain',
      stage: 4,
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
      solution: researchSubjects.map((p) => p.name.charAt(0).toUpperCase()).join(''),
      acceptedAnswers: [
        researchSubjects.map((p) => p.name.charAt(0).toUpperCase()).join(''),
      ],
      dependencies: ['gen-acrostic'],
      unlockConditions: [{ type: 'puzzleSolved', id: 'gen-acrostic' }],
      researchRequired: true,
      hints: [
        { level: 'direction', penalty: 5, text: 'All four are well documented. Look them up.' },
        { level: 'technique', penalty: 10, text: 'Answer all four, then read the first letters downward.' },
        {
          level: 'strong',
          penalty: 20,
          text: researchSubjects.map((p) => p.name.charAt(0).toUpperCase()).join(', '),
        },
        {
          level: 'reveal',
          penalty: 40,
          text: `The letters are ${researchSubjects.map((p) => p.name.charAt(0).toUpperCase()).join('')}.`,
        },
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
          `In ${setting.name}, ${year}. Somebody entered ${subject} and left again ` +
          'without taking anything.\n\nWhat they left behind is in front of you.',
      },
      objectives: [
        { id: 'obj-evidence', label: 'Examine every item of evidence' },
        { id: 'obj-solve', label: `Work through ${stages} stages` },
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
