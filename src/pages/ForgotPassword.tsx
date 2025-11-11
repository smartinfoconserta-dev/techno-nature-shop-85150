import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { customersStore } from "@/lib/customersStore";
import { passwordResetStore } from "@/lib/passwordResetStore";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);

  // Limpar códigos expirados ao carregar
  useEffect(() => {
    passwordResetStore.cleanExpiredCodes();
  }, []);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Buscar cliente pelo identificador
      const customer = await customersStore.getCustomerByIdentifier(identifier);
      
      if (!customer) {
        toast({
          title: "Cliente não encontrado",
          description: "Nenhum cliente encontrado com esse usuário, código ou CPF/CNPJ",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!customer.hasPortalAccess) {
        toast({
          title: "Acesso bloqueado",
          description: "Este cliente não tem acesso ao portal",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!customer.phone) {
        toast({
          title: "Telefone não cadastrado",
          description: "Este cliente não possui telefone cadastrado. Entre em contato com o suporte.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Gerar código de recuperação
      const resetCode = passwordResetStore.createResetCode(customer.id);
      
      // Criar mensagem para WhatsApp
      const message = `🔐 *Código de Recuperação de Senha*\n\nOlá, ${customer.name}!\n\nSeu código de recuperação é: *${resetCode.code}*\n\nEste código é válido por 15 minutos.\n\nSe você não solicitou esta recuperação, ignore esta mensagem.`;
      
      // Abrir WhatsApp com a mensagem
      const phone = customer.phone.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
      
      window.open(whatsappUrl, '_blank');
      
      toast({
        title: "Código gerado!",
        description: "Uma janela do WhatsApp foi aberta com seu código de recuperação.",
      });

      // Aguardar um pouco antes de redirecionar
      setTimeout(() => {
        navigate(`/reset-password?customer=${customer.id}`);
      }, 2000);
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar sua solicitação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 p-4">
      <Card className="w-full max-w-md relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/login")}
          className="absolute top-4 left-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <CardHeader className="text-center pt-16">
          <CardTitle className="text-2xl">Recuperar Senha</CardTitle>
          <CardDescription>
            Digite seu usuário, código ou CPF/CNPJ para receber o código de recuperação via WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div className="space-y-2">
              <Label>Usuário, CPF/CNPJ ou Código</Label>
              <Input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="batista, 000.000.000-00 ou CLI001"
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Processando..." : "Enviar Código via WhatsApp"}
            </Button>

            <div className="text-sm text-muted-foreground text-center mt-4">
              <p>💡 O código será enviado para o WhatsApp cadastrado</p>
              <p className="mt-1">Válido por 15 minutos</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
