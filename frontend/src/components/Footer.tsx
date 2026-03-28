import { Zap, Scale, ShieldCheck } from 'lucide-react';
import { SelectionCard } from './common/SelectionCard';
import { SingleRoute, useStore } from '../store/useStore';

function cardLabel(response?: SingleRoute) {
    if (!response) {
        return '';
    }

    return `${response.total_accidents} accidents ${(response.distance_m / 1000).toFixed(2)} km`;
}

export const Footer = () => {
    const variant = useStore((s) => s.currentVariant);
    const setVariant = useStore((s) => s.setCurrentVariant);
    const response = useStore((s) => s.response);   

    return (
        <footer className="p-6 bg-white border-t border-gray-200">
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                <SelectionCard
                    variant="current"
                    icon={<Zap className="w-6 h-6" />}
                    title="Current"
                    description={ response?.shortest ? cardLabel(response.shortest) : 'Loading...' }
                    selected={variant === 'current'}
                    onClick={() => setVariant('current')}
                />

                <SelectionCard
                    variant="shortest"
                    icon={<Scale className="w-6 h-6" />}
                    title="Shortest"
                    description={ response?.shortest ? cardLabel(response.shortest) : 'Loading...' }
                    selected={variant === 'shortest'}
                    onClick={() => setVariant('shortest')}
                />

                <SelectionCard
                    variant="safest"
                    icon={<ShieldCheck className="w-6 h-6" />}
                    title="Longest"
                    description={ response?.safest ? cardLabel(response.safest) : 'Loading...' }
                    selected={variant === 'safest'}
                    onClick={() => setVariant('safest')}
                />
            </div>
        </footer>
    );
};
