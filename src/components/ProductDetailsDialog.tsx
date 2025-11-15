import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, X, CreditCard, Tag, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { InstallmentOption, calculateCashPriceWithPassOn, calculateDisplayPrice, getAllInstallmentOptions } from "@/lib/installmentHelper";
import { couponsStore } from "@/lib/couponsStore";

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
  id,
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
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [paymentPopoverOpen, setPaymentPopoverOpen] = useState(false);
  const installmentRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});
  
  const [couponValidation, setCouponValidation] = useState<{ valid: boolean; coupon?: any }>({ valid: false });
  const [installmentOptions, setInstallmentOptions] = useState<InstallmentOption[]>([]);
  const [isLoadingInstallments, setIsLoadingInstallments] = useState(true);
  
  const isDiscountActive = couponValidation.valid;

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
      const baseAmount = (isDiscountActive && couponValidation.coupon && discountPrice && discountPrice < displayPrice) 
        ? discountPrice 
        : displayPrice;
      const options = await getAllInstallmentOptions(baseAmount);
      setInstallmentOptions(options);
      setIsLoadingInstallments(false);
    };
    loadOptions();
  }, [displayPrice, discountPrice, isDiscountActive, couponValidation.coupon]);
  
  useEffect(() => {
    if (!api) return;
    
    setCurrent(api.selectedScrollSnap());
    
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // Calcular preço a mostrar com prioridades: cupom + parcelamento > cupom > pagamento selecionado > original
  let finalPrice = displayPrice;
  let displayMode: 'original' | 'coupon' | 'cash' | 'installment' | 'coupon-installment' = 'original';
  let paymentDetails: { installments?: number; installmentValue?: number; totalAmount?: number } = {};

  // NOVO: Verificar se tem cupom válido e se produto tem preço B2B
  if (isDiscountActive && couponValidation.coupon) {
    // Cupom válido: usar preço B2B (discountPrice) se disponível
    if (discountPrice && discountPrice < displayPrice) {
      const b2bPrice = discountPrice;
      
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
        // Prioridade 2: Apenas cupom (preço B2B à vista, SEM desconto de 5%)
        displayMode = 'coupon';
        finalPrice = b2bPrice;
      }
    }
  } else if (selectedPayment) {
    // Cliente final sem cupom
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


  const handleInstallmentClick = (option: InstallmentOption) => {
    // Rolar até o botão clicado
    const buttonRef = installmentRefs.current[option.installments];
    if (buttonRef) {
      buttonRef.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest',
        inline: 'start' 
      });
    }
    
    // Aguardar um pouco para o usuário ver o scroll
    setTimeout(() => {
      setSelectedPayment({ type: 'installment', data: option });
      setPaymentPopoverOpen(false);
    }, 300);
  };

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogTitle className="sr-only">{name}</DialogTitle>
        <DialogDescription className="sr-only">
          Detalhes completos do produto {name} - {brand}
        </DialogDescription>
        
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </button>

        <div className="grid md:grid-cols-2 gap-4 p-4">
          {/* Galeria de Imagens */}
          <div className="space-y-2">
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
                  <CarouselPrevious className="left-2 h-8 w-8" />
                  <CarouselNext className="right-2 h-8 w-8" />
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
          </div>

          {/* Informações do Produto */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">{name}</h2>
              <p className="text-sm text-muted-foreground font-medium">{brand}</p>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="specs" className="border-b">
                <AccordionTrigger className="text-sm hover:no-underline py-3">
                  Especificações
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground whitespace-pre-line pb-3">
                  {specs}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="description" className="border-b">
                <AccordionTrigger className="text-sm hover:no-underline py-3">
                  Descrição
                </AccordionTrigger>
                <AccordionContent className="text-sm text-foreground/80 whitespace-pre-line pb-3">
                  {description}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="pt-2 space-y-3">
              {displayMode === 'original' && (
                <div>
                  <p className="text-3xl font-bold text-primary">
                    R$ {displayPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  {!isDiscountActive && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {isLoadingInstallments ? (
                        <span className="animate-pulse">Calculando parcelamento...</span>
                      ) : (
                        `ou 12x de R$ ${(installmentOptions.find(o => o.installments === 12)?.installmentValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      )}
                    </p>
                  )}
                </div>
              )}
              
              {displayMode === 'cash' && (
                <div>
                  <p className="text-3xl font-bold text-accent">
                    R$ {finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-accent mt-1">
                    💰 5% de desconto à vista
                  </p>
                  <p className="text-sm text-muted-foreground line-through">
                    De: R$ {displayPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                </div>
              )}
              
              {displayMode === 'coupon' && (
                <div>
                  <p className="text-3xl font-bold text-primary">
                    R$ {finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-accent mt-1">
                    🎟️ Preço de Lojista B2B! Economia de R$ {(displayPrice - finalPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-muted-foreground line-through">
                    Preço cliente final: R$ {displayPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 Sem desconto adicional à vista, mas pode parcelar este valor
                  </p>
                </div>
              )}
              
              {displayMode === 'coupon-installment' && paymentDetails.installments && (
                <div>
                  <p className="text-3xl font-bold text-primary">
                    {paymentDetails.installments}x de R$ {paymentDetails.installmentValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-accent mt-1">
                    🎟️ Preço de Lojista B2B parcelado!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total parcelado: R$ {paymentDetails.totalAmount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground line-through">
                    Preço cliente final: R$ {displayPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}

              <Popover open={paymentPopoverOpen} onOpenChange={setPaymentPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between border border-border hover:bg-muted/50" 
                    size="sm"
                  >
                    <span className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      <span className="font-medium">Formas de Pagamento</span>
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" side="bottom" align="start" sideOffset={8}>
                  <div className="relative">
                    <div 
                      className="max-h-[360px] w-full overflow-y-auto pr-1 scroll-smooth overscroll-contain touch-pan-y
                        [&::-webkit-scrollbar]:w-2
                        [&::-webkit-scrollbar-track]:bg-transparent
                        [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30
                        [&::-webkit-scrollbar-thumb]:rounded-full
                        [&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/50"
                      data-scroll-lock-scrollable
                      onWheelCapture={(e) => e.stopPropagation()}
                      onTouchMoveCapture={(e) => e.stopPropagation()}
                    >
                      <div className="space-y-3 pr-2">
                        <h4 className="font-medium text-sm">Escolha a forma de pagamento</h4>

                        {/* Ver preço original */}
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setSelectedPayment(null);
                            setPaymentPopoverOpen(false);
                          }}
                          className="group w-full justify-start text-sm h-auto py-2 text-foreground hover:bg-muted hover:text-foreground"
                        >
                  <div className="text-left">
                    <div className="font-medium">Ver preço original</div>
                    <div className="text-xs text-muted-foreground group-hover:text-foreground">
                      R$ {displayPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                        </Button>

                        {/* À vista (sempre visível) */}
                <Button
                  variant="ghost"
                  onClick={() => {
                    const cashValue = calculateCashPriceWithPassOn(displayPrice, passOnCashDiscount, price);
                    setSelectedPayment({ type: 'cash', cashValue });
                    setPaymentPopoverOpen(false);
                  }}
                  className="group w-full justify-start text-sm h-auto py-2 text-foreground hover:bg-muted hover:text-foreground"
                >
                  <div className="text-left">
                    <div className="font-medium text-accent group-hover:text-foreground">💰 À vista (5% desconto)</div>
                    <div className="text-xs text-muted-foreground group-hover:text-foreground">
                      R$ {calculateCashPriceWithPassOn(displayPrice, passOnCashDiscount, price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </Button>

                        {/* Parcelamento */}
                        <div className="border-t pt-2">
                          <div className="text-xs text-muted-foreground mb-2 flex items-center justify-between">
                            <span>💳 Parcelamento (Visa/Mastercard)</span>
                            <span className="text-[10px] text-muted-foreground/60">Role para ver mais</span>
                          </div>

                          {installmentOptions.map((option) => (
                            <Button
                              key={option.installments}
                              ref={(el) => (installmentRefs.current[option.installments] = el)}
                              variant="ghost"
                              onClick={() => handleInstallmentClick(option)}
                              className="group w-full justify-start text-sm h-auto py-2.5 mb-1 text-foreground hover:bg-muted hover:text-foreground"
                            >
                              <div className="text-left">
                                <div className="font-medium">
                                  {option.installments}x de R$ {option.installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                                <div className="text-xs text-muted-foreground group-hover:text-foreground">
                                  Total: R$ {option.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  {option.rate > 0 && ` (${option.rate.toFixed(2)}% juros)`}
                                </div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Gradiente indicando mais conteúdo abaixo */}
                    <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                  </div>
                </PopoverContent>
              </Popover>
              
              <Collapsible open={showCouponInput} onOpenChange={setShowCouponInput}>
                <CollapsibleTrigger asChild>
                  <Button variant="link" className="w-full justify-start p-0 h-auto text-sm" size="sm">
                    <Tag className="w-3 h-3 mr-2" />
                    Tenho um cupom
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  <Input
                    placeholder="Insira o cupom de desconto"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    className="transition-all duration-200"
                  />
                  {isDiscountActive && (
                    <p className="text-xs text-accent">
                      ✅ Cupom válido! Desconto aplicado.
                    </p>
                  )}
                </CollapsibleContent>
              </Collapsible>
              
              <Button 
                onClick={handleWhatsAppClick}
                className="w-full bg-[hsl(var(--whatsapp))] hover:bg-[hsl(var(--whatsapp))]/90 text-[hsl(var(--whatsapp-foreground))] transition-transform hover:scale-[1.02]"
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
