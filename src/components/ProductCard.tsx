import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Image } from "lucide-react";
import { useState } from "react";
import ProductGalleryDialog from "./ProductGalleryDialog";
import InstallmentSelector from "./InstallmentSelector";
import { InstallmentOption, calculateCashPriceWithPassOn } from "@/lib/installmentHelper";
import { couponsStore } from "@/lib/couponsStore";

const sanitizeForWhatsApp = (text: string): string => {
  return text
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[*_~`]/g, '')
    .trim();
};

interface ProductCardProps {
  id: string;
  images: string[];
  name: string;
  brand: string;
  specs: string;
  description: string;
  price: number;
  costPrice?: number;
  discountPrice?: number;
  passOnCashDiscount?: boolean;
}

const ProductCard = ({ images, name, brand, specs, description, price, costPrice, discountPrice, passOnCashDiscount = false }: ProductCardProps) => {
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

  if (isDiscountActive && couponValidation.coupon && 
      typeof couponValidation.coupon.discountPercent === 'number' &&
      couponValidation.coupon.discountPercent > 0) {
    const discount = couponValidation.coupon.discountPercent / 100;
    finalPrice = price * (1 - discount);
    displayMode = 'coupon';
  } else if (selectedPayment) {
    if (selectedPayment.type === 'cash') {
      finalPrice = calculateCashPriceWithPassOn(price, passOnCashDiscount, price);
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
    const imageLink = images[0] || "";
    
    let messageLines = [
      "🛒 *INTERESSE EM PRODUTO*",
      "",
      `📦 *Produto:* ${sanitizeForWhatsApp(name)} - ${sanitizeForWhatsApp(brand)}`,
      "",
      "📋 *Especificações:*",
      sanitizeForWhatsApp(specs),
      "",
      "📝 *Descrição:*",
      sanitizeForWhatsApp(description),
      "",
      "💰 *Valores:*",
    ];

    // Adicionar informações de pagamento selecionado
    if (displayMode === 'cash') {
      messageLines.push(`💰 *Pagamento à vista (5% desconto)*`);
      messageLines.push(`• Valor final: R$ ${finalPrice.toFixed(2)}`);
      if (passOnCashDiscount) {
        messageLines.push(`• Preço de tabela: R$ ${price.toFixed(2)}`);
      }
    } else if (displayMode === 'installment' && paymentDetails.installments) {
      messageLines.push(`• *Parcelado:* ${paymentDetails.installments}x de R$ ${paymentDetails.installmentValue?.toFixed(2)}`);
      messageLines.push(`• Total: R$ ${paymentDetails.totalAmount?.toFixed(2)}`);
      messageLines.push(`• 💳 Visa/Mastercard`);
    } else if (displayMode === 'coupon') {
      messageLines.push(`• *Com cupom:* R$ ${finalPrice.toFixed(2)}`);
      messageLines.push(`• Valor original: R$ ${price.toFixed(2)}`);
    } else {
      messageLines.push(`• *Preço de Venda:* R$ ${price.toFixed(2)}`);
    }

    // Adicionar preço de custo e margem (informação interna)
    if (costPrice) {
      const margin = price - costPrice;
      const marginPercent = ((margin / costPrice) * 100).toFixed(1);
      messageLines.push("");
      messageLines.push("📊 *Info Interna (Negociação):*");
      messageLines.push(`• Preço de Custo: R$ ${costPrice.toFixed(2)}`);
      messageLines.push(`• Margem: R$ ${margin.toFixed(2)} (${marginPercent}%)`);
    }

    // Adicionar link da imagem
    if (imageLink) {
      messageLines.push("");
      messageLines.push(`🖼️ *Imagem:* ${imageLink}`);
    }

    const message = encodeURIComponent(messageLines.join("\n"));
    window.open(`https://wa.me/5548991027363?text=${message}`, "_blank");
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
