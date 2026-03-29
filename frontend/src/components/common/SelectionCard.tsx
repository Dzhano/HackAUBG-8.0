import { ReactNode } from 'react';

type Variant = 'current' | 'shortest' | 'safest';

type Props = {
    icon: ReactNode;
    title: string;
    description: string;
    selected?: boolean;
    variant: Variant;
    onClick: () => void;
};

const variantStyles: Record<Variant, { active: string; iconBg: string }> = {
    shortest: {
        active: 'border-orange-500 bg-orange-50 ring-2 ring-orange-200 shadow-xl',
        iconBg: 'bg-orange-100 text-orange-600',
    },
    current : {
        active: 'border-blue-500 bg-blue-50 ring-2 ring-blue-200 shadow-xl',
        iconBg: 'bg-blue-100 text-blue-600',
    },
    safest: {
        active: 'border-green-500 bg-green-50 ring-2 ring-green-200 shadow-xl',
        iconBg: 'bg-green-100 text-green-600',
    },
};

export const SelectionCard = ({ icon, title, description, selected = false, variant, onClick }: Props) => {
    const styles = variantStyles[variant];
    const [stat, km] = description.split(' · ');

    return (
        <div
            onClick={onClick}
            className={`p-2 md:p-5 rounded-xl md:rounded-2xl border-2 transition-all cursor-pointer transform hover:-translate-y-1 ${
                selected ? styles.active : 'border-gray-100 bg-white shadow-sm'
            }`}
        >
            <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3">
                <div className={`p-1 md:p-2 rounded-lg ${styles.iconBg}`}>
                    <span className="block md:hidden [&>svg]:w-4 [&>svg]:h-4">{icon}</span>
                    <span className="hidden md:block">{icon}</span>
                </div>
                <h3 className="font-bold text-xs md:text-lg uppercase text-center md:text-left">{title}</h3>
            </div>

            {/* Mobile: centered, km on new line */}
            <div className="block md:hidden text-center mt-1">
                <p className="text-xs text-gray-500 italic">{stat}</p>
                {km && <p className="text-xs text-gray-500 italic">{km}</p>}
            </div>

            {/* Desktop: single line */}
            <p className="hidden md:block text-sm text-gray-500 mt-2 italic">{description}</p>
        </div>
    );
};
