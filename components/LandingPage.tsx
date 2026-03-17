import React, { useState } from 'react';
import { UI_ICONS } from './icons';
import {
    Clock, Activity, Sliders, FileDown, Moon, MousePointerClick,
    Sun, Magnet, Sparkles, Map, Check, X, ChevronDown, Star,
    Quote, Plus, ArrowRight, Zap, Eye, Globe
} from 'lucide-react';
import { useLanguage } from '../i18n';

interface LandingPageProps {
    onEnter: () => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] p-8 hover:bg-white/8 hover:border-white/20 transition-all duration-300 group flex flex-col">
        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 text-brand-purple group-hover:scale-110 group-hover:bg-brand-purple/10 transition-all duration-300">
            {React.cloneElement(icon as React.ReactElement, { strokeWidth: 1.5, className: 'w-5 h-5' })}
        </div>
        <h3 className="font-michroma text-xs tracking-widest text-white mb-3 uppercase">{title}</h3>
        <p className="font-montserrat text-gray-400 text-sm leading-relaxed font-light flex-1">{description}</p>
    </div>
);

const PricingFeature = ({ included, text }: { included: boolean; text: string }) => (
    <li className="flex items-start gap-3">
        {included
            ? <Check className="w-4 h-4 text-brand-purple shrink-0 mt-0.5" strokeWidth={2.5} />
            : <X className="w-4 h-4 text-gray-700 shrink-0 mt-0.5" strokeWidth={2} />}
        <span className={`font-montserrat text-sm leading-relaxed ${included ? 'text-gray-300' : 'text-gray-600'}`}>{text}</span>
    </li>
);

