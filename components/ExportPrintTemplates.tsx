import React from 'react';
import { CelestialData } from '../hooks/useCelestialData';
import { Aspect } from '../lib/astrology/aspects';
import { ZODIAC_DATA } from './zodiac';
import { ZODIAC_ICONS, CELESTIAL_GLYPHS } from './icons';
import { normalizeAngle } from '../lib/astrology/utils';
import { getDecanDetails, getTermDetails, calculateBodyVelocity } from './ExportPDFButton';

interface PrintTemplateProps {
    currentTime?: Date;
    location?: { displayName: string; latitude?: number; longitude?: number };
    celestialData?: CelestialData;
    seasonInfo?: { name: string; icon?: any; color?: string; day: number };
    sunriseTime?: string;
    sunsetTime?: string;
    moonriseTime?: string;
    moonsetTime?: string;
    moonPhase?: { name: string; icon?: any };
    moonPhaseValue?: number;
    retrogradeStatus?: Record<string, boolean>;
    stationaryStatus?: Record<string, boolean>;
    housePlacements?: Record<string, number>;
    houseCusps?: number[];
    filteredAspects?: Aspect[];
    clockScreenshot?: string;
    themeMode?: 'light' | 'dark';
}

const SIGN_ELEMENT_COLORS: Record<string, string> = {
    'Áries': '#D97706', 'Leão': '#D97706', 'Sagitário': '#D97706',
    'Touro': '#059669', 'Virgem': '#059669', 'Capricórnio': '#059669',
    'Gêmeos': '#475569', 'Libra': '#475569', 'Aquário': '#475569',
    'Câncer': '#0891B2', 'Escorpião': '#0891B2', 'Peixes': '#0891B2'
};

const PLANET_SYMBOLS: Record<string, string> = {
    sun: '☉', moon: '☽', mercury: '☿', venus: '♀', mars: '♂',
    jupiter: '♃', saturn: '♄', uranus: '⛢', neptune: '♆', pluto: '♇',
    northNode: '☊', southNode: '☋', lilith: '⚸', partOfFortune: '⊗',
    chiron: '⚷', ceres: '⚳', pallas: '⚴', juno: '⚵', vesta: '⚶',
    ascendant: 'ASC', midheaven: 'MC', descendant: 'DC', imumCoeli: 'IC'
};

const PLANET_NAMES_FULL: Record<string, string> = {
    sun: 'Sol', moon: 'Lua', mercury: 'Mercúrio', venus: 'Vênus', mars: 'Marte',
    jupiter: 'Júpiter', saturn: 'Saturno', uranus: 'Urano', neptune: 'Netuno', pluto: 'Plutão',
    northNode: 'Nodo Norte', southNode: 'Nodo Sul', lilith: 'Lilith', partOfFortune: 'Parte da Fortuna',
    chiron: 'Quíron', ceres: 'Ceres', pallas: 'Palas Atena', juno: 'Juno', vesta: 'Vesta',
    ascendant: 'Ascendente', midheaven: 'Meio do Céu', descendant: 'Descendente', imumCoeli: 'Fundo do Céu'
};

const RULER_GLYPHS: Record<string, string> = {
    'Sol': '☉', 'Lua': '☽', 'Mercúrio': '☿', 'Vênus': '♀', 'Marte': '♂',
    'Júpiter': '♃', 'Saturno': '♄', 'Urano': '⛢', 'Netuno': '♆', 'Plutão': '♇',
    'sun': '☉', 'moon': '☽', 'mercury': '☿', 'venus': '♀', 'mars': '♂',
    'jupiter': '♃', 'saturn': '♄', 'uranus': '⛢', 'neptune': '♆', 'pluto': '♇'
};

const sphereGlyphColors: Record<string, string> = {
    sun: '#422006', moon: '#1e293b', mercury: '#1e293b', venus: '#4c0519',
    mars: '#ffffff', jupiter: '#ffffff', saturn: '#422006', uranus: '#0e7490',
    neptune: '#ffffff', pluto: '#ffffff', northNode: '#0f766e', southNode: '#ffffff',
    lilith: '#e879f9', chiron: '#064e3b', ceres: '#3f6212', pallas: '#1e3a8a',
    juno: '#831843', vesta: '#7c2d12', partOfFortune: '#ffffff'
};

const ExportDefs: React.FC = () => (
    <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }} aria-hidden="true">
        <defs>
            <filter id="exp-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <radialGradient id="exp-grad-sun" cx="35%" cy="35%" r="65%"><stop offset="0%" stopColor="#FFFACD" /><stop offset="40%" stopColor="#FFD700" /><stop offset="100%" stopColor="#FF8C00" /></radialGradient>
            <radialGradient id="exp-grad-moon" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#F5F5F5" /><stop offset="50%" stopColor="#D3D3D3" /><stop offset="100%" stopColor="#808080" /></radialGradient>
            <radialGradient id="exp-grad-mercury" cx="40%" cy="40%" r="60%"><stop offset="0%" stopColor="#E0E0E0" /><stop offset="60%" stopColor="#A9A9A9" /><stop offset="100%" stopColor="#757575" /></radialGradient>
            <radialGradient id="exp-grad-venus" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#E9D5FF" /><stop offset="50%" stopColor="#C084FC" /><stop offset="100%" stopColor="#9333EA" /></radialGradient>
            <radialGradient id="exp-grad-mars" cx="35%" cy="35%" r="65%"><stop offset="0%" stopColor="#FF7F50" /><stop offset="60%" stopColor="#CD5C5C" /><stop offset="100%" stopColor="#8B0000" /></radialGradient>
            <linearGradient id="exp-grad-jupiter-stripes" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FFF8DC" /><stop offset="20%" stopColor="#CD853F" /><stop offset="40%" stopColor="#FFF8DC" /><stop offset="60%" stopColor="#D2691E" /><stop offset="80%" stopColor="#FFF8DC" /><stop offset="100%" stopColor="#CD853F" /></linearGradient>
            <radialGradient id="exp-grad-jupiter-overlay" cx="35%" cy="35%" r="70%"><stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4"/><stop offset="100%" stopColor="#000000" stopOpacity="0.2"/></radialGradient>
            <radialGradient id="exp-grad-saturn" cx="40%" cy="30%" r="70%"><stop offset="0%" stopColor="#F0E68C" /><stop offset="100%" stopColor="#DAA520" /></radialGradient>
            <radialGradient id="exp-grad-uranus" cx="35%" cy="35%" r="65%"><stop offset="0%" stopColor="#AFEEEE" /><stop offset="100%" stopColor="#00CED1" /></radialGradient>
            <radialGradient id="exp-grad-neptune" cx="35%" cy="35%" r="65%"><stop offset="0%" stopColor="#4169E1" /><stop offset="100%" stopColor="#00008B" /></radialGradient>
            <radialGradient id="exp-grad-pluto" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#8B0000" /><stop offset="50%" stopColor="#708090" /><stop offset="100%" stopColor="#2F4F4F" /></radialGradient>
            <radialGradient id="exp-grad-northNode" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#E0FFFF" /><stop offset="100%" stopColor="#00CED1" /></radialGradient>
            <radialGradient id="exp-grad-southNode" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#D2691E" /><stop offset="100%" stopColor="#8B4513" /></radialGradient>
            <radialGradient id="exp-grad-lilith" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#4B0082" /><stop offset="60%" stopColor="#000000" /><stop offset="100%" stopColor="#2e022e" /></radialGradient>
            <radialGradient id="exp-grad-chiron" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#90EE90" /><stop offset="100%" stopColor="#2E8B57" /></radialGradient>
            <radialGradient id="exp-grad-ceres" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#FFD700" /><stop offset="100%" stopColor="#556B2F" /></radialGradient>
            <radialGradient id="exp-grad-pallas" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#F0F8FF" /><stop offset="100%" stopColor="#4682B4" /></radialGradient>
            <radialGradient id="exp-grad-juno" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#FFB6C1" /><stop offset="100%" stopColor="#C71585" /></radialGradient>
            <radialGradient id="exp-grad-vesta" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#FFA500" /><stop offset="100%" stopColor="#FF4500" /></radialGradient>
            <radialGradient id="exp-grad-partOfFortune" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#FDE047" /><stop offset="100%" stopColor="#D97706" /></radialGradient>
        </defs>
    </svg>
);

const ExportPlanetSphere: React.FC<{ id: string; size?: number }> = ({ id, size = 20 }) => {
    const radius = size / 2;
    const glyphSize = size * 0.58;
    const glyphColor = sphereGlyphColors[id] || '#ffffff';
    const glyph = CELESTIAL_GLYPHS[id] || PLANET_SYMBOLS[id] || '•';

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible', display: 'inline-block', verticalAlign: 'middle' }}>
            <g>
                {id === 'saturn' && (
                    <ellipse cx={radius} cy={radius} rx={radius * 1.35} ry={radius * 0.42} fill="none" stroke="#D2B48C" strokeWidth={size * 0.15} transform={`rotate(-25, ${radius}, ${radius})`} opacity="0.85"/>
                )}
                {id === 'uranus' && (
                    <ellipse cx={radius} cy={radius} rx={radius * 0.5} ry={radius * 1.35} fill="none" stroke="#A0F0FF" strokeWidth={size * 0.08} opacity="0.85"/>
                )}
                <circle cx={radius} cy={radius} r={radius} fill={`url(#exp-grad-${id})`} filter={id === 'sun' ? "url(#exp-glow)" : undefined} />
                {id === 'jupiter' && (
                    <>
                        <circle cx={radius} cy={radius} r={radius} fill="url(#exp-grad-jupiter-stripes)" fillOpacity="0.6" transform={`rotate(45, ${radius}, ${radius})`} />
                        <circle cx={radius} cy={radius} r={radius} fill="url(#exp-grad-jupiter-overlay)" />
                    </>
                )}
                <text
                    x="50%" y="50%"
                    dy="0.36em"
                    textAnchor="middle"
                    fill={glyphColor}
                    fontSize={glyphSize}
                    style={{
                        fontFamily: '"Noto Sans Symbols", "Segoe UI Symbol", sans-serif',
                        fontWeight: 'bold',
                        filter: glyphColor === '#ffffff' ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.85))' : 'drop-shadow(0 1px 0px rgba(255,255,255,0.3))'
                    }}
                >
                    {glyph}
                </text>
            </g>
        </svg>
    );
};

