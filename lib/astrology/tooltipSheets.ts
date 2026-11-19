/**
 * Textos das tooltips vindos das planilhas do Rafa (19/11/2026):
 *   tooltips_astrologia (astros, pontos e signos), termos_tradicionais e decanatos_tradicionais.
 * Os GRAUS dos termos continuam os da tabela egípcia em terms.ts (a planilha tinha divergências
 * em Touro, Gêmeos e Virgem); daqui só vem o texto, casado por signo + regente.
 */
export const BODY_SHEET: Record<string, { type: string; class: string; text: string }> = {
  "sun": {
    "type": "Luminar",
    "class": "Tradicional",
    "text": "Princípio vital, identidade, autoridade e expressão consciente do eu. Representa o centro da personalidade e a capacidade de brilhar."
  },
  "moon": {
    "type": "Luminar",
    "class": "Tradicional",
    "text": "Necessidades emocionais, instinto, memória, cuidado e hábitos. Descreve como a pessoa sente, nutre e busca segurança."
  },
  "mercury": {
    "type": "Planeta clássico",
    "class": "Tradicional",
    "text": "Comunicação, raciocínio, aprendizado, deslocamento, comércio e mediação. Rege a troca de informação e a habilidade de adaptar ideias."
  },
  "venus": {
    "type": "Planeta clássico",
    "class": "Tradicional",
    "text": "Atração, afeto, prazer, valores, beleza, arte e acordos. Descreve o que se aprecia, como se relaciona e o que se busca harmonizar."
  },
  "mars": {
    "type": "Planeta clássico",
    "class": "Tradicional",
    "text": "Iniciativa, coragem, desejo, competição, ação e afirmação. Representa a energia de conquista, defesa e realização."
  },
  "jupiter": {
    "type": "Planeta clássico",
    "class": "Tradicional",
    "text": "Expansão, fé, sabedoria, ensino, abundância e oportunidade. Indica onde há crescimento, otimismo e busca de significado."
  },
  "saturn": {
    "type": "Planeta clássico",
    "class": "Tradicional",
    "text": "Estrutura, limite, disciplina, responsabilidade, tempo e maturação. Mostra onde é preciso esforço, constância e realismo."
  },
  "uranus": {
    "type": "Planeta moderno",
    "class": "Moderno",
    "text": "Ruptura, originalidade, liberdade, inovação e despertar. Indica onde há necessidade de renovação e independência."
  },
  "neptune": {
    "type": "Planeta moderno",
    "class": "Moderno",
    "text": "Imaginação, idealismo, espiritualidade, compaixão e dissolução de limites. Relaciona-se a sonhos, arte e confusão."
  },
  "pluto": {
    "type": "Planeta moderno",
    "class": "Moderno",
    "text": "Transformação profunda, poder, intensidade, renascimento e processos de morte e renovação psicológica."
  },
  "northNode": {
    "type": "Ponto lunar",
    "class": "Tradicional",
    "text": "Direção de desenvolvimento, aprendizado e expansão kármica. Aponta para qualidades a integrar e caminhos a desenvolver."
  },
  "southNode": {
    "type": "Ponto lunar",
    "class": "Tradicional",
    "text": "Padrões herdados, hábitos enraizados e talentos já conhecidos. Indica de onde se parte e o que pode ser liberado ou reequilibrado."
  },
  "partOfFortune": {
    "type": "Ponto árabe",
    "class": "Tradicional",
    "text": "Ponto de realização, prosperidade e integração entre corpo, emoção e circunstância. Indica onde a vida flui com maior naturalidade."
  },
  "lilith": {
    "type": "Ponto fictício",
    "class": "Moderno",
    "text": "Sombras, desejos reprimidos, autonomia e poder instintivo. Indica onde há necessidade de reconhecer o que foi marginalizado ou negado."
  },
  "chiron": {
    "type": "Asteroide",
    "class": "Moderno",
    "text": "Ferida, vulnerabilidade e potencial de cura. Indica onde há sensibilidade especial e capacidade de transformar dor em sabedoria."
  },
  "ceres": {
    "type": "Asteroide",
    "class": "Moderno",
    "text": "Nutrição, cuidado, pertencimento e ciclos de perda e renovação. Relaciona-se ao modo de acolher e sustentar."
  },
  "pallas": {
    "type": "Asteroide",
    "class": "Moderno",
    "text": "Estratégia, sabedoria prática, padrões e resolução criativa de problemas. Relaciona-se à inteligência aplicada."
  },
  "juno": {
    "type": "Asteroide",
    "class": "Moderno",
    "text": "Compromisso, parceria, lealdade e pactos relacionais. Indica o que se busca em vínculos duradouros."
  },
  "vesta": {
    "type": "Asteroide",
    "class": "Moderno",
    "text": "Devoção, foco, sacralidade e consagração. Relaciona-se ao que se protege, cultiva e mantém com dedicação."
  }
};

