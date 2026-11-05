import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  QrCode,
  Copy,
  X,
  ArrowLeftRight,
  LogOut,
  User,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PAYMENT_CONFIG, whatsappLink } from '../lib/paymentConfig';
import { getLifetimeSoldCount } from '../lib/firebase';

/**
 * Janela de Planos + Catálogo de Atendimentos.
 *
 * Tipografia da marca (definida em index.html, troca em um só lugar):
 *   .ff-title = EB Garamond · .ff-text = Sora · .ff-num = Lora · .ff-num-sm = Sora tabular
 *
 * Anti-"jitter": botões, etiquetas e faixas de status têm altura fixa e não
 * quebram linha, para os cards ficarem alinhados em qualquer largura.
 */

const SUPERNOVA = 'linear-gradient(135deg, #6366F1 0%, #22D3EE 25%, #818cf8 45%, #f472b6 65%, #fb923c 80%, #EF4444 100%)';
const GOLD_BORDER = 'linear-gradient(160deg, #F5D98A, #D4AF37 40%, #8a6d1d)';
const GOLD_BUTTON = 'linear-gradient(180deg, #F5D98A, #D4AF37)';

export type PlanType = 'free' | 'monthly' | 'lifetime';

interface PaymentPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan?: (planId: PlanType) => void;
  reason?: 'trial_expired' | 'user_opened';
  userEmail?: string;
  username?: string;
  isAuthenticated?: boolean;
  onSwitchAccount?: () => void;
  onLogout?: () => void;
}

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  cta: string;
  isOther?: boolean;
}

const SERVICES: ServiceItem[] = [
  { id: 'mapa-natal', name: 'Mapa natal', icon: 'ti-planet', cta: 'Quero este',
    description: 'Leitura completa do seu mapa de nascimento: talentos, desafios e caminhos.' },
  { id: 'pergunta', name: 'Pergunta específica', icon: 'ti-help-circle', cta: 'Quero este',
    description: 'Uma questão do seu momento, respondida com foco e profundidade.' },
  { id: 'agenda', name: 'Agenda', icon: 'ti-calendar-event', cta: 'Quero este',
    description: 'Eventos energéticos adicionados à sua agenda e a rotina organizada em torno deles.' },
  { id: 'proximo-mes', name: 'Seu próximo mês', icon: 'ti-calendar-month', cta: 'Quero este',
    description: 'O que os próximos 30 dias trazem para você e como aproveitar cada fase.' },
  { id: 'onde-no-tempo', name: 'Onde você está no tempo', icon: 'ti-hourglass', cta: 'Quero este',
    description: 'Sua jornada, ano, mês e dia arcanos: o ciclo que você vive agora.' },
  { id: 'outros', name: 'Outros', icon: 'ti-message-circle', cta: 'Entrar em contato', isOther: true,
    description: 'Tem outra necessidade? Me conte e eu monto o atendimento para você.' },
];

const formatBRL = (n: number) => n.toLocaleString('pt-BR');

