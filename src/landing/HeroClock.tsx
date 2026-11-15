/**
 * Relógio real do Cronógrafo, só para olhar, girando ao vivo (São Paulo, agora).
 * Usa o mesmo SiderealClock e o mesmo cálculo do app; não altera nenhum dos dois.
 */
import React, { useEffect, useRef, useState } from 'react';
import { SiderealClock } from '../../components/SiderealClock';
import { useCelestialData } from '../../hooks/useCelestialData';

const SP = { latitude: -23.5505, longitude: -46.6333, displayName: 'São Paulo, BR' };
const VISIBLE: Record<string, boolean> = {
  sun: true, moon: true, mercury: true, venus: true, mars: true, jupiter: true, saturn: true,
  uranus: true, neptune: true, pluto: true, lilith: false, northNode: false, southNode: false,
  chiron: false, ceres: false, pallas: false, juno: false, vesta: false,
};
const NOOP = () => {};

export const HeroClock: React.FC = () => {
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(480);
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const t = window.setInterval(() => { if (!document.hidden) setTime(new Date()); }, 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setSize(Math.max(240, Math.round(el.clientWidth))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const data = useCelestialData(time, SP, VISIBLE, 'porphyry', 'tropical');

  return (
    <div ref={boxRef} style={{ width: '100%', aspectRatio: '1 / 1', pointerEvents: 'none' }}>
      <div style={{ width: size, height: size }}>
        <SiderealClock
          celestialData={data}
          natalData={undefined}
          filteredAspects={data.aspects}
          ghostPlanets={[]}
          visiblePlanets={VISIBLE}
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
          showStars={false}
          showConstellations={false}
          showMagneticField={false}
          showOrbits={true}
          showSeasonsRing={true}
          showTimeRing={true}
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
          locationName={SP.displayName}
          onClockClick={NOOP}
          houseLineThickness={1}
          houseLineOpacity={0.4}
          planetSize={42}
          zodiacSignSize={42}
          seasonIngresses={[]}
          timeRingScale={1.4}
          customBackgroundImage={null}
          magneticFieldSize={1}
          magneticFieldOpacity={0}
          signLineThickness={1}
          signLineOpacity={0.3}
          degreeLabelSize={18}
        />
      </div>
    </div>
  );
};

export default HeroClock;
