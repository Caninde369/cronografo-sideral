import React from 'react';

export interface CelestialGlyphSvgProps {
  bodyId: string;
  size?: number;
  className?: string;
  color?: string;
  style?: React.CSSProperties;
}

export const CelestialGlyphSvg: React.FC<CelestialGlyphSvgProps> = ({
  bodyId,
  size = 18,
  className = '',
  color = 'currentColor',
  style = {},
}) => {
  const normalizedId = (bodyId || '').toLowerCase().trim();

  // Common SVG wrapper props
  const svgProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    className: `inline-block align-middle shrink-0 ${className}`,
    shapeRendering: 'geometricPrecision' as const,
    textRendering: 'geometricPrecision' as const,
    style: { color, shapeRendering: 'geometricPrecision', textRendering: 'geometricPrecision', overflow: 'visible', ...style },
  };

  switch (normalizedId) {
    case 'sun':
    case 'sol':
      return (
        <svg {...svgProps}>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      );

    case 'moon':
    case 'lua':
      return (
        <svg {...svgProps}>
          <path
            d="M14.5 4 C9.2 4 5 8.2 5 13.5 C5 18.8 9.2 23 14.5 23 C11.5 20.5 10 17 10 13.5 C10 10 11.5 6.5 14.5 4 Z"
            fill="currentColor"
          />
        </svg>
      );

    case 'mercury':
    case 'mercurio':
    case 'mercúrio':
      return (
        <svg {...svgProps}>
          {/* Horns */}
          <path
            d="M8 2.6 C8.6 5.6 15.4 5.6 16 2.6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Head circle */}
          <circle cx="12" cy="10.6" r="4" stroke="currentColor" strokeWidth="1.8" />
          {/* Stem */}
          <line x1="12" y1="14.6" x2="12" y2="21.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          {/* Crossbar */}
          <line x1="8.5" y1="18.2" x2="15.5" y2="18.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );

    case 'venus':
    case 'vênus':
      return (
        <svg {...svgProps}>
          {/* Circle */}
          <circle cx="12" cy="8.5" r="4.5" stroke="currentColor" strokeWidth="1.8" />
          {/* Stem */}
          <line x1="12" y1="13" x2="12" y2="21.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          {/* Crossbar */}
          <line x1="8.5" y1="17.2" x2="15.5" y2="17.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );

    case 'mars':
    case 'marte':
      return (
        <svg {...svgProps}>
          {/* Circle */}
          <circle cx="9.5" cy="14.5" r="4.6" stroke="currentColor" strokeWidth="1.8" />
          {/* Arrow stem */}
          <line x1="12.8" y1="11.2" x2="19.5" y2="4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          {/* Arrow head */}
          <path
            d="M14.5 4.5 H19.5 V9.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'jupiter':
    case 'júpiter':
      return (
        <svg {...svgProps}>
          {/* Crescent & arm */}
          <path
            d="M5.8 5.2 C9 5.2 10.6 7.2 10.2 9.8 C9.9 12 8.4 13.6 6.6 15 H18.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Vertical stem */}
          <line x1="15" y1="4.5" x2="15" y2="21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );

    case 'saturn':
    case 'saturno':
      return (
        <svg {...svgProps}>
          {/* Cross top */}
          <line x1="6" y1="5.2" x2="12.5" y2="5.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="9.2" y1="2.2" x2="9.2" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          {/* Lower loop */}
          <path
            d="M9.2 11 C10.2 9.3 12 8.6 13.6 8.6 C15.9 8.6 17.2 10.2 17.2 12 C17.2 14.4 14.8 15.8 14.8 18.2 C14.8 19.8 15.8 20.8 17.2 20.8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'uranus':
    case 'urano':
      return (
        <svg {...svgProps}>
          <circle cx="12" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.6" />
          <line x1="12" y1="15.5" x2="12" y2="3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="6" y1="8" x2="18" y2="8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="6" y1="3" x2="6" y2="13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="18" y1="3" x2="18" y2="13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );

    case 'neptune':
    case 'netuno':
      return (
        <svg {...svgProps}>
          <path
            d="M6 5.5 V10 C6 13.5 18 13.5 18 10 V5.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <line x1="12" y1="4" x2="12" y2="21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="8.5" y1="17" x2="15.5" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path
            d="M4.5 7.5 L6 5 L7.5 7.5 M16.5 7.5 L18 5 L19.5 7.5 M10.5 5.5 L12 3.5 L13.5 5.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'pluto':
    case 'plutão':
    case 'plutao':
      return (
        <svg {...svgProps}>
          <circle cx="12" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M7 10.5 C7 14 17 14 17 10.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <line x1="12" y1="12.5" x2="12" y2="21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="8.5" y1="17.5" x2="15.5" y2="17.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );

    case 'lilith':
      return (
        <svg {...svgProps}>
          <path
            d="M15 3.5 C11 3.5 8 6.5 8 10.5 C8 14.5 11 17.5 15 17.5 C12.5 15.5 11.5 13 11.5 10.5 C11.5 8 12.5 5.5 15 3.5 Z"
            fill="currentColor"
          />
          <line x1="10" y1="17" x2="10" y2="22.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="7" y1="20" x2="13" y2="20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );

    case 'northnode':
    case 'nodo norte':
      return (
        <svg {...svgProps}>
          <circle cx="7.5" cy="16.5" r="2.5" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="16.5" cy="16.5" r="2.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M7.5 14 C7.5 7.5 16.5 7.5 16.5 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );

    case 'southnode':
    case 'nodo sul':
      return (
        <svg {...svgProps}>
          <circle cx="7.5" cy="7.5" r="2.5" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="16.5" cy="7.5" r="2.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M7.5 10 C7.5 16.5 16.5 16.5 16.5 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );

    case 'chiron':
    case 'quíron':
    case 'quiron':
      return (
        <svg {...svgProps}>
          <circle cx="12" cy="17" r="3.5" stroke="currentColor" strokeWidth="1.6" />
          <line x1="12" y1="13.5" x2="12" y2="2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M12 8 L17.5 2.5 M12 8 L17.5 13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );

    case 'partoffortune':
    case 'roda da fortuna':
      return (
        <svg {...svgProps}>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
          <line x1="6.3" y1="6.3" x2="17.7" y2="17.7" stroke="currentColor" strokeWidth="1.6" />
          <line x1="17.7" y1="6.3" x2="6.3" y2="17.7" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );

    case 'ascendant':
      return (
        <svg {...svgProps}>
          <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="800" fill="currentColor" fontFamily="sans-serif">
            AC
          </text>
        </svg>
      );

    case 'midheaven':
      return (
        <svg {...svgProps}>
          <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="800" fill="currentColor" fontFamily="sans-serif">
            MC
          </text>
        </svg>
      );

    default:
      return (
        <svg {...svgProps}>
          <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
  }
};
