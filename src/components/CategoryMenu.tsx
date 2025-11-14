import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import * as Icons from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { categoriesStore, Category } from "@/lib/categoriesStore";

interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
  productCount?: number;
}

interface CategoryMenuProps {
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null, categoryName: string) => void;
  productCounts?: Record<string, number>;
}

interface CategoryMenuItemProps {
  category: CategoryTreeNode;
  level: number;
  selectedId: string | null;
  onSelect: (id: string, name: string) => void;
  expandedCategories: Set<string>;
  onToggleExpand: (id: string) => void;
}

const CategoryMenuItem = ({
  category,
  level,
  selectedId,
  onSelect,
  expandedCategories,
  onToggleExpand,
}: CategoryMenuItemProps) => {
  const hasChildren = category.children && category.children.length > 0;
  const IconComponent = (Icons[category.icon as keyof typeof Icons] || Icons.Package) as React.ComponentType<{ className?: string }>;
  const isSelected = selectedId === category.id;
  const isOpen = expandedCategories.has(category.id);

  return (
    <div className="w-full">
      <Collapsible open={isOpen} onOpenChange={() => onToggleExpand(category.id)}>
        <div
          className={cn(
            "flex items-center gap-2 py-2.5 px-3 rounded-lg cursor-pointer transition-all duration-200",
            "hover:bg-accent/60",
            isSelected && "bg-primary/15 text-primary font-semibold border-l-4 border-primary"
          )}
          style={{ paddingLeft: `${level * 1.25 + 0.75}rem` }}
        >
          {hasChildren && (
            <CollapsibleTrigger asChild>
              <button 
                className="p-0.5 hover:bg-accent/80 rounded transition-colors" 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand(category.id);
                }}
              >
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>
          )}
          {!hasChildren && <div className="w-5" />}
          
          <div 
            className="flex items-center gap-2 flex-1 min-w-0"
            onClick={() => onSelect(category.id, category.name)}
          >
            <IconComponent className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm truncate">{category.name}</span>
            {category.productCount !== undefined && category.productCount > 0 && (
              <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0">
                {category.productCount}
              </Badge>
            )}
          </div>
        </div>

        {hasChildren && (
          <CollapsibleContent className="mt-1">
            {category.children.map((child) => (
              <CategoryMenuItem
                key={child.id}
                category={child}
                level={level + 1}
                selectedId={selectedId}
                onSelect={onSelect}
                expandedCategories={expandedCategories}
                onToggleExpand={onToggleExpand}
              />
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
};

export const CategoryMenu = ({
  selectedCategoryId,
  onSelectCategory,
  productCounts = {},
}: CategoryMenuProps) => {
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCategoryTree();
    loadExpandedState();
  }, []);

  useEffect(() => {
    // Quando um produto conta muda, atualizar a árvore
    if (Object.keys(productCounts).length > 0) {
      updateProductCounts();
    }
  }, [productCounts]);

  const loadCategoryTree = async () => {
    const tree = await categoriesStore.getCategoryTree();
    setCategoryTree(tree);
  };

  const updateProductCounts = () => {
    setCategoryTree(prevTree => 
      prevTree.map(cat => addProductCountsToTree(cat, productCounts))
    );
  };

  const addProductCountsToTree = (node: CategoryTreeNode, counts: Record<string, number>): CategoryTreeNode => {
    const children = node.children.map(child => addProductCountsToTree(child, counts));
    const childrenCount = children.reduce((sum, child) => sum + (child.productCount || 0), 0);
    const ownCount = counts[node.id] || 0;
    
    return {
      ...node,
      children,
      productCount: ownCount + childrenCount,
    };
  };

  const loadExpandedState = () => {
    const saved = localStorage.getItem("expandedCategories");
    if (saved) {
      try {
        setExpandedCategories(new Set(JSON.parse(saved)));
      } catch (e) {
        console.error("Erro ao carregar estado de categorias expandidas:", e);
      }
    }
  };

  const saveExpandedState = (expanded: Set<string>) => {
    localStorage.setItem("expandedCategories", JSON.stringify([...expanded]));
  };

  const handleToggleExpand = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      saveExpandedState(newSet);
      return newSet;
    });
  };

  const handleSelectCategory = (id: string, name: string) => {
    onSelectCategory(id, name);
  };

  const handleClearSelection = () => {
    onSelectCategory(null, "");
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-4 pb-3 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-base">Categorias</h3>
          {selectedCategoryId && (
            <button
              onClick={handleClearSelection}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Limpar
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Navegue pelas categorias de produtos
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-1 pr-2">
        {categoryTree.map((category) => (
          <CategoryMenuItem
            key={category.id}
            category={category}
            level={0}
            selectedId={selectedCategoryId}
            onSelect={handleSelectCategory}
            expandedCategories={expandedCategories}
            onToggleExpand={handleToggleExpand}
          />
        ))}
      </div>
    </div>
  );
};
