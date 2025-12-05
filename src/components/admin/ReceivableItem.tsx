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
        return <Badge className="bg-green-500 whitespace-nowrap text-xs">Pago</Badge>;
      case "partial":
        return <Badge className="bg-yellow-500 whitespace-nowrap text-xs">Parcial</Badge>;
      case "pending":
        return <Badge className="bg-red-500 whitespace-nowrap text-xs">Pendente</Badge>;
      default:
        return null;
    }
  };

  const ActionButtons = ({ size = "sm" }: { size?: "sm" | "icon" }) => (
    <>
      <Button variant="ghost" size={size} onClick={() => onViewDetails(receivable)} title="Ver detalhes">
        <Eye className="w-4 h-4" />
      </Button>
      {receivable.status !== "paid" && (
        <Button variant="ghost" size={size} onClick={() => onAddPayment(receivable)} title="Adicionar pagamento">
          <DollarSign className="w-4 h-4" />
        </Button>
      )}
      <Button variant="ghost" size={size} onClick={() => onEditCustomer(receivable.customerId)} title="Editar cliente">
        <Edit className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size={size} onClick={() => onGeneratePDF(receivable.customerId)} title="Gerar PDF">
        <FileDown className="w-4 h-4" />
      </Button>
      {onDelete && (
        <Button variant="ghost" size={size} onClick={() => onDelete(receivable)} title="Deletar">
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </>
  );

  return (
    <div className="border rounded-lg hover:bg-muted/50 transition-colors">
      {/* Mobile: Layout empilhado */}
      <div className="flex flex-col gap-2 p-3 sm:hidden">
        {/* Linha 1: Nome do produto + Status */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-sm leading-tight flex-1">{receivable.productName}</h3>
          {getStatusBadge(receivable.status)}
        </div>

        {/* Linha 2: Cliente + Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">{receivable.customerName}</span>
          {receivable.warranty && (
            <WarrantyBadge
              saleDate={receivable.saleDate || receivable.createdAt}
              warrantyDays={receivable.warranty}
            />
          )}
          {isOverdue && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">
              <AlertCircle className="w-3 h-3 mr-1" />
              VENCIDO
            </Badge>
          )}
        </div>

        {/* Linha 3: Valores em grid 3 colunas */}
        <div className="grid grid-cols-3 gap-2 text-xs bg-muted/30 rounded-md p-2">
          <div>
            <p className="text-muted-foreground text-[10px]">Total</p>
            <p className="font-semibold">{formatCurrency(receivable.totalAmount)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px]">Pago</p>
            <p className="font-semibold text-green-600">{formatCurrency(receivable.paidAmount)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px]">Resta</p>
            <p className={cn("font-semibold", receivable.remainingAmount > 0 ? "text-red-600" : "text-muted-foreground")}>
              {formatCurrency(receivable.remainingAmount)}
            </p>
          </div>
        </div>

        {/* Linha 4: Data de vencimento + Botões */}
        <div className="flex items-center justify-between border-t pt-2">
          <span className="text-xs text-muted-foreground">
            📅 Venc: {format(new Date(receivable.dueDate), "dd/MM/yyyy", { locale: ptBR })}
          </span>
          <div className="flex items-center gap-0.5">
            <ActionButtons size="icon" />
          </div>
        </div>
      </div>

      {/* Desktop: Layout horizontal */}
      <div className="hidden sm:flex items-center gap-3 p-3">
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
              {receivable.warranty && (
                <WarrantyBadge
                  saleDate={receivable.saleDate || receivable.createdAt}
                  warrantyDays={receivable.warranty}
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
          <ActionButtons size="sm" />
        </div>
      </div>
    </div>
  );
};

export default ReceivableItem;
