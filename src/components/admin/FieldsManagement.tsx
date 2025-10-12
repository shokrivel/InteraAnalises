import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Save, X, Lock, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ConsultationField } from "@/hooks/useConsultationFields";
import { useRole } from "@/hooks/useRole";

const FIELD_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'textarea', label: 'Texto Longo' },
  { value: 'select', label: 'Seleção' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Data' },
  { value: 'aglomerado', label: 'Aglomerado' },
  { value: 'file_upload', label: 'Anexar Exames' },
  { value: 'imc', label: 'IMC (Peso e Altura)' }
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
  const [draggedField, setDraggedField] = useState<ConsultationField | null>(null);
  const { toast } = useToast();
  const { isAdmin, isModerator, hasAdminAccess } = useRole();

  const [formData, setFormData] = useState({
    field_name: '',
    field_label: '',
    field_type: 'text' as 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'date' | 'aglomerado' | 'file_upload' | 'imc',
    field_options: {} as any,
    required_for_levels: [] as string[],
    visible_for_levels: ['patient', 'academic', 'health_professional'] as string[],
    field_order: 0,
    is_active: true
  });

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      const { data, error } = await supabase
        .from('consultation_fields')
        .select('*')
        .order('field_order', { ascending: true });

      if (error) throw error;
      setFields((data || []) as unknown as ConsultationField[]);
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

  const resetForm = () => {
    setFormData({
      field_name: '',
      field_label: '',
      field_type: 'text',
      field_options: {} as any,
      required_for_levels: [],
      visible_for_levels: ['patient', 'academic', 'health_professional'],
      field_order: fields.length,
      is_active: true
    });
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingField(null);
    resetForm();
  };

  const handleEdit = (field: ConsultationField) => {
    setEditingField(field);
    setIsCreating(false);
    setFormData({
      field_name: field.field_name,
      field_label: field.field_label,
      field_type: field.field_type,
      field_options: field.field_options as any || {},
      required_for_levels: field.required_for_levels || [],
      visible_for_levels: field.visible_for_levels || ['patient', 'academic', 'health_professional'],
      field_order: field.field_order,
      is_active: field.is_active
    });
  };

  const handleSave = async () => {
    if (!formData.field_name || !formData.field_label) {
      toast({
        title: "Erro de validação",
        description: "Nome e rótulo são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingField) {
        const { error } = await supabase
          .from('consultation_fields')
          .update({
            field_label: formData.field_label,
            field_type: formData.field_type as any,
            field_options: formData.field_options as any,
            required_for_levels: formData.required_for_levels as any,
            visible_for_levels: formData.visible_for_levels as any,
            field_order: formData.field_order,
            is_active: formData.is_active
          } as any)
          .eq('id', editingField.id as any);

        if (error) throw error;

        toast({
          title: "Campo atualizado",
          description: "Campo atualizado com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from('consultation_fields')
          .insert({
            field_name: formData.field_name,
            field_label: formData.field_label,
            field_type: formData.field_type as any,
            field_options: formData.field_options as any,
            required_for_levels: formData.required_for_levels as any,
            visible_for_levels: formData.visible_for_levels as any,
            field_order: formData.field_order,
            is_active: formData.is_active
          } as any);

        if (error) throw error;

        toast({
          title: "Campo criado",
          description: "Campo criado com sucesso.",
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
        .eq('id', fieldId as any);

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

  const handleDragStart = (field: ConsultationField) => {
    setDraggedField(field);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetField: ConsultationField) => {
    if (!draggedField || draggedField.id === targetField.id) {
      setDraggedField(null);
      return;
    }

    const draggedIndex = fields.findIndex(f => f.id === draggedField.id);
    const targetIndex = fields.findIndex(f => f.id === targetField.id);

    const reorderedFields = [...fields];
    reorderedFields.splice(draggedIndex, 1);
    reorderedFields.splice(targetIndex, 0, draggedField);

    // Update field_order for all affected fields
    const updates = reorderedFields.map((field, index) => ({
      id: field.id,
      field_order: index
    }));

    try {
      // Update all fields in parallel
      await Promise.all(
        updates.map(update =>
          supabase
            .from('consultation_fields')
            .update({ field_order: update.field_order } as any)
            .eq('id', update.id as any)
        )
      );

      toast({
        title: "Ordem atualizada",
        description: "A ordem dos campos foi atualizada com sucesso.",
      });

      fetchFields();
    } catch (error: any) {
      toast({
        title: "Erro ao reordenar campos",
        description: error.message,
        variant: "destructive",
      });
    }

    setDraggedField(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Campos da Consulta
        </CardTitle>
        <CardDescription>
          Configure os campos que serão exibidos no formulário de consulta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Button onClick={handleCreate} disabled={isCreating || editingField !== null}>
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
                    onValueChange={(value) => setFormData(prev => ({ ...prev, field_type: value as any }))}
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
              </div>

              {(formData.field_type === 'select' || formData.field_type === 'aglomerado') && (
                <div className="space-y-4">
                  <Label>Opções do Campo</Label>
                  {formData.field_type === 'select' && (
                    <div className="space-y-2">
                      <Label htmlFor="select_options">Opções (uma por linha)</Label>
                      <Textarea
                        id="select_options"
                        value={formData.field_options?.options?.join('\n') || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          field_options: {
                            ...prev.field_options,
                            options: e.target.value.split('\n').filter(opt => opt.trim())
                          }
                        }))}
                        placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                        rows={4}
                      />
                    </div>
                  )}

                  {formData.field_type === 'aglomerado' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          Use " - " para separar os termos
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
                          Use " - " para separar os termos
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label>Visível para os níveis:</Label>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {PROFILE_LEVELS.map(level => (
                      <div key={level.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`visible_${level.value}`}
                          checked={formData.visible_for_levels.includes(level.value)}
                          onCheckedChange={(checked) => 
                            handleLevelChange(level.value, 'visible', checked as boolean)
                          }
                        />
                        <Label htmlFor={`visible_${level.value}`} className="text-sm">
                          {level.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Obrigatório para os níveis:</Label>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {PROFILE_LEVELS.map(level => (
                      <div key={level.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`required_${level.value}`}
                          checked={formData.required_for_levels.includes(level.value)}
                          onCheckedChange={(checked) => 
                            handleLevelChange(level.value, 'required', checked as boolean)
                          }
                        />
                        <Label htmlFor={`required_${level.value}`} className="text-sm">
                          {level.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, is_active: checked as boolean }))
                    }
                  />
                  <Label htmlFor="is_active">Campo ativo</Label>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="rounded-md border">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Nome
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Rótulo
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Tipo
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Níveis
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {fields.length === 0 ? (
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Nenhum campo encontrado
                    </td>
                  </tr>
                ) : (
                  fields.map((field) => (
                    <tr 
                      key={field.id} 
                      className="border-b transition-colors hover:bg-muted/50 cursor-move"
                      draggable={hasAdminAccess && !editingField && !isCreating}
                      onDragStart={() => handleDragStart(field)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(field)}
                    >
                      <td className="p-4 align-middle font-medium">
                        {field.field_name}
                      </td>
                      <td className="p-4 align-middle">
                        {field.field_label}
                      </td>
                      <td className="p-4 align-middle">
                        <Badge variant="outline">
                          {FIELD_TYPES.find(t => t.value === field.field_type)?.label || field.field_type}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex flex-wrap gap-1">
                          {field.visible_for_levels?.map(level => (
                            <Badge key={level} variant="secondary" className="text-xs">
                              {PROFILE_LEVELS.find(l => l.value === level)?.label || level}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <Badge variant={field.is_active ? "default" : "destructive"}>
                          {field.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle">
                        {hasAdminAccess ? (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(field)}
                              disabled={editingField !== null || isCreating}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(field.id)}
                              disabled={editingField !== null || isCreating}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Lock className="w-3 h-3" />
                            <span className="text-xs">Sem permissão</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FieldsManagement;