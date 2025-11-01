import { useState, useEffect } from "react";
import { productsStore, Product } from "@/lib/productsStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ImageOff, Package } from "lucide-react";

export function AlertsSection() {
  const [alerts, setAlerts] = useState<{
    noImage: Product[];
    lowStock: boolean;
  }>({
    noImage: [],
    lowStock: false,
  });

  useEffect(() => {
    checkAlerts();
  }, []);

  const checkAlerts = () => {
    const products = productsStore.getAvailableProducts();

    // Produtos sem imagem
    const withoutImage = products.filter((p) => !p.images || p.images.length === 0);

    // Estoque baixo (menos de 3 produtos)
    const isLowStock = products.length < 3;

    setAlerts({
      noImage: withoutImage,
      lowStock: isLowStock,
    });
  };

  const totalAlerts =
    alerts.noImage.length + (alerts.lowStock ? 1 : 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Alertas e Lembretes
          </CardTitle>
          {totalAlerts > 0 && (
            <Badge variant="destructive">{totalAlerts}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {totalAlerts === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>✅ Tudo certo! Nenhum alerta no momento.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Produtos sem imagem */}
            {alerts.noImage.length > 0 && (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <ImageOff className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Produtos sem imagem
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      {alerts.noImage.length} {alerts.noImage.length === 1 ? "produto precisa" : "produtos precisam"} de fotos
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Estoque baixo */}
            {alerts.lowStock && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                <div className="flex items-start gap-2">
                  <Package className="h-4 w-4 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900 dark:text-red-100">
                      Estoque baixo
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                      Menos de 3 produtos disponíveis
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
