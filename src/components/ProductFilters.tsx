import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            onClick={() => onCategoryChange(category)}
            className="transition-all duration-200"
          >
            {category}
          </Button>
        ))}
      </div>
      
      <div className="flex flex-wrap gap-4">
        <Select value={selectedBrand} onValueChange={onBrandChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por marca" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as marcas</SelectItem>
            {brands.map((brand) => (
              <SelectItem key={brand} value={brand}>
                {brand}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ProductFilters;
