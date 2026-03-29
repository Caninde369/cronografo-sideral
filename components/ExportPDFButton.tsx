import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CelestialData } from '../hooks/useCelestialData';
import { Aspect } from '../lib/astrology/aspects';
import { ZODIAC_DATA } from './zodiac';

interface ExportPDFButtonProps {
    currentTime: Date;
    location: { displayName: string; latitude?: number; longitude?: number };
    celestialData: CelestialData;
    seasonInfo: { name: string; icon: any; color: string; day: number };
    sunriseTime: string;
    sunsetTime: string;
    moonriseTime: string;
    moonsetTime: string;
    moonPhase: { name: string; icon: any };
    moonPhaseValue: number;
    retrogradeStatus: Record<string, boolean>;
    housePlacements: Record<string, number>;
    houseCusps: number[];
    filteredAspects: Aspect[];
    clockRef: React.RefObject<HTMLDivElement>;
    showAspectLines: boolean;
    setShowAspectLines: React.Dispatch<React.SetStateAction<boolean>>;
    theme: 'dark' | 'light';
    onSetTheme: (theme: 'dark' | 'light') => void;
    showSeasonsRing: boolean;
    setShowSeasonsRing: React.Dispatch<React.SetStateAction<boolean>>;
    showTimeRing: boolean;
    setShowTimeRing: React.Dispatch<React.SetStateAction<boolean>>;
    showConstellations: boolean;
    setShowConstellations: React.Dispatch<React.SetStateAction<boolean>>;
}

interface PDFLayoutProps extends Omit<ExportPDFButtonProps, 'clockRef' | 'showAspectLines' | 'setShowAspectLines'> {
    clockScreenshot: string;
}

const SIGN_ELEMENT_COLORS: Record<string, string> = {
    'Áries': '#D97706', 'Leão': '#D97706', 'Sagitário': '#D97706',
    'Touro': '#059669', 'Virgem': '#059669', 'Capricórnio': '#059669',
    'Gêmeos': '#475569', 'Libra': '#475569', 'Aquário': '#475569',
    'Câncer': '#0891B2', 'Escorpião': '#0891B2', 'Peixes': '#0891B2'
};

const PLANET_COLORS: Record<string, string> = {
    sun: '#FDE047', moon: '#F1F5F9', mercury: '#CBD5E1', venus: '#FDA4AF', mars: '#EF4444',
    jupiter: '#FB923C', saturn: '#FACC15', uranus: '#22D3EE', neptune: '#6366F1', pluto: '#94A3B8',
    northNode: '#99F6E4', southNode: '#D97706', lilith: '#E879F9',
    chiron: '#10B981', ceres: '#FACC15', pallas: '#818CF8', juno: '#F472B6', vesta: '#FB923C'
};

const ELEMENT_COLORS: Record<string, string> = {
    fire: '#D97706', earth: '#059669', air: '#475569', water: '#0891B2'
};

const MODALITY_COLORS: Record<string, string> = {
    cardinal: '#E11D48', fixed: '#7C3AED', mutable: '#0D9488'
};

const POLARITY_COLORS: Record<string, string> = {
    masculine: '#DC2626', feminine: '#2563EB'
};

const PLANET_SYMBOLS: Record<string, string> = {
    sun: '☉', moon: '☽', mercury: '☿', venus: '♀', mars: '♂',
    jupiter: '♃', saturn: '♄', uranus: '⛢', neptune: '♆', pluto: '♇',
    northNode: '☊', lilith: '⚸', southNode: '☋',
    chiron: '⚷', ceres: '⚳', pallas: '⚴', juno: '⚵', vesta: '⚶'
};

const PLANET_NAMES_FULL: Record<string, string> = {
    sun: 'Sol', moon: 'Lua', mercury: 'Mercúrio', venus: 'Vênus', mars: 'Marte',
    jupiter: 'Júpiter', saturn: 'Saturno', uranus: 'Urano', neptune: 'Netuno', pluto: 'Plutão',
    northNode: 'Nodo Norte', southNode: 'Nodo Sul', lilith: 'Lilith',
    chiron: 'Quíron', ceres: 'Ceres', pallas: 'Palas', juno: 'Juno', vesta: 'Vesta'
};

