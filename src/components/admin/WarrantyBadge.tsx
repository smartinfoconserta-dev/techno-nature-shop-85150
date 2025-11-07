import { calculateWarranty } from "@/lib/warrantyHelper";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface WarrantyBadgeProps {
  saleDate: string;
  warrantyDays?: number;
  size?: "sm" | "default" | "lg";
}

const WarrantyBadge = ({ saleDate, warrantyDays = 90, size = "default" }: WarrantyBadgeProps) => {
  const warranty = calculateWarranty(saleDate, warrantyDays);

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
