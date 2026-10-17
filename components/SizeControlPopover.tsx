import React, { useState } from 'react';

export interface SizeControlProps {
  theme?: 'dark' | 'light';
  isOpen?: boolean;
  onClose?: () => void;

  // Escala Global e Cronógrafo
  uiScale: number;
  setUiScale: (v: number) => void;
  clockScale: number;
  setClockScale: (v: number) => void;

  // Painéis
  leftPanelScale: number;
  setLeftPanelScale: (v: number) => void;
  rightPanelScale: number;
  setRightPanelScale: (v: number) => void;
  leftPanelWidth?: number;
  setLeftPanelWidth?: (v: number) => void;
  rightPanelWidth?: number;
  setRightPanelWidth?: (v: number) => void;

  // Cronógrafo e Anéis (Migrados das Opções Avançadas)
  clockPlanetSize?: number;
  setClockPlanetSize?: (v: number) => void;
  degreeLabelSize?: number;
  setDegreeLabelSize?: (v: number) => void;
  graduationRingWidth?: number;
  setGraduationRingWidth?: (v: number) => void;
  zodiacRingScale?: number;
  setZodiacRingScale?: (v: number) => void;
  zodiacSignSize?: number;
  setZodiacSignSize?: (v: number) => void;

  // Anéis Específicos
  showSeasonsRing?: boolean;
  setShowSeasonsRing?: (v: boolean | ((prev: boolean) => boolean)) => void;
  seasonsRingScale?: number;
  setSeasonsRingScale?: (v: number) => void;

  showDecanRing?: boolean;
  setShowDecanRing?: (v: boolean | ((prev: boolean) => boolean)) => void;
  decanRingScale?: number;
  setDecanRingScale?: (v: number) => void;
  decanGlyphSize?: number;
  setDecanGlyphSize?: (v: number) => void;

  showTermsRing?: boolean;
  setShowTermsRing?: (v: boolean | ((prev: boolean) => boolean)) => void;
  termsRingScale?: number;
  setTermsRingScale?: (v: number) => void;
  termsGlyphSize?: number;
  setTermsGlyphSize?: (v: number) => void;

  showTimeRing?: boolean;
  setShowTimeRing?: (v: boolean | ((prev: boolean) => boolean)) => void;
  timeRingScale?: number;
  setTimeRingScale?: (v: number) => void;

  ringLineColor?: string;
  setRingLineColor?: (v: string) => void;

  // Modo de exibição inline (dentro de outros menus como OptionsRail) vs popover flutuante
  isInline?: boolean;
}

// Subcomponente de Linha com Scrubber + Stepper + Valor
interface UXControlRowProps {
  label: string;
  icon?: string;
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step: number;
  format?: (val: number) => string;
  defaultValue?: number;
  isLight?: boolean;
  subtitle?: string;
}

