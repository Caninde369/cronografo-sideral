import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { SearchMoonPhase } from 'astronomy-engine';
import { useLanguage } from '../i18n';
import { CelestialData } from '../hooks/useCelestialData';
import { Aspect } from '../lib/astrology/aspects';
import { ZODIAC_DATA } from './zodiac';
import * as bodies from '../lib/astrology/celestialBodies';
import * as points from '../lib/astrology/astroPoints';
import { normalizeAngle } from '../lib/astrology/utils';
import { getMoonAge } from '../lib/astrology/calendars';
import { getMoonPhaseInfo } from '../lib/astrology/moon';
import { getYearCycles } from '../lib/astrology/lunarCycles';
import { checkIsEclipse } from './SiderealClock';
import { ExportOptionsModal, ExportOptions } from './ExportOptionsModal';
import { VerticalDataTemplate, HorizontalDataTemplate } from './ExportPrintTemplates';

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
    stationaryStatus: Record<string, boolean>;
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
    variant?: 'sidebar' | 'topbar';
    isFreeTier?: boolean;
    onOpenPaymentPlans?: () => void;
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
    sun: '#FDE047', moon: '#64748b', mercury: '#94a3b8', venus: '#f472b6', mars: '#ef4444',
    jupiter: '#f59e0b', saturn: '#eab308', uranus: '#22d3ee', neptune: '#6366f1', pluto: '#94a3b8',
    northNode: '#10b981', southNode: '#d97706', lilith: '#d946ef', partOfFortune: '#38bdf8',
    chiron: '#10b981', ceres: '#f59e0b', pallas: '#818cf8', juno: '#f472b6', vesta: '#f59e0b',
    ascendant: '#ffffff', midheaven: '#ffffff', descendant: '#ffffff', imumCoeli: '#ffffff'
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
    northNode: '☊', southNode: '☋', lilith: '⚸', partOfFortune: '⊗',
    chiron: '⚷', ceres: '⚳', pallas: '⚴', juno: '⚵', vesta: '⚶',
    ascendant: 'ASC', midheaven: 'MC', descendant: 'DC', imumCoeli: 'IC'
};

