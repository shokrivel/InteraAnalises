import React, { useState, useEffect } from "react";

interface NearbyDoctorsProps {
  prognosis?: string;
  userAddress?: string;
}

// Chave da API do Google Maps (Vite)
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

function NearbyDoctors({ prognosis, userAddress }: NearbyDoctorsProps) {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState<PermissionState | null>(null);

  // Checa status da permissão de geolocalização ao carregar o componente
  useEffect(() => {
    if ("permissions" in navigator) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((result) => {
          setPermission(result.state);
          // Atualiza o estado da permissão se o usuário mudar nas configurações do navegador
          result.onchange = () => setPermission(result.state);
        });
    } else {
      // Navegadores mais antigos podem não suportar a API de Permissões
      setError("API de geolocalização não suportada neste navegador.");
    }
  }, []);

  // Função que mapeia o prognóstico da IA para uma especialidade pesquisável
  const mapPrognosisToSpecialty = (prog: string): string => {
    if (!prog) return "clínico geral";

    // CORREÇÃO: Removido ponto e vírgula extra
    const lower = prog.toLowerCase();

    // Mapeamento de palavras-chave para especialidades
    if (lower.includes("pele") || lower.includes("acne") || lower.includes("dermatite")) return "dermatologista";
    if (lower.includes("coração") || lower.includes("pressão") || lower.includes("infarto")) return "cardiologista";
    if (lower.includes("pulmão") || lower.includes("tosse") || lower.includes("asma") || lower.includes("pneumonia")) return "pneumologista";
    if (lower.includes("estômago") || lower.includes("úlcera") || lower.includes("gastrite")) return "gastroenterologista";
    if (lower.includes("rim") || lower.includes("urina") || lower.includes("infecção urinária")) return "urologista";
    if (lower.includes("criança") || lower.includes("pediatria")) return "pediatra";
    if (lower.includes("ossos") || lower.includes("fratura") || lower.includes("artrose")) return "ortopedista";
    if (lower.includes("cérebro") || lower.includes("convulsão") || lower.includes("neuro")) return "neurologista";
    if (lower.includes("psico") || lower.includes("depressão") || lower.includes("ansiedade")) return "psiquiatra";
    if (lower.includes("olho") || lower.includes("visão") || lower.includes("conjuntivite")) return "oftalmologista";
    
    // Fallback para uma busca mais genérica
    return "clínico geral";
  };

  // OTIMIZAÇÃO: Função centralizada para obter a localização do usuário
  const determineUserLocation = (): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      // Prioridade 1: Tenta obter a localização atual via GPS
      if (permission === "granted") {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(`${pos.coords.latitude},${pos.coords.longitude}`),
          (err) => {
            console.warn("Erro no getCurrentPosition, tentando geocodificar endereço.", err.message);
            // Se falhar, tenta a prioridade 2
            geocodeAddress();
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      } else {
        geocodeAddress();
      }

      // Prioridade 2: Tenta geocodificar o endereço cadastrado
      async function geocodeAddress() {
        if (userAddress) {
          try {
            const geoResponse = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(userAddress)}&key=${GOOGLE_MAPS_API_KEY}`
            );
            const geoData = await geoResponse.json();
            if (geoData.status === "OK" && geoData.results.length > 0) {
              const loc = geoData.results[0].geometry.location;
              resolve(`${loc.lat},${loc.lng}`);
            } else {
              reject(new Error("Não foi possível geocodificar o endereço."));
            }
          } catch (error) {
            reject(new Error("Falha na rede ao tentar geocodificar."));
          }
        } else {
            // Prioridade 3: Usa uma localização de fallback (Maringá, PR)
            console.warn("Nenhuma localização ou endereço disponível. Usando fallback.");
            resolve("-23.4253,-51.9386");
        }
      }
    });
  };

  const fetchDoctors = async () => {
    if (!prognosis) {
      setError("Prognóstico não disponível para buscar especialistas.");
      return;
    }

    setLoading(true);
    setError("");
    setDoctors([]);

    try {
      // CORREÇÃO: Nome da função corrigido
      const specialty = mapPrognosisToSpecialty(prognosis);
      const location = await determineUserLocation();
      const radius = 15000; // 15km

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&type=doctor&keyword=${encodeURIComponent(specialty)}&key=${GOOGLE_MAPS_API_KEY}`
      );

      const data = await response.json();

      if (data.status === "OK") {
        setDoctors(data.results);
      } else {
        console.error("Erro da API do Google Places:", data);
        setError(`Erro ao buscar médicos: ${data.status}. Verifique sua chave de API e as cotas de uso.`);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocorreu um erro ao buscar os profissionais.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold mt-6 mb-2">Especialistas recomendados na sua região</h2>

      {/* Mensagens de status da permissão */}
      {permission === "prompt" && (
        <p className="text-gray-600">Para uma busca precisa, permita o acesso à sua localização.</p>
      )}
      {permission === "denied" && (
        <p className="text-red-600">Acesso à localização bloqueado. A busca usará seu endereço cadastrado ou uma localização padrão.</p>
      )}

      <button
        onClick={fetchDoctors}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mt-2 disabled:bg-gray-400"
        disabled={loading}
      >
        {loading ? "Buscando..." : "Buscar especialistas próximos"}
      </button>

      {error && <p className="text-red-600 mt-2">{error}</p>}

      {doctors.length > 0 && (
        <ul className="mt-4 space-y-2">
          {doctors.map((doc) => (
            <li key={doc.place_id} className="p-3 border rounded-md">
              <strong>{doc.name}</strong> <br />
              <span>{doc.vicinity}</span> <br />
              {doc.rating && <span>Nota: {doc.rating} ⭐ ({doc.user_ratings_total} avaliações)</span>}
              <br />
              {/* CORREÇÃO: Link do Google Maps funcional */}
              <a
                href={`https://www.google.com/maps/place/?q=place_id:${doc.place_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                Ver no mapa
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default NearbyDoctors;