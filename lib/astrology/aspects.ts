import {
    calculateSunTropicalLongitude,
    calculateMoonTropicalLongitude,
    calculateMercuryTropicalLongitude,
    calculateVenusTropicalLongitude,
    calculateMarsTropicalLongitude,
    calculateJupiterTropicalLongitude,
    calculateSaturnTropicalLongitude,
    calculateUranusTropicalLongitude,
    calculateNeptuneTropicalLongitude,
    calculatePlutoTropicalLongitude,
} from './celestialBodies';
import {
    calculateLilithTropicalLongitude,
    calculateNorthNodeTropicalLongitude,
    calculateChironTropicalLongitude,
    calculateCeresTropicalLongitude,
    calculatePallasTropicalLongitude,
    calculateJunoTropicalLongitude,
    calculateVestaTropicalLongitude,
} from './astroPoints';
import { calculateAscendant, calculateLocalSiderealTime } from './houseSystem';
import { normalizeAngle } from './utils';

export type AspectBody = {
  id: string;
  name: string;
  symbol: string;
  signIndex: number;
  house: number;
  longitude: number;
};

export type Aspect = {
  id: string;
  body1: AspectBody;
  body2: AspectBody;
  type: string;
  orb: number;
  symbol: string;
  isNatal?: boolean;
};

export type CelestialBodiesData = {
    id: string;
    name: string;
    symbol: string;
    longitude: number;
    signIndex: number;
    house: number;
}[];

const PLANET_DATA: Record<string, {name: string, symbol: string}> = {
    sun: { name: 'Sol', symbol: '☉' },
    moon: { name: 'Lua', symbol: '☾' },
    mercury: { name: 'Mercúrio', symbol: '☿' },
    venus: { name: 'Vênus', symbol: '♀' },
    mars: { name: 'Marte', symbol: '♂' },
    jupiter: { name: 'Júpiter', symbol: '♃' },
    saturn: { name: 'Saturno', symbol: '♄' },
    uranus: { name: 'Urano', symbol: '♅' },
    neptune: { name: 'Netuno', symbol: '♆' },
    pluto: { name: 'Plutão', symbol: '♇' },
    lilith: { name: 'Lilith', symbol: '⚸' },
    northNode: { name: 'Nodo N.', symbol: '☊' },
    southNode: { name: 'Nodo S.', symbol: '☋' },
    chiron: { name: 'Quíron', symbol: '⚷' },
    ceres: { name: 'Ceres', symbol: '⚳' },
    pallas: { name: 'Pallas', symbol: '⚴' },
    juno: { name: 'Juno', symbol: '⚵' },
    vesta: { name: 'Vesta', symbol: '⚶' },
};

export const ASPECT_ORBS: Record<string, number> = { 
    conjunction: 8, 
    opposition: 8, 
    trine: 7, 
    square: 7, 
    sextile: 6 
};

export const ASPECT_SYMBOLS: Record<string, string> = { 
    conjunction: '☌', 
    opposition: '☍', 
    trine: '△', 
    square: '□', 
    sextile: '✶' 
};

