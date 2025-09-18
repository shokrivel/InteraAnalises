// src/components/maps/HealthcareProvidersMap.tsx
import React, { useEffect, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Provider = {
  name: string;
  specialty?: string;
  address?: string;
  rating?: number | null;
  userRatingsTotal?: number;
  location?: { lat: number; lng: number } | null;
  placeId?: string;
  distance?: number | null; // km
};

type Props = {
  userAddress?: string;
  providers?: Provider[]; // se já vierem do backend
  specialties?: string[]; // se quiser buscar via specialties (fallback/híbrido)
  onClose?: () => void;
};

export default function HealthcareProvidersMap({ userAddress, providers: initialProviders, specialties = [], onClose }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [providers, setProviders] = useState<Provider[]>(initialProviders || []);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortOption, setSortOption] = useState<"distance" | "rating">("distance");

  // monta mapa e markers
  useEffect(() => {
    const loadGoogle = () => {
      if ((window as any).google) {
        initMap();
      } else {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places,geometry`;
        script.async = true;
        script.onload = initMap;
        document.head.appendChild(script);
      }
    };

    function initMap() {
      if (!mapRef.current) return;
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: -23.55052, lng: -46.633308 },
        zoom: 13,
      });

      // geocode do endereço do usuário
      if (userAddress) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: userAddress }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            const loc = results[0].geometry.location;
            const u = { lat: loc.lat(), lng: loc.lng() };
            setUserLocation(u);
            map.setCenter(loc);
            new google.maps.Marker({ map, position: loc, title: "Sua localização", icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" });

            // desenha markers dos providers se já existirem
            (initialProviders || providers).forEach(p => {
              if (p.location) {
                new google.maps.Marker({ map, position: { lat: p.location.lat, lng: p.location.lng }, title: p.name });
              }
            });
          }
        });
      } else {
        (initialProviders || providers).forEach(p => {
          if (p.location) {
            new google.maps.Marker({ map, position: { lat: p.location.lat, lng: p.location.lng }, title: p.name });
          }
        });
      }
    }

    loadGoogle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // atualizar providers se vieram via prop
  useEffect(() => {
    if (initialProviders && initialProviders.length) setProviders(initialProviders);
  }, [initialProviders]);

  // fallback: se não vieram providers e specialties existem, buscar via função find-healthcare-providers
  useEffect(() => {
    const fetchBySpecialties = async () => {
      if ((providers && providers.length > 0) || !specialties || specialties.length === 0 || !userAddress) return;
      setLoading(true);
      try {
        const allFound: Provider[] = [];
        for (const s of specialties) {
          const res = await fetch("/.netlify/functions/find-healthcare-providers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: userAddress, keyword: s, radius: radiusKm * 1000 })
          });
          const data = await res.json();
          (data.providers || []).forEach((p: any) => {
            if (!allFound.some((f) => f.placeId === p.placeId)) allFound.push(p);
          });
        }
        setProviders(allFound);
      } catch (e) {
        console.error("Erro buscando providers por specialties:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchBySpecialties();
  }, [specialties, userAddress, providers, radiusKm]);

  // filtros & ordenação
  const displayed = providers
    .filter(p => (minRating ? (p.rating || 0) >= minRating : true))
    .slice();

  if (sortOption === "distance") {
    displayed.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  } else {
    displayed.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }

  const top = displayed[0];

  const handleRouteClick = (p: Provider) => {
    if (!userLocation || !p.location) return;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${p.location.lat},${p.location.lng}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-4">
      <div ref={mapRef} style={{ width: "100%", height: 400, borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />

      <div className="flex gap-3 items-center">
        <label className="font-medium">Raio:</label>
        <select value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} className="border rounded px-2 py-1">
          <option value={2}>2 km</option>
          <option value={5}>5 km</option>
          <option value={10}>10 km</option>
          <option value={20}>20 km</option>
        </select>

        <label className="font-medium">Avaliação mínima:</label>
        <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} className="border rounded px-2 py-1">
          <option value={0}>Qualquer</option>
          <option value={3}>≥ 3.0</option>
          <option value={4}>≥ 4.0</option>
          <option value={4.5}>≥ 4.5</option>
        </select>

        <label className="font-medium">Ordenar por:</label>
        <select value={sortOption} onChange={(e) => setSortOption(e.target.value as any)} className="border rounded px-2 py-1">
          <option value="distance">Mais próximo</option>
          <option value="rating">Melhor avaliação</option>
        </select>

        {onClose && <Button variant="ghost" onClick={onClose}>Fechar</Button>}
      </div>

      {loading && <p className="text-sm text-muted-foreground">Carregando profissionais...</p>}

      {displayed.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum profissional encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayed.map((p, idx) => {
            const isTop = p === top;
            return (
              <Card key={p.placeId || idx} className={`${isTop ? 'border-2 border-blue-600' : 'border'} shadow-sm`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{p.name}</span>
                    {isTop && <span className="text-sm bg-blue-600 text-white px-2 py-1 rounded">Mais próximo</span>}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">{p.specialty}</div>
                </CardHeader>
                <CardContent>
                  <p>{p.address}</p>
                  {p.rating != null && <p className="mt-2">⭐ {p.rating} ({p.userRatingsTotal} avaliações)</p>}
                  {p.distance != null && <p className="text-sm text-gray-600">Distância: {p.distance} km</p>}
                  <div className="mt-3 flex gap-2">
                    <button className="px-3 py-1 rounded bg-blue-700 text-white" onClick={() => handleRouteClick(p)}>Traçar rota</button>
                    {p.placeId && p.location && (
                      <a className="px-3 py-1 rounded border" href={`https://www.google.com/maps/search/?api=1&query=${p.location.lat},${p.location.lng}&query_place_id=${p.placeId}`} target="_blank" rel="noreferrer">Ver no Maps</a>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
