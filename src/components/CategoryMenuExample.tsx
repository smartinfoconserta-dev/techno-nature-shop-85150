import { useState } from "react";
import { ChevronDown, ChevronRight, Package, Cpu, Monitor, Smartphone, Laptop, HardDrive } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

// Dados de exemplo para demonstração
const mockCategories = [
  {
    id: "1",
    name: "Hardware",
    icon: "Package",
    children: [
      {
        id: "1-1",
        name: "Processadores",
        icon: "Cpu",
        children: [
          { id: "1-1-1", name: "Intel Core i5", icon: "Cpu", children: [] },
          { id: "1-1-2", name: "Intel Core i7", icon: "Cpu", children: [] },
          { id: "1-1-3", name: "AMD Ryzen 5", icon: "Cpu", children: [] },
          { id: "1-1-4", name: "AMD Ryzen 7", icon: "Cpu", children: [] },
        ],
      },
      {
        id: "1-2",
        name: "Placas de Vídeo",
        icon: "Monitor",
        children: [
          { id: "1-2-1", name: "NVIDIA RTX 3060", icon: "Monitor", children: [] },
          { id: "1-2-2", name: "NVIDIA RTX 4070", icon: "Monitor", children: [] },
          { id: "1-2-3", name: "AMD Radeon RX", icon: "Monitor", children: [] },
        ],
      },
      {
        id: "1-3",
        name: "Armazenamento",
        icon: "HardDrive",
        children: [
          { id: "1-3-1", name: "SSD NVMe", icon: "HardDrive", children: [] },
          { id: "1-3-2", name: "SSD SATA", icon: "HardDrive", children: [] },
          { id: "1-3-3", name: "HD 1TB", icon: "HardDrive", children: [] },
        ],
      },
    ],
  },
  {
    id: "2",
    name: "Computadores",
    icon: "Laptop",
    children: [
      {
        id: "2-1",
        name: "Notebooks",
        icon: "Laptop",
        children: [
          { id: "2-1-1", name: "Notebooks Gamer", icon: "Laptop", children: [] },
          { id: "2-1-2", name: "Notebooks Corporativo", icon: "Laptop", children: [] },
          { id: "2-1-3", name: "Ultrabooks", icon: "Laptop", children: [] },
        ],
      },
      {
        id: "2-2",
        name: "Desktops",
        icon: "Monitor",
        children: [
          { id: "2-2-1", name: "PCs Gamer", icon: "Monitor", children: [] },
          { id: "2-2-2", name: "PCs Office", icon: "Monitor", children: [] },
        ],
      },
    ],
  },
  {
    id: "3",
    name: "Smartphones",
    icon: "Smartphone",
    children: [
      { id: "3-1", name: "Samsung Galaxy", icon: "Smartphone", children: [] },
      { id: "3-2", name: "iPhone", icon: "Smartphone", children: [] },
      { id: "3-3", name: "Xiaomi", icon: "Smartphone", children: [] },
    ],
  },
];

const iconMap: Record<string, any> = {
  Package,
  Cpu,
  Monitor,
  Smartphone,
  Laptop,
  HardDrive,
};

interface CategoryMenuItemProps {
  category: any;
  level: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const CategoryMenuItem = ({ category, level, selectedId, onSelect }: CategoryMenuItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = category.children && category.children.length > 0;
  const Icon = iconMap[category.icon] || Package;
  const isSelected = selectedId === category.id;

  return (
    <div className="w-full">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className={cn(
            "flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer transition-colors",
            "hover:bg-accent/50",
            isSelected && "bg-primary/10 text-primary font-medium"
          )}
          style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
        >
          {hasChildren && (
            <CollapsibleTrigger asChild>
              <button className="p-0 hover:bg-transparent" onClick={(e) => e.stopPropagation()}>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>
          )}
          {!hasChildren && <div className="w-4" />}
          
          <div 
            className="flex items-center gap-2 flex-1"
            onClick={() => onSelect(category.id)}
          >
            <Icon className="h-4 w-4" />
            <span className="text-sm">{category.name}</span>
            <span className="text-xs text-muted-foreground ml-auto">(12)</span>
          </div>
        </div>

        {hasChildren && (
          <CollapsibleContent>
            <div className="mt-1">
              {category.children.map((child: any) => (
                <CategoryMenuItem
                  key={child.id}
                  category={child}
                  level={level + 1}
                  selectedId={selectedId}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
};

export const CategoryMenuExample = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <div className="w-full max-w-sm border rounded-lg bg-card p-4">
      <div className="mb-4">
        <h3 className="font-semibold text-lg mb-1">Categorias</h3>
        <p className="text-xs text-muted-foreground">
          Exemplo de menu hierárquico vertical
        </p>
      </div>
      
      <div className="space-y-1">
        {mockCategories.map((category) => (
          <CategoryMenuItem
            key={category.id}
            category={category}
            level={0}
            selectedId={selectedCategory}
            onSelect={setSelectedCategory}
          />
        ))}
      </div>

      {selectedCategory && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Categoria selecionada: <span className="font-medium text-foreground">{selectedCategory}</span>
          </p>
        </div>
      )}
    </div>
  );
};
