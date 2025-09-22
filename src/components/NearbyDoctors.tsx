// src/components/NearbyDoctors.tsx
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface NearbyDoctorsProps {
  prognosis?: string;
  userAddress?: string;
  edgeFunctionUrl?: string | undefined;
}

type Provider = {
  name: string;
  address?: string;
  rating?: number | null;
  userRatingsTotal?: number;
  location?: { lat: number; lng: number } | null;
  placeId?: string;
};

const mapPrognosisToKeyword = (text?: string) => {
  if (!text) return "doctor";
  const lower = text.toLowerCase();
  
  // Cardiology
  if (lower.includes("coração") || lower.includes("pressão") || lower.includes("cardio")) return "cardiologist";
  
  // Dermatology
  if (lower.includes("pele") || lower.includes("acne") || lower.includes("dermat")) return "dermatologist";
  
  // Neurology
  if (lower.includes("cabeça") || lower.includes("enxaqueca") || lower.includes("neuro")) return "neurologist";
  
  // Gastroenterology - symptoms related to consultation
  if (lower.includes("estômago") || lower.includes("gastrite") || lower.includes("gastro") || 
      lower.includes("náusea") || lower.includes("vômito") || lower.includes("enjoo")) return "gastroenterologist";
  
  // General Medicine
  if (lower.includes("medicina geral") || lower.includes("clínico geral") || lower.includes("febre") || 
      lower.includes("dor") || lower.includes("mal-estar")) return "general practitioner";
  
  // Pulmonology
  if (lower.includes("pulmão") || lower.includes("asma") || lower.includes("pneumo") || lower.includes("respiração")) return "pulmonologist";
  
  // Infectious diseases
  if (lower.includes("infec") || lower.includes("parasit") || lower.includes("febre")) return "infectious disease specialist";
  
  // Hematology
  if (lower.includes("sangue") || lower.includes("hemato") || lower.includes("hemoglob")) return "hematologist";
  
  // Psychiatry
  if (lower.includes("sono") || lower.includes("psiqu") || lower.includes("mental")) return "psychiatrist";
  
  // Rheumatology
  if (lower.includes("dor") && lower.includes("articula") || lower.includes("reuma")) return "rheumatologist";
  
  // Nephrology
  if (lower.includes("urina") || lower.includes("rim") || lower.includes("nefro")) return "nephrologist";
  
  // Ophthalmology
  if (lower.includes("olho") || lower.includes("visão") || lower.includes("oftalmo")) return "ophthalmologist";
  
  // Pediatrics
  if (lower.includes("criança") || lower.includes("pedi") || lower.includes("infantil")) return "pediatrician";
  
  return "doctor";
};

export default function NearbyDoctors({ prognosis, userAddress }: NearbyDoctorsProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Request single-shot location permission
  const requestLocation = () => {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("Geolocalização não disponível no seu navegador.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (err) => {
        console.warn("getCurrentPosition erro:", err);
        setCoords(null);
        setError("Permissão de localização negada. Usaremos o endereço de cadastro, se disponível.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    // se já houver coords automaticamente não faz nada
  }, [coords]);

  const fetchProviders = async () => {
    setError(null);
    setProviders([]);
    setLoading(true);
    try {
      const keyword = mapPrognosisToKeyword(prognosis);
      const body: any = {
        keyword,
        radius: 15000,
      };
      if (coords) {
        body.lat = coords.lat;
        body.lng = coords.lng;
      } else if (userAddress) {
        body.address = userAddress;
      } else {
        setError("Nenhuma localização disponível. Permita a localização ou informe um endereço no perfil.");
        setLoading(false);
        return;
      }

      // Usar Supabase Edge Function (mais seguro)
      const { data, error } = await supabase.functions.invoke("find-healthcare-providers", {
        body,
      });

      if (error) {
        throw new Error(error.message || "Erro ao chamar find-healthcare-providers");
      }
      if (data?.error) {
        throw new Error(data.error);
      }

      const providersFromApi = data.providers || [];
      setProviders(
        providersFromApi.map((p: any) => ({
          name: p.name,
          address: p.address,
          rating: p.rating ?? null,
          userRatingsTotal: p.userRatingsTotal ?? 0,
          location: p.location ?? null,
          placeId: p.placeId ?? p.id ?? null,
        }))
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao buscar os profissionais de saúde");
    } finally {
      setLoading(false);
    }
  };

  const openGoogleMapsZoom = (placeId?: string, lat?: number, lng?: number) => {
    if (placeId) {
      window.open(`https://www.google.com/maps/place/?q=place_id:${placeId}`, "_blank");
    } else if (lat && lng) {
      window.open(`https://www.google.com/maps/@${lat},${lng},17z`, "_blank");
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold mt-6 mb-2">Médicos próximos</h2>

      <div className="flex gap-2 mt-2">
        <button onClick={requestLocation} className="px-4 py-2 bg-slate-600 text-white rounded">Permitir localização</button>
        <button onClick={fetchProviders} className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>
          {loading ? "Buscando..." : "Buscar profissionais"}
        </button>
      </div>

      {error && <p className="mt-3 text-red-600">{error}</p>}

      <ul className="mt-4 space-y-3">
        {providers.map((doc, idx) => (
          <li key={idx} className="p-3 border rounded-md flex justify-between items-start">
            <div>
              <div className="font-semibold">{doc.name}</div>
              <div className="text-sm text-muted-foreground">{doc.address}</div>
              {doc.rating !== null && <div className="text-xs mt-1">Nota: {doc.rating} ⭐ ({doc.userRatingsTotal})</div>}
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => openGoogleMapsZoom(doc.placeId, doc.location?.lat, doc.location?.lng)} className="text-sm px-3 py-1 border rounded">
                Abrir no mapa
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
