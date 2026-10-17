import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCelestialData, CelestialData } from './hooks/useCelestialData';
import { SiderealClock } from './components/SiderealClock';
import { CelestialBodyPanel, CelestialSettings } from './components/CelestialBodyPanel';
import { PanelFrame } from './components/PanelFrame';
import { AstroInfoPanel, AspectSettings } from './components/AstroInfoPanel';
import { LoginScreen } from './components/LoginScreen';
import { LandingPage } from './components/LandingPage';
import { LeadGate } from './components/LeadGate';
import { LeadCheckoutModal } from './components/LeadCheckoutModal';
import { PaywallModal } from './components/PaywallModal';
import { HouseCuspsPanel } from './components/HouseCuspsPanel';
import { SunInfoPanel } from './components/SunInfoPanel';
import { MoonInfoPanel } from './components/MoonInfoPanel';
import { CalendarPanel } from './components/CalendarPanel';
import { ChartStatisticsPanel, HighlightFilter } from './components/ChartStatisticsPanel';
import { SearchMoonPhase } from 'astronomy-engine';
import { EnergyChartPanel } from './components/EnergyChartPanel';
import { TransitChart } from './components/TransitChart';
import { StarField } from './components/StarField';
import { Dashboard } from './components/Dashboard';
import { TimeControls, SizeControl, CompactToggle, SegmentedControl } from './components/Controls';
import { UI_ICONS, ZODIAC_ICONS } from './components/icons';
import { LocationSearchInput } from './components/LocationSearchInput';
import { HeliocentricView } from './components/HeliocentricView';
import { calculateTransitNatalAspects, Aspect } from './lib/astrology/aspects';
import { normalizeAngle } from './lib/astrology/utils';
import { HouseSystem } from './lib/astrology/houseSystem';
import { getSeasonInfo, getNextMoonPhases, getSeasonIngresses } from './lib/astrology/calendars';
import { getMoonPhaseInfo } from './lib/astrology/moon';
import { useLanguage } from './i18n';
import { ExportPDFButton } from './components/ExportPDFButton';
import { TopBar } from './components/TopBar';
import { QuickToolsSidebar } from './components/QuickToolsSidebar';
import { useTrialTimer } from './hooks/useTrialTimer';
import StarfieldBackground from './components/StarfieldBackground';
import { GlobalSvgDefs } from './components/GlobalSvgDefs';
import { ProfileModal } from './components/ProfileModal';
import { PaymentPlansModal } from './components/PaymentPlansModal';
import { LoginModal } from './components/LoginModal';
import { AdminDashboard } from './components/AdminDashboard';
import { 
    auth, 
    signOut, 
    onAuthStateChanged, 
    syncUserProfile, 
    testFirestoreConnection,
    saveMapToFirestore,
    loadMapsFromFirestore,
    deleteMapFromFirestore,
    saveLayoutToFirestore,
    loadLayoutsFromFirestore,
    deleteLayoutFromFirestore,
    updateUserPlanInFirestore
} from './lib/firebase';

export type WidgetId = 'planets' | 'aspects' | 'houses' | 'transits' | 'clock' | 'toolbar' | 'statistics';

// Default location: São Paulo, Brazil
const DEFAULT_LOCATION = {
    latitude: -23.5505,
    longitude: -46.6333,
    displayName: 'São Paulo, BR'
};

// Brazilian Capitals List
const BRAZIL_CAPITALS = [
    { name: "Aracaju, SE", latitude: -10.9111, longitude: -37.0717 },
    { name: "Belém, PA", latitude: -1.4558, longitude: -48.4902 },
    { name: "Belo Horizonte, MG", latitude: -19.9167, longitude: -43.9345 },
    { name: "Boa Vista, RR", latitude: 2.8235, longitude: -60.6758 },
    { name: "Brasília, DF", latitude: -15.7975, longitude: -47.8919 },
    { name: "Campo Grande, MS", latitude: -20.4697, longitude: -54.6201 },
    { name: "Cuiabá, MT", latitude: -15.6010, longitude: -56.0979 },
    { name: "Curitiba, PR", latitude: -25.4284, longitude: -49.2733 },
    { name: "Florianópolis, SC", latitude: -27.5954, longitude: -48.5480 },
    { name: "Fortaleza, CE", latitude: -3.7172, longitude: -38.5433 },
    { name: "Goiânia, GO", latitude: -16.6869, longitude: -49.2648 },
    { name: "João Pessoa, PB", latitude: -7.1195, longitude: -34.8450 },
    { name: "Macapá, AP", latitude: 0.0355, longitude: -51.0705 },
    { name: "Maceió, AL", latitude: -9.6662, longitude: -35.7351 },
    { name: "Manaus, AM", latitude: -3.1190, longitude: -60.0217 },
    { name: "Natal, RN", latitude: -5.7945, longitude: -35.2110 },
    { name: "Palmas, TO", latitude: -10.1689, longitude: -48.3317 },
    { name: "Porto Alegre, RS", latitude: -30.0346, longitude: -51.2177 },
    { name: "Porto Velho, RO", latitude: -8.7619, longitude: -63.9039 },
    { name: "Recife, PE", latitude: -8.0476, longitude: -34.8770 },
    { name: "Rio Branco, AC", latitude: -9.9745, longitude: -67.8090 },
    { name: "Rio de Janeiro, RJ", latitude: -22.9068, longitude: -43.1729 },
    { name: "Salvador, BA", latitude: -12.9777, longitude: -38.5016 },
    { name: "São Luís, MA", latitude: -2.5391, longitude: -44.2829 },
    { name: "São Paulo, SP", latitude: -23.5505, longitude: -46.6333 },
    { name: "Teresina, PI", latitude: -5.0919, longitude: -42.8034 },
    { name: "Vitória, ES", latitude: -20.3155, longitude: -40.3128 }
];

// Default visible planets
const DEFAULT_VISIBLE_PLANETS: Record<string, boolean> = {
    sun: true, moon: true, mercury: true, venus: true, mars: true,
    jupiter: true, saturn: true, uranus: true, neptune: true, pluto: true,
    lilith: false, northNode: false, southNode: false,
    chiron: false, ceres: false, pallas: false, juno: false, vesta: false,
    partOfFortune: false
};

const getBodiesFromData = (data: CelestialData, visible: Record<string, boolean>) => {
    const bodies: any[] = [];
    const knownIds = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'lilith', 'northNode', 'southNode', 'chiron', 'ceres', 'pallas', 'juno', 'vesta', 'partOfFortune'];

    knownIds.forEach(id => {
        if (!visible[id]) return;
        const key = `${id}EclipticLongitude` as keyof CelestialData;
        const val = data[key] as number;
        if (typeof val === 'number') {
            bodies.push({
                id,
                name: id,
                symbol: '',
                longitude: val,
                signIndex: Math.floor(val / 30),
                house: data.housePlacements?.[id] || 0
            });
        }
    });
    return bodies;
}


const ECLIPSE_EVENTS = [
    { id: 'solar-1', type: 'solar', name: 'Eclipse Solar Anular', date: '17 Fev 2026', description: 'Visível na Antártida e Sul da África. O "Anel de Fogo" será visível em áreas remotas.' },
    { id: 'lunar-1', type: 'lunar', name: 'Eclipse Lunar Total', date: '03 Mar 2026', description: 'Visível nas Américas, Ásia e Austrália. Uma "Lua de Sangue" profunda.' },
    { id: 'solar-2', type: 'solar', name: 'Eclipse Solar Total', date: '12 Ago 2026', description: 'Visível no Ártico, Groenlândia, Islândia e Espanha. O primeiro total na Europa em décadas.' },
    { id: 'lunar-2', type: 'lunar', name: 'Eclipse Lunar Parcial', date: '28 Ago 2026', description: 'Visível nas Américas, Europa e África. A Lua passará pela sombra da Terra.' },
    { id: 'solar-3', type: 'solar', name: 'Eclipse Solar Anular', date: '06 Fev 2027', description: 'Visível na América do Sul e África. O Chile e Argentina terão as melhores vistas.' },
    { id: 'lunar-3', type: 'lunar', name: 'Eclipse Lunar Penumbral', date: '20 Fev 2027', description: 'Visível nas Américas, Europa e África. Um escurecimento sutil da Lua.' },
    { id: 'solar-4', type: 'solar', name: 'Eclipse Solar Total', date: '02 Ago 2027', description: 'Visível no Norte da África e Oriente Médio. Um dos eclipses mais longos do século.' },
    { id: 'lunar-4', type: 'lunar', name: 'Eclipse Lunar Penumbral', date: '18 Ago 2027', description: 'Visível nas Américas, Europa e África.' },
    { id: 'other-1', type: 'other', name: 'Chuva de Meteoros Perseidas', date: '12-13 Ago 2026', description: 'Uma das melhores chuvas do ano, com até 100 meteoros por hora.' },
    { id: 'other-2', type: 'other', name: 'Conjunção Marte-Júpiter', date: '14 Ago 2026', description: 'Os dois planetas estarão extremamente próximos no céu matutino.' },
    { id: 'other-3', type: 'other', name: 'Chuva de Meteoros Gemínidas', date: '13-14 Dez 2026', description: 'Meteoros brilhantes e coloridos, visíveis de ambos os hemisférios.' },
];


