import { useCallback } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useStore } from '../store/useStore';
import { DraggableMarker } from './Map/DraggableMarker';
import { MapRoutes } from './Map/MapRoutes';
import 'leaflet/dist/leaflet.css';

const SOFIA_CENTER: [number, number] = [42.6977, 23.3219];

export const Map = () => {
    const start = useStore((s) => s.start);
    const end = useStore((s) => s.end);
    const setStart = useStore((s) => s.setStart);
    const setEnd = useStore((s) => s.setEnd);

    const handleStartDrag = useCallback(
        (lat: number, lng: number) => setStart({ lat, lng }),
        [setStart],
    );

    const handleEndDrag = useCallback(
        (lat: number, lng: number) => setEnd({ lat, lng }),
        [setEnd],
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
                        onDragEnd={handleEndDrag}
                    />
                )}

                <MapRoutes />
            </MapContainer>
        </main>
    );
};
