import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";
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
}

const ProductFilters = ({ 
  selectedCategory, 
  onCategoryChange, 
  selectedBrand, 
  onBrandChange,
  brands,
  categories
}: ProductFiltersProps) => {
  const activeFiltersCount = (selectedBrand !== "all" ? 1 : 0);

  const handleClear = () => {
    onBrandChange("all");
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
