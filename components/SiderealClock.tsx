import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { CelestialData } from "../hooks/useCelestialData";
import { ZODIAC_DATA, ELEMENT_COLORS } from "./zodiac";
import { CELESTIAL_GLYPHS, ZODIAC_ICONS, UI_ICONS } from "./icons";
import {
  normalizeAngle,
  polarToCartesian,
  toRoman,
  toRad,
} from "../lib/astrology/utils";
import { Aspect, ASPECT_ORBS } from "../lib/astrology/aspects";
import {
  PLANET_DESCRIPTIONS,
  SIGN_DESCRIPTIONS,
  HOUSE_DESCRIPTIONS,
} from "./astro-descriptions";
import { ZodiacRing } from "./ZodiacRing";
import { HighlightFilter } from "./ChartStatisticsPanel";
import { SeasonIngress } from "../lib/astrology/calendars";
import { StarField } from "./StarField";
import { Tooltip } from "./Tooltip";
import { getDecanRuler } from "../lib/astrology/dignities";
import { getMoonPhaseInfo } from "../lib/astrology/moon";
import { getMoonAge, getCelticMoonCycle } from "../lib/astrology/calendars";
import { MoonPhaseDisk } from "./CalendarPanel";
import { CelestialGlyphSvg } from "./chart/CelestialGlyphSvg";

interface SiderealClockProps {
  celestialData: CelestialData;
  natalData?: CelestialData;
  filteredAspects: Aspect[];
  ghostPlanets: string[];
  visiblePlanets: Record<string, boolean>;
  visibleNatalPlanets?: Record<string, boolean>;
  selectedPlanets: string[];
  selectedAspects: string[];
  selectedHouses: number[];
  hoveredPlanet: string | null;
  hoveredAspect: string | null;
  hoveredHouse: number | null;
  onPlanetClick: (id: string) => void;
  onAspectClick: (id: string) => void;
  onHouseClick: (houseNumber: number) => void;
  setHoveredHouse: React.Dispatch<React.SetStateAction<number | null>>;
  planetSize?: number;
  zodiacSignSize?: number;
  termsGlyphSize?: number;
  decanGlyphSize?: number;
  graduationRingWidth?: number;
  zodiacRingScale?: number;
  seasonsRingScale?: number;
  decanRingScale?: number;
  termsRingScale?: number;
  showPlanetSpheres?: boolean;
  showAspectLines?: boolean;
  showNeedle?: boolean;
  isZodiacFixed?: boolean;
  locationName?: string;
  isNatalMode?: boolean;
  showAtmosphere?: boolean;
  houseFormat?: "arabic" | "roman";
  houseLineFormat?: "solid" | "dashed";
  showHouseLines?: boolean;
  showHouseMarkers?: boolean;
  showMcIcArrows?: boolean;
  showTimeRing?: boolean;
  showOrbits?: boolean;
  allPlanetsSameOrbit?: boolean;
  showStars?: boolean;
  showSeasonsRing?: boolean;
  showDegreeLabels?: boolean;
  degreeLabelSize?: number;
  degreeLabelPosition?: "responsive" | "static" | "callout" | "staggered";
  degreeLabelFormat?: "vertical" | "horizontal";
  zodiacColorMode?: "none" | "element" | "modality" | "polarity";
  highlightFilter?: HighlightFilter;
  showSignLines?: boolean;
  showSignColors?: boolean;
  signLineThickness?: number;
  signLineOpacity?: number;
  pointerStyle?: "solid" | "dashed" | "minimal";
  pointerThickness?: number;
  pointerOpacity?: number;
  pointerHead?: "arrow" | "circle" | "diamond" | "square" | "none";
  pointerTail?: "arrow" | "circle" | "diamond" | "square" | "none";
  pointerShowGradLine?: boolean;
  pointerFull?: boolean;
  showConstellations?: boolean;
  customBackgroundImage?: string | null;
  showMagneticField?: boolean;
  magneticFieldSize?: number;
  magneticFieldOpacity?: number;
  timeRingScale?: number;
  showNatalLines?: boolean;
  showDecanRing?: boolean;
  showTermsRing?: boolean;
  theme?: "dark" | "light";
  ringLineColor?: string;
  planetColorMode?: "colored" | "gold";
  natalColorMode?: "gold" | "colored";
  onClockClick?: () => void;
  houseLineThickness?: number;
  houseLineOpacity?: number;
  houseLineColor?: string;
  mainHouseLineThickness?: number;
  mainHouseLineOpacity?: number;
  mainHouseLineColor?: string;
  houseMarkerRingColor?: string;
  houseMarkerRingOpacity?: number;
  seasonIngresses?: SeasonIngress[];
  smoothTransitions?: boolean;
}

type TooltipData = {
  type: "planet" | "sign" | "house";
  title: string;
  description: React.ReactNode;
  x: number;
  y: number;
};

// --- PALETTE DEFINITIONS BASED ON REFERENCE IMAGES ---
const SEASON_COLORS_LIGHT = {
  VERÃO: { bg: "#c8e6c9", text: "#1b5e20", border: "#81c784" }, // verde-esmeralda suave
  OUTONO: { bg: "#ffe0b2", text: "#bf360c", border: "#ffb74d" }, // âmbar queimado
  INVERNO: { bg: "#e3f2fd", text: "#0d47a1", border: "#90caf9" }, // azul-gelo
  PRIMAVERA: { bg: "#fce4ec", text: "#880e4f", border: "#f48fb1" }, // rosa-floral
};

// Stops: 0% (Sun Center), 35% (Halo), 70% (Mid Sky), 100% (Far/Dark)
const ATMOSPHERE_PALETTE = {
  NIGHT: {
    sky: ["#02040a", "#050814", "#091024", "#030408", "#000000"],
    ground: ["#0a1905", "#19320f"],
  },
  DAWN: {
    sky: ["#FFE484", "#FF9E5E", "#E66485", "#7A4E8A", "#1D163D"],
    ground: ["#1e1a0a", "#2c2a12"],
  },
  DAY: {
    sky: ["#FFEAB6", "#FFC594", "#87CEEB", "#4682B4", "#0284c7"],
    ground: ["#2a3018", "#404828"],
  },
  FULL_DAY: {
    sky: ["#bde0fe", "#90e0ef", "#00b4d8", "#0096c7", "#0077b6"],
    ground: ["#303820", "#46502c"],
  },
  DUSK: {
    sky: ["#FFD166", "#FF7D6B", "#C75296", "#684291", "#1E1242"],
    ground: ["#1a1208", "#100c06"],
  },
};

const interpolateColor = (color1: string, color2: string, factor: number = 0.5) => {
  let result = color1.slice();
  if (factor === 0) return color1;
  if (factor === 1) return color2;
  const c1 = {
    r: parseInt(color1.slice(1, 3), 16),
    g: parseInt(color1.slice(3, 5), 16),
    b: parseInt(color1.slice(5, 7), 16),
  };
  const c2 = {
    r: parseInt(color2.slice(1, 3), 16),
    g: parseInt(color2.slice(3, 5), 16),
    b: parseInt(color2.slice(5, 7), 16),
  };
  const r = Math.round(c1.r + (c2.r - c1.r) * factor);
  const g = Math.round(c1.g + (c2.g - c1.g) * factor);
  const b = Math.round(c1.b + (c2.b - c1.b) * factor);

  return `rgb(${r}, ${g}, ${b})`;
};

const interpolatePalette = (
  state1: typeof ATMOSPHERE_PALETTE.NIGHT,
  state2: typeof ATMOSPHERE_PALETTE.NIGHT,
  factor: number,
) => {
  return {
    sky: [
      interpolateColor(state1.sky[0], state2.sky[0], factor),
      interpolateColor(state1.sky[1], state2.sky[1], factor),
      interpolateColor(state1.sky[2], state2.sky[2], factor),
      interpolateColor(state1.sky[3], state2.sky[3], factor),
      interpolateColor(state1.sky[4], state2.sky[4], factor),
    ],
    ground: [
      interpolateColor(state1.ground[0], state2.ground[0], factor),
      interpolateColor(state1.ground[1], state2.ground[1], factor),
    ],
  };
};

const isAngleBetween = (angle: number, start: number, end: number) => {
  const a = normalizeAngle(angle);
  const s = normalizeAngle(start);
  const e = normalizeAngle(end);

  if (s < e) {
    return a >= s && a <= e;
  } else {
    return a >= s || a <= e;
  }
};

const MAJOR_PLANET_IDS = [
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
  "sun",
];

const ELEMENT_HEX_COLORS: Record<string, string> = {
  fire: "#fb923c", // Orange-400 (Copper)
  earth: "#34d399", // Emerald-400 (Emerald)
  air: "#38bdf8", // Sky-400 (Light Blue - matching status panel air color)
  water: "#60a5fa", // Blue-400 (Sapphire)
};

const ALL_PLANET_IDS = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
  "lilith",
  "northNode",
  "southNode",
  "chiron",
  "ceres",
  "pallas",
  "juno",
  "vesta",
  "partOfFortune",
];

const getPlanetRadialIndex = (id: string): number => {
  switch (id) {
    case "moon":
      return 0;
    case "lilith":
      return 0.45;
    case "northNode":
      return 0.45;
    case "southNode":
      return 0.45;
    case "mercury":
      return 0.88;
    case "venus":
      return 1.75;
    case "mars":
      return 2.63;
    case "vesta":
      return 3.05;
    case "juno":
      return 3.05;
    case "ceres":
      return 3.05;
    case "pallas":
      return 3.05;
    case "jupiter":
      return 3.5;
    case "saturn":
      return 4.38;
    case "chiron":
      return 4.8;
    case "uranus":
      return 5.25;
    case "neptune":
      return 6.13;
    case "pluto":
      return 7.0;
    case "sun":
      return 7.88;
    default:
      return 8.5;
  }
};

const describeAnnularSector = (
  x: number,
  y: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
) => {
  const startOuter = polarToCartesian(x, y, outerRadius, startAngle);
  const endOuter = polarToCartesian(x, y, outerRadius, endAngle);
  const startInner = polarToCartesian(x, y, innerRadius, endAngle);
  const endInner = polarToCartesian(x, y, innerRadius, startAngle);

  let diff = endAngle - startAngle;
  if (diff < 0) diff += 360;

  const largeArcFlag = diff > 180 ? "1" : "0";

  return [
    "M",
    startOuter.x,
    startOuter.y,
    "A",
    outerRadius,
    outerRadius,
    0,
    largeArcFlag,
    1,
    endOuter.x,
    endOuter.y,
    "L",
    startInner.x,
    startInner.y,
    "A",
    innerRadius,
    innerRadius,
    0,
    largeArcFlag,
    0,
    endInner.x,
    endInner.y,
    "Z",
  ].join(" ");
};

const describeTextArc = (
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) => {
  let diff = endAngle - startAngle;
  if (diff > 0) diff -= 360;

  const midAngle = normalizeAngle(startAngle + diff / 2);
  const isBottom = midAngle > 90 && midAngle < 270;

  if (isBottom) {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    return [
      "M",
      start.x,
      start.y,
      "A",
      radius,
      radius,
      0,
      0,
      1,
      end.x,
      end.y,
    ].join(" ");
  } else {
    const start = polarToCartesian(x, y, radius, startAngle);
    const end = polarToCartesian(x, y, radius, endAngle);
    return [
      "M",
      start.x,
      start.y,
      "A",
      radius,
      radius,
      0,
      0,
      0,
      end.x,
      end.y,
    ].join(" ");
  }
};

const getMoonPhaseEmoji = (phase: number) => {
  if (phase <= 0.03 || phase >= 0.97) return "🌑";
  if (phase < 0.22) return "🌒";
  if (phase < 0.28) return "🌓";
  if (phase < 0.47) return "🌔";
  if (phase < 0.53) return "🌕";
  if (phase < 0.72) return "🌖";
  if (phase < 0.78) return "🌗";
  return "🌘";
};

const DARK_PLANET_COLORS: Record<string, string> = {
  sun: "#FDE047",
  moon: "#F1F5F9",
  mercury: "#CBD5E1",
  venus: "#FDA4AF",
  mars: "#EF4444",
  jupiter: "#FB923C",
  saturn: "#FACC15",
  uranus: "#22D3EE",
  neptune: "#4870FF",
  pluto: "#94A3B8",
  northNode: "#34D399",
  southNode: "#34D399",
  lilith: "#8B5CF6",
  chiron: "#34D399",
  ceres: "#FACC15",
  pallas: "#4870FF",
  juno: "#FDA4AF",
  vesta: "#FB923C",
  partOfFortune: "#F59E0B",
};

const LIGHT_PLANET_COLORS: Record<string, string> = {
  sun: "#B45309",         // Burnt solar amber
  moon: "#475569",        // Dark silvery slate
  mercury: "#4B5563",     // Steel grey
  venus: "#BE185D",       // Elegant deep rose
  mars: "#B91C1C",        // Deep crimson red
  jupiter: "#C2410C",     // Rich royal orange
  saturn: "#92400E",      // Deep antique gold-brown
  uranus: "#0E7490",      // Ocean deep cyan-teal
  neptune: "#1D4ED8",     // Rich royal blue
  pluto: "#4B5563",       // Deep charcoal slate
  northNode: "#047857",   // Rich emerald green
  southNode: "#047857",   // Rich emerald green
  lilith: "#6D28D9",      // Deep violet
  chiron: "#047857",      // Rich emerald green
  ceres: "#854D0E",       // Olive amber
  pallas: "#1E40AF",      // Deep sapphire
  juno: "#A21CAF",        // Royal fuchsia
  vesta: "#9A3412",       // Hearth copper
  partOfFortune: "#A16207", // Wealth gold
};

const PLANET_COLORS = DARK_PLANET_COLORS;

// Map for glyph colors inside spheres to ensure contrast
const SPHERE_GLYPH_COLORS: Record<string, string> = {
  sun: "#422006", // Dark Brown
  moon: "#1e293b", // Dark Slate
  mercury: "#1e293b", // Dark Slate (Requested)
  venus: "#4c0519", // Dark Rose
  mars: "#ffffff", // White
  jupiter: "#ffffff", // White (Requested)
  saturn: "#422006", // Dark Brown
  uranus: "#0e7490", // Dark Cyan
  neptune: "#ffffff", // White
  pluto: "#ffffff", // White
  northNode: "#0f766e", // Dark Teal
  southNode: "#ffffff", // White
  lilith: "#e879f9", // Light Fuchsia
  chiron: "#064e3b", // Dark Emerald
  ceres: "#3f6212", // Dark Yellow/Green
  pallas: "#1e3a8a", // Dark Blue
  juno: "#831843", // Dark Pink
  vesta: "#7c2d12", // Dark Orange
};

export const HOUSE_RULERS: Record<number, string> = {
  1: "mars",
  2: "venus",
  3: "mercury",
  4: "moon",
  5: "sun",
  6: "mercury",
  7: "venus",
  8: "pluto",
  9: "jupiter",
  10: "saturn",
  11: "uranus",
  12: "neptune",
};

export const checkIsEclipse = (date: Date): { type: "solar" | "lunar"; name: string } | null => {
  if (!date) return null;
  const day = date.getDate();
  const month = date.getMonth() + 1; // 1-based
  const year = date.getFullYear();
  
  if (day === 12 && month === 8 && year === 2026) {
    return { type: "solar", name: "Eclipse Solar Total" };
  }
  if (day === 17 && month === 2 && year === 2026) {
    return { type: "solar", name: "Eclipse Solar Anular" };
  }
  if (day === 3 && month === 3 && year === 2026) {
    return { type: "lunar", name: "Eclipse Lunar Total" };
  }
  if (day === 28 && month === 8 && year === 2026) {
    return { type: "lunar", name: "Eclipse Lunar Parcial" };
  }
  if (day === 6 && month === 2 && year === 2027) {
    return { type: "solar", name: "Eclipse Solar Anular" };
  }
  if (day === 20 && month === 2 && year === 2027) {
    return { type: "lunar", name: "Eclipse Lunar Penumbral" };
  }
  if (day === 2 && month === 8 && year === 2027) {
    return { type: "solar", name: "Eclipse Solar Total" };
  }
  if (day === 18 && month === 8 && year === 2027) {
    return { type: "lunar", name: "Eclipse Lunar Penumbral" };
  }
  return null;
};

