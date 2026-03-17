
import { useState, useEffect } from 'react';

export type WeatherCondition = 'clear' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'storm';

export interface WeatherData {
    temperature: number;
    condition: WeatherCondition;
    cloudCover: number; // 0-100
    isDay: boolean; // From API or calculated
    windSpeed: number;
    code: number; // WMO code
}

// WMO Weather interpretation codes (https://open-meteo.com/en/docs)
const getWeatherCondition = (code: number): WeatherCondition => {
    if (code === 0) return 'clear';
    if (code >= 1 && code <= 3) return 'cloudy';
    if (code === 45 || code === 48) return 'fog';
    if (code >= 51 && code <= 67) return 'rain';
    if (code >= 80 && code <= 82) return 'rain';
    if (code >= 71 && code <= 77) return 'snow';
    if (code >= 85 && code <= 86) return 'snow';
    if (code >= 95 && code <= 99) return 'storm';
    return 'clear';
};

export const useWeather = (latitude: number, longitude: number, currentTime: Date) => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchWeather = async () => {
            setLoading(true);
            try {
                // Fetch current weather from Open-Meteo (Free, no API key required for non-commercial use)
                const response = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,is_day,weather_code,cloud_cover,wind_speed_10m&timezone=auto`
                );
                
                if (!response.ok) throw new Error('Weather fetch failed');
                
                const data = await response.json();
                const current = data.current;

                setWeather({
                    temperature: current.temperature_2m,
                    condition: getWeatherCondition(current.weather_code),
                    code: current.weather_code,
                    cloudCover: current.cloud_cover,
                    isDay: current.is_day === 1,
                    windSpeed: current.wind_speed_10m
                });
            } catch (error) {
                console.error("Failed to fetch weather:", error);
                // Fallback or keep previous state
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();

        // Refresh every 30 minutes
        const interval = setInterval(fetchWeather, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, [latitude, longitude]); // Re-fetch if location changes

    return { weather, loading };
};
