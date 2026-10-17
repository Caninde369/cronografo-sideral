# Registro de cirurgias

Data: 13/09/2026 · Executado por: Sagitário
Nada em `SiderealClock.tsx`, `lib/astrology/` ou nos quatro painéis foi tocado em nenhuma das fases.

> **Não consegui rodar `npm run lint` nem o build** — o ambiente onde trabalhei bloqueia instalação de pacotes do npm. Rode `npm install && npm run lint && npm run dev` antes de commitar qualquer uma destas fases.

---

# Fase 0 — Higiene

## Segurança

- `.env` **adicionado ao `.gitignore`** (junto com `.env.*`, exceto `.env.example`).
- `.env` **removido deste pacote**. O seu arquivo local continua intacto.
- `.env.example` reescrito. Nota importante: **o projeto é Vite, não Next.js** — o prefixo correto é `VITE_`, não `NEXT_PUBLIC_`.

> **Ação sua, hoje:** rotacione as três chaves do EmailJS. Se o repositório foi público em algum momento, elas já saíram.

## Arquivos arquivados

Nada foi apagado — tudo está em `arquivo-limpeza.zip`.

- **19 scripts de codemod na raiz:** `fix_top_hud*.cjs`, `fix_buttons_again.cjs`, `fix_mess.cjs`, `rewrite_*.cjs`, `update*.cjs`, `calibrate.ts`, `testMoon.ts`, `final_check.ts`, `extracted_chrono.txt`
- **Build artifact versionado:** `temp_dist/`
- **Componentes órfãos** (zero importações): `AppSidebar.tsx` (971 linhas), `SidebarItem.tsx`, `WeatherOverlay.tsx`, `AdminDashboard.tsx`, `hooks/useWeather.ts`
- **Assets não referenciados** (8,1 MB): `fundo-botao.png`, `fundo.png`, `mockup-notebook.png`

**Mantido por decisão pendente:** `components/OptionsRail.tsx` — ver a seção "OptionsRail" no fim deste arquivo.

## Assets: 22 MB → 1,8 MB (−92%)

Originais preservados em `arquivo-limpeza.zip/public-originais/`.

| Arquivo | Antes | Depois |
|---|---|---|
| `personalizacao.mp4` | 7,6 MB | 1,0 MB |
| `tempo-real.mp4` | 2,3 MB | 371 KB |
| `atmosfera.mp4` | 980 KB | 154 KB |
| `magnetico.png` → `.webp` | 987 KB | 41 KB |
| `pdf.png` → `.webp` | 983 KB | 38 KB |
| `pontos-asteroides.png` → `.webp` | 631 KB | 35 KB |
| `jupiter.png` → `.webp` | 513 KB | 28 KB |
| `calendario-lunar.png` → `.webp` | 464 KB | 25 KB |
| `data.png` → `.webp` | 243 KB | 12 KB |

Vídeos: H.264, 960px, CRF 30, `faststart`. Imagens: WebP q82, largura máxima 1400px.
`personaliza#U00e7#U00e3o.mp4` → `personalizacao.mp4` (o código referenciava a versão com acento).

Única mudança de código: sete referências de asset em `components/LandingPage.tsx`, linhas 786 e 855–860.

## `package.json`

`name`: `cronógrafo-sideral-v2.9.6` → `cronografo-sideral` (acento é inválido no campo `name`).
`version`: `0.0.0` → `2.9.17`.

---

# Fase 1 — Remoção do sistema de docas arrastáveis

## Correção de um erro do diagnóstico

No relatório inicial eu afirmei que cada painel existia em duas cópias vivas — uma ancorada e outra em janela flutuante — e que três bugs de tema estavam em produção. **Isso estava errado.**

O componente que desenha os painéis da doca se chamava `FloatingWindow`, e as quatro chamadas passavam `isDocked={true}` dentro de dois `<aside>` fixos. Contei as ocorrências pelo nome do componente em vez de ler o contexto de cada uma.

