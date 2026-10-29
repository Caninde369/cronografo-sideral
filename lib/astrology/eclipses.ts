/**
 * Eclipses — cálculo real via astronomy-engine (zodíaco TROPICAL).
 *
 * - getEclipsesForYear(): lista de eclipses solares e lunares de um ano (com cache).
 * - getEclipseOnLocalDate(): eclipse cujo pico cai no dia local informado.
 * - getUpcomingEclipse(): próximo eclipse a partir de uma data (dia do eclipse incluso).
 * - getLocalView(): como o eclipse é visto de um local (horários, cobertura, visibilidade).
 * - getSolarDisc() / getLunarDisc(): geometria Sol–Lua (ou Lua–sombra) num instante,
 *   usada pela ilustração e pelo timer da janela do eclipse.
 *
 * Preparado para o globo (próxima etapa): a janela controla um único instante
 * ("tempo do eclipse") que o globo da sombra também vai ler. O ponto máximo
 * global de cada eclipse solar já vem em `greatest`.
 */
import {
    Body,
    EclipseKind,
    Equator,
    EclipticGeoMoon,
    GeoVector,
    Horizon,
    MakeTime,
    NextGlobalSolarEclipse,
    NextLunarEclipse,
    NodeEventKind,
    Observer,
    SearchGlobalSolarEclipse,
    SearchLocalSolarEclipse,
    SearchLunarEclipse,
    SearchMoonNode,
    SiderealTime,
    SunPosition,
} from 'astronomy-engine';
import { getCentralTrack, getShadowState, getSubLunarPoint } from './eclipseShadow';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

export type EclipseType = 'solar' | 'lunar';
export type EclipseKindId = 'total' | 'annular' | 'partial' | 'penumbral';

export interface EclipseEvent {
    id: string;
    type: EclipseType;
    kind: EclipseKindId;
    /** Ex.: "Eclipse Solar Anular" */
    name: string;
    /** Instante do pico (global) */
    peak: Date;
    /** Longitude eclíptica tropical do luminar que define o eclipse (Sol no solar, Lua no lunar) */
    tropicalLongitude: number;
    signIndex: number;
    /** Ex.: "17°38' Aquário" */
    degreeLabel: string;
    /** Nodo lunar junto ao eclipse */
    node: 'north' | 'south';
    /** Regiões de visibilidade (texto curto) */
    regions: string;
    /** Solar: ponto de máximo na Terra. Lunar: ponto sob a Lua no pico. */
    greatest?: { lat: number; lon: number };
    /** Lunar: fração do disco da Lua dentro da umbra no pico (0 a 1) */
    lunarObscuration?: number;
    /** Lunar: semiduração de cada fase, em minutos */
    lunarSemiDurations?: { penumbral: number; partial: number; total: number };
}

export interface EclipseLocalView {
    visible: boolean;
    /** Motivo quando não é visível */
    reason?: 'outside-shadow' | 'below-horizon';
    kind: EclipseKindId;
    /** Fração coberta no pico: Sol pela Lua (solar) ou Lua pela umbra (lunar) */
    obscuration: number;
    begin: Date;
    peak: Date;
    end: Date;
    /** Fase anular/total (solar) ou totalidade (lunar) */
    centralBegin?: Date;
    centralEnd?: Date;
    /** Lunar: fase parcial (umbral) */
    partialBegin?: Date;
    partialEnd?: Date;
    /** Altitude (°) do Sol ou da Lua no pico, para o local */
    peakAltitude: number;
}

