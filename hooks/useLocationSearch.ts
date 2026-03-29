import { useState, useEffect, useRef } from 'react';

export type LocationResult = {
    displayName: string;
    latitude: number;
    longitude: number;
};

export const useLocationSearch = (query: string) => {
    const [results, setResults] = useState<LocationResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const debounceRef = useRef<number | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (!query || query.trim().length < 2) {
            setResults([]);
            setIsLoading(false);
            return;
        }

        // Limpar debounce anterior
        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = window.setTimeout(async () => {
            // Cancelar request anterior se ainda em andamento
            if (abortRef.current) abortRef.current.abort();
            abortRef.current = new AbortController();

            setIsLoading(true);
            setError(null);

            try {
                const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query.trim())}&format=json&limit=6&addressdetails=1`;
                const response = await fetch(url, {
                    signal: abortRef.current.signal,
                    headers: {
                        // Nominatim exige User-Agent identificado
                        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
                    }
                });

                if (!response.ok) throw new Error('Erro na busca');

                const data = await response.json();

                const mapped: LocationResult[] = data.map((item: any) => ({
                    displayName: item.display_name,
                    latitude: parseFloat(item.lat),
                    longitude: parseFloat(item.lon),
                }));

                setResults(mapped);
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    setError('Não foi possível buscar. Tente novamente.');
                    setResults([]);
                }
            } finally {
                setIsLoading(false);
            }
        }, 500); // debounce 500ms

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query]);

    return { results, isLoading, error };
};
