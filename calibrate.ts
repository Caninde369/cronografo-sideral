
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

console.log('--- Calibration Data ---');
console.log('Date:', testDate.toISOString());
console.log('Lat:', lat.toFixed(6), 'Lon:', lon.toFixed(6));

const formatPos = (val: number) => {
    const deg = Math.floor(val);
    const min = Math.floor((val - deg) * 60);
    const sec = Math.round(((val - deg) * 60 - min) * 60);
    return `${deg}°${min.toString().padStart(2, '0')}'${sec.toString().padStart(2, '0')}" (${val.toFixed(4)})`;
};

const lst = calculateLocalSiderealTime(testDate, lon);
console.log('LST Calculated:', formatPos(lst), 'Hours:', (lst/15).toFixed(6));

const ref = {
    Sol: 246.9767,
    Lua: 8.0667,
    Mercury: 252.2164,
    Venus: 254.4914,
    Mars: 181.1172,
    Jupiter: 348.5936,
    Saturn: 27.5839,
    Uranus: 309.5311,
    Neptune: 300.0344,
    Pluto: 247.8833,
    MeanNode: 146.1214,
    TrueNode: 145.8078,
    Lilith: 218.9375,
    Ceres: 66.3697,
    Pallas: 344.2828,
    Juno: 225.4619,
    Vesta: 140.9339
};

const current = {
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

console.log('\n--- Comparison ---');
Object.keys(current).forEach(key => {
    const c = (current as any)[key];
    const r = (ref as any)[key];
    if (r !== undefined) {
        console.log(`${key.padEnd(10)}: Curr=${formatPos(c)} Ref=${formatPos(r)} Diff=${(c-r).toFixed(4)}`);
    }
});

// Calibration for Asteroids
console.log('\n--- Asteroid Calibration ---');

const findBestM0 = (asteroid: string, targetLon: number, currentM0: number) => {
    let bestM0 = currentM0;
    let minDiff = 999;
    
    // Simple search around current M0
    for (let m = currentM0 - 20; m <= currentM0 + 20; m += 0.001) {
        const lon = calculateAsteroidAtM0(testDate, asteroid, m);
        const diff = Math.abs(normalizeAngle(lon - targetLon + 180) - 180);
        if (diff < minDiff) {
            minDiff = diff;
            bestM0 = m;
        }
    }
    return bestM0;
};

// Need a modified version of calculateAsteroidLongitude that takes M0
function calculateAsteroidAtM0(date: Date, asteroid: string, M0_val: number): number {
    const d = getDaysSinceJ2000(date);
    const T = d / 36525;
    let N: number, i: number, varpi: number, a: number, e: number, n: number;

    switch (asteroid) {
        case 'Ceres': a = 2.767; e = 0.0755; i = 10.593; N = 80.309; varpi = 153.907; n = 0.214102; break;
        case 'Pallas': a = 2.772; e = 0.2305; i = 34.841; N = 173.080; varpi = 123.282; n = 0.2135; break;
        case 'Juno': a = 2.669; e = 0.258; i = 12.982; N = 169.851; varpi = 57.953; n = 0.2260; break;
        case 'Vesta': a = 2.361; e = 0.088; i = 7.140; N = 103.812; varpi = 255.004; n = 0.2715; break;
        default: return 0;
    }

    N -= 0.125 * T;
    i -= 0.001 * T;
    varpi += 0.160 * T;

    const M = normalizeAngle(M0_val + n * d);
    const M_rad = toRad(M);
    let E = M_rad + e * Math.sin(M_rad);
    for (let k = 0; k < 15; k++) {
        const dE = (M_rad - E + e * Math.sin(E)) / (1 - e * Math.cos(E));
        E += dE;
        if (Math.abs(dE) < 1e-8) break;
    }

    const x_orb = a * (Math.cos(E) - e);
    const y_orb = a * Math.sqrt(1 - e * e) * Math.sin(E);
    const r = Math.sqrt(x_orb * x_orb + y_orb * y_orb);
    const v = Math.atan2(y_orb, x_orb);

    const Omega_rad = toRad(N);
    const w_rad = toRad(varpi - N);
    const i_rad = toRad(i);
    
    const xh = r * (Math.cos(Omega_rad) * Math.cos(w_rad + v) - Math.sin(Omega_rad) * Math.sin(w_rad + v) * Math.cos(i_rad));
    const yh = r * (Math.sin(Omega_rad) * Math.cos(w_rad + v) + Math.cos(Omega_rad) * Math.sin(w_rad + v) * Math.cos(i_rad));
    
    const earthCoords = getEarthCoords(d);
    const xg = xh - earthCoords.x;
    const yg = yh - earthCoords.y;

    return normalizeAngle(toDeg(Math.atan2(yg, xg)));
}

const asteroidM0s = {
    Ceres: 4.216,
    Pallas: 345.886,
    Juno: 246.612,
    Vesta: 342.488
};

Object.entries(asteroidM0s).forEach(([name, m0]) => {
    const target = (ref as any)[name];
    const best = findBestM0(name, target, m0);
    console.log(`${name.padEnd(10)}: Best M0 = ${best.toFixed(3)}`);
});

// Node Investigation
console.log('\n--- Node Investigation ---');
const d = getDaysSinceJ2000(testDate);
const T = d / 36525;
const Ls = normalizeAngle(280.4665 + 36000.7698 * T); // Sun's Mean Longitude
const Lm = normalizeAngle(218.3165 + 481267.8813 * T); // Moon's Mean Longitude
const Ms = normalizeAngle(357.5291 + 35999.0503 * T);  // Sun's Mean Anomaly
const Mm = normalizeAngle(134.9634 + 477198.8675 * T); // Moon's Mean Anomaly
const D = normalizeAngle(Lm - Ls); // Mean Elongation
const F = normalizeAngle(93.2721 + 483202.0175 * T); // Moon's Argument of Latitude
const Omega_mean = normalizeAngle(125.04452 - 1934.136261 * T + 0.0020708 * T * T);

console.log('Omega Mean:', formatPos(Omega_mean));
console.log('Target True Node:', formatPos(ref.TrueNode));
console.log('Diff (Mean - True):', (Omega_mean - ref.TrueNode).toFixed(4));

let correction = 0;
correction += -1.4979 * Math.sin(toRad(2 * (F - D)));
correction += -0.1500 * Math.sin(toRad(Ms));
correction += -0.1228 * Math.sin(toRad(2 * F));
correction += 0.1233 * Math.sin(toRad(2 * D));
correction += 0.0625 * Math.sin(toRad(Mm));

console.log('My Correction:', correction.toFixed(4));
console.log('Target Correction:', (ref.TrueNode - Omega_mean).toFixed(4));
