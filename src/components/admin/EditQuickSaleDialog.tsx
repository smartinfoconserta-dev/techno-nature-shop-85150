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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { quickSalesStore, QuickSale } from "@/lib/quickSalesStore";
import { receivablesStore } from "@/lib/receivablesStore";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  productName: z.string().min(1, "Nome do produto é obrigatório"),
  customerName: z.string().optional(),
  customerCpf: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditQuickSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleId: string | null;
  onSuccess: () => void;
}

export function EditQuickSaleDialog({
  open,
  onOpenChange,
  saleId,
  onSuccess,
}: EditQuickSaleDialogProps) {
  const { toast } = useToast();
  const [sale, setSale] = useState<QuickSale | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [saleDate, setSaleDate] = useState<Date>(new Date());
  const [saleDateOpen, setSaleDateOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: "",
      customerName: "",
      customerCpf: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open && saleId) {
      const foundSale = quickSalesStore.getQuickSaleById(saleId);
      if (foundSale) {
        setSale(foundSale);
        setSaleDate(new Date(foundSale.saleDate));
        form.reset({
          productName: foundSale.productName,
          customerName: foundSale.customerName || "",
          customerCpf: foundSale.customerCpf || "",
          notes: foundSale.notes || "",
        });
      }
    }
  }, [open, saleId, form]);

  const onSubmit = async (data: FormData) => {
    if (!saleId) return;

    setIsLoading(true);
    try {
      await quickSalesStore.updateQuickSale(saleId, {
        productName: data.productName,
        customerName: data.customerName || undefined,
        customerCpf: data.customerCpf || undefined,
        notes: data.notes,
        saleDate: format(saleDate, "yyyy-MM-dd"),
      });

      toast({
        title: "Venda atualizada!",
        description: "As informações foram atualizadas com sucesso.",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!saleId || !sale) return;

    try {
      // Remove a venda rápida
      await quickSalesStore.deleteQuickSale(saleId);
      
      toast({
        title: "Venda excluída",
        description: "A venda foi removida com sucesso.",
      });

      setShowDeleteDialog(false);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!sale) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Venda Rápida</DialogTitle>
            <DialogDescription>
              Atualize as informações da venda
            </DialogDescription>
          </DialogHeader>

          {/* Informações não editáveis */}
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Custo:</span>
                <p className="font-semibold">R$ {sale.costPrice.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Venda:</span>
                <p className="font-semibold">R$ {sale.salePrice.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Lucro:</span>
                <p className={`font-semibold ${sale.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  R$ {sale.profit.toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Pagamento:</span>
                <p className="font-semibold">
                  {sale.paymentMethod === "cash" ? "💵 Dinheiro" : 
                   sale.paymentMethod === "pix" ? "📱 PIX" : "💳 Cartão"}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              ⚠️ Valores financeiros não podem ser alterados para manter a integridade dos dados
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Data da Venda */}
              <FormItem className="flex flex-col">
                <FormLabel>Data da Venda *</FormLabel>
                <Popover open={saleDateOpen} onOpenChange={setSaleDateOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !saleDate && "text-muted-foreground"
                        )}
                      >
                        {saleDate ? format(saleDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={saleDate}
                      onSelect={(date) => {
                        setSaleDate(date || new Date());
                        setSaleDateOpen(false);
                      }}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>

              {/* Nome do Produto */}
              <FormField
                control={form.control}
                name="productName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Produto</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Mouse Gamer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campos de Cliente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Pessoa (Opcional)</FormLabel>
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
                      <FormLabel>CPF (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Qualquer formato" {...field} />
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
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detalhes adicionais..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="flex justify-between items-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}