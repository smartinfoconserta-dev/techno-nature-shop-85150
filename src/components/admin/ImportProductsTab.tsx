import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { productsStore } from "@/lib/productsStore";

interface CSVRow {
  nome: string;
  marca: string;
  categoria: string;
  preco: string;
  imagens: string;
  specs: string;
  descricao: string;
}

const ImportProductsTab = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CSVRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ success: number; errors: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const rows: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const row: any = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });

      rows.push({
        nome: row.nome || row.name || "",
        marca: row.marca || row.brand || "",
        categoria: row.categoria || row.category || "Notebooks",
        preco: row.preco || row.price || row.preço || "0",
        imagens: row.imagens || row.images || "",
        specs: row.specs || row.especificacoes || row.especificações || "",
        descricao: row.descricao || row.description || row.descrição || "",
      });
    }

    return rows.filter((r) => r.nome && r.marca && r.preco);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Por favor, selecione um arquivo CSV válido");
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      setPreview(parsed);
      
      if (parsed.length === 0) {
        toast.error("Nenhum produto válido encontrado no CSV");
      } else {
        toast.success(`${parsed.length} produto(s) encontrado(s) no arquivo`);
      }
    };

    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (preview.length === 0) {
      toast.error("Nenhum produto para importar");
      return;
    }

    setImporting(true);
    setProgress(0);
    setResult(null);

    let success = 0;
    let errors = 0;

    for (let i = 0; i < preview.length; i++) {
      const row = preview[i];
      
      try {
        const images = row.imagens
          .split("|")
          .map((url) => url.trim())
          .filter((url) => url);

        await productsStore.addProduct({
          name: row.nome,
          brand: row.marca,
          category: row.categoria,
          price: parseFloat(row.preco.replace(",", ".")),
          images: images.length > 0 ? images : ["/placeholder.svg"],
          specs: row.specs,
          description: row.descricao,
        });

        success++;
      } catch (error) {
        console.error(`Erro ao importar produto ${row.nome}:`, error);
        errors++;
      }

      setProgress(Math.round(((i + 1) / preview.length) * 100));
      
      // Rate limit: 100ms entre cada produto
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    setImporting(false);
    setResult({ success, errors });

    if (errors === 0) {
      toast.success(`${success} produto(s) importado(s) com sucesso!`);
    } else {
      toast.error(`${success} importados, ${errors} com erro`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview([]);
    setProgress(0);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Importar Produtos via CSV</h2>
        <p className="text-sm text-muted-foreground">
          Faça upload de um arquivo CSV com seus produtos. Formato esperado:
        </p>
        <code className="text-xs bg-muted px-2 py-1 rounded mt-2 inline-block">
          nome,marca,categoria,preco,imagens,specs,descricao
        </code>
        <p className="text-xs text-muted-foreground mt-1">
          Imagens: use URLs separadas por "|". Exemplo: https://exemplo.com/img1.jpg|https://exemplo.com/img2.jpg
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="csv-file">Arquivo CSV</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="csv-file"
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={importing}
                className="cursor-pointer"
              />
              <Button
                type="button"
                variant="secondary"
                disabled={importing}
                asChild
              >
                <label htmlFor="csv-file" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar
                </label>
              </Button>
            </div>
          </div>

          {preview.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">{file?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {preview.length} produto(s) para importar
                  </p>
                </div>
              </div>

              {importing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Importando produtos...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              {result && (
                <div className="space-y-2">
                  {result.success > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm">{result.success} produto(s) importado(s)</span>
                    </div>
                  )}
                  {result.errors > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">{result.errors} erro(s) durante importação</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleImport}
                  disabled={importing}
                  className="flex-1"
                >
                  {importing ? "Importando..." : "Iniciar Importação"}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  disabled={importing}
                >
                  Limpar
                </Button>
              </div>

              <div className="max-h-64 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">Nome</th>
                      <th className="px-3 py-2 text-left">Marca</th>
                      <th className="px-3 py-2 text-left">Categoria</th>
                      <th className="px-3 py-2 text-left">Preço</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-3 py-2">{row.nome}</td>
                        <td className="px-3 py-2">{row.marca}</td>
                        <td className="px-3 py-2">{row.categoria}</td>
                        <td className="px-3 py-2">R$ {row.preco}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ImportProductsTab;