export const calculateAspects = (
    longitudes: Record<string, number>,
    visiblePlanets: Record<string, boolean>,
    housePlacements: Record<string, number>
): Aspect[] => {
    const celestialBodiesForAspects = Object.entries(longitudes)
        .map(([id, longitude]) => ({
            id,
            name: PLANET_DATA[id]?.name || id,
            symbol: PLANET_DATA[id]?.symbol || '?',
            longitude,
            signIndex: Math.floor(longitude / 30),
            house: housePlacements[id] || 0,
        }));
        
    const aspectList: Aspect[] = [];
    
    const visibleBodies = celestialBodiesForAspects.filter(body => visiblePlanets[body.id]);

    for (let i = 0; i < visibleBodies.length; i++) {
        for (let j = i + 1; j < visibleBodies.length; j++) {
            const body1 = visibleBodies[i];
            const body2 = visibleBodies[j];

            // Specific filter: Ignore Opposition between North Node and South Node
            if (
                ((body1.id === 'northNode' && body2.id === 'southNode') || 
                 (body1.id === 'southNode' && body2.id === 'northNode'))
            ) {
                continue;
            }

            let angleDiff = Math.abs(body1.longitude - body2.longitude);
            if (angleDiff > 180) angleDiff = 360 - angleDiff;
            
            let aspectType: string | null = null;

            if (angleDiff <= ASPECT_ORBS.conjunction) { aspectType = 'conjunction'; } 
            else if (Math.abs(angleDiff - 180) <= ASPECT_ORBS.opposition) { aspectType = 'opposition'; }
            else if (Math.abs(angleDiff - 90) <= ASPECT_ORBS.square) { aspectType = 'square'; }
            else if (Math.abs(angleDiff - 120) <= ASPECT_ORBS.trine) { aspectType = 'trine'; }
            else if (Math.abs(angleDiff - 60) <= ASPECT_ORBS.sextile) { aspectType = 'sextile'; }

            if (aspectType) {
                const ASPECT_ANGLES: Record<string, number> = {
                    conjunction: 0,
                    sextile: 60,
                    square: 90,
                    trine: 120,
                    opposition: 180
                };
                const orb = Math.abs(angleDiff - ASPECT_ANGLES[aspectType]);
                aspectList.push({
                    id: `${body1.id}-${body2.id}-${aspectType}`,
                    body1: {id: body1.id, name: body1.name, symbol: body1.symbol, signIndex: body1.signIndex, house: body1.house, longitude: body1.longitude },
                    body2: {id: body2.id, name: body2.name, symbol: body2.symbol, signIndex: body2.signIndex, house: body2.house, longitude: body2.longitude },
                    type: aspectType,
                    orb,
                    symbol: ASPECT_SYMBOLS[aspectType],
                    isNatal: false
                });
            }
        }
    }
    
    return aspectList.sort((a, b) => a.orb - b.orb);
};

export const calculateTransitNatalAspects = (
    transitBodies: CelestialBodiesData,
    natalBodies: CelestialBodiesData
): Aspect[] => {
    const aspectList: Aspect[] = [];

    for (const transitBody of transitBodies) {
        for (const natalBody of natalBodies) {
            
             // Specific filter: Ignore Opposition between North Node and South Node (Transit to Natal)
             if (
                ((transitBody.id === 'northNode' && natalBody.id === 'southNode') || 
                 (transitBody.id === 'southNode' && natalBody.id === 'northNode'))
            ) {
                continue;
            }

            let angleDiff = Math.abs(transitBody.longitude - natalBody.longitude);
            if (angleDiff > 180) angleDiff = 360 - angleDiff;

            let aspectType: string | null = null;

            if (angleDiff <= ASPECT_ORBS.conjunction) { aspectType = 'conjunction'; } 
            else if (Math.abs(angleDiff - 180) <= ASPECT_ORBS.opposition) { aspectType = 'opposition'; }
            else if (Math.abs(angleDiff - 90) <= ASPECT_ORBS.square) { aspectType = 'square'; }
            else if (Math.abs(angleDiff - 120) <= ASPECT_ORBS.trine) { aspectType = 'trine'; }
            else if (Math.abs(angleDiff - 60) <= ASPECT_ORBS.sextile) { aspectType = 'sextile'; }

            if (aspectType) {
                const ASPECT_ANGLES: Record<string, number> = {
                    conjunction: 0,
                    sextile: 60,
                    square: 90,
                    trine: 120,
                    opposition: 180
                };
                const orb = Math.abs(angleDiff - ASPECT_ANGLES[aspectType]);
                aspectList.push({
                    id: `T-${transitBody.id}-N-${natalBody.id}-${aspectType}`,
                    body1: { ...transitBody },
                    body2: { ...natalBody },
                    type: aspectType,
                    orb,
                    symbol: ASPECT_SYMBOLS[aspectType],
                    isNatal: true
                });
            }
        }
    }

    return aspectList.sort((a, b) => a.orb - b.orb);
};

