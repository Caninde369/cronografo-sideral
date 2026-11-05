import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateDetailedArcane, calculatePersonalArcane } from './arcaneCalendar';
import { MAJOR_ARCANA, Arcanum } from './tarot';
import { toRoman } from './TarotCard';
import { TarotModal } from './TarotModal';
import { SlimPersonManager, Person } from './SlimPersonManager';
import { TarotCodex } from './TarotCodex';
import { 
  Users, 
  House as Home, 
  Calendar as CalendarIcon, 
  Plus,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
  Layers,
  Sparkles,
  Quote,
  ChevronDown,
  X
} from 'lucide-react';

// Chaves próprias do Calendário Arcano. O "Resetar Dados" apaga SÓ estas
// (antes era localStorage.clear(), que apagaria também os dados do Cronógrafo).
const STORAGE_KEYS = {
  PERSONS: 'calendario_arcano_persons',
  READ_DATE: 'calendario_arcano_read_date',
  SELECTED_ID: 'calendario_arcano_selected_id',
  COMPARISON_IDS: 'calendario_arcano_comparison_ids'
};

// Começa sem consulentes: cada pessoa cadastra os seus (dados ficam só no navegador dela)
const DEFAULT_PERSONS: Person[] = [];

/** Data local no formato AAAA-MM-DD (toISOString usaria UTC e viraria o dia à noite no Brasil) */
const toLocalISODate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
};

export interface ArcaneCalendarAppProps {
  /** Data com que a calculadora abre (a data do relógio do Cronógrafo) */
  initialDate?: Date;
  /** Fecha o popup */
  onClose?: () => void;
}

