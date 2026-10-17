import { useMemo, useRef } from 'react';
import SunCalc from 'suncalc';
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
    calculatePlutoTropicalLongitude
} from '../lib/astrology/celestialBodies';
import {
    calculateLilithTropicalLongitude,
    calculateNorthNodeTropicalLongitude,
    calculateChironTropicalLongitude,
    calculateCeresTropicalLongitude,
    calculatePallasTropicalLongitude,
    calculateJunoTropicalLongitude,
    calculateVestaTropicalLongitude
} from '../lib/astrology/astroPoints';
import {
    calculateLocalSiderealTime,
    calculateMidheaven,
    calculateAscendant,
    calculateHouseCusps,
    getHousePlacement,
    HouseSystem
} from '../lib/astrology/houseSystem';
import { calculateAllRetrogrades, calculateAllStationary } from '../lib/astrology/retrogrades';
import { calculateAspects, Aspect } from '../lib/astrology/aspects';
import { normalizeAngle } from '../lib/astrology/utils';

export type CelestialData = {
    currentTime: Date;
    isDayTime: boolean;
    sunDisplayHour: number;
    sunriseHour: number;
    sunsetHour: number;
    solarNoonHour: number;
    nadirHour: number;
    isMoonVisible: boolean;
    moonPhase: number;
    moonIllumination: number;
    moonAzimuth: number;
    moonAltitude: number;
    sunAltitude: number;
    sunriseTime: string;
    sunsetTime: string;
    moonriseTime: string;
    moonsetTime: string;
    gradientStatus: 'night' | 'dawn' | 'day' | 'dusk';
    gradientProgress: number;
    sunEclipticLongitude: number;
    moonEclipticLongitude: number;
    mercuryEclipticLongitude: number;
    marsEclipticLongitude: number;
    venusEclipticLongitude: number;
    jupiterEclipticLongitude: number;
    saturnEclipticLongitude: number;
    neptuneEclipticLongitude: number;
    uranusEclipticLongitude: number;
    plutoEclipticLongitude: number;
    lilithEclipticLongitude: number;
    northNodeEclipticLongitude: number;
    southNodeEclipticLongitude: number;
    chironEclipticLongitude: number;
    ceresEclipticLongitude: number;
    pallasEclipticLongitude: number;
    junoEclipticLongitude: number;
    vestaEclipticLongitude: number;
    partOfFortuneEclipticLongitude: number;
    midheavenLongitude: number;
    ascendantLongitude: number;
    descendantLongitude: number;
    imumCoeliLongitude: number;
    zodiacRotation: number;
    retrogradeStatus: Record<string, boolean>;
    stationaryStatus: Record<string, boolean>;
    houseCusps: number[];
    housePlacements: Record<string, number>;
    aspects: Aspect[];
    houseSystem: HouseSystem;
};

type LocationState = {
    latitude: number;
    longitude: number;
    displayName: string;
};

const TRANSITION_DURATION_MS = 60 * 60 * 1000;

