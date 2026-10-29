import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LocationSearchInput } from './LocationSearchInput';
import { SearchMoonPhase, Seasons } from 'astronomy-engine';
import { ZODIAC_ICONS } from './icons';
import { getMoonEmoji, NORTHERN_MOONS, SOUTHERN_MOONS, getYearCycleStart, getYearCycles } from '../lib/astrology/lunarCycles';
import { SIGN_DESCRIPTIONS } from './astro-descriptions';
import { calculateSunTropicalLongitude } from '../lib/astrology/celestialBodies';
import { ZODIAC_DATA } from './zodiac';
import { PlanetSphere } from './CelestialBodyPanel';

const SOLAR_SIGNS = [
  { name:'Áries',       id:'aries',       el:'fire',  ruler:'Marte',    start:[2,20], desc:'Energia pioneira e impulso criativo. Mês de novas iniciativas, coragem e liderança pessoal. Ação antes da reflexão.', strength:92 },
  { name:'Touro',       id:'taurus',      el:'earth', ruler:'Vênus',    start:[3,20], desc:'Estabilidade, prazer e construção. Período favorável para consolidar projetos e cuidar do corpo.', strength:76 },
  { name:'Gêmeos',      id:'gemini',      el:'air',   ruler:'Mercúrio', start:[4,21], desc:'Comunicação, curiosidade e troca de ideias. Excelente para aprender, viajar e conectar pessoas.', strength:84 },
  { name:'Câncer',      id:'cancer',      el:'water', ruler:'Lua',      start:[5,21], desc:'Sensibilidade, nutrição e memória afetiva. Tempo de cuidar do lar, das raízes e da vida emocional.', strength:68 },
  { name:'Leão',        id:'leo',         el:'fire',  ruler:'Sol',      start:[6,23], desc:'Expressão, criatividade e generosidade. Período de brilhar, liderar com o coração e celebrar a vida.', strength:95 },
  { name:'Virgem',      id:'virgo',       el:'earth', ruler:'Mercúrio', start:[7,23], desc:'Discernimento, serviço e aperfeiçoamento. Ótimo para organizar, analisar e aprimorar rotinas.', strength:72 },
  { name:'Libra',       id:'libra',       el:'air',   ruler:'Vênus',    start:[8,23], desc:'Equilíbrio, harmonia e relacionamentos. Favorável para parcerias, negociações e beleza.', strength:80 },
  { name:'Escorpião',   id:'scorpio',     el:'water', ruler:'Plutão',   start:[9,23], desc:'Profundidade, transformação e poder. Período para investigar e renascer de dentro para fora.', strength:88 },
  { name:'Sagitário',   id:'sagittarius', el:'fire',  ruler:'Júpiter',  start:[10,22],desc:'Expansão, filosofia e liberdade. Excelente para estudar, viajar e ampliar horizontes.', strength:90 },
  { name:'Capricórnio', id:'capricorn',   el:'earth', ruler:'Saturno',  start:[11,22],desc:'Disciplina, ambição e estrutura. Período de trabalho focado e planejamento de longo prazo.', strength:74 },
  { name:'Aquário',     id:'aquarius',    el:'air',   ruler:'Urano',    start:[0,20], desc:'Inovação, humanismo e ruptura. Tempo de colaborar em grupo e questionar padrões.', strength:82 },
  { name:'Peixes',      id:'pisces',      el:'water', ruler:'Netuno',   start:[1,19], desc:'Intuição, compaixão e dissolução. Favorável para arte, meditação e conexões com o sagrado.', strength:70 },
];

const ELEMENT_STYLES = {
  fire:  { bg:'rgba(239,80,50,0.18)',  border:'rgba(239,80,50,0.3)',  glow:'rgba(239,140,80,0.15)', fill:'#ef6644', text:'#FCA5A5' },
  earth: { bg:'rgba(100,180,60,0.15)', border:'rgba(100,180,60,0.28)',glow:'rgba(120,200,80,0.12)', fill:'#7ab648', text:'#86efac' },
  air:   { bg:'rgba(96,165,250,0.15)', border:'rgba(96,165,250,0.28)',glow:'rgba(120,180,255,0.12)',fill:'#60a5fa', text:'#bfdbfe' },
  water: { bg:'rgba(129,100,248,0.15)',border:'rgba(129,100,248,0.28)',glow:'rgba(160,120,255,0.12)',fill:'#818cf8', text:'#c7d2fe' },
};

const WEEK_PLANETS = [
  { cls:'sun',     sym:'☉', name:'DOM' },
  { cls:'moon',    sym:'☽', name:'SEG' },
  { cls:'mars',    sym:'♂', name:'TER' },
  { cls:'mercury', sym:'☿', name:'QUA' },
  { cls:'jupiter', sym:'♃', name:'QUI' },
  { cls:'venus',   sym:'♀', name:'SEX' },
  { cls:'saturn',  sym:'♄', name:'SÁB' },
];

export interface CalendarPanelProps {
    isOpen: boolean;
    onClose: () => void;
    currentDate: Date;
    onDateSelect: (date: Date) => void;
    variant?: 'purple' | 'gold';
    defaultView?: 'month' | 'year' | 'lunar' | 'solar';
    defaultLunarView?: 'annual' | 'monthly' | 'cycles';
    onlyYearView?: boolean;
    embedded?: boolean;
    onOpenFullCalendar?: () => void;
    locationName?: string;
    latitude?: number;
    onLocationChange?: (location: { latitude: number; longitude: number; displayName: string }) => void;
    theme?: 'dark' | 'light';
    savedMaps?: any[];
    onLoadMap?: (map: any) => void;
    isFreeTier?: boolean;
    isFreeTrial?: boolean;
    onOpenPaymentPlans?: () => void;
}

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MONTHS3 = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const WD = ['D','S','T','Q','Q','S','S'];
const WD_FULL = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const PLANET_GLYPHS = ['☉','☽','♂','☿','♃','♀','♄'];

const WEEKDAY_PLANET_CONFIG: Record<number, {
    name: string;
    abbr: string;
    glyph: string;
    stops: { offset: string; color: string }[];
    textColor: string;
}> = {
    0: { // Domingo - Sol
        name: 'Sol', abbr: 'DOM', glyph: '☉',
        stops: [{ offset: '0%', color: '#FFF' }, { offset: '35%', color: '#FFD700' }, { offset: '100%', color: '#FF8C00' }],
        textColor: '#000000',
    },
    1: { // Segunda - Lua
        name: 'Lua', abbr: 'SEG', glyph: '☽',
        stops: [{ offset: '0%', color: '#FFFFFF' }, { offset: '50%', color: '#CBD5E1' }, { offset: '100%', color: '#64748B' }],
        textColor: '#0F172A',
    },
    2: { // Terça - Marte
        name: 'Marte', abbr: 'TER', glyph: '♂',
        stops: [{ offset: '0%', color: '#FF7F50' }, { offset: '50%', color: '#EF4444' }, { offset: '100%', color: '#7F1D1D' }],
        textColor: '#FFFFFF',
    },
    3: { // Quarta - Mercúrio
        name: 'Mercúrio', abbr: 'QUA', glyph: '☿',
        stops: [{ offset: '0%', color: '#FFFFFF' }, { offset: '50%', color: '#94A3B8' }, { offset: '100%', color: '#334155' }],
        textColor: '#000000',
    },
    4: { // Quinta - Júpiter
        name: 'Júpiter', abbr: 'QUI', glyph: '♃',
        stops: [{ offset: '0%', color: '#FEF08A' }, { offset: '50%', color: '#F59E0B' }, { offset: '100%', color: '#78350F' }],
        textColor: '#000000',
    },
    5: { // Sexta - Vênus
        name: 'Vênus', abbr: 'SEX', glyph: '♀',
        stops: [{ offset: '0%', color: '#F472B6' }, { offset: '50%', color: '#C084FC' }, { offset: '100%', color: '#581C87' }],
        textColor: '#FFFFFF',
    },
    6: { // Sábado - Saturno
        name: 'Saturno', abbr: 'SÁB', glyph: '♄',
        stops: [{ offset: '0%', color: '#FEF3C7' }, { offset: '50%', color: '#EAB308' }, { offset: '100%', color: '#713F12' }],
        textColor: '#000000',
    },
};

const PlanetSphereIcon: React.FC<{ dow: number; size?: number }> = ({ dow, size = 18 }) => {
    const config = WEEKDAY_PLANET_CONFIG[dow] || WEEKDAY_PLANET_CONFIG[0];
    const gradId = `lunar-head-sphere-${dow}`;
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0 drop-shadow-md">
            <defs>
                <radialGradient id={gradId} cx="35%" cy="35%" r="65%">
                    {config.stops.map((s, i) => (
                        <stop key={i} offset={s.offset} stopColor={s.color} />
                    ))}
                </radialGradient>
            </defs>
            <circle cx="12" cy="12" r="11" fill={`url(#${gradId})`} />
            <circle cx="8.5" cy="8.5" r="3.5" fill="#FFFFFF" opacity="0.45" />
            <text
                x="12"
                y="12"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="12"
                fontWeight="900"
                fill={config.textColor}
                style={{ fontFamily: 'sans-serif' }}
            >
                {config.glyph}
            </text>
        </svg>
    );
};

