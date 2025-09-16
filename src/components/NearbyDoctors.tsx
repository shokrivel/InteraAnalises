// src/components/NearbyDoctors.tsx
import React, { useState, useEffect } from "react";

interface NearbyDoctorsProps {
  prognosis?: string; // texto retornado pela IA (usado para extrair especialidade)
  userAddress?: string; // endereço do cadastro (ex: "Rua X, Cidade, UF")
  /**
   * edgeFunctionUrl: URL pública da sua edge function 'find-healthcare-providers'
   * se você estiver usando supabase.functions.invoke no frontend, substitua a chamada fetch abaixo.
   */
  edgeFunctionUrl?: string;
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
  if (lower.includes("pele") || lower.includes("acne") || lower.includes("dermat")) return "dermatologista";
  if (lower.includes("coração") || lower.includes("pressão") || lower.includes("cardio")) return "cardiologista";
  if (lower.includes("pulmão") || lower.includes("asma") || lower.includes("pneumo")) return "pneumologista";
  if (lower.includes("estômago") || lower.includes("gastrite") || lower.includes("gastro")) return "gastroenterologista";
  if (lower.includes("infec") || lower.includes("febre") || lower.includes("parasit")) return "infectologista";
  if (lower.includes("sangue") || lower.includes("hemato") || lower.includes("hemoglob")) return "hematologista";
  if (lower.includes("sono") || lower.includes("psiqu")) return "psiquiatra";
  if (lower.includes("dor") && lower.includes("articula")) return "reumatologista";
  if (lower.includes("urina") || lower.includes("rim") || lower.includes("nefro")) return "nefrologista";
  if (lower.includes("olho") || lower.includes("visão") || lower.includes("oftalmo")) return "oftalmologista";
  if (lower.includes("criança") || lower.includes("recém") || lower.includes("pedi")) return "pediatra";
  // fallback
  return "médicos";
};

export default function NearbyDoctors({ prognosis, userAddress, edgeFunctionUrl }: NearbyDoctorsProps) {
  const [permissionState, setPermissionState] = useState<PermissionState | "unsupported">("unsupported");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);

  // Detecta permission api (opcional)
  useEffect(() => {
    if (!("permissions" in navigator)) {
      setPermissionState("unsupported");
      return;
    }
    try {
      // @ts-ignore - PermissionName typing
      navigator.permissions.query({ name: "geolocation" }).then((res: PermissionStatus) => {
        setPermissionState(res.state);
        res.onchange = () => setPermissionState(res.state);
      });
    } catch {
      setPermissionState("unsupported");
    }
  }, []);

  const requestLocation = () => {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("Geolocalização não disponível no seu navegador.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setPermissionState("granted");
      },
      (err) => {
        console.warn("getCurrentPosition erro:", err);
        setPermissionState("denied");
        setError("Permissão de localização negada. Usaremos o endereço de cadastro, se disponível.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Quando clicar em "Buscar especialistas", executa
  const fetchProviders = async () => {
    setError(null);
    setProviders([]);
    setLoading(true);

    try {
      const keyword = mapPrognosisToKeyword(prognosis);
      // Preferência 1: localização atual (coords)
      // Preferência 2: endereço de cadastro (userAddress) — a edge function fará geocoding
      const body: any = {
        keyword,
        radius: 15000
      };
      if (coords) {
        body.lat = coords.lat;
        body.lng = coords.lng;
      } else if (userAddress) {
        body.address = userAddress;
      } else {
        // fallback - se nada, deixa o backend geocodificar com um local padrão (mas é melhor exigir userAddress)
        setError("Nenhuma localização disponível. Permita a localização ou informe um endereço no perfil.");
        setLoading(false);
        return;
      }

      // Chama a edge function (altere a URL se usar supabase.functions.invoke)
      const url = edgeFunctionUrl || "/.netlify/functions/find-healthcare-providers"; // ajustar conforme deploy
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Erro ao buscar: ${res.statusText}`);
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
      setError(err.message || "Erro ao buscar profissionais.");
    } finally {
      setLoading(false);
    }
  };

  // Abre Google Maps com zoom e place_id
  const openGoogleMapsZoom = (placeId?: string, lat?: number, lng?: number) => {
    if (!placeId && (!lat || !lng)) return;
    if (placeId) {
      window.open(`https://www.google.com/maps/place/?q=place_id:${placeId}`, "_blank");
    } else {
      window.open(`https://www.google.com/maps/@${lat},${lng},17z`, "_blank");
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold mt-6 mb-2">Especialistas recomendados</h2>

      {/* Permissão / botão de solicitar localização */}
      {permissionState === "granted" && <p className="text-green-600">Localização em tempo real ativada.</p>}
      {permissionState === "prompt" && <p className="text-gray-600">Permita o acesso à sua localização para melhores resultados.</p>}
      {permissionState === "denied" && <p className="text-red-600">Localização bloqueada. Usaremos o endereço do perfil se disponível.</p>}
      {permissionState === "unsupported" && <p className="text-gray-600">Permissões não suportadas no navegador.</p>}

      <div className="flex gap-2 mt-2">
        <button onClick={requestLocation} className="px-4 py-2 bg-slate-600 text-white rounded">Permitir localização</button>
        <button
          onClick={fetchProviders}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
        >
          {loading ? "Buscando..." : "Buscar especialistas próximos"}
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
              <button
                onClick={() => openGoogleMapsZoom(doc.placeId, doc.location?.lat, doc.location?.lng)}
                className="text-sm px-3 py-1 border rounded"
              >
                Abrir no mapa
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
