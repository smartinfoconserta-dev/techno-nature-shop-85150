import React, { useState } from 'react';
import { X, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useComparison } from '@/contexts/ComparisonContext';
import { ProductComparisonModal } from './ProductComparisonModal';
import { cn } from '@/lib/utils';

export const ComparisonBar: React.FC = () => {
  const { selectedProducts, removeProduct, clearSelection } = useComparison();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (selectedProducts.length === 0) {
    return null;
  }

  const canCompare = selectedProducts.length >= 2;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg animate-in slide-in-from-bottom duration-300">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 overflow-x-auto">
              <span className="text-sm font-medium whitespace-nowrap">
                {selectedProducts.length} selecionado{selectedProducts.length > 1 ? 's' : ''}
              </span>
              
              <div className="flex gap-2 overflow-x-auto">
                {selectedProducts.map(product => (
                  <div
                    key={product.id}
                    className="relative flex-shrink-0 group"
                  >
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded-md border border-border"
                    />
                    <button
                      onClick={() => removeProduct(product.id)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                className="whitespace-nowrap"
              >
                Limpar
              </Button>
              <Button
                size="sm"
                onClick={() => setIsModalOpen(true)}
                disabled={!canCompare}
                className={cn(
                  "whitespace-nowrap gap-2",
                  !canCompare && "opacity-50 cursor-not-allowed"
                )}
              >
                <ArrowRightLeft className="w-4 h-4" />
                Comparar
              </Button>
            </div>
          </div>

          {!canCompare && (
            <p className="text-xs text-muted-foreground mt-2">
              Selecione pelo menos 2 produtos para comparar
            </p>
          )}
        </div>
      </div>

      <ProductComparisonModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
      />
    </>
  );
};
