/**
 * Painel de administração do Cronógrafo (só o Rafael).
 * Identidade da tela inicial: fundo #040004, títulos em Cormorant Garamond itálico,
 * texto em DM Sans, números em DM Mono, dourado só para o Fundador.
 *
 * - Indicadores no topo; busca e filtro por plano.
 * - Colunas ordenáveis em 3 estados (como planilha): 1º clique decrescente, 2º crescente, 3º ordem original.
 * - Clique na conta: detalhe com histórico de acessos (users/{uid}/sessions), plano, vencimento, anotação
 *   e bloquear/liberar. Ações sensíveis pedem confirmação.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  getAllUsersForAdmin,
  subscribeToAllUsersForAdmin,
  updateUserPlanInFirestore,
  setUserBlockedInFirestore,
  updateUserAdminMeta,
  getUserSessionsForAdmin,
  type UserSession,
} from '../lib/firebase';
import { PAYMENT_CONFIG } from '../lib/paymentConfig';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string;
  /** true = desenha no próprio lugar (dentro da janela de Conta), sem portal */
  inline?: boolean;
  isAdmin?: boolean;
}

export interface UserRecord {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role?: string;
  plan?: 'free' | 'monthly' | 'lifetime';
  billing?: 'monthly' | 'annual';
  planExpiresAt?: string;
  adminNote?: string;
  blocked?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
  lastLoginDate?: string;
  loginCount?: number;
  trialUsedToday?: number;
  totalActiveTimeSeconds?: number;
}

const ADMIN_EMAIL = 'rafael.cm333@gmail.com';
const HISTORY_START = '17/11/2026';
const EASE = [0.32, 0.72, 0, 1] as const;

type PlanView = 'free' | 'monthly' | 'annual' | 'lifetime';
type Filter = 'all' | PlanView | 'blocked' | 'expiring';
type SortKey = 'name' | 'plan' | 'created' | 'last' | 'count' | 'time';
type SortDir = 0 | 1 | 2; // 0 original · 1 decrescente · 2 crescente

const PLAN_LABEL: Record<PlanView, string> = { free: 'Grátis', monthly: 'Mensal', annual: 'Anual', lifetime: 'Fundador' };
const PLAN_ORDER: Record<PlanView, number> = { free: 0, monthly: 1, annual: 2, lifetime: 3 };

const isAdminRecord = (u: UserRecord) => u.role === 'admin' || u.email?.toLowerCase() === ADMIN_EMAIL;
const planView = (u: UserRecord): PlanView => {
  if (isAdminRecord(u) || u.plan === 'lifetime') return 'lifetime';
  if (u.plan === 'monthly') return u.billing === 'annual' ? 'annual' : 'monthly';
  return 'free';
};
const ts = (iso?: string) => { const t = iso ? new Date(iso).getTime() : 0; return isNaN(t) ? 0 : t; };
const secsOf = (u: UserRecord) => (u.totalActiveTimeSeconds || 0) + (u.trialUsedToday || 0);
const todayISO = () => new Date().toISOString().slice(0, 10);
const daysUntil = (ymd?: string) => {
  if (!ymd) return null;
  const d = new Date(`${ymd}T23:59:59`);
  if (isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
};
const addMonths = (n: number) => { const d = new Date(); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0, 10); };

