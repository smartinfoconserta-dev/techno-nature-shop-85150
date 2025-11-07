import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { receivablesStore, Receivable } from "@/lib/receivablesStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, ShoppingBag, DollarSign, Clock, Shield } from "lucide-react";
import { calculateWarranty } from "@/lib/warrantyHelper";
import { format } from "date-fns";

const CustomerPortal = () => {
  const navigate = useNavigate();
  const { customer, logout } = useCustomerAuth();
  const [receivables, setReceivables] = useState<Receivable[]>([]);

  useEffect(() => {
    if (!customer) {
      navigate("/customer-login");
      return;
    }

    // Carregar compras do cliente
    const customerReceivables = receivablesStore.getReceivablesByCustomer(customer.id);
    setReceivables(customerReceivables);
  }, [customer, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/customer-login");
  };

  if (!customer) return null;

  const totalComprado = receivables.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalPago = receivables.reduce((sum, r) => sum + r.paidAmount, 0);
  const totalDevedor = receivables.reduce((sum, r) => sum + r.remainingAmount, 0);

  const getStatusBadge = (status: Receivable["status"]) => {
    const variants = {
      pending: { label: "Pendente", variant: "destructive" as const },
      partial: { label: "Parcial", variant: "default" as const },
      paid: { label: "Quitado", variant: "secondary" as const },
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Portal do Cliente</h1>
            <p className="text-sm text-muted-foreground">{customer.name}</p>
          </div>
          <Button variant="outline" onClick={handleLogout} size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="container mx-auto px-4 py-8">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Total Comprado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">R$ {totalComprado.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">R$ {totalPago.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Saldo Devedor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">R$ {totalDevedor.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Compras */}
        <Card>
          <CardHeader>
            <CardTitle>Minhas Compras</CardTitle>
          </CardHeader>
          <CardContent>
            {receivables.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhuma compra registrada</p>
            ) : (
              <div className="space-y-4">
                {receivables.map(receivable => {
                  const warranty = receivable.warranty && receivable.warrantyExpiresAt
                    ? calculateWarranty(receivable.createdAt, receivable.warranty)
                    : null;

                  return (
                    <Card key={receivable.id} className="border">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{receivable.productName}</h3>
                            <p className="text-sm text-muted-foreground">
                              Data: {format(new Date(receivable.createdAt), "dd/MM/yyyy")}
                            </p>
                          </div>
                          {getStatusBadge(receivable.status)}
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Total</p>
                            <p className="font-semibold">R$ {receivable.totalAmount.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Pago</p>
                            <p className="font-semibold text-green-600">R$ {receivable.paidAmount.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Restante</p>
                            <p className="font-semibold text-red-600">R$ {receivable.remainingAmount.toFixed(2)}</p>
                          </div>
                          {receivable.dueDate && (
                            <div>
                              <p className="text-sm text-muted-foreground">Vencimento</p>
                              <p className="font-semibold">{format(new Date(receivable.dueDate), "dd/MM/yyyy")}</p>
                            </div>
                          )}
                        </div>

                        {/* Garantia */}
                        {warranty && (
                          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">Garantia ({warranty.warrantyDays} dias)</p>
                              {warranty.isActive ? (
                                <p className="text-xs text-green-600">
                                  {warranty.daysRemaining} dias restantes
                                </p>
                              ) : warranty.warrantyDays === 0 ? (
                                <p className="text-xs text-muted-foreground">Sem garantia</p>
                              ) : (
                                <p className="text-xs text-red-600">Garantia expirada</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Histórico de Pagamentos */}
                        {receivable.payments.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm font-semibold mb-2">Pagamentos</p>
                            <div className="space-y-2">
                              {receivable.payments.map(payment => (
                                <div key={payment.id} className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    {format(new Date(payment.paymentDate), "dd/MM/yyyy")} - 
                                    {payment.paymentMethod === "cash" ? " Dinheiro" : 
                                     payment.paymentMethod === "pix" ? " PIX" : " Cartão"}
                                  </span>
                                  <span className="font-semibold text-green-600">
                                    R$ {payment.amount.toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CustomerPortal;
