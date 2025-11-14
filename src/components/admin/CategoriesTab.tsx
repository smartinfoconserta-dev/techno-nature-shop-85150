import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { categoriesStore, Category } from "@/lib/categoriesStore";
import CategoryForm from "./CategoryForm";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ChevronRight } from "lucide-react";
import * as Icons from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

const CategoriesTab = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [subcategoriesByParent, setSubcategoriesByParent] = useState<Record<string, Category[]>>({});
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [selectedParentForNew, setSelectedParentForNew] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const allCats = await categoriesStore.getAllCategories();
    setCategories(allCats);

    const parents = await categoriesStore.getParentCategories();
    setParentCategories(parents);

    const subsBySeparent: Record<string, Category[]> = {};
    for (const parent of parents) {
      const subs = await categoriesStore.getSubCategories(parent.id);
      subsBySeparent[parent.id] = subs;
    }
    setSubcategoriesByParent(subsBySeparent);
  };

  const handleSubmit = async (name: string, icon: string, parentCategoryId: string | null = null) => {
    try {
      if (editingCategory) {
        await categoriesStore.updateCategory(editingCategory.id, name, icon);
        toast.success("Categoria atualizada com sucesso!");
      } else {
        await categoriesStore.addCategory(name, icon, parentCategoryId || selectedParentForNew);
        toast.success("Categoria adicionada com sucesso!");
      }
      await loadCategories();
      setFormOpen(false);
      setEditingCategory(null);
      setSelectedParentForNew(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar categoria");
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormOpen(true);
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    
    try {
      await categoriesStore.deleteCategory(categoryToDelete.id);
      toast.success("Categoria excluída com sucesso!");
      await loadCategories();
    } catch (error) {
      toast.error("Erro ao excluir categoria");
    } finally {
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleAddSubcategory = (parentId: string) => {
    setSelectedParentForNew(parentId);
    setEditingCategory(null);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Categorias</h2>
          <p className="text-muted-foreground">
            Adicione e gerencie as categorias do catálogo
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingCategory(null);
            setSelectedParentForNew(null);
            setFormOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      <div className="space-y-6">
        {/* Categorias Pai */}
        {parentCategories.map((parent) => {
          const ParentIconComponent = Icons[parent.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
          const subs = subcategoriesByParent[parent.id] || [];

          return (
            <Card key={parent.id} className="p-3 md:p-4">
              {/* Categoria Pai */}
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 pb-3 border-b gap-3">
                <div className="flex items-center gap-2 md:gap-3 flex-1">
                  <div className="p-1.5 md:p-2 bg-primary/10 rounded-md flex-shrink-0">
                    <ParentIconComponent className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base md:text-lg truncate">{parent.name}</h3>
                    <Badge variant="secondary" className="text-xs mt-1">{subs.length} subcategorias</Badge>
                  </div>
                </div>
                <div className="flex gap-1.5 md:gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 md:h-9 md:w-9"
                    onClick={() => handleEdit(parent)}
                  >
                    <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 md:h-9 md:w-9"
                    onClick={() => handleDeleteClick(parent)}
                  >
                    <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 md:h-9"
                    onClick={() => handleAddSubcategory(parent.id)}
                  >
                    <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 md:mr-1" />
                    <span className="hidden md:inline">Subcategoria</span>
                  </Button>
                </div>
              </div>

              {/* Subcategorias */}
              {subs.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 ml-0 md:ml-8">
                  {subs.map((sub) => {
                    const SubIconComponent = Icons[sub.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
                    return (
                      <div key={sub.id} className="flex items-center justify-between p-2 md:p-3 border rounded-md bg-muted/30">
                        <div className="flex items-center gap-1.5 md:gap-2 flex-1 min-w-0">
                          <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground flex-shrink-0" />
                          <div className="p-1 md:p-1.5 bg-background rounded-md flex-shrink-0">
                            <SubIconComponent className="w-3 h-3 md:w-4 md:h-4" />
                          </div>
                          <span className="text-xs md:text-sm font-medium truncate">{sub.name}</span>
                        </div>
                        <div className="flex gap-0.5 md:gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 md:h-7 md:w-7"
                            onClick={() => handleEdit(sub)}
                          >
                            <Pencil className="w-2.5 h-2.5 md:w-3 md:h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 md:h-7 md:w-7"
                            onClick={() => handleDeleteClick(sub)}
                          >
                            <Trash2 className="w-2.5 h-2.5 md:w-3 md:h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {formOpen && (
        <CategoryForm
          isOpen={formOpen}
          onClose={() => {
            setFormOpen(false);
            setEditingCategory(null);
            setSelectedParentForNew(null);
          }}
          onSubmit={handleSubmit}
          initialData={editingCategory ? {
            name: editingCategory.name,
            icon: editingCategory.icon,
            parentCategoryId: editingCategory.parentCategoryId,
          } : undefined}
          parentCategories={parentCategories}
          selectedParentForNew={selectedParentForNew}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria "{categoryToDelete?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CategoriesTab;
