import { normalizeAngle, toRad, toDeg, getDaysSinceJ2000, getEarthCoords } from './utils';

// --- Sun ---
export const calculateSunTropicalLongitude = (date: Date): number => {
    const d = getDaysSinceJ2000(date);
    const T = d / 36525; // Julian centuries

    const L0 = normalizeAngle(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
    const M = normalizeAngle(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
    
    const mRad = toRad(M);
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(mRad)
            + (0.019993 - 0.000101 * T) * Math.sin(2 * mRad)
            + 0.000289 * Math.sin(3 * mRad);
            
    return normalizeAngle(L0 + C);
};

// --- Moon ---
export const calculateMoonTropicalLongitude = (date: Date): number => {
    const d = getDaysSinceJ2000(date);
    const T = d / 36525; // Julian centuries

    // Moon's Mean Longitude (IAU)
    const Lm = normalizeAngle(218.3164477 + 481267.8812307 * T);
    // Moon's Mean Anomaly
    const Mm = normalizeAngle(134.9633964 + 477198.8675055 * T);
    // Moon's argument of latitude
    const F = normalizeAngle(93.2720950 + 483202.0175233 * T);
    // Sun's Mean Anomaly
    const Ms = normalizeAngle(357.5291092 + 35999.0502909 * T);
    // Mean elongation
    const D = normalizeAngle(297.8501921 + 445267.1114034 * T);

    const mmRad = toRad(Mm), dRad = toRad(D), msRad = toRad(Ms), fRad = toRad(F);

    // Sum of main periodic terms (Meeus)
    let lon = 6.288774 * Math.sin(mmRad)
            + 1.274027 * Math.sin(2*dRad - mmRad)
            + 0.658314 * Math.sin(2*dRad)
            + 0.213618 * Math.sin(2*mmRad)
            - 0.185116 * Math.sin(msRad)
            - 0.114332 * Math.sin(2*fRad)
            + 0.058793 * Math.sin(2*dRad - 2*mmRad)
            + 0.057066 * Math.sin(2*dRad - msRad - mmRad)
            + 0.053322 * Math.sin(2*dRad + mmRad)
            + 0.045758 * Math.sin(2*dRad - msRad)
            - 0.040923 * Math.sin(msRad - mmRad)
            - 0.034720 * Math.sin(dRad)
            - 0.030383 * Math.sin(msRad + mmRad)
            + 0.015327 * Math.sin(2*dRad - 2*fRad);

    return normalizeAngle(Lm + lon);
};

// Generic function to compute geocentric longitude for inner planets + Jupiter/Saturn
const calculatePlanetLongitude = (date: Date, planet: string) => {
    const d = getDaysSinceJ2000(date);
    const T = d / 36525;

    let a: number, e: number, i: number, L: number, P: number, Omega: number;

    switch (planet) {
        case 'mercury':
            a = 0.387098;
            e = 0.205631 + 0.00002041 * T;
            i = 7.0049 + 0.00182 * T;
            L = normalizeAngle(252.2509 + 149472.67411 * T);
            P = normalizeAngle(77.4561 + 0.16047 * T);
            Omega = normalizeAngle(48.3309 - 0.12543 * T);
            break;
        case 'venus':
            a = 0.723332;
            e = 0.006772 - 0.00004774 * T;
            i = 3.3947 - 0.00080 * T;
            L = normalizeAngle(181.9798 + 58517.81567 * T);
            P = normalizeAngle(131.5637 + 0.00268 * T);
            Omega = normalizeAngle(76.6799 - 0.27803 * T);
            break;
        case 'mars':
            a = 1.523679;
            e = 0.093401 - 0.00009206 * T;
            i = 1.8498 - 0.00815 * T;
            L = normalizeAngle(355.4330 + 19140.29933 * T);
            P = normalizeAngle(336.0602 + 0.44441 * T);
            Omega = normalizeAngle(49.5581 + 0.77209 * T);
            break;
        case 'jupiter':
            a = 5.20260;
            e = 0.048495 + 0.0001646 * T;
            i = 1.3033 - 0.00549 * T;
            L = normalizeAngle(34.3515 + 3034.90568 * T);
            P = normalizeAngle(14.3312 + 0.21253 * T);
            Omega = normalizeAngle(100.4644 + 1.02034 * T);
            break;
        case 'saturn':
            a = 9.55491;
            e = 0.055548 - 0.0003457 * T;
            i = 2.4889 - 0.00374 * T;
            L = normalizeAngle(50.0775 + 1222.11379 * T);
            P = normalizeAngle(93.0572 + 0.54238 * T);
            Omega = normalizeAngle(113.6655 + 0.87708 * T);
            break;
        default: return 0;
    }

    if (planet === 'jupiter' || planet === 'saturn') {
        const Mj_L = 34.3515 + 3034.90568 * T, Mj_P = 14.3312 + 0.21253 * T;
        const Ms_L = 50.0775 + 1222.11379 * T, Ms_P = 93.0572 + 0.54238 * T;
        const Mj = normalizeAngle(Mj_L - Mj_P);
        const Ms = normalizeAngle(Ms_L - Ms_P);
        let dL = 0;
        if (planet === 'jupiter') dL = -0.332 * Math.sin(toRad(2*Mj - 5*Ms - 67.6)) -0.056 * Math.sin(toRad(2*Mj - 2*Ms + 21)) +0.042 * Math.sin(toRad(3*Mj - 5*Ms + 21)) -0.036 * Math.sin(toRad(Mj - 2*Ms)) +0.022 * Math.cos(toRad(Mj - Ms)) +0.023 * Math.sin(toRad(2*Mj - 3*Ms + 52)) -0.016 * Math.sin(toRad(Mj - 5*Ms - 69));
        if (planet === 'saturn') dL = +0.812 * Math.sin(toRad(2*Mj - 5*Ms - 67.6)) -0.229 * Math.cos(toRad(2*Mj - 4*Ms - 2)) +0.119 * Math.sin(toRad(Mj - 2*Ms - 3)) +0.046 * Math.sin(toRad(2*Mj - 6*Ms - 69)) +0.014 * Math.sin(toRad(Mj - 3*Ms + 32));
        L += dL;
    }
    
    const M = normalizeAngle(L - P);
    const w = normalizeAngle(P - Omega);
    const M_rad = toRad(M);
    let E = M_rad + e * Math.sin(M_rad);
    for (let k=0; k<10; k++) { const dE = (M_rad - E + e * Math.sin(E)) / (1 - e * Math.cos(E)); E += dE; if (Math.abs(dE) < 1e-6) break; }
    const x_orb = a * (Math.cos(E) - e);
    const y_orb = a * Math.sqrt(1 - e * e) * Math.sin(E);
    const r = Math.sqrt(x_orb*x_orb + y_orb*y_orb);
    const v = toDeg(Math.atan2(y_orb, x_orb));

    const Omega_rad = toRad(Omega), w_rad = toRad(w), v_rad = toRad(v), i_rad = toRad(i);
    const xh = r * (Math.cos(Omega_rad) * Math.cos(w_rad + v_rad) - Math.sin(Omega_rad) * Math.sin(w_rad + v_rad) * Math.cos(i_rad));
    const yh = r * (Math.sin(Omega_rad) * Math.cos(w_rad + v_rad) + Math.cos(Omega_rad) * Math.sin(w_rad + v_rad) * Math.cos(i_rad));
    const earthCoords = getEarthCoords(d);
    const xg = xh - earthCoords.x, yg = yh - earthCoords.y;

    return normalizeAngle(toDeg(Math.atan2(yg, xg)));
};

export const calculateMercuryTropicalLongitude = (date: Date): number => calculatePlanetLongitude(date, 'mercury');
export const calculateVenusTropicalLongitude = (date: Date): number => calculatePlanetLongitude(date, 'venus');
export const calculateMarsTropicalLongitude = (date: Date): number => calculatePlanetLongitude(date, 'mars');
export const calculateJupiterTropicalLongitude = (date: Date): number => calculatePlanetLongitude(date, 'jupiter');
export const calculateSaturnTropicalLongitude = (date: Date): number => calculatePlanetLongitude(date, 'saturn');

// --- High-precision dedicated 3D functions for outer planets ---

export const calculateUranusTropicalLongitude = (date: Date): number => {
    const d = getDaysSinceJ2000(date);
    const T = d / 36525;

    // Mean longitudes of Jupiter, Saturn, Uranus
    const L_j = normalizeAngle(34.35 + 3034.90 * T);
    const L_s = normalizeAngle(50.08 + 1222.11 * T);
    const L_u = normalizeAngle(314.05 + 428.47 * T);

    // Heliocentric longitude perturbations
    let L_pert = 0;
    L_pert += 0.040 * Math.sin(toRad(L_s - 2 * L_u + 6));
    L_pert += 0.035 * Math.sin(toRad(L_s - 3 * L_u + 33));
    L_pert -= 0.015 * Math.sin(toRad(L_j - L_u + 20));

    // Heliocentric latitude perturbations
    let B_pert = 0;
    B_pert -= 0.022 * Math.cos(toRad(L_s - 2 * L_u + 6));
    B_pert += 0.003 * Math.cos(toRad(L_j - L_u + 20));

    // Heliocentric radius perturbations
    let R_pert = 0;
    R_pert -= 0.015 * Math.cos(toRad(L_s - 2 * L_u + 6));
    R_pert -= 0.009 * Math.cos(toRad(L_s - 3 * L_u + 33));
    R_pert += 0.007 * Math.cos(toRad(L_j - L_u + 20));

    // Calculate final heliocentric L, B, R
    const M = normalizeAngle(L_u - (173.0053 + 0.09053 * T));
    const e = 0.046381 - 0.0000273 * T;
    const M_rad = toRad(M);
    let E = M_rad + e * Math.sin(M_rad);
    for (let k=0; k<10; k++) { const dE = (M_rad - E + e * Math.sin(E)) / (1 - e * Math.cos(E)); E += dE; if (Math.abs(dE) < 1e-6) break; }
    
    const v_rad = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
    const v = normalizeAngle(toDeg(v_rad));

    const L = normalizeAngle(L_u + (v - M) + L_pert);
    const B = B_pert;
    const R = (19.21845 * (1 - e * Math.cos(E))) + R_pert;
    
    const L_rad = toRad(L);
    const B_rad = toRad(B);
    const xh = R * Math.cos(B_rad) * Math.cos(L_rad);
    const yh = R * Math.cos(B_rad) * Math.sin(L_rad);

    const earthCoords = getEarthCoords(d);
    const xg = xh - earthCoords.x;
    const yg = yh - earthCoords.y;
    
    const geocentricLon = normalizeAngle(toDeg(Math.atan2(yg, xg)));

    const a = -1.344;
    const b = -0.805;
    const c = 0.795;
    const errorCorrection = (a * T * T) + (b * T) + c;

    return normalizeAngle(geocentricLon - errorCorrection);
};


export const calculateNeptuneTropicalLongitude = (date: Date): number => {
    const d = getDaysSinceJ2000(date);
    const T = d / 36525;

    const L_j = normalizeAngle(34.35 + 3034.90 * T);
    const L_s = normalizeAngle(50.08 + 1222.11 * T);
    const L_u = normalizeAngle(314.05 + 428.47 * T);
    const L_n = normalizeAngle(304.35 + 218.49 * T);

    let L_pert = 0;
    L_pert += 0.009 * Math.sin(toRad(L_u - 2 * L_n + 47));
    L_pert -= 0.006 * Math.sin(toRad(2*L_j - L_s - L_n + 152));

    let B_pert = 0;
    B_pert += 0.003 * Math.cos(toRad(L_u - 2 * L_n + 47));

    let R_pert = 0;
    R_pert += 0.004 * Math.cos(toRad(L_u - 2 * L_n + 47));
    
    const M = normalizeAngle(L_n - (48.1203 + 0.01968 * T));
    const e = 0.009456 + 0.0000060 * T;
    const M_rad = toRad(M);
    let E = M_rad + e * Math.sin(M_rad);
    for (let k=0; k<10; k++) { const dE = (M_rad - E + e * Math.sin(E)) / (1 - e * Math.cos(E)); E += dE; if (Math.abs(dE) < 1e-6) break; }

    const v_rad = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
    const v = normalizeAngle(toDeg(v_rad));

    const L = normalizeAngle(L_n + (v - M) + L_pert);
    const B = B_pert;
    const R = (30.11039 * (1 - e * Math.cos(E))) + R_pert;

    const L_rad = toRad(L);
    const B_rad = toRad(B);
    const xh = R * Math.cos(B_rad) * Math.cos(L_rad);
    const yh = R * Math.cos(B_rad) * Math.sin(L_rad);

    const earthCoords = getEarthCoords(d);
    const xg = xh - earthCoords.x;
    const yg = yh - earthCoords.y;

    const geocentricLon = normalizeAngle(toDeg(Math.atan2(yg, xg)));

    const a = 0.448;
    const b = 0.358;
    const c = 0.621;
    const errorCorrection = (a * T * T) + (b * T) + c;

    return normalizeAngle(geocentricLon + errorCorrection);
};

export const calculatePlutoTropicalLongitude = (date: Date): number => {
    const d = getDaysSinceJ2000(date);
    
    const N = 110.30347;
    const i = 17.14175;
    const w = 113.76342;
    const a = 39.48168677;
    const e = 0.24880766;
    const M = normalizeAngle(14.882 + 0.003968789 * d);

    const M_rad = toRad(M);
    let E = M_rad + e * Math.sin(M_rad);
    for (let k = 0; k < 10; k++) {
        const dE = (M_rad - E + e * Math.sin(E)) / (1 - e * Math.cos(E));
        E += dE;
        if (Math.abs(dE) < 1e-6) break;
    }

    const x_orb = a * (Math.cos(E) - e);
    const y_orb = a * Math.sqrt(1 - e * e) * Math.sin(E);
    
    const r = Math.sqrt(x_orb * x_orb + y_orb * y_orb);
    const v = toDeg(Math.atan2(y_orb, x_orb));

    const Omega_rad = toRad(N);
    const w_rad = toRad(w);
    const v_rad = toRad(v);
    const i_rad = toRad(i);
    const xh = r * (Math.cos(Omega_rad) * Math.cos(w_rad + v_rad) - Math.sin(Omega_rad) * Math.sin(w_rad + v_rad) * Math.cos(i_rad));
    const yh = r * (Math.sin(Omega_rad) * Math.cos(w_rad + v_rad) + Math.cos(Omega_rad) * Math.sin(w_rad + v_rad) * Math.cos(i_rad));
    
    const earthCoords = getEarthCoords(d);

    const xg = xh - earthCoords.x;
    const yg = yh - earthCoords.y;

    return normalizeAngle(toDeg(Math.atan2(yg, xg)));
};
