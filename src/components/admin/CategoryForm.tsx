import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Category } from "@/lib/categoriesStore";
import * as Icons from "lucide-react";

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, icon: string, parentCategoryId: string | null) => void;
  initialData?: {
    name: string;
    icon: string;
    parentCategoryId: string | null;
  };
  parentCategories?: Category[];
  selectedParentForNew?: string | null;
}

const iconOptions = [
  { name: "Laptop", label: "Notebook" },
  { name: "Smartphone", label: "Celular" },
  { name: "Gamepad2", label: "Videogame" },
  { name: "Tv", label: "TV" },
  { name: "Tablet", label: "Tablet" },
  { name: "Headphones", label: "Áudio" },
  { name: "Cable", label: "Acessórios" },
  { name: "Watch", label: "Relógio" },
  { name: "Camera", label: "Câmera" },
  { name: "Package", label: "Outros" },
  { name: "Bike", label: "Bicicleta" },
  { name: "Wrench", label: "Hardware" },
  { name: "Code", label: "Software" },
  { name: "Mouse", label: "Periféricos" },
  { name: "ShoppingBag", label: "Bazar" },
];

const CategoryForm = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  parentCategories = [],
  selectedParentForNew = null,
}: CategoryFormProps) => {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Package");
  const [parentCategoryId, setParentCategoryId] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setIcon(initialData.icon);
      setParentCategoryId(initialData.parentCategoryId);
    } else {
      setName("");
      setIcon("Package");
      setParentCategoryId(selectedParentForNew);
    }
  }, [initialData, isOpen, selectedParentForNew]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name, icon, parentCategoryId);
    setName("");
    setIcon("Package");
    setParentCategoryId(null);
  };

  const IconComponent = Icons[icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Categoria" : "Nova Categoria"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Atualize os dados da categoria"
              : selectedParentForNew 
                ? "Adicione uma nova subcategoria"
                : "Adicione uma nova categoria ao catálogo"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Bicicletas, Hardware, etc."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Ícone</Label>
            <Select value={icon} onValueChange={setIcon}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {iconOptions.map((option) => {
                  const OptionIcon = Icons[option.name as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
                  return (
                    <SelectItem key={option.name} value={option.name}>
                      <div className="flex items-center gap-2">
                        <OptionIcon className="w-4 h-4" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {!initialData && parentCategories.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="parent">Categoria Pai (opcional)</Label>
              <Select 
                value={parentCategoryId || "none"} 
                onValueChange={(val) => setParentCategoryId(val === "none" ? null : val)}
                disabled={!!selectedParentForNew}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Categoria raiz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Categoria raiz</SelectItem>
                  {parentCategories.map((parent) => {
                    const ParentIcon = Icons[parent.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
                    return (
                      <SelectItem key={parent.id} value={parent.id}>
                        <div className="flex items-center gap-2">
                          <ParentIcon className="w-4 h-4" />
                          <span>{parent.name}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
            <span className="text-sm text-muted-foreground">Preview:</span>
            <IconComponent className="w-5 h-5" />
            <span className="font-medium">{name || "Nome da categoria"}</span>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {initialData ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryForm;
