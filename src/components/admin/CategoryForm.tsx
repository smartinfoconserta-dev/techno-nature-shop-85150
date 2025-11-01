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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, icon: string) => void;
  editingCategory?: Category | null;
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
  { name: "Package", label: "Outro" },
];

const CategoryForm = ({
  open,
  onOpenChange,
  onSubmit,
  editingCategory,
}: CategoryFormProps) => {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Package");

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setIcon(editingCategory.icon);
    } else {
      setName("");
      setIcon("Package");
    }
  }, [editingCategory, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name, icon);
    setName("");
    setIcon("Package");
  };

  const IconComponent = Icons[icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingCategory ? "Editar Categoria" : "Nova Categoria"}
          </DialogTitle>
          <DialogDescription>
            {editingCategory
              ? "Atualize os dados da categoria"
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
              placeholder="Ex: Videogames"
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

          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
            <span className="text-sm text-muted-foreground">Preview:</span>
            <IconComponent className="w-5 h-5" />
            <span className="font-medium">{name || "Nome da categoria"}</span>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {editingCategory ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryForm;
