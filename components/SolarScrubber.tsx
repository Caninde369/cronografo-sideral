import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZODIAC_ICONS } from './icons';
import { calculateSunTropicalLongitude, calculateMoonTropicalLongitude } from '../lib/astrology/celestialBodies';

const getMoonPhaseAtDate = (date: Date): number => {
  const moonLon = calculateMoonTropicalLongitude(date);
  const sunLon = calculateSunTropicalLongitude(date);
  return ((moonLon - sunLon + 360) % 360) / 360;
};

interface SolarScrubberProps {
  currentDate: Date;
  onChange: (date: Date) => void;
  year?: number;
  headerRight?: React.ReactNode;
  onOpenDatePicker?: () => void;
  onMinimizeTimeline?: () => void;
  isRealTime?: boolean;
  loopA?: Date | null;
  loopB?: Date | null;
  onSetLoopA?: (date: Date | null) => void;
  onSetLoopB?: (date: Date | null) => void;
  onClearLoop?: () => void;
  isLight?: boolean;
  isFreeTier?: boolean;
  onOpenPaymentPlans?: () => void;
  /** Clique em "Dia solar": abre o calendário solar */
  onOpenSolarCalendar?: () => void;
}

export const SOLAR_SIGNS = [
  { glyph: '♈', key: 'aries',       name: 'Áries',       element: 'fire',  color: '#EF4444', gradientStart: '#DC2626', gradientEnd: '#F97316', startDoy: 80,  endDoy: 109 },
  { glyph: '♉', key: 'taurus',      name: 'Touro',       element: 'earth', color: '#10B981', gradientStart: '#059669', gradientEnd: '#34D399', startDoy: 110, endDoy: 140 },
  { glyph: '♊', key: 'gemini',      name: 'Gêmeos',      element: 'air',   color: '#38BDF8', gradientStart: '#7DD3FC', gradientEnd: '#0284C7', startDoy: 141, endDoy: 171 },
  { glyph: '♋', key: 'cancer',      name: 'Câncer',      element: 'water', color: '#38BDF8', gradientStart: '#2DD4BF', gradientEnd: '#38BDF8', startDoy: 172, endDoy: 203 },
  { glyph: '♌', key: 'leo',         name: 'Leão',        element: 'fire',  color: '#F59E0B', gradientStart: '#EF4444', gradientEnd: '#F59E0B', startDoy: 204, endDoy: 234 },
  { glyph: '♍', key: 'virgo',       name: 'Virgem',      element: 'earth', color: '#22C55E', gradientStart: '#10B981', gradientEnd: '#4ADE80', startDoy: 235, endDoy: 265 },
  { glyph: '♎', key: 'libra',       name: 'Libra',       element: 'air',   color: '#38BDF8', gradientStart: '#38BDF8', gradientEnd: '#0EA5E9', startDoy: 266, endDoy: 295 },
  { glyph: '♏', key: 'scorpio',     name: 'Escorpião',   element: 'water', color: '#2563EB', gradientStart: '#1D4ED8', gradientEnd: '#3B82F6', startDoy: 296, endDoy: 325 },
  { glyph: '♐', key: 'sagittarius', name: 'Sagitário',   element: 'fire',  color: '#F97316', gradientStart: '#F97316', gradientEnd: '#DC2626', startDoy: 326, endDoy: 355 },
  { glyph: '♑', key: 'capricorn',   name: 'Capricórnio', element: 'earth', color: '#34D399', gradientStart: '#065F46', gradientEnd: '#10B981', startDoy: 356, endDoy: 19  },
  { glyph: '♒', key: 'aquarius',    name: 'Aquário',     element: 'air',   color: '#38BDF8', gradientStart: '#0EA5E9', gradientEnd: '#7DD3FC', startDoy: 20,  endDoy: 49  },
  { glyph: '♓', key: 'pisces',      name: 'Peixes',      element: 'water', color: '#60A5FA', gradientStart: '#2563EB', gradientEnd: '#38BDF8', startDoy: 50,  endDoy: 79  },
];

const ELEMENT_GRADIENTS = {
  fire: 'linear-gradient(to right, var(--color-zodiac-fire-1) 0%, var(--color-zodiac-fire-3) 100%)',
  earth: 'linear-gradient(to right, var(--color-zodiac-earth-1) 0%, var(--color-zodiac-earth-3) 100%)',
  air: 'linear-gradient(to right, var(--color-zodiac-air-1) 0%, var(--color-zodiac-air-3) 100%)',
  water: 'linear-gradient(to right, var(--color-zodiac-water-1) 0%, var(--color-zodiac-water-3) 100%)',
};

export const ZODIAC_YEAR_START = 80;

const getZodiacalProgress = (doy: number) => {
    const adjusted = doy >= ZODIAC_YEAR_START ? doy - ZODIAC_YEAR_START : doy + (365 - ZODIAC_YEAR_START);
    return adjusted / 365;
};

const getDoyFromZodiacalProgress = (pct: number) => {
    const adjusted = Math.round(pct * 365);
    const doy = (adjusted + ZODIAC_YEAR_START) % 365;
    return doy === 0 ? 365 : doy;
};

const TRACK_GRADIENT_YEAR = `linear-gradient(
  to right,
  #4a0000 0%, #7B0000 3%, #EF4444 12%,
  #FB923C 28%, #FDE047 42%,
  #22D3EE 58%, #6366F1 76%,
  #1a0050 92%, #080018 100%
)`;

const getDayOfYear = (date: Date) => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};

export const getFreeTierSolarYearBounds = (now: Date = new Date()) => {
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();
    let startYear = y;
    if (m < 2 || (m === 2 && d < 21)) {
        startYear = y - 1;
    }
    const startDate = new Date(startYear, 2, 21, 0, 0, 0); // March 21
    const endDate = new Date(startYear + 1, 2, 19, 23, 59, 59); // March 19 next year
    return { startDate, endDate };
};

/**
 * Direção de arte da linha espectral (aprovada em 18/11/2026):
 * transição de 7 dias entre signos, misturada pela roda de cores (OKLCH, caminho curto),
 * com força mínima de cor 0,15 no meio da passagem, brilho total.
 */
