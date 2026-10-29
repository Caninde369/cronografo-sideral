/**
 * Sombra da Lua sobre a Terra (eclipses solares) e pontos sob Sol/Lua.
 *
 * Geometria clássica do "plano fundamental":
 *  - eixo da sombra = reta que passa pela Lua na direção Sol → Lua;
 *  - penumbra/umbra = cones tangentes ao Sol e à Lua;
 *  - o contorno da penumbra é amostrado no plano que passa pelo centro da Terra
 *    (perpendicular ao eixo) e "levantado" para a superfície no lado do Sol.
 *
 * Tudo em vetores geocêntricos J2000 (EQJ, em UA) da astronomy-engine;
 * a conversão para latitude/longitude usa VectorObserver.
 */
import { AstroTime, Body, GeoVector, MakeTime, Vector, VectorObserver } from 'astronomy-engine';

const KM_PER_AU = 149597870.69098932;
const R_EARTH = 6378.137 / KM_PER_AU;
const R_SUN = 695700 / KM_PER_AU;
const R_MOON = 1737.4 / KM_PER_AU;
const DEG = 180 / Math.PI;

type V3 = { x: number; y: number; z: number };
export type LonLat = [number, number];

const sub = (a: V3, b: V3): V3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const add = (a: V3, b: V3): V3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const mul = (a: V3, k: number): V3 => ({ x: a.x * k, y: a.y * k, z: a.z * k });
const dot = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
const len = (a: V3) => Math.sqrt(dot(a, a));
const unit = (a: V3): V3 => mul(a, 1 / (len(a) || 1));
const cross = (a: V3, b: V3): V3 => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });

/** Geometria pura (sem conversão geográfica) — exportada para teste. */
export interface ShadowGeometry {
    /** Direção do eixo (Sol → Lua) */
    d: V3;
    /** Ponto do eixo mais próximo do centro da Terra (no plano fundamental) */
    q: V3;
    /** Interseção do eixo com a superfície (se o eixo toca a Terra) */
    hit: V3 | null;
    /** Raio da penumbra no plano fundamental (UA) */
    penumbraRadius: number;
    /** Raio da umbra na superfície (UA): > 0 total, < 0 anular (antumbra) */
    umbraRadiusAtSurface: number;
    /** Pontos do contorno da penumbra na superfície (lado do Sol), ou null se a penumbra não toca a Terra */
    penumbraRing: V3[] | null;
}

export const computeShadowGeometry = (sun: V3, moon: V3, ringPoints = 48): ShadowGeometry => {
    const sm = sub(moon, sun);
    const D = len(sm);
    const d = unit(sm);
    const s0 = -dot(moon, d);               // distância Lua → plano fundamental, ao longo do eixo
    const q = add(moon, mul(d, s0));        // ponto do eixo mais próximo do centro da Terra
    const g = len(q);

    const f1 = Math.asin((R_SUN + R_MOON) / D);
    const f2 = Math.asin((R_SUN - R_MOON) / D);
    const penumbraRadius = R_MOON / Math.cos(f1) + s0 * Math.tan(f1);

    let hit: V3 | null = null;
    let sHit = s0;
    if (g < R_EARTH) {
        sHit = s0 - Math.sqrt(R_EARTH * R_EARTH - g * g);
        hit = add(moon, mul(d, sHit));
    }
    const umbraRadiusAtSurface = R_MOON / Math.cos(f2) - sHit * Math.tan(f2);

    // Contorno da penumbra
    let penumbraRing: V3[] | null = null;
    if (g - penumbraRadius < R_EARTH) {
        let u = cross(d, { x: 0, y: 0, z: 1 });
        if (len(u) < 1e-6) u = cross(d, { x: 1, y: 0, z: 0 });
        u = unit(u);
        const v = cross(d, u);
        penumbraRing = [];
        for (let i = 0; i < ringPoints; i++) {
            const th = (i / ringPoints) * 2 * Math.PI;
            const p = add(q, add(mul(u, penumbraRadius * Math.cos(th)), mul(v, penumbraRadius * Math.sin(th))));
            const r = len(p);
            if (r <= R_EARTH) {
                const h = Math.sqrt(R_EARTH * R_EARTH - r * r);
                penumbraRing.push(add(p, mul(d, -h)));   // lado da Terra voltado para o Sol
            } else {
                penumbraRing.push(mul(p, R_EARTH / r));  // borda (limbo) da Terra
            }
        }
    }

    return { d, q, hit, penumbraRadius, umbraRadiusAtSurface, penumbraRing };
};

