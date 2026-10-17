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
}

const SOLAR_SIGNS = [
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

const ZODIAC_YEAR_START = 80;

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
  onOpenPaymentPlans
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
    setViewOffset(newOffset);
    let targetDate = getGregorianFromZDay(newZDay, zodiacBaseYear);
    if (isFreeTier) {
      const { startDate, endDate } = getFreeTierSolarYearBounds(currentDate);
      if (targetDate.getTime() < startDate.getTime() || targetDate.getTime() > endDate.getTime()) {
        onOpenPaymentPlans?.();
        return;
      }
    }
    onChange(targetDate);
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
    const BLEND_DAYS = 1.5; // 1.5 days before & after boundary = 3 days total transition
    
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

        const r = Math.round(rgb1[0] + (rgb2[0] - rgb1[0]) * t);
        const g = Math.round(rgb1[1] + (rgb2[1] - rgb1[1]) * t);
        const b = Math.round(rgb1[2] + (rgb2[2] - rgb1[2]) * t);

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
              position: 'absolute', left: `${pct * 100}%`, bottom: isMacro ? 2 : 22, transform: 'translateX(-50%)',
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
  const bgBright = `linear-gradient(to right, ${gradientStops(0.75)})`;

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
    <div style={{ padding: '4px 0 0 0', userSelect: 'none' }} ref={containerRef} className="flex-1 min-w-[150px]">
      <div className="flex justify-between items-center mb-1 relative min-h-[38px]">
        <div className="flex items-center gap-2 shrink-0">
          <div
            title="Use a roda do mouse sobre a linha para Zoom | Duplo clique para marcar A e B"
            className={`flex items-center gap-1.5 shrink-0 px-2 py-0.5 rounded-lg border border-transparent ${isLight ? 'bg-black/[0.04] text-neutral-800' : 'bg-white/[0.02] text-white'}`}
          >
            {CurrentSignIcon && <CurrentSignIcon style={{ width: 16, height: 16, color: getSignColor(zodiacDay, 1) }} />}
            <span className="flex items-center gap-1" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              <span className={`${isLight ? 'text-neutral-700 font-medium' : 'text-white/80'} font-normal text-[13px]`}>dia {daysIntoSign}</span>{' '}
              <span className="font-semibold text-[13px]" style={{ color: getSignColor(zodiacDay, 1) }}>de {currentSign.name}</span>
            </span>
            <span className={`text-[10px] uppercase tracking-wider font-mono px-1.5 py-0.2 rounded ml-0.5 ${isLight ? 'bg-black/10 text-neutral-700 font-bold' : 'bg-white/10 text-white/70'}`}>
              {MODE_TITLES[vMode]}
            </span>

            {isFreeTier && (
              <button
                type="button"
                onClick={onOpenPaymentPlans}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider cursor-pointer transition-all active:scale-95 ml-1 ${
                  isLight
                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 shadow-xs'
                }`}
                title="Plano Gratuito: linha do tempo fixada no ano de 2026. Clique para desbloquear todos os anos nos Planos Mensal e Vitalício."
              >
                <span>2026</span>
                <span className="text-[9px] opacity-75 font-normal">(Free)</span>
              </button>
            )}
          </div>



          {(loopA || loopB) && (
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[11px] font-mono select-none ${isLight ? 'bg-amber-500/10 border-amber-500/25 text-amber-800' : 'bg-amber-500/15 border-amber-500/30 text-amber-300'}`}>
              <span className={`w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0`} />
              <span className={`font-semibold ${isLight ? 'text-neutral-800' : 'text-white/90'}`}>Loop:</span>
              <span className="text-cyan-600 dark:text-cyan-300 font-bold">{loopA ? formatDateShort(loopA) : '?'}</span>
              <span className={`${isLight ? 'text-neutral-400' : 'text-white/40'}`}>→</span>
              <span className="text-pink-600 dark:text-pink-300 font-bold">{loopB ? formatDateShort(loopB) : '?'}</span>
              {onClearLoop && (
                <button
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
        {headerRight && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {headerRight}
            <button
              onClick={onOpenDatePicker}
              className={`p-1.5 rounded-lg transition-all active:scale-95 shrink-0 ${isLight ? 'bg-black/[0.04] hover:bg-black/[0.08] border border-black/[0.05] hover:border-black/20 text-neutral-600 hover:text-neutral-900' : 'bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.05] hover:border-white/20 text-white/70 hover:text-white'}`}
              title="Escolher data"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </button>
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
        className="relative w-full h-8 mb-1 overflow-visible cursor-grab active:cursor-grabbing" 
        style={{ fontSize: 10 }}
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
                transform: 'translateX(-50%)'
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
              transform: 'translateX(-50%)'
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
            style={{ position: 'absolute', left: `${t.pct * 100}%`, bottom: 0 }}
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
        className="w-full py-2 cursor-pointer relative"
        onPointerDown={handleTrackPointerDown}
        onPointerMove={handleTrackPointerMove}
        onPointerUp={handleTrackPointerUp}
        onPointerLeave={handleTrackPointerUp}
        onDoubleClick={handleDoubleClick}
      >
        <div style={{ position: 'relative', width: '100%', height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.05)' }}>
          <div style={{ position: 'absolute', inset: 0, background: bgDim, borderRadius: 2 }} />
          
          <div style={{ 
            position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
            clipPath: isRealTime ? `inset(0 ${Math.max(0, 100 - cursorPct * 100)}% 0 0)` : 'none',
            background: bgBright,
            borderRadius: 2
          }} />

          {/* Loop A-B Highlight Region */}
          {pctA !== null && pctB !== null && (
            <div style={{
              position: 'absolute',
              top: -3,
              bottom: -3,
              left: `${Math.max(0, Math.min(1, Math.min(pctA, pctB))) * 100}%`,
              width: `${Math.max(0, Math.min(1, Math.abs(pctB - pctA))) * 100}%`,
              background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.35), rgba(236, 72, 153, 0.35))',
              boxShadow: '0 0 10px rgba(6, 182, 212, 0.4)',
              borderRadius: 3,
              pointerEvents: 'none',
              zIndex: 4
            }} />
          )}

          {/* Point A Marker Pin */}
          {pctA !== null && pctA >= -0.2 && pctA <= 1.2 && (
            <div style={{
              position: 'absolute',
              left: `${pctA * 100}%`,
              top: '50%',
              transform: 'translateX(-50%)',
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
              transform: 'translateX(-50%)',
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
          
          <div className="scrub-thumb" style={{
            position: 'absolute',
            left: `${cursorPct * 100}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
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
