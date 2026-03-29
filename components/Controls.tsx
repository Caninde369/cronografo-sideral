import React from 'react';
import { UI_ICONS } from './icons';

export const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void; label: string; disabled?: boolean; }> = ({ checked, onChange, label, disabled }) => (
    <label className={`flex items-center justify-between w-full p-2 text-sm rounded transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-brand-surface-highlight cursor-pointer'}`}>
        <span className={`transition-colors ${disabled ? 'text-brand-text-muted' : 'text-brand-text'}`}>{label}</span>
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} disabled={disabled} />
            <div className={`block w-10 h-6 rounded-full transition-colors ${checked && !disabled ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500' : 'bg-brand-surface-highlight'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-brand-text w-4 h-4 rounded-full transition-transform duration-300 ease-in-out ${checked ? 'transform translate-x-4' : ''}`}></div>
        </div>
    </label>
);

export const SizeControl: React.FC<{ label: string; value: number; onChange: (newValue: number) => void; }> = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between p-2 text-xs text-brand-text">
        <span>{label}</span>
        <div className="flex items-center gap-2">
            <button onClick={() => onChange(value - 1)} className="px-2 py-0.5 rounded bg-brand-surface-highlight hover:bg-brand-surface-highlight/80">-</button>
            <span className="w-8 text-center font-source-code-pro">{value}px</span>
            <button onClick={() => onChange(value + 1)} className="px-2 py-0.5 rounded bg-brand-surface-highlight hover:bg-brand-surface-highlight/80">+</button>
        </div>
    </div>
);

export const PopupToggle: React.FC<{ label: string, isChecked: boolean, onToggle: () => void }> = ({ label, isChecked, onToggle }) => (
    <label className="flex items-center justify-between w-full p-2 text-xs rounded transition-colors hover:bg-brand-surface-highlight cursor-pointer">
        <span className="text-brand-text">{label}</span>
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={isChecked} onChange={onToggle} />
            <div className={`block w-8 h-4 rounded-full transition-colors ${isChecked ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500' : 'bg-brand-surface-highlight'}`}></div>
            <div className={`dot absolute left-0 top-0 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out ${isChecked ? 'transform translate-x-4' : ''}`}></div>
        </div>
    </label>
);

export const CompactToggle: React.FC<{ isChecked: boolean, onToggle: () => void }> = ({ isChecked, onToggle }) => (
    <div className="relative cursor-pointer" onClick={onToggle}>
        <input type="checkbox" className="sr-only" checked={isChecked} readOnly />
        <div className={`block w-8 h-4 rounded-full transition-colors ${isChecked ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500' : 'bg-brand-surface-highlight'}`}></div>
        <div className={`dot absolute left-0 top-0 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out ${isChecked ? 'transform translate-x-4' : ''}`}></div>
    </div>
);

export const SegmentedControl: React.FC<{
    options: { label: string; value: string }[];
    value: string;
    onChange: (val: string) => void;
}> = ({ options, value, onChange }) => (
    <div className="flex bg-brand-surface-highlight/50 rounded-lg p-1 select-none w-full border border-brand-border/5">
        {options.map((opt) => (
            <button
                key={opt.value}
                onClick={() => onChange(opt.value)}
                className={`flex-1 px-2 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${
                    value === opt.value
                        ? 'bg-brand-surface text-brand-purple shadow-sm border border-brand-border/10'
                        : 'text-brand-text-muted hover:text-brand-text'
                }`}
            >
                {opt.label}
            </button>
        ))}
    </div>
);

