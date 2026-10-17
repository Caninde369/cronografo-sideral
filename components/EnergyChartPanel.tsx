import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { calculateCelestialData } from '../hooks/useCelestialData';
import { calculateTransitNatalAspects } from '../lib/astrology/aspects';
import { calculateSunTropicalLongitude } from '../lib/astrology/celestialBodies';
import {
  Y_SCALE_MAX,
  Y_SCALE_MIN,
  Y_SCALE_RANGE,
  ZERO_POSITION_RATIO,
  scoreAspect,
} from '../src/utils/energyScoring';
import { calculateDailyState, DailyEnergeticState } from '../src/utils/dailyState';
import { extractEmotionsFromAspect } from '../src/utils/emotionEngine';
import {
  scoreToY,
  scoreToMoodColor,
  MOOD_COLOR_STOPS,
} from '../src/utils/chartHelpers';

export interface EnergyChartProps {
  aspects: Array<{
    planet1: string;
    planet2: string;
    type: 'CON'|'OPO'|'TRI'|'SXT'|'QUA'|'INC'|'SSX'|'SSQ'|'SES'|'BQ';
    orb: number;
  }>;
  lunarCycle: {
    newMoonDate: Date;
    fullMoonDate: Date;
    nextNewMoonDate: Date;
    phase: string;
    illumination: number;
  };
  currentDate: Date;
  onClose: () => void;
  natalCelestialData?: any | null;
}

const ASPECT_TYPES = {
  CON: 'CONJUNÇÃO',
  OPO: 'OPOSIÇÃO',
  TRI: 'TRÍGONO',
  SXT: 'SEXTIL',
  QUA: 'QUADRATURA',
  INC: 'INCONJUNÇÃO',
  SSX: 'SEMISSEXTIL',
  SSQ: 'SEMIQUADRATURA',
  SES: 'SESQUIQUADRATURA',
  BQ:  'BIQUINTIL',
};

const PLANET_NAME_TO_PT: Record<string, string> = {
  sun: 'Sol', moon: 'Lua', mercury: 'Mercúrio', venus: 'Vênus',
  mars: 'Marte', jupiter: 'Júpiter', saturn: 'Saturno',
  uranus: 'Urano', neptune: 'Netuno', pluto: 'Plutão',
  Sol: 'Sol', Lua: 'Lua', Mercúrio: 'Mercúrio', Vênus: 'Vênus',
  Marte: 'Marte', Júpiter: 'Júpiter', Saturno: 'Saturno',
  Urano: 'Urano', Netuno: 'Netuno', Plutão: 'Plutão',
};

const getTenPlanetsBodies = (data: any) => {
  const bodies: any[] = [];
  const ids = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
  ids.forEach(id => {
    const val = data[`${id}EclipticLongitude`];
    if (typeof val === 'number') {
      bodies.push({
        id,
        name: PLANET_NAME_TO_PT[id] || id,
        symbol: '',
        longitude: val,
        signIndex: Math.floor(val / 30),
        house: data.housePlacements?.[id] || 0,
      });
    }
  });
  return bodies;
};

