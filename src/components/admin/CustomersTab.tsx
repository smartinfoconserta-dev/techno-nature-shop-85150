import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { customersStore, Customer } from "@/lib/customersStore";
import { receivablesStore } from "@/lib/receivablesStore";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Copy, Eye, EyeOff, Key, ShoppingBag } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CustomerReceivablesDialog from "./CustomerReceivablesDialog";

const CustomersTab = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "lojista" | "cliente">("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showReceivablesDialog, setShowReceivablesDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const loadCustomers = async () => {
      const allCustomers = await customersStore.getAllCustomers();
      setCustomers(allCustomers);
    };
    loadCustomers();
  }, [refreshKey]);

  useEffect(() => {
    const filtered = customers.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           c.cpfCnpj.includes(searchTerm);
      const matchesType = filterType === "all" || c.type === filterType;
      return matchesSearch && matchesType;
    });
    setFilteredCustomers(filtered);
  }, [customers, searchTerm, filterType]);

  const getCustomerDebt = (customerId: string) => {
    const receivables = receivablesStore.getReceivablesByCustomer(customerId);
    return receivables
      .filter(r => r.status !== "paid")
      .reduce((sum, r) => sum + r.remainingAmount, 0);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Código copiado!",
      description: `Código ${code} copiado para a área de transferência`,
    });
  };

  const handleSetPassword = () => {
    if (!selectedCustomer) {
      toast({
        title: "Erro",
        description: "Cliente não selecionado",
        variant: "destructive",
      });
      return;
    }

    if (!newUsername.trim()) {
      toast({
        title: "Erro",
        description: "Preencha o usuário",
        variant: "destructive",
      });
      return;
    }

    if (!newPassword.trim()) {
      toast({
        title: "Erro",
        description: "Preencha a senha",
        variant: "destructive",
      });
      return;
    }

    try {
      customersStore.setPassword(selectedCustomer.id, newUsername, newPassword);
      toast({
        title: "Acesso configurado!",
        description: `Username: ${newUsername.toLowerCase()} | Acesso ao portal habilitado para ${selectedCustomer.name}`,
      });
      setShowPasswordDialog(false);
      setSelectedCustomer(null);
      setNewUsername("");
      setNewPassword("");
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleTogglePortalAccess = (customer: Customer) => {
    try {
      customersStore.updateCustomer(customer.id, {
        hasPortalAccess: !customer.hasPortalAccess,
      });
      
      toast({
        title: customer.hasPortalAccess ? "Acesso bloqueado" : "Acesso liberado",
        description: `Portal ${customer.hasPortalAccess ? "bloqueado" : "liberado"} para ${customer.name}`,
      });
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4" key={refreshKey}>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">👥 Gerenciar Clientes</h2>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex gap-4 flex-col md:flex-row">
          <Input
            placeholder="Buscar por nome, código ou CPF/CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:max-w-sm"
          />
          <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
            <SelectTrigger className="md:w-[180px]">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="lojista">Lojistas</SelectItem>
              <SelectItem value="cliente">Clientes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tabela */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Em Aberto</TableHead>
              <TableHead>Crédito</TableHead>
              <TableHead>Portal</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Nenhum cliente encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => {
                const debt = getCustomerDebt(customer.id);
                return (
                  <TableRow key={customer.id}>
                    <TableCell className="font-mono font-semibold">
                      {customer.code}
                    </TableCell>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>
                      <Badge variant={customer.type === "lojista" ? "default" : "secondary"}>
                        {customer.type === "lojista" ? "Lojista" : "Cliente"}
                      </Badge>
                    </TableCell>
                    <TableCell>{customer.phone || "-"}</TableCell>
                    <TableCell>
                      <span className={debt > 0 ? "text-red-600 font-semibold" : "text-muted-foreground"}>
                        R$ {debt.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {customer.creditBalance && customer.creditBalance > 0 ? (
                        <span className="text-green-600 font-semibold">
                          💰 R$ {customer.creditBalance.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">R$ 0.00</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {customer.hasPortalAccess ? (
                        <Badge variant="default" className="gap-1">
                          <Eye className="h-3 w-3" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <EyeOff className="h-3 w-3" />
                          Bloqueado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyCode(customer.code)}
                          title="Copiar código"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setNewUsername(customer.username || "");
                            setNewPassword("");
                            setShowPasswordDialog(true);
                          }}
                          title="Definir/Alterar senha"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={customer.hasPortalAccess ? "destructive" : "default"}
                          onClick={() => handleTogglePortalAccess(customer)}
                          title={customer.hasPortalAccess ? "Bloquear portal" : "Liberar portal"}
                        >
                          {customer.hasPortalAccess ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setShowReceivablesDialog(true);
                          }}
                          title="Ver compras"
                        >
                          <ShoppingBag className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Dialog: Definir Senha */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🔑 Definir Username e Senha do Portal</DialogTitle>
            <DialogDescription>
              {selectedCustomer && `Cliente: ${selectedCustomer.code} - ${selectedCustomer.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Usuário (Username)</Label>
              <Input
                type="text"
                placeholder="Ex: batista, loja123"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Mínimo 3 caracteres. Apenas letras, números, pontos e underscores.
              </p>
            </div>
            <div>
              <Label>Senha</Label>
              <Input
                type="text"
                placeholder="Digite a senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              💡 O cliente fará login usando o username e senha definidos aqui.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSetPassword}>
              Salvar Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Ver Compras do Cliente */}
      {selectedCustomer && (
        <CustomerReceivablesDialog
          open={showReceivablesDialog}
          onOpenChange={setShowReceivablesDialog}
          customerId={selectedCustomer.id}
        />
      )}
    </div>
  );
};

export default CustomersTab;
