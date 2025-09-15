import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { X, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ReopenConsultationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalConsultation: {
    id: string;
    symptoms: string[] | null;
    ai_response: string | null;
    created_at: string | null;
  };
  onSuccess: () => void;
}

const ReopenConsultationModal = ({ 
  open, 
  onOpenChange, 
  originalConsultation, 
  onSuccess 
}: ReopenConsultationModalProps) => {
  const [newSymptoms, setNewSymptoms] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!newSymptoms.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, descreva os novos sintomas ou justificativa.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Upload files if any
      let uploadedFiles = [];
      if (files.length > 0) {
        for (const file of files) {
          const fileName = `${Date.now()}_${file.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('consultation-attachments')
            .upload(`${user.id}/${fileName}`, file);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            toast({
              title: "Erro no upload",
              description: `Erro ao fazer upload do arquivo ${file.name}`,
              variant: "destructive",
            });
            continue;
          }

          uploadedFiles.push({
            name: file.name,
            path: uploadData.path,
            size: file.size,
            type: file.type
          });
        }
      }

      // Determine status based on date comparison
      const originalDate = new Date(originalConsultation.created_at || '').toDateString();
      const currentDate = new Date().toDateString();
      const status = originalDate === currentDate ? 'atualizada' : 'reaberta';

      // Create consultation data for Gemini API
      const consultationData = {
        user_id: user.id,
        symptoms: [newSymptoms],
        attachments: uploadedFiles,
        consulta_original_id: originalConsultation.id,
        status: status,
        original_consultation: {
          symptoms: originalConsultation.symptoms,
          ai_response: originalConsultation.ai_response,
          created_at: originalConsultation.created_at
        }
      };

      // Call Gemini consultation function
      const { data: consultationResponse, error: consultationError } = await supabase.functions
        .invoke('gemini-consultation', {
          body: consultationData
        });

      if (consultationError) {
        throw consultationError;
      }

      toast({
        title: "Sucesso",
        description: `Consulta ${status} com sucesso!`,
      });

      // Reset form
      setNewSymptoms("");
      setFiles([]);
      onOpenChange(false);
      onSuccess();

    } catch (error) {
      console.error('Error reopening consultation:', error);
      toast({
        title: "Erro",
        description: "Erro ao reabrir consulta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Reabrir Consulta</DialogTitle>
          <DialogDescription>
            Adicione novas informações para atualizar ou reabrir esta consulta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Original consultation info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Consulta Original:</h4>
            <p className="text-sm text-muted-foreground">
              <strong>Data:</strong> {originalConsultation.created_at 
                ? new Date(originalConsultation.created_at).toLocaleDateString('pt-BR')
                : 'Não disponível'
              }
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              <strong>Sintomas:</strong> {originalConsultation.symptoms?.join(', ') || 'Não informado'}
            </p>
          </div>

          {/* New symptoms field */}
          <div className="space-y-2">
            <Label htmlFor="new-symptoms">Novos sintomas ou justificativa *</Label>
            <Textarea
              id="new-symptoms"
              placeholder="Descreva os novos sintomas, evolução do quadro ou justificativa para reavaliar a consulta..."
              value={newSymptoms}
              onChange={(e) => setNewSymptoms(e.target.value)}
              rows={4}
            />
          </div>

          {/* File upload */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Novos exames (opcional)</Label>
            <div className="border border-dashed border-border rounded-lg p-4">
              <Input
                id="file-upload"
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Aceita imagens (JPG, PNG) e PDFs. Máximo 5MB por arquivo.
              </p>
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="space-y-2">
                <Label>Arquivos selecionados:</Label>
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted/30 p-2 rounded">
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'Enviar Reavaliação'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReopenConsultationModal;