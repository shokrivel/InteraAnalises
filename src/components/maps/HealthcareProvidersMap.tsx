import { useEffect, useRef } from "react";

interface HealthcareProvidersMapProps {
  userAddress?: string;
  onClose: () => void;
}

export default function HealthcareProvidersMap({ userAddress }: HealthcareProvidersMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Carregar script do Google Maps
    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places`;
      script.async = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }

    function initMap() {
      if (!mapRef.current) return;

      const map = new google.maps.Map(mapRef.current, {
        center: { lat: -23.55052, lng: -46.633308 }, // fallback: São Paulo
        zoom: 13,
      });

      const geocoder = new google.maps.Geocoder();

      if (userAddress) {
        geocoder.geocode({ address: userAddress }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            map.setCenter(results[0].geometry.location);
            new google.maps.Marker({
              map,
              position: results[0].geometry.location,
              title: "Sua localização",
            });
          }
        });
      }
    }
  }, [userAddress]);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "400px",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    />
  );
}
