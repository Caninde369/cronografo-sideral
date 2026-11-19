/**
 * Conteúdo das tooltips — planilha "tooltips_cronografo_revisao" aprovada pelo Rafa (19/11/2026).
 * Padrão: palavras-chave (tags) + influxo (mini parágrafo impessoal, até ~4 linhas).
 * Contexto técnico (natureza, anos maiores, triplicidade, dignidade e posição dos termos) entra como dado.
 * Termos: tabela egípcia de terms.ts; revisão da lógica com D. Houlding, "Ptolemy's Terms" (Skyscript).
 */
export type SheetItem = { kw: string; text: string };

export const BODY_SHEET: Record<string, SheetItem & { type: string; nature: string | null; years: number | null }> = {
  "sun": {
    "type": "Luminar · Tradicional",
    "nature": "Luminar diurno · rege a seita do dia",
    "years": null,
    "kw": "Vitalidade · Identidade · Autoridade · Consciência",
    "text": "Centro da vontade e da vitalidade. Ilumina o que toca, dá direção e pede expressão consciente. Onde está, há busca de reconhecimento e de autoria."
  },
  "moon": {
    "type": "Luminar · Tradicional",
    "nature": "Luminar noturno · rege a seita da noite",
    "years": null,
    "kw": "Emoção · Instinto · Memória · Nutrição",
    "text": "Rege necessidades, hábitos e ritmos. Sensibiliza o que toca e responde ao ambiente com oscilação. Mostra onde há busca de segurança e nutrição."
  },
  "mercury": {
    "type": "Planeta clássico · Tradicional",
    "nature": "Comum (neutro) · toma a natureza de quem o aspecta",
    "years": 76,
    "kw": "Raciocínio · Comunicação · Comércio · Mediação",
    "text": "Liga, traduz e adapta. Move a informação, o comércio e as trocas. Onde está, o raciocínio ganha velocidade e a palavra vira ferramenta."
  },
  "venus": {
    "type": "Planeta clássico · Tradicional",
    "nature": "Benéfico menor · noturno",
    "years": 82,
    "kw": "Atração · Afeto · Valor · Beleza · Acordo",
    "text": "Une, atrai e harmoniza. Atribui valor, prazer e beleza ao que toca. Indica acordos, afetos e aquilo que se deseja preservar."
  },
  "mars": {
    "type": "Planeta clássico · Tradicional",
    "nature": "Maléfico menor · noturno",
    "years": 66,
    "kw": "Ação · Desejo · Coragem · Disputa",
    "text": "Corta, separa e impulsiona. Fornece energia de iniciativa, desejo e defesa. Onde atua, há pressa, disputa e capacidade de conquista."
  },
  "jupiter": {
    "type": "Planeta clássico · Tradicional",
    "nature": "Benéfico maior · diurno",
    "years": 79,
    "kw": "Expansão · Fé · Sabedoria · Oportunidade",
    "text": "Amplia e favorece. Traz crescimento, confiança e busca de sentido. Onde está, há oportunidade, generosidade e tendência ao excesso."
  },
  "saturn": {
    "type": "Planeta clássico · Tradicional",
    "nature": "Maléfico maior · diurno",
    "years": 57,
    "kw": "Limite · Estrutura · Tempo · Responsabilidade",
    "text": "Contém, mede e consolida. Exige tempo, esforço e responsabilidade. Onde atua, os resultados demoram, mas tendem a durar."
  },
  "uranus": {
    "type": "Planeta moderno · Moderno",
    "nature": null,
    "years": null,
    "kw": "Ruptura · Inovação · Liberdade · Despertar",
    "text": "Rompe padrões e acelera mudanças. Traz o inesperado, a invenção e a necessidade de liberdade. Onde atua, a estabilidade dá lugar ao novo."
  },
  "neptune": {
    "type": "Planeta moderno · Moderno",
    "nature": null,
    "years": null,
    "kw": "Imaginação · Ideal · Compaixão · Dissolução",
    "text": "Dissolve fronteiras e limites. Inspira imaginação, compaixão e fé, mas também confusão e idealização. Onde atua, o concreto perde nitidez."
  },
  "pluto": {
    "type": "Planeta moderno · Moderno",
    "nature": null,
    "years": null,
    "kw": "Transformação · Poder · Intensidade · Renascimento",
    "text": "Transforma em profundidade. Destrói o que se esgotou para regenerar. Onde atua, há crise, intensidade e reorganização do poder."
  },
  "northNode": {
    "type": "Ponto lunar · Tradicional",
    "nature": null,
    "years": null,
    "kw": "Direção · Desenvolvimento · Aprendizado",
    "text": "Aponta a direção de desenvolvimento. Indica o que pede integração e crescimento, mesmo sem familiaridade. Eixo de aprendizado e futuro."
  },
  "southNode": {
    "type": "Ponto lunar · Tradicional",
    "nature": null,
    "years": null,
    "kw": "Herança · Hábito · Talento conhecido",
    "text": "Indica o que já é conhecido e dominado. Talentos herdados e hábitos enraizados. Pede liberação gradual para dar espaço ao novo."
  },
  "lilith": {
    "type": "Ponto fictício · Moderno",
    "nature": null,
    "years": null,
    "kw": "Instinto · Autonomia · Desejo reprimido · Sombra",
    "text": "Revela o que foi negado ou reprimido. Reivindica autonomia, desejo e instinto sem concessão. Onde está, há recusa a ser controlado."
  },
  "chiron": {
    "type": "Asteroide · Moderno",
    "nature": null,
    "years": null,
    "kw": "Ferida · Vulnerabilidade · Cura · Ensino",
    "text": "Marca uma ferida sensível e persistente. A partir dela nasce um saber capaz de curar e ensinar. Ponte entre a dor e a sabedoria."
  },
  "ceres": {
    "type": "Asteroide · Moderno",
    "nature": null,
    "years": null,
    "kw": "Nutrição · Cuidado · Ciclos · Perda e retorno",
    "text": "Rege nutrição, cuidado e acolhimento. Descreve ciclos de perda e retorno. Mostra como se sustenta e como se deseja ser sustentado."
  },
  "pallas": {
    "type": "Asteroide · Moderno",
    "nature": null,
    "years": null,
    "kw": "Estratégia · Padrões · Inteligência aplicada",
    "text": "Inteligência estratégica e aplicada. Reconhece padrões, vê o todo e resolve com método. Indica criatividade voltada à solução."
  },
  "juno": {
    "type": "Asteroide · Moderno",
    "nature": null,
    "years": null,
    "kw": "Compromisso · Parceria · Lealdade · Pacto",
    "text": "Rege compromissos e pactos. Descreve o que se busca em vínculos duradouros: lealdade, reciprocidade e acordos claros."
  },
  "vesta": {
    "type": "Asteroide · Moderno",
    "nature": null,
    "years": null,
    "kw": "Devoção · Foco · Sagrado · Consagração",
    "text": "Concentra energia no que é consagrado. Foco, devoção e cuidado contínuo. Indica aquilo que se protege e se mantém com dedicação."
  },
  "partOfFortune": {
    "type": "Ponto árabe · Tradicional",
    "nature": null,
    "years": null,
    "kw": "Prosperidade · Corpo · Circunstância · Fluidez",
    "text": "Ponto de fluidez entre corpo e circunstância. Mostra onde a vida corre com mais naturalidade e onde há prosperidade e bem-estar."
  }
};

