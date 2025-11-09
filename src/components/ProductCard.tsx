import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Image, Info } from "lucide-react";
import { useState } from "react";
import ProductGalleryDialog from "./ProductGalleryDialog";
import ProductDetailsDialog from "./ProductDetailsDialog";
import InstallmentSelector from "./InstallmentSelector";
import { InstallmentOption, calculateCashPriceWithPassOn, getAllInstallmentOptions } from "@/lib/installmentHelper";
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

const ProductCard = ({ id, images, name, brand, specs, description, price, costPrice, discountPrice, passOnCashDiscount = false }: ProductCardProps) => {
  const [coupon, setCoupon] = useState("");
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
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
    // Priorizar discountPrice (preço lojista) se configurado
    if (discountPrice && discountPrice < price) {
      finalPrice = discountPrice;
    } else {
      // Fallback para desconto percentual
      const discount = couponValidation.coupon.discountPercent / 100;
      finalPrice = price * (1 - discount);
    }
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
      // Cliente não selecionou forma de pagamento - mostrar todas as opções
      messageLines.push("");
      
      // 1. Opção à vista
      const cashPrice = calculateCashPriceWithPassOn(price, passOnCashDiscount || false, price);
      messageLines.push(`💵 *À Vista (5% desconto):*`);
      messageLines.push(`• R$ ${cashPrice.toFixed(2)}`);
      messageLines.push("");
      
      // 2. Opções de parcelamento
      const installmentOptions = getAllInstallmentOptions(price);
      messageLines.push(`💳 *Parcelado (Visa/Mastercard):*`);
      installmentOptions.forEach(option => {
        messageLines.push(
          `• ${option.installments}x de R$ ${option.installmentValue.toFixed(2)} ` +
          `(Total: R$ ${option.totalAmount.toFixed(2)})`
        );
      });
      messageLines.push("");
      
      // 3. Lembrar do cupom
      messageLines.push(`🎟️ *Possui cupom de desconto?*`);
      messageLines.push(`Insira no site para ver o preço especial!`);
      messageLines.push("");
      
      // 4. Preço de referência
      messageLines.push(`📋 *Preço de tabela:* R$ ${price.toFixed(2)}`);
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
      <Card 
        className="overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer border-border/50"
        onClick={() => setIsDetailsOpen(true)}
      >
        <div className="aspect-square overflow-hidden bg-muted relative group">
          <img 
            src={mainImage} 
            alt={name}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
          {hasMultipleImages && (
            <Badge className="absolute bottom-2 right-2 gap-1 text-xs">
              <Image className="h-3 w-3" />
              +{images.length - 1}
            </Badge>
          )}
        </div>
      
        <CardContent className="p-3 space-y-2">
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 min-h-[2.5rem]">
            {name}
          </h3>
          <p className="text-xs text-muted-foreground font-medium">{brand}</p>
          
          <div className="pt-2">
            <p className="text-xl font-bold text-primary">
              R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              em até 12x sem juros
            </p>
          </div>
        </CardContent>
      </Card>

    <ProductGalleryDialog
      open={isGalleryOpen}
      onOpenChange={setIsGalleryOpen}
      images={images}
      productName={name}
    />
    
    <ProductDetailsDialog
      open={isDetailsOpen}
      onOpenChange={setIsDetailsOpen}
      id={id}
      images={images}
      name={name}
      brand={brand}
      specs={specs}
      description={description}
      price={price}
      costPrice={costPrice}
      discountPrice={discountPrice}
      passOnCashDiscount={passOnCashDiscount}
    />
    </>
  );
};

export default ProductCard;
