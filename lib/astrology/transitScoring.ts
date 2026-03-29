import { CelestialData } from '../../hooks/useCelestialData';
import { calculateTransitNatalAspects, CelestialBodiesData, ASPECT_ORBS, Aspect } from './aspects';
import {
    calculateSunTropicalLongitude, calculateMoonTropicalLongitude, calculateMercuryTropicalLongitude,
    calculateVenusTropicalLongitude, calculateMarsTropicalLongitude, calculateJupiterTropicalLongitude,
    calculateSaturnTropicalLongitude, calculateUranusTropicalLongitude, calculateNeptuneTropicalLongitude,
    calculatePlutoTropicalLongitude
} from './celestialBodies';
import { calculateChironTropicalLongitude } from './astroPoints';

export type DetailedAspectInfo = {
    aspect: Aspect;
    contribution: number;
};

export type TransitDayDetails = {
    score: number;
    positiveScore: number;
    negativeScore: number;
    contributingAspects: DetailedAspectInfo[];
};

const PLANET_WEIGHTS: Record<string, number> = {
    // Outer planets (long-term influence)
    pluto: 10,
    neptune: 9,
    uranus: 8,
    saturn: 7,
    jupiter: 6,
    // Personal planets (mid-term influence)
    chiron: 4,
    mars: 5,
    // Inner planets (short-term mood)
    sun: 4,
    venus: 4,
    mercury: 3,
    moon: 5, // Increased weight for daily fluctuations
};

const ASPECT_WEIGHTS: Record<string, number> = {
    trine: 1.0,       // Very positive
    sextile: 0.6,     // Positive
    square: -1.0,     // Very challenging
    opposition: -0.8, // Challenging
    conjunction: 0.5, // Amplifying, can be stressful or beneficial
};

const SCORING_BODIES = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'chiron'];
const SCORE_AMPLIFIER = 100;

const longitudeFuncs: Record<string, (date: Date) => number> = {
    sun: calculateSunTropicalLongitude, moon: calculateMoonTropicalLongitude,
    mercury: calculateMercuryTropicalLongitude, venus: calculateVenusTropicalLongitude,
    mars: calculateMarsTropicalLongitude, jupiter: calculateJupiterTropicalLongitude,
    saturn: calculateSaturnTropicalLongitude, uranus: calculateUranusTropicalLongitude,
    neptune: calculateNeptuneTropicalLongitude, pluto: calculatePlutoTropicalLongitude,
    chiron: calculateChironTropicalLongitude,
};

export const calculateTransitDetailsForDay = (date: Date, natalData: CelestialData): TransitDayDetails => {
    
    // 1. Get transiting planet positions for the given day (optimized).
    const transitLongitudes: Record<string, number> = {};
    SCORING_BODIES.forEach(id => {
        transitLongitudes[id] = longitudeFuncs[id](date);
    });
    
    // 2. Format transiting and natal data for the aspect calculation function.
    const transitBodies: CelestialBodiesData = SCORING_BODIES.map(id => ({
        id, longitude: transitLongitudes[id], name: '', symbol: '', signIndex: 0, house: 0,
    }));

    const natalBodies: CelestialBodiesData = SCORING_BODIES.map(id => {
        const key = `${id}EclipticLongitude` as keyof CelestialData;
        return {
            id, longitude: natalData[key] as number, name: '', symbol: '', signIndex: 0, house: 0,
        };
    });
    
    // Add natal angles to be aspected
    natalBodies.push({ id: 'ascendant', longitude: natalData.ascendantLongitude, name: 'Asc', symbol: 'AC', signIndex: 0, house: 1 });
    natalBodies.push({ id: 'midheaven', longitude: natalData.midheavenLongitude, name: 'MC', symbol: 'MC', signIndex: 0, house: 10 });
        
    // 3. Calculate all aspects between transiting and natal planets/angles.
    const aspects = calculateTransitNatalAspects(transitBodies, natalBodies);

    // 4. Calculate the final score by summing up the weighted influence of each aspect.
    let totalScore = 0;
    let positiveScore = 0;
    let negativeScore = 0;
    const contributingAspects: DetailedAspectInfo[] = [];

    for (const aspect of aspects) {
        const transitingPlanetId = aspect.body1.id;
        const planetWeight = PLANET_WEIGHTS[transitingPlanetId] || 0;
        const aspectWeight = ASPECT_WEIGHTS[aspect.type] || 0;
        
        // The closer the orb, the stronger the influence. Linear falloff.
        const maxOrb = ASPECT_ORBS[aspect.type] || 8;
        const orbFactor = Math.max(0, 1 - (aspect.orb / maxOrb));

        const contribution = planetWeight * aspectWeight * orbFactor * SCORE_AMPLIFIER;
        
        if (Math.abs(contribution) > 0.01) {
             if (contribution > 0) {
                positiveScore += contribution;
             } else {
                negativeScore += contribution;
             }
             totalScore += contribution;
             contributingAspects.push({ aspect, contribution });
        }
    }

    contributingAspects.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

    return { score: totalScore, positiveScore, negativeScore, contributingAspects };
};

/**
 * @deprecated Use calculateTransitDetailsForDay for more detailed information.
 */
export const calculateTransitScoreForDay = (date: Date, natalData: CelestialData): number => {
    return calculateTransitDetailsForDay(date, natalData).score;
}