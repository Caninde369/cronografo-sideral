/**
 * Botão de fechar padrão do Cronógrafo (pedido do Rafa em 22/11/2026: maiores e destacados).
 * 42 px, círculo com borda clara e fundo leve. Vale para janelas, popovers e gavetas.
 * Classe .cs-x para os novos; data-close-x e as classes antigas recebem o mesmo desenho.
 */
export const CLOSE_CSS = `
.cs-x,[data-close-x],.scp-x,.dtp-x,.npb-x,.awv-pop-x,.rce-x,.qts-pop button[title="Fechar"],body.is-mobile aside[data-dock] button[title="Fechar"]{
  width:42px!important;height:42px!important;min-width:42px!important;flex:none!important;padding:0!important;
  display:inline-flex!important;align-items:center!important;justify-content:center!important;
  border-radius:50%!important;border:1px solid rgba(237,233,227,.32)!important;background:rgba(237,233,227,.08)!important;
  color:#FAF6EE!important;font-size:19px!important;line-height:1!important;cursor:pointer;transition:background-color .15s,border-color .15s}
.cs-x:hover,[data-close-x]:hover,.scp-x:hover,.dtp-x:hover,.npb-x:hover,.awv-pop-x:hover,.rce-x:hover,.qts-pop button[title="Fechar"]:hover,body.is-mobile aside[data-dock] button[title="Fechar"]:hover{
  background:rgba(237,233,227,.16)!important;border-color:#EDE9E3!important}
.cs-x i,[data-close-x] i,.scp-x i,.dtp-x i,.rce-x i,.qts-pop button[title="Fechar"] i,body.is-mobile aside[data-dock] button[title="Fechar"] i{font-size:19px!important}
.cs-x svg,[data-close-x] svg,.qts-pop button[title="Fechar"] svg,body.is-mobile aside[data-dock] button[title="Fechar"] svg{width:16px!important;height:16px!important}
.cs-x:focus-visible,[data-close-x]:focus-visible,.scp-x:focus-visible,.dtp-x:focus-visible{outline:2px solid #EDE9E3;outline-offset:2px}
body.light-mode .cs-x,body.light-mode [data-close-x],body.light-mode .scp-x,body.light-mode .dtp-x,body.light-mode .npb-x,body.light-mode .awv-pop-x,body.light-mode .rce-x,body.light-mode .qts-pop button[title="Fechar"],body.light-mode aside[data-dock] button[title="Fechar"],
.is-light .cs-x,.npb.is-light .npb-x{
  border-color:rgba(35,23,20,.3)!important;background:rgba(35,23,20,.06)!important;color:#231714!important}
`;
