import { normalizeAngle, toRad, toDeg } from './utils';

const OBLIQUITY_OF_ECLIPTIC = 23.4392911; // J2000 value

// Calculates the obliquity of the ecliptic for a given date (Julian centuries since J2000)
export const calculateObliquity = (T: number): number => {
    // Laskar's expression for the obliquity of the ecliptic
    return 23.4392911 - (46.8150 / 3600) * T - (0.00059 / 3600) * T * T + (0.001813 / 3600) * T * T * T;
};

// Calculates Local Sidereal Time in degrees
export const calculateLocalSiderealTime = (date: Date, longitude: number): number => {
    const jd = date.getTime() / 86400000.0 + 2440587.5;
    const d = jd - 2451545.0;
    const T = d / 36525.0;
    
    // More precise GMST formula
    let gmst = 280.46061837 + 360.98564736629 * d + 0.000387933 * T * T - (T * T * T) / 38710000.0;
    gmst = normalizeAngle(gmst);
    const lst = normalizeAngle(gmst + longitude);
    return lst;
};

// Calculates the Midheaven (MC) Ecliptic Longitude
export const calculateMidheaven = (localSiderealTime: number, date: Date): number => {
    const jd = date.getTime() / 86400000.0 + 2440587.5;
    const T = (jd - 2451545.0) / 36525.0;
    const obliquity = calculateObliquity(T);
    
    const lstRad = toRad(localSiderealTime);
    const obliquityRad = toRad(obliquity);
    
    let mcRad = Math.atan2(Math.tan(lstRad), Math.cos(obliquityRad));
    if (Math.cos(lstRad) < 0) {
        mcRad += Math.PI;
    }

    let mcDeg = toDeg(mcRad);
    return normalizeAngle(mcDeg);
};

// Calculates the Ascendant (ASC) Ecliptic Longitude
export const calculateAscendant = (localSiderealTime: number, latitude: number, date: Date): number => {
    const jd = date.getTime() / 86400000.0 + 2440587.5;
    const T = (jd - 2451545.0) / 36525.0;
    const obliquity = calculateObliquity(T);

    const lstRad = toRad(localSiderealTime);
    const latRad = toRad(latitude);
    const obliquityRad = toRad(obliquity);

    const y = -Math.cos(lstRad);
    const x = Math.sin(lstRad) * Math.cos(obliquityRad) + Math.tan(latRad) * Math.sin(obliquityRad);
    
    let ascRad = Math.atan2(y, x);
    let ascDeg = toDeg(ascRad) + 180;

    return normalizeAngle(ascDeg);
};

// Calculates the 12 house cusps using the Porphyry system.
export const calculatePorphyryHouseCusps = (asc: number, mc: number): number[] => {
    const cusps = new Array(12);
    const ic = normalizeAngle(mc + 180);
    const dsc = normalizeAngle(asc + 180);

    // Helper to get shortest angle distance (can be negative)
    const angleDist = (a1: number, a2: number) => {
        let diff = a2 - a1;
        if (diff < -180) diff += 360;
        if (diff > 180) diff -= 360;
        return diff;
    };

    // Set the 4 cardinal cusps which define the quadrants
    cusps[0] = asc;  // Cusp 1 (AC)
    cusps[3] = ic;   // Cusp 4 (IC)
    cusps[6] = dsc;  // Cusp 7 (DSC)
    cusps[9] = mc;   // Cusp 10 (MC)

    // Quadrant 1 (Houses 1, 2, 3) is between ASC and IC
    const quad1_dist = angleDist(asc, ic);
    cusps[1] = normalizeAngle(asc + quad1_dist / 3); // Cusp 2
    cusps[2] = normalizeAngle(asc + 2 * quad1_dist / 3); // Cusp 3
    
    // Quadrant 2 (Houses 4, 5, 6) is between IC and DSC
    const quad2_dist = angleDist(ic, dsc);
    cusps[4] = normalizeAngle(ic + quad2_dist / 3); // Cusp 5
    cusps[5] = normalizeAngle(ic + 2 * quad2_dist / 3); // Cusp 6
    
    // Quadrant 3 (Houses 7, 8, 9) is between DSC and MC
    const quad3_dist = angleDist(dsc, mc);
    cusps[7] = normalizeAngle(dsc + quad3_dist / 3); // Cusp 8
    cusps[8] = normalizeAngle(dsc + 2 * quad3_dist / 3); // Cusp 9
    
    // Quadrant 4 (Houses 10, 11, 12) is between MC and ASC
    const quad4_dist = angleDist(mc, asc);
    cusps[10] = normalizeAngle(mc + quad4_dist / 3); // Cusp 11
    cusps[11] = normalizeAngle(mc + 2 * quad4_dist / 3); // Cusp 12
    
    return cusps;
};

// Calculates the 12 house cusps using the Whole Sign system.
export const calculateWholeSignHouseCusps = (asc: number): number[] => {
    const cusps = new Array(12);
    const startSignDegree = Math.floor(asc / 30) * 30;
    
    for (let i = 0; i < 12; i++) {
        cusps[i] = normalizeAngle(startSignDegree + i * 30);
    }
    return cusps;
};

// Calculates the 12 house cusps using the Equal House system.
export const calculateEqualHouseCusps = (asc: number): number[] => {
    const cusps = new Array(12);
    
    for (let i = 0; i < 12; i++) {
        cusps[i] = normalizeAngle(asc + i * 30);
    }
    return cusps;
};

