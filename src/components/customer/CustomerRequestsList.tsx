import { useEffect, useState } from "react";
import { customerRequestsStore, CustomerRequest } from "@/lib/customerRequestsStore";
import { RequestStatusBadge } from "./RequestStatusBadge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Package, Shield } from "lucide-react";
import { calculateWarranty } from "@/lib/warrantyHelper";

interface Props {
  refreshKey?: number;
}

export const CustomerRequestsList = ({ refreshKey }: Props) => {
  const [requests, setRequests] = useState<CustomerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    try {
      const data = await customerRequestsStore.getCustomerRequests();
      setRequests(data);
    } catch (error) {
      console.error("Erro ao carregar solicitações:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground border rounded-lg bg-card">
        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Nenhuma solicitação ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {requests.map((request) => {
        const warrantyDays = request.warranty_months ? request.warranty_months * 30 : 0;
        let warrantyText = null;
        
        if (request.warranty_months && request.warranty_months > 0) {
          if (request.status === 'confirmed' && request.confirmed_at) {
            const warranty = calculateWarranty(request.confirmed_at, warrantyDays);
            warrantyText = warranty.isActive 
              ? `${warranty.daysRemaining} dias restantes`
              : `Expirada`;
          } else {
            warrantyText = `${request.warranty_months} ${request.warranty_months === 1 ? 'mês' : 'meses'}`;
          }
        }

        return (
          <div key={request.id} className="flex items-center gap-3 p-3 border rounded-lg hover:shadow-sm transition-shadow bg-card">
            <Package className="h-8 w-8 text-primary flex-shrink-0" />
            
            <div className="flex-1 min-w-0 space-y-1">
              {/* Linha 1: Nome + Badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-sm truncate">{request.product_name}</h4>
                <RequestStatusBadge status={request.status} />
              </div>
              
              {/* Linha 2: Data + Valor */}
              <p className="text-xs text-muted-foreground">
                {format(new Date(request.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} • 
                <span className="font-semibold text-foreground ml-1">
                  R$ {request.sale_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </p>
              
              {/* Linha 3: Garantia + Notas */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {warrantyText && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Shield className="h-3 w-3" />
                    Garantia: {warrantyText}
                  </span>
                )}
                {request.notes && (
                  <span className="text-muted-foreground">• Obs: {request.notes}</span>
                )}
              </div>

              {/* Resposta do admin (se houver) */}
              {request.admin_notes && (
                <div className="mt-1 bg-muted/50 p-2 rounded">
                  <p className="text-xs font-medium text-muted-foreground">Resposta:</p>
                  <p className="text-xs mt-0.5">{request.admin_notes}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
