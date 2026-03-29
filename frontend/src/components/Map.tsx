import { useCallback } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { useStore } from '../store/useStore';
import { DraggableMarker } from './Map/DraggableMarker';
import { MapRoutes } from './Map/MapRoutes';
import { TrafficIncidents } from './Map/TrafficIncidents';
import 'leaflet/dist/leaflet.css';

function MapCenterTracker() {
    const setMapCenter = useStore((s) => s.setMapCenter);
    useMapEvents({
        moveend(e) {
            const { lat, lng } = e.target.getCenter();
            setMapCenter(lat, lng);
        },
    });
    return null;
}

const SOFIA_CENTER: [number, number] = [42.6977, 23.3219];
const PHOTON_REVERSE = 'https://photon.komoot.io/reverse';

async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
        const params = new URLSearchParams({ lat: String(lat), lon: String(lng), limit: '1' });
        const res = await fetch(`${PHOTON_REVERSE}?${params}`);
        const data = await res.json();
        const p = data.features?.[0]?.properties;
        if (!p) return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        const parts: string[] = [];
        if (p.name && p.name !== p.street) parts.push(p.name);
        if (p.street) parts.push(p.housenumber ? `${p.street} ${p.housenumber}` : p.street);
        if (p.city) parts.push(p.city);
        return parts.join(', ') || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch {
        return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
}

export const Map = () => {
    const start = useStore((s) => s.start);
    const end = useStore((s) => s.end);
    const setStart = useStore((s) => s.setStart);
    const setEnd = useStore((s) => s.setEnd);
    const fetchRoutes = useStore((s) => s.fetchRoutes);

    const handleStartDrag = useCallback(
        (lat: number, lng: number) => {
            setStart({ lat, lng }, `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
            reverseGeocode(lat, lng).then((label) => {
                setStart({ lat, lng }, label);
                const { end } = useStore.getState();
                if (end.lat != null && end.lng != null) fetchRoutes();
            });
        },
        [setStart, fetchRoutes],
    );

    const handleEndDrag = useCallback(
        (lat: number, lng: number) => {
            setEnd({ lat, lng }, `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
            reverseGeocode(lat, lng).then((label) => {
                setEnd({ lat, lng }, label);
                const { start } = useStore.getState();
                if (start.lat != null && start.lng != null) fetchRoutes();
            });
        },
        [setEnd, fetchRoutes],
    );

    return (
        <main className="grow relative">
            <MapContainer
                center={SOFIA_CENTER}
                zoom={13}
                className="absolute inset-0 z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapCenterTracker />

                {start.lat != null && start.lng != null && (
                    <DraggableMarker
                        position={[start.lat, start.lng]}
                        label={'Start'}
                        onDragEnd={handleStartDrag}
                    />
                )}

                {end.lat != null && end.lng != null && (
                    <DraggableMarker
                        position={[end.lat, end.lng]}
                        label={'End'}
                        color="red"
                        onDragEnd={handleEndDrag}
                    />
                )}

                <MapRoutes />
                <TrafficIncidents />
            </MapContainer>
        </main>
    );
};