/** Áries a Peixes */
export const SIGN_SHEET: (SheetItem & { triplicity: string; excess: string })[] = [
  {
    "triplicity": "Sol (dia) · Júpiter (noite) · Saturno (participante)",
    "kw": "Iniciativa · Coragem · Impulso · Começo",
    "text": "Inicia, enfrenta e abre caminho. A ação é direta e imediata, movida pelo impulso do começo. Rende mais na largada do que na continuidade.",
    "excess": "Impaciência."
  },
  {
    "triplicity": "Vênus (dia) · Lua (noite) · Marte (participante)",
    "kw": "Estabilidade · Recursos · Prazer · Persistência",
    "text": "Consolida, conserva e dá corpo às coisas. Valoriza o concreto, o prazer dos sentidos e o que dura. Move-se devagar, mas com firmeza.",
    "excess": "Resistência à mudança."
  },
  {
    "triplicity": "Saturno (dia) · Mercúrio (noite) · Júpiter (participante)",
    "kw": "Curiosidade · Comunicação · Versatilidade · Troca",
    "text": "Conecta, pergunta e faz circular. Multiplica ideias, contatos e trocas. Prefere a variedade à profundidade e se adapta com rapidez.",
    "excess": "Dispersão."
  },
  {
    "triplicity": "Vênus (dia) · Marte (noite) · Lua (participante)",
    "kw": "Cuidado · Proteção · Memória · Vínculo",
    "text": "Acolhe, protege e guarda memória. Cria vínculos de pertencimento e cuida do que é próximo. Responde às emoções antes da razão.",
    "excess": "Retraimento defensivo."
  },
  {
    "triplicity": "Sol (dia) · Júpiter (noite) · Saturno (participante)",
    "kw": "Criatividade · Expressão · Generosidade · Reconhecimento",
    "text": "Irradia, cria e lidera. Busca expressão e reconhecimento, com generosidade e presença. Coloca o coração no centro da ação.",
    "excess": "Orgulho."
  },
  {
    "triplicity": "Vênus (dia) · Lua (noite) · Marte (participante)",
    "kw": "Análise · Serviço · Precisão · Organização · Aperfeiçoamento",
    "text": "Ordena, depura e aperfeiçoa. Analisa os detalhes e coloca a técnica a serviço do que é útil. Busca eficiência e precisão.",
    "excess": "Crítica excessiva."
  },
  {
    "triplicity": "Saturno (dia) · Mercúrio (noite) · Júpiter (participante)",
    "kw": "Relação · Diplomacia · Justiça · Estética · Equilíbrio",
    "text": "Pondera, harmoniza e relaciona. Busca justiça, beleza e o meio-termo entre as partes. Decide considerando o outro.",
    "excess": "Indecisão."
  },
  {
    "triplicity": "Vênus (dia) · Marte (noite) · Lua (participante)",
    "kw": "Intensidade · Profundidade · Transformação · Poder",
    "text": "Penetra, investiga e transforma. Age com intensidade e vai até o fim. Lida com crises, segredos e poder sem superficialidade.",
    "excess": "Controle."
  },
  {
    "triplicity": "Sol (dia) · Júpiter (noite) · Saturno (participante)",
    "kw": "Expansão · Fé · Aprendizado · Viagem · Sentido",
    "text": "Amplia horizontes e busca sentido. Move-se pela fé, pelo estudo e pela aventura. Mira longe e confia no caminho.",
    "excess": "Exagero."
  },
  {
    "triplicity": "Vênus (dia) · Lua (noite) · Marte (participante)",
    "kw": "Ambição · Estrutura · Responsabilidade · Disciplina",
    "text": "Constrói com método, tempo e responsabilidade. Mira resultados duradouros e posição. Aceita o esforço como parte da conquista.",
    "excess": "Rigidez."
  },
  {
    "triplicity": "Saturno (dia) · Mercúrio (noite) · Júpiter (participante)",
    "kw": "Coletividade · Inovação · Ideal · Independência",
    "text": "Pensa o coletivo e o futuro. Inova, questiona normas e preza a independência. Observa com distanciamento e busca ideais comuns.",
    "excess": "Frieza."
  },
  {
    "triplicity": "Vênus (dia) · Marte (noite) · Lua (participante)",
    "kw": "Empatia · Imaginação · Espiritualidade · Dissolução",
    "text": "Dissolve fronteiras e sente o todo. Rege a imaginação, a fé e a compaixão. Acolhe sem julgar, mas tem dificuldade com limites.",
    "excess": "Evasão."
  }
];

