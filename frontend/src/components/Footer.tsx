import { Zap, Scale, ShieldCheck } from 'lucide-react';
import { SelectionCard } from './common/SelectionCard';
import { RouteResponse, SingleRoute, useStore } from '../store/useStore';

function cardLabel(route: SingleRoute | undefined, shortest: SingleRoute | undefined) {
    if (!route) {
        return '';
    }

    const km = (route.distance_m / 1000).toFixed(2);

    // Calculate % safer compared to shortest
    if (shortest && shortest.total_accidents > 0) {
        const saferPercent = ((shortest.total_accidents - route.total_accidents) / shortest.total_accidents * 100).toFixed(1);
        return `${saferPercent}% safer · ${km} km`;
    }

    return `${route.total_accidents} accidents · ${km} km`;
}

function shortestLabel(route: SingleRoute | undefined) {
    if (!route) return '';
    const km = (route.distance_m / 1000).toFixed(2);
    return `baseline · ${km} km`;
}

export const Footer = () => {
    const variant = useStore((s) => s.currentVariant);
    const setVariant = useStore((s) => s.setCurrentVariant);
    const response = useStore((s) => s.response);

    return (
        <footer className="p-6 bg-white border-t border-gray-200">
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                <SelectionCard
                    variant="shortest"
                    icon={<Zap className="w-6 h-6" />}
                    title="Shortest"
                    description={ response?.shortest ? shortestLabel(response.shortest) : '' }
                    selected={variant === 'shortest'}
                    onClick={() => setVariant('shortest')}
                />

                <SelectionCard
                    variant="current"
                    icon={<Scale className="w-6 h-6" />}
                    title="Current"
                    description={ response?.current ? cardLabel(response.current, response.shortest) : '' }
                    selected={variant === 'current'}
                    onClick={() => setVariant('current')}
                />

                <SelectionCard
                    variant="safest"
                    icon={<ShieldCheck className="w-6 h-6" />}
                    title="Safest"
                    description={ response?.safest ? cardLabel(response.safest, response.shortest) : '' }
                    selected={variant === 'safest'}
                    onClick={() => setVariant('safest')}
                />
            </div>
        </footer>
    );
};
