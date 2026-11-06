/**
 * Conteúdo das tooltips do Cronógrafo (astros, aspectos, signos, termos, decanatos, casas).
 *
 * PADRÃO DE COPY v3 (aprovado pelo Rafa):
 *   • Título (nome do item) — símbolo na cor do item, gradiente dessa cor no topo
 *   • Palavras-chave (3–4) em tags
 *   • Descrição de 1–2 frases sobre o SIGNIFICADO do item (sem comentar a posição atual)
 * "Ver detalhes": linhas com ícone e cor (verde = favorável, vermelho = desfavorável,
 * âmbar = retrógrado, cinza = neutro), astros na cor de cada astro, signos na cor do elemento.
 *
 * Os textos ficam todos neste arquivo para revisão rápida.
 */
import { ZODIAC_DATA } from '../../components/zodiac';
import { CELESTIAL_GLYPHS } from '../../components/icons';
import { Aspect, getAspectTiming } from './aspects';
import { getDecanRuler } from './dignities';
import { getSignTerms, getTermAt } from './terms';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

export type TooltipKind = 'planet' | 'aspect' | 'sign' | 'term' | 'decan' | 'house';

/** Pedaço de texto de uma linha de detalhe. */
export interface TooltipPart {
  text: string;
  color?: string;
  /** números em fonte mono */
  mono?: boolean;
  /** texto apagado (ex.: "Nenhum agora", orbe ao lado do astro) */
  muted?: boolean;
  /** símbolo astrológico (um pouco maior) */
  sym?: boolean;
}

export interface TooltipRow {
  label: string;
  /** classe do ícone Tabler (ex.: 'ti-compass') */
  icon: string;
  /** cor do ícone (e da etiqueta, se `pill`) */
  color: string;
  /** cada item é uma linha; cada linha é uma lista de pedaços */
  lines: TooltipPart[][];
  /** mostra o valor como etiqueta colorida (estados: Direto, Exaltação, Se formando…) */
  pill?: boolean;
}

export interface TooltipSegment {
  label: string;
  /** largura relativa (graus) */
  size: number;
  active: boolean;
}

export interface TooltipModel {
  key: string;
  kind: TooltipKind;
  glyph: string;
  /** cor do símbolo, das tags e do gradiente do topo */
  accent: string;
  title: string;
  /** palavras-chave (viram tags) */
  keywords: string[];
  text: string;
  rows: TooltipRow[];
  segments?: TooltipSegment[];
}

export interface TooltipContext {
  /** longitudes no zodíaco exibido (sideral ou tropical) */
  longitudes: Record<string, number>;
  retrograde: Record<string, boolean>;
  houses: Record<string, number>;
  /** cúspides no zodíaco exibido */
  houseCusps: number[];
  aspects: Aspect[];
  visible: Record<string, boolean>;
  /** cor de cada astro (a mesma do relógio) */
  colors: Record<string, string>;
  theme?: 'dark' | 'light';
  moon?: { phaseName: string; illum: number; rise: string; set: string; cycleName?: string };
  now: Date;
  location?: { latitude: number; longitude: number };
}

// ─────────────────────────────────────────────────────────────────────────────
// Nomes e copy
// ─────────────────────────────────────────────────────────────────────────────

export const BODY_NAMES: Record<string, string> = {
  sun: 'Sol', moon: 'Lua', mercury: 'Mercúrio', venus: 'Vênus', mars: 'Marte',
  jupiter: 'Júpiter', saturn: 'Saturno', uranus: 'Urano', neptune: 'Netuno', pluto: 'Plutão',
  lilith: 'Lilith', northNode: 'Nodo Norte', southNode: 'Nodo Sul', chiron: 'Quíron',
  ceres: 'Ceres', pallas: 'Pallas', juno: 'Juno', vesta: 'Vesta', partOfFortune: 'Parte da Fortuna',
};

/** "do Sol", "da Lua", "de Marte"… */
const OF_BODY: Record<string, string> = {
  sun: 'do Sol', moon: 'da Lua', northNode: 'do Nodo Norte', southNode: 'do Nodo Sul',
  partOfFortune: 'da Parte da Fortuna',
};
const ofBody = (id: string) => OF_BODY[id] ?? `de ${BODY_NAMES[id] ?? id}`;

type Copy = { kw: string; text: string };

