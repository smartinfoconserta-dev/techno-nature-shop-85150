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
import { CalendarIcon, Check } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { receivablesStore } from "@/lib/receivablesStore";
import { customersStore } from "@/lib/customersStore";
import { productsStore } from "@/lib/productsStore";
import { useToast } from "@/hooks/use-toast";
import WarrantySelector from "./WarrantySelector";

const formSchema = z.object({
  productName: z.string().min(1, "Nome do produto é obrigatório"),
  costPrice: z.number().optional(),
  salePrice: z.number().min(0.01, "Preço de venda deve ser maior que 0"),
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
  
  const catalogProducts = productsStore.getAvailableProducts();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: "",
      costPrice: 0,
      salePrice: 0,
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
      form.reset();
    }
  }, [open, form]);

  const onSubmit = async (data: FormData) => {
    if (!customerId) return;

    setIsLoading(true);

    try {
      const customer = customersStore.getCustomerById(customerId);
      if (!customer) {
        throw new Error("Cliente não encontrado");
      }

      // Validações específicas para catálogo
      if (productSource === "catalog" && !selectedProductId) {
        throw new Error("Selecione um produto do catálogo");
      }

      const finalProductId = productSource === "catalog" 
        ? selectedProductId 
        : `manual_${Date.now()}`;

      // Calcula total de entrada
      const totalInitial = (data.initialCash || 0) + (data.initialPix || 0) + (data.initialCard || 0);

      // Calcula data de expiração da garantia
      let warrantyExpiresAt: string | undefined;
      if (data.warranty > 0) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + data.warranty);
        warrantyExpiresAt = expirationDate.toISOString();
      }

      // Cria conta a receber
      const receivable = receivablesStore.addReceivable({
        customerId,
        customerCode: customer.code,
        customerName: customer.name,
        productId: finalProductId,
        productName: data.productName,
        costPrice: data.costPrice || 0,
        salePrice: data.salePrice,
        totalAmount: data.salePrice,
        paidAmount: totalInitial,
        dueDate: data.dueDate ? format(data.dueDate, "yyyy-MM-dd") : undefined,
        payments: [],
        source: productSource === "catalog" ? "catalog" : "manual",
        warranty: data.warranty,
        warrantyExpiresAt,
      });

      // Adiciona pagamentos iniciais separados se houver
      const paymentDate = format(new Date(), "yyyy-MM-dd");
      if (data.initialCash && data.initialCash > 0) {
        receivablesStore.addPayment(receivable.id, {
          amount: data.initialCash,
          paymentDate,
          paymentMethod: "cash",
          notes: data.notes || "Pagamento inicial - Dinheiro",
        });
      }
      if (data.initialPix && data.initialPix > 0) {
        receivablesStore.addPayment(receivable.id, {
          amount: data.initialPix,
          paymentDate,
          paymentMethod: "pix",
          notes: data.notes || "Pagamento inicial - PIX",
        });
      }
      if (data.initialCard && data.initialCard > 0) {
        receivablesStore.addPayment(receivable.id, {
          amount: data.initialCard,
          paymentDate,
          paymentMethod: "card",
          notes: data.notes || "Pagamento inicial - Cartão",
        });
      }

      // Se for do catálogo, marca produto como vendido
      if (productSource === "catalog") {
        productsStore.markAsSoldOnCredit(
          selectedProductId,
          customer.name,
          customer.cpfCnpj || "",
          data.salePrice,
          receivable.id,
          data.warranty,
          warrantyExpiresAt
        );
      }

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

  const customer = customerId ? customersStore.getCustomerById(customerId) : null;

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
                  setProductSource(v as "manual" | "catalog");
                  if (v === "manual") {
                    setSelectedProductId("");
                    form.setValue("productName", "");
                    form.setValue("costPrice", 0);
                    form.setValue("salePrice", 0);
                  }
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
                      // Preenche automaticamente os campos
                      const totalExpenses = product.expenses.reduce((sum, e) => sum + e.value, 0);
                      form.setValue("productName", product.name);
                      form.setValue("costPrice", totalExpenses);
                      form.setValue("salePrice", product.price);
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

            {/* Mostrar lucro em tempo real */}
            {form.watch("costPrice") > 0 && form.watch("salePrice") > 0 && (
              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                  💰 Lucro: R$ {(form.watch("salePrice") - form.watch("costPrice")).toFixed(2)}
                </p>
              </div>
            )}

            {/* Data de Vencimento */}
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data Vencimento (opcional)</FormLabel>
                  <Popover>
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
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
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
