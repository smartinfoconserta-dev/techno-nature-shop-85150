import { useState } from "react";
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
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { quickSalesStore } from "@/lib/quickSalesStore";
import { useToast } from "@/hooks/use-toast";
import WarrantySelector from "./WarrantySelector";

const formSchema = z.object({
  productName: z.string().min(1, "Nome do produto é obrigatório"),
  customerName: z.string().optional(),
  customerCpf: z.string().optional(),
  costPrice: z.number().min(0, "Preço de custo deve ser maior ou igual a 0"),
  salePrice: z.number().min(0.01, "Preço de venda deve ser maior que 0"),
  cash: z.number().min(0, "Valor deve ser maior ou igual a 0"),
  pix: z.number().min(0, "Valor deve ser maior ou igual a 0"),
  card: z.number().min(0, "Valor deve ser maior ou igual a 0"),
  warranty: z.number(),
  notes: z.string().optional(),
}).refine((data) => (data.cash + data.pix + data.card) > 0, {
  message: "Pelo menos uma forma de pagamento deve ter valor",
  path: ["cash"],
}).refine((data) => (data.cash + data.pix + data.card) <= data.salePrice, {
  message: "Total dos pagamentos não pode exceder o preço de venda",
  path: ["cash"],
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

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: "",
      customerName: "",
      customerCpf: "",
      costPrice: 0,
      salePrice: 0,
      cash: 0,
      pix: 0,
      card: 0,
      warranty: 0,
      notes: "",
    },
  });

  const cash = form.watch("cash");
  const pix = form.watch("pix");
  const card = form.watch("card");
  const costPrice = form.watch("costPrice");
  const salePrice = form.watch("salePrice");

  const totalPayment = cash + pix + card;
  
  // Calcula taxa automaticamente (6% sobre pix + card)
  const getTaxAmount = () => {
    return (pix + card) * 0.06;
  };

  const getProfit = () => {
    const tax = getTaxAmount();
    return salePrice - costPrice - tax;
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);

    try {
      const totalPaid = data.cash + data.pix + data.card;
      
      if (totalPaid > data.salePrice) {
        toast({
          title: "Erro",
          description: "Total dos pagamentos não pode exceder o preço de venda",
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
      quickSalesStore.addQuickSale({
        productName: data.productName,
        customerName: data.customerName || undefined,
        customerCpf: data.customerCpf || undefined,
        costPrice: data.costPrice,
        salePrice: data.salePrice,
        paymentBreakdown: {
          cash: data.cash,
          pix: data.pix,
          card: data.card,
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
                        <Input placeholder="000.000.000-00" {...field} />
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

            {/* Formas de Pagamento Misto */}
            <div className="space-y-3">
              <FormLabel>💰 Formas de Pagamento *</FormLabel>
              <div className="grid grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="cash"
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
                  name="pix"
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
                  name="card"
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
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Pago:</span>
                <strong className="text-foreground">R$ {totalPayment.toFixed(2)}</strong>
              </div>
              {totalPayment > 0 && salePrice > 0 && totalPayment !== salePrice && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Preço de Venda:</span>
                  <strong className="text-foreground">R$ {salePrice.toFixed(2)}</strong>
                </div>
              )}
              {totalPayment > salePrice && (
                <p className="text-xs text-destructive">
                  ⚠️ Pagamento excede o preço de venda
                </p>
              )}
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
