/**
 * Janela de eclipse (opção B) — abre pelo botão "Eclipses" da sidebar ou pelo
 * card de eclipse no card da Lua.
 *
 * - Ilustração real (Sol/Lua ou Lua/sombra da Terra), com orientação fixa no
 *   máximo do eclipse e a trajetória da Lua desenhada.
 * - Globo com a sombra da Lua (carregado sob demanda), no mesmo instante do timer.
 * - Timer (scrubber) do início ao fim do eclipse no local escolhido; acompanha o
 *   horário real durante o eclipse ("Agora").
 * - Locais: o local atual do Cronógrafo, os locais principais do eclipse e
 *   "Escolher cidade".
 * - Lista de eclipses por ano.
 * - Zodíaco TROPICAL.
 */
import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
    EclipseEvent,
    EclipseLocalView,
    calendarDaysBetween,
    getEclipsesForYear,
    getLocalView,
    getLunarDisc,
    getMainPlaces,
    getSeasonPartner,
    getSolarDisc,
    getUpcomingEclipse,
} from '../lib/astrology/eclipses';
import { LocationSearchInput } from './LocationSearchInput';

const EclipseGlobe = lazy(() => import('./EclipseGlobe'));

export interface EclipsePanelProps {
    isOpen: boolean;
    onClose: () => void;
    /** Data de referência (hora do Cronógrafo) para escolher o eclipse inicial */
    referenceDate: Date;
    /** Local atual aplicado no Cronógrafo */
    location: { latitude: number; longitude: number; displayName: string };
    /** Leva o relógio ao instante informado */
    onGoToTime?: (date: Date) => void;
    /** Ref usada pelo App para a lógica de "clicar fora fecha" */
    containerRef?: React.RefObject<HTMLDivElement | null>;
}

interface PlaceOption {
    id: string;
    name: string;
    lat: number;
    lon: number;
}

const MONTHS3 = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

