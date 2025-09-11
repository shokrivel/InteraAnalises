import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ConsultationField } from "@/hooks/useConsultationFields";

const FIELD_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'textarea', label: 'Texto Longo' },
  { value: 'select', label: 'Seleção' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Data' },
  { value: 'aglomerado', label: 'Aglomerado' }
];

const PROFILE_LEVELS = [
  { value: 'patient', label: 'Paciente' },
  { value: 'academic', label: 'Acadêmico' },
  { value: 'health_professional', label: 'Profissional de Saúde' }
];

const FieldsManagement = () => {
  const [fields, setFields] = useState<ConsultationField[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<ConsultationField | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    field_name: '',
    field_label: '',
    field_type: 'text' as 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'date' | 'aglomerado',
    field_options: {},
    required_for_levels: [] as string[],
    visible_for_levels: ['patient', 'academic', 'health_professional'] as string[],
    field_order: 0,
    is_active: true
  });

  const fetchFields = async () => {
    try {
      const { data, error } = await supabase
        .from('consultation_fields')
        .select('*')
        .order('field_order', { ascending: true });

      if (error) throw error;
      setFields(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar campos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, []);

  const resetForm = () => {
    setFormData({
      field_name: '',
      field_label: '',
      field_type: 'text',
      field_options: {},
      required_for_levels: [],
      visible_for_levels: ['patient', 'academic', 'health_professional'],
      field_order: fields.length + 1,
      is_active: true
    });
  };

  const handleCreate = () => {
    resetForm();
    setIsCreating(true);
    setEditingField(null);
  };

  const handleEdit = (field: ConsultationField) => {
    setFormData({
      field_name: field.field_name,
      field_label: field.field_label,
      field_type: field.field_type,
      field_options: field.field_options || {},
      required_for_levels: field.required_for_levels,
      visible_for_levels: field.visible_for_levels,
      field_order: field.field_order,
      is_active: field.is_active
    });
    setEditingField(field);
    setIsCreating(false);
  };

  const handleSave = async () => {
    try {
      if (editingField) {
        // Update existing field
        const { error } = await supabase
          .from('consultation_fields')
          .update(formData)
          .eq('id', editingField.id);

        if (error) throw error;

        toast({
          title: "Campo atualizado",
          description: "Campo atualizado com sucesso.",
        });
      } else {
        // Create new field
        const { error } = await supabase
          .from('consultation_fields')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Campo criado",
          description: "Novo campo criado com sucesso.",
        });
      }

      fetchFields();
      setEditingField(null);
      setIsCreating(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar campo",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (fieldId: string) => {
    if (!confirm('Tem certeza que deseja excluir este campo?')) return;

    try {
      const { error } = await supabase
        .from('consultation_fields')
        .delete()
        .eq('id', fieldId);

      if (error) throw error;

      toast({
        title: "Campo excluído",
        description: "Campo excluído com sucesso.",
      });

      fetchFields();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir campo",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    setIsCreating(false);
    resetForm();
  };

  const handleLevelChange = (level: string, type: 'required' | 'visible', checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [`${type}_for_levels`]: checked 
        ? [...prev[`${type}_for_levels`], level]
        : prev[`${type}_for_levels`].filter(l => l !== level)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestão de Campos da Consulta</h2>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Campo
        </Button>
      </div>

      {(isCreating || editingField) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingField ? 'Editar Campo' : 'Criar Novo Campo'}
            </CardTitle>
            <CardDescription>
              Configure os campos que aparecerão na consulta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="field_name">Nome do Campo</Label>
                <Input
                  id="field_name"
                  value={formData.field_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, field_name: e.target.value }))}
                  placeholder="nome_do_campo"
                  disabled={!!editingField}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="field_label">Rótulo do Campo</Label>
                <Input
                  id="field_label"
                  value={formData.field_label}
                  onChange={(e) => setFormData(prev => ({ ...prev, field_label: e.target.value }))}
                  placeholder="Rótulo que aparece para o usuário"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="field_type">Tipo do Campo</Label>
                <Select
                  value={formData.field_type}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, field_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="field_order">Ordem</Label>
                <Input
                  id="field_order"
                  type="number"
                  value={formData.field_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, field_order: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            {/* Campos específicos para tipo "aglomerado" */}
            {formData.field_type === 'aglomerado' && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <h4 className="font-medium text-sm">Configuração do Campo Aglomerado</h4>
                <div className="space-y-2">
                  <Label htmlFor="scientific_terms">Palavras pré-definidas (científico)</Label>
                  <Textarea
                    id="scientific_terms"
                    value={formData.field_options?.scientific_terms || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      field_options: { 
                        ...prev.field_options, 
                        scientific_terms: e.target.value 
                      } 
                    }))}
                    placeholder="Cefaleia - Cólica abdominal - Dispneia"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Separe os termos com " - " (hífen com espaços)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lay_terms">Palavras pré-definidas (leigos)</Label>
                  <Textarea
                    id="lay_terms"
                    value={formData.field_options?.lay_terms || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      field_options: { 
                        ...prev.field_options, 
                        lay_terms: e.target.value 
                      } 
                    }))}
                    placeholder="Dor de cabeça - Dor de barriga - Falta de ar"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Separe os termos com " - " (hífen com espaços). Deve ter o mesmo número de termos que a lista científica.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Visível para:</Label>
                <div className="mt-2 space-y-2">
                  {PROFILE_LEVELS.map(level => (
                    <div key={level.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`visible-${level.value}`}
                        checked={formData.visible_for_levels.includes(level.value)}
                        onCheckedChange={(checked) => 
                          handleLevelChange(level.value, 'visible', checked as boolean)
                        }
                      />
                      <Label htmlFor={`visible-${level.value}`}>{level.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Obrigatório para:</Label>
                <div className="mt-2 space-y-2">
                  {PROFILE_LEVELS.map(level => (
                    <div key={level.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`required-${level.value}`}
                        checked={formData.required_for_levels.includes(level.value)}
                        onCheckedChange={(checked) => 
                          handleLevelChange(level.value, 'required', checked as boolean)
                        }
                      />
                      <Label htmlFor={`required-${level.value}`}>{level.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {fields.map((field) => (
          <Card key={field.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{field.field_label}</h3>
                    <Badge variant="outline">{FIELD_TYPES.find(t => t.value === field.field_type)?.label}</Badge>
                    {!field.is_active && (
                      <Badge variant="destructive">Inativo</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{field.field_name}</p>
                  <div className="flex gap-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Visível: </span>
                      {field.visible_for_levels.map(level => (
                        <Badge key={level} variant="secondary" className="text-xs mr-1">
                          {PROFILE_LEVELS.find(l => l.value === level)?.label}
                        </Badge>
                      ))}
                    </div>
                    {field.required_for_levels.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground">Obrigatório: </span>
                        {field.required_for_levels.map(level => (
                          <Badge key={level} variant="destructive" className="text-xs mr-1">
                            {PROFILE_LEVELS.find(l => l.value === level)?.label}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(field)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(field.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FieldsManagement;