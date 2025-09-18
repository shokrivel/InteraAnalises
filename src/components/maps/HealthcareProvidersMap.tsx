import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HealthcareProvidersMapProps {
  userAddress?: string;
  keyword?: string;
  onClose?: () => void;
}

const HealthcareProvidersMap = ({ userAddress, keyword, onClose }: HealthcareProvidersMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [places, setPlaces] = useState<any[]>([]);
  const [map, setMap] = useState<google.maps.Map>();

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries: ["places"],
      });

      const google = await loader.load();

      const defaultLocation = { lat: -23.5505, lng: -46.6333 }; // fallback SP
      const mapInstance = new google.maps.Map(mapRef.current as HTMLElement, {
        center: defaultLocation,
        zoom: 13,
      });
      setMap(mapInstance);

      const service = new google.maps.places.PlacesService(mapInstance);

      const searchKeyword = keyword || "clínico geral";

      const request: google.maps.places.PlaceSearchRequest = {
        location: defaultLocation,
        radius: 5000,
        keyword: searchKeyword,
      };

      service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const sorted = [...results].sort((a, b) => (b.rating || 0) - (a.rating || 0));
          setPlaces(sorted);

          sorted.forEach((place) => {
            if (place.geometry?.location) {
              new google.maps.Marker({
                position: place.geometry.location,
                map: mapInstance,
                title: place.name,
              });
            }
          });
        }
      });
    };

    initMap();
  }, [keyword, userAddress]);

  return (
    <div className="space-y-4">
      <div ref={mapRef} className="w-full h-96 rounded-lg border" />
      <div className="grid gap-3 sm:grid-cols-2">
        {places.length > 0 ? (
          places.map((place, idx) => (
            <Card key={idx} className="shadow-sm">
              <CardHeader>
                <CardTitle>{place.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{place.vicinity}</p>
                <p className="text-sm text-muted-foreground">
                  ⭐ {place.rating || "Sem avaliação"}
                </p>
                <button
                  className="mt-2 text-primary underline"
                  onClick={() =>
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.name + " " + place.vicinity)}`, "_blank")
                  }
                >
                  Iniciar rota
                </button>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-center text-muted-foreground">Nenhum especialista encontrado.</p>
        )}
      </div>
    </div>
  );
};

export default HealthcareProvidersMap;
