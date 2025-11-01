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

const formSchema = z.object({
  amount: z.number().min(0.01, "Valor deve ser maior que 0"),
  paymentMethod: z.enum(["cash", "pix", "card"]),
  paymentDate: z.date(),
  notes: z.string().optional(),
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
      amount: 0,
      paymentMethod: "cash",
      paymentDate: new Date(),
      notes: "",
    },
  });

  const amount = form.watch("amount");

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
      const openReceivables = receivablesStore
        .getReceivablesByCustomer(customerId)
        .filter(r => r.status !== "paid")
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      if (openReceivables.length === 0) {
        throw new Error("Cliente não possui compras em aberto");
      }

      let remaining = data.amount;
      const paymentDate = format(data.paymentDate, "yyyy-MM-dd");
      let appliedCount = 0;

      for (const receivable of openReceivables) {
        if (remaining <= 0) break;

        const allocation = Math.min(receivable.remainingAmount, remaining);

        receivablesStore.addPayment(receivable.id, {
          amount: allocation,
          paymentMethod: data.paymentMethod,
          paymentDate,
          notes: data.notes || `Pagamento do cliente ${customersStore.getCustomerById(customerId)?.name}`,
        });

        remaining -= allocation;
        appliedCount++;
      }

      const totalApplied = data.amount - remaining;

      toast({
        title: "Pagamento registrado!",
        description: `R$ ${totalApplied.toFixed(2)} distribuído em ${appliedCount} compra${appliedCount > 1 ? 's' : ''}`,
      });

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>💰 Registrar Pagamento do Cliente</DialogTitle>
          <DialogDescription>
            {customer && `${customer.code} - ${customer.name}`}
          </DialogDescription>
        </DialogHeader>

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

              {/* Valor */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor do Pagamento *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={e => {
                          const value = parseFloat(e.target.value) || 0;
                          field.onChange(value);
                          handleAmountChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                          <RadioGroupItem value="cash" id="cash-payment" />
                          <Label htmlFor="cash-payment" className="cursor-pointer">
                            💵 Dinheiro
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="pix" id="pix-payment" />
                          <Label htmlFor="pix-payment" className="cursor-pointer">
                            📱 PIX
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="card" id="card-payment" />
                          <Label htmlFor="card-payment" className="cursor-pointer">
                            💳 Cartão
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
      </DialogContent>
    </Dialog>
  );
}
