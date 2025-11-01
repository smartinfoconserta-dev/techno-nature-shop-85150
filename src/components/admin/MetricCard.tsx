import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

const variantStyles = {
  default: {
    card: "",
    icon: "text-muted-foreground",
    value: "text-foreground",
  },
  success: {
    card: "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20",
    icon: "text-green-600 dark:text-green-400",
    value: "text-green-700 dark:text-green-300",
  },
  danger: {
    card: "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20",
    icon: "text-red-600 dark:text-red-400",
    value: "text-red-700 dark:text-red-300",
  },
  warning: {
    card: "border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20",
    icon: "text-orange-600 dark:text-orange-400",
    value: "text-orange-700 dark:text-orange-300",
  },
  info: {
    card: "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20",
    icon: "text-blue-600 dark:text-blue-400",
    value: "text-blue-700 dark:text-blue-300",
  },
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
}: MetricCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card className={styles.card}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${styles.icon}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${styles.value}`}>{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <span
              className={`text-xs font-medium ${
                trend.isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend.isPositive ? "↑" : "↓"} {trend.value}
            </span>
            <span className="text-xs text-muted-foreground">vs mês anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
