/**
 * Configuração Centralizada de Pagamentos & Checkout
 *
 * Links de checkout e Pix vêm das variáveis de ambiente do Vercel (VITE_*).
 * Se uma variável não estiver configurada, o item correspondente não aparece
 * (em vez de mostrar um link ou chave Pix falsos para o comprador).
 */

import { PLANOS } from '../src/plans/plans';

/** Número do WhatsApp de atendimento/suporte (só dígitos, com DDI). Pode ser trocado no Vercel. */
const WHATSAPP_NUMBER = ((import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) || '5511978964503').replace(/\D/g, '');

/** Link do WhatsApp com a mensagem já escrita. */
export const whatsappLink = (message: string): string =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

export const PAYMENT_CONFIG = {
  // URLs de Checkout para redirecionamento direto
  checkoutUrlLifetime: (import.meta.env.VITE_CHECKOUT_URL_LIFETIME as string | undefined) || '',

  checkoutUrlMonthly: (import.meta.env.VITE_CHECKOUT_URL_MONTHLY as string | undefined) || '',

  // Canal de suporte no WhatsApp (link completo opcional; senão, usa o número acima)
  whatsappSupportUrl: (import.meta.env.VITE_WHATSAPP_SUPPORT_URL as string | undefined)
    || whatsappLink('Olá! Preciso de ajuda com o Cronógrafo Sideral.'),

  // Chave PIX (Copia e Cola ou chave nominal). Vazio = seção Pix oculta.
  pixKey: (import.meta.env.VITE_PIX_KEY as string | undefined) || '',

  // Prazo informado ao comprador para liberação manual do plano
  activationDeadline: '24 horas',

  // Preços: fonte única em src/plans/plans.ts (o valor cobrado é o do link de pagamento — manter iguais)
  monthlyPrice: PLANOS.proMensal,
  lifetimePrice: PLANOS.fundador.preco,

  // Plano Fundador (vitalício): total de vagas
  lifetimeTotalSpots: PLANOS.fundador.vagas,

  // Vagas do Vitalício JÁ VENDIDAS — atualizado manualmente pelo Rafa no Vercel
  // (variável VITE_LIFETIME_SOLD + Redeploy). Se o Firestore (config/lifetime)
  // estiver disponível, vale o maior dos dois números.
  lifetimeSoldManual: Math.max(0, parseInt((import.meta.env.VITE_LIFETIME_SOLD as string | undefined) || '0', 10) || 0),
};
