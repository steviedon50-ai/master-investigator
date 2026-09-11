/**
 * Core contracts for the investigation engine.
 *
 * Case 000 is hand-authored; every later case is generated. Both produce
 * the same shapes, so the UI and the scorer never need to know which is which.
 */

/* ---------------------------------------------------------------- */
/* Difficulty and identity                                          */
/* ---------------------------------------------------------------- */

export type Difficulty =
  | 'apprentice'
  | 'investigator'
  | 'expert'
  | 'master'
  | 'black';

/** Stable per-player id, e.g. "MI-7F42-91". Feeds the case seed. */
export type InvestigatorId = string;

export interface CaseSeedParts {
  investigatorId: InvestigatorId;
  caseNumber: number;
  difficulty: Difficulty;
  generatorVersion: string;
}

/* ---------------------------------------------------------------- */
/* Localisable text                                                 */
/* ---------------------------------------------------------------- */

/**
 * Every player-visible string carries a translation key and an English
 * fallback, so nothing has to be retrofitted when other languages land.
 */
export interface LocalisedText {
  key: string;
  fallback: string;
}

export type Text = string | LocalisedText;

/* ---------------------------------------------------------------- */
/* Evidence                                                         */
/* ---------------------------------------------------------------- */

export type EvidenceKind =
  | 'document'
  | 'object'
  | 'person'
  | 'place'
  | 'date'
  | 'finding';

export type EvidenceStatus =
  | 'unresolved'
  | 'confirmed'
  | 'plausible'
  | 'contradicted'
  | 'red-herring';

export interface Evidence {
  id: string;
  kind: EvidenceKind;
  name: string;
  summary: string;
  /** Present from the start when null, otherwise unlocked by this puzzle. */
  revealedBy: string | null;
  status: EvidenceStatus;
  tags: string[];
  documentId?: string;
  /** Authoring notes. Never shown to the player. */
  authoring?: {
    redHerring?: boolean;
    unreliable?: boolean;
    reason?: string;
  };
}

export type RelationshipKind =
  | 'related-to'
  | 'proves'
  | 'contradicts'
  | 'depends-on'
  | 'same-person'
  | 'same-location'
  | 'same-date'
  | 'possible-red-herring';

export interface EvidenceLink {
  id: string;
  from: string;
  to: string;
  kind: RelationshipKind;
  note?: string;
  /** True when the player drew it, false when the case supplied it. */
  playerMade: boolean;
}

/* ---------------------------------------------------------------- */
/* Documents                                                        */
/* ---------------------------------------------------------------- */

export type DocumentStyle =
  | 'telegram'
  | 'typewritten'
  | 'handwritten'
  | 'newsprint'
  | 'notebook'
  | 'ruled'
  | 'official';

export type DocumentMark =
  | 'fold'
  | 'stamp'
  | 'age'
  | 'ink'
  | 'pencil'
  | 'typewriter'
  | 'newsprint'
  | 'ruled'
  | 'seal';

export interface InvestigationDocument {
  id: string;
  style: DocumentStyle;
  header: string;
  body: string;
  footnote?: string;
  marks: DocumentMark[];
  /** Authoring note for the validator. Not a hint to the player. */
  hiddenClue: string | null;
}

/* ---------------------------------------------------------------- */
/* Puzzles                                                          */
/* ---------------------------------------------------------------- */

export type PuzzleType =
  | 'inspection'
  | 'cipher.morse'
  | 'cipher.caesar'
  | 'cipher.a1z26'
  | 'cipher.vigenere'
  | 'cipher.book'
  | 'language.acrostic'
  | 'language.anagram'
  | 'language.extraction'
  | 'logic.deduction'
  | 'math.sequence'
  | 'research.chain'
  | 'deduction.contradiction'
  | 'meta.assembly';

export type HintLevel = 'direction' | 'technique' | 'strong' | 'reveal';

export interface Hint {
  level: HintLevel;
  penalty: number;
  text: string;
}

export type UnlockCondition =
  | { type: 'puzzleSolved'; id: string }
  | { type: 'evidenceInspected'; id: string }
  | { type: 'allFragments'; count: number };

/** A word or value earned by solving a puzzle, used by the meta-puzzle. */
export interface Fragment {
  slot: number;
  word: string;
}

export interface PuzzleRewards {
  evidence?: string[];
  fragment?: Fragment;
  setStatus?: Array<{ evidenceId: string; status: EvidenceStatus }>;
  log?: string;
  unlocks?: string[];
}

