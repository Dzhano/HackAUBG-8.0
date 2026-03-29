import { useMemo, useRef } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

const SHADOW_URL = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const blueIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: SHADOW_URL,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: SHADOW_URL,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

interface DraggableMarkerProps {
    position: [number, number];
    label: string;
    color?: 'blue' | 'red';
    onDragEnd: (lat: number, lng: number) => void;
}

export const DraggableMarker = ({ position, label, color = 'blue', onDragEnd }: DraggableMarkerProps) => {
    const markerRef = useRef<L.Marker>(null);

    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker) {
                    const { lat, lng } = marker.getLatLng();
                    onDragEnd(lat, lng);
                }
            },
        }),
        [onDragEnd],
    );

    return (
        <Marker
            draggable
            position={position}
            icon={color === 'red' ? redIcon : blueIcon}
            ref={markerRef}
            eventHandlers={eventHandlers}
        >
            <Popup>{label}</Popup>
        </Marker>
    );
};