export const PaymentPlansModal: React.FC<PaymentPlansModalProps> = ({
  isOpen,
  onClose,
  onSelectPlan,
  reason = 'user_opened',
  userEmail,
  username,
  isAuthenticated,
  onSwitchAccount,
  onLogout
}) => {
  const [view, setView] = useState<'plans' | 'catalog'>('plans');
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('lifetime');
  const [copiedPix, setCopiedPix] = useState(false);
  const [showPixDetails, setShowPixDetails] = useState(false);
  const [showComparisonTable, setShowComparisonTable] = useState(false);
  const [checkoutOpened, setCheckoutOpened] = useState(false);
  const [checkoutUnavailable, setCheckoutUnavailable] = useState(false);
  const [lifetimeSold, setLifetimeSold] = useState<number | null>(null);

  // Ao abrir: volta para os planos e busca as vagas reais do Vitalício
  useEffect(() => {
    if (!isOpen) return;
    setView('plans');
    setCheckoutOpened(false);
    setCheckoutUnavailable(false);
    let alive = true;
    getLifetimeSoldCount().then(n => { if (alive) setLifetimeSold(n); });
    return () => { alive = false; };
  }, [isOpen]);

  // Esc fecha (ou volta do catálogo para os planos)
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (view === 'catalog') setView('plans'); else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, view, onClose]);

  if (!isOpen) return null;

  const total = PAYMENT_CONFIG.lifetimeTotalSpots;
  const remaining = lifetimeSold === null ? null : Math.max(0, total - lifetimeSold);
  const soldOut = remaining === 0;
  const monthsEquivalent = PAYMENT_CONFIG.lifetimePrice / PAYMENT_CONFIG.monthlyPrice;
  const emailLine = userEmail ? ` Meu e-mail da conta: ${userEmail}` : '';

  const handleCopyPix = () => {
    navigator.clipboard.writeText(PAYMENT_CONFIG.pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleProceedAction = (plan: PlanType) => {
    setSelectedPlan(plan);
    if (plan === 'free') {
      onSelectPlan?.('free');
      onClose();
      return;
    }
    onSelectPlan?.(plan);
    const targetUrl = plan === 'monthly' ? PAYMENT_CONFIG.checkoutUrlMonthly : PAYMENT_CONFIG.checkoutUrlLifetime;
    if (!targetUrl) {
      setCheckoutUnavailable(true);
      setCheckoutOpened(false);
      return;
    }
    setCheckoutUnavailable(false);
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    setCheckoutOpened(true);
  };

  const openWhatsApp = (message: string) => {
    window.open(whatsappLink(message), '_blank', 'noopener,noreferrer');
  };

  // ── Peças reutilizadas ─────────────────────────────────────────────────────
  const feature = (text: React.ReactNode, color: string, locked = false) => (
    <div className={`flex items-start gap-2 text-[12px] leading-[1.5] font-light py-[3px] ${locked ? 'text-white/45' : ''}`}>
      <i className={`ti ${locked ? 'ti-lock' : 'ti-check'} text-[14px] mt-[2px] shrink-0`} style={{ color: locked ? undefined : color }} aria-hidden="true" />
      <span>{text}</span>
    </div>
  );

  const pixLink = (plan: PlanType) => PAYMENT_CONFIG.pixKey ? (
    <button
      type="button"
      onClick={() => { setSelectedPlan(plan); setShowPixDetails(true); }}
      className="mt-1.5 h-6 w-full text-[11px] text-white/55 hover:text-white whitespace-nowrap transition-colors cursor-pointer"
    >
      ou pagar com Pix
    </button>
  ) : null;
  const pixPlaceholder = PAYMENT_CONFIG.pixKey ? <div className="mt-1.5 h-6" aria-hidden="true" /> : null;

  const closeButton = (
    <button
      onClick={onClose}
      className="p-1.5 sm:p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
      title="Fechar (Esc)"
      aria-label="Fechar"
    >
      <X className="w-5 h-5" />
    </button>
  );

  // ── Catálogo de atendimentos ───────────────────────────────────────────────
  const catalogView = (
    <div className="w-full p-[1.5px] rounded-[22px]" style={{ background: SUPERNOVA }}>
      <div className="w-full bg-[#08060c] rounded-[20.5px] p-4 sm:p-6">
        <div className="flex items-center justify-between gap-2 mb-4">
          <button
            type="button"
            onClick={() => setView('plans')}
            className="h-9 px-3 rounded-xl border border-white/20 text-[12px] text-[#F5F2EB] hover:bg-white/5 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <i className="ti ti-arrow-left text-[14px]" aria-hidden="true" /> Planos
          </button>
          {closeButton}
        </div>

        {/* Bio */}
        <div className="flex items-center gap-4 pb-4 mb-4 border-b border-white/10">
          <div className="ff-title w-14 h-14 rounded-full flex items-center justify-center shrink-0 text-[22px] text-[#F5D98A] bg-[#D4AF37]/10 border border-[#D4AF37]/50">RM</div>
          <div className="min-w-0">
            <h2 className="ff-title text-[26px] leading-tight text-[#F5F2EB]">Rafael Medeiros</h2>
            <p className="text-[12px] text-white/70 font-light mt-0.5">Criador do Cronógrafo Sideral e do Calendário Arcano</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="h-6 px-2.5 inline-flex items-center rounded-full border border-white/15 text-[10.5px] text-white/80 whitespace-nowrap">Astrólogo · Numerólogo · Oraculista</span>
              <span className="h-6 px-2.5 inline-flex items-center rounded-full border border-white/15 text-[10.5px] text-white/80 whitespace-nowrap">desde&nbsp;<span className="ff-num-sm font-medium">2012</span></span>
              <span className="h-6 px-2.5 inline-flex items-center rounded-full border border-[#D4AF37]/45 text-[10.5px] text-[#F5D98A] whitespace-nowrap">+<span className="ff-num">2.000</span>&nbsp;atendimentos</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <div>
            <h3 className="ff-title text-[22px] text-[#F5F2EB] leading-none">Atendimentos</h3>
            <p className="text-[12px] text-white/60 font-light mt-1">Exclusivos e personalizados. Escolha um e fale comigo pelo WhatsApp.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {SERVICES.map(s => (
            <div key={s.id} className={`rounded-xl p-3.5 flex flex-col bg-white/[0.02] border ${s.isOther ? 'border-dashed border-white/15' : 'border-white/10'}`}>
              <div className={`w-8 h-8 rounded-[9px] flex items-center justify-center text-[16px] ${s.isOther ? 'border border-white/20 text-white/80' : 'bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#F5D98A]'}`}>
                <i className={`ti ${s.icon}`} aria-hidden="true" />
              </div>
              <div className="ff-title mt-2 h-7 text-[18px] leading-7 text-[#F5F2EB] truncate whitespace-nowrap" title={s.name}>{s.name}</div>
              <p className="mt-1 h-[54px] text-[11.5px] leading-[18px] text-white/60 font-light line-clamp-3">{s.description}</p>
              <div className={`mt-1.5 h-5 text-[11px] whitespace-nowrap ${s.isOther ? 'text-transparent' : 'text-[#F5D98A]'}`}>Valor sob consulta</div>
              <button
                type="button"
                onClick={() => openWhatsApp(s.isOther
                  ? `Olá, Rafael! Vim pelo Cronógrafo Sideral e gostaria de um atendimento personalizado.${emailLine}`
                  : `Olá, Rafael! Tenho interesse no atendimento "${s.name}".${emailLine}`)}
                className="mt-3 h-10 w-full rounded-[9px] border border-white/20 text-[12px] font-medium text-[#F5F2EB] hover:bg-white/5 inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer"
              >
                <i className="ti ti-brand-whatsapp text-[15px] text-[#25D366]" aria-hidden="true" />
                {s.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Planos ─────────────────────────────────────────────────────────────────
  const plansView = (
    <>
      <div className="w-full p-[1.5px] rounded-[22px]" style={{ background: SUPERNOVA, boxShadow: '0 25px 60px -12px rgba(0,0,0,0.85)' }}>
        <div className="w-full bg-[#08060c] rounded-[20.5px] p-4 sm:p-6">

          {/* Sessão + fechar */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10 gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#F5D98A] shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/50 whitespace-nowrap">
                  <span>Sessão</span>
                  {isAuthenticated || userEmail ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-normal"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Conectado</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-300 font-normal"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Visitante</span>
                  )}
                </div>
                <div className="text-xs text-white/90 truncate max-w-[150px] sm:max-w-[280px]">{userEmail || username || 'Visitante'}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {onSwitchAccount && (
                <button
                  onClick={onSwitchAccount}
                  className="h-8 px-2.5 sm:px-3 rounded-xl bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#F5D98A] text-xs font-medium transition-all inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                  title="Desconectar e entrar com outra conta"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Trocar de conta</span>
                  <span className="sm:hidden">Trocar</span>
                </button>
              )}
              {onLogout && (userEmail || isAuthenticated) && (
                <button
                  onClick={onLogout}
                  className="h-8 px-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-white/60 hover:text-red-300 text-xs font-medium transition-all inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                  title="Sair da conta"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Sair</span>
                </button>
              )}
              {closeButton}
            </div>
          </div>

          {/* Cabeçalho */}
          <div className="text-center mb-5">
            <div className="text-[10.5px] tracking-[0.22em] uppercase text-white/50">Cronógrafo Sideral</div>
            <h2 className="ff-title text-[28px] sm:text-[32px] leading-tight text-[#F5F2EB] mt-1">
              {reason === 'trial_expired' ? 'Continue com acesso completo' : 'Escolha seu acesso'}
            </h2>
            <p className="text-[12.5px] text-white/60 font-light mt-1">O céu sideral ao vivo, em qualquer data da história.</p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-stretch">

            {/* Gratuito */}
            <div className="rounded-2xl p-4 flex flex-col border border-white/10 bg-white/[0.015]">
              <div className="h-7 flex items-center justify-between gap-2">
                <span className="ff-title text-[22px] leading-none text-[#F5F2EB] whitespace-nowrap">Gratuito</span>
              </div>
              <div className="mt-1 h-5 text-[11.5px] text-white/55 font-light truncate">Para conhecer o Cronógrafo</div>
              <div className="mt-3 h-12 flex items-end gap-1 whitespace-nowrap">
                <span className="text-[12px] text-white/50 mb-1.5">R$</span>
                <span className="ff-num text-[34px] leading-none text-[#F5F2EB]">0</span>
              </div>
              <div className="mt-3 h-[92px] flex flex-col gap-1.5">
                <div className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-[11px] whitespace-nowrap overflow-hidden bg-orange-400/10 border border-orange-400/35 text-orange-200">
                  <i className="ti ti-hourglass-high text-[14px] shrink-0" aria-hidden="true" />
                  <span className="truncate">Liberações atuais por tempo limitado</span>
                </div>
                <p className="text-[11px] leading-[1.4] text-white/50 font-light line-clamp-2">
                  Válido durante o lançamento, até <span className="ff-num-sm font-medium text-[#F5F2EB]">{PAYMENT_CONFIG.freeLaunchUntil}</span>.
                </p>
              </div>
              <div className="flex-1">
                {feature('Relógio sideral e roda em tempo real', 'rgba(245,242,235,.6)')}
                {feature('Termos egípcios e decanatos', 'rgba(245,242,235,.6)')}
                {feature('Navegação em 2026 e início de 2027', 'rgba(245,242,235,.6)')}
                {feature('Mês vigente lunar e solar', 'rgba(245,242,235,.6)')}
                {feature('Personalização, orbes e PDF sem marca', '', true)}
              </div>
              <button
                type="button"
                onClick={() => handleProceedAction('free')}
                className="mt-4 h-11 w-full rounded-[10px] border border-white/25 text-[12.5px] font-medium text-[#F5F2EB] hover:bg-white/5 whitespace-nowrap transition-colors cursor-pointer"
              >
                Continuar no gratuito
              </button>
              {pixPlaceholder}
            </div>

            {/* Mensal */}
            <div className="rounded-2xl p-4 flex flex-col border border-slate-200/40" style={{ background: 'linear-gradient(180deg, rgba(226,232,240,.07), rgba(226,232,240,.02))' }}>
              <div className="h-7 flex items-center justify-between gap-2">
                <span className="ff-title text-[22px] leading-none text-[#F5F2EB] whitespace-nowrap">Mensal</span>
                <span className="h-6 px-2.5 inline-flex items-center rounded-full border border-slate-200/35 text-[10px] tracking-[0.08em] uppercase text-slate-200 whitespace-nowrap">Profissional</span>
              </div>
              <div className="mt-1 h-5 text-[11.5px] text-white/65 font-light truncate">Para atendimentos e estudo diário</div>
              <div className="mt-3 h-12 flex items-end gap-1 whitespace-nowrap">
                <span className="text-[12px] text-white/70 mb-1.5">R$</span>
                <span className="ff-num text-[38px] leading-none text-white">{formatBRL(PAYMENT_CONFIG.monthlyPrice)}</span>
                <span className="text-[11.5px] text-white/60 mb-1.5">/ mês</span>
              </div>
              <div className="mt-3 h-[92px] flex flex-col gap-1.5">
                <div className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-[11px] whitespace-nowrap overflow-hidden bg-slate-200/[0.08] border border-slate-200/25 text-slate-200">
                  <i className="ti ti-refresh text-[14px] shrink-0" aria-hidden="true" />
                  <span className="truncate">Cancele quando quiser</span>
                </div>
              </div>
              <div className="flex-1">
                {feature('Qualquer ano e século, sem limites', '#E2E8F0')}
                {feature(<><b className="font-medium">PDF ilimitado</b>, sem marca d'água</>, '#E2E8F0')}
                {feature('Calendários lunar e solar completos', '#E2E8F0')}
                {feature('Mapas salvos na nuvem', '#E2E8F0')}
                {feature('Personalização completa e orbes', '#E2E8F0')}
              </div>
              <button
                type="button"
                onClick={() => handleProceedAction('monthly')}
                className="mt-4 h-11 w-full rounded-[10px] bg-[#F5F2EB] hover:bg-white text-[#040004] text-[12.5px] font-semibold whitespace-nowrap transition-colors cursor-pointer"
              >
                Assinar o mensal
              </button>
              {pixLink('monthly')}
            </div>

            {/* Vitalício */}
            <div className="rounded-2xl p-[1px]" style={{ background: GOLD_BORDER }}>
              <div className="h-full rounded-[15px] p-4 flex flex-col" style={{ background: 'linear-gradient(180deg, #17120a, #0b0906)' }}>
                <div className="h-7 flex items-center justify-between gap-2">
                  <span className="ff-title text-[22px] leading-none text-[#F5D98A] whitespace-nowrap">Vitalício</span>
                  <span className="h-6 px-2.5 inline-flex items-center rounded-full bg-[#D4AF37] text-[10px] tracking-[0.08em] uppercase font-semibold text-[#1a1305] whitespace-nowrap">Fundador</span>
                </div>
                <div className="mt-1 h-5 text-[11.5px] text-[#F5D98A]/70 font-light truncate">Pague uma vez, use para sempre</div>
                <div className="mt-3 h-12 flex items-end gap-1 whitespace-nowrap">
                  <span className="text-[12px] text-[#F5D98A]/75 mb-1.5">R$</span>
                  <span className="ff-num text-[38px] leading-none text-[#F5D98A]">{formatBRL(PAYMENT_CONFIG.lifetimePrice)}</span>
                  <span className="text-[11.5px] text-[#F5D98A]/65 mb-1.5">pagamento único</span>
                </div>
                <div className="mt-3 h-[92px] flex flex-col gap-1.5">
                  <div className="h-[50px] px-2.5 py-1.5 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/45 flex flex-col justify-center">
                    <div className="flex items-center justify-between gap-2 text-[11px] text-[#F5D98A] whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5"><i className="ti ti-flame text-[14px]" aria-hidden="true" />{soldOut ? 'Vagas esgotadas' : 'Vagas limitadas'}</span>
                      <span className="ff-num-sm font-medium">
                        {remaining === null ? `${total} vagas` : soldOut ? `0 de ${total}` : `restam ${remaining} de ${total}`}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-[#D4AF37]/20 mt-1.5 overflow-hidden">
                      <div className="h-full bg-[#D4AF37] transition-all" style={{ width: `${remaining === null ? 100 : (remaining / total) * 100}%` }} />
                    </div>
                  </div>
                  <p className="text-[11px] leading-[1.4] text-[#F5D98A]/60 font-light line-clamp-2">
                    Equivale a menos de {Math.ceil(monthsEquivalent)} meses do Mensal.
                  </p>
                </div>
                <div className="flex-1">
                  {feature(<b className="font-medium">Tudo do Mensal, para sempre</b>, '#D4AF37')}
                  {feature('Exportação em 300 DPI para impressão', '#D4AF37')}
                  {feature('Todas as atualizações e novos módulos', '#D4AF37')}
                  {feature('Suporte prioritário e canal direto', '#D4AF37')}
                </div>
                {soldOut ? (
                  <button
                    type="button"
                    onClick={() => openWhatsApp(`Olá! Quero entrar na lista de espera do plano Vitalício do Cronógrafo Sideral.${emailLine}`)}
                    className="mt-4 h-11 w-full rounded-[10px] border border-[#D4AF37]/60 text-[#F5D98A] text-[12.5px] font-semibold whitespace-nowrap hover:bg-[#D4AF37]/10 transition-colors cursor-pointer"
                  >
                    Entrar na lista de espera
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleProceedAction('lifetime')}
                    className="mt-4 h-11 w-full rounded-[10px] text-[#1a1305] text-[12.5px] font-semibold whitespace-nowrap hover:opacity-95 transition-opacity cursor-pointer"
                    style={{ background: GOLD_BUTTON }}
                  >
                    Garantir minha vaga
                  </button>
                )}
                {soldOut ? pixPlaceholder : pixLink('lifetime')}
              </div>
            </div>
          </div>

          {/* Status do checkout */}
          {(checkoutOpened || checkoutUnavailable) && selectedPlan !== 'free' && (
            <div className={`mt-3 px-3.5 py-2.5 rounded-xl text-[12px] font-light border ${checkoutUnavailable ? 'border-amber-400/40 bg-amber-400/10 text-amber-200' : 'border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#F5D98A]'}`}>
              {checkoutUnavailable ? (
                <>Checkout indisponível no momento. Fale com a gente pelo WhatsApp abaixo para concluir sua assinatura.</>
              ) : (
                <>Abrimos o pagamento em uma nova aba. Após a confirmação, seu plano é liberado
                  {userEmail ? <> na conta <strong className="font-medium">{userEmail}</strong></> : null} em até {PAYMENT_CONFIG.activationDeadline}.</>
              )}
            </div>
          )}

          {/* Pix */}
          <AnimatePresence>
            {showPixDetails && selectedPlan !== 'free' && PAYMENT_CONFIG.pixKey && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 p-4 rounded-2xl bg-black/70 border border-white/15 space-y-3 overflow-hidden"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium text-white inline-flex items-center gap-2 whitespace-nowrap">
                    <QrCode className="w-4 h-4 text-[#D4AF37]" />
                    Pix · {selectedPlan === 'monthly' ? `Mensal R$ ${formatBRL(PAYMENT_CONFIG.monthlyPrice)},00` : `Vitalício R$ ${formatBRL(PAYMENT_CONFIG.lifetimePrice)},00`}
                  </span>
                  <span className="text-[11px] text-white/50">Liberação em até {PAYMENT_CONFIG.activationDeadline} após a confirmação</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="text" readOnly value={PAYMENT_CONFIG.pixKey}
                    className="w-full bg-black/80 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white/80 font-mono outline-none select-all" />
                  <button onClick={handleCopyPix}
                    className="h-9 px-4 rounded-xl bg-white/15 hover:bg-white/20 border border-white/20 text-white font-medium text-xs inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap transition-colors cursor-pointer">
                    {copiedPix ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#F5D98A]" />}
                    {copiedPix ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Problemas no pagamento */}
          <div className="mt-4 px-3.5 py-2.5 rounded-xl border border-[#25D366]/35 bg-[#25D366]/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <i className="ti ti-brand-whatsapp text-[22px] text-[#25D366] shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-[#F5F2EB]">Problemas com o pagamento?</div>
                <div className="text-[11.5px] text-white/60 font-light">Envie o comprovante e o e-mail da sua conta.</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openWhatsApp(`Olá! Tive um problema no pagamento do Cronógrafo Sideral.${emailLine}`)}
              className="h-10 px-4 rounded-[10px] bg-[#25D366] hover:bg-[#2be070] text-[#052e14] text-[12.5px] font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              <i className="ti ti-brand-whatsapp text-[16px]" aria-hidden="true" /> Chamar no WhatsApp
            </button>
          </div>

          {/* Garantias + comparativo */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11.5px] text-white/55">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><i className="ti ti-shield-check text-[14px]" aria-hidden="true" />Pagamento pelo Nubank</span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><i className="ti ti-user-check text-[14px]" aria-hidden="true" />Liberado em até {PAYMENT_CONFIG.activationDeadline} na sua conta</span>
            <button
              type="button"
              onClick={() => setShowComparisonTable(v => !v)}
              className="inline-flex items-center gap-1 underline underline-offset-[3px] hover:text-white whitespace-nowrap cursor-pointer"
            >
              {showComparisonTable ? 'Ocultar comparativo' : 'Ver comparativo completo'}
              {showComparisonTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showComparisonTable && (
            <div className="mt-3 overflow-x-auto custom-scrollbar rounded-xl border border-white/10">
              <table className="w-full text-left text-[11.5px] border-collapse min-w-[560px]">
                <thead>
                  <tr className="border-b border-white/10 text-[10.5px] uppercase tracking-wider text-white/50">
                    <th className="py-2 px-3 font-medium">Recurso</th>
                    <th className="py-2 px-3 font-medium">Gratuito</th>
                    <th className="py-2 px-3 font-medium text-slate-200">Mensal</th>
                    <th className="py-2 px-3 font-medium text-[#F5D98A]">Vitalício</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/80 font-light">
                  {([
                    ['Relógio sideral e roda viva', 'Liberado', 'Liberado', 'Liberado', false],
                    ['Navegação no tempo', 'Só 2026 e início de 2027', 'Qualquer ano e século', 'Qualquer ano e século', true],
                    ['Pontos lunares (liga/desliga)', 'Bloqueado', 'Controle total', 'Controle total', true],
                    ['Opções e personalização', 'Bloqueado', 'Livre', 'Livre', true],
                    ['Edição de orbes nos painéis', 'Bloqueado', 'Completa', 'Completa', true],
                    ['Calendário lunar e ciclos', 'Só o mês vigente', 'Todos os meses', 'Todos os meses e ciclos', true],
                    ['Mapas natais salvos', 'Até 2', 'Ilimitados', 'Ilimitados na nuvem', true],
                    ['Exportação em PDF', '1 com marca d\'água', 'Ilimitada', 'Ilimitada em 300 DPI', true],
                  ] as const).map(([label, free, monthly, lifetime, freeLocked]) => (
                    <tr key={label}>
                      <td className="py-2.5 px-3 font-normal text-white">{label}</td>
                      <td className={`py-2.5 px-3 ${freeLocked ? 'text-orange-200/90' : 'text-white/80'}`}>
                        <i className={`ti ${freeLocked ? 'ti-lock' : 'ti-check'} text-[12px] mr-1`} aria-hidden="true" />{free}
                      </td>
                      <td className="py-2.5 px-3 text-slate-200"><i className="ti ti-check text-[12px] mr-1" aria-hidden="true" />{monthly}</td>
                      <td className="py-2.5 px-3 text-[#F5D98A]"><i className="ti ti-check text-[12px] mr-1" aria-hidden="true" />{lifetime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Atendimento exclusivo — fora da moldura dos planos, na mesma tela */}
      <div className="w-full mt-3 rounded-2xl p-[1px]" style={{ background: 'linear-gradient(90deg, rgba(212,175,55,.55), rgba(212,175,55,.08))' }}>
        <div className="rounded-[15px] bg-[#0b0906] px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="ff-title w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-[17px] text-[#F5D98A] bg-[#D4AF37]/10 border border-[#D4AF37]/45">RM</div>
            <div className="min-w-0">
              <div className="ff-title text-[19px] leading-tight text-[#F5D98A]">Atendimento exclusivo</div>
              <div className="text-[11.5px] text-white/65 font-light">Leituras personalizadas com Rafael Medeiros, criador do Cronógrafo Sideral.</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setView('catalog')}
            className="h-10 px-4 rounded-[10px] text-[#1a1305] text-[12.5px] font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 hover:opacity-95 transition-opacity cursor-pointer"
            style={{ background: GOLD_BUTTON }}
          >
            Ver catálogo <i className="ti ti-arrow-right text-[14px]" aria-hidden="true" />
          </button>
        </div>
      </div>
    </>
  );

  return createPortal(
    <div
      className="ff-text fixed inset-0 z-[12000] overflow-y-auto bg-black/85 backdrop-blur-xl text-[#F5F2EB]"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="min-h-full flex items-center justify-center p-3 sm:p-5"
        onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-5xl"
        >
          {view === 'catalog' ? catalogView : plansView}
        </motion.div>
      </div>
    </div>,
    document.body
  );
};
