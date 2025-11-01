import { useState, useEffect } from "react";
import { productsStore } from "@/lib/productsStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp } from "lucide-react";

export function SalesTrendChart() {
  const [chartData, setChartData] = useState<{ date: string; vendas: number }[]>([]);

  useEffect(() => {
    generateChartData();
  }, []);

  const generateChartData = () => {
    const soldProducts = productsStore.getSoldProducts();
    const last7Days = [];

    // Gera os últimos 7 dias
    for (let i = 6; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const dateStr = format(date, "yyyy-MM-dd");
      const dayName = format(date, "EEE", { locale: ptBR });

      // Conta vendas desse dia
      const salesOnDay = soldProducts.filter((p) => {
        if (!p.saleDate) return false;
        const saleDate = startOfDay(new Date(p.saleDate));
        return format(saleDate, "yyyy-MM-dd") === dateStr;
      });

      const totalSales = salesOnDay.reduce(
        (sum, p) => sum + (p.salePrice || p.price),
        0
      );

      last7Days.push({
        date: dayName,
        vendas: totalSales,
      });
    }

    setChartData(last7Days);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Evolução de Vendas (Últimos 7 dias)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => `R$ ${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Vendas"]}
            />
            <Line
              type="monotone"
              dataKey="vendas"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
