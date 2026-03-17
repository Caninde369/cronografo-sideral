
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CelestialData } from '../hooks/useCelestialData';
import { calculateTransitDetailsForDay, DetailedAspectInfo, TransitDayDetails } from '../lib/astrology/transitScoring';
import { UI_ICONS, CELESTIAL_GLYPHS } from './icons';
import { SizeControl } from './Controls';

interface TransitChartProps {
    currentTime: Date;
    natalCelestialData: CelestialData | null;
    dragHandle?: React.ReactNode;
    onClose?: () => void;
}

type ChartDataPoint = TransitDayDetails & {
    date: Date;
};

type TooltipData = {
    x: number;
    y: number;
    content: ChartDataPoint;
};

const ChartTooltip: React.FC<{ data: ChartDataPoint }> = ({ data }) => {
    const topAspects = data.contributingAspects.slice(0, 3);
    const aspectTypeClasses: Record<string, string> = {
        conjunction: 'text-violet-300', opposition: 'text-red-300',
        trine: 'text-teal-300', square: 'text-orange-300', sextile: 'text-cyan-300',
    };
    return (
        <div className="flex flex-col gap-2" style={{ fontSize: '18px' }}>
            <div className="flex justify-between items-baseline">
                <span className="font-bold text-brand-text">{data.date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}</span>
                <span className={`font-bold ${data.score > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {data.score.toFixed(0)}
                </span>
            </div>
            <ul className="space-y-1.5">
                {topAspects.map(({ aspect, contribution }) => (
                    <li key={aspect.id} className="flex justify-between items-center text-brand-text-muted">
                        <div className="flex items-center gap-1.5 font-manrope">
                            <span>{CELESTIAL_GLYPHS[aspect.body1.id]}</span>
                            <span className={aspectTypeClasses[aspect.type] || ''}>{aspect.symbol}</span>
                            <span>{CELESTIAL_GLYPHS[aspect.body2.id]}</span>
                        </div>
                        <span className={`font-semibold ${contribution > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {contribution.toFixed(0)}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
};


const Chart: React.FC<{ 
    data: ChartDataPoint[], 
    activePeriod: number,
    setTooltip: (data: TooltipData | null) => void,
    fontSize: number;
    width: number;
    height: number;
}> = ({ data, activePeriod, setTooltip, fontSize, width, height }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const margin = { top: 10, right: 0, bottom: 20, left: 0 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const { minScore, maxScore } = useMemo(() => {
        if (!data || data.length === 0) {
            return { minScore: -1000, maxScore: 1000 };
        }

        const scores = data.map(d => d.score);
        const actualMin = Math.min(...scores);
        const actualMax = Math.max(...scores);

        const buffer = (actualMax - actualMin) * 0.1 || 200; // Add a fallback buffer

        const finalMin = Math.floor((actualMin - buffer) / 250) * 250;
        const finalMax = Math.ceil((actualMax + buffer) / 250) * 250;

        // Ensure the range includes 0 and has some minimum height
        return { 
            minScore: Math.min(finalMin, -500), 
            maxScore: Math.max(finalMax, 500) 
        };
    }, [data]);

    const xScale = (date: Date) => {
        if (!data || data.length < 2) return margin.left + innerWidth / 2;
        const startTime = data[0].date.getTime();
        const endTime = data[data.length - 1].date.getTime();
        return margin.left + ((date.getTime() - startTime) / (endTime - startTime)) * innerWidth;
    };

    const yScale = (score: number) => {
        if (maxScore === minScore) return margin.top + innerHeight / 2;
        return margin.top + innerHeight - ((score - minScore) / (maxScore - minScore)) * innerHeight;
    };
    
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const handleMouseMove = (event: React.MouseEvent<SVGRectElement>) => {
        if (!svgRef.current || !data || data.length === 0) return;

        if (data.length === 1) {
            setHoveredIndex(0);
            setTooltip({ x: event.clientX, y: event.clientY, content: data[0] });
            return;
        }

        const svg = svgRef.current;
        const pt = svg.createSVGPoint();
        pt.x = event.clientX;
        pt.y = event.clientY;
        const { x } = pt.matrixTransform(svg.getScreenCTM()?.inverse());
        
        const eachBand = innerWidth / (data.length - 1);
        let index = Math.round((x - margin.left) / eachBand);
        index = Math.max(0, Math.min(data.length - 1, index));
        
        setHoveredIndex(index);
        if (data[index]) {
            setTooltip({ x: event.clientX, y: event.clientY, content: data[index] });
        }
    };

    const handleMouseLeave = () => {
        setHoveredIndex(null);
        setTooltip(null);
    };

    const createLinePath = (scoreType: keyof ChartDataPoint) => {
         if (!data || data.length === 0) return "";
         if (data.length === 1) return `M ${xScale(data[0].date)},${yScale(data[0][scoreType] as number)} L ${xScale(data[0].date)},${yScale(data[0][scoreType] as number)}`;
         return data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.date)},${yScale(d[scoreType] as number)}`).join(' ');
    };

    const linePath = createLinePath('score');
    
    const zeroY = yScale(0);

    const areaPath = useMemo(() => {
        if (!data || data.length < 1) return "";
        const path = linePath;
        const lastX = xScale(data[data.length - 1].date);
        const firstX = xScale(data[0].date);
        // If path is empty (e.g., single point), don't draw area
        if (!path.startsWith('M')) return "";
        return `${path} L ${lastX},${zeroY} L ${firstX},${zeroY} Z`;
    }, [data, linePath, zeroY]);

    const xAxisLabels = useMemo(() => {
        const labels: { date: Date, text: string }[] = [];
        if (!data || data.length === 0) return labels;

        const format = { day: '2-digit', month: '2-digit' } as const;

        if (activePeriod < 365) {
            const step = activePeriod <= 14 ? 1 : Math.ceil(activePeriod / 7);
            const addedLabels = new Set<string>();
            for (let i = 0; i < data.length; i += step) {
                const labelText = data[i].date.toLocaleDateString('pt-BR', format);
                if (!addedLabels.has(labelText)) {
                    labels.push({ date: data[i].date, text: labelText });
                    addedLabels.add(labelText);
                }
            }
             if (step > 1 && !addedLabels.has(data[data.length - 1].date.toLocaleDateString('pt-BR', format))) {
                labels.push({ date: data[data.length - 1].date, text: data[data.length - 1].date.toLocaleDateString('pt-BR', format) });
            }
        } else {
            data.forEach((d, i) => {
                if (i === 0 || d.date.getMonth() !== data[i-1].date.getMonth()) {
                     labels.push({ date: d.date, text: d.date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '') });
                }
            });
        }
        return labels;
    }, [data, activePeriod]);
    
    const yAxisLines = useMemo(() => {
        const lines = new Set([0]);
        const range = maxScore - minScore;
        if (range <= 0) return [0];

        const rawStep = range / 5;
        const niceSteps = [100, 250, 500, 1000, 1500, 2000];
        const step = niceSteps.find(s => s > rawStep) || niceSteps[niceSteps.length - 1];

        for (let i = step; i <= maxScore; i += step) lines.add(i);
        for (let i = -step; i >= minScore; i -= step) lines.add(i);
        return Array.from(lines).sort((a, b) => a - b);
    }, [minScore, maxScore]);


    return (
        <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full h-full text-brand-text">
            <defs>
                <linearGradient id="gradient-green" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity="0.4"/><stop offset="100%" stopColor="#22c55e" stopOpacity="0.05"/></linearGradient>
                <linearGradient id="gradient-red" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity="0.05"/><stop offset="100%" stopColor="#ef4444" stopOpacity="0.4"/></linearGradient>
                <clipPath id="clip-above-zero">
                    <rect x="0" y="0" width={width} height={zeroY} />
                </clipPath>
                <clipPath id="clip-below-zero">
                    <rect x="0" y={zeroY} width={width} height={height - zeroY} />
                </clipPath>
            </defs>
            
            <g className="y-axis-grid-lines">
                {yAxisLines.map(value => {
                    const y = yScale(value);
                    const isZeroLine = value === 0;
                    return (
                        <g key={value}>
                            <line 
                                x1={margin.left} 
                                x2={width - margin.right} 
                                y1={y} 
                                y2={y} 
                                className={isZeroLine ? "stroke-brand-text-muted/70" : "stroke-brand-border/10"}
                                strokeWidth="0.75"
                                strokeDasharray={isZeroLine ? "none" : "2 2"}
                            />
                        </g>
                    );
                })}
            </g>

            <g className="x-axis-grid-lines">
                {xAxisLabels.map(({ date }) => (
                    <line
                        key={`v-grid-${date.getTime()}`}
                        x1={xScale(date)}
                        x2={xScale(date)}
                        y1={margin.top}
                        y2={height - margin.bottom}
                        className="stroke-brand-border/10"
                        strokeWidth="0.5"
                        strokeDasharray="2 2"
                    />
                ))}
            </g>
            
            <path d={areaPath} fill="url(#gradient-green)" clipPath="url(#clip-above-zero)" />
            <path d={areaPath} fill="url(#gradient-red)" clipPath="url(#clip-below-zero)" />

            <path d={linePath} fill="none" stroke="#a78bfa" strokeWidth="2" filter="drop-shadow(0 0 5px rgba(167,139,250,0.5))" />

            <g className="x-axis-labels" fontSize={fontSize} fill="currentColor" opacity="0.7">
                {xAxisLabels.map(({date, text}, index) => {
                    const isFirst = index === 0;
                    const isLast = index === xAxisLabels.length - 1;
                    const textAnchor = isFirst ? 'start' : isLast ? 'end' : 'middle';

                    return (
                        <text 
                            key={date.getTime()} 
                            x={xScale(date)} 
                            y={height - 5} 
                            textAnchor={textAnchor}
                        >
                            {text}
                        </text>
                    );
                })}
            </g>
            
            {hoveredIndex !== null && data[hoveredIndex] && (
                <g className="interactive-layer pointer-events-none">
                    <line x1={xScale(data[hoveredIndex].date)} y1={margin.top} x2={xScale(data[hoveredIndex].date)} y2={height - margin.bottom} className="stroke-brand-border/40" strokeWidth="1" />
                    <circle cx={xScale(data[hoveredIndex].date)} cy={yScale(data[hoveredIndex].score)} r="4" fill="#a78bfa" className="stroke-white" strokeWidth="1.5" />
                </g>
            )}

            <rect x={margin.left} y={margin.top} width={innerWidth} height={innerHeight} fill="transparent" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} />
        </svg>
    );
};

const ChartSkeleton: React.FC = () => {
    const width = 500;
    const height = 150;
    const margin = { top: 10, right: 0, bottom: 20, left: 0 };
    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full animate-pulse">
            <rect x={margin.left} y={margin.top} width={width - margin.left - margin.right} height={height - margin.top - margin.bottom} className="fill-brand-surface-highlight/50" />
            <rect x={margin.left} y={margin.top} width="20" height="12" className="fill-brand-surface-highlight" rx="2"/>
            <rect x={margin.left} y={height - margin.bottom - 12} width="20" height="12" className="fill-brand-surface-highlight" rx="2"/>
            <rect x={margin.left} y={height - 15} width="40" height="10" className="fill-brand-surface-highlight" rx="2"/>
            <rect x={width - margin.right - 40} y={height - 15} width="40" height="10" className="fill-brand-surface-highlight" rx="2"/>
        </svg>
    );
};

export const TransitChart: React.FC<TransitChartProps> = ({ currentTime, natalCelestialData, dragHandle, onClose }) => {
    const periods: Record<string, number> = {
        '7 dias': 7, '14 dias': 14, '21 dias': 21,
        '27 dias': 27, '44 dias': 44, '365 dias': 365
    };
    const [activePeriod, setActivePeriod] = useState<number>(14);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [tooltip, setTooltip] = useState<TooltipData | null>(null);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [fontSize, setFontSize] = useState(8);
    const menuRef = useRef<HTMLDivElement>(null);

    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [chartSize, setChartSize] = useState({ width: 500, height: 150 });

    useEffect(() => {
        const container = chartContainerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0] && entries[0].contentRect.width > 0 && entries[0].contentRect.height > 0) {
                 setChartSize({
                    width: entries[0].contentRect.width,
                    height: entries[0].contentRect.height,
                });
            }
        });

        resizeObserver.observe(container);
        // Initial size set
        const rect = container.getBoundingClientRect();
         if (rect.width > 0 && rect.height > 0) {
            setChartSize({ width: rect.width, height: rect.height });
        }
        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!natalCelestialData) {
            setChartData([]);
            return;
        }

        const calculateData = () => {
            setIsLoading(true);
            const data: ChartDataPoint[] = [];
            const today = new Date(currentTime);
            today.setHours(12, 0, 0, 0);

            let daysToCalculate = activePeriod;
            
            const dailyDetails: ChartDataPoint[] = [];
            for (let i = 0; i < daysToCalculate; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() + i);
                const details = calculateTransitDetailsForDay(date, natalCelestialData);
                dailyDetails.push({ ...details, date });
            }
            
            if (activePeriod === 365) {
                for (let i = 0; i < 52; i++) {
                    const weekDetails = dailyDetails.slice(i * 7, (i + 1) * 7);
                    if (weekDetails.length === 0) continue;
                    const avgScore = weekDetails.reduce((sum, d) => sum + d.score, 0) / weekDetails.length;
                    const avgPositive = weekDetails.reduce((sum, d) => sum + d.positiveScore, 0) / weekDetails.length;
                    const avgNegative = weekDetails.reduce((sum, d) => sum + d.negativeScore, 0) / weekDetails.length;
                    const date = new Date(today);
                    date.setDate(today.getDate() + i * 7 + 3);
                    data.push({ date, score: avgScore, positiveScore: avgPositive, negativeScore: avgNegative, contributingAspects: [] });
                }
                 setChartData(data);
            } else {
                setChartData(dailyDetails);
            }
            
            setIsLoading(false);
        };
        
        const timer = setTimeout(calculateData, 100);
        return () => clearTimeout(timer);

    }, [activePeriod, natalCelestialData, currentTime]);
    
    const tabButtonBase = "py-1 px-2 text-[11px] rounded-md transition-colors font-semibold uppercase tracking-wider min-w-[36px] text-center";
    const tabButtonActive = "bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 text-violet-300 shadow-[0_0_10px_rgba(139,92,246,0.3)]";
    const tabButtonInactive = "text-brand-text-muted hover:bg-brand-surface-highlight";
    
    const renderContent = () => {
        if (!natalCelestialData) {
            return (
                <div className="flex flex-col items-center justify-center text-center h-full p-4">
                    <UI_ICONS.AspectIcon className="w-12 h-12 text-violet-800 mb-2" />
                    <h4 className="font-orbitron text-brand-text">Gráfico de Trânsitos</h4>
                    <p className="text-brand-text-muted mt-1 text-sm">
                        Defina um Mapa Natal para visualizar suas previsões pessoais.
                    </p>
                </div>
            );
        }

        return (
            <div className="flex flex-col h-full w-full">
                <div className="flex-grow min-h-0">
                    {isLoading ? <ChartSkeleton /> : <Chart data={chartData} activePeriod={activePeriod} setTooltip={setTooltip} fontSize={fontSize} width={chartSize.width} height={chartSize.height} />}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-brand-surface/40 backdrop-blur-md rounded-2xl shadow-xl flex flex-col h-full relative border border-brand-border/10">
             <div className="px-3 py-2 border-b border-brand-border/10 flex justify-between items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                    {dragHandle}
                    <h3 className="text-sm font-semibold uppercase text-brand-text-muted tracking-wider truncate">Trânsitos</h3>
                </div>
                <div className="flex items-center gap-2">
                    {natalCelestialData && (
                        <div className="flex items-center bg-brand-surface-highlight/50 p-0.5 rounded-lg border border-brand-border/5">
                            {Object.entries(periods).map(([label, days]) => (
                                <button
                                    key={days}
                                    onClick={() => setActivePeriod(days)}
                                    className={`${tabButtonBase} ${activePeriod === days ? tabButtonActive : tabButtonInactive}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}
                    {onClose && (
                        <button onClick={onClose} className="p-1.5 text-brand-text-muted hover:text-brand-text bg-brand-surface-highlight/50 hover:bg-brand-surface-highlight rounded-md transition-colors" aria-label="Fechar painel de trânsitos">
                            <UI_ICONS.CloseIcon className="w-5 h-5" />
                        </button>
                    )}
                     {natalCelestialData && (
                        <div ref={menuRef} className="relative">
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(p => !p); }}
                                className="p-1.5 text-brand-text-muted hover:text-brand-text bg-brand-surface-highlight/50 hover:bg-brand-surface-highlight rounded-md transition-colors"
                                aria-label="Opções do gráfico"
                            >
                                <UI_ICONS.MoreIcon className="w-5 h-5" />
                            </button>
                            {isMenuOpen && (
                                <div className="absolute top-full right-0 mt-2 z-40 bg-brand-surface/95 backdrop-blur-xl border border-brand-border/10 rounded-lg shadow-2xl p-2 w-60">
                                   <SizeControl label="Tamanho da Fonte" value={fontSize} onChange={setFontSize} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="flex-grow min-h-0 w-full" ref={chartContainerRef}>
                {renderContent()}
            </div>
            {tooltip && (
                <div
                    className="fixed z-50 p-3 max-w-sm bg-brand-dark/80 rounded-xl shadow-xl backdrop-blur-md border border-brand-border/30 pointer-events-none"
                    style={{
                        top: tooltip.y + 15,
                        left: tooltip.x + 15,
                    }}
                >
                    <ChartTooltip data={tooltip.content} />
                </div>
            )}
        </div>
    );
};
