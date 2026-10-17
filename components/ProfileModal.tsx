import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  auth, 
  signOut, 
  updateUserProfileData,
  saveMapToFirestore,
  deleteMapFromFirestore,
  saveLayoutToFirestore,
  deleteLayoutFromFirestore,
  getAllUsersForAdmin
} from '../lib/firebase';
import { 
  User, 
  Mail, 
  Calendar, 
  Clock, 
  MapPin, 
  LogOut, 
  Layers, 
  BookOpen, 
  Sparkles, 
  Trash2, 
  Check, 
  X, 
  Sliders, 
  Shield, 
  RefreshCw, 
  Edit3, 
  Sun, 
  Moon, 
  Compass, 
  Save, 
  UserPlus,
  Users,
  Database,
  Activity,
  CreditCard
} from 'lucide-react';

export interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  userEmail: string;
  isAdmin: boolean;
  userPlan?: 'free' | 'monthly' | 'lifetime';
  natalDate?: string;
  natalTime?: string;
  natalLocationName?: string;
  onEditNatal?: () => void;
  onOpenAdminDashboard?: () => void;
  onLogout?: () => void;
  onSwitchAccount?: () => void;
  onOpenPaymentPlans?: () => void;
  savedMaps?: any[];
  onLoadMap?: (map: any) => void;
  onDeleteMap?: (id: string) => void;
  onSaveCurrentMap?: () => void;
  savedLayouts?: any[];
  onLoadLayout?: (layout: any) => void;
  onDeleteLayout?: (id: string) => void;
  onSaveCurrentLayout?: () => void;
  currentPreferences?: {
    theme: 'dark' | 'light';
    zodiacSystem: 'tropical' | 'sidereal';
    houseFormat: 'roman' | 'arabic';
    showAtmosphere: boolean;
    showNeedle: boolean;
    showConstellations: boolean;
    showStars: boolean;
  };
  onUpdatePreferences?: (prefs: any) => void;
  onUpdateUsername?: (newName: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  username,
  userEmail,
  isAdmin,
  userPlan = 'free',
  natalDate,
  natalTime,
  natalLocationName,
  onEditNatal = () => {},
  onOpenAdminDashboard,
  onLogout = () => {},
  onSwitchAccount = () => {},
  onOpenPaymentPlans,
  savedMaps = [],
  onLoadMap = (_map: any) => {},
  onDeleteMap = (_id: string) => {},
  onSaveCurrentMap = () => {},
  savedLayouts = [],
  onLoadLayout = (_layout: any) => {},
  onDeleteLayout = (_id: string) => {},
  onSaveCurrentLayout = () => {},
  currentPreferences,
  onUpdatePreferences,
  onUpdateUsername
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'maps' | 'layouts' | 'preferences' | 'admin'>('profile');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(username);
  const [isSavingName, setIsSavingName] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Garantir que a conta do desenvolvedor/admin tenha acesso imediato ao painel de administração
  const isUserAdmin = isAdmin || 
    userEmail?.toLowerCase() === 'rafael.cm333@gmail.com' || 
    auth.currentUser?.email?.toLowerCase() === 'rafael.cm333@gmail.com';

  useEffect(() => {
    setEditedName(username);
  }, [username]);

  useEffect(() => {
    if (activeTab === 'admin' && isUserAdmin) {
      setLoadingUsers(true);
      getAllUsersForAdmin()
        .then(users => {
          setAdminUsers(users);
        })
        .catch(console.error)
        .finally(() => setLoadingUsers(false));
    }
  }, [activeTab, isUserAdmin]);

  if (!isOpen) return null;

  const handleSaveName = async () => {
    if (!editedName.trim() || editedName === username) {
      setIsEditingName(false);
      return;
    }
    setIsSavingName(true);
    try {
      if (auth.currentUser) {
        await updateUserProfileData(auth.currentUser.uid, { displayName: editedName.trim() });
      }
      if (onUpdateUsername) {
        onUpdateUsername(editedName.trim());
      }
      setSaveSuccessMsg('Nome atualizado com sucesso!');
      setIsEditingName(false);
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to update username:', err);
    } finally {
      setIsSavingName(false);
    }
  };

  const filteredMaps = savedMaps.filter(map => 
    map.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    map.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLayouts = savedLayouts.filter(layout => 
    layout.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    layout.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-200">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/[0.02] rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative w-full max-w-5xl h-[92vh] max-h-[820px] rounded-[22px] bg-[#06060a]/98 border border-white/15 shadow-[0_25px_70px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.1)] flex flex-col overflow-hidden text-white font-manrope"
      >
        {/* Modal Top Header Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-white/10 bg-black/40 select-none">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-[#F5D98A] shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="font-manrope text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
                <span>Cronógrafo Sideral</span>
                <span className="text-xs font-normal text-white/40">| Painel da Conta</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-[10px] uppercase font-manrope font-bold px-2.5 py-0.5 rounded-full border tracking-wider ${
              isUserAdmin ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-white/10 text-white/70 border-white/15'
            }`}>
              {isUserAdmin ? 'Super Administrador' : 'Membro Ativo'}
            </span>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Sidebar Navigation + Main Panel */}
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          
          {/* Left Navigation Tabs */}
          <div className="w-full md:w-60 border-b md:border-b-0 md:border-r border-white/10 p-3 md:p-3.5 flex md:flex-col gap-1.5 shrink-0 bg-black/50 overflow-x-auto md:overflow-x-visible custom-scrollbar">
            
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 md:flex-none w-full px-3.5 py-2.5 rounded-xl flex items-center gap-3 transition-all duration-150 text-left font-manrope text-xs font-semibold tracking-wider ${
                activeTab === 'profile'
                  ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <User className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span>Perfil e Conta</span>
            </button>

            <button
              onClick={() => setActiveTab('maps')}
              className={`flex-1 md:flex-none w-full px-3.5 py-2.5 rounded-xl flex items-center gap-3 transition-all duration-150 text-left font-manrope text-xs font-semibold tracking-wider ${
                activeTab === 'maps'
                  ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span>Mapas Salvos</span>
              <span className="ml-auto text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-white/70 font-mono">
                {savedMaps.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('layouts')}
              className={`flex-1 md:flex-none w-full px-3.5 py-2.5 rounded-xl flex items-center gap-3 transition-all duration-150 text-left font-manrope text-xs font-semibold tracking-wider ${
                activeTab === 'layouts'
                  ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Layers className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span>Layouts HUD</span>
              <span className="ml-auto text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-white/70 font-mono">
                {savedLayouts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('preferences')}
              className={`flex-1 md:flex-none w-full px-3.5 py-2.5 rounded-xl flex items-center gap-3 transition-all duration-150 text-left font-manrope text-xs font-semibold tracking-wider ${
                activeTab === 'preferences'
                  ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Sliders className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span>Preferências</span>
            </button>

            {/* Tab de Administração garantida para o e-mail do admin */}
            {isUserAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex-1 md:flex-none w-full px-3.5 py-2.5 rounded-xl flex items-center gap-3 transition-all duration-150 text-left font-manrope text-xs font-semibold tracking-wider ${
                  activeTab === 'admin'
                    ? 'bg-white/15 text-[#F5D98A] border border-amber-500/40 shadow-sm'
                    : 'text-amber-300/80 hover:text-amber-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Shield className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span className="font-bold">Administração</span>
              </button>
            )}

            {/* Quick Actions (Logout / Switch) */}
            <div className="hidden md:flex flex-col gap-1.5 mt-auto pt-4 border-t border-white/10">
              <button
                onClick={onSwitchAccount}
                className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10 transition-colors text-xs font-manrope font-semibold"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#F5D98A]" />
                <span>Trocar de Conta</span>
              </button>

              <button
                onClick={onLogout}
                className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 text-red-300 hover:text-red-200 hover:bg-red-950/40 border border-red-500/20 transition-colors text-xs font-manrope font-semibold"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span>Deslogar</span>
              </button>
            </div>
          </div>

          {/* Right Main Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 md:p-8 bg-black/20">
            
            {/* Feedback Message */}
            {saveSuccessMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/30 text-emerald-200 text-xs font-manrope flex items-center gap-2 animate-in fade-in duration-200">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {/* ─── TAB 1: PERFIL & CONTA ─── */}
            {activeTab === 'profile' && (
              <div className="space-y-5 max-w-3xl animate-in fade-in duration-150">
                
                {/* User Card */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-xl font-bold text-white shadow-inner">
                      {username ? username.charAt(0).toUpperCase() : 'A'}
                    </div>

                    <div>
                      {isEditingName ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className="bg-black/60 border border-white/30 focus:border-[#D4AF37] rounded-lg px-3 py-1.5 text-sm font-manrope text-white outline-none"
                            placeholder="Seu nome"
                            autoFocus
                          />
                          <button
                            onClick={handleSaveName}
                            disabled={isSavingName}
                            className="p-1.5 rounded-lg bg-[#D4AF37] text-black font-bold hover:bg-[#F5D98A] transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditedName(username);
                              setIsEditingName(false);
                            }}
                            className="p-1.5 rounded-lg bg-white/10 text-white/60 hover:text-white transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3 className="font-manrope text-lg sm:text-xl font-bold text-white tracking-wide">
                            {username}
                          </h3>
                          <button
                            onClick={() => setIsEditingName(true)}
                            className="p-1 text-white/40 hover:text-[#D4AF37] transition-colors"
                            title="Editar nome"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <p className="font-manrope text-xs text-white/70 flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3 h-3 text-[#D4AF37]" />
                        <span>{userEmail || 'Usuário Autenticado'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end gap-1.5 w-full sm:w-auto">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-manrope font-bold uppercase tracking-widest border ${
                      isUserAdmin ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-white/10 text-white/70 border-white/15'
                    }`}>
                      {isUserAdmin ? 'Super Admin' : 'Membro Ativo'}
                    </span>
                    <span className="text-[10px] font-manrope text-white/40">
                      Motor Suíço de Efemérides
                    </span>
                  </div>
                </div>

                {/* Grid: Natal Chart & Access Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Natal Settings Card */}
                  <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-[10px] uppercase font-manrope font-bold tracking-widest text-white/60">
                          Mapa Natal Padrão
                        </label>
                        <Compass className="w-4 h-4 text-[#D4AF37]" />
                      </div>

                      <div className="space-y-2 text-xs font-manrope text-white/80">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-white/40" />
                          <span>Data: {natalDate ? new Date(natalDate).toLocaleDateString('pt-BR') : 'Não definida'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-white/40" />
                          <span>Hora: {natalTime || '12:00'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-white/40" />
                          <span className="truncate">Local: {natalLocationName || 'São Paulo, Brasil'}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        onEditNatal();
                      }}
                      className="mt-4 w-full py-2.5 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white text-xs font-manrope font-semibold tracking-wider transition-all"
                    >
                      Editar Dados Natais
                    </button>
                  </div>

                  {/* Account Management Card */}
                  <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-[10px] uppercase font-manrope font-bold tracking-widest text-white/60">
                          Gerenciamento de Acesso
                        </label>
                        <Shield className="w-4 h-4 text-[#D4AF37]" />
                      </div>

                      <p className="text-xs text-white/60 font-manrope leading-relaxed">
                        Sua sessão está sincronizada com a nuvem Firebase. Você pode alternar entre contas ou deslogar a qualquer momento.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <button
                        onClick={onSwitchAccount}
                        className="py-2.5 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white text-xs font-manrope font-semibold tracking-wider transition-all flex items-center justify-center gap-1.5"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-[#F5D98A]" />
                        <span>Trocar Conta</span>
                      </button>

                      <button
                        onClick={onLogout}
                        className="py-2.5 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/20 text-red-200 text-xs font-manrope font-semibold tracking-wider transition-all flex items-center justify-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5 text-red-400" />
                        <span>Deslogar</span>
                      </button>
                    </div>
                  </div>

                </div>

                {/* Planos de Acesso Card */}
                {onOpenPaymentPlans && (
                  <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-white mb-1">
                        <CreditCard className="w-4 h-4 text-[#D4AF37]" />
                        <h4 className="font-manrope font-bold text-sm text-white">Plano de Acesso</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isUserAdmin || userPlan === 'lifetime'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : userPlan === 'monthly'
                              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                              : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                        }`}>
                          {isUserAdmin ? 'Vitalício (Admin)' : userPlan === 'lifetime' ? 'Acesso Vitalício' : userPlan === 'monthly' ? 'Plano Mensal' : 'Plano Gratuito (2026)'}
                        </span>
                      </div>
                      <p className="font-manrope text-xs text-white/70">
                        {isUserAdmin || userPlan === 'lifetime'
                          ? 'Você possui acesso vitalício a todas as camadas, anos e exportações sem restrições.'
                          : userPlan === 'monthly'
                            ? 'Assinatura mensal ativa. Acesso liberado a todas as efemérides e anos.'
                            : 'Plano gratuito ativo com navegação fixada em 2026 e 1 exportação de teste com marca d\'água.'}
                      </p>

                      {!isUserAdmin && userPlan === 'free' && (
                        <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-manrope text-white/70">
                          <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5">
                            <span className="text-amber-400">🔒</span>
                            <span>Scrubber restrito a 2026 e início de 2027</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5">
                            <span className="text-amber-400">🔒</span>
                            <span>Controles de pontos lunares bloqueados</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5">
                            <span className="text-amber-400">🔒</span>
                            <span>Personalização e opções da sidebar bloqueadas</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5">
                            <span className="text-amber-400">🔒</span>
                            <span>Edição de orbes nos painéis bloqueada</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5">
                            <span className="text-amber-400">🔒</span>
                            <span>Calendário lunar desfocado fora do mês vigente</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5">
                            <span className="text-amber-400">🔒</span>
                            <span>Limite de até 2 mapas natais salvos</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        onOpenPaymentPlans();
                      }}
                      className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F5D98A] text-black font-manrope font-bold text-xs uppercase tracking-wider shrink-0 hover:opacity-90 transition-opacity shadow-md"
                    >
                      {isUserAdmin || userPlan === 'lifetime' ? 'Ver Planos' : 'Fazer Upgrade'}
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* ─── TAB 2: MAPAS SALVOS ─── */}
            {activeTab === 'maps' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                
                {/* Search & Actions Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-72">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filtrar mapas por nome..."
                      className="w-full bg-black/40 border border-white/15 focus:border-white/40 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 outline-none font-manrope"
                    />
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      onSaveCurrentMap();
                    }}
                    className="w-full sm:w-auto py-2 px-4 rounded-xl bg-white/15 hover:bg-white/20 border border-white/20 text-white text-xs font-manrope font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Salvar Mapa Atual</span>
                  </button>
                </div>

                {/* Grid of Saved Maps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {filteredMaps.map((map) => (
                    <div
                      key={map.id}
                      className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/25 transition-all duration-150 group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-manrope font-bold text-sm text-white group-hover:text-[#F5D98A] transition-colors">
                            {map.name}
                          </h4>
                          <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-white/10 text-white/70 font-mono shrink-0">
                            {map.targetDate ? new Date(map.targetDate).toLocaleDateString('pt-BR') : 'Sem data'}
                          </span>
                        </div>

                        {map.description && (
                          <p className="text-xs text-white/60 font-manrope mt-1.5 line-clamp-2">
                            {map.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 mt-3 border-t border-white/5">
                        <button
                          onClick={() => onLoadMap(map)}
                          className="text-xs font-manrope font-bold text-[#F5D98A] hover:underline flex items-center gap-1.5"
                        >
                          <span>Carregar no Cronógrafo</span>
                        </button>

                        <button
                          onClick={() => onDeleteMap(map.id)}
                          className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Excluir mapa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {filteredMaps.length === 0 && (
                    <div className="col-span-full py-12 text-center border border-dashed border-white/10 rounded-2xl p-6">
                      <BookOpen className="w-8 h-8 text-white/20 mx-auto mb-2" />
                      <p className="font-manrope text-sm text-white/60">Nenhum mapa salvo encontrado.</p>
                      <p className="font-manrope text-xs text-white/30 mt-1">Salve cartas astrais e trânsitos para acessar rapidamente.</p>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ─── TAB 3: LAYOUTS DE HUD UI SALVOS ─── */}
            {activeTab === 'layouts' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                
                {/* Search & Actions Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-72">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filtrar layouts por nome..."
                      className="w-full bg-black/40 border border-white/15 focus:border-white/40 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 outline-none font-manrope"
                    />
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      onSaveCurrentLayout();
                    }}
                    className="w-full sm:w-auto py-2 px-4 rounded-xl bg-white/15 hover:bg-white/20 border border-white/20 text-white text-xs font-manrope font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Salvar Layout Atual</span>
                  </button>
                </div>

                {/* Grid of Saved Layouts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {filteredLayouts.map((layout) => (
                    <div
                      key={layout.id}
                      className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/25 transition-all duration-150 group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-manrope font-bold text-sm text-white group-hover:text-[#F5D98A] transition-colors">
                            {layout.name}
                          </h4>
                          <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-white/10 text-white/70 font-mono shrink-0">
                            HUD Preset
                          </span>
                        </div>

                        {layout.description && (
                          <p className="text-xs text-white/60 font-manrope mt-1.5 line-clamp-2">
                            {layout.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 mt-3 border-t border-white/5">
                        <button
                          onClick={() => onLoadLayout(layout)}
                          className="text-xs font-manrope font-bold text-[#F5D98A] hover:underline flex items-center gap-1.5"
                        >
                          <span>Aplicar Layout</span>
                        </button>

                        <button
                          onClick={() => onDeleteLayout(layout.id)}
                          className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Excluir layout"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {filteredLayouts.length === 0 && (
                    <div className="col-span-full py-12 text-center border border-dashed border-white/10 rounded-2xl p-6">
                      <Layers className="w-8 h-8 text-white/20 mx-auto mb-2" />
                      <p className="font-manrope text-sm text-white/60">Nenhum layout salvo encontrado.</p>
                      <p className="font-manrope text-xs text-white/30 mt-1">Configure janelas, orbes e posições e salve sua interface.</p>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ─── TAB 4: PREFERÊNCIAS ─── */}
            {activeTab === 'preferences' && (
              <div className="space-y-4 max-w-3xl animate-in fade-in duration-150">
                
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                  <h4 className="font-manrope text-sm font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#D4AF37]" />
                    <span>Preferências Globais do Cronógrafo</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-manrope">
                    
                    {/* Theme Preference */}
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-white block">Tema da Interface</span>
                        <span className="text-white/50 text-[11px]">Modo Escuro / Claro</span>
                      </div>
                      <button
                        onClick={() => {
                          if (onUpdatePreferences && currentPreferences) {
                            onUpdatePreferences({ theme: currentPreferences.theme === 'dark' ? 'light' : 'dark' });
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center gap-1.5 transition-colors border border-white/10"
                      >
                        {currentPreferences?.theme === 'dark' ? <Moon className="w-3.5 h-3.5 text-white" /> : <Sun className="w-3.5 h-3.5 text-[#D4AF37]" />}
                        <span>{currentPreferences?.theme === 'dark' ? 'Escuro' : 'Claro'}</span>
                      </button>
                    </div>

                    {/* Zodiac System */}
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-white block">Sistema Zodiacal</span>
                        <span className="text-white/50 text-[11px]">Tropical vs Sideral</span>
                      </div>
                      <button
                        onClick={() => {
                          if (onUpdatePreferences && currentPreferences) {
                            onUpdatePreferences({ zodiacSystem: currentPreferences.zodiacSystem === 'tropical' ? 'sidereal' : 'tropical' });
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center gap-1.5 transition-colors uppercase text-[11px] border border-white/10"
                      >
                        <Compass className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>{currentPreferences?.zodiacSystem || 'tropical'}</span>
                      </button>
                    </div>

                    {/* Atmosphere */}
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-white block">Atmosfera Diurna/Noturna</span>
                        <span className="text-white/50 text-[11px]">Gradiente e iluminação solar</span>
                      </div>
                      <button
                        onClick={() => {
                          if (onUpdatePreferences && currentPreferences) {
                            onUpdatePreferences({ showAtmosphere: !currentPreferences.showAtmosphere });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg font-semibold text-[11px] transition-colors ${
                          currentPreferences?.showAtmosphere ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40' : 'bg-white/10 text-white/60 border border-white/10'
                        }`}
                      >
                        {currentPreferences?.showAtmosphere ? 'Ativado' : 'Desativado'}
                      </button>
                    </div>

                    {/* Constellations */}
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-white block">Constelações em SVG</span>
                        <span className="text-white/50 text-[11px]">Linhas e estrelas celestes</span>
                      </div>
                      <button
                        onClick={() => {
                          if (onUpdatePreferences && currentPreferences) {
                            onUpdatePreferences({ showConstellations: !currentPreferences.showConstellations });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg font-semibold text-[11px] transition-colors ${
                          currentPreferences?.showConstellations ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40' : 'bg-white/10 text-white/60 border border-white/10'
                        }`}
                      >
                        {currentPreferences?.showConstellations ? 'Ativado' : 'Desativado'}
                      </button>
                    </div>

                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                  <div>
                    <h5 className="font-manrope text-sm font-bold text-white">Salvar como Padrão</h5>
                    <p className="font-manrope text-xs text-white/60 mt-0.5">Gravar o estado atual de janelas e ferramentas como seu padrão de inicialização.</p>
                  </div>

                  <button
                    onClick={() => {
                      onSaveCurrentLayout();
                      setSaveSuccessMsg('Layout salvo como padrão!');
                      setTimeout(() => setSaveSuccessMsg(''), 3000);
                    }}
                    className="py-2.5 px-4 rounded-xl bg-white/15 hover:bg-white/20 border border-white/20 text-white font-manrope font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
                  >
                    Gravar Padrão
                  </button>
                </div>

              </div>
            )}

            {/* ─── TAB 5: ADMIN (Se isUserAdmin) ─── */}
            {activeTab === 'admin' && isUserAdmin && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-white/60">Base de Dados</span>
                    <h3 className="text-base font-bold font-manrope text-white mt-1">Firebase Firestore</h3>
                    <p className="text-[11px] text-white/50 font-mono mt-0.5">ai-studio-v31cronografosid-9ecaf4be</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/15">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300">Nível de Permissão</span>
                    <h3 className="text-base font-bold font-manrope text-white mt-1">Super Administrador</h3>
                    <p className="text-[11px] text-amber-300 font-mono mt-0.5">Rafael.cm333@gmail.com</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-white/60">Total de Usuários</span>
                    <h3 className="text-base font-bold font-manrope text-white mt-1">{adminUsers.length} Cadastros</h3>
                    <p className="text-[11px] text-white/50 font-manrope mt-0.5">Sincronizados em tempo real</p>
                  </div>
                </div>

                {/* Header Actions for Admin */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-amber-400" />
                    <div>
                      <h4 className="font-manrope font-bold text-sm text-white">Painel Administrativo Completo</h4>
                      <p className="font-manrope text-xs text-white/70">Visualização expandida com métricas de sistema, filtros em tempo real e exportação de relatórios.</p>
                    </div>
                  </div>
                  {onOpenAdminDashboard && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenAdminDashboard();
                      }}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-manrope font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
                    >
                      Abrir Painel Admin
                    </button>
                  )}
                </div>

                {/* Painel: Onde visualizar os Logins no Firebase Console */}
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                  <div className="flex items-center gap-2 text-white">
                    <Database className="w-4 h-4 text-[#D4AF37]" />
                    <h4 className="font-manrope font-bold text-sm text-white">Onde consultar todos os logins no Firebase:</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-white/80 font-manrope">
                    <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-1">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>1. Firebase Authentication:</span>
                      </div>
                      <p className="text-[11px] text-white/70 leading-relaxed">
                        No console do Firebase &rarr; <strong>Authentication &rarr; Users</strong>. Lá constam todos os e-mails registrados, provedores, ID do usuário (UID) e data de criação/último login oficial do Google/Email.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-1">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>2. Firestore Database (/users):</span>
                      </div>
                      <p className="text-[11px] text-white/70 leading-relaxed">
                        No console do Firebase &rarr; <strong>Firestore Database &rarr; Coleção `users`</strong>. Cada documento contém <code>lastLoginAt</code>, <code>loginCount</code>, <code>trialUsedToday</code> e mapas/layouts salvos.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tabela de Usuários e Logins em Tempo Real */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#D4AF37]" />
                      <h4 className="font-manrope font-bold text-sm text-white">Logins e Acessos Registrados no Cronógrafo</h4>
                    </div>
                    <button
                      onClick={() => {
                        setLoadingUsers(true);
                        getAllUsersForAdmin().then(setAdminUsers).finally(() => setLoadingUsers(false));
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white/80 text-xs font-manrope flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
                      <span>Atualizar Lista</span>
                    </button>
                  </div>

                  {loadingUsers ? (
                    <div className="py-10 text-center text-xs text-white/50 font-manrope">Carregando acessos do Firestore...</div>
                  ) : adminUsers.length === 0 ? (
                    <div className="p-6 text-center rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white/50 font-manrope">
                      Nenhum outro usuário registrado ainda.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/40">
                      <table className="w-full text-left text-xs text-white/90 font-manrope">
                        <thead className="bg-white/5 uppercase text-[10px] tracking-wider text-white/70 border-b border-white/10">
                          <tr>
                            <th className="py-3 px-4">Usuário</th>
                            <th className="py-3 px-4">E-mail</th>
                            <th className="py-3 px-4">Primeiro Acesso</th>
                            <th className="py-3 px-4">Último Login</th>
                            <th className="py-3 px-4 text-center">Nº Logins</th>
                            <th className="py-3 px-4 text-center">Teste Usado Hoje</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {adminUsers.map((u, idx) => (
                            <tr key={u.uid || idx} className="hover:bg-white/[0.04] transition-colors">
                              <td className="py-3 px-4 font-semibold text-white">
                                {u.displayName || 'Astrólogo'}
                                {(u.role === 'admin' || u.email?.toLowerCase() === 'rafael.cm333@gmail.com') && (
                                  <span className="ml-1.5 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-mono uppercase border border-amber-500/30">Admin</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-white/70 font-mono text-[11px]">{u.email}</td>
                              <td className="py-3 px-4 text-white/60">
                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-BR') : '—'}
                              </td>
                              <td className="py-3 px-4 text-emerald-300 font-medium">
                                {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('pt-BR') : '—'}
                              </td>
                              <td className="py-3 px-4 text-center font-bold text-white text-sm">
                                {u.loginCount || 1}
                              </td>
                              <td className="py-3 px-4 text-center font-mono text-xs text-white/80">
                                {u.trialUsedToday ? `${Math.floor(u.trialUsedToday / 60)}m ${u.trialUsedToday % 60}s` : '0m'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

      </motion.div>

    </div>
  );
};
