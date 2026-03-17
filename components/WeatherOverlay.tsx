
import React, { useEffect, useRef, useMemo } from 'react';
import { WeatherCondition } from '../hooks/useWeather';

interface WeatherOverlayProps {
    condition: WeatherCondition;
    cloudCover: number;
    isDay: boolean;
    windSpeed: number;
    width: number; // ViewBox width (1000)
    height: number; // ViewBox height (1000)
}

// Cloud paths inspired by the "cartoon/flat-bottom" reference style
const CLOUD_PATHS = [
    // Shape 1: Classic big fluffy (Flat bottom, 3 bumps)
    "M 47.9 66.8 L 132.1 66.8 C 145.3 66.8 156 56.1 156 42.9 C 156 31.9 148.6 22.5 138.4 19.9 C 135.5 8.6 125.2 0 113.1 0 C 104.5 0 96.8 4.3 92.2 11.2 C 88.3 7.8 83.2 5.8 77.6 5.8 C 66.3 5.8 56.8 13.9 54.7 24.6 C 52.6 24.1 50.4 23.9 48.2 23.9 C 31.6 23.9 18.2 37.3 18.2 53.9 C 18.2 54.5 18.2 55.2 18.3 55.8 C 8.1 57.6 0.3 66.1 0.3 76.5 C 0.3 88.5 10.1 98.3 22.1 98.3 L 132.1 98.3",
    
    // Shape 2: Elongated & Low (Good for stratus-like)
    "M 25 55 L 125 55 C 138.8 55 150 43.8 150 30 C 150 16.2 138.8 5 125 5 C 122 5 119.2 5.5 116.5 6.4 C 111.8 2.4 105.7 0 99 0 C 86.8 0 76.5 8.6 73.6 19.9 C 71.4 19.4 69.2 19.1 66.9 19.1 C 50.3 19.1 36.9 32.5 36.9 49.1 C 36.9 49.7 36.9 50.4 37 51 C 26.8 52.8 19 61.3 19 71.7 C 19 83.7 28.8 93.5 40.8 93.5 L 125 93.5",
    
    // Shape 3: Tall Cumulus
    "M 30 60 L 90 60 C 101 60 110 51 110 40 C 110 30 102 22 93 20 C 93 9 84 0 73 0 C 65 0 58 4 54 10 C 50 7 45 5 40 5 C 29 5 20 14 20 25 C 9 25 0 34 0 45 C 0 53 7 60 15 60",
    
    // Shape 4: Simple Small
    "M 10 30 L 60 30 C 65.5 30 70 25.5 70 20 C 70 14.5 65.5 10 60 10 C 58 5 53 0 47 0 C 40 0 34 5 32 11 C 30 10 28 10 26 10 C 17 10 10 17 10 26 C 4.5 26 0 30.5 0 36 C 0 41.5 4.5 46 10 46"
];

export const WeatherOverlay: React.FC<WeatherOverlayProps> = ({ 
    condition, 
    cloudCover, 
    isDay, 
    windSpeed,
    width, 
    height 
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);

    // --- PRECIPITATION (Canvas) ---
    useEffect(() => {
        if (condition !== 'rain' && condition !== 'snow' && condition !== 'storm') {
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, width, height);
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Particle System
        const particleCount = condition === 'storm' ? 1500 : condition === 'rain' ? 800 : 400; // Snow has fewer flakes
        const particles: {x: number, y: number, speed: number, length: number, opacity: number}[] = [];

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                speed: (Math.random() * 5 + 5) + (windSpeed / 5), // Wind affects speed
                length: condition === 'snow' ? 2 : Math.random() * 20 + 10,
                opacity: Math.random() * 0.5 + 0.1
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            
            ctx.fillStyle = isDay ? 'rgba(255, 255, 255, 0.6)' : 'rgba(174, 194, 224, 0.4)';
            ctx.strokeStyle = isDay ? 'rgba(200, 200, 255, 0.6)' : 'rgba(100, 120, 180, 0.4)';
            ctx.lineWidth = condition === 'snow' ? 2 : 1;

            particles.forEach(p => {
                p.y += p.speed;
                p.x += (windSpeed / 2); // Wind X movement

                if (p.y > height) {
                    p.y = -p.length;
                    p.x = Math.random() * width;
                }
                if (p.x > width) p.x = 0;
                if (p.x < 0) p.x = width;

                ctx.beginPath();
                if (condition === 'snow') {
                     ctx.arc(p.x, p.y, p.length, 0, Math.PI * 2);
                     ctx.fill();
                } else {
                     ctx.moveTo(p.x, p.y);
                     ctx.lineTo(p.x - (windSpeed/4), p.y + p.length);
                     ctx.stroke();
                }
            });

            // Lightning Effect
            if (condition === 'storm' && Math.random() > 0.98) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(0, 0, width, height);
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [condition, isDay, windSpeed, width, height]);


    // --- CLOUDS (SVG Generation) ---
    const clouds = useMemo(() => {
        if (cloudCover < 10) return [];

        // Reduce count slightly as these clouds are bigger/more complex
        const count = Math.max(3, Math.floor(cloudCover / 12)); 
        const generatedClouds = [];

        for (let i = 0; i < count; i++) {
            const scale = Math.random() * 1.2 + 0.8; // Bigger clouds
            const x = Math.random() * width;
            const y = Math.random() * height;
            const pathIndex = Math.floor(Math.random() * CLOUD_PATHS.length);
            const opacity = isDay ? (Math.random() * 0.2 + 0.8) : (Math.random() * 0.3 + 0.4); // More solid
            const duration = Math.random() * 60 + 60; // Slow movement

            generatedClouds.push(
                <g key={i} transform={`translate(${x}, ${y}) scale(${scale})`} opacity={opacity} className="cloud-anim">
                    {/* Shadow Layer for cartoon depth */}
                    <path 
                        d={CLOUD_PATHS[pathIndex]} 
                        fill={isDay ? "rgba(0,0,0,0.1)" : "rgba(0,0,0,0.3)"} 
                        transform="translate(4, 4)" 
                    />
                    {/* Main Cloud Layer */}
                    <path 
                        d={CLOUD_PATHS[pathIndex]} 
                        fill={isDay ? "#FFFFFF" : "#4A5568"} 
                    />
                    <animateTransform 
                        attributeName="transform"
                        type="translate"
                        from={`${x} ${y}`}
                        to={`${x + (windSpeed * 10) + 100} ${y}`}
                        dur={`${duration}s`}
                        repeatCount="indefinite"
                        additive="sum"
                    />
                </g>
            );
        }
        return generatedClouds;
    }, [cloudCover, isDay, width, height, windSpeed]);

    return (
        <g pointerEvents="none">
            {/* Cloud Layer - No heavy blur, use Drop Shadow filter for crisp vector look */}
            {condition !== 'clear' && (
                <g filter="url(#cloud-shadow)">
                     {clouds}
                </g>
            )}
            
            {/* Canvas Layer for Rain/Snow using foreignObject to embed in SVG */}
            {(condition === 'rain' || condition === 'snow' || condition === 'storm') && (
                <foreignObject x="0" y="0" width={width} height={height}>
                    <canvas ref={canvasRef} width={width} height={height} style={{ width: '100%', height: '100%' }} />
                </foreignObject>
            )}

            <defs>
                {/* Subtle shadow to separate clouds from background, keeping edges sharp */}
                <filter id="cloud-shadow" x="-20%" y="-20%" width="140%" height="140%">
                     <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15"/>
                </filter>
            </defs>
        </g>
    );
};
