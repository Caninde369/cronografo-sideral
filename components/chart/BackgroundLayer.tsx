import React, { useMemo } from 'react';
import { CelestialData } from '../../hooks/useCelestialData';
import { ATMOSPHERE_PALETTE, interpolatePalette } from '../../lib/astrology/graphics';
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
    cx, cy, radius, celestialData, showStars, showConstellations,
    showAtmosphere, showMagneticField, magneticFieldSize,
    atmosphereMode, customBackgroundImage, planetPositions
}) => {

    const currentPalette = useMemo(() => {
        if (!showAtmosphere) return ATMOSPHERE_PALETTE.NIGHT;
        if (atmosphereMode !== 'dynamic') {
            const map: Record<string, typeof ATMOSPHERE_PALETTE.NIGHT> = {
                night: ATMOSPHERE_PALETTE.NIGHT,
                dawn:  ATMOSPHERE_PALETTE.DAWN,
                day:   ATMOSPHERE_PALETTE.FULL_DAY,
                dusk:  ATMOSPHERE_PALETTE.DUSK,
            };
            return map[atmosphereMode] ?? ATMOSPHERE_PALETTE.NIGHT;
        }
        const { gradientStatus, gradientProgress } = celestialData;
        switch (gradientStatus) {
            case 'night':   return ATMOSPHERE_PALETTE.NIGHT;
            case 'dawn':    return interpolatePalette(ATMOSPHERE_PALETTE.NIGHT, ATMOSPHERE_PALETTE.DAWN, gradientProgress);
            case 'sunrise': return interpolatePalette(ATMOSPHERE_PALETTE.DAWN, ATMOSPHERE_PALETTE.DAY, gradientProgress);
            case 'day':     return interpolatePalette(ATMOSPHERE_PALETTE.DAY, ATMOSPHERE_PALETTE.FULL_DAY, Math.min(1, gradientProgress * 2));
            case 'sunset':  return interpolatePalette(ATMOSPHERE_PALETTE.FULL_DAY, ATMOSPHERE_PALETTE.DUSK, gradientProgress);
            case 'dusk':    return interpolatePalette(ATMOSPHERE_PALETTE.DUSK, ATMOSPHERE_PALETTE.NIGHT, gradientProgress);
            default:        return ATMOSPHERE_PALETTE.NIGHT;
        }
    }, [atmosphereMode, showAtmosphere, celestialData.gradientStatus, celestialData.gradientProgress]);

    const starOpacity = useMemo(() => {
        if (!showAtmosphere) return 1;
        const { gradientStatus, gradientProgress } = celestialData;
        switch (gradientStatus) {
            case 'night':   return 1;
            case 'dawn':    return 1 - gradientProgress * 0.6;
            case 'sunrise': return 0.4 - gradientProgress * 0.4;
            case 'day':     return 0;
            case 'sunset':  return gradientProgress * 0.3;
            case 'dusk':    return 0.3 + gradientProgress * 0.7;
            default:        return 1;
        }
    }, [celestialData.gradientStatus, celestialData.gradientProgress, showAtmosphere]);

    // Horizonte como curva quadrática quase reta —
    // sai pelas LATERAIS do círculo, não pelo fundo.
    // dip = quanto a curva desce no centro em relação às bordas.
    // Valor pequeno = horizonte oceânico sutil.
    const { groundPath, horizonLinePath } = useMemo(() => {
        const dip = radius * 0.045; // ~4.5% do raio — ajuste aqui se quiser mais/menos curvatura

        // Ponto esquerdo e direito na linha do equador do círculo (cy)
        // A curva parte daí, desce levemente no meio, e volta
        const lx = cx - radius;
        const rx = cx + radius;
        const ly = cy + dip;   // borda esquerda: levemente abaixo do centro
        const ry = cy + dip;   // borda direita: idem
        const midY = cy - dip; // ponto de controle no meio: levemente acima

        // Path do chão: curva quadrática + fechamento pelo arco inferior do círculo
        // O fechamento usa arco SVG só para fechar pelo caminho mais curto (parte inferior)
        const gp = [
            `M ${lx} ${ly}`,
            `Q ${cx} ${midY} ${rx} ${ry}`,
            // Arco SVG da borda direita → borda esquerda pelo FUNDO do círculo
            // large-arc=1 porque queremos o arco inferior (>180°)
            `A ${radius} ${radius} 0 1 1 ${lx} ${ly}`,
            `Z`
        ].join(' ');

        // Linha do horizonte: apenas a curva, sem preenchimento
        const hl = `M ${lx} ${ly} Q ${cx} ${midY} ${rx} ${ry}`;

        return { groundPath: gp, horizonLinePath: hl };
    }, [cx, cy, radius]);

    return (
        <>
            {/* Estrelas fora do SVG — canvas dentro de foreignObject com clip circular */}
            {showStars && (
                <foreignObject
                    x={cx - radius}
                    y={cy - radius}
                    width={radius * 2}
                    height={radius * 2}
                    style={{ pointerEvents: 'none' }}
                >
                    <div
                        xmlns="http://www.w3.org/1999/xhtml"
                        style={{
                            position: 'relative',
                            width:  radius * 2,
                            height: radius * 2,
                            overflow: 'hidden',
                            borderRadius: '50%',
                            opacity: starOpacity,
                            transition: 'opacity 2s ease',
                        }}
                    >
                        <StarField opacity={1} />
                    </div>
                </foreignObject>
            )}

            <g className="background-layer">
                <defs>
                    <radialGradient id="bg-skyGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%"   stopColor={currentPalette.sky[0]} />
                        <stop offset="35%"  stopColor={currentPalette.sky[1]} />
                        <stop offset="70%"  stopColor={currentPalette.sky[2]} />
                        <stop offset="100%" stopColor={currentPalette.sky[3]} />
                    </radialGradient>
                    <linearGradient id="bg-groundGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={currentPalette.ground[0]} stopOpacity="0.92" />
                        <stop offset="100%" stopColor={currentPalette.ground[1]} stopOpacity="1"    />
                    </linearGradient>
                    <radialGradient id="bg-horizonGlow" cx="50%" cy="100%" r="60%">
                        <stop offset="0%"   stopColor={currentPalette.sky[1]} stopOpacity="0.22" />
                        <stop offset="100%" stopColor={currentPalette.sky[1]} stopOpacity="0"    />
                    </radialGradient>
                    <clipPath id="bg-clockClip">
                        <circle cx={cx} cy={cy} r={radius} />
                    </clipPath>
                </defs>

                {/* 1. Fundo do céu */}
                <circle cx={cx} cy={cy} r={radius} fill="url(#bg-skyGradient)" />

                {/* 2. Imagem de fundo customizada */}
                {customBackgroundImage && (
                    <image
                        href={customBackgroundImage}
                        x={cx - radius} y={cy - radius}
                        width={radius * 2} height={radius * 2}
                        preserveAspectRatio="xMidYMid slice"
                        opacity={0.3}
                        style={{ mixBlendMode: 'overlay' }}
                    />
                )}

                {/* 3. Glow atmosférico na linha do horizonte */}
                <ellipse
                    cx={cx} cy={cy}
                    rx={radius * 0.95} ry={radius * 0.22}
                    fill="url(#bg-horizonGlow)"
                    clipPath="url(#bg-clockClip)"
                />

                {/* 4. Chão — curva quadrática sutil fechada pelo arco inferior */}
                <path
                    d={groundPath}
                    fill="url(#bg-groundGradient)"
                    clipPath="url(#bg-clockClip)"
                />

                {/* 5. Linha do horizonte acompanhando a curva */}
                <path
                    d={horizonLinePath}
                    fill="none"
                    stroke={currentPalette.ground[0]}
                    strokeWidth="1"
                    strokeOpacity="0.35"
                    clipPath="url(#bg-clockClip)"
                />

                {/* 6. Campo magnético */}
                {showMagneticField && (
                    <circle
                        cx={cx} cy={cy}
                        r={radius * magneticFieldSize}
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeDasharray="4 4"
                    />
                )}
            </g>
        </>
    );
};