/** Termos: [signo][regente] */
export const TERM_SHEET: Record<string, SheetItem & { dignity: string; position: string }>[] = [
  {
    "jupiter": {
      "dignity": "Triplicidade",
      "position": "Abre o signo",
      "kw": "Liderança · Entusiasmo · Sorte nos começos",
      "text": "O impulso de começar ganha otimismo e visão. A iniciativa é favorecida e a liderança encontra confiança. Bom trecho para lançar o novo."
    },
    "venus": {
      "dignity": "Exílio",
      "position": "Meio do signo",
      "kw": "Paixão · Desejo · Conquista",
      "text": "A ação é movida por desejo e atração. O fogo se torna charme e conquista direta. Paixões rápidas e vontade de agradar."
    },
    "mercury": {
      "dignity": "Peregrino",
      "position": "Meio do signo",
      "kw": "Raciocínio ágil · Debate · Decisão",
      "text": "A mente acelera e decide no calor do momento. Fala direta, raciocínio rápido e gosto pelo debate. Ideias viram ação imediata."
    },
    "mars": {
      "dignity": "Domicílio",
      "position": "Meio do signo",
      "kw": "Força · Combate · Competição",
      "text": "Marte em casa: energia de ação no máximo. Coragem para enfrentar, competir e romper resistências. Força pura, pouca paciência."
    },
    "saturn": {
      "dignity": "Triplicidade · Queda",
      "position": "Fecha o signo · maléfico no fim (trecho mais áspero)",
      "kw": "Esforço · Lição · Obstáculo",
      "text": "O impulso encontra freio. Conquistas custam esforço e ensinam pela experiência. A pressa é testada pela realidade."
    }
  },
  {
    "venus": {
      "dignity": "Domicílio · Triplicidade",
      "position": "Abre o signo",
      "kw": "Prazer · Conforto · Sensualidade",
      "text": "Vênus em casa: prazer dos sentidos, conforto e beleza. Gosto pela fartura e pelo que é agradável e estável. Fruição plena."
    },
    "mercury": {
      "dignity": "Peregrino",
      "position": "Meio do signo",
      "kw": "Praticidade · Negócio · Bom senso",
      "text": "O pensamento se torna prático e voltado a recursos. Bom senso, talento para negócios e aprendizado que se fixa."
    },
    "jupiter": {
      "dignity": "Peregrino",
      "position": "Meio do signo",
      "kw": "Fartura · Prosperidade · Estabilidade",
      "text": "Crescimento material sobre bases firmes. Abundância, generosidade e confiança no que foi construído. Prosperidade gradual."
    },
    "saturn": {
      "dignity": "Peregrino",
      "position": "Meio do signo",
      "kw": "Persistência · Economia · Paciência",
      "text": "A construção pede tempo e economia. Esforço contínuo, controle dos recursos e paciência para durar. Ganhos lentos, porém sólidos."
    },
    "mars": {
      "dignity": "Triplicidade · Exílio",
      "position": "Fecha o signo · maléfico no fim (trecho mais áspero)",
      "kw": "Determinação · Posse · Resistência",
      "text": "A energia ganha peso e resistência. Determinação para defender o que é seu, com teimosia. Força que não recua."
    }
  },
  {
    "mercury": {
      "dignity": "Domicílio · Triplicidade",
      "position": "Abre o signo",
      "kw": "Inteligência · Comunicação · Agilidade",
      "text": "Mercúrio em casa: mente ágil e fala fácil. Troca intensa de informações e curiosidade por tudo. Muitas ideias ao mesmo tempo."
    },
    "jupiter": {
      "dignity": "Triplicidade · Exílio",
      "position": "Meio do signo",
      "kw": "Conhecimento · Ensino · Ideias amplas",
      "text": "A curiosidade se expande em estudo e ensino. Gosto por conhecimento amplo e otimismo nas trocas. Aprender e transmitir."
    },
    "venus": {
      "dignity": "Peregrino",
      "position": "Meio do signo",
      "kw": "Charme · Conversa · Arte da palavra",
      "text": "A palavra ganha encanto. Comunicação gentil, persuasiva e sociável. Sensibilidade para a arte da conversa e da escrita."
    },
    "mars": {
      "dignity": "Peregrino",
      "position": "Meio do signo",
      "kw": "Argumento · Crítica · Inquietação",
      "text": "As ideias viram armas. Debate afiado, crítica rápida e inquietação mental. Palavras que defendem ou ferem."
    },
    "saturn": {
      "dignity": "Triplicidade",
      "position": "Fecha o signo · maléfico no fim (trecho mais áspero)",
      "kw": "Método · Concentração · Preocupação",
      "text": "A mente pede método. Concentração, estudo profundo e raciocínio cuidadoso. Tendência à preocupação e à cautela."
    }
  },
  {
    "mars": {
      "dignity": "Triplicidade · Queda",
      "position": "Abre o signo · Marte recebe a casa da Lua (luminares não regem termos)",
      "kw": "Proteção · Reatividade · Defesa",
      "text": "O cuidado vira defesa. Instinto de proteger o que é próximo, com reações emocionais fortes. Luta pelo lar e pela família."
    },
    "venus": {
      "dignity": "Triplicidade",
      "position": "Meio do signo",
      "kw": "Ternura · Acolhimento · Intimidade",
      "text": "O cuidado ganha doçura. Carinho, acolhimento e prazer na intimidade. Vínculos afetivos e harmonia doméstica."
    },
    "mercury": {
      "dignity": "Peregrino",
      "position": "Meio do signo",
      "kw": "Memória · Intuição · Adaptação",
      "text": "A mente sente. Memória afetiva, intuição e adaptação ao ambiente. Percepção sutil do que não é dito."
    },
    "jupiter": {
      "dignity": "Exaltação",
      "position": "Meio do signo",
      "kw": "Generosidade · Proteção · Fartura",
      "text": "Júpiter exaltado: cuidado generoso e fartura no lar. Proteção ampla e fé que acolhe. Abundância afetiva."
    },
    "saturn": {
      "dignity": "Exílio",
      "position": "Fecha o signo · maléfico no fim (trecho mais áspero)",
      "kw": "Dever · Cautela · Retraimento",
      "text": "O afeto encontra limites. Deveres com a família, cautela emocional e retraimento. Lições que amadurecem os vínculos."
    }
  },
  {
    "jupiter": {
      "dignity": "Triplicidade",
      "position": "Abre o signo",
      "kw": "Nobreza · Generosidade · Liderança",
      "text": "O brilho se expande. Generosidade, nobreza e liderança que inspira confiança. Reconhecimento favorecido."
    },
    "venus": {
      "dignity": "Peregrino",
      "position": "Meio do signo",
      "kw": "Romance · Arte · Prazer",
      "text": "O coração se expressa. Romance, arte e prazer em ser admirado. Criatividade com charme e calor."
    },
    "saturn": {
      "dignity": "Triplicidade · Exílio",
      "position": "Meio do signo",
      "kw": "Autoridade · Dever · Orgulho testado",
      "text": "O brilho é testado. Autoridade que pesa e reconhecimento conquistado com esforço. Lições sobre orgulho e responsabilidade."
    },
    "mercury": {
      "dignity": "Peregrino",
      "position": "Meio do signo",
      "kw": "Eloquência · Persuasão · Criatividade",
      "text": "A mente ganha palco. Eloquência, ideias criativas e talento para persuadir. Planejamento com presença."
    },
    "mars": {
      "dignity": "Peregrino",
      "position": "Fecha o signo · maléfico no fim (trecho mais áspero)",
      "kw": "Bravura · Ambição · Imposição",
      "text": "O fogo se intensifica. Bravura, ambição de vencer e vontade de se impor. Ação heroica, às vezes autoritária."
    }
  },
  {
    "mercury": {
      "dignity": "Domicílio · Exaltação",
      "position": "Abre o signo",
      "kw": "Análise · Precisão · Ofício",
      "text": "Mercúrio em casa e exaltado: mente analítica e precisa. Excelência técnica, atenção ao detalhe e domínio do ofício."
    },
    "venus": {
      "dignity": "Triplicidade · Queda",
      "position": "Meio do signo",
      "kw": "Cuidado · Refinamento · Serviço",
      "text": "A ordem ganha delicadeza. Refinamento, cuidado com o outro e prazer em servir. Estética do detalhe."
    },
    "jupiter": {
      "dignity": "Exílio",
      "position": "Meio do signo",
      "kw": "Aperfeiçoamento · Saúde · Utilidade",
      "text": "O detalhe se amplia em aperfeiçoamento. Cuidado com a saúde, utilidade e sabedoria prática. Melhoria contínua."
    },
    "mars": {
      "dignity": "Triplicidade",
      "position": "Meio do signo",
      "kw": "Rigor · Eficiência · Trabalho intenso",
      "text": "O esforço se aguça. Trabalho intenso, exigência alta e senso crítico afiado. Eficiência a qualquer custo."
    },
    "saturn": {
      "dignity": "Peregrino",
      "position": "Fecha o signo · maléfico no fim (trecho mais áspero)",
      "kw": "Disciplina · Escrúpulo · Contenção",
      "text": "A ordem vira dever. Método rígido, escrúpulo e contenção. Perfeccionismo e responsabilidade com as tarefas."
    }
  },
  {
    "saturn": {
      "dignity": "Exaltação · Triplicidade",
      "position": "Abre o signo · maléfico com dupla dignidade",
      "kw": "Justiça · Compromisso · Imparcialidade",
      "text": "Saturno exaltado: equilíbrio construído com regras. Justiça, imparcialidade e acordos duradouros. Compromisso sério."
    },
    "mercury": {
      "dignity": "Triplicidade",
      "position": "Meio do signo",
      "kw": "Diplomacia · Negociação · Mediação",
      "text": "A mente busca o meio-termo. Diplomacia, negociação e mediação. Talento para ouvir os dois lados e argumentar."
    },
    "jupiter": {
      "dignity": "Triplicidade",
      "position": "Meio do signo",
      "kw": "Benevolência · Sociedade · Harmonia",
      "text": "As relações se ampliam. Parcerias generosas, bom convívio e prosperidade a dois. Harmonia social favorecida."
    },
    "venus": {
      "dignity": "Domicílio",
      "position": "Meio do signo",
      "kw": "Beleza · Amor · Elegância",
      "text": "Vênus em casa: encanto, elegância e estética apurada. Prazer nas relações, na arte e na beleza. Harmonia plena."
    },
    "mars": {
      "dignity": "Exílio",
      "position": "Fecha o signo · maléfico no fim (trecho mais áspero)",
      "kw": "Conflito · Disputa · Afirmação",
      "text": "O equilíbrio é desafiado. Disputas, paixões e necessidade de afirmação diante do outro. Tensão nas relações."
    }
  },
  {
    "mars": {
      "dignity": "Domicílio · Triplicidade",
      "position": "Abre o signo · maléfico com dupla dignidade",
      "kw": "Intensidade · Estratégia · Poder",
      "text": "Marte em casa: força profunda e estratégia silenciosa. Coragem diante das crises e domínio do próprio poder."
    },
    "venus": {
      "dignity": "Triplicidade · Exílio",
      "position": "Meio do signo",
      "kw": "Paixão · Magnetismo · Entrega",
      "text": "A intensidade encontra o afeto. Paixão profunda, magnetismo e entrega total. Vínculos que transformam."
    },
    "mercury": {
      "dignity": "Peregrino",
      "position": "Meio do signo",
      "kw": "Investigação · Perspicácia · Segredo",
      "text": "A mente mergulha. Investigação, perspicácia psicológica e talento para descobrir segredos. Pensamento penetrante."
    },
    "jupiter": {
      "dignity": "Peregrino",
      "position": "Meio do signo",
      "kw": "Regeneração · Fé · Recursos partilhados",
      "text": "A transformação se amplia. Regeneração, fé nas crises e ganhos com recursos partilhados. Cura e renascimento."
    },
    "saturn": {
      "dignity": "Peregrino",
      "position": "Fecha o signo · maléfico no fim (trecho mais áspero)",
      "kw": "Provação · Controle · Resistência",
      "text": "A profundidade pesa. Provações, controle emocional e resistência para atravessar perdas. Firmeza diante do fim."
    }
  },
  {
    "jupiter": {
      "dignity": "Domicílio · Triplicidade",
      "position": "Abre o signo",
      "kw": "Fé · Sabedoria · Fortuna",
      "text": "Júpiter em casa: fé, visão ampla e fortuna. Sorte em estudos, viagens e ensino. Otimismo que abre caminhos."
    },
    "venus": {
      "dignity": "Peregrino",
      "position": "Meio do signo",
      "kw": "Alegria · Liberdade · Aventura",
      "text": "A busca ganha leveza. Alegria de viver, liberdade afetiva e gosto pela aventura. Generosidade espontânea."
    },
    "mercury": {
      "dignity": "Exílio",
      "position": "Meio do signo",
      "kw": "Filosofia · Ensino · Visão",
      "text": "A mente mira longe. Pensamento filosófico, ensino e ideias de grande alcance. Debate de princípios."
    },
    "saturn": {
      "dignity": "Triplicidade",
      "position": "Meio do signo",
      "kw": "Doutrina · Rigor · Responsabilidade moral",
      "text": "A fé encontra estrutura. Princípios firmes, estudo sério e responsabilidade moral. Doutrina e rigor."
    },
    "mars": {
      "dignity": "Peregrino",
      "position": "Fecha o signo · maléfico no fim (trecho mais áspero)",
      "kw": "Ímpeto · Cruzada · Exagero",
      "text": "O fogo dispara. Entusiasmo combativo, luta por ideais e ousadia. Tendência ao exagero e à cruzada."
    }
  },
  {
    "mercury": {
      "dignity": "Peregrino",
      "position": "Abre o signo",
      "kw": "Planejamento · Estratégia · Pragmatismo",
      "text": "A mente constrói. Planejamento de longo prazo, visão estratégica e pragmatismo. Organização eficiente."
    },
    "jupiter": {
      "dignity": "Queda",
      "position": "Meio do signo",
      "kw": "Ascensão · Prestígio · Autoridade",
      "text": "O crescimento ganha escada. Ambição recompensada, ascensão e prestígio. Autoridade conquistada."
    },
    "venus": {
      "dignity": "Triplicidade",
      "position": "Meio do signo",
      "kw": "Lealdade · Compromisso · Valor duradouro",
      "text": "O afeto se torna sólido. Lealdade, elegância sóbria e apreço pelo que dura. Compromissos estáveis."
    },
    "saturn": {
      "dignity": "Domicílio",
      "position": "Meio do signo",
      "kw": "Disciplina · Perseverança · Maestria",
      "text": "Saturno em casa: disciplina, perseverança e austeridade. Maestria conquistada com o tempo e o esforço."
    },
    "mars": {
      "dignity": "Exaltação · Triplicidade",
      "position": "Fecha o signo · maléfico no fim, mas dignificado",
      "kw": "Determinação · Conquista · Eficiência",
      "text": "Marte exaltado: ação estratégica e eficiente. Determinação para conquistar metas com firmeza implacável."
    }
  },
  {
    "mercury": {
      "dignity": "Triplicidade",
      "position": "Abre o signo",
      "kw": "Originalidade · Ciência · Ideias novas",
      "text": "A mente inova. Pensamento original, interesse por ciência e ideias à frente do tempo. Genialidade e lógica."
    },
    "venus": {
      "dignity": "Peregrino",
      "position": "Meio do signo",
      "kw": "Amizade · Fraternidade · Afeto livre",
      "text": "O afeto se torna amizade. Laços livres, fraternidade e encanto pelo diferente. Sociabilidade sem posse."
    },
    "jupiter": {
      "dignity": "Triplicidade",
      "position": "Meio do signo",
      "kw": "Humanitarismo · Ideal · Coletivo",
      "text": "Os ideais se expandem. Causas coletivas, generosidade com o grupo e esperança no futuro. Humanitarismo."
    },
    "mars": {
      "dignity": "Peregrino",
      "position": "Meio do signo",
      "kw": "Rebeldia · Ativismo · Ruptura",
      "text": "A liberdade vira luta. Rebeldia, ativismo e coragem para romper com o estabelecido. Ruptura e independência."
    },
    "saturn": {
      "dignity": "Domicílio · Triplicidade",
      "position": "Fecha o signo · maléfico no fim, mas dignificado",
      "kw": "Estrutura coletiva · Rigor · Distanciamento",
      "text": "Saturno em casa: ideais com estrutura. Responsabilidade social, rigor e distanciamento racional. Ordem coletiva."
    }
  },
  {
    "venus": {
      "dignity": "Exaltação · Triplicidade",
      "position": "Abre o signo",
      "kw": "Compaixão · Arte · Inspiração",
      "text": "Vênus exaltada: amor sem condições, compaixão e sensibilidade artística. Inspiração e entrega afetiva."
    },
    "jupiter": {
      "dignity": "Domicílio",
      "position": "Meio do signo",
      "kw": "Fé · Espiritualidade · Proteção",
      "text": "Júpiter em casa: fé profunda, generosidade e proteção invisível. Espiritualidade que acolhe e amplia."
    },
    "mercury": {
      "dignity": "Exílio · Queda",
      "position": "Meio do signo",
      "kw": "Imaginação · Intuição · Dispersão",
      "text": "A mente sonha. Imaginação fértil, intuição e linguagem poética. Dificuldade com o concreto e com prazos."
    },
    "mars": {
      "dignity": "Triplicidade",
      "position": "Meio do signo",
      "kw": "Sacrifício · Ação intuitiva · Entrega",
      "text": "A ação se dissolve em causas. Energia guiada pela intuição, sacrifício e entrega. Batalhas silenciosas."
    },
    "saturn": {
      "dignity": "Peregrino",
      "position": "Fecha o signo · maléfico no fim (trecho mais áspero)",
      "kw": "Renúncia · Isolamento · Disciplina espiritual",
      "text": "O sonho encontra limites. Renúncia, recolhimento e disciplina espiritual. Lições que amadurecem a fé."
    }
  }
];

