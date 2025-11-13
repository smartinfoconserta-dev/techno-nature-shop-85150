import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { customerRequestsStore, CustomerRequest } from "@/lib/customerRequestsStore";
import { RequestStatusBadge } from "./RequestStatusBadge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Package } from "lucide-react";

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
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Nenhuma solicitação ainda</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <Card key={request.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-base">{request.product_name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {format(new Date(request.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
              <RequestStatusBadge status={request.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Valor:</span>
              <span className="font-semibold text-primary">
                R$ {request.sale_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>

            {request.notes && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">Observações:</p>
                <p className="text-sm mt-1">{request.notes}</p>
              </div>
            )}

            {request.admin_notes && (
              <div className="pt-2 border-t bg-muted/50 p-2 rounded">
                <p className="text-sm text-muted-foreground font-medium">Resposta do Administrador:</p>
                <p className="text-sm mt-1">{request.admin_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
