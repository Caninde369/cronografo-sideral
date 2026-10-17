import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getAllUsersForAdmin, 
  subscribeToAllUsersForAdmin,
  updateUserPlanInFirestore 
} from '../lib/firebase';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string;
  isAdmin?: boolean;
}

export interface UserRecord {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role?: string;
  plan?: 'free' | 'monthly' | 'lifetime';
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
  lastLoginDate?: string;
  loginCount?: number;
  trialUsedToday?: number;
  totalActiveTimeSeconds?: number;
}

const ADMIN_EMAIL = 'rafael.cm333@gmail.com';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
  isAdmin = false
}) => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [activityFilter, setActivityFilter] = useState<'all' | 'today' | 'active'>('all');
  const [sortBy, setSortBy] = useState<'createdAt_desc' | 'createdAt_asc' | 'activeTime_desc' | 'lastLogin_desc' | 'loginCount_desc'>('createdAt_desc');
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Strict admin check
  const isAuthorizedAdmin = Boolean(
    isAdmin || 
    currentUserEmail?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllUsersForAdmin();
      setUsers(data as UserRecord[]);
      setLastRefreshedAt(new Date());
    } catch (err: any) {
      console.error('Error loading users in Admin Dashboard:', err);
      setError('Não foi possível carregar a lista de usuários. Verifique as permissões de administrador.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !isAuthorizedAdmin) return;

    fetchUsers();

    if (isAutoRefresh) {
      const unsubscribe = subscribeToAllUsersForAdmin(
        (updatedUsers) => {
          setUsers(updatedUsers as UserRecord[]);
          setLoading(false);
          setLastRefreshedAt(new Date());
        },
        (err) => {
          console.warn('Real-time updates failed, falling back to manual polling:', err);
        }
      );
      return () => unsubscribe();
    }
  }, [isOpen, isAuthorizedAdmin, isAutoRefresh]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Format active usage time: seconds to hours, minutes, seconds
  const formatActiveTime = (totalSeconds: number = 0) => {
    if (!totalSeconds || totalSeconds <= 0) return '0m 00s';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    if (hours > 0) {
      return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
    }
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  };

  // Format date helper with fallback
  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '—';
    }
  };

  // Format relative time helper
  const getRelativeTime = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      const diffMs = Date.now() - d.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return 'agora mesmo';
      if (diffMins < 60) return `há ${diffMins} min`;
      if (diffHours < 24) return `há ${diffHours}h`;
      if (diffDays === 1) return 'ontem';
      if (diffDays < 30) return `há ${diffDays} dias`;
      return `há ${Math.floor(diffDays / 30)} meses`;
    } catch {
      return '';
    }
  };

  // Key system aggregates
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const todayStr = new Date().toISOString().split('T')[0];
    
    let totalUsageSeconds = 0;
    let activeTodayCount = 0;
    let totalLogins = 0;

    users.forEach(u => {
      // Calculate active time: totalActiveTimeSeconds or fallback to trialUsedToday
      const userActiveSecs = (u.totalActiveTimeSeconds || 0) + (u.trialUsedToday || 0);
      totalUsageSeconds += userActiveSecs;

      if (u.lastLoginDate === todayStr || (u.trialUsedToday && u.trialUsedToday > 0)) {
        activeTodayCount++;
      }
      totalLogins += (u.loginCount || 1);
    });

    return {
      totalUsers,
      totalUsageSeconds,
      formattedTotalUsage: formatActiveTime(totalUsageSeconds),
      activeTodayCount,
      totalLogins
    };
  }, [users]);

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const query = searchQuery.trim().toLowerCase();

    return users
      .filter(u => {
        // Search filter
        if (query) {
          const name = (u.displayName || '').toLowerCase();
          const email = (u.email || '').toLowerCase();
          const uid = (u.uid || '').toLowerCase();
          if (!name.includes(query) && !email.includes(query) && !uid.includes(query)) {
            return false;
          }
        }

        // Role filter
        const isAdminUser = u.role === 'admin' || u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        if (roleFilter === 'admin' && !isAdminUser) return false;
        if (roleFilter === 'user' && isAdminUser) return false;

        // Activity filter
        if (activityFilter === 'today') {
          const isToday = u.lastLoginDate === todayStr || (u.trialUsedToday && u.trialUsedToday > 0);
          if (!isToday) return false;
        } else if (activityFilter === 'active') {
          const hasTime = (u.totalActiveTimeSeconds || 0) > 0 || (u.trialUsedToday || 0) > 0;
          if (!hasTime) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'createdAt_desc') {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
        if (sortBy === 'createdAt_asc') {
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        }
        if (sortBy === 'activeTime_desc') {
          const timeA = (a.totalActiveTimeSeconds || 0) + (a.trialUsedToday || 0);
          const timeB = (b.totalActiveTimeSeconds || 0) + (b.trialUsedToday || 0);
          return timeB - timeA;
        }
        if (sortBy === 'lastLogin_desc') {
          return new Date(b.lastLoginAt || 0).getTime() - new Date(a.lastLoginAt || 0).getTime();
        }
        if (sortBy === 'loginCount_desc') {
          return (b.loginCount || 1) - (a.loginCount || 1);
        }
        return 0;
      });
  }, [users, searchQuery, roleFilter, activityFilter, sortBy]);

  // Export to CSV
  const handleExportCSV = () => {
    if (users.length === 0) return;

    const headers = [
      'UID',
      'Nome',
      'Email',
      'Funcao',
      'Data Criacao',
      'Tempo Ativo Total (Segundos)',
      'Tempo Ativo Formatado',
      'Uso Teste Hoje (Segundos)',
      'Ultimo Login',
      'Qtd Logins'
    ];

    const rows = users.map(u => {
      const activeSecs = (u.totalActiveTimeSeconds || 0) + (u.trialUsedToday || 0);
      return [
        `"${u.uid || ''}"`,
        `"${u.displayName || 'Astrólogo'}"`,
        `"${u.email || ''}"`,
        `"${u.role === 'admin' || u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'Administrador' : 'Usuário'}"`,
        `"${u.createdAt || ''}"`,
        activeSecs,
        `"${formatActiveTime(activeSecs)}"`,
        u.trialUsedToday || 0,
        `"${u.lastLoginAt || ''}"`,
        u.loginCount || 1
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cronografo_usuarios_admin_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[12000] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-2xl select-none"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative w-full max-w-6xl h-[94vh] max-h-[880px] rounded-[24px] bg-[#06060a]/98 border border-white/15 shadow-[0_30px_90px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col overflow-hidden text-white font-manrope select-text"
        >
          {/* Top Super-Admin Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/50 select-none">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-700/30 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                <i className="ti ti-shield-lock text-xl" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    Painel Administrativo do Sistema
                  </h2>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
                    Acesso Exclusivo Super Admin
                  </span>
                </div>
                <p className="text-xs text-white/50 font-mono mt-0.5 flex items-center gap-2">
                  <span>Sessão: <strong className="text-amber-300">{ADMIN_EMAIL}</strong></span>
                  <span className="text-white/20">•</span>
                  <span>Última atualização: {lastRefreshedAt.toLocaleTimeString('pt-BR')}</span>
                </p>
              </div>
            </div>

            {/* Quick Actions & Close */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleExportCSV}
                disabled={users.length === 0}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-40 border border-white/15 text-xs font-semibold text-white flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                title="Exportar dados de usuários em formato CSV"
              >
                <i className="ti ti-download text-sm text-emerald-400" />
                <span className="hidden sm:inline">Exportar CSV</span>
              </button>

              <button
                type="button"
                onClick={fetchUsers}
                disabled={loading}
                className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                title="Sincronizar dados em tempo real do Firestore"
              >
                <i className={`ti ti-refresh text-sm ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Atualizar</span>
              </button>

              <div className="h-6 w-px bg-white/10 mx-1" />

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Fechar Painel Admin"
              >
                <i className="ti ti-x text-lg" />
              </button>
            </div>
          </div>

          {/* Access Guard (Security Check) */}
          {!isAuthorizedAdmin ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-black/60">
              <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mb-4 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                <i className="ti ti-lock-access text-3xl" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Acesso Restrito ao Administrador</h3>
              <p className="text-sm text-white/60 max-w-md mb-6 leading-relaxed">
                Este painel contém informações de auditoria e acesso de usuários restritas exclusivamente à conta mestre de administração (<code className="text-amber-300 font-mono">{ADMIN_EMAIL}</code>).
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  Voltar ao Cronógrafo
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar">
              
              {/* KPI Metrics Dashboard Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                
                {/* 1. Total de Usuários Cadastrados */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all">
                  <div className="absolute top-0 right-0 p-4 text-white/10 group-hover:text-white/20 transition-colors">
                    <i className="ti ti-users text-4xl" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 block mb-1">
                    Total de Usuários
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold text-white font-serif">
                      {loading ? '...' : stats.totalUsers}
                    </span>
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-0.5">
                      <i className="ti ti-check text-xs" /> Ativos
                    </span>
                  </div>
                  <p className="text-[11px] text-white/40 mt-1">Registrados no Firestore</p>
                </div>

                {/* 2. Tempo Total de Uso Ativo no Sistema */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-amber-500/30 relative overflow-hidden group hover:border-amber-500/50 transition-all bg-gradient-to-br from-amber-500/5 to-transparent">
                  <div className="absolute top-0 right-0 p-4 text-amber-500/10 group-hover:text-amber-500/20 transition-colors">
                    <i className="ti ti-clock-play text-4xl" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300/80 block mb-1">
                    Tempo Ativo Acumulado
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl font-bold text-amber-300 font-mono tracking-tight">
                      {loading ? '...' : stats.formattedTotalUsage}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-200/60 mt-1">Soma de todas as sessões</p>
                </div>

                {/* 3. Usuários Ativos Hoje */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-emerald-500/30 relative overflow-hidden group hover:border-emerald-500/50 transition-all bg-gradient-to-br from-emerald-500/5 to-transparent">
                  <div className="absolute top-0 right-0 p-4 text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors">
                    <i className="ti ti-activity text-4xl" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300/80 block mb-1">
                    Ativos Hoje
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold text-emerald-400 font-serif">
                      {loading ? '...' : stats.activeTodayCount}
                    </span>
                    <span className="text-xs text-white/50 font-normal">usuários</span>
                  </div>
                  <p className="text-[11px] text-emerald-200/60 mt-1">Acessaram o sistema hoje</p>
                </div>

                {/* 4. Total de Logins / Sessões */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-sky-500/30 relative overflow-hidden group hover:border-sky-500/50 transition-all bg-gradient-to-br from-sky-500/5 to-transparent">
                  <div className="absolute top-0 right-0 p-4 text-sky-500/10 group-hover:text-sky-500/20 transition-colors">
                    <i className="ti ti-login text-4xl" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-300/80 block mb-1">
                    Sessões / Logins Totais
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold text-sky-300 font-serif">
                      {loading ? '...' : stats.totalLogins}
                    </span>
                    <span className="text-xs text-white/50 font-normal">autenticações</span>
                  </div>
                  <p className="text-[11px] text-sky-200/60 mt-1">Registros de entrada</p>
                </div>

              </div>

              {/* Search & Filter Toolbar */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col md:flex-row gap-3 items-center justify-between">
                
                {/* Search input */}
                <div className="relative w-full md:w-80">
                  <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, e-mail ou UID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/40 outline-none focus:border-amber-500/50 transition-colors font-manrope"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs cursor-pointer"
                    >
                      <i className="ti ti-x" />
                    </button>
                  )}
                </div>

                {/* Filter Controls */}
                <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto flex-wrap justify-start md:justify-end">
                  
                  {/* Role filter */}
                  <div className="flex items-center rounded-xl bg-white/5 p-1 border border-white/10 text-xs">
                    <button
                      type="button"
                      onClick={() => setRoleFilter('all')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        roleFilter === 'all' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoleFilter('user')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        roleFilter === 'user' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Usuários
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoleFilter('admin')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        roleFilter === 'admin' ? 'bg-amber-500/20 text-amber-300' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Admins
                    </button>
                  </div>

                  {/* Activity Filter */}
                  <select
                    value={activityFilter}
                    onChange={(e) => setActivityFilter(e.target.value as any)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/90 outline-none focus:border-amber-500/50 cursor-pointer font-manrope"
                  >
                    <option value="all" className="bg-[#0e0e18] text-white">Status: Todos</option>
                    <option value="today" className="bg-[#0e0e18] text-white">Status: Ativos Hoje</option>
                    <option value="active" className="bg-[#0e0e18] text-white">Status: Com Uso Registrado</option>
                  </select>

                  {/* Sort by */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/90 outline-none focus:border-amber-500/50 cursor-pointer font-manrope"
                  >
                    <option value="createdAt_desc" className="bg-[#0e0e18] text-white">Data de Criação (Mais recente)</option>
                    <option value="createdAt_asc" className="bg-[#0e0e18] text-white">Data de Criação (Mais antigo)</option>
                    <option value="activeTime_desc" className="bg-[#0e0e18] text-white">Tempo de Uso Ativo (Maior)</option>
                    <option value="lastLogin_desc" className="bg-[#0e0e18] text-white">Último Acesso</option>
                    <option value="loginCount_desc" className="bg-[#0e0e18] text-white">Mais Logins</option>
                  </select>

                </div>

              </div>

              {/* Main Users Table Card */}
              <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden shadow-xl">
                
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <i className="ti ti-table text-amber-400 text-base" />
                    <h3 className="font-bold text-sm text-white font-manrope">
                      Lista de Usuários Registrados
                    </h3>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-mono ml-1">
                      {filteredUsers.length} {filteredUsers.length === 1 ? 'usuário' : 'usuários'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-white/50 font-manrope">
                    <span className="hidden sm:inline">Tempo real ativo</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                </div>

                {loading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3 text-white/50">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-400" />
                    <span className="text-xs font-manrope">Carregando usuários do Firebase Firestore...</span>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="py-16 text-center text-white/50 space-y-2">
                    <i className="ti ti-user-x text-3xl opacity-40" />
                    <p className="text-xs font-manrope">Nenhum usuário encontrado com os filtros atuais.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left text-xs text-white/90 font-manrope">
                      <thead className="bg-white/5 uppercase text-[10px] font-bold tracking-wider text-white/70 border-b border-white/10">
                        <tr>
                          <th className="py-3 px-4">Usuário</th>
                          <th className="py-3 px-4">E-mail</th>
                          <th className="py-3 px-4">Data de Criação</th>
                          <th className="py-3 px-4">Tempo Total de Uso Ativo</th>
                          <th className="py-3 px-4">Último Acesso</th>
                          <th className="py-3 px-4 text-center">Logins</th>
                          <th className="py-3 px-4 text-center">Plano de Acesso</th>
                          <th className="py-3 px-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredUsers.map((u, idx) => {
                          const isAdminUser = u.role === 'admin' || u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
                          const activeSeconds = (u.totalActiveTimeSeconds || 0) + (u.trialUsedToday || 0);
                          const isOnlineToday = u.lastLoginDate === new Date().toISOString().split('T')[0];
                          const plan = isAdminUser ? 'lifetime' : (u.plan || 'free');

                          return (
                            <tr 
                              key={u.uid || idx} 
                              className="hover:bg-white/[0.04] transition-colors group cursor-pointer"
                              onClick={() => setSelectedUser(u)}
                            >
                              {/* 1. Usuário & Avatar */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border ${
                                    isAdminUser 
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                      : 'bg-white/10 text-white/90 border-white/15'
                                  }`}>
                                    {u.displayName ? u.displayName.charAt(0).toUpperCase() : (u.email ? u.email.charAt(0).toUpperCase() : 'A')}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-semibold text-white truncate max-w-[140px]">
                                        {u.displayName || 'Astrólogo'}
                                      </span>
                                      {isOnlineToday && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Ativo hoje" />
                                      )}
                                    </div>
                                    <span className="text-[10px] text-white/40 font-mono truncate max-w-[130px]">
                                      ID: {u.uid ? u.uid.substring(0, 10) + '...' : '—'}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* 2. Email */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-1.5 font-mono text-[11px] text-white/80">
                                  <span>{u.email}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopy(u.email || '', `email-${u.uid}`);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-white transition-opacity p-0.5"
                                    title="Copiar e-mail"
                                  >
                                    <i className={`ti ${copiedId === `email-${u.uid}` ? 'ti-check text-emerald-400' : 'ti-copy'} text-xs`} />
                                  </button>
                                </div>
                              </td>

                              {/* 3. Data de Criação */}
                              <td className="py-3 px-4">
                                <div className="flex flex-col">
                                  <span className="font-medium text-white/90">
                                    {u.createdAt ? formatDate(u.createdAt) : '—'}
                                  </span>
                                  {u.createdAt && (
                                    <span className="text-[10px] text-white/40">
                                      {getRelativeTime(u.createdAt)}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* 4. Tempo Total de Uso Ativo */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <span className={`font-mono font-bold text-xs ${
                                    activeSeconds > 3600 
                                      ? 'text-amber-300' 
                                      : activeSeconds > 0 
                                        ? 'text-emerald-300' 
                                        : 'text-white/50'
                                  }`}>
                                    {formatActiveTime(activeSeconds)}
                                  </span>
                                </div>
                              </td>

                              {/* 5. Último Acesso */}
                              <td className="py-3 px-4">
                                <div className="flex flex-col">
                                  <span className="font-medium text-emerald-300">
                                    {u.lastLoginAt ? formatDate(u.lastLoginAt) : (u.createdAt ? formatDate(u.createdAt) : '—')}
                                  </span>
                                  {u.lastLoginAt && (
                                    <span className="text-[10px] text-white/40">
                                      {getRelativeTime(u.lastLoginAt)}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* 6. Nº de Logins */}
                              <td className="py-3 px-4 text-center">
                                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-white/10 text-white font-bold font-mono text-xs">
                                  {u.loginCount || 1}
                                </span>
                              </td>

                              {/* 7. Plano de Acesso */}
                              <td className="py-3 px-4 text-center">
                                {isAdminUser ? (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider">
                                    Vitalício (Admin)
                                  </span>
                                ) : plan === 'lifetime' ? (
                                  <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/25 to-yellow-500/25 text-amber-200 border border-amber-400/50 text-[10px] font-bold uppercase tracking-wider shadow-xs">
                                    Vitalício
                                  </span>
                                ) : plan === 'monthly' ? (
                                  <span className="px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 text-[10px] font-bold uppercase tracking-wider">
                                    Mensal
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px] font-semibold uppercase tracking-wider">
                                    Gratuito
                                  </span>
                                )}
                              </td>

                              {/* 8. Ações */}
                              <td className="py-3 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedUser(u);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white text-xs transition-colors"
                                  title="Inspecionar detalhes da conta"
                                >
                                  Ver Detalhes
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>

              {/* Infrastructure & Audit Footnote */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-white/60">
                <div className="flex items-center gap-2">
                  <i className="ti ti-database text-amber-400 text-sm" />
                  <span>
                    Conectado ao Firebase Firestore: <code className="text-white/80 font-mono">ai-studio-v31cronografosid-9ecaf4be-3fc3-4c29-a06b-4757a7ce0f63</code>
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-white/40">
                  <span>Regras de Segurança RBAC Ativas</span>
                  <span>•</span>
                  <span>Sincronização Bidirecional</span>
                </div>
              </div>

            </div>
          )}

          {/* User Detail Modal */}
          {selectedUser && (
            <div 
              className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
              onClick={() => setSelectedUser(null)}
            >
              <div 
                className="w-full max-w-lg rounded-2xl bg-[#111022] border border-white/20 p-6 shadow-2xl space-y-5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-300 text-base">
                      {selectedUser.displayName ? selectedUser.displayName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-white">{selectedUser.displayName || 'Astrólogo'}</h4>
                      <p className="text-xs text-white/50 font-mono">{selectedUser.email}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10"
                  >
                    <i className="ti ti-x text-base" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-white/40 block mb-1">UID do Firebase</span>
                    <div className="flex items-center justify-between font-mono text-white/80">
                      <span className="truncate mr-2">{selectedUser.uid}</span>
                      <button 
                        type="button" 
                        onClick={() => handleCopy(selectedUser.uid, 'modal-uid')}
                        className="text-white/40 hover:text-white shrink-0"
                      >
                        <i className={`ti ${copiedId === 'modal-uid' ? 'ti-check text-emerald-400' : 'ti-copy'}`} />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-white/40 block mb-1">Função no Sistema</span>
                    <span className={`font-bold uppercase ${selectedUser.role === 'admin' || selectedUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'text-amber-300' : 'text-white/80'}`}>
                      {selectedUser.role === 'admin' || selectedUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'Super Administrador' : 'Membro Padrão'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-white/40 block mb-1">Data de Cadastro</span>
                    <span className="font-medium text-white/90">{formatDate(selectedUser.createdAt)}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-white/40 block mb-1">Último Login</span>
                    <span className="font-medium text-emerald-300">{formatDate(selectedUser.lastLoginAt)}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-white/40 block mb-1">Tempo Ativo Total</span>
                    <span className="font-bold text-amber-300 font-mono text-sm">
                      {formatActiveTime((selectedUser.totalActiveTimeSeconds || 0) + (selectedUser.trialUsedToday || 0))}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-white/40 block mb-1">Total de Logins</span>
                    <span className="font-bold text-white font-mono text-sm">{selectedUser.loginCount || 1} acessos</span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/10 col-span-2">
                    <span className="text-[10px] uppercase font-bold text-white/40 block mb-1.5">Alterar Plano de Acesso do Usuário</span>
                    <div className="flex items-center gap-2">
                      {(['free', 'monthly', 'lifetime'] as const).map((pKey) => {
                        const isCurrent = (selectedUser.plan || 'free') === pKey;
                        const label = pKey === 'free' ? 'Plano Gratuito' : pKey === 'monthly' ? 'Plano Mensal' : 'Acesso Vitalício';
                        return (
                          <button
                            key={pKey}
                            type="button"
                            onClick={async () => {
                              await updateUserPlanInFirestore(selectedUser.uid, pKey);
                              setSelectedUser({ ...selectedUser, plan: pKey });
                              setUsers(prev => prev.map(u => u.uid === selectedUser.uid ? { ...u, plan: pKey } : u));
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                              isCurrent
                                ? pKey === 'lifetime'
                                  ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                                  : pKey === 'monthly'
                                    ? 'bg-yellow-500/20 border-yellow-400 text-yellow-200'
                                    : 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                                : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white"
                  >
                    Fechar Detalhes
                  </button>
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
