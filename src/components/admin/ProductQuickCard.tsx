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
      className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] group"
      onClick={onClick}
    >
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
          <p className="text-lg font-bold text-foreground">
            {formatCurrency(product.price)}
          </p>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Disponível
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductQuickCard;
