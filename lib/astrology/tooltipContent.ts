/**
 * Conteúdo das tooltips do Cronógrafo (astros, aspectos, signos, termos, decanatos, casas).
 *
 * PADRÃO DE COPY v3 (aprovado pelo Rafa):
 *   • Título (nome do item)
 *   • Palavras-chave (3–4) que resumem o significado
 *   • Descrição de 1–2 frases sobre o SIGNIFICADO do item (sem comentar a posição atual)
 * Dados do momento (posição, astros presentes, orbe, vigência…) ficam só em "Ver mais".
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

export interface TooltipRow {
  label: string;
  value: string;
  /** números em fonte mono */
  mono?: boolean;
  tone?: 'good' | 'bad' | 'accent';
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
  /** cor do glifo/selo */
  accent: string;
  /** para astros: id (desenha a esfera com o gradiente do planeta) */
  planetId?: string;
  title: string;
  /** linha de palavras-chave (separadas por ·) */
  keywords?: string;
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
const ELEMENT_COLOR: Record<string, string> = { fire: '#FB923C', earth: '#34D399', air: '#FEF3C7', water: '#60A5FA' };
const MODALITY_PT: Record<string, string> = { cardinal: 'Cardinal', fixed: 'Fixo', mutable: 'Mutável' };
const POLARITY_PT: Record<string, string> = { masculine: 'Masculino', feminine: 'Feminino' };

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
const dignityTone = (d: Dignity): TooltipRow['tone'] =>
  d === 'Domicílio' || d === 'Exaltação' ? 'good' : d === 'Exílio' || d === 'Queda' ? 'bad' : undefined;

// ─────────────────────────────────────────────────────────────────────────────
// Utilitários
// ─────────────────────────────────────────────────────────────────────────────

const norm = (l: number) => ((l % 360) + 360) % 360;
const signOf = (lon: number) => Math.floor(norm(lon) / 30);
const SIGN = (i: number) => ZODIAC_DATA[((i % 12) + 12) % 12];

export const fmtDegree = (lon: number): string => {
  const l = norm(lon);
  const s = Math.floor(l / 30);
  const inSign = l - s * 30;
  let d = Math.floor(inSign);
  let m = Math.round((inSign - d) * 60);
  if (m === 60) { m = 0; d += 1; }
  return `${d}°${String(m).padStart(2, '0')}′ ${SIGN(s).symbol} ${SIGN(s).name}`;
};
const fmtOrb = (orb: number) => {
  const d = Math.floor(orb);
  const m = Math.round((orb - d) * 60);
  return m === 60 ? `${d + 1}°00′` : `${d}°${String(m).padStart(2, '0')}′`;
};
const fmtDay = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
const fmtDayYear = (d: Date, now: Date) => d.getFullYear() === now.getFullYear() ? fmtDay(d) : `${fmtDay(d)}/${d.getFullYear()}`;
const glyph = (id: string) => CELESTIAL_GLYPHS[id] ?? '•';

/** Astros visíveis com longitude dentro de [start, end) (graus absolutos, 0–360). */
const bodiesIn = (ctx: TooltipContext, start: number, end: number): string[] =>
  Object.keys(BODY_NAMES).filter(id => {
    if (!ctx.visible[id]) return false;
    const l = ctx.longitudes[id];
    if (typeof l !== 'number') return false;
    const x = norm(l);
    return x >= start && x < end;
  });
const bodiesValue = (ids: string[], ctx: TooltipContext) =>
  ids.length ? ids.map(id => `${glyph(id)} ${BODY_NAMES[id]} ${fmtDegree(ctx.longitudes[id]).split(' ')[0]}`).join('\n') : 'Nenhum agora';

// ─────────────────────────────────────────────────────────────────────────────
// Construtores
// ─────────────────────────────────────────────────────────────────────────────

