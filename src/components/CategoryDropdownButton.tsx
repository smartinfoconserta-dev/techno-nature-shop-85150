import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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

  // Se tem filhos, renderiza dropdown
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
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem onClick={() => onSelectCategory(category.name)}>
          Ver todos em {category.name}
        </DropdownMenuItem>
        {category.children.map((child) => (
          <CategoryDropdownItem
            key={child.id}
            category={child}
            onSelectCategory={onSelectCategory}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface CategoryDropdownItemProps {
  category: CategoryTreeNode;
  onSelectCategory: (categoryName: string) => void;
}

const CategoryDropdownItem = ({
  category,
  onSelectCategory,
}: CategoryDropdownItemProps) => {
  const hasChildren = category.children && category.children.length > 0;

  // Se não tem filhos, item simples
  if (!hasChildren) {
    return (
      <DropdownMenuItem onClick={() => onSelectCategory(category.name)}>
        {category.name}
      </DropdownMenuItem>
    );
  }

  // Se tem filhos, submenu em cascata
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <span>{category.name}</span>
        <ChevronRight className="ml-auto h-4 w-4" />
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-48">
        <DropdownMenuItem onClick={() => onSelectCategory(category.name)}>
          Ver todos em {category.name}
        </DropdownMenuItem>
        {category.children.map((child) => (
          <CategoryDropdownItem
            key={child.id}
            category={child}
            onSelectCategory={onSelectCategory}
          />
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
};
