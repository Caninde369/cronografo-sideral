
export interface ArcaneDateResult {
  cycle: number;
  arcaneMonth: number;
  arcaneDay: number;
}

export interface DetailedArcaneResult extends ArcaneDateResult {
  jornada: number;
  ano: number;
  mes: number;
  dia: number;
  personalArcane: number;
  totalDays: number;
}

/**
 * Calcula o Arcano Pessoal (Soma dos dígitos do dia do nascimento)
 */
export const calculatePersonalArcane = (birthDateStr: string): number => {
  if (!birthDateStr) return 0;
  const day = new Date(birthDateStr + 'T00:00:00').getDate();
  const sum = String(day).split('').map(Number).reduce((a, b) => a + b, 0);
  return sum === 22 ? 0 : sum % 22;
};

/**
 * Realiza a conversão técnica de data gregoriana para o sistema Arcano.
 * Baseada no Prompt ANTI-ERRO: Decomposição Literal.
 */
export const calculateDetailedArcane = (birthDateStr: string, readDateStr: string): DetailedArcaneResult => {
  const birth = new Date(birthDateStr + 'T00:00:00');
  const read = new Date(readDateStr + 'T00:00:00');
  
  // ΔD: Diferença absoluta em dias
  const diffInMs = read.getTime() - birth.getTime();
  const totalDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  // Constantes de Hierarquia (Base 22)
  const DIAS_MES = 22;
  const DIAS_ANO = 484;      // 22 * 22
  const DIAS_JORNADA = 10648; // 22 * 484

  // 1. Jornada (J)
  const jornada = Math.floor(totalDays / DIAS_JORNADA);
  const restoJornada = ((totalDays % DIAS_JORNADA) + DIAS_JORNADA) % DIAS_JORNADA;

  // 2. Ano (A)
  const ano = Math.floor(restoJornada / DIAS_ANO);
  const restoAno = restoJornada % DIAS_ANO;

  // 3. Mês (M)
  // Cada mês possui exatamente 22 dias (índices 0 a 21).
  // Ao atingir o dia 0 do próximo ciclo de 22 dias, o mês avança imediatamente.
  const mes = Math.floor(restoAno / DIAS_MES);

  // 4. Dia (D)
  // O dia varia estritamente de 0 a 21.
  const dia = restoAno % DIAS_MES;

  return {
    cycle: jornada,
    arcaneMonth: mes,
    arcaneDay: dia,
    jornada,
    ano,
    mes,
    dia,
    personalArcane: calculatePersonalArcane(birthDateStr),
    totalDays
  };
};