const ArcaneCalendarApp: React.FC<ArcaneCalendarAppProps> = ({ initialDate, onClose }) => {
  const [activeTab, setActiveTab] = useState<'calculadora' | 'calendario' | 'mesa' | 'baralho'>('calculadora');
  
  const [persons, setPersons] = useState<Person[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PERSONS);
      return saved ? JSON.parse(saved) : DEFAULT_PERSONS;
    } catch {
      return DEFAULT_PERSONS;
    }
  });

  const [selectedPersonId, setSelectedPersonId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_ID) || '1';
  });

  const [comparisonIds, setComparisonIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COMPARISON_IDS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [readDate, setReadDate] = useState<string>(() => {
    if (initialDate && !isNaN(initialDate.getTime())) return toLocalISODate(initialDate);
    return localStorage.getItem(STORAGE_KEYS.READ_DATE) || toLocalISODate(new Date());
  });

  const [selectedModalCard, setSelectedModalCard] = useState<{
    arcano: Arcanum;
    context?: string;
    value?: number;
  } | null>(null);

  const todayCalendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PERSONS, JSON.stringify(persons));
  }, [persons]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_ID, selectedPersonId);
  }, [selectedPersonId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.READ_DATE, readDate);
  }, [readDate]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMPARISON_IDS, JSON.stringify(comparisonIds));
  }, [comparisonIds]);

  useEffect(() => {
    if (todayCalendarRef.current) {
      todayCalendarRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeTab]);

  const activePerson = useMemo(() => {
    const found = persons.find(p => p.id === selectedPersonId);
    return found || persons[0] || { id: '0', name: 'Consulente', birthDate: '2000-01-01' };
  }, [persons, selectedPersonId]);

  const res = useMemo(() => {
    return calculateDetailedArcane(activePerson.birthDate, readDate);
  }, [activePerson, readDate]);

  const personalArcaneId = useMemo(() => {
    return calculatePersonalArcane(activePerson.birthDate);
  }, [activePerson]);

  const personalArcanoObj = useMemo(() => {
    const index = ((personalArcaneId % 22) + 22) % 22;
    return MAJOR_ARCANA[index] || MAJOR_ARCANA[0];
  }, [personalArcaneId]);

  const getArcanoSafe = (id: number): Arcanum => {
    const index = ((Math.floor(id) % 22) + 22) % 22;
    return MAJOR_ARCANA[index] || MAJOR_ARCANA[0];
  };

  const handleAddPerson = (name: string, birthDate: string) => {
    const newPerson: Person = {
      id: Date.now().toString(),
      name,
      birthDate
    };
    setPersons(prev => [...prev, newPerson]);
    setSelectedPersonId(newPerson.id);
    if (!comparisonIds.includes(newPerson.id)) {
      setComparisonIds(prev => [...prev, newPerson.id]);
    }
  };

  const handleRemovePerson = (id: string) => {
    if (persons.length <= 1) return;
    const filtered = persons.filter(p => p.id !== id);
    setPersons(filtered);
    if (selectedPersonId === id) {
      setSelectedPersonId(filtered[0]?.id || '1');
    }
    setComparisonIds(prev => prev.filter(cid => cid !== id));
  };

  const handleEditPerson = (id: string, name: string, birthDate: string) => {
    setPersons(prev => prev.map(p => p.id === id ? { ...p, name, birthDate } : p));
  };

  const shiftDate = (days: number) => {
    const date = new Date(readDate + 'T00:00:00');
    date.setDate(date.getDate() + days);
    setReadDate(toLocalISODate(date));
  };

  const setDateToToday = () => {
    setReadDate(toLocalISODate(new Date()));
  };

  const resetArcaneData = () => {
    if (!window.confirm('Apagar todos os consulentes e dados do Calendário Arcano neste navegador?')) return;
    Object.values(STORAGE_KEYS).forEach(k => {
      try { localStorage.removeItem(k); } catch { /* ignora */ }
    });
    setPersons([]);
    setSelectedPersonId('');
    setComparisonIds([]);
    setReadDate(toLocalISODate(new Date()));
  };

  const hasPersons = persons.length > 0;

  const toggleComparisonPerson = (id: string) => {
    setComparisonIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const totalDays = res.totalDays;
  const cycleDays = 10648;
  const currentCycleDay = totalDays % cycleDays;
  const journeyProgress = Math.min(100, Math.max(0, (currentCycleDay / cycleDays) * 100));
  const daysRemainingInJourney = cycleDays - currentCycleDay;

  const scrollableCalendarMonths = useMemo(() => {
    const baseDate = new Date(readDate + 'T00:00:00');
    const monthsList = [];
    for (let offset = -4; offset <= 4; offset++) {
      const targetDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + offset, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();
      const monthName = targetDate.toLocaleDateString('pt-BR', { month: 'long' });
      
      const firstDay = new Date(year, month, 1).getDay();
      const lastDate = new Date(year, month + 1, 0).getDate();
      
      const days = [];
      for (let i = 0; i < firstDay; i++) days.push(null);
      for (let i = 1; i <= lastDate; i++) {
        const currentFullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const arcaneForDay = calculateDetailedArcane(activePerson.birthDate, currentFullDate);
        const isToday = i === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
        days.push({
          day: i,
          fullDate: currentFullDate,
          arcane: getArcanoSafe(arcaneForDay.dia),
          arcaneValue: arcaneForDay.dia,
          isToday,
          isSelected: currentFullDate === readDate
        });
      }
      monthsList.push({ key: `${year}-${month}`, monthName, year, days });
    }
    return monthsList;
  }, [readDate, activePerson]);

  const arcanePillars = [
    { label: 'JORNADA (CICLO)', val: res.jornada, arcano: getArcanoSafe(res.jornada) },
    { label: 'ANO ARCANO', val: res.ano, arcano: getArcanoSafe(res.ano) },
    { label: 'MÊS ARCANO', val: res.mes, arcano: getArcanoSafe(res.mes) },
    { label: 'DIA ARCANO', val: res.dia, arcano: getArcanoSafe(res.dia) }
  ];

  const renderCalendarContent = () => (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 pb-2 mb-2 border-b border-zinc-800 flex items-center justify-between">
        <span className="text-xs font-sans font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <CalendarIcon size={14} className="text-amber-400" /> Calendário
        </span>
        <span className="text-[10px] font-sans font-bold text-zinc-400">{formatDate(readDate)}</span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1 -webkit-overflow-scrolling-touch">
        {scrollableCalendarMonths.map((mObj) => (
          <div key={mObj.key} className="bg-black border border-zinc-900 rounded-xl p-2.5 shadow-inner">
            {/* Month header */}
            <div className="flex items-center justify-between mb-2 border-b border-zinc-900 pb-1.5 px-1">
              <h4 className="text-xs font-sans font-bold text-white capitalize">
                {mObj.monthName}
              </h4>
              <span className="text-xs font-playfair font-bold text-white">
                {mObj.year}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, idx) => (
                <div key={idx} className="text-center text-[8px] font-sans font-bold text-zinc-400 py-0.5">
                  {d}
                </div>
              ))}

              {mObj.days.map((d, i) => (
                <div
                  key={i}
                  ref={d?.isToday ? todayCalendarRef : null}
                  className={`min-h-[52px] sm:min-h-[62px] p-1 rounded-lg border transition-all flex flex-col justify-between relative overflow-hidden bg-cover bg-center ${
                    !d ? 'opacity-0 pointer-events-none' : 'cursor-pointer hover:border-amber-400 border-zinc-800/80 shadow'
                  } ${d?.isSelected ? 'border-amber-400 ring-2 ring-amber-400/80' : ''}`}
                  style={d ? { backgroundImage: `url(${d.arcane.image})` } : {}}
                  onClick={() => d && setReadDate(d.fullDate)}
                >
                  {d && <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40 pointer-events-none" />}

                  {d && (
                    <>
                      <div className="relative z-10 flex justify-between items-center text-[10px] font-sans">
                        <span className={d.isToday ? 'text-amber-300 font-bold underline drop-shadow-[0_1px_2px_rgba(0,0,0,1)]' : 'text-zinc-100 font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,1)]'}>
                          {d.day}
                        </span>
                      </div>
                      
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedModalCard({
                            arcano: d.arcane,
                            context: `Calendário: ${formatDate(d.fullDate)}`,
                            value: d.arcaneValue
                          });
                        }}
                        className="relative z-10 text-center py-0.5 cursor-pointer"
                      >
                        <span className="font-playfair text-base font-black text-white leading-none block drop-shadow-[0_1px_3px_rgba(0,0,0,1)] hover:text-amber-300 transition-colors">
                          {toRoman(d.arcaneValue)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-full w-full bg-black text-white font-sans selection:bg-amber-500 selection:text-black flex flex-col overflow-hidden">
      
      {/* 1. TOP HEADER - Responsive & Touch Optimized */}
      <header className="shrink-0 bg-black border-b border-zinc-800 px-3 sm:px-4 py-2 sm:py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-3">
          
          <div className="flex items-center justify-between">
            <h1 className="font-playfair text-base sm:text-lg font-bold tracking-tight text-white">
              Calendário Arcano
            </h1>

            {/* Mobile-only Consulente Switcher */}
            <div className="sm:hidden flex items-center gap-2">
              <SlimPersonManager
                persons={persons}
                selectedPersonId={selectedPersonId}
                onSelectPerson={setSelectedPersonId}
                onAddPerson={handleAddPerson}
                onRemovePerson={handleRemovePerson}
                onEditPerson={handleEditPerson}
              />
              {onClose && (
                <button onClick={onClose} aria-label="Fechar Calendário Arcano" title="Fechar"
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-700 transition-all shrink-0">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <nav className="flex items-center justify-center bg-zinc-900 rounded-lg p-0.5 border border-zinc-800 overflow-x-auto">
            {[
              { id: 'calculadora', label: 'INÍCIO', icon: Home },
              { id: 'calendario', label: 'CALENDÁRIO', icon: CalendarIcon, mobileOnly: true },
              { id: 'mesa', label: 'MESA', icon: Users },
              { id: 'baralho', label: 'BARALHO', icon: Layers }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-btn-${tab.id}`}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-md text-[11px] sm:text-xs font-sans font-bold tracking-wider transition-all shrink-0 ${
                    tab.mobileOnly ? 'lg:hidden' : ''
                  } ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Icon size={13} className="shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Desktop-only Consulente Switcher */}
          <div className="hidden sm:flex items-center gap-2">
            <SlimPersonManager
              persons={persons}
              selectedPersonId={selectedPersonId}
              onSelectPerson={setSelectedPersonId}
              onAddPerson={handleAddPerson}
              onRemovePerson={handleRemovePerson}
              onEditPerson={handleEditPerson}
            />
            {onClose && (
              <button onClick={onClose} aria-label="Fechar Calendário Arcano" title="Fechar (Esc)"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-700 transition-all shrink-0">
                <X size={16} />
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Estado vazio: nenhum consulente cadastrado */}
      {!hasPersons && (
        <main className="flex-1 min-h-0 flex items-center justify-center p-6">
          <div className="max-w-sm text-center bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <Sparkles size={22} className="text-amber-400 mx-auto mb-3" />
            <h2 className="font-playfair text-lg font-bold text-white mb-2">Cadastre o primeiro consulente</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Use o botão <strong className="text-amber-300">+ Novo</strong> no topo, com nome e data de nascimento,
              para calcular a jornada, o ano, o mês e o dia arcanos.
            </p>
            <p className="text-[10px] text-zinc-500 mt-3">Os consulentes ficam salvos só neste navegador.</p>
          </div>
        </main>
      )}

      {/* 2. MAIN WORKSPACE GRID - Dual Dock on Desktop, Smooth Full-View on Mobile */}
      {hasPersons && <main className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden max-w-7xl w-full mx-auto p-2.5 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">

        {/* LEFT DOCK (lg:col-span-8) */}
        <div className={`h-full flex flex-col min-h-0 gap-2.5 sm:gap-3 ${
          activeTab === 'calendario' ? 'hidden lg:flex lg:col-span-8' : 'lg:col-span-8'
        }`}>

          {/* ROW 2: Consulente Details Row */}
          <section className="shrink-0 bg-zinc-950 border border-zinc-800 rounded-2xl p-2 sm:px-3 sm:py-1.5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              
              {/* Consulente Selector + Arcano Badge */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
                <div className="w-6 h-8 rounded overflow-hidden border border-zinc-700 shrink-0 bg-black">
                  <img
                    src={personalArcanoObj.image}
                    alt=""
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      if (personalArcanoObj.backupImage && e.currentTarget.src !== personalArcanoObj.backupImage) {
                        e.currentTarget.src = personalArcanoObj.backupImage;
                      }
                    }}
                  />
                </div>

                <div className="relative shrink-0">
                  <select
                    value={selectedPersonId}
                    onChange={(e) => setSelectedPersonId(e.target.value)}
                    className="bg-zinc-900 text-white font-sans text-xs font-bold border border-zinc-700 hover:border-amber-400 rounded-lg px-2.5 py-1 pr-6 outline-none appearance-none cursor-pointer transition-colors max-w-[130px] sm:max-w-[180px] truncate"
                    title="Selecionar Consulente Ativo"
                  >
                    {persons.map((p) => (
                      <option key={p.id} value={p.id} className="bg-zinc-900 text-white">
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                </div>

                <span className="text-[10px] font-sans bg-zinc-900 text-zinc-300 px-2 py-1 rounded-lg border border-zinc-800 font-bold whitespace-nowrap shrink-0">
                  Arcano <span className="font-playfair text-amber-300">{toRoman(personalArcaneId)}</span> <span className="hidden xs:inline sm:inline">({personalArcanoObj.name})</span>
                </span>
              </div>

              {/* Stats pill inline */}
              <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-sans text-zinc-300 bg-zinc-900/80 border border-zinc-800 px-2.5 py-1 rounded-lg shrink-0">
                <span>Nasc: <strong className="text-white font-semibold">{formatDate(activePerson.birthDate)}</strong></span>
                <span className="text-zinc-700">•</span>
                <span>Dias: <strong className="text-amber-400 font-bold">{res.totalDays}d</strong></span>
                <span className="text-zinc-700">•</span>
                <span>Idade: <strong className="text-white font-semibold">{(res.totalDays/365.25).toFixed(1)}a</strong></span>
              </div>

            </div>
          </section>

          {/* ROW 3: Journey Progress Bar & Date Navigator Bar */}
          <section className="shrink-0 bg-zinc-950 border border-zinc-800 rounded-2xl p-2.5 sm:px-3.5 sm:py-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
              
              <div className="flex-1 min-w-0 bg-zinc-900/70 border border-zinc-800/80 rounded-xl px-2.5 sm:px-3 py-1.5 flex flex-col justify-center gap-1">
                <div className="flex justify-between items-center text-[10px] font-sans text-zinc-400">
                  <span className="truncate mr-1">Faltam <strong className="text-amber-400 font-bold">{daysRemainingInJourney}</strong> dias para completar jornada</span>
                  <span className="text-amber-400 font-sans font-bold shrink-0">{journeyProgress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-800">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${journeyProgress}%` }}
                  />
                </div>
              </div>

              {/* Time/Date Navigator */}
              <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 shrink-0">
                <div className="flex items-center gap-1.5 bg-zinc-900 border border-amber-500/30 px-2 sm:px-2.5 py-1 rounded-xl">
                  <CalendarIcon size={14} className="text-amber-400 shrink-0" />
                  <input
                    id="input-read-date"
                    type="date"
                    value={readDate}
                    onChange={(e) => setReadDate(e.target.value)}
                    className="bg-transparent text-white font-sans text-xs font-bold outline-none cursor-pointer w-[118px] sm:w-auto"
                  />
                </div>

                <div className="flex items-center gap-0.5 sm:gap-1 bg-zinc-900 border border-zinc-800 p-0.5 sm:p-1 rounded-xl">
                  <button 
                    onClick={() => shiftDate(-22)} 
                    title="-22 dias" 
                    className="p-1 hover:bg-zinc-800 text-zinc-300 rounded-lg transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
                  >
                    <ChevronsLeft size={13}/>
                  </button>
                  <button 
                    onClick={() => shiftDate(-1)} 
                    title="-1 dia" 
                    className="p-1 hover:bg-zinc-800 text-zinc-300 rounded-lg transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
                  >
                    <ChevronLeft size={13}/>
                  </button>
                  <button 
                    id="btn-date-today"
                    onClick={setDateToToday} 
                    className="px-2 py-0.5 text-[10px] font-sans font-bold bg-amber-500/25 hover:bg-amber-500/40 text-amber-300 border border-amber-500/40 rounded-lg transition-colors uppercase min-h-[28px] flex items-center"
                  >
                    HOJE
                  </button>
                  <button 
                    onClick={() => shiftDate(1)} 
                    title="+1 dia" 
                    className="p-1 hover:bg-zinc-800 text-zinc-300 rounded-lg transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
                  >
                    <ChevronRight size={13}/>
                  </button>
                  <button 
                    onClick={() => shiftDate(22)} 
                    title="+22 dias" 
                    className="p-1 hover:bg-zinc-800 text-zinc-300 rounded-lg transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
                  >
                    <ChevronsRight size={13}/>
                  </button>
                </div>
              </div>

            </div>
          </section>

          {/* ROW 4: Main Active Tab Content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {(activeTab === 'calculadora' || (activeTab === 'calendario' && window.innerWidth >= 1024)) && (
              <div className="h-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 overflow-y-auto pr-0.5 -webkit-overflow-scrolling-touch">
                {arcanePillars.map((pillar, idx) => (
                  <div
                    key={idx}
                    className="bg-zinc-950 border border-zinc-800 hover:border-amber-500/60 rounded-2xl p-3 flex flex-col justify-between transition-all group overflow-y-auto"
                  >
                    {/* Pillar Header */}
                    <div className="shrink-0 pb-1.5 mb-1.5 border-b border-zinc-800 flex items-start justify-between">
                      <div>
                        <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-zinc-400 block">
                          {pillar.label}
                        </span>
                        <span className="text-xs font-sans font-bold text-white block truncate max-w-[125px] mt-0.5">
                          {pillar.arcano.name}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1 shrink-0">
                        <span className="font-playfair text-2xl sm:text-3xl font-black text-amber-400 leading-none group-hover:text-amber-300 transition-colors">
                          {toRoman(pillar.val % 22)}
                        </span>
                        <span className="font-sans text-[10px] text-zinc-400 font-bold">
                          ({pillar.val})
                        </span>
                      </div>
                    </div>

                    {/* Fullscreen Tarot Card image inside block */}
                    <div 
                      onClick={() => setSelectedModalCard({
                        arcano: pillar.arcano,
                        context: pillar.label,
                        value: pillar.val
                      })}
                      className="w-full my-1.5 cursor-pointer shrink-0 rounded-xl overflow-hidden border border-zinc-800/80 hover:border-amber-500/50 transition-all shadow-xl group/card max-w-[200px] sm:max-w-none mx-auto"
                    >
                      <div className="w-full aspect-[2/3.2] overflow-hidden bg-black flex items-center justify-center">
                        <img
                          src={pillar.arcano.image}
                          alt={pillar.arcano.name}
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                          className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            if (pillar.arcano.backupImage && e.currentTarget.src !== pillar.arcano.backupImage) {
                              e.currentTarget.src = pillar.arcano.backupImage;
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Card Description Section */}
                    <div 
                      onClick={() => setSelectedModalCard({
                        arcano: pillar.arcano,
                        context: pillar.label,
                        value: pillar.val
                      })}
                      className="mt-1 bg-black/60 border border-zinc-900 hover:border-amber-500/40 rounded-xl p-2.5 space-y-2 cursor-pointer transition-all"
                    >
                      <div className="flex flex-wrap gap-x-2 gap-y-1 font-sans text-[11px] font-medium text-white tracking-tight">
                        {pillar.arcano.keywords.map((kw, kidx) => (
                          <span key={kidx} className="hover:text-amber-300 transition-colors">
                            #{kw}
                          </span>
                        ))}
                      </div>

                      {pillar.arcano.element && (
                        <div className="text-[9px] font-sans text-zinc-400 font-medium border-t border-zinc-900/80 pt-1">
                          {pillar.arcano.element}
                        </div>
                      )}

                      <div className="bg-zinc-900/80 border-l-2 border-zinc-600 p-2 rounded-r text-xs leading-relaxed font-sans text-white italic flex items-start gap-1.5 mt-1">
                        <Quote size={12} className="shrink-0 text-amber-400 mt-0.5" />
                        <span>"{pillar.arcano.advice}"</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'mesa' && (
              <div className="h-full flex flex-col space-y-3 overflow-hidden animate-in fade-in duration-200">
                <div className="shrink-0 bg-zinc-950 border border-zinc-800 rounded-xl p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 shadow">
                  <div className="flex items-center gap-2.5">
                    <Users size={18} className="text-amber-400 shrink-0" />
                    <div>
                      <h3 className="font-sans text-xs sm:text-sm font-bold text-white">Mesa de Sincronia Comparativa</h3>
                      <p className="text-[10px] text-zinc-400 font-sans">Comparando arcanos para a data: <span className="text-amber-300 font-bold">{formatDate(readDate)}</span></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                    <span className="text-[10px] text-zinc-400 font-sans mr-1 shrink-0">Exibir:</span>
                    {persons.map(p => {
                      const isChecked = comparisonIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => toggleComparisonPerson(p.id)}
                          className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-sans font-bold transition-all flex items-center gap-1.5 border shrink-0 ${
                            isChecked
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-600 border-amber-400 text-black shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {isChecked ? <UserCheck size={13}/> : <Plus size={13}/>}
                          <span>{p.name.split(' ')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 -webkit-overflow-scrolling-touch">
                  {comparisonIds.map(id => {
                    const p = persons.find(per => per.id === id);
                    if (!p) return null;
                    const dres = calculateDetailedArcane(p.birthDate, readDate);
                    const pArcId = calculatePersonalArcane(p.birthDate);
                    const pArcObj = MAJOR_ARCANA[((pArcId % 22) + 22) % 22];

                    return (
                      <div
                        key={id}
                        className="bg-zinc-950 border border-zinc-800 hover:border-amber-500/40 rounded-2xl p-3 sm:p-3.5 flex flex-col md:flex-row items-center gap-3 transition-all shadow-xl"
                      >
                        {/* Left: Consulente Summary Box */}
                        <div className="w-full md:w-52 shrink-0 flex items-center justify-between md:justify-start gap-3 border-b md:border-b-0 md:border-r border-zinc-800/80 pb-2.5 md:pb-0 md:pr-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div 
                              onClick={() => setSelectedModalCard({ arcano: pArcObj, context: `${p.name} - Arcano Pessoal`, value: pArcId })}
                              className="w-12 sm:w-14 h-18 sm:h-22 rounded-lg overflow-hidden border-2 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.35)] ring-1 ring-amber-300/40 shrink-0 bg-black cursor-pointer hover:scale-105 transition-transform"
                              title={`Arcano Pessoal: ${pArcObj.name}`}
                            >
                              <img
                                src={pArcObj.image}
                                alt={pArcObj.name}
                                referrerPolicy="no-referrer"
                                crossOrigin="anonymous"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  if (pArcObj.backupImage && e.currentTarget.src !== pArcObj.backupImage) {
                                    e.currentTarget.src = pArcObj.backupImage;
                                  }
                                }}
                              />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-sans text-xs sm:text-sm font-bold text-white leading-tight truncate">{p.name}</h4>
                              <span className="text-[10px] sm:text-[11px] text-amber-400 font-sans block mt-1 font-bold leading-tight">
                                Pessoal: <span className="font-playfair text-amber-300">{toRoman(pArcId)}</span>
                              </span>
                              <span className="text-[10px] text-zinc-300 font-sans font-medium block truncate mt-0.5">
                                {pArcObj.name}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => toggleComparisonPerson(id)}
                            className="md:hidden p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                            title="Remover da Mesa"
                          >
                            <Trash2 size={15}/>
                          </button>
                        </div>

                        {/* Right: 4 Pillars Cards */}
                        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 w-full min-w-0">
                          {[
                            { label: 'JORNADA', val: dres.jornada },
                            { label: 'ANO', val: dres.ano },
                            { label: 'MÊS', val: dres.mes },
                            { label: 'DIA', val: dres.dia }
                          ].map((item, i) => {
                            const arc = getArcanoSafe(item.val);
                            return (
                              <div
                                key={i}
                                onClick={() => setSelectedModalCard({ arcano: arc, context: `${p.name} - ${item.label}`, value: item.val })}
                                className="bg-zinc-900/90 border border-zinc-800 hover:border-amber-400 rounded-xl p-2 flex flex-col items-center justify-between cursor-pointer group/item transition-all shadow-md hover:shadow-amber-500/10 hover:bg-zinc-900 text-center relative overflow-hidden"
                              >
                                <span className="text-[9px] font-sans font-bold text-amber-400 uppercase tracking-wider mb-0.5 block">
                                  {item.label}
                                </span>

                                <div className="w-12 sm:w-16 h-18 sm:h-24 rounded-md overflow-hidden border border-zinc-700 group-hover/item:border-amber-400 shrink-0 bg-black shadow my-1">
                                  <img
                                    src={arc.image}
                                    alt={arc.name}
                                    referrerPolicy="no-referrer"
                                    crossOrigin="anonymous"
                                    className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                      if (arc.backupImage && e.currentTarget.src !== arc.backupImage) {
                                        e.currentTarget.src = arc.backupImage;
                                      }
                                    }}
                                  />
                                </div>

                                <div className="flex items-baseline justify-center gap-1">
                                  <span className="font-playfair text-sm sm:text-lg font-black text-amber-300 leading-none">
                                    {toRoman(item.val % 22)}
                                  </span>
                                  <span className="font-sans text-[10px] text-zinc-400 font-bold">({item.val})</span>
                                </div>

                                <span className="text-[10px] sm:text-xs font-sans font-bold text-white truncate w-full mt-0.5 leading-tight" title={arc.name}>
                                  {arc.name}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => toggleComparisonPerson(id)}
                          className="hidden md:block p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                          title="Remover da Mesa"
                        >
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'baralho' && (
              <TarotCodex onSelectCard={(arcano) => setSelectedModalCard({ arcano })} />
            )}
          </div>

        </div>

        {/* MOBILE CALENDÁRIO TAB (When user clicks CALENDÁRIO on mobile) */}
        {activeTab === 'calendario' && (
          <div className="lg:hidden h-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3 flex flex-col overflow-hidden shadow-2xl min-h-[500px]">
            {renderCalendarContent()}
          </div>
        )}

        {/* RIGHT DOCK (lg:col-span-4) - Desktop Dual Dock */}
        <div className="hidden lg:flex lg:col-span-4 h-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3 flex-col overflow-hidden shadow-2xl">
          {renderCalendarContent()}
        </div>

      </main>}

      {/* 3. SLIM FOOTER */}
      <footer className="shrink-0 bg-black border-t border-zinc-800 px-3 sm:px-4 py-1.5 text-[8px] sm:text-[9px] font-sans text-zinc-500 uppercase tracking-widest flex flex-col sm:flex-row justify-between items-center gap-1">
        <span>Calendário Arcano • Sincronia Base 22 • Indexação 0–21</span>
        <div className="flex items-center gap-3">
          <button
            onClick={resetArcaneData}
            className="hover:text-amber-400 transition-colors"
          >
            Resetar Dados
          </button>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>

      {/* Tarot Lore Modal */}
      <TarotModal
        arcano={selectedModalCard?.arcano || null}
        sourceContext={selectedModalCard?.context}
        sourceValue={selectedModalCard?.value}
        onClose={() => setSelectedModalCard(null)}
      />

    </div>
  );
};

export default ArcaneCalendarApp;
