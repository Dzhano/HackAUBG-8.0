import { GeoJSON } from 'react-leaflet';
import { useStore, Variant } from '../../store/useStore';

const ROUTE_COLORS: Record<Variant, string> = {
    shortest: 'red',
    current: 'blue',
    safest: 'green',
};

export const MapRoutes = () => {
    const response = useStore((s) => s.response);
    const currentVariant = useStore((s) => s.currentVariant);

    if (!response) return null;

    const variants: Variant[] = ['shortest', 'current', 'safest'];

    return (
        <>
            {variants.map((variant) => {
                const route = response[variant];
                if (!route?.geometry) return null;

                const isSelected = variant === currentVariant;

                return (
                    <GeoJSON
                        key={`${variant}-${JSON.stringify(route.geometry.coordinates.slice(0, 2))}`}
                        data={route.geometry as GeoJSON.GeoJsonObject}
                        style={{
                            color: ROUTE_COLORS[variant],
                            weight: isSelected ? 7 : 4,
                            opacity: isSelected ? 1 : 0.6,
                        }}
                    />
                );
            })}
        </>
    );
};