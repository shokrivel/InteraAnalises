import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client"; // Verifique se este é o caminho correto

interface NearbyDoctorsProps {
  prognosis?: string;
  userAddress?: string;
}

function NearbyDoctors({ prognosis, userAddress }: NearbyDoctorsProps) {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Função que mapeia o prognóstico para a especialidade (AGORA EM INGLÊS)
  const mapPrognosisToSpecialty = (prog: string): string => {
    if (!prog) return "doctor";
    const lower = prog.toLowerCase();
    if (lower.includes("pele") || lower.includes("acne")) return "dermatologist";
    if (lower.includes("coração") || lower.includes("pressão")) return "cardiologist";
    if (lower.includes("pulmão") || lower.includes("asma")) return "pulmonologist";
    if (lower.includes("estômago") || lower.includes("gastrite")) return "gastroenterologist";
    // Adicione outras especialidades em inglês aqui...
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

    try {
      const specialtyKeyword = mapPrognosisToSpecialty(prognosis);
      console.log(`Buscando por especialistas: ${specialtyKeyword}`);

      // AGORA CHAMA A EDGE FUNCTION, MUITO MAIS SEGURO!
      const { data, error: invokeError } = await supabase.functions.invoke('find-healthcare-providers', {
        body: {
          address: userAddress,
          keyword: specialtyKeyword, // Passando a especialidade!
          radius: 15000,
        },
      });

      if (invokeError) throw invokeError;
      
      if(data.error) throw new Error(data.error);

      setDoctors(data.providers || []);
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocorreu um erro ao buscar os especialistas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
        <h2 className="text-lg font-bold mt-6 mb-2">Especialistas recomendados na sua região</h2>
        <button
            onClick={fetchSpecialists}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mt-2 disabled:bg-gray-400"
            disabled={loading}
        >
            {loading ? "Buscando..." : "Buscar especialistas próximos"}
        </button>

        {error && <p className="text-red-600 mt-2">{error}</p>}
        
        {/* Lógica para renderizar a lista de médicos (igual à anterior) */}
        {doctors.length > 0 && (
             <ul className="mt-4 space-y-2">
               {doctors.map((doc) => (
                 <li key={doc.id} className="p-3 border rounded-md">
                   <strong>{doc.name}</strong> <br />
                   <span>{doc.address}</span> <br />
                   {doc.rating > 0 && <span>Nota: {doc.rating} ⭐ ({doc.reviewCount} avaliações)</span>}
                   <br />
                   <a
                     href={`https://www.google.com/maps/place/?q=place_id:${doc.id}`}
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
