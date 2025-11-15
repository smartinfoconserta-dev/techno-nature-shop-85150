import { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  children?: ReactNode;
  resultsCount?: {
    showing: number;
    total: number;
  };
}

export const FilterBar = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  children,
  resultsCount,
}: FilterBarProps) => {
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        {children && (
          <div className="flex flex-wrap gap-2">
            {children}
          </div>
        )}
      </div>
      
      {resultsCount && (
        <div className="text-sm text-muted-foreground">
          Mostrando {resultsCount.showing} de {resultsCount.total} {resultsCount.total === 1 ? 'resultado' : 'resultados'}
        </div>
      )}
    </div>
  );
};
