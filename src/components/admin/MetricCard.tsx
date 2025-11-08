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
    card: "shadow-sm hover:shadow-md transition-shadow",
    icon: "text-gray-500",
    value: "text-gray-900",
  },
  success: {
    card: "shadow-sm hover:shadow-md transition-shadow",
    icon: "text-emerald-600",
    value: "text-gray-900",
  },
  danger: {
    card: "shadow-sm hover:shadow-md transition-shadow",
    icon: "text-rose-600",
    value: "text-gray-900",
  },
  warning: {
    card: "shadow-sm hover:shadow-md transition-shadow",
    icon: "text-amber-600",
    value: "text-gray-900",
  },
  info: {
    card: "shadow-sm hover:shadow-md transition-shadow",
    icon: "text-blue-600",
    value: "text-gray-900",
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