const PLANET_HEX_COLORS: Record<string, string> = {
    sun: '#F59E0B',
    moon: '#CBD5E1',
    mercury: '#A855F7',
    venus: '#10B981',
    mars: '#EF4444',
    jupiter: '#EC4899',
    saturn: '#F97316',
    uranus: '#06B6D4',
    neptune: '#3B82F6',
    pluto: '#8B5CF6',
    northNode: '#6366F1',
    southNode: '#6366F1',
    chiron: '#14B8A6'
};

const ASPECT_ABBREV: Record<string, string> = {
    conjunction: 'CON', opposition: 'OPO', trine: 'TRI', sextile: 'SXT', square: 'QUA'
};

const ASPECT_SYMBOLS: Record<string, string> = {
    conjunction: '☌', opposition: '☍', trine: '△', sextile: '⚹', square: '□'
};

const ASPECT_COLORS: Record<string, string> = {
    conjunction: '#9333ea', opposition: '#dc2626', trine: '#16a34a', square: '#ea580c', sextile: '#2563eb'
};

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const HOUSE_ORDER_SEQ = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const formatDeg = (lon: number) => {
    const norm = normalizeAngle(lon);
    const d = Math.floor(norm % 30);
    const m = Math.floor((norm % 1) * 60);
    return `${d.toString().padStart(2, '0')}°${m.toString().padStart(2, '0')}'`;
};

