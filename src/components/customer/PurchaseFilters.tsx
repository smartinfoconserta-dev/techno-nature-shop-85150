import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface Props {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  periodFilter: string;
  onPeriodFilterChange: (value: string) => void;
  warrantyFilter: string;
  onWarrantyFilterChange: (value: string) => void;
  brandFilter: string;
  onBrandFilterChange: (value: string) => void;
  brands: string[];
}

export const PurchaseFilters = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  periodFilter,
  onPeriodFilterChange,
  warrantyFilter,
  onWarrantyFilterChange,
  brandFilter,
  onBrandFilterChange,
  brands
}: Props) => {
  return (
    <div className="space-y-4 mb-4">
      {/* Linha 1: Busca, Status, Período */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Busca por nome, valor ou marca */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produto, valor, marca..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Filtro por status */}
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="partial">Parcial</SelectItem>
            <SelectItem value="paid">Quitado</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Filtro por período */}
        <Select value={periodFilter} onValueChange={onPeriodFilterChange}>
          <SelectTrigger>
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os períodos</SelectItem>
            <SelectItem value="30days">Último mês</SelectItem>
            <SelectItem value="90days">Últimos 3 meses</SelectItem>
            <SelectItem value="180days">Últimos 6 meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Linha 2: Marca e Garantia */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Filtro por marca */}
        <Select value={brandFilter} onValueChange={onBrandFilterChange}>
          <SelectTrigger>
            <SelectValue placeholder="Marca" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as marcas</SelectItem>
            {brands.map(brand => (
              <SelectItem key={brand} value={brand}>{brand}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Filtro por garantia */}
        <Select value={warrantyFilter} onValueChange={onWarrantyFilterChange}>
          <SelectTrigger>
            <SelectValue placeholder="Garantia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="active">Na garantia</SelectItem>
            <SelectItem value="expiring">Expirando (≤7 dias)</SelectItem>
            <SelectItem value="expired">Garantia expirada</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
