import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import interasaudeLogo from "@/assets/interasaude-logo.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, ArrowLeft, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useConsultationFields } from "@/hooks/useConsultationFields";
import { useToast } from "@/hooks/use-toast";
import DynamicField from "@/components/consultation/DynamicField";

const Consultation = () => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { fields, loading: fieldsLoading, isFieldRequired } = useConsultationFields();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!profileLoading && !user) {
      navigate("/");
    }
  }, [user, profileLoading, navigate]);

  // Request geolocation on component mount
  useEffect(() => {
    const requestLocation = () => {
      if ('geolocation' in navigator) {
        toast({
          title: "Solicitação de Localização",
          description: "Permita o acesso à sua localização para encontrar médicos mais próximos de você. Você também pode usar seu CEP cadastrado.",
        });

        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
            setLocationPermission('granted');
            toast({
              title: "Localização obtida",
              description: "Vamos buscar os profissionais mais próximos de você.",
            });
          },
          (error) => {
            console.log('Geolocation error:', error);
            setLocationPermission('denied');
            toast({
              title: "Localização negada",
              description: "Usaremos o endereço do seu cadastro para buscar profissionais próximos.",
              variant: "default",
            });
          }
        );
      } else {
        setLocationPermission('denied');
      }
    };

    if (user && !profileLoading) {
      requestLocation();
    }
  }, [user, profileLoading, toast]);

  const handleAnswerChange = (fieldName: string, value: any) => {
    setAnswers(prev => ({ ...prev, [fieldName]: value }));
  };

  const validateForm = () => {
    const requiredFields = fields.filter(field => isFieldRequired(field));
    const missingFields = requiredFields.filter(field => {
      const value = answers[field.field_name];
      return !value || (typeof value === 'string' && value.trim() === '');
    });

    if (missingFields.length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: `Por favor, preencha: ${missingFields.map(f => f.field_label).join(', ')}`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;

    if (!validateForm()) return;

    setLoading(true);

    try {
      console.log('Submitting consultation data:', answers);
      
      // Navigate to consultation chat with the answers and location
      navigate("/consultation-chat", { 
        state: { 
          consultationData: answers,
          userLocation: userLocation,
          locationPermission: locationPermission
        } 
      });
    } catch (error) {
      toast({
        title: "Erro ao processar consulta",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading || fieldsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-8 h-8 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Perfil não encontrado</CardTitle>
            <CardDescription>
              Você precisa completar seu perfil primeiro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/profile")}>
              Completar Perfil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const profileLabels = {
    patient: 'Paciente',
    academic: 'Acadêmico',
    health_professional: 'Profissional de Saúde'
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="mr-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <img 
              src={interasaudeLogo} 
              alt="InteraSaúde Logo" 
              className="h-10 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate("/")}
            />
          </div>
          <Badge variant="secondary">
            {profileLabels[profile.profile_type]}
          </Badge>
        </div>
      </header>

      {/* Consultation Form */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Nova Consulta</CardTitle>
              <CardDescription>
                Preencha as informações abaixo para receber uma análise personalizada baseada em evidências científicas.
                Os campos são adaptados ao seu nível de conhecimento: <strong>{profileLabels[profile.profile_type]}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {fields.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Nenhum campo de consulta configurado para o seu perfil.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/dashboard")}
                    className="mt-4"
                  >
                    Voltar ao Dashboard
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {fields.map((field) => (
                    <DynamicField
                      key={field.id}
                      field={field}
                      value={answers[field.field_name]}
                      onChange={handleAnswerChange}
                      required={isFieldRequired(field)}
                    />
                  ))}
                  
                  <div className="flex gap-4 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/dashboard")}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? (
                        "Processando..."
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Iniciar Consulta
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Consultation;