A realidade: a doca **já era** o padrão, já rodava, e já estava no arranjo Astros/Status à esquerda e Aspectos/Casas à direita. O que estava morto era o outro lado — um sistema antigo de arrastar painéis entre colunas cuja função `renderPanel` (210 linhas, com cópias completas dos quatro painéis) **nunca era chamada em lugar nenhum**. Os três bugs que reportei estavam dentro dela e nunca chegaram ao usuário.

## Removido

- `renderPanel` — 210 linhas, zero call sites
- `handlePanelDragOver` — 36 linhas, usado só por `renderPanel`
- Estados `leftPanels` / `rightPanels` e o `useEffect` que os zerava na montagem
- O branch `type === 'panel'` de `handleDragOver`
- `leftPanels` / `rightPanels` do formato de layout salvo e do restore

`leftPanelWidth` e `rightPanelWidth` viraram `0` constantes, preservando os dois call sites que os consomem.

**App.tsx: 3.249 → 2.986 linhas.** Nenhuma linha da doca viva foi tocada.

---

# Fase 1b — `FloatingWindow` → `PanelFrame`

Com `isDocked` sempre verdadeiro, 170 das 447 linhas do componente eram inalcançáveis.

## Removido

- O ramo flutuante inteiro (`return` após o `if (isDocked)`) — 168 linhas de JSX morto
- `handleResizePointerDown` reescrito: só a direção `'s'` (altura) era alcançável, então as direções `e`/`w`/`se`/`sw`, o type `ResizeDirection` e os refs `resizeDirRef`, `startXRef`, `startWidthRef`, `startLeftRef`, `startTopRef` saíram junto
- Estado `customWidth` — a largura vem da doca, não do arraste
- `const activeWidth` — não usado
- **11 props mortas:** `id`, `left`, `top`, `right`, `bottom`, `isDocked`, `onWidthChange`, `onPositionChange`, `onPointerDownHeader`, `onPointerMoveHeader`, `onPointerUpHeader`

## Renomeado

`components/FloatingWindow.tsx` → `components/PanelFrame.tsx`
`FloatingWindow` → `PanelFrame` · `FloatingWindowProps` → `PanelFrameProps`

Um único arquivo importava o componente (`App.tsx`), e os quatro call sites foram atualizados: 16 linhas de props removidas.

**447 → 214 linhas (−52%). Props: 27 → 16, nenhuma morta.**

## Mudança de comportamento a conferir

Antes, dar duplo clique no cabeçalho de um painel resetava largura *e* altura. Agora reseta só a altura, porque a largura passou a ser responsabilidade da doca. Se você usava esse duplo clique para recuperar a largura, me diga — dá para religar via `onResetLayout`.

---

# Fase 2a — `lib/design-system.ts`

Criado. É a união do DS v1.0 (que vivia como constante local dentro da `LandingPage.tsx`) com o que já estava aprovado em uso (o card da Lua e seu popover), mais as cinco decisões fechadas em chat.

**Nenhum componente foi alterado.** O arquivo existe e não é importado por ninguém ainda — é a fonte de verdade a ser consumida na varredura seguinte, painel por painel, com revisão entre cada um.

O que ele fixa:

- **Fundo em dois níveis** — `#040004` é o céu (fundo do app), `#080612` é o instrumento (superfície de painel, card e popover). `#000000` e `#050505` saem do vocabulário.
- **Tipografia** — Playfair 600/15px nos títulos de painel em creme `#F5F2EB`, Playfair 500/16px nas oito horas cardinais, Michroma só a partir de 12px fora dos painéis, DM Sans nos rótulos e controles, DM Mono em todo número com `tabular-nums`.
- **Ouro** — `GOLD_USAGE` lista explicitamente onde ele pode e onde não pode aparecer. Máximo dois por tela fora do universo Fundador. Substitui o âmbar nos rótulos de seção.
- **Superfícies** — `SURFACE.panel`, `.popover`, `.row`, `.rowSelected`, `.chip`, extraídas do card da Lua, com variante de modo claro.
- **Esferas de astro** — `planetSphere(hex)` gera o gradiente radial a partir da cor semântica do próprio código. O glifo do signo permanece; o do planeta sai.
- **Profundidade** — escala `Z` de oito níveis, substituindo os ~22 valores arbitrários que iam até `999999`.
- **Raios** — cinco valores nomeados, contra os ~20 em uso hoje.
- **Regras dos popovers** — `POPOVER_RULES` codifica as cinco decisões de layout: todo valor visível, coluna única, quatro tipos de controle, ajuda como subtexto e não tooltip, grupos de 3 a 4 linhas.

