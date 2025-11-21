import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CategoryTreeNode } from "@/lib/categoriesStore";

interface CategoryDropdownButtonProps {
  category: CategoryTreeNode;
  selectedCategory: string;
  onSelectCategory: (categoryName: string) => void;
}

export const CategoryDropdownButton = ({
  category,
  selectedCategory,
  onSelectCategory,
}: CategoryDropdownButtonProps) => {
  const hasChildren = category.children && category.children.length > 0;

  // Se não tem filhos, renderiza botão simples
  if (!hasChildren) {
    return (
      <Button
        variant={selectedCategory === category.name ? "default" : "outline"}
        onClick={() => onSelectCategory(category.name)}
        className="whitespace-nowrap"
      >
        {category.name}
      </Button>
    );
  }

  // Se tem filhos, renderiza dropdown com lista de subcategorias
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={selectedCategory === category.name ? "default" : "outline"}
          className="whitespace-nowrap gap-1"
        >
          {category.name}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 bg-background z-50">
        {category.children.map((child) => (
          <DropdownMenuItem 
            key={child.id} 
            onClick={() => onSelectCategory(child.name)}
          >
            {child.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
