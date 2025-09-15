import React, { useState } from "react";

function NearbyDoctors({ prognosis }) {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [error, setError] = useState<string>("");

  // Mapeamento simples de prognóstico → especialidade
  const mapPrognosisToSpecialty = (prognosis: string) => {
    if (!prognosis) return "doctor";

    const lower = prognosis.toLowerCase();

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

    return "doctor"; // fallback
  };

  const fetchDoctors = () => {
    if (!navigator.geolocation) {
      setError("Geolocalização não suportada neste navegador");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const radius = 5000; // 5 km
          const query = mapPrognosisToSpecialty(prognosis);

          const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=doctor&keyword=${query}&key=${
              import.meta.env.VITE_GOOGLE_MAPS_KEY
            }`
          );

          const data = await response.json();

          if (data.status === "OK") {
            setDoctors(data.results);
          } else {
            setError(`Erro da API: ${data.status}`);
          }
        } catch (err) {
          setError("Erro ao buscar os profissionais de saúde");
        }
      },
      (error) => {
        setError("Permissão de localização negada ou indisponível");
      }
    );
  };

  return (
    <div>
      <h2>Profissionais de Saúde Recomendados</h2>
      <p>Para localizar médicos próximos, permita o acesso à sua localização.</p>
      <button onClick={fetchDoctors}>🔍 Buscar profissionais</button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <ul>
        {doctors.map((doc) => (
          <li key={doc.place_id}>
            <strong>{doc.name}</strong> - {doc.vicinity}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default NearbyDoctors;