## Ordem sugerida para a varredura

Um painel por commit, capturas antes/depois nos dois temas entre cada um:
`ChartStatisticsPanel` → `HouseCuspsPanel` → `AstroInfoPanel` → `CelestialBodyPanel` → `QuickToolsSidebar` (popovers) → `PanelFrame` (cabeçalho).

**Não entra na varredura:** `SiderealClock.tsx` e `components/chart/` — as cores ali são semânticas astrológicas. O `MoonInfoPanel` também fica fora: ele é a referência, não o alvo.

---

# Fase 2b — DS v2 aplicado nos painéis e popovers

Oito arquivos alterados. **`SiderealClock.tsx`, `components/chart/` e `lib/astrology/` continuam byte a byte idênticos ao original** — verificado por diff.

## `components/PanelFrame.tsx`

- Título do painel: **Playfair Display 600, 15px, creme `#F5F2EB`** (`#3B2F14` no modo claro). Nunca dourado.
- Superfície alinhada ao DS: `#080612`/95, borda `white/20`, raio 14px, sombra do card da Lua.
- Cabeçalho de 28 → 30px para acomodar a Playfair sem corte de descendentes.

## `components/CelestialBodyPanel.tsx` — Astros

Os corpos passaram de 3 para **6 grupos astrológicos**:

| Seção | Corpos | Estado inicial |
|---|---|---|
| Pessoais | Sol, Lua, Mercúrio, Vênus, Marte | aberta, não recolhível |
| Sociais | Júpiter, Saturno | aberta |
| Transpessoais | Urano, Netuno, Plutão | aberta |
| Pontos Lunares | Nodo N., Nodo S., Lilith | recolhida |
| Partes Árabes | Roda da Fortuna | recolhida |
| Asteroides | Quíron, Ceres, Pallas, Juno, Vesta | recolhida |

As três seções antigas (`planets`/`points`/`asteroids`) e os três blocos de JSX repetidos viraram um `BODY_SECTIONS.map()` único. `handleToggleSectionVisibility` ficou genérico sobre a chave do grupo, e os três memos `are*Visible` saíram — a visibilidade agora é calculada por seção dentro do loop.

Rótulo de seção em ouro `#D4AF37`, 9,5px, tracking .13em.

> **Roda da Fortuna em seção própria.** Ela não é ponto lunar — é parte árabe, derivada de Sol, Lua e Ascendente. Deixei separada para não mentir o rótulo, mas é uma seção de um item só. Se preferir juntar com os Pontos Lunares, é uma linha.

## `components/ChartStatisticsPanel.tsx` — Status

Nova **faixa de resumo** no topo, sempre visível — inclusive no modo minimal, onde antes a contagem sumia junto com os cabeçalhos:

```
ELEM    ●3  ●4  ●2  ●3
MODAL   ●4  ●3  ●5
POLAR   ●6  ●6
```

Três linhas de 17px: **13 números em 51px de altura**. Cada chip tem ponto colorido e contagem em DM Mono tabular, é hoverável (filtra o mapa como os blocos grandes já faziam) e o `title` mostra contagem, total e percentual. As cores vêm do design system.

## `components/QuickToolsSidebar.tsx` — popovers

Reestilizei as **primitivas compartilhadas**, então os nove popovers melhoram de uma vez:

- **`Toggle`** — estado ligado em ouro (`rgba(212,175,55,.28)` com borda `.6` e botão `#F5D98A`) no lugar do âmbar chapado. 34×19px com borda.
- **`Stepper`** — contorno, valor em DM Mono tabular creme entre divisores verticais.
- **`SegSel`** — selecionado com relevo (gradiente + `inset` highlight + sombra), 10,5px, sem truncar.
- **`CtrlRow`** — altura mínima de 32px, rótulo DM Sans 12px, e a descrição virou **subordinada de 9,5px** — a regra do DS: o que precisa ser lido fica escrito, não atrás de tooltip.
- **`SubSec`** — rótulo de seção em ouro com **filete** que sai do texto até a borda.
- Superfície dos 9 popovers: `#080612`/97,5, borda `white/20`, raio 14, `backdrop-blur(20px)`, sombra do DS. `z-[100]` → `z-[60]` (nível `Z.popover`).
- Os 9 títulos viraram **Playfair 600 creme**, mantendo o ícone na cor própria de cada popover.

## `index.html`

- **Playfair Display carregada** (400/500/600 + itálico 400). Ela não estava no link do Google Fonts — o DS a pedia e ela caía em Georgia.
- Classes `.ds-pop-title`, `.ds-panel-title`, `.ds-section`, `.font-playfair`.

## O que NÃO foi feito

- Cormorant Garamond, Syne e o `@import` de Inter continuam carregando. Removê-los muda a LandingPage e todas as classes `.font-*` que hoje caem em Inter — é a varredura tipográfica, uma cirurgia separada.
- As três diretivas `@tailwind` inertes no topo do `index.css` continuam lá.
- `AstroInfoPanel` e `HouseCuspsPanel` ainda não receberam o DS. Eles herdam o cabeçalho novo pelo `PanelFrame`, mas o interior é o original.

## Verificação

Chaves, parênteses e colchetes fecham nos seis arquivos. `theme`, `isLight`, `stats`, `handleHover` e `highlightFilter` conferidos em escopo nos pontos de uso.

**Continuo sem conseguir rodar o build** — o ambiente bloqueia o npm. Esta fase mexeu em cinco componentes vivos; rode antes de qualquer coisa:

```bash
npm install
npm run lint
npm run dev
```

---

# Fase 2c — Cards dos painéis e card da Lua

Quatro componentes. **`SiderealClock.tsx`, `components/chart/` e `lib/astrology/` continuam idênticos ao original** — verificado por diff a cada fase.

## A receita única de card

Os quatro painéis usavam três receitas diferentes de linha. Agora usam a mesma, que é a `SURFACE.row` do DS, extraída do card da Lua:

```
rounded-[10px]
border rgba(255,255,255,.10)
bg linear-gradient(to bottom, rgba(255,255,255,.055), rgba(255,255,255,.018))
hover: border rgba(255,255,255,.22)
```

E a seleção passou a ser **ouro** em todos eles:

```
selecionado:  from-[#D4AF37]/[0.10] to-[#D4AF37]/[0.03]  ·  border [#D4AF37]/50
secundário:   from-[#D4AF37]/[0.05] to-transparent        ·  border [#D4AF37]/25
```

### O `scale` no hover saiu

Todos os cards cresciam 1,5% no hover e encolhiam 1,5% no clique. Numa lista de dezenove linhas, cada hover empurrava as vizinhas — ruído de layout que atrapalha justamente quando se está varrendo a lista com o cursor. Agora o hover só clareia a borda.

## `components/CelestialBodyPanel.tsx` — Astros

- **Títulos das sanfonas em creme**, não em ouro. São seis seções na lista e o ouro em todas ocupava peso visual demais; o ouro fica reservado ao item selecionado. Creme `#F5F2EB` a 78% de opacidade.
- Nome do astro: itálico removido, peso 700 (`TYPE.itemName`).
- Graus: saíram de Inter para **DM Mono tabular**, em caixa com raio 6 e fundo `black/25`.
- Retrógrado: `R` → **`Rx`** e `ST` → **`St`**, em DM Mono 20% menor. `Rx` é a convenção de efeméride e ocupa menos peso que uma letra solta em negrito.

