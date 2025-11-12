import { supabase } from "@/integrations/supabase/client";

export interface InstallmentOption {
  installments: number;
  rate: number;
  totalAmount: number;        // valor total a cobrar (com taxa)
  installmentValue: number;   // valor de cada parcela
  feeAmount: number;          // quanto de taxa (em R$)
}

interface InstallmentRate {
  installments: number;
  rate: number;
}

let cachedRates: InstallmentRate[] | null = null;
let loadingPromise: Promise<InstallmentRate[]> | null = null;

const DEFAULT_RATES: InstallmentRate[] = [
  { installments: 1, rate: 0 },
  { installments: 2, rate: 2.99 },
  { installments: 3, rate: 3.99 },
  { installments: 4, rate: 4.99 },
  { installments: 5, rate: 5.99 },
  { installments: 6, rate: 6.99 },
  { installments: 7, rate: 7.99 },
  { installments: 8, rate: 8.99 },
  { installments: 9, rate: 9.99 },
  { installments: 10, rate: 10.99 },
  { installments: 11, rate: 11.99 },
  { installments: 12, rate: 12.99 },
];

/**
 * Busca as taxas de parcelamento do edge function
 */
async function getInstallmentRates(): Promise<InstallmentRate[]> {
  if (cachedRates) {
    return cachedRates;
  }

  // Se já está carregando, reutilizar a promise
  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-installment-rates');
      
      if (error) throw error;
      
      cachedRates = data.installment_rates;
      console.log('✅ Taxas de parcelamento carregadas:', cachedRates.length);
      return cachedRates;
    } catch (error) {
      console.error('❌ Erro ao buscar taxas:', error);
      cachedRates = DEFAULT_RATES;
      return cachedRates;
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

/**
 * Pré-carrega as taxas de parcelamento no início do app
 */
export async function preloadInstallmentRates(): Promise<void> {
  if (!cachedRates) {
    await getInstallmentRates();
    console.log('✅ Taxas pré-carregadas e em cache');
  }
}

/**
 * Calcula o valor a cobrar considerando a taxa do cartão
 * Fórmula: valorCobrado = valorDesejado / (1 - taxa/100)
 */
export async function calculateInstallmentPrice(
  desiredAmount: number,
  installments: number
): Promise<InstallmentOption> {
  const rates = await getInstallmentRates();
  const rateObj = rates.find(r => r.installments === installments);
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
export async function getAllInstallmentOptions(desiredAmount: number): Promise<InstallmentOption[]> {
  const rates = await getInstallmentRates();
  const options = await Promise.all(
    rates
      .sort((a, b) => a.installments - b.installments)
      .map((rateObj) => calculateInstallmentPrice(desiredAmount, rateObj.installments))
  );
  return options;
}

/**
 * Calcula o valor à vista com 5% de desconto
 */
export function calculateCashDiscount(price: number): number {
  return Math.round(price * 0.95 * 100) / 100;
}

/**
 * Calcula o preço a ser exibido baseado se deve repassar desconto ou não
 * Se repassar: aumenta o preço para que após 5% de desconto, receba o valor desejado
 */
export function calculateDisplayPrice(
  desiredPrice: number, 
  passOnDiscount: boolean
): number {
  if (!passOnDiscount) {
    return desiredPrice;
  }
  // Fórmula: preçoAnunciado = preçoDesejado / 0.95
  return Math.round((desiredPrice / 0.95) * 100) / 100;
}

/**
 * Calcula o valor à vista considerando se o desconto foi repassado
 */
export function calculateCashPriceWithPassOn(
  displayPrice: number,
  passOnDiscount: boolean,
  desiredPrice: number
): number {
  if (passOnDiscount) {
    // Se repassou, o valor à vista é o desejado
    return desiredPrice;
  }
  // Se não repassou, aplica 5% de desconto no preço exibido
  return Math.round(displayPrice * 0.95 * 100) / 100;
}
