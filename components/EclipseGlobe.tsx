/**
 * Globo da sombra da Lua (janela de eclipse).
 *
 * Solar: penumbra (eclipse parcial), mancha central (anel/totalidade),
 *        faixa central completa e a noite.
 * Lunar: hemisfério de onde a Lua está acima do horizonte e a noite.
 *
 * Segue o mesmo instante do timer da janela (`timeMs`). Carregado sob demanda
 * (React.lazy) — d3-geo e o mapa-múndi só baixam quando a janela abre.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { geoArea, geoCircle, geoDistance, geoGraticule10, geoOrthographic, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import landTopology from 'world-atlas/land-110m.json';
import type { EclipseEvent } from '../lib/astrology/eclipses';
import { getCentralTrack, getShadowState, getSubLunarPoint, getSubSolarPoint, LonLat } from '../lib/astrology/eclipseShadow';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LAND = feature(landTopology as any, (landTopology as any).objects.land) as any;
const GRATICULE = geoGraticule10();
const SPHERE = { type: 'Sphere' } as const;

interface EclipseGlobeProps {
    event: EclipseEvent;
    timeMs: number;
    place: { lat: number; lon: number; name: string };
    size?: number;
}

const clampLat = (v: number) => Math.max(-70, Math.min(70, v));

const EclipseGlobe: React.FC<EclipseGlobeProps> = ({ event, timeMs, place, size = 230 }) => {
    const isSolar = event.type === 'solar';
    const [rotate, setRotate] = useState<[number, number]>([0, 0]);
    const drag = useRef<{ x: number; y: number; r: [number, number] } | null>(null);

    // Centraliza no ponto de máximo (solar) ou sob a Lua (lunar) ao trocar de eclipse
    useEffect(() => {
        try {
            let c: LonLat;
            if (isSolar) {
                c = event.greatest ? [event.greatest.lon, event.greatest.lat] : getShadowState(event.peak).nearest;
            } else {
                c = getSubLunarPoint(event.peak);
            }
            setRotate([-c[0], -clampLat(c[1])]);
        } catch { /* mantém a rotação atual */ }
    }, [event.id, isSolar, event.greatest, event.peak]);

    const projection = useMemo(
        () => geoOrthographic().scale(size / 2 - 3).translate([size / 2, size / 2]).rotate(rotate).clipAngle(90).precision(0.4),
        [rotate, size],
    );
    const path = useMemo(() => geoPath(projection), [projection]);

    const layers = useMemo(() => {
        const t = new Date(timeMs);
        try {
            if (isSolar) {
                const s = getShadowState(t);
                let penumbra: GeoJSON.Polygon | null = null;
                if (s.penumbra && s.penumbra.length > 2) {
                    const ring = [...s.penumbra, s.penumbra[0]];
                    penumbra = { type: 'Polygon', coordinates: [ring] };
                    // d3 desenha o "lado de dentro" pela ordem dos pontos; corrige se saiu invertido
                    if (geoArea(penumbra) > 2 * Math.PI) penumbra = { type: 'Polygon', coordinates: [[...ring].reverse()] };
                }
                const spot = s.center ? geoCircle().center(s.center).radius(s.centralSpotDeg)() : null;
                return {
                    night: geoCircle().center([s.subsolar[0] + 180, -s.subsolar[1]]).radius(90)(),
                    penumbra,
                    spot,
                    moonUp: null as GeoJSON.Polygon | null,
                };
            }
            const sun = getSubSolarPoint(t);
            const moon = getSubLunarPoint(t);
            return {
                night: geoCircle().center([sun[0] + 180, -sun[1]]).radius(90)(),
                penumbra: null,
                spot: null,
                moonUp: geoCircle().center(moon).radius(90)(),
            };
        } catch {
            return { night: null, penumbra: null, spot: null, moonUp: null };
        }
    }, [timeMs, isSolar]);

    const track = useMemo<GeoJSON.MultiLineString | null>(() => {
        if (!isSolar || (event.kind !== 'annular' && event.kind !== 'total')) return null;
        try {
            const segs = getCentralTrack(event.id, event.peak);
            return segs.length ? { type: 'MultiLineString', coordinates: segs } : null;
        } catch { return null; }
    }, [event.id, event.kind, event.peak, isSolar]);

    const pin = useMemo(() => {
        const ll: [number, number] = [place.lon, place.lat];
        const visible = geoDistance(ll, [-rotate[0], -rotate[1]]) < Math.PI / 2 - 0.02;
        const p = projection(ll);
        return visible && p ? p : null;
    }, [place, projection, rotate]);

    const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
        (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
        drag.current = { x: e.clientX, y: e.clientY, r: rotate };
    };
    const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
        if (!drag.current) return;
        const k = 180 / size;
        const { x, y, r } = drag.current;
        setRotate([r[0] + (e.clientX - x) * k, clampLat(r[1] - (e.clientY - y) * k)]);
    };
    const onPointerUp = () => { drag.current = null; };

    const accent = isSolar ? '#FB923C' : '#f87171';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                role="img"
                aria-label={isSolar ? 'Globo com a sombra da Lua sobre a Terra' : 'Globo com a região de onde a Lua está visível'}
                style={{ cursor: drag.current ? 'grabbing' : 'grab', touchAction: 'none', maxWidth: '100%', height: 'auto' }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
            >
                <path d={path(SPHERE) ?? undefined} fill="#0f1d30" stroke="rgba(255,255,255,0.18)" />
                <path d={path(GRATICULE) ?? undefined} fill="none" stroke="rgba(255,255,255,0.06)" />
                <path d={path(LAND) ?? undefined} fill="#253f37" stroke="rgba(160,210,180,0.25)" strokeWidth={0.5} />
                {layers.moonUp && <path d={path(layers.moonUp) ?? undefined} fill="rgba(248,113,113,0.10)" stroke="rgba(248,113,113,0.45)" strokeDasharray="3 3" />}
                {layers.night && <path d={path(layers.night) ?? undefined} fill="rgba(0,0,0,0.42)" />}
                {layers.penumbra && <path d={path(layers.penumbra) ?? undefined} fill="rgba(0,0,0,0.5)" stroke={accent} strokeDasharray="3 3" strokeWidth={0.8} />}
                {track && <path d={path(track) ?? undefined} fill="none" stroke={accent} strokeWidth={1.6} />}
                {layers.spot && <path d={path(layers.spot) ?? undefined} fill={accent} />}
                {pin && (
                    <g transform={`translate(${pin[0]},${pin[1]})`}>
                        <circle r={4.5} fill="#F5F2EB" stroke="#0a0710" strokeWidth={1.5} />
                    </g>
                )}
            </svg>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, fontSize: 11, color: 'rgba(245,242,235,0.6)' }}>
                {isSolar ? (
                    <>
                        <span><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: 'rgba(0,0,0,.55)', border: `1px dashed ${accent}`, verticalAlign: -1 }} /> Parcial</span>
                        {track && <span><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: accent, verticalAlign: -1 }} /> {event.kind === 'annular' ? 'Anel' : 'Total'}</span>}
                        {track && <span><span style={{ display: 'inline-block', width: 10, height: 2, background: accent, verticalAlign: 2 }} /> Faixa central</span>}
                    </>
                ) : (
                    <span><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: 'rgba(248,113,113,.15)', border: `1px dashed ${accent}`, verticalAlign: -1 }} /> Lua acima do horizonte</span>
                )}
                <span><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: '#F5F2EB', verticalAlign: -1 }} /> Local</span>
            </div>
        </div>
    );
};

export default EclipseGlobe;
