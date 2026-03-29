import React from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
    text: React.ReactNode;
    visible: boolean;
    x: number;
    y: number;
    className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ text, visible, x, y, className }) => {
    if (!visible || !text) return null;

    // Calculate position immediately
    const tooltipWidth = 220; // Approximate max width
    const tooltipHeight = 120; // Approximate max height

    let left = x + 15;
    let top = y + 15;

    if (typeof window !== 'undefined') {
        if (left + tooltipWidth > window.innerWidth) {
            left = x - tooltipWidth - 15;
        }
        if (top + tooltipHeight > window.innerHeight) {
            top = y - tooltipHeight - 15;
        }
    }

    return createPortal(
        <div 
            className={`fixed z-[10000] pointer-events-none bg-brand-surface/95 backdrop-blur-md border border-brand-border/20 text-brand-text px-3 py-2 rounded-lg shadow-xl text-xs font-manrope max-w-xs ${className || ''}`}
            style={{ 
                top, 
                left,
            }}
        >
            {text}
        </div>,
        document.body
    );
};