/** Decanatos 0–35 (Áries 1º … Peixes 3º) */
export const DECAN_SHEET: (SheetItem & { ruler: string; dignity: string })[] = [
  {
    "ruler": "mars",
    "dignity": "Domicílio",
    "kw": "Impulso · Coragem · Ação direta",
    "text": "Marte no próprio signo: começo com força e sem rodeios. Iniciativa impulsiva, coragem e ação direta."
  },
  {
    "ruler": "sun",
    "dignity": "Exaltação · Triplicidade",
    "kw": "Liderança · Orgulho · Afirmação",
    "text": "O Sol traz visibilidade à ação. Liderança, orgulho e afirmação pessoal. A iniciativa busca reconhecimento."
  },
  {
    "ruler": "venus",
    "dignity": "Exílio",
    "kw": "Charme · Atração · Conquista",
    "text": "Vênus suaviza o impulso. Conquista pelo charme, desejo de harmonia e atração ativa."
  },
  {
    "ruler": "mercury",
    "dignity": "Peregrino",
    "kw": "Planejamento · Negociação · Habilidade manual",
    "text": "Mercúrio aplica a mente à matéria. Planejamento prático, negociação e habilidade manual."
  },
  {
    "ruler": "moon",
    "dignity": "Exaltação · Triplicidade",
    "kw": "Sensibilidade · Apego · Cuidado",
    "text": "A Lua, exaltada aqui, sensibiliza a posse. Apego, cuidado e proteção do que é próprio."
  },
  {
    "ruler": "saturn",
    "dignity": "Peregrino",
    "kw": "Persistência · Limite · Consolidação",
    "text": "Saturno firma a construção. Persistência, limites e consolidação material de longo prazo."
  },
  {
    "ruler": "jupiter",
    "dignity": "Triplicidade · Exílio",
    "kw": "Curiosidade · Ensino · Otimismo",
    "text": "Júpiter amplia a curiosidade. Ensino, otimismo verbal e gosto por conhecimento amplo."
  },
  {
    "ruler": "mars",
    "dignity": "Peregrino",
    "kw": "Debate · Ímpeto mental · Disputa",
    "text": "Marte aquece a mente. Debate, ímpeto intelectual e disputa de ideias."
  },
  {
    "ruler": "sun",
    "dignity": "Peregrino",
    "kw": "Expressão · Reconhecimento · Comunicação",
    "text": "O Sol centraliza a expressão. Comunicação brilhante e reconhecimento pela palavra."
  },
  {
    "ruler": "venus",
    "dignity": "Triplicidade",
    "kw": "Afeto · Receptividade · Vínculo doméstico",
    "text": "Vênus traz doçura ao cuidado. Afeto, receptividade e vínculos domésticos."
  },
  {
    "ruler": "mercury",
    "dignity": "Peregrino",
    "kw": "Memória · Conversa emotiva · Cuidado",
    "text": "Mercúrio dá voz à emoção. Memória, conversa afetiva e cuidado comunicativo."
  },
  {
    "ruler": "moon",
    "dignity": "Domicílio · Triplicidade",
    "kw": "Intuição · Proteção · Oscilação",
    "text": "A Lua no próprio signo: intuição forte, proteção e oscilação emocional."
  },
  {
    "ruler": "saturn",
    "dignity": "Triplicidade · Exílio",
    "kw": "Autoridade · Disciplina · Ambição",
    "text": "Saturno disciplina o brilho. Autoridade séria, dever e ambição estruturada."
  },
  {
    "ruler": "jupiter",
    "dignity": "Triplicidade",
    "kw": "Generosidade · Expansão · Magnanimidade",
    "text": "Júpiter expande a generosidade. Magnanimidade, nobreza e orgulho que acolhe."
  },
  {
    "ruler": "mars",
    "dignity": "Peregrino",
    "kw": "Coragem · Competição · Vontade",
    "text": "Marte aquece a vontade. Coragem teatral, competição e desejo ardente de vencer."
  },
  {
    "ruler": "sun",
    "dignity": "Peregrino",
    "kw": "Serviço · Análise · Aperfeiçoamento",
    "text": "O Sol dá propósito à ordem. Serviço organizado, análise e busca de aperfeiçoamento."
  },
  {
    "ruler": "venus",
    "dignity": "Triplicidade · Queda",
    "kw": "Refinamento · Cuidado · Detalhe",
    "text": "Vênus refina o detalhe. Cuidado, delicadeza e prazer nas pequenas coisas."
  },
  {
    "ruler": "mercury",
    "dignity": "Domicílio · Exaltação",
    "kw": "Precisão · Crítica · Habilidade técnica",
    "text": "Mercúrio no próprio signo: precisão, crítica e domínio técnico."
  },
  {
    "ruler": "moon",
    "dignity": "Peregrino",
    "kw": "Diplomacia · Sensibilidade · Aprovação",
    "text": "A Lua sensibiliza a diplomacia. Busca de aprovação afetiva e convivência harmoniosa."
  },
  {
    "ruler": "saturn",
    "dignity": "Exaltação · Triplicidade",
    "kw": "Justiça · Compromisso · Seriedade",
    "text": "Saturno, exaltado aqui, formaliza as relações. Justiça, compromisso e acordos sérios."
  },
  {
    "ruler": "jupiter",
    "dignity": "Triplicidade",
    "kw": "Conciliação · Alianças · Otimismo social",
    "text": "Júpiter amplia a conciliação. Alianças, otimismo social e parcerias prósperas."
  },
  {
    "ruler": "mars",
    "dignity": "Domicílio · Triplicidade",
    "kw": "Intensidade · Estratégia · Desejo",
    "text": "Marte no próprio signo: intensidade, estratégia e desejo de transformação."
  },
  {
    "ruler": "sun",
    "dignity": "Peregrino",
    "kw": "Poder pessoal · Lealdade · Magnetismo",
    "text": "O Sol concentra o poder pessoal. Lealdade, presença magnética e controle."
  },
  {
    "ruler": "venus",
    "dignity": "Triplicidade · Exílio",
    "kw": "Sedução · Profundidade · Troca intensa",
    "text": "Vênus aprofunda o vínculo. Sedução, entrega afetiva e trocas intensas."
  },
  {
    "ruler": "mercury",
    "dignity": "Exílio",
    "kw": "Aprendizado · Filosofia · Curiosidade",
    "text": "Mercúrio faz a mente viajar. Aprendizado, curiosidade filosófica e debate de ideias."
  },
  {
    "ruler": "moon",
    "dignity": "Peregrino",
    "kw": "Idealismo · Pertencimento · Emoção",
    "text": "A Lua emociona a fé. Idealismo, busca de pertencimento e devoção sentida."
  },
  {
    "ruler": "saturn",
    "dignity": "Triplicidade",
    "kw": "Fé disciplinada · Moral · Maturidade",
    "text": "Saturno disciplina a crença. Fé madura, limites morais e princípios firmes."
  },
  {
    "ruler": "jupiter",
    "dignity": "Queda",
    "kw": "Ambição prudente · Status · Expansão",
    "text": "Júpiter expande com prudência. Ambição estruturada, status e crescimento seguro."
  },
  {
    "ruler": "mars",
    "dignity": "Exaltação · Triplicidade",
    "kw": "Determinação · Competição · Esforço",
    "text": "Marte, exaltado aqui, move o esforço. Determinação, competição e trabalho construtivo."
  },
  {
    "ruler": "sun",
    "dignity": "Peregrino",
    "kw": "Liderança · Realização · Autoridade",
    "text": "O Sol coroa a realização. Liderança, autoridade conquistada e reconhecimento público."
  },
  {
    "ruler": "venus",
    "dignity": "Peregrino",
    "kw": "Amizade · Sociabilidade · Ideal afetivo",
    "text": "Vênus aquece o coletivo. Amizade, idealismo afetivo e sociabilidade."
  },
  {
    "ruler": "mercury",
    "dignity": "Triplicidade",
    "kw": "Originalidade · Redes · Inovação",
    "text": "Mercúrio faz circular o novo. Ideias originais, redes e comunicação inovadora."
  },
  {
    "ruler": "moon",
    "dignity": "Peregrino",
    "kw": "Empatia coletiva · Memória social · Sensibilidade",
    "text": "A Lua sensibiliza o grupo. Empatia coletiva, memória social e sentimento de comunidade."
  },
  {
    "ruler": "saturn",
    "dignity": "Peregrino",
    "kw": "Compaixão realista · Sacrifício · Limite espiritual",
    "text": "Saturno contém a dissolução. Compaixão realista, sacrifício e limites espirituais."
  },
  {
    "ruler": "jupiter",
    "dignity": "Domicílio",
    "kw": "Fé · Imaginação · Generosidade",
    "text": "Júpiter no próprio signo: fé, imaginação e generosidade espiritual."
  },
  {
    "ruler": "mars",
    "dignity": "Triplicidade",
    "kw": "Ação inspirada · Coragem emotiva · Idealismo",
    "text": "Marte inspira a ação. Coragem emotiva e impulso movido por ideais."
  }
];