const PLANET_COPY: Record<string, Copy> = {
  sun: { kw: 'Essência · Vitalidade · Propósito', text: 'Representa a essência e a força vital. É o centro da personalidade: a consciência de quem somos, a vontade criativa e o propósito que dá direção à vida.' },
  moon: { kw: 'Emoções · Instinto · Segurança', text: 'Rege as emoções, os instintos e o mundo interior. Mostra como buscamos segurança e acolhimento, e guarda a memória afetiva e as raízes do passado.' },
  mercury: { kw: 'Mente · Comunicação · Aprendizado', text: 'Simboliza a mente e a troca de informações. Rege como pensamos, aprendemos, falamos e negociamos, ligando ideias, pessoas e lugares.' },
  venus: { kw: 'Amor · Beleza · Valores', text: 'Representa o amor, a beleza e a harmonia. Rege os relacionamentos, o prazer, o gosto e aquilo que valorizamos, inclusive o dinheiro.' },
  mars: { kw: 'Ação · Desejo · Coragem', text: 'Simboliza a ação, o desejo e a energia de conquista. Rege a força de vontade, a coragem, a raiva e a forma como lutamos pelo que queremos.' },
  jupiter: { kw: 'Expansão · Fé · Sabedoria', text: 'Representa a expansão, o otimismo e a busca de sentido. Rege a sorte, a fé, a filosofia, os estudos superiores e tudo o que nos faz crescer.' },
  saturn: { kw: 'Estrutura · Disciplina · Tempo', text: 'Simboliza a estrutura, os limites e a responsabilidade. Rege o tempo, as lições, a ambição e a maestria conquistada com esforço e paciência.' },
  uranus: { kw: 'Liberdade · Inovação · Ruptura', text: 'Representa a originalidade e as mudanças súbitas. Rege a liberdade, a tecnologia, as revoluções e o inesperado que rompe padrões.' },
  neptune: { kw: 'Intuição · Sonho · Espiritualidade', text: 'Simboliza a espiritualidade, a imaginação e a dissolução de fronteiras. Rege a intuição, a compaixão, a arte, a ilusão e o inconsciente coletivo.' },
  pluto: { kw: 'Transformação · Poder · Renascimento', text: 'Representa a transformação profunda e o que está oculto. Rege o poder, as crises, a morte e o renascimento, e os processos de cura radical.' },
  lilith: { kw: 'Sombra · Instinto · Autonomia', text: 'Simboliza o lado sombra e a força instintiva que não se submete. Representa o desejo cru, a independência radical e o que foi exilado da consciência.' },
  northNode: { kw: 'Destino · Evolução · Missão da alma', text: 'Aponta o caminho de evolução da alma nesta vida. Indica as qualidades e experiências que precisamos buscar, mesmo fora da zona de conforto.' },
  southNode: { kw: 'Passado · Talentos · Desapego', text: 'Representa a bagagem kármica: talentos inatos e padrões confortáveis. É a nossa base, mas também aquilo que precisamos soltar para evoluir.' },
  chiron: { kw: 'Ferida · Cura · Ensino', text: 'Conhecido como o curador ferido, mostra a nossa dor mais profunda e o dom que nasce dela: a capacidade de curar e de ensinar.' },
  ceres: { kw: 'Nutrição · Cuidado · Ciclos', text: 'Rege a nutrição, o cuidado e o ciclo de perda e retorno. Mostra como nutrimos a nós e aos outros, e como lidamos com a separação.' },
  pallas: { kw: 'Estratégia · Sabedoria · Justiça', text: 'Representa a inteligência estratégica e criativa. Simboliza a capacidade de reconhecer padrões, encontrar soluções e lutar por ideais.' },
  juno: { kw: 'Compromisso · Parceria · Lealdade', text: 'Rege os compromissos e as parcerias duradouras. Simboliza a busca por igualdade e lealdade, e o que esperamos de quem caminha ao nosso lado.' },
  vesta: { kw: 'Devoção · Foco · Chama interior', text: 'Representa a chama sagrada interior. Simboliza aquilo a que nos dedicamos com foco total, pureza de intenção e entrega.' },
  partOfFortune: { kw: 'Prosperidade · Sorte · Bem-estar', text: 'Ponto calculado a partir do Sol, da Lua e do Ascendente. Indica onde a vida flui com mais facilidade: prosperidade, saúde e alegria verdadeira.' },
};

/** Signos, na ordem de Áries a Peixes. */
const SIGN_COPY: Copy[] = [
  { kw: 'Iniciativa · Coragem · Impulso', text: 'Energia de início e de ação. Pioneiro e assertivo, Áries abre caminhos com entusiasmo e liderança, mas pode ser impaciente e impulsivo.' },
  { kw: 'Estabilidade · Prazer · Persistência', text: 'Energia de estabilidade e de construção. Prático e sensorial, Touro busca segurança material, aprecia os prazeres da vida e resiste a mudanças.' },
  { kw: 'Comunicação · Curiosidade · Versatilidade', text: 'Energia de troca e de movimento mental. Adaptável e sociável, Gêmeos aprende rápido e conecta ideias e pessoas, mas pode se dispersar.' },
  { kw: 'Cuidado · Sensibilidade · Proteção', text: 'Energia de nutrição e de pertencimento. Emotivo e intuitivo, Câncer valoriza o lar, a família e a memória, com forte instinto de proteger.' },
  { kw: 'Expressão · Criatividade · Generosidade', text: 'Energia de brilho e de autoexpressão. Carismático e confiante, Leão cria, lidera com o coração e busca reconhecimento.' },
  { kw: 'Análise · Serviço · Aperfeiçoamento', text: 'Energia de discernimento e de cuidado prático. Detalhista e eficiente, Virgem organiza, aprimora e gosta de ser útil, mas tende à autocrítica.' },
  { kw: 'Harmonia · Diplomacia · Parceria', text: 'Energia de equilíbrio e de relação. Sociável e justo, Libra busca beleza, acordo e cooperação, pesando os dois lados antes de decidir.' },
  { kw: 'Intensidade · Transformação · Profundidade', text: 'Energia de profundidade e regeneração. Magnético e investigativo, Escorpião mergulha nos mistérios, busca a verdade oculta e se transforma pelas crises.' },
  { kw: 'Expansão · Liberdade · Sentido', text: 'Energia de busca e de horizonte. Aventureiro e filosófico, Sagitário procura a verdade por meio do conhecimento, das viagens e da fé.' },
  { kw: 'Ambição · Disciplina · Estrutura', text: 'Energia de construção e de maturidade. Paciente e responsável, Capricórnio ergue bases sólidas para metas de longo prazo.' },
  { kw: 'Inovação · Liberdade · Coletivo', text: 'Energia de visão e de independência. Original e humanitário, Aquário valoriza a amizade, os ideais coletivos e o futuro.' },
  { kw: 'Compaixão · Intuição · Espiritualidade', text: 'Energia de dissolução e de entrega. Sensível e sonhador, Peixes sente o todo, conecta-se ao inconsciente e cura pela empatia.' },
];