const formatTime = (date: Date): string => {
    if (!date || isNaN(date.getTime())) return '--:--';
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

// ─────────────────────────────────────────────────────────────────────────────
// SLOW PLANETS CACHE
//
// Saturno, Urano, Netuno, Plutão, Quíron, asteroides e Nodo Norte
// se movem < 0.0001° por segundo. Recalcular a cada segundo é desperdício.
//
// Estratégia: recalcular planetas lentos 1x/minuto.
// O cache guarda o último minuto calculado e os valores.
// Se o minuto não mudou, retorna o cache sem nenhum cálculo.
// ─────────────────────────────────────────────────────────────────────────────
type SlowPlanetsCache = {
    minuteKey: number;
    jupiter: number;
    saturn: number;
    uranus: number;
    neptune: number;
    pluto: number;
    lilith: number;
    northNode: number;
    chiron: number;
    ceres: number;
    pallas: number;
    juno: number;
    vesta: number;
    retrogradeStatus: Record<string, boolean>;
    stationaryStatus: Record<string, boolean>;
};

// Cache global — persiste entre renders, não causa re-renders
let slowPlanetsCache: SlowPlanetsCache | null = null;

const getSlowPlanets = (currentTime: Date): Omit<SlowPlanetsCache, 'minuteKey'> => {
    const minuteKey = Math.floor(currentTime.getTime() / 60000);

    if (slowPlanetsCache && slowPlanetsCache.minuteKey === minuteKey) {
        // Cache hit: retorna sem nenhum cálculo
        const { minuteKey: _, ...cached } = slowPlanetsCache;
        return cached;
    }

    // Cache miss: recalcula e armazena
    const northNode = calculateNorthNodeTropicalLongitude(currentTime);
    const result = {
        jupiter:         calculateJupiterTropicalLongitude(currentTime),
        saturn:          calculateSaturnTropicalLongitude(currentTime),
        uranus:          calculateUranusTropicalLongitude(currentTime),
        neptune:         calculateNeptuneTropicalLongitude(currentTime),
        pluto:           calculatePlutoTropicalLongitude(currentTime),
        lilith:          calculateLilithTropicalLongitude(currentTime),
        northNode,
        chiron:          calculateChironTropicalLongitude(currentTime),
        ceres:           calculateCeresTropicalLongitude(currentTime),
        pallas:          calculatePallasTropicalLongitude(currentTime),
        juno:            calculateJunoTropicalLongitude(currentTime),
        vesta:           calculateVestaTropicalLongitude(currentTime),
        retrogradeStatus: calculateAllRetrogrades(currentTime),
        stationaryStatus: calculateAllStationary(currentTime),
    };

    slowPlanetsCache = { minuteKey, ...result };
    return result;
};

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE helper
// ─────────────────────────────────────────────────────────────────────────────
const makeEmpty = (currentTime: Date, houseSystem: HouseSystem): CelestialData => ({
    currentTime,
    isDayTime: false, sunDisplayHour: 12, sunriseHour: 6, sunsetHour: 18,
    solarNoonHour: 12, nadirHour: 0,
    isMoonVisible: false, moonPhase: 0, moonIllumination: 0,
    moonAzimuth: 0, moonAltitude: 0, sunAltitude: 0,
    sunriseTime: 'N/A', sunsetTime: 'N/A',
    moonriseTime: 'N/A', moonsetTime: 'N/A',
    gradientStatus: 'night', gradientProgress: 0,
    sunEclipticLongitude: 0, moonEclipticLongitude: 0,
    mercuryEclipticLongitude: 0, marsEclipticLongitude: 0,
    venusEclipticLongitude: 0, jupiterEclipticLongitude: 0,
    saturnEclipticLongitude: 0, neptuneEclipticLongitude: 0,
    uranusEclipticLongitude: 0, plutoEclipticLongitude: 0,
    lilithEclipticLongitude: 0, northNodeEclipticLongitude: 0,
    southNodeEclipticLongitude: 0, chironEclipticLongitude: 0,
    ceresEclipticLongitude: 0, pallasEclipticLongitude: 0,
    junoEclipticLongitude: 0, vestaEclipticLongitude: 0,
    partOfFortuneEclipticLongitude: 0,
    midheavenLongitude: 0, ascendantLongitude: 0,
    descendantLongitude: 180, imumCoeliLongitude: 180,
    zodiacRotation: 0,
    retrogradeStatus: {},
    stationaryStatus: {},
    houseCusps: Array(12).fill(0).map((_, i) => i * 30),
    housePlacements: {}, aspects: [], houseSystem
});

// ─────────────────────────────────────────────────────────────────────────────
// AYANAMSA (Lahiri)
// ─────────────────────────────────────────────────────────────────────────────
const getAyanamsa = (date: Date): number => {
    const jd = date.getTime() / 86400000 + 2440587.5;
    const T = (jd - 2451545.0) / 36525.0;
    // Lahiri approximation: 23.85 + 1.396 * T
    return normalizeAngle(23.85 + 1.396 * T);
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CALCULATION
// Split em dois tiers:
//   FAST (a cada segundo): Sol, Lua, Mercúrio, Vênus, Marte + SunCalc + casas
//   SLOW (a cada minuto):  Júpiter, Saturno, Urano, Netuno, Plutão,
//                          asteroides, nodos, quíron, retrógrados
// ─────────────────────────────────────────────────────────────────────────────
export const calculateCelestialData = (
    currentTime: Date | null,
    location: LocationState,
    visiblePlanets: Record<string, boolean>,
    houseSystem: HouseSystem = 'porphyry',
    zodiacSystem: 'sidereal' | 'tropical' = 'sidereal'
): CelestialData => {
    if (!currentTime || isNaN(currentTime.getTime())) {
        return makeEmpty(currentTime || new Date(0), houseSystem);
    }

    const ayanamsa = zodiacSystem === 'sidereal' ? -getAyanamsa(currentTime) : 0;
    const ao = (lon: number) => normalizeAngle(lon + ayanamsa);

    const currentMs = currentTime.getTime();
    const sunTimesToday = SunCalc.getTimes(currentTime, location.latitude, location.longitude);

    const sunriseDate = sunTimesToday.sunrise;
    const sunsetDate  = sunTimesToday.sunset;
    const solarNoonDate = sunTimesToday.solarNoon;
    const nadirDate   = sunTimesToday.nadir;

    if (isNaN(sunriseDate.getTime()) || isNaN(sunsetDate.getTime())) {
        return makeEmpty(currentTime, houseSystem);
    }

    // — SunCalc (rápido) —
    const moonTimes        = SunCalc.getMoonTimes(currentTime, location.latitude, location.longitude);
    const moonPosition     = SunCalc.getMoonPosition(currentTime, location.latitude, location.longitude);
    const moonIlluminationData = SunCalc.getMoonIllumination(currentTime);
    const sunPosition      = SunCalc.getPosition(currentTime, location.latitude, location.longitude);

    const isDayTime = currentMs >= sunriseDate.getTime() && currentMs <= sunsetDate.getTime();

    // — Gradient —
    let gradientStatus: 'night' | 'dawn' | 'day' | 'dusk' = 'night';
    let gradientProgress = 0;
    const dawnStart = sunriseDate.getTime() - TRANSITION_DURATION_MS;
    const duskEnd   = sunsetDate.getTime()  + TRANSITION_DURATION_MS;

    if (currentMs >= dawnStart && currentMs < sunriseDate.getTime()) {
        gradientStatus   = 'dawn';
        gradientProgress = (currentMs - dawnStart) / TRANSITION_DURATION_MS;
    } else if (currentMs >= sunriseDate.getTime() && currentMs <= sunsetDate.getTime()) {
        gradientStatus   = 'day';
        gradientProgress = 1;
    } else if (currentMs > sunsetDate.getTime() && currentMs <= duskEnd) {
        gradientStatus   = 'dusk';
        gradientProgress = (currentMs - sunsetDate.getTime()) / TRANSITION_DURATION_MS;
    }
    gradientProgress = Math.max(0, Math.min(1, gradientProgress));

    const dateToHour = (d: Date) =>
        d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;

    // — FAST PLANETS (toda vez) —
    const sunEclipticLongitude     = calculateSunTropicalLongitude(currentTime);
    const moonEclipticLongitude    = calculateMoonTropicalLongitude(currentTime);
    const mercuryEclipticLongitude = calculateMercuryTropicalLongitude(currentTime);
    const venusEclipticLongitude   = calculateVenusTropicalLongitude(currentTime);
    const marsEclipticLongitude    = calculateMarsTropicalLongitude(currentTime);

    // — SLOW PLANETS (1x/minuto, via cache) —
    const slow = getSlowPlanets(currentTime);
    const southNodeEclipticLongitude = normalizeAngle(slow.northNode + 180);

    // — Casas (dependem de LST — muda a cada segundo) —
    const lst                = calculateLocalSiderealTime(currentTime, location.longitude);
    const midheavenLongitude = calculateMidheaven(lst, currentTime);
    const ascendantLongitude = calculateAscendant(lst, location.latitude, currentTime);
    const houseCusps         = calculateHouseCusps(
        houseSystem, ascendantLongitude, midheavenLongitude, lst, location.latitude, currentTime
    );

    const partOfFortuneEclipticLongitude = isDayTime
        ? normalizeAngle(ascendantLongitude + moonEclipticLongitude - sunEclipticLongitude)
        : normalizeAngle(ascendantLongitude + sunEclipticLongitude - moonEclipticLongitude);

    const longitudes = {
        sun:       sunEclipticLongitude,
        moon:      moonEclipticLongitude,
        mercury:   mercuryEclipticLongitude,
        venus:     venusEclipticLongitude,
        mars:      marsEclipticLongitude,
        jupiter:   slow.jupiter,
        saturn:    slow.saturn,
        uranus:    slow.uranus,
        neptune:   slow.neptune,
        pluto:     slow.pluto,
        lilith:    slow.lilith,
        northNode: slow.northNode,
        southNode: southNodeEclipticLongitude,
        chiron:    slow.chiron,
        ceres:     slow.ceres,
        pallas:    slow.pallas,
        juno:      slow.juno,
        vesta:     slow.vesta,
        partOfFortune: partOfFortuneEclipticLongitude,
    };

    const housePlacements = Object.fromEntries(
        Object.entries(longitudes).map(([id, lon]) => [id, getHousePlacement(lon, houseCusps)])
    );

    const aspects = calculateAspects(longitudes, visiblePlanets, housePlacements);

    return {
        currentTime,
        isDayTime,
        sunDisplayHour:  dateToHour(currentTime),
        sunriseHour:     dateToHour(sunriseDate),
        sunsetHour:      dateToHour(sunsetDate),
        solarNoonHour:   dateToHour(solarNoonDate),
        nadirHour:       dateToHour(nadirDate),
        isMoonVisible:   moonPosition.altitude > 0,
        moonPhase:       moonIlluminationData.phase,
        moonIllumination: moonIlluminationData.fraction,
        moonAzimuth:     moonPosition.azimuth,
        moonAltitude:    moonPosition.altitude,
        sunAltitude:     sunPosition.altitude,
        sunriseTime:     formatTime(sunriseDate),
        sunsetTime:      formatTime(sunsetDate),
        moonriseTime:    formatTime(moonTimes.rise),
        moonsetTime:     formatTime(moonTimes.set),
        gradientStatus,
        gradientProgress,
        sunEclipticLongitude: ao(sunEclipticLongitude),
        moonEclipticLongitude: ao(moonEclipticLongitude),
        mercuryEclipticLongitude: ao(mercuryEclipticLongitude),
        marsEclipticLongitude: ao(marsEclipticLongitude),
        venusEclipticLongitude: ao(venusEclipticLongitude),
        jupiterEclipticLongitude:  ao(slow.jupiter),
        saturnEclipticLongitude:   ao(slow.saturn),
        neptuneEclipticLongitude:  ao(slow.neptune),
        uranusEclipticLongitude:   ao(slow.uranus),
        plutoEclipticLongitude:    ao(slow.pluto),
        lilithEclipticLongitude:   ao(slow.lilith),
        northNodeEclipticLongitude: ao(slow.northNode),
        southNodeEclipticLongitude: ao(southNodeEclipticLongitude),
        chironEclipticLongitude:   ao(slow.chiron),
        ceresEclipticLongitude:    ao(slow.ceres),
        pallasEclipticLongitude:   ao(slow.pallas),
        junoEclipticLongitude:     ao(slow.juno),
        vestaEclipticLongitude:    ao(slow.vesta),
        partOfFortuneEclipticLongitude: ao(partOfFortuneEclipticLongitude),
        midheavenLongitude: ao(midheavenLongitude),
        ascendantLongitude: ao(ascendantLongitude),
        descendantLongitude: ao(normalizeAngle(ascendantLongitude + 180)),
        imumCoeliLongitude:  ao(normalizeAngle(midheavenLongitude + 180)),
        zodiacRotation:      normalizeAngle(ao(ascendantLongitude)),
        retrogradeStatus:    slow.retrogradeStatus,
        stationaryStatus:    slow.stationaryStatus,
        houseCusps: houseCusps.map(ao),
        housePlacements,
        aspects,
        houseSystem,
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// timeKey: número inteiro de segundos — evita invalidação por referência nova
// ─────────────────────────────────────────────────────────────────────────────
export const useCelestialData = (
    currentTime: Date | null,
    location: LocationState,
    visiblePlanets: Record<string, boolean>,
    houseSystem: HouseSystem = 'porphyry',
    zodiacSystem: 'sidereal' | 'tropical' = 'sidereal'
): CelestialData => {
    const timeKey = currentTime?.getTime() ?? 0;

    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useMemo(
        () => calculateCelestialData(currentTime, location, visiblePlanets, houseSystem, zodiacSystem),
        [timeKey, location, visiblePlanets, houseSystem, zodiacSystem]
    );
};