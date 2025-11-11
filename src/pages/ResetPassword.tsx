import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { customersStore } from "@/lib/customersStore";
import { passwordResetStore } from "@/lib/passwordResetStore";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    const customerIdParam = searchParams.get("customer");
    if (!customerIdParam) {
      toast({
        title: "Erro",
        description: "Sessão inválida",
        variant: "destructive",
      });
      navigate("/forgot-password");
      return;
    }
    setCustomerId(customerIdParam);
  }, [searchParams, navigate, toast]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerId) return;
    
    setLoading(true);

    try {
      // Validações
      if (code.length !== 6) {
        toast({
          title: "Código inválido",
          description: "O código deve ter 6 dígitos",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (newPassword.length < 4) {
        toast({
          title: "Senha muito curta",
          description: "A senha deve ter no mínimo 4 caracteres",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        toast({
          title: "Senhas não coincidem",
          description: "A nova senha e a confirmação devem ser iguais",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Validar código
      const isValid = passwordResetStore.validateCode(customerId, code);
      
      if (!isValid) {
        toast({
          title: "Código inválido ou expirado",
          description: "O código informado é inválido ou já expirou. Solicite um novo código.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Buscar cliente
      const customer = await customersStore.getCustomerById(customerId);
      
      if (!customer || !customer.username) {
        toast({
          title: "Erro",
          description: "Cliente não encontrado ou sem username configurado",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Atualizar senha
      customersStore.setPassword(customer.id, customer.username, newPassword);
      
      // Remover código usado
      passwordResetStore.removeCode(customerId);
      
      toast({
        title: "Senha redefinida!",
        description: "Sua senha foi alterada com sucesso. Você já pode fazer login.",
      });

      // Redirecionar para login
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      
    } catch (error: any) {
      toast({
        title: "Erro ao redefinir senha",
        description: error.message || "Ocorreu um erro ao processar sua solicitação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!customerId) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 p-4">
      <Card className="w-full max-w-md relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/forgot-password")}
          className="absolute top-4 left-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <CardHeader className="text-center pt-16">
          <CardTitle className="text-2xl">Redefinir Senha</CardTitle>
          <CardDescription>
            Digite o código recebido via WhatsApp e sua nova senha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label>Código de Verificação (6 dígitos)</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                required
                className="text-center text-2xl tracking-widest font-bold"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite sua nova senha"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite novamente a nova senha"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Redefinindo..." : "Redefinir Senha"}
            </Button>

            <div className="text-sm text-muted-foreground text-center mt-4">
              <p>💡 O código é válido por 15 minutos</p>
              <p className="mt-1">Não recebeu o código? 
                <Button 
                  variant="link" 
                  className="p-0 h-auto ml-1"
                  onClick={() => navigate("/forgot-password")}
                >
                  Solicitar novo código
                </Button>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
