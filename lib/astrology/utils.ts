
// --- Helpers ---
export const toRad = (deg: number): number => deg * Math.PI / 180;
export const toDeg = (rad: number): number => rad * 180 / Math.PI;
export const normalizeAngle = (deg: number): number => (deg % 360 + 360) % 360;
export const getDaysSinceJ2000 = (date: Date): number => (date.getTime() / 86400000.0) - 10957.5;

export const toRoman = (num: number): string => {
    const map: Record<number, string> = {
        1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI',
        7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X', 11: 'XI', 12: 'XII'
    };
    return map[num] || String(num);
};

export const formatDegrees = (decimal: number) => {
    if (decimal === undefined || isNaN(decimal)) return '--°--\'';
    const d = Math.floor(decimal);
    const m = Math.round((decimal - d) * 60);
    return `${String(d).padStart(2, '0')}°${String(m).padStart(2, '0')}'`;
};

// Added helper function for polar coordinate conversion
export const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = toRad(angleInDegrees);
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
};

// Heliocentric coordinates for Earth
export const getEarthCoords = (d: number) => {
    const T = d / 36525;
    
    // Sun's Mean Longitude
    const L0 = normalizeAngle(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
    // Sun's Mean Anomaly
    const M = normalizeAngle(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
    const M_rad = toRad(M);
    
    // Eccentricity
    const e = 0.01670863 - 0.000042037 * T;
    
    // Equation of center
    const C = (1.914602 - 0.004817 * T) * Math.sin(M_rad) 
            + (0.019993 - 0.000101 * T) * Math.sin(2 * M_rad) 
            + 0.000289 * Math.sin(3 * M_rad);
    
    // Sun's geocentric true longitude
    const sun_lon = normalizeAngle(L0 + C);
    
    // Earth's heliocentric true longitude is sun_lon + 180
    const earth_helio_lon = normalizeAngle(sun_lon + 180);
    const lon_rad = toRad(earth_helio_lon);
    
    // Distance Earth-Sun in AU
    const v = normalizeAngle(M + C);
    const r = (1.000001018 * (1 - e * e)) / (1 + e * Math.cos(toRad(v)));
    
    return {
        x: r * Math.cos(lon_rad),
        y: r * Math.sin(lon_rad),
        z: 0
    };
};

export const getMoonPhaseEmoji = (phase: number) => {
    if (phase <= 0.03 || phase >= 0.97) return '🌑';
    if (phase < 0.22) return '🌒';
    if (phase < 0.28) return '🌓';
    if (phase < 0.47) return '🌔';
    if (phase < 0.53) return '🌕';
    if (phase < 0.72) return '🌖';
    if (phase < 0.78) return '🌗';
    return '🌘';
};
