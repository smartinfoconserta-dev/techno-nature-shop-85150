import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import InstallmentSelector from "./InstallmentSelector";
import { InstallmentOption, calculateCashPriceWithPassOn, getAllInstallmentOptions } from "@/lib/installmentHelper";
import { couponsStore } from "@/lib/couponsStore";
import { useEffect } from "react";

const sanitizeForWhatsApp = (text: string): string => {
  return text
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[*_~`]/g, '')
    .trim();
};

interface ProductDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

const ProductDetailsDialog = ({ 
  open, 
  onOpenChange, 
  images, 
  name, 
  brand, 
  specs, 
  description, 
  price, 
  discountPrice, 
  passOnCashDiscount = false 
}: ProductDetailsDialogProps) => {
  const [coupon, setCoupon] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<{ type: 'cash' | 'installment', data?: InstallmentOption, cashValue?: number } | null>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  
  const couponValidation = couponsStore.validateCoupon(coupon);
  const isDiscountActive = couponValidation.valid;
  
  useEffect(() => {
    if (!api) return;
    
    setCurrent(api.selectedScrollSnap());
    
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // Calcular preço a mostrar com prioridades: cupom > pagamento selecionado > original
  let finalPrice = price;
  let displayMode: 'original' | 'coupon' | 'cash' | 'installment' = 'original';
  let paymentDetails: { installments?: number; installmentValue?: number; totalAmount?: number } = {};

  if (isDiscountActive && couponValidation.coupon && 
      typeof couponValidation.coupon.discountPercent === 'number' &&
      couponValidation.coupon.discountPercent > 0) {
    if (discountPrice && discountPrice < price) {
      finalPrice = discountPrice;
    } else {
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
      messageLines.push("");
      
      const cashPrice = calculateCashPriceWithPassOn(price, passOnCashDiscount || false, price);
      messageLines.push(`💵 *À Vista (5% desconto):*`);
      messageLines.push(`• R$ ${cashPrice.toFixed(2)}`);
      messageLines.push("");
      
      const installmentOptions = getAllInstallmentOptions(price);
      messageLines.push(`💳 *Parcelado (Visa/Mastercard):*`);
      installmentOptions.forEach(option => {
        messageLines.push(
          `• ${option.installments}x de R$ ${option.installmentValue.toFixed(2)} ` +
          `(Total: R$ ${option.totalAmount.toFixed(2)})`
        );
      });
      messageLines.push("");
      
      messageLines.push(`🎟️ *Possui cupom de desconto?*`);
      messageLines.push(`Insira no site para ver o preço especial!`);
      messageLines.push("");
      
      messageLines.push(`📋 *Preço de tabela:* R$ ${price.toFixed(2)}`);
    }

    if (imageLink) {
      messageLines.push("");
      messageLines.push(`🖼️ *Imagem:* ${imageLink}`);
    }

    const message = encodeURIComponent(messageLines.join("\n"));
    window.open(`https://wa.me/5548991027363?text=${message}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogTitle className="sr-only">{name}</DialogTitle>
        <DialogDescription className="sr-only">
          Detalhes completos do produto {name} - {brand}
        </DialogDescription>
        
        <div className="sticky top-0 z-10 flex justify-end p-4 bg-background/95 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 p-6 pt-0">
          {/* Galeria de Imagens */}
          <div className="space-y-4">
            <Carousel setApi={setApi} className="w-full">
              <CarouselContent>
                {images.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <img
                        src={image}
                        alt={`${name} - Foto ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {images.length > 1 && (
                <>
                  <CarouselPrevious className="left-2" />
                  <CarouselNext className="right-2" />
                </>
              )}
            </Carousel>
            
            {images.length > 1 && (
              <div className="flex justify-center gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => api?.scrollTo(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === current 
                        ? 'w-8 bg-primary' 
                        : 'w-2 bg-muted-foreground/30'
                    }`}
                    aria-label={`Ver foto ${index + 1}`}
                  />
                ))}
              </div>
            )}
            
            <div className="text-center text-sm text-muted-foreground">
              {current + 1} / {images.length}
            </div>
          </div>

          {/* Informações do Produto */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">{name}</h2>
              <p className="text-lg text-muted-foreground font-medium">{brand}</p>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Especificações:</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{specs}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Descrição:</h3>
                <p className="text-sm text-foreground/80 whitespace-pre-line">{description}</p>
              </div>
            </div>

            <div className="pt-4 border-t space-y-4">
              {displayMode === 'original' && (
                <div>
                  <p className="text-3xl font-bold text-primary">
                    R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  {!isDiscountActive && (
                    <p className="text-sm text-muted-foreground mt-1">
                      ou 5% à vista
                    </p>
                  )}
                </div>
              )}
              
              {displayMode === 'cash' && (
                <div>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    R$ {finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    💰 5% de desconto à vista
                  </p>
                  <p className="text-sm text-muted-foreground line-through">
                    De: R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}
              
              {displayMode === 'installment' && paymentDetails.installments && (
                <div>
                  <p className="text-3xl font-bold text-primary">
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
                  <p className="text-3xl font-bold text-primary">
                    R$ {finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    {discountPrice && discountPrice < price 
                      ? `🎟️ Preço especial para lojistas! Economia de R$ ${(price - finalPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : `🎟️ ${couponValidation.coupon?.discountPercent}% de desconto aplicado!`
                    }
                  </p>
                  <p className="text-sm text-muted-foreground line-through">
                    De: R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}

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
                size="lg"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Fale no WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsDialog;