/** Áries a Peixes */
export const SIGN_SHEET: string[] = [
  "Signo cardinal de fogo, regido por Marte. Expressa iniciativa, coragem, impulso e ação direta.",
  "Signo fixo de terra, regido por Vênus. Expressa estabilidade, prazer, recursos, persistência e valorização do concreto.",
  "Signo mutável de ar, regido por Mercúrio. Expressa curiosidade, comunicação, versatilidade e troca de informações.",
  "Signo cardinal de água, regido pela Lua. Expressa cuidado, proteção, memória, vínculo e sensibilidade emocional.",
  "Signo fixo de fogo, regido pelo Sol. Expressa criatividade, orgulho, generosidade, expressão e busca de reconhecimento.",
  "Signo mutável de terra, regido por Mercúrio. Expressa análise, serviço, precisão, organização e aperfeiçoamento.",
  "Signo cardinal de ar, regido por Vênus. Expressa relação, diplomacia, justiça, estética e busca de equilíbrio.",
  "Signo fixo de água, regido por Marte (e, na astrologia moderna, Plutão). Expressa intensidade, profundidade, transformação e poder.",
  "Signo mutável de fogo, regido por Júpiter. Expressa expansão, fé, aprendizado, viagem e busca de sentido.",
  "Signo cardinal de terra, regido por Saturno. Expressa ambição, estrutura, responsabilidade, disciplina e realização.",
  "Signo fixo de ar, regido por Saturno (e, na astrologia moderna, Urano). Expressa coletividade, inovação, idealismo e distanciamento.",
  "Signo mutável de água, regido por Júpiter (e, na astrologia moderna, Netuno). Expressa empatia, imaginação, espiritualidade e dissolução de fronteiras."
];

