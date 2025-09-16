import { useEffect, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { createClient } from "@supabase/supabase-js";

interface HealthcareProvidersMapProps {
  userAddress?: string;
  symptoms: string;
  onClose: () => void;
}

interface Provider {
  name: string;
  specialty: string;
  address: string;
  rating?: number;
  userRatingsTotal?: number;
  location?: { lat: number; lng: number };
  distance?: number;
}

export default function HealthcareProvidersMap({ userAddress, symptoms }: HealthcareProvidersMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [justification, setJustification] = useState<string>("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sortOption, setSortOption] = useState<"rating" | "distance">("rating");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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
        center: { lat: -23.55052, lng: -46.633308 },
        zoom: 13,
      });

      const geocoder = new google.maps.Geocoder();

      async function fetchProviders(address: string, specialty: string, justification: string) {
        try {
          const { data, error } = await supabase.functions.invoke("find-healthcare-providers", {
            body: { address, keyword: specialty }
          });

          if (error) {
            console.error("Erro Supabase:", error);
            return;
          }

          let sortedProviders: Provider[] = (data.providers || []).sort((a: Provider, b: Provider) => (b.rating || 0) - (a.rating || 0));

          if (userLocation) {
            sortedProviders = sortedProviders.map((prov) => {
              if (prov.location) {
                const R = 6371;
                const dLat = (prov.location.lat - userLocation.lat) * Math.PI / 180;
                const dLng = (prov.location.lng - userLocation.lng) * Math.PI / 180;
                const a = Math.sin(dLat/2)**2 + Math.cos(userLocation.lat*Math.PI/180) * Math.cos(prov.location.lat*Math.PI/180) * Math.sin(dLng/2)**2;
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                const distance = R * c;
                return { ...prov, distance: parseFloat(distance.toFixed(2)) };
              }
              return prov;
            });
          }

          setProviders(sortedProviders);
          setJustification(justification);

          sortedProviders.forEach((prov) => {
            if (prov.location) {
              new google.maps.Marker({
                map,
                position: { lat: prov.location.lat, lng: prov.location.lng },
                title: prov.name,
              });
            }
          });

        } catch (err) {
          console.error("Erro ao buscar provedores:", err);
        }
      }

      if (userAddress) {
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

            const aiResult = await aiAnalyzeSymptoms(symptoms);
            const suggestedSpecialty = aiResult.suggestedSpecialty;
            const aiJustification = aiResult.justification;

            fetchProviders(userAddress, suggestedSpecialty, aiJustification);
          }
        });
      }
    }

  }, [userAddress, symptoms, supabase]);

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

  // Ordenação dinâmica
  let sortedProviders = [...providers];
  if (sortOption === "distance") {
    sortedProviders.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
  } else {
    sortedProviders.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  if (sortedProviders.length === 0) {
    return <div ref={mapRef} style={{ width: "100%", height: "400px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />;
  }

  const [topProvider, ...otherProviders] = sortedProviders;

  // Identificar melhores para destaque UX
  const bestRated = otherProviders.reduce((prev, curr) => (curr.rating! > (prev.rating || 0) ? curr : prev), otherProviders[0]);
  const closest = otherProviders.reduce((prev, curr) => (curr.distance! < (prev.distance || Infinity) ? curr : prev), otherProviders[0]);

  return (
    <div>
      <div ref={mapRef} style={{ width: "100%", height: "400px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />

      {/* Filtro de ordenação */}
      <div className="mt-4 flex gap-2 items-center">
        <label htmlFor="sort" className="font-medium">Ordenar por:</label>
        <select
          id="sort"
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value as "rating" | "distance")}
          className="border rounded px-2 py-1"
        >
          <option value="rating">Melhor avaliação</option>
          <option value="distance">Mais próximo</option>
        </select>
      </div>

      {/* Top recomendado */}
      <div className="mt-4 p-4 rounded-lg bg-blue-700 text-white shadow-md flex flex-col gap-2">
        <h3 className="font-bold text-lg">Top Recomendado</h3>
        <p>{topProvider.name} ({topProvider.specialty})</p>
        <p>⭐ {topProvider.rating} ({topProvider.userRatingsTotal} avaliações)</p>
        {topProvider.distance && <p className="text-sm">Distância: {topProvider.distance} km</p>}
        {justification && <p className="text-sm italic">{justification}</p>}
        <button
          className="mt-2 bg-white text-blue-700 font-semibold px-3 py-1 rounded hover:bg-gray-200 transition"
          onClick={() => handleRouteClick(topProvider)}
        >
          Traçar rota
        </button>
      </div>

      {/* Outros provedores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {otherProviders.map((prov, idx) => {
          let bgClass = "bg-white";
          if (prov === bestRated) bgClass = "bg-green-100";
          if (prov === closest) bgClass = "bg-yellow-100";

          return (
            <Card key={idx} className={`${bgClass} border shadow-sm hover:shadow-md transition-all`}>
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
                {justification && <p className="text-sm text-gray-500 italic mt-1">{justification}</p>}
                <button
                  className="mt-2 bg-blue-700 text-white font-semibold px-3 py-1 rounded hover:bg-blue-800 transition"
                  onClick={() => handleRouteClick(prov)}
                >
                  Traçar rota
                </button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
