import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Edit, Trash2, FileText, MessageSquare, ChevronRight, Folder, FolderOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import PageEditor from "./PageEditor";

interface Page {
  id: string;
  title: string;
  slug: string;
  content: any;
  page_type: 'informative' | 'interactive';
  parent_id?: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
  children?: Page[];
}

const PageManagement = () => {
  const { user } = useAuth();
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newPageData, setNewPageData] = useState({
    title: '',
    slug: '',
    page_type: 'informative' as 'informative' | 'interactive',
    parent_id: undefined as string | undefined,
    content: {}
  });
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('order_index');

      if (error) throw error;

      // Organize pages into hierarchy
      const organized = organizePages((data || []) as Page[]);
      setPages(organized);
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast.error('Erro ao carregar páginas');
    }
  };

  const organizePages = (pages: Page[]): Page[] => {
    const pageMap = new Map<string, Page>();
    const rootPages: Page[] = [];

    // Create map of all pages
    pages.forEach(page => {
      pageMap.set(page.id, { ...page, children: [] });
    });

    // Organize hierarchy
    pages.forEach(page => {
      const pageWithChildren = pageMap.get(page.id)!;
      
      if (page.parent_id) {
        const parent = pageMap.get(page.parent_id);
        if (parent) {
          parent.children!.push(pageWithChildren);
        }
      } else {
        rootPages.push(pageWithChildren);
      }
    });

    return rootPages;
  };

  const createPage = async () => {
    if (!user || !newPageData.title || !newPageData.slug) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const { error } = await supabase
        .from('pages')
        .insert({
          title: newPageData.title,
          slug: newPageData.slug,
          page_type: newPageData.page_type,
          parent_id: newPageData.parent_id || null,
          content: newPageData.content,
          created_by: user.id,
          order_index: 0
        });

      if (error) throw error;

      toast.success('Página criada com sucesso');
      setIsCreateDialogOpen(false);
      setNewPageData({
        title: '',
        slug: '',
        page_type: 'informative',
        parent_id: undefined,
        content: {}
      });
      fetchPages();
    } catch (error) {
      console.error('Error creating page:', error);
      toast.error('Erro ao criar página');
    }
  };

  const deletePage = async (pageId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta página? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', pageId);

      if (error) throw error;

      toast.success('Página excluída com sucesso');
      fetchPages();
    } catch (error) {
      console.error('Error deleting page:', error);
      toast.error('Erro ao excluir página');
    }
  };

  const togglePageExpansion = (pageId: string) => {
    const newExpanded = new Set(expandedPages);
    if (newExpanded.has(pageId)) {
      newExpanded.delete(pageId);
    } else {
      newExpanded.add(pageId);
    }
    setExpandedPages(newExpanded);
  };

  const renderPageTree = (pageList: Page[], level: number = 0) => {
    return pageList.map((page) => (
      <div key={page.id} className={`${level > 0 ? 'ml-6' : ''}`}>
        <Card className="mb-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {page.children && page.children.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePageExpansion(page.id)}
                  >
                    {expandedPages.has(page.id) ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                  </Button>
                )}
                {page.page_type === 'informative' ? 
                  <FileText className="w-5 h-5 text-blue-600" /> : 
                  <MessageSquare className="w-5 h-5 text-green-600" />
                }
                <div>
                  <CardTitle className="text-base">{page.title}</CardTitle>
                  <CardDescription>/{page.slug}</CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={page.page_type === 'informative' ? 'default' : 'secondary'}>
                  {page.page_type === 'informative' ? 'Informativa' : 'Interativa'}
                </Badge>
                <Badge variant={page.is_active ? 'outline' : 'destructive'}>
                  {page.is_active ? 'Ativa' : 'Inativa'}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedPage(page);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deletePage(page.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
        
        {page.children && page.children.length > 0 && expandedPages.has(page.id) && (
          <div className="ml-4 border-l-2 border-muted pl-4">
            {renderPageTree(page.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const flattenPages = (pageList: Page[]): Page[] => {
    let flattened: Page[] = [];
    pageList.forEach(page => {
      flattened.push(page);
      if (page.children && page.children.length > 0) {
        flattened = [...flattened, ...flattenPages(page.children)];
      }
    });
    return flattened;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gerenciar Páginas</h2>
          <p className="text-muted-foreground">
            Crie e gerencie páginas informativas e interativas do site
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Criar Página
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Nova Página</DialogTitle>
              <DialogDescription>
                Escolha o tipo de página e configure os detalhes básicos
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título da Página</Label>
                <Input
                  id="title"
                  value={newPageData.title}
                  onChange={(e) => setNewPageData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Digite o título da página"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="slug">URL da Página</Label>
                <Input
                  id="slug"
                  value={newPageData.slug}
                  onChange={(e) => setNewPageData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="url-da-pagina"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="page_type">Tipo da Página</Label>
                <Select
                  value={newPageData.page_type}
                  onValueChange={(value) => setNewPageData(prev => ({ ...prev, page_type: value as 'informative' | 'interactive' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="informative">Informativa</SelectItem>
                    <SelectItem value="interactive">Interativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parent">Página Pai (Opcional)</Label>
                <Select
                  value={newPageData.parent_id || undefined}
                  onValueChange={(value) => setNewPageData(prev => ({ ...prev, parent_id: value || undefined }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma página pai ou deixe vazio para página principal" />
                  </SelectTrigger>
                  <SelectContent>
                    {flattenPages(pages).map((page) => (
                      <SelectItem key={page.id} value={page.id}>
                        {page.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={createPage} className="w-full">
                Criar Página
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      <div className="space-y-4">
        {pages.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma página encontrada</h3>
              <p className="text-muted-foreground mb-4">
                Comece criando sua primeira página
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Página
              </Button>
            </CardContent>
          </Card>
        ) : (
          renderPageTree(pages)
        )}
      </div>

      {selectedPage && (
        <PageEditor
          page={selectedPage}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setSelectedPage(null);
          }}
          onSave={() => {
            fetchPages();
            setIsEditDialogOpen(false);
            setSelectedPage(null);
          }}
        />
      )}
    </div>
  );
};

export default PageManagement;