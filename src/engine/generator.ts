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

  /*
