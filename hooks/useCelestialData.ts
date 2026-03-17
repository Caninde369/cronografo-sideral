
import { useMemo } from 'react';
import SunCalc from 'suncalc';
import { calculateSunTropicalLongitude, calculateMoonTropicalLongitude, calculateMercuryTropicalLongitude, calculateVenusTropicalLongitude, calculateMarsTropicalLongitude, calculateJupiterTropicalLongitude, calculateSaturnTropicalLongitude, calculateUranusTropicalLongitude, calculateNeptuneTropicalLongitude, calculatePlutoTropicalLongitude } from '../lib/astrology/celestialBodies';
import { calculateLilithTropicalLongitude, calculateNorthNodeTropicalLongitude, calculateChironTropicalLongitude, calculateCeresTropicalLongitude, calculatePallasTropicalLongitude, calculateJunoTropicalLongitude, calculateVestaTropicalLongitude } from '../lib/astrology/astroPoints';
import { calculateLocalSiderealTime, calculateMidheaven, calculateAscendant, calculateHouseCusps, getHousePlacement, HouseSystem } from '../lib/astrology/houseSystem';
import { calculateAllRetrogrades } from '../lib/astrology/retrogrades';
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
    midheavenLongitude: number;
    ascendantLongitude: number;
    descendantLongitude: number;
    imumCoeliLongitude: number;
    zodiacRotation: number;
    retrogradeStatus: Record<string, boolean>;
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

// 60 Minutes in Milliseconds for Astronomical Twilight simulation
// The transition ends/starts exactly at sun event, extending into the "dark" period.
const TRANSITION_DURATION_MS = 60 * 60 * 1000;

