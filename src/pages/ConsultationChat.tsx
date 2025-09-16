import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useToast } from "@/components/ui/use-toast";
import NearbyDoctors from "../components/NearbyDoctors";

export default function ConsultationChat() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patientName, setPatientName] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [consultationResponse, setConsultationResponse] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Chama a API da IA (via Supabase Edge Function / RLS)
      const { data, error } = await supabase.functions.invoke("consultation-chat", {
        body: { patientName, symptoms },
      });

      if (error) throw error;

      if (data) {
        setConsultationResponse(data.response);

        // Salva no histórico
        const { error: insertError } = await supabase.from("consultations").insert([
          {
            patient_name: patientName,
            symptoms,
            response: data.response,
          },
        ]);

        if (insertError) throw insertError;

        toast({
          title: "Consulta salva!",
          description: "O resultado foi armazenado no histórico.",
        });

        // Redireciona para NearbyDoctors passando o prognóstico
        navigate("/nearby-doctors", {
          state: { consultationResponse: data.response },
        });
      }
    } catch (err: any) {
      console.error("Erro na consulta:", err.message);
      toast({
        title: "Erro",
        description: "Não foi possível realizar a consulta.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Consulta Inteligente</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Seu nome"
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <textarea
          placeholder="Descreva seus sintomas"
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Enviar
        </button>
      </form>

      {consultationResponse && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <h2 className="text-xl font-semibold">Resultado da Consulta</h2>
          <p className="mt-2">{consultationResponse}</p>
        </div>
      )}

      {/* Pré-visualização dos médicos próximos */}
      {consultationResponse && (
        <NearbyDoctors consultationResponse={consultationResponse} />
      )}
    </div>
  );
}
