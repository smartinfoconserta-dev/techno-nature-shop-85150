import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { customerRequestsStore, CustomerRequest } from "@/lib/customerRequestsStore";
import { RequestStatusBadge } from "@/components/customer/RequestStatusBadge";
import { Edit, Trash2, Loader2, Filter } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EditCustomerRequestDialog } from "./EditCustomerRequestDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const NotebookRequestsTab = () => {
  const [requests, setRequests] = useState<CustomerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRequest, setEditingRequest] = useState<CustomerRequest | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const loadRequests = async () => {
    try {
      const data = await customerRequestsStore.getAllRequests();
      setRequests(data);
    } catch (error) {
      console.error("Erro ao carregar solicitações:", error);
      toast.error("Erro ao carregar solicitações");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      await customerRequestsStore.deleteRequest(deletingId);
      toast.success("Solicitação deletada");
      setDeletingId(null);
      loadRequests();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao deletar solicitação");
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (filterStatus === "all") return true;
    return req.status === filterStatus;
  });

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Solicitações de Caderneta</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Pré-cadastros enviados pelos parceiros
              </p>
            </div>
            {pendingCount > 0 && (
              <Badge variant="default" className="text-base px-4 py-2">
                {pendingCount} Pendentes
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={filterStatus} onValueChange={setFilterStatus}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">
                Todos ({requests.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pendentes ({pendingCount})
              </TabsTrigger>
              <TabsTrigger value="confirmed">
                Confirmados ({requests.filter((r) => r.status === "confirmed").length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejeitados ({requests.filter((r) => r.status === "rejected").length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={filterStatus} className="space-y-3">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Filter className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma solicitação encontrada</p>
                </div>
              ) : (
                filteredRequests.map((request) => (
                  <Card key={request.id} className="border-l-4 border-l-primary">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{request.product_name}</h3>
                            <RequestStatusBadge status={request.status} />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Cliente: <span className="font-medium">{request.customer_name}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(request.created_at), "dd/MM/yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingRequest(request)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeletingId(request.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-xs text-muted-foreground">Valor de Venda</p>
                          <p className="font-semibold text-primary">
                            R$ {request.sale_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        {request.cost_price && (
                          <div>
                            <p className="text-xs text-muted-foreground">Custo</p>
                            <p className="font-semibold">
                              R$ {request.cost_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        )}
                        {request.brand && (
                          <div>
                            <p className="text-xs text-muted-foreground">Marca</p>
                            <p className="font-medium">{request.brand}</p>
                          </div>
                        )}
                        {request.category && (
                          <div>
                            <p className="text-xs text-muted-foreground">Categoria</p>
                            <p className="font-medium">{request.category}</p>
                          </div>
                        )}
                      </div>

                      {request.notes && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Observações do Cliente:</p>
                          <p className="text-sm">{request.notes}</p>
                        </div>
                      )}

                      {request.admin_notes && (
                        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Notas do Administrador:</p>
                          <p className="text-sm">{request.admin_notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {editingRequest && (
        <EditCustomerRequestDialog
          request={editingRequest}
          open={!!editingRequest}
          onOpenChange={(open) => !open && setEditingRequest(null)}
          onSuccess={loadRequests}
        />
      )}

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta solicitação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NotebookRequestsTab;
