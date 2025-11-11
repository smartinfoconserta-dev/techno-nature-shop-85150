import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Database, AlertCircle, CheckCircle2 } from "lucide-react";
import { productsStore } from "@/lib/productsStore";
import { toast } from "sonner";

const ImportFromBrowserDialog = () => {
  const [open, setOpen] = useState(false);
  const [hasOldData, setHasOldData] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dataCount, setDataCount] = useState({ products: 0, quickSales: 0, receivables: 0 });

  useEffect(() => {
    checkForOldData();
  }, []);

  const checkForOldData = () => {
    try {
      const productsData = localStorage.getItem("products_data");
      const quickSalesData = localStorage.getItem("quick_sales_data");
      const receivablesData = localStorage.getItem("receivables_data");

      const productsCount = productsData ? JSON.parse(productsData).length : 0;
      const quickSalesCount = quickSalesData ? JSON.parse(quickSalesData).length : 0;
      const receivablesCount = receivablesData ? JSON.parse(receivablesData).length : 0;

      const hasData = productsCount > 0 || quickSalesCount > 0 || receivablesCount > 0;
      
      setHasOldData(hasData);
      setDataCount({
        products: productsCount,
        quickSales: quickSalesCount,
        receivables: receivablesCount,
      });
    } catch (error) {
      console.error("Erro ao verificar dados antigos:", error);
      setHasOldData(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    let importedCount = 0;

    try {
      // Importar produtos
      const productsData = localStorage.getItem("products_data");
      if (productsData) {
        const products = JSON.parse(productsData);
        for (const product of products) {
          try {
            await productsStore.addProduct({
              name: product.name || "Produto Importado",
              brand: product.brand || "Sem Marca",
              category: product.category || "Notebooks",
              price: product.price || 0,
              images: product.images || ["/placeholder.svg"],
              specs: product.specs || "",
              description: product.description || "",
            });
            importedCount++;
          } catch (error) {
            console.error("Erro ao importar produto:", error);
          }
        }
      }

      // Limpar localStorage antigo
      localStorage.removeItem("products_data");
      localStorage.removeItem("quick_sales_data");
      localStorage.removeItem("receivables_data");
      localStorage.removeItem("monthly_reports_data");
      localStorage.removeItem("last_month_check");
      localStorage.removeItem("app_settings");

      toast.success(`${importedCount} produto(s) importado(s) com sucesso!`);
      setOpen(false);
      setHasOldData(false);
    } catch (error) {
      console.error("Erro durante importação:", error);
      toast.error("Erro ao importar dados do navegador");
    } finally {
      setImporting(false);
    }
  };

  if (!hasOldData) return null;

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="flex items-center gap-2"
      >
        <Database className="h-4 w-4" />
        Importar do Navegador
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Importar Dados do Navegador
            </DialogTitle>
            <DialogDescription>
              Detectamos dados antigos armazenados no seu navegador que podem ser importados para o backend.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Dados encontrados:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  {dataCount.products > 0 && (
                    <li>• {dataCount.products} produto(s)</li>
                  )}
                  {dataCount.quickSales > 0 && (
                    <li>• {dataCount.quickSales} venda(s) rápida(s)</li>
                  )}
                  {dataCount.receivables > 0 && (
                    <li>• {dataCount.receivables} recebível(is)</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>

            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                Após a importação, os dados locais serão removidos e todos os dados ficarão no backend (nuvem).
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={importing}
            >
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={importing}>
              {importing ? "Importando..." : "Importar Agora"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImportFromBrowserDialog;
