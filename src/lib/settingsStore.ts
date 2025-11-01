export interface TaxSettings {
  digitalTaxRate: number; // Taxa de imposto em % (ex: 6 = 6%)
  includeCashInTax: boolean; // Se true, aplica imposto sobre dinheiro físico também
}

export interface InstallmentRate {
  installments: number;
  rate: number;
}

interface Settings {
  taxSettings: TaxSettings;
  installmentRates: InstallmentRate[];
}

const STORAGE_KEY = "app_settings";

// Taxas padrão Visa/Mastercard
const DEFAULT_INSTALLMENT_RATES: InstallmentRate[] = [
  { installments: 1, rate: 2.85 },
  { installments: 2, rate: 3.90 },
  { installments: 3, rate: 4.90 },
  { installments: 4, rate: 5.90 },
  { installments: 5, rate: 6.90 },
  { installments: 6, rate: 7.90 },
  { installments: 7, rate: 8.90 },
  { installments: 8, rate: 9.90 },
  { installments: 9, rate: 9.90 },
  { installments: 10, rate: 9.90 },
  { installments: 11, rate: 9.90 },
  { installments: 12, rate: 9.90 },
];

const DEFAULT_TAX_SETTINGS: TaxSettings = {
  digitalTaxRate: 6,
  includeCashInTax: false,
};

export const settingsStore = {
  getSettings(): Settings {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const defaultSettings: Settings = {
        taxSettings: DEFAULT_TAX_SETTINGS,
        installmentRates: DEFAULT_INSTALLMENT_RATES,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSettings));
      return defaultSettings;
    }
    return JSON.parse(stored);
  },

  updateTaxSettings(digitalTaxRate: number, includeCashInTax: boolean): void {
    const settings = this.getSettings();
    settings.taxSettings = {
      digitalTaxRate,
      includeCashInTax,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  },

  updateInstallmentRates(rates: InstallmentRate[]): void {
    const settings = this.getSettings();
    settings.installmentRates = rates.sort((a, b) => a.installments - b.installments);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  },

  addInstallmentRate(installments: number, rate: number): void {
    const settings = this.getSettings();
    
    // Verifica se já existe
    const exists = settings.installmentRates.some(r => r.installments === installments);
    if (exists) {
      throw new Error("Já existe uma taxa configurada para este número de parcelas");
    }
    
    settings.installmentRates.push({ installments, rate });
    settings.installmentRates.sort((a, b) => a.installments - b.installments);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  },

  removeInstallmentRate(installments: number): void {
    if (installments <= 12) {
      throw new Error("Não é possível remover parcelas padrão (1-12x)");
    }
    
    const settings = this.getSettings();
    settings.installmentRates = settings.installmentRates.filter(
      r => r.installments !== installments
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  },

  updateSingleRate(installments: number, rate: number): void {
    const settings = this.getSettings();
    const rateObj = settings.installmentRates.find(r => r.installments === installments);
    
    if (!rateObj) {
      throw new Error("Taxa não encontrada");
    }
    
    rateObj.rate = rate;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  },
};
