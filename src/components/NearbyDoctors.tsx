import React, { useState, useEffect } from "react";

interface NearbyDoctorsProps {
  prognosis?: string; // Prognóstico vindo da IA
  userAddress?: string; // Endereço do cadastro no Supabase
}

function NearbyDoctors({ prognosis, userAddress }: NearbyDoctorsProps) {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState<PermissionState | null>(null);
  const [location, setLocation] = useState<string | null>(null);

  // Checa status de permissão no load
  useEffect(() => {
    if ("permissions" in navigator) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((result) => setPermission(result.state));
    }
  }, []);

  // Atualiza em tempo real se permitido
  useEffect(() => {
    if (permission === "granted") {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setLocation(`${pos.coords.latitude},${pos.coords.longitude}`);
        },
        (err) => {
          console.warn("Erro no watchPosition:", err.message);
          setLocation(null);
        },
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [permission]);

  // Função que interpreta prognóstico → especialidade
  const mapPrognosisToSpecialty = (prognosis: string) => {
    if (!prognosis) return "doctor";

    const lower = prognosis.toLowerCase();;
    
    if (lower.includes("pele") || lower.includes("acne") || lower.includes("dermatite")) return "dermatologist";
    if (lower.includes("coração") || lower.includes("pressão") || lower.includes("infarto")) return "cardiologist";
    if (lower.includes("pulmão") || lower.includes("tosse") || lower.includes("asma") || lower.includes("pneumonia")) return "pulmonologist";
    if (lower.includes("diabetes") || lower.includes("endócrino") || lower.includes("hormônio")) return "endocrinologist";
    if (lower.includes("estômago") || lower.includes("úlcera") || lower.includes("gastrite")) return "gastroenterologist";
    if (lower.includes("rim") || lower.includes("urina") || lower.includes("infecção urinária")) return "urologist";
    if (lower.includes("mulher") || lower.includes("gestação") || lower.includes("gineco")) return "gynecologist";
    if (lower.includes("criança") || lower.includes("pediatria")) return "pediatrician";
    if (lower.includes("ossos") || lower.includes("fratura") || lower.includes("artrose")) return "orthopedist";
    if (lower.includes("cérebro") || lower.includes("convulsão") || lower.includes("neuro")) return "neurologist";
    if (lower.includes("psico") || lower.includes("depressão") || lower.includes("ansiedade")) return "psychiatrist";
    if (lower.includes("olho") || lower.includes("visão") || lower.includes("conjuntivite")) return "ophthalmologist";
    if (lower.includes("ouvido") || lower.includes("rinite") || lower.includes("sinusite")) return "otolaryngologist";
    if (lower.includes("gravidez") || lower.includes("parto") || lower.includes("obstetra")) return "obstetrician";

    return "clínico geral";
  };

  const fetchDoctors = async () => {
    if (!prognosis) {
      setError("Não foi possível determinar a especialidade a partir do prognóstico.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const specialty = extractSpecialty(prognosis);
      let finalLocation = location || "-23.5505,-46.6333"; // fallback SP

      // Se localização não disponível, tenta endereço cadastrado
      if (!location && userAddress) {
        const geoResponse = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            userAddress
          )}&key=${process.env.REACT_APP_GOOGLE_MAPS_KEY}`
        );
        const geoData = await geoResponse.json();
        if (geoData.status === "OK" && geoData.results.length > 0) {
          const loc = geoData.results[0].geometry.location;
          finalLocation = `${loc.lat},${loc.lng}`;
        }
      }

      // Busca médicos no Google Places
      const radius = 5000;
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${finalLocation}&radius=${radius}&type=doctor&keyword=${encodeURIComponent(
          specialty
        )}&key=${process.env.VITE_GOOGLE_MAPS_KEY}`
      );

      const data = await response.json();

      if (data.status === "OK") {
        setDoctors(data.results);
      } else {
        setError(`Erro da API: ${data.status}`);
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao buscar os profissionais de saúde");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold mt-6 mb-2">Médicos próximos</h2>

      {/* Mostrar status da permissão */}
      {permission === "prompt" && (
        <p className="text-gray-600">
          Para localizar médicos próximos, permita o acesso à sua localização.
        </p>
      )}
      {permission === "denied" && (
        <p className="text-red-600">
          Localização bloqueada. Habilite nas configurações do navegador.
        </p>
      )}
      {permission === "granted" && (
        <p className="text-green-600">Localização em tempo real ativada ✅</p>
      )}

      <button
        onClick={fetchDoctors}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mt-2"
      >
        Buscar profissionais
      </button>

      {loading && <p>Carregando...</p>}
      {error && <p className="text-red-600">{error}</p>}

      <ul className="mt-4 space-y-2">
        {doctors.map((doc) => (
          <li key={doc.place_id} className="p-3 border rounded-md">
            <strong>{doc.name}</strong> <br />
            {doc.vicinity} <br />
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
    </div>
  );
}

export default NearbyDoctors;
