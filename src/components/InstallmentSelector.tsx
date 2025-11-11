import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Banknote } from "lucide-react";
import { getAllInstallmentOptions, calculateCashDiscount, InstallmentOption } from "@/lib/installmentHelper";
import { cn } from "@/lib/utils";

interface InstallmentSelectorProps {
  basePrice: number;
  hasCouponActive?: boolean;
  onSelect?: (option: { type: 'cash' | 'installment', data?: InstallmentOption, cashValue?: number } | null) => void;
}

const InstallmentSelector = ({ basePrice, hasCouponActive, onSelect }: InstallmentSelectorProps) => {
  const [selectedValue, setSelectedValue] = useState<string>("");
  
  // Resetar seleção se estava em "cash" e cupom foi ativado
  useEffect(() => {
    if (hasCouponActive && selectedValue === "cash") {
      setSelectedValue("");
      onSelect?.(null);
    }
  }, [hasCouponActive, selectedValue, onSelect]);
  
  const installmentOptions = getAllInstallmentOptions(basePrice);
  const cashValue = calculateCashDiscount(basePrice);

  const handleValueChange = (value: string) => {
    setSelectedValue(value);
    
    if (value === "cash") {
      onSelect?.({ type: 'cash', cashValue });
    } else if (value === "none") {
      onSelect?.(null);
    } else {
      const installments = parseInt(value);
      const option = installmentOptions.find(opt => opt.installments === installments);
      if (option) {
        onSelect?.({ type: 'installment', data: option });
      }
    }
  };

  const renderSelectedDetails = () => {
    if (selectedValue === "cash") {
      const savings = basePrice - cashValue;
      return (
        <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 mb-2">
            <Banknote className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">Pagamento à vista</span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            R$ {cashValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            ✅ Economize R$ {savings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (5%)
          </p>
        </div>
      );
    }

    if (selectedValue && selectedValue !== "none") {
      const installments = parseInt(selectedValue);
      const option = installmentOptions.find(opt => opt.installments === installments);
      
      if (option) {
        return (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Parcelamento no cartão</span>
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {option.installments}x de R$ {option.installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Total: R$ {option.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">
              Taxa repassada: R$ {option.feeAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({option.rate}%)
            </p>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">💳 Visa</Badge>
              <Badge variant="secondary" className="text-xs">💳 Mastercard</Badge>
            </div>
          </div>
        );
      }
    }

    return null;
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Formas de Pagamento</label>
      <Select value={selectedValue} onValueChange={handleValueChange}>
        <SelectTrigger 
          className={cn(
            selectedValue && selectedValue !== "none" 
              ? "border-primary ring-2 ring-primary/20" 
              : ""
          )}
        >
          <SelectValue placeholder="Selecione a forma de pagamento" />
        </SelectTrigger>
        <SelectContent className="scrollbar-hide">
          <SelectItem value="none">Ver preço original</SelectItem>
          {!hasCouponActive && (
            <SelectItem 
              value="cash"
              className={cn(
                selectedValue === "cash" && "bg-green-100 dark:bg-green-950 font-semibold"
              )}
            >
              💵 À vista (5% desconto)
            </SelectItem>
          )}
          {installmentOptions.length > 0 && installmentOptions.map((option) => (
            <SelectItem 
              key={option.installments} 
              value={option.installments.toString()}
              className={cn(
                selectedValue === option.installments.toString() && 
                "bg-blue-100 dark:bg-blue-950 font-semibold"
              )}
            >
              💳 {option.installments}x no cartão (Visa/Master)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {renderSelectedDetails()}
    </div>
  );
};

export default InstallmentSelector;
