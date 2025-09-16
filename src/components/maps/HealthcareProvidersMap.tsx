import { useEffect, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface HealthcareProvidersMapProps {
  userAddress?: string;
  onClose: () => void;
}

export default function HealthcareProvidersMap({ userAddress }: HealthcareProvidersMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [providers, setProviders] = useState<any[]>([]);

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

      async function fetchProviders(address: string) {
        try {
          const res = await fetch('/api/find-healthcare-providers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, keyword: "..." }) // ajuste o keyword conforme necessário
          });
          const data = await res.json();
          if (data?.providers) setProviders(data.providers);
        } catch (error) {
          console.error("Erro ao buscar provedores:", error);
        }
      }

      if (userAddress) {
        geocoder.geocode({ address: userAddress }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            map.setCenter(results[0].geometry.location);
            new google.maps.Marker({
              map,
              position: results[0].geometry.location,
              title: "Sua localização",
            });

            // Buscar provedores a partir do endereço
            fetchProviders(userAddress);
          }
        });
      }
    }
  }, [userAddress]);

  return (
    <div>
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "400px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      />

      {providers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {providers.map((prov, idx) => (
            <Card key={idx} className="border">
              <CardHeader>
                <CardTitle>{prov.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{prov.specialty}</p>
              </CardHeader>
              <CardContent>
                <p>{prov.address}</p>
                {prov.rating && (
                  <p className="mt-2">⭐ {prov.rating} ({prov.userRatingsTotal} avaliações)</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
