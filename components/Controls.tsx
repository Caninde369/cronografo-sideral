
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
}> = ({ 
    isMinimized, 
    timeStep, 
    onTimeStepChange, 
    onStepStart, 
    onStepEnd, 
    onTogglePlay, 
    isRealTime, 
    speedMultiplier, 
    onSpeedMultiplierChange 
}) => (
    <div className={`flex items-stretch bg-brand-surface/80 backdrop-blur-xl border border-brand-border/10 rounded-xl p-1 gap-2 shadow-2xl ring-1 ring-white/5 transition-all duration-300 ${isMinimized ? 'w-auto' : 'w-[560px] max-w-[90vw]'}`}>
        {/* Left Side: Time Step Toggles + Step Back */}
        <div className="flex-1 flex items-center justify-end gap-1">
            {!isMinimized ? (
                <div className="flex items-center gap-0.5 mr-1 bg-brand-surface-highlight/30 p-0.5 rounded-lg border border-brand-border/5 animate-in fade-in slide-in-from-right-2 duration-200">
                    {[
                        { id: 'min', label: 'Min' },
                        { id: 'hour', label: 'Hora' },
                        { id: 'day', label: 'Dia' },
                        { id: 'month', label: 'Mês' },
                        { id: 'year', label: 'Ano' }
                    ].map(step => (
                        <button
                            key={step.id}
                            onClick={() => onTimeStepChange(step.id as any)}
                            className={`px-2 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${timeStep === step.id ? 'bg-brand-purple text-white shadow-sm' : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-surface-highlight/50'}`}
                            title={`Passo de tempo: ${step.label}`}
                        >
                            {step.label}
                        </button>
                    ))}
                </div>
            ) : (
                <button
                    onClick={() => {
                        const steps: ('min' | 'hour' | 'day' | 'month' | 'year')[] = ['min', 'hour', 'day', 'month', 'year'];
                        const currentIndex = steps.indexOf(timeStep);
                        const nextIndex = (currentIndex + 1) % steps.length;
                        onTimeStepChange(steps[nextIndex]);
                    }}
                    className="px-2 py-1.5 mr-1 rounded-md text-[9px] font-bold uppercase tracking-wider bg-brand-purple text-white shadow-sm animate-in fade-in zoom-in duration-200"
                    title="Passo de tempo (clique para alterar)"
                >
                    {{'min': 'Min', 'hour': 'Hora', 'day': 'Dia', 'month': 'Mês', 'year': 'Ano'}[timeStep]}
                </button>
            )}
            
            <button 
                onPointerDown={() => onStepStart(-1)}
                onPointerUp={onStepEnd}
                onPointerLeave={onStepEnd}
                className="p-2 hover:bg-brand-surface-highlight rounded-lg shadow-sm transition-all text-brand-text-muted active:scale-95" 
                title="Retroceder"
            >
                <UI_ICONS.StepBackIcon className="w-4 h-4" />
            </button>
        </div>

        {/* Center: Play/Pause */}
        <div className="flex-shrink-0 flex items-center justify-center">
            <button 
                onClick={onTogglePlay} 
                className={`p-2 rounded-lg shadow-sm transition-all ${isRealTime ? 'bg-red-500/20 text-red-400 shadow-[0_0_15px_rgba(248,113,113,0.3)] ring-1 ring-red-500/30' : 'hover:bg-brand-surface-highlight text-brand-text'}`}
                title={isRealTime ? "Pausar" : "Ao Vivo"}
            >
                {isRealTime ? <UI_ICONS.PauseIcon className="w-4 h-4" /> : <UI_ICONS.PlayIcon className="w-4 h-4" />}
            </button>
        </div>

        {/* Right Side: Step Forward + Speed Multiplier Toggles */}
        <div className="flex-1 flex items-center justify-start gap-1">
            <button 
                onPointerDown={() => onStepStart(1)}
                onPointerUp={onStepEnd}
                onPointerLeave={onStepEnd}
                className="p-2 hover:bg-brand-surface-highlight rounded-lg shadow-sm transition-all text-brand-text-muted active:scale-95" 
                title="Avançar"
            >
                <UI_ICONS.StepForwardIcon className="w-4 h-4" />
            </button>
            
            {!isMinimized ? (
                <div className="flex items-center gap-0.5 ml-1 bg-brand-surface-highlight/30 p-0.5 rounded-lg border border-brand-border/5 animate-in fade-in slide-in-from-left-2 duration-200">
                    {[
                        { value: 1, label: '1x' },
                        { value: 2, label: '2x' },
                        { value: 5, label: '5x' }
                    ].map(speed => (
                        <button
                            key={speed.value}
                            onClick={() => onSpeedMultiplierChange(speed.value as any)}
                            className={`px-2 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${speedMultiplier === speed.value ? 'bg-brand-purple text-white shadow-sm' : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-surface-highlight/50'}`}
                            title={`Velocidade: ${speed.label}`}
                        >
                            {speed.label}
                        </button>
                    ))}
                </div>
            ) : (
                <button
                    onClick={() => {
                        const speeds: (1 | 2 | 5)[] = [1, 2, 5];
                        const currentIndex = speeds.indexOf(speedMultiplier as any);
                        const nextIndex = (currentIndex + 1) % speeds.length;
                        onSpeedMultiplierChange(speeds[nextIndex]);
                    }}
                    className="px-2 py-1.5 ml-1 rounded-md text-[9px] font-bold uppercase tracking-wider bg-brand-purple text-white shadow-sm animate-in fade-in zoom-in duration-200"
                    title="Velocidade (clique para alterar)"
                >
                    {speedMultiplier}x
                </button>
            )}
        </div>
    </div>
);

export const YearNavigation: React.FC<{
    year: number;
    onPrev: () => void;
    onNext: () => void;
    onYearClick: (year: number) => void;
}> = ({ year, onPrev, onNext, onYearClick }) => {
    const handleWheel = (e: React.WheelEvent) => {
        if (e.deltaY > 0) {
            onNext();
        } else if (e.deltaY < 0) {
            onPrev();
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
