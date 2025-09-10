import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Heart, ArrowLeft, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'checkbox' | 'number';
  required: boolean;
  placeholder?: string;
}

const questionsByProfile = {
  patient: [
    { id: 'symptoms', label: 'Quais sintomas você está sentindo?', type: 'textarea', required: true, placeholder: 'Descreva seus sintomas em detalhes...' },
    { id: 'symptom_duration', label: 'Há quanto tempo os sintomas começaram? (em dias)', type: 'number', required: true, placeholder: '7' },
    { id: 'family_symptoms', label: 'Algum familiar apresenta sintomas similares?', type: 'checkbox', required: false },
    { id: 'travel_history', label: 'Viajou recentemente? Para onde?', type: 'text', required: false, placeholder: 'Ex: Região Nordeste, exterior...' },
    { id: 'water_source', label: 'Qual a fonte de água que você consome?', type: 'text', required: false, placeholder: 'Tratada, poço, filtrada...' },
    { id: 'food_habits', label: 'Costuma comer carne mal passada ou peixe cru?', type: 'checkbox', required: false },
    { id: 'pet_contact', label: 'Tem contato com animais domésticos?', type: 'checkbox', required: false }
  ] as Question[],
  
  academic: [
    { id: 'case_description', label: 'Descreva o caso clínico que deseja analisar', type: 'textarea', required: true, placeholder: 'Descrição completa do caso...' },
    { id: 'exam_results', label: 'Resultados de exames disponíveis', type: 'textarea', required: false, placeholder: 'Hemograma, parasitológico, bioquímico...' },
    { id: 'differential_diagnosis', label: 'Hipóteses diagnósticas consideradas', type: 'textarea', required: false, placeholder: 'Liste as possibilidades diagnósticas...' },
    { id: 'study_focus', label: 'Área de estudo específica', type: 'text', required: true, placeholder: 'Parasitologia, Hematologia, Bioquímica...' },
    { id: 'learning_objective', label: 'Objetivo de aprendizado', type: 'textarea', required: true, placeholder: 'O que você gostaria de entender melhor sobre este caso?' }
  ] as Question[],
  
  health_professional: [
    { id: 'patient_presentation', label: 'Apresentação do paciente', type: 'textarea', required: true, placeholder: 'Sintomas, sinais clínicos, história...' },
    { id: 'clinical_history', label: 'História clínica relevante', type: 'textarea', required: true, placeholder: 'Comorbidades, medicações, história familiar...' },
    { id: 'laboratory_results', label: 'Resultados laboratoriais', type: 'textarea', required: false, placeholder: 'Hemograma completo, bioquímica, parasitológico...' },
    { id: 'clinical_suspicion', label: 'Suspeita clínica', type: 'text', required: true, placeholder: 'Principal hipótese diagnóstica...' },
    { id: 'specific_question', label: 'Pergunta específica para a IA', type: 'textarea', required: true, placeholder: 'Que orientação específica você precisa?' },
    { id: 'urgency_level', label: 'Nível de urgência do caso', type: 'text', required: false, placeholder: 'Emergência, urgente, eletivo...' }
  ] as Question[]
};

const Consultation = () => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!profileLoading && !user) {
      navigate("/");
    }
  }, [user, profileLoading, navigate]);

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;

    setLoading(true);

    try {
      // Aqui será implementada a integração com a IA
      toast({
        title: "Consulta iniciada!",
        description: "Processando suas informações...",
      });
      
      // Navegar para uma página de resultados (a ser criada)
      navigate("/dashboard");
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

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-8 h-8 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando...</p>
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
            <Button onClick={() => navigate("/dashboard")}>
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const questions = questionsByProfile[profile.profile_type] || questionsByProfile.patient;
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
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">InteraSaúde</h1>
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
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {questions.map((question) => (
                  <div key={question.id} className="space-y-2">
                    <Label htmlFor={question.id}>
                      {question.label}
                      {question.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    
                    {question.type === 'textarea' && (
                      <Textarea
                        id={question.id}
                        value={answers[question.id] || ''}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        placeholder={question.placeholder}
                        required={question.required}
                        rows={4}
                      />
                    )}
                    
                    {question.type === 'text' && (
                      <Input
                        id={question.id}
                        value={answers[question.id] || ''}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        placeholder={question.placeholder}
                        required={question.required}
                      />
                    )}
                    
                    {question.type === 'number' && (
                      <Input
                        id={question.id}
                        type="number"
                        value={answers[question.id] || ''}
                        onChange={(e) => handleAnswerChange(question.id, parseInt(e.target.value) || '')}
                        placeholder={question.placeholder}
                        required={question.required}
                      />
                    )}
                    
                    {question.type === 'checkbox' && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={question.id}
                          checked={answers[question.id] || false}
                          onCheckedChange={(checked) => handleAnswerChange(question.id, checked)}
                        />
                        <label htmlFor={question.id} className="text-sm">
                          Sim
                        </label>
                      </div>
                    )}
                  </div>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Consultation;