// ==========================================
// 1. TEMPLATE VERTICAL COM DADOS EM DESTAQUE
// (Cronógrafo compacto no canto superior da folha;
// dados em tabelas têm maior relevância e ocupam o corpo com diagramação lapidada)
// ==========================================
export const VerticalDataTemplate: React.FC<PrintTemplateProps> = (props) => {
    const isLight = props.themeMode === 'light';
    const bg = isLight ? '#ffffff' : '#06060a';
    const textPrimary = isLight ? '#0f172a' : '#f8fafc';
    const textSecondary = isLight ? '#475569' : '#94a3b8';
    const borderCol = isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.12)';
    const tableHeaderBg = isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.07)';
    const cardBg = isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)';
    const rowAltBg = isLight ? '#fafafa' : 'rgba(255, 255, 255, 0.02)';

    const now = props.currentTime || new Date();
    const illumination = Math.round((1 - Math.cos(2 * Math.PI * (props.moonPhaseValue ?? 0))) / 2 * 100);
    const dateFormatted = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeFormatted = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const weekday = now.toLocaleDateString('pt-BR', { weekday: 'long' });

    // Estatísticas Elementais e Distribuição dos Planetas por Elemento
    const PLANETS_STATS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
    const stats = { fire: 0, earth: 0, air: 0, water: 0, cardinal: 0, fixed: 0, mutable: 0, masculine: 0, feminine: 0 };
    const elementPlanets: Record<'fire' | 'earth' | 'air' | 'water', Array<{ id: string; name: string; symbol: string }>> = {
        fire: [],
        earth: [],
        air: [],
        water: []
    };

    if (props.celestialData) {
        PLANETS_STATS.forEach(id => {
            const lon = props.celestialData?.[`${id}EclipticLongitude` as keyof CelestialData] as number;
            if (typeof lon === 'number' && !isNaN(lon)) {
                const sign = ZODIAC_DATA[Math.floor(lon / 30)];
                if (sign) {
                    const elem = sign.element as 'fire' | 'earth' | 'air' | 'water';
                    if (stats[elem] !== undefined) {
                        stats[elem]++;
                    }
                    stats[sign.modality as keyof typeof stats]++;
                    stats[sign.polarity as keyof typeof stats]++;
                    if (elementPlanets[elem]) {
                        elementPlanets[elem].push({
                            id,
                            name: PLANET_NAMES_FULL[id] || id,
                            symbol: PLANET_SYMBOLS[id] || ''
                        });
                    }
                }
            }
        });
    }

    const ascLon = props.celestialData?.ascendant || props.houseCusps?.[0] || 0;
    const mcLon = props.celestialData?.midheaven || props.houseCusps?.[9] || 0;
    const dscLon = props.celestialData?.descendant || props.houseCusps?.[6] || normalizeAngle(ascLon + 180);
    const icLon = props.celestialData?.imumCoeli || props.houseCusps?.[3] || normalizeAngle(mcLon + 180);

    const ascSign = ZODIAC_DATA[Math.floor(ascLon / 30)] || ZODIAC_DATA[0];
    const mcSign = ZODIAC_DATA[Math.floor(mcLon / 30)] || ZODIAC_DATA[0];
    const dscSign = ZODIAC_DATA[Math.floor(dscLon / 30)] || ZODIAC_DATA[0];
    const icSign = ZODIAC_DATA[Math.floor(icLon / 30)] || ZODIAC_DATA[0];

    // Lista principal de corpos
    const BODIES = [
        { id: 'sun', name: 'Sol', symbol: '☉', key: 'sunEclipticLongitude' },
        { id: 'moon', name: 'Lua', symbol: '☽', key: 'moonEclipticLongitude' },
        { id: 'mercury', name: 'Mercúrio', symbol: '☿', key: 'mercuryEclipticLongitude' },
        { id: 'venus', name: 'Vênus', symbol: '♀', key: 'venusEclipticLongitude' },
        { id: 'mars', name: 'Marte', symbol: '♂', key: 'marsEclipticLongitude' },
        { id: 'jupiter', name: 'Júpiter', symbol: '♃', key: 'jupiterEclipticLongitude' },
        { id: 'saturn', name: 'Saturno', symbol: '♄', key: 'saturnEclipticLongitude' },
        { id: 'uranus', name: 'Urano', symbol: '⛢', key: 'uranusEclipticLongitude' },
        { id: 'neptune', name: 'Netuno', symbol: '♆', key: 'neptuneEclipticLongitude' },
        { id: 'pluto', name: 'Plutão', symbol: '♇', key: 'plutoEclipticLongitude' },
        { id: 'northNode', name: 'Nodo Norte', symbol: '☊', key: 'northNodeEclipticLongitude' },
        { id: 'southNode', name: 'Nodo Sul', symbol: '☋', key: 'southNodeEclipticLongitude' },
        { id: 'lilith', name: 'Lilith', symbol: '⚸', key: 'lilithEclipticLongitude' },
        { id: 'chiron', name: 'Quíron', symbol: '⚷', key: 'chironEclipticLongitude' },
        { id: 'partOfFortune', name: 'Fortuna', symbol: '⊗', key: 'partOfFortuneEclipticLongitude' },
    ];

    // Mapeamento de corpos nas casas
    const houseBodies: Record<number, string[]> = {};
    for (let h = 1; h <= 12; h++) houseBodies[h] = [];
    if (props.celestialData) {
        BODIES.forEach(b => {
            const lon = props.celestialData?.[b.key as keyof CelestialData] as number;
            if (typeof lon === 'number' && !isNaN(lon)) {
                const h = props.housePlacements?.[b.id] || 1;
                if (h >= 1 && h <= 12) {
                    houseBodies[h].push(`${b.symbol} ${b.name}`);
                }
            }
        });
    }

    const sortedAspects = [...(props.filteredAspects || [])].sort((a, b) => a.orb - b.orb);

    return (
        <div style={{
            width: '1200px',
            minWidth: '1200px',
            maxWidth: '1200px',
            height: '1697px',
            minHeight: '1697px',
            maxHeight: '1697px',
            background: bg,
            color: textPrimary,
            padding: '42px 48px',
            boxSizing: 'border-box',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Defs para gradientes das esferas planetárias */}
            <ExportDefs />

            {/* Topo: Cabeçalho com Informações Gerais & Cronógrafo no Canto Superior Direito */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 310px',
                gap: '28px',
                alignItems: 'center',
                paddingBottom: '20px',
                borderBottom: `2px solid ${borderCol}`
            }}>
                {/* Lado Esquerdo do Topo: Títulos, Chips e Eixos */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                        <div style={{ 
                            fontSize: '32px', 
                            fontWeight: 800, 
                            letterSpacing: '-0.03em', 
                            color: textPrimary,
                            lineHeight: 1.1,
                            fontFamily: 'Georgia, serif'
                        }}>
                            CRONÓGRAFO SIDERAL
                        </div>
                        <div style={{ fontSize: '15px', color: textSecondary, marginTop: '6px', fontWeight: 500 }}>
                            {props.location?.displayName || 'Local'} · <span style={{ textTransform: 'capitalize' }}>{weekday}</span>, {dateFormatted} às {timeFormatted}
                        </div>
                    </div>

                    {/* Chips de Informações da Estação e Fase Lunar */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{ 
                            padding: '7px 14px', 
                            borderRadius: '8px', 
                            background: cardBg, 
                            border: `1px solid ${borderCol}`,
                            fontSize: '13px',
                            fontWeight: 600,
                            color: textSecondary
                        }}>
                            Dia {(props.seasonInfo?.day ?? 1).toString().padStart(2, '0')} do {props.seasonInfo?.name || 'Ano'}
                        </div>
                        <div style={{ 
                            padding: '7px 14px', 
                            borderRadius: '8px', 
                            background: cardBg, 
                            border: `1px solid ${borderCol}`,
                            fontSize: '13px',
                            fontWeight: 600,
                            color: textSecondary
                        }}>
                            {props.moonPhase?.name || 'Fase Lunar'} · {illumination}% iluminada
                        </div>
                        <div style={{ 
                            padding: '7px 14px', 
                            borderRadius: '8px', 
                            background: cardBg, 
                            border: `1px solid ${borderCol}`,
                            fontSize: '13px',
                            fontWeight: 600,
                            color: textSecondary
                        }}>
                            Sol: {props.sunriseTime || '--'} / {props.sunsetTime || '--'}
                        </div>
                    </div>

                    {/* Cards de Eixos Cardinais & Distribuição Elemental */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {/* Eixos */}
                        <div style={{ 
                            padding: '12px 16px', 
                            borderRadius: '10px', 
                            background: cardBg, 
                            border: `1px solid ${borderCol}`,
                            fontSize: '13px'
                        }}>
                            <div style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: textSecondary, marginBottom: '8px', fontSize: '11.5px' }}>
                                Eixos Cardinais
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontWeight: 600 }}>
                                <div><strong style={{ color: '#dc2626' }}>ASC:</strong> {ascSign.name} <span style={{ fontFamily: 'Courier Prime, monospace' }}>{formatDeg(ascLon)}</span></div>
                                <div><strong style={{ color: '#2563eb' }}>MC:</strong> {mcSign.name} <span style={{ fontFamily: 'Courier Prime, monospace' }}>{formatDeg(mcLon)}</span></div>
                                <div><strong style={{ color: '#059669' }}>DSC:</strong> {dscSign.name} <span style={{ fontFamily: 'Courier Prime, monospace' }}>{formatDeg(dscLon)}</span></div>
                                <div><strong style={{ color: '#d97706' }}>IC:</strong> {icSign.name} <span style={{ fontFamily: 'Courier Prime, monospace' }}>{formatDeg(icLon)}</span></div>
                            </div>
                        </div>

                        {/* Elementos & Modalidades */}
                        <div style={{ 
                            padding: '10px 14px', 
                            borderRadius: '10px', 
                            background: cardBg, 
                            border: `1px solid ${borderCol}`,
                            fontSize: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                        }}>
                            <div style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: textSecondary, fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Distribuição Elemental dos Astros</span>
                                <span style={{ fontSize: '10px', fontWeight: 600 }}>10 Planetas</span>
                            </div>

                            {/* 4 Boxes de Elementos */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                                {/* Box Fogo */}
                                <div style={{ 
                                    padding: '6px 7px', 
                                    borderRadius: '8px', 
                                    background: isLight ? 'rgba(217, 119, 6, 0.06)' : 'rgba(217, 119, 6, 0.12)', 
                                    border: `1px solid ${isLight ? 'rgba(217, 119, 6, 0.25)' : 'rgba(217, 119, 6, 0.35)'}`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    minHeight: '46px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px', fontWeight: 700, color: '#D97706' }}>
                                        <span>△ Fogo</span>
                                        <span style={{ fontSize: '10px', opacity: 0.85 }}>({stats.fire})</span>
                                    </div>
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: textPrimary, display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '3px', minHeight: '18px', alignItems: 'center' }}>
                                        {elementPlanets.fire.length > 0 ? (
                                            elementPlanets.fire.map(p => (
                                                <span key={p.id} title={p.name} style={{ display: 'inline-block' }}>{p.symbol}</span>
                                            ))
                                        ) : (
                                            <span style={{ color: textSecondary, fontSize: '11px', fontWeight: 400 }}>—</span>
                                        )}
                                    </div>
                                </div>

                                {/* Box Terra */}
                                <div style={{ 
                                    padding: '6px 7px', 
                                    borderRadius: '8px', 
                                    background: isLight ? 'rgba(5, 150, 105, 0.06)' : 'rgba(5, 150, 105, 0.12)', 
                                    border: `1px solid ${isLight ? 'rgba(5, 150, 105, 0.25)' : 'rgba(5, 150, 105, 0.35)'}`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    minHeight: '46px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px', fontWeight: 700, color: '#059669' }}>
                                        <span>▽ Terra</span>
                                        <span style={{ fontSize: '10px', opacity: 0.85 }}>({stats.earth})</span>
                                    </div>
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: textPrimary, display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '3px', minHeight: '18px', alignItems: 'center' }}>
                                        {elementPlanets.earth.length > 0 ? (
                                            elementPlanets.earth.map(p => (
                                                <span key={p.id} title={p.name} style={{ display: 'inline-block' }}>{p.symbol}</span>
                                            ))
                                        ) : (
                                            <span style={{ color: textSecondary, fontSize: '11px', fontWeight: 400 }}>—</span>
                                        )}
                                    </div>
                                </div>

                                {/* Box Ar */}
                                <div style={{ 
                                    padding: '6px 7px', 
                                    borderRadius: '8px', 
                                    background: isLight ? 'rgba(71, 85, 105, 0.06)' : 'rgba(148, 163, 184, 0.12)', 
                                    border: `1px solid ${isLight ? 'rgba(71, 85, 105, 0.25)' : 'rgba(148, 163, 184, 0.35)'}`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    minHeight: '46px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px', fontWeight: 700, color: isLight ? '#475569' : '#94a3b8' }}>
                                        <span>△ Ar</span>
                                        <span style={{ fontSize: '10px', opacity: 0.85 }}>({stats.air})</span>
                                    </div>
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: textPrimary, display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '3px', minHeight: '18px', alignItems: 'center' }}>
                                        {elementPlanets.air.length > 0 ? (
                                            elementPlanets.air.map(p => (
                                                <span key={p.id} title={p.name} style={{ display: 'inline-block' }}>{p.symbol}</span>
                                            ))
                                        ) : (
                                            <span style={{ color: textSecondary, fontSize: '11px', fontWeight: 400 }}>—</span>
                                        )}
                                    </div>
                                </div>

                                {/* Box Água */}
                                <div style={{ 
                                    padding: '6px 7px', 
                                    borderRadius: '8px', 
                                    background: isLight ? 'rgba(8, 145, 178, 0.06)' : 'rgba(8, 145, 178, 0.12)', 
                                    border: `1px solid ${isLight ? 'rgba(8, 145, 178, 0.25)' : 'rgba(8, 145, 178, 0.35)'}`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    minHeight: '46px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px', fontWeight: 700, color: '#0891B2' }}>
                                        <span>▽ Água</span>
                                        <span style={{ fontSize: '10px', opacity: 0.85 }}>({stats.water})</span>
                                    </div>
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: textPrimary, display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '3px', minHeight: '18px', alignItems: 'center' }}>
                                        {elementPlanets.water.length > 0 ? (
                                            elementPlanets.water.map(p => (
                                                <span key={p.id} title={p.name} style={{ display: 'inline-block' }}>{p.symbol}</span>
                                            ))
                                        ) : (
                                            <span style={{ color: textSecondary, fontSize: '11px', fontWeight: 400 }}>—</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Resumo de Modalidades & Polaridades */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px', borderTop: `1px solid ${borderCol}`, fontSize: '10.5px', color: textSecondary, fontWeight: 500 }}>
                                <span>Card: <strong style={{ color: textPrimary }}>{stats.cardinal}</strong></span>
                                <span>Fixo: <strong style={{ color: textPrimary }}>{stats.fixed}</strong></span>
                                <span>Mut: <strong style={{ color: textPrimary }}>{stats.mutable}</strong></span>
                                <span>♂ <strong style={{ color: textPrimary }}>{stats.masculine}</strong> · ♀ <strong style={{ color: textPrimary }}>{stats.feminine}</strong></span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lado Direito do Topo: CRONÓGRAFO COMPACTO NO CANTO SUPERIOR */}
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: cardBg,
                    border: `1.5px solid ${borderCol}`,
                    borderRadius: '16px',
                    padding: '14px',
                    boxShadow: isLight ? '0 4px 12px rgba(0,0,0,0.04)' : '0 4px 16px rgba(0,0,0,0.4)'
                }}>
                    <div style={{ 
                        width: '250px', 
                        height: '250px', 
                        borderRadius: '50%', 
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isLight ? '#ffffff' : '#05040a',
                        border: `1px solid ${borderCol}`
                    }}>
                        {props.clockScreenshot ? (
                            <img 
                                src={props.clockScreenshot} 
                                alt="Cronógrafo Sideral" 
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                            />
                        ) : (
                            <div style={{ fontSize: '13px', color: textSecondary }}>Mostrador Celeste</div>
                        )}
                    </div>
                    <div style={{ 
                        fontSize: '11px', 
                        fontWeight: 700, 
                        letterSpacing: '0.08em', 
                        textTransform: 'uppercase', 
                        color: textSecondary, 
                        marginTop: '10px' 
                    }}>
                        Mostrador Celeste Topocêntrico
                    </div>
                </div>
            </div>

            {/* CORPO PRINCIPAL: TABELAS COM MAIOR RELEVÂNCIA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, paddingTop: '16px' }}>
                
                {/* 1. TABELA DE LUMINARES E PLANETAS (Tabela Principal) */}
                <div style={{ 
                    borderRadius: '12px', 
                    border: `1px solid ${borderCol}`, 
                    overflow: 'hidden',
                    boxShadow: isLight ? '0 2px 6px rgba(0,0,0,0.02)' : 'none'
                }}>
                    <div style={{ 
                        background: tableHeaderBg, 
                        padding: '10px 18px', 
                        fontSize: '13px', 
                        fontWeight: 700, 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.05em',
                        borderBottom: `1px solid ${borderCol}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span>1. Luminares & Posições Planetárias</span>
                        <span style={{ fontSize: '11.5px', fontWeight: 600, color: textSecondary }}>
                            Zodíaco Tropical / Posições Topocêntricas
                        </span>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${borderCol}`, color: textSecondary, fontSize: '11.5px', textTransform: 'uppercase' }}>
                                <th style={{ padding: '7px 12px', width: '46px', textAlign: 'center' }}>Símb</th>
                                <th style={{ padding: '7px 12px' }}>Astro / Ponto</th>
                                <th style={{ padding: '7px 12px' }}>Signo</th>
                                <th style={{ padding: '7px 12px' }}>Grau Exato</th>
                                <th style={{ padding: '7px 12px', textAlign: 'center' }}>Casa</th>
                                <th style={{ padding: '7px 12px' }}>Decanato</th>
                                <th style={{ padding: '7px 12px' }}>Termo Egípcio</th>
                                <th style={{ padding: '7px 12px', textAlign: 'right' }}>Movimento & Velocidade</th>
                            </tr>
                        </thead>
                        <tbody>
                            {BODIES.map((body, idx) => {
                                const lon = props.celestialData?.[body.key as keyof CelestialData] as number;
                                if (typeof lon !== 'number' || isNaN(lon)) return null;
                                const sign = ZODIAC_DATA[Math.floor(lon / 30)] || ZODIAC_DATA[0];
                                const decan = getDecanDetails(lon);
                                const term = getTermDetails(lon);
                                const vel = calculateBodyVelocity(body.id, props.currentTime || new Date(), props.retrogradeStatus, props.stationaryStatus);
                                const house = props.housePlacements?.[body.id] || 1;
                                const isRetro = vel.movement === 'Retrógrado';
                                const signCol = SIGN_ELEMENT_COLORS[sign.name] || textPrimary;
                                const ZodiacIconComp = ZODIAC_ICONS[sign.id as keyof typeof ZODIAC_ICONS];
                                const termGlyph = RULER_GLYPHS[term.ruler] || '';
                                const decanGlyph = RULER_GLYPHS[decan.ruler] || '';

                                return (
                                    <tr key={body.id} style={{ 
                                        borderBottom: `1px solid ${borderCol}`, 
                                        background: idx % 2 === 1 ? rowAltBg : 'transparent' 
                                    }}>
                                        <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                                            <ExportPlanetSphere id={body.id} size={22} />
                                        </td>
                                        <td style={{ padding: '6px 12px', fontWeight: 600 }}>
                                            {body.name}
                                        </td>
                                        <td style={{ padding: '6px 12px', color: signCol, fontWeight: 700 }}>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                {ZodiacIconComp && (
                                                    <span style={{ width: '15px', height: '15px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: signCol }}>
                                                        <ZodiacIconComp style={{ width: '15px', height: '15px' }} />
                                                    </span>
                                                )}
                                                <span>{sign.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '6px 12px', fontFamily: 'Courier Prime, monospace', fontWeight: 600 }}>
                                            {formatDeg(lon)}
                                        </td>
                                        <td style={{ padding: '6px 12px', textAlign: 'center', fontWeight: 600 }}>
                                            {ROMAN_NUMERALS[house - 1] || house}
                                        </td>
                                        <td style={{ padding: '6px 12px', color: textSecondary }}>
                                            {decan.index}º ({decanGlyph ? `${decanGlyph} ` : ''}{decan.ruler})
                                        </td>
                                        <td style={{ padding: '6px 12px', color: textSecondary, fontWeight: 500 }}>
                                            <span style={{ fontWeight: 700, color: textPrimary, marginRight: '4px' }}>{termGlyph}</span>
                                            <span>{term.ruler} ({term.range})</span>
                                        </td>
                                        <td style={{ padding: '6px 12px', textAlign: 'right' }}>
                                            {isRetro ? (
                                                <span style={{ color: '#dc2626', fontWeight: 700, background: 'rgba(220, 38, 38, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                                                    ℞ Retrógrado
                                                </span>
                                            ) : (
                                                <span style={{ color: textSecondary }}>
                                                    {vel.movement} ({vel.daily.toFixed(2)}°/d)
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* 2. GRADE DE DUAS COLUNAS: CASAS ASTROLÓGICAS E ASPECTOS */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    
                    {/* Coluna Esquerda: Cúspides das 12 Casas */}
                    <div style={{ 
                        borderRadius: '12px', 
                        border: `1px solid ${borderCol}`, 
                        overflow: 'hidden' 
                    }}>
                        <div style={{ 
                            background: tableHeaderBg, 
                            padding: '9px 16px', 
                            fontSize: '12.5px', 
                            fontWeight: 700, 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.05em',
                            borderBottom: `1px solid ${borderCol}`
                        }}>
                            2. Cúspides das 12 Casas (Placidus)
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${borderCol}`, color: textSecondary, fontSize: '11px', textTransform: 'uppercase' }}>
                                    <th style={{ padding: '6px 10px' }}>Casa</th>
                                    <th style={{ padding: '6px 10px' }}>Signo</th>
                                    <th style={{ padding: '6px 10px' }}>Grau Exato</th>
                                    <th style={{ padding: '6px 10px' }}>Regente Dec.</th>
                                    <th style={{ padding: '6px 10px' }}>Planetas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {HOUSE_ORDER_SEQ.map(i => {
                                    const cusp = props.houseCusps?.[i];
                                    if (typeof cusp !== 'number') return null;
                                    const sign = ZODIAC_DATA[Math.floor(cusp / 30)] || ZODIAC_DATA[0];
                                    const decan = getDecanDetails(cusp);
                                    const decanGlyph = RULER_GLYPHS[decan.ruler] || '';
                                    const planets = houseBodies[i + 1] || [];
                                    const isAngle = [0, 3, 6, 9].includes(i);
                                    const signCol = SIGN_ELEMENT_COLORS[sign.name] || textPrimary;
                                    const ZodiacIconComp = ZODIAC_ICONS[sign.id as keyof typeof ZODIAC_ICONS];

                                    return (
                                        <tr key={i} style={{ 
                                            borderBottom: `1px solid ${borderCol}`,
                                            background: isAngle ? (isLight ? '#f1f5f9' : 'rgba(255,255,255,0.05)') : (i % 2 === 1 ? rowAltBg : 'transparent')
                                        }}>
                                            <td style={{ padding: '5px 10px', fontWeight: isAngle ? 800 : 600 }}>
                                                {ROMAN_NUMERALS[i]} {isAngle ? (i === 0 ? '(ASC)' : i === 9 ? '(MC)' : i === 6 ? '(DC)' : '(IC)') : ''}
                                            </td>
                                            <td style={{ padding: '5px 10px', color: signCol, fontWeight: 700 }}>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                                    {ZodiacIconComp && (
                                                        <span style={{ width: '13px', height: '13px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: signCol }}>
                                                            <ZodiacIconComp style={{ width: '13px', height: '13px' }} />
                                                        </span>
                                                    )}
                                                    <span>{sign.name}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '5px 10px', fontFamily: 'Courier Prime, monospace' }}>
                                                {formatDeg(cusp)}
                                            </td>
                                            <td style={{ padding: '5px 10px', color: textSecondary }}>
                                                {decanGlyph ? `${decanGlyph} ` : ''}{decan.ruler}
                                            </td>
                                            <td style={{ padding: '5px 10px', color: textSecondary, fontWeight: 500 }}>
                                                {planets.length > 0 ? planets.map(p => p.split(' ')[0]).join(' ') : '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Coluna Direita: Aspectos Astrológicos Ativos */}
                    <div style={{ 
                        borderRadius: '12px', 
                        border: `1px solid ${borderCol}`, 
                        overflow: 'hidden' 
                    }}>
                        <div style={{ 
                            background: tableHeaderBg, 
                            padding: '9px 14px', 
                            fontSize: '12px', 
                            fontWeight: 700, 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.05em',
                            borderBottom: `1px solid ${borderCol}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span>3. Aspectos Principais</span>
                            <span style={{ fontSize: '10.5px', fontWeight: 600, color: textSecondary }}>
                                Orbe Exata · Posições
                            </span>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${borderCol}`, color: textSecondary, fontSize: '10px', textTransform: 'uppercase' }}>
                                    <th style={{ padding: '6px 4px', textAlign: 'center' }}>C.</th>
                                    <th style={{ padding: '6px 4px', textAlign: 'center' }}>Sig.</th>
                                    <th style={{ padding: '6px 6px' }}>Astro 1</th>
                                    <th style={{ padding: '6px 6px', textAlign: 'center' }}>Aspecto</th>
                                    <th style={{ padding: '6px 6px' }}>Astro 2</th>
                                    <th style={{ padding: '6px 4px', textAlign: 'center' }}>Sig.</th>
                                    <th style={{ padding: '6px 4px', textAlign: 'center' }}>C.</th>
                                    <th style={{ padding: '6px 6px', textAlign: 'right' }}>Orbe</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedAspects.slice(0, 12).map((aspect, idx) => {
                                    const b1Id = aspect.body1.id;
                                    const b2Id = aspect.body2.id;
                                    const s1 = PLANET_SYMBOLS[b1Id] || aspect.body1.symbol || '';
                                    const s2 = PLANET_SYMBOLS[b2Id] || aspect.body2.symbol || '';
                                    const n1 = PLANET_NAMES_FULL[b1Id] || aspect.body1.name || b1Id;
                                    const n2 = PLANET_NAMES_FULL[b2Id] || aspect.body2.name || b2Id;
                                    const aspSym = ASPECT_SYMBOLS[aspect.type] || aspect.symbol || '';
                                    const aspCol = ASPECT_COLORS[aspect.type] || textPrimary;
                                    const aspAbbr = ASPECT_ABBREV[aspect.type] || aspect.type.toUpperCase();

                                    // Dados de Signo e Casa do Astro 1
                                    const lon1 = typeof aspect.body1.longitude === 'number' && !isNaN(aspect.body1.longitude)
                                        ? aspect.body1.longitude
                                        : (props.celestialData?.[`${b1Id}EclipticLongitude` as keyof CelestialData] as number ?? 0);
                                    const signIdx1 = typeof aspect.body1.signIndex === 'number' && aspect.body1.signIndex >= 0
                                        ? aspect.body1.signIndex
                                        : Math.floor(normalizeAngle(lon1) / 30);
                                    const sign1 = ZODIAC_DATA[signIdx1] || ZODIAC_DATA[0];
                                    const house1 = props.housePlacements?.[b1Id] || aspect.body1.house || 1;
                                    const signCol1 = SIGN_ELEMENT_COLORS[sign1.name] || textPrimary;
                                    const ZodiacIconComp1 = ZODIAC_ICONS[sign1.id as keyof typeof ZODIAC_ICONS];

                                    // Dados de Signo e Casa do Astro 2
                                    const lon2 = typeof aspect.body2.longitude === 'number' && !isNaN(aspect.body2.longitude)
                                        ? aspect.body2.longitude
                                        : (props.celestialData?.[`${b2Id}EclipticLongitude` as keyof CelestialData] as number ?? 0);
                                    const signIdx2 = typeof aspect.body2.signIndex === 'number' && aspect.body2.signIndex >= 0
                                        ? aspect.body2.signIndex
                                        : Math.floor(normalizeAngle(lon2) / 30);
                                    const sign2 = ZODIAC_DATA[signIdx2] || ZODIAC_DATA[0];
                                    const house2 = props.housePlacements?.[b2Id] || aspect.body2.house || 1;
                                    const signCol2 = SIGN_ELEMENT_COLORS[sign2.name] || textPrimary;
                                    const ZodiacIconComp2 = ZODIAC_ICONS[sign2.id as keyof typeof ZODIAC_ICONS];

                                    return (
                                        <tr key={idx} style={{ 
                                            borderBottom: `1px solid ${borderCol}`, 
                                            background: idx % 2 === 1 ? rowAltBg : 'transparent' 
                                        }}>
                                            {/* Casa 1 */}
                                            <td style={{ padding: '5px 4px', textAlign: 'center', fontWeight: 600, color: textSecondary }}>
                                                {ROMAN_NUMERALS[house1 - 1] || house1}
                                            </td>
                                            {/* Signo 1 (Ícone SVG) */}
                                            <td style={{ padding: '5px 4px', textAlign: 'center', color: signCol1 }} title={sign1.name}>
                                                {ZodiacIconComp1 ? (
                                                    <span style={{ width: '13px', height: '13px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <ZodiacIconComp1 style={{ width: '13px', height: '13px' }} />
                                                    </span>
                                                ) : (
                                                    <span style={{ fontWeight: 700 }}>{sign1.symbol}</span>
                                                )}
                                            </td>
                                            {/* Astro 1 */}
                                            <td style={{ padding: '5px 6px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                <span style={{ marginRight: '3px' }}>{s1}</span>
                                                <span>{n1}</span>
                                            </td>
                                            {/* Aspecto no Meio (Sem Fundo Colorido) */}
                                            <td style={{ padding: '5px 6px', textAlign: 'center', color: aspCol, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                <span style={{ fontSize: '11px', letterSpacing: '0.02em' }}>
                                                    {aspSym} {aspAbbr}
                                                </span>
                                            </td>
                                            {/* Astro 2 */}
                                            <td style={{ padding: '5px 6px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                <span style={{ marginRight: '3px' }}>{s2}</span>
                                                <span>{n2}</span>
                                            </td>
                                            {/* Signo 2 (Ícone SVG) */}
                                            <td style={{ padding: '5px 4px', textAlign: 'center', color: signCol2 }} title={sign2.name}>
                                                {ZodiacIconComp2 ? (
                                                    <span style={{ width: '13px', height: '13px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <ZodiacIconComp2 style={{ width: '13px', height: '13px' }} />
                                                    </span>
                                                ) : (
                                                    <span style={{ fontWeight: 700 }}>{sign2.symbol}</span>
                                                )}
                                            </td>
                                            {/* Casa 2 */}
                                            <td style={{ padding: '5px 4px', textAlign: 'center', fontWeight: 600, color: textSecondary }}>
                                                {ROMAN_NUMERALS[house2 - 1] || house2}
                                            </td>
                                            {/* Orbe */}
                                            <td style={{ padding: '5px 6px', textAlign: 'right', fontFamily: 'Courier Prime, monospace', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                {aspect.orb.toFixed(2)}°
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 3. PAINEL DE EFEMÉRIDES E RESUMO LOCAL */}
                <div style={{ 
                    padding: '12px 18px', 
                    borderRadius: '10px', 
                    background: cardBg, 
                    border: `1px solid ${borderCol}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px'
                }}>
                    <div>
                        <span style={{ fontWeight: 700, color: textPrimary }}>Efemérides do Dia: </span>
                        <span style={{ color: textSecondary }}>
                            Nascer do Sol: {props.sunriseTime} · Pôr do Sol: {props.sunsetTime} · Nascer da Lua: {props.moonriseTime} · Pôr da Lua: {props.moonsetTime}
                        </span>
                    </div>
                    <div style={{ color: textSecondary, fontSize: '11.5px', fontFamily: 'Courier Prime, monospace' }}>
                        Coordenadas: {props.location?.latitude?.toFixed(4)}°, {props.location?.longitude?.toFixed(4)}°
                    </div>
                </div>
            </div>

            {/* Rodapé da Página */}
            <div style={{ 
                paddingTop: '14px', 
                borderTop: `1px solid ${borderCol}`, 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '11px',
                color: textSecondary,
                fontWeight: 600
            }}>
                <span>CRONÓGRAFO SIDERAL · RELATÓRIO DE EFEMÉRIDES & MECÂNICA CELESTE</span>
                <span>Página 1 de 1 · Gerado em {dateFormatted} {timeFormatted}</span>
            </div>
        </div>
    );
};

// ==========================================
// 2. TEMPLATE HORIZONTAL COM PAINÉIS VIGENTES
// (Formatação widescreen panorâmica idêntica ao modelo de inicialização do aplicativo:
// Lado Esquerdo: Painel Astros + Painel Status
// Centro: Cronógrafo Sideral
// Lado Direito: Calendário Lunar + Painel Aspectos + Painel Casas)
// ==========================================
export const HorizontalDataTemplate: React.FC<PrintTemplateProps> = (props) => {
    const isLight = props.themeMode === 'light';
    const bg = isLight ? '#f8fafc' : '#070510';
    const textPrimary = isLight ? '#0f172a' : '#f8fafc';
    const textSecondary = isLight ? '#64748b' : '#94a3b8';
    const borderCol = isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.12)';
    const cardBg = isLight ? '#ffffff' : 'rgba(15, 12, 29, 0.9)';
    const tableHeaderBg = isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)';
    const rowAltBg = isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.02)';
    const innerCardBg = isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.04)';

    const now = props.currentTime || new Date();
    const phaseVal = props.moonPhaseValue ?? 0;
    const illumination = Math.round((1 - Math.cos(2 * Math.PI * phaseVal)) / 2 * 100);
    const moonAge = Math.max(1, Math.min(29, Math.round(phaseVal * 29.53058867)));
    const dateFormatted = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeFormatted = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const weekday = now.toLocaleDateString('pt-BR', { weekday: 'long' });

    const ascLon = props.celestialData?.ascendant || props.houseCusps?.[0] || 0;
    const mcLon = props.celestialData?.midheaven || props.houseCusps?.[9] || 0;
    const dscLon = normalizeAngle(ascLon + 180);
    const icLon = normalizeAngle(mcLon + 180);

    const ascSign = ZODIAC_DATA[Math.floor(ascLon / 30)] || ZODIAC_DATA[0];
    const mcSign = ZODIAC_DATA[Math.floor(mcLon / 30)] || ZODIAC_DATA[0];
    const dscSign = ZODIAC_DATA[Math.floor(dscLon / 30)] || ZODIAC_DATA[0];
    const icSign = ZODIAC_DATA[Math.floor(icLon / 30)] || ZODIAC_DATA[0];

    const moonLon = props.celestialData?.moonEclipticLongitude ?? 0;
    const moonSign = ZODIAC_DATA[Math.floor(moonLon / 30)] || ZODIAC_DATA[0];

    const PLANETS_STATS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
    const stats = { fire: 0, earth: 0, air: 0, water: 0, cardinal: 0, fixed: 0, mutable: 0, masculine: 0, feminine: 0 };
    const elementPlanets: Record<'fire' | 'earth' | 'air' | 'water', Array<{ id: string; name: string; symbol: string }>> = {
        fire: [],
        earth: [],
        air: [],
        water: []
    };

    if (props.celestialData) {
        PLANETS_STATS.forEach(id => {
            const lon = props.celestialData?.[`${id}EclipticLongitude` as keyof CelestialData] as number;
            if (typeof lon === 'number') {
                const sign = ZODIAC_DATA[Math.floor(lon / 30)];
                if (sign) {
                    stats[sign.element as keyof typeof stats]++;
                    stats[sign.modality as keyof typeof stats]++;
                    if (sign.element === 'fire' || sign.element === 'air') stats.masculine++;
                    else stats.feminine++;
                    
                    const elKey = sign.element as 'fire' | 'earth' | 'air' | 'water';
                    if (elementPlanets[elKey]) {
                        elementPlanets[elKey].push({
                            id,
                            name: PLANET_NAMES_FULL[id] || id,
                            symbol: PLANET_SYMBOLS[id] || '•'
                        });
                    }
                }
            }
        });
    }

    const BODIES = [
        { id: 'sun', name: 'Sol', symbol: '☉', key: 'sunEclipticLongitude' },
        { id: 'moon', name: 'Lua', symbol: '☽', key: 'moonEclipticLongitude' },
        { id: 'mercury', name: 'Mercúrio', symbol: '☿', key: 'mercuryEclipticLongitude' },
        { id: 'venus', name: 'Vênus', symbol: '♀', key: 'venusEclipticLongitude' },
        { id: 'mars', name: 'Marte', symbol: '♂', key: 'marsEclipticLongitude' },
        { id: 'jupiter', name: 'Júpiter', symbol: '♃', key: 'jupiterEclipticLongitude' },
        { id: 'saturn', name: 'Saturno', symbol: '♄', key: 'saturnEclipticLongitude' },
        { id: 'uranus', name: 'Urano', symbol: '⛢', key: 'uranusEclipticLongitude' },
        { id: 'neptune', name: 'Netuno', symbol: '♆', key: 'neptuneEclipticLongitude' },
        { id: 'pluto', name: 'Plutão', symbol: '♇', key: 'plutoEclipticLongitude' },
        { id: 'northNode', name: 'Nodo Norte', symbol: '☊', key: 'northNodeEclipticLongitude' },
        { id: 'chiron', name: 'Quíron', symbol: '⚷', key: 'chironEclipticLongitude' },
    ];

    // Mapeamento dos planetas em cada uma das 12 casas
    const planetsByHouse: Record<number, Array<{ id: string; symbol: string; name: string }>> = {};
    for (let h = 1; h <= 12; h++) planetsByHouse[h] = [];
    BODIES.forEach(b => {
        const h = props.housePlacements?.[b.id];
        if (h && h >= 1 && h <= 12) {
            planetsByHouse[h].push({ id: b.id, symbol: b.symbol, name: b.name });
        }
    });

    const sortedAspects = [...(props.filteredAspects || [])].sort((a, b) => a.orb - b.orb);

    const getHouseAngleBadge = (houseNum: number) => {
        if (houseNum === 1) return 'AC';
        if (houseNum === 4) return 'IC';
        if (houseNum === 7) return 'DC';
        if (houseNum === 10) return 'MC';
        return null;
    };

    return (
        <div style={{
            width: '1697px',
            height: '1200px',
            background: bg,
            color: textPrimary,
            padding: '28px 36px',
            boxSizing: 'border-box',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative'
        }}>
            {/* Defs para gradientes das esferas planetárias */}
            <ExportDefs />

            {/* Topo: Barra de Título Superior e Badges de Contexto */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '14px',
                borderBottom: `2px solid ${borderCol}`
            }}>
                <div>
                    <div style={{ fontSize: '26px', fontWeight: 900, fontFamily: 'Georgia, serif', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span>CRONÓGRAFO SIDERAL</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: isLight ? '#ede9fe' : '#3b0764', color: isLight ? '#6d28d9' : '#c084fc', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Relatório Panorâmico
                        </span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: textSecondary, marginTop: '3px' }}>
                        {props.location?.displayName || 'Local'} · <span style={{ textTransform: 'capitalize' }}>{weekday}</span>, {dateFormatted} às {timeFormatted} · Coordenadas: {props.location?.latitude?.toFixed(4)}°, {props.location?.longitude?.toFixed(4)}°
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ padding: '6px 14px', borderRadius: '8px', background: cardBg, border: `1px solid ${borderCol}`, fontSize: '11px', fontWeight: 600 }}>
                        Dia {props.seasonInfo?.day ?? 1} do {props.seasonInfo?.name || 'Ano'}
                    </div>
                    <div style={{ padding: '6px 14px', borderRadius: '8px', background: cardBg, border: `1px solid ${borderCol}`, fontSize: '11px', fontWeight: 600 }}>
                        {props.moonPhase?.name || 'Fase Lunar'} ({illumination}%)
                    </div>
                    <div style={{ padding: '6px 14px', borderRadius: '8px', background: cardBg, border: `1px solid ${borderCol}`, fontSize: '11px', fontWeight: 600 }}>
                        ASC: {ascSign.name} {formatDeg(ascLon)} · MC: {mcSign.name} {formatDeg(mcLon)}
                    </div>
                </div>
            </div>

            {/* CORPO PANORÂMICO: ESTRUTURA VIGENTE NO APLICATIVO */}
            {/* LADO ESQUERDO (Astros + Status) | CENTRO (Cronógrafo) | LADO DIREITO (Lua + Aspectos + Casas) */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '410px 1fr 410px',
                gap: '24px',
                alignItems: 'stretch',
                flex: 1,
                padding: '16px 0',
                minHeight: 0
            }}>
                {/* ========================================== */}
                {/* 1. LADO ESQUERDO: PAINEL ASTROS + PAINEL STATUS */}
                {/* ========================================== */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
                    {/* A. PAINEL ASTROS */}
                    <div style={{
                        borderRadius: '12px',
                        border: `1px solid ${borderCol}`,
                        background: cardBg,
                        overflow: 'hidden',
                        boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.04)' : '0 4px 16px rgba(0,0,0,0.3)',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{
                            background: tableHeaderBg,
                            padding: '9px 14px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: `1px solid ${borderCol}`
                        }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                🪐 Astros & Luminares
                            </span>
                            <span style={{ fontSize: '10px', color: textSecondary, fontWeight: 600 }}>
                                12 Corpos Celestes
                            </span>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${borderCol}`, background: innerCardBg, color: textSecondary, fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    <th style={{ padding: '4px 8px', textAlign: 'center', width: '24px' }}>Sím</th>
                                    <th style={{ padding: '4px 8px', textAlign: 'left' }}>Astro</th>
                                    <th style={{ padding: '4px 8px', textAlign: 'left' }}>Signo</th>
                                    <th style={{ padding: '4px 8px', textAlign: 'right' }}>Grau</th>
                                    <th style={{ padding: '4px 8px', textAlign: 'center' }}>Casa</th>
                                    <th style={{ padding: '4px 8px', textAlign: 'right' }}>Mov</th>
                                </tr>
                            </thead>
                            <tbody>
                                {BODIES.map((b, i) => {
                                    const lon = props.celestialData?.[b.key as keyof CelestialData] as number;
                                    if (typeof lon !== 'number') return null;
                                    const sign = ZODIAC_DATA[Math.floor(lon / 30)] || ZODIAC_DATA[0];
                                    const house = props.housePlacements?.[b.id] || 1;
                                    const isRetro = props.retrogradeStatus?.[b.id];
                                    const isStat = props.stationaryStatus?.[b.id];
                                    const signCol = SIGN_ELEMENT_COLORS[sign.name] || textPrimary;
                                    const ZodiacIconComp = ZODIAC_ICONS[sign.id as keyof typeof ZODIAC_ICONS];

                                    return (
                                        <tr key={b.id} style={{ borderBottom: `1px solid ${borderCol}`, background: i % 2 === 1 ? rowAltBg : 'transparent' }}>
                                            <td style={{ padding: '3.5px 6px', textAlign: 'center' }}>
                                                <ExportPlanetSphere id={b.id} size={18} />
                                            </td>
                                            <td style={{ padding: '3.5px 6px', fontWeight: 600 }}>{b.name}</td>
                                            <td style={{ padding: '3.5px 6px', color: signCol, fontWeight: 700 }}>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                    {ZodiacIconComp && (
                                                        <span style={{ width: '12px', height: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: signCol }}>
                                                            <ZodiacIconComp style={{ width: '12px', height: '12px' }} />
                                                        </span>
                                                    )}
                                                    <span>{sign.name}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '3.5px 6px', textAlign: 'right', fontFamily: 'Courier Prime, monospace', fontWeight: 600 }}>
                                                {formatDeg(lon)}
                                            </td>
                                            <td style={{ padding: '3.5px 6px', textAlign: 'center', fontWeight: 600, color: textSecondary }}>
                                                C.{ROMAN_NUMERALS[house - 1] || house}
                                            </td>
                                            <td style={{ padding: '3.5px 6px', textAlign: 'right', fontWeight: 700 }}>
                                                {isRetro ? (
                                                    <span style={{ color: '#ef4444' }}>℞</span>
                                                ) : isStat ? (
                                                    <span style={{ color: '#eab308' }}>S</span>
                                                ) : (
                                                    <span style={{ color: textSecondary, opacity: 0.6 }}>D</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* B. PAINEL STATUS (Abaixo do painel Astros) */}
                    <div style={{
                        borderRadius: '12px',
                        border: `1px solid ${borderCol}`,
                        background: cardBg,
                        overflow: 'hidden',
                        boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.04)' : '0 4px 16px rgba(0,0,0,0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1
                    }}>
                        <div style={{
                            background: tableHeaderBg,
                            padding: '9px 14px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: `1px solid ${borderCol}`
                        }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                📊 Status & Efemérides
                            </span>
                            <span style={{ fontSize: '10px', color: textSecondary, fontWeight: 600 }}>
                                Equilíbrio Cósmico
                            </span>
                        </div>

                        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, justifyContent: 'space-between' }}>
                            {/* Card de 4 Boxes de Elementos com Símbolos dos Planetas */}
                            <div>
                                <div style={{ fontSize: '9.5px', fontWeight: 800, textTransform: 'uppercase', color: textSecondary, letterSpacing: '0.06em', marginBottom: '6px' }}>
                                    Distribuição Elemental
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                                    {/* Fogo */}
                                    <div style={{ padding: '6px 8px', borderRadius: '8px', border: '1px solid rgba(217, 119, 6, 0.3)', background: isLight ? '#fffbeb' : 'rgba(217, 119, 6, 0.08)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '10px', fontWeight: 800, color: '#D97706' }}>△ Fogo</span>
                                            <strong style={{ fontSize: '11px', color: '#D97706' }}>{stats.fire}</strong>
                                        </div>
                                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#D97706', minHeight: '16px', display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                                            {elementPlanets.fire.length > 0 ? elementPlanets.fire.map(p => p.symbol).join(' ') : '—'}
                                        </div>
                                    </div>
                                    {/* Terra */}
                                    <div style={{ padding: '6px 8px', borderRadius: '8px', border: '1px solid rgba(5, 150, 105, 0.3)', background: isLight ? '#ecfdf5' : 'rgba(5, 150, 105, 0.08)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '10px', fontWeight: 800, color: '#059669' }}>▽ Terra</span>
                                            <strong style={{ fontSize: '11px', color: '#059669' }}>{stats.earth}</strong>
                                        </div>
                                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#059669', minHeight: '16px', display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                                            {elementPlanets.earth.length > 0 ? elementPlanets.earth.map(p => p.symbol).join(' ') : '—'}
                                        </div>
                                    </div>
                                    {/* Ar */}
                                    <div style={{ padding: '6px 8px', borderRadius: '8px', border: '1px solid rgba(71, 85, 105, 0.3)', background: isLight ? '#f8fafc' : 'rgba(148, 163, 184, 0.08)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '10px', fontWeight: 800, color: textSecondary }}>△ Ar</span>
                                            <strong style={{ fontSize: '11px', color: textPrimary }}>{stats.air}</strong>
                                        </div>
                                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: textPrimary, minHeight: '16px', display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                                            {elementPlanets.air.length > 0 ? elementPlanets.air.map(p => p.symbol).join(' ') : '—'}
                                        </div>
                                    </div>
                                    {/* Água */}
                                    <div style={{ padding: '6px 8px', borderRadius: '8px', border: '1px solid rgba(8, 145, 178, 0.3)', background: isLight ? '#ecfeff' : 'rgba(8, 145, 178, 0.08)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '10px', fontWeight: 800, color: '#0891B2' }}>▽ Água</span>
                                            <strong style={{ fontSize: '11px', color: '#0891B2' }}>{stats.water}</strong>
                                        </div>
                                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0891B2', minHeight: '16px', display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                                            {elementPlanets.water.length > 0 ? elementPlanets.water.map(p => p.symbol).join(' ') : '—'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modalidades & Polaridades */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '6px 10px', borderRadius: '8px', background: innerCardBg, fontSize: '10px' }}>
                                <div>
                                    <div style={{ fontWeight: 700, color: textSecondary, marginBottom: '2px', textTransform: 'uppercase', fontSize: '9px' }}>Modalidades</div>
                                    <div style={{ display: 'flex', gap: '8px', fontWeight: 600 }}>
                                        <span>Card: <strong>{stats.cardinal}</strong></span>
                                        <span>Fixo: <strong>{stats.fixed}</strong></span>
                                        <span>Mut: <strong>{stats.mutable}</strong></span>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, color: textSecondary, marginBottom: '2px', textTransform: 'uppercase', fontSize: '9px' }}>Polaridades</div>
                                    <div style={{ display: 'flex', gap: '8px', fontWeight: 600 }}>
                                        <span style={{ color: '#ef4444' }}>♂ Masc: <strong>{stats.masculine}</strong></span>
                                        <span style={{ color: '#3b82f6' }}>♀ Fem: <strong>{stats.feminine}</strong></span>
                                    </div>
                                </div>
                            </div>

                            {/* Efemérides Solares & Lunares */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10.5px' }}>
                                <div style={{ padding: '6px 8px', borderRadius: '8px', background: innerCardBg, border: `1px solid ${borderCol}` }}>
                                    <div style={{ fontWeight: 700, fontSize: '9px', textTransform: 'uppercase', color: '#eab308', marginBottom: '3px' }}>
                                        ☉ Ciclo Solar
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                                        <span>Nascer:</span>
                                        <strong style={{ fontFamily: 'Courier Prime, monospace' }}>{props.sunriseTime || '--:--'}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                                        <span>Pôr:</span>
                                        <strong style={{ fontFamily: 'Courier Prime, monospace' }}>{props.sunsetTime || '--:--'}</strong>
                                    </div>
                                </div>
                                <div style={{ padding: '6px 8px', borderRadius: '8px', background: innerCardBg, border: `1px solid ${borderCol}` }}>
                                    <div style={{ fontWeight: 700, fontSize: '9px', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '3px' }}>
                                        ☽ Ciclo Lunar
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                                        <span>Nascer:</span>
                                        <strong style={{ fontFamily: 'Courier Prime, monospace' }}>{props.moonriseTime || '--:--'}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                                        <span>Pôr:</span>
                                        <strong style={{ fontFamily: 'Courier Prime, monospace' }}>{props.moonsetTime || '--:--'}</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Eixos Cardinais */}
                            <div style={{ padding: '6px 10px', borderRadius: '8px', background: innerCardBg, border: `1px solid ${borderCol}`, fontSize: '10px' }}>
                                <div style={{ fontWeight: 700, fontSize: '9px', textTransform: 'uppercase', color: textSecondary, marginBottom: '4px' }}>
                                    Eixos Cardinais (Ângulos Principais)
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px', fontWeight: 600 }}>
                                    <div>ASC: <span style={{ color: SIGN_ELEMENT_COLORS[ascSign.name] || textPrimary }}>{ascSign.name}</span> <span style={{ fontFamily: 'Courier Prime, monospace' }}>{formatDeg(ascLon)}</span></div>
                                    <div>MC: <span style={{ color: SIGN_ELEMENT_COLORS[mcSign.name] || textPrimary }}>{mcSign.name}</span> <span style={{ fontFamily: 'Courier Prime, monospace' }}>{formatDeg(mcLon)}</span></div>
                                    <div>DSC: <span style={{ color: SIGN_ELEMENT_COLORS[dscSign.name] || textPrimary }}>{dscSign.name}</span> <span style={{ fontFamily: 'Courier Prime, monospace' }}>{formatDeg(dscLon)}</span></div>
                                    <div>IC: <span style={{ color: SIGN_ELEMENT_COLORS[icSign.name] || textPrimary }}>{icSign.name}</span> <span style={{ fontFamily: 'Courier Prime, monospace' }}>{formatDeg(icLon)}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ========================================== */}
                {/* 2. CENTRO: CRONÓGRAFO CELESTE SIDERAL */}
                {/* ========================================== */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    position: 'relative',
                    padding: '0 10px'
                }}>
                    <div style={{
                        width: '710px',
                        height: '710px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isLight ? '#ffffff' : '#05040a',
                        border: `3px solid ${borderCol}`,
                        boxShadow: isLight 
                            ? '0 12px 36px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)' 
                            : '0 16px 50px rgba(0,0,0,0.7), 0 0 40px rgba(99, 102, 241, 0.15)',
                        position: 'relative'
                    }}>
                        {props.clockScreenshot ? (
                            <img 
                                src={props.clockScreenshot} 
                                alt="Cronógrafo Sideral" 
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                            />
                        ) : (
                            <div style={{ fontSize: '15px', color: textSecondary, fontWeight: 600, textAlign: 'center' }}>
                                Mostrador Celeste Central
                            </div>
                        )}
                    </div>
                    <div style={{ marginTop: '12px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: textSecondary, textAlign: 'center' }}>
                        Cronógrafo Celeste Sideral · Tempo Real
                    </div>
                </div>

                {/* ========================================== */}
                {/* 3. LADO DIREITO: CALENDÁRIO LUNAR + ASPECTOS + CASAS */}
                {/* ========================================== */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
                    {/* A. CARD CALENDÁRIO LUNAR */}
                    <div style={{
                        borderRadius: '12px',
                        border: `1px solid ${borderCol}`,
                        background: cardBg,
                        padding: '10px 14px',
                        boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.04)' : '0 4px 16px rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                background: isLight ? '#f1f5f9' : '#1e1b4b',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px'
                            }}>
                                ☽
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    {props.moonPhase?.name || 'Fase Lunar'}
                                </div>
                                <div style={{ fontSize: '10px', color: textSecondary, marginTop: '1px' }}>
                                    Iluminação: <strong>{illumination}%</strong> · Idade: <strong>Dia {moonAge}</strong> de 29.5
                                </div>
                            </div>
                        </div>

                        <div style={{ textAlign: 'right', fontSize: '10.5px' }}>
                            <div style={{ fontWeight: 700, color: SIGN_ELEMENT_COLORS[moonSign.name] || textPrimary }}>
                                {moonSign.symbol} Lua em {moonSign.name}
                            </div>
                            <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: '10px', color: textSecondary }}>
                                {formatDeg(moonLon)}
                            </div>
                        </div>
                    </div>

                    {/* B. PAINEL ASPECTOS */}
                    <div style={{
                        borderRadius: '12px',
                        border: `1px solid ${borderCol}`,
                        background: cardBg,
                        overflow: 'hidden',
                        boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.04)' : '0 4px 16px rgba(0,0,0,0.3)',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{
                            background: tableHeaderBg,
                            padding: '9px 14px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: `1px solid ${borderCol}`
                        }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                📐 Aspectos Principais
                            </span>
                            <span style={{ fontSize: '10px', color: textSecondary, fontWeight: 600 }}>
                                {sortedAspects.length} Configurações Ativas
                            </span>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${borderCol}`, background: innerCardBg, color: textSecondary, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    <th style={{ padding: '4px 6px', textAlign: 'center', width: '22px' }}>C.</th>
                                    <th style={{ padding: '4px 6px', textAlign: 'center', width: '22px' }}>Sig</th>
                                    <th style={{ padding: '4px 8px', textAlign: 'left' }}>Astro 1</th>
                                    <th style={{ padding: '4px 6px', textAlign: 'center' }}>Aspecto</th>
                                    <th style={{ padding: '4px 8px', textAlign: 'left' }}>Astro 2</th>
                                    <th style={{ padding: '4px 6px', textAlign: 'center', width: '22px' }}>Sig</th>
                                    <th style={{ padding: '4px 6px', textAlign: 'center', width: '22px' }}>C.</th>
                                    <th style={{ padding: '4px 8px', textAlign: 'right' }}>Orbe</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedAspects.slice(0, 6).map((asp, i) => {
                                    const s1 = PLANET_SYMBOLS[asp.body1.id] || '';
                                    const s2 = PLANET_SYMBOLS[asp.body2.id] || '';
                                    const n1 = PLANET_NAMES_FULL[asp.body1.id] || asp.body1.id;
                                    const n2 = PLANET_NAMES_FULL[asp.body2.id] || asp.body2.id;
                                    const aspCol = ASPECT_COLORS[asp.type] || textPrimary;
                                    const aspSym = ASPECT_SYMBOLS[asp.type] || '';
                                    const aspName = ASPECT_ABBREV[asp.type] || asp.type;

                                    const h1 = props.housePlacements?.[asp.body1.id];
                                    const h2 = props.housePlacements?.[asp.body2.id];

                                    const lon1 = props.celestialData?.[`${asp.body1.id}EclipticLongitude` as keyof CelestialData] as number;
                                    const lon2 = props.celestialData?.[`${asp.body2.id}EclipticLongitude` as keyof CelestialData] as number;
                                    const sig1 = lon1 !== undefined ? (ZODIAC_DATA[Math.floor(normalizeAngle(lon1) / 30)] || ZODIAC_DATA[0]) : null;
                                    const sig2 = lon2 !== undefined ? (ZODIAC_DATA[Math.floor(normalizeAngle(lon2) / 30)] || ZODIAC_DATA[0]) : null;
                                    const ZodiacIconComp1 = sig1 ? ZODIAC_ICONS[sig1.id as keyof typeof ZODIAC_ICONS] : null;
                                    const ZodiacIconComp2 = sig2 ? ZODIAC_ICONS[sig2.id as keyof typeof ZODIAC_ICONS] : null;

                                    return (
                                        <tr key={i} style={{ borderBottom: `1px solid ${borderCol}`, background: i % 2 === 1 ? rowAltBg : 'transparent' }}>
                                            <td style={{ padding: '4.5px 6px', textAlign: 'center', color: textSecondary, fontWeight: 600 }}>
                                                {h1 ? `C${h1}` : '—'}
                                            </td>
                                            <td style={{ padding: '4.5px 6px', textAlign: 'center', color: sig1 ? (SIGN_ELEMENT_COLORS[sig1.name] || textPrimary) : textPrimary }}>
                                                {ZodiacIconComp1 ? (
                                                    <span style={{ width: '12px', height: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <ZodiacIconComp1 style={{ width: '12px', height: '12px' }} />
                                                    </span>
                                                ) : (
                                                    <span style={{ fontWeight: 'bold' }}>{sig1?.symbol || '—'}</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '4.5px 8px', fontWeight: 600 }}>
                                                <span style={{ color: PLANET_HEX_COLORS[asp.body1.id] || textPrimary, marginRight: '4px' }}>{s1}</span>
                                                {n1.split(' ')[0]}
                                            </td>
                                            <td style={{ padding: '4.5px 6px', textAlign: 'center', fontWeight: 700, color: aspCol }}>
                                                <span style={{ fontSize: '11px', marginRight: '3px' }}>{aspSym}</span>
                                                <span style={{ fontSize: '8.5px' }}>{aspName}</span>
                                            </td>
                                            <td style={{ padding: '4.5px 8px', fontWeight: 600 }}>
                                                <span style={{ color: PLANET_HEX_COLORS[asp.body2.id] || textPrimary, marginRight: '4px' }}>{s2}</span>
                                                {n2.split(' ')[0]}
                                            </td>
                                            <td style={{ padding: '4.5px 6px', textAlign: 'center', color: sig2 ? (SIGN_ELEMENT_COLORS[sig2.name] || textPrimary) : textPrimary }}>
                                                {ZodiacIconComp2 ? (
                                                    <span style={{ width: '12px', height: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <ZodiacIconComp2 style={{ width: '12px', height: '12px' }} />
                                                    </span>
                                                ) : (
                                                    <span style={{ fontWeight: 'bold' }}>{sig2?.symbol || '—'}</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '4.5px 6px', textAlign: 'center', color: textSecondary, fontWeight: 600 }}>
                                                {h2 ? `C${h2}` : '—'}
                                            </td>
                                            <td style={{ padding: '4.5px 8px', textAlign: 'right', fontFamily: 'Courier Prime, monospace', fontWeight: 600 }}>
                                                {asp.orb.toFixed(2)}°
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* C. PAINEL CASAS (12 CASAS ORGANIZADAS EM 2 COLUNAS) */}
                    <div style={{
                        borderRadius: '12px',
                        border: `1px solid ${borderCol}`,
                        background: cardBg,
                        overflow: 'hidden',
                        boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.04)' : '0 4px 16px rgba(0,0,0,0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1
                    }}>
                        <div style={{
                            background: tableHeaderBg,
                            padding: '9px 14px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: `1px solid ${borderCol}`
                        }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                🏛️ Cúspides das Casas (I - XII)
                            </span>
                            <span style={{ fontSize: '10px', color: textSecondary, fontWeight: 600 }}>
                                Sistema Sideral
                            </span>
                        </div>

                        <div style={{ padding: '8px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', flex: 1 }}>
                            {/* Coluna 1: Casas I a VI */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                {[0, 1, 2, 3, 4, 5].map(idx => {
                                    const houseNum = idx + 1;
                                    const angleBadge = getHouseAngleBadge(houseNum);
                                    const cuspLon = props.houseCusps?.[idx] ?? (ascLon + idx * 30);
                                    const sign = ZODIAC_DATA[Math.floor(normalizeAngle(cuspLon) / 30)] || ZODIAC_DATA[0];
                                    const signCol = SIGN_ELEMENT_COLORS[sign.name] || textPrimary;
                                    const ZodiacIconComp = ZODIAC_ICONS[sign.id as keyof typeof ZODIAC_ICONS];
                                    const occupants = planetsByHouse[houseNum] || [];

                                    return (
                                        <div key={houseNum} style={{
                                            padding: '4px 6px',
                                            borderRadius: '6px',
                                            background: innerCardBg,
                                            border: `1px solid ${borderCol}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            fontSize: '9.5px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <strong style={{ width: '22px', color: textPrimary, fontSize: '9.5px' }}>
                                                    {ROMAN_NUMERALS[idx]}
                                                </strong>
                                                {angleBadge && (
                                                    <span style={{ fontSize: '7.5px', fontWeight: 800, padding: '1px 3px', borderRadius: '3px', background: '#eab308', color: '#000' }}>
                                                        {angleBadge}
                                                    </span>
                                                )}
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: signCol, fontWeight: 700 }}>
                                                    {ZodiacIconComp && (
                                                        <span style={{ width: '11px', height: '11px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <ZodiacIconComp style={{ width: '11px', height: '11px' }} />
                                                        </span>
                                                    )}
                                                    <span>{sign.name.slice(0, 4)}.</span>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ fontFamily: 'Courier Prime, monospace', fontSize: '9px', fontWeight: 600, color: textSecondary }}>
                                                    {formatDeg(cuspLon)}
                                                </span>
                                                <div style={{ minWidth: '24px', textAlign: 'right', fontWeight: 'bold' }}>
                                                    {occupants.map(p => (
                                                        <span key={p.id} style={{ color: PLANET_HEX_COLORS[p.id] || textPrimary, marginLeft: '2px', fontSize: '10.5px' }}>
                                                            {p.symbol}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Coluna 2: Casas VII a XII */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                {[6, 7, 8, 9, 10, 11].map(idx => {
                                    const houseNum = idx + 1;
                                    const angleBadge = getHouseAngleBadge(houseNum);
                                    const cuspLon = props.houseCusps?.[idx] ?? (ascLon + idx * 30);
                                    const sign = ZODIAC_DATA[Math.floor(normalizeAngle(cuspLon) / 30)] || ZODIAC_DATA[0];
                                    const signCol = SIGN_ELEMENT_COLORS[sign.name] || textPrimary;
                                    const ZodiacIconComp = ZODIAC_ICONS[sign.id as keyof typeof ZODIAC_ICONS];
                                    const occupants = planetsByHouse[houseNum] || [];

                                    return (
                                        <div key={houseNum} style={{
                                            padding: '4px 6px',
                                            borderRadius: '6px',
                                            background: innerCardBg,
                                            border: `1px solid ${borderCol}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            fontSize: '9.5px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <strong style={{ width: '22px', color: textPrimary, fontSize: '9.5px' }}>
                                                    {ROMAN_NUMERALS[idx]}
                                                </strong>
                                                {angleBadge && (
                                                    <span style={{ fontSize: '7.5px', fontWeight: 800, padding: '1px 3px', borderRadius: '3px', background: '#eab308', color: '#000' }}>
                                                        {angleBadge}
                                                    </span>
                                                )}
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: signCol, fontWeight: 700 }}>
                                                    {ZodiacIconComp && (
                                                        <span style={{ width: '11px', height: '11px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <ZodiacIconComp style={{ width: '11px', height: '11px' }} />
                                                        </span>
                                                    )}
                                                    <span>{sign.name.slice(0, 4)}.</span>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ fontFamily: 'Courier Prime, monospace', fontSize: '9px', fontWeight: 600, color: textSecondary }}>
                                                    {formatDeg(cuspLon)}
                                                </span>
                                                <div style={{ minWidth: '24px', textAlign: 'right', fontWeight: 'bold' }}>
                                                    {occupants.map(p => (
                                                        <span key={p.id} style={{ color: PLANET_HEX_COLORS[p.id] || textPrimary, marginLeft: '2px', fontSize: '10.5px' }}>
                                                            {p.symbol}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rodapé Panorâmico */}
            <div style={{
                paddingTop: '12px',
                borderTop: `1px solid ${borderCol}`,
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '10.5px',
                color: textSecondary,
                fontWeight: 600
            }}>
                <span>CRONÓGRAFO SIDERAL · RELATÓRIO HORIZONTAL DE MECÂNICA CELESTE & ASTROMETRIA</span>
                <span>Página 1 de 1 · Gerado em {dateFormatted} às {timeFormatted}</span>
            </div>
        </div>
    );
};
