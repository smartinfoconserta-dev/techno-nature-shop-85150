import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { customersStore, Customer } from "@/lib/customersStore";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, RefreshCw } from "lucide-react";

interface CustomerPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onSuccess?: () => void;
}

const CustomerPasswordDialog = ({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: CustomerPasswordDialogProps) => {
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const generateRandomPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
    setConfirmPassword(password);
    setShowPassword(true);
    
    toast({
      title: "Senha gerada!",
      description: `Senha: ${password}`,
    });
  };

  const handleSubmit = async () => {
    if (!customer) return;

    // Validações
    if (!newPassword.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma nova senha",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 4) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 4 caracteres",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    // Se o cliente não tem username, precisa definir um
    if (!customer.username) {
      toast({
        title: "Username não configurado",
        description: "Este cliente precisa ter um username configurado primeiro. Use o botão 🔑 para configurar.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Usar o username existente e atualizar apenas a senha
      await customersStore.setPassword(customer.id, customer.username, newPassword);
      
      toast({
        title: "✅ Senha redefinida!",
        description: (
          <div className="space-y-1">
            <p><strong>Cliente:</strong> {customer.name}</p>
            <p><strong>Username:</strong> {customer.username}</p>
            <p><strong>Nova senha:</strong> {newPassword}</p>
          </div>
        ),
        duration: 8000,
      });

      // Resetar formulário
      setNewPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      
      // Fechar dialog
      onOpenChange(false);
      
      // Callback de sucesso
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Erro ao redefinir senha",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>🔒 Redefinir Senha do Portal</DialogTitle>
          <DialogDescription>
            {customer && (
              <div className="space-y-1 mt-2">
                <div><strong>Cliente:</strong> {customer.name}</div>
                <div><strong>Código:</strong> {customer.code}</div>
                {customer.username && (
                  <div><strong>Username:</strong> {customer.username}</div>
                )}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Botão gerar senha aleatória */}
          <Button
            type="button"
            variant="outline"
            onClick={generateRandomPassword}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Gerar senha aleatória
          </Button>

          {/* Nova senha */}
          <div>
            <Label htmlFor="newPassword">Nova Senha</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Digite a nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Mínimo 4 caracteres
            </p>
          </div>

          {/* Confirmar senha */}
          <div>
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Digite novamente"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="bg-muted p-3 rounded-lg text-sm">
            <p className="text-muted-foreground">
              💡 <strong>Como o cliente faz login:</strong>
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>Código (ex: {customer?.code})</li>
              <li>CPF/CNPJ {customer?.cpfCnpj && `(${customer.cpfCnpj})`}</li>
              {customer?.username && <li>Username ({customer.username})</li>}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Salvando..." : "Redefinir Senha"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerPasswordDialog;
