import React, { createContext, useContext, useState, ReactNode } from 'react';
import { HouseSystem } from '../lib/astrology/houseSystem';
import { WidgetId, HighlightFilter } from '../lib/astrology/types';
import { DEFAULT_VISIBLE_PLANETS } from '../lib/astrology/constants';

interface ChartSettingsContextType {
    // House Settings
    houseFormat: 'arabic' | 'roman';
    setHouseFormat: (format: 'arabic' | 'roman') => void;
    houseLineFormat: 'solid' | 'dashed';
    setHouseLineFormat: (format: 'solid' | 'dashed') => void;
    houseSystem: HouseSystem;
    setHouseSystem: (system: HouseSystem) => void;
    houseLineThickness: number;
    setHouseLineThickness: (thickness: number) => void;
    houseLineOpacity: number;
    setHouseLineOpacity: (opacity: number) => void;
    showHouseLines: boolean;
    setShowHouseLines: (show: boolean) => void;
    selectedHouses: number[];
    setSelectedHouses: (houses: number[]) => void;
    hoveredHouse: number | null;
    setHoveredHouse: (house: number | null) => void;

    // Planet Settings
    visiblePlanets: Record<string, boolean>;
    setVisiblePlanets: (visible: Record<string, boolean>) => void;
    selectedPlanets: string[];
    setSelectedPlanets: (planets: string[]) => void;
    hoveredPlanet: string | null;
    setHoveredPlanet: (planet: string | null) => void;
    showPlanetSpheres: boolean;
    setShowPlanetSpheres: (show: boolean) => void;
    showOrbits: boolean;
    setShowOrbits: (show: boolean) => void;
    planetSize: number;
    setPlanetSize: (size: number) => void;
    showRetrograde: boolean;
    setShowRetrograde: (show: boolean) => void;

    // Aspect Settings
    showAspectLines: boolean;
    setShowAspectLines: (show: boolean) => void;
    selectedAspects: string[];
    setSelectedAspects: (aspects: string[]) => void;
    hoveredAspect: string | null;
    setHoveredAspect: (aspect: string | null) => void;
    
    // Zodiac Settings
    isZodiacFixed: boolean;
    setIsZodiacFixed: (fixed: boolean) => void;
    zodiacColorMode: 'element' | 'modality' | 'polarity' | 'none';
    setZodiacColorMode: (mode: 'element' | 'modality' | 'polarity' | 'none') => void;
    showSignLines: boolean;
    setShowSignLines: (show: boolean) => void;
    signLineThickness: number;
    setSignLineThickness: (thickness: number) => void;
    signLineOpacity: number;
    setSignLineOpacity: (opacity: number) => void;
    zodiacSignSize: number;
    setZodiacSignSize: (size: number) => void;
    highlightFilter: HighlightFilter;
    setHighlightFilter: (filter: HighlightFilter) => void;

    // Background & Atmosphere
    showAtmosphere: boolean;
    setShowAtmosphere: (show: boolean) => void;
    atmosphereMode: 'dynamic' | 'night' | 'dawn' | 'day' | 'dusk';
    setAtmosphereMode: (mode: 'dynamic' | 'night' | 'dawn' | 'day' | 'dusk') => void;
    showStars: boolean;
    setShowStars: (show: boolean) => void;
    showConstellations: boolean;
    setShowConstellations: (show: boolean) => void;
    customBackgroundImage: string | null;
    setCustomBackgroundImage: (image: string | null) => void;

    // Pointer Settings
    showNeedle: boolean;
    setShowNeedle: (show: boolean) => void;
    pointerStyle: 'solid' | 'dashed';
    setPointerStyle: (style: 'solid' | 'dashed') => void;
    pointerThickness: number;
    setPointerThickness: (thickness: number) => void;
    pointerHead: 'arrow' | 'circle' | 'diamond' | 'square' | 'none';
    setPointerHead: (head: 'arrow' | 'circle' | 'diamond' | 'square' | 'none') => void;
    pointerTail: 'arrow' | 'circle' | 'diamond' | 'square' | 'none';
    setPointerTail: (tail: 'arrow' | 'circle' | 'diamond' | 'square' | 'none') => void;

    // Other Visuals
    showMcIcArrows: boolean;
    setShowMcIcArrows: (show: boolean) => void;
    showTimeRing: boolean;
    setShowTimeRing: (show: boolean) => void;
    timeRingScale: number;
    setTimeRingScale: (scale: number) => void;
    showSeasonsRing: boolean;
    setShowSeasonsRing: (show: boolean) => void;
    showMagneticField: boolean;
    setShowMagneticField: (show: boolean) => void;
    magneticFieldSize: number;
    setMagneticFieldSize: (size: number) => void;
    theme: 'dark' | 'light';
    setTheme: (theme: 'dark' | 'light') => void;
}

const ChartSettingsContext = createContext<ChartSettingsContextType | undefined>(undefined);

