import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Receivable } from "@/lib/receivablesStore";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  receivables: Receivable[];
}

export const CustomerStatsChart = ({ receivables }: Props) => {
  // Dados do gráfico de pizza: Pago vs Pendente
  const totalPago = receivables.reduce((sum, r) => sum + r.paidAmount, 0);
  const totalPendente = receivables.reduce((sum, r) => sum + r.remainingAmount, 0);
  
  const pieData = [
    { name: "Pago", value: totalPago, color: "hsl(var(--chart-2))" },
    { name: "Pendente", value: totalPendente, color: "hsl(var(--chart-1))" }
  ];

  // Dados do gráfico de barras: histórico dos últimos 6 meses
  const getLast6MonthsData = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthReceivables = receivables.filter(r => {
        const createdDate = new Date(r.createdAt);
        return createdDate >= monthStart && createdDate <= monthEnd;
      });
      
      months.push({
        month: format(date, "MMM/yy", { locale: ptBR }),
        compras: monthReceivables.reduce((sum, r) => sum + r.totalAmount, 0),
        pagamentos: monthReceivables.reduce((sum, r) => sum + r.paidAmount, 0)
      });
    }
    return months;
  };

  const barData = getLast6MonthsData();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
      {/* Gráfico de Pizza */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status dos Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="hsl(var(--primary))"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Barras */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico dos Últimos 6 Meses</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-muted-foreground" />
              <YAxis className="text-muted-foreground" />
              <Tooltip 
                formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)"
                }}
              />
              <Legend />
              <Bar dataKey="compras" fill="hsl(var(--chart-1))" name="Compras" />
              <Bar dataKey="pagamentos" fill="hsl(var(--chart-2))" name="Pagamentos" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