const UXControlRow: React.FC<UXControlRowProps> = ({
  label,
  icon,
  value,
  onChange,
  min,
  max,
  step,
  format = (v) => `${v}`,
  defaultValue,
  isLight,
  subtitle
}) => {
  const isChanged = defaultValue !== undefined && Math.abs(value - defaultValue) > (step / 2);

  const handleStep = (delta: number) => {
    const next = Math.min(max, Math.max(min, Number((value + delta).toFixed(2))));
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-1.5 py-1.5 px-2 rounded-xl transition-colors hover:bg-white/[0.04]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {icon && (
            <i className={`${icon} text-xs ${isLight ? 'text-amber-700' : 'text-amber-400'} shrink-0`} />
          )}
          <span className={`text-[11px] font-semibold truncate ${isLight ? 'text-neutral-800' : 'text-white/90'}`}>
            {label}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isChanged && (
            <button
              onClick={() => defaultValue !== undefined && onChange(defaultValue)}
              title="Restaurar padrão"
              className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                isLight ? 'bg-black/10 hover:bg-black/20 text-neutral-700' : 'bg-white/10 hover:bg-white/20 text-white/80'
              }`}
            >
              Reset
            </button>
          )}
          <span className={`text-[11px] font-bold font-mono px-1.5 py-0.5 rounded ${
            isLight ? 'bg-black/5 text-amber-900' : 'bg-white/10 text-amber-300'
          }`}>
            {format(value)}
          </span>
        </div>
      </div>

      {subtitle && (
        <span className={`text-[9px] -mt-1 leading-tight ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
          {subtitle}
        </span>
      )}

      {/* Scrubber Slider + Steppers */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleStep(-step)}
          disabled={value <= min}
          className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs transition-all cursor-pointer select-none active:scale-90 disabled:opacity-30 disabled:pointer-events-none ${
            isLight
              ? 'bg-neutral-200/80 hover:bg-neutral-300 text-neutral-800 border border-black/10'
              : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
          }`}
          title="Diminuir"
        >
          -
        </button>

        <div className="flex-1 relative flex items-center">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer outline-none transition-all ${
              isLight
                ? 'bg-black/15 accent-amber-600'
                : 'bg-white/20 accent-amber-400'
            }`}
          />
        </div>

        <button
          onClick={() => handleStep(step)}
          disabled={value >= max}
          className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs transition-all cursor-pointer select-none active:scale-90 disabled:opacity-30 disabled:pointer-events-none ${
            isLight
              ? 'bg-neutral-200/80 hover:bg-neutral-300 text-neutral-800 border border-black/10'
              : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
          }`}
          title="Aumentar"
        >
          +
        </button>
      </div>
    </div>
  );
};

// Subcomponente para Toggles de Anéis
const UXToggleRow: React.FC<{
  label: string;
  icon?: string;
  checked: boolean;
  onToggle: () => void;
  isLight?: boolean;
}> = ({ label, icon, checked, onToggle, isLight }) => (
  <div className="flex items-center justify-between py-1 px-2 rounded-xl hover:bg-white/[0.04] transition-colors">
    <div className="flex items-center gap-1.5">
      {icon && <i className={`${icon} text-xs ${isLight ? 'text-amber-700' : 'text-amber-400'}`} />}
      <span className={`text-[11px] font-semibold ${isLight ? 'text-neutral-800' : 'text-white/90'}`}>
        {label}
      </span>
    </div>
    <button
      type="button"
      onClick={onToggle}
      className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer focus:outline-none p-0.5 ${
        checked
          ? (isLight ? 'bg-amber-600' : 'bg-amber-500')
          : (isLight ? 'bg-neutral-300' : 'bg-white/20')
      }`}
    >
      <div
        className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);

