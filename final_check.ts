
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
} from './lib/astrology/celestialBodies';
import {
    calculateLilithTropicalLongitude,
    calculateNorthNodeTropicalLongitude,
    calculateChironTropicalLongitude,
    calculateCeresTropicalLongitude,
    calculatePallasTropicalLongitude,
    calculateJunoTropicalLongitude,
    calculateVestaTropicalLongitude
} from './lib/astrology/astroPoints';
import {
    calculateLocalSiderealTime,
    calculateAscendant,
    calculateMidheaven
} from './lib/astrology/houseSystem';
import { normalizeAngle, toRad, toDeg, getDaysSinceJ2000, getEarthCoords } from './lib/astrology/utils';

const testDate = new Date('1998-11-29T10:05:00Z');
const lat = -(23 + 33/60 + 9/3600); // 23s33'09
const lon = -(46 + 37/60 + 29/3600); // 46w37'29

const formatPos = (val: number) => {
    const deg = Math.floor(val);
    const min = Math.floor((val - deg) * 60);
    const sec = Math.round(((val - deg) * 60 - min) * 60);
    return `${deg}°${min.toString().padStart(2, '0')}'${sec.toString().padStart(2, '0')}"`;
};

const results = {
    Sol: calculateSunTropicalLongitude(testDate),
    Lua: calculateMoonTropicalLongitude(testDate),
    Mercury: calculateMercuryTropicalLongitude(testDate),
    Venus: calculateVenusTropicalLongitude(testDate),
    Mars: calculateMarsTropicalLongitude(testDate),
    Jupiter: calculateJupiterTropicalLongitude(testDate),
    Saturn: calculateSaturnTropicalLongitude(testDate),
    Uranus: calculateUranusTropicalLongitude(testDate),
    Neptune: calculateNeptuneTropicalLongitude(testDate),
    Pluto: calculatePlutoTropicalLongitude(testDate),
    TrueNode: calculateNorthNodeTropicalLongitude(testDate),
    Lilith: calculateLilithTropicalLongitude(testDate),
    Ceres: calculateCeresTropicalLongitude(testDate),
    Pallas: calculatePallasTropicalLongitude(testDate),
    Juno: calculateJunoTropicalLongitude(testDate),
    Vesta: calculateVestaTropicalLongitude(testDate)
};

Object.entries(results).forEach(([name, val]) => {
    console.log(`${name.padEnd(10)}: ${formatPos(val)}`);
});
