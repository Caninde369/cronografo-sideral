import React, { useMemo } from 'react';
import { CelestialData } from '../../hooks/useCelestialData';
import { polarToCartesian, toRad, normalizeAngle } from '../../lib/astrology/utils';
import { ATMOSPHERE_PALETTE, interpolatePalette, interpolateColor } from '../../lib/astrology/graphics';
import { StarField } from '../StarField';

interface BackgroundLayerProps {
    cx: number;
    cy: number;
    radius: number;
    celestialData: CelestialData;
    showStars: boolean;
    showConstellations: boolean;
    showAtmosphere: boolean;
    showMagneticField: boolean;
    magneticFieldSize: number;
    atmosphereMode: 'dynamic' | 'night' | 'dawn' | 'day' | 'dusk';
    customBackgroundImage: string | null;
    planetPositions: Record<string, {x: number, y: number, angle: number, r: number}>;
}

export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({
    cx,
    cy,
    radius,
    celestialData,
    showStars,
    showConstellations,
    showAtmosphere,
    showMagneticField,
    magneticFieldSize,
    atmosphereMode,
    customBackgroundImage,
    planetPositions
}) => {
    const {
        sunriseHour, sunsetHour, sunDisplayHour, gradientStatus, gradientProgress, isDayTime,
        midheavenLongitude
    } = celestialData;

    // --- ATMOSPHERE & GROUND CALCULATION ---
    const currentPalette = useMemo(() => {
        if (!showAtmosphere) return ATMOSPHERE_PALETTE.NIGHT;

        if (atmosphereMode !== 'dynamic') {
            switch (atmosphereMode) {
                case 'night': return ATMOSPHERE_PALETTE.NIGHT;
                case 'dawn': return ATMOSPHERE_PALETTE.DAWN;
                case 'day': return ATMOSPHERE_PALETTE.FULL_DAY;
                case 'dusk': return ATMOSPHERE_PALETTE.DUSK;
                default: return ATMOSPHERE_PALETTE.NIGHT;
            }
        }

        // Dynamic Mode Logic
        const { gradientStatus, gradientProgress } = celestialData;
        
        switch (gradientStatus) {
            case 'night': return ATMOSPHERE_PALETTE.NIGHT;
            case 'dawn': return interpolatePalette(ATMOSPHERE_PALETTE.NIGHT, ATMOSPHERE_PALETTE.DAWN, gradientProgress);
            case 'sunrise': return interpolatePalette(ATMOSPHERE_PALETTE.DAWN, ATMOSPHERE_PALETTE.DAY, gradientProgress);
            case 'day': return ATMOSPHERE_PALETTE.FULL_DAY; // Use FULL_DAY for bright day
            case 'sunset': return interpolatePalette(ATMOSPHERE_PALETTE.DAY, ATMOSPHERE_PALETTE.DUSK, gradientProgress);
            case 'dusk': return interpolatePalette(ATMOSPHERE_PALETTE.DUSK, ATMOSPHERE_PALETTE.NIGHT, gradientProgress);
            default: return ATMOSPHERE_PALETTE.NIGHT;
        }
    }, [atmosphereMode, showAtmosphere, celestialData.gradientStatus, celestialData.gradientProgress]);

    return (
        <g className="background-layer">
            {/* Background Image or Color */}
            <defs>
                <radialGradient id="skyGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                    <stop offset="0%" stopColor={currentPalette.sky[0]} />
                    <stop offset="35%" stopColor={currentPalette.sky[1]} />
                    <stop offset="70%" stopColor={currentPalette.sky[2]} />
                    <stop offset="100%" stopColor={currentPalette.sky[3]} />
                </radialGradient>
            </defs>
            
            {/* Base Background Circle */}
            <circle cx={cx} cy={cy} r={radius} fill="url(#skyGradient)" />

            {/* Custom Background Image */}
            {customBackgroundImage && (
                <image 
                    href={customBackgroundImage} 
                    x={cx - radius} 
                    y={cy - radius} 
                    width={radius * 2} 
                    height={radius * 2} 
                    preserveAspectRatio="xMidYMid slice"
                    opacity={0.3}
                    style={{ mixBlendMode: 'overlay' }}
                />
            )}

            {/* Stars */}
            {showStars && (
                <g className="stars-layer" style={{ opacity: showAtmosphere && (atmosphereMode === 'day' || (atmosphereMode === 'dynamic' && celestialData.isDayTime)) ? 0.2 : 1 }}>
                    <StarField width={radius * 2} height={radius * 2} density={showConstellations ? 0.5 : 1} />
                </g>
            )}
            
            {/* Magnetic Field Placeholder */}
            {showMagneticField && (
                <circle cx={cx} cy={cy} r={radius * magneticFieldSize} fill="none" stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
            )}
        </g>
    );
};
