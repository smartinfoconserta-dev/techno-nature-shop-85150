import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/lib/brandsStore";

interface BrandListItemProps {
  brand: Brand;
  onEdit: (brand: Brand) => void;
  onDelete: (brand: Brand) => void;
}

const BrandListItem = ({ brand, onEdit, onDelete }: BrandListItemProps) => {
  return (
    <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors">
      <span className="text-foreground font-medium">{brand.name}</span>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(brand)}
          className="h-8 w-8"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(brand)}
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default BrandListItem;
