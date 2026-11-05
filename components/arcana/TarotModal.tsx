import React from 'react';
import { Arcanum } from './tarot';
import { X, Sparkles, BookOpen } from 'lucide-react';

interface TarotModalProps {
  arcano: Arcanum | null;
  onClose: () => void;
  sourceContext?: string;
  sourceValue?: number;
}

export const TarotModal: React.FC<TarotModalProps> = ({
  arcano,
  onClose,
  sourceContext,
  sourceValue
}) => {
  if (!arcano) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-xl bg-zinc-950 border border-amber-500/40 rounded-2xl p-4 sm:p-6 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="btn-close-modal"
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-700 transition-all z-20"
          aria-label="Fechar"
        >
          <X size={18} />
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 items-center pt-6 sm:pt-0">
          {/* Card Image - Full Color */}
          <div className="relative aspect-[2/3.1] w-full max-w-[180px] sm:max-w-[220px] mx-auto rounded-xl overflow-hidden border border-amber-500/40 shadow-lg bg-black">
            <img
              src={arcano.image}
              alt={arcano.fullName}
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              className="w-full h-full object-cover"
              onError={(e) => {
                if (arcano.backupImage && e.currentTarget.src !== arcano.backupImage) {
                  e.currentTarget.src = arcano.backupImage;
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-2 inset-x-2 text-center">
              <span className="font-playfair text-3xl font-black text-amber-300 drop-shadow">
                {arcano.roman}
              </span>
            </div>
          </div>

          {/* Card Lore */}
          <div className="space-y-3">
            {sourceContext && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-zinc-900 border border-amber-500/30 text-amber-300 text-[10px] font-sans uppercase tracking-wider">
                <Sparkles size={11} className="text-amber-400" />
                <span>{sourceContext}: {sourceValue !== undefined ? sourceValue : arcano.id}</span>
              </div>
            )}

            <div>
              <div className="flex items-baseline gap-2">
                <h3 className="font-playfair text-xl font-bold text-white">
                  {arcano.name}
                </h3>
                <span className="font-playfair text-2xl font-black text-amber-400">
                  {arcano.roman}
                </span>
              </div>
              <p className="text-zinc-400 font-sans text-xs mt-0.5">
                {arcano.archetype} • {arcano.element}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-300 text-[10px] font-sans uppercase tracking-widest font-bold">
                <BookOpen size={12} /> Significado Arcano
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                {arcano.meaning}
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-sans uppercase tracking-widest text-zinc-400 block">
                Palavras-Chave
              </span>
              <div className="flex flex-wrap gap-1">
                {arcano.keywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-black border border-zinc-800 text-amber-200 text-[10px] font-medium font-sans"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] font-sans">
              <div className="p-2 rounded bg-black border border-zinc-800 text-center">
                <span className="text-zinc-500 block">Índice</span>
                <span className="font-playfair text-base font-bold text-amber-400">{arcano.id} / 21</span>
              </div>
              <div className="p-2 rounded bg-black border border-zinc-800 text-center">
                <span className="text-zinc-500 block">Elemento</span>
                <span className="font-sans text-xs font-bold text-zinc-300 truncate block mt-0.5">{arcano.element}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
