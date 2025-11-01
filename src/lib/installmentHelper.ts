// Tabela de taxas Visa/Mastercard
const INSTALLMENT_RATES = {
  1: 2.85,
  2: 3.90,
  3: 4.90,
  4: 5.90,
  5: 6.90,
  6: 7.90,
  7: 8.90,
  8: 9.90,
  9: 9.90,
  10: 9.90,
  11: 9.90,
  12: 9.90,
} as const;

export interface InstallmentOption {
  installments: number;
  rate: number;
  totalAmount: number;        // valor total a cobrar (com taxa)
  installmentValue: number;   // valor de cada parcela
  feeAmount: number;          // quanto de taxa (em R$)
}

/**
 * Calcula o valor a cobrar considerando a taxa do cartão
 * Fórmula: valorCobrado = valorDesejado / (1 - taxa/100)
 */
export function calculateInstallmentPrice(
  desiredAmount: number,
  installments: number
): InstallmentOption {
  const rate = INSTALLMENT_RATES[installments as keyof typeof INSTALLMENT_RATES] || 0;
  const totalAmount = desiredAmount / (1 - rate / 100);
  const installmentValue = totalAmount / installments;
  const feeAmount = totalAmount - desiredAmount;
  
  return {
    installments,
    rate,
    totalAmount: Math.round(totalAmount * 100) / 100,
    installmentValue: Math.round(installmentValue * 100) / 100,
    feeAmount: Math.round(feeAmount * 100) / 100,
  };
}

/**
 * Gera todas as opções de parcelamento
 */
export function getAllInstallmentOptions(desiredAmount: number): InstallmentOption[] {
  return Object.keys(INSTALLMENT_RATES).map((installments) =>
    calculateInstallmentPrice(desiredAmount, Number(installments))
  );
}

/**
 * Calcula o valor à vista com 5% de desconto
 */
export function calculateCashDiscount(price: number): number {
  return Math.round(price * 0.95 * 100) / 100;
}
