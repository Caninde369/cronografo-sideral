
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useCelestialData, CelestialData } from './hooks/useCelestialData';
import { SiderealClock } from './components/SiderealClock';
import { CelestialBodyPanel, CelestialSettings } from './components/CelestialBodyPanel';
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
import { TransitChart } from './components/TransitChart';
import { StarField } from './components/StarField';
import { Dashboard } from './components/Dashboard';
import { TimeControls, SizeControl } from './components/Controls';
import { UI_ICONS, ZODIAC_ICONS } from './components/icons';
import { LocationSearchInput } from './components/LocationSearchInput';
import { calculateTransitNatalAspects, Aspect } from './lib/astrology/aspects';
import { normalizeAngle } from './lib/astrology/utils';
import { getSeasonInfo, getNextMoonPhases, getSeasonIngresses } from './lib/astrology/calendars';
import { getMoonPhaseInfo } from './lib/astrology/moon';
import { useLanguage } from './i18n';
import { ExportPDFButton } from './components/ExportPDFButton';
import { useTrialTimer } from './hooks/useTrialTimer';

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
    chiron: false, ceres: false, pallas: false, juno: false, vesta: false
};

const getBodiesFromData = (data: CelestialData, visible: Record<string, boolean>) => {
    const bodies: any[] = [];
    const knownIds = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'lilith', 'northNode', 'southNode', 'chiron', 'ceres', 'pallas', 'juno', 'vesta'];

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
    // --- State ---
    const [currentTime, setCurrentTime] = useState<Date>(new Date());
    const [isRealTime, setIsRealTime] = useState(true);
    const [timeStep, setTimeStep] = useState<'min' | 'hour' | 'day' | 'month' | 'year'>('day');
    const [speedMultiplier, setSpeedMultiplier] = useState<1 | 2 | 5>(1); 
    const [location, setLocation] = useState(DEFAULT_LOCATION);
    
    // UI Layout State
    const [panelWidths, setPanelWidths] = useState<Record<string, number>>({});
    const [rightPanelScale, setRightPanelScale] = useState(1.0);
    const [leftPanelScale, setLeftPanelScale] = useState(1.0);

    const [visiblePlanets, setVisiblePlanets] = useState(DEFAULT_VISIBLE_PLANETS);
    const [selectedPlanets, setSelectedPlanets] = useState<string[]>([]);
    const [selectedAspects, setSelectedAspects] = useState<string[]>([]);
    const [selectedHouses, setSelectedHouses] = useState<number[]>([]);
    const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
    const [hoveredAspect, setHoveredAspect] = useState<string | null>(null);
    const [hoveredHouse, setHoveredHouse] = useState<number | null>(null);
    
    // Visual Settings
    const [clockPlanetSize, setClockPlanetSize] = useState(32);
    const [zodiacSignSize, setZodiacSignSize] = useState(34);
    const [panelPlanetSize, setPanelPlanetSize] = useState(12);
    const [panelZodiacSignSize, setPanelZodiacSignSize] = useState(14);
    const [showPlanetSpheres, setShowPlanetSpheres] = useState(true);
    const [showDegreeLabels, setShowDegreeLabels] = useState(false);
    const [degreeLabelSize, setDegreeLabelSize] = useState(9);
    const [showAspectLines, setShowAspectLines] = useState(true);
    const [showNatalLines, setShowNatalLines] = useState(false);
    const [celestialTab, setCelestialTab] = useState<'transit' | 'natal'>('transit');
    const [showNeedle, setShowNeedle] = useState(false);
    const [showMagneticField, setShowMagneticField] = useState(false);
    const [magneticFieldSize, setMagneticFieldSize] = useState(1);
    const [magneticFieldOpacity, setMagneticFieldOpacity] = useState(0.5);
    const [showTimeRing, setShowTimeRing] = useState(true);
    const [showOrbits, setShowOrbits] = useState(true);
    const [showStars, setShowStars] = useState(true);
    const [showSeasonsRing, setShowSeasonsRing] = useState(true);
    const [isZodiacFixed, setIsZodiacFixed] = useState(false);
    const [showAtmosphere, setShowAtmosphere] = useState(false);
    const [showHouseLines, setShowHouseLines] = useState(true);
    const [showHouseMarkers, setShowHouseMarkers] = useState(true);
    const [houseLineThickness, setHouseLineThickness] = useState(1);
    const [houseLineOpacity, setHouseLineOpacity] = useState(0.4);
    const [showSignLines, setShowSignLines] = useState(false);
    const [signLineThickness, setSignLineThickness] = useState(1);
    const [signLineOpacity, setSignLineOpacity] = useState(0.3);
    const [showMcIcArrows, setShowMcIcArrows] = useState(false);
    const [isLeftPanelVisible, setIsLeftPanelVisible] = useState(true);
    const [isRightPanelVisible, setIsRightPanelVisible] = useState(true);
    const [isTimeControlsMinimized, setIsTimeControlsMinimized] = useState(false);
    const [immersiveMode, setImmersiveMode] = useState(false);
    const [showEclipseModal, setShowEclipseModal] = useState(false);
    const [activeAstronomyTab, setActiveAstronomyTab] = useState<'phases' | 'eclipses' | 'other'>('phases');
    const [zodiacColorMode, setZodiacColorMode] = useState<'none' | 'element' | 'modality' | 'polarity'>('element');
    const [highlightFilter, setHighlightFilter] = useState<HighlightFilter>(null);
    
    // New Toolbar Settings
    const [pointerStyle, setPointerStyle] = useState<'solid' | 'dashed'>('solid');
    const [pointerThickness, setPointerThickness] = useState(1);
    const [pointerHead, setPointerHead] = useState<'arrow' | 'circle' | 'diamond' | 'square' | 'none'>('arrow');
    const [pointerTail, setPointerTail] = useState<'arrow' | 'circle' | 'diamond' | 'square' | 'none'>('none');

    const [clockScale, setClockScale] = useState(1.0);
    const [celestialSettings, setCelestialSettings] = useState<CelestialSettings>({
        planets: { symbols: true, glyphs: false, colors: true, names: true, namesColors: true, namesAbbr: true },
        signs: { enabled: true, symbols: true, colors: true, abbr: false },
        houses: { enabled: true, format: 'roman' },
        degrees: true,
        retrograde: true
    });
    const [aspectSettings, setAspectSettings] = useState<AspectSettings>({
        planets: { symbols: true, glyphs: false, colors: true, names: false, nameColors: false },
        signs: { enabled: true, colors: true },
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
        orb: true
    });
    const [houseCuspsLayout, setHouseCuspsLayout] = useState<'minimal' | 'complete'>('minimal');
    const [showCuspDegrees, setShowCuspDegrees] = useState(true);
    const [statsLayout, setStatsLayout] = useState<'minimal' | 'complete'>('complete');
    const [sectionOrder, setSectionOrder] = useState<('celestial' | 'chronograph' | 'details')[]>(['celestial', 'chronograph', 'details']);

    useEffect(() => {
        setSectionOrder(['celestial', 'chronograph', 'details']);
        setLeftPanels(['celestial', 'cusps']);
        setRightPanels(['aspects', 'statistics']);
    }, []);
    
    type PanelId = 'celestial' | 'cusps' | 'aspects' | 'statistics';
    const [leftPanels, setLeftPanels] = useState<PanelId[]>(['celestial', 'cusps']);
    const [rightPanels, setRightPanels] = useState<PanelId[]>(['aspects', 'statistics']);
    
    const leftPanelWidth = leftPanels.length > 0 ? Math.max(160, ...leftPanels.map(id => panelWidths[id] || 160)) : 0;
    const rightPanelWidth = rightPanels.length > 0 ? Math.max(160, ...rightPanels.map(id => panelWidths[id] || 160)) : 0;

    const handleCelestialWidthChange = useCallback((width: number) => {
        setPanelWidths(prev => prev.celestial === width ? prev : { ...prev, celestial: width });
    }, []);

    const handleCuspsWidthChange = useCallback((width: number) => {
        setPanelWidths(prev => prev.cusps === width ? prev : { ...prev, cusps: width });
    }, []);

    const handleAspectsWidthChange = useCallback((width: number) => {
        setPanelWidths(prev => prev.aspects === width ? prev : { ...prev, aspects: width });
    }, []);

    const handleStatisticsWidthChange = useCallback((width: number) => {
        setPanelWidths(prev => prev.statistics === width ? prev : { ...prev, statistics: width });
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
        } else if (draggedItem?.type === 'panel') {
            const panelId = draggedItem.id as PanelId;
            if (id === 'celestial') {
                setRightPanels(prev => prev.filter(p => p !== panelId));
                setLeftPanels(prev => prev.includes(panelId) ? prev : [...prev, panelId]);
            } else if (id === 'details') {
                setLeftPanels(prev => prev.filter(p => p !== panelId));
                setRightPanels(prev => prev.includes(panelId) ? prev : [...prev, panelId]);
            }
        }
    };

    const handlePanelDragOver = (e: React.DragEvent, id: PanelId, column: 'left' | 'right') => {
        e.preventDefault();
        e.stopPropagation();
        if (draggedItem?.type === 'panel' && draggedItem.id !== id) {
            const sourceId = draggedItem.id as PanelId;
            const isLeft = column === 'left';
            
            const updatePanels = (prev: PanelId[]) => {
                const currentIndex = prev.indexOf(sourceId);
                const targetIndex = prev.indexOf(id);
                
                if (currentIndex === targetIndex) return prev;

                const newPanels = prev.filter(p => p !== sourceId);
                const newTargetIndex = newPanels.indexOf(id);
                if (newTargetIndex !== -1) {
                    newPanels.splice(newTargetIndex, 0, sourceId);
                } else {
                    newPanels.push(sourceId);
                }
                
                if (prev.length === newPanels.length && prev.every((v, i) => v === newPanels[i])) {
                    return prev;
                }
                return newPanels;
            };

            if (isLeft) {
                setRightPanels(prev => prev.filter(p => p !== sourceId));
                setLeftPanels(updatePanels);
            } else {
                setLeftPanels(prev => prev.filter(p => p !== sourceId));
                setRightPanels(updatePanels);
            }
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
    const [houseLineFormat, setHouseLineFormat] = useState<'solid' | 'dashed'>('solid');

    const [activeMenu, setActiveMenu] = useState<WidgetId | null>(null);
    const [showTransitChart, setShowTransitChart] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'fullscreen'>('grid');
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showCalendarPanel, setShowCalendarPanel] = useState(false);
    const [showChronographMenu, setShowChronographMenu] = useState(false);
    const [activeChronographMenu, setActiveChronographMenu] = useState<'background' | 'display' | 'colors' | null>(null);

    const [timeRingScale, setTimeRingScale] = useState(1.0);
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    
    // --- Settings Modal State (Main Clock) ---
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [tempDate, setTempDate] = useState('');
    const [tempTime, setTempTime] = useState('');
    const [tempLocationIndex, setTempLocationIndex] = useState<number>(-1);
    const [tempLocationText, setTempLocationText] = useState<string>('');

    // --- Auth State ---
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [username, setUsername] = useState('');
    const [isAuthChecking, setIsAuthChecking] = useState(true);
    const [showDashboard, setShowDashboard] = useState(false);
    const [dashboardTab, setDashboardTab] = useState<'profile' | 'maps' | 'layouts' | 'admin'>('profile');
    const [showLogin, setShowLogin] = useState(false);
    const [showLeadGate, setShowLeadGate] = useState(false);
    const [showLeadCheckoutTrial, setShowLeadCheckoutTrial] = useState(false);
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    const { trialActive, timeLeft, isExpired, startTrial, resetTrial } = useTrialTimer(isAuthenticated);

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
        }
    }, [theme]);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/auth/check');
                const data = await res.json();
                setIsAuthenticated(data.authenticated);
                setIsAdmin(data.isAdmin);
                if (data.username) setUsername(data.username);
            } catch (err) {
                console.error("Auth check failed", err);
                setIsAuthenticated(false);
            } finally {
                setIsAuthChecking(false);
            }
        };
        checkAuth();
    }, []);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            setIsAuthenticated(false);
            resetTrial(); // Reset trial state on logout
        } catch (err) {
            console.error("Logout failed", err);
        }
    };

    // --- Natal Chart State ---
    const [natalTime, setNatalTime] = useState<Date | null>(null);
    const [natalLocation, setNatalLocation] = useState(DEFAULT_LOCATION);
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
    const celestialData = useCelestialData(currentTime, location, visiblePlanets);
    const natalData = useCelestialData(natalTime, natalLocation, visiblePlanets);
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
        const natalBodies = getBodiesFromData(natalData, visiblePlanets);
        return calculateTransitNatalAspects(transitBodies, natalBodies);
    }, [celestialData, natalData, natalTime, visiblePlanets]);


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

        const relevantAspects = activeAspectSource.filter(aspect => 
            selectedPlanets.includes(aspect.body1.id) || selectedPlanets.includes(aspect.body2.id)
        );

        const ghosts = new Set<string>();
        relevantAspects.forEach(aspect => {
            if (aspect.isNatal) {
                // For natal aspects, body1 is transit, body2 is natal
                if (selectedPlanets.includes(aspect.body1.id) && !selectedPlanets.includes(aspect.body2.id)) {
                    ghosts.add(aspect.body2.id);
                }
            } else {
                // For transit aspects, both are transit
                if (selectedPlanets.includes(aspect.body1.id) && !selectedPlanets.includes(aspect.body2.id)) {
                    ghosts.add(aspect.body2.id);
                }
                if (selectedPlanets.includes(aspect.body2.id) && !selectedPlanets.includes(aspect.body1.id)) {
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
    }, [celestialData.aspects, transitNatalAspects]);

    // --- Handlers ---
    const handlePlanetClick = useCallback((id: string) => {
        setSelectedPlanets(prev => 
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    }, []);

    const handlePlanetRightClick = (id: string) => {
        setVisiblePlanets(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
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
        setShowCalendarPanel(prev => !prev);
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
        const hours = String(initTime.getHours()).padStart(2, '0');
        const minutes = String(initTime.getMinutes()).padStart(2, '0');
        setTempNatalTime(`${hours}:${minutes}`);
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
    const clockRef = useRef<HTMLDivElement>(null);

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
            if (showCalendarPanel && !isInside(menuRefs.calendar)) {
                setShowCalendarPanel(false);
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
        setShowOptionsMenu(!showOptionsMenu);
    };

    const handleClearNatal = (e: React.MouseEvent) => {
        e.stopPropagation();
        setNatalTime(null);
        setShowNatalLines(false);
    };

    // Gradient Background for the entire app
    const bgClass = "bg-brand-dark";

    const renderPanel = (id: PanelId, position: 'left' | 'right') => {
        const dragHandle = (
            <div 
                draggable 
                onDragStart={(e) => handleDragStart(e, id, 'panel')}
                onDragEnd={handleDragEnd}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-brand-surface-highlight rounded transition-colors"
            >
                <UI_ICONS.DragHandleIcon className="w-3 h-3 text-brand-text-muted" />
            </div>
        );

        const handlePanelPositionChange = (pos: 'left' | 'right') => {
            if (pos === 'left') {
                setRightPanels(prev => prev.filter(p => p !== id));
                setLeftPanels(prev => prev.includes(id) ? prev : [...prev, id]);
            } else {
                setLeftPanels(prev => prev.filter(p => p !== id));
                setRightPanels(prev => prev.includes(id) ? prev : [...prev, id]);
            }
        };

        const isDragged = draggedItem?.type === 'panel' && draggedItem.id === id;
        const dragClass = isDragged ? 'border-2 border-dashed border-blue-400 bg-blue-400/10 rounded-3xl scale-95 overflow-hidden relative opacity-50' : '';

        const dropIndicator = isDragged ? (
            <div className="drop-indicator absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                <span className="text-blue-400/50 font-medium text-sm">Solte aqui</span>
            </div>
        ) : null;

        switch (id) {
            case 'celestial':
                return (
                    <div 
                        key="celestial" 
                        className={`panel-wrapper flex-1 min-h-0 max-h-full flex flex-col overflow-hidden ${dragClass}`}
                        onDragOver={(e) => handlePanelDragOver(e, id, position)}
                    >
                        {dropIndicator}
                        <CelestialBodyPanel 
                            {...(celestialTab === 'natal' && natalTime ? natalData : celestialData)} 
                            retrogradeStatus={celestialTab === 'natal' && natalTime ? natalData.retrogradeStatus : celestialData.retrogradeStatus}
                            housePlacements={celestialTab === 'natal' && natalTime ? natalData.housePlacements : celestialData.housePlacements}
                            visiblePlanets={visiblePlanets}
                            onVisibilityChange={setVisiblePlanets}
                            selectedPlanets={selectedPlanets}
                            secondarySelectedPlanets={highlightedPlanetsFromAspects}
                            onPlanetClick={handlePlanetClick}
                            onPlanetRightClick={handlePlanetRightClick}
                            onPlanetHover={setHoveredPlanet}
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
                            panelScale={position === 'left' ? leftPanelScale : rightPanelScale}
                            onPanelScaleChange={position === 'left' ? setLeftPanelScale : setRightPanelScale}
                            panelPosition={position}
                            onPanelPositionChange={handlePanelPositionChange}
                            dragHandle={dragHandle}
                            activeTab={celestialTab}
                            onTabChange={setCelestialTab}
                            hasNatalDate={!!natalTime}
                        />
                    </div>
                );
            case 'cusps':
                return (
                    <div 
                        key="cusps" 
                        className={`panel-wrapper shrink-0 flex flex-col ${dragClass}`}
                        onDragOver={(e) => handlePanelDragOver(e, id, position)}
                    >
                        {dropIndicator}
                        <HouseCuspsPanel 
                            ascendantLongitude={celestialTab === 'natal' && natalTime ? natalData.ascendantLongitude : celestialData.ascendantLongitude}
                            midheavenLongitude={celestialTab === 'natal' && natalTime ? natalData.midheavenLongitude : celestialData.midheavenLongitude}
                            descendantLongitude={celestialTab === 'natal' && natalTime ? natalData.descendantLongitude : celestialData.descendantLongitude}
                            imumCoeliLongitude={celestialTab === 'natal' && natalTime ? natalData.imumCoeliLongitude : celestialData.imumCoeliLongitude}
                            houseCusps={celestialTab === 'natal' && natalTime ? natalData.houseCusps : celestialData.houseCusps}
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
                            scale={position === 'left' ? leftPanelScale : rightPanelScale}
                            showHouseLines={showHouseLines}
                            setShowHouseLines={setShowHouseLines}
                            zodiacColorMode={zodiacColorMode}
                            showSignLines={showSignLines}
                            setShowSignLines={setShowSignLines}
                            layoutMode={houseCuspsLayout}
                            onLayoutChange={setHouseCuspsLayout}
                            panelPosition={position}
                            onWidthChange={handleCuspsWidthChange}
                            onPanelPositionChange={handlePanelPositionChange}
                            dragHandle={dragHandle}
                        />
                    </div>
                );
            case 'aspects':
                return (
                    <div 
                        key="aspects" 
                       className={`panel-wrapper flex-1 min-h-0 flex flex-col overflow-visible ${dragClass}`}
                        onDragOver={(e) => handlePanelDragOver(e, id, position)}
                    >
                        {dropIndicator}
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
                            scale={position === 'left' ? leftPanelScale : rightPanelScale}
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
                            panelScale={position === 'left' ? leftPanelScale : rightPanelScale}
                            onPanelScaleChange={position === 'left' ? setLeftPanelScale : setRightPanelScale}
                            panelPosition={position}
                            onWidthChange={handleAspectsWidthChange}
                            onPanelPositionChange={handlePanelPositionChange}
                            dragHandle={dragHandle}
                        />
                    </div>
                );
            case 'statistics':
                return (
                    <div 
                        key="statistics" 
                        className={`panel-wrapper shrink-0 flex flex-col ${dragClass}`}
                        onDragOver={(e) => handlePanelDragOver(e, id, position)}
                    >
                        {dropIndicator}
                        <ChartStatisticsPanel 
                            celestialData={celestialData}
                            scale={position === 'left' ? leftPanelScale : rightPanelScale}
                            zodiacColorMode={zodiacColorMode}
                            onZodiacColorModeChange={setZodiacColorMode}
                            highlightFilter={highlightFilter}
                            onHighlightFilterChange={setHighlightFilter}
                            layoutMode={statsLayout}
                            onLayoutChange={setStatsLayout}
                            activeMenu={activeMenu}
                            setActiveMenu={setActiveMenu}
                            panelPosition={position}
                            onPanelPositionChange={handlePanelPositionChange}
                            onWidthChange={handleStatisticsWidthChange}
                            dragHandle={dragHandle}
                            seasonInfo={seasonInfo}
                            sunriseTime={celestialData.sunriseTime}
                            sunsetTime={celestialData.sunsetTime}
                            moonPhase={celestialData.moonPhase}
                            moonriseTime={celestialData.moonriseTime}
                            moonsetTime={celestialData.moonsetTime}
                            onEclipseClick={() => setShowEclipseModal(true)}
                        />
                    </div>
                );
        }
    };

    if (isAuthChecking) {
        return (
            <div className={`h-screen w-screen ${bgClass} flex items-center justify-center`}>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-purple"></div>
            </div>
        );
    }

    if (!isAuthenticated && !trialActive) {
        if (!showLogin && !showLeadGate) {
            return <LandingPage onEnter={() => setShowLogin(true)} onRegister={() => setShowLeadGate(true)} />;
        }
        if (showLeadGate) {
            return <LeadGate 
                onComplete={() => {
                    setShowLeadGate(false);
                    startTrial();
                }} 
                onBack={() => setShowLeadGate(false)}
            />;
        }
        return <LoginScreen onLoginSuccess={(user) => {
            setIsAuthenticated(true);
            resetTrial(); // Remove trial limits on successful login
            if (user?.username) setUsername(user.username);
            if (user?.isAdmin !== undefined) setIsAdmin(user.isAdmin);
            // Re-check admin status after login to be sure
            fetch('/api/auth/check').then(res => res.json()).then(data => {
                if (data.authenticated) {
                    setIsAdmin(data.isAdmin);
                    if (data.username) setUsername(data.username);
                }
            });
        }} onBack={() => setShowLogin(false)} />;
    }

    return (
        <div className={`h-screen w-screen ${bgClass} text-brand-text overflow-hidden flex flex-col font-serif selection:bg-brand-purple/30`}>
            {!isAuthenticated && trialActive && !isExpired && timeLeft !== null && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
                    <div className="px-5 py-2.5 rounded-full bg-black/80 border border-brand-gold/30 backdrop-blur-md flex items-center gap-3 shadow-lg">

                        {/* Indicador online */}
                        <div className="relative flex-shrink-0">
                            <div className="w-2 h-2 rounded-full bg-emerald-400" />
                            <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
                        </div>

                        {/* Label + Timer */}
                        <span className="font-manrope text-[10px] tracking-widest uppercase text-brand-gold whitespace-nowrap">
                            Acesso gratuito · {Math.floor(timeLeft / 60000).toString().padStart(2, '0')}:{(Math.floor(timeLeft / 1000) % 60).toString().padStart(2, '0')}
                        </span>

                        {/* Divisor */}
                        <div className="w-px h-3 bg-brand-gold/30 flex-shrink-0" />

                        {/* Botão */}
                        <button
                            onClick={() => setShowLeadCheckoutTrial(true)}
                            className="font-manrope font-bold uppercase tracking-widest transition-all hover:opacity-80 active:scale-[0.97] whitespace-nowrap flex-shrink-0"
                            style={{
                                fontSize: '10px',
                                color: '#000',
                                background: '#D4AF37',
                                border: 'none',
                                borderRadius: '999px',
                                padding: '4px 14px',
                                cursor: 'pointer',
                            }}
                        >
                            Quero ser Fundador
                        </button>

                    </div>

                    {showLeadCheckoutTrial && (
                        <LeadCheckoutModal
                            isOpen={showLeadCheckoutTrial}
                            onClose={() => setShowLeadCheckoutTrial(false)}
                        />
                    )}
                </div>
            )}
            {!isAuthenticated && isExpired && (
                <PaywallModal 
                    onLoginClick={() => {
                        // Clear trial state and show login screen
                        resetTrial();
                        window.location.hash = '#login';
                        setShowLogin(true);
                        setShowLeadGate(false);
                    }} 
                    onBackToLanding={() => {
                        resetTrial();
                        setShowLogin(false);
                        setShowLeadGate(false);
                        window.location.hash = '';
                    }}
                    onFounderClick={() => setShowLeadCheckoutTrial(true)}
                />
            )}
            {showDashboard && (
                <Dashboard 
                    onClose={() => setShowDashboard(false)} 
                    isAdmin={isAdmin}
                    username={username}
                    natalDate={tempNatalDate || (natalTime ? natalTime.toISOString().split('T')[0] : '')}
                    natalTime={tempNatalTime || (natalTime ? natalTime.toTimeString().split(' ')[0].substring(0, 5) : '')}
                    initialTab={dashboardTab}
                    onEditNatal={() => {
                        setIsNatalSettingsOpen(true);
                        setShowDashboard(false);
                    }}
                />
            )}
            <main className={`flex-grow flex overflow-hidden relative ${immersiveMode ? '' : 'p-1.5 gap-1.5'}`}>
                {/* Left Panel */}
                <div className="flex flex-row h-full" style={{ order: sectionOrder.indexOf('celestial') }}>
                    <aside 
                        onDragOver={(e) => handleDragOver(e, 'celestial')}
                        className={`column-wrapper relative group flex flex-col min-h-0 transition-all duration-300 z-20 ${immersiveMode || !isLeftPanelVisible || (leftPanels.length === 0 && draggedItem?.type !== 'panel') ? 'hidden' : ''} ${draggedItem?.type === 'column' && draggedItem.id === 'celestial' ? 'opacity-50 grayscale scale-95' : ''}`}
                        style={{  
                            width: leftPanels.length === 0 ? '200px' : `${leftPanelWidth}px`
                        }}
                    >
                       <div className="flex-1 min-h-0 flex flex-col gap-1.5 h-full overflow-hidden">
                            {leftPanels.length === 0 && draggedItem?.type === 'panel' && (
                                <div className="flex-1 border-2 border-dashed border-blue-400/50 bg-blue-400/10 rounded-3xl flex items-center justify-center transition-all">
                                    <span className="text-blue-400/50 font-medium text-sm">Solte aqui</span>
                                </div>
                            )}
                            {leftPanels.map(id => renderPanel(id, 'left'))}
                        </div>
                        <button
                            onClick={() => setIsLeftPanelVisible(!isLeftPanelVisible)}
                            title={isLeftPanelVisible ? "Recolher painel" : "Expandir painel"}
                            className="absolute -right-3 top-1/2 -translate-y-1/2 z-30
                                       w-6 h-14 rounded-r-xl
                                       bg-brand-surface/90 backdrop-blur-xl
                                       border border-l-0 border-brand-border/20
                                       flex items-center justify-center
                                       text-brand-text-muted hover:text-brand-text
                                       opacity-0 group-hover:opacity-100
                                       transition-all duration-200 shadow-md"
                        >
                            {isLeftPanelVisible
                                ? <UI_ICONS.ChevronLeftIcon className="w-3 h-3" />
                                : <UI_ICONS.ChevronRightIcon className="w-3 h-3" />
                            }
                        </button>
                    </aside>
                </div>

                {/* Chronograph Section */}
                <section 
                    onDragOver={(e) => handleDragOver(e, 'chronograph')}
                    className={`column-wrapper flex-1 relative flex flex-col overflow-hidden ${draggedItem?.type === 'column' && draggedItem.id === 'chronograph' ? 'opacity-50' : ''}`}
                    style={{ order: sectionOrder.indexOf('chronograph') }}
                >
                    {!isLeftPanelVisible && !immersiveMode && (
                        <button
                            onClick={() => setIsLeftPanelVisible(true)}
                            title="Expandir painel"
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-30
                                       w-5 h-14 rounded-r-xl
                                       bg-brand-surface/90 backdrop-blur-xl
                                       border border-brand-border/20
                                       flex items-center justify-center
                                       text-brand-text-muted hover:text-brand-text
                                       transition-all duration-200 shadow-md"
                        >
                            <UI_ICONS.ChevronRightIcon className="w-3 h-3" />
                        </button>
                    )}

                    {!isRightPanelVisible && !immersiveMode && (
                        <button
                            onClick={() => setIsRightPanelVisible(true)}
                            title="Expandir painel"
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-30
                                       w-5 h-14 rounded-l-xl
                                       bg-brand-surface/90 backdrop-blur-xl
                                       border border-brand-border/20
                                       flex items-center justify-center
                                       text-brand-text-muted hover:text-brand-text
                                       transition-all duration-200 shadow-md"
                        >
                            <UI_ICONS.ChevronLeftIcon className="w-3 h-3" />
                        </button>
                    )}
                    <div className="flex-1 flex flex-col bg-brand-surface/40 backdrop-blur-xl rounded-3xl border border-white/8 shadow-sm overflow-hidden relative">
                        {/* Chronograph Header with Drag Handle */}
                        <div className="px-3 py-2 border-b border-brand-border/5 flex justify-between items-center gap-2 flex-shrink-0 bg-brand-surface-highlight/30 z-10">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div 
                                    draggable 
                                    onDragStart={(e) => handleDragStart(e, 'chronograph')}
                                    onDragEnd={handleDragEnd}
                                    className="cursor-grab active:cursor-grabbing p-1 hover:bg-brand-surface-highlight rounded transition-colors"
                                >
                                    <UI_ICONS.DragHandleIcon className="w-3 h-3 text-brand-text-muted" />
                                </div>
                                <h3 className="text-[10px] font-medium uppercase text-brand-text-muted tracking-wider truncate font-outfit">Cronógrafo</h3>
                                <div className="h-px bg-brand-border/10 flex-1 ml-2"></div>
                            </div>
                        </div>

                        {/* Background Image */}
                        <div 
                            className="absolute inset-0 z-0 opacity-40 pointer-events-none bg-cover bg-center"
                            style={{ 
                                backgroundImage: customBackgroundImage ? `url(${customBackgroundImage})` : 'url("https://images.unsplash.com/photo-1506318137071-a8e063b4b4bf?auto=format&fit=crop&w=2000&q=80")',
                                mixBlendMode: 'overlay'
                            }}
                        />
                        {/* Background Stars */}
                        {showStars && <StarField opacity={showAtmosphere ? 0.3 : 0.6} className="top-[45px]" />}

                        {/* Header for Sidereal Chronograph */}
                        {!immersiveMode && (
                        <div className="absolute top-14 left-4 z-50 flex items-start gap-2">
                             {/* Profile Button */}
                             <div className="relative pointer-events-auto" ref={menuRefs.profile}>
                                <button 
                                    onClick={toggleProfileMenu}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors border border-white/10 shadow-lg ${showProfileMenu ? 'bg-brand-surface-highlight text-brand-text' : 'bg-brand-surface/80 backdrop-blur-md text-brand-text-muted hover:text-brand-text hover:bg-brand-surface-highlight/80'}`}
                                        title="Perfil"
                                    >
                                        <UI_ICONS.UserIcon className="w-5 h-5" />
                                    </button>

                                    {showProfileMenu && (
                                        <div className="absolute left-0 top-full mt-2 bg-brand-surface/95 backdrop-blur-xl border border-brand-border/10 rounded-2xl p-2 shadow-2xl w-48 flex flex-col gap-1 z-[100] ring-1 ring-brand-border/5 font-manrope animate-in fade-in zoom-in-95 duration-100">
                                            <button 
                                                onClick={() => {
                                                    setDashboardTab('profile');
                                                    setShowDashboard(true);
                                                    setShowProfileMenu(false);
                                                }}
                                                className="w-full px-3 py-2 rounded-lg flex items-center gap-3 transition-colors hover:bg-brand-surface-highlight text-brand-text-muted hover:text-brand-purple"
                                            >
                                                <UI_ICONS.UserIcon className="w-4 h-4" />
                                                <span className="text-xs font-manrope">{t('app.dashboard')}</span>
                                            </button>

                                            {isAdmin && (
                                                <button 
                                                    onClick={() => {
                                                        setDashboardTab('admin');
                                                        setShowDashboard(true);
                                                        setShowProfileMenu(false);
                                                    }}
                                                    className="w-full px-3 py-2 rounded-lg flex items-center gap-3 transition-colors hover:bg-brand-surface-highlight text-brand-text-muted hover:text-brand-purple"
                                                >
                                                    <UI_ICONS.LayersIcon className="w-4 h-4" />
                                                    <span className="text-xs font-manrope">{t('app.adminPanel')}</span>
                                                </button>
                                            )}
                                            
                                            <button 
                                                onClick={handleLogout}
                                                className="w-full px-3 py-2 rounded-lg flex items-center gap-3 transition-colors hover:bg-red-500/10 text-brand-text-muted hover:text-red-400"
                                            >
                                                <UI_ICONS.LogoutIcon className="w-4 h-4" />
                                                <span className="text-xs font-manrope">{t('app.logout')}</span>
                                            </button>
                                        </div>
                                    )}
                                 </div>

                                 {/* Botão Natal */}
                                 <div ref={menuRefs.calendar} className="relative pointer-events-auto flex items-center gap-1">
                                     {natalTime ? (
                                         <button 
                                             onClick={openNatalSettings}
                                             className="h-10 px-3 gap-2 rounded-xl flex items-center justify-center transition-colors border border-white/10 shadow-lg bg-brand-surface/80 backdrop-blur-xl ring-1 ring-brand-orange/30 shadow-[0_0_15px_rgba(249,115,22,0.1)] hover:bg-brand-surface-highlight/50"
                                             title={t('chrono.searchDate')}
                                         >
                                             <div className="flex flex-col justify-center flex-1 overflow-hidden font-manrope">
                                                 <div className="flex items-center justify-center gap-2">
                                                     <span className="text-sm font-mono font-bold text-brand-orange tracking-wider">
                                                         {natalTime.getHours().toString().padStart(2, '0')}:{natalTime.getMinutes().toString().padStart(2, '0')}
                                                     </span>
                                                     <span className="text-[10px] text-brand-orange/70 font-medium">
                                                         {natalTime.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                     </span>
                                                 </div>
                                             </div>
                                         </button>
                                     ) : (
                                         <button
                                             onClick={openNatalSettings}
                                             title="Definir Mapa Natal"
                                             style={{ transition: 'width 300ms ease' }}
                                             className={`natal-btn h-10 rounded-xl flex items-center overflow-hidden border border-white/10 shadow-lg w-10 hover:w-36
                                                 ${theme === 'dark'
                                                     ? 'bg-brand-surface/80 backdrop-blur-md text-brand-text-muted hover:text-brand-text hover:bg-brand-surface-highlight/80'
                                                     : 'bg-white/90 backdrop-blur-md text-gray-500 hover:text-gray-700 hover:bg-white'
                                                 }`}
                                         >
                                             <span className="flex items-center justify-center w-10 flex-shrink-0">
                                                 <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                                     <path d="M10 2l2.09 4.26L17 7.27l-3.5 3.41.83 4.82L10 13.27l-4.33 2.23.83-4.82L3 7.27l4.91-.01L10 2z"/>
                                                 </svg>
                                             </span>
                                             <span className="text-[9px] font-bold uppercase tracking-widest font-technical whitespace-nowrap pr-3">
                                                 NATAL
                                             </span>
                                         </button>
                                     )}
                                     {natalTime && (
                                         <button
                                             onClick={handleClearNatal}
                                             className="w-6 h-10 rounded-lg flex items-center justify-center bg-brand-surface/80 backdrop-blur-md border border-white/10 text-brand-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors shadow-lg animate-in fade-in zoom-in duration-200"
                                             title={t('chrono.clearNatal')}
                                         >
                                             <UI_ICONS.CloseIcon className="w-3 h-3" />
                                         </button>
                                     )}
                                     <AnimatePresence>
                                         {showCalendarPanel && (
                                             <div className="absolute top-full left-0 mt-2 z-50">
                                                 <CalendarPanel 
                                                     isOpen={showCalendarPanel}
                                                     onClose={() => setShowCalendarPanel(false)}
                                                     currentDate={currentTime}
                                                     onDateSelect={(date) => {
                                                         setCurrentTime(date);
                                                         setIsRealTime(false);
                                                     }}
                                                     locationName={location.displayName}
                                                     onLocationChange={(loc) => {
                                                         setLocation({
                                                             latitude: loc.latitude,
                                                             longitude: loc.longitude,
                                                             displayName: loc.displayName,
                                                         });
                                                     }}
                                                     theme={theme}
                                                 />
                                             </div>
                                         )}
                                     </AnimatePresence>
                                 </div>
                            </div>
                        )}
                        
                        {!immersiveMode && (
                        <div className="absolute top-28 left-4 z-50 flex flex-col items-start gap-2 pointer-events-none">

{/* TOOLBAR INÍCIO */}
<div
    className="pointer-events-auto relative"
    onMouseEnter={() => {
        toolbarHoveredRef.current = true;
        setToolbarVisible(true);
        if (toolbarHideTimer.current) {
            clearTimeout(toolbarHideTimer.current);
            toolbarHideTimer.current = null;
        }
    }}
    onMouseLeave={() => {
        toolbarHoveredRef.current = false;
        if (activeToolbarMenuRef.current === null) {
            if (toolbarHideTimer.current) clearTimeout(toolbarHideTimer.current);
            toolbarHideTimer.current = window.setTimeout(() => {
                if (!toolbarHoveredRef.current && activeToolbarMenuRef.current === null) {
                    setToolbarVisible(false);
                }
            }, 2500);
        }
    }}
    onClick={() => {
        setToolbarVisible(true);
        if (toolbarHideTimer.current) clearTimeout(toolbarHideTimer.current);
        toolbarHideTimer.current = window.setTimeout(() => {
            if (!toolbarHoveredRef.current && activeToolbarMenuRef.current === null) {
                setToolbarVisible(false);
            }
        }, 2500);
    }}
>
    {/* ESTADO OCULTO — linha vertical estilo iPhone home bar */}
    {!toolbarVisible && (
        <div
            className="flex items-center justify-center cursor-pointer"
            style={{
                width: '20px',
                height: '160px',
                padding: '4px',
            }}
            onClick={() => {
                setToolbarVisible(true);
                if (toolbarHideTimer.current) clearTimeout(toolbarHideTimer.current);
            }}
        >
            <div
                style={{
                    width: '3px',
                    height: '100%',
                    borderRadius: '999px',
                    background: theme === 'dark'
                        ? 'rgba(255,255,255,0.15)'
                        : 'rgba(0,0,0,0.12)',
                    transition: 'all 0.2s ease',
                }}
                className="hover:!bg-purple-400/50 hover:!w-[4px]"
            />
        </div>
    )}

    {/* TOOLBAR EXPANDIDA */}
    {toolbarVisible && (
        <div className={`flex flex-col gap-0.5 border ${
            theme === 'dark'
                ? 'border-white/10 bg-[rgba(10,10,15,0.75)]'
                : 'border-black/10 bg-white/80'
            } rounded-xl py-2 transition-all duration-300 ease-in-out ${
            activeToolbarMenu !== null ? 'w-40' : 'w-10 hover:w-40 group/toolbar'
            } backdrop-blur-md`}
            style={{
                animation: toolbarVisible ? 'toolbarFadeIn 0.2s ease' : undefined,
            }}
        >
            <style>{`
                @keyframes toolbarFadeIn {
                    from { opacity: 0; transform: translateX(-6px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
            `}</style>

            {/* PONTEIRO */}
            <div className="relative">
                <button
                    onClick={() => setActiveToolbarMenu(m => m === 'pointer' ? null : 'pointer')}
                    className={`flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md transition-colors duration-150 whitespace-nowrap ${activeToolbarMenu === 'pointer' ? (theme === 'dark' ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-600/15 text-purple-700') : (theme === 'dark' ? 'hover:bg-white/[0.07] text-white/60' : 'hover:bg-black/[0.05] text-gray-500')}`}
                    title="Opções do Ponteiro"
                >
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" fill="none">
                        <path d="M5 15 L14 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M14 4 L8 5.5 M14 4 L12.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className={`font-manrope text-[11px] tracking-wide transition-opacity duration-200 ${activeToolbarMenu !== null ? 'opacity-100' : 'opacity-0 group-hover/toolbar:opacity-100'} ${activeToolbarMenu === 'pointer' ? (theme === 'dark' ? 'text-purple-300' : 'text-purple-700') : (theme === 'dark' ? 'text-white/60' : 'text-gray-500')}`}>
                        Ponteiro
                    </span>
                </button>
                {activeToolbarMenu === 'pointer' && (
                    <div data-submenu="true" className="absolute top-0 left-full ml-2 w-64 bg-brand-surface/95 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-2xl z-50 ring-1 ring-white/5 flex flex-col gap-4 font-manrope">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-brand-text-muted font-manrope">Mostrar ponteiro</span>
                            <button onClick={() => setShowNeedle(!showNeedle)} className={`w-8 h-4 rounded-full relative transition-colors ${showNeedle ? 'bg-brand-purple' : 'bg-brand-surface-highlight'}`}>
                                <div className="absolute top-0.5 w-3 h-3 rounded-full bg-brand-text transition-all" style={{ left: showNeedle ? 'calc(100% - 14px)' : '2px' }} />
                            </button>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase text-brand-text-muted font-bold tracking-wider">Estilo da linha</label>
                            <div className="flex gap-2">
                                <button onClick={() => setPointerStyle('solid')} className={`flex-1 py-1.5 rounded-lg text-xs font-manrope border ${pointerStyle === 'solid' ? 'bg-brand-purple/20 border-brand-purple/50 text-white' : 'border-brand-border/10 text-brand-text-muted hover:bg-brand-surface-highlight'}`}>Sólida</button>
                                <button onClick={() => setPointerStyle('dashed')} className={`flex-1 py-1.5 rounded-lg text-xs font-manrope border ${pointerStyle === 'dashed' ? 'bg-brand-purple/20 border-brand-purple/50 text-white' : 'border-brand-border/10 text-brand-text-muted hover:bg-brand-surface-highlight'}`}>Tracejada</button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase text-brand-text-muted font-bold tracking-wider flex justify-between">
                                <span>Espessura</span><span>{pointerThickness}px</span>
                            </label>
                            <input type="range" min="1" max="5" step="1" value={pointerThickness} onChange={(e) => setPointerThickness(Number(e.target.value))} className="w-full accent-brand-purple" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase text-brand-text-muted font-bold tracking-wider">Ponta</label>
                            <div className="grid grid-cols-3 gap-1">
                                {[{id:'arrow',label:'Seta'},{id:'circle',label:'Círculo'},{id:'diamond',label:'Diamante'},{id:'square',label:'Quadrado'},{id:'none',label:'Nenhum'}].map(opt => (
                                    <button key={opt.id} onClick={() => setPointerHead(opt.id as any)} className={`py-1 rounded-lg text-[10px] font-manrope border ${pointerHead === opt.id ? 'bg-brand-purple/20 border-brand-purple/50 text-white' : 'border-white/10 text-brand-text-muted hover:bg-white/5'}`}>{opt.label}</button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase text-brand-text-muted font-bold tracking-wider">Cauda</label>
                            <div className="grid grid-cols-3 gap-1">
                                {[{id:'arrow',label:'Seta'},{id:'circle',label:'Círculo'},{id:'diamond',label:'Diamante'},{id:'square',label:'Quadrado'},{id:'none',label:'Nenhum'}].map(opt => (
                                    <button key={opt.id} onClick={() => setPointerTail(opt.id as any)} className={`py-1 rounded-lg text-[10px] font-manrope border ${pointerTail === opt.id ? 'bg-brand-purple/20 border-brand-purple/50 text-white' : 'border-white/10 text-brand-text-muted hover:bg-white/5'}`}>{opt.label}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className={`h-px ${theme === 'dark' ? 'bg-white/10' : 'bg-black/10'} my-1 mx-0.5`} />

            {/* ANEL 24H */}
            <div className="relative">
                <button
                    onClick={() => setActiveToolbarMenu(m => m === 'timeRing' ? null : 'timeRing')}
                    className={`flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md transition-colors duration-150 whitespace-nowrap ${activeToolbarMenu === 'timeRing' ? (theme === 'dark' ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-600/15 text-purple-700') : (theme === 'dark' ? 'hover:bg-white/[0.07] text-white/60' : 'hover:bg-black/[0.05] text-gray-500')}`}
                    title="Opções do Anel 24h"
                >
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.2"/>
                        <line x1="10" y1="2.8" x2="10" y2="4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <line x1="17.2" y1="10" x2="15.5" y2="10" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                        <line x1="10" y1="17.2" x2="10" y2="15.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                        <line x1="2.8" y1="10" x2="4.5" y2="10" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                        <line x1="10" y1="10" x2="10" y2="5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="10" y1="10" x2="10" y2="3.8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                        <circle cx="10" cy="10" r="1.1" fill="currentColor"/>
                    </svg>
                    <span className={`font-manrope text-[11px] tracking-wide transition-opacity duration-200 ${activeToolbarMenu !== null ? 'opacity-100' : 'opacity-0 group-hover/toolbar:opacity-100'} ${activeToolbarMenu === 'timeRing' ? (theme === 'dark' ? 'text-purple-300' : 'text-purple-700') : (theme === 'dark' ? 'text-white/60' : 'text-gray-500')}`}>
                        Anel 24h
                    </span>
                </button>
                {activeToolbarMenu === 'timeRing' && (
                    <div data-submenu="true" className="absolute top-0 left-full ml-2 w-64 bg-brand-surface/95 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-2xl z-50 ring-1 ring-white/5 flex flex-col gap-4 font-manrope">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-brand-text-muted font-manrope">Mostrar anel 24h</span>
                            <button onClick={() => setShowTimeRing(!showTimeRing)} className={`w-8 h-4 rounded-full relative transition-colors ${showTimeRing ? 'bg-brand-purple' : 'bg-brand-surface-highlight'}`}>
                                <div className="absolute top-0.5 w-3 h-3 rounded-full bg-brand-text transition-all" style={{ left: showTimeRing ? 'calc(100% - 10px)' : '2px' }} />
                            </button>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase text-brand-text-muted font-bold tracking-wider flex justify-between">
                                <span>Escala</span><span>{Math.round(timeRingScale * 100)}%</span>
                            </label>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setTimeRingScale(s => Math.max(0.5, Number((s - 0.1).toFixed(1))))} className="w-8 h-8 flex items-center justify-center bg-brand-surface-highlight/50 hover:bg-brand-surface-highlight rounded-lg text-brand-text border border-brand-border/5">-</button>
                                <div className="flex-1 h-1.5 bg-brand-surface-highlight/50 rounded-full overflow-hidden border border-brand-border/5">
                                    <div className="h-full bg-brand-purple" style={{ width: `${((timeRingScale - 0.5) / (2 - 0.5)) * 100}%` }}></div>
                                </div>
                                <button onClick={() => setTimeRingScale(s => Math.min(2, Number((s + 0.1).toFixed(1))))} className="w-8 h-8 flex items-center justify-center bg-brand-surface-highlight/50 hover:bg-brand-surface-highlight rounded-lg text-brand-text border border-brand-border/5">+</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ASPECTOS */}
            <div className="relative">
                <button
                    onClick={() => setActiveToolbarMenu(m => m === 'aspects' ? null : 'aspects')}
                    className={`flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md transition-colors duration-150 whitespace-nowrap ${activeToolbarMenu === 'aspects' || showAspectLines || showNatalLines ? (theme === 'dark' ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-600/15 text-purple-700') : (theme === 'dark' ? 'hover:bg-white/[0.07] text-white/60' : 'hover:bg-black/[0.05] text-gray-500')}`}
                    title="Linhas de aspectos"
                >
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" fill="none">
                        <circle cx="13.5" cy="5.5" r="2.8" stroke="currentColor" strokeWidth="1.2"/>
                        <circle cx="13.5" cy="5.5" r="0.8" fill="currentColor"/>
                        <circle cx="6.5" cy="14.5" r="2.8" stroke="currentColor" strokeWidth="1.2"/>
                        <circle cx="6.5" cy="14.5" r="0.8" fill="currentColor"/>
                        <line x1="8.5" y1="12.5" x2="11.5" y2="7.5" stroke="currentColor" strokeWidth="0.8" strokeDasharray="1.5 1.5" opacity="0.6"/>
                    </svg>
                    <span className={`font-manrope text-[11px] tracking-wide transition-opacity duration-200 ${activeToolbarMenu !== null ? 'opacity-100' : 'opacity-0 group-hover/toolbar:opacity-100'} ${activeToolbarMenu === 'aspects' || showAspectLines || showNatalLines ? (theme === 'dark' ? 'text-purple-300' : 'text-purple-700') : (theme === 'dark' ? 'text-white/60' : 'text-gray-500')}`}>
                        Aspectos
                    </span>
                </button>
                {activeToolbarMenu === 'aspects' && (
                    <div data-submenu="true" className="absolute top-0 left-full ml-2 w-56 bg-brand-surface/95 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-2xl z-50 ring-1 ring-white/5 flex flex-col gap-4 font-manrope">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-brand-text-muted font-manrope">Linhas de aspectos</span>
                            <button onClick={() => handleToggleAspectLines()} className={`w-8 h-4 rounded-full relative transition-colors ${showAspectLines ? 'bg-brand-purple' : 'bg-brand-surface-highlight'}`}>
                                <div className="absolute top-0.5 w-3 h-3 rounded-full bg-brand-text transition-all" style={{ left: showAspectLines ? 'calc(100% - 14px)' : '2px' }} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-brand-text-muted font-manrope">Aspectos natais</span>
                            <button
                                onClick={() => natalTime && handleToggleNatalLines()}
                                disabled={!natalTime}
                                className={`w-8 h-4 rounded-full relative transition-colors ${showNatalLines ? 'bg-brand-purple' : 'bg-brand-surface-highlight'} ${!natalTime ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <div className="absolute top-0.5 w-3 h-3 rounded-full bg-brand-text transition-all" style={{ left: showNatalLines ? 'calc(100% - 14px)' : '2px' }} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* SIGNOS */}
            <div className="relative">
                <button
                    onClick={() => setShowSignLines(!showSignLines)}
                    className={`flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md transition-colors duration-150 whitespace-nowrap ${showSignLines ? (theme === 'dark' ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-600/15 text-purple-700') : (theme === 'dark' ? 'hover:bg-white/[0.07] text-white/60' : 'hover:bg-black/[0.05] text-gray-500')}`}
                    title="Linhas de signos"
                >
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.2"/>
                        <circle cx="10" cy="10" r="4.5" stroke="currentColor" strokeWidth="0.8" opacity="0.35"/>
                        <line x1="10" y1="3" x2="10" y2="4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                        <line x1="13.5" y1="4" x2="12.8" y2="5.2" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                        <line x1="16" y1="6.5" x2="15" y2="7.4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                        <line x1="17" y1="10" x2="15.5" y2="10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                        <line x1="16" y1="13.5" x2="15" y2="12.6" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                        <line x1="13.5" y1="16" x2="12.8" y2="14.8" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                        <line x1="10" y1="17" x2="10" y2="15.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                        <line x1="6.5" y1="16" x2="7.2" y2="14.8" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                        <line x1="4" y1="13.5" x2="5" y2="12.6" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                        <line x1="3" y1="10" x2="4.5" y2="10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                        <line x1="4" y1="6.5" x2="5" y2="7.4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                        <line x1="6.5" y1="4" x2="7.2" y2="5.2" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                    </svg>
                    <span className={`font-manrope text-[11px] tracking-wide transition-opacity duration-200 ${activeToolbarMenu !== null ? 'opacity-100' : 'opacity-0 group-hover/toolbar:opacity-100'} ${showSignLines ? (theme === 'dark' ? 'text-purple-300' : 'text-purple-700') : (theme === 'dark' ? 'text-white/60' : 'text-gray-500')}`}>
                        Signos
                    </span>
                </button>
            </div>

            {/* CASAS */}
            <div className="relative">
                <button
                    onClick={() => setActiveToolbarMenu(m => m === 'house' ? null : 'house')}
                    className={`flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md transition-colors duration-150 whitespace-nowrap ${activeToolbarMenu === 'house' ? (theme === 'dark' ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-600/15 text-purple-700') : (theme === 'dark' ? 'hover:bg-white/[0.07] text-white/60' : 'hover:bg-black/[0.05] text-gray-500')}`}
                    title="Opções das casas"
                >
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.2" opacity="0.3"/>
                        <line x1="10" y1="10" x2="10" y2="3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                        <line x1="10" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                        <line x1="10" y1="10" x2="10" y2="17" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                        <line x1="10" y1="10" x2="3" y2="10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.45"/>
                        <line x1="10" y1="10" x2="14.9" y2="5.1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.45"/>
                        <line x1="10" y1="10" x2="5.1" y2="14.9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.45"/>
                        <circle cx="10" cy="10" r="1.4" fill="currentColor"/>
                    </svg>
                    <span className={`font-manrope text-[11px] tracking-wide transition-opacity duration-200 ${activeToolbarMenu !== null ? 'opacity-100' : 'opacity-0 group-hover/toolbar:opacity-100'} ${activeToolbarMenu === 'house' ? (theme === 'dark' ? 'text-purple-300' : 'text-purple-700') : (theme === 'dark' ? 'text-white/60' : 'text-gray-500')}`}>
                        Casas
                    </span>
                </button>
                {activeToolbarMenu === 'house' && (
                    <div data-submenu="true" className="absolute top-0 left-full ml-2 w-64 bg-brand-surface/95 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-2xl z-50 ring-1 ring-white/5 flex flex-col gap-4 font-manrope">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-brand-text-muted font-manrope">Mostrar linhas</span>
                            <button onClick={() => setShowHouseLines(!showHouseLines)} className={`w-8 h-4 rounded-full relative transition-colors ${showHouseLines ? 'bg-brand-purple' : 'bg-brand-surface-highlight'}`}>
                                <div className="absolute top-0.5 w-3 h-3 rounded-full bg-brand-text transition-all" style={{ left: showHouseLines ? 'calc(100% - 14px)' : '2px' }} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-brand-text-muted font-manrope">Marcadores</span>
                            <button onClick={() => setShowHouseMarkers(!showHouseMarkers)} className={`w-8 h-4 rounded-full relative transition-colors ${showHouseMarkers ? 'bg-brand-purple' : 'bg-brand-surface-highlight'}`}>
                                <div className="absolute top-0.5 w-3 h-3 rounded-full bg-brand-text transition-all" style={{ left: showHouseMarkers ? 'calc(100% - 14px)' : '2px' }} />
                            </button>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase text-brand-text-muted font-bold tracking-wider">Estilo da linha</label>
                            <div className="flex gap-2">
                                <button onClick={() => setHouseLineFormat('solid')} className={`flex-1 py-1.5 rounded-lg text-xs font-manrope border ${houseLineFormat === 'solid' ? 'bg-brand-purple/20 border-brand-purple/50 text-white' : 'border-brand-border/10 text-brand-text-muted hover:bg-brand-surface-highlight'}`}>Sólida</button>
                                <button onClick={() => setHouseLineFormat('dashed')} className={`flex-1 py-1.5 rounded-lg text-xs font-manrope border ${houseLineFormat === 'dashed' ? 'bg-brand-purple/20 border-brand-purple/50 text-white' : 'border-brand-border/10 text-brand-text-muted hover:bg-brand-surface-highlight'}`}>Tracejada</button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase text-brand-text-muted font-bold tracking-wider flex justify-between">
                                <span>Espessura</span><span>{houseLineThickness}px</span>
                            </label>
                            <input type="range" min="0.5" max="3" step="0.5" value={houseLineThickness} onChange={(e) => setHouseLineThickness(Number(e.target.value))} className="w-full accent-brand-purple" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase text-brand-text-muted font-bold tracking-wider flex justify-between">
                                <span>Opacidade</span><span>{Math.round(houseLineOpacity * 100)}%</span>
                            </label>
                            <input type="range" min="0.1" max="1" step="0.1" value={houseLineOpacity} onChange={(e) => setHouseLineOpacity(Number(e.target.value))} className="w-full accent-brand-purple" />
                        </div>
                    </div>
                )}
            </div>

            {/* ÓRBITAS */}
            <div className="relative">
                <button
                    onClick={() => setShowOrbits(!showOrbits)}
                    className={`flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md transition-colors duration-150 whitespace-nowrap ${showOrbits ? (theme === 'dark' ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-600/15 text-purple-700') : (theme === 'dark' ? 'hover:bg-white/[0.07] text-white/60' : 'hover:bg-black/[0.05] text-gray-500')}`}
                    title="Órbitas"
                >
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.1"/>
                        <circle cx="10" cy="10" r="5" stroke="currentColor" strokeWidth="1"/>
                        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1"/>
                        <circle cx="10" cy="10" r="0.9" fill="currentColor"/>
                    </svg>
                    <span className={`font-manrope text-[11px] tracking-wide transition-opacity duration-200 ${activeToolbarMenu !== null ? 'opacity-100' : 'opacity-0 group-hover/toolbar:opacity-100'} ${showOrbits ? (theme === 'dark' ? 'text-purple-300' : 'text-purple-700') : (theme === 'dark' ? 'text-white/60' : 'text-gray-500')}`}>
                        Órbitas
                    </span>
                </button>
            </div>

            {/* MAGNÉTICO */}
            <div className="relative">
                <button
                    onClick={() => setActiveToolbarMenu(m => m === 'magnetic' ? null : 'magnetic')}
                    className={`flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md transition-colors duration-150 whitespace-nowrap ${activeToolbarMenu === 'magnetic' || showMagneticField ? (theme === 'dark' ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-600/15 text-purple-700') : (theme === 'dark' ? 'hover:bg-white/[0.07] text-white/60' : 'hover:bg-black/[0.05] text-gray-500')}`}
                    title="Campo magnético"
                >
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" fill="none">
                        <ellipse cx="10" cy="10" rx="7" ry="3.5" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M10 3 C13 3 15 5 15 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.7"/>
                        <path d="M10 3 C7 3 5 5 5 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.7"/>
                        <path d="M10 17 C13 17 15 15 15 13" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.7"/>
                        <path d="M10 17 C7 17 5 15 5 13" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.7"/>
                        <line x1="10" y1="3" x2="10" y2="17" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 1.5" opacity="0.4"/>
                        <circle cx="10" cy="3.5" r="1" fill="currentColor"/>
                        <circle cx="10" cy="16.5" r="1" fill="currentColor"/>
                    </svg>
                    <span className={`font-manrope text-[11px] tracking-wide transition-opacity duration-200 ${activeToolbarMenu !== null ? 'opacity-100' : 'opacity-0 group-hover/toolbar:opacity-100'} ${activeToolbarMenu === 'magnetic' || showMagneticField ? (theme === 'dark' ? 'text-purple-300' : 'text-purple-700') : (theme === 'dark' ? 'text-white/60' : 'text-gray-500')}`}>
                        Magnético
                    </span>
                </button>
                {activeToolbarMenu === 'magnetic' && (
                    <div data-submenu="true" className="absolute top-0 left-full ml-2 w-64 bg-brand-surface/95 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-2xl z-50 ring-1 ring-white/5 flex flex-col gap-4 font-manrope">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-brand-text-muted font-manrope">Mostrar campo magnético</span>
                            <button onClick={() => setShowMagneticField(!showMagneticField)} className={`w-8 h-4 rounded-full relative transition-colors ${showMagneticField ? 'bg-brand-purple' : 'bg-brand-surface-highlight'}`}>
                                <div className="absolute top-0.5 w-3 h-3 rounded-full bg-brand-text transition-all" style={{ left: showMagneticField ? 'calc(100% - 14px)' : '2px' }} />
                            </button>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase text-brand-text-muted font-bold tracking-wider flex justify-between">
                                <span>Tamanho</span><span>{magneticFieldSize.toFixed(1)}x</span>
                            </label>
                            <input type="range" min="0.5" max="1.7" step="0.1" value={magneticFieldSize} onChange={(e) => setMagneticFieldSize(Number(e.target.value))} className="w-full accent-brand-purple" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase text-brand-text-muted font-bold tracking-wider flex justify-between">
                                <span>Opacidade</span><span>{Math.round(magneticFieldOpacity * 100)}%</span>
                            </label>
                            <input type="range" min="0" max="1" step="0.05" value={magneticFieldOpacity} onChange={(e) => setMagneticFieldOpacity(Number(e.target.value))} className="w-full accent-brand-purple" />
                        </div>
                    </div>
                )}
            </div>

            <div className={`h-px ${theme === 'dark' ? 'bg-white/10' : 'bg-black/10'} my-1 mx-0.5`} />

            {/* FIXAR ZODÍACO */}
            <div className="relative">
                <button
                    onClick={() => setIsZodiacFixed(!isZodiacFixed)}
                    className={`flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md transition-colors duration-150 whitespace-nowrap ${isZodiacFixed ? (theme === 'dark' ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-600/15 text-purple-700') : (theme === 'dark' ? 'hover:bg-white/[0.07] text-white/60' : 'hover:bg-black/[0.05] text-gray-500')}`}
                    title={isZodiacFixed ? 'Zodíaco fixo' : 'Fixar zodíaco'}
                >
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" fill="none">
                      <path d="M10 9 C10 6 9 3.5 7 3 C5 2.5 3 4 3 6 C3 8 5 9 6.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M10 9 C10 6 11 3.5 13 3 C15 2.5 17 4 17 6 C17 8 15 9 13.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <line x1="10" y1="9" x2="10" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span className={`font-manrope text-[11px] tracking-wide transition-opacity duration-200 ${activeToolbarMenu !== null ? 'opacity-100' : 'opacity-0 group-hover/toolbar:opacity-100'} ${isZodiacFixed ? (theme === 'dark' ? 'text-purple-300' : 'text-purple-700') : (theme === 'dark' ? 'text-white/60' : 'text-gray-500')}`}>
                        Fixar zodíaco
                    </span>
                </button>
            </div>

        </div>
    )}
</div>
{/* TOOLBAR FIM */}
                        </div>
                        )}

                        {!immersiveMode && (
                        <div className="absolute top-14 right-4 z-50 flex flex-col items-end gap-2 pointer-events-none">
                            <div className="pointer-events-auto flex items-center bg-brand-surface/80 backdrop-blur-xl border border-brand-border/10 rounded-xl p-1 gap-0.5 shadow-2xl ring-1 ring-white/5" ref={menuRefs.chronograph}>
                                <div className="relative">
                                    <button 
                                        onClick={toggleChronographMenu}
                                        className={`p-1 rounded-lg transition-colors ${showChronographMenu ? 'bg-brand-surface-highlight text-brand-text' : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-surface-highlight/50'}`}
                                        title={t('chrono.options')}
                                    >
                                        <UI_ICONS.MoreIcon className="w-4 h-4" />
                                    </button>
                                    {showChronographMenu && (
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-brand-surface/95 backdrop-blur-xl rounded-xl border border-brand-border/10 shadow-2xl z-50 p-1 flex flex-col gap-1">
                                            {[
                                                { id: 'background', label: t('chrono.bgOptions'), icon: UI_ICONS.ImageIcon },
                                                { id: 'display', label: t('chrono.displayItems'), icon: UI_ICONS.LayersIcon },
                                                { id: 'colors', label: t('chrono.signColors'), icon: UI_ICONS.AspectIcon },
                                            ].map((item) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => {
                                                        setActiveChronographMenu(activeChronographMenu === item.id ? null : item.id as any);
                                                    }}
                                                    className={`w-full px-3 py-2 rounded-lg flex items-center gap-3 text-xs font-manrope transition-colors ${activeChronographMenu === item.id ? 'bg-brand-purple/20 text-brand-purple' : 'hover:bg-brand-surface-highlight text-brand-text-muted hover:text-brand-text'}`}
                                                >
                                                    <item.icon className="w-4 h-4" />
                                                    <span>{item.label}</span>
                                                </button>
                                            ))}
                                            <div className="h-px bg-brand-border/10 my-1" />
                                            <button
                                                onClick={() => {
                                                    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
                                                    setShowChronographMenu(false);
                                                }}
                                                className="w-full px-3 py-2 rounded-lg flex items-center gap-3 text-xs font-manrope transition-colors hover:bg-brand-surface-highlight text-brand-text-muted hover:text-brand-text"
                                            >
                                                {theme === 'dark'
                                                    ? <UI_ICONS.SunIcon className="w-4 h-4" />
                                                    : <UI_ICONS.MoonIcon className="w-4 h-4" />
                                                }
                                                <span>{theme === 'dark' ? t('app.lightMode') : t('app.darkMode')}</span>
                                            </button>
                                        </div>
                                    )}
                                    
                                    {/* Submenus for Chronograph Menu */}
                                    {showChronographMenu && activeChronographMenu === 'background' && (
                                        <div className="absolute right-full top-0 mr-2 w-56 bg-brand-surface/95 backdrop-blur-xl rounded-2xl border border-brand-border/10 p-2 shadow-2xl z-50 ring-1 ring-brand-border/5 flex flex-col gap-1 font-display">
                                            {[
                                                { label: t('chrono.stars'), active: showStars, onClick: () => setShowStars(!showStars) },
                                                { label: t('chrono.atmosphere'), active: showAtmosphere, onClick: () => setShowAtmosphere(!showAtmosphere) },
                                                { label: t('chrono.constellations'), active: showConstellations, onClick: () => setShowConstellations(!showConstellations) },
                                            ].map((opt, i) => (
                                                <button 
                                                    key={i}
                                                    onClick={opt.onClick}
                                                    className={`w-full px-3 py-2 rounded-lg flex items-center justify-between transition-colors hover:bg-brand-surface-highlight`}
                                                >
                                                    <span className={`text-[10px] font-normal capitalize tracking-wider font-manrope ${opt.active ? 'text-brand-text' : 'text-brand-text-muted'}`}>{opt.label}</span>
                                                    <div className={`w-6 h-3 rounded-full relative transition-colors ${opt.active ? 'bg-brand-purple shadow-[0_0_8px_rgba(124,58,237,0.4)]' : 'bg-brand-surface-highlight'}`}>
                                                        <div className={`absolute top-0.5 w-2 h-2 rounded-full bg-brand-text transition-all shadow-sm`} style={{ left: opt.active ? 'calc(100% - 10px)' : '2px' }} />
                                                    </div>
                                                </button>
                                            ))}
                                            <div className="h-px bg-brand-border/10 my-1"></div>
                                            <label className="w-full px-3 py-2 rounded-lg flex items-center justify-between transition-colors hover:bg-brand-surface-highlight cursor-pointer">
                                                <span className="text-[10px] font-normal capitalize tracking-wider font-manrope text-brand-text-muted">{t('chrono.uploadImage')}</span>
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    className="hidden" 
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onload = (e) => setCustomBackgroundImage(e.target?.result as string);
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                />
                                            </label>
                                            {customBackgroundImage && (
                                                <button 
                                                    onClick={() => setCustomBackgroundImage(null)}
                                                    className="w-full px-3 py-2 rounded-lg flex items-center justify-between transition-colors hover:bg-red-500/20 text-red-400"
                                                >
                                                    <span className="text-[10px] font-normal capitalize tracking-wider font-manrope">{t('chrono.removeImage')}</span>
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {showChronographMenu && activeChronographMenu === 'display' && (
                                        <div className="absolute right-full top-0 mr-2 w-56 bg-brand-surface/95 backdrop-blur-xl rounded-2xl border border-brand-border/10 p-2 shadow-2xl z-50 ring-1 ring-brand-border/5 flex flex-col gap-1 font-display">
                                            {[
                                                { label: t('chrono.planetSpheres'), active: showPlanetSpheres, onClick: () => setShowPlanetSpheres(!showPlanetSpheres) },
                                                { label: 'Graus dos planetas', active: showDegreeLabels, onClick: () => setShowDegreeLabels(!showDegreeLabels) },
                                                { label: t('chrono.seasonsRing'), active: showSeasonsRing, onClick: () => setShowSeasonsRing(!showSeasonsRing) },
                                                { label: t('chrono.aspectLines'), active: showAspectLines, onClick: () => handleToggleAspectLines() },
                                                { label: t('chrono.natalAspects'), active: showNatalLines, onClick: () => handleToggleNatalLines(), disabled: !natalTime },
                                            ].map((opt, i) => (
                                                <button 
                                                    key={i}
                                                    onClick={opt.onClick}
                                                    disabled={opt.disabled}
                                                    className={`w-full px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${opt.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-brand-surface-highlight'}`}
                                                >
                                                    <span className={`text-[10px] font-normal capitalize tracking-wider font-manrope ${opt.active ? 'text-brand-text' : 'text-brand-text-muted'}`}>{opt.label}</span>
                                                    <div className={`w-6 h-3 rounded-full relative transition-colors ${opt.active ? 'bg-brand-purple shadow-[0_0_8px_rgba(124,58,237,0.4)]' : 'bg-brand-surface-highlight/50'}`}>
                                                        <div className={`absolute top-0.5 w-2 h-2 rounded-full bg-brand-text transition-all shadow-sm`} style={{ left: opt.active ? 'calc(100% - 10px)' : '2px' }} />
                                                    </div>
                                                </button>
                                            ))}
                                            {showDegreeLabels && (
                                                <div className="border-t border-brand-border/10 mt-1 pt-1">
                                                    <SizeControl
                                                        label="Tamanho"
                                                        value={degreeLabelSize}
                                                        onChange={(v) => setDegreeLabelSize(Math.max(7, Math.min(32, v)))}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {showChronographMenu && activeChronographMenu === 'colors' && (
                                        <div className="absolute right-full top-0 mr-2 w-48 bg-brand-surface/95 backdrop-blur-xl rounded-2xl border border-brand-border/10 p-2 shadow-2xl z-50 ring-1 ring-brand-border/5 flex flex-col gap-1 font-display">
                                            {[
                                                { id: 'none', label: t('chrono.disabled') },
                                                { id: 'element', label: t('chrono.elements') },
                                                { id: 'modality', label: t('chrono.modalities') },
                                                { id: 'polarity', label: t('chrono.polarities') },
                                            ].map((opt) => (
                                                <button 
                                                    key={opt.id}
                                                    onClick={() => setZodiacColorMode(opt.id as any)}
                                                    className={`w-full px-3 py-2 rounded-lg flex items-center justify-between transition-colors hover:bg-brand-surface-highlight`}
                                                >
                                                    <span className={`text-[10px] font-normal capitalize tracking-wider font-manrope ${zodiacColorMode === opt.id ? 'text-brand-purple font-bold' : 'text-brand-text-muted'}`}>{opt.label}</span>
                                                    {zodiacColorMode === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-brand-purple"></div>}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                </div>
                            </div>
                        </div>
                        )}

                        <div 
                            className="flex-1 relative z-0 flex items-center justify-center pb-28 pt-16 overflow-hidden"
                            onClick={() => {
                                if (immersiveMode) {
                                    setImmersiveMode(false);
                                }
                            }}
                        >
                            <div ref={clockRef} className="w-full h-full max-w-4xl max-h-[calc(100vh-220px)] relative flex items-center justify-center" style={{ transform: `scale(${clockScale})`, transformOrigin: 'center center' }}>
                            <SiderealClock 
                                celestialData={celestialData}
                                natalData={natalTime ? natalData : undefined}
                                filteredAspects={filteredAspects}
                                ghostPlanets={ghostPlanets}
                                visiblePlanets={visiblePlanets}
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
                                showPlanetSpheres={showPlanetSpheres}
                                showDegreeLabels={showDegreeLabels}
                                degreeLabelSize={degreeLabelSize}
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
                                showStars={false} // Stars are now handled by StarField in App.tsx
                                showSeasonsRing={showSeasonsRing}
                                zodiacColorMode={zodiacColorMode}
                                highlightFilter={highlightFilter}
                                showSignLines={showSignLines}
                                signLineThickness={signLineThickness}
                                signLineOpacity={signLineOpacity}
                                pointerStyle={pointerStyle}
                                pointerThickness={pointerThickness}
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
                            />
                        </div>
                        
                        {/* Sun and Moon Info Panels — Removed */}
                        
                        {/* Bottom Right Fullscreen Button - Removed */}
                        {/* Bottom Left Fix Zodiac and Pointer Buttons - Removed */}
                    </div>

                    {!immersiveMode && (
                    <div className="absolute bottom-2 left-2 right-2 z-50 flex items-center justify-between pointer-events-none font-display">
                        
                        {/* Group 1: Left Controls (Pointer & Zodiac & Moon) - Removed */}

                        {/* Group 3: Main Time Controls (Center Absolute) */}
                        <div
                            className="absolute left-1/2 bottom-0 -translate-x-1/2 pointer-events-auto flex flex-col items-center"
                            onMouseEnter={handleTimeControlsMouseEnter}
                            onMouseLeave={handleTimeControlsMouseLeave}
                            onClick={() => {
                                setTimeControlsVisible(true);
                                if (timeControlsHideTimer.current) clearTimeout(timeControlsHideTimer.current);
                                timeControlsHideTimer.current = window.setTimeout(() => {
                                    if (!timeControlsHoveredRef.current) setTimeControlsVisible(false);
                                }, 2500);
                            }}
                        >
                            {/* ESTADO OCULTO — linha horizontal estilo iPhone home bar */}
                            {!timeControlsVisible && (
                                <div
                                    className="flex items-center justify-center cursor-pointer mb-2"
                                    style={{ width: '160px', height: '20px', padding: '4px' }}
                                >
                                    <div
                                        style={{
                                            height: '3px',
                                            width: '100%',
                                            borderRadius: '999px',
                                            background: theme === 'dark'
                                                ? 'rgba(255,255,255,0.15)'
                                                : 'rgba(0,0,0,0.12)',
                                            transition: 'all 0.2s ease',
                                        }}
                                        className="hover:!bg-purple-400/50 hover:!h-[4px]"
                                    />
                                </div>
                            )}

                            {/* CONTROLES VISÍVEIS */}
                            {timeControlsVisible && (
                                <div
                                    className="flex items-center gap-2 mb-4"
                                    style={{ animation: 'timeControlsFadeIn 0.2s ease' }}
                                >
                                    <style>{`
                                        @keyframes timeControlsFadeIn {
                                            from { opacity: 0; transform: translateY(6px); }
                                            to   { opacity: 1; transform: translateY(0); }
                                        }
                                    `}</style>
                                    <div className="relative group">
                                        <TimeControls 
                                            isMinimized={isTimeControlsMinimized}
                                            timeStep={timeStep}
                                            onTimeStepChange={setTimeStep}
                                            onStepStart={handleTimeChangeStart}
                                            onStepEnd={handleTimeChangeEnd}
                                            onTogglePlay={togglePlay}
                                            isRealTime={isRealTime}
                                            speedMultiplier={speedMultiplier}
                                            onSpeedMultiplierChange={setSpeedMultiplier}
                                            onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                            isDarkMode={theme === 'dark'}
                                            onToggleFullscreen={() => setImmersiveMode(!immersiveMode)}
                                            isFullscreen={immersiveMode}
                                            onToggleOptions={toggleOptionsMenu}
                                        />

                                        {/* Botão ancorado na borda direita do TimeControls */}
                                        <button
                                            onClick={() => setIsTimeControlsMinimized(!isTimeControlsMinimized)}
                                            title={isTimeControlsMinimized ? "Expandir" : "Recolher"}
                                            className="absolute -right-3 top-1/2 -translate-y-1/2 z-30
                                                       w-6 h-10 rounded-r-xl
                                                       bg-brand-surface/90 backdrop-blur-xl
                                                       border border-l-0 border-brand-border/20
                                                       flex items-center justify-center
                                                       text-brand-text-muted hover:text-brand-text
                                                       opacity-0 group-hover:opacity-100
                                                       transition-all duration-200 shadow-md"
                                        >
                                            {isTimeControlsMinimized
                                                ? <UI_ICONS.ChevronRightIcon className="w-3 h-3" />
                                                : <UI_ICONS.ChevronLeftIcon className="w-3 h-3" />
                                            }
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    
                        {/* Group 4: Right Controls (Fullscreen & Options) */}
                        <div className="pointer-events-auto flex items-center gap-4 ml-auto relative" ref={menuRefs.options}>
                            {showOptionsMenu && (
                                <div className="absolute bottom-full right-0 mb-4 w-64 bg-brand-surface/95 backdrop-blur-xl rounded-2xl border border-brand-border/10 p-4 shadow-2xl z-50 ring-1 ring-white/5 flex flex-col gap-2 font-display">
                                    <h3 className="text-xs font-bold uppercase text-brand-text-muted mb-2 tracking-wider">Tamanhos (Relógio)</h3>
                                    <SizeControl label="Planetas" value={clockPlanetSize} onChange={setClockPlanetSize} />
                                    <SizeControl label="Signos" value={zodiacSignSize} onChange={setZodiacSignSize} />
                                    
                                    <div className="h-px bg-brand-border/10 my-2"></div>
                                    <h3 className="text-xs font-bold uppercase text-brand-text-muted mb-2 tracking-wider">Zoom (Relógio)</h3>
                                    <div className="flex items-center justify-between gap-2">
                                        <button
                                            onClick={() => setClockScale(s => Math.max(0.7, parseFloat((s - 0.05).toFixed(2))))}
                                            className="w-8 h-8 rounded-lg bg-brand-surface-highlight/50 border border-brand-border/10 flex items-center justify-center text-brand-text hover:bg-brand-surface-highlight transition-colors"
                                        >
                                            <span className="text-lg font-bold">−</span>
                                        </button>
                                        <div className="flex-1 px-2">
                                            <input 
                                                type="range" 
                                                min="0.7" 
                                                max="1.5" 
                                                step="0.05" 
                                                value={clockScale} 
                                                onChange={(e) => setClockScale(Number(e.target.value))} 
                                                className="w-full accent-brand-purple" 
                                            />
                                            <div className="flex justify-between text-[10px] text-brand-text-muted mt-1 font-manrope">
                                                <span>70%</span>
                                                <span className="text-brand-purple font-bold">{Math.round(clockScale * 100)}%</span>
                                                <span>150%</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setClockScale(s => Math.min(1.5, parseFloat((s + 0.05).toFixed(2))))}
                                            className="w-8 h-8 rounded-lg bg-brand-surface-highlight/50 border border-brand-border/10 flex items-center justify-center text-brand-text hover:bg-brand-surface-highlight transition-colors"
                                        >
                                            <span className="text-lg font-bold">+</span>
                                        </button>
                                    </div>

                                    <div className="h-px bg-brand-border/10 my-2"></div>
                                
                                    <ExportPDFButton
                                        currentTime={currentTime}
                                        location={{ ...location, latitude: location.latitude, longitude: location.longitude }}
                                        celestialData={celestialData}
                                        seasonInfo={seasonInfo}
                                        sunriseTime={celestialData.sunriseTime}
                                        sunsetTime={celestialData.sunsetTime}
                                        moonriseTime={celestialData.moonriseTime}
                                        moonsetTime={celestialData.moonsetTime}
                                        moonPhase={getMoonPhaseInfo(celestialData.moonPhase)}
                                        moonPhaseValue={celestialData.moonPhase}
                                        retrogradeStatus={celestialData.retrogradeStatus}
                                        housePlacements={celestialData.housePlacements}
                                        houseCusps={celestialData.houseCusps}
                                        filteredAspects={filteredAspects}
                                        clockRef={clockRef}
                                        showAspectLines={showAspectLines}
                                        setShowAspectLines={setShowAspectLines}
                                        theme={theme}
                                        onSetTheme={setTheme}
                                        showSeasonsRing={showSeasonsRing}
                                        setShowSeasonsRing={setShowSeasonsRing}
                                        showTimeRing={showTimeRing}
                                        setShowTimeRing={setShowTimeRing}
                                        showConstellations={showConstellations}
                                        setShowConstellations={setShowConstellations}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    )}

                    </div>

                    {showTransitChart && (
                        <div className="absolute bottom-[52px] left-0 right-0 h-64 bg-[#131129]/95 backdrop-blur-md border-t border-white/10 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-transform transform translate-y-0">
                            <TransitChart 
                                currentTime={currentTime} 
                                natalCelestialData={natalTime ? natalData : null} 
                                onClose={() => setShowTransitChart(false)}
                            />
                        </div>
                    )}
                    

                </section>

                {/* Right Panel */}
                <div className="flex flex-row h-full" style={{ order: sectionOrder.indexOf('details') }}>
                    <aside 
                        onDragOver={(e) => handleDragOver(e, 'details')}
                        className={`column-wrapper relative group flex flex-col items-stretch transition-all duration-300 z-10 gap-1.5 ${immersiveMode || !isRightPanelVisible || (rightPanels.length === 0 && draggedItem?.type !== 'panel') ? 'hidden' : ''} ${draggedItem?.type === 'column' && draggedItem.id === 'details' ? 'opacity-50 grayscale scale-95' : ''}`}
                        style={{
                            width: rightPanels.length === 0 ? '200px' : 'fit-content',
                            minWidth: 'fit-content'
                        }}
                    >
                        {rightPanels.length === 0 && draggedItem?.type === 'panel' && (
                            <div className="flex-1 border-2 border-dashed border-blue-400/50 bg-blue-400/10 rounded-3xl flex items-center justify-center transition-all">
                                <span className="text-blue-400/50 font-medium text-sm">Solte aqui</span>
                            </div>
                        )}
                        {rightPanels.map(id => renderPanel(id, 'right'))}
                        <button
                            onClick={() => setIsRightPanelVisible(!isRightPanelVisible)}
                            title={isRightPanelVisible ? "Recolher painel" : "Expandir painel"}
                            className="absolute -left-3 top-1/2 -translate-y-1/2 z-30
                                       w-6 h-14 rounded-l-xl
                                       bg-brand-surface/90 backdrop-blur-xl
                                       border border-r-0 border-brand-border/20
                                       flex items-center justify-center
                                       text-brand-text-muted hover:text-brand-text
                                       opacity-0 group-hover:opacity-100
                                       transition-all duration-200 shadow-md"
                        >
                            {isRightPanelVisible
                                ? <UI_ICONS.ChevronRightIcon className="w-3 h-3" />
                                : <UI_ICONS.ChevronLeftIcon className="w-3 h-3" />
                            }
                        </button>
                    </aside>
                </div>
            </main>
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
                            />
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
