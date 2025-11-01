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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { receivablesStore } from "@/lib/receivablesStore";
import { customersStore } from "@/lib/customersStore";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  productName: z.string().min(1, "Nome do produto é obrigatório"),
  totalAmount: z.number().min(0.01, "Valor total deve ser maior que 0"),
  dueDate: z.date().optional(),
  initialPayment: z.number().optional(),
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

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: "",
      totalAmount: 0,
      initialPayment: 0,
      notes: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!customerId) return;

    setIsLoading(true);

    try {
      const customer = customersStore.getCustomerById(customerId);
      if (!customer) {
        throw new Error("Cliente não encontrado");
      }

      // Cria conta a receber
      const receivable = receivablesStore.addReceivable({
        customerId,
        customerCode: customer.code,
        customerName: customer.name,
        productId: `manual_${Date.now()}`,
        productName: data.productName,
        totalAmount: data.totalAmount,
        paidAmount: data.initialPayment || 0,
        dueDate: data.dueDate ? format(data.dueDate, "yyyy-MM-dd") : undefined,
        payments: [],
        source: "manual",
      });

      // Adiciona pagamento inicial se houver
      if (data.initialPayment && data.initialPayment > 0) {
        receivablesStore.addPayment(receivable.id, {
          amount: data.initialPayment,
          paymentDate: format(new Date(), "yyyy-MM-dd"),
          paymentMethod: "cash",
          notes: data.notes || "Pagamento inicial",
        });
      }

      toast({
        title: "Venda registrada!",
        description: `${data.productName} - R$ ${data.totalAmount.toFixed(2)}`,
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
            {/* Nome do Produto */}
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

            {/* Valor Total */}
            <FormField
              control={form.control}
              name="totalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Total *</FormLabel>
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

            <div className="grid grid-cols-2 gap-4">
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

              {/* Valor Entrada */}
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
