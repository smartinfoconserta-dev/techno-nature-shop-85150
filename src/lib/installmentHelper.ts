import { settingsStore } from "./settingsStore";

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
  const settings = settingsStore.getSettings();
  const rateObj = settings.installmentRates.find(r => r.installments === installments);
  const rate = rateObj?.rate || 0;
  
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
  const settings = settingsStore.getSettings();
  return settings.installmentRates
    .sort((a, b) => a.installments - b.installments)
    .map((rateObj) => calculateInstallmentPrice(desiredAmount, rateObj.installments));
}

/**
 * Calcula o valor à vista com 5% de desconto
 */
export function calculateCashDiscount(price: number): number {
  return Math.round(price * 0.95 * 100) / 100;
}
