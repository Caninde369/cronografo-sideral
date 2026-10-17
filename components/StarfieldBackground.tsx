import React from 'react';
import { StarField, StarFieldProps } from './StarField';

export interface StarfieldBackgroundProps extends Partial<StarFieldProps> {
    isLight?: boolean;
    opacity?: number;
}

export default function StarfieldBackground({
    isLight = false,
    opacity = 1,
    starCount = 1400,
    twinkleIntensity = 0.75,
    twinkleSpeed = 1.0,
    twinkleMode = 'natural',
    showMeteors = true,
    meteorFrequency = 'moderate',
    showNebulaGlow = true,
    nebulaOpacity = 0.85,
    starBrightness = 1.0,
}: StarfieldBackgroundProps) {
    return (
        <div 
            className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
            style={{ opacity, transition: 'opacity 2s ease' }}
        >
            <StarField
                opacity={isLight ? 0.4 : 0.88}
                isLight={isLight}
                starCount={starCount}
                twinkleIntensity={twinkleIntensity}
                twinkleSpeed={twinkleSpeed}
                twinkleMode={twinkleMode}
                showMeteors={showMeteors}
                meteorFrequency={meteorFrequency}
                showNebulaGlow={showNebulaGlow}
                nebulaOpacity={nebulaOpacity}
                starBrightness={starBrightness}
                className="w-full h-full"
            />
        </div>
    );
}
