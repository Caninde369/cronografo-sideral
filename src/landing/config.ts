import { PLANOS, vendidasManual } from '../plans/plans';

/**
 * Landing do Cronógrafo · contatos e mensagens.
 * Preços, vagas e datas vêm de src/plans/plans.ts (fonte única do site e do app).
 * Preço, vaga e número nunca aparecem soltos nos componentes.
 *
 * Os preços também aparecem no app (lib/paymentConfig.ts): ao mudar aqui, mude lá.
 */
export const LANDING = {
  // Só números, com 55 e DDD. Pode ser trocado no Vercel (VITE_WHATSAPP_NUMBER), como no app.
  whatsapp: ((import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) || '5511988791539').replace(/\D/g, ''),
  msgFundador: 'Olá! Quero saber sobre a vaga de Fundador do Cronógrafo Sideral.',
  msgPro: 'Olá! Quero ser avisado quando o Plano Pro do Cronógrafo Sideral abrir.',
  msgGeral: 'Olá! Vim pelo site do Cronógrafo Sideral e tenho uma dúvida.',
  appUrl: '/app',
  instagram: 'https://www.instagram.com/cronografosideral/',
  youtube: 'https://www.youtube.com/@Cronografosideral',
  tiktok: 'https://www.tiktok.com/@cronografo_astrologia',
  email: 'contato@cronografosideral.com',
  precoMensal: PLANOS.proMensal,
  precoAnual: PLANOS.proAnual,
  precoFundador: PLANOS.fundador.preco,
  parcelasFundador: PLANOS.fundador.parcelas,
  vagasFundador: PLANOS.fundador.vagas,
  vagasVendidas: vendidasManual,
  fimFundador: '14/01',
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