export const App: React.FC = () => {
    const { t } = useLanguage();
    const clockRef = useRef<HTMLDivElement>(null);
    // --- State ---
    const [currentTime, setCurrentTime] = useState<Date>(new Date());
    const [isRealTime, setIsRealTime] = useState(true);
    const [timeStep, setTimeStep] = useState<'sec' | 'min' | 'hour' | 'day' | 'month' | 'year'>('min');
    const [speedMultiplier, setSpeedMultiplier] = useState<number>(2); 
    const [location, setLocation] = useState(DEFAULT_LOCATION);
    
    // UI Layout State
    const [panelWidths, setPanelWidths] = useState<Record<string, number>>({
        statistics: 220,
        celestial: 220,
        aspects: 245,
        cusps: 245,
    });
    const [rightPanelScale, setRightPanelScale] = useState(1.0);
    const [leftPanelScale, setLeftPanelScale] = useState(1.0);
    const statusPanelRef = useRef<HTMLDivElement>(null);
    // Configurações iniciais nativas: Status completo sem scroll por padrão (height: auto), ajustável via resizer
    const [sidebarStatusHeight, setSidebarStatusHeight] = useState<number | null>(null);
    const [sidebarCuspsHeight, setSidebarCuspsHeight] = useState<number>(215);

    const resetAllPanelLayouts = useCallback(() => {
        setSidebarStatusHeight(null);
        setSidebarCuspsHeight(215);
        setShowCuspDegrees(false);
        setPanelWidths({
            statistics: 220,
            celestial: 220,
            aspects: 245,
            cusps: 245,
        });
        setLeftPanelScale(1.0);
        setRightPanelScale(1.0);
        setUiScale(1.0);
        setStatsLayout('minimal');
        setHouseCuspsColumns('2col');
        setPanelStates(prev => ({
            celestial: { ...prev.celestial, isOpen: true, isCollapsed: false },
            statistics: { ...prev.statistics, isOpen: true, isCollapsed: false },
            aspects: { ...prev.aspects, isOpen: true, isCollapsed: false },
            cusps: { ...prev.cusps, isOpen: true, isCollapsed: false },
        }));
    }, []);

    const handleSidebarSplitResizePointerDown = (e: React.PointerEvent) => {
        e.stopPropagation();
        e.preventDefault();
        const startY = e.clientY;
        const currentElem = statusPanelRef.current;
        const startH = currentElem ? currentElem.getBoundingClientRect().height : (sidebarStatusHeight || 380);

        const onPointerMove = (moveEv: PointerEvent) => {
            const dy = moveEv.clientY - startY;
            const maxH = Math.max(120, window.innerHeight - 200);
            const newH = Math.max(100, Math.min(maxH, startH - dy));
            setSidebarStatusHeight(newH);
        };

        const onPointerUp = () => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);
    };

    const handleRightSidebarSplitResizePointerDown = (e: React.PointerEvent) => {
        e.stopPropagation();
        e.preventDefault();
        const startY = e.clientY;
        const startH = sidebarCuspsHeight;

        const onPointerMove = (moveEv: PointerEvent) => {
            const dy = moveEv.clientY - startY;
            const maxH = Math.max(120, window.innerHeight - 260);
            const newH = Math.max(100, Math.min(maxH, startH - dy));
            setSidebarCuspsHeight(newH);
        };

        const onPointerUp = () => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);
    };

    const [visiblePlanets, setVisiblePlanets] = useState(DEFAULT_VISIBLE_PLANETS);
    const [visibleNatalPlanets, setVisibleNatalPlanets] = useState(DEFAULT_VISIBLE_PLANETS);
    const [selectedPlanets, setSelectedPlanets] = useState<string[]>([]);
    const [selectedAspects, setSelectedAspects] = useState<string[]>([]);
    const [selectedHouses, setSelectedHouses] = useState<number[]>([]);
    const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
    const [hoveredAspect, setHoveredAspect] = useState<string | null>(null);
    const [hoveredHouse, setHoveredHouse] = useState<number | null>(null);
    
    // Visual Settings
    const [clockPlanetSize, setClockPlanetSize] = useState(46);
    const [zodiacSignSize, setZodiacSignSize] = useState(46);
    const [termsGlyphSize, setTermsGlyphSize] = useState(22);
    const [decanGlyphSize, setDecanGlyphSize] = useState(22);
    const [graduationRingWidth, setGraduationRingWidth] = useState(18);
    const [zodiacRingScale, setZodiacRingScale] = useState(1.0);
    const [seasonsRingScale, setSeasonsRingScale] = useState(0.75);
    const [decanRingScale, setDecanRingScale] = useState(2.0);
    const [termsRingScale, setTermsRingScale] = useState(2.0);
    const [ringLineColor, setRingLineColor] = useState('#746F5D');
    const [panelPlanetSize, setPanelPlanetSize] = useState(12);
    const [panelZodiacSignSize, setPanelZodiacSignSize] = useState(16);
    const [showPlanetSpheres, setShowPlanetSpheres] = useState(true);
    const [showDegreeLabels, setShowDegreeLabels] = useState(false);
    const [degreeLabelSize, setDegreeLabelSize] = useState(18);
    const [degreeLabelPosition, setDegreeLabelPosition] = useState<'responsive' | 'static' | 'callout' | 'staggered'>('responsive');
    const [degreeLabelFormat, setDegreeLabelFormat] = useState<'vertical' | 'horizontal'>('vertical');
    const [showAspectLines, setShowAspectLines] = useState(true);
    const [showNatalLines, setShowNatalLines] = useState(false);
    const [celestialTab, setCelestialTab] = useState<'transit' | 'natal'>('natal');
    const [showNeedle, setShowNeedle] = useState(true);
    const [showMagneticField, setShowMagneticField] = useState(false);
    const [magneticFieldSize, setMagneticFieldSize] = useState(1);
    const [magneticFieldOpacity, setMagneticFieldOpacity] = useState(0.5);
    const [showTimeRing, setShowTimeRing] = useState(false);
    const [showOrbits, setShowOrbits] = useState(false);
    const [allPlanetsSameOrbit, setAllPlanetsSameOrbit] = useState(false);
    const [planetColorMode, setPlanetColorMode] = useState<'colored' | 'gold'>('colored');
    const [natalColorMode, setNatalColorMode] = useState<'gold' | 'colored'>('gold');
    const [showStars, setShowStars] = useState(true);
    const [starCount, setStarCount] = useState<number>(() => {
        const saved = localStorage.getItem('chrono_star_count');
        return saved ? parseInt(saved, 10) : 1400;
    });
    const [starTwinkleIntensity, setStarTwinkleIntensity] = useState<number>(() => {
        const saved = localStorage.getItem('chrono_star_twinkle_intensity');
        return saved ? parseFloat(saved) : 0.75;
    });
    const [starTwinkleSpeed, setStarTwinkleSpeed] = useState<number>(() => {
        const saved = localStorage.getItem('chrono_star_twinkle_speed');
        return saved ? parseFloat(saved) : 1.0;
    });
    const [starTwinkleMode, setStarTwinkleMode] = useState<'natural' | 'calm' | 'vibrant' | 'subtle'>(() => {
        const saved = localStorage.getItem('chrono_star_twinkle_mode');
        return (saved as any) || 'natural';
    });
    const [starMeteors, setStarMeteors] = useState<boolean>(() => {
        const saved = localStorage.getItem('chrono_star_meteors');
        return saved !== null ? saved === 'true' : true;
    });
    const [starMeteorFrequency, setStarMeteorFrequency] = useState<'none' | 'rare' | 'moderate' | 'frequent'>(() => {
        const saved = localStorage.getItem('chrono_star_meteor_freq');
        return (saved as any) || 'moderate';
    });
    const [starNebulaGlow, setStarNebulaGlow] = useState<boolean>(() => {
        const saved = localStorage.getItem('chrono_star_nebula');
        return saved !== null ? saved === 'true' : true;
    });
    const [starBrightness, setStarBrightness] = useState<number>(() => {
        const saved = localStorage.getItem('chrono_star_brightness');
        return saved ? parseFloat(saved) : 1.0;
    });

    useEffect(() => {
        localStorage.setItem('chrono_star_count', starCount.toString());
    }, [starCount]);
    useEffect(() => {
        localStorage.setItem('chrono_star_twinkle_intensity', starTwinkleIntensity.toString());
    }, [starTwinkleIntensity]);
    useEffect(() => {
        localStorage.setItem('chrono_star_twinkle_speed', starTwinkleSpeed.toString());
    }, [starTwinkleSpeed]);
    useEffect(() => {
        localStorage.setItem('chrono_star_twinkle_mode', starTwinkleMode);
    }, [starTwinkleMode]);
    useEffect(() => {
        localStorage.setItem('chrono_star_meteors', starMeteors.toString());
    }, [starMeteors]);
    useEffect(() => {
        localStorage.setItem('chrono_star_meteor_freq', starMeteorFrequency);
    }, [starMeteorFrequency]);
    useEffect(() => {
        localStorage.setItem('chrono_star_nebula', starNebulaGlow.toString());
    }, [starNebulaGlow]);
    useEffect(() => {
        localStorage.setItem('chrono_star_brightness', starBrightness.toString());
    }, [starBrightness]);

    const [showSeasonsRing, setShowSeasonsRing] = useState(true);
    const [isZodiacFixed, setIsZodiacFixed] = useState(false);
    const [showAtmosphere, setShowAtmosphere] = useState(false);
    const [showHouseLines, setShowHouseLines] = useState(true);
    const [showHouseMarkers, setShowHouseMarkers] = useState(true);
    const [houseLineThickness, setHouseLineThickness] = useState(1);
    const [houseLineOpacity, setHouseLineOpacity] = useState(1.0);
    const [houseLineColor, setHouseLineColor] = useState('#878273'); // RGB 135,130,115
    const [mainHouseLineThickness, setMainHouseLineThickness] = useState(1.5);
    const [mainHouseLineOpacity, setMainHouseLineOpacity] = useState(1.0);
    const [mainHouseLineColor, setMainHouseLineColor] = useState('#a3a59d'); // RGB 163, 165, 157
    const [houseMarkerRingColor, setHouseMarkerRingColor] = useState('');
    const [houseMarkerRingOpacity, setHouseMarkerRingOpacity] = useState(0.38);
    const [showSignLines, setShowSignLines] = useState(false);
    const [showSignColors, setShowSignColors] = useState(false);
    const [signLineThickness, setSignLineThickness] = useState(1);
    const [signLineOpacity, setSignLineOpacity] = useState(0.3);
    const [showMcIcArrows, setShowMcIcArrows] = useState(false);
    const [isLeftPanelVisible, setIsLeftPanelVisible] = useState(true);
    const [isRightPanelVisible, setIsRightPanelVisible] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isQuickToolsSidebarOpen, setIsQuickToolsSidebarOpen] = useState(true);
    const [isTimeControlsMinimized, setIsTimeControlsMinimized] = useState(false);
    const [immersiveMode, setImmersiveMode] = useState(false);
    const [showEclipseModal, setShowEclipseModal] = useState(false);
    const [activeAstronomyTab, setActiveAstronomyTab] = useState<'phases' | 'eclipses' | 'other'>('phases');
    const [zodiacColorMode, setZodiacColorMode] = useState<'none' | 'element' | 'modality' | 'polarity'>('element');
    const [highlightFilter, setHighlightFilter] = useState<HighlightFilter>(null);
    
    const [showDecanRing, setShowDecanRing] = useState(true);
    const [showTermsRing, setShowTermsRing] = useState(true);
    const [backgroundBrightness, setBackgroundBrightness] = useState(80);
    const [backgroundImageOpacity, setBackgroundImageOpacity] = useState(100);
    const [visibleSecondaryAspects, setVisibleSecondaryAspects] = useState<Record<string, boolean>>({
        quincunx: true, semisextile: false, semisquare: false,
        sesquiquadrate: false, quintile: false, biquintile: false,
        parallel: false, contraparallel: false,
    });
    
    // New Toolbar Settings
    const [pointerStyle, setPointerStyle] = useState<'solid' | 'dashed' | 'minimal'>('minimal');
    const [pointerThickness, setPointerThickness] = useState(2.5);
    const [pointerOpacity, setPointerOpacity] = useState(0.8);
    const [pointerHead, setPointerHead] = useState<'arrow' | 'circle' | 'diamond' | 'square' | 'none'>('arrow');
    const [pointerTail, setPointerTail] = useState<'arrow' | 'circle' | 'diamond' | 'square' | 'none'>('none');
    const [pointerShowGradLine, setPointerShowGradLine] = useState(true);
    const [pointerFull, setPointerFull] = useState(false);

    const [uiScale, setUiScale] = useState(1.0);
    const [clockScale, setClockScale] = useState(1.15);
    const [celestialSettings, setCelestialSettings] = useState<CelestialSettings>({
        planets: { symbols: true, glyphs: false, colors: true, names: true, namesColors: true, namesAbbr: true },
        signs: { enabled: true, symbols: true, colors: true, abbr: false },
        houses: { enabled: true, format: 'roman' },
        degrees: true,
        degrees_colors: false,
        retrograde: true
    });
    const [aspectSettings, setAspectSettings] = useState<AspectSettings>({
        planets: { symbols: true, glyphs: false, colors: true, names: false, nameColors: false, namesAbbr: true },
        signs: { enabled: false, colors: true },
        houses: { enabled: false },
        aspects: { 
            symbols: true, 
            abbr: false, 
            names: false,
            types: {
                conjunction: true,
                opposition: true,
                trine: true,
                square: true,
                sextile: true
            }
        },
        orb: true,
        transitDates: true
    });
    const [houseCuspsLayout, setHouseCuspsLayout] = useState<'table' | 'cards'>('table');
    const [houseCuspsColumns, setHouseCuspsColumns] = useState<'1col' | '2col'>('2col');
    const [showCuspDegrees, setShowCuspDegrees] = useState(false);
    const [statsLayout, setStatsLayout] = useState<'minimal' | 'ultraslim'>(() => {
        if (typeof window !== 'undefined' && (window.innerHeight < 820 || window.innerWidth <= 1366)) {
            return 'ultraslim';
        }
        return 'minimal';
    });
    const [sectionOrder, setSectionOrder] = useState<('celestial' | 'chronograph' | 'details')[]>(['celestial', 'chronograph', 'details']);
    const [isHeliocentricMode, setIsHeliocentricMode] = useState(false);

    useEffect(() => {
        setSectionOrder(['celestial', 'chronograph', 'details']);
    }, []);

    type PanelId = 'celestial' | 'cusps' | 'aspects' | 'statistics';
    const [isOptionsRailOpen, setIsOptionsRailOpen] = useState(false);

    const [panelStates, setPanelStates] = useState<Record<PanelId, { isOpen: boolean; isCollapsed: boolean; left: number; top: number; zIndex: number }>>(() => {
        const winW = typeof window !== 'undefined' ? window.innerWidth : 1400;
        const aspectsWidth = 245;
        const cuspsWidth = 245;
        return {
            celestial: { isOpen: true, isCollapsed: false, left: 12, top: 60, zIndex: 10 },
            statistics: { isOpen: true, isCollapsed: false, left: 12, top: 460, zIndex: 12 },
            aspects: { isOpen: true, isCollapsed: false, left: winW - aspectsWidth - 12, top: 180, zIndex: 13 },
            cusps: { isOpen: true, isCollapsed: false, left: winW - cuspsWidth - 12, top: 550, zIndex: 11 },
        };
    });

    const celestialMenuRef = useRef<HTMLButtonElement>(null);
    const cuspsMenuRef = useRef<HTMLButtonElement>(null);
    const aspectsMenuRef = useRef<HTMLButtonElement>(null);
    const statisticsMenuRef = useRef<HTMLButtonElement>(null);
    
    const [maxZIndex, setMaxZIndex] = useState(15);

    const focusPanel = (panelId: PanelId) => {
        setMaxZIndex(prev => {
            const nextZ = prev + 1;
            setPanelStates(states => ({
                ...states,
                [panelId]: {
                    ...states[panelId],
                    zIndex: nextZ
                }
            }));
            return nextZ;
        });
    };

    const openPanel = (panelId: PanelId) => {
        const winW = typeof window !== 'undefined' ? window.innerWidth : 1400;
        let sidebarW = 0;
        if (isQuickToolsSidebarOpen) sidebarW += 64;

        setPanelStates(prev => {
            let targetLeft = prev[panelId].left;
            let targetTop = prev[panelId].top;

            if (panelId === 'celestial') {
                targetLeft = 12;
                targetTop = 60;
            } else if (panelId === 'statistics') {
                targetLeft = 12;
                targetTop = 460;
            } else if (panelId === 'aspects') {
                const width = panelWidths.aspects || 245;
                targetLeft = Math.max(12, winW - width - 12 - sidebarW);
                targetTop = 180;
            } else if (panelId === 'cusps') {
                const width = panelWidths.cusps || 245;
                targetLeft = Math.max(12, winW - width - 12 - sidebarW);
                targetTop = 550;
            }

            return {
                ...prev,
                [panelId]: {
                    ...prev[panelId],
                    isOpen: true,
                    left: targetLeft,
                    top: targetTop,
                }
            };
        });
        focusPanel(panelId);
    };

    const dragOffsetRef = useRef<{ 
        x: number, 
        y: number, 
        latestX: number,
        latestY: number,
        panelId: PanelId, 
        windowElement: HTMLElement | null, 
        startLeft: number, 
        startTop: number, 
        rafId: number | null 
    } | null>(null);

    const handlePointerDownHeader = (e: React.PointerEvent, panelId: PanelId) => {
        focusPanel(panelId);
        if (e.button !== 0) return;
        if ((e.target as HTMLElement).closest('button, input, select, a')) return; // DO NOT start drag if clicking a button

        const targetElement = e.currentTarget as HTMLElement;
        const windowElement = targetElement.closest('section');
        if (!windowElement) return;

        const currentLeft = panelStates[panelId].left as number;
        const currentTop = panelStates[panelId].top as number;

        // Turn off transition during drag so movement is 100% immediate
        windowElement.style.transition = 'none';
        windowElement.style.willChange = 'transform';

        dragOffsetRef.current = { 
            x: e.clientX, 
            y: e.clientY, 
            latestX: e.clientX,
            latestY: e.clientY,
            panelId, 
            windowElement,
            startLeft: currentLeft,
            startTop: currentTop,
            rafId: null
        };
        targetElement.setPointerCapture(e.pointerId);
    };

    const handlePointerMoveHeader = (e: React.PointerEvent) => {
        const dragState = dragOffsetRef.current;
        if (!dragState) return;

        // Update latest cursor coordinates synchronously
        dragState.latestX = e.clientX;
        dragState.latestY = e.clientY;

        if (dragState.rafId) return;

        dragState.rafId = requestAnimationFrame(() => {
            if (!dragOffsetRef.current) return;
            const { x, y, latestX, latestY, windowElement } = dragOffsetRef.current;
            const dx = latestX - x;
            const dy = latestY - y;

            if (windowElement) {
                windowElement.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
            }
            if (dragOffsetRef.current) {
                dragOffsetRef.current.rafId = null;
            }
        });
    };

    const handlePointerUpHeader = (e: React.PointerEvent) => {
        const dragState = dragOffsetRef.current;
        if (!dragState) return;

        if (dragState.rafId) {
            cancelAnimationFrame(dragState.rafId);
        }

        const targetElement = e.currentTarget as HTMLElement;
        try {
            targetElement.releasePointerCapture(e.pointerId);
        } catch (_) {}

        const { x, y, latestX, latestY, panelId, windowElement, startLeft, startTop } = dragState;
        const dx = latestX - x;
        const dy = latestY - y;

        let nextLeft = startLeft + dx;
        let nextTop = startTop + dy;

        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;
        const panelWidth = windowElement?.offsetWidth || 280;
        const panelHeight = windowElement?.offsetHeight || 150;

        const minTop = 50;
        const minLeft = 10;
        const maxLeft = Math.max(minLeft, winWidth - panelWidth - 10);
        const maxTop = Math.max(minTop, winHeight - Math.min(panelHeight, winHeight - 60) - 10);

        nextLeft = Math.max(minLeft, Math.min(nextLeft, maxLeft));
        nextTop = Math.max(minTop, Math.min(nextTop, maxTop));

        if (windowElement) {
            windowElement.style.transform = '';
            windowElement.style.transition = '';
            windowElement.style.willChange = '';
        }

        setPanelStates(prev => ({
            ...prev,
            [panelId]: {
                ...prev[panelId],
                left: nextLeft,
                top: nextTop
            }
        }));

        dragOffsetRef.current = null;
    };

    useEffect(() => {
        const handleLayoutAdjustment = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            let sidebarW = 0;
            if (isQuickToolsSidebarOpen) sidebarW += 64;

            if (height < 820 || width <= 1366) {
                setStatsLayout('ultraslim');
            }

            setPanelStates(prev => {
                const aspectsWidth = panelWidths.aspects || 245;
                const cuspsWidth = panelWidths.cusps || 245;

                const newAspectsLeft = Math.max(12, width - aspectsWidth - 12 - sidebarW);
                const newCuspsLeft = Math.max(12, width - cuspsWidth - 12 - sidebarW);

                return {
                    ...prev,
                    celestial: { ...prev.celestial, left: 12, top: 60 },
                    statistics: { ...prev.statistics, left: 12, top: 460 },
                    aspects: { ...prev.aspects, left: newAspectsLeft, top: 180 },
                    cusps: { ...prev.cusps, left: newCuspsLeft, top: 550 },
                };
            });
        };

        handleLayoutAdjustment();
        window.addEventListener('resize', handleLayoutAdjustment);
        return () => window.removeEventListener('resize', handleLayoutAdjustment);
    }, [isQuickToolsSidebarOpen, panelWidths.aspects, panelWidths.cusps]);
    
    // Docas fixas: a largura vem de panelWidths, não de uma lista de painéis arrastáveis.
    const leftPanelWidth = 0;
    const rightPanelWidth = 0;

    const handleCelestialWidthChange = useCallback((width: number) => {
        setPanelWidths(prev => (prev.celestial === width && prev.statistics === width) ? prev : { ...prev, celestial: width, statistics: width });
    }, []);

    const handleCuspsWidthChange = useCallback((width: number) => {
        setPanelWidths(prev => (prev.cusps === width && prev.aspects === width) ? prev : { ...prev, cusps: width, aspects: width });
    }, []);

    const handleAspectsWidthChange = useCallback((width: number) => {
        setPanelWidths(prev => (prev.aspects === width && prev.cusps === width) ? prev : { ...prev, aspects: width, cusps: width });
    }, []);

    const handleStatisticsWidthChange = useCallback((width: number) => {
        setPanelWidths(prev => prev.statistics === width ? prev : { ...prev, statistics: width });
    }, []);

    const handlePanelPositionChange = useCallback((panelId: PanelId, left: number, top: number) => {
        setPanelStates(prev => ({
            ...prev,
            [panelId]: {
                ...prev[panelId],
                left,
                top
            }
        }));
    }, []);

    type DragItem = { type: 'column', id: 'celestial' | 'chronograph' | 'details' } | { type: 'panel', id: PanelId };
    const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);

    const moveSection = (id: string, direction: 'left' | 'right') => {
        setSectionOrder(prev => {
            const currentIndex = prev.indexOf(id as any);
            const newOrder = [...prev];
            if (direction === 'left' && currentIndex > 0) {
                [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];
            } else if (direction === 'right' && currentIndex < prev.length - 1) {
                [newOrder[currentIndex + 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex + 1]];
            }
            return newOrder;
        });
    };

    const handleDragStart = (e: React.DragEvent, id: string, type: 'column' | 'panel' = 'column') => {
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';
        
        const target = e.target as HTMLElement;
        const container = type === 'panel' ? target.closest('.panel-wrapper') : target.closest('.column-wrapper');
        if (container) {
            e.dataTransfer.setDragImage(container, 20, 20);
        }

        setTimeout(() => {
            setDraggedItem({ type, id } as any);
        }, 0);
    };

    const handleDragOver = (e: React.DragEvent, id: string) => {
        e.preventDefault();
        if (draggedItem?.type === 'column' && draggedItem.id !== id) {
            const currentIndex = sectionOrder.indexOf(draggedItem.id as any);
            const targetIndex = sectionOrder.indexOf(id as any);
            
            setSectionOrder(prev => {
                if (prev.indexOf(draggedItem.id as any) === targetIndex) return prev;
                const newOrder = prev.filter(item => item !== draggedItem.id);
                newOrder.splice(targetIndex, 0, draggedItem.id as any);
                return newOrder;
            });
        }
    };


    const handleDragEnd = () => {
        setDraggedItem(null);
    };
    const [showConstellations, setShowConstellations] = useState(true);
    const [customBackgroundImage, setCustomBackgroundImage] = useState<string | null>(null);
    const [activeToolbarMenu, setActiveToolbarMenu] = useState<'pointer' | 'background' | 'display' | 'colors' | 'house' | 'aspects' | 'magnetic' | 'timeRing' | null>(null);
    const toolbarHideTimer = useRef<number | null>(null);
    const toolbarHoveredRef = useRef(false);
    const activeToolbarMenuRef = useRef<string | null>(null);

