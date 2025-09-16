// src/components/NearbyDoctors.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";

interface NearbyDoctorsProps {
  prognosis?: string; // texto bruto da IA ou especialidade sugerida
  userAddress?: string; // string "Rua X, Cidade"
}

const NearbyDoctors: React.FC<NearbyDoctorsProps> = ({ prognosis, userAddress }) => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocalização não suportada pelo navegador.");
      // fallback é tentar usar userAddress depois
      return;
    }

    // Tenta pegar permissão (aparece prompt)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        console.warn("Geolocation error:", err.message);
        setError("Permissão de localização negada ou indisponível.");
        // não setamos fallback aqui — fetchSpecialists tentará usar userAddress
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  // map prognosis (pt) -> keyword (en) ou specialty
  const mapPrognosisToKeyword = (text?: string) => {
    if (!text) return "doctor";
    const lower = text.toLowerCase();
    if (lower.includes("pele") || lower.includes("acne") || lower.includes("dermatite")) return "dermatologist";
    if (lower.includes("coração") || lower.includes("pressão") || lower.includes("infarto")) return "cardiologist";
    if (lower.includes("pulmão") || lower.includes("tosse") || lower.includes("asma") || lower.includes("pneumonia")) return "pulmonologist";
    if (lower.includes("estômago") || lower.includes("gastrite") || lower.includes("dor abdominal")) return "gastroenterologist";
    if (lower.includes("hidr") || lower.includes("urin") || lower.includes("rim")) return "urologist";
    if (lower.includes("ansiedade") || lower.includes("depress")) return "psychiatrist";
    if (lower.includes("olho") || lower.includes("visão")) return "ophthalmologist";
    if (lower.includes("ouvido") || lower.includes("tontura")) return "otolaryngologist";
    if (lower.includes("ossos") || lower.includes("fratura")) return "orthopedist";
    if (lower.includes("criança") || lower.includes("pediatria")) return "pediatrician";
    if (lower.includes("sangue") || lower.includes("hemograma") || lower.includes("hematologia")) return "hematologist";
    // fallback
    return "doctor";
  };

  const fetchSpecialists = async () => {
    setLoading(true);
    setError(null);
    setDoctors([]);

    try {
      const keyword = mapPrognosisToKeyword(prognosis);
      const payload: any = {
        keyword,
        radius: 15000,
      };

      // prioriza location (geolocalização atual), se disponível
      if (location) payload.location = location;
      // se não tiver location, passa userAddress (edge function fará geocoding)
      else if (userAddress) payload.address = userAddress;

      const { data, error: invokeError } = await supabase.functions.invoke("find-healthcare-providers", {
        body: payload,
      });

      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);

      setDoctors(data.providers || []);
    } catch (err: any) {
      console.error("fetchSpecialists error:", err);
      setError(err.message || "Erro ao buscar especialistas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3">
        Especialidade sugerida: <strong>{mapPrognosisToKeyword(prognosis)}</strong>
      </p>

      <button
        onClick={fetchSpecialists}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        {loading ? "Buscando..." : "Buscar especialistas próximos"}
      </button>

      {error && <p className="text-red-600 mt-2">{error}</p>}

      {doctors.length > 0 && (
        <ul className="mt-4 space-y-2">
          {doctors.map((d: any) => (
            <li key={d.id || d.place_id} className="p-3 border rounded-md">
              <strong>{d.name}</strong> <br />
              <span>{d.address || d.vicinity}</span> <br />
              {d.rating != null && <span>Nota: {d.rating} ⭐ ({d.reviewCount || 0} avaliações)</span>}
              <div className="mt-2">
                <a
                  href={d.url || `https://www.google.com/maps/place/?q=place_id:${d.place_id || d.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline"
                >
                  Ver no mapa
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NearbyDoctors;