const ASPECT_INFO: Record<string, { name: string; symbol: string; angle: number; color: string; connector: string } & Copy> = {
  conjunction: { name: 'Conjunção', symbol: '☌', angle: 0, color: '#4870FF', connector: 'junto de',
    kw: 'Fusão · Intensidade · Novo ciclo', text: 'Dois astros no mesmo ponto do zodíaco (0°). As energias se fundem e se potencializam, marcando o início de um novo ciclo.' },
  opposition: { name: 'Oposição', symbol: '☍', angle: 180, color: '#f87171', connector: 'oposto a',
    kw: 'Polaridade · Tensão · Consciência', text: 'Dois astros em lados opostos (180°). As energias se confrontam e pedem equilíbrio: o outro funciona como espelho.' },
  square: { name: 'Quadratura', symbol: '□', angle: 90, color: '#FB923C', connector: 'em quadratura com',
    kw: 'Desafio · Atrito · Ação', text: 'Dois astros em ângulo reto (90°). As energias entram em atrito e geram crise, mas também a força para agir e mudar.' },
  trine: { name: 'Trígono', symbol: '△', angle: 120, color: '#4ade80', connector: 'em trígono com',
    kw: 'Fluidez · Harmonia · Talento', text: 'Dois astros a 120°, em signos do mesmo elemento. As energias fluem com naturalidade, trazendo facilidade e dons naturais.' },
  sextile: { name: 'Sextil', symbol: '✶', angle: 60, color: '#60a5fa', connector: 'em sextil com',
    kw: 'Oportunidade · Cooperação · Estímulo', text: 'Dois astros a 60°. As energias se estimulam e abrem oportunidades, que pedem uma pequena iniciativa para acontecer.' },
};

/**
 * Termos egípcios: copy própria para cada signo + regente (60 combinações),
 * na mesma ordem da tabela de lib/astrology/terms.ts.
 */
