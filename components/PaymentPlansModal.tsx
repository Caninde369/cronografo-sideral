import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  Crown, 
  Sparkles, 
  Calendar, 
  CreditCard, 
  QrCode, 
  Copy, 
  MessageCircle, 
  X, 
  ArrowRight, 
  ShieldCheck, 
  Infinity as InfinityIcon,
  ArrowLeftRight,
  LogOut,
  User,
  Compass,
  Clock,
  Zap,
  Star,
  Globe2,
  Database,
  Layers,
  Download,
  Lock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PAYMENT_CONFIG } from '../lib/paymentConfig';

const SUPERNOVA = 'linear-gradient(135deg, #6366F1 0%, #22D3EE 25%, #818cf8 45%, #f472b6 65%, #fb923c 80%, #EF4444 100%)';

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
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('lifetime');
  const [copiedPix, setCopiedPix] = useState(false);
  const [showPixDetails, setShowPixDetails] = useState(false);
  const [showComparisonTable, setShowComparisonTable] = useState(true);
  const [checkoutOpened, setCheckoutOpened] = useState(false);
  const [checkoutUnavailable, setCheckoutUnavailable] = useState(false);

  if (!isOpen) return null;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(PAYMENT_CONFIG.pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleProceedAction = (planToExecute?: PlanType) => {
    const plan = planToExecute || selectedPlan;
    if (plan === 'free') {
      if (onSelectPlan) {
        onSelectPlan('free');
      }
      onClose();
      return;
    }

    if (onSelectPlan) {
      onSelectPlan(plan);
    }
    const targetUrl = plan === 'monthly'
      ? PAYMENT_CONFIG.checkoutUrlMonthly
      : PAYMENT_CONFIG.checkoutUrlLifetime;
    if (!targetUrl) {
      setCheckoutUnavailable(true);
      setCheckoutOpened(false);
      return;
    }
    setCheckoutUnavailable(false);
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    setCheckoutOpened(true);
  };

  return createPortal(
    <div className="fixed inset-0 z-[12000] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200 overflow-y-auto">
      {/* Névoa Cósmica / Efeito Supernova de Fundo */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 15% 35%, rgba(99,102,241,0.12) 0%, transparent 60%),
            radial-gradient(ellipse at 85% 65%, rgba(212,175,55,0.10) 0%, transparent 60%),
            radial-gradient(ellipse at 50% 50%, rgba(239,68,68,0.05) 0%, transparent 70%)
          `
        }}
      />

      {/* Moldura com Borda Supernova */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-5xl my-auto p-[1.5px] rounded-[24px] shadow-2xl z-10"
        style={{
          background: SUPERNOVA,
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.85), 0 0 50px rgba(99, 102, 241, 0.15)'
        }}
      >
        <div className="w-full bg-[#080810] rounded-[22.5px] p-4 sm:p-6 md:p-7 text-white max-h-[92vh] overflow-y-auto custom-scrollbar relative">
          {/* Névoa interna suave */}
          <div 
            className="absolute inset-0 pointer-events-none rounded-[22.5px]"
            style={{
              background: `
                radial-gradient(ellipse at 10% 20%, rgba(99,102,241,0.06) 0%, transparent 55%),
                radial-gradient(ellipse at 90% 80%, rgba(212,175,55,0.06) 0%, transparent 55%)
              `
            }}
          />

          {/* Barra Superior: Sessão Atual (Esquerda) e Ações de Conta / Fechar (Direita) */}
          <div className="relative flex items-center justify-between pb-3.5 mb-4 border-b border-white/10 gap-2">
            {/* Sessão da Conta */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-white/5 border border-[#D4AF37]/30 flex items-center justify-center text-[#F5D98A] shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-sans font-semibold uppercase tracking-wider text-white/50">
                  <span>Sessão</span>
                  {isAuthenticated || userEmail ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-normal">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Conectado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-normal">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Visitante
                    </span>
                  )}
                </div>
                <div className="text-xs font-sans text-white/90 truncate max-w-[150px] sm:max-w-[280px]">
                  {userEmail || username || 'Visitante'}
                </div>
              </div>
            </div>

            {/* Ações de Saída / Troca / Fechar */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {onSwitchAccount && (
                <button
                  onClick={onSwitchAccount}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37]/15 to-[#F5D98A]/10 hover:from-[#D4AF37]/25 hover:to-[#F5D98A]/20 border border-[#D4AF37]/40 text-[#F5D98A] text-xs font-sans font-semibold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
                  title="Desconectar e alternar para outra conta Google ou E-mail"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-[#F5D98A]" />
                  <span className="hidden sm:inline">Trocar de Conta</span>
                  <span className="sm:hidden">Trocar</span>
                </button>
              )}

              {onLogout && (userEmail || isAuthenticated) && (
                <button
                  onClick={onLogout}
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-white/60 hover:text-red-300 text-xs font-sans font-semibold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Desconectar da sessão atual"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Sair</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title={reason === 'trial_expired' ? "Fechar / Voltar" : "Fechar"}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Cabeçalho Editorial com Logo Visível e Tipografia do Cronógrafo */}
          <div className="relative text-center max-w-xl mx-auto mb-5 sm:mb-6">
            <div className="flex items-center justify-center mb-3">
              <img 
                src="/logo-dark.svg" 
                alt="Cronógrafo Sideral" 
                className="w-[180px] sm:w-[220px] h-auto object-contain mx-auto opacity-95 filter drop-shadow-[0_2px_14px_rgba(255,255,255,0.18)]" 
                onError={e => { 
                  e.currentTarget.src = '/logo.svg'; 
                  e.currentTarget.style.filter = 'brightness(0) invert(1)';
                }} 
              />
            </div>

            <div className="w-12 h-px bg-white/10 mx-auto mb-3" />

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-[#D4AF37] text-[10px] font-sans font-bold uppercase tracking-widest mb-2 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Planos de Acesso ao Cronógrafo</span>
            </div>

            <h2 
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              className="text-2xl sm:text-3xl italic text-[#F5F2EB] font-light tracking-tight leading-tight"
            >
              {reason === 'trial_expired' ? 'Faça upgrade para liberar todos os recursos' : 'Escolha sua modalidade de acesso'}
            </h2>

            <p 
              style={{ fontFamily: "'DM Sans', sans-serif" }}
              className="text-xs sm:text-sm text-white/60 mt-1.5 leading-relaxed"
            >
              Selecione a modalidade ideal para continuar utilizando o motor de efemérides siderais, trânsitos em tempo real, cartas natais e o HUD astronômico.
            </p>
          </div>

          {/* Grid de 3 Planos: Gratuito, Mensal e Vitalício */}
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 mb-5">
            
            {/* 1. Plano Gratuito (Opcional) */}
            <div 
              onClick={() => setSelectedPlan('free')}
              className={`relative p-4 sm:p-5 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between border ${
                selectedPlan === 'free'
                  ? 'bg-white/[0.08] border-cyan-400/50 shadow-[0_0_25px_rgba(34,211,238,0.12)] ring-1 ring-cyan-400/40'
                  : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2 text-white font-sans font-bold text-sm">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>Plano Gratuito</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                    selectedPlan === 'free' ? 'border-cyan-400 bg-cyan-400' : 'border-white/20'
                  }`}>
                    {selectedPlan === 'free' && <Check className="w-3.5 h-3.5 text-black font-bold" />}
                  </div>
                </div>

                <div className="mb-3.5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm text-white/60 font-sans font-semibold">R$</span>
                    <span className="text-3xl font-display font-bold text-white tracking-tight">0</span>
                    <span className="text-xs text-white/50 font-sans">/ gratuito</span>
                  </div>
                  <p className="text-[11px] text-white/50 font-sans mt-1">
                    Acesso opcional para exploração inicial e demonstração de recursos.
                  </p>
                </div>

                {/* Benefícios com Ícones Específicos */}
                <div className="space-y-2 pt-3 border-t border-white/10 text-xs text-white/80 font-sans">
                  <div className="flex items-start gap-2.5">
                    <Compass className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>Relógio Sideral e roda viva em tempo real</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Layers className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span className="text-white font-medium">Anel de Termos Egípcios e Decanatos liberados</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>Navegação no scrubber sob o ano de 2026</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Globe2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>Visualização do mês vigente lunar e solar</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Download className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>1 exportação de teste com marca d'água</span>
                  </div>
                </div>

                {/* Bloco de Limitações Específicas do Plano Gratuito */}
                <div className="mt-3.5 pt-3 border-t border-amber-500/20 bg-black/40 rounded-xl p-2.5 space-y-1.5 text-[11px] font-sans">
                  <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-[10px] uppercase tracking-wider mb-1">
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>Limitações do Plano Free:</span>
                  </div>
                  <div className="flex items-start gap-2 text-white/60">
                    <span className="text-amber-400/90 text-xs leading-none">🔒</span>
                    <span>Pontos lunares: botões on/off bloqueados</span>
                  </div>
                  <div className="flex items-start gap-2 text-white/60">
                    <span className="text-amber-400/90 text-xs leading-none">🔒</span>
                    <span>Opções e personalização na sidebar bloqueadas</span>
                  </div>
                  <div className="flex items-start gap-2 text-white/60">
                    <span className="text-amber-400/90 text-xs leading-none">🔒</span>
                    <span>Edições de orbes nos painéis (Astros, Casas, Aspectos) bloqueadas</span>
                  </div>
                  <div className="flex items-start gap-2 text-white/60">
                    <span className="text-amber-400/90 text-xs leading-none">🔒</span>
                    <span>Scrubber restrito ao ano 2026 e início de 2027</span>
                  </div>
                  <div className="flex items-start gap-2 text-white/60">
                    <span className="text-amber-400/90 text-xs leading-none">🔒</span>
                    <span>Calendário lunar: meses com desfoque (*blur*)</span>
                  </div>
                  <div className="flex items-start gap-2 text-white/60">
                    <span className="text-amber-400/90 text-xs leading-none">🔒</span>
                    <span>Limite máximo de 2 mapas natais salvos</span>
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleProceedAction('free');
                }}
                className={`mt-5 w-full py-2.5 px-3 rounded-xl font-sans font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  selectedPlan === 'free'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm hover:bg-cyan-500/30'
                    : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                }`}
              >
                Continuar Gratuito
              </button>
            </div>

            {/* 2. Plano Mensal */}
            <div 
              onClick={() => setSelectedPlan('monthly')}
              className={`relative p-4 sm:p-5 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between border ${
                selectedPlan === 'monthly'
                  ? 'bg-white/[0.08] border-[#D4AF37]/60 shadow-[0_0_25px_rgba(212,175,55,0.15)] ring-1 ring-[#D4AF37]/50'
                  : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2 text-white font-sans font-bold text-sm">
                    <Calendar className="w-4 h-4 text-[#D4AF37]" />
                    <span>Plano Mensal</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                    selectedPlan === 'monthly' ? 'border-[#D4AF37] bg-[#D4AF37]' : 'border-white/20'
                  }`}>
                    {selectedPlan === 'monthly' && <Check className="w-3.5 h-3.5 text-black font-bold" />}
                  </div>
                </div>

                <div className="mb-3.5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm text-white/60 font-sans font-semibold">R$</span>
                    <span className="text-3xl font-display font-bold text-white tracking-tight">100</span>
                    <span className="text-xs text-white/50 font-sans">/ mês</span>
                  </div>
                  <p className="text-[11px] text-white/50 font-sans mt-1">
                    Cobrança recorrente mensal. Cancele quando desejar.
                  </p>
                </div>

                {/* Benefícios com Ícones Específicos */}
                <div className="space-y-2 pt-3 border-t border-white/10 text-xs text-white/80 font-sans">
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                    <span>Navegação temporal em qualquer ano e século</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Download className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                    <span className="font-semibold text-white">Exportações em PDF ilimitadas e sem marca d'água</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Globe2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                    <span>Calendário lunar e solar completo (todos os anos e ciclos)</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Database className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                    <span>Armazenamento de mapas e cartas na nuvem</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Zap className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                    <span>Acesso contínuo sem limites de tempo</span>
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPlan('monthly');
                }}
                className={`mt-5 w-full py-2.5 px-3 rounded-xl font-sans font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  selectedPlan === 'monthly'
                    ? 'bg-[#D4AF37]/20 text-[#F5D98A] border border-[#D4AF37]/40 shadow-sm'
                    : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                }`}
              >
                Selecionar Mensal
              </button>
            </div>

            {/* 3. Acesso Vitalício (Destaque Supernova & Recomendado) */}
            <div 
              onClick={() => setSelectedPlan('lifetime')}
              className={`relative p-4 sm:p-5 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between border ${
                selectedPlan === 'lifetime'
                  ? 'bg-gradient-to-b from-[#D4AF37]/20 via-[#15120C] to-black/80 border-[#D4AF37] shadow-[0_0_35px_rgba(212,175,55,0.25)] ring-1 ring-[#D4AF37]'
                  : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
              }`}
            >
              {/* Badge Recomendado */}
              <div className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F5D98A] text-black text-[10px] font-sans font-bold uppercase tracking-wider flex items-center gap-1 shadow-md">
                <Crown className="w-3 h-3 text-black" />
                <span>Mais Vantajoso</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2 text-white font-sans font-bold text-sm">
                    <InfinityIcon className="w-4 h-4 text-[#D4AF37]" />
                    <span>Acesso Vitalício</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                    selectedPlan === 'lifetime' ? 'border-[#D4AF37] bg-[#D4AF37]' : 'border-white/20'
                  }`}>
                    {selectedPlan === 'lifetime' && <Check className="w-3.5 h-3.5 text-black font-bold" />}
                  </div>
                </div>

                <div className="mb-3.5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm text-[#F5D98A]/70 font-sans font-semibold">R$</span>
                    <span className="text-3xl font-display font-bold text-[#F5D98A] tracking-tight">920</span>
                    <span className="text-xs text-[#F5D98A]/60 font-sans">/ taxa única</span>
                  </div>
                  <p className="text-[11px] text-white/50 font-sans mt-1">
                    Sem mensalidades ou renovações. Acesso perpétuo à plataforma.
                  </p>
                </div>

                {/* Benefícios com Ícones Específicos */}
                <div className="space-y-2 pt-3 border-t border-white/10 text-xs text-white/80 font-sans">
                  <div className="flex items-start gap-2.5">
                    <Crown className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                    <span className="font-semibold text-white">Todas as vantagens do plano mensal</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <InfinityIcon className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                    <span className="font-semibold text-[#F5D98A]">Pagamento único vitalício (sem mensalidades)</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Download className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                    <span>Exportações ilimitadas em 300 DPI para impressão</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                    <span>Atualizações perpétuas de novas efemérides e módulos</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                    <span>Suporte VIP prioritário vitalício e canal direto</span>
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPlan('lifetime');
                }}
                className={`mt-5 w-full py-2.5 px-3 rounded-xl font-sans font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  selectedPlan === 'lifetime'
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#F5D98A] text-black shadow-md font-bold hover:opacity-95'
                    : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                }`}
              >
                Selecionar Vitalício
              </button>
            </div>

          </div>

          {/* Comparativo de Recursos e Limitações: Free vs Mensal vs Vitalício */}
          <div className="relative mb-5 p-3.5 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowComparisonTable(prev => !prev)}
              className="w-full flex items-center justify-between text-left text-xs font-sans font-bold text-white/90 hover:text-white cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                <span className="uppercase tracking-wider text-[11px] text-[#F5D98A]">Comparativo Detalhado de Limitações & Recursos</span>
              </div>
              <div className="flex items-center gap-1.5 text-white/50 text-[11px]">
                <span>{showComparisonTable ? 'Ocultar tabela' : 'Exibir tabela completa'}</span>
                {showComparisonTable ? <ChevronUp className="w-4 h-4 text-[#D4AF37]" /> : <ChevronDown className="w-4 h-4 text-[#D4AF37]" />}
              </div>
            </button>

            {showComparisonTable && (
              <div className="mt-3.5 pt-3 border-t border-white/10 overflow-x-auto custom-scrollbar">
                <table className="w-full text-left font-sans text-xs border-collapse min-w-[540px]">
                  <thead>
                    <tr className="border-b border-white/10 text-[10.5px] uppercase tracking-wider text-white/50">
                      <th className="py-2 px-3 font-semibold">Funcionalidade</th>
                      <th className="py-2 px-3 font-semibold text-cyan-400">Plano Free</th>
                      <th className="py-2 px-3 font-semibold text-[#D4AF37]">Plano Mensal</th>
                      <th className="py-2 px-3 font-semibold text-[#F5D98A]">Acesso Vitalício</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-[11px] text-white/80">
                    <tr className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 font-medium text-white">Relógio Sideral & Roda Viva</td>
                      <td className="py-2.5 px-3 text-cyan-300">✓ Liberado</td>
                      <td className="py-2.5 px-3 text-emerald-400">✓ Liberado</td>
                      <td className="py-2.5 px-3 text-emerald-400">✓ Liberado</td>
                    </tr>
                    <tr className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 font-medium text-white">Navegação Temporal no Scrubber</td>
                      <td className="py-2.5 px-3 text-amber-300 font-semibold">🔒 Apenas 2026/2027</td>
                      <td className="py-2.5 px-3 text-emerald-400">✓ Qualquer ano/século</td>
                      <td className="py-2.5 px-3 text-emerald-400">✓ Qualquer ano/século</td>
                    </tr>
                    <tr className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 font-medium text-white">Controles de Pontos Lunares (On/Off)</td>
                      <td className="py-2.5 px-3 text-amber-300 font-semibold">🔒 Bloqueado</td>
                      <td className="py-2.5 px-3 text-emerald-400">✓ Controle total</td>
                      <td className="py-2.5 px-3 text-emerald-400">✓ Controle total</td>
                    </tr>
                    <tr className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 font-medium text-white">Opções & Personalização na Sidebar</td>
                      <td className="py-2.5 px-3 text-amber-300 font-semibold">🔒 Bloqueado</td>
                      <td className="py-2.5 px-3 text-emerald-400">✓ Customização livre</td>
                      <td className="py-2.5 px-3 text-emerald-400">✓ Customização livre</td>
                    </tr>
                    <tr className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 font-medium text-white">Edições de Orbes nos Painéis</td>
                      <td className="py-2.5 px-3 text-amber-300 font-semibold">🔒 Bloqueado</td>
                      <td className="py-2.5 px-3 text-emerald-400">✓ Edição completa</td>
                      <td className="py-2.5 px-3 text-emerald-400">✓ Edição completa</td>
                    </tr>
                    <tr className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 font-medium text-white">Calendário Lunar & Ciclos</td>
                      <td className="py-2.5 px-3 text-amber-300 font-semibold">🔒 Mês vigente (demais com blur)</td>
                      <td className="py-2.5 px-3 text-emerald-400">✓ Todos os meses</td>
                      <td className="py-2.5 px-3 text-emerald-400">✓ Todos os meses e ciclos</td>
                    </tr>
                    <tr className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 font-medium text-white">Mapas Natais Salvos</td>
                      <td className="py-2.5 px-3 text-amber-300 font-semibold">🔒 Máximo 2 mapas</td>
                      <td className="py-2.5 px-3 text-emerald-400">✓ Ilimitados</td>
                      <td className="py-2.5 px-3 text-emerald-400">✓ Ilimitados na nuvem</td>
                    </tr>
                    <tr className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 font-medium text-white">Exportações de Alta Qualidade (PDF)</td>
                      <td className="py-2.5 px-3 text-amber-300 font-semibold">🔒 1 com marca d'água</td>
                      <td className="py-2.5 px-3 text-emerald-400">✓ Ilimitadas</td>
                      <td className="py-2.5 px-3 text-emerald-400">✓ Ilimitadas em 300 DPI</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Rodapé de Ação e Checkout / Opção Gratuita */}
          <div className="relative p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-3.5">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 text-center sm:text-left">
              <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 text-[#F5D98A]">
                {selectedPlan === 'free' ? (
                  <Clock className="w-6 h-6 text-cyan-400" />
                ) : (
                  <ShieldCheck className="w-6 h-6 text-[#D4AF37]" />
                )}
              </div>
              <div>
                <h4 className="font-sans font-bold text-sm text-white">
                  {selectedPlan === 'free' 
                    ? 'Plano Gratuito Selecionado' 
                    : selectedPlan === 'monthly' 
                      ? 'Assinatura Mensal (R$ 100/mês)' 
                      : 'Acesso Vitalício sem Mensalidades (R$ 920 taxa única)'}
                </h4>
                <p className="font-sans text-xs text-white/60 mt-0.5">
                  {selectedPlan === 'free'
                    ? 'Acesso opcional para testes. Você pode fazer o upgrade a qualquer momento.'
                    : PAYMENT_CONFIG.pixKey
                      ? 'Cartão de Crédito via Checkout Seguro ou Pagamento Instantâneo via Pix.'
                      : 'Pagamento via Checkout Seguro.'}
                </p>
                {selectedPlan !== 'free' && checkoutOpened && (
                  <p className="font-sans text-xs text-[#F5D98A] mt-1.5">
                    Abrimos o pagamento em uma nova aba. Após a confirmação, seu plano é liberado
                    {userEmail ? <> na conta <strong>{userEmail}</strong></> : null} em até {PAYMENT_CONFIG.activationDeadline}.
                  </p>
                )}
                {selectedPlan !== 'free' && checkoutUnavailable && (
                  <p className="font-sans text-xs text-amber-300 mt-1.5">
                    Checkout indisponível no momento. Fale com o suporte para concluir sua assinatura.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 w-full md:w-auto">
              {/* Toggle Pix Button (apenas se não for o plano gratuito) */}
              {selectedPlan !== 'free' && PAYMENT_CONFIG.pixKey && (
                <button
                  onClick={() => setShowPixDetails(!showPixDetails)}
                  className="py-2.5 px-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-sans font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <QrCode className="w-4 h-4 text-[#D4AF37]" />
                  <span>{showPixDetails ? 'Ocultar Chave Pix' : 'Pagar com Pix'}</span>
                </button>
              )}

              {/* Ação Principal: Checkout ou Ativação Gratuita */}
              <button
                onClick={() => handleProceedAction()}
                className={`py-2.5 px-5 rounded-xl font-sans font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-md cursor-pointer active:scale-95 ${
                  selectedPlan === 'free'
                    ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                    : 'bg-gradient-to-r from-[#D4AF37] to-[#F5D98A] text-black hover:opacity-90 shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                }`}
              >
                {selectedPlan === 'free' ? (
                  <>
                    <Compass className="w-4 h-4 text-cyan-300" />
                    <span>Continuar com Plano Gratuito</span>
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-300" />
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 text-black" />
                    <span>Ir para Pagamento Seguro</span>
                    <ArrowRight className="w-3.5 h-3.5 text-black" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Detalhes Pix (Drawer) */}
          <AnimatePresence>
            {showPixDetails && selectedPlan !== 'free' && PAYMENT_CONFIG.pixKey && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3.5 p-4 sm:p-5 rounded-2xl bg-black/70 border border-white/15 space-y-3 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-sans font-bold text-white flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-[#D4AF37]" />
                    <span>Chave Pix Copia e Cola ({selectedPlan === 'monthly' ? 'R$ 100,00' : 'Acesso Vitalício: R$ 920,00'})</span>
                  </span>
                  <span className="text-[11px] text-white/50 font-sans">Liberação em até {PAYMENT_CONFIG.activationDeadline} após a confirmação</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={PAYMENT_CONFIG.pixKey}
                    className="w-full bg-black/80 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white/80 font-mono outline-none select-all"
                  />
                  <button
                    onClick={handleCopyPix}
                    className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/20 border border-white/20 text-white font-sans font-semibold text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer active:scale-95"
                  >
                    {copiedPix ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#F5D98A]" />}
                    <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Rodapé: Suporte WhatsApp & Fechar */}
          <div className="relative mt-4 pt-3.5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            {PAYMENT_CONFIG.whatsappSupportUrl ? (
              <a
                href={PAYMENT_CONFIG.whatsappSupportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors font-sans"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Dúvidas? Fale com o suporte no WhatsApp</span>
              </a>
            ) : <span />}

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs font-sans transition-colors cursor-pointer"
              >
                <span>{selectedPlan === 'free' ? 'Explorar Gratuito' : 'Fechar'}</span>
              </button>
            </div>
          </div>

        </div>
      </motion.div>
    </div>,
    document.body
  );
};
