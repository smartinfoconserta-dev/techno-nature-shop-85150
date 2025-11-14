import { Button } from "@/components/ui/button";
import { Filter, X, Search, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProductFiltersProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedBrand: string;
  onBrandChange: (brand: string) => void;
  brands: string[];
  categories: string[];
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  maxPrice: number;
  filterSearch: string;
  onFilterSearchChange: (search: string) => void;
  priceSort: "none" | "asc" | "desc";
  onPriceSortChange: (sort: "none" | "asc" | "desc") => void;
  selectedProcessors: string[];
  onProcessorsChange: (processors: string[]) => void;
  selectedRAMs: string[];
  onRAMsChange: (rams: string[]) => void;
  hasDedicatedGPU: boolean | null;
  onDedicatedGPUChange: (value: boolean | null) => void;
}

const ProductFilters = ({ 
  selectedCategory, 
  onCategoryChange, 
  selectedBrand, 
  onBrandChange,
  brands,
  categories,
  priceRange,
  onPriceRangeChange,
  maxPrice,
  filterSearch,
  onFilterSearchChange,
  priceSort,
  onPriceSortChange,
  selectedProcessors,
  onProcessorsChange,
  selectedRAMs,
  onRAMsChange,
  hasDedicatedGPU,
  onDedicatedGPUChange,
}: ProductFiltersProps) => {
  const activeFiltersCount = 
    (selectedBrand !== "all" ? 1 : 0) + 
    (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0) +
    (filterSearch !== "" ? 1 : 0) +
    (priceSort !== "none" ? 1 : 0) +
    (selectedProcessors.length > 0 ? 1 : 0) +
    (selectedRAMs.length > 0 ? 1 : 0) +
    (hasDedicatedGPU !== null ? 1 : 0);

  const handleClear = () => {
    onBrandChange("all");
    onPriceRangeChange([0, maxPrice]);
    onFilterSearchChange("");
    onPriceSortChange("none");
    onProcessorsChange([]);
    onRAMsChange([]);
    onDedicatedGPUChange(null);
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPriceInput = (value: number): string => {
    if (value === 0) return "";
    return value.toString();
  };

  const parsePriceInput = (value: string): number => {
    const parsed = parseInt(value.replace(/\D/g, ''), 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleMinPriceChange = (value: string) => {
    const minPrice = parsePriceInput(value);
    onPriceRangeChange([minPrice, priceRange[1]]);
  };

  const handleMaxPriceChange = (value: string) => {
    const maxPrice = parsePriceInput(value);
    onPriceRangeChange([priceRange[0], maxPrice]);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge variant="default" className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 sm:w-96">
        <SheetHeader>
          <SheetTitle>Filtros</SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-180px)] pr-4 mt-6">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Buscar Produto</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Digite para buscar..."
                  value={filterSearch}
                  onChange={(e) => onFilterSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Ordenar por Preço
              </h3>
              <Select value={priceSort} onValueChange={onPriceSortChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem ordenação</SelectItem>
                  <SelectItem value="asc">Menor preço primeiro</SelectItem>
                  <SelectItem value="desc">Maior preço primeiro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Faixa de Preço</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Preço mínimo</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="R$ 0"
                    value={formatPriceInput(priceRange[0])}
                    onChange={(e) => handleMinPriceChange(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Preço máximo</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder={`R$ ${maxPrice}`}
                    value={formatPriceInput(priceRange[1])}
                    onChange={(e) => handleMaxPriceChange(e.target.value)}
                    className="w-full"
                  />
                </div>
                {(priceRange[0] > 0 || priceRange[1] < maxPrice) && (
                  <p className="text-xs text-muted-foreground">
                    De {formatPrice(priceRange[0])} até {formatPrice(priceRange[1])}
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Marcas</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={selectedBrand === "all" ? "default" : "outline"}
                  onClick={() => onBrandChange("all")}
                >
                  Todas
                </Button>
                {brands.map((brand) => (
                  <Button
                    key={brand}
                    size="sm"
                    variant={selectedBrand === brand ? "default" : "outline"}
                    onClick={() => onBrandChange(brand)}
                  >
                    {brand}
                  </Button>
                ))}
              </div>
            </div>

            {/* Filtros de Notebooks */}
            {selectedCategory === "Notebooks" && (
              <>
                <div>
                  <h3 className="font-semibold mb-3">Processador</h3>
                  <div className="flex flex-wrap gap-2">
                    {['i3', 'i5', 'i7', 'i9'].map((proc) => (
                      <Button
                        key={proc}
                        size="sm"
                        variant={selectedProcessors.includes(proc) ? "default" : "outline"}
                        onClick={() => {
                          if (selectedProcessors.includes(proc)) {
                            onProcessorsChange(selectedProcessors.filter(p => p !== proc));
                          } else {
                            onProcessorsChange([...selectedProcessors, proc]);
                          }
                        }}
                      >
                        {proc.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Memória RAM</h3>
                  <div className="flex flex-wrap gap-2">
                    {['4GB', '8GB', '16GB'].map((memory) => (
                      <Button
                        key={memory}
                        size="sm"
                        variant={selectedRAMs.includes(memory) ? "default" : "outline"}
                        onClick={() => {
                          if (selectedRAMs.includes(memory)) {
                            onRAMsChange(selectedRAMs.filter(r => r !== memory));
                          } else {
                            onRAMsChange([...selectedRAMs, memory]);
                          }
                        }}
                      >
                        {memory}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Placa de Vídeo</h3>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="dedicated-gpu"
                      checked={hasDedicatedGPU === true}
                      onCheckedChange={(checked) => onDedicatedGPUChange(checked ? true : null)}
                    />
                    <label htmlFor="dedicated-gpu" className="text-sm cursor-pointer">
                      Com placa de vídeo dedicada
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t">
          <Button
            variant="outline"
            onClick={handleClear}
            className="w-full"
          >
            <X className="h-4 w-4 mr-2" />
            Limpar Filtros
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default ProductFilters;