const PLANET_NAMES_FULL: Record<string, string> = {
    sun: 'Sol', moon: 'Lua', mercury: 'Mercúrio', venus: 'Vênus', mars: 'Marte',
    jupiter: 'Júpiter', saturn: 'Saturno', uranus: 'Urano', neptune: 'Netuno', pluto: 'Plutão',
    northNode: 'Nodo Norte (Cabeça do Dragão)', southNode: 'Nodo Sul (Cauda do Dragão)', lilith: 'Lilith (Lua Negra / Apogeu)',
    partOfFortune: 'Parte da Fortuna (Roda da Fortuna)',
    chiron: 'Quíron (O Curador Ferido)', ceres: 'Ceres (Nutrição)', pallas: 'Palas Atena (Estratégia)', juno: 'Juno (Casamento)', vesta: 'Vesta (Fogo Sagrado)',
    ascendant: 'Ascendente (ASC)', midheaven: 'Meio do Céu (MC)', descendant: 'Descendente (DC)', imumCoeli: 'Fundo do Céu (IC)'
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

const formatDeg = (lon: number) => {
    const norm = normalizeAngle(lon);
    const d = Math.floor(norm % 30);
    const m = Math.floor((norm % 1) * 60);
    return `${d.toString().padStart(2, '0')}°${m.toString().padStart(2, '0')}'`;
};

const DECAN_RULERS = [
    ['Marte', 'Sol', 'Vênus'], // Áries
    ['Mercúrio', 'Lua', 'Saturno'], // Touro
    ['Júpiter', 'Marte', 'Sol'], // Gêmeos
    ['Vênus', 'Mercúrio', 'Lua'], // Câncer
    ['Saturno', 'Júpiter', 'Marte'], // Leão
    ['Sol', 'Vênus', 'Mercúrio'], // Virgem
    ['Lua', 'Saturno', 'Júpiter'], // Libra
    ['Marte', 'Sol', 'Vênus'], // Escorpião
    ['Mercúrio', 'Lua', 'Saturno'], // Sagitário
    ['Júpiter', 'Marte', 'Sol'], // Capricórnio
    ['Vênus', 'Mercúrio', 'Lua'], // Aquário
    ['Saturno', 'Júpiter', 'Marte'] // Peixes
];

const EGYPTIAN_TERMS = [
    [{ limit: 6, ruler: 'Júpiter' }, { limit: 12, ruler: 'Vênus' }, { limit: 20, ruler: 'Mercúrio' }, { limit: 25, ruler: 'Marte' }, { limit: 30, ruler: 'Saturno' }],
    [{ limit: 8, ruler: 'Vênus' }, { limit: 14, ruler: 'Mercúrio' }, { limit: 22, ruler: 'Júpiter' }, { limit: 27, ruler: 'Saturno' }, { limit: 30, ruler: 'Marte' }],
    [{ limit: 6, ruler: 'Mercúrio' }, { limit: 12, ruler: 'Júpiter' }, { limit: 17, ruler: 'Vênus' }, { limit: 24, ruler: 'Marte' }, { limit: 30, ruler: 'Saturno' }],
    [{ limit: 7, ruler: 'Marte' }, { limit: 13, ruler: 'Vênus' }, { limit: 19, ruler: 'Mercúrio' }, { limit: 26, ruler: 'Júpiter' }, { limit: 30, ruler: 'Saturno' }],
    [{ limit: 6, ruler: 'Saturno' }, { limit: 11, ruler: 'Mercúrio' }, { limit: 18, ruler: 'Vênus' }, { limit: 24, ruler: 'Júpiter' }, { limit: 30, ruler: 'Marte' }],
    [{ limit: 7, ruler: 'Mercúrio' }, { limit: 17, ruler: 'Vênus' }, { limit: 21, ruler: 'Júpiter' }, { limit: 28, ruler: 'Marte' }, { limit: 30, ruler: 'Saturno' }],
    [{ limit: 6, ruler: 'Saturno' }, { limit: 14, ruler: 'Vênus' }, { limit: 21, ruler: 'Júpiter' }, { limit: 28, ruler: 'Mercúrio' }, { limit: 30, ruler: 'Marte' }],
    [{ limit: 7, ruler: 'Marte' }, { limit: 11, ruler: 'Vênus' }, { limit: 19, ruler: 'Júpiter' }, { limit: 24, ruler: 'Mercúrio' }, { limit: 30, ruler: 'Saturno' }],
    [{ limit: 12, ruler: 'Júpiter' }, { limit: 17, ruler: 'Vênus' }, { limit: 21, ruler: 'Mercúrio' }, { limit: 26, ruler: 'Saturno' }, { limit: 30, ruler: 'Marte' }],
    [{ limit: 7, ruler: 'Mercúrio' }, { limit: 14, ruler: 'Júpiter' }, { limit: 22, ruler: 'Vênus' }, { limit: 26, ruler: 'Saturno' }, { limit: 30, ruler: 'Marte' }],
    [{ limit: 7, ruler: 'Mercúrio' }, { limit: 13, ruler: 'Vênus' }, { limit: 20, ruler: 'Júpiter' }, { limit: 25, ruler: 'Marte' }, { limit: 30, ruler: 'Saturno' }],
    [{ limit: 12, ruler: 'Vênus' }, { limit: 16, ruler: 'Júpiter' }, { limit: 19, ruler: 'Mercúrio' }, { limit: 28, ruler: 'Marte' }, { limit: 30, ruler: 'Saturno' }]
];

export const getDecanDetails = (lon: number) => {
    const norm = normalizeAngle(lon);
    const signIdx = Math.floor(norm / 30);
    const degreeInSign = norm % 30;
    const decanIdx = Math.min(2, Math.max(0, Math.floor(degreeInSign / 10)));
    const ruler = DECAN_RULERS[signIdx]?.[decanIdx] || 'Sol';
    const rangeStart = decanIdx * 10;
    const rangeEnd = (decanIdx + 1) * 10;
    return {
        index: decanIdx + 1,
        range: `${rangeStart}°-${rangeEnd}°`,
        ruler,
        label: `${decanIdx + 1}º Decanato (${rangeStart}°-${rangeEnd}°) - Regente: ${ruler}`
    };
};

export const getTermDetails = (lon: number) => {
    const norm = normalizeAngle(lon);
    const signIdx = Math.floor(norm / 30);
    const degreeInSign = norm % 30;
    const terms = EGYPTIAN_TERMS[signIdx] || [{ limit: 30, ruler: 'Sol' }];
    let prevLimit = 0;
    for (const term of terms) {
        if (degreeInSign < term.limit) {
            return {
                ruler: term.ruler,
                range: `${prevLimit}°-${term.limit}°`,
                label: `Termo Egípcio: ${term.ruler} (${prevLimit}°-${term.limit}°)`
            };
        }
        prevLimit = term.limit;
    }
    const last = terms[terms.length - 1];
    return {
        ruler: last.ruler,
        range: `${prevLimit}°-30°`,
        label: `Termo Egípcio: ${last.ruler} (${prevLimit}°-30°)`
    };
};

export const getDecanInfo = (lon: number) => getDecanDetails(lon).label;
export const getTermRuler = (lon: number) => getTermDetails(lon).ruler;

const PLANET_FUNCTIONS: Record<string, (d: Date) => number> = {
    sun: bodies.calculateSunTropicalLongitude,
    moon: bodies.calculateMoonTropicalLongitude,
    mercury: bodies.calculateMercuryTropicalLongitude,
    venus: bodies.calculateVenusTropicalLongitude,
    mars: bodies.calculateMarsTropicalLongitude,
    jupiter: bodies.calculateJupiterTropicalLongitude,
    saturn: bodies.calculateSaturnTropicalLongitude,
    uranus: bodies.calculateUranusTropicalLongitude,
    neptune: bodies.calculateNeptuneTropicalLongitude,
    pluto: bodies.calculatePlutoTropicalLongitude,
    northNode: points.calculateNorthNodeTropicalLongitude,
    lilith: points.calculateLilithTropicalLongitude,
    chiron: points.calculateChironTropicalLongitude,
    ceres: points.calculateCeresTropicalLongitude,
    pallas: points.calculatePallasTropicalLongitude,
    juno: points.calculateJunoTropicalLongitude,
    vesta: points.calculateVestaTropicalLongitude,
};

const AVG_SPEEDS: Record<string, number> = {
    sun: 0.9856, moon: 13.176, mercury: 1.38, venus: 1.2, mars: 0.52, jupiter: 0.083, saturn: 0.034,
    uranus: 0.011, neptune: 0.006, pluto: 0.004, chiron: 0.05, ceres: 0.21, pallas: 0.22, juno: 0.23, vesta: 0.27
};

export const calculateBodyVelocity = (
    id: string,
    currentTime: Date,
    retrogradeStatus: Record<string, boolean> = {},
    stationaryStatus: Record<string, boolean> = {}
) => {
    if (id === 'southNode') {
        const v = calculateBodyVelocity('northNode', currentTime, retrogradeStatus, stationaryStatus);
        return { daily: -v.daily, status: 'Retrógrado (Nodal)', movement: 'Retrógrado' };
    }
    if (id === 'northNode') {
        return { daily: -0.053, status: 'Retrógrado Médio', movement: 'Retrógrado' };
    }
    if (['ascendant', 'midheaven', 'descendant', 'imumCoeli', 'partOfFortune'].includes(id)) {
        return { daily: 360, status: 'Rotação Diurna', movement: 'Direto' };
    }
    const func = PLANET_FUNCTIONS[id];
    if (!func) return { daily: 0, status: 'Normal', movement: 'Direto' };

    try {
        const lon1 = func(currentTime);
        const lon2 = func(new Date(currentTime.getTime() + 60 * 60 * 1000)); // +1 hora
        
        let diff = normalizeAngle(lon2 - lon1);
        if (diff > 180) diff -= 360;
        const daily = diff * 24;

        const avg = AVG_SPEEDS[id] || 0.05;
        let movement = 'Direto';
        let status = 'Normal';

        if (retrogradeStatus?.[id] || daily < -0.0001) {
            movement = 'Retrógrado';
            status = 'Retrógrado';
        } else if (stationaryStatus?.[id] || Math.abs(daily) < 0.005) {
            movement = 'Estacionário';
            status = 'Estacionário';
        } else if (Math.abs(daily) > avg * 1.15) {
            status = 'Rápido';
        } else if (Math.abs(daily) < avg * 0.85) {
            status = 'Lento';
        }

        return { daily, status, movement };
    } catch {
        return { daily: 0, status: 'Normal', movement: 'Direto' };
    }
};

const calculateVelocity = calculateBodyVelocity;

const getHouseForLon = (lon: number, cusps: number[]): number => {
    if (!cusps || cusps.length < 12) return 1;
    for (let i = 0; i < 12; i++) {
        const c1 = cusps[i];
        const c2 = cusps[(i + 1) % 12];
        const normLon = normalizeAngle(lon);
        const normC1 = normalizeAngle(c1);
        const normC2 = normalizeAngle(c2);
        if (normC1 < normC2) {
            if (normLon >= normC1 && normLon < normC2) return i + 1;
        } else {
            if (normLon >= normC1 || normLon < normC2) return i + 1;
        }
    }
    return 1;
};

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const HOUSE_LABELS = ['ASC (Casa I)', 'Casa II', 'Casa III', 'IC (Casa IV)', 'Casa V', 'Casa VI', 'DC (Casa VII)', 'Casa VIII', 'Casa IX', 'MC (Casa X)', 'Casa XI', 'Casa XII'];
const HOUSE_ORDER_SEQ = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export const buildChatAIText = (props: ExportPDFButtonProps): string => {
    if (!props.celestialData) return '';

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const lat = props.location.latitude ?? 0;
    const lonLoc = props.location.longitude ?? 0;
    const latLonStr = props.location.latitude ? ` (${lat.toFixed(4)}° / ${lonLoc.toFixed(4)}°)` : '';
    const dateFormatted = props.currentTime.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', weekday: 'long' });
    const timeFormatted = props.currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Estatísticas Elementais & Modalidades (Planetas Principais)
    const PLANETS_STATS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
    const stats = { fire: 0, earth: 0, air: 0, water: 0, cardinal: 0, fixed: 0, mutable: 0, masculine: 0, feminine: 0 };
    PLANETS_STATS.forEach(id => {
        const lon = props.celestialData[`${id}EclipticLongitude` as keyof CelestialData] as number;
        if (typeof lon === 'number') {
            const sign = ZODIAC_DATA[Math.floor(lon / 30)];
            if (sign) {
                stats[sign.element as keyof typeof stats]++;
                stats[sign.modality as keyof typeof stats]++;
                if (sign.polarity === 'masculine') stats.masculine++;
                else stats.feminine++;
            }
        }
    });

    // Dados da Lua
    const moonPhaseVal = props.moonPhaseValue ?? props.celestialData.moonPhase ?? 0;
    const illumination = Math.round((1 - Math.cos(2 * Math.PI * moonPhaseVal)) / 2 * 100);
    const moonPhaseInfo = props.moonPhase?.name ? props.moonPhase : getMoonPhaseInfo(moonPhaseVal);
    const moonAge = Math.round(getMoonAge(moonPhaseVal) * 10) / 10;
    const moonLon = props.celestialData.moonEclipticLongitude ?? 0;
    const moonSign = ZODIAC_DATA[Math.floor(moonLon / 30)] || ZODIAC_DATA[0];
    const moonDecan = getDecanDetails(moonLon);
    const moonTerm = getTermDetails(moonLon);
    const moonVelocity = calculateBodyVelocity('moon', props.currentTime, props.retrogradeStatus, props.stationaryStatus);
    const moonHouse = props.housePlacements?.moon || getHouseForLon(moonLon, props.houseCusps);
    const eclipse = checkIsEclipse(props.currentTime);

    // Ciclo Lunar Vigente (Lunação Anual)
    const yearCycles = getYearCycles(props.currentTime.getFullYear(), lat);
    const nowMs = props.currentTime.getTime();
    let currentCycle = yearCycles[0];
    for (const c of yearCycles) {
        if (c.start.getTime() <= nowMs) currentCycle = c;
        else break;
    }

    let nextNewMoonText = 'N/A';
    let cycleProgressText = '';
    try {
        const nextNM = SearchMoonPhase(0, props.currentTime, 35);
        if (nextNM?.date) {
            const diffMs = nextNM.date.getTime() - props.currentTime.getTime();
            if (diffMs > 0) {
                const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
                const days = Math.floor(totalHours / 24);
                const hours = totalHours % 24;
                const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                const remainingDays = diffMs / (1000 * 60 * 60 * 24);
                const cycleProgress = Math.max(0, Math.min(100, Math.round(((29.530588 - remainingDays) / 29.530588) * 100)));
                nextNewMoonText = `${nextNM.date.toLocaleDateString('pt-BR')} ${nextNM.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} (${days}d ${hours}h ${minutes}m restantes)`;
                cycleProgressText = `${cycleProgress}% concluído`;
            }
        }
    } catch (e) {
        console.warn('Erro ao calcular próxima Lua Nova:', e);
    }

    let text = `=== CRONÓGRAFO SIDERAL — DADOS ASTRONÔMICOS E ASTROLÓGICOS COMPLETOS ===\n`;
    text += `(Formato Otimizado para Análise por Inteligência Artificial / Chat AI / LLMs)\n\n`;

    text += `[1. METADADOS DA LEITURA & LOCALIZAÇÃO]\n`;
    text += `• Data e Hora: ${dateFormatted} às ${timeFormatted} (${tz})\n`;
    text += `• Local: ${props.location.displayName}${latLonStr}\n`;
    text += `• Estação Solar: ${props.seasonInfo.name} (Dia ${props.seasonInfo.day.toString().padStart(2, '0')})\n`;
    text += `• Sol: Nascer às ${props.sunriseTime || 'N/A'} | Pôr às ${props.sunsetTime || 'N/A'}\n\n`;

    text += `[2. DADOS DETALHADOS DA LUA & CICLO LUNAR VIGENTE]\n`;
    text += `• Fase Atual: ${moonPhaseInfo.name} ${moonPhaseInfo.icon || '☽'} (${illumination}% iluminada | Fase normalizada: ${moonPhaseVal.toFixed(3)})\n`;
    text += `• Idade da Lua: Dia ${moonAge} de ~29.53 dias sinódicos\n`;
    text += `• Lunação Vigente (Ciclo Anual): ${currentCycle?.name || 'Lunação Vigente'} ${currentCycle?.emoji || '🌑'} (Ciclo ${currentCycle?.index || 1} de 13 pós-equinócio)\n`;
    text += `• Início da Lunação (Lua Nova): ${currentCycle?.start ? currentCycle.start.toLocaleDateString('pt-BR') : 'N/A'}\n`;
    text += `• Próxima Lua Nova: ${nextNewMoonText}${cycleProgressText ? ` | Progresso do ciclo: ${cycleProgressText}` : ''}\n`;
    if (currentCycle?.phases?.length) {
        text += `• Calendário de Fases da Lunação: ` + currentCycle.phases.map(p => `${p.icon} ${p.name} (Dias ${p.range})`).join(' | ') + `\n`;
    }
    text += `• Efemérides Locais da Lua: Nascer da Lua às ${props.moonriseTime || 'N/A'} | Ocaso da Lua às ${props.moonsetTime || 'N/A'}\n`;
    text += `• Posição da Lua: Casa ${moonHouse} (${ROMAN_NUMERALS[moonHouse - 1] || moonHouse}) | ${moonSign.name} ${formatDeg(moonLon)} | ${moonDecan.label} | ${moonTerm.label} | Movimento: ${moonVelocity.movement} (${moonVelocity.daily.toFixed(2)}°/dia)\n`;
    text += `• Status de Eclipse: ${eclipse ? `⚠️ Eclipse ${eclipse.type === 'solar' ? 'Solar' : 'Lunar'} ativo/próximo: ${eclipse.name}` : 'Nenhum eclipse ativo no momento'}\n\n`;

    text += `[3. DISTRIBUIÇÃO ELEMENTAL E MODALIDADES]\n`;
    text += `• Polaridades: Masculino/Diurno (${stats.masculine}) | Feminino/Noturno (${stats.feminine})\n`;
    text += `• Elementos: Fogo (${stats.fire}) | Terra (${stats.earth}) | Ar (${stats.air}) | Água (${stats.water})\n`;
    text += `• Modalidades: Cardinal (${stats.cardinal}) | Fixo (${stats.fixed}) | Mutável (${stats.mutable})\n\n`;

    // Função de formatação para uma linha de astro
    const formatAstroLine = (id: string, name: string, symbol: string, lon: number | undefined, customHouse?: number) => {
        if (typeof lon !== 'number' || isNaN(lon)) return null;
        const sign = ZODIAC_DATA[Math.floor(lon / 30)] || ZODIAC_DATA[0];
        const house = customHouse ?? (props.housePlacements?.[id] || getHouseForLon(lon, props.houseCusps));
        const decan = getDecanDetails(lon);
        const term = getTermDetails(lon);
        const velocity = calculateBodyVelocity(id, props.currentTime, props.retrogradeStatus, props.stationaryStatus);
        
        let velStr = '';
        if (['ascendant', 'midheaven', 'descendant', 'imumCoeli'].includes(id)) {
            velStr = '';
        } else if (['northNode', 'southNode'].includes(id)) {
            velStr = ` | Movimento: ${velocity.movement}`;
        } else if (id === 'partOfFortune') {
            velStr = ` | Ponto Matemático`;
        } else {
            velStr = ` | Movimento: ${velocity.movement} (${velocity.status}, ${velocity.daily.toFixed(2)}°/dia)`;
        }

        return `• ${symbol} ${name}: Casa ${house} (${ROMAN_NUMERALS[house - 1] || house}) | ${sign.name} ${formatDeg(lon)} | ${decan.label} | ${term.label}${velStr}`;
    };

    text += `[4. LUMINARES E PLANETAS (TRADICIONAIS & MODERNOS)]\n`;
    const PLANETS_LIST = [
        { id: 'sun', name: 'Sol', symbol: '☉' },
        { id: 'moon', name: 'Lua', symbol: '☽' },
        { id: 'mercury', name: 'Mercúrio', symbol: '☿' },
        { id: 'venus', name: 'Vênus', symbol: '♀' },
        { id: 'mars', name: 'Marte', symbol: '♂' },
        { id: 'jupiter', name: 'Júpiter', symbol: '♃' },
        { id: 'saturn', name: 'Saturno', symbol: '♄' },
        { id: 'uranus', name: 'Urano', symbol: '⛢' },
        { id: 'neptune', name: 'Netuno', symbol: '♆' },
        { id: 'pluto', name: 'Plutão', symbol: '♇' },
    ];
    PLANETS_LIST.forEach(p => {
        const lon = props.celestialData[`${p.id}EclipticLongitude` as keyof CelestialData] as number;
        const line = formatAstroLine(p.id, p.name, p.symbol, lon);
        if (line) text += `${line}\n`;
    });
    text += `\n`;

    text += `[5. PONTOS LUNARES, NODOS E PONTOS MATEMÁTICOS]\n`;
    const LUNAR_LIST = [
        { id: 'northNode', name: 'Nodo Norte (Cabeça do Dragão)', symbol: '☊', key: 'northNodeEclipticLongitude' },
        { id: 'southNode', name: 'Nodo Sul (Cauda do Dragão)', symbol: '☋', key: 'southNodeEclipticLongitude' },
        { id: 'lilith', name: 'Lilith (Lua Negra / Apogeu Lunar Médio)', symbol: '⚸', key: 'lilithEclipticLongitude' },
        { id: 'partOfFortune', name: 'Parte da Fortuna (Roda da Fortuna)', symbol: '⊗', key: 'partOfFortuneEclipticLongitude' }
    ];
    LUNAR_LIST.forEach(p => {
        const lon = props.celestialData[p.key as keyof CelestialData] as number;
        const line = formatAstroLine(p.id, p.name, p.symbol, lon);
        if (line) text += `${line}\n`;
    });
    text += `\n`;

    text += `[6. ASTEROIDES & CENTAUROS]\n`;
    const ASTEROID_LIST = [
        { id: 'chiron', name: 'Quíron (O Curador Ferido)', symbol: '⚷', key: 'chironEclipticLongitude' },
        { id: 'ceres', name: 'Ceres (Nutrição & Cultivo)', symbol: '⚳', key: 'ceresEclipticLongitude' },
        { id: 'pallas', name: 'Palas Atena (Estratégia & Sabedoria)', symbol: '⚴', key: 'pallasEclipticLongitude' },
        { id: 'juno', name: 'Juno (Casamento & Compromisso)', symbol: '⚵', key: 'junoEclipticLongitude' },
        { id: 'vesta', name: 'Vesta (Foco & Fogo Sagrado)', symbol: '⚶', key: 'vestaEclipticLongitude' }
    ];
    ASTEROID_LIST.forEach(p => {
        const lon = props.celestialData[p.key as keyof CelestialData] as number;
        const line = formatAstroLine(p.id, p.name, p.symbol, lon);
        if (line) text += `${line}\n`;
    });
    text += `\n`;

    text += `[7. ÂNGULOS DO MAPA (EIXOS CARDINAIS)]\n`;
    const ANGLES_LIST = [
        { id: 'ascendant', name: 'Ascendente (ASC)', symbol: 'ASC', key: 'ascendantLongitude', house: 1 },
        { id: 'midheaven', name: 'Meio do Céu (MC)', symbol: 'MC', key: 'midheavenLongitude', house: 10 },
        { id: 'descendant', name: 'Descendente (DC)', symbol: 'DC', key: 'descendantLongitude', house: 7 },
        { id: 'imumCoeli', name: 'Fundo do Céu (IC)', symbol: 'IC', key: 'imumCoeliLongitude', house: 4 }
    ];
    ANGLES_LIST.forEach(p => {
        const lon = props.celestialData[p.key as keyof CelestialData] as number;
        const line = formatAstroLine(p.id, p.name, p.symbol, lon, p.house);
        if (line) text += `${line}\n`;
    });
    text += `\n`;

    text += `[8. CASAS ASTROLÓGICAS (CÚSPIDES COM DECANATOS E TERMOS)]\n`;
    // Monta mapa de corpos presentes em cada casa
    const houseBodies: Record<number, string[]> = {};
    for (let h = 1; h <= 12; h++) houseBodies[h] = [];

    const ALL_BODIES_TO_MAP = [
        ...PLANETS_LIST,
        ...LUNAR_LIST,
        ...ASTEROID_LIST
    ];
    ALL_BODIES_TO_MAP.forEach(b => {
        const key = (b as any).key || `${b.id}EclipticLongitude`;
        const lon = props.celestialData[key as keyof CelestialData] as number;
        if (typeof lon === 'number' && !isNaN(lon)) {
            const h = props.housePlacements?.[b.id] || getHouseForLon(lon, props.houseCusps);
            if (h >= 1 && h <= 12) {
                houseBodies[h].push(`${b.symbol} ${b.name.split(' ')[0]}`);
            }
        }
    });

    HOUSE_ORDER_SEQ.forEach(i => {
        const cusp = props.houseCusps[i];
        if (typeof cusp === 'number') {
            const sign = ZODIAC_DATA[Math.floor(cusp / 30)] || ZODIAC_DATA[0];
            const decan = getDecanDetails(cusp);
            const term = getTermDetails(cusp);
            const label = HOUSE_LABELS[i];
            const planetsIn = houseBodies[i + 1]?.length ? ` | Astros na casa: [${houseBodies[i + 1].join(', ')}]` : ' | Sem astros presentes';
            text += `• ${label}: ${sign.name} ${formatDeg(cusp)} | ${decan.label} | ${term.label}${planetsIn}\n`;
        }
    });
    text += `\n`;

    text += `[9. ASPECTOS ASTROLÓGICOS ATIVOS (ORDENADOS POR ORBE)]\n`;
    const sortedAspects = [...(props.filteredAspects || [])].sort((a, b) => a.orb - b.orb);
    if (sortedAspects.length === 0) {
        text += `• Nenhum aspecto ativo detectado no orbe configurado.\n`;
    } else {
        sortedAspects.slice(0, 40).forEach(a => {
            const n1 = PLANET_NAMES_FULL[a.body1.id] || a.body1.id;
            const n2 = PLANET_NAMES_FULL[a.body2.id] || a.body2.id;
            const s1 = PLANET_SYMBOLS[a.body1.id] || '';
            const s2 = PLANET_SYMBOLS[a.body2.id] || '';
            const h1 = props.housePlacements?.[a.body1.id] || getHouseForLon(a.body1.longitude, props.houseCusps);
            const h2 = props.housePlacements?.[a.body2.id] || getHouseForLon(a.body2.longitude, props.houseCusps);
            const sign1 = ZODIAC_DATA[Math.floor(a.body1.longitude / 30)]?.abbr || '';
            const sign2 = ZODIAC_DATA[Math.floor(a.body2.longitude / 30)]?.abbr || '';
            text += `• ${s1} ${n1} (${sign1} / Casa ${h1}) ${ASPECT_ABBREV[a.type] || a.type.toUpperCase()} ${s2} ${n2} (${sign2} / Casa ${h2}) | Orbe: ${a.orb.toFixed(2)}°\n`;
        });
    }

    return text;
};

const PDFLayout: React.FC<PDFLayoutProps> = ({
    currentTime, location, celestialData, seasonInfo, retrogradeStatus, housePlacements,
    houseCusps, filteredAspects, clockScreenshot, moonPhase, moonPhaseValue
}) => {
    const PLANETS_STATS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
    const stats = { fire: 0, earth: 0, air: 0, water: 0, cardinal: 0, fixed: 0, mutable: 0, masculine: 0, feminine: 0 };
    PLANETS_STATS.forEach(id => {
        const lon = celestialData[`${id}EclipticLongitude` as keyof CelestialData] as number;
        if (typeof lon === 'number') {
            const sign = getSignInfo(lon);
            if (sign) {
                stats[sign.element as keyof typeof stats]++;
                stats[sign.modality as keyof typeof stats]++;
                stats[sign.polarity as keyof typeof stats]++;
            }
        }
    });

    const formatDegree = (longitude: number) => {
        const degree = Math.floor(longitude % 30);
        const minutes = Math.floor((longitude % 1) * 60);
        return `${degree.toString().padStart(2, '0')}°${minutes.toString().padStart(2, '0')}'`;
    };

    function getSignInfo(longitude: number) {
        const signIndex = Math.floor(longitude / 30);
        return ZODIAC_DATA[signIndex];
    };

    const getMoonIllumination = (phase: number) => {
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
        const house = housePlacements[id] || 1;

        return (
            <div key={id} style={{ 
                display: 'grid', gridTemplateColumns: '16px 65px 22px 1fr auto 14px', alignItems: 'center', 
                padding: '4px 0', borderBottom: '1px solid #f8f8f8', opacity,
                fontFamily: 'Inter, sans-serif'
            }}>
                <div style={{ 
                    fontFamily: "'Segoe UI Symbol', sans-serif", 
                    fontSize: '11px', color: planetColor, width: '16px', textAlign: 'center' 
                }}>
                    {PLANET_SYMBOLS[id] || ''}
                </div>
                <div style={{ fontSize: '10px', fontWeight: 500, color: '#333', paddingLeft: '4px' }}>
                    {PLANET_NAMES_FULL[id] || id}
                </div>
                <div style={{ 
                    fontFamily: 'Georgia, serif', fontSize: '9px', fontWeight: 400, 
                    color: '#999', textAlign: 'center' 
                }}>
                    {ROMAN_NUMERALS[house - 1]}
                </div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: signColor, paddingLeft: '4px' }}>
                    {sign.name}
                </div>
                <div style={{ fontSize: '10px', color: '#111', fontFamily: "'Courier Prime', monospace", textAlign: 'right' }}>
                    {formatDegree(longitude)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', width: '14px', justifyContent: 'flex-end' }}>
                    {isRetrograde && <span style={{ fontSize: '9px', color: '#dc2626', fontWeight: 700 }}>R</span>}
                </div>
            </div>
        );
    };

    // REMOVED: Redundant stats calculation

    const sortedAspects = [...filteredAspects].sort((a, b) => a.orb - b.orb);

    const formatTime = (date: Date) => date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const formatDate = (date: Date) => date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formatWeekday = (date: Date) => date.toLocaleDateString('pt-BR', { weekday: 'long' });

    return (
        <div style={{
            width: '595px', height: '842px', background: '#ffffff',
            padding: '40px', boxSizing: 'border-box', position: 'relative',
            overflow: 'hidden', color: '#111', fontFamily: 'Manrope, sans-serif'
        }}>
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Cormorant+Infant:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Courier+Prime&family=Inter:wght@400;500;600;700&display=swap');
                `}
            </style>

            <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ border: '1px solid #e5e5e5', borderRadius: '6px', padding: '6px 12px', fontSize: '10px', color: '#555', background: '#fff' }}>
                            Dia {seasonInfo.day.toString().padStart(2, '0')} do {seasonInfo.name}
                        </div>
                        <div style={{ border: '1px solid #e5e5e5', borderRadius: '6px', padding: '6px 12px', fontSize: '10px', color: '#555', background: '#fff' }}>
                            {moonPhase.name} · {getMoonIllumination(moonPhaseValue)}% iluminada
                        </div>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '32px', fontWeight: 'normal', color: '#111', fontFamily: "'Cormorant Infant', serif", lineHeight: 1 }}>Cronógrafo Sideral</div>
                        <div style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>
                            {location.displayName} · {formatWeekday(currentTime)}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '24px', marginBottom: '30px', alignItems: 'center', fontSize: '8px', fontWeight: 700, color: '#bbb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>POLARIDADE</span>
                        <div style={{ display: 'flex', gap: '8px', color: '#555' }}>
                            <span style={{ color: POLARITY_COLORS.masculine }}>♂ {stats.masculine}</span>
                            <span style={{ color: POLARITY_COLORS.feminine }}>♀ {stats.feminine}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>ELEMENTOS</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <span style={{ color: ELEMENT_COLORS.fire }}>△ {stats.fire}</span>
                            <span style={{ color: ELEMENT_COLORS.earth }}>▽ {stats.earth}</span>
                            <span style={{ color: ELEMENT_COLORS.air }}>△ {stats.air}</span>
                            <span style={{ color: ELEMENT_COLORS.water }}>▽ {stats.water}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>MODALIDADES</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <span style={{ color: MODALITY_COLORS.cardinal }}>+ {stats.cardinal}</span>
                            <span style={{ color: MODALITY_COLORS.fixed }}>□ {stats.fixed}</span>
                            <span style={{ color: MODALITY_COLORS.mutable }}>× {stats.mutable}</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', flex: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px', borderBottom: '1.5px solid #111', paddingBottom: '4px' }}>ASTROS</div>
                            
                            <div style={{ fontSize: '8px', fontWeight: 700, color: '#999', textTransform: 'uppercase', margin: '12px 0 6px' }}>PRINCIPAIS</div>
                            {['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'].map(id => renderPlanetRow(id, 1))}
                            
                            <div style={{ fontSize: '8px', fontWeight: 700, color: '#999', textTransform: 'uppercase', margin: '12px 0 6px' }}>PONTOS</div>
                            {['northNode', 'lilith', 'southNode'].map(id => renderPlanetRow(id, 0.8))}
                            
                            <div style={{ fontSize: '8px', fontWeight: 700, color: '#999', textTransform: 'uppercase', margin: '12px 0 6px' }}>ASTEROIDES</div>
                            {['chiron', 'ceres', 'pallas', 'juno', 'vesta'].map(id => renderPlanetRow(id, 0.7))}
                        </div>

                        <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px', borderBottom: '1.5px solid #111', paddingBottom: '4px' }}>CASAS - CÚSPIDES</div>
                            {HOUSE_ORDER_SEQ.map(i => {
                                const cusp = houseCusps[i];
                                const sign = getSignInfo(cusp);
                                const label = HOUSE_LABELS[i];
                                const isAngle = [0, 3, 6, 9].includes(i);
                                const signColor = SIGN_ELEMENT_COLORS[sign.name] || '#111';
                                
                                return (
                                    <div key={i} style={{ 
                                        display: 'grid', gridTemplateColumns: '35px 1fr auto', alignItems: 'center', 
                                        padding: '5px 0', borderBottom: '1px solid #f8f8f8',
                                        background: isAngle ? '#fafafa' : 'transparent'
                                    }}>
                                        <div style={{ 
                                            fontFamily: "'Inter', sans-serif", fontSize: '10px',
                                            fontWeight: isAngle ? 800 : 500, 
                                            color: isAngle ? '#111' : '#999' 
                                        }}>
                                            {label}
                                        </div>
                                        <div style={{ fontSize: '10px', fontWeight: 600, color: signColor, paddingLeft: '4px' }}>
                                            {sign.name}
                                        </div>
                                        <div style={{ fontSize: '10px', color: '#111', textAlign: 'right', fontFamily: "'Courier Prime', monospace" }}>
                                            {formatDegree(cusp)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            {clockScreenshot ? (
                                <img src={clockScreenshot} style={{ width: '280px', height: '280px', objectFit: 'contain' }} alt="Chart" />
                            ) : (
                                <div style={{ width: '280px', height: '280px', border: '1px dashed #ddd', borderRadius: '50%' }} />
                            )}
                        </div>

                        <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px', borderBottom: '1.5px solid #111', paddingBottom: '4px' }}>ASPECTOS</div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {sortedAspects.slice(0, 18).map((aspect, i) => {
                                    const sign1 = getSignInfo(aspect.body1.longitude);
                                    const sign2 = getSignInfo(aspect.body2.longitude);
                                    const h1 = housePlacements[aspect.body1.id] || 1;
                                    const h2 = housePlacements[aspect.body2.id] || 1;
                                    const style = ASPECT_STYLES[aspect.type] || { color: '#374151' };

                                    return (
                                        <div key={i} style={{ 
                                            display: 'grid', 
                                            gridTemplateColumns: '18px 25px 55px 35px 55px 25px 18px', 
                                            alignItems: 'center', 
                                            padding: '4px 0', 
                                            borderBottom: '1px solid #f8f8f8',
                                            fontSize: '9px'
                                        }}>
                                            <div style={{ fontSize: '8px', color: '#999', textAlign: 'center' }}>{ROMAN_NUMERALS[h1 - 1]}</div>
                                            <div style={{ color: SIGN_ELEMENT_COLORS[sign1.name], fontWeight: 600, textAlign: 'center' }}>{sign1.name.substring(0,3).toUpperCase()}</div>
                                            <div style={{ textAlign: 'right', paddingRight: '4px' }}>{PLANET_NAMES_FULL[aspect.body1.id]}</div>
                                            <div style={{ textAlign: 'center', fontWeight: 800, color: style.color }}>{ASPECT_ABBREV[aspect.type]}</div>
                                            <div style={{ textAlign: 'left', paddingLeft: '4px' }}>{PLANET_NAMES_FULL[aspect.body2.id]}</div>
                                            <div style={{ color: SIGN_ELEMENT_COLORS[sign2.name], fontWeight: 600, textAlign: 'center' }}>{sign2.name.substring(0,3).toUpperCase()}</div>
                                            <div style={{ fontSize: '8px', color: '#999', textAlign: 'center' }}>{ROMAN_NUMERALS[h2 - 1]}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#bbb', fontWeight: 600 }}>
                    <span>CRONÓGRAFO SIDERAL</span>
                    <span>{formatDate(new Date())} {formatTime(new Date())}</span>
                </div>
            </div>
        </div>
    );
};

export const ExportPDFButton: React.FC<ExportPDFButtonProps> = (props) => {
    const { t } = useLanguage();
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [copied, setCopied] = useState(false);
    const [clockScreenshot, setClockScreenshot] = useState<string>('');
    const [renderThemeMode, setRenderThemeMode] = useState<'light' | 'dark'>(props.theme || 'light');
    const pdfRef = useRef<HTMLDivElement>(null);
    const verticalDataRef = useRef<HTMLDivElement>(null);
    const horizontalDataRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const isLight = props.theme === 'light';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    const copyToClipboard = (text: string) => {
        const fallbackCopy = (str: string) => {
            const textArea = document.createElement("textarea");
            textArea.value = str;
            textArea.style.position = "fixed";
            textArea.style.top = "0";
            textArea.style.left = "0";
            textArea.style.opacity = "0";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            let success = false;
            try {
                success = document.execCommand('copy');
            } catch (err) {
                console.error('Fallback copy failed:', err);
            }
            document.body.removeChild(textArea);
            return success;
        };

        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(text)
                .then(() => {
                    setCopied(true);
                    setTimeout(() => {
                        setCopied(false);
                        setShowMenu(false);
                    }, 2000);
                })
                .catch((err) => {
                    console.warn('navigator.clipboard failed, trying fallback:', err);
                    if (fallbackCopy(text)) {
                        setCopied(true);
                        setTimeout(() => {
                            setCopied(false);
                            setShowMenu(false);
                        }, 2000);
                    }
                });
        } else {
            if (fallbackCopy(text)) {
                setCopied(true);
                setTimeout(() => {
                    setCopied(false);
                    setShowMenu(false);
                }, 2000);
            }
        }
    };

    const exportTechnicalData = () => {
        if (!props.celestialData) {
            console.warn('celestialData não disponível para exportação');
            return;
        }

        const text = buildChatAIText(props);

        // Copy to clipboard
        copyToClipboard(text);

        // Download as .txt file for "baixar chat AI"
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '').substring(0, 15).replace('T', '-');
            const cityName = props.location.displayName.split(',')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            const element = document.createElement("a");
            const file = new Blob([text], {type: 'text/plain;charset=utf-8'});
            element.href = URL.createObjectURL(file);
            element.download = `sideral-chat-ai-${cityName}-${timestamp}.txt`;
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        } catch (err) {
            console.error('Erro ao baixar arquivo TXT para Chat AI:', err);
        }
    };

    // Função central que executa a exportação de acordo com as opções selecionadas no Modal
    const handleConfirmExport = async (options: ExportOptions) => {
        if (!props.clockRef.current || !props.celestialData) return;
        setIsExporting(true);
        setExportProgress('Configurando opções...');

        const originalTheme = props.theme;
        const originalShowAspectLines = props.showAspectLines;

        try {
            setRenderThemeMode(options.themeMode);
            props.onSetTheme(options.themeMode);
            props.setShowAspectLines(true);

            setExportProgress('Renderizando mostrador...');
            await new Promise(resolve => setTimeout(resolve, 600));

            setExportProgress('Capturando mostrador em alta resolução...');
            const clockCanvas = await html2canvas(props.clockRef.current, {
                scale: 3,
                useCORS: true,
                backgroundColor: options.themeMode === 'light' ? '#ffffff' : '#06060a',
                logging: false,
                imageTimeout: 0,
                onclone: (clonedDoc) => {
                    const el = clonedDoc.querySelector('.sidereal-clock-capture-container');
                    if (el instanceof HTMLElement) {
                        el.style.setProperty('max-height', 'none', 'important');
                        el.style.setProperty('max-width', 'none', 'important');
                        el.style.setProperty('height', '2000px', 'important');
                        el.style.setProperty('width', '2000px', 'important');
                        el.style.setProperty('transform', 'none', 'important');
                        el.style.setProperty('padding', '0px', 'important');
                        el.style.setProperty('margin', '0px', 'important');
                        el.style.setProperty('display', 'flex', 'important');
                        el.style.setProperty('align-items', 'center', 'important');
                        el.style.setProperty('justify-content', 'center', 'important');
                        el.style.setProperty('background', options.themeMode === 'light' ? '#ffffff' : '#06060a', 'important');
                        el.style.setProperty('background-color', options.themeMode === 'light' ? '#ffffff' : '#06060a', 'important');

                        const innerDivs = el.querySelectorAll('div');
                        innerDivs.forEach((div) => {
                            if (div instanceof HTMLElement) {
                                div.style.setProperty('transform', 'none', 'important');
                                div.style.setProperty('width', '100%', 'important');
                                div.style.setProperty('height', '100%', 'important');
                                div.style.setProperty('max-width', 'none', 'important');
                                div.style.setProperty('max-height', 'none', 'important');
                                div.style.setProperty('margin', '0px', 'important');
                                div.style.setProperty('padding', '0px', 'important');
                            }
                        });

                        const svg = el.querySelector('svg');
                        if (svg instanceof SVGElement) {
                            svg.style.setProperty('width', '100%', 'important');
                            svg.style.setProperty('height', '100%', 'important');
                            svg.style.setProperty('max-width', 'none', 'important');
                            svg.style.setProperty('max-height', 'none', 'important');
                            svg.style.setProperty('transform', 'none', 'important');
                            svg.setAttribute('viewBox', '-15 -15 1030 1030');
                        }
                    }
                }
            });

            const clockImgData = clockCanvas.toDataURL('image/png');
            setClockScreenshot(clockImgData);

            const timestamp = new Date().toISOString().replace(/[:.]/g, '').substring(0, 15).replace('T', '-');
            const cityName = props.location.displayName.split(',')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

            const applyWatermark = (pdfDoc: jsPDF) => {
                const totalPages = (pdfDoc as any).internal.getNumberOfPages();
                for (let i = 1; i <= totalPages; i++) {
                    pdfDoc.setPage(i);
                    const w = pdfDoc.internal.pageSize.getWidth();
                    const h = pdfDoc.internal.pageSize.getHeight();

                    // Faixa Superior Ambar
                    pdfDoc.setFillColor(254, 243, 199);
                    pdfDoc.rect(0, 0, w, 6.5, 'F');
                    pdfDoc.setFont('helvetica', 'bold');
                    pdfDoc.setFontSize(7.5);
                    pdfDoc.setTextColor(180, 83, 9);
                    pdfDoc.text('CRONÓGRAFO SIDERAL · VERSÃO GRATUITA DE DEGUSTAÇÃO (1 DE 1)', w / 2, 4.5, { align: 'center' });

                    // Faixa Inferior
                    pdfDoc.setFillColor(241, 245, 249);
                    pdfDoc.rect(0, h - 7, w, 7, 'F');
                    pdfDoc.setFont('helvetica', 'normal');
                    pdfDoc.setFontSize(6.5);
                    pdfDoc.setTextColor(100, 116, 139);
                    pdfDoc.text('Relatório de Demonstração · Para exportações ilimitadas em alta resolução (300 DPI) e sem marcas, assine o Plano Mensal ou Vitalício', w / 2, h - 2.5, { align: 'center' });

                    // Marca d'água diagonal sutil
                    pdfDoc.saveGraphicsState();
                    try {
                        (pdfDoc as any).setGState(new (pdfDoc as any).GState({ opacity: 0.12 }));
                    } catch {}
                    pdfDoc.setFont('helvetica', 'bold');
                    pdfDoc.setFontSize(32);
                    pdfDoc.setTextColor(140, 140, 140);
                    pdfDoc.text('CRONÓGRAFO SIDERAL — DEMO', w / 2, h / 2, {
                        align: 'center',
                        angle: 45
                    });
                    pdfDoc.restoreGraphicsState();
                }
            };

            const recordFreeExportUsed = () => {
                if (props.isFreeTier) {
                    try {
                        const cur = parseInt(localStorage.getItem('cronografo_free_exports_count') || '0', 10);
                        localStorage.setItem('cronografo_free_exports_count', (cur + 1).toString());
                    } catch {}
                }
            };

            // 1. SOMENTE CRONÓGRAFO (Vertical ou Horizontal)
            if (options.contentMode === 'clock_only') {
                setExportProgress('Montando folha do cronógrafo...');
                const isLandscape = options.orientation === 'horizontal';
                const pdf = new jsPDF({
                    orientation: isLandscape ? 'landscape' : 'portrait',
                    unit: 'mm',
                    format: 'a4',
                    compress: true
                });

                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();

                if (options.themeMode === 'light') {
                    pdf.setFillColor(255, 255, 255);
                } else {
                    pdf.setFillColor(8, 6, 18);
                }
                pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');

                // Cronograma grande ocupando a folha
                const mapSize = 202;
                const xOffset = (pdfWidth - mapSize) / 2;
                const yOffset = (pdfHeight - mapSize) / 2;

                pdf.addImage(clockImgData, 'PNG', xOffset, yOffset, mapSize, mapSize);
                if (props.isFreeTier) {
                    applyWatermark(pdf);
                    recordFreeExportUsed();
                }
                pdf.save(`cronografo-sideral-${options.orientation}-${options.themeMode}-${cityName}-${timestamp}.pdf`);
            } 
            // 2. VERTICAL COM DADOS (Tabelas têm maior relevância que o cronógrafo no topo)
            else if (options.orientation === 'vertical' && options.contentMode === 'with_data') {
                setExportProgress('Diagramando relatório com tabelas em destaque...');
                if (verticalDataRef.current) {
                    const img = verticalDataRef.current.querySelector('img');
                    if (img && clockImgData) img.src = clockImgData;
                }
                await new Promise(resolve => setTimeout(resolve, 400));

                if (verticalDataRef.current) {
                    const templateCanvas = await html2canvas(verticalDataRef.current, {
                        scale: 2.0,
                        useCORS: true,
                        backgroundColor: options.themeMode === 'light' ? '#ffffff' : '#06060a',
                        logging: false,
                        imageTimeout: 0,
                        width: 1200,
                        height: 1697,
                        windowWidth: 1200,
                        windowHeight: 1697
                    });

                    const pageImgData = templateCanvas.toDataURL('image/jpeg', 0.98);
                    const pdf = new jsPDF({
                        orientation: 'portrait',
                        unit: 'mm',
                        format: 'a4',
                        compress: true
                    });

                    pdf.addImage(pageImgData, 'JPEG', 0, 0, 210, 297);
                    if (props.isFreeTier) {
                        applyWatermark(pdf);
                        recordFreeExportUsed();
                    }
                    pdf.save(`relatorio-sideral-tabelas-${cityName}-${timestamp}.pdf`);
                }
            } 
            // 3. HORIZONTAL COM DADOS (Formatação widescreen vigente na tela)
            else if (options.orientation === 'horizontal' && options.contentMode === 'with_data') {
                setExportProgress('Diagramando formato panorâmico vigente...');
                if (horizontalDataRef.current) {
                    const img = horizontalDataRef.current.querySelector('img');
                    if (img && clockImgData) img.src = clockImgData;
                }
                await new Promise(resolve => setTimeout(resolve, 400));

                if (horizontalDataRef.current) {
                    const templateCanvas = await html2canvas(horizontalDataRef.current, {
                        scale: 2.0,
                        useCORS: true,
                        backgroundColor: options.themeMode === 'light' ? '#ffffff' : '#06060a',
                        logging: false,
                        imageTimeout: 0,
                        width: 1697,
                        height: 1200,
                        windowWidth: 1697,
                        windowHeight: 1200
                    });

                    const pageImgData = templateCanvas.toDataURL('image/jpeg', 0.98);
                    const pdf = new jsPDF({
                        orientation: 'landscape',
                        unit: 'mm',
                        format: 'a4',
                        compress: true
                    });

                    pdf.addImage(pageImgData, 'JPEG', 0, 0, 297, 210);
                    if (props.isFreeTier) {
                        applyWatermark(pdf);
                        recordFreeExportUsed();
                    }
                    pdf.save(`cronografo-sideral-panoramico-${cityName}-${timestamp}.pdf`);
                }
            }

            setIsModalOpen(false);
        } catch (error) {
            console.error('Erro na exportação do PDF:', error);
        } finally {
            props.onSetTheme(originalTheme);
            props.setShowAspectLines(originalShowAspectLines);
            setIsExporting(false);
            setExportProgress('');
        }
    };

    const exportChronographPDF = () => {
        setIsModalOpen(true);
    };

    const exportPDF = () => {
        setIsModalOpen(true);
    };

    const exportLegacyPDF = async () => {
        if (!props.clockRef.current || !props.celestialData) return;
        setIsExporting(true);
        setShowMenu(false);

        const originalTheme = props.theme;
        const originalShowAspectLines = props.showAspectLines;

        try {
            props.onSetTheme('light');
            props.setShowAspectLines(true);
            
            await new Promise(resolve => setTimeout(resolve, 700));

            let clockDataUrl = '';
            const clockCanvas = await html2canvas(props.clockRef.current, {
                scale: 3,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                onclone: (clonedDoc) => {
                    const el = clonedDoc.querySelector('.sidereal-clock-capture-container');
                    if (el instanceof HTMLElement) {
                        el.style.setProperty('max-height', 'none', 'important');
                        el.style.setProperty('max-width', 'none', 'important');
                        el.style.setProperty('height', '1200px', 'important');
                        el.style.setProperty('width', '1200px', 'important');
                        el.style.setProperty('transform', 'none', 'important');
                        el.style.setProperty('padding', '20px', 'important');
                        el.style.setProperty('display', 'flex', 'important');
                        el.style.setProperty('align-items', 'center', 'important');
                        el.style.setProperty('justify-content', 'center', 'important');
                        el.style.setProperty('background', '#ffffff', 'important');
                    }
                }
            });
            clockDataUrl = clockCanvas.toDataURL('image/jpeg', 0.98);

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: 'a4'
            });

            const margin = 36;
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            // Página 1: Cronograma Vertical Grande + Destaques Principais (Fundo Branco)
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, pageWidth, pageHeight, 'F');

            pdf.setTextColor(17, 24, 39);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(22);
            pdf.text('CRONÓGRAFO SIDERAL', margin, margin + 16);
            
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(9);
            pdf.setTextColor(107, 114, 128);
            const weekday = props.currentTime.toLocaleDateString('pt-BR', { weekday: 'long' });
            const dateStr = props.currentTime.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const timeStr = props.currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            pdf.text(`${props.location.displayName} · ${weekday}, ${dateStr} às ${timeStr}`, margin, margin + 30);

            // Badges no topo
            pdf.setDrawColor(229, 231, 235);
            pdf.setFillColor(249, 250, 251);
            pdf.roundedRect(pageWidth - margin - 230, margin + 4, 110, 24, 3, 3, 'FD');
            pdf.setFontSize(8);
            pdf.setTextColor(55, 65, 81);
            pdf.text(`Dia ${props.seasonInfo.day.toString().padStart(2, '0')} do ${props.seasonInfo.name}`, pageWidth - margin - 222, margin + 19);

            pdf.roundedRect(pageWidth - margin - 114, margin + 4, 114, 24, 3, 3, 'FD');
            const illumination = Math.round((1 - Math.cos(2 * Math.PI * props.moonPhaseValue)) / 2 * 100);
            pdf.text(`${props.moonPhase.name} · ${illumination}%`, pageWidth - margin - 106, margin + 19);

            // Imagem Grande do Cronograma Vertical
            const clockImgSize = 340;
            const clockX = (pageWidth - clockImgSize) / 2;
            const clockY = margin + 46;
            pdf.addImage(clockDataUrl, 'JPEG', clockX, clockY, clockImgSize, clockImgSize);

            // Tabelas / Sumário na base da Página 1
            const statsBoxY = clockY + clockImgSize + 16;
            pdf.setFillColor(248, 250, 252);
            pdf.setDrawColor(226, 232, 240);
            pdf.roundedRect(margin, statsBoxY, pageWidth - margin * 2, 80, 4, 4, 'FD');

            const PLANETS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
            const stats = { feminine: 0, masculine: 0, fire: 0, earth: 0, air: 0, water: 0, cardinal: 0, fixed: 0, mutable: 0 };
            PLANETS.forEach(id => {
                const lon = props.celestialData[`${id}EclipticLongitude` as keyof CelestialData] as number;
                if (typeof lon === 'number') {
                    const signIndex = Math.floor(lon / 30);
                    const sign = ZODIAC_DATA[signIndex];
                    if (sign) {
                        if (sign.polarity === 'masculine') stats.masculine++;
                        else stats.feminine++;
                        stats[sign.element as keyof typeof stats]++;
                        stats[sign.modality as keyof typeof stats]++;
                    }
                }
            });

            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8.5);
            pdf.setTextColor(71, 85, 105);
            pdf.text('DISTRIBUIÇÃO ELEMENTAL', margin + 16, statsBoxY + 18);
            pdf.text('EIXOS PRINCIPAIS', margin + 190, statsBoxY + 18);
            pdf.text('EFEMÉRIDES DO DIA', margin + 360, statsBoxY + 18);

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8);
            pdf.setTextColor(30, 41, 59);
            pdf.text(`Fogo: ${stats.fire} · Terra: ${stats.earth} · Ar: ${stats.air} · Água: ${stats.water}`, margin + 16, statsBoxY + 34);
            pdf.text(`Cardinal: ${stats.cardinal} · Fixo: ${stats.fixed} · Mutável: ${stats.mutable}`, margin + 16, statsBoxY + 48);
            pdf.text(`Masculino: ${stats.masculine} · Feminino: ${stats.feminine}`, margin + 16, statsBoxY + 62);

            const ascLon = props.celestialData.ascendant || props.houseCusps?.[0] || 0;
            const mcLon = props.celestialData.midheaven || props.houseCusps?.[9] || 0;
            const ascSign = ZODIAC_DATA[Math.floor(ascLon / 30)]?.name || '';
            const mcSign = ZODIAC_DATA[Math.floor(mcLon / 30)]?.name || '';
            pdf.text(`Ascendente (ASC): ${ascSign} ${formatDeg(ascLon)}`, margin + 190, statsBoxY + 34);
            pdf.text(`Meio do Céu (MC): ${mcSign} ${formatDeg(mcLon)}`, margin + 190, statsBoxY + 48);
            pdf.text(`Aspectos Ativos: ${props.filteredAspects?.length || 0}`, margin + 190, statsBoxY + 62);

            pdf.text(`Sol: ☼ ${props.sunriseTime || '--'} | ☾ ${props.sunsetTime || '--'}`, margin + 360, statsBoxY + 34);
            pdf.text(`Lua: ◴ ${props.moonriseTime || '--'} | ◵ ${props.moonsetTime || '--'}`, margin + 360, statsBoxY + 48);
            pdf.text(`Idade da Lua: ${getMoonAge(props.currentTime).toFixed(1)} dias`, margin + 360, statsBoxY + 62);

            // Rodapé Página 1
            pdf.setDrawColor(226, 232, 240);
            pdf.line(margin, pageHeight - 24, pageWidth - margin, pageHeight - 24);
            pdf.setFontSize(7);
            pdf.setTextColor(156, 163, 175);
            pdf.text('CRONÓGRAFO SIDERAL · PÁGINA 1 DE 3 (MAPA VISUAL)', margin, pageHeight - 12);
            pdf.text(`${dateStr} ${timeStr}`, pageWidth - margin, pageHeight - 12, { align: 'right' });

            // --- PÁGINA 2: TABELAS COMPLETAS DE ASTROS, CASAS E ASPECTOS ---
            pdf.addPage();
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, pageWidth, pageHeight, 'F');

            pdf.setTextColor(17, 24, 39);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(14);
            pdf.text('TABELAS DE EFEMÉRIDES E POSIÇÕES PLANETÁRIAS', margin, margin + 12);

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8);
            pdf.setTextColor(107, 114, 128);
            pdf.text(`${props.location.displayName} · ${dateStr} ${timeStr}`, margin, margin + 24);

            const ALL_BODIES = [
                'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
                'northNode', 'southNode', 'lilith', 'partOfFortune',
                'chiron', 'ceres', 'pallas', 'juno', 'vesta'
            ];

            const astroData: any[] = [];
            ALL_BODIES.forEach(id => {
                const lon = props.celestialData[`${id}EclipticLongitude` as keyof CelestialData] as number;
                if (typeof lon === 'number') {
                    const sign = ZODIAC_DATA[Math.floor(lon / 30)] || { name: '' };
                    const decan = getDecanDetails(lon);
                    const term = getTermDetails(lon);
                    const house = props.housePlacements[id] || 1;
                    astroData.push([
                        PLANET_SYMBOLS[id] || '',
                        PLANET_NAMES_FULL[id] || id,
                        ROMAN_NUMERALS[house - 1],
                        sign.name,
                        formatDeg(lon),
                        `${decan.index}º (${decan.ruler})`,
                        term.ruler,
                        props.retrogradeStatus[id] ? 'R' : 'D'
                    ]);
                }
            });

            autoTable(pdf, {
                startY: margin + 34,
                margin: { left: margin, right: margin },
                head: [['', 'ASTRO / PONTO', 'CASA', 'SIGNO', 'GRAUS', 'DECANATO', 'TERMO', 'MOV']],
                body: astroData,
                theme: 'striped',
                styles: { fontSize: 7, cellPadding: 3, textColor: [31, 41, 55] },
                headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 7 },
                columnStyles: {
                    0: { cellWidth: 16, halign: 'center' },
                    1: { fontStyle: 'bold' },
                    2: { halign: 'center', textColor: [100, 116, 139] },
                    4: { halign: 'right', font: 'courier' },
                    7: { halign: 'center', fontStyle: 'bold' }
                }
            });

            const houseData = HOUSE_ORDER_SEQ.map(i => {
                const cusp = props.houseCusps[i] || 0;
                const sign = ZODIAC_DATA[Math.floor(cusp / 30)] || { name: '' };
                const decan = getDecanDetails(cusp);
                const term = getTermDetails(cusp);
                return [HOUSE_LABELS[i], sign.name, formatDeg(cusp), `${decan.index}º (${decan.ruler})`, term.ruler];
            });

            const afterPlanetsY = (pdf as any).lastAutoTable.finalY + 14;

            autoTable(pdf, {
                startY: afterPlanetsY,
                margin: { left: margin },
                tableWidth: (pageWidth - margin * 2 - 12) / 2,
                head: [['CASA', 'SIGNO', 'CÚSPIDE', 'DECANATO', 'TERMO']],
                body: houseData,
                theme: 'striped',
                styles: { fontSize: 7, cellPadding: 2.5 },
                headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 7 },
                columnStyles: {
                    0: { fontStyle: 'bold' },
                    2: { halign: 'right', font: 'courier' }
                }
            });

            const aspectData = [...(props.filteredAspects || [])].sort((a, b) => a.orb - b.orb).slice(0, 16).map(a => {
                const s1 = ZODIAC_DATA[Math.floor(a.body1.longitude / 30)] || { name: '' };
                const s2 = ZODIAC_DATA[Math.floor(a.body2.longitude / 30)] || { name: '' };
                return [
                    PLANET_NAMES_FULL[a.body1.id] || a.body1.id,
                    ASPECT_ABBREV[a.type] || a.type.toUpperCase(),
                    PLANET_NAMES_FULL[a.body2.id] || a.body2.id,
                    `${a.orb.toFixed(2)}°`
                ];
            });

            autoTable(pdf, {
                startY: afterPlanetsY,
                margin: { left: margin + (pageWidth - margin * 2 - 12) / 2 + 12 },
                tableWidth: (pageWidth - margin * 2 - 12) / 2,
                head: [['CORPO 1', 'ASP', 'CORPO 2', 'ORBE']],
                body: aspectData,
                theme: 'striped',
                styles: { fontSize: 7, cellPadding: 2.5 },
                headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 7 },
                columnStyles: {
                    1: { halign: 'center', fontStyle: 'bold' },
                    3: { halign: 'right', font: 'courier' }
                }
            });

            // Rodapé Página 2
            pdf.setDrawColor(226, 232, 240);
            pdf.line(margin, pageHeight - 24, pageWidth - margin, pageHeight - 24);
            pdf.setFontSize(7);
            pdf.setTextColor(156, 163, 175);
            pdf.text('CRONÓGRAFO SIDERAL · PÁGINA 2 DE 3 (TABELAS DE EFEMÉRIDES)', margin, pageHeight - 12);
            pdf.text(`${dateStr} ${timeStr}`, pageWidth - margin, pageHeight - 12, { align: 'right' });

            // --- PÁGINA 3: PROMPT ESTRUTURADO PARA IA / CHAT AI ---
            pdf.addPage();
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, pageWidth, pageHeight, 'F');

            pdf.setTextColor(17, 24, 39);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(14);
            pdf.text('DADOS TÉCNICOS ESTRUTURADOS PARA CHAT AI', margin, margin + 12);

            pdf.setFont('courier', 'normal');
            pdf.setFontSize(7.5);
            pdf.setTextColor(31, 41, 55);
            
            const fullTechnicalText = buildChatAIText(props);
            const technicalLines: string[] = fullTechnicalText.split('\n');

            let yPos = margin + 30;
            technicalLines.forEach(line => {
                if (yPos > pageHeight - margin - 20) {
                    pdf.addPage();
                    pdf.setFillColor(255, 255, 255);
                    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
                    yPos = margin + 20;
                }
                pdf.text(line, margin, yPos);
                yPos += 10.5;
            });

            const timestamp = new Date().toISOString().replace(/[:.]/g, '').substring(0, 15).replace('T', '-');
            const cityName = props.location.displayName.split(',')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            pdf.save(`sideral-completo-${cityName}-${timestamp}.pdf`);
        } catch (error) {
            console.error('Error exporting PDF:', error);
        } finally {
            props.onSetTheme(originalTheme);
            props.setShowAspectLines(originalShowAspectLines);
            setIsExporting(false);
            setClockScreenshot('');
        }
    };

    const sharedOffscreenRenderers = typeof document !== 'undefined' ? createPortal(
        <>
            <div style={{ position: 'fixed', left: '-99999px', top: 0, pointerEvents: 'none', zIndex: -100 }}>
                <div ref={verticalDataRef} style={{ width: '1200px', height: '1697px', minWidth: '1200px', minHeight: '1697px', overflow: 'hidden' }}>
                    <VerticalDataTemplate
                        {...props}
                        clockScreenshot={clockScreenshot}
                        themeMode={renderThemeMode}
                    />
                </div>
                <div ref={horizontalDataRef} style={{ width: '1697px', height: '1200px', minWidth: '1697px', minHeight: '1200px', overflow: 'hidden' }}>
                    <HorizontalDataTemplate
                        {...props}
                        clockScreenshot={clockScreenshot}
                        themeMode={renderThemeMode}
                    />
                </div>
                <div ref={pdfRef}>
                    <PDFLayout {...props} clockScreenshot={clockScreenshot} />
                </div>
            </div>

            <ExportOptionsModal
                {...props}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirmExport={handleConfirmExport}
                isExporting={isExporting}
                exportProgress={exportProgress}
                onCopyChatAI={exportTechnicalData}
                copied={copied}
                currentTheme={props.theme}
                isFreeTier={props.isFreeTier}
                onOpenPaymentPlans={props.onOpenPaymentPlans}
            />
        </>,
        document.body
    ) : null;

    if (props.variant === 'sidebar') {
        return (
            <div ref={menuRef} className="group relative flex items-center justify-center">
                <div className="absolute right-full mr-2 pointer-events-none opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 ease-out z-50">
                    <div className={`px-2.5 h-7 flex items-center rounded-xl backdrop-blur-xl text-xs font-semibold whitespace-nowrap shadow-xl border ${
                        isLight ? 'bg-white/95 text-neutral-900 border-black/15' : 'bg-[#06060a]/95 text-white border-white/20'
                    }`}>
                        Exportar Relatório / PDF
                    </div>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    disabled={isExporting}
                    className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer active:scale-95 shrink-0 ${
                        isModalOpen
                            ? 'bg-blue-500 text-white shadow-[0_0_16px_rgba(37,99,235,0.8)] border border-blue-300 ring-2 ring-blue-400'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_14px_rgba(37,99,235,0.65)] border border-blue-400/60 hover:shadow-[0_0_20px_rgba(37,99,235,0.85)]'
                    }`}
                    title="Exportar PDF (Configurações e Prévia)"
                >
                    <i className="ti ti-download text-base font-bold" />
                </button>

                {sharedOffscreenRenderers}
            </div>
        );
    }

    if (props.variant === 'topbar') {
        return (
            <div ref={menuRef} className="relative inline-flex items-center gap-1 text-left">
                <button
                    onClick={() => setIsModalOpen(true)}
                    disabled={isExporting}
                    className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_0_16px_rgba(37,99,235,0.6)] border border-blue-400/60 flex items-center gap-1.5 px-3.5 sm:px-4 h-8 sm:h-8.5 rounded-full text-[11px] sm:text-xs font-bold active:scale-95 transition-all cursor-pointer shrink-0"
                    title="Exportar PDF (Configurar opções e prévia)"
                >
                    <i className="ti ti-download text-xs sm:text-sm font-bold" />
                    <span>{isExporting ? (exportProgress || t('chrono.generating')) : 'Exportar PDF'}</span>
                </button>

                <button
                    onClick={() => setShowMenu(!showMenu)}
                    disabled={isExporting}
                    className="h-8 sm:h-8.5 px-2 rounded-full border border-blue-400/50 bg-blue-600/30 text-white hover:bg-blue-600/50 transition-all flex items-center justify-center cursor-pointer shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                    title="Mais opções de exportação"
                >
                    <span className="text-[10px]">▾</span>
                </button>

                {showMenu && !isExporting && (
                    <div className={`absolute right-0 top-full mt-2 w-60 origin-top-right rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 text-xs z-[999] backdrop-blur-md border ${
                        isLight
                            ? 'bg-white/95 border-black/15 text-neutral-800 shadow-black/10'
                            : 'bg-[#06060a]/95 border-white/15 text-white shadow-black/40'
                    }`}>
                        <button
                            onClick={() => {
                                setIsModalOpen(true);
                                setShowMenu(false);
                            }}
                            className={`flex items-center gap-2 px-3 py-2 h-9 rounded-xl transition-all text-xs font-semibold cursor-pointer text-left w-full ${
                                isLight
                                    ? 'hover:bg-black/[0.04] text-neutral-700 hover:text-neutral-900'
                                    : 'hover:bg-white/[0.08] text-white/80 hover:text-white'
                            }`}
                        >
                            <span>⚙️ Configurar Exportação PDF</span>
                        </button>
                        <div className={`h-[1px] my-0.5 ${isLight ? 'bg-black/[0.06]' : 'bg-white/[0.07]'}`} />
                        <button
                            onClick={() => {
                                exportTechnicalData();
                                setShowMenu(false);
                            }}
                            className={`flex items-center gap-2 px-3 py-2 h-9 rounded-xl transition-all text-xs font-semibold cursor-pointer text-left w-full ${
                                isLight
                                    ? 'hover:bg-black/[0.04] text-neutral-700 hover:text-neutral-900'
                                    : 'hover:bg-white/[0.08] text-white/80 hover:text-white'
                            }`}
                        >
                            <span>📋 Exportar documento em texto</span>
                        </button>
                    </div>
                )}

                {sharedOffscreenRenderers}
            </div>
        );
    }

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setIsModalOpen(true)}
                disabled={isExporting}
                style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    fontFamily: 'Inter, system-ui, sans-serif',
                    cursor: isExporting ? 'not-allowed' : 'pointer',
                    transition: '0.2s',
                    border: '1px solid rgba(147, 197, 253, 0.6)',
                    boxShadow: '0 0 14px rgba(37, 99, 235, 0.6)',
                    opacity: isExporting ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                }}
                onMouseOver={(e) => !isExporting && (e.currentTarget.style.background = '#1d4ed8')}
                onMouseOut={(e) => !isExporting && (e.currentTarget.style.background = '#2563eb')}
            >
                <i className="ti ti-download" />
                <span>{isExporting ? (exportProgress || t('chrono.generating')) : 'Exportar PDF'}</span>
            </button>

            {sharedOffscreenRenderers}
        </div>
    );
};
