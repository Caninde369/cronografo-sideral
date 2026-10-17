/**
 * Configuração Centralizada de Pagamentos & Checkout
 *
 * Todos os valores vêm das variáveis de ambiente do Vercel (VITE_*).
 * Não há valores padrão de propósito: se uma variável não estiver configurada,
 * o item correspondente simplesmente não aparece no modal de planos
 * (em vez de mostrar um link, telefone ou chave Pix falsos para o comprador).
 */

export const PAYMENT_CONFIG = {
  // URLs de Checkout para redirecionamento direto
  checkoutUrlLifetime: (import.meta.env.VITE_CHECKOUT_URL_LIFETIME as string | undefined) || '',

  checkoutUrlMonthly: (import.meta.env.VITE_CHECKOUT_URL_MONTHLY as string | undefined) || '',

  // Canal de suporte no WhatsApp (ex.: https://wa.me/5584XXXXXXXXX?text=...)
  whatsappSupportUrl: (import.meta.env.VITE_WHATSAPP_SUPPORT_URL as string | undefined) || '',

  // Chave PIX (Copia e Cola ou chave nominal). Vazio = seção Pix oculta.
  pixKey: (import.meta.env.VITE_PIX_KEY as string | undefined) || '',

  // Prazo informado ao comprador para liberação manual do plano
  activationDeadline: '24 horas',
};
