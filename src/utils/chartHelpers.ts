export const MOOD_COLOR_STOPS = [
  { score: 50, color: "#22c55e" },
  { score: 0, color: "#fbbf24" },
  { score: -50, color: "#ef4444" }
];

export const scoreToY = (score: number, svgHeight: number) => {
    return svgHeight / 2 - (score / 100) * (svgHeight / 2);
};

export const scoreToMoodColor = (score: number) => {
    if (score > 33) return "#22c55e";
    if (score < -33) return "#ef4444";
    return "#fbbf24";
};