export const ChartSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // House Settings
    const [houseFormat, setHouseFormat] = useState<'arabic' | 'roman'>('roman');
    const [houseLineFormat, setHouseLineFormat] = useState<'solid' | 'dashed'>('solid');
    const [houseSystem, setHouseSystem] = useState<HouseSystem>('porphyry');
    const [houseLineThickness, setHouseLineThickness] = useState(1);
    const [houseLineOpacity, setHouseLineOpacity] = useState(0.4);
    const [showHouseLines, setShowHouseLines] = useState(true);
    const [selectedHouses, setSelectedHouses] = useState<number[]>([]);
    const [hoveredHouse, setHoveredHouse] = useState<number | null>(null);

    // Planet Settings
    const [visiblePlanets, setVisiblePlanets] = useState(DEFAULT_VISIBLE_PLANETS);
    const [selectedPlanets, setSelectedPlanets] = useState<string[]>([]);
    const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
    const [showPlanetSpheres, setShowPlanetSpheres] = useState(true);
    const [showOrbits, setShowOrbits] = useState(true);
    const [planetSize, setPlanetSize] = useState(32);
    const [showRetrograde, setShowRetrograde] = useState(true);

    // Aspect Settings
    const [showAspectLines, setShowAspectLines] = useState(true);
    const [selectedAspects, setSelectedAspects] = useState<string[]>([]);
    const [hoveredAspect, setHoveredAspect] = useState<string | null>(null);

    // Zodiac Settings
    const [isZodiacFixed, setIsZodiacFixed] = useState(false);
    const [zodiacColorMode, setZodiacColorMode] = useState<'element' | 'modality' | 'polarity' | 'none'>('element');
    const [showSignLines, setShowSignLines] = useState(false);
    const [signLineThickness, setSignLineThickness] = useState(1);
    const [signLineOpacity, setSignLineOpacity] = useState(0.3);
    const [zodiacSignSize, setZodiacSignSize] = useState(32);
    const [highlightFilter, setHighlightFilter] = useState<HighlightFilter>(null);

    // Background & Atmosphere
    const [showAtmosphere, setShowAtmosphere] = useState(false);
    const [atmosphereMode, setAtmosphereMode] = useState<'dynamic' | 'night' | 'dawn' | 'day' | 'dusk'>('dynamic');
    const [showStars, setShowStars] = useState(true);
    const [showConstellations, setShowConstellations] = useState(true);
    const [customBackgroundImage, setCustomBackgroundImage] = useState<string | null>(null);

    // Pointer Settings
    const [showNeedle, setShowNeedle] = useState(false);
    const [pointerStyle, setPointerStyle] = useState<'solid' | 'dashed'>('solid');
    const [pointerThickness, setPointerThickness] = useState(1);
    const [pointerHead, setPointerHead] = useState<'arrow' | 'circle' | 'diamond' | 'square' | 'none'>('arrow');
    const [pointerTail, setPointerTail] = useState<'arrow' | 'circle' | 'diamond' | 'square' | 'none'>('none');

    // Other Visuals
    const [showMcIcArrows, setShowMcIcArrows] = useState(false);
    const [showTimeRing, setShowTimeRing] = useState(true);
    const [timeRingScale, setTimeRingScale] = useState(1);
    const [showSeasonsRing, setShowSeasonsRing] = useState(true);
    const [showMagneticField, setShowMagneticField] = useState(false);
    const [magneticFieldSize, setMagneticFieldSize] = useState(1);
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    const value = {
        houseFormat, setHouseFormat,
        houseLineFormat, setHouseLineFormat,
        houseSystem, setHouseSystem,
        houseLineThickness, setHouseLineThickness,
        houseLineOpacity, setHouseLineOpacity,
        showHouseLines, setShowHouseLines,
        selectedHouses, setSelectedHouses,
        hoveredHouse, setHoveredHouse,
        visiblePlanets, setVisiblePlanets,
        selectedPlanets, setSelectedPlanets,
        hoveredPlanet, setHoveredPlanet,
        showPlanetSpheres, setShowPlanetSpheres,
        showOrbits, setShowOrbits,
        planetSize, setPlanetSize,
        showRetrograde, setShowRetrograde,
        showAspectLines, setShowAspectLines,
        selectedAspects, setSelectedAspects,
        hoveredAspect, setHoveredAspect,
        isZodiacFixed, setIsZodiacFixed,
        zodiacColorMode, setZodiacColorMode,
        showSignLines, setShowSignLines,
        signLineThickness, setSignLineThickness,
        signLineOpacity, setSignLineOpacity,
        zodiacSignSize, setZodiacSignSize,
        highlightFilter, setHighlightFilter,
        showAtmosphere, setShowAtmosphere,
        atmosphereMode, setAtmosphereMode,
        showStars, setShowStars,
        showConstellations, setShowConstellations,
        customBackgroundImage, setCustomBackgroundImage,
        showNeedle, setShowNeedle,
        pointerStyle, setPointerStyle,
        pointerThickness, setPointerThickness,
        pointerHead, setPointerHead,
        pointerTail, setPointerTail,
        showMcIcArrows, setShowMcIcArrows,
        showTimeRing, setShowTimeRing,
        timeRingScale, setTimeRingScale,
        showSeasonsRing, setShowSeasonsRing,
        showMagneticField, setShowMagneticField,
        magneticFieldSize, setMagneticFieldSize,
        theme, setTheme
    };

    return (
        <ChartSettingsContext.Provider value={value}>
            {children}
        </ChartSettingsContext.Provider>
    );
};

export const useChartSettings = () => {
    const context = useContext(ChartSettingsContext);
    if (context === undefined) {
        throw new Error('useChartSettings must be used within a ChartSettingsProvider');
    }
    return context;
};
