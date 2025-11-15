import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Archive, List, Users, DollarSign, AlertCircle } from "lucide-react";

interface ReceivablesSummaryBarProps {
  activeTab: "active" | "archived";
  onTabChange: (tab: "active" | "archived") => void;
  totals: {
    total: number;
    paid: number;
    remaining: number;
    overdue: number;
  };
  viewMode: "list" | "customer";
  onViewModeChange: (mode: "list" | "customer") => void;
  activeCounts: number;
  archivedCounts: number;
}

const ReceivablesSummaryBar = ({
  activeTab,
  onTabChange,
  totals,
  viewMode,
  onViewModeChange,
  activeCounts,
  archivedCounts,
}: ReceivablesSummaryBarProps) => {
  return (
    <div className="space-y-4">
      {/* Linha 1: Tabs e View Mode */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === "active" ? "default" : "outline"}
            onClick={() => onTabChange("active")}
            size="sm"
            className="gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Ativas ({activeCounts})
          </Button>
          <Button
            variant={activeTab === "archived" ? "default" : "outline"}
            onClick={() => onTabChange("archived")}
            size="sm"
            className="gap-2"
          >
            <Archive className="h-4 w-4" />
            Histórico ({archivedCounts})
          </Button>
        </div>

        {/* View Mode */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => onViewModeChange("list")}
            title="Visualizar como lista"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "customer" ? "default" : "outline"}
            size="sm"
            onClick={() => onViewModeChange("customer")}
            title="Agrupar por cliente"
          >
            <Users className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Linha 2: Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-lg font-bold mt-1">
              R$ {totals.total.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <div className="text-xs text-muted-foreground">Pago</div>
            </div>
            <div className="text-lg font-bold text-green-600 mt-1">
              R$ {totals.paid.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <div className="text-xs text-muted-foreground">Resta</div>
            </div>
            <div className="text-lg font-bold text-blue-600 mt-1">
              R$ {totals.remaining.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <div className="text-xs text-muted-foreground">Vencido</div>
            </div>
            <div className="text-lg font-bold text-red-600 mt-1">
              R$ {totals.overdue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReceivablesSummaryBar;
