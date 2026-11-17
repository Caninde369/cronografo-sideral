/**
 * Landing do Cronógrafo · valores que mudam ficam SÓ aqui.
 * Preço, vaga e número nunca aparecem soltos nos componentes.
 *
 * Os preços também aparecem no app (lib/paymentConfig.ts): ao mudar aqui, mude lá.
 */
export const LANDING = {
  // Só números, com 55 e DDD. Pode ser trocado no Vercel (VITE_WHATSAPP_NUMBER), como no app.
  whatsapp: ((import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) || '5511988791539').replace(/\D/g, ''),
  msgFundador: 'Olá, Rafael! Quero saber sobre a vaga de Fundador do Cronógrafo.',
  msgPro: 'Olá, Rafael! Quero ser avisado quando o Pro do Cronógrafo abrir.',
  msgMensal: 'Olá, Rafael! Quero assinar o Mensal do Cronógrafo pagando por Pix.',
  msgGeral: 'Olá, Rafael! Vim pela página do Cronógrafo e tenho uma dúvida.',
  appUrl: '/app',
  instagram: 'https://www.instagram.com/cronografosideral/',
  youtube: 'https://www.youtube.com/@Cronografosideral',
  tiktok: 'https://www.tiktok.com/@cronografo_astrologia',
  email: 'contato@cronografosideral.com',
  precoMensal: 110,
  precoMensalLancamento: 350, // valor do Mensal depois do lançamento
  gratuitoAte: '03/12',
  // Cartão do Vitalício: true abre o link do Nubank (VITE_CHECKOUT_URL_LIFETIME).
  // Fica false até o link no Nubank cobrar o valor novo (R$1.457); enquanto isso o cartão vai pelo WhatsApp.
  cartaoPeloLink: false,
  precoAnual: 1197,
  precoFundador: 1457,
  parcelasFundador: 12,
  vagasFundador: 21,
  // Atualizar à mão a cada venda real (ou no Vercel: VITE_LIFETIME_SOLD, o mesmo número do app)
  vagasVendidas: Math.max(0, parseInt((import.meta.env.VITE_LIFETIME_SOLD as string | undefined) || '0', 10) || 0),
  aberturaFundador: '03/12',
  aberturaPro: 'janeiro',
} as const;

export const waLink = (msg: string) =>
  `https://wa.me/${LANDING.whatsapp}?text=${encodeURIComponent(msg)}`;

/** R$ no formato brasileiro: 99.75 → "99,75"; 1997 → "1.997". */
export const brl = (n: number) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });

// Valores derivados: calculados, nunca digitados à mão
export const anualPorMes = Math.round((LANDING.precoAnual / 12) * 100) / 100;              // 99,75
export const economiaAnual = LANDING.precoMensal * 12 - LANDING.precoAnual;                  // 327
export const parcelaFundador = Math.round((LANDING.precoFundador / LANDING.parcelasFundador) * 100) / 100; // 166,42
