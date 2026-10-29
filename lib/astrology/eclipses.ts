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
    const eq = Equator(Body.Moon, MakeTime(t), new Observer(0, 0, 0), true, true);
    const gst = SiderealTime(MakeTime(t));
    let lon = (eq.ra - gst) * 15;
    lon = ((lon + 540) % 360) - 180;
    return { lat: eq.dec, lon };
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

const localCache = new Map<string, EclipseLocalView>();

export const getLocalView = (ev: EclipseEvent, lat: number, lon: number): EclipseLocalView => {
    const key = `${ev.id}|${lat.toFixed(3)}|${lon.toFixed(3)}`;
    const cached = localCache.get(key);
    if (cached) return cached;

    const obs = new Observer(lat, lon, 0);
    let view: EclipseLocalView;

    if (ev.type === 'solar') {
        const info = SearchLocalSolarEclipse(MakeTime(new Date(ev.peak.getTime() - DAY_MS)), obs);
        const samePeak = Math.abs(info.peak.time.date.getTime() - ev.peak.getTime()) < DAY_MS;
        if (!samePeak) {
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
 * Sol e Lua como o observador vê, com o zênite para cima.
 * Raios e deslocamentos em graus.
 */
export const getSolarDisc = (t: Date, lat: number, lon: number): EclipseDisc => {
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

    // Ângulo paralático: gira o quadro para o zênite ficar para cima
    const lst = SiderealTime(time) + lon / 15;
    const H = ((lst - sun.ra) * 15) * RAD;
    const phi = lat * RAD;
    const dec = sun.dec * RAD;
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
// Leitura (tropical) — rascunho editável
// ─────────────────────────────────────────────────────────────────────────────

const SIGN_THEMES = [
    'coragem, iniciativa e identidade',
    'recursos, corpo e segurança material',
    'comunicação, estudos e trocas do dia a dia',
    'casa, família e raízes emocionais',
    'criatividade, expressão e reconhecimento',
    'rotina, saúde e trabalho bem-feito',
    'parcerias, acordos e equilíbrio nas relações',
    'intimidade, crises e transformação profunda',
    'crenças, viagens e expansão de horizontes',
    'carreira, estrutura e responsabilidade',
    'grupos, redes e projetos coletivos',
    'espiritualidade, sensibilidade e encerramentos',
];

export const getEclipseReading = (ev: EclipseEvent): string => {
    const sign = SIGNS_PT[ev.signIndex];
    const theme = SIGN_THEMES[ev.signIndex];
    const opening = ev.type === 'solar'
        ? `Eclipse solar em ${sign}: abre um ciclo ligado a ${theme}.`
        : `Eclipse lunar em ${sign}: culmina e revela o que vinha sendo construído em ${theme}.`;
    const node = ev.node === 'north'
        ? 'Junto ao Nodo Norte, o movimento é de atração para o novo: bom para assumir direções que ainda pedem aprendizado.'
        : 'Junto ao Nodo Sul, o movimento é de liberação: bom para soltar o que já cumpriu seu papel.';
    const closing = ev.type === 'solar'
        ? 'Os efeitos costumam se desdobrar nos seis meses seguintes.'
        : 'Emoções e desfechos tendem a vir à tona nas duas semanas em torno do eclipse.';
    return `${opening} ${node} ${closing}`;
};