/** Geometria em graus (raios angulares e deslocamento do disco que se move). */
export interface EclipseDisc {
    /** Solar: raio do Sol. Lunar: raio da umbra. */
    baseRadius: number;
    /** Lunar: raio da penumbra. */
    penumbraRadius?: number;
    /** Raio da Lua */
    moonRadius: number;
    /** Deslocamento da Lua em relação ao centro (x para a direita, y para baixo, na tela) */
    dx: number;
    dy: number;
    /** Fração coberta neste instante (Sol pela Lua, ou Lua pela umbra) */
    coverage: number;
    /** Altitude (°) do Sol (solar) ou da Lua (lunar) para o local */
    altitude: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const KM_PER_AU = 149597870.69098932;
const SUN_RADIUS_KM = 695700;
const MOON_RADIUS_KM = 1737.4;
const EARTH_RADIUS_KM = 6378.14;
const RAD = Math.PI / 180;
const DAY_MS = 86400000;

export const SIGNS_PT = [
    'Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem',
    'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes',
];

const KIND_NAME: Record<EclipseType, Partial<Record<EclipseKindId, string>>> = {
    solar: { total: 'Eclipse Solar Total', annular: 'Eclipse Solar Anular', partial: 'Eclipse Solar Parcial' },
    lunar: { total: 'Eclipse Lunar Total', partial: 'Eclipse Lunar Parcial', penumbral: 'Eclipse Lunar Penumbral' },
};

/**
 * Regiões de visibilidade conhecidas (chave: data UTC do pico + tipo).
 * Fora desta tabela, a região é estimada a partir do ponto de máximo.
 */
const KNOWN_REGIONS: Record<string, string> = {
    '2026-02-17-solar': 'Antártida; parcial no sul da África e da América do Sul',
    '2026-03-03-lunar': 'Ásia, Austrália, Pacífico e Américas',
    '2026-08-12-solar': 'Groenlândia, Islândia e Espanha; parcial na Europa',
    '2026-08-28-lunar': 'Américas, Europa e África',
    '2027-02-06-solar': 'Chile, Argentina e África Ocidental; parcial na América do Sul',
    '2027-02-20-lunar': 'Américas, Europa, África e Ásia',
    '2027-08-02-solar': 'Espanha, Norte da África e Oriente Médio',
    '2027-08-17-lunar': 'Américas e Pacífico',
    '2028-01-12-lunar': 'Américas, Europa e África',
    '2028-01-26-solar': 'Equador, Peru, Brasil, Portugal e Espanha',
    '2028-07-06-lunar': 'Europa, África, Ásia e Austrália',
    '2028-07-22-solar': 'Austrália e Nova Zelândia',
    '2028-12-31-lunar': 'Europa, Ásia e Austrália',
};

// ─────────────────────────────────────────────────────────────────────────────
// Utilitários
// ─────────────────────────────────────────────────────────────────────────────

const norm360 = (a: number) => ((a % 360) + 360) % 360;

export const formatDegree = (lon: number): string => {
    const l = norm360(lon);
    const sign = Math.floor(l / 30);
    const inSign = l - sign * 30;
    let deg = Math.floor(inSign);
    let min = Math.round((inSign - deg) * 60);
    if (min === 60) { min = 0; deg += 1; }
    return `${deg}°${String(min).padStart(2, '0')}' ${SIGNS_PT[sign]}`;
};

const toKind = (k: EclipseKind): EclipseKindId => {
    switch (k) {
        case EclipseKind.Total: return 'total';
        case EclipseKind.Annular: return 'annular';
        case EclipseKind.Penumbral: return 'penumbral';
        default: return 'partial';
    }
};

const utcKey = (d: Date, type: EclipseType) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}-${type}`;

const sameLocalDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Diferença em dias de calendário (local) entre duas datas: b − a */
export const calendarDaysBetween = (a: Date, b: Date): number => {
    const da = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
    const db = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
    return Math.round((db - da) / DAY_MS);
};

/** Área da interseção de dois círculos (raios R e r, centros a distância d). */
export const circleOverlapArea = (d: number, R: number, r: number): number => {
    if (d >= R + r) return 0;
    if (d <= Math.abs(R - r)) return Math.PI * Math.min(R, r) ** 2;
    const a = r * r * Math.acos((d * d + r * r - R * R) / (2 * d * r));
    const b = R * R * Math.acos((d * d + R * R - r * r) / (2 * d * R));
    const c = 0.5 * Math.sqrt((-d + r + R) * (d + r - R) * (d - r + R) * (d + r + R));
    return a + b - c;
};

/** Região aproximada a partir de uma latitude/longitude (usada fora da tabela conhecida). */
export const regionFromLatLon = (lat: number, lon: number): string => {
    const L = ((lon + 540) % 360) - 180;
    if (lat < -60) return 'Antártida';
    if (lat > 66) return 'Ártico';
    if (L >= -82 && L <= -34 && lat >= -56 && lat <= 13) return 'América do Sul';
    if (L >= -170 && L <= -52 && lat > 13) return 'América do Norte e Central';
    if (L >= -25 && L <= 45 && lat >= 35) return 'Europa';
    if (L >= -18 && L <= 52 && lat >= -35 && lat < 35) return 'África';
    if (L > 45 && lat >= 5) return 'Ásia';
    if (L >= 110 && lat < 5 && lat >= -50) return 'Oceania';
    if (L > 20 && L < 110 && lat < 10) return 'Oceano Índico';
    if (L >= -70 && L <= 20) return lat >= 0 ? 'Oceano Atlântico Norte' : 'Oceano Atlântico Sul';
    return lat >= 0 ? 'Oceano Pacífico Norte' : 'Oceano Pacífico Sul';
};

/** Nodo lunar mais próximo do instante (a Lua cruza a eclíptica a no máximo ~1,5 dia de um eclipse). */
const nodeNear = (peak: Date): 'north' | 'south' => {
    try {
        const ev = SearchMoonNode(MakeTime(new Date(peak.getTime() - 3 * DAY_MS)));
        return ev.kind === NodeEventKind.Ascending ? 'north' : 'south';
    } catch {
        // Alternativa: latitude eclíptica da Lua subindo = perto do nodo norte
        const before = EclipticGeoMoon(MakeTime(new Date(peak.getTime() - 3600000))).lat;
        const after = EclipticGeoMoon(MakeTime(new Date(peak.getTime() + 3600000))).lat;
        return after > before ? 'north' : 'south';
    }
};

/** Ponto da Terra sob a Lua num instante (lat/lon geográficas). */
const subLunarPoint = (t: Date): { lat: number; lon: number } => {
    const [lon, lat] = getSubLunarPoint(t);
    return { lat, lon };
};

// ─────────────────────────────────────────────────────────────────────────────
// Lista de eclipses
// ─────────────────────────────────────────────────────────────────────────────

const yearCache = new Map<number, EclipseEvent[]>();

export const getEclipsesForYear = (year: number): EclipseEvent[] => {
    const cached = yearCache.get(year);
    if (cached) return cached;

    const list: EclipseEvent[] = [];
    const from = new Date(year, 0, 1);
    from.setDate(from.getDate() - 2);
    const until = new Date(year + 1, 0, 1).getTime() + 2 * DAY_MS;

    try {
        let s = SearchGlobalSolarEclipse(MakeTime(from));
        while (s.peak.date.getTime() < until) {
            const peak = s.peak.date;
            if (peak.getFullYear() === year) {
                const kind = toKind(s.kind);
                const lon = SunPosition(s.peak).elon;
                const greatest = (s.latitude !== undefined && s.longitude !== undefined)
                    ? { lat: s.latitude, lon: s.longitude }
                    : undefined;
                list.push({
                    id: `solar-${peak.toISOString()}`,
                    type: 'solar',
                    kind,
                    name: KIND_NAME.solar[kind] ?? 'Eclipse Solar',
                    peak,
                    tropicalLongitude: norm360(lon),
                    signIndex: Math.floor(norm360(lon) / 30),
                    degreeLabel: formatDegree(lon),
                    node: nodeNear(peak),
                    regions: KNOWN_REGIONS[utcKey(peak, 'solar')]
                        ?? (greatest ? `Máximo em: ${regionFromLatLon(greatest.lat, greatest.lon)}` : 'Regiões polares'),
                    greatest,
                });
            }
            s = NextGlobalSolarEclipse(s.peak);
        }

        let l = SearchLunarEclipse(MakeTime(from));
        while (l.peak.date.getTime() < until) {
            const peak = l.peak.date;
            if (peak.getFullYear() === year) {
                const kind = toKind(l.kind);
                const lon = EclipticGeoMoon(l.peak).lon;
                const under = subLunarPoint(peak);
                list.push({
                    id: `lunar-${peak.toISOString()}`,
                    type: 'lunar',
                    kind,
                    name: KIND_NAME.lunar[kind] ?? 'Eclipse Lunar',
                    peak,
                    tropicalLongitude: norm360(lon),
                    signIndex: Math.floor(norm360(lon) / 30),
                    degreeLabel: formatDegree(lon),
                    node: nodeNear(peak),
                    regions: KNOWN_REGIONS[utcKey(peak, 'lunar')]
                        ?? `Noite em: ${regionFromLatLon(under.lat, under.lon)}`,
                    greatest: under,
                    lunarObscuration: l.obscuration,
                    lunarSemiDurations: { penumbral: l.sd_penum, partial: l.sd_partial, total: l.sd_total },
                });
            }
            l = NextLunarEclipse(l.peak);
        }
    } catch (err) {
        console.warn('[eclipses] falha ao calcular eclipses de', year, err);
    }

    list.sort((a, b) => a.peak.getTime() - b.peak.getTime());
    yearCache.set(year, list);
    return list;
};

/** Eclipse cujo pico cai no mesmo dia local da data informada. */
export const getEclipseOnLocalDate = (date: Date): EclipseEvent | null => {
    if (!date || isNaN(date.getTime())) return null;
    return getEclipsesForYear(date.getFullYear()).find(e => sameLocalDay(e.peak, date)) ?? null;
};

/**
 * Próximo eclipse a partir de `date` (o eclipse do próprio dia conta).
 * `daysUntil` em dias de calendário locais (0 = hoje).
 */
export const getUpcomingEclipse = (date: Date): { event: EclipseEvent; daysUntil: number } | null => {
    if (!date || isNaN(date.getTime())) return null;
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    for (const y of [date.getFullYear(), date.getFullYear() + 1]) {
        const ev = getEclipsesForYear(y).find(e => e.peak.getTime() >= dayStart);
        if (ev) return { event: ev, daysUntil: calendarDaysBetween(date, ev.peak) };
    }
    return null;
};

/** O outro eclipse da mesma temporada (até ~20 dias antes ou depois). */
export const getSeasonPartner = (ev: EclipseEvent): EclipseEvent | null => {
    const y = ev.peak.getFullYear();
    const pool = [...getEclipsesForYear(y - 1), ...getEclipsesForYear(y), ...getEclipsesForYear(y + 1)];
    let best: EclipseEvent | null = null;
    let bestDiff = Infinity;
    for (const e of pool) {
        if (e.id === ev.id) continue;
        const diff = Math.abs(e.peak.getTime() - ev.peak.getTime());
        if (diff < 20 * DAY_MS && diff < bestDiff) { best = e; bestDiff = diff; }
    }
    return best;
};

// ─────────────────────────────────────────────────────────────────────────────
// Visão local
// ─────────────────────────────────────────────────────────────────────────────

const moonAltitude = (t: Date, obs: Observer): number => {
    const time = MakeTime(t);
    const eq = Equator(Body.Moon, time, obs, true, true);
    return Horizon(time, obs, eq.ra, eq.dec, 'normal').altitude;
};

/**
 * Varredura rápida da cobertura do Sol num local (amostras a cada 10 min em torno do pico).
 * Usada para descartar locais fora da sombra e para escolher as cidades principais.
 */
const scanCache = new Map<string, { maxCoverage: number; bestTime: Date; altitude: number }>();
export const scanSolarCoverage = (ev: EclipseEvent, lat: number, lon: number): { maxCoverage: number; bestTime: Date; altitude: number } => {
    const key = `${ev.id}|${lat.toFixed(2)}|${lon.toFixed(2)}`;
    const cached = scanCache.get(key);
    if (cached) return cached;
    const obs = new Observer(lat, lon, 0);
    const sample = (ms: number) => {
        const time = MakeTime(new Date(ms));
        const sun = Equator(Body.Sun, time, obs, true, true);
        const moon = Equator(Body.Moon, time, obs, true, true);
        const a = sun.vec, b = moon.vec;
        const cx = a.y * b.z - a.z * b.y, cy = a.z * b.x - a.x * b.z, cz = a.x * b.y - a.y * b.x;
        const sep = Math.atan2(Math.sqrt(cx * cx + cy * cy + cz * cz), a.x * b.x + a.y * b.y + a.z * b.z) / RAD;
        const sunR = Math.asin(SUN_RADIUS_KM / (sun.dist * KM_PER_AU)) / RAD;
        const moonR = Math.asin(MOON_RADIUS_KM / (moon.dist * KM_PER_AU)) / RAD;
        return { sep, sunR, moonR, sun, time };
    };
    const peakMs = ev.peak.getTime();
    const first = sample(peakMs);
    let result = { maxCoverage: 0, bestTime: ev.peak, altitude: -90 };
    if (first.sep - (first.sunR + first.moonR) < 2.2) {
        let best = { cov: 0, ms: peakMs };
        for (let ms = peakMs - 3.5 * 3600000; ms <= peakMs + 3.5 * 3600000; ms += 10 * 60000) {
            const s = sample(ms);
            const cov = circleOverlapArea(s.sep, s.sunR, s.moonR) / (Math.PI * s.sunR * s.sunR);
            if (cov > best.cov) best = { cov, ms };
        }
        if (best.cov > 0) {
            const s = sample(best.ms);
            const alt = Horizon(s.time, obs, s.sun.ra, s.sun.dec, 'normal').altitude;
            result = { maxCoverage: Math.min(1, best.cov), bestTime: new Date(best.ms), altitude: alt };
        }
    }
    scanCache.set(key, result);
    return result;
};

const localCache = new Map<string, EclipseLocalView>();

export const getLocalView = (ev: EclipseEvent, lat: number, lon: number): EclipseLocalView => {
    const key = `${ev.id}|${lat.toFixed(3)}|${lon.toFixed(3)}`;
    const cached = localCache.get(key);
    if (cached) return cached;

    const obs = new Observer(lat, lon, 0);
    let view: EclipseLocalView;

    if (ev.type === 'solar') {
        // Pré-filtro barato: se o Sol nunca é tocado pela Lua aqui, nem chama a busca completa
        const scan = scanSolarCoverage(ev, lat, lon);
        const info = scan.maxCoverage > 0
            ? SearchLocalSolarEclipse(MakeTime(new Date(ev.peak.getTime() - DAY_MS)), obs)
            : null;
        const samePeak = !!info && Math.abs(info.peak.time.date.getTime() - ev.peak.getTime()) < DAY_MS;
        if (!info || !samePeak) {
            view = {
                visible: false, reason: 'outside-shadow', kind: ev.kind, obscuration: 0,
                begin: new Date(ev.peak.getTime() - 90 * 60000), peak: ev.peak, end: new Date(ev.peak.getTime() + 90 * 60000),
                peakAltitude: 0,
            };
        } else {
            const anyAbove = Math.max(info.partial_begin.altitude, info.peak.altitude, info.partial_end.altitude) > 0;
            view = {
                visible: anyAbove,
                reason: anyAbove ? undefined : 'below-horizon',
                kind: toKind(info.kind),
                obscuration: info.obscuration,
                begin: info.partial_begin.time.date,
                peak: info.peak.time.date,
                end: info.partial_end.time.date,
                centralBegin: info.total_begin?.time.date,
                centralEnd: info.total_end?.time.date,
                peakAltitude: info.peak.altitude,
            };
        }
    } else {
        const sd = ev.lunarSemiDurations ?? { penumbral: 0, partial: 0, total: 0 };
        const at = (min: number) => new Date(ev.peak.getTime() + min * 60000);
        const begin = at(-sd.penumbral);
        const end = at(sd.penumbral);
        const alts = [begin, at(-sd.partial), ev.peak, at(sd.partial), end].map(t => moonAltitude(t, obs));
        const anyAbove = Math.max(...alts) > 0;
        view = {
            visible: anyAbove,
            reason: anyAbove ? undefined : 'below-horizon',
            kind: ev.kind,
            obscuration: ev.lunarObscuration ?? 0,
            begin,
            peak: ev.peak,
            end,
            partialBegin: sd.partial > 0 ? at(-sd.partial) : undefined,
            partialEnd: sd.partial > 0 ? at(sd.partial) : undefined,
            centralBegin: sd.total > 0 ? at(-sd.total) : undefined,
            centralEnd: sd.total > 0 ? at(sd.total) : undefined,
            peakAltitude: alts[2],
        };
    }

    localCache.set(key, view);
    return view;
};

// ─────────────────────────────────────────────────────────────────────────────
// Geometria do disco (ilustração + timer)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sol e Lua como o observador vê, com o zênite para cima no instante `orientationTime`
 * (use o máximo do eclipse). A orientação fica FIXA durante todo o eclipse — se ela
 * acompanhasse cada instante, o quadro giraria junto com o céu (muito rápido quando o
 * Sol passa perto do zênite) e a Lua pareceria ir e voltar.
 * Raios e deslocamentos em graus.
 */
export const getSolarDisc = (t: Date, lat: number, lon: number, orientationTime?: Date): EclipseDisc => {
    const time = MakeTime(t);
    const obs = new Observer(lat, lon, 0);
    const sun = Equator(Body.Sun, time, obs, true, true);
    const moon = Equator(Body.Moon, time, obs, true, true);

    const sunR = Math.asin(SUN_RADIUS_KM / (sun.dist * KM_PER_AU)) / RAD;
    const moonR = Math.asin(MOON_RADIUS_KM / (moon.dist * KM_PER_AU)) / RAD;

    let dRA = (moon.ra - sun.ra) * 15;
    dRA = ((dRA + 540) % 360) - 180;
    const east = dRA * Math.cos(sun.dec * RAD);
    const north = moon.dec - sun.dec;

    // Ângulo paralático (fixo no instante de orientação): zênite para cima
    const oTime = orientationTime ? MakeTime(orientationTime) : time;
    const oSun = orientationTime ? Equator(Body.Sun, oTime, obs, true, true) : sun;
    const lst = SiderealTime(oTime) + lon / 15;
    const H = ((lst - oSun.ra) * 15) * RAD;
    const phi = lat * RAD;
    const dec = oSun.dec * RAD;
    const q = Math.atan2(Math.sin(H), Math.tan(phi) * Math.cos(dec) - Math.sin(dec) * Math.cos(H));

    const r = Math.hypot(east, north);
    const pa = Math.atan2(east, north) - q; // ângulo de posição relativo ao zênite
    const dx = -r * Math.sin(pa);           // leste para a esquerda
    const dy = -r * Math.cos(pa);           // zênite para cima (y da tela cresce para baixo)

    const coverage = circleOverlapArea(r, sunR, moonR) / (Math.PI * sunR * sunR);
    const altitude = Horizon(time, obs, sun.ra, sun.dec, 'normal').altitude;

    return { baseRadius: sunR, moonRadius: moonR, dx, dy, coverage, altitude };
};

/**
 * Lua atravessando a sombra da Terra (umbra e penumbra), norte para cima.
 * Raios e deslocamentos em graus. `altitude` = altura da Lua no local.
 */
export const getLunarDisc = (t: Date, lat: number, lon: number): EclipseDisc => {
    const time = MakeTime(t);
    const sunV = GeoVector(Body.Sun, time, true);
    const moonV = GeoVector(Body.Moon, time, true);

    const sunDistKm = Math.hypot(sunV.x, sunV.y, sunV.z) * KM_PER_AU;
    const moonDistKm = Math.hypot(moonV.x, moonV.y, moonV.z) * KM_PER_AU;

    // Centro da sombra = direção oposta ao Sol
    const cLen = Math.hypot(sunV.x, sunV.y, sunV.z);
    const c = { x: -sunV.x / cLen, y: -sunV.y / cLen, z: -sunV.z / cLen };
    // Eixos locais: leste e norte ao redor do centro da sombra
    let ex = { x: -c.y, y: c.x, z: 0 };
    const eLen = Math.hypot(ex.x, ex.y) || 1;
    ex = { x: ex.x / eLen, y: ex.y / eLen, z: 0 };
    const nx = { x: c.y * ex.z - c.z * ex.y, y: c.z * ex.x - c.x * ex.z, z: c.x * ex.y - c.y * ex.x };

    const mLen = Math.hypot(moonV.x, moonV.y, moonV.z);
    const m = { x: moonV.x / mLen, y: moonV.y / mLen, z: moonV.z / mLen };
    const east = (m.x * ex.x + m.y * ex.y + m.z * ex.z) / RAD;
    const north = (m.x * nx.x + m.y * nx.y + m.z * nx.z) / RAD;

    const sunR = Math.asin(SUN_RADIUS_KM / sunDistKm) / RAD;
    const moonR = Math.asin(MOON_RADIUS_KM / moonDistKm) / RAD;
    const parMoon = Math.asin(EARTH_RADIUS_KM / moonDistKm) / RAD;
    const parSun = Math.asin(EARTH_RADIUS_KM / sunDistKm) / RAD;
    const umbraR = 1.02 * (parMoon + parSun - sunR);
    const penumbraR = 1.02 * (parMoon + parSun + sunR);

    const r = Math.hypot(east, north);
    const coverage = circleOverlapArea(r, umbraR, moonR) / (Math.PI * moonR * moonR);
    const altitude = moonAltitude(t, new Observer(lat, lon, 0));

    return { baseRadius: umbraR, penumbraRadius: penumbraR, moonRadius: moonR, dx: -east, dy: -north, coverage, altitude };
};

// ─────────────────────────────────────────────────────────────────────────────
// Locais principais de cada eclipse
// ─────────────────────────────────────────────────────────────────────────────

export interface EclipsePlace {
    id: string;
    name: string;
    lat: number;
    lon: number;
    /** central = faixa do anel/totalidade · max = ponto de máximo · zenith = Lua no zênite · city = cidade */
    role: 'central' | 'max' | 'zenith' | 'city';
}

const WORLD_CITIES: Array<[string, number, number]> = [
    ['São Paulo', -23.55, -46.63], ['Rio de Janeiro', -22.91, -43.17], ['Brasília', -15.79, -47.88],
    ['Salvador', -12.97, -38.5], ['Fortaleza', -3.73, -38.52], ['Recife', -8.05, -34.88],
    ['Belo Horizonte', -19.92, -43.94], ['Manaus', -3.12, -60.02], ['Porto Alegre', -30.03, -51.23],
    ['Belém', -1.46, -48.5], ['Natal', -5.79, -35.21], ['Curitiba', -25.43, -49.27],
    ['Buenos Aires', -34.6, -58.38], ['Montevidéu', -34.9, -56.16], ['Santiago', -33.45, -70.67],
    ['Lima', -12.05, -77.04], ['Bogotá', 4.71, -74.07], ['Quito', -0.18, -78.47],
    ['Cidade do México', 19.43, -99.13], ['Nova York', 40.71, -74.01], ['Los Angeles', 34.05, -118.24],
    ['Toronto', 43.65, -79.38], ['Lisboa', 38.72, -9.14], ['Madri', 40.42, -3.7],
    ['Paris', 48.86, 2.35], ['Londres', 51.51, -0.13], ['Roma', 41.9, 12.5], ['Berlim', 52.52, 13.4],
    ['Reykjavík', 64.15, -21.94], ['Atenas', 37.98, 23.73], ['Cairo', 30.04, 31.24],
    ['Lagos', 6.52, 3.38], ['Acra', 5.6, -0.19], ['Dacar', 14.72, -17.47], ['Luanda', -8.84, 13.23],
    ['Joanesburgo', -26.2, 28.05], ['Nairóbi', -1.29, 36.82], ['Dubai', 25.2, 55.27],
    ['Mumbai', 19.08, 72.88], ['Pequim', 39.9, 116.4], ['Tóquio', 35.68, 139.69],
    ['Jacarta', -6.21, 106.85], ['Sydney', -33.87, 151.21], ['Auckland', -36.85, 174.76],
    ['Honolulu', 21.31, -157.86],
];

const isOcean = (region: string) => region.startsWith('Oceano');
const placesCache = new Map<string, EclipsePlace[]>();

/**
 * Locais principais: faixa central (ou ponto de máximo / Lua no zênite)
 * + as cidades de onde o eclipse é mais bem visto.
 */
export const getMainPlaces = (ev: EclipseEvent): EclipsePlace[] => {
    const cached = placesCache.get(ev.id);
    if (cached) return cached;
    const out: EclipsePlace[] = [];

    try {
        if (ev.type === 'solar') {
            const track = (ev.kind === 'annular' || ev.kind === 'total') ? getCentralTrack(ev.id, ev.peak).flat() : [];
            const label = ev.kind === 'annular' ? 'Anel' : 'Totalidade';
            if (track.length) {
                // Agrupa a faixa por região e pega o ponto do meio de cada trecho
                const groups: Array<{ region: string; pts: Array<[number, number]> }> = [];
                for (const [lon, lat] of track) {
                    const region = regionFromLatLon(lat, lon);
                    const last = groups[groups.length - 1];
                    if (last && last.region === region) last.pts.push([lon, lat]);
                    else groups.push({ region, pts: [[lon, lat]] });
                }
                const land = groups.filter(g => !isOcean(g.region));
                const chosen = (land.length ? land : groups)
                    .sort((a, b) => b.pts.length - a.pts.length)
                    .slice(0, land.length ? 2 : 1);
                const seen = new Set<string>();
                for (const g of chosen) {
                    if (seen.has(g.region)) continue;
                    seen.add(g.region);
                    const [lon, lat] = g.pts[Math.floor(g.pts.length / 2)];
                    out.push({ id: `central-${g.region}`, name: `${label} · ${g.region}`, lat, lon, role: 'central' });
                }
            } else {
                const [lon, lat] = getShadowState(ev.peak).nearest;
                out.push({ id: 'max', name: `Máximo · ${regionFromLatLon(lat, lon)}`, lat, lon, role: 'max' });
            }

            const ranked = WORLD_CITIES
                .map(([name, lat, lon]) => ({ name, lat, lon, scan: scanSolarCoverage(ev, lat, lon) }))
                .filter(c => c.scan.maxCoverage >= 0.05 && c.scan.altitude > 0)
                .sort((a, b) => b.scan.maxCoverage - a.scan.maxCoverage)
                .slice(0, 3);
            for (const c of ranked) out.push({ id: `city-${c.name}`, name: c.name, lat: c.lat, lon: c.lon, role: 'city' });
        } else {
            const [lon, lat] = getSubLunarPoint(ev.peak);
            out.push({ id: 'zenith', name: `Lua no zênite · ${regionFromLatLon(lat, lon)}`, lat, lon, role: 'zenith' });
            const ranked = WORLD_CITIES
                .map(([name, clat, clon]) => ({ name, lat: clat, lon: clon, alt: moonAltitude(ev.peak, new Observer(clat, clon, 0)) }))
                .filter(c => c.alt > 10)
                .sort((a, b) => b.alt - a.alt)
                .slice(0, 3);
            for (const c of ranked) out.push({ id: `city-${c.name}`, name: c.name, lat: c.lat, lon: c.lon, role: 'city' });
        }
    } catch (err) {
        console.warn('[eclipses] falha ao calcular locais principais', err);
    }

    placesCache.set(ev.id, out);
    return out;
};
