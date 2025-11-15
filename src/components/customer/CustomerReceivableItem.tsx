import { Package, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import WarrantyBadge from "@/components/admin/WarrantyBadge";

interface CustomerReceivableItemProps {
  receivable: {
    id: string;
    productName: string;
    brand?: string;
    createdAt: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    status: "pending" | "partial" | "paid";
    warrantyMonths?: number;
    dueDate?: string;
    autoArchived?: boolean;
  };
  isArchived: boolean;
  onDelete?: (id: string) => void;
  getStatusBadge: (status: "pending" | "partial" | "paid") => JSX.Element;
}

export const CustomerReceivableItem = ({ 
  receivable, 
  isArchived, 
  onDelete,
  getStatusBadge 
}: CustomerReceivableItemProps) => {
  const warrantyDays = receivable.warrantyMonths || 0;

  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg hover:shadow-sm transition-shadow bg-card">
      <Package className="h-8 w-8 text-muted-foreground flex-shrink-0" />
      
      <div className="flex-1 min-w-0 space-y-1">
        {/* Linha 1: Nome + Status + Garantia */}
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-semibold text-sm truncate">{receivable.productName}</h4>
          {getStatusBadge(receivable.status)}
          {warrantyDays > 0 ? (
            <WarrantyBadge 
              saleDate={receivable.createdAt}
              warrantyDays={warrantyDays}
              size="sm"
            />
          ) : (
            <Badge variant="outline" className="text-xs">
              Sem garantia
            </Badge>
          )}
          {receivable.autoArchived && (
            <Badge variant="outline" className="text-xs">
              Auto-arquivado
            </Badge>
          )}
        </div>
        
        {/* Linha 2: Marca + Data */}
        <p className="text-xs text-muted-foreground">
          {receivable.brand && <span className="font-medium">{receivable.brand}</span>}
          {receivable.brand && " • "}
          {format(new Date(receivable.createdAt), "dd/MM/yyyy", { locale: ptBR })}
        </p>
        
        {/* Linha 3: Valores */}
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <span className="text-muted-foreground">
            💰 Total: <span className="font-semibold text-foreground">
              R$ {receivable.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </span>
          <span className="text-muted-foreground">
            ✅ Pago: <span className="font-semibold text-green-600">
              R$ {receivable.paidAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </span>
          {receivable.remainingAmount > 0 && (
            <span className="text-muted-foreground">
              ❌ Resta: <span className="font-semibold text-red-600">
                R$ {receivable.remainingAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Botão de deletar apenas para arquivadas */}
      {isArchived && onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={() => onDelete(receivable.id)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      )}
    </div>
  );
};
