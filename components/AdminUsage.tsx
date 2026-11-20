/**
 * Painel admin · aba Uso: o teste de 7 horas de cada conta grátis.
 * Usa as classes do painel (pnl-*). Ações: +1h, zerar (7h e 30 dias de novo) e e-mail.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { subscribeAllTrialsForAdmin, adminTrialAddHour, adminTrialReset, type TrialDoc } from '../lib/firebase';
import { TRIAL_LIMIT_SECONDS, formatHM } from '../hooks/useTrialUsage';
import { PLANOS } from '../src/plans/plans';

interface U { uid: string; email: string; displayName?: string; photoURL?: string; plan?: string }

type Status = 'using' | 'idle' | 'ended';
const STATUS_LABEL: Record<Status, string> = { using: 'Usando', idle: 'Parado', ended: 'Encerrado' };
const LIVE_MS = 2.5 * 60 * 1000;

const ago = (d: Date | null) => {
  if (!d) return '—';
  const m = Math.round((Date.now() - d.getTime()) / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `há ${h} h`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

export const AdminUsage: React.FC<{ users: U[] }> = ({ users }) => {
  const [trials, setTrials] = useState<TrialDoc[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [, tick] = useState(0);

  useEffect(() => subscribeAllTrialsForAdmin(setTrials, () => setError('Não foi possível ler os testes. Confira se as regras novas do Firebase já foram publicadas.')), []);
  useEffect(() => { const t = window.setInterval(() => tick(n => n + 1), 30000); return () => window.clearInterval(t); }, []);

  const rows = useMemo(() => {
    const byUid = new Map(users.map(u => [u.uid, u]));
    return (trials || []).map(t => {
      const limit = TRIAL_LIMIT_SECONDS + t.extraSeconds;
      const endsAt = t.startedAt ? new Date(t.startedAt.getTime() + PLANOS.teste.diasValidade * 86400000) : null;
      const ended = t.usedSeconds >= limit || (!!endsAt && Date.now() > endsAt.getTime());
      const status: Status = ended ? 'ended' : t.lastBeat && Date.now() - t.lastBeat.getTime() < LIVE_MS && t.usedSeconds > 0 ? 'using' : 'idle';
      return { t, u: byUid.get(t.uid), limit, endsAt, status };
    }).sort((a, b) => (b.t.lastBeat?.getTime() || 0) - (a.t.lastBeat?.getTime() || 0));
  }, [trials, users]);

  const k = useMemo(() => {
    const active = rows.filter(r => r.status !== 'ended');
    const avg = rows.length ? rows.reduce((s, r) => s + r.t.usedSeconds, 0) / rows.length : 0;
    return { active: active.length, using: rows.filter(r => r.status === 'using').length, avg, ended: rows.length - active.length };
  }, [rows]);

  const act = async (uid: string, fn: () => Promise<boolean>) => {
    setBusy(uid); const ok = await fn(); setBusy(null);
    if (!ok) setError('Não foi possível salvar a alteração.');
  };

  return (
    <section aria-label="Uso do teste grátis">
      <style>{CSS}</style>
      <div className="pnl-kpis upl-kpis">
        <div className="pnl-kpi"><p>Em teste</p><b className="pnl-mono">{k.active}</b><small>com horas e prazo</small></div>
        <div className="pnl-kpi"><p>Usando agora</p><b className="pnl-mono">{k.using}</b><small>últimos 2 minutos</small></div>
        <div className="pnl-kpi"><p>Média de uso</p><b className="pnl-mono">{formatHM(k.avg)}</b><small>de {PLANOS.teste.horas}h</small></div>
        <div className="pnl-kpi"><p>Terminaram</p><b className="pnl-mono">{k.ended}</b><small>horas ou prazo</small></div>
      </div>
      {error && <div className="pnl-error"><i className="ti ti-alert-circle" aria-hidden="true" /> {error}</div>}
      <div className="pnl-table-wrap">
        <table className="pnl-table">
          <thead><tr>
            <th className="upl-th">Conta</th><th className="upl-th">Uso das {PLANOS.teste.horas}h</th><th className="upl-th pnl-hide-md">Vale até</th>
            <th className="upl-th">Último uso</th><th className="upl-th">Situação</th><th className="upl-th upl-r">Ações</th>
          </tr></thead>
          <tbody>
            {trials === null ? <tr><td colSpan={6} className="pnl-td-empty">Carregando testes…</td></tr>
              : !rows.length ? <tr><td colSpan={6} className="pnl-td-empty">Ninguém começou o teste ainda.</td></tr>
              : rows.map(({ t, u, limit, endsAt, status }) => {
                const pct = Math.min(100, (t.usedSeconds / limit) * 100);
                return (
                  <tr key={t.uid}>
                    <td><div className="pnl-user">
                      {u?.photoURL ? <img src={u.photoURL} alt="" referrerPolicy="no-referrer" /> : <span className="pnl-ava">{(u?.displayName || u?.email || '?').slice(0, 1).toUpperCase()}</span>}
                      <span><b>{u?.displayName || 'Sem nome'}</b><small>{u?.email || t.uid}</small></span>
                    </div></td>
                    <td><div className="upl-use">
                      <span className="upl-bar"><i style={{ width: `${pct}%` }} className={pct >= 85 ? 'is-hot' : ''} /></span>
                      <span className="pnl-mono">{formatHM(t.usedSeconds)}{t.extraSeconds ? <em> +{t.extraSeconds / 3600}h</em> : null}</span>
                    </div></td>
                    <td className="pnl-mono pnl-hide-md">{endsAt ? endsAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—'}</td>
                    <td>{ago(t.lastBeat)}</td>
                    <td><span className={`pnl-chip upl-${status}`}>{status === 'using' && <i className="upl-live" />}{STATUS_LABEL[status]}</span></td>
                    <td className="upl-r"><div className="upl-acts">
                      <button type="button" disabled={busy === t.uid} onClick={() => act(t.uid, () => adminTrialAddHour(t.uid))} title="Somar 1 hora">+1h</button>
                      <button type="button" disabled={busy === t.uid} title="7 horas e 30 dias de novo, a partir de agora"
                        onClick={() => { if (window.confirm(`Zerar o teste de ${u?.displayName || u?.email || 'esta conta'}? Volta a ter ${PLANOS.teste.horas} horas e ${PLANOS.teste.diasValidade} dias a partir de agora.`)) act(t.uid, () => adminTrialReset(t.uid)); }}>Zerar</button>
                      {u?.email && <a href={`mailto:${u.email}`} title="Enviar e-mail" aria-label="Enviar e-mail"><i className="ti ti-mail" aria-hidden="true" /></a>}
                    </div></td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      <p className="pnl-foot">Só conta tempo com a aba aberta e em uso (pausa depois de 5 minutos parado). Quem paga sai do teste automaticamente.</p>
    </section>
  );
};

const CSS = `
.upl-kpis{grid-template-columns:repeat(4,minmax(0,1fr))}
.upl-th{position:sticky;top:0;background:#0a070c;text-align:left;padding:12px 16px;border-bottom:1px solid var(--line2);white-space:nowrap;font-weight:400;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim)}
.upl-r{text-align:right}
.upl-use{display:flex;align-items:center;gap:10px;min-width:150px}
.upl-bar{flex:1;height:4px;border-radius:2px;background:var(--line2);overflow:hidden;min-width:60px}
.upl-bar i{display:block;height:100%;background:var(--fg);border-radius:2px}
.upl-bar i.is-hot{background:#FB923C}
.upl-use em{font-style:normal;color:var(--dim);font-size:11.5px}
.upl-using{border-color:rgba(74,222,128,.45);color:#86EFAC}
.upl-ended{color:var(--dim)}
.upl-live{width:6px;height:6px;border-radius:50%;background:#4ADE80;box-shadow:0 0 8px #4ADE80}
.upl-acts{display:inline-flex;gap:6px;align-items:center}
.upl-acts button,.upl-acts a{height:30px;min-width:36px;padding:0 11px;border-radius:999px;border:1px solid var(--line3);background:none;color:var(--mut);font-size:12.5px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;text-decoration:none}
.upl-acts button:hover,.upl-acts a:hover{border-color:var(--fg);color:var(--fg)}
.upl-acts button:disabled{opacity:.4;cursor:default}
@media (max-width:760px){.upl-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;
