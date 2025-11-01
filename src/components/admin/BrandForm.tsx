import { useState, useEffect } from "react";
import { Brand } from "@/lib/brandsStore";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BrandFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, category: "Notebooks" | "Celulares") => void;
  editingBrand?: Brand | null;
}

const BrandForm = ({ open, onOpenChange, onSubmit, editingBrand }: BrandFormProps) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"Notebooks" | "Celulares">("Celulares");

  useEffect(() => {
    if (editingBrand) {
      setName(editingBrand.name);
      setCategory(editingBrand.category);
    } else {
      setName("");
      setCategory("Celulares");
    }
  }, [editingBrand, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name, category);
      setName("");
      setCategory("Celulares");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editingBrand ? "Editar Marca" : "Nova Marca"}
          </DialogTitle>
          <DialogDescription>
            {editingBrand
              ? "Modifique o nome ou categoria da marca."
              : "Adicione uma nova marca ao catálogo."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="brand-name">Nome da Marca</Label>
            <Input
              id="brand-name"
              placeholder="Ex: Positivo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand-category">Categoria</Label>
            <Select value={category} onValueChange={(val) => setCategory(val as any)}>
              <SelectTrigger id="brand-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Celulares">Celulares</SelectItem>
                <SelectItem value="Notebooks">Notebooks</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingBrand ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BrandForm;
