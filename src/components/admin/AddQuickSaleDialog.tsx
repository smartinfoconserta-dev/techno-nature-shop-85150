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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { quickSalesStore } from "@/lib/quickSalesStore";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  productName: z.string().min(1, "Nome do produto é obrigatório"),
  costPrice: z.number().min(0, "Preço de custo deve ser maior ou igual a 0"),
  salePrice: z.number().min(0.01, "Preço de venda deve ser maior que 0"),
  paymentMethod: z.enum(["cash", "pix", "card"]),
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

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: "",
      costPrice: 0,
      salePrice: 0,
      paymentMethod: "cash",
      notes: "",
    },
  });

  const paymentMethod = form.watch("paymentMethod");
  const salePrice = form.watch("salePrice");
  const costPrice = form.watch("costPrice");

  // Calcula taxa automaticamente
  const getTaxAmount = () => {
    if (paymentMethod === "pix" || paymentMethod === "card") {
      return salePrice * 0.06;
    }
    return 0;
  };

  const getProfit = () => {
    const tax = getTaxAmount();
    return salePrice - costPrice - tax;
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);

    try {
      const taxAmount = getTaxAmount();
      const saleDate = format(new Date(), "yyyy-MM-dd");

      // Venda à vista
      quickSalesStore.addQuickSale({
        productName: data.productName,
        costPrice: data.costPrice,
        salePrice: data.salePrice,
        paymentMethod: data.paymentMethod,
        taxAmount,
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

            {/* Forma de Pagamento */}
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de Pagamento *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cash" id="cash" />
                        <Label htmlFor="cash" className="cursor-pointer">💵 Dinheiro</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pix" id="pix" />
                        <Label htmlFor="pix" className="cursor-pointer">📱 PIX</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="cursor-pointer">💳 Cartão</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
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
