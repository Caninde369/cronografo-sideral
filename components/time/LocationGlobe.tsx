/**
 * Globo do navegador de data: o mesmo desenho do globo da janela de eclipses
 * (oceano, meridianos, continentes e a noite no instante escolhido), girando até o local escolhido.
 * Pode ser arrastado. Carregado sob demanda (React.lazy): d3-geo e o mapa-múndi só baixam ao abrir.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { geoCircle, geoDistance, geoGraticule10, geoOrthographic, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import landTopology from 'world-atlas/land-110m.json';
import { getSubSolarPoint } from '../../lib/astrology/eclipseShadow';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LAND = feature(landTopology as any, (landTopology as any).objects.land) as any;
const GRATICULE = geoGraticule10();
const SPHERE = { type: 'Sphere' } as const;
const clampLat = (v: number) => Math.max(-70, Math.min(70, v));

/** onPick: duplo clique no globo marca esse ponto (latitude e longitude do lugar clicado). */
// Cursor de alfinete: a ponta (embaixo, no centro) é o ponto que o duplo clique marca.
const PIN_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='32' viewBox='0 0 24 32'><path d='M12 31 C12 31 3 19.5 3 11.5 a9 9 0 0 1 18 0 C21 19.5 12 31 12 31 Z' fill='%23EDE9E3' stroke='%23040004' stroke-width='1.5'/><circle cx='12' cy='11.5' r='3.4' fill='%23040004'/></svg>`;
const PIN_CURSOR = `url("data:image/svg+xml;utf8,${PIN_SVG.replace(/"/g, "'").replace(/#/g, '%23').replace(/</g, '%3C').replace(/>/g, '%3E')}") 12 31, crosshair`;

const LocationGlobe: React.FC<{ lat: number; lon: number; timeMs: number; size?: number; onPick?: (lat: number, lon: number) => void }> = ({ lat, lon, timeMs, size = 190, onPick }) => {
    const [rotate, setRotate] = useState<[number, number]>([-lon, -clampLat(lat)]);
    const rotRef = useRef(rotate);
    rotRef.current = rotate;
    const drag = useRef<{ x: number; y: number; r: [number, number] } | null>(null);

    // gira suavemente até o novo local
    useEffect(() => {
        const from = rotRef.current;
        let dl = -lon - from[0];
        while (dl > 180) dl -= 360;
        while (dl < -180) dl += 360;
        const to: [number, number] = [from[0] + dl, -clampLat(lat)];
        const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        if (reduce) { setRotate(to); return; }
        const t0 = performance.now(), dur = 700;
        let raf = 0;
        const step = (now: number) => {
            const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
            setRotate([from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e]);
            if (k < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [lat, lon]);

    const projection = useMemo(
        () => geoOrthographic().scale(size / 2 - 3).translate([size / 2, size / 2]).rotate(rotate).clipAngle(90).precision(0.4),
        [rotate, size],
    );
    const path = useMemo(() => geoPath(projection), [projection]);

    const night = useMemo(() => {
        try {
            const sun = getSubSolarPoint(new Date(timeMs));
            return geoCircle().center([sun[0] + 180, -sun[1]]).radius(90)();
        } catch { return null; }
    }, [timeMs]);

    const pin = useMemo(() => {
        const ll: [number, number] = [lon, lat];
        const visible = geoDistance(ll, [-rotate[0], -rotate[1]]) < Math.PI / 2 - 0.02;
        const p = projection(ll);
        return visible && p ? p : null;
    }, [lat, lon, projection, rotate]);

    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            role="img"
            aria-label="Globo com o local escolhido"
            style={{ cursor: onPick ? PIN_CURSOR : 'grab', touchAction: 'none', maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto' }}
            onPointerDown={e => { (e.currentTarget as Element).setPointerCapture?.(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, r: rotate }; }}
            onPointerMove={e => { if (!drag.current) return; const k = 180 / size; const { x, y, r } = drag.current; setRotate([r[0] + (e.clientX - x) * k, clampLat(r[1] - (e.clientY - y) * k)]); }}
            onPointerUp={() => { drag.current = null; }}
            onPointerCancel={() => { drag.current = null; }}
            onDoubleClick={e => {
                if (!onPick) return;
                const b = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
                const x = (e.clientX - b.left) * size / b.width, y = (e.clientY - b.top) * size / b.height;
                if (Math.hypot(x - size / 2, y - size / 2) > size / 2 - 3) return; // fora do globo
                const ll = projection.invert?.([x, y]);
                if (ll && isFinite(ll[0]) && isFinite(ll[1])) onPick(ll[1], ((ll[0] + 540) % 360) - 180);
            }}
        >
            <title>Arraste para girar · dois cliques marcam o ponto</title>
            <path d={path(SPHERE) ?? undefined} fill="#0f1d30" stroke="rgba(255,255,255,0.18)" />
            <path d={path(GRATICULE) ?? undefined} fill="none" stroke="rgba(255,255,255,0.06)" />
            <path d={path(LAND) ?? undefined} fill="#253f37" stroke="rgba(160,210,180,0.25)" strokeWidth={0.5} />
            {night && <path d={path(night) ?? undefined} fill="rgba(0,0,0,0.42)" />}
            {pin && (
                <g transform={`translate(${pin[0]},${pin[1]})`}>
                    <circle r={9} fill="rgba(245,242,235,0.15)" />
                    <circle r={4.5} fill="#F5F2EB" stroke="#0a0710" strokeWidth={1.5} />
                </g>
            )}
        </svg>
    );
};

export default LocationGlobe;
