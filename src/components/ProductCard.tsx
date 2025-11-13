import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Image, Info } from "lucide-react";
import { useState, useEffect } from "react";
import ProductGalleryDialog from "./ProductGalleryDialog";
import ProductDetailsDialog from "./ProductDetailsDialog";
import InstallmentSelector from "./InstallmentSelector";
import { InstallmentOption, calculateCashPriceWithPassOn, calculateDisplayPrice, getAllInstallmentOptions } from "@/lib/installmentHelper";
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
  category: string;
  specs: string;
  description: string;
  price: number;
  costPrice?: number;
  discountPrice?: number;
  passOnCashDiscount?: boolean;
}

const ProductCard = ({ id, images, name, brand, category, specs, description, price, costPrice, discountPrice, passOnCashDiscount = false }: ProductCardProps) => {
  const [coupon, setCoupon] = useState("");
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<{ type: 'cash' | 'installment', data?: InstallmentOption, cashValue?: number } | null>(null);
  
  const [couponValidation, setCouponValidation] = useState<{ valid: boolean; coupon?: any }>({ valid: false });
  const [installmentOptions, setInstallmentOptions] = useState<InstallmentOption[]>([]);
  const [isLoadingInstallments, setIsLoadingInstallments] = useState(true);
  
  const isDiscountActive = couponValidation.valid;
  const mainImage = images[0] || "/placeholder.svg";
  const hasMultipleImages = images.length > 1;

  // Calcular o preço de vitrine baseado no passOnCashDiscount
  const displayPrice = calculateDisplayPrice(price, passOnCashDiscount);
  
  useEffect(() => {
    const validateCoupon = async () => {
      if (coupon) {
        const result = await couponsStore.validateCoupon(coupon);
        setCouponValidation(result);
      } else {
        setCouponValidation({ valid: false });
      }
    };
    validateCoupon();
  }, [coupon]);
  
  useEffect(() => {
    const loadOptions = async () => {
      setIsLoadingInstallments(true);
      const options = await getAllInstallmentOptions(displayPrice);
      setInstallmentOptions(options);
      setIsLoadingInstallments(false);
    };
    loadOptions();
  }, [displayPrice]);
  
  // Calcular preço a mostrar com prioridades: cupom + parcelamento > cupom > pagamento selecionado > original
  let finalPrice = displayPrice;
  let displayMode: 'original' | 'coupon' | 'cash' | 'installment' | 'coupon-installment' = 'original';
  let paymentDetails: { installments?: number; installmentValue?: number; totalAmount?: number } = {};

  if (isDiscountActive && couponValidation.coupon && 
      typeof couponValidation.coupon.discountPercent === 'number' &&
      couponValidation.coupon.discountPercent > 0) {
    
    // Calcular preço base com cupom
    let discountedPrice = displayPrice;
    if (discountPrice && discountPrice < displayPrice) {
      discountedPrice = discountPrice;
    } else {
      const discount = couponValidation.coupon.discountPercent / 100;
      discountedPrice = displayPrice * (1 - discount);
    }
    
    // Prioridade 1: Cupom + Parcelamento
    if (selectedPayment?.type === 'installment' && selectedPayment.data) {
      displayMode = 'coupon-installment';
      finalPrice = selectedPayment.data.totalAmount;
      paymentDetails = {
        installments: selectedPayment.data.installments,
        installmentValue: selectedPayment.data.installmentValue,
        totalAmount: selectedPayment.data.totalAmount,
      };
    } else {
      // Prioridade 2: Apenas cupom
      displayMode = 'coupon';
      finalPrice = discountedPrice;
    }
  } else if (selectedPayment) {
    if (selectedPayment.type === 'cash') {
      finalPrice = calculateCashPriceWithPassOn(displayPrice, passOnCashDiscount, price);
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
    const formatBR = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const productLink = `https://www.ramontech.com.br/?produto=${id}`;
    
    let messageLines = [
      "✅ INTERESSE EM PRODUTO",
      "",
      `💻 Produto: ${sanitizeForWhatsApp(name)} - ${sanitizeForWhatsApp(brand)}`,
      ""
    ];

    // Especificações com bullets
    messageLines.push("🧾 Especificações:");
    const specsLines = specs.includes('\n') 
      ? specs.split('\n').filter(s => s.trim())
      : specs.split(',').filter(s => s.trim());
    
    specsLines.forEach(spec => {
      messageLines.push(`• ${sanitizeForWhatsApp(spec.trim())}`);
    });
    messageLines.push("");

    // Descrição com bullets se existir
    if (description && description.trim()) {
      const descLines = description.includes('\n')
        ? description.split('\n').filter(d => d.trim())
        : [description];
      
      descLines.forEach(desc => {
        messageLines.push(`• ${sanitizeForWhatsApp(desc.trim())}`);
      });
      messageLines.push("");
    }

    // Valores
    messageLines.push("💰 Valores:");
    messageLines.push("");
    
    // À vista
    const cashPrice = calculateCashPriceWithPassOn(displayPrice, passOnCashDiscount || false, price);
    messageLines.push("💵 À Vista (5% de desconto):");
    messageLines.push(`R$ ${formatBR(cashPrice)}`);
    messageLines.push("");
    
    // Parcelado
    messageLines.push("💳 Parcelado (Visa/Mastercard):");
    messageLines.push("");
    installmentOptions.forEach(option => {
      messageLines.push(
        `${option.installments}x de R$ ${formatBR(option.installmentValue)} (Total: R$ ${formatBR(option.totalAmount)})*`
      );
      messageLines.push("");
    });
    
    // Cupom
    messageLines.push("🎟️ Possui cupom de desconto?");
    messageLines.push("Insira no site para ver o preço especial!");
    messageLines.push("");
    
    // Preço de tabela
    messageLines.push(`🏷️ Preço de tabela: R$ ${formatBR(displayPrice)}`);
    messageLines.push("");
    
    // Link do produto
    messageLines.push("🔗 Ver no site:");
    messageLines.push(productLink);

    const message = encodeURIComponent(messageLines.join("\n"));
    window.open(`https://wa.me/5548991027363?text=${message}`, "_blank");
  };

  return (
    <>
      <Card 
        className="overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer border-border/50 relative"
        onClick={() => setIsDetailsOpen(true)}
      >
        <div className="aspect-square overflow-hidden bg-muted relative group">
          <img 
            src={mainImage} 
            alt={name}
            loading="lazy"
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
          
          {/* Especificações */}
          {specs && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {specs}
            </p>
          )}
          
          <div className="pt-2">
            <p className="text-xl font-bold text-primary">
              R$ {displayPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isLoadingInstallments ? (
                <span className="animate-pulse">Calculando parcelamento...</span>
              ) : (
                `em até 12x de R$ ${(installmentOptions.find(o => o.installments === 12)?.installmentValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              )}
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