useEffect(() => {
    activeToolbarMenuRef.current = activeToolbarMenu;
    if (activeToolbarMenu === null && !toolbarHoveredRef.current) {
        if (toolbarHideTimer.current) clearTimeout(toolbarHideTimer.current);
        toolbarHideTimer.current = window.setTimeout(() => {
            if (!toolbarHoveredRef.current && activeToolbarMenuRef.current === null) {
                setToolbarVisible(false);
            }
        }, 2500);
    } else if (activeToolbarMenu !== null) {
        if (toolbarHideTimer.current) {
            clearTimeout(toolbarHideTimer.current);
            toolbarHideTimer.current = null;
        }
    }
}, [activeToolbarMenu]);
    const [toolbarVisible, setToolbarVisible] = useState(true);
    const [timeControlsVisible, setTimeControlsVisible] = useState(true);
    const timeControlsHideTimer = useRef<number | null>(null);
    const timeControlsHoveredRef = useRef(false);
    // Global Display Settings
    const [houseFormat, setHouseFormat] = useState<'arabic' | 'roman'>('roman');
    const [houseSystem, setHouseSystem] = useState<HouseSystem>('porphyry');
    const [houseLineFormat, setHouseLineFormat] = useState<'solid' | 'dashed'>('solid');

    const [activeMenu, setActiveMenu] = useState<WidgetId | null>(null);
    const [zodiacSystem, setZodiacSystem] = useState<'sidereal' | 'tropical'>('tropical');
    const [showTransitChart, setShowTransitChart] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'fullscreen'>('grid');
    const [isFullscreen, setIsFullscreen] = useState(false);

    const handleToggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
            }
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const onFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showMoonPopover, setShowMoonPopover] = useState(false);
    const [showCalendarPanel, setShowCalendarPanel] = useState(false);
    const [calendarConfig, setCalendarConfig] = useState<{ defaultView?: 'year'|'month'|'lunar'; defaultLunarView?: 'annual'|'monthly'|'cycles' }>({});
    const [showChronographMenu, setShowChronographMenu] = useState(false);
    const [activeChronographMenu, setActiveChronographMenu] = useState<'background' | 'display' | 'colors' | null>(null);

    const [timeRingScale, setTimeRingScale] = useState(1.2);
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const [showToolsMenu, setShowToolsMenu] = useState(false);
    const [showEnergyChart, setShowEnergyChart] = useState(false);
    
    // --- Settings Modal State (Main Clock) ---
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [tempDate, setTempDate] = useState('');
    const [tempTime, setTempTime] = useState('');
    const [tempLocationIndex, setTempLocationIndex] = useState<number>(-1);
    const [tempLocationText, setTempLocationText] = useState<string>('');

    // --- Auth State ---
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [username, setUsername] = useState('Astrólogo');
    const [userEmail, setUserEmail] = useState('');
    const [userPlan, setUserPlan] = useState<'free' | 'monthly' | 'lifetime'>(() => {
        try {
            const stored = localStorage.getItem('cronografo_user_plan');
            if (stored === 'monthly' || stored === 'lifetime' || stored === 'free') return stored;
        } catch {}
        return 'free';
    });
    const isFreeTier = !isAdmin && userPlan === 'free';
    const isFreeTrial = isFreeTier;
    const [isAuthChecking, setIsAuthChecking] = useState(true);
    const [showDashboard, setShowDashboard] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showAdminDashboard, setShowAdminDashboard] = useState(false);
    const [showPaymentPlansModal, setShowPaymentPlansModal] = useState(false);
    const [allowedFreeTier, setAllowedFreeTier] = useState(true);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [dashboardTab, setDashboardTab] = useState<'profile' | 'maps' | 'layouts' | 'admin'>('maps');
    const [showLogin, setShowLogin] = useState(false);
    const [showLeadGate, setShowLeadGate] = useState(false);
    const [showLeadCheckoutTrial, setShowLeadCheckoutTrial] = useState(false);
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    const [savedMaps, setSavedMaps] = useState<any[]>(() => {
        try { return JSON.parse(localStorage.getItem('savedMaps') || '[]'); } catch { return []; }
    });
    const [savedLayouts, setSavedLayouts] = useState<any[]>(() => {
        try { return JSON.parse(localStorage.getItem('savedLayouts') || '[]'); } catch { return []; }
    });
    const [showSaveMapModal, setShowSaveMapModal] = useState(false);
    const [showSaveLayoutModal, setShowSaveLayoutModal] = useState(false);
    const [newMapName, setNewMapName] = useState('');
    const [newMapDesc, setNewMapDesc] = useState('');
    const [newLayoutName, setNewLayoutName] = useState('');
    const [newLayoutDesc, setNewLayoutDesc] = useState('');

    const handleSaveMap = () => {
        if (!newMapName.trim()) return;
        if (isFreeTier && savedMaps.length >= 2) {
            setShowSaveMapModal(false);
            setShowPaymentPlansModal(true);
            return;
        }
        const newMap = {
            id: Date.now().toString(),
            name: newMapName,
            description: newMapDesc,
            dateSaved: Date.now(),
            targetDate: currentTime.toISOString(),
            date: currentTime.toISOString(), // for Dashboard
            time: `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`, // for Dashboard
            natalLocation: natalLocation,
            location: location,
            natalDate: natalTime ? natalTime.toISOString() : null,
            layout: {
                celestialTab,
                panelWidths,
                celestialSettings,
                aspectSettings,
                showAspectLines,
                showNatalLines,
                showHouseLines,
                zodiacSystem,
                houseFormat,
            }
        };
        const updated = [...savedMaps, newMap];
        setSavedMaps(updated);
        localStorage.setItem('savedMaps', JSON.stringify(updated));
        if (auth.currentUser) {
            saveMapToFirestore(auth.currentUser.uid, newMap).catch(console.error);
        }
        setShowSaveMapModal(false);
        setNewMapName('');
        setNewMapDesc('');
    };

    const handleSaveLayout = () => {
        if (!newLayoutName.trim()) return;
        const newLayout = {
            id: Date.now().toString(),
            name: newLayoutName,
            description: newLayoutDesc,
            dateSaved: Date.now(),
            layout: {
                celestialTab,
                panelWidths,
                celestialSettings,
                aspectSettings,
                showAspectLines,
                showNatalLines,
                showHouseLines,
                zodiacSystem,
                houseFormat,
                showNeedle,
                showAtmosphere,
                showConstellations,
                showStars,
                showPlanetSpheres,
                pointerStyle,
                pointerThickness,
                pointerOpacity,
            }
        };
        const updated = [...savedLayouts, newLayout];
        setSavedLayouts(updated);
        localStorage.setItem('savedLayouts', JSON.stringify(updated));
        if (auth.currentUser) {
            saveLayoutToFirestore(auth.currentUser.uid, newLayout).catch(console.error);
        }
        setShowSaveLayoutModal(false);
        setNewLayoutName('');
        setNewLayoutDesc('');
    };

    const handleLoadMap = (map: any) => {
        setIsRealTime(false);
        setCurrentTime(new Date(map.targetDate || map.date));
        if (map.location) {
            setLocation(map.location);
        }
        if (map.natalDate) {
            setNatalTime(new Date(map.natalDate));
            if (map.natalLocation) {
                setNatalLocation(map.natalLocation);
            }
        } else {
            setNatalTime(null);
        }
        if (map.layout) {
            handleApplyLayoutProps(map.layout);
        }
        setShowDashboard(false);
        setShowProfileModal(false);
    };

    const handleLoadLayout = (layout: any) => {
        if (layout.layout) {
            handleApplyLayoutProps(layout.layout);
        }
        setShowDashboard(false);
        setShowProfileModal(false);
    };

    const handleApplyLayoutProps = (layoutProps: any) => {
        if (layoutProps.celestialTab) setCelestialTab(layoutProps.celestialTab);
        if (layoutProps.panelWidths) setPanelWidths(layoutProps.panelWidths);
        if (layoutProps.celestialSettings) setCelestialSettings(layoutProps.celestialSettings);
        if (layoutProps.aspectSettings) setAspectSettings(layoutProps.aspectSettings);
        if (layoutProps.showAspectLines !== undefined) setShowAspectLines(layoutProps.showAspectLines);
        if (layoutProps.showNatalLines !== undefined) setShowNatalLines(layoutProps.showNatalLines);
        if (layoutProps.showHouseLines !== undefined) setShowHouseLines(layoutProps.showHouseLines);
        if (layoutProps.zodiacSystem) setZodiacSystem(layoutProps.zodiacSystem);
        if (layoutProps.houseFormat) setHouseFormat(layoutProps.houseFormat);
        if (layoutProps.showNeedle !== undefined) setShowNeedle(layoutProps.showNeedle);
        if (layoutProps.showAtmosphere !== undefined) setShowAtmosphere(layoutProps.showAtmosphere);
        if (layoutProps.showConstellations !== undefined) setShowConstellations(layoutProps.showConstellations);
        if (layoutProps.showStars !== undefined) setShowStars(layoutProps.showStars);
        if (layoutProps.showPlanetSpheres !== undefined) setShowPlanetSpheres(layoutProps.showPlanetSpheres);
        if (layoutProps.pointerStyle) setPointerStyle(layoutProps.pointerStyle);
        if (layoutProps.pointerThickness) setPointerThickness(layoutProps.pointerThickness);
        if (layoutProps.pointerOpacity !== undefined) setPointerOpacity(layoutProps.pointerOpacity);
    };

    const handleDeleteMap = (id: string) => {
        const updated = savedMaps.filter((m: any) => m.id !== id);
        setSavedMaps(updated);
        localStorage.setItem('savedMaps', JSON.stringify(updated));
        if (auth.currentUser) {
            deleteMapFromFirestore(auth.currentUser.uid, id).catch(console.error);
        }
    };

    const handleDeleteLayout = (id: string) => {
        const updated = savedLayouts.filter((l: any) => l.id !== id);
        setSavedLayouts(updated);
        localStorage.setItem('savedLayouts', JSON.stringify(updated));
        if (auth.currentUser) {
            deleteLayoutFromFirestore(auth.currentUser.uid, id).catch(console.error);
        }
    };

    const { trialActive, timeLeft, isExpired, isUnlimited, formattedTimeLeft, resetTrial, startTrial } = useTrialTimer(isAuthenticated, userEmail, isAdmin);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && immersiveMode) {
                setImmersiveMode(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [immersiveMode]);

    useEffect(() => {
        if (theme === 'dark') {
            document.body.classList.remove('light-mode');
        } else {
            document.body.classList.add('light-mode');
            // Auto-disable color settings in light mode for readability
            setCelestialSettings(prev => ({
                ...prev,
                planets: { ...prev.planets, colors: false, namesColors: false },
                signs: { ...prev.signs, colors: false },
                degrees_colors: false
            }));
            setAspectSettings(prev => ({
                ...prev,
                planets: { ...prev.planets, colors: false, nameColors: false },
                signs: { ...prev.signs, colors: false }
            }));
        }
    }, [theme]);

    useEffect(() => {
        testFirestoreConnection();
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setIsAuthenticated(true);
                setUsername(user.displayName || user.email?.split('@')[0] || 'Astrólogo');
                setUserEmail(user.email || '');
                const isUserAdmin = user.email?.toLowerCase() === 'rafael.cm333@gmail.com';
                setIsAdmin(isUserAdmin);
                if (isUserAdmin) {
                    setUserPlan('lifetime');
                }
                syncUserProfile(user).then((profile) => {
                    if (profile?.plan && !isUserAdmin) {
                        setUserPlan(profile.plan);
                        try { localStorage.setItem('cronografo_user_plan', profile.plan); } catch {}
                    }
                }).catch(console.error);

                // Sincronizar mapas do Firestore
                loadMapsFromFirestore(user.uid).then(cloudMaps => {
                    if (cloudMaps && cloudMaps.length > 0) {
                        setSavedMaps(prev => {
                            const existingIds = new Set(prev.map((m: any) => m.id));
                            const merged = [...prev];
                            cloudMaps.forEach((m: any) => {
                                if (!existingIds.has(m.id)) {
                                    merged.push(m);
                                }
                            });
                            localStorage.setItem('savedMaps', JSON.stringify(merged));
                            return merged;
                        });
                    }
                }).catch(console.error);

                // Sincronizar layouts do Firestore
                loadLayoutsFromFirestore(user.uid).then(cloudLayouts => {
                    if (cloudLayouts && cloudLayouts.length > 0) {
                        setSavedLayouts(prev => {
                            const existingIds = new Set(prev.map((l: any) => l.id));
                            const merged = [...prev];
                            cloudLayouts.forEach((l: any) => {
                                if (!existingIds.has(l.id)) {
                                    merged.push(l);
                                }
                            });
                            localStorage.setItem('savedLayouts', JSON.stringify(merged));
                            return merged;
                        });
                    }
                }).catch(console.error);
            } else {
                setIsAuthenticated(false);
                setIsAdmin(false);
            }
            setIsAuthChecking(false);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setIsAuthenticated(false);
            setUserEmail('');
            setUsername('Astrólogo');
            setIsAdmin(false);
            setUserPlan('free');
            try { localStorage.setItem('cronografo_user_plan', 'free'); } catch {}
            setShowProfileModal(false);
            setShowDashboard(false);
            setShowPaymentPlansModal(false);
            setAllowedFreeTier(true);
            setShowLoginModal(false);
        } catch (err) {
            console.error("Logout failed", err);
        }
    };

    const handleSwitchAccount = async () => {
        try {
            await signOut(auth);
            setIsAuthenticated(false);
            setUserEmail('');
            setUsername('Astrólogo');
            setIsAdmin(false);
            setUserPlan('free');
            try { localStorage.setItem('cronografo_user_plan', 'free'); } catch {}
            setShowProfileModal(false);
            setShowDashboard(false);
            setShowPaymentPlansModal(false);
            setAllowedFreeTier(true);
            setShowLoginModal(true);
        } catch (err) {
            console.error("Switch account failed", err);
        }
    };

    // --- Natal Chart State ---
    const [natalTime, setNatalTime] = useState<Date | null>(null);
    const [natalLocation, setNatalLocation] = useState(DEFAULT_LOCATION);
    const [showNatalMapSelector, setShowNatalMapSelector] = useState(false);

    const [isNatalSettingsOpen, setIsNatalSettingsOpen] = useState(false);
    const [tempNatalDate, setTempNatalDate] = useState('');
    const [tempNatalTime, setTempNatalTime] = useState('');
    const [tempNatalLocationIndex, setTempNatalLocationIndex] = useState<number>(-1);
    const [tempNatalLocationText, setTempNatalLocationText] = useState<string>('');
    const [natalDateDisplay, setNatalDateDisplay] = useState('');
    const [natalTimeDisplay, setNatalTimeDisplay] = useState('');

    useEffect(() => {
        if (natalTime) {
            setCelestialTab('natal');
        } else {
            setCelestialTab('transit');
        }
    }, [natalTime]);

    // --- Data Calculation ---
    const celestialData = useCelestialData(currentTime, location, visiblePlanets, houseSystem, zodiacSystem);
    const natalData = useCelestialData(natalTime, natalLocation, visibleNatalPlanets, houseSystem, zodiacSystem);
    const seasonInfo = useMemo(() => {
        const latitudeSouth = location.latitude < 0;
        const info = getSeasonInfo(currentTime, latitudeSouth);
        const seasonData: Record<string, { color: string; icon: any }> = {
            'Verão': { color: 'text-amber-400', icon: UI_ICONS.SunIcon },
            'Outono': { color: 'text-orange-400', icon: UI_ICONS.CloudIcon },
            'Inverno': { color: 'text-blue-300', icon: UI_ICONS.SnowIcon },
            'Primavera': { color: 'text-emerald-400', icon: UI_ICONS.SparklesIcon }
        };
        const data = seasonData[info.name] || { color: 'text-amber-400', icon: UI_ICONS.SunIcon };
        return { ...info, ...data };
    }, [currentTime, location.latitude]);

    const seasonIngresses = useMemo(() => {
        const latitudeSouth = location.latitude < 0;
        return getSeasonIngresses(currentTime.getFullYear(), latitudeSouth);
    }, [currentTime.getFullYear(), location.latitude]);
    
    // --- Refs for Continuous Press ---
    const intervalRef = useRef<number | null>(null);
    const timeoutRef = useRef<number | null>(null);

    // --- Calculate Transit-Natal Aspects ---
    const transitNatalAspects = useMemo(() => {
        if (!natalTime || !natalData || natalData.currentTime.getTime() === 0) return [];
        const transitBodies = getBodiesFromData(celestialData, visiblePlanets);
        const natalBodies = getBodiesFromData(natalData, visibleNatalPlanets);
        return calculateTransitNatalAspects(transitBodies, natalBodies);
    }, [celestialData, natalData, natalTime, visiblePlanets, visibleNatalPlanets]);


    // --- Computed Data for Views (Filtered Aspects & Ghost Planets) ---
    const { filteredAspects, panelAspects, ghostPlanets } = useMemo(() => {
        // Aspectos para o PAINEL — sempre todos, independente dos toggles visuais
        let allAspectSource = [
            ...celestialData.aspects,
            ...(transitNatalAspects || [])
        ].filter(aspect => {
            const type = aspect.type as keyof typeof aspectSettings.aspects.types;
            return aspectSettings.aspects.types[type] !== false;
        });

        // Aspectos para o CRONÓGRAFO — controlados pelos toggles
        let activeAspectSource: typeof transitNatalAspects = [];
        if (showAspectLines) {
            activeAspectSource = [...activeAspectSource, ...celestialData.aspects];
        }
        if (showNatalLines) {
            activeAspectSource = [...activeAspectSource, ...transitNatalAspects];
        }

        // Se há aspectos selecionados via card, garantir que entrem
        // no activeAspectSource mesmo que o toggle visual esteja desligado
        if (selectedAspects.length > 0) {
            const allSource = [
                ...celestialData.aspects,
                ...transitNatalAspects
            ];
            const missingSelected = allSource.filter((a: any) =>
                selectedAspects.includes(a.id) &&
                !activeAspectSource.find((b: any) => b.id === a.id)
            );
            activeAspectSource = [...activeAspectSource, ...missingSelected];
        }

        // Filter by aspect type from settings
        activeAspectSource = activeAspectSource.filter(aspect => {
            const type = aspect.type as keyof typeof aspectSettings.aspects.types;
            return aspectSettings.aspects.types[type] !== false;
        });

        if (selectedPlanets.length === 0) {
            return { filteredAspects: activeAspectSource, panelAspects: allAspectSource, ghostPlanets: [] };
        }

        const stripNatal = (id: string) => id.startsWith('natal_') ? id.replace('natal_', '') : id;
        const hasSelected = (id: string) => selectedPlanets.some(sid => stripNatal(sid) === id);

        const relevantAspects = activeAspectSource.filter(aspect => 
            hasSelected(aspect.body1.id) || hasSelected(aspect.body2.id)
        );

        const ghosts = new Set<string>();
        relevantAspects.forEach(aspect => {
            if (aspect.isNatal) {
                if (hasSelected(aspect.body1.id) && !hasSelected(aspect.body2.id)) {
                    ghosts.add(aspect.body2.id);
                }
            } else {
                if (hasSelected(aspect.body1.id) && !hasSelected(aspect.body2.id)) {
                    ghosts.add(aspect.body2.id);
                }
                if (hasSelected(aspect.body2.id) && !hasSelected(aspect.body1.id)) {
                    ghosts.add(aspect.body1.id);
                }
            }
        });

        return { filteredAspects: relevantAspects, panelAspects: allAspectSource, ghostPlanets: Array.from(ghosts) };
    }, [celestialData.aspects, transitNatalAspects, showAspectLines, showNatalLines, selectedPlanets, selectedAspects, aspectSettings.aspects.types]);

    const { highlightedPlanetsFromAspects, highlightedHousesFromAspects } = useMemo(() => {
        const planets = new Set<string>();
        const houses = new Set<number>();
        
        if (selectedAspects.length > 0) {
            filteredAspects.forEach(aspect => {
                if (selectedAspects.includes(aspect.id)) {
                    planets.add(aspect.body1.id);
                    planets.add(aspect.body2.id);
                    houses.add(aspect.body1.house);
                    houses.add(aspect.body2.house);
                }
            });
        }
        return { 
            highlightedPlanetsFromAspects: Array.from(planets), 
            highlightedHousesFromAspects: Array.from(houses) 
        };
    }, [selectedAspects, filteredAspects]);

    const exportData = useMemo(() => {
        const isNatal = celestialTab === 'natal' && natalTime;
        const currentCelestialData = isNatal ? natalData : celestialData;
        const currentAspects = filteredAspects || [];
        
        return {
            currentTime: currentTime,
            location: location,
            celestialData: currentCelestialData,
            seasonInfo: seasonInfo,
            sunriseTime: currentCelestialData?.sunriseTime || '',
            sunsetTime: currentCelestialData?.sunsetTime || '',
            moonriseTime: currentCelestialData?.moonriseTime || '',
            moonsetTime: currentCelestialData?.moonsetTime || '',
            moonPhase: currentCelestialData?.moonPhase ? getMoonPhaseInfo(currentCelestialData.moonPhase) : { name: '', icon: '' },
            moonPhaseValue: currentCelestialData?.moonPhase || 0,
            retrogradeStatus: currentCelestialData?.retrogradeStatus || {},
            stationaryStatus: currentCelestialData?.stationaryStatus || {},
            housePlacements: currentCelestialData?.housePlacements || {},
            houseCusps: currentCelestialData?.houseCusps || [],
            filteredAspects: currentAspects,
            clockRef: clockRef,
            showAspectLines: showAspectLines,
            setShowAspectLines: setShowAspectLines,
            theme: theme,
            onSetTheme: setTheme,
            showSeasonsRing: showSeasonsRing,
            setShowSeasonsRing: setShowSeasonsRing,
            showTimeRing: showTimeRing,
            setShowTimeRing: setShowTimeRing,
            showConstellations: showConstellations,
            setShowConstellations: setShowConstellations,
            isFreeTier: isFreeTier,
            onOpenPaymentPlans: () => setShowPaymentPlansModal(true)
        };
    }, [
        celestialTab, natalTime, natalData, celestialData,
        currentTime, location, seasonInfo, filteredAspects,
        showAspectLines, setShowAspectLines, theme, setTheme,
        showSeasonsRing, setShowSeasonsRing, showTimeRing,
        setShowTimeRing, showConstellations, setShowConstellations,
        isFreeTier
    ]);

    // --- Time Loop for Smooth Animation ---
    useEffect(() => {
        let intervalId: number;

        if (isRealTime) {
            intervalId = window.setInterval(() => {
                setCurrentTime(new Date());
            }, 1000);
        }

        return () => {
            if (intervalId) window.clearInterval(intervalId);
        };
    }, [isRealTime]);

    // Limpar seleções de aspectos com IDs que não existem mais
    // (evita que IDs obsoletos travem a visualização ao mudar de data)
    useEffect(() => {
        if (selectedAspects.length > 0) {
            const validIds = new Set([
                ...celestialData.aspects.map((a: any) => a.id),
                ...transitNatalAspects.map((a: any) => a.id)
            ]);
            const stillValid = selectedAspects.filter((id: string) => validIds.has(id));
            if (stillValid.length !== selectedAspects.length) {
                setSelectedAspects(stillValid);
            }
        }
    }, [celestialData.aspects, transitNatalAspects, selectedAspects]);

    // --- Handlers ---
