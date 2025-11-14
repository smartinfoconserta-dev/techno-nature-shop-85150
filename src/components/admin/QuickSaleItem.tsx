import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Edit } from "lucide-react";
import { QuickSale } from "@/lib/quickSalesStore";
import WarrantyBadge from "./WarrantyBadge";
import { cn } from "@/lib/utils";

interface QuickSaleItemProps {
  sale: QuickSale;
  onEdit: (saleId: string) => void;
}

const QuickSaleItem = ({ sale, onEdit }: QuickSaleItemProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getPaymentIcon = (method?: string) => {
    switch (method) {
      case "cash":
        return "💵";
      case "pix":
        return "📱";
      case "card":
        return "💳";
      default:
        return "💰";
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      {/* Ícone */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 bg-yellow-500/10 rounded flex items-center justify-center">
          <Zap className="w-5 h-5 text-yellow-600" />
        </div>
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
            {sale.warranty && sale.warranty > 0 && (
              <WarrantyBadge
                saleDate={sale.saleDate}
                warrantyDays={sale.warranty}
              />
            )}
            {sale.paymentMethod && (
              <Badge variant="outline" className="text-xs whitespace-nowrap">
                {getPaymentIcon(sale.paymentMethod)}{" "}
                {sale.paymentMethod === "cash"
                  ? "Dinheiro"
                  : sale.paymentMethod === "pix"
                  ? "PIX"
                  : "Cartão"}
              </Badge>
            )}
          </div>
        </div>

        {/* Linha 2: Cliente e data */}
        <div className="text-sm text-muted-foreground mb-1">
          {sale.customerName} • {format(new Date(sale.saleDate), "dd/MM/yyyy", { locale: ptBR })}
        </div>

        {/* Linha 3: Valores */}
        <div className="flex items-center gap-4 flex-wrap text-sm">
          <span className="text-muted-foreground">
            💰 Custo: {formatCurrency(sale.costPrice)}
          </span>
          <span className={cn("font-medium", sale.profit >= 0 ? "text-green-600" : "text-red-600")}>
            💵 Lucro: {formatCurrency(sale.profit)}
          </span>
          {sale.taxAmount && sale.taxAmount > 0 && (
            <span className="text-muted-foreground">
              📊 Taxa: {formatCurrency(sale.taxAmount)}
            </span>
          )}
        </div>
      </div>

      {/* Botão de editar */}
      <div className="flex-shrink-0">
        <Button variant="ghost" size="sm" onClick={() => onEdit(sale.id)}>
          <Edit className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default QuickSaleItem;
