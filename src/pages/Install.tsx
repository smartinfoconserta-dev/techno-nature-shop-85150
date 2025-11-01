import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Wifi, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">📱 Instale nosso App!</CardTitle>
          <CardDescription className="text-lg">
            Tenha acesso rápido à loja direto da tela do seu celular
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Smartphone className="h-6 w-6 text-primary mt-1" />
              <div>
                <h3 className="font-semibold">Acesso Rápido</h3>
                <p className="text-sm text-muted-foreground">
                  Ícone na tela inicial como um app real
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Wifi className="h-6 w-6 text-primary mt-1" />
              <div>
                <h3 className="font-semibold">Funciona Offline</h3>
                <p className="text-sm text-muted-foreground">
                  Navegue mesmo sem internet
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Zap className="h-6 w-6 text-primary mt-1" />
              <div>
                <h3 className="font-semibold">Mais Rápido</h3>
                <p className="text-sm text-muted-foreground">
                  Carregamento instantâneo
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Download className="h-6 w-6 text-primary mt-1" />
              <div>
                <h3 className="font-semibold">Sem App Store</h3>
                <p className="text-sm text-muted-foreground">
                  Instale direto pelo navegador
                </p>
              </div>
            </div>
          </div>

          {isInstallable ? (
            <Button 
              onClick={handleInstallClick} 
              className="w-full" 
              size="lg"
            >
              <Download className="mr-2 h-5 w-5" />
              Instalar App Agora
            </Button>
          ) : (
            <div className="bg-muted p-4 rounded-lg text-center space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Para instalar no iPhone:
                </p>
                <p className="text-xs">
                  Toque em <strong>Compartilhar</strong> → <strong>Adicionar à Tela de Início</strong>
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Para instalar no Android:
                </p>
                <p className="text-xs">
                  Toque no <strong>menu (⋮)</strong> → <strong>Instalar app</strong>
                </p>
              </div>
            </div>
          )}

          <Button 
            variant="outline" 
            onClick={() => navigate('/')} 
            className="w-full"
          >
            Voltar para a Loja
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
