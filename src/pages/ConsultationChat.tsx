import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useToast } from "@/components/ui/use-toast";
import NearbyDoctors from "./NearbyDoctors";

const ConsultationChat: React.FC<{ user: any }> = ({ user }) => {
  const [consultationData, setConsultationData] = useState<any>(null);
  const [consultationResponse, setConsultationResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const processConsultation = async () => {
    try {
      setLoading(true);

      console.log("Sending consultation data to Gemini:", consultationData);

      const { data, error } = await supabase.functions.invoke("gemini-consultation", {
        body: {
          consultationData: consultationData,
          userId: user.id,
        },
      });

      console.log("Gemini response:", data);

      if (error) {
        throw new Error(error.message);
      }

      setConsultationResponse(data);

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Consulta processada com sucesso!",
        description: "A IA analisou suas informações e gerou uma resposta personalizada.",
      });
    } catch (error: any) {
      console.error("Error processing consultation:", error);

      let errorMessage = "Tente novamente mais tarde.";
      if (error.message) {
        try {
          const parsedError = JSON.parse(error.message);
          if (parsedError.error) {
            errorMessage = parsedError.error;
          }
        } catch (e) {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Erro ao processar consulta",
        description: errorMessage,
        variant: "destructive",
      });

      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Consulta Virtual</h1>
      <button onClick={processConsultation} disabled={loading}>
        {loading ? "Processando..." : "Enviar consulta"}
      </button>

      {consultationResponse && (
        <div>
          <h2>Resultado da Consulta</h2>
          <p>{consultationResponse?.diagnosis}</p>
          <p>
            <strong>Profissional recomendado:</strong>{" "}
            {consultationResponse?.recommendedDoctor}
          </p>

          {/* Integração com NearbyDoctors */}
          <NearbyDoctors
            query={consultationResponse?.recommendedDoctor || "clínica médica"}
          />
        </div>
      )}
    </div>
  );
};

export default ConsultationChat;
