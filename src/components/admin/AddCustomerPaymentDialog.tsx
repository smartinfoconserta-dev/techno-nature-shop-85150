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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { receivablesStore } from "@/lib/receivablesStore";
import { customersStore } from "@/lib/customersStore";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
  cash: z.number().min(0, "Valor deve ser maior ou igual a 0"),
  pix: z.number().min(0, "Valor deve ser maior ou igual a 0"),
  card: z.number().min(0, "Valor deve ser maior ou igual a 0"),
  paymentDate: z.date(),
  notes: z.string().optional(),
}).refine((data) => (data.cash + data.pix + data.card) > 0, {
  message: "Pelo menos uma forma de pagamento deve ter valor",
  path: ["cash"],
});

type FormData = z.infer<typeof formSchema>;

interface AddCustomerPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string | null;
  onSuccess: () => void;
}

export function AddCustomerPaymentDialog({
  open,
  onOpenChange,
  customerId,
  onSuccess,
}: AddCustomerPaymentDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [distributionPreview, setDistributionPreview] = useState<Array<{
    receivableId: string;
    productName: string;
    amount: number;
  }>>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cash: 0,
      pix: 0,
      card: 0,
      paymentDate: new Date(),
      notes: "",
    },
  });

  const cash = form.watch("cash");
  const pix = form.watch("pix");
  const card = form.watch("card");
  
  const totalAmount = cash + pix + card;

  // Calcula preview da distribuição
  const calculateDistribution = (value: number) => {
    if (!customerId || value <= 0) {
      setDistributionPreview([]);
      return;
    }

    const openReceivables = receivablesStore
      .getReceivablesByCustomer(customerId)
      .filter(r => r.status !== "paid")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (openReceivables.length === 0) {
      setDistributionPreview([]);
      return;
    }

    let remaining = value;
    const preview: Array<{
      receivableId: string;
      productName: string;
      amount: number;
    }> = [];

    for (const receivable of openReceivables) {
      if (remaining <= 0) break;

      const allocation = Math.min(receivable.remainingAmount, remaining);
      preview.push({
        receivableId: receivable.id,
        productName: receivable.productName,
        amount: allocation,
      });

      remaining -= allocation;
    }

    setDistributionPreview(preview);
  };

  // Atualiza preview quando o valor muda
  const handleAmountChange = (value: number) => {
    calculateDistribution(value);
  };

  const onSubmit = async (data: FormData) => {
    if (!customerId) return;

    setIsLoading(true);

    try {
      const totalPayment = data.cash + data.pix + data.card;
      
      const openReceivables = receivablesStore
        .getReceivablesByCustomer(customerId)
        .filter(r => r.status !== "paid")
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      if (openReceivables.length === 0) {
        throw new Error("Cliente não possui compras em aberto");
      }

      const paymentDate = format(data.paymentDate, "yyyy-MM-dd");
      const customerName = customersStore.getCustomerById(customerId)?.name || "Cliente";
      
      // Processa cada método de pagamento separadamente
      const methods: Array<{ method: "cash" | "pix" | "card"; amount: number }> = [];
      if (data.cash > 0) methods.push({ method: "cash", amount: data.cash });
      if (data.pix > 0) methods.push({ method: "pix", amount: data.pix });
      if (data.card > 0) methods.push({ method: "card", amount: data.card });

      let totalApplied = 0;
      let appliedCount = 0;

      for (const { method, amount } of methods) {
        let remaining = amount;
        
        for (const receivable of openReceivables) {
          if (remaining <= 0) break;

          const currentRemaining = receivablesStore.getReceivablesByCustomer(customerId)
            .find(r => r.id === receivable.id)?.remainingAmount || 0;
          
          if (currentRemaining <= 0) continue;

          const allocation = Math.min(currentRemaining, remaining);

          receivablesStore.addPayment(receivable.id, {
            amount: allocation,
            paymentMethod: method,
            paymentDate,
            notes: data.notes || `Pagamento ${method.toUpperCase()} - ${customerName}`,
          });

          remaining -= allocation;
          totalApplied += allocation;
        }
      }

      appliedCount = openReceivables.filter(r => {
        const updated = receivablesStore.getReceivablesByCustomer(customerId)
          .find(rec => rec.id === r.id);
        return updated && updated.remainingAmount < r.remainingAmount;
      }).length;

      toast({
        title: "Pagamento registrado!",
        description: `R$ ${totalApplied.toFixed(2)} distribuído em ${appliedCount} compra${appliedCount > 1 ? 's' : ''}`,
      });

      const remaining = totalPayment - totalApplied;
      if (remaining > 0) {
        toast({
          title: "Atenção",
          description: `R$ ${remaining.toFixed(2)} não foram aplicados (todas as dívidas foram quitadas)`,
          variant: "default",
        });
      }

      form.reset();
      setDistributionPreview([]);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao registrar pagamento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const customer = customerId ? customersStore.getCustomerById(customerId) : null;
  const totalDue = customerId
    ? receivablesStore
        .getReceivablesByCustomer(customerId)
        .filter(r => r.status !== "paid")
        .reduce((sum, r) => sum + r.remainingAmount, 0)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>💰 Registrar Pagamento do Cliente</DialogTitle>
          <DialogDescription>
            {customer && `${customer.code} - ${customer.name}`}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-10rem)] pr-4">
          {totalDue === 0 ? (
            <Alert>
              <AlertDescription>
                Este cliente não possui dívidas em aberto.
              </AlertDescription>
            </Alert>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Alert>
                  <AlertDescription>
                    <strong>Total devedor:</strong> R$ {totalDue.toFixed(2)}
                  </AlertDescription>
                </Alert>

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
                              onChange={e => {
                                const value = parseFloat(e.target.value) || 0;
                                field.onChange(value);
                                handleAmountChange(value + pix + card);
                              }}
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
                              onChange={e => {
                                const value = parseFloat(e.target.value) || 0;
                                field.onChange(value);
                                handleAmountChange(cash + value + card);
                              }}
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
                              onChange={e => {
                                const value = parseFloat(e.target.value) || 0;
                                field.onChange(value);
                                handleAmountChange(cash + pix + value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Total: <strong className="text-foreground">R$ {totalAmount.toFixed(2)}</strong>
                  </p>
                </div>

                {/* Preview da Distribuição */}
                {distributionPreview.length > 0 && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">📋 Distribuição do Pagamento:</h4>
                    <div className="space-y-2">
                      {distributionPreview.map((item, idx) => (
                        <div key={idx} className="text-sm flex justify-between">
                          <span>{item.productName}</span>
                          <span className="font-semibold text-green-600">
                            R$ {item.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}


                {/* Data */}
                <FormField
                  control={form.control}
                  name="paymentDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data do Pagamento *</FormLabel>
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
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
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
                          placeholder="Detalhes sobre o pagamento..."
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
                  <Button type="submit" disabled={isLoading || totalDue === 0}>
                    {isLoading ? "Registrando..." : "Registrar Pagamento"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
