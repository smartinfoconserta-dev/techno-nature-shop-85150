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
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-y-auto">
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
          {/* Galeria de imagens */}
          <div>
            <Carousel setApi={setApi}>
              <CarouselContent>
                {images?.length ? (
                  images.map((src, idx) => (
                    <CarouselItem key={idx}>
                      <div className="aspect-square rounded-md overflow-hidden bg-muted">
                        <img
                          src={src}
                          alt={`${name} - imagem ${idx + 1}`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </CarouselItem>
                  ))
                ) : (
                  <CarouselItem>
                    <div className="aspect-square rounded-md bg-muted" />
                  </CarouselItem>
                )}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
            <div className="mt-2 text-xs text-muted-foreground">{current + 1} / {images?.length || 1}</div>
          </div>

          {/* Informações e ações */}
          <div>
            <h2 className="text-2xl font-semibold text-foreground">{name}</h2>
            <Badge variant="secondary" className="mt-2">{brand}</Badge>

            {/* Preços */}
            <div className="mt-4">
              <div className="text-3xl font-bold text-foreground">R$ {finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {displayMode === 'coupon' && 'Preço com cupom aplicado'}
                {displayMode === 'cash' && 'Preço à vista (5% de desconto)'}
                {displayMode === 'installment' && paymentDetails.installments && `Parcelado em ${paymentDetails.installments}x`}
                {displayMode === 'coupon-installment' && paymentDetails.installments && `Cupom + ${paymentDetails.installments}x`}
                {displayMode === 'original' && `Preço de tabela: R$ ${displayPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </div>
            </div>

            {/* Seleção de pagamento */}
            <div className="mt-4">
              <Popover open={paymentPopoverOpen} onOpenChange={setPaymentPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <CreditCard className="mr-2 h-4 w-4" /> Formas de Pagamento
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" side="bottom" align="start" sideOffset={8} avoidCollisions={true} collisionPadding={20}>
                  <div className="space-y-3">
                    {/* Título */}
                    <h3 className="font-medium text-foreground">Escolha a forma de pagamento</h3>
                    
                    {/* Ver preço original */}
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between text-sm h-auto py-2"
                      onClick={() => {
                        setSelectedPayment(null);
                        setPaymentPopoverOpen(false);
                      }}
                    >
                      <span>Ver preço original</span>
                      <span className="font-medium">R$ {displayPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </Button>
                    
                    {/* À vista com desconto */}
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between text-sm h-auto py-2"
                      onClick={() => {
                        setSelectedPayment({ type: 'cash', cashValue: calculateCashPriceWithPassOn(displayPrice, passOnCashDiscount || false, price) });
                        setPaymentPopoverOpen(false);
                      }}
                    >
                      <span>💰 À vista (5% desconto)</span>
                      <span className="font-medium text-green-600">R$ {calculateCashPriceWithPassOn(displayPrice, passOnCashDiscount || false, price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </Button>
                    
                    {/* Seção de Parcelamento */}
                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">💳 Parcelamento (Visa/Mastercard)</span>
                        <span className="text-xs text-muted-foreground">Role para ver mais</span>
                      </div>
                      
                      <div className="space-y-2 max-h-60 overflow-y-auto overscroll-contain touch-pan-y relative pointer-events-auto">
                        {isLoadingInstallments ? (
                          <div className="text-sm text-muted-foreground">Carregando...</div>
                        ) : (
                          installmentOptions.map((option) => (
                            <button
                              key={option.installments}
                              ref={(el) => (installmentRefs.current[option.installments] = el)}
                              onClick={() => handleInstallmentClick(option)}
                              className={
                                'w-full text-left rounded-md border bg-background px-3 py-2 text-sm transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring pointer-events-auto ' +
                                (selectedPayment?.type === 'installment' && selectedPayment.data?.installments === option.installments ? 'ring-2 ring-primary' : '')
                              }
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{option.installments}x</span>
                                <span className="text-foreground">R$ {option.installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">Total: R$ {option.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            </button>
                          ))
                        )}
                        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Detalhes do pagamento selecionado */}
            {selectedPayment?.type === 'installment' && selectedPayment.data && (
              <div className="mt-3 text-sm text-muted-foreground">
                {selectedPayment.data.installments}x de R$ {selectedPayment.data.installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                {' '} (Total: R$ {selectedPayment.data.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
              </div>
            )}

            {/* Cupom */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowCouponInput((v) => !v)}
                className="text-sm text-primary hover:underline inline-flex items-center"
              >
                <Tag className="h-4 w-4 mr-1" /> Tenho cupom
              </button>
              {showCouponInput && (
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                    placeholder="CUPOM"
                    className="max-w-xs"
                  />
                  {coupon && (
                    <Badge variant={couponValidation.valid ? 'default' : 'secondary'}>
                      {couponValidation.valid ? 'Cupom válido' : 'Cupom inválido'}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Especificações */}
            <Accordion type="single" collapsible className="mt-6">
              <AccordionItem value="specs">
                <AccordionTrigger>Especificações</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    {(specs?.includes('\n') ? specs.split('\n') : specs.split(',')).filter((s) => s.trim()).map((s, i) => (
                      <li key={i}>{s.trim()}</li>
                    ))}
                  </ul>
                  {description && description.trim() && (
                    <div className="mt-4 text-sm text-muted-foreground whitespace-pre-line">{description}</div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* WhatsApp */}
            <Button className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white" onClick={handleWhatsAppClick}>
              <MessageCircle className="mr-2 h-4 w-4" /> Falar no WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>

    </Dialog>
  );
};

export default ProductDetailsDialog;
