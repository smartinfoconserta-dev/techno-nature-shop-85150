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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { quickSalesStore } from "@/lib/quickSalesStore";
import { useToast } from "@/hooks/use-toast";
import WarrantySelector from "./WarrantySelector";
import { InstallmentOption, getAllInstallmentOptions } from "@/lib/installmentHelper";
import { settingsStore } from "@/lib/settingsStore";

const formSchema = z.object({
  productName: z.string().min(1, "Nome do produto é obrigatório"),
  customerName: z.string().optional(),
  customerCpf: z.string().optional(),
  costPrice: z.number().min(0, "Preço de custo deve ser maior ou igual a 0"),
  salePrice: z.number().min(0.01, "Preço de venda deve ser maior que 0"),
  warranty: z.number(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddQuickSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddQuickSaleDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddQuickSaleDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [cash, setCash] = useState("");
  const [pix, setPix] = useState("");
  const [card, setCard] = useState("");
  const [selectedInstallment, setSelectedInstallment] = useState<InstallmentOption | null>(null);
  const [installmentOptions, setInstallmentOptions] = useState<InstallmentOption[]>([]);
  const [taxRate, setTaxRate] = useState(3.9);
  const [includeCashInTax, setIncludeCashInTax] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: "",
      customerName: "",
      customerCpf: "",
      costPrice: 0,
      salePrice: 0,
      warranty: 0,
      notes: "",
    },
  });

  const costPrice = form.watch("costPrice");
  const salePrice = form.watch("salePrice");

  // Calcular valores de pagamento
  const cashValue = parseFloat(cash) || 0;
  const pixValue = parseFloat(pix) || 0;
  const cardValue = parseFloat(card) || 0;
  const totalPayment = cashValue + pixValue + cardValue;

  // Calcular valor restante para o cartão
  const remainingAmount = salePrice - cashValue - pixValue;
  
  useEffect(() => {
    const loadSettings = async () => {
      const settings = await settingsStore.getSettings();
      setTaxRate(settings.digitalTaxRate);
      setIncludeCashInTax(settings.includeCashInTax);
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const loadOptions = async () => {
      if (remainingAmount > 0) {
        const options = await getAllInstallmentOptions(remainingAmount);
        setInstallmentOptions(options);
      } else {
        setInstallmentOptions([]);
      }
    };
    loadOptions();
  }, [remainingAmount]);
  
  // Calcula taxa com base nas configurações
  const getTaxAmount = () => {
    const taxableAmount = includeCashInTax 
      ? cashValue + pixValue + cardValue 
      : pixValue + cardValue;
    return taxableAmount * (taxRate / 100);
  };

  const getProfit = () => {
    const tax = getTaxAmount();
    return salePrice - costPrice - tax;
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);

    try {
      const totalPaid = cashValue + pixValue + cardValue;

      if (totalPaid === 0) {
        toast({
          title: "Erro",
          description: "Informe ao menos uma forma de pagamento",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (totalPaid < data.salePrice) {
        toast({
          title: "Pagamento incompleto",
          description: `Faltam R$ ${(data.salePrice - totalPaid).toFixed(2)}`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      const taxAmount = getTaxAmount();
      const saleDate = format(new Date(), "yyyy-MM-dd");

      // Calcula data de expiração da garantia
      let warrantyExpiresAt: string | undefined;
      if (data.warranty > 0) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + data.warranty);
        warrantyExpiresAt = expirationDate.toISOString();
      }

      // Venda à vista com pagamento misto
      await quickSalesStore.addQuickSale({
        productName: data.productName,
        customerName: data.customerName || undefined,
        customerCpf: data.customerCpf || undefined,
        costPrice: data.costPrice,
        salePrice: data.salePrice,
        paymentBreakdown: {
          cash: cashValue,
          pix: pixValue,
          card: cardValue,
        },
        taxAmount,
        warranty: data.warranty,
        warrantyExpiresAt,
        notes: data.notes,
        saleDate,
      });

      toast({
        title: "Venda registrada!",
        description: `${data.productName} - R$ ${data.salePrice.toFixed(2)}`,
      });

      form.reset();
      setCash("");
      setPix("");
      setCard("");
      setSelectedInstallment(null);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Venda Rápida (À Vista)</DialogTitle>
          <DialogDescription>
            Registre vendas à vista de produtos não catalogados
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Nome do Produto */}
            <FormField
              control={form.control}
              name="productName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Produto *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Mouse Gamer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Identificação do Cliente (Opcional) */}
            <div className="border-l-4 border-blue-400 pl-4 py-3 bg-blue-50 rounded">
              <p className="text-sm font-medium text-blue-900 mb-3">
                👤 Identificação do Cliente (Opcional)
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Pessoa</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: João Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="customerCpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input placeholder="Qualquer formato" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Preços */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de Custo *</FormLabel>
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
                name="salePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de Venda *</FormLabel>
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

            {/* Formas de Pagamento */}
            <div className="space-y-4">
              <FormLabel>💰 Formas de Pagamento *</FormLabel>
              
              <div className="space-y-3">
                {/* Dinheiro */}
                <div className="space-y-2">
                  <FormLabel className="text-sm">💵 Dinheiro</FormLabel>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    value={cash} 
                    onChange={(e) => setCash(e.target.value)} 
                    placeholder="0.00" 
                  />
                </div>
                
                {/* PIX */}
                <div className="space-y-2">
                  <FormLabel className="text-sm">📱 PIX</FormLabel>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    value={pix} 
                    onChange={(e) => setPix(e.target.value)} 
                    placeholder="0.00" 
                  />
                </div>
                
                {/* Cartão de Crédito */}
                <div className="space-y-2">
                  <FormLabel className="text-sm">💳 Cartão de Crédito</FormLabel>
                  
                  {remainingAmount > 0 ? (
                    <>
                      <Select 
                        value={selectedInstallment ? selectedInstallment.installments.toString() : ""} 
                        onValueChange={(value) => {
                          if (value === "none") {
                            setSelectedInstallment(null);
                            setCard("");
                          } else {
                            const installments = parseInt(value);
                            const option = installmentOptions.find(opt => opt.installments === installments);
                            if (option) {
                              setSelectedInstallment(option);
                              setCard(option.totalAmount.toString());
                            }
                          }
                        }}
                      >
                        <SelectTrigger className={selectedInstallment ? "border-primary ring-2 ring-primary/20" : ""}>
                          <SelectValue placeholder="Selecione o parcelamento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Não usar cartão</SelectItem>
                          {installmentOptions.length > 0 && installmentOptions.map((option) => (
                            <SelectItem key={option.installments} value={option.installments.toString()}>
                              {option.installments}x de R$ {option.installmentValue.toFixed(2)}
                              {option.rate > 0 && ` (taxa ${option.rate}%)`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {selectedInstallment && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg">
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Parcelas:</span>
                              <span className="font-semibold">
                                {selectedInstallment.installments}x de R$ {selectedInstallment.installmentValue.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total no cartão:</span>
                              <span className="font-bold text-blue-600">
                                R$ {selectedInstallment.totalAmount.toFixed(2)}
                              </span>
                            </div>
                            {selectedInstallment.rate > 0 && (
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Taxa:</span>
                                <span className="text-orange-600">
                                  R$ {selectedInstallment.feeAmount.toFixed(2)} ({selectedInstallment.rate}%)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                      {salePrice > 0 
                        ? "Preencha Dinheiro ou PIX primeiro para calcular o restante" 
                        : "Preencha o Preço de Venda primeiro"}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Resumo do Pagamento */}
              <div className="bg-primary/10 p-3 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm">💰 Resumo do Pagamento</h4>
                
                {cashValue > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">💵 Dinheiro:</span>
                    <span className="font-medium">R$ {cashValue.toFixed(2)}</span>
                  </div>
                )}
                
                {pixValue > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">📱 PIX:</span>
                    <span className="font-medium">R$ {pixValue.toFixed(2)}</span>
                  </div>
                )}
                
                {cardValue > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">💳 Cartão:</span>
                    <span className="font-medium">
                      R$ {cardValue.toFixed(2)}
                      {selectedInstallment && selectedInstallment.installments > 1 && (
                        <span className="text-xs ml-1">
                          ({selectedInstallment.installments}x de R$ {selectedInstallment.installmentValue.toFixed(2)})
                        </span>
                      )}
                    </span>
                  </div>
                )}
                
                {(cashValue > 0 || pixValue > 0 || cardValue > 0) && <Separator className="my-2" />}
                
                <div className="flex justify-between">
                  <span className="font-medium">Total Pago:</span>
                  <span className="text-lg font-bold text-green-600">
                    R$ {totalPayment.toFixed(2)}
                  </span>
                </div>
                
                {salePrice > 0 && totalPayment < salePrice && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Falta:</span>
                    <span className="text-lg font-bold text-red-600">
                      R$ {(salePrice - totalPayment).toFixed(2)}
                    </span>
                  </div>
                )}
                
                {totalPayment > salePrice && salePrice > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Troco:</span>
                    <span className="text-lg font-bold text-yellow-600">
                      R$ {(totalPayment - salePrice).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Lucro Calculado */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Lucro Líquido:</span>
                <span className={cn(
                  "text-lg font-bold",
                  getProfit() >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  R$ {getProfit().toFixed(2)}
                </span>
              </div>
              {getTaxAmount() > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  (Taxa 6%: R$ {getTaxAmount().toFixed(2)})
                </p>
              )}
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
                      placeholder="Detalhes adicionais sobre a venda..."
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
