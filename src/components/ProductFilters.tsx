import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter, ChevronDown, ChevronUp } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { settingsStore } from "@/lib/settingsStore";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ProductFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedBrand: string;
  onBrandChange: (brand: string) => void;
  brands: string[];
  sortBy: string;
  onSortChange: (sort: string) => void;
  minPrice: number;
  maxPrice: number;
  onMinPriceChange: (price: number) => void;
  onMaxPriceChange: (price: number) => void;
  selectedProcessor: string;
  onProcessorChange: (processor: string) => void;
  selectedRam: string;
  onRamChange: (ram: string) => void;
  hasDedicatedGpu: boolean | null;
  onDedicatedGpuChange: (value: boolean | null) => void;
  selectedCategory: string;
}

export default function ProductFilters({
  searchQuery,
  onSearchChange,
  selectedBrand,
  onBrandChange,
  brands,
  sortBy,
  onSortChange,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  selectedProcessor,
  onProcessorChange,
  selectedRam,
  onRamChange,
  hasDedicatedGpu,
  onDedicatedGpuChange,
  selectedCategory,
}: ProductFiltersProps) {
  const [processorOptions, setProcessorOptions] = useState<string[]>([]);
  const [ramOptions, setRamOptions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  // Estados temporários locais
  const [tempSearchQuery, setTempSearchQuery] = useState(searchQuery);
  const [tempSelectedBrand, setTempSelectedBrand] = useState(selectedBrand);
  const [tempSortBy, setTempSortBy] = useState(sortBy);
  const [tempMinPrice, setTempMinPrice] = useState(minPrice);
  const [tempMaxPrice, setTempMaxPrice] = useState(maxPrice);
  const [tempSelectedProcessor, setTempSelectedProcessor] = useState(selectedProcessor);
  const [tempSelectedRam, setTempSelectedRam] = useState(selectedRam);
  const [tempHasDedicatedGpu, setTempHasDedicatedGpu] = useState(hasDedicatedGpu);

  // Estados de expansão das seções
  const [brandsOpen, setBrandsOpen] = useState(false);
  const [priceRangeOpen, setPriceRangeOpen] = useState(false);
  const [processorOpen, setProcessorOpen] = useState(false);
  const [ramOpen, setRamOpen] = useState(false);
  const [gpuOpen, setGpuOpen] = useState(false);

  useEffect(() => {
    setTempSearchQuery(searchQuery);
    setTempSelectedBrand(selectedBrand);
    setTempSortBy(sortBy);
    setTempMinPrice(minPrice);
    setTempMaxPrice(maxPrice);
    setTempSelectedProcessor(selectedProcessor);
    setTempSelectedRam(selectedRam);
    setTempHasDedicatedGpu(hasDedicatedGpu);
  }, [searchQuery, selectedBrand, sortBy, minPrice, maxPrice, selectedProcessor, selectedRam, hasDedicatedGpu]);

  useEffect(() => {
    const loadSpecOptions = async () => {
      const settings = await settingsStore.getSettings();
      setProcessorOptions(settings.processorOptions || []);
      setRamOptions(settings.ramOptions || []);
    };
    loadSpecOptions();
  }, []);

  const activeFiltersCount = [
    tempSearchQuery,
    tempSelectedBrand !== "all",
    tempSortBy !== "newest",
    tempMinPrice > 0,
    tempMaxPrice < 999999,
    tempSelectedProcessor !== "all",
    tempSelectedRam !== "all",
    tempHasDedicatedGpu !== null,
  ].filter(Boolean).length;

  const handleApplyFilters = () => {
    onSearchChange(tempSearchQuery);
    onBrandChange(tempSelectedBrand);
    onSortChange(tempSortBy);
    onMinPriceChange(tempMinPrice);
    onMaxPriceChange(tempMaxPrice);
    onProcessorChange(tempSelectedProcessor);
    onRamChange(tempSelectedRam);
    onDedicatedGpuChange(tempHasDedicatedGpu);
    setOpen(false);
  };

  const handleClear = () => {
    setTempSearchQuery("");
    setTempSelectedBrand("all");
    setTempSortBy("newest");
    setTempMinPrice(0);
    setTempMaxPrice(999999);
    setTempSelectedProcessor("all");
    setTempSelectedRam("all");
    setTempHasDedicatedGpu(null);
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPriceInput = (value: number) => {
    if (value === 0) return "";
    return value.toString();
  };

  const parsePriceInput = (value: string) => {
    if (!value) return 0;
    const numValue = parseFloat(value.replace(/\D/g, ""));
    return isNaN(numValue) ? 0 : numValue;
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parsePriceInput(e.target.value);
    setTempMinPrice(newValue);
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parsePriceInput(e.target.value);
    setTempMaxPrice(newValue);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2 relative">
          <Filter className="h-4 w-4" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filtros de Produtos</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Busca */}
          <div className="space-y-2">
            <Label htmlFor="search">Buscar produto</Label>
            <Input
              id="search"
              placeholder="Nome do produto..."
              value={tempSearchQuery}
              onChange={(e) => setTempSearchQuery(e.target.value)}
            />
          </div>

          {/* Ordenação */}
          <div className="space-y-2">
            <Label htmlFor="sort">Ordenar por</Label>
            <Select value={tempSortBy} onValueChange={setTempSortBy}>
              <SelectTrigger id="sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mais recentes</SelectItem>
                <SelectItem value="oldest">Mais antigos</SelectItem>
                <SelectItem value="price-asc">Menor preço</SelectItem>
                <SelectItem value="price-desc">Maior preço</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Faixa de Preço */}
          <Collapsible open={priceRangeOpen} onOpenChange={setPriceRangeOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
              <Label className="cursor-pointer">Faixa de Preço</Label>
              {priceRangeOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min-price" className="text-sm">
                    Mínimo
                  </Label>
                  <Input
                    id="min-price"
                    type="number"
                    placeholder="R$ 0"
                    value={formatPriceInput(tempMinPrice)}
                    onChange={handleMinPriceChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-price" className="text-sm">
                    Máximo
                  </Label>
                  <Input
                    id="max-price"
                    type="number"
                    placeholder="Sem limite"
                    value={tempMaxPrice === 999999 ? "" : formatPriceInput(tempMaxPrice)}
                    onChange={handleMaxPriceChange}
                  />
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatPrice(tempMinPrice)} - {tempMaxPrice === 999999 ? "Sem limite" : formatPrice(tempMaxPrice)}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Marcas */}
          <Collapsible open={brandsOpen} onOpenChange={setBrandsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
              <Label className="cursor-pointer">Marcas</Label>
              {brandsOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              <Button
                variant={tempSelectedBrand === "all" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setTempSelectedBrand("all")}
              >
                Todas as marcas
              </Button>
              {brands.map((brand) => (
                <Button
                  key={brand}
                  variant={tempSelectedBrand === brand ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setTempSelectedBrand(brand)}
                >
                  {brand}
                </Button>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Filtros específicos para Notebooks */}
          {selectedCategory === "Notebooks" && (
            <>
              {/* Processador */}
              <Collapsible open={processorOpen} onOpenChange={setProcessorOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
                  <Label className="cursor-pointer">Processador</Label>
                  {processorOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  <Button
                    variant={tempSelectedProcessor === "all" ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setTempSelectedProcessor("all")}
                  >
                    Todos os processadores
                  </Button>
                  {processorOptions.map((processor) => (
                    <Button
                      key={processor}
                      variant={tempSelectedProcessor === processor ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setTempSelectedProcessor(processor)}
                    >
                      {processor}
                    </Button>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              {/* RAM */}
              <Collapsible open={ramOpen} onOpenChange={setRamOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
                  <Label className="cursor-pointer">Memória RAM</Label>
                  {ramOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  <Button
                    variant={tempSelectedRam === "all" ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setTempSelectedRam("all")}
                  >
                    Todas as memórias
                  </Button>
                  {ramOptions.map((ram) => (
                    <Button
                      key={ram}
                      variant={tempSelectedRam === ram ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setTempSelectedRam(ram)}
                    >
                      {ram}
                    </Button>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              {/* Placa de Vídeo Dedicada */}
              <Collapsible open={gpuOpen} onOpenChange={setGpuOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
                  <Label className="cursor-pointer">Placa de Vídeo</Label>
                  {gpuOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dedicated-gpu" className="text-sm">
                      Apenas com placa dedicada
                    </Label>
                    <Switch
                      id="dedicated-gpu"
                      checked={tempHasDedicatedGpu === true}
                      onCheckedChange={(checked) => setTempHasDedicatedGpu(checked ? true : null)}
                    />
                  </div>
                  {tempHasDedicatedGpu !== null && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setTempHasDedicatedGpu(null)}
                    >
                      Limpar filtro
                    </Button>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </>
          )}
        </div>

        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={handleClear} className="flex-1">
            Limpar Filtros
          </Button>
          <Button onClick={handleApplyFilters} className="flex-1">
            Aplicar Filtros
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