## `components/AstroInfoPanel.tsx` — Aspectos

Mesma receita de linha. Orbe e datas de trânsito passaram para DM Mono tabular em `#5B6478`.

## `components/HouseCuspsPanel.tsx` — Casas

Mesma receita, nos dois layouts (`table` e `cards`). As **cúspides angulares** (I, IV, VII, X) ganharam distinção própria: fundo e borda em ouro fraco (`#D4AF37`/.055 e /.28), em vez do branco levemente mais forte que as separava antes. Elas são os eixos do mapa — merecem ser encontradas de relance.

O título do painel saiu de Inter para Playfair. Grau da cúspide em DM Mono.

## `components/MoonInfoPanel.tsx` — card da Lua

Ele era a referência do DS; agora recebe de volta o que o DS aprendeu depois:

- Rótulo "Calendário Lunar" em **ouro `#D4AF37`** com tracking .13em, no lugar do âmbar `amber-300/80` (decisão 04).
- Título do popover em **Playfair creme** (classe `.ds-pop-title`, a mesma dos nove popovers da sidebar).
- Raios normalizados: card `rounded-[14px]` (`RADIUS.panel`), linhas internas `rounded-[10px]` (`RADIUS.row`), pílula `rounded-[12px]` (`RADIUS.chip`). Antes eram 16, 12 e 12 pela escala do Tailwind.
- Porcentagem de iluminação com `font-family` DM Mono explícito em vez do alias `font-mono` herdado.

## Estados ativos: roxo → ouro

Os botões de menu (⋮) e os segmentados dentro dos três painéis acendiam em **roxo** (`btn-3d-purple`) ou âmbar quando ativos — resíduo de uma paleta anterior que brigava com a seleção dourada dos cards. As **14 ocorrências** viraram ouro do DS.

## Verificação

Delimitadores fecham nos quatro arquivos. Nenhum `btn-3d-purple` ou `btn-3d-amber` restante nos três painéis.

**Sem build outra vez** — o ambiente bloqueia o npm. Esta fase mexeu em quatro componentes vivos.

---

# Pendências mapeadas, não executadas

## OptionsRail — 1.110 linhas, vale menos do que parece

Nove seções escritas, mas só quatro ligadas ao próprio menu (`paineis`, `signos`, `fundo`, `outros`). As outras cinco (`ponteiro`, `casas`, `planetas`, `aspectos`, `graus`) já migraram para a `QuickToolsSidebar` e ficaram órfãs dentro do arquivo.

Comparando capacidade real por capacidade real, quase tudo está duplicado. **Duas exceções**, e são sérias:

- **Campo Magnético** — implementado em `SiderealClock.tsx:4622`, anunciado na landing page como funcionalidade, e `setShowMagneticField` não tem **nenhuma** referência fora da `OptionsRail`. Não existe um botão no produto que ligue isso.
- **Plano de Fundo** — brilho, opacidade, estrelas, constelações e upload de imagem customizada. `customBackgroundImage` está implementado em `SiderealClock.tsx:3256`; os controles só existem na `OptionsRail` e na `TopBar` morta.

Recomendação: extrair essas duas seções como dois popovers na `QuickToolsSidebar`, no padrão do card da Lua, e apagar o resto junto com o botão que hoje abre o nada.

## Handlers vazios remanescentes

`onPanelPositionChange={() => {}}` em 4 call sites e `onHouseRightClick` / `onAspectRightClick` vazios em 2. Os painéis declaram essas props; falta confirmar se chegam a chamá-las antes de remover.

## TopBar

145 props declaradas, 5 usadas. Não toquei — decidir prop a prop o que volta a ter UI.