const ASPECT_ABBREV: Record<string, string> = {
    conjunction: 'CON', opposition: 'OPO', trine: 'TRI', sextile: 'SXT', square: 'QUA'
};

const ASPECT_STYLES: Record<string, { color: string }> = {
    conjunction: { color: '#9333ea' },
    opposition: { color: '#dc2626' },
    trine: { color: '#16a34a' },
    square: { color: '#ea580c' },
    sextile: { color: '#2563eb' }
};

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const HOUSE_LABELS = ['ASC', 'II', 'III', 'IC', 'V', 'VI', 'DC', 'VIII', 'IX', 'MC', 'XI', 'XII'];
const HOUSE_ORDER_SEQ = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const PDFLayout: React.FC<PDFLayoutProps> = ({
    currentTime, location, celestialData, seasonInfo, sunriseTime, sunsetTime,
    moonriseTime, moonsetTime, moonPhase, moonPhaseValue, retrogradeStatus, housePlacements,
    houseCusps, filteredAspects, clockScreenshot, latitude, longitude
}) => {
    const formatDegree = (longitude: number) => {
        const degree = Math.floor(longitude % 30);
        const minutes = Math.floor((longitude % 1) * 60);
        return `${degree.toString().padStart(2, '0')}°${minutes.toString().padStart(2, '0')}'`;
    };

    const getSignInfo = (longitude: number) => {
        const signIndex = Math.floor(longitude / 30);
        return ZODIAC_DATA[signIndex];
    };

    const getMoonIllumination = (phase: number) => {
        // phase is 0..1
        // 0: Nova, 0.5: Cheia
        // Illumination approx: (1 - cos(2*pi*phase))/2 * 100
        // But simpler for linear approximation if needed, or just use the formula
        const illumination = (1 - Math.cos(2 * Math.PI * phase)) / 2;
        return Math.round(illumination * 100);
    };

    const renderPlanetRow = (id: string, opacity: number = 1) => {
        const key = `${id}EclipticLongitude` as keyof CelestialData;
        const longitude = celestialData[key] as number;
        if (typeof longitude !== 'number') return null;

        const sign = getSignInfo(longitude);
        const isRetrograde = retrogradeStatus[id];
        const signColor = SIGN_ELEMENT_COLORS[sign.name] || '#111';
        const planetColor = PLANET_COLORS[id] || '#333';
        const isSunOrMoon = id === 'sun' || id === 'moon';
        const house = housePlacements[id] || 1;

        return (
            <div key={id} style={{ 
                display: 'grid', gridTemplateColumns: '14px 58px 20px 1fr auto 12px', alignItems: 'center', 
                padding: '3px 4px', borderBottom: '1px solid #f2f2f2', opacity,
                fontFamily: 'Arial, sans-serif',
                background: isSunOrMoon ? '#fafafa' : 'transparent'
            }}>
                <div style={{ 
                    fontFamily: "'Segoe UI Symbol', 'Apple Symbols', sans-serif", 
                    fontSize: '10px', color: planetColor, width: '14px', textAlign: 'center', flexShrink: 0 
                }}>
                    {PLANET_SYMBOLS[id] || ''}
                </div>
                <div style={{ fontSize: '9px', fontWeight: 400, color: '#333', width: '58px' }}>
                    {PLANET_NAMES_FULL[id] || id}
                </div>
                <div style={{ 
                    fontFamily: 'Georgia, serif', fontSize: '9px', fontWeight: 400, 
                    color: '#aaa', textAlign: 'center', width: '20px' 
                }}>
                    {ROMAN_NUMERALS[house - 1]}
                </div>
                <div style={{ fontSize: '9px', fontWeight: 400, color: signColor, flex: 1 }}>
                    {sign.name}
                </div>
                <div style={{ fontSize: '8.5px', color: '#333', fontFamily: "'Courier New', monospace", textAlign: 'right' }}>
                    {formatDegree(longitude)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', width: '12px', justifyContent: 'flex-end' }}>
                    {isRetrograde && <span style={{ fontSize: '8px', color: '#dc2626', fontWeight: 700 }}>R</span>}
                </div>
            </div>
        );
    };

    const stats = (() => {
        const PLANETS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
        const counts = { feminine: 0, masculine: 0, fire: 0, earth: 0, air: 0, water: 0, cardinal: 0, fixed: 0, mutable: 0 };
        PLANETS.forEach(id => {
            const lon = celestialData[`${id}EclipticLongitude` as keyof CelestialData] as number;
            if (typeof lon === 'number') {
                const sign = getSignInfo(lon);
                if (sign.polarity === 'masculine') counts.masculine++;
                else counts.feminine++;
                counts[sign.element as keyof typeof counts]++;
                counts[sign.modality as keyof typeof counts]++;
            }
        });
        return counts;
    })();

    const sortedAspects = [...filteredAspects].sort((a, b) => a.orb - b.orb);

    const formatTime = (date: Date) => date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const formatDate = (date: Date) => date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formatWeekday = (date: Date) => date.toLocaleDateString('pt-BR', { weekday: 'long' });

    return (
        <div style={{
            width: '595px', height: '842px', background: '#ffffff',
            padding: '28px', boxSizing: 'border-box', position: 'relative',
            overflow: 'hidden', color: '#111', fontFamily: 'Manrope, sans-serif'
        }}>
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Cormorant+Infant:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Courier+Prime&family=Gelasio:wght@400;700&display=swap');
                `}
            </style>

            {/* DECORATIVE BORDER */}
            <div style={{
                position: 'absolute', top: '8px', left: '8px', right: '8px', bottom: '8px',
                border: '1px solid #cccccc', pointerEvents: 'none', zIndex: 0
            }} />

            {/* WATERMARK */}
            <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-45deg)',
                fontSize: '60px', fontWeight: 900, color: '#000000', opacity: 0.025,
                whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 0, fontFamily: "'Cormorant Infant', serif"
            }}>
                CRONÓGRAFO SIDERAL
            </div>

            <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* HEADER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', position: 'relative' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                        <div style={{ fontSize: '22px', fontWeight: 'normal', color: '#111111', fontFamily: "'Cormorant Infant', serif" }}>Cronógrafo Sideral</div>
                        <div style={{ fontSize: '9.5px', color: '#555555' }}>
                            {location.displayName} · {formatWeekday(currentTime)}
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#111111', marginTop: '2px' }}>
                            {formatDate(currentTime)} · {formatTime(currentTime)}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <div style={{ border: '1px solid #e5e5e5', background: '#fafafa', borderRadius: '4px', padding: '4px 8px', fontSize: '8.5px', color: '#555' }}>
                                Dia {seasonInfo.day.toString().padStart(2, '0')} do {seasonInfo.name}
                            </div>
                            <div style={{ border: '1px solid #e5e5e5', background: '#fafafa', borderRadius: '4px', padding: '4px 8px', fontSize: '8.5px', color: '#555' }}>
                                {moonPhase.name} · {getMoonIllumination(moonPhaseValue)}% iluminada
                            </div>
                        </div>

                        {/* STATUS LINE */}
                        <div style={{ display: 'flex', gap: '16px', marginTop: '10px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ fontSize: '6.5px', fontFamily: 'Arial', fontWeight: 700, textTransform: 'uppercase', color: '#bbb', marginRight: '6px' }}>POLARIDADE</span>
                                <div style={{ display: 'flex', gap: '8px', fontSize: '8.5px', fontFamily: 'Arial' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                        <span style={{ color: POLARITY_COLORS.feminine }}>♀ {stats.feminine}</span>
                                        <div style={{ width: '16px', height: '1.5px', background: '#f0f0f0', borderRadius: '1px', overflow: 'hidden' }}>
                                            <div style={{ width: `${(stats.feminine/10)*100}%`, height: '100%', background: POLARITY_COLORS.feminine }} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                        <span style={{ color: POLARITY_COLORS.masculine }}>♂ {stats.masculine}</span>
                                        <div style={{ width: '16px', height: '1.5px', background: '#f0f0f0', borderRadius: '1px', overflow: 'hidden' }}>
                                            <div style={{ width: `${(stats.masculine/10)*100}%`, height: '100%', background: POLARITY_COLORS.masculine }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <span style={{ color: '#ddd', fontSize: '10px' }}>·</span>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ fontSize: '6.5px', fontFamily: 'Arial', fontWeight: 700, textTransform: 'uppercase', color: '#bbb', marginRight: '6px' }}>ELEMENTOS</span>
                                <div style={{ display: 'flex', gap: '8px', fontSize: '8.5px', fontFamily: 'Arial' }}>
                                    {[
                                        { label: '△', val: stats.fire, col: ELEMENT_COLORS.fire },
                                        { label: '▽', val: stats.earth, col: ELEMENT_COLORS.earth },
                                        { label: '△', val: stats.air, col: ELEMENT_COLORS.air },
                                        { label: '▽', val: stats.water, col: ELEMENT_COLORS.water }
                                    ].map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                            <span style={{ color: item.col }}>{item.label} {item.val}</span>
                                            <div style={{ width: '16px', height: '1.5px', background: '#f0f0f0', borderRadius: '1px', overflow: 'hidden' }}>
                                                <div style={{ width: `${(item.val/5)*100}%`, height: '100%', background: item.col }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <span style={{ color: '#ddd', fontSize: '10px' }}>·</span>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ fontSize: '6.5px', fontFamily: 'Arial', fontWeight: 700, textTransform: 'uppercase', color: '#bbb', marginRight: '6px' }}>MODALIDADES</span>
                                <div style={{ display: 'flex', gap: '8px', fontSize: '8.5px', fontFamily: 'Arial' }}>
                                    {[
                                        { label: '+', val: stats.cardinal, col: MODALITY_COLORS.cardinal },
                                        { label: '□', val: stats.fixed, col: MODALITY_COLORS.fixed },
                                        { label: '×', val: stats.mutable, col: MODALITY_COLORS.mutable }
                                    ].map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                            <span style={{ color: item.col }}>{item.label} {item.val}</span>
                                            <div style={{ width: '16px', height: '1.5px', background: '#f0f0f0', borderRadius: '1px', overflow: 'hidden' }}>
                                                <div style={{ width: `${(item.val/5)*100}%`, height: '100%', background: item.col }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* SCREENSHOT */}
                    <div style={{ position: 'relative', alignSelf: 'flex-start' }}>
                        {clockScreenshot ? (
                            <img src={clockScreenshot} style={{ width: '210px', background: 'transparent' }} alt="Clock" />
                        ) : (
                            <div style={{ width: '210px', height: '210px', background: 'transparent' }} />
                        )}
                    </div>
                </div>

                {/* HEADER DIVIDER */}
                <div style={{ height: '1px', background: '#cccccc', marginBottom: '16px' }} />

                {/* MAIN BODY */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.6fr 0.8fr', gap: '20px', flex: 1 }}>
                    
                    {/* COLUMN 1: ASTROS */}
                    <div style={{ overflow: 'hidden', minWidth: 0 }}>
                        <div style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#111111', borderBottom: '1px solid #cccccc', paddingBottom: '4px', marginBottom: '4px' }}>ASTROS</div>
                        
                        <div style={{ fontSize: '7px', color: '#aaaaaa', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '6px 0 2px' }}>PRINCIPAIS</div>
                        {['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'].map(id => renderPlanetRow(id, 1))}
                        
                        <div style={{ fontSize: '7px', color: '#aaaaaa', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '6px 0 2px' }}>PONTOS</div>
                        {['northNode', 'lilith', 'southNode'].map(id => renderPlanetRow(id, 0.85))}
                        
                        <div style={{ fontSize: '7px', color: '#aaaaaa', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '6px 0 2px' }}>ASTEROIDES</div>
                        {['chiron', 'ceres', 'pallas', 'juno', 'vesta'].map(id => renderPlanetRow(id, 0.75))}
                    </div>

                    {/* COLUMN 2: ASPECTOS */}
                    <div style={{ overflow: 'hidden', minWidth: 0 }}>
                        <div style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#111111', borderBottom: '1px solid #cccccc', paddingBottom: '4px', marginBottom: '8px' }}>ASPECTOS</div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {sortedAspects.slice(0, 22).map((aspect, i) => {
                                const sign1 = getSignInfo(aspect.body1.longitude);
                                const sign2 = getSignInfo(aspect.body2.longitude);
                                const h1 = housePlacements[aspect.body1.id] || 1;
                                const h2 = housePlacements[aspect.body2.id] || 1;
                                const sign1Color = SIGN_ELEMENT_COLORS[sign1.name] || '#111';
                                const sign2Color = SIGN_ELEMENT_COLORS[sign2.name] || '#111';
                                const style = ASPECT_STYLES[aspect.type] || { color: '#374151' };

                                return (
                                    <div key={i} style={{ 
                                        display: 'grid', 
                                        gridTemplateColumns: '18px 22px 4px 52px 36px 52px 4px 22px 18px 28px', 
                                        alignItems: 'center', 
                                        padding: '2px 0', 
                                        borderBottom: '1px solid #f2f2f2' 
                                    }}>
                                        <div style={{ fontFamily: "'Courier New', monospace", fontSize: '9px', fontWeight: 400, color: '#888', textAlign: 'center' }}>
                                            {ROMAN_NUMERALS[h1 - 1]}
                                        </div>
                                        <div style={{ fontSize: '8px', fontFamily: 'Arial, sans-serif', fontWeight: 400, color: sign1Color, textAlign: 'center' }}>
                                            {sign1.name.substring(0, 3).toUpperCase()}
                                        </div>
                                        <div style={{ color: '#ddd', fontSize: '7px', textAlign: 'center' }}>›</div>
                                        <div style={{ fontSize: '9px', fontFamily: 'Arial, sans-serif', fontWeight: 400, color: '#111', textAlign: 'right' }}>
                                            {PLANET_NAMES_FULL[aspect.body1.id]}
                                        </div>
                                        <div style={{ 
                                            fontSize: '8px', fontFamily: 'Arial, sans-serif', fontWeight: 700, textAlign: 'center', 
                                            color: style.color,
                                            padding: '1px 0'
                                        }}>
                                            {ASPECT_ABBREV[aspect.type] || aspect.type.substring(0,3).toUpperCase()}
                                        </div>
                                        <div style={{ fontSize: '9px', fontFamily: 'Arial, sans-serif', fontWeight: 400, color: '#111', textAlign: 'left' }}>
                                            {PLANET_NAMES_FULL[aspect.body2.id]}
                                        </div>
                                        <div style={{ color: '#ddd', fontSize: '7px', textAlign: 'center' }}>‹</div>
                                        <div style={{ fontSize: '8px', fontFamily: 'Arial, sans-serif', fontWeight: 400, color: sign2Color, textAlign: 'center' }}>
                                            {sign2.name.substring(0, 3).toUpperCase()}
                                        </div>
                                        <div style={{ fontFamily: "'Courier New', monospace", fontSize: '9px', fontWeight: 400, color: '#888', textAlign: 'center' }}>
                                            {ROMAN_NUMERALS[h2 - 1]}
                                        </div>
                                        <div style={{ fontSize: '8px', fontFamily: "'Courier New', monospace", color: '#aaa', textAlign: 'right' }}>
                                            {aspect.orb.toFixed(1)}°
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* COLUMN 3: CASAS */}
                    <div style={{ overflow: 'hidden', minWidth: 0 }}>
                        <div style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#111111', borderBottom: '1px solid #cccccc', paddingBottom: '4px', marginBottom: '8px' }}>CASAS · CÚSPIDES</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2px' }}>
                            {HOUSE_ORDER_SEQ.map(i => {
                                const cusp = houseCusps[i];
                                const sign = getSignInfo(cusp);
                                const label = HOUSE_LABELS[i];
                                const isAngle = [0, 3, 6, 9].includes(i);
                                const signColor = SIGN_ELEMENT_COLORS[sign.name] || '#111';
                                
                                return (
                                    <div key={i} style={{ 
                                        display: 'grid', gridTemplateColumns: '28px 1fr auto', alignItems: 'center', 
                                        padding: '3px 4px', borderBottom: '1px solid #f2f2f2',
                                        background: isAngle ? '#fafafa' : 'transparent'
                                    }}>
                                        <div style={{ 
                                            fontFamily: 'Georgia, serif', fontSize: '9px',
                                            fontWeight: isAngle ? 700 : 400, 
                                            color: isAngle ? '#444' : '#aaaaaa' 
                                        }}>
                                            {label}
                                        </div>
                                        <div style={{ fontSize: '9px', fontFamily: 'Arial, sans-serif', fontWeight: isAngle ? 500 : 400, color: signColor }}>
                                            {sign.name}
                                        </div>
                                        <div style={{ fontSize: '8.5px', color: '#333', textAlign: 'right', fontFamily: "'Courier New', monospace" }}>
                                            {formatDegree(cusp)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #cccccc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '7px', color: '#aaaaaa', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            CRONÓGRAFO SIDERAL
                        </div>
                        <div style={{ fontSize: '7px', color: '#aaaaaa', letterSpacing: '0.05em' }}>
                            {latitude && longitude ? `${Math.abs(latitude).toFixed(4)}°${latitude >= 0 ? 'N' : 'S'} ${Math.abs(longitude).toFixed(4)}°${longitude >= 0 ? 'E' : 'W'}` : ''}
                        </div>
                        <div style={{ fontSize: '7px', color: '#aaaaaa', letterSpacing: '0.05em' }}>
                            {formatDate(new Date())} {formatTime(new Date())}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ExportPDFButton: React.FC<ExportPDFButtonProps> = (props) => {
    const [isExporting, setIsExporting] = useState(false);
    const [clockScreenshot, setClockScreenshot] = useState<string>('');
    const pdfRef = useRef<HTMLDivElement>(null);

    const exportPDF = async () => {
        if (!props.clockRef.current || !pdfRef.current) return;
        setIsExporting(true);

        try {
            // Preload fonts
            await document.fonts.load('400 12px Manrope');
            await document.fonts.load('400 12px "Courier New"');
            await document.fonts.load('400 12px Georgia');
            await document.fonts.ready;

            // 1. Force light mode and clean clock
            const originalTheme = props.theme;
            const originalShowSeasonsRing = props.showSeasonsRing;
            const originalShowTimeRing = props.showTimeRing;
            const originalShowAspectLines = props.showAspectLines;
            const originalShowConstellations = props.showConstellations;

            props.onSetTheme('light');
            props.setShowSeasonsRing(false);
            props.setShowTimeRing(false);
            props.setShowAspectLines(true);
            props.setShowConstellations(false);
            
            // Wait for React to render
            await new Promise(resolve => setTimeout(resolve, 800));

            // Capture the clock
            if (props.clockRef.current.offsetWidth > 0 && props.clockRef.current.offsetHeight > 0) {
                const clockCanvas = await html2canvas(props.clockRef.current, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: null, // Transparent
                    logging: false
                });
                const clockDataUrl = clockCanvas.toDataURL('image/png');
                setClockScreenshot(clockDataUrl);
            } else {
                setClockScreenshot('');
            }

            // Restore clock state
            props.onSetTheme(originalTheme);
            props.setShowSeasonsRing(originalShowSeasonsRing);
            props.setShowTimeRing(originalShowTimeRing);
            props.setShowAspectLines(originalShowAspectLines);
            props.setShowConstellations(originalShowConstellations);

            // 2. Wait for PDFLayout to re-render with the screenshot
            await new Promise(resolve => setTimeout(resolve, 600));

            // 3. Capture the PDF layout
            const pdfCanvas = await html2canvas(pdfRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false
            });

            const imgData = pdfCanvas.toDataURL('image/jpeg', 0.95);
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '').substring(0, 15).replace('T', '-');
            const cityName = props.location.displayName.split(',')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            pdf.save(`sideral-${cityName}-${timestamp}.pdf`);
        } catch (error) {
            console.error('Error exporting PDF:', error);
        } finally {
            setIsExporting(false);
            setClockScreenshot('');
        }
    };

    return (
        <>
            <button
                onClick={exportPDF}
                disabled={isExporting}
                style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    background: '#111111',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 600,
                    fontFamily: 'Manrope, sans-serif',
                    cursor: isExporting ? 'not-allowed' : 'pointer',
                    transition: '0.2s',
                    border: 'none',
                    opacity: isExporting ? 0.7 : 1
                }}
                onMouseOver={(e) => !isExporting && (e.currentTarget.style.background = '#333333')}
                onMouseOut={(e) => !isExporting && (e.currentTarget.style.background = '#111111')}
            >
                {isExporting ? 'Gerando PDF...' : '↓ Exportar PDF'}
            </button>

            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                <div ref={pdfRef}>
                    <PDFLayout {...props} clockScreenshot={clockScreenshot} />
                </div>
            </div>
        </>
    );
};
