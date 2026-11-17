/**
 * Relógio real do Cronógrafo, só para olhar, girando ao vivo (São Paulo, agora).
 * Usa o mesmo SiderealClock e o mesmo cálculo do app; não altera nenhum dos dois.
 *
 * Aparência = padrão do app (App.tsx): sem anel de 24h, anel de estações ligado,
 * constelações e estrelas do próprio cronógrafo, ponteiro "minimal", planetas e signos em 46.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SiderealClock } from '../../components/SiderealClock';
import { useCelestialData } from '../../hooks/useCelestialData';
import { getSeasonIngresses } from '../../lib/astrology/calendars';

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
  const year = time.getFullYear();
  const seasonIngresses = useMemo(() => getSeasonIngresses(year, SP.latitude < 0), [year]);

  return (
    <div ref={boxRef} style={{ width: '100%', aspectRatio: '1 / 1', pointerEvents: 'none' }}>
      <div style={{ width: size, height: size }}>
        <SiderealClock
          celestialData={data}
          location={SP}
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
          planetSize={46}
          zodiacSignSize={46}
          termsGlyphSize={22}
          decanGlyphSize={22}
          graduationRingWidth={18}
          zodiacRingScale={1}
          seasonsRingScale={0.75}
          decanRingScale={2}
          termsRingScale={2}
          ringLineColor="#746F5D"
          showPlanetSpheres={true}
          showDegreeLabels={false}
          degreeLabelSize={18}
          showAspectLines={true}
          showNatalLines={false}
          isNatalMode={false}
          showNeedle={true}
          isZodiacFixed={false}
          locationName={SP.displayName}
          showAtmosphere={false}
          houseFormat="roman"
          houseLineFormat="solid"
          showHouseLines={true}
          showHouseMarkers={true}
          showMcIcArrows={false}
          showTimeRing={false}
          showOrbits={false}
          planetColorMode="colored"
          showStars={true}
          showSeasonsRing={true}
          showDecanRing={true}
          showTermsRing={true}
          zodiacColorMode="element"
          highlightFilter={null}
          showSignLines={false}
          showSignColors={false}
          signLineThickness={1}
          signLineOpacity={0.3}
          pointerStyle="minimal"
          pointerShowGradLine={true}
          pointerFull={false}
          pointerThickness={2.5}
          pointerOpacity={0.8}
          pointerHead="arrow"
          pointerTail="none"
          showConstellations={true}
          customBackgroundImage={null}
          showMagneticField={false}
          magneticFieldSize={1}
          magneticFieldOpacity={0}
          seasonIngresses={seasonIngresses}
          theme="dark"
          onClockClick={NOOP}
          houseLineThickness={1}
          houseLineOpacity={1}
          houseLineColor="#878273"
          mainHouseLineThickness={1.5}
          mainHouseLineOpacity={1}
          mainHouseLineColor="#a3a59d"
          houseMarkerRingColor=""
          houseMarkerRingOpacity={0.38}
        />
      </div>
    </div>
  );
};

export default HeroClock;
