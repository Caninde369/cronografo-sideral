/**
 * Identidade visual do Cronógrafo aplicada ao Calendário Arcano.
 * Camada de estilo por cima das classes originais (escopo .arc-skin), sem mexer nos cálculos.
 * Fundo #040004, cartões #0a070c, linhas finas #221d27, Cormorant nos títulos,
 * DM Sans na interface, DM Mono nos números e a linha espectral como destaque.
 */
export const ARCANE_SKIN = `
.arc-skin{
  --a-bg:#040004; --a-card:#0a070c; --a-card2:#0f0b12; --a-line:#221d27; --a-line2:#2a2430; --a-line3:#3a3340;
  --a-fg:#EDE9E3; --a-hi:#FAF6EE; --a-mut:#B9B4BE; --a-dim:#8a8590; --a-faint:#6f6a76;
  --a-spec:linear-gradient(90deg,#B0215A,#EF4444 12%,#FB923C 26%,#FACC15 42%,#4ADE80 60%,#22D3EE 78%,#4870FF);
  background:var(--a-bg); color:var(--a-fg);
  font-family:'DM Sans',system-ui,sans-serif;
}
.arc-skin .font-sans{font-family:'DM Sans',system-ui,sans-serif}
.arc-skin .font-playfair{font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:500!important;letter-spacing:0}
.arc-skin .font-black{font-weight:600}

/* Fundos */
.arc-skin .bg-black,.arc-skin .bg-zinc-950{background-color:var(--a-bg)}
.arc-skin .bg-zinc-900,.arc-skin .bg-zinc-900\\/90,.arc-skin .bg-zinc-900\\/80,.arc-skin .bg-zinc-900\\/70{background-color:var(--a-card)}
.arc-skin .bg-zinc-900\\/40{background-color:rgba(10,7,12,.6)}
.arc-skin .bg-zinc-800,.arc-skin .bg-zinc-700{background-color:#17121b}
.arc-skin .hover\\:bg-zinc-900:hover,.arc-skin .hover\\:bg-zinc-800:hover,.arc-skin .hover\\:bg-zinc-700:hover{background-color:#1c1720}

/* Linhas finas */
.arc-skin .border-zinc-900,.arc-skin .border-zinc-900\\/80,.arc-skin .border-zinc-800,.arc-skin .border-zinc-800\\/80{border-color:var(--a-line)}
.arc-skin .border-zinc-700,.arc-skin .border-zinc-600{border-color:var(--a-line2)}
.arc-skin .hover\\:border-zinc-600:hover{border-color:var(--a-line3)}

/* Texto */
.arc-skin .text-white,.arc-skin .text-zinc-100{color:var(--a-hi)}
.arc-skin .text-zinc-200,.arc-skin .text-zinc-300{color:var(--a-fg)}
.arc-skin .text-zinc-400{color:var(--a-mut)}
.arc-skin .text-zinc-500{color:var(--a-dim)}
.arc-skin .text-zinc-700{color:var(--a-faint)}
.arc-skin .placeholder-zinc-500::placeholder{color:var(--a-faint)}

/* O âmbar vira o destaque claro do Cronógrafo */
.arc-skin .text-amber-200,.arc-skin .text-amber-300,.arc-skin .text-amber-400{color:var(--a-hi)}
.arc-skin .text-amber-500\\/50{color:var(--a-dim)}
.arc-skin .hover\\:text-amber-300:hover,.arc-skin .hover\\:text-amber-400:hover{color:#fff}
.arc-skin .border-amber-400,.arc-skin .border-amber-500\\/60,.arc-skin .border-amber-500\\/50{border-color:var(--a-fg)}
.arc-skin .border-amber-500\\/40,.arc-skin .border-amber-500\\/30,.arc-skin .border-amber-500\\/20{border-color:var(--a-line3)}
.arc-skin .hover\\:border-amber-400:hover,.arc-skin .hover\\:border-amber-500\\/60:hover,.arc-skin .hover\\:border-amber-500\\/50:hover,.arc-skin .hover\\:border-amber-500\\/40:hover,.arc-skin .focus\\:border-amber-400:focus{border-color:var(--a-fg)}
.arc-skin .bg-amber-500,.arc-skin .bg-amber-400{background-color:var(--a-fg);color:var(--a-bg)}
.arc-skin .bg-amber-500.text-black,.arc-skin .bg-amber-500 *{color:var(--a-bg)}
.arc-skin .hover\\:bg-amber-400:hover{background-color:#fff}
.arc-skin .bg-amber-500\\/10,.arc-skin .bg-amber-500\\/25{background-color:rgba(237,233,227,.08)}
.arc-skin .hover\\:bg-amber-500\\/40:hover{background-color:rgba(237,233,227,.16)}
.arc-skin .ring-amber-400,.arc-skin .ring-amber-400\\/80,.arc-skin .ring-amber-300\\/40{--tw-ring-color:rgba(237,233,227,.7)}
.arc-skin .hover\\:shadow-amber-500\\/10:hover{--tw-shadow-color:rgba(0,0,0,.4)}
.arc-skin .selection\\:bg-amber-500 ::selection,.arc-skin ::selection{background:rgba(237,233,227,.25);color:#fff}
/* Degradês âmbar (barra da jornada, botão + Novo) */
.arc-skin .from-amber-500,.arc-skin .from-amber-400{--tw-gradient-from:var(--a-fg)!important;--tw-gradient-to:var(--a-fg)!important;--tw-gradient-stops:var(--a-fg),var(--a-fg)!important;color:var(--a-bg)}
.arc-skin .bg-gradient-to-r.from-amber-500.to-yellow-600,.arc-skin .bg-gradient-to-r.from-amber-500.to-yellow-400{color:var(--a-bg)}
.arc-skin .shadow-lg,.arc-skin .shadow-xl,.arc-skin .shadow-2xl{box-shadow:0 18px 40px -16px rgba(0,0,0,.8)}

/* Números em DM Mono */
.arc-skin input[type=date],.arc-skin .tabular-nums{font-family:'DM Mono',ui-monospace,monospace}
.arc-skin input{color-scheme:dark}

/* Cabeçalho: logo + título em Cormorant, linha espectral embaixo */
.arc-skin header{position:relative;background:var(--a-bg)!important;border-bottom-color:transparent!important}
.arc-skin header::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:1px;background:var(--a-spec);opacity:.75}
.arc-skin .arc-brand{display:flex;align-items:center;gap:10px}
.arc-skin .arc-brand img{width:26px;height:26px;display:block}
.arc-skin .arc-brand .arc-title{font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:500;font-size:24px;line-height:1;color:var(--a-hi)}
.arc-skin .arc-brand .arc-sub{display:block;font-family:'DM Sans',sans-serif;font-style:normal;font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--a-faint);margin-top:3px}
.arc-skin footer{background:var(--a-bg)!important;border-top-color:var(--a-line)!important;color:var(--a-faint)!important}

/* Cantos e botões no padrão do app */
.arc-skin .rounded-xl,.arc-skin .rounded-2xl{border-radius:18px}
.arc-skin .rounded-lg{border-radius:12px}
.arc-skin button:focus-visible,.arc-skin input:focus-visible,.arc-skin select:focus-visible{outline:2px solid var(--a-fg);outline-offset:2px}

/* Cartas ocupando o bloco inteiro, sem tremer */
/* tamanho fixo pela largura da coluna: as quatro cartas sempre iguais, sem pular ao trocar a data */
.arc-skin .arc-cardfill{position:relative;flex:none;width:100%;aspect-ratio:2/3.3;max-height:62vh;contain:layout paint}
.arc-skin .arc-desc{flex:1 1 0;min-height:0;overflow-y:auto;scrollbar-width:thin}
.arc-skin .arc-cardfill img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;transform:none!important;transition:none!important;backface-visibility:hidden}
.arc-skin .arc-novo{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 14px;border-radius:999px;border:1px solid var(--a-fg);background:var(--a-fg);color:var(--a-bg);font:600 11px 'DM Sans',sans-serif;letter-spacing:.12em;text-transform:uppercase;white-space:nowrap;cursor:pointer}
.arc-skin .arc-novo:hover{background:#fff}

/* Painel de palavras-chave estável */
.arc-skin .arc-desc,.arc-skin .arc-desc *{transition:none!important;animation:none!important}

/* Sem brilho âmbar */
.arc-skin [class*="shadow-[0_0_"]{box-shadow:none!important}

/* Barra de progresso da jornada na linha espectral */
.arc-skin .arc-progress{background:var(--a-spec)!important}

/* Celular: nada rola de lado */
@media (max-width:639px){
  .arc-skin{overflow-x:hidden;overscroll-behavior-x:none;max-width:100vw}
  .arc-skin .overflow-y-auto,.arc-skin .overflow-auto{overflow-x:hidden}
}
`;
