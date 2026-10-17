/**
 * Configuração Centralizada de Pagamentos & Checkout
 * Suporta Stripe, AbacatePay, NuPay, Asaas, MercadoPago ou PIX Direto via Vercel / .env
 */

export const PAYMENT_CONFIG = {
  // URLs de Checkout para redirecionamento direto
  checkoutUrlLifetime: 
    import.meta.env.VITE_CHECKOUT_URL_LIFETIME || 
    import.meta.env.VITE_CHECKOUT_URL || 
    'https://checkout.nubank.com.br/WYxT1HYG5fay6s65',

  checkoutUrlMonthly: 
    import.meta.env.VITE_CHECKOUT_URL_MONTHLY || 
    import.meta.env.VITE_CHECKOUT_URL || 
    'https://checkout.nubank.com.br/WYxT1HYG5fay6s65',

  // Canal de suporte no WhatsApp
  whatsappSupportUrl: 
    import.meta.env.VITE_WHATSAPP_SUPPORT_URL || 
    'https://wa.me/5511999999999?text=Ol%C3%A1%2C%20tenho%20interesse%20em%20assinar%20o%20Cron%C3%B3grafo%20Sideral.',

  // Chave PIX (Copia e Cola ou chave nominal)
  pixKey: 
    import.meta.env.VITE_PIX_KEY || 
    '00020126580014br.gov.bcb.pix0136cronografo.sideral@pagamentos.com5204000053039865802BR5920CRONOGRAFO SIDERAL6009SAO PAULO62070503***6304E8A2',
};
