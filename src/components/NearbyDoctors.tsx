import React, { useEffect, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";

interface NearbyDoctorsProps {
  consultationResponse: string;
}

export default function NearbyDoctors({ consultationResponse }: NearbyDoctorsProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Solicita permissão de localização
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          console.error("Erro ao obter localização:", err);
          setError("Não foi possível acessar sua localização.");
        }
      );
    } else {
      setError("Geolocalização não é suportada pelo navegador.");
    }
  }, []);

  // Carrega o Google Maps
  useEffect(() => {
    if (!location) return;

    const loader = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["places"],
    });

    loader.load().then(() => {
      const mapElement = document.getElementById("map") as HTMLElement;
      if (!mapElement) return;

      const mapInstance = new google.maps.Map(mapElement, {
        center: location,
        zoom: 14,
      });
      setMap(mapInstance);

      // Busca médicos próximos
      const service = new google.maps.places.PlacesService(mapInstance);

      const request: google.maps.places.PlaceSearchRequest = {
        location,
        radius: 3000, // 3km de raio
        keyword: `médico ${consultationResponse}`, // filtro pelo prognóstico
      };

      service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          results.forEach((place) => {
            if (place.geometry && place.geometry.location) {
              new google.maps.Marker({
                position: place.geometry.location,
                map: mapInstance,
                title: place.name,
              });
            }
          });
        } else {
          setError("Erro ao buscar os profissionais de saúde");
        }
      });
    });
  }, [location, consultationResponse]);

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold">Profissionais de Saúde Recomendados</h2>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {!location && !error && <p>Carregando localização...</p>}
      <div id="map" className="w-full h-96 mt-4 rounded border" />
    </div>
  );
}
