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
        <header className="flex items-center justify-between p-4 bg-white border-b shadow-md sticky top-0 z-10">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg text-white font-black italic shadow-inner">
                SafeWay
            </div>

            <div className="flex flex-1 max-w-3xl mx-8 gap-3">
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
                    className="px-8 py-2 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 shadow-lg active:scale-95 transition-all"
                >
                    Go!
                </button>
            </div>
        </header>
    );
};
