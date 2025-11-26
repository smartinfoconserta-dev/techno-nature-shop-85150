import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CalendarIcon, Check, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { receivablesStore } from "@/lib/receivablesStore";
import { customersStore } from "@/lib/customersStore";
import { productsStore } from "@/lib/productsStore";
import { couponsStore } from "@/lib/couponsStore";
import { useToast } from "@/hooks/use-toast";
import WarrantySelector from "./WarrantySelector";

const formSchema = z.object({
  productName: z.string().min(1, "Nome do produto é obrigatório"),
  brand: z.string().optional(),
  category: z.string().optional(),
  costPrice: z.number().optional(),
  salePrice: z.number().min(0.01, "Preço de venda deve ser maior que 0"),
  saleDate: z.date().optional(),
  dueDate: z.date().optional(),
  initialCash: z.number().min(0).optional(),
  initialPix: z.number().min(0).optional(),
  initialCard: z.number().min(0).optional(),
  warranty: z.number(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddManualReceivableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string | null;
  onSuccess: () => void;
}

export function AddManualReceivableDialog({
  open,
  onOpenChange,
  customerId,
  onSuccess,
}: AddManualReceivableDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [productSource, setProductSource] = useState<"manual" | "catalog">("manual");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponValidated, setCouponValidated] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saleDateOpen, setSaleDateOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);
  
  const catalogProducts = productsStore.getAvailableProducts();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: "",
      brand: "",
      category: "",
      costPrice: 0,
      salePrice: 0,
      saleDate: undefined,
      dueDate: undefined,
      initialCash: 0,
      initialPix: 0,
      initialCard: 0,
      warranty: 0,
      notes: "",
    },
  });

  // Resetar estados ao fechar diálogo
  useEffect(() => {
    if (!open) {
      setProductSource("manual");
      setSelectedProductId("");
      setSelectedProduct(null);
      setCouponCode("");
      setCouponValidated(false);
      setCouponDiscount(0);
      setCouponError("");
      setShowAdvanced(false);
      form.reset({
        productName: "",
        brand: "",
        category: "",
        costPrice: 0,
        salePrice: 0,
        saleDate: undefined,
        dueDate: undefined,
        initialCash: 0,
        initialPix: 0,
        initialCard: 0,
        warranty: 0,
        notes: "",
      });
    }
  }, [open, form]);

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Digite um código de cupom");
      return;
    }

    const result = await couponsStore.validateCoupon(couponCode);
    if (result.valid && result.coupon) {
      setCouponValidated(true);
      setCouponError("");
      
      // Verificar se produto tem preço de lojista (B2B)
      if (selectedProduct?.discountPrice && selectedProduct.discountPrice < form.watch("salePrice")) {
        const originalPrice = form.watch("salePrice");
        const b2bPrice = selectedProduct.discountPrice;
        const savings = originalPrice - b2bPrice;
        
        // Aplicar preço B2B
        form.setValue("salePrice", b2bPrice);
        setCouponDiscount(0); // Não é desconto percentual
        
        toast({
          title: "Cupom válido!",
          description: `Preço de lojista aplicado: R$ ${b2bPrice.toFixed(2)} (economia de R$ ${savings.toFixed(2)})`,
        });
      } else {
        const discount = result.coupon.discountPercent || 0;
        setCouponDiscount(discount);
        toast({
          title: "Cupom válido",
          description: discount > 0 ? `${discount}% de desconto aplicado` : "Cupom reconhecido, mas este produto não tem preço de lojista configurado",
        });
      }
    } else {
      setCouponValidated(false);
      setCouponDiscount(0);
      setCouponError("Cupom inválido");
      toast({
        title: "Cupom inválido",
        description: "Cupom inválido ou expirado",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!customerId) return;

    setIsLoading(true);

    try {
      const customer = await customersStore.getCustomerById(customerId);
      if (!customer) {
        throw new Error("Cliente não encontrado");
      }

      // Validações específicas para catálogo
      if (productSource === "catalog" && !selectedProductId) {
        throw new Error("Selecione um produto do catálogo");
      }

      const finalProductId = productSource === "catalog" 
        ? selectedProductId 
        : null; // Entrada manual não tem product_id vinculado

      // Calcula data de expiração da garantia a partir da data de venda
      let warrantyExpiresAt: string | undefined;
      if (data.warranty > 0) {
        const base = data.saleDate ? new Date(data.saleDate) : new Date();
        const expirationDate = new Date(base);
        expirationDate.setDate(expirationDate.getDate() + data.warranty);
        warrantyExpiresAt = expirationDate.toISOString();
      }

      // Criar array de pagamentos iniciais
      const paymentDate = data.saleDate 
        ? format(data.saleDate, "yyyy-MM-dd") 
        : format(new Date(), "yyyy-MM-dd");
      
      const initialPayments: any[] = [];
      let totalInitial = 0;

      if (data.initialCash && data.initialCash > 0) {
        initialPayments.push({
          id: `${Date.now()}-cash`,
          amount: data.initialCash,
          paymentDate,
          paymentMethod: "cash",
          notes: data.notes || "Pagamento inicial - Dinheiro",
        });
        totalInitial += data.initialCash;
      }

      if (data.initialPix && data.initialPix > 0) {
        initialPayments.push({
          id: `${Date.now()}-pix`,
          amount: data.initialPix,
          paymentDate,
          paymentMethod: "pix",
          notes: data.notes || "Pagamento inicial - PIX",
        });
        totalInitial += data.initialPix;
      }

      if (data.initialCard && data.initialCard > 0) {
        initialPayments.push({
          id: `${Date.now()}-card`,
          amount: data.initialCard,
          paymentDate,
          paymentMethod: "card",
          notes: data.notes || "Pagamento inicial - Cartão",
        });
        totalInitial += data.initialCard;
      }

      // Cria conta a receber com todos os pagamentos iniciais
      const saleDateStr = data.saleDate 
        ? format(data.saleDate, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd');

      const receivable = await receivablesStore.addReceivable({
        customerId,
        customerCode: customer.code,
        customerName: customer.name,
        productId: finalProductId,
        productName: data.productName,
        brand: data.brand,
        category: data.category,
        costPrice: data.costPrice || 0,
        salePrice: data.salePrice,
        totalAmount: data.salePrice,
        paidAmount: totalInitial,
        dueDate: data.dueDate ? format(data.dueDate, "yyyy-MM-dd") : undefined,
        payments: initialPayments,
        source: productSource === "catalog" ? "catalog" : "manual",
        warranty: data.warranty,
        warrantyExpiresAt,
        saleDate: saleDateStr,
      });

      // Se for do catálogo, marca produto como vendido
      if (productSource === "catalog") {
        productsStore.markAsSoldOnCredit(
          selectedProductId,
          customer.name,
          customer.cpfCnpj || "",
          data.salePrice,
          receivable.id,
          data.warranty,
          warrantyExpiresAt,
          saleDateStr
        );
      }

      await receivablesStore.refreshFromBackend();
      
      toast({
        title: "Venda registrada!",
        description: `${data.productName} - R$ ${data.salePrice.toFixed(2)}${productSource === "catalog" ? " (vinculado ao catálogo)" : ""}`,
      });

      form.reset();
      setSelectedProductId("");
      setProductSource("manual");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao registrar venda",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const [customer, setCustomer] = useState<any>(null);
  
  useEffect(() => {
    const loadCustomer = async () => {
      if (customerId) {
        const cust = await customersStore.getCustomerById(customerId);
        setCustomer(cust);
      } else {
        setCustomer(null);
      }
    };
    loadCustomer();
  }, [customerId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>➕ Nova Venda/Compra</DialogTitle>
          <DialogDescription>
            {customer && `Registrar venda para ${customer.code} - ${customer.name}`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Toggle Manual/Catálogo */}
            <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold text-sm">📦 Origem do Produto</h4>
              <RadioGroup 
                value={productSource} 
                onValueChange={(v) => {
                  const newSource = v as "manual" | "catalog";
                  
                  // Só limpa os campos se REALMENTE mudou de catalog → manual
                  if (productSource === "catalog" && newSource === "manual") {
                    setSelectedProductId("");
                    form.setValue("productName", "");
                    form.setValue("costPrice", 0);
                    form.setValue("salePrice", 0);
                  }
                  
                  setProductSource(newSource);
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="manual" id="manual" />
                  <Label htmlFor="manual" className="font-normal cursor-pointer">
                    📝 Produto Manual (sem vínculo com catálogo)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="catalog" id="catalog" />
                  <Label htmlFor="catalog" className="font-normal cursor-pointer">
                    🏪 Produto do Catálogo
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Nome do Produto - Campo ou Select */}
            {productSource === "manual" ? (
              <FormField
                control={form.control}
                name="productName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Produto/Serviço *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Notebook Dell" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <div className="space-y-2">
                <Label>Selecione o Produto *</Label>
                <Select 
                  value={selectedProductId} 
                  onValueChange={(productId) => {
                    setSelectedProductId(productId);
                    const product = catalogProducts.find(p => p.id === productId);
                    if (product) {
                      setSelectedProduct(product);
                      
                      // Preenche automaticamente os campos
                      const totalExpenses = product.expenses.reduce((sum, e) => sum + e.value, 0);
                      form.setValue("productName", product.name);
                      form.setValue("costPrice", totalExpenses);
                      
                      // Se já tiver cupom válido e produto tem preço B2B, aplicar
                      if (couponValidated && product.discountPrice && product.discountPrice < product.price) {
                        form.setValue("salePrice", product.discountPrice);
                      } else {
                        form.setValue("salePrice", product.price);
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um produto do catálogo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogProducts.length === 0 ? (
                      <SelectItem value="_empty" disabled>
                        Nenhum produto disponível
                      </SelectItem>
                    ) : (
                      catalogProducts.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - R$ {product.price.toFixed(2)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {selectedProductId && (
                  <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                    <Check className="h-4 w-4" />
                    Produto vinculado ao catálogo
                  </p>
                )}
              </div>
            )}

            {/* Preço de Custo */}
            <FormField
              control={form.control}
              name="costPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço de Custo (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Quanto você pagou no produto"
                      disabled={productSource === "catalog"}
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preço de Venda */}
            <FormField
              control={form.control}
              name="salePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço de Venda *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Por quanto você vendeu"
                      disabled={productSource === "catalog"}
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cupom de Desconto (apenas para produtos do catálogo) */}
            {productSource === "catalog" && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎟️</span>
                  <Label className="text-base font-semibold">Cupom de Desconto</Label>
                </div>
                
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Código do cupom"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponValidated(false);
                        setCouponError("");
                      }}
                      disabled={isLoading}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleValidateCoupon}
                    disabled={isLoading || !couponCode.trim()}
                  >
                    Validar
                  </Button>
                </div>

                {couponError && (
                  <p className="text-sm text-destructive">{couponError}</p>
                )}

                {couponValidated && selectedProduct?.discountPrice && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <Check className="h-4 w-4" />
                      <span>Cupom válido! Preço de lojista aplicado</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Preço Original:</span>
                        <p className="font-medium line-through">
                          R$ {selectedProduct.price.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Preço B2B:</span>
                        <p className="font-semibold text-green-600 dark:text-green-400">
                          R$ {selectedProduct.discountPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Economia: R$ {(selectedProduct.price - selectedProduct.discountPrice).toFixed(2)}
                    </p>
                  </div>
                )}
                
                {couponValidated && !selectedProduct?.discountPrice && couponDiscount > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <Check className="h-4 w-4" />
                      <span>Cupom válido! {couponDiscount}% de desconto aplicado</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mostrar lucro em tempo real */}
            {form.watch("costPrice") > 0 && form.watch("salePrice") > 0 && (
              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                  💰 Lucro: R$ {(form.watch("salePrice") - form.watch("costPrice")).toFixed(2)}
                </p>
              </div>
            )}

            {/* Data da Venda */}
            <FormField
              control={form.control}
              name="saleDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>📅 Data da Venda (opcional)</FormLabel>
                  <Popover open={saleDateOpen} onOpenChange={setSaleDateOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            <span>Data de hoje</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start" side="bottom" sideOffset={8} collisionPadding={8}>
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          if (date) {
                            field.onChange(date);
                            requestAnimationFrame(() => setSaleDateOpen(false));
                          }
                        }}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">
                    Se deixar em branco, usa a data de hoje
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Data de Vencimento */}
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data Vencimento (opcional)</FormLabel>
                  <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecione</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          setDueDateOpen(false);
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Pagamento Inicial Misto */}
            <div className="space-y-3">
              <FormLabel>💵 Pagamento Inicial (opcional)</FormLabel>
              <div className="grid grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="initialCash"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">💵 Dinheiro</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="initialPix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">📱 PIX</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="initialCard"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">💳 Cartão</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Total entrada: <strong className="text-foreground">
                  R$ {((form.watch("initialCash") || 0) + (form.watch("initialPix") || 0) + (form.watch("initialCard") || 0)).toFixed(2)}
                </strong>
              </p>
            </div>

            {/* Garantia */}
            <FormField
              control={form.control}
              name="warranty"
              render={({ field }) => (
                <FormItem>
                  <WarrantySelector value={field.value} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Observações */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalhes sobre a venda..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Seção Avançada - Vincular ao Catálogo */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                >
                  <span className="flex items-center gap-2">
                    🔽 Avançado: Vincular ao Catálogo
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      showAdvanced && "rotate-180"
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Se você já cadastrou este produto no seu catálogo, pode vincular a venda ao registro existente.
                  </p>
                  
              <RadioGroup 
                value={productSource} 
                onValueChange={(v) => {
                  const newSource = v as "manual" | "catalog";
                  
                  // Só limpa os campos se REALMENTE mudou de catalog → manual
                  if (productSource === "catalog" && newSource === "manual") {
                    setSelectedProductId("");
                    form.setValue("productName", "");
                    form.setValue("costPrice", 0);
                    form.setValue("salePrice", 0);
                  }
                  
                  setProductSource(newSource);
                }}
              >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="manual" id="manual" />
                      <Label htmlFor="manual" className="font-normal cursor-pointer">
                        📝 Venda Manual (sem vínculo)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="catalog" id="catalog" />
                      <Label htmlFor="catalog" className="font-normal cursor-pointer">
                        🏪 Vincular ao Catálogo
                      </Label>
                    </div>
                  </RadioGroup>

                  {productSource === "catalog" && (
                    <div className="space-y-2 pt-2">
                      <Label>Selecione o Produto *</Label>
                      <Select 
                        value={selectedProductId} 
                        onValueChange={(productId) => {
                          setSelectedProductId(productId);
                          const product = catalogProducts.find(p => p.id === productId);
                          if (product) {
                            setSelectedProduct(product);
                            
                            const totalExpenses = product.expenses.reduce((sum, e) => sum + e.value, 0);
                            form.setValue("productName", product.name);
                            form.setValue("brand", product.brand || "");
                            form.setValue("category", product.category || "");
                            form.setValue("costPrice", totalExpenses);
                            
                            // Se já tiver cupom válido e produto tem preço B2B, aplicar
                            if (couponValidated && product.discountPrice && product.discountPrice < product.price) {
                              form.setValue("salePrice", product.discountPrice);
                            } else {
                              form.setValue("salePrice", product.price);
                            }
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um produto..." />
                        </SelectTrigger>
                        <SelectContent>
                          {catalogProducts.length === 0 ? (
                            <SelectItem value="_empty" disabled>
                              Nenhum produto disponível
                            </SelectItem>
                          ) : (
                            catalogProducts.map(product => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} - R$ {product.price.toFixed(2)}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {selectedProductId && (
                        <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                          <Check className="h-4 w-4" />
                          Produto vinculado ao catálogo
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Registrando..." : "Registrar Venda"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