const handlePlanetClick = useCallback((id: string) => {
    if ((isFreeTier || isFreeTrial) && ['lilith', 'northNode', 'southNode', 'chiron', 'ceres', 'pallas', 'juno', 'vesta', 'partOfFortune'].includes(id)) {
        setShowPaymentPlansModal(true);
        return;
    }
    const effectiveId = celestialTab === 'natal' && natalTime ? `natal_${id}` : id;
    setSelectedPlanets(prev => 
        prev.includes(effectiveId) ? prev.filter(p => p !== effectiveId) : [...prev, effectiveId]
    );
}, [celestialTab, natalTime, isFreeTier, isFreeTrial]);

    const handlePlanetRightClick = (id: string) => {
        if ((isFreeTier || isFreeTrial) && ['lilith', 'northNode', 'southNode', 'chiron', 'ceres', 'pallas', 'juno', 'vesta', 'partOfFortune'].includes(id)) {
            setShowPaymentPlansModal(true);
            return;
        }
        if (celestialTab === 'natal' && natalTime) {
            setVisibleNatalPlanets(prev => ({
                ...prev,
                [id]: !prev[id]
            }));
        } else {
            setVisiblePlanets(prev => ({
                ...prev,
                [id]: !prev[id]
            }));
        }
    };

    const handleAspectClick = useCallback((id: string) => {
        setSelectedAspects(prev => 
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        );
    }, []);

    const handleHouseClick = useCallback((num: number) => {
        setSelectedHouses(prev => {
            const isSelecting = !prev.includes(num);
            // Atualizar planetas junto com casas no mesmo callback
            // para evitar leitura de closure stale de selectedHouses
            setSelectedPlanets(pPrev => {
                const planetsInHouse = Object.entries(celestialData.housePlacements)
                    .filter(([_, houseNum]) => houseNum === num)
                    .map(([planetId]) => planetId);
                if (isSelecting) {
                    return [...new Set([...pPrev, ...planetsInHouse])];
                } else {
                    return pPrev.filter(p => !planetsInHouse.includes(p));
                }
            });
            return prev.includes(num) ? prev.filter(h => h !== num) : [...prev, num];
        });
    }, [celestialData.housePlacements]);

    const handleClearSelections = useCallback(() => {
        setSelectedPlanets([]);
        setSelectedAspects([]);
        setSelectedHouses([]);
    }, []);

    const handleClockClick = useCallback(() => {
        if (!showCalendarPanel) setCalendarConfig({});
        setShowCalendarPanel(prev => !prev);
    }, [showCalendarPanel]);

    const handleLunarCalendarClick = useCallback(() => {
        setCalendarConfig({ defaultView: 'lunar', defaultLunarView: 'cycles' });
        setShowCalendarPanel(true);
    }, []);

    const handleSolarCalendarClick = useCallback(() => {
        setCalendarConfig({ defaultView: 'solar' });
        setShowCalendarPanel(true);
    }, []);

    const togglePlay = () => {
        if (!isRealTime) {
            setCurrentTime(new Date());
            setIsRealTime(true);
        } else {
            setIsRealTime(false);
        }
    };

    const stepTime = useCallback((amount: number) => {
        setIsRealTime(false);
        setCurrentTime(prev => {
            const newTime = new Date(prev);
            switch (timeStep) {
                case 'sec':
                    newTime.setSeconds(prev.getSeconds() + amount);
                    break;
                case 'min':
                    newTime.setMinutes(prev.getMinutes() + amount);
                    break;
                case 'hour':
                    newTime.setHours(prev.getHours() + amount);
                    break;
                case 'day':
                    newTime.setDate(prev.getDate() + amount);
                    break;
                case 'month':
                    newTime.setMonth(prev.getMonth() + amount);
                    break;
                case 'year':
                    newTime.setFullYear(prev.getFullYear() + amount);
                    break;
            }
            return newTime;
        });
    }, [timeStep]);

    const handleTimeChangeStart = (direction: number) => {
        setIsRealTime(false);
        const amount = direction * speedMultiplier;
        stepTime(amount);
        timeoutRef.current = window.setTimeout(() => {
            intervalRef.current = window.setInterval(() => {
                stepTime(amount);
            }, 50);
        }, 1000);
    };

    const handleTimeChangeEnd = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    const handleTimeControlsMouseEnter = () => {
        timeControlsHoveredRef.current = true;
        if (timeControlsHideTimer.current) clearTimeout(timeControlsHideTimer.current);
        setTimeControlsVisible(true);
    };

    const handleTimeControlsMouseLeave = () => {
        timeControlsHoveredRef.current = false;
        if (timeControlsHideTimer.current) clearTimeout(timeControlsHideTimer.current);
        timeControlsHideTimer.current = window.setTimeout(() => {
            if (!timeControlsHoveredRef.current) {
                setTimeControlsVisible(false);
            }
        }, 2500);
    };

    // --- Settings Logic ---
    const openSettings = () => {
        setIsRealTime(false);
        const year = currentTime.getFullYear();
        const month = String(currentTime.getMonth() + 1).padStart(2, '0');
        const day = String(currentTime.getDate()).padStart(2, '0');
        setTempDate(`${year}-${month}-${day}`);
        const hours = String(currentTime.getHours()).padStart(2, '0');
        const minutes = String(currentTime.getMinutes()).padStart(2, '0');
        setTempTime(`${hours}:${minutes}`);
        const locIndex = BRAZIL_CAPITALS.findIndex(cap => 
            Math.abs(cap.latitude - location.latitude) < 0.01 && 
            Math.abs(cap.longitude - location.longitude) < 0.01
        );
        setTempLocationIndex(locIndex !== -1 ? locIndex : 24);
        setTempLocationText(location.displayName || '');
        setIsSettingsOpen(true);
    };

    const saveSettings = () => {
        if (tempDate && tempTime) {
            const [year, month, day] = tempDate.split('-').map(Number);
            const [hours, minutes] = tempTime.split(':').map(Number);
            const newDate = new Date(year, month - 1, day, hours, minutes, 0);
            setCurrentTime(newDate);
        }
        // Verificar se há localização pendente do novo input de busca
        const pending = (window as any).__pendingLocation;
        if (pending) {
            setLocation({
                latitude: pending.latitude,
                longitude: pending.longitude,
                displayName: pending.displayName
            });
            delete (window as any).__pendingLocation;
        } else if (tempLocationIndex >= 0 && tempLocationIndex < BRAZIL_CAPITALS.length) {
            // Fallback para capitais brasileiras se não houve busca
            const selectedCap = BRAZIL_CAPITALS[tempLocationIndex];
            setLocation({
                latitude: selectedCap.latitude,
                longitude: selectedCap.longitude,
                displayName: selectedCap.name
            });
        }
        setIsSettingsOpen(false);
    };

   const openNatalSettings = () => {
    const initTime = natalTime || new Date();
    const year = initTime.getFullYear();
    const month = String(initTime.getMonth() + 1).padStart(2, '0');
    const day = String(initTime.getDate()).padStart(2, '0');
    setTempNatalDate(`${year}-${month}-${day}`);
    setNatalDateDisplay(`${day}/${month}/${year}`); // ← adiciona
    const hours = String(initTime.getHours()).padStart(2, '0');
    const minutes = String(initTime.getMinutes()).padStart(2, '0');
    setTempNatalTime(`${hours}:${minutes}`);
    setNatalTimeDisplay(`${hours}:${minutes}`);     // ← adiciona
    const locToUse = natalTime ? natalLocation : location;
    const locIndex = BRAZIL_CAPITALS.findIndex(cap => 
        Math.abs(cap.latitude - locToUse.latitude) < 0.01 && 
        Math.abs(cap.longitude - locToUse.longitude) < 0.01
    );
    setTempNatalLocationIndex(locIndex !== -1 ? locIndex : 24);
        
        // Inicializar displays
        if (natalTime) {
            const y = initTime.getFullYear();
            const m = String(initTime.getMonth() + 1).padStart(2, '0');
            const d = String(initTime.getDate()).padStart(2, '0');
            setNatalDateDisplay(`${d}/${m}/${y}`);
            const h = String(initTime.getHours()).padStart(2, '0');
            const min = String(initTime.getMinutes()).padStart(2, '0');
            setNatalTimeDisplay(`${h}:${min}`);
        } else {
            setNatalDateDisplay('');
            setNatalTimeDisplay('');
        }
        setTempNatalLocationText(natalTime ? natalLocation.displayName || '' : '');
        setIsNatalSettingsOpen(true);
    };

    const saveNatalSettings = () => {
        if (tempNatalDate && tempNatalTime) {
            const [year, month, day] = tempNatalDate.split('-').map(Number);
            const [hours, minutes] = tempNatalTime.split(':').map(Number);
            const newDate = new Date(year, month - 1, day, hours, minutes, 0);
            setNatalTime(newDate);
        }
        // Verificar localização pendente do novo input de busca
        const pending = (window as any).__pendingNatalLocation;
        if (pending) {
            setNatalLocation({
                latitude: pending.latitude,
                longitude: pending.longitude,
                displayName: pending.displayName
            });
            delete (window as any).__pendingNatalLocation;
        } else if (tempNatalLocationIndex >= 0 && tempNatalLocationIndex < BRAZIL_CAPITALS.length) {
            // Fallback para capitais brasileiras
            const selectedCap = BRAZIL_CAPITALS[tempNatalLocationIndex];
            setNatalLocation({
                latitude: selectedCap.latitude,
                longitude: selectedCap.longitude,
                displayName: selectedCap.name
            });
        }
        setShowNatalLines(true);
        setShowAspectLines(false);
        setIsNatalSettingsOpen(false);
    };
    
    // --- Toggle Handlers ---
    const handleToggleAspectLines = useCallback(() => {
        setShowAspectLines(prev => !prev);
    }, []);

    const handleToggleNatalLines = useCallback(() => {
        if (!natalTime) return;
        setShowNatalLines(prev => !prev);
    }, [natalTime]);

    // --- Menu Auto-Close Logic ---
    const menuRefs = {
        profile: useRef<HTMLDivElement>(null),
        chronograph: useRef<HTMLDivElement>(null),
        options: useRef<HTMLDivElement>(null),
        eclipses: useRef<HTMLDivElement>(null),
        toolbar: useRef<HTMLDivElement>(null),
        calendar: useRef<HTMLDivElement>(null),
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            
            // Helper to check if click is inside a ref
            const isInside = (ref: React.RefObject<HTMLDivElement>) => ref.current && ref.current.contains(target);

            if (showProfileMenu && !isInside(menuRefs.profile)) {
                setShowProfileMenu(false);
            }
            if (showChronographMenu && !isInside(menuRefs.chronograph)) {
                setShowChronographMenu(false);
                setActiveChronographMenu(null);
            }
            if (showOptionsMenu && !isInside(menuRefs.options)) {
                setShowOptionsMenu(false);
            }
            if (showEclipseModal && !isInside(menuRefs.eclipses)) {
                setShowEclipseModal(false);
            }
            if (activeToolbarMenu && !isInside(menuRefs.toolbar)) {
                const clickedEl = event.target as HTMLElement;
                if (!clickedEl.closest('[data-submenu]')) {
                    setActiveToolbarMenu(null);
                }
            }
            
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showProfileMenu, showChronographMenu, showOptionsMenu, showEclipseModal, activeToolbarMenu, showCalendarPanel]);

    const toggleProfileMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveToolbarMenu(null);
        setShowChronographMenu(false);
        setShowOptionsMenu(false);
        setShowProfileMenu(!showProfileMenu);
    };

    const toggleChronographMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveToolbarMenu(null);
        setShowProfileMenu(false);
        setShowOptionsMenu(false);
        setActiveChronographMenu(null);
        setShowChronographMenu(!showChronographMenu);
    };

    const toggleOptionsMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveToolbarMenu(null);
        setShowProfileMenu(false);
        setShowChronographMenu(false);
        setShowToolsMenu(false);
        setShowOptionsMenu(!showOptionsMenu);
    };

    const handleClearNatal = (e: React.MouseEvent) => {
        e.stopPropagation();
        setNatalTime(null);
        setShowNatalLines(false);
    };

    // Gradient Background for the entire app
    const bgClass = "bg-brand-dark";


    const renderContent = () => {
        if (isAuthChecking) {
            return (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-purple"></div>
                </div>
            );
        }

        if (!isAuthenticated && !trialActive) {
            return (
                <LandingPage 
                    onLoginSuccess={(user) => {
                        setIsAuthenticated(true);
                        resetTrial();
                        if (user?.username) setUsername(user.username);
                        if (user?.email) setUserEmail(user.email);
                        setIsAdmin(user?.email?.toLowerCase() === 'rafael.cm333@gmail.com' || !!user?.isAdmin);
                    }} 
                    onExploreGuest={() => {
                        startTrial();
                    }}
                />
            );
        }

        return (
            <>
                {/* Modal de Login / Criar Conta / Trocar Conta */}
                {showLoginModal && (
                    <LoginModal
                        isOpen={showLoginModal}
                        onClose={() => setShowLoginModal(false)}
                        onSuccess={(u) => {
                            setIsAuthenticated(true);
                            resetTrial();
                            if (u.username) setUsername(u.username);
                            if (u.email) setUserEmail(u.email);
                            setIsAdmin(u.email?.toLowerCase() === 'rafael.cm333@gmail.com' || !!u.isAdmin);
                            setShowLoginModal(false);
                            setShowPaymentPlansModal(false);
                        }}
                    />
                )}

                {/* Modal de Opções de Pagamento (Mensal R$100/mês, Vitalício & Gratuito Opcional) */}
                {showPaymentPlansModal && !showLoginModal && (
                    <PaymentPlansModal
                        isOpen={showPaymentPlansModal && !showLoginModal}
                        onClose={() => setShowPaymentPlansModal(false)}
                        onSelectPlan={(plan) => {
                            setUserPlan(plan);
                            try { localStorage.setItem('cronografo_user_plan', plan); } catch {}
                            if (auth.currentUser && (plan === 'free' || plan === 'monthly' || plan === 'lifetime')) {
                                updateUserPlanInFirestore(auth.currentUser.uid, plan).catch(console.error);
                            }
                            if (plan === 'free') {
                                setShowPaymentPlansModal(false);
                            }
                        }}
                        reason="user_opened"
                        userEmail={userEmail}
                        username={username}
                        isAuthenticated={isAuthenticated}
                        onSwitchAccount={handleSwitchAccount}
                        onLogout={handleLogout}
                    />
                )}
            {(showProfileModal || showDashboard) && (
                <ProfileModal 
                    isOpen={showProfileModal || showDashboard}
                    onClose={() => {
                        setShowProfileModal(false);
                        setShowDashboard(false);
                    }}
                    isAdmin={isAdmin}
                    userPlan={userPlan}
                    username={username}
                    userEmail={userEmail}
                    natalDate={tempNatalDate || (natalTime ? natalTime.toISOString().split('T')[0] : '')}
                    natalTime={tempNatalTime || (natalTime ? natalTime.toTimeString().split(' ')[0].substring(0, 5) : '')}
                    natalLocationName={natalLocation?.displayName || (tempNatalLocationText || 'São Paulo, Brasil')}
                    onEditNatal={() => {
                        setIsNatalSettingsOpen(true);
                        setShowProfileModal(false);
                        setShowDashboard(false);
                    }}
                    onOpenAdminDashboard={() => {
                        setShowProfileModal(false);
                        setShowDashboard(false);
                        setShowAdminDashboard(true);
                    }}
                    onLogout={handleLogout}
                    onSwitchAccount={handleSwitchAccount}
                    onOpenPaymentPlans={() => setShowPaymentPlansModal(true)}
                    savedMaps={savedMaps}
                    onLoadMap={handleLoadMap}
                    onDeleteMap={handleDeleteMap}
                    onSaveCurrentMap={() => setShowSaveMapModal(true)}
                    savedLayouts={savedLayouts}
                    onLoadLayout={handleLoadLayout}
                    onDeleteLayout={handleDeleteLayout}
                    onSaveCurrentLayout={() => setShowSaveLayoutModal(true)}
                    currentPreferences={{
                        theme,
                        zodiacSystem,
                        houseFormat,
                        showAtmosphere,
                        showNeedle,
                        showConstellations,
                        showStars
                    }}
                    onUpdatePreferences={(prefs: any) => {
                        if (prefs.theme) setTheme(prefs.theme);
                        if (prefs.zodiacSystem) setZodiacSystem(prefs.zodiacSystem);
                        if (prefs.houseFormat) setHouseFormat(prefs.houseFormat);
                        if (prefs.showAtmosphere !== undefined) setShowAtmosphere(prefs.showAtmosphere);
                        if (prefs.showNeedle !== undefined) setShowNeedle(prefs.showNeedle);
                        if (prefs.showConstellations !== undefined) setShowConstellations(prefs.showConstellations);
                        if (prefs.showStars !== undefined) setShowStars(prefs.showStars);
                    }}
                    onUpdateUsername={(newName: string) => setUsername(newName)}
                />
            )}
            <main className={`h-full min-h-0 flex-grow flex overflow-hidden relative bg-transparent ${immersiveMode ? '' : 'p-1.5 gap-1.5'}`}>
                {/* Left and Right side panels have been transformed into floating windows */}

                {/* Chronograph Section */}
                {(() => {
                    const isLeftDockOpen = panelStates.celestial.isOpen || panelStates.statistics.isOpen;
                    const isRightDockOpen = panelStates.aspects.isOpen || panelStates.cusps.isOpen;

                    const unifiedLeftDockWidth = Math.max(200, panelWidths.celestial || 220, panelWidths.statistics || 220);
                    const leftDockPixelWidth = Math.max(180, Math.ceil(unifiedLeftDockWidth * uiScale));

                    const unifiedRightDockWidth = Math.max(240, panelWidths.aspects || 245, panelWidths.cusps || 245);
                    const rightDockPixelWidth = Math.max(200, Math.ceil(unifiedRightDockWidth * uiScale));

                    const DOCK_MARGIN = 16;
                    const screenLeft = !immersiveMode && isLeftDockOpen ? (12 + leftDockPixelWidth + DOCK_MARGIN) : DOCK_MARGIN;
                    const rightDockBaseFromScreenRight = isQuickToolsSidebarOpen ? 64 : 8;
                    const screenRight = !immersiveMode ? (rightDockBaseFromScreenRight + (isRightDockOpen ? rightDockPixelWidth + DOCK_MARGIN : DOCK_MARGIN)) : DOCK_MARGIN;

                    const mainPadX = immersiveMode ? 0 : 6;
                    const sidebarFlexWidth = isQuickToolsSidebarOpen ? 56 : 0;
                    const leftOccupied = Math.max(0, screenLeft - mainPadX);
                    const rightOccupied = Math.max(0, screenRight - (sidebarFlexWidth + mainPadX));
                    const bottomOccupied = !immersiveMode ? 140 : 0;
                    const topOccupied = !immersiveMode ? 40 : 0;

                    return (
                        <section 
                            className="flex-1 relative flex flex-col overflow-visible"
                        >

                            <div className="flex-1 min-h-0 flex flex-col rounded-3xl border border-brand-border/10 shadow-sm overflow-visible relative ring-1 ring-white/5 bg-transparent">
                                {/* Drag Handle (Hidden but functional) */}
                                <div 
                                    draggable 
                                    onDragStart={(e) => handleDragStart(e, 'chronograph')}
                                    onDragEnd={handleDragEnd}
                                    className="hidden"
                                />

                                {/* Background Image */}
                                {customBackgroundImage && (
                                    <div 
                                        className="absolute inset-0 z-0 opacity-40 pointer-events-none bg-cover bg-center"
                                        style={{ 
                                            backgroundImage: `url(${customBackgroundImage})`,
                                            mixBlendMode: 'overlay'
                                        }}
                                    />
                                )}

                                <div 
                                    className="absolute inset-0 z-0 flex items-center justify-center overflow-visible bg-transparent transition-all duration-300 ease-out pointer-events-none"
                                    style={{
                                        left: `${leftOccupied}px`,
                                        right: `${rightOccupied}px`,
                                        top: `${topOccupied}px`,
                                        bottom: `${bottomOccupied}px`,
                                    }}
                                    onClick={() => {
                                        if (immersiveMode) {
                                            setImmersiveMode(false);
                                        }
                                    }}
                                >
                                    <div 
                                        ref={clockRef} 
                                        className="sidereal-clock-capture-container relative flex items-center justify-center overflow-visible pointer-events-auto w-full h-full max-w-full max-h-full" 
                                        style={{ 
                                            aspectRatio: '1 / 1',
                                            transform: `scale(${clockScale})`, 
                                            transformOrigin: 'center center' 
                                        }}
                                    >
                                        {isHeliocentricMode ? (
                                            <HeliocentricView
                                                celestialData={celestialData}
                                                visiblePlanets={visiblePlanets}
                                                theme={theme}
                                            />
                                        ) : (
                                            <SiderealClock 
                                                celestialData={celestialData}
                                                natalData={natalTime ? natalData : undefined}
                                                filteredAspects={filteredAspects}
                                                ghostPlanets={ghostPlanets}
                                                visiblePlanets={visiblePlanets}
                                                visibleNatalPlanets={natalTime ? visibleNatalPlanets : undefined}
                                                selectedPlanets={selectedPlanets}
                                                selectedAspects={selectedAspects}
                                                selectedHouses={selectedHouses}
                                                hoveredPlanet={hoveredPlanet}
                                                hoveredAspect={hoveredAspect}
                                                hoveredHouse={hoveredHouse}
                                                onPlanetClick={handlePlanetClick}
                                                onAspectClick={handleAspectClick}
                                                onHouseClick={handleHouseClick}
                                                setHoveredHouse={setHoveredHouse}
                                                planetSize={clockPlanetSize}
                                                zodiacSignSize={zodiacSignSize}
                                                termsGlyphSize={termsGlyphSize}
                                                decanGlyphSize={decanGlyphSize}
                                                graduationRingWidth={graduationRingWidth}
                                                zodiacRingScale={zodiacRingScale}
                                                seasonsRingScale={seasonsRingScale}
                                                decanRingScale={decanRingScale}
                                                termsRingScale={termsRingScale}
                                                ringLineColor={ringLineColor}
                                                showPlanetSpheres={showPlanetSpheres}
                                                showDegreeLabels={showDegreeLabels}
                                                degreeLabelSize={degreeLabelSize}
                                                degreeLabelPosition={degreeLabelPosition}
                                                degreeLabelFormat={degreeLabelFormat}
                                                showAspectLines={showAspectLines}
                                                showNatalLines={showNatalLines}
                                                isNatalMode={!!natalTime}
                                                showNeedle={showNeedle}
                                                isZodiacFixed={isZodiacFixed}
                                                locationName={location.displayName}
                                                showAtmosphere={showAtmosphere}
                                                houseFormat={houseFormat}
                                                houseLineFormat={houseLineFormat}
                                                showHouseLines={showHouseLines}
                                                showHouseMarkers={showHouseMarkers}
                                                showMcIcArrows={showMcIcArrows}
                                                showTimeRing={showTimeRing}
                                                showOrbits={showOrbits}
                                                allPlanetsSameOrbit={allPlanetsSameOrbit}
                                                planetColorMode={planetColorMode}
                                                natalColorMode={natalColorMode}
                                                showStars={showStars}
                                                showSeasonsRing={showSeasonsRing}
                                                showDecanRing={showDecanRing}
                                                showTermsRing={showTermsRing}
                                                zodiacColorMode={zodiacColorMode}
                                                highlightFilter={highlightFilter}
                                                showSignLines={showSignLines}
                                                showSignColors={showSignColors}
                                                signLineThickness={signLineThickness}
                                                signLineOpacity={signLineOpacity}
                                                pointerStyle={pointerStyle}
                                                pointerShowGradLine={pointerShowGradLine}
                                                pointerFull={pointerFull}
                                                pointerThickness={pointerThickness}
                                                pointerOpacity={pointerOpacity}
                                                pointerHead={pointerHead}
                                                pointerTail={pointerTail}
                                                showConstellations={showConstellations}
                                                customBackgroundImage={customBackgroundImage}
                                                showMagneticField={showMagneticField}
                                                magneticFieldSize={magneticFieldSize}
                                                magneticFieldOpacity={magneticFieldOpacity}
                                                seasonIngresses={seasonIngresses}
                                                timeRingScale={timeRingScale}
                                                theme={theme}
                                                onClockClick={handleClockClick}
                                                houseLineThickness={houseLineThickness}
                                                houseLineOpacity={houseLineOpacity}
                                                houseLineColor={houseLineColor}
                                                mainHouseLineThickness={mainHouseLineThickness}
                                                mainHouseLineOpacity={mainHouseLineOpacity}
                                                mainHouseLineColor={mainHouseLineColor}
                                                houseMarkerRingColor={houseMarkerRingColor}
                                                houseMarkerRingOpacity={houseMarkerRingOpacity}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {!immersiveMode && (
                                <TimeControls 
                                    currentTime={currentTime}
                                    onTimeChange={(newTime) => {
                                        setIsRealTime(false);
                                        setCurrentTime(newTime);
                                    }}
                                    isRealTime={isRealTime}
                                    onSetRealTime={setIsRealTime}
                                    speedMultiplier={speedMultiplier}
                                    onSpeedMultiplierChange={setSpeedMultiplier}
                                    timeStep={timeStep}
                                    onTimeStepChange={setTimeStep}
                                    isZodiacFixed={isZodiacFixed}
                                    onToggleZodiacFixed={() => setIsZodiacFixed(!isZodiacFixed)}
                                    onToggleFullscreen={() => setImmersiveMode(!immersiveMode)}
                                    isFullscreen={immersiveMode}
                                    onOpenSettings={() => { setCalendarConfig({}); setShowCalendarPanel(true); }}
                                    onOpenNatalSettings={() => setIsNatalSettingsOpen(true)}
                                    onOpenLunarCalendar={handleLunarCalendarClick}
                                    celestialData={celestialData}
                                    location={location}
                                    theme={theme}
                                    isQuickToolsSidebarOpen={isQuickToolsSidebarOpen}
                                    isOptionsRailOpen={isOptionsRailOpen}
                                    leftDockOffset={screenLeft}
                                    rightDockOffset={screenRight}
                                    isFreeTier={isFreeTier}
                                    onOpenPaymentPlans={() => setShowPaymentPlansModal(true)}
                                />
                            )}

                            {showTransitChart && (
                                <div className="absolute bottom-[80px] left-0 right-0 h-64 bg-[#06060a]/95 backdrop-blur-md border-t border-white/10 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-transform transform translate-y-0">
                                    <TransitChart 
                                        currentTime={currentTime} 
                                        natalCelestialData={natalTime ? natalData : null} 
                                        onClose={() => setShowTransitChart(false)}
                                    />
                                </div>
                            )}
                            <AnimatePresence>
                                {showEnergyChart && energyChartProps && (
                                    <EnergyChartPanel
                                        aspects={energyChartProps.aspects}
                                        lunarCycle={energyChartProps.lunarCycle}
                                        currentDate={energyChartProps.currentDate}
                                        onClose={() => setShowEnergyChart(false)}
                                        natalCelestialData={natalTime ? natalData : null}
                                    />
                                )}
                            </AnimatePresence>
                        </section>
                    );
                })()}

                {/* Doca de Painéis Esquerda Fixa (Barra Lateral Esquerda) */}
                {(() => {
                    const unifiedLeftDockWidth = Math.max(240, panelWidths.celestial || 265, panelWidths.statistics || 265);
                    const dockPixelWidth = Math.max(220, Math.ceil(unifiedLeftDockWidth * uiScale));
                    return (
                        <aside 
                            style={{ width: `${dockPixelWidth}px` }}
                            className="fixed left-3 top-2 sm:top-3 bottom-2 z-50 flex flex-col gap-1.5 pointer-events-none max-h-[calc(100vh-16px)] sm:max-h-[calc(100vh-24px)] overflow-hidden select-none transition-[width] duration-200"
                        >
                            {/* Painel ASTROS (Superior Esquerdo) */}
                            {panelStates.celestial.isOpen && (
                                <div className="pointer-events-auto flex-1 min-h-[140px] flex flex-col overflow-hidden">
                                    <PanelFrame
                                        title={t ? t('Astros') : 'Astros'}
                                        isOpen={panelStates.celestial.isOpen}
                                        isCollapsed={panelStates.celestial.isCollapsed}
                                        onClose={() => setPanelStates(prev => ({ ...prev, celestial: { ...prev.celestial, isOpen: false } }))}
                                        onToggleCollapse={() => setPanelStates(prev => ({ ...prev, celestial: { ...prev.celestial, isCollapsed: !prev.celestial.isCollapsed } }))}
                                        onResetLayout={resetAllPanelLayouts}
                                        onFocus={() => focusPanel('celestial')}
                                        zIndex={panelStates.celestial.zIndex}
                                        width={dockPixelWidth}
                                        menuButtonRef={celestialMenuRef}
                                        onMenuToggle={(e) => {
                                            e.stopPropagation();
                                            if (isFreeTier || isFreeTrial) {
                                                setShowPaymentPlansModal(true);
                                                return;
                                            }
                                            setActiveMenu(activeMenu === 'planets' ? null : 'planets');
                                        }}
                                        isMenuOpen={activeMenu === 'planets'}
                                        isLocked={isFreeTier || isFreeTrial}
                                        onLockedClick={() => setShowPaymentPlansModal(true)}
                                        theme={theme}
                                        hideBottomResizeHandle={true}
                                    >
                                        <CelestialBodyPanel 
                                            {...(celestialTab === 'natal' && natalTime ? natalData : celestialData)} 
                                            retrogradeStatus={celestialTab === 'natal' && natalTime ? natalData.retrogradeStatus : celestialData.retrogradeStatus}
                                            stationaryStatus={celestialTab === 'natal' && natalTime ? natalData.stationaryStatus : celestialData.stationaryStatus}
                                            housePlacements={celestialTab === 'natal' && natalTime ? natalData.housePlacements : celestialData.housePlacements}
                                            visiblePlanets={celestialTab === 'natal' && natalTime ? visibleNatalPlanets : visiblePlanets}
                                            onVisibilityChange={celestialTab === 'natal' && natalTime ? setVisibleNatalPlanets : setVisiblePlanets}
                                            selectedPlanets={selectedPlanets}
                                            secondarySelectedPlanets={highlightedPlanetsFromAspects}
                                            onPlanetClick={handlePlanetClick}
                                            onPlanetRightClick={handlePlanetRightClick}
                                            onPlanetHover={(id) => setHoveredPlanet(celestialTab === 'natal' && natalTime ? `natal_${id}` : id)}
                                            hoveredPlanet={hoveredPlanet}
                                            hoveredHouse={hoveredHouse}
                                            planetDisplayStatus={{}} 
                                            activeMenu={activeMenu}
                                            setActiveMenu={setActiveMenu}
                                            onClearSelections={handleClearSelections}
                                            onWidthChange={handleCelestialWidthChange}
                                            houseFormat={houseFormat}
                                            onHouseFormatChange={setHouseFormat}
                                            showPlanetSpheres={showPlanetSpheres}
                                            setShowPlanetSpheres={setShowPlanetSpheres}
                                            showNeedle={showNeedle}
                                            setShowNeedle={setShowNeedle}
                                            showOrbits={showOrbits}
                                            setShowOrbits={setShowOrbits}
                                            zodiacColorMode={zodiacColorMode}
                                            settings={celestialSettings}
                                            onSettingsChange={setCelestialSettings}
                                            planetSize={panelPlanetSize}
                                            onPlanetSizeChange={setPanelPlanetSize}
                                            zodiacSignSize={panelZodiacSignSize}
                                            onZodiacSignSizeChange={setPanelZodiacSignSize}
                                            panelScale={leftPanelScale}
                                            onPanelScaleChange={setLeftPanelScale}
                                            panelPosition="left"
                                            onPanelPositionChange={() => {}}
                                            dragHandle={null}
                                            activeTab={celestialTab}
                                            onTabChange={setCelestialTab}
                                            hasNatalDate={!!natalTime}
                                            theme={theme}
                                            hideHeader={true}
                                            menuButtonRef={celestialMenuRef}
                                            isFreeTier={isFreeTier}
                                            isFreeTrial={isFreeTrial}
                                            onOpenPaymentPlans={() => setShowPaymentPlansModal(true)}
                                        />
                                    </PanelFrame>
                                </div>
                            )}

                            {/* Resizer interativo unificado entre Astros e Status - Hairline Elegante */}
                            {panelStates.celestial.isOpen && panelStates.statistics.isOpen && !panelStates.statistics.isCollapsed && (
                                <div
                                    onPointerDown={handleSidebarSplitResizePointerDown}
                                    className="h-2 w-full cursor-ns-resize py-0.5 flex items-center justify-center shrink-0 -my-0.5 z-30 group select-none pointer-events-auto"
                                    title="Arraste para ajustar a altura relativa entre os painéis Astros e Status"
                                >
                                    <div className="w-8 h-[2px] rounded-full bg-white/20 group-hover:bg-cyan-300 group-hover:w-12 group-hover:h-[3px] group-active:bg-cyan-400 transition-all duration-150 shadow-sm" />
                                </div>
                            )}

                            {/* Painel STATUS (Diretamente abaixo de Astros) */}
                            {panelStates.statistics.isOpen && (
                                <div 
                                    ref={statusPanelRef}
                                    className="pointer-events-auto flex-shrink-0 flex flex-col overflow-hidden"
                                    style={{ height: panelStates.statistics.isCollapsed ? 'auto' : sidebarStatusHeight ? `${sidebarStatusHeight}px` : 'auto' }}
                                >
                                    <PanelFrame
                                        title={t ? t('Status') : 'Status'}
                                        isOpen={panelStates.statistics.isOpen}
                                        isCollapsed={panelStates.statistics.isCollapsed}
                                        onClose={() => setPanelStates(prev => ({ ...prev, statistics: { ...prev.statistics, isOpen: false } }))}
                                        onToggleCollapse={() => setPanelStates(prev => ({ ...prev, statistics: { ...prev.statistics, isCollapsed: !prev.statistics.isCollapsed } }))}
                                        onResetLayout={resetAllPanelLayouts}
                                        onFocus={() => focusPanel('statistics')}
                                        zIndex={panelStates.statistics.zIndex}
                                        width={dockPixelWidth}
                                        menuButtonRef={statisticsMenuRef}
                                        onMenuToggle={(e) => {
                                            e.stopPropagation();
                                            if (isFreeTier || isFreeTrial) {
                                                setShowPaymentPlansModal(true);
                                                return;
                                            }
                                            setActiveMenu(activeMenu === 'statistics' as any ? null : 'statistics' as any);
                                        }}
                                        isMenuOpen={activeMenu === 'statistics' as any}
                                        isLocked={isFreeTier || isFreeTrial}
                                        onLockedClick={() => setShowPaymentPlansModal(true)}
                                        theme={theme}
                                        hideBottomResizeHandle={true}
                                    >
                                <ChartStatisticsPanel 
                                    celestialData={celestialData}
                                    visiblePlanets={visiblePlanets}
                                    scale={leftPanelScale}
                                    zodiacColorMode={zodiacColorMode}
                                    onZodiacColorModeChange={setZodiacColorMode}
                                    highlightFilter={highlightFilter}
                                    onHighlightFilterChange={setHighlightFilter}
                                    layoutMode={statsLayout}
                                    onLayoutChange={setStatsLayout}
                                    activeMenu={activeMenu}
                                    setActiveMenu={setActiveMenu}
                                    panelPosition="right"
                                    onPanelPositionChange={() => {}}
                                    onWidthChange={handleStatisticsWidthChange}
                                    dragHandle={null}
                                    seasonInfo={seasonInfo}
                                    sunriseTime={celestialData.sunriseTime}
                                    sunsetTime={celestialData.sunsetTime}
                                    moonPhase={celestialData.moonPhase}
                                    moonriseTime={celestialData.moonriseTime}
                                    moonsetTime={celestialData.moonsetTime}
                                    onEclipseClick={() => setShowEclipseModal(true)}
                                    onLunarCalendarClick={handleLunarCalendarClick}
                                    hideHeader={true}
                                    menuButtonRef={statisticsMenuRef}
                                    isFreeTier={isFreeTier}
                                    isFreeTrial={isFreeTrial}
                                    onOpenPaymentPlans={() => setShowPaymentPlansModal(true)}
                                />
                            </PanelFrame>
                        </div>
                    )}
                </aside>
                    );
                })()}

                {/* Doca de Painéis Direita Fixa (Barra Lateral Direita) */}
                {(() => {
                    const unifiedRightDockWidth = Math.max(240, panelWidths.aspects || 245, panelWidths.cusps || 245);
                    const dockPixelWidth = Math.max(200, unifiedRightDockWidth * uiScale);
                    return (
                        <aside 
                            className="fixed top-2 sm:top-3 bottom-2 z-50 flex flex-col gap-1.5 pointer-events-none max-h-[calc(100vh-16px)] sm:max-h-[calc(100vh-24px)] overflow-hidden transition-[right,width] duration-300 ease-out select-none"
                            style={{
                                width: `${dockPixelWidth}px`,
                                right: isQuickToolsSidebarOpen ? '64px' : '8px'
                            }}
                        >
                            {/* Card de Lua (Topo Superior Direito) */}
                            {celestialData && currentTime && (
                                <div className="pointer-events-auto flex-shrink-0 w-full">
                                    <MoonInfoPanel
                                        moonPhase={celestialData.moonPhase}
                                        moonIllumination={celestialData.moonIllumination}
                                        moonEclipticLongitude={celestialData.moonEclipticLongitude}
                                        moonriseTime={celestialData.moonriseTime}
                                        moonsetTime={celestialData.moonsetTime}
                                        currentDate={currentTime}
                                        latitude={location?.latitude ?? 0}
                                        onDateSelect={(date) => { setCurrentTime(date); setIsRealTime(false); }}
                                        theme={theme}
                                        isOpen={showMoonPopover}
                                        onTogglePopover={() => setShowMoonPopover(prev => !prev)}
                                        onClosePopover={() => setShowMoonPopover(false)}
                                    />
                                </div>
                            )}

                            {/* Painel ASPECTOS (Abaixo do Card da Lua) */}
                            {panelStates.aspects.isOpen && (
                                <div className="pointer-events-auto flex-1 min-h-[140px] flex flex-col overflow-hidden">
                                    <PanelFrame
                                        title={t ? t('Aspectos') : 'Aspectos'}
                                        isOpen={panelStates.aspects.isOpen}
                                        isCollapsed={panelStates.aspects.isCollapsed}
                                        onClose={() => setPanelStates(prev => ({ ...prev, aspects: { ...prev.aspects, isOpen: false } }))}
                                        onToggleCollapse={() => setPanelStates(prev => ({ ...prev, aspects: { ...prev.aspects, isCollapsed: !prev.aspects.isCollapsed } }))}
                                        onResetLayout={resetAllPanelLayouts}
                                        onFocus={() => focusPanel('aspects')}
                                        zIndex={panelStates.aspects.zIndex}
                                        width={dockPixelWidth}
                                        menuButtonRef={aspectsMenuRef}
                                        onMenuToggle={(e) => {
                                            e.stopPropagation();
                                            if (isFreeTier || isFreeTrial) {
                                                setShowPaymentPlansModal(true);
                                                return;
                                            }
                                            setActiveMenu(activeMenu === 'aspects' ? null : 'aspects');
                                        }}
                                        isMenuOpen={activeMenu === 'aspects'}
                                        isLocked={isFreeTier || isFreeTrial}
                                        onLockedClick={() => setShowPaymentPlansModal(true)}
                                        theme={theme}
                                        hideBottomResizeHandle={true}
                                    >
                                <AstroInfoPanel 
                                    aspects={panelAspects} 
                                    retrogradeStatus={celestialData.retrogradeStatus}
                                    onAspectHover={setHoveredAspect}
                                    onAspectClick={handleAspectClick}
                                    onAspectRightClick={() => {}}
                                    selectedAspects={selectedAspects}
                                    onClearAllSelections={handleClearSelections}
                                    isAnythingSelected={selectedAspects.length > 0 || selectedPlanets.length > 0}
                                    activeMenu={activeMenu}
                                    setActiveMenu={setActiveMenu}
                                    scale={rightPanelScale}
                                    showAspectLines={showAspectLines}
                                    setShowAspectLines={handleToggleAspectLines}
                                    showNatalLines={showNatalLines}
                                    setShowNatalLines={handleToggleNatalLines}
                                    hasNatalDate={!!natalTime}
                                    houseFormat={houseFormat}
                                    zodiacColorMode={zodiacColorMode}
                                    showPlanetSpheres={showPlanetSpheres}
                                    settings={aspectSettings}
                                    onSettingsChange={setAspectSettings}
                                    currentTime={currentTime}
                                    panelScale={rightPanelScale}
                                    onPanelScaleChange={setRightPanelScale}
                                    panelPosition="right"
                                    onWidthChange={handleAspectsWidthChange}
                                    onPanelPositionChange={() => {}}
                                    dragHandle={null}
                                    theme={theme}
                                    hideHeader={true}
                                    menuButtonRef={aspectsMenuRef}
                                    isFreeTier={isFreeTier}
                                    isFreeTrial={isFreeTrial}
                                    onOpenPaymentPlans={() => setShowPaymentPlansModal(true)}
                                />
                            </PanelFrame>
                        </div>
                    )}

                    {/* Resizer interativo unificado entre Aspectos e Casas - Hairline Elegante */}
                    {panelStates.aspects.isOpen && panelStates.cusps.isOpen && !panelStates.cusps.isCollapsed && (
                        <div
                            onPointerDown={handleRightSidebarSplitResizePointerDown}
                            className="h-2 w-full cursor-ns-resize py-0.5 flex items-center justify-center shrink-0 -my-0.5 z-30 group select-none pointer-events-auto"
                            title="Arraste para ajustar a altura relativa entre os painéis Aspectos e Casas"
                        >
                            <div className="w-8 h-[2px] rounded-full bg-white/20 group-hover:bg-cyan-300 group-hover:w-12 group-hover:h-[3px] group-active:bg-cyan-400 transition-all duration-150 shadow-sm" />
                        </div>
                    )}

                    {/* Painel CASAS (Abaixo de Aspectos) */}
                    {panelStates.cusps.isOpen && (
                        <div 
                            className="pointer-events-auto flex-shrink-0 flex flex-col overflow-hidden"
                            style={{ height: panelStates.cusps.isCollapsed ? 'auto' : `${sidebarCuspsHeight}px` }}
                        >
                            <PanelFrame
                                title={t ? t('Casas') : 'Casas'}
                                isOpen={panelStates.cusps.isOpen}
                                isCollapsed={panelStates.cusps.isCollapsed}
                                onClose={() => setPanelStates(prev => ({ ...prev, cusps: { ...prev.cusps, isOpen: false } }))}
                                onToggleCollapse={() => setPanelStates(prev => ({ ...prev, cusps: { ...prev.cusps, isCollapsed: !prev.cusps.isCollapsed } }))}
                                onResetLayout={resetAllPanelLayouts}
                                onFocus={() => focusPanel('cusps')}
                                zIndex={panelStates.cusps.zIndex}
                                width={dockPixelWidth}
                                menuButtonRef={cuspsMenuRef}
                                onMenuToggle={(e) => {
                                    e.stopPropagation();
                                    setActiveMenu(activeMenu === 'cusps' ? null : 'cusps');
                                }}
                                isMenuOpen={activeMenu === 'cusps'}
                                theme={theme}
                                hideBottomResizeHandle={true}
                            >
                                <HouseCuspsPanel 
                                    ascendantLongitude={celestialTab === 'natal' && natalTime ? natalData.ascendantLongitude : celestialData.ascendantLongitude}
                                    midheavenLongitude={celestialTab === 'natal' && natalTime ? natalData.midheavenLongitude : celestialData.midheavenLongitude}
                                    descendantLongitude={celestialTab === 'natal' && natalTime ? natalData.descendantLongitude : celestialData.descendantLongitude}
                                    imumCoeliLongitude={celestialTab === 'natal' && natalTime ? natalData.imumCoeliLongitude : celestialData.imumCoeliLongitude}
                                    houseCusps={celestialTab === 'natal' && natalTime ? natalData.houseCusps : celestialData.houseCusps}
                                    housePlacements={celestialTab === 'natal' && natalTime ? natalData.housePlacements : celestialData.housePlacements}
                                    visiblePlanets={celestialTab === 'natal' && natalTime ? visibleNatalPlanets : visiblePlanets}
                                    celestialData={celestialTab === 'natal' && natalTime ? natalData : celestialData}
                                    hoveredHouse={hoveredHouse}
                                    setHoveredHouse={setHoveredHouse}
                                    selectedHouses={selectedHouses}
                                    secondarySelectedHouses={highlightedHousesFromAspects}
                                    onHouseClick={handleHouseClick}
                                    onHouseRightClick={() => {}}
                                    activeMenu={activeMenu}
                                    setActiveMenu={setActiveMenu}
                                    houseFormat={houseFormat}
                                    onHouseFormatChange={setHouseFormat}
                                    scale={rightPanelScale}
                                    showHouseLines={showHouseLines}
                                    setShowHouseLines={setShowHouseLines}
                                    zodiacColorMode={zodiacColorMode}
                                    showSignLines={showSignLines}
                                    setShowSignLines={setShowSignLines}
                                    layoutMode={houseCuspsLayout}
                                    onLayoutChange={setHouseCuspsLayout}
                                    columns={houseCuspsColumns}
                                    onColumnsChange={setHouseCuspsColumns}
                                    showCuspDegrees={showCuspDegrees}
                                    onToggleCuspDegrees={() => setShowCuspDegrees(!showCuspDegrees)}
                                    panelPosition="left"
                                    onWidthChange={handleCuspsWidthChange}
                                    onPanelPositionChange={() => {}}
                                    dragHandle={null}
                                    hideHeader={true}
                                    menuButtonRef={cuspsMenuRef}
                                    theme={theme}
                                />
                            </PanelFrame>
                        </div>
                    )}
                </aside>
                    );
                })()}

            </main>
            {showSaveMapModal && (
                <div className="absolute inset-0 z-[110] flex items-center justify-center bg-brand-dark/80 backdrop-blur-md">
                    <div className="bg-brand-surface border border-brand-border/10 rounded-2xl shadow-2xl w-full max-w-sm p-6 relative overflow-hidden">
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-brand-purple/5 to-transparent"></div>
                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <h2 className="text-lg font-bold uppercase text-brand-text tracking-wide">Salvar Mapa</h2>
                            <button onClick={() => setShowSaveMapModal(false)} className="text-brand-text-muted hover:text-brand-text transition-colors">
                                <UI_ICONS.CloseIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="space-y-4 relative z-10">
                            <div>
                                <label className="block text-xs font-bold uppercase text-brand-text-muted mb-1">Nome do Mapa</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-brand-surface-highlight/50 border border-brand-border/10 rounded-lg px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-purple outline-none"
                                    placeholder="Ex: Trânsito de Hoje, Mapa Natal..."
                                    value={newMapName}
                                    onChange={(e) => setNewMapName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-brand-text-muted mb-1">Descrição (Opcional)</label>
                                <textarea 
                                    className="w-full bg-brand-surface-highlight/50 border border-brand-border/10 rounded-lg px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-purple outline-none resize-none"
                                    placeholder="Observações sobre este mapa..."
                                    rows={3}
                                    value={newMapDesc}
                                    onChange={(e) => setNewMapDesc(e.target.value)}
                                />
                            </div>
                            <button 
                                onClick={handleSaveMap}
                                disabled={!newMapName.trim()}
                                className="w-full bg-brand-purple hover:bg-brand-purple/90 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-lg mt-4 transition-colors uppercase tracking-wider text-sm"
                            >
                                Salvar Mapa
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showSaveLayoutModal && (
                <div className="absolute inset-0 z-[110] flex items-center justify-center bg-brand-dark/80 backdrop-blur-md">
                    <div className="bg-brand-surface border border-brand-border/10 rounded-2xl shadow-2xl w-full max-w-sm p-6 relative overflow-hidden">
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-brand-purple/5 to-transparent"></div>
                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <h2 className="text-lg font-bold uppercase text-brand-text tracking-wide">Salvar Layout</h2>
                            <button onClick={() => setShowSaveLayoutModal(false)} className="text-brand-text-muted hover:text-brand-text transition-colors">
                                <UI_ICONS.CloseIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="space-y-4 relative z-10">
                            <div>
                                <label className="block text-xs font-bold uppercase text-brand-text-muted mb-1">Nome do Layout</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-brand-surface-highlight/50 border border-brand-border/10 rounded-lg px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-purple outline-none"
                                    placeholder="Ex: Minimalista Dark, Completo..."
                                    value={newLayoutName}
                                    onChange={(e) => setNewLayoutName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-brand-text-muted mb-1">Descrição (Opcional)</label>
                                <textarea 
                                    className="w-full bg-brand-surface-highlight/50 border border-brand-border/10 rounded-lg px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-purple outline-none resize-none"
                                    placeholder="Observações sobre este layout..."
                                    rows={3}
                                    value={newLayoutDesc}
                                    onChange={(e) => setNewLayoutDesc(e.target.value)}
                                />
                            </div>
                            <button 
                                onClick={handleSaveLayout}
                                disabled={!newLayoutName.trim()}
                                className="w-full bg-brand-purple hover:bg-brand-purple/90 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-lg mt-4 transition-colors uppercase tracking-wider text-sm"
                            >
                                Salvar Layout
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isSettingsOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-brand-dark/80 backdrop-blur-md">
                    <div className="bg-brand-surface border border-brand-border/10 rounded-2xl shadow-2xl w-full max-w-md p-6 m-4 transform transition-all scale-100 relative overflow-hidden">
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-violet-500/5 to-transparent"></div>
                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <h2 className="text-lg font-bold uppercase text-brand-text tracking-wide">Configurar Tempo e Local</h2>
                            <button onClick={() => setIsSettingsOpen(false)} className="text-brand-text-muted hover:text-brand-text transition-colors">
                                <UI_ICONS.CloseIcon className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="space-y-4 relative z-10">
                            <div>
                                <label className="block text-xs font-bold uppercase text-brand-text-muted mb-1">Data</label>
                                <input 
                                    type="date" 
                                    value={tempDate}
                                    onChange={(e) => setTempDate(e.target.value)}
                                    className="w-full bg-brand-surface-highlight/50 border border-brand-border/10 rounded-lg px-3 py-2 text-brand-text focus:ring-2 focus:ring-violet-500 outline-none"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold uppercase text-brand-text-muted mb-1">Hora</label>
                                <input 
                                    type="time" 
                                    value={tempTime}
                                    onChange={(e) => setTempTime(e.target.value)}
                                    className="w-full bg-brand-surface-highlight/50 border border-brand-border/10 rounded-lg px-3 py-2 text-brand-text focus:ring-2 focus:ring-violet-500 outline-none"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold uppercase text-brand-text-muted mb-1">Local</label>
                                <LocationSearchInput
                                    value={tempLocationText}
                                    theme={theme}
                                    placeholder="Buscar qualquer cidade..."
                                    onChange={(loc) => {
                                        setTempLocationText(loc.displayName);
                                        // Armazenar lat/lng diretamente para salvar depois
                                        setTempLocationIndex(-99);
                                        // Guardar temporariamente nos campos de lat/lng
                                        // usando um ref ou estado auxiliar
                                        (window as any).__pendingLocation = {
                                            latitude: loc.latitude,
                                            longitude: loc.longitude,
                                            displayName: loc.displayName
                                        };
                                    }}
                                />
                                <p className="text-[9px] text-brand-text-muted mt-1 font-manrope">
                                    Digite o nome de qualquer cidade do mundo
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8 relative z-10">
                            <button 
                                onClick={() => setIsSettingsOpen(false)}
                                className="flex-1 py-2 rounded-lg border border-brand-border/10 text-brand-text-muted font-semibold hover:bg-brand-surface-highlight transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={saveSettings}
                                className="flex-1 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

             {isNatalSettingsOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-brand-dark/80 backdrop-blur-md">
                    <div className="bg-brand-surface border border-brand-border/10 rounded-2xl shadow-2xl relative overflow-hidden border-t-4 border-t-yellow-500 flex"
                        style={{ width: 'min(96vw, 1100px)', height: 'min(90vh, 740px)' }}
                    >
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-yellow-500/5 to-transparent" />

                        {/* COLUNA ESQUERDA — campos */}
                        <div className="flex flex-col p-6 gap-4 relative z-10 border-r border-brand-border/10 overflow-y-auto"
                            style={{ width: '300px', flexShrink: 0 }}
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-bold uppercase text-yellow-400 tracking-wide flex items-center gap-2 font-display">
                                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10 2l2.09 4.26L17 7.27l-3.5 3.41.83 4.82L10 13.27l-4.33 2.23.83-4.82L3 7.27l4.91-.01L10 2z"/>
                                    </svg>
                                    Mapa Natal
                                </h2>
                                <button
                                    onClick={() => setIsNatalSettingsOpen(false)}
                                    className="text-brand-text-muted hover:text-brand-text transition-colors"
                                >
                                    <UI_ICONS.CloseIcon className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Botão de Mapas Salvos */}
                            <button
                                onClick={() => setShowNatalMapSelector(!showNatalMapSelector)}
                                className="w-full py-2.5 px-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 text-yellow-400 font-bold text-[10px] uppercase tracking-widest hover:bg-yellow-500/10 transition-all flex items-center justify-center gap-2"
                            >
                                <UI_ICONS.BookIcon className="w-4 h-4" />
                                Selecionar de Mapas Salvos
                            </button>

                            {/* Seletor de Mapas Salvos */}
                            <AnimatePresence>
                                {showNatalMapSelector && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-brand-surface-highlight/50 border border-brand-border/10 rounded-xl overflow-hidden mb-2"
                                    >
                                        <div className="p-2 border-b border-brand-border/10 bg-brand-surface flex justify-between items-center">
                                            <span className="text-[9px] font-bold uppercase text-brand-text-muted tracking-tight">Meus Mapas</span>
                                            <button onClick={() => setShowNatalMapSelector(false)}>
                                                <UI_ICONS.CloseIcon className="w-3 h-3 text-brand-text-muted hover:text-white" />
                                            </button>
                                        </div>
                                        <div className="max-h-48 overflow-y-auto p-1 custom-scrollbar">
                                            {savedMaps.length === 0 ? (
                                                <div className="p-4 text-center">
                                                    <p className="text-[10px] text-brand-text-muted">Nenhum mapa salvo.</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-1">
                                                    {savedMaps.map(map => (
                                                        <button
                                                            key={map.id}
                                                            onClick={() => {
                                                                const birthDate = map.natalDate || map.targetDate || map.date;
                                                                const birthLocation = map.natalLocation || map.location;

                                                                if (birthDate) {
                                                                    const d = new Date(birthDate);
                                                                    const y = d.getFullYear();
                                                                    const m = String(d.getMonth() + 1).padStart(2, '0');
                                                                    const day = String(d.getDate()).padStart(2, '0');
                                                                    setTempNatalDate(`${y}-${m}-${day}`);
                                                                    setNatalDateDisplay(`${day}/${m}/${y}`);
                                                                    const h = String(d.getHours()).padStart(2, '0');
                                                                    const min = String(d.getMinutes()).padStart(2, '0');
                                                                    setTempNatalTime(`${h}:${min}`);
                                                                    setNatalTimeDisplay(`${h}:${min}`);
                                                                }
                                                                if (birthLocation) {
                                                                    setTempNatalLocationText(birthLocation.displayName);
                                                                    (window as any).__pendingNatalLocation = birthLocation;
                                                                }
                                                                setShowNatalMapSelector(false);
                                                            }}
                                                            className="w-full p-2.5 text-left hover:bg-white/5 rounded-lg transition-colors flex flex-col group border-b border-white/5 last:border-0"
                                                        >
                                                            <span className="text-xs font-bold text-brand-text group-hover:text-yellow-400 transition-colors uppercase tracking-tight">{map.name}</span>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                {(map.natalDate || map.targetDate || map.date) && (
                                                                    <span className="text-[9px] text-brand-text-muted">
                                                                        {new Date(map.natalDate || map.targetDate || map.date).toLocaleDateString('pt-BR')} 
                                                                        {' '}
                                                                        {new Date(map.natalDate || map.targetDate || map.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                )}
                                                                {(map.natalLocation || map.location) && (
                                                                    <>
                                                                        <span className="text-[8px] text-brand-text-muted/30">|</span>
                                                                        <span className="text-[9px] text-brand-text-muted truncate flex-1">
                                                                            {(map.natalLocation || map.location).displayName}
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

                            <div className="space-y-4">

                            {/* Campo Data com máscara */}
                            <div>
                                <label className="block text-xs font-bold uppercase text-brand-text-muted mb-1 font-manrope">
                                    Data de Nascimento
                                </label>
                                <div className="relative">
                                    <input
                                        id="natal-date-field"
                                        type="text"
                                        value={natalDateDisplay}
                                        onChange={(e) => {
                                            const nums = e.target.value.replace(/\D/g, '').slice(0, 8);
                                            let masked = nums;
                                            if (nums.length > 4) masked = nums.slice(0,2) + '/' + nums.slice(2,4) + '/' + nums.slice(4);
                                            else if (nums.length > 2) masked = nums.slice(0,2) + '/' + nums.slice(2);
                                            setNatalDateDisplay(masked);
                                            if (nums.length === 8) {
                                                const d = nums.slice(0,2), m = nums.slice(2,4), y = nums.slice(4,8);
                                                setTempNatalDate(`${y}-${m}-${d}`);
                                            }
                                        }}
                                        onKeyDown={(e) => { if (e.key === 'Tab' || e.key === 'Enter') { e.preventDefault(); document.getElementById('natal-time-input')?.focus(); }}}
                                        placeholder="DD/MM/AAAA"
                                        className="w-full bg-brand-surface-highlight/50 border border-brand-border/10 rounded-lg px-3 py-2.5 text-brand-text focus:ring-2 focus:ring-yellow-500 outline-none font-manrope pr-10"
                                    />
                                    {/* Botão calendário visual — opção secundária */}
                                    {/* Calendário visual removido */}
                                </div>

                                {/* Calendário visual — opção secundária, abre à direita */}
                                {/* Calendário visual removido */}
                            </div>

                            {/* Campo Hora com máscara */}
                            <div>
                                <label className="block text-xs font-bold uppercase text-brand-text-muted mb-1 font-manrope">
                                    Hora de Nascimento
                                </label>
                                <input
                                    id="natal-time-input"
                                    type="text"
                                    value={natalTimeDisplay}
                                    onChange={(e) => {
                                        const nums = e.target.value.replace(/\D/g, '').slice(0, 4);
                                        let masked = nums;
                                        if (nums.length > 2) masked = nums.slice(0,2) + ':' + nums.slice(2);
                                        setNatalTimeDisplay(masked);
                                        if (nums.length === 4) {
                                            setTempNatalTime(masked);
                                        }
                                    }}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('natal-city-input')?.focus(); }}}
                                    placeholder="HH:MM"
                                    className="w-full bg-brand-surface-highlight/50 border border-brand-border/10 rounded-lg px-3 py-2.5 text-brand-text focus:ring-2 focus:ring-yellow-500 outline-none font-manrope"
                                />
                            </div>

                            {/* Campo Local — busca mundial */}
                            <div>
                                <label className="block text-xs font-bold uppercase text-brand-text-muted mb-1 font-manrope">
                                    Local de Nascimento
                                </label>
                                <LocationSearchInput
                                    value={tempNatalLocationText}
                                    theme={theme}
                                    placeholder="Buscar qualquer cidade..."
                                    onChange={(loc) => {
                                        setTempNatalLocationText(loc.displayName);
                                        setTempNatalLocationIndex(-99);
                                        (window as any).__pendingNatalLocation = {
                                            latitude: loc.latitude,
                                            longitude: loc.longitude,
                                            displayName: loc.displayName
                                        };
                                    }}
                                />
                                <p className="text-[9px] text-brand-text-muted mt-1 font-manrope">
                                    Digite o nome de qualquer cidade do mundo
                                </p>
                            </div>
                        </div>

                            {/* Botões */}
                            <div className="flex gap-3 mt-auto pt-4">
                                <button
                                    onClick={() => setIsNatalSettingsOpen(false)}
                                    className="flex-1 py-2.5 rounded-lg border border-brand-border/10 text-brand-text-muted font-semibold hover:bg-brand-surface-highlight transition-colors font-manrope text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={saveNatalSettings}
                                    className="flex-1 py-2.5 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-semibold shadow-[0_0_15px_rgba(234,179,8,0.3)] transition-colors font-manrope text-sm"
                                >
                                    Definir Mapa
                                </button>
                            </div>
                        </div>

{/* COLUNA DIREITA — calendário */}
<div className="flex-1 overflow-hidden relative z-10 flex flex-col min-w-0 min-h-0">
    <CalendarPanel
        isOpen={true}
        onClose={() => setIsNatalSettingsOpen(false)}
        variant="gold"
        currentDate={(() => {
            try {
                const dateStr = tempNatalDate || '2000-01-01';
                const timeStr = (tempNatalTime && tempNatalTime.length >= 4) ? tempNatalTime : '12:00';
                const d = new Date(`${dateStr}T${timeStr}`);
                return isNaN(d.getTime()) ? new Date(2000, 0, 1, 12, 0) : d;
            } catch { return new Date(2000, 0, 1, 12, 0); }
        })()}
        onDateSelect={(date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            setTempNatalDate(`${y}-${m}-${d}`);
            setNatalDateDisplay(`${d}/${m}/${y}`);
            const h = String(date.getHours()).padStart(2, '0');
            const min = String(date.getMinutes()).padStart(2, '0');
            setTempNatalTime(`${h}:${min}`);
            setNatalTimeDisplay(`${h}:${min}`);
        }}
        defaultView="year"
        onlyYearView={true}
        embedded={true}
        latitude={natalLocation.latitude}
    />
</div>
                </div>

            </div>
        )}
        </>
        );
    };

    const energyChartProps = useMemo(() => {
        if (!showEnergyChart) return null;
        let searchDate = new Date(currentTime.getTime() - 35 * 24 * 60 * 60 * 1000);
        let newMoonDate = searchDate;
        let count = 0;
        while (count < 10) {
            const next = SearchMoonPhase(0, searchDate, 40);
            if (!next || next.date > currentTime) break;
            newMoonDate = next.date;
            searchDate = new Date(next.date.getTime() + 1000);
            count++;
        }
        const fullMoon = SearchMoonPhase(180, newMoonDate, 35)?.date || new Date(newMoonDate.getTime() + 14 * 24 * 60 * 60 * 1000);
        const nextNewMoon = SearchMoonPhase(0, new Date(newMoonDate.getTime() + 24 * 60 * 60 * 1000), 35)?.date || new Date(newMoonDate.getTime() + 29.5 * 24 * 60 * 60 * 1000);

        const aspectData = (celestialData as any)?.filteredAspects || celestialData?.aspects || [];
        const aspectsForEnergy = aspectData.map((a: any) => ({
            planet1: a.body1?.name || a.body1?.id || a.planet1 || '',
            planet2: a.body2?.name || a.body2?.id || a.planet2 || '',
            type: (a.type === 'conjunction' ? 'CON' : 
                   a.type === 'opposition' ? 'OPO' : 
                   a.type === 'trine' ? 'TRI' : 
                   a.type === 'sextile' ? 'SXT' : 
                   a.type === 'square' ? 'QUA' : 
                   a.type === 'inconjunct' ? 'INC' : 
                   a.type === 'semisextile' ? 'SSX' : 
                   a.type === 'semisquare' ? 'SSQ' : 
                   a.type === 'sesquiquadrate' ? 'SES' : 'CON'),
            orb: a.orb
        }));

        const illumination = Math.round((1 - Math.cos(2 * Math.PI * (celestialData?.moonPhase || 0))) / 2 * 100);

        return {
            aspects: aspectsForEnergy,
            lunarCycle: {
                newMoonDate,
                fullMoonDate: fullMoon,
                nextNewMoonDate: nextNewMoon,
                phase: getMoonPhaseInfo(celestialData?.moonPhase || 0)?.name || '',
                illumination
            },
            currentDate: currentTime
        };
    }, [currentTime, showEnergyChart, celestialData]);
    const starOpacityForBg = showStars ? 1 : 0;

    if (isAuthChecking) {
        return (
            <div className="h-screen w-screen bg-[#03030a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D4AF37]"></div>
            </div>
        );
    }

    if (!isAuthenticated && !trialActive) {
        return (
            <>
                <LandingPage 
                    onLoginSuccess={(user) => {
                        setIsAuthenticated(true);
                        resetTrial();
                        if (user?.username) setUsername(user.username);
                        if (user?.email) setUserEmail(user.email);
                        setIsAdmin(user?.email?.toLowerCase() === 'rafael.cm333@gmail.com' || !!user?.isAdmin);
                        setShowLoginModal(false);
                        setShowPaymentPlansModal(false);
                    }} 
                />
                {showLoginModal && (
                    <LoginModal
                        isOpen={showLoginModal}
                        onClose={() => setShowLoginModal(false)}
                        onSuccess={(user) => {
                            setIsAuthenticated(true);
                            resetTrial();
                            if (user?.username) setUsername(user.username);
                            if (user?.email) setUserEmail(user.email);
                            setIsAdmin(user?.email?.toLowerCase() === 'rafael.cm333@gmail.com' || !!user?.isAdmin);
                            setShowLoginModal(false);
                            setShowPaymentPlansModal(false);
                        }}
                    />
                )}
            </>
        );
    }

    return (
        <div className={`h-screen w-screen ${bgClass} text-brand-text overflow-hidden flex flex-col font-sans selection:bg-brand-purple/30 relative`}>
            <GlobalSvgDefs />
        {showStars && (
            <StarfieldBackground
                isLight={theme === 'light'}
                opacity={starOpacityForBg}
                starCount={starCount}
                twinkleIntensity={starTwinkleIntensity}
                twinkleSpeed={starTwinkleSpeed}
                twinkleMode={starTwinkleMode}
                showMeteors={starMeteors}
                meteorFrequency={starMeteorFrequency}
                showNebulaGlow={starNebulaGlow}
                starBrightness={starBrightness}
            />
        )}
            <div className="relative z-10 flex flex-row h-full w-full">
                <div className="flex-1 relative h-full min-w-0">
                    {renderContent()}
                </div>
                <TopBar 
                    // Moon Card & Date Actions
                    celestialData={celestialData}
                    currentTime={currentTime}
                    location={location}
                    onOpenLunarCalendar={handleLunarCalendarClick}
                    onSetTime={(date) => { setCurrentTime(date); setIsRealTime(false); }}
                    onSetNatalTime={(date) => {
                        setNatalTime(date);
                        setShowNatalLines(true);
                        setCelestialTab('natal');
                    }}
                    onOpenNatal={() => setIsNatalSettingsOpen(true)}
                    natalTime={natalTime}
                    onClearNatal={() => setNatalTime(null)}

                    // Background & Theme
                    onOpenBackground={() => {}}
                    showConstellations={showConstellations}
                    setShowConstellations={setShowConstellations}
                    showStars={showStars}
                    setShowStars={setShowStars}
                    starCount={starCount}
                    setStarCount={setStarCount}
                    starTwinkleIntensity={starTwinkleIntensity}
                    setStarTwinkleIntensity={setStarTwinkleIntensity}
                    starTwinkleSpeed={starTwinkleSpeed}
                    setStarTwinkleSpeed={setStarTwinkleSpeed}
                    starTwinkleMode={starTwinkleMode}
                    setStarTwinkleMode={setStarTwinkleMode}
                    starMeteors={starMeteors}
                    setStarMeteors={setStarMeteors}
                    starMeteorFrequency={starMeteorFrequency}
                    setStarMeteorFrequency={setStarMeteorFrequency}
                    starNebulaGlow={starNebulaGlow}
                    setStarNebulaGlow={setStarNebulaGlow}
                    starBrightness={starBrightness}
                    setStarBrightness={setStarBrightness}
                    theme={theme}
                    setTheme={setTheme}
                    customBackgroundImage={customBackgroundImage}
                    setCustomBackgroundImage={setCustomBackgroundImage}
                    backgroundBrightness={backgroundBrightness}
                    setBackgroundBrightness={setBackgroundBrightness}
                    backgroundImageOpacity={backgroundImageOpacity}
                    setBackgroundImageOpacity={setBackgroundImageOpacity}

                    // Atmosfera
                    showAtmosphere={showAtmosphere}
                    onToggleAtmosphere={() => setShowAtmosphere(prev => !prev)}

                    // Avançado
                    showDecanRing={showDecanRing}
                    setShowDecanRing={setShowDecanRing}
                    showTermsRing={showTermsRing}
                    setShowTermsRing={setShowTermsRing}
                    showSeasonsRing={showSeasonsRing}
                    setShowSeasonsRing={setShowSeasonsRing}
                    showTimeRing={showTimeRing}
                    setShowTimeRing={setShowTimeRing}
                    timeRingScale={timeRingScale}
                    setTimeRingScale={setTimeRingScale}
                    ringLineColor={ringLineColor}
                    setRingLineColor={setRingLineColor}
                    graduationRingWidth={graduationRingWidth}
                    setGraduationRingWidth={setGraduationRingWidth}
                    zodiacRingScale={zodiacRingScale}
                    setZodiacRingScale={setZodiacRingScale}
                    seasonsRingScale={seasonsRingScale}
                    setSeasonsRingScale={setSeasonsRingScale}
                    decanRingScale={decanRingScale}
                    setDecanRingScale={setDecanRingScale}
                    decanGlyphSize={decanGlyphSize}
                    setDecanGlyphSize={setDecanGlyphSize}
                    termsRingScale={termsRingScale}
                    setTermsRingScale={setTermsRingScale}
                    termsGlyphSize={termsGlyphSize}
                    setTermsGlyphSize={setTermsGlyphSize}
                    zodiacSignSize={zodiacSignSize}
                    setZodiacSignSize={setZodiacSignSize}
                    zodiacColorMode={zodiacColorMode}
                    setZodiacColorMode={setZodiacColorMode}
                    showSignColors={showSignColors}
                    setShowSignColors={setShowSignColors}
                    zodiacSystem={zodiacSystem}
                    setZodiacSystem={setZodiacSystem}

                    // Agulha (Ponteiro)
                    pointerEnabled={showNeedle}
                    setPointerEnabled={setShowNeedle}
                    pointerStyle={pointerStyle}
                    setPointerStyle={setPointerStyle}
                    pointerThickness={pointerThickness}
                    setPointerThickness={setPointerThickness}
                    pointerOpacity={pointerOpacity}
                    setPointerOpacity={setPointerOpacity}
                    pointerHead={pointerHead}
                    setPointerHead={setPointerHead}
                    pointerTail={pointerTail}
                    setPointerTail={setPointerTail}
                    pointerShowGradLine={pointerShowGradLine}
                    setPointerShowGradLine={setPointerShowGradLine}
                    pointerFull={pointerFull}
                    setPointerFull={setPointerFull}

                    // Aspectos
                    showAspectLines={showAspectLines}
                    setShowAspectLines={setShowAspectLines}
                    aspectSettings={aspectSettings}
                    setAspectSettings={setAspectSettings}
                    visibleSecondaryAspects={visibleSecondaryAspects}
                    setVisibleSecondaryAspects={setVisibleSecondaryAspects}

                    // Planetas & Órbitas
                    showOrbits={showOrbits}
                    setShowOrbits={setShowOrbits}
                    allPlanetsSameOrbit={allPlanetsSameOrbit}
                    setAllPlanetsSameOrbit={setAllPlanetsSameOrbit}

                    // Graus
                    showDegreeLabels={showDegreeLabels}
                    setShowDegreeLabels={setShowDegreeLabels}
                    degreeLabelSize={degreeLabelSize}
                    setDegreeLabelSize={setDegreeLabelSize}
                    degreeLabelPosition={degreeLabelPosition}
                    setDegreeLabelPosition={setDegreeLabelPosition}
                    degreeLabelFormat={degreeLabelFormat}
                    setDegreeLabelFormat={setDegreeLabelFormat}

                    // Casas
                    showHouseLines={showHouseLines}
                    setShowHouseLines={setShowHouseLines}
                    showHouseMarkers={showHouseMarkers}
                    setShowHouseMarkers={setShowHouseMarkers}
                    houseLineThickness={houseLineThickness}
                    setHouseLineThickness={setHouseLineThickness}
                    houseLineOpacity={houseLineOpacity}
                    setHouseLineOpacity={setHouseLineOpacity}
                    houseLineColor={houseLineColor}
                    setHouseLineColor={setHouseLineColor}
                    mainHouseLineThickness={mainHouseLineThickness}
                    setMainHouseLineThickness={setMainHouseLineThickness}
                    mainHouseLineOpacity={mainHouseLineOpacity}
                    setMainHouseLineOpacity={setMainHouseLineOpacity}
                    mainHouseLineColor={mainHouseLineColor}
                    setMainHouseLineColor={setMainHouseLineColor}
                    houseMarkerRingColor={houseMarkerRingColor}
                    setHouseMarkerRingColor={setHouseMarkerRingColor}
                    houseMarkerRingOpacity={houseMarkerRingOpacity}
                    setHouseMarkerRingOpacity={setHouseMarkerRingOpacity}
                    houseFormat={houseFormat}
                    setHouseFormat={setHouseFormat}
                    houseLineFormat={houseLineFormat}
                    setHouseLineFormat={setHouseLineFormat}
                    houseCuspsColumns={houseCuspsColumns}
                    setHouseCuspsColumns={setHouseCuspsColumns}

                    // Views
                    showTransitChart={showTransitChart}
                    setShowTransitChart={setShowTransitChart}
                    isHeliocentricMode={isHeliocentricMode}
                    setIsHeliocentricMode={setIsHeliocentricMode}

                    // Escala & Tamanho
                    uiScale={uiScale}
                    setUiScale={setUiScale}
                    clockScale={clockScale}
                    setClockScale={setClockScale}
                    leftPanelScale={leftPanelScale}
                    setLeftPanelScale={setLeftPanelScale}
                    rightPanelScale={rightPanelScale}
                    setRightPanelScale={setRightPanelScale}
                    leftPanelWidth={leftPanelWidth}
                    rightPanelWidth={rightPanelWidth}
                    clockPlanetSize={clockPlanetSize}
                    setClockPlanetSize={setClockPlanetSize}

                    // Docks layout
                    leftDockWidth={Math.max(220, (panelWidths.celestial || leftPanelWidth) * uiScale)}
                    rightDockWidth={Math.max(200, (Math.max(240, panelWidths.aspects || 245, panelWidths.cusps || 245)) * uiScale)}
                    isLeftDockOpen={panelStates.celestial.isOpen || panelStates.statistics.isOpen}
                    panelStates={panelStates}
                    onReopenPanel={openPanel}

                    // Action buttons
                    onOpenSettings={() => setIsOptionsRailOpen(prev => !prev)}
                    onSave={() => setShowSaveMapModal(true)}
                    exportData={exportData}
                    onOpenAccount={() => setShowProfileModal(true)}
                    isFullscreen={isFullscreen}
                    onToggleFullscreen={handleToggleFullscreen}
                    isOptionsRailOpen={isOptionsRailOpen}
                    isQuickToolsSidebarOpen={isQuickToolsSidebarOpen}
                    onToggleQuickToolsSidebar={() => setIsQuickToolsSidebarOpen(prev => !prev)}
                    isFreeTier={isFreeTier}
                    userPlan={userPlan}
                    isAdmin={isAdmin}
                    isAuthenticated={isAuthenticated}
                    onOpenLogin={() => setShowLoginModal(true)}
                    onOpenPaymentPlans={() => setShowPaymentPlansModal(true)}
                />
                <QuickToolsSidebar 
                    isOpen={isQuickToolsSidebarOpen}
                    onToggle={() => setIsQuickToolsSidebarOpen(prev => !prev)}
                    theme={theme}
                    setTheme={setTheme}
                    isFreeTier={isFreeTier}
                    onOpenAccount={() => setShowProfileModal(true)}
                    isAdmin={isAdmin}
                    onOpenAdminDashboard={() => setShowAdminDashboard(true)}
                    onSave={() => setShowSaveMapModal(true)}
                    exportData={exportData}
                    onOpenPaymentPlans={() => setShowPaymentPlansModal(true)}
                    onOpenSettings={() => setIsOptionsRailOpen(prev => !prev)}
                    isOptionsRailOpen={isOptionsRailOpen}
                    currentTime={currentTime}
                    onSetTime={(date) => { setCurrentTime(date); setIsRealTime(false); }}
                    showAtmosphere={showAtmosphere}
                    onToggleAtmosphere={() => setShowAtmosphere(prev => !prev)}
                    pointerEnabled={showNeedle}
                    setPointerEnabled={setShowNeedle}
                    pointerStyle={pointerStyle}
                    setPointerStyle={setPointerStyle}
                    pointerThickness={pointerThickness}
                    setPointerThickness={setPointerThickness}
                    pointerOpacity={pointerOpacity}
                    setPointerOpacity={setPointerOpacity}
                    pointerHead={pointerHead}
                    setPointerHead={setPointerHead}
                    pointerTail={pointerTail}
                    setPointerTail={setPointerTail}
                    pointerShowGradLine={pointerShowGradLine}
                    setPointerShowGradLine={setPointerShowGradLine}
                    pointerFull={pointerFull}
                    setPointerFull={setPointerFull}
                    showOrbits={showOrbits}
                    setShowOrbits={setShowOrbits}
                    allPlanetsSameOrbit={allPlanetsSameOrbit}
                    setAllPlanetsSameOrbit={setAllPlanetsSameOrbit}
                    showPlanetSpheres={showPlanetSpheres}
                    setShowPlanetSpheres={setShowPlanetSpheres}
                    planetColorMode={planetColorMode}
                    setPlanetColorMode={setPlanetColorMode}
                    natalTime={natalTime}
                    onSetNatalTime={(date) => {
                        setNatalTime(date);
                        setShowNatalLines(true);
                        setCelestialTab('natal');
                    }}
                    onClearNatal={() => setNatalTime(null)}
                    onOpenNatal={() => setIsNatalSettingsOpen(true)}
                    showNatalLines={showNatalLines}
                    setShowNatalLines={setShowNatalLines}
                    natalColorMode={natalColorMode}
                    setNatalColorMode={setNatalColorMode}
                    showHouseLines={showHouseLines}
                    setShowHouseLines={setShowHouseLines}
                    showHouseMarkers={showHouseMarkers}
                    setShowHouseMarkers={setShowHouseMarkers}
                    houseLineThickness={houseLineThickness}
                    setHouseLineThickness={setHouseLineThickness}
                    houseLineOpacity={houseLineOpacity}
                    setHouseLineOpacity={setHouseLineOpacity}
                    houseLineColor={houseLineColor}
                    setHouseLineColor={setHouseLineColor}
                    mainHouseLineThickness={mainHouseLineThickness}
                    setMainHouseLineThickness={setMainHouseLineThickness}
                    mainHouseLineOpacity={mainHouseLineOpacity}
                    setMainHouseLineOpacity={setMainHouseLineOpacity}
                    mainHouseLineColor={mainHouseLineColor}
                    setMainHouseLineColor={setMainHouseLineColor}
                    houseMarkerRingColor={houseMarkerRingColor}
                    setHouseMarkerRingColor={setHouseMarkerRingColor}
                    houseMarkerRingOpacity={houseMarkerRingOpacity}
                    setHouseMarkerRingOpacity={setHouseMarkerRingOpacity}
                    houseFormat={houseFormat}
                    setHouseFormat={setHouseFormat}
                    houseLineFormat={houseLineFormat}
                    setHouseLineFormat={setHouseLineFormat}
                    showAspectLines={showAspectLines}
                    setShowAspectLines={setShowAspectLines}
                    aspectSettings={aspectSettings}
                    setAspectSettings={setAspectSettings}
                    visibleSecondaryAspects={visibleSecondaryAspects}
                    setVisibleSecondaryAspects={setVisibleSecondaryAspects}
                    showDegreeLabels={showDegreeLabels}
                    setShowDegreeLabels={setShowDegreeLabels}
                    degreeLabelSize={degreeLabelSize}
                    setDegreeLabelSize={setDegreeLabelSize}
                    degreeLabelPosition={degreeLabelPosition}
                    setDegreeLabelPosition={setDegreeLabelPosition}
                    degreeLabelFormat={degreeLabelFormat}
                    setDegreeLabelFormat={setDegreeLabelFormat}
                    showDecanRing={showDecanRing}
                    setShowDecanRing={setShowDecanRing}
                    showTermsRing={showTermsRing}
                    setShowTermsRing={setShowTermsRing}
                    showSeasonsRing={showSeasonsRing}
                    setShowSeasonsRing={setShowSeasonsRing}
                    showTimeRing={showTimeRing}
                    setShowTimeRing={setShowTimeRing}
                    timeRingScale={timeRingScale}
                    setTimeRingScale={setTimeRingScale}
                    ringLineColor={ringLineColor}
                    setRingLineColor={setRingLineColor}
                    graduationRingWidth={graduationRingWidth}
                    setGraduationRingWidth={setGraduationRingWidth}
                    zodiacRingScale={zodiacRingScale}
                    setZodiacRingScale={setZodiacRingScale}
                    zodiacSignSize={zodiacSignSize}
                    setZodiacSignSize={setZodiacSignSize}
                    seasonsRingScale={seasonsRingScale}
                    setSeasonsRingScale={setSeasonsRingScale}
                    decanRingScale={decanRingScale}
                    setDecanRingScale={setDecanRingScale}
                    decanGlyphSize={decanGlyphSize}
                    setDecanGlyphSize={setDecanGlyphSize}
                    termsRingScale={termsRingScale}
                    setTermsRingScale={setTermsRingScale}
                    termsGlyphSize={termsGlyphSize}
                    setTermsGlyphSize={setTermsGlyphSize}
                    uiScale={uiScale}
                    setUiScale={setUiScale}
                    clockScale={clockScale}
                    setClockScale={setClockScale}
                    leftPanelScale={leftPanelScale}
                    setLeftPanelScale={setLeftPanelScale}
                    rightPanelScale={rightPanelScale}
                    setRightPanelScale={setRightPanelScale}
                    leftPanelWidth={leftPanelWidth}
                    rightPanelWidth={rightPanelWidth}
                    clockPlanetSize={clockPlanetSize}
                    setClockPlanetSize={setClockPlanetSize}
                    isHeliocentricMode={isHeliocentricMode}
                    setIsHeliocentricMode={setIsHeliocentricMode}
                    showEnergyChart={showEnergyChart}
                    setShowEnergyChart={setShowEnergyChart}
                    zodiacColorMode={zodiacColorMode}
                    setZodiacColorMode={setZodiacColorMode}
                    zodiacSystem={zodiacSystem}
                    setZodiacSystem={setZodiacSystem}
                    showStars={showStars}
                    setShowStars={setShowStars}
                    showConstellations={showConstellations}
                    setShowConstellations={setShowConstellations}
                    starCount={starCount}
                    setStarCount={setStarCount}
                    starTwinkleIntensity={starTwinkleIntensity}
                    setStarTwinkleIntensity={setStarTwinkleIntensity}
                    starTwinkleSpeed={starTwinkleSpeed}
                    setStarTwinkleSpeed={setStarTwinkleSpeed}
                    starTwinkleMode={starTwinkleMode}
                    setStarTwinkleMode={setStarTwinkleMode}
                    starMeteors={starMeteors}
                    setStarMeteors={setStarMeteors}
                    starMeteorFrequency={starMeteorFrequency}
                    setStarMeteorFrequency={setStarMeteorFrequency}
                    starNebulaGlow={starNebulaGlow}
                    setStarNebulaGlow={setStarNebulaGlow}
                    starBrightness={starBrightness}
                    setStarBrightness={setStarBrightness}
                    onResetAllLayouts={resetAllPanelLayouts}
                />
            </div>

            {/* Modal de Calendário (Acessado pelo Card da Lua ou Ações de Data) */}
            <AnimatePresence>
                {showCalendarPanel && (
                    <div 
                        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4" 
                        onMouseDown={e => { if (e.target === e.currentTarget) setShowCalendarPanel(false); }}
                    >
                        <CalendarPanel 
                            isOpen={showCalendarPanel}
                            onClose={() => setShowCalendarPanel(false)}
                            currentDate={currentTime}
                            defaultView={calendarConfig.defaultView}
                            defaultLunarView={calendarConfig.defaultLunarView}
                            onDateSelect={(date) => { setCurrentTime(date); setIsRealTime(false); }}
                            locationName={location.displayName}
                            latitude={location.latitude}
                            onLocationChange={(loc) => { setLocation({ latitude: loc.latitude, longitude: loc.longitude, displayName: loc.displayName }); }}
                            theme={theme}
                            savedMaps={savedMaps}
                            onLoadMap={handleLoadMap}
                            isFreeTier={isFreeTier}
                            onOpenPaymentPlans={() => setShowPaymentPlansModal(true)}
                        />
                    </div>
                )}
            </AnimatePresence>

            {/* Painel Administrativo Standalone Exclusivo para Super Admin */}
            <AdminDashboard
                isOpen={showAdminDashboard}
                onClose={() => setShowAdminDashboard(false)}
                adminEmail={userEmail}
            />

            {/* Modal de Login / Cadastro */}
            <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onSuccess={(user) => {
                    setIsAuthenticated(true);
                    resetTrial();
                    if (user?.username) setUsername(user.username);
                    if (user?.email) setUserEmail(user.email);
                    setIsAdmin(user?.email?.toLowerCase() === 'rafael.cm333@gmail.com' || !!user?.isAdmin);
                    setShowLoginModal(false);
                    setShowPaymentPlansModal(false);
                }}
            />
        </div>
    );
};
