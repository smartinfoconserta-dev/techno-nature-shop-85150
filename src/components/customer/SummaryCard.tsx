import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  value: string;
  icon: LucideIcon;
  progress?: number; // 0-100
  alert?: { show: boolean; text: string };
  valueColor?: string;
  animated?: boolean;
}

export const SummaryCard = ({ title, value, icon: Icon, progress, alert, valueColor, animated }: Props) => {
  return (
    <Card className={cn("relative overflow-hidden", animated && "hover:shadow-lg transition-shadow")}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Icon className={cn("h-4 w-4", animated && "animate-pulse")} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn("text-xl font-bold mb-1", valueColor)}>{value}</p>
        
        {/* Barra de Progresso */}
        {progress !== undefined && (
          <div className="space-y-1">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">{progress.toFixed(0)}% concluído</p>
          </div>
        )}
        
        {/* Alerta de Vencimento */}
        {alert?.show && (
          <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-xs text-destructive font-medium">{alert.text}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