export interface Puzzle {
  id: string;
  type: PuzzleType;
  stage: number;
  difficulty: Difficulty;
  title: string;
  description: string;
  /** Type-specific payload. Each puzzle module narrows this itself. */
  data: Record<string, unknown>;
  solution: string | null;
  acceptedAnswers: string[];
  dependencies: string[];
  unlockConditions: UnlockCondition[];
  researchRequired: boolean;
  hints: Hint[];
  explanation: string;
  rewards: PuzzleRewards;
  nextPuzzles: string[];
  /** Which mechanics this puzzle introduces. Case 000 only. */
  teaches?: string[];
}

/* ---------------------------------------------------------------- */
/* Case                                                             */
/* ---------------------------------------------------------------- */

export interface Objective {
  id: string;
  label: string;
  auto?: boolean;
}

export interface ScoringRules {
  base: number;
  hintPenalties: Record<HintLevel, number>;
  wrongAnswerPenalty: number;
  wrongAnswerFloor: number;
  parTimeSeconds: number;
  timeBonusMax: number;
  redHerringBonus: number;
  contradictionBonus: number;
  connectionBonus: number;
}

export interface CaseFile {
  id: string;
  number: number;
  procedural: boolean;
  difficulty: Difficulty;
  estimatedMinutes: number;
  title: Text;
  strapline: Text;
  briefing: Text;
  objectives: Objective[];
  scoring: ScoringRules;
}

export interface CaseGraphNode {
  id: string;
  stage: number;
  next: string[];
}

export interface CaseGraph {
  entry: string;
  nodes: CaseGraphNode[];
  linear: boolean;
}

export interface RevealStep {
  at: number;
  text?: string;
  word?: string;
  title?: string;
}

export interface Reveal {
  sequence: RevealStep[];
  reducedMotionFallback: { title: string; lines: string[] };
  unlocks: {
    titleDiscovered: boolean;
    mainMenu: boolean;
    nextCaseNumber: number;
  };
}

export interface Investigation {
  caseFile: CaseFile;
  evidence: Evidence[];
  documents: InvestigationDocument[];
  puzzles: Puzzle[];
  graph: CaseGraph;
  reveal?: Reveal;
  meta: { authored: boolean; generatorVersion: string; seed?: string };
}

/* ---------------------------------------------------------------- */
/* Player progress                                                  */
/* ---------------------------------------------------------------- */

export type LogEventType =
  | 'case-opened'
  | 'evidence-inspected'
  | 'document-viewed'
  | 'puzzle-solved'
  | 'wrong-answer'
  | 'research-completed'
  | 'evidence-connected'
  | 'red-herring-identified'
  | 'contradiction-found'
  | 'hint-used'
  | 'case-solved';

export interface LogEntry {
  at: number;
  type: LogEventType;
  label: string;
  refId?: string;
}

export interface Note {
  id: string;
  body: string;
  createdAt: number;
  updatedAt: number;
  attachedTo?: { kind: 'evidence' | 'puzzle' | 'research'; id: string };
}

export interface PuzzleProgress {
  solved: boolean;
  wrongAttempts: number;
  hintsUsed: HintLevel[];
  solvedAt?: number;
  /** Per-step answers for multi-part puzzles such as research chains. */
  stepAnswers?: Record<string, string>;
}

export interface CaseProgress {
  caseId: string;
  startedAt: number;
  completedAt?: number;
  inspectedEvidence: string[];
  viewedDocuments: string[];
  evidenceStatus: Record<string, EvidenceStatus>;
  links: EvidenceLink[];
  puzzles: Record<string, PuzzleProgress>;
  fragments: Fragment[];
  log: LogEntry[];
  notes: Note[];
  finalAnswer?: string;
  score?: ScoreBreakdown;
}

export interface ScoreBreakdown {
  total: number;
  accuracy: number;
  reasoning: number;
  research: number;
  efficiency: number;
  timeSeconds: number;
  hintPenalty: number;
  wrongAnswerPenalty: number;
  bonuses: number;
  rank: Rank;
}

export type Rank =
  | 'Probationary'
  | 'Junior Investigator'
  | 'Field Investigator'
  | 'Senior Investigator'
  | 'Master Investigator'
  | 'Legendary';

/* ---------------------------------------------------------------- */
/* Profile                                                          */
/* ---------------------------------------------------------------- */

export interface Profile {
  investigatorId: InvestigatorId;
  titleDiscovered: boolean;
  casesCompleted: number;
  casesAttempted: number;
  puzzlesSolved: number;
  bestScore: number;
  averageScore: number;
  hintsUsed: number;
  redHerringsIdentified: number;
  contradictionsIdentified: number;
  achievements: string[];
  createdAt: number;
}
