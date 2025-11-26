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
    <div className="px-3 py-3 md:px-3 md:py-2.5 rounded-md border border-border bg-muted/40 shadow-sm hover:shadow transition-colors">
      {/* Mobile: Layout empilhado */}
      <div className="flex flex-col gap-2.5 sm:hidden">
        {/* Linha 1: Nome do produto */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm leading-tight flex-1">{receivable.productName}</h4>
          {getStatusBadge(receivable.status)}
        </div>

        {/* Linha 2: Garantia */}
        <div>
          {warrantyDays > 0 ? (
            <WarrantyBadge 
              saleDate={receivable.saleDate || receivable.createdAt}
              warrantyDays={warrantyDays}
              size="sm"
            />
          ) : (
            <Badge variant="secondary" className="h-5 px-2 text-[10px]">Sem garantia</Badge>
          )}
        </div>

        {/* Linha 3: Valores em grid */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground text-[10px] mb-0.5">Total</p>
            <p className="font-semibold">R$ {receivable.totalAmount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] mb-0.5">Pago</p>
            <p className="font-semibold text-green-600">R$ {receivable.paidAmount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] mb-0.5">Resta</p>
            <p className="font-semibold text-destructive">R$ {receivable.remainingAmount.toFixed(2)}</p>
          </div>
        </div>

        {/* Linha 4: Botão deletar (se arquivado) */}
        {isArchived && onDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(receivable.id)}
            className="w-full text-destructive hover:bg-destructive/10 border-destructive/20"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        )}
      </div>

      {/* Desktop: Layout horizontal */}
      <div className="hidden sm:flex items-center gap-3">
        {/* Esquerda: Nome + Garantia */}
        <div className="min-w-0 flex-1 flex items-center gap-2">
          <h4 className="font-medium text-sm truncate">{receivable.productName}</h4>
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

        {/* Meio: Totais */}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="opacity-60">Total</span>
          <span className="font-semibold">R$ {receivable.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          <span className="opacity-40">•</span>
          <span className="opacity-60">Pago</span>
          <span className="font-semibold text-green-600">R$ {receivable.paidAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          <span className="opacity-40">•</span>
          <span className="opacity-60">Resta</span>
          <span className="font-semibold text-destructive">R$ {receivable.remainingAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
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
