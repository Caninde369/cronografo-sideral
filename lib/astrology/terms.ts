/**
 * Termos egípcios — TABELA ÚNICA do Cronógrafo (relógio, tooltips e PDF).
 *
 * Tabela clássica (Ptolomeu / Valens). Conferência objetiva: cada planeta soma
 * Júpiter 79°, Vênus 82°, Mercúrio 76°, Marte 66° e Saturno 57° (total 360°).
 * As versões antigas do relógio e do PDF tinham erros em Câncer, Leão, Libra,
 * Escorpião e Capricórnio.
 *
 * Cada signo: lista de { ruler, end } — o termo vai do `end` anterior até este.
 */

export type TermRuler = 'jupiter' | 'venus' | 'mercury' | 'mars' | 'saturn';

export const EGYPTIAN_TERMS: ReadonlyArray<ReadonlyArray<{ ruler: TermRuler; end: number }>> = [
  /* Áries */       [{ ruler: 'jupiter', end: 6 }, { ruler: 'venus', end: 12 }, { ruler: 'mercury', end: 20 }, { ruler: 'mars', end: 25 }, { ruler: 'saturn', end: 30 }],
  /* Touro */       [{ ruler: 'venus', end: 8 }, { ruler: 'mercury', end: 14 }, { ruler: 'jupiter', end: 22 }, { ruler: 'saturn', end: 27 }, { ruler: 'mars', end: 30 }],
  /* Gêmeos */      [{ ruler: 'mercury', end: 6 }, { ruler: 'jupiter', end: 12 }, { ruler: 'venus', end: 17 }, { ruler: 'mars', end: 24 }, { ruler: 'saturn', end: 30 }],
  /* Câncer */      [{ ruler: 'mars', end: 7 }, { ruler: 'venus', end: 13 }, { ruler: 'mercury', end: 19 }, { ruler: 'jupiter', end: 26 }, { ruler: 'saturn', end: 30 }],
  /* Leão */        [{ ruler: 'jupiter', end: 6 }, { ruler: 'venus', end: 11 }, { ruler: 'saturn', end: 18 }, { ruler: 'mercury', end: 24 }, { ruler: 'mars', end: 30 }],
  /* Virgem */      [{ ruler: 'mercury', end: 7 }, { ruler: 'venus', end: 17 }, { ruler: 'jupiter', end: 21 }, { ruler: 'mars', end: 28 }, { ruler: 'saturn', end: 30 }],
  /* Libra */       [{ ruler: 'saturn', end: 6 }, { ruler: 'mercury', end: 14 }, { ruler: 'jupiter', end: 21 }, { ruler: 'venus', end: 28 }, { ruler: 'mars', end: 30 }],
  /* Escorpião */   [{ ruler: 'mars', end: 7 }, { ruler: 'venus', end: 11 }, { ruler: 'mercury', end: 19 }, { ruler: 'jupiter', end: 24 }, { ruler: 'saturn', end: 30 }],
  /* Sagitário */   [{ ruler: 'jupiter', end: 12 }, { ruler: 'venus', end: 17 }, { ruler: 'mercury', end: 21 }, { ruler: 'saturn', end: 26 }, { ruler: 'mars', end: 30 }],
  /* Capricórnio */ [{ ruler: 'mercury', end: 7 }, { ruler: 'jupiter', end: 14 }, { ruler: 'venus', end: 22 }, { ruler: 'saturn', end: 26 }, { ruler: 'mars', end: 30 }],
  /* Aquário */     [{ ruler: 'mercury', end: 7 }, { ruler: 'venus', end: 13 }, { ruler: 'jupiter', end: 20 }, { ruler: 'mars', end: 25 }, { ruler: 'saturn', end: 30 }],
  /* Peixes */      [{ ruler: 'venus', end: 12 }, { ruler: 'jupiter', end: 16 }, { ruler: 'mercury', end: 19 }, { ruler: 'mars', end: 28 }, { ruler: 'saturn', end: 30 }],
];

export interface TermInfo {
  signIndex: number;
  /** posição do termo dentro do signo (0 a 4) */
  index: number;
  ruler: TermRuler;
  /** graus dentro do signo */
  start: number;
  end: number;
}

/** Todos os termos do signo, com início e fim. */
export const getSignTerms = (signIndex: number): TermInfo[] => {
  const list = EGYPTIAN_TERMS[((signIndex % 12) + 12) % 12];
  let start = 0;
  return list.map((t, index) => {
    const info = { signIndex, index, ruler: t.ruler, start, end: t.end };
    start = t.end;
    return info;
  });
};

/** Termo em que cai uma longitude eclíptica (0–360). */
export const getTermAt = (longitude: number): TermInfo => {
  const lon = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(lon / 30);
  const deg = lon - signIndex * 30;
  const terms = getSignTerms(signIndex);
  return terms.find(t => deg < t.end) ?? terms[terms.length - 1];
};

/** Lista "achatada" 0–360 (para desenhar o anel). */
export const ALL_TERMS_360 = Array.from({ length: 12 }, (_, s) =>
  getSignTerms(s).map(t => ({ body: t.ruler, start: s * 30 + t.start, end: s * 30 + t.end }))
).flat();