const TERM_COPY: Record<string, Copy>[] = [
  /* Áries */ {
    jupiter: { kw: 'Liderança · Entusiasmo · Fé em si · Sorte para começar', text: 'Iniciativa abençoada: o impulso de começar ganha otimismo, visão e sorte para liderar.' },
    venus: { kw: 'Paixão · Desejo · Atração · Conquista amorosa', text: 'O fogo de Áries encontra o afeto: desejo intenso, paixões rápidas e charme direto.' },
    mercury: { kw: 'Ideias rápidas · Debate · Decisão · Raciocínio ágil', text: 'A mente acelera: pensamento rápido, fala direta e decisões tomadas no calor do momento.' },
    mars: { kw: 'Força pura · Combate · Ousadia · Competição', text: 'Marte em casa: energia máxima de ação, coragem para enfrentar e espírito competitivo.' },
    saturn: { kw: 'Inícios · Trabalhos árduos · Lições · Experiências impetuosas', text: 'O impulso de começar encontra limites: conquistas que custam esforço e ensinam pela experiência.' },
  },
  /* Touro */ {
    venus: { kw: 'Prazer · Conforto · Beleza · Sensualidade', text: 'Vênus em casa: prazer dos sentidos, apreço pelo belo e gosto pelo conforto e pela fartura.' },
    mercury: { kw: 'Praticidade · Negócios · Bom senso · Aprendizado firme', text: 'A mente se torna concreta: raciocínio prático, talento para negócios e aprendizado que fixa.' },
    jupiter: { kw: 'Fartura · Prosperidade · Generosidade · Estabilidade', text: 'Crescimento material: abundância, generosidade e confiança construída sobre bases firmes.' },
    saturn: { kw: 'Persistência · Economia · Trabalho duro · Paciência', text: 'A construção pede tempo: esforço contínuo, controle dos recursos e resistência para durar.' },
    mars: { kw: 'Teimosia · Força física · Determinação · Posse', text: 'A energia ganha peso: determinação inabalável, força de resistência e defesa do que é seu.' },
  },
  /* Gêmeos */ {
    mercury: { kw: 'Inteligência · Comunicação · Curiosidade · Agilidade', text: 'Mercúrio em casa: mente brilhante, fala fácil e curiosidade por tudo o que é novo.' },
    jupiter: { kw: 'Conhecimento · Ensino · Ideias amplas · Bom humor', text: 'A curiosidade se expande: gosto pelo estudo, talento para ensinar e otimismo nas trocas.' },
    venus: { kw: 'Charme · Conversa · Leveza · Arte da palavra', text: 'A mente ganha encanto: diálogo gentil, sedução pelas palavras e sensibilidade artística.' },
    mars: { kw: 'Argumento · Crítica · Inquietação · Discussão', text: 'As ideias viram armas: debate afiado, impaciência mental e palavras que ferem ou defendem.' },
    saturn: { kw: 'Estudo sério · Concentração · Método · Preocupação', text: 'A mente pede disciplina: estudo profundo, raciocínio metódico e tendência à preocupação.' },
  },
  /* Câncer */ {
    mars: { kw: 'Proteção · Reatividade · Defesa da família · Emoção intensa', text: 'O cuidado vira luta: instinto de proteger, reações emocionais fortes e defesa do lar.' },
    venus: { kw: 'Ternura · Acolhimento · Afeto familiar · Delicadeza', text: 'O cuidado ganha doçura: carinho, acolhimento e prazer na intimidade da casa.' },
    mercury: { kw: 'Memória · Intuição · Adaptação · Imaginação', text: 'A mente sente: memória afetiva, percepção intuitiva e facilidade de se adaptar ao ambiente.' },
    jupiter: { kw: 'Generosidade · Proteção · Fartura no lar · Fé', text: 'Júpiter exaltado: cuidado generoso, abundância no lar e uma fé que protege.' },
    saturn: { kw: 'Deveres familiares · Retraimento · Lições afetivas · Cautela', text: 'O afeto encontra limites: deveres com a família, cautela emocional e lições que amadurecem.' },
  },
  /* Leão */ {
    jupiter: { kw: 'Nobreza · Generosidade · Liderança · Confiança', text: 'O brilho se expande: generosidade, magnanimidade e liderança que inspira confiança.' },
    venus: { kw: 'Romance · Arte · Prazer · Charme', text: 'O coração se expressa: romances, criatividade artística e prazer em ser admirado.' },
    saturn: { kw: 'Autoridade · Dever · Orgulho testado · Reconhecimento suado', text: 'O brilho é testado: liderança que pesa, reconhecimento que exige esforço e lições de orgulho.' },
    mercury: { kw: 'Eloquência · Planejamento · Criatividade mental · Persuasão', text: 'A mente ganha palco: fala marcante, ideias criativas e talento para persuadir.' },
    mars: { kw: 'Bravura · Ímpeto · Ambição · Imposição', text: 'O fogo se intensifica: coragem heroica, ambição de vencer e vontade de se impor.' },
  },
  /* Virgem */ {
    mercury: { kw: 'Análise · Precisão · Inteligência prática · Ofício', text: 'Mercúrio em casa e exaltado: mente analítica, precisão nos detalhes e excelência no ofício.' },
    venus: { kw: 'Cuidado · Gentileza · Refinamento · Serviço', text: 'A ordem ganha delicadeza: atenção ao outro, gosto refinado e prazer em servir.' },
    jupiter: { kw: 'Utilidade · Aperfeiçoamento · Saúde · Ensino prático', text: 'O detalhe se amplia: vontade de melhorar, cuidado com a saúde e sabedoria aplicada.' },
    mars: { kw: 'Rigor · Crítica · Trabalho intenso · Eficiência', text: 'O esforço se aguça: trabalho incansável, exigência alta e senso crítico afiado.' },
    saturn: { kw: 'Disciplina · Escrúpulo · Contenção · Responsabilidade', text: 'A ordem vira dever: método rígido, perfeccionismo e responsabilidade com as tarefas.' },
  },
  /* Libra */ {
    saturn: { kw: 'Justiça · Acordos sérios · Imparcialidade · Compromisso', text: 'Saturno exaltado: equilíbrio construído com regras, acordos duradouros e senso de justiça.' },
    mercury: { kw: 'Diplomacia · Negociação · Mediação · Argumentação', text: 'A mente busca o meio-termo: talento para negociar, conciliar e ouvir os dois lados.' },
    jupiter: { kw: 'Benevolência · Sociedade · Harmonia · Prosperidade a dois', text: 'As relações se ampliam: parcerias generosas, bom convívio e crescimento a dois.' },
    venus: { kw: 'Beleza · Amor · Elegância · Harmonia', text: 'Vênus em casa: encanto, estética apurada e prazer nas relações e na arte.' },
    mars: { kw: 'Conflito · Disputa · Desejo · Afirmação diante do outro', text: 'O equilíbrio é desafiado: disputas, paixões e a necessidade de se afirmar nas relações.' },
  },
  /* Escorpião */ {
    mars: { kw: 'Intensidade · Estratégia · Coragem · Poder', text: 'Marte em casa: força profunda, estratégia silenciosa e coragem diante das crises.' },
    venus: { kw: 'Paixão · Magnetismo · Desejo · Entrega', text: 'A intensidade encontra o afeto: paixão profunda, magnetismo e entrega total.' },
    mercury: { kw: 'Investigação · Perspicácia · Segredo · Mente penetrante', text: 'A mente mergulha: investigação, perspicácia psicológica e talento para descobrir segredos.' },
    jupiter: { kw: 'Regeneração · Fé profunda · Recursos partilhados · Cura', text: 'A transformação se amplia: renascimento, fé nas crises e ganhos com recursos em comum.' },
    saturn: { kw: 'Provação · Controle · Perda · Resistência', text: 'A profundidade pesa: provações, controle das emoções e força para atravessar perdas.' },
  },
  /* Sagitário */ {
    jupiter: { kw: 'Fé · Sabedoria · Expansão · Fortuna', text: 'Júpiter em casa: otimismo, visão ampla, fé e sorte em viagens e estudos.' },
    venus: { kw: 'Alegria · Liberdade afetiva · Aventura · Generosidade', text: 'A busca ganha leveza: alegria de viver, amores livres e prazer na aventura.' },
    mercury: { kw: 'Filosofia · Ensino · Debate de ideias · Visão', text: 'A mente mira longe: pensamento filosófico, talento para ensinar e ideias de grande alcance.' },
    saturn: { kw: 'Doutrina · Rigidez · Responsabilidade moral · Busca séria', text: 'A fé encontra estrutura: princípios firmes, estudo sério e o peso da responsabilidade moral.' },
    mars: { kw: 'Ímpeto · Cruzada · Ousadia · Exagero', text: 'O fogo dispara: entusiasmo combativo, luta por ideais e tendência a exagerar.' },
  },
  /* Capricórnio */ {
    mercury: { kw: 'Planejamento · Estratégia · Pragmatismo · Organização', text: 'A mente constrói: planejamento de longo prazo, visão estratégica e senso prático.' },
    jupiter: { kw: 'Ambição · Ascensão · Autoridade · Prestígio', text: 'O crescimento ganha escada: ambição recompensada, ascensão profissional e prestígio.' },
    venus: { kw: 'Lealdade · Elegância sóbria · Compromisso · Valor duradouro', text: 'O afeto se torna sólido: amor leal, gosto clássico e valor ao que é duradouro.' },
    saturn: { kw: 'Disciplina · Perseverança · Austeridade · Maestria', text: 'Saturno em casa: esforço constante, rigor e maestria conquistada com o tempo.' },
    mars: { kw: 'Determinação · Conquista · Eficiência · Firmeza', text: 'Marte exaltado: ação estratégica, força para conquistar metas e firmeza implacável.' },
  },
  /* Aquário */ {
    mercury: { kw: 'Originalidade · Ideias novas · Ciência · Genialidade', text: 'A mente inova: pensamento original, interesse por ciência e ideias à frente do tempo.' },
    venus: { kw: 'Amizade · Afeto livre · Fraternidade · Gentileza', text: 'O afeto se torna amizade: laços livres, fraternidade e encanto pelo diferente.' },
    jupiter: { kw: 'Humanitarismo · Ideais · Coletivo · Visão de futuro', text: 'Os ideais se expandem: causas coletivas, generosidade com o grupo e esperança no futuro.' },
    mars: { kw: 'Rebeldia · Ativismo · Ruptura · Independência', text: 'A liberdade vira luta: rebeldia, ativismo e coragem para romper com o estabelecido.' },
    saturn: { kw: 'Estrutura coletiva · Distanciamento · Responsabilidade social · Rigor', text: 'Saturno em casa: ideais com estrutura, responsabilidade social e certa frieza racional.' },
  },
  /* Peixes */ {
    venus: { kw: 'Amor incondicional · Compaixão · Arte · Inspiração', text: 'Vênus exaltada: amor sem condições, sensibilidade artística e inspiração espiritual.' },
    jupiter: { kw: 'Fé · Espiritualidade · Generosidade · Proteção', text: 'Júpiter em casa: fé profunda, compaixão generosa e proteção invisível.' },
    mercury: { kw: 'Imaginação · Intuição · Poesia · Dispersão', text: 'A mente sonha: imaginação fértil, pensamento intuitivo e dificuldade com o concreto.' },
    mars: { kw: 'Luta silenciosa · Sacrifício · Ação intuitiva · Entrega', text: 'A ação se dissolve: energia guiada pela intuição, entrega a causas e batalhas silenciosas.' },
    saturn: { kw: 'Renúncia · Isolamento · Carma · Disciplina espiritual', text: 'O sonho encontra limites: renúncia, recolhimento e lições kármicas que amadurecem a fé.' },
  },
];

