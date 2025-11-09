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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ComparisonRadarChart } from './ComparisonRadarChart';

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

  // Preparar dados para o gráfico radar
  const prepareRadarData = () => {
    if (!result) return [];
    
    return [
      { 
        metric: 'Custo-benefício',
        ...Object.fromEntries(
          selectedProducts.map(p => [p.id, result.scores[p.id]?.costBenefit || 0])
        )
      },
      { 
        metric: 'Performance',
        ...Object.fromEntries(
          selectedProducts.map(p => [p.id, result.scores[p.id]?.performance || 0])
        )
      },
      { 
        metric: 'Qualidade',
        ...Object.fromEntries(
          selectedProducts.map(p => [p.id, result.scores[p.id]?.quality || 0])
        )
      },
      { 
        metric: 'Recursos',
        ...Object.fromEntries(
          selectedProducts.map(p => [p.id, result.scores[p.id]?.features || 0])
        )
      },
    ];
  };

  const productColors = [
    'hsl(var(--primary))',
    'hsl(var(--secondary))',
    'hsl(var(--accent))'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-2xl">Comparação Inteligente</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="p-6">
            {error && (
              <Alert variant="destructive" className="mb-6">
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

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">📊 Visão Geral</TabsTrigger>
                <TabsTrigger value="scores">📈 Pontuações</TabsTrigger>
                <TabsTrigger value="analysis">🤖 Análise IA</TabsTrigger>
              </TabsList>

              {/* ABA 1: Visão Geral */}
              <TabsContent value="overview" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedProducts.map(product => {
                    const scores = getProductScores(product.id);
                    const isBest = result?.recommendation.best === product.id;

                    return (
                      <Card 
                        key={product.id}
                        className={`relative hover:shadow-lg transition-shadow ${isBest ? 'border-primary ring-2 ring-primary/20' : ''}`}
                      >
                        {isBest && (
                          <Badge className="absolute top-2 right-2 z-10">
                            <Trophy className="w-3 h-3 mr-1" />
                            Melhor
                          </Badge>
                        )}

                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />

                        <CardContent className="p-4">
                          <h3 className="font-semibold text-lg">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">{product.brand}</p>
                          <p className="text-2xl font-bold text-primary mt-2">
                            R$ {product.price.toFixed(2)}
                          </p>

                          {loading ? (
                            <div className="mt-4">
                              <Skeleton className="h-16 w-16 rounded-full mx-auto" />
                              <Skeleton className="h-4 w-20 mx-auto mt-2" />
                            </div>
                          ) : scores ? (
                            <>
                              <div className="mt-4 flex flex-col items-center">
                                <div className="relative w-20 h-20">
                                  <svg className="w-20 h-20 transform -rotate-90">
                                    <circle
                                      cx="40"
                                      cy="40"
                                      r="36"
                                      stroke="hsl(var(--muted))"
                                      strokeWidth="8"
                                      fill="none"
                                    />
                                    <circle
                                      cx="40"
                                      cy="40"
                                      r="36"
                                      stroke="hsl(var(--primary))"
                                      strokeWidth="8"
                                      fill="none"
                                      strokeDasharray={`${(scores.overall / 10) * 226} 226`}
                                      className="transition-all duration-1000"
                                    />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xl font-bold">{scores.overall.toFixed(1)}</span>
                                  </div>
                                </div>
                                <p className="text-center text-sm font-medium mt-2">Score Geral</p>
                              </div>

                              <div className="flex flex-wrap gap-2 mt-4">
                                {scores.costBenefit > 8 && (
                                  <Badge variant="secondary" className="text-xs">
                                    💰 Ótimo custo
                                  </Badge>
                                )}
                                {scores.performance > 8 && (
                                  <Badge variant="secondary" className="text-xs">
                                    ⚡ Alta performance
                                  </Badge>
                                )}
                                {scores.quality > 8 && (
                                  <Badge variant="secondary" className="text-xs">
                                    ✨ Premium
                                  </Badge>
                                )}
                              </div>
                            </>
                          ) : null}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              {/* ABA 2: Pontuações */}
              <TabsContent value="scores" className="mt-6 space-y-6">
                {result && !loading && (
                  <>
                    {/* Gráfico Radar - Desktop */}
                    <Card className="hidden md:block">
                      <CardHeader>
                        <CardTitle>Comparação Visual</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ComparisonRadarChart
                          data={prepareRadarData()}
                          products={selectedProducts.map((p, i) => ({
                            id: p.id,
                            name: p.name,
                            color: productColors[i] || productColors[0]
                          }))}
                        />
                      </CardContent>
                    </Card>

                    {/* Accordion com detalhes por produto */}
                    <Accordion type="single" collapsible className="space-y-4">
                      {selectedProducts.map(product => {
                        const scores = getProductScores(product.id);
                        const isBest = result?.recommendation.best === product.id;

                        return (
                          <AccordionItem 
                            key={product.id} 
                            value={product.id}
                            className="border rounded-lg px-4"
                          >
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center gap-3 w-full">
                                <img 
                                  src={product.images[0]} 
                                  alt={product.name}
                                  className="w-12 h-12 rounded object-cover"
                                />
                                <div className="flex-1 text-left">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold">{product.name}</p>
                                    {isBest && (
                                      <Badge variant="default" className="text-xs">
                                        <Trophy className="w-3 h-3 mr-1" />
                                        Melhor
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Score: {scores?.overall.toFixed(1)}/10
                                  </p>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              {scores && (
                                <div className="space-y-3 pt-4">
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
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </>
                )}

                {loading && (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Skeleton className="w-12 h-12 rounded" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ABA 3: Análise IA */}
              <TabsContent value="analysis" className="mt-6 space-y-6">
                {result && !loading && (
                  <>
                    {/* Card de Recomendação */}
                    <Card className="border-primary bg-gradient-to-br from-primary/5 to-primary/10">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-primary" />
                          Nossa Recomendação
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const bestProduct = selectedProducts.find(p => p.id === result.recommendation.best);
                          if (!bestProduct) return null;

                          return (
                            <>
                              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                                <img 
                                  src={bestProduct.images[0]} 
                                  alt={bestProduct.name}
                                  className="w-24 h-24 rounded-lg object-cover"
                                />
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold">{bestProduct.name}</h3>
                                  <p className="text-sm text-muted-foreground">{bestProduct.brand}</p>
                                  <p className="text-2xl font-bold text-primary mt-2">
                                    R$ {bestProduct.price.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                              
                              {result.recommendation.reason && (
                                <>
                                  <Separator className="my-4" />
                                  <div>
                                    <p className="font-semibold mb-2">Por que escolher este?</p>
                                    <p className="text-sm leading-relaxed">
                                      {result.recommendation.reason}
                                    </p>
                                  </div>
                                </>
                              )}
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>

                    {/* Análise Detalhada */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5" />
                          Análise Detalhada
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-sm max-w-none">
                          {result.analysis.split('\n\n').map((paragraph, i) => (
                            <p key={i} className="mb-3 text-foreground leading-relaxed">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Alternativas */}
                    {result.recommendation.alternatives && Object.keys(result.recommendation.alternatives).length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3 text-lg">Outras Opções</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(result.recommendation.alternatives).map(([id, reason]) => {
                            const product = selectedProducts.find(p => p.id === id);
                            return product ? (
                              <Card key={id}>
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-3 mb-2">
                                    <img 
                                      src={product.images[0]} 
                                      alt={product.name}
                                      className="w-12 h-12 rounded object-cover"
                                    />
                                    <div className="flex-1">
                                      <p className="font-semibold text-sm">{product.name}</p>
                                      <p className="text-xs text-muted-foreground">{product.brand}</p>
                                    </div>
                                  </div>
                                  <p className="text-xs leading-relaxed text-muted-foreground">
                                    {reason}
                                  </p>
                                </CardContent>
                              </Card>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {loading && (
                  <div className="space-y-4">
                    <Card>
                      <CardContent className="p-6">
                        <Skeleton className="h-32 w-full" />
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <Skeleton className="h-64 w-full" />
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
