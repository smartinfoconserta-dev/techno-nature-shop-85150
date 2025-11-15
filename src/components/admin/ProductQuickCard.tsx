import { Product } from "@/lib/productsStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface ProductQuickCardProps {
  product: Product;
  onClick: () => void;
}

const ProductQuickCard = ({ product, onClick }: ProductQuickCardProps) => {
  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <Card 
      className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group relative before:absolute before:inset-0 before:rounded-lg before:p-[2px] before:bg-gradient-to-br before:from-primary before:to-primary-purple before:opacity-0 hover:before:opacity-100 before:transition-opacity before:-z-10"
      onClick={onClick}
    >
      <div className="relative bg-card rounded-lg">
      <CardContent className="p-4 space-y-3">
        {/* Imagem */}
        <AspectRatio ratio={4 / 3}>
          <img
            src={product.images?.[0] || "/placeholder.svg"}
            alt={product.name}
            className="w-full h-full object-cover rounded-md"
          />
        </AspectRatio>

        {/* Nome */}
        <h4 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
          {product.name}
        </h4>

        {/* Marca */}
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <span>📱</span> {product.brand}
        </p>

        {/* Especificações */}
        {product.specs && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {product.specs}
          </p>
        )}

        {/* Preço */}
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold bg-gradient-to-r from-primary to-primary-purple bg-clip-text text-transparent">
            {formatCurrency(product.price)}
          </p>
          <Badge variant="outline" className="bg-gradient-to-r from-primary/10 to-primary-purple/10 border-primary/20 text-primary font-semibold">
            Disponível
          </Badge>
        </div>
      </CardContent>
      </div>
    </Card>
  );
};

export default ProductQuickCard;
