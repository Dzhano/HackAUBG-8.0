import { useCallback } from 'react';
import { useStore } from '../store/useStore';
import { StreetInput } from './common/StreetInput';

export const Header = () => {
    const startLabel = useStore((s) => s.startLabel);
    const endLabel = useStore((s) => s.endLabel);
    const setStart = useStore((s) => s.setStart);
    const setEnd = useStore((s) => s.setEnd);
    const fetchRoutes = useStore((s) => s.fetchRoutes);

    const handleStartSelect = useCallback(
        (lat: number, lng: number, label: string) => setStart({ lat, lng }, label),
        [setStart],
    );

    const handleEndSelect = useCallback(
        (lat: number, lng: number, label: string) => setEnd({ lat, lng }, label),
        [setEnd],
    );

    const handleStartChange = useCallback(
        (text: string) => setStart({}, text),
        [setStart],
    );

    const handleEndChange = useCallback(
        (text: string) => setEnd({}, text),
        [setEnd],
    );

    return (
        <header className="flex flex-col md:flex-row items-center justify-between p-3 md:p-4 bg-white border-b shadow-md sticky top-0 z-10">
            <div className="flex items-center gap-2 mb-2 md:mb-0">
                <img src="/logo.png" alt="SafeWay" className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover" />
                <h1 className="text-2xl md:text-3xl font-bold text-blue-600" style={{ fontFamily: "'Playfair Display', serif" }}>
                    SafeWay
                </h1>
            </div>

            <div className="flex flex-col md:flex-row w-full md:flex-1 md:max-w-3xl md:mx-8 gap-2 md:gap-3">
                <StreetInput
                    placeholder="Starting point (Sofia)..."
                    value={startLabel}
                    onSelect={handleStartSelect}
                    onChange={handleStartChange}
                />

                <StreetInput
                    placeholder="Destination..."
                    value={endLabel}
                    onSelect={handleEndSelect}
                    onChange={handleEndChange}
                />

                <button
                    onClick={fetchRoutes}
                    className="px-8 py-2 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 shadow-lg active:scale-95 transition-all w-full md:w-auto"
                >
                    Search
                </button>
            </div>

        </header>
    );
};
