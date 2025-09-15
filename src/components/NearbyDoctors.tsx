import React, { useState } from "react";

interface NearbyDoctorsProps {
  prognosis?: string; // Recebe o texto do Gemini
  userLocation?: string; // Pode ser "lat,long" ou um endereço
}

function NearbyDoctors({ prognosis, userLocation }: NearbyDoctorsProps) {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Função que interpreta o prognóstico para escolher a especialidade
  const extractSpecialty = (text: string): string => {
    const lower = text.toLowerCase();

    Com certeza! Abaixo está o código preenchido com uma lista abrangente de especialidades médicas reconhecidas no Brasil, seguindo o padrão que você iniciou.

JavaScript

function obterEspecialista(texto) {
  const lower = texto.toLowerCase();

  if (lower.includes("dermat")) return "dermatologista";
  if (lower.includes("cardio")) return "cardiologista";
  if (lower.includes("psiqui")) return "psiquiatra";
  if (lower.includes("gineco")) return "ginecologista";
  if (lower.includes("acupuntura")) return "acupunturista";
  if (lower.includes("alergia") || lower.includes("imunologia")) return "alergista e imunologista";
  if (lower.includes("anestesio")) return "anestesiologista";
  if (lower.includes("angio")) return "angiologista";
  if (lower.includes("cirurgia cardiovascular")) return "cirurgião cardiovascular";
  if (lower.includes("cirurgia da mão")) return "cirurgião da mão";
  if (lower.includes("cirurgia de cabeça e pescoço")) return "cirurgião de cabeça e pescoço";
  if (lower.includes("cirurgia do aparelho digestivo")) return "cirurgião do aparelho digestivo";
  if (lower.includes("cirurgia geral")) return "cirurgião geral";
  if (lower.includes("cirurgia oncológica")) return "cirurgião oncológico";
  if (lower.includes("cirurgia pediátrica")) return "cirurgião pediátrico";
  if (lower.includes("cirurgia plástica")) return "cirurgião plástico";
  if (lower.includes("cirurgia torácica")) return "cirurgião torácico";
  if (lower.includes("cirurgia vascular")) return "cirurgião vascular";
  if (lower.includes("coloprocto")) return "coloproctologista";
  if (lower.includes("endocrino")) return "endocrinologista";
  if (lower.includes("endoscopia")) return "endoscopista";
  if (lower.includes("gastro")) return "gastroenterologista";
  if (lower.includes("genética médica")) return "geneticista";
  if (lower.includes("geriatria")) return "geriatra";
  if (lower.includes("hemato")) return "hematologista";
  if (lower.includes("hemoterapia")) return "hemoterapeuta";
  if (lower.includes("homeopatia")) return "homeopata";
  if (lower.includes("infecto")) return "infectologista";
  if (lower.includes("masto")) return "mastologista";
  if (lower.includes("medicina de emergência")) return "médico de emergência";
  if (lower.includes("medicina de família e comunidade")) return "médico de família e comunidade";
  if (lower.includes("medicina do trabalho")) return "médico do trabalho";
  if (lower.includes("medicina de tráfego")) return "médico de tráfego";
  if (lower.includes("medicina esportiva")) return "médico do esporte";
  if (lower.includes("medicina física e reabilitação")) return "fisiatra";
  if (lower.includes("medicina intensiva")) return "intensivista";
  if (lower.includes("medicina legal e perícia médica")) return "médico legista";
  if (lower.includes("medicina nuclear")) return "médico nuclear";
  if (lower.includes("medicina preventiva e social")) return "médico sanitarista";
  if (lower.includes("nefro")) return "nefrologista";
  if (lower.includes("neurocirurgia")) return "neurocirurgião";
  if (lower.includes("neuro")) return "neurologista";
  if (lower.includes("nutrologia")) return "nutrólogo";
  if (lower.includes("oftalmo")) return "oftalmologista";
  if (lower.includes("onco")) return "oncologista";
  if (lower.includes("ortopedia") || lower.includes("traumatologia")) return "ortopedista e traumatologista";
  if (lower.includes("otorrino")) return "otorrinolaringologista";
  if (lower.includes("patologia")) return "patologista";
  if (lower.includes("patologia clínica") || lower.includes("medicina laboratorial")) return "patologista clínico";
  if (lower.includes("pedia")) return "pediatra";
  if (lower.includes("pneumo")) return "pneumologista";
  if (lower.includes("radio")) return "radiologista";
  if (lower.includes("radioterapia")) return "radioterapeuta";
  if (lower.includes("reumato")) return "reumatologista";
  if (lower.includes("uro")) return "urologista";


    return "clínico geral"; // fallback
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

      // Definir localização (fixo SP se não vier nada)
      const location = userLocation || "-23.5505,-46.6333"; 
      const radius = 5000;

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&type=doctor&keyword=${encodeURIComponent(
          specialty
        )}&key=${process.env.REACT_APP_GOOGLE_MAPS_KEY}`
      );

      const data = await response.json();

      if (data.status === "OK") {
        setDoctors(data.results);
      } else {
        setError(`Erro da API: ${data.status}`);
      }
    } catch (err) {
      setError("Erro ao buscar os profissionais de saúde");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold mt-6 mb-2">Médicos próximos</h2>
      <button 
        onClick={fetchDoctors} 
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Buscar profissionais
      </button>

      {loading && <p>Carregando...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

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
