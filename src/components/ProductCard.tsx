import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Image } from "lucide-react";
import { useState } from "react";
import ProductGalleryDialog from "./ProductGalleryDialog";

interface ProductCardProps {
  id: string;
  images: string[];
  name: string;
  brand: string;
  specs: string;
  description: string;
  price: number;
  discountPrice?: number;
}

const ProductCard = ({ images, name, brand, specs, description, price, discountPrice }: ProductCardProps) => {
  const [coupon, setCoupon] = useState("");
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const isDiscountActive = coupon === "010203";
  const displayPrice = isDiscountActive && discountPrice ? discountPrice : price;
  const mainImage = images[0] || "/placeholder.svg";
  const hasMultipleImages = images.length > 1;

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(`Olá! Tenho interesse no produto: ${name} - ${brand}`);
    window.open(`https://wa.me/5511999999999?text=${message}`, "_blank");
  };

  return (
    <>
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-[--card-shadow-hover] shadow-[--card-shadow]">
        <div 
          className="aspect-square overflow-hidden bg-muted relative cursor-pointer group"
          onClick={() => setIsGalleryOpen(true)}
        >
          <img 
            src={mainImage} 
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {hasMultipleImages && (
            <Badge className="absolute bottom-2 right-2 gap-1">
              <Image className="h-3 w-3" />
              Ver fotos
            </Badge>
          )}
        </div>
      
      <CardContent className="p-6 space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-foreground">{name}</h3>
          <p className="text-sm text-muted-foreground font-medium">{brand}</p>
        </div>
        
        <p className="text-sm text-muted-foreground">{specs}</p>
        <p className="text-sm text-foreground/80">{description}</p>
        
        <div className="pt-2">
          <p className="text-2xl font-bold text-primary">
            R$ {displayPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          {isDiscountActive && discountPrice && (
            <p className="text-sm text-muted-foreground line-through">
              R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          )}
        </div>
        
        <div className="space-y-3">
          <Input
            placeholder="Insira o cupom de desconto"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
            className="transition-all duration-200"
          />
          
          <Button 
            onClick={handleWhatsAppClick}
            className="w-full bg-[hsl(var(--whatsapp))] hover:bg-[hsl(var(--whatsapp))]/90 text-[hsl(var(--whatsapp-foreground))]"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Fale no WhatsApp
          </Button>
        </div>
      </CardContent>
    </Card>

    <ProductGalleryDialog
      open={isGalleryOpen}
      onOpenChange={setIsGalleryOpen}
      images={images}
      productName={name}
    />
    </>
  );
};

export default ProductCard;