export const SiderealClock: React.FC<SiderealClockProps> = ({
  celestialData,
  natalData,
  filteredAspects,
  ghostPlanets,
  visiblePlanets,
  visibleNatalPlanets,
  selectedPlanets,
  selectedAspects,
  selectedHouses,
  hoveredPlanet,
  hoveredAspect,
  hoveredHouse,
  onPlanetClick,
  onAspectClick,
  onHouseClick,
  setHoveredHouse,
  planetSize = 46,
  zodiacSignSize = 46,
  termsGlyphSize = 22,
  decanGlyphSize = 22,
  graduationRingWidth = 18,
  zodiacRingScale = 1.0,
  seasonsRingScale = 0.75,
  decanRingScale = 2.0,
  termsRingScale = 2.0,
  showPlanetSpheres = false,
  showAspectLines = true,
  showNeedle = false,
  isZodiacFixed = false,
  locationName = "",
  isNatalMode = false,
  showAtmosphere = true,
  houseFormat = "arabic",
  houseLineFormat = "solid",
  showHouseLines = true,
  showHouseMarkers = true,
  houseLineThickness = 1,
  houseLineOpacity = 0.4,
  houseLineColor,
  mainHouseLineThickness,
  mainHouseLineOpacity,
  mainHouseLineColor,
  houseMarkerRingColor,
  houseMarkerRingOpacity,
  seasonIngresses,
  showMcIcArrows = false,
  showTimeRing = true,
  showOrbits = true,
  allPlanetsSameOrbit = false,
  showStars = true,
  showSeasonsRing = false,
  showDegreeLabels = false,
  degreeLabelSize = 18,
  degreeLabelPosition = "responsive",
  degreeLabelFormat = "vertical",
  zodiacColorMode = "element",
  highlightFilter,
  showSignLines = false,
  showSignColors = false,
  signLineThickness = 1,
  signLineOpacity = 0.3,
  pointerStyle = "solid",
  pointerThickness = 1,
  pointerOpacity = 0.8,
  pointerHead = "arrow",
  pointerTail = "none",
  pointerShowGradLine = true,
  pointerFull = false,
  showConstellations = true,
  customBackgroundImage = null,
  showMagneticField = false,
  magneticFieldSize = 1,
  magneticFieldOpacity = 0.5,
  timeRingScale = 1,
  showNatalLines = false,
  showDecanRing = true,
  showTermsRing = true,
  theme = "dark",
  ringLineColor,
  planetColorMode = "colored",
  natalColorMode = "gold",
  onClockClick,
  smoothTransitions = true,
}) => {
  const {
    ascendantLongitude,
    midheavenLongitude,
    descendantLongitude,
    imumCoeliLongitude,
    houseCusps,
    zodiacRotation,
    retrogradeStatus,
    stationaryStatus,
    currentTime,
    housePlacements,
    sunriseHour,
    sunsetHour,
    sunDisplayHour,
    solarNoonHour,
    gradientStatus,
    gradientProgress,
    isDayTime,
  } = celestialData;

  const basePlanetColors = theme === "light" ? LIGHT_PLANET_COLORS : DARK_PLANET_COLORS;
  const planetColors = planetColorMode === "gold"
    ? Object.keys(basePlanetColors).reduce((acc, key) => {
        acc[key] = theme === "light" ? "#92400E" : "#FFE566";
        return acc;
      }, {} as Record<string, string>)
    : basePlanetColors;

  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const hoverTimeout = useRef<number | null>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const tooltipRafRef = useRef<number | null>(null);

  // Google Maps / GIS Style Focal-Point Zoom & Pan Engine
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isWheelZooming, setIsWheelZooming] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<{ scale: number; panX: number; panY: number }>({ scale: 1.0, panX: 0, panY: 0 });
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const hasMovedRef = useRef<boolean>(false);
  const touchDistRef = useRef<number | null>(null);
  const wheelTimeoutRef = useRef<number | null>(null);

  // Helper to clamp pan offsets so content stays within viewport with comfortable margin
  const getClampedPan = (
    targetPanX: number,
    targetPanY: number,
    scale: number,
    containerW: number,
    containerH: number
  ) => {
    // Generous, fluid clamping boundaries allowing unconstrained navigation
    const marginX = Math.max(containerW * 1.5, containerW * scale * 1.5);
    const marginY = Math.max(containerH * 1.5, containerH * scale * 1.5);

    return {
      x: Math.min(marginX, Math.max(-marginX, targetPanX)),
      y: Math.min(marginY, Math.max(-marginY, targetPanY)),
    };
  };

  // Helper to update both transformRef and React state synchronously
  const updateTransform = (nextScale: number, nextPanX: number, nextPanY: number) => {
    transformRef.current = { scale: nextScale, panX: nextPanX, panY: nextPanY };
    setZoomScale(nextScale);
    setPan({ x: nextPanX, y: nextPanY });
  };

  // Wheel listener for focal-point zoom centered exactly on cursor position
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }
      setIsWheelZooming(true);
      wheelTimeoutRef.current = window.setTimeout(() => {
        setIsWheelZooming(false);
      }, 120);

      const rect = container.getBoundingClientRect();
      const containerW = container.clientWidth;
      const containerH = container.clientHeight;
      const scaleX = rect.width > 0 ? containerW / rect.width : 1;
      const scaleY = rect.height > 0 ? containerH / rect.height : 1;

      // Mouse coordinate relative to container top-left
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      // Cursor offset relative to container CENTER (since transformOrigin is "center center")
      const cursorX = mouseX - containerW / 2;
      const cursorY = mouseY - containerH / 2;

      const delta = -e.deltaY;
      const factor = delta > 0 ? 1 + Math.min(0.25, delta * 0.0025) : 1 / (1 + Math.min(0.25, -delta * 0.0025));

      const current = transformRef.current;
      let nextScale = Math.min(10, Math.max(0.1, current.scale * factor));
      const scaleRatio = nextScale / current.scale;

      // Focal point zoom formula: keep point under cursor pinned
      const rawPanX = cursorX + (current.panX - cursorX) * scaleRatio;
      const rawPanY = cursorY + (current.panY - cursorY) * scaleRatio;

      const clamped = getClampedPan(rawPanX, rawPanY, nextScale, containerW, containerH);
      const nextPanX = clamped.x;
      const nextPanY = clamped.y;

      updateTransform(nextScale, nextPanX, nextPanY);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // Window listeners for smooth panning during mouse drag
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMoveWindow = (e: MouseEvent) => {
      if (!dragStartRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerW = containerRef.current.clientWidth;
      const containerH = containerRef.current.clientHeight;
      const scaleX = rect.width > 0 ? containerW / rect.width : 1;
      const scaleY = rect.height > 0 ? containerH / rect.height : 1;

      const dx = (e.clientX - dragStartRef.current.x) * scaleX;
      const dy = (e.clientY - dragStartRef.current.y) * scaleY;

      if (Math.hypot(dx, dy) > 3) {
        hasMovedRef.current = true;
      }

      const rawPanX = dragStartRef.current.panX + dx;
      const rawPanY = dragStartRef.current.panY + dy;

      const clamped = getClampedPan(
        rawPanX,
        rawPanY,
        transformRef.current.scale,
        containerW,
        containerH
      );

      updateTransform(transformRef.current.scale, clamped.x, clamped.y);
    };

    const handleMouseUpWindow = () => {
      if (dragStartRef.current) {
        dragStartRef.current = null;
        setIsDragging(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMoveWindow);
    window.addEventListener("mouseup", handleMouseUpWindow);
    return () => {
      window.removeEventListener("mousemove", handleMouseMoveWindow);
      window.removeEventListener("mouseup", handleMouseUpWindow);
    };
  }, [isDragging]);

  const handleStepZoom = (factor: number) => {
    if (!containerRef.current) return;
    const containerW = containerRef.current.clientWidth;
    const containerH = containerRef.current.clientHeight;

    const current = transformRef.current;
    let nextScale = Math.min(10, Math.max(0.1, current.scale * factor));
    const scaleRatio = nextScale / current.scale;

    const rawPanX = current.panX * scaleRatio;
    const rawPanY = current.panY * scaleRatio;
    const clamped = getClampedPan(rawPanX, rawPanY, nextScale, containerW, containerH);

    updateTransform(nextScale, clamped.x, clamped.y);
  };

  const resetZoom = () => {
    updateTransform(1.0, 0, 0);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: transformRef.current.panX,
      panY: transformRef.current.panY,
    };
    hasMovedRef.current = false;
    setIsDragging(true);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      dragStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        panX: transformRef.current.panX,
        panY: transformRef.current.panY,
      };
      hasMovedRef.current = false;
      setIsDragging(true);
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      touchDistRef.current = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const containerW = containerRef.current.clientWidth;
    const containerH = containerRef.current.clientHeight;
    const scaleX = rect.width > 0 ? containerW / rect.width : 1;
    const scaleY = rect.height > 0 ? containerH / rect.height : 1;

    if (e.touches.length === 1 && dragStartRef.current) {
      const touch = e.touches[0];
      const dx = (touch.clientX - dragStartRef.current.x) * scaleX;
      const dy = (touch.clientY - dragStartRef.current.y) * scaleY;
      if (Math.hypot(dx, dy) > 3) {
        hasMovedRef.current = true;
      }
      const clamped = getClampedPan(
        dragStartRef.current.panX + dx,
        dragStartRef.current.panY + dy,
        transformRef.current.scale,
        containerW,
        containerH
      );
      updateTransform(transformRef.current.scale, clamped.x, clamped.y);
    } else if (e.touches.length === 2 && touchDistRef.current !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const newDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      if (newDist === 0) return;
      const factor = newDist / touchDistRef.current;
      touchDistRef.current = newDist;

      const touchCenterX = ((t1.clientX + t2.clientX) / 2 - rect.left) * scaleX;
      const touchCenterY = ((t1.clientY + t2.clientY) / 2 - rect.top) * scaleY;

      const cursorX = touchCenterX - containerW / 2;
      const cursorY = touchCenterY - containerH / 2;

      setIsWheelZooming(true);
      if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
      wheelTimeoutRef.current = window.setTimeout(() => setIsWheelZooming(false), 120);

      const current = transformRef.current;
      let nextScale = Math.min(10, Math.max(0.1, current.scale * factor));
      const scaleRatio = nextScale / current.scale;

      const rawPanX = cursorX + (current.panX - cursorX) * scaleRatio;
      const rawPanY = cursorY + (current.panY - cursorY) * scaleRatio;
      const clamped = getClampedPan(rawPanX, rawPanY, nextScale, containerW, containerH);

      updateTransform(nextScale, clamped.x, clamped.y);
    }
  };

  const handleTouchEnd = () => {
    dragStartRef.current = null;
    touchDistRef.current = null;
    setIsDragging(false);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
      if (tooltipRafRef.current) cancelAnimationFrame(tooltipRafRef.current);
      if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
    };
  }, []);

  // Tópicos de Configuração do Anel de Graduação (Termos + Decanatos)
  const cx = 500;
  const cy = 500;

  const baseZodiacWidth = 40;
  const zodiacWidth = baseZodiacWidth * zodiacRingScale;
  const zodiacRingOuter = 505;
  const zodiacRingInner = zodiacRingOuter - zodiacWidth;

  const baseSeasonsWidth = 30;
  const seasonsWidth = showSeasonsRing ? baseSeasonsWidth * seasonsRingScale : 0;
  
  const graduationRingRadius = isNatalMode
    ? zodiacRingInner - 30
    : zodiacRingInner - seasonsWidth;

  const termTrackHeight = showTermsRing ? 18 * termsRingScale : 0;
  const decanTrackHeight = showDecanRing ? 18 * decanRingScale : 0;
  const gradTrackHeight = graduationRingWidth || 54;
  
  const totalGradWidth = termTrackHeight + decanTrackHeight + gradTrackHeight;
  const graduationTickLength = totalGradWidth;
  const graduationRingInner = graduationRingRadius - graduationTickLength;

  // Time Ring Config - 24h concentric track aligned flush with graduationRingInner
  const timeRingWidth = Math.round(28 * timeRingScale);
  const timeRingOuter = graduationRingInner;
  const timeRingInner = timeRingOuter - timeRingWidth;
  const timeRingCenter = (timeRingOuter + timeRingInner) / 2;
  const timeRingRadius = timeRingCenter;

  const housesRingInner = zodiacRingInner;
  const atmosphereRadius = (showTimeRing && !isNatalMode)
    ? timeRingInner
    : (showDecanRing || showTermsRing)
      ? graduationRingInner
      : (showSeasonsRing && !isNatalMode)
        ? graduationRingRadius
        : zodiacRingInner;
  const innerVoidRadius = 108;
  const numbersProtectionRadius = innerVoidRadius + 25;
  const innerGraduationRadius = 145;
  
  const maxPlanetIndex = 8.5; // From getPlanetRadialIndex maximum
  const idealPlanetsStackBaseRadius = 188;
  const minimumPlanetStackStep = 12;
  const planetOrbitOuterLimit = atmosphereRadius; // exactly at the innermost ring
  
  // Calculate how much space is needed for the minimum step
  const minRequiredSpace = maxPlanetIndex * minimumPlanetStackStep;
  
  // Dynamically adjust the base radius if we are very tight on space, but don't go below innerGraduationRadius + 15
  const maxPossibleBaseRadius = planetOrbitOuterLimit - minRequiredSpace;
  const planetsStackBaseRadius = Math.max(
    innerGraduationRadius + 15, 
    Math.min(idealPlanetsStackBaseRadius, maxPossibleBaseRadius)
  );

  const availableOrbitSpace = planetOrbitOuterLimit - planetsStackBaseRadius;
  const planetStackStep = availableOrbitSpace > 0 ? Math.min(25, availableOrbitSpace / maxPlanetIndex) : minimumPlanetStackStep;

  if (isNaN(zodiacRotation) || isNaN(ascendantLongitude)) {
    return null;
  }

  const getAngle = React.useCallback(
    (longitude: number) => {
      const anchor = isZodiacFixed ? 0 : ascendantLongitude;
      let angle = 180 - (longitude - anchor);
      return normalizeAngle(angle);
    },
    [isZodiacFixed, ascendantLongitude],
  );

  // getNatalAngle: âncora no ASC natal para posicionamento correto no bi-wheel
  const getNatalAngle = React.useCallback(
    (longitude: number) => {
      if (!natalData) return normalizeAngle(180 - longitude);
      const anchor = isZodiacFixed ? 0 : natalData.ascendantLongitude;
      return normalizeAngle(180 - (longitude - anchor));
    },
    [natalData, isZodiacFixed],
  );

  const getPlanetRadius = (planetId: string) => {
    const targetId = allPlanetsSameOrbit ? "pluto" : planetId;
    const index = getPlanetRadialIndex(targetId);
    return planetsStackBaseRadius + index * planetStackStep;
  };

  const getTimeAngle = (h: number) => {
    // Use Sun's current position to determine time angle
    // This ensures the 24h ring is aligned with the Sun's current position
    const sunLongitude = celestialData.sunEclipticLongitude;

    if (typeof sunLongitude === "number" && currentTime) {
      const sunAngle = getAngle(sunLongitude);
      const currentDecimalHour =
        currentTime.getHours() +
        currentTime.getMinutes() / 60 +
        currentTime.getSeconds() / 3600;

      // Calculate angle difference based on time difference (15 degrees per hour)
      // Time moves clockwise (angle increases) in this coordinate system
      // If h > currentDecimalHour, angle should be greater (clockwise)
      const timeDiff = h - currentDecimalHour;
      const angleDiff = timeDiff * 15;

      return normalizeAngle(sunAngle + angleDiff);
    }

    const a6 = getAngle(ascendantLongitude); // 06:00 -> ASC (Left)
    const a12 = getAngle(midheavenLongitude); // 12:00 -> MC (Top)
    const a18 = getAngle(descendantLongitude); // 18:00 -> DSC (Right)
    const a0 = getAngle(imumCoeliLongitude); // 00:00 -> IC (Bottom)

    let startA, endA, ratio;

    if (h >= 6 && h < 12) {
      startA = a6;
      endA = a12;
      ratio = (h - 6) / 6;
    } else if (h >= 12 && h < 18) {
      startA = a12;
      endA = a18;
      ratio = (h - 12) / 6;
    } else if (h >= 18 && h < 24) {
      startA = a18;
      endA = a0;
      ratio = (h - 18) / 6;
    } else {
      // 0-6
      startA = a0;
      endA = a6;
      ratio = h / 6;
    }

    let diff = endA - startA;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    return normalizeAngle(startA + diff * ratio);
  };

  const planetPositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number; angle: number }> =
      {};
    ALL_PLANET_IDS.forEach((planetId) => {
      const key = `${planetId}EclipticLongitude` as keyof CelestialData;
      const longitude = celestialData[key] as number;
      if (longitude !== undefined) {
        const angle = getAngle(longitude);
        const r = getPlanetRadius(planetId);
        const pos = polarToCartesian(cx, cy, r, angle);
        positions[planetId] = { x: pos.x, y: pos.y, angle };
      }
    });
    return positions;
  }, [
    celestialData,
    ascendantLongitude,
    isZodiacFixed,
    getAngle,
    getPlanetRadius,
    cx,
    cy,
  ]);

  const stars = useMemo(() => {
    const generated = [];
    for (let i = 0; i < 400; i++) {
      generated.push({
        x: Math.random() * 1000,
        y: Math.random() * 1000,
        size: Math.random() * 1.5 + 0.5,
        twinkleDuration: Math.random() * 3 + 2,
        delay: Math.random() * 3,
        opacity: Math.random() * 0.6 + 0.4,
      });
    }
    return generated;
  }, []);

  // --- ATMOSPHERE & GROUND CALCULATION ---

  // The sun rises and sets based on the 24h clock times
  const sunriseAngle = getTimeAngle(sunriseHour);
  const sunsetAngle = getTimeAngle(sunsetHour);
  const mcAngle = getAngle(midheavenLongitude);

  const horizonRadius = atmosphereRadius;
  const sunrisePoint = polarToCartesian(cx, cy, horizonRadius, sunriseAngle);
  const sunsetPoint = polarToCartesian(cx, cy, horizonRadius, sunsetAngle);

  const midX = (sunrisePoint.x + sunsetPoint.x) / 2;
  const midY = (sunrisePoint.y + sunsetPoint.y) / 2;

  const icAngle = mcAngle + 180;

  const eDx = sunrisePoint.x - sunsetPoint.x;
  const eDy = sunrisePoint.y - sunsetPoint.y;
  const L = Math.sqrt(eDx * eDx + eDy * eDy) || 1;

   // Sagitta: controla a curvatura do horizonte.
  // Valores menores = horizonte mais reto (oceânico).
  // 18 é sutil e elegante; aumente para 28 se quiser mais pronunciado.
  const h = 72;

  // Raio do círculo da Terra (geometria do arco)
  const R = (L * L) / (8 * h) + h / 2;

  // Centro do círculo da Terra (direção do IC)
  const ux = Math.cos((icAngle * Math.PI) / 180);
  const uy = Math.sin((icAngle * Math.PI) / 180);
  const earthCx = midX + (R - h) * ux;
  const earthCy = midY + (R - h) * uy;

  // Ângulos dos pontos de nascer/pôr do sol
  const aSunset  = Math.atan2(sunsetPoint.y  - earthCy, sunsetPoint.x  - earthCx);
  const aSunrise = Math.atan2(sunrisePoint.y - earthCy, sunrisePoint.x - earthCx);

  const cross =
    (sunsetPoint.x - earthCx) * (sunrisePoint.y - earthCy) -
    (sunsetPoint.y - earthCy) * (sunrisePoint.x - earthCx);
  const sweepFlag = cross > 0 ? 1 : 0;

  let delta = aSunrise - aSunset;
  if (cross > 0 && delta < 0) delta += 2 * Math.PI;
  if (cross < 0 && delta > 0) delta -= 2 * Math.PI;

  // Extensão angular: cobre as margens sem exagerar na curvatura visível
  const extAngleSunset  = aSunset  - Math.sign(delta) * 1.5;
  const extAngleSunrise = aSunrise + Math.sign(delta) * 1.5;

  const farSunsetC  = { x: earthCx + R * Math.cos(extAngleSunset),  y: earthCy + R * Math.sin(extAngleSunset)  };
  const farSunriseC = { x: earthCx + R * Math.cos(extAngleSunrise), y: earthCy + R * Math.sin(extAngleSunrise) };

  // Pontos profundos para fechar o preenchimento abaixo do horizonte
  const deepP1 = polarToCartesian(cx, cy, 8000, icAngle - 60);
  const deepP2 = polarToCartesian(cx, cy, 8000, icAngle);
  const deepP3 = polarToCartesian(cx, cy, 8000, icAngle + 60);

  const earthPath = `
    M ${farSunsetC.x} ${farSunsetC.y}
    A ${R} ${R} 0 0 ${sweepFlag} ${sunsetPoint.x} ${sunsetPoint.y}
    A ${R} ${R} 0 0 ${sweepFlag} ${sunrisePoint.x} ${sunrisePoint.y}
    A ${R} ${R} 0 0 ${sweepFlag} ${farSunriseC.x} ${farSunriseC.y}
    L ${deepP3.x} ${deepP3.y}
    L ${deepP2.x} ${deepP2.y}
    L ${deepP1.x} ${deepP1.y}
    Z
  `;

  // --- Dynamic Multi-Stage Gradient Calculation ---

  // Calculate dayFactor for Full Day transition (peaks at solar noon)
  const dayDuration = sunsetHour - sunriseHour;
  const currentDayTime = sunDisplayHour - sunriseHour;
  const dayRatio = dayDuration > 0 ? currentDayTime / dayDuration : 0.5;
  const transitionBuffer = dayDuration > 0 ? 2.0 / dayDuration : 0.1;

  let dayFactor = 0;
  if (
    gradientStatus === "day" &&
    dayRatio > transitionBuffer &&
    dayRatio < 1 - transitionBuffer
  ) {
    const mid = 0.5;
    const range = 0.5 - transitionBuffer;
    const dist = Math.abs(dayRatio - mid);
    dayFactor = Math.max(0, 1 - dist / range);
    dayFactor = Math.sin((dayFactor * Math.PI) / 2);
  }

  let currentPalette = {
    sky: ATMOSPHERE_PALETTE.NIGHT.sky,
    ground: ATMOSPHERE_PALETTE.NIGHT.ground,
  };
  let textureOpacity = 0.15; // Default Night

  if (gradientStatus === "day") {
    currentPalette = interpolatePalette(
      ATMOSPHERE_PALETTE.DAY,
      ATMOSPHERE_PALETTE.FULL_DAY,
      dayFactor,
    );
    textureOpacity = 0.45 + 0.1 * dayFactor;
  } else if (gradientStatus === "night") {
    currentPalette = {
      sky: ATMOSPHERE_PALETTE.NIGHT.sky,
      ground: ATMOSPHERE_PALETTE.NIGHT.ground,
    };
    textureOpacity = 0.15;
  } else if (gradientStatus === "dawn") {
    const p = gradientProgress;
    textureOpacity = 0.15 + 0.3 * p;
    if (p < 0.5) {
      const localP = p / 0.5;
      currentPalette = interpolatePalette(
        ATMOSPHERE_PALETTE.NIGHT,
        ATMOSPHERE_PALETTE.DAWN,
        localP,
      );
    } else {
      const localP = (p - 0.5) / 0.5;
      currentPalette = interpolatePalette(
        ATMOSPHERE_PALETTE.DAWN,
        ATMOSPHERE_PALETTE.DAY,
        localP,
      );
    }
  } else if (gradientStatus === "dusk") {
    const p = gradientProgress;
    // Dusk opacity should fade out slower to keep earth visible during twilight
    textureOpacity = 0.45 - 0.3 * p;
    if (p < 0.5) {
      const localP = p / 0.5;
      currentPalette = interpolatePalette(
        ATMOSPHERE_PALETTE.DAY,
        ATMOSPHERE_PALETTE.DUSK,
        localP,
      );
    } else {
      const localP = (p - 0.5) / 0.5;
      currentPalette = interpolatePalette(
        ATMOSPHERE_PALETTE.DUSK,
        ATMOSPHERE_PALETTE.NIGHT,
        localP,
      );
    }
  }

  const groundStop0 = currentPalette.ground[0];
  const groundStop100 = currentPalette.ground[1];

  // --- Sky Gradient Colors (5 stops) ---
  const skyStop0 = currentPalette.sky[0];
  const skyStop15 = currentPalette.sky[1];
  const skyStop40 = currentPalette.sky[2];
  const skyStop75 = currentPalette.sky[3];
  const skyStop100 = currentPalette.sky[4];

  // --- Moon Glow ---
  const moonPos = planetPositions["moon"];
  const moonIllumination = 1 - Math.abs((celestialData.moonPhase - 0.5) * 2);

  // A lua só ilumina o céu e o chão se estiver ACIMA da linha do horizonte (altitude > 0)
  const isMoonAboveHorizon = (celestialData.moonAltitude ?? -1) > 0 || celestialData.isMoonVisible;

  // Positional glow (spotlight) fades smoothly based on altitude
  let moonGlowOpacity = 0;
  if (showAtmosphere && moonPos && isMoonAboveHorizon) {
    const altitude = celestialData.moonAltitude;
    moonGlowOpacity = moonIllumination * (0.4 + Math.min(0.6, altitude * 0.5));
  }

  // Ambient Earth Glow (Global illumination from moon)
  const moonAmbientOpacity =
    moonGlowOpacity > 0 && !isDayTime ? moonGlowOpacity * 0.4 : 0;

  // --- Sun Position Logic for Gradient ---
  const sunPosFallback = planetPositions["sun"] || { x: cx, y: cy };
  // Fix gradient center to Sun
  const sunCx = `${(sunPosFallback.x / 1000) * 100}%`;
  const sunCy = `${(sunPosFallback.y / 1000) * 100}%`;

  // --- ADAPTIVE COLOR LOGIC FOR ATMOSPHERE ---
  // The chronograph rings remain in dark cosmic/gold theme, while daylight is contained inside the inner orbital ring
  const isBrightSky =
    showAtmosphere &&
    (gradientStatus === "day" ||
      (gradientStatus === "dawn" && gradientProgress > 0.5) ||
      (gradientStatus === "dusk" && gradientProgress < 0.5));
  
  const starOpacity = showStars ? 1 : 0;

  // Base colors for the clock elements
  const clockStrokeColor =
    showAtmosphere
      ? (isBrightSky ? "rgba(8, 20, 50, 0.35)" : "rgba(255, 255, 255, 0.45)")
      : (theme === "light" ? "rgba(8, 20, 50, 0.3)" : "rgba(255, 255, 255, 0.25)");
  const clockFillColor = "rgba(255, 255, 255, 0.05)";
  const clockTextClass = "fill-brand-text";
  const clockStrokeClass = theme === "light" ? "stroke-black/10" : "stroke-white/20";

  // Center Void Style
  const voidFill = 'rgba(4, 6, 18, 0.82)';
  const voidOpacity = showAtmosphere ? 1 : 0.4;

// Cúmulo de pesos contínuos (Night, Twilight/Dawn/Dusk, Day) para eliminação total de saltos abruptos
const { nightW, twilightW, dayW } = useMemo(() => {
    const p = Math.max(0, Math.min(1, gradientProgress || 0));
    if (gradientStatus === 'dawn') {
        if (p <= 0.5) {
            const t = p / 0.5;
            return { nightW: 1 - t, twilightW: t, dayW: 0 };
        } else {
            const t = (p - 0.5) / 0.5;
            return { nightW: 0, twilightW: 1 - t, dayW: t };
        }
    } else if (gradientStatus === 'dusk') {
        if (p <= 0.5) {
            const t = p / 0.5;
            return { nightW: 0, twilightW: 1 - t, dayW: t };
        } else {
            const t = (p - 0.5) / 0.5;
            return { nightW: t, twilightW: 1 - t, dayW: 0 };
        }
    } else if (gradientStatus === 'day') {
        return { nightW: 0, twilightW: 0, dayW: 1 };
    } else {
        return { nightW: 1, twilightW: 0, dayW: 0 };
    }
}, [gradientStatus, gradientProgress]);

// Interpolação suave em 3 vias entre Noite, Cobre Crepuscular e Verde Grama Rico Pastel
const blendGroundColor = (cNight: number[], cTwi: number[], cDay: number[]) => {
    const r = Math.round(cNight[0] * nightW + cTwi[0] * twilightW + cDay[0] * dayW);
    const g = Math.round(cNight[1] * nightW + cTwi[1] * twilightW + cDay[1] * dayW);
    const b = Math.round(cNight[2] * nightW + cTwi[2] * twilightW + cDay[2] * dayW);
    return `rgb(${r}, ${g}, ${b})`;
};

