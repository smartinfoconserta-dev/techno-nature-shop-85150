import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle } from "lucide-react";

interface RequestStatusBadgeProps {
  status: "pending" | "confirmed" | "rejected";
}

export const RequestStatusBadge = ({ status }: RequestStatusBadgeProps) => {
  if (status === "confirmed") {
    return (
      <Badge className="gap-1 bg-green-100 text-green-700 border-green-300 hover:bg-green-100">
        <CheckCircle2 className="w-3 h-3" />
        Confirmado
      </Badge>
    );
  }

  if (status === "rejected") {
    return (
      <Badge className="gap-1 bg-red-100 text-red-700 border-red-300 hover:bg-red-100">
        <XCircle className="w-3 h-3" />
        Rejeitado
      </Badge>
    );
  }

  // pending
  return (
    <Badge className="gap-1 bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-100">
      <Clock className="w-3 h-3" />
      Aguardando Confirmação
    </Badge>
  );
};
