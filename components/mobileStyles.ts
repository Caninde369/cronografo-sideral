/**
 * Versão celular do Cronógrafo (aprovada pelo Rafa em 14/11/2026).
 *
 * Só interface e navegação. O App marca o <body> com:
 *   .is-mobile            → está no celular
 *   data-morient          → "portrait" (em pé) ou "landscape" (deitado)
 *   data-mtab             → aba ativa: ceu | astros | aspectos | casas | mais
 *   data-mimmersive       → tela cheia (Apresentar)
 *   --m-col               → (deitado) onde começa a coluna da direita
 *
 * Peças:
 *   .m-head   topo: logo, Entrar, ☰ (menu); carimbo de tempo (.m-ts): Agora · data · hora, local, Lua
 *   .m-tabs   cápsula flutuante (Astros, Casas, Aspectos) + .m-fab mais aplicações; à esquerda deitado
 *   aside[data-dock]   as docas de painéis viram gavetas que sobem de baixo
 *   .qts-root          a barra lateral de ferramentas vira a página "Mais"
 *   .qts-pop           os popovers da barra viram gavetas
 *   [data-time-controls]  controles de tempo acima da barra de abas
 */
export const MOBILE_CSS = `
body.is-mobile .app-root{height:100dvh;--m-bg:#0C0A12;--m-card:#13111B;--m-fg:#F0ECE2;--m-mut:#A8A296;--m-line:rgba(255,255,255,.12);--m-gold:#F5D98A;--m-tabs:90px;--m-rail:72px}
body.is-mobile .app-root.m-light{--m-bg:#F4F1EA;--m-card:#FFFFFF;--m-fg:#231714;--m-mut:#6B6559;--m-line:rgba(35,23,20,.16);--m-gold:#8A6A12}
body.is-mobile{overscroll-behavior:none;-webkit-tap-highlight-color:transparent}
body.is-mobile .app-main{padding:0!important}
body.is-mobile .app-stage{border:0!important;border-radius:0!important;box-shadow:none!important;--tw-ring-shadow:0 0 #0000!important}

/* ── topo ── */
.m-head{position:fixed;top:0;left:0;right:0;z-index:45;display:flex;flex-direction:column;padding:0 10px;font-family:'DM Sans',sans-serif;color:var(--m-fg);pointer-events:none}
.m-head-row{height:52px;display:flex;align-items:center;gap:8px;pointer-events:auto;min-width:0}
.m-logo{flex:1;min-width:0;display:flex;align-items:baseline;gap:2px;padding-left:4px;white-space:nowrap;overflow:hidden}
.m-logo span{font-family:'Cormorant Garamond',Georgia,serif;font-weight:500;font-size:23px;letter-spacing:-.01em;line-height:1}
.m-logo b{font-family:'Syne','DM Sans',sans-serif;font-size:15px;letter-spacing:.02em;font-weight:700}
.m-chip{height:32px;padding:0 12px;border-radius:16px;border:1px solid var(--m-line);background:var(--m-card);color:var(--m-fg);font:700 11px/1 'DM Sans',sans-serif;letter-spacing:.06em;text-transform:uppercase;flex:none;cursor:pointer}
.m-chip-gold{border-color:transparent;background:linear-gradient(90deg,#D4AF37,#F5D98A);color:#1A1408}
.m-ico{width:44px;height:44px;border-radius:22px;border:1px solid var(--m-line);background:var(--m-card);color:var(--m-fg);display:flex;align-items:center;justify-content:center;font-size:19px;flex:none;cursor:pointer}
.m-ico-gold{border-color:color-mix(in srgb,var(--m-gold) 60%,transparent);background:color-mix(in srgb,var(--m-gold) 12%,var(--m-card));color:var(--m-gold)}
.m-ico-gold.is-on{background:color-mix(in srgb,var(--m-gold) 30%,var(--m-card))}
.m-ghost{width:44px;height:44px;border:0;border-radius:22px;background:transparent;color:var(--m-fg);display:flex;align-items:center;justify-content:center;font-size:22px;flex:none;cursor:pointer;outline:none;-webkit-tap-highlight-color:transparent}
.m-ghost:focus-visible{box-shadow:0 0 0 2px var(--m-fg)}

/* ── carimbo de tempo (27-28/11/2026): texto puro, sem molduras ── */
.m-ts{pointer-events:auto;padding:2px 10px 0;--ts-hi:#FAF6EE;--ts-mut:#B9B4BE;--ts-dim:#8a8590;--ts-line:#1a1620}
.m-ts button{border:0;background:none;padding:0;color:inherit;font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;outline:none}
.m-ts button:focus-visible{box-shadow:0 0 0 2px var(--m-fg);border-radius:6px}
.m-ts-l1{display:flex;align-items:center;gap:10px;min-height:40px}
.m-now{flex:none;width:68px;height:40px;display:inline-flex;align-items:center;gap:7px;font:500 13px 'DM Sans',sans-serif!important;color:var(--ts-dim)!important}
.m-now .ic{position:relative;width:14px;height:14px;display:grid;place-items:center;flex:none}
.m-now .ic .ti{font-size:15px;color:var(--ts-hi)}
.m-now .dot{width:7px;height:7px;border-radius:50%;background:#4ADE80}
.m-now .dot::after{content:"";position:absolute;inset:0;border-radius:50%;border:1px solid rgba(74,222,128,.55);animation:mNowPulse 2.2s ease-out infinite}
@keyframes mNowPulse{0%{transform:scale(.4);opacity:1}100%{transform:scale(1.2);opacity:0}}
.m-now.is-on{color:#4ADE80!important}
.m-ts-date{flex:1;min-width:0;display:flex;align-items:baseline;gap:6px;white-space:nowrap}
.m-ts .n{font:600 22px/1 'Cormorant Infant','Cormorant Garamond',Georgia,serif!important;color:var(--ts-hi)!important;font-variant-numeric:lining-nums tabular-nums}
.m-ts .m{font:italic 600 22px/1 'Cormorant Garamond',Georgia,serif!important;color:var(--ts-hi)!important;min-width:36px;text-align:left}
.m-ts .n.y{color:var(--ts-dim)!important;font-weight:500!important}
.m-ts-row{width:100%;display:flex!important;align-items:center;gap:8px;height:38px;border-top:1px solid var(--ts-line)!important;color:var(--ts-mut)!important;font:400 13px 'DM Sans',sans-serif!important;text-align:left}
.m-ts-row .ti{font-size:16px;color:var(--ts-dim);flex:none}
.m-ts-row .cv{font-size:15px;color:#5f5a66}
.m-ts-row .tx{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.m-ts-row b{font-weight:500}
.m-ts-row svg{flex:none}
.m-ts-l1+.m-ts-row{margin-top:4px}
body.is-mobile .app-root.m-light .m-ts{--ts-hi:#231714;--ts-mut:#4b4038;--ts-dim:#6b6253;--ts-line:rgba(35,23,20,.12)}
body.is-mobile .app-root.m-light .m-cap{background:#FFFFFF;box-shadow:0 14px 30px -14px rgba(35,23,20,.35)}
body.is-mobile .app-root.m-light .m-tabs{background:linear-gradient(to bottom,transparent,rgba(244,241,234,.9) 30%)}
body.is-mobile .app-root.m-light .m-tabs button.is-on{color:#231714}
body.is-mobile .app-root.m-light .m-fab{background:#231714!important;color:#F4F1EA!important}
/* menu ☰ */
.m-menu-scrim{position:fixed;inset:0;z-index:9993;background:rgba(4,0,4,.5)}
.m-menu{position:fixed;top:calc(env(safe-area-inset-top,0px) + 50px);right:10px;z-index:9994;width:min(272px,calc(100vw - 20px));padding:6px;border-radius:20px;border:1px solid #2a2430;background:#13111B;box-shadow:0 30px 60px -20px #000;font-family:'DM Sans',sans-serif;display:flex;flex-direction:column}
.m-menu button{display:flex;align-items:center;gap:12px;width:100%;min-height:46px;padding:0 10px;border:0;border-radius:12px;background:none;color:#EDE9E3;font:400 14px 'DM Sans',sans-serif;text-align:left;cursor:pointer}
.m-menu button:active{background:#1a1622}
.m-menu button .ti{font-size:19px;color:#B9B4BE}
.m-menu button.gold,.m-menu button.gold .ti{color:#D4AF37}
.m-menu .sep{height:1px;background:#221d27;margin:4px 6px}
.m-menu .m-menu-me{min-height:58px;border-bottom:1px solid #221d27;border-radius:12px 12px 0 0;margin-bottom:4px}
.m-menu .av{width:36px;height:36px;border-radius:50%;border:1px solid #3A3440;display:grid;place-items:center;font:italic 600 18px 'Cormorant Garamond',serif;color:#FAF6EE;flex:none}
.m-menu .m-menu-me b{display:block;font-size:13.5px;font-weight:600;color:#FAF6EE}
.m-menu .m-menu-me small{display:block;font:600 9px 'DM Sans',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#8a8590;margin-top:2px}

/* ── barra de baixo: cápsula flutuante + botão de mais aplicações ── */
.m-tabs{position:fixed;left:0;right:0;bottom:0;height:calc(var(--m-tabs) + env(safe-area-inset-bottom,0px));padding:10px 14px calc(14px + env(safe-area-inset-bottom,0px));z-index:9991;display:flex;align-items:center;gap:10px;background:linear-gradient(to bottom,transparent,rgba(4,0,4,.85) 30%);font-family:'DM Sans',sans-serif;pointer-events:none}
.m-cap{flex:1;height:64px;border-radius:32px;background:#13111B;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));align-items:center;box-shadow:0 18px 40px -14px #000;pointer-events:auto}
.m-tabs button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;height:100%;border:0;background:transparent;color:#8a8590;font:500 10.5px/1 'DM Sans',sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent;outline:none}
.m-tabs button i{font-size:25px}
.m-tab-ico{display:flex;align-items:center;justify-content:center}
.m-tabs button.is-on{color:#FAF6EE;font-weight:600}
.m-fab{flex:none;width:62px!important;height:62px!important;border-radius:50%!important;background:#EDE9E3!important;color:#040004!important;box-shadow:0 14px 30px -12px #000;pointer-events:auto}
.m-fab i{font-size:24px!important}
.m-exit-full{position:fixed;top:10px;right:10px;z-index:9992;width:44px;height:44px;border-radius:22px;border:1px solid rgba(255,255,255,.2);background:rgba(10,8,18,.7);color:#F0ECE2;font-size:19px;display:flex;align-items:center;justify-content:center}

/* ── controles de tempo ── */
body.is-mobile [data-time-controls]{left:0!important;right:0!important;bottom:var(--m-tabs)!important}
body.is-mobile:not([data-mtab="ceu"]) [data-time-controls]{display:none!important}
body.is-mobile [data-time-controls] [data-m-hide],body.is-mobile [data-time-controls] [data-tour="present"]{display:none!important}
body.is-mobile [data-time-controls] [data-m-hide].tc-tl-show{display:flex!important;width:44px!important;height:44px!important;opacity:1;border-color:color-mix(in srgb,var(--m-fg) 30%,transparent)!important}
body.is-mobile [data-tour="time-step"] > button,body.is-mobile [data-time-controls] [data-tour="zodiac-lock"]{width:44px!important;height:44px!important;min-width:44px}
body.is-mobile [data-time-controls] [data-tour="play"].tcb-solid{background:transparent!important;color:var(--m-fg)!important;border-color:color-mix(in srgb,var(--m-fg) 45%,transparent)!important}
body.is-mobile [data-time-controls] [data-tour="speed"]{height:44px!important}
body.is-mobile [data-time-controls] .h-9.relative{height:auto!important;min-height:40px}

/* ── painéis → gavetas ── */
body.is-mobile aside[data-dock]{left:0!important;right:0!important;top:auto!important;bottom:var(--m-tabs)!important;width:100%!important;height:50dvh;max-height:none!important;display:none;gap:0!important;z-index:60;font-family:'DM Sans',sans-serif}
body.is-mobile[data-mtab="astros"] aside[data-dock="left"],
body.is-mobile[data-mtab="aspectos"] aside[data-dock="right"],
body.is-mobile[data-mtab="casas"] aside[data-dock="right"]{display:flex}
body.is-mobile[data-mimmersive] aside[data-dock]{display:none!important}
body.is-mobile aside[data-dock] > div:not(.m-seg){flex:1 1 auto!important;height:auto!important;min-height:0!important;width:100%}
body.is-mobile aside[data-dock] section{border-radius:20px 20px 0 0!important;border-bottom:0!important}
body.is-mobile aside[data-dock="left"] section{border-radius:0!important;border-top:0!important}
body.is-mobile aside[data-dock] button[title="Recolher"],body.is-mobile aside[data-dock] button[title="Expandir"]{display:none!important}
body.is-mobile aside[data-dock] button[title="Fechar"],body.is-mobile aside[data-dock] button[title="Opções"]{width:36px!important;height:36px!important}
/* lista de astros no celular: linhas de toque (46 px) que rolam, sem espremer */
body.is-mobile aside[data-dock="left"] [data-tour^="body-"]{flex:0 0 auto!important;min-height:46px;border-radius:12px}
.m-seg{display:none}
body.is-mobile .m-seg{flex:none;display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:10px 12px 8px;background:var(--m-bg);border:1px solid var(--m-line);border-bottom:0;border-radius:20px 20px 0 0}
.m-seg > button,.m-dhead-chips button{height:36px;padding:0 14px;border-radius:18px;border:1px solid var(--m-line);background:transparent;color:var(--m-fg);font:500 13px/1 'DM Sans',sans-serif;cursor:pointer}
.m-seg > button.is-on,.m-dhead-chips button.is-on{background:var(--m-fg);border-color:var(--m-fg);color:var(--m-bg);font-weight:700}
.m-seg-hint{flex-basis:100%;font:400 11.5px/1.2 'DM Sans',sans-serif;color:var(--m-mut)}
/* cabeçalho das gavetas: título grande, opções e fechar no topo */
body.is-mobile .m-dhead{flex-direction:column;align-items:stretch;flex-wrap:nowrap;gap:10px;padding:12px 12px 10px 16px}
.m-dhead-row{display:flex;align-items:center;gap:8px}
.m-dhead-row h3{flex:1;min-width:0;margin:0;font:italic 500 27px/1 'Cormorant Garamond',Georgia,serif;color:var(--m-fg);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.m-dhead-opt{width:42px;height:42px;flex:none;border-radius:50%;border:1px solid var(--m-line);background:transparent;color:var(--m-fg);display:flex;align-items:center;justify-content:center;font-size:19px;cursor:pointer}
.m-dhead-chips{display:flex;gap:6px}
body.is-mobile aside[data-dock="left"] .pf-head{display:none!important}
body.is-mobile aside[data-dock="right"] .pf-head{height:62px!important;padding:8px 12px 8px 16px!important;gap:8px!important;border-radius:20px 20px 0 0}
body.is-mobile aside[data-dock="right"] .pf-title{font-size:27px!important;line-height:1!important}
body.is-mobile aside[data-dock="right"] .pf-menu{width:42px!important;height:42px!important;border-radius:50%!important;border:1px solid var(--m-line)!important}
body.is-mobile aside[data-dock="right"] .pf-menu svg{width:19px!important;height:19px!important}
/* divisões Planetas, Pontos lunares, Asteroides: mais grossas; chave fácil de tocar */
body.is-mobile .cbp-sec{height:44px!important;margin:10px 0 4px!important;padding:0 6px 0 12px!important;border-radius:12px!important;border-color:var(--m-line)!important}
body.is-mobile .cbp-sec span.font-bold{font-size:11.5px!important;opacity:.9!important}
body.is-mobile .cbp-sec svg{width:16px!important;height:16px!important}
body.is-mobile .cbp-sw{zoom:1.75;padding:6px 4px}

/* ── barra de ferramentas → página "Mais" ── */
body.is-mobile .qts-expand{display:none!important}
body.is-mobile .qts-root{position:fixed!important;top:0!important;left:0!important;right:0!important;bottom:var(--m-tabs)!important;width:auto!important;height:auto!important;transform:none!important;will-change:auto!important;opacity:1!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;justify-content:flex-start!important;gap:16px;padding:14px 12px 24px!important;overflow-y:auto!important;overflow-x:hidden!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;background:var(--m-bg)!important;border:0!important;box-shadow:none!important;visibility:hidden;pointer-events:none!important;z-index:9990}
body.is-mobile[data-mtab="mais"]:not([data-mimmersive]) .qts-root{visibility:visible;pointer-events:auto!important}
body.is-mobile .qts-root::before{content:"Mais";font:italic 500 30px/1.1 'Cormorant Garamond',Georgia,serif;color:var(--m-fg);padding:4px 4px 0}
.qts-profile{display:none}
body.is-mobile .qts-profile{display:flex;flex-wrap:wrap;align-items:center;gap:10px;width:100%;padding:12px;border-radius:18px;border:1px solid var(--m-line);background:var(--m-card);font-family:'DM Sans',sans-serif}
.qts-profile-main{flex:1;min-width:0;display:flex;align-items:center;gap:11px;border:0;background:transparent;color:var(--m-fg);text-align:left;padding:0;cursor:pointer}
.qts-av{width:44px;height:44px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;font:italic 500 22px/1 'Cormorant Garamond',Georgia,serif;border:1px solid var(--m-line);color:var(--m-fg)}
.qts-profile-t{min-width:0;display:flex;flex-direction:column;gap:2px}
.qts-profile-t b{font-size:14.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.qts-profile-t small{font-size:11.5px;color:var(--m-mut)}
.qts-upg{height:34px;padding:0 13px;border:0;border-radius:999px;background:linear-gradient(90deg,#D4AF37,#F5D98A);color:#1A1408;font:700 10.5px/1 'DM Sans',sans-serif;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;flex:none}
.qts-trial{flex-basis:100%;display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--m-mut)}
.qts-trial i{flex:1;height:3px;border-radius:2px;background:var(--m-line);overflow:hidden}
.qts-trial i b{display:block;height:100%;background:linear-gradient(90deg,#B0215A,#EF4444 12%,#FB923C 26%,#FACC15 42%,#4ADE80 60%,#22D3EE 78%,#8B5CF6)}
body.is-mobile .qts-collapse,body.is-mobile .qts-desktop,body.is-mobile .qts-sec > .w-6{display:none!important}
body.is-mobile .qts-sec{flex-direction:row!important;flex-wrap:wrap!important;align-items:stretch!important;justify-content:flex-start!important;gap:8px!important;margin:0!important;padding:0!important;width:100%!important}
body.is-mobile .qts-sec::before{content:attr(data-m-title);flex-basis:100%;font:700 11px/1 'DM Sans',sans-serif;letter-spacing:.12em;color:var(--m-mut);padding:2px 4px}
body.is-mobile .qts-sec > .qts-item,body.is-mobile .qts-sec > [data-tour="export"]{flex:0 0 calc(25% - 6px);max-width:calc(25% - 6px)}
body.is-mobile .qts-sec > [data-tour="export"]{display:flex}
body.is-mobile .qts-sec > [data-tour="export"] > .qts-item{flex:1}
body.is-mobile .qts-item{position:relative;flex-direction:column!important;justify-content:flex-start!important;gap:7px;min-height:78px;padding:11px 4px 8px;border:1px solid var(--m-line);border-radius:14px;background:var(--m-card)}
body.is-mobile .qts-item > button{order:1}
body.is-mobile .qts-item > button::after{content:"";position:absolute;inset:0;border-radius:14px}
body.is-mobile .qts-label{order:2;position:static!important;opacity:1!important;transform:none!important;margin:0!important;pointer-events:none;width:100%}
body.is-mobile .qts-label > div{background:none!important;border:0!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;height:auto!important;padding:0 2px!important;white-space:normal!important;justify-content:center;text-align:center;font-size:11px!important;font-weight:500!important;line-height:1.2;color:var(--m-fg)!important}
body.is-mobile .qts-pop{visibility:visible!important;pointer-events:auto!important;position:fixed!important;left:0!important;right:0!important;top:auto!important;bottom:var(--m-tabs)!important;transform:none!important;width:100%!important;max-width:none!important;max-height:72dvh!important;margin:0!important;border-radius:20px 20px 0 0!important;overflow-y:auto!important;z-index:9995!important;cursor:default}

/* ── só no celular ── */
.m-only{display:none!important}
body.is-mobile .m-only{display:flex!important}

/* ── leveza: sem desfoque de fundo, sem filtros e sem piscar dentro do relógio ── */
body.is-mobile *{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
body.is-mobile [data-tour="clock"] svg *{filter:none!important}
body.is-mobile .inner-twinkle-star,body.is-mobile [data-tour="clock"] .animate-pulse{animation:none!important}

/* ── linha do tempo ── */
body.is-mobile .scrub-mode,body.is-mobile .scrub-head-right,body.is-mobile .scrub-free{display:none!important}
.scrub-zoom{position:absolute;right:0;top:50%;transform:translateY(-50%);align-items:center;z-index:30}
.scrub-zoom-btn{height:32px;display:flex;align-items:center;gap:7px;padding:0 10px 0 12px;border-radius:10px;border:1px solid var(--m-line);background:var(--m-card);color:var(--m-fg);font:600 10.5px/1 'DM Sans',sans-serif;letter-spacing:.12em;text-transform:uppercase;cursor:pointer}
.scrub-zoom-btn small{font-weight:500;color:var(--m-mut);letter-spacing:.1em}
.scrub-zoom-btn i{font-size:13px;color:var(--m-mut)}
.scrub-zoom-scrim{position:fixed;inset:0;z-index:1}
.scrub-zoom-list{position:absolute;right:0;bottom:calc(100% + 6px);z-index:2;width:170px;padding:5px;border-radius:14px;border:1px solid var(--m-line);background:var(--m-card);box-shadow:0 18px 40px -12px rgba(0,0,0,.9);display:flex;flex-direction:column;gap:1px}
.scrub-zoom-list button{height:40px;display:flex;align-items:center;justify-content:space-between;padding:0 11px;border:0;border-radius:10px;background:transparent;color:var(--m-fg);font:500 13.5px/1 'DM Sans',sans-serif;cursor:pointer}
.scrub-zoom-list button small{font:11px 'DM Mono',monospace;color:var(--m-mut)}
.scrub-zoom-list button.is-on{background:color-mix(in srgb,var(--m-fg) 9%,transparent);font-weight:600}
body.is-mobile .scrub-track{padding:15px 0!important}
body.is-mobile .scrub-grad{height:36px!important}

/* ── janela Data & hora: uma coluna por vez ── */
body.is-mobile .cal-overlay{padding:0!important;align-items:stretch!important;justify-content:stretch!important}
body.is-mobile .cal-modal{width:100vw!important;height:100dvh!important;display:flex;flex-direction:column;transform:none!important}
body.is-mobile .cal-shell{flex:1 1 auto;min-height:0;height:auto!important;border-radius:0!important;border:0!important}
body.is-mobile .cal-modal[data-mview="form"] [data-tour="calendar-panel"]{display:none!important}
body.is-mobile .cal-modal[data-mview="cal"] .cal-left{display:none!important}
body.is-mobile .cal-left{width:100%!important;flex:1 1 auto!important;border-right:0!important;padding:16px 16px 28px!important}
.cal-switch{flex:none;height:48px;align-items:center;justify-content:center;gap:8px;border:0;background:#F5D98A;color:#1A1408;font:700 14px/1 'DM Sans',sans-serif;cursor:pointer}
.cal-switch i{font-size:18px}

/* ── tela cheia ── */
body.is-mobile[data-mimmersive] .qts-root{visibility:hidden!important}

/* ── deitado ── */
body.is-mobile[data-morient="landscape"] .m-tabs{top:0;bottom:0;right:auto;width:var(--m-rail);height:auto;padding:10px 0;flex-direction:column;justify-content:center;background:var(--m-bg);border-right:1px solid var(--m-line);pointer-events:auto}
body.is-mobile[data-morient="landscape"] .m-cap{flex:none;width:100%;height:auto;grid-template-columns:none;grid-auto-rows:64px;background:none;box-shadow:none;border-radius:0}
body.is-mobile[data-morient="landscape"] .m-fab{width:52px!important;height:52px!important}
body.is-mobile[data-morient="landscape"] .m-tabs button i{font-size:20px}
body.is-mobile[data-morient="landscape"] .m-head{left:var(--m-col);padding:0 10px 0 4px}
body.is-mobile[data-morient="landscape"] .m-head-row{height:48px}
body.is-mobile[data-morient="landscape"] [data-time-controls]{left:var(--m-col)!important;bottom:0!important}
body.is-mobile[data-morient="landscape"] aside[data-dock]{left:var(--m-col)!important;top:48px!important;bottom:0!important;width:auto!important;height:auto}
body.is-mobile[data-morient="landscape"] .qts-root{left:var(--m-rail)!important;bottom:0!important}
body.is-mobile[data-morient="landscape"] .qts-sec > .qts-item,body.is-mobile[data-morient="landscape"] .qts-sec > [data-tour="export"]{flex:0 0 calc(12.5% - 7px);max-width:calc(12.5% - 7px)}
body.is-mobile[data-morient="landscape"] .qts-pop{left:var(--m-col)!important;top:0!important;bottom:0!important;max-height:none!important;border-radius:0!important}
`;