const SPECTRAL_BLEND_DAYS = 7;
const SPECTRAL_MIN_CHROMA = 0.15;
const toLinear = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const toSrgb = (c: number) => { c = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; return Math.round(Math.max(0, Math.min(1, c)) * 255); };
const rgbToOklch = (rgb: number[]) => {
  const [r, g, b] = rgb.map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), Math.atan2(B, A)];
};
const oklchToRgb = ([L, C0, H]: number[]) => {
  let C = C0;
  for (let k = 0; k < 24; k++) {
    const A = C * Math.cos(H), B = C * Math.sin(H);
    const l = Math.pow(L + 0.3963377774 * A + 0.2158037573 * B, 3);
    const m = Math.pow(L - 0.1055613458 * A - 0.0638541728 * B, 3);
    const s = Math.pow(L - 0.0894841775 * A - 1.291485548 * B, 3);
    const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    const b = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
    if (r >= -0.001 && r <= 1.001 && g >= -0.001 && g <= 1.001 && b >= -0.001 && b <= 1.001) return [toSrgb(r), toSrgb(g), toSrgb(b)];
    C *= 0.92; // fora da faixa de cor da tela: reduz a saturação até caber
  }
  return [toSrgb(L), toSrgb(L), toSrgb(L)];
};
const mixSpectral = (a: number[], b: number[], t0: number) => {
  const t = Math.max(0, Math.min(1, t0));
  const e = t * t * (3 - 2 * t);
  const A = rgbToOklch(a), B = rgbToOklch(b);
  let dh = B[2] - A[2];
  while (dh > Math.PI) dh -= 2 * Math.PI;
  while (dh < -Math.PI) dh += 2 * Math.PI;
  const C = Math.max(A[1] + (B[1] - A[1]) * e, SPECTRAL_MIN_CHROMA * Math.sin(Math.PI * e) + Math.min(A[1], B[1]) * 0.9);
  return oklchToRgb([A[0] + (B[0] - A[0]) * e, C, A[2] + dh * e]);
};