const C = {
    text: '#F5F2EB',
    muted: 'rgba(245,242,235,0.58)',
    soft: 'rgba(245,242,235,0.82)',
    line: 'rgba(255,255,255,0.08)',
    tile: 'rgba(255,255,255,0.04)',
    gold: '#D4AF37',
    sun: '#FFD27A',
    sunEdge: '#FB923C',
    solarAccent: '#FDBA74',
    lunarAccent: '#f87171',
    bg: '#0a0710',
};
const FONT_SANS = "'DM Sans', system-ui, sans-serif";
const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
const FONT_MONO = "'Azeret Mono', 'Space Mono', ui-monospace, monospace";

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
const fmtDate = (d: Date) => `${d.getDate()} ${MONTHS3[d.getMonth()]} ${d.getFullYear()}`;
const fmtDuration = (ms: number) => {
    const totalSec = Math.max(0, Math.round(ms / 1000));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}h${String(m).padStart(2, '0')}`;
    return `${m}m${String(s).padStart(2, '0')}s`;
};
const kindLabel = (k: string) =>
    ({ total: 'Total', annular: 'Anular', partial: 'Parcial', penumbral: 'Penumbral' } as Record<string, string>)[k] ?? k;

const countdownLabel = (ev: EclipseEvent, view: EclipseLocalView | null): string => {
    const now = new Date();
    if (view && now >= view.begin && now <= view.end) return 'acontecendo agora';
    const d = calendarDaysBetween(now, ev.peak);
    if (d === 0) return now < ev.peak ? 'hoje' : 'foi hoje';
    if (d === 1) return 'amanhã';
    if (d === -1) return 'foi ontem';
    if (d > 1) return `começa em ${d} dias`;
    return `há ${-d} dias`;
};

const isNear = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) =>
    Math.abs(a.lat - b.lat) < 0.5 && Math.abs(a.lon - b.lon) < 0.5;

// ─────────────────────────────────────────────────────────────────────────────
// Ilustração do eclipse
// ─────────────────────────────────────────────────────────────────────────────

const VB = { x: -110, y: -100, w: 220, h: 200 };

const EclipseDiscSvg: React.FC<{ event: EclipseEvent; timeMs: number; place: PlaceOption; view: EclipseLocalView }> = ({ event, timeMs, place, view }) => {
    const orientation = view.peak;
    const disc = useMemo(() => {
        try {
            const t = new Date(timeMs);
            return event.type === 'solar' ? getSolarDisc(t, place.lat, place.lon, orientation) : getLunarDisc(t, place.lat, place.lon);
        } catch {
            return null;
        }
    }, [event, timeMs, place, orientation]);

    // Trajetória da Lua (início → fim), na mesma orientação fixa
    const trackEnds = useMemo(() => {
        try {
            if (event.type === 'solar') {
                return [getSolarDisc(view.begin, place.lat, place.lon, orientation), getSolarDisc(view.end, place.lat, place.lon, orientation)];
            }
            return [getLunarDisc(view.begin, place.lat, place.lon), getLunarDisc(view.end, place.lat, place.lon)];
        } catch {
            return null;
        }
    }, [event, place, view, orientation]);

    const inCentral = !!(view.centralBegin && view.centralEnd && timeMs >= view.centralBegin.getTime() && timeMs <= view.centralEnd.getTime());
    const clipId = `ecl-frame-${event.id.replace(/[^a-z0-9]/gi, '')}`;

    if (!disc) {
        return <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 12 }}>Não foi possível desenhar o eclipse.</div>;
    }

    const below = disc.altitude < -0.5;

    if (event.type === 'solar') {
        const k = 58 / disc.baseRadius; // px por grau
        const moonR = disc.moonRadius * k;
        const totalNow = inCentral && view.kind === 'total';
        return (
            <svg width={VB.w} height={VB.h} viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} aria-hidden="true" style={{ overflow: 'hidden', maxWidth: '100%', height: 'auto' }}>
                <defs>
                    <clipPath id={clipId}><rect x={VB.x} y={VB.y} width={VB.w} height={VB.h} /></clipPath>
                    <radialGradient id={`${clipId}-corona`} r="50%">
                        <stop offset="55%" stopColor="rgba(255,255,255,0.35)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                    </radialGradient>
                </defs>
                <g clipPath={`url(#${clipId})`} opacity={below ? 0.35 : 1}>
                    {totalNow && <circle r={96} fill={`url(#${clipId}-corona)`} />}
                    {trackEnds && (
                        <line
                            x1={trackEnds[0].dx * k} y1={trackEnds[0].dy * k}
                            x2={trackEnds[1].dx * k} y2={trackEnds[1].dy * k}
                            stroke="rgba(245,242,235,0.22)" strokeDasharray="3 4" strokeWidth={1}
                        />
                    )}
                    <circle r={58} fill={C.sun} stroke={C.sunEdge} strokeWidth={inCentral ? 5 : 2.5} />
                    <circle cx={disc.dx * k} cy={disc.dy * k} r={moonR} fill={C.bg} stroke="rgba(255,255,255,0.10)" strokeWidth={1} />
                </g>
                {below && (
                    <text y={4} textAnchor="middle" fill={C.soft} style={{ fontFamily: FONT_SANS, fontSize: 12 }}>Sol abaixo do horizonte</text>
                )}
            </svg>
        );
    }

    // Lunar: Lua atravessando a penumbra e a umbra da Terra (norte para cima)
    const pen = disc.penumbraRadius ?? disc.baseRadius * 1.8;
    const k = 92 / (pen + disc.moonRadius);
    const moonR = disc.moonRadius * k;
    const mx = disc.dx * k;
    const my = disc.dy * k;
    return (
        <svg width={VB.w} height={VB.h} viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} aria-hidden="true" style={{ overflow: 'hidden', maxWidth: '100%', height: 'auto' }}>
            <defs>
                <clipPath id={clipId}><circle cx={mx} cy={my} r={moonR} /></clipPath>
            </defs>
            <g opacity={below ? 0.4 : 1}>
                <circle r={pen * k} fill="rgba(255,255,255,0.02)" stroke="rgba(248,113,113,0.35)" strokeDasharray="3 4" />
                <circle r={disc.baseRadius * k} fill="rgba(127,29,29,0.18)" stroke="rgba(248,113,113,0.55)" />
                {trackEnds && (
                    <line
                        x1={trackEnds[0].dx * k} y1={trackEnds[0].dy * k}
                        x2={trackEnds[1].dx * k} y2={trackEnds[1].dy * k}
                        stroke="rgba(245,242,235,0.22)" strokeDasharray="3 4" strokeWidth={1}
                    />
                )}
                <circle cx={mx} cy={my} r={moonR} fill="#E7E2D6" />
                <g clipPath={`url(#${clipId})`}>
                    <circle r={pen * k} fill="rgba(0,0,0,0.22)" />
                    <circle r={disc.baseRadius * k} fill="#7a2416" opacity={0.92} />
                </g>
            </g>
            {below && (
                <text y={4} textAnchor="middle" fill={C.soft} style={{ fontFamily: FONT_SANS, fontSize: 12 }}>Lua abaixo do horizonte</text>
            )}
        </svg>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Janela
