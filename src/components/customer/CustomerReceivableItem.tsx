import { Package, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import WarrantyBadge from "@/components/admin/WarrantyBadge";
import { getWarrantyDays } from "@/lib/warrantyHelper";

interface CustomerReceivableItemProps {
  receivable: {
    id: string;
    productName: string;
    brand?: string;
    saleDate?: string;
    createdAt: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    status: "pending" | "partial" | "paid";
    warranty?: number;
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
  // Usar helper centralizado para garantia consistente
  const warrantyDays = getWarrantyDays({ warranty: receivable.warranty });

  return (
    <div className="p-3 md:p-4 border rounded-lg hover:shadow-sm transition-shadow bg-card">
      <div className="space-y-2">
        {/* Linha 1: Nome + Status */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-sm md:text-base flex-1">{receivable.productName}</h4>
          {getStatusBadge(receivable.status)}
        </div>
        
        {/* Linha 2: Garantia + Marca + Data */}
        <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground">
          {warrantyDays > 0 ? (
            <WarrantyBadge 
              saleDate={receivable.saleDate || receivable.createdAt}
              warrantyDays={warrantyDays}
              size="sm"
            />
          ) : (
            <Badge variant="outline" className="text-xs">Sem garantia</Badge>
          )}
          {receivable.autoArchived && (
            <Badge variant="outline" className="text-xs">Auto-arquivado</Badge>
          )}
          {receivable.brand && (
            <>
              <span>•</span>
              <span className="font-medium">{receivable.brand}</span>
            </>
          )}
          <span>•</span>
          <span>{format(new Date(receivable.createdAt), "dd/MM/yyyy", { locale: ptBR })}</span>
        </div>
        
        {/* Linha 3: Valores em Grid */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex flex-col">
            <span className="text-muted-foreground">💰 Total</span>
            <span className="font-semibold">
              R$ {receivable.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">✅ Pago</span>
            <span className="font-semibold text-green-600">
              R$ {receivable.paidAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">❌ Resta</span>
            <span className="font-semibold text-destructive">
              R$ {receivable.remainingAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Botão de deletar apenas para arquivadas */}
        {isArchived && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(receivable.id)}
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 mt-2"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Deletar
          </Button>
        )}
      </div>
    </div>
  );
};
