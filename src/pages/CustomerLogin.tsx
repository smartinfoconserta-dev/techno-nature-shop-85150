import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { customersStore } from "@/lib/customersStore";
import { useToast } from "@/hooks/use-toast";

const CustomerLogin = () => {
  const navigate = useNavigate();
  const { login } = useCustomerAuth();
  const { toast } = useToast();
  
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const customer = customersStore.authenticateCustomerByIdentifier(identifier, password);
      
      if (customer) {
        login(customer);
        navigate("/portal");
      } else {
        toast({
          title: "Erro no login",
          description: "CPF/CNPJ/Código ou senha incorretos",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao fazer login",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Área de Parceiros</CardTitle>
          <CardDescription>Acesse suas compras e acompanhe seus pagamentos</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label>CPF/CNPJ ou Código</Label>
              <Input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="000.000.000-00 ou CLI001"
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
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerLogin;