const FaqItem = ({ question, answer }: { question: string; answer: string }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className={`border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 ${open ? 'bg-white/5' : 'bg-white/[0.02] hover:bg-white/5'}`}>
            <button onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-8 py-6 text-left gap-4">
                <span className="font-montserrat text-sm text-white font-medium leading-relaxed">{question}</span>
                <div className={`w-7 h-7 rounded-full border border-white/20 flex items-center justify-center shrink-0 transition-all duration-300 ${open ? 'bg-brand-purple border-brand-purple rotate-45' : ''}`}>
                    <Plus className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                </div>
            </button>
            {open && (
                <div className="px-8 pb-6">
                    <p className="font-montserrat text-sm text-gray-400 leading-relaxed border-t border-white/5 pt-4">{answer}</p>
                </div>
            )}
        </div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
    const { language, setLanguage, t } = useLanguage();
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const getPrice = (baseBrl: number) => {
        const rates: Record<string, { sym: string; rate: number }> = {
            'PT-BR': { sym: 'R$', rate: 1 },
            'EN': { sym: '$', rate: 0.2 },
            'ES': { sym: '€', rate: 0.18 },
            'FR': { sym: '€', rate: 0.18 },
            'ZH': { sym: '¥', rate: 1.4 },
        };
        const { sym, rate } = rates[language] || rates['PT-BR'];
        const val = baseBrl * rate;
        const formattedVal = val.toFixed(2);
        const finalVal = ['PT-BR', 'ES', 'FR'].includes(language)
            ? formattedVal.replace('.', ',')
            : formattedVal;
        return { sym, val: finalVal };
    };

    const proPriceBrl = billingCycle === 'monthly' ? 39.90 : 39.90 * 10;
    const premPriceBrl = billingCycle === 'monthly' ? 89.90 : 89.90 * 10;
    const founderOldBrl = 1497.00;
    const founderNewBrl = 897.00;

    const { sym: proSym, val: proVal } = getPrice(proPriceBrl);
    const { sym: premSym, val: premVal } = getPrice(premPriceBrl);
    const { sym: fSym, val: fOldVal } = getPrice(founderOldBrl);
    const { val: fNewVal } = getPrice(founderNewBrl);
    const perDayPrem = (premPriceBrl / 30).toFixed(2).replace('.', ',');

    return (
        <div className="relative min-h-screen w-screen overflow-x-hidden bg-[#050505] text-white flex flex-col font-montserrat scroll-smooth">

            {/* Fixed Background */}
            <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-70"
                style={{ backgroundImage: 'url(/fundo.png)' }} />
            <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/50 via-black/75 to-[#050505]" />

            {/* ── HERO ──────────────────────────────────────────────────────── */}
            <div className="relative z-10 min-h-screen flex flex-col">

                {/* Header */}
                <header className="flex items-center justify-between px-8 py-3 w-full max-w-[1600px] mx-auto">
                    <div className="flex items-center flex-1">
                        <img src="/logo.svg" alt="Cronógrafo Sideral" className="w-[220px] h-[128px] object-contain"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    </div>

                    <nav className="hidden lg:flex items-center justify-center gap-8 text-[11px] font-medium tracking-[0.15em] flex-1">
                        <a href="#problema" className="hover:text-brand-purple transition-colors uppercase">O Problema</a>
                        <a href="#publico" className="hover:text-brand-purple transition-colors uppercase">Para Quem</a>
                        <a href="#recursos" className="hover:text-brand-purple transition-colors uppercase">Recursos</a>
                        <a href="#planos" className="hover:text-brand-purple transition-colors uppercase">Planos</a>
                    </nav>

                    <div className="flex items-center justify-end gap-6 flex-1">
                        <div className="relative">
                            <button onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                                className="hover:text-brand-purple transition-colors flex items-center gap-1 text-[11px] tracking-wider">
                                {language} <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            {isLangMenuOpen && (
                                <div className="absolute top-full mt-2 right-0 bg-[#111] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 min-w-[100px]">
                                    {(['PT-BR', 'EN', 'ES', 'FR', 'ZH'] as const).map(lang => (
                                        <button key={lang}
                                            onClick={() => { setLanguage(lang); setIsLangMenuOpen(false); }}
                                            className="block w-full text-left px-4 py-2 hover:bg-white/10 text-sm transition-colors">
                                            {lang}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button onClick={onEnter}
                            className="relative px-7 py-2.5 rounded-full overflow-hidden group border border-white/15 transition-transform hover:scale-105">
                            <div className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-700 group-hover:scale-110"
                                style={{ backgroundImage: 'url(/fundo-botao.png)' }} />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-0" />
                            <span className="relative z-10 font-bold tracking-[0.15em] text-white drop-shadow-md text-[12px] uppercase">
                                {t('nav.login')}
                            </span>
                        </button>
                    </div>
                </header>

                {/* Hero Content */}
                <main className="flex-1 flex flex-col items-center px-4 w-full max-w-[1600px] mx-auto pt-12">
                    <div className="text-center flex flex-col items-center max-w-5xl">

                        <div className="inline-flex items-center gap-2 bg-brand-purple/10 border border-brand-purple/20 rounded-full px-5 py-2 mb-10">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-purple animate-pulse" />
                            <span className="font-michroma text-[10px] tracking-[0.3em] text-brand-purple uppercase">
                                {t('hero.subtitle')}
                            </span>
                        </div>

                        <h1 className="font-michroma text-5xl md:text-7xl lg:text-[5.5rem] tracking-tight leading-[1.05] uppercase text-white drop-shadow-lg mb-3">
                            {t('hero.title1')}
                        </h1>
                        <h2 className="font-michroma text-5xl md:text-7xl lg:text-[5.5rem] tracking-tight leading-[1.05] uppercase mb-10"
                            style={{ WebkitTextStroke: '1px rgba(255,255,255,0.25)', color: 'transparent' }}>
                            {t('hero.title2')}
                        </h2>

                        <p className="font-montserrat text-lg md:text-xl text-gray-300 font-light leading-relaxed max-w-2xl mb-12">
                            {t('hero.descLeft')}
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <button onClick={onEnter}
                                className="relative px-10 py-4 rounded-full overflow-hidden group border border-white/15 transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(124,58,237,0.3)]">
                                <div className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-700 group-hover:scale-110"
                                    style={{ backgroundImage: 'url(/fundo-botao.png)' }} />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-0" />
                                <span className="relative z-10 font-bold tracking-[0.2em] text-white drop-shadow-md text-sm uppercase flex items-center gap-2">
                                    Entrar no Cronógrafo <ArrowRight className="w-4 h-4" />
                                </span>
                            </button>
                            <a href="#problema"
                                className="text-gray-500 hover:text-white transition-colors text-sm tracking-widest uppercase font-light flex items-center gap-2">
                                Ver como funciona
                            </a>
                        </div>
                    </div>

                    <div className="w-full flex justify-center mt-14">
                        <img src="/mockup-notebook.png" alt="Interface do Cronógrafo Sideral"
                            className="w-[900px] max-w-full object-contain drop-shadow-2xl"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    </div>
                </main>

                <div className="w-full flex justify-center pb-10">
                    <a href="#stats" className="flex flex-col items-center gap-2 group">
                        <UI_ICONS.ChevronDownIcon className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors animate-bounce" />
                    </a>
                </div>
            </div>

            {/* ── REST OF PAGE ──────────────────────────────────────────────── */}
            <div className="relative z-10 bg-[#050505]/90 backdrop-blur-sm border-t border-white/5">

                {/* ── STATS BAR ── */}
                <div id="stats" className="border-b border-white/5">
                    <div className="w-full max-w-[1600px] mx-auto px-8 py-12">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
                            {[
                                { value: '26+', label: t('stats.data') },
                                { value: '< 1′', label: t('stats.precision') },
                                { value: '25+', label: t('stats.bodies') },
                                { value: '5+', label: t('stats.systems') },
                            ].map((s, i) => (
                                <div key={i} className="flex flex-col items-center text-center gap-2">
                                    <span className="font-michroma text-4xl text-white">{s.value}</span>
                                    <span className="font-montserrat text-[11px] text-gray-600 tracking-wide leading-relaxed uppercase">{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── TENSÃO ── */}
                <section id="problema" className="w-full max-w-[1600px] mx-auto px-8 py-32">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        <div>
                            <p className="font-michroma text-[10px] tracking-[0.35em] text-red-500/60 uppercase mb-5">
                                {t('tension.pretitle')}
                            </p>
                            <h2 className="font-michroma text-3xl md:text-4xl tracking-wide uppercase text-white leading-tight mb-8">
                                {t('tension.title')}
                            </h2>
                            <p className="font-montserrat text-gray-400 text-base leading-relaxed font-light mb-12">
                                {t('tension.desc')}
                            </p>
                            <a href="#solucao" className="inline-flex items-center gap-2 text-brand-purple font-michroma text-[10px] tracking-widest uppercase hover:gap-4 transition-all">
                                Ver a solução <ArrowRight className="w-4 h-4" />
                            </a>
                        </div>

                        <div className="flex flex-col gap-4">
                            {[
                                { icon: <Eye />, title: t('tension.1.title'), desc: t('tension.1.desc') },
                                { icon: <Globe />, title: t('tension.2.title'), desc: t('tension.2.desc') },
                                { icon: <Zap />, title: t('tension.3.title'), desc: t('tension.3.desc') },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-5 p-6 bg-white/[0.02] border border-white/8 rounded-2xl hover:bg-white/[0.04] transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/15 flex items-center justify-center shrink-0">
                                        {React.cloneElement(item.icon as React.ReactElement, { className: 'w-5 h-5 text-red-400/70', strokeWidth: 1.5 })}
                                    </div>
                                    <div>
                                        <h4 className="font-michroma text-[10px] tracking-widest text-white uppercase mb-2">{item.title}</h4>
                                        <p className="font-montserrat text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── SOLUÇÃO / TEMPO ── */}
                <section id="solucao" className="w-full max-w-[1600px] mx-auto px-8 py-32 border-t border-white/5">
                    <div className="text-center mb-16">
                        <p className="font-michroma text-[10px] tracking-[0.35em] text-brand-purple uppercase mb-5">A solução</p>
                        <h2 className="font-michroma text-3xl md:text-5xl tracking-wide uppercase text-white mb-6">
                            {t('time.title')}
                        </h2>
                        <p className="text-lg text-gray-300 font-montserrat font-light max-w-3xl mx-auto leading-relaxed">
                            {t('time.desc')}
                        </p>
                    </div>

                    <div className="w-full max-w-5xl mx-auto aspect-[21/9] bg-gradient-to-br from-brand-purple/8 via-white/[0.02] to-transparent border border-brand-purple/20 rounded-[2rem] shadow-[0_0_80px_rgba(124,58,237,0.08)] flex items-center justify-center p-12 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/5 via-transparent to-brand-orange/3" />
                        <div className="text-center z-10 flex flex-col items-center gap-6">
                            <div className="w-20 h-20 rounded-full border border-brand-purple/25 flex items-center justify-center">
                                <Clock className="w-10 h-10 text-brand-purple/60" strokeWidth={1} />
                            </div>
                            <div>
                                <h4 className="font-michroma text-xl tracking-widest text-white mb-3 uppercase">{t('time.panelTitle')}</h4>
                                <p className="font-montserrat text-sm text-gray-500 tracking-wide">{t('time.panelDesc')}</p>
                            </div>
                            <button onClick={onEnter}
                                className="px-8 py-3 rounded-full border border-brand-purple/30 text-brand-purple text-[10px] font-michroma tracking-widest uppercase hover:bg-brand-purple/10 transition-colors">
                                Ver ao vivo →
                            </button>
                        </div>
                    </div>
                </section>

                {/* ── PÚBLICO-ALVO ── */}
                <section id="publico" className="w-full max-w-[1600px] mx-auto px-8 py-32 border-t border-white/5">
                    <div className="text-center mb-20">
                        <p className="font-michroma text-[10px] tracking-[0.35em] text-brand-purple uppercase mb-5">
                            {t('audience.pretitle')}
                        </p>
                        <h2 className="font-michroma text-3xl md:text-5xl tracking-wide uppercase text-white mb-6">
                            {t('audience.title')}
                        </h2>
                        <p className="text-lg text-gray-300 font-montserrat font-light max-w-2xl mx-auto leading-relaxed">
                            {t('audience.desc')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                        {[
                            { accent: '#7c3aed', label: t('audience.ast.label'), icon: <Star />, title: t('audience.ast.title'), desc: t('audience.ast.desc'), quote: t('audience.ast.quote'), cta: t('audience.ast.cta'), offset: '' },
                            { accent: '#3b82f6', label: t('audience.prof.label'), icon: <Sparkles />, title: t('audience.prof.title'), desc: t('audience.prof.desc'), quote: t('audience.prof.quote'), cta: t('audience.prof.cta'), offset: 'lg:-translate-y-6' },
                            { accent: '#f59e0b', label: t('audience.herm.label'), icon: <Moon />, title: t('audience.herm.title'), desc: t('audience.herm.desc'), quote: t('audience.herm.quote'), cta: t('audience.herm.cta'), offset: '' },
                        ].map((card, i) => (
                            <div key={i}
                                className={`group relative rounded-[2rem] p-10 flex flex-col border transition-all duration-500 hover:-translate-y-2 ${card.offset}`}
                                style={{ background: `linear-gradient(160deg, ${card.accent}10, transparent)`, borderColor: `${card.accent}20` }}>
                                <div className="absolute top-0 left-10 -translate-y-1/2 text-[10px] font-michroma px-4 py-1.5 rounded-full tracking-[0.2em] uppercase border"
                                    style={{ background: `${card.accent}15`, borderColor: `${card.accent}35`, color: card.accent }}>
                                    {card.label}
                                </div>
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8 mt-4 group-hover:scale-110 transition-transform duration-500 border"
                                    style={{ background: `${card.accent}12`, borderColor: `${card.accent}25` }}>
                                    {React.cloneElement(card.icon as React.ReactElement, { className: 'w-7 h-7', strokeWidth: 1.5, style: { color: card.accent } })}
                                </div>
                                <h3 className="font-michroma text-lg tracking-wider text-white mb-4 uppercase leading-snug">{card.title}</h3>
                                <p className="font-montserrat text-gray-400 text-sm leading-relaxed font-light mb-8 flex-1">{card.desc}</p>
                                <blockquote className="pl-4 mb-8 border-l-2" style={{ borderColor: `${card.accent}35` }}>
                                    <p className="font-montserrat text-xs text-gray-500 italic leading-relaxed">"{card.quote}"</p>
                                </blockquote>
                                <button onClick={onEnter}
                                    className="font-michroma text-[10px] tracking-widest uppercase hover:text-white transition-colors flex items-center gap-2 group/btn"
                                    style={{ color: card.accent }}>
                                    {card.cta} <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── PROVA SOCIAL ── */}
                <section className="w-full max-w-[1600px] mx-auto px-8 py-32 border-t border-white/5">
                    <div className="text-center mb-16">
                        <p className="font-michroma text-[10px] tracking-[0.35em] text-amber-500/60 uppercase mb-5">{t('proof.pretitle')}</p>
                        <h2 className="font-michroma text-3xl md:text-4xl tracking-wide uppercase text-white">{t('proof.title')}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-6xl mx-auto">
                        {[
                            { text: t('proof.1.text'), name: t('proof.1.name'), role: t('proof.1.role') },
                            { text: t('proof.2.text'), name: t('proof.2.name'), role: t('proof.2.role') },
                            { text: t('proof.3.text'), name: t('proof.3.name'), role: t('proof.3.role') },
                        ].map((p, i) => (
                            <div key={i} className="bg-white/[0.03] border border-white/8 rounded-[1.5rem] p-8 flex flex-col gap-5 hover:bg-white/[0.05] transition-all duration-300">
                                <div className="flex items-center justify-between">
                                    <Quote className="w-7 h-7 text-brand-purple/30" strokeWidth={1.5} />
                                    <div className="flex gap-0.5">
                                        {[...Array(5)].map((_, s) => (
                                            <span key={s} className="text-brand-purple/60 text-xs">★</span>
                                        ))}
                                    </div>
                                </div>
                                <p className="font-montserrat text-sm text-gray-400 leading-relaxed font-light flex-1 italic">{p.text}</p>
                                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                                    <div className="w-8 h-8 rounded-full bg-brand-purple/15 border border-brand-purple/25 flex items-center justify-center">
                                        <span className="font-michroma text-[10px] text-brand-purple">{p.name.charAt(0)}</span>
                                    </div>
                                    <div>
                                        <p className="font-montserrat text-xs text-white font-semibold">{p.name}</p>
                                        <p className="font-montserrat text-[11px] text-gray-600">{p.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── VISUALIZAÇÕES ── */}
                <section id="visualizacoes" className="w-full max-w-[1600px] mx-auto px-8 py-32 border-t border-white/5">
                    <div className="text-center mb-20">
                        <p className="font-michroma text-[10px] tracking-[0.35em] text-gray-600 uppercase mb-5">Experiência visual</p>
                        <h2 className="font-michroma text-3xl md:text-5xl tracking-wide uppercase text-white mb-6">{t('vis.title')}</h2>
                        <p className="text-lg text-gray-300 font-montserrat font-light max-w-2xl mx-auto leading-relaxed">{t('vis.desc')}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        <div className="bg-gradient-to-b from-amber-500/8 to-transparent border border-amber-500/15 rounded-[2rem] p-10 hover:border-amber-500/35 transition-all duration-500 hover:-translate-y-2 group">
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/12 border border-amber-500/20 flex items-center justify-center mb-8">
                                <Sun className="w-7 h-7 text-amber-400/80 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />
                            </div>
                            <h3 className="font-michroma text-base tracking-wider text-white mb-4 uppercase">{t('vis.atm.title')}</h3>
                            <p className="font-montserrat text-gray-500 text-sm leading-relaxed font-light">{t('vis.atm.desc')}</p>
                        </div>
                        <div className="bg-gradient-to-b from-brand-purple/8 to-transparent border border-brand-purple/15 rounded-[2rem] p-10 hover:border-brand-purple/35 transition-all duration-500 hover:-translate-y-2 group relative overflow-hidden md:-translate-y-4">
                            <div className="absolute top-0 right-0 bg-brand-purple/80 text-white text-[9px] font-michroma px-3 py-1 rounded-bl-xl tracking-widest">BETA</div>
                            <div className="w-14 h-14 rounded-2xl bg-brand-purple/12 border border-brand-purple/20 flex items-center justify-center mb-8">
                                <Magnet className="w-7 h-7 text-brand-purple/80 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />
                            </div>
                            <h3 className="font-michroma text-base tracking-wider text-white mb-4 uppercase">{t('vis.mag.title')}</h3>
                            <p className="font-montserrat text-gray-500 text-sm leading-relaxed font-light">{t('vis.mag.desc')}</p>
                        </div>
                        <div className="bg-gradient-to-b from-blue-500/8 to-transparent border border-blue-500/15 rounded-[2rem] p-10 hover:border-blue-500/35 transition-all duration-500 hover:-translate-y-2 group">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/12 border border-blue-500/20 flex items-center justify-center mb-8">
                                <Sparkles className="w-7 h-7 text-blue-400/80 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />
                            </div>
                            <h3 className="font-michroma text-base tracking-wider text-white mb-4 uppercase">{t('vis.const.title')}</h3>
                            <p className="font-montserrat text-gray-500 text-sm leading-relaxed font-light">{t('vis.const.desc')}</p>
                        </div>
                    </div>
                </section>

                {/* ── RECURSOS ── */}
                <section id="recursos" className="w-full max-w-[1600px] mx-auto px-8 py-32 border-t border-white/5">
                    <div className="text-center mb-20">
                        <p className="font-michroma text-[10px] tracking-[0.35em] text-gray-600 uppercase mb-5">Ferramentas</p>
                        <h2 className="font-michroma text-3xl md:text-5xl tracking-wide uppercase text-white mb-6">{t('feat.title')}</h2>
                        <p className="text-lg text-gray-300 font-montserrat font-light max-w-2xl mx-auto leading-relaxed">{t('feat.desc')}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-7xl mx-auto">
                        <FeatureCard icon={<Activity />} title={t('feat.1.title')} description={t('feat.1.desc')} />
                        <FeatureCard icon={<Clock />} title={t('feat.2.title')} description={t('feat.2.desc')} />
                        <FeatureCard icon={<Sliders />} title={t('feat.3.title')} description={t('feat.3.desc')} />
                        <FeatureCard icon={<FileDown />} title={t('feat.4.title')} description={t('feat.4.desc')} />
                        <FeatureCard icon={<Moon />} title={t('feat.5.title')} description={t('feat.5.desc')} />
                        <FeatureCard icon={<MousePointerClick />} title={t('feat.6.title')} description={t('feat.6.desc')} />
                    </div>
                    <div className="mt-10 max-w-4xl mx-auto bg-gradient-to-r from-brand-purple/10 via-brand-purple/3 to-transparent border border-brand-purple/15 rounded-[2rem] p-8 flex flex-col sm:flex-row items-center gap-8">
                        <div className="w-14 h-14 rounded-2xl bg-brand-purple/12 border border-brand-purple/20 flex items-center justify-center shrink-0">
                            <Map className="w-7 h-7 text-brand-purple/70" strokeWidth={1.5} />
                        </div>
                        <div className="text-center sm:text-left flex-1">
                            <h4 className="font-michroma text-sm text-white mb-2 tracking-wider uppercase">{t('req.title')}</h4>
                            <p className="font-montserrat text-sm text-gray-500 font-light leading-relaxed">{t('req.desc')}</p>
                        </div>
                        <button onClick={onEnter}
                            className="shrink-0 px-6 py-3 rounded-full border border-brand-purple/30 text-brand-purple text-[10px] font-michroma tracking-widest uppercase hover:bg-brand-purple/10 transition-colors whitespace-nowrap">
                            Entrar agora
                        </button>
                    </div>
                </section>

                {/* ── FAQ ── */}
                <section className="w-full max-w-[1600px] mx-auto px-8 py-32 border-t border-white/5">
                    <div className="text-center mb-16">
                        <p className="font-michroma text-[10px] tracking-[0.35em] text-gray-600 uppercase mb-5">{t('faq.pretitle')}</p>
                        <h2 className="font-michroma text-3xl md:text-4xl tracking-wide uppercase text-white">{t('faq.title')}</h2>
                    </div>
                    <div className="max-w-3xl mx-auto flex flex-col gap-3">
                        <FaqItem question={t('faq.1.q')} answer={t('faq.1.a')} />
                        <FaqItem question={t('faq.2.q')} answer={t('faq.2.a')} />
                        <FaqItem question={t('faq.3.q')} answer={t('faq.3.a')} />
                        <FaqItem question={t('faq.4.q')} answer={t('faq.4.a')} />
                        <FaqItem question={t('faq.5.q')} answer={t('faq.5.a')} />
                        <FaqItem question={t('faq.6.q')} answer={t('faq.6.a')} />
                    </div>
                </section>

                {/* ── PREÇOS ── */}
                <section id="planos" className="w-full max-w-[1600px] mx-auto px-8 py-32 border-t border-white/5">
                    <div className="text-center mb-14">
                        <p className="font-michroma text-[10px] tracking-[0.35em] text-gray-600 uppercase mb-5">Planos</p>
                        <h2 className="font-michroma text-3xl md:text-5xl tracking-wide uppercase text-white mb-6">{t('pricing.title')}</h2>
                        <p className="text-lg text-gray-300 font-montserrat font-light max-w-2xl mx-auto leading-relaxed">{t('pricing.desc')}</p>
                    </div>

                    <div className="flex items-center justify-center gap-4 mb-14">
                        <span className={`text-sm font-montserrat ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-600'}`}>{t('pricing.monthly')}</span>
                        <button onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                            className="w-12 h-6 bg-white/10 rounded-full relative transition-colors hover:bg-white/15">
                            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-brand-purple rounded-full transition-transform ${billingCycle === 'yearly' ? 'translate-x-6' : ''}`} />
                        </button>
                        <span className={`text-sm font-montserrat ${billingCycle === 'yearly' ? 'text-white' : 'text-gray-600'}`}>
                            {t('pricing.yearly')} <span className="text-brand-purple text-xs ml-1">{t('pricing.save')}</span>
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto items-center mb-10">

                        {/* Grátis */}
                        <div className="bg-white/[0.03] border border-white/8 rounded-[2rem] p-10 flex flex-col h-full">
                            <p className="font-michroma text-[10px] tracking-widest text-gray-600 uppercase mb-1">{t('pricing.free.title')}</p>
                            <h3 className="font-michroma text-2xl text-white mb-2 uppercase">Grátis</h3>
                            <p className="font-montserrat text-gray-600 text-sm mb-8">{t('pricing.free.desc')}</p>
                            <div className="mb-8 flex items-baseline gap-1">
                                <span className="text-4xl font-bold text-white">R$ 0</span>
                                <span className="text-gray-600 text-sm">/{t('pricing.month')}</span>
                            </div>
                            <ul className="flex flex-col gap-4 mb-10 flex-1">
                                <PricingFeature included={true} text={t('pricing.free.f1')} />
                                <PricingFeature included={true} text={t('pricing.free.f2')} />
                                <PricingFeature included={false} text={t('pricing.free.f3')} />
                                <PricingFeature included={false} text={t('pricing.free.f4')} />
                                <PricingFeature included={false} text={t('pricing.free.f5')} />
                            </ul>
                            <button onClick={onEnter} className="w-full py-4 rounded-full border border-white/12 text-gray-400 font-bold tracking-widest hover:bg-white/5 transition-colors text-sm uppercase mt-auto">
                                {t('pricing.free.btn')}
                            </button>
                        </div>

                        {/* Mestre — destaque */}
                        <div className="bg-gradient-to-b from-brand-purple/18 to-white/[0.03] border-2 border-brand-purple/45 rounded-[2rem] p-10 flex flex-col relative md:-translate-y-5 shadow-[0_0_60px_rgba(124,58,237,0.12)] h-full">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-purple text-white text-[9px] font-michroma px-5 py-1.5 rounded-full tracking-widest uppercase shadow-lg whitespace-nowrap">
                                {t('pricing.prem.badge')}
                            </div>
                            <p className="font-michroma text-[10px] tracking-widest text-brand-purple/60 uppercase mb-1">{t('pricing.prem.title')}</p>
                            <h3 className="font-michroma text-2xl text-brand-purple mb-2 uppercase">Mestre</h3>
                            <p className="font-montserrat text-gray-400 text-sm mb-8">{t('pricing.prem.desc')}</p>
                            <div className="mb-1 flex items-baseline gap-1">
                                <span className="text-4xl font-bold text-white">{premSym} {premVal}</span>
                                <span className="text-gray-500 text-sm">/{billingCycle === 'monthly' ? t('pricing.month') : t('pricing.year')}</span>
                            </div>
                            <p className="font-montserrat text-xs text-gray-600 mb-6">Menos de R$ {perDayPrem} por dia</p>
                            <ul className="flex flex-col gap-3 mb-10 flex-1">
                                <PricingFeature included={true} text={t('pricing.prem.f1')} />
                                <PricingFeature included={true} text={t('pricing.prem.f2')} />
                                <PricingFeature included={true} text={t('pricing.prem.f3')} />
                                <PricingFeature included={true} text={t('pricing.prem.f4')} />
                                <PricingFeature included={true} text={t('pricing.prem.f5')} />
                                <PricingFeature included={true} text={t('pricing.prem.f6')} />
                                <PricingFeature included={true} text={t('pricing.prem.f7')} />
                                <PricingFeature included={true} text={t('pricing.prem.f8')} />
                            </ul>
                            <button onClick={onEnter} className="w-full py-4 rounded-full bg-brand-purple text-white font-bold tracking-widest hover:bg-brand-purple/80 transition-colors shadow-[0_0_30px_rgba(124,58,237,0.35)] mt-auto text-sm uppercase">
                                {t('pricing.prem.btn')}
                            </button>
                            <p className="text-center text-xs text-gray-700 mt-4 font-montserrat">Cancele quando quiser</p>
                        </div>

                        {/* Praticante */}
                        <div className="bg-white/[0.03] border border-white/8 rounded-[2rem] p-10 flex flex-col h-full">
                            <p className="font-michroma text-[10px] tracking-widest text-gray-600 uppercase mb-1">{t('pricing.pro.title')}</p>
                            <h3 className="font-michroma text-2xl text-white mb-2 uppercase">Praticante</h3>
                            <p className="font-montserrat text-gray-600 text-sm mb-8">{t('pricing.pro.desc')}</p>
                            <div className="mb-8 flex items-baseline gap-1">
                                <span className="text-4xl font-bold text-white">{proSym} {proVal}</span>
                                <span className="text-gray-600 text-sm">/{billingCycle === 'monthly' ? t('pricing.month') : t('pricing.year')}</span>
                            </div>
                            <ul className="flex flex-col gap-4 mb-10 flex-1">
                                <PricingFeature included={true} text={t('pricing.pro.f1')} />
                                <PricingFeature included={true} text={t('pricing.pro.f2')} />
                                <PricingFeature included={true} text={t('pricing.pro.f3')} />
                                <PricingFeature included={true} text={t('pricing.pro.f4')} />
                                <PricingFeature included={true} text={t('pricing.pro.f5')} />
                                <PricingFeature included={false} text={t('pricing.pro.f6')} />
                                <PricingFeature included={false} text={t('pricing.pro.f7')} />
                            </ul>
                            <button onClick={onEnter} className="w-full py-4 rounded-full border border-white/12 text-gray-400 font-bold tracking-widest hover:bg-white/5 transition-colors text-sm uppercase mt-auto">
                                {t('pricing.pro.btn')}
                            </button>
                        </div>
                    </div>

                    {/* Fundador */}
                    <div className="max-w-4xl mx-auto bg-gradient-to-r from-yellow-500/12 via-yellow-500/4 to-transparent border border-yellow-500/20 rounded-[2rem] p-10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[9px] font-michroma px-4 py-1 rounded-bl-2xl tracking-widest font-bold">
                            {t('pricing.founder.badge')}
                        </div>
                        <div className="flex flex-col md:flex-row items-center gap-10">
                            <div className="w-20 h-20 rounded-2xl bg-yellow-500/12 border border-yellow-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500">
                                <Star className="w-10 h-10 text-yellow-500/80" strokeWidth={1.5} />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="font-michroma text-2xl tracking-widest text-yellow-500 mb-3 uppercase">{t('pricing.founder.title')}</h3>
                                <p className="font-montserrat text-gray-400 text-sm leading-relaxed mb-5">{t('pricing.founder.desc')}</p>
                                <div className="flex flex-col sm:flex-row items-center md:items-end gap-3">
                                    <span className="text-gray-700 line-through font-montserrat">{fSym} {fOldVal}</span>
                                    <span className="text-4xl font-bold text-white font-michroma">{fSym} {fNewVal}</span>
                                    <span className="text-yellow-500/70 text-[10px] tracking-widest uppercase font-michroma">{t('pricing.founder.pay')}</span>
                                </div>
                            </div>
                            <button onClick={onEnter}
                                className="shrink-0 px-8 py-4 rounded-full bg-yellow-500 text-black font-bold tracking-wider hover:bg-yellow-400 transition-all shadow-[0_0_25px_rgba(234,179,8,0.2)] hover:shadow-[0_0_40px_rgba(234,179,8,0.35)] whitespace-nowrap text-sm uppercase">
                                {t('pricing.founder.btn')}
                            </button>
                        </div>
                    </div>
                </section>

                {/* ── CTA FINAL ── */}
                <section className="w-full border-t border-white/5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-brand-purple/5 via-transparent to-transparent" />
                    <div className="w-full max-w-[1600px] mx-auto px-8 py-40 flex flex-col items-center text-center relative z-10">
                        <div className="w-16 h-16 rounded-full border border-brand-purple/15 flex items-center justify-center mb-10">
                            <div className="w-2.5 h-2.5 rounded-full bg-brand-purple animate-pulse" />
                        </div>
                        <p className="font-michroma text-[10px] tracking-[0.35em] text-brand-purple uppercase mb-6">{t('closing.pretitle')}</p>
                        <h2 className="font-michroma text-4xl md:text-6xl lg:text-7xl tracking-wide uppercase text-white mb-6">
                            {t('closing.title')}
                        </h2>
                        <p className="font-montserrat text-lg text-gray-500 font-light max-w-xl leading-relaxed mb-12">
                            {t('closing.desc')}
                        </p>
                        <button onClick={onEnter}
                            className="relative px-12 py-5 rounded-full overflow-hidden group border border-white/15 transition-all hover:scale-105 hover:shadow-[0_0_80px_rgba(124,58,237,0.25)]">
                            <div className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-700 group-hover:scale-110"
                                style={{ backgroundImage: 'url(/fundo-botao.png)' }} />
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-0" />
                            <span className="relative z-10 font-bold tracking-[0.2em] text-white drop-shadow-md text-sm uppercase flex items-center gap-3">
                                {t('closing.btn')} <ArrowRight className="w-4 h-4" />
                            </span>
                        </button>
                        <p className="font-montserrat text-xs text-gray-700 mt-5 tracking-wide">{t('closing.sub')}</p>
                    </div>
                </section>

                {/* ── FOOTER ── */}
                <footer className="w-full bg-black/40 border-t border-white/5 py-14 px-8">
                    <div className="max-w-[1600px] mx-auto">
                        <p className="text-center font-michroma text-[10px] tracking-[0.4em] text-white/10 uppercase mb-10">
                            O céu se move. Você também pode.
                        </p>
                        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                            <img src="/logo.svg" alt="Cronógrafo Sideral" className="w-[130px] object-contain"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            <div className="flex gap-8 text-xs text-gray-700 font-montserrat tracking-wide">
                                <a href="#" className="hover:text-gray-400 transition-colors">Termos de Uso</a>
                                <a href="#" className="hover:text-gray-400 transition-colors">Privacidade</a>
                                <a href="#" className="hover:text-gray-400 transition-colors">Contato</a>
                            </div>
                            <div className="text-xs text-gray-800 font-montserrat text-center md:text-right">
                                <p>&copy; {new Date().getFullYear()} Cronógrafo Sideral. Todos os direitos reservados.</p>
                                <p className="mt-1">Criado por Rafael C. Medeiros</p>
                            </div>
                        </div>
                    </div>
                </footer>

            </div>
        </div>
    );
};
