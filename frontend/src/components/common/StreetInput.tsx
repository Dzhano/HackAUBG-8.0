import { useState, useRef, useEffect, useCallback } from 'react';

interface PhotonFeature {
    geometry: { coordinates: [number, number] };
    properties: {
        name?: string;
        street?: string;
        housenumber?: string;
        city?: string;
        state?: string;
        country?: string;
        osm_value?: string;
    };
}

interface Props {
    placeholder: string;
    value: string;
    onSelect: (lat: number, lng: number, label: string) => void;
    onChange: (text: string) => void;
}

function formatLabel(p: PhotonFeature['properties']): string {
    const parts: string[] = [];
    if (p.name && p.name !== p.street) parts.push(p.name);
    if (p.street) {
        parts.push(p.housenumber ? `${p.street} ${p.housenumber}` : p.street);
    }
    if (p.city) parts.push(p.city);
    return parts.join(', ') || p.country || 'Unknown';
}

const DEBOUNCE_MS = 300;
const PHOTON_URL = 'https://photon.komoot.io/api';
const BG_CENTER = { lat: 42.6977, lon: 23.3217 };

export const StreetInput: React.FC<Props> = ({ placeholder, value, onSelect, onChange }) => {
    const [suggestions, setSuggestions] = useState<PhotonFeature[]>([]);
    const [open, setOpen] = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const fetchSuggestions = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSuggestions([]);
            return;
        }
        try {
            const params = new URLSearchParams({
                q: query,
                lat: String(BG_CENTER.lat),
                lon: String(BG_CENTER.lon),
                limit: '5',
                lang: 'en',
            });
            const res = await fetch(`${PHOTON_URL}?${params}`);
            const data = await res.json();
            setSuggestions(data.features ?? []);
            setOpen(true);
            setActiveIdx(-1);
        } catch {
            setSuggestions([]);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        onChange(text);

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => fetchSuggestions(text), DEBOUNCE_MS);
    };

    const handleSelect = (feature: PhotonFeature) => {
        const [lng, lat] = feature.geometry.coordinates;
        const label = formatLabel(feature.properties);
        onSelect(lat, lng, label);
        setOpen(false);
        setSuggestions([]);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!open || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIdx((i) => (i < suggestions.length - 1 ? i + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIdx((i) => (i > 0 ? i - 1 : suggestions.length - 1));
        } else if (e.key === 'Enter' && activeIdx >= 0) {
            e.preventDefault();
            handleSelect(suggestions[activeIdx]);
        } else if (e.key === 'Escape') {
            setOpen(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return (
        <div className="flex-1 relative" ref={wrapperRef}>
            <input
                type="text"
                placeholder={placeholder}
                className="w-full px-4 py-2 bg-gray-100 border border-transparent rounded-full focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={() => suggestions.length > 0 && setOpen(true)}
            />

            {open && suggestions.length > 0 && (
                <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                    {suggestions.map((feat, idx) => (
                        <li
                            key={idx}
                            className={`px-4 py-2.5 cursor-pointer text-sm transition-colors ${
                                idx === activeIdx
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'hover:bg-gray-50'
                            }`}
                            onMouseEnter={() => setActiveIdx(idx)}
                            onMouseDown={() => handleSelect(feat)}
                        >
                            <span className="font-medium">
                                {feat.properties.name || feat.properties.street || 'Unnamed'}
                            </span>
                            {feat.properties.city && (
                                <span className="text-gray-400 ml-1">
                                    — {feat.properties.city}
                                    {feat.properties.country ? `, ${feat.properties.country}` : ''}
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
