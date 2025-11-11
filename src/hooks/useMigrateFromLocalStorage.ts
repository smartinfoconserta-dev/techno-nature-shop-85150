import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const MIGRATION_KEY = "data_migrated_to_supabase_v1";

export const useMigrateFromLocalStorage = () => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkAndMigrate = async () => {
      // Verificar se já migrou
      const alreadyMigrated = localStorage.getItem(MIGRATION_KEY);
      if (alreadyMigrated === "true") {
        setMigrationComplete(true);
        return;
      }

      // Verificar se há dados no localStorage para migrar
      const productsData = localStorage.getItem("products_data");
      const quickSalesData = localStorage.getItem("quick_sales_data");
      const receivablesData = localStorage.getItem("receivables_data");

      if (!productsData && !quickSalesData && !receivablesData) {
        // Não há dados para migrar
        localStorage.setItem(MIGRATION_KEY, "true");
        setMigrationComplete(true);
        return;
      }

      setIsMigrating(true);

      try {
        let migrationSuccess = true;

        // Migrar Products
        if (productsData) {
          const products = JSON.parse(productsData);
          console.log(`Migrando ${products.length} produtos...`);
          
          for (const product of products) {
            const { error } = await supabase.from("products").upsert({
              id: product.id,
              name: product.name,
              brand: product.brand,
              category: product.category,
              images: product.images || [],
              specifications: product.specs || "",
              description: product.description || "",
              base_price: product.price || product.costPrice || 0,
              product_order: product.order || 0,
              sold: product.sold || false,
              sale_price: product.salePrice || null,
              payment_breakdown: product.paymentBreakdown || null,
              digital_tax: product.taxAmount || 0,
              sold_date: product.saleDate || null,
              customer_name: product.buyerName || null,
              warranty_months: product.warranty || 3,
              expenses: product.expenses || [],
              created_at: product.createdAt || new Date().toISOString(),
            });

            if (error) {
              console.error("Erro ao migrar produto:", error);
              migrationSuccess = false;
            }
          }
        }

        // Migrar Quick Sales
        if (quickSalesData) {
          const quickSales = JSON.parse(quickSalesData);
          console.log(`Migrando ${quickSales.length} vendas rápidas...`);
          
          for (const sale of quickSales) {
            const profit = sale.profit || (sale.salePrice - sale.costPrice - (sale.taxAmount || 0));
            const margin = sale.salePrice > 0 ? (profit / sale.salePrice) * 100 : 0;

            const { error } = await supabase.from("quick_sales").upsert({
              id: sale.id,
              product_name: sale.productName,
              cost_price: sale.costPrice,
              sale_price: sale.salePrice,
              profit,
              margin,
              customer_name: sale.customerName || "",
              payment_breakdown: sale.paymentBreakdown || null,
              payment_method: sale.paymentMethod || "cash",
              digital_tax: sale.taxAmount || 0,
              warranty_months: sale.warranty || 3,
              notes: sale.notes || null,
              created_at: sale.createdAt || sale.saleDate || new Date().toISOString(),
              updated_at: sale.updatedAt || sale.createdAt || new Date().toISOString(),
            });

            if (error) {
              console.error("Erro ao migrar venda rápida:", error);
              migrationSuccess = false;
            }
          }
        }

        // Migrar Receivables
        if (receivablesData) {
          const receivables = JSON.parse(receivablesData);
          console.log(`Migrando ${receivables.length} recebíveis...`);
          
          for (const receivable of receivables) {
            const { error } = await supabase.from("receivables").upsert({
              id: receivable.id,
              customer_id: receivable.customerId,
              customer_name: receivable.customerName,
              product_name: receivable.productName,
              cost_price: receivable.costPrice || null,
              sale_price: receivable.salePrice || null,
              profit: receivable.profit || null,
              total_amount: receivable.totalAmount,
              paid_amount: receivable.paidAmount || 0,
              remaining_amount: receivable.remainingAmount || receivable.totalAmount,
              due_date: receivable.dueDate || null,
              status: receivable.status || "pending",
              payments: receivable.payments || [],
              notes: receivable.notes || null,
              archived: receivable.archived || false,
              created_at: receivable.createdAt || new Date().toISOString(),
              updated_at: receivable.updatedAt || receivable.createdAt || new Date().toISOString(),
            } as any);

            if (error) {
              console.error("Erro ao migrar recebível:", error);
              migrationSuccess = false;
            }
          }
        }

        if (migrationSuccess) {
          // Limpar localStorage após migração bem-sucedida
          localStorage.removeItem("products_data");
          localStorage.removeItem("quick_sales_data");
          localStorage.removeItem("receivables_data");
          
          // Marcar como migrado
          localStorage.setItem(MIGRATION_KEY, "true");
          
          toast({
            title: "Migração concluída!",
            description: "Seus dados foram migrados com sucesso para o backend.",
          });
          
          setMigrationComplete(true);
        } else {
          toast({
            title: "Migração parcial",
            description: "Alguns dados podem não ter sido migrados. Verifique o console.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Erro durante migração:", error);
        toast({
          title: "Erro na migração",
          description: "Ocorreu um erro ao migrar seus dados. Por favor, contate o suporte.",
          variant: "destructive",
        });
      } finally {
        setIsMigrating(false);
      }
    };

    checkAndMigrate();
  }, [toast]);

  return { isMigrating, migrationComplete };
};