export const MoonPhaseDisk: React.FC<{
    lunarDay?: number;
    phase?: number; // 0..1
    size?: number;
    className?: string;
}> = ({ lunarDay, phase, size = 24, className = '' }) => {
    const rawId = React.useId();
    const id = rawId.replace(/[^a-zA-Z0-9]/g, '');

    const f = useMemo(() => {
        if (phase !== undefined && phase !== null) {
            return ((phase % 1) + 1) % 1;
        }
        if (lunarDay !== undefined && lunarDay !== null) {
            return Math.max(0, Math.min(0.999, (lunarDay - 1) / 29.53));
        }
        return 0;
    }, [phase, lunarDay]);

    const shadowGradId = `moon-shadow-${id}`;
    const silverGradId = `moon-silver-${id}`;

    const R = 12;
    const cx = 16;
    const cy = 16;

    const pathD = useMemo(() => {
        if (f <= 0.015 || f >= 0.985) return '';

        if (f >= 0.485 && f <= 0.515) {
            return `M ${cx - R} ${cy} A ${R} ${R} 0 1 0 ${cx + R} ${cy} A ${R} ${R} 0 1 0 ${cx - R} ${cy} Z`;
        }

        const theta = f * 2 * Math.PI;
        const rx = Math.abs(R * Math.cos(theta));
        const topY = cy - R;
        const botY = cy + R;

        if (f < 0.5) {
            const outerArc = `M ${cx} ${topY} A ${R} ${R} 0 0 1 ${cx} ${botY}`;
            const sweep = f < 0.25 ? 0 : 1;
            const innerArc = `A ${rx.toFixed(2)} ${R} 0 0 ${sweep} ${cx} ${topY} Z`;
            return `${outerArc} ${innerArc}`;
        } else {
            const outerArc = `M ${cx} ${topY} A ${R} ${R} 0 0 0 ${cx} ${botY}`;
            const sweep = f < 0.75 ? 0 : 1;
            const innerArc = `A ${rx.toFixed(2)} ${R} 0 0 ${sweep} ${cx} ${topY} Z`;
            return `${outerArc} ${innerArc}`;
        }
    }, [f]);

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            className={`shrink-0 ${className}`}
            style={{ overflow: 'visible' }}
        >
            <defs>
                <radialGradient id={silverGradId} cx="35%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#FFFEEA" />
                    <stop offset="35%" stopColor="#FEF08A" />
                    <stop offset="70%" stopColor="#E2E8F0" />
                    <stop offset="100%" stopColor="#94A3B8" />
                </radialGradient>

                <radialGradient id={shadowGradId} cx="35%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#1E293B" stopOpacity="0.95" />
                    <stop offset="65%" stopColor="#0F172A" stopOpacity="0.98" />
                    <stop offset="100%" stopColor="#020617" stopOpacity="1" />
                </radialGradient>
            </defs>

            {/* Base dark moon sphere */}
            <circle
                cx={cx}
                cy={cy}
                r={R}
                fill={`url(#${shadowGradId})`}
                stroke="rgba(255, 255, 255, 0.22)"
                strokeWidth="0.8"
            />

            {/* Illuminated moon fraction */}
            {pathD && (
                <path
                    d={pathD}
                    fill={`url(#${silverGradId})`}
                />
            )}
        </svg>
    );
};
const SOLAR_INGRESSES = [
    { sign:'Áries',      glyph:'♈', month:2,  day:20, element:'fire'  },
    { sign:'Touro',      glyph:'♉', month:3,  day:20, element:'earth' },
    { sign:'Gêmeos',     glyph:'♊', month:4,  day:21, element:'air'   },
    { sign:'Câncer',     glyph:'♋', month:5,  day:21, element:'water' },
    { sign:'Leão',       glyph:'♌', month:6,  day:23, element:'fire'  },
    { sign:'Virgem',     glyph:'♍', month:7,  day:23, element:'earth' },
    { sign:'Libra',      glyph:'♎', month:8,  day:23, element:'air'   },
    { sign:'Escorpião',  glyph:'♏', month:9,  day:23, element:'water' },
    { sign:'Sagitário',  glyph:'♐', month:10, day:22, element:'fire'  },
    { sign:'Capricórnio',glyph:'♑', month:11, day:22, element:'earth' },
    { sign:'Aquário',    glyph:'♒', month:0,  day:20, element:'air'   },
    { sign:'Peixes',     glyph:'♓', month:1,  day:19, element:'water' },
];

const ELEMENT_COLORS: Record<string,{bg:string,border:string,dot:string,text:string}> = {
    fire:  { bg:'rgba(239,68,68,0.28)',   border:'rgba(239,68,68,0.5)',   dot:'#EF4444', text:'#FCA5A5' },
    earth: { bg:'rgba(52,211,153,0.28)',  border:'rgba(52,211,153,0.5)',  dot:'#34D399', text:'#6EE7B7' },
    air:   { bg:'rgba(254,243,199,0.22)', border:'rgba(254,243,199,0.45)',dot:'#FEF3C7', text:'#FDE68A' },
    water: { bg:'rgba(96,165,250,0.28)',  border:'rgba(96,165,250,0.5)',  dot:'#60A5FA', text:'#93C5FD' },
};

const ZODIAC_ICON_MAP: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
    'Áries':       ZODIAC_ICONS.aries,
    'Touro':       ZODIAC_ICONS.taurus,
    'Gêmeos':      ZODIAC_ICONS.gemini,
    'Câncer':      ZODIAC_ICONS.cancer,
    'Leão':        ZODIAC_ICONS.leo,
    'Virgem':      ZODIAC_ICONS.virgo,
    'Libra':       ZODIAC_ICONS.libra,
    'Escorpião':   ZODIAC_ICONS.scorpio,
    'Sagitário':   ZODIAC_ICONS.sagittarius,
    'Capricórnio': ZODIAC_ICONS.capricorn,
    'Aquário':     ZODIAC_ICONS.aquarius,
    'Peixes':      ZODIAC_ICONS.pisces,
};

