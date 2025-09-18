import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Image, Save, RefreshCw, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PageContent {
  id: string;
  slug: string;
  titulo: string;
  conteudo_texto: string;
  url_imagem?: string;
}

interface SaibaMaisCard {
  id: string;
  titulo: string;
  descricao?: string;
  url_imagem: string;
  ordem: number;
  ativo: boolean;
}

const SaibaMaisManagement = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pageContent, setPageContent] = useState<PageContent | null>(null);
  const [cards, setCards] = useState<SaibaMaisCard[]>([]);
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<SaibaMaisCard | null>(null);
  
  // Page content form
  const [pageTitle, setPageTitle] = useState("");
  const [pageText, setPageText] = useState("");
  const [pageImage, setPageImage] = useState("");
  
  // Card form
  const [cardTitle, setCardTitle] = useState("");
  const [cardDescription, setCardDescription] = useState("");
  const [cardImage, setCardImage] = useState("");
  const [cardOrder, setCardOrder] = useState(0);
  const [cardActive, setCardActive] = useState(true);

  useEffect(() => {
    fetchPageContent();
    fetchCards();
  }, []);

  const fetchPageContent = async () => {
    try {
      const { data, error } = await supabase
        .from('paginas_conteudo')
        .select('*')
        .eq('slug', 'saiba-mais')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching page content:', error);
        return;
      }

      if (data) {
        setPageContent(data);
        setPageTitle(data.titulo);
        setPageText(data.conteudo_texto);
        setPageImage(data.url_imagem || "");
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  const fetchCards = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('saiba_mais_cards')
        .select('*')
        .order('ordem', { ascending: true });

      if (error) {
        console.error('Error fetching cards:', error);
        return;
      }

      setCards(data || []);
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  const handleSavePageContent = async () => {
    setLoading(true);
    
    try {
      const contentData = {
        slug: 'saiba-mais',
        titulo: pageTitle,
        conteudo_texto: pageText,
        url_imagem: pageImage || null
      };

      if (pageContent) {
        const { error } = await supabase
          .from('paginas_conteudo')
          .update(contentData)
          .eq('id', pageContent.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('paginas_conteudo')
          .insert(contentData);

        if (error) throw error;
      }

      await fetchPageContent();
      
      toast({
        title: "Conteúdo salvo",
        description: "O conteúdo da página foi atualizado com sucesso.",
      });
    } catch (error) {
      console.error('Error saving page content:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o conteúdo da página.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCard = async () => {
    setLoading(true);
    
    try {
      const cardData = {
        titulo: cardTitle,
        descricao: cardDescription || null,
        url_imagem: cardImage,
        ordem: cardOrder,
        ativo: cardActive
      };

      if (editingCard) {
        const { error } = await (supabase as any)
          .from('saiba_mais_cards')
          .update(cardData)
          .eq('id', editingCard.id);

        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('saiba_mais_cards')
          .insert(cardData);

        if (error) throw error;
      }

      await fetchCards();
      resetCardForm();
      setIsCardDialogOpen(false);
      
      toast({
        title: "Card salvo",
        description: `Card ${editingCard ? 'atualizado' : 'criado'} com sucesso.`,
      });
    } catch (error) {
      console.error('Error saving card:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o card.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este card?")) {
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('saiba_mais_cards')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchCards();
      
      toast({
        title: "Card excluído",
        description: "O card foi removido com sucesso.",
      });
    } catch (error) {
      console.error('Error deleting card:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o card.",
        variant: "destructive",
      });
    }
  };

  const resetCardForm = () => {
    setCardTitle("");
    setCardDescription("");
    setCardImage("");
    setCardOrder(cards.length);
    setCardActive(true);
    setEditingCard(null);
  };

  const openEditCard = (card: SaibaMaisCard) => {
    setEditingCard(card);
    setCardTitle(card.titulo);
    setCardDescription(card.descricao || "");
    setCardImage(card.url_imagem);
    setCardOrder(card.ordem);
    setCardActive(card.ativo);
    setIsCardDialogOpen(true);
  };

  const openNewCard = () => {
    resetCardForm();
    setIsCardDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Content Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Conteúdo da Página Saiba Mais
          </CardTitle>
          <CardDescription>
            Gerencie o conteúdo principal da página Saiba Mais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pageTitle">Título da Página</Label>
            <Input
              id="pageTitle"
              value={pageTitle}
              onChange={(e) => setPageTitle(e.target.value)}
              placeholder="Digite o título da página"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pageText">Conteúdo do Texto</Label>
            <Textarea
              id="pageText"
              value={pageText}
              onChange={(e) => setPageText(e.target.value)}
              rows={6}
              placeholder="Digite o conteúdo da página..."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pageImage">URL da Imagem (opcional)</Label>
            <Input
              id="pageImage"
              value={pageImage}
              onChange={(e) => setPageImage(e.target.value)}
              placeholder="https://exemplo.com/imagem.jpg"
            />
          </div>

          <Button onClick={handleSavePageContent} disabled={loading}>
            {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar Conteúdo da Página
          </Button>
        </CardContent>
      </Card>

      {/* Cards Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Cards de Imagem
              </CardTitle>
              <CardDescription>
                Gerencie os cards de imagem da página Saiba Mais
              </CardDescription>
            </div>
            <Dialog open={isCardDialogOpen} onOpenChange={setIsCardDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewCard}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Card
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCard ? 'Editar Card' : 'Novo Card'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCard ? 'Edite as informações do card' : 'Adicione um novo card de imagem'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardTitle">Título</Label>
                    <Input
                      id="cardTitle"
                      value={cardTitle}
                      onChange={(e) => setCardTitle(e.target.value)}
                      placeholder="Título do card"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cardDescription">Descrição (opcional)</Label>
                    <Textarea
                      id="cardDescription"
                      value={cardDescription}
                      onChange={(e) => setCardDescription(e.target.value)}
                      rows={3}
                      placeholder="Descrição do card..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cardImage">URL da Imagem</Label>
                    <Input
                      id="cardImage"
                      value={cardImage}
                      onChange={(e) => setCardImage(e.target.value)}
                      placeholder="https://exemplo.com/imagem.jpg"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cardOrder">Ordem de Exibição</Label>
                    <Input
                      id="cardOrder"
                      type="number"
                      value={cardOrder}
                      onChange={(e) => setCardOrder(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label>Card Ativo</Label>
                      <p className="text-sm text-muted-foreground">
                        Define se o card será exibido na página
                      </p>
                    </div>
                    <Switch
                      checked={cardActive}
                      onCheckedChange={setCardActive}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleSaveCard} disabled={loading} className="flex-1">
                      {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      {editingCard ? 'Atualizar' : 'Criar'} Card
                    </Button>
                    <Button variant="outline" onClick={() => setIsCardDialogOpen(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {cards.length === 0 ? (
            <div className="text-center py-8">
              <Image className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum card criado ainda</p>
              <p className="text-sm text-muted-foreground">Clique em "Novo Card" para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cards.map((card) => (
                <div key={card.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <img 
                      src={card.url_imagem} 
                      alt={card.titulo}
                      className="w-16 h-16 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                    <div>
                      <h4 className="font-semibold">{card.titulo}</h4>
                      {card.descricao && (
                        <p className="text-sm text-muted-foreground">{card.descricao}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">Ordem: {card.ordem}</Badge>
                        <Badge variant={card.ativo ? "default" : "destructive"}>
                          {card.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditCard(card)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteCard(card.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SaibaMaisManagement;