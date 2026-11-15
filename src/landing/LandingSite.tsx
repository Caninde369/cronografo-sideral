/**
 * Landing do Cronógrafo Sideral (cronografosideral.com/).
 * O app fica em /app. Quem já está logado vai direto ao app.
 *
 * Regras de texto (prompt do Orion, 15/11/2026): "Sideral" só no nome; só as ferramentas listadas;
 * nenhum formulário (tudo vai para o WhatsApp); Fundador não é investimento; parágrafos curtos;
 * sem letra miúda decorativa; sem promessa de resultado. Dourado #D4AF37 só no universo Fundador.
 * Valores (preço, vagas, número) só em ./config.ts.
 */
import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform, MotionValue } from 'framer-motion';
import { LANDING, waLink, brl, anualPorMes, economiaAnual, parcelaFundador } from './config';
import { Starfield } from './Starfield';
import { auth } from '../../lib/firebase';

const HeroClock = lazy(() => import('./HeroClock'));

const EASE = [0.32, 0.72, 0, 1] as const;

// ── peças ─────────────────────────────────────────────────────────────────────
const Reveal: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties; delay?: number; as?: 'div' | 'section' }> = ({ children, className, style, delay = 0 }) => {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className} style={style}>{children}</div>;
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: 48, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.8, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
};

const Spectral: React.FC = () => <div className="lp-wrap"><div className="lp-spec" /></div>;

const Logo: React.FC = () => (
  <span className="lp-logo">
    <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="none" stroke="#EDE9E3" strokeWidth="1" />
      <circle cx="16" cy="16" r="8" fill="none" stroke="#746F5D" strokeWidth="1" />
      <line x1="16" y1="16" x2="16" y2="5" stroke="#FACC15" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="2" fill="#EDE9E3" />
    </svg>
    <span>CRONÓGRAFO SIDERAL</span>
  </span>
);

const NAV = [
  ['#ferramenta', 'A ferramenta'],
  ['#como', 'Como funciona'],
  ['#planos', 'Planos'],
  ['#perguntas', 'Perguntas'],
] as const;

// ── 4.1 Navegação ────────────────────────────────────────────────────────────
const Nav: React.FC = () => {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  return (
    <header className="lp-nav">
      <div className="lp-wrap lp-nav-in">
        <a href="#topo" aria-label="Cronógrafo Sideral, início" className="lp-plain"><Logo /></a>
        <nav aria-label="Principal" className="lp-nav-links">
          {NAV.map(([href, label]) => <a key={href} className="lp-lk" href={href}>{label}</a>)}
          <a className="lp-btn lp-btn-gold lp-btn-sm" href={waLink(LANDING.msgFundador)} target="_blank" rel="noopener noreferrer">Quero ser Fundador</a>
        </nav>
        <button type="button" className="lp-burger" aria-label={open ? 'Fechar menu' : 'Abrir menu'} aria-expanded={open} onClick={() => setOpen(o => !o)}>
          <i className={`ti ${open ? 'ti-x' : 'ti-menu-2'}`} aria-hidden="true" />
        </button>
      </div>
      {open && (
        <div className="lp-menu" role="dialog" aria-label="Menu">
          {[...NAV, ['wa', 'Quero ser Fundador']].map(([href, label], i) => {
            const gold = href === 'wa';
            return (
              <motion.a
                key={href}
                href={gold ? waLink(LANDING.msgFundador) : href}
                target={gold ? '_blank' : undefined}
                rel={gold ? 'noopener noreferrer' : undefined}
                className={gold ? 'lp-btn lp-btn-gold' : 'lp-menu-lk'}
                onClick={() => setOpen(false)}
                initial={reduce ? false : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: EASE, delay: reduce ? 0 : 0.06 * i }}
              >
                {label}
              </motion.a>
            );
          })}
        </div>
      )}
    </header>
  );
};

