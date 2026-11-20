/**
 * Teste grátis de 7 horas (fase Fundadores).
 * - Só conta com a aba aberta (visível) e em uso: parado por 5 minutos, o relógio pausa.
 * - A cada minuto de uso manda uma batida; o servidor soma 60s e recusa batidas duplicadas.
 * - Vale por 30 dias desde o primeiro acesso, uma vez por conta Google.
 * - Desliga sozinho fora da fase 1 (quando as vagas de Fundador acabam ou passa 14/01).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { subscribeTrial, startTrialInFirestore, trialBeat, getLifetimeSoldCount, type TrialDoc } from '../lib/firebase';
import { PLANOS, faseAtual, vendidasManual } from '../src/plans/plans';

export const TRIAL_LIMIT_SECONDS = PLANOS.teste.horas * 3600;
const IDLE_MS = 5 * 60 * 1000;
const BEAT_MS = 60 * 1000;

export type TrialState = 'off' | 'loading' | 'active' | 'ended';

export interface TrialUsage {
  state: TrialState;
  usedSeconds: number;
  limitSeconds: number;
  remainingSeconds: number;
  todaySeconds: number;
  endsAt: Date | null;
  /** true quando o motivo do fim foi o prazo de 30 dias (e não as horas) */
  endedByDate: boolean;
  /** contando agora (aba visível e com uso nos últimos 5 minutos) */
  counting: boolean;
}

/** eligible = conta logada, plano grátis, não é admin */
export function useTrialUsage(uid: string | null, eligible: boolean): TrialUsage {
  const [doc, setDoc] = useState<TrialDoc | null | undefined>(undefined);
  const [phase1, setPhase1] = useState(() => faseAtual(new Date(), vendidasManual) === 1);
  const [counting, setCounting] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const lastInput = useRef(Date.now());
  const started = useRef(false);
  const docRef = useRef<TrialDoc | null | undefined>(undefined);
  docRef.current = doc;

  // Fase: vendas reais (Firestore) ou informadas na Vercel, o que for maior
  useEffect(() => {
    if (!eligible) return;
    getLifetimeSoldCount().then(n => setPhase1(faseAtual(new Date(), Math.max(vendidasManual, n ?? 0)) === 1));
  }, [eligible]);

  const on = !!uid && eligible && phase1;

  useEffect(() => {
    if (!on || !uid) { setDoc(undefined); return; }
    started.current = false;
    return subscribeTrial(uid, t => {
      setDoc(t);
      if (t === null && !started.current) { started.current = true; startTrialInFirestore(uid); }
    });
  }, [on, uid]);

  const limit = TRIAL_LIMIT_SECONDS + (doc?.extraSeconds || 0);
  const endsAt = doc?.startedAt ? new Date(doc.startedAt.getTime() + PLANOS.teste.diasValidade * 86400000) : null;
  const endedByDate = !!endsAt && now > endsAt.getTime();
  const endedByHours = !!doc && doc.usedSeconds >= limit;
  const state: TrialState = !on ? 'off' : doc === undefined || doc === null ? 'loading' : (endedByDate || endedByHours) ? 'ended' : 'active';

  // Uso: qualquer toque, tecla, rolagem ou movimento conta como "em uso"
  useEffect(() => {
    if (state !== 'active') return;
    const mark = () => { lastInput.current = Date.now(); };
    const evs = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'] as const;
    evs.forEach(e => window.addEventListener(e, mark, { passive: true }));
    const vis = () => { if (document.visibilityState === 'visible') mark(); };
    document.addEventListener('visibilitychange', vis);
    return () => { evs.forEach(e => window.removeEventListener(e, mark)); document.removeEventListener('visibilitychange', vis); };
  }, [state]);

  // Batida a cada minuto, só com a aba visível e uso recente
  useEffect(() => {
    if (state !== 'active' || !uid) { setCounting(false); return; }
    const check = () => {
      const active = document.visibilityState === 'visible' && Date.now() - lastInput.current < IDLE_MS;
      setCounting(active);
      setNow(Date.now());
      return active;
    };
    check();
    const t = window.setInterval(() => {
      const d = docRef.current;
      if (check() && d) trialBeat(uid, d.day);
    }, BEAT_MS);
    const c = window.setInterval(check, 15000);
    return () => { window.clearInterval(t); window.clearInterval(c); };
  }, [state, uid]);

  return useMemo(() => {
    const used = Math.min(doc?.usedSeconds || 0, limit);
    return {
      state,
      usedSeconds: used,
      limitSeconds: limit,
      remainingSeconds: Math.max(0, limit - used),
      todaySeconds: doc && doc.day === localDayStr() ? doc.daySeconds : 0,
      endsAt,
      endedByDate,
      counting: state === 'active' && counting,
    };
  }, [state, doc, limit, endsAt?.getTime(), endedByDate, counting]);
}

const localDayStr = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** 4h 07min · 45min · 0min */
export const formatHM = (secs: number) => {
  const m = Math.floor(secs / 60), h = Math.floor(m / 60), r = m % 60;
  return h ? (r ? `${h}h ${String(r).padStart(2, '0')}min` : `${h}h`) : `${r}min`;
};
