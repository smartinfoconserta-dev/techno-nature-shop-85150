import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Receivable } from "@/lib/receivablesStore";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  receivables: Receivable[];
}

export const CustomerStatsChart = ({ receivables }: Props) => {
  // Filtrar receivables do mês atual para o gráfico de pizza
  const now = new Date();
  const currentMonthReceivables = receivables.filter(r => {
    const createdDate = new Date(r.createdAt);
    return createdDate.getMonth() === now.getMonth() 
      && createdDate.getFullYear() === now.getFullYear();
  });

  // Dados do gráfico de pizza: Pago vs Pendente (apenas mês atual)
  const totalPagoMes = currentMonthReceivables.reduce((sum, r) => sum + r.paidAmount, 0);
  const totalPendenteMes = currentMonthReceivables.reduce((sum, r) => sum + r.remainingAmount, 0);
  
  const pieData = [
    { name: "Pago (este mês)", value: totalPagoMes, color: "hsl(var(--chart-2))" },
    { name: "Saldo Devedor", value: totalPendenteMes, color: "hsl(var(--chart-1))" }
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
          <CardTitle className="text-base">
            Status dos Pagamentos - {format(new Date(), "MMMM/yyyy", { locale: ptBR })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Destaque do saldo devedor */}
          <div className="mb-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <p className="text-sm text-muted-foreground">Saldo Devedor Total (Este Mês)</p>
            <p className="text-2xl font-bold text-destructive">
              R$ {totalPendenteMes.toFixed(2)}
            </p>
          </div>

          <ResponsiveContainer width="100%" height={200}>
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
          <ResponsiveContainer width="100%" height={200}>
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
