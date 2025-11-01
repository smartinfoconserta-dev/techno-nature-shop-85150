import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Image } from "lucide-react";
import { useState } from "react";
import ProductGalleryDialog from "./ProductGalleryDialog";
import InstallmentSelector from "./InstallmentSelector";
import { InstallmentOption } from "@/lib/installmentHelper";
import { couponsStore } from "@/lib/couponsStore";

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
  const [selectedPayment, setSelectedPayment] = useState<{ type: 'cash' | 'installment', data?: InstallmentOption, cashValue?: number } | null>(null);
  
  const couponValidation = couponsStore.validateCoupon(coupon);
  const isDiscountActive = couponValidation.valid;
  const mainImage = images[0] || "/placeholder.svg";
  const hasMultipleImages = images.length > 1;
  
  // Calcular preço a mostrar com prioridades: cupom > pagamento selecionado > original
  let finalPrice = price;
  let displayMode: 'original' | 'coupon' | 'cash' | 'installment' = 'original';
  let paymentDetails: { installments?: number; installmentValue?: number; totalAmount?: number } = {};

  if (isDiscountActive && couponValidation.coupon) {
    const discount = couponValidation.coupon.discountPercent / 100;
    finalPrice = price * (1 - discount);
    displayMode = 'coupon';
  } else if (selectedPayment) {
    if (selectedPayment.type === 'cash') {
      finalPrice = selectedPayment.cashValue || price;
      displayMode = 'cash';
    } else if (selectedPayment.type === 'installment' && selectedPayment.data) {
      finalPrice = selectedPayment.data.totalAmount;
      displayMode = 'installment';
      paymentDetails = {
        installments: selectedPayment.data.installments,
        installmentValue: selectedPayment.data.installmentValue,
        totalAmount: selectedPayment.data.totalAmount,
      };
    }
  }

  const handleWhatsAppClick = () => {
    let priceInfo = `R$ ${price.toFixed(2)}`;
    
    if (displayMode === 'cash') {
      priceInfo = `R$ ${finalPrice.toFixed(2)} (à vista com 5% desconto)`;
    } else if (displayMode === 'installment' && paymentDetails.installments) {
      priceInfo = `${paymentDetails.installments}x de R$ ${paymentDetails.installmentValue?.toFixed(2)} (Total: R$ ${paymentDetails.totalAmount?.toFixed(2)}) - Visa/Mastercard`;
    } else if (displayMode === 'coupon') {
      priceInfo = `R$ ${finalPrice.toFixed(2)} (com cupom de desconto)`;
    }
    
    const message = encodeURIComponent(`Olá! Tenho interesse no produto: ${name} - ${brand}\nValor: ${priceInfo}`);
    window.open(`https://wa.me/5548999385829?text=${message}`, "_blank");
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
        
        <div className="pt-2 border-t">
          {displayMode === 'original' && (
            <div>
              <p className="text-2xl font-bold text-primary">
                R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              {!isDiscountActive && (
                <p className="text-xs text-muted-foreground mt-1">
                  ou 5% à vista
                </p>
              )}
            </div>
          )}
          
          {displayMode === 'cash' && (
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                R$ {finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                💰 5% de desconto à vista
              </p>
              <p className="text-xs text-muted-foreground line-through">
                De: R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}
          
          {displayMode === 'installment' && paymentDetails.installments && (
            <div>
              <p className="text-2xl font-bold text-primary">
                {paymentDetails.installments}x de R$ {paymentDetails.installmentValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-muted-foreground">
                Total: R$ {paymentDetails.totalAmount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <div className="flex gap-1 mt-2">
                <Badge variant="secondary" className="text-xs">💳 Visa</Badge>
                <Badge variant="secondary" className="text-xs">💳 Mastercard</Badge>
              </div>
            </div>
          )}
          
          {displayMode === 'coupon' && (
            <div>
              <p className="text-2xl font-bold text-primary">
                R$ {finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                🎟️ {couponValidation.coupon?.discountPercent}% de desconto aplicado!
              </p>
              <p className="text-xs text-muted-foreground line-through">
                De: R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}
        </div>
        
        <InstallmentSelector 
          basePrice={isDiscountActive ? finalPrice : price}
          hasCouponActive={isDiscountActive}
          onSelect={setSelectedPayment}
        />
        
        <div className="space-y-2">
          <Input
            placeholder="Insira o cupom de desconto"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
            className="transition-all duration-200"
          />
          {isDiscountActive && (
            <p className="text-xs text-green-600 dark:text-green-400">
              ✅ Cupom válido! Desconto aplicado.
            </p>
          )}
        </div>
        
        <Button 
          onClick={handleWhatsAppClick}
          className="w-full bg-[hsl(var(--whatsapp))] hover:bg-[hsl(var(--whatsapp))]/90 text-[hsl(var(--whatsapp-foreground))]"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Fale no WhatsApp
        </Button>
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
