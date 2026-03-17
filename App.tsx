// ============================================================
// DEMO_MODE = true  → abre direto, sem tela de login (uso local)
// DEMO_MODE = false → ativa autenticação real via server.ts
// ============================================================
const DEMO_MODE = true;

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useCelestialData, CelestialData } from './hooks/useCelestialData';
import { SiderealClock } from './components/SiderealClock';
import { CelestialBodyPanel, CelestialSettings } from './components/CelestialBodyPanel';
import { AstroInfoPanel, AspectSettings } from './components/AstroInfoPanel';
import { LoginScreen } from './components/LoginScreen';
import { LandingPage } from './components/LandingPage';
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
import { calculateTransitNatalAspects } from './lib/astrology/aspects';
import { normalizeAngle } from './lib/astrology/utils';
import { getNextMoonPhases } from './lib/astrology/calendars';
import { useLanguage } from './i18n';

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
                 signIndex: 0,
                 house: 0
             })
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
    const [zodiacSignSize, setZodiacSignSize] = useState(32);
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
    const [isMoonPanelVisible, setIsMoonPanelVisible] = useState(true);
    const [isSunPanelVisible, setIsSunPanelVisible] = useState(true);
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

    const [celestialSettings, setCelestialSettings] = useState<CelestialSettings>({
        planets: { symbols: true, glyphs: false, colors: true, names: true, namesColors: true, namesAbbr: true },
        signs: { enabled: true, symbols: true, colors: true, abbr: false },
        houses: { enabled: true, format: 'roman' },
        degrees: false,
        retrograde: true
    });
    const [aspectSettings, setAspectSettings] = useState<AspectSettings>({
        planets: { symbols: true, glyphs: false, colors: true, names: false, nameColors: true },
        signs: { enabled: true, colors: true },
        houses: { enabled: false },
        aspects: { 
            symbols: false, 
            abbr: true, 
            names: false,
            types: {
                conjunction: true,
                opposition: true,
                trine: true,
                square: true,
                sextile: true
            }
        },
        orb: false
    });
    const [houseCuspsLayout, setHouseCuspsLayout] = useState<'minimal' | 'complete'>('minimal');
    const [statsLayout, setStatsLayout] = useState<'minimal' | 'complete'>('minimal');
    const [sectionOrder, setSectionOrder] = useState<('celestial' | 'chronograph' | 'details')[]>(['celestial', 'chronograph', 'details']);

    useEffect(() => {
        setSectionOrder(['celestial', 'chronograph', 'details']);
        setLeftPanels(['celestial', 'statistics']);
        setRightPanels(['aspects', 'cusps']);
    }, []);
    
    type PanelId = 'celestial' | 'cusps' | 'aspects' | 'statistics';
    const [leftPanels, setLeftPanels] = useState<PanelId[]>(['celestial', 'statistics']);
    const [rightPanels, setRightPanels] = useState<PanelId[]>(['aspects', 'cusps']);
    
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

    const [timeRingScale, setTimeRingScale] = useState(1);
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    
    // --- Settings Modal State (Main Clock) ---
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [tempDate, setTempDate] = useState('');
    const [tempTime, setTempTime] = useState('');
    const [tempLocationIndex, setTempLocationIndex] = useState<number>(-1);

    // --- Auth State ---
    // --- Auth State ---
    const [isAuthenticated, setIsAuthenticated] = useState(DEMO_MODE);
    const [isAdmin, setIsAdmin] = useState(DEMO_MODE);
    const [username, setUsername] = useState(DEMO_MODE ? 'local' : '');
    const [isAuthChecking, setIsAuthChecking] = useState(!DEMO_MODE);
    const [showDashboard, setShowDashboard] = useState(false);
    const [dashboardTab, setDashboardTab] = useState<'profile' | 'maps' | 'layouts' | 'admin'>('profile');
    const [showLogin, setShowLogin] = useState(false);
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

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
        if (DEMO_MODE) return;
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
        if (DEMO_MODE) return;
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            setIsAuthenticated(false);
        } catch (err) {
            console.error("Logout failed", err);
        }
    };

    // --- Natal Chart State ---
    const [natalTime, setNatalTime] = useState<Date | null>(null);
    const [natalLocation, setNatalLocation] = useState(DEFAULT_LOCATION);
    const [isNatalSettingsOpen, setIsNatalSettingsOpen] = useState(false);
    const [showNatalCalendar, setShowNatalCalendar] = useState(false);
    const [tempNatalDate, setTempNatalDate] = useState('');
    const [tempNatalTime, setTempNatalTime] = useState('');
    const [tempNatalLocationIndex, setTempNatalLocationIndex] = useState<number>(-1);

    // --- Data Calculation ---
    const celestialData = useCelestialData(currentTime, location, visiblePlanets);
    const natalData = useCelestialData(natalTime, natalLocation, visiblePlanets);
    
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
    const { filteredAspects, ghostPlanets } = useMemo(() => {
        let activeAspectSource = showNatalLines ? transitNatalAspects : celestialData.aspects;

        // Filter by aspect type from settings
        activeAspectSource = activeAspectSource.filter(aspect => {
            const type = aspect.type as keyof typeof aspectSettings.aspects.types;
            return aspectSettings.aspects.types[type] !== false;
        });

        if (selectedPlanets.length === 0) {
            return { filteredAspects: activeAspectSource, ghostPlanets: [] };
        }

        const relevantAspects = activeAspectSource.filter(aspect => 
            selectedPlanets.includes(aspect.body1.id) || selectedPlanets.includes(aspect.body2.id)
        );

        const ghosts = new Set<string>();
        if (!showNatalLines) {
             relevantAspects.forEach(aspect => {
                if (selectedPlanets.includes(aspect.body1.id) && !selectedPlanets.includes(aspect.body2.id)) {
                    ghosts.add(aspect.body2.id);
                }
                if (selectedPlanets.includes(aspect.body2.id) && !selectedPlanets.includes(aspect.body1.id)) {
                    ghosts.add(aspect.body1.id);
                }
            });
        }

        return { filteredAspects: relevantAspects, ghostPlanets: Array.from(ghosts) };
    }, [celestialData.aspects, transitNatalAspects, showNatalLines, selectedPlanets, aspectSettings.aspects.types]);

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
            // Update every second instead of every frame to save performance
            intervalId = window.setInterval(() => {
                setCurrentTime(new Date());
            }, 1000);
        }

        return () => {
            if (intervalId) window.clearInterval(intervalId);
        };
    }, [isRealTime]);

    // --- Handlers ---
    const handlePlanetClick = (id: string) => {
        setSelectedPlanets(prev => 
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handlePlanetRightClick = (id: string) => {
        setVisiblePlanets(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleAspectClick = (id: string) => {
        setSelectedAspects(prev => 
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        );
    };

    const handleHouseClick = (num: number) => {
        const isSelecting = !selectedHouses.includes(num);
        setSelectedHouses(prev => 
            prev.includes(num) ? prev.filter(h => h !== num) : [...prev, num]
        );
        const planetsInHouse = Object.entries(celestialData.housePlacements)
            .filter(([_, houseNum]) => houseNum === num)
            .map(([planetId]) => planetId);

        setSelectedPlanets(prev => {
            if (isSelecting) {
                return [...new Set([...prev, ...planetsInHouse])];
            } else {
                return prev.filter(p => !planetsInHouse.includes(p));
            }
        });
    };

    const handleClearSelections = () => {
        setSelectedPlanets([]);
        setSelectedAspects([]);
        setSelectedHouses([]);
    };

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
        setIsSettingsOpen(true);
    };

    const saveSettings = () => {
        if (tempDate && tempTime) {
            const [year, month, day] = tempDate.split('-').map(Number);
            const [hours, minutes] = tempTime.split(':').map(Number);
            const newDate = new Date(year, month - 1, day, hours, minutes, 0);
            setCurrentTime(newDate);
        }
        if (tempLocationIndex >= 0 && tempLocationIndex < BRAZIL_CAPITALS.length) {
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
        setIsNatalSettingsOpen(true);
    };

    const saveNatalSettings = () => {
        if (tempNatalDate && tempNatalTime) {
            const [year, month, day] = tempNatalDate.split('-').map(Number);
            const [hours, minutes] = tempNatalTime.split(':').map(Number);
            const newDate = new Date(year, month - 1, day, hours, minutes, 0);
            setNatalTime(newDate);
        }
        if (tempNatalLocationIndex >= 0 && tempNatalLocationIndex < BRAZIL_CAPITALS.length) {
            const selectedCap = BRAZIL_CAPITALS[tempNatalLocationIndex];
            setNatalLocation({
                latitude: selectedCap.latitude,
                longitude: selectedCap.longitude,
                displayName: selectedCap.name
            });
        }
        setIsNatalSettingsOpen(false);
    };
    
    // --- Toggle Handlers ---
    const handleToggleAspectLines = () => {
        if (!showAspectLines) setShowNatalLines(false);
        setShowAspectLines(!showAspectLines);
    };

    const handleToggleNatalLines = () => {
        if (!natalTime) return;
        if (!showNatalLines) setShowAspectLines(false);
        setShowNatalLines(!showNatalLines);
    };

    // --- Menu Auto-Close Logic ---
    const menuRefs = {
        profile: useRef<HTMLDivElement>(null),
        chronograph: useRef<HTMLDivElement>(null),
        options: useRef<HTMLDivElement>(null),
        eclipses: useRef<HTMLDivElement>(null),
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
            // Add other menus here if needed
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showProfileMenu, showChronographMenu, showOptionsMenu]);

    const toggleProfileMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!showProfileMenu) {
            setShowChronographMenu(false);
            setShowOptionsMenu(false);
        }
        setShowProfileMenu(!showProfileMenu);
    };

    const toggleChronographMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!showChronographMenu) {
            setShowProfileMenu(false);
            setShowOptionsMenu(false);
            setActiveChronographMenu(null);
        }
        setShowChronographMenu(!showChronographMenu);
    };

    const toggleOptionsMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!showOptionsMenu) {
            setShowProfileMenu(false);
            setShowChronographMenu(false);
        }
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
                        className={`panel-wrapper flex-1 min-h-0 flex flex-col ${dragClass}`}
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
                            ascendantLongitude={celestialData.ascendantLongitude}
                            midheavenLongitude={celestialData.midheavenLongitude}
                            descendantLongitude={celestialData.descendantLongitude}
                            imumCoeliLongitude={celestialData.imumCoeliLongitude}
                            houseCusps={celestialData.houseCusps}
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
                        className={`panel-wrapper flex-1 min-h-0 flex flex-col overflow-hidden ${dragClass}`}
                        onDragOver={(e) => handlePanelDragOver(e, id, position)}
                    >
                        {dropIndicator}
                        <AstroInfoPanel 
                            aspects={filteredAspects} 
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

    if (!isAuthenticated) {
        if (!showLogin) {
            return <LandingPage onEnter={() => setShowLogin(true)} />;
        }
        return <LoginScreen onLoginSuccess={(user) => {
            setIsAuthenticated(true);
            if (user?.username) setUsername(user.username);
            if (user?.isAdmin !== undefined) setIsAdmin(user.isAdmin);
            // Re-check admin status after login to be sure
            fetch('/api/auth/check').then(res => res.json()).then(data => {
                if (data.authenticated) {
                    setIsAdmin(data.isAdmin);
                    if (data.username) setUsername(data.username);
                }
            });
        }} />;
    }

    return (
        <div className={`h-screen w-screen ${bgClass} text-brand-text overflow-hidden flex flex-col font-serif selection:bg-brand-purple/30`}>
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
                        className={`column-wrapper flex flex-col transition-all duration-300 z-20 ${immersiveMode || !isLeftPanelVisible || (leftPanels.length === 0 && draggedItem?.type !== 'panel') ? 'hidden' : ''} ${draggedItem?.type === 'column' && draggedItem.id === 'celestial' ? 'opacity-50 grayscale scale-95' : ''}`}
                        style={{  
                            width: leftPanels.length === 0 ? '200px' : `${leftPanelWidth}px`
                        }}
                    >
                        <div className="flex-1 overflow-hidden flex flex-col gap-1.5">
                            {leftPanels.length === 0 && draggedItem?.type === 'panel' && (
                                <div className="flex-1 border-2 border-dashed border-blue-400/50 bg-blue-400/10 rounded-3xl flex items-center justify-center transition-all">
                                    <span className="text-blue-400/50 font-medium text-sm">Solte aqui</span>
                                </div>
                            )}
                            {leftPanels.map(id => renderPanel(id, 'left'))}
                        </div>
                    </aside>
                    {!immersiveMode && (
                        <button
                            onClick={() => setIsLeftPanelVisible(!isLeftPanelVisible)}
                            className="w-3 h-12 bg-transparent hover:bg-brand-surface/50 border border-brand-border/20 rounded-r-md flex items-center justify-center text-brand-text-muted hover:text-brand-text transition-all self-center"
                            title={isLeftPanelVisible ? "Ocultar Painel Esquerdo" : "Mostrar Painel Esquerdo"}
                        >
                            {isLeftPanelVisible ? <UI_ICONS.ChevronLeftIcon className="w-3 h-3" /> : <UI_ICONS.ChevronRightIcon className="w-3 h-3" />}
                        </button>
                    )}
                </div>

                {/* Chronograph Section */}
                <section 
                    onDragOver={(e) => handleDragOver(e, 'chronograph')}
                    className={`column-wrapper flex-1 relative flex flex-col overflow-hidden ${draggedItem?.type === 'column' && draggedItem.id === 'chronograph' ? 'opacity-50' : ''}`}
                    style={{ order: sectionOrder.indexOf('chronograph') }}
                >
                    <div className="flex-1 flex flex-col bg-brand-surface/40 backdrop-blur-xl rounded-3xl border border-white/5 shadow-2xl overflow-hidden relative">
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
                                <h3 className="text-[10px] font-medium uppercase text-brand-text-muted tracking-wider truncate font-manrope">Cronógrafo</h3>
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
                                        <div className="absolute left-0 top-full mt-2 bg-brand-surface/95 backdrop-blur-xl border border-brand-border/10 rounded-2xl p-2 shadow-2xl w-48 flex flex-col gap-1 z-50 ring-1 ring-brand-border/5 font-manrope animate-in fade-in zoom-in-95 duration-100">
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
                                            
                                            {/* Theme Toggle */}
                                            <button
                                                onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                                                className="w-full px-3 py-2 rounded-lg flex items-center gap-3 transition-colors hover:bg-brand-surface-highlight text-brand-text-muted hover:text-brand-text"
                                            >
                                                {theme === 'dark' ? <UI_ICONS.SunIcon className="w-4 h-4" /> : <UI_ICONS.MoonIcon className="w-4 h-4" />}
                                                <span className="text-xs font-manrope">{theme === 'dark' ? t('app.lightMode') : t('app.darkMode')}</span>
                                            </button>

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

                                 {/* New Clock Display & Calendar */}
                                 <div className="flex items-center gap-2 pointer-events-auto relative">
                                     <div 
                                         onClick={() => setShowCalendarPanel(!showCalendarPanel)}
                                         className="flex items-center bg-brand-surface/80 backdrop-blur-xl border border-brand-border/10 rounded-xl px-3 gap-2 shadow-2xl ring-1 ring-white/5 h-10 cursor-pointer hover:bg-brand-surface-highlight/50 transition-colors"
                                     >
                                         <div className="flex flex-col justify-center flex-1 overflow-hidden font-manrope">
                                             <div className="flex items-center justify-center gap-2">
                                                 <span className="text-sm font-mono font-bold text-brand-text tracking-wider">
                                                     {currentTime.getHours().toString().padStart(2, '0')}:{currentTime.getMinutes().toString().padStart(2, '0')}
                                                 </span>
                                                 <span className="text-[10px] text-brand-text-muted font-medium">
                                                     {currentTime.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                 </span>
                                             </div>
                                         </div>
                                     </div>

                                     {/* Search / Natal Button */}
                                     <div className="flex items-center gap-1">
                                         <button 
                                             onClick={openNatalSettings}
                                             className={`h-10 rounded-xl flex items-center justify-center transition-colors border border-white/10 shadow-lg ${natalTime ? 'px-3 gap-2 bg-brand-surface/80 backdrop-blur-xl ring-1 ring-brand-orange/30 shadow-[0_0_15px_rgba(249,115,22,0.1)] hover:bg-brand-surface-highlight/50' : 'w-10 bg-brand-surface/80 backdrop-blur-md text-brand-text-muted hover:text-brand-text hover:bg-brand-surface-highlight/80'}`}
                                             title={t('chrono.searchDate')}
                                         >
                                             {natalTime ? (
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
                                             ) : (
                                                 <UI_ICONS.SearchIcon className="w-5 h-5" />
                                             )}
                                         </button>
                                         {natalTime && (
                                             <button
                                                 onClick={handleClearNatal}
                                                 className="w-6 h-10 rounded-lg flex items-center justify-center bg-brand-surface/80 backdrop-blur-md border border-white/10 text-brand-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors shadow-lg animate-in fade-in zoom-in duration-200"
                                                 title={t('chrono.clearNatal')}
                                             >
                                                 <UI_ICONS.CloseIcon className="w-3 h-3" />
                                             </button>
                                         )}
                                     </div>

                                     {/* Calendar Panel Popup */}
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
                                                 />
                                             </div>
                                         )}
                                     </AnimatePresence>
                                 </div>
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
                                    <div className="absolute right-2 top-full mt-2 w-48 bg-brand-surface/95 backdrop-blur-xl rounded-xl border border-brand-border/10 shadow-2xl z-50 p-1 flex flex-col gap-1">
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

                            {/* Pointer Button (Moved to Top Right) */}
                            <div className="pointer-events-auto flex flex-col gap-2">
                                <div className="flex items-center bg-brand-surface/80 backdrop-blur-xl border border-brand-border/10 rounded-xl p-1 gap-0.5 shadow-2xl ring-1 ring-white/5">
                                    <div className="relative">
                                        <button 
                                            onClick={() => setActiveToolbarMenu(m => m === 'pointer' ? null : 'pointer')}
                                            className={`p-1 rounded-lg transition-all border ${activeToolbarMenu === 'pointer' ? 'bg-brand-purple/20 text-brand-purple border-brand-purple/30' : 'hover:bg-brand-surface-highlight text-brand-text-muted border-transparent'}`}
                                            title={t('chrono.pointerOptions')}
                                        >
                                            <UI_ICONS.NeedleIcon className="w-4 h-4" />
                                        </button>

                                        {activeToolbarMenu === 'pointer' && (
                                            <div className="absolute top-0 right-full mr-2 w-64 bg-brand-surface/95 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-2xl z-50 ring-1 ring-white/5 flex flex-col gap-4 font-manrope">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-brand-text-muted font-manrope">{t('chrono.showPointer')}</span>
                                                    <button onClick={() => setShowNeedle(!showNeedle)} className={`w-8 h-4 rounded-full relative transition-colors ${showNeedle ? 'bg-brand-purple' : 'bg-brand-surface-highlight'}`}>
                                                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-brand-text transition-all`} style={{ left: showNeedle ? 'calc(100% - 14px)' : '2px' }} />
                                                    </button>
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <label className="text-[10px] uppercase text-brand-text-muted font-bold tracking-wider">{t('chrono.lineStyle')}</label>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => setPointerStyle('solid')} className={`flex-1 py-1.5 rounded-lg text-xs font-manrope border ${pointerStyle === 'solid' ? 'bg-brand-purple/20 border-brand-purple/50 text-white' : 'border-brand-border/10 text-brand-text-muted hover:bg-brand-surface-highlight'}`}>{t('chrono.solid')}</button>
                                                        <button onClick={() => setPointerStyle('dashed')} className={`flex-1 py-1.5 rounded-lg text-xs font-manrope border ${pointerStyle === 'dashed' ? 'bg-brand-purple/20 border-brand-purple/50 text-white' : 'border-brand-border/10 text-brand-text-muted hover:bg-brand-surface-highlight'}`}>{t('chrono.dashed')}</button>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider flex justify-between">
                                                        <span>{t('chrono.thickness')}</span>
                                                        <span>{pointerThickness}px</span>
                                                    </label>
                                                    <input 
                                                        type="range" 
                                                        min="1" max="5" step="1" 
                                                        value={pointerThickness} 
                                                        onChange={(e) => setPointerThickness(Number(e.target.value))}
                                                        className="w-full accent-brand-purple"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">{t('chrono.head')}</label>
                                                    <div className="grid grid-cols-3 gap-1">
                                                        {[
                                                            { id: 'arrow', label: t('chrono.arrow') },
                                                            { id: 'circle', label: t('chrono.circle') },
                                                            { id: 'diamond', label: t('chrono.diamond') },
                                                            { id: 'square', label: t('chrono.square') },
                                                            { id: 'none', label: t('chrono.none') }
                                                        ].map(opt => (
                                                            <button 
                                                               key={opt.id}
                                                               onClick={() => setPointerHead(opt.id as any)} 
                                                               className={`py-1 rounded-lg text-[10px] font-manrope border ${pointerHead === opt.id ? 'bg-brand-purple/20 border-brand-purple/50 text-white' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                                                            >
                                                                {opt.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">{t('chrono.tail')}</label>
                                                    <div className="grid grid-cols-3 gap-1">
                                                        {[
                                                            { id: 'arrow', label: t('chrono.arrow') },
                                                            { id: 'circle', label: t('chrono.circle') },
                                                            { id: 'diamond', label: t('chrono.diamond') },
                                                            { id: 'square', label: t('chrono.square') },
                                                            { id: 'none', label: t('chrono.none') }
                                                        ].map(opt => (
                                                            <button 
                                                               key={opt.id}
                                                               onClick={() => setPointerTail(opt.id as any)} 
                                                               className={`py-1 rounded-lg text-[10px] font-manrope border ${pointerTail === opt.id ? 'bg-brand-purple/20 border-brand-purple/50 text-white' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                                                            >
                                                                {opt.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 24h Clock Button */}
                                <div className="flex items-center bg-brand-surface/80 backdrop-blur-xl border border-brand-border/10 rounded-xl p-1 gap-0.5 shadow-2xl ring-1 ring-white/5 relative">
                                    <button 
                                        onClick={() => setActiveToolbarMenu(m => m === 'timeRing' ? null : 'timeRing')}
                                        className={`p-1 rounded-lg transition-all border ${activeToolbarMenu === 'timeRing' ? 'bg-brand-purple/20 text-brand-purple border-brand-purple/30' : 'hover:bg-brand-surface-highlight text-brand-text-muted border-transparent'}`}
                                        title={t('chrono.timeRingOptions')}
                                    >
                                        <UI_ICONS.ClockIcon className="w-4 h-4" />
                                    </button>

                                    {activeToolbarMenu === 'timeRing' && (
                                        <div className="absolute top-0 right-full mr-2 w-64 bg-brand-surface/95 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-2xl z-50 ring-1 ring-white/5 flex flex-col gap-4 font-manrope">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-brand-text-muted font-manrope">{t('chrono.showTimeRing')}</span>
                                                <button onClick={() => setShowTimeRing(!showTimeRing)} className={`w-8 h-4 rounded-full relative transition-colors ${showTimeRing ? 'bg-brand-purple' : 'bg-brand-surface-highlight'}`}>
                                                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-brand-text transition-all`} style={{ left: showTimeRing ? 'calc(100% - 14px)' : '2px' }} />
                                                </button>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-[10px] uppercase text-brand-text-muted font-bold tracking-wider flex justify-between">
                                                    <span>{t('chrono.timeRingScale')}</span>
                                                    <span>{Math.round(timeRingScale * 100)}%</span>
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

                                {/* Aspect Lines Button */}
                                <div className="flex items-center bg-brand-surface/80 backdrop-blur-xl border border-brand-border/10 rounded-xl p-1 gap-0.5 shadow-2xl ring-1 ring-white/5 relative">
                                    <button 
                                        onClick={() => setActiveToolbarMenu(m => m === 'aspects' ? null : 'aspects')}
                                        className={`p-1 rounded-lg transition-all border ${activeToolbarMenu === 'aspects' || showAspectLines || showNatalLines ? 'bg-brand-purple/20 text-brand-purple border-brand-purple/30' : 'hover:bg-brand-surface-highlight text-brand-text-muted border-transparent'}`}
                                        title={t('chrono.aspectLines')}
                                    >
                                        <UI_ICONS.AspectIcon className="w-4 h-4" />
                                    </button>

                                    {activeToolbarMenu === 'aspects' && (
                                        <div className="absolute top-0 right-full mr-2 w-56 bg-brand-surface/95 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-2xl z-50 ring-1 ring-white/5 flex flex-col gap-4 font-manrope">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-brand-text-muted font-manrope">{t('chrono.aspectLines')}</span>
                                                <button onClick={() => handleToggleAspectLines()} className={`w-8 h-4 rounded-full relative transition-colors ${showAspectLines ? 'bg-brand-purple' : 'bg-brand-surface-highlight'}`}>
                                                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-brand-text transition-all`} style={{ left: showAspectLines ? 'calc(100% - 14px)' : '2px' }} />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-brand-text-muted font-manrope">{t('chrono.natalAspects')}</span>
                                                <button 
                                                    onClick={() => natalTime && handleToggleNatalLines()} 
                                                    disabled={!natalTime}
                                                    className={`w-8 h-4 rounded-full relative transition-colors ${showNatalLines ? 'bg-brand-purple' : 'bg-brand-surface-highlight'} ${!natalTime ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-brand-text transition-all`} style={{ left: showNatalLines ? 'calc(100% - 14px)' : '2px' }} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Sign Lines Button */}
                                <div className="flex items-center bg-brand-surface/80 backdrop-blur-xl border border-brand-border/10 rounded-xl p-1 gap-0.5 shadow-2xl ring-1 ring-white/5">
                                    <button 
                                        onClick={() => setShowSignLines(!showSignLines)}
                                        className={`p-1 rounded-lg transition-all border ${showSignLines ? 'bg-brand-purple/20 text-brand-purple border-brand-purple/30' : 'hover:bg-brand-surface-highlight text-brand-text-muted border-transparent'}`}
                                        title={t('chrono.signLines')}
                                    >
                                        <UI_ICONS.SignLinesIcon className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* House Lines Button */}
                                <div className="flex items-center bg-brand-surface/80 backdrop-blur-xl border border-brand-border/10 rounded-xl p-1 gap-0.5 shadow-2xl ring-1 ring-white/5 relative">
                                    <button 
                                        onClick={() => setActiveToolbarMenu(m => m === 'house' ? null : 'house')}
                                        className={`p-1 rounded-lg transition-all border ${activeToolbarMenu === 'house' ? 'bg-brand-purple/20 text-brand-purple border-brand-purple/30' : 'hover:bg-brand-surface-highlight text-brand-text-muted border-transparent'}`}
                                        title={t('chrono.houseOptions')}
                                    >
                                        <UI_ICONS.HouseLinesIcon className="w-4 h-4" />
                                    </button>

                                    {activeToolbarMenu === 'house' && (
                                        <div className="absolute top-0 right-full mr-2 w-64 bg-brand-surface/95 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-2xl z-50 ring-1 ring-white/5 flex flex-col gap-4 font-manrope">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-brand-text-muted font-manrope">{t('chrono.showLines')}</span>
                                                <button onClick={() => setShowHouseLines(!showHouseLines)} className={`w-8 h-4 rounded-full relative transition-colors ${showHouseLines ? 'bg-brand-purple' : 'bg-brand-surface-highlight'}`}>
                                                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-brand-text transition-all`} style={{ left: showHouseLines ? 'calc(100% - 14px)' : '2px' }} />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-brand-text-muted font-manrope">Marcadores de Casas</span>
                                                <button onClick={() => setShowHouseMarkers(!showHouseMarkers)} className={`w-8 h-4 rounded-full relative transition-colors ${showHouseMarkers ? 'bg-brand-purple' : 'bg-brand-surface-highlight'}`}>
                                                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-brand-text transition-all`} style={{ left: showHouseMarkers ? 'calc(100% - 14px)' : '2px' }} />
                                                </button>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-[10px] uppercase text-brand-text-muted font-bold tracking-wider">{t('chrono.lineStyle')}</label>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setHouseLineFormat('solid')} className={`flex-1 py-1.5 rounded-lg text-xs font-manrope border ${houseLineFormat === 'solid' ? 'bg-brand-purple/20 border-brand-purple/50 text-white' : 'border-brand-border/10 text-brand-text-muted hover:bg-brand-surface-highlight'}`}>{t('chrono.solid')}</button>
                                                    <button onClick={() => setHouseLineFormat('dashed')} className={`flex-1 py-1.5 rounded-lg text-xs font-manrope border ${houseLineFormat === 'dashed' ? 'bg-brand-purple/20 border-brand-purple/50 text-white' : 'border-brand-border/10 text-brand-text-muted hover:bg-brand-surface-highlight'}`}>{t('chrono.dashed')}</button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] uppercase text-brand-text-muted font-bold tracking-wider flex justify-between">
                                                    <span>{t('chrono.thickness')}</span>
                                                    <span>{houseLineThickness}px</span>
                                                </label>
                                                <input 
                                                    type="range" min="0.5" max="3" step="0.5" 
                                                    value={houseLineThickness} 
                                                    onChange={(e) => setHouseLineThickness(Number(e.target.value))}
                                                    className="w-full accent-brand-purple"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] uppercase text-brand-text-muted font-bold tracking-wider flex justify-between">
                                                    <span>{t('chrono.opacity')}</span>
                                                    <span>{Math.round(houseLineOpacity * 100)}%</span>
                                                </label>
                                                <input 
                                                    type="range" min="0.1" max="1" step="0.1" 
                                                    value={houseLineOpacity} 
                                                    onChange={(e) => setHouseLineOpacity(Number(e.target.value))}
                                                    className="w-full accent-brand-purple"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Orbits Button */}
                                <div className="flex items-center bg-brand-surface/80 backdrop-blur-xl border border-brand-border/10 rounded-xl p-1 gap-0.5 shadow-2xl ring-1 ring-white/5">
                                    <button 
                                        onClick={() => setShowOrbits(!showOrbits)}
                                        className={`p-1 rounded-lg transition-all border ${showOrbits ? 'bg-brand-purple/20 text-brand-purple border-brand-purple/30' : 'hover:bg-brand-surface-highlight text-brand-text-muted border-transparent'}`}
                                        title={t('chrono.orbits')}
                                    >
                                        <UI_ICONS.OrbitIcon className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Magnetic Field Button */}
                                <div className="flex items-center bg-brand-surface/80 backdrop-blur-xl border border-brand-border/10 rounded-xl p-1 gap-0.5 shadow-2xl ring-1 ring-white/5 relative">
                                    <button 
                                        onClick={() => setActiveToolbarMenu(m => m === 'magnetic' ? null : 'magnetic')}
                                        className={`p-1 rounded-lg transition-all border ${activeToolbarMenu === 'magnetic' || showMagneticField ? 'bg-brand-purple/20 text-brand-purple border-brand-purple/30' : 'hover:bg-brand-surface-highlight text-brand-text-muted border-transparent'}`}
                                        title={t('chrono.magneticField')}
                                    >
                                        <UI_ICONS.MagnetIcon className="w-4 h-4" />
                                    </button>

                                    {activeToolbarMenu === 'magnetic' && (
                                        <div className="absolute top-0 right-full mr-2 w-64 bg-brand-surface/95 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-2xl z-50 ring-1 ring-white/5 flex flex-col gap-4 font-manrope">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-brand-text-muted font-manrope">{t('chrono.showMagneticField')}</span>
                                                <button onClick={() => setShowMagneticField(!showMagneticField)} className={`w-8 h-4 rounded-full relative transition-colors ${showMagneticField ? 'bg-brand-purple' : 'bg-brand-surface-highlight'}`}>
                                                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-brand-text transition-all`} style={{ left: showMagneticField ? 'calc(100% - 14px)' : '2px' }} />
                                                </button>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-[10px] uppercase text-brand-text-muted font-bold tracking-wider flex justify-between">
                                                    <span>{t('chrono.fieldSize')}</span>
                                                    <span>{magneticFieldSize.toFixed(1)}x</span>
                                                </label>
                                                <input 
                                                    type="range" min="0.5" max="1.7" step="0.1" 
                                                    value={magneticFieldSize} 
                                                    onChange={(e) => setMagneticFieldSize(Number(e.target.value))}
                                                    className="w-full accent-brand-purple"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] uppercase text-brand-text-muted font-bold tracking-wider flex justify-between">
                                                    <span>{t('chrono.fieldOpacity')}</span>
                                                    <span>{Math.round(magneticFieldOpacity * 100)}%</span>
                                                </label>
                                                <input 
                                                    type="range" min="0" max="1" step="0.05" 
                                                    value={magneticFieldOpacity} 
                                                    onChange={(e) => setMagneticFieldOpacity(Number(e.target.value))}
                                                    className="w-full accent-brand-purple"
                                                />
                                            </div>
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
                            <div className="w-full h-full max-w-4xl max-h-[calc(100vh-220px)] relative flex items-center justify-center">
                            <SiderealClock 
                                celestialData={celestialData}
                                natalData={natalData.currentTime.getTime() > 0 ? natalData : undefined}
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
                                showAspectLines={showAspectLines || showNatalLines} 
                                isNatalMode={showNatalLines}
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
                                timeRingScale={timeRingScale}
                                theme={theme}
                                onClockClick={() => setShowCalendarPanel(!showCalendarPanel)}
                                houseLineThickness={houseLineThickness}
                                houseLineOpacity={houseLineOpacity}
                            />
                        </div>
                        
                        {/* Sun and Moon Info Panels */}
                        <div className="absolute bottom-16 left-4 z-10 pointer-events-auto flex items-end gap-2" ref={menuRefs.eclipses}>
                            <button
                                onClick={() => setIsMoonPanelVisible(!isMoonPanelVisible)}
                                className="w-5 h-[84px] bg-brand-surface/80 backdrop-blur-xl border border-brand-border/10 rounded-lg flex items-center justify-center text-brand-text-muted hover:text-brand-text hover:bg-brand-surface-highlight transition-all shadow-lg"
                                title={isMoonPanelVisible ? "Minimizar Painel da Lua" : "Maximizar Painel da Lua"}
                            >
                                {isMoonPanelVisible ? <UI_ICONS.ChevronLeftIcon className="w-4 h-4" /> : <UI_ICONS.ChevronRightIcon className="w-4 h-4" />}
                            </button>
                            
                            {isMoonPanelVisible && (
                                <MoonInfoPanel 
                                    moonPhase={celestialData.moonPhase}
                                    moonIllumination={celestialData.moonIllumination}
                                    moonEclipticLongitude={celestialData.moonEclipticLongitude}
                                    moonriseTime={celestialData.moonriseTime}
                                    moonsetTime={celestialData.moonsetTime}
                                    currentDate={currentTime}
                                    onClick={() => setShowEclipseModal(!showEclipseModal)}
                                />
                            )}
                            {showEclipseModal && (
                                <div className="absolute bottom-full left-0 mb-3 bg-brand-surface/95 backdrop-blur-xl border border-brand-border/10 rounded-2xl p-4 shadow-2xl w-80 z-50 ring-1 ring-brand-border/5 font-manrope animate-in fade-in slide-in-from-bottom-2 duration-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-[10px] font-bold text-brand-text uppercase tracking-widest">Eventos Astronômicos</h3>
                                        <button onClick={() => setShowEclipseModal(false)} className="text-brand-text-muted hover:text-brand-text">
                                            <UI_ICONS.CloseIcon className="w-3 h-3" />
                                        </button>
                                    </div>

                                    {/* Tabs */}
                                    <div className="flex bg-brand-surface-highlight/30 rounded-lg p-0.5 mb-4 border border-brand-border/5">
                                        {[
                                            { id: 'phases', label: 'Fases da Lua' },
                                            { id: 'eclipses', label: 'Eclipses' },
                                            { id: 'other', label: 'Outros' }
                                        ].map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveAstronomyTab(tab.id as any)}
                                                className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all ${activeAstronomyTab === tab.id ? 'bg-brand-purple text-white shadow-lg' : 'text-brand-text-muted hover:text-brand-text'}`}
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                                        {activeAstronomyTab === 'phases' && getNextMoonPhases(currentTime).map((phase, idx) => (
                                            <div key={`phase-${idx}`} className="p-3 rounded-xl bg-brand-surface-highlight/30 border border-brand-border/5 hover:border-brand-purple/30 transition-colors group">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-[10px] font-bold text-brand-purple uppercase tracking-wider group-hover:text-brand-purple-light transition-colors flex items-center gap-1">
                                                        <span className="text-sm">{phase.icon}</span> {phase.name}
                                                    </span>
                                                    <span className="text-[9px] font-medium text-brand-text-muted bg-brand-surface-highlight/50 px-2 py-0.5 rounded-full">
                                                        {phase.date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {activeAstronomyTab === 'eclipses' && ECLIPSE_EVENTS.filter(e => e.type === 'solar' || e.type === 'lunar').map(event => (
                                            <div key={event.id} className="p-3 rounded-xl bg-brand-surface-highlight/30 border border-brand-border/5 hover:border-brand-purple/30 transition-colors group">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-[10px] font-bold text-brand-purple uppercase tracking-wider group-hover:text-brand-purple-light transition-colors">
                                                        {event.name}
                                                    </span>
                                                    <span className="text-[9px] font-medium text-brand-text-muted bg-brand-surface-highlight/50 px-2 py-0.5 rounded-full">
                                                        {event.date}
                                                    </span>
                                                </div>
                                                <p className="text-[9px] text-brand-text-muted leading-relaxed">
                                                    {event.description}
                                                </p>
                                            </div>
                                        ))}
                                        {activeAstronomyTab === 'other' && ECLIPSE_EVENTS.filter(e => e.type === 'other').map(event => (
                                            <div key={event.id} className="p-3 rounded-xl bg-brand-surface-highlight/30 border border-brand-border/5 hover:border-brand-purple/30 transition-colors group">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-[10px] font-bold text-brand-purple uppercase tracking-wider group-hover:text-brand-purple-light transition-colors">
                                                        {event.name}
                                                    </span>
                                                    <span className="text-[9px] font-medium text-brand-text-muted bg-brand-surface-highlight/50 px-2 py-0.5 rounded-full">
                                                        {event.date}
                                                    </span>
                                                </div>
                                                <p className="text-[9px] text-brand-text-muted leading-relaxed">
                                                    {event.description}
                                                </p>
                                            </div>
                                        ))}
                                        {activeAstronomyTab === 'eclipses' && ECLIPSE_EVENTS.filter(e => e.type === 'solar' || e.type === 'lunar').length === 0 && (
                                            <div className="py-8 text-center text-brand-text-muted text-[10px] italic">
                                                Nenhum evento encontrado para esta categoria.
                                            </div>
                                        )}
                                        {activeAstronomyTab === 'other' && ECLIPSE_EVENTS.filter(e => e.type === 'other').length === 0 && (
                                            <div className="py-8 text-center text-brand-text-muted text-[10px] italic">
                                                Nenhum evento encontrado para esta categoria.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="absolute bottom-16 right-4 z-10 pointer-events-auto flex items-end gap-2">
                            {isSunPanelVisible && (
                                <SunInfoPanel 
                                    sunriseTime={celestialData.sunriseTime}
                                    sunsetTime={celestialData.sunsetTime}
                                    currentDate={currentTime}
                                />
                            )}
                            <button
                                onClick={() => setIsSunPanelVisible(!isSunPanelVisible)}
                                className="w-5 h-[84px] bg-brand-surface/80 backdrop-blur-xl border border-brand-border/10 rounded-lg flex items-center justify-center text-brand-text-muted hover:text-brand-text hover:bg-brand-surface-highlight transition-all shadow-lg"
                                title={isSunPanelVisible ? "Minimizar Painel do Sol" : "Maximizar Painel do Sol"}
                            >
                                {isSunPanelVisible ? <UI_ICONS.ChevronRightIcon className="w-4 h-4" /> : <UI_ICONS.ChevronLeftIcon className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* Bottom Right Fullscreen Button - Removed */}
                        {/* Bottom Left Fix Zodiac and Pointer Buttons - Removed */}
                    </div>

                    {!immersiveMode && (
                    <div className="absolute bottom-2 left-2 right-2 z-50 flex items-center justify-between pointer-events-none font-display">
                        
                        {/* Group 1: Left Controls (Pointer & Zodiac & Moon) */}
                        <div className="pointer-events-auto flex items-center gap-2">
                            <div className="flex items-center bg-brand-surface/80 backdrop-blur-xl border border-brand-border/10 rounded-xl p-1 gap-0.5 shadow-2xl ring-1 ring-white/5">
                                {/* Zodiac Fix Button */}
                                <button 
                                    onClick={() => setIsZodiacFixed(!isZodiacFixed)}
                                    className={`p-2 rounded-lg transition-all border ${isZodiacFixed ? 'bg-brand-purple/20 text-brand-purple border-brand-purple/30 shadow-[0_0_10px_rgba(124,58,237,0.2)]' : 'hover:bg-brand-surface-highlight text-brand-text-muted border-transparent'}`}
                                    title={isZodiacFixed ? 'Zodíaco Fixo' : 'Fixar Zodíaco'}
                                >
                                    <div className="flex items-center justify-center relative w-4 h-4">
                                        <UI_ICONS.PinIcon className="w-3 h-3 absolute -top-0.5 -left-0.5" />
                                        <ZODIAC_ICONS.aries className="w-2.5 h-2.5 absolute bottom-0 right-0 opacity-80" />
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Group 3: Main Time Controls (Center Absolute) */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3 pointer-events-auto">
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
                            />

                            {/* Minimize Button */}
                            <div className="flex-shrink-0 flex items-stretch bg-brand-surface/80 backdrop-blur-xl border border-brand-border/10 rounded-xl p-1 shadow-2xl ring-1 ring-white/5">
                                <button
                                    onClick={() => setIsTimeControlsMinimized(!isTimeControlsMinimized)}
                                    className="px-1.5 rounded-lg hover:bg-brand-surface-highlight text-brand-text-muted transition-all flex items-center justify-center"
                                    title={isTimeControlsMinimized ? "Expandir Controles" : "Minimizar Controles"}
                                >
                                    {isTimeControlsMinimized ? <UI_ICONS.ChevronLeftIcon className="w-3 h-3" /> : <UI_ICONS.ChevronRightIcon className="w-3 h-3" />}
                                </button>
                            </div>
                        </div>

                        {/* Group 3: Right Controls (Fullscreen & Options) */}
                        <div className="pointer-events-auto flex items-center gap-4">
                            {/* Sun Display - Removed */}

                            <div className="flex items-center bg-brand-surface/80 backdrop-blur-xl border border-brand-border/10 rounded-xl p-1 gap-0.5 shadow-2xl ring-1 ring-white/5" ref={menuRefs.options}>
                                {/* Options Button */}
                                <div className="relative">
                                    <button 
                                        onClick={toggleOptionsMenu}
                                        className={`p-2 rounded-lg transition-all border ${showOptionsMenu ? 'bg-brand-purple/20 text-brand-purple border-brand-purple/30' : 'hover:bg-brand-surface-highlight text-brand-text-muted border-transparent'}`}
                                        title="Opções"
                                    >
                                        <UI_ICONS.SettingsIcon className="w-4 h-4" />
                                    </button>

                                    {showOptionsMenu && (
                                        <div className="absolute bottom-full right-0 mb-2 bg-brand-surface/95 backdrop-blur-xl border border-brand-border/10 rounded-2xl p-4 shadow-2xl w-72 flex flex-col gap-4 z-50 ring-1 ring-brand-border/5 font-manrope animate-in fade-in zoom-in-95 duration-100">
                                            
                                            {/* Theme Toggle - Removed */}

                                            {/* Display Options (Moved from Top Menu) */}
                                            <div className="flex flex-col gap-2">
                                                {/* Relógio 24h moved to toolbar */}
                                                {/* Eixo MC/IC removed */}
                                                {/* Números Romanos removed */}
                                            </div>

                                            <div className="h-px bg-brand-border/10"></div>

                                            {/* Size Controls */}
                                            <div className="flex flex-col gap-2">
                                                <div className="flex justify-between items-center text-[10px] text-brand-text-muted uppercase font-bold tracking-wider font-manrope">
                                                    <span>Planetas</span>
                                                    <span className="font-manrope text-brand-text">{clockPlanetSize}px</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => setClockPlanetSize(s => Math.max(12, s - 2))} className="w-8 h-8 flex items-center justify-center bg-brand-surface-highlight/50 hover:bg-brand-surface-highlight rounded-lg text-brand-text border border-brand-border/5">-</button>
                                                    <div className="flex-1 h-1.5 bg-brand-surface-highlight/50 rounded-full overflow-hidden border border-brand-border/5">
                                                        <div className="h-full bg-brand-purple" style={{ width: `${((clockPlanetSize - 12) / (84 - 12)) * 100}%` }}></div>
                                                    </div>
                                                    <button onClick={() => setClockPlanetSize(s => Math.min(84, s + 2))} className="w-8 h-8 flex items-center justify-center bg-brand-surface-highlight/50 hover:bg-brand-surface-highlight rounded-lg text-brand-text border border-brand-border/5">+</button>
                                                </div>
                                            </div>

                                            <div className="h-px bg-brand-border/10"></div>

                                            <div className="flex flex-col gap-2">
                                                <div className="flex justify-between items-center text-[10px] text-brand-text-muted uppercase font-bold tracking-wider font-manrope">
                                                    <span>Signos</span>
                                                    <span className="font-manrope text-brand-text">{zodiacSignSize}px</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => setZodiacSignSize(s => Math.max(10, s - 2))} className="w-8 h-8 flex items-center justify-center bg-brand-surface-highlight/50 hover:bg-brand-surface-highlight rounded-lg text-brand-text border border-brand-border/5">-</button>
                                                    <div className="flex-1 h-1.5 bg-brand-surface-highlight/50 rounded-full overflow-hidden border border-brand-border/5">
                                                        <div className="h-full bg-brand-purple" style={{ width: `${((zodiacSignSize - 10) / (60 - 10)) * 100}%` }}></div>
                                                    </div>
                                                    <button onClick={() => setZodiacSignSize(s => Math.min(60, s + 2))} className="w-8 h-8 flex items-center justify-center bg-brand-surface-highlight/50 hover:bg-brand-surface-highlight rounded-lg text-brand-text border border-brand-border/5">+</button>
                                                </div>
                                            </div>

                                            <div className="h-px bg-brand-border/10"></div>

                                            <div className="flex flex-col gap-2">
                                                <div className="flex justify-between items-center text-[10px] text-brand-text-muted uppercase font-bold tracking-wider font-manrope">
                                                    <span>Painel Esquerdo</span>
                                                    <span className="font-manrope text-brand-text">{Math.round(leftPanelScale * 100)}%</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => setLeftPanelScale(s => Math.max(0.6, Number((s - 0.1).toFixed(1))))} className="w-8 h-8 flex items-center justify-center bg-brand-surface-highlight/50 hover:bg-brand-surface-highlight rounded-lg text-brand-text border border-brand-border/5">-</button>
                                                    <div className="flex-1 h-1.5 bg-brand-surface-highlight/50 rounded-full overflow-hidden border border-brand-border/5">
                                                        <div className="h-full bg-brand-purple" style={{ width: `${((leftPanelScale - 0.6) / (1.4 - 0.6)) * 100}%` }}></div>
                                                    </div>
                                                    <button onClick={() => setLeftPanelScale(s => Math.min(1.4, Number((s + 0.1).toFixed(1))))} className="w-8 h-8 flex items-center justify-center bg-brand-surface-highlight/50 hover:bg-brand-surface-highlight rounded-lg text-brand-text border border-brand-border/5">+</button>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <div className="flex justify-between items-center text-[10px] text-brand-text-muted uppercase font-bold tracking-wider font-manrope">
                                                    <span>Painel Direito</span>
                                                    <span className="font-manrope text-brand-text">{Math.round(rightPanelScale * 100)}%</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => setRightPanelScale(s => Math.max(0.6, Number((s - 0.1).toFixed(1))))} className="w-8 h-8 flex items-center justify-center bg-brand-surface-highlight/50 hover:bg-brand-surface-highlight rounded-lg text-brand-text border border-brand-border/5">-</button>
                                                    <div className="flex-1 h-1.5 bg-brand-surface-highlight/50 rounded-full overflow-hidden border border-brand-border/5">
                                                        <div className="h-full bg-brand-purple" style={{ width: `${((rightPanelScale - 0.6) / (1.4 - 0.6)) * 100}%` }}></div>
                                                    </div>
                                                    <button onClick={() => setRightPanelScale(s => Math.min(1.4, Number((s + 0.1).toFixed(1))))} className="w-8 h-8 flex items-center justify-center bg-brand-surface-highlight/50 hover:bg-brand-surface-highlight rounded-lg text-brand-text border border-brand-border/5">+</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button 
                                    onClick={() => setImmersiveMode(!immersiveMode)}
                                    className={`p-2 rounded-lg transition-all border ${immersiveMode ? 'bg-brand-purple/20 text-brand-purple border-brand-purple/30' : 'hover:bg-brand-surface-highlight text-brand-text-muted border-transparent'}`}
                                    title={immersiveMode ? "Sair da Tela Cheia" : "Tela Cheia Imersiva"}
                                >
                                    {immersiveMode ? <UI_ICONS.ExitFullscreenIcon className="w-4 h-4" /> : <UI_ICONS.FullscreenIcon className="w-4 h-4" />}
                                </button>
                            </div>
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
                    {!immersiveMode && (
                        <button
                            onClick={() => setIsRightPanelVisible(!isRightPanelVisible)}
                            className="w-3 h-12 bg-transparent hover:bg-brand-surface/50 border border-brand-border/20 rounded-l-md flex items-center justify-center text-brand-text-muted hover:text-brand-text transition-all self-center"
                            title={isRightPanelVisible ? "Ocultar Painel Direito" : "Mostrar Painel Direito"}
                        >
                            {isRightPanelVisible ? <UI_ICONS.ChevronRightIcon className="w-3 h-3" /> : <UI_ICONS.ChevronLeftIcon className="w-3 h-3" />}
                        </button>
                    )}
                    <aside 
                        onDragOver={(e) => handleDragOver(e, 'details')}
                        className={`column-wrapper flex flex-col transition-all duration-300 z-10 gap-1.5 ${immersiveMode || !isRightPanelVisible || (rightPanels.length === 0 && draggedItem?.type !== 'panel') ? 'hidden' : ''} ${draggedItem?.type === 'column' && draggedItem.id === 'details' ? 'opacity-50 grayscale scale-95' : ''}`}
                        style={{
                            width: rightPanels.length === 0 ? '200px' : `${rightPanelWidth}px`
                        }}
                    >
                        {rightPanels.length === 0 && draggedItem?.type === 'panel' && (
                            <div className="flex-1 border-2 border-dashed border-blue-400/50 bg-blue-400/10 rounded-3xl flex items-center justify-center transition-all">
                                <span className="text-blue-400/50 font-medium text-sm">Solte aqui</span>
                            </div>
                        )}
                        {rightPanels.map(id => renderPanel(id, 'right'))}
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
                                <label className="block text-xs font-bold uppercase text-brand-text-muted mb-1">Local (Capital)</label>
                                <div className="relative">
                                    <select 
                                        value={tempLocationIndex}
                                        onChange={(e) => setTempLocationIndex(Number(e.target.value))}
                                        className="w-full bg-brand-surface-highlight/50 border border-brand-border/10 rounded-lg px-3 py-2 text-brand-text focus:ring-2 focus:ring-violet-500 outline-none appearance-none"
                                    >
                                        {BRAZIL_CAPITALS.map((cap, idx) => (
                                            <option key={cap.name} value={idx} className="text-black">{cap.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-brand-text-muted">
                                        <UI_ICONS.ChevronDownIcon className="w-4 h-4" />
                                    </div>
                                </div>
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
                    <div className="bg-brand-surface border border-brand-border/10 rounded-2xl shadow-2xl w-full max-w-md p-6 m-4 transform transition-all scale-100 border-t-4 border-t-yellow-500 relative">
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-yellow-500/5 to-transparent"></div>
                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <h2 className="text-lg font-bold uppercase text-yellow-400 tracking-wide flex items-center gap-2">
                                <UI_ICONS.StarIcon className="w-5 h-5" />
                                Mapa Natal
                            </h2>
                            <button onClick={() => { setIsNatalSettingsOpen(false); setShowNatalCalendar(false); }} className="text-brand-text-muted hover:text-brand-text transition-colors">
                                <UI_ICONS.CloseIcon className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="space-y-4 relative z-10">
                            <div className="relative">
                                <label className="block text-xs font-bold uppercase text-brand-text-muted mb-1">Data de Nascimento</label>
                                <button 
                                    onClick={() => setShowNatalCalendar(!showNatalCalendar)}
                                    className="w-full bg-brand-surface-highlight/50 border border-brand-border/10 rounded-lg px-3 py-2 text-brand-text text-left flex justify-between items-center hover:bg-brand-surface-highlight transition-colors"
                                >
                                    <span className="font-manrope">
                                        {tempNatalDate ? new Date(tempNatalDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Selecionar Data'}
                                    </span>
                                    <UI_ICONS.CalendarIcon className="w-4 h-4 text-brand-text-muted" />
                                </button>
                                
                                <AnimatePresence>
                                    {showNatalCalendar && (
                                        <div className="absolute top-full left-0 mt-2 z-[60]">
                                            <CalendarPanel 
                                                isOpen={showNatalCalendar}
                                                onClose={() => setShowNatalCalendar(false)}
                                                variant="gold"
                                                currentDate={new Date((tempNatalDate || '2000-01-01') + 'T' + (tempNatalTime || '12:00'))}
                                                onDateSelect={(date) => {
                                                    const year = date.getFullYear();
                                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                                    const day = String(date.getDate()).padStart(2, '0');
                                                    setTempNatalDate(`${year}-${month}-${day}`);
                                                    const hours = String(date.getHours()).padStart(2, '0');
                                                    const minutes = String(date.getMinutes()).padStart(2, '0');
                                                    setTempNatalTime(`${hours}:${minutes}`);
                                                    setShowNatalCalendar(false);
                                                }}
                                            />
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold uppercase text-brand-text-muted mb-1">Hora de Nascimento</label>
                                <input 
                                    type="time" 
                                    value={tempNatalTime}
                                    onChange={(e) => setTempNatalTime(e.target.value)}
                                    className="w-full bg-brand-surface-highlight/50 border border-brand-border/10 rounded-lg px-3 py-2 text-brand-text focus:ring-2 focus:ring-yellow-500 outline-none"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold uppercase text-brand-text-muted mb-1">Local de Nascimento (Capital)</label>
                                <div className="relative">
                                    <select 
                                        value={tempNatalLocationIndex}
                                        onChange={(e) => setTempNatalLocationIndex(Number(e.target.value))}
                                        className="w-full bg-brand-surface-highlight/50 border border-brand-border/10 rounded-lg px-3 py-2 text-brand-text focus:ring-2 focus:ring-yellow-500 outline-none appearance-none"
                                    >
                                        {BRAZIL_CAPITALS.map((cap, idx) => (
                                            <option key={cap.name} value={idx} className="text-black">{cap.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-brand-text-muted">
                                        <UI_ICONS.ChevronDownIcon className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8 relative z-10">
                            <button 
                                onClick={() => setIsNatalSettingsOpen(false)}
                                className="flex-1 py-2 rounded-lg border border-brand-border/10 text-brand-text-muted font-semibold hover:bg-brand-surface-highlight transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={saveNatalSettings}
                                className="flex-1 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-semibold shadow-[0_0_15px_rgba(234,179,8,0.3)] transition-colors"
                            >
                                Definir Mapa
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
