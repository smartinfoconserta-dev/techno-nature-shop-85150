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
    <Card className={cn(
      "relative overflow-hidden border-l-4",
      valueColor === "text-green-600" && "border-l-green-500",
      valueColor === "text-destructive" && "border-l-destructive",
      valueColor === "text-primary" && "border-l-primary",
      !valueColor && "border-l-muted",
      animated && "hover:shadow-lg transition-shadow"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={cn("h-4 w-4 text-muted-foreground", animated && "animate-pulse")} />
              <p className="text-xs text-muted-foreground font-medium">{title}</p>
            </div>
            <p className={cn("text-xl md:text-2xl font-bold", valueColor)}>{value}</p>
          </div>
        </div>
        
        {/* Alerta de Vencimento - Compacto */}
        {alert?.show && (
          <div className="mt-3 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-xs text-destructive font-medium">{alert.text}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