/** Decanatos (faces): copy pelo regente. */
const DECAN_COPY: Record<string, Copy> = {
  sun: { kw: 'Brilho · Liderança · Vitalidade', text: 'Terço do signo regido pelo Sol: o signo se expressa com brilho, confiança e liderança.' },
  moon: { kw: 'Sensibilidade · Receptividade · Memória', text: 'Terço do signo regido pela Lua: o signo se expressa com sensibilidade, acolhimento e intuição.' },
  mercury: { kw: 'Raciocínio · Comunicação · Habilidade', text: 'Terço do signo regido por Mercúrio: o signo se expressa com inteligência, comunicação e destreza.' },
  venus: { kw: 'Beleza · Afeto · Harmonia', text: 'Terço do signo regido por Vênus: o signo se expressa com beleza, afeto e harmonia.' },
  mars: { kw: 'Ação · Coragem · Iniciativa', text: 'Terço do signo regido por Marte: o signo se expressa com ação, coragem e iniciativa.' },
  jupiter: { kw: 'Expansão · Fé · Generosidade', text: 'Terço do signo regido por Júpiter: o signo se expressa com expansão, fé e generosidade.' },
  saturn: { kw: 'Foco · Maturidade · Disciplina', text: 'Terço do signo regido por Saturno: o signo se expressa com foco, maturidade e disciplina.' },
};

/** Casas 1 a 12. */
const HOUSE_COPY: ({ title: string } & Copy)[] = [
  { title: 'Casa 1 · Ascendente', kw: 'Identidade · Corpo · Inícios', text: 'Representa o eu: a aparência, a personalidade, a vitalidade e a forma como nos apresentamos ao mundo e começamos as coisas.' },
  { title: 'Casa 2', kw: 'Recursos · Valores · Autoestima', text: 'Rege os bens materiais, o dinheiro, os talentos e a autoestima: aquilo que temos e aquilo que valorizamos.' },
  { title: 'Casa 3', kw: 'Comunicação · Aprendizado · Entorno', text: 'Rege a mente concreta, os estudos básicos, irmãos, vizinhos, deslocamentos curtos e as trocas do dia a dia.' },
  { title: 'Casa 4 · Fundo do Céu', kw: 'Lar · Família · Raízes', text: 'Simboliza o lar, os ancestrais, a vida privada e a base emocional: o nosso refúgio íntimo.' },
  { title: 'Casa 5', kw: 'Criatividade · Prazer · Filhos', text: 'Rege a autoexpressão, os romances, os filhos, os hobbies e tudo o que fazemos por pura alegria.' },
  { title: 'Casa 6', kw: 'Rotina · Trabalho · Saúde', text: 'Rege os hábitos diários, o trabalho como serviço, o bem-estar do corpo e a forma como cuidamos das obrigações.' },
  { title: 'Casa 7 · Descendente', kw: 'Parcerias · Contratos · O outro', text: 'A casa dos relacionamentos um a um: casamento, sócios, acordos e também os opositores declarados.' },
  { title: 'Casa 8', kw: 'Transformação · Intimidade · Bens partilhados', text: 'Rege as crises e a regeneração, a sexualidade, heranças, dívidas e investimentos em comum, e os mistérios profundos.' },
  { title: 'Casa 9', kw: 'Sabedoria · Viagens · Fé', text: 'Rege os estudos superiores, as viagens longas, a filosofia e a espiritualidade: a expansão dos horizontes e a busca de sentido.' },
  { title: 'Casa 10 · Meio do Céu', kw: 'Carreira · Reputação · Vocação', text: 'Simboliza o status, a autoridade, a imagem pública e a realização do nosso propósito no mundo.' },
  { title: 'Casa 11', kw: 'Amigos · Grupos · Futuro', text: 'Rege as amizades, as redes de contato, os projetos coletivos e as esperanças que temos para o futuro.' },
  { title: 'Casa 12', kw: 'Inconsciente · Espiritualidade · Recolhimento', text: 'Rege o que está oculto: sonhos, carma, isolamento, sacrifício e transcendência. É a casa do retiro e da entrega.' },
];

const ELEMENT_PT: Record<string, string> = { fire: 'Fogo', earth: 'Terra', air: 'Ar', water: 'Água' };
const ELEMENT_ICON: Record<string, string> = { fire: 'ti-flame', earth: 'ti-leaf', air: 'ti-wind', water: 'ti-droplet' };
const MODALITY_PT: Record<string, string> = { cardinal: 'Cardinal', fixed: 'Fixo', mutable: 'Mutável' };
const MODALITY_ICON: Record<string, string> = { cardinal: 'ti-rocket', fixed: 'ti-anchor', mutable: 'ti-arrows-exchange' };
const POLARITY_PT: Record<string, string> = { masculine: 'Masculino', feminine: 'Feminino' };

