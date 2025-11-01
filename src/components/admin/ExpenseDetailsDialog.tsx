import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProductExpense } from "@/lib/productsStore";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DollarSign, CreditCard, Smartphone } from "lucide-react";

interface ExpenseDetailsDialogProps {
  expense: ProductExpense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
}

const ExpenseDetailsDialog = ({
  expense,
  open,
  onOpenChange,
  onDelete,
}: ExpenseDetailsDialogProps) => {
  if (!expense) return null;

  const getPaymentIcon = () => {
    switch (expense.paymentMethod) {
      case "cash":
        return <DollarSign className="w-5 h-5" />;
      case "pix":
        return <Smartphone className="w-5 h-5" />;
      case "card":
        return <CreditCard className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getPaymentLabel = () => {
    switch (expense.paymentMethod) {
      case "cash":
        return "Dinheiro";
      case "pix":
        return "PIX";
      case "card":
        return "Cartão";
      default:
        return "Não informado";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhes do Gasto</DialogTitle>
          <DialogDescription>Informações completas sobre este gasto</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Nome</p>
            <p className="text-lg font-semibold">{expense.label}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Valor</p>
            <p className="text-2xl font-bold text-orange-600">
              R$ {expense.value.toFixed(2)}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Forma de pagamento</p>
            <div className="flex items-center gap-2">
              {getPaymentIcon()}
              <p className="font-medium">{getPaymentLabel()}</p>
            </div>
          </div>

          {expense.sellerCpf && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">CPF do vendedor</p>
              <p className="font-mono">{expense.sellerCpf}</p>
            </div>
          )}

          {expense.description && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Descrição</p>
              <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                {expense.description}
              </p>
            </div>
          )}

          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm text-muted-foreground">Data de criação</p>
            <p className="text-sm">
              {format(new Date(expense.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseDetailsDialog;