export const EnergyChartPanel: React.FC<EnergyChartProps> = ({
  aspects, lunarCycle, currentDate, onClose, natalCelestialData = null
}) => {
  const [timeSeries, setTimeSeries] = useState<{ date: Date; state: DailyEnergeticState }[]>([]);
  const [isCalculating, setIsCalculating] = useState(true);
  const [granularity, setGranularity] = useState<'day' | 'week' | 'cycle' | 'solar'>('cycle');

  const timeRange = useMemo(() => {
    const snapped = new Date(currentDate);
    snapped.setMinutes(0, 0, 0);

    if (granularity === 'day') {
      return {
        start: new Date(snapped.getTime() - 12 * 3600_000),
        end:   new Date(snapped.getTime() + 12 * 3600_000),
        stepMs: 2 * 3600_000,
      };
    } else if (granularity === 'week') {
      const sod = new Date(snapped);
      sod.setHours(0, 0, 0, 0);
      return {
        start: new Date(sod.getTime() - 3 * 86400_000),
        end:   new Date(sod.getTime() + 4 * 86400_000),
        stepMs: 12 * 3600_000,
      };
    } else if (granularity === 'solar') {
      const sunLong = calculateSunTropicalLongitude(snapped);
      const approxDaysSinceEquinox = (sunLong / 360) * 365.2422;
      const start = new Date(snapped.getTime() - approxDaysSinceEquinox * 86400_000);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start.getTime() + 364 * 86400_000);
      return {
        start,
        end,
        stepMs: 86400_000,
      };
    } else {
      return {
        start: lunarCycle.newMoonDate,
        end:   lunarCycle.nextNewMoonDate,
        stepMs: 86400_000,
      };
    }
  }, [
    Math.floor(currentDate.getTime() / 3600_000),
    lunarCycle.newMoonDate.getTime(),
    lunarCycle.nextNewMoonDate.getTime(),
    granularity,
  ]);

  useEffect(() => {
    let mounted = true;
    setIsCalculating(true);

    setTimeout(() => {
      const series: { date: Date; state: DailyEnergeticState }[] = [];
      const { start, end, stepMs } = timeRange;
      const totalSteps = Math.ceil((end.getTime() - start.getTime()) / stepMs);
      const dummyLoc = { latitude: 0, longitude: 0, displayName: '' };
      const visiblePlanets = {
        sun: true, moon: true, mercury: true, venus: true, mars: true,
        jupiter: true, saturn: true, uranus: true, neptune: true, pluto: true,
      };

      const typeMap: Record<string, string> = {
        conjunction: 'CON', opposition: 'OPO', trine: 'TRI', sextile: 'SXT',
        square: 'QUA', inconjunct: 'INC', semisextile: 'SSX',
        semisquare: 'SSQ', sesquiquadrate: 'SES', biquintile: 'BQ',
      };

      const natalBodies = natalCelestialData
        ? getTenPlanetsBodies(natalCelestialData)
        : null;

      for (let i = 0; i <= totalSteps; i++) {
        const d = new Date(start.getTime() + i * stepMs);
        if (d > end && i !== 0) break;

        const data = calculateCelestialData(d, dummyLoc, visiblePlanets, 'porphyry', 'sidereal');
        const dayAspects: any[] = [];

        if (natalBodies) {
          const transitBodies = getTenPlanetsBodies(data);
          const rawAspects = calculateTransitNatalAspects(transitBodies, natalBodies);
          rawAspects.forEach((a: any) => {
            dayAspects.push({
              planet1: PLANET_NAME_TO_PT[a.body1?.id] || a.body1?.name || '',
              planet2: PLANET_NAME_TO_PT[a.body2?.id] || a.body2?.name || '',
              type: typeMap[a.type] || 'CON',
              orb: a.orb,
            });
          });
        } else {
          data.aspects.forEach((a: any) => {
            dayAspects.push({
              planet1: PLANET_NAME_TO_PT[a.body1?.id] || a.body1?.name,
              planet2: PLANET_NAME_TO_PT[a.body2?.id] || a.body2?.name,
              type: typeMap[a.type] || 'CON',
              orb: a.orb,
            });
          });
        }

        const dailyState = calculateDailyState(dayAspects);
        series.push({ date: d, state: dailyState });
      }

      if (mounted) {
        setTimeSeries(series);
        setIsCalculating(false);
      }
    }, 50);

    return () => { mounted = false; };
  }, [timeRange, natalCelestialData]);

  // ── Aspectos e score do momento atual ──────
  const currentAspects = useMemo(() => {
    const dummyLoc = { latitude: 0, longitude: 0, displayName: '' };
    const visiblePlanets = {
      sun: true, moon: true, mercury: true, venus: true, mars: true,
      jupiter: true, saturn: true, uranus: true, neptune: true, pluto: true,
    };
    const typeMap: Record<string, string> = {
      conjunction: 'CON', opposition: 'OPO', trine: 'TRI', sextile: 'SXT',
      square: 'QUA', inconjunct: 'INC', semisextile: 'SSX',
      semisquare: 'SSQ', sesquiquadrate: 'SES', biquintile: 'BQ',
    };

    if (natalCelestialData) {
      const data = calculateCelestialData(currentDate, dummyLoc, visiblePlanets, 'porphyry', 'sidereal');
      const transitBodies = getTenPlanetsBodies(data);
      const natalBodies = getTenPlanetsBodies(natalCelestialData);
      return calculateTransitNatalAspects(transitBodies, natalBodies).map((a: any) => ({
        planet1: PLANET_NAME_TO_PT[a.body1?.id] || a.body1?.name || '',
        planet2: PLANET_NAME_TO_PT[a.body2?.id] || a.body2?.name || '',
        type: (typeMap[a.type] || 'CON') as any,
        orb: a.orb,
        isNatal: true,
      }));
    }

    return aspects.map(a => ({
      ...a,
      planet1: PLANET_NAME_TO_PT[a.planet1] || a.planet1,
      planet2: PLANET_NAME_TO_PT[a.planet2] || a.planet2,
      isNatal: false,
    }));
  }, [aspects, currentDate, natalCelestialData]);

  const todayState = useMemo(() => calculateDailyState(currentAspects), [currentAspects]);
  const todayScore = todayState.energy.normalized;

  const sortedAspects = useMemo(() =>
    [...todayState.aspects]
      .map(a => ({ ...a, score: a.emotion })) // emotion serves as the visual indicator for each aspect's direction
      .sort((a, b) => Math.abs(b.score) - Math.abs(a.score)),
  [todayState]);

  // ── SVG ────────────────────────────────────
  const svgWidth  = 1000;
  const svgHeight = 160;

  // Zero Y calculado a partir das constantes — fonte única de verdade
  const zeroY = ZERO_POSITION_RATIO * svgHeight;

  // Offsets do gradiente calculados programaticamente a partir da escala
  const gradientStops = [
    { score: Y_SCALE_MAX,          color: MOOD_COLOR_STOPS[0].color },
    ...MOOD_COLOR_STOPS,
    { score: Y_SCALE_MIN,          color: MOOD_COLOR_STOPS[MOOD_COLOR_STOPS.length - 1].color },
  ].sort((a, b) => b.score - a.score).map(s => ({
    color: s.color,
    // offset = posição Y normalizada do score dentro da escala
    offset: `${((Y_SCALE_MAX - s.score) / Y_SCALE_RANGE) * 100}%`,
  }));

  let linePathNormalized = '';
  let linePathPerceived = '';
  let todayX    = 0;
  let todayY    = zeroY;
  let todayIndex    = -1;
  let tomorrowIndex = -1;

  if (timeSeries.length > 0) {
    const stepX = svgWidth / Math.max(timeSeries.length - 1, 1);

    // Índice mais próximo de hoje
    let minD = Infinity;
    timeSeries.forEach((pt, idx) => {
      const d = Math.abs(pt.date.getTime() - currentDate.getTime());
      if (d < minD) { minD = d; todayIndex = idx; }
    });

    // Índice mais próximo de amanhã
    const tomorrow = new Date(currentDate.getTime() + 86400_000);
    let minDT = Infinity;
    timeSeries.forEach((pt, idx) => {
      const d = Math.abs(pt.date.getTime() - tomorrow.getTime());
      if (d < minDT) { minDT = d; tomorrowIndex = idx; }
    });

    const pointsNormalized = timeSeries.map((pt, i) => {
      const x = i * stepX;
      const y = scoreToY(pt.state.energy.normalized, svgHeight);
      if (i === todayIndex) { todayX = x; todayY = y; }
      return { x, y };
    });

    const pointsPerceived = timeSeries.map((pt, i) => {
      const x = i * stepX;
      const y = scoreToY(pt.state.energy.perceived, svgHeight);
      return { x, y };
    });

    linePathNormalized = pointsNormalized.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    linePathPerceived = pointsPerceived.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  }

  // Largura da faixa de hoje por granularidade
  const stripeWidth = granularity === 'day' ? 150 : granularity === 'week' ? 60 : granularity === 'solar' ? 3 : 25;

  // Dias para o eixo X
  const days = useMemo(() => {
    if (timeSeries.length === 0) return [];
    const dayMap = new Map<string, Date>();
    timeSeries.forEach(item => {
      const key = item.date.toDateString();
      if (!dayMap.has(key)) dayMap.set(key, item.date);
    });
    const tom = new Date(currentDate);
    tom.setDate(tom.getDate() + 1);

    return Array.from(dayMap.values()).map((base, idx) => {
      const mid = new Date(base); mid.setHours(12, 0, 0, 0);
      const isToday    = base.getDate() === currentDate.getDate()
                      && base.getMonth() === currentDate.getMonth()
                      && base.getFullYear() === currentDate.getFullYear();
      const isTomorrow = base.getDate() === tom.getDate()
                      && base.getMonth() === tom.getMonth()
                      && base.getFullYear() === tom.getFullYear();

      let weekdayAbbr = base.toLocaleDateString('pt-BR', { weekday: 'short' }).substring(0, 3).toUpperCase();
      let dayNumber = base.getDate().toString();

      if (granularity === 'solar') {
        const sunLong = calculateSunTropicalLongitude(base);
        const signIndex = Math.floor(sunLong / 30);
        const signSymbols = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
        const signAbbrs = ['ARI', 'TOU', 'GÊM', 'CÂN', 'LEÃ', 'VIR', 'LIB', 'ESC', 'SAG', 'CAP', 'AQU', 'PEI'];
        weekdayAbbr = `${signSymbols[signIndex]} ${signAbbrs[signIndex]}`;
        dayNumber = (Math.floor(sunLong) + 1).toString();
      }

      return {
        date: mid,
        isToday, isTomorrow,
        weekdayAbbr,
        dayNumber,
      };
    });
  }, [timeSeries, currentDate, granularity]);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      className="absolute bottom-[80px] left-0 right-0 z-[60] flex flex-col font-manrope shadow-[0_-10px_40px_rgba(0,0,0,0.7)] overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(180deg, ${todayState.dominantColor}15 0%, #040004 35%)`,
        backgroundColor: '#040004',
        borderTop: '0.5px solid rgba(255,255,255,0.15)',
        borderRadius: '16px 16px 0 0',
      }}
    >
      {/* Background glow effects for aura */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: `radial-gradient(ellipse at 50% -20%, ${todayState.dominantColor}30 0%, transparent 60%)`,
          filter: 'blur(40px)',
          opacity: 0.8
        }}
      />
      
      {/* Handle */}
      <div className="w-full flex justify-center py-2 cursor-pointer relative z-10" onClick={onClose}>
        <div className="w-9 h-[3px] bg-white/20 rounded-full" />
      </div>

      {/* Header */}
      <div className="px-6 py-3.5 flex flex-col md:flex-row items-center justify-between border-b border-white/[0.08] gap-4 relative z-10">
        <div className="flex flex-col sm:flex-row items-center gap-3.5">
          <h2 className="text-[13px] font-semibold text-white whitespace-nowrap" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Clima Emocional
          </h2>
          <div className="hidden sm:block h-3.5 w-[1px] bg-white/15" />
          <div className="flex gap-1 items-center text-[9px] uppercase font-bold tracking-wider">
            {(['day','week','cycle','solar'] as const).map(g => (
              <button key={g} onClick={() => setGranularity(g)}
                className={`px-2 py-1 rounded transition-colors ${granularity === g ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
                {g === 'day' ? '1 Dia' : g === 'week' ? '7 Dias' : g === 'cycle' ? 'Ciclo Lunar' : 'Ciclo Solar'}
              </button>
            ))}
          </div>
        </div>

        {/* Legenda — faixas da nova escala */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[9px] text-white/50">
           <div className="flex items-center gap-1.5">
             <span className="w-4 h-[2px] rounded-full flex-shrink-0" style={{ backgroundColor: 'rgba(212,175,55,0.4)', borderStyle: 'dashed', borderWidth: '1px 0 0 0' }} />
             <span>Intensidade (Volume)</span>
           </div>
           <div className="flex items-center gap-1.5">
             <span className="w-4 h-[2px] rounded-full flex-shrink-0 bg-gradient-to-r from-[#9B5FE0] via-[#5DC8A0] to-[#E0454A]" />
             <span>Carga Psicológica (Pressão)</span>
           </div>
        </div>

        {/* Score hoje + fechar */}
        <div className="flex items-center gap-4 relative z-10">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2" style={{ color: todayState.dominantColor }}>
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-80" style={{ fontFamily: "'DM Sans', sans-serif" }}>Hoje</span>
              <span style={{ fontSize: '20px', lineHeight: 1, fontWeight: '600', letterSpacing: '-0.02em' }}>
                {todayState.dominantEmotion?.emotion || 'Estável'}
              </span>
            </div>
            <div className="flex gap-2 text-[10px] font-mono tracking-wide mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {todayState.emotions.slice(1, 3).map(e => (
                <span key={e.emotion}>{e.emotion} ({Math.round(e.weight)}%)</span>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/40 hover:text-white transition-colors ml-2">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M1 1L13 13M1 13L13 1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Gráfico SVG */}
      <div className="w-full px-6 relative pt-3 pb-3" style={{ height: '210px', background: '#040004' }}>
        {isCalculating ? (
          <div className="absolute inset-0 flex items-center justify-center text-white/40 text-xs tracking-widest uppercase">
            Calculando dados...
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="none"
            className="w-full h-full"
            style={{ overflow: 'visible' }}
          >
            <defs>
              {/* Gradiente calculado programaticamente — offsets derivados da escala */}
              <linearGradient
                id="moodGrad"
                gradientUnits="userSpaceOnUse"
                x1="0" y1="0"
                x2="0" y2={svgHeight}
              >
                {gradientStops.map((s, i) => (
                  <stop key={i} offset={s.offset} stopColor={s.color} />
                ))}
              </linearGradient>

              <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Fundo */}
            <rect width={svgWidth} height={svgHeight} fill="#040004" />

            {/* Grid secundário (linhas de referência leves) */}
            {[2000, 1000, 400, -400, -1000, -2000].map(v => (
              <g key={v}>
                <line
                  x1="0" y1={scoreToY(v, svgHeight)}
                  x2={svgWidth} y2={scoreToY(v, svgHeight)}
                  stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="3 4"
                />
                <text
                  x="8"
                  y={scoreToY(v, svgHeight) - 4}
                  fill="rgba(255,255,255,0.25)"
                  fontSize="8"
                  fontFamily="monospace"
                >
                  {v > 0 ? `+${v}` : v}
                </text>
              </g>
            ))}

            {/* Faixa de hoje */}
            <rect
              x={todayX - stripeWidth / 2} y={0}
              width={stripeWidth} height={svgHeight}
              fill="rgba(212,175,55,0.04)"
            />

            {/* LINHA ZERO — destaque único */}
            <g>
              <line
                x1="0" y1={zeroY}
                x2={svgWidth} y2={zeroY}
                stroke="rgba(255,255,255,0.25)" strokeWidth="1"
              />
              <text
                x="8"
                y={zeroY - 4}
                fill="rgba(255,255,255,0.45)"
                fontSize="8"
                fontWeight="bold"
                fontFamily="monospace"
              >
                0 (Equilíbrio)
              </text>
            </g>

            {/* Agulha de hoje */}
            <line
              x1={todayX} y1={0}
              x2={todayX} y2={svgHeight}
              stroke="rgba(212,175,55,0.55)" strokeWidth="1.5"
            />

            {/* Linha de Intensidade Percebida */}
            {linePathPerceived && (
              <path
                d={linePathPerceived}
                stroke="rgba(212,175,55,0.4)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Linha Principal - Emoção Normalizada */}
            {linePathNormalized && (
              <path
                d={linePathNormalized}
                stroke="url(#moodGrad)"
                strokeWidth={2.4}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#lineGlow)"
              />
            )}

            {/* Pontos */}
            {timeSeries.map((pt, idx) => {
              const x = (idx / Math.max(timeSeries.length - 1, 1)) * svgWidth;
              const normalizedScore = pt.state.energy.normalized;
              const y = scoreToY(normalizedScore, svgHeight);
              const isToday    = idx === todayIndex;
              const color = scoreToMoodColor(normalizedScore);

              if (isToday) return (
                <g key={idx}>
                  <circle cx={x} cy={y} r={7} fill="none" stroke={color} strokeWidth={1} opacity={0.8} />
                  <circle cx={x} cy={y} r={4.5} fill={color} stroke="#040004" strokeWidth={1.5} />
                  <text x={x + 9} y={y + 3.5} fill={color} fontSize="10" fontFamily="'DM Sans', sans-serif" fontWeight="bold">
                    {pt.state.dominantEmotion?.emotion || ''}
                  </text>
                </g>
              );

              return <circle key={idx} cx={x} cy={y} r={1.2} fill={color} opacity={0.3} />;
            })}
          </svg>
        )}
      </div>

      {/* Eixo X */}
      <div className="x-axis-band border-t border-white/[0.08] relative h-14 bg-[#040004] px-6 mt-1 mb-2">
        <div className="relative w-full h-full">
          {days.map((day, idx) => {
            const pct = ((day.date.getTime() - timeRange.start.getTime()) /
                         (timeRange.end.getTime() - timeRange.start.getTime())) * 100;
            const clampedPct = Math.max(0, Math.min(100, pct));

            const show = granularity === 'solar'
              ? (day.isToday || idx % 30 === 0)
              : (granularity !== 'cycle' || day.isToday || idx % 4 === 0);
            if (!show) return null;

            return (
              <div
                key={idx}
                className="absolute top-2 -translate-x-1/2 flex flex-col items-center z-10"
                style={{ left: `${clampedPct}%` }}
              >
                <span className={`text-[8px] uppercase tracking-wider ${day.isToday ? 'text-[#D4AF37] font-semibold' : 'text-white/22'}`}>
                  {day.weekdayAbbr}
                </span>
                {day.isToday ? (
                  <span className="mt-1 bg-[#D4AF37] text-[#040004] text-[13px] font-semibold rounded-lg px-2.5 py-0.5 shadow-[0_0_12px_rgba(212,175,55,0.4)] font-mono">
                    Dia {day.dayNumber}
                  </span>
                ) : (
                  <span className="text-[11px] font-mono mt-1 text-white/40">
                    {granularity === 'solar' ? `Dia ${day.dayNumber}` : day.dayNumber}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Strip de aspectos */}
      <div className="w-full overflow-x-auto scrollbar-hide px-6 py-4 flex gap-2 bg-[#040004]">
        {sortedAspects.length === 0 ? (
          <div className="text-[10px] text-white/30 italic">Sem aspectos exatos hoje.</div>
        ) : (
          sortedAspects.map((a, i) => {
            const color = scoreToMoodColor(a.score);
            const aspectEmotions = extractEmotionsFromAspect(a);
            const topEmotion = aspectEmotions.length > 0 ? aspectEmotions[0].emotion : '';
            return (
              <div key={i}
                className="flex-shrink-0 flex flex-col gap-1 px-3 py-2 rounded-md"
                style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[10px] uppercase tracking-wider text-white/90 font-bold whitespace-nowrap flex items-center">
                    <span>{a.planet1}</span>
                    {a.isNatal && <span className="text-[8px] text-white/40 normal-case font-normal ml-0.5 mr-1">(trânsito)</span>}
                    <span className="mx-1 text-white/50">{ASPECT_TYPES[a.type as keyof typeof ASPECT_TYPES] || a.type}</span>
                    <span>{a.planet2}</span>
                    {a.isNatal && <span className="text-[8px] text-[#b3a6ff]/70 normal-case font-normal ml-0.5">(natal)</span>}
                  </span>
                  <span className="text-[10px] font-mono font-normal tabular-nums ml-1" style={{ color: '#F5F2EB', fontFamily: "'Azeret Mono', monospace", fontVariantNumeric: 'tabular-nums' }}>{a.orb.toFixed(1)}°</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono whitespace-nowrap opacity-70">
                  <span style={{ color: color }}>{topEmotion}</span>
                  <span className="opacity-50">|</span>
                  <span>Int. {Math.round(a.intensity)}</span>
                  <span className="opacity-50">|</span>
                  <span style={{ color: color }}>Carga {a.score > 0 ? '+' : ''}{Math.round(a.score)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};
