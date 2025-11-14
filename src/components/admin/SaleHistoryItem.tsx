import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, XCircle, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import WarrantyBadge from "./WarrantyBadge";
import { Product } from "@/lib/productsStore";
import { QuickSale } from "@/lib/quickSalesStore";
import { Receivable } from "@/lib/receivablesStore";

interface HistorySale {
  id: string;
  type: "catalog" | "quick" | "receivable";
  productName: string;
  buyerName?: string;
  buyerCpf?: string;
  salePrice: number;
  costPrice?: number;
  profit?: number;
  saleDate: string;
  warranty?: number;
  paymentBreakdown?: { cash: number; pix: number; card: number };
  taxAmount?: number;
  status?: string;
  notes?: string;
  originalData: Product | QuickSale | Receivable;
}

interface SaleHistoryItemProps {
  sale: HistorySale;
  warrantyDays: number;
  onEdit?: (product: Product) => void;
  onCancel?: (product: Product) => void;
}

const SaleHistoryItem = ({ sale, warrantyDays, onEdit, onCancel }: SaleHistoryItemProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "catalog":
        return { label: "Catálogo", icon: "📦" };
      case "quick":
        return { label: "Venda Rápida", icon: "⚡" };
      case "receivable":
        return { label: "Caderneta", icon: "📝" };
      default:
        return { label: "Outro", icon: "•" };
    }
  };

  const typeInfo = getTypeLabel(sale.type);

  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      {/* Imagem/Ícone do produto */}
      <div className="flex-shrink-0">
        {sale.type === "catalog" && (sale.originalData as Product).images?.[0] ? (
          <img
            src={(sale.originalData as Product).images[0]}
            alt={sale.productName}
            className="w-12 h-12 object-cover rounded"
          />
        ) : (
          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
            <Package className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Informações principais */}
      <div className="flex-1 min-w-0">
        {/* Linha 1: Nome e preço */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <h3 className="font-medium truncate">{sale.productName}</h3>
            <span className="text-sm font-semibold text-primary whitespace-nowrap">
              {formatCurrency(sale.salePrice)}
            </span>
            <Badge variant="secondary" className="text-xs whitespace-nowrap">
              {typeInfo.icon} {typeInfo.label}
            </Badge>
            <WarrantyBadge saleDate={sale.saleDate} warrantyDays={warrantyDays} />
          </div>
        </div>

        {/* Linha 2: Comprador */}
        {sale.buyerName && (
          <div className="text-sm text-muted-foreground mb-1">
            {sale.buyerName}
            {sale.buyerCpf && ` • CPF: ${sale.buyerCpf}`}
          </div>
        )}

        {/* Linha 3: Detalhes financeiros */}
        <div className="flex items-center gap-4 flex-wrap text-sm">
          {sale.paymentBreakdown && (
            <>
              {sale.paymentBreakdown.cash > 0 && (
                <span className="text-muted-foreground">
                  💵 {formatCurrency(sale.paymentBreakdown.cash)}
                </span>
              )}
              {sale.paymentBreakdown.pix > 0 && (
                <span className="text-muted-foreground">
                  📱 {formatCurrency(sale.paymentBreakdown.pix)}
                </span>
              )}
              {sale.paymentBreakdown.card > 0 && (
                <span className="text-muted-foreground">
                  💳 {formatCurrency(sale.paymentBreakdown.card)}
                </span>
              )}
            </>
          )}
          {sale.profit !== undefined && (
            <span className={cn("font-medium", sale.profit >= 0 ? "text-green-600" : "text-red-600")}>
              💵 Lucro: {formatCurrency(sale.profit)}
            </span>
          )}
          <span className="text-muted-foreground">
            📅 {format(new Date(sale.saleDate), "dd/MM/yyyy", { locale: ptBR })}
          </span>
        </div>
      </div>

      {/* Botões de ação */}
      {sale.type === "catalog" && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(sale.originalData as Product)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCancel(sale.originalData as Product)}
            >
              <XCircle className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default SaleHistoryItem;
