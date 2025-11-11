import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { customersStore } from "@/lib/customersStore";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";

const CustomerLogin = () => {
  const navigate = useNavigate();
  const { login } = useCustomerAuth();
  const { toast } = useToast();
  
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

    // Timeout de segurança: 5 segundos
    const timeoutId = setTimeout(() => {
      setLoading(false);
      toast({
        title: "Tempo esgotado",
        description: "O login demorou muito. Tente novamente.",
        variant: "destructive",
      });
    }, 5000);

    try {
      console.log("[LOGIN] Iniciando autenticação...");
      const customer = await customersStore.authenticateCustomerByIdentifier(identifier, password);
      console.log("[LOGIN] Resultado da autenticação:", customer ? "Sucesso" : "Falhou");
      
      clearTimeout(timeoutId);
      
      if (customer) {
        console.log("[LOGIN] Salvando sessão...");
        login(customer);
        console.log("[LOGIN] Navegando para portal...");
        navigate("/portal");
      } else {
        toast({
          title: "Erro no login",
          description: "Usuário, CPF/CNPJ, Código ou senha incorretos",
          variant: "destructive",
        });
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("Erro detalhado no login:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao fazer login. Verifique sua conexão.",
        variant: "destructive",
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