/** Cores por tema (escuro / claro). */
const palette = (theme: 'dark' | 'light' = 'dark') => theme === 'light'
  ? {
    good: '#15803d', bad: '#b91c1c', retro: '#b45309', muted: '#7a7366', gold: '#8a6a12', house: '#0f766e',
    accent: '#6d28d9', element: { fire: '#c2410c', earth: '#047857', air: '#a16207', water: '#1d4ed8' } as Record<string, string>,
  }
  : {
    good: '#4ade80', bad: '#f87171', retro: '#FBBF24', muted: '#9b958a', gold: '#F5D98A', house: '#2E9E8C',
    accent: '#a78bfa', element: { fire: '#FB923C', earth: '#34D399', air: '#FEF3C7', water: '#60A5FA' } as Record<string, string>,
  };

// Dignidades tradicionais (7 planetas clássicos)
const DOMICILE: Record<string, number[]> = {
  sun: [4], moon: [3], mercury: [2, 5], venus: [1, 6], mars: [0, 7], jupiter: [8, 11], saturn: [9, 10],
};
const EXALTATION: Record<string, number> = { sun: 0, moon: 1, mercury: 5, venus: 11, mars: 9, jupiter: 3, saturn: 6 };
const opposite = (s: number) => (s + 6) % 12;

type Dignity = 'Domicílio' | 'Exaltação' | 'Exílio' | 'Queda' | 'Peregrino';
const dignityOf = (planetId: string, signIndex: number): Dignity | null => {
  if (!(planetId in DOMICILE)) return null;
  if (DOMICILE[planetId].includes(signIndex)) return 'Domicílio';
  if (EXALTATION[planetId] === signIndex) return 'Exaltação';
  if (DOMICILE[planetId].map(opposite).includes(signIndex)) return 'Exílio';
  if (opposite(EXALTATION[planetId]) === signIndex) return 'Queda';
  return 'Peregrino';
};
const DIGNITY_ICON: Record<Dignity, string> = {
  'Domicílio': 'ti-home-star', 'Exaltação': 'ti-crown', 'Exílio': 'ti-arrow-bar-left', 'Queda': 'ti-arrow-down', 'Peregrino': 'ti-walk',
};

// ─────────────────────────────────────────────────────────────────────────────
// Utilitários
// ─────────────────────────────────────────────────────────────────────────────

const norm = (l: number) => ((l % 360) + 360) % 360;
const signOf = (lon: number) => Math.floor(norm(lon) / 30);
const SIGN = (i: number) => ZODIAC_DATA[((i % 12) + 12) % 12];

const fmtDegInSign = (lon: number): string => {
  const inSign = norm(lon) % 30;
  let d = Math.floor(inSign);
  let m = Math.round((inSign - d) * 60);
  if (m === 60) { m = 0; d += 1; }
  return `${d}°${String(m).padStart(2, '0')}′`;
};
const fmtOrb = (orb: number) => {
  const d = Math.floor(orb);
  const m = Math.round((orb - d) * 60);
  return m === 60 ? `${d + 1}°00′` : `${d}°${String(m).padStart(2, '0')}′`;
};
const fmtDay = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
const fmtDayYear = (d: Date, now: Date) => d.getFullYear() === now.getFullYear() ? fmtDay(d) : `${fmtDay(d)}/${d.getFullYear()}`;
const glyph = (id: string) => CELESTIAL_GLYPHS[id] ?? '•';
const splitKw = (kw?: string) => (kw ? kw.split(' · ').map(k => k.trim()).filter(Boolean) : []);

// Pedaços prontos
const txt = (text: string, extra: Partial<TooltipPart> = {}): TooltipPart => ({ text, ...extra });
const bodyLine = (id: string, ctx: TooltipContext): TooltipPart[] =>
  [txt(glyph(id), { sym: true, color: ctx.colors[id] }), txt(` ${BODY_NAMES[id] ?? id}`)];
const signParts = (s: number, ctx: TooltipContext): TooltipPart[] => {
  const z = SIGN(s);
  return [txt(z.symbol, { sym: true, color: palette(ctx.theme).element[z.element] }), txt(` ${z.name}`)];
};
const positionLine = (lon: number, ctx: TooltipContext): TooltipPart[] =>
  [txt(fmtDegInSign(lon), { mono: true }), txt(' '), ...signParts(signOf(lon), ctx)];

/** Astros visíveis com longitude dentro de [start, end) (graus absolutos, 0–360). */
const bodiesIn = (ctx: TooltipContext, start: number, end: number): string[] =>
  Object.keys(BODY_NAMES).filter(id => {
    if (!ctx.visible[id]) return false;
    const l = ctx.longitudes[id];
    if (typeof l !== 'number') return false;
    const x = norm(l);
    return x >= start && x < end;
  });
const bodiesRow = (ids: string[], ctx: TooltipContext): TooltipRow => ({
  label: 'Astros aqui', icon: 'ti-planet', color: palette(ctx.theme).gold,
  lines: ids.length
    ? ids.map(id => [...bodyLine(id, ctx), txt(` ${fmtDegInSign(ctx.longitudes[id])}`, { mono: true, muted: true })])
    : [[txt('Nenhum agora', { muted: true })]],
});

// ─────────────────────────────────────────────────────────────────────────────
// Construtores
// ─────────────────────────────────────────────────────────────────────────────

export const buildPlanetTooltip = (id: string, ctx: TooltipContext): TooltipModel | null => {
  const lon = ctx.longitudes[id];
  if (typeof lon !== 'number' || !BODY_NAMES[id]) return null;
  const P = palette(ctx.theme);
  const s = signOf(lon);
  const retro = !!ctx.retrograde[id];
  const accent = ctx.colors[id] ?? P.gold;

  const rows: TooltipRow[] = [{ label: 'Posição', icon: 'ti-compass', color: accent, lines: [positionLine(lon, ctx)] }];
  if (id === 'moon' && ctx.moon) {
    rows.push({ label: 'Fase', icon: 'ti-moon', color: accent, lines: [[txt(ctx.moon.phaseName), txt(` · ${ctx.moon.illum}%`, { mono: true, muted: true })]] });
    rows.push({ label: 'Nasce · Põe', icon: 'ti-sunrise', color: P.gold, lines: [[txt(`${ctx.moon.rise} · ${ctx.moon.set}`, { mono: true })]] });
    if (ctx.moon.cycleName) rows.push({ label: 'Ciclo', icon: 'ti-refresh', color: P.muted, lines: [[txt(ctx.moon.cycleName)]] });
  } else if (!['northNode', 'southNode', 'partOfFortune', 'lilith'].includes(id)) {
    rows.push(retro
      ? { label: 'Movimento', icon: 'ti-arrow-back-up', color: P.retro, pill: true, lines: [[txt('Retrógrado ℞')]] }
      : { label: 'Movimento', icon: 'ti-arrow-right', color: P.good, pill: true, lines: [[txt('Direto')]] });
  }
  const dig = dignityOf(id, s);
  if (dig) {
    const c = dig === 'Domicílio' || dig === 'Exaltação' ? P.good : dig === 'Peregrino' ? P.muted : P.bad;
    rows.push({ label: 'Dignidade', icon: DIGNITY_ICON[dig], color: c, pill: true, lines: [[txt(dig)]] });
  }
  const term = getTermAt(lon);
  rows.push({ label: 'Termo', icon: 'ti-layout-columns', color: ctx.colors[term.ruler] ?? P.gold, lines: [bodyLine(term.ruler, ctx)] });
  const decanNum = Math.floor((norm(lon) % 30) / 10) + 1;
  const decanRuler = getDecanRuler(norm(lon));
  rows.push({ label: 'Decanato', icon: 'ti-chart-pie-2', color: ctx.colors[decanRuler] ?? P.gold, lines: [[txt(`${decanNum}º · `), ...bodyLine(decanRuler, ctx)]] });
  const house = ctx.houses[id];
  if (house) rows.push({ label: 'Casa', icon: 'ti-home', color: P.house, lines: [[txt(HOUSE_COPY[house - 1]?.title ?? `Casa ${house}`)]] });
  const asps = ctx.aspects
    .filter(a => !a.isNatal && (a.body1.id === id || a.body2.id === id))
    .sort((a, b) => a.orb - b.orb)
    .slice(0, 4)
    .map(a => {
      const other = a.body1.id === id ? a.body2.id : a.body1.id;
      const info = ASPECT_INFO[a.type];
      return [txt(info?.symbol ?? '', { sym: true, color: info?.color }), txt(` ${BODY_NAMES[other] ?? other}`), txt(` ${fmtOrb(a.orb)}`, { mono: true, muted: true })];
    });
  if (asps.length) rows.push({ label: 'Aspectos', icon: 'ti-affiliate', color: P.accent, lines: asps });

  return {
    key: `planet-${id}`, kind: 'planet', glyph: glyph(id), accent,
    title: BODY_NAMES[id], keywords: splitKw(PLANET_COPY[id]?.kw), text: PLANET_COPY[id]?.text ?? '', rows,
  };
};

export const buildSignTooltip = (signIndexOrId: number | string, ctx: TooltipContext): TooltipModel | null => {
  const s = typeof signIndexOrId === 'number' ? signIndexOrId : ZODIAC_DATA.findIndex(z => z.id === signIndexOrId);
  if (s < 0) return null;
  const P = palette(ctx.theme);
  const z = SIGN(s);
  const accent = P.element[z.element] ?? P.gold;
  const here = bodiesIn(ctx, s * 30, s * 30 + 30);
  const exalted = Object.keys(EXALTATION).filter(p => EXALTATION[p] === s);
  const exiled = Object.keys(DOMICILE).filter(p => DOMICILE[p].map(opposite).includes(s));
  const fallen = Object.keys(EXALTATION).filter(p => opposite(EXALTATION[p]) === s);
  const list = (ids: string[]) => ids.length ? ids.map(i => bodyLine(i, ctx)) : [[txt('—', { muted: true })]];
  return {
    key: `sign-${s}`, kind: 'sign', glyph: z.symbol, accent,
    title: z.name, keywords: splitKw(SIGN_COPY[s].kw), text: SIGN_COPY[s].text,
    rows: [
      { label: 'Elemento', icon: ELEMENT_ICON[z.element] ?? 'ti-circle', color: accent, pill: true, lines: [[txt(ELEMENT_PT[z.element] ?? z.element)]] },
      { label: 'Modalidade', icon: MODALITY_ICON[z.modality] ?? 'ti-circle', color: P.accent, lines: [[txt(MODALITY_PT[z.modality] ?? z.modality)]] },
      { label: 'Polaridade', icon: 'ti-yin-yang', color: P.muted, lines: [[txt(POLARITY_PT[z.polarity] ?? z.polarity)]] },
      { label: 'Regente', icon: 'ti-crown', color: ctx.colors[z.ruler] ?? P.gold, lines: [bodyLine(z.ruler, ctx)] },
      { label: 'Exaltação', icon: 'ti-arrow-up', color: P.good, lines: list(exalted) },
      { label: 'Exílio', icon: 'ti-arrow-bar-left', color: P.bad, lines: list(exiled) },
      { label: 'Queda', icon: 'ti-arrow-down', color: P.bad, lines: list(fallen) },
      bodiesRow(here, ctx),
    ],
  };
};

