import { useMemo, useRef } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

const markerIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

interface DraggableMarkerProps {
    position: [number, number];
    label: string;
    onDragEnd: (lat: number, lng: number) => void;
}

export const DraggableMarker = ({ position, label, onDragEnd }: DraggableMarkerProps) => {
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
            icon={markerIcon}
            ref={markerRef}
            eventHandlers={eventHandlers}
        >
            <Popup>{label}</Popup>
        </Marker>
    );
};