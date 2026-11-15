/**
 * "Teste agora": o relógio e os painéis Astros e Aspectos de verdade, no céu de agora.
 * Os mesmos componentes e cálculos do app; aqui só ligamos a seleção entre eles.
 * Tocar num astro (no painel ou no relógio) destaca ele e os aspectos dele;
 * tocar num aspecto destaca os dois astros. Nada é salvo.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SiderealClock } from '../../components/SiderealClock';
import { CelestialBodyPanel, CelestialSettings } from '../../components/CelestialBodyPanel';
import { AstroInfoPanel, AspectSettings } from '../../components/AstroInfoPanel';
import { useCelestialData } from '../../hooks/useCelestialData';
import { LanguageProvider } from '../../i18n';

const SP = { latitude: -23.5505, longitude: -46.6333, displayName: 'São Paulo, BR' };
const MAIN = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
const LOCKED = ['lilith', 'northNode', 'southNode', 'chiron', 'ceres', 'pallas', 'juno', 'vesta', 'partOfFortune'];
const INITIAL_VISIBLE: Record<string, boolean> = Object.fromEntries([...MAIN.map(id => [id, true]), ...LOCKED.map(id => [id, false])]);
const NOOP = () => {};

const CELESTIAL_SETTINGS: CelestialSettings = {
  planets: { symbols: true, glyphs: false, colors: true, names: true, namesColors: true, namesAbbr: true },
  signs: { enabled: true, symbols: true, colors: true, abbr: false },
  houses: { enabled: true, format: 'roman' },
  degrees: true,
  degrees_colors: false,
  retrograde: true,
} as CelestialSettings;

const ASPECT_SETTINGS: AspectSettings = {
  planets: { symbols: true, glyphs: false, colors: true, names: false, nameColors: false, namesAbbr: true },
  signs: { enabled: false, colors: true },
  houses: { enabled: false },
  aspects: { symbols: true, abbr: false, names: false, types: { conjunction: true, opposition: true, trine: true, square: true, sextile: true } },
  orb: true,
  transitDates: true,
} as AspectSettings;

const Bench: React.FC = () => {
  const [time, setTime] = useState(() => new Date());
  const [visible, setVisible] = useState<Record<string, boolean>>(INITIAL_VISIBLE);
  const [selPlanets, setSelPlanets] = useState<string[]>([]);
  const [selAspects, setSelAspects] = useState<string[]>([]);
  const [hoverPlanet, setHoverPlanet] = useState<string | null>(null);
  const [hoverAspect, setHoverAspect] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<any>(null);
  const [tab, setTab] = useState<'astros' | 'aspectos'>('astros');
  const [houseFormat, setHouseFormat] = useState<'arabic' | 'roman'>('roman');
  const [celSettings, setCelSettings] = useState<CelestialSettings>(CELESTIAL_SETTINGS);
  const [aspSettings, setAspSettings] = useState<AspectSettings>(ASPECT_SETTINGS);
  const clockBox = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(520);
  // até 1024 px: relógio em cima e um painel por vez embaixo
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 1024px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)');
    const on = () => setNarrow(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => { if (!document.hidden) setTime(new Date()); }, 1000);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => {
    const el = clockBox.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setSize(Math.max(260, Math.round(el.clientWidth))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const data = useCelestialData(time, SP, visible, 'porphyry', 'tropical');

  // mesma lógica do app: com astros selecionados, só os aspectos deles; os parceiros viram "fantasmas"
  const { lines, ghosts, fromAspects } = useMemo(() => {
    const all = (data.aspects || []).filter((a: any) => (aspSettings.aspects.types as any)[a.type] !== false);
    let lines = all;
    const ghosts = new Set<string>();
    if (selPlanets.length) {
      lines = all.filter((a: any) => selPlanets.includes(a.body1.id) || selPlanets.includes(a.body2.id));
      lines.forEach((a: any) => {
        if (selPlanets.includes(a.body1.id) && !selPlanets.includes(a.body2.id)) ghosts.add(a.body2.id);
        if (selPlanets.includes(a.body2.id) && !selPlanets.includes(a.body1.id)) ghosts.add(a.body1.id);
      });
    }
    const fromAspects = new Set<string>();
    all.forEach((a: any) => { if (selAspects.includes(a.id)) { fromAspects.add(a.body1.id); fromAspects.add(a.body2.id); } });
    return { lines, ghosts: Array.from(ghosts), fromAspects: Array.from(fromAspects) };
  }, [data.aspects, selPlanets, selAspects, aspSettings.aspects.types]);

  const togglePlanet = useCallback((id: string) => {
    if (LOCKED.includes(id)) return;
    setSelPlanets(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));
  }, []);
  const toggleVisible = useCallback((id: string) => {
    if (LOCKED.includes(id)) return;
    setVisible(v => ({ ...v, [id]: !v[id] }));
  }, []);
  const toggleAspect = useCallback((id: string) => setSelAspects(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id])), []);
  const clear = useCallback(() => { setSelPlanets([]); setSelAspects([]); }, []);

  const astros = (
    <CelestialBodyPanel
      {...(data as any)}
      retrogradeStatus={data.retrogradeStatus}
      stationaryStatus={data.stationaryStatus}
      housePlacements={data.housePlacements}
      visiblePlanets={visible}
      onVisibilityChange={setVisible as any}
      selectedPlanets={selPlanets}
      secondarySelectedPlanets={fromAspects}
      onPlanetClick={togglePlanet}
      onPlanetRightClick={toggleVisible}
      onPlanetHover={(id: string | null) => setHoverPlanet(id)}
      hoveredPlanet={hoverPlanet}
      hoveredHouse={null}
      planetDisplayStatus={{}}
      activeMenu={activeMenu}
      setActiveMenu={setActiveMenu}
      onClearSelections={clear}
      houseFormat={houseFormat}
      onHouseFormatChange={setHouseFormat}
      zodiacColorMode="element"
      settings={celSettings}
      onSettingsChange={setCelSettings}
      planetSize={12}
      zodiacSignSize={16}
      panelScale={1.15}
      panelPosition="left"
      theme="dark"
      hideHeader={true}
      isFreeTier={true}
    />
  );
  const aspectos = (
    <AstroInfoPanel
      aspects={(data.aspects || []).filter((a: any) => (aspSettings.aspects.types as any)[a.type] !== false)}
      retrogradeStatus={data.retrogradeStatus}
      onAspectHover={setHoverAspect}
      onAspectClick={toggleAspect}
      onAspectRightClick={NOOP}
      selectedAspects={selAspects}
      onClearAllSelections={clear}
      isAnythingSelected={selAspects.length > 0 || selPlanets.length > 0}
      activeMenu={activeMenu}
      setActiveMenu={setActiveMenu}
      scale={1.15}
      showAspectLines={true}
      setShowAspectLines={NOOP as any}
      showNatalLines={false}
      setShowNatalLines={NOOP as any}
      hasNatalDate={false}
      houseFormat={houseFormat}
      zodiacColorMode="element"
      showPlanetSpheres={true}
      settings={aspSettings}
      onSettingsChange={setAspSettings}
      currentTime={time}
      location={SP}
      panelScale={1.15}
      panelPosition="right"
      theme="dark"
      hideHeader={true}
      isFreeTier={true}
    />
  );

  return (
    <div className={`lp-bench ${narrow ? 'is-narrow' : ''}`}>
      {!narrow && (
        <div className="lp-bench-panel">
          <div className="lp-bench-title">Astros</div>
          <div className="lp-bench-scroll">{astros}</div>
        </div>
      )}

      <div className="lp-bench-clock">
        <div ref={clockBox} style={{ width: '100%', aspectRatio: '1 / 1' }}>
          <div style={{ width: size, height: size }}>
            <SiderealClock
              celestialData={data}
              natalData={undefined}
              filteredAspects={lines}
              ghostPlanets={ghosts}
              visiblePlanets={visible}
              selectedPlanets={selPlanets}
              selectedAspects={selAspects}
              selectedHouses={[]}
              hoveredPlanet={hoverPlanet}
              hoveredAspect={hoverAspect}
              hoveredHouse={null}
              onPlanetClick={togglePlanet}
              onAspectClick={toggleAspect}
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
              showDegreeLabels={true}
              showPlanetSpheres={true}
              houseFormat={houseFormat}
              houseLineFormat="solid"
              zodiacColorMode="element"
              highlightFilter={null}
              pointerStyle="minimal"
              pointerThickness={3}
              pointerHead={false}
              pointerTail={false}
              theme="dark"
              locationName={SP.displayName}
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
        {(selPlanets.length > 0 || selAspects.length > 0) && (
          <button type="button" className="lp-bench-clear" onClick={clear}>
            <i className="ti ti-x" aria-hidden="true" />Limpar destaque
          </button>
        )}
      </div>

      {!narrow ? (
        <div className="lp-bench-panel">
          <div className="lp-bench-title">Aspectos</div>
          <div className="lp-bench-scroll">{aspectos}</div>
        </div>
      ) : (
        /* celular e tablet: um painel por vez, abaixo do relógio */
        <div className="lp-bench-mobile">
          <div className="lp-bench-tabs" role="tablist" aria-label="Painéis">
            <button type="button" role="tab" aria-selected={tab === 'astros'} className={tab === 'astros' ? 'is-on' : ''} onClick={() => setTab('astros')}>Astros</button>
            <button type="button" role="tab" aria-selected={tab === 'aspectos'} className={tab === 'aspectos' ? 'is-on' : ''} onClick={() => setTab('aspectos')}>Aspectos</button>
          </div>
          <div className="lp-bench-panel">
            <div className="lp-bench-scroll">{tab === 'astros' ? astros : aspectos}</div>
          </div>
        </div>
      )}
    </div>
  );
};

const DemoBench: React.FC = () => (
  <LanguageProvider>
    <Bench />
  </LanguageProvider>
);

export default DemoBench;