/** Termos: [signo][regente] → leitura */
export const TERM_SHEET: Record<string, string>[] = [
  {
    "jupiter": "Iniciativa, coragem e ação direta se ampliam por otimismo, ensino e oportunidade. Um astro neste termo ganha apoio para expressar Júpiter no tema de Áries.",
    "venus": "Iniciativa, coragem e ação direta se suavizam por atração, valor e harmonia. Um astro neste termo ganha apoio para expressar Vênus no tema de Áries.",
    "mercury": "Iniciativa, coragem e ação direta ganham movimento por raciocínio, fala e adaptação. Um astro neste termo ganha apoio para expressar Mercúrio no tema de Áries.",
    "mars": "Iniciativa, coragem e ação direta se ativam por impulso, coragem e disputa. Um astro neste termo ganha apoio para expressar Marte no tema de Áries.",
    "saturn": "Iniciativa, coragem e ação direta se estruturam por limite, disciplina e maturidade. Um astro neste termo ganha apoio para expressar Saturno no tema de Áries."
  },
  {
    "venus": "Estabilidade, recursos e consolidação se suavizam por atração, valor e harmonia. Um astro neste termo ganha apoio para expressar Vênus no tema de Touro.",
    "mercury": "Estabilidade, recursos e consolidação ganham movimento por raciocínio, fala e adaptação. Um astro neste termo ganha apoio para expressar Mercúrio no tema de Touro.",
    "jupiter": "Estabilidade, recursos e consolidação se ampliam por otimismo, ensino e oportunidade. Um astro neste termo ganha apoio para expressar Júpiter no tema de Touro.",
    "saturn": "Estabilidade, recursos e consolidação se estruturam por limite, disciplina e maturidade. Um astro neste termo ganha apoio para expressar Saturno no tema de Touro.",
    "mars": "Estabilidade, recursos e consolidação se ativam por impulso, coragem e disputa. Um astro neste termo ganha apoio para expressar Marte no tema de Touro."
  },
  {
    "mercury": "Informação, adaptação e conexão ganham movimento por raciocínio, fala e adaptação. Um astro neste termo ganha apoio para expressar Mercúrio no tema de Gêmeos.",
    "jupiter": "Informação, adaptação e conexão se ampliam por otimismo, ensino e oportunidade. Um astro neste termo ganha apoio para expressar Júpiter no tema de Gêmeos.",
    "venus": "Informação, adaptação e conexão se suavizam por atração, valor e harmonia. Um astro neste termo ganha apoio para expressar Vênus no tema de Gêmeos.",
    "saturn": "Informação, adaptação e conexão se estruturam por limite, disciplina e maturidade. Um astro neste termo ganha apoio para expressar Saturno no tema de Gêmeos.",
    "mars": "Informação, adaptação e conexão se ativam por impulso, coragem e disputa. Um astro neste termo ganha apoio para expressar Marte no tema de Gêmeos."
  },
  {
    "mars": "Cuidado, vínculo e proteção se ativam por impulso, coragem e disputa. Um astro neste termo ganha apoio para expressar Marte no tema de Câncer.",
    "venus": "Cuidado, vínculo e proteção se suavizam por atração, valor e harmonia. Um astro neste termo ganha apoio para expressar Vênus no tema de Câncer.",
    "mercury": "Cuidado, vínculo e proteção ganham movimento por raciocínio, fala e adaptação. Um astro neste termo ganha apoio para expressar Mercúrio no tema de Câncer.",
    "jupiter": "Cuidado, vínculo e proteção se ampliam por otimismo, ensino e oportunidade. Um astro neste termo ganha apoio para expressar Júpiter no tema de Câncer.",
    "saturn": "Cuidado, vínculo e proteção se estruturam por limite, disciplina e maturidade. Um astro neste termo ganha apoio para expressar Saturno no tema de Câncer."
  },
  {
    "jupiter": "Expressão, criatividade e reconhecimento se ampliam por otimismo, ensino e oportunidade. Um astro neste termo ganha apoio para expressar Júpiter no tema de Leão.",
    "venus": "Expressão, criatividade e reconhecimento se suavizam por atração, valor e harmonia. Um astro neste termo ganha apoio para expressar Vênus no tema de Leão.",
    "saturn": "Expressão, criatividade e reconhecimento se estruturam por limite, disciplina e maturidade. Um astro neste termo ganha apoio para expressar Saturno no tema de Leão.",
    "mercury": "Expressão, criatividade e reconhecimento ganham movimento por raciocínio, fala e adaptação. Um astro neste termo ganha apoio para expressar Mercúrio no tema de Leão.",
    "mars": "Expressão, criatividade e reconhecimento se ativam por impulso, coragem e disputa. Um astro neste termo ganha apoio para expressar Marte no tema de Leão."
  },
  {
    "mercury": "Análise, serviço e aperfeiçoamento ganham movimento por raciocínio, fala e adaptação. Um astro neste termo ganha apoio para expressar Mercúrio no tema de Virgem.",
    "venus": "Análise, serviço e aperfeiçoamento se suavizam por atração, valor e harmonia. Um astro neste termo ganha apoio para expressar Vênus no tema de Virgem.",
    "jupiter": "Análise, serviço e aperfeiçoamento se ampliam por otimismo, ensino e oportunidade. Um astro neste termo ganha apoio para expressar Júpiter no tema de Virgem.",
    "mars": "Análise, serviço e aperfeiçoamento se ativam por impulso, coragem e disputa. Um astro neste termo ganha apoio para expressar Marte no tema de Virgem.",
    "saturn": "Análise, serviço e aperfeiçoamento se estruturam por limite, disciplina e maturidade. Um astro neste termo ganha apoio para expressar Saturno no tema de Virgem."
  },
  {
    "saturn": "Relação, equilíbrio e negociação se estruturam por limite, disciplina e maturidade. Um astro neste termo ganha apoio para expressar Saturno no tema de Libra.",
    "mercury": "Relação, equilíbrio e negociação ganham movimento por raciocínio, fala e adaptação. Um astro neste termo ganha apoio para expressar Mercúrio no tema de Libra.",
    "jupiter": "Relação, equilíbrio e negociação se ampliam por otimismo, ensino e oportunidade. Um astro neste termo ganha apoio para expressar Júpiter no tema de Libra.",
    "venus": "Relação, equilíbrio e negociação se suavizam por atração, valor e harmonia. Um astro neste termo ganha apoio para expressar Vênus no tema de Libra.",
    "mars": "Relação, equilíbrio e negociação se ativam por impulso, coragem e disputa. Um astro neste termo ganha apoio para expressar Marte no tema de Libra."
  },
  {
    "mars": "Intensidade, transformação e poder se ativam por impulso, coragem e disputa. Um astro neste termo ganha apoio para expressar Marte no tema de Escorpião.",
    "venus": "Intensidade, transformação e poder se suavizam por atração, valor e harmonia. Um astro neste termo ganha apoio para expressar Vênus no tema de Escorpião.",
    "mercury": "Intensidade, transformação e poder ganham movimento por raciocínio, fala e adaptação. Um astro neste termo ganha apoio para expressar Mercúrio no tema de Escorpião.",
    "jupiter": "Intensidade, transformação e poder se ampliam por otimismo, ensino e oportunidade. Um astro neste termo ganha apoio para expressar Júpiter no tema de Escorpião.",
    "saturn": "Intensidade, transformação e poder se estruturam por limite, disciplina e maturidade. Um astro neste termo ganha apoio para expressar Saturno no tema de Escorpião."
  },
  {
    "jupiter": "Expansão, fé e busca de sentido se ampliam por otimismo, ensino e oportunidade. Um astro neste termo ganha apoio para expressar Júpiter no tema de Sagitário.",
    "venus": "Expansão, fé e busca de sentido se suavizam por atração, valor e harmonia. Um astro neste termo ganha apoio para expressar Vênus no tema de Sagitário.",
    "mercury": "Expansão, fé e busca de sentido ganham movimento por raciocínio, fala e adaptação. Um astro neste termo ganha apoio para expressar Mercúrio no tema de Sagitário.",
    "saturn": "Expansão, fé e busca de sentido se estruturam por limite, disciplina e maturidade. Um astro neste termo ganha apoio para expressar Saturno no tema de Sagitário.",
    "mars": "Expansão, fé e busca de sentido se ativam por impulso, coragem e disputa. Um astro neste termo ganha apoio para expressar Marte no tema de Sagitário."
  },
  {
    "mercury": "Estrutura, ambição e responsabilidade ganham movimento por raciocínio, fala e adaptação. Um astro neste termo ganha apoio para expressar Mercúrio no tema de Capricórnio.",
    "jupiter": "Estrutura, ambição e responsabilidade se ampliam por otimismo, ensino e oportunidade. Um astro neste termo ganha apoio para expressar Júpiter no tema de Capricórnio.",
    "venus": "Estrutura, ambição e responsabilidade se suavizam por atração, valor e harmonia. Um astro neste termo ganha apoio para expressar Vênus no tema de Capricórnio.",
    "saturn": "Estrutura, ambição e responsabilidade se estruturam por limite, disciplina e maturidade. Um astro neste termo ganha apoio para expressar Saturno no tema de Capricórnio.",
    "mars": "Estrutura, ambição e responsabilidade se ativam por impulso, coragem e disputa. Um astro neste termo ganha apoio para expressar Marte no tema de Capricórnio."
  },
  {
    "mercury": "Coletividade, inovação e distanciamento ganham movimento por raciocínio, fala e adaptação. Um astro neste termo ganha apoio para expressar Mercúrio no tema de Aquário.",
    "venus": "Coletividade, inovação e distanciamento se suavizam por atração, valor e harmonia. Um astro neste termo ganha apoio para expressar Vênus no tema de Aquário.",
    "jupiter": "Coletividade, inovação e distanciamento se ampliam por otimismo, ensino e oportunidade. Um astro neste termo ganha apoio para expressar Júpiter no tema de Aquário.",
    "mars": "Coletividade, inovação e distanciamento se ativam por impulso, coragem e disputa. Um astro neste termo ganha apoio para expressar Marte no tema de Aquário.",
    "saturn": "Coletividade, inovação e distanciamento se estruturam por limite, disciplina e maturidade. Um astro neste termo ganha apoio para expressar Saturno no tema de Aquário."
  },
  {
    "venus": "Empatia, imaginação e dissolução se suavizam por atração, valor e harmonia. Um astro neste termo ganha apoio para expressar Vênus no tema de Peixes.",
    "jupiter": "Empatia, imaginação e dissolução se ampliam por otimismo, ensino e oportunidade. Um astro neste termo ganha apoio para expressar Júpiter no tema de Peixes.",
    "mercury": "Empatia, imaginação e dissolução ganham movimento por raciocínio, fala e adaptação. Um astro neste termo ganha apoio para expressar Mercúrio no tema de Peixes.",
    "mars": "Empatia, imaginação e dissolução se ativam por impulso, coragem e disputa. Um astro neste termo ganha apoio para expressar Marte no tema de Peixes.",
    "saturn": "Empatia, imaginação e dissolução se estruturam por limite, disciplina e maturidade. Um astro neste termo ganha apoio para expressar Saturno no tema de Peixes."
  }
];