// Ponto IC no SVG (centro geométrico do chão)
const icAngleRad = ((mcAngle + 180) * Math.PI) / 180;
const icPointX = cx + atmosphereRadius * 0.55 * Math.cos(icAngleRad);
const icPointY = cy + atmosphereRadius * 0.55 * Math.sin(icAngleRad);

// Cores do chão interpoladas sem saltos — Muted Organic Earth Green (Canva Draft Match) no Dia + Tom Cobre Crepuscular na Aurora/Ocaso
const gBase   = blendGroundColor([10, 18, 22], [65, 46, 36], [72, 108, 48]);  // topo do pasto / musgo orgânico terra (#486c30)
const gMid    = blendGroundColor([7, 12, 16],  [42, 28, 22], [48, 76, 32]);   // meio do pasto / oliva profundo (#304c20)
const gDeep   = blendGroundColor([4, 7, 10],   [22, 14, 12], [22, 38, 14]);   // sombra profunda da terra (#16260e)
const gOcean  = blendGroundColor([12, 22, 26], [54, 38, 30], [58, 92, 38]);  // relevo e umidade suave (#3a5c26)
const gLand1  = blendGroundColor([16, 28, 32], [80, 56, 42], [82, 124, 55]);  // destaque de colina amena (#527c37)
const gLand2  = blendGroundColor([12, 22, 26], [68, 48, 36], [64, 100, 42]);  // contorno de relva suavizada (#40642a)

const earthDayFactor = dayW + twilightW * 0.7;
const gRimClr = `rgba(${Math.round(40 * nightW + 180 * twilightW + 150 * dayW)},${Math.round(60 * nightW + 140 * twilightW + 195 * dayW)},${Math.round(80 * nightW + 110 * twilightW + 170 * dayW)},${(0.2 + earthDayFactor * 0.25).toFixed(2)})`;

// Cores dinâmicas perfeitamente contínuas para a aura do horizonte
const horizonArtGlowColors = useMemo(() => {
  const topR = Math.round(60 * nightW + 225 * twilightW + 140 * dayW);
  const topG = Math.round(95 * nightW + 155 * twilightW + 180 * dayW);
  const topB = Math.round(145 * nightW + 110 * twilightW + 215 * dayW);
  const topA = (0.45 * nightW + 0.65 * twilightW + 0.45 * dayW).toFixed(2);

  const midR = Math.round(45 * nightW + 200 * twilightW + 180 * dayW);
  const midG = Math.round(70 * nightW + 130 * twilightW + 205 * dayW);
  const midB = Math.round(95 * nightW + 140 * twilightW + 195 * dayW);
  const midA = (0.35 * nightW + 0.55 * twilightW + 0.55 * dayW).toFixed(2);

  const botR = Math.round(20 * nightW + 75 * twilightW + 60 * dayW);
  const botG = Math.round(32 * nightW + 70 * twilightW + 85 * dayW);
  const botB = Math.round(38 * nightW + 75 * twilightW + 72 * dayW);
  const botA = (0.25 * nightW + 0.35 * twilightW + 0.3 * dayW).toFixed(2);

  return {
    top: `rgba(${topR}, ${topG}, ${topB}, ${topA})`,
    mid: `rgba(${midR}, ${midG}, ${midB}, ${midA})`,
    bottom: `rgba(${botR}, ${botG}, ${botB}, ${botA})`,
  };
}, [nightW, twilightW, dayW]);

// Estrelas cintilantes geradas para o céu interno do cronógrafo
const innerStars = useMemo(() => {
  const stars = [];
  const R = atmosphereRadius;
  for (let i = 0; i < 130; i++) {
    const pseudoR1 = Math.abs((Math.sin(i * 12.9898 + 78.233) * 43758.5453) % 1);
    const pseudoR2 = Math.abs((Math.sin(i * 4.1412 + 13.512) * 23421.1231) % 1);

    const r = Math.sqrt(pseudoR1) * R * 0.98;
    const theta = pseudoR2 * Math.PI * 2;
    const x = cx + r * Math.cos(theta);
    const y = cy + r * Math.sin(theta);

    const starType = i % 10;
    let size = 0.8;
    let isHero = false;
    let opacity = 0.55 + (i % 5) * 0.08;

    if (starType === 0) {
      size = 2.2;
      isHero = true;
    } else if (starType < 3) {
      size = 1.3;
    } else {
      size = 0.8;
    }

    const colors = ['#ffffff', '#bae6fd', '#fef08a', '#e0e7ff', '#a5f3fc', '#fde047'];
    const color = colors[i % colors.length];

    const duration = 1.8 + (i % 7) * 0.4;
    const delay = (i % 11) * 0.3;

    stars.push({ id: i, x, y, size, opacity, isHero, color, duration, delay });
  }
  return stars;
}, [cx, cy, atmosphereRadius]);