const fmtDuration = (s = 0) => {
  if (!s || s < 60) return s > 0 ? `${Math.round(s)}s` : '0m';
  const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60);
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
};
const fmtDate = (iso?: string, withTime = true) => {
  const t = ts(iso);
  if (!t) return '—';
  const d = new Date(t);
  const date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  return withTime ? `${date} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : date;
};
const fmtYmd = (ymd?: string) => (ymd && /^\d{4}-\d{2}-\d{2}$/.test(ymd) ? `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}/${ymd.slice(0, 4)}` : '—');
const relTime = (iso?: string) => {
  const t = ts(iso);
  if (!t) return '';
  const mins = Math.floor((Date.now() - t) / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `há ${mins} min`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'ontem';
  if (d < 30) return `há ${d} dias`;
  return `há ${Math.floor(d / 30)} meses`;
};

// ── Confirmação ─────────────────────────────────────────────────────────────
interface ConfirmState { title: string; text: string; ok: string; danger?: boolean; run: () => Promise<void> | void }

const ConfirmDialog: React.FC<{ state: ConfirmState | null; onClose: () => void }> = ({ state, onClose }) => {
  const [busy, setBusy] = useState(false);
  useEffect(() => { setBusy(false); }, [state]);
  return (
    <AnimatePresence>
      {state && (
        <motion.div className="ad-confirm-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={e => { if (e.target === e.currentTarget && !busy) onClose(); }}>
          <motion.div role="alertdialog" aria-modal="true" aria-labelledby="ad-cf-t" className="ad-confirm"
            initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.3, ease: EASE }}>
            <i className={`ti ${state.danger ? 'ti-alert-triangle' : 'ti-help-circle'}`} style={{ fontSize: 28, color: state.danger ? '#FCA5A5' : '#B9B4BE' }} aria-hidden="true" />
            <h3 id="ad-cf-t" className="ad-serif" style={{ fontSize: 28, margin: '8px 0 0' }}>{state.title}</h3>
            <p style={{ color: '#B9B4BE', fontSize: 14, lineHeight: 1.55, margin: '10px 0 22px' }}>{state.text}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="ad-btn" onClick={onClose} disabled={busy} autoFocus>Cancelar</button>
              <button className={`ad-btn ${state.danger ? 'ad-btn-red' : 'ad-btn-solid'}`} disabled={busy}
                onClick={async () => { setBusy(true); try { await state.run(); } finally { onClose(); } }}>
                {busy ? 'Salvando…' : state.ok}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ── Cabeçalho ordenável ─────────────────────────────────────────────────────
const SortTh: React.FC<{ k: SortKey; label: string; sort: { key: SortKey | null; dir: SortDir }; onSort: (k: SortKey) => void; className?: string }> = ({ k, label, sort, onSort, className }) => {
  const active = sort.key === k && sort.dir !== 0;
  const icon = !active ? 'ti-arrows-sort' : sort.dir === 1 ? 'ti-arrow-down' : 'ti-arrow-up';
  const aria = !active ? 'none' : sort.dir === 1 ? 'descending' : 'ascending';
  return (
    <th className={`ad-th ${active ? 'is-on' : ''} ${className || ''}`} aria-sort={aria as any}>
      <button onClick={() => onSort(k)}>{label}<i className={`ti ${icon}`} aria-hidden="true" /></button>
    </th>
  );
};

// ── Painel ──────────────────────────────────────────────────────────────────
export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose, currentUserEmail, isAdmin = false, inline = false }) => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<{ key: SortKey | null; dir: SortDir }>({ key: null, dir: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<UserSession[] | null>(null);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [note, setNote] = useState('');
  const [expiry, setExpiry] = useState('');
  const [toast, setToast] = useState('');
  const [copied, setCopied] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState(new Date());

  const authorized = Boolean(isAdmin || currentUserEmail?.toLowerCase() === ADMIN_EMAIL);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      setUsers((await getAllUsersForAdmin()) as UserRecord[]);
      setRefreshedAt(new Date());
    } catch {
      setError('Não foi possível carregar as contas. Confira se você está com a conta de administrador.');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!isOpen || !authorized) return;
    load();
    const un = subscribeToAllUsersForAdmin(list => { setUsers(list as UserRecord[]); setLoading(false); setRefreshedAt(new Date()); });
    return () => un();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, authorized]);

  useEffect(() => {
    if (!isOpen) return;
    const k = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || confirm) return;
      if (selectedId) setSelectedId(null); else onClose();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [isOpen, selectedId, confirm, onClose]);

  const selected = useMemo(() => users.find(u => u.uid === selectedId) || null, [users, selectedId]);

  // Ao abrir uma conta: carrega o histórico e os campos editáveis
  useEffect(() => {
    if (!selectedId) return;
    setSessions(null); setShowAllSessions(false); setCopied(false);
    let alive = true;
    getUserSessionsForAdmin(selectedId, 200).then(list => { if (alive) setSessions(list); });
    return () => { alive = false; };
  }, [selectedId]);
  useEffect(() => {
    setNote(selected?.adminNote || '');
    setExpiry(selected?.planExpiresAt || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selected?.adminNote, selected?.planExpiresAt]);

  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2600); };
  const patchLocal = (uid: string, patch: Partial<UserRecord>) => setUsers(prev => prev.map(u => (u.uid === uid ? { ...u, ...patch } : u)));

  // ── Indicadores ──
  const stats = useMemo(() => {
    const now = Date.now(), week = 7 * 86400000, today = todayISO();
    let newWeek = 0, activeToday = 0, activeWeek = 0, monthly = 0, annual = 0, founders = 0, secs = 0, logins = 0, expiring = 0, blocked = 0;
    users.forEach(u => {
      if (isAdminRecord(u)) return;
      const pv = planView(u);
      if (now - ts(u.createdAt) < week) newWeek++;
      if (u.lastLoginDate === today) activeToday++;
      if (now - ts(u.lastLoginAt) < week) activeWeek++;
      if (pv === 'monthly') monthly++;
      if (pv === 'annual') annual++;
      if (pv === 'lifetime') founders++;
      if (u.blocked) blocked++;
      const s = secsOf(u);
      if (s > 0) { secs += s; logins += u.loginCount || 1; }
      const d = daysUntil(u.planExpiresAt);
      if ((pv === 'monthly' || pv === 'annual') && d !== null && d <= 7) expiring++;
    });
    const total = users.filter(u => !isAdminRecord(u)).length;
    return { total, newWeek, activeToday, activeWeek, monthly, annual, founders, avg: logins ? secs / logins : 0, expiring, blocked };
  }, [users]);

  // ── Lista ──
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = users
      .filter(u => {
        if (q && !`${u.displayName || ''} ${u.email || ''} ${u.uid}`.toLowerCase().includes(q)) return false;
        const pv = planView(u);
        if (filter === 'blocked') return !!u.blocked;
        if (filter === 'expiring') { const d = daysUntil(u.planExpiresAt); return (pv === 'monthly' || pv === 'annual') && d !== null && d <= 7; }
        if (filter !== 'all') return pv === filter && !isAdminRecord(u);
        return true;
      })
      // ordem original: contas mais novas primeiro
      .sort((a, b) => ts(b.createdAt) - ts(a.createdAt));
    if (!sort.key || sort.dir === 0) return base;
    const val = (u: UserRecord): number | string => {
      switch (sort.key) {
        case 'name': return (u.displayName || u.email || '').toLowerCase();
        case 'plan': return PLAN_ORDER[planView(u)];
        case 'created': return ts(u.createdAt);
        case 'last': return ts(u.lastLoginAt || u.createdAt);
        case 'count': return u.loginCount || 1;
        case 'time': return secsOf(u);
        default: return 0;
      }
    };
    return [...base].sort((a, b) => {
      const x = val(a), y = val(b);
      const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'pt-BR');
      return sort.dir === 1 ? -r : r;
    });
  }, [users, search, filter, sort]);

  const onSort = (k: SortKey) => setSort(s => (s.key !== k ? { key: k, dir: 1 } : { key: k, dir: ((s.dir + 1) % 3) as SortDir }));

  // ── Ações ──
  const askBlock = (u: UserRecord) => {
    const willBlock = !u.blocked;
    setConfirm({
      title: willBlock ? 'Bloquear esta conta?' : 'Liberar esta conta?',
      text: willBlock
        ? `${u.displayName || u.email} não vai conseguir entrar no Cronógrafo até você liberar de novo.`
        : `${u.displayName || u.email} volta a entrar no Cronógrafo, com o plano que já tinha.`,
      ok: willBlock ? 'Sim, bloquear' : 'Sim, liberar',
      danger: willBlock,
      run: async () => {
        const ok = await setUserBlockedInFirestore(u.uid, willBlock);
        if (ok) { patchLocal(u.uid, { blocked: willBlock }); flash(willBlock ? 'Conta bloqueada' : 'Conta liberada'); }
        else flash('Não deu para salvar. Confira as regras do Firebase.');
      },
    });
  };

  const askPlan = (u: UserRecord, target: PlanView) => {
    if (planView(u) === target) return;
    const plan: 'free' | 'monthly' | 'lifetime' = target === 'free' ? 'free' : target === 'lifetime' ? 'lifetime' : 'monthly';
    const billing = target === 'annual' ? 'annual' : 'monthly';
    const autoExpiry = target === 'monthly' ? addMonths(1) : target === 'annual' ? addMonths(12) : '';
    setConfirm({
      title: `Mudar para ${PLAN_LABEL[target]}?`,
      text: target === 'free'
        ? `${u.displayName || u.email} perde os recursos pagos e volta ao plano gratuito.`
        : target === 'lifetime'
          ? `${u.displayName || u.email} vira Fundador, com acesso vitalício. Isso ocupa uma das ${PAYMENT_CONFIG.lifetimeTotalSpots} vagas.`
          : `${u.displayName || u.email} passa ao plano ${PLAN_LABEL[target]}, com vencimento em ${fmtYmd(autoExpiry)} (você pode mudar a data depois).`,
      ok: 'Sim, mudar',
      danger: target === 'free',
      run: async () => {
        await updateUserPlanInFirestore(u.uid, plan);
        await updateUserAdminMeta(u.uid, { billing, planExpiresAt: autoExpiry });
        patchLocal(u.uid, { plan, billing, planExpiresAt: autoExpiry });
        setExpiry(autoExpiry);
        flash(`Plano alterado para ${PLAN_LABEL[target]}`);
      },
    });
  };

  const saveExpiry = async (u: UserRecord) => {
    if ((u.planExpiresAt || '') === expiry) return;
    const ok = await updateUserAdminMeta(u.uid, { planExpiresAt: expiry });
    if (ok) { patchLocal(u.uid, { planExpiresAt: expiry }); flash('Vencimento salvo'); }
  };
  const saveNote = async (u: UserRecord) => {
    if ((u.adminNote || '') === note) return;
    const ok = await updateUserAdminMeta(u.uid, { adminNote: note });
    if (ok) { patchLocal(u.uid, { adminNote: note }); flash('Anotação salva'); }
  };

  const exportCSV = () => {
    const head = ['UID', 'Nome', 'Email', 'Plano', 'Vencimento', 'Bloqueado', 'Criada em', 'Ultimo acesso', 'Acessos', 'Tempo total (s)', 'Tempo total', 'Anotacao'];
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = rows.map(u => [
      u.uid, u.displayName || '', u.email || '', PLAN_LABEL[planView(u)], u.planExpiresAt || '', u.blocked ? 'sim' : 'nao',
      u.createdAt || '', u.lastLoginAt || '', u.loginCount || 1, secsOf(u), fmtDuration(secsOf(u)), u.adminNote || '',
    ].map(esc).join(','));
    const blob = new Blob(['﻿' + [head.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cronografo_contas_${todayISO()}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  if (!isOpen) return null;

  const FILTERS: { id: Filter; label: string; count?: number }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'free', label: 'Grátis' },
    { id: 'monthly', label: 'Mensal' },
    { id: 'annual', label: 'Anual' },
    { id: 'lifetime', label: 'Fundador' },
    { id: 'expiring', label: 'Vencendo', count: stats.expiring },
    { id: 'blocked', label: 'Bloqueados', count: stats.blocked },
  ];

  const sessionList = sessions ? (showAllSessions ? sessions : sessions.slice(0, 8)) : [];

  const panel = (
    <div className="ad-root" role="dialog" aria-modal="true" aria-labelledby="ad-title">
      <style>{ADMIN_CSS}</style>

      <header className="ad-head">
        <div className="ad-brand">
          <span className="ad-logo-a">Cronógrafo</span><span className="ad-logo-b">SIDERAL</span>
          <span className="ad-head-sub">Administração</span>
        </div>
        <div className="ad-head-actions">
          <span className="ad-live"><span className="ad-dot" aria-hidden="true" /> ao vivo · {refreshedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          <button className="ad-btn" onClick={exportCSV} disabled={!rows.length}><i className="ti ti-download" aria-hidden="true" /> CSV</button>
          <button className="ad-icon" onClick={load} aria-label="Atualizar"><i className={`ti ti-refresh ${loading ? 'ad-spin' : ''}`} aria-hidden="true" /></button>
          <button className="ad-icon" onClick={onClose} aria-label="Fechar painel"><i className="ti ti-x" aria-hidden="true" /></button>
        </div>
      </header>

      {!authorized ? (
        <div className="ad-empty"><i className="ti ti-lock" aria-hidden="true" /> Acesso restrito ao administrador.</div>
      ) : (
        <main className="ad-main">
          <h1 id="ad-title" className="ad-serif ad-h1">Painel</h1>

          <section className="ad-kpis" aria-label="Indicadores">
            <div className="ad-kpi"><p>Contas</p><b className="ad-mono">{stats.total}</b><small className={stats.newWeek ? 'ad-up' : ''}>{stats.newWeek ? `+${stats.newWeek} na semana` : 'nenhuma nova na semana'}</small></div>
            <div className="ad-kpi"><p>Ativas hoje</p><b className="ad-mono">{stats.activeToday}</b><small>{stats.activeWeek} em 7 dias</small></div>
            <div className="ad-kpi"><p>Pagantes</p><b className="ad-mono">{stats.monthly + stats.annual}</b><small>{stats.monthly} mensal · {stats.annual} anual</small></div>
            <div className="ad-kpi ad-kpi-gold"><p>Fundadores</p><b className="ad-mono">{stats.founders}/{PAYMENT_CONFIG.lifetimeTotalSpots}</b><small>{Math.max(0, PAYMENT_CONFIG.lifetimeTotalSpots - stats.founders)} vagas</small></div>
            <div className="ad-kpi"><p>Tempo médio</p><b className="ad-mono">{fmtDuration(stats.avg)}</b><small>por acesso</small></div>
            <button className={`ad-kpi ad-kpi-btn ${stats.expiring ? 'ad-kpi-warn' : ''}`} onClick={() => setFilter(stats.expiring ? 'expiring' : 'all')}>
              <p>Vencem em 7 dias</p><b className="ad-mono">{stats.expiring}</b><small>{stats.expiring ? 'ver quem' : 'tudo em dia'}</small>
            </button>
          </section>

          <div className="ad-tools">
            <label className="ad-search">
              <i className="ti ti-search" aria-hidden="true" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar nome ou e-mail" aria-label="Buscar conta" />
              {search && <button onClick={() => setSearch('')} aria-label="Limpar busca"><i className="ti ti-x" aria-hidden="true" /></button>}
            </label>
            <div className="ad-seg" role="tablist" aria-label="Filtrar por plano">
              {FILTERS.map(f => (
                <button key={f.id} role="tab" aria-selected={filter === f.id} className={filter === f.id ? 'is-on' : ''} onClick={() => setFilter(f.id)}>
                  {f.label}{f.count ? <span className="ad-count">{f.count}</span> : null}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="ad-error"><i className="ti ti-alert-circle" aria-hidden="true" /> {error}</div>}

          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <SortTh k="name" label="Conta" sort={sort} onSort={onSort} />
                  <SortTh k="plan" label="Plano" sort={sort} onSort={onSort} />
                  <SortTh k="created" label="Criada em" sort={sort} onSort={onSort} className="ad-hide-md" />
                  <SortTh k="last" label="Último acesso" sort={sort} onSort={onSort} />
                  <SortTh k="count" label="Acessos" sort={sort} onSort={onSort} className="ad-num" />
                  <SortTh k="time" label="Tempo total" sort={sort} onSort={onSort} className="ad-num ad-hide-sm" />
                </tr>
              </thead>
              <tbody>
                {loading && !users.length ? (
                  <tr><td colSpan={6} className="ad-td-empty">Carregando contas…</td></tr>
                ) : !rows.length ? (
                  <tr><td colSpan={6} className="ad-td-empty">Nenhuma conta neste filtro.</td></tr>
                ) : rows.map(u => {
                  const pv = planView(u);
                  const d = daysUntil(u.planExpiresAt);
                  return (
                    <tr key={u.uid} className={`ad-row ${selectedId === u.uid ? 'is-on' : ''}`} onClick={() => setSelectedId(u.uid)}
                      tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') setSelectedId(u.uid); }}>
                      <td>
                        <div className="ad-user">
                          {u.photoURL ? <img src={u.photoURL} alt="" referrerPolicy="no-referrer" /> : <span className="ad-ava">{(u.displayName || u.email || '?').slice(0, 1).toUpperCase()}</span>}
                          <span><b>{u.displayName || 'Sem nome'}{isAdminRecord(u) && <em className="ad-admin-tag">admin</em>}</b><small>{u.email}</small></span>
                        </div>
                      </td>
                      <td>
                        {u.blocked
                          ? <span className="ad-chip ad-chip-red"><i className="ti ti-lock" aria-hidden="true" /> Bloqueado</span>
                          : <span className={`ad-chip ad-chip-${pv}`}>{PLAN_LABEL[pv]}</span>}
                        {(pv === 'monthly' || pv === 'annual') && d !== null && (
                          <small className={`ad-exp ${d <= 7 ? 'is-warn' : ''}`}>{d < 0 ? 'vencido' : d === 0 ? 'vence hoje' : `vence em ${d}d`}</small>
                        )}
                      </td>
                      <td className="ad-mono ad-hide-md">{fmtDate(u.createdAt, false)}</td>
                      <td><span className="ad-mono">{fmtDate(u.lastLoginAt || u.createdAt)}</span><small className="ad-rel">{relTime(u.lastLoginAt)}</small></td>
                      <td className="ad-mono ad-num">{u.loginCount || 1}</td>
                      <td className="ad-mono ad-num ad-hide-sm">{fmtDuration(secsOf(u))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="ad-foot">{rows.length} de {users.length} contas · Clique no título da coluna para ordenar: 1º clique do maior/mais recente, 2º do menor/mais antigo, 3º volta à ordem original.</p>
        </main>
      )}

      {/* Detalhe da conta */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div className="ad-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedId(null)} />
            <motion.aside className="ad-drawer" aria-label="Detalhe da conta"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.45, ease: EASE }}>
              <div className="ad-dr-head">
                <div className="ad-user ad-user-lg">
                  {selected.photoURL ? <img src={selected.photoURL} alt="" referrerPolicy="no-referrer" /> : <span className="ad-ava">{(selected.displayName || selected.email || '?').slice(0, 1).toUpperCase()}</span>}
                  <span><b className="ad-serif">{selected.displayName || 'Sem nome'}</b><small>{selected.email}</small></span>
                </div>
                <button className="ad-icon" onClick={() => setSelectedId(null)} aria-label="Fechar detalhe"><i className="ti ti-x" aria-hidden="true" /></button>
              </div>

              <button className="ad-uid" onClick={() => { navigator.clipboard.writeText(selected.uid); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }}>
                <span className="ad-mono">{selected.uid}</span><i className={`ti ${copied ? 'ti-check' : 'ti-copy'}`} aria-hidden="true" />
              </button>

              <div className="ad-mini">
                <div><p>Acessos</p><b className="ad-mono">{selected.loginCount || 1}</b></div>
                <div><p>Tempo total</p><b className="ad-mono">{fmtDuration(secsOf(selected))}</b></div>
                <div><p>Criada em</p><b className="ad-mono">{fmtDate(selected.createdAt, false)}</b></div>
                <div><p>Último acesso</p><b className="ad-mono">{fmtDate(selected.lastLoginAt, false)}</b></div>
              </div>

              <h4 className="ad-label">Histórico de acessos</h4>
              {sessions === null ? (
                <p className="ad-muted">Carregando…</p>
              ) : !sessions.length ? (
                <p className="ad-muted">Nenhum acesso registrado ainda. O histórico com data e duração começou a ser gravado em {HISTORY_START}; antes disso só existem a contagem e o último acesso.</p>
              ) : (
                <>
                  <ul className="ad-sessions">
                    {sessionList.map(s => (
                      <li key={s.id}>
                        <span className="ad-mono">{fmtDate(s.start)}</span>
                        <span className="ad-mono ad-dim">{fmtDuration(s.seconds)}</span>
                      </li>
                    ))}
                  </ul>
                  {sessions.length > 8 && (
                    <button className="ad-link" onClick={() => setShowAllSessions(v => !v)}>{showAllSessions ? 'Mostrar menos' : `Ver todos (${sessions.length})`}</button>
                  )}
                </>
              )}

              <h4 className="ad-label">Plano</h4>
              {isAdminRecord(selected) ? (
                <p className="ad-muted">Conta de administrador: acesso total.</p>
              ) : (
                <>
                  <div className="ad-seg ad-seg-full" role="radiogroup" aria-label="Plano da conta">
                    {(['free', 'monthly', 'annual', 'lifetime'] as PlanView[]).map(p => (
                      <button key={p} role="radio" aria-checked={planView(selected) === p} className={`${planView(selected) === p ? 'is-on' : ''} ${p === 'lifetime' ? 'is-gold' : ''}`} onClick={() => askPlan(selected, p)}>{PLAN_LABEL[p]}</button>
                    ))}
                  </div>
                  {(planView(selected) === 'monthly' || planView(selected) === 'annual') && (
                    <label className="ad-field">
                      <span>Vence em</span>
                      <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)} onBlur={() => saveExpiry(selected)} />
                    </label>
                  )}
                </>
              )}

              <h4 className="ad-label">Anotação</h4>
              <textarea className="ad-note" value={note} onChange={e => setNote(e.target.value)} onBlur={() => saveNote(selected)} maxLength={1000}
                placeholder="Ex.: pagou Pix em 17/11, parcelou em 3x" rows={3} />
              <p className="ad-muted ad-small">Salva quando você sai do campo. Só você vê.</p>

              {!isAdminRecord(selected) && (
                <button className={`ad-btn ad-btn-wide ${selected.blocked ? 'ad-btn-solid' : 'ad-btn-red-outline'}`} onClick={() => askBlock(selected)}>
                  <i className={`ti ${selected.blocked ? 'ti-lock-open' : 'ti-lock'}`} aria-hidden="true" /> {selected.blocked ? 'Liberar acesso' : 'Bloquear acesso'}
                </button>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <ConfirmDialog state={confirm} onClose={() => setConfirm(null)} />

      <AnimatePresence>
        {toast && (
          <motion.div className="ad-toast" role="status" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>{toast}</motion.div>
        )}
      </AnimatePresence>
    </div>
  );
  // Renderiza direto no <body>, por cima de qualquer camada do app
  return inline || typeof document === 'undefined' ? panel : createPortal(panel, document.body);
};

/** Se o painel der erro, mostra a mensagem em vez de não abrir nada. */
export class AdminPanelBoundary extends React.Component<{ onClose: () => void; children: React.ReactNode }, { err: string | null }> {
  state = { err: null as string | null };
  static getDerivedStateFromError(e: any) { return { err: String(e?.message || e) }; }
  componentDidCatch(e: any) { console.error('[AdminDashboard]', e); }
  render() {
    if (!this.state.err) return this.props.children;
    return createPortal(
      <div style={{ position: 'fixed', inset: 0, zIndex: 2147483000, background: '#040004', color: '#EDE9E3', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'DM Sans, system-ui, sans-serif' }}>
        <div style={{ maxWidth: 520, textAlign: 'center' }}>
          <p style={{ fontSize: 18, marginBottom: 8 }}>O painel encontrou um erro ao abrir.</p>
          <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#B9B4BE', wordBreak: 'break-word', marginBottom: 20 }}>{this.state.err}</p>
          <button onClick={() => { this.setState({ err: null }); this.props.onClose(); }} style={{ padding: '10px 18px', borderRadius: 999, border: '1px solid #3A3440', background: 'transparent', color: '#EDE9E3', cursor: 'pointer' }}>Fechar</button>
        </div>
      </div>,
      document.body,
    );
  }
}

export default AdminDashboard;

// ── Estilos ─────────────────────────────────────────────────────────────────
const ADMIN_CSS = `
.ad-root{--bg:#040004;--panel:#0a070c;--fg:#EDE9E3;--mut:#B9B4BE;--dim:#8a8590;--line:#1c1820;--line2:#2a2430;--line3:#3A3440;--gold:#D4AF37;--gold2:#F5D98A;--ease:cubic-bezier(.32,.72,0,1);
  position:fixed;inset:0;z-index:2147482000;background:var(--bg);color:var(--fg);font-family:'DM Sans',system-ui,sans-serif;font-size:14px;display:flex;flex-direction:column;overflow:hidden}