const formatTime = (date: Date): string => {
    if (!date || isNaN(date.getTime())) return '--:--';
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export const calculateCelestialData = (currentTime: Date | null, location: LocationState, visiblePlanets: Record<string, boolean>, houseSystem: HouseSystem = 'porphyry'): CelestialData => {
    if (!currentTime || isNaN(currentTime.getTime())) {
        return {
            currentTime: new Date(0),
            isDayTime: false, sunDisplayHour: 12, sunriseHour: 6, sunsetHour: 18, solarNoonHour: 12, nadirHour: 0,
            isMoonVisible: false, moonPhase: 0, moonIllumination: 0, moonAzimuth: 0, moonAltitude: 0, sunAltitude: 0,
            sunriseTime: 'N/A', sunsetTime: 'N/A', moonriseTime: 'N/A', moonsetTime: 'N/A',
            gradientStatus: 'night', gradientProgress: 0,
            sunEclipticLongitude: 0, moonEclipticLongitude: 0, mercuryEclipticLongitude: 0, marsEclipticLongitude: 0, venusEclipticLongitude: 0, jupiterEclipticLongitude: 0, saturnEclipticLongitude: 0, neptuneEclipticLongitude: 0, uranusEclipticLongitude: 0, plutoEclipticLongitude: 0, lilithEclipticLongitude: 0, northNodeEclipticLongitude: 0, southNodeEclipticLongitude: 0, chironEclipticLongitude: 0, ceresEclipticLongitude: 0, pallasEclipticLongitude: 0, junoEclipticLongitude: 0, vestaEclipticLongitude: 0, midheavenLongitude: 0, ascendantLongitude: 0, descendantLongitude: 180, imumCoeliLongitude: 180, zodiacRotation: 0,
            retrogradeStatus: {}, houseCusps: Array(12).fill(0).map((_, i) => i * 30),
            housePlacements: {}, aspects: [], houseSystem
        };
    }

    const currentMs = currentTime.getTime();

    // Calculate Sun Times
    const sunTimesToday = SunCalc.getTimes(currentTime, location.latitude, location.longitude);
    
    // We need next/prev days for corner cases (near midnight)
    const yesterday = new Date(currentTime); yesterday.setDate(currentTime.getDate() - 1);
    const tomorrow = new Date(currentTime); tomorrow.setDate(currentTime.getDate() + 1);

    const sunriseDate = sunTimesToday.sunrise;
    const sunsetDate = sunTimesToday.sunset;
    const solarNoonDate = sunTimesToday.solarNoon;
    const nadirDate = sunTimesToday.nadir;

    if (isNaN(sunriseDate.getTime()) || isNaN(sunsetDate.getTime())) {
        return {
            currentTime, isDayTime: false, sunDisplayHour: 12, sunriseHour: 6, sunsetHour: 18, solarNoonHour: 12, nadirHour: 0,
            isMoonVisible: false, moonPhase: 0, moonIllumination: 0, moonAzimuth: 0, moonAltitude: 0, sunAltitude: 0,
            sunriseTime: 'N/A', sunsetTime: 'N/A', moonriseTime: 'N/A', moonsetTime: 'N/A',
            gradientStatus: 'night', gradientProgress: 0, 
            sunEclipticLongitude: 0, moonEclipticLongitude: 0, mercuryEclipticLongitude: 0, marsEclipticLongitude: 0, venusEclipticLongitude: 0, jupiterEclipticLongitude: 0, saturnEclipticLongitude: 0, neptuneEclipticLongitude: 0, uranusEclipticLongitude: 0, plutoEclipticLongitude: 0, lilithEclipticLongitude: 0, northNodeEclipticLongitude: 0, southNodeEclipticLongitude: 0, chironEclipticLongitude: 0, ceresEclipticLongitude: 0, pallasEclipticLongitude: 0, junoEclipticLongitude: 0, vestaEclipticLongitude: 0, midheavenLongitude: 0, ascendantLongitude: 0, descendantLongitude: 180, imumCoeliLongitude: 180, zodiacRotation: 0,
            retrogradeStatus: {}, houseCusps: Array(12).fill(0).map((_, i) => i * 30),
            housePlacements: {}, aspects: [], houseSystem
        };
    }

    const moonTimes = SunCalc.getMoonTimes(currentTime, location.latitude, location.longitude);
    const moonPosition = SunCalc.getMoonPosition(currentTime, location.latitude, location.longitude);
    const moonIllumination = SunCalc.getMoonIllumination(currentTime);
    const sunPosition = SunCalc.getPosition(currentTime, location.latitude, location.longitude);

    const isDayTime = currentMs >= sunriseDate.getTime() && currentMs <= sunsetDate.getTime();
    
    // --- Gradient Logic (Corrected for Astronomical Twilight) ---
    // Dawn starts 90 mins BEFORE sunrise and ends AT sunrise.
    // Dusk starts AT sunset and ends 90 mins AFTER sunset.
    let gradientStatus: 'night' | 'dawn' | 'day' | 'dusk' = 'night';
    let gradientProgress = 0;

    const dawnStart = sunriseDate.getTime() - TRANSITION_DURATION_MS;
    const dawnEnd = sunriseDate.getTime();
    
    const duskStart = sunsetDate.getTime();
    const duskEnd = sunsetDate.getTime() + TRANSITION_DURATION_MS;

    if (currentMs >= dawnStart && currentMs < dawnEnd) {
        gradientStatus = 'dawn';
        gradientProgress = (currentMs - dawnStart) / (dawnEnd - dawnStart);
    } else if (currentMs >= dawnEnd && currentMs <= duskStart) {
        gradientStatus = 'day';
        gradientProgress = 1;
    } else if (currentMs > duskStart && currentMs <= duskEnd) {
        gradientStatus = 'dusk';
        gradientProgress = (currentMs - duskStart) / (duskEnd - duskStart);
    } else {
        gradientStatus = 'night';
        gradientProgress = 0;
    }
    
    // Clamp progress
    gradientProgress = Math.max(0, Math.min(1, gradientProgress));

    const dateToHour = (d: Date) => d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600 + d.getMilliseconds() / 3600000;

    const sunEclipticLongitude = calculateSunTropicalLongitude(currentTime);
    const moonEclipticLongitude = calculateMoonTropicalLongitude(currentTime);
    const mercuryEclipticLongitude = calculateMercuryTropicalLongitude(currentTime);
    const venusEclipticLongitude = calculateVenusTropicalLongitude(currentTime);
    const marsEclipticLongitude = calculateMarsTropicalLongitude(currentTime);
    const jupiterEclipticLongitude = calculateJupiterTropicalLongitude(currentTime);
    const saturnEclipticLongitude = calculateSaturnTropicalLongitude(currentTime);
    const uranusEclipticLongitude = calculateUranusTropicalLongitude(currentTime);
    const neptuneEclipticLongitude = calculateNeptuneTropicalLongitude(currentTime);
    const plutoEclipticLongitude = calculatePlutoTropicalLongitude(currentTime);
    const lilithEclipticLongitude = calculateLilithTropicalLongitude(currentTime);
    const northNodeEclipticLongitude = calculateNorthNodeTropicalLongitude(currentTime);
    const chironEclipticLongitude = calculateChironTropicalLongitude(currentTime);
    const ceresEclipticLongitude = calculateCeresTropicalLongitude(currentTime);
    const pallasEclipticLongitude = calculatePallasTropicalLongitude(currentTime);
    const junoEclipticLongitude = calculateJunoTropicalLongitude(currentTime);
    const vestaEclipticLongitude = calculateVestaTropicalLongitude(currentTime);
    
    const southNodeEclipticLongitude = normalizeAngle(northNodeEclipticLongitude + 180);

    const lst = calculateLocalSiderealTime(currentTime, location.longitude);
    const midheavenLongitude = calculateMidheaven(lst, currentTime);
    const ascendantLongitude = calculateAscendant(lst, location.latitude, currentTime);
    const houseCusps = calculateHouseCusps(houseSystem, ascendantLongitude, midheavenLongitude, lst, location.latitude, currentTime);

    const longitudes = { sun: sunEclipticLongitude, moon: moonEclipticLongitude, mercury: mercuryEclipticLongitude, venus: venusEclipticLongitude, mars: marsEclipticLongitude, jupiter: jupiterEclipticLongitude, saturn: saturnEclipticLongitude, uranus: uranusEclipticLongitude, neptune: neptuneEclipticLongitude, pluto: plutoEclipticLongitude, lilith: lilithEclipticLongitude, northNode: northNodeEclipticLongitude, southNode: southNodeEclipticLongitude, chiron: chironEclipticLongitude, ceres: ceresEclipticLongitude, pallas: pallasEclipticLongitude, juno: junoEclipticLongitude, vesta: vestaEclipticLongitude };

    const housePlacements = Object.fromEntries(
        Object.entries(longitudes).map(([id, lon]) => [id, getHousePlacement(lon, houseCusps)])
    );

    const aspects = calculateAspects(longitudes, visiblePlanets, housePlacements);

    const retrogradeStatus = calculateAllRetrogrades(currentTime);

    return {
        currentTime,
        isDayTime,
        sunDisplayHour: dateToHour(currentTime),
        sunriseHour: dateToHour(sunriseDate),
        sunsetHour: dateToHour(sunsetDate),
        solarNoonHour: dateToHour(solarNoonDate),
        nadirHour: dateToHour(nadirDate),
        isMoonVisible: moonPosition.altitude > 0,
        moonPhase: moonIllumination.phase,
        moonIllumination: moonIllumination.fraction,
        moonAzimuth: moonPosition.azimuth,
        moonAltitude: moonPosition.altitude,
        sunAltitude: sunPosition.altitude,
        sunriseTime: formatTime(sunriseDate),
        sunsetTime: formatTime(sunsetDate),
        moonriseTime: formatTime(moonTimes.rise),
        moonsetTime: formatTime(moonTimes.set),
        gradientStatus,
        gradientProgress,
        sunEclipticLongitude,
        moonEclipticLongitude,
        mercuryEclipticLongitude,
        marsEclipticLongitude,
        venusEclipticLongitude,
        jupiterEclipticLongitude,
        saturnEclipticLongitude,
        neptuneEclipticLongitude,
        uranusEclipticLongitude,
        plutoEclipticLongitude,
        lilithEclipticLongitude,
        northNodeEclipticLongitude,
        southNodeEclipticLongitude,
        chironEclipticLongitude,
        ceresEclipticLongitude,
        pallasEclipticLongitude,
        junoEclipticLongitude,
        vestaEclipticLongitude,
        midheavenLongitude,
        ascendantLongitude,
        descendantLongitude: normalizeAngle(ascendantLongitude + 180),
        imumCoeliLongitude: normalizeAngle(midheavenLongitude + 180),
        zodiacRotation: normalizeAngle(ascendantLongitude),
        retrogradeStatus,
        houseCusps,
        housePlacements,
        aspects,
        houseSystem
    };
};

export const useCelestialData = (currentTime: Date | null, location: LocationState, visiblePlanets: Record<string, boolean>, houseSystem: HouseSystem = 'porphyry'): CelestialData => {
    return useMemo(() => calculateCelestialData(currentTime, location, visiblePlanets, houseSystem), [currentTime, location, visiblePlanets, houseSystem]);
};