// ─────────────────────────────────────────────────────────────────────────────
// Vigência do aspecto (data de início e de fim)
//
// Busca nas efemérides reais: a partir do instante atual, anda para trás e para
// frente com as posições verdadeiras dos corpos (as mesmas funções do relógio)
// até o desvio em relação ao ângulo exato passar do orbe máximo do aspecto, e
// refina o ponto de saída por bisseção (precisão de 1 minuto).
//
// - Corpos NATAIS são fixos (antes eram tratados como se andassem com a mesma
//   velocidade do trânsito: Lua ☍ Lua natal dava "800 dias").
// - Considera retrogradação e se o aspecto está se formando ou se desfazendo.
// - Parte da Fortuna anda com o Ascendente: precisa do local (latitude/longitude).
// ─────────────────────────────────────────────────────────────────────────────

const ASPECT_ANGLE: Record<string, number> = { conjunction: 0, sextile: 60, square: 90, trine: 120, opposition: 180 };

type LonFn = (d: Date) => number;

const TROPICAL_LONGITUDE: Record<string, LonFn> = {
    sun: calculateSunTropicalLongitude,
    moon: calculateMoonTropicalLongitude,
    mercury: calculateMercuryTropicalLongitude,
    venus: calculateVenusTropicalLongitude,
    mars: calculateMarsTropicalLongitude,
    jupiter: calculateJupiterTropicalLongitude,
    saturn: calculateSaturnTropicalLongitude,
    uranus: calculateUranusTropicalLongitude,
    neptune: calculateNeptuneTropicalLongitude,
    pluto: calculatePlutoTropicalLongitude,
    lilith: calculateLilithTropicalLongitude,
    northNode: calculateNorthNodeTropicalLongitude,
    southNode: (d: Date) => normalizeAngle(calculateNorthNodeTropicalLongitude(d) + 180),
    chiron: calculateChironTropicalLongitude,
    ceres: calculateCeresTropicalLongitude,
    pallas: calculatePallasTropicalLongitude,
    juno: calculateJunoTropicalLongitude,
    vesta: calculateVestaTropicalLongitude,
};

/**
 * Velocidade máxima (absoluta, °/dia) de cada corpo, medida nas próprias funções
 * de posição (2015–2035) + ~25% de margem. Só define o tamanho do passo da busca.
 */
const MAX_DAILY_SPEED: Record<string, number> = {
    sun: 1.3, moon: 16, mercury: 2.8, venus: 1.6, mars: 1.0,
    jupiter: 0.3, saturn: 0.17, uranus: 0.08, neptune: 0.05, pluto: 0.05,
    lilith: 0.15, northNode: 0.3, southNode: 0.3, chiron: 0.1,
    ceres: 0.6, pallas: 0.75, juno: 0.75, vesta: 0.7,
    partOfFortune: 1500, // acompanha o Ascendente (muito mais rápido em latitudes altas)
};

/** Parte da Fortuna tropical num instante (fórmula diurna/noturna, como no relógio). */
const partOfFortuneAt = (d: Date, latitude: number, longitude: number): number => {
    const lst = calculateLocalSiderealTime(d, longitude);
    const asc = calculateAscendant(lst, latitude, d);
    const sun = calculateSunTropicalLongitude(d);
    const moon = calculateMoonTropicalLongitude(d);
    // Altura do Sol (dia = acima de −0,833°, mesmo critério do nascer/pôr do sol)
    const eps = 23.4393 * Math.PI / 180;
    const lam = sun * Math.PI / 180;
    const dec = Math.asin(Math.sin(eps) * Math.sin(lam));
    const ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam));
    const H = lst * Math.PI / 180 - ra;
    const phi = latitude * Math.PI / 180;
    const alt = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H)) * 180 / Math.PI;
    const isDay = alt > -0.833;
    return isDay ? normalizeAngle(asc + moon - sun) : normalizeAngle(asc + sun - moon);
};

