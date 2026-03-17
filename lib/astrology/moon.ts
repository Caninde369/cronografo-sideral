
export const getMoonPhaseInfo = (phase: number) => {
    if (phase < 0.03 || phase > 0.97) return { name: 'Lua Nova', icon: '🌑' };
    if (phase < 0.22) return { name: 'Lua Crescente', icon: '🌒' };
    if (phase < 0.28) return { name: 'Quarto Crescente', icon: '🌓' };
    if (phase < 0.47) return { name: 'Gibosa Crescente', icon: '🌔' };
    if (phase < 0.53) return { name: 'Lua Cheia', icon: '🌕' };
    if (phase < 0.72) return { name: 'Gibosa Minguante', icon: '🌖' };
    if (phase < 0.78) return { name: 'Quarto Minguante', icon: '🌗' };
    return { name: 'Lua Minguante', icon: '🌘' };
};
