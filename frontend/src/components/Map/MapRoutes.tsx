import { GeoJSON } from 'react-leaflet';
import { useStore } from '../../store/useStore';

export const MapRoutes = () => {
    const response = useStore((s) => s.response);
    const currentVariant = useStore((s) => s.currentVariant);

    const routeGeometry = response?.[currentVariant]?.geometry ?? null;

    return (
        <>
            {routeGeometry && (
                <GeoJSON
                    key={`${currentVariant}-${JSON.stringify(routeGeometry.coordinates.slice(0, 2))}`}
                    data={routeGeometry as GeoJSON.GeoJsonObject}
                    style={{ color: 'blue', weight: 5 }}
                />
            )}
        </>
    );
}