const getCyclePhases = (totalDays: number = 29) => {
    const novaDays = [1, 2, 3, 4, 5, 6, 7];
    const crescenteDays = [8, 9, 10, 11, 12, 13, 14];
    const cheiaDays = [15, 16, 17, 18, 19, 20, 21];
    const minguanteDays: number[] = [];
    for (let d = 22; d <= totalDays; d++) {
        minguanteDays.push(d);
    }

    return [
        { icon:'🌑', name:'Nova',      range:'1–7',   days: novaDays },
        { icon:'🌓', name:'Crescente', range:'8–14',  days: crescenteDays },
        { icon:'🌕', name:'Cheia',     range:'15–21', days: cheiaDays },
        { icon:'🌗', name:'Minguante', range:`22–${totalDays}`, days: minguanteDays },
    ];
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const approxMoonPhase = (y: number, m: number, d: number) => {
    const diff = Math.round((new Date(y,m,d).getTime() - new Date(2000,0,6).getTime()) / 86400000);
    return ((diff % 29.53 + 29.53) % 29.53) / 29.53;
};

const moonIcon = (p: number) => {
    if (p < 0.04 || p >= 0.96) return '🌑';
    if (p < 0.21) return '🌒';
    if (p < 0.29) return '🌓';
    if (p < 0.46) return '🌔';
    if (p < 0.54) return '🌕';
    if (p < 0.71) return '🌖';
    if (p < 0.79) return '🌗';
    return '🌘';
};

const getMoonIconByDay = (d: number) => {
    if (d === 1)  return '🌑';
    if (d <= 7)   return '🌒';
    if (d === 8)  return '🌓';
    if (d <= 14)  return '🌔';
    if (d === 15) return '🌕';
    if (d <= 21)  return '🌖';
    if (d === 22) return '🌗';
    return '🌘';
};

const getSolarSign = (date: Date, year: number) => {
    // Constrói ingresses para o ano atual E o anterior (para cobrir Jan/Fev)
    const allIngresses = [
        ...SOLAR_INGRESSES.map(s => ({ ...s, ingressDate: new Date(year - 1, s.month, s.day) })),
        ...SOLAR_INGRESSES.map(s => ({ ...s, ingressDate: new Date(year, s.month, s.day) })),
    ].sort((a, b) => a.ingressDate.getTime() - b.ingressDate.getTime());

    let current = allIngresses[0];
    for (const ingress of allIngresses) {
        if (date >= ingress.ingressDate) current = ingress;
        else break;
    }
    return current;
};



// ─── MONTH BLOCK ─────────────────────────────────────────────────────────────

const MonthBlock: React.FC<{
    year: number; mi: number;
    selDay: number; selMonth: number; selYear: number;
    lunar?: boolean;
    accentClass: string;
    onSelect: (d: number, m: number) => void;
}> = ({ year, mi, selDay, selMonth, selYear, lunar, accentClass, onSelect }) => {
    const fd = new Date(year, mi, 1).getDay();
    const dim = new Date(year, mi + 1, 0).getDate();
    const today = new Date();
    return (
        <div>
            <p className="text-xs font-bold text-brand-text mb-2 font-manrope tracking-wide">{MONTHS[mi]}</p>
            <div className="grid grid-cols-7 gap-0.5">
                {WD.map((w,i) => <div key={i} className="text-center text-[10px] text-brand-text-muted pb-1 font-manrope">{w}</div>)}
                {Array.from({ length: fd }, (_,i) => <div key={`e${i}`} />)}
                {Array.from({ length: dim }, (_,i) => {
                    const d = i + 1;
                    const isSel = d === selDay && mi === selMonth && year === selYear;
                    const isToday = d === today.getDate() && mi === today.getMonth() && year === today.getFullYear();
                    if (lunar) {
                        return (
                            <div key={d} onClick={() => onSelect(d, mi)}
                                className={`text-center cursor-pointer py-0.5 rounded transition-colors hover:bg-brand-surface-highlight flex items-center justify-center ${isSel ? 'ring-1 ring-brand-purple bg-brand-purple/10' : ''}`}>
                                <MoonPhaseDisk phase={approxMoonPhase(year, mi, d)} size={13} />
                            </div>
                        );
                    }
                    return (
                        <div key={d} onClick={() => onSelect(d, mi)}
                            className={`text-center text-[13px] py-1 rounded cursor-pointer font-manrope font-medium transition-colors
                                ${isSel ? `${accentClass} text-white font-bold` : ''}
                                ${isToday && !isSel ? 'text-brand-orange font-bold' : ''}
                                ${!isSel && !isToday ? 'text-brand-text hover:bg-brand-surface-highlight' : ''}
                            `}>
                            {d}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ─── YEAR NAV ─────────────────────────────────────────────────────────────────

const YearNav: React.FC<{ year: number; onChange: (y: number) => void }> = ({ year, onChange }) => {
    const btn = (label: string, delta: number) => (
        <button onClick={() => onChange(Math.max(1, Math.min(2200, year + delta)))}
            className="px-2 py-1 rounded-lg text-[10px] font-manrope text-brand-text-muted border border-brand-border/10 hover:bg-brand-surface-highlight hover:text-brand-text transition-colors">
            {label}
        </button>
    );
    return (
        <div className="flex items-center justify-center gap-1.5 px-4 py-2.5 border-b border-brand-border/10 flex-wrap">
            {btn('−100',-100)}{btn('−10',-10)}
            <button onClick={() => onChange(Math.max(1, year - 1))}
                className="px-2.5 py-1 rounded-lg text-sm text-brand-text-muted border border-brand-border/10 hover:bg-brand-surface-highlight hover:text-brand-text transition-colors">◀</button>
            <input type="number" value={year}
                onChange={e => onChange(parseInt(e.target.value) || year)}
                onWheel={e => { e.preventDefault(); onChange(Math.max(1, Math.min(2200, year + (e.deltaY > 0 ? -1 : 1)))); }}
                className="w-20 text-center text-xl font-bold font-manrope bg-transparent border-none outline-none text-brand-text cursor-ns-resize"
                style={{ MozAppearance: 'textfield' } as any} />
            <button onClick={() => onChange(Math.min(2200, year + 1))}
                className="px-2.5 py-1 rounded-lg text-sm text-brand-text-muted border border-brand-border/10 hover:bg-brand-surface-highlight hover:text-brand-text transition-colors">▶</button>
            {btn('+10',10)}{btn('+100',100)}
            <button onClick={() => onChange(new Date().getFullYear())}
                className="px-2.5 py-1 rounded-lg text-[10px] font-manrope border border-brand-orange/30 text-brand-orange hover:bg-brand-orange/10 transition-colors">
                hoje
            </button>
        </div>
    );
};

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

const BRAZILIAN_STATES = [
    { uf: 'SP', name: 'São Paulo', capital: 'São Paulo, SP, Brasil', lat: -23.5505, lng: -46.6333 },
    { uf: 'RJ', name: 'Rio de Janeiro', capital: 'Rio de Janeiro, RJ, Brasil', lat: -22.9068, lng: -43.1729 },
    { uf: 'MG', name: 'Minas Gerais', capital: 'Belo Horizonte, MG, Brasil', lat: -19.9167, lng: -43.9345 },
    { uf: 'DF', name: 'Distrito Federal', capital: 'Brasília, DF, Brasil', lat: -15.7801, lng: -47.9292 },
    { uf: 'RS', name: 'Rio Grande do Sul', capital: 'Porto Alegre, RS, Brasil', lat: -30.0346, lng: -51.2177 },
    { uf: 'PR', name: 'Paraná', capital: 'Curitiba, PR, Brasil', lat: -25.4284, lng: -49.2733 },
    { uf: 'SC', name: 'Santa Catarina', capital: 'Florianópolis, SC, Brasil', lat: -27.5954, lng: -48.5480 },
    { uf: 'BA', name: 'Bahia', capital: 'Salvador, BA, Brasil', lat: -12.9777, lng: -38.5016 },
    { uf: 'PE', name: 'Pernambuco', capital: 'Recife, PE, Brasil', lat: -8.0476, lng: -34.8770 },
    { uf: 'CE', name: 'Ceará', capital: 'Fortaleza, CE, Brasil', lat: -3.7172, lng: -38.5433 },
    { uf: 'GO', name: 'Goiás', capital: 'Goiânia, GO, Brasil', lat: -16.6869, lng: -49.2648 },
    { uf: 'ES', name: 'Espírito Santo', capital: 'Vitória, ES, Brasil', lat: -20.3155, lng: -40.3128 },
    { uf: 'AM', name: 'Amazonas', capital: 'Manaus, AM, Brasil', lat: -3.1190, lng: -60.0217 },
    { uf: 'PA', name: 'Pará', capital: 'Belém, PA, Brasil', lat: -1.4558, lng: -48.4902 },
    { uf: 'MT', name: 'Mato Grosso', capital: 'Cuiabá, MT, Brasil', lat: -15.6010, lng: -56.0979 },
    { uf: 'MS', name: 'Mato Grosso do Sul', capital: 'Campo Grande, MS, Brasil', lat: -20.4697, lng: -54.6201 },
    { uf: 'MA', name: 'Maranhão', capital: 'São Luís, MA, Brasil', lat: -2.5307, lng: -44.3068 },
    { uf: 'PB', name: 'Paraíba', capital: 'João Pessoa, PB, Brasil', lat: -7.1195, lng: -34.8450 },
    { uf: 'RN', name: 'Rio Grande do Norte', capital: 'Natal, RN, Brasil', lat: -5.7945, lng: -35.2110 },
    { uf: 'AL', name: 'Alagoas', capital: 'Maceió, AL, Brasil', lat: -9.6658, lng: -35.7350 },
    { uf: 'SE', name: 'Sergipe', capital: 'Aracaju, SE, Brasil', lat: -10.9472, lng: -37.0731 },
    { uf: 'PI', name: 'Piauí', capital: 'Teresina, PI, Brasil', lat: -5.0892, lng: -42.8019 },
    { uf: 'TO', name: 'Tocantins', capital: 'Palmas, TO, Brasil', lat: -10.2491, lng: -48.3243 },
    { uf: 'RO', name: 'Rondônia', capital: 'Porto Velho, RO, Brasil', lat: -8.7619, lng: -63.9039 },
    { uf: 'AC', name: 'Acre', capital: 'Rio Branco, AC, Brasil', lat: -9.9754, lng: -67.8249 },
    { uf: 'AP', name: 'Amapá', capital: 'Macapá, AP, Brasil', lat: 0.0355, lng: -51.0705 },
    { uf: 'RR', name: 'Roraima', capital: 'Boa Vista, RR, Brasil', lat: 2.8235, lng: -60.6758 },
];

const DEFAULT_RECENT_LOCATIONS = [
    { displayName: 'São Paulo, SP, Brasil', latitude: -23.5505, longitude: -46.6333 },
    { displayName: 'Rio de Janeiro, RJ, Brasil', latitude: -22.9068, longitude: -43.1729 },
    { displayName: 'Brasília, DF, Brasil', latitude: -15.7801, longitude: -47.9292 },
    { displayName: 'Belo Horizonte, MG, Brasil', latitude: -19.9167, longitude: -43.9345 },
    { displayName: 'Lisboa, Portugal', latitude: 38.7223, longitude: -9.1393 },
];

export const CalendarPanel: React.FC<CalendarPanelProps> = ({
    isOpen, onClose, currentDate, onDateSelect,
    variant = 'purple', defaultView, defaultLunarView, onlyYearView = false, embedded = false,
    onOpenFullCalendar,
    locationName = '', latitude = 0, onLocationChange, theme = 'dark',
    savedMaps = [], onLoadMap,
    isFreeTier: isFreeTierProp = false,
    isFreeTrial = false,
    onOpenPaymentPlans
}) => {
    const isFreeTier = Boolean(isFreeTierProp || isFreeTrial);
    const accentClass = variant === 'gold' ? 'bg-yellow-500' : 'bg-brand-purple';
    const accentRing  = variant === 'gold' ? 'focus:ring-yellow-500' : 'focus:ring-brand-purple';
    const accentBtn   = variant === 'gold'
        ? 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-[0_0_15px_rgba(234,179,8,0.3)]'
        : 'bg-gradient-to-r from-[#FDE047] to-[#FB923C] text-[#03030a]';

    const [showUpgradeBanner, setShowUpgradeBanner] = useState(false);
    const [view, setView] = useState<'year'|'month'|'lunar'|'solar'>(
        onlyYearView ? 'year' : (isFreeTier && defaultView === 'year' ? 'month' : (defaultView as any) ?? (isFreeTier ? 'month' : 'year'))
    );
    const [lunarView, setLunarView] = useState<'annual'|'monthly'|'cycles'>(
        isFreeTier ? 'monthly' : (defaultLunarView ?? 'annual')
    );
    const [displayYear, setDisplayYear] = useState(currentDate.getFullYear());
    const [displayMonth, setDisplayMonth] = useState(currentDate.getMonth());
    const [isEditingLocation, setIsEditingLocation] = useState(false);
    const [showMapSelector, setShowMapSelector] = useState(false);
    const [dateInput, setDateInput] = useState('');
    const [timeInput, setTimeInput] = useState('');
    const [quickDateInput, setQuickDateInput] = useState('');
    const [selDay, setSelDay] = useState(currentDate.getDate());
    const [selMonth, setSelMonth] = useState(currentDate.getMonth());
    const [selYear, setSelYear] = useState(currentDate.getFullYear());

    const [recentLocations, setRecentLocations] = useState<{ displayName: string; latitude: number; longitude: number }[]>(() => {
        try {
            const saved = localStorage.getItem('cronografo_recent_locations');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return DEFAULT_RECENT_LOCATIONS;
    });

    const handleSelectLocation = (loc: { latitude: number; longitude: number; displayName: string }) => {
        if (onLocationChange) onLocationChange(loc);
        setIsEditingLocation(false);
        setRecentLocations(prev => {
            const filtered = prev.filter(item => item.displayName !== loc.displayName);
            const updated = [loc, ...filtered].slice(0, 8);
            try {
                localStorage.setItem('cronografo_recent_locations', JSON.stringify(updated));
            } catch (e) {}
            return updated;
        });
    };

    const prevIsOpen = useRef(false);
    const todayCellRef = useRef<HTMLDivElement>(null);
    const currentCycleRef = useRef<HTMLDivElement>(null);
    const contentScrollRef = useRef<HTMLDivElement>(null);

    const formatQuickDateTime = (raw: string): string => {
        const digits = raw.replace(/\D/g, '').slice(0, 12);
        if (digits.length === 0) return '';
        if (digits.length <= 2) return digits;
        if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
        if (digits.length <= 8) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
        if (digits.length <= 10) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)} às ${digits.slice(8)}`;
        return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)} às ${digits.slice(8, 10)}:${digits.slice(10, 12)}`;
    };

    useEffect(() => {
        if (isOpen && !prevIsOpen.current) {
            const d = currentDate;
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const yyyy = String(d.getFullYear());
            const hh = String(d.getHours()).padStart(2, '0');
            const min = String(d.getMinutes()).padStart(2, '0');

            setSelDay(d.getDate()); setSelMonth(d.getMonth()); setSelYear(d.getFullYear());
            setDisplayYear(d.getFullYear()); setDisplayMonth(d.getMonth());
            setDateInput(`${dd}/${mm}/${yyyy}`);
            setTimeInput(`${hh}:${min}`);
            setQuickDateInput(`${dd}/${mm}/${yyyy} às ${hh}:${min}`);
            if (defaultView && !onlyYearView) {
                if (isFreeTier && defaultView === 'year') setView('month');
                else setView(defaultView as any);
            } else if (isFreeTier && view === 'year') {
                setView('month');
            }
            if (defaultLunarView) {
                if (isFreeTier && (defaultLunarView === 'annual' || defaultLunarView === 'cycles')) setLunarView('monthly');
                else setLunarView(defaultLunarView);
            } else if (isFreeTier && lunarView !== 'monthly') {
                setLunarView('monthly');
            }
        }
        prevIsOpen.current = isOpen;
    }, [isOpen, defaultView, defaultLunarView, onlyYearView, currentDate, isFreeTier, view, lunarView]);

    useEffect(() => {
        if (isOpen && view === 'lunar' && lunarView === 'cycles') {
            const timer = setTimeout(() => {
                if (contentScrollRef.current && currentCycleRef.current) {
                    const containerRect = contentScrollRef.current.getBoundingClientRect();
                    const targetRect = currentCycleRef.current.getBoundingClientRect();
                    const offset = targetRect.top - containerRect.top + contentScrollRef.current.scrollTop - 10;
                    contentScrollRef.current.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
                }
            }, 120);
            return () => clearTimeout(timer);
        }
    }, [isOpen, view, lunarView, displayYear]);

    useEffect(() => {
    if (embedded) {
        setSelDay(currentDate.getDate());
        setSelMonth(currentDate.getMonth());
        setSelYear(currentDate.getFullYear());
    }
}, [currentDate, embedded]);

    // Ciclos lunares do ano exibido — memoizado pois é cálculo pesado
    const yearCycles = useMemo(() => {
        if (view !== 'lunar' || lunarView !== 'cycles') return [];
        return getYearCycles(displayYear, latitude);
    }, [displayYear, view, lunarView, latitude]);

    const handleDaySelect = (d: number, m: number) => {
        setSelDay(d); setSelMonth(m); setSelYear(displayYear);
        const dd = String(d).padStart(2,'0');
        const mm = String(m+1).padStart(2,'0');
        setDateInput(`${dd}/${mm}/${displayYear}`);
        setQuickDateInput(`${dd}/${mm}/${displayYear} às ${timeInput || '00:00'}`);
        const nd = new Date(currentDate);
        nd.setFullYear(displayYear, m, d);
        onDateSelect(nd);
    };

    const handleQuickDateChange = (val: string) => {
        const formatted = formatQuickDateTime(val);
        setQuickDateInput(formatted);
        const digits = val.replace(/\D/g, '').slice(0, 12);

        if (digits.length >= 8) {
            const d = parseInt(digits.slice(0, 2), 10);
            const m = parseInt(digits.slice(2, 4), 10);
            const y = parseInt(digits.slice(4, 8), 10);
            const h = digits.length >= 10 ? parseInt(digits.slice(8, 10), 10) : (timeInput ? parseInt(timeInput.slice(0, 2), 10) || 0 : 0);
            const min = digits.length >= 12 ? parseInt(digits.slice(10, 12), 10) : (timeInput ? parseInt(timeInput.slice(3, 5), 10) || 0 : 0);

            if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1 && y <= 3000 && h >= 0 && h <= 23 && min >= 0 && min <= 59) {
                setSelDay(d);
                setSelMonth(m - 1);
                setSelYear(y);
                setDisplayYear(y);
                setDisplayMonth(m - 1);
                setDateInput(`${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`);
                if (digits.length >= 10) {
                    setTimeInput(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
                }
                const nd = new Date(currentDate);
                nd.setFullYear(y, m - 1, d);
                nd.setHours(h, min, 0, 0);
                if (!isNaN(nd.getTime())) {
                    onDateSelect(nd);
                }
            }
        }
    };

    const handleApplyQuickDate = () => {
        const digits = quickDateInput.replace(/\D/g, '').slice(0, 12);
        if (digits.length >= 8) {
            const d = parseInt(digits.slice(0, 2), 10);
            const m = parseInt(digits.slice(2, 4), 10);
            const y = parseInt(digits.slice(4, 8), 10);
            const h = digits.length >= 10 ? parseInt(digits.slice(8, 10), 10) : (timeInput ? parseInt(timeInput.slice(0, 2), 10) || 0 : 0);
            const min = digits.length >= 12 ? parseInt(digits.slice(10, 12), 10) : (timeInput ? parseInt(timeInput.slice(3, 5), 10) || 0 : 0);

            if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1 && y <= 3000 && h >= 0 && h <= 23 && min >= 0 && min <= 59) {
                setSelDay(d);
                setSelMonth(m - 1);
                setSelYear(y);
                setDisplayYear(y);
                setDisplayMonth(m - 1);
                setDateInput(`${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`);
                setTimeInput(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
                const nd = new Date(currentDate);
                nd.setFullYear(y, m - 1, d);
                nd.setHours(h, min, 0, 0);
                if (!isNaN(nd.getTime())) {
                    onDateSelect(nd);
                }
            }
        }
    };

    const handleConfirm = () => {
        const [dd, mm, yyyy] = dateInput.split('/').map(Number);
        const [hh, min] = timeInput.split(':').map(Number);
        if (!dd || !mm || !yyyy) { onClose(); return; }
        const d = new Date(yyyy, mm-1, dd, hh||0, min||0, 0);
        if (!isNaN(d.getTime())) onDateSelect(d);
        onClose();
    };

    const handleDateInput = (val: string) => {
        let n = val.replace(/\D/g,'').slice(0,8);
        if (n.length > 4) n = n.slice(0,2)+'/'+n.slice(2,4)+'/'+n.slice(4);
        else if (n.length > 2) n = n.slice(0,2)+'/'+n.slice(2);
        setDateInput(n);
        if (n.length === 10) {
            const d=parseInt(n.slice(0,2)), m=parseInt(n.slice(3,5))-1, y=parseInt(n.slice(6,10));
            setSelDay(d); setSelMonth(m); setSelYear(y);
            setDisplayYear(y); setDisplayMonth(m);
            setQuickDateInput(`${n} às ${timeInput || '00:00'}`);
            const nd = new Date(currentDate); nd.setFullYear(y,m,d); onDateSelect(nd);
            document.getElementById('cal-time-inp')?.focus();
        }
    };

    const handleTimeInput = (val: string) => {
        let n = val.replace(/\D/g,'').slice(0,4);
        if (n.length > 2) n = n.slice(0,2)+':'+n.slice(2);
        setTimeInput(n);
        if (n.length === 5) {
            const nd = new Date(currentDate);
            nd.setHours(parseInt(n.slice(0,2)), parseInt(n.slice(3,5)), 0);
            if (dateInput.length === 10) {
                setQuickDateInput(`${dateInput} às ${n}`);
            }
            onDateSelect(nd);
        }
    };

    if (!isOpen) return null;

    // ── Coluna direita ────────────────────────────────────────────────────────
    const rightCol = (
        <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden">

            {/* Cabeçalho compacto fixo: Abas Principais + Sub-abas + Controlador de Ano à Direita (Sempre em linha única) */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-brand-border/15 gap-1.5 shrink-0 bg-brand-surface/95 backdrop-blur-md sticky top-0 z-20 shadow-xs min-w-0">
                <div className="flex items-center gap-1.5 min-w-0 flex-nowrap overflow-x-auto no-scrollbar">
                    {onOpenFullCalendar && (
                        <button
                            onClick={onOpenFullCalendar}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[11px] font-bold transition-all active:scale-95 cursor-pointer shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.15)] whitespace-nowrap"
                            title="Ver calendário completo em tela cheia"
                        >
                            <i className="ti ti-maximize text-[11px]" />
                            <span className="hidden sm:inline">Completo</span>
                        </button>
                    )}
                    {!onlyYearView && (
                        <div className="flex items-center gap-1 shrink-0 flex-nowrap">
                            {(['year','month','lunar','solar'] as const).map(t => {
                                const isYearLocked = isFreeTier && t === 'year';
                                return (
                                    <button 
                                        key={t} 
                                        onClick={() => {
                                            if (isYearLocked) {
                                                setShowUpgradeBanner(true);
                                                onOpenPaymentPlans?.();
                                                return;
                                            }
                                            setView(t);
                                        }}
                                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold font-manrope uppercase tracking-wider transition-colors shrink-0 whitespace-nowrap flex items-center gap-1
                                            ${view===t ? 'bg-brand-surface-highlight text-brand-text border border-brand-border/20 shadow-sm' : 'text-brand-text-muted hover:text-brand-text'}`}
                                        title={isYearLocked ? "Visão anual completa disponível nos Planos Mensal e Vitalício" : undefined}
                                    >
                                        <span>{t==='year'?'Ano':t==='month'?'Mês':t==='lunar'?'Lunar':'Solar'}</span>
                                        {isYearLocked && <span className="text-[9px] text-[#D4AF37]">🔒</span>}
                                    </button>
                                );
                            })}

                            {/* Sub-abas lunar integradas na barra */}
                            {view === 'lunar' && (
                                <div className="flex items-center gap-0.5 ml-1 pl-1.5 border-l border-brand-border/15 shrink-0">
                                    {([['annual','Anual'],['monthly','Mensal'],['cycles','Ciclos']] as const).map(([v,label]) => {
                                        const isSubLocked = isFreeTier && (v === 'annual' || v === 'cycles');
                                        return (
                                            <button 
                                                key={v} 
                                                onClick={() => {
                                                    if (isSubLocked) {
                                                        setShowUpgradeBanner(true);
                                                        onOpenPaymentPlans?.();
                                                        return;
                                                    }
                                                    setLunarView(v);
                                                }}
                                                className={`px-1.5 py-0.5 rounded text-[10px] font-manrope transition-colors border shrink-0 whitespace-nowrap flex items-center gap-0.5
                                                    ${lunarView===v ? 'bg-brand-purple/20 text-brand-text border-brand-purple/40 font-semibold' : 'text-brand-text-muted border-transparent hover:text-brand-text'}`}
                                                title={isSubLocked ? "Visão de todos os ciclos e anos disponível nos Planos Mensal e Vitalício" : undefined}
                                            >
                                                <span>{label}</span>
                                                {isSubLocked && <span className="text-[8px] text-[#D4AF37]">🔒</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Controlador de Ano / Tempo no lado direito: compacto, sem quebra */}
                {view !== 'solar' && (
                    <div className="flex items-center gap-0.5 shrink-0 bg-brand-surface-highlight/70 px-1.5 py-0.5 rounded-lg border border-brand-border/15 ml-auto">
                        <button
                            onClick={() => {
                                if (isFreeTier) {
                                    setShowUpgradeBanner(true);
                                    onOpenPaymentPlans?.();
                                    return;
                                }
                                setDisplayYear(y => Math.max(1, y - 1));
                            }}
                            className="px-1 py-0.5 text-[10px] text-brand-text-muted hover:text-brand-text hover:bg-white/5 rounded"
                            title={isFreeTier ? "Navegação em outros anos disponível no Plano Mensal e Vitalício" : "Ano anterior"}
                        >
                            ◀
                        </button>
                        <input
                            type="number"
                            value={displayYear}
                            onChange={e => {
                                if (isFreeTier) {
                                    setShowUpgradeBanner(true);
                                    onOpenPaymentPlans?.();
                                    return;
                                }
                                setDisplayYear(parseInt(e.target.value) || displayYear);
                            }}
                            onWheel={e => { 
                                e.preventDefault(); 
                                if (isFreeTier) {
                                    setShowUpgradeBanner(true);
                                    onOpenPaymentPlans?.();
                                    return;
                                }
                                setDisplayYear(y => Math.max(1, Math.min(2200, y + (e.deltaY > 0 ? -1 : 1)))); 
                            }}
                            className="w-11 text-center text-[11px] font-bold font-mono bg-transparent border-none outline-none text-brand-text p-0"
                            readOnly={isFreeTier}
                        />
                        <button
                            onClick={() => {
                                if (isFreeTier) {
                                    setShowUpgradeBanner(true);
                                    onOpenPaymentPlans?.();
                                    return;
                                }
                                setDisplayYear(y => Math.min(2200, y + 1));
                            }}
                            className="px-1 py-0.5 text-[10px] text-brand-text-muted hover:text-brand-text hover:bg-white/5 rounded"
                            title={isFreeTier ? "Navegação em outros anos disponível no Plano Mensal e Vitalício" : "Próximo ano"}
                        >
                            ▶
                        </button>
                        <button
                            onClick={() => setDisplayYear(new Date().getFullYear())}
                            className="ml-0.5 px-1 py-0.5 text-[9px] font-bold uppercase text-brand-orange hover:bg-brand-orange/10 rounded transition-colors"
                            title="Ir para o ano atual"
                        >
                            hoje
                        </button>
                        <div className="h-3 w-px bg-white/10 mx-0.5" />
                        <button
                            onClick={onClose}
                            className="p-1 text-brand-text-muted hover:text-brand-text hover:bg-white/10 rounded transition-colors"
                            title="Minimizar Calendário Lunar"
                        >
                            <i className="ti ti-minus text-xs" />
                        </button>
                    </div>
                )}
            </div>

            {/* Aviso de Upgrade em Caso de Ação Restrita */}
            {showUpgradeBanner && isFreeTier && (
                <div className="mx-3 my-2 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shrink-0 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-bold">🔒 Recurso dos Planos Mensal & Vitalício:</span>
                        <span className="text-[11px]">
                            No Plano Gratuito, o <strong>mês vigente solar</strong> e <strong>mês vigente lunar</strong> estão liberados. A visão anual e ciclos de outros anos são exclusivos para assinantes.
                        </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-auto">
                        {onOpenPaymentPlans && (
                            <button
                                onClick={onOpenPaymentPlans}
                                className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#F5D98A] text-black font-bold text-[11px] shadow-sm hover:opacity-95 cursor-pointer"
                            >
                                Ver Planos
                            </button>
                        )}
                        <button
                            onClick={() => setShowUpgradeBanner(false)}
                            className="text-amber-300 hover:text-white text-xs px-1 cursor-pointer"
                            title="Fechar aviso"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Conteúdo rolável verticalmente */}
            <div ref={contentScrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 custom-scrollbar">

                {/* Ano */}
                {view === 'year' && (
                    <div className="grid grid-cols-3 gap-6">
                        {Array.from({length:12},(_,mi) => (
                            <MonthBlock key={mi} year={displayYear} mi={mi}
                                selDay={selDay} selMonth={selMonth} selYear={selYear}
                                accentClass={accentClass} onSelect={handleDaySelect} />
                        ))}
                    </div>
                )}

                {/* Mês */}
                {view === 'month' && (() => {
                    const fd = new Date(displayYear, displayMonth, 1).getDay();
                    const dim = new Date(displayYear, displayMonth+1, 0).getDate();
                    const today = new Date();
                    return (
                        <div>
                            <div className="flex items-center gap-3 mb-5">
                                <button 
                                    onClick={() => { 
                                        if (isFreeTier) {
                                            setShowUpgradeBanner(true);
                                            onOpenPaymentPlans?.();
                                            return;
                                        }
                                        const d=new Date(displayYear,displayMonth-1,1); 
                                        setDisplayYear(d.getFullYear()); 
                                        setDisplayMonth(d.getMonth()); 
                                    }}
                                    className="px-3 py-1.5 rounded-lg border border-brand-border/10 text-brand-text-muted hover:bg-brand-surface-highlight hover:text-brand-text transition-colors text-sm"
                                    title={isFreeTier ? "Navegação em outros meses disponível nos Planos Mensal e Vitalício" : "Mês anterior"}
                                >
                                    ◀
                                </button>
                                <div className="flex-1 text-center">
                                    <span className="text-base font-semibold text-brand-text font-manrope">{MONTHS[displayMonth]} {displayYear}</span>
                                    {isFreeTier && (
                                        <span className="ml-2 text-[10px] font-mono font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                                            Mês Vigente (Free)
                                        </span>
                                    )}
                                </div>
                                <button 
                                    onClick={() => { 
                                        if (isFreeTier) {
                                            setShowUpgradeBanner(true);
                                            onOpenPaymentPlans?.();
                                            return;
                                        }
                                        const d=new Date(displayYear,displayMonth+1,1); 
                                        setDisplayYear(d.getFullYear()); 
                                        setDisplayMonth(d.getMonth()); 
                                    }}
                                    className="px-3 py-1.5 rounded-lg border border-brand-border/10 text-brand-text-muted hover:bg-brand-surface-highlight hover:text-brand-text transition-colors text-sm"
                                    title={isFreeTier ? "Navegação em outros meses disponível nos Planos Mensal e Vitalício" : "Próximo mês"}
                                >
                                    ▶
                                </button>
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {WD.map((w,i) => <div key={i} className="text-center text-[11px] text-brand-text-muted font-manrope pb-2">{w}</div>)}
                                {Array.from({length:fd},(_,i) => <div key={`e${i}`} />)}
                                {Array.from({length:dim},(_,i) => {
                                    const d=i+1;
                                    const isSel=d===selDay&&displayMonth===selMonth&&displayYear===selYear;
                                    const isToday=d===today.getDate()&&displayMonth===today.getMonth()&&displayYear===today.getFullYear();
                                    return (
                                        <div key={d} onClick={() => handleDaySelect(d,displayMonth)}
                                            className={`text-center text-sm py-2 rounded-lg cursor-pointer font-manrope transition-colors
                                                ${isSel ? `${accentClass} text-white font-semibold` : ''}
                                                ${isToday && !isSel ? 'text-brand-orange font-semibold' : ''}
                                                ${!isSel && !isToday ? 'text-brand-text-muted hover:bg-brand-surface-highlight hover:text-brand-text' : ''}
                                            `}>
                                            {d}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}

                {/* Lunar — Anual */}
                {view === 'lunar' && lunarView === 'annual' && (
                    <div className="grid grid-cols-3 gap-6">
                        {Array.from({length:12},(_,mi) => {
                            const isCurrentMonth = mi === new Date().getMonth() && displayYear === new Date().getFullYear();
                            const isMonthLocked = isFreeTier && !isCurrentMonth;
                            return (
                                <div 
                                    key={mi} 
                                    className="relative rounded-2xl overflow-hidden transition-all"
                                    onClick={() => {
                                        if (isMonthLocked) {
                                            setShowUpgradeBanner(true);
                                            onOpenPaymentPlans?.();
                                        }
                                    }}
                                >
                                    <div style={{ filter: isMonthLocked ? 'blur(3.5px)' : 'none', opacity: isMonthLocked ? 0.35 : 1 }}>
                                        <MonthBlock year={displayYear} mi={mi}
                                            selDay={selDay} selMonth={selMonth} selYear={selYear}
                                            lunar accentClass={accentClass} onSelect={isMonthLocked ? () => { setShowUpgradeBanner(true); onOpenPaymentPlans?.(); } : handleDaySelect} />
                                    </div>
                                    {isMonthLocked && (
                                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] p-2 text-center cursor-pointer hover:bg-black/50 transition-colors">
                                            <span className="text-[10px] font-bold text-amber-300 bg-black/85 px-2.5 py-1 rounded-full border border-amber-500/40 shadow-md flex items-center gap-1.5">
                                                <i className="ti ti-lock text-[10px]" /> {MONTHS3[mi]} · Plano Pro
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Lunar — Mensal (tabela por linha) */}
                {view === 'lunar' && lunarView === 'monthly' && (
                    <div className="h-full overflow-x-auto overflow-y-hidden"
                        style={{ scrollbarWidth: 'thin' }}
                        onWheel={e => {
                            if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
                                e.currentTarget.scrollLeft += e.deltaY;
                                e.preventDefault();
                            }
                        }}>
                        <table style={{ borderCollapse:'collapse', width:'100%', tableLayout:'fixed' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign:'left', minWidth:'56px', paddingRight:'12px', paddingBottom:'10px', fontSize:'12px', fontWeight:600, fontFamily:"'DM Sans',sans-serif", borderRight:'1px solid rgba(255,255,255,0.12)', borderBottom:'0.5px solid rgba(255,255,255,0.08)', color:'var(--tw-prose-headings)' }} />
                                    {Array.from({length:31},(_,i) => (
                                        <th key={i} style={{ textAlign:'center', paddingBottom:'10px', fontSize:'12px', fontWeight:600, fontFamily:"'DM Sans',sans-serif", borderRight:'0.5px solid rgba(255,255,255,0.06)', borderBottom:'0.5px solid rgba(255,255,255,0.08)' }}>
                                            {i+1}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({length:12},(_,mi) => {
                                    const dim = new Date(displayYear,mi+1,0).getDate();
                                    const isCurrentMonth = mi === new Date().getMonth() && displayYear === new Date().getFullYear();
                                    const isRowLocked = isFreeTier && !isCurrentMonth;

                                    return (
                                        <tr 
                                            key={mi} 
                                            style={{ 
                                                borderBottom:'0.5px solid rgba(255,255,255,0.06)',
                                                backgroundColor: isRowLocked ? 'rgba(0,0,0,0.18)' : 'transparent'
                                            }}
                                            className={isRowLocked ? "hover:bg-white/[0.03] transition-colors cursor-pointer" : ""}
                                            onClick={() => {
                                                if (isRowLocked) {
                                                    setShowUpgradeBanner(true);
                                                    onOpenPaymentPlans?.();
                                                }
                                            }}
                                        >
                                            <td style={{ fontSize:'13px', fontWeight:600, fontFamily:"'DM Sans',sans-serif", padding:'9px 12px 9px 0', whiteSpace:'nowrap', borderRight:'1px solid rgba(255,255,255,0.12)', cursor: isRowLocked ? 'pointer' : 'default' }}>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={isRowLocked ? "text-white/70" : "text-white"}>{MONTHS3[mi]}</span>
                                                    {isCurrentMonth && isFreeTier && (
                                                        <span className="text-[9px] font-bold text-amber-400 bg-amber-400/20 px-1.5 py-0.2 rounded border border-amber-400/30">
                                                            Vigente
                                                        </span>
                                                    )}
                                                    {isRowLocked && (
                                                        <span className="text-[10px] text-[#D4AF37] flex items-center gap-0.5 font-normal px-1 py-0.2 rounded bg-amber-500/10 border border-amber-500/20" title="Disponível nos Planos Mensal e Vitalício">
                                                            <i className="ti ti-lock text-[9px]" />
                                                            <span className="text-[8px] font-bold hidden sm:inline">PRO</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            {Array.from({length:31},(_,di) => {
                                                const d=di+1;
                                                const isSel=d===selDay&&mi===selMonth&&displayYear===selYear;
                                                if (d>dim) return <td key={d} style={{ borderRight:'0.5px solid rgba(255,255,255,0.06)' }} />;
                                                return (
                                                    <td key={d} onClick={(e) => {
                                                        if (isRowLocked) {
                                                            e.stopPropagation();
                                                            setShowUpgradeBanner(true);
                                                            onOpenPaymentPlans?.();
                                                            return;
                                                        }
                                                        handleDaySelect(d,mi);
                                                    }}
                                                        style={{ textAlign:'center', fontSize:'14px', cursor: isRowLocked ? 'pointer' : 'pointer', padding:'9px 0',
                                                            borderRight:'0.5px solid rgba(255,255,255,0.06)',
                                                            background: isSel ? 'rgb(var(--color-brand-purple) / 0.15)' : 'transparent',
                                                            filter: isRowLocked ? 'blur(3.5px)' : 'none',
                                                            opacity: isRowLocked ? 0.35 : 1,
                                                            userSelect: isRowLocked ? 'none' : 'auto',
                                                            outline: isSel ? '1.5px solid rgb(var(--color-brand-purple))' : 'none',
                                                            outlineOffset:'-1px', transition:'all 0.15s' }}
                                                        title={isRowLocked ? "Mês lunar bloqueado no Plano Free. Clique para desbloquear." : undefined}
                                                        onMouseEnter={e => { if(!isSel && !isRowLocked)(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)'; }}
                                                        onMouseLeave={e => { if(!isSel)(e.currentTarget as HTMLElement).style.background='transparent'; }}>
                                                        <div className="flex items-center justify-center pointer-events-none">
                                                            <MoonPhaseDisk phase={approxMoonPhase(displayYear,mi,d)} size={18} />
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Lunar — Ciclos Celtas */}
                {view === 'lunar' && lunarView === 'cycles' && (
                    <div className="flex flex-col gap-5">
                        {yearCycles.map((cycle, ci) => {
                            const cycleLabel = `${cycle.start.getDate()} ${MONTHS3[cycle.start.getMonth()]} ${cycle.start.getFullYear()}`;
                            const nextCycle = yearCycles[ci + 1];
                            const now = new Date();
                            const isCurrentCycle = now >= cycle.start && (!nextCycle || now < nextCycle.start);
                            const isCycleLocked = isFreeTier && !isCurrentCycle;
                            return (
                                <div 
                                    key={ci} 
                                    ref={isCurrentCycle ? currentCycleRef : null} 
                                    className={`rounded-2xl border border-brand-border/10 overflow-hidden scroll-mt-4 relative ${isCycleLocked ? 'cursor-pointer hover:border-amber-500/30 transition-colors' : ''}`}
                                    onClick={isCycleLocked ? () => { setShowUpgradeBanner(true); onOpenPaymentPlans?.(); } : undefined}
                                >
                                    {/* Header do ciclo */}
                                    <div className="flex items-center gap-3 px-4 py-3 border-b border-brand-border/10 bg-brand-surface-highlight/20">
                                        <span className="text-xl">{cycle.emoji || '🌑'}</span>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-brand-text font-manrope flex items-center gap-2">
                                                <span>{cycle.name}</span>
                                                {isCurrentCycle && isFreeTier && (
                                                    <span className="text-[9px] font-bold text-amber-400 bg-amber-400/20 px-1.5 py-0.2 rounded border border-amber-400/30">
                                                        Ciclo Vigente
                                                    </span>
                                                )}
                                                {isCycleLocked && (
                                                    <span className="text-[10px] text-[#D4AF37] flex items-center gap-0.5 font-normal px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20" title="Disponível nos Planos Mensal e Vitalício">
                                                        <i className="ti ti-lock text-[9px]" />
                                                        <span className="text-[8px] font-bold">PRO</span>
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-[10px] text-brand-text-muted font-manrope">Ciclo {cycle.index} · Lua Nova · {cycleLabel}</p>
                                        </div>
                                    </div>

                                    {/* Grade do Ciclo Lunar (4 Fases / 4 Semanas de tamanho exato de acordo com a mecânica orbital) */}
                                    <div style={{ filter: isCycleLocked ? 'blur(3.5px)' : 'none', opacity: isCycleLocked ? 0.35 : 1 }}>
                                    {(() => {
                                        const phases = cycle.phases || getCyclePhases(cycle.totalDays || 29);
                                        const maxCols = Math.max(7, ...phases.map(p => p.days.length));

                                        return (
                                            <div className="w-full overflow-x-auto no-scrollbar">
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: `50px repeat(${maxCols}, minmax(0, 1fr))`,
                                                    width: '100%',
                                                    minWidth: `${50 + maxCols * 44}px`
                                                }}>
                                                    {/* Dia da semana fica dentro de cada célula (não num cabeçalho
                                                        único): cada fase tem 6–8 dias e começa num dia da semana
                                                        diferente, então uma linha de cabeçalho só acertaria a 1ª fase. */}

                                                    {/* Exatamente 4 Fases (Nova, Crescente, Cheia, Minguante) */}
                                                    {phases.map(phase => (
                                                        <React.Fragment key={phase.name}>
                                                            {/* Label da fase */}
                                                            <div style={{
                                                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                                padding: '8px 4px', background: 'rgba(0,0,0,0.2)',
                                                                borderRight: '1px solid rgba(255,255,255,0.10)',
                                                                borderBottom: '0.5px solid rgba(255,255,255,0.06)',
                                                                textAlign: 'center',
                                                            }}>
                                                                <div className="mb-1">
                                                                    <MoonPhaseDisk lunarDay={phase.days[0]} size={18} />
                                                                </div>
                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted font-manrope leading-tight">{phase.name}</span>
                                                            </div>

                                                            {/* Células de cada dia da fase */}
                                                            {Array.from({ length: maxCols }, (_, di) => {
                                                                const lunarDay = di < phase.days.length ? phase.days[di] : null;

                                                                if (lunarDay === null) {
                                                                    return (
                                                                        <div key={`${phase.name}-empty-${di}`} style={{
                                                                            borderRight: di === maxCols - 1 ? 'none' : '0.5px solid rgba(255,255,255,0.06)',
                                                                            borderBottom: '0.5px solid rgba(255,255,255,0.06)',
                                                                            background: 'rgba(0,0,0,0.08)',
                                                                        }} />
                                                                    );
                                                                }

                                                                const date = new Date(cycle.start);
                                                                date.setDate(cycle.start.getDate() + lunarDay - 1);
                                                                const solarSign = getSolarSign(date, date.getFullYear());
                                                                const ec = ELEMENT_COLORS[solarSign.element];
                                                                const isToday = date.toDateString() === new Date().toDateString();
                                                                const isSel = date.getDate() === selDay && date.getMonth() === selMonth && date.getFullYear() === selYear;
                                                                const dow = date.getDay();
                                                                const dowConfig = WEEKDAY_PLANET_CONFIG[dow];

                                                                return (
                                                                    <div key={`${phase.name}-${lunarDay}`}
                                                                        ref={isToday ? todayCellRef : null}
                                                                        onClick={() => handleDaySelect(date.getDate(), date.getMonth())}
                                                                        style={{
                                                                            padding: '5px 3px', display: 'flex', flexDirection: 'column',
                                                                            alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
                                                                            borderRight: di === maxCols - 1 ? 'none' : '0.5px solid rgba(255,255,255,0.06)',
                                                                            borderBottom: '0.5px solid rgba(255,255,255,0.06)',
                                                                            background: isSel ? 'rgb(var(--color-brand-purple) / 0.18)' : isToday ? 'rgba(251,146,60,0.08)' : ec.bg.replace('0.15','0.20').replace('0.10','0.14'),
                                                                            outline: isSel ? '1.5px solid rgb(var(--color-brand-purple))' : isToday ? '1.5px solid #FB923C' : 'none',
                                                                            outlineOffset: '-1px',
                                                                            transition: 'filter 0.1s',
                                                                            minHeight: '68px',
                                                                            boxSizing: 'border-box',
                                                                        }}
                                                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.filter='brightness(1.2)'}
                                                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.filter='none'}
                                                                    >
                                                                        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                                                                            <span className="text-[9.5px] font-bold text-brand-text font-manrope leading-none whitespace-nowrap">{date.getDate()} {MONTHS3[date.getMonth()]}</span>
                                                                            {(() => {
                                                                                const SignIcon = ZODIAC_ICON_MAP[solarSign.sign];
                                                                                return SignIcon
                                                                                    ? <SignIcon width={11} height={11} style={{ color: ec.dot, fill: ec.dot, flexShrink: 0 }} />
                                                                                    : <span style={{ fontSize: '10px', color: ec.dot, flexShrink: 0 }}>{solarSign.glyph}</span>;
                                                                            })()}
                                                                        </div>
                                                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '2px 0' }}>
                                                                            <MoonPhaseDisk lunarDay={lunarDay} size={22} />
                                                                        </div>
                                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                                                                            <PlanetSphereIcon dow={dow} size={11} />
                                                                            <span className={`text-[8.5px] font-bold tracking-wider font-manrope uppercase leading-none ${
                                                                                isToday ? 'text-amber-400 font-extrabold' : 'text-brand-text-muted/80'
                                                                            }`}>
                                                                                {dowConfig.abbr}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                                {view === 'solar' && (
                                    <div className="flex flex-col">
                                        {SOLAR_SIGNS.map((sign, si) => {
                                            const style = ELEMENT_STYLES[sign.el as keyof typeof ELEMENT_STYLES];
                                            const SignIcon = ZODIAC_ICONS[sign.id as keyof typeof ZODIAC_ICONS];
                                            
                                            // Calcula datas de início e fim do signo no ano exibido
                                            const startDate = new Date(displayYear, sign.start[0], sign.start[1]);
                                            const nextSign = SOLAR_SIGNS[(si + 1) % 12];
                                            let endDate = new Date(displayYear, nextSign.start[0], nextSign.start[1]);
                                            if (endDate <= startDate) endDate = new Date(displayYear + 1, nextSign.start[0], nextSign.start[1]);
                                            
                                            const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / 86400000);
                                            const firstDow = startDate.getDay(); // 0=Dom
                                            const today = new Date();
                                            const isCurrentSolarMonth = today >= startDate && today < endDate;
                                            const isCardLocked = isFreeTier && !isCurrentSolarMonth;
                                            
                                            return (
                                                <div key={sign.id} style={{
                                                borderRadius: 14, overflow: 'hidden',
                                                border: `0.5px solid ${style.border}`,
                                                marginBottom: 16,
                                                opacity: isCardLocked ? 0.5 : 1,
                                                }}>
                                                
                                                {/* Header liquid glass */}
                                                <div style={{
                                                    padding: '14px 16px',
                                                    background: `linear-gradient(135deg, ${style.bg} 0%, rgba(6,6,15,0.9) 100%)`,
                                                    backdropFilter: 'blur(12px)',
                                                    borderBottom: `0.5px solid ${style.border}`,
                                                    position: 'relative', overflow: 'hidden',
                                                }}>
                                                    {/* Shimmer glow */}
                                                    <div style={{
                                                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                                    background: `radial-gradient(ellipse at 20% 30%, ${style.glow} 0%, transparent 65%)`,
                                                    pointerEvents: 'none',
                                                    }} />
                                                    
                                                    {/* Conteúdo do header */}
                                                    <div style={{ position: 'relative', zIndex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                                        {/* SVG do signo — tamanho 32×32, cor do elemento */}
                                                        {SignIcon && (
                                                        <SignIcon
                                                            width={32} height={32}
                                                            style={{ color: style.fill, fill: style.fill, flexShrink: 0 }}
                                                        />
                                                        )}
                                                        <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <span>{sign.name}</span>
                                                            {isCurrentSolarMonth && isFreeTier && (
                                                                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded border border-amber-400/30">
                                                                    Mês Solar Vigente
                                                                </span>
                                                            )}
                                                            {isCardLocked && (
                                                                <span className="text-[11px] text-[#D4AF37] font-sans font-normal" title="Disponível nos Planos Mensal e Vitalício">
                                                                    🔒 Planos Pagos
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
                                                            Regente: {sign.ruler} · {sign.el === 'fire' ? 'Fogo' : sign.el === 'earth' ? 'Terra' : sign.el === 'air' ? 'Ar' : 'Água'}
                                                        </div>
                                                        </div>
                                                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textAlign: 'right', flexShrink: 0 }}>
                                                        {startDate.getDate()}/{MONTHS3[startDate.getMonth()]} –{' '}
                                                        {new Date(endDate.getTime() - 86400000).getDate()}/{MONTHS3[new Date(endDate.getTime() - 86400000).getMonth()]}
                                                        </div>
                                                    </div>
                                                    
                                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                                                        {sign.desc}
                                                    </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Grid calendário */}
                                                <div style={{ background: 'rgba(6,6,15,0.7)', padding: '10px 12px 12px' }}>
                                                    
                                                    {/* Cabeçalho planetas + dias */}
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
                                                    {WEEK_PLANETS.map((p, pi) => (
                                                        <div key={pi} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '4px 1px' }}>
                                                        <PlanetSphere id={p.cls} size={14} />
                                                        <span style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'rgba(255,255,255,0.22)' }}>
                                                            {p.name}
                                                        </span>
                                                        </div>
                                                    ))}
                                                    </div>
                                                    
                                                    {/* Dias */}
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
                                                    {/* Células vazias antes do primeiro dia */}
                                                    {Array.from({ length: firstDow }, (_, i) => (
                                                        <div key={`empty-${i}`} style={{ minHeight: 44 }} />
                                                    ))}
                                                    
                                                    {/* Dias do período */}
                                                    {Array.from({ length: totalDays }, (_, d) => {
                                                        const date = new Date(startDate);
                                                        date.setDate(startDate.getDate() + d);
                                                        const solarDay = d + 1;
                                                        const gregStr = `${date.getDate()}/${MONTHS3[date.getMonth()]}`;
                                                        const isToday = date.toDateString() === today.toDateString();
                                                        const isSel = date.getDate() === selDay && date.getMonth() === selMonth && date.getFullYear() === selYear;
                                                        
                                                        return (
                                                        <div
                                                            key={d}
                                                            onClick={() => {
                                                                if (isCardLocked) {
                                                                    setShowUpgradeBanner(true);
                                                                    onOpenPaymentPlans?.();
                                                                    return;
                                                                }
                                                                handleDaySelect(date.getDate(), date.getMonth());
                                                            }}
                                                            style={{
                                                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                            justifyContent: 'center', gap: 1, padding: '5px 2px',
                                                            borderRadius: 6, cursor: isCardLocked ? 'not-allowed' : 'pointer', minHeight: 44,
                                                            background: isSel
                                                                ? `${style.bg}`
                                                                : isToday
                                                                ? 'rgba(100,140,220,0.1)'
                                                                : 'rgba(255,255,255,0.02)',
                                                            outline: isSel
                                                                ? `1px solid ${style.fill}`
                                                                : isToday
                                                                ? '1px solid rgba(140,180,255,0.4)'
                                                                : 'none',
                                                            outlineOffset: -1,
                                                            transition: 'filter 0.1s',
                                                            }}
                                                            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.3)'}
                                                            onMouseLeave={e => e.currentTarget.style.filter = 'none'}
                                                        >
                                                            <span style={{ fontSize: 13, fontWeight: 600, color: isToday ? 'rgba(160,190,255,0.95)' : 'rgba(255,255,255,0.88)', lineHeight: 1 }}>
                                                            {solarDay}
                                                            </span>
                                                            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.28)', whiteSpace: 'nowrap' }}>
                                                            {gregStr}
                                                            </span>
                                                        </div>
                                                        );
                                                    })}
                                                    </div>
                                                </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
            </div>
        </div>
    );

    if (embedded) return <div className="flex flex-col h-full min-h-0 overflow-hidden">{rightCol}</div>;

    return (
        <motion.div
            initial={{ opacity:0, scale:0.97 }}
            animate={{ opacity:1, scale:1 }}
            exit={{ opacity:0, scale:0.97 }}
            transition={{ duration:0.15 }}
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
            style={{ width:'min(98vw, 1400px)', height:'min(95vh, 860px)' }}
        >
            <div className="bg-brand-surface border border-brand-border/10 rounded-2xl shadow-2xl flex overflow-hidden relative h-full w-full font-manrope">
                <div className="absolute top-0 left-0 right-0 h-px z-10 rounded-t-2xl"
                    style={{ backgroundColor: '#2A2A2A' }} />

                {/* Coluna esquerda */}
                <div className="flex flex-col p-5 gap-3.5 border-r border-brand-border/10 overflow-y-auto" style={{ width:'255px', flexShrink:0 }}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-brand-text-muted tracking-wider font-manrope">Data &amp; hora</span>
                        <div className="flex items-center gap-1">
                            <button onClick={onClose} className="p-1 text-brand-text-muted hover:text-brand-text hover:bg-white/10 rounded transition-colors" title="Minimizar Calendário Lunar">
                                <i className="ti ti-minus text-xs" />
                            </button>
                            <button onClick={onClose} className="p-1 text-brand-text-muted hover:text-brand-text hover:bg-white/10 rounded transition-colors" title="Fechar">
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                            </button>
                        </div>
                    </div>

                    {/* Botão de Mapas Salvos */}
                    {savedMaps && (
                        <div className="flex flex-col gap-1">
                            <button
                                onClick={() => setShowMapSelector(!showMapSelector)}
                                className="w-full py-2 px-2.5 rounded-lg border border-yellow-500/30 bg-yellow-500/5 text-yellow-400 font-bold text-[10px] uppercase tracking-wider hover:bg-yellow-500/10 transition-all flex items-center justify-center gap-1.5 font-manrope"
                            >
                                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                                </svg>
                                Mapas Salvos
                            </button>

                            <AnimatePresence>
                                {showMapSelector && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-brand-surface-highlight/50 border border-brand-border/10 rounded-xl overflow-hidden my-1"
                                    >
                                        <div className="p-2 border-b border-brand-border/10 bg-brand-surface flex justify-between items-center">
                                            <span className="text-[9px] font-bold uppercase text-brand-text-muted tracking-tight font-manrope">Meus Mapas</span>
                                            <button onClick={() => setShowMapSelector(false)} className="text-brand-text-muted hover:text-brand-text">
                                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                                            </button>
                                        </div>
                                        <div className="max-h-40 overflow-y-auto p-1 custom-scrollbar">
                                            {savedMaps.length === 0 ? (
                                                <div className="p-3 text-center">
                                                    <p className="text-[10px] text-brand-text-muted font-manrope">Nenhum mapa salvo.</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-1">
                                                    {savedMaps.map((map: any) => (
                                                        <button
                                                            key={map.id}
                                                            onClick={() => {
                                                                const targetDateStr = map.targetDate || map.date || map.natalDate;
                                                                if (targetDateStr) {
                                                                    const d = new Date(targetDateStr);
                                                                    if (!isNaN(d.getTime())) {
                                                                        setSelDay(d.getDate());
                                                                        setSelMonth(d.getMonth());
                                                                        setSelYear(d.getFullYear());
                                                                        setDisplayYear(d.getFullYear());
                                                                        setDisplayMonth(d.getMonth());
                                                                        setDateInput(`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`);
                                                                        setTimeInput(`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`);
                                                                        onDateSelect(d);
                                                                    }
                                                                }
                                                                const mapLoc = map.location || map.natalLocation;
                                                                if (mapLoc && onLocationChange) {
                                                                    onLocationChange(mapLoc);
                                                                }
                                                                if (onLoadMap) {
                                                                    onLoadMap(map);
                                                                }
                                                                setShowMapSelector(false);
                                                            }}
                                                            className="w-full p-2 text-left hover:bg-white/5 rounded-lg transition-colors flex flex-col group border-b border-white/5 last:border-0"
                                                        >
                                                            <span className="text-xs font-bold text-brand-text group-hover:text-yellow-400 transition-colors uppercase tracking-tight truncate font-manrope">{map.name}</span>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                {(map.targetDate || map.date || map.natalDate) && (
                                                                    <span className="text-[9px] text-brand-text-muted font-manrope">
                                                                        {new Date(map.targetDate || map.date || map.natalDate).toLocaleDateString('pt-BR')}
                                                                    </span>
                                                                )}
                                                                {(map.location || map.natalLocation) && (
                                                                    <>
                                                                        <span className="text-[8px] text-brand-text-muted/30">|</span>
                                                                        <span className="text-[9px] text-brand-text-muted truncate flex-1 font-manrope">
                                                                            {(map.location || map.natalLocation).displayName}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Digitação Rápida (mesmo padrão do Mapa Natal) */}
                    <div className="flex flex-col gap-1.5 p-2.5 rounded-xl border border-brand-border/10 bg-brand-surface-highlight/30">
                        <div className="flex justify-between items-center px-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted font-manrope">
                                Digitação Rápida
                            </span>
                            <span className="text-[9px] text-brand-text-muted/60 font-mono">Ex: 291119980805</span>
                        </div>
                        <div className="flex gap-1.5 items-center">
                            <input
                                type="text"
                                placeholder="DD/MM/AAAA às HH:MM"
                                value={quickDateInput}
                                onChange={e => handleQuickDateChange(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleApplyQuickDate();
                                }}
                                className={`flex-1 min-w-0 bg-brand-surface-highlight/60 border border-brand-border/15 rounded-lg px-2.5 py-1.5 text-brand-text placeholder:text-brand-text-muted/40 focus:ring-2 ${accentRing} outline-none font-mono text-xs`}
                            />
                            <button
                                type="button"
                                onClick={handleApplyQuickDate}
                                className="px-2.5 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs active:scale-95 transition-all cursor-pointer shadow-sm shrink-0 font-manrope"
                                title="Aplicar data e hora rápida"
                            >
                                OK
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold uppercase text-brand-text-muted mb-1.5 font-manrope tracking-wider">Data</label>
                        <input type="text" value={dateInput} maxLength={10} placeholder="DD/MM/AAAA"
                            onChange={e => handleDateInput(e.target.value)}
                            onKeyDown={e => { if (e.key==='Tab'||e.key==='Enter'){e.preventDefault();document.getElementById('cal-time-inp')?.focus();}}}
                            className={`w-full bg-brand-surface-highlight/50 border border-brand-border/10 rounded-lg px-3 py-2.5 text-brand-text focus:ring-2 ${accentRing} outline-none font-manrope text-sm`} />
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold uppercase text-brand-text-muted mb-1.5 font-manrope tracking-wider">Hora</label>
                        <input id="cal-time-inp" type="text" value={timeInput} maxLength={5} placeholder="HH:MM"
                            onChange={e => handleTimeInput(e.target.value)}
                            onKeyDown={e => { if (e.key==='Enter') setIsEditingLocation(true); }}
                            className={`w-full bg-brand-surface-highlight/50 border border-brand-border/10 rounded-lg px-3 py-2.5 text-brand-text focus:ring-2 ${accentRing} outline-none font-manrope text-sm`} />
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold uppercase text-brand-text-muted mb-1.5 font-manrope tracking-wider">Local</label>
                        {!isEditingLocation ? (
                            <button onClick={() => setIsEditingLocation(true)}
                                className="w-full flex items-center gap-2 bg-brand-surface-highlight/50 border border-brand-border/10 rounded-lg px-3 py-2.5 text-left hover:bg-brand-surface-highlight transition-colors cursor-pointer group">
                                <svg width="10" height="12" viewBox="0 0 12 14" fill="none" className="flex-shrink-0">
                                    <path d="M6 0C3.79 0 2 1.79 2 4c0 3 4 8 4 8s4-5 4-8c0-2.21-1.79-4-4-4z" fill="#8B5CF6"/>
                                    <circle cx="6" cy="4" r="1.5" fill="currentColor" className="text-brand-surface"/>
                                </svg>
                                <span className="text-sm text-brand-text-muted font-manrope truncate flex-1 group-hover:text-brand-text">{locationName || 'Definir localização'}</span>
                                <i className="ti ti-pencil text-xs text-brand-text-muted opacity-60 group-hover:opacity-100" />
                            </button>
                        ) : (
                            <div className="flex gap-2 items-start">
                                <div className="flex-1">
                                    <LocationSearchInput value={locationName} theme={theme} placeholder="Buscar cidade..."
                                        onChange={loc => { handleSelectLocation(loc); }} />
                                </div>
                                <button onClick={() => setIsEditingLocation(false)}
                                    className="text-brand-text-muted hover:text-brand-text border border-brand-border/10 rounded-lg p-2 transition-colors cursor-pointer">
                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                                </button>
                            </div>
                        )}
                        <p className="text-[10px] text-brand-text-muted mt-1 font-manrope">Qualquer cidade do mundo</p>

                        {/* Locais Recentes (Pilulas de Locais) */}
                        <div className="mt-3 pt-2.5 border-t border-brand-border/10">
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-[10px] font-bold uppercase text-brand-text-muted font-manrope tracking-wider">
                                    Locais Recentes
                                </label>
                                <button 
                                    onClick={() => setIsEditingLocation(true)}
                                    className="text-[9px] text-amber-400 hover:underline font-manrope cursor-pointer flex items-center gap-0.5"
                                >
                                    <i className="ti ti-plus text-[9px]" />
                                    Novo
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar p-0.5">
                                {recentLocations.map((loc, idx) => {
                                    const isSelected = locationName && (locationName === loc.displayName || locationName.includes(loc.displayName.split(',')[0]));
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleSelectLocation(loc)}
                                            className={`px-2 py-1 rounded-full text-[10.5px] font-medium transition-all cursor-pointer flex items-center gap-1 border max-w-full truncate ${
                                                isSelected
                                                    ? 'bg-amber-500/25 border-amber-500/60 text-amber-300 font-bold shadow-xs'
                                                    : 'bg-brand-surface-highlight/50 border-brand-border/15 text-brand-text-muted hover:text-brand-text hover:bg-brand-surface-highlight hover:border-brand-border/30'
                                            }`}
                                            title={`Selecionar ${loc.displayName}`}
                                        >
                                            <i className="ti ti-map-pin text-[9.5px] text-amber-400 shrink-0" />
                                            <span className="truncate">{loc.displayName.split(',')[0]}</span>
                                            {loc.displayName.includes(',') && (
                                                <span className="text-[9px] opacity-60 font-mono">
                                                    ,{loc.displayName.split(',')[1]}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Estados do Brasil */}
                        <div className="mt-3 pt-2.5 border-t border-brand-border/10">
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-[10px] font-bold uppercase text-brand-text-muted font-manrope tracking-wider">
                                    Estados do Brasil
                                </label>
                                <span className="text-[9px] text-brand-text-muted/60 font-manrope">Capitais</span>
                            </div>
                            <div className="grid grid-cols-6 gap-1 max-h-32 overflow-y-auto custom-scrollbar p-0.5">
                                {BRAZILIAN_STATES.map((st) => {
                                    const isSelected = locationName && (locationName.includes(st.capital) || locationName.includes(st.uf) || locationName.includes(st.name));
                                    return (
                                        <button
                                            key={st.uf}
                                            onClick={() => handleSelectLocation({ latitude: st.lat, longitude: st.lng, displayName: st.capital })}
                                            className={`h-6 rounded-md text-[10px] font-bold font-mono transition-all cursor-pointer flex items-center justify-center border ${
                                                isSelected
                                                    ? 'bg-purple-500/30 border-purple-400/60 text-purple-200 font-extrabold shadow-xs'
                                                    : 'bg-brand-surface-highlight/40 border-brand-border/10 text-brand-text-muted/80 hover:text-brand-text hover:bg-brand-surface-highlight hover:border-brand-border/30'
                                            }`}
                                            title={`${st.name} — Capital: ${st.capital}`}
                                        >
                                            {st.uf}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto bg-brand-surface-highlight/30 border border-brand-border/10 rounded-xl p-3">
                        <p className="text-[10px] font-bold uppercase text-brand-text-muted tracking-wider font-manrope mb-2">Selecionado</p>
                        <p className="text-sm font-semibold text-brand-text font-manrope">{dateInput.length===10?dateInput:'—'}</p>
                        <p className="text-xs text-brand-text-muted font-manrope mt-0.5">{timeInput.length===5?timeInput:'—'}</p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <button onClick={handleConfirm}
                            className={`w-full py-2.5 rounded-lg font-semibold text-sm font-manrope transition-colors ${accentBtn}`}>
                            Confirmar
                        </button>
                        <button onClick={onClose}
                            className="w-full py-2.5 rounded-lg border border-brand-border/10 text-brand-text-muted font-semibold text-sm font-manrope hover:bg-brand-surface-highlight transition-colors">
                            Cancelar
                        </button>
                    </div>
                </div>

                {rightCol}
            </div>
        </motion.div>
    );
};