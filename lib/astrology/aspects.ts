
export type AspectBody = {
  id: string;
  name: string;
  symbol: string;
  signIndex: number;
  house: number;
  longitude: number;
};

export type Aspect = {
  id: string;
  body1: AspectBody;
  body2: AspectBody;
  type: string;
  orb: number;
  symbol: string;
};

export type CelestialBodiesData = {
    id: string;
    name: string;
    symbol: string;
    longitude: number;
    signIndex: number;
    house: number;
}[];

const PLANET_DATA: Record<string, {name: string, symbol: string}> = {
    sun: { name: 'Sol', symbol: '☉' },
    moon: { name: 'Lua', symbol: '☾' },
    mercury: { name: 'Mercúrio', symbol: '☿' },
    venus: { name: 'Vênus', symbol: '♀' },
    mars: { name: 'Marte', symbol: '♂' },
    jupiter: { name: 'Júpiter', symbol: '♃' },
    saturn: { name: 'Saturno', symbol: '♄' },
    uranus: { name: 'Urano', symbol: '♅' },
    neptune: { name: 'Netuno', symbol: '♆' },
    pluto: { name: 'Plutão', symbol: '♇' },
    lilith: { name: 'Lilith', symbol: '⚸' },
    northNode: { name: 'Nodo N.', symbol: '☊' },
    southNode: { name: 'Nodo S.', symbol: '☋' },
    chiron: { name: 'Quíron', symbol: '⚷' },
    ceres: { name: 'Ceres', symbol: '⚳' },
    pallas: { name: 'Pallas', symbol: '⚴' },
    juno: { name: 'Juno', symbol: '⚵' },
    vesta: { name: 'Vesta', symbol: '⚶' },
};

export const ASPECT_ORBS: Record<string, number> = { 
    conjunction: 8, 
    opposition: 8, 
    trine: 7, 
    square: 7, 
    sextile: 6 
};

export const ASPECT_SYMBOLS: Record<string, string> = { 
    conjunction: '☌', 
    opposition: '☍', 
    trine: '△', 
    square: '□', 
    sextile: '✶' 
};

export const calculateAspects = (
    longitudes: Record<string, number>,
    visiblePlanets: Record<string, boolean>,
    housePlacements: Record<string, number>
): Aspect[] => {
    const celestialBodiesForAspects = Object.entries(longitudes)
        .map(([id, longitude]) => ({
            id,
            name: PLANET_DATA[id]?.name || id,
            symbol: PLANET_DATA[id]?.symbol || '?',
            longitude,
            signIndex: Math.floor(longitude / 30),
            house: housePlacements[id] || 0,
        }));
        
    const aspectList: Aspect[] = [];
    
    const visibleBodies = celestialBodiesForAspects.filter(body => visiblePlanets[body.id]);

    for (let i = 0; i < visibleBodies.length; i++) {
        for (let j = i + 1; j < visibleBodies.length; j++) {
            const body1 = visibleBodies[i];
            const body2 = visibleBodies[j];

            // Specific filter: Ignore Opposition between North Node and South Node
            if (
                ((body1.id === 'northNode' && body2.id === 'southNode') || 
                 (body1.id === 'southNode' && body2.id === 'northNode'))
            ) {
                continue;
            }

            let angleDiff = Math.abs(body1.longitude - body2.longitude);
            if (angleDiff > 180) angleDiff = 360 - angleDiff;
            
            let aspectType: string | null = null;

            if (angleDiff <= ASPECT_ORBS.conjunction) { aspectType = 'conjunction'; } 
            else if (Math.abs(angleDiff - 180) <= ASPECT_ORBS.opposition) { aspectType = 'opposition'; }
            else if (Math.abs(angleDiff - 90) <= ASPECT_ORBS.square) { aspectType = 'square'; }
            else if (Math.abs(angleDiff - 120) <= ASPECT_ORBS.trine) { aspectType = 'trine'; }
            else if (Math.abs(angleDiff - 60) <= ASPECT_ORBS.sextile) { aspectType = 'sextile'; }

            if (aspectType) {
                const ASPECT_ANGLES: Record<string, number> = {
                    conjunction: 0,
                    sextile: 60,
                    square: 90,
                    trine: 120,
                    opposition: 180
                };
                const orb = Math.abs(angleDiff - ASPECT_ANGLES[aspectType]);
                aspectList.push({
                    id: `${body1.id}-${body2.id}-${aspectType}`,
                    body1: {id: body1.id, name: body1.name, symbol: body1.symbol, signIndex: body1.signIndex, house: body1.house, longitude: body1.longitude },
                    body2: {id: body2.id, name: body2.name, symbol: body2.symbol, signIndex: body2.signIndex, house: body2.house, longitude: body2.longitude },
                    type: aspectType,
                    orb,
                    symbol: ASPECT_SYMBOLS[aspectType]
                });
            }
        }
    }
    
    return aspectList.sort((a, b) => a.orb - b.orb);
};

export const calculateTransitNatalAspects = (
    transitBodies: CelestialBodiesData,
    natalBodies: CelestialBodiesData
): Aspect[] => {
    const aspectList: Aspect[] = [];

    for (const transitBody of transitBodies) {
        for (const natalBody of natalBodies) {
            
             // Specific filter: Ignore Opposition between North Node and South Node (Transit to Natal)
             if (
                ((transitBody.id === 'northNode' && natalBody.id === 'southNode') || 
                 (transitBody.id === 'southNode' && natalBody.id === 'northNode'))
            ) {
                continue;
            }

            let angleDiff = Math.abs(transitBody.longitude - natalBody.longitude);
            if (angleDiff > 180) angleDiff = 360 - angleDiff;

            let aspectType: string | null = null;

            if (angleDiff <= ASPECT_ORBS.conjunction) { aspectType = 'conjunction'; } 
            else if (Math.abs(angleDiff - 180) <= ASPECT_ORBS.opposition) { aspectType = 'opposition'; }
            else if (Math.abs(angleDiff - 90) <= ASPECT_ORBS.square) { aspectType = 'square'; }
            else if (Math.abs(angleDiff - 120) <= ASPECT_ORBS.trine) { aspectType = 'trine'; }
            else if (Math.abs(angleDiff - 60) <= ASPECT_ORBS.sextile) { aspectType = 'sextile'; }

            if (aspectType) {
                const ASPECT_ANGLES: Record<string, number> = {
                    conjunction: 0,
                    sextile: 60,
                    square: 90,
                    trine: 120,
                    opposition: 180
                };
                const orb = Math.abs(angleDiff - ASPECT_ANGLES[aspectType]);
                aspectList.push({
                    id: `T-${transitBody.id}-N-${natalBody.id}-${aspectType}`,
                    body1: { ...transitBody },
                    body2: { ...natalBody },
                    type: aspectType,
                    orb,
                    symbol: ASPECT_SYMBOLS[aspectType]
                });
            }
        }
    }

    return aspectList.sort((a, b) => a.orb - b.orb);
};
