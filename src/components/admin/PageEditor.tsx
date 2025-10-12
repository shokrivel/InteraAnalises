import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Image, Video, Link, FileText, MessageSquare, Timer, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PageComponent {
  id: string;
  component_type: 'text' | 'image' | 'video' | 'card_slider' | 'quiz' | 'external_link' | 'filter';
  content: any;
  order_index: number;
  is_active: boolean;
}

interface Page {
  id: string;
  title: string;
  slug: string;
  content: any;
  page_type: 'informative' | 'interactive';
  parent_id?: string;
  is_active: boolean;
  order_index: number;
}

interface PageEditorProps {
  page: Page;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const PageEditor = ({ page, isOpen, onClose, onSave }: PageEditorProps) => {
  const [pageData, setPageData] = useState<Page>(page);
  const [components, setComponents] = useState<PageComponent[]>([]);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (isOpen && page.id) {
      fetchPageComponents();
      setPageData(page);
    }
  }, [isOpen, page]);

  const fetchPageComponents = async () => {
    try {
      const { data, error } = await supabase
        .from('page_components')
        .select('*')
        .eq('page_id', page.id as any)
        .order('order_index');

      if (error) throw error;
      setComponents((data || []) as unknown as PageComponent[]);
    } catch (error) {
      console.error('Error fetching page components:', error);
      toast.error('Erro ao carregar componentes da página');
    }
  };

  const savePage = async () => {
    try {
      const { error } = await supabase
        .from('pages')
        .update({
          title: pageData.title,
          slug: pageData.slug,
          content: pageData.content as any,
          is_active: pageData.is_active
        } as any)
        .eq('id', pageData.id as any);

      if (error) throw error;

      toast.success('Página salva com sucesso');
      onSave();
    } catch (error) {
      console.error('Error saving page:', error);
      toast.error('Erro ao salvar página');
    }
  };

  const addComponent = async (componentType: PageComponent['component_type']) => {
    try {
      const newComponent = {
        page_id: pageData.id,
        component_type: componentType,
        content: getDefaultContent(componentType),
        order_index: components.length,
        is_active: true
      };

      const { error } = await supabase
        .from('page_components')
        .insert(newComponent as any);

      if (error) throw error;

      toast.success('Componente adicionado');
      fetchPageComponents();
    } catch (error) {
      console.error('Error adding component:', error);
      toast.error('Erro ao adicionar componente');
    }
  };

  const updateComponent = async (componentId: string, updates: Partial<PageComponent>) => {
    try {
      const { error } = await supabase
        .from('page_components')
        .update(updates as any)
        .eq('id', componentId as any);

      if (error) throw error;

      fetchPageComponents();
    } catch (error) {
      console.error('Error updating component:', error);
      toast.error('Erro ao atualizar componente');
    }
  };

  const deleteComponent = async (componentId: string) => {
    try {
      const { error } = await supabase
        .from('page_components')
        .delete()
        .eq('id', componentId as any);

      if (error) throw error;

      toast.success('Componente removido');
      fetchPageComponents();
    } catch (error) {
      console.error('Error deleting component:', error);
      toast.error('Erro ao remover componente');
    }
  };

  const getDefaultContent = (type: PageComponent['component_type']) => {
    switch (type) {
      case 'text':
        return { html: '<p>Digite seu texto aqui...</p>' };
      case 'image':
        return { src: '', alt: '', caption: '' };
      case 'video':
        return { src: '', poster: '', caption: '' };
      case 'card_slider':
        return { cards: [], autoplay: true, interval: 5 };
      case 'quiz':
        return { questions: [], gemini_enabled: false };
      case 'external_link':
        return { url: '', title: '', description: '' };
      case 'filter':
        return { filters: [], target_components: [] };
      default:
        return {};
    }
  };

  const renderComponentEditor = (component: PageComponent) => {
    switch (component.component_type) {
      case 'text':
        return (
          <div className="space-y-4">
            <Label>Conteúdo do Texto</Label>
            <Textarea
              value={component.content.html || ''}
              onChange={(e) => updateComponent(component.id, {
                content: { ...component.content, html: e.target.value }
              })}
              placeholder="Digite o conteúdo HTML..."
              rows={8}
            />
          </div>
        );

      case 'image':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>URL da Imagem</Label>
              <Input
                value={component.content.src || ''}
                onChange={(e) => updateComponent(component.id, {
                  content: { ...component.content, src: e.target.value }
                })}
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label>Texto Alternativo</Label>
              <Input
                value={component.content.alt || ''}
                onChange={(e) => updateComponent(component.id, {
                  content: { ...component.content, alt: e.target.value }
                })}
                placeholder="Descrição da imagem"
              />
            </div>
            <div className="space-y-2">
              <Label>Legenda</Label>
              <Input
                value={component.content.caption || ''}
                onChange={(e) => updateComponent(component.id, {
                  content: { ...component.content, caption: e.target.value }
                })}
                placeholder="Legenda da imagem"
              />
            </div>
          </div>
        );

      case 'card_slider':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={component.content.autoplay || false}
                onCheckedChange={(checked) => updateComponent(component.id, {
                  content: { ...component.content, autoplay: checked }
                })}
              />
              <Label>Reprodução Automática</Label>
            </div>
            <div className="space-y-2">
              <Label>Intervalo (segundos)</Label>
              <Input
                type="number"
                value={component.content.interval || 5}
                onChange={(e) => updateComponent(component.id, {
                  content: { ...component.content, interval: parseInt(e.target.value) }
                })}
              />
            </div>
          </div>
        );

      case 'quiz':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={component.content.gemini_enabled || false}
                onCheckedChange={(checked) => updateComponent(component.id, {
                  content: { ...component.content, gemini_enabled: checked }
                })}
              />
              <Label>Integração com Gemini</Label>
            </div>
            <div className="space-y-2">
              <Label>Configurações do Quiz</Label>
              <Textarea
                value={JSON.stringify(component.content.questions || [], null, 2)}
                onChange={(e) => {
                  try {
                    const questions = JSON.parse(e.target.value);
                    updateComponent(component.id, {
                      content: { ...component.content, questions }
                    });
                  } catch (err) {
                    // Ignore invalid JSON
                  }
                }}
                placeholder="Configure as perguntas em formato JSON"
                rows={6}
              />
            </div>
          </div>
        );

      case 'external_link':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>URL do Link</Label>
              <Input
                value={component.content.url || ''}
                onChange={(e) => updateComponent(component.id, {
                  content: { ...component.content, url: e.target.value }
                })}
                placeholder="https://exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Título do Link</Label>
              <Input
                value={component.content.title || ''}
                onChange={(e) => updateComponent(component.id, {
                  content: { ...component.content, title: e.target.value }
                })}
                placeholder="Título do link"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={component.content.description || ''}
                onChange={(e) => updateComponent(component.id, {
                  content: { ...component.content, description: e.target.value }
                })}
                placeholder="Descrição do link"
              />
            </div>
          </div>
        );

      default:
        return <div>Tipo de componente não implementado</div>;
    }
  };

  const getComponentIcon = (type: PageComponent['component_type']) => {
    switch (type) {
      case 'text': return <FileText className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'card_slider': return <Timer className="w-4 h-4" />;
      case 'quiz': return <MessageSquare className="w-4 h-4" />;
      case 'external_link': return <Link className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {pageData.page_type === 'informative' ? 
              <FileText className="w-5 h-5" /> : 
              <MessageSquare className="w-5 h-5" />
            }
            <span>Editar Página: {pageData.title}</span>
          </DialogTitle>
          <DialogDescription>
            Configure o conteúdo e componentes da página
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="components">Componentes</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título da Página</Label>
                <Input
                  value={pageData.title}
                  onChange={(e) => setPageData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={pageData.slug}
                  onChange={(e) => setPageData(prev => ({ ...prev, slug: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={pageData.is_active}
                onCheckedChange={(checked) => setPageData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label>Página Ativa</Label>
            </div>

            <Button onClick={savePage} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Salvar Configurações
            </Button>
          </TabsContent>

          <TabsContent value="components" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Componentes da Página</h3>
              <div className="flex space-x-2">
                {pageData.page_type === 'informative' ? (
                  <>
                    <Button size="sm" onClick={() => addComponent('text')}>
                      <FileText className="w-4 h-4 mr-1" />
                      Texto
                    </Button>
                    <Button size="sm" onClick={() => addComponent('image')}>
                      <Image className="w-4 h-4 mr-1" />
                      Imagem
                    </Button>
                    <Button size="sm" onClick={() => addComponent('card_slider')}>
                      <Timer className="w-4 h-4 mr-1" />
                      Cards
                    </Button>
                    <Button size="sm" onClick={() => addComponent('external_link')}>
                      <Link className="w-4 h-4 mr-1" />
                      Link
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={() => addComponent('quiz')}>
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Quiz
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {components.map((component) => (
                <Card key={component.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getComponentIcon(component.component_type)}
                        <CardTitle className="text-sm">
                          {component.component_type.replace('_', ' ').toUpperCase()}
                        </CardTitle>
                        <Badge variant={component.is_active ? 'default' : 'secondary'}>
                          {component.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteComponent(component.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {renderComponentEditor(component)}
                  </CardContent>
                </Card>
              ))}
              
              {components.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Nenhum componente adicionado ainda
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default PageEditor;