export const buildAspectTooltip = (aspect: Aspect, ctx: TooltipContext): TooltipModel | null => {
  const info = ASPECT_INFO[aspect.type];
  if (!info) return null;
  const P = palette(ctx.theme);
  const a = aspect.body1.id, b = aspect.body2.id;
  const natal = aspect.isNatal ? ' natal' : '';
  const timing = (() => { try { return getAspectTiming(aspect, ctx.now, ctx.location); } catch { return null; } })();
  const rows: TooltipRow[] = [
    { label: 'Aspecto', icon: 'ti-angle', color: info.color, lines: [[txt(info.symbol, { sym: true, color: info.color }), txt(` ${info.name} · `), txt(`${info.angle}°`, { mono: true })]] },
    { label: 'Astros', icon: 'ti-planet', color: P.gold, lines: [bodyLine(a, ctx), bodyLine(b, ctx)] },
    { label: 'Orbe', icon: 'ti-target', color: P.gold, lines: [[txt(fmtOrb(aspect.orb), { mono: true })]] },
  ];
  if (timing) {
    rows.push(timing.applying
      ? { label: 'Estado', icon: 'ti-trending-up', color: P.good, pill: true, lines: [[txt('Se formando')]] }
      : { label: 'Estado', icon: 'ti-trending-down', color: P.muted, pill: true, lines: [[txt('Se desfazendo')]] });
    rows.push({
      label: timing.applying ? 'Exato' : 'Foi exato', icon: 'ti-calendar-event', color: P.gold,
      lines: [[timing.exact
        ? txt(fmtDayYear(timing.exact, ctx.now), { mono: true })
        : txt(timing.applying ? 'Não chega ao exato' : 'Não chegou ao exato', { muted: true })]],
    });
    rows.push({
      label: 'Vigência', icon: 'ti-calendar', color: P.muted,
      lines: [[txt(`${timing.range.startOpen ? 'antes de ' : ''}${fmtDayYear(timing.range.start, ctx.now)} → ${timing.range.endOpen ? 'depois de ' : ''}${fmtDayYear(timing.range.end, ctx.now)}`, { mono: true })]],
    });
  }
  return {
    key: `aspect-${aspect.id}`, kind: 'aspect', glyph: info.symbol, accent: info.color,
    title: `${BODY_NAMES[a] ?? a} ${info.connector} ${BODY_NAMES[b] ?? b}${natal}`,
    keywords: splitKw(info.kw), text: info.text, rows,
  };
};

export const buildTermTooltip = (signIndex: number, termIndex: number, ctx: TooltipContext): TooltipModel | null => {
  const terms = getSignTerms(signIndex);
  const t = terms[termIndex];
  if (!t) return null;
  const P = palette(ctx.theme);
  const z = SIGN(signIndex);
  const accent = ctx.colors[t.ruler] ?? P.gold;
  const here = bodiesIn(ctx, signIndex * 30 + t.start, signIndex * 30 + t.end);
  return {
    key: `term-${signIndex}-${termIndex}`, kind: 'term', glyph: glyph(t.ruler), accent,
    title: `Termo ${ofBody(t.ruler)} em ${z.name}`,
    keywords: splitKw(TERM_COPY[signIndex]?.[t.ruler]?.kw),
    text: TERM_COPY[signIndex]?.[t.ruler]?.text ?? '',
    rows: [
      { label: 'Signo', icon: `ti-zodiac-${z.id}`, color: P.element[z.element] ?? P.gold, lines: [signParts(signIndex, ctx)] },
      { label: 'Trecho', icon: 'ti-ruler-2', color: P.gold, lines: [[txt(`${t.start}°–${t.end}°`, { mono: true })]] },
      { label: 'Sistema', icon: 'ti-books', color: P.muted, lines: [[txt(`Egípcio · ${termIndex + 1}º de ${terms.length}`)]] },
      bodiesRow(here, ctx),
    ],
    segments: terms.map((x, i) => ({ label: `${glyph(x.ruler)} ${x.start}–${x.end}`, size: x.end - x.start, active: i === termIndex })),
  };
};

export const buildDecanTooltip = (decanIndex: number, ctx: TooltipContext): TooltipModel | null => {
  const P = palette(ctx.theme);
  const s = Math.floor(decanIndex / 3);
  const n = decanIndex % 3;
  const ruler = getDecanRuler(decanIndex * 10);
  const z = SIGN(s);
  const accent = ctx.colors[ruler] ?? P.gold;
  const here = bodiesIn(ctx, decanIndex * 10, decanIndex * 10 + 10);
  return {
    key: `decan-${decanIndex}`, kind: 'decan', glyph: glyph(ruler), accent,
    title: `${n + 1}º decanato de ${z.name}`,
    keywords: splitKw(DECAN_COPY[ruler]?.kw),
    text: DECAN_COPY[ruler]?.text ?? '',
    rows: [
      { label: 'Signo', icon: `ti-zodiac-${z.id}`, color: P.element[z.element] ?? P.gold, lines: [signParts(s, ctx)] },
      { label: 'Trecho', icon: 'ti-ruler-2', color: P.gold, lines: [[txt(`${n * 10}°–${n * 10 + 10}°`, { mono: true })]] },
      { label: 'Regente', icon: 'ti-crown', color: accent, lines: [bodyLine(ruler, ctx)] },
      { label: 'Sistema', icon: 'ti-books', color: P.muted, lines: [[txt(`Caldeu (faces) · ${n + 1}º de 3`)]] },
      bodiesRow(here, ctx),
    ],
    segments: [0, 1, 2].map(i => {
      const r = getDecanRuler((s * 3 + i) * 10);
      return { label: `${i + 1}º · ${glyph(r)}`, size: 10, active: i === n };
    }),
  };
};

export const buildHouseTooltip = (house: number, ctx: TooltipContext, naturalRuler?: string): TooltipModel | null => {
  if (house < 1 || house > 12) return null;
  const P = palette(ctx.theme);
  const here = Object.keys(BODY_NAMES).filter(id => ctx.visible[id] && ctx.houses[id] === house);
  const cusp = ctx.houseCusps[house - 1];
  const rows: TooltipRow[] = [];
  if (typeof cusp === 'number') rows.push({ label: 'Cúspide', icon: 'ti-compass', color: P.house, lines: [positionLine(cusp, ctx)] });
  if (naturalRuler) rows.push({ label: 'Regente', icon: 'ti-crown', color: ctx.colors[naturalRuler] ?? P.gold, lines: [bodyLine(naturalRuler, ctx)] });
  rows.push({
    ...bodiesRow([], ctx),
    lines: here.length ? here.map(id => [...bodyLine(id, ctx), txt(` ${fmtDegInSign(ctx.longitudes[id])}`, { mono: true, muted: true })]) : [[txt('Nenhum agora', { muted: true })]],
  });
  return {
    key: `house-${house}`, kind: 'house', glyph: String(house), accent: P.house,
    title: HOUSE_COPY[house - 1].title,
    keywords: splitKw(HOUSE_COPY[house - 1].kw),
    text: HOUSE_COPY[house - 1].text,
    rows,
  };
};
