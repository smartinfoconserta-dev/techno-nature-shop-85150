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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { quickSalesStore } from "@/lib/quickSalesStore";
import { receivablesStore } from "@/lib/receivablesStore";
import { customersStore, Customer } from "@/lib/customersStore";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  productName: z.string().min(1, "Nome do produto é obrigatório"),
  costPrice: z.number().min(0, "Preço de custo deve ser maior ou igual a 0"),
  salePrice: z.number().min(0.01, "Preço de venda deve ser maior que 0"),
  saleType: z.enum(["immediate", "receivable"]),
  paymentMethod: z.enum(["cash", "pix", "card"]).optional(),
  customerId: z.string().optional(),
  dueDate: z.date().optional(),
  initialPayment: z.number().optional(),
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: "",
      costPrice: 0,
      salePrice: 0,
      saleType: "immediate",
      paymentMethod: "cash",
      initialPayment: 0,
      notes: "",
    },
  });

  const saleType = form.watch("saleType");
  const paymentMethod = form.watch("paymentMethod");
  const salePrice = form.watch("salePrice");
  const costPrice = form.watch("costPrice");

  // Carrega clientes quando abre o dialog
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setCustomers(customersStore.getActiveCustomers());
    }
    onOpenChange(newOpen);
  };

  // Calcula taxa automaticamente
  const getTaxAmount = () => {
    if (saleType === "immediate" && (paymentMethod === "pix" || paymentMethod === "card")) {
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

      if (data.saleType === "immediate") {
        // Venda à vista
        if (!data.paymentMethod) {
          throw new Error("Forma de pagamento é obrigatória");
        }

        quickSalesStore.addQuickSale({
          productName: data.productName,
          costPrice: data.costPrice,
          salePrice: data.salePrice,
          saleType: "immediate",
          paymentMethod: data.paymentMethod,
          taxAmount,
          notes: data.notes,
          saleDate,
        });

        toast({
          title: "Venda registrada!",
          description: `${data.productName} - R$ ${data.salePrice.toFixed(2)}`,
        });
      } else {
        // Venda a prazo
        if (!data.customerId) {
          throw new Error("Cliente é obrigatório para vendas a prazo");
        }
        if (!data.dueDate) {
          throw new Error("Data de vencimento é obrigatória");
        }

        const customer = customers.find(c => c.id === data.customerId);
        if (!customer) {
          throw new Error("Cliente não encontrado");
        }

        // Cria conta a receber
        const receivable = receivablesStore.addReceivable({
          customerId: data.customerId,
          customerCode: customer.code,
          customerName: customer.name,
          productId: `quick_sale_${Date.now()}`,
          productName: data.productName,
          totalAmount: data.salePrice,
          paidAmount: data.initialPayment || 0,
          dueDate: format(data.dueDate, "yyyy-MM-dd"),
          payments: [],
        });

        // Adiciona pagamento inicial se houver
        if (data.initialPayment && data.initialPayment > 0) {
          receivablesStore.addPayment(receivable.id, {
            amount: data.initialPayment,
            paymentDate: format(new Date(), "yyyy-MM-dd"),
            paymentMethod: "cash",
          });
        }

        // Registra venda rápida vinculada
        quickSalesStore.addQuickSale({
          productName: data.productName,
          costPrice: data.costPrice,
          salePrice: data.salePrice,
          saleType: "receivable",
          customerId: data.customerId,
          receivableId: receivable.id,
          notes: data.notes,
          saleDate,
        });

        toast({
          title: "Venda a prazo criada!",
          description: `${data.productName} - ${customer.name}`,
        });
      }

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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Venda Rápida</DialogTitle>
          <DialogDescription>
            Registre vendas de produtos não catalogados
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

            {/* Tipo de Venda */}
            <FormField
              control={form.control}
              name="saleType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Venda *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="immediate" id="immediate" />
                        <Label htmlFor="immediate" className="cursor-pointer">
                          À vista (registra agora)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="receivable" id="receivable" />
                        <Label htmlFor="receivable" className="cursor-pointer">
                          A prazo (vai p/ receber)
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campos para À VISTA */}
            {saleType === "immediate" && (
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
            )}

            {/* Campos para A PRAZO */}
            {saleType === "receivable" && (
              <>
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map(customer => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.code} - {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data Vencimento *</FormLabel>
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

                  <FormField
                    control={form.control}
                    name="initialPayment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Entrada (opcional)</FormLabel>
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
              </>
            )}

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