export const TimeControls: React.FC<{
    isMinimized: boolean;
    timeStep: 'min' | 'hour' | 'day' | 'month' | 'year';
    onTimeStepChange: (step: 'min' | 'hour' | 'day' | 'month' | 'year') => void;
    onStepStart: (direction: number) => void;
    onStepEnd: () => void;
    onTogglePlay: () => void;
    isRealTime: boolean;
    speedMultiplier: number;
    onSpeedMultiplierChange: (speed: 1 | 2 | 5) => void;
    onToggleTheme: () => void;
    isDarkMode: boolean;
    onToggleFullscreen: () => void;
    isFullscreen: boolean;
    onToggleOptions: (e: React.MouseEvent) => void;
}> = ({
    isMinimized,
    timeStep,
    onTimeStepChange,
    onStepStart,
    onStepEnd,
    onTogglePlay,
    isRealTime,
    speedMultiplier,
    onSpeedMultiplierChange,
    onToggleTheme,
    isDarkMode,
    onToggleFullscreen,
    isFullscreen,
    onToggleOptions
}) => {
    const steps: Array<'min' | 'hour' | 'day' | 'month' | 'year'> = ['min', 'hour', 'day', 'month', 'year'];
    const stepLabels: Record<string, string> = { min: 'MIN', hour: 'HR', day: 'DIA', month: 'MÊS', year: 'ANO' };
    const speeds: Array<1 | 2 | 5> = [1, 2, 5];

    const nextStep = () => {
        const idx = steps.indexOf(timeStep);
        onTimeStepChange(steps[(idx + 1) % steps.length]);
    };

    const nextSpeed = () => {
        const idx = speeds.indexOf(speedMultiplier as 1 | 2 | 5);
        onSpeedMultiplierChange(speeds[(idx + 1) % speeds.length]);
    };

    // Modo minimizado — mantém comportamento original
    if (isMinimized) {
        return (
            <div className="flex items-center gap-1 bg-brand-surface/80 backdrop-blur-xl border border-brand-border/10 rounded-xl p-1 shadow-2xl ring-1 ring-white/5">
                <button
                    onClick={nextStep}
                    className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all font-technical bg-brand-purple text-white shadow-sm hover:bg-brand-purple/80 min-w-[40px] text-center flex-shrink-0"
                    title="Mudar passo de tempo"
                >
                    {stepLabels[timeStep]}
                </button>
                <button
                    onPointerDown={() => onStepStart(-1)}
                    onPointerUp={onStepEnd}
                    onPointerLeave={onStepEnd}
                    className="p-2 hover:bg-brand-surface-highlight rounded-lg shadow-sm transition-all text-brand-text-muted active:scale-95 flex-shrink-0"
                >
                    <UI_ICONS.StepBackIcon className="w-4 h-4" />
                </button>
                <button
                    onClick={onTogglePlay}
                    style={{
                        width: '34px', height: '34px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isRealTime ? 'rgba(124,58,237,0.2)' : isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
                        border: `1px solid ${isRealTime ? 'rgba(124,58,237,0.45)' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: '10px', cursor: 'pointer',
                        color: isRealTime ? '#a78bfa' : '#c0c0c0',
                        transition: 'all 0.2s ease',
                        flexShrink: 0,
                    }}
                >
                    {isRealTime
                        ? <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor"><rect x="0" y="0" width="3.5" height="12"/><rect x="6.5" y="0" width="3.5" height="12"/></svg>
                        : <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor"><path d="M0 0l10 6-10 6z"/></svg>
                    }
                </button>
                <button
                    onPointerDown={() => onStepStart(1)}
                    onPointerUp={onStepEnd}
                    onPointerLeave={onStepEnd}
                    className="p-2 hover:bg-brand-surface-highlight rounded-lg shadow-sm transition-all text-brand-text-muted active:scale-95 flex-shrink-0"
                >
                    <UI_ICONS.StepForwardIcon className="w-4 h-4" />
                </button>
                <button
                    onClick={nextSpeed}
                    className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all font-technical bg-brand-surface-highlight text-brand-text-muted hover:text-brand-text hover:bg-brand-surface-highlight/80 min-w-[40px] text-center flex-shrink-0"
                >
                    {speedMultiplier}X
                </button>
            </div>
        );
    }

    // Modo expandido — redesign instrumento de precisão
    return (
        <div
            className="inline-flex items-center"
            style={{
                background: isDarkMode ? 'rgba(10,10,15,0.75)' : 'rgba(244,241,234,0.85)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: '14px',
                padding: '0 4px',
                height: '48px',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)',
            }}
        >
            {/* GRUPO 1 — Granularidade */}
            <div className="flex items-center" style={{ padding: '0 8px', gap: '2px' }}>
                {steps.map((step, idx) => {
                    const isActive = timeStep === step;
                    return (
                        <button
                            key={step}
                            onClick={() => onTimeStepChange(step)}
                            style={{
                                fontFamily: 'Michroma, sans-serif',
                                fontSize: '9px',
                                letterSpacing: '0.12em',
                                color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                                background: isActive ? 'rgba(124,58,237,0.15)' : 'transparent',
                                border: 'none',
                                borderBottom: isActive ? '2px solid #7c3aed' : '2px solid transparent',
                                borderRadius: '6px 6px 0 0',
                                padding: '0 10px',
                                height: '36px',
                                cursor: 'pointer',
                                transition: 'all 0.18s ease',
                                marginBottom: '-2px',
                            }}
                            onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = '#a0a0a0'; }}
                            onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = '#6a6a6a'; }}
                        >
                            {stepLabels[step]}
                        </button>
                    );
                })}
            </div>

            {/* DIVISOR */}
            <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.08)', margin: '0 4px', flexShrink: 0 }} />

            {/* GRUPO 2 — Navegação + Play/Pause */}
            <div className="flex items-center" style={{ gap: '4px', padding: '0 8px' }}>
                {/* Retroceder */}
                <button
                    onPointerDown={() => onStepStart(-1)}
                    onPointerUp={onStepEnd}
                    onPointerLeave={onStepEnd}
                    style={{
                        width: '28px', height: '28px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'transparent', border: 'none', borderRadius: '8px',
                        color: 'var(--color-text-tertiary)', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)'}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-tertiary)'}
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                        <path d="M8 2L3.5 6 8 10V2z M3 2h1.5v8H3V2z"/>
                    </svg>
                </button>

                {/* Play/Pause — destaque central */}
                <button
                    onClick={onTogglePlay}
                    style={{
                        width: '34px', height: '34px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isRealTime ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.06)',
                        border: `1px solid ${isRealTime ? 'rgba(124,58,237,0.45)' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: '10px', cursor: 'pointer',
                        color: isRealTime ? '#a78bfa' : '#c0c0c0',
                        transition: 'all 0.2s ease',
                        flexShrink: 0,
                    }}
                >
                    {isRealTime
                        ? <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor"><rect x="0" y="0" width="3.5" height="12"/><rect x="6.5" y="0" width="3.5" height="12"/></svg>
                        : <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor"><path d="M0 0l10 6-10 6z"/></svg>
                    }
                </button>

                {/* Avançar */}
                <button
                    onPointerDown={() => onStepStart(1)}
                    onPointerUp={onStepEnd}
                    onPointerLeave={onStepEnd}
                    style={{
                        width: '28px', height: '28px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'transparent', border: 'none', borderRadius: '8px',
                        color: 'var(--color-text-tertiary)', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)'}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-tertiary)'}
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                        <path d="M4 2l4.5 4L4 10V2z M8.5 2H10v8H8.5V2z"/>
                    </svg>
                </button>
            </div>

            {/* DIVISOR */}
            <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.08)', margin: '0 4px', flexShrink: 0 }} />

            {/* GRUPO 3 — Velocidade */}
            <div className="flex items-center" style={{ padding: '0 6px', gap: '2px' }}>
                {speeds.map(s => {
                    const isActive = speedMultiplier === s;
                    return (
                        <button
                            key={s}
                            onClick={() => onSpeedMultiplierChange(s)}
                            style={{
                                fontFamily: 'Manrope, sans-serif',
                                fontSize: '11px',
                                fontWeight: isActive ? 600 : 400,
                                letterSpacing: '0.04em',
                                color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                                background: isActive ? 'rgba(124,58,237,0.15)' : 'transparent',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '0 10px',
                                height: '32px',
                                cursor: 'pointer',
                                transition: 'all 0.18s ease',
                            }}
                            onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)'; }}
                            onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-tertiary)'; }}
                        >
                            {s}×
                        </button>
                    );
                })}
            </div>

            {/* DIVISOR */}
            <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.08)', margin: '0 4px', flexShrink: 0 }} />

            {/* GRUPO 4 — Ações */}
            <div className="flex items-center" style={{ padding: '0 6px', gap: '4px' }}>
                {/* Tema */}
                <button
                    onClick={onToggleTheme}
                    style={{
                        width: '32px', height: '32px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'transparent', border: 'none', borderRadius: '8px',
                        color: 'var(--color-text-tertiary)', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)'}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-tertiary)'}
                    title={isDarkMode ? "Modo Claro" : "Modo Escuro"}
                >
                    {isDarkMode ? <UI_ICONS.SunIcon className="w-4 h-4" /> : <UI_ICONS.MoonIcon className="w-4 h-4" />}
                </button>

                {/* Opções */}
                <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => onToggleOptions(e as React.MouseEvent)}
                    style={{
                        width: '32px', height: '32px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'transparent', border: 'none', borderRadius: '8px',
                        color: 'var(--color-text-tertiary)', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)'}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-tertiary)'}
                    title="Opções de Visualização"
                >
                    <UI_ICONS.SettingsIcon className="w-4 h-4" />
                </button>

                {/* Fullscreen */}
                <button
                    onClick={onToggleFullscreen}
                    style={{
                        width: '32px', height: '32px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'transparent', border: 'none', borderRadius: '8px',
                        color: 'var(--color-text-tertiary)', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)'}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-tertiary)'}
                    title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
                >
                    {isFullscreen ? <UI_ICONS.ExitFullscreenIcon className="w-4 h-4" /> : <UI_ICONS.FullscreenIcon className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
};

