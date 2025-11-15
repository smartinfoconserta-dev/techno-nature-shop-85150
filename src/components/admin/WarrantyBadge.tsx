import { calculateWarranty } from "@/lib/warrantyHelper";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface WarrantyBadgeProps {
  saleDate: string;
  warrantyDays?: number;
  size?: "sm" | "default" | "lg";
}

const WarrantyBadge = ({ saleDate, warrantyDays, size = "default" }: WarrantyBadgeProps) => {
  // Se não foi passado warrantyDays, usar 90 como padrão
  // Usar ?? para respeitar warranty = 0 (sem garantia)
  const actualWarrantyDays = warrantyDays ?? 90;
  
  // Se warranty_days = 0, mostrar "Sem Garantia"
  if (actualWarrantyDays === 0) {
    return (
      <Badge variant="secondary" className="gap-1 bg-gray-100 text-gray-700 border-gray-300">
        <XCircle className="w-3 h-3" />
        Sem garantia
      </Badge>
    );
  }

  const warranty = calculateWarranty(saleDate, actualWarrantyDays);

  if (!warranty.isActive) {
    return (
      <Badge
        variant="destructive"
        className="gap-1 bg-red-100 text-red-700 border-red-300 hover:bg-red-100"
      >
        <XCircle className="w-3 h-3" />
        Garantia expirada
      </Badge>
    );
  }

  if (warranty.daysRemaining <= 7) {
    return (
      <Badge
        variant="destructive"
        className="gap-1 bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-100"
      >
        <AlertTriangle className="w-3 h-3" />
        {warranty.daysRemaining} {warranty.daysRemaining === 1 ? "dia" : "dias"} restantes
      </Badge>
    );
  }

  if (warranty.daysRemaining <= 30) {
    return (
      <Badge
        variant="secondary"
        className="gap-1 bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-100"
      >
        <AlertTriangle className="w-3 h-3" />
        {warranty.daysRemaining} dias restantes
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className="gap-1 bg-green-100 text-green-700 border-green-300 hover:bg-green-100"
    >
      <CheckCircle2 className="w-3 h-3" />
      {warranty.daysRemaining} dias restantes
    </Badge>
  );
};

export default WarrantyBadge;
