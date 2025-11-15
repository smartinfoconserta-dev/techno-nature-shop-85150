import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Eye, DollarSign, Edit, FileDown, AlertCircle, Trash2 } from "lucide-react";
import { Receivable } from "@/lib/receivablesStore";
import WarrantyBadge from "./WarrantyBadge";
import { cn } from "@/lib/utils";

interface ReceivableItemProps {
  receivable: Receivable;
  isOverdue: boolean;
  onViewDetails: (receivable: Receivable) => void;
  onAddPayment: (receivable: Receivable) => void;
  onEditCustomer: (customerId: string) => void;
  onGeneratePDF: (customerId: string) => void;
  onDelete?: (receivable: Receivable) => void;
}

const ReceivableItem = ({
  receivable,
  isOverdue,
  onViewDetails,
  onAddPayment,
  onEditCustomer,
  onGeneratePDF,
  onDelete,
}: ReceivableItemProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500 whitespace-nowrap">Pago</Badge>;
      case "partial":
        return <Badge className="bg-yellow-500 whitespace-nowrap">Parcial</Badge>;
      case "pending":
        return <Badge className="bg-red-500 whitespace-nowrap">Pendente</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      {/* Ícone */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
          <Package className="w-5 h-5 text-primary" />
        </div>
      </div>

      {/* Informações principais */}
      <div className="flex-1 min-w-0">
        {/* Linha 1: Nome do produto e cliente */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <h3 className="font-medium truncate">{receivable.productName}</h3>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              • {receivable.customerName}
            </span>
            {getStatusBadge(receivable.status)}
            {receivable.warrantyMonths && (
              <WarrantyBadge
                saleDate={receivable.createdAt}
                warrantyDays={receivable.warrantyMonths * 30}
              />
            )}
            {isOverdue && (
              <Badge variant="destructive" className="whitespace-nowrap">
                <AlertCircle className="w-3 h-3 mr-1" />
                VENCIDO
              </Badge>
            )}
          </div>
        </div>

        {/* Linha 2: Valores */}
        <div className="flex items-center gap-4 flex-wrap text-sm mb-1">
          <span className="text-muted-foreground">
            💰 Total: {formatCurrency(receivable.totalAmount)}
          </span>
          <span className="text-green-600">
            ✅ Pago: {formatCurrency(receivable.paidAmount)}
          </span>
          <span className={cn("font-medium", receivable.remainingAmount > 0 ? "text-red-600" : "text-muted-foreground")}>
            ❌ Resta: {formatCurrency(receivable.remainingAmount)}
          </span>
        </div>

        {/* Linha 3: Data de vencimento */}
        <div className="text-sm text-muted-foreground">
          📅 Venc: {format(new Date(receivable.dueDate), "dd/MM/yyyy", { locale: ptBR })}
        </div>
      </div>

      {/* Botões de ação */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button variant="ghost" size="sm" onClick={() => onViewDetails(receivable)} title="Ver detalhes">
          <Eye className="w-4 h-4" />
        </Button>
        {receivable.status !== "paid" && (
          <Button variant="ghost" size="sm" onClick={() => onAddPayment(receivable)} title="Adicionar pagamento">
            <DollarSign className="w-4 h-4" />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => onEditCustomer(receivable.customerId)} title="Editar cliente">
          <Edit className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onGeneratePDF(receivable.customerId)} title="Gerar PDF">
          <FileDown className="w-4 h-4" />
        </Button>
        {onDelete && (
          <Button variant="ghost" size="sm" onClick={() => onDelete(receivable)} title="Deletar">
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ReceivableItem;
