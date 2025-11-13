import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { productsStore, Product } from "@/lib/productsStore";
import ProductForm from "./ProductForm";
import ProductListItem from "./ProductListItem";
import MarkAsSoldDialog from "./MarkAsSoldDialog";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

const ProductsTab = () => {
  const [products, setProducts] = useState<Product[]>(productsStore.getAvailableProducts());
  const [isFormOpen, setIsFormOpen] = useState(() => {
    return sessionStorage.getItem('admin.products.isFormOpen') === 'true';
  });
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  const [isMarkAsSoldOpen, setIsMarkAsSoldOpen] = useState(false);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Persistir estado do formulário
  useEffect(() => {
    sessionStorage.setItem('admin.products.isFormOpen', isFormOpen.toString());
  }, [isFormOpen]);

  const loadProducts = () => {
    setProducts(productsStore.getAvailableProducts());
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setProducts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        productsStore.reorderProducts(newOrder);
        
        toast({
          title: "Ordem atualizada",
          description: "A ordem dos produtos foi salva.",
        });
        
        return newOrder;
      });
    }
  };

  const handleSave = async (data: Omit<Product, "id" | "order" | "sold" | "expenses" | "createdAt">) => {
    try {
      if (editingProduct) {
        await productsStore.updateProduct(editingProduct.id, data);
        toast({
          title: "Produto atualizado!",
          description: `${data.name} foi atualizado com sucesso.`,
        });
      } else {
        await productsStore.addProduct(data);
        toast({
          title: "Produto criado!",
          description: `${data.name} foi adicionado ao catálogo.`,
        });
      }
      
      setIsFormOpen(false);
      setEditingProduct(undefined);
      sessionStorage.removeItem('admin.products.isFormOpen');
      sessionStorage.removeItem('product-form-draft');
      loadProducts();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar produto",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      const product = products.find((p) => p.id === id);
      try {
        await productsStore.deleteProduct(id);
        toast({
          title: "Produto excluído",
          description: `${product?.name} foi removido do catálogo.`,
        });
        loadProducts();
      } catch (error) {
        toast({
          title: "Erro",
          description: error instanceof Error ? error.message : "Erro ao excluir produto",
          variant: "destructive",
        });
      }
    }
  };

  const handleMarkAsSold = (product: Product) => {
    setSelectedProduct(product);
    setIsMarkAsSoldOpen(true);
  };

  const handleMarkAsSoldConfirm = async (
    buyerName: string,
    buyerCpf: string,
    cash: number,
    pix: number,
    card: number,
    warranty: number,
    warrantyExpires?: string
  ) => {
    if (!selectedProduct) return;

    try {
      await productsStore.markAsSold(
        selectedProduct.id,
        buyerName,
        buyerCpf,
        cash,
        pix,
        card,
        warranty,
        warrantyExpires
      );

      toast({
        title: "Produto vendido!",
        description: `${selectedProduct.name} foi marcado como vendido.`,
      });

      setIsMarkAsSoldOpen(false);
      setSelectedProduct(undefined);
      loadProducts();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao marcar produto como vendido",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    const hasDraft = sessionStorage.getItem('product-form-draft');
    if (hasDraft) {
      if (confirm("Descartar rascunho? Seus dados não salvos serão perdidos.")) {
        sessionStorage.removeItem('product-form-draft');
        sessionStorage.removeItem('admin.products.isFormOpen');
        setIsFormOpen(false);
        setEditingProduct(undefined);
      }
    } else {
      sessionStorage.removeItem('admin.products.isFormOpen');
      setIsFormOpen(false);
      setEditingProduct(undefined);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Produtos</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie seu catálogo de produtos
          </p>
        </div>
        {!isFormOpen && (
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        )}
      </div>

      {isFormOpen ? (
        <ProductForm
          product={editingProduct}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ) : (
        <div className="space-y-4">
          {products.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg border border-border">
              <p className="text-muted-foreground">
                Nenhum produto cadastrado ainda.
              </p>
              <Button onClick={() => setIsFormOpen(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Produto
              </Button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={products.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {products.map((product) => (
                    <ProductListItem
                      key={product.id}
                      product={product}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onMarkAsSold={handleMarkAsSold}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}

      {selectedProduct && (
        <MarkAsSoldDialog
          product={selectedProduct}
          open={isMarkAsSoldOpen}
          onOpenChange={setIsMarkAsSoldOpen}
          onConfirm={handleMarkAsSoldConfirm}
          onUpdate={loadProducts}
        />
      )}
    </div>
  );
};

export default ProductsTab;
