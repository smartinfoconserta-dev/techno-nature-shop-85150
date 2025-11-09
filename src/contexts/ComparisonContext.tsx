import React, { createContext, useContext, useState, useCallback } from 'react';

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  images: string[];
  specs: string;
  description?: string;
}

interface ComparisonContextType {
  selectedProducts: Product[];
  addProduct: (product: Product) => void;
  removeProduct: (productId: string) => void;
  clearSelection: () => void;
  canAddMore: boolean;
  isSelected: (productId: string) => boolean;
  maxProducts: number;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error('useComparison must be used within ComparisonProvider');
  }
  return context;
};

interface ComparisonProviderProps {
  children: React.ReactNode;
  maxProducts?: number;
}

export const ComparisonProvider: React.FC<ComparisonProviderProps> = ({ 
  children, 
  maxProducts = 3 
}) => {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  const addProduct = useCallback((product: Product) => {
    setSelectedProducts(prev => {
      // Verificar se já está selecionado
      if (prev.some(p => p.id === product.id)) {
        return prev;
      }

      // Verificar limite
      if (prev.length >= maxProducts) {
        return prev;
      }

      // Verificar se é da mesma categoria (se já houver produtos)
      if (prev.length > 0 && prev[0].category !== product.category) {
        return prev;
      }

      return [...prev, product];
    });
  }, [maxProducts]);

  const removeProduct = useCallback((productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedProducts([]);
  }, []);

  const isSelected = useCallback((productId: string) => {
    return selectedProducts.some(p => p.id === productId);
  }, [selectedProducts]);

  const canAddMore = selectedProducts.length < maxProducts;

  return (
    <ComparisonContext.Provider
      value={{
        selectedProducts,
        addProduct,
        removeProduct,
        clearSelection,
        canAddMore,
        isSelected,
        maxProducts,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
};