const toLonLat = (p: V3, time: AstroTime): LonLat => {
    const obs = VectorObserver(new Vector(p.x, p.y, p.z, time), false);
    return [((obs.longitude + 540) % 360) - 180, obs.latitude];
};

/** Ponto da superfície na direção de um vetor geocêntrico (sub-solar, sub-lunar…) */
const subPoint = (dir: V3, time: AstroTime): LonLat => toLonLat(mul(unit(dir), R_EARTH), time);

export interface ShadowState {
    /** Centro da sombra (eixo toca a Terra): onde o eclipse é central (anel/total) */
    center: LonLat | null;
    /** Ponto da Terra mais próximo do eixo (= centro, ou o limbo na direção do eixo) */
    nearest: LonLat;
    /** Contorno da penumbra (área com eclipse parcial), ou null */
    penumbra: LonLat[] | null;
    /** Raio angular (°) da mancha central (umbra/antumbra) na superfície */
    centralSpotDeg: number;
    /** Ponto sob o Sol (para desenhar a noite) */
    subsolar: LonLat;
}

export const getShadowState = (t: Date): ShadowState => {
    const time = MakeTime(t);
    const sun = GeoVector(Body.Sun, time, true);
    const moon = GeoVector(Body.Moon, time, true);
    const geo = computeShadowGeometry(sun, moon);
    const g = len(geo.q);
    const nearestV = geo.hit ?? mul(geo.q, R_EARTH / (g || 1));
    return {
        center: geo.hit ? toLonLat(geo.hit, time) : null,
        nearest: toLonLat(nearestV, time),
        penumbra: geo.penumbraRing ? geo.penumbraRing.map(p => toLonLat(p, time)) : null,
        centralSpotDeg: Math.max(0.6, Math.abs(geo.umbraRadiusAtSurface) / R_EARTH * DEG),
        subsolar: subPoint(sun, time),
    };
};

export const getSubLunarPoint = (t: Date): LonLat => {
    const time = MakeTime(t);
    return subPoint(GeoVector(Body.Moon, time, true), time);
};

export const getSubSolarPoint = (t: Date): LonLat => {
    const time = MakeTime(t);
    return subPoint(GeoVector(Body.Sun, time, true), time);
};

const trackCache = new Map<string, LonLat[][]>();

/**
 * Faixa central (onde o eclipse é anular/total): trajetória do centro da sombra,
 * amostrada a cada 2 minutos. Pode ter mais de um trecho; vazio se o eclipse não é central.
 */
export const getCentralTrack = (eventId: string, peak: Date): LonLat[][] => {
    const cached = trackCache.get(eventId);
    if (cached) return cached;
    const segments: LonLat[][] = [];
    let current: LonLat[] = [];
    const stepMs = 2 * 60000;
    for (let t = peak.getTime() - 4 * 3600000; t <= peak.getTime() + 4 * 3600000; t += stepMs) {
        const time = MakeTime(new Date(t));
        const geo = computeShadowGeometry(GeoVector(Body.Sun, time, true), GeoVector(Body.Moon, time, true), 0);
        if (geo.hit) {
            current.push(toLonLat(geo.hit, time));
        } else if (current.length) {
            segments.push(current);
            current = [];
        }
    }
    if (current.length) segments.push(current);
    trackCache.set(eventId, segments);
    return segments;
};
