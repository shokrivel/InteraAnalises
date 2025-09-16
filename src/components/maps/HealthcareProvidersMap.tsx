// src/components/maps/HealthcareProvidersMap.tsx
import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  userAddress?: string;
  keyword?: string; // prognóstico / texto para extrair especialidade
  lat?: number;
  lng?: number;
  onClose?: () => void;
};

declare global {
  interface Window {
    initMap?: () => void;
    google: any;
  }
}

const loadGoogleMapsScript = (apiKey: string) => {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") return reject("No window");
    if ((window as any).google && (window as any).google.maps) {
      return resolve();
    }
    const existing = document.getElementById("gmaps-script");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const script = document.createElement("script");
    script.id = "gmaps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
};

const mapKeywordToSpecialty = (text?: string) => {
  if (!text) return "médicos";
  const lower = text.toLowerCase();
  if (lower.includes("pele") || lower.includes("dermat")) return "dermatologista";
  if (lower.includes("coração") || lower.includes("cardio")) return "cardiologista";
  if (lower.includes("pulmão") || lower.includes("asma")) return "pneumologista";
  if (lower.includes("infec") || lower.includes("parasit") || lower.includes("febre")) return "infectologista";
  if (lower.includes("sangue") || lower.includes("hemato")) return "hematologista";
  return "médicos";
};

const HealthcareProvidersMap: React.FC<Props> = ({ userAddress, keyword }) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
        if (!apiKey) throw new Error("VITE_GOOGLE_MAPS_KEY não configurada.");

        await loadGoogleMapsScript(apiKey);

        // 1) tentar obter coords do navegador
        const getCoordsFromNavigator = (): Promise<{ lat: number; lng: number } | null> =>
          new Promise((resolve) => {
            if (!("geolocation" in navigator)) return resolve(null);
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
              () => resolve(null),
              { timeout: 10000 }
            );
          });

        let coords = await getCoordsFromNavigator();

        // 2) se não tiver coords, usar geocoding por address (edge function fará geocode se receber address)
        let body: any = { radius: 15000, keyword: mapKeywordToSpecialty(keyword) };
        if (coords) {
          body.lat = coords.lat;
          body.lng = coords.lng;
        } else if (userAddress) {
          body.address = userAddress;
        } else {
          // fallback: tentar SP coords
          body.lat = -23.55052;
          body.lng = -46.633309;
        }

        // chamar edge function para obter providers
        const { data, error: invokeError } = await supabase.functions.invoke("find-healthcare-providers", {
          body,
        });

        if (invokeError) throw invokeError;
        if (!data || data?.error) throw new Error(data?.error || "Erro retornado da edge function");

        const providers = data.providers || [];
        const center = data.searchLocation || { lat: body.lat, lng: body.lng };

        // inicializar mapa
        mapInstance.current = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: 13,
        });

        // marcador do centro (usuário)
        new window.google.maps.Marker({
          position: center,
          map: mapInstance.current,
          title: "Sua localização / referência",
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: "#1976d2",
            fillOpacity: 0.9,
            strokeWeight: 1,
            strokeColor: "#fff",
          },
        });

        // limpar marcadores anteriores
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        // adicionar marcadores dos providers
        providers.forEach((p: any) => {
          const pos = p.location || p.geometry?.location;
          if (!pos) return;
          const marker = new window.google.maps.Marker({
            position: pos,
            map: mapInstance.current,
            title: p.name,
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `<div style="max-width:250px;">
                        <strong>${p.name}</strong><br/>
                        ${p.address || ""}<br/>
                        ${p.rating ? `⭐ ${p.rating} (${p.userRatingsTotal || 0})` : ""}
                        <br/><a href="https://www.google.com/maps/place/?q=place_id:${p.placeId}" target="_blank">Abrir no Google Maps</a>
                      </div>`,
          });

          marker.addListener("click", () => {
            // zoom e centraliza no marcador
            mapInstance.current.panTo(pos);
            mapInstance.current.setZoom(16);
            infoWindow.open({ anchor: marker, map: mapInstance.current });
          });

          markersRef.current.push(marker);
        });
      } catch (err: any) {
        console.error("HealthcareProvidersMap error:", err);
        setError(err.message || "Erro ao carregar mapa.");
      } finally {
        setLoading(false);
      }
    };

    init();

    // cleanup
    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      if (mapInstance.current) {
        mapInstance.current = null;
      }
    };
  }, [userAddress, keyword]);

  return (
    <div>
      {loading && <div className="text-sm text-muted-foreground mb-2">Carregando mapa...</div>}
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div ref={mapRef} style={{ width: "100%", height: "420px", borderRadius: 8 }} />
    </div>
  );
};

export default HealthcareProvidersMap;
