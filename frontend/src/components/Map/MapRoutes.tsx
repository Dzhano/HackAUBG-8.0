import { useMap } from 'react-leaflet';
import { useStore, Variant } from '../../store/useStore';
import { useEffect, useRef } from 'react';
import L from 'leaflet';

const ROUTE_COLORS: Record<Variant, string> = {
    shortest: 'red',
    current: 'blue',
    safest: 'green',
};

export const MapRoutes = () => {
    const map = useMap();
    const response = useStore((s) => s.response);
    const currentVariant = useStore((s) => s.currentVariant);
    const layersRef = useRef<L.GeoJSON[]>([]);

    // Clear and redraw routes when response or selection changes
    useEffect(() => {
        // Clear all old layers first
        layersRef.current.forEach((layer) => {
            if (map.hasLayer(layer)) {
                map.removeLayer(layer);
            }
        });
        layersRef.current = [];

        if (!response) return;

        const variants: Variant[] = ['shortest', 'current', 'safest'];

        // Draw non-selected routes first (so they're behind)
        variants
            .filter((v) => v !== currentVariant)
            .forEach((variant) => {
                const route = response[variant];
                if (!route?.geometry) return;

                const layer = L.geoJSON(route.geometry as GeoJSON.GeoJsonObject, {
                    style: {
                        color: ROUTE_COLORS[variant],
                        weight: 4,
                        opacity: 0.6,
                    },
                });

                layer.addTo(map);
                layersRef.current.push(layer);
            });

        // Draw selected route last (on top)
        const selectedRoute = response[currentVariant];
        if (selectedRoute?.geometry) {
            const selectedLayer = L.geoJSON(selectedRoute.geometry as GeoJSON.GeoJsonObject, {
                style: {
                    color: ROUTE_COLORS[currentVariant],
                    weight: 7,
                    opacity: 1,
                },
            });

            selectedLayer.addTo(map);
            layersRef.current.push(selectedLayer);
        }

        // Cleanup on unmount
        return () => {
            layersRef.current.forEach((layer) => {
                if (map.hasLayer(layer)) {
                    map.removeLayer(layer);
                }
            });
        };
    }, [map, response, currentVariant]);

    return null;
};