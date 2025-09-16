// src/components/NearbyDoctors.tsx
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface NearbyDoctorsProps {
  prognosis?: string;
  userAddress?: string;
}

interface Provider {
  id: string;
  name: string;
  address?: string;
  place_id?: string;
  rating?: number;
  user_ratings_total?: number;
  lat?: number;
  lng?: number;
}

function NearbyDoctors({ prognosis, userAddress }: NearbyDoctorsProps) {
  const [doctors, setDoctors] = useState<Provider[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);

  useEffect(() => {
    // Consulta inicial do estado de permissões (opcional)
    if ("permissions" in navigator) {
      (navigator as any).permissions.query({ name: "geolocation" }).then((res: any) => {
        setPermissionState(res.state);
        res.onchange = () => setPermissionState(res.state);
      }).catch(() => setPermissionState(null));
    }
  }, []);

  const mapPrognosisToSpecialty = (prog: string): string => {
    if (!prog) return "doctor";
    const lower = prog.toLowerCase();
    if (lower.includes("pele") || lower.includes("acne") || lower.includes("derm")) return "dermatologist";
    if (lower.includes("coração") || lower.includes("pressão") || lower.includes("cardio")) return "cardiologist";
    if (lower.includes("pulmão") || lower.includes("asma") || lower.includes("pneumo")) return "pulmonologist";
    if (lower.includes("estômago") || lower.includes("gastrite") || lower.includes("gastro")) return "gastroenterologist";
    if (lower.includes("infec") || lower.includes("febre") || lower.includes("paras")) return "infectious disease specialist";
    if (lower.includes("sangue") || lower.includes("hemat")) return "hematologist";
    // adicionar outros mapeamentos conforme necessidade
    return "doctor";
  };

  const fetchSpecialists = async () => {
    if (!prognosis) {
      setError("Prognóstico não disponível para buscar especialistas.");
      return;
    }

    setLoading(true);
    setError("");
    setDoctors([]);

    const specialtyKeyword = mapPrognosisToSpecialty(prognosis);

    // Tenta pegar localização atual
    const tryUseCurrentLocation = (): Promise<{ lat: number; lng: number } | null> => {
      return new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });
    };

    try {
      const current = await tryUseCurrentLocation();

      let payload: any = {
        keyword: specialtyKeyword,
        radius: 15000 // 15 km
      };

      if (current) {
        payload.lat = current.lat;
        payload.lng = current.lng;
      } else if (userAddress) {
        payload.address = userAddress;
      } else {
        // fallback - sem localização nem endereço
        setError("Não foi possível obter sua localização e não há endereço cadastrado.");
        setLoading(false);
        return;
      }

      // Chama a edge function do Supabase (servidor)
      const { data, error: invokeError } = await supabase.functions.invoke('find-healthcare-providers', {
        body: payload
      });

      if (invokeError) throw invokeError;
      if (!data) throw new Error("Sem dados retornados da função.");

      const providers: Provider[] = (data.providers || []).map((p: any) => ({
        id: p.place_id || p.id || p.uid,
        name: p.name,
        address: p.vicinity || p.formatted_address || p.address,
        place_id: p.place_id,
        rating: p.rating,
        user_ratings_total: p.user_ratings_total,
        lat: p.geometry?.location?.lat || p.lat,
        lng: p.geometry?.location?.lng || p.lng
      }));

      setDoctors(providers);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Erro ao buscar os profissionais de saúde");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold mt-6 mb-2">Especialistas recomendados na sua região</h2>

      {permissionState === "prompt" && (
        <p className="text-gray-600">Para localizar profissionais, permita o acesso à sua localização no navegador.</p>
      )}
      {permissionState === "denied" && (
        <p className="text-red-600">Localização bloqueada. Habilite nas configurações do navegador.</p>
      )}

      <button
        onClick={fetchSpecialists}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mt-2 disabled:bg-gray-400"
        disabled={loading}
      >
        {loading ? "Buscando..." : "Buscar especialistas próximos"}
      </button>

      {error && <p className="text-red-600 mt-2">{error}</p>}

      {doctors.length > 0 && (
        <ul className="mt-4 space-y-2">
          {doctors.map((doc) => (
            <li key={doc.id} className="p-3 border rounded-md">
              <strong>{doc.name}</strong> <br />
              <span>{doc.address}</span> <br />
              {doc.rating !== undefined && <span>Nota: {doc.rating} ⭐ ({doc.user_ratings_total || 0} avaliações)</span>}
              <br />
              {doc.place_id ? (
                <a
                  href={`https://www.google.com/maps/place/?q=place_id:${doc.place_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline"
                >
                  Ver no mapa / Abrir no Google Maps
                </a>
              ) : (
                <span className="text-muted-foreground">Localização indisponível</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default NearbyDoctors;
