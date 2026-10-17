
export const CHALDEAN_ORDER = ["saturn", "jupiter", "mars", "sun", "venus", "mercury", "moon"];

/**
 * Returns the ruler of the decan (face) for a given ecliptic longitude.
 * Rules:
 * - Each sign (30 deg) is divided into 3 decans of 10 degrees.
 * - Sequence is Chaldean order: Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon.
 * - Starts with Mars in the 1st decan of Aries (0-10 deg).
 * 
 * @param longitude Ecliptic longitude (0-360)
 * @returns Planet ID of the decan ruler
 */
export function getDecanRuler(longitude: number): string {
    // totalDecanIndex from 0 to 35
    const totalDecanIndex = Math.floor(longitude / 10);
    // Aries 1 (longitude 0-10, index 0) is Mars.
    // In CHALDEAN_ORDER, Mars is at index 2.
    // So for index 0, we want Sequence[2].
    // Formula: (i + 2) % 7
    return CHALDEAN_ORDER[(totalDecanIndex + 2) % 7];
}

export function getDecanInfo(longitude: number) {
    const ruler = getDecanRuler(longitude);
    const signDeg = longitude % 30;
    const decanNum = Math.floor(signDeg / 10) + 1;
    
    return {
        ruler,
        number: decanNum, // 1, 2, or 3
        range: [Math.floor(signDeg / 10) * 10, (Math.floor(signDeg / 10) + 1) * 10]
    };
}
