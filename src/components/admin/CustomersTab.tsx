import { useState, useEffect } from "react";
import { customersStore, Customer } from "@/lib/customersStore";
import { receivablesStore } from "@/lib/receivablesStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Edit, Trash2, Search, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import NewCustomerDialog from "./NewCustomerDialog";
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

const CustomersTab = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [customers, typeFilter, statusFilter, searchQuery]);

  const loadCustomers = () => {
    const data = customersStore.getAllCustomers();
    setCustomers(data.sort((a, b) => a.code.localeCompare(b.code)));
  };

  const applyFilters = () => {
    let filtered = [...customers];

    if (typeFilter !== "all") {
      filtered = filtered.filter(c => c.type === typeFilter);
    }

    if (statusFilter === "active") {
      filtered = filtered.filter(c => c.active);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter(c => !c.active);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.code.toLowerCase().includes(query) ||
        c.cpfCnpj.includes(query)
      );
    }

    setFilteredCustomers(filtered);
  };

  const getCustomerDebts = (customerId: string) => {
    const receivables = receivablesStore.getReceivablesByCustomer(customerId);
    const openAccounts = receivables.filter(r => r.status !== "paid");
    const totalDebt = openAccounts.reduce((sum, r) => sum + r.remainingAmount, 0);
    
    return { openAccounts: openAccounts.length, totalDebt };
  };

  const handleCustomerCreated = (customer: Customer) => {
    loadCustomers();
  };

  const handleDeleteCustomer = () => {
    if (!customerToDelete) return;

    try {
      // Verificar se tem contas em aberto
      const { openAccounts } = getCustomerDebts(customerToDelete);
      if (openAccounts > 0) {
        toast({
          title: "Não é possível excluir",
          description: "Este cliente possui contas em aberto",
          variant: "destructive",
        });
        setCustomerToDelete(null);
        return;
      }

      customersStore.deleteCustomer(customerToDelete);
      toast({
        title: "Cliente removido",
        description: "Cliente removido com sucesso",
      });
      loadCustomers();
    } catch (error: any) {
      toast({
        title: "Erro ao remover",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCustomerToDelete(null);
    }
  };

  const getStats = () => {
    const active = customers.filter(c => c.active).length;
    const lojistas = customers.filter(c => c.type === "lojista").length;
    const clientes = customers.filter(c => c.type === "cliente").length;
    
    return { active, lojistas, clientes };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">👥 Clientes e Lojistas</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie o cadastro de clientes e lojistas
          </p>
        </div>
        <Button onClick={() => setShowNewCustomerDialog(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clientes Ativos</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lojistas</p>
                <p className="text-2xl font-bold text-blue-600">{stats.lojistas}</p>
              </div>
              <span className="text-4xl">🏪</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clientes</p>
                <p className="text-2xl font-bold text-green-600">{stats.clientes}</p>
              </div>
              <span className="text-4xl">👤</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, código ou CPF/CNPJ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="w-[150px]">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="lojista">Lojistas</SelectItem>
                  <SelectItem value="cliente">Clientes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-[150px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Lista de Clientes ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhum cliente encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCustomers.map((customer) => {
                const { openAccounts, totalDebt } = getCustomerDebts(customer.id);
                
                return (
                  <div
                    key={customer.id}
                    className="p-4 rounded-lg border-2 border-border bg-muted/30"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={customer.type === "lojista" ? "default" : "secondary"}>
                            {customer.type === "lojista" ? "🏪 Lojista" : "👤 Cliente"}
                          </Badge>
                          {!customer.active && (
                            <Badge variant="outline">Inativo</Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg">
                          {customer.code} - {customer.name}
                        </h3>
                        <p className="text-sm text-muted-foreground font-mono">
                          CPF/CNPJ: {customer.cpfCnpj}
                        </p>
                        {customer.phone && (
                          <p className="text-sm text-muted-foreground">
                            📱 {customer.phone}
                          </p>
                        )}
                        {customer.email && (
                          <p className="text-sm text-muted-foreground">
                            📧 {customer.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                      {customer.creditLimit !== undefined && customer.creditLimit > 0 && (
                        <div>
                          <span className="text-muted-foreground">Limite de Crédito:</span>
                          <p className="font-semibold text-green-600">
                            R$ {customer.creditLimit.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>

                    {customer.notes && (
                      <p className="text-sm text-muted-foreground italic mb-3 p-2 bg-muted/50 rounded">
                        {customer.notes}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          // Aqui será implementada a navegação para caderneta com o cliente selecionado
                          // Por enquanto, podemos mostrar um toast
                          toast({
                            title: "Ver Caderneta",
                            description: "Navegue até a aba 'Caderneta' para ver as compras deste cliente",
                          });
                        }}
                      >
                        📒 Ver Caderneta
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setCustomerToDelete(customer.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <NewCustomerDialog
        open={showNewCustomerDialog}
        onOpenChange={setShowNewCustomerDialog}
        onCustomerCreated={handleCustomerCreated}
      />

      <AlertDialog open={!!customerToDelete} onOpenChange={(open) => !open && setCustomerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCustomer}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CustomersTab;
