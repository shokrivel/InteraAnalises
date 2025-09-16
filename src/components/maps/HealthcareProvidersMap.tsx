import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HealthcareProvidersMapProps {
  userAddress?: string;
  keyword?: string; // <-- especialidade sugerida pela IA
  onClose: () => void;
}

interface Provider {
  name: string;
  address: string;
  rating: number | null;
  userRatingsTotal: number;
  location: { lat: number; lng: number } | null;
  placeId: string;
  types: string[];
  specialty: string;
}

export default function HealthcareProvidersMap({ userAddress, keyword, onClose }: HealthcareProvidersMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        // 🔎 Chama Supabase Edge Function
        const { data, error } = await supabase.functions.invoke("find-healthcare-providers", {
          body: {
            address: userAddress,
            keyword, // <-- passa especialidade inferida
          },
        });

        if (error) throw error;

        if (data?.providers) {
          setProviders(data.providers);

          // Inicializa mapa no primeiro resultado
          if (mapRef.current && data.searchLocation) {
            const map = new google.maps.Map(mapRef.current, {
              center: data.searchLocation,
              zoom: 13,
            });

            data.providers.forEach((prov: Provider) => {
              if (prov.location) {
                new google.maps.Marker({
                  map,
                  position: prov.location,
                  title: prov.name,
                });
              }
            });
          }
        }
      } catch (err) {
        console.error("Erro ao buscar provedores:", err);
      } finally {
        setLoading(false);
      }
    };

    // Garantir que Google Maps API está carregado
    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places`;
      script.async = true;
      script.onload = init;
      document.head.appendChild(script);
    } else {
      init();
    }
  }, [userAddress, keyword]);

  return (
    <div className="space-y-6">
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "400px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      />

      {/* Lista de profissionais em cards */}
      {loading ? (
        <p className="text-center text-sm text-muted-foreground">Carregando profissionais próximos...</p>
      ) : providers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      ) : (
        <p className="text-center text-sm text-muted-foreground">Nenhum profissional encontrado para esta especialidade.</p>
      )}
    </div>
  );
}
