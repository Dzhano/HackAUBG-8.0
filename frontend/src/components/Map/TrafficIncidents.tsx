import { useMap, useMapEvents } from 'react-leaflet';
import { useStore } from '../../store/useStore';
import { useEffect, useRef } from 'react';
import L from 'leaflet';

const INCIDENT_COLORS: Record<string, string> = {
    road_closed: '#ff0000',
    accident: '#ff4444',
    road_works: '#ff8800',
    congestion: '#ffaa00',
    dangerous: '#ff6600',
    broken_vehicle: '#ff9999',
    fog: '#888888',
    unknown: '#666666',
    other: '#666666',
};

export const TrafficIncidents = () => {
    const map = useMap();
    const incidents = useStore((s) => s.incidents);
    const fetchIncidents = useStore((s) => s.fetchIncidents);
    const layersRef = useRef<L.GeoJSON[]>([]);

    // Fetch incidents when map moves
    useMapEvents({
        moveend: () => {
            const bounds = map.getBounds();
            fetchIncidents({
                minLat: bounds.getSouth(),
                minLng: bounds.getWest(),
                maxLat: bounds.getNorth(),
                maxLng: bounds.getEast(),
            });
        },
    });

    // Initial fetch
    useEffect(() => {
        const bounds = map.getBounds();
        fetchIncidents({
            minLat: bounds.getSouth(),
            minLng: bounds.getWest(),
            maxLat: bounds.getNorth(),
            maxLng: bounds.getEast(),
        });
    }, [map, fetchIncidents]);

    // Draw incidents
    useEffect(() => {
        // Clear old layers
        layersRef.current.forEach((layer) => {
            if (map.hasLayer(layer)) {
                map.removeLayer(layer);
            }
        });
        layersRef.current = [];

        incidents.forEach((incident) => {
            if (!incident.geometry?.coordinates?.length) return;

            const color = INCIDENT_COLORS[incident.category] || INCIDENT_COLORS.other;

            try {
                const layer = L.geoJSON(incident.geometry as GeoJSON.GeoJsonObject, {
                    style: {
                        color: color,
                        weight: 6,
                        opacity: 0.8,
                        dashArray: incident.category === 'road_closed' ? '10, 10' : undefined,
                    },
                });

                layer.bindPopup(`
                    <strong>${incident.category.replace('_', ' ').toUpperCase()}</strong><br/>
                    ${incident.from} → ${incident.to}<br/>
                    ${incident.description}
                    ${incident.delay ? `<br/>Delay: ${Math.round(incident.delay / 60)} min` : ''}
                `);

                layer.addTo(map);
                layersRef.current.push(layer);
            } catch (e) {
                // Skip invalid geometries
            }
        });

        return () => {
            layersRef.current.forEach((layer) => {
                if (map.hasLayer(layer)) {
                    map.removeLayer(layer);
                }
            });
        };
    }, [map, incidents]);

    return null;
};