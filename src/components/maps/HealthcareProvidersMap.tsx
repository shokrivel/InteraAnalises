import { useEffect, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Provider {
  name: string;
  specialty: string;
  address: string;
  rating?: number;
  userRatingsTotal?: number;
  location?: { lat: number; lng: number };
  distance?: number;
}

interface HealthcareProvidersMapProps {
  userAddress?: string;
  keyword?: string; // ← especialidade ou keyword inferida pela IA
  onClose: () => void;
}

export default function HealthcareProvidersMap({ userAddress, keyword, onClose }: HealthcareProvidersMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places`;
      script.async = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }

    async function initMap() {
      if (!mapRef.current) return;

      const map = new google.maps.Map(mapRef.current, {
        center: { lat: -23.55052, lng: -46.633308 }, // fallback São Paulo
        zoom: 13,
      });

      const geocoder = new google.maps.Geocoder();

      if (!userAddress) return;

      geocoder.geocode({ address: userAddress }, async (results, status) => {
        if (status === "OK" && results && results[0]) {
          const location = results[0].geometry.location;
          const userLoc = { lat: location.lat(), lng: location.lng() };
          setUserLocation(userLoc);

          map.setCenter(location);
          new google.maps.Marker({
            map,
            position: location,
            title: "Sua localização",
            icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
          });

          if (keyword) {
            await fetchProviders(map, userLoc, keyword);
          }
        }
      });
    }

    async function fetchProviders(map: google.maps.Map, location: { lat: number; lng: number }, keyword: string) {
      try {
        setLoading(true);

        const res = await fetch("/.netlify/functions/find-healthcare-providers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: userAddress, lat: location.lat, lng: location.lng, keyword }),
        });

        const data = await res.json();
        if (!data.providers) return;

        const providersWithDistance = data.providers.map((prov: Provider) => {
          if (prov.location) {
            const R = 6371; // km
            const dLat = (prov.location.lat - location.lat) * Math.PI / 180;
            const dLng = (prov.location.lng - location.lng) * Math.PI / 180;
            const a = Math.sin(dLat/2)**2 + Math.cos(location.lat*Math.PI/180) * Math.cos(prov.location.lat*Math.PI/180) * Math.sin(dLng/2)**2;
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const distance = R * c;
            return { ...prov, distance: parseFloat(distance.toFixed(2)) };
          }
          return prov;
        });

        // Marcar todos os provedores no mapa
        providersWithDistance.forEach((prov: Provider) => {
          if (prov.location) {
            new google.maps.Marker({
              map,
              position: { lat: prov.location.lat, lng: prov.location.lng },
              title: prov.name,
            });
          }
        });

        setProviders(providersWithDistance);
      } catch (err) {
        console.error("Erro ao buscar provedores:", err);
      } finally {
        setLoading(false);
      }
    }
  }, [userAddress, keyword]);

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    const fullStars = Math.floor(rating);
    const halfStar = rating - fullStars >= 0.5;
    return Array.from({ length: 5 }, (_, i) => {
      if (i < fullStars) return <span key={i} className="text-yellow-500">★</span>;
      if (i === fullStars && halfStar) return <span key={i} className="text-yellow-500">☆</span>;
      return <span key={i} className="text-gray-300">★</span>;
    });
  };

  const handleRouteClick = (prov: Provider) => {
    if (!userLocation || !prov.location) return;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${prov.location.lat},${prov.location.lng}`;
    window.open(url, "_blank");
  };

  if (!userAddress) return <p>Endereço não fornecido.</p>;

  return (
    <div className="space-y-4">
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "400px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      />
      {loading && <p>Carregando provedores...</p>}
      {providers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {providers.map((prov, idx) => (
            <Card key={idx} className="border shadow-sm hover:shadow-md transition-all">
              <CardHeader className="flex flex-col gap-1">
                <CardTitle>{prov.name}</CardTitle>
                <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  {prov.specialty}
                </span>
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                <p>{prov.address}</p>
                {prov.rating && <p className="flex items-center gap-1">{renderStars(prov.rating)} ({prov.userRatingsTotal} avaliações)</p>}
                {prov.distance && <p className="text-sm text-gray-600">Distância: {prov.distance} km</p>}
                <button
                  className="mt-2 bg-blue-700 text-white font-semibold px-3 py-1 rounded hover:bg-blue-800 transition"
                  onClick={() => handleRouteClick(prov)}
                >
                  Traçar rota
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
