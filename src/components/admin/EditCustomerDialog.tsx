import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { customersStore, Customer } from "@/lib/customersStore";
import { useToast } from "@/hooks/use-toast";

interface EditCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onCustomerUpdated: () => void;
}

const EditCustomerDialog = ({ open, onOpenChange, customer, onCustomerUpdated }: EditCustomerDialogProps) => {
  const { toast } = useToast();
  const [type, setType] = useState<"lojista" | "cliente">("lojista");
  const [name, setName] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [notes, setNotes] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (customer && open) {
      setType(customer.type);
      setName(customer.name);
      setCpfCnpj(customer.cpfCnpj);
      setPhone(customer.phone || "");
      setEmail(customer.email || "");
      setAddress(customer.address || "");
      setCreditLimit(customer.creditLimit ? customer.creditLimit.toString() : "");
      setNotes(customer.notes || "");
      setPassword("");
    }
  }, [customer, open]);

  const handleSubmit = () => {
    try {
      if (!customer) return;

      if (!name.trim()) {
        toast({
          title: "Erro",
          description: "Nome é obrigatório",
          variant: "destructive",
        });
        return;
      }

      if (!cpfCnpj.trim()) {
        toast({
          title: "Erro",
          description: "CPF/CNPJ é obrigatório",
          variant: "destructive",
        });
        return;
      }

      customersStore.updateCustomer(customer.id, {
        type,
        name,
        cpfCnpj,
        phone: phone || undefined,
        email: email || undefined,
        address: address || undefined,
        creditLimit: creditLimit ? parseFloat(creditLimit) : 0,
        notes: notes || undefined,
      });

      // Atualizar senha se fornecida
      if (password.trim()) {
        customersStore.setPassword(customer.id, password.trim());
      }

      toast({
        title: "Sucesso!",
        description: "Dados do cliente atualizados",
      });

      onCustomerUpdated();
      handleClose();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Cliente - {customer.code}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Tipo de Cliente</Label>
            <RadioGroup value={type} onValueChange={(v) => setType(v as "lojista" | "cliente")} className="flex gap-4 mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="lojista" id="lojista" />
                <Label htmlFor="lojista" className="font-normal cursor-pointer">Lojista</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cliente" id="cliente" />
                <Label htmlFor="cliente" className="font-normal cursor-pointer">Cliente</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label>Código</Label>
            <Input value={customer.code} disabled className="bg-muted" />
          </div>

          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo ou razão social"
            />
          </div>

          <div>
            <Label htmlFor="cpfCnpj">CPF/CNPJ *</Label>
            <Input
              id="cpfCnpj"
              value={cpfCnpj}
              onChange={(e) => setCpfCnpj(e.target.value)}
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, número, bairro, cidade"
            />
          </div>

          <div>
            <Label htmlFor="creditLimit">Limite de Crédito (R$)</Label>
            <Input
              id="creditLimit"
              type="number"
              min="0"
              step="0.01"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informações adicionais sobre o cliente"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="password">Senha do Portal (opcional)</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite uma senha para acesso ao portal"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Se preenchido, o cliente poderá acessar o portal com CPF/CNPJ e senha
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditCustomerDialog;