export type AspectTransitRange = {
    start: Date;
    end: Date;
    /** true quando a busca chegou ao limite (aspecto começou antes disso) */
    startOpen?: boolean;
    /** true quando a busca chegou ao limite (aspecto termina depois disso) */
    endOpen?: boolean;
};

const SEARCH_LIMIT_DAYS = 60 * 365.25;
const rangeCache = new Map<string, AspectTransitRange & { key: string }>();

/**
 * Início e fim do aspecto em torno de `baseDate`.
 * Retorna null quando não é possível calcular (corpo desconhecido, ou Parte da
 * Fortuna sem local).
 */
/** Função de desvio (graus em relação ao ângulo exato) ao longo do tempo para um aspecto. */
function buildDeviation(
    aspect: Aspect,
    baseDate: Date,
    location?: { latitude: number; longitude: number }
): { deviation: (ms: number) => number; maxOrb: number; speedSum: number } | null {
    const angle = ASPECT_ANGLE[aspect.type];
    const maxOrb = ASPECT_ORBS[aspect.type];
    if (angle === undefined || maxOrb === undefined) return null;

    const lonFnFor = (id: string): LonFn | null => {
        if (id === 'partOfFortune') {
            if (!location) return null;
            return (d: Date) => partOfFortuneAt(d, location.latitude, location.longitude);
        }
        return TROPICAL_LONGITUDE[id] ?? null;
    };

    const f1 = lonFnFor(aspect.body1.id);
    if (!f1) return null;
    // Em aspectos trânsito × natal, o corpo 2 é natal: posição FIXA
    const f2 = aspect.isNatal ? null : lonFnFor(aspect.body2.id);
    if (!aspect.isNatal && !f2) return null;

    // Deslocamentos que levam a longitude tropical ao mesmo zodíaco do aspecto
    // (sideral ou tropical) — calculados no instante base
    const off1 = aspect.body1.longitude - f1(baseDate);
    const off2 = f2 ? aspect.body2.longitude - f2(baseDate) : 0;

    const deviation = (ms: number): number => {
        const d = new Date(ms);
        const l1 = f1(d) + off1;
        const l2 = f2 ? f2(d) + off2 : aspect.body2.longitude;
        let sep = Math.abs(normalizeAngle(l1 - l2));
        if (sep > 180) sep = 360 - sep;
        return Math.abs(sep - angle);
    };

    const speed1 = MAX_DAILY_SPEED[aspect.body1.id] ?? 1;
    const speed2 = aspect.isNatal ? 0 : (MAX_DAILY_SPEED[aspect.body2.id] ?? 1);
    return { deviation, maxOrb, speedSum: speed1 + speed2 };
}

export function getAspectTransitRange(
    aspect: Aspect,
    baseDate: Date = new Date(),
    location?: { latitude: number; longitude: number }
): AspectTransitRange | null {
    const built = buildDeviation(aspect, baseDate, location);
    if (!built) return null;
    const { deviation, maxOrb } = built;

    const baseMs = baseDate.getTime();
    // Margem mínima para o caso de o aspecto estar exatamente na borda do orbe
    if (deviation(baseMs) > maxOrb + 1e-6) return null;

    // Reaproveita o resultado enquanto o instante base estiver dentro da janela já calculada
    const loc = aspect.body1.id === 'partOfFortune' || aspect.body2.id === 'partOfFortune'
        ? `|${location?.latitude.toFixed(3)},${location?.longitude.toFixed(3)}` : '';
    const key = `${aspect.id}|${aspect.isNatal ? aspect.body2.longitude.toFixed(4) : ''}${loc}`;
    const cached = rangeCache.get(aspect.id + loc);
    if (cached && cached.key === key && baseMs >= cached.start.getTime() && baseMs <= cached.end.getTime()) {
        return { start: cached.start, end: cached.end, startOpen: cached.startOpen, endOpen: cached.endOpen };
    }

    // Passo: o desvio muda no máximo 0,25° entre duas amostras
    const stepMs = Math.max(5000, (0.25 / built.speedSum) * 86400000);
    const maxSteps = Math.ceil((SEARCH_LIMIT_DAYS * 86400000) / stepMs);

    const findEdge = (dir: 1 | -1): { ms: number; open: boolean } => {
        let inside = baseMs;
        for (let i = 1; i <= maxSteps; i++) {
            const t = baseMs + dir * i * stepMs;
            if (deviation(t) > maxOrb) {
                // Bisseção entre o último ponto dentro do orbe e o primeiro fora
                let lo = inside, hi = t;
                while (Math.abs(hi - lo) > 60000) {
                    const mid = (lo + hi) / 2;
                    if (deviation(mid) > maxOrb) hi = mid; else lo = mid;
                }
                return { ms: lo, open: false };
            }
            inside = t;
        }
        return { ms: inside, open: true };
    };

    const s = findEdge(-1);
    const e = findEdge(1);
    const result: AspectTransitRange = {
        start: new Date(s.ms),
        end: new Date(e.ms),
        startOpen: s.open || undefined,
        endOpen: e.open || undefined,
    };
    rangeCache.set(aspect.id + loc, { ...result, key });
    if (rangeCache.size > 500) rangeCache.clear();
    return result;
}

