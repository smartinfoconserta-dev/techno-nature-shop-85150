import { useState, useEffect } from "react";
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
import { z } from "zod";

// Schema de validação para nickname
const nicknameSchema = z.string()
  .trim()
  .min(3, "Nickname deve ter pelo menos 3 caracteres")
  .max(30, "Nickname deve ter no máximo 30 caracteres")
  .regex(/^[a-zA-Z0-9._]+$/, "Use apenas letras, números, ponto e underline");

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
  const [nickname, setNickname] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Carregar nickname existente quando abrir o dialog
  useEffect(() => {
    if (customer && open) {
      setNickname(customer.username || "");
    }
  }, [customer, open]);

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

    // Validar nickname
    const nicknameValidation = nicknameSchema.safeParse(nickname);
    if (!nicknameValidation.success) {
      toast({
        title: "Nickname inválido",
        description: nicknameValidation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    // Validações de senha (se fornecida)
    if (newPassword.trim()) {
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
    }

    // Se não tem senha configurada, exigir nova senha
    if (!customer.password && !newPassword.trim()) {
      toast({
        title: "Senha obrigatória",
        description: "Configure uma senha para o primeiro acesso do cliente",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const normalizedNickname = nickname.toLowerCase();

      // Verificar se nickname está disponível (exceto para o próprio cliente)
      const isAvailable = await customersStore.isUsernameAvailable(normalizedNickname, customer.id);
      if (!isAvailable) {
        toast({
          title: "Nickname já em uso",
          description: "Escolha outro nickname para este cliente",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Atualizar nickname e senha (se fornecida)
      if (newPassword.trim()) {
        await customersStore.setPassword(customer.id, normalizedNickname, newPassword);
      } else {
        // Apenas atualizar o nickname sem mudar a senha
        await customersStore.updateCustomer(customer.id, {
          username: normalizedNickname,
        });
      }
      
      toast({
        title: "✅ Configurações atualizadas!",
        description: (
          <div className="space-y-1">
            <p><strong>Cliente:</strong> {customer.name}</p>
            <p><strong>Nickname:</strong> {normalizedNickname}</p>
            {newPassword && <p><strong>Nova senha:</strong> {newPassword}</p>}
          </div>
        ),
        duration: 8000,
      });

      // Resetar formulário
      setNickname("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      
      // Fechar dialog
      onOpenChange(false);
      
      // Callback de sucesso
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar configurações",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setNickname("");
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
