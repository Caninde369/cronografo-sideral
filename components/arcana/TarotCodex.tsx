import React, { useState } from 'react';
import { MAJOR_ARCANA, Arcanum } from './tarot';
import { TarotCard } from './TarotCard';
import { Search, Sparkles } from 'lucide-react';

interface TarotCodexProps {
  onSelectCard: (arcano: Arcanum) => void;
}

export const TarotCodex: React.FC<TarotCodexProps> = ({ onSelectCard }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedElement, setSelectedElement] = useState<string>('todos');

  const allCards = Object.values(MAJOR_ARCANA).sort((a, b) => a.id - b.id);

  const filteredCards = allCards.filter((card) => {
    const matchesSearch =
      card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.archetype.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.keywords.some((k) => k.toLowerCase().includes(searchTerm.toLowerCase())) ||
      card.id.toString() === searchTerm.trim() ||
      card.roman.toLowerCase() === searchTerm.trim().toLowerCase();

    const matchesElement =
      selectedElement === 'todos' ||
      card.element.toLowerCase().includes(selectedElement.toLowerCase());

    return matchesSearch && matchesElement;
  });

  return (
    <div className="h-full flex flex-col space-y-3 overflow-hidden font-sans">
      {/* Header & Controls */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-amber-400 shrink-0" />
          <h2 className="font-playfair text-sm sm:text-base font-bold text-white">
            Os 22 Arcanos Maiores (0–21)
          </h2>
          <span className="text-[10px] text-zinc-400 font-sans">
            ({filteredCards.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-initial">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar arcano..."
              className="w-full sm:w-48 bg-black border border-zinc-700 focus:border-amber-400 rounded-lg pl-7 pr-3 py-1.5 sm:py-1 text-xs text-white placeholder-zinc-500 outline-none font-sans"
            />
          </div>

          <select
            value={selectedElement}
            onChange={(e) => setSelectedElement(e.target.value)}
            className="bg-black border border-zinc-700 focus:border-amber-400 rounded-lg px-2.5 py-1.5 sm:py-1 text-xs text-white outline-none cursor-pointer font-sans shrink-0"
          >
            <option value="todos">Todos</option>
            <option value="fogo">Fogo</option>
            <option value="terra">Terra</option>
            <option value="ar">Ar</option>
            <option value="água">Água</option>
          </select>
        </div>
      </div>

      {/* Scrollable Grid of Cards inside the tab */}
      <div className="flex-1 overflow-y-auto pr-1 -webkit-overflow-scrolling-touch">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-2.5">
          {filteredCards.map((arcano) => (
            <div key={arcano.id} className="transition-transform hover:scale-[1.02]">
              <TarotCard
                arcano={arcano}
                label={`#${arcano.id}`}
                onClick={() => onSelectCard(arcano)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
