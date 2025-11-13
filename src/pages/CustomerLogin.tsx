import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

// Schema de validação
const loginSchema = z.object({
  identifier: z.string().trim().min(3, "Usuário deve ter pelo menos 3 caracteres").max(50),
  password: z.string().min(4, "Senha deve ter pelo menos 4 caracteres").max(100),
});

const CustomerLogin = () => {
  const navigate = useNavigate();
  const { login } = useCustomerAuth();
  const { toast } = useToast();
  
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação com zod
    const validation = loginSchema.safeParse({ identifier, password });
    if (!validation.success) {
      toast({
        title: "Dados inválidos",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }
    
    // Verificar se localStorage está disponível
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
    } catch (e) {
      toast({
        title: "Erro de armazenamento",
        description: "Seu navegador está bloqueando o armazenamento. Desative o modo anônimo ou limpe o cache.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      // Chamar função de backend portal-login
      const { data, error } = await supabase.functions.invoke('portal-login', {
        body: { 
          identifier: identifier.trim(), 
          password 
        },
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'LOGIN_FAILED');
      }

      // Salvar sessão e token
      const customerData = data.customer;
      localStorage.setItem("customer_session", JSON.stringify(customerData));
      localStorage.setItem("customer_token", data.token);

      // Atualizar estado de autenticação
      login(customerData);
      
      toast({
        title: "Login realizado!",
        description: `Bem-vindo(a), ${customerData.name}!`,
      });

      navigate("/portal");

    } catch (error: any) {
      const errorCode = error?.message || error?.error || 'UNKNOWN_ERROR';
      
      // Mapear erros para mensagens amigáveis
      const errorMessages: Record<string, { title: string; description: string }> = {
        USER_NOT_FOUND: {
          title: "Usuário não encontrado",
          description: "Código, CPF/CNPJ ou nickname não cadastrado no sistema.",
        },
        INVALID_PASSWORD: {
          title: "Senha incorreta",
          description: "A senha digitada está incorreta. Tente novamente ou recupere sua senha.",
        },
        PORTAL_BLOCKED: {
          title: "🔒 Acesso bloqueado",
          description: "Seu acesso ao portal foi temporariamente bloqueado. Entre em contato com o administrador.",
        },
        ACCOUNT_INACTIVE: {
          title: "Conta inativa",
          description: "Sua conta está inativa. Entre em contato com o administrador.",
        },
        NO_PASSWORD: {
          title: "Senha não configurada",
          description: "Senha não configurada. Entre em contato com o administrador para configurar seu acesso.",
        },
        MISSING_CREDENTIALS: {
          title: "Dados incompletos",
          description: "Preencha usuário e senha para continuar.",
        },
        TOKEN_EXPIRED: {
          title: "Sessão expirada",
          description: "Sua sessão expirou. Faça login novamente.",
        },
      };

      const errorInfo = errorMessages[errorCode] || {
        title: "Erro ao fazer login",
        description: "Ocorreu um erro. Verifique sua conexão e tente novamente.",
      };

      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
        duration: 6000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Imagem de fundo tecnológica */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/tech-background.jpg')",
          filter: "brightness(0.4) blur(1px)",
        }}
      />
      
      {/* Overlay gradiente para contraste */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-secondary/40" />
      
      <Card className="w-full max-w-md relative z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="absolute top-4 left-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Catálogo
        </Button>
        <CardHeader className="text-center pt-16">
          <CardTitle className="text-2xl">Área de Parceiros</CardTitle>
          <CardDescription>Entre com seu usuário ou código para acessar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label>Usuário ou Código</Label>
              <Input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Digite seu usuário ou código"
                required
              />
              <p className="text-xs text-muted-foreground">
                Use seu código (LOJ###), CPF/CNPJ ou nickname
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Verificando credenciais..." : "Entrar"}
            </Button>

            {loading && (
              <Button 
                variant="outline" 
                className="w-full mt-2"
                onClick={() => {
                  setLoading(false);
                  setIdentifier("");
                  setPassword("");
                }}
              >
                Cancelar e tentar novamente
              </Button>
            )}

            <div className="text-center mt-4">
              <Button
                variant="link"
                className="text-sm"
                onClick={() => navigate("/forgot-password")}
              >
                Esqueceu sua senha?
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerLogin;