export type AspectTiming = {
    range: AspectTransitRange;
    /** true = se formando (o desvio está diminuindo) */
    applying: boolean;
    /** Se formando: próximo exato. Se desfazendo: último exato. null se não chega/chegou ao exato. */
    exact: Date | null;
};

/** Vigência + estado (se formando / se desfazendo) + momento exato do aspecto. */
export function getAspectTiming(
    aspect: Aspect,
    baseDate: Date = new Date(),
    location?: { latitude: number; longitude: number }
): AspectTiming | null {
    const range = getAspectTransitRange(aspect, baseDate, location);
    const built = buildDeviation(aspect, baseDate, location);
    if (!range || !built) return null;
    const { deviation, speedSum } = built;

    const baseMs = baseDate.getTime();
    const dt = Math.max(60000, Math.min(6 * 3600000, (0.02 / speedSum) * 86400000));
    const applying = deviation(baseMs + dt) < deviation(baseMs);

    // Momento exato mais próximo NA DIREÇÃO do movimento:
    //  • se formando  → próximo exato (de agora até o fim da janela)
    //  • se desfazendo → último exato (do início da janela até agora)
    // Astros lentos podem fazer o mesmo aspecto 3 vezes (retrogradação): pega o mais próximo de agora.
    const a = range.start.getTime(), b = range.end.getTime();
    const from = baseMs, to = applying ? b : a;
    const N = 240;
    const step = (to - from) / N;
    const refine = (t0: number): number => {
        let lo = Math.min(t0 - step, t0 + step), hi = Math.max(t0 - step, t0 + step);
        lo = Math.max(Math.min(a, b), lo); hi = Math.min(Math.max(a, b), hi);
        for (let k = 0; k < 60 && hi - lo > 30000; k++) {
            const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3;
            if (deviation(m1) < deviation(m2)) hi = m2; else lo = m1;
        }
        return (lo + hi) / 2;
    };
    let exact: Date | null = null;
    if (step !== 0) {
        let prev = deviation(from), cur = deviation(from + step);
        for (let i = 1; i < N && !exact; i++) {
            const next = deviation(from + (i + 1) * step);
            const isLocalMin = cur <= prev && cur <= next;
            if (isLocalMin && cur < 0.5) {
                const tMin = refine(from + i * step);
                if (deviation(tMin) <= 0.05) exact = new Date(tMin);
            }
            prev = cur; cur = next;
        }
        // Borda da janela (ex.: exato a poucos minutos de agora)
        if (!exact) {
            const tMin = refine(from + (deviation(from) < deviation(to) ? 0 : N) * step);
            if (deviation(tMin) <= 0.05) exact = new Date(tMin);
        }
    }
    return { range, applying, exact };
}

export function formatDateCompact(d: Date): string {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}
