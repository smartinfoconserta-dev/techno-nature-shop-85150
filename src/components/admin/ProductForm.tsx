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
import { X, Plus, GripVertical, Upload } from "lucide-react";
import { Product } from "@/lib/productsStore";
import { brandsStore } from "@/lib/brandsStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProductFormProps {
  product?: Product;
  onSave: (data: Omit<Product, "id" | "order" | "sold" | "expenses" | "createdAt">) => Promise<void>;
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
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    import("@/lib/categoriesStore").then(async ({ categoriesStore }) => {
      const names = await categoriesStore.getCategoryNames();
      setCategories(names);
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

  const loadBrands = async () => {
    const brands = await brandsStore.getBrandsByCategory(category);
    setAvailableBrands(brands.map((b) => b.name));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (error) {
          console.error('Upload error:', error);
          toast.error(`Erro ao fazer upload de ${file.name}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      setImages([...images, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} imagem(ns) adicionada(s)`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao fazer upload das imagens');
    } finally {
      setUploading(false);
      e.target.value = '';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !brand || !price || images.length === 0) {
      toast.error("Preencha todos os campos obrigatórios e adicione pelo menos uma imagem");
      return;
    }

    // Validar que preço com desconto é menor que preço normal
    if (discountPrice && parseFloat(discountPrice) >= parseFloat(price)) {
      toast.error("O preço com desconto (lojista) deve ser menor que o preço normal");
      return;
    }

    setSaving(true);
    try {
      await onSave({
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
    } finally {
      setSaving(false);
    }
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
          <Label htmlFor="discountPrice">Preço com Desconto (Lojista B2B) - Opcional</Label>
          <Input
            id="discountPrice"
            type="number"
            step="0.01"
            value={discountPrice}
            onChange={(e) => setDiscountPrice(e.target.value)}
            placeholder="0.00"
          />
          <p className="text-xs text-muted-foreground">
            Este é o preço exclusivo para lojistas com cupom. 
            Não inclui desconto de 5% à vista, mas permite parcelamento.
          </p>
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
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            disabled={uploading}
            className="cursor-pointer"
          />
          <Button type="button" disabled={uploading} variant="secondary" asChild>
            <label className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Enviando..." : "Adicionar Fotos"}
            </label>
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
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving || uploading}>
          {saving ? "Salvando..." : product ? "Atualizar" : "Criar"} Produto
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
