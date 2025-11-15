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
    <Card>
      <CardContent className="pt-6 pb-6">
        {/* Layout Desktop: tudo em linha */}
        <div className="hidden md:flex items-center justify-between gap-6">
          {/* Tabs à esquerda */}
          <div className="flex items-center gap-2">
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

          {/* Métricas no centro */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="text-muted-foreground">Total: </span>
                <span className="font-semibold">R$ {totals.total.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <div>
                <span className="text-muted-foreground">Pago: </span>
                <span className="font-semibold text-green-600">R$ {totals.paid.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <div>
                <span className="text-muted-foreground">Resta: </span>
                <span className="font-semibold text-blue-600">R$ {totals.remaining.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <div>
                <span className="text-muted-foreground">Vencido: </span>
                <span className="font-semibold text-red-600">R$ {totals.overdue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* View Mode à direita */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => onViewModeChange("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "customer" ? "default" : "outline"}
              size="sm"
              onClick={() => onViewModeChange("customer")}
            >
              <Users className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Layout Mobile: stacked */}
        <div className="md:hidden space-y-4">
          {/* Tabs */}
          <div className="flex gap-2">
            <Button
              variant={activeTab === "active" ? "default" : "outline"}
              onClick={() => onTabChange("active")}
              size="sm"
              className="flex-1 gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Ativas ({activeCounts})
            </Button>
            <Button
              variant={activeTab === "archived" ? "default" : "outline"}
              onClick={() => onTabChange("archived")}
              size="sm"
              className="flex-1 gap-2"
            >
              <Archive className="h-4 w-4" />
              Histórico ({archivedCounts})
            </Button>
          </div>

          {/* Métricas em grid 2x2 */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-semibold truncate">R$ {totals.total.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Pago</p>
                <p className="font-semibold text-green-600 truncate">R$ {totals.paid.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Resta</p>
                <p className="font-semibold text-blue-600 truncate">R$ {totals.remaining.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Vencido</p>
                <p className="font-semibold text-red-600 truncate">R$ {totals.overdue.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* View Mode */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => onViewModeChange("list")}
              className="flex-1 gap-2"
            >
              <List className="h-4 w-4" />
              Lista
            </Button>
            <Button
              variant={viewMode === "customer" ? "default" : "outline"}
              size="sm"
              onClick={() => onViewModeChange("customer")}
              className="flex-1 gap-2"
            >
              <Users className="h-4 w-4" />
              Por Cliente
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReceivablesSummaryBar;
