/**
 * Knowledge database.
 *
 * The generator builds cases from these entities and the links between them.
 * Everything here must be a real, checkable fact — a player who looks something
 * up has to find the answer the game expects.
 *
 * This file grows indefinitely. The shapes matter more than the current volume:
 * add entries, never change the field names, and the generator keeps working.
 */

export type EntityKind =
  | 'person'
  | 'place'
  | 'work'
  | 'event'
  | 'organisation';

export interface Entity {
  id: string;
  kind: EntityKind;
  /** The answer the player types. */
  name: string;
  /** Everything else accepted. Surnames, alternate spellings, local names. */
  aliases: string[];
  /**
   * How a case describes this entity without naming it. Must identify it
   * uniquely — two entities sharing a clue makes an unsolvable puzzle.
   */
  clue: string;
  /** Short form for a research prompt. */
  label: string;
  year?: number;
  /** Ids this entity connects to. The generator walks these to build chains. */
  links: string[];
  /** Broad grouping, used to keep a case thematically coherent. */
  era: 'ancient' | 'renaissance' | 'enlightenment' | 'victorian' | 'modern';
}

export const entities: Entity[] = [
  /* --- People: science and exploration --------------------------- */
  {
    id: 'p-galileo',
    kind: 'person',
    name: 'Galileo',
    aliases: ['galileo galilei', 'galilei'],
    clue: 'The astronomer who turned an improved telescope on Jupiter, and stood trial in 1633.',
    label: 'Astronomer, tried 1633',
    year: 1633,
    links: ['pl-pisa', 'pl-florence'],
    era: 'renaissance',
  },
  {
    id: 'p-amundsen',
    kind: 'person',
    name: 'Amundsen',
    aliases: ['roald amundsen'],
    clue: 'The Norwegian who reached the South Pole first, in December 1911.',
    label: 'Norwegian, South Pole 1911',
    year: 1911,
    links: ['pl-oslo'],
    era: 'modern',
  },
  {
    id: 'p-mercator',
    kind: 'person',
    name: 'Mercator',
    aliases: ['gerardus mercator', 'gerard mercator', 'gerhard mercator'],
    clue: 'The Flemish cartographer whose 1569 map projection still carries his name.',
    label: 'Flemish cartographer, 1569',
    year: 1569,
    links: ['pl-antwerp'],
    era: 'renaissance',
  },
  {
    id: 'p-einstein',
    kind: 'person',
    name: 'Einstein',
    aliases: ['albert einstein'],
    clue: 'The physicist who published the special theory of relativity in 1905.',
    label: 'Physicist, relativity 1905',
    year: 1905,
    links: ['pl-bern', 'pl-zurich'],
    era: 'modern',
  },
  {
    id: 'p-curie',
    kind: 'person',
    name: 'Curie',
    aliases: ['marie curie', 'maria sklodowska curie', 'marie sklodowska curie'],
    clue: 'The physicist who won Nobel Prizes in two different sciences, the first in 1903.',
    label: 'Two Nobel Prizes',
    year: 1903,
    links: ['pl-paris', 'pl-warsaw'],
    era: 'modern',
  },
  {
    id: 'p-darwin',
    kind: 'person',
    name: 'Darwin',
    aliases: ['charles darwin'],
    clue: 'The naturalist who sailed on the Beagle and published On the Origin of Species in 1859.',
    label: 'Naturalist, Origin of Species',
    year: 1859,
    links: ['pl-london', 'w-origin'],
    era: 'victorian',
  },
  {
    id: 'p-faraday',
    kind: 'person',
    name: 'Faraday',
    aliases: ['michael faraday'],
    clue: 'The self-taught scientist whose 1831 work on induction made the electric generator possible.',
    label: 'Induction, 1831',
    year: 1831,
    links: ['pl-london'],
    era: 'victorian',
  },
  {
    id: 'p-babbage',
    kind: 'person',
    name: 'Babbage',
    aliases: ['charles babbage'],
    clue: 'The mathematician who designed the Difference Engine and never finished building it.',
    label: 'Difference Engine',
    year: 1822,
    links: ['pl-london', 'p-lovelace'],
    era: 'victorian',
  },
  {
    id: 'p-lovelace',
    kind: 'person',
    name: 'Lovelace',
    aliases: ['ada lovelace', 'ada byron', 'augusta ada king'],
    clue: 'The mathematician whose 1843 notes on an unbuilt engine described the first algorithm.',
    label: 'First algorithm, 1843',
    year: 1843,
    links: ['pl-london', 'p-babbage'],
    era: 'victorian',
  },

  /* --- People: letters ------------------------------------------- */
  {
    id: 'p-dickens',
    kind: 'person',
    name: 'Dickens',
    aliases: ['charles dickens'],
    clue: 'The novelist who serialised Oliver Twist from 1837 and knew the workhouses he wrote about.',
    label: 'Wrote Oliver Twist',
    year: 1838,
    links: ['pl-london', 'w-twist'],
    era: 'victorian',
  },
  {
    id: 'p-shelley',
    kind: 'person',
    name: 'Shelley',
    aliases: ['mary shelley', 'mary wollstonecraft shelley'],
    clue: 'The author who began Frankenstein during a wet summer by Lake Geneva in 1816.',
    label: 'Wrote Frankenstein',
    year: 1818,
    links: ['pl-geneva', 'w-frankenstein'],
    era: 'victorian',
  },
  {
    id: 'p-poe',
    kind: 'person',
    name: 'Poe',
    aliases: ['edgar allan poe', 'edgar poe'],
    clue: 'The American writer whose 1841 story of a Paris murder invented the detective genre.',
    label: 'Invented detective fiction',
    year: 1841,
    links: ['pl-baltimore'],
    era: 'victorian',
  },

  /* --- Places ----------------------------------------------------- */
  {
    id: 'pl-london',
    kind: 'place',
    name: 'London',
    aliases: [],
    clue: 'The city where the Great Exhibition was held in 1851.',
    label: 'Great Exhibition, 1851',
    year: 1851,
    links: [],
    era: 'victorian',
  },
  {
    id: 'pl-paris',
    kind: 'place',
    name: 'Paris',
    aliases: [],
    clue: 'The city whose iron tower was completed for the 1889 exposition.',
    label: 'Iron tower, 1889',
    year: 1889,
    links: [],
    era: 'victorian',
  },
  {
    id: 'pl-vienna',
    kind: 'place',
    name: 'Vienna',
    aliases: ['wien'],
    clue: 'The capital where a congress redrew the map of Europe in 1815.',
    label: 'Congress of 1815',
    year: 1815,
    links: [],
    era: 'enlightenment',
  },
  {
    id: 'pl-prague',
    kind: 'place',
    name: 'Prague',
    aliases: ['praha'],
    clue: 'The city whose astronomical clock has kept time on its old town hall since 1410.',
    label: 'Astronomical clock, 1410',
    year: 1410,
    links: [],
    era: 'renaissance',
  },
  {
    id: 'pl-oxford',
    kind: 'place',
    name: 'Oxford',
    aliases: [],
    clue: 'The English university city whose Bodleian Library opened to readers in 1602.',
    label: 'Bodleian, 1602',
    year: 1602,
    links: [],
    era: 'renaissance',
  },
  {
    id: 'pl-geneva',
    kind: 'place',
    name: 'Geneva',
    aliases: ['genève'],
    clue: 'The Swiss city on the lake where the first Convention was signed in 1864.',
    label: 'First Convention, 1864',
    year: 1864,
    links: [],
    era: 'victorian',
  },
  {
    id: 'pl-antwerp',
    kind: 'place',
    name: 'Antwerp',
    aliases: ['antwerpen', 'anvers'],
    clue: 'The Flemish port that was Europe\u2019s busiest in the sixteenth century.',
    label: 'Flemish port',
    links: [],
    era: 'renaissance',
  },
  {
    id: 'pl-bern',
    kind: 'place',
    name: 'Bern',
    aliases: ['berne'],
    clue: 'The Swiss capital where a patent clerk published four papers in 1905.',
    label: 'Patent office, 1905',
    year: 1905,
    links: ['p-einstein'],
    era: 'modern',
  },
  {
    id: 'pl-zurich',
    kind: 'place',
    name: 'Zurich',
    aliases: ['zürich'],
    clue: 'The Swiss city whose federal polytechnic was founded in 1855.',
    label: 'Polytechnic, 1855',
    year: 1855,
    links: [],
    era: 'victorian',
  },
  {
    id: 'pl-oslo',
    kind: 'place',
    name: 'Oslo',
    aliases: ['christiania', 'kristiania'],
    clue: 'The Norwegian capital that was called Christiania until 1925.',
    label: 'Renamed 1925',
    year: 1925,
    links: [],
    era: 'modern',
  },
  {
    id: 'pl-warsaw',
    kind: 'place',
    name: 'Warsaw',
    aliases: ['warszawa'],
    clue: 'The Polish capital on the Vistula.',
    label: 'On the Vistula',
    links: [],
    era: 'modern',
  },
  {
    id: 'pl-pisa',
    kind: 'place',
    name: 'Pisa',
    aliases: [],
    clue: 'The Tuscan city whose bell tower began leaning during construction in the twelfth century.',
    label: 'Leaning tower',
    links: [],
    era: 'renaissance',
  },
  {
    id: 'pl-florence',
    kind: 'place',
    name: 'Florence',
    aliases: ['firenze'],
    clue: 'The Tuscan city whose cathedral dome was completed by Brunelleschi in 1436.',
    label: 'Dome completed 1436',
    year: 1436,
    links: [],
    era: 'renaissance',
  },
  {
    id: 'pl-baltimore',
    kind: 'place',
    name: 'Baltimore',
    aliases: [],
    clue: 'The Maryland port whose defence in 1814 prompted the American national anthem.',
    label: 'Anthem written here',
    year: 1814,
    links: [],
    era: 'enlightenment',
  },

  /* --- Works ------------------------------------------------------ */
  {
    id: 'w-twist',
    kind: 'work',
    name: 'Oliver Twist',
    aliases: ['oliver'],
    clue: 'The 1838 novel about an orphan who asks for more.',
    label: 'Orphan asks for more',
    year: 1838,
    links: ['p-dickens'],
    era: 'victorian',
  },
  {
    id: 'w-frankenstein',
    kind: 'work',
    name: 'Frankenstein',
    aliases: ['the modern prometheus'],
    clue: 'The 1818 novel subtitled The Modern Prometheus.',
    label: 'The Modern Prometheus',
    year: 1818,
    links: ['p-shelley'],
    era: 'victorian',
  },
  {
    id: 'w-origin',
    kind: 'work',
    name: 'On the Origin of Species',
    aliases: ['origin of species', 'the origin of species'],
    clue: 'The 1859 book that set out evolution by natural selection.',
    label: 'Natural selection, 1859',
    year: 1859,
    links: ['p-darwin'],
    era: 'victorian',
  },
];

/* ---------------------------------------------------------------- */
/* Lookups                                                          */
/* ---------------------------------------------------------------- */

const byId = new Map(entities.map((e) => [e.id, e]));

export function entity(id: string): Entity | undefined {
  return byId.get(id);
}

export function entitiesOfKind(kind: EntityKind): Entity[] {
  return entities.filter((e) => e.kind === kind);
}

export function entitiesInEra(era: Entity['era']): Entity[] {
  return entities.filter((e) => e.era === era);
}

/** Everything this entity links to, resolved. */
export function linked(id: string): Entity[] {
  const source = byId.get(id);
  if (!source) return [];
  return source.links
    .map((linkId) => byId.get(linkId))
    .filter((e): e is Entity => e !== undefined);
}

/** All accepted answers for an entity: its name plus every alias. */
export function acceptedFor(entityRef: Entity): string[] {
  return [entityRef.name, ...entityRef.aliases];
}