export const YearNavigation: React.FC<{
    year: number;
    onPrev: () => void;
    onNext: () => void;
    onYearClick: (year: number) => void;
}> = ({ year, onPrev, onNext, onYearClick }) => {
    const handleWheel = (e: React.WheelEvent) => {
        if (e.deltaY > 0) {
            onPrev();
        } else if (e.deltaY < 0) {
            onNext();
        }
    };

    return (
        <div
            className="flex items-center gap-4 bg-brand-surface-highlight/20 p-1.5 rounded-xl border border-white/5 shadow-inner"
            onWheel={handleWheel}
        >
            <button
                onClick={onPrev}
                className="p-2 rounded-lg hover:bg-white/10 text-brand-text-muted hover:text-brand-text transition-all active:scale-90"
                title="Ano Anterior"
            >
                <UI_ICONS.StepBackIcon className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-4 px-2 overflow-hidden">
                {[year - 3, year - 2, year - 1].map(y => (
                    <span
                        key={y}
                        className="text-[10px] font-bold text-brand-text-muted/20 cursor-pointer hover:text-brand-text-muted/50 transition-colors uppercase tracking-widest"
                        onClick={() => onYearClick(y)}
                    >
                        {y}
                    </span>
                ))}

                <h2 className="text-xl font-black text-brand-text min-w-[60px] text-center tracking-tighter">
                    {year}
                </h2>

                {[year + 1, year + 2, year + 3].map(y => (
                    <span
                        key={y}
                        className="text-[10px] font-bold text-brand-text-muted/20 cursor-pointer hover:text-brand-text-muted/50 transition-colors uppercase tracking-widest"
                        onClick={() => onYearClick(y)}
                    >
                        {y}
                    </span>
                ))}
            </div>

            <button
                onClick={onNext}
                className="p-2 rounded-lg hover:bg-white/10 text-brand-text-muted hover:text-brand-text transition-all active:scale-90"
                title="Próximo Ano"
            >
                <UI_ICONS.StepForwardIcon className="w-4 h-4" />
            </button>
        </div>
    );
};