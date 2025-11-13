import { Button } from "@/components/ui/button";
import { GripVertical, Pencil, Trash2, DollarSign } from "lucide-react";
import { Product } from "@/lib/productsStore";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ProductListItemProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onMarkAsSold: (product: Product) => void;
}

const ProductListItem = ({ product, onEdit, onDelete, onMarkAsSold }: ProductListItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg hover:shadow-md transition-shadow"
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <img
        src={product.images[0]}
        alt={product.name}
        className="w-16 h-16 object-cover rounded border border-border"
      />

      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-foreground truncate">{product.name}</h4>
        <p className="text-sm text-muted-foreground">
          {product.brand} • {product.category}
        </p>
        <p className="text-sm font-medium text-primary">
          R$ {product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          size="icon"
          variant="default"
          onClick={() => onMarkAsSold(product)}
          title="Marcar como vendido"
        >
          <DollarSign className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={() => onEdit(product)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="destructive"
          onClick={() => onDelete(product.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ProductListItem;
