import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useComparison } from '@/contexts/ComparisonContext';
import { ScoreBar } from './ScoreBar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, 
  Zap, 
  Trophy, 
  Sparkles, 
  BarChart3,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProductScores {
  costBenefit: number;
  performance: number;
  quality: number;
  features: number;
  overall: number;
}

interface ComparisonResult {
  scores: Record<string, ProductScores>;
  analysis: string;
  recommendation: {
    best: string;
    reason: string;
    alternatives?: Record<string, string>;
  };
}

interface ProductComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProductComparisonModal: React.FC<ProductComparisonModalProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const { selectedProducts } = useComparison();
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && selectedProducts.length >= 2) {
      fetchComparison();
    }
  }, [open, selectedProducts]);

  const fetchComparison = async () => {
    setLoading(true);
    setError(null);

    // Verificar cache
    const cacheKey = `comparison_${selectedProducts.map(p => p.id).sort().join('_')}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      try {
        const parsedCache = JSON.parse(cached);
        // Cache válido por 24h
        if (Date.now() - parsedCache.timestamp < 24 * 60 * 60 * 1000) {
          setResult(parsedCache.data);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('Cache inválido:', e);
      }
    }

    try {
      const { data, error: funcError } = await supabase.functions.invoke('compare-products', {
        body: { 
          products: selectedProducts.map(p => ({
            id: p.id,
            name: p.name,
            brand: p.brand,
            price: p.price,
            specs: p.specs,
            description: p.description || ''
          }))
        }
      });

      if (funcError) throw funcError;
      
      setResult(data);
      
      // Salvar no cache
      localStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (err: any) {
      console.error('Erro ao comparar produtos:', err);
      setError(err.message || 'Erro ao analisar produtos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getProductScores = (productId: string): ProductScores | null => {
    return result?.scores[productId] || null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-2xl">Comparação Inteligente</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="p-6 space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{error}</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={fetchComparison}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Tentar Novamente
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Grid de produtos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedProducts.map(product => {
                const scores = getProductScores(product.id);
                const isBest = result?.recommendation.best === product.id;

                return (
                  <div 
                    key={product.id}
                    className={`border rounded-lg p-4 space-y-4 ${isBest ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}
                  >
                    {isBest && (
                      <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                        <Trophy className="w-4 h-4" />
                        Melhor Escolha
                      </div>
                    )}

                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-40 object-cover rounded-md"
                    />

                    <div>
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.brand}</p>
                      <p className="text-xl font-bold text-primary mt-2">
                        R$ {product.price.toFixed(2)}
                      </p>
                    </div>

                    {loading ? (
                      <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="space-y-1">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-2 w-full" />
                          </div>
                        ))}
                      </div>
                    ) : scores ? (
                      <div className="space-y-3">
                        <ScoreBar
                          score={scores.costBenefit}
                          label="Custo-benefício"
                          icon={<DollarSign className="w-4 h-4" />}
                          color="success"
                        />
                        <ScoreBar
                          score={scores.performance}
                          label="Performance"
                          icon={<Zap className="w-4 h-4" />}
                          color="primary"
                        />
                        <ScoreBar
                          score={scores.quality}
                          label="Qualidade"
                          icon={<Trophy className="w-4 h-4" />}
                          color="secondary"
                        />
                        <ScoreBar
                          score={scores.features}
                          label="Recursos"
                          icon={<Sparkles className="w-4 h-4" />}
                          color="warning"
                        />
                        <ScoreBar
                          score={scores.overall}
                          label="Avaliação Geral"
                          icon={<BarChart3 className="w-4 h-4" />}
                          color="accent"
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Análise da IA */}
            {result && !loading && (
              <div className="border border-primary/20 rounded-lg p-6 bg-primary/5">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Análise Inteligente
                </h3>
                
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-line text-foreground">{result.analysis}</p>
                  
                  {result.recommendation.reason && (
                    <div className="mt-4 p-4 bg-background rounded-md">
                      <p className="font-semibold text-primary">Por que escolher o melhor?</p>
                      <p className="text-foreground">{result.recommendation.reason}</p>
                    </div>
                  )}

                  {result.recommendation.alternatives && Object.keys(result.recommendation.alternatives).length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="font-semibold">Alternativas:</p>
                      {Object.entries(result.recommendation.alternatives).map(([id, reason]) => {
                        const product = selectedProducts.find(p => p.id === id);
                        return product ? (
                          <div key={id} className="p-3 bg-background rounded-md">
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{reason}</p>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