export const buildPlanetTooltip = (id: string, ctx: TooltipContext): TooltipModel | null => {
  const lon = ctx.longitudes[id];
  if (typeof lon !== 'number' || !BODY_NAMES[id]) return null;
  const s = signOf(lon);
  const name = BODY_NAMES[id];
  const retro = !!ctx.retrograde[id];

  const rows: TooltipRow[] = [{ label: 'Posição', value: fmtDegree(lon), mono: true }];
  if (id === 'moon' && ctx.moon) {
    rows.push({ label: 'Fase', value: `${ctx.moon.phaseName} · ${ctx.moon.illum}%` });
    rows.push({ label: 'Nasce · Põe', value: `${ctx.moon.rise} · ${ctx.moon.set}`, mono: true });
    if (ctx.moon.cycleName) rows.push({ label: 'Ciclo', value: ctx.moon.cycleName });
  } else if (!['northNode', 'southNode', 'partOfFortune', 'lilith'].includes(id)) {
    rows.push({ label: 'Movimento', value: retro ? 'Retrógrado' : 'Direto', tone: retro ? 'accent' : undefined });
  }
  const dig = dignityOf(id, s);
  if (dig) rows.push({ label: 'Dignidade', value: dig, tone: dignityTone(dig) });
  const term = getTermAt(lon);
  rows.push({ label: 'Termo', value: `${glyph(term.ruler)} ${BODY_NAMES[term.ruler]}` });
  const decanNum = Math.floor((norm(lon) % 30) / 10) + 1;
  const decanRuler = getDecanRuler(norm(lon));
  rows.push({ label: 'Decanato', value: `${decanNum}º · ${glyph(decanRuler)} ${BODY_NAMES[decanRuler]}` });
  const house = ctx.houses[id];
  if (house) rows.push({ label: 'Casa', value: `Casa ${house}`, mono: false });
  const asps = ctx.aspects
    .filter(a => !a.isNatal && (a.body1.id === id || a.body2.id === id))
    .sort((a, b) => a.orb - b.orb)
    .slice(0, 4)
    .map(a => {
      const other = a.body1.id === id ? a.body2.id : a.body1.id;
      return `${ASPECT_INFO[a.type]?.symbol ?? ''} ${BODY_NAMES[other] ?? other} ${fmtOrb(a.orb)}`;
    });
  if (asps.length) rows.push({ label: 'Aspectos', value: asps.join('\n') });

  return {
    key: `planet-${id}`, kind: 'planet', glyph: glyph(id), accent: '#F5F2EB', planetId: id,
    title: name, keywords: PLANET_COPY[id]?.kw, text: PLANET_COPY[id]?.text ?? '', rows,
  };
};

export const buildSignTooltip = (signIndexOrId: number | string, ctx: TooltipContext): TooltipModel | null => {
  const s = typeof signIndexOrId === 'number' ? signIndexOrId : ZODIAC_DATA.findIndex(z => z.id === signIndexOrId);
  if (s < 0) return null;
  const z = SIGN(s);
  const here = bodiesIn(ctx, s * 30, s * 30 + 30);
  const exalted = Object.keys(EXALTATION).filter(p => EXALTATION[p] === s);
  const exiled = Object.keys(DOMICILE).filter(p => DOMICILE[p].map(opposite).includes(s));
  const fallen = Object.keys(EXALTATION).filter(p => opposite(EXALTATION[p]) === s);
  const names = (ids: string[]) => ids.length ? ids.map(i => `${glyph(i)} ${BODY_NAMES[i]}`).join(', ') : '—';
  return {
    key: `sign-${s}`, kind: 'sign', glyph: z.symbol, accent: ELEMENT_COLOR[z.element] ?? '#F5F2EB',
    title: z.name,
    keywords: SIGN_COPY[s].kw,
    text: SIGN_COPY[s].text,
    rows: [
      { label: 'Elemento', value: ELEMENT_PT[z.element] ?? z.element },
      { label: 'Modalidade', value: MODALITY_PT[z.modality] ?? z.modality },
      { label: 'Polaridade', value: POLARITY_PT[z.polarity] ?? z.polarity },
      { label: 'Regente', value: `${glyph(z.ruler)} ${BODY_NAMES[z.ruler] ?? z.ruler}` },
      { label: 'Exaltação', value: names(exalted) },
      { label: 'Exílio', value: names(exiled) },
      { label: 'Queda', value: names(fallen) },
      { label: 'Astros aqui', value: bodiesValue(here, ctx) },
    ],
  };
};

export const buildAspectTooltip = (aspect: Aspect, ctx: TooltipContext): TooltipModel | null => {
  const info = ASPECT_INFO[aspect.type];
  if (!info) return null;
  const a = aspect.body1.id, b = aspect.body2.id;
  const natal = aspect.isNatal ? ' natal' : '';
  const timing = (() => { try { return getAspectTiming(aspect, ctx.now, ctx.location); } catch { return null; } })();
  const rows: TooltipRow[] = [
    { label: 'Aspecto', value: `${info.symbol} ${info.name} · ${info.angle}°` },
    { label: 'Orbe', value: fmtOrb(aspect.orb), mono: true },
  ];
  if (timing) {
    rows.push({ label: 'Estado', value: timing.applying ? 'Se formando' : 'Se desfazendo', tone: timing.applying ? 'good' : undefined });
    rows.push({
      label: timing.applying ? 'Exato' : 'Foi exato',
      value: timing.exact ? fmtDayYear(timing.exact, ctx.now) : (timing.applying ? 'Não chega ao exato' : 'Não chegou ao exato'),
      mono: !!timing.exact,
    });
    rows.push({
      label: 'Vigência',
      value: `${timing.range.startOpen ? 'antes de ' : ''}${fmtDayYear(timing.range.start, ctx.now)} → ${timing.range.endOpen ? 'depois de ' : ''}${fmtDayYear(timing.range.end, ctx.now)}`,
      mono: true,
    });
  }
  return {
    key: `aspect-${aspect.id}`, kind: 'aspect', glyph: info.symbol, accent: info.color,
    title: `${BODY_NAMES[a] ?? a} ${info.connector} ${BODY_NAMES[b] ?? b}${natal}`,
    keywords: info.kw,
    text: info.text,
    rows,
  };
};