export const ASPECT_SHEET: Record<string, SheetItem & { nature: string }> = {
  "conjunction": {
    "nature": "Neutra (depende dos astros)",
    "kw": "Fusão · Intensidade · Novo ciclo",
    "text": "Os astros ocupam o mesmo ponto e agem como uma só força. O resultado depende da natureza de cada um: pode somar, intensificar ou confundir. Marca começos de ciclo."
  },
  "sextile": {
    "nature": "Harmônica",
    "kw": "Oportunidade · Cooperação · Estímulo",
    "text": "Ligação harmônica entre elementos compatíveis. Abre oportunidades e favorece a cooperação, mas pede iniciativa para render. Estímulo leve e produtivo."
  },
  "square": {
    "nature": "Tensa",
    "kw": "Desafio · Atrito · Ação",
    "text": "Ângulo de tensão entre modos que competem. Gera atrito, bloqueio e urgência, obrigando a agir e ajustar. Motor de crescimento por desafio."
  },
  "trine": {
    "nature": "Harmônica",
    "kw": "Fluidez · Harmonia · Talento",
    "text": "Ligação fluida entre astros do mesmo elemento. As energias circulam sem esforço e revelam talentos naturais. O risco é a acomodação."
  },
  "opposition": {
    "nature": "Tensa",
    "kw": "Polaridade · Tensão · Consciência",
    "text": "Os astros se encaram em lados opostos. Cria polarização, confronto e projeção no outro. Pede consciência e equilíbrio entre os dois polos."
  }
};
