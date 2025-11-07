import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus, GripVertical } from "lucide-react";
import { Product } from "@/lib/productsStore";
import { brandsStore } from "@/lib/brandsStore";

interface ProductFormProps {
  product?: Product;
  onSave: (data: Omit<Product, "id" | "order" | "sold" | "expenses" | "createdAt">) => void;
  onCancel: () => void;
}

const ProductForm = ({ product, onSave, onCancel }: ProductFormProps) => {
  const [name, setName] = useState(product?.name || "");
  const [category, setCategory] = useState(product?.category || "Notebooks");
  const [brand, setBrand] = useState(product?.brand || "");
  const [specs, setSpecs] = useState(product?.specs || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(product?.price.toString() || "");
  const [discountPrice, setDiscountPrice] = useState(
    product?.discountPrice?.toString() || ""
  );
  const [passOnCashDiscount, setPassOnCashDiscount] = useState(
    product?.passOnCashDiscount || false
  );
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    import("@/lib/categoriesStore").then(({ categoriesStore }) => {
      setCategories(categoriesStore.getCategoryNames());
    });
  }, []);

  useEffect(() => {
    loadBrands();
  }, [category]);

  useEffect(() => {
    if (product) {
      setPassOnCashDiscount(product.passOnCashDiscount || false);
    }
  }, [product]);

  const loadBrands = () => {
    const brands = brandsStore.getBrandsByCategory(category);
    setAvailableBrands(brands.map((b) => b.name));
  };

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setImages([...images, newImageUrl.trim()]);
      setNewImageUrl("");
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleMoveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    setImages(newImages);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !brand || !price || images.length === 0) {
      alert("Preencha todos os campos obrigatórios e adicione pelo menos uma imagem");
      return;
    }

    onSave({
      name,
      category,
      brand,
      specs,
      description,
      price: parseFloat(price),
      discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
      passOnCashDiscount,
      images,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg border border-border">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Produto *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Notebook Dell Inspiron"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoria *</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="brand">Marca *</Label>
          <Select value={brand} onValueChange={setBrand}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma marca" />
            </SelectTrigger>
            <SelectContent>
              {availableBrands.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="specs">Especificações</Label>
          <Input
            id="specs"
            value={specs}
            onChange={(e) => setSpecs(e.target.value)}
            placeholder="Ex: Intel i7, 16GB RAM"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Preço (R$) *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="discountPrice">Preço com Desconto (R$)</Label>
          <Input
            id="discountPrice"
            type="number"
            step="0.01"
            value={discountPrice}
            onChange={(e) => setDiscountPrice(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="col-span-2">
          <div className="flex items-start space-x-3 p-4 border rounded-lg bg-muted/50">
            <Checkbox
              id="passOnCashDiscount"
              checked={passOnCashDiscount}
              onCheckedChange={(checked) => setPassOnCashDiscount(checked as boolean)}
            />
            <div className="flex-1 space-y-1">
              <Label 
                htmlFor="passOnCashDiscount" 
                className="cursor-pointer font-semibold"
              >
                Repassar 5% de desconto no preço anunciado
              </Label>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {passOnCashDiscount ? (
                  <>
                    ✅ <strong>Ativado:</strong> O preço anunciado será{" "}
                    <strong>R$ {price ? (parseFloat(price) / 0.95).toFixed(2) : "0,00"}</strong>
                    {" "}para que você receba <strong>R$ {price || "0,00"}</strong> após o desconto à vista
                  </>
                ) : (
                  <>
                    ❌ <strong>Desativado:</strong> O desconto de 5% será aplicado sobre{" "}
                    <strong>R$ {price || "0,00"}</strong>, você receberá{" "}
                    <strong>R$ {price ? (parseFloat(price) * 0.95).toFixed(2) : "0,00"}</strong> à vista
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição do produto..."
          rows={3}
        />
      </div>

      <div className="space-y-4">
        <Label>Imagens do Produto *</Label>
        <div className="flex gap-2">
          <Input
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            placeholder="Cole o link da imagem aqui"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddImage())}
          />
          <Button type="button" onClick={handleAddImage} variant="secondary">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>

        {images.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Arraste para reordenar. A primeira imagem será a principal.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((img, index) => (
                <div
                  key={index}
                  className="relative group border border-border rounded-lg overflow-hidden"
                >
                  <img
                    src={img}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    {index > 0 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="h-6 w-6"
                        onClick={() => handleMoveImage(index, index - 1)}
                      >
                        <GripVertical className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="h-6 w-6"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  {index === 0 && (
                    <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                      Principal
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {product ? "Atualizar" : "Criar"} Produto
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
