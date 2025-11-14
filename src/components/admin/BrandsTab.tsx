import { useState, useEffect } from "react";
import { Plus, Smartphone, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { brandsStore, Brand } from "@/lib/brandsStore";
import BrandListItem from "./BrandListItem";
import BrandForm from "./BrandForm";
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

const BrandsTab = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    const brands = await brandsStore.getAllBrands();
    setBrands(brands);
  };

  const handleSubmit = (name: string, category: "Notebooks" | "Celulares") => {
    try {
      if (editingBrand) {
        brandsStore.updateBrand(editingBrand.id, name, category);
        toast({
          title: "Marca atualizada!",
          description: "As alterações foram salvas com sucesso.",
        });
      } else {
        brandsStore.addBrand(name, category);
        toast({
          title: "Marca adicionada!",
          description: "A nova marca já está disponível no catálogo.",
        });
      }
      loadBrands();
      setShowForm(false);
      setEditingBrand(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar marca",
      });
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setShowForm(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingBrand) {
      brandsStore.deleteBrand(deletingBrand.id);
      toast({
        title: "Marca excluída",
        description: "A marca foi removida do sistema.",
      });
      loadBrands();
      setDeletingBrand(null);
    }
  };

  const cellphoneBrands = brands
    .filter(b => b.category === "Celulares")
    .sort((a, b) => a.name.localeCompare(b.name));

  const notebookBrands = brands
    .filter(b => b.category === "Notebooks")
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">Gerenciar Marcas</h2>
        <Button onClick={() => { setEditingBrand(null); setShowForm(true); }} size="sm" className="md:size-default">
          <Plus className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
          Nova Marca
        </Button>
      </div>

      <div className="space-y-6 md:space-y-8">
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center gap-2 text-base md:text-lg font-semibold text-foreground">
            <Smartphone className="h-4 w-4 md:h-5 md:w-5" />
            CELULARES
          </div>
          <div className="space-y-1.5 md:space-y-2">
            {cellphoneBrands.length === 0 ? (
              <p className="text-muted-foreground text-xs md:text-sm">Nenhuma marca de celular cadastrada</p>
            ) : (
              cellphoneBrands.map(brand => (
                <BrandListItem
                  key={brand.id}
                  brand={brand}
                  onEdit={handleEdit}
                  onDelete={setDeletingBrand}
                />
              ))
            )}
          </div>
        </div>

        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center gap-2 text-base md:text-lg font-semibold text-foreground">
            <Laptop className="h-4 w-4 md:h-5 md:w-5" />
            NOTEBOOKS
          </div>
          <div className="space-y-1.5 md:space-y-2">
            {notebookBrands.length === 0 ? (
              <p className="text-muted-foreground text-xs md:text-sm">Nenhuma marca de notebook cadastrada</p>
            ) : (
              notebookBrands.map(brand => (
                <BrandListItem
                  key={brand.id}
                  brand={brand}
                  onEdit={handleEdit}
                  onDelete={setDeletingBrand}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <BrandForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingBrand(null);
        }}
        onSubmit={handleSubmit}
        editingBrand={editingBrand}
      />

      <AlertDialog open={!!deletingBrand} onOpenChange={() => setDeletingBrand(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir a marca "{deletingBrand?.name}". Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BrandsTab;
