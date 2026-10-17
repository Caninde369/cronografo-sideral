import React from 'react';

export const GlobalSvgDefs: React.FC = () => {
    return (
        <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
            <defs>
                <filter id="panel-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="1" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <radialGradient id="panel-grad-sun" cx="35%" cy="35%" r="65%"><stop offset="0%" stopColor="#FFFACD" /><stop offset="40%" stopColor="#FFD700" /><stop offset="100%" stopColor="#FF8C00" /></radialGradient>
                <radialGradient id="panel-grad-moon" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#F5F5F5" /><stop offset="50%" stopColor="#D3D3D3" /><stop offset="100%" stopColor="#808080" /></radialGradient>
                <radialGradient id="panel-grad-mercury" cx="40%" cy="40%" r="60%"><stop offset="0%" stopColor="#E0E0E0" /><stop offset="60%" stopColor="#A9A9A9" /><stop offset="100%" stopColor="#757575" /></radialGradient>
                <radialGradient id="panel-grad-venus" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#E9D5FF" /><stop offset="50%" stopColor="#C084FC" /><stop offset="100%" stopColor="#9333EA" /></radialGradient>
                <radialGradient id="panel-grad-mars" cx="35%" cy="35%" r="65%"><stop offset="0%" stopColor="#FF7F50" /><stop offset="60%" stopColor="#CD5C5C" /><stop offset="100%" stopColor="#8B0000" /></radialGradient>
                <linearGradient id="panel-grad-jupiter-stripes" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FFF8DC" /><stop offset="20%" stopColor="#CD853F" /><stop offset="40%" stopColor="#FFF8DC" /><stop offset="60%" stopColor="#D2691E" /><stop offset="80%" stopColor="#FFF8DC" /><stop offset="100%" stopColor="#CD853F" /></linearGradient>
                <radialGradient id="panel-grad-jupiter-overlay" cx="35%" cy="35%" r="70%"><stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4"/><stop offset="100%" stopColor="#000000" stopOpacity="0.2"/></radialGradient>
                <radialGradient id="panel-grad-saturn" cx="40%" cy="30%" r="70%"><stop offset="0%" stopColor="#F0E68C" /><stop offset="100%" stopColor="#DAA520" /></radialGradient>
                <radialGradient id="panel-grad-uranus" cx="35%" cy="35%" r="65%"><stop offset="0%" stopColor="#AFEEEE" /><stop offset="100%" stopColor="#00CED1" /></radialGradient>
                <radialGradient id="panel-grad-neptune" cx="35%" cy="35%" r="65%"><stop offset="0%" stopColor="#4169E1" /><stop offset="100%" stopColor="#00008B" /></radialGradient>
                <radialGradient id="panel-grad-pluto" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#8B0000" /><stop offset="50%" stopColor="#708090" /><stop offset="100%" stopColor="#2F4F4F" /></radialGradient>
                
                <radialGradient id="panel-grad-northNode" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#E0FFFF" /><stop offset="100%" stopColor="#00CED1" /></radialGradient>
                <radialGradient id="panel-grad-southNode" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#D2691E" /><stop offset="100%" stopColor="#8B4513" /></radialGradient>
                <radialGradient id="panel-grad-lilith" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#4B0082" /><stop offset="60%" stopColor="#000000" /><stop offset="100%" stopColor="#2e022e" /></radialGradient>
                <radialGradient id="panel-grad-chiron" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#90EE90" /><stop offset="100%" stopColor="#2E8B57" /></radialGradient>
                <radialGradient id="panel-grad-ceres" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#FFD700" /><stop offset="100%" stopColor="#556B2F" /></radialGradient>
                <radialGradient id="panel-grad-pallas" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#F0F8FF" /><stop offset="100%" stopColor="#4682B4" /></radialGradient>
                <radialGradient id="panel-grad-juno" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#FFB6C1" /><stop offset="100%" stopColor="#C71585" /></radialGradient>
                <radialGradient id="panel-grad-vesta" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#FFA500" /><stop offset="100%" stopColor="#FF4500" /></radialGradient>
                <radialGradient id="panel-grad-partOfFortune" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#FDE047" /><stop offset="100%" stopColor="#D97706" /></radialGradient>
            </defs>
        </svg>
    );
};
