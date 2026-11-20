/**
 * Planos e preços do Cronógrafo · fonte única (relatório "Planos v2 · 20/11/2026").
 * Landing e app leem daqui. Preço, data e vaga nunca ficam soltos nos componentes.
 *
 * Fases (calculadas, nunca trocadas à mão):
 *   1 · Fundadores  até 14/01/2027 23h59 (Brasília) ou até a 21ª venda, o que vier primeiro
 *   2 · Assinaturas Pro mensal e anual
 *   3 · Escolas     a partir de 06/02/2027, entra o Estudante (só com cupom de professor)
 *
 * Assinantes antigos de R$110 (legado) mantêm a cobrança: nada aqui mexe nisso.
 */

const WHATSAPP = ((import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) || '5511988791539').replace(/\D/g, '');

export const PLANOS = {
  whatsapp: WHATSAPP,
  fundador: {
    preco: 2127,
    parcelas: 12,
    vagas: 21,
    fim: '2027-01-14T23:59:00-03:00',
    // Cartão pelo link de pagamento (VITE_CHECKOUT_URL_LIFETIME). Fica false até o link cobrar R$2.127;
    // enquanto isso, o cartão segue pelo WhatsApp.
    cartaoPeloLink: false,
  },
  proMensal: 210,
  proAnual: 2127,
  estudante: { preco: 110, inicio: '2027-02-06T00:00:00-03:00', meses: 12 },
  teste: { horas: 7, diasValidade: 30 },
  indicacao: { descontoIndicado: 0.10, comissao: 0.20 },
  legado: 110,
  lancamento: 'verão de 2027',
  liberacao: '24 horas',
} as const;

export type Fase = 1 | 2 | 3;

/** vagasVendidas vem das vendas reais (Firestore config/lifetime e VITE_LIFETIME_SOLD), nunca de número inventado. */
export const faseAtual = (agora: Date, vagasVendidas: number): Fase => {
  const fimFundador = new Date(PLANOS.fundador.fim);
  if (vagasVendidas < PLANOS.fundador.vagas && agora <= fimFundador) return 1;
  if (agora < new Date(PLANOS.estudante.inicio)) return 2;
  return 3;
};

/** Vendas informadas à mão na Vercel (VITE_LIFETIME_SOLD). O Firestore pode trazer um número maior. */
export const vendidasManual = Math.max(0, parseInt((import.meta.env.VITE_LIFETIME_SOLD as string | undefined) || '0', 10) || 0);

/**
 * Simulação para conferir a troca de fase sem mexer no código:
 *   ?simular-data=2027-01-15   e/ou   ?simular-vendas=21
 */
export const simulacao = (): { agora?: Date; vendidas?: number } => {
  try {
    const q = new URLSearchParams(window.location.search);
    const d = q.get('simular-data'); const v = q.get('simular-vendas');
    return {
      agora: d && !isNaN(new Date(`${d}T12:00:00-03:00`).getTime()) ? new Date(`${d}T12:00:00-03:00`) : undefined,
      vendidas: v != null && /^\d+$/.test(v) ? parseInt(v, 10) : undefined,
    };
  } catch { return {}; }
};

// ── Valores derivados (sempre calculados) ─────────────────────────────────────
const cents = (n: number) => Math.round(n * 100) / 100;
export const parcelaFundador = cents(PLANOS.fundador.preco / PLANOS.fundador.parcelas);   // 177,25
export const anualPorMes = cents(PLANOS.proAnual / 12);                                   // 177,25
export const economiaAnual = PLANOS.proMensal * 12 - PLANOS.proAnual;                     // 393
export const economiaAnualPct = Math.round((economiaAnual / (PLANOS.proMensal * 12)) * 100); // 16

/** R$ no formato brasileiro: 177.25 → "177,25"; 2127 → "2.127". */
export const brl = (n: number) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });

export const waLink = (msg: string) => `https://wa.me/${PLANOS.whatsapp}?text=${encodeURIComponent(msg)}`;

// ── Textos fixos ─────────────────────────────────────────────────────────────
export const LICENCA =
  'A vaga de Fundador é a compra de uma licença de uso vitalícia, pessoal e intransferível, válida enquanto o Cronógrafo existir. ' +
  'Não é investimento nem participação na empresa. Você tem 7 dias para desistir, como garante o Código de Defesa do Consumidor.';

export const MSG = {
  geral: 'Olá! Vim pelo site do Cronógrafo Sideral e tenho uma dúvida.',
  fundadorPix: `Olá! Quero a vaga de Fundador do Cronógrafo pagando com Pix à vista (R$ ${brl(PLANOS.fundador.preco)}).`,
  fundadorCartao: `Olá! Quero a vaga de Fundador do Cronógrafo no cartão, em ${PLANOS.fundador.parcelas}x de R$ ${brl(parcelaFundador)} sem juros.`,
  fundadorDuvida: 'Olá! Tenho uma dúvida sobre a vaga de Fundador do Cronógrafo.',
  fundadorComprovante: 'Olá! Paguei a vaga de Fundador do Cronógrafo com Pix. Segue o comprovante.',
  proMensal: `Olá! Quero assinar o Plano Pro mensal do Cronógrafo (R$ ${brl(PLANOS.proMensal)} por mês).`,
  proAnual: `Olá! Quero assinar o Plano Pro anual do Cronógrafo (R$ ${brl(PLANOS.proAnual)} por ano).`,
  estudante: 'Olá! Tenho um cupom de estudante para o Cronógrafo.',
};

export const FAQ = (fase: Fase): [string, string][] => fase === 1 ? [
  ['O que acontece quando as vagas acabam?', 'O Fundador fecha para sempre. Abrem as assinaturas do Plano Pro, mensal e anual.'],
  ['O teste grátis conta horas corridas?', `Não. São ${PLANOS.teste.horas} horas de uso, que você gasta como quiser em até ${PLANOS.teste.diasValidade} dias.`],
  ['O que é o Clube de Membros?', 'O grupo dos Fundadores. Vocês sugerem as próximas ferramentas, e cada pedido passa por um estudo com quem pediu.'],
  ['A vaga de Fundador é um investimento?', LICENCA],
] : [
  ['Posso trocar do mensal para o anual?', 'Sim. A diferença entra no próximo pagamento.'],
  ...(fase === 3 ? [['Como funciona o plano Estudante?', `O aluno usa o cupom do professor, que precisa ter o plano anual ativo. Vale por ${PLANOS.estudante.meses} meses.`] as [string, string]] : []),
];
