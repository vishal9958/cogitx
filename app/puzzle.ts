export interface WordDef {
  n: number;
  d: 'A' | 'D';
  r: number;
  c: number;
  a: string;
  clue: string;
  i: number;
  cells: string[];
}

export interface GridCell {
  id: string;
  r: number;
  c: number;
  ans: string;
  num: number;
  spark: number;
  A: number | null;
  D: number | null;
}

export const WORDS: WordDef[] = [
  {n:1,  d:'A', r:0,  c:5, a:'LAMP',     clue:'A source of light on a desk or in a window.', i: 0, cells: []},
  {n:5,  d:'A', r:2,  c:0, a:'DIYA',     clue:'Small clay dish of oil with a wick, lit at dusk on holiday evenings.', i: 1, cells: []},
  {n:7,  d:'A', r:4,  c:3, a:'KINDLE',   clue:'To start a fire, or to stir up a feeling.', i: 2, cells: []},
  {n:8,  d:'A', r:6,  c:0, a:'HOME',     clue:'Where the lights are hung and the family gathers.', i: 3, cells: []},
  {n:10, d:'A', r:8,  c:1, a:'FESTIVAL', clue:'A celebration marked on the calendar each year.', i: 4, cells: []},
  {n:12, d:'A', r:11, c:3, a:'DIWALI',   clue:'The Indian holiday of lights, celebrated around the world each autumn.', i: 5, cells: []},
  {n:14, d:'A', r:15, c:0, a:'PETALS',   clue:'Soft coloured parts of a flower.', i: 6, cells: []},
  {n:2,  d:'D', r:0,  c:8, a:'PEACE',    clue:'Calm and quiet, and a wish for the year ahead.', i: 7, cells: []},
  {n:3,  d:'D', r:1,  c:1, a:'WISH',     clue:'A hope for something good to come.', i: 8, cells: []},
  {n:4,  d:'D', r:1,  c:3, a:'DARKNESS', clue:'What every light pushes back.', i: 9, cells: []},
  {n:6,  d:'D', r:2,  c:5, a:'RANGOLI',  clue:'Colourful floor art made of powder at the entrance of a home.', i: 10, cells: []},
  {n:9,  d:'D', r:7,  c:7, a:'CANDLE',   clue:'Wax around a wick, lit for light.', i: 11, cells: []},
  {n:11, d:'D', r:10, c:5, a:'SWEETS',   clue:'Treats shared between neighbours and friends on a holiday.', i: 12, cells: []},
  {n:13, d:'D', r:12, c:2, a:'GIFTS',    clue:'Presents exchanged with family and friends.', i: 13, cells: []},
];

// shaded squares, in order -> S P A R K
export const SPARK: [number, number][] = [[8,3],[0,8],[2,3],[2,5],[4,3]];
export const SAVE_KEY = 'cogitx-diwali-xw-v1';
export const key = (r: number, c: number) => r + ',' + c;

// derived model (static)
export const CELLS = new Map<string, GridCell>();

WORDS.forEach((w, i) => {
  w.i = i;
  w.cells = [];
  for (let k = 0; k < w.a.length; k++) {
    const r = w.r + (w.d === 'D' ? k : 0);
    const c = w.c + (w.d === 'A' ? k : 0);
    const id = key(r, c);
    let cell = CELLS.get(id);
    if (!cell) {
      cell = { id, r, c, ans: w.a[k], num: 0, spark: 0, A: null, D: null };
      CELLS.set(id, cell);
    }
    cell[w.d] = i;
    w.cells.push(id);
    if (k === 0) cell.num = w.n;
  }
});

SPARK.forEach(([r, c], i) => {
  const cObj = CELLS.get(key(r, c));
  if (cObj) cObj.spark = i + 1;
});

export const ORDER = [...WORDS]
  .sort((a, b) => (a.d === b.d ? a.n - b.n : a.d === 'A' ? -1 : 1))
  .map(w => w.i);