// ─────────────────────────────────────────────────────────────────────────────

export const EclipsePanel: React.FC<EclipsePanelProps> = ({ isOpen, onClose, referenceDate, location, onGoToTime, containerRef }) => {
    const [selected, setSelected] = useState<EclipseEvent | null>(null);
    const [mode, setMode] = useState<'detail' | 'list'>('detail');
    const [listYear, setListYear] = useState<number>(new Date().getFullYear());
    const [listFilter, setListFilter] = useState<'all' | 'solar' | 'lunar'>('all');
    const [placeId, setPlaceId] = useState<string>('current');
    const [customPlace, setCustomPlace] = useState<PlaceOption | null>(null);
    const [scrubMs, setScrubMs] = useState<number>(0);
    const [following, setFollowing] = useState(false);
    const [playing, setPlaying] = useState(false);
    const rafRef = useRef<number | null>(null);

    // Ao abrir: eclipse do dia ou o próximo a partir da hora do Cronógrafo
    useEffect(() => {
        if (!isOpen) return;
        try {
            const up = getUpcomingEclipse(referenceDate);
            if (up) {
                setSelected(up.event);
                setListYear(up.event.peak.getFullYear());
            }
        } catch (err) {
            console.warn('[EclipsePanel] falha ao buscar eclipse', err);
        }
        setMode('detail');
        setPlaceId('current');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // Locais: atual do Cronógrafo + principais do eclipse + cidade escolhida
    const places = useMemo<PlaceOption[]>(() => {
        const current: PlaceOption = {
            id: 'current',
            name: (location.displayName || 'Local atual').split(',')[0].trim(),
            lat: location.latitude,
            lon: location.longitude,
        };
        const list: PlaceOption[] = [current];
        if (selected) {
            for (const p of getMainPlaces(selected)) {
                if (!list.some(q => isNear(q, p))) list.push({ id: p.id, name: p.name, lat: p.lat, lon: p.lon });
            }
        }
        if (customPlace && !list.some(q => isNear(q, customPlace))) list.push(customPlace);
        return list;
    }, [location, selected, customPlace]);

    const views = useMemo<Record<string, EclipseLocalView | null>>(() => {
        const out: Record<string, EclipseLocalView | null> = {};
        if (!selected) return out;
        for (const p of places) {
            try { out[p.id] = getLocalView(selected, p.lat, p.lon); } catch { out[p.id] = null; }
        }
        return out;
    }, [selected, places]);

    const place = places.find(p => p.id === placeId) ?? places[0];
    const view = selected ? views[place.id] ?? null : null;
    const scrubbable = !!view && view.reason !== 'outside-shadow';

    const isLive = useCallback(() => {
        if (!view) return false;
        const now = Date.now();
        return now >= view.begin.getTime() && now <= view.end.getTime();
    }, [view]);

    // Posição inicial do timer: agora (se ao vivo) ou o máximo
    useEffect(() => {
        if (!view) return;
        setPlaying(false);
        if (isLive()) {
            setFollowing(true);
            setScrubMs(Date.now());
        } else {
            setFollowing(false);
            setScrubMs(view.peak.getTime());
        }
    }, [view, isLive]);

    // Ao vivo: acompanha o relógio real
    useEffect(() => {
        if (!following || !view) return;
        const id = window.setInterval(() => {
            if (isLive()) setScrubMs(Date.now());
            else setFollowing(false);
        }, 1000);
        return () => window.clearInterval(id);
    }, [following, view, isLive]);

    // Reprodução (play): percorre o eclipse inteiro em ~12 s
    useEffect(() => {
        if (!playing || !view) return;
        const begin = view.begin.getTime();
        const end = view.end.getTime();
        const speed = (end - begin) / 12000;
        let last = performance.now();
        const step = (now: number) => {
            const dt = now - last;
            last = now;
            setScrubMs(prev => {
                const next = Math.min(end, Math.max(begin, prev) + dt * speed);
                if (next >= end) setPlaying(false);
                return next;
            });
            rafRef.current = requestAnimationFrame(step);
        };
        rafRef.current = requestAnimationFrame(step);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [playing, view]);

    // Esc fecha
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    const yearList = useMemo(() => {
        try {
            const all = getEclipsesForYear(listYear);
            return listFilter === 'all' ? all : all.filter(e => e.type === listFilter);
        } catch { return []; }
    }, [listYear, listFilter]);

    const partner = useMemo(() => (selected ? getSeasonPartner(selected) : null), [selected]);
    const nextUpcomingId = useMemo(() => (isOpen ? getUpcomingEclipse(new Date())?.event.id : undefined), [isOpen]);

    if (!isOpen) return null;

    const accent = selected?.type === 'lunar' ? C.lunarAccent : C.solarAccent;
    const span = view ? view.end.getTime() - view.begin.getTime() : 1;
    const frac = view ? (scrubMs - view.begin.getTime()) / span : 0;

    let phaseText = '';
    if (view && selected) {
        const t = scrubMs;
        const inCentral = view.centralBegin && view.centralEnd && t >= view.centralBegin.getTime() && t <= view.centralEnd.getTime();
        const inPartial = view.partialBegin && view.partialEnd && t >= view.partialBegin.getTime() && t <= view.partialEnd.getTime();
        if (Math.abs(t - view.peak.getTime()) < 45000) phaseText = 'Máximo';
        else if (t - view.begin.getTime() < 45000) phaseText = 'Primeiro contato';
        else if (view.end.getTime() - t < 45000) phaseText = 'Último contato';
        else if (inCentral) phaseText = selected.type === 'lunar' ? 'Totalidade · Lua vermelha' : (view.kind === 'annular' ? 'Anel de fogo' : 'Totalidade');
        else if (selected.type === 'lunar') phaseText = inPartial ? 'Parcial · Lua entra na sombra' : 'Penumbral';
        else phaseText = 'Parcial';
    }

    const currentCoverage = (() => {
        if (!selected || !view || !scrubbable) return null;
        try {
            const t = new Date(scrubMs);
            const d = selected.type === 'solar' ? getSolarDisc(t, place.lat, place.lon) : getLunarDisc(t, place.lat, place.lon);
            return Math.round(Math.min(1, d.coverage) * 100);
        } catch { return null; }
    })();

    // Rótulo da fase central pelo TIPO do eclipse (não pelo que se vê no local)
    const centralLabel = selected?.type === 'solar' && selected.kind === 'annular' ? 'Duração do anel' : 'Totalidade';
    const centralDuration = view?.centralBegin && view?.centralEnd
        ? fmtDuration(view.centralEnd.getTime() - view.centralBegin.getTime())
        : (selected && (selected.kind === 'annular' || selected.kind === 'total') ? 'só parcial aqui' : '—');

    const pillStyle = (on: boolean): React.CSSProperties => ({
        fontFamily: FONT_SANS, fontSize: 12, padding: '5px 11px', borderRadius: 999, cursor: 'pointer',
        border: `1px solid ${on ? C.text : 'rgba(255,255,255,0.16)'}`,
        background: on ? C.text : 'transparent', color: on ? '#040004' : C.soft, whiteSpace: 'nowrap',
    });
    const ghostBtn: React.CSSProperties = {
        fontFamily: FONT_SANS, fontSize: 12, fontWeight: 500, borderRadius: 8, padding: '6px 11px',
        background: 'transparent', color: C.text, border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 6,
    };
    const secTitle: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: '.13em', textTransform: 'uppercase', color: C.gold, margin: '0 0 8px' };
    const tile: React.CSSProperties = { background: C.tile, borderRadius: 8, padding: '8px 10px' };
    const cardBox: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 };

    const pillSuffix = (p: PlaceOption) => {
        const v = views[p.id];
        if (!v || !v.visible) return ' · não visível';
        if (selected?.type === 'solar') return ` · ${Math.round(v.obscuration * 100)}%`;
        return '';
    };

    const content = (
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4"
            onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <motion.div
                ref={containerRef as React.RefObject<HTMLDivElement>}
                role="dialog"
                aria-modal="true"
                aria-label={selected?.name ?? 'Eclipses'}
                initial={{ opacity: 0, scale: 0.97, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                style={{
                    width: '100%', maxWidth: 720, maxHeight: 'calc(100vh - 24px)', padding: 1, borderRadius: 16,
                    background: 'linear-gradient(135deg,#6366F1,#22D3EE,#818cf8,#f472b6,#fb923c,#EF4444)',
                    fontFamily: FONT_SANS, color: C.text,
                }}
            >
                <div style={{ background: C.bg, borderRadius: 15, maxHeight: 'calc(100vh - 26px)', overflowY: 'auto' }} className="no-scrollbar">
                    {/* Cabeçalho */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${C.line}` }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 21, lineHeight: 1.15 }}>
                                {mode === 'list' ? 'Lista de eclipses' : (selected?.name ?? 'Eclipses')}
                            </div>
                            {mode === 'detail' && selected && (
                                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                                    {WEEKDAYS[selected.peak.getDay()]}, {fmtDate(selected.peak)} · <span style={{ color: accent }}>{countdownLabel(selected, view)}</span>
                                </div>
                            )}
                        </div>
                        <button type="button" style={ghostBtn} onClick={() => setMode(mode === 'list' ? 'detail' : 'list')}>
                            <i className={`ti ${mode === 'list' ? 'ti-arrow-left' : 'ti-list'}`} aria-hidden="true" style={{ fontSize: 15 }} />
                            {mode === 'list' ? 'Voltar' : 'Lista de eclipses'}
                        </button>
                        <button type="button" onClick={onClose} aria-label="Fechar" style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', padding: 4, display: 'flex' }}>
                            <i className="ti ti-x" aria-hidden="true" style={{ fontSize: 18 }} />
                        </button>
                    </div>

                    {/* ── LISTA ─────────────────────────────────────────── */}
                    {mode === 'list' && (
                        <div style={{ padding: '10px 16px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                                <button type="button" aria-label="Ano anterior" style={{ ...ghostBtn, padding: '5px 8px' }} onClick={() => setListYear(y => y - 1)}>
                                    <i className="ti ti-chevron-left" aria-hidden="true" style={{ fontSize: 14 }} />
                                </button>
                                <span style={{ fontFamily: FONT_MONO, fontSize: 14, minWidth: 48, textAlign: 'center' }}>{listYear}</span>
                                <button type="button" aria-label="Próximo ano" style={{ ...ghostBtn, padding: '5px 8px' }} onClick={() => setListYear(y => y + 1)}>
                                    <i className="ti ti-chevron-right" aria-hidden="true" style={{ fontSize: 14 }} />
                                </button>
                                <span style={{ flex: 1 }} />
                                {([['all', 'Todos'], ['solar', 'Solares'], ['lunar', 'Lunares']] as const).map(([v, label]) => (
                                    <button key={v} type="button" style={pillStyle(listFilter === v)} onClick={() => setListFilter(v)}>{label}</button>
                                ))}
                            </div>
                            {yearList.length === 0 && (
                                <div style={{ fontSize: 13, color: C.muted, padding: '16px 4px' }}>Nenhum eclipse encontrado neste ano.</div>
                            )}
                            {yearList.map(e => {
                                const past = e.peak.getTime() < Date.now() - 86400000;
                                const isSel = selected?.id === e.id;
                                return (
                                    <button
                                        key={e.id}
                                        type="button"
                                        onClick={() => { setSelected(e); setPlaceId('current'); setMode('detail'); }}
                                        style={{
                                            display: 'grid', gridTemplateColumns: '22px 1fr auto', gap: 10, alignItems: 'center', width: '100%',
                                            padding: '10px 6px', textAlign: 'left', cursor: 'pointer', fontFamily: FONT_SANS, color: C.text,
                                            background: isSel ? 'rgba(251,146,60,0.08)' : 'transparent', border: 'none',
                                            borderBottom: `1px solid ${C.line}`, borderRadius: isSel ? 8 : 0, opacity: past ? 0.45 : 1,
                                        }}
                                    >
                                        <span style={{
                                            width: 14, height: 14, borderRadius: '50%', justifySelf: 'center',
                                            ...(e.type === 'solar' ? { background: C.sunEdge } : { border: `1.5px solid ${C.lunarAccent}` }),
                                        }} />
                                        <span style={{ minWidth: 0 }}>
                                            <span style={{ fontSize: 13, display: 'block' }}>
                                                {e.name}
                                                {e.id === nextUpcomingId && <span style={{ fontSize: 11, color: C.solarAccent, marginLeft: 6 }}>próximo</span>}
                                            </span>
                                            <span style={{ fontSize: 11.5, color: C.muted, display: 'block' }}>{e.regions}</span>
                                        </span>
                                        <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.soft }}>{fmtDate(e.peak)}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* ── DETALHE ───────────────────────────────────────── */}
                    {mode === 'detail' && !selected && (
                        <div style={{ padding: 24, fontSize: 13, color: C.muted }}>Não foi possível calcular os eclipses agora.</div>
                    )}

                    {mode === 'detail' && selected && view && (
                        <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 14 }}>
                                {/* Ilustração */}
                                <div style={cardBox}>
                                    <div style={{ alignSelf: 'stretch', display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 11, color: C.muted }}>
                                        <span>Como fica no céu</span>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{place.name}</span>
                                    </div>
                                    {scrubbable ? (
                                        <EclipseDiscSvg event={selected} timeMs={scrubMs} place={place} view={view} />
                                    ) : (
                                        <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                            <svg width="96" height="96" viewBox="-50 -50 100 100" aria-hidden="true">
                                                {selected.type === 'solar'
                                                    ? <circle r={40} fill={C.sun} stroke={C.sunEdge} strokeWidth={3} opacity={0.5} />
                                                    : <circle r={40} fill="#E7E2D6" opacity={0.5} />}
                                            </svg>
                                            <span style={{ fontSize: 12, color: C.soft, textAlign: 'center' }}>Este eclipse não passa por aqui.</span>
                                        </div>
                                    )}
                                    {scrubbable && (
                                        <>
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
                                                <span style={{ fontFamily: FONT_MONO, fontSize: 22 }}>{hhmm(new Date(scrubMs))}</span>
                                                <span style={{ fontSize: 12, color: accent }}>{phaseText}</span>
                                            </div>
                                            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                                                {selected.type === 'solar' ? 'Cobertura do Sol' : 'Lua na sombra'}{' '}
                                                <span style={{ fontFamily: FONT_MONO, color: C.text }}>{currentCoverage ?? 0}%</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Globo */}
                                <div style={cardBox}>
                                    <div style={{ alignSelf: 'stretch', display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 11, color: C.muted }}>
                                        <span>{selected.type === 'solar' ? 'Sombra da Lua na Terra' : 'Onde a Lua está visível'}</span>
                                        <span>arraste o globo</span>
                                    </div>
                                    <Suspense fallback={<div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: C.muted }}>Carregando o globo…</div>}>
                                        <EclipseGlobe event={selected} timeMs={scrubbable ? scrubMs : selected.peak.getTime()} place={place} size={230} />
                                    </Suspense>
                                </div>
                            </div>

                            {/* Timer */}
                            {scrubbable && (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <button
                                            type="button"
                                            aria-label={playing ? 'Pausar' : 'Reproduzir'}
                                            style={{ ...ghostBtn, padding: '6px 9px' }}
                                            onClick={() => {
                                                if (!playing && scrubMs >= view.end.getTime()) setScrubMs(view.begin.getTime());
                                                setFollowing(false);
                                                setPlaying(p => !p);
                                            }}
                                        >
                                            <i className={`ti ${playing ? 'ti-player-pause' : 'ti-player-play'}`} aria-hidden="true" style={{ fontSize: 15 }} />
                                        </button>
                                        <div style={{ flex: 1, position: 'relative', height: 22, display: 'flex', alignItems: 'center' }}>
                                            {view.centralBegin && view.centralEnd && (
                                                <div style={{
                                                    position: 'absolute', height: 6, top: 8, borderRadius: 3, background: accent, pointerEvents: 'none', opacity: 0.85,
                                                    left: `${((view.centralBegin.getTime() - view.begin.getTime()) / span) * 100}%`,
                                                    width: `${Math.max(0.8, ((view.centralEnd.getTime() - view.centralBegin.getTime()) / span) * 100)}%`,
                                                }} />
                                            )}
                                            <input
                                                type="range"
                                                min={0}
                                                max={1000}
                                                step={1}
                                                value={Math.round(Math.max(0, Math.min(1, frac)) * 1000)}
                                                onChange={e => {
                                                    setPlaying(false);
                                                    setFollowing(false);
                                                    setScrubMs(view.begin.getTime() + (Number(e.target.value) / 1000) * span);
                                                }}
                                                aria-label="Momento do eclipse"
                                                style={{ width: '100%', accentColor: accent, position: 'relative' }}
                                            />
                                        </div>
                                        {isLive() && (
                                            <button type="button" style={{ ...ghostBtn, fontSize: 11, borderColor: following ? accent : 'rgba(255,255,255,0.2)', color: following ? accent : C.text }} onClick={() => { setPlaying(false); setFollowing(true); setScrubMs(Date.now()); }}>
                                                Agora
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, paddingLeft: 44, fontSize: 11, color: C.muted }}>
                                        <span>Início <span style={{ fontFamily: FONT_MONO, color: C.text }}>{hhmm(view.begin)}</span></span>
                                        <span>Máximo <span style={{ fontFamily: FONT_MONO, color: accent }}>{hhmm(view.peak)}</span></span>
                                        <span>Fim <span style={{ fontFamily: FONT_MONO, color: C.text }}>{hhmm(view.end)}</span></span>
                                    </div>
                                </div>
                            )}

                            {/* Locais */}
                            <div>
                                <p style={secTitle}>Ver de onde</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                                    {places.map(p => (
                                        <button key={p.id} type="button" style={pillStyle(p.id === place.id)} onClick={() => setPlaceId(p.id)}>
                                            {p.name}{pillSuffix(p)}
                                        </button>
                                    ))}
                                    <div style={{ width: 210, maxWidth: '100%' }}>
                                        <LocationSearchInput
                                            value=""
                                            placeholder="Escolher cidade"
                                            theme="dark"
                                            onChange={loc => {
                                                const name = (loc.displayName || 'Cidade').split(',')[0].trim();
                                                setCustomPlace({ id: 'custom', name, lat: loc.latitude, lon: loc.longitude });
                                                setPlaceId('custom');
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Dados do local + posição tropical */}
                            <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: 8 }}>
                                <div style={tile}>
                                    <div style={{ fontSize: 11, color: C.muted }}>Neste local</div>
                                    <div style={{ fontSize: 14, marginTop: 2 }}>{view.visible ? kindLabel(view.kind) : 'Não visível'}</div>
                                </div>
                                <div style={tile}>
                                    <div style={{ fontSize: 11, color: C.muted }}>{selected.type === 'solar' ? 'Cobertura máx.' : 'Lua na sombra'}</div>
                                    <div style={{ fontFamily: FONT_MONO, fontSize: 14, marginTop: 2 }}>{view.reason === 'outside-shadow' ? '—' : `${Math.round(view.obscuration * 100)}%`}</div>
                                </div>
                                <div style={tile}>
                                    <div style={{ fontSize: 11, color: C.muted }}>{centralLabel}</div>
                                    <div style={{ fontFamily: FONT_MONO, fontSize: 14, marginTop: 2 }}>{view.reason === 'outside-shadow' ? '—' : centralDuration}</div>
                                </div>
                                <div style={tile}>
                                    <div style={{ fontSize: 11, color: C.muted }}>Duração total</div>
                                    <div style={{ fontFamily: FONT_MONO, fontSize: 14, marginTop: 2 }}>{view.reason === 'outside-shadow' ? '—' : fmtDuration(span)}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                                <span style={{ ...pillStyle(false), cursor: 'default' }}>{selected.type === 'solar' ? 'Sol e Lua' : 'Lua'} a {selected.degreeLabel}</span>
                                <span style={{ ...pillStyle(false), cursor: 'default' }}>Nodo {selected.node === 'north' ? 'Norte' : 'Sul'}</span>
                                {view.reason !== 'outside-shadow' && (
                                    <span style={{ ...pillStyle(false), cursor: 'default' }}>
                                        {selected.type === 'solar' ? 'Sol' : 'Lua'} a {Math.round(view.peakAltitude)}° de altura no máximo
                                    </span>
                                )}
                                <span style={{ fontSize: 11.5, color: C.muted, marginLeft: 4 }}>Horários no seu fuso horário · zodíaco tropical</span>
                            </div>

                            {/* Rodapé */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, paddingTop: 10, borderTop: `1px solid ${C.line}`, flexWrap: 'wrap' }}>
                                {partner && (
                                    <button
                                        type="button"
                                        onClick={() => { setSelected(partner); setPlaceId('current'); }}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', color: C.text, cursor: 'pointer', fontFamily: FONT_SANS, fontSize: 12, padding: 0 }}
                                    >
                                        <span style={{ color: C.muted }}>Par da temporada:</span>
                                        <span style={{
                                            width: 8, height: 8, borderRadius: '50%',
                                            ...(partner.type === 'solar' ? { background: C.sunEdge } : { border: `1.5px solid ${C.lunarAccent}` }),
                                        }} />
                                        <span>{partner.name} · {partner.peak.getDate()} {MONTHS3[partner.peak.getMonth()]}</span>
                                        <i className="ti ti-arrow-right" aria-hidden="true" style={{ fontSize: 13, color: C.muted }} />
                                    </button>
                                )}
                                <span style={{ flex: 1 }} />
                                {onGoToTime && (
                                    <button
                                        type="button"
                                        onClick={() => { onGoToTime(view.peak); onClose(); }}
                                        style={{ ...ghostBtn, background: C.text, color: '#040004', border: 'none' }}
                                    >
                                        Ir para o pico
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );

    return createPortal(content, document.body);
};

export default EclipsePanel;
