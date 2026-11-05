import React, { useState } from 'react';
import { Arcanum } from './tarot';

interface TarotCardProps {
  arcano: Arcanum;
  onClick?: () => void;
  highlight?: boolean;
  label?: string;
  numberOverride?: number | string;
}

export const toRoman = (num: number): string => {
  const map: Record<number, string> = {
    0: '0', 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX',
    10: 'X', 11: 'XI', 12: 'XII', 13: 'XIII', 14: 'XIV', 15: 'XV', 16: 'XVI', 17: 'XVII',
    18: 'XVIII', 19: 'XIX', 20: 'XX', 21: 'XXI'
  };
  return map[num] !== undefined ? map[num] : num.toString();
};

export const TarotCard: React.FC<TarotCardProps> = ({
  arcano,
  onClick,
  highlight = false,
  label,
  numberOverride
}) => {
  // Começa na imagem online: não há cartas locais em /cards no Cronógrafo
  const [stage, setStage] = useState<number>(1);
  const [loaded, setLoaded] = useState(false);

  const displayNum = numberOverride !== undefined ? numberOverride : arcano.id;
  const numAsInt = typeof displayNum === 'number' ? displayNum : parseInt(displayNum, 10) || 0;
  const romanNum = toRoman(Math.abs(numAsInt) % 22);

  const handleImgError = () => {
    setLoaded(false);
    setStage(prev => prev + 1);
  };

  const getActiveSrc = () => {
    if (stage === 0) return arcano.localPath;
    if (stage === 1) return arcano.image;
    if (stage === 2) return arcano.backupImage;
    return '';
  };

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col rounded-xl overflow-hidden transition-all duration-200 ${
        onClick ? 'cursor-pointer' : ''
      } ${
        highlight
          ? 'ring-2 ring-amber-400 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
          : 'border border-zinc-800 hover:border-amber-500/60 bg-zinc-950'
      }`}
    >
      {/* Top Header Label & Value */}
      {label && (
        <div className="bg-zinc-900/90 px-3 py-1.5 border-b border-zinc-800 flex items-center justify-between">
          <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-zinc-400">
            {label}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-playfair text-xl md:text-2xl font-black text-amber-300">
              {displayNum}
            </span>
            <span className="font-sans text-[10px] text-zinc-400 font-bold">
              ({romanNum})
            </span>
          </div>
        </div>
      )}

      {/* Card Image Canvas - FULL COLOR */}
      <div className="relative aspect-[2/3.1] w-full overflow-hidden bg-black flex items-center justify-center">
        {stage <= 2 ? (
          <>
            {!loaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 border border-zinc-900">
                <div className="w-5 h-5 border-2 border-zinc-800 border-t-amber-400 rounded-full animate-spin mb-1.5" />
                <span className="font-playfair text-2xl font-bold text-amber-500/50">
                  {romanNum}
                </span>
              </div>
            )}
            <img
              src={getActiveSrc()}
              alt={arcano.fullName}
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              loading="lazy"
              onLoad={() => setLoaded(true)}
              onError={handleImgError}
              className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                loaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </>
        ) : (
          /* Fallback Colored Vector Card */
          <div className="w-full h-full p-3 flex flex-col justify-between items-center text-center bg-zinc-950 border border-amber-500/30 relative">
            <div className="absolute inset-1.5 border border-amber-500/20 rounded pointer-events-none" />
            <div className="pt-1 z-10">
              <span className="font-playfair text-3xl font-black text-amber-300">
                {romanNum}
              </span>
            </div>
            <div className="my-auto z-10 flex flex-col items-center justify-center space-y-1">
              <div className="w-12 h-12 rounded-full border border-amber-500/40 flex items-center justify-center bg-amber-500/10">
                <span className="font-sans text-xs font-bold text-amber-300">✦</span>
              </div>
              <p className="font-playfair text-[11px] uppercase tracking-wider text-amber-200 font-bold max-w-[110px]">
                {arcano.name}
              </p>
            </div>
            <div className="pb-1 z-10">
              <span className="text-[8px] font-sans uppercase tracking-widest text-amber-400 px-2 py-0.5 rounded border border-amber-500/30 bg-black">
                {arcano.element}
              </span>
            </div>
          </div>
        )}

        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-black/10" />
      </div>

      {/* Card Footer Banner */}
      <div className="px-2.5 py-1.5 bg-black border-t border-zinc-800 flex items-center justify-between">
        <span className="font-sans text-[11px] font-bold text-zinc-200 truncate group-hover:text-amber-300 transition-colors">
          {arcano.name}
        </span>
        <span className="font-playfair text-sm font-bold text-amber-400 ml-1 shrink-0">
          #{arcano.id}
        </span>
      </div>
    </div>
  );
};
