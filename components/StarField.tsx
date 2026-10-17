import React, { useMemo, useEffect, useRef } from 'react';

export type TwinkleMode = 'natural' | 'calm' | 'vibrant' | 'subtle';
export type MeteorFrequency = 'none' | 'rare' | 'moderate' | 'frequent';

export interface StarFieldProps {
    opacity?: number;
    className?: string;
    isLight?: boolean;
    starCount?: number;
    twinkleIntensity?: number;
    twinkleSpeed?: number;
    twinkleMode?: TwinkleMode;
    showMeteors?: boolean;
    meteorFrequency?: MeteorFrequency;
    showNebulaGlow?: boolean;
    nebulaOpacity?: number;
    starBrightness?: number;
}

interface Star {
    x: number; // 0..100 (%)
    y: number; // 0..100 (%)
    size: number;
    baseOpacity: number;
    phase: number;
    speed: number;
    color: string;
    flareColor: string;
    hasFlare: boolean;
    flareAngle: number;
    layer: number; // 0 = micro-dust, 1 = faint, 2 = bright, 3 = hero
    freqMultiplier: number;
    phaseOffset2: number;
    phaseOffset3: number;
}

interface Meteor {
    x: number;
    y: number;
    length: number;
    speed: number;
    angle: number;
    opacity: number;
    active: boolean;
    thickness: number;
    hue: string;
}

// Astronomical Harvard Spectral Classification Tones (Delicate & Realistic)
const SPECTRAL_PALETTE = {
    O: '#9ec4ff', // Crisp Diamond Blue (Very hot, e.g. Alnitak)
    B: '#b9dbff', // Ice Azure (e.g. Rigel, Spica)
    A: '#ffffff', // Pure Optical White (e.g. Sirius, Vega)
    F: '#fff6e8', // Warm Pearl / Soft Cream (e.g. Procyon, Canopus)
    G: '#ffeaad', // Solar Radiant Gold (e.g. Sun, Alpha Centauri)
    K: '#ffd29e', // Soft Amber (e.g. Arcturus, Aldebaran)
    M: '#ffaa8a', // Rose Quartz / Ruby (e.g. Betelgeuse, Antares)
};

const getRandomStarColor = () => {
    const rand = Math.random();
    if (rand < 0.42) return { main: SPECTRAL_PALETTE.A, flare: '#ffffff' };
    if (rand < 0.62) return { main: SPECTRAL_PALETTE.B, flare: '#d2e8ff' };
    if (rand < 0.78) return { main: SPECTRAL_PALETTE.G, flare: '#fff3cd' };
    if (rand < 0.88) return { main: SPECTRAL_PALETTE.F, flare: '#fffaf0' };
    if (rand < 0.94) return { main: SPECTRAL_PALETTE.O, flare: '#c4ddff' };
    if (rand < 0.98) return { main: SPECTRAL_PALETTE.K, flare: '#ffe0bd' };
    return { main: SPECTRAL_PALETTE.M, flare: '#ffcfbe' };
};

