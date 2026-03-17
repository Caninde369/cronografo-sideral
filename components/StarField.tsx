import React, { useMemo } from 'react';

interface Star {
    x: number;
    y: number;
    size: number;
    opacity: number;
    twinkleDuration: number;
    delay: number;
}

export const StarField: React.FC<{ opacity?: number; className?: string }> = React.memo(({ opacity = 1, className = '' }) => {
    const stars = useMemo(() => {
        const count = 500; // More stars for full screen
        const generated: Star[] = [];
        for (let i = 0; i < count; i++) {
            generated.push({
                x: Math.random() * 100, // Percent
                y: Math.random() * 100, // Percent
                size: Math.random() * 1.5 + 0.5,
                opacity: Math.random() * 0.5 + 0.3,
                twinkleDuration: 0,
                delay: 0
            });
        }
        return generated;
    }, []);

    return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${className}`} style={{ opacity }}>
            <svg className="w-full h-full">
                {stars.map((star, i) => (
                    <circle 
                        key={i}
                        cx={`${star.x}%`}
                        cy={`${star.y}%`}
                        r={star.size}
                        fill="white"
                        fillOpacity={star.opacity}
                    />
                ))}
            </svg>
        </div>
    );
});
