/**
 * Calendário solar (abre ao clicar em "Dia solar" no controle de tempo).
 * Os 12 signos do ano solar atual, cada um com seus dias em sequência; o dia de hoje fica marcado.
 * Clicar num dia leva o Cronógrafo para essa data, mantendo a hora.
 * Usa a mesma tabela de entradas da linha do tempo (SOLAR_SIGNS), para os números baterem.
 */
import React, { useEffect } from 'react';
import { SOLAR_SIGNS, ZODIAC_YEAR_START } from '../SolarScrubber';
import { ZODIAC_ICONS } from '../icons';

const pad = (n: number) => String(n).padStart(2, '0');
const doyOf = (d: Date) => Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);

export const SolarCalendarPopup: React.FC<{
  open: boolean;
  currentDate: Date;
  leftOffset?: number;
  onClose: () => void;
  onPick: (d: Date) => void;
}> = ({ open, currentDate, leftOffset = 0, onClose, onPick }) => {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);

  if (!open) return null;

  const doy = doyOf(currentDate);
  const baseYear = doy >= ZODIAC_YEAR_START ? currentDate.getFullYear() : currentDate.getFullYear() - 1;
  const dateOfZ = (z: number) => new Date(baseYear, 0, ZODIAC_YEAR_START + z, currentDate.getHours(), currentDate.getMinutes());
  const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  return (
    <>
      <div className="scp-scrim" onClick={onClose} />
      <div className="scp" role="dialog" aria-label="Calendário solar" style={{ left: `${leftOffset + 16}px` }}>
        <style>{CSS}</style>
        <div className="scp-h">
          <span className="scp-t">Calendário solar <span className="scp-y">{baseYear}–{baseYear + 1}</span></span>
          <button className="scp-x" onClick={onClose} aria-label="Fechar"><i className="ti ti-x" /></button>
        </div>
        <div className="scp-body">
          {SOLAR_SIGNS.map((s, i) => {
            const next = SOLAR_SIGNS[(i + 1) % SOLAR_SIGNS.length];
            const z0 = (s.startDoy - ZODIAC_YEAR_START + 365) % 365;
            const len = ((next.startDoy - s.startDoy + 365) % 365) || 30;
            const d0 = dateOfZ(z0), d1 = dateOfZ(z0 + len - 1);
            const Icon = ZODIAC_ICONS[s.key as keyof typeof ZODIAC_ICONS] as any;
            const isCur = Array.from({ length: len }).some((_, k) => sameDay(dateOfZ(z0 + k), currentDate));
            return (
              <div key={s.key} className={`scp-row ${isCur ? 'cur' : ''}`}>
                <span className="scp-gl" style={{ color: s.gradientEnd, borderColor: s.gradientEnd }}>
                  {Icon ? <Icon style={{ width: 13, height: 13 }} /> : s.glyph}
                </span>
                <span className="scp-nm">{s.name}<small>{pad(d0.getDate())}/{pad(d0.getMonth() + 1)} – {pad(d1.getDate())}/{pad(d1.getMonth() + 1)}</small></span>
                <div className="scp-ds" style={{ gridTemplateColumns: `repeat(${len},1fr)` }}>
                  {Array.from({ length: len }).map((_, k) => {
                    const d = dateOfZ(z0 + k);
                    const now = sameDay(d, currentDate);
                    return (
                      <button
                        key={k}
                        className={now ? 'now' : ''}
                        title={`Dia ${k + 1} de ${s.name} · ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`}
                        style={{ background: `linear-gradient(90deg, ${s.gradientStart}, ${s.gradientEnd})`, opacity: now ? 1 : 0.35 + 0.4 * (k / Math.max(1, len - 1)) }}
                        onClick={() => onPick(d)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

const CSS = `
.scp-scrim{position:fixed;inset:0;z-index:11490;background:rgba(0,0,0,.35)}
.scp{position:fixed;z-index:11500;bottom:150px;width:440px;max-width:calc(100vw - 32px);max-height:calc(100vh - 170px);background:#0a070c;border:1px solid #2a2430;border-radius:20px;box-shadow:0 30px 80px -20px rgba(0,0,0,.9);display:flex;flex-direction:column;overflow:hidden;color:#EDE9E3;font-family:'DM Sans',system-ui,sans-serif}
.scp-h{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 6px}
.scp-t{font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:500;font-size:20px}
.scp-y{font-family:'DM Mono',monospace;font-style:normal;font-size:13px;color:#B9B4BE;margin-left:6px}
.scp-x{width:32px;height:32px;border-radius:50%;border:0;background:transparent;color:#B9B4BE;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}
.scp-x:hover{background:rgba(255,255,255,.08);color:#fff}
.scp-body{overflow-y:auto;padding:0 16px 16px;display:flex;flex-direction:column;gap:4px;scrollbar-width:thin}
.scp-row{display:grid;grid-template-columns:26px 96px 1fr;align-items:center;gap:8px;padding:4px 6px;border-radius:10px}
.scp-row.cur{background:rgba(255,255,255,.05)}
.scp-gl{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1px solid}
.scp-nm{display:flex;flex-direction:column;font-size:12px;font-weight:500}
.scp-nm small{font-family:'DM Mono',monospace;font-weight:400;font-size:10.5px;color:#B9B4BE}
.scp-ds{display:grid;gap:2px}
.scp-ds button{height:12px;border-radius:3px;border:0;padding:0;cursor:pointer}
.scp-ds button:hover{outline:1px solid rgba(255,255,255,.6)}
.scp-ds button.now{outline:1.5px solid #fff;outline-offset:1px}
@media (max-width:640px){.scp{left:8px!important;right:8px;width:auto;top:max(8px,env(safe-area-inset-top,0px));bottom:max(8px,env(safe-area-inset-bottom,0px));max-height:none;max-width:none}.scp-row{grid-template-columns:26px 1fr}.scp-ds{grid-column:1/-1}}
`;

export default SolarCalendarPopup;