export const StarField: React.FC<StarFieldProps> = React.memo(({ 
    opacity = 1, 
    className = '',
    isLight = false,
    starCount = 1400,
    twinkleIntensity = 0.75,
    twinkleSpeed = 1.0,
    twinkleMode = 'natural',
    showMeteors = true,
    meteorFrequency = 'moderate',
    showNebulaGlow = true,
    nebulaOpacity = 0.85,
    starBrightness = 1.0,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);

    // Multi-Layer Astronomical Star Generation
    const stars = useMemo(() => {
        const count = Math.max(200, Math.min(4000, starCount));
        const s: Star[] = [];

        for (let i = 0; i < count; i++) {
            // Layer partitioning for astronomical depth
            const layerRoll = Math.random();
            let size = 0.5;
            let baseOpacity = 0.3;
            let hasFlare = false;
            let layer = 0;

            if (layerRoll < 0.60) {
                // Layer 0: Vast Cosmic Dust & Sub-pixel Micro-stars (Vast depth, zero clutter)
                layer = 0;
                size = Math.random() * 0.30 + 0.30; // 0.30 - 0.60px
                baseOpacity = Math.random() * 0.22 + 0.12; // Subtle resting glow
            } else if (layerRoll < 0.88) {
                // Layer 1: Mid-field Stars (Soft natural twinkle)
                layer = 1;
                size = Math.random() * 0.40 + 0.65; // 0.65 - 1.05px
                baseOpacity = Math.random() * 0.35 + 0.30;
            } else if (layerRoll < 0.97) {
                // Layer 2: Prominent Stars (Airy disc halo)
                layer = 2;
                size = Math.random() * 0.50 + 1.10; // 1.10 - 1.60px
                baseOpacity = Math.random() * 0.35 + 0.55;
            } else {
                // Layer 3: Hero Celestial Beacons (Rare brilliant stars with micro diffraction crosses)
                layer = 3;
                size = Math.random() * 0.70 + 1.65; // 1.65 - 2.35px
                baseOpacity = Math.random() * 0.25 + 0.75;
                hasFlare = true;
            }

            const colors = getRandomStarColor();

            // Frequency and phase decoupling for organic, non-uniform scintillation
            const baseSpeed = (0.004 + Math.random() * 0.010);
            const freqMultiplier = 1.0 + (Math.random() * 0.4 - 0.2);

            s.push({
                x: Math.random() * 100,
                y: Math.random() * 100,
                size,
                baseOpacity,
                phase: Math.random() * Math.PI * 2,
                speed: baseSpeed,
                color: colors.main,
                flareColor: colors.flare,
                hasFlare,
                flareAngle: Math.random() * Math.PI * 0.5, // 0..90 deg orientation
                layer,
                freqMultiplier,
                phaseOffset2: Math.random() * 6.28,
                phaseOffset3: Math.random() * 6.28,
            });
        }
        return s;
    }, [starCount]);

    // Shooting stars / Meteors state
    const meteorsRef = useRef<Meteor[]>([]);
    const lastMeteorTimeRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        const resize = () => {
            const parent = canvas.parentElement;
            if (parent) {
                const dpr = Math.min(window.devicePixelRatio || 1, 2);
                const rect = parent.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    canvas.width = Math.round(rect.width * dpr);
                    canvas.height = Math.round(rect.height * dpr);
                    ctx.scale(dpr, dpr);
                    canvas.style.width = `${rect.width}px`;
                    canvas.style.height = `${rect.height}px`;
                }
            }
        };

        const resizeObserver = new ResizeObserver(resize);
        if (canvas.parentElement) {
            resizeObserver.observe(canvas.parentElement);
        }
        window.addEventListener('resize', resize);
        resize();

        const spawnMeteor = (w: number, h: number) => {
            if (isLight) return;
            const meteorHues = ['#ffffff', '#bce0ff', '#ffe8bc', '#a8d8ff'];
            const chosenHue = meteorHues[Math.floor(Math.random() * meteorHues.length)];

            meteorsRef.current.push({
                x: Math.random() * w * 0.85,
                y: Math.random() * h * 0.45,
                length: 70 + Math.random() * 110,
                speed: 14 + Math.random() * 9,
                angle: Math.PI / 4 + (Math.random() - 0.5) * 0.25, // ~45 deg downward-right
                opacity: 0.75 + Math.random() * 0.25,
                active: true,
                thickness: 1.1 + Math.random() * 1.2,
                hue: chosenHue,
            });
        };

        const render = (time: number) => {
            if (!canvas) return;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const w = canvas.width / dpr;
            const h = canvas.height / dpr;

            ctx.clearRect(0, 0, w, h);

            const globalOpacityMultiplier = (isLight ? 0.35 : 0.88) * starBrightness;
            const effTwinkleIntensity = Math.max(0, Math.min(1.5, twinkleIntensity));
            const effSpeed = Math.max(0.2, Math.min(3.0, twinkleSpeed));

            // 1. Subtle Cosmic Background Nebula Glows (Dark Mode Only)
            if (!isLight && showNebulaGlow) {
                const nebulaTime = time * 0.00015;
                const effNebulaAlpha = 0.038 * nebulaOpacity;

                // Galaxy Node 1: Deep Violet-Indigo
                const g1X = w * (0.28 + Math.sin(nebulaTime) * 0.08);
                const g1Y = h * (0.22 + Math.cos(nebulaTime * 0.8) * 0.08);
                const grad1 = ctx.createRadialGradient(g1X, g1Y, 15, g1X, g1Y, Math.max(w, h) * 0.48);
                grad1.addColorStop(0, `rgba(139, 92, 246, ${effNebulaAlpha})`);
                grad1.addColorStop(0.45, `rgba(56, 189, 248, ${effNebulaAlpha * 0.6})`);
                grad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = grad1;
                ctx.fillRect(0, 0, w, h);

                // Galaxy Node 2: Warm Cosmic Gold & Cyan
                const g2X = w * (0.76 + Math.cos(nebulaTime * 0.7) * 0.08);
                const g2Y = h * (0.68 + Math.sin(nebulaTime * 0.9) * 0.08);
                const grad2 = ctx.createRadialGradient(g2X, g2Y, 15, g2X, g2Y, Math.max(w, h) * 0.42);
                grad2.addColorStop(0, `rgba(245, 158, 11, ${effNebulaAlpha * 0.65})`);
                grad2.addColorStop(0.55, `rgba(99, 102, 241, ${effNebulaAlpha * 0.45})`);
                grad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = grad2;
                ctx.fillRect(0, 0, w, h);
            }

            // 2. Render Stars with Atmospheric Scintillation
            stars.forEach(star => {
                let compositeTwinkle = 0.5;

                if (twinkleMode === 'static') {
                    compositeTwinkle = 0.5;
                } else if (twinkleMode === 'calm') {
                    // Gentle breathing oscillation
                    const w1 = Math.sin(star.phase);
                    compositeTwinkle = (w1 + 1) / 2;
                } else if (twinkleMode === 'vibrant') {
                    // High-dynamic sparkling scintillation
                    const w1 = Math.sin(star.phase);
                    const w2 = Math.sin(star.phase * 2.8 + star.phaseOffset2);
                    const w3 = Math.sin(star.phase * 5.4 + star.phaseOffset3);
                    compositeTwinkle = Math.max(0, Math.min(1, (w1 * 0.45 + w2 * 0.35 + w3 * 0.20 + 1) / 2));
                } else {
                    // 'natural' - Multi-frequency astronomical atmospheric scintillation
                    const w1 = Math.sin(star.phase);
                    const w2 = Math.sin(star.phase * 2.37 + star.phaseOffset2);
                    const w3 = Math.sin(star.phase * 4.61 + star.phaseOffset3);
                    compositeTwinkle = (w1 * 0.52 + w2 * 0.32 + w3 * 0.16 + 1) / 2;
                }

                // Apply twinkle intensity dampener or amplifier
                const twinkleOffset = (compositeTwinkle - 0.5) * effTwinkleIntensity * 2;
                const dynamicFactor = Math.max(0.12, Math.min(1.4, 0.5 + twinkleOffset));

                const currentOpacity = Math.min(
                    1.0,
                    star.baseOpacity * dynamicFactor * opacity * globalOpacityMultiplier
                );

                const px = (star.x / 100) * w;
                const py = (star.y / 100) * h;

                if (isLight) {
                    // Refined Light Mode (Subtle graphite/silver-ink stardust)
                    ctx.beginPath();
                    ctx.arc(px, py, star.size * 0.75, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(90, 85, 95, ${currentOpacity * 0.75})`;
                    ctx.fill();
                } else {
                    ctx.globalAlpha = currentOpacity;

                    // Core Stellar Body
                    ctx.fillStyle = star.color;
                    ctx.beginPath();
                    ctx.arc(px, py, star.size, 0, Math.PI * 2);
                    ctx.fill();

                    // Bright Star Atmosphere (Airy Corona Halo)
                    if (star.size >= 1.0) {
                        const haloScale = star.layer === 3 ? (2.4 + compositeTwinkle * 1.2) : (1.6 + compositeTwinkle * 0.8);
                        ctx.beginPath();
                        ctx.arc(px, py, star.size * haloScale, 0, Math.PI * 2);
                        ctx.fillStyle = star.color;
                        ctx.globalAlpha = currentOpacity * (star.layer === 3 ? 0.32 : 0.18);
                        ctx.fill();
                        ctx.globalAlpha = currentOpacity;
                    }

                    // 4-Point Micro Starlight Diffraction Spikes for Hero Stars
                    if (star.hasFlare && compositeTwinkle > 0.42) {
                        const flareStrength = (compositeTwinkle - 0.42) / 0.58; // 0..1
                        const flareLen = (star.size * 5.2 + 4.5) * flareStrength;
                        const flareAlpha = currentOpacity * 0.75 * flareStrength;

                        ctx.save();
                        ctx.translate(px, py);
                        ctx.rotate(star.flareAngle);

                        ctx.strokeStyle = star.flareColor;
                        ctx.lineWidth = 0.85;
                        ctx.globalAlpha = flareAlpha;

                        // Primary cross spikes
                        ctx.beginPath();
                        ctx.moveTo(-flareLen, 0);
                        ctx.lineTo(flareLen, 0);
                        ctx.moveTo(0, -flareLen);
                        ctx.lineTo(0, flareLen);
                        ctx.stroke();

                        // Delicate secondary diagonal micro-sparkles at peak luminance
                        if (star.size > 1.8 && flareStrength > 0.65) {
                            const subFlare = flareLen * 0.42;
                            ctx.lineWidth = 0.5;
                            ctx.beginPath();
                            ctx.moveTo(-subFlare, -subFlare);
                            ctx.lineTo(subFlare, subFlare);
                            ctx.moveTo(-subFlare, subFlare);
                            ctx.lineTo(subFlare, -subFlare);
                            ctx.stroke();
                        }

                        ctx.restore();
                    }

                    ctx.globalAlpha = 1.0;
                }

                // Advance phase with configurable speed & per-star frequency
                star.phase += star.speed * star.freqMultiplier * effSpeed;
            });

            // 3. Render Shooting Stars / Meteors
            if (!isLight && showMeteors && meteorFrequency !== 'none') {
                const intervalBase = meteorFrequency === 'frequent' ? 4500 : (meteorFrequency === 'rare' ? 14000 : 8000);
                const intervalVariance = meteorFrequency === 'frequent' ? 2500 : 5000;

                if (time - lastMeteorTimeRef.current > intervalBase + Math.random() * intervalVariance) {
                    spawnMeteor(w, h);
                    lastMeteorTimeRef.current = time;
                }

                meteorsRef.current.forEach(m => {
                    if (!m.active) return;

                    const endX = m.x + Math.cos(m.angle) * m.length;
                    const endY = m.y + Math.sin(m.angle) * m.length;

                    const grad = ctx.createLinearGradient(m.x, m.y, endX, endY);
                    grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
                    grad.addColorStop(0.65, `${m.hue}55`);
                    grad.addColorStop(1, `${m.hue}${Math.round(Math.min(255, m.opacity * 255)).toString(16).padStart(2, '0')}`);

                    ctx.beginPath();
                    ctx.moveTo(m.x, m.y);
                    ctx.lineTo(endX, endY);
                    ctx.strokeStyle = grad;
                    ctx.lineWidth = m.thickness;
                    ctx.lineCap = 'round';
                    ctx.stroke();

                    // Advance position
                    m.x += Math.cos(m.angle) * m.speed;
                    m.y += Math.sin(m.angle) * m.speed;
                    m.opacity -= 0.014;

                    if (m.opacity <= 0 || m.x > w + 120 || m.y > h + 120) {
                        m.active = false;
                    }
                });

                meteorsRef.current = meteorsRef.current.filter(m => m.active);
            }

            animationRef.current = requestAnimationFrame(render);
        };

        animationRef.current = requestAnimationFrame(render);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationRef.current);
        };
    }, [stars, opacity, isLight, twinkleIntensity, twinkleSpeed, twinkleMode, showMeteors, meteorFrequency, showNebulaGlow, nebulaOpacity, starBrightness]);

    return (
        <div className={`absolute inset-0 pointer-events-none z-0 ${className}`}>
            <canvas 
                ref={canvasRef}
                className="w-full h-full block"
            />
        </div>
    );
});