// ── 4.2 Hero ─────────────────────────────────────────────────────────────────
const Hero: React.FC = () => {
  const reduce = useReducedMotion();
  const item = (i: number) => (reduce ? {} : {
    initial: { opacity: 0, y: 32, filter: 'blur(8px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    transition: { duration: 0.9, ease: EASE, delay: 0.12 * i },
  });
  return (
    <section id="topo" className="lp-wrap lp-hero">
      <div className="lp-hero-txt">
        <motion.h1 className="lp-h1" {...item(0)}>O céu de agora,<br />na tela do seu atendimento.</motion.h1>
        <motion.p className="lp-lead" {...item(1)}>Planetas em movimento e o mapa do cliente sobre o céu do dia. No celular e no navegador.</motion.p>
        <motion.div className="lp-hero-cta" {...item(2)}>
          <a className="lp-btn lp-btn-gold" href={waLink(LANDING.msgFundador)} target="_blank" rel="noopener noreferrer">Quero minha vaga de Fundador</a>
          <a className="lp-tx" href={LANDING.appUrl}>Abrir o céu de agora</a>
        </motion.div>
      </div>
      <motion.div className="lp-hero-clock" {...item(1)}>
        <div className="lp-halo" aria-hidden="true" />
        <div className="lp-float" role="img" aria-label="O relógio do Cronógrafo mostrando o céu de agora, ao vivo">
          <Suspense fallback={<div style={{ width: '100%', aspectRatio: '1 / 1' }} />}>
            <HeroClock />
          </Suspense>
        </div>
      </motion.div>
    </section>
  );
};

// ── 4.3 Vitrine ──────────────────────────────────────────────────────────────
const SHOWCASE = [
  { t: 'O céu de agora', d: 'Os planetas em movimento, no minuto em que você abre.', img: '' },
  { t: 'O mapa do cliente sobre o céu', d: 'O natal por dentro, o trânsito por fora.', img: '' },
  { t: 'Ciclos lunares', d: 'Cada lua do ano num calendário, com nome e fase.', img: '' },
  { t: 'Aspectos em lista', d: 'Cada aspecto com data de início e de fim.', img: '' },
];
const Showcase: React.FC = () => {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();
  const cur = SHOWCASE[i];
  return (
    <section id="ferramenta" className="lp-wrap lp-sec">
      <Reveal><h2 className="lp-h2">Quatro telas que você vai abrir em toda consulta.</h2></Reveal>
      <Reveal className="lp-show">
        <div className="lp-show-list" role="tablist" aria-label="Telas do Cronógrafo">
          {SHOWCASE.map((s, k) => (
            <button key={s.t} type="button" role="tab" aria-selected={k === i} className={`lp-show-item ${k === i ? 'is-on' : ''}`} onClick={() => setI(k)}>
              <b>{s.t}</b>
              <span>{s.d}</span>
            </button>
          ))}
        </div>
        <div className="lp-show-view" role="tabpanel" aria-label={cur.t}>
          <motion.div
            key={i}
            className="lp-shot"
            initial={reduce ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            {cur.img
              ? <img src={cur.img} alt={`Tela do Cronógrafo: ${cur.t}`} loading="lazy" />
              : <div className="lp-shot-ph"><i className="ti ti-photo" aria-hidden="true" /><span>{cur.t}</span></div>}
          </motion.div>
        </div>
      </Reveal>
    </section>
  );
};

// ── 4.4 Problema ─────────────────────────────────────────────────────────────
const Problem: React.FC = () => (
  <section className="lp-wrap lp-sec">
    <Reveal style={{ maxWidth: 760 }}>
      <h2 className="lp-h2">Seu consulente não lê uma roda parada.</h2>
      <p className="lp-p">O PDF mostra o dia em que ele nasceu. Ele quer entender o que está acontecendo agora.</p>
    </Reveal>
  </section>
);

// ── 4.5 Para quem atende (bento) ─────────────────────────────────────────────
const DEMO_PLANETS = [
  { id: 'sol', nome: 'Sol', cor: '#FACC15', a: 100 },
  { id: 'lua', nome: 'Lua', cor: '#CBD5E1', a: 200 },
  { id: 'venus', nome: 'Vênus', cor: '#E879F9', a: 320 },
  { id: 'marte', nome: 'Marte', cor: '#EF4444', a: 20 },
  { id: 'jupiter', nome: 'Júpiter', cor: '#FB923C', a: 140 },
];
const DEMO_LINKS: [string, string, string][] = [
  ['sol', 'jupiter', '#4ADE80'], ['lua', 'venus', '#60A5FA'], ['marte', 'jupiter', '#EF4444'], ['sol', 'marte', '#22D3EE'], ['venus', 'lua', '#60A5FA'],
];
const pos = (a: number, r = 72) => ({ x: 100 + r * Math.cos((a * Math.PI) / 180), y: 100 - r * Math.sin((a * Math.PI) / 180) });

const HighlightDemo: React.FC = () => {
  const [sel, setSel] = useState<string | null>(null);
  const lit = (ids: string[]) => !sel || ids.includes(sel);
  return (
    <div className="lp-demo">
      <svg viewBox="0 0 200 200" role="img" aria-label="Roda com cinco planetas ligados por linhas de aspecto">
        <circle cx="100" cy="100" r="92" fill="none" stroke="#746F5D" strokeWidth="1" />
        <circle cx="100" cy="100" r="80" fill="none" stroke="#3A3440" strokeWidth="1" />
        {DEMO_LINKS.map(([a, b, c], k) => {
          const p = pos(DEMO_PLANETS.find(x => x.id === a)!.a, 64), q = pos(DEMO_PLANETS.find(x => x.id === b)!.a, 64);
          return <line key={k} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={c} strokeWidth="1.2" style={{ opacity: lit([a, b]) ? 0.9 : 0.15, transition: 'opacity .4s cubic-bezier(.32,.72,0,1)' }} />;
        })}
        {DEMO_PLANETS.map(p => {
          const c = pos(p.a, 72);
          return <circle key={p.id} cx={c.x} cy={c.y} r="7" fill={p.cor} style={{ opacity: lit([p.id]) ? 1 : 0.15, transition: 'opacity .4s cubic-bezier(.32,.72,0,1)' }} />;
        })}
      </svg>
      <div className="lp-chips" role="group" aria-label="Destacar um planeta">
        {DEMO_PLANETS.map(p => (
          <button key={p.id} type="button" aria-pressed={sel === p.id} className={`lp-chip ${sel === p.id ? 'is-on' : ''}`} style={{ ['--c' as string]: p.cor } as React.CSSProperties} onClick={() => setSel(s => (s === p.id ? null : p.id))}>
            <span className="lp-dot" />{p.nome}
          </button>
        ))}
      </div>
    </div>
  );
};

const BENTO = [
  { k: 'b', cor: '#60A5FA', icon: 'ti-device-desktop-share', t: 'O céu na tela compartilhada', d: 'Mostre o trânsito chegando ao planeta natal, ao vivo.' },
  { k: 'c', cor: '#FB923C', icon: 'ti-calendar-time', t: 'Aspectos com começo e fim', d: 'Saiba quando o trânsito entra, fica exato e sai.' },
  { k: 'd', cor: '#CBD5E1', icon: 'ti-moon', t: 'Ciclos lunares', d: 'As luas do ano, organizadas num calendário.' },
  { k: 'e', cor: '#4ADE80', icon: 'ti-users', t: 'Clientes salvos', d: 'O mapa abre em um clique na próxima sessão.' },
  { k: 'f', cor: '#FACC15', icon: 'ti-photo-share', t: 'Pronto para o seu perfil', d: 'Exporte o céu do dia em alta resolução.' },
];
const Bento: React.FC = () => (
  <section className="lp-wrap lp-sec">
    <Reveal><h2 className="lp-h2">Menos tempo calculando. Mais tempo lendo.</h2></Reveal>
    <div className="lp-bento">
      <Reveal className="lp-card lp-b-a" style={{ ['--c' as string]: '#8B5CF6' } as React.CSSProperties}>
        <i className="ti ti-focus-2 lp-ico" aria-hidden="true" />
        <h3 className="lp-h3">Destaque o que importa</h3>
        <p className="lp-p-sm">Selecione planetas, aspectos e casas. O resto fica em segundo plano.</p>
        <HighlightDemo />
      </Reveal>
      {BENTO.map((b, k) => (
        <Reveal key={b.k} delay={0.05 * k} className={`lp-card lp-b-${b.k}`} style={{ ['--c' as string]: b.cor } as React.CSSProperties}>
          <i className={`ti ${b.icon} lp-ico`} aria-hidden="true" />
          <h3 className="lp-h3">{b.t}</h3>
          <p className="lp-p-sm">{b.d}</p>
        </Reveal>
      ))}
    </div>
  </section>
);

// ── 4.6 Manifesto ────────────────────────────────────────────────────────────
const MANIFESTO = 'Astrologia não é o mapa parado no dia em que você nasceu. É o céu que se move agora, na frente do seu consulente.'.split(' ');
const Word: React.FC<{ p: MotionValue<number>; i: number; n: number; w: string }> = ({ p, i, n, w }) => {
  const start = i / n, end = start + 1 / n;
  const opacity = useTransform(p, [start, end], [0.28, 1]);
  return <motion.span style={{ opacity }}>{w} </motion.span>;
};
const Manifesto: React.FC = () => {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 45%'] });
  return (
    <section className="lp-wrap lp-sec" aria-label="Manifesto">
      <p ref={ref} className="lp-manifesto">
        {reduce ? MANIFESTO.join(' ') : MANIFESTO.map((w, i) => <Word key={i} p={scrollYProgress} i={i} n={MANIFESTO.length} w={w} />)}
      </p>
    </section>
  );
};

// ── 4.7 Como funciona ────────────────────────────────────────────────────────
const STEPS = [
  ['01', 'Abra o céu de agora', 'Sem cadastro, direto no navegador.', '#60A5FA'],
  ['02', 'Coloque os dados do cliente', 'Data, hora e cidade. O mapa aparece sobre o céu do dia.', '#22D3EE'],
  ['03', 'Destaque, navegue, exporte', 'Vá até a data da pergunta e mostre só o que importa.', '#FB923C'],
];
const How: React.FC = () => (
  <section id="como" className="lp-wrap lp-sec">
    <Reveal><h2 className="lp-h2">Do nascimento à leitura em três passos.</h2></Reveal>
    <ol className="lp-steps">
      {STEPS.map(([n, t, d, c], k) => (
        <Reveal key={n} delay={0.08 * k}>
          <li className="lp-step" style={{ ['--c' as string]: c } as React.CSSProperties}>
            <span className="lp-step-n" aria-hidden="true">{n}</span>
            <h3 className="lp-h3">{t}</h3>
            <p className="lp-p-sm">{d}</p>
          </li>
        </Reveal>
      ))}
    </ol>
  </section>
);

// ── 4.8 Comparação ───────────────────────────────────────────────────────────
const COMPARE = [
  ['ti-devices', '#38BDF8', 'Onde roda', 'Celular, tablet e navegador', 'Computador com Windows ou macOS'],
  ['ti-world', '#4ADE80', 'Idioma', 'Português', 'Inglês'],
  ['ti-coin', '#FACC15', 'Preço', 'Em real, começa grátis', 'Em dólar, pago antes de usar'],
  ['ti-refresh', '#8B5CF6', 'Versões novas', 'Incluídas no plano', 'Upgrade pago a cada versão'],
];
const Compare: React.FC = () => (
  <section className="lp-wrap lp-sec">
    <Reveal><h2 className="lp-h2">Feito para quem atende no Brasil.</h2></Reveal>
    <div className="lp-cmp">
      <Reveal className="lp-cmp-card lp-cmp-us">
        <div className="lp-spec lp-spec-top" />
        <h3 className="lp-h3">Cronógrafo</h3>
        <ul>
          {COMPARE.map(([ic, c, tema, nos]) => (
            <li key={tema}><i className={`ti ${ic}`} style={{ color: c }} aria-hidden="true" /><span><b>{tema}</b>{nos}</span><i className="ti ti-check lp-ok" aria-label="sim" /></li>
          ))}
        </ul>
      </Reveal>
      <Reveal className="lp-cmp-card lp-cmp-them" delay={0.08}>
        <h3 className="lp-h3">Software importado</h3>
        <ul>
          {COMPARE.map(([ic, , tema, , eles]) => (
            <li key={tema}><i className={`ti ${ic}`} aria-hidden="true" /><span><b>{tema}</b>{eles}</span></li>
          ))}
        </ul>
      </Reveal>
    </div>
    <Reveal className="lp-feat">
      {['Céu em tempo real', 'Destaque de planetas, aspectos e casas', 'Ciclos lunares', 'Aspectos com início e fim'].map(f => (
        <span key={f} className="lp-feat-chip">{f}</span>
      ))}
    </Reveal>
  </section>
);

// ── 4.9 Quem fez ─────────────────────────────────────────────────────────────
const About: React.FC = () => (
  <section className="lp-wrap lp-sec">
    <Reveal className="lp-about">
      <div className="lp-photo" role="img" aria-label="Foto de Rafael Medeiros (em breve)"><span>RM</span></div>
      <div className="lp-about-txt">
        <p className="lp-quote">Construí o Cronógrafo porque eu precisava dele nos meus atendimentos.</p>
        <p className="lp-p">Sou Rafael Medeiros, astrólogo, tarólogo e designer de produto há mais de seis anos.</p>
      </div>
    </Reveal>
  </section>
);

// ── 4.10 Fundadores ──────────────────────────────────────────────────────────
const Founders: React.FC = () => {
  const vendidas = Math.min(LANDING.vagasFundador, LANDING.vagasVendidas);
  return (
    <section className="lp-wrap lp-sec lp-founders">
      <Reveal style={{ maxWidth: 760 }}>
        <h2 className="lp-h2">O Cronógrafo está em desenvolvimento contínuo.</h2>
        <p className="lp-p">As {LANDING.vagasFundador} vagas de Fundador financiam a próxima fase do projeto.</p>
        <p className="lp-p">Quem entra agora usa tudo, para sempre, e ajuda a decidir o que vem a seguir.</p>
      </Reveal>
      <Reveal className="lp-seats">
        <div className="lp-seat-grid" role="img" aria-label={`${vendidas} de ${LANDING.vagasFundador} vagas de Fundador preenchidas`}>
          {Array.from({ length: LANDING.vagasFundador }, (_, k) => <span key={k} className={k < vendidas ? 'is-on' : ''} />)}
        </div>
        <p className="lp-p">{vendidas === 0 ? `${LANDING.vagasFundador} vagas abertas.` : `${LANDING.vagasFundador - vendidas} de ${LANDING.vagasFundador} vagas abertas.`}</p>
      </Reveal>
    </section>
  );
};

// ── 4.11 Planos ──────────────────────────────────────────────────────────────
const LICENCA = 'A vaga de Fundador é a compra de uma licença de uso vitalícia. Não é investimento e não dá participação na empresa.';
const Plans: React.FC = () => {
  const [anual, setAnual] = useState(true);
  return (
    <section id="planos" className="lp-wrap lp-sec">
      <Reveal className="lp-plans-head">
        <h2 className="lp-h2">Uma consulta paga o mês.</h2>
        <div className="lp-toggle" role="group" aria-label="Ciclo de cobrança do Pro">
          <button type="button" aria-pressed={anual} className={anual ? 'is-on' : ''} onClick={() => setAnual(true)}>Anual</button>
          <button type="button" aria-pressed={!anual} className={!anual ? 'is-on' : ''} onClick={() => setAnual(false)}>Mensal</button>
        </div>
      </Reveal>
      <div className="lp-plans">
        <Reveal className="lp-plan">
          <h3 className="lp-h3">Grátis</h3>
          <p className="lp-price"><span>R$0</span></p>
          <ul className="lp-list">
            <li>Céu em tempo real</li><li>Seu mapa natal</li><li>Exportação com marca d'água</li>
          </ul>
          <a className="lp-btn lp-btn-ghost" href={LANDING.appUrl}>Abrir o céu de agora</a>
        </Reveal>
        <Reveal className="lp-plan lp-plan-pro" delay={0.06}>
          <h3 className="lp-h3">Pro</h3>
          {anual ? (
            <>
              <p className="lp-price"><span>R${brl(anualPorMes)}</span> por mês</p>
              <p className="lp-p-sm">R${brl(LANDING.precoAnual)} por ano. Você economiza R${brl(economiaAnual)}.</p>
            </>
          ) : (
            <>
              <p className="lp-price"><span>R${brl(LANDING.precoMensal)}</span> por mês</p>
              <p className="lp-p-sm">Cancele quando quiser.</p>
            </>
          )}
          <ul className="lp-list">
            <li>Clientes salvos</li><li>Mapa do cliente sobre o céu</li><li>Destaque e aspectos com início e fim</li><li>Exportação sem marca d'água</li>
          </ul>
          <a className="lp-btn lp-btn-light" href={waLink(LANDING.msgPro)} target="_blank" rel="noopener noreferrer">Me avise quando o Pro abrir</a>
        </Reveal>
        <Reveal className="lp-plan lp-plan-gold" delay={0.12}>
          <h3 className="lp-h3">Fundador</h3>
          <p className="lp-price"><span>R${brl(LANDING.precoFundador)}</span> uma vez</p>
          <p className="lp-p-sm">Ou {LANDING.parcelasFundador}x de R${brl(parcelaFundador)}.</p>
          <ul className="lp-list">
            <li>Tudo do Pro, para sempre</li><li>Todas as versões futuras</li><li>Voto no que vem a seguir</li><li>Canal direto com o Rafael</li>
          </ul>
          <a className="lp-btn lp-btn-gold" href={waLink(LANDING.msgFundador)} target="_blank" rel="noopener noreferrer">Quero minha vaga</a>
          <p className="lp-p-sm lp-legal">{LICENCA}</p>
        </Reveal>
      </div>
      <Reveal className="lp-guarantees">
        {['Grátis sem cadastro', 'Pro: cancele quando quiser', '7 dias para desistir, como garante o Código de Defesa do Consumidor'].map(g => (
          <p key={g}><i className="ti ti-check" aria-hidden="true" />{g}</p>
        ))}
      </Reveal>
    </section>
  );
};

// ── 4.12 Perguntas ───────────────────────────────────────────────────────────
const FAQ: [string, string][] = [
  ['Preciso instalar alguma coisa?', 'Não. Abre no navegador do computador, do tablet e do celular.'],
  ['Posso usar nas minhas consultas pagas?', 'Sim. O Pro e o Fundador foram feitos para isso.'],
  ['Qual a diferença entre Pro e Fundador?', 'O Pro é assinatura. O Fundador é pago uma vez e vale para sempre, com tudo que vier.'],
  ['O Fundador é um investimento?', LICENCA],
  ['Por que só 21 vagas?', 'Elas financiam a próxima fase do projeto. Quando fecham, não reabrem.'],
  ['Como eu pago?', 'Pix ou cartão, com o anual e o Fundador em até 12x. A gente combina tudo pelo WhatsApp.'],
  ['E se eu não gostar?', 'Você tem 7 dias para desistir, como garante o Código de Defesa do Consumidor.'],
  ['A ferramenta ainda está crescendo?', 'Sim, todo mês. Quem é Fundador vota no que vem a seguir.'],
];
const Questions: React.FC = () => (
  <section id="perguntas" className="lp-wrap lp-sec lp-faq-sec">
    <Reveal><h2 className="lp-h2">Perguntas</h2></Reveal>
    <Reveal className="lp-faq">
      {FAQ.map(([q, a]) => (
        <details key={q}>
          <summary>{q}<i className="ti ti-plus" aria-hidden="true" /></summary>
          <p className="lp-p">{a}</p>
        </details>
      ))}
    </Reveal>
  </section>
);

// ── 4.13 Chamada final ───────────────────────────────────────────────────────
const FinalCta: React.FC<{ innerRef: React.RefObject<HTMLElement> }> = ({ innerRef }) => (
  <section ref={innerRef} className="lp-wrap lp-sec lp-final">
    <Reveal>
      <h2 className="lp-h2">{LANDING.vagasFundador} vagas. Abertura em {LANDING.aberturaFundador}.</h2>
      <p className="lp-p">Fale direto comigo e garanta a sua.</p>
      <a className="lp-btn lp-btn-gold lp-btn-lg" href={waLink(LANDING.msgFundador)} target="_blank" rel="noopener noreferrer">
        <i className="ti ti-brand-whatsapp" aria-hidden="true" />Falar com o Rafael no WhatsApp
      </a>
    </Reveal>
  </section>
);

// ── 4.14 Rodapé ──────────────────────────────────────────────────────────────
const Footer: React.FC = () => (
  <footer className="lp-wrap lp-foot">
    <Logo />
    <nav aria-label="Rodapé" className="lp-foot-links">
      <a className="lp-lk" href={LANDING.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
      <a className="lp-lk" href={waLink(LANDING.msgGeral)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
      <a className="lp-lk" href={`mailto:${LANDING.email}`}>{LANDING.email}</a>
    </nav>
  </footer>
);

// ── Página ───────────────────────────────────────────────────────────────────
export const LandingSite: React.FC = () => {
  const finalRef = useRef<HTMLElement>(null);
  const [finalVisible, setFinalVisible] = useState(false);

  // Quem já está logado vai direto ao app
  useEffect(() => {
    const un = auth.onAuthStateChanged(u => { if (u) window.location.replace(LANDING.appUrl); });
    return () => un();
  }, []);

  useEffect(() => {
    document.title = 'Cronógrafo Sideral · O céu de agora na tela do seu atendimento';
    document.documentElement.style.background = '#040004';
  }, []);

  useEffect(() => {
    const el = finalRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setFinalVisible(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="lp">
      <style>{LANDING_CSS}</style>
      <Starfield />
      <a className="lp-skip" href="#conteudo">Pular para o conteúdo</a>
      <Nav />
      <main id="conteudo">
        <Hero />
        <Spectral />
        <Showcase />
        <Problem />
        <Bento />
        <Spectral />
        <Manifesto />
        <How />
        <Spectral />
        <Compare />
        <About />
        <Spectral />
        <Founders />
        <Plans />
        <Questions />
        <FinalCta innerRef={finalRef} />
      </main>
      <Footer />
      <a
        className={`lp-wa ${finalVisible ? 'is-hidden' : ''}`}
        href={waLink(LANDING.msgGeral)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        aria-hidden={finalVisible}
        tabIndex={finalVisible ? -1 : 0}
      >
        <i className="ti ti-brand-whatsapp" aria-hidden="true" />
      </a>
    </div>
  );
};

export default LandingSite;

// ── Estilos ──────────────────────────────────────────────────────────────────
const LANDING_CSS = `
html,body{background:#040004;margin:0}
.lp{--bg:#040004;--fg:#EDE9E3;--mut:#B9B4BE;--line:#221D27;--line2:#3A3440;--gold:#D4AF37;--ease:cubic-bezier(.32,.72,0,1);
  position:relative;min-height:100vh;background:var(--bg);color:var(--fg);font-family:'DM Sans',system-ui,sans-serif;font-size:18px;line-height:1.6;overflow-x:clip}
.lp *{box-sizing:border-box}
.lp main,.lp header,.lp footer{position:relative;z-index:1}
.lp h1,.lp h2,.lp h3{text-wrap:balance;margin:0}
.lp p{text-wrap:pretty;margin:0}
.lp a{color:inherit}
.lp-wrap{max-width:1200px;margin:0 auto;padding:0 32px}
.lp-sec{padding-top:128px;padding-bottom:0;display:flex;flex-direction:column;gap:48px}
.lp-sec > div:first-child{display:flex;flex-direction:column;gap:20px}
.lp-h1{font-family:'Playfair Display',Georgia,serif;font-weight:500;font-size:72px;line-height:1.05;letter-spacing:-.01em}
.lp-h2{font-family:'Playfair Display',Georgia,serif;font-weight:500;font-size:48px;line-height:1.1}
.lp-h3{font-family:'DM Sans',sans-serif;font-weight:600;font-size:22px;line-height:1.3}
.lp-lead,.lp-p{font-size:18px;line-height:1.6;color:var(--mut);max-width:620px}
.lp-p-sm{font-size:16px;line-height:1.55;color:var(--mut)}
.lp-skip{position:absolute;left:-9999px;top:12px;z-index:100;background:var(--fg);color:var(--bg)!important;padding:10px 14px;border-radius:10px;text-decoration:none}
.lp-skip:focus{left:16px}
.lp a:focus-visible,.lp button:focus-visible,.lp summary:focus-visible{outline:2px solid var(--fg);outline-offset:3px;border-radius:8px}

/* botões */
.lp-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:14px 26px;border-radius:999px;font:600 17px/1.2 'DM Sans',sans-serif;text-decoration:none;border:1px solid transparent;cursor:pointer;transition:transform .5s var(--ease),background-color .5s var(--ease),border-color .5s var(--ease),color .5s var(--ease)}
.lp-btn:hover{transform:translateY(-2px)}
.lp-btn:active{transform:scale(.98)}
.lp-btn-sm{min-height:44px;padding:10px 18px;font-size:15px}
.lp-btn-lg{min-height:60px;padding:16px 32px;font-size:18px}
.lp-btn i{font-size:22px}
.lp-btn-gold{background:var(--gold);color:#040004!important}
.lp-btn-gold:hover{background:#E2C25A}
.lp-btn-ghost{background:transparent;border-color:var(--line2);color:var(--fg)}
.lp-btn-ghost:hover{border-color:var(--fg)}
.lp-btn-light{background:var(--fg);color:#040004!important}
.lp-btn-light:hover{background:#fff}
.lp-lk{color:var(--mut)!important;text-decoration:none;font-size:16px;transition:color .5s var(--ease)}
.lp-lk:hover{color:#fff!important}
.lp-tx{color:var(--fg)!important;font-weight:500;text-decoration:underline;text-underline-offset:6px;text-decoration-color:var(--line2);min-height:44px;display:inline-flex;align-items:center;transition:text-decoration-color .5s var(--ease)}
.lp-tx:hover{text-decoration-color:var(--fg)}
.lp-plain{text-decoration:none}

/* linha espectral */
.lp-spec{height:1px;margin-top:128px;background:linear-gradient(90deg,#4870FF,#22D3EE,#FACC15,#FB923C,#EF4444,#4870FF);background-size:200% 100%;animation:lp-slide 6s linear infinite,lp-draw 1.2s var(--ease) both;transform-origin:left;animation-timeline:auto,view();animation-range:normal,entry 0% entry 80%}
.lp-spec-top{margin:0 0 4px;position:absolute;top:0;left:0;right:0;border-radius:16px 16px 0 0}
@keyframes lp-slide{to{background-position:200% 0}}
@keyframes lp-draw{from{transform:scaleX(0)}to{transform:scaleX(1)}}

/* navegação */
.lp-nav{position:sticky;top:0;z-index:20;background:linear-gradient(#040004 40%,rgba(4,0,4,0))}
.lp-nav-in{display:flex;align-items:center;justify-content:space-between;gap:24px;height:80px}
.lp-logo{display:inline-flex;align-items:center;gap:12px;font-family:'Michroma',sans-serif;font-size:13px;letter-spacing:.24em;color:var(--fg)}
.lp-nav-links{display:flex;align-items:center;gap:28px}
.lp-burger{display:none;width:48px;height:48px;border-radius:24px;border:1px solid var(--line2);background:transparent;color:var(--fg);font-size:22px;align-items:center;justify-content:center;cursor:pointer}
.lp-menu{position:fixed;inset:80px 0 0 0;z-index:19;display:flex;flex-direction:column;align-items:flex-start;gap:24px;padding:40px 24px;background:rgba(4,0,4,.82);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
.lp-menu-lk{font-family:'Playfair Display',Georgia,serif;font-size:34px;line-height:1.2;color:var(--fg)!important;text-decoration:none}

/* hero */
.lp-hero{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);align-items:center;gap:56px;padding-top:56px}
.lp-hero-txt{display:flex;flex-direction:column;gap:28px}
.lp-hero-cta{display:flex;flex-wrap:wrap;align-items:center;gap:28px}
.lp-hero-clock{position:relative;width:100%;max-width:560px;justify-self:center}
.lp-halo{position:absolute;inset:6%;border-radius:50%;background:radial-gradient(circle,rgba(72,112,255,.22),rgba(139,92,246,.10) 45%,transparent 70%);animation:lp-breathe 6s var(--ease) infinite alternate}
.lp-float{position:relative;animation:lp-float 8s ease-in-out infinite}
@keyframes lp-breathe{from{opacity:.45;transform:scale(.97)}to{opacity:1;transform:scale(1.03)}}
@keyframes lp-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}

/* vitrine */
.lp-show{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.6fr);gap:40px;align-items:start}
.lp-show-list{display:flex;flex-direction:column;gap:8px}
.lp-show-item{display:flex;flex-direction:column;gap:6px;text-align:left;padding:20px 22px;border-radius:16px;border:1px solid transparent;background:transparent;color:var(--fg);cursor:pointer;font:inherit;transition:border-color .5s var(--ease),background-color .5s var(--ease)}
.lp-show-item b{font-weight:600;font-size:20px}
.lp-show-item span{color:var(--mut);font-size:16px}
.lp-show-item:hover{border-color:var(--line)}
.lp-show-item.is-on{border-color:var(--line2);background:#0B080D}
.lp-shot{aspect-ratio:16/10;border-radius:20px;overflow:hidden;border:1px solid var(--line2);background:#08060A}
.lp-shot img{width:100%;height:100%;object-fit:cover;display:block}
.lp-shot-ph{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;color:var(--mut);font-family:'Playfair Display',Georgia,serif;font-size:28px}
.lp-shot-ph i{font-size:36px;color:#746F5D}

/* bento */
.lp-bento{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-auto-rows:minmax(200px,auto);gap:20px}
.lp-card{--c:#746F5D;position:relative;display:flex;flex-direction:column;gap:12px;padding:28px;border-radius:20px;border:1px solid var(--line);background:#0B080D;transition:border-color .5s var(--ease),box-shadow .5s var(--ease)}
.lp-card:hover{border-color:color-mix(in srgb,var(--c) 55%,var(--line));box-shadow:0 0 28px -6px color-mix(in srgb,var(--c) 45%,transparent)}
.lp-ico{font-size:30px;color:var(--c)}
.lp-b-a{grid-column:span 2;grid-row:span 2}
.lp-b-b,.lp-b-c{grid-column:span 2}
.lp-b-d,.lp-b-e{grid-column:span 1}
.lp-b-f{grid-column:span 2}
.lp-demo{margin-top:auto;display:flex;flex-direction:column;align-items:center;gap:18px;padding-top:12px}
.lp-demo svg{width:min(100%,260px);height:auto}
.lp-chips{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}
.lp-chip{--c:#fff;display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 16px;border-radius:999px;border:1px solid var(--line2);background:transparent;color:var(--fg);font:500 15px/1 'DM Sans',sans-serif;cursor:pointer;transition:border-color .4s var(--ease),background-color .4s var(--ease)}
.lp-chip.is-on{border-color:var(--c);background:color-mix(in srgb,var(--c) 16%,transparent)}
.lp-dot{width:10px;height:10px;border-radius:50%;background:var(--c)}

/* manifesto */
.lp-manifesto{font-family:'Playfair Display',Georgia,serif;font-weight:500;font-size:48px;line-height:1.2;max-width:960px}

/* como funciona */
.lp-steps{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:40px}
.lp-step{position:relative;display:flex;flex-direction:column;gap:12px;padding-top:64px}
.lp-step-n{position:absolute;top:-8px;left:-4px;font-family:'DM Mono',monospace;font-size:96px;line-height:1;color:color-mix(in srgb,var(--c) 20%,transparent);pointer-events:none}
.lp-step .lp-h3{position:relative}

/* comparação */
.lp-cmp{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
.lp-cmp-card{position:relative;display:flex;flex-direction:column;gap:20px;padding:32px;border-radius:20px;border:1px solid var(--line)}
.lp-cmp-card ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:18px}
.lp-cmp-card li{display:flex;align-items:flex-start;gap:14px}
.lp-cmp-card li > i{font-size:24px;flex:none;margin-top:2px}
.lp-cmp-card li span{flex:1;display:flex;flex-direction:column}
.lp-cmp-card li b{font-weight:600}
.lp-cmp-us{background:#0E0B12}
.lp-cmp-us li span{color:var(--fg)}
.lp-cmp-us li b{color:var(--mut);font-weight:500;font-size:16px}
.lp-ok{color:#4ADE80;font-size:22px!important}
.lp-cmp-them{background:transparent;color:#8F8996}
.lp-cmp-them .lp-h3{color:#8F8996}
.lp-cmp-them li > i{color:#5E5866}
.lp-cmp-them li b{font-weight:500;font-size:16px}
.lp-feat{display:flex!important;flex-direction:row!important;flex-wrap:wrap;gap:10px}
.lp-feat-chip{display:inline-flex;align-items:center;min-height:44px;padding:0 18px;border-radius:999px;border:1px solid var(--line2);font-size:16px}

/* quem fez */
.lp-about{display:flex!important;flex-direction:row!important;align-items:center;gap:48px;padding:48px;border-radius:24px;border:1px solid var(--line);background:#0B080D}
.lp-photo{flex:none;width:160px;height:160px;border-radius:50%;border:1px solid var(--line2);display:flex;align-items:center;justify-content:center;background:#08060A;font-family:'Playfair Display',Georgia,serif;font-size:40px;color:#746F5D}
.lp-about-txt{display:flex;flex-direction:column;gap:16px}
.lp-quote{font-family:'Playfair Display',Georgia,serif;font-size:32px;line-height:1.25}

/* fundadores */
.lp-seats{display:flex;flex-direction:column;gap:20px}
.lp-seat-grid{display:grid;grid-template-columns:repeat(7,40px);gap:16px}
.lp-seat-grid span{width:40px;height:40px;border-radius:50%;border:1.5px solid var(--gold)}
.lp-seat-grid span.is-on{background:var(--gold)}

/* planos */
.lp-plans-head{display:flex!important;flex-direction:row!important;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:24px}
.lp-toggle{display:inline-flex;gap:4px;padding:4px;border:1px solid var(--line2);border-radius:999px}
.lp-toggle button{min-height:44px;padding:0 20px;border-radius:999px;border:0;background:transparent;color:var(--mut);font:600 16px/1 'DM Sans',sans-serif;cursor:pointer;transition:background-color .5s var(--ease),color .5s var(--ease)}
.lp-toggle button.is-on{background:var(--fg);color:#040004}
.lp-plans{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;align-items:stretch}
.lp-plan{display:flex;flex-direction:column;gap:18px;padding:32px;border-radius:20px;border:1px solid var(--line);background:#0B080D}
.lp-plan-pro{border-color:var(--line2)}
.lp-plan-gold{border-color:var(--gold);background:#0D0A06}
.lp-plan-gold .lp-h3{color:var(--gold)}
.lp-price{font-size:18px;color:var(--mut)}
.lp-price span{font-family:'DM Mono',monospace;font-size:44px;line-height:1.1;color:var(--fg);margin-right:6px}
.lp-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:12px;flex:1}
.lp-list li{display:flex;gap:10px;font-size:17px}
.lp-list li::before{content:"";flex:none;width:6px;height:6px;margin-top:11px;border-radius:50%;background:#746F5D}
.lp-plan-gold .lp-list li::before{background:var(--gold)}
.lp-legal{color:var(--fg)}
.lp-guarantees{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}
.lp-guarantees p{display:flex;gap:10px;align-items:flex-start;font-size:16px;color:var(--mut)}
.lp-guarantees i{color:#4ADE80;font-size:20px;flex:none;margin-top:2px}

/* perguntas */
.lp-faq-sec{max-width:880px}
.lp-faq{display:block!important}
.lp-faq details{border-top:1px solid var(--line)}
.lp-faq details:last-child{border-bottom:1px solid var(--line)}
.lp-faq summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:24px;min-height:72px;padding:20px 0;font-size:19px;font-weight:500}
.lp-faq summary::-webkit-details-marker{display:none}
.lp-faq summary i{flex:none;font-size:22px;transition:transform .5s var(--ease)}
.lp-faq details[open] summary i{transform:rotate(45deg)}
.lp-faq details p{padding:0 0 24px}

/* chamada final, rodapé, botão flutuante */
.lp-final{padding-bottom:128px}
.lp-final > div{align-items:flex-start}
.lp-foot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:24px;padding-top:40px;padding-bottom:40px;border-top:1px solid var(--line)}
.lp-foot-links{display:flex;flex-wrap:wrap;gap:24px}
.lp-wa{position:fixed;right:20px;bottom:20px;z-index:30;width:56px;height:56px;border-radius:50%;background:#EDE9E3;color:#040004!important;display:flex;align-items:center;justify-content:center;font-size:30px;text-decoration:none;box-shadow:0 10px 30px -10px rgba(0,0,0,.7);transition:transform .5s var(--ease),opacity .5s var(--ease)}
.lp-wa:hover{transform:translateY(-2px)}
.lp-wa.is-hidden{opacity:0;transform:translateY(16px);pointer-events:none}

/* tablet */
@media (max-width:1024px){
  .lp-hero{grid-template-columns:1fr}
  .lp-hero-clock{max-width:520px}
  .lp-bento{grid-template-columns:repeat(2,minmax(0,1fr))}
  .lp-b-a{grid-column:span 2;grid-row:auto}
  .lp-b-b,.lp-b-c,.lp-b-f{grid-column:span 2}
  .lp-b-d,.lp-b-e{grid-column:span 1}
  .lp-plans{grid-template-columns:1fr}
}
/* celular */
@media (max-width:768px){
  .lp-wrap{padding:0 20px}
  .lp-sec{padding-top:80px;gap:32px}
  .lp-spec{margin-top:80px}
  .lp-h1{font-size:40px}
  .lp-h2{font-size:32px}
  .lp-manifesto{font-size:32px}
  .lp-nav-in{height:72px}
  .lp-menu{inset:72px 0 0 0}
  .lp-nav-links{display:none}
  .lp-burger{display:inline-flex}
  .lp-logo{font-size:11px;letter-spacing:.18em}
  .lp-hero{padding-top:24px;gap:40px}
  .lp-show{grid-template-columns:1fr;gap:20px}
  .lp-show-list{flex-direction:row;overflow-x:auto;scrollbar-width:none;margin:0 -20px;padding:0 20px}
  .lp-show-list::-webkit-scrollbar{display:none}
  .lp-show-item{flex:none;padding:12px 18px;border-color:var(--line2);border-radius:999px}
  .lp-show-item span{display:none}
  .lp-show-item b{font-size:16px;white-space:nowrap}
  .lp-show-item.is-on{background:var(--fg);color:#040004;border-color:var(--fg)}
  .lp-bento{grid-template-columns:1fr}
  .lp-b-a,.lp-b-b,.lp-b-c,.lp-b-d,.lp-b-e,.lp-b-f{grid-column:auto}
  .lp-steps{grid-template-columns:1fr;gap:24px}
  .lp-cmp{grid-template-columns:1fr}
  .lp-about{flex-direction:column!important;align-items:flex-start;padding:28px;gap:24px}
  .lp-photo{width:112px;height:112px;font-size:30px}
  .lp-quote{font-size:26px}
  .lp-seat-grid{grid-template-columns:repeat(7,minmax(0,32px));gap:10px}
  .lp-seat-grid span{width:32px;height:32px}
  .lp-guarantees{grid-template-columns:1fr}
  .lp-plan{padding:24px}
  .lp-btn{width:100%}
  .lp-hero-cta{gap:16px}
  .lp-final{padding-bottom:96px}
}
@media (prefers-reduced-motion:reduce){
  .lp *{animation:none!important;transition:none!important}
  .lp-spec{transform:none}
}
`;