export const calculatePlacidusHouseCusps = (lst: number, lat: number, mc: number, asc: number, date: Date): number[] => {
    const jd = date.getTime() / 86400000.0 + 2440587.5;
    const T = (jd - 2451545.0) / 36525.0;
    const obliquity = calculateObliquity(T);
    const eps = toRad(obliquity);
    const phi = toRad(lat);

    // Helper: converts ecliptic longitude to RAMC equivalent (RA on MC circle)
    const eclToRA = (lon: number): number => {
        const lonRad = toRad(lon);
        return normalizeAngle(toDeg(Math.atan2(
            Math.sin(lonRad) * Math.cos(eps),
            Math.cos(lonRad)
        )));
    };

    // Helper: finds the ecliptic longitude that has a given oblique ascension
    // using Newton-Raphson iteration
    const findCusp = (targetOA: number, startLon: number): number => {
        let lon = startLon;
        for (let i = 0; i < 50; i++) {
            const lonRad = toRad(lon);
            const ra = toDeg(Math.atan2(Math.sin(lonRad) * Math.cos(eps), Math.cos(lonRad)));
            const dec = toDeg(Math.asin(Math.sin(lonRad) * Math.sin(eps)));
            const ad = toDeg(Math.asin(Math.tan(phi) * Math.tan(toRad(dec))));
            const oa = normalizeAngle(ra - ad);
            let diff = targetOA - oa;
            if (diff > 180) diff -= 360;
            if (diff < -180) diff += 360;
            if (Math.abs(diff) < 0.0001) break;
            lon = normalizeAngle(lon + diff * 0.8);
        }
        return lon;
    };

    const RAMC = lst; // LST in degrees = RAMC
    const ra_mc = eclToRA(mc);
    
    // Oblique Ascension of ASC
    const ascRad = toRad(asc);
    const ra_asc = toDeg(Math.atan2(Math.sin(ascRad) * Math.cos(eps), Math.cos(ascRad)));
    const dec_asc = toDeg(Math.asin(Math.sin(ascRad) * Math.sin(eps)));
    const ad_asc = toDeg(Math.asin(Math.tan(phi) * Math.tan(toRad(dec_asc))));
    const OA_asc = normalizeAngle(ra_asc - ad_asc);

    // Semidiurnal arc and seminocturnal arc
    const OA_mc = normalizeAngle(ra_mc);
    let DSA = normalizeAngle(OA_asc - OA_mc); // Diurnal Semiarc
    if (DSA > 180) DSA -= 360;
    if (DSA < 0) DSA += 360;
    const NSA = 180 - DSA; // Nocturnal Semiarc

    // Cusps via trisection of semiarcs
    const OA_11 = normalizeAngle(OA_mc + DSA / 3);
    const OA_12 = normalizeAngle(OA_mc + 2 * DSA / 3);
    const OA_2  = normalizeAngle(OA_asc + NSA / 3);
    const OA_3  = normalizeAngle(OA_asc + 2 * NSA / 3);

    const cusp11 = findCusp(OA_11, normalizeAngle(mc + 30));
    const cusp12 = findCusp(OA_12, normalizeAngle(mc + 60));
    const cusp2  = findCusp(OA_2,  normalizeAngle(asc + 30));
    const cusp3  = findCusp(OA_3,  normalizeAngle(asc + 60));

    const cusps = new Array(12);
    cusps[0]  = asc;
    cusps[1]  = cusp2;
    cusps[2]  = cusp3;
    cusps[3]  = normalizeAngle(mc + 180);  // IC
    cusps[4]  = normalizeAngle(cusp11 + 180);
    cusps[5]  = normalizeAngle(cusp12 + 180);
    cusps[6]  = normalizeAngle(asc + 180); // DSC
    cusps[7]  = normalizeAngle(cusp2 + 180);
    cusps[8]  = normalizeAngle(cusp3 + 180);
    cusps[9]  = mc;
    cusps[10] = cusp11;
    cusps[11] = cusp12;

    return cusps;
};

export type HouseSystem = 'porphyry' | 'whole-sign' | 'equal' | 'placidus';

export const calculateHouseCusps = (system: HouseSystem, asc: number, mc: number, lst: number, lat: number, date: Date): number[] => {
    switch (system) {
        case 'whole-sign':
            return calculateWholeSignHouseCusps(asc);
        case 'equal':
            return calculateEqualHouseCusps(asc);
        case 'placidus':
            return calculatePlacidusHouseCusps(lst, lat, mc, asc, date);
        case 'porphyry':
        default:
            return calculatePorphyryHouseCusps(asc, mc);
    }
};

export const getHousePlacement = (longitude: number, houseCusps: number[]): number => {
    const isBetween = (angle: number, start: number, end: number) => {
        const d_end = (end - start + 360) % 360;
        const d_angle = (angle - start + 360) % 360;
        return d_angle < d_end;
    };

    for (let i = 0; i < 12; i++) {
        const cuspStart = houseCusps[i];
        const cuspEnd = houseCusps[(i + 1) % 12];
        if (isBetween(longitude, cuspStart, cuspEnd)) {
            return i + 1;
        }
    }
    return 1; // Default fallback
};
