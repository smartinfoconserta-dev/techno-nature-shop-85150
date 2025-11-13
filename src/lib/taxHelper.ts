import { settingsStore } from "./settingsStore";

export interface TaxCalculationInput {
  cash: number;
  pix: number;
  card: number;
}

export interface TaxCalculationResult {
  taxableAmount: number;
  taxAmount: number;
  taxRate: number;
  appliedToCash: boolean;
}

export async function calculateTax(breakdown: TaxCalculationInput): Promise<TaxCalculationResult> {
  const settings = await settingsStore.getSettings();
  
  const digital = breakdown.pix + breakdown.card;
  const taxableAmount = settings.includeCashInTax 
    ? breakdown.cash + digital 
    : digital;
  
  const taxAmount = taxableAmount * (settings.digitalTaxRate / 100);
  
  return {
    taxableAmount,
    taxAmount,
    taxRate: settings.digitalTaxRate,
    appliedToCash: settings.includeCashInTax,
  };
}

// Versão síncrona para uso em cálculos locais (usa valores padrão)
export function calculateTaxSync(
  breakdown: TaxCalculationInput,
  taxRate: number = 3.9,
  includeCash: boolean = false
): TaxCalculationResult {
  const digital = breakdown.pix + breakdown.card;
  const taxableAmount = includeCash 
    ? breakdown.cash + digital 
    : digital;
  
  const taxAmount = taxableAmount * (taxRate / 100);
  
  return {
    taxableAmount,
    taxAmount,
    taxRate,
    appliedToCash: includeCash,
  };
}
