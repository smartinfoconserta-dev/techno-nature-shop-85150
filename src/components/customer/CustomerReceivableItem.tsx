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
    <div className="px-3 py-2 md:px-3 md:py-2.5 rounded-md border border-border bg-muted/40 shadow-sm hover:shadow transition-colors">
      <div className="flex items-center gap-2 md:gap-3">
        {/* Esquerda: Nome + Garantia */}
        <div className="min-w-0 flex-1 flex items-center gap-2">
          <h4 className="font-medium text-[13px] md:text-sm truncate">{receivable.productName}</h4>
          {warrantyDays > 0 ? (
            <WarrantyBadge 
              saleDate={receivable.saleDate || receivable.createdAt}
              warrantyDays={warrantyDays}
              size="sm"
            />
          ) : (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] shrink-0">Sem garantia</Badge>
          )}
        </div>

        {/* Meio: Totais (desktop) */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="opacity-60">Total</span>
          <span className="font-semibold">R$ {receivable.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          <span className="opacity-40">•</span>
          <span className="opacity-60">Pago</span>
          <span className="font-semibold text-green-600">R$ {receivable.paidAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          <span className="opacity-40">•</span>
          <span className="opacity-60">Resta</span>
          <span className="font-semibold text-destructive">R$ {receivable.remainingAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
        </div>

        {/* Meio: Totais (mobile - abreviado) */}
        <div className="sm:hidden flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span>Tot R$ {receivable.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          <span className="opacity-40">•</span>
          <span className="text-green-600">Pgo R$ {receivable.paidAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          <span className="opacity-40">•</span>
          <span className="text-destructive">Rst R$ {receivable.remainingAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
        </div>

        {/* Direita: Deletar + Status */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isArchived && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(receivable.id)}
              className="h-8 w-8 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {getStatusBadge(receivable.status)}
        </div>
      </div>
    </div>
  );
};
