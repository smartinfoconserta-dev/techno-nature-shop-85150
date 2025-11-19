import { useState, useEffect } from "react";
import { Plus, Trash2, CheckCircle, XCircle, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { bannersStore, Banner } from "@/lib/bannersStore";
import { Dialog, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  StickyDialogContent, 
  DialogHeader, 
  DialogFooter 
} from "@/components/ui/sticky-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const BannersTab = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [deletingBanner, setDeletingBanner] = useState<Banner | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState("");
  const [desktopImageFile, setDesktopImageFile] = useState<File | null>(null);
  const [mobileImageFile, setMobileImageFile] = useState<File | null>(null);
  const [desktopImagePreview, setDesktopImagePreview] = useState<string | null>(null);
  const [mobileImagePreview, setMobileImagePreview] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [overlayColor, setOverlayColor] = useState("#000000");
  const [overlayOpacity, setOverlayOpacity] = useState(30);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      await bannersStore.refreshFromBackend();
      setBanners(bannersStore.getAllBanners());
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar banners",
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  };

  const handleDesktopFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, selecione uma imagem válida",
      });
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB",
      });
      return;
    }

    setDesktopImageFile(file);

    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setDesktopImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleMobileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, selecione uma imagem válida",
      });
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB",
      });
      return;
    }

    setMobileImageFile(file);

    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setMobileImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, insira um título",
      });
      return;
    }

    if (!desktopImageFile) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, selecione pelo menos a imagem para desktop",
      });
      return;
    }

    setUploading(true);
    try {
      await bannersStore.uploadBanner(
        desktopImageFile,
        mobileImageFile,
        title,
        isActive,
        overlayColor,
        overlayOpacity
      );
      toast({
        title: "Banner adicionado!",
        description: "O banner foi cadastrado com sucesso.",
      });
      resetForm();
      setShowDialog(false);
      await loadBanners();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar banner",
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await bannersStore.setActiveBanner(id);
      toast({
        title: "Banner ativado!",
        description: "O banner agora está sendo exibido na página inicial.",
      });
      await loadBanners();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao ativar banner",
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await bannersStore.deactivateBanner(id);
      toast({
        title: "Banner desativado",
        description: "O banner não está mais sendo exibido.",
      });
      await loadBanners();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao desativar banner",
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBanner) return;

    try {
      await bannersStore.deleteBanner(deletingBanner.id);
      toast({
        title: "Banner excluído",
        description: "O banner foi removido do sistema.",
      });
      setDeletingBanner(null);
      await loadBanners();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir banner",
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  };

  const resetForm = () => {
    setTitle("");
    setDesktopImageFile(null);
    setMobileImageFile(null);
    setDesktopImagePreview(null);
    setMobileImagePreview(null);
    setIsActive(false);
    setOverlayColor("#000000");
    setOverlayOpacity(30);
  };

  const presetColors = [
    { name: "Preto", value: "#000000" },
    { name: "Branco", value: "#FFFFFF" },
    { name: "Verde", value: "#00ff00" },
    { name: "Vermelho", value: "#ff0000" },
    { name: "Azul", value: "#0000ff" },
    { name: "Roxo", value: "#8b5cf6" },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">Gerenciar Banners</h2>
        <Button
          onClick={() => {
            resetForm();
            setShowDialog(true);
          }}
          size="sm"
          className="md:size-default"
        >
          <Plus className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
          Novo Banner
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {banners.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-sm md:text-base">
              Nenhum banner cadastrado
            </p>
          </div>
        ) : (
          banners.map((banner) => (
            <Card key={banner.id} className="overflow-hidden">
              <div className="aspect-video relative">
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
                {banner.is_active && (
                  <Badge className="absolute top-2 right-2 bg-green-600">
                    Ativo
                  </Badge>
                )}
              </div>
              <div className="p-4 space-y-3">
                <h3 className="font-semibold text-foreground truncate">{banner.title}</h3>
                <div className="flex gap-2">
                  {banner.is_active ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeactivate(banner.id)}
                      className="flex-1"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Desativar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleActivate(banner.id)}
                      className="flex-1"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Ativar
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeletingBanner(banner)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Dialog para adicionar banner */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <StickyDialogContent 
          maxWidth="2xl"
          header={
            <DialogHeader>
              <DialogTitle>Adicionar Novo Banner</DialogTitle>
              <DialogDescription>
                Faça upload de uma imagem para o banner da página inicial
              </DialogDescription>
            </DialogHeader>
          }
          footer={
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={uploading}>
                {uploading ? "Enviando..." : "Adicionar Banner"}
              </Button>
            </DialogFooter>
          }
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Promoção de Verão"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desktop-image" className="flex items-center gap-2">
                🖥️ Imagem Desktop
                <span className="text-xs text-muted-foreground font-normal">
                  (Obrigatório)
                </span>
              </Label>
              <Input
                id="desktop-image"
                type="file"
                accept="image/*"
                onChange={handleDesktopFileChange}
              />
              <p className="text-xs text-muted-foreground">
                Tamanho recomendado: 1920x1080px. Máximo: 5MB
              </p>
            </div>

            {desktopImagePreview && (
              <div className="space-y-2">
                <Label>Preview Desktop</Label>
                <div className="aspect-video relative rounded-lg overflow-hidden border">
                  <img
                    src={desktopImagePreview}
                    alt="Preview Desktop"
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundColor: overlayColor,
                      opacity: overlayOpacity / 100,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="mobile-image" className="flex items-center gap-2">
                📱 Imagem Mobile
                <span className="text-xs text-muted-foreground font-normal">
                  (Opcional - se não fornecida, usará a imagem desktop)
                </span>
              </Label>
              <Input
                id="mobile-image"
                type="file"
                accept="image/*"
                onChange={handleMobileFileChange}
              />
              <p className="text-xs text-muted-foreground">
                Tamanho recomendado: 750x1000px (vertical). Máximo: 5MB
              </p>
            </div>

            {mobileImagePreview && (
              <div className="space-y-2">
                <Label>Preview Mobile</Label>
                <div className="aspect-[3/4] max-w-xs relative rounded-lg overflow-hidden border">
                  <img
                    src={mobileImagePreview}
                    alt="Preview Mobile"
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundColor: overlayColor,
                      opacity: overlayOpacity / 100,
                    }}
                  />
                </div>
              </div>
            )}

            {(desktopImagePreview || mobileImagePreview) && (
              <>
                <div className="space-y-3">
                  <Label>Cor da Máscara</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {presetColors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setOverlayColor(color.value)}
                        className={`h-12 rounded-lg border-2 transition-all ${
                          overlayColor === color.value
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-border hover:border-primary/50"
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      >
                        <span className="sr-only">{color.name}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 items-center">
                    <Label htmlFor="customColor" className="text-xs text-muted-foreground">
                      Cor customizada:
                    </Label>
                    <Input
                      id="customColor"
                      type="color"
                      value={overlayColor}
                      onChange={(e) => setOverlayColor(e.target.value)}
                      className="w-16 h-8 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="opacity">Opacidade da Máscara</Label>
                    <span className="text-sm font-medium text-muted-foreground">
                      {overlayOpacity}%
                    </span>
                  </div>
                  <input
                    id="opacity"
                    type="range"
                    min="0"
                    max="100"
                    value={overlayOpacity}
                    onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <p className="text-xs text-muted-foreground">
                    0% = sem máscara, 100% = totalmente opaco
                  </p>
                </div>
              </>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="active"
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(checked as boolean)}
              />
              <Label htmlFor="active" className="cursor-pointer">
                Definir como banner ativo
              </Label>
            </div>
          </div>
        </StickyDialogContent>
      </Dialog>

      {/* Dialog de confirmação para exclusão */}
      <AlertDialog open={!!deletingBanner} onOpenChange={() => setDeletingBanner(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir o banner "{deletingBanner?.title}". Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BannersTab;