export const buildTermTooltip = (signIndex: number, termIndex: number, ctx: TooltipContext): TooltipModel | null => {
  const terms = getSignTerms(signIndex);
  const t = terms[termIndex];
  if (!t) return null;
  const z = SIGN(signIndex);
  const here = bodiesIn(ctx, signIndex * 30 + t.start, signIndex * 30 + t.end);
  return {
    key: `term-${signIndex}-${termIndex}`, kind: 'term', glyph: glyph(t.ruler), accent: '#F5D98A',
    title: `Termo ${ofBody(t.ruler)} em ${z.name}`,
    keywords: TERM_COPY[signIndex]?.[t.ruler]?.kw,
    text: TERM_COPY[signIndex]?.[t.ruler]?.text ?? '',
    rows: [
      { label: 'Signo', value: `${z.symbol} ${z.name}` },
      { label: 'Trecho', value: `${t.start}°–${t.end}°`, mono: true },
      { label: 'Sistema', value: `Egípcio · ${termIndex + 1}º de ${terms.length}` },
      { label: 'Astros aqui', value: bodiesValue(here, ctx) },
    ],
    segments: terms.map((x, i) => ({ label: `${glyph(x.ruler)} ${x.start}–${x.end}`, size: x.end - x.start, active: i === termIndex })),
  };
};

export const buildDecanTooltip = (decanIndex: number, ctx: TooltipContext): TooltipModel | null => {
  const s = Math.floor(decanIndex / 3);
  const n = decanIndex % 3;
  const ruler = getDecanRuler(decanIndex * 10);
  const z = SIGN(s);
  const here = bodiesIn(ctx, decanIndex * 10, decanIndex * 10 + 10);
  return {
    key: `decan-${decanIndex}`, kind: 'decan', glyph: glyph(ruler), accent: '#E2E8F0',
    title: `${n + 1}º decanato de ${z.name}`,
    keywords: DECAN_COPY[ruler]?.kw,
    text: DECAN_COPY[ruler]?.text ?? '',
    rows: [
      { label: 'Signo', value: `${z.symbol} ${z.name}` },
      { label: 'Trecho', value: `${n * 10}°–${n * 10 + 10}°`, mono: true },
      { label: 'Regente', value: `${glyph(ruler)} ${BODY_NAMES[ruler]}` },
      { label: 'Sistema', value: `Caldeu (faces) · ${n + 1}º de 3` },
      { label: 'Astros aqui', value: bodiesValue(here, ctx) },
    ],
    segments: [0, 1, 2].map(i => {
      const r = getDecanRuler((s * 3 + i) * 10);
      return { label: `${i + 1}º · ${glyph(r)}`, size: 10, active: i === n };
    }),
  };
};

export const buildHouseTooltip = (house: number, ctx: TooltipContext, naturalRuler?: string): TooltipModel | null => {
  if (house < 1 || house > 12) return null;
  const here = Object.keys(BODY_NAMES).filter(id => ctx.visible[id] && ctx.houses[id] === house);
  const cusp = ctx.houseCusps[house - 1];
  const rows: TooltipRow[] = [];
  if (typeof cusp === 'number') rows.push({ label: 'Cúspide', value: fmtDegree(cusp), mono: true });
  if (naturalRuler) rows.push({ label: 'Regente', value: `${glyph(naturalRuler)} ${BODY_NAMES[naturalRuler] ?? naturalRuler}` });
  rows.push({ label: 'Astros aqui', value: bodiesValue(here, ctx) });
  return {
    key: `house-${house}`, kind: 'house', glyph: String(house), accent: '#2E9E8C',
    title: HOUSE_COPY[house - 1].title,
    keywords: HOUSE_COPY[house - 1].kw,
    text: HOUSE_COPY[house - 1].text,
    rows,
  };
};
