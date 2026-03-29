import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { useStore } from '../store/useStore';
import { StreetInput } from './common/StreetInput';

export const Header = () => {
    const [expand, setExpand] = useState(false);
    const [allowOverflow, setAllowOverflow] = useState(false);
    const headerRef = useRef<HTMLElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);

    const startLabel = useStore((s) => s.startLabel);
    const endLabel = useStore((s) => s.endLabel);
    const setStart = useStore((s) => s.setStart);
    const setEnd = useStore((s) => s.setEnd);
    const start = useStore((s) => s.start);
    const end = useStore((s) => s.end);
    const fetchRoutes = useStore((s) => s.fetchRoutes);

    useEffect(() => {
        if (expand) {
            const el = gridRef.current;
            const handler = (e: TransitionEvent) => {
                if (e.propertyName === 'grid-template-rows') {
                    setAllowOverflow(true);
                    el?.removeEventListener('transitionend', handler);
                }
            };
            el?.addEventListener('transitionend', handler);
            return () => el?.removeEventListener('transitionend', handler);
        } else {
            setAllowOverflow(false);
        }
    }, [expand]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (headerRef.current?.contains(e.target as Node)) {
                setExpand(true);
            } else {
                setExpand(false);
            }
        };

        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    return (
        <header ref={headerRef} className="flex md:items-center justify-between p-3 bg-white border-b shadow-md sticky top-0 z-10">
            <img src="/logo.png" alt="SafeWay" className="w-12 h-12 rounded-full" />

            <div className="flex flex-col md:flex-row flex-1 max-w-3xl mx-3 md:mx-8 gap-3">
                <StreetInput
                    placeholder="Starting point (Sofia)..."
                    value={startLabel}
                    onSelect={(lat, lng, label) => setStart({ lat, lng }, label)}
                    onChange={(text) => setStart({}, text)}
                />

                <div
                    ref={gridRef}
                    className={clsx(
                        'grid transition-[grid-template-rows] duration-300',
                        expand ? 'grid-rows-[1fr]' : 'grid-rows-[0fr] md:grid-rows-[1fr]'
                    )}
                >
                    <div className={clsx(
                        'min-h-0 flex flex-col md:flex-row gap-3',
                        !allowOverflow && 'overflow-hidden',
                        'md:overflow-visible'
                    )}>
                        <StreetInput
                            placeholder="Destination..."
                            value={endLabel}
                            onSelect={(lat, lng, label) => setEnd({ lat, lng }, label)}
                            onChange={(text) => setEnd({}, text)}
                        />

                        <button
                            onClick={fetchRoutes}
                            className="px-8 py-2 bg-primary text-white font-bold rounded-full hover:bg-primary-hover shadow-lg active:scale-95 cursor-pointer transition-all disabled:cursor-not-allowed disabled:opacity-70"
                            disabled={!start?.lng || !end?.lng}
                        >
                            Go!
                        </button>
                    </div>
                </div>
            </div>

        </header>
    );
};
