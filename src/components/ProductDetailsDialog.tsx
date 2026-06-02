import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, X, CreditCard, Tag, ChevronDown, Expand } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import ProductGalleryDialog from "@/components/ProductGalleryDialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { InstallmentOption, calculateCashPriceWithPassOn, calculateDisplayPrice, getAllInstallmentOptions } from "@/lib/installmentHelper";
import { couponsStore } from "@/lib/couponsStore";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

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
  const isMobile = useIsMobile();
  const [coupon, setCoupon] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<{ type: 'cash' | 'installment', data?: InstallmentOption, cashValue?: number } | null>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [paymentPopoverOpen, setPaymentPopoverOpen] = useState(false);
  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false);
  const installmentRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});
  
  const [couponValidation, setCouponValidation] = useState<{ valid: boolean; coupon?: any }>({ valid: false });
  const [installmentOptions, setInstallmentOptions] = useState<InstallmentOption[]>([]);
  const [isLoadingInstallments, setIsLoadingInstallments] = useState(true);
  const [galleryOpen, setGalleryOpen] = useState(false);
  
  // Só consideramos o cupom "ativo" para alterar preço quando o produto
  // tem um preço B2B (discountPrice) menor que o preço de tabela.
  const hasB2BPrice = !!(discountPrice && discountPrice < price);
  const isDiscountActive = couponValidation.valid && hasB2BPrice;

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
  
  // Calcular economia do cupom
  const hasCouponB2B = isDiscountActive && couponValidation.coupon && discountPrice && discountPrice < displayPrice;
  const couponSavings = hasCouponB2B ? (displayPrice - discountPrice) : 0;

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
      <DialogContent className="max-w-4xl p-0 bg-white h-[90vh] flex flex-col overflow-hidden">
        <DialogTitle className="sr-only">{name}</DialogTitle>
        <DialogDescription className="sr-only">
          Detalhes completos do produto {name} - {brand}
        </DialogDescription>
        
        <div className="h-full overflow-y-auto p-4 overscroll-contain">
          <div className="grid md:grid-cols-2 gap-4">
          {/* Galeria de imagens */}
          <div>
            <div className="relative">
              <Carousel setApi={setApi}>
                <CarouselContent>
                  {images?.length ? (
                    images.map((src, idx) => (
                      <CarouselItem key={idx}>
                        <div 
                          className="aspect-square rounded-md overflow-hidden bg-muted cursor-pointer relative group"
                          onClick={() => setGalleryOpen(true)}
                        >
                          <img
                            src={src}
                            alt={`${name} - imagem ${idx + 1}`}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            loading="lazy"
                          />
                          {/* Botão de expandir que aparece no hover */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
                              <Expand className="h-6 w-6 text-gray-700" />
                            </div>
                          </div>
                        </div>
                      </CarouselItem>
                    ))
                  ) : (
                    <CarouselItem>
                      <div className="aspect-square rounded-md bg-muted" />
                    </CarouselItem>
                  )}
                </CarouselContent>
                <CarouselPrevious className="left-2 top-1/2 -translate-y-1/2 z-[110] bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg" />
                <CarouselNext className="right-2 top-1/2 -translate-y-1/2 z-[110] bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg" />
              </Carousel>
              
              {/* Texto indicativo */}
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{current + 1} / {images?.length || 1}</span>
                <button 
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                  onClick={() => setGalleryOpen(true)}
                >
                  <Expand className="h-3 w-3" />
                  Clique para ampliar
                </button>
              </div>
            </div>
          </div>

          {/* Informações e ações */}
          <div>
            <h2 className="text-2xl font-semibold text-foreground">{name}</h2>
            {specs && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {specs}
              </p>
            )}

            {/* Preços */}
            <div className="mt-4">
              <div className="text-3xl font-bold text-primary-purple">
                {(displayMode === 'installment' || displayMode === 'coupon-installment') && paymentDetails.installments && paymentDetails.installmentValue ? (
                  <>
                    <span className="text-sm font-semibold text-muted-foreground mr-1 uppercase tracking-wider">{paymentDetails.installments}x de</span>
                    R$ {paymentDetails.installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </>
                ) : (
                  <>R$ {finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>
                )}
              </div>
              <div className="text-sm mt-1">
                {displayMode === 'coupon' && (
                  <div className="flex items-center gap-1.5 text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-md border border-green-100 w-fit">
                    <Tag className="h-3 w-3" />
                    Cupom aplicado
                    {couponSavings > 0 && (
                      <span className="ml-1">— Economia de R$ {couponSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    )}
                  </div>
                )}
                {displayMode === 'cash' && (
                  <div className="text-green-600 font-medium flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Preço à vista (5% de desconto)
                  </div>
                )}
                {displayMode === 'installment' && (
                  <div className="text-muted-foreground flex items-center gap-2">
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-tighter">Total</span>
                    R$ {paymentDetails.totalAmount?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                )}
                {displayMode === 'coupon-installment' && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-md border border-green-100 w-fit">
                      <Tag className="h-3 w-3" />
                      Cupom aplicado
                    </div>
                    <div className="text-muted-foreground text-xs flex items-center gap-2">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter">Total Parcelado</span>
                      R$ {paymentDetails.totalAmount?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                )}
                {displayMode === 'original' && (
                  <div className="text-muted-foreground flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                    Preço de tabela
                  </div>
                )}
              </div>
            </div>

            {/* Seleção de pagamento */}
            <div className="mt-4">
              <Popover modal open={paymentPopoverOpen} onOpenChange={setPaymentPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="default" 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <CreditCard className="h-4 w-4" />
                      <span>Formas de Pagamento</span>
                      {/* Bandeiras Visa e Mastercard */}
                      <div className="flex gap-1 ml-auto">
                        {/* Visa */}
                        <svg className="h-5 w-7" viewBox="0 0 48 32" fill="none">
                          <rect width="48" height="32" rx="4" fill="white"/>
                          <path d="M20.5 11h-4l-2.5 10h2l.5-2h2.5l.5 2h2.5l-2-10zm-2.5 6l1-4 1 4h-2z" fill="#1A1F71"/>
                        </svg>
                        {/* Mastercard */}
                        <svg className="h-5 w-7" viewBox="0 0 48 32" fill="none">
                          <rect width="48" height="32" rx="4" fill="white"/>
                          <circle cx="18" cy="16" r="7" fill="#EB001B"/>
                          <circle cx="30" cy="16" r="7" fill="#FF5F00"/>
                          <path d="M24 10.5a10 10 0 000 11 10 10 0 000-11z" fill="#F79E1B"/>
                        </svg>
                      </div>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-[calc(100vw-32px)] sm:w-[420px] max-h-[400px] overflow-y-auto overscroll-contain p-3" 
                  side="top" 
                  align="center" 
                  sideOffset={8}
                  onWheelCapture={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                >
                  <div className="p-1 pointer-events-auto">
                    <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-primary-purple" />
                        Formas de Pagamento
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-2">
                        {/* Ver preço original */}
                        <button 
                          onClick={() => {
                            setSelectedPayment(null);
                            setPaymentPopoverOpen(false);
                          }}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-md border transition-all hover:border-primary-purple/50 hover:bg-white text-left group",
                            selectedPayment === null ? "border-primary-purple bg-primary-purple/5 ring-1 ring-primary-purple" : "border-gray-200 bg-white"
                          )}
                        >
                          <span className="text-sm font-medium text-gray-700">Preço de tabela</span>
                          <span className="text-sm font-bold text-gray-900">R$ {displayPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </button>
                        
                        {/* À vista com desconto */}
                        <button 
                          onClick={() => {
                            setSelectedPayment({ type: 'cash', cashValue: calculateCashPriceWithPassOn(displayPrice, passOnCashDiscount || false, price) });
                            setPaymentPopoverOpen(false);
                          }}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-md border transition-all hover:border-green-500/50 hover:bg-white text-left group",
                            selectedPayment?.type === 'cash' ? "border-green-600 bg-green-50 ring-1 ring-green-600" : "border-gray-200 bg-white"
                          )}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                              À vista <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded">5% OFF</span>
                            </span>
                          </div>
                          <span className="text-sm font-bold text-green-700">R$ {calculateCashPriceWithPassOn(displayPrice, passOnCashDiscount || false, price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Seção de Parcelamento */}
                    <div className="px-1">
                      <div className="flex items-center justify-between mb-3 px-1">
                        <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-primary-purple" />
                          Parcelamento (Visa/Master)
                        </span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Até 12x</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 pb-2">
                        {isLoadingInstallments ? (
                          <div className="col-span-2 py-8 text-center text-sm text-gray-400 flex flex-col items-center gap-2">
                            <div className="w-5 h-5 border-2 border-primary-purple/30 border-t-primary-purple rounded-full animate-spin"></div>
                            Carregando opções...
                          </div>
                        ) : (
                          installmentOptions.map((option) => (
                            <button
                              key={option.installments}
                              ref={(el) => (installmentRefs.current[option.installments] = el)}
                              onClick={() => handleInstallmentClick(option)}
                              className={cn(
                                "flex flex-col p-2 rounded-md border text-center transition-all hover:border-primary-purple/50 hover:bg-gray-50",
                                selectedPayment?.type === 'installment' && selectedPayment.data?.installments === option.installments 
                                  ? "border-primary-purple bg-primary-purple/5 ring-1 ring-primary-purple" 
                                  : "border-gray-200 bg-white"
                              )}
                            >
                              <div className="flex flex-col items-center justify-center gap-0.5 leading-tight">
                                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-tighter shrink-0">{option.installments}x de</span>
                                <span className={cn(
                                  "text-xs font-bold leading-none",
                                  selectedPayment?.type === 'installment' && selectedPayment.data?.installments === option.installments ? "text-primary-purple" : "text-gray-900"
                                )}>
                                  R$ {option.installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Detalhes do pagamento selecionado */}
            {selectedPayment?.type === 'installment' && selectedPayment.data && (
              <div className="mt-3 p-3 bg-primary-purple/5 border border-primary-purple/20 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total parcelado:</span>
                  <span className="font-bold text-primary-purple">
                    R$ {selectedPayment.data.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}

            {/* Cupom */}
            <div className="mt-8 bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary-purple" />
                  Cupom de Desconto
                </span>
                {!showCouponInput && (
                  <button
                    type="button"
                    onClick={() => setShowCouponInput(true)}
                    className="text-xs font-medium text-primary-purple hover:underline"
                  >
                    Adicionar
                  </button>
                )}
              </div>
              
              {showCouponInput ? (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Input
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                      placeholder="INSIRA SEU CUPOM"
                      className="h-10 text-sm border-gray-200 focus:border-primary-purple focus:ring-primary-purple bg-white"
                      autoFocus
                    />
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-10 w-10 shrink-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                      onClick={() => {
                        setCoupon("");
                        setShowCouponInput(false);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {coupon && (
                    <div className={cn(
                      "text-[11px] font-medium px-2 py-1 rounded-md inline-self-start",
                      couponValidation.valid && hasB2BPrice
                        ? "bg-green-100 text-green-700"
                        : couponValidation.valid && !hasB2BPrice
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                    )}>
                      {couponValidation.valid && hasB2BPrice
                        ? '✓ Cupom aplicado com sucesso!'
                        : couponValidation.valid && !hasB2BPrice
                          ? 'ⓘ Este produto não possui desconto especial disponível'
                          : '✕ Cupom inválido ou expirado'}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  Tem um cupom? Clique para aplicar e ver o preço especial.
                </p>
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
        </div>
        
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 z-[120] rounded-full p-2 bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 pointer-events-auto"
          aria-label="Fechar"
        >
          <X className="h-5 w-5 text-gray-700" />
        </button>
        
        {/* Galeria em tela cheia */}
        <ProductGalleryDialog
          open={galleryOpen}
          onOpenChange={setGalleryOpen}
          images={images}
          productName={name}
        />
      </DialogContent>

    </Dialog>
  );
};

// Componente reutilizável para as opções de pagamento
interface PaymentOptionsContentProps {
  displayPrice: number;
  cashPrice: number;
  isLoadingInstallments: boolean;
  installmentOptions: InstallmentOption[];
  onSelectOriginal: () => void;
  onSelectCash: () => void;
  onSelectInstallment: (option: InstallmentOption) => void;
}

const PaymentOptionsContent = ({
  displayPrice,
  cashPrice,
  isLoadingInstallments,
  installmentOptions,
  onSelectOriginal,
  onSelectCash,
  onSelectInstallment,
}: PaymentOptionsContentProps) => {
  const cashDiscount = displayPrice - cashPrice;
  
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-foreground">Escolha a forma de pagamento</h3>
      
      {/* Ver preço original */}
      <button
        onClick={onSelectOriginal}
        className="w-full p-3 border rounded-lg hover:bg-accent/50 transition-colors text-left"
      >
        <div className="flex items-center justify-between">
          <span className="font-medium">Ver preço original</span>
          <span className="text-sm text-muted-foreground">
            R$ {displayPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </button>

      {/* À vista */}
      <button
        onClick={onSelectCash}
        className="w-full p-3 border rounded-lg hover:bg-accent/50 transition-colors text-left"
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="font-medium">À vista (5% desconto)</span>
            <span className="text-sm font-semibold text-green-600">
              R$ {cashPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          {cashDiscount > 0 && (
            <span className="text-xs text-muted-foreground">
              Economia de R$ {cashDiscount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
        </div>
      </button>

      {/* Parcelamento */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Parcelamento (Visa/Mastercard)</span>
        </div>
        
        <div className="space-y-2">
          {isLoadingInstallments ? (
            <div className="text-sm text-muted-foreground">Carregando...</div>
          ) : (
            installmentOptions.map((option) => {
              const interestAmount = option.totalAmount - displayPrice;
              return (
                <button
                  key={option.installments}
                  onClick={() => onSelectInstallment(option)}
                  className="w-full p-3 border rounded-lg hover:bg-accent/50 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{option.installments}x</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        R$ {option.installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total: R$ {option.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      {interestAmount > 0 && (
                        <div className="text-xs text-orange-600">
                          Juros: R$ {interestAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsDialog;
