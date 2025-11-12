import { Button } from "@/components/ui/button";
import { Filter, X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
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
  onFilterSearchChange
}: ProductFiltersProps) => {
  const activeFiltersCount = 
    (selectedBrand !== "all" ? 1 : 0) + 
    (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0) +
    (filterSearch !== "" ? 1 : 0);

  const handleClear = () => {
    onBrandChange("all");
    onPriceRangeChange([0, maxPrice]);
    onFilterSearchChange("");
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
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
              <h3 className="font-semibold mb-3">Faixa de Preço</h3>
              <div className="space-y-4">
                <Slider
                  min={0}
                  max={maxPrice}
                  step={100}
                  value={priceRange}
                  onValueChange={(value) => onPriceRangeChange(value as [number, number])}
                  className="w-full"
                />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {formatPrice(priceRange[0])}
                  </span>
                  <span className="text-muted-foreground">
                    {formatPrice(priceRange[1])}
                  </span>
                </div>
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
