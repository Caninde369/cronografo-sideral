import React, { useState, useEffect } from 'react';
import { SiderealClock } from './SiderealClock';
import { useCelestialData } from '../hooks/useCelestialData';

const SP_LOCATION = {
    latitude: -23.5505,
    longitude: -46.6333,
    displayName: 'São Paulo, BR',
};

const ALL_VISIBLE: Record<string, boolean> = {
    sun: true,
    moon: true,
    mercury: true,
    venus: true,
    mars: true,
    jupiter: true,
    saturn: true,
    uranus: true,
    neptune: true,
    pluto: true,
    lilith: false,
    northNode: false,
    southNode: false,
    chiron: false,
    ceres: false,
    pallas: false,
    juno: false,
    vesta: false,
};

const NOOP = () => {};

interface CronografoShowcaseProps {
    size?: number;
    showAtmosphere?: boolean;
    planetSize?: number;
    zodiacSignSize?: number;
}

export const CronografoShowcase: React.FC<CronografoShowcaseProps> = ({
    size = 600,
    showAtmosphere = true,
    planetSize = 42,
    zodiacSignSize = 42,
}) => {
    const [time, setTime] = useState(() => new Date());

    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const celestialData = useCelestialData(
        time,
        SP_LOCATION,
        ALL_VISIBLE,
        'porphyry',
        'tropical'
    );

    return (
        <div style={{ width: size, height: size, pointerEvents: 'none' }}>
            <SiderealClock
                celestialData={celestialData}
                natalData={undefined}
                filteredAspects={celestialData.aspects}
                ghostPlanets={[]}
                visiblePlanets={ALL_VISIBLE}
                selectedPlanets={[]}
                selectedAspects={[]}
                selectedHouses={[]}
                hoveredPlanet={null}
                hoveredAspect={null}
                hoveredHouse={null}
                onPlanetClick={NOOP}
                onAspectClick={NOOP}
                onHouseClick={NOOP}
                setHoveredHouse={NOOP}
                showAspectLines={true}
                showNatalLines={false}
                isNatalMode={false}
                showNeedle={true}
                isZodiacFixed={false}
                showAtmosphere={false}
                showStars={true}
                showConstellations={true}
                showMagneticField={false}
                showOrbits={true}
                showSeasonsRing={true}
                showTimeRing={false}
                showHouseLines={true}
                showHouseMarkers={true}
                showMcIcArrows={false}
                showSignLines={false}
                showDegreeLabels={false}
                showPlanetSpheres={true}
                houseFormat="roman"
                houseLineFormat="solid"
                zodiacColorMode="element"
                highlightFilter={null}
                pointerStyle="minimal"
                pointerThickness={3}
                pointerHead={false}
                pointerTail={false}
                theme="dark"
                locationName={SP_LOCATION.displayName}
                onClockClick={NOOP}
                houseLineThickness={1}
                houseLineOpacity={0.4}
                planetSize={42}
                zodiacSignSize={42}
                seasonIngresses={[]}
                timeRingScale={1}
                customBackgroundImage={null}
                magneticFieldSize={1}
                magneticFieldOpacity={0}
                signLineThickness={1}
                signLineOpacity={0.3}
                degreeLabelSize={18}
            />
        </div>
    );
};