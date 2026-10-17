import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
    FileText, 
    Compass, 
    Sun, 
    Moon, 
    LayoutTemplate, 
    Maximize2, 
    Check, 
    X, 
    Download, 
    Eye, 
    Copy, 
    Sparkles, 
    Table,
    FileSpreadsheet
} from 'lucide-react';
import { useLanguage } from '../i18n';
import { CelestialData } from '../hooks/useCelestialData';
import { Aspect } from '../lib/astrology/aspects';
import { ZODIAC_DATA } from './zodiac';
import { normalizeAngle } from '../lib/astrology/utils';

export interface ExportOptions {
    orientation: 'vertical' | 'horizontal';
    themeMode: 'light' | 'dark';
    contentMode: 'with_data' | 'clock_only';
}

interface ExportOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirmExport: (options: ExportOptions) => Promise<void>;
    isExporting: boolean;
    exportProgress: string;
    onCopyChatAI?: () => void;
    copied?: boolean;
    // Data props for preview and rendering
    currentTime?: Date;
    location?: { displayName: string; latitude?: number; longitude?: number };
    celestialData?: CelestialData;
    seasonInfo?: { name: string; icon?: any; color?: string; day: number };
    sunriseTime?: string;
    sunsetTime?: string;
    moonriseTime?: string;
    moonsetTime?: string;
    moonPhase?: { name: string; icon?: any };
    moonPhaseValue?: number;
    retrogradeStatus?: Record<string, boolean>;
    housePlacements?: Record<string, number>;
    houseCusps?: number[];
    filteredAspects?: Aspect[];
    clockScreenshot?: string;
    currentTheme?: 'dark' | 'light';
    isFreeTier?: boolean;
    onOpenPaymentPlans?: () => void;
}

const PLANET_SYMBOLS: Record<string, string> = {
    sun: '☉', moon: '☽', mercury: '☿', venus: '♀', mars: '♂',
    jupiter: '♃', saturn: '♄', uranus: '⛢', neptune: '♆', pluto: '♇',
    northNode: '☊', southNode: '☋', lilith: '⚸', partOfFortune: '⊗',
    chiron: '⚷', ceres: '⚳', pallas: '⚴', juno: '⚵', vesta: '⚶',
    ascendant: 'ASC', midheaven: 'MC', descendant: 'DC', imumCoeli: 'IC'
};

const PLANET_NAMES_PT: Record<string, string> = {
    sun: 'Sol', moon: 'Lua', mercury: 'Mercúrio', venus: 'Vênus', mars: 'Marte',
    jupiter: 'Júpiter', saturn: 'Saturno', uranus: 'Urano', neptune: 'Netuno', pluto: 'Plutão',
    northNode: 'Nodo Norte', southNode: 'Nodo Sul', lilith: 'Lilith', partOfFortune: 'Parte da Fortuna',
    chiron: 'Quíron', ceres: 'Ceres', pallas: 'Palas Atena', juno: 'Juno', vesta: 'Vesta',
    ascendant: 'Ascendente', midheaven: 'Meio do Céu', descendant: 'Descendente', imumCoeli: 'Fundo do Céu'
};

const ASPECT_SYMBOLS: Record<string, string> = {
    conjunction: '☌', opposition: '☍', trine: '△', square: '□', sextile: '⚹'
};

const ASPECT_COLORS: Record<string, string> = {
    conjunction: '#9333ea', opposition: '#dc2626', trine: '#16a34a', square: '#ea580c', sextile: '#2563eb'
};

const formatDeg = (lon: number) => {
    const norm = normalizeAngle(lon);
    const d = Math.floor(norm % 30);
    const m = Math.floor((norm % 1) * 60);
    return `${d.toString().padStart(2, '0')}°${m.toString().padStart(2, '0')}'`;
};

export const ExportOptionsModal: React.FC<ExportOptionsModalProps> = (props) => {
    const { t } = useLanguage();
    const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>('vertical');
    const [themeMode, setThemeMode] = useState<'light' | 'dark'>(props.currentTheme || 'light');
    const [contentMode, setContentMode] = useState<'with_data' | 'clock_only'>('with_data');
    const [freeExportsCount, setFreeExportsCount] = useState<number>(0);

    // Sync themeMode with currentTheme when modal opens and update free exports count
    useEffect(() => {
        if (props.isOpen) {
            try {
                const count = parseInt(localStorage.getItem('cronografo_free_exports_count') || '0', 10);
                setFreeExportsCount(count);
            } catch {
                setFreeExportsCount(0);
            }
            if (props.currentTheme) {
                setThemeMode(props.currentTheme);
            }
        }
    }, [props.isOpen, props.currentTheme]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !props.isExporting) {
                props.onClose();
            }
        };
        if (props.isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [props.isOpen, props.isExporting, props.onClose]);

    // Prevent body scrolling while modal is open
    useEffect(() => {
        if (props.isOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [props.isOpen]);

    if (!props.isOpen) return null;

    const handleConfirm = () => {
        props.onConfirmExport({
            orientation,
            themeMode,
            contentMode
        });
    };

    const illumination = Math.round((1 - Math.cos(2 * Math.PI * (props.moonPhaseValue ?? 0))) / 2 * 100);
    const dateStr = props.currentTime ? props.currentTime.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
    const timeStr = props.currentTime ? props.currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';

    // Estatísticas básicas para o preview
    const PLANETS_STATS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
    const stats = { fire: 0, earth: 0, air: 0, water: 0, cardinal: 0, fixed: 0, mutable: 0 };
    if (props.celestialData) {
        PLANETS_STATS.forEach(id => {
            const lon = props.celestialData?.[`${id}EclipticLongitude` as keyof CelestialData] as number;
            if (typeof lon === 'number' && !isNaN(lon)) {
                const sign = ZODIAC_DATA[Math.floor(lon / 30)];
                if (sign) {
                    stats[sign.element as keyof typeof stats]++;
                    stats[sign.modality as keyof typeof stats]++;
                }
            }
        });
    }

    const modalContent = (
        <div 
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto animate-fadeIn select-none"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !props.isExporting) {
                    props.onClose();
                }
            }}
        >
            <div 
                className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-[#0e0c18] border border-white/15 text-white shadow-2xl shadow-black/80 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Cabeçalho do Modal */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                            <Download className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                                <span>Configurar Exportação PDF</span>
                                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                    A4 Alta Resolução
                                </span>
                            </h2>
                            <p className="text-xs text-neutral-400">
                                Personalize orientação, tema de cores e diagramação de dados com visualização prévia em tempo real.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={props.onClose}
                        disabled={props.isExporting}
                        className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
                        title="Fechar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Banner de Cota do Plano Gratuito */}
                {props.isFreeTier && (
                    <div className="px-6 pt-3 pb-0">
                        {freeExportsCount < 1 ? (
                            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                                    <span>
                                        <strong>Plano Gratuito:</strong> Você tem <strong>1 exportação de teste</strong> disponível (inclui marca d'água oficial).
                                    </span>
                                </div>
                                {props.onOpenPaymentPlans && (
                                    <button
                                        type="button"
                                        onClick={props.onOpenPaymentPlans}
                                        className="text-[11px] font-bold text-[#F5D98A] hover:underline shrink-0"
                                    >
                                        Ver Planos Ilimitados →
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-2 h-2 rounded-full bg-red-400 shrink-0 animate-ping" />
                                    <div>
                                        <div className="font-bold text-white text-xs">Limite Gratuito Atingido (1 de 1 utilizado)</div>
                                        <div className="text-[11px] text-white/70">
                                            Você já utilizou sua exportação gratuita de teste. Para exportar relatórios ilimitados em alta resolução e sem marca d'água, faça upgrade.
                                        </div>
                                    </div>
                                </div>
                                {props.onOpenPaymentPlans && (
                                    <button
                                        type="button"
                                        onClick={props.onOpenPaymentPlans}
                                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#F5D98A] text-black font-bold text-xs shrink-0 cursor-pointer shadow-sm hover:opacity-95"
                                    >
                                        Ver Planos
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Conteúdo Principal (Grade com Controles à esquerda e Preview à direita) */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Coluna Esquerda: Opções de Configuração */}
                    <div className="lg:col-span-6 flex flex-col gap-5">
                        {/* 1. Orientação */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Orientação do Documento</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setOrientation('vertical')}
                                    disabled={props.isExporting}
                                    className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                        orientation === 'vertical'
                                            ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400'
                                            : 'bg-white/[0.03] border-white/10 text-neutral-300 hover:bg-white/[0.06] hover:border-white/20'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-5 border-2 border-current rounded-sm flex items-center justify-center">
                                                <div className="w-1.5 h-0.5 bg-current rounded-xs" />
                                            </div>
                                            <span className="text-xs font-bold">Vertical</span>
                                        </div>
                                        {orientation === 'vertical' && <Check className="w-4 h-4 text-cyan-400" />}
                                    </div>
                                    <span className="text-[11px] text-neutral-400 leading-tight">
                                        Retrato (210 × 297 mm). Ideal para impressão e tabelas detalhadas.
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setOrientation('horizontal')}
                                    disabled={props.isExporting}
                                    className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                        orientation === 'horizontal'
                                            ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400'
                                            : 'bg-white/[0.03] border-white/10 text-neutral-300 hover:bg-white/[0.06] hover:border-white/20'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-4 border-2 border-current rounded-sm flex items-center justify-center">
                                                <div className="w-1.5 h-0.5 bg-current rounded-xs" />
                                            </div>
                                            <span className="text-xs font-bold">Horizontal</span>
                                        </div>
                                        {orientation === 'horizontal' && <Check className="w-4 h-4 text-cyan-400" />}
                                    </div>
                                    <span className="text-[11px] text-neutral-400 leading-tight">
                                        Paisagem (297 × 210 mm). Formato panorâmico vigente na tela.
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* 2. Cor / Tema */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                                <Sun className="w-3.5 h-3.5 text-amber-400" />
                                <span>Cor do Fundo & Tema</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setThemeMode('light')}
                                    disabled={props.isExporting}
                                    className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                        themeMode === 'light'
                                            ? 'bg-amber-500/15 border-amber-400 text-white shadow-lg shadow-amber-950/40 ring-1 ring-amber-400'
                                            : 'bg-white/[0.03] border-white/10 text-neutral-300 hover:bg-white/[0.06] hover:border-white/20'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2">
                                            <Sun className="w-4 h-4 text-amber-300" />
                                            <span className="text-xs font-bold">Modo Claro</span>
                                        </div>
                                        {themeMode === 'light' && <Check className="w-4 h-4 text-amber-400" />}
                                    </div>
                                    <span className="text-[11px] text-neutral-400 leading-tight">
                                        Fundo branco com alto contraste, perfeito para economia de tinta e impressão limpa.
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setThemeMode('dark')}
                                    disabled={props.isExporting}
                                    className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                        themeMode === 'dark'
                                            ? 'bg-indigo-500/15 border-indigo-400 text-white shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-400'
                                            : 'bg-white/[0.03] border-white/10 text-neutral-300 hover:bg-white/[0.06] hover:border-white/20'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2">
                                            <Moon className="w-4 h-4 text-indigo-300" />
                                            <span className="text-xs font-bold">Modo Escuro</span>
                                        </div>
                                        {themeMode === 'dark' && <Check className="w-4 h-4 text-indigo-400" />}
                                    </div>
                                    <span className="text-[11px] text-neutral-400 leading-tight">
                                        Fundo noturno cósmico com brilhos e gradientes do cronógrafo original.
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* 3. Dados / Conteúdo */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                                <LayoutTemplate className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Conteúdo do Documento</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setContentMode('with_data')}
                                    disabled={props.isExporting}
                                    className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                        contentMode === 'with_data'
                                            ? 'bg-emerald-500/15 border-emerald-400 text-white shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400'
                                            : 'bg-white/[0.03] border-white/10 text-neutral-300 hover:bg-white/[0.06] hover:border-white/20'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2">
                                            <Table className="w-4 h-4 text-emerald-400" />
                                            <span className="text-xs font-bold">Com Painéis de Dados</span>
                                        </div>
                                        {contentMode === 'with_data' && <Check className="w-4 h-4 text-emerald-400" />}
                                    </div>
                                    <span className="text-[11px] text-neutral-400 leading-tight">
                                        Relatório astrológico completo com tabelas técnicas, posições, cúspides e orbes.
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setContentMode('clock_only')}
                                    disabled={props.isExporting}
                                    className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                        contentMode === 'clock_only'
                                            ? 'bg-emerald-500/15 border-emerald-400 text-white shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400'
                                            : 'bg-white/[0.03] border-white/10 text-neutral-300 hover:bg-white/[0.06] hover:border-white/20'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2">
                                            <Maximize2 className="w-4 h-4 text-emerald-400" />
                                            <span className="text-xs font-bold">Somente Cronógrafo</span>
                                        </div>
                                        {contentMode === 'clock_only' && <Check className="w-4 h-4 text-emerald-400" />}
                                    </div>
                                    <span className="text-[11px] text-neutral-400 leading-tight">
                                        Mostrador maximizado ocupando grande parte da folha, sem margens ou painéis.
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Exportar documento em texto */}
                        <div className="pt-3 flex flex-col gap-2 border-t border-white/10">
                            <div className="flex items-center justify-between gap-2">
                                <button
                                    type="button"
                                    onClick={props.onCopyChatAI}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-md ${
                                        props.copied
                                            ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                                            : 'bg-blue-600 hover:bg-blue-500 border-blue-400/60 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] active:scale-95'
                                    }`}
                                >
                                    <Copy className="w-4 h-4" />
                                    <span>{props.copied ? '✓ Salvo na Área de Transferência!' : 'Exportar documento em texto'}</span>
                                </button>
                                {props.copied && (
                                    <span className="text-[11px] text-emerald-400 font-semibold animate-pulse">
                                        Copiado!
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-neutral-400 leading-relaxed">
                                Ao clicar, o relatório astronômico completo com todos os dados técnicos, posições, cúspides e orbes é copiado instantaneamente para a sua área de transferência, pronto para colar onde desejar.
                            </p>
                        </div>
                    </div>

                    {/* Coluna Direita: Live Interactive Preview */}
                    <div className="lg:col-span-6 flex flex-col items-center justify-center p-4 rounded-2xl bg-black/40 border border-white/10 relative overflow-hidden min-h-[380px]">
                        <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4 text-cyan-400" />
                                <span className="text-xs font-bold text-neutral-200">Pré-visualização da Folha</span>
                            </div>
                            <span className="text-[10px] font-mono text-neutral-400 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                                {orientation === 'vertical' ? 'A4 Retrato · 210 × 297 mm' : 'A4 Paisagem · 297 × 210 mm'}
                            </span>
                        </div>

                        {/* Folha A4 Simulada */}
                        <div className="flex-1 w-full flex items-center justify-center p-2">
                            <div 
                                className={`transition-all duration-300 rounded-lg shadow-2xl relative flex flex-col overflow-hidden border ${
                                    themeMode === 'light'
                                        ? 'bg-[#ffffff] text-[#0f172a] border-neutral-300 shadow-white/5'
                                        : 'bg-[#06060a] text-[#f8fafc] border-white/20 shadow-black'
                                }`}
                                style={{
                                    width: orientation === 'vertical' ? '250px' : '340px',
                                    height: orientation === 'vertical' ? '354px' : '240px',
                                    padding: '12px'
                                }}
                            >
                                {/* Marca d'água / etiqueta do modo no topo da simulação */}
                                <div className="flex items-center justify-between text-[7px] pb-1 border-b border-current/10 mb-1 opacity-60">
                                    <span className="font-bold uppercase tracking-wider">CRONÓGRAFO SIDERAL</span>
                                    <span>{dateStr}</span>
                                </div>

                                {/* CASO 1 & 2: Somente Cronógrafo (Vertical ou Horizontal) */}
                                {contentMode === 'clock_only' && (
                                    <div className="flex-1 flex flex-col items-center justify-center relative">
                                        <div 
                                            className={`rounded-full border-2 flex items-center justify-center relative transition-all ${
                                                themeMode === 'light'
                                                    ? 'border-neutral-800 bg-neutral-100'
                                                    : 'border-cyan-400/80 bg-cyan-950/20 shadow-lg shadow-cyan-500/20'
                                            }`}
                                            style={{
                                                width: orientation === 'vertical' ? '195px' : '185px',
                                                height: orientation === 'vertical' ? '195px' : '185px',
                                            }}
                                        >
                                            {/* Círculos concêntricos e glifos do mostrador */}
                                            <div className="absolute inset-1.5 rounded-full border border-current/20 flex items-center justify-center">
                                                <div className="absolute inset-2.5 rounded-full border border-dashed border-current/30 flex items-center justify-center">
                                                    <div className="absolute inset-4 rounded-full border border-current/20 flex items-center justify-center">
                                                        {/* Linhas de aspecto decorativas */}
                                                        <div className="absolute w-full h-[1px] bg-red-400/50 rotate-45" />
                                                        <div className="absolute w-full h-[1px] bg-blue-400/50 -rotate-30" />
                                                        <div className="absolute w-full h-[1px] bg-emerald-400/50 rotate-90" />
                                                        <div className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[8px] font-bold">
                                                            ☉
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Indicador de Tamanho Máximo */}
                                            <div className="absolute bottom-1 px-1.5 py-0.5 rounded text-[6px] font-bold bg-current/10 uppercase tracking-widest">
                                                Escala Máxima (96%)
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* CASO 3: Horizontal com Dados (Formatação Vigente na Tela) */}
                                {contentMode === 'with_data' && orientation === 'horizontal' && (
                                    <div className="flex-1 flex flex-col gap-1 text-[6.5px]">
                                        {/* Sub-cabeçalho */}
                                         <div className="flex justify-between items-center text-[6px] opacity-70">
                                             <span>{props.location?.displayName ? props.location.displayName.split(',')[0] : 'Localização'}</span>
                                             <span>Dia {props.seasonInfo?.day ?? 1} · {props.moonPhase?.name || 'Fase Lunar'}</span>
                                         </div>

                                         {/* Grid de 3 colunas simulando a tela widescreen */}
                                         <div className="flex-1 grid grid-cols-12 gap-1.5 items-center">
                                             {/* Painel Esquerdo */}
                                             <div className="col-span-3 h-full flex flex-col justify-between p-1 rounded bg-current/5 border border-current/10">
                                                 <span className="font-bold text-[6px] border-b border-current/10 pb-0.5">Efemérides</span>
                                                 <div className="space-y-0.5 text-[5.5px]">
                                                     <div>Sol: {props.sunriseTime || '--'} / {props.sunsetTime || '--'}</div>
                                                     <div>Lua: {props.moonriseTime || '--'} / {props.moonsetTime || '--'}</div>
                                                     <div>Fogo: {stats.fire} · Terra: {stats.earth}</div>
                                                     <div>Ar: {stats.air} · Água: {stats.water}</div>
                                                 </div>
                                                 <div className="text-[5px] opacity-60">ASC / MC / DSC / IC</div>
                                             </div>

                                             {/* Cronógrafo Central */}
                                             <div className="col-span-6 h-full flex items-center justify-center">
                                                 <div className={`w-28 h-28 rounded-full border-2 border-current/40 flex items-center justify-center relative ${
                                                     themeMode === 'light' ? 'bg-neutral-100' : 'bg-cyan-950/20'
                                                 }`}>
                                                     <div className="w-20 h-20 rounded-full border border-dashed border-current/30 flex items-center justify-center">
                                                         <div className="w-3 h-3 rounded-full bg-amber-400/80 flex items-center justify-center text-[5px] text-black font-bold">
                                                             ☉
                                                         </div>
                                                     </div>
                                                 </div>
                                             </div>

                                             {/* Painel Direito */}
                                             <div className="col-span-3 h-full flex flex-col justify-between p-1 rounded bg-current/5 border border-current/10">
                                                 <span className="font-bold text-[6px] border-b border-current/10 pb-0.5">Astros & Aspectos</span>
                                                 <div className="space-y-0.5 text-[5.5px]">
                                                     <div>☉ Sol em Peixes</div>
                                                     <div>☽ Lua em Câncer</div>
                                                     <div>☿ Mercúrio Direto</div>
                                                     <div>♂ Marte em Áries</div>
                                                     <div>Aspectos ativos: {props.filteredAspects?.length ?? 0}</div>
                                                 </div>
                                                 <div className="text-[5px] opacity-60">Tabelas Vigentes</div>
                                             </div>
                                         </div>
                                     </div>
                                 )}

                                 {/* CASO 4: Vertical com Dados (Tabelas com Maior Relevância + Cronógrafo no Canto Superior) */}
                                 {contentMode === 'with_data' && orientation === 'vertical' && (
                                     <div className="flex-1 flex flex-col gap-1.5 text-[6.5px]">
                                         {/* Topo: Dados & Cronógrafo no Canto Superior Direito */}
                                         <div className="flex justify-between items-start gap-1 pb-1 border-b border-current/10">
                                             {/* Lado Esquerdo do Topo: Informações do Mapa */}
                                             <div className="flex-1 flex flex-col gap-0.5">
                                                 <span className="font-extrabold text-[8px] tracking-tight">RELATÓRIO SIDERAL</span>
                                                 <span className="text-[6px] opacity-75">{props.location?.displayName ? props.location.displayName.split(',')[0] : 'Local'} · {timeStr}</span>
                                                 <div className="flex flex-wrap gap-1 mt-0.5">
                                                     <span className="px-1 rounded bg-current/10 text-[5.5px] font-semibold">
                                                         {props.seasonInfo?.name || 'Estação'}
                                                     </span>
                                                     <span className="px-1 rounded bg-current/10 text-[5.5px] font-semibold">
                                                         {props.moonPhase?.name || 'Fase Lunar'} ({illumination}%)
                                                     </span>
                                                 </div>
                                                 <div className="text-[5.5px] mt-0.5 opacity-80">
                                                     ASC: {ZODIAC_DATA[Math.floor(((props.houseCusps?.[0]) || 0) / 30)]?.name || 'Áries'} · MC: {ZODIAC_DATA[Math.floor(((props.houseCusps?.[9]) || 0) / 30)]?.name || 'Capricórnio'}
                                                 </div>
                                             </div>

                                             {/* Canto Superior Direito: Cronógrafo Compacto */}
                                             <div className="flex flex-col items-center">
                                                 <div className={`w-14 h-14 rounded-full border-2 border-current/50 flex items-center justify-center relative ${
                                                     themeMode === 'light' ? 'bg-neutral-100' : 'bg-cyan-950/30'
                                                 }`}>
                                                     <div className="w-9 h-9 rounded-full border border-dashed border-current/30 flex items-center justify-center">
                                                         <div className="w-2 h-2 rounded-full bg-amber-400" />
                                                     </div>
                                                 </div>
                                                 <span className="text-[4.5px] mt-0.5 opacity-60">Mostrador Superior</span>
                                             </div>
                                         </div>

                                         {/* Corpo: Tabelas com Maior Relevância */}
                                         <div className="flex-1 flex flex-col gap-1 justify-between">
                                             {/* Tabela 1: Luminares e Planetas */}
                                             <div className="rounded border border-current/15 overflow-hidden">
                                                 <div className="bg-current/10 px-1 py-0.5 font-bold text-[6px] flex justify-between">
                                                     <span>PLANETAS & LUMINARES</span>
                                                     <span>GRAU · CASA</span>
                                                 </div>
                                                 <div className="p-1 space-y-0.5 text-[5.5px]">
                                                     <div className="flex justify-between border-b border-current/5 pb-0.5">
                                                         <span>☉ Sol em {ZODIAC_DATA[Math.floor(((props.celestialData?.sunEclipticLongitude) || 0) / 30)]?.name || 'Peixes'}</span>
                                                         <span className="font-mono">{formatDeg(props.celestialData?.sunEclipticLongitude || 0)} · Casa {props.housePlacements?.sun || 1}</span>
                                                     </div>
                                                     <div className="flex justify-between border-b border-current/5 pb-0.5">
                                                         <span>☽ Lua em {ZODIAC_DATA[Math.floor(((props.celestialData?.moonEclipticLongitude) || 0) / 30)]?.name || 'Câncer'}</span>
                                                         <span className="font-mono">{formatDeg(props.celestialData?.moonEclipticLongitude || 0)} · Casa {props.housePlacements?.moon || 1}</span>
                                                     </div>
                                                     <div className="flex justify-between border-b border-current/5 pb-0.5">
                                                         <span>☿ Mercúrio / ♀ Vênus / ♂ Marte</span>
                                                         <span className="font-mono">Velocidades & Decanatos</span>
                                                     </div>
                                                 </div>
                                             </div>

                                             {/* Grid Duplo de Tabelas: Cúspides e Aspectos */}
                                             <div className="grid grid-cols-2 gap-1 flex-1">
                                                 <div className="rounded border border-current/15 p-1 flex flex-col justify-between">
                                                     <span className="font-bold text-[6px] border-b border-current/10 pb-0.5">CÚSPIDES DAS CASAS</span>
                                                     <div className="space-y-0.5 text-[5px]">
                                                         <div>Casa I (ASC) a IV (IC)</div>
                                                         <div>Casa V a VIII (DC)</div>
                                                         <div>Casa IX a XII (MC)</div>
                                                         <div>Regentes e Termos</div>
                                                     </div>
                                                     <span className="text-[4.5px] opacity-60">12 Casas Mapeadas</span>
                                                 </div>

                                                 <div className="rounded border border-current/15 p-1 flex flex-col justify-between">
                                                     <span className="font-bold text-[6px] border-b border-current/10 pb-0.5">ASPECTOS ATIVOS</span>
                                                     <div className="space-y-0.5 text-[5px]">
                                                         <div>△ Trígonos {(props.filteredAspects || []).filter(a => a?.type === 'trine').length}</div>
                                                         <div>☌ Conjunções {(props.filteredAspects || []).filter(a => a?.type === 'conjunction').length}</div>
                                                         <div>☍ Oposições {(props.filteredAspects || []).filter(a => a?.type === 'opposition').length}</div>
                                                         <div>□ Quadraturas {(props.filteredAspects || []).filter(a => a?.type === 'square').length}</div>
                                                     </div>
                                                     <span className="text-[4.5px] opacity-60">Orbes Exatos</span>
                                                 </div>
                                             </div>
                                         </div>
                                     </div>
                                 )}

                                {/* Rodapé discreto da folha simulada */}
                                <div className="pt-0.5 border-t border-current/10 flex justify-between items-center text-[5.5px] opacity-50 relative z-10">
                                    <span>Cronógrafo Sideral</span>
                                    <span>Página 1 de 1</span>
                                </div>

                                {/* Marca d'água simulada para plano gratuito */}
                                {props.isFreeTier && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none rotate-[-28deg] z-20">
                                        <div className="text-[11px] font-black tracking-widest text-current opacity-15 select-none uppercase text-center border-y border-current/25 py-1 px-4">
                                            CRONÓGRAFO SIDERAL · DEMO
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Status / Resumo do Preview */}
                        <div className="mt-2 text-center text-[11px] text-neutral-400">
                            {contentMode === 'clock_only' ? (
                                <span>Exportação do <strong>Cronógrafo Puro</strong> em resolução vetorial máxima.</span>
                            ) : orientation === 'vertical' ? (
                                <span>Diagramação com <strong>maior relevância para tabelas</strong> e cronógrafo no topo.</span>
                            ) : (
                                <span>Exportação com <strong>diagramação widescreen vigente</strong> da tela.</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Barra de Ações Inferior e Barra de Progresso Espectral */}
                <div className="flex flex-col border-t border-white/10 bg-white/[0.02]">
                    {props.isExporting && (
                        <div className="w-full px-6 pt-3 pb-1 flex flex-col gap-1.5 bg-black/40">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-cyan-300 font-semibold flex items-center gap-2">
                                    <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                                    <span>{props.exportProgress || 'Gerando documento em alta resolução...'}</span>
                                </span>
                                <span className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider">
                                    Processando
                                </span>
                            </div>
                            {/* Linha com gradiente espectral */}
                            <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/10 relative">
                                <div 
                                    className="h-full w-full rounded-full animate-pulse"
                                    style={{
                                        background: 'linear-gradient(90deg, #6366F1 0%, #22D3EE 25%, #10B981 40%, #FDE047 60%, #FB923C 80%, #EF4444 100%)',
                                        boxShadow: '0 0 12px rgba(34, 211, 238, 0.8)'
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between px-6 py-4">
                        <button
                            type="button"
                            onClick={props.onClose}
                            disabled={props.isExporting}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            Cancelar
                        </button>

                        <div className="flex items-center gap-3">
                            {props.isFreeTier && freeExportsCount >= 1 ? (
                                <button
                                    type="button"
                                    onClick={props.onOpenPaymentPlans}
                                    className="bg-gradient-to-r from-[#D4AF37] to-[#F5D98A] text-black font-bold text-xs px-5 py-2.5 rounded-xl border border-[#D4AF37] shadow-[0_0_16px_rgba(212,175,55,0.4)] flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
                                >
                                    <Sparkles className="w-4 h-4 text-black" />
                                    <span>Desbloquear Exportações Ilimitadas (Ver Planos)</span>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleConfirm}
                                    disabled={props.isExporting}
                                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl border border-blue-400/50 shadow-[0_0_16px_rgba(37,99,235,0.6)] flex items-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>
                                        {props.isExporting 
                                            ? 'Processando PDF...' 
                                            : props.isFreeTier 
                                            ? 'Baixar 1ª Exportação Gratuita (com marca d\'água)' 
                                            : 'Confirmar & Baixar PDF'}
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (typeof document !== 'undefined') {
        return createPortal(modalContent, document.body);
    }
    return modalContent;
};