/** Decanatos 0–35 (Áries 1º … Peixes 3º), regente caldeu + leitura */
export const DECAN_SHEET: { ruler: string; text: string }[] = [
  {
    "ruler": "mars",
    "text": "Iniciativa impulsiva, coragem de começar e ação direta."
  },
  {
    "ruler": "sun",
    "text": "Liderança visível, orgulho e afirmação pessoal na ação."
  },
  {
    "ruler": "venus",
    "text": "Conquista pelo charme, desejo de harmonia e atração ativa."
  },
  {
    "ruler": "mercury",
    "text": "Planejamento prático, negociação e habilidade manual."
  },
  {
    "ruler": "moon",
    "text": "Sensibilidade, apego e cuidado com o que é próprio."
  },
  {
    "ruler": "saturn",
    "text": "Persistência, limites e consolidação material."
  },
  {
    "ruler": "jupiter",
    "text": "Curiosidade expansiva, ensino e otimismo verbal."
  },
  {
    "ruler": "mars",
    "text": "Debate, ímpeto mental e disputa de ideias."
  },
  {
    "ruler": "sun",
    "text": "Expressão brilhante, reconhecimento e comunicação central."
  },
  {
    "ruler": "venus",
    "text": "Afeto, receptividade e vínculos domésticos."
  },
  {
    "ruler": "mercury",
    "text": "Conversa emotiva, memória e cuidado comunicativo."
  },
  {
    "ruler": "moon",
    "text": "Intuição forte, proteção e oscilação emocional."
  },
  {
    "ruler": "saturn",
    "text": "Autoridade séria, disciplina e ambição estruturada."
  },
  {
    "ruler": "jupiter",
    "text": "Generosidade, expansão e orgulho magnânimo."
  },
  {
    "ruler": "mars",
    "text": "Coragem teatral, competição e vontade ardente."
  },
  {
    "ruler": "sun",
    "text": "Serviço organizado, análise e busca de aperfeiçoamento."
  },
  {
    "ruler": "venus",
    "text": "Refinamento, cuidado e prazer nas pequenas coisas."
  },
  {
    "ruler": "mercury",
    "text": "Precisão, crítica e habilidade técnica."
  },
  {
    "ruler": "moon",
    "text": "Diplomacia sensível e necessidade de aprovação afetiva."
  },
  {
    "ruler": "saturn",
    "text": "Justiça formal, compromisso e relações sérias."
  },
  {
    "ruler": "jupiter",
    "text": "Conciliação ampla, otimismo social e alianças."
  },
  {
    "ruler": "mars",
    "text": "Intensidade, estratégia e desejo transformador."
  },
  {
    "ruler": "sun",
    "text": "Poder pessoal, lealdade e presença magnética."
  },
  {
    "ruler": "venus",
    "text": "Sedução, profundidade afetiva e troca intensa."
  },
  {
    "ruler": "mercury",
    "text": "Aprendizado, viagem mental e curiosidade filosófica."
  },
  {
    "ruler": "moon",
    "text": "Idealismo emotivo e busca de pertencimento amplo."
  },
  {
    "ruler": "saturn",
    "text": "Fé disciplinada, limites morais e maturidade."
  },
  {
    "ruler": "jupiter",
    "text": "Ambição prudente, expansão estruturada e status."
  },
  {
    "ruler": "mars",
    "text": "Determinação, competição e esforço construtivo."
  },
  {
    "ruler": "sun",
    "text": "Liderança, realização e autoridade conquistada."
  },
  {
    "ruler": "venus",
    "text": "Amizade, idealismo afetivo e sociabilidade."
  },
  {
    "ruler": "mercury",
    "text": "Ideias originais, redes e comunicação inovadora."
  },
  {
    "ruler": "moon",
    "text": "Empatia coletiva, memória social e sensibilidade."
  },
  {
    "ruler": "saturn",
    "text": "Compaixão realista, sacrifício e limites espirituais."
  },
  {
    "ruler": "jupiter",
    "text": "Fé, imaginação e generosidade espiritual."
  },
  {
    "ruler": "mars",
    "text": "Ação inspirada, coragem emotiva e impulso idealista."
  }
];