// Pontos reutilizáveis da linha do horizonte para a path de borda
// (farSunsetC, sunsetPoint, sunrisePoint, farSunriseC já existem no escopo)
const horizonStrokePath = `
    M ${farSunsetC.x} ${farSunsetC.y}
    A ${R} ${R} 0 0 ${sweepFlag} ${sunsetPoint.x} ${sunsetPoint.y}
    A ${R} ${R} 0 0 ${sweepFlag} ${sunrisePoint.x} ${sunrisePoint.y}
    A ${R} ${R} 0 0 ${sweepFlag} ${farSunriseC.x} ${farSunriseC.y}
`;

  const realSunPos = planetPositions["sun"];

  // Sun Glow Calculation: Active during Day AND Dawn/Dusk
  let sunGlowOpacity = 0;
  let sunGlowColor = "#FFFFFF";

  if (realSunPos) {
    // sunAltitude is in radians. 0 is horizon.
    const altitude = celestialData.sunAltitude;

    // Opacity:
    // Max (0.8) when high in sky.
    // Fades out completely when sun is below -18 degrees (-0.314 radians)
    if (altitude > 0) {
      sunGlowOpacity = 0.6 + Math.min(0.2, altitude * 0.2);
    } else if (altitude > -0.314) {
      // Fading out during twilight
      sunGlowOpacity = 0.6 * (1 - Math.abs(altitude) / 0.314);
    }

    if (sunGlowOpacity > 0) {
      // Color ratio: 1 is Amber/Gold (#D97706), 0 is Soft Yellow (#FDE047)
      // At horizon (altitude <= 0), it's fully amber (ratio = 1)
      // High in sky (altitude >= 0.8 rad), it's soft yellow (ratio = 0)
      let ratio = 1 - Math.max(0, altitude / 0.8);
      ratio = Math.min(1, Math.max(0, ratio));

      // Base color for high sun
      const highSunColor = "#fff4c8"; // Cor do sol ao meio-dia
      sunGlowColor = interpolateColor(highSunColor, gradientStatus === "dawn" ? "#FF8A65" : "#FF7043", ratio); // Laranja rosado no nascer e pôr
    }
  }

  // --- SKY OPACITY & VISIBILITY ---
  // Sky is opaque during Day, Dawn, and Dusk to show colors.
  // Transparent at pure Night to show background stars.
  // --- Sky Opacity Smoothness (Using sin for fluid transition) ---
  let skyOpacity = 0;
  if (isDayTime) {
    skyOpacity = 1;
  } else if (gradientStatus === "dawn") {
    skyOpacity = Math.sin((Math.min(1, gradientProgress * 1.2) * Math.PI) / 2);
  } else if (gradientStatus === "dusk") {
    skyOpacity = Math.sin(((1 - Math.min(1, gradientProgress * 1.2)) * Math.PI) / 2);
  } else {
    skyOpacity = 0;
  }

  // Brilho noturno: reflexo azul do sol abaixo do horizonte
  // Intensidade máxima logo após o pôr do sol, zero à meia-noite
  let nightGlowOpacity = 0;
  let nightGlowColorBase = "#1a3a6e";
  let nightGlowColorMid = "#0f2248";
  let nightGlowColorFade = "#060e28";
  
  if (gradientStatus === "night" || skyOpacity < 1) {
    const altitude = celestialData.sunAltitude; // negativo quando abaixo do horizonte
    // -0.314 rad = -18° (fim do crepúsculo astronômico)
    // abaixo de -18° começa a escurecer; a -90° (meia-noite) é zero
    if (altitude < 0) {
      const maxDepth = Math.PI / 2; // 90 graus
      const depth = Math.min(Math.abs(altitude), maxDepth);
      nightGlowOpacity = Math.max(0, 1 - depth / (Math.PI / 4)) * 0.45;
      
      // Interpolate colors to pinkish/orange if close to horizon
      const twilightRatio = Math.max(0, 1 - depth / 0.314);
      if (twilightRatio > 0) {
         nightGlowColorBase = interpolateColor("#1a3a6e", gradientStatus === "dawn" ? "#FF9E5E" : "#FF7D6B", twilightRatio);
         nightGlowColorMid = interpolateColor("#0f2248", gradientStatus === "dawn" ? "#E66485" : "#C75296", twilightRatio);
         nightGlowColorFade = interpolateColor("#060e28", gradientStatus === "dawn" ? "#7A4E8A" : "#684291", twilightRatio);
         // boost opacity near horizon for better 3D glow
         nightGlowOpacity += twilightRatio * 0.3;
      }
    }
  }

  // --- Horizon Labels ---
  const sunriseLabelPos = polarToCartesian(
    cx,
    cy,
    horizonRadius - 44,
    sunriseAngle,
  );
  const sunsetLabelPos = polarToCartesian(
    cx,
    cy,
    horizonRadius - 44,
    sunsetAngle,
  );

  const sunriseAnchor = Math.cos(toRad(sunriseAngle)) < 0 ? "start" : "end";
  const sunsetAnchor = Math.cos(toRad(sunsetAngle)) < 0 ? "start" : "end";

  const labelYOffset = -12;

  const sortedPlanetIds = useMemo(() => {
    return [...ALL_PLANET_IDS].sort(
      (a, b) => getPlanetRadialIndex(a) - getPlanetRadialIndex(b),
    );
  }, []);

  const degreeLabelOffsets = useMemo(() => {
    const offsets: Record<string, { radial: number }> = {};
    if (!showDegreeLabels || degreeLabelPosition === "static") {
      return offsets;
    }

    const items = [...sortedPlanetIds]
      .filter(
        (id) =>
          visiblePlanets[id] &&
          celestialData[`${id}EclipticLongitude` as keyof CelestialData] !==
            undefined,
      )
      .map((id) => {
        const lon = celestialData[
          `${id}EclipticLongitude` as keyof CelestialData
        ] as number;
        return { id, lon };
      })
      .sort((a, b) => a.lon - b.lon);

    if (items.length === 0) return offsets;

    let cluster = [items[0]];
    const clusters: Array<typeof items> = [];
    const THRESHOLD = 6;

    for (let i = 1; i < items.length; i++) {
      const curr = items[i];
      const prev = cluster[cluster.length - 1];
      if (curr.lon - prev.lon < THRESHOLD) {
        cluster.push(curr);
      } else {
        clusters.push(cluster);
        cluster = [curr];
      }
    }

    const first = items[0];
    const last = cluster[cluster.length - 1];
    if (
      clusters.length > 0 &&
      360 - last.lon + first.lon < THRESHOLD &&
      cluster !== clusters[0]
    ) {
      clusters[0] = [...cluster, ...clusters[0]];
    } else {
      clusters.push(cluster);
    }

    clusters.forEach((cl) => {
      if (cl.length === 1) {
        offsets[cl[0].id] = { radial: 0 };
      } else if (degreeLabelPosition === "responsive") {
        cl.forEach((item, index) => {
          offsets[item.id] = { radial: index * (degreeLabelSize * 1.5) };
        });
      } else if (degreeLabelPosition === "staggered") {
        cl.forEach((item, index) => {
          let step = 0;
          if (index % 2 === 1) {
            step = Math.ceil(index / 2); // outward
          } else if (index > 0) {
            step = -Math.ceil(index / 2); // inward
          }
          offsets[item.id] = { radial: step * (degreeLabelSize * 1.5) };
        });
      }
    });

    return offsets;
  }, [
    sortedPlanetIds,
    visiblePlanets,
    celestialData,
    showDegreeLabels,
    degreeLabelPosition,
    degreeLabelSize,
  ]);

  const degreeLabelPlacements = useMemo(() => {
    const placements: Record<string, { trX: number; trY: number }> = {};
    if (!showDegreeLabels) return placements;

    const fs = degreeLabelSize;
    const isVertical = degreeLabelFormat === 'vertical';
    const iconSize = isVertical ? Math.round(fs * 1.0) : Math.round(fs * 1.05);
    const badgeW = isVertical ? Math.round(fs * 2.2) : Math.round(fs * 2.8 + iconSize + 22);
    const badgeH = isVertical ? Math.round(fs * 3.4) : Math.round(fs * 1.45);

    // List of active planets and their positions
    const activePlanets = sortedPlanetIds
      .filter((id) => visiblePlanets[id] && planetPositions[id])
      .map((id, index) => {
        const pos = planetPositions[id];
        const pRadius = Math.hypot(pos.x - cx, pos.y - cy);
        const angleRad = (pos.angle * Math.PI) / 180;
        const radCos = Math.cos(angleRad);
        const radSin = Math.sin(angleRad);
        return {
          id,
          index,
          pX: pos.x,
          pY: pos.y,
          angle: pos.angle,
          angleRad,
          radCos,
          radSin,
          pRadius,
        };
      });

    const getCandidates = (p: typeof activePlanets[0]) => {
      const radialHalfSize = Math.abs((badgeW / 2) * p.radCos) + Math.abs((badgeH / 2) * p.radSin);
      const tangentialHalfSize = Math.abs((badgeW / 2) * p.radSin) + Math.abs((badgeH / 2) * p.radCos);
      const baseDistance = (planetSize / 2) + radialHalfSize + 6;

      const preferInward = (p.pRadius - baseDistance > numbersProtectionRadius + 12);
      const primaryDr = preferInward ? -baseDistance : baseDistance;
      const secondaryDr = preferInward ? baseDistance : -baseDistance;
      
      if (degreeLabelPosition === 'static') {
        return [{ dr: primaryDr, dt: 0 }];
      }
      
      if (degreeLabelPosition === 'staggered') {
        const staggerDr = (p.index % 2 === 0) ? primaryDr : (preferInward ? -(baseDistance + badgeH + 6) : (baseDistance + badgeH + 6));
        return [
          { dr: staggerDr, dt: 0 },
          { dr: staggerDr, dt: tangentialHalfSize + 4 },
          { dr: staggerDr, dt: -(tangentialHalfSize + 4) },
        ];
      }

      // Responsive mode: prioritizes pure radial alignment (dt = 0) with center, then tiered offsets
      const stepR = badgeH + 6;
      const stepT = tangentialHalfSize + 6;

      return [
        // 1. Primary radial along line to center (preferred: dr = primaryDr, dt = 0)
        { dr: primaryDr, dt: 0 },
        // 2. Deeper radial along line to center
        { dr: preferInward ? -(baseDistance + stepR) : (baseDistance + stepR), dt: 0 },
        // 3. Opposite radial along line to center
        { dr: secondaryDr, dt: 0 },
        // 4. Even deeper radial along line to center
        { dr: preferInward ? -(baseDistance + 2 * stepR) : (baseDistance + 2 * stepR), dt: 0 },

        // 5. Small tangential shift (keeps close to ray)
        { dr: primaryDr, dt: stepT * 0.7 },
        { dr: primaryDr, dt: -stepT * 0.7 },
        { dr: preferInward ? -(baseDistance + stepR) : (baseDistance + stepR), dt: stepT * 0.7 },
        { dr: preferInward ? -(baseDistance + stepR) : (baseDistance + stepR), dt: -stepT * 0.7 },

        // 6. Full tangential shift
        { dr: primaryDr, dt: stepT },
        { dr: primaryDr, dt: -stepT },
        { dr: secondaryDr, dt: stepT },
        { dr: secondaryDr, dt: -stepT },
        
        // 7. Larger tangential shifts
        { dr: primaryDr, dt: stepT * 1.4 },
        { dr: primaryDr, dt: -stepT * 1.4 },
      ];
    };

    const placedLabels: Array<{
      id: string;
      absX: number;
      absY: number;
    }> = [];

    activePlanets.forEach((p) => {
      const candidates = getCandidates(p);
      let bestX = 0;
      let bestY = 0;
      let minScore = Infinity;
      let selectedCandidate: { absX: number; absY: number } | null = null;

      for (const cand of candidates) {
        // Calculate relative offset (trX, trY) in the planet's coordinate system
        const relX = cand.dr * p.radCos - cand.dt * p.radSin;
        const relY = cand.dr * p.radSin + cand.dt * p.radCos;

        // Absolute position of badge center on screen
        const absX = p.pX + relX;
        const absY = p.pY + relY;
        const candR = Math.hypot(absX - cx, absY - cy);

        // Boundary penalties
        let collisionScore = 0;
        if (candR < numbersProtectionRadius + badgeH / 2 + 6) {
          collisionScore += 8000;
        } else if (candR > timeRingRadius - badgeH / 2 - 6) {
          collisionScore += 8000;
        }

        // Check collision with own planet
        const distToOwn = Math.hypot(absX - p.pX, absY - p.pY);
        if (distToOwn < (planetSize / 2) + Math.min(badgeW, badgeH) / 2 + 2) {
          collisionScore += 20000;
        }

        // Check collision with other planets
        for (const other of activePlanets) {
          if (other.id === p.id) continue;
          const distToOther = Math.hypot(absX - other.pX, absY - other.pY);
          if (distToOther < (planetSize / 2) + Math.max(badgeW, badgeH) / 2 + 4) {
            collisionScore += 10000;
          }
        }

        // Check collision with already placed labels
        for (const otherLabel of placedLabels) {
          const dx = Math.abs(otherLabel.absX - absX);
          const dy = Math.abs(otherLabel.absY - absY);
          const minSafeX = badgeW + 6;
          const minSafeY = badgeH + 4;
          
          if (dx < minSafeX && dy < minSafeY) {
            collisionScore += 6000;
          }
        }

        // Penalty for deviating from center-aligned ray (dt = 0) and base radial offset
        const alignmentPenalty = Math.abs(cand.dt) * 4 + Math.abs(cand.dr) * 0.8;
        const totalScore = collisionScore + alignmentPenalty;

        if (totalScore < minScore) {
          minScore = totalScore;
          bestX = relX;
          bestY = relY;
          selectedCandidate = { absX, absY };
        }

        if (collisionScore === 0 && cand.dt === 0) {
          bestX = relX;
          bestY = relY;
          selectedCandidate = { absX, absY };
          break;
        }
      }

      placements[p.id] = { trX: bestX, trY: bestY };
      if (selectedCandidate) {
        placedLabels.push({
          id: p.id,
          absX: selectedCandidate.absX,
          absY: selectedCandidate.absY,
        });
      }
    });

    return placements;
  }, [
    showDegreeLabels,
    degreeLabelSize,
    degreeLabelPosition,
    degreeLabelFormat,
    visiblePlanets,
    planetPositions,
    sortedPlanetIds,
    planetSize,
    numbersProtectionRadius,
    timeRingRadius,
    cx,
    cy,
  ]);

  const natalPlanetPositions = useMemo(() => {
    if (!natalData) return {};
    const positions: Record<string, { x: number; y: number; angle: number }> =
      {};

    ALL_PLANET_IDS.forEach((planetId) => {
      const key = `${planetId}EclipticLongitude` as keyof CelestialData;
      const longitude = natalData[key] as number;
      if (longitude !== undefined) {
        // Usar getNatalAngle — âncora no ASC natal para posicionamento correto
        const angle = getNatalAngle(longitude);
        const r = getPlanetRadius(planetId);
        const pos = polarToCartesian(cx, cy, r, angle);
        positions[planetId] = { x: pos.x, y: pos.y, angle };
      }
    });
    return positions;
  }, [natalData, getNatalAngle]);

  const anyPlanetSelected = selectedPlanets.length > 0;
  const anyAspectSelected = selectedAspects.length > 0;
  const isAnyAspectHovered = hoveredAspect !== null;

  const handleMouseEnter = (
    e: React.MouseEvent,
    type: TooltipData["type"],
    id: string | number,
  ) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    mousePos.current = { x: e.clientX, y: e.clientY };
    if (type === "house") {
      setHoveredHouse(id as number);
    }

    // Small delay for tooltips
    hoverTimeout.current = window.setTimeout(() => {
      let title = "";
      let description: React.ReactNode = "";

      if (type === "planet") {
        const data = PLANET_DESCRIPTIONS[id as string];
        if (data) {
          title = data.title;
          const lonKey = `${id}EclipticLongitude` as keyof CelestialData;
          const longitude = celestialData[lonKey] as number;
          const decanRulerId = longitude !== undefined ? getDecanRuler(longitude) : null;
          const decanRulerTitle = decanRulerId ? PLANET_DESCRIPTIONS[decanRulerId]?.title : "";
          const decanRulerGlyph = decanRulerId ? CELESTIAL_GLYPHS[decanRulerId] : "";

          if (id === "moon") {
            const phaseInfo = getMoonPhaseInfo(celestialData.moonPhase);
            const illum = Math.round(celestialData.moonIllumination * 100);
            const cycle = getCelticMoonCycle(celestialData.currentTime);

            description = (
              <div className="flex flex-col gap-3 min-w-[200px] text-brand-text w-[240px]">
                {/* Cabeçalho */}
                <div className="flex justify-between items-baseline border-b border-brand-border/10 pb-2">
                  <span className="font-bold text-sm tracking-wide">
                    {cycle ? `${cycle.emoji ? cycle.emoji + ' ' : ''}${cycle.name}` : "Ciclo Lunar"}
                  </span>
                  {cycle && (
                    <span className="text-[10px] text-brand-text-muted uppercase tracking-wider">
                      {cycle.index}º Ciclo do ano
                    </span>
                  )}
                </div>

                {/* Fase e Visibilidade + Horarios */}
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="text-[14px] leading-none">
                        {phaseInfo.icon}
                      </span>
                      <span>{phaseInfo.name}</span>
                    </div>
                    <span className="text-brand-text-muted font-medium">
                      {illum}%
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-medium text-brand-text-muted pt-1">
                    <div className="flex items-center gap-1">
                      <span className="text-brand-text">↑</span>
                      <span>{celestialData.moonriseTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-brand-text">↓</span>
                      <span>{celestialData.moonsetTime}</span>
                    </div>
                  </div>
                </div>

                {/* Decanato */}
                {decanRulerId && (
                  <div className="pt-2 border-t border-brand-border/10">
                    <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-brand-text-muted">
                      <span>Face (Decanato)</span>
                      <div className="flex items-center gap-1 text-brand-text font-bold">
                        <span className="font-astro text-base leading-none">{decanRulerGlyph}</span>
                        <span>{decanRulerTitle}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Explicacao */}
                <div className="pt-2 border-t border-brand-border/10">
                  <p className="text-xs leading-relaxed text-brand-text/80">
                    {data.description}
                  </p>
                </div>
              </div>
            );
          } else {
            // Generic planet tooltip with decan info
            description = (
              <div className="flex flex-col gap-3 min-w-[200px] text-brand-text w-[240px]">
                <div className="flex justify-between items-center border-b border-brand-border/10 pb-2">
                  <span className="font-bold text-sm tracking-wide uppercase">
                    Posição Sideral
                  </span>
                  <span className="text-xs font-mono text-brand-text-muted">
                    {formatPlanetDegree(longitude).deg} {formatPlanetDegree(longitude).min}
                  </span>
                </div>

                {decanRulerId && (
                  <div className="pt-1">
                    <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-brand-text-muted">
                      <span>Face (Decanato)</span>
                      <div className="flex items-center gap-1 text-brand-text font-bold">
                        <span className="font-astro text-base leading-none">{decanRulerGlyph}</span>
                        <span>{decanRulerTitle}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-brand-border/10">
                  <p className="text-xs leading-relaxed text-brand-text/80 line-clamp-4">
                    {data.description}
                  </p>
                </div>
              </div>
            );
          }
        }
      } else if (type === "sign") {
        const signId = id as string;
        const signData = ZODIAC_DATA.find((s) => s.id === signId);
        const descData = SIGN_DESCRIPTIONS[signId];

        if (signData && descData) {
          title = descData.title;

          // Find planets in this sign
          const planetsInSign = Object.entries(celestialData)
            .filter(
              ([key, val]) =>
                key.endsWith("EclipticLongitude") && typeof val === "number",
            )
            .map(([key, val]) => {
              const planetId = key.replace("EclipticLongitude", "");
              if (!visiblePlanets[planetId]) return null;
              const signIndex = Math.floor((val as number) / 30);
              return signIndex === ZODIAC_DATA.findIndex((s) => s.id === signId)
                ? planetId
                : null;
            })
            .filter(Boolean) as string[];

          const rulerId = (signData as any).ruler;
          const rulerName = PLANET_DESCRIPTIONS[rulerId]?.title || rulerId;

          description = (
            <div className="flex flex-col gap-2">
              <p>{descData.description}</p>

              {/* Ruler Info */}
              {rulerId && (
                <div className="flex items-center gap-2 mt-1 bg-brand-surface-highlight/20 p-1.5 rounded-md border border-brand-border/10">
                  <span className="text-[10px] uppercase tracking-wider opacity-70">
                    Regente:
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="font-astro text-sm">
                      {CELESTIAL_GLYPHS[rulerId]}
                    </span>
                    <span className="font-bold text-xs">{rulerName}</span>
                  </div>
                </div>
              )}

              {/* Planets in Sign */}
              {planetsInSign.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {planetsInSign.map((pid) => (
                    <div
                      key={pid}
                      className="flex items-center gap-1 bg-brand-surface-highlight/30 px-1.5 py-0.5 rounded text-xs border border-brand-border/10"
                    >
                      <span className="font-astro">
                        {CELESTIAL_GLYPHS[pid]}
                      </span>
                      <span>{PLANET_DESCRIPTIONS[pid]?.title || pid}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }
      } else if (type === "house") {
        const houseNum = id as number;
        const data = HOUSE_DESCRIPTIONS[houseNum];
        if (data) {
          title = data.title;

          // Get the natural ruler of the house
          const rulerId = HOUSE_RULERS[houseNum];
          const rulerName = PLANET_DESCRIPTIONS[rulerId]?.title || rulerId;

          description = (
            <div className="flex flex-col gap-2">
              <p>{data.description}</p>

              {/* Ruler Info */}
              {rulerId && (
                <div className="flex items-center gap-2 mt-1 bg-brand-surface-highlight/20 p-1.5 rounded-md border border-brand-border/10">
                  <span className="text-[10px] uppercase tracking-wider opacity-70">
                    Regente:
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="font-astro text-sm">
                      {CELESTIAL_GLYPHS[rulerId]}
                    </span>
                    <span className="font-bold text-xs">{rulerName}</span>
                  </div>
                </div>
              )}
            </div>
          );
        }
      }

      if (title) {
        setTooltip({
          type,
          title,
          description,
          x: mousePos.current.x,
          y: mousePos.current.y,
        });
      }
    }, 300);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    mousePos.current = { x: e.clientX, y: e.clientY };
    if (tooltip && !tooltipRafRef.current) {
      tooltipRafRef.current = requestAnimationFrame(() => {
        setTooltip((prev) =>
          prev
            ? { ...prev, x: mousePos.current.x, y: mousePos.current.y }
            : null,
        );
        tooltipRafRef.current = null;
      });
    }
  };

  const handleMouseLeave = (
    e: React.MouseEvent,
    type?: TooltipData["type"],
  ) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setTooltip(null);
    if (type === "house") {
      setHoveredHouse(null);
    }
  };

  // Outer sub-track: Termos (adjacent to Zodiac / Seasons ring)
  const termTrackOuter = graduationRingRadius;
  const termTrackInner = showTermsRing ? termTrackOuter - termTrackHeight : termTrackOuter;
  const termTrackCenter = (termTrackOuter + termTrackInner) / 2;

  // Middle sub-track: Decanatos (between Termos and Graduação)
  const decanTrackOuter = termTrackInner;
  const decanTrackInner = showDecanRing ? decanTrackOuter - decanTrackHeight : decanTrackOuter;
  const decanTrackCenter = (decanTrackOuter + decanTrackInner) / 2;

  // Inner sub-track: Graduação
  const gradTrackOuter = decanTrackInner;
  const gradTrackInner = graduationRingInner;

  const defaultRingLineColor = theme === "light" ? "#4b5563" : "rgba(156, 163, 175, 0.95)";
  const finalRingLineColor = ringLineColor || defaultRingLineColor;
  const ringGlyphColor = theme === "light" ? "#231714" : "rgba(255, 255, 255, 0.95)";

  const getDegreeElementColor = useCallback((degree: number, currentTheme: "light" | "dark") => {
    const signIndex = Math.floor((((degree % 360) + 360) % 360) / 30);
    const elements = ["fire", "earth", "air", "water"];
    const el = elements[signIndex % 4];
    if (currentTheme === "light") {
      switch (el) {
        case "fire": return "#dc2626";  // Red
        case "earth": return "#059669"; // Emerald Green
        case "air": return "#0284c7";   // Sky Blue
        case "water": return "#2563eb"; // Sapphire Blue
        default: return "#374151";
      }
    } else {
      switch (el) {
        case "fire": return "#ef4444";  // Red
        case "earth": return "#10b981"; // Emerald
        case "air": return "#38bdf8";   // Sky Blue
        case "water": return "#60a5fa"; // Blue
        default: return "#9ca3af";
      }
    }
  }, []);

  const concentricRings = useMemo(() => {
    const circles = [graduationRingRadius];
    if (showTermsRing) {
      circles.push(termTrackInner);
    }
    if (showDecanRing) {
      circles.push(decanTrackInner);
    }
    circles.push(graduationRingInner);
    return circles;
  }, [
    graduationRingRadius,
    graduationRingInner,
    showTermsRing,
    showDecanRing,
    termTrackInner,
    decanTrackInner,
  ]);

  const signBoundaryLines = useMemo(() => {
    const lines = [];
    const bottomRadius = graduationRingInner;
    for (let i = 0; i < 360; i += 30) {
      const angle = 180 - i;
      const p1 = polarToCartesian(cx, cy, zodiacRingOuter, angle);
      const p2 = polarToCartesian(cx, cy, bottomRadius, angle);
      const color = getDegreeElementColor(i, theme);
      lines.push(
        <line
          key={`sign-boundary-${i}`}
          x1={p1.x}
          y1={p1.y}
          x2={p2.x}
          y2={p2.y}
          stroke={color}
          strokeWidth="1.2"
          strokeOpacity="0.95"
          strokeLinecap="round"
          shapeRendering="geometricPrecision"
        />
      );
    }
    return lines;
  }, [
    cx,
    cy,
    zodiacRingOuter,
    graduationRingInner,
    theme,
    getDegreeElementColor,
  ]);

  const graduationTicks = useMemo(() => {
    const ticks = [];
    const activeGradTrackHeight = gradTrackOuter - gradTrackInner;

    for (let i = 0; i < 360; i++) {
      if (i % 30 === 0) continue;

      const angle = 180 - i;
      let tickLength: number, strokeOp: number, strokeW: string;

      if (i % 10 === 0) {
        tickLength = activeGradTrackHeight * 0.85;
        strokeOp = 1.0;
        strokeW = "1.25";
      } else if (i % 5 === 0) {
        tickLength = activeGradTrackHeight * 0.55;
        strokeOp = 0.85;
        strokeW = "1.0";
      } else {
        tickLength = activeGradTrackHeight * 0.35;
        strokeOp = 0.65;
        strokeW = "0.75";
      }

      // Flush against gradTrackOuter (outer boundary), projecting inwards
      const p1 = polarToCartesian(cx, cy, gradTrackOuter, angle);
      const p2 = polarToCartesian(cx, cy, gradTrackOuter - tickLength, angle);

      ticks.push(
        <line
          key={`grad-tick-${i}`}
          x1={p1.x}
          y1={p1.y}
          x2={p2.x}
          y2={p2.y}
          stroke={ringLineColor}
          strokeWidth={strokeW}
          strokeOpacity={strokeOp}
          strokeLinecap="round"
          shapeRendering="geometricPrecision"
        />
      );
    }
    return ticks;
  }, [cx, cy, gradTrackInner, gradTrackOuter, ringLineColor]);

  const egyptianTermsLayer = useMemo(() => {
    if (!showTermsRing) return null;

    const terms = [
      { body: "jupiter", start: 0, end: 6 },
      { body: "venus", start: 6, end: 12 },
      { body: "mercury", start: 12, end: 20 },
      { body: "mars", start: 20, end: 25 },
      { body: "saturn", start: 25, end: 30 },

      { body: "venus", start: 30, end: 38 },
      { body: "mercury", start: 38, end: 44 },
      { body: "jupiter", start: 44, end: 52 },
      { body: "saturn", start: 52, end: 57 },
      { body: "mars", start: 57, end: 60 },

      { body: "mercury", start: 60, end: 66 },
      { body: "jupiter", start: 66, end: 72 },
      { body: "venus", start: 72, end: 77 },
      { body: "mars", start: 77, end: 84 },
      { body: "saturn", start: 84, end: 90 },

      { body: "mars", start: 90, end: 96 },
      { body: "venus", start: 96, end: 103 },
      { body: "mercury", start: 103, end: 109 },
      { body: "jupiter", start: 109, end: 116 },
      { body: "saturn", start: 116, end: 120 },

      { body: "jupiter", start: 120, end: 126 },
      { body: "venus", start: 126, end: 131 },
      { body: "saturn", start: 131, end: 138 },
      { body: "mercury", start: 138, end: 144 },
      { body: "mars", start: 144, end: 150 },

      { body: "mercury", start: 150, end: 157 },
      { body: "venus", start: 157, end: 167 },
      { body: "jupiter", start: 167, end: 171 },
      { body: "mars", start: 171, end: 178 },
      { body: "saturn", start: 178, end: 180 },

      { body: "saturn", start: 180, end: 186 },
      { body: "venus", start: 186, end: 194 },
      { body: "jupiter", start: 194, end: 201 },
      { body: "mercury", start: 201, end: 208 },
      { body: "mars", start: 208, end: 210 },

      { body: "mars", start: 210, end: 217 },
      { body: "venus", start: 217, end: 221 },
      { body: "mercury", start: 221, end: 229 },
      { body: "jupiter", start: 229, end: 234 },
      { body: "saturn", start: 234, end: 240 },

      { body: "jupiter", start: 240, end: 252 },
      { body: "venus", start: 252, end: 257 },
      { body: "mercury", start: 257, end: 261 },
      { body: "saturn", start: 261, end: 266 },
      { body: "mars", start: 266, end: 270 },

      { body: "mercury", start: 270, end: 277 },
      { body: "venus", start: 277, end: 284 },
      { body: "jupiter", start: 284, end: 292 },
      { body: "saturn", start: 292, end: 296 },
      { body: "mars", start: 296, end: 300 },

      { body: "mercury", start: 300, end: 307 },
      { body: "venus", start: 307, end: 313 },
      { body: "jupiter", start: 313, end: 320 },
      { body: "mars", start: 320, end: 325 },
      { body: "saturn", start: 325, end: 330 },

      { body: "venus", start: 330, end: 342 },
      { body: "jupiter", start: 342, end: 346 },
      { body: "mercury", start: 346, end: 349 },
      { body: "mars", start: 349, end: 358 },
      { body: "saturn", start: 358, end: 360 },
    ];

    const currentRotation = isZodiacFixed ? 0 : zodiacRotation;
    const termHeight = termTrackOuter - termTrackInner;
    const baseGlyphSize = termsGlyphSize ?? 22;
    const svgSize = Math.max(9, Math.min(baseGlyphSize, Math.round(termHeight * 0.92)));
    const elements: React.ReactNode[] = [];

    // 1. Division lines strictly inside Terms track
    terms.forEach((term, idx) => {
      const boundary = term.start;
      if (boundary % 30 !== 0) {
        const angle = 180 - boundary;
        const p1 = polarToCartesian(cx, cy, termTrackInner, angle);
        const p2 = polarToCartesian(cx, cy, termTrackOuter, angle);
        elements.push(
          <line
            key={`term-div-${boundary}-${idx}`}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={ringLineColor}
            strokeWidth="1.1"
            strokeOpacity="0.95"
            strokeLinecap="round"
            shapeRendering="geometricPrecision"
          />
        );
      }
    });

    // 2. Term ruler glyphs
    terms.forEach((term, i) => {
      const midDegree = (term.start + term.end) / 2;
      const angle = 180 - midDegree;
      const pos = polarToCartesian(cx, cy, termTrackCenter, angle);

      elements.push(
        <g
          key={`term-glyph-${i}`}
          transform={`translate(${pos.x}, ${pos.y}) rotate(${-currentRotation})`}
          className="pointer-events-none select-none"
          shapeRendering="geometricPrecision"
        >
          <g transform={`translate(${-svgSize / 2}, ${-svgSize / 2})`}>
            <CelestialGlyphSvg
              bodyId={term.body}
              size={svgSize}
              color={ringGlyphColor}
            />
          </g>
        </g>
      );
    });

    return elements;
  }, [
    showTermsRing,
    termTrackInner,
    termTrackOuter,
    termTrackCenter,
    ringLineColor,
    ringGlyphColor,
    isZodiacFixed,
    zodiacRotation,
    cx,
    cy,
    termsGlyphSize,
  ]);

  const decanatosLayer = useMemo(() => {
    if (!showDecanRing) return null;

    const currentRotation = isZodiacFixed ? 0 : zodiacRotation;
    const decanHeight = decanTrackOuter - decanTrackInner;
    const baseGlyphSize = decanGlyphSize ?? 22;
    const svgSize = Math.max(9, Math.min(baseGlyphSize, Math.round(decanHeight * 0.92)));
    const elements: React.ReactNode[] = [];

    // 1. Division lines strictly inside Decan track
    for (let i = 0; i < 360; i += 10) {
      if (i % 30 === 0) continue;
      const angle = 180 - i;
      const p1 = polarToCartesian(cx, cy, decanTrackInner, angle);
      const p2 = polarToCartesian(cx, cy, decanTrackOuter, angle);
      elements.push(
        <line
          key={`decan-div-${i}`}
          x1={p1.x}
          y1={p1.y}
          x2={p2.x}
          y2={p2.y}
          stroke={ringLineColor}
          strokeWidth="1.1"
          strokeOpacity="0.95"
          strokeLinecap="round"
          shapeRendering="geometricPrecision"
        />
      );
    }

    // 2. Decan ruler glyphs
    for (let i = 0; i < 36; i++) {
      const ruler = getDecanRuler(i * 10);
      const midDegree = i * 10 + 5;
      const angle = 180 - midDegree;
      const pos = polarToCartesian(cx, cy, decanTrackCenter, angle);

      elements.push(
        <g
          key={`decan-glyph-${i}`}
          transform={`translate(${pos.x}, ${pos.y}) rotate(${-currentRotation})`}
          className="pointer-events-none select-none"
          shapeRendering="geometricPrecision"
        >
          <g transform={`translate(${-svgSize / 2}, ${-svgSize / 2})`}>
            <CelestialGlyphSvg
              bodyId={ruler}
              size={svgSize}
              color={ringGlyphColor}
            />
          </g>
        </g>
      );
    }

    return elements;
  }, [
    showDecanRing,
    decanTrackInner,
    decanTrackOuter,
    decanTrackCenter,
    ringLineColor,
    ringGlyphColor,
    isZodiacFixed,
    zodiacRotation,
    cx,
    cy,
    decanGlyphSize,
  ]);

  const isLightBackground = isBrightSky;
  // Texto principal: azul-petróleo escuro no dia, quase-branco na noite
  const dynamicContrastFill = isLightBackground ? "#1a2e44" : "#e2e8f0";

  const getSignElementColor = (signId: string): string => {
    const SIGN_ELEMENTS: Record<string, string> = {
      aries: "#FB923C",
      leo: "#FB923C",
      sagittarius: "#FB923C", // fogo
      taurus: "#34D399",
      virgo: "#34D399",
      capricorn: "#34D399", // terra
      gemini: "#FEF3C7",
      libra: "#FEF3C7",
      aquarius: "#FEF3C7", // ar
      cancer: "#60A5FA",
      scorpio: "#60A5FA",
      pisces: "#60A5FA", // água
    };
    return SIGN_ELEMENTS[signId] || "#F5F2EB";
  };

  // Texto secundário: azul médio no dia, cinza-ardósia na noite
  const formatPlanetDegree = (
    longitude: number,
  ): { deg: string; signId: string; min: string } => {
    const signIndex = Math.floor(longitude / 30);
    const deg = Math.floor(longitude % 30);
    const min = Math.floor((longitude % 1) * 60);
    const SIGN_IDS = [
      "aries",
      "taurus",
      "gemini",
      "cancer",
      "leo",
      "virgo",
      "libra",
      "scorpio",
      "sagittarius",
      "capricorn",
      "aquarius",
      "pisces",
    ];
    return {
      deg: String(deg).padStart(2, "0") + "°",
      signId: SIGN_IDS[signIndex] || "aries",
      min: String(min).padStart(2, "0") + "'",
    };
  };

  const getCenterTextColor = (type: "main" | "date" | "muted" | "detail") => {
    if (showAtmosphere) {
      if (type === "main") return "#FFFFFF";
      if (type === "date") return "rgba(255, 255, 255, 0.98)";
      if (type === "muted") return "rgba(255, 255, 255, 0.85)";
      return "rgba(255, 255, 255, 0.75)";
    }
    if (theme === "light") {
      if (type === "main") return "#1C1917";
      if (type === "date") return "#292524";
      if (type === "muted") return "#57534E";
      return "#78716C";
    }
    if (type === "main") return "#FAF8F5";
    if (type === "date") return "#E5E7EB";
    if (type === "muted") return "#9CA3AF";
    return "#6B7280";
  };

  const dynamicContrastSubFill = isLightBackground ? "#2d4a6a" : "#94a3b8";
  // Sombra de texto: inversa para garantir separação em qualquer fundo
  const dynamicTextShadow = isLightBackground
    ? "drop-shadow(0 1px 2px rgba(255,255,255,0.4))"
    : "drop-shadow(0 2px 4px rgba(0,0,0,0.6))";

  // Retorna se um ângulo SVG está na metade "céu" ou "terra" do mapa
  // O horizonte é a linha ASC-DSC (ângulo 180° no SVG = esquerda = ASC)
  // Ângulos 0°-180° = metade superior = céu diurno
  // Ângulos 180°-360° = metade inferior = terra
  const getElementColor = (angleDeg: number): string => {
    const norm = ((angleDeg % 360) + 360) % 360;
    const isSkyHalf = norm > 180 && norm < 360;
    if (showAtmosphere && isLightBackground) {
      return isSkyHalf ? "#1a2e44" : "#e2e8f0";
    } else if (theme === "light") {
      return "#2d4a6a";
    } else {
      return "#e2e8f0";
    }
  };

  const ASPECT_LINE_COLORS: Record<string, string> = theme === "light" ? {
    trine: "#16a34a",       // Emerald Green
    sextile: "#2563eb",     // Sapphire Blue
    conjunction: "#4f46e5", // Indigo Conjunction Blue
    square: "#ea580c",      // Rust Orange
    opposition: "#dc2626",  // Crimson Red
  } : {
    trine: "#4ade80",
    sextile: "#60a5fa",
    conjunction: "#4870FF",
    square: "#FB923C",
    opposition: "#f87171",
  };

  const timeRingElements = useMemo(() => {
    if (!showTimeRing || isNatalMode) return [];
    const elements = [];

    // 0. Inner boundary (Outer boundary is shared with graduation ring)
    elements.push(
      <circle
        key="time-ring-inner"
        cx={cx}
        cy={cy}
        r={timeRingInner}
        fill="none"
        stroke={ringLineColor}
        strokeWidth="1"
      />
    );

    // Hourly cell division lines inside the 24h track have been removed per request

    // 2. 24h Numbers centered at timeRingCenter
    for (let h = 0; h < 24; h++) {
      const angle = getTimeAngle(h);
      const pos = polarToCartesian(cx, cy, timeRingCenter, angle);
      const colorAngle = h === 6 || h === 18 ? angle + 2 : angle;
      const elementColor = getElementColor(colorAngle);
      const isCardinal = h === 0 || h === 6 || h === 12 || h === 18;
      const fontSize = isCardinal
        ? `${13.5 * timeRingScale}px`
        : `${11 * timeRingScale}px`;

      elements.push(
        <g key={`time-${h}`}>
          <text
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="central"
            className="font-display select-none pointer-events-none"
            style={{
              transformBox: "fill-box",
              transformOrigin: "center",
              fontFamily: "'PT Serif', Georgia, serif",
              fontStyle: "italic",
              fontWeight: 700,
              fontSize: fontSize,
              fill: elementColor,
            }}
          >
            {String(h).padStart(2, "0")}
          </text>
        </g>,
      );
    }
    return elements;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    showTimeRing,
    isNatalMode,
    cx,
    cy,
    timeRingInner,
    timeRingOuter,
    timeRingCenter,
    timeRingScale,
    ringLineColor,
    getTimeAngle,
    getElementColor,
    Math.floor((currentTime?.getTime() ?? 0) / 60000),
    timeRingScale,
    theme,
  ]);

  // Rotação do anel natal: diferença entre ASC natal e ASC trânsito
  // Isso faz o anel natal girar para mostrar o zodíaco do ponto de vista natal
  const natalZodiacRotation = useMemo(() => {
    if (!natalData || !isNatalMode) return 0;
    return normalizeAngle(natalData.ascendantLongitude - ascendantLongitude);
  }, [
    natalData,
    isNatalMode,
    natalData?.ascendantLongitude,
    ascendantLongitude,
  ]);

  // Ângulos das cúspides de casas natais para o overlay
  const natalHouseCuspAngles = useMemo(() => {
    if (!natalData || !isNatalMode) return [];
    return natalData.houseCusps.map((cusp: number) => getNatalAngle(cusp));
  }, [natalData, isNatalMode, ascendantLongitude, isZodiacFixed]);

  const innerHouseGraduationTicks = useMemo(() => {
    const ticks = [];
    for (let i = 0; i < 12; i++) {
      const startCusp = houseCusps[i];
      const endCusp = houseCusps[(i + 1) % 12];
      let diff = endCusp - startCusp;
      if (diff < 0) diff += 360;
      const majorAngle = getAngle(startCusp);
      const majorP1 = polarToCartesian(
        cx,
        cy,
        innerGraduationRadius - 5,
        majorAngle,
      );
      const majorP2 = polarToCartesian(
        cx,
        cy,
        innerGraduationRadius + 5,
        majorAngle,
      );

      ticks.push(
        <line
          key={`house-tick-major-${i}`}
          x1={majorP1.x}
          y1={majorP1.y}
          x2={majorP2.x}
          y2={majorP2.y}
          stroke="currentColor"
          strokeWidth={1.5}
          strokeOpacity={0.9}
          strokeLinecap="round"
        />,
      );

      const decanStep = diff / 3;
      for (let j = 1; j < 3; j++) {
        const decanLon = normalizeAngle(startCusp + decanStep * j);
        const decanAngle = getAngle(decanLon);
        const minorP1 = polarToCartesian(
          cx,
          cy,
          innerGraduationRadius - 2.5,
          decanAngle,
        );
        const minorP2 = polarToCartesian(
          cx,
          cy,
          innerGraduationRadius + 2.5,
          decanAngle,
        );

        ticks.push(
          <line
            key={`house-tick-minor-${i}-${j}`}
            x1={minorP1.x}
            y1={minorP1.y}
            x2={minorP2.x}
            y2={minorP2.y}
            stroke="currentColor"
            strokeWidth={1}
            strokeOpacity={0.7}
            strokeLinecap="round"
          />,
        );
      }
    }
    return ticks;
  }, [houseCusps, getAngle, innerGraduationRadius, cx, cy]);

  const hours = String(currentTime.getHours()).padStart(2, "0");
  const minutes = String(currentTime.getMinutes()).padStart(2, "0");
  const seconds = String(currentTime.getSeconds()).padStart(2, "0");
  const dayVal = currentTime.getDate();
  const monthVal = currentTime
    .toLocaleDateString("pt-BR", { month: "short" })
    .toUpperCase()
    .replace(".", "");
  const yearVal = currentTime.getFullYear();
  const weekdayVal =
    currentTime
      .toLocaleDateString("pt-BR", { weekday: "long" })
      .charAt(0)
      .toUpperCase() +
    currentTime.toLocaleDateString("pt-BR", { weekday: "long" }).slice(1);
  const dateString = `${String(dayVal).padStart(2, "0")} ${monthVal} ${yearVal}`;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center overflow-visible touch-none select-none"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={resetZoom}
      onClickCapture={(e) => {
        if (hasMovedRef.current) {
          e.stopPropagation();
          e.preventDefault();
        }
      }}
      style={{
        cursor: isDragging ? "grabbing" : Math.abs(zoomScale - 1.0) > 0.01 ? "grab" : "default",
      }}
    >
      <style>
        {`
          @keyframes twinkle {
              0%, 100% { opacity: var(--star-op, 0.6); }
              50%       { opacity: calc(var(--star-op, 0.6) * 0.3); }
          }
          .star-twinkle {
              animation-name: twinkle;
              animation-timing-function: ease-in-out;
              animation-iteration-count: infinite;
              transform-box: fill-box;
              transform-origin: center;
          }
        `}
      </style>



      {/* Inner Transform Container */}
      <div
        className="w-full h-full flex items-center justify-center overflow-visible"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomScale})`,
          transformOrigin: "center center",
          transition: isWheelZooming || isDragging ? "none" : "transform 150ms cubic-bezier(0.1, 0.9, 0.2, 1)",
          willChange: isWheelZooming || isDragging ? "transform" : "auto",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="-50 -50 1100 1100"
          className="w-full h-full font-sans select-none overflow-visible"
          shapeRendering="geometricPrecision"
          textRendering="geometricPrecision"
          style={{
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            shapeRendering: 'geometricPrecision',
            textRendering: 'geometricPrecision',
            imageRendering: 'optimizeQuality',
          }}
        >
        <defs>
          <clipPath id="clock-face-clip">
            <circle cx="500" cy="500" r="550" />
          </clipPath>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="fire-ring-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" result="blur1" />
            <feGaussianBlur stdDeviation="2.5" result="blur2" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="fire-ring-glow-intense" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="1.5" result="blur1" />
            <feGaussianBlur stdDeviation="4" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="moon-glow" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="10" in="SourceGraphic" />
          </filter>
          <filter
            id="glyph-shadow"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feDropShadow
              dx="0"
              dy="1"
              stdDeviation="1"
              floodColor="black"
              floodOpacity="0.8"
            />
          </filter>

          {/* TERRAIN TEXTURE - Updated procedural noise with strict masking */}
          <filter
            id="grass-texture"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015 0.18"
              numOctaves="3"
              stitchTiles="stitch"
              result="noise"
            />
            <feSpecularLighting
              in="noise"
              surfaceScale="2"
              specularConstant="0.8"
              specularExponent="15"
              lightingColor="#b0e090"
              result="specLight"
            >
              <feDistantLight azimuth="235" elevation="70" />
            </feSpecularLighting>
            <feComposite
              in="specLight"
              in2="noise"
              operator="in"
              result="specularTexture"
            />
            {/* Clip texture to source shape */}
            <feComposite
              in="specularTexture"
              in2="SourceGraphic"
              operator="in"
              result="finalTexture"
            />
          </filter>

          <mask id="center-mask">
            <rect x="-100%" y="-100%" width="300%" height="300%" fill="white" />
            <circle cx={cx} cy={cy} r={innerVoidRadius} fill="#000000" />
          </mask>

          <clipPath id="inner-ring-mask">
            <circle cx={cx} cy={cy} r={atmosphereRadius} />
          </clipPath>

          {/* GRADIENTE RADIAL 3D DO CÉU NOTURNO: Centro azul estelar profundo → Bordas pretas para tridimensionalidade */}
          <radialGradient
            id="night-sky-radial-gradient"
            cx={cx}
            cy={cy}
            r={atmosphereRadius}
            fx={cx}
            fy={cy}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#1e326e" />   {/* Azul estelar vibrante no centro/zênite */}
            <stop offset="35%" stopColor="#101c48" />  {/* Azul noturno marinho */}
            <stop offset="70%" stopColor="#060b24" />  {/* Azul espacial profundo */}
            <stop offset="100%" stopColor="#010206" /> {/* Preto cósmico total nas bordas para tridimensionalidade 3D */}
          </radialGradient>

          {/* DYNAMIC RADIAL SUN GRADIENT FOR DAY SKY (5 STOPS) */}
          <radialGradient
            id="sky-gradient"
            cx={sunCx}
            cy={sunCy}
            r="130%"
            fx={sunCx}
            fy={sunCy}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={skyStop0} />
            <stop offset="20%" stopColor={skyStop15} />
            <stop offset="45%" stopColor={skyStop40} />
            <stop offset="75%" stopColor={skyStop75} />
            <stop offset="100%" stopColor={skyStop100} />
          </radialGradient>

          {/* NIGHT GLOW — brilho azul do sol abaixo do horizonte */}
          <radialGradient
            id="night-glow-gradient"
            cx={sunCx}
            cy={sunCy}
            r="140%"
            fx={sunCx}
            fy={sunCy}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={nightGlowColorBase} stopOpacity="1" />
            <stop offset="30%" stopColor={nightGlowColorMid} stopOpacity="0.6" />
            <stop offset="70%" stopColor={nightGlowColorFade} stopOpacity="0.2" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          {/* DYNAMIC GROUND GRADIENT */}
         
{/* Gradiente Radial 3D para Curvatura e Efeito Volumétrico Esférico do Terreno */}
<radialGradient
    id="earth-3d-sphere-curvature"
    cx={cx} cy={cy + atmosphereRadius * 0.45} r={atmosphereRadius * 1.35}
    gradientUnits="userSpaceOnUse"
>
    <stop offset="0%"   stopColor="#ffffff" stopOpacity={earthDayFactor * 0.14} />
    <stop offset="35%"  stopColor="#ffffff" stopOpacity="0" />
    <stop offset="75%"  stopColor="#040b03" stopOpacity={0.35 * (1 - nightW * 0.2)} />
    <stop offset="100%" stopColor="#010301" stopOpacity="0.75" />
</radialGradient>

{/* Padrão de Micro-textura de Solo e Relva para Realismo Tátil */}
<pattern id="earth-micro-grain" width="6" height="6" patternUnits="userSpaceOnUse">
    <rect width="6" height="6" fill="transparent" />
    <circle cx="1.5" cy="1.5" r="0.9" fill="#ffffff" opacity="0.05" />
    <circle cx="4.5" cy="4.5" r="0.75" fill="#000000" opacity="0.08" />
</pattern>

{/* CHÃO — gradientes dinâmicos dia/noite */}
<radialGradient
    id="earth-base"
    cx={icPointX} cy={icPointY} r={atmosphereRadius * 1.5}
    gradientUnits="userSpaceOnUse"
>
    <stop offset="0%"   stopColor={gBase}  />
    <stop offset="40%"  stopColor={gMid}   />
    <stop offset="100%" stopColor={gDeep}  />
</radialGradient>

{/* Oceano — radial do IC, só visível de dia */}
<radialGradient
    id="earth-ocean"
    cx={icPointX} cy={icPointY} r={atmosphereRadius * 1.1}
    gradientUnits="userSpaceOnUse"
>
    <stop offset="0%"   stopColor={gOcean} stopOpacity={earthDayFactor * 0.8} />
    <stop offset="60%"  stopColor={gOcean} stopOpacity={earthDayFactor * 0.3} />
    <stop offset="100%" stopColor={gOcean} stopOpacity="0" />
</radialGradient>

{/* Continente 1 — posição fixa no espaço userSpaceOnUse */}
<radialGradient
    id="earth-land1"
    cx={icPointX - atmosphereRadius * 0.35}
    cy={icPointY - atmosphereRadius * 0.12}
    r={atmosphereRadius * 0.42}
    gradientUnits="userSpaceOnUse"
>
    <stop offset="0%"   stopColor={gLand1} stopOpacity={earthDayFactor * 0.65} />
    <stop offset="100%" stopColor={gLand1} stopOpacity="0" />
</radialGradient>

{/* Continente 2 — lado direito */}
<radialGradient
    id="earth-land2"
    cx={icPointX + atmosphereRadius * 0.28}
    cy={icPointY - atmosphereRadius * 0.18}
    r={atmosphereRadius * 0.38}
    gradientUnits="userSpaceOnUse"
>
    <stop offset="0%"   stopColor={gLand2} stopOpacity={earthDayFactor * 0.5} />
    <stop offset="100%" stopColor={gLand2} stopOpacity="0" />
</radialGradient>

{/* Rim atmosférico — glow acima do horizonte */}
<radialGradient
    id="earth-rim"
    cx={cx} cy={cy} r={atmosphereRadius * 1.05}
    gradientUnits="userSpaceOnUse"
>
    <stop offset="88%"  stopColor={gRimClr} stopOpacity="0" />
    <stop offset="100%" stopColor={gRimClr} stopOpacity="1" />
</radialGradient>

{/* Vinheta central — legibilidade do relógio no dia */}
<radialGradient id="clock-vignette" cx="50%" cy="50%" r="50%">
    <stop offset="0%"   stopColor="#010208" stopOpacity="0" />
    <stop offset="55%"  stopColor="#010208" stopOpacity="0" />
    <stop offset="100%" stopColor="#010208" stopOpacity="0" />
</radialGradient>


          {/* SIGN LINES GRADIENTS */}
          {Object.entries(ELEMENT_HEX_COLORS).map(([element, color]) => (
            <radialGradient
              key={`sign-grad-${element}`}
              id={`sign-grad-${element}`}
              cx={cx}
              cy={cy}
              r={zodiacRingInner}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="35%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor={color} stopOpacity="0.15" />
            </radialGradient>
          ))}

          {/* MOON LIGHT SPOTLIGHT */}
          {moonPos && (
            <radialGradient
              id="moon-light"
              cx={moonPos.x}
              cy={moonPos.y}
              r={atmosphereRadius * 2}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="white" stopOpacity="0.6" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          )}

          {/* LUXURY ZODIAC GRADIENTS - Space Luxury Edition */}
          <linearGradient id="zodiac-fire" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-zodiac-fire-1)" />
            <stop offset="40%" stopColor="var(--color-zodiac-fire-2)" />
            <stop offset="100%" stopColor="var(--color-zodiac-fire-3)" />
          </linearGradient>
          <linearGradient id="zodiac-earth" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-zodiac-earth-1)" />
            <stop offset="50%" stopColor="var(--color-zodiac-earth-2)" />
            <stop offset="100%" stopColor="var(--color-zodiac-earth-3)" />
          </linearGradient>
          <linearGradient id="zodiac-air" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-zodiac-air-1)" />
            <stop offset="60%" stopColor="var(--color-zodiac-air-2)" />
            <stop offset="100%" stopColor="var(--color-zodiac-air-3)" />
          </linearGradient>
          <linearGradient id="zodiac-water" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-zodiac-water-1)" />
            <stop offset="50%" stopColor="var(--color-zodiac-water-2)" />
            <stop offset="100%" stopColor="var(--color-zodiac-water-3)" />
          </linearGradient>

          {/* ICON ZODIAC GRADIENTS - Lighter for contrast */}
          <linearGradient
            id="zodiac-icon-fire"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="var(--color-zodiac-icon-fire-1)" />
            <stop offset="40%" stopColor="var(--color-zodiac-icon-fire-2)" />
            <stop offset="100%" stopColor="var(--color-zodiac-icon-fire-3)" />
          </linearGradient>
          <linearGradient
            id="zodiac-icon-earth"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="var(--color-zodiac-icon-earth-1)" />
            <stop offset="50%" stopColor="var(--color-zodiac-icon-earth-2)" />
            <stop offset="100%" stopColor="var(--color-zodiac-icon-earth-3)" />
          </linearGradient>
          <linearGradient
            id="zodiac-icon-air"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="var(--color-zodiac-icon-air-1)" />
            <stop offset="60%" stopColor="var(--color-zodiac-icon-air-2)" />
            <stop offset="100%" stopColor="var(--color-zodiac-icon-air-3)" />
          </linearGradient>
          <linearGradient
            id="zodiac-icon-water"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="var(--color-zodiac-icon-water-1)" />
            <stop offset="50%" stopColor="var(--color-zodiac-icon-water-2)" />
            <stop offset="100%" stopColor="var(--color-zodiac-icon-water-3)" />
          </linearGradient>

          {/* SUN & MOON LIGHT SPOTLIGHTS FOR GROUND GLOW */}
          {realSunPos && (
            <>
              <radialGradient
                id="sun-ground-glow"
                cx={realSunPos.x}
                cy={realSunPos.y}
                r={atmosphereRadius * 1.6}
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor={sunGlowColor} stopOpacity="0.85" />
                <stop offset="35%" stopColor={sunGlowColor} stopOpacity="0.45" />
                <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.15" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>
              <radialGradient
                id="sun-sky-glow"
                cx={realSunPos.x}
                cy={realSunPos.y}
                r={atmosphereRadius * 1.8}
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor={sunGlowColor} stopOpacity="0.8" />
                <stop offset="40%" stopColor={sunGlowColor} stopOpacity="0.3" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>
            </>
          )}

          {moonPos && (
            <radialGradient
              id="moon-ground-glow"
              cx={moonPos.x}
              cy={moonPos.y}
              r={atmosphereRadius * 1.5}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#e2e8f0" stopOpacity={0.75 * moonIllumination} />
              <stop offset="35%" stopColor="#93c5fd" stopOpacity={0.45 * moonIllumination} />
              <stop offset="70%" stopColor="#3b82f6" stopOpacity={0.18 * moonIllumination} />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          )}

          {/* Planet Gradients */}
          <radialGradient id="grad-sun" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="25%" stopColor="#FFFACD" />
            <stop offset="70%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FF8C00" />
          </radialGradient>

          {/* Contrast Filters for Atmosphere Mode */}
          <filter id="clock-drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.0" />
            <feOffset dx="0" dy="0.6" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.16" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glyph-lift" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0.8" stdDeviation="0.8" floodColor="#000000" floodOpacity="0.25" />
          </filter>
          <radialGradient id="grad-moon" cx="35%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="40%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#94A3B8" />
          </radialGradient>
          <radialGradient id="grad-mercury" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#E0E0E0" />
            <stop offset="60%" stopColor="#A9A9A9" />
            <stop offset="100%" stopColor="#757575" />
          </radialGradient>
          <radialGradient id="grad-venus" cx="35%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#E9D5FF" />
            <stop offset="50%" stopColor="#C084FC" />
            <stop offset="100%" stopColor="#9333EA" />
          </radialGradient>
          <radialGradient id="grad-mars" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FF7F50" />
            <stop offset="60%" stopColor="#CD5C5C" />
            <stop offset="100%" stopColor="#8B0000" />
          </radialGradient>
          <radialGradient id="grad-jupiter" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFF8DC" />
            <stop offset="35%" stopColor="#E6C280" />
            <stop offset="70%" stopColor="#C68B59" />
            <stop offset="100%" stopColor="#7C3F1D" />
          </radialGradient>
          <linearGradient
            id="grad-jupiter-stripes"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#FFF8DC" />
            <stop offset="20%" stopColor="#CD853F" />
            <stop offset="40%" stopColor="#FFF8DC" />
            <stop offset="60%" stopColor="#D2691E" />
            <stop offset="80%" stopColor="#FFF8DC" />
            <stop offset="100%" stopColor="#CD853F" />
          </linearGradient>
          <radialGradient id="grad-jupiter-overlay" cx="35%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
          </radialGradient>
          <radialGradient id="grad-saturn" cx="40%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#F0E68C" />
            <stop offset="100%" stopColor="#DAA520" />
          </radialGradient>
          <radialGradient id="grad-uranus" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#AFEEEE" />
            <stop offset="100%" stopColor="#00CED1" />
          </radialGradient>
          <radialGradient id="grad-neptune" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#4169E1" />
            <stop offset="100%" stopColor="#00008B" />
          </radialGradient>
          <radialGradient id="grad-pluto" cx="35%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#8B0000" />
            <stop offset="50%" stopColor="#708090" />
            <stop offset="100%" stopColor="#2F4F4F" />
          </radialGradient>

          <radialGradient id="grad-northNode" cx="35%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#E0FFFF" />
            <stop offset="100%" stopColor="#00CED1" />
          </radialGradient>
          <radialGradient id="grad-southNode" cx="35%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#D2691E" />
            <stop offset="100%" stopColor="#8B4513" />
          </radialGradient>
          <radialGradient id="grad-lilith" cx="35%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#4B0082" />
            <stop offset="60%" stopColor="#000000" />
            <stop offset="100%" stopColor="#2e022e" />
          </radialGradient>
          <radialGradient id="grad-chiron" cx="35%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#90EE90" />
            <stop offset="100%" stopColor="#2E8B57" />
          </radialGradient>
          <radialGradient id="grad-ceres" cx="35%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#556B2F" />
          </radialGradient>
          <radialGradient id="grad-pallas" cx="35%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#F0F8FF" />
            <stop offset="100%" stopColor="#4682B4" />
          </radialGradient>
          <radialGradient id="grad-juno" cx="35%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#FFB6C1" />
            <stop offset="100%" stopColor="#C71585" />
          </radialGradient>
          <radialGradient id="grad-vesta" cx="35%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#FFA500" />
            <stop offset="100%" stopColor="#FF4500" />
          </radialGradient>
          
          {/* Luxuoso Gradiente de Horizonte entre Céu e Pasto */}
<linearGradient id="horizon-artistic-glow" x1="0%" y1="0%" x2="100%" y2="0%">
  <stop offset="0%" stopColor={horizonArtGlowColors.top} />
  <stop offset="50%" stopColor={horizonArtGlowColors.mid} />
  <stop offset="100%" stopColor={horizonArtGlowColors.top} />
</linearGradient>

<radialGradient id="earth-artistic-blend" cx={cx} cy={cy} r={atmosphereRadius} gradientUnits="userSpaceOnUse">
  <stop offset="70%" stopColor={horizonArtGlowColors.top} stopOpacity="0.35" />
  <stop offset="85%" stopColor={horizonArtGlowColors.mid} stopOpacity="0.25" />
  <stop offset="100%" stopColor={gBase} stopOpacity="0" />
</radialGradient>

<style>{`
  @keyframes innerStarTwinkle {
    0%, 100% { opacity: 0.2; }
    50% { opacity: 0.95; }
  }
  .inner-twinkle-star {
    animation: innerStarTwinkle ease-in-out infinite;
  }
`}</style>

{/* Vinheta central — legibilidade do relógio no dia */}
<radialGradient id="clock-center-vignette" cx="50%" cy="50%" r="50%">
    <stop offset="0%"   stopColor="#000814" stopOpacity={0.15} />
    <stop offset="55%"  stopColor="#000814" stopOpacity={0.05} />
    <stop offset="100%" stopColor="#000814" stopOpacity="0" />
</radialGradient>

{/* ClipPath para restringir a atmosfera e horizonte ao anel orbital interno do cronógrafo */}
<clipPath id="atmosphere-inner-clip">
    <circle cx={cx} cy={cy} r={atmosphereRadius} />
</clipPath>
        </defs>

        {/* --- LAYER 0: BACKGROUNDS --- */}
        <g mask="url(#center-mask)">
          {/* Custom Background Image */}
          {customBackgroundImage && (
            <image
              href={customBackgroundImage}
              x={cx - 500}
              y={cy - 500}
              width="1000"
              height="1000"
              preserveAspectRatio="xMidYMid slice"
              opacity="0.6"
            />
          )}

          {/* Constellations Background */}
          {showConstellations && (
            <g
              className="pointer-events-none"
              transform={`rotate(${isZodiacFixed ? 0 : zodiacRotation}, ${cx}, ${cy})`}
            >
              <image
                href="/Contellation.svg"
                x={cx - 937.5}
                y={cy - 937.5}
                width="1875"
                height="1875"
                opacity={theme === "light" ? 0.18 : 0.4}
                style={{
                  mixBlendMode: theme === "light" ? "multiply" : "screen",
                  filter:
                    theme === "light"
                      ? "sepia(1) saturate(0.3) hue-rotate(190deg) brightness(0.4)"
                      : "invert(1) brightness(1.5) contrast(1.2)",
                }}
              />
            </g>
          )}
        </g>

        {/* --- LAYER 1: ATMOSPHERE & EARTH (Inside Clock Orbital Ring) --- */}
        <g>
          {/* Base Background when atmosphere is disabled */}
          {!showAtmosphere && (
            <circle
              cx={cx}
              cy={cy}
              r={atmosphereRadius}
              fill="currentColor"
              fillOpacity="0.4"
              className="transition-colors duration-500 text-brand-surface-highlight"
            />
          )}

          {/* Atmosphere & Earth view constrained to the inner orbital circle */}
          {showAtmosphere && (
            <g clipPath="url(#atmosphere-inner-clip)">
              {/* SKY LAYER 0: BASE NIGHT SKY inside inner circle (3D Radial Gradient) */}
              <circle
                cx={cx}
                cy={cy}
                r={atmosphereRadius}
                fill="url(#night-sky-radial-gradient)"
                stroke="none"
                fillOpacity={1}
              />

              {/* TWINKLING STARS IN THE NIGHT SKY */}
              <g 
                className="twinkling-stars-inner pointer-events-none"
                style={{ opacity: Math.max(0.08, 1 - skyOpacity * 0.9) }}
              >
                {innerStars.map((star) => (
                  <g key={`inner-star-${star.id}`}>
                    {star.isHero && (
                      <circle
                        cx={star.x}
                        cy={star.y}
                        r={star.size * 2.5}
                        fill={star.color}
                        opacity={0.35}
                        className="inner-twinkle-star"
                        style={{
                          animationDuration: `${star.duration * 1.3}s`,
                          animationDelay: `${star.delay}s`,
                          filter: "blur(1px)",
                        }}
                      />
                    )}
                    <circle
                      cx={star.x}
                      cy={star.y}
                      r={star.size}
                      fill={star.color}
                      opacity={star.opacity}
                      className="inner-twinkle-star"
                      style={{
                        animationDuration: `${star.duration}s`,
                        animationDelay: `${star.delay}s`,
                      }}
                    />
                  </g>
                ))}
              </g>

              {/* Brilho noturno azul seguindo o sol */}
              {nightGlowOpacity > 0 && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={atmosphereRadius}
                  fill="url(#night-glow-gradient)"
                  fillOpacity={nightGlowOpacity}
                  style={{ pointerEvents: "none" }}
                />
              )}

              {/* SKY LAYER 1: GRADIENT (Day/Dusk) overlays on top */}
              <circle
                cx={cx}
                cy={cy}
                r={atmosphereRadius}
                fill="url(#sky-gradient)"
                fillOpacity={skyOpacity}
                stroke="none"
              />

              {/* SKY LAYER 2: SUN GLOW */}
              {realSunPos && sunGlowOpacity > 0 && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={atmosphereRadius}
                  fill="url(#sun-sky-glow)"
                  fillOpacity={sunGlowOpacity * 0.8}
                  stroke="none"
                  style={{ mixBlendMode: "screen" }}
                />
              )}

              {/* EARTH LAYER GROUP — Terreno/Pasto Verde Orgânico (Match Canva) com Curvatura e Textura 3D */}
              <g>
                {/* 1. Base do chão (Musgo Terra Orgânico / Terra Cobre Crepuscular / Slate Noturno) */}
                <path d={earthPath} fill="url(#earth-base)" />

                {/* 2. Camada de umidade/relevo suave */}
                {(dayW > 0.02 || twilightW > 0.02) && (
                  <path d={earthPath} fill="url(#earth-ocean)" style={{ mixBlendMode: 'screen' }} />
                )}

                {/* 3. Relevo e colinas com tons ameno de musgo */}
                {(dayW > 0.02 || twilightW > 0.02) && (
                  <>
                    <path d={earthPath} fill="url(#earth-land1)" />
                    <path d={earthPath} fill="url(#earth-land2)" />
                  </>
                )}

                {/* 4. Curvatura e Efeito Volumétrico Esférico 3D (Planetário/Horizonte Curvo) */}
                <path d={earthPath} fill="url(#earth-3d-sphere-curvature)" />

                {/* 5. Micro-Textura Tátil de Relva e Solo */}
                <path d={earthPath} fill="url(#earth-micro-grain)" style={{ mixBlendMode: 'overlay' }} opacity="0.65" />

                {/* 6. Iluminação Direcional 3D do Sol no Solo */}
                {realSunPos && (dayW > 0.01 || twilightW > 0.01) && (
                  <path
                    d={earthPath}
                    fill="url(#sun-ground-glow)"
                    style={{ mixBlendMode: 'screen' }}
                    opacity={Math.min(0.9, (dayW + twilightW * 0.7) * 0.85)}
                  />
                )}

                {/* 7. Iluminação Direcional da Lua no Solo (Noturno/Crepúsculo - Somente se a Lua estiver ACIMA do Horizonte) */}
                {moonPos && isMoonAboveHorizon && moonGlowOpacity > 0 && (nightW > 0.02 || twilightW > 0.02) && (
                  <path
                    d={earthPath}
                    fill="url(#moon-ground-glow)"
                    style={{ mixBlendMode: 'screen' }}
                    opacity={Math.min(0.85, (nightW + twilightW * 0.5) * moonGlowOpacity * 0.85)}
                  />
                )}

                {/* 8. Rim atmosférico na borda do horizonte */}
                <path d={earthPath} fill="url(#earth-rim)" />

                {/* 5. Luxuoso gradiente de luz e sombra entre céu e pasto */}
                <path
                  d={earthPath}
                  fill="url(#earth-artistic-blend)"
                  style={{ mixBlendMode: 'screen' }}
                />

                {/* 6. Linha do horizonte com aura artística elegante */}
                <path
                  d={horizonStrokePath}
                  fill="none"
                  stroke="url(#horizon-artistic-glow)"
                  strokeWidth="5"
                  opacity="0.85"
                  style={{ mixBlendMode: 'screen', filter: 'blur(3px)' }}
                />
                <path
                  d={horizonStrokePath}
                  fill="none"
                  stroke="url(#horizon-artistic-glow)"
                  strokeWidth="1.8"
                  opacity="0.95"
                />
              </g>

              {/* Horizon Labels - Nascer e Pôr com Identidade Visual Aprimorada */}
              <g className="pointer-events-none select-none">
                {/* Sunrise Widget */}
                <g transform={`translate(${sunriseLabelPos.x}, ${sunriseLabelPos.y})`}>
                  {/* Card Background Glass Pill */}
                  <rect
                    x="-57"
                    y="-16"
                    width="114"
                    height="32"
                    rx="16"
                    fill="rgba(8, 12, 26, 0.88)"
                    stroke="rgba(245, 158, 11, 0.55)"
                    strokeWidth="1"
                    style={{
                      backdropFilter: "blur(6px)",
                      filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.55))",
                    }}
                  />
                  {/* Glowing Solar Indicator Icon on Left */}
                  <circle
                    cx="-38"
                    cy="0"
                    r="8.5"
                    fill="#F59E0B"
                    fillOpacity="0.2"
                  />
                  <circle
                    cx="-38"
                    cy="0"
                    r="4.5"
                    fill="#FBBF24"
                  />
                  <circle
                    cx="-38"
                    cy="0"
                    r="2"
                    fill="#FFFBEB"
                  />
                  {/* Label Title */}
                  <text
                    x="-24"
                    y="-4"
                    textAnchor="start"
                    dominantBaseline="middle"
                    style={{
                      fill: "#FDE68A",
                      fontSize: "7.5px",
                      fontWeight: 800,
                      letterSpacing: "0.18em",
                      fontFamily: "'Manrope', system-ui, sans-serif",
                    }}
                  >
                    NASCER DO SOL
                  </text>
                  {/* Time Value */}
                  <text
                    x="-24"
                    y="7.5"
                    textAnchor="start"
                    dominantBaseline="middle"
                    style={{
                      fill: "#FFFFFF",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: "0.06em",
                      textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                    }}
                  >
                    {celestialData.sunriseTime}
                  </text>
                </g>

                {/* Sunset Widget */}
                <g transform={`translate(${sunsetLabelPos.x}, ${sunsetLabelPos.y})`}>
                  {/* Card Background Glass Pill */}
                  <rect
                    x="-57"
                    y="-16"
                    width="114"
                    height="32"
                    rx="16"
                    fill="rgba(8, 12, 26, 0.88)"
                    stroke="rgba(249, 115, 22, 0.55)"
                    strokeWidth="1"
                    style={{
                      backdropFilter: "blur(6px)",
                      filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.55))",
                    }}
                  />
                  {/* Glowing Solar Indicator Icon on Left */}
                  <circle
                    cx="-38"
                    cy="0"
                    r="8.5"
                    fill="#F97316"
                    fillOpacity="0.2"
                  />
                  <circle
                    cx="-38"
                    cy="0"
                    r="4.5"
                    fill="#FB923C"
                  />
                  <circle
                    cx="-38"
                    cy="0"
                    r="2"
                    fill="#FFF7ED"
                  />
                  {/* Label Title */}
                  <text
                    x="-24"
                    y="-4"
                    textAnchor="start"
                    dominantBaseline="middle"
                    style={{
                      fill: "#FED7AA",
                      fontSize: "7.5px",
                      fontWeight: 800,
                      letterSpacing: "0.18em",
                      fontFamily: "'Manrope', system-ui, sans-serif",
                    }}
                  >
                    PÔR DO SOL
                  </text>
                  {/* Time Value */}
                  <text
                    x="-24"
                    y="7.5"
                    textAnchor="start"
                    dominantBaseline="middle"
                    style={{
                      fill: "#FFFFFF",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: "0.06em",
                      textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                    }}
                  >
                    {celestialData.sunsetTime}
                  </text>
                </g>
              </g>
            </g>
          )}
        </g>

        {/* --- LAYER 2: RINGS & GRADUATIONS --- */}
        <g
          className="pointer-events-none transition-colors duration-500"
          transform={`rotate(${isZodiacFixed ? 0 : zodiacRotation}, ${cx}, ${cy})`}
        >
          {/* Background track for high contrast */}
          <circle
            cx={cx}
            cy={cy}
            r={(graduationRingInner + graduationRingRadius) / 2}
            fill="none"
            stroke={theme === "light" ? "#f4f1ea" : "rgba(8, 6, 18, 0.45)"}
            strokeWidth={graduationRingRadius - graduationRingInner}
          />
          {/* Concentric solid boundary circles */}
          {concentricRings.map((r, idx) => (
            <circle
              key={`concentric-ring-${idx}`}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={ringLineColor}
              strokeWidth="1.1"
              strokeOpacity="0.95"
              shapeRendering="geometricPrecision"
            />
          ))}
          {/* 30° Sign sector boundary lines */}
          {signBoundaryLines}
          {/* Graduation Ticks (strictly in Graduation track at inner limit) */}
          {graduationTicks}
          {/* Egyptian Terms Layer */}
          {egyptianTermsLayer}
          {/* Decanatos Layer */}
          {decanatosLayer}
        </g>

        <g style={{ filter: showAtmosphere ? "url(#clock-drop-shadow)" : "none" }}>
          <ZodiacRing
            cx={cx}
            cy={cy}
            innerRadius={zodiacRingInner}
            outerRadius={zodiacRingOuter}
            rotation={isZodiacFixed ? 0 : zodiacRotation}
            onHover={(id) =>
              handleMouseEnter(
                {
                  clientX: mousePos.current.x,
                  clientY: mousePos.current.y,
                } as any,
                "sign",
                id,
              )
            }
            onLeave={() => handleMouseLeave({} as any, "sign")}
            iconSize={zodiacSignSize}
            colorMode={zodiacColorMode}
            highlightFilter={highlightFilter}
            isBrightSky={isBrightSky}
          />
        </g>
        {/* ── ANEL ZODIACAL NATAL (bi-wheel) ── */}
        {isNatalMode && natalData && (
          <g className="pointer-events-none">
            {/* Anel zodiacal natal — SVGs dourados, raio ajustado */}
            <g
              style={{
                filter: isBrightSky ? "none" : "sepia(1) saturate(3) hue-rotate(5deg) brightness(1.1)",
              }}
            >
              <ZodiacRing
                cx={cx}
                cy={cy}
                innerRadius={437}
                outerRadius={462}
                rotation={
                  isZodiacFixed ? 0 : zodiacRotation + natalZodiacRotation
                }
                onHover={() => {}}
                onLeave={() => {}}
                iconSize={Math.round(zodiacSignSize * 0.45)}
                colorMode={zodiacColorMode}
                highlightFilter={undefined}
                isBrightSky={isBrightSky}
              />
            </g>

            {/* Overlay dourado sobre o anel natal */}
            <g
              transform={`rotate(${isZodiacFixed ? 0 : zodiacRotation + natalZodiacRotation}, ${cx}, ${cy})`}
            >
              {/* Faixas alternadas — tint dourado suave sobre os setores */}
              {ZODIAC_DATA.map((sign, i) => {
                const startAngle = normalizeAngle(180 - i * 30);
                const endAngle = normalizeAngle(180 - (i + 1) * 30);
                const wedge = describeAnnularSector(
                  cx,
                  cy,
                  437,
                  462,
                  endAngle,
                  startAngle,
                );
                return (
                  <path
                    key={`natal-ring-tint-${i}`}
                    d={wedge}
                    fill={(isBrightSky || theme === "light") ? "#1e293b" : "#FFE566"}
                    fillOpacity={i % 2 === 0 ? 0.06 : 0.02}
                    stroke={(isBrightSky || theme === "light") ? "#1e293b" : "#FFE566"}
                    strokeOpacity={0.18}
                    strokeWidth={0.4}
                  />
                );
              })}

              {/* Traços divisores dos 12 signos */}
              {Array.from({ length: 12 }, (_, i) => {
                const angle = 180 - i * 30;
                const p1 = polarToCartesian(cx, cy, 437, angle);
                const p2 = polarToCartesian(cx, cy, 462, angle);
                return (
                  <line
                    key={`natal-sign-tick-${i}`}
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={(isBrightSky || theme === "light") ? "#1e293b" : "#FFE566"}
                    strokeWidth={0.8}
                    strokeOpacity={0.45}
                  />
                );
              })}

              {/* Bordas do anel */}
              <circle
                cx={cx}
                cy={cy}
                r={462}
                fill="none"
                stroke={(isBrightSky || theme === "light") ? "#1e293b" : "#FFE566"}
                strokeWidth={0.8}
                strokeOpacity={0.35}
              />
              <circle
                cx={cx}
                cy={cy}
                r={437}
                fill="none"
                stroke={(isBrightSky || theme === "light") ? "#1e293b" : "#FFE566"}
                strokeWidth={0.5}
                strokeOpacity={0.2}
                strokeDasharray="2 3"
              />
            </g>

            {/* Label "NATAL" fora da rotação */}
            <text
              x={cx}
              y={cy - 468}
              textAnchor="middle"
              dominantBaseline="central"
              style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: "8px",
                fontWeight: 700,
                fill: theme === "light" ? "#78350f" : "#FFE566",
                fillOpacity: 0.6,
                letterSpacing: "0.08em",
              }}
            >
              NATAL
            </text>
          </g>
        )}
        {/* ── FIM ANEL ZODIACAL NATAL ── */}

        {showSeasonsRing &&
          !isNatalMode &&
          seasonIngresses &&
          seasonIngresses.length === 4 && (
            <g
              className="pointer-events-none select-none"
              transform={`rotate(${isZodiacFixed ? 0 : zodiacRotation}, ${cx}, ${cy})`}
            >
              {seasonIngresses.map((season, i) => {
                const nextSeason = seasonIngresses[(i + 1) % 4];

                // start e end são longitudes eclípticas (0-360)
                const startLon = season.longitude;
                const endLon = nextSeason.longitude;

                // Converter longitude eclíptica para ângulo SVG
                // No SVG: angle = 180 - longitude (zodíaco começa à esquerda)
                const startAngle = 180 - startLon;
                const endAngle = endLon === 0 ? 180 - 360 : 180 - endLon;

                const midLon =
                  startLon +
                  (endLon > startLon
                    ? (endLon - startLon) / 2
                    : (360 - startLon + endLon) / 2);
                const midAngle = normalizeAngle(180 - midLon);

                const isLight = theme === "light";
                const lightColors = isLight
                  ? SEASON_COLORS_LIGHT[
                      season.name as keyof typeof SEASON_COLORS_LIGHT
                    ]
                  : null;

                const fillColor = lightColors ? lightColors.bg : season.color;
                const strokeColor = lightColors
                  ? lightColors.border
                  : season.color;
                const textColor = lightColors ? lightColors.text : season.color;

                const fillOpacity = isLight ? "0.4" : "0.05";
                const strokeOpacity = isLight ? "0.6" : "0.2";

                const wedgePath = describeAnnularSector(
                  cx,
                  cy,
                  graduationRingRadius,
                  zodiacRingInner,
                  normalizeAngle(endAngle),
                  normalizeAngle(startAngle),
                );

                const textRadius = (graduationRingRadius + zodiacRingInner) / 2;
                const textPathId = `season-path-${i}`;
                const textPathD = describeTextArc(
                  cx,
                  cy,
                  textRadius,
                  normalizeAngle(startAngle),
                  normalizeAngle(endAngle),
                );

                return (
                  <g key={`season-${i}`}>
                    <path
                      d={wedgePath}
                      fill={fillColor}
                      fillOpacity={fillOpacity}
                      stroke={strokeColor}
                      strokeOpacity={strokeOpacity}
                      strokeWidth="1"
                    />
                    <path
                      id={textPathId}
                      d={textPathD}
                      fill="none"
                      stroke="none"
                    />
                    <text
                      fill={textColor}
                      fontSize={`${10.5 * seasonsRingScale}px`}
                      fontFamily="sans-serif"
                      fontWeight="600"
                      letterSpacing="2"
                      className="opacity-80"
                    >
                      <textPath
                        href={`#${textPathId}`}
                        startOffset="50%"
                        textAnchor="middle"
                        alignmentBaseline="middle"
                      >
                        {season.name}
                      </textPath>
                    </text>
                  </g>
                );
              })}
            </g>
          )}

        {(showSignLines || showSignColors) && (
          <g
            className="pointer-events-none"
            transform={`rotate(${isZodiacFixed ? 0 : zodiacRotation}, ${cx}, ${cy})`}
          >
            {ZODIAC_DATA.map((sign, i) => {
              const startLon = i * 30;
              const endLon = (i + 1) * 30;
              // Base angles (rotation = 0)
              const startAngle = 180 - startLon;
              const endAngle = 180 - endLon;

              const p1 = polarToCartesian(cx, cy, innerVoidRadius, startAngle);
              const p2 = polarToCartesian(cx, cy, zodiacRingInner, startAngle);

              const color =
                ELEMENT_HEX_COLORS[
                  sign.element as keyof typeof ELEMENT_HEX_COLORS
                ] || "#888888";
              const wedgePath = describeAnnularSector(
                cx,
                cy,
                innerVoidRadius,
                zodiacRingInner,
                endAngle,
                startAngle,
              );

              return (
                <g key={`sign-segment-${sign.id}`}>
                  {showSignColors && (
                    <path
                      d={wedgePath}
                      fill={`url(#sign-grad-${sign.element})`}
                    />
                  )}
                  {showSignLines && (
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke={clockStrokeColor}
                      strokeOpacity={isBrightSky ? 0.3 : signLineOpacity}
                      strokeWidth={signLineThickness}
                    />
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* ── OVERLAY CASAS NATAIS ── */}
        {isNatalMode && natalData && natalHouseCuspAngles.length === 12 && (
          <g className="pointer-events-none">
            {natalHouseCuspAngles.map((angle, i) => {
              const houseNumber = i + 1;
              const isMainAngle = i === 0 || i === 3 || i === 6 || i === 9;

              const posInner = polarToCartesian(cx, cy, innerVoidRadius, angle);
              const posOuter = polarToCartesian(cx, cy, atmosphereRadius, angle);

              // Midpoint: interpola do ângulo atual até o próximo na direção correta
              const nextAngle = natalHouseCuspAngles[(i + 1) % 12];
              let diff = nextAngle - angle;
              // Garante direção horária (positiva no SVG)
              if (diff > 0) diff -= 360;
              const midAngleDeg = normalizeAngle(angle + diff / 2);
              const natalLabelRadius = innerVoidRadius + 22;
              const labelPos = polarToCartesian(
                cx,
                cy,
                natalLabelRadius,
                midAngleDeg,
              );

              return (
                <g key={`natal-house-${i}`}>
                  {/* Linha da cúspide natal */}
                  <line
                    x1={posInner.x}
                    y1={posInner.y}
                    x2={posOuter.x}
                    y2={posOuter.y}
                    stroke={isBrightSky ? "#1e293b" : "#FFE566"}
                    strokeWidth={isMainAngle ? 1.2 : 0.6}
                    strokeOpacity={isMainAngle ? 0.7 : 0.35}
                    strokeDasharray={isMainAngle ? "6 4" : "3 4"}
                  />

                  {isMainAngle && (
                    <circle
                      cx={posInner.x}
                      cy={posInner.y}
                      r={2}
                      fill={isBrightSky ? "#1e293b" : "#FFE566"}
                      fillOpacity={0.8}
                    />
                  )}

                  {/* Número da casa — sem letras M/A/D/I */}
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={{
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                      fontSize: "11px",
                      fontWeight: isBrightSky ? 700 : 500,
                      fill: isBrightSky ? "#0f172a" : "#FFE566",
                      fillOpacity: 0.95,
                      textShadow: isBrightSky ? "0 0 3px rgba(255,255,255,0.9)" : "none",
                    }}
                  >
                    {houseNumber}
                  </text>
                </g>
              );
            })}

            <circle
              cx={cx}
              cy={cy}
              r={innerVoidRadius}
              fill="none"
              stroke={
                (showAtmosphere && theme === "light")
                  ? "#FFFFFF"
                  : ((isBrightSky || (theme === "light" && !showAtmosphere)) ? "#1e293b" : "#FFE566")
              }
              strokeWidth={0.5}
              strokeOpacity={(showAtmosphere && theme === "light") ? 0.6 : 0.25}
              strokeDasharray="3 5"
            />
          </g>
        )}
        {/* ── FIM OVERLAY CASAS NATAIS ── */}

        {/* Continuous Translucent Optical Contrast Ring behind House Numbers */}
        {showHouseMarkers && (
          <path
            d={`
              M ${cx} ${cy - 148}
              A 148 148 0 1 0 ${cx} ${cy + 148}
              A 148 148 0 1 0 ${cx} ${cy - 148}
              M ${cx} ${cy - 112}
              A 112 112 0 1 1 ${cx} ${cy + 112}
              A 112 112 0 1 1 ${cx} ${cy - 112}
              Z
            `}
            fillRule="evenodd"
            fill={
              houseMarkerRingColor ||
              (showAtmosphere
                ? "rgba(6, 12, 24, 0.42)"
                : theme === "light"
                  ? "rgba(255, 255, 255, 0.55)"
                  : "rgba(15, 23, 42, 0.38)")
            }
            fillOpacity={houseMarkerRingOpacity !== undefined ? houseMarkerRingOpacity : (showAtmosphere ? 0.42 : (theme === "light" ? 0.55 : 0.38))}
            stroke={
              showAtmosphere
                ? "rgba(255, 255, 255, 0.12)"
                : theme === "light"
                  ? "rgba(0, 0, 0, 0.08)"
                  : "rgba(255, 255, 255, 0.1)"
            }
            strokeWidth="0.8"
            className="pointer-events-none select-none"
            style={{
              backdropFilter: "blur(4px)",
            }}
          />
        )}

        <g>
          {houseCusps.map((cusp, i) => {
            const startAngle = getAngle(cusp);
            const nextCusp = houseCusps[(i + 1) % 12];
            const endAngle = getAngle(nextCusp);
            const houseNumber = i + 1;
            const isSelected = selectedHouses.includes(houseNumber);
            const isHovered = hoveredHouse === houseNumber;

            let fillOpacity = 0;
            if (isSelected) fillOpacity = 0.25;
            if (isHovered) fillOpacity = 0.15;

            const houseFill = "#8b5cf6";

            const wedgePath = describeAnnularSector(
              cx,
              cy,
              innerVoidRadius,
              atmosphereRadius,
              endAngle,
              startAngle,
            );

            const posInner = polarToCartesian(
              cx,
              cy,
              innerVoidRadius,
              startAngle,
            );
            const posOuter = polarToCartesian(
              cx,
              cy,
              atmosphereRadius,
              startAngle,
            );
            const isAngle = i === 0 || i === 3 || i === 6 || i === 9;
            const isMainAngle = i === 0 || i === 3 || i === 6 || i === 9; // AC, IC, DC, MC

            // Ensure ASC (houseNumber 1) and DSC (houseNumber 7) are always rendered when atmosphere is active
            const shouldShowLine = showHouseLines || (showAtmosphere && (houseNumber === 1 || houseNumber === 7));

            let diff = nextCusp - cusp;
            if (diff < 0) diff += 360;
            const midLon = cusp + diff / 2;
            const midAngle = getAngle(midLon);
            const houseNumberRadius = 130.5;
            const numPos = polarToCartesian(
              cx,
              cy,
              houseNumberRadius,
              midAngle,
            );

            let label = "";
            if (houseNumber === 1) {
              label = "ASC";
            } else if (houseNumber === 4) {
              label = "IC";
            } else if (houseNumber === 7) {
              label = "DSC";
            } else if (houseNumber === 10) {
              label = "MC";
            } else {
              label = houseFormat === "roman" ? toRoman(houseNumber) : String(houseNumber);
            }

            return (
              <g key={`house-group-${i}`}>
                <path
                  d={wedgePath}
                  fill={houseFill}
                  fillOpacity={fillOpacity}
                  className="cursor-help"
                  style={{ pointerEvents: "auto" }}
                  onClick={() => onHouseClick(houseNumber)}
                  onMouseEnter={(e) =>
                    handleMouseEnter(e, "house", houseNumber)
                  }
                  onMouseMove={handleMouseMove}
                  onMouseLeave={(e) => handleMouseLeave(e, "house")}
                />
                {shouldShowLine && (
                  <line
                    x1={posInner.x}
                    y1={posInner.y}
                    x2={posOuter.x}
                    y2={posOuter.y}
                    stroke={
                      isMainAngle
                        ? (mainHouseLineColor || ((showAtmosphere && theme === "light") ? "#FFFFFF" : (showAtmosphere ? (isBrightSky ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.95)") : (theme === "light" ? "rgba(15, 23, 42, 0.85)" : "rgba(255, 255, 255, 0.95)"))))
                        : (houseLineColor || ((showAtmosphere && theme === "light") ? "rgba(255, 255, 255, 0.75)" : (showAtmosphere ? (isBrightSky ? "rgba(255, 255, 255, 0.45)" : "rgba(255, 255, 255, 0.5)") : clockStrokeColor)))
                    }
                    strokeWidth={
                      isMainAngle
                        ? (mainHouseLineThickness ?? (showAtmosphere ? (isBrightSky ? 2.5 : 2.2) : (theme === "light" ? 2.0 : Math.max(2.2, Number(houseLineThickness) * 1.8))))
                        : houseLineThickness
                    }
                    strokeOpacity={
                      isMainAngle
                        ? (mainHouseLineOpacity ?? ((showAtmosphere && theme === "light") ? 1.0 : (showAtmosphere ? 1.0 : Math.min(1, Number(houseLineOpacity) * 1.5))))
                        : houseLineOpacity
                    }
                    strokeDasharray={
                      houseLineFormat === "dashed" ? "21 21" : "none"
                    }
                    style={{ 
                      pointerEvents: "none",
                      filter: isBrightSky ? "drop-shadow(0 0 2px rgba(255,255,255,0.8))" : (showAtmosphere ? "url(#glyph-lift)" : "none") 
                    }}
                  />
                )}
                {showHouseMarkers && (
                  <text
                    x={numPos.x}
                    y={numPos.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="cursor-pointer select-none"
                    style={{
                      fill: isSelected || isHovered
                        ? "#c084fc"
                        : showAtmosphere
                          ? "#FFFFFF"
                          : theme === "light"
                            ? "#1E293B"
                            : "#F1F5F9",
                      fontSize: isAngle
                        ? "13px"
                        : (houseFormat === "roman" ? "16.5px" : "17px"),
                      fontWeight: isAngle ? 800 : 700,
                      fontFamily: isAngle
                        ? "'Manrope', system-ui, sans-serif"
                        : (houseFormat === "roman"
                          ? "'Cormorant Infant', 'Cormorant Garamond', Georgia, serif"
                          : "'Manrope', system-ui, sans-serif"),
                      letterSpacing: isAngle ? "0.04em" : "normal",
                      textShadow: showAtmosphere ? "0 1px 3px rgba(0,0,0,0.85)" : "none",
                      pointerEvents: "auto",
                      transition: "fill 0.15s ease",
                    }}
                    onClick={() => onHouseClick(houseNumber)}
                    onMouseEnter={(e) =>
                      handleMouseEnter(e, "house", houseNumber)
                    }
                    onMouseMove={handleMouseMove}
                    onMouseLeave={(e) => handleMouseLeave(e, "house")}
                  >
                    {label}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* MC/IC Markers */}
        {showMcIcArrows && (
          <g
            className="pointer-events-none"
            transform={`rotate(${isZodiacFixed ? 0 : zodiacRotation}, ${cx}, ${cy})`}
          >
            {/* MC Arrow (House 10 Cusp) */}
            {(() => {
              const mcAngle = getAngle(houseCusps[9]);
              const pos = polarToCartesian(
                cx,
                cy,
                zodiacRingOuter + 2,
                mcAngle,
              );
              return (
                <g
                  transform={`translate(${pos.x}, ${pos.y}) rotate(${mcAngle})`}
                >
                  <path
                    d="M -6,-6 L 2,0 L -6,6"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              );
            })()}
            {/* IC Bar (House 4 Cusp) */}
            {(() => {
              const icAngle = getAngle(houseCusps[3]);
              const pos = polarToCartesian(
                cx,
                cy,
                zodiacRingOuter + 2,
                icAngle,
              );
              return (
                <g
                  transform={`translate(${pos.x}, ${pos.y}) rotate(${icAngle})`}
                >
                  <line
                    x1="0"
                    y1="-8"
                    x2="0"
                    y2="8"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </g>
              );
            })()}
          </g>
        )}

        <g className="pointer-events-none select-none" style={{ zIndex: 50 }}>
          {showTimeRing && !isNatalMode && (
            <>
              {timeRingElements}
            </>
          )}
        </g>

        <circle
          cx={cx}
          cy={cy}
          r={innerVoidRadius}
          fill="none"
          stroke="none"
          className="text-gray-300"
          strokeWidth="0"
        />

        <g
          className={`select-none ${onClockClick ? "cursor-pointer pointer-events-auto" : "pointer-events-none"}`}
          onClick={onClockClick}
          style={{
            filter: showAtmosphere ? "drop-shadow(0 1px 2px rgba(0,0,0,0.35))" : "none"
          }}
        >
          {/* Dia da semana — Sans-serif */}
          <text
            x={cx}
            y={cy - 42}
            textAnchor="middle"
            style={{
              fill: getCenterTextColor("muted"),
              fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
              fontStyle: "normal",
              fontWeight: 600,
              fontSize: "11.5px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            {weekdayVal}
          </text>

          {/* Hora — Cormorant Infant (Serifa única do centro) */}
          <text
            x={cx}
            y={cy - 8}
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              fill: getCenterTextColor("main"),
              fontFamily: "'Cormorant Infant', 'Cormorant Garamond', Georgia, serif",
              fontStyle: "normal",
              fontWeight: 600,
              fontSize: "46px",
              letterSpacing: "0.02em",
              lineHeight: 1,
            }}
          >
            {hours}:{minutes}
          </text>

          {/* Data — Sans-serif com alto contraste e legibilidade com margem de 6px do relógio */}
          <text
            x={cx}
            y={cy + 31}
            textAnchor="middle"
            style={{
              fill: getCenterTextColor("date"),
              fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
              fontWeight: 600,
              fontSize: "13.5px",
              letterSpacing: "0.04em",
            }}
          >
            {String(dayVal).padStart(2, "0")} · {monthVal} · {yearVal}
          </text>

          {/* Local — Sans-serif sutil e nítido */}
          <text
            x={cx}
            y={cy + 51}
            textAnchor="middle"
            style={{
              fill: getCenterTextColor("detail"),
              fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
              fontWeight: 500,
              fontSize: "11px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {locationName}
          </text>
        </g>

        <g className="pointer-events-none transition-colors duration-500" style={{
          color: (showAtmosphere && theme === "light") ? 'rgba(255,255,255,0.95)' : (isBrightSky ? 'rgba(8,20,50,0.35)' : clockStrokeColor),
          opacity: (showAtmosphere && theme === "light") ? 0.95 : (isBrightSky ? 0.85 : 0.8)
        }}>
          <circle
            cx={cx}
            cy={cy}
            r={innerGraduationRadius}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
          <circle
            cx={cx}
            cy={cy}
            r={116}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
          {innerHouseGraduationTicks}
        </g>

        {showOrbits && (
          <g className="pointer-events-none transition-colors duration-500" style={{ color: clockStrokeColor }}>
            {MAJOR_PLANET_IDS.map((planetId) => (
              <circle
                key={`orbit-${planetId}`}
                cx={cx}
                cy={cy}
                r={getPlanetRadius(planetId)}
                fill="none"
                stroke="currentColor"
                strokeOpacity={isBrightSky ? 0.2 : 0.35}
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            ))}
          </g>
        )}

        {filteredAspects.length > 0 &&
          (showAspectLines || (isNatalMode && showNatalLines)) && (
            <g className="opacity-90" mask="url(#center-mask)">
              {filteredAspects.map((aspect) => {
                const isSelected = selectedAspects.includes(aspect.id);
                const isHovered = hoveredAspect === aspect.id;
                const p1Selected =
                  selectedPlanets.includes(aspect.body1.id) ||
                  selectedPlanets.includes(`natal_${aspect.body1.id}`);
                const p2Selected = aspect.isNatal
                  ? selectedPlanets.includes(`natal_${aspect.body2.id}`) // body2 é sempre natal nos aspectos natais
                  : selectedPlanets.includes(aspect.body2.id) ||
                    selectedPlanets.includes(`natal_${aspect.body2.id}`);
                const maxOrb =
                  ASPECT_ORBS[aspect.type as keyof typeof ASPECT_ORBS] || 10;
                const orbRatio = Math.max(0, 1 - aspect.orb / maxOrb);
                let strokeWidth = 1.15 + orbRatio * 3.0;
                let strokeOpacity = 0.3 + orbRatio * 0.7;
                let dashArray = orbRatio < 0.6 ? "3 3" : "none";
                const color = ASPECT_LINE_COLORS[aspect.type] || "#9ca3af";

                let isVisible = true;
                if (isAnyAspectHovered) {
                  if (isHovered) isVisible = true;
                  else isVisible = false;
                } else if (anyAspectSelected) {
                  if (isSelected) {
                    isVisible = true;
                    strokeOpacity = Math.max(0.9, strokeOpacity);
                    strokeWidth = Math.max(2.5, strokeWidth);
                  } else {
                    isVisible = false;
                  }
                } else if (anyPlanetSelected) {
                  if (p1Selected && p2Selected) {
                    strokeOpacity = Math.max(0.8, strokeOpacity);
                    strokeWidth = Math.max(2.3, strokeWidth);
                  } else if (p1Selected || p2Selected) {
                    strokeOpacity = strokeOpacity * 0.4;
                  } else {
                    isVisible = false;
                  }
                }

                if (!isVisible) return null;
                let pos1, pos2;
                if (aspect.isNatal) {
                  pos1 = planetPositions[aspect.body1.id];
                  pos2 = natalPlanetPositions[aspect.body2.id];
                } else {
                  pos1 = planetPositions[aspect.body1.id];
                  pos2 = planetPositions[aspect.body2.id];
                }
                if (!pos1 || !pos2) return null;

                return (
                  <line
                    key={aspect.id}
                    x1={pos1.x}
                    y1={pos1.y}
                    x2={pos2.x}
                    y2={pos2.y}
                    stroke={color}
                    strokeWidth={isBrightSky ? Math.max(1.5, strokeWidth) : strokeWidth}
                    strokeOpacity={isBrightSky ? Math.max(0.65, strokeOpacity) : strokeOpacity}
                    strokeDasharray={dashArray}
                    strokeLinecap="round"
                    style={{ filter: isBrightSky ? "drop-shadow(0 0 2px rgba(255,255,255,0.85))" : (showAtmosphere ? "url(#glyph-lift)" : "none") }}
                    onClick={() => onAspectClick(aspect.id)}
                    className="cursor-pointer"
                  />
                );
              })}
            </g>
          )}

        {showNeedle && (
          <g className="pointer-events-none">
            {sortedPlanetIds.map((planetId) => {
              if (!visiblePlanets[planetId]) return null;
              const { angle } = planetPositions[planetId];
              const color = planetColors[planetId] || (theme === "light" ? "#1e293b" : "#ffffff");
              const isDashed = pointerStyle === "dashed";
              const dashArray = isDashed ? "4 2" : "none";

              const isMinimal = pointerStyle === "minimal" && !pointerFull;

              // ── Modo Mínimo — dois segmentos, sem cruzar as órbitas ──
              if (isMinimal) {
                // Segmento 1 — anel de casas (próximo ao relógio)
                const s1start = polarToCartesian(
                  cx,
                  cy,
                  innerVoidRadius,
                  angle,
                );
                const s1end = polarToCartesian(
                  cx,
                  cy,
                  numbersProtectionRadius,
                  angle,
                );
                // Segmento 2 — anel de graduação externo
                const s2start = polarToCartesian(
                  cx,
                  cy,
                  graduationRingInner - 24,
                  angle,
                );
                const s2end = polarToCartesian(
                  cx,
                  cy,
                  pointerShowGradLine ? graduationRingRadius : graduationRingInner,
                  angle,
                );

                return (
                  <g key={`needle-${planetId}`} opacity={pointerOpacity}>
                    <line
                       x1={s1start.x}
                       y1={s1start.y}
                       x2={s1end.x}
                       y2={s1end.y}
                       stroke={color}
                       strokeWidth={pointerThickness}
                       strokeLinecap="round"
                    />
                    <line
                       x1={s2start.x}
                       y1={s2start.y}
                       x2={s2end.x}
                       y2={s2end.y}
                       stroke={color}
                       strokeWidth={pointerThickness}
                       strokeLinecap="round"
                    />
                  </g>
                );
              }

              // ── Modos Sólido / Tracejado — linha completa com markers ──
              const headSize = Math.max(6, pointerThickness * 4);
              const tailSize = Math.max(5, pointerThickness * 3);

              let lineStartR: number;
              let baseEndRadius: number;

              if (pointerFull) {
                lineStartR = innerGraduationRadius;
                baseEndRadius = atmosphereRadius;
              } else if (pointerShowGradLine) { // "Minimalista" is active
                // Drawn strictly on the graduation ring with 12px bleed inward and 8px bleed outward
                lineStartR = graduationRingInner - 12;
                baseEndRadius = graduationRingRadius + 8;
              } else { // Normal mode: starts after the inner ring (innerGraduationRadius = 145)
                lineStartR = innerGraduationRadius + (pointerTail !== "none" ? tailSize : 0);
                baseEndRadius = graduationRingRadius;
              }

              const lineEndR = baseEndRadius - (pointerHead !== "none" ? headSize : 0);
              const innerPos = polarToCartesian(cx, cy, lineStartR, angle);
              const lineEndPos = polarToCartesian(cx, cy, lineEndR, angle);

              // Largura angular do marker escala com o raio para consistência visual
              const markerAngularWidth = (r: number) => Math.max(0.4, 4 / r);

              const renderMarker = (
                type: string,
                radius: number,
                size: number,
                isHead: boolean,
              ) => {
                const pos = polarToCartesian(cx, cy, radius, angle);
                const aw = markerAngularWidth(radius);

                if (type === "arrow") {
                  const baseR = isHead ? radius - size : radius + size;
                  const bL = polarToCartesian(cx, cy, baseR, angle - aw);
                  const bR = polarToCartesian(cx, cy, baseR, angle + aw);
                  return (
                    <polygon
                      points={`${pos.x},${pos.y} ${bL.x},${bL.y} ${bR.x},${bR.y}`}
                      fill={color}
                    />
                  );
                }
                if (type === "circle") {
                  return (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={size * 0.55}
                      fill={color}
                    />
                  );
                }
                if (type === "diamond") {
                  const tip = polarToCartesian(
                    cx,
                    cy,
                    isHead ? radius : radius + size,
                    angle,
                  );
                  const base = polarToCartesian(
                    cx,
                    cy,
                    isHead ? radius - size : radius,
                    angle,
                  );
                  const mid = (tip.x + base.x) / 2;
                  const midY = (tip.y + base.y) / 2;
                  const midR = isHead
                    ? radius - size * 0.5
                    : radius + size * 0.5;
                  const sL = polarToCartesian(cx, cy, midR, angle - aw);
                  const sR = polarToCartesian(cx, cy, midR, angle + aw);
                  return (
                    <polygon
                      points={`${tip.x},${tip.y} ${sL.x},${sL.y} ${base.x},${base.y} ${sR.x},${sR.y}`}
                      fill={color}
                    />
                  );
                }
                if (type === "square") {
                  const r1 = isHead ? radius : radius + size;
                  const r2 = isHead ? radius - size : radius;
                  const a1L = polarToCartesian(cx, cy, r1, angle - aw);
                  const a1R = polarToCartesian(cx, cy, r1, angle + aw);
                  const a2L = polarToCartesian(cx, cy, r2, angle - aw);
                  const a2R = polarToCartesian(cx, cy, r2, angle + aw);
                  return (
                    <polygon
                      points={`${a1L.x},${a1L.y} ${a1R.x},${a1R.y} ${a2R.x},${a2R.y} ${a2L.x},${a2L.y}`}
                      fill={color}
                    />
                  );
                }
                return null;
              };

              return (
                <g key={`needle-${planetId}`} opacity={pointerOpacity}>
                  <line
                    x1={innerPos.x}
                    y1={innerPos.y}
                    x2={lineEndPos.x}
                    y2={lineEndPos.y}
                    stroke={color}
                    strokeWidth={pointerThickness}
                    strokeDasharray={dashArray}
                    strokeLinecap="round"
                  />
                  {pointerHead !== "none" &&
                    renderMarker(
                      pointerHead,
                      baseEndRadius,
                      headSize,
                      true,
                    )}
                  {pointerTail !== "none" && !pointerFull && !pointerShowGradLine &&
                    renderMarker(
                      pointerTail,
                      innerGraduationRadius,
                      tailSize,
                      false,
                    )}
                </g>
              );
            })}
          </g>
        )}

        {/* Magnetic Fields */}
        {showMagneticField && (
          <g className="pointer-events-none">
            <style>
              {`
                                @keyframes magFlow {
                                    from { stroke-dashoffset: 0; }
                                    to { stroke-dashoffset: -24; }
                                }
                                .mag-line {
                                    animation: magFlow 1s linear infinite;
                                }
                            `}
            </style>
            {sortedPlanetIds.map((planetId) => {
              if (!visiblePlanets[planetId]) return null;
              const { x, y } = planetPositions[planetId];
              const color = planetColors[planetId] || (theme === "light" ? "#1e293b" : "#00ffff");
              const R = planetSize / 2;
              const size = planetSize * 1.5 * magneticFieldSize;

              // Calculate pull from other planets
              let pullX = 0;
              let pullY = 0;

              sortedPlanetIds.forEach((otherId) => {
                if (otherId === planetId || !visiblePlanets[otherId]) return;
                const otherPos = planetPositions[otherId];
                const dx = otherPos.x - x;
                const dy = otherPos.y - y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const maxDist = size * 5;
                if (dist < maxDist && dist > 0) {
                  const force = Math.pow((maxDist - dist) / maxDist, 2); // Stronger when closer
                  pullX += (dx / dist) * force * size * 1.5;
                  pullY += (dy / dist) * force * size * 1.5;
                }
              });

              // Rotate the magnetic field to align with the planet's angle
              const angleRad = Math.atan2(y - cy, x - cx) + Math.PI / 2;
              const angleDeg = angleRad * (180 / Math.PI);

              // Rotate pull vector to local coordinates
              const localPullX =
                pullX * Math.cos(-angleRad) - pullY * Math.sin(-angleRad);
              const localPullY =
                pullX * Math.sin(-angleRad) + pullY * Math.cos(-angleRad);

              const loops = [];
              const numLoops = Math.max(4, Math.floor(4 * magneticFieldSize));
              for (let i = 1; i <= numLoops; i++) {
                const spread = (i * size * 0.6) / magneticFieldSize;
                const height = R + i * size * 0.2;

                // Calculate opacity based on distance (i) and size
                const baseOpacity =
                  (0.3 + 0.1 * (i / numLoops)) * magneticFieldOpacity;
                const distanceFade = Math.max(0, 1 - i / (numLoops + 1));
                const finalOpacity = baseOpacity * distanceFade;

                // Left loop
                loops.push(
                  <path
                    key={`l-${i}`}
                    d={`M 0 ${-R} C ${-spread + localPullX} ${-height + localPullY}, ${-spread + localPullX} ${height + localPullY}, 0 ${R}`}
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeDasharray="4 8"
                    opacity={finalOpacity}
                    className="mag-line"
                    style={{
                      mixBlendMode: "screen",
                      filter: `drop-shadow(0 0 4px ${color})`,
                    }}
                  />,
                );
                // Right loop
                loops.push(
                  <path
                    key={`r-${i}`}
                    d={`M 0 ${-R} C ${spread + localPullX} ${-height + localPullY}, ${spread + localPullX} ${height + localPullY}, 0 ${R}`}
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeDasharray="4 8"
                    opacity={finalOpacity}
                    className="mag-line"
                    style={{
                      mixBlendMode: "screen",
                      filter: `drop-shadow(0 0 4px ${color})`,
                    }}
                  />,
                );
              }

              return (
                <g
                  key={`mag-${planetId}`}
                  transform={`translate(${x}, ${y}) rotate(${angleDeg})`}
                >
                  {loops}
                </g>
              );
            })}
          </g>
        )}

        <g>
          {sortedPlanetIds.map((planetId) => {
            if (!visiblePlanets[planetId] || !planetPositions[planetId])
              return null;
            const { x, y, angle } = planetPositions[planetId];
            const isSelected = selectedPlanets.includes(planetId);
            const isGhost = ghostPlanets.includes(planetId);
            const planetHouse = housePlacements[planetId];
            const isHouseHovered =
              hoveredHouse !== null && planetHouse === hoveredHouse;
            const isHovered =
              hoveredPlanet === planetId &&
              !hoveredPlanet?.startsWith("natal_");
            const isRetro = retrogradeStatus[planetId];
            const isStationary = stationaryStatus?.[planetId];

            let isDimmedByFilter = false;
            if (highlightFilter) {
              const key = `${planetId}EclipticLongitude` as keyof CelestialData;
              const longitude = celestialData[key] as number;
              if (typeof longitude === "number") {
                const signIndex = Math.floor(longitude / 30);
                const sign = ZODIAC_DATA[signIndex];
                if (sign) {
                  if (
                    highlightFilter.type === "element" &&
                    sign.element !== highlightFilter.value
                  )
                    isDimmedByFilter = true;
                  if (
                    highlightFilter.type === "modality" &&
                    sign.modality !== highlightFilter.value
                  )
                    isDimmedByFilter = true;
                  if (
                    highlightFilter.type === "polarity" &&
                    sign.polarity !== highlightFilter.value
                  )
                    isDimmedByFilter = true;
                }
              }
            }

            let opacity = 1;
            let pointerEvents = "auto";
            if (anyPlanetSelected) {
              if (isSelected) opacity = 1;
              else if (isGhost) opacity = 0.25;
              else {
                opacity = 0;
                pointerEvents = "none";
              }
            }

            if (isDimmedByFilter && opacity > 0.1) {
              opacity = 0.1;
            } else if (!isDimmedByFilter && highlightFilter) {
              opacity = 1;
            }

            const color = planetColors[planetId] || (theme === "light" ? "#1e293b" : "#ffffff");
            const currentPlanetSize = planetSize;

            const iconSize = currentPlanetSize;
            const iconOffset = iconSize / 2;
            const fontSize = currentPlanetSize * 0.6;
            const shouldUseSphere = showPlanetSpheres;
            const isMoon = planetId === "moon";
            const eclipse = isMoon && currentTime ? checkIsEclipse(currentTime) : null;
            const isSolarEclipse = !!(eclipse && eclipse.type === "solar");
            const isLunarEclipse = !!(eclipse && eclipse.type === "lunar");
            const moonEmoji =
              isMoon && showPlanetSpheres
                ? getMoonPhaseEmoji(celestialData.moonPhase)
                : "";

            const glyphColor = SPHERE_GLYPH_COLORS[planetId] || "white";
            const hasDarkGlyph =
              glyphColor !== "#ffffff" &&
              glyphColor !== "white" &&
              planetId !== "lilith";

            return (
              <g
                key={planetId}
                onClick={(e) => {
                  e.stopPropagation();
                  onPlanetClick(planetId);
                }}
                onMouseEnter={(e) => handleMouseEnter(e, "planet", planetId)}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="cursor-pointer group !transition-none"
                style={{
                  opacity,
                  pointerEvents: pointerEvents as any,
                  transform: `translate(${x}px, ${y}px)`,
                  willChange: "transform",
                  transition: smoothTransitions
                    ? "transform 1s linear, opacity 0.3s ease"
                    : "opacity 0.3s ease",
                }}
              >
                <g>
                  <g className={`${isHovered ? "scale-125" : "scale-100"}`}>
                    {/* Protection Circle for Non-Sphere Mode */}
                    {!shouldUseSphere && (
                      <circle
                        r={iconSize / 1.8}
                        fill={theme === "light" ? "#f4f1ea" : (showAtmosphere ? "#0f172a" : "#131129")}
                        fillOpacity="1"
                        stroke={color}
                        strokeWidth="1"
                      />
                    )}

                    {isMoon && showPlanetSpheres ? (
                      <g className="pointer-events-none">
                        {isSolarEclipse && (
                          <g className="animate-pulse duration-1000">
                            <circle cx="0" cy="0" r={iconSize * 0.95} fill="none" stroke="#FF4500" strokeWidth="4" strokeOpacity="0.85" filter="url(#fire-ring-glow)" />
                            <circle cx="0" cy="0" r={iconSize * 0.8} fill="none" stroke="#FF8C00" strokeWidth="2.5" strokeOpacity="1" filter="url(#fire-ring-glow-intense)" />
                            <circle cx="0" cy="0" r={iconSize * 0.65} fill="none" stroke="#FFD700" strokeWidth="1.5" strokeOpacity="1" />
                          </g>
                        )}
                        {isLunarEclipse && (
                          <g>
                            <circle cx="0" cy="0" r={iconSize * 0.9} fill="none" stroke="#8B0000" strokeWidth="3.5" strokeOpacity="0.85" filter="url(#moon-glow)" />
                            <circle cx="0" cy="0" r={iconSize * 0.75} fill="none" stroke="#FF3333" strokeWidth="1.5" strokeOpacity="0.9" />
                          </g>
                        )}
                        {(isSelected || isHovered) && (
                          <circle
                            r={iconSize * 0.65}
                            fill="white"
                            fillOpacity="0.15"
                            stroke="#8b5cf6"
                            strokeWidth="2"
                          />
                        )}
                        <g transform={`translate(${-iconSize * (16 / 24)}, ${-iconSize * (16 / 24)})`}>
                          <MoonPhaseDisk phase={celestialData.moonPhase} size={iconSize * (32 / 24)} />
                        </g>
                      </g>
                    ) : shouldUseSphere ? (
                      <g>
                        {planetId === "saturn" && (
                          <ellipse
                            cx="0"
                            cy="0"
                            rx={iconSize * 0.8}
                            ry={iconSize * 0.25}
                            fill="none"
                            stroke="#D2B48C"
                            strokeWidth={iconSize * 0.15}
                            transform="rotate(-25)"
                            opacity="0.8"
                          />
                        )}
                        {planetId === "uranus" && (
                          <ellipse
                            cx="0"
                            cy="0"
                            rx={iconSize * 0.3}
                            ry={iconSize * 0.85}
                            fill="none"
                            stroke="#A0F0FF"
                            strokeWidth={iconSize * 0.075}
                            opacity="0.8"
                          />
                        )}
                        <circle
                          r={iconSize / 2}
                          fill={`url(#grad-${planetId})`}
                          className={`${isSelected || isHovered ? (theme === "light" ? "stroke-[#78350f] stroke-2" : "stroke-white stroke-2") : ""}`}
                          filter={planetId === "sun" ? "url(#glow)" : ""}
                        />
                        {planetId === "jupiter" && (
                          <>
                            <circle
                              r={iconSize / 2}
                              fill="url(#grad-jupiter-stripes)"
                              fillOpacity="0.6"
                              transform="rotate(45)"
                            />
                            <circle
                              r={iconSize / 2}
                              fill="url(#grad-jupiter-overlay)"
                            />
                          </>
                        )}
                        <text
                          x="0"
                          y="0"
                          dy={fontSize * 0.35}
                          textAnchor="middle"
                          fill={glyphColor}
                          fontSize={fontSize}
                          style={{
                            fontFamily:
                              '"Noto Sans Symbols", "Segoe UI Symbol", sans-serif',
                            pointerEvents: "none",
                            filter: hasDarkGlyph
                              ? "drop-shadow(0 1px 0px rgba(255,255,255,0.3))"
                              : "drop-shadow(0 1px 2px rgba(0,0,0,0.8))",
                            fontWeight: hasDarkGlyph ? "bold" : "normal",
                          }}
                        >
                          {CELESTIAL_GLYPHS[planetId]}
                        </text>
                        {isStationary ? (
                          <g
                            transform={`translate(${iconOffset / 2}, ${iconOffset / 2})`}
                          >
                            <circle
                              r={Math.max(4, fontSize * 0.3)}
                              fill="#EAB308"
                              stroke="white"
                              strokeWidth="1"
                            />
                            <text
                              dy="3"
                              textAnchor="middle"
                              fill="#5F370E"
                              fontSize={Math.max(6, fontSize * 0.35)}
                              fontWeight="bold"
                            >
                              ST
                            </text>
                          </g>
                        ) : isRetro ? (
                          <g
                            transform={`translate(${iconOffset / 2}, ${iconOffset / 2})`}
                          >
                            <circle
                              r={Math.max(4, fontSize * 0.3)}
                              fill="red"
                              stroke="white"
                              strokeWidth="1"
                            />
                            <text
                              dy="3"
                              textAnchor="middle"
                              fill="white"
                              fontSize={Math.max(6, fontSize * 0.4)}
                              fontWeight="bold"
                            >
                              R
                            </text>
                          </g>
                        ) : null}
                      </g>
                    ) : (
                      <g>
                        {isSolarEclipse && (
                          <g className="animate-pulse duration-1000">
                            <circle cx="0" cy="0" r={iconSize * 0.95} fill="none" stroke="#FF4500" strokeWidth="4" strokeOpacity="0.85" filter="url(#fire-ring-glow)" />
                            <circle cx="0" cy="0" r={iconSize * 0.8} fill="none" stroke="#FF8C00" strokeWidth="2.5" strokeOpacity="1" filter="url(#fire-ring-glow-intense)" />
                            <circle cx="0" cy="0" r={iconSize * 0.65} fill="none" stroke="#FFD700" strokeWidth="1.5" strokeOpacity="1" />
                          </g>
                        )}
                        {isLunarEclipse && (
                          <g>
                            <circle cx="0" cy="0" r={iconSize * 0.9} fill="none" stroke="#8B0000" strokeWidth="3.5" strokeOpacity="0.85" filter="url(#moon-glow)" />
                            <circle cx="0" cy="0" r={iconSize * 0.75} fill="none" stroke="#FF3333" strokeWidth="1.5" strokeOpacity="0.9" />
                          </g>
                        )}
                        <text
                          x="0"
                          y="0"
                          dy={fontSize * 0.35}
                          textAnchor="middle"
                          fontSize={fontSize}
                          fill={color}
                          style={{
                            fontFamily:
                              '"Noto Sans Symbols", "Segoe UI Symbol", sans-serif',
                            filter: "drop-shadow(0 0 1px black)",
                          }}
                        >
                          {CELESTIAL_GLYPHS[planetId]}
                        </text>
                        {isStationary ? (
                          <g
                            transform={`translate(${iconOffset / 2}, ${iconOffset / 2})`}
                          >
                            <circle
                              r={Math.max(4, fontSize * 0.3)}
                              fill="#EAB308"
                              stroke="white"
                              strokeWidth="1"
                            />
                            <text
                              dy="3"
                              textAnchor="middle"
                              fill="#5F370E"
                              fontSize={Math.max(6, fontSize * 0.35)}
                              fontWeight="bold"
                            >
                              ST
                            </text>
                          </g>
                        ) : isRetro ? (
                          <g
                            transform={`translate(${iconOffset / 2}, ${iconOffset / 2})`}
                          >
                            <circle
                              r={Math.max(4, fontSize * 0.3)}
                              fill="red"
                              stroke="white"
                              strokeWidth="1"
                            />
                            <text
                              dy="3"
                              textAnchor="middle"
                              fill="white"
                              fontSize={Math.max(6, fontSize * 0.4)}
                              fontWeight="bold"
                            >
                              R
                            </text>
                          </g>
                        ) : null}
                      </g>
                    )}
                  </g>
                  {showDegreeLabels &&
                    (() => {
                      const lon = celestialData[
                        `${planetId}EclipticLongitude` as keyof CelestialData
                      ] as number;
                      if (typeof lon !== "number") return null;
                      const { deg, signId, min } = formatPlanetDegree(lon);
                      const SignIcon =
                        ZODIAC_ICONS[signId as keyof typeof ZODIAC_ICONS];
                      const fs = degreeLabelSize;
                      const color = theme === "light" ? "#0f172a" : "#f8fafc";
                      const isVertical = degreeLabelFormat === "vertical";
                      const iconSize = isVertical ? Math.round(fs * 1.0) : Math.round(fs * 1.05);
                      const badgeW = isVertical ? Math.round(fs * 2.2) : Math.round(fs * 2.8 + iconSize + 22);
                      const badgeH = isVertical ? Math.round(fs * 3.4) : Math.round(fs * 1.45);
                      const rx = isVertical ? 6 : 4;

                      const placement = degreeLabelPlacements[planetId];
                      const trX = placement ? placement.trX : 0;
                      const trY = placement ? placement.trY : (isVertical ? -34 : -30);

                      const distFromCenter = Math.hypot(trX, trY);

                      return (
                        <g
                          transform={`translate(${trX}, ${trY})`}
                          style={{ pointerEvents: "none" }}
                        >
                          {/* Dotted guide line if shifted from planet */}
                          {distFromCenter > 28 && (
                            <line
                              x1={-trX * 0.7}
                              y1={-trY * 0.7}
                              x2={0}
                              y2={0}
                              stroke={
                                theme === "light"
                                  ? "rgba(0, 0, 0, 0.3)"
                                  : "rgba(255, 255, 255, 0.4)"
                              }
                              strokeWidth="1"
                              strokeDasharray="2,2"
                            />
                          )}

                          {/* Protective Safety Backdrop Card */}
                          <rect
                            x={-badgeW / 2}
                            y={-badgeH / 2}
                            width={badgeW}
                            height={badgeH}
                            rx={rx}
                            fill={
                              theme === "light"
                                ? "rgba(255, 255, 255, 0.96)"
                                : "rgba(10, 14, 26, 0.90)"
                            }
                            stroke={
                              theme === "light"
                                ? "rgba(0, 0, 0, 0.22)"
                                : "rgba(255, 255, 255, 0.24)"
                            }
                            strokeWidth="1"
                            filter="drop-shadow(0 2px 5px rgba(0,0,0,0.6))"
                          />

                          {isVertical ? (
                            /* Layout Vertical: Grau no topo, Símbolo do Signo no meio, Minutos na base */
                            <g>
                              {/* Graus (Top) */}
                              <text
                                x={0}
                                y={-badgeH * 0.28}
                                textAnchor="middle"
                                dominantBaseline="central"
                                style={{
                                  fill: color,
                                  fontFamily: "'Inter', sans-serif",
                                  fontVariantNumeric: "tabular-nums",
                                  fontSize: `${fs * 0.88}px`,
                                  fontWeight: 700,
                                }}
                              >
                                {deg}°
                              </text>

                              {/* Símbolo do Signo do Zodíaco (Centro) */}
                              {SignIcon && (
                                <g
                                  transform={`translate(${-iconSize * 0.5}, ${-iconSize * 0.5})`}
                                >
                                  <SignIcon
                                    width={iconSize}
                                    height={iconSize}
                                    fill={getSignElementColor(signId)}
                                  />
                                </g>
                              )}

                              {/* Minutos (Base) */}
                              <text
                                x={0}
                                y={badgeH * 0.28}
                                textAnchor="middle"
                                dominantBaseline="central"
                                style={{
                                  fill: color,
                                  fontFamily: "'Inter', sans-serif",
                                  fontVariantNumeric: "tabular-nums",
                                  fontSize: `${fs * 0.88}px`,
                                  fontWeight: 600,
                                }}
                              >
                                {String(min).padStart(2, "0")}&apos;
                              </text>
                            </g>
                          ) : (
                            /* Layout Horizontal: Grau -> Símbolo -> Minuto perfeitamente alinhado */
                            <g>
                              {/* Grau (ex: 03°) */}
                              <text
                                x={-badgeW / 2 + 7}
                                y={0}
                                textAnchor="start"
                                dominantBaseline="central"
                                style={{
                                  fill: color,
                                  fontFamily: "'Inter', sans-serif",
                                  fontVariantNumeric: "tabular-nums",
                                  fontSize: `${fs * 0.95}px`,
                                  fontWeight: 700,
                                }}
                              >
                                {deg}°
                              </text>

                              {/* Símbolo do Signo do Zodíaco */}
                              {SignIcon && (
                                <g
                                  transform={`translate(${-badgeW / 2 + 7 + fs * 1.4 + 3}, ${-iconSize * 0.5})`}
                                >
                                  <SignIcon
                                    width={iconSize}
                                    height={iconSize}
                                    fill={getSignElementColor(signId)}
                                  />
                                </g>
                              )}

                              {/* Minutos (ex: 28') */}
                              <text
                                x={-badgeW / 2 + 7 + fs * 1.4 + 3 + iconSize + 4}
                                y={0}
                                textAnchor="start"
                                dominantBaseline="central"
                                style={{
                                  fill: color,
                                  fontFamily: "'Inter', sans-serif",
                                  fontVariantNumeric: "tabular-nums",
                                  fontSize: `${fs * 0.88}px`,
                                  fontWeight: 600,
                                  opacity: 0.92,
                                }}
                              >
                                {String(min).padStart(2, "0")}&apos;
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })()}
                </g>
              </g>
            );
          })}
        </g>
        {natalData && (
          <g>
            {sortedPlanetIds.map((planetId) => {
              const natalVisibles = visibleNatalPlanets || {};
              if (!natalVisibles[planetId] || !natalPlanetPositions[planetId])
                return null;
              const { x, y } = natalPlanetPositions[planetId];
              const iconSize = planetSize * 0.85;
              const fontSize = iconSize * 0.7;
              const shieldR = fontSize * 0.85;
              const isNatalSelected = selectedPlanets.includes(
                `natal_${planetId}`,
              );
              const isNatalHovered = hoveredPlanet === `natal_${planetId}`;

              const natalColor = natalColorMode === "colored"
                ? (planetColors[planetId] || (theme === "light" ? "#92400E" : "#FFE566"))
                : (theme === "light" ? "#92400E" : "#FFE566");
              const natalStroke = natalColorMode === "colored"
                ? natalColor
                : (theme === "light" ? "#78350F" : "#C8960B");

              return (
                <g
                  key={`natal-${planetId}`}
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                    transition: "none",
                    cursor: "pointer",
                  }}
                  opacity={isNatalHovered ? 1 : 0.95}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlanetClick(planetId);
                  }}
                >
                  <circle
                    r={shieldR * (isNatalHovered ? 1.2 : 1)}
                    fill={theme === "light" ? "#f0ede6" : "#06060e"}
                    fillOpacity={0.85}
                    stroke={natalColor}
                    strokeWidth={isNatalSelected || isNatalHovered ? 1.5 : 0.5}
                    strokeOpacity={isNatalSelected || isNatalHovered ? 1 : 0.4}
                  />
                  {(isNatalSelected || isNatalHovered) && (
                    <circle
                      r={shieldR + 3}
                      fill="none"
                      stroke={natalColor}
                      strokeWidth={1.5}
                      strokeOpacity={0.8}
                    />
                  )}
                  <text
                    x="0"
                    y="0"
                    dy={fontSize * 0.35}
                    textAnchor="middle"
                    fill={natalColor}
                    stroke={natalStroke}
                    strokeWidth="0.3"
                    fontSize={fontSize * 1.2}
                    style={{
                      fontFamily:
                        '"Noto Sans Symbols", "Segoe UI Symbol", sans-serif',
                      pointerEvents: "none",
                    }}
                  >
                    {CELESTIAL_GLYPHS[planetId]}
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </svg>
      </div>
      {tooltip && (
        <Tooltip
          text={
            <div>
              <h4 className="font-bold text-sm mb-1 text-brand-purple uppercase tracking-wide">
                {tooltip.title}
              </h4>
              <div className="text-xs text-brand-text-muted leading-relaxed">
                {tooltip.description}
              </div>
            </div>
          }
          visible={!!tooltip}
          x={tooltip.x}
          y={tooltip.y}
        />
      )}
    </div>
  );
};
