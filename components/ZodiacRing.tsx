
import React, { useMemo } from 'react';
import { ZODIAC_DATA, ELEMENT_COLORS, MODALITY_COLORS, POLARITY_COLORS, getZodiacColorClass } from './zodiac';
import { ZODIAC_ICONS } from './icons';
import { normalizeAngle, polarToCartesian } from '../lib/astrology/utils';
import { HighlightFilter } from './ChartStatisticsPanel';
import { useRingColors, bandColorAt, zodiacSignColor } from '../lib/appearance';

interface ZodiacRingProps {
    cx: number;
    cy: number;
    innerRadius: number;
    outerRadius: number;
    rotation: number;
    onHover: (id: string) => void;
    onLeave: () => void;
    iconSize?: number;
    colorMode?: 'none' | 'element' | 'modality' | 'polarity';
    highlightFilter?: HighlightFilter;
    isBrightSky?: boolean;
    /** tema claro (fundo creme) */
    isLight?: boolean;
    /** 'modern' = zodíaco na linha espectral (escolhido no painel admin) */
    styleMode?: 'traditional' | 'modern';
}

export const ZodiacRing: React.FC<ZodiacRingProps> = ({
    cx, cy, innerRadius, outerRadius, rotation, onHover, onLeave, iconSize = 24, colorMode = 'element', highlightFilter, isBrightSky = false, isLight = false, styleMode = 'traditional'
}) => {
    const uid = React.useId().replace(/:/g, '');
    const ringColors = useRingColors();
    
    const getAngle = (longitude: number) => {
        // Base angle calculation (rotation = 0)
        // Matches SiderealClock logic: 180 (Left) - longitude
        const angle = 180 - longitude;
        return normalizeAngle(angle);
    };

    const describeSector = (x: number, y: number, r1: number, r2: number, startAngle: number, endAngle: number) => {
        const startOuter = polarToCartesian(x, y, r2, startAngle);
        const endOuter = polarToCartesian(x, y, r2, endAngle);
        const startInner = polarToCartesian(x, y, r1, endAngle);
        const endInner = polarToCartesian(x, y, r1, startAngle);

        // For sweepFlag 0 (counter-clockwise), the positive difference is start - end
        let diff = startAngle - endAngle;
        if (diff < 0) diff += 360;
        const largeArcFlag = diff > 180 ? 1 : 0;
        const sweepFlag = 0; 

        return [
            "M", startOuter.x, startOuter.y,
            "A", r2, r2, 0, largeArcFlag, sweepFlag, endOuter.x, endOuter.y,
            "L", startInner.x, startInner.y,
            "A", r1, r1, 0, largeArcFlag, 1, endInner.x, endInner.y, 
            "Z"
        ].join(" ");
    };

    const adaptiveStroke = isBrightSky ? "rgba(15, 23, 42, 0.55)" : "rgba(255, 255, 255, 0.25)";
    const adaptiveIconColor = isBrightSky ? "text-slate-900" : "text-white dark:text-gray-300";

    const dimmedSign = (sign: typeof ZODIAC_DATA[number]) => {
        if (!highlightFilter) return false;
        if (highlightFilter.type === 'element' && sign.element !== highlightFilter.value) return true;
        if (highlightFilter.type === 'modality' && sign.modality !== highlightFilter.value) return true;
        if (highlightFilter.type === 'polarity' && sign.polarity !== highlightFilter.value) return true;
        return false;
    };

    // ── Cores modernas: faixa contínua na linha espectral, signos brancos ──
    if (styleMode === 'modern') {
        const M = ringColors;
        const glyphSize = Math.round(iconSize * M.glyphScale);
        const onLight = isBrightSky || isLight;
        const ink = onLight ? '#231714' : '#F5F2EB';
        const sepColor = onLight ? '#231714' : '#ffffff';
        const slices: React.ReactNode[] = [];
        const edges: React.ReactNode[] = [];
        for (let l = 0; l < 360; l += 2) {
            const c = bandColorAt(l + 1, M);
            const dim = dimmedSign(ZODIAC_DATA[Math.floor(l / 30)]) ? 0.15 : 1;
            slices.push(<path key={l} d={describeSector(cx, cy, innerRadius, outerRadius, getAngle(l), getAngle(Math.min(360, l + 2.6)))} fill={c} opacity={dim} />);
            [outerRadius, innerRadius].forEach(r => {
                const a = polarToCartesian(cx, cy, r, getAngle(l));
                const b = polarToCartesian(cx, cy, r, getAngle(l + 2.4));
                edges.push(<path key={`${l}-${r}`} d={`M${a.x},${a.y}A${r},${r} 0 0 0 ${b.x},${b.y}`} stroke={c} strokeWidth="1.4" fill="none" opacity={dim} />);
            });
        }
        return (
            <g data-tour="zodiac" transform={`rotate(${rotation}, ${cx}, ${cy})`}>
                <defs>
                    <filter id={`zg-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation={2 + M.glyphGlow * 8} result="b" />
                        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>
                <g opacity={onLight ? M.fill * 1.6 : M.fill} shapeRendering="geometricPrecision">{slices}</g>
                <g opacity={M.edge} shapeRendering="geometricPrecision">{edges}</g>
                {ZODIAC_DATA.map((sign, i) => {
                    const startLon = i * 30;
                    const a = getAngle(startLon);
                    const p1 = polarToCartesian(cx, cy, innerRadius, a);
                    const p2 = polarToCartesian(cx, cy, outerRadius, a);
                    const pos = polarToCartesian(cx, cy, (innerRadius + outerRadius) / 2, getAngle(startLon + 15));
                    const SignIcon = ZODIAC_ICONS[sign.id as keyof typeof ZODIAC_ICONS];
                    const signInk = M.glyph === 'color' ? zodiacSignColor(i, onLight, 'modern', M) : ink;
                        return (
                        <g key={sign.id} data-sign={i} className="group" onMouseEnter={() => onHover(sign.id)} onMouseLeave={onLeave}
                           style={{ opacity: dimmedSign(sign) ? 0.15 : 1, transition: 'opacity 0.2s ease-in-out' }}>
                            <path d={describeSector(cx, cy, innerRadius, outerRadius, getAngle(startLon), getAngle(startLon + 30))}
                                  fill="transparent" stroke="none" className="cursor-pointer" />
                            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={sepColor} strokeOpacity={M.sep} strokeWidth="0.8" strokeLinecap="round" />
                            <g transform={`translate(${pos.x}, ${pos.y}) rotate(${-rotation})`} style={{ pointerEvents: 'none' }}>
                                <g style={{ opacity: 0.88 }} filter={onLight ? undefined : `url(#zg-${uid})`}>
                                    <SignIcon width={glyphSize} height={glyphSize} x={-glyphSize / 2} y={-glyphSize / 2} fill={signInk} shapeRendering="geometricPrecision" />
                                </g>
                            </g>
                        </g>
                    );
                })}
            </g>
        );
    }

    return (
        <g data-tour="zodiac" transform={`rotate(${rotation}, ${cx}, ${cy})`}>
            {ZODIAC_DATA.map((sign, i) => {
                const startLon = i * 30;
                const endLon = (i + 1) * 30;
                
                const startAngle = getAngle(startLon);
                const endAngle = getAngle(endLon);
                
                // Midpoint for icon - slightly closer to inner radius for elegance
                const midAngle = getAngle(startLon + 15);
                const midR = innerRadius + (outerRadius - innerRadius) * 0.5;
                const pos = polarToCartesian(cx, cy, midR, midAngle);

                const SignIcon = ZODIAC_ICONS[sign.id as keyof typeof ZODIAC_ICONS];
                
                // Check Highlight Filter
                let isDimmed = false;
                if (highlightFilter) {
                    if (highlightFilter.type === 'element' && sign.element !== highlightFilter.value) isDimmed = true;
                    if (highlightFilter.type === 'modality' && sign.modality !== highlightFilter.value) isDimmed = true;
                    if (highlightFilter.type === 'polarity' && sign.polarity !== highlightFilter.value) isDimmed = true;
                }

                const opacity = isDimmed ? 0.1 : 1;
                
                const getGradientId = (element: string) => {
                    switch(element) {
                        case 'fire': return 'url(#zodiac-fire)';
                        case 'earth': return 'url(#zodiac-earth)';
                        case 'air': return 'url(#zodiac-air)';
                        case 'water': return 'url(#zodiac-water)';
                        default: return 'currentColor';
                    }
                };

                const getIconGradientId = (element: string) => {
                    switch(element) {
                        case 'fire': return 'url(#zodiac-icon-fire)';
                        case 'earth': return 'url(#zodiac-icon-earth)';
                        case 'air': return 'url(#zodiac-icon-air)';
                        case 'water': return 'url(#zodiac-icon-water)';
                        default: return 'currentColor';
                    }
                };

                let iconFill = 'currentColor';
                let iconColor = adaptiveIconColor;
                if (colorMode === 'element') {
                    iconFill = getIconGradientId(sign.element);
                    iconColor = ''; // Clear color class to use fill
                } else if (colorMode === 'modality') {
                    const modalityHex: Record<string, string> = {
                        cardinal: '#a78bfa',
                        fixed: '#60a5fa',
                        mutable: '#34d399',
                    };
                    iconColor = '';
                    iconFill = modalityHex[sign.modality] || 'currentColor';
                } else if (colorMode === 'polarity') {
                    iconColor = POLARITY_COLORS[sign.polarity];
                } else if (colorMode && colorMode !== 'none') {
                    iconColor = getZodiacColorClass(sign, colorMode as 'element' | 'modality' | 'polarity');
                }

                return (
                    <g 
                        key={sign.id} 
                        data-sign={i}
                        className="group"
                        onMouseEnter={() => onHover(sign.id)}
                        onMouseLeave={onLeave}
                        style={{ opacity, transition: 'opacity 0.2s ease-in-out' }}
                    >
                        {/* Background Sector */}
                        <path 
                            d={describeSector(cx, cy, innerRadius, outerRadius, startAngle, endAngle)}
                            fill={
                                colorMode === 'element'
                                    ? getGradientId(sign.element)
                                    : colorMode === 'modality'
                                        ? ({ cardinal: '#a78bfa', fixed: '#60a5fa', mutable: '#34d399' } as Record<string,string>)[sign.modality] || 'transparent'
                                        : 'transparent'
                            }
                            fillOpacity={colorMode === 'element' || colorMode === 'modality' ? (isBrightSky ? "0.08" : "0.12") : "0"}
                            stroke="none"
                            className="hover:brightness-150 cursor-pointer"
                        />

                        {/* Separator Lines - Subtle for elegance */}
                        <line 
                            x1={polarToCartesian(cx, cy, innerRadius, startAngle).x}
                            y1={polarToCartesian(cx, cy, innerRadius, startAngle).y}
                            x2={polarToCartesian(cx, cy, outerRadius, startAngle).x}
                            y2={polarToCartesian(cx, cy, outerRadius, startAngle).y}
                            stroke={adaptiveStroke}
                            strokeWidth="0.8"
                            strokeLinecap="round"
                            shapeRendering="geometricPrecision"
                        />

                        {/* Icon Container - Symbols Upright, Scalable */}
                        <g transform={`translate(${pos.x}, ${pos.y}) rotate(${-rotation})`} shapeRendering="geometricPrecision">
                            <g 
                                className="opacity-80 group-hover:opacity-100 transition-opacity duration-200"
                                style={{ filter: isBrightSky ? 'drop-shadow(0 1px 1px rgba(15,23,42,0.3))' : 'drop-shadow(0 1px 1px rgba(0,0,0,0.2))' }}
                            >
                                <SignIcon 
                                    className={iconColor} 
                                    width={iconSize} 
                                    height={iconSize} 
                                    x={-iconSize / 2} 
                                    y={-iconSize / 2} 
                                    fill={iconFill}
                                    stroke={iconFill === 'currentColor' ? 'currentColor' : 'none'}
                                    strokeWidth="8" 
                                    shapeRendering="geometricPrecision"
                                />
                            </g>
                        </g>
                    </g>
                );
            })}
            {/* Outer Border Ring */}
             <circle cx={cx} cy={cy} r={innerRadius} fill="none" stroke={adaptiveStroke} strokeWidth="1" shapeRendering="geometricPrecision" />
             <circle cx={cx} cy={cy} r={outerRadius} fill="none" stroke={adaptiveStroke} strokeWidth="1" shapeRendering="geometricPrecision" />
        </g>
    );
};
