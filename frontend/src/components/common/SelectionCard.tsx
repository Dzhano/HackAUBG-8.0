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

    return (
        <div
            onClick={onClick}
            className={`flex md:flex-col items-center md:items-start rounded-2xl border-2 transition-all p-2 md:p-5 cursor-pointer transform md:hover:-translate-y-1 ${
                selected ? styles.active : 'border-gray-100 bg-white shadow-sm'
            }`}
        >
            <div className="flex items-center gap-2 md:gap-3">
                <div className={`p-2 rounded-lg ${styles.iconBg}`}>{icon}</div>
                <h3 className="font-bold text-sm md:text-lg uppercase">{title}</h3>
            </div>
            <p className="text-sm text-gray-500 md:mt-2 italic ml-auto md:ml-0">{description}</p>
        </div>
    );
};