/** Curvatura da linha do tempo: o centro desce CURVE_SAG px; as pontas ficam no alto e afinam. */
const CURVE_SAG = 10;
const curveY = (p: number) => { const q = Math.max(0, Math.min(1, p)); return CURVE_SAG * 4 * q * (1 - q); };
const CURVE_LAYER_H = CURVE_SAG + 8; // a camada começa 3px acima da linha reta
const buildCurveMask = (thick: (q: number) => number) => {
  const N = 48, top: string[] = [], bot: string[] = [];
  for (let i = 0; i <= N; i++) {
    const q = i / N, x = (q * 1000).toFixed(1), c = 4 + curveY(q), w = thick(q) / 2;
    top.push(`${x},${(c - w).toFixed(2)}`); bot.unshift(`${x},${(c + w).toFixed(2)}`);
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 ${CURVE_LAYER_H}' preserveAspectRatio='none'><polygon fill='white' points='${top.concat(bot).join(' ')}'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};
const CURVE_MASK_LINE = buildCurveMask(q => 0.4 + 1.6 * Math.pow(Math.sin(Math.PI * q), 0.55)); // 2 px no centro
const CURVE_MASK_BAND = buildCurveMask(() => 8);
const curveLayer = (mask: string): React.CSSProperties => ({
  position: 'absolute', left: 0, right: 0, top: -3, height: CURVE_LAYER_H, pointerEvents: 'none',
  WebkitMaskImage: mask, maskImage: mask, WebkitMaskSize: '100% 100%', maskSize: '100% 100%', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
} as React.CSSProperties);

export const SolarScrubber: React.FC<SolarScrubberProps> = ({ 
  currentDate, 
  onChange, 
  year: propYear, 
  headerRight, 
  onOpenDatePicker,
  onMinimizeTimeline,
  isRealTime = true,
  loopA = null,
  loopB = null,
  onSetLoopA,
  onSetLoopB,
  onClearLoop,
  isLight = false,
  isFreeTier = false,
  onOpenPaymentPlans,
  onOpenSolarCalendar
}) => {
  const [viewSpan, setViewSpan] = useState(365);
  const [viewOffset, setViewOffset] = useState(0);
  const [trackWidth, setTrackWidth] = useState(1000);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const gradRef = useRef<HTMLDivElement>(null);
  const gradDragState = useRef({ isDown: false, startX: 0, startOffset: 0 });
  const trackDragState = useRef({ isDown: false });

  const freeBounds = getFreeTierSolarYearBounds(currentDate);
  const year = isFreeTier ? freeBounds.startDate.getFullYear() : (propYear || currentDate.getFullYear());
  const currentDoy = getDayOfYear(currentDate);
  const zodiacBaseYear = currentDoy >= ZODIAC_YEAR_START ? year : year - 1;
  const zodiacDay = (currentDoy >= ZODIAC_YEAR_START ? currentDoy - ZODIAC_YEAR_START : currentDoy + (365 - ZODIAC_YEAR_START)) + 
    (currentDate.getHours() + currentDate.getMinutes() / 60) / 24;

  const minOffset = -zodiacDay + viewSpan / 2;
  const maxOffset = 365 - zodiacDay - viewSpan / 2;
  const safeOffset = Math.max(minOffset, Math.min(maxOffset, viewOffset));

  const vpStart = zodiacDay - viewSpan / 2 + safeOffset;
  const vpEnd = vpStart + viewSpan;

  useEffect(() => {
    if (!trackRef.current) return;
    const obs = new ResizeObserver(entries => {
      if (entries[0]) setTrackWidth(entries[0].contentRect.width);
    });
    obs.observe(trackRef.current);
    return () => obs.disconnect();
  }, []);

  const getGregorianFromZDay = (zDay: number, baseYear: number) => {
    const doyOffset = Math.floor(zDay);
    const frac = zDay - doyOffset;
    const mins = Math.round(frac * 24 * 60);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const targetDoy = ZODIAC_YEAR_START + doyOffset;
    return new Date(baseYear, 0, targetDoy, h, m, 0);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const trackEl = trackRef.current || containerRef.current;
      const trackRect = trackEl.getBoundingClientRect();
      const mouseX = e.clientX - trackRect.left;
      const W = trackRect.width || 1;
      
      const dayAtCursor = vpStart + Math.max(0, Math.min(1, mouseX / W)) * viewSpan;
      
      const factor = e.deltaY > 0 ? 1.22 : 0.82;
      const newSpan = Math.max(5/1440, Math.min(365, viewSpan * factor));
      
      const newVpStart = dayAtCursor - (mouseX / W) * newSpan;
      const newOffset = newVpStart - (zodiacDay - newSpan / 2);
      
      setViewSpan(newSpan);
      setViewOffset(newOffset);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [vpStart, viewSpan, zodiacDay]);

  
  const pendingDragRef = useRef<{ offset: number; date: Date } | null>(null);
  const dragRafRef = useRef<number | null>(null);

  /** Zoom por toque (celular não tem rodinha): centra a linha no momento atual. */
  const setZoomMode = (span: number) => { setViewSpan(span); setViewOffset(0); };

  const handleGradPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!gradRef.current) return;
    gradRef.current.setPointerCapture(e.pointerId);
    gradDragState.current = { isDown: true, startX: e.clientX, startOffset: safeOffset };
  };

  const handleGradPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!gradDragState.current.isDown) return;
    const dx = e.clientX - gradDragState.current.startX;
    const W = trackWidth || 1;
    const delta = (dx / W) * viewSpan;
    setViewOffset(gradDragState.current.startOffset - delta);
  };

  const handleGradPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    gradDragState.current.isDown = false;
  };

  const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    trackRef.current.setPointerCapture(e.pointerId);
    trackDragState.current.isDown = true;
    handleTrackPointerMove(e);
  };

  const handleTrackPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackDragState.current.isDown) return;
    const trackRect = trackRef.current!.getBoundingClientRect();
    const W = trackRect.width || 1;
    const mouseX = e.clientX - trackRect.left;
    const pct = Math.max(0, Math.min(1, mouseX / W));
    const newZDay = vpStart + pct * viewSpan;
    
    const newOffset = vpStart - newZDay + viewSpan / 2;
    let targetDate = getGregorianFromZDay(newZDay, zodiacBaseYear);
    if (isFreeTier) {
      const { startDate, endDate } = getFreeTierSolarYearBounds(currentDate);
      if (targetDate.getTime() < startDate.getTime() || targetDate.getTime() > endDate.getTime()) {
        onOpenPaymentPlans?.();
        return;
      }
    }
    // O dedo manda dezenas de posições por segundo; o céu só precisa de uma por quadro.
    pendingDragRef.current = { offset: newOffset, date: targetDate };
    if (dragRafRef.current === null) {
      dragRafRef.current = requestAnimationFrame(() => {
        dragRafRef.current = null;
        const p = pendingDragRef.current;
        if (!p) return;
        pendingDragRef.current = null;
        setViewOffset(p.offset);
        onChange(p.date);
      });
    }
  };

  const handleTrackPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    trackDragState.current.isDown = false;
  };

  const setLoopRange = (start: Date, end: Date, autoZoom: boolean = true) => {
    const tA = start.getTime();
    const tB = end.getTime();
    const minT = Math.min(tA, tB);
    const maxT = Math.max(tA, tB);

    if (tA > tB) {
      onSetLoopA?.(end);
      onSetLoopB?.(start);
    } else {
      onSetLoopA?.(start);
      onSetLoopB?.(end);
    }

    if (autoZoom) {
      const durationDays = (maxT - minT) / (1000 * 60 * 60 * 24);
      if (durationDays > 0) {
        const targetSpan = Math.max(1, Math.min(365, durationDays * 1.5));
        setViewSpan(targetSpan);
        const midDate = new Date((minT + maxT) / 2);
        const midDoy = getDayOfYear(midDate);
        const midZDay = (midDoy >= ZODIAC_YEAR_START ? midDoy - ZODIAC_YEAR_START : midDoy + (365 - ZODIAC_YEAR_START)) +
          (midDate.getHours() + midDate.getMinutes() / 60) / 24;
        setViewOffset(midZDay - zodiacDay);
      }
    }
  };

  const getWeekRange = (date: Date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start, end };
  };

  const getGregorianMonthRange = (date: Date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 1, 0, 0, 0);
    return { start, end };
  };

  const getSignRange = (date: Date) => {
    const doy = getDayOfYear(date);
    const zDay = (doy >= ZODIAC_YEAR_START ? doy - ZODIAC_YEAR_START : doy + (365 - ZODIAC_YEAR_START));
    const { sign } = getSignInfo(zDay);

    let startD = sign.startDoy - ZODIAC_YEAR_START;
    if (startD < 0) startD += 365;
    let targetStartZDay = startD;
    while (targetStartZDay < zDay - 180) targetStartZDay += 365;
    while (targetStartZDay > zDay + 180) targetStartZDay -= 365;
    const start = getGregorianFromZDay(targetStartZDay, zodiacBaseYear);

    let nextSignIdx = (SOLAR_SIGNS.findIndex(s => s.key === sign.key) + 1) % SOLAR_SIGNS.length;
    let nextSign = SOLAR_SIGNS[nextSignIdx];
    let endD = nextSign.startDoy - ZODIAC_YEAR_START;
    if (endD < 0) endD += 365;
    let targetEndZDay = targetStartZDay + ((endD - startD + 365) % 365 || 30);
    const end = getGregorianFromZDay(targetEndZDay, zodiacBaseYear);

    return { start, end, sign };
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const trackEl = trackRef.current || containerRef.current;
    if (!trackEl) return;
    
    const rect = trackEl.getBoundingClientRect();
    const W = rect.width || 1;
    const mouseX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, mouseX / W));
    const clickedZDay = vpStart + pct * viewSpan;
    const clickedDate = getGregorianFromZDay(clickedZDay, zodiacBaseYear);

    if (!loopA) {
      onSetLoopA?.(clickedDate);
    } else if (!loopB) {
      if (clickedDate.getTime() < loopA.getTime()) {
        onSetLoopB?.(loopA);
        onSetLoopA?.(clickedDate);
      } else {
        onSetLoopB?.(clickedDate);
      }
    } else {
      // Both exist: restart with new A
      onSetLoopA?.(clickedDate);
      onSetLoopB?.(null);
    }
  };

  const getPctFromDate = (date: Date | null) => {
    if (!date) return null;
    const diffDays = (date.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);
    const zDayOfDate = zodiacDay + diffDays;
    return (zDayOfDate - vpStart) / viewSpan;
  };

  const pctA = getPctFromDate(loopA);
  const pctB = getPctFromDate(loopB);

  const formatDateShort = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month} ${hour}:${min}`;
  };

  const formatDateOnly = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  };


  const pad = (n: number) => String(n).padStart(2, '0');
  const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const TICK_LEVELS = [
    { unitMin: 60 * 1440, tickPx: 20, labelPx: 100 },
    { unitMin: 30 * 1440, tickPx: 20, labelPx: 90 },
    { unitMin: 14 * 1440, tickPx: 20, labelPx: 85 },
    { unitMin: 7 * 1440,  tickPx: 18, labelPx: 80 },
    { unitMin: 3 * 1440,  tickPx: 26, labelPx: 80 },
    { unitMin: 1440,      tickPx: 22, labelPx: 75 },
    { unitMin: 720,       tickPx: 20, labelPx: 75 },
    { unitMin: 360,       tickPx: 20, labelPx: 75 },
    { unitMin: 120,       tickPx: 18, labelPx: 70 },
    { unitMin: 60,        tickPx: 14, labelPx: 70 },
  ];

  const pxPerMin = trackWidth / (viewSpan * 1440);

  let activeTickLvl = TICK_LEVELS[0];
  let activeLabelLvl = TICK_LEVELS[0];
  
  const isMacro = viewSpan > 180;
  if (isMacro) {
    activeTickLvl = { unitMin: 99999999, tickPx: 9999, labelPx: 9999 };
    activeLabelLvl = activeTickLvl;
  }

  for (let lvl of TICK_LEVELS) {
    const px = pxPerMin * lvl.unitMin;
    if (px >= lvl.labelPx) activeLabelLvl = lvl;
    if (px >= lvl.tickPx) activeTickLvl = lvl;
  }

  const vpStartMin = vpStart * 1440;
  const vpEndMin = vpEnd * 1440;
  const tickMin = activeTickLvl.unitMin;
  const labelMin = activeLabelLvl.unitMin;

  const ticks = [];
  const startM = Math.ceil(vpStartMin / tickMin) * tickMin;
  
  const hexToRgbArr = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [255, 255, 255];
  };

  const getSignColor = (zDay: number, opacity: number = 1): string => {
    let wrapped = ((zDay % 365) + 365) % 365;
    const BLEND_DAYS = SPECTRAL_BLEND_DAYS / 2; // metade antes e metade depois da entrada do signo
    
    // Normalize sign ranges
    const normalizedSigns = SOLAR_SIGNS.map((sign, idx) => {
      let startD = sign.startDoy - ZODIAC_YEAR_START;
      if (startD < 0) startD += 365;
      let endD = sign.endDoy - ZODIAC_YEAR_START;
      if (endD < 0) endD += 365;
      if (endD < startD) endD += 365;
      return { ...sign, idx, startD, endD };
    });

    // 1. Check if wrapped falls in a 3-day transition boundary between sign i and sign i+1
    for (let i = 0; i < normalizedSigns.length; i++) {
      const current = normalizedSigns[i];
      const next = normalizedSigns[(i + 1) % normalizedSigns.length];
      
      let boundary = next.startD;
      if (boundary < current.startD) boundary += 365; // year boundary wrap
      
      let w = wrapped;
      if (w < current.startD && boundary >= 365) w += 365;

      const blendStart = boundary - BLEND_DAYS;
      const blendEnd = boundary + BLEND_DAYS;

      if (w >= blendStart && w <= blendEnd) {
        const t = (w - blendStart) / (2 * BLEND_DAYS);
        const rgb1 = hexToRgbArr(current.gradientEnd || current.color);
        const rgb2 = hexToRgbArr(next.gradientStart || next.color);
        // mistura pela roda de cores (OKLCH): nunca passa pelo cinza
        const [r, g, b] = mixSpectral(rgb1, rgb2, t);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      }
    }

    // 2. Otherwise inside a sign body
    for (const sign of normalizedSigns) {
      let w = wrapped;
      if (w < sign.startD && sign.endD >= 365) w += 365;

      const bodyStart = sign.startD + BLEND_DAYS;
      const bodyEnd = sign.endD - BLEND_DAYS;

      if (w >= sign.startD && w <= sign.endD) {
        const range = Math.max(0.001, bodyEnd - bodyStart);
        const progress = Math.min(1, Math.max(0, (w - bodyStart) / range));

        const rgb1 = hexToRgbArr(sign.gradientStart || sign.color);
        const rgb2 = hexToRgbArr(sign.gradientEnd || sign.color);

        const r = Math.round(rgb1[0] + (rgb2[0] - rgb1[0]) * progress);
        const g = Math.round(rgb1[1] + (rgb2[1] - rgb1[1]) * progress);
        const b = Math.round(rgb1[2] + (rgb2[2] - rgb1[2]) * progress);

        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      }
    }

    return `rgba(255, 255, 255, ${opacity})`;
  };

  const minLabelPx = 65;
  let lastLabeledPx = -9999;

  for (let m = startM; m <= vpEndMin; m += tickMin) {
    const zDay = m / 1440;
    const pct = (zDay - vpStart) / viewSpan;
    const currentPx = pct * viewSpan * 1440 * pxPerMin;
    const d = getGregorianFromZDay(zDay, zodiacBaseYear);
    const isMidnight = d.getHours() === 0 && d.getMinutes() === 0;
    const isHourReading = !isMacro && viewSpan <= 3;
    const isDayStart = isHourReading && isMidnight;
    const isWeekStart = !isMacro && isMidnight && d.getDay() === 0; // Entrada da semana (Domingo 00:00)
    const isMonthStart = !isMacro && isMidnight && d.getDate() === 1;
    const isHourTick = isHourReading && d.getMinutes() === 0;

    // Quando o zoom estiver dando leitura para horas, ignorar marcações fracionadas (meia hora)
    if (isHourReading && d.getMinutes() !== 0) {
      continue;
    }

    let isLabel = false;
    let isSubTick = false;
    let labelStr = null;
    let isBold = false;
    
    if (isMonthStart) {
      if (currentPx - lastLabeledPx >= 45 || lastLabeledPx === -9999) {
        isLabel = true;
        labelStr = `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
        isBold = true;
        lastLabeledPx = currentPx;
      }
    } else if (isWeekStart && viewSpan <= 30) {
      if (currentPx - lastLabeledPx >= minLabelPx) {
        isLabel = true;
        labelStr = `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
        isBold = true;
        lastLabeledPx = currentPx;
      }
    } else if (!isMacro && viewSpan <= 14) {
      // Zoomed in: show sub-labels for dates/hours in white on the same line (bottom: 8)
      if (viewSpan > 3 && isMidnight) {
        if (currentPx - lastLabeledPx >= minLabelPx) {
          isLabel = true;
          isSubTick = true;
          labelStr = `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
          lastLabeledPx = currentPx;
        }
      } else if (isHourReading) {
        if (isMidnight) {
          isLabel = true;
          labelStr = `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
          isBold = true;
          lastLabeledPx = currentPx;
        } else {
          const hourMinLabelPx = 40;
          if (currentPx - lastLabeledPx >= hourMinLabelPx) {
            isLabel = true;
            isSubTick = true;
            const hStr = d.getHours().toString().padStart(2, '0');
            labelStr = `${hStr}h`;
            lastLabeledPx = currentPx;
          }
        }
      }
    } else if (viewSpan > 14 && !isMacro) {
      if (currentPx - lastLabeledPx >= minLabelPx) {
        isLabel = true;
        labelStr = `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
        lastLabeledPx = currentPx;
      }
    }
    
    ticks.push({
      key: `tick-${m}`,
      pct,
      isLabel,
      isSubTick,
      labelStr,
      isBold,
      isDayStart,
      isHourTick,
      isWeekStart,
      isMonthStart,
      dateObj: d,
      color: getSignColor(zDay, 0.8)
    });
  }

  // Calculate Moon Phase Markers across view span
  const moonPhaseMarkers: Array<{
    key: string;
    pct: number;
    dateObj: Date;
    phaseName: string;
    icon: string;
    color: string;
  }> = [];

  if (viewSpan <= 120) {
    const tStart = getGregorianFromZDay(vpStart, zodiacBaseYear).getTime();
    const tEnd = getGregorianFromZDay(vpEnd, zodiacBaseYear).getTime();
    const stepMs = 6 * 3600 * 1000; // Step every 6 hours
    
    const TARGETS = [
      { target: 0.0, name: 'Lua Nova', icon: '🌑', color: '#38bdf8' },
      { target: 0.25, name: 'Q. Crescente', icon: '🌓', color: '#34d399' },
      { target: 0.50, name: 'Lua Cheia', icon: '🌕', color: '#fde047' },
      { target: 0.75, name: 'Q. Minguante', icon: '🌗', color: '#f472b6' }
    ];

    for (let t = tStart - stepMs; t <= tEnd + stepMs; t += stepMs) {
      const t1 = t;
      const t2 = t + stepMs;
      const p1 = getMoonPhaseAtDate(new Date(t1));
      const p2 = getMoonPhaseAtDate(new Date(t2));

      for (const tgt of TARGETS) {
        let isCrossed = false;
        if (tgt.target === 0.0) {
          if (p1 > 0.85 && p2 < 0.15) isCrossed = true;
        } else {
          if (p1 < tgt.target && p2 >= tgt.target) isCrossed = true;
        }

        if (isCrossed) {
          let low = t1, high = t2;
          for (let k = 0; k < 6; k++) {
            const mid = (low + high) / 2;
            const pMid = getMoonPhaseAtDate(new Date(mid));
            if (tgt.target === 0.0) {
              if (pMid > 0.5) low = mid; else high = mid;
            } else {
              if (pMid < tgt.target) low = mid; else high = mid;
            }
          }
          const exactDate = new Date((low + high) / 2);
          const diffDays = (exactDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);
          const zDay = zodiacDay + diffDays;
          const pct = (zDay - vpStart) / viewSpan;

          if (pct >= 0 && pct <= 1) {
            moonPhaseMarkers.push({
              key: `moon-${tgt.target}-${exactDate.getTime()}`,
              pct,
              dateObj: exactDate,
              phaseName: tgt.name,
              icon: tgt.icon,
              color: tgt.color
            });
          }
        }
      }
    }
  }

  const signsPx = pxPerMin * 30 * 1440;
  const showSignLabels = true; // Always visible

  let signElements = [];
  
  const getSignInfo = (zDay: number) => {
    let wrapped = ((zDay % 365) + 365) % 365;
    
    for (let i = 0; i < SOLAR_SIGNS.length; i++) {
      const sign = SOLAR_SIGNS[i];
      const nextSign = SOLAR_SIGNS[(i + 1) % SOLAR_SIGNS.length];
      
      let startD = (sign.startDoy - ZODIAC_YEAR_START + 365) % 365;
      let nextStartD = (nextSign.startDoy - ZODIAC_YEAR_START + 365) % 365;
      if (nextStartD <= startD) nextStartD += 365;
      
      let w = wrapped;
      if (w < startD && nextStartD >= 365) w += 365;

      if (w >= startD && w < nextStartD) {
        const daysInto = Math.floor(w - startD) + 1;
        const totalDays = Math.round(nextStartD - startD);
        return {
          sign,
          daysIntoSign: daysInto,
          signDays: totalDays
        };
      }
    }
    
    return {
      sign: SOLAR_SIGNS[0],
      daysIntoSign: 1,
      signDays: 30
    };
  };

  const { sign: currentSign, daysIntoSign, signDays } = getSignInfo(zodiacDay);

  if (showSignLabels) {
    SOLAR_SIGNS.forEach(sign => {
      let startD = sign.startDoy - ZODIAC_YEAR_START;
      if (startD < 0) startD += 365;
      let endD = sign.endDoy - ZODIAC_YEAR_START;
      if (endD < 0) endD += 365;
      if (endD < startD) endD += 365;

      const midD = (startD + endD) / 2;
      const pct = (midD - vpStart) / viewSpan;
      if (pct >= 0 && pct <= 1) {
        const SignIcon = ZODIAC_ICONS[sign.key as keyof typeof ZODIAC_ICONS];
        
        let targetStartZDay = startD;
        while (targetStartZDay < vpStart - 180) targetStartZDay += 365;
        while (targetStartZDay > vpStart + 180) targetStartZDay -= 365;
        const signStartDate = getGregorianFromZDay(targetStartZDay, zodiacBaseYear);

        let targetEndZDay = endD + 1;
        while (targetEndZDay < targetStartZDay) targetEndZDay += 365;
        const signEndDate = getGregorianFromZDay(targetEndZDay, zodiacBaseYear);

        const handleSignClick = (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          onChange(signStartDate);
        };

        const handleSignDoubleClick = (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          setLoopRange(signStartDate, signEndDate);
        };

        signElements.push(
          <div 
            key={`sign-${sign.key}`}
            onClick={handleSignClick}
            onDoubleClick={handleSignDoubleClick}
            title={`${sign.name}: clique para ir ao dia 1 | duplo clique para definir Loop A/B`}
            className="cursor-pointer hover:scale-130 transition-transform p-1.5 -m-1.5 rounded-full hover:bg-white/10 flex items-center justify-center"
            style={{
              position: 'absolute', left: `${pct * 100}%`, bottom: isMacro ? 2 : 22, transform: `translateX(-50%) translateY(${curveY(pct)}px)`,
              color: getSignColor(midD, 1),
              zIndex: 30
            }}
          >
            {SignIcon && <SignIcon style={{ width: 14, height: 14 }} />}
          </div>
        );
      }
    });
  }

  
  const numStops = 150;
  const gradientStops = (opacity: number) => Array.from({ length: numStops + 1 }).map((_, i) => {
    const pct = i / numStops;
    const zDay = vpStart + pct * viewSpan;
    return `${getSignColor(zDay, opacity)} ${pct * 100}%`;
  }).join(', ');
  
  const bgDim = `linear-gradient(to right, ${gradientStops(0.15)})`;
  const bgBright = `linear-gradient(to right, ${gradientStops(1)})`;

  const getVirtualMode = () => {
    if (viewSpan > 180) return 'ANO';
    if (viewSpan > 21) return 'SIGNO';
    if (viewSpan > 3) return 'SEMANA';
    return 'DIA';
  };
  const vMode = getVirtualMode();
  const MODE_TITLES: Record<string, string> = {
    ANO: 'Ano',
    SIGNO: 'Signo',
    SEMANA: 'Semana',
    DIA: 'Dia',
  };

  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  const CurrentSignIcon = ZODIAC_ICONS[currentSign.key as keyof typeof ZODIAC_ICONS];

  const cursorPct = (zodiacDay - vpStart) / viewSpan;

  const signBoundaryLines: Array<{
    key: string;
    pct: number;
    signStartDate: Date;
    signEndDate: Date;
    sign: typeof SOLAR_SIGNS[0];
  }> = [];

  if (viewSpan <= 90) {
    SOLAR_SIGNS.forEach((sign, idx) => {
      let startD = sign.startDoy - ZODIAC_YEAR_START;
      if (startD < 0) startD += 365;
      let targetStartZDay = startD;
      while (targetStartZDay < vpStart - 180) targetStartZDay += 365;
      while (targetStartZDay > vpStart + 180) targetStartZDay -= 365;
      const signStartDate = getGregorianFromZDay(targetStartZDay, zodiacBaseYear);

      let nextSign = SOLAR_SIGNS[(idx + 1) % SOLAR_SIGNS.length];
      let endD = nextSign.startDoy - ZODIAC_YEAR_START;
      if (endD < 0) endD += 365;
      let targetEndZDay = targetStartZDay + ((endD - startD + 365) % 365 || 30);
      const signEndDate = getGregorianFromZDay(targetEndZDay, zodiacBaseYear);

      const startPct = getPctFromDate(signStartDate);
      if (startPct !== null && startPct >= -0.02 && startPct <= 1.02) {
        signBoundaryLines.push({
          key: `sign-boundary-${sign.key}-${signStartDate.getTime()}`,
          pct: startPct,
          signStartDate,
          signEndDate,
          sign
        });
      }
    });
  }

  return (
    <div data-tour="timeline" style={{ padding: '4px 0 0 0', userSelect: 'none' }} ref={containerRef} className="flex-1 min-w-[150px]">
      <div className="flex justify-between items-end mb-0.5 relative min-h-[48px]">
        <div className="flex items-end gap-2 shrink-0">
          <div
            data-tour="date-display"
            title="Abrir o calendário solar · roda do mouse sobre a linha: zoom · duplo clique na linha: marcar A e B"
            className={`flex items-end gap-1.5 shrink-0 ${isLight ? 'text-neutral-800' : 'text-white'}`}
          >
            <button
              type="button"
              onClick={onOpenSolarCalendar}
              className={`flex flex-col items-start gap-1 -ml-2 px-2 pt-1 pb-0.5 rounded-xl cursor-pointer transition-colors ${isLight ? 'hover:bg-black/[0.05]' : 'hover:bg-white/[0.05]'}`}
            >
              <span className={`text-[9.5px] font-medium uppercase tracking-[0.22em] ${isLight ? 'text-neutral-500' : 'text-white/60'}`} style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>Dia solar</span>
              <span className={`flex items-center gap-2 leading-none ${isLight ? 'text-neutral-900' : 'text-white'}`} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontWeight: 500 }}>
                {CurrentSignIcon && (
                  <span className="inline-flex items-center justify-center shrink-0" style={{ width: 22, height: 22 }}>
                    <CurrentSignIcon style={{ width: 20, height: 20, color: 'currentColor', display: 'block' }} />
                  </span>
                )}
                <span className="text-[22px] leading-none">{daysIntoSign}</span>
                <span className="text-[22px] leading-none">{currentSign.name}</span>
                <i className={`ti ti-chevron-up text-[11px] ${isLight ? 'text-neutral-500' : 'text-white/50'}`} aria-hidden="true" />
              </span>
            </button>

            {isFreeTier && (
              <button
                type="button"
                onClick={onOpenPaymentPlans}
                className={`scrub-free flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider cursor-pointer transition-all active:scale-95 ml-1 ${
                  isLight
                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 shadow-xs'
                }`}
                title="Plano Gratuito: linha do tempo fixada no ano de 2026. Clique para desbloquear todos os anos nos planos Pro e Fundador."
              >
                <span>2026</span>
                <span className="text-[9px] opacity-75 font-normal">(Free)</span>
              </button>
            )}
          </div>



          {(loopA || loopB) && (
            <div data-tour="loop-chip" data-complete={loopA && loopB ? 'true' : 'false'} className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[11px] font-mono select-none ${isLight ? 'bg-amber-500/10 border-amber-500/25 text-amber-800' : 'bg-amber-500/15 border-amber-500/30 text-amber-300'}`}>
              <span className={`w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0`} />
              <span className={`font-semibold ${isLight ? 'text-neutral-800' : 'text-white/90'}`}>Loop:</span>
              <span className="text-cyan-600 dark:text-cyan-300 font-bold">{loopA ? formatDateShort(loopA) : '?'}</span>
              <span className={`${isLight ? 'text-neutral-400' : 'text-white/40'}`}>→</span>
              <span className="text-pink-600 dark:text-pink-300 font-bold">{loopB ? formatDateShort(loopB) : '?'}</span>
              {onClearLoop && (
                <button
                  data-tour="loop-close"
                  onClick={(e) => { e.stopPropagation(); onClearLoop(); }}
                  className={`ml-1 px-1 rounded transition-colors cursor-pointer text-[10px] ${isLight ? 'hover:bg-black/10 text-neutral-500 hover:text-neutral-800' : 'hover:bg-white/20 text-white/70 hover:text-white'}`}
                  title="Limpar Loop A-B"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>
        <div className="m-only scrub-zoom" role="group" aria-label="Zoom da linha do tempo">
          {([['ANO', 'Ano', 365], ['SIGNO', 'Signo', 30], ['SEMANA', 'Sem.', 7], ['DIA', 'Dia', 1]] as const).map(([id, label, span]) => (
            <button key={id} type="button" className={vMode === id ? 'is-on' : ''} onClick={() => setZoomMode(span)}>{label}</button>
          ))}
        </div>
        {headerRight && (
          <div className="scrub-head-right absolute right-0 bottom-0 flex items-end gap-1.5">
            {headerRight}
          </div>
        )}
      </div>

      <div 
        ref={gradRef}
        onPointerDown={handleGradPointerDown}
        onPointerMove={handleGradPointerMove}
        onPointerUp={handleGradPointerUp}
        onPointerLeave={handleGradPointerUp}
        onDoubleClick={handleDoubleClick}
        className="scrub-grad relative w-full h-8 mb-1 overflow-visible cursor-grab active:cursor-grabbing" 
        style={{ fontSize: 10, touchAction: 'none' }}
      >
        {signElements}
        {/* Linhas Finas de Entrada dos Signos com Símbolo SVG e Dia (Apenas na visualização de Mês) */}
        {signBoundaryLines.map(sb => {
          const SignIcon = ZODIAC_ICONS[sb.sign.key as keyof typeof ZODIAC_ICONS];
          return (
            <div
              key={sb.key}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                let targetDate = sb.signStartDate;
                if (isFreeTier) {
                  const { startDate, endDate } = getFreeTierSolarYearBounds(currentDate);
                  if (targetDate.getTime() < startDate.getTime() || targetDate.getTime() > endDate.getTime()) {
                    onOpenPaymentPlans?.();
                    return;
                  }
                }
                onChange(targetDate);
              }}
              onDoubleClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLoopRange(sb.signStartDate, sb.signEndDate);
              }}
              title={`Entrada em ${sb.sign.name}: ${formatDateShort(sb.signStartDate)} (Clique para ir | Duplo clique para Loop A-B)`}
              className="absolute group cursor-pointer"
              style={{
                left: `${sb.pct * 100}%`,
                top: 0,
                bottom: 0,
                zIndex: 25,
                transform: `translateX(-50%) translateY(${curveY(sb.pct)}px)`
              }}
            >
              {/* Pequena linha centralizada alinhada horizontalmente com os signos */}
              <div 
                className="w-[1.5px] h-2.5 mx-auto transition-all group-hover:w-[2.5px]"
                style={{ 
                  position: 'absolute',
                  bottom: 10,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: sb.sign.color, 
                  boxShadow: `0 0 6px ${sb.sign.color}` 
                }}
              />
              {/* Tag sem bordas, apenas SVG do signo e data com gradiente */}
              <div 
                className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 whitespace-nowrap text-[10px] font-bold pointer-events-auto group-hover:scale-110 transition-transform select-none"
                style={{
                  bottom: 26,
                }}
              >
                {SignIcon && (
                  <SignIcon 
                    style={{ 
                      width: 12, 
                      height: 12, 
                      color: sb.sign.color,
                      filter: `drop-shadow(0 0 4px ${sb.sign.color})`
                    }} 
                  />
                )}
                <span 
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${sb.sign.gradientStart || sb.sign.color}, ${sb.sign.gradientEnd || sb.sign.color})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: isLight ? 'none' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.95))',
                    textShadow: isLight ? '0 1px 1px rgba(255,255,255,0.8)' : 'none'
                  }}
                >
                  {sb.signStartDate.getDate()} {MONTHS_SHORT[sb.signStartDate.getMonth()]}
                </span>
              </div>
            </div>
          );
        })}

        {/* Marcadores de Fases da Lua no Scrubber (Entradas de Lua Nova, Crescente, Cheia e Minguante) */}
        {!isMacro && moonPhaseMarkers.map(mp => (
          <div
            key={mp.key}
            data-tour={mp.phaseName === 'Lua Nova' ? 'moon-new' : undefined}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onChange(mp.dateObj);
            }}
            onDoubleClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const endD = new Date(mp.dateObj.getTime() + 7 * 24 * 3600 * 1000);
              setLoopRange(mp.dateObj, endD);
            }}
            title={`${mp.phaseName}: ${formatDateShort(mp.dateObj)} (Clique para ir | Duplo clique para Loop A-B)`}
            className="absolute group cursor-pointer"
            style={{
              left: `${mp.pct * 100}%`,
              top: 0,
              bottom: 0,
              zIndex: 26,
              transform: `translateX(-50%) translateY(${curveY(mp.pct)}px)`
            }}
          >
            {/* Linha vertical com tom da fase */}
            <div 
              className="w-[1.5px] h-3 mx-auto transition-all group-hover:w-[2.5px]"
              style={{ 
                position: 'absolute',
                bottom: 2,
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: mp.color, 
                boxShadow: `0 0 6px ${mp.color}` 
              }}
            />
            {/* Tag da Fase da Lua com Ícone e Data */}
            <div 
              className={`absolute left-1/2 -translate-x-1/2 flex items-center gap-1 whitespace-nowrap text-[9px] font-bold pointer-events-auto group-hover:scale-110 transition-transform select-none px-1.5 py-0.5 rounded-full border shadow-md ${isLight ? 'bg-white/95 border-black/10 text-neutral-800' : 'bg-[#06060a]/90 border-white/20 text-white'}`}
              style={{
                bottom: 18,
                color: mp.color,
              }}
            >
              <span className="text-[10px]">{mp.icon}</span>
              <span className={`font-mono text-[9px] ${isLight ? 'text-neutral-700' : 'text-white/90'}`}>
                {viewSpan > 3 ? formatDateOnly(mp.dateObj) : formatDateShort(mp.dateObj)}
              </span>
            </div>
          </div>
        ))}

        {!isMacro && ticks.map(t => (
          <div 
            key={t.key} 
            style={{ position: 'absolute', left: `${t.pct * 100}%`, bottom: 0, transform: `translateY(${curveY(t.pct)}px)` }}
            className="group/tick cursor-pointer select-none"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              if (t.dateObj) {
                onChange(t.dateObj);
              }
            }}
            onDoubleClick={(e) => {
              if (t.dateObj) {
                e.stopPropagation();
                e.preventDefault();
                if (t.isWeekStart) {
                  const wEnd = new Date(t.dateObj);
                  wEnd.setDate(wEnd.getDate() + 7);
                  setLoopRange(t.dateObj, wEnd);
                } else if (t.isMonthStart) {
                  const mEnd = new Date(t.dateObj.getFullYear(), t.dateObj.getMonth() + 1, 1, 0, 0, 0);
                  setLoopRange(t.dateObj, mEnd);
                } else {
                  const dayEnd = new Date(t.dateObj);
                  dayEnd.setDate(dayEnd.getDate() + 1);
                  setLoopRange(t.dateObj, dayEnd);
                }
              }
            }}
          >
            {/* Linha do marcador na escala */}
            <div style={{
              position: 'absolute', left: 0, bottom: 0, 
              width: t.isMonthStart ? 1.5 : t.isDayStart ? 2 : (t.isWeekStart && viewSpan <= 30) ? 1.5 : (t.isHourTick ? 1.2 : 1), 
              height: t.isMonthStart ? 9.5 : t.isDayStart ? 9 : (t.isWeekStart && viewSpan <= 30) ? 8 : t.isHourTick ? (t.isLabel ? 7 : 5.5) : (t.isLabel ? 6 : 3.5), 
              background: t.isMonthStart 
                ? '#f59e0b' 
                : t.isDayStart 
                ? '#38bdf8' 
                : (t.isWeekStart && viewSpan <= 30)
                ? '#38bdf8' 
                : t.isHourTick 
                ? (isLight ? '#475569' : '#ffffff') 
                : t.isSubTick 
                ? (isLight ? '#475569' : '#ffffff') 
                : (t.color || (isLight ? 'rgba(71,85,105,0.6)' : 'rgba(255,255,255,0.5)')),
              boxShadow: t.isMonthStart 
                ? '0 0 4px rgba(245, 158, 11, 0.6)' 
                : (t.isDayStart || (t.isWeekStart && viewSpan <= 30)) 
                ? '0 0 4px rgba(56, 189, 248, 0.6)' 
                : 'none'
            }} />

            {/* Rótulo do marcador na escala */}
            {t.isLabel && t.labelStr && (
              <div 
                style={{
                  position: 'absolute', 
                  left: 0, 
                  bottom: t.isMonthStart ? 21 : (t.isDayStart || (t.isWeekStart && viewSpan <= 30)) ? 10 : 8, 
                  transform: 'translateX(-50%)',
                  fontSize: t.isMonthStart ? 10 : (t.isDayStart || (t.isWeekStart && viewSpan <= 30)) ? 10 : (t.isHourTick ? 9.5 : 9), 
                  color: t.isMonthStart 
                    ? (isLight ? '#d97706' : '#fde047') 
                    : t.isDayStart || (t.isWeekStart && viewSpan <= 30)
                    ? (isLight ? '#0284c7' : '#7dd3fc') 
                    : (isLight ? '#1e293b' : '#ffffff'),
                  fontWeight: (t.isBold || t.isMonthStart || t.isDayStart || (t.isWeekStart && viewSpan <= 30)) ? 700 : 400,
                  fontFamily: (t.isHourTick && !t.isDayStart) ? "'DM Mono', ui-monospace, monospace" : 'system-ui, -apple-system, sans-serif',
                  letterSpacing: (t.isHourTick && !t.isDayStart) ? '-0.02em' : '0.02em',
                  whiteSpace: 'nowrap',
                  textShadow: isLight ? '0 1px 1px rgba(255,255,255,0.9)' : '0 1px 3px rgba(0,0,0,0.95)',
                  opacity: (t.isHourTick && !t.isDayStart) ? 0.9 : 1
                }}
                className={`transition-all pointer-events-auto cursor-pointer ${
                  t.isMonthStart 
                    ? (isLight ? 'hover:text-amber-700 hover:scale-110' : 'hover:text-amber-200 hover:scale-110')
                    : (t.isDayStart || (t.isWeekStart && viewSpan <= 30))
                    ? (isLight ? 'hover:text-blue-700 hover:scale-110' : 'hover:text-cyan-200 hover:scale-110')
                    : (isLight ? 'hover:text-black hover:scale-105' : 'hover:text-white hover:scale-105')
                }`}
                title={
                  t.isMonthStart 
                    ? `Início de Mês (${t.labelStr}) - Clique para ir | Duplo clique para Loop A-B`
                    : t.isWeekStart 
                    ? `Entrada da Semana (${t.labelStr}) - Clique para ir | Duplo clique para Loop A-B` 
                    : t.isDayStart
                    ? `Início do Dia (${t.labelStr}) - Clique para ir | Duplo clique para Loop A-B`
                    : `${t.labelStr} - Clique para ir | Duplo clique para Loop A-B`
                }
              >
                {t.labelStr}
              </div>
            )}
          </div>
        ))}
      </div>

      <div 
        ref={trackRef}
        style={{ touchAction: 'none', paddingBottom: 8 + CURVE_SAG }}
        className="scrub-track w-full py-2 cursor-pointer relative"
        onPointerDown={handleTrackPointerDown}
        onPointerMove={handleTrackPointerMove}
        onPointerUp={handleTrackPointerUp}
        onPointerLeave={handleTrackPointerUp}
        onDoubleClick={handleDoubleClick}
      >
        <div style={{ position: 'relative', width: '100%', height: 2 }}>
          <div style={curveLayer(CURVE_MASK_LINE)}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.05)' }} />
            <div style={{ position: 'absolute', inset: 0, background: bgDim }} />
            <div style={{
              position: 'absolute', inset: 0,
              clipPath: isRealTime ? `inset(0 ${Math.max(0, 100 - cursorPct * 100)}% 0 0)` : 'none',
              background: bgBright
            }} />
          </div>

          {/* Loop A-B Highlight Region */}
          {pctA !== null && pctB !== null && (
            <div style={curveLayer(CURVE_MASK_BAND)}><div style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${Math.max(0, Math.min(1, Math.min(pctA, pctB))) * 100}%`,
              width: `${Math.max(0, Math.min(1, Math.abs(pctB - pctA))) * 100}%`,
              background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.35), rgba(236, 72, 153, 0.35))',
              boxShadow: '0 0 10px rgba(6, 182, 212, 0.4)',
              borderRadius: 3,
              pointerEvents: 'none',
              zIndex: 4
            }} /></div>
          )}

          {/* Point A Marker Pin */}
          {pctA !== null && pctA >= -0.2 && pctA <= 1.2 && (
            <div style={{
              position: 'absolute',
              left: `${pctA * 100}%`,
              top: '50%',
              transform: `translateX(-50%) translateY(${curveY(pctA)}px)`,
              zIndex: 15,
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <div style={{
                position: 'absolute',
                bottom: 8,
                background: '#06B6D4',
                color: '#000000',
                fontSize: 9,
                fontWeight: 800,
                fontFamily: 'monospace',
                padding: '1px 5px',
                borderRadius: 4,
                boxShadow: '0 0 8px rgba(6, 182, 212, 0.9)',
                border: '1px solid #22D3EE',
                whiteSpace: 'nowrap'
              }}>
                A
              </div>
              <div style={{
                width: 2,
                height: 20,
                background: '#06B6D4',
                boxShadow: '0 0 6px #06B6D4',
                borderRadius: 1
              }} />
            </div>
          )}

          {/* Point B Marker Pin */}
          {pctB !== null && pctB >= -0.2 && pctB <= 1.2 && (
            <div style={{
              position: 'absolute',
              left: `${pctB * 100}%`,
              top: '50%',
              transform: `translateX(-50%) translateY(${curveY(pctB)}px)`,
              zIndex: 15,
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <div style={{
                position: 'absolute',
                bottom: 8,
                background: '#EC4899',
                color: '#FFFFFF',
                fontSize: 9,
                fontWeight: 800,
                fontFamily: 'monospace',
                padding: '1px 5px',
                borderRadius: 4,
                boxShadow: '0 0 8px rgba(236, 72, 153, 0.9)',
                border: '1px solid #F472B6',
                whiteSpace: 'nowrap'
              }}>
                B
              </div>
              <div style={{
                width: 2,
                height: 20,
                background: '#EC4899',
                boxShadow: '0 0 6px #EC4899',
                borderRadius: 1
              }} />
            </div>
          )}
          
          <div className="scrub-thumb" data-tour="scrub-thumb" style={{
            position: 'absolute',
            left: `${cursorPct * 100}%`,
            top: '50%',
            transform: `translate(-50%, calc(-50% + ${curveY(cursorPct)}px))`,
            zIndex: 10,
            cursor: 'ew-resize'
          }}>
            {isRealTime ? (
              <svg width="24" height="24" viewBox="-12 -12 24 24" style={{ overflow:'visible', pointerEvents:'none' }}>
                <defs>
                  <filter id="star-glow">
                    <feGaussianBlur stdDeviation="2.5" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                <path
                  d="M0,-10 C-1.5,-2 -1.5,-2 -10,0 C-1.5,2 -1.5,2 0,10 C1.5,2 1.5,2 10,0 C1.5,-2 1.5,-2 0,-10 Z"
                  fill={isLight ? "#1c1917" : "white"}
                  filter={isLight ? undefined : "url(#star-glow)"}
                />
              </svg>
            ) : (
              <div style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: isLight ? '#1c1917' : '#FFFFFF',
                boxShadow: isLight
                  ? '0 0 8px 2px rgba(28,25,23,0.4), 0 0 0 2px rgba(28,25,23,0.25)'
                  : '0 0 10px 2px rgba(255,255,255,0.6), 0 0 0 2px rgba(255,255,255,0.4)',
                pointerEvents: 'none'
              }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