.ad-root *{box-sizing:border-box}
.ad-root button{font-family:inherit;color:inherit}
.ad-serif{font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:600;letter-spacing:-.01em}
.ad-mono{font-family:'DM Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums}
.ad-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 28px;border-bottom:1px solid var(--line)}
.ad-brand{display:flex;align-items:baseline;gap:2px;white-space:nowrap}
.ad-logo-a{font-family:'Cormorant Garamond',Georgia,serif;font-size:23px;font-weight:500}
.ad-logo-b{font-family:'Syne','DM Sans',sans-serif;font-weight:700;font-size:15px;letter-spacing:.02em}
.ad-head-sub{margin-left:14px;color:var(--dim);font-size:13px}
.ad-head-actions{display:flex;align-items:center;gap:8px}
.ad-live{display:inline-flex;align-items:center;gap:7px;color:var(--dim);font-size:12px;margin-right:6px}
.ad-dot{width:7px;height:7px;border-radius:50%;background:#4ADE80;box-shadow:0 0 8px #4ADE80}
.ad-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:40px;padding:0 16px;border:1px solid var(--line3);border-radius:999px;background:none;font-size:12px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;transition:background .3s var(--ease),border-color .3s,color .3s}
.ad-btn:hover:not(:disabled){border-color:var(--fg)}
.ad-btn:disabled{opacity:.5;cursor:default}
.ad-btn .ti{font-size:16px}
.ad-btn-solid{background:var(--fg);border-color:var(--fg);color:#040004!important}
.ad-btn-solid:hover:not(:disabled){background:#fff}
.ad-btn-red{background:#EF4444;border-color:#EF4444;color:#fff!important}
.ad-btn-red-outline{border-color:rgba(239,68,68,.6);color:#FCA5A5!important}
.ad-btn-red-outline:hover:not(:disabled){background:rgba(239,68,68,.1);border-color:#EF4444}
.ad-btn-wide{width:100%;min-height:48px;margin-top:22px}
.ad-icon{width:40px;height:40px;border-radius:50%;border:0;background:none;color:var(--mut)!important;font-size:18px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;transition:background .3s,color .3s}
.ad-icon:hover{background:rgba(237,233,227,.07);color:var(--fg)!important}
.ad-root :focus-visible{outline:2px solid var(--fg);outline-offset:2px}
.ad-spin{animation:ad-spin 1s linear infinite}
@keyframes ad-spin{to{transform:rotate(360deg)}}

.ad-main{flex:1;overflow:auto;padding:26px 28px 40px;max-width:1440px;width:100%;margin:0 auto}
.ad-h1{margin:0;font-size:44px;line-height:1}
.ad-kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px;margin-top:22px}
.ad-kpi{border:1px solid var(--line2);border-radius:16px;padding:16px 18px;background:var(--panel);text-align:left;display:flex;flex-direction:column;gap:4px}
.ad-kpi p{margin:0;color:var(--dim);font-size:12px}
.ad-kpi b{font-size:28px;font-weight:400;line-height:1.15}
.ad-kpi small{color:var(--dim);font-size:12px}
.ad-kpi small.ad-up{color:#4ADE80}
.ad-kpi-gold{border-color:rgba(212,175,55,.45)}
.ad-kpi-gold p,.ad-kpi-gold b{color:var(--gold2)}
.ad-kpi-btn{cursor:pointer;transition:border-color .3s}
.ad-kpi-btn:hover{border-color:var(--line3)}
.ad-kpi-warn{border-color:rgba(251,146,60,.5)}
.ad-kpi-warn b,.ad-kpi-warn small{color:#FDBA74}

.ad-tools{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:24px}
.ad-search{flex:1;min-width:220px;display:flex;align-items:center;gap:10px;min-height:44px;padding:0 8px 0 16px;border:1px solid var(--line2);border-radius:999px;background:var(--panel);color:var(--dim)}
.ad-search input{flex:1;min-width:0;background:none;border:0;outline:0;color:var(--fg);font:inherit;font-size:15px}
.ad-search input::placeholder{color:var(--dim)}
.ad-search button{border:0;background:none;color:var(--dim)!important;cursor:pointer;width:32px;height:32px;border-radius:50%}
.ad-seg{display:inline-flex;flex-wrap:wrap;gap:2px;padding:4px;border:1px solid var(--line2);border-radius:999px;background:var(--panel)}
.ad-seg button{min-height:36px;padding:0 14px;border:0;border-radius:999px;background:none;color:var(--mut)!important;font-size:13px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:background .3s var(--ease),color .3s}
.ad-seg button:hover{color:var(--fg)!important}
.ad-seg button.is-on{background:var(--fg);color:#040004!important}
.ad-seg button.is-gold.is-on{background:var(--gold)}
.ad-count{font-family:'DM Mono',monospace;font-size:11px;padding:1px 6px;border-radius:999px;background:rgba(251,146,60,.18);color:#FDBA74}
.ad-seg button.is-on .ad-count{background:rgba(4,0,4,.12);color:#040004}
.ad-seg-full{display:grid;grid-template-columns:repeat(4,1fr);border-radius:14px}
.ad-seg-full button{border-radius:10px;justify-content:center}
.ad-error{margin-top:16px;padding:12px 16px;border:1px solid rgba(239,68,68,.4);border-radius:12px;color:#FCA5A5}

.ad-table-wrap{margin-top:16px;border:1px solid var(--line2);border-radius:18px;overflow:auto;background:rgba(10,7,12,.6)}
.ad-table{width:100%;border-collapse:collapse;min-width:640px}
.ad-th{position:sticky;top:0;background:#0a070c;text-align:left;padding:0;border-bottom:1px solid var(--line2);white-space:nowrap}
.ad-th button{width:100%;display:inline-flex;align-items:center;gap:6px;padding:14px 16px;border:0;background:none;color:var(--dim)!important;font-size:11px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;text-align:left}
.ad-th button:hover{color:var(--fg)!important}
.ad-th button .ti{font-size:14px;opacity:.4}
.ad-th.is-on button{color:var(--fg)!important}
.ad-th.is-on button .ti{opacity:1}
.ad-num,.ad-th.ad-num button{text-align:right;justify-content:flex-end}
.ad-table td{padding:12px 16px;border-bottom:1px solid var(--line);vertical-align:middle;white-space:nowrap}
.ad-row{cursor:pointer;transition:background .2s}
.ad-row:hover td,.ad-row.is-on td{background:rgba(237,233,227,.035)}
.ad-row:last-child td{border-bottom:0}
.ad-td-empty{text-align:center;color:var(--dim);padding:40px!important}
.ad-user{display:flex;align-items:center;gap:12px;min-width:0}
.ad-user img,.ad-ava{width:34px;height:34px;border-radius:50%;flex:none;object-fit:cover}
.ad-ava{display:inline-flex;align-items:center;justify-content:center;background:#1c1820;color:var(--mut);font-size:14px}
.ad-user span{display:flex;flex-direction:column;min-width:0}
.ad-user b{font-weight:500;font-size:14px;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:8px}
.ad-user small{color:var(--dim);font-size:12px;overflow:hidden;text-overflow:ellipsis}
.ad-admin-tag{font-style:normal;font-size:10px;letter-spacing:.1em;text-transform:uppercase;padding:2px 6px;border-radius:6px;border:1px solid var(--line3);color:var(--dim)}
.ad-chip{display:inline-flex;align-items:center;gap:5px;font-size:12px;padding:4px 10px;border-radius:999px;border:1px solid var(--line3);color:var(--mut)}
.ad-chip-monthly,.ad-chip-annual{border-color:rgba(96,165,250,.45);color:#93C5FD}
.ad-chip-lifetime{border-color:rgba(212,175,55,.55);color:var(--gold2)}
.ad-chip-red{border-color:rgba(239,68,68,.55);color:#FCA5A5}
.ad-exp{display:block;margin-top:4px;font-size:11px;color:var(--dim)}
.ad-exp.is-warn{color:#FDBA74}
.ad-rel{display:block;font-size:11px;color:var(--dim);margin-top:2px}
.ad-foot{margin:12px 2px 0;color:var(--dim);font-size:12px}
.ad-empty{flex:1;display:flex;align-items:center;justify-content:center;gap:10px;color:var(--mut)}

.ad-scrim{position:fixed;inset:0;z-index:12001;background:rgba(4,0,4,.55)}
.ad-drawer{position:fixed;top:0;right:0;bottom:0;z-index:12002;width:min(440px,100%);background:var(--panel);border-left:1px solid var(--line2);padding:22px 24px 32px;overflow-y:auto;box-shadow:-30px 0 80px -30px rgba(0,0,0,.9)}
.ad-dr-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.ad-user-lg img,.ad-user-lg .ad-ava{width:48px;height:48px;font-size:18px}
.ad-user-lg b{font-size:26px;font-weight:600;line-height:1.1}
.ad-user-lg small{font-size:13px}
.ad-uid{margin-top:14px;width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 12px;border:1px solid var(--line2);border-radius:10px;background:none;cursor:pointer;color:var(--dim)!important;font-size:11px}
.ad-uid span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ad-mini{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}
.ad-mini div{border:1px solid var(--line2);border-radius:12px;padding:12px 14px}
.ad-mini p{margin:0;color:var(--dim);font-size:12px}
.ad-mini b{display:block;font-size:20px;font-weight:400;margin-top:2px}
.ad-label{margin:26px 0 10px;font-size:12px;font-weight:500;letter-spacing:.14em;text-transform:uppercase}
.ad-sessions{list-style:none;margin:0;padding:0}
.ad-sessions li{display:flex;justify-content:space-between;padding:10px 2px;border-top:1px solid var(--line);font-size:13px}
.ad-sessions li:first-child{border-top:0}
.ad-dim{color:var(--mut)}
.ad-link{margin-top:6px;border:0;background:none;padding:6px 0;color:var(--fg)!important;text-decoration:underline;text-underline-offset:5px;text-decoration-color:var(--line3);cursor:pointer;font-size:13px}
.ad-muted{margin:0;color:var(--dim);font-size:13px;line-height:1.55}
.ad-small{font-size:12px;margin-top:6px}
.ad-field{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px;padding:8px 8px 8px 14px;border:1px solid var(--line2);border-radius:12px}
.ad-field span{color:var(--mut);font-size:13px}
.ad-field input{background:none;border:0;color:var(--fg);font-family:'DM Mono',monospace;font-size:14px;color-scheme:dark;outline:0}
.ad-note{width:100%;resize:vertical;min-height:80px;padding:12px 14px;border:1px solid var(--line2);border-radius:12px;background:#07050a;color:var(--fg);font:inherit;font-size:14px;line-height:1.5;outline:0}
.ad-note:focus{border-color:var(--line3)}

.ad-confirm-bg{position:fixed;inset:0;z-index:12010;background:rgba(4,0,4,.8);display:flex;align-items:center;justify-content:center;padding:20px}
.ad-confirm{width:100%;max-width:400px;background:var(--panel);border:1px solid var(--line3);border-radius:22px;padding:30px 26px 26px;text-align:center;box-shadow:0 40px 120px -30px rgba(0,0,0,.9)}
.ad-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:12020;padding:12px 18px;border-radius:999px;background:var(--fg);color:#040004;font-size:14px;font-weight:500}

@media (max-width:1180px){.ad-kpis{grid-template-columns:repeat(3,minmax(0,1fr))}.ad-hide-md{display:none}}
@media (max-width:720px){
  .ad-head{padding:12px 16px}.ad-head-sub,.ad-live{display:none}
  .ad-main{padding:18px 16px 32px}.ad-h1{font-size:36px}
  .ad-kpis{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
  .ad-kpi{padding:12px 14px}.ad-kpi b{font-size:22px}
  .ad-seg{border-radius:16px}
  .ad-hide-sm{display:none}
  .ad-table{min-width:0}
  .ad-table td,.ad-th button{padding-left:10px;padding-right:10px}
  .ad-drawer{padding:18px 16px 28px}
}
@media (prefers-reduced-motion:reduce){.ad-spin{animation:none}}
`;
