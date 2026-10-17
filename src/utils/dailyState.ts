export type DailyEnergeticState = {
    energy: {
        normalized: number;
        perceived: number;
    };
    aspects: any[];
    dominantEmotion?: {
        emotion: string;
    };
    emotions?: { emotion: string; weight: number }[];
};

export const calculateDailyState = (aspects: any[]): DailyEnergeticState => {
    return {
        energy: { normalized: 0, perceived: 0 },
        aspects: (aspects || []).map(a => ({ ...a, emotion: 0 })),
        dominantEmotion: { emotion: 'Neutral' },
        emotions: []
    };
};
