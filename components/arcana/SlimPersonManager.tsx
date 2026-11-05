import React, { useState, useRef, useEffect } from 'react';
import { calculatePersonalArcane } from './arcaneCalendar';
import { MAJOR_ARCANA } from './tarot';
import { toRoman } from './TarotCard';
import { Users, UserPlus, Check, X, Trash2, ChevronDown, Pencil } from 'lucide-react';

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
};

export interface Person {
  id: string;
  name: string;
  birthDate: string;
}

interface SlimPersonManagerProps {
  persons: Person[];
  selectedPersonId: string;
  onSelectPerson: (id: string) => void;
  onAddPerson: (name: string, birthDate: string) => void;
  onRemovePerson: (id: string) => void;
  onEditPerson?: (id: string, name: string, birthDate: string) => void;
}

export const SlimPersonManager: React.FC<SlimPersonManagerProps> = ({
  persons,
  selectedPersonId,
  onSelectPerson,
  onAddPerson,
  onRemovePerson,
  onEditPerson,
}) => {
  const [isOpenList, setIsOpenList] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBirth, setNewBirth] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editBirth, setEditBirth] = useState('');
  const [editErrorMsg, setEditErrorMsg] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  const activePerson = persons.find(p => p.id === selectedPersonId) || persons[0];
  const activePersonalArcane = activePerson ? calculatePersonalArcane(activePerson.birthDate) : 0;
  const activeArcanoObj = MAJOR_ARCANA[activePersonalArcane] || MAJOR_ARCANA[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpenList(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setErrorMsg('Informe o nome.');
      return;
    }
    if (!newBirth) {
      setErrorMsg('Selecione a data de nascimento.');
      return;
    }
    onAddPerson(newName.trim(), newBirth);
    setNewName('');
    setNewBirth('');
    setErrorMsg('');
    setIsAdding(false);
    setIsOpenList(false);
  };

  const handleStartEdit = (p: Person, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(p.id);
    setEditName(p.name);
    setEditBirth(p.birthDate);
    setEditErrorMsg('');
  };

  const handleSaveEdit = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editName.trim()) {
      setEditErrorMsg('Informe o nome.');
      return;
    }
    if (!editBirth) {
      setEditErrorMsg('Informe a data de nascimento.');
      return;
    }
    if (onEditPerson) {
      onEditPerson(id, editName.trim(), editBirth);
    }
    setEditingId(null);
    setEditErrorMsg('');
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditErrorMsg('');
  };

  return (
    <div className="relative z-30 flex items-center gap-2" ref={dropdownRef}>
      
      {/* Slim Main Consulente Switcher Button */}
      <button
        id="btn-consulentes-list-toggle"
        onClick={() => {
          setIsOpenList(!isOpenList);
          setIsAdding(false);
          setEditingId(null);
        }}
        className="flex items-center gap-1.5 sm:gap-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs transition-all text-left group"
        title="Ver lista de consulentes registrados"
      >
        <div className="flex items-center gap-1 text-zinc-400 group-hover:text-amber-400">
          <Users size={14} className="shrink-0" />
          <span className="text-[10px] font-sans uppercase tracking-wider font-bold hidden sm:inline">Consulente:</span>
        </div>

        <span className="font-sans font-bold text-white max-w-[100px] sm:max-w-[160px] truncate">
          {activePerson?.name || 'Nenhum'}
        </span>

        {/* Mini Personal Arcane Tag with Strategic Gold Accent */}
        <span className="px-1.5 py-0.5 rounded bg-black border border-amber-500/40 text-amber-300 font-sans text-[9px] font-bold shrink-0">
          {toRoman(activePersonalArcane)}
        </span>

        <ChevronDown size={14} className={`text-zinc-400 shrink-0 transition-transform ${isOpenList ? 'rotate-180' : ''}`} />
      </button>

      {/* Slim + NOVO Button with Gold Accent (UX/UI Primary Action Focal Point) */}
      <button
        id="btn-slim-add-person"
        onClick={() => {
          setIsAdding(true);
          setIsOpenList(true);
          setEditingId(null);
        }}
        className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-bold font-sans tracking-wider transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] shrink-0"
        title="Cadastrar nova pessoa"
      >
        <UserPlus size={13} />
        <span className="hidden xs:inline sm:inline">+ NOVO</span>
        <span className="inline xs:hidden sm:hidden">+</span>
      </button>

      {/* Dropdown / Popover List */}
      {isOpenList && (
        <div className="absolute top-full right-0 sm:right-auto sm:left-0 mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-96 bg-zinc-950 border border-amber-500/40 rounded-xl p-3 shadow-2xl shadow-black/90 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
          
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
            <span className="text-[10px] font-sans uppercase tracking-widest text-zinc-400 font-bold flex items-center gap-1.5">
              <Users size={13} /> Consulentes Registrados ({persons.length})
            </span>
            <button
              onClick={() => {
                setIsAdding(!isAdding);
                setEditingId(null);
                setErrorMsg('');
              }}
              className="text-[10px] font-sans font-bold text-amber-400 hover:underline flex items-center gap-1"
            >
              {isAdding ? <X size={12} /> : <UserPlus size={12} />}
              {isAdding ? 'Fechar Cadastro' : '+ Cadastrar'}
            </button>
          </div>

          {/* Inline Add Form */}
          {isAdding && (
            <form onSubmit={handleQuickAdd} className="bg-zinc-900 border border-amber-500/30 rounded-lg p-2.5 mb-3 space-y-2">
              <div className="text-[10px] font-sans uppercase text-amber-300 font-bold">
                Novo Cadastro
              </div>
              <input
                id="input-inline-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome do consulente"
                className="w-full bg-black border border-zinc-700 focus:border-amber-400 rounded px-2.5 py-1 text-xs text-white placeholder-zinc-500 outline-none"
                autoFocus
              />
              <div className="flex gap-2">
                <input
                  id="input-inline-birth"
                  type="date"
                  value={newBirth}
                  onChange={(e) => setNewBirth(e.target.value)}
                  className="flex-1 bg-black border border-zinc-700 focus:border-amber-400 rounded px-2 py-1 text-xs text-white outline-none"
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 text-black px-3 py-1 rounded text-xs font-bold font-sans tracking-wider flex items-center gap-1 shadow"
                >
                  <Check size={13} /> Salvar
                </button>
              </div>
              {errorMsg && <p className="text-[10px] text-red-400">{errorMsg}</p>}
            </form>
          )}

          {/* List of Persons */}
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {persons.map((p) => {
              const isSelected = p.id === selectedPersonId;
              const isEditing = editingId === p.id;
              const pArcane = calculatePersonalArcane(p.birthDate);
              const arcObj = MAJOR_ARCANA[pArcane] || MAJOR_ARCANA[0];

              if (isEditing) {
                return (
                  <form
                    key={p.id}
                    onSubmit={(e) => handleSaveEdit(p.id, e)}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-zinc-900 border border-amber-500/50 rounded-lg p-2.5 space-y-2"
                  >
                    <div className="text-[10px] font-sans uppercase text-amber-400 font-bold flex items-center justify-between">
                      <span>Editar Consulente</span>
                      <span className="text-[9px] text-zinc-400 font-normal">ID: {p.id}</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-sans uppercase text-zinc-400 font-semibold block">Nome</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Nome do consulente"
                        className="w-full bg-black border border-zinc-700 focus:border-amber-400 rounded px-2.5 py-1 text-xs text-white outline-none font-sans"
                        autoFocus
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-sans uppercase text-zinc-400 font-semibold block">Data de Nascimento</label>
                      <input
                        type="date"
                        value={editBirth}
                        onChange={(e) => setEditBirth(e.target.value)}
                        className="w-full bg-black border border-zinc-700 focus:border-amber-400 rounded px-2.5 py-1 text-xs text-white outline-none font-sans"
                      />
                    </div>

                    {editErrorMsg && (
                      <p className="text-[10px] text-red-400 font-sans">{editErrorMsg}</p>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-sans font-medium flex items-center gap-1 transition-colors"
                      >
                        <X size={12} /> Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black text-xs font-sans font-bold flex items-center gap-1 shadow transition-colors"
                      >
                        <Check size={12} /> Salvar
                      </button>
                    </div>
                  </form>
                );
              }

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectPerson(p.id);
                    setIsOpenList(false);
                  }}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-zinc-900 border-amber-400 text-white shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                      : 'bg-zinc-900/40 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-600 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded bg-black border border-amber-500/30 flex items-center justify-center font-playfair font-black text-xs text-amber-300 shrink-0">
                      {toRoman(pArcane)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-sans font-bold text-white truncate">{p.name}</p>
                      <p className="text-[10px] text-zinc-400 font-sans">
                        {formatDate(p.birthDate)} • {arcObj.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    <button
                      onClick={(e) => handleStartEdit(p, e)}
                      className="p-1 text-zinc-400 hover:text-amber-400 hover:bg-black rounded transition-colors"
                      title={`Editar dados de ${p.name}`}
                    >
                      <Pencil size={13} />
                    </button>

                    {persons.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemovePerson(p.id);
                        }}
                        className="p-1 text-zinc-500 hover:text-red-400 hover:bg-black rounded transition-colors"
                        title={`Excluir ${p.name}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
};