export const SizeControlContent: React.FC<SizeControlProps> = (props) => {
  const isLight = props.theme === 'light';
  const [activeTab, setActiveTab] = useState<'presets' | 'clock' | 'panels'>('presets');

  // Aplicar Presets Rápidos
  const applyPreset = (preset: 'notebook' | 'default' | 'presentation' | 'projection') => {
    switch (preset) {
      case 'notebook':
        props.setUiScale(0.85);
        props.setClockScale(1.05);
        props.setLeftPanelScale(0.95);
        props.setRightPanelScale(0.95);
        if (props.setLeftPanelWidth) props.setLeftPanelWidth(265);
        if (props.setRightPanelWidth) props.setRightPanelWidth(245);
        if (props.setClockPlanetSize) props.setClockPlanetSize(38);
        if (props.setDegreeLabelSize) props.setDegreeLabelSize(15);
        break;
      case 'default':
        props.setUiScale(1.00);
        props.setClockScale(1.00);
        props.setLeftPanelScale(1.00);
        props.setRightPanelScale(1.00);
        if (props.setLeftPanelWidth) props.setLeftPanelWidth(265);
        if (props.setRightPanelWidth) props.setRightPanelWidth(245);
        if (props.setClockPlanetSize) props.setClockPlanetSize(46);
        if (props.setZodiacSignSize) props.setZodiacSignSize(46);
        if (props.setTermsGlyphSize) props.setTermsGlyphSize(22);
        if (props.setDecanGlyphSize) props.setDecanGlyphSize(22);
        if (props.setDegreeLabelSize) props.setDegreeLabelSize(16);
        break;
      case 'presentation':
        props.setUiScale(1.10);
        props.setClockScale(1.05);
        props.setLeftPanelScale(1.00);
        props.setRightPanelScale(1.00);
        if (props.setLeftPanelWidth) props.setLeftPanelWidth(250);
        if (props.setRightPanelWidth) props.setRightPanelWidth(265);
        if (props.setClockPlanetSize) props.setClockPlanetSize(46);
        if (props.setDegreeLabelSize) props.setDegreeLabelSize(18);
        if (props.setZodiacSignSize) props.setZodiacSignSize(28);
        break;
      case 'projection':
        props.setUiScale(1.25);
        props.setClockScale(1.10);
        props.setLeftPanelScale(1.00);
        props.setRightPanelScale(1.00);
        if (props.setLeftPanelWidth) props.setLeftPanelWidth(270);
        if (props.setRightPanelWidth) props.setRightPanelWidth(285);
        if (props.setClockPlanetSize) props.setClockPlanetSize(50);
        if (props.setDegreeLabelSize) props.setDegreeLabelSize(20);
        if (props.setZodiacSignSize) props.setZodiacSignSize(32);
        break;
    }
  };

  const handleResetAll = () => {
    props.setUiScale(1.00);
    props.setClockScale(1.15);
    props.setLeftPanelScale(1.00);
    props.setRightPanelScale(1.00);
    if (props.setLeftPanelWidth) props.setLeftPanelWidth(230);
    if (props.setRightPanelWidth) props.setRightPanelWidth(245);
    if (props.setClockPlanetSize) props.setClockPlanetSize(42);
    if (props.setDegreeLabelSize) props.setDegreeLabelSize(16);
    if (props.setGraduationRingWidth) props.setGraduationRingWidth(54);
    if (props.setZodiacRingScale) props.setZodiacRingScale(1.20);
    if (props.setZodiacSignSize) props.setZodiacSignSize(24);
    if (props.setSeasonsRingScale) props.setSeasonsRingScale(0.75);
    if (props.setDecanRingScale) props.setDecanRingScale(2.0);
    if (props.setDecanGlyphSize) props.setDecanGlyphSize(18);
    if (props.setTermsRingScale) props.setTermsRingScale(2.0);
    if (props.setTermsGlyphSize) props.setTermsGlyphSize(18);
    if (props.setTimeRingScale) props.setTimeRingScale(1.2);
    if (props.setRingLineColor) props.setRingLineColor('');
  };

  return (
    <div className="flex flex-col gap-3 font-sans select-none">
      {/* Barra de Presets Rápidos com 1 Clique */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-black/60' : 'text-white/60'}`}>
            Modos de Visualização
          </span>
          <button
            onClick={handleResetAll}
            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded transition-colors cursor-pointer ${
              isLight ? 'bg-black/10 hover:bg-black/20 text-black/80' : 'bg-white/10 hover:bg-white/20 text-white/90'
            }`}
            title="Redefinir todas as escalas para o padrão"
          >
            Redefinir Tudo
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {/* Preset Notebook (80%) */}
          <button
            onClick={() => applyPreset('notebook')}
            className={`flex items-center gap-2 p-2 rounded-xl text-left border transition-all cursor-pointer ${
              Math.abs(props.uiScale - 0.80) < 0.03
                ? (isLight ? 'bg-amber-500/15 border-amber-600 text-amber-950 font-bold shadow-sm' : 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-sm')
                : (isLight ? 'bg-neutral-100 border-black/10 hover:bg-neutral-200/70 text-neutral-800' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/90')
            }`}
          >
            <i className="ti ti-device-laptop text-base text-amber-400 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold truncate">Notebook (80%)</span>
              <span className="text-[9px] opacity-70 leading-tight">Otimizado & Compacto</span>
            </div>
          </button>

          {/* Preset Desktop (100%) */}
          <button
            onClick={() => applyPreset('default')}
            className={`flex items-center gap-2 p-2 rounded-xl text-left border transition-all cursor-pointer ${
              Math.abs(props.uiScale - 1.00) < 0.03
                ? (isLight ? 'bg-amber-500/15 border-amber-600 text-amber-950 font-bold shadow-sm' : 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-sm')
                : (isLight ? 'bg-neutral-100 border-black/10 hover:bg-neutral-200/70 text-neutral-800' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/90')
            }`}
          >
            <i className="ti ti-device-desktop text-base text-cyan-400 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold truncate">Padrão (100%)</span>
              <span className="text-[9px] opacity-70 leading-tight">Desktop Equilibrado</span>
            </div>
          </button>

          {/* Preset Apresentação / Vídeo (110%) */}
          <button
            onClick={() => applyPreset('presentation')}
            className={`flex items-center gap-2 p-2 rounded-xl text-left border transition-all cursor-pointer ${
              Math.abs(props.uiScale - 1.10) < 0.03
                ? (isLight ? 'bg-amber-500/15 border-amber-600 text-amber-950 font-bold shadow-sm' : 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-sm')
                : (isLight ? 'bg-neutral-100 border-black/10 hover:bg-neutral-200/70 text-neutral-800' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/90')
            }`}
          >
            <i className="ti ti-video text-base text-emerald-400 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold truncate">Apresentação</span>
              <span className="text-[9px] opacity-70 leading-tight">Vídeos e Streams</span>
            </div>
          </button>

          {/* Preset Telão / Projeção (125%) */}
          <button
            onClick={() => applyPreset('projection')}
            className={`flex items-center gap-2 p-2 rounded-xl text-left border transition-all cursor-pointer ${
              Math.abs(props.uiScale - 1.25) < 0.03
                ? (isLight ? 'bg-amber-500/15 border-amber-600 text-amber-950 font-bold shadow-sm' : 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-sm')
                : (isLight ? 'bg-neutral-100 border-black/10 hover:bg-neutral-200/70 text-neutral-800' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/90')
            }`}
          >
            <i className="ti ti-presentation text-base text-purple-400 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold truncate">Projeção Telão</span>
              <span className="text-[9px] opacity-70 leading-tight">Plateias & Auditórios</span>
            </div>
          </button>
        </div>
      </div>

      {/* Navegação de Abas Internas */}
      <div className={`flex rounded-xl p-1 gap-1 border ${isLight ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'}`}>
        <button
          onClick={() => setActiveTab('presets')}
          className={`flex-1 py-1.5 px-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap ${
            activeTab === 'presets'
              ? (isLight ? 'bg-white shadow text-black' : 'bg-white/20 shadow text-white')
              : (isLight ? 'text-neutral-600 hover:text-black' : 'text-white/60 hover:text-white')
          }`}
        >
          <i className="ti ti-zoom-in-area text-xs shrink-0" />
          <span>Geral</span>
        </button>
        <button
          onClick={() => setActiveTab('clock')}
          className={`flex-1 py-1.5 px-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap ${
            activeTab === 'clock'
              ? (isLight ? 'bg-white shadow text-black' : 'bg-white/20 shadow text-white')
              : (isLight ? 'text-neutral-600 hover:text-black' : 'text-white/60 hover:text-white')
          }`}
        >
          <i className="ti ti-clock text-xs shrink-0" />
          <span>Cronógrafo</span>
        </button>
        <button
          onClick={() => setActiveTab('panels')}
          className={`flex-1 py-1.5 px-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap ${
            activeTab === 'panels'
              ? (isLight ? 'bg-white shadow text-black' : 'bg-white/20 shadow text-white')
              : (isLight ? 'text-neutral-600 hover:text-black' : 'text-white/60 hover:text-white')
          }`}
        >
          <i className="ti ti-layout-sidebar text-xs shrink-0" />
          <span>Painéis</span>
        </button>
      </div>

      {/* Conteúdo da Aba 1: Escala Geral & Zoom */}
      {activeTab === 'presets' && (
        <div className="flex flex-col gap-2">
          {/* Zoom / Escala Geral da UI */}
          <UXControlRow
            label="Zoom da Interface (Geral)"
            icon="ti ti-zoom"
            value={props.uiScale}
            onChange={props.setUiScale}
            min={0.70}
            max={1.35}
            step={0.05}
            format={(v) => `${Math.round(v * 100)}%`}
            defaultValue={1.00}
            isLight={isLight}
            subtitle="Redimensiona toda a aplicação proporcionalmente (idêntico ao zoom do navegador)"
          />

          {/* Atalhos Rápidos de Zoom */}
          <div className="flex items-center gap-1.5 px-2">
            {[0.75, 0.80, 0.90, 1.00, 1.10, 1.25].map((z) => (
              <button
                key={z}
                onClick={() => props.setUiScale(z)}
                className={`flex-1 py-1 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer border ${
                  Math.abs(props.uiScale - z) < 0.02
                    ? (isLight ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-amber-400 text-black border-amber-400 shadow-sm')
                    : (isLight ? 'bg-black/5 text-neutral-700 border-black/10 hover:bg-black/10' : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10')
                }`}
              >
                {Math.round(z * 100)}%
              </button>
            ))}
          </div>

          <div className={`h-px my-1 ${isLight ? 'bg-black/10' : 'bg-white/10'}`} />

          {/* Escala do Cronógrafo */}
          <UXControlRow
            label="Escala do Cronógrafo Central"
            icon="ti ti-circle-dot"
            value={props.clockScale}
            onChange={props.setClockScale}
            min={0.75}
            max={1.60}
            step={0.05}
            format={(v) => `${v.toFixed(2)}x`}
            defaultValue={1.15}
            isLight={isLight}
            subtitle="Ajusta o diâmetro do cronógrafo astronômico no centro da tela"
          />
        </div>
      )}

      {/* Conteúdo da Aba 2: Cronógrafo & Anéis (Migrado das Opções Avançadas) */}
      {activeTab === 'clock' && (
        <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
          {/* Tamanho dos Planetas no Cronógrafo */}
          {props.clockPlanetSize !== undefined && props.setClockPlanetSize && (
            <UXControlRow
              label="Tamanho dos Planetas (Esferas)"
              icon="ti ti-planet"
              value={props.clockPlanetSize}
              onChange={props.setClockPlanetSize}
              min={20}
              max={56}
              step={2}
              format={(v) => `${v}px`}
              defaultValue={46}
              isLight={isLight}
            />
          )}

          {/* Rótulos de Graus dos Planetas */}
          {props.degreeLabelSize !== undefined && props.setDegreeLabelSize && (
            <UXControlRow
              label="Tamanho dos Rótulos de Graus"
              icon="ti ti-letter-case"
              value={props.degreeLabelSize}
              onChange={props.setDegreeLabelSize}
              min={10}
              max={28}
              step={1}
              format={(v) => `${v}px`}
              defaultValue={16}
              isLight={isLight}
            />
          )}

          {/* Espessura da Borda / Graduação */}
          {props.graduationRingWidth !== undefined && props.setGraduationRingWidth && (
            <UXControlRow
              label="Espessura da Graduação (Borda)"
              icon="ti ti-border-radius"
              value={props.graduationRingWidth}
              onChange={props.setGraduationRingWidth}
              min={10}
              max={120}
              step={2}
              format={(v) => `${v}px`}
              defaultValue={18}
              isLight={isLight}
            />
          )}

          {/* Anel do Zodíaco */}
          {props.zodiacRingScale !== undefined && props.setZodiacRingScale && (
            <UXControlRow
              label="Tamanho do Anel Zodíaco"
              icon="ti ti-circle-dashed"
              value={props.zodiacRingScale}
              onChange={props.setZodiacRingScale}
              min={0.5}
              max={1.6}
              step={0.05}
              format={(v) => `${v.toFixed(2)}x`}
              defaultValue={1.00}
              isLight={isLight}
            />
          )}

          {/* Tamanho dos Signos */}
          {props.zodiacSignSize !== undefined && props.setZodiacSignSize && (
            <UXControlRow
              label="Tamanho dos Signos do Zodíaco"
              icon="ti ti-zodiac-leo"
              value={props.zodiacSignSize}
              onChange={props.setZodiacSignSize}
              min={16}
              max={70}
              step={2}
              format={(v) => `${v}px`}
              defaultValue={46}
              isLight={isLight}
            />
          )}

          <div className={`h-px my-1 ${isLight ? 'bg-black/10' : 'bg-white/10'}`} />
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 ${isLight ? 'text-black/60' : 'text-white/60'}`}>
            Anéis Complementares
          </span>

          {/* Anel de Estações */}
          {props.setShowSeasonsRing && (
            <UXToggleRow
              label="Anel de Estações"
              icon="ti ti-sun"
              checked={!!props.showSeasonsRing}
              onToggle={() => props.setShowSeasonsRing?.(!props.showSeasonsRing)}
              isLight={isLight}
            />
          )}
          {props.showSeasonsRing && props.seasonsRingScale !== undefined && props.setSeasonsRingScale && (
            <UXControlRow
              label="Escala do Anel de Estações"
              value={props.seasonsRingScale}
              onChange={props.setSeasonsRingScale}
              min={0.4}
              max={1.6}
              step={0.05}
              format={(v) => `${v.toFixed(2)}x`}
              defaultValue={0.75}
              isLight={isLight}
            />
          )}

          {/* Decanatos */}
          {props.setShowDecanRing && (
            <UXToggleRow
              label="Anel de Decanatos"
              icon="ti ti-chart-pie"
              checked={!!props.showDecanRing}
              onToggle={() => props.setShowDecanRing?.(!props.showDecanRing)}
              isLight={isLight}
            />
          )}
          {props.showDecanRing && props.decanRingScale !== undefined && props.setDecanRingScale && (
            <UXControlRow
              label="Escala do Anel de Decanatos"
              value={props.decanRingScale}
              onChange={props.setDecanRingScale}
              min={0.5}
              max={2.5}
              step={0.05}
              format={(v) => `${v.toFixed(2)}x`}
              defaultValue={2.0}
              isLight={isLight}
            />
          )}
          {props.showDecanRing && props.decanGlyphSize !== undefined && props.setDecanGlyphSize && (
            <UXControlRow
              label="Tamanho dos Glifos dos Decanatos"
              value={props.decanGlyphSize}
              onChange={props.setDecanGlyphSize}
              min={10}
              max={50}
              step={1}
              format={(v) => `${v}px`}
              defaultValue={22}
              isLight={isLight}
            />
          )}

          {/* Termos */}
          {props.setShowTermsRing && (
            <UXToggleRow
              label="Anel de Termos"
              icon="ti ti-layout-grid"
              checked={!!props.showTermsRing}
              onToggle={() => props.setShowTermsRing?.(!props.showTermsRing)}
              isLight={isLight}
            />
          )}
          {props.showTermsRing && props.termsRingScale !== undefined && props.setTermsRingScale && (
            <UXControlRow
              label="Escala do Anel de Termos"
              value={props.termsRingScale}
              onChange={props.setTermsRingScale}
              min={0.5}
              max={2.5}
              step={0.05}
              format={(v) => `${v.toFixed(2)}x`}
              defaultValue={2.0}
              isLight={isLight}
            />
          )}
          {props.showTermsRing && props.termsGlyphSize !== undefined && props.setTermsGlyphSize && (
            <UXControlRow
              label="Tamanho dos Glifos dos Termos"
              value={props.termsGlyphSize}
              onChange={props.setTermsGlyphSize}
              min={10}
              max={50}
              step={1}
              format={(v) => `${v}px`}
              defaultValue={22}
              isLight={isLight}
            />
          )}

          {/* Relógio 24 Horas */}
          {props.setShowTimeRing && (
            <UXToggleRow
              label="Anel 24 Horas"
              icon="ti ti-clock-hour-4"
              checked={!!props.showTimeRing}
              onToggle={() => props.setShowTimeRing?.(!props.showTimeRing)}
              isLight={isLight}
            />
          )}
          {props.showTimeRing && props.timeRingScale !== undefined && props.setTimeRingScale && (
            <UXControlRow
              label="Escala do Relógio 24 Horas"
              value={props.timeRingScale}
              onChange={props.setTimeRingScale}
              min={0.5}
              max={2.5}
              step={0.1}
              format={(v) => `${v.toFixed(1)}x`}
              defaultValue={1.2}
              isLight={isLight}
            />
          )}

          {/* Cor das Linhas dos Anéis */}
          {props.setRingLineColor && (
            <div className="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-white/[0.04]">
              <span className={`text-[11px] font-semibold ${isLight ? 'text-neutral-800' : 'text-white/90'}`}>
                Cor das Linhas dos Anéis
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={props.ringLineColor || (isLight ? '#4b5563' : '#9ca3af')}
                  onChange={(e) => props.setRingLineColor?.(e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                />
                {props.ringLineColor && (
                  <button
                    onClick={() => props.setRingLineColor?.('')}
                    className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      isLight ? 'bg-black/10 text-neutral-800' : 'bg-white/10 text-white'
                    }`}
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conteúdo da Aba 3: Painéis Laterais */}
      {activeTab === 'panels' && (
        <div className="flex flex-col gap-2">
          {/* Largura do Painel Esquerdo */}
          {props.leftPanelWidth !== undefined && props.setLeftPanelWidth && (
            <UXControlRow
              label="Largura Painel Esquerdo (Astros / Status)"
              icon="ti ti-layout-sidebar"
              value={props.leftPanelWidth}
              onChange={props.setLeftPanelWidth}
              min={190}
              max={360}
              step={5}
              format={(v) => `${v}px`}
              defaultValue={230}
              isLight={isLight}
            />
          )}

          {/* Largura do Painel Direito */}
          {props.rightPanelWidth !== undefined && props.setRightPanelWidth && (
            <UXControlRow
              label="Largura Painel Direito (Aspectos / Casas)"
              icon="ti ti-layout-sidebar-right"
              value={props.rightPanelWidth}
              onChange={props.setRightPanelWidth}
              min={200}
              max={380}
              step={5}
              format={(v) => `${v}px`}
              defaultValue={245}
              isLight={isLight}
            />
          )}

          <div className={`h-px my-1 ${isLight ? 'bg-black/10' : 'bg-white/10'}`} />

          {/* Escala Interna dos Painéis Esquerdos */}
          <UXControlRow
            label="Escala de Conteúdo (Painel Esquerdo)"
            icon="ti ti-typography"
            value={props.leftPanelScale}
            onChange={props.setLeftPanelScale}
            min={0.65}
            max={1.50}
            step={0.05}
            format={(v) => `${Math.round(v * 100)}%`}
            defaultValue={1.00}
            isLight={isLight}
          />

          {/* Escala Interna dos Painéis Direitos */}
          <UXControlRow
            label="Escala de Conteúdo (Painel Direito)"
            icon="ti ti-typography"
            value={props.rightPanelScale}
            onChange={props.setRightPanelScale}
            min={0.65}
            max={1.50}
            step={0.05}
            format={(v) => `${Math.round(v * 100)}%`}
            defaultValue={1.00}
            isLight={isLight}
          />
        </div>
      )}
    </div>
  );
};

export const SizeControlPopover: React.FC<SizeControlProps> = (props) => {
  const isLight = props.theme === 'light';

  if (!props.isOpen) return null;

  return (
    <div
      data-no-drag="true"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className={`absolute top-full right-0 mt-2 w-[340px] sm:w-[380px] p-4 rounded-2xl shadow-2xl z-[100] font-sans animate-in fade-in zoom-in-95 duration-150 liquid-glass border ${
        isLight ? 'text-neutral-900 border-black/15' : 'text-white border-white/15'
      }`}
    >
      {/* Cabeçalho */}
      <div className="px-1 py-1 border-b border-white/10 mb-3 flex justify-between items-center">
        <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-400">
          <i className="ti ti-viewport-wide text-sm" />
          Tamanho e Escala de Exibição
        </span>
        <button
          type="button"
          onClick={props.onClose}
          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
            isLight ? 'hover:bg-black/10 text-neutral-600 hover:text-black' : 'hover:bg-white/10 text-white/60 hover:text-white'
          }`}
          title="Fechar"
        >
          <i className="ti ti-x text-xs" />
        </button>
      </div>

      <SizeControlContent {...props} />
    </div>
  );
};
