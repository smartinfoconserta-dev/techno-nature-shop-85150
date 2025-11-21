import { Button } from "@/components/ui/button";
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
  return (
    <Button
      variant={selectedCategory === category.name ? "default" : "outline"}
      onClick={() => onSelectCategory(category.name)}
      className="whitespace-nowrap"
    >
      {category.name}
    </Button>
  );
};
