import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Product } from "@/lib/productsStore";

interface ProductCatalogSelectorProps {
  products: Product[];
  selectedProductId?: string;
  onProductSelect: (product: Product) => void;
}

export function ProductCatalogSelector({
  products,
  selectedProductId,
  onProductSelect,
}: ProductCatalogSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Group products by category
  const productsByCategory = useMemo(() => {
    const grouped = products.reduce((acc, product) => {
      const cat = product.category || "Outros";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(product);
      return acc;
    }, {} as Record<string, Product[]>);

    // Sort categories alphabetically
    return Object.keys(grouped)
      .sort()
      .reduce((acc, key) => {
        acc[key] = grouped[key];
        return acc;
      }, {} as Record<string, Product[]>);
  }, [products]);

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedProduct ? (
              <span className="truncate">{selectedProduct.name}</span>
            ) : (
              <span className="text-muted-foreground">
                Buscar produto no catálogo...
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[500px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar por nome, marca, specs..." />
            <CommandList className="max-h-[400px]">
              <CommandEmpty>Nenhum produto encontrado</CommandEmpty>
              {Object.entries(productsByCategory).map(
                ([category, categoryProducts]) => (
                  <CommandGroup key={category} heading={category}>
                    {categoryProducts.map((product) => {
                      const searchValue = `${product.name} ${product.brand} ${product.category} ${product.specs || ""}`.toLowerCase();
                      
                      return (
                        <CommandItem
                          key={product.id}
                          value={searchValue}
                          onSelect={() => {
                            onProductSelect(product);
                            setOpen(false);
                          }}
                        >
                          <div className="flex items-center gap-3 w-full py-1">
                            {/* Thumbnail */}
                            <div className="w-12 h-12 rounded bg-muted overflow-hidden flex-shrink-0">
                              {product.images?.[0] ? (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-6 h-6 m-3 text-muted-foreground" />
                              )}
                            </div>

                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium truncate">
                                  {product.name}
                                </p>
                                <Check
                                  className={cn(
                                    "h-4 w-4 shrink-0",
                                    selectedProductId === product.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                              </div>

                              {/* Specs */}
                              {product.specs && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {product.specs}
                                </p>
                              )}

                              {/* Prices */}
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm font-semibold">
                                  R$ {product.price.toFixed(2)}
                                </span>
                                {product.discountPrice && (
                                  <span className="text-xs text-green-600 font-medium">
                                    B2B: R$ {product.discountPrice.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Product Card */}
      {selectedProduct && (
        <Card className="p-3 bg-muted/50">
          <div className="flex gap-3">
            <div className="w-16 h-16 rounded bg-background overflow-hidden flex-shrink-0">
              {selectedProduct.images?.[0] ? (
                <img
                  src={selectedProduct.images[0]}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="w-8 h-8 m-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{selectedProduct.name}</p>
              <p className="text-xs text-muted-foreground">
                {selectedProduct.brand} • {selectedProduct.category}
              </p>
              {selectedProduct.specs && (
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {selectedProduct.specs}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm font-semibold">
                  R$ {selectedProduct.price.toFixed(2)}
                </p>
                {selectedProduct.discountPrice && (
                  <span className="text-xs text-green-600 font-medium">
                    B2B: R$ {selectedProduct.discountPrice.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
