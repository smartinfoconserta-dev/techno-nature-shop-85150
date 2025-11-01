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
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { receivablesStore, Receivable } from "@/lib/receivablesStore";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  productName: z.string().min(1, "Nome do produto é obrigatório"),
  costPrice: z.number().optional(),
  salePrice: z.number().min(0.01, "Preço de venda deve ser maior que 0"),
  dueDate: z.date().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditReceivableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receivable: Receivable | null;
  onSuccess: () => void;
}

export function EditReceivableDialog({
  open,
  onOpenChange,
  receivable,
  onSuccess,
}: EditReceivableDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: "",
      costPrice: 0,
      salePrice: 0,
      notes: "",
    },
  });

  // Preencher formulário com dados existentes
  useEffect(() => {
    if (receivable && open) {
      form.reset({
        productName: receivable.productName,
        costPrice: receivable.costPrice || 0,
        salePrice: receivable.salePrice || receivable.totalAmount,
        dueDate: receivable.dueDate ? new Date(receivable.dueDate) : undefined,
        notes: receivable.notes || "",
      });
    }
  }, [receivable, open, form]);

  const onSubmit = async (data: FormData) => {
    if (!receivable) return;

    // Bloquear edição se tiver pagamentos
    if (receivable.payments && receivable.payments.length > 0) {
      toast({
        title: "Não é possível editar",
        description: "Este produto já possui pagamentos registrados. Cancele os pagamentos primeiro.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      receivablesStore.updateReceivable(receivable.id, {
        productName: data.productName,
        costPrice: data.costPrice || 0,
        salePrice: data.salePrice,
        totalAmount: data.salePrice,
        dueDate: data.dueDate ? format(data.dueDate, "yyyy-MM-dd") : undefined,
        notes: data.notes,
      });

      toast({
        title: "Venda atualizada!",
        description: `${data.productName} foi atualizado com sucesso`,
      });

      form.reset();
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar venda",
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
          <DialogTitle>✏️ Editar Venda/Compra</DialogTitle>
          <DialogDescription>
            {receivable && `Editando: ${receivable.productName}`}
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
                {isLoading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
