import { useEffect, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { createClient } from "@supabase/supabase-js";

interface HealthcareProvidersMapProps {
  userAddress?: string;
  symptoms: string;
  onClose: () => void;
}

export default function HealthcareProvidersMap({ userAddress, symptoms }: HealthcareProvidersMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [justification, setJustification] = useState<string>("");
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

          const sortedProviders = (data.providers || []).sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
          setProviders(sortedProviders);
          setJustification(justification);

          // Marcadores no mapa
          sortedProviders.forEach((prov: any) => {
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
            map.setCenter(location);
            new google.maps.Marker({
              map,
              position: location,
              title: "Sua localização",
            });

            // IA sugere especialidade + justificativa
            const aiResult = await aiAnalyzeSymptoms(symptoms);
            const suggestedSpecialty = aiResult.suggestedSpecialty;
            const aiJustification = aiResult.justification;

            fetchProviders(userAddress, suggestedSpecialty, aiJustification);
          }
        });
      }
    }

  }, [userAddress, symptoms, supabase]);

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
            <Card key={idx} className="border shadow-sm hover:shadow-md transition-all">
              <CardHeader className="flex flex-col gap-1">
                <CardTitle>{prov.name}</CardTitle>
                {/* Tag da especialidade */}
                <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  {prov.specialty}
                </span>
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                <p>{prov.address}</p>
                {prov.rating && (
                  <p>⭐ {prov.rating} ({prov.userRatingsTotal} avaliações)</p>
                )}
                {justification && (
                  <p className="text-sm text-gray-500 italic mt-1">
                    <strong>Justificativa:</strong